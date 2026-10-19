import { ImageResponse } from 'next/og'

export const alt = 'Kirari — lightweight syntax highlighting for the web'
export const size = {
	width: 1200,
	height: 630,
}
export const contentType = 'image/png'

const OpenGraphImage = () =>
	new ImageResponse(
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				width: '100%',
				height: '100%',
				background: '#111318',
				color: '#ffffff',
				padding: 80,
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					fontSize: 44,
					color: '#ffcf4a',
					marginBottom: 36,
				}}
			>
				<svg
					role="img"
					aria-label="Kirari"
					width="44"
					height="44"
					viewBox="0 0 32 32"
					style={{
						marginRight: 16,
					}}
				>
					<title>Kirari</title>
					<path
						d="M16 6c.8 5.6 4.4 9.2 10 10-5.6.8-9.2 4.4-10 10-.8-5.6-4.4-9.2-10-10 5.6-.8 9.2-4.4 10-10Z"
						fill="#ffcf4a"
					/>
				</svg>
				kirari
			</div>
			<div
				style={{
					display: 'flex',
					fontSize: 74,
					lineHeight: 1.1,
					maxWidth: 950,
				}}
			>
				A little light for your code.
			</div>
			<div
				style={{
					display: 'flex',
					fontSize: 28,
					color: '#b5bdca',
					marginTop: 36,
				}}
			>
				Syntax highlighting · React · Markdown · Streaming
			</div>
			<div
				style={{
					display: 'flex',
					fontSize: 24,
					color: '#ffcf4a',
					marginTop: 44,
				}}
			>
				kirari.sh
			</div>
		</div>,
		size,
	)

export default OpenGraphImage
