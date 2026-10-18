import { describe, expect, test } from 'bun:test'
import { highlight, tokenize } from '../src/index.js'
import { javascript } from '../src/languages/javascript.js'
import { typescript } from '../src/languages/typescript.js'
import { json } from '../src/languages/json.js'
import { jsonc } from '../src/languages/jsonc.js'
import { python } from '../src/languages/python.js'
import { shell } from '../src/languages/shell.js'
import { diff } from '../src/languages/diff.js'
import { plaintext } from '../src/languages/plaintext.js'
import type { Language } from '../src/types.js'

const pairs = (source: string, language = javascript) => tokenize(source, language)
  .filter(t => t.type !== 'text').map(t => [t.type, t.value])

describe('JavaScript', () => {
  test('distinguishes variables, keyword-named properties, calls, and literals', () => {
    expect(pairs('const café = api?.default(42, true, null)')).toEqual([
      ['keyword', 'const'], ['variable', 'café'], ['operator', '='],
      ['variable', 'api'], ['operator', '?.'], ['property', 'default'],
      ['punctuation', '('], ['number', '42'], ['punctuation', ','],
      ['boolean', 'true'], ['punctuation', ','], ['null', 'null'], ['punctuation', ')'],
    ])
    expect(pairs('function greet(name) { return name }')).toContainEqual(['function', 'greet'])
    expect(pairs('const obj = { count: value }')).toContainEqual(['property', 'count'])
    expect(pairs('class Widget {}')).toContainEqual(['type', 'Widget'])
  })

  test('handles nested templates, braces, escaped interpolation, and comments', () => {
    const source = '`hi ${format({ name: `inner ${user.name}` /* } */ })}! \\${literal}`'
    const tokens = tokenize(source)
    expect(tokens.map(t => t.value).join('')).toBe(source)
    expect(pairs(source)).toContainEqual(['variable', 'user'])
    expect(pairs(source)).toContainEqual(['property', 'name'])
    expect(pairs(source)).toContainEqual(['comment', '/* } */'])
    expect(pairs(source).at(-1)).toEqual(['string', '! \\${literal}`'])
  })

  test('distinguishes regex, division, and comments', () => {
    const source = 'const re = /a[\\/]b+/gi; total / count; // /comment/\nreturn /x/;'
    expect(pairs(source).filter(t => t[0] === 'regex')).toEqual([['regex', '/a[\\/]b+/gi'], ['regex', '/x/']])
    expect(pairs(source)).toContainEqual(['operator', '/'])
    expect(pairs(source)).toContainEqual(['comment', '// /comment/'])
  })

  test.each(['\u2028', '\u2029'])('ends comments and regex candidates at Unicode separator %j', separator => {
    expect(pairs(`// comment${separator}const value = 1`)).toContainEqual(['keyword', 'const'])
    expect(pairs(`#!/usr/bin/env node${separator}const value = 1`)).toContainEqual(['keyword', 'const'])
    expect(pairs(`/a${separator}b/`).some(t => t[0] === 'regex')).toBe(false)
  })

  test('a failed regex candidate does not hide a later valid regex', () => {
    expect(pairs('/[ /x/')).toContainEqual(['regex', '/x/'])
  })

  test('supports numeric bases, separators, exponents, and bigint', () => {
    expect(pairs('0xff 0b101 0o77 1_000 1.5e-3 42n .25').filter(t => t[0] === 'number').map(t => t[1]))
      .toEqual(['0xff', '0b101', '0o77', '1_000', '1.5e-3', '42n', '.25'])
  })

  test('accepts custom rules and keyword sets without changing the original', () => {
    const custom: Language = {
      ...javascript,
      keywords: [...javascript.keywords!, 'custom'],
      rules: [{ type: 'constant', pattern: /\bAPI_KEY\b/ }, ...javascript.rules],
    }
    expect(pairs('custom API_KEY', custom)).toEqual([['keyword', 'custom'], ['constant', 'API_KEY']])
    expect(pairs('custom API_KEY')).toEqual([['variable', 'custom'], ['variable', 'API_KEY']])
  })

  test('returns an HTML fragment and no inline styles', () => {
    const html = highlight('const count = 1', { classes: { variable: 'my-variable' } })
    expect(html).toContain('<span class="kirari-variable my-variable">count</span>')
    expect(html).not.toContain('<pre')
    expect(html).not.toContain('style=')
    expect(highlight('')).toBe('')
  })
})

