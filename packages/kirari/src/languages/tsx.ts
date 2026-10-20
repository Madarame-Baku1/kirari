import type { Language } from '../types.js'
import { typescript } from './typescript.js'
import { jsx } from './jsx.js'
import { resumableScan, resumableScanOf } from '../resumable.js'

export const tsx: Language = {
  ...typescript,
  name: 'tsx',
  tokenize: jsx.tokenize!,
}

Object.defineProperty(tsx, resumableScan, { value: resumableScanOf(jsx) })
