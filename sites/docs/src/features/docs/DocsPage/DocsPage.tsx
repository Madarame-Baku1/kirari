import { readMarkdown } from '@/lib/content'
import { sections } from '@/lib/navigation'
import { themes } from '@/lib/themes'
import { DocsNavigation } from '@/components/layout/DocsNavigation'
import { Footer } from '@/components/layout/Footer'
import { GuideLink } from '@/features/docs/GuideLink'
import { LegacyDocsRedirect } from '@/features/docs/LegacyDocsRedirect'
import { Link } from '@/components/ui/Link'
import { MarkdownContent } from '@/features/docs/MarkdownContent'
import { PageActions } from '@/features/docs/PageActions'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { ThemeCard } from '@/components/code/ThemeCard'
import type * as Types from './DocsPage.types'

export const DocsPage = async (props: Types.Props) => {
	const { id = 'overview' } = props
	const index = sections.findIndex(section => section.id === id)
	const section = sections[index]!
	const previous = sections[index - 1]
	const next = sections[index + 1]
	const markdown = await readMarkdown(id)

	return (
		<SiteLayout page="docs" activeSection={id}>
			{id === 'overview' && <LegacyDocsRedirect />}
			<div className="docs-layout">
				<nav className="docs-nav" aria-label="Documentation">
					<DocsNavigation active={id} />
				</nav>
				<main id="main" tabIndex={-1} className="docs-main">
					<div className="docs-toolbar">
						{id !== 'overview' && (
							<nav className="breadcrumbs" aria-label="Breadcrumb">
								<ol>
									<li>
										<Link href="/docs/" variant="subtle">
											Docs
										</Link>
									</li>
									<li aria-current="page">{section.title}</li>
								</ol>
							</nav>
						)}
						<PageActions id={id} markdown={markdown} />
					</div>
					<section id={id} className={`doc-section${id === 'overview' ? ' intro' : ''}`}>
						<p className="section-group">{section.group}</p>
						<MarkdownContent id={id} title={section.title} source={markdown} />
						{id === 'themes' && (
							<div className="theme-gallery">
								{themes.map(theme => (
									<ThemeCard key={theme.id} theme={theme} />
								))}
							</div>
						)}
					</section>
					<nav className="guide-pagination" aria-label="More documentation">
						{previous && <GuideLink section={previous} direction="prev" />}
						{next && <GuideLink section={next} direction="next" />}
					</nav>
				</main>
			</div>
			<Footer />
		</SiteLayout>
	)
}
