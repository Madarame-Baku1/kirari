export type Usage = 'js' | 'react' | 'markdown'
export type UsageOptions = {
	name: string
	theme: string
	source: string
	usage: Usage
}
export type Output = 'preview' | Usage | 'css'
export type Props = {
	themes: {
		id: string
		label: string
		appearance: 'light' | 'dark'
		colors: Record<string, string>
	}[]
}
