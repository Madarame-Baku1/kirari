import Link from 'next/link'
import { routes } from '../../navigation'
import { site } from '../../site'
import { Brand } from '../Brand'

export const Footer = () => (
	<footer className="site-footer">
		<div className="footer-inner">
			<Link className="brand" href={routes.home}>
				<Brand />
			</Link>
			<p>A little light for your code.</p>
			<nav aria-label="Footer">
				<Link href={routes.docs}>Docs</Link>
				<Link href={routes.playground}>Playground</Link>
				<Link href="/llms.txt" prefetch={false}>
					llms.txt
				</Link>
				<Link href={site.npm}>npm</Link>
			</nav>
			<span>v{site.version}</span>
		</div>
	</footer>
)
