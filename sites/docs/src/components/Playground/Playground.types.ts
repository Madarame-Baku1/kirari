import type { Mode } from '../OutputTab/OutputTab.types'

export type Usage = 'js' | 'react' | 'markdown'
export type UsageOptions = {
	name: string
	theme: string
	source: string
	usage: Usage
}
export type Output = Mode
export type Props = {
	themes: {
		id: string
		label: string
		appearance: 'light' | 'dark'
		colors: Record<string, string>
	}[]
}
