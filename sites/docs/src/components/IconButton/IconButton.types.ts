import type { ReactNode } from 'react'
import type { Props as ButtonBaseProps } from '../ButtonBase/ButtonBase.types'

export type Size = 'xs' | 'sm' | 'md'
export type Props = ButtonBaseProps & {
	/** Accessible name; icon-only controls have no visible text. */
	label: string
	size?: Size
	children: ReactNode
}
