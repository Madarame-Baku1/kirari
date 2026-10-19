export const digitPlaces = [
	100,
	10,
	1,
] as const

export const messages = {
	404: {
		title: 'This page is out of bounds.',
		description:
			'The page may have moved, or the link may be incorrect. Head home or find what you need in the docs.',
	},
	500: {
		title: 'Something didn’t load.',
		description: 'We couldn’t load this page. Try again, or head back home.',
	},
}
