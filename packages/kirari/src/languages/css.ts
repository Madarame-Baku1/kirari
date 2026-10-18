import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'

const cssTokens = (source: string, language: Language): Token[] => {
  const tokens: Token[] = []
  let statement: Token[] = []
  let parentheses = 0
  let customBraces = 0

  const flush = (selector: boolean): void => {
    const atRule = statement.some(token => token.type === 'keyword' && token.value.startsWith('@'))
    for (let index = 0; index < statement.length; index++) {
      const token = statement[index]!
      if (selector && !atRule && token.type === 'punctuation' && token.value === ':') {
        const colons = statement[index + 1]?.value === ':' ? 2 : 1
        const name = statement[index + colons]
        if (name && /^[a-zA-Z_-][\w-]*$/.test(name.value)) {
          tokens.push({ type: 'type', value: source.slice(token.start, name.end), start: token.start, end: name.end })
          index += colons
          continue
        }
      }
      if (selector && !atRule && (token.type === 'property'
        || (token.type === 'number' && token.value.startsWith('#'))
        || (token.type === 'text' && /^[a-zA-Z_-][\w-]*$/.test(token.value)))) tokens.push({ ...token, type: 'type' })
      else tokens.push(token)
    }
    statement = []
  }

  for (const token of scan(source, language)) {
    if (token.type === 'punctuation') {
      if (token.value === '(' || token.value === '[') parentheses++
      if (token.value === ')' || token.value === ']') parentheses = Math.max(0, parentheses - 1)
      if (!parentheses) {
        if (token.value === '{') {
          const first = statement.find(part => part.type !== 'text' && part.type !== 'comment')
          if (first?.type === 'variable' && first.value.startsWith('--')) customBraces++
          else {
            flush(true)
            tokens.push(token)
            continue
          }
        } else if (token.value === '}' && customBraces) customBraces--
        else if ((token.value === ';' || token.value === '}') && !customBraces) {
          flush(false)
          tokens.push(token)
          continue
        }
      }
    }
    statement.push(token)
  }
  // shortcut: unfinished statements are treated as declarations; a parser can resolve incomplete selectors.
  flush(false)
  return tokens
}

export const css: Language = {
  name: 'css',
  tokenize: cssTokens,
  rules: [
    { type: 'text', pattern: /\s+/ },
    { type: 'comment', pattern: /\/\*[^]*?(?:\*\/|$)/ },
    { type: 'string', pattern: /"(?:\\(?:[^]|$)|[^"\\\r\n])*(?:"|(?=[\r\n])|$)|'(?:\\(?:[^]|$)|[^'\\\r\n])*(?:'|(?=[\r\n])|$)/ },
    { type: 'keyword', pattern: /@[\w-]+|!important\b/i },
    { type: 'variable', pattern: /--[\w-]+/ },
    { type: 'property', pattern: /[a-zA-Z_-][\w-]*(?=\s*:)/ },
    { type: 'number', pattern: /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b|[+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?(?:%|[a-zA-Z]+)?/i },
    { type: 'type', pattern: /[.#][a-zA-Z_-][\w-]*/ },
    { type: 'function', pattern: /[a-zA-Z_-][\w-]*(?=\()/ },
    { type: 'text', pattern: /[a-zA-Z_-][\w-]*/ },
    { type: 'operator', pattern: /[>+~*=|^$]/ },
    { type: 'punctuation', pattern: /[{}()[\],;:]/ },
  ],
}
