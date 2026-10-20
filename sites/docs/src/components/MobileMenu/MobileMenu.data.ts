import type { Page } from '../../shared.types'

export const pageLinks: readonly {
	target: Page
	label: string
}[] = [
	{
		target: 'home',
		label: 'Home',
	},
	{
		target: 'docs',
		label: 'Docs',
	},
	{
		target: 'playground',
		label: 'Playground',
	},
	{
		target: 'changelog',
		label: 'Changelog',
	},
]
