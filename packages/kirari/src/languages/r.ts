import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'
import { whitespace, number } from '../grammars/clike.js'

const rawStrings = (source: string, language: Language): Token[] => {
  const tokens: Token[] = []
  let previous: Token | undefined
  let scanner = scan(source, language)
  for (let item = scanner.next(); !item.done; item = scanner.next()) {
    let token = item.value
    if (token.type === 'string' && /^[rR]"-*[(\[{]$/.test(token.value)) {
      const closing = ({ '(': ')', '[': ']', '{': '}' } as const)[token.value.at(-1) as '(' | '[' | '{']
      const dashes = token.value.length - 3
      let end = token.end
      while (end < source.length) {
        if (source[end++] !== closing) continue
        const start = end
        while (source[end] === '-') end++
        if (end - start === dashes && source[end] === '"') { end++; break }
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

export const r: Language = {
  name: 'r',
  tokenize: rawStrings,
  identifier: /(?:[\p{L}]|\.(?!\d))[\p{L}\d._]*/u,
  keywords: 'if else repeat while function for in next break'.split(' '),
  booleans: ['TRUE', 'FALSE'],
  nulls: ['NULL', 'NA', 'NA_integer_', 'NA_real_', 'NA_complex_', 'NA_character_'],
  rules: [
    whitespace,
    { type: 'comment', pattern: /#[^\r\n]*/ },
    { type: 'string', pattern: /[rR]"-*[(\[{]/ },
    { type: 'string', pattern: /"(?:\\(?:[\s\S]|$)|[^"\\])*(?:"|$)|'(?:\\(?:[\s\S]|$)|[^'\\])*(?:'|$)/ },
    { type: 'variable', pattern: /`(?:\\(?:[\s\S]|$)|[^`\\])*(?:`|$)/ },
    { type: 'number', pattern: /(?:Inf|NaN)\b/ },
    { type: 'number', pattern: new RegExp(`${number.pattern.source}[Li]?`) },
    { type: 'operator', pattern: /%[^%\r\n]*(?:%|(?=[\r\n])|$)|<<-|->>|<-|->|:::?|\|>|&&|\|\||[+*/^<>=!]=?|[-~&|:$@?\\]/ },
    { type: 'punctuation', pattern: /[{}()[\],;]/ },
  ],
}
