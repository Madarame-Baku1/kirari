import styles from './Footer.module.css'
import { routes } from '../../navigation'
import { site } from '../../site'
import { Brand } from '../Brand'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Link } from '../Link'

export const Footer = () => (
	<footer className="site-footer">
		<div className="footer-inner">
			<Link href={routes.home}>
				<Brand size="small" />
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
				<IconButton
					href={site.github}
					external
					label="Kirari on GitHub"
					title="Kirari on GitHub"
				>
					<Icon name="github" />
				</IconButton>
				<IconButton href={site.x} external label="Follow Ugi on X" title="Follow Ugi on X">
					<Icon name="x" />
				</IconButton>
			</div>
		</div>
	</footer>
)
