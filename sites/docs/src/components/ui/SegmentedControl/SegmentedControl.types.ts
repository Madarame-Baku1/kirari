import type { ReactNode } from 'react'

export type Context = {
	value: string
	onChange: (value: string) => void
}
export type Props<Value extends string> = {
	label: string
	value: Value
	onChange: (value: Value) => void
	className?: string
	children: ReactNode
}
export type ItemProps = {
	value: string
	children: ReactNode
}
