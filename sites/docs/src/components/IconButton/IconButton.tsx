import styles from './IconButton.module.css'
import classNames from 'classnames'
import { ButtonBase } from '../ButtonBase'
import type * as Types from './IconButton.types'

export const IconButton = (props: Types.Props) => {
	const { label, size = 'md', className, children, ...baseProps } = props
	const rootClassNames = classNames(styles.root, styles[size], className)

	return (
		<ButtonBase {...baseProps} aria-label={label} className={rootClassNames}>
			{children}
		</ButtonBase>
	)
}
