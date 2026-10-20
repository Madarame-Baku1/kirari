import type { Ref } from 'react'

export type Variant = 'outline' | 'bare'
export type Props = {
	id: string
	/** Visually hidden label; the placeholder is not an accessible name. */
	label: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	variant?: Variant
	className?: string
	ref?: Ref<HTMLInputElement>
}
