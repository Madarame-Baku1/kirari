'use client'

import { useState } from 'react'
import { Icon } from '../Icon'
import type * as Types from './LanguageTable.types'

export const LanguageTable = (props: Types.Props) => {
	const { head, rows } = props
	const [query, setQuery] = useState('')
	const normalized = query.trim().toLowerCase()
	const visible = rows.filter(row => row.text.toLowerCase().includes(normalized))

	return (
		<>
			<div className="language-list-header">
				<label className="filter-box">
					<Icon name="search" />
					<span className="sr-only">Filter languages</span>
					<input
						id="language-filter"
						type="search"
						placeholder="Find your language…"
						value={query}
						onChange={event => setQuery(event.target.value)}
					/>
				</label>
				<span id="language-count" role="status">
					{visible.length} {visible.length === 1 ? 'language' : 'languages'}
				</span>
			</div>
			<p id="language-empty" hidden={visible.length !== 0}>
				No matching languages.
			</p>
			<div className="table-scroll">
				<table>
					{head}
					<tbody>
						{rows.map(row => (
							<tr
								key={row.text}
								data-language-row
								data-search={row.text.toLowerCase()}
								hidden={!row.text.toLowerCase().includes(normalized)}
							>
								{row.children}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	)
}
