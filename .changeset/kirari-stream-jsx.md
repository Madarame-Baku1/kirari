---
"@vortexlabs/kirari": patch
---

Stream built-in JSX, TSX, and JSONC in checkpoint mode. `createTokenStream(tsx)` now rescans from the last newline outside elements instead of retokenizing all accumulated source on every write. Streaming 8 KB of TSX one character at a time drops from about 13 seconds to about 0.2 seconds. Streamed tokens still equal batch tokenization after every write, and copies or extensions of these definitions keep using full mode. A long element rescans from its opening line until it closes, and a sibling element that has not closed yet keeps the lines after it revisable.

No public API changes.
