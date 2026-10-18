import { highlight, tokenize, tokenTypes } from '@vortexlabs/kirari'
import { renderDecorated } from '@vortexlabs/kirari/decorations'
import { createMarkdown } from '@vortexlabs/kirari/markdown'
import { createRegistry } from '@vortexlabs/kirari/registry'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import { css } from '@vortexlabs/kirari/languages/css'
import { json } from '@vortexlabs/kirari/languages/json'
import { languageEntries } from '../languages.js'
import { routes, sections } from '../navigation.js'
import { codeBlock, docsNavigation, escapeHTML, footer, hashGlyph, icon, installCommand, layout, shell, typescript } from '../shared.js'
import { themes } from '../themes.js'

const tsx = languageEntries.find(entry => entry.id === 'tsx')!.language

const heading = (id: string) => {
  const section = sections.find(item => item.id === id)!
  // The first section's heading is the page's h1
  const tag = id === sections[0]!.id ? 'h1' : 'h2'
  return `<p class="section-group">${section.group}</p><${tag}><a class="anchor" href="#${id}">${escapeHTML(section.title)}</a><button class="anchor-copy" data-anchor="${id}" aria-label="Copy link to ${escapeHTML(section.title)}">${hashGlyph()}</button></${tag}>`
}

const lede = (id: string) => escapeHTML(sections.find(item => item.id === id)!.description)

