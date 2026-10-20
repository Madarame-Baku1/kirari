import { readMarkdown } from '../../content'
import { sections } from '../../navigation'
import { themes } from '../../themes'
import { DocsNavigation } from '../DocsNavigation'
import { Footer } from '../Footer'
import { GuideLink } from '../GuideLink'
import { LegacyDocsRedirect } from '../LegacyDocsRedirect'
import { Link } from '../Link'
import { MarkdownContent } from '../MarkdownContent'
import { PageActions } from '../PageActions'
import { SiteLayout } from '../SiteLayout'
import { ThemeCard } from '../ThemeCard'
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
