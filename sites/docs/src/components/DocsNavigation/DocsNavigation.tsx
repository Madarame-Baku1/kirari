import styles from './DocsNavigation.module.css'
import Link from 'next/link'
import { docsPath, sectionGroups, sections } from '../../navigation'
import type * as Types from './DocsNavigation.types'

export const DocsNavigation = (props: Types.Props) => {
	const { active, onNavigate } = props

	return (
		<>
			{sectionGroups.map(group => (
				<div className={`${styles.root} nav-group`} key={group}>
					<p>{group}</p>
					{sections
						.filter(section => section.group === group)
						.map(section => (
							<Link
								key={section.id}
								href={docsPath(section.id)}
								data-nav={section.id}
								aria-current={section.id === active ? 'page' : undefined}
								onNavigate={onNavigate}
							>
								{section.title}
							</Link>
						))}
				</div>
			))}
		</>
	)
}
