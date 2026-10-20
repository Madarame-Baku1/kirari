import type { MetadataRoute } from 'next'
import { site } from '@/site'

const robots = (): MetadataRoute.Robots => ({
	rules: {
		userAgent: '*',
		allow: '/',
	},
	sitemap: `${site.url}/sitemap.xml`,
})

export default robots
