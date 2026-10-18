import { expect, test } from 'bun:test'
import { tokenize } from '../src/core.js'
import { shell } from '../src/languages/shell.js'
import type { Language } from '../src/types.js'

const pairs = (source: string) => {
  return tokenize(source, shell).filter(token => token.type !== 'text').map(token => [token.type, token.value])
}

const expectSpan = (source: string, value: string, type: string) => {
  const start = source.indexOf(value)
  expect(start).toBeGreaterThanOrEqual(0)
  const tokens = tokenize(source, shell).filter(token => token.end > start && token.start < start + value.length)
  expect(tokens.length).toBeGreaterThan(0)
  expect(tokens.every(token => token.type === type)).toBe(true)
}

test('shell exposes parameter references inside double quotes', () => {
  const source = 'echo "$HOME: $MESSAGE ${PORT:-${FALLBACK}} $? $$ $1 $@"'
  for (const value of ['$HOME', '$MESSAGE', '${PORT:-${FALLBACK}}', '$?', '$$', '$1', '$@']) {
    expect(pairs(source)).toContainEqual(['variable', value])
  }
})

test('shell keeps single quotes and escaped dollars literal', () => {
  const source = String.raw`echo '$HOME' "\$HOME \" $USER \\$PORT" \$OUTSIDE \"$REAL`
  expectSpan(source, "'$HOME'", 'string')
  expectSpan(source, '\\$HOME', 'string')
  expect(pairs(source)).toContainEqual(['variable', '$USER'])
  expect(pairs(source)).toContainEqual(['variable', '$PORT'])
  expect(pairs(source)).toContainEqual(['variable', '$REAL'])
  expect(pairs(source)).not.toContainEqual(['variable', '$OUTSIDE'])
})

test('shell parameter boundaries balance nested substitutions and ignore quoted braces', () => {
  const values = ['${PORT:-${FALLBACK}}', '${value:-"}"}', "${value:-'}'}", '${value:-\\}}', '${value:-$(printf "%s" "}")}', '${value:-$((1 + (2)))}']
  for (const value of values) expect(pairs(`${value}; echo $AFTER`)).toContainEqual(['variable', value])
})

test('shell nested command quotes do not terminate an enclosing double quote', () => {
  const source = 'echo "before $(printf "%s" "$HOME") after $USER"; echo $END'
  expect(pairs(source)).toContainEqual(['variable', '$(printf "%s" "$HOME")'])
  expectSpan(source, ' after ', 'string')
  expect(pairs(source)).toContainEqual(['variable', '$USER'])
  expect(pairs(source)).toContainEqual(['variable', '$END'])
})

test('shell quoted heredoc bodies are literal until an exact delimiter line', () => {
  const source = 'cat <<\'NOTE\'\n<dock> & "$UNCHANGED"\nNOTES\nNOTE \nNOTE\necho "$AFTER"\n'
  expectSpan(source, '<dock> & "$UNCHANGED"\nNOTES\nNOTE \n', 'string')
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
  expect(pairs(source)).not.toContainEqual(['variable', '$UNCHANGED'])
})

test('shell heredoc delimiters remove quotes and escapes without expanding parameters', () => {
  for (const [word, delimiter] of [['"$END"', '$END'], ["E'ND'", 'END'], [String.raw`E\ND`, 'END'], [String.raw`"E\ND"`, String.raw`E\ND`], [String.raw`E\ ND`, 'E ND'], ["''", '']]) {
    const source = `cat <<${word}\n$LITERAL # text\n${delimiter}\necho $AFTER`
    expectSpan(source, '$LITERAL # text', 'string')
    expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
  }
})

test('shell delimiter words retain non-ASCII whitespace that is not a shell separator', () => {
  const source = 'cat <<END\u00a0MORE\n$BODY\nEND\u00a0MORE\necho $AFTER'
  expect(pairs(source)).toContainEqual(['variable', '$BODY'])
  expectSpan(source, 'echo', 'variable')
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
})

test('shell multiple heredocs are consumed in order with optional tab stripping', () => {
  const source = 'cat <<A <<-"B" # header\nfirst $FIRST\nA\n\tsecond $LITERAL\n\tB\necho $AFTER'
  expect(pairs(source)).toContainEqual(['comment', '# header'])
  expect(pairs(source)).toContainEqual(['variable', '$FIRST'])
  expectSpan(source, '\tsecond $LITERAL', 'string')
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
})

