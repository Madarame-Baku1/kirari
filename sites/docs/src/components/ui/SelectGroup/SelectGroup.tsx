import type * as Types from './SelectGroup.types'

export const SelectGroup = (props: Types.Props) => {
	const { label, options } = props

	return (
		<optgroup label={label}>
			{options.map(option => (
				<option key={option.id} value={option.id}>
					{option.label}
				</option>
			))}
		</optgroup>
	)
}
