import type { RefObject } from 'react'

export type Props = {
	className?: string
	id: string
	label: string
	html: string
	hidden: boolean
	ref?: RefObject<HTMLPreElement | null>
}
