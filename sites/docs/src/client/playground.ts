import { tokenize, render, tokenTypes } from '@vortexlabs/kirari/core'
import type { Token } from '@vortexlabs/kirari'
import { css } from '@vortexlabs/kirari/languages/css'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import { languageEntries } from '../languages.js'
import { animateIn, copyText, get, setupCommon } from './common.js'

setupCommon()

const source = get<HTMLTextAreaElement>('#source')
const languageSelect = get<HTMLSelectElement>('#language-select')
const previewPane = get('#preview-pane')
const preview = get('#preview')
const highlighted = get('#highlighted')
const jsOutput = get('#js-output')
const cssOutput = get('#css-output')
const colorInput = get<HTMLInputElement>('#token-color')
const themeSelect = get<HTMLSelectElement>('#theme-select')
const status = get('#playground-status')
let entry = languageEntries.find(item => item.id === languageSelect.value)!
let tokens: Token[] = []
let selected: Token | undefined

/** The preview's current theme as a pasteable rule, including colors picked in the inspector. */
const themeCSS = () => {
  const styles = getComputedStyle(previewPane)
  const variables = ['background', ...tokenTypes].map(type => `  --kirari-${type}: ${styles.getPropertyValue(`--kirari-${type}`).trim()};`)
  return `/* Needs a Kirari theme file imported */\n.my-code {\n${variables.join('\n')}\n}`
}

const updateThemeCSS = () => {
  if (!cssOutput.hidden) cssOutput.firstElementChild!.innerHTML = render(tokenize(themeCSS(), css))
}

type Usage = 'js' | 'react' | 'markdown'
const usages: readonly string[] = ['js', 'react', 'markdown']
const tsx = languageEntries.find(item => item.id === 'tsx')!.language
let usage: Usage = 'js'

/** Code that reproduces the preview in plain JS, React, or a Markdown pipeline. */
const usageCode = () => {
  const name = entry.language.name
  const imports = `import { ${name} } from '@vortexlabs/kirari/languages'
import '@vortexlabs/kirari/themes/${themeSelect.value}.css'`
  const literal = (value: string) => `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``
  if (usage === 'react') return `import { Code } from '@vortexlabs/kirari-react'
${imports}

const code = ${literal(source.value)}

export const Example = () => <Code language={${name}}>{code}</Code>`
  if (usage === 'markdown') {
    // A fence longer than any backtick run in the code keeps it closed.
    const fence = '`'.repeat(Math.max(3, ...[...source.value.matchAll(/`+/g)].map(match => match[0].length + 1)))
    return `import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeKirari from '@vortexlabs/kirari-rehype'
${imports}

const markdown = ${literal(`${fence}${name}\n${source.value}\n${fence}`)}

const html = String(await unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeKirari, { languages: [${name}] })
  .use(rehypeStringify)
  .process(markdown))`
  }
  return `import { highlight } from '@vortexlabs/kirari'
${imports}

const code = ${literal(source.value)}

const html = highlight(code, { language: ${name} })
const block = \`<pre class="kirari"><code>\${html}</code></pre>\``
}

const updateUsage = () => {
  if (!jsOutput.hidden) jsOutput.firstElementChild!.innerHTML = render(tokenize(usageCode(), usage === 'react' ? tsx : javascript))
}

const updateColorInput = () => {
  if (!selected) return
  const value = getComputedStyle(previewPane).getPropertyValue(`--kirari-${selected.type}`).trim()
  colorInput.value = /^#[\da-f]{6}$/i.test(value) ? value : '#35435f'
}

const inspect = (token: Token | undefined, picked = false) => {
  selected = token
  get('#token-kind').textContent = token?.type ?? 'text'
  get('#token-variable').textContent = token ? `--kirari-${token.type}` : 'No highlighted tokens'
  get('#token-offset').textContent = token ? `Offset ${token.start}–${token.end}` : 'Try adding some code'
  colorInput.disabled = !token
  if (token) {
    colorInput.setAttribute('aria-label', `Color for ${token.type} tokens`)
    updateColorInput()
  }
  if (picked) animateIn('#inspector')
}

