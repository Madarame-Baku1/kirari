import { quotedString, whitespace } from '../grammars/clike.js'
import type { Language } from '../types.js'

export const ini: Language = {
  name: 'ini',
  // shortcut: INI uses the common =/: separators and ;/# comments, use a dialect grammar for continuation/interpolation rules.
  rules: [
    whitespace,
    { type: 'comment', pattern: /[;#][^\r\n]*/ },
    { type: 'heading', pattern: /(?<=^[\t ]*)\[[^\]\r\n]*(?:\]|(?=[\r\n])|$)/m },
    { type: 'property', pattern: /(?<=^[\t ]*)[\w.-]+(?=[\t ]*[=:])/m },
    { type: 'operator', pattern: /[=:]/ },
    quotedString,
    { type: 'string', pattern: /[^;#\r\n]+/ },
  ],
}
