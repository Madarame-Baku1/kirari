import type { Language } from '../types.js'
import { javascript } from './javascript.js'
import { markup } from '../grammars/markup.js'

export const jsx: Language = {
  ...javascript,
  name: 'jsx',
  tokenize: (source, language) => markup(source, language),
}
