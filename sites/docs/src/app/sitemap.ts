import type { MetadataRoute } from 'next'
import { indexablePaths } from '@/seo'
import { site } from '@/site'

const sitemap = (): MetadataRoute.Sitemap =>
	indexablePaths.map(path => ({
		url: `${site.url}${path}`,
	}))

export default sitemap
