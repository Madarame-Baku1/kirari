import type { Language } from '../types.js'

export const diff: Language = {
  name: 'diff',
  rules: [
    { type: 'heading', pattern: /^(?:diff |index |--- |\+\+\+ |@@)[^\r\n]*/m },
    { type: 'inserted', pattern: /^\+[^\r\n]*/m },
    { type: 'deleted', pattern: /^-[^\r\n]*/m },
    { type: 'text', pattern: /[^\r\n]+|\r\n|[\r\n]/ },
  ],
}
