# Kirari

A small syntax highlighter with editable language definitions, source-aware
tokens, and CSS-variable themes. Independently implemented in TypeScript with
zero runtime dependencies. Returns escaped HTML without a DOM.

```sh
npm install @vortexlabs/kirari
```

Documentation and playground: <https://kirari.vortex.design>

## Development

Install dependencies from the workspace root, then run library commands here:

```sh
cd ../..
bun install
cd packages/kirari
bun run check
bun run size
```

`bun run check` type-checks the source, runs tests, builds ESM and declarations,
and tests the public package exports in Bun and Node. `bun run build` uses the
installed TypeScript compiler to preserve independently importable modules.
Bun handles package management, tests, scripts, and browser bundle measurements.

Run `bun run check:browser`, then open the generated `.checks/browser.html` file.
It reports browser checks covering language bundles, HTML escaping, theme
inheritance, Unicode offsets, optional APIs, and a module worker without a DOM. It is a
self-contained local file and does not require a development server.

`bun run test:corpus` runs original annotated examples for JavaScript, TypeScript,
TSX, Python, JSON, and shell. It checks expected token spans, source offsets,
HTML escaping, deterministic output, and every UTF-16 prefix of each example.
The 14 formerly tracked gap annotations now pass as required assertions.
These are bounded lexical checks, not compiler conformance or an accuracy score;
see [syntax coverage and limits](../../docs/accuracy.md).

From the workspace root, `bun run benchmark` measures highlighting speed and
browser bundle size.
See [benchmark methodology](../benchmarks/README.md) for scope and reproduction.

## Highlight code

The examples below use package imports, suitable for a linked or local-file
dependency. Inside this checkout, run `bun run build` first.

```ts
import { highlight } from '@vortexlabs/kirari'

const html = highlight('const count = 42')
```

JavaScript is the default. Choose another language by importing its definition:

```ts
import { highlight } from '@vortexlabs/kirari'
import { python } from '@vortexlabs/kirari/languages'

const html = highlight('print(answer)', { language: python })
```

The shared `@vortexlabs/kirari/languages` entry exports all 48 definitions. Named
imports work with bundler tree-shaking. Individual paths such as
`@vortexlabs/kirari/languages/python` remain available to load only that grammar
and its dependencies without a bundler.

JSX and TSX have separate definitions, including markup and embedded expressions:

```ts
import { highlight } from '@vortexlabs/kirari'
import { tsx } from '@vortexlabs/kirari/languages/tsx'

const html = highlight('<Button disabled={busy}>{label}</Button>', { language: tsx })
```

For a Python-only bundle, import the language-independent core:

```ts
import { tokenize, render } from '@vortexlabs/kirari/core'
import { python } from '@vortexlabs/kirari/languages/python'

const html = render(tokenize('answer = 42', python))
```

The HTML is a fragment. Place it inside your own `<pre><code>` elements.
Kirari preserves whitespace and newlines without inserting line wrappers.

## Optional integrations

These features use separate entrypoints and are absent from the default bundle:

| Import | API | Purpose |
| --- | --- | --- |
| `@vortexlabs/kirari/stream` | `createTokenStream(language)` | Source-offset token patches for appended code |
| `@vortexlabs/kirari/decorations` | `renderDecorated(tokens, options)` | Overlapping source ranges and optional line classes |
| `@vortexlabs/kirari/registry` | `createRegistry(languages)` | Resolve names, aliases, extensions, and filenames from explicit registrations |
| `@vortexlabs/kirari/markdown` | `createMarkdown(registry)` | Highlight registered languages inside Markdown fences |

```ts
import { tokenize } from '@vortexlabs/kirari/core'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import { renderDecorated } from '@vortexlabs/kirari/decorations'
import { createRegistry } from '@vortexlabs/kirari/registry'
import { createMarkdown } from '@vortexlabs/kirari/markdown'

const registry = createRegistry([javascript])
registry.resolve('src/example.js') // javascript; unknown names return undefined
const markdown = createMarkdown(registry)
const tokens = tokenize('```js\nconst count = 1\n```', markdown)
const html = renderDecorated(tokens, {
  lines: true,
  lineClassName: line => line.number === 2 ? 'selected-line' : undefined,
})
```

Decorations accept `{ start, end, className }` ranges using UTF-16 offsets.
They append escaped classes without changing token categories. Callbacks see
each original token once, even when a range splits it. With `lines: true`, output
uses `.kirari-line` wrappers and one-based `data-line` attributes. Define your own
CSS for custom classes; line numbering UI is not added automatically.

