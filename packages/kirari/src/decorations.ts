import { render } from './render.js'
import type { RenderOptions, Token } from './types.js'

export interface Decoration {
  readonly start: number
  readonly end: number
  readonly className: string
}

export interface DecoratedRenderOptions extends RenderOptions {
  readonly decorations?: readonly Decoration[]
  readonly lines?: boolean
  readonly lineClassName?: (line: { readonly number: number; readonly start: number; readonly end: number }) => string | undefined
}

const splitsSurrogate = (source: string, offset: number): boolean => {
  const before = source.charCodeAt(offset - 1)
  const after = source.charCodeAt(offset)
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff
}

export const renderDecorated = (tokens: readonly Token[], options: DecoratedRenderOptions = {}): string => {
  const decorations = options.decorations ?? []
  if (!options.lines && decorations.length === 0) return render(tokens, options)

  let offset = 0
  for (const token of tokens) {
    if (token.start !== offset || token.end !== offset + token.value.length) {
      throw new RangeError('Decorated tokens must cover contiguous source offsets starting at zero')
    }
    offset = token.end
  }
  const source = tokens.map(token => token.value).join('')
  const events: { offset: number; index: number; entering: boolean }[] = []
  for (const [index, decoration] of decorations.entries()) {
    if (!Number.isInteger(decoration.start) || !Number.isInteger(decoration.end)
      || decoration.start < 0 || decoration.start >= decoration.end || decoration.end > source.length) {
      throw new RangeError('Decoration offsets must be integers with 0 <= start < end <= source length')
    }
    if (splitsSurrogate(source, decoration.start) || splitsSurrogate(source, decoration.end)) {
      throw new RangeError('Decoration offsets must not split a UTF-16 surrogate pair')
    }
    if (typeof decoration.className !== 'string' || !decoration.className.trim()) {
      throw new TypeError('Decoration className must be a nonempty string')
    }
    events.push({ offset: decoration.start, index, entering: true }, { offset: decoration.end, index, entering: false })
  }
  events.sort((a, b) => a.offset - b.offset)

  // Resolve callbacks before splitting so they see each original token exactly once.
  const tokenClasses = tokens.map(token => {
    const mapped = options.classes && Object.hasOwn(options.classes, token.type) ? options.classes[token.type] : undefined
    return [mapped, options.className?.(token)].filter(Boolean).join(' ')
  })
  const active = new Set<number>()
  let activeClasses = ''
  let eventIndex = 0
  let tokenIndex = 0

  const renderRange = (start: number, end: number): string => {
    const parts: string[] = []
    while (start < end) {
      while (tokens[tokenIndex]!.end <= start) tokenIndex++
      let changed = false
      while (eventIndex < events.length && events[eventIndex]!.offset <= start) {
        const event = events[eventIndex++]!
        if (event.entering) active.add(event.index)
        else active.delete(event.index)
        changed = true
      }
      if (changed) {
        activeClasses = [...active].sort((a, b) => a - b).map(index => decorations[index]!.className).join(' ')
      }
      const token = tokens[tokenIndex]!
      const stop = Math.min(end, token.end, events[eventIndex]?.offset ?? end)
      const extra = [tokenClasses[tokenIndex], activeClasses].filter(Boolean).join(' ')
      parts.push(render([{ type: token.type, value: source.slice(start, stop), start, end: stop }], {
        className: () => extra,
      }))
      start = stop
    }
    return parts.join('')
  }

  // shortcut: unwrapped ranges can split CRLF; enable lines to preserve browser newline presentation.
  if (!options.lines) return renderRange(0, source.length)

  const parts: string[] = []
  const newline = /\r\n|\r|\n/g
  let start = 0
  let number = 1
  do {
    const match = newline.exec(source)
    const end = match?.index ?? source.length
    const custom = options.lineClassName?.({ number, start, end })
    const extra = custom ? ` ${render([{ type: 'text', value: custom, start: 0, end: custom.length }])}` : ''
    parts.push(`<span class="kirari-line${extra}" data-line="${number}">${renderRange(start, end)}</span>`)
    if (!match) break
    parts.push(match[0])
    start = end + match[0].length
    number++
  } while (true)
  return parts.join('')
}
