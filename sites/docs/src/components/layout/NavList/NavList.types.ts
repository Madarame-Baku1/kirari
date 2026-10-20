import type { ReactNode } from 'react'

export type Variant = 'sidebar' | 'menu'
export type Props = {
	variant?: Variant
	className?: string
	children: ReactNode
}
export type GroupProps = {
	title: string
	children: ReactNode
}
export type ItemProps = {
	href: string
	current?: boolean
	onNavigate?: () => void
	children: ReactNode
}
