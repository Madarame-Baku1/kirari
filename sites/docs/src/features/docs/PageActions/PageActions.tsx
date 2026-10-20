'use client'

import styles from './PageActions.module.css'
import { useEffect, useRef } from 'react'
import { useCopy } from '@/components/ui/ClipboardProvider'
import { CopyGlyph } from '@/components/ui/CopyGlyph'
import { Divider } from '@/components/ui/Divider'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/components/ui/Link'
import type * as Types from './PageActions.types'

export const PageActions = (props: Types.Props) => {
	const { id, markdown } = props
	const details = useRef<HTMLDetailsElement>(null)
	const trigger = useRef<HTMLElement>(null)
	const closeMenu = () => {
		if (details.current) details.current.open = false
	}
	const { copied, copy } = useCopy({
		text: markdown,
		message: 'Page copied',
		onCopied: closeMenu,
	})
	useEffect(() => {
		const closeOutside = (event: MouseEvent) => {
			if (
				event.target instanceof Node &&
				details.current &&
				!details.current.contains(event.target)
			)
				details.current.open = false
		}
		document.addEventListener('click', closeOutside)
		return () => document.removeEventListener('click', closeOutside)
	}, [])

	return (
		<fieldset className={styles.root} aria-label="Page actions">
			<button
				type="button"
				id="copy-page"
				className={styles.copy}
				data-copied={copied ? '' : undefined}
				onClick={copy}
			>
				<CopyGlyph size={14} />
				Copy page
			</button>
			<Divider orientation="vertical" />
			<details
				ref={details}
				className={styles.menu}
				onKeyDown={event => {
					if (event.key === 'Escape') {
						event.preventDefault()
						closeMenu()
						trigger.current?.focus()
					}
				}}
			>
				<summary ref={trigger} aria-label="Open page actions">
					<Icon name="chevron" size={12} />
				</summary>
				<div className={styles.menuPanel}>
					<Link
						className={styles.menuItem}
						href={`/docs/${id}.md`}
						prefetch={false}
						external
					>
						<Icon name="code" size={16} />
						<span>
							<strong>View as Markdown</strong>
							<small>Open this page as plain text</small>
						</span>
					</Link>
				</div>
			</details>
		</fieldset>
	)
}
