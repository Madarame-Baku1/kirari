import { markdown } from './languages/markdown.js'
import { tokenize } from './tokenize.js'
import type { LanguageRegistry } from './registry.js'
import type { Language, Token } from './types.js'

// Offset of the closing fence line in a fenced block, or the block length when it is unclosed.
const closingFenceStart = (value: string, bodyStart: number, fence: string): number => {
  const lastEnd = value.length - (value.endsWith('\r\n') ? 2 : /[\r\n]$/.test(value) ? 1 : 0)
  const lastStart = Math.max(value.lastIndexOf('\n', lastEnd - 1), value.lastIndexOf('\r', lastEnd - 1)) + 1
  const close = /^ {0,3}(`+|~+)[ \t]*$/.exec(value.slice(lastStart, lastEnd))
  return close && lastStart >= bodyStart && close[1]![0] === fence[0]
    && close[1]!.length >= fence.length ? lastStart : value.length
}

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
        const end = closingFenceStart(value, open[0].length, open[1]!)
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
