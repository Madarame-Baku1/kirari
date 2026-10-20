'use client'

import { Button } from '../Button'
import { useCopy } from '../ClipboardProvider'
import { CopyGlyph } from '../CopyGlyph'
import type * as Types from './CopyButton.types'

export const CopyButton = (props: Types.Props) => {
	const { text, message, onCopied, variant = 'ghost', size = 'small', ...buttonProps } = props
	const { copied, copy } = useCopy({
		text,
		message,
		onCopied,
	})

	return (
		<Button
			{...buttonProps}
			variant={variant}
			size={size}
			startIcon={<CopyGlyph size={14} />}
			data-copied={copied ? '' : undefined}
			onClick={copy}
		/>
	)
}
