import type { ComponentProps } from 'react'

export type Props = Omit<ComponentProps<'code'>, 'children' | 'dangerouslySetInnerHTML'> & {
	html: string
}
