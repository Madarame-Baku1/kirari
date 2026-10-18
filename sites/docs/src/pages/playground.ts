import { highlight } from '@vortexlabs/kirari'
import { languageEntries } from '../languages.js'
import { routes } from '../navigation.js'
import { copyGlyph, escapeHTML, icon, layout } from '../shared.js'
import { themes } from '../themes.js'

export const renderPlayground = (): string => {
  const initial = languageEntries.find(entry => entry.id === 'javascript')!
  const groups = ['Web', 'Programming', 'Data', 'Configuration'] as const
  const body = `<main id="main" tabindex="-1" class="playground-page">
    <h1 class="sr-only">Kirari playground</h1>
    <div class="playground">
      <div class="playground-toolbar">
        <div class="language-picker">${icon('code', 16)}<label class="sr-only" for="language-select">Language</label><select id="language-select">${groups.map(group => `<optgroup label="${group}">${languageEntries.filter(entry => entry.group === group).map(entry => `<option value="${entry.id}"${entry.id === initial.id ? ' selected' : ''}>${escapeHTML(entry.label)}</option>`).join('')}</optgroup>`).join('')}</select></div>
        <div class="theme-picker" id="theme-picker" data-palette="daylight"><span class="palette-swatch" aria-hidden="true"></span><label class="sr-only" for="theme-select">Code theme</label><select id="theme-select" autocomplete="off">${(['light', 'dark'] as const).map(appearance => `<optgroup label="${appearance === 'light' ? 'Light' : 'Dark'}">${themes.filter(entry => entry.appearance === appearance).map(entry => `<option value="${entry.id}"${entry.id === 'daylight' ? ' selected' : ''}>${escapeHTML(entry.label)}</option>`).join('')}</optgroup>`).join('')}</select></div>
        <div class="editor-actions"><button class="quiet-button" id="reset-source" title="Restore the example code">${icon('reset', 14)}<span>Reset</span></button><button class="quiet-button" id="copy-theme">${copyGlyph(14)}<span>Copy CSS</span></button><button class="quiet-button" id="copy-js">${copyGlyph(14)}<span>Copy code</span></button></div>
      </div>
      <div class="editor-panes">
        <div class="source-pane"><div class="pane-label"><label for="source">Source</label><span id="source-filename">${initial.filename}</span></div><textarea id="source" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="20000" aria-describedby="editor-help">${escapeHTML(initial.sample)}</textarea></div>
        <div class="preview-pane" id="preview-pane" data-palette="daylight"><div class="pane-label"><div class="output-switch" role="group" aria-label="Output view"><button data-output="preview" aria-pressed="true">Preview</button><button data-output="js" aria-pressed="false">JS</button><button data-output="react" aria-pressed="false">React</button><button data-output="markdown" aria-pressed="false">Markdown</button><button data-output="css" aria-pressed="false">CSS</button></div><span id="token-count"></span></div><pre class="kirari preview-code" id="preview"><code id="highlighted">${highlight(initial.sample)}</code></pre><pre class="kirari preview-code" id="js-output" aria-label="Usage code" tabindex="0" hidden><code></code></pre><pre class="kirari preview-code" id="css-output" aria-label="Theme CSS" tabindex="0" hidden><code></code></pre></div>
      </div>
      <div class="inspector" id="inspector"><span class="token-kind" id="token-kind">variable</span><code id="token-variable">--kirari-variable</code><div class="inspector-end"><span id="token-offset">Select a token</span><label class="color-control" title="Recolor every token of this type"><input type="color" id="token-color" value="#35435f" aria-label="Selected token color"><span>Color</span></label></div></div>
    </div>
    <p class="editor-help" id="editor-help">Edit the code, click a token, then recolor its type. Everything runs in your browser. <a href="${routes.docs}#theming">How theming works</a></p>
    <p id="playground-status" class="sr-only" role="status" aria-live="polite"></p>
  </main>`
  return layout({ page: 'playground', title: 'Playground — Kirari', description: `Try Kirari in your browser: edit code in ${languageEntries.length} languages, inspect tokens, and export theme CSS.`, path: routes.playground, body })
}
