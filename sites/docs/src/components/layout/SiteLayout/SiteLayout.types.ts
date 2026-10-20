import type { ReactNode } from 'react'
import type { Page } from '@/lib/navigation.types'
import type { SectionId } from '@/lib/navigation.types'

export type Props = {
	page: Page
	activeSection?: SectionId
	children: ReactNode
}
