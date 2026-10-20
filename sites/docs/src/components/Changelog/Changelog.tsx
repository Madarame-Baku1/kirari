import styles from './Changelog.module.css'
import { categories, packages } from '../../changelog'
import { routes } from '../../navigation'
import { Button } from '../Button'
import type * as Types from './Changelog.types'

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC',
})

const filters = [
	{
		id: undefined,
		label: 'All releases',
		href: routes.changelog,
	},
	...packages.map(item => ({
		id: item.id,
		label: item.id,
		href: `${routes.changelog}?package=${item.id}`,
	})),
]

const labels = Object.fromEntries(
	categories.map(category => [
		category.id,
		category.label,
	]),
)

export const Changelog = (props: Types.Props) => {
	const { releases, active } = props
	const shown = active ? releases.filter(release => release.package === active) : releases

	return (
		<main id="main" tabIndex={-1} className={styles.root}>
			<header className={styles.header}>
				<h1>Changelog</h1>
				<p>New releases, improvements, and fixes across Kirari and its integrations.</p>
			</header>
			<nav className={styles.filters} aria-label="Packages">
				<ul className={styles.filterList}>
					{filters.map(filter => {
						const current = filter.id === active
						const count = filter.id
							? releases.filter(release => release.package === filter.id).length
							: releases.length
						return (
							<li key={filter.label}>
								<Button
									href={filter.href}
									size="sm"
									variant={current ? 'primary' : 'secondary'}
									aria-current={current ? 'page' : undefined}
									scroll={false}
								>
									{filter.label}
									<span className={styles.count}>{count}</span>
								</Button>
							</li>
						)
					})}
				</ul>
			</nav>
			<ol className={styles.timeline}>
				{shown.map(release => (
					<li key={`${release.package}@${release.version}`} className={styles.release}>
						<div className={styles.meta}>
							<h2
								id={`${release.package}-${release.version}`}
								className={styles.version}
							>
								{active ? release.version : `${release.package} ${release.version}`}
							</h2>
							<time className={styles.date} dateTime={release.date}>
								{dateFormat.format(new Date(release.date))}
							</time>
						</div>
						<div className={styles.body}>
							{release.sections.map(section => (
								<section
									key={section.category}
									className={styles.category}
									data-category={section.category}
								>
									<h3>{labels[section.category]}</h3>
									{section.content}
								</section>
							))}
						</div>
					</li>
				))}
			</ol>
		</main>
	)
}
