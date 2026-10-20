import type { ReactNode } from 'react'
import type { Props as ButtonBaseProps } from '@/components/ui/ButtonBase/ButtonBase.types'

export type Variant = 'primary' | 'secondary' | 'tertiary'
export type Size = 'xs' | 'sm' | 'md' | 'lg'
export type Props = ButtonBaseProps & {
	variant?: Variant
	size?: Size
	startIcon?: ReactNode
	endIcon?: ReactNode
}
