import { core, languages } from '../test/fixtures/all-languages.js'
import { createTokenStream } from '@vortexlabs/kirari/stream'
import { renderDecorated } from '@vortexlabs/kirari/decorations'
import { createRegistry } from '@vortexlabs/kirari/registry'
import { createMarkdown } from '@vortexlabs/kirari/markdown'
import { javascript as streamJavaScript } from '@vortexlabs/kirari/languages/javascript'
import { corpus } from '../test/corpus/fixtures.js'

export const api = { core, languages, createTokenStream, renderDecorated, createRegistry, createMarkdown, streamJavaScript, corpus }
