'use client'

import styles from './LanguageTable.module.css'
import { useState } from 'react'
import { SearchField } from '../SearchField'
import type * as Types from './LanguageTable.types'

export const LanguageTable = (props: Types.Props) => {
	const { head, rows } = props
	const [query, setQuery] = useState('')
	const normalized = query.trim().toLowerCase()
	const matches = (row: Types.Row) => row.text.toLowerCase().includes(normalized)
	const visibleCount = rows.filter(matches).length

	return (
		<>
			<div className={styles.header}>
				<SearchField
					id="language-filter"
					className={styles.filter}
					label="Filter languages"
					placeholder="Find your language…"
					value={query}
					onChange={setQuery}
				/>
				<span className={styles.count} role="status">
					{visibleCount} {visibleCount === 1 ? 'language' : 'languages'}
				</span>
			</div>
			<p className={styles.empty} hidden={visibleCount !== 0}>
				No matching languages.
			</p>
			<div className="table-scroll">
				<table>
					{head}
					<tbody>
						{rows.map(row => (
							<tr key={row.text} hidden={!matches(row)}>
								{row.children}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	)
}
