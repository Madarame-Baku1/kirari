import type { HTMLAttributes, ReactNode, RefCallback } from 'react'

export type Context = {
	id: string
	value: string
	onChange: (value: string) => void
}
export type Props<Value extends string> = {
	value: Value
	onChange: (value: Value) => void
	children: ReactNode
}
export type ListProps = {
	label: string
	className?: string
	children: ReactNode
}
export type TabProps = {
	value: string
	className?: string
	children: ReactNode
}
export type PanelProps = Omit<HTMLAttributes<HTMLElement>, 'id' | 'role'> & {
	value: string
	ref?: RefCallback<HTMLElement>
	/** Render as `pre` when the panel is itself the scrollable code block. */
	as?: 'div' | 'pre'
}
