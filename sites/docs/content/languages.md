# Languages

Explore every opt-in language and format.

From components to configuration files. Import the definitions you need; the others stay out of your bundle.

Import from `/core` to ship only Python. The main entry always bundles JavaScript as its default.

```js
import { tokenize, render } from '@vortexlabs/kirari/core'
import { python } from '@vortexlabs/kirari/languages/python'

const html = render(tokenize('print("Hello, world!")', python))
```

| Language | Import |
| --- | --- |
| C | `@vortexlabs/kirari/languages/c` |
| C# | `@vortexlabs/kirari/languages/csharp` |
| C++ | `@vortexlabs/kirari/languages/cpp` |
| Clojure | `@vortexlabs/kirari/languages/clojure` |
| CSS | `@vortexlabs/kirari/languages/css` |
| Dart | `@vortexlabs/kirari/languages/dart` |
| Diff | `@vortexlabs/kirari/languages/diff` |
| Dockerfile | `@vortexlabs/kirari/languages/dockerfile` |
| Dotenv | `@vortexlabs/kirari/languages/dotenv` |
| Elixir | `@vortexlabs/kirari/languages/elixir` |
| GLSL | `@vortexlabs/kirari/languages/glsl` |
| Go | `@vortexlabs/kirari/languages/go` |
| GraphQL | `@vortexlabs/kirari/languages/graphql` |
| Groovy | `@vortexlabs/kirari/languages/groovy` |
| HCL | `@vortexlabs/kirari/languages/hcl` |
| HTML | `@vortexlabs/kirari/languages/html` |
| INI | `@vortexlabs/kirari/languages/ini` |
| Java | `@vortexlabs/kirari/languages/java` |
| JavaScript | `@vortexlabs/kirari/languages/javascript` |
| JSON | `@vortexlabs/kirari/languages/json` |
| JSONC | `@vortexlabs/kirari/languages/jsonc` |
| JSX | `@vortexlabs/kirari/languages/jsx` |
| Julia | `@vortexlabs/kirari/languages/julia` |
| Kotlin | `@vortexlabs/kirari/languages/kotlin` |
| Lua | `@vortexlabs/kirari/languages/lua` |
| Makefile | `@vortexlabs/kirari/languages/makefile` |
| Markdown | `@vortexlabs/kirari/languages/markdown` |
| Nginx | `@vortexlabs/kirari/languages/nginx` |
| PHP | `@vortexlabs/kirari/languages/php` |
| Plain text | `@vortexlabs/kirari/languages/plaintext` |
| PowerShell | `@vortexlabs/kirari/languages/powershell` |
| Protocol Buffers | `@vortexlabs/kirari/languages/protobuf` |
| Python | `@vortexlabs/kirari/languages/python` |
| R | `@vortexlabs/kirari/languages/r` |
| Ruby | `@vortexlabs/kirari/languages/ruby` |
| Rust | `@vortexlabs/kirari/languages/rust` |
| Scala | `@vortexlabs/kirari/languages/scala` |
| Shell | `@vortexlabs/kirari/languages/shell` |
| SQL | `@vortexlabs/kirari/languages/sql` |
| Svelte | `@vortexlabs/kirari/languages/svelte` |
| Swift | `@vortexlabs/kirari/languages/swift` |
| TOML | `@vortexlabs/kirari/languages/toml` |
| TSX | `@vortexlabs/kirari/languages/tsx` |
| TypeScript | `@vortexlabs/kirari/languages/typescript` |
| Vue | `@vortexlabs/kirari/languages/vue` |
| XML | `@vortexlabs/kirari/languages/xml` |
| YAML | `@vortexlabs/kirari/languages/yaml` |
| Zig | `@vortexlabs/kirari/languages/zig` |

JSX and TSX are separate definitions. Use `hcl` for Terraform and `shell` for common shell syntax. These are lexical grammars, not compiler parsers.
