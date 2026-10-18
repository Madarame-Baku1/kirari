import { expect, test } from 'bun:test'
import { tokenize } from '../src/tokenize.js'
import type { Language } from '../src/types.js'
import { c } from '../src/languages/c.js'
import { cpp } from '../src/languages/cpp.js'
import { java } from '../src/languages/java.js'
import { csharp } from '../src/languages/csharp.js'
import { go } from '../src/languages/go.js'
import { rust } from '../src/languages/rust.js'
import { ruby } from '../src/languages/ruby.js'
import { php } from '../src/languages/php.js'
import { swift } from '../src/languages/swift.js'
import { kotlin } from '../src/languages/kotlin.js'

const languages = [c, cpp, java, csharp, go, rust, ruby, php, swift, kotlin]
const pairs = (source: string, language: Language) => tokenize(source, language)
  .filter(token => token.type !== 'text').map(token => [token.type, token.value])

test('C handles directives, continuations, wide strings and numeric suffixes', () => {
  const tokens = pairs('#define VALUE \\\r\n  0xffU\r\nconst wchar_t *label = L"wide"; int n = 12UL;', c)
  expect(tokens).toContainEqual(['keyword', '#define VALUE \\\r\n  0xffU'])
  expect(tokens).toContainEqual(['string', 'L"wide"'])
  expect(tokens).toContainEqual(['keyword', 'const'])
  expect(tokens).toContainEqual(['type', 'int'])
  expect(tokens).toContainEqual(['number', '12UL'])
  expect(pairs('  #include <stdio.h>\n  #define N 2', c)).toEqual([
    ['keyword', '#include <stdio.h>'], ['keyword', '#define N 2'],
  ])
})

test('C++ handles templates, scoped identifiers and custom raw string delimiters', () => {
  const tokens = pairs('template<class T> auto s = u8R"tag(a"b\n)wrong" )tag"; std::vector<T> items; nullptr;', cpp)
  expect(tokens).toContainEqual(['keyword', 'template'])
  expect(tokens).toContainEqual(['string', 'u8R"tag(a"b\n)wrong" )tag"'])
  expect(tokens).toContainEqual(['operator', '::'])
  expect(tokens).toContainEqual(['null', 'nullptr'])
})

test('Java handles annotations, text blocks and primitive types', () => {
  const tokens = pairs('@Override public String name() { int n = 42L; return """\nhello\n"""; }', java)
  expect(tokens).toContainEqual(['attribute', '@Override'])
  expect(tokens).toContainEqual(['keyword', 'public'])
  expect(tokens).toContainEqual(['type', 'int'])
  expect(tokens).toContainEqual(['number', '42L'])
  expect(tokens).toContainEqual(['string', '"""\nhello\n"""'])
})

test('C# handles verbatim, interpolated and raw strings and escaped identifiers', () => {
  const tokens = pairs('string @class = @"a""b\nc"; var x = $"hello {name}"; var y = $$""""a"""b\n""""; decimal n = 1.25m;', csharp)
  expect(tokens).toContainEqual(['variable', '@class'])
  expect(tokens).toContainEqual(['string', '@"a""b\nc"'])
  expect(tokens).toContainEqual(['string', '$"hello {name}"'])
  expect(tokens).toContainEqual(['string', '$$""""a"""b\n""""'])
  expect(tokens).toContainEqual(['number', '1.25m'])
})

test('Ruby modulo assignment does not consume the rest as a percent string', () => {
  const tokens = pairs('n %= 2; puts n', ruby)
  expect(tokens).toContainEqual(['operator', '%='])
  expect(tokens).toContainEqual(['number', '2'])
  expect(tokens.some(([type]) => type === 'string')).toBe(false)
  expect(pairs('%q=hello=', ruby)).toEqual([['string', '%q=hello=']])
})

test('Go handles raw strings, rune literals, channels and imaginary numbers', () => {
  const tokens = pairs('package main\nfunc main() { text := `a\nb`; ch <- \'界\'; var z complex128 = 2.5i }', go)
  expect(tokens).toContainEqual(['keyword', 'func'])
  expect(tokens).toContainEqual(['string', '`a\nb`'])
  expect(tokens).toContainEqual(['string', "'界'"])
  expect(tokens).toContainEqual(['operator', ':='])
  expect(tokens).toContainEqual(['operator', '<-'])
  expect(tokens).toContainEqual(['number', '2.5i'])
})

test('Rust distinguishes lifetimes, characters, raw identifiers and byte/raw strings', () => {
  const tokens = pairs('fn get<\'a>(x: &\'a str) { let r#type = br##"a"#b"##; let c = \'🙂\'; let n = 12u64; println!("ok"); }', rust)
  expect(tokens).toContainEqual(['variable', "'a"])
  expect(tokens).toContainEqual(['string', "'🙂'"])
  expect(tokens).toContainEqual(['variable', 'r#type'])
  expect(tokens).toContainEqual(['string', 'br##"a"#b"##'])
  expect(tokens).toContainEqual(['number', '12u64'])
  expect(tokens).toContainEqual(['function', 'println!'])
  expect(pairs('value!=other', rust)).toContainEqual(['operator', '!='])
  expect(pairs('b\'\\x7f\' \'\\u{1F642}\' 1..2', rust)).toEqual([
    ['string', "b'\\x7f'"], ['string', "'\\u{1F642}'"], ['number', '1'], ['operator', '..'], ['number', '2'],
  ])
})

