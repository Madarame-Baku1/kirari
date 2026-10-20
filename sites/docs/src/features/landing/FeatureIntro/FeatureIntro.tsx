import styles from './FeatureIntro.module.css'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/components/ui/Link'
import type * as Types from './FeatureIntro.types'

export const FeatureIntro = (props: Types.Props) => {
	const { id, icon, eyebrow, title, description, href, linkLabel } = props

	return (
		<div className={styles.root}>
			<p className={styles.eyebrow}>
				<Icon name={icon} size={15} /> {eyebrow}
			</p>
			<h2 id={id}>{title}</h2>
			<p>{description}</p>
			<Link className={styles.link} href={href} variant="strong" arrow>
				{linkLabel}
			</Link>
		</div>
	)
}
