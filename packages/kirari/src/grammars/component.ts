import { markup } from './markup.js'
import { javascript } from '../languages/javascript.js'
import { typescript } from '../languages/typescript.js'
import { css } from '../languages/css.js'

const embedded = { script: javascript, 'script:js': javascript, 'script:ts': typescript, style: css, 'style:css': css }

// shortcut: preprocessors, Vue v-pre, and expressions in quoted Svelte attributes need framework-specific parsing.
export const component = (source: string, dialect: 'vue' | 'svelte') => {
  return markup(source, undefined, embedded, dialect)
}
