import type { Page } from '@/shared.types'
import type { SectionId } from '@/navigation.types'

export type Props = {
	open: boolean
	onClose: () => void
	page?: Page
	activeSection?: SectionId
}
