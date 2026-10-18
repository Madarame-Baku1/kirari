import { expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import { tokenize } from '../src/core.js'
import { languages } from './fixtures/all-languages.js'

test('the integration fixture covers every public language module', () => {
  const files = readdirSync(new URL('../src/languages', import.meta.url)).filter(file => file.endsWith('.ts')).map(file => file.slice(0, -3))
  expect(Object.keys(languages).sort()).toEqual(files.sort())
})

const samples = ['', '🙂\r\n𐐀', '"unfinished\\', '/* nested /* comment */ end */',
  '`hi ${<Tag x={"}"} />}`', '<script>if (a < b) {} </script>', '# key\r\nvalue: |\n  text\nnext: true']
const alphabet = Array.from('a🙂𐐀0#/*{}[]<>"\'`$;:=&\\\r\n \t')
let seed = 173
for (let sample = 0; sample < 64; sample++) {
  let source = ''
  for (let index = 0; index < 64; index++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    source += alphabet[seed % alphabet.length]
  }
  samples.push(source)
}

for (const language of Object.values(languages)) {
  test(`${language.name} preserves arbitrary source and contiguous offsets`, () => {
    for (const source of samples) {
      const tokens = tokenize(source, language)
      let end = 0
      for (const token of tokens) {
        expect(token.start).toBe(end)
        expect(token.end).toBeGreaterThan(end)
        expect(source.slice(token.start, token.end)).toBe(token.value)
        end = token.end
      }
      expect(end).toBe(source.length)
      expect(tokens.map(t => t.value).join('')).toBe(source)
    }
  })
}
