'use client'

import styles from './MobileMenu.module.css'
import { useEffect, useRef } from 'react'
import { Brand } from '../Brand'
import { Icon } from '../Icon'
import { DocsNavigation } from '../DocsNavigation'
import { PageLink } from '../PageLink'
import type * as Types from './MobileMenu.types'

export const MobileMenu = (props: Types.Props) => {
	const { open, onClose, page, activeSection } = props
	const dialog = useRef<HTMLDialogElement>(null)
	useEffect(() => {
		if (open) dialog.current?.showModal()
		else dialog.current?.close()
	}, [
		open,
	])

	return (
		<dialog
			className={styles.root}
			ref={dialog}
			id="mobile-menu"
			aria-labelledby="mobile-menu-title"
			onCancel={onClose}
			onClose={onClose}
			onPointerDown={event => {
				const bounds = event.currentTarget.getBoundingClientRect()
				if (
					event.target === event.currentTarget &&
					(event.clientX < bounds.left ||
						event.clientX > bounds.right ||
						event.clientY < bounds.top ||
						event.clientY > bounds.bottom)
				)
					onClose()
			}}
		>
			<div className={styles.mobileMenuHeader}>
				<h2 className="brand" id="mobile-menu-title">
					<Brand />
				</h2>
				<button
					type="button"
					className="icon-button"
					id="close-menu"
					aria-label="Close navigation"
					onClick={onClose}
				>
					<Icon name="close" />
				</button>
			</div>
			<nav className={styles.mobileLinks} aria-label="Pages">
				<PageLink target="home" label="Home" current={page} onNavigate={onClose} />
				<PageLink target="docs" label="Docs" current={page} onNavigate={onClose} />
				<PageLink
					target="playground"
					label="Playground"
					current={page}
					onNavigate={onClose}
				/>
			</nav>
			<nav aria-label="Documentation sections">
				<DocsNavigation active={activeSection} onNavigate={onClose} />
			</nav>
		</dialog>
	)
}
