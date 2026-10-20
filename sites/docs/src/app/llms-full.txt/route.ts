import { readMarkdown } from '@/content'
import { docsPath, sections } from '@/navigation'
import { site } from '@/site'

export const dynamic = 'force-static'

export const GET = async () => {
	const guides = await Promise.all(
		sections.map(
			async section =>
				`Source: ${site.url}${docsPath(section.id)}\n\n${await readMarkdown(section.id)}`,
		),
	)
	return new Response(
		`# Kirari documentation (v${site.version})\n\n${guides.join('\n---\n\n')}`,
		{
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'X-Robots-Tag': 'noindex',
			},
		},
	)
}
