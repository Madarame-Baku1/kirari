import type { ReactNode } from 'react'

export type Props = {
	/** Names the scroll region for assistive technology. */
	label: string
	/** A single `<table>`; header cells and row labels get one band, data cells get both. */
	children: ReactNode
}

export type Band = {
	start: number
	size: number
}

export type State = {
	row: Band
	column: Band
	rowVisible: boolean
	columnVisible: boolean
	/** Skips the glide when a band appears, so it fades in where the pointer is. */
	snap: boolean
}

export type Overflow = {
	start: boolean
	end: boolean
}
