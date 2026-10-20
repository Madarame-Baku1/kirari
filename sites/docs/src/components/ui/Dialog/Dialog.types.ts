import type { ComponentProps, ReactNode } from 'react'

export type Context = {
	onClose: () => void
}
export type Props = Omit<ComponentProps<'dialog'>, 'open' | 'onClose' | 'onCancel'> & {
	open: boolean
	onClose: () => void
}
export type CloseProps = {
	label?: string
	id?: string
	children?: ReactNode
}
