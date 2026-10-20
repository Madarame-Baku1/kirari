import { routes } from '@/lib/navigation'
import { Link } from '@/components/ui/Link'
import type * as Types from './PageLink.types'

export const PageLink = (props: Types.Props) => {
	const { target, label, current, variant, onNavigate } = props

	return (
		<Link
			href={routes[target]}
			variant={variant}
			aria-current={current === target ? 'page' : undefined}
			onNavigate={onNavigate}
		>
			{label}
		</Link>
	)
}
