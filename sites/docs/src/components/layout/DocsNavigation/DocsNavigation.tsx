import { docsPath, sectionGroups, sections } from '@/navigation'
import { NavList } from '@/components/layout/NavList'
import type * as Types from './DocsNavigation.types'

export const DocsNavigation = (props: Types.Props) => {
	const { active, onNavigate } = props

	return (
		<NavList>
			{sectionGroups.map(group => (
				<NavList.Group key={group} title={group}>
					{sections
						.filter(section => section.group === group)
						.map(section => (
							<NavList.Item
								key={section.id}
								href={docsPath(section.id)}
								current={section.id === active}
								onNavigate={onNavigate}
							>
								{section.title}
							</NavList.Item>
						))}
				</NavList.Group>
			))}
		</NavList>
	)
}
