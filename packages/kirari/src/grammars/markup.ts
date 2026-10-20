import { appendToken, cloneContext, scan, tokenize } from '../tokenize.js'
import type { Frame, ScanContext } from '../tokenize.js'
import { isSignificant } from '../types.js'
import type { Language, Token } from '../types.js'
import type { ResumePoint } from '../resumable.js'

type Code = {
  kind: 'code'
  scanner: ReturnType<typeof scan>
  container: boolean
  braces: number
  resume: number | undefined
  previous: Token | undefined
}
type Markup = {
  kind: 'markup'
  bounded: boolean
  depth: number
  phase: 'tag' | 'text'
  closing: boolean
  name: string
  value: boolean
  attribute: string
  language: string
  rawEnd: number | undefined
  sibling?: { start: number; tokens: number; openings: { name: string; start: number }[] }
}

/** Where a JSX scan starts, and where to report root-level newlines it can resume from. */
interface MarkupResume {
  readonly from?: ResumePoint | undefined
  readonly checkpoint?: ((point: ResumePoint, index: number) => void) | undefined
}

export const markup = (source: string, code?: Language, embedded?: Readonly<Record<string, Language>>, template?: 'vue' | 'svelte', resume?: MarkupResume): Token[] => {
  const tokens: Token[] = []
  const name = /[$_\p{ID_Start}][\p{ID_Continue}.$:-]*/uy
  const attribute = /[^\s"'<>/={}]+/y
  const entity = /&(?:#x[\da-f]+|#\d+|[a-z][\da-z]*);/iy
  const whitespace = /\s+/y
  let position = resume?.from?.offset ?? 0
  const createMarkup = (bounded: boolean): Markup => ({ kind: 'markup', bounded, depth: 0, phase: 'text', closing: false, name: '', value: false, attribute: '', language: '', rawEnd: undefined })
  const expressionLanguage = code ?? embedded?.['script:ts'] ?? embedded?.script
  const typed = code?.name === 'tsx'
  // Expression scanners use the same source offsets; failed lookahead remains reusable.
  const failedRegexStates = new Set<number>()
  const lookupCache = {}
  const failedSiblingStarts = new Set<number>()
  const createCode = (container: boolean, previous?: Token, frames?: Frame[], context?: ScanContext): Code => ({ kind: 'code', scanner: scan(source, expressionLanguage!, position, previous, failedRegexStates, frames, context, true, lookupCache), container, braces: 0, resume: undefined, previous })
  // Root script state, read at newlines outside elements to report resume points.
  const rootFrames: Frame[] = []
  const rootContext = resume?.from?.context ? cloneContext(resume.from.context) : { parentheses: [] }
  const points: { point: ResumePoint; index: number }[] = []
  // Rejected tags may become valid once more source arrives, so later resume points are dropped.
  let rewound = source.length
  const stack: (Code | Markup)[] = [code ? createCode(false, resume?.from?.previous, rootFrames, rootContext) : createMarkup(false)]

  const rejectSibling = (context: Markup): void => {
    const sibling = context.sibling!
    rewound = Math.min(rewound, sibling.start)
    failedSiblingStarts.add(sibling.start)
    for (const opening of sibling.openings) failedSiblingStarts.add(opening.start)
    tokens.length = sibling.tokens
    position = sibling.start
    stack.length = stack.indexOf(context)
    const parent = stack[stack.length - 1] as Code
    parent.resume = position
  }

  const append = (token: Token): void => {
    appendToken(tokens, token)
    position = token.end
  }
  const emit = (type: string, end: number): void => {
    if (end > position) append({ type, value: source.slice(position, end), start: position, end })
  }
  const match = (pattern: RegExp): string | undefined => {
    pattern.lastIndex = position
    const result = pattern.exec(source)
    return result?.index === position ? result[0] : undefined
  }
  const until = (delimiter: string, from: number): number => {
    const end = source.indexOf(delimiter, from)
    return end < 0 ? source.length : end + delimiter.length
  }
  const closingTagStart = (name: string): number => {
    const closing = new RegExp(`</${name}\\s*>`, 'ig')
    closing.lastIndex = position
    return closing.exec(source)?.index ?? source.length
  }
  const appendCode = (end: number, language: Language): void => {
    const offset = position
    for (const token of tokenize(source.slice(position, end), language)) {
      append({ ...token, start: token.start + offset, end: token.end + offset })
    }
  }
  const expression = (): void => {
    emit('punctuation', position + (template === 'vue' ? 2 : 1))
    if (template === 'svelte') {
      const marker = match(/[#:/@](?:if|else|each|await|then|catch|key|snippet|html|debug|const|render)\b/y)
      if (marker) emit('keyword', position + marker.length)
    }
    stack.push(createCode(true))
  }
  const finishTag = (context: Markup, selfClosing: boolean): void => {
    if (selfClosing && !context.closing) context.sibling?.openings.pop()
    if (context.closing) context.depth--
    else if (!selfClosing) context.depth++
    context.phase = 'text'
    context.value = false
    if (context.bounded && context.depth === 0) {
      stack.pop()
      const parent = stack[stack.length - 1] as Code
      parent.resume = position
      parent.previous = { type: 'tag', value: 'element', start: position, end: position }
    } else if (embedded && !context.closing && !selfClosing && /^(script|style|textarea|title)$/i.test(context.name)) {
      const end = closingTagStart(context.name)
      const key = context.name.toLowerCase() + (template && context.language ? `:${context.language}` : '')
      const language = Object.hasOwn(embedded, key) ? embedded[key] : undefined
      if (template && /^(title|textarea)$/i.test(context.name)) context.rawEnd = end
      else if (language) appendCode(end, language)
      else emit('text', end)
    }
  }

  // Scans TSX type arguments such as `<Select<Item>`, splitting `>>` where the generic closes.
  const typeArguments = (): void => {
    let depth = 1
    emit('operator', position + 1)
    for (const token of scan(source, code!, position, undefined, undefined, undefined, { parentheses: [], annotation: true }, true, lookupCache)) {
      if (token.type === 'operator' && token.value === '<') depth++
      const closing = token.type === 'operator' && /^>+/.exec(token.value)
      if (closing) {
        const count = Math.min(depth, closing[0].length)
        append({ ...token, value: token.value.slice(0, count), end: token.start + count })
        depth -= count
        if (depth === 0) break
        if (count < token.value.length) append({ ...token, value: token.value.slice(count), start: token.start + count })
      } else append(token)
    }
  }
  // End of a `<!…>` declaration, skipping quoted strings and an internal `[…]` subset.
  const declarationEnd = (): number => {
    let end = position + 2
    let brackets = 0
    while (end < source.length) {
      const char = source[end++]
      if (char === '"' || char === "'") end = until(char, end)
      else if (char === '[') brackets++
      else if (char === ']') brackets--
      else if (char === '>' && brackets <= 0) break
    }
    return end
  }

  // Advances one token inside a script expression; returns false once the scanner is exhausted.
  const stepCode = (context: Code): boolean => {
    const next = context.scanner.next(context.resume)
    context.resume = undefined
    if (next.done) return false
    const token = next.value
    if (resume?.checkpoint && stack.length === 1 && token.type === 'text' && /[\r\n\u2028\u2029]/.test(token.value) && token.end < source.length && !rootFrames.length && rootContext.functionPending === undefined) {
      const last = tokens[tokens.length - 1]
      const merged = last?.type === 'text'
      points.push({ point: { offset: merged ? last.start : token.start, previous: context.previous, context: cloneContext(rootContext) }, index: merged ? tokens.length - 1 : tokens.length })
    }
    const sibling = context.previous?.type === 'tag' && !failedSiblingStarts.has(token.start)
    if (!template && token.value === '<' && (canStartElement(context.previous) || sibling)) {
      const tag = looksLikeTag(source, token.start, typed)
      if (tag === undefined) rewound = Math.min(rewound, token.start)
      if (tag) {
        position = token.start
        const element = createMarkup(true)
        // Accept adjacent JSX snippets only when the element closes; otherwise keep comparison operators.
        if (sibling) element.sibling = { start: position, tokens: tokens.length, openings: [] }
        stack.push(element)
        return true
      }
    }
    if (context.container && token.type === 'punctuation') {
      if (token.value === '}' && context.braces === 0 && (template !== 'vue' || source[token.end] === '}')) {
        append(token)
        if (template === 'vue') emit('punctuation', position + 1)
        stack.pop()
        return true
      }
      if (token.value === '{' || token.value === '${') context.braces++
      if (token.value === '}') context.braces--
    }
    append(token)
    if (isSignificant(token.type)) context.previous = token
    return true
  }

  // Advances inside an open tag: attributes, values, embedded expressions, and the closing `>`.
  const stepTag = (context: Markup): void => {
    const space = match(whitespace)
    if (space) { emit('text', position + space.length); return }
    if (source.startsWith('/>', position) || source.startsWith('?>', position)) {
      emit('punctuation', position + 2)
      finishTag(context, true)
    } else if (source[position] === '>') {
      emit('punctuation', position + 1)
      finishTag(context, false)
    } else if (source[position] === '"' || source[position] === "'") {
      const quote = source[position]!
      const end = until(quote, position + 1)
      const contentEnd = source[end - 1] === quote && end > position + 1 ? end - 1 : end
      if (context.value && context.attribute.toLowerCase() === 'lang') context.language = source.slice(position + 1, contentEnd).toLowerCase()
      if (template === 'vue' && context.value && /^(?:v-|[:@#])/.test(context.attribute)) {
        emit('string', position + 1)
        appendCode(contentEnd, expressionLanguage!)
        emit('string', end)
      } else emit('string', end)
      context.value = false
    } else if (source[position] === '=') {
      emit('operator', position + 1)
      context.value = true
    } else if ((code || template === 'svelte') && source[position] === '{') {
      context.value = false
      expression()
    } else {
      const value = match(attribute)
      if (value && context.value && context.attribute.toLowerCase() === 'lang') context.language = value.toLowerCase()
      if (value && !context.value) context.attribute = value
      emit(value ? (context.value ? 'string' : 'attribute') : 'text', position + (value?.length ?? 1))
      context.value = false
    }
  }

  // Advances through element content: text, entities, comments, nested tags, and expressions.
  const stepContent = (context: Markup): void => {
    if (context.rawEnd !== undefined && position > context.rawEnd) context.rawEnd = closingTagStart(context.name)
    if (position === context.rawEnd) context.rawEnd = undefined
    if (context.rawEnd !== undefined) {
      if (template === 'svelte' && source[position] === '{' || template === 'vue' && source.startsWith('{{', position)) expression()
      else {
        let end = position + 1
        while (end < context.rawEnd && source[end] !== '{') end++
        emit('text', end)
      }
    } else if (source.startsWith('<!--', position)) {
      emit('comment', until('-->', position + 4))
    } else if (source.startsWith('<![CDATA[', position)) {
      emit('string', until(']]>', position + 9))
    } else if (source.startsWith('<?', position)) {
      emit('keyword', until('?>', position + 2))
    } else if (source.startsWith('<!', position)) {
      emit('keyword', declarationEnd())
    } else if (source[position] === '<' && looksLikeTag(source, position, typed)) {
      const start = position
      context.closing = source[position + 1] === '/'
      emit('punctuation', position + (context.closing ? 2 : 1))
      const value = match(name)
      context.name = value ?? ''
      if (context.sibling) {
        if (context.closing) {
          if (context.sibling.openings.at(-1)?.name !== context.name) { rejectSibling(context); return }
          context.sibling.openings.pop()
        } else context.sibling.openings.push({ name: context.name, start })
      }
      context.attribute = ''
      context.language = ''
      if (value) emit('tag', position + value.length)
      if (typed && !context.closing && source[position] === '<') typeArguments()
      context.phase = 'tag'
    } else if ((code || template === 'svelte') && source[position] === '{' || template === 'vue' && source.startsWith('{{', position)) {
      expression()
    } else {
      const value = match(entity)
      if (value) emit('entity', position + value.length)
      else {
        let end = position + 1
        while (end < source.length && !/[<&]/.test(source[end]!) && !((code || template) && source[end] === '{')) end++
        emit('text', end)
      }
    }
  }

  while (stack.length) {
    if (position >= source.length) {
      const pending = [...stack].reverse().find((context): context is Markup => context.kind === 'markup' && !!context.sibling)
      if (!pending) break
      rejectSibling(pending)
    }
    const context = stack[stack.length - 1]!
    if (context.kind === 'code') {
      if (!stepCode(context)) break
    } else if (context.phase === 'tag') stepTag(context)
    else stepContent(context)
  }
  for (const { point, index } of points) if (point.offset < rewound) resume!.checkpoint!(point, index)
  return tokens
}

const looksLikeTag = (source: string, start: number, typed = false): boolean | undefined => {
  if (source.startsWith('<>', start) || source.startsWith('</>', start)) return true
  const head = /^<\/?[$_\p{ID_Start}][\p{ID_Continue}.$:-]*/u.exec(source.slice(start))
  if (!head) return false
  const rest = source.slice(start + head[0].length)
  const constraint = /^\s+extends\b/.exec(rest)
  // An EOF word boundary can disappear when the next chunk extends the identifier.
  if (constraint) return constraint[0].length === rest.length ? undefined : false
  return /^[\s/>]|^$/.test(rest) || typed && rest.startsWith('<')
}

const canStartElement = (previous?: Token): boolean => {
  if (!previous) return true
  if (previous.type === 'property') return false
  if (previous.type === 'operator') return !['++', '--', '.', '?.'].includes(previous.value)
  return /^(?:return|yield|case|=>|\$\{|[([{,:;])$/.test(previous.value)
}
