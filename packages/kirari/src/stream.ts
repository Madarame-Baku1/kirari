import { appendToken, scan, tokenize } from './tokenize.js'
import type { Frame, ScanContext } from './tokenize.js'
import { javascript } from './languages/javascript.js'
import { typescript } from './languages/typescript.js'
import { json } from './languages/json.js'
import { resumableScanOf } from './resumable.js'
import type { ResumableScan, ResumePoint } from './resumable.js'
import { advanceDefinitionState, breakDefinitionLine, classifyDefinitions, copyDefinitionState, createDefinitionState, endsLine, isDefinitionBoundary } from './grammars/definitions.js'
import type { DefinitionState } from './grammars/definitions.js'
import { isSignificant } from './types.js'
import type { Language, Token } from './types.js'

export interface TokenPatch {
  /** Replace previous tokens from this UTF-16 source offset onward. */
  readonly from: number
  readonly tokens: readonly Token[]
  readonly length: number
}

export interface TokenStream {
  readonly mode: 'checkpoint' | 'full'
  write(chunk: string): TokenPatch
  end(chunk?: string): TokenPatch
  reset(): void
}

const cloneContext = (context: ScanContext): ScanContext => {
  return { ...context, parentheses: [...context.parentheses], scopes: [...context.scopes ?? []] }
}

const openBrackets = (state: DefinitionState): string[] => state.brackets.map(bracket => bracket.close)

/** Advances `state` through `tokens[from..to]`, returning the next index. */
const walkDefinitions = (state: DefinitionState, tokens: readonly Token[], from: number, to: number): number => {
  for (let index = from; index <= to; index++) {
    const token = tokens[index]!
    if (isSignificant(token.type)) advanceDefinitionState(state, token)
    else if (token.type === 'text' && endsLine(token.value)) breakDefinitionLine(state)
  }
  return to + 1
}

/**
 * Streams for built-in Python rescan from the last resume point, then reclassify definitions from
 * the last point where `classifyDefinitions` cannot see across. Tokens before that point are final.
 */
const createResumableStream = (language: Language, scanResumable: ResumableScan): TokenStream => {
  let source = ''
  let raw: Token[] = []
  let resume: ResumePoint | undefined
  let resumeIndex = 0
  // Resume points not yet decided, and the definition state through the last decided one.
  let points: { offset: number; index: number }[] = []
  let cursor = { index: 0, state: createDefinitionState() }
  let final: { offset: number; index: number; open: readonly string[] } = { offset: 0, index: 0, open: [] }
  let closed = false

  const write = (chunk: string): TokenPatch => {
    if (closed) throw new Error('Kirari: stream is closed; reset before writing again')
    if (typeof chunk !== 'string') throw new TypeError('Kirari: stream chunks must be strings')
    if (!chunk) return { from: source.length, tokens: [], length: source.length }
    const next = source + chunk
    const found: { resume: ResumePoint; index: number }[] = []
    const tail = scanResumable(next, language, resume, (point, index) => found.push({ resume: point, index: resumeIndex + index }))
    source = next
    raw.length = resumeIndex
    for (const token of tail) raw.push(token)
    points = points.filter(point => point.index < resumeIndex)
    for (const point of found) points.push({ offset: point.resume.offset, index: point.index })
    const last = found.at(-1)
    if (last) { resume = last.resume; resumeIndex = last.index }

    const from = final.offset
    const tokens = classifyDefinitions(raw.slice(final.index), language.name, final.open)
    // Tokens before the last resume point are final. A point is decided once the first significant
    // token after it is among them; its answer cannot change after that.
    let decided = 0
    for (; decided < points.length; decided++) {
      const point = points[decided]!
      let after = point.index
      while (after < resumeIndex && !isSignificant(raw[after]!.type)) after++
      if (after >= resumeIndex) break
      cursor.index = walkDefinitions(cursor.state, raw, cursor.index, point.index)
      if (isDefinitionBoundary(cursor.state, raw[after])) final = { offset: point.offset, index: point.index, open: openBrackets(cursor.state) }
    }
    // A later point waits for its next token unless it is a boundary whatever that token is.
    if (decided < points.length) {
      const state = copyDefinitionState(cursor.state)
      let index = cursor.index
      for (let pending = decided; pending < points.length; pending++) {
        const point = points[pending]!
        index = walkDefinitions(state, raw, index, point.index)
        if (isDefinitionBoundary(state, undefined)) {
          final = { offset: point.offset, index: point.index, open: openBrackets(state) }
          cursor = { index, state: copyDefinitionState(state) }
          decided = pending + 1
        }
      }
    }
    points = points.slice(decided)
    return { from, tokens, length: source.length }
  }

  return {
    mode: 'checkpoint', write,
    end(chunk = '') {
      const patch = write(chunk)
      closed = true
      return patch
    },
    reset() {
      source = ''; raw = []; resume = undefined; resumeIndex = 0; points = []
      cursor = { index: 0, state: createDefinitionState() }; final = { offset: 0, index: 0, open: [] }; closed = false
    },
  }
}

export const createTokenStream = (language: Language): TokenStream => {
  const scanResumable = resumableScanOf(language)
  if (scanResumable) return createResumableStream(language, scanResumable)
  // shortcut: long/open tails are rescanned; track more lexical state if those workloads become a bottleneck.
  const mode = !language.tokenize && (language === javascript || language === typescript || language === json) ? 'checkpoint' : 'full'
  let source = ''
  let offset = 0
  let previous: Token | undefined
  let context: ScanContext = { parentheses: [] }
  let closed = false

  const write = (chunk: string): TokenPatch => {
    if (closed) throw new Error('Kirari: stream is closed; reset before writing again')
    if (typeof chunk !== 'string') throw new TypeError('Kirari: stream chunks must be strings')
    if (!chunk) return { from: source.length, tokens: [], length: source.length }
    const next = source + chunk
    if (mode === 'full') {
      const tokens = tokenize(next, language)
      source = next
      return { from: 0, tokens, length: source.length }
    }

    const from = offset
    let nextOffset = offset
    let nextPrevious = previous
    let nextContext = context
    const activeContext = cloneContext(context)
    let significant = previous
    const tokens: Token[] = []
    const frames: Frame[] = []
    for (const token of scan(next, language, offset, previous, undefined, frames, activeContext)) {
      const last = tokens[tokens.length - 1]
      // Keep names revisable until their whitespace lookahead and function signatures are resolved.
      if (token.type === 'text' && /[\r\n\u2028\u2029]/.test(token.value) && token.end < next.length && !frames.length && activeContext.functionPending === undefined) {
        nextOffset = last?.type === 'text' ? last.start : token.start
        nextPrevious = significant
        nextContext = cloneContext(activeContext)
      }
      appendToken(tokens, token)
      if (isSignificant(token.type)) significant = token
    }
    source = next
    offset = nextOffset
    previous = nextPrevious && { ...nextPrevious }
    context = nextContext
    return { from, tokens, length: source.length }
  }

  return {
    mode, write,
    end(chunk = '') {
      const patch = write(chunk)
      closed = true
      return patch
    },
    reset() { source = ''; offset = 0; previous = undefined; context = { parentheses: [] }; closed = false },
  }
}
