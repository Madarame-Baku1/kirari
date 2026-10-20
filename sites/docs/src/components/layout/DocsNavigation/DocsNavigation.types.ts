import type { SectionId } from '@/navigation.types'

export type Props = {
	active?: SectionId
	onNavigate?: () => void
}
