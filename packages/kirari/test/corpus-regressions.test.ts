import { expect, test } from 'bun:test'
import { tokenize } from '../src/core.js'
import { javascript } from '../src/languages/javascript.js'
import { typescript } from '../src/languages/typescript.js'
import { jsx } from '../src/languages/jsx.js'
import { tsx } from '../src/languages/tsx.js'
import { python } from '../src/languages/python.js'
import { shell } from '../src/languages/shell.js'

for (const language of [javascript, typescript, jsx, tsx]) {
  test(`${language.name} treats division after keyword-named properties as operators`, () => {
    for (const member of ['object.return', 'object?.yield', 'object.throw', 'object.in', 'object.of']) {
      const source = `${member} / 2 / 3;`
      const tokens = tokenize(source, language)
      expect(tokens.filter(t => t.type === 'regex')).toEqual([])
      expect(tokens.filter(t => t.value === '/').map(t => t.type)).toEqual(['operator', 'operator'])
      expect(tokens.map(t => t.value).join('')).toBe(source)
    }
    expect(tokenize('return /x/; yield /y/; throw /z/', language).filter(t => t.type === 'regex').map(t => t.value))
      .toEqual(['/x/', '/y/', '/z/'])
  })
}

for (const language of [jsx, tsx]) {
  test(`${language.name} keeps comparisons after keyword-named properties in code`, () => {
    for (const member of ['object.return', 'object?.yield', 'object.case']) {
      const source = `${member} <Foo > 1; done()`
      const tokens = tokenize(source, language)
      expect(tokens.filter(t => t.type === 'tag')).toEqual([])
      expect(tokens.filter(t => t.type === 'operator').map(t => t.value)).toEqual(member.includes('?.') ? ['?.', '<', '>'] : ['<', '>'])
      expect(tokens).toContainEqual({ type: 'function', value: 'done', start: source.indexOf('done'), end: source.indexOf('done') + 4 })
      expect(tokens.map(t => t.value).join('')).toBe(source)
    }
    expect(tokenize('return <A/>; yield <B/>', language).filter(t => t.type === 'tag').map(t => t.value))
      .toEqual(['A', 'B'])
  })
}

for (const language of [javascript, typescript, jsx, tsx, python]) {
  test(`${language.name} keeps escaped LF and CRLF continuations inside quoted strings`, () => {
    for (const newline of ['\n', '\r\n']) {
      for (const quote of ['"', "'"]) {
        for (const ending of [quote, '', '\\']) {
          const source = quote + 'a\\' + newline + 'b' + ending
          expect(tokenize(source, language)).toEqual([{ type: 'string', value: source, start: 0, end: source.length }])
        }
      }
    }
  })
}

test('shell escaped separators keep a following hash inside the word', () => {
  for (const separator of [' ', '\t', ';', '|', '&', '(', ')']) {
    for (const escapes of [1, 3, 5]) {
      const source = 'echo word' + '\\'.repeat(escapes) + separator + '#literal'
      const tokens = tokenize(source, shell)
      expect(tokens.filter(t => t.type === 'comment')).toEqual([])
      expect(tokens.map(t => t.value).join('')).toBe(source)
    }
  }
})

test('shell unescaped separators still allow comments after paired backslashes', () => {
  for (const separator of [' ', '\t', ';', '|', '&', '(', ')']) {
    for (const escapes of [0, 2, 4]) {
      const source = 'echo word' + '\\'.repeat(escapes) + separator + '#comment'
      expect(tokenize(source, shell).filter(t => t.type === 'comment').map(t => t.value)).toEqual(['#comment'])
    }
  }
})

test.each<[string, string[]]>([
  ['#comment', ['#comment']],
  ['echo word\\\n#literal', []],
  ['echo word\\\n\\\n#literal', []],
  ['echo \\\n#comment', ['#comment']],
  ['echo \\\n\\\n#comment', ['#comment']],
  ['\\\n#comment', ['#comment']],
  ['echo word\\\\\n#comment', ['#comment']],
  ['echo word\\\\\\\n#literal', []],
  ['echo word\\\r\n#comment', ['#comment']],
])('shell comment boundaries survive line continuations in %j', (source, comments) => {
  const tokens = tokenize(source, shell)
  expect(tokens.filter(t => t.type === 'comment').map(t => t.value)).toEqual(comments)
  expect(tokens.map(t => t.value).join('')).toBe(source)
})
