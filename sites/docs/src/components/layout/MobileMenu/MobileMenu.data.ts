import type { Page } from '@/lib/navigation.types'

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
		target: 'compare',
		label: 'Compare',
	},
	{
		target: 'changelog',
		label: 'Changelog',
	},
]
