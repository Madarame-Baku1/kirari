import { expect, test } from 'bun:test'
import { tokenize, highlight } from '../src/index.js'
import { jsx } from '../src/languages/jsx.js'
import { tsx } from '../src/languages/tsx.js'
import { html } from '../src/languages/html.js'
import { xml } from '../src/languages/xml.js'

const pairs = (source: string, language = jsx) => tokenize(source, language).map(t => [t.type, t.value])

test('JSX highlights elements, attributes, entities and JavaScript expressions', () => {
  const source = 'const view = <Button disabled title="a > b" onClick={() => save(user.name)}>Hello &amp; {name}<Icon /></Button>'
  const result = pairs(source)
  for (const expected of [
    ['tag', 'Button'], ['tag', 'Icon'], ['attribute', 'disabled'], ['attribute', 'onClick'],
    ['string', '"a > b"'], ['function', 'save'], ['property', 'name'],
    ['text', 'Hello '], ['entity', '&amp;'], ['variable', 'name'],
  ]) expect(result).toContainEqual(expected)
  expect(highlight(source, { language: jsx })).toContain('class="kirari-tag">Button</span>')
})

test('nested JSX expressions preserve template state and resume outer JavaScript', () => {
  const source = 'const view = <>{items.map(item => <Row key={item.id}>{`Hi ${item.ok ? <b>{item.name}</b> : "!"}`}</Row>)}</>; done()'
  const result = pairs(source)
  expect(result).toContainEqual(['tag', 'Row'])
  expect(result).toContainEqual(['tag', 'b'])
  expect(result).toContainEqual(['property', 'name'])
  expect(result).toContainEqual(['string', '`'])
  expect(result).toContainEqual(['function', 'done'])
  expect(tokenize(source, jsx).map(t => t.value).join('')).toBe(source)
})

test('comparison operators and TSX generic arrows are not tags', () => {
  expect(pairs('a<b && c>d').filter(t => t[0] === 'tag')).toEqual([])
  expect(pairs('const id = <T,>(value: T): T => value', tsx).filter(t => t[0] === 'tag')).toEqual([])
  expect(pairs('const id = <T extends object>(value: T) => value', tsx).filter(t => t[0] === 'tag')).toEqual([])
  const result = pairs('const view: unknown = <Card active={true} />', tsx)
  expect(result).toContainEqual(['type', 'unknown'])
  expect(result).toContainEqual(['tag', 'Card'])
})

test('JSX strings, comments and regexes do not start elements', () => {
  const result = pairs('const a = "<A/>"; /* <B/> */ const re = /<C\\/>/; const view = <D>{/}/.test(x)}</D>')
  expect(result.filter(t => t[0] === 'tag').map(t => t[1])).toEqual(['D', 'D'])
  expect(result).toContainEqual(['regex', '/}/'])
})

test('HTML separates tag attributes from text and embeds script/style', () => {
  const source = '<!DOCTYPE html><!-- hi --><div class="box" hidden>&lt;hello&gt;</div><script>const count = 1</script><style>.box { color: red }</style>'
  const result = pairs(source, html)
  for (const expected of [
    ['comment', '<!-- hi -->'], ['tag', 'div'], ['attribute', 'class'], ['attribute', 'hidden'],
    ['entity', '&lt;'], ['text', 'hello'], ['keyword', 'const'], ['variable', 'count'], ['property', 'color'],
  ]) expect(result).toContainEqual(expected)
  expect(result.filter(t => t[0] === 'attribute').some(t => t[1] === 'hello')).toBe(false)
})

test('HTML raw text and XML CDATA preserve apparent markup', () => {
  expect(pairs('<textarea><b>literal</b></textarea>', html)).toContainEqual(['text', '<b>literal</b>'])
  const result = pairs('<?xml version="1.0"?><root xmlns:x="urn:test"><![CDATA[<b>raw</b>]]><x:item /></root>', xml)
  expect(result).toContainEqual(['tag', 'x:item'])
  expect(result).toContainEqual(['attribute', 'xmlns:x'])
  expect(result).toContainEqual(['string', '<![CDATA[<b>raw</b>]]>'])
})

test('literal angle brackets in markup prose do not start tags', () => {
  const source = 'one < two &amp; three > four'
  expect(pairs(source, html).filter(t => t[0] === 'tag' || t[0] === 'attribute')).toEqual([])
  expect(tokenize(source, html).map(t => t.value).join('')).toBe(source)
})

for (const language of [jsx, tsx, html, xml]) {
  test(`${language.name} preserves malformed input and offsets`, () => {
    for (const source of ['', '🙂\r\n<div title="unfinished', '<div>{`hi ${x', '<><A /></>', '<!-- incomplete', '<<<', '<x a={"}"}>text</x>', '<div>{\n/*comment*/\n}</div>']) {
      const tokens = tokenize(source, language)
      expect(tokens.map(t => t.value).join('')).toBe(source)
      let end = 0
      for (const token of tokens) {
        expect(token.start).toBe(end)
        expect(token.end).toBeGreaterThan(token.start)
        expect(token.value).toBe(source.slice(token.start, token.end))
        end = token.end
      }
      expect(end).toBe(source.length)
    }
  })
}

test('deeply nested elements do not recurse through the JavaScript call stack', () => {
  const source = '<a>'.repeat(5000) + 'text' + '</a>'.repeat(5000)
  expect(tokenize(source, jsx).map(t => t.value).join('')).toBe(source)
})
