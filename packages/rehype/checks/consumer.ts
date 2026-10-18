import { unified } from 'unified'
import rehypeKirari, { type Options } from '@vortexlabs/kirari-rehype'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import type { Token } from '@vortexlabs/kirari/core'

const options: Options = {
  languages: [javascript],
  lines: true,
  classes: { variable: 'identifier' },
  className: (token: Token) => token.start === 0 ? 'first' : undefined,
  lineClassName: line => line.number === 1 && line.end >= line.start ? 'active' : undefined,
}
unified().use(rehypeKirari, options)
unified().use(rehypeKirari)

// @ts-expect-error Register language definitions, not implicit global names.
const invalid: Options = { languages: ['javascript'] }
void invalid
