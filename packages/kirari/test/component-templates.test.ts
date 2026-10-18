import { expect, test } from 'bun:test'
import { tokenize, highlight } from '../src/index.js'
import { vue } from '../src/languages/vue.js'
import { svelte } from '../src/languages/svelte.js'

const pairs = (source: string, language = vue) => tokenize(source, language).map(t => [t.type, t.value])

test('Vue highlights directives, interpolation, TypeScript scripts and CSS', () => {
  const source = '<script setup lang="ts">const count: number = 1</script><template><button :disabled="busy" @click="count++">{{ format({ count }) }} &amp;</button></template><style>.box { color: red }</style>'
  const result = pairs(source)
  for (const expected of [
    ['type', 'number'], ['tag', 'button'], ['attribute', ':disabled'], ['variable', 'busy'],
    ['attribute', '@click'], ['operator', '++'], ['function', 'format'], ['entity', '&amp;'], ['property', 'color'],
  ]) expect(result).toContainEqual(expected)
  expect(result.some(([type, value]) => type === 'attribute' && value === 'count')).toBe(false)
})

test('Vue interpolation respects strings, nested objects, regexes and templates', () => {
  const result = pairs('<p>{{ `Hi ${user.name}` + /}}/.source + "}}" + ({ a: 1 }).a }}</p>')
  expect(result).toContainEqual(['regex', '/}}/'])
  expect(result).toContainEqual(['string', '"}}"'])
  expect(result).toContainEqual(['property', 'name'])
  expect(result.filter(([type]) => type === 'tag')).toEqual([['tag', 'p'], ['tag', 'p']])
})

test('Svelte highlights block markers, expression attributes, directives and runes', () => {
  const source = '<script lang="ts">let count: number = $state(0)</script>{#if count > 0}<button onclick={() => count++} class:active={ok}>{count}</button>{:else}<p>empty</p>{/if}{@html content}'
  const result = pairs(source, svelte)
  for (const expected of [
    ['type', 'number'], ['function', '$state'], ['keyword', '#if'], ['keyword', ':else'],
    ['keyword', '/if'], ['keyword', '@html'], ['attribute', 'onclick'], ['attribute', 'class:active'], ['variable', 'content'],
  ]) expect(result).toContainEqual(expected)
})

test('template interpolation does not interpret comment or static attribute contents', () => {
  expect(pairs('<!-- {{oops}} --><p title="{{literal}}">plain</p>').some(([type, value]) => type === 'variable' && /oops|literal/.test(value!))).toBe(false)
  expect(pairs('<!-- {oops} --><p title="{literal}">plain</p>', svelte)).toContainEqual(['string', '"{literal}"'])
})

test('component blocks use the declared language and leave unknown preprocessors as text', () => {
  expect(pairs('<script lang=ts>let a: number</script>')).toContainEqual(['type', 'number'])
  expect(pairs('<script lang="js">const number = 1</script>')).toContainEqual(['variable', 'number'])
  expect(pairs('<style lang="scss">$accent: red;</style>')).toContainEqual(['text', '$accent: red;'])
  expect(pairs('<script src="./external.js"/><p>{{value}}</p>')).toContainEqual(['variable', 'value'])
})

test('template expressions with comparisons do not become JSX', () => {
  for (const [language, source] of [[vue, '<p>{{ value < Foo }}</p>'], [svelte, '<p>{value < Foo}</p>']] as const) {
    expect(pairs(source, language).filter(([type]) => type === 'tag')).toEqual([['tag', 'p'], ['tag', 'p']])
  }
})

test('component title and textarea contents allow expressions but keep markup literal', () => {
  const source = '<svelte:head><title>{pageTitle}</title></svelte:head><textarea><b>{value}</b></textarea>'
  const result = pairs(source, svelte)
  expect(result).toContainEqual(['variable', 'pageTitle'])
  expect(result).toContainEqual(['variable', 'value'])
  expect(result.filter(([type, value]) => type === 'tag' && value === 'b')).toEqual([])
  expect(pairs('<title>{{ pageTitle }}</title>')).toContainEqual(['variable', 'pageTitle'])
  for (const [language, expression] of [[svelte, '{"</textarea>"}'], [vue, '{{ "</textarea>" }}']] as const) {
    const result = pairs(`<textarea>${expression}<b>literal</b></textarea>`, language)
    expect(result.filter(([type, value]) => type === 'tag' && value === 'b')).toEqual([])
  }
})

test('malformed regex probes share failed states across template expressions', () => {
  const start = performance.now()
  for (const [language, fragment] of [[vue, '{{/[}}'], [svelte, '{/q[}']] as const) {
    const source = fragment.repeat(8_000)
    expect(tokenize(source, language).map(token => token.value).join('')).toBe(source)
  }
  expect(performance.now() - start).toBeLessThan(1500)
}, 10_000)

test('component scanners handle long unfinished interpolations without recursion', () => {
  for (const language of [vue, svelte]) {
    const source = '<p>' + '{'.repeat(20_000) + '🙂' + '}'.repeat(20_000) + '</p>'
    const tokens = tokenize(source, language)
    expect(tokens.map(t => t.value).join('')).toBe(source)
  }
})

for (const language of [vue, svelte]) {
  test(`${language.name} preserves unfinished templates and escapes output`, () => {
    for (const source of ['🙂\r\n<p>{{', '<p>{`Hi ${user', '<script lang="ts">const a = "', '<x :prop="unfinished', '<p>{#if foo', '<img onerror="bad">', '<style lang="unknown">$theme</style>']) {
      const tokens = tokenize(source, language)
      expect(tokens.map(t => t.value).join('')).toBe(source)
      let end = 0
      for (const token of tokens) {
        expect(token.start).toBe(end)
        expect(source.slice(token.start, token.end)).toBe(token.value)
        end = token.end
      }
      expect(end).toBe(source.length)
      expect(highlight(source, { language })).not.toContain('<img')
    }
  })
}
