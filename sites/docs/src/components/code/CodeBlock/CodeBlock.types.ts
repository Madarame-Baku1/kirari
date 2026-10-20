import type { ReactNode } from 'react'

export type Props = {
	id: string
	label: string
	text: string
	children?: ReactNode
	html?: string
	preClassName?: string
	codeClassName?: string
	copyLabel?: string
	/** Borderless with a drop shadow, for code shown on a tinted surface. */
	elevated?: boolean
	className?: string
}
