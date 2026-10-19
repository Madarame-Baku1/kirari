import Link from 'next/link'
import { routes } from '../../navigation'
import type * as Types from './PageLink.types'

export const PageLink = (props: Types.Props) => {
	const { target, label, current, onNavigate } = props

	return (
		<Link
			href={routes[target]}
			aria-current={current === target ? 'page' : undefined}
			onNavigate={onNavigate}
		>
			{label}
		</Link>
	)
}
