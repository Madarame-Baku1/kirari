import type { ReactNode } from 'react'

export type Copy = (text: string, message?: string) => Promise<boolean>
export type Props = {
	children: ReactNode
}
