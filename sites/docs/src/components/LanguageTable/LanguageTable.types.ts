import type { ReactNode } from 'react'

export type Row = {
	text: string
	children: ReactNode
}
export type Props = {
	head: ReactNode
	rows: Row[]
}
