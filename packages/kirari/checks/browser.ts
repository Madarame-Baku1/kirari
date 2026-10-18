const root = new URL('../', import.meta.url)
const bundle = await Bun.build({
  entrypoints: [new URL('checks/browser-entry.ts', root).pathname],
  target: 'browser',
  format: 'esm',
  minify: true,
})
if (!bundle.success || !bundle.outputs[0]) throw new Error('Browser bundle failed')
const bytes = await bundle.outputs[0].arrayBuffer()
const url = `data:text/javascript;base64,${Buffer.from(bytes).toString('base64')}`
const check = Bun.spawnSync(['node', '--input-type=module', '-e', `
  import assert from 'node:assert/strict';
  const { api } = await import(process.argv[1]);
  const stream = api.createTokenStream(api.streamJavaScript);
  assert.equal(stream.mode, 'checkpoint');
  assert.deepEqual(stream.end('const n = 1').tokens, api.core.tokenize('const n = 1'));
`, url])
if (check.exitCode !== 0) throw new Error(`Invalid browser module: ${check.stderr.toString()}`)
const template = await Bun.file(new URL('checks/browser.html', root)).text()
const css = await Bun.file(new URL('themes/default.css', root)).text()
const output = new URL('.checks/browser.html', root)
await Bun.write(output, template.replaceAll('__KIRARI_BUNDLE__', url).replace('__KIRARI_THEME__', css))
console.log(`Open ${output.href} and check the reported result.`)
