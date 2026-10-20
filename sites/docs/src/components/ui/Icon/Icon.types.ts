import type { iconPaths } from './Icon.constants'

export type Name = keyof typeof iconPaths
export type Props = {
	name: Name
	size?: number
}
