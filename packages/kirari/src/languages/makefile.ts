import { quotedString } from '../grammars/clike.js'
import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'

export const makefile: Language = {
  name: 'makefile',
  rules: [
    { type: 'text', pattern: /[\r\n]+|[\t ]+/ },
    { type: 'text', pattern: /\\(?:[\s\S]|$)/ },
    { type: 'comment', pattern: /#(?:\\(?:\r?\n|[^\r\n]|$)|[^\\\r\n])*/ },
    { type: 'variable', pattern: /\$[({]|\$[^\r\n]/ },
    quotedString,
    { type: 'keyword', pattern: /(?:include|-include|sinclude|define|endef|undefine|ifdef|ifndef|ifeq|ifneq|else|endif|override|export|unexport|private|vpath)\b/ },
    { type: 'variable', pattern: /[\w.-]+(?=[\t ]*(?:::{0,2}|[?+!])?=)/ },
    { type: 'operator', pattern: /(?<=^\t)[@+-]+/m },
    { type: 'function', pattern: /[^\s:#=;$(){}"'\\]+(?=[\t ]*:(?!=))/ },
    { type: 'operator', pattern: /:::=|::=|:=|[?+!]=|::|[=:;|]/ },
    { type: 'text', pattern: /[^\s:#=;$(){}"'\\]+/ },
    { type: 'punctuation', pattern: /[(){}]/ },
  ],
  tokenize(source, language) {
    const tokens: Token[] = []
    const scanner = scan(source, language)
    let recipeCommand = false
    let item = scanner.next()
    while (!item.done) {
      let token = item.value
      // shortcut: recipes use the default tab prefix and lexical shell words, add shell delegation for .RECIPEPREFIX and shell semantics.
      if (token.type === 'text' && /[\r\n]/.test(token.value)) recipeCommand = false
      if (token.value.startsWith('\t') && (token.start === 0 || /[\r\n]/.test(source[token.start - 1]!))) recipeCommand = true
      if (token.type === 'variable' && /^\$[({]$/.test(token.value)) {
        const stack = [token.value[1] === '(' ? ')' : '}']
        let end = token.end
        while (end < source.length && stack.length) {
          const char = source[end++]!
          if (char === '(') stack.push(')')
          else if (char === '{') stack.push('}')
          else if (char === stack[stack.length - 1]) stack.pop()
        }
        token = { ...token, value: source.slice(token.start, end), end }
        tokens.push(token)
        recipeCommand = false
        item = scanner.next(end)
      } else {
        if (recipeCommand && (token.type === 'keyword' || (token.type === 'text' && /\S/.test(token.value)))) {
          token = { ...token, type: 'function' }
          recipeCommand = false
        }
        tokens.push(token)
        item = scanner.next()
      }
    }
    return tokens
  },
}
