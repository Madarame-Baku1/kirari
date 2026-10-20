import type { ReactNode } from 'react'

export type Copy = (text: string, message?: string) => Promise<boolean>
export type Props = {
	children: ReactNode
}
export type CopyOptions = {
	text: string | (() => string)
	message?: string
	onCopied?: () => void
}
