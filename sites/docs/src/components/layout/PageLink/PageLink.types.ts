import type { Page } from '@/lib/navigation.types'
import type { Variant } from '@/components/ui/Link/Link.types'

export type Props = {
	target: Page
	label: string
	current?: Page
	variant?: Variant
	onNavigate?: () => void
}
