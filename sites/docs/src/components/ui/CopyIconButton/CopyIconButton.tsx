'use client'

import { useCopy } from '@/components/ui/ClipboardProvider'
import { CopyGlyph } from '@/components/ui/CopyGlyph'
import { IconButton } from '@/components/ui/IconButton'
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
