import { scan } from '../tokenize.js'
import type { Language, Token, Rule } from '../types.js'

export const identifier = /[_\p{ID_Start}]\p{ID_Continue}*/u
export const whitespace: Rule = { type: 'text', pattern: /\s+/ }
export const lineComment: Rule = { type: 'comment', pattern: /\/\/[^\r\n]*/ }
export const blockComment: Rule = { type: 'comment', pattern: /\/\*[\s\S]*?(?:\*\/|$)/ }
export const quotedString: Rule = {
  type: 'string',
  pattern: /"(?:\\(?:[\s\S]|$)|[^"\\\r\n])*(?:"|(?=[\r\n])|$)|'(?:\\(?:[\s\S]|$)|[^'\\\r\n])*(?:'|(?=[\r\n])|$)/,
}
export const doubleString: Rule = {
  type: 'string', pattern: /"(?:\\(?:[\s\S]|$)|[^"\\\r\n])*(?:"|(?=[\r\n])|$)/,
}
export const tripleString: Rule = {
  type: 'string', pattern: /"""(?:\\(?:[\s\S]|$)|(?!""")[^\\])*(?:"""|$)/,
}
export const number: Rule = {
  type: 'number',
  pattern: /(?:0[xX][\da-fA-F_]+(?:\.[\da-fA-F_]*)?(?:[pP][+-]?[\d_]+)?|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.(?!\.)[\d_]*)?(?:[eE][+-]?[\d_]+)?|\.\d[\d_]*(?:[eE][+-]?[\d_]+)?)/,
}
export const operator: Rule = {
  type: 'operator', pattern: />>>=?|<<=?|>>=?|->\*?|=>|::|\.\*|\?\.|\?\?=?|\.\.\.?=?|\+\+|--|&&=?|\|\|=?|\*\*=?|[+*/%&|^!=<>-]=?|[~?]/,
}
export const punctuation: Rule = { type: 'punctuation', pattern: /[{}()[\],;:.]/ }
export const preprocessor: Rule = {
  type: 'keyword', pattern: /#[\t ]*[a-zA-Z_]\w*(?:\\(?:\r\n|[\r\n])|[^\r\n\\]|\\(?![\r\n]))*/,
}

export const nestedComments = (source: string, language: Language): Token[] => {
  const tokens: Token[] = []
  let previous: Token | undefined
  let scanner = scan(source, language)
  for (let item = scanner.next(); !item.done; item = scanner.next()) {
    let token = item.value
    if (token.type === 'comment' && token.value.startsWith('/*')) {
      let depth = 1
      let end = token.start + 2
      while (end < source.length && depth > 0) {
        if (source.startsWith('/*', end)) { depth++; end += 2 }
        else if (source.startsWith('*/', end)) { depth--; end += 2 }
        else end++
      }
      if (end !== token.end) {
        token = { ...token, value: source.slice(token.start, end), end }
        scanner = scan(source, language, end, previous)
      }
    }
    const last = tokens[tokens.length - 1]
    if (token.type === 'text' && last?.type === 'text') {
      tokens[tokens.length - 1] = { ...last, value: last.value + token.value, end: token.end }
    } else tokens.push(token)
    if (token.type !== 'text' && token.type !== 'comment') previous = token
  }
  return tokens
}
