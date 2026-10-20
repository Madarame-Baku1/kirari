/** biome-ignore-all lint/a11y/useSemanticElements: Keep preformatted code as a named, keyboard-scrollable region. */
'use client'

import { useEffect, useRef } from 'react'
import { focusableWhenScrollable } from '@/client/scrollable'
import { HighlightedCode } from '@/components/code/HighlightedCode'
import type * as Types from './PreviewOutput.types'

export const PreviewOutput = (props: Types.Props) => {
	const { id, label, html, hidden, ref, className = '' } = props
	const ownRef = useRef<HTMLPreElement>(null)
	const pre = ref ?? ownRef
	useEffect(
		() => focusableWhenScrollable(pre.current),
		[
			pre,
		],
	)

	return (
		<pre
			role="region"
			ref={pre}
			className={`kirari ${className}`}
			id={id}
			aria-label={label}
			hidden={hidden}
		>
			<HighlightedCode html={html} />
		</pre>
	)
}
