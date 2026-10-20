---
"@vortexlabs/kirari": patch
---

Stream built-in Python in checkpoint mode. `createTokenStream(python)` now rescans from the last safe newline outside f-strings instead of retokenizing all accumulated source on every write, and reclassifies function names only from the last point later input can no longer change. Streaming 8 KB of Python one character at a time drops from about 5 seconds to about 0.1 seconds, and patches start near the end of the source instead of at zero. Streamed tokens still equal batch tokenization after every write, and copies or extensions of the Python definition keep using full mode. Very long lines and unfinished triple-quoted strings still rescan from their start on each write, as in JavaScript, and so does a parenthesized value assigned with `=` until its closing parenthesis arrives.

Fix Python names before a colon being highlighted as functions because of a later line. The check behind `name: Type = lambda: …` continued across newlines, so `ready` in `if ready:`, `items` in `for item in items:`, and `count` in `count: int` became functions when a later statement assigned a lambda. The check now stops at the end of the logical line, as Python does; annotations inside brackets or continued with a backslash still reach their `=`. Python `<` and `>` are no longer paired like generic brackets, so a comparison on a later line cannot hide an annotation's `=`.

Stop `renderDecorated` with `lines: true` from adding an empty last line wrapper after a trailing newline. The newline still follows the last wrapper, so the source text is unchanged. Blank lines before it keep their wrappers, and an empty source still renders one empty line wrapper.

No public API changes.
