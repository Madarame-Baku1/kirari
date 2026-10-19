import styles from './Brand.module.css'
import { Icon } from '../Icon'

export const Brand = () => (
	<>
		<span className={`${styles.root} brand-mark`} aria-hidden="true">
			<Icon name="sparkle" size={14} />
		</span>
		kirari
	</>
)
