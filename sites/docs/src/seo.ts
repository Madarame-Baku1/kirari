import type { Metadata } from 'next'
import { docsPath, sections } from './navigation'
import { site } from './site'

export const description =
	'Lightweight syntax highlighting for JavaScript, TypeScript, React, and Markdown. Explore 48 languages, CSS themes, and streaming code with Kirari.'

export const pageMetadata = (title: string, summary: string, path: string): Metadata => ({
	title: {
		absolute: `${title} | Kirari`,
	},
	description: summary,
	alternates: {
		canonical: path,
		...(path.startsWith('/docs/')
			? {
					types: {
						'text/markdown': path === '/docs/' ? '/docs.md' : `${path.slice(0, -1)}.md`,
					},
				}
			: {}),
	},
	openGraph: {
		title: `${title} | Kirari`,
		description: summary,
		url: path,
		siteName: site.name,
		type: 'website',
		images: [
			{
				url: '/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'Kirari — lightweight syntax highlighting',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: `${title} | Kirari`,
		description: summary,
		images: [
			'/opengraph-image',
		],
	},
})

export const indexablePaths = [
	'/',
	...sections.map(section => docsPath(section.id)),
	'/playground/',
]

export const softwareSchema = {
	'@context': 'https://schema.org',
	'@type': 'SoftwareSourceCode',
	'@id': `${site.url}/#software`,
	name: site.name,
	description,
	url: site.url,
	codeRepository: site.github,
	programmingLanguage: 'TypeScript',
	runtimePlatform: 'JavaScript',
	license: `${site.github}/blob/main/LICENSE`,
	version: site.version,
	author: {
		'@type': 'Person',
		...site.author,
	},
}

export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c')
