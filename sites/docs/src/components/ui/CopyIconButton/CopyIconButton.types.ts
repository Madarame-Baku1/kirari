import type { CopyOptions } from '@/components/ui/ClipboardProvider/ClipboardProvider.types'
import type { Size } from '@/components/ui/IconButton/IconButton.types'

export type Props = CopyOptions & {
	label: string
	size?: Size
	glyphSize?: number
	hash?: boolean
	className?: string
	'data-anchor'?: string
}
