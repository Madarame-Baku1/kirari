import type { Language } from '../types.js'
import { javascript } from './javascript.js'

export const typescript: Language = {
  ...javascript,
  name: 'typescript',
  keywords: [...javascript.keywords!, ...'abstract accessor asserts declare enum implements infer interface is keyof namespace never override private protected public readonly satisfies type unique using'.split(' ')],
  types: 'any bigint boolean intrinsic never number object string symbol unknown void'.split(' '),
}
