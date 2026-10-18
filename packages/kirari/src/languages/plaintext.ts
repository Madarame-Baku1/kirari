import type { Language } from '../types.js'

export const plaintext: Language = {
  name: 'plaintext',
  rules: [{ type: 'text', pattern: /[\s\S]+/ }],
}
