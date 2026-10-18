import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'
import { escapeInlineScript } from '../scripts/build.js'

// Build in a child process: Bun 1.3 inside `bun test` fails when a second Bun.build reads a file an earlier one read.
const build = Bun.spawnSync(['bun', fileURLToPath(new URL('../scripts/build.ts', import.meta.url))], { stderr: 'inherit' })
if (build.exitCode !== 0) throw new Error('Docs build failed')
const outputs = build.stdout.toString().trim().split('\n')
const pages = await Promise.all(outputs.map(async path => ({ path, html: await Bun.file(path).text() })))

test('build writes the landing, docs, and playground pages', () => {
  expect(outputs.map(path => path.replace(/.*\/dist\//, '')).sort()).toEqual(['docs/index.html', 'index.html', 'playground/index.html'])
})

for (const { path, html } of pages) {
  const name = path.replace(/.*\/dist\//, '')
  test(`${name} is standalone HTML with one fully bundled module`, () => {
    expect(html).toMatch(/<!doctype html>/i)
    expect(html).not.toMatch(/__KIRARI_(?:CSS|SCRIPT)__/)
    expect(html).toContain('.kirari-')
    // rel="canonical" is metadata, not a loaded asset.
    const assets = [...html.matchAll(/<(?:script|link)\b(?![^>]*rel="canonical")[^>]*(?:src|href)="([^"]*)"/gi)].map(match => match[1]!)
    expect(assets.filter(asset => !asset.startsWith('data:'))).toEqual(['https://cdn.usefathom.com/script.js'])
    expect(html).toContain('<script src="https://cdn.usefathom.com/script.js" data-site="YGMATMZF" defer></script>')
    const modules = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/gi)]
    expect(modules).toHaveLength(1)
    expect(modules[0]![1]!.length).toBeGreaterThan(100)
    expect(new Bun.Transpiler({ loader: 'js' }).scan(modules[0]![1]!).imports).toEqual([])
    const index = html.match(/<script type="application\/json" id="search-index">([\s\S]*?)<\/script>/)
    expect(JSON.parse(index![1]!).length).toBeGreaterThan(48)
  })
}

test('the landing page does not bundle the playground language definitions', () => {
  const size = (name: string) => pages.find(page => page.path.endsWith(`/dist/${name}`))!.html.length
  expect(size('index.html')).toBeLessThan(size('playground/index.html') - 20_000)
})

test('embedded sample strings cannot terminate the script and retain their value', () => {
  const sample = '</script><script>alert(1)</script> </ScRiPt >'
  const script = escapeInlineScript(`return ${JSON.stringify(sample)}`)
  expect(script).not.toMatch(/<\/script/i)
  expect(new Function(script)()).toBe(sample)
})
