import { doubleString, whitespace } from '../grammars/clike.js'
import type { Language } from '../types.js'

export const graphql: Language = {
  name: 'graphql',
  identifier: /[_A-Za-z][_0-9A-Za-z]*/,
  keywords: ['query', 'mutation', 'subscription', 'fragment', 'on', 'schema', 'scalar', 'type', 'interface', 'union', 'enum', 'input', 'extend', 'directive', 'implements', 'repeatable'],
  booleans: ['true', 'false'],
  nulls: ['null'],
  rules: [
    whitespace,
    { type: 'comment', pattern: /#[^\r\n]*/ },
    { type: 'string', pattern: /"""(?:\\"""|(?!""")[\s\S])*(?:"""|$)/ },
    doubleString,
    { type: 'variable', pattern: /\$[_A-Za-z][_0-9A-Za-z]*/ },
    { type: 'keyword', pattern: /@[_A-Za-z][_0-9A-Za-z]*/ },
    // shortcut: capitalized names are types, use a schema-aware parser to resolve arbitrary type names.
    { type: 'type', pattern: /[A-Z][_0-9A-Za-z]*/ },
    { type: 'number', pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
    { type: 'operator', pattern: /\.\.\.|[!=|&]/ },
    { type: 'punctuation', pattern: /[{}()[\]:,]/ },
  ],
}
