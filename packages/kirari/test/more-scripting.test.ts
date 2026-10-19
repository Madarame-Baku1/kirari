import { expect, test } from 'bun:test'
import { tokenize } from '../src/tokenize.js'
import type { Language } from '../src/types.js'
import { elixir } from '../src/languages/elixir.js'
import { clojure } from '../src/languages/clojure.js'
import { powershell } from '../src/languages/powershell.js'

const pairs = (source: string, language: Language) => tokenize(source, language)
  .filter(token => token.type !== 'text').map(token => [token.type, token.value])

test('Elixir recognizes atoms, aliases, module attributes, sigils and heredocs', () => {
  const tokens = pairs('defmodule MyApp.User do\n@doc """\n# documentation\n"""\ndef ready?(name), do: {:ok, :"hello world", true, nil, 0xFF, ?🙂}\n~r/foo\\/bar/i ~w[one two]a ~S"""\nraw\n"""\nend', elixir)
  for (const token of [
    ['keyword', 'defmodule'], ['type', 'MyApp.User'], ['attribute', '@doc'],
    ['string', '"""\n# documentation\n"""'], ['function', 'ready?'], ['property', 'do'],
    ['string', ':ok'], ['string', ':"hello world"'], ['boolean', 'true'], ['null', 'nil'],
    ['number', '0xFF'], ['number', '?🙂'], ['regex', '~r/foo\\/bar/i'],
    ['string', '~w[one two]a'], ['string', '~S"""\nraw\n"""'],
  ]) expect(tokens).toContainEqual(token)
  for (const [opening, closing] of [['(', ')'], ['[', ']'], ['{', '}'], ['<', '>'], ['|', '|'], ['/', '/'], ['"', '"'], ["'", "'"]]) {
    const source = `~s${opening}# body${closing}`
    expect(pairs(source, elixir)).toEqual([['string', source]])
  }
  expect(pairs('~SQL2|select *| :café? :foo@bar :++ 1..2', elixir)).toEqual([
    ['string', '~SQL2|select *|'], ['string', ':café?'], ['string', ':foo@bar'], ['string', ':++'],
    ['number', '1'], ['operator', '..'], ['number', '2'],
  ])
})

test('Clojure recognizes keywords, qualified symbols, reader forms and numeric literals', () => {
  const tokens = pairs('(defn ready? [user] {:person/name (::alias/key user) :ok true :missing nil :ratio 22/7})\nclojure.core/map x# *out* \\newline \\) #"\\d+;[a-z]" #inst "2026-01-01" 36r16 42N 1.5M ##Inf', clojure)
  for (const token of [
    ['keyword', 'defn'], ['function', 'ready?'], ['property', ':person/name'], ['property', '::alias/key'],
    ['variable', 'clojure.core/map'], ['variable', 'x#'], ['variable', '*out*'],
    ['boolean', 'true'], ['null', 'nil'], ['number', '22/7'], ['number', '36r16'],
    ['number', '42N'], ['number', '1.5M'], ['number', '##Inf'],
    ['string', '\\newline'], ['string', '\\)'], ['regex', '#"\\d+;[a-z]"'], ['tag', '#inst'],
  ]) expect(tokens).toContainEqual(token)
  expect(pairs('nil? true-value defn-extra', clojure)).toEqual([
    ['variable', 'nil?'], ['variable', 'true-value'], ['variable', 'defn-extra'],
  ])
  expect(pairs('#_ (ignored) #?(:clj value) #{:a} #(+ % 1)', clojure)).toContainEqual(['punctuation', '#_'])
})

test('PowerShell recognizes case-insensitive keywords, scoped variables, parameters and operators', () => {
  const tokens = pairs('FuNcTiOn Get-Name { param([string] $Name) IF ($TRUE -aNd $null -NE $env:Path) { Write-Output -InputObject ${save-items} @args; $script:count += 1KB } }', powershell)
  for (const token of [
    ['keyword', 'FuNcTiOn'], ['function', 'Get-Name'], ['keyword', 'param'], ['type', '[string]'],
    ['variable', '$Name'], ['keyword', 'IF'], ['boolean', '$TRUE'], ['operator', '-aNd'],
    ['null', '$null'], ['operator', '-NE'], ['variable', '$env:Path'], ['function', 'Write-Output'],
    ['attribute', '-InputObject'], ['variable', '${save-items}'], ['variable', '@args'],
    ['variable', '$script:count'], ['operator', '+='], ['number', '1KB'],
  ]) expect(tokens).toContainEqual(token)
  expect(pairs('$trueValue iffy -notlikeValue $false? $?', powershell)).toEqual([
    ['variable', '$trueValue'], ['variable', 'iffy'], ['attribute', '-notlikeValue'],
    ['variable', '$false?'], ['variable', '$?'],
  ])
})

test('PowerShell strings preserve quoting escapes and here-string boundaries', () => {
  for (const source of ['"hello `"$name`""', "'don''t # comment'", '"a ""quote"" b"', '“smart”', "‘don’’t’", '@"\r\n# $name " quote\r\n  "@\r\nstill content\r\n"@', "@'\n$name\n'@"]) {
    expect(pairs(source, powershell)).toEqual([['string', source]])
  }
  expect(pairs('@"\nbody\n"@; $true', powershell)).toEqual([
    ['string', '@"\nbody\n"@'], ['punctuation', ';'], ['boolean', '$true'],
  ])
  expect(pairs('${a`}b} $$ $^ $_', powershell)).toEqual([
    ['variable', '${a`}b}'], ['variable', '$$'], ['variable', '$^'], ['variable', '$_'],
  ])
})

for (const language of [elixir, clojure, powershell]) {
  test(`${language.name} keeps comments and strings opaque`, () => {
    const comment = language === clojure ? '; "true" :name' : '# "true" $name :name'
    expect(pairs(`${comment}\n"# ; true $name :name"`, language)).toEqual([
      ['comment', comment], ['string', '"# ; true $name :name"'],
    ])
    if (language === powershell) expect(pairs('<# "hello" # comment\n$true #> $false', language)).toEqual([
      ['comment', '<# "hello" # comment\n$true #>'], ['boolean', '$false'],
    ])
  })

  test(`${language.name} preserves source and UTF16 offsets on incomplete input`, () => {
    for (const source of ['', '\r\n', 'café 𐐀 "🙂"\u0000\r\n', '"unfinished\\', "'unfinished", '~r[unfinished', '@"\nunfinished', '${unfinished', '#"unfinished', '\\', '"\ud800']) {
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
}

test('incomplete scripting delimiters consume their suffix once', () => {
  const samples: [Language, string, string, string][] = [
    [elixir, '~r[', 'regex', '\\]'], [elixir, '~w(', 'string', '\\)'],
    [elixir, '"""', 'string', '\\"'], [elixir, ':"', 'string', '\\"'],
    [clojure, '#"', 'regex', '\\"'], [clojure, '"', 'string', '\\"'],
    [powershell, '"', 'string', '`"'], [powershell, '@"\n', 'string', '  "@\n'],
    [powershell, '${', 'variable', '`}'], [powershell, '<#', 'comment', '<#'],
  ]
  for (const [language, opening, type, content] of samples) {
    const source = opening + content.repeat(20_000) + 'unfinished'
    expect(pairs(source, language)).toEqual([[type, source]])
  }
})
