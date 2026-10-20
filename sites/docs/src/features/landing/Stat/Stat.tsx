'use client'

import styles from './Stat.module.css'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { reducedMotion } from '@/client/motion'
import type * as Types from './Stat.types'

export const Stat = (props: Types.Props) => {
	const { value, unit, label } = props
	const root = useRef<HTMLDivElement>(null)
	const number = useRef<HTMLSpanElement>(null)
	useEffect(() => {
		// Update React's own text node so reconciliation still matches the DOM.
		const text = number.current?.firstChild
		if (reducedMotion() || !root.current || !(text instanceof Text)) return
		const decimals = value.split('.')[1]?.length ?? 0
		const counter = {
			value: 0,
		}
		const render = () => {
			text.nodeValue = counter.value.toFixed(decimals)
		}
		let tween: gsap.core.Tween | undefined
		/* Server HTML shows the final value; reset before the stat scrolls into view. */
		render()
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return
				observer.disconnect()
				tween = gsap.to(counter, {
					value: Number(value),
					duration: 2,
					delay: 0.15,
					ease: 'power2.out',
					onUpdate: render,
				})
			},
			{
				threshold: 0.75,
				rootMargin: '0px 0px -15% 0px',
			},
		)
		observer.observe(root.current)
		return () => {
			observer.disconnect()
			tween?.kill()
			text.nodeValue = value
		}
	}, [
		value,
	])

	return (
		<div ref={root} className={styles.root}>
			<p className={styles.statValue}>
				<span className="sr-only">{value}</span>
				<span ref={number} aria-hidden="true">
					{value}
				</span>
				{unit && <small>{unit}</small>}
			</p>
			<p className={styles.statLabel}>{label}</p>
		</div>
	)
}
