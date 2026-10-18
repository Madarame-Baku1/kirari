import { scan, tokenize } from './tokenize.js'
import type { Frame, ScanContext } from './tokenize.js'
import { javascript } from './languages/javascript.js'
import { typescript } from './languages/typescript.js'
import { json } from './languages/json.js'
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

export const createTokenStream = (language: Language): TokenStream => {
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
    const activeContext = { ...context, parentheses: [...context.parentheses] }
    let significant = previous
    const tokens: Token[] = []
    const frames: Frame[] = []
    for (const token of scan(next, language, offset, previous, undefined, frames, activeContext)) {
      const last = tokens[tokens.length - 1]
      // Wait for a non-whitespace lookahead before committing a possibly reclassified name/key.
      if (token.type === 'text' && /[\r\n\u2028\u2029]/.test(token.value) && token.end < next.length && !frames.length) {
        nextOffset = last?.type === 'text' ? last.start : token.start
        nextPrevious = significant
        nextContext = { ...activeContext, parentheses: [...activeContext.parentheses] }
      }
      if (token.type === 'text' && last?.type === 'text') {
        tokens[tokens.length - 1] = { ...last, value: last.value + token.value, end: token.end }
      } else tokens.push(token)
      if (token.type !== 'text' && token.type !== 'comment') significant = token
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
