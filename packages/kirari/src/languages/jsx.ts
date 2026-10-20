import type { Language } from '../types.js'
import { javascript } from './javascript.js'
import { markup } from '../grammars/markup.js'
import { resumableScan } from '../resumable.js'
import type { ResumableScan } from '../resumable.js'

export const jsx: Language = {
  ...javascript,
  name: 'jsx',
  tokenize: (source, language) => markup(source, language),
}

const scanJsx: ResumableScan = (source, language, from, checkpoint) => markup(source, language, undefined, undefined, { from, checkpoint })

Object.defineProperty(jsx, resumableScan, { value: scanJsx })
