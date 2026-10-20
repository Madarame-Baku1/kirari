import type { SectionId } from '@/lib/navigation.types'

export type Props = {
	active?: SectionId
	onNavigate?: () => void
}
