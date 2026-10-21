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
		const element = number.current
		const text = element?.firstChild
		if (
			reducedMotion() ||
			!root.current ||
			!element ||
			!(text instanceof Text) ||
			Number(value) === 0
		)
			return
		const decimals = value.split('.')[1]?.length ?? 0
		const counter = {
			value: 0,
		}
		const render = () => {
			text.nodeValue = counter.value.toFixed(decimals)
		}
		let tween: gsap.core.Timeline | undefined
		render()
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return
				observer.disconnect()
				tween = gsap
					.timeline({
						delay: 0.15,
					})
					.to(
						counter,
						{
							value: Number(value),
							duration: 2,
							ease: 'power2.out',
							onUpdate: render,
						},
						0,
					)
					.to(
						element,
						{
							filter: 'blur(1.75px)',
							duration: 0.18,
							ease: 'sine.inOut',
						},
						0,
					)
					.to(
						element,
						{
							filter: 'blur(0px)',
							duration: 1.82,
							ease: 'power2.out',
							clearProps: 'filter',
						},
						0.18,
					)
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
			gsap.set(element, {
				clearProps: 'filter',
			})
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
