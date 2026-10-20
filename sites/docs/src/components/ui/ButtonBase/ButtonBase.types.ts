import type { ComponentProps } from 'react'
import type { Props as LinkProps } from '@/components/ui/Link/Link.types'

export type NativeButtonProps = ComponentProps<'button'> & {
	href?: never
}
export type AnchorProps = Omit<LinkProps, 'variant' | 'arrow'>
export type Props = NativeButtonProps | AnchorProps
