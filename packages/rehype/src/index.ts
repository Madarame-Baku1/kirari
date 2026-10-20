import type { Element, ElementContent, Root } from 'hast'
import { tokenize } from '@vortexlabs/kirari/core'
import type { Language, RenderOptions, Token } from '@vortexlabs/kirari/core'
import { createRegistry } from '@vortexlabs/kirari/registry'
import type { LanguageRegistry } from '@vortexlabs/kirari/registry'

export interface Options extends RenderOptions {
  readonly languages?: readonly Language[]
  readonly lines?: boolean
  readonly lineClassName?: (line: { readonly number: number; readonly start: number; readonly end: number }) => string | undefined
}

const classes = (value: unknown): string[] => {
  return (Array.isArray(value) ? value : [value])
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .flatMap(item => String(item).split(/[\t\n\f\r ]+/).filter(Boolean))
}

const lineRanges = (meta: unknown): [number, number][] => {
  if (typeof meta !== 'string') return []
  const ranges: [number, number][] = []
  let quote = ''
  let start = -1
  let depth = 0
  for (let index = 0; index < meta.length; index++) {
    const char = meta[index]!
    if (char === '\\') {
      index++
      start = -1
    } else if (quote) {
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") {
      quote = char
      start = -1
    } else if (char === '{') {
      depth++
      start = depth === 1 && (index === 0 || /\s/.test(meta[index - 1]!)) ? index + 1 : -1
    } else if (char === '}') {
      depth = Math.max(0, depth - 1)
      if (depth !== 0 || start < 0) continue
      const body = meta.slice(start, index)
      if ((index + 1 === meta.length || /\s/.test(meta[index + 1]!))
        && /^\s*[1-9]\d*(?:\s*-\s*[1-9]\d*)?(?:\s*,\s*[1-9]\d*(?:\s*-\s*[1-9]\d*)?)*\s*$/.test(body)) {
        const parsed = body.split(',').map(part => {
          const [first, last = first] = part.split('-').map(Number)
          return [first!, last!] as [number, number]
        })
        if (parsed.every(([first, last]) => Number.isSafeInteger(first) && Number.isSafeInteger(last) && first <= last)) {
          for (const range of parsed) ranges.push(range)
        }
      }
      start = -1
    } else if (start >= 0 && !/[\d\s,-]/.test(char)) {
      start = -1
    }
  }
  return ranges.sort((left, right) => left[0] - right[0])
}

const tokenNodes = (source: string, tokens: readonly Token[], options: Options, ranges: readonly [number, number][]): ElementContent[] => {
  let offset = 0
  for (const token of tokens) {
    if (token.start !== offset || token.end !== offset + token.value.length
      || token.value !== source.slice(token.start, token.end)) {
      throw new RangeError('Kirari: tokens must cover the original code contiguously')
    }
    offset = token.end
  }
  if (offset !== source.length) throw new RangeError('Kirari: tokens must cover the original code contiguously')

  // Resolve callbacks once before any multiline token is split into line spans.
  const tokenClasses = tokens.map(token => {
    const mapped = options.classes && Object.hasOwn(options.classes, token.type) ? options.classes[token.type] : undefined
    const extra = [mapped, options.className?.(token)].filter(Boolean).join(' ')
    return token.type === 'text' && !extra ? [] : classes(`kirari-${token.type}${extra ? ` ${extra}` : ''}`)
  })
  let tokenIndex = 0
  const rangeNodes = (start: number, end: number): ElementContent[] => {
    const nodes: ElementContent[] = []
    while (start < end) {
      while (tokens[tokenIndex]!.end <= start) tokenIndex++
      const token = tokens[tokenIndex]!
      const stop = Math.min(end, token.end)
      const text = { type: 'text' as const, value: source.slice(start, stop) }
      const className = tokenClasses[tokenIndex]!
      nodes.push(className.length ? { type: 'element', tagName: 'span', properties: { className }, children: [text] } : text)
      start = stop
    }
    return nodes
  }

  if (!options.lines && ranges.length === 0) return rangeNodes(0, source.length)
  const nodes: ElementContent[] = []
  const newline = /\r\n|\r|\n/g
  let start = 0
  let number = 1
  let rangeIndex = 0
  do {
    const match = newline.exec(source)
    const end = match?.index ?? source.length
    const className = ['kirari-line', ...classes(options.lineClassName?.({ number, start, end }))]
    while (ranges[rangeIndex] && ranges[rangeIndex]![1] < number) rangeIndex++
    if (ranges[rangeIndex] && ranges[rangeIndex]![0] <= number) className.push('kirari-line-highlighted')
    nodes.push({ type: 'element', tagName: 'span', properties: { className, dataLine: number }, children: rangeNodes(start, end) })
    if (!match) break
    nodes.push({ type: 'text', value: match[0] })
    start = end + match[0].length
    number++
  } while (true)
  return nodes
}

const optsOut = (classNames: readonly string[]): boolean => {
  return classNames.some(name => name === 'no-highlight' || name === 'nohighlight')
}

/** Replaces the text of a `<code>` with highlighted nodes; returns whether it did. */
const highlightCode = (code: ElementContent, registry: LanguageRegistry, options: Options): boolean => {
  if (code.type !== 'element' || code.tagName !== 'code' || code.children.some(node => node.type !== 'text')) return false
  const codeClasses = classes(code.properties.className)
  if (optsOut(codeClasses)) return false
  const language = codeClasses.filter(name => name.startsWith('language-')).map(name => registry.resolve(name.slice(9))).find(Boolean)
  if (!language) return false
  const source = code.children.map(node => node.type === 'text' ? node.value : '').join('')
  const meta = code.data && 'meta' in code.data ? code.data.meta : undefined
  code.children = tokenNodes(source, tokenize(source, language), options, lineRanges(meta))
  return true
}

const rehypeKirari = (options: Options = {}): (tree: Root) => undefined => {
  const registry = createRegistry(options.languages ?? [])
  return tree => {
    const parents: (Root | Element)[] = [tree]
    while (parents.length) {
      const parent = parents.pop()!
      for (const child of parent.children) {
        if (child.type === 'element' && child.tagName === 'pre') {
          const preClasses = classes(child.properties.className)
          if (optsOut(preClasses)) continue
          for (const code of child.children) {
            if (highlightCode(code, registry, options)) child.properties.className = [...new Set([...preClasses, 'kirari'])]
          }
          continue
        }
        // MDX JSX nodes can contain normal HAST children without being elements themselves.
        if ('children' in child && Array.isArray(child.children)) parents.push(child as Element)
      }
    }
    return undefined
  }
}
export default rehypeKirari
