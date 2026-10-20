import { gsap } from 'gsap'

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export const animateIn = (target: HTMLElement | null) => {
	if (!target || reducedMotion()) return
	gsap.killTweensOf(target)
	gsap.fromTo(
		target,
		{
			opacity: 0.6,
			y: 4,
		},
		{
			opacity: 1,
			y: 0,
			duration: 0.2,
			ease: 'power2.out',
			clearProps: 'opacity,transform',
		},
	)
}

export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches
