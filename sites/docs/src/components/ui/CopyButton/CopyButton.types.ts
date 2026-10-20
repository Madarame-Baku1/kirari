import type { ReactNode } from 'react'
import type { CopyOptions } from '@/components/ui/ClipboardProvider/ClipboardProvider.types'
import type { Size, Variant } from '@/components/ui/Button/Button.types'

export type Props = CopyOptions & {
	id?: string
	variant?: Variant
	size?: Size
	className?: string
	children: ReactNode
}
