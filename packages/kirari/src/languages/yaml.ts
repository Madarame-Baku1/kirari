import { tokenize } from '../tokenize.js'
import type { Language, Token } from '../types.js'

const scalar: Language = {
  name: 'yaml-scalar',
  rules: [
    { type: 'text', pattern: /[ \t]+/ },
    { type: 'comment', pattern: /(?<!\S)#[^\r\n]*/ },
    { type: 'keyword', pattern: /^%[^\r\n]*|^(?:---|\.\.\.)(?=\s|$)|[|>](?:[1-9][+-]?|[+-][1-9]?)?(?=[ \t]*(?:#|$))/ },
    { type: 'property', pattern: /"(?:\\[^]|[^"\\])*"(?=[ \t]*:)|'(?:''|[^'])*'(?=[ \t]*:)/ },
    { type: 'string', pattern: /"(?:\\(?:[^]|$)|[^"\\])*(?:"|$)|'(?:''|[^'])*(?:'|$)/ },
    { type: 'variable', pattern: /[&*][^\s,[\]{}]+/ },
    { type: 'type', pattern: /!(?:<[^>]*(?:>|$)|[^\s,[\]{}]*)/ },
    { type: 'punctuation', pattern: /[-?:](?=\s|$)/ },
    { type: 'property', pattern: /[^\s:[\]{},#&*!|>'"%@`][^:[\]{},\r\n]*?(?=:[ \t]|:$)/ },
    { type: 'boolean', pattern: /(?:true|false)\b(?=[ \t]*(?:[,\]}]|$)|[ \t]+#)/i },
    { type: 'null', pattern: /(?:null\b|~)(?=[ \t]*(?:[,\]}]|$)|[ \t]+#)/i },
    { type: 'number', pattern: /[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?|\.(?:inf|nan))(?=[ \t]*(?:[,\]}]|$)|[ \t]+#)/i },
    { type: 'punctuation', pattern: /[{}[\],:]|[-?](?=\s|$)/ },
    { type: 'string', pattern: /[^\s:[\]{},#&*!|>'"%@`](?:[^\r\n:[\]{},#]|(?<!\s)#)*(?::(?!\s|$)(?:[^\r\n:[\]{},#]|(?<!\s)#)*)*/ },
  ],
}

const yamlTokens = (source: string, language: Language): Token[] => {
  const { tokenize: _tokenize, ...base } = language
  const tokens: Token[] = []
  let offset = 0
  let block: { parent: number; indent?: number } | undefined
  for (const line of source.match(/[^\r\n]+(?:\r\n?|\n)?|\r\n?|\n/g) ?? []) {
    const body = line.replace(/[\r\n]+$/, '')
    const indent = /^ */.exec(body)![0].length
    if (block && (!body.trim() || indent >= (block.indent ?? block.parent + 1))) {
      if (body.trim()) block.indent ??= indent
      tokens.push({ type: 'string', value: line, start: offset, end: offset + line.length })
    } else {
      block = undefined
      // shortcut: quoted and flow scalars are line-local; use a YAML parser for multiline scalar context.
      const lineTokens = tokenize(body, base)
      for (const token of lineTokens) tokens.push({ ...token, start: offset + token.start, end: offset + token.end })
      if (body.length < line.length) tokens.push({ type: 'text', value: line.slice(body.length), start: offset + body.length, end: offset + line.length })
      const header = lineTokens.find(token => token.type === 'keyword' && /^[|>]/.test(token.value))
      if (header) {
        const sequenceKey = /^ *(?:- +)+(?=[^|>]*:)/.exec(body)
        const parent = sequenceKey ? sequenceKey[0].length : indent
        const explicit = /[1-9]/.exec(header.value)
        block = { parent, ...(explicit ? { indent: parent + Number(explicit[0]) } : {}) }
      }
    }
    offset += line.length
  }
  return tokens
}

export const yaml: Language = { name: 'yaml', rules: scalar.rules, tokenize: yamlTokens }
