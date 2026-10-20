import type { ReactNode } from 'react'
import type { Page } from '@/shared.types'
import type { SectionId } from '@/navigation.types'

export type Props = {
	page: Page
	activeSection?: SectionId
	children: ReactNode
}