export const renderDocs = (): string => {
  const decorated = renderDecorated(tokenize('const answer = 42\nconsole.log(answer)'), {
    decorations: [{ start: 6, end: 12, className: 'kirari-inserted' }],
    lines: true,
  })
  const fencedMarkdown = createMarkdown(createRegistry([javascript, json]))
  const themeSample = highlight("// a little light\nconst name = 'kirari'\nshine(name, 42)", { language: typescript })
  const body = `<div class="docs-layout">
  <nav class="docs-nav" aria-label="Documentation">${docsNavigation()}</nav>
  <main id="main" tabindex="-1" class="docs-main">
    <section id="overview" class="doc-section intro">${heading('overview')}<p class="lede">Kirari turns source code into tokens, and tokens into escaped HTML. No DOM, no runtime dependencies, and every color comes from your CSS.</p>
      ${installCommand('docs-install')}
      <div class="intro-cards"><a href="#installation"><strong>Get started</strong><span>Install and highlight your first snippet.</span></a><a href="#themes"><strong>Make it yours</strong><span>Pick one of ${themes.length} themes or write your own.</span></a><a href="${routes.playground}"><strong>Playground</strong><span>Edit code and inspect tokens live.</span></a></div>
      <p>The API has three core functions: <code>tokenize</code> splits source into typed tokens with exact offsets, <code>render</code> turns tokens into HTML, and <code>highlight</code> does both. Optional entry points add streaming, decorations, and language lookup, and separate packages integrate with Rehype and React.</p>
    </section>

    <section id="installation" class="doc-section">${heading('installation')}<p class="lede">${lede('installation')}</p>${codeBlock('install-command', 'npm install @vortexlabs/kirari\n\n# or\npnpm add @vortexlabs/kirari\nyarn add @vortexlabs/kirari\nbun add @vortexlabs/kirari', shell, 'Terminal')}
      <h3>Highlight your first snippet</h3>${codeBlock('first-snippet', "import { highlight } from '@vortexlabs/kirari'\nimport '@vortexlabs/kirari/theme.css'\n\nconst html = highlight('const message = \"Hello, world!\"')\nconst block = `<pre class=\"kirari\"><code>${html}</code></pre>`")}
      <p><code>highlight</code> returns the inner HTML; wrap it in your own <code>&lt;pre&gt;&lt;code&gt;</code>. JavaScript is the default. <code>class="kirari"</code> on the <code>&lt;pre&gt;</code> applies the theme’s background and text color.</p>
    </section>

    <section id="languages" class="doc-section">${heading('languages')}<p class="lede">${lede('languages')}</p><p>From components to configuration files. Import the definitions you need; the others stay out of your bundle.</p><p>Import from <code>/core</code> to ship only Python. The main entry always bundles JavaScript as its default.</p>${codeBlock('language-example', "import { tokenize, render } from '@vortexlabs/kirari/core'\nimport { python } from '@vortexlabs/kirari/languages/python'\n\nconst html = render(tokenize('print(\"Hello, world!\")', python))")}
      <div class="language-list-header"><label class="filter-box">${icon('search')}<span class="sr-only">Filter languages</span><input id="language-filter" type="search" placeholder="Find your language…"></label><span id="language-count" role="status">${languageEntries.length} languages</span></div><div class="language-grid" id="language-grid">${languageEntries.map(entry => `<a class="language-item" href="${routes.playground}?lang=${entry.id}" data-search="${escapeHTML(`${entry.label} ${entry.id} ${entry.group}`.toLowerCase())}" aria-label="Try ${escapeHTML(entry.label)} in the playground"><span>${escapeHTML(entry.label)}</span><span class="language-group">${entry.group}</span></a>`).join('')}</div><p id="language-empty" hidden>No matching languages. Try another name or category.</p><p class="small-note">JSX and TSX are separate definitions. Use <code>hcl</code> for Terraform and <code>shell</code> for common shell syntax. These are lexical grammars, not compiler parsers.</p>
    </section>

    <section id="themes" class="doc-section">${heading('themes')}<p class="lede">${lede('themes')}</p><p>Import one theme and add <code>class="kirari"</code> to your <code>&lt;pre&gt;</code>. Each file only sets fallback colors, so your own <code>--kirari-*</code> variables still win.</p>${codeBlock('theme-import', "import '@vortexlabs/kirari/themes/github-dark.css'", typescript, 'TypeScript')}
      <div class="theme-gallery">${themes.map(entry => `<figure class="theme-card" data-palette="${entry.id}"><pre class="kirari"><code>${themeSample}</code></pre><figcaption><strong>${escapeHTML(entry.label)}</strong><code>themes/${entry.id}.css</code></figcaption></figure>`).join('')}</div>
      <p class="small-note"><code>@vortexlabs/kirari/theme.css</code> is the same file as <code>themes/default.css</code>. Ported themes are adaptations of the originals’ published colors, credited in each file’s header. Try any of them on your own code in the <a href="${routes.playground}">playground</a>.</p>
    </section>
    <section id="theming" class="doc-section">${heading('theming')}<p class="lede">${lede('theming')}</p><p>Every category gets a class and a CSS variable. No inline colors, no re-highlighting when your theme changes.</p>${codeBlock('theme-example', '.my-code {\n  --kirari-background: #f8f7fc;\n  --kirari-text: #35313f;\n  --kirari-keyword: #7452bd;\n  --kirari-string: #247060;\n  --kirari-variable: #35435f;\n  --kirari-comment: #74717c;\n}\n\n.my-code .kirari-keyword { font-weight: 600; }', css, 'CSS')}
      <p>Variables need a theme file imported (<code>theme.css</code> or any from <a href="#themes">Themes</a>); it maps each variable to its class. Set them on any ancestor. No theme file? Style <code>.kirari-keyword</code> and the other classes directly.</p><h3>A token for every detail</h3><div class="token-categories">${tokenTypes.map(type => `<code>--kirari-${type}</code>`).join('')}</div><p class="small-note">Plain text renders without a span unless you assign it a custom class. <code>--kirari-background</code> controls the optional wrapper background.</p>
    </section>

    <section id="rendering" class="doc-section">${heading('rendering')}<p class="lede">${lede('rendering')}</p><p>Need a selection, a custom component, or a different rendering target? Keep the tokens and take it from there.</p>${codeBlock('rendering-example', "import { tokenize, render } from '@vortexlabs/kirari'\n\nconst tokens = tokenize('const count = 1')\nconst html = render(tokens, {\n  classes: { comment: 'muted' },\n  className: token =>\n    token.type === 'variable' ? 'selected-name' : undefined,\n})")}
      <div class="token-shape"><span class="token-kind">variable</span><code>{ type: 'variable', value: 'count', start: 6, end: 11 }</code></div><p>Offsets use UTF-16 code units, just like JavaScript’s <code>slice</code>. The start is inclusive, the end exclusive. Joining token values always reconstructs the original source.</p><p>For React or another UI framework, render each token’s <code>value</code> as text and assign classes yourself. For HTML with source-range annotations or line wrappers, use <a href="#decorations"><code>renderDecorated</code></a>.</p>
    </section>

    <section id="decorations" class="doc-section">${heading('decorations')}<p class="lede">${lede('decorations')}</p><p>Add classes to source ranges without touching syntax tokens. Optionally wrap each line for line numbers or annotations.</p>${codeBlock('decorations-example', String.raw`import { tokenize } from '@vortexlabs/kirari'
import { renderDecorated } from '@vortexlabs/kirari/decorations'

const source = 'const answer = 42\nconsole.log(answer)'
const html = renderDecorated(tokenize(source), {
  decorations: [
    { start: 6, end: 12, className: 'kirari-inserted' },
  ],
  lines: true,
})`)}
      <p>Output: the first <code>answer</code> gets the inserted color; syntax colors stay.</p><div class="code-block"><div class="code-meta"><span>Output</span></div><pre class="kirari"><code id="decorations-preview">${decorated}</code></pre></div><ul><li>Ranges: UTF-16 offsets, <code>start</code> inclusive, <code>end</code> exclusive. Overlaps combine classes.</li><li><code>lines: true</code> wraps each line in <code>.kirari-line</code> with a 1-based <code>data-line</code>. Line endings stay outside.</li><li><code>lineClassName({ number, start, end })</code> adds a class per line.</li></ul><p class="small-note">Pass tokens that cover the whole source. Ranges must be nonempty, in bounds, and not split a surrogate pair. A range edge inside a CRLF needs <code>lines: true</code>. Output is escaped.</p>
    </section>

    <section id="streaming" class="doc-section">${heading('streaming')}<p class="lede">${lede('streaming')}</p><p><code>createTokenStream(language)</code> takes chunks and returns patches. New input can change earlier tokens, so each patch replaces everything after an offset.</p>${codeBlock('streaming-example', String.raw`import { render } from '@vortexlabs/kirari/core'
import { createTokenStream } from '@vortexlabs/kirari/stream'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import type { Token } from '@vortexlabs/kirari/core'
import type { TokenPatch } from '@vortexlabs/kirari/stream'

const stream = createTokenStream(javascript)
const tokens: Token[] = []

const apply = (patch: TokenPatch) => {
  while (tokens.length && tokens[tokens.length - 1]!.start >= patch.from) {
    tokens.pop()
  }
  for (const token of patch.tokens) tokens.push(token)
}

apply(stream.write('const ans'))
apply(stream.write('wer = 42;\n'))
apply(stream.end())
const html = render(tokens)

stream.reset()
tokens.length = 0 // Clear consumer state before starting another source.` , typescript, 'TypeScript')}
      <ul><li><code>patch.from</code>: source offset (UTF-16), not a token index. Drop tokens from there; append <code>patch.tokens</code> (already globally offset).</li><li><code>patch.length</code>: total source length so far.</li><li><code>write(chunk)</code> returns a patch. <code>end(chunk?)</code> closes the stream; writes then throw until <code>reset()</code>.</li><li><code>reset()</code> doesn’t clear your tokens or output. Do that yourself.</li></ul><p>For live output, render only <code>patch.tokens</code> and replace that tail of your view. Re-rendering every token on each write repeats work.</p><div class="notice"><strong>Know the streaming limits</strong><p>Only the unmodified built-in JavaScript, TypeScript, and JSON use <code>'checkpoint'</code> mode (<code>stream.mode</code>), which rescans less. Everything else, including copies or extensions of those, uses <code>'full'</code>: every write retokenizes all source so far.</p><p>Even in checkpoint mode, a long line or unclosed multiline token can trigger repeated rescans. Both modes keep the full source in memory. Don’t mutate built-in definitions; copy them.</p></div>
    </section>

    <section id="markdown" class="doc-section">${heading('markdown')}<p class="lede">${lede('markdown')}</p><p>Build a registry from the languages you import, then pass it to <code>createMarkdown</code> to highlight fence bodies. The registry resolves names, aliases, and filenames.</p>${codeBlock('markdown-example', "import { tokenize, render } from '@vortexlabs/kirari/core'\nimport { createRegistry } from '@vortexlabs/kirari/registry'\nimport { createMarkdown } from '@vortexlabs/kirari/markdown'\nimport { javascript } from '@vortexlabs/kirari/languages/javascript'\nimport { json } from '@vortexlabs/kirari/languages/json'\n\nconst registry = createRegistry([javascript, json])\nregistry.resolve(' JS ')       // javascript\nregistry.resolve('data.json')  // json\nregistry.resolve('app.tsx')    // undefined\n\nconst markdown = createMarkdown(registry)\nconst source = '# Example\\n```js\\nconst answer = 42\\n```'\nconst html = render(tokenize(source, markdown))")}
      ${codeBlock('markdown-preview', '# Example\n```js\nconst answer = 42\n```\n\n```json\n{"ready": true}\n```', fencedMarkdown, 'Markdown output')}<p>The first word after the fence picks the language. Backtick and tilde fences work, even unclosed. Offsets point into the full Markdown source. Unlabeled or unregistered fences stay plain. Fences nested inside a <code>\`\`\`markdown</code> fence aren’t highlighted.</p><p class="small-note">The registry never loads grammars or guesses from content. JSX, TSX, JSONC, XML, Vue, and Svelte need their own definitions. Names beat aliases; duplicate names throw. The plain <code>languages/markdown</code> definition doesn’t highlight fences.</p>
    </section>

    <section id="rehype" class="doc-section">${heading('rehype')}<p class="lede">${lede('rehype')}</p><p><code>@vortexlabs/kirari-rehype</code> highlights code blocks in Markdown and MDX at build time. The browser gets plain HTML and CSS, no highlighter.</p><p>Different from <a href="#markdown">Markdown fences</a>: that highlights Markdown <em>source</em>. This plugin highlights code blocks in the rendered document.</p>
      ${codeBlock('rehype-install', 'npm install @vortexlabs/kirari @vortexlabs/kirari-rehype', shell, 'Terminal')}
      ${codeBlock('rehype-example', String.raw`import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeKirari from '@vortexlabs/kirari-rehype'
