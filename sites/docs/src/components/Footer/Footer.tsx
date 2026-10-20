import styles from './Footer.module.css'
import { routes } from '../../navigation'
import { Logo } from '../Logo'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Link } from '../Link'
import { iconLinks, links } from './Footer.data'

export const Footer = () => (
	<footer className="site-footer">
		<div className="footer-inner">
			<Link href={routes.home}>
				<Logo size="small" />
			</Link>
			<p>A little light for your code.</p>
			<nav aria-label="Footer">
				{links.map(link => (
					<Link key={link.href} href={link.href} prefetch={link.prefetch}>
						{link.label}
					</Link>
				))}
			</nav>
			<div className={styles.socials}>
				{iconLinks.map(link => (
					<IconButton
						key={link.href}
						href={link.href}
						external
						label={link.label}
						title={link.label}
					>
						<Icon name={link.icon} />
					</IconButton>
				))}
			</div>
		</div>
	</footer>
)
