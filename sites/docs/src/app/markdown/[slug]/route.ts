import { readMarkdown } from '../../../content'
import { docsPath, sections } from '../../../navigation'
import { site } from '../../../site'
import type * as Types from './route.types'

export const dynamic = 'force-static'
export const dynamicParams = false
export const generateStaticParams = () =>
	sections.map(section => ({
		slug: section.id,
	}))

export const GET = async (_request: Request, context: Types.Context) => {
	const { params } = context
	const { slug } = await params
	const section = sections.find(item => item.id === slug)
	if (!section)
		return new Response('Not found', {
			status: 404,
		})
	return new Response(await readMarkdown(section.id), {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'X-Robots-Tag': 'noindex',
			Link: `<${site.url}${docsPath(section.id)}>; rel="canonical"`,
		},
	})
}
