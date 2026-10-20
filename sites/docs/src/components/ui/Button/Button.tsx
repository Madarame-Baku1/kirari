import styles from './Button.module.css'
import classNames from 'classnames'
import { ButtonBase } from '@/components/ui/ButtonBase'
import type * as Types from './Button.types'

export const Button = (props: Types.Props) => {
	const {
		variant = 'primary',
		size = 'md',
		startIcon,
		endIcon,
		className,
		children,
		...baseProps
	} = props
	const rootClassNames = classNames(styles.root, styles[variant], styles[size], className)

	return (
		<ButtonBase {...baseProps} className={rootClassNames}>
			{startIcon}
			{children}
			{endIcon && <span className={styles.endIcon}>{endIcon}</span>}
		</ButtonBase>
	)
}
