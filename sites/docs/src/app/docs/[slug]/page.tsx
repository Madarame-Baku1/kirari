import { notFound, permanentRedirect } from 'next/navigation'
import { DocsPage } from '@/features/docs/DocsPage'
import { docsPath, sections } from '@/navigation'
import { pageMetadata, serializeJsonLd } from '@/seo'
import { site } from '@/site'
import type * as Types from './page.types'

export const dynamicParams = false
export const generateStaticParams = () => [
	...sections
		.filter(section => section.id !== 'overview')
		.map(section => ({
			slug: section.id,
		})),
	{
		slug: 'installation',
	},
]

const findSection = (slug: string) => {
	if (slug === 'installation') permanentRedirect('/docs/#installation')
	return sections.find(section => section.id === slug && slug !== 'overview') ?? notFound()
}

export const generateMetadata = async (props: Types.Props) => {
	const { params } = props
	const section = findSection((await params).slug)
	return pageMetadata(section.title, section.description, docsPath(section.id))
}

const Guide = async (props: Types.Props) => {
	const { params } = props
	const section = findSection((await params).slug)
	const breadcrumbs = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Kirari',
				item: site.url,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: 'Docs',
				item: `${site.url}/docs/`,
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: section.title,
				item: `${site.url}${docsPath(section.id)}`,
			},
		],
	}
	return (
		<>
			<DocsPage key={section.id} id={section.id} />
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON-LD escapes HTML delimiters
				dangerouslySetInnerHTML={{
					__html: serializeJsonLd(breadcrumbs),
				}}
			/>
		</>
	)
}

export default Guide
