import { blockComment, doubleString, lineComment, number, operator, punctuation, whitespace } from '../grammars/clike.js'
import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'

export const hcl: Language = {
  name: 'hcl',
  identifier: /[_\p{ID_Start}][\p{ID_Continue}-]*/u,
  keywords: ['for', 'in', 'if', 'resource', 'data', 'variable', 'output', 'locals', 'module', 'provider', 'terraform', 'dynamic'],
  booleans: ['true', 'false'],
  nulls: ['null'],
  rules: [
    whitespace, lineComment, blockComment,
    { type: 'comment', pattern: /#[^\r\n]*/ },
    { type: 'string', pattern: /<<-?[_\p{ID_Start}][\p{ID_Continue}-]*[\t ]*(?:\r?\n|$)/u },
    // shortcut: quoted strings and heredocs keep template expressions opaque, add template states for embedded highlighting.
    doubleString,
    { type: 'property', pattern: /[_\p{ID_Start}][\p{ID_Continue}-]*(?=[\t ]*=(?!=|>))/u },
    number, operator, punctuation,
  ],
  tokenize(source, language) {
    const tokens: Token[] = []
    const scanner = scan(source, language)
    let item = scanner.next()
    while (!item.done) {
      let token = item.value
      if (token.type === 'string' && token.value.startsWith('<<')) {
        const indented = token.value.startsWith('<<-')
        const delimiter = token.value.slice(indented ? 3 : 2).trim()
        let end = token.end
        while (end < source.length) {
          const newline = source.indexOf('\n', end)
          const lineEnd = newline < 0 ? source.length : newline + 1
          let line = source.slice(end, newline < 0 ? lineEnd : newline).replace(/\r$/, '')
          if (indented) line = line.trimStart()
          end = lineEnd
          if (line === delimiter) break
        }
        token = { ...token, value: source.slice(token.start, end), end }
        tokens.push(token)
        item = scanner.next(end)
      } else {
        tokens.push(token)
        item = scanner.next()
      }
    }
    return tokens
  },
}
