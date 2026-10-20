import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { ClipboardProvider } from '../components/ClipboardProvider'
import type * as Types from './layout.types'
import { description } from '../seo'
import { site } from '../site'
import { paletteCSS } from '../themes'
import '@vortexlabs/kirari/theme.css'
import '../style.css'

export const metadata: Metadata = {
	metadataBase: new URL(site.url),
	title: {
		default: 'Kirari — lightweight syntax highlighting',
		template: '%s | Kirari',
	},
	description,
	authors: [
		site.author,
	],
	creator: site.author.name,
}

export const viewport: Viewport = {
	themeColor: '#ffffff',
}

const RootLayout = (props: Types.Props) => {
	const { children } = props

	return (
		<html lang="en" data-scroll-behavior="smooth">
			<head>
				<style>{paletteCSS()}</style>
			</head>
			<body>
				<ClipboardProvider>{children}</ClipboardProvider>
				{process.env.NODE_ENV !== 'development' && (
					<Script
						src="https://cdn.usefathom.com/script.js"
						data-site="YGMATMZF"
						strategy="afterInteractive"
					/>
				)}
			</body>
		</html>
	)
}

export default RootLayout
