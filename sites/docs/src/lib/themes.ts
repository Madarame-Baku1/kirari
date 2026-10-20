import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type * as Types from './themes.types'

const directory = join(process.cwd(), '../../packages/kirari/themes')

/** Every published theme, read from the package's own CSS so the site never drifts from it. */
export const themes: Types.ThemeEntry[] = readdirSync(directory)
	.filter(file => file.endsWith('.css'))
	.map(file => {
		const css = readFileSync(join(directory, file), 'utf8')
		const header = css.match(/^\/\* (.+) \((light|dark)\) — (.+) \*\//)
		if (!header) throw new Error(`Theme ${file} is missing its header comment`)
		return {
			id: file.slice(0, -4),
			label: header[1]!,
			appearance: header[2] as 'light' | 'dark',
			credit: header[3]!,
			colors: new Map(
				[
					...css.matchAll(/--kirari-([a-z]+), (#[\da-f]{6})/g),
				].map(match => [
					match[1]!,
					match[2]!,
				]),
			),
		}
	})
	.sort(
		(a, b) =>
			Number(b.id === 'default') - Number(a.id === 'default') ||
			a.label.localeCompare(b.label),
	)

export const theme = (id: string) => themes.find(entry => entry.id === id)!

/** `[data-palette='id']` rules so any element can preview any theme. */
export const paletteCSS = (): string => {
	return themes
		.map(
			entry =>
				`[data-palette='${entry.id}'] { ${[
					...entry.colors,
				]
					.map(([name, value]) => `--kirari-${name}: ${value};`)
					.join(' ')} }`,
		)
		.join('\n')
}
