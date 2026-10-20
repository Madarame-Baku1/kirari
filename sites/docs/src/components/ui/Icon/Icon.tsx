import { iconPaths } from './Icon.constants'
import type * as Types from './Icon.types'

export const Icon = (props: Types.Props) => {
	const { name, size = 18 } = props

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{iconPaths[name]}
		</svg>
	)
}
