import { expect, test } from 'bun:test'
import { tokenize } from '../src/core.js'
import { graphql } from '../src/languages/graphql.js'
import { protobuf } from '../src/languages/protobuf.js'
import { hcl } from '../src/languages/hcl.js'
import { ini } from '../src/languages/ini.js'
import { dotenv } from '../src/languages/dotenv.js'
import { makefile } from '../src/languages/makefile.js'
import { nginx } from '../src/languages/nginx.js'
import type { Language } from '../src/types.js'

const pairs = (source: string, language: Language) => tokenize(source, language)
  .filter(token => token.type !== 'text').map(token => [token.type, token.value])

test('nginx hashes inside arguments do not start comments or swallow directive boundaries', () => {
  const source = 'return 302 https://example.com/#fragment;\nrewrite ^ $host#part;\nlisten 80; # comment'
  const tokens = pairs(source, nginx)
  expect(tokens).toContainEqual(['string', 'https://example.com/#fragment'])
  expect(tokens).toContainEqual(['string', '#part'])
  expect(tokens).toContainEqual(['keyword', 'listen'])
  expect(tokens).toContainEqual(['comment', '# comment'])
})

test('GraphQL variables, directives, types, fragments, and escaped block strings', () => {
  const source = '# operation\nquery Find($id: ID!, $active: Boolean = true) { user(id: $id) @include(if: $active) { ...Details } }\nfragment Details on User { name }\n"""A \\""" quoted block\n🙂"""\ntype User { name: String }'
  const result = pairs(source, graphql)
  for (const pair of [['comment', '# operation'], ['keyword', 'query'], ['variable', '$id'], ['type', 'ID'],
    ['keyword', '@include'], ['boolean', 'true'], ['operator', '...'], ['keyword', 'fragment'],
    ['string', '"""A \\""" quoted block\n🙂"""'], ['type', 'String']]) expect(result).toContainEqual(pair)
})

test('Protobuf schema directives, scalar and message types, fields, and comments', () => {
  const result = pairs('syntax = "proto3";\npackage example;\n// record\nmessage User { repeated string name = 1; map<string, User> friends = 2; optional bool active = 3 [deprecated = false]; }\n/* end */', protobuf)
  for (const pair of [['keyword', 'syntax'], ['keyword', 'message'], ['type', 'User'], ['keyword', 'repeated'],
    ['type', 'string'], ['property', 'name'], ['number', '1'], ['type', 'bool'], ['property', 'deprecated'],
    ['boolean', 'false'], ['comment', '// record'], ['comment', '/* end */']]) expect(result).toContainEqual(pair)
  expect(pairs('edition = "2023";', protobuf)).toContainEqual(['keyword', 'edition'])
})

test('HCL Terraform blocks, attributes, references, functions, and heredocs', () => {
  const result = pairs('resource "local_file" "demo" {\n  filename = var.name\n  content = <<-EOT\n    # literal ${var.name}\n    EOT\n  enabled = true\n  count = length(var.items)\n  café = null\n}\n', hcl)
  for (const pair of [['keyword', 'resource'], ['string', '"local_file"'], ['property', 'filename'],
    ['variable', 'var'], ['property', 'name'], ['string', '<<-EOT\n    # literal ${var.name}\n    EOT\n'],
    ['property', 'enabled'], ['boolean', 'true'], ['function', 'length'], ['property', 'café'], ['null', 'null']]) expect(result).toContainEqual(pair)
  expect(pairs('value = <<END\n  END\nstill literal\nEND\nnext = 2', hcl)).toContainEqual(['string', '<<END\n  END\nstill literal\nEND\n'])
  expect(pairs('value = <<END\nmissing 🙂', hcl)).toContainEqual(['string', '<<END\nmissing 🙂'])
})

test('INI sections, keys, quoted values, and common comment prefixes', () => {
  const result = pairs('; settings\n  [server]\n  host = "localhost"\nport: 8080\nurl=https://example.com\nsection=[literal]\n# end\n', ini)
  for (const pair of [['comment', '; settings'], ['heading', '[server]'], ['property', 'host'],
    ['string', '"localhost"'], ['property', 'port'], ['operator', ':'], ['string', '8080'],
    ['string', 'https://example.com'], ['string', '[literal]'], ['comment', '# end']]) expect(result).toContainEqual(pair)
})

