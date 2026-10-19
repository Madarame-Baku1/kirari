import type { ReactNode } from 'react'

export type Props = {
	head: ReactNode
	rows: {
		text: string
		children: ReactNode
	}[]
}
