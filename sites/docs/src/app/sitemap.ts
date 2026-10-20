import type { MetadataRoute } from 'next'
import { indexablePaths } from '@/lib/seo'
import { site } from '@/lib/site'

const sitemap = (): MetadataRoute.Sitemap =>
	indexablePaths.map(path => ({
		url: `${site.url}${path}`,
	}))

export default sitemap
