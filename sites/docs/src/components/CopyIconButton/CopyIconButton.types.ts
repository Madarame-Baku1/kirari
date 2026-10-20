import type { CopyOptions } from '../ClipboardProvider/ClipboardProvider.types'
import type { Size } from '../IconButton/IconButton.types'

export type Props = CopyOptions & {
	label: string
	size?: Size
	glyphSize?: number
	hash?: boolean
	className?: string
	'data-anchor'?: string
}
