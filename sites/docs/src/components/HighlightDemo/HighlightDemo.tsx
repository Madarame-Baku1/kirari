/** biome-ignore-all lint/a11y/noNoninteractiveTabindex: Tab panels must be keyboard-focusable for horizontal code scrolling. */
'use client'

import styles from './HighlightDemo.module.css'
import { useEffect, useRef, useState } from 'react'
import { animateIn } from '../../client/motion'
import { HighlightedCode } from '../HighlightedCode'
import { Link } from '../Link'
import { Tabs } from '../Tabs'
import type * as Types from './HighlightDemo.types'

export const HighlightDemo = (props: Types.Props) => {
	const { demos, palettes } = props
	const [selected, setSelected] = useState(demos[0]!.id)
	const [palette, setPalette] = useState(palettes[0]!.id)
	const panels = useRef(new Map<string, HTMLElement>())
	useEffect(() => {
		animateIn(panels.current.get(selected) ?? null)
	}, [
		selected,
	])

	return (
		<section className={styles.root} aria-label="Highlighting demo">
			<div className={styles.demoWindow} data-palette={palette}>
				<Tabs value={selected} onChange={setSelected}>
					<div className={styles.demoBar}>
						<Tabs.List className={styles.demoTabs} label="Demo language">
							{demos.map(entry => (
								<Tabs.Tab
									key={entry.id}
									value={entry.id}
									className={styles.demoTab}
								>
									{entry.filename}
								</Tabs.Tab>
							))}
						</Tabs.List>
						<fieldset className={styles.demoPalettes} aria-label="Demo theme">
							{palettes.map(entry => (
								<button
									type="button"
									key={entry.id}
									aria-pressed={entry.id === palette}
									aria-label={`${entry.label} theme`}
									title={entry.label}
									onClick={() => setPalette(entry.id)}
								>
									<i data-palette={entry.id} />
								</button>
							))}
						</fieldset>
					</div>
					{demos.map(entry => (
						<Tabs.Panel
							key={entry.id}
							as="pre"
							value={entry.id}
							ref={element => {
								if (element) panels.current.set(entry.id, element)
								else panels.current.delete(entry.id)
							}}
							className={`kirari ${styles.demoCode}`}
							tabIndex={0}
						>
							<HighlightedCode html={entry.html} />
						</Tabs.Panel>
					))}
				</Tabs>
			</div>
			<p className={styles.demoCaption}>
				Same HTML in every theme. Switch with the dots above, or{' '}
				<Link href="/playground/" variant="subtle">
					edit your own code
				</Link>
				.
			</p>
		</section>
	)
}
