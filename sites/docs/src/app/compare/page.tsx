import { Compare as Comparison } from '@/features/compare/Compare'
import { Footer } from '@/components/layout/Footer'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
	'Kirari vs Shiki, Prism, and highlight.js',
	'Compare Kirari with Shiki, Prism, and highlight.js: engines, languages, themes, bundle size, streaming, and when to choose each.',
	'/compare/',
)

const Compare = () => (
	<SiteLayout page="compare">
		<Comparison />
		<Footer />
	</SiteLayout>
)

export default Compare
