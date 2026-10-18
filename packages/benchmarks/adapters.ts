import { render, tokenize } from '@vortexlabs/kirari/core'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import { typescript } from '@vortexlabs/kirari/languages/typescript'
import { tsx } from '@vortexlabs/kirari/languages/tsx'
import { python } from '@vortexlabs/kirari/languages/python'
import { json } from '@vortexlabs/kirari/languages/json'
import { shell } from '@vortexlabs/kirari/languages/shell'

export const languageNames = ['javascript', 'typescript', 'tsx', 'python', 'json', 'shell'] as const
export type LanguageName = typeof languageNames[number]
const languages = { javascript, typescript, tsx, python, json, shell }

export const highlight = (source: string, language: LanguageName) => render(tokenize(source, languages[language]))

// A browser bundle with the same callable surface and only the requested languages.
export const bundleEntry = (names: readonly LanguageName[]): string => {
  const definitions = names.map((name, index) => `import {${name} as language${index}} from '@vortexlabs/kirari/languages/${name}';`).join('\n')
  const registry = names.map((name, index) => `${JSON.stringify(name)}:language${index}`).join(',')
  return `import {tokenize,render} from '@vortexlabs/kirari/core';\n${definitions}\nconst languages={${registry}};
export const highlight = (source, language = 'javascript') => render(tokenize(source, languages[language]));`
}
