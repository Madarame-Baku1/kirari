import type { Page } from '@/lib/navigation.types'
import type { SectionId } from '@/lib/navigation.types'
import type { Entry } from '@/components/layout/SearchDialog/SearchDialog.types'

export type Props = {
	page?: Page
	activeSection?: SectionId
	searchEntries: Entry[]
}
