'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { reducedMotion } from '../../client/motion'
import type * as Types from './LandingMotion.types'

export const LandingMotion = (props: Types.Props) => {
	const { children } = props
	const root = useRef<HTMLElement>(null)
	useEffect(() => {
		if (reducedMotion() || !root.current) return
		const observers: IntersectionObserver[] = []
		const context = gsap.context(() => {
			const select = gsap.utils.selector(root)
			gsap.timeline({
				defaults: {
					ease: 'power3.out',
					clearProps: 'opacity,transform',
				},
			})
				.from(select('.hero-title'), {
					y: 16,
					opacity: 0,
					duration: 0.7,
				})
				.from(
					select('.hero-lede, .hero-cta'),
					{
						y: 12,
						opacity: 0,
						duration: 0.6,
						stagger: 0.08,
					},
					0.15,
				)
				.from(
					select('[data-demo-window]'),
					{
						y: 28,
						opacity: 0,
						duration: 0.8,
					},
					0.3,
				)
			const shine = gsap
				.timeline({
					repeat: -1,
					repeatDelay: 1.6,
				})
				.fromTo(
					select('.glint-text'),
					{
						backgroundPosition: '100% 0',
					},
					{
						backgroundPosition: '0% 0',
						duration: 1.4,
						ease: 'power2.inOut',
					},
				)
			const heroObserver = new IntersectionObserver(([entry]) => {
				if (entry?.isIntersecting) shine.resume()
				else shine.pause()
			})
			heroObserver.observe(select('.hero-title')[0]!)
			observers.push(heroObserver)
			const reveal = select('[data-reveal]')
			gsap.set(reveal, {
				opacity: 0,
				y: 18,
			})
			const observer = new IntersectionObserver(
				entries => {
					for (const entry of entries)
						if (entry.isIntersecting) {
							observer.unobserve(entry.target)
							gsap.to(entry.target, {
								opacity: 1,
								y: 0,
								duration: 0.6,
								ease: 'power3.out',
								clearProps: 'opacity,transform',
							})
						}
				},
				{
					rootMargin: '0px 0px -10% 0px',
				},
			)
			reveal.forEach((element: HTMLElement) => observer.observe(element))
			observers.push(observer)
		}, root)
		return () => {
			observers.forEach(observer => observer.disconnect())
			context.revert()
		}
	}, [])

	return (
		<main ref={root} id="main" tabIndex={-1} className="landing">
			{children}
		</main>
	)
}
