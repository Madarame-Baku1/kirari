'use client'

import styles from './HighlightDemo.module.css'
import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { reducedMotion } from '@/client/motion'
import { focusableWhenScrollable } from '@/client/scrollable'
import { HighlightedCode } from '@/components/code/HighlightedCode'
import { Link } from '@/components/ui/Link'
import { Tabs } from '@/components/ui/Tabs'
import type * as Types from './HighlightDemo.types'

export const HighlightDemo = (props: Types.Props) => {
	const { demos, palettes } = props
	const [selected, setSelected] = useState(demos[0]!.id)
	const [palette, setPalette] = useState(palettes[0]!.id)
	const panels = useRef(new Map<string, HTMLElement>())

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
						<fieldset className={styles.demoPalettes}>
							<legend className="sr-only">Demo theme</legend>
							{palettes.map(entry => (
								<label key={entry.id} className={styles.swatch} title={entry.label}>
									<input
										className="sr-only"
										type="radio"
										name="demo-palette"
										value={entry.id}
										checked={entry.id === palette}
										onChange={event => {
											setPalette(entry.id)
											if (reducedMotion()) return
											gsap.fromTo(
												event.currentTarget.parentElement?.querySelector(
													'i',
												) ?? null,
												{
													scale: 0.55,
												},
												{
													scale: 1,
													duration: 0.6,
													ease: 'elastic.out(1, .4)',
													clearProps: 'transform',
													overwrite: true,
												},
											)
										}}
									/>
									<span className="sr-only">{entry.label} theme</span>
									<i data-palette={entry.id} aria-hidden="true" />
								</label>
							))}
						</fieldset>
					</div>
					{demos.map(entry => (
						<Tabs.Panel
							key={entry.id}
							as="pre"
							value={entry.id}
							ref={element => {
								if (!element) return
								panels.current.set(entry.id, element)
								const release = focusableWhenScrollable(element)
								return () => {
									release?.()
									panels.current.delete(entry.id)
								}
							}}
							className={`kirari ${styles.demoCode}`}
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
