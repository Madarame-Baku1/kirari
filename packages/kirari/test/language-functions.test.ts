import { expect, test } from 'bun:test'
import { tokenize } from '../src/core.js'
import * as languages from '../src/languages.js'
import { createTokenStream } from '../src/stream.js'
import type { Token } from '../src/types.js'
import { functionCorpus, nonFunctionCorpus, ordinaryBindings } from './corpus/function-fixtures.js'

const target = (tokens: readonly Token[]) => tokens.find(token => /^(?:[$@]|r#|[`"]|@")?target[`"]?$/i.test(token.value))

test('function corpus accounts for every shipped language', () => {
  expect([...Object.keys(functionCorpus), ...Object.keys(nonFunctionCorpus)].sort()).toEqual(Object.keys(languages).sort())
})

for (const [name, language] of Object.entries(languages)) {
  const key = name as keyof typeof languages
  const sources = functionCorpus[key] ?? [nonFunctionCorpus[key]!]
  test(`${name}: function declarations and literals`, () => {
    for (const source of functionCorpus[key] ?? []) {
      expect(target(tokenize(source, language))?.type, source).toBe('function')
    }
    if (nonFunctionCorpus[key]) expect(tokenize(nonFunctionCorpus[key], language).some(token => token.type === 'function')).toBe(false)
    for (const source of ordinaryBindings[key] ?? []) {
      expect(target(tokenize(source, language)), source).toBeDefined()
      expect(target(tokenize(source, language))?.type, source).not.toBe('function')
    }
  })

  test(`${name}: function highlighting preserves source and streamed prefixes`, () => {
    for (const source of [...sources, ...ordinaryBindings[key] ?? []]) {
      const stream = createTokenStream(language)
      const accumulated: Token[] = []
      for (let end = 1; end <= source.length; end++) {
        const patch = stream.write(source[end - 1]!)
        while (accumulated.length && accumulated.at(-1)!.start >= patch.from) accumulated.pop()
        accumulated.push(...patch.tokens)
        const prefix = source.slice(0, end)
        expect(accumulated).toEqual(tokenize(prefix, language))
        expect(accumulated.map(token => token.value).join('')).toBe(prefix)
        let offset = 0
        for (const token of accumulated) {
          expect(token.start).toBe(offset)
          expect(token.value).toBe(prefix.slice(token.start, token.end))
          offset = token.end
        }
        expect(offset).toBe(end)
      }
      stream.end()
    }
  })
}

test('custom grammars do not inherit built-in function conventions', () => {
  for (const name of ['custom', 'constructor', '__proto__', 'toString']) {
    const tokens = tokenize('def target = lambda', { name, identifier: /[a-z]+/, rules: [] })
    expect(tokens.some(token => token.type === 'function')).toBe(false)
  }
})

test('qualified declarations retain their receiver and namespace tokens', () => {
  const cases = [
    [languages.ruby, 'def self.target\n 1\nend', 'self', 'keyword'],
    [languages.lua, 'function module.target() end', 'module', 'variable'],
    [languages.kotlin, 'fun String.target() = this', 'String', 'type'],
    [languages.sql, 'CREATE FUNCTION schema.target() RETURNS int;', 'schema', 'keyword'],
  ] as const
  for (const [language, source, name, type] of cases) {
    const tokens = tokenize(source, language)
    expect(target(tokens)?.type).toBe('function')
    expect(tokens.find(token => token.value === name)?.type).toBe(type)
  }
})

test('long incomplete signatures and qualified names retain every source unit', () => {
  for (const [language, unit] of [[languages.python, 'name: Type '], [languages.scala, 'val name = { '], [languages.go, 'name = func('], [languages.lua, 'name.']] as const) {
    const source = unit.repeat(2000)
    expect(tokenize(source, language).map(token => token.value).join('')).toBe(source)
  }
})
