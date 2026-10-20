import styles from './SearchField.module.css'
import classNames from 'classnames'
import { Icon } from '../Icon'
import type * as Types from './SearchField.types'

export const SearchField = (props: Types.Props) => {
	const { id, label, value, onChange, placeholder, variant = 'outline', className, ref } = props

	return (
		<div className={classNames(styles.root, styles[variant], className)}>
			<Icon name="search" />
			<label className="sr-only" htmlFor={id}>
				{label}
			</label>
			<input
				ref={ref}
				id={id}
				className={styles.input}
				type="search"
				autoComplete="off"
				placeholder={placeholder}
				value={value}
				onChange={event => onChange(event.target.value)}
			/>
		</div>
	)
}