import { javascript } from '@vortexlabs/kirari/languages/javascript'

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeKirari, { languages: [javascript] })
  .use(rehypeStringify)

const html = String(await processor.process(markdown))`)}
      <p>Pass the languages you need; labels like <code>js</code> resolve via the registry. Nothing is auto-loaded or detected. Skipped: unknown or unlabeled blocks, inline code, and code that already has child elements.</p><h3>Use it with MDX</h3>${codeBlock('mdx-example', String.raw`import { compile } from '@mdx-js/mdx'
import rehypeKirari from '@vortexlabs/kirari-rehype'
import { javascript } from '@vortexlabs/kirari/languages/javascript'

const compiled = await compile(markdown, {
  rehypePlugins: [[rehypeKirari, { languages: [javascript] }]],
})`)}
      <p>Import <code>@vortexlabs/kirari/theme.css</code> once. Blocks get <code>pre.kirari</code> and the usual <code>.kirari-*</code> classes and variables. Custom MDX code components must forward props and children.</p><h3>Point readers to a line</h3><p>A fence such as <code>\`\`\`js {2,4-6}</code> adds <code>.kirari-line-highlighted</code> to lines 2 and 4–6. Style it yourself:</p>${codeBlock('rehype-line-style', '.kirari-line-highlighted {\n  background: var(--kirari-line-background, #7452bd18);\n}', css, 'CSS')}
      <p>Other options: <code>lines: true</code> wraps lines without metadata; <code>lineClassName({ number, start, end })</code> (1-based, UTF-16 offsets within the block); <code>classes</code> and <code>className(token)</code> as in <a href="#rendering">core</a>. Full type: <code>Options</code>.</p><p class="small-note">Order: after <code>remark-rehype</code>, before stringify. With <code>rehype-sanitize</code>, sanitize first and keep language classes. Don’t run a second highlighter on the same blocks. Invalid line metadata, and braces inside quoted meta values, are ignored.</p>
    </section>

    <section id="react" class="doc-section">${heading('react')}<p class="lede">${lede('react')}</p><p><code>&lt;Code&gt;</code> renders tokens as React elements. No <code>dangerouslySetInnerHTML</code>, no hooks, so it works as a Server Component. Requires React 19.</p>
      ${codeBlock('react-install', 'npm install @vortexlabs/kirari @vortexlabs/kirari-react', shell, 'Terminal')}
      ${codeBlock('react-example', String.raw`import { Code } from '@vortexlabs/kirari-react'
