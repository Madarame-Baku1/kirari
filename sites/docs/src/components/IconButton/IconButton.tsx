import styles from './IconButton.module.css'
import classNames from 'classnames'
import { ButtonBase } from '../ButtonBase'
import type * as Types from './IconButton.types'

export const IconButton = (props: Types.Props) => {
	const { label, size = 'medium', className, children, ...baseProps } = props

	return (
		<ButtonBase
			{...baseProps}
			aria-label={label}
			className={classNames(styles.root, styles[size], className)}
		>
			{children}
		</ButtonBase>
	)
}
