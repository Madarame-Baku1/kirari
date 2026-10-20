import type { PackageId, Release } from '@/features/changelog/changelog.types'

export type Props = {
	releases: readonly Release[]
	/** Shows only this package's releases; all releases when unset. */
	active?: PackageId
}
