---
"@vortexlabs/kirari-react": minor
---

Accept text children in `<Code>` the way React renders text. `<Code>let x = {count}</Code>` now highlights the joined source instead of misaligned tokens. Numbers and bigints are kept instead of dropped, and `null`, `undefined`, and booleans render nothing instead of throwing. Element children throw a `TypeError`. The `children` prop type widens from `string` to the new exported `CodeText` type.

Stop `lines` and `highlightLines` from adding an empty last line wrapper after a trailing newline. The newline still follows the last wrapper, so the source text is unchanged, and blank lines before it keep their wrappers.