const refresh = () => {
  if (source.value.length > 20_000) {
    source.value = source.value.slice(0, 20_000)
    status.textContent = 'The playground is limited to 20,000 characters.'
  }
  tokens = tokenize(source.value, entry.language)
  highlighted.innerHTML = render(tokens, {
    className: token => token.type === 'text' ? undefined : `inspectable token-at-${token.start}`,
  })
  const byStart = new Map(tokens.map(token => [token.start, token]))
  highlighted.querySelectorAll<HTMLElement>('.inspectable').forEach(element => {
    const start = Number([...element.classList].find(name => name.startsWith('token-at-'))?.slice(9))
    const token = byStart.get(start)!
    element.dataset.start = String(start)
    element.tabIndex = 0
    element.setAttribute('role', 'button')
    element.setAttribute('aria-label', `Inspect ${token.type}: ${token.value.slice(0, 80)}`)
  })
  updateUsage()
  get('#token-count').textContent = `${tokens.length} tokens`
  const nextSelected = tokens.find(token => token.type === selected?.type && token.value === selected.value)
    ?? tokens.find(token => token.type === 'variable')
    ?? tokens.find(token => token.type !== 'text')
  inspect(nextSelected)
}

const setOutput = (mode: string) => {
  preview.hidden = mode !== 'preview'
  if (usages.includes(mode)) usage = mode as Usage
  jsOutput.hidden = !usages.includes(mode)
  cssOutput.hidden = mode !== 'css'
  updateThemeCSS()
  updateUsage()
  document.querySelectorAll<HTMLButtonElement>('[data-output]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.output === mode)))
  animateIn(usages.includes(mode) ? jsOutput : mode === 'css' ? cssOutput : preview)
}

const setLanguage = (id: string) => {
  const next = languageEntries.find(item => item.id === id)
  if (!next) return
  entry = next
  languageSelect.value = id
  source.value = next.sample
  get('#source-filename').textContent = next.filename
  refresh()
  status.textContent = `${next.label} example loaded.`
  setOutput('preview')
  const url = new URL(location.href)
  url.searchParams.set('lang', id)
  history.replaceState(null, '', url)
}

source.addEventListener('input', refresh)
languageSelect.addEventListener('change', () => setLanguage(languageSelect.value))
get('#reset-source').addEventListener('click', () => setLanguage(entry.id))
get('#copy-js').addEventListener('click', event => void copyText(usageCode(), event.currentTarget as HTMLElement))
get('#copy-theme').addEventListener('click', event => void copyText(themeCSS(), event.currentTarget as HTMLElement))
document.querySelectorAll<HTMLButtonElement>('[data-output]').forEach(button => button.addEventListener('click', () => setOutput(button.dataset.output!)))

const inspectElement = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return
  const element = target.closest<HTMLElement>('[data-start]')
  if (!element) return
  inspect(tokens.find(token => token.start === Number(element.dataset.start)), true)
}
highlighted.addEventListener('click', event => inspectElement(event.target))
highlighted.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    inspectElement(event.target)
  }
})
// Chrome skips horizontal scroll for focused inline tokens, which clips their focus ring
highlighted.addEventListener('focusin', event => (event.target as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' }))
colorInput.addEventListener('input', () => {
  if (selected) previewPane.style.setProperty(`--kirari-${selected.type}`, colorInput.value)
  updateThemeCSS()
})

themeSelect.addEventListener('change', () => {
  for (const type of tokenTypes) previewPane.style.removeProperty(`--kirari-${type}`)
  previewPane.dataset.palette = themeSelect.value
  get('#theme-picker').dataset.palette = themeSelect.value
  updateColorInput()
  updateThemeCSS()
  updateUsage()
  animateIn([preview, jsOutput, cssOutput].find(output => !output.hidden)!)
  status.textContent = `${themeSelect.selectedOptions[0]!.text} theme applied. Custom colors reset.`
})

const requested = new URLSearchParams(location.search).get('lang')
if (requested && languageEntries.some(item => item.id === requested)) setLanguage(requested)
else refresh()
