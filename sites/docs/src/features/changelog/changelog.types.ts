import type { ReactNode } from 'react'
import type { categories, packages } from './changelog.data'

export type Category = (typeof categories)[number]['id']
export type PackageId = (typeof packages)[number]['id']

export type Release = {
	package: PackageId
	version: string
	/** Release day as `YYYY-MM-DD`. */
	date: string
	/** Categories with changes, in template order, rendered from the package's changelog file. */
	sections: readonly {
		category: Category
		content: ReactNode
	}[]
}
