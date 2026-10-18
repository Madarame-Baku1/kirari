import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'

export const nginx: Language = {
  name: 'nginx',
  rules: [
    { type: 'text', pattern: /\s+/ },
    { type: 'comment', pattern: /(?<![^\s;{}])#[^\r\n]*/ },
    { type: 'variable', pattern: /\$(?:\{\w*(?:\}|$)|\w+)/ },
    { type: 'string', pattern: /"(?:\\(?:[\s\S]|$)|[^"\\])*(?:"|$)|'(?:\\(?:[\s\S]|$)|[^'\\])*(?:'|$)/ },
    { type: 'punctuation', pattern: /[{};]/ },
    { type: 'string', pattern: /(?:\\(?:[\s\S]|$)|[^\s{};"'$\\])+/ },
  ],
  tokenize(source, language) {
    const tokens: Token[] = []
    let directive = true
    for (let token of scan(source, language)) {
      // shortcut: directive positions are lexical and strings keep variables opaque, use module-aware parsing for validation and embedded syntax.
      if (directive && token.type === 'string') token = { ...token, type: 'keyword' }
      if (token.type === 'punctuation') directive = true
      else if (token.type !== 'text' && token.type !== 'comment') directive = false
      tokens.push(token)
    }
    return tokens
  },
}
