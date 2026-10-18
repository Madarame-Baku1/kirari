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
JavaScript, TypeScript, and JSON definitions. See [streaming](streaming.md) for
open-tail and retained-memory limits.
