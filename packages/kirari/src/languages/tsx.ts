import type { Language } from '../types.js'
import { typescript } from './typescript.js'
import { jsx } from './jsx.js'

export const tsx: Language = {
  ...typescript,
  name: 'tsx',
  tokenize: jsx.tokenize!,
}
