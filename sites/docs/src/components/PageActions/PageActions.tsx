'use client'

import Link from 'next/link'

import styles from './PageActions.module.css'
import { useEffect, useRef } from 'react'
import { CopyButton } from '../CopyButton'
import { Icon } from '../Icon'
import type * as Types from './PageActions.types'

export const PageActions = (props: Types.Props) => {
	const { id, markdown } = props
	const details = useRef<HTMLDetailsElement>(null)
	const trigger = useRef<HTMLElement>(null)
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
		<fieldset className={`${styles.root} page-actions-control`} aria-label="Page actions">
			<CopyButton
				id="copy-page"
				text={markdown}
				label="Copy page"
				message="Page copied"
				className=""
				size={14}
				onCopied={() => {
					if (details.current) details.current.open = false
				}}
			>
				<span>Copy page</span>
			</CopyButton>
			<details
				ref={details}
				className={styles.pageActions}
				onKeyDown={event => {
					if (event.key === 'Escape') {
						event.preventDefault()
						event.currentTarget.open = false
						trigger.current?.focus()
					}
				}}
			>
				<summary ref={trigger} aria-label="Open page actions">
					<Icon name="chevron" size={12} />
				</summary>
				<div className={styles.pageActionMenu}>
					<Link
						className="page-action-link"
						href={`/docs/${id}.md`}
						prefetch={false}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Icon name="code" size={16} />
						<span>
							<strong>View as Markdown</strong>
							<small>Open this page as plain text</small>
						</span>
						<span className="sr-only">(opens in a new tab)</span>
					</Link>
				</div>
			</details>
		</fieldset>
	)
}
