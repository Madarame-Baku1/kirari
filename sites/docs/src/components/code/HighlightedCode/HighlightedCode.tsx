import type * as Types from './HighlightedCode.types'

export const HighlightedCode = (props: Types.Props) => {
	const { html, ...codeProps } = props

	return (
		<code
			{...codeProps}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: only escaped Kirari output is accepted here
			dangerouslySetInnerHTML={{
				__html: html,
			}}
		/>
	)
}
