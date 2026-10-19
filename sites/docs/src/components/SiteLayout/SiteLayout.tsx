import { languageEntries } from '../../languages'
import { pageSearchEntries, routes } from '../../navigation'
import { Header } from '../Header'
import type * as Types from './SiteLayout.types'

const searchEntries = [
	...pageSearchEntries,
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
