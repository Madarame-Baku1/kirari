import { markdown } from './languages/markdown.js'
import { tokenize } from './tokenize.js'
import type { LanguageRegistry } from './registry.js'
import type { Language, Token } from './types.js'

export const createMarkdown = (registry: LanguageRegistry): Language => {
  return {
    ...markdown,
    tokenize(source, language) {
      const tokens: Token[] = []
      for (const token of markdown.tokenize!(source, language)) {
        const open = token.type === 'string' && /^ {0,3}(`{3,}|~{3,})([^\r\n]*)(?:\r\n?|\n)/.exec(token.value)
        const embedded = open && registry.resolve(open[2]!.trim().split(/\s+/, 1)[0]!)
        if (!open || !embedded) {
          tokens.push(token)
          continue
        }

        const value = token.value
        const lastEnd = value.length - (value.endsWith('\r\n') ? 2 : /[\r\n]$/.test(value) ? 1 : 0)
        const lastStart = Math.max(value.lastIndexOf('\n', lastEnd - 1), value.lastIndexOf('\r', lastEnd - 1)) + 1
        const close = /^ {0,3}(`+|~+)[ \t]*$/.exec(value.slice(lastStart, lastEnd))
        const end = close && lastStart >= open[0].length && close[1]![0] === open[1]![0]
          && close[1]!.length >= open[1]!.length ? lastStart : value.length
        const start = token.start + open[0].length
        const body = value.slice(open[0].length, end)
        tokens.push({ ...token, value: open[0], end: start })
        // Markdown inside a fence stays lexical; nested fences do not inject languages again.
        const inner = embedded.name === 'markdown' ? markdown.tokenize!(body, embedded) : tokenize(body, embedded)
        for (const child of inner) tokens.push({ ...child, start: child.start + start, end: child.end + start })
        if (end < value.length) tokens.push({ ...token, value: value.slice(end), start: token.start + end })
      }
      return tokens
    },
  }
}
