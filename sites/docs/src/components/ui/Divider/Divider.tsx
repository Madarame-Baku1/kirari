import styles from './Divider.module.css'
import classNames from 'classnames'
import type * as Types from './Divider.types'

export const Divider = (props: Types.Props) => {
	const { orientation = 'horizontal', className } = props

	return (
		<hr
			className={classNames(styles.root, styles[orientation], className)}
			aria-orientation={orientation}
		/>
	)
}
