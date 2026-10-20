'use client'

import styles from './MobileMenu.module.css'
import { routes } from '../../navigation'
import { Logo } from '../Logo'
import { Dialog } from '../Dialog'
import { Divider } from '../Divider'
import { DocsNavigation } from '../DocsNavigation'
import { NavList } from '../NavList'
import type * as Types from './MobileMenu.types'

const pages = [
	{
		target: 'home',
		label: 'Home',
	},
	{
		target: 'docs',
		label: 'Docs',
	},
	{
		target: 'playground',
		label: 'Playground',
	},
] as const

export const MobileMenu = (props: Types.Props) => {
	const { open, onClose, page, activeSection } = props

	return (
		<Dialog
			className={styles.root}
			id="mobile-menu"
			aria-labelledby="mobile-menu-title"
			open={open}
			onClose={onClose}
		>
			<div className={styles.header}>
				<h2 id="mobile-menu-title">
					<Logo />
				</h2>
				<Dialog.Close label="Close navigation" />
			</div>
			<nav aria-label="Pages">
				<NavList variant="menu">
					{pages.map(item => (
						<NavList.Item
							key={item.target}
							href={routes[item.target]}
							current={item.target === page}
							onNavigate={onClose}
						>
							{item.label}
						</NavList.Item>
					))}
				</NavList>
			</nav>
			<Divider className={styles.divider} />
			<nav aria-label="Documentation sections">
				<DocsNavigation active={activeSection} onNavigate={onClose} />
			</nav>
		</Dialog>
	)
}
