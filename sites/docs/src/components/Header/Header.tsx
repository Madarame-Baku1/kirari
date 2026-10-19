'use client'

import styles from './Header.module.css'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { routes } from '../../navigation'
import { site } from '../../site'
import { Brand } from '../Brand'
import { Icon } from '../Icon'
import { PageLink } from '../PageLink'
import { SearchDialog } from '../SearchDialog'
import { MobileMenu } from '../MobileMenu'
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
			<header className={`${styles.root} topbar`} data-scrolled={scrolled ? '' : undefined}>
				<div className={styles.topbarInner}>
					<Link className="brand" href={routes.home} aria-label="Kirari home">
						<Brand />
					</Link>
					<nav className={styles.topLinks} aria-label="Primary">
						<PageLink target="docs" label="Docs" current={page} />
						<PageLink target="playground" label="Playground" current={page} />
						<Link href={site.npm}>npm</Link>
					</nav>
					<div className={styles.topActions}>
						<button
							type="button"
							className={styles.searchButton}
							id="open-search"
							aria-label="Search documentation"
							onClick={openSearch}
						>
							<Icon name="search" size={16} />
							<span>Search</span>
							<kbd>⌘K</kbd>
						</button>
						<Link
							className="icon-button"
							href={site.github}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Kirari on GitHub"
							title="Kirari on GitHub"
						>
							<Icon name="github" />
						</Link>
						<button
							type="button"
							className={`icon-button ${styles.mobileNavButton}`}
							id="open-menu"
							aria-label="Open navigation"
							onClick={() => setMenuOpen(true)}
						>
							<Icon name="menu" />
						</button>
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
