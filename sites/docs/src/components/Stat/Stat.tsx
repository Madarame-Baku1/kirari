'use client'

import styles from './Stat.module.css'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { reducedMotion } from '../../client/motion'
import type * as Types from './Stat.types'

export const Stat = (props: Types.Props) => {
	const { value, unit, label } = props
	const root = useRef<HTMLDivElement>(null)
	const [display, setDisplay] = useState(value)
	useEffect(() => {
		if (reducedMotion() || !root.current) return
		let tween: gsap.core.Tween | undefined
		const counter = {
			value: 0,
		}
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry?.isIntersecting) return
			observer.disconnect()
			tween = gsap.to(counter, {
				value: Number(value),
				duration: 1.2,
				ease: 'power2.out',
				onUpdate: () => setDisplay(counter.value.toFixed(value.split('.')[1]?.length ?? 0)),
			})
		})
		observer.observe(root.current)
		return () => {
			observer.disconnect()
			tween?.kill()
		}
	}, [
		value,
	])

	return (
		<div ref={root} className={`${styles.root} stat`} data-reveal>
			<p className={styles.statValue}>
				<span data-count={value}>{display}</span>
				{unit && <small>{unit}</small>}
			</p>
			<p className={styles.statLabel}>{label}</p>
		</div>
	)
}
