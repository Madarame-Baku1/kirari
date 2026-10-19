import type { Ref } from 'react'

export type Props = {
	className?: string
	id: string
	label: string
	html: string
	hidden: boolean
	ref?: Ref<HTMLPreElement>
}
