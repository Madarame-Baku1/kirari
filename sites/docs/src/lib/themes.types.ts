export type ThemeEntry = {
	id: string
	label: string
	appearance: 'light' | 'dark'
	credit: string
	/** `--kirari-*` name (without the prefix) to color, in file order. */
	colors: Map<string, string>
}
