import type { Page } from '../../shared.types'

export type Props = {
	target: Page
	label: string
	current: Page
	onNavigate?: () => void
}
