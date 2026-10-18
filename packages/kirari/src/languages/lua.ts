import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'
import { whitespace, number, operator, punctuation } from '../grammars/clike.js'

const longBrackets = (source: string, language: Language): Token[] => {
  const tokens: Token[] = []
  let previous: Token | undefined
  let scanner = scan(source, language)
  for (let item = scanner.next(); !item.done; item = scanner.next()) {
    let token = item.value
    if ((token.type === 'string' || token.type === 'comment') && /^(?:--)?\[=*\[$/.test(token.value)) {
      const level = token.value.length - (token.type === 'comment' ? 4 : 2)
      let end = token.end
      while (end < source.length) {
        if (source[end++] !== ']') continue
        const equals = end
        while (source[end] === '=') end++
        if (end - equals === level && source[end] === ']') { end++; break }
      }
      token = { ...token, value: source.slice(token.start, end), end }
      scanner = scan(source, language, end, previous)
    }
    const last = tokens[tokens.length - 1]
    if (token.type === 'text' && last?.type === 'text') tokens[tokens.length - 1] = { ...last, value: last.value + token.value, end: token.end }
    else tokens.push(token)
    if (token.type !== 'text' && token.type !== 'comment') previous = token
  }
  return tokens
}

export const lua: Language = {
  name: 'lua',
  tokenize: longBrackets,
  identifier: /[a-zA-Z_]\w*/,
  keywords: 'and break do else elseif end for function goto if in local not or repeat return then until while'.split(' '),
  booleans: ['true', 'false'],
  nulls: ['nil'],
  rules: [
    whitespace,
    { type: 'comment', pattern: /--\[=*\[/ },
    { type: 'comment', pattern: /--[^\r\n]*/ },
    { type: 'string', pattern: /\[=*\[/ },
    { type: 'string', pattern: /"(?:\\(?:z\s*|\r\n|[\s\S]|$)|[^"\\\r\n])*(?:"|(?=[\r\n])|$)|'(?:\\(?:z\s*|\r\n|[\s\S]|$)|[^'\\\r\n])*(?:'|(?=[\r\n])|$)/ },
    number,
    { type: 'operator', pattern: /~=|\/\/|[~#]/ },
    operator, punctuation,
  ],
}
