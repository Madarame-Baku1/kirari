import { describe, expect, test } from 'bun:test'
import { tokenize, render } from '../src/core.js'
import type { Language, Token } from '../src/types.js'
import { scan } from '../src/tokenize.js'

const language: Language = {
  name: 'test',
  rules: [{ type: 'number', pattern: /\d+/g }],
}

describe('tokenize', () => {
  test('specialized grammars can provide tokens without changing rendering', () => {
    const custom: Language = {
      name: 'custom', rules: [],
      tokenize: source => source ? [{ type: 'tag', value: source, start: 0, end: source.length }] : [],
    }
    expect(render(tokenize('hello', custom))).toBe('<span class="kirari-tag">hello</span>')
  })

  test('incremental scanning stops before consuming another embedded language', () => {
    const scanner = scan('code!', {
      name: 'incremental', rules: [
        { type: 'variable', pattern: /\w+/ },
        { type: 'invalid', pattern: /(?=!)/ },
      ],
    })
    expect(scanner.next().value).toEqual({ type: 'variable', value: 'code', start: 0, end: 4 })
    scanner.return(undefined)
  })
  test.each(['', 'a 123\r\n\t🙂', '\u0000<&>"', 'é𐐀中文\n', '12 34'])('preserves %j', source => {
    const tokens = tokenize(source, language)
    expect(tokens.map(t => t.value).join('')).toBe(source)
    let offset = 0
    for (const token of tokens) {
      expect(token.start).toBe(offset)
      expect(token.end).toBeGreaterThan(token.start)
      expect(token.value).toBe(source.slice(token.start, token.end))
      offset = token.end
    }
    expect(offset).toBe(source.length)
  })

  test('uses ordered custom rules without mutating regex state', () => {
    const pattern = /\d+/gy
    pattern.lastIndex = 4
    const custom: Language = { name: 'custom', rules: [{ type: 'special', pattern }, ...language.rules] }
    const first = tokenize('x12 34', custom)
    expect(first.filter(t => t.type === 'special').map(t => t.value)).toEqual(['12', '34'])
    expect(tokenize('x12 34', custom)).toEqual(first)
    expect(pattern.lastIndex).toBe(4)
  })

  test('rejects a zero-width rule at the matching position', () => {
    expect(() => tokenize('x!', { name: 'bad', rules: [{ type: 'empty', pattern: /(?=!)/ }] })).toThrow(/empty/i)
  })

  test('does not rewind Unicode rules into an already consumed surrogate', () => {
    const tokens = tokenize('🙂!', {
      name: 'unicode',
      rules: [{ type: 'high', pattern: /[\uD800-\uDBFF]/ }, { type: 'char', pattern: /./u }],
    })
    expect(tokens.map(t => t.value).join('')).toBe('🙂!')
    expect(tokens.map(t => [t.start, t.end])).toEqual([[0, 1], [1, 2], [2, 3]])
  })
})

describe('render', () => {
  const token: Token = { type: 'variable', value: '<img src=x onerror="alert(1)">&', start: 0, end: 37 }

  test('escapes source and preserves whitespace without wrappers', () => {
    expect(render([{ type: 'text', value: '\r\n\t<&>"\'', start: 0, end: 8 }])).toBe('\r\n\t&lt;&amp;&gt;&quot;&#39;')
    expect(render([])).toBe('')
    expect(render([token])).toBe('<span class="kirari-variable">&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;</span>')
  })

  test('escapes class callbacks and categories while keeping text literal', () => {
    const html = render([{ ...token, type: 'x" onclick="bad' }], {
      classes: { 'x" onclick="bad': 'a" title="bad' },
      className: () => 'b" onmouseover="bad',
    })
    expect(html).toContain('class="kirari-x&quot; onclick=&quot;bad a&quot; title=&quot;bad b&quot; onmouseover=&quot;bad"')
    expect(html).not.toContain(' onclick="')
    expect(html).not.toContain('<img')
  })

  test('composes classes and passes readonly tokens with offsets to callbacks', () => {
    const original = Object.freeze({ type: 'variable', value: 'count', start: 6, end: 11 })
    expect(render([original], {
      classes: { variable: 'name' },
      className: t => t.start === 6 ? 'selected' : undefined,
    })).toBe('<span class="kirari-variable name selected">count</span>')
    expect(original.type).toBe('variable')
  })
})
