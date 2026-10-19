/** biome-ignore-all lint/a11y/noNoninteractiveTabindex: Tab panels must be keyboard-focusable for horizontal code scrolling. */
'use client'

import styles from './HighlightDemo.module.css'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { animateIn } from '../../client/motion'
import { HighlightedCode } from '../HighlightedCode'
import type * as Types from './HighlightDemo.types'

export const HighlightDemo = (props: Types.Props) => {
	const { demos, palettes } = props
	const [selected, setSelected] = useState(0)
	const [palette, setPalette] = useState(palettes[0]!.id)
	const tabs = useRef<(HTMLButtonElement | null)[]>([])
	const panels = useRef<(HTMLPreElement | null)[]>([])
	useEffect(() => {
		animateIn(panels.current[selected] ?? null)
	}, [
		selected,
	])

	return (
		<section className={`${styles.root} demo`} aria-label="Highlighting demo">
			<div className={`demo-window ${styles.demoWindow}`} data-palette={palette}>
				<div className={styles.demoBar}>
					<div className={styles.demoTabs} role="tablist" aria-label="Demo language">
						{demos.map((entry, index) => (
							<button
								type="button"
								key={entry.id}
								ref={element => {
									tabs.current[index] = element
								}}
								role="tab"
								id={`demo-tab-${entry.id}`}
								aria-controls={`demo-${entry.id}`}
								aria-selected={index === selected}
								tabIndex={index === selected ? 0 : -1}
								data-demo={entry.id}
								onClick={() => setSelected(index)}
								onKeyDown={event => {
									if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')
										return
									event.preventDefault()
									const next =
										(index +
											(event.key === 'ArrowRight' ? 1 : -1) +
											demos.length) %
										demos.length
									setSelected(next)
									tabs.current[next]?.focus()
								}}
							>
								{entry.filename}
							</button>
						))}
					</div>
					<fieldset className={styles.demoPalettes} aria-label="Demo theme">
						{palettes.map(entry => (
							<button
								type="button"
								key={entry.id}
								data-demo-palette={entry.id}
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
				<div className="demo-body">
					{demos.map((entry, index) => (
						<pre
							key={entry.id}
							ref={element => {
								panels.current[index] = element
							}}
							className={`kirari ${styles.demoCode}`}
							id={`demo-${entry.id}`}
							role="tabpanel"
							tabIndex={0}
							aria-labelledby={`demo-tab-${entry.id}`}
							hidden={index !== selected}
						>
							<HighlightedCode html={entry.html} />
						</pre>
					))}
				</div>
			</div>
			<p className={styles.demoCaption}>
				Same HTML in every theme. Switch with the dots above, or{' '}
				<Link href="/playground/">edit your own code</Link>.
			</p>
		</section>
	)
}
