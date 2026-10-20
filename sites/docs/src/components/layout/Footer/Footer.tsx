import styles from './Footer.module.css'
import { routes } from '@/lib/navigation'
import { Logo } from '@/components/layout/Logo'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { Link } from '@/components/ui/Link'
import { iconLinks, links } from './Footer.data'

export const Footer = () => (
	<footer className="site-footer">
		<div className="footer-inner">
			<Link href={routes.home}>
				<Logo size="small" />
			</Link>
			<p>A little light for your code.</p>
			<nav aria-label="Footer">
				<ul>
					{links.map(link => (
						<li key={link.href}>
							<Link href={link.href} prefetch={link.prefetch}>
								{link.label}
							</Link>
						</li>
					))}
				</ul>
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
