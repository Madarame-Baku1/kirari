import type { Language } from '../types.js'
import { javascript } from './javascript.js'
import { css } from './css.js'
import { markup } from '../grammars/markup.js'

export const html: Language = {
  name: 'html',
  rules: [],
  tokenize: source => markup(source, undefined, { script: javascript, style: css }),
}
