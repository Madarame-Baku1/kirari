'use client'

import { pageSearchEntries, routes } from '../../navigation'
import { Button } from '../Button'
import { Footer } from '../Footer'
import { Header } from '../Header'
import { Icon } from '../Icon'
import { digitPlaces, messages } from './ErrorPage.data'
import styles from './ErrorPage.module.css'
import type * as Types from './ErrorPage.types'

export const ErrorPage = (props: Types.Props) => {
	const { status, onRetry } = props
	const { title, description } = messages[status]

	return (
		<div className={styles.root}>
			<a className="skip-link" href="#main">
				Skip to content
			</a>
			<Header searchEntries={pageSearchEntries} />
			<main id="main" tabIndex={-1} className={styles.main}>
				<div className={styles.content}>
					<p className={styles.status}>
						<span className="sr-only">Error {status}</span>
						<span className={styles.brace} aria-hidden="true">
							{'{'}
						</span>
						<span className={styles.digits} aria-hidden="true">
							{digitPlaces.map(place => {
								const digit = Math.floor(status / place) % 10
								return (
									<span
										key={place}
										className={digit === 0 ? styles.zero : undefined}
									>
										{digit}
										{digit === 0 && <Icon name="sparkle" />}
									</span>
								)
							})}
						</span>
						<span className={styles.brace} aria-hidden="true">
							{'}'}
						</span>
					</p>
					<h1 className={styles.title}>{title}</h1>
					<p className={styles.description}>{description}</p>
					<div className={styles.actions}>
						{onRetry ? (
							<Button onClick={onRetry}>Try again</Button>
						) : (
							<Button href={routes.home} endIcon={<Icon name="arrow" size={16} />}>
								Back to home
							</Button>
						)}
						<Button href={onRetry ? routes.home : routes.docs} variant="secondary">
							{onRetry ? 'Back to home' : 'Read the docs'}
						</Button>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
