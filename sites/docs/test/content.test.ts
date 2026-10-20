import { expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { readMarkdown, renderMarkdown } from '@/content'
import { docsPath, sections } from '@/navigation'
import { indexablePaths, serializeJsonLd } from '@/seo'
import { site } from '@/site'
import { GET as markdown } from '@/app/markdown/[slug]/route'
import { GET as llmsIndex } from '@/app/llms.txt/route'
import { GET as llmsFull } from '@/app/llms-full.txt/route'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownContent } from '@/features/docs/MarkdownContent'
import { DocsNavigation } from '@/components/layout/DocsNavigation'
import { ClipboardProvider } from '@/components/ui/ClipboardProvider'

const renderGuide = async (id: typeof sections[number]['id'] = 'overview') => renderToStaticMarkup(createElement(ClipboardProvider, null, await MarkdownContent({ id, title: sections.find(section => section.id === id)!.title, source: await readMarkdown(id) })))

const parser = unified().use(remarkParse).use(remarkGfm)

test('every guide has exactly one plain Markdown source file', async () => {
  expect((await readdir('content')).sort()).toEqual(sections.map(section => `${section.id}.md`).sort())
})

for (const section of sections) {
  test(`${section.id}: readable Markdown, rendered HTML, and downloadable source agree`, async () => {
    const source = await readMarkdown(section.id)
    const tree = parser.parse(source)
    expect(tree.children.filter((node: { type: string; depth?: number }) => node.type === 'heading' && node.depth === 1)).toHaveLength(1)
    expect(tree.children.some((node: { type: string }) => node.type === 'html')).toBe(false)
    const html = await renderGuide(section.id)
    expect(html.match(/<h1>/g)).toHaveLength(1)
    const heading = renderToStaticMarkup(createElement('h1', null, source.match(/^# (.+)$/m)![1]!)).replace('</h1>', '')
    expect(html).toContain(`${heading}<button`)
    expect(html).toContain(`data-anchor="${section.id}"`)
    expect(html).not.toContain('__KIRARI_')
    for (const match of source.matchAll(/\]\((\/[^)]+)\)/g)) {
      const path = new URL(match[1]!, site.url).pathname
      expect(indexablePaths).toContain(path)
    }
    const response = await markdown(new Request(`${site.url}/docs/${section.id}.md`), { params: Promise.resolve({ slug: section.id }) })
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('link')).toContain(`${site.url}${docsPath(section.id)}`)
    expect(await response.text()).toBe(source)
  })
}

test('introduction and installation share one page and sidebar entry', async () => {
  const html = await renderGuide()
  expect(html).toContain('<h1>Introduction<button')
  expect(html).toContain('<h2 id="installation">Installation</h2>')
  expect(html).toContain('class="intro-cards"')
  expect(html).toMatch(/href="\/docs\/?#installation"/)
  const sidebar = renderToStaticMarkup(createElement(DocsNavigation, { active: 'overview' }))
  const introduction = sidebar.match(/<a [^>]*>Introduction<\/a>/)?.[0]
  expect(introduction).toMatch(/href="\/docs\/?"/)
  expect(introduction).toContain('aria-current="page"')
  expect(sidebar).not.toContain('Installation')
  expect(sidebar).not.toContain('installation')
})

test('unknown Markdown routes do not read arbitrary files', async () => {
  for (const slug of ['missing', '../../package.json']) {
    const response = await markdown(new Request(site.url), { params: Promise.resolve({ slug }) })
    expect(response.status).toBe(404)
  }
})

test('LLM index and full text cover the same complete set of guides', async () => {
  const index = await llmsIndex().text()
  const full = await (await llmsFull()).text()
  for (const section of sections) {
    expect(index).toContain(`${site.url}/docs/${section.id}.md`)
    expect(full).toContain(await readMarkdown(section.id))
  }
})

test('code examples preserve indentation and escape markup while using Kirari', async () => {
  const source = await readMarkdown('react')
  expect(source).toContain('  <Code language={typescript}')
  const html = await renderMarkdown('react')
  expect(html).toContain('kirari-')
  expect(html).toContain('&#x3C;')
  expect(html).not.toContain('<Code language=')
})

test('JSON-LD cannot close its script element', () => {
  const value = { name: '</script><script>alert(1)</script>' }
  const serialized = serializeJsonLd(value)
  expect(serialized).not.toContain('<')
  expect(JSON.parse(serialized)).toEqual(value)
})