test('dotenv export, names, literal values, multiline quotes, and comments', () => {
  const result = pairs('  export API_KEY="value#literal" # note\nURL=https://example.com\nCHAIN=OTHER=value\nPRIVATE_KEY=\'line one\nline two\'\nEMPTY=\n', dotenv)
  for (const pair of [['keyword', 'export'], ['property', 'API_KEY'], ['string', '"value#literal"'],
    ['comment', '# note'], ['property', 'URL'], ['string', 'https://example.com'], ['string', 'OTHER=value'],
    ['string', "'line one\nline two'"], ['property', 'EMPTY']]) expect(result).toContainEqual(pair)
})

test('Makefile targets, assignments, directives, nested variables, and tab recipes', () => {
  const result = pairs('# build\ninclude common.mk\nCC := cc\nCFLAGS ?= -O2\nall: app\napp: main.c\n\t$(CC) $(CFLAGS) -o $@ $<\n\t@echo "done # literal"\nNAME = $($(prefix)_name)\nESCAPED = hash\\#literal\n# continued\\\ncomment\n', makefile)
  for (const pair of [['comment', '# build'], ['keyword', 'include'], ['variable', 'CC'], ['operator', ':='],
    ['variable', 'CFLAGS'], ['operator', '?='], ['function', 'all'], ['function', 'app'],
    ['variable', '$(CC)'], ['variable', '$@'], ['variable', '$<'], ['function', 'echo'],
    ['string', '"done # literal"'], ['variable', '$($(prefix)_name)'], ['comment', '# continued\\\ncomment']]) expect(result).toContainEqual(pair)
  expect(result).not.toContainEqual(['comment', '#literal'])
})

test('nginx directives are identified across blocks and semicolons with quoted arguments and variables', () => {
  const result = pairs('# configuration\nhttp { server { listen 8080; server_name example.com; location / { proxy_pass http://backend; proxy_set_header Host $host; set $path ${uri}; return 200 "hello # literal"; } } }', nginx)
  for (const pair of [['comment', '# configuration'], ['keyword', 'http'], ['keyword', 'server'],
    ['keyword', 'listen'], ['keyword', 'server_name'], ['keyword', 'location'], ['keyword', 'proxy_pass'],
    ['string', 'http://backend'], ['variable', '$host'], ['variable', '${uri}'], ['string', '"hello # literal"']]) expect(result).toContainEqual(pair)
  expect(result).not.toContainEqual(['keyword', 'example.com'])
})

for (const language of [graphql, protobuf, hcl, ini, dotenv, makefile, nginx]) {
  test(`${language.name} preserves Unicode, CRLF, and incomplete input with UTF-16 offsets`, () => {
    for (const source of ['', '🙂 café\r\n𐐀', '"unterminated\\', "'unterminated", '/* unfinished',
      '"""unfinished\\', 'x = <<-END\r\n  🙂\r\n', '[unfinished', '$(one $(two', 'value=${unfinished']) {
      const tokens = tokenize(source, language)
      expect(tokens.map(token => token.value).join('')).toBe(source)
      let offset = 0
      for (const token of tokens) {
        expect(token.start).toBe(offset)
        expect(token.end).toBeGreaterThan(offset)
        expect(token.value).toBe(source.slice(token.start, token.end))
        offset = token.end
      }
      expect(offset).toBe(source.length)
    }
  })
  test(`${language.name} consumes repeated malformed delimiters without suffix rescans`, () => {
    for (const source of ['$('.repeat(15_000), '['.repeat(30_000), '@-'.repeat(15_000), '"' + '\\"'.repeat(15_000),
      'x = <<END\n' + '<<MISSING\n'.repeat(5_000), 'a'.repeat(30_000)]) {
      expect(tokenize(source, language).map(token => token.value).join('')).toBe(source)
    }
  }, 2_000)
}

test('format callbacks respect caller-provided lexical rules', () => {
  for (const language of [hcl, makefile, nginx]) {
    const custom = { ...language, rules: [{ type: 'type', pattern: /CUSTOM/ }, ...language.rules] }
    expect(pairs('CUSTOM', custom)).toEqual([['type', 'CUSTOM']])
  }
})
