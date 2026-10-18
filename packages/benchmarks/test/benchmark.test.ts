import { expect, test } from 'bun:test'
import { corpus } from '../../kirari/test/corpus/fixtures.js'
import { highlight, languageNames } from '../adapters.js'
import { inputs, summarize, textFromHTML } from '../benchmark.js'

test('statistics preserve samples and calculate the median of batch means', () => {
  const values = [9, 1, 3, 7]
  expect(summarize(values)).toEqual({ medianMs: 5, minMs: 1, maxMs: 9, samplesMs: values })
  expect(values).toEqual([9, 1, 3, 7])
  expect(summarize([3, 1, 2]).medianMs).toBe(2)
  expect(() => summarize([])).toThrow()
  expect(() => summarize([NaN])).toThrow()
})

test('serializer check decodes exactly once and rejects unexpected tags', () => {
  expect(textFromHTML('<span class="kirari-string">&amp;lt;&lt;&gt;&quot;&#39;</span>\r\n')).toBe('&lt;<>"\'\r\n')
  expect(() => textFromHTML('<img src=x>')).toThrow()
  expect(() => textFromHTML('<span onclick="run()">text</span>')).toThrow()
  for (const raw of ['&copy;', '&#65;', '&#x41;', '&bare']) {
    expect(() => textFromHTML(raw)).toThrow()
    expect(textFromHTML(raw.replace('&', '&amp;'))).toBe(raw)
  }
  expect(textFromHTML('&#039;')).toBe("'")
})

test('scaled cases retain complete fixture units and meet the byte targets', () => {
  const cases = inputs()
  expect(new Set(cases.map(input => input.id)).size).toBe(cases.length)
  for (const language of languageNames) {
    const base = corpus.find(entry => entry.language === language)!.source
    for (const size of [1024, 16384, 262144]) {
      const input = cases.find(entry => entry.id === `${language}/repeated-${size}`)!
      expect(input.source.startsWith(base)).toBe(true)
      expect(Buffer.byteLength(input.source)).toBeGreaterThanOrEqual(size)
      expect(Buffer.byteLength(input.source)).toBeLessThan(size + Buffer.byteLength(base) + 1)
    }
  }
})

test('public adapter preserves and escapes every corpus fixture', () => {
  for (const fixture of corpus) {
    expect(textFromHTML(highlight(fixture.source, fixture.language))).toBe(fixture.source)
  }
})
