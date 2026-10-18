import { expect, test } from 'bun:test'
import { tokenize } from '../src/tokenize.js'
import type { Language } from '../src/types.js'
import { dart } from '../src/languages/dart.js'
import { scala } from '../src/languages/scala.js'
import { lua } from '../src/languages/lua.js'
import { zig } from '../src/languages/zig.js'
import { glsl } from '../src/languages/glsl.js'
import { r } from '../src/languages/r.js'
import { julia } from '../src/languages/julia.js'
import { groovy } from '../src/languages/groovy.js'

const languages = [dart, scala, lua, zig, glsl, r, julia, groovy]
const pairs = (source: string, language: Language) => tokenize(source, language)
  .filter(token => token.type !== 'text').map(token => [token.type, token.value])

const preserved = (source: string, language: Language) => {
  const tokens = tokenize(source, language)
  expect(tokens.map(token => token.value).join('')).toBe(source)
  let offset = 0
  for (const token of tokens) {
    expect(token.start).toBe(offset)
    expect(token.end).toBeGreaterThan(token.start)
    expect(source.slice(token.start, token.end)).toBe(token.value)
    offset = token.end
  }
  expect(offset).toBe(source.length)
}

test('Dart handles raw and multiline strings, metadata, cascades and symbols', () => {
  const tokens = pairs('@override final String s = r"a\\"; var t = \'\'\'hello $name\nworld\'\'\'; object?..run(); #library.member; 2 ~/ 1; true; null;', dart)
  for (const pair of [
    ['attribute', '@override'], ['keyword', 'final'], ['type', 'String'], ['string', 'r"a\\"'],
    ['string', "'''hello $name\nworld'''"], ['operator', '?..'], ['string', '#library.member'],
    ['operator', '~/'], ['boolean', 'true'], ['null', 'null'],
  ]) expect(tokens).toContainEqual(pair)
})

test('Scala handles interpolation, raw multiline strings, backticks, annotations and type bounds', () => {
  const tokens = pairs('@tailrec def `type`[T <: Any](x: Int): String = s"value $x"; val t = raw"""a\\\nb"""; 42L; true; null;', scala)
  for (const pair of [
    ['attribute', '@tailrec'], ['keyword', 'def'], ['variable', '`type`'], ['operator', '<:'],
    ['type', 'Int'], ['string', 's"value $x"'], ['string', 'raw"""a\\\nb"""'],
    ['number', '42L'], ['boolean', 'true'], ['null', 'null'],
  ]) expect(tokens).toContainEqual(pair)
  expect(pairs("'x' 'symbol", scala)).toEqual([['string', "'x'"], ['string', "'symbol"]])
})

test('Lua distinguishes long strings and comments with exact delimiter levels', () => {
  const tokens = pairs('local s = [==[a ]=] "false"\n]==]; --[=[ outer --[[ inner ]] ]=]\nreturn #s // 2 ~= nil and true', lua)
  for (const pair of [
    ['keyword', 'local'], ['string', '[==[a ]=] "false"\n]==]'],
    ['comment', '--[=[ outer --[[ inner ]] ]=]'], ['keyword', 'return'],
    ['operator', '#'], ['operator', '//'], ['operator', '~='], ['null', 'nil'], ['boolean', 'true'],
  ]) expect(tokens).toContainEqual(pair)
  expect(pairs('--[= malformed\ntrue', lua)).toEqual([['comment', '--[= malformed'], ['boolean', 'true']])
  for (const source of ['"a\\z \r\n b"', '"a\\\r\nb"']) expect(pairs(source, lua)).toEqual([['string', source]])
  expect(pairs('0x1.fp+2 .. .5', lua)).toEqual([['number', '0x1.fp+2'], ['operator', '..'], ['number', '.5']])
})

test('Zig handles builtins, arbitrary integer widths, quoted identifiers and multiline string lines', () => {
  const tokens = pairs('const @"error" = @as(u37, 0xff); const text = \\\\hello "world"\n  \\\\second\n; var x: usize = undefined; x +%= 1;', zig)
  for (const pair of [
    ['keyword', 'const'], ['variable', '@"error"'], ['function', '@as'], ['type', 'u37'], ['number', '0xff'],
    ['string', '\\\\hello "world"'], ['string', '\\\\second'], ['type', 'usize'], ['null', 'undefined'], ['operator', '+%='],
  ]) expect(tokens).toContainEqual(pair)
  expect(pairs('"// string" // "comment"', zig)).toEqual([['string', '"// string"'], ['comment', '// "comment"']])
})

test('GLSL handles directives, vector/matrix/sampler types, qualifiers and builtins', () => {
  const tokens = pairs('#version 450\nlayout(location = 0) in vec3 pos; uniform sampler2DShadow map; dmat3x4 transform; void main() { gl_Position = vec4(pos, 1.0f); }', glsl)
  for (const pair of [
    ['keyword', '#version 450'], ['keyword', 'layout'], ['keyword', 'uniform'], ['type', 'vec3'],
    ['type', 'sampler2DShadow'], ['type', 'dmat3x4'], ['type', 'void'], ['function', 'main'],
    ['variable', 'gl_Position'], ['number', '1.0f'],
  ]) expect(tokens).toContainEqual(pair)
  expect(pairs('/* vec3 false */ true // vec4', glsl)).toEqual([
    ['comment', '/* vec3 false */'], ['boolean', 'true'], ['comment', '// vec4'],
  ])
})

