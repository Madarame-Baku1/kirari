'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { docsPath, sections } from '@/lib/navigation'

export const LegacyDocsRedirect = () => {
	const router = useRouter()
	useEffect(() => {
		const section = sections.find(entry => entry.id === location.hash.slice(1))
		if (section && section.id !== 'overview')
			router.replace(`${docsPath(section.id)}${location.hash}`)
	}, [
		router,
	])
	return null
}
