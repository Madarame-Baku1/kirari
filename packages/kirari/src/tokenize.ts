import type { Language, Token } from './types.js'
import { createFunctionLookup } from './grammars/functions.js'
import { classifyDefinitions } from './grammars/definitions.js'

export type Frame = { kind: 'template'; opening: boolean } | { kind: 'expression'; depth: number }
export interface ScanContext {
  parentheses: { control: boolean; braces: number }[]
  braces?: number
  afterControl?: boolean
  forAwait?: boolean
  declaration?: string
  annotation?: boolean
  ternaries?: number
  functionPending?: boolean
  functionName?: boolean
  classBody?: boolean
  scopes?: boolean[]
}

const sticky = (pattern: RegExp): RegExp => {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, '') + 'y')
}

export const tokenize = (source: string, language: Language): Token[] => {
  if (language.tokenize) return classifyDefinitions(language.tokenize(source, language), language.name)
  const tokens: Token[] = []
  for (const token of scan(source, language)) {
    const last = tokens[tokens.length - 1]
    if (token.type === 'text' && last?.type === 'text') {
      tokens[tokens.length - 1] = { ...last, value: last.value + token.value, end: token.end }
    } else tokens.push(token)
  }
  return classifyDefinitions(tokens, language.name)
}

// biome-ignore lint/plugin: generators have no arrow form.
export function* scan(source: string, language: Language, start = 0, previous?: Token, failedRegexStates = new Set<number>(), frames: Frame[] = [], context: ScanContext = { parentheses: [] }, functions = true): Generator<Token, void, number | undefined> {
  const rules = language.rules.map(rule => ({ type: rule.type, pattern: sticky(rule.pattern) }))
  const identifier = language.identifier && sticky(language.identifier)
  const keywords = new Set(language.keywords)
  const types = new Set(language.types)
  const booleans = new Set(language.booleans)
  const nulls = new Set(language.nulls)
  const script = language.regexLiterals && language.templates
  const unicodeEscape = /\\u(?:([\da-fA-F]{4})|\{([\da-fA-F]{1,6})\})/y
  const continuation = /[$\u200c\u200d\p{ID_Continue}]+/uy
  const typed = language.name === 'typescript' || language.name === 'tsx'
  const lookup = functions && script ? createFunctionLookup(source, typed, offset => scan(source, language, offset, undefined, failedRegexStates, [], { parentheses: [] }, false)) : undefined
  delete context.functionPending
  let pending: Token[] = []
  let position = start

  const emit = (type: string, end: number): void => {
    const token = { type, value: source.slice(position, end), start: position, end }
    const frame = frames[frames.length - 1]
    if (type === 'punctuation' && frame?.kind === 'expression') {
      if (token.value === '{') frame.depth++
      if (token.value === '}') {
        if (frame.depth === 0) frames.pop()
        else frame.depth--
      }
    }
    pending.push(token)
    if (type !== 'text' && type !== 'comment') {
      if (typed) {
        const value = token.value
        // shortcut: these are lexical type positions, not binding or scope resolution.
        if (type === 'keyword' && /^(const|let|var|type)$/.test(value)) context.declaration = value === 'type' ? 'alias' : 'variable'
        if (value === '?' && !/^\s*:/.test(source.slice(end))) context.ternaries = (context.ternaries ?? 0) + 1
        if (value === ':') {
          context.annotation = !context.ternaries && previous?.type !== 'property' && (context.declaration === 'variable' || context.parentheses.at(-1)?.braces === (context.braces ?? 0) || previous?.value === ')')
          if (context.ternaries) context.ternaries--
        }
        if (value === '=') {
          context.annotation = context.declaration === 'alias'
          context.declaration = ''
        }
        if (/^[;{}]$/.test(value)) { context.annotation = false; context.declaration = '' }
        if (value === ';') context.ternaries = 0
        if (type === 'keyword' && /^(as|satisfies)$/.test(value)) context.annotation = true
      }
      if (script) {
        if (token.value === '{' || token.value === '${') {
          context.scopes ??= []
          context.scopes.push(!!context.classBody || /^(=|\(|\[|,|:|return|yield)$/.test(previous?.value ?? ''))
          context.classBody = false
        }
        if (token.value === '}') context.scopes?.pop()
        if (type === 'keyword' && /^(class|interface)$/.test(token.value)) context.classBody = true
        context.functionName = type === 'keyword' && token.value === 'function' || !!context.functionName && token.value === '*'
        if (token.value === '{' || token.value === '${') context.braces = (context.braces ?? 0) + 1
        if (token.value === '}') context.braces = Math.max(0, (context.braces ?? 0) - 1)
        if (token.value === '(') context.parentheses.push({ control: previous?.type === 'keyword' && /^(if|while|for|with|switch|catch)$/.test(previous.value) || !!context.forAwait, braces: context.braces ?? 0 })
        context.afterControl = token.value === ')' && !!context.parentheses.pop()?.control
        context.forAwait = token.value === 'await' && previous?.type === 'keyword' && previous.value === 'for'
      }
      previous = token
    }
    position = end
  }

  const match = (pattern: RegExp): string | undefined => {
    pattern.lastIndex = position
    const result = pattern.exec(source)
    // Unicode regexes can rewind into a surrogate pair in V8.
    if (!result || result.index !== position) return undefined
    if (result[0].length === 0) {
      throw new Error(`Kirari: empty match in ${language.name} at offset ${position}`)
    }
    return result[0]
  }

  while (position < source.length) {
    for (const token of pending) {
      const resume = yield token
      if (resume !== undefined) {
        position = resume
        previous = { type: 'tag', value: 'element', start: token.start, end: resume }
        break
      }
    }
    pending = []
    if (position >= source.length) break
    const frame = frames[frames.length - 1]
    if (frame?.kind === 'template') {
      let end = position + (frame.opening ? 1 : 0)
      frame.opening = false
      while (end < source.length) {
        if (source[end] === '\\') {
          end = Math.min(end + 2, source.length)
        } else if (source[end] === '`') {
          end++
          frames.pop()
          break
        } else if (source.startsWith('${', end)) {
          break
        } else {
          end++
        }
      }
      if (end > position) emit('string', end)
      if (source.startsWith('${', position)) {
        emit('punctuation', position + 2)
        frames.push({ kind: 'expression', depth: 0 })
      }
      continue
    }

    if (language.regexLiterals && source[position] === '/'
      && source[position + 1] !== '/' && source[position + 1] !== '*'
      && (context.afterControl || canStartRegex(previous))) {
      const end = regexEnd(source, position, failedRegexStates)
      if (end > position) {
        emit('regex', end)
        continue
      }
    }

    let matched = false
    for (const rule of rules) {
      const value = match(rule.pattern)
      if (value !== undefined) {
        emit(rule.type, position + value.length)
        matched = true
        break
      }
    }
    if (matched) continue

    const char = source[position]!
    if (language.templates && char === '`') {
      frames.push({ kind: 'template', opening: true })
      continue
    }
    let name = identifier && match(identifier)
    if (script && identifier) {
      let end = position + (name?.length ?? 0)
      while (source[end] === '\\') {
        unicodeEscape.lastIndex = end
        const escape = unicodeEscape.exec(source)
        if (!escape) break
        const value = parseInt(escape[1] ?? escape[2]!, 16)
        const point = value <= 0x10ffff ? String.fromCodePoint(value) : ' '
        if (!(end === position ? /^[$_\p{ID_Start}]$/u : /^[$\u200c\u200d\p{ID_Continue}]$/u).test(point)) break
        end += escape[0].length
        continuation.lastIndex = end
        const suffix = continuation.exec(source)
        if (suffix?.index === end) end += suffix[0].length
      }
      if (end > position) name = source.slice(position, end)
    }
    if (name !== undefined) {
      let type = 'variable'
      const end = position + name.length
      const member = previous?.value === '.' || previous?.value === '?.'
      const method = !!context.scopes?.at(-1) && /^(\{|\}|,|;|\*|async|static|get|set|public|private|protected|abstract|override)$/.test(previous?.value ?? '')
      if (member) type = 'property'
      else if (typed && context.annotation && name === 'void') type = 'type'
      else if (keywords.has(name)) type = 'keyword'
      else if (booleans.has(name)) type = 'boolean'
      else if (nulls.has(name)) type = 'null'
      else if (types.has(name) || previous?.value === 'class' || typed && (context.annotation || previous?.type === 'keyword' && /^(type|interface)$/.test(previous.value))) type = 'type'
      else if ((previous?.value === '{' || previous?.value === ',') && /^\s*:/.test(source.slice(end))) type = 'property'
      else if (/^\s*\(/.test(source.slice(end))) type = 'function'
      if (lookup && !member && (type === 'variable' || type === 'property' || context.functionName || method || /^(async|get|set|static)$/.test(name))) {
        const found = lookup(end, typed && /^(const|let|var)$/.test(previous?.value ?? ''), !!context.functionName || method, type === 'property' || method, name === 'async' && !context.functionName && !method)
        if (found.function) type = 'function'
        if (found.pending) context.functionPending = true
      }
      context.annotation = false
      emit(type, end)
      continue
    }

    emit('text', position + 1)
  }
  yield* pending
}

const canStartRegex = (previous: Token | undefined): boolean => {
  if (!previous) return true
  if (previous.type === 'property') return false
  // shortcut: lexical context cannot resolve every slash; use a parser for semantic accuracy.
  return /^(?:[([{,:;=!?&|+*%~<>^-]|\$\{|=>|&&|\|\||\?\?|===?|!==?|[+*/%&|^-]=|return|throw|case|delete|void|typeof|yield|await|in|of)$/.test(previous.value)
}

const regexEnd = (source: string, start: number, failed: Set<number>): number => {
  let inClass = false
  const visited: number[] = []
  for (let end = start + 1; end < source.length; end++) {
    const state = end * 2 + Number(inClass)
    if (failed.has(state)) break
    visited.push(state)
    const char = source[end]
    if (char === '\n' || char === '\r' || char === '\u2028' || char === '\u2029') break
    if (char === '\\') {
      if (/[\r\n\u2028\u2029]/.test(source[end + 1] ?? '')) break
      end++
    } else if (char === '[') inClass = true
    else if (char === ']') inClass = false
    else if (char === '/' && !inClass) {
      end++
      while (end < source.length && /[a-z]/i.test(source[end]!)) end++
      return end
    }
  }
  // Failed states prevent repeated scans of malformed input such as /[/[/[.
  for (const state of visited) failed.add(state)
  return start
}
