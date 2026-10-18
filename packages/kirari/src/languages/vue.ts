import type { Language } from '../types.js'
import { component } from '../grammars/component.js'

export const vue: Language = {
  name: 'vue',
  rules: [],
  tokenize: source => component(source, 'vue'),
}
