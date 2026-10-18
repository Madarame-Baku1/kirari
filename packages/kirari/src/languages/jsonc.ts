import type { Language } from '../types.js'
import { json } from './json.js'

export const jsonc: Language = {
  ...json,
  name: 'jsonc',
  rules: [
    { type: 'comment', pattern: /\/\/[^\r\n\u2028\u2029]*/ },
    { type: 'comment', pattern: /\/\*[\s\S]*?(?:\*\/|$)/ },
    ...json.rules,
  ],
}