Streaming returns `{ from, tokens, length }`: replace your retained tokens from
the source offset `from` onward. Exact built-in JavaScript, TypeScript, and JSON
use conservative checkpoints; all other grammars use full re-tokenization.
Long lines and unfinished multiline tokens can still require large rescans.
Streams retain the full source. Do not mutate built-in definitions; copy them
for customization. Calling `reset()` also requires clearing your retained view.

See complete [streaming](../../docs/streaming.md),
[decoration](../../docs/decorations.md), and
[language integration](../../docs/language-integration.md) contracts and examples.

For highlighted code blocks in rendered Markdown or MDX, use the separate
[`@vortexlabs/kirari-rehype` package](../rehype/README.md). It accepts explicit language
registrations and reuses Kirari token classes. The `createMarkdown()` API above
highlights Markdown source; the Rehype plugin integrates with document rendering.

## Themes

Import one theme with your application's CSS bundler, or serve its file as a
stylesheet. Add `class="kirari"` to your `<pre>` for the theme's background and
base colors.

```js
import '@vortexlabs/kirari/theme.css' // the default dark theme
import '@vortexlabs/kirari/themes/github-light.css' // or any built-in theme
```

| Light | Dark |
| --- | --- |
| `daylight`, `paper`, `ad-astra-light`, `github-light`, `solarized-light`, `catppuccin-latte`, `rose-pine-dawn`, `vitesse-light` | `default`, `dusk`, `ad-astra-dark`, `github-dark`, `one-dark`, `dracula`, `nord`, `monokai`, `solarized-dark`, `catppuccin-mocha`, `tokyo-night`, `rose-pine`, `vitesse-dark` |

Load one theme per page; each file styles the same classes. Ported themes adapt
the original projects' published colors to Kirari's token categories, credited
in each file's header. Theme files are generated from `scripts/themes.ts`; run
`bun run themes` after editing it.

Override token colors on any ancestor:

```css
.code-example {
  --kirari-background: #151820;
  --kirari-text: #dce1ea;
  --kirari-keyword: #c4a7ff;
  --kirari-variable: #dce1ea;
  --kirari-property: #82d4d0;
  --kirari-function: #9dbdff;
  --kirari-string: #a9d994;
  --kirari-number: #f3c78a;
  --kirari-comment: #949cab;
  --kirari-tag: #e9a6b1;
  --kirari-attribute: #82d4d0;
  --kirari-entity: #f3c78a;
}
```

Every built-in token category maps to `.kirari-<token>` and `--kirari-<token>`:
`text`, `keyword`, `variable`, `property`, `function`, `string`, `number`,
`boolean`, `null`, `comment`, `operator`, `punctuation`, `type`, `regex`,
`inserted`, `deleted`, `heading`, `tag`, `attribute`, and `entity`.
`--kirari-background` controls the optional
wrapper background. Colors are CSS fallbacks, so ancestor overrides inherit
without competing with variable declarations inside the theme.

There are no inline styles. Theme changes do not require highlighting again.
Classes also let you control font weight, italics, backgrounds, and decoration:

```css
.code-example .kirari-keyword { font-weight: 600; }
.code-example .kirari-comment { font-style: italic; }
.code-example .selected { background: #ffffff20; text-decoration: underline; }
```

## Tokens and custom classes

```ts
import { tokenize, render } from '@vortexlabs/kirari'

const tokens = tokenize('const count = 1')
// { type: 'variable', value: 'count', start: 6, end: 11 }

const html = render(tokens, {
  classes: { variable: 'code-name', comment: 'muted' },
  className: token => token.start === 6 ? 'selected' : undefined,
})
```

`highlight` accepts the same rendering options. Custom classes append to the
standard class. Plain `text` tokens render without a span unless given custom
classes. Tokens are readonly in TypeScript; the library does not mutate them
when rendering. They are not frozen at runtime.

Offsets use UTF-16 code units, matching JavaScript's `slice`. `start` is inclusive
and `end` is exclusive. Tokens cover the entire input in order, including unknown
characters and unfinished code. Concatenating their values reproduces the source
exactly. An empty source produces `[]` and empty HTML.

Use these tokens directly when rendering through React or another UI framework.
Kirari does not require a framework adapter or expose a raw-HTML callback. For
React, the optional [`@vortexlabs/kirari-react`](../react/README.md) package
provides a ready-made `<Code>` component and streaming hook.

## Extend a language

```ts
import { highlight } from '@vortexlabs/kirari'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import type { Language } from '@vortexlabs/kirari'

const projectJavaScript: Language = {
  ...javascript,
  keywords: [...javascript.keywords!, 'custom'],
  rules: [
    { type: 'constant', pattern: /\bAPI_KEY\b/ },
    ...javascript.rules,
  ],
}

highlight('const key = API_KEY', { language: projectJavaScript })
```

