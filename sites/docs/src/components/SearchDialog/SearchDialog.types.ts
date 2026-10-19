export type Entry = {
	title: string
	description: string
	category: string
	href: string
	keywords?: string
}
export type Props = {
	open: boolean
	onClose: () => void
	entries: Entry[]
}
