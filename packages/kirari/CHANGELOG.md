# @vortexlabs/kirari

## 1.0.4

### Patch Changes

- 5357cfc: Fix quadratic scanning time on long runs of short tokens in CSS, Makefile, TOML, YAML, and Markdown with embedded languages. Rules that look ahead past a name no longer rescan the rest of the run at every token, and an unclosed fence on a single line no longer backtracks over the whole line.
  
  YAML numbers, booleans, and nulls now end before `#` only when whitespace precedes it, so `3#x` reads as one plain scalar as in YAML. TOML numbers no longer split names such as `42n`. No public API changes.

## 1.0.3

### Patch Changes

- ed4d49b: Fix function names being highlighted as ordinary variables across the supported programming-language grammars. Recognize language-specific declarations, generic signatures, quoted names, and bindings to explicit function expressions, lambdas, and closures, including Python lambdas, Ruby methods without parentheses, Rust closures, and typed Go function bindings.
  
  Improve JavaScript, JSX, TypeScript, and TSX handling of multiline and parenthesized arrows, nested default parameters, typed bindings, and contextual method names. Preserve batch and streaming consistency while signatures, comments, and arrow operators are incomplete. Embedded code uses the same fixes.
  
  Add regression coverage for all 48 shipped languages, checking source preservation, token offsets, streamed prefixes, ordinary values, immediate invocations, and formats without function declarations. Function recognition remains lexical and does not infer types from aliases or arbitrary call results. No public API changes or new runtime dependencies.

## 1.0.2

### Patch Changes

- 7d3bf4c: Fix JSX and TSX highlighting for adjacent element snippets without requiring a fragment wrapper. Component names and attributes retain their token types across siblings, while comparisons after JSX remain JavaScript.

## 1.0.1

### Patch Changes

- 3ee99c0: Update the package homepage and documentation links to https://kirari.sh.

## 1.0.0

### Major Changes

- 14accd0: Release Kirari 1.0.0 with the core syntax highlighting APIs, Rehype and MDX integration, and React components and streaming hooks. Update the integrations to require Kirari 1.x.

### Minor Changes

- 149d19f: Add named language imports from `@vortexlabs/kirari/languages`, while preserving individual language entry points. Use the shared entry in playground examples.

## 1.0.0

### Major Changes

- Release Kirari 1.0.0 with the core syntax highlighting APIs, Rehype and MDX integration, and React components and streaming hooks. Update the integrations to require Kirari 1.x.
