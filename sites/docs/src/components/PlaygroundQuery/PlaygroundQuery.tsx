'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type * as Types from './PlaygroundQuery.types'

export const PlaygroundQuery = (props: Types.Props) => {
	const { onLanguage } = props
	const requested = useSearchParams().get('lang') ?? 'javascript'
	useEffect(() => {
		onLanguage(requested)
	}, [
		requested,
		onLanguage,
	])
	return null
}
