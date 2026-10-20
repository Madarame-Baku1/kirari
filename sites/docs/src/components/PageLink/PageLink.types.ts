import type { Page } from '../../shared.types'
import type { Variant } from '../Link/Link.types'

export type Props = {
	target: Page
	label: string
	current?: Page
	variant?: Variant
	onNavigate?: () => void
}
