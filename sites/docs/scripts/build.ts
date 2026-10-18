import { mkdir, rename, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderDocs } from '../src/pages/docs.js'
import { renderLanding } from '../src/pages/landing.js'
import { renderPlayground } from '../src/pages/playground.js'
import { paletteCSS } from '../src/themes.js'

export const escapeInlineScript = (source: string): string => {
  return source.replace(/<\/script/gi, match => match.replace('/', '\\/'))
}

/** Each page is a standalone HTML file with its own inlined client bundle. */
export const pages = [
  { path: 'index.html', entry: '../src/client/landing.ts', render: renderLanding },
  { path: 'docs/index.html', entry: '../src/client/docs.ts', render: renderDocs },
  { path: 'playground/index.html', entry: '../src/client/playground.ts', render: renderPlayground },
] as const

const bundle = async (entry: string): Promise<string> => {
  const result = await Bun.build({
    entrypoints: [fileURLToPath(new URL(entry, import.meta.url))],
    target: 'browser',
    format: 'esm',
    minify: true,
    splitting: false,
  })
  if (!result.success) throw new AggregateError(result.logs, `Docs bundle failed: ${entry}`)
  if (result.outputs.length !== 1) throw new Error(`Expected one standalone bundle for ${entry}`)
  return escapeInlineScript(await result.outputs[0]!.text())
}

const writeAtomic = async (output: string, contents: string) => {
  await mkdir(dirname(output), { recursive: true })
  const temporary = `${output}.${crypto.randomUUID()}.tmp`
  try {
    await Bun.write(temporary, contents)
    await rename(temporary, output)
  } finally {
    await rm(temporary, { force: true })
  }
}

export const buildSite = async (): Promise<string[]> => {
  const [theme, styles] = await Promise.all([
    Bun.file(fileURLToPath(import.meta.resolve('@vortexlabs/kirari/theme.css'))).text(),
    Bun.file(new URL('../src/style.css', import.meta.url)).text(),
  ])
  return Promise.all(pages.map(async page => {
    const script = await bundle(page.entry)
    const html = page.render()
      .replace('__KIRARI_CSS__', () => `${theme}\n${paletteCSS()}\n${styles}`)
      .replace('__KIRARI_SCRIPT__', () => script)
    const output = fileURLToPath(new URL(`../dist/${page.path}`, import.meta.url))
    await writeAtomic(output, html)
    return output
  }))
}

if (import.meta.main) console.log((await buildSite()).join('\n'))
