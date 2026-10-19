import type { sections } from './navigation'

export type Section = (typeof sections)[number]
export type SectionId = Section['id']
