import type { Language } from '../types.js'
import { component } from '../grammars/component.js'

export const svelte: Language = {
  name: 'svelte',
  rules: [],
  tokenize: source => component(source, 'svelte'),
}
