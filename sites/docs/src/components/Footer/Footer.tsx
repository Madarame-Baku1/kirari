import Link from 'next/link'
import styles from './Footer.module.css'
import { routes } from '../../navigation'
import { site } from '../../site'
import { Brand } from '../Brand'
import { Icon } from '../Icon'

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
			</nav>
			<div className={styles.socials}>
				<Link
					className="icon-button"
					href={site.github}
					aria-label="Kirari on GitHub"
					title="Kirari on GitHub"
				>
					<Icon name="github" />
				</Link>
				<Link
					className="icon-button"
					href={site.x}
					aria-label="Follow Ugi on X"
					title="Follow Ugi on X"
				>
					<Icon name="x" />
				</Link>
			</div>
		</div>
	</footer>
)
