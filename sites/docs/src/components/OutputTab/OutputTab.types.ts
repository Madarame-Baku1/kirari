export type Mode = 'preview' | 'js' | 'react' | 'markdown' | 'css'
export type Props = {
	value: Mode
	label: string
	selected: boolean
	onClick: () => void
}
