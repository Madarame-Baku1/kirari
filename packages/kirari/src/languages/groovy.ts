import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'
import { whitespace, lineComment, blockComment, quotedString, tripleString, number, operator, punctuation } from '../grammars/clike.js'

const slashyStrings = (source: string, language: Language): Token[] => {
  const tokens: Token[] = []
  let previous: Token | undefined
  let scanner = scan(source, language)
  for (let item = scanner.next(); !item.done; item = scanner.next()) {
    let token = item.value
    // shortcut: slashy strings use expression-start context; command-style arguments need a Groovy parser.
    if (/^\/=?$/.test(token.value) && (!previous || /^(?:[([{,:;=!?&|+*%~<>^-]|=>|==~|=~|return|throw|case|assert)$/.test(previous.value))) {
      let end = token.start + 1
      while (end < source.length) {
        if (source[end] === '\\' && source[end + 1] === '/') end += 2
        else if (source[end++] === '/') break
      }
      token = { type: 'string', value: source.slice(token.start, end), start: token.start, end }
      scanner = scan(source, language, end, previous)
    }
    const last = tokens[tokens.length - 1]
    if (token.type === 'text' && last?.type === 'text') tokens[tokens.length - 1] = { ...last, value: last.value + token.value, end: token.end }
    else tokens.push(token)
    if (token.type !== 'text' && token.type !== 'comment') previous = token
  }
  return tokens
}

export const groovy: Language = {
  name: 'groovy',
  tokenize: slashyStrings,
  identifier: /[$_\p{ID_Start}][$\p{ID_Continue}]*/u,
  keywords: 'abstract as assert break case catch class const continue def default do else enum extends final finally for goto if implements import in instanceof interface native new non-sealed package permits private protected public record return sealed static strictfp super switch synchronized this throw throws trait transient try var void volatile while yield'.split(' '),
  types: 'boolean byte char double float int long short Boolean Byte Character Double Float Integer Long Short String Object BigDecimal BigInteger List Map Set'.split(' '),
  booleans: ['true', 'false'],
  nulls: ['null'],
  rules: [
    whitespace, lineComment, blockComment,
    { type: 'comment', pattern: /^#![^\r\n]*/ },
    // shortcut: GString expressions remain string text; use a parser for nested expression quotes.
    { type: 'string', pattern: /\$\/(?:\$[$/]|(?!\/\$|\$[$/])[\s\S])*(?:\/\$|$)/ },
    tripleString,
    { type: 'string', pattern: /'''(?:\\(?:[\s\S]|$)|(?!''')[^\\])*(?:'''|$)/ },
    quotedString,
    { type: 'attribute', pattern: /@[_\p{ID_Start}][\p{ID_Continue}.]*/u },
    { type: 'number', pattern: new RegExp(`${number.pattern.source}[gGdDfFlLiI]?`) },
    { type: 'operator', pattern: /===|!==|==~|=~|<=>|\?\[|\?\.|\?:|\*\.|\.&|\.\.<|<\.\./ },
    operator, punctuation,
  ],
}
