import { DocsPage } from '../../components/DocsPage'
import { pageMetadata } from '../../seo'

export const metadata = pageMetadata(
	'Syntax highlighting documentation',
	'Learn how to install Kirari, highlight code, customize CSS themes, and integrate with React, Markdown, and MDX.',
	'/docs/',
)

const Docs = () => <DocsPage />

export default Docs
