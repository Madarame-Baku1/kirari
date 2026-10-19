import type { Element, Nodes, Root } from 'hast'
import type { ReactNode, ComponentProps, JSX } from 'react'
import type { SectionId } from '../../navigation.types'

export type { Element, ReactNode, Root }
export type Node = Nodes
export type Props = {
	id: SectionId
	title: string
	source: string
}

export type ElementProps<Tag extends keyof JSX.IntrinsicElements> = ComponentProps<Tag> & {
	node?: Element
}
