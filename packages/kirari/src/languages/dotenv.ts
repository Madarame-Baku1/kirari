import { whitespace } from '../grammars/clike.js'
import type { Language } from '../types.js'

export const dotenv: Language = {
  name: 'dotenv',
  // shortcut: Node-style dotenv values are opaque strings, use a dialect grammar for variable expansion.
  rules: [
    whitespace,
    { type: 'comment', pattern: /#[^\r\n]*/ },
    { type: 'keyword', pattern: /(?<=^[\t ]*)export\b(?=[\t ]+[A-Za-z_]\w*[\t ]*=)/m },
    { type: 'property', pattern: /(?<=^[\t ]*(?:export[\t ]+)?)[A-Za-z_]\w*(?=[\t ]*=)/m },
    { type: 'operator', pattern: /=/ },
    { type: 'string', pattern: /"(?:\\(?:[\s\S]|$)|[^"\\])*(?:"|$)|'(?:\\(?:[\s\S]|$)|[^'\\])*(?:'|$)/ },
    { type: 'string', pattern: /[^#\r\n]+/ },
  ],
}
