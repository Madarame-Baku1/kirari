import styles from './ButtonLink.module.css'
import Link from 'next/link'
import { Icon } from '../Icon'
import type * as Types from './ButtonLink.types'

export const ButtonLink = (props: Types.Props) => {
	const { href, label, variant = 'primary' } = props

	return (
		<Link className={`${styles.root} button ${styles[variant]}`} href={href}>
			{label}
			{variant === 'primary' && (
				<>
					{' '}
					<Icon name="arrow" size={16} />
				</>
			)}
		</Link>
	)
}
