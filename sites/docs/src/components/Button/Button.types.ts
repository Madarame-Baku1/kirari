import type { ReactNode } from 'react'
import type { Props as ButtonBaseProps } from '../ButtonBase/ButtonBase.types'

export type Variant = 'primary' | 'secondary' | 'ghost'
export type Size = 'xsmall' | 'small' | 'medium' | 'large'
export type Props = ButtonBaseProps & {
	variant?: Variant
	size?: Size
	startIcon?: ReactNode
	endIcon?: ReactNode
}
