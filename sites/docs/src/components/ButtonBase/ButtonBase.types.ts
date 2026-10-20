import type { ComponentProps } from 'react'
import type { Props as LinkProps } from '../Link/Link.types'

export type NativeButtonProps = ComponentProps<'button'> & {
	href?: never
}
export type AnchorProps = Omit<LinkProps, 'variant' | 'arrow'>
export type Props = NativeButtonProps | AnchorProps
