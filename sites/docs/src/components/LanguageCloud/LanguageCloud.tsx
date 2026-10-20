'use client'

import styles from './LanguageCloud.module.css'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { reducedMotion } from '../../client/motion'
import { MagneticLink } from '../MagneticLink'
import type * as Types from './LanguageCloud.types'

export const LanguageCloud = (props: Types.Props) => {
	const { label, links } = props
	const root = useRef<HTMLUListElement>(null)
	useEffect(() => {
		const element = root.current
		if (!element || reducedMotion()) return
		const chips = element.querySelectorAll('a')
		let hidden = false
		let tween: gsap.core.Tween | undefined
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry) return
				if (!hidden) {
					if (entry.isIntersecting) {
						observer.disconnect()
						return
					}
					hidden = true
					gsap.set(chips, {
						opacity: 0,
						scale: 0.6,
					})
					return
				}
				if (entry.intersectionRatio < 0.4) return
				observer.disconnect()
				tween = gsap.to(chips, {
					opacity: 1,
					scale: 1,
					duration: 0.6,
					ease: 'back.out(2.2)',
					stagger: {
						amount: 0.55,
						grid: 'auto',
						from: 'start',
					},
				})
			},
			{
				threshold: [
					0,
					0.4,
				],
			},
		)
		observer.observe(element)
		return () => {
			observer.disconnect()
			tween?.kill()
			gsap.set(chips, {
				clearProps: 'opacity,scale',
			})
		}
	}, [])

	return (
		<ul ref={root} className={styles.root} aria-label={label}>
			{links.map(link => (
				<li key={link.id}>
					<MagneticLink href={link.href}>{link.label}</MagneticLink>
				</li>
			))}
		</ul>
	)
}
