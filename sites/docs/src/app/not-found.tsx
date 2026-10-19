import Link from 'next/link'

const NotFound = () => (
	<main id="main" className="not-found">
		<h1>Page not found</h1>
		<p>This page doesn’t exist. You can find Kirari’s guides in the documentation.</p>
		<Link className="button primary" href="/docs/">
			Read the docs
		</Link>
	</main>
)

export default NotFound
