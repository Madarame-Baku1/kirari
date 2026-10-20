---
"@vortexlabs/kirari-rehype": patch
---

Stop line wrappers from adding an empty last line after a code block's trailing newline. Markdown code blocks always end with a newline, so every block rendered with `lines` or fence line metadata such as `{2,4-6}` showed an extra empty line, and an extra number when line numbers come from CSS. The newline still follows the last wrapper, so the source text is unchanged, and blank lines before it keep their wrappers.
