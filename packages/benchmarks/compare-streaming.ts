import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { cpus } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { render, tokenize } from '../kirari/src/core.js'
import { createTokenStream } from '../kirari/src/stream.js'
import { javascript } from '../kirari/src/languages/javascript.js'
import type { Token } from '../kirari/src/types.js'
import { summarize } from './benchmark.js'

const dependencies = process.argv[2]
assert.ok(dependencies, 'Pass the directory containing the comparison node_modules; see docs/comparison.md')
const require = createRequire(join(resolve(dependencies), 'package.json'))
const load = (id: string) => import(pathToFileURL(require.resolve(id)).href)
const { default: Prism } = await load('prismjs/components/prism-core')
await load('prismjs/components/prism-clike')
await load('prismjs/components/prism-javascript')
const { default: hljs } = await load('highlight.js/lib/core')
hljs.registerLanguage('javascript', (await load('highlight.js/lib/languages/javascript')).default)
const { createHighlighterCoreSync, getTokenStyleObject, stringifyTokenStyle } = await load('shiki/core')
const { createJavaScriptRegexEngine } = await load('shiki/engine/javascript')
const { ShikiStreamTokenizer } = await load('@shikijs/stream')
const highlighter = createHighlighterCoreSync({
  langs: [(await load('@shikijs/langs/javascript')).default],
  themes: [(await load('@shikijs/themes/github-dark')).default],
  engine: createJavaScriptRegexEngine(),
})

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const decode = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
  (entity: string, code: string) => code.startsWith('#')
    ? String.fromCodePoint(code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)))
    : ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" })[entity]!)
type StyledToken = { content: string; color?: string; fontStyle?: number; htmlStyle?: Record<string, string> }
const renderShiki = (tokens: StyledToken[]) => tokens.map(token =>
  `<span style="${escape(stringifyTokenStyle(token.htmlStyle || getTokenStyleObject(token)))}">${escape(token.content)}</span>`).join('')

type Runner = (chunks: string[], validate: boolean) => string | Promise<string>
let checksum = 0
const consume = (html: string) => { checksum = (checksum + html.length + (html.charCodeAt(html.length >>> 1) || 0)) | 0 }
const full = (highlight: (source: string) => string): Runner => (chunks, validate) => {
  let source = '', html = ''
  for (const chunk of chunks) {
    source += chunk
    html = highlight(source)
    consume(html)
    if (validate) assert.equal(decode(html), source)
  }
  return decode(html)
}
const runners: Record<string, Runner> = {
  kirari: (chunks, validate) => {
    const stream = createTokenStream(javascript)
    const tokens: Token[] = []
    let source = ''
    const apply = (patch: ReturnType<typeof stream.write>) => {
      while (tokens.length && tokens.at(-1)!.start >= patch.from) tokens.pop()
      tokens.push(...patch.tokens)
      const html = render(patch.tokens)
      consume(html)
      if (validate) {
        assert.equal(decode(html), source.slice(patch.from))
        assert.deepEqual(tokens, tokenize(source, javascript))
      }
    }
    for (const chunk of chunks) { source += chunk; apply(stream.write(chunk)) }
    apply(stream.end())
    return tokens.map(token => token.value).join('')
  },
  shiki: async (chunks, validate) => {
    const stream = new ShikiStreamTokenizer({ highlighter, lang: 'javascript', theme: 'github-dark' })
    const stable: string[] = []
    let source = ''
    for (const chunk of chunks) {
      source += chunk
      const result: { stable: StyledToken[]; unstable: StyledToken[] } = await stream.enqueue(chunk)
      const done = renderShiki(result.stable), pending = renderShiki(result.unstable)
      stable.push(...result.stable.map(token => token.content))
      consume(done); consume(pending)
      if (validate) {
        assert.equal(decode(done), result.stable.map(token => token.content).join(''))
        assert.equal(stable.join('') + decode(pending), source)
      }
    }
    const tail: StyledToken[] = stream.close().stable
    consume(renderShiki(tail))
    return stable.join('') + tail.map(token => token.content).join('')
  },
  prism: full(source => Prism.highlight(source, Prism.languages.javascript, 'javascript')),
  highlightjs: full(source => hljs.highlight(source, { language: 'javascript' }).value),
}

const file = await readFile(require.resolve('highlight.js/lib/core'), 'utf8')
const versions: Record<string, string> = {}
for (const name of ['shiki', '@shikijs/stream', 'prismjs', 'highlight.js']) {
  versions[name] = JSON.parse(await readFile(join(resolve(dependencies), 'node_modules', name, 'package.json'), 'utf8')).version
}
const results = []
for (const size of [2048, 8192, 32768]) {
  const end = file.indexOf('\n', size)
  assert.ok(end >= size, 'Fixture is shorter than the target size')
  const source = file.slice(0, end + 1)
  const chunks = Array.from({ length: Math.ceil(source.length / 16) }, (_, index) => source.slice(index * 16, index * 16 + 16))
  const plans = Object.entries(runners).map(([id, run]) => ({ id, run, samples: [] as number[] }))
  for (const { run } of plans) assert.equal(await run(chunks, true), source)
  for (let round = 0; round < 7; round++) {
    const order = [...plans.slice(round % plans.length), ...plans.slice(0, round % plans.length)]
    if (round % 2) order.reverse()
    for (const plan of order) {
      const start = performance.now()
      const output = await plan.run(chunks, false)
      plan.samples.push(performance.now() - start)
      assert.equal(output, source)
    }
  }
  const result = { targetBytes: size, bytes: Buffer.byteLength(source), updates: chunks.length,
    timings: Object.fromEntries(plans.map(plan => [plan.id, summarize(plan.samples)])) }
  results.push(result)
  console.log(JSON.stringify(result))
}
const output = new URL('results/compare-streaming.json', import.meta.url)
await mkdir(new URL('.', output), { recursive: true })
await Bun.write(output, JSON.stringify({ measuredAt: new Date().toISOString(), runtime: `Bun ${Bun.version}`,
  cpu: cpus()[0]?.model, versions, fixtureSHA256: createHash('sha256').update(file).digest('hex'),
  chunkUnits: 16, rounds: 7, checksum, results }, null, 2) + '\n')
highlighter.dispose()