Give a custom category its own CSS:

```css
.kirari-constant { color: var(--kirari-constant, #f3c78a); }
```

Rules are ordered and match at the current source position. Earlier rules win;
an empty match throws. Kirari clones regular expressions, preserving their flags
except that matching always uses sticky mode. It never changes the supplied
regex's `lastIndex`. Copy definitions when extending them; built-in values are
typed readonly but not deeply frozen at runtime.

JavaScript template text and regex literals use scanner state. Normal rules run
inside template expressions, but not inside template text or recognized regex
literals. Disable `templates` or `regexLiterals` on a derived definition if you
want rules to take over those constructs.

Definitions accept `name`, `rules`, `identifier`, `keywords`, `types`, `booleans`,
`nulls`, `templates`, `regexLiterals`, and an optional `tokenize` callback.
Optional identifier patterns enable
lexical variable/property/function classification. With no identifier pattern,
unmatched characters remain `text`. There is no global language registry.

The optional `tokenize(source, language)` callback replaces the default scanner
and returns a complete `Token[]` with contiguous source offsets. Built-in
definitions use it where structure matters, such as JSX, CSS, and YAML.
JSX/TSX rules apply within code expressions; HTML/XML markup uses its own scanner.
Changing `rules` therefore does not override every construct in these definitions.
Custom rendering and classes work with every language.

## Languages and limits

There are 48 opt-in definitions. Import only the ones your application needs;
the default entry includes JavaScript, without a registry of the other languages.

| Import suffix | Support |
| --- | --- |
| `javascript` | Keywords, Unicode identifiers, common property/call contexts, numbers, comments, strings, nested templates, regex heuristics |
| `typescript` | JavaScript plus TypeScript keywords and primitive type names |
| `jsx` | JavaScript plus tags, attributes, entities, fragments, and embedded expressions |
| `tsx` | JSX plus TypeScript keywords and primitive types |
| `html` | Tags, attributes, entities, comments, raw text, embedded JavaScript/CSS |
| `xml` | Tags, attributes, entities, comments, processing instructions, CDATA |
| `vue` | Markup, directives, interpolations, JavaScript/TypeScript scripts, CSS |
| `svelte` | Markup, block markers, expression attributes, scripts, CSS |
| `css` | Selectors, declarations, custom properties, dimensions, colors, at-rules |
| `json` | Keys, strings, numbers, booleans, null, punctuation |
| `jsonc` | JSON plus line and block comments |
| `python` | Keywords, identifiers, numeric literals, quoted/triple strings, comments |
| `shell` | Keywords, names, parameter references, strings, basic operators, comments |
| `c` | Keywords, primitive types, directives, strings, numbers, comments |
| `cpp` | C++ keywords, scoped names, raw strings, directives |
| `csharp` | Keywords, types, escaped identifiers, verbatim/interpolated/raw strings |
| `java` | Keywords, primitive types, annotations, strings, text blocks |
| `go` | Keywords, types, raw strings, runes, imaginary numbers |
| `rust` | Keywords, types, lifetimes, raw identifiers/strings, macros, nested comments |
| `ruby` | Keywords, symbols, variables, percent literals, regex heuristics |
| `php` | Tags, keywords, variables, strings, heredoc/nowdoc |
| `swift` | Keywords, types, attributes, raw/multiline strings, nested comments |
| `kotlin` | Keywords, types, annotations, raw strings, nested comments |
| `dart` | Keywords, types, annotations, raw/triple strings, nested comments |
| `scala` | Keywords, types, annotations, triple strings, nested comments |
| `groovy` | Keywords, annotations, quoted/triple strings, slashy strings |
| `lua` | Keywords, literals, quoted/long-bracket strings and comments |
| `zig` | Keywords, types, builtins, multiline strings, comments |
| `glsl` | Shader keywords, types, directives, numbers, comments |
| `r` | Keywords, literals, operators, strings, comments |
| `julia` | Keywords, types, macros, strings, nested comments |
| `elixir` | Keywords, atoms, aliases, sigils, strings, heredocs |
| `clojure` | Forms, symbols, keywords, strings, regexes, reader syntax |
| `powershell` | Case-insensitive keywords, variables, parameters, strings, here-strings |
| `sql` | Common case-insensitive keywords, strings, quoted identifiers, parameters |
| `markdown` | Headings, links, emphasis, inline code, opaque fenced code blocks |
| `yaml` | Keys, sequences, anchors, tags, scalar values, indented block scalars |
| `toml` | Tables, dotted keys, dates, strings, arrays, literals |
| `dockerfile` | Directives, comments, variables, flags, continuations |
| `graphql` | Operations, types, variables, directives, block strings |
| `protobuf` | Declarations, field types, strings, numbers, comments |
| `hcl` | HCL/Terraform blocks, attributes, literals, strings, heredocs |
| `ini` | Sections, keys, values, comments |
| `dotenv` | Export declarations, keys, quoted/unquoted values, comments |
| `makefile` | Targets, variables, assignments, directives, recipes |
| `nginx` | Directive names, variables, quoted/unquoted values, comments |
| `diff` | Unified diff headers, hunks, added/deleted lines |
| `plaintext` | Escaped text without syntax coloring |

