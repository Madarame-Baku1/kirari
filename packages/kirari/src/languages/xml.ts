import type { Language } from '../types.js'
import { markup } from '../grammars/markup.js'

export const xml: Language = {
  name: 'xml',
  rules: [],
  tokenize: source => markup(source),
}
