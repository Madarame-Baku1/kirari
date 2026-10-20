import { routes } from '@/navigation'
import { site } from '@/site'
import type { Name } from '@/components/ui/Icon/Icon.types'

export const links: readonly {
	href: string
	label: string
	prefetch?: boolean
}[] = [
	{
		href: routes.docs,
		label: 'Docs',
	},
	{
		href: routes.playground,
		label: 'Playground',
	},
	{
		href: routes.changelog,
		label: 'Changelog',
	},
	{
		href: '/llms.txt',
		label: 'llms.txt',
		prefetch: false,
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
	{
		href: site.x,
		label: 'Follow Ugi on X',
		icon: 'x',
	},
]
