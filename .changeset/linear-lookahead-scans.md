---
"@vortexlabs/kirari": patch
---

Fix quadratic scanning time on long runs of short tokens in CSS, Makefile, TOML, YAML, and Markdown with embedded languages. Rules that look ahead past a name no longer rescan the rest of the run at every token, and an unclosed fence on a single line no longer backtracks over the whole line.

YAML numbers, booleans, and nulls now end before `#` only when whitespace precedes it, so `3#x` reads as one plain scalar as in YAML. TOML numbers no longer split names such as `42n`. No public API changes.
