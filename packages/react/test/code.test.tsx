import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { tokenize } from '@vortexlabs/kirari/core'
import { renderDecorated } from '@vortexlabs/kirari/decorations'
import type { DecoratedRenderOptions } from '@vortexlabs/kirari/decorations'
import { javascript } from '@vortexlabs/kirari/languages/javascript'
import { python } from '@vortexlabs/kirari/languages/python'
import { Code } from '../src/index.js'

// React and Kirari escape apostrophes with different but equivalent entities.
const inner = (html: string) => html.replace(/^<pre[^>]*><code>|<\/code><\/pre>$/g, '').replaceAll('&#x27;', '&#39;')

const source = 'const label = "<dock>"\r\nlet quote = \'it\'s\'\n// done\n'

test('matches the core string renderer for plain, line, and decorated output', () => {
  const tokens = tokenize(source, javascript)
  const cases: DecoratedRenderOptions[] = [
    {},
    { lines: true, lineClassName: line => line.number === 2 ? 'second' : undefined },
    { decorations: [{ start: 6, end: 20, className: 'match' }, { start: 10, end: 30, className: 'outer' }] },
    { lines: true, decorations: [{ start: 2, end: 40, className: 'span' }], classes: { keyword: 'kw' } },
  ]
  for (const options of cases) {
    const { className, ...props } = options
    const html = renderToStaticMarkup(<Code language={javascript} {...props} {...(className && { tokenClassName: className })}>{source}</Code>)
    expect(inner(html)).toBe(renderDecorated(tokens, options).replaceAll('&#x27;', '&#39;'))
  }
})

test('renders a pre and code container with escaped content', () => {
  const html = renderToStaticMarkup(<Code className="example" data-testid="block">{'a < b'}</Code>)
  expect(html).toBe('<pre data-testid="block" class="kirari example"><code><span class="kirari-variable">a</span> <span class="kirari-operator">&lt;</span> <span class="kirari-variable">b</span></code></pre>')
})

test('highlightLines wraps lines and marks single lines and ranges', () => {
  const html = renderToStaticMarkup(<Code language={python} highlightLines={[1, [3, 4]]}>{'a\nb\nc\nd\ne'}</Code>)
  const marked = [...html.matchAll(/class="kirari-line( kirari-line-highlighted)?" data-line="(\d)"/g)]
    .filter(match => match[1]).map(match => Number(match[2]))
  expect(marked).toEqual([1, 3, 4])
})

test('accepts pre-scanned tokens and rejects gaps', () => {
  const tokens = tokenize('x = 1', python)
  expect(renderToStaticMarkup(<Code tokens={tokens} />)).toContain('kirari-number')
  expect(() => renderToStaticMarkup(<Code tokens={tokens.slice(1)} />)).toThrow(RangeError)
})

test('rejects decorations outside the source', () => {
  expect(() => renderToStaticMarkup(<Code decorations={[{ start: 0, end: 99, className: 'x' }]}>{'x'}</Code>)).toThrow(RangeError)
})

test('empty source renders an empty block', () => {
  expect(renderToStaticMarkup(<Code />)).toBe('<pre class="kirari"><code></code></pre>')
})
