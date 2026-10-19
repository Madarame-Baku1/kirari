'use client'

import styles from './MagneticLink.module.css'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { reducedMotion } from '../../client/motion'
import type * as Types from './MagneticLink.types'

export const MagneticLink = (props: Types.Props) => {
	const { href, children } = props
	const link = useRef<HTMLAnchorElement>(null)
	const label = useRef<HTMLSpanElement>(null)
	const bounds = useRef<DOMRect | null>(null)
	useEffect(() => {
		const elements = [
			link.current,
			label.current,
		]
		return () => {
			gsap.killTweensOf(elements)
		}
	}, [])

	return (
		<Link
			className={styles.root}
			href={href}
			ref={link}
			onPointerEnter={event => {
				if (reducedMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches)
					return
				gsap.set(
					[
						link.current,
						label.current,
					],
					{
						x: 0,
						y: 0,
					},
				)
				bounds.current = event.currentTarget.getBoundingClientRect()
			}}
			onPointerMove={event => {
				if (!bounds.current) return
				const x = event.clientX - bounds.current.left - bounds.current.width / 2
				const y = event.clientY - bounds.current.top - bounds.current.height / 2
				gsap.to(link.current, {
					x: x * 0.35,
					y: y * 0.45,
					duration: 0.3,
					ease: 'power3.out',
					overwrite: true,
				})
				gsap.to(label.current, {
					x: x * 0.15,
					y: y * 0.2,
					duration: 0.3,
					ease: 'power3.out',
					overwrite: true,
				})
			}}
			onPointerLeave={() => {
				if (!bounds.current) return
				bounds.current = null
				gsap.to(
					[
						link.current,
						label.current,
					],
					{
						x: 0,
						y: 0,
						duration: 0.7,
						ease: 'elastic.out(1, .4)',
						overwrite: true,
					},
				)
			}}
		>
			<span ref={label}>{children}</span>
		</Link>
	)
}