test('R handles raw strings, quoted names, special infix operators, assignments and typed constants', () => {
  const tokens = pairs('`some name` <- function(x) r"--["quoted" ]-]--"; x %in% c(1L, 2i, NA_real_, TRUE); .value <<- Inf; pkg:::fn()', r)
  for (const pair of [
    ['variable', '`some name`'], ['operator', '<-'], ['keyword', 'function'], ['string', 'r"--["quoted" ]-]--"'],
    ['operator', '%in%'], ['number', '1L'], ['number', '2i'], ['null', 'NA_real_'], ['boolean', 'TRUE'],
    ['variable', '.value'], ['operator', '<<-'], ['number', 'Inf'], ['operator', ':::'],
  ]) expect(tokens).toContainEqual(pair)
  for (const source of ['r"(a)"', 'R"{a}"', 'r"---(a)-- )---"']) expect(pairs(source, r)).toEqual([['string', source]])
})

test('Julia handles macros, mutating function names, commands, float32 and adjoints', () => {
  const tokens = pairs('@time function update!(x::Vector)\n raw"a\\b"; """multi\nline"""; `echo $x`; x\' .+ 1.5f-2; \'λ\'; nothing\nend', julia)
  for (const pair of [
    ['attribute', '@time'], ['keyword', 'function'], ['function', 'update!'], ['type', 'Vector'],
    ['string', 'raw"a\\b"'], ['string', '"""multi\nline"""'], ['string', '`echo $x`'], ['operator', "'"],
    ['operator', '.+'], ['number', '1.5f-2'], ['string', "'λ'"], ['null', 'nothing'],
  ]) expect(tokens).toContainEqual(pair)
  expect(pairs('x!=y', julia)).toEqual([['variable', 'x'], ['operator', '!='], ['variable', 'y']])
  const comment = '#= outer #= "inner" =# still outer =#'
  expect(pairs(`${comment} true`, julia)).toEqual([['comment', comment], ['boolean', 'true']])
  expect(pairs('obj. #= nested #= a =# b =# field', julia).at(-1)).toEqual(['property', 'field'])
})

test('Groovy handles slashy, dollar-slashy and triple strings with expression context', () => {
  const tokens = pairs('@CompileStatic def x = /a\\/b\n#x/; def y = $/a $/$$ b/$; def z = \'\'\'multi\nline\'\'\'; value =~ /foo/; value / 2; 3.5G; user?.name ?: null', groovy)
  for (const pair of [
    ['attribute', '@CompileStatic'], ['keyword', 'def'], ['string', '/a\\/b\n#x/'],
    ['string', '$/a $/$$ b/$'], ['string', "'''multi\nline'''"], ['operator', '=~'], ['string', '/foo/'],
    ['operator', '/'], ['number', '3.5G'], ['operator', '?.'], ['operator', '?:'], ['null', 'null'],
  ]) expect(tokens).toContainEqual(pair)
  expect(pairs('def x = /=foo/; x /= 2', groovy)).toContainEqual(['string', '/=foo/'])
  expect(pairs('value /= 2', groovy)).toContainEqual(['operator', '/='])
  expect(pairs('"/* string */" // /comment/', groovy)).toEqual([['string', '"/* string */"'], ['comment', '// /comment/']])
})

for (const language of [dart, scala]) {
  test(`${language.name} balances nested block comments`, () => {
    const source = '/* a /* "b" */ c */'
    expect(pairs(`${source} true`, language)).toEqual([['comment', source], ['boolean', 'true']])
    expect(pairs('/* a /* b */', language)).toEqual([['comment', '/* a /* b */']])
  })
}

for (const language of languages) {
  test(`${language.name} preserves arbitrary source and UTF16 offsets`, () => {
    for (const source of ['', '\r\n', 'const café = "🙂";\r\n𐐀中文\u0000', '"unfinished\\', "'unfinished", '/* unfinished', '#= unfinished', '[==[unfinished', '\ud800\udc00\ud800']) preserved(source, language)
  })
}

test('malformed long delimiters are consumed without backreference rescanning', () => {
  const equals = '='.repeat(20_000)
  const luaSource = `[${equals}[${']' + equals + 'x]'.repeat(20_000)}`
  expect(pairs(luaSource, lua)).toEqual([['string', luaSource]])
  const dashes = '-'.repeat(20_000)
  const rSource = `r"${dashes}(${')' + dashes + 'x)'.repeat(20_000)}`
  expect(pairs(rSource, r)).toEqual([['string', rSource]])
  const comment = '#='.repeat(20_000) + 'x' + '=#'.repeat(19_999)
  expect(pairs(comment, julia)).toEqual([['comment', comment]])
})

test('unfinished valid string openers stay opaque through long escaped content', () => {
  const samples: [Language, string][] = [
    [dart, 'r"""'], [scala, 's"""'], [lua, '[==['], [zig, '\\\\'],
    [r, 'r"---('], [julia, 'raw"""'], [groovy, '$/'], [groovy, '/'],
  ]
  for (const [language, opener] of samples) {
    const source = opener + ' x\\" '.repeat(10_000)
    expect(pairs(source, language)).toEqual([['string', source]])
    preserved(source, language)
  }
})