test('shell unquoted heredoc interpolation ignores quote characters but respects escaped dollars', () => {
  const source = 'cat <<END\n\'$HOME\' "$USER" \\$LITERAL\nEND\necho $AFTER'
  expect(pairs(source)).toContainEqual(['variable', '$HOME'])
  expect(pairs(source)).toContainEqual(['variable', '$USER'])
  expectSpan(source, '\\$LITERAL', 'string')
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
})

test('shell heredocs begin after the logical command line and here strings do not queue bodies', () => {
  const source = 'cat <<END \\\n  -n\n$BODY\nEND\necho <<< "$HERE"\necho $AFTER'
  expect(pairs(source)).toContainEqual(['variable', '$BODY'])
  expect(pairs(source)).toContainEqual(['variable', '$HERE'])
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
  expectSpan(source, 'echo', 'variable')
})

test('shell heredoc line continuations are joined before testing an unquoted delimiter', () => {
  const source = 'cat <<END\ntext\\\nEND\nE\\\nND\necho $AFTER'
  expectSpan(source, 'text\\\nEND', 'string')
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
})

test('shell a comment after an unfinished redirection is not a heredoc delimiter', () => {
  const source = 'cat << # missing delimiter\necho "$AFTER"'
  expect(pairs(source)).toContainEqual(['comment', '# missing delimiter'])
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
})

test('shell arithmetic shifts are not heredoc redirections', () => {
  const source = '((VALUE = (1 << 2)))\necho "$AFTER"\ncat <<END\n$BODY\nEND\necho $LAST'
  expect(pairs(source)).toContainEqual(['variable', '$AFTER'])
  expectSpan(source, 'echo', 'variable')
  expect(pairs(source)).toContainEqual(['variable', '$BODY'])
  expect(pairs(source)).toContainEqual(['variable', '$LAST'])
})

test('shell public rules still tokenize whole strings and parameters without its custom scanner', () => {
  const derived: Language = { name: 'shell-rules', rules: shell.rules, identifier: /[a-zA-Z_]\w*/ }
  const tokens = tokenize('echo "$HOME" ${PORT} `date`', derived).map(token => [token.type, token.value])
  expect(tokens).toContainEqual(['string', '"$HOME"'])
  expect(tokens).toContainEqual(['variable', '${PORT}'])
  expect(tokens).toContainEqual(['string', '`date`'])
})

test('shell extensions retain prepended custom-rule priority over scanner entry points', () => {
  const derived: Language = {
    ...shell,
    rules: [
      { type: 'template', pattern: /"[^"\r\n]*"/ },
      { type: 'tag', pattern: /<<[A-Z]+/ },
      { type: 'variable', pattern: /\$\{/ },
      ...shell.rules,
    ],
  }
  const tokens = tokenize('"$HOME" ${PORT} <<END\necho $AFTER', derived).map(token => [token.type, token.value])
  expect(tokens).toContainEqual(['template', '"$HOME"'])
  expect(tokens).toContainEqual(['variable', '${'])
  expect(tokens).toContainEqual(['tag', '<<END'])
  expect(tokens).toContainEqual(['variable', 'echo'])
  expect(tokens).toContainEqual(['variable', '$AFTER'])
})

test('shell keeps every UTF-16 prefix contiguous through unfinished quotes, expansions, and heredocs', () => {
  const sources = [
    'echo "🚢 $HOME ${PORT:-${FALLBACK}}"; echo $END',
    'cat <<\'NOTE\'\r\n<dock> & "$UNCHANGED"\r\nNOTE\r\necho $END',
    'cat <<A <<-"B"\n$HOME\nA\n\t$LITERAL\n\tB\necho $AFTER',
    'echo "$(printf "%s" "${PORT:-${FALLBACK}}")"',
  ]
  for (const original of sources) {
    for (let end = 0; end <= original.length; end++) {
      const source = original.slice(0, end)
      const tokens = tokenize(source, shell)
      let offset = 0
      for (const token of tokens) {
        expect(token.start).toBe(offset)
        expect(token.end).toBeGreaterThan(offset)
        expect(token.value).toBe(source.slice(token.start, token.end))
        offset = token.end
      }
      expect(offset).toBe(source.length)
      expect(tokens.map(token => token.value).join('')).toBe(source)
    }
  }
})
