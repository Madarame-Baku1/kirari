import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

// Install competitors outside the workspace; see docs/comparison.md.
const dependencies = process.argv[2]
assert.ok(dependencies, 'Pass the directory containing the comparison node_modules')
const directory = await mkdtemp(join(resolve(dependencies), '.compare-'))
const entries = {
  kirari: `import { highlight } from ${JSON.stringify(new URL('../kirari/src/index.ts', import.meta.url).pathname)}
export const run = code => highlight(code)`,
  shiki: `import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import javascript from '@shikijs/langs/javascript'
import githubDark from '@shikijs/themes/github-dark'
const highlighter = createHighlighterCoreSync({ themes: [githubDark], langs: [javascript], engine: createJavaScriptRegexEngine() })
export const run = code => highlighter.codeToHtml(code, { lang: 'javascript', theme: 'github-dark' })`,
  prismjs: `import Prism from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
export const run = code => Prism.highlight(code, Prism.languages.javascript, 'javascript')`,
  'highlight.js': `import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)
export const run = code => hljs.highlight(code, { language: 'javascript' }).value`,
}

try {
  console.log(`Bun ${Bun.version}; browser ESM; minified; gzip level 9; CSS excluded.`)
  for (const [name, source] of Object.entries(entries)) {
    const packagePath = name === 'kirari'
      ? new URL('../kirari/package.json', import.meta.url)
      : join(resolve(dependencies), 'node_modules', name, 'package.json')
    const { version } = JSON.parse(await readFile(packagePath, 'utf8'))
    const entry = join(directory, `${name}.ts`)
    await Bun.write(entry, source)
    const result = await Bun.build({ entrypoints: [entry], target: 'browser', format: 'esm', minify: true })
    if (!result.success) throw new AggregateError(result.logs, `Build failed: ${name}`)
    assert.equal(result.outputs.length, 1, `${name}: unexpected extra chunks`)
    const bytes = new Uint8Array(await result.outputs[0]!.arrayBuffer())
    const output = join(directory, `${name}.mjs`)
    await Bun.write(output, bytes)
    const { run } = await import(pathToFileURL(output).href)
    const input = 'const answer = "<&>";\n// preserve source'
    const html = run(input)
    assert.match(html, /<span\b/, `${name}: expected highlighted output`)
    const text = html.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
      (entity: string, code: string) => code.startsWith('#')
        ? String.fromCodePoint(code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)))
        : ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" })[entity]!)
    assert.equal(text, input, `${name}: source changed`)
    console.log(`${name} ${version}${name === 'kirari' ? ' (working tree)' : ''}: ${bytes.length} minified, ${gzipSync(bytes, { level: 9 }).length} gzip`)
  }
} finally {
  await rm(directory, { recursive: true, force: true })
}
