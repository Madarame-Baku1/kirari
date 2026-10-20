import type { Page } from '@/lib/navigation.types'
import type { SectionId } from '@/lib/navigation.types'

export type Props = {
	open: boolean
	onClose: () => void
	page?: Page
	activeSection?: SectionId
}
