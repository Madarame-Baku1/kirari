import type { ComponentProps } from 'react'

export type Props = Omit<ComponentProps<'button'>, 'onClick'> & {
	text: string | (() => string)
	label: string
	target?: string
	message?: string
	size?: number
	hash?: boolean
	onCopied?: () => void
}
