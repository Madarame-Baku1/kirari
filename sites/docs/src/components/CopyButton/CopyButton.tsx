'use client'

import { useEffect, useRef, useState } from 'react'
import { useClipboard } from '../ClipboardProvider'
import { CopyGlyph } from '../CopyGlyph'
import type * as Types from './CopyButton.types'

export const CopyButton = (props: Types.Props) => {
	const {
		text,
		label,
		target,
		message,
		className = 'icon-button copy-button',
		size = 15,
		hash = false,
		children,
		onCopied,
		...buttonProps
	} = props
	const copy = useClipboard()
	const [copied, setCopied] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	useEffect(() => () => clearTimeout(timer.current), [])

	const handleCopy = async () => {
		if (await copy(typeof text === 'function' ? text() : text, message)) {
			clearTimeout(timer.current)
			setCopied(true)
			timer.current = setTimeout(() => setCopied(false), 1600)
			onCopied?.()
		}
	}

	return (
		<button
			{...buttonProps}
			type="button"
			className={className}
			data-copy-target={target}
			data-copied={copied ? '' : undefined}
			aria-label={label}
			onClick={handleCopy}
		>
			<CopyGlyph size={size} hash={hash} />
			{children}
		</button>
	)
}
