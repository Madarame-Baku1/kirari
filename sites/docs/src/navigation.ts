import type * as Types from './navigation.types'

export const sections = [
	{
		id: 'overview',
		title: 'Introduction',
		group: 'Getting started',
		description: 'What Kirari is and how the pieces fit together.',
	},
	{
		id: 'languages',
		title: 'Languages',
		group: 'Customize',
		description: 'Explore every opt-in language and format.',
	},
	{
		id: 'themes',
		title: 'Themes',
		group: 'Customize',
		description: 'Pick from built-in themes like GitHub, Dracula, Nord, and Catppuccin.',
	},
	{
		id: 'theming',
		title: 'Custom themes',
		group: 'Customize',
		description: 'Style token categories with CSS variables and classes.',
	},
	{
		id: 'rendering',
		title: 'Custom rendering',
		group: 'Customize',
		description: 'Use raw tokens and source offsets in your own UI.',
	},
	{
		id: 'decorations',
		title: 'Decorations',
		group: 'Customize',
		description: 'Add source ranges and line wrappers to highlighted HTML.',
	},
	{
		id: 'streaming',
		title: 'Streaming',
		group: 'Advanced',
		description: 'Apply token patches as source chunks arrive.',
	},
	{
		id: 'markdown',
		title: 'Markdown fences',
		group: 'Advanced',
		description: 'Resolve language aliases and highlight fenced code blocks.',
	},
	{
		id: 'rehype',
		title: 'Rehype & MDX',
		group: 'Advanced',
		description: 'Highlight code blocks while building Markdown and MDX documents.',
	},
	{
		id: 'react',
		title: 'React',
		group: 'Advanced',
		description: 'Render highlighted code as React elements, on the server or while streaming.',
	},
	{
		id: 'grammars',
		title: 'Custom grammars',
		group: 'Advanced',
		description: 'Extend definitions with your own rules and categories.',
	},
	{
		id: 'api',
		title: 'API reference',
		group: 'Reference',
		description: 'Core functions, optional entry points, and their options.',
	},
	{
		id: 'limitations',
		title: 'Scope & limits',
		group: 'Reference',
		description: 'Lexical coverage, trusted grammars, and runtime support.',
	},
] as const

export const sectionGroups = [
	'Getting started',
	'Customize',
	'Advanced',
	'Reference',
] as const

export const routes = {
	home: '/',
	docs: '/docs/',
	playground: '/playground/',
} as const

export const docsPath = (id: Types.SectionId) =>
	id === 'overview' ? routes.docs : `${routes.docs}${id}/`
