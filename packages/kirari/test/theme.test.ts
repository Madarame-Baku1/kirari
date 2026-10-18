import { expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { themeCSS, themes } from '../scripts/themes.js'
import { tokenTypes } from '../src/types.js'

const files = (await readdir(new URL('../themes/', import.meta.url))).filter(name => name.endsWith('.css'))

test('every theme file is generated from scripts/themes.ts', async () => {
  expect(files.sort()).toEqual(themes.map(theme => `${theme.id}.css`).sort())
  for (const theme of themes) {
    expect(await Bun.file(new URL(`../themes/${theme.id}.css`, import.meta.url)).text()).toBe(themeCSS(theme))
  }
})

for (const file of files) {
  test(`${file} gives every built-in category its own CSS variable with a fallback`, async () => {
    const css = await Bun.file(new URL(`../themes/${file}`, import.meta.url)).text()
    expect(css).toMatch(/^\/\* .+ \((light|dark)\) — .+ \*\/\n/)
    for (const type of tokenTypes) {
      expect(css).toMatch(new RegExp(`\\.kirari-${type} \\{ color: var\\(--kirari-${type}, #[\\da-f]{6}\\); \\}`))
    }
    expect(css).not.toMatch(/--kirari-\w+\s*:/)
  })
}
