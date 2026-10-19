import type * as Types from './OutputTab.types'

export const OutputTab = (props: Types.Props) => {
	const { value, label, selected, onClick } = props

	return (
		<button type="button" data-output={value} aria-pressed={selected} onClick={onClick}>
			{label}
		</button>
	)
}