for (const language of [javascript, typescript, json, jsonc, python, shell]) {
  test(`${language.name} consumes unfinished strings with dangling escapes`, () => {
    const source = '"' + '\\"'.repeat(8) + '\\'
    expect(pairs(source, language)).toEqual([['string', source]])
  })
}

test('TypeScript extends JavaScript with types and keywords', () => {
  expect(pairs('interface User { name: string; ready: boolean }', typescript)).toContainEqual(['keyword', 'interface'])
  expect(pairs('const value: number = 1 satisfies number', typescript)).toContainEqual(['type', 'number'])
  expect(pairs('type ID = string', typescript)).toContainEqual(['keyword', 'type'])
})

test('JSON distinguishes properties, values, and JSONC comments', () => {
  expect(pairs('{"name": "Ada", "ok": true, "count": -1.5e2, "none": null}', json)).toEqual([
    ['punctuation', '{'], ['property', '"name"'], ['punctuation', ':'], ['string', '"Ada"'],
    ['punctuation', ','], ['property', '"ok"'], ['punctuation', ':'], ['boolean', 'true'],
    ['punctuation', ','], ['property', '"count"'], ['punctuation', ':'], ['number', '-1.5e2'],
    ['punctuation', ','], ['property', '"none"'], ['punctuation', ':'], ['null', 'null'], ['punctuation', '}'],
  ])
  expect(pairs('// note\n{"a": 1}', json).some(t => t[0] === 'comment')).toBe(false)
  expect(pairs('// note\n{"a": 1}', jsonc)).toContainEqual(['comment', '// note'])
})

test('Python recognizes triple strings, keywords, calls, and hash comments', () => {
  const result = pairs('def greet(name):\n  """doc\nstring"""\n  print(name) # hi\n  return True', python)
  expect(result).toContainEqual(['keyword', 'def'])
  expect(result).toContainEqual(['function', 'greet'])
  expect(result).toContainEqual(['string', '"""doc\nstring"""'])
  expect(result).toContainEqual(['comment', '# hi'])
  expect(result).toContainEqual(['boolean', 'True'])
})

test('Shell recognizes variables, assignment names, keywords, strings, and comments', () => {
  const result = pairs('if true; then\n  NAME=test\n  echo $NAME ${HOME} "$USER" # hi\nfi', shell)
  expect(result).toContainEqual(['keyword', 'then'])
  expect(result).toContainEqual(['variable', 'NAME'])
  expect(result).toContainEqual(['variable', '$NAME'])
  expect(result).toContainEqual(['variable', '${HOME}'])
  expect(result).toContainEqual(['string', '"'])
  expect(result).toContainEqual(['variable', '$USER'])
  expect(result).toContainEqual(['comment', '# hi'])
})

test('Diff distinguishes file headers, hunks, additions, deletions, and context', () => {
  expect(pairs('--- a/file\r\n+++ b/file\r\n@@ -1 +1 @@\n-old\n+new\n same\n', diff)).toEqual([
    ['heading', '--- a/file'], ['heading', '+++ b/file'], ['heading', '@@ -1 +1 @@'],
    ['deleted', '-old'], ['inserted', '+new'],
  ])
})

test('plaintext escapes arbitrary markup without highlighting it', () => {
  expect(highlight('<script>alert("hi")</script>', { language: plaintext }))
    .toBe('&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;')
})

const samples = [
  '', ' ', '\r\n\t', 'const café = "🙂";\r\n', '"unterminated\\', "'unfinished",
  '/* unfinished', '`unfinished ${a + `inner ${b}`', '`a ${ {x: "}"}.x } z`',
  '// hi\nlet x = 1\n', '</span><img src=x onerror=alert(1)>', '𐐀中文\u0000',
]
for (const language of [javascript, typescript, json, jsonc, python, shell, diff, plaintext]) {
  test(`${language.name} preserves source and offsets for incomplete and unusual input`, () => {
    for (const source of samples) {
      const tokens = tokenize(source, language)
      expect(tokens.map(t => t.value).join('')).toBe(source)
      let offset = 0
      for (const token of tokens) {
        expect(token.start).toBe(offset)
        expect(token.end).toBeGreaterThan(token.start)
        expect(source.slice(token.start, token.end)).toBe(token.value)
        offset = token.end
      }
      expect(offset).toBe(source.length)
    }
  })
}
