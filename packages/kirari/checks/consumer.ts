import { highlight, tokenize, type tokenTypes } from '@vortexlabs/kirari'
import { render, tokenize as scan } from '@vortexlabs/kirari/core'
import { python } from '@vortexlabs/kirari/languages/python'
import { tsx } from '@vortexlabs/kirari/languages/tsx'
import { rust } from '@vortexlabs/kirari/languages/rust'
import { markdown } from '@vortexlabs/kirari/languages/markdown'
import { vue } from '@vortexlabs/kirari/languages/vue'
import { graphql } from '@vortexlabs/kirari/languages/graphql'
import { lua } from '@vortexlabs/kirari/languages/lua'
import { powershell } from '@vortexlabs/kirari/languages/powershell'
import type { Language, Token } from '@vortexlabs/kirari'
import { createTokenStream, type TokenPatch } from '@vortexlabs/kirari/stream'
import { renderDecorated, type Decoration } from '@vortexlabs/kirari/decorations'
import { createRegistry, type LanguageRegistry } from '@vortexlabs/kirari/registry'
import { createMarkdown } from '@vortexlabs/kirari/markdown'
import { javascript } from '@vortexlabs/kirari/languages/javascript'

const language: Language = python
const tokens: readonly Token[] = tokenize('answer = 42', language)
const html: string = highlight('print(answer)', { language, classes: { variable: 'name' } })
const rendered: string = render(scan('answer = 42', python))
const category: (typeof tokenTypes)[number] = 'variable'
void [tokens, html, rendered, category]
highlight('<Card>{value}</Card>', { language: tsx, classes: { tag: 'component', attribute: 'prop' } })
scan('fn main() {}', rust)
scan('# Heading', markdown)
scan('<p>{{ count }}</p>', vue)
scan('query User($id: ID!) { user(id: $id) { name } }', graphql)
scan('local value = [[hello]]', lua)
scan('$name = "hello"', powershell)

const stream = createTokenStream(javascript)
const patch: TokenPatch = stream.write('const count = 1\n')
const decoration: Decoration = { start: 6, end: 11, className: 'selected' }
renderDecorated(patch.tokens, {
  decorations: [decoration], lines: true,
  lineClassName: line => line.number === 1 ? 'active' : undefined,
})
stream.end()
stream.reset()
const registry: LanguageRegistry = createRegistry([javascript, python])
const resolved: Language | undefined = registry.resolve('example.py')
scan('```js\nconst n = 1\n```', createMarkdown(registry))
void resolved

// @ts-expect-error Source must be a string.
highlight(42)
// @ts-expect-error Languages are definitions, not names in a global registry.
highlight('answer = 42', { language: 'python' })
