import { highlight } from '@vortexlabs/kirari'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import type { Language } from '@vortexlabs/kirari'
import { languageEntries } from './languages.js'
import { routes, sectionGroups, sections } from './navigation.js'
import kirariPackage from '../../../packages/kirari/package.json' with { type: 'json' }

export type Page = 'home' | 'docs' | 'playground'

export const site = {
  name: 'Kirari',
  url: 'https://kirari.vortex.design',
  npm: 'https://www.npmjs.com/package/@vortexlabs/kirari',
  version: kirariPackage.version,
  install: 'npm install @vortexlabs/kirari',
} as const

export const escapeHTML = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

const paths = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  external: '<path d="M8 16 16 8m-6 0h6v6"/>',
  sparkle: '<path d="M12 4c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z"/>',
  feather: '<path d="M20 4c-8 0-14 6-14 14v2M6 14h8M9 9h8"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/><path d="M12 21a2.5 2.5 0 0 1 0-5h2"/>',
  bolt: '<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>',
} as const
export type IconName = keyof typeof paths
export const icon = (name: IconName, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`

const copyCheck = (size: number) => `<svg class="copy-check" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7" pathLength="1"/></svg>`

/** Copy glyph that morphs into a tick while its button has `data-copied`. */
export const copyGlyph = (size = 15) => `<span class="copy-glyph" aria-hidden="true">${icon('copy', size)}${copyCheck(size)}</span>`

/** `#` that morphs into the same tick as `copyGlyph`. */
export const hashGlyph = (size = 18) => `<span class="copy-glyph" aria-hidden="true"><span class="hash">#</span>${copyCheck(size)}</span>`

const brand = `<span class="brand-mark" aria-hidden="true">${icon('sparkle', 14)}</span>kirari`

export const shell = languageEntries.find(entry => entry.id === 'shell')!.language
export const typescript = languageEntries.find(entry => entry.id === 'typescript')!.language

export const codeBlock = (id: string, source: string, language: Language = javascript, label = 'JavaScript') => {
  return `<div class="code-block"><div class="code-meta"><span>${escapeHTML(label)}</span><button class="icon-button copy-button" data-copy-target="${id}" aria-label="Copy ${escapeHTML(label)} example">${copyGlyph()}</button></div><pre class="kirari"><code id="${id}">${highlight(source, { language })}</code></pre></div>`
}

export const installCommand = (id: string, command: string = site.install) => {
  return `<div class="install"><span class="install-prompt" aria-hidden="true">$</span><code id="${id}">${escapeHTML(command)}</code><button class="icon-button copy-button" data-copy-target="${id}" aria-label="Copy install command">${copyGlyph()}</button></div>`
}

/** Data for the client-side search, embedded as JSON so pages need not bundle every language. */
const searchIndex = (): string => {
  const index = [
    { title: 'Playground', description: 'Edit code, inspect tokens, and try themes.', category: 'Page', href: routes.playground },
    ...sections.map(section => ({ title: section.title, description: section.description, category: 'Docs', href: `${routes.docs}#${section.id}` })),
    ...languageEntries.map(entry => ({ title: entry.label, description: `Try ${entry.filename} in the playground`, category: 'Language', href: `${routes.playground}?lang=${entry.id}`, keywords: `${entry.id} ${entry.group}` })),
  ]
  return JSON.stringify(index).replaceAll('<', '\\u003c')
}

export const docsNavigation = (prefix = '') => {
  return sectionGroups.map(group => `<div class="nav-group"><p>${group}</p>${sections.filter(s => s.group === group).map(s => `<a href="${prefix}#${s.id}" data-nav="${s.id}">${s.title}</a>`).join('')}</div>`).join('')
}

interface LayoutOptions {
  page: Page
  title: string
  description: string
  path: string
  body: string
}

export const layout = ({ page, title, description, path, body }: LayoutOptions): string => {
  const link = (target: Page, label: string) => `<a href="${routes[target]}"${page === target ? ' aria-current="page"' : ''}>${label}</a>`
  return `<!doctype html>
<html lang="en" data-page="${page}">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)}</title>
  <meta name="description" content="${escapeHTML(description)}">
  <link rel="canonical" href="${site.url}${path}">
  <meta property="og:title" content="${escapeHTML(title)}">
  <meta property="og:description" content="${escapeHTML(description)}">
  <meta property="og:url" content="${site.url}${path}">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#111318"/><path d="M16 6c.8 5.6 4.4 9.2 10 10-5.6.8-9.2 4.4-10 10-.8-5.6-4.4-9.2-10-10 5.6-.8 9.2-4.4 10-10Z" fill="#ffcf4a"/></svg>')}">
  <script>document.documentElement.classList.add('js')</script>
  <script src="https://cdn.usefathom.com/script.js" data-site="YGMATMZF" defer></script>
  <style>__KIRARI_CSS__</style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="topbar">
    <div class="topbar-inner">
      <button class="icon-button mobile-nav-button" id="open-menu" aria-label="Open navigation">${icon('menu')}</button>
      <a class="brand" href="${routes.home}" aria-label="Kirari home">${brand}</a>
      <nav class="top-links" aria-label="Primary">${link('docs', 'Docs')}${link('playground', 'Playground')}<a href="${site.npm}">npm</a></nav>
      <div class="top-actions"><button class="search-button" id="open-search" aria-label="Search documentation">${icon('search', 16)}<span>Search</span><kbd>⌘K</kbd></button></div>
    </div>
  </header>
  ${body}
  <dialog id="search-dialog" aria-labelledby="search-title"><form method="dialog" class="search-dialog-header"><h2 id="search-title" class="sr-only">Search documentation</h2>${icon('search')}<label class="sr-only" for="doc-search">Search docs and languages</label><input id="doc-search" type="search" placeholder="Search docs and languages…" autocomplete="off"><button type="button" class="close-search" aria-label="Close search"><kbd>Esc</kbd></button></form><div id="search-results" class="search-results"></div><div class="search-hint"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span></div></dialog>
  <dialog id="mobile-menu" aria-labelledby="mobile-menu-title"><div class="mobile-menu-header"><h2 id="mobile-menu-title">${brand}</h2><button class="icon-button" id="close-menu" aria-label="Close navigation">${icon('close')}</button></div><nav class="mobile-links" aria-label="Pages">${link('home', 'Home')}${link('docs', 'Docs')}${link('playground', 'Playground')}</nav><nav aria-label="Documentation sections">${docsNavigation(page === 'docs' ? '' : routes.docs)}</nav></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
  <script type="application/json" id="search-index">${searchIndex()}</script>
  <script type="module">__KIRARI_SCRIPT__</script>
</body></html>`
}

export const footer = () => {
  return `<footer class="site-footer"><div class="footer-inner"><a class="brand" href="${routes.home}">${brand}</a><p>A little light for your code.</p><nav aria-label="Footer"><a href="${routes.docs}">Docs</a><a href="${routes.playground}">Playground</a><a href="${site.npm}">npm</a></nav><span>v${site.version}</span></div></footer>`
}
