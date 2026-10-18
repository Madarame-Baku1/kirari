import { expect, test } from 'bun:test'
import { tokenize } from '../src/core.js'
import { swift } from '../src/languages/swift.js'
import { csharp } from '../src/languages/csharp.js'
import { php } from '../src/languages/php.js'

test('unfinished raw string prefixes do not repeatedly scan the entire prefix run', () => {
  const start = performance.now()
  for (const [language, prefix] of [[swift, '#'], [csharp, '$'], [php, '$']] as const) {
    const source = prefix.repeat(50_000)
    expect(tokenize(source, language).map(t => t.value).join('')).toBe(source)
  }
  expect(performance.now() - start).toBeLessThan(1500)
}, 5000)

test('C# checks closing raw-string quote runs without overlapping comparisons', () => {
  const source = '"'.repeat(80_000) + 'a' + '"'.repeat(79_999) + 'b'.repeat(80_000)
  const start = performance.now()
  expect(tokenize(source, csharp)).toEqual([{ type: 'string', value: source, start: 0, end: source.length }])
  expect(performance.now() - start).toBeLessThan(1000)
}, 5000)
