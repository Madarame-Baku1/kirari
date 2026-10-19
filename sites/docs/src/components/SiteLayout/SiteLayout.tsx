import { languageEntries } from '../../languages'
import { docsPath, routes, sections } from '../../navigation'
import { Header } from '../Header'
import type * as Types from './SiteLayout.types'

const searchEntries = [
	{
		title: 'Playground',
		description: 'Edit code, inspect tokens, and try themes.',
		category: 'Page',
		href: routes.playground,
	},
	...sections.map(section => ({
		title: section.title,
		description: section.description,
		category: 'Docs',
		href: docsPath(section.id),
	})),
	...languageEntries.map(entry => ({
		title: entry.label,
		description: `Try ${entry.filename} in the playground`,
		category: 'Language',
		href: `${routes.playground}?lang=${entry.id}`,
		keywords: `${entry.id} ${entry.group}`,
	})),
]

export const SiteLayout = (props: Types.Props) => {
	const { page, activeSection, children } = props

	return (
		<div data-page={page}>
			<a className="skip-link" href="#main">
				Skip to content
			</a>
			<Header page={page} activeSection={activeSection} searchEntries={searchEntries} />
			{children}
		</div>
	)
}