test('Ruby handles symbols, instance variables, constants, percent strings and block comments', () => {
  const tokens = pairs('class User\n def ready?; @name = :admin; @@all = %w[one two]; true; end\nend\n=begin\nfirst\nsecond\n=end\nputs /ok/i', ruby)
  expect(tokens).toContainEqual(['type', 'User'])
  expect(tokens).toContainEqual(['variable', '@name'])
  expect(tokens).toContainEqual(['variable', '@@all'])
  expect(tokens).toContainEqual(['string', ':admin'])
  expect(tokens).toContainEqual(['string', '%w[one two]'])
  expect(tokens).toContainEqual(['comment', '=begin\nfirst\nsecond\n=end'])
  expect(pairs('return /ok/i', ruby)).toContainEqual(['regex', '/ok/i'])
  expect(pairs('%r{ab+}i', ruby)).toEqual([['regex', '%r{ab+}i']])
})

test('PHP handles tags, variables, attributes, heredoc and nowdoc strings', () => {
  const tokens = pairs('<?php #[Example] function greet($name) { echo <<<TEXT\nhello $name\nTEXT;\n$x = <<<\'RAW\'\r\nhello\r\n  RAW;\nreturn null; } ?>', php)
  expect(tokens).toContainEqual(['punctuation', '<?php'])
  expect(tokens).toContainEqual(['punctuation', '#['])
  expect(tokens).toContainEqual(['variable', '$name'])
  expect(tokens).toContainEqual(['string', '<<<TEXT\nhello $name\nTEXT'])
  expect(tokens).toContainEqual(['string', "<<<'RAW'\r\nhello\r\n  RAW"])
  expect(tokens).toContainEqual(['null', 'null'])
  expect(pairs('RETURN True; // done ?>', php)).toEqual([
    ['keyword', 'RETURN'], ['boolean', 'True'], ['punctuation', ';'], ['comment', '// done '], ['punctuation', '?>'],
  ])
})

test('Swift handles attributes, raw and multiline strings, escaped names and ranges', () => {
  const tokens = pairs('@MainActor func value() -> String { let `class` = ##"a"#b"##; let text = """\nhello\n"""; for i in 0..<10 {} return nil }', swift)
  expect(tokens).toContainEqual(['attribute', '@MainActor'])
  expect(tokens).toContainEqual(['variable', '`class`'])
  expect(tokens).toContainEqual(['string', '##"a"#b"##'])
  expect(tokens).toContainEqual(['string', '"""\nhello\n"""'])
  expect(tokens).toContainEqual(['operator', '..<'])
  expect(tokens).toContainEqual(['null', 'nil'])
})

test('Kotlin handles annotations, raw multiline strings and nullable operators', () => {
  const tokens = pairs('@get:JvmName val `when`: String? = """a\\\nb"""; val n = user?.name ?: null; val id = 1UL;', kotlin)
  expect(tokens).toContainEqual(['attribute', '@get:JvmName'])
  expect(tokens).toContainEqual(['variable', '`when`'])
  expect(tokens).toContainEqual(['string', '"""a\\\nb"""'])
  expect(tokens).toContainEqual(['operator', '?.'])
  expect(tokens).toContainEqual(['operator', '?:'])
  expect(tokens).toContainEqual(['number', '1UL'])
})

for (const language of [rust, swift, kotlin]) {
  test(`${language.name} balances nested comments without interpreting comment contents`, () => {
    const comment = '/* outer /* "inner" */ still outer */'
    expect(pairs(`${comment} true`, language)).toEqual([['comment', comment], ['boolean', 'true']])
    expect(pairs('/* outer /* inner */', language)).toEqual([['comment', '/* outer /* inner */']])
    expect(pairs('api. /* a /* b */ c */ default', language).at(-1)).toEqual(['property', 'default'])
    expect(pairs('"/* string */" // /* comment\ntrue', language)).toEqual([
      ['string', '"/* string */"'], ['comment', '// /* comment'], ['boolean', 'true'],
    ])
  })
}

for (const language of languages) {
  test(`${language.name} preserves UTF16 offsets, CRLF and unfinished strings`, () => {
    const unfinished = '"' + '\\"'.repeat(8) + '\\'
    expect(pairs(unfinished, language)).toEqual([['string', unfinished]])
    for (const source of ['', '\r\n', 'const café = "🙂";\r\n𐐀中文\u0000', unfinished, '/* unfinished', '"""unfinished\\']) {
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
  })

  test(`${language.name} consumes long incomplete delimiters without rescanning suffixes`, () => {
    const source = '"' + '\\"'.repeat(20_000) + '\\'
    expect(pairs(source, language)).toEqual([['string', source]])
    const comment = (language === ruby ? '=begin\n' : '/*') + ' x '.repeat(20_000)
    expect(pairs(comment, language)).toEqual([['comment', comment]])
  })
}

test('raw and multiline literals keep incomplete contents in one token', () => {
  const samples: [Language, string][] = [
    [cpp, 'R"tag('], [csharp, '$$"""'], [go, '`'], [rust, 'r##"'],
    [java, '"""'], [kotlin, '"""'], [swift, '#"'], [php, '<<<TEXT\n'],
  ]
  for (const [language, opening] of samples) {
    const source = opening + 'x'.repeat(50_000) + '\\'
    expect(pairs(source, language)).toEqual([['string', source]])
  }
})
