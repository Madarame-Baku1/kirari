'use client'

import styles from './Header.module.css'
import { useEffect, useState } from 'react'
import { routes } from '@/lib/navigation'
import { Logo } from '@/components/layout/Logo'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { Link } from '@/components/ui/Link'
import { PageLink } from '@/components/layout/PageLink'
import { SearchDialog } from '@/components/layout/SearchDialog'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { externalLinks, iconLinks, pageLinks } from './Header.data'
import type * as Types from './Header.types'

export const Header = (props: Types.Props) => {
	const { page, activeSection, searchEntries } = props
	const [searchOpen, setSearchOpen] = useState(false)
	const [searchSession, setSearchSession] = useState(0)
	const [menuOpen, setMenuOpen] = useState(false)
	const [scrolled, setScrolled] = useState(false)
	const openSearch = () => {
		setMenuOpen(false)
		setSearchSession(value => value + 1)
		setSearchOpen(true)
	}
	useEffect(() => {
		const scroll = () => setScrolled(scrollY > 8)
		scroll()
		window.addEventListener('scroll', scroll, {
			passive: true,
		})
		return () => window.removeEventListener('scroll', scroll)
	}, [])
	useEffect(() => {
		const shortcut = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault()
				setMenuOpen(false)
				setSearchSession(value => value + 1)
				setSearchOpen(value => !value)
			}
		}
		document.addEventListener('keydown', shortcut)
		return () => document.removeEventListener('keydown', shortcut)
	}, [])

	return (
		<>
			<header className={styles.root} data-scrolled={scrolled ? '' : undefined}>
				<div className={styles.topbarInner}>
					<Link href={routes.home} aria-label="Kirari home">
						<Logo />
					</Link>
					<nav aria-label="Primary">
						<ul className={styles.topLinks}>
							{pageLinks.map(link => (
								<li key={link.target}>
									<PageLink
										target={link.target}
										label={link.label}
										current={page}
										variant="subtle"
									/>
								</li>
							))}
							{externalLinks.map(link => (
								<li key={link.href}>
									<Link href={link.href} variant="subtle" external>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
					<div className={styles.topActions}>
						<button
							type="button"
							className={styles.searchButton}
							aria-label="Search documentation"
							onClick={openSearch}
						>
							<Icon name="search" size={16} />
							<span>Search</span>
							<kbd>⌘K</kbd>
						</button>
						{iconLinks.map(link => (
							<IconButton
								key={link.href}
								href={link.href}
								external
								label={link.label}
								title={link.label}
							>
								<Icon name={link.icon} />
							</IconButton>
						))}
						<IconButton
							className={styles.mobileNavButton}
							label="Open navigation"
							onClick={() => setMenuOpen(true)}
						>
							<Icon name="menu" />
						</IconButton>
					</div>
				</div>
			</header>
			<SearchDialog
				key={searchSession}
				open={searchOpen}
				onClose={() => setSearchOpen(false)}
				entries={searchEntries}
			/>
			<MobileMenu
				open={menuOpen}
				onClose={() => setMenuOpen(false)}
				page={page}
				activeSection={activeSection}
			/>
		</>
	)
}
