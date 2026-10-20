'use client'

import { useSearchParams } from 'next/navigation'
import { isPackageId } from '@/changelog'
import { Changelog } from '@/features/changelog/Changelog'
import type * as Types from './ChangelogQuery.types'

export const ChangelogQuery = (props: Types.Props) => {
	const { releases } = props
	const requested = useSearchParams().get('package')
	return <Changelog releases={releases} active={isPackageId(requested) ? requested : undefined} />
}
