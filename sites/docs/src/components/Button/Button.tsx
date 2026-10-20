import styles from './Button.module.css'
import classNames from 'classnames'
import { ButtonBase } from '../ButtonBase'
import type * as Types from './Button.types'

export const Button = (props: Types.Props) => {
	const {
		variant = 'primary',
		size = 'medium',
		startIcon,
		endIcon,
		className,
		children,
		...baseProps
	} = props

	return (
		<ButtonBase
			{...baseProps}
			className={classNames(styles.root, styles[variant], styles[size], className)}
		>
			{startIcon}
			{children}
			{endIcon && <span className={styles.endIcon}>{endIcon}</span>}
		</ButtonBase>
	)
}
