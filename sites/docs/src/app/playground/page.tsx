import { Playground as PlaygroundEditor } from '@/features/playground/Playground'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { themes } from '@/themes'
import { pageMetadata } from '@/seo'

export const metadata = pageMetadata(
	'Syntax highlighting playground',
	'Try Kirari online with 48 languages. Edit code, inspect syntax tokens, preview themes, and export examples for JavaScript, React, or Markdown.',
	'/playground/',
)

const Playground = () => (
	<SiteLayout page="playground">
		<PlaygroundEditor
			themes={themes.map(theme => ({
				id: theme.id,
				label: theme.label,
				appearance: theme.appearance,
				colors: Object.fromEntries(theme.colors),
			}))}
		/>
	</SiteLayout>
)

export default Playground
