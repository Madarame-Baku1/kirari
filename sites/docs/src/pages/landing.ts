import { highlight } from '@vortexlabs/kirari'
import { css } from '@vortexlabs/kirari/languages/css'
import { languageEntries } from '../languages.js'
import { routes } from '../navigation.js'
import { streamSample } from '../client/stream-sample.js'
import { codeBlock, escapeHTML, footer, icon, installCommand, layout, site, typescript } from '../shared.js'
import { theme, themes } from '../themes.js'

const demoLanguages = ['typescript', 'python', 'rust', 'css'] as const

const palettes = ['ad-astra-dark', 'daylight', 'github-dark', 'dracula', 'nord', 'catppuccin-latte', 'tokyo-night', 'rose-pine-dawn'].map(theme)
const cards = ['dusk', 'github-light', 'catppuccin-mocha', 'solarized-light'].map(theme)

const themeSample = `// a little light
const name = 'kirari'
shine(name, 42)`

const themeCSS = `@import '@vortexlabs/kirari/themes/github-light.css';

/* Then tweak any token you like */
.my-code {
  --kirari-keyword: #7a3fd1;
}`

const languageCount = languageEntries.length

const stats = [
  { value: '2.9', unit: 'kB', label: 'core with JavaScript, gzipped' },
  { value: String(languageCount), unit: '', label: 'languages, imported one by one' },
  { value: '0', unit: '', label: 'runtime dependencies or DOM APIs' },
] as const

export const renderLanding = (): string => {
  const demos = demoLanguages.map(id => languageEntries.find(entry => entry.id === id)!)
  const body = `<main id="main" tabindex="-1" class="landing">
    <section class="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" class="hero-title">Syntax highlighting with a little <span class="glint-text">light</span></h1>
      <p class="hero-lede">Kirari is a tiny, DOM-free highlighter for ${languageCount}&nbsp;languages. Every token becomes a class, and your CSS picks the colors.</p>
      <div class="hero-cta">${installCommand('hero-install')}<a class="button primary" href="${routes.docs}">Get started ${icon('arrow', 16)}</a></div>
    </section>

    <section class="demo" aria-label="Highlighting demo">
      <div class="demo-window" data-palette="ad-astra-dark">
        <div class="demo-bar">
          <div class="demo-tabs" role="tablist" aria-label="Demo language">${demos.map((entry, index) => `<button role="tab" id="demo-tab-${entry.id}" aria-controls="demo-${entry.id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-demo="${entry.id}">${escapeHTML(entry.filename)}</button>`).join('')}</div>
          <div class="demo-palettes" role="group" aria-label="Demo theme">${palettes.map((palette, index) => `<button type="button" data-demo-palette="${palette.id}" aria-pressed="${index === 0}" aria-label="${escapeHTML(palette.label)} theme" title="${escapeHTML(palette.label)}"><i data-palette="${palette.id}"></i></button>`).join('')}</div>
        </div>
        <div class="demo-body">${demos.map((entry, index) => `<pre class="kirari demo-code" id="demo-${entry.id}" role="tabpanel" tabindex="0" aria-labelledby="demo-tab-${entry.id}"${index === 0 ? '' : ' hidden'}><code>${highlight(entry.sample, { language: entry.language })}</code></pre>`).join('')}</div>
      </div>
      <p class="demo-caption">Same HTML in every theme. Switch with the dots above, or <a href="${routes.playground}">edit your own code</a>.</p>
    </section>

    <section class="stats" aria-label="At a glance">${stats.map(stat => `<div class="stat" data-reveal><p class="stat-value"><span data-count="${stat.value}">${stat.value}</span>${stat.unit ? `<small>${stat.unit}</small>` : ''}</p><p class="stat-label">${stat.label}</p></div>`).join('')}</section>

    <section class="row" aria-labelledby="stream-title">
      <div class="row-copy" data-reveal>
        <p class="eyebrow">${icon('bolt', 15)} Streaming</p>
        <h2 id="stream-title">Colors that keep up with the text</h2>
        <p>Feed chunks as they arrive from a model or a socket. Each write returns a patch for the tail that changed, so you re-render only that, not the whole block.</p>
        <a class="text-link" href="${routes.docs}#streaming">How streaming works ${icon('arrow', 15)}</a>
      </div>
      <div class="stream-window" data-palette="dusk" data-reveal>
        <div class="stream-bar"><span class="stream-dot" aria-hidden="true"></span><span id="stream-status">reply.ts</span><button type="button" class="stream-replay" id="stream-replay">${icon('reset', 14)} Replay</button></div>
        <pre class="kirari stream-code" aria-label="Streaming example" tabindex="0"><code id="stream-output">${highlight(streamSample, { language: typescript })}</code></pre>
      </div>
    </section>

    <section class="row reverse" aria-labelledby="themes-title">
      <div class="row-copy" data-reveal>
        <p class="eyebrow">${icon('palette', 15)} Theming</p>
        <h2 id="themes-title">${themes.length} themes in the box</h2>
        <p>GitHub, Dracula, Nord, Catppuccin, Tokyo Night and more, each one CSS file. Each token type maps to one CSS variable, so you can tweak a theme or write your own without re-highlighting.</p>
        <a class="text-link" href="${routes.docs}#themes">Browse all themes ${icon('arrow', 15)}</a>
      </div>
      <div class="theme-stack" data-reveal>
        ${cards.map(card => `<figure class="theme-card" data-palette="${card.id}"><pre class="kirari"><code>${highlight(themeSample, { language: typescript })}</code></pre><figcaption>${escapeHTML(card.label)}</figcaption></figure>`).join('')}
        ${codeBlock('theme-snippet', themeCSS, css, 'CSS')}
      </div>
    </section>

    <section class="row" aria-labelledby="languages-title">
      <div class="row-copy" data-reveal>
        <p class="eyebrow">${icon('feather', 15)} Languages</p>
        <h2 id="languages-title">${languageCount} languages. Ship only yours.</h2>
        <p>Every grammar is its own import, so a blog with three languages never carries the other ${languageCount - 3}. Pick one to try it in the playground.</p>
        <a class="text-link" href="${routes.docs}#languages">All languages ${icon('arrow', 15)}</a>
      </div>
      <nav class="language-cloud" aria-label="Try a language" data-reveal>${languageEntries.map(entry => `<a href="${routes.playground}?lang=${entry.id}"><span>${escapeHTML(entry.label)}</span></a>`).join('')}</nav>
    </section>

    <section class="closing" aria-labelledby="closing-title" data-reveal>
      <div class="closing-copy">
        <h2 id="closing-title">Three lines to start</h2>
        <p>Install, import a theme, and highlight.</p>
        <div class="closing-actions"><a class="button primary" href="${routes.docs}#installation">Installation guide ${icon('arrow', 16)}</a><a class="button ghost" href="${routes.playground}">Open playground</a></div>
      </div>
      <div class="closing-code" data-palette="dusk">${codeBlock('quick-start', "import { highlight } from '@vortexlabs/kirari'\nimport '@vortexlabs/kirari/theme.css'\n\nconst html = highlight('const answer = 42')", typescript, 'TypeScript')}</div>
    </section>
  </main>
  ${footer()}`
  return layout({ page: 'home', title: 'Kirari — syntax highlighting with a little light', description: `A tiny, DOM-free syntax highlighter for ${languageCount} languages, styled with CSS variables. ${site.install}`, path: routes.home, body })
}
