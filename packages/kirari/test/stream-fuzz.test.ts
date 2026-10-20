import { expect, test } from 'bun:test'
import { createTokenStream } from '../src/stream.js'
import { tokenize } from '../src/tokenize.js'
import { javascript } from '../src/languages/javascript.js'
import { typescript } from '../src/languages/typescript.js'
import { json } from '../src/languages/json.js'
import { python } from '../src/languages/python.js'
import type { Language, Token } from '../src/types.js'

const random = (seed: number) => {
  return () => {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    return seed >>> 0
  }
}

const checkPartitions = (source: string, language: Language, nextSize: () => number) => {
  const stream = createTokenStream(language)
  let tokens: readonly Token[] = []
  let end = 0
  const chunks: string[] = []
  while (end < source.length) {
    const chunk = source.slice(end, end + nextSize())
    chunks.push(chunk)
    end += chunk.length
    const patch = stream.write(chunk)
    const context = `${language.name}: ${JSON.stringify(chunks)}`
    expect(patch.length, context).toBe(end)
    expect(patch.from === 0 || tokens.some(token => token.end === patch.from), context).toBe(true)
    tokens = [...tokens.filter(token => token.start < patch.from), ...patch.tokens]
    expect(tokens, context).toEqual(tokenize(source.slice(0, end), language))
  }
  const patch = stream.end()
  tokens = [...tokens.filter(token => token.start < patch.from), ...patch.tokens]
  expect(tokens).toEqual(tokenize(source, language))
}

const fragments = [
  'name', 'class', 'return', 'true', 'null', 'number', '"key"',
  '0', 'e+', '_', '/', '/[', ']', '//', '/*', '*/', '\\',
  '"', "'", '`', '${', '{', '}', '(', ')', ':', '.', '?.', ';',
  ' ', '\t', '\n', '\r', '\r\n', '\u2028', '\u2029',
  '\ud801', '\udc00', '🙂', '𐐀', '<&>',
]

const sources = [
  'name\n\t(\nname\n)',
  '{name\n\t: true, "key"\r\n: null}',
  'return /[a\\/]*/g\nname()',
  'return /[\n\nname\n()/g',
  '/*\n*/ name\n//\n(\n)',
  '`head\n${`nested\n${name\n()}`}\ntail`\nnext()',
  '"escaped\\\r\nline"\nnext()',
  '\ud801\n\udc00\n𐐀\n()\n🙂\n\ud801\udc00',
  'true\nfalse\rnull\u2028name\u2029()',
]
const pick = random(0x1a2b3c4d)
for (let index = 0; index < 160; index++) {
  let source = ''
  for (let part = 0; part < 12; part++) source += fragments[pick() % fragments.length]!
  sources.push(source)
}

for (const language of [javascript, typescript, json]) {
  test(`stream patches match batch tokens for generated prefixes and partitions: ${language.name}`, () => {
    const partition = random(0x56789abc)
    for (const source of sources) {
      // UTF-16 unit chunks visit every prefix, including split surrogate pairs.
      checkPartitions(source, language, () => 1)
      checkPartitions(source, language, () => 1 + partition() % 11)
    }
  })
}

const pythonFragments = [
  'name', 'x', 'def', 'class', 'lambda', 'lambda x', 'if', 'in', 'pass', 'None', 'self', 'await',
  'name: T', 'x: int', 'y: Callable[[int], str]', '= lambda: 0', 'x = (', 'lambda: 1)', 'def a.b',
  ':', '=', ':=', '(', ')', '[', ']', '{', '}', ',', '.', '*', '**', '&', '<', '>', '>>', '->', '@dec',
  '1', '.5', '"s"', '"""', "'''", 'f"', "f'", 'f"""', '{a}', 'rb"', '#c', '\\',
  '\n', '\n', '\r\n', '\r', '    ',
]

const pythonSources = [
  'handler: int if a < b else str = lambda: 0\nif x > 2:\n    pass\n',
  'value = f"{a\n}" + f\'\'\'\n{b}\n\'\'\'\nnext()\r\n',
]
const pickPython = random(0x2468ace0)
for (let index = 0; index < 400; index++) {
  let source = ''
  const count = 4 + pickPython() % 24
  for (let part = 0; part < count; part++) source += pythonFragments[pickPython() % pythonFragments.length]! + (pickPython() % 3 ? ' ' : '')
  pythonSources.push(source)
}

test('stream patches match batch tokens for generated prefixes and partitions: python', () => {
  const partition = random(0x13579bdf)
  for (const source of pythonSources) {
    checkPartitions(source, python, () => 1)
    checkPartitions(source, python, () => 1 + partition() % 6)
  }
})
