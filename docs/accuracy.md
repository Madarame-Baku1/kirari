# Syntax coverage and limits

Kirari is a lexical highlighter. Its categories describe source spelling and local
context; they do not resolve bindings, infer types, or validate a program.
Forty-eight language definitions do not imply equal depth of syntax coverage.

The annotated corpus contains 30 original fixtures in six priority languages.
All 14 previously tracked gap annotations are now required passing assertions.
Each fixture also checks exact source reconstruction, escaping, deterministic
tokens, and every UTF-16 prefix. Separate regression tests exercise negative
lookalikes, malformed input, nesting, and streaming parity.

| Area | Covered behavior | Remaining boundary |
| --- | --- | --- |
| JavaScript | Regex after control-flow conditions; division after calls; Unicode identifier escapes; nested templates. | Slash classification uses lexical context, not a complete JavaScript parser. Escaped spellings are preserved in token values. |
| TypeScript | Alias/interface declaration names, direct annotation references, and `void` in a return-type position. | Nested type references and binding/scope resolution are incomplete. Categories are not semantic tokens. |
| TSX | Element type arguments, including nested angle brackets, without losing tag/attribute boundaries. | Generic arrow functions, comparisons, and incomplete markup require heuristics; arbitrary TSX is not compiler-validated. |
| Python | F-string expressions, nested strings/fields, conversions, format specifications, raw/triple strings, and escaped braces. | Malformed expressions are preserved without syntax validation. This does not establish support for every Python language version. |
| Shell | Double-quoted parameters, nested expansions, quoted/unquoted heredocs, multiple delimiters, and tab stripping. | Command substitutions stay opaque variable tokens. Heredocs inside substitutions and Bash ANSI-C quoted delimiters require further parsing. |
| JSON | Property/value distinctions, literals, escapes, and incomplete strings. | Highlighting is not JSON validation; use the separate JSONC definition for comments. |

The other definitions have sample, source-preservation, and targeted language
tests, but not this same annotated corpus. Contributions should add original
examples with expected token spans and nearby negative cases.

## Other language boundaries

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

## Reproduce

```sh
bun run test:corpus
bun run check
bun run check:browser
```

The browser command generates `packages/kirari/.checks/browser.html`; opening it
runs the browser checks. Passing checks establish behavior for those fixtures,
not a language-wide accuracy score or superiority over another highlighter.

Streaming patches must equal batch tokenization after every update, including
its lexical limits. Checkpointing still optimizes only the exact built-in
JavaScript, TypeScript, JSX, TSX, JSON, JSONC, and Python definitions. See [streaming](streaming.md) for
open-tail and retained-memory limits.
