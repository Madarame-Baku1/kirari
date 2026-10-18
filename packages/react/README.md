# @vortexlabs/kirari-react

Kirari highlighting as React elements. `<Code>` renders tokens as `<span>`
elements, with no `dangerouslySetInnerHTML` and no hooks, so it works as a
Server Component.

## Install

```sh
npm install @vortexlabs/kirari @vortexlabs/kirari-react
```

Requires React 19. Kirari is a peer dependency.

## Usage

```tsx
import { Code } from '@vortexlabs/kirari-react'
import { typescript } from '@vortexlabs/kirari/languages/typescript'
import '@vortexlabs/kirari/theme.css'

<Code language={typescript} highlightLines={[1, [3, 4]]}>{source}</Code>
```

Output is `<pre class="kirari"><code>…</code></pre>` with the standard
`kirari-*` classes, so every Kirari theme works. `language` defaults to
JavaScript. Other props go to the `<pre>`.

| Prop | Effect |
| --- | --- |
| `lines` | Wrap each line in `<span class="kirari-line" data-line="n">`. |
| `highlightLines` | Lines or `[first, last]` ranges get `kirari-line-highlighted`. Implies `lines`. |
| `lineClassName` | `(line) => class` for a line wrapper. `line` is `{ number, start, end }`. |
| `decorations` | `{ start, end, className }` source ranges, as in [decorations](../../docs/decorations.md). |
| `classes` | Extra classes per token type, e.g. `{ keyword: 'kw' }`. |
| `tokenClassName` | `(token) => class` per token. |
| `tokens` | Pre-scanned tokens instead of `children`. |

Line numbers are CSS:

```css
.kirari-line::before { content: attr(data-line); display: inline-block; width: 3ch; margin-right: 2ch; opacity: 0.5; }
```

## Streaming

```tsx
'use client'
import { useTokenStream } from '@vortexlabs/kirari-react/stream'

const { tokens, write, end, reset } = useTokenStream(javascript)
// write(chunk) as text arrives, then end()
return <Code tokens={tokens} />
```

- Rescans only the unfinished tail. See [token streaming](../../docs/streaming.md).
- Changing `language` starts a new, empty stream.
- After `end()`, call `reset()` before writing again.
- `/stream` is a client module; `<Code>` is not.
- Managing tokens yourself? Use `createTokenStream` from `@vortexlabs/kirari/stream` with `applyPatch(tokens, patch)`.
