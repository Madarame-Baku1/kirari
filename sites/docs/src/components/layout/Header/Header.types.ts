import type { Page } from '@/shared.types'
import type { SectionId } from '@/navigation.types'
import type { Entry } from '@/components/layout/SearchDialog/SearchDialog.types'

export type Props = {
	page?: Page
	activeSection?: SectionId
	searchEntries: Entry[]
}
