import type NextLink from 'next/link'
import type { ComponentProps } from 'react'

export type Variant = 'plain' | 'subtle' | 'strong'
export type Props = ComponentProps<typeof NextLink> & {
	variant?: Variant
	external?: boolean
	arrow?: boolean
}
