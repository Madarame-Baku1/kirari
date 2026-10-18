import { expect, test } from 'bun:test'
import { createRegistry } from '../src/registry.js'
import { languages } from './fixtures/all-languages.js'
import type { Language } from '../src/types.js'

const registry = createRegistry(Object.values(languages))

test('resolves every supplied canonical name without loading definitions itself', () => {
  for (const language of Object.values(languages)) expect(registry.resolve(language.name)).toBe(language)
})

test.each([
  [' JS ', 'javascript'], ['.mjs', 'javascript'], ['C#', 'csharp'], ['c++', 'cpp'],
  ['py', 'python'], ['.YML', 'yaml'], ['bash', 'shell'], ['txt', 'plaintext'],
  ['src/App.TSX', 'tsx'], ['C:\\project\\app.jsx', 'jsx'], ['https://example.com/file.ts?raw#L2', 'typescript'],
  ['config.jsonc', 'jsonc'], ['icon.svg', 'xml'], ['component.vue', 'vue'], ['component.svelte', 'svelte'],
  ['Dockerfile', 'dockerfile'], ['build/Dockerfile.prod', 'dockerfile'], ['.env', 'dotenv'],
  ['config/.env.local', 'dotenv'], ['.env.json', 'dotenv'], ['env.json', 'json'], ['Makefile', 'makefile'], ['build/GNUmakefile', 'makefile'],
  ['etc/nginx.conf', 'nginx'], ['Gemfile', 'ruby'], ['.bashrc', 'shell'],
] as const)('resolves %s as %s', (input, name) => {
  expect(registry.resolve(input)).toBe(languages[name])
})

test('only resolves supplied definitions, without guessing a related language', () => {
  const small = createRegistry([languages.javascript, languages.html, languages.json])
  for (const input of ['tsx', 'app.tsx', 'jsx', 'app.jsx', 'jsonc', 'config.jsonc', 'xml', 'icon.svg', 'vue', 'svelte',
    'python', 'main.py', 'unknown', '', '.env.json', 'Dockerfile.js', 'const answer = 42']) expect(small.resolve(input)).toBeUndefined()
  expect(small.resolve('js')).toBe(languages.javascript)
})

test('canonical custom names win over aliases regardless of registration order', () => {
  const custom: Language = { name: 'JS', rules: [] }
  for (const definitions of [[custom, languages.javascript], [languages.javascript, custom]]) {
    const current = createRegistry(definitions)
    expect(current.resolve('js')).toBe(custom)
    expect(current.resolve('file.js')).toBe(custom)
    expect(current.resolve('javascript')).toBe(languages.javascript)
  }
})

test('an unregistered C# alias does not fall back to C', () => {
  const current = createRegistry([languages.c])
  for (const input of ['c#', 'C#', '.c#', ' C# ']) expect(current.resolve(input)).toBeUndefined()
  for (const input of ['source.c', 'source.c#L1', 'https://example.com/source.c?raw#L1']) {
    expect(current.resolve(input)).toBe(languages.c)
  }
})

test('explicit custom names containing query or fragment delimiters win before filename parsing', () => {
  const custom = ['C#', 'theme#dark', 'theme?preview'].map(name => ({ name, rules: [] }))
  const current = createRegistry([languages.c, languages.csharp, ...custom])
  for (const language of custom) {
    expect(current.resolve(language.name.toUpperCase())).toBe(language)
    expect(current.resolve(`.${language.name}`)).toBe(language)
  }
  expect(current.resolve('source.cs?raw#L1')).toBe(languages.csharp)
})

test('supports custom names safely and rejects duplicate or empty names', () => {
  const custom: Language = { name: 'My-Language', rules: [] }
  const prototype: Language = { name: '__proto__', rules: [] }
  const current = createRegistry([custom, prototype])
  expect(current.resolve(' my-language ')).toBe(custom)
  expect(current.resolve('__proto__')).toBe(prototype)
  expect(current.resolve('constructor')).toBeUndefined()
  expect(() => createRegistry([custom, { ...custom, name: '.MY-LANGUAGE' }])).toThrow(/duplicate/)
  expect(() => createRegistry([{ ...custom, name: ' ' }])).toThrow(/empty/)
})

test('snapshots registration without mutating the input or sharing state', () => {
  const definitions = [Object.freeze({ ...languages.javascript })]
  const current = createRegistry(definitions)
  definitions.push(languages.python)
  expect(current.resolve('py')).toBeUndefined()
  expect(current.resolve('js')).toBe(definitions[0])
  expect(createRegistry(Object.freeze([languages.python])).resolve('js')).toBeUndefined()
  expect(definitions).toEqual([{ ...languages.javascript }, languages.python])
})
