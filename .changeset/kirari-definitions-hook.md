---
"@vortexlabs/kirari": minor
---

Shrink the default bundle from about 6.1 KB to about 4.3 KB gzipped. Function definition classification for non-JavaScript languages moved out of the core scanner into a new optional `Language.definitions` hook, so the JavaScript entry and `kirari/core` no longer include it. The built-in definitions that use it (C, C++, C#, Clojure, Dart, Elixir, GLSL, Go, Groovy, Java, Julia, Kotlin, Lua, PHP, PowerShell, Protobuf, Python, R, Ruby, Rust, Scala, Shell, SQL, Swift, and Zig) set the hook themselves, and their output is unchanged.

Classification no longer depends on the definition's `name`. A copy made by spreading a built-in keeps its classification even when renamed, and a custom language that only reuses a built-in name such as `'python'` no longer gets it. Set `definitions: python.definitions` to opt in.
