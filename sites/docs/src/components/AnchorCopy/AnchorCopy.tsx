'use client'

import styles from './AnchorCopy.module.css'
import { CopyIconButton } from '../CopyIconButton'
import type * as Types from './AnchorCopy.types'

export const AnchorCopy = (props: Types.Props) => {
	const { id, title } = props

	return (
		<CopyIconButton
			className={styles.root}
			data-anchor={id}
			text={() => {
				const url = new URL(location.href)
				url.hash = id
				return url.href
			}}
			label={`Copy link to ${title}`}
			message="Link copied"
			size="xs"
			glyphSize={18}
			hash
		/>
	)
}
