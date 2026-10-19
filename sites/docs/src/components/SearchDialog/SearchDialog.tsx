'use client'

import styles from './SearchDialog.module.css'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon'
import type * as Types from './SearchDialog.types'

export const SearchDialog = (props: Types.Props) => {
	const { open, onClose, entries } = props
	const dialog = useRef<HTMLDialogElement>(null)
	const input = useRef<HTMLInputElement>(null)
	const links = useRef<(HTMLAnchorElement | null)[]>([])
	const [query, setQuery] = useState('')
	const normalized = query.trim().toLowerCase()
	const matches = entries
		.filter(entry =>
			normalized
				? `${entry.title} ${entry.description} ${entry.keywords ?? ''}`
						.toLowerCase()
						.includes(normalized)
				: entry.category !== 'Language',
		)
		.slice(0, 12)

	useEffect(() => {
		if (open) {
			dialog.current?.showModal()
			input.current?.focus()
		} else dialog.current?.close()
	}, [
		open,
	])

	return (
		<dialog
			className={styles.root}
			ref={dialog}
			id="search-dialog"
			aria-labelledby="search-title"
			onCancel={onClose}
			onClose={onClose}
			onClick={event => {
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
			onKeyDown={event => {
				if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
				if (!matches.length) return
				event.preventDefault()
				const current = links.current.indexOf(document.activeElement as HTMLAnchorElement)
				const step = event.key === 'ArrowDown' ? 1 : -1
				const next =
					current < 0
						? step > 0
							? 0
							: matches.length - 1
						: (current + step + matches.length) % matches.length
				links.current[next]?.focus()
			}}
		>
			<form
				className={styles.searchDialogHeader}
				onSubmit={event => {
					event.preventDefault()
					links.current[0]?.click()
				}}
			>
				<h2 id="search-title" className="sr-only">
					Search documentation
				</h2>
				<Icon name="search" />
				<label className="sr-only" htmlFor="doc-search">
					Search docs and languages
				</label>
				<input
					ref={input}
					id="doc-search"
					className={styles.docSearch}
					type="search"
					placeholder="Search docs and languages…"
					autoComplete="off"
					value={query}
					onChange={event => setQuery(event.target.value)}
				/>
				<button
					type="button"
					className={styles.closeSearch}
					aria-label="Close search"
					onClick={onClose}
				>
					<kbd>Esc</kbd>
				</button>
			</form>
			<div id="search-results" className={styles.searchResults}>
				{matches.map((entry, index) => (
					<Link
						key={entry.href}
						ref={element => {
							links.current[index] = element
						}}
						className={styles.searchResult}
						href={entry.href}
						onClick={onClose}
					>
						<span>
							<strong>{entry.title}</strong>
							<small>{entry.description}</small>
						</span>
						<span>{entry.category}</span>
					</Link>
				))}
				{!matches.length && (
					<p className={styles.searchEmpty}>
						No matches. Try a language name, “themes”, or “API”.
					</p>
				)}
			</div>
			<div className={styles.searchHint}>
				<span>
					<kbd>↑</kbd>
					<kbd>↓</kbd> to move
				</span>
				<span>
					<kbd>↵</kbd> to open
				</span>
			</div>
		</dialog>
	)
}