This is lexical highlighting, not parsing or validation. Parameters use the
`variable` category. Binding resolution, inferred types, contextual keywords,
complex property contexts, and every regex-versus-division ambiguity are outside
the implementation. JavaScript regexes following control-flow closing
parentheses or statement blocks can be classified as operators. Escaped Unicode
identifier spellings are not supported. TSX type arguments on JSX tags, including
nested arguments such as `<Component<Map<string, Props>>>`, retain tag and
attribute boundaries. Generic arrow functions, comparisons, and incomplete markup
still use lexical heuristics; see [syntax coverage and limits](../../docs/accuracy.md).

Python f-strings and shell double-quoted strings are colored as whole strings;
their embedded expressions are not separately highlighted. Shell heredocs and
nested parameter expansions are not parsed. TypeScript generic/type contexts
are heuristic. Malformed code is retained but is not necessarily classified
the same way as a compiler would classify it.

Interpolation in C#, Ruby, PHP, Swift, and Kotlin strings stays inside the string
token. Ruby nested percent delimiters and heredocs, PHP embedded HTML, and Swift
regex literals are not parsed. Ruby `%=` is treated as modulo assignment; use
`%q=...=` for an equals-delimited string.

Markdown inline constructs and YAML quoted/flow values are line-local. Markdown
fences are opaque by default; opt-in `createMarkdown(registry)` highlights
registered fenced languages without recursive Markdown injection. SQL support is not a complete
dialect grammar: dollar-quoted strings and nested comments are unsupported.
Dockerfile heredocs, custom escape directives, and embedded shell syntax are not
parsed. No definition claims compiler-level syntax coverage.

Vue/Svelte use JavaScript/TypeScript expression tokens and select embedded scripts
with `lang="js"` or `lang="ts"`. Unknown script/style preprocessors remain text.
Vue `v-pre` and Svelte expressions inside quoted attribute strings are not parsed.
Framework directives are highlighted lexically, without validating their meaning.

Dart, Scala, Groovy, Julia, and Elixir strings keep interpolation opaque; nested
expression quotes need a parser. Scala XML literals and Julia custom string-macro
semantics are unsupported. Groovy slashy strings use expression-start heuristics.
Elixir sigils stop at the first unescaped closing delimiter. Clojure reader
discard and conditional forms retain ordinary lexical tokens. PowerShell command
context is heuristic, and quoted subexpressions are not recursively parsed.

GraphQL/Protobuf custom type names use capitalization heuristics. HCL/Terraform
template expressions inside strings/heredocs stay opaque. INI dialect-specific
continuations/interpolation and dotenv expansion are not parsed. Makefile uses
default tab recipes without `.RECIPEPREFIX`, shell parsing, or make evaluation.
Nginx directive positions are recognized without validating module directives;
quoted variable references remain part of the string token.

Modern ESM runtimes with ES2022 features are required. The runtime contains no
Bun, Node, or DOM imports. Tests exercise Bun and Node; the browser smoke check
also exercises a module worker without `document`.

Source and class attributes are HTML-escaped. Language rules and callbacks are
trusted application code; arbitrary user-supplied regexes are not sandboxed.

## Bundle measurement

Run `bun run size` to measure core-only, default JavaScript, and all 48
language definitions. It bundles each entry for the browser with Bun minification,
checks that the bundle executes, and reports bytes before and after gzip level 9.
The core fixture includes an exported API object; the all-language fixture also
retains a language registry so that no language gets removed as unused. Theme
CSS is excluded. These are bundle sizes, not throughput benchmarks.

Measured on 2026-10-17 using Bun 1.3.11:

| Entry | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| Core API | 3,439 | 1,717 |
| JavaScript default | 4,648 | 2,240 |
| All 48 languages | 51,964 | 16,044 |

## License

[MIT](LICENSE) © 2026 [Ugi](https://ugi.dev)
