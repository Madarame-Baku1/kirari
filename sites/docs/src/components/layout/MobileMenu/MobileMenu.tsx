'use client'

import styles from './MobileMenu.module.css'
import { routes } from '@/lib/navigation'
import { Logo } from '@/components/layout/Logo'
import { Dialog } from '@/components/ui/Dialog'
import { Divider } from '@/components/ui/Divider'
import { DocsNavigation } from '@/components/layout/DocsNavigation'
import { NavList } from '@/components/layout/NavList'
import { pageLinks } from './MobileMenu.data'
import type * as Types from './MobileMenu.types'

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
					{pageLinks.map(item => (
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
