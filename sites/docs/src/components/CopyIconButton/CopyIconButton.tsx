'use client'

import { useCopy } from '../ClipboardProvider'
import { CopyGlyph } from '../CopyGlyph'
import { IconButton } from '../IconButton'
import type * as Types from './CopyIconButton.types'

export const CopyIconButton = (props: Types.Props) => {
	const { text, message, onCopied, glyphSize, hash, ...buttonProps } = props
	const { copied, copy } = useCopy({
		text,
		message,
		onCopied,
	})

	return (
		<IconButton {...buttonProps} data-copied={copied ? '' : undefined} onClick={copy}>
			<CopyGlyph size={glyphSize} hash={hash} />
		</IconButton>
	)
}
