import { describe, expect, test } from 'bun:test'
import { render, tokenize } from '../src/core.js'
import { javascript } from '../src/languages/javascript.js'
import { typescript } from '../src/languages/typescript.js'
import { tsx } from '../src/languages/tsx.js'
import { python } from '../src/languages/python.js'
import { json } from '../src/languages/json.js'
import { shell } from '../src/languages/shell.js'
import type { Token } from '../src/types.js'
import { corpus } from './corpus/fixtures.js'
import type { CorpusAssertion } from './corpus/fixtures.js'

const languages = { javascript, typescript, tsx, python, json, shell }

const annotationStart = (source: string, annotation: CorpusAssertion): number => {
  expect(annotation.text.length).toBeGreaterThan(0)
  const occurrence = annotation.occurrence ?? 0
  expect(Number.isInteger(occurrence) && occurrence >= 0).toBe(true)
  const positions: number[] = []
  for (let start = source.indexOf(annotation.text); start !== -1; start = source.indexOf(annotation.text, start + 1)) {
    positions.push(start)
  }
  expect(positions.length, `missing annotation ${JSON.stringify(annotation.text)}`).toBeGreaterThan(occurrence)
  if (annotation.occurrence === undefined) {
    expect(positions.length, `ambiguous annotation ${JSON.stringify(annotation.text)}; specify occurrence`).toBe(1)
  }
  return positions[occurrence]!
}

const assertSpan = (tokens: readonly Token[], start: number, length: number, type: string): void => {
  const end = start + length
  let covered = start
  for (const token of tokens) {
    if (token.end <= start || token.start >= end) continue
    expect(token.type, `UTF-16 span ${start}:${end}, token ${JSON.stringify(token)}`).toBe(type)
    expect(Math.max(token.start, start)).toBe(covered)
    covered = Math.min(token.end, end)
  }
  expect(covered).toBe(end)
}

const assertPreserved = (source: string, tokens: readonly Token[]): void => {
  let offset = 0
  for (const token of tokens) {
    expect(Number.isInteger(token.start) && Number.isInteger(token.end)).toBe(true)
    expect(token.start).toBe(offset)
    expect(token.end).toBeGreaterThan(token.start)
    expect(token.end).toBeLessThanOrEqual(source.length)
    expect(token.value).toBe(source.slice(token.start, token.end))
    offset = token.end
  }
  expect(offset).toBe(source.length)
  expect(tokens.map(token => token.value).join('')).toBe(source)

  const html = render(tokens)
  // Only renderer-owned spans may remain markup; decode once so literal entities survive.
  const escaped = html.replace(/<span class="kirari-[a-z]+">|<\/span>/g, '')
  expect(escaped).not.toMatch(/[<>"']/)
  expect(escaped.replace(/&(?:amp|lt|gt|quot|#39);/g, '')).not.toContain('&')
  const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }
  expect(escaped.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => entities[entity]!)).toBe(source)
  expect(render(tokens)).toBe(html)
}

test('corpus annotations identify existing, unambiguous spans and separate known gaps', () => {
  expect(new Set(corpus.map(fixture => fixture.id)).size).toBe(corpus.length)
  for (const fixture of corpus) {
    expect(fixture.assertions.length).toBeGreaterThan(0)
    const annotations = [...fixture.assertions, ...fixture.gaps ?? []]
    const assigned = new Map<number, string>()
    for (const annotation of annotations) {
      const start = annotationStart(fixture.source, annotation)
      expect(annotation.type).toMatch(/^[a-z]+$/)
      for (let index = start; index < start + annotation.text.length; index++) {
        const existing = assigned.get(index)
        expect(existing === undefined || existing === annotation.type, `${fixture.id}: contradictory annotation at ${index}`).toBe(true)
        assigned.set(index, annotation.type)
      }
    }
    for (const gap of fixture.gaps ?? []) expect(gap.reason.trim().length).toBeGreaterThan(0)
  }
})

test('span assertions cover the complete annotated range, including split tokens', () => {
  const tokens = [
    { type: 'string', value: 'ab', start: 0, end: 2 },
    { type: 'string', value: 'cd', start: 2, end: 4 },
  ]
  assertSpan(tokens, 1, 3, 'string')
  expect(() => assertSpan([{ ...tokens[0]! }, { ...tokens[1]!, type: 'text' }], 1, 3, 'string')).toThrow()
  expect(() => assertSpan([tokens[0]!], 1, 3, 'string')).toThrow()
})

for (const fixture of corpus) {
  describe(`${fixture.language}: ${fixture.id}`, () => {
    test('matches manually annotated spans', () => {
      const tokens = tokenize(fixture.source, languages[fixture.language])
      for (const assertion of fixture.assertions) {
        assertSpan(tokens, annotationStart(fixture.source, assertion), assertion.text.length, assertion.type)
      }
    })

    test('preserves, escapes, and repeats every UTF-16 prefix', () => {
      for (let end = 0; end <= fixture.source.length; end++) {
        const source = fixture.source.slice(0, end)
        const tokens = tokenize(source, languages[fixture.language])
        assertPreserved(source, tokens)
        expect(tokenize(source, languages[fixture.language])).toEqual(tokens)
      }
    })

    for (const gap of fixture.gaps ?? []) {
      test.todo(`known gap: ${JSON.stringify(gap.text)} → ${gap.type}: ${gap.reason}`, () => {
        const tokens = tokenize(fixture.source, languages[fixture.language])
        assertSpan(tokens, annotationStart(fixture.source, gap), gap.text.length, gap.type)
      })
    }
  })
}
