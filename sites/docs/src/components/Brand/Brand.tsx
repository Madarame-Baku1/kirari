import styles from './Brand.module.css'
import classNames from 'classnames'
import { Icon } from '../Icon'
import type * as Types from './Brand.types'

export const Brand = (props: Types.Props) => {
	const { size = 'medium' } = props

	return (
		<span className={classNames(styles.root, styles[size])}>
			<span className={styles.mark} aria-hidden="true">
				<Icon name="sparkle" size={14} />
			</span>
			kirari
		</span>
	)
}
