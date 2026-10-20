export const tokenTypes = [
  'text', 'keyword', 'variable', 'property', 'function', 'string', 'number',
  'boolean', 'null', 'comment', 'operator', 'punctuation', 'type', 'regex',
  'inserted', 'deleted', 'heading', 'tag', 'attribute', 'entity',
] as const

export type TokenType = (typeof tokenTypes)[number]

/** Whether a token type affects how later tokens read; whitespace and comments do not. */
export const isSignificant = (type: string): boolean => type !== 'text' && type !== 'comment'

export interface Token {
  readonly type: string
  readonly value: string
  readonly start: number
  readonly end: number
}

export interface Rule {
  readonly type: string
  readonly pattern: RegExp
}

export interface Language {
  readonly name: string
  readonly rules: readonly Rule[]
  readonly tokenize?: (source: string, language: Language) => Token[]
  readonly identifier?: RegExp
  readonly keywords?: readonly string[]
  readonly types?: readonly string[]
  readonly booleans?: readonly string[]
  readonly nulls?: readonly string[]
  readonly templates?: boolean
  readonly regexLiterals?: boolean
}

export interface RenderOptions {
  readonly classes?: Readonly<Record<string, string>>
  readonly className?: (token: Token) => string | undefined
}

export interface HighlightOptions extends RenderOptions {
  readonly language?: Language
}
