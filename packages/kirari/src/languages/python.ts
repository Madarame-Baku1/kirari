import { scan } from '../tokenize.js'
import type { Language, Token } from '../types.js'

const tripleString = { type: 'string', pattern: /[rRuUbBfF]{0,2}(?:"""(?:\\(?:[\s\S]|$)|(?!""")[^\\])*(?:"""|$)|'''(?:\\(?:[\s\S]|$)|(?!''')[^\\])*(?:'''|$))/ }
const fstringOpening = { type: 'python-fstring', pattern: /(?:[fF][rR]?|[rR][fF])(?:"""|'''|"|')/ }

type Literal = { kind: 'literal'; quote: string; raw: boolean; format: boolean }
type PythonFrame = { kind: 'expression'; depth: number; root?: true } | Literal

// Scans literal text in an f-string, stopping at a replacement field or the closing quote.
const literalChunk = (source: string, start: number, frame: Literal): { end: number; closed: boolean } => {
  let end = start
  while (end < source.length) {
    const char = source[end]
    if (frame.format && char === '}') break
    if (!frame.format && source.startsWith(frame.quote, end)) {
      return { end: end + frame.quote.length, closed: true }
    }
    if (!frame.format && frame.quote.length === 1 && (char === '\r' || char === '\n')) {
      return { end, closed: true }
    }
    if (char === '{' || char === '}') {
      if (!frame.format && source[end + 1] === char) end += 2
      else if (char === '{') break
      else end++
    } else if (char === '\\') {
      if (!frame.raw && source.startsWith('\\N{', end)) {
        end += 3
        while (end < source.length && source[end] !== '}' && !source.startsWith(frame.quote, end)
          && (frame.quote.length > 1 || (source[end] !== '\r' && source[end] !== '\n'))) end++
        if (source[end] === '}') end++
      } else {
        end++
        // Backslashes escape quotes, but cannot escape replacement-field braces.
        if (source[end] !== '{' && source[end] !== '}') {
          if (source.startsWith('\r\n', end)) end++
          if (end < source.length) end++
        }
      }
    } else end++
  }
  return { end, closed: false }
}

const tokenizePython = (source: string, language: Language): Token[] => {
  const tokens: Token[] = []
  const frames: PythonFrame[] = [{ kind: 'expression', depth: 0, root: true }]
  const scanner = scan(source, {
    ...language,
    rules: language.rules.flatMap(rule => rule.pattern === tripleString.pattern ? [fstringOpening, rule] : [rule]),
  })
  let position = 0
  let resume: number | undefined

  const emit = (type: string, end: number, merge = false): void => {
    if (end <= position) return
    const last = tokens[tokens.length - 1]
    if ((merge || type === 'text') && last?.type === type) {
      tokens[tokens.length - 1] = { ...last, value: source.slice(last.start, end), end }
    } else tokens.push({ type, value: source.slice(position, end), start: position, end })
    position = end
  }

  while (position < source.length) {
    const frame = frames[frames.length - 1]!
    if (frame.kind === 'literal') {
      const { end, closed } = literalChunk(source, position, frame)
      emit('string', end, true)
      if (closed) frames.pop()
      else if (source[position] === '{') {
        emit('punctuation', position + 1)
        frames.push({ kind: 'expression', depth: 0 })
      } else if (frame.format && source[position] === '}') {
        emit('punctuation', position + 1)
        frames.pop()
      }
      resume = position
      continue
    }

    const result = scanner.next(resume)
    resume = undefined
    if (result.done) break
    const token = result.value
    const opening = token.type === fstringOpening.type && /^(f|fr|rf)("""|'''|"|')$/i.exec(token.value)
    if (opening) {
      emit('string', token.end)
      frames.push({ kind: 'literal', quote: opening[2]!, raw: /r/i.test(opening[1]!), format: false })
      continue
    }
    if (!frame.root && frame.depth === 0) {
      if (token.value === '}') {
        emit('punctuation', token.end)
        frames.pop()
        continue
      }
      if (token.value === ':' || token.value === ':=') {
        emit('punctuation', token.start + 1)
        const literal = frames[frames.length - 2]!
        if (literal.kind === 'literal') frames[frames.length - 1] = { ...literal, format: true }
        continue
      }
      if (token.value === '!' && /^[rsa]$/.test(source[token.end] ?? '')) {
        emit('operator', token.end)
        emit('string', position + 1)
        resume = position
        continue
      }
    }
    if (token.type === 'punctuation') {
      if (/^[([{]$/.test(token.value)) frame.depth++
      else if (/^[)\]}]$/.test(token.value) && frame.depth > 0) frame.depth--
    }
    emit(token.type, token.end)
  }
  return tokens
}

export const python: Language = {
  name: 'python',
  tokenize: tokenizePython,
  identifier: /[_\p{ID_Start}]\p{ID_Continue}*/u,
  keywords: 'and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield'.split(' '),
  booleans: ['True', 'False'],
  nulls: ['None'],
  rules: [
    { type: 'text', pattern: /\s+/ },
    { type: 'comment', pattern: /#[^\r\n]*/ },
    tripleString,
    { type: 'string', pattern: /[rRuUbBfF]{0,2}(?:"(?:\\(?:\r\n|[\s\S]|$)|[^"\\\r\n])*(?:"|(?=[\r\n])|$)|'(?:\\(?:\r\n|[\s\S]|$)|[^'\\\r\n])*(?:'|(?=[\r\n])|$))/ },
    { type: 'number', pattern: /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?[\d_]+)?)[jJ]?/ },
    { type: 'operator', pattern: /\*\*=?|\/\/=?|:=|->|<<=?|>>=?|[+*/%&|^!=<>-]=?|[~@]/ },
    { type: 'punctuation', pattern: /[{}()[\],;:.]/ },
  ],
}
