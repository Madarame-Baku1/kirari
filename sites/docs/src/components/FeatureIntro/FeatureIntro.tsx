import styles from './FeatureIntro.module.css'
import Link from 'next/link'
import { Icon } from '../Icon'
import type * as Types from './FeatureIntro.types'

export const FeatureIntro = (props: Types.Props) => {
	const { id, icon, eyebrow, title, description, href, linkLabel } = props

	return (
		<div className={`${styles.root} row-copy`} data-reveal>
			<p className={styles.eyebrow}>
				<Icon name={icon} size={15} /> {eyebrow}
			</p>
			<h2 id={id}>{title}</h2>
			<p>{description}</p>
			<Link className={`text-link ${styles.textLink}`} href={href}>
				{linkLabel} <Icon name="arrow" size={15} />
			</Link>
		</div>
	)
}
