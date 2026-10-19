/** biome-ignore-all lint/a11y/useSemanticElements: Keep preformatted code as a named, keyboard-scrollable region. */
/** biome-ignore-all lint/a11y/noNoninteractiveTabindex: Code scrollers must be keyboard-focusable. */
import { HighlightedCode } from '../HighlightedCode'
import type * as Types from './PreviewOutput.types'

export const PreviewOutput = (props: Types.Props) => {
	const { id, label, html, hidden, ref, className = '' } = props

	return (
		<pre
			role="region"
			ref={ref}
			className={`kirari ${className}`}
			id={id}
			aria-label={label}
			tabIndex={0}
			hidden={hidden}
		>
			<HighlightedCode html={html} />
		</pre>
	)
}
