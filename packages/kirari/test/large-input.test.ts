import { expect, test } from 'bun:test'
import { tokenize } from '../src/index.js'

test('large malformed strings and regex probes finish without repeated suffix scans', () => {
  const start = performance.now()
  const string = '"' + '\\"'.repeat(32_000) + '\\'
  expect(tokenize(string)).toEqual([{ type: 'string', value: string, start: 0, end: string.length }])
  const source = '/['.repeat(64_000)
  const tokens = tokenize(source)
  expect(tokens.map(t => t.value).join('')).toBe(source)
  // A generous guard against the multi-second quadratic regressions, not a benchmark.
  expect(performance.now() - start).toBeLessThan(2000)
}, 5000)