import { typescript } from '@vortexlabs/kirari/languages/typescript'
import '@vortexlabs/kirari/theme.css'

export const Example = () => (
  <Code language={typescript} highlightLines={[1, [3, 4]]}>
    {source}
  </Code>
)`, tsx, 'TSX')}
      <p>Output: <code>pre.kirari</code> with the usual <code>.kirari-*</code> classes. Extra props go to the <code>&lt;pre&gt;</code>.</p><ul><li><code>lines</code>: wrap lines in <code>.kirari-line</code> with <code>data-line</code>.</li><li><code>highlightLines</code>: lines or <code>[first, last]</code> ranges get <code>.kirari-line-highlighted</code>.</li><li><code>lineClassName</code>, <code>decorations</code>, <code>classes</code>, <code>tokenClassName</code>: as in <a href="#decorations">decorations</a>.</li></ul>
      <h3>Stream a response</h3>${codeBlock('react-stream', String.raw`'use client'
import { Code } from '@vortexlabs/kirari-react'
import { useTokenStream } from '@vortexlabs/kirari-react/stream'
import { javascript } from '@vortexlabs/kirari/languages/javascript'

export const StreamedCode = () => {
  const { tokens, write, end } = useTokenStream(javascript)
  // call write(chunk) as text arrives, then end()
  return <Code tokens={tokens} />
}`, tsx, 'TSX')}
      <p><code>useTokenStream</code> returns <code>{ tokens, write, end, reset }</code> and rescans only the unfinished tail. It is client-only; <code>&lt;Code&gt;</code> is not.</p>
    </section>

    <section id="grammars" class="doc-section">${heading('grammars')}<p class="lede">${lede('grammars')}</p><p>Copy a definition and put your rules first. Each rule matches at the current source position; earlier rules win.</p>${codeBlock('grammar-example', "import { javascript } from '@vortexlabs/kirari/languages/javascript'\nimport type { Language } from '@vortexlabs/kirari'\n\nconst projectJavaScript: Language = {\n  ...javascript,\n  rules: [\n    { type: 'constant', pattern: /\\bAPI_KEY\\b/ },\n    ...javascript.rules,\n  ],\n}")}
      ${codeBlock('grammar-style', '.kirari-constant {\n  color: var(--kirari-constant, #99631b);\n}', css, 'CSS')}<p>Definitions can specify keywords, types, identifier patterns, and rules. An optional <code>tokenize(source, language)</code> callback can replace the scanner for structural syntax. Return complete tokens with contiguous source offsets.</p><p class="small-note">Templates, regex literals, and structural scanners can handle syntax before ordinary rules. Rules do not override every construct in JSX, Vue, Svelte, HTML, CSS, or YAML. Definitions and callbacks are trusted application code.</p>
    </section>

    <section id="api" class="doc-section">${heading('api')}<p class="lede">${lede('api')}</p><p>A small API for the straightforward case, with optional entry points when you need more.</p><div class="api-list"><article><h3><code>highlight(source, options?)</code></h3><p>Returns an escaped HTML fragment. Options accept a <code>language</code> definition, a token-to-class <code>classes</code> map, and a <code>className(token)</code> callback. JavaScript is the default.</p></article><article><h3><code>tokenize(source, language?)</code></h3><p>Returns <code>Token[]</code> with <code>type</code>, <code>value</code>, <code>start</code>, and <code>end</code>. The main <code>@vortexlabs/kirari</code> entry defaults to JavaScript; <code>@vortexlabs/kirari/core</code> requires an explicit language.</p></article><article><h3><code>render(tokens, options?)</code></h3><p>Returns escaped HTML from readonly tokens. Custom classes append to Kirari’s standard classes. Rendering does not mutate tokens.</p></article></div><div class="table-scroll"><table><caption>Package entry points</caption><thead><tr><th>Import</th><th>What you get</th></tr></thead><tbody><tr><td><code>@vortexlabs/kirari</code></td><td>All three core functions, with JavaScript defaults</td></tr><tr><td><code>@vortexlabs/kirari/core</code></td><td>tokenize, render, token types; no default language</td></tr><tr><td><code>@vortexlabs/kirari/stream</code></td><td><a href="#streaming">createTokenStream</a>, TokenStream, TokenPatch</td></tr><tr><td><code>@vortexlabs/kirari/decorations</code></td><td><a href="#decorations">renderDecorated</a>, Decoration, DecoratedRenderOptions</td></tr><tr><td><code>@vortexlabs/kirari/registry</code></td><td><a href="#markdown">createRegistry</a>, LanguageRegistry</td></tr><tr><td><code>@vortexlabs/kirari/markdown</code></td><td><a href="#markdown">createMarkdown(registry)</a></td></tr><tr><td><code>@vortexlabs/kirari/languages/*</code></td><td>One named language definition</td></tr><tr><td><code>@vortexlabs/kirari/theme.css</code></td><td>Optional theme, driven by CSS variables</td></tr><tr><td><code>@vortexlabs/kirari-rehype</code></td><td><a href="#rehype">Optional Markdown and MDX plugin</a>, Options</td></tr></tbody></table></div><p class="small-note">Core TypeScript types include <code>Token</code>, <code>TokenType</code>, <code>Language</code>, <code>Rule</code>, <code>RenderOptions</code>, and <code>HighlightOptions</code>. Import optional APIs and their types from their own entry points.</p>
    </section>

    <section id="limitations" class="doc-section">${heading('limitations')}<p class="lede">${lede('limitations')}</p><p>Kirari highlights syntax. It doesn’t validate programs, resolve bindings, or infer types. Incomplete code is preserved, even when its classification is approximate.</p><div class="limits-list"><details><summary>Language coverage</summary><p>Context-sensitive syntax uses heuristics. Most non-JavaScript interpolation remains inside string tokens. Markdown fences are opaque by default; <a href="#markdown"><code>createMarkdown</code></a> enables registered fence languages. SQL dialect extensions and shell heredocs are not fully parsed. TSX type arguments on JSX tags are not parsed.</p><p>Vue <code>v-pre</code> and expressions inside quoted Svelte attributes are not parsed. Unknown script/style preprocessors remain plain text. Advanced reader forms, custom string macros, and configuration dialects can receive approximate categories.</p></details><details><summary>Runtime and security</summary><p>Modern ESM runtimes with ES2022 features are required. The library has no DOM, Node, or Bun runtime imports. Source and class attributes are escaped. Custom regex rules and callbacks are trusted code; arbitrary user-supplied grammars are not sandboxed.</p></details><details><summary>Bundle measurements</summary><p>The JavaScript entry measures 2,879 bytes gzip; all 48 definitions together measure 18,650 bytes gzip. Measured with Bun 1.3.4 minification and gzip level 9, excluding CSS. These are library bundle sizes, not website sizes or throughput benchmarks.</p><p>To reproduce, run <code>bun run size</code> in the Kirari repository.</p></details></div>
    </section>
  </main>
</div>
${footer()}`
  return layout({ page: 'docs', title: 'Docs — Kirari', description: 'Install Kirari, choose languages, theme tokens with CSS variables, and use streaming, decorations, and Rehype.', path: routes.docs, body })
}
