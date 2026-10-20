import styles from './GuideLink.module.css'
import { docsPath } from '../../navigation'
import { Icon } from '../Icon'
import { Link } from '../Link'
import type * as Types from './GuideLink.types'

export const GuideLink = (props: Types.Props) => {
	const { section, direction } = props

	return (
		<Link className={styles.root} rel={direction} href={docsPath(section.id)}>
			<small>{direction === 'prev' ? 'Previous' : 'Next'}</small>
			{direction === 'prev' && <Icon name="chevron" size={16} />}
			<span>{section.title}</span>
			{direction === 'next' && <Icon name="chevron" size={16} />}
		</Link>
	)
}
