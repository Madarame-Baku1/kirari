import { Suspense } from 'react'
import { readReleases } from '@/changelog.content'
import { Changelog as ChangelogTimeline } from '@/features/changelog/Changelog'
import { ChangelogQuery } from '@/features/changelog/ChangelogQuery'
import { Footer } from '@/components/layout/Footer'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { pageMetadata } from '@/seo'

export const metadata = pageMetadata(
	'Changelog',
	'Every Kirari release with its breaking changes, improvements, and bug fixes across the core library, React, and Rehype packages.',
	'/changelog/',
)

const Changelog = async () => {
	const releases = await readReleases()

	return (
		<SiteLayout page="changelog">
			<Suspense fallback={<ChangelogTimeline releases={releases} />}>
				<ChangelogQuery releases={releases} />
			</Suspense>
			<Footer />
		</SiteLayout>
	)
}

export default Changelog
