import styles from './Logo.module.css'
import classNames from 'classnames'
import { Icon } from '@/components/ui/Icon'
import type * as Types from './Logo.types'

export const Logo = (props: Types.Props) => {
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
