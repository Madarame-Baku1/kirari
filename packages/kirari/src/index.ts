import { tokenize as scan } from './tokenize.js'
import { render } from './render.js'
import { javascript } from './languages/javascript.js'
import type { HighlightOptions, Language, Token } from './types.js'

export const tokenize = (source: string, language: Language = javascript): Token[] => {
  return scan(source, language)
}

export const highlight = (source: string, options: HighlightOptions = {}): string => {
  return render(tokenize(source, options.language), options)
}

export { render } from './render.js'
export { tokenTypes } from './types.js'
export type { HighlightOptions, Language, RenderOptions, Rule, Token, TokenType } from './types.js'
