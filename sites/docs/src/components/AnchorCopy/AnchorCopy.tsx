'use client'

import { CopyButton } from '../CopyButton'
import type * as Types from './AnchorCopy.types'

export const AnchorCopy = (props: Types.Props) => {
	const { id, title } = props

	return (
		<CopyButton
			className="anchor-copy"
			data-anchor={id}
			text={() => {
				const url = new URL(location.href)
				url.hash = id
				return url.href
			}}
			label={`Copy link to ${title}`}
			message="Link copied"
			hash
			size={18}
		/>
	)
}
