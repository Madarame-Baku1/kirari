import { site } from '../../site'
import type { Name } from '../Icon/Icon.types'
import type { Page } from '../../shared.types'

export const pageLinks: readonly {
	target: Page
	label: string
}[] = [
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

export const externalLinks: readonly {
	href: string
	label: string
}[] = [
	{
		href: site.npm,
		label: 'npm',
	},
]

export const iconLinks: readonly {
	href: string
	label: string
	icon: Name
}[] = [
	{
		href: site.github,
		label: 'Kirari on GitHub',
		icon: 'github',
	},
]
