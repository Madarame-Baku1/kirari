import { describe, expect, test } from 'bun:test'
import { render } from '../src/render.js'
import { renderDecorated } from '../src/decorations.js'
import type { Decoration } from '../src/decorations.js'
import type { Token } from '../src/types.js'

const text = (value: string): Token[] => [{ type: 'text', value, start: 0, end: value.length }]

describe('renderDecorated', () => {
  test('defaults to the existing renderer, including arbitrary token offsets', () => {
    const tokens = [{ type: 'keyword', value: '<if>', start: 5, end: 9 }]
    const options = { classes: { keyword: 'custom' }, className: () => 'callback' }
    expect(renderDecorated(tokens)).toBe(render(tokens))
    expect(renderDecorated(tokens, options)).toBe(render(tokens, options))
    expect(renderDecorated(tokens, { ...options, decorations: [] })).toBe(render(tokens, options))
  })

  test('splits ranges across syntax tokens and retains their classes', () => {
    const tokens = [
      { type: 'keyword', value: 'let', start: 0, end: 3 },
      { type: 'text', value: ' ', start: 3, end: 4 },
      { type: 'variable', value: 'name', start: 4, end: 8 },
    ]
    expect(renderDecorated(tokens, { decorations: [{ start: 1, end: 6, className: 'selected' }] })).toBe(
      '<span class="kirari-keyword">l</span><span class="kirari-keyword selected">et</span>'
      + '<span class="kirari-text selected"> </span><span class="kirari-variable selected">na</span>'
      + '<span class="kirari-variable">me</span>',
    )
  })

  test('combines overlapping classes in input order, including touching boundaries', () => {
    expect(renderDecorated(text('abcdef'), { decorations: [
      { start: 2, end: 5, className: 'first' },
      { start: 0, end: 3, className: 'second' },
      { start: 3, end: 4, className: 'third' },
    ] })).toBe('<span class="kirari-text second">ab</span><span class="kirari-text first second">c</span>'
      + '<span class="kirari-text first third">d</span><span class="kirari-text first">e</span>f')
  })

  test('calls custom classes once with original token identities and keeps inputs immutable', () => {
    const original = Object.freeze({ type: 'keyword', value: 'let\nx', start: 0, end: 5 })
    const tokens = Object.freeze([original])
    const decorations = Object.freeze([Object.freeze({ start: 1, end: 5, className: 'selected' })])
    const seen: Token[] = []
    expect(renderDecorated(tokens, {
      decorations,
      lines: true,
      classes: Object.freeze({ keyword: 'mapped' }),
      className: token => { seen.push(token); return 'callback' },
    })).toBe('<span class="kirari-line" data-line="1"><span class="kirari-keyword mapped callback">l</span>'
      + '<span class="kirari-keyword mapped callback selected">et</span></span>\n'
      + '<span class="kirari-line" data-line="2"><span class="kirari-keyword mapped callback selected">x</span></span>')
    expect(seen).toEqual([original])
    expect(seen[0]).toBe(original)
    expect(tokens[0]).toBe(original)
    expect(decorations).toEqual([{ start: 1, end: 5, className: 'selected' }])
  })

  test('ignores inherited class mappings just like render', () => {
    expect(renderDecorated(text('abc'), {
      classes: Object.create({ text: 'inherited' }) as Record<string, string>,
      decorations: [{ start: 1, end: 2, className: 'selected' }],
    })).toBe('a<span class="kirari-text selected">b</span>c')
  })

  test('preserves CRLF, CR, LF and trailing empty lines outside wrappers', () => {
    const seen: { number: number; start: number; end: number }[] = []
    expect(renderDecorated(text('a\r\nb\rc\n'), {
      lines: true,
      decorations: [{ start: 0, end: 7, className: 'selected' }],
      lineClassName: line => { seen.push(line); return line.number === 2 ? 'active' : undefined },
    })).toBe('<span class="kirari-line" data-line="1"><span class="kirari-text selected">a</span></span>\r\n'
      + '<span class="kirari-line active" data-line="2"><span class="kirari-text selected">b</span></span>\r'
      + '<span class="kirari-line" data-line="3"><span class="kirari-text selected">c</span></span>\n'
      + '<span class="kirari-line" data-line="4"></span>')
    expect(seen).toEqual([
      { number: 1, start: 0, end: 1 }, { number: 2, start: 3, end: 4 },
      { number: 3, start: 5, end: 6 }, { number: 4, start: 7, end: 7 },
    ])
  })

  test('handles ranges ending or starting within a CRLF newline', () => {
    expect(renderDecorated(text('a\r\nb'), {
      lines: true,
      decorations: [{ start: 1, end: 2, className: 'newline' }, { start: 2, end: 4, className: 'after' }],
    })).toBe('<span class="kirari-line" data-line="1">a</span>\r\n'
      + '<span class="kirari-line" data-line="2"><span class="kirari-text after">b</span></span>')
  })

  test('preserves CRLF source units with ranges when line wrappers are disabled', () => {
    expect(renderDecorated(text('a\r\nb'), {
      decorations: [{ start: 1, end: 2, className: 'newline' }],
    })).toBe('a<span class="kirari-text newline">\r</span>\nb')
    expect(renderDecorated(text('a\r\nb'), {
      decorations: [{ start: 1, end: 3, className: 'newline' }],
    })).toBe('a<span class="kirari-text newline">\r\n</span>b')
  })

  test('escapes source, category names and every custom class', () => {
    const value = '<img onerror="x">&\''
    const html = renderDecorated([{ ...text(value)[0]!, type: 'x" onclick="bad' }], {
      lines: true,
      classes: { 'x" onclick="bad': 'mapped" title="bad' },
      className: () => 'callback" onmouseover="bad',
      lineClassName: () => 'line"><script>&\'',
      decorations: [{ start: 0, end: value.length, className: 'range" onfocus="bad' }],
    })
    expect(html).toBe('<span class="kirari-line line&quot;&gt;&lt;script&gt;&amp;&#39;" data-line="1">'
      + '<span class="kirari-x&quot; onclick=&quot;bad mapped&quot; title=&quot;bad callback&quot; onmouseover=&quot;bad range&quot; onfocus=&quot;bad">'
      + '&lt;img onerror=&quot;x&quot;&gt;&amp;&#39;</span></span>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).not.toContain(' onclick="')
  })

  test('handles empty sources and requires lines explicitly', () => {
    expect(renderDecorated([])).toBe('')
    expect(renderDecorated([], { lines: true })).toBe('<span class="kirari-line" data-line="1"></span>')
    expect(renderDecorated(text('\n'), { lines: true })).toBe('<span class="kirari-line" data-line="1"></span>\n'
      + '<span class="kirari-line" data-line="2"></span>')
    expect(renderDecorated(text('a'), { lineClassName: () => { throw new Error('not called') } })).toBe('a')
  })

  test('uses UTF-16 offsets and rejects boundaries inside surrogate pairs', () => {
    expect(renderDecorated(text('a🙂é'), {
      decorations: [{ start: 1, end: 3, className: 'emoji' }],
    })).toBe('a<span class="kirari-text emoji">🙂</span>é')
    for (const [start, end] of [[1, 2], [2, 3]]) {
      expect(() => renderDecorated(text('a🙂é'), {
        decorations: [{ start: start!, end: end!, className: 'bad' }],
      })).toThrow(/surrogate/)
    }
  })

  test.each([
    { start: -1, end: 1 }, { start: 1, end: 1 }, { start: 2, end: 1 },
    { start: 0, end: 4 }, { start: 0.5, end: 2 }, { start: 0, end: 1.5 },
    { start: Number.NaN, end: 1 }, { start: 0, end: Number.POSITIVE_INFINITY },
  ])('rejects invalid ranges: %j', range => {
    expect(() => renderDecorated(text('abc'), { decorations: [{ ...range, className: 'bad' }] })).toThrow(RangeError)
  })

  test.each(['', ' \t\n'])('rejects empty class names: %j', className => {
    expect(() => renderDecorated(text('abc'), { decorations: [{ start: 0, end: 1, className }] })).toThrow(TypeError)
  })

  test('rejects noncontiguous or incorrect token offsets when decorating', () => {
    const decoration: Decoration = { start: 0, end: 1, className: 'selected' }
    for (const tokens of [
      [{ type: 'text', value: 'a', start: 1, end: 2 }],
      [{ type: 'text', value: 'abc', start: 0, end: 2 }],
      [{ type: 'text', value: 'a', start: 0, end: 1 }, { type: 'text', value: 'b', start: 2, end: 3 }],
    ]) {
      expect(() => renderDecorated(tokens, { decorations: [decoration] })).toThrow(/contiguous/)
      expect(() => renderDecorated(tokens, { lines: true })).toThrow(/contiguous/)
    }
  })
})
