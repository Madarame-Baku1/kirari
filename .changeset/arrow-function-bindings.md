---
"@vortexlabs/kirari": patch
---

Fix function names being highlighted as ordinary variables across the supported programming-language grammars. Recognize language-specific declarations, generic signatures, quoted names, and bindings to explicit function expressions, lambdas, and closures, including Python lambdas, Ruby methods without parentheses, Rust closures, and typed Go function bindings.

Improve JavaScript, JSX, TypeScript, and TSX handling of multiline and parenthesized arrows, nested default parameters, typed bindings, and contextual method names. Preserve batch and streaming consistency while signatures, comments, and arrow operators are incomplete. Embedded code uses the same fixes.

Add regression coverage for all 48 shipped languages, checking source preservation, token offsets, streamed prefixes, ordinary values, immediate invocations, and formats without function declarations. Function recognition remains lexical and does not infer types from aliases or arbitrary call results. No public API changes or new runtime dependencies.
