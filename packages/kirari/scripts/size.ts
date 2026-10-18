import { gzipSync } from 'node:zlib'

const entries = {
  core: '../test/fixtures/core.ts',
  javascript: '../src/index.ts',
  'all languages': '../test/fixtures/all-languages.ts',
}

console.log('Browser ESM bundles; bytes; gzip level 9; CSS excluded.')
for (const [name, path] of Object.entries(entries)) {
  const result = await Bun.build({
    entrypoints: [new URL(path, import.meta.url).pathname],
    target: 'browser',
    format: 'esm',
    minify: true,
  })
  if (!result.success) throw new AggregateError(result.logs, `Build failed: ${name}`)
  const output = result.outputs[0]
  if (!output) throw new Error(`No output: ${name}`)
  const bytes = new Uint8Array(await output.arrayBuffer())
  const check = Bun.spawnSync(['node', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const module = await import(process.argv[1]);
    const api = module.core ?? module;
    assert.equal(api.render(api.tokenize('<&>', { name: 'plain', rules: [] })), '&lt;&amp;&gt;');
    for (const language of Object.values(module.languages ?? {})) {
      const source = '<div>{value}</div> /* unfinished';
      assert.equal(api.tokenize(source, language).map(t => t.value).join(''), source);
    }
  `, `data:text/javascript;base64,${Buffer.from(bytes).toString('base64')}`])
  if (check.exitCode !== 0) {
    throw new Error(`Invalid bundle: ${name}`)
  }
  console.log(`${name}: ${bytes.byteLength} minified, ${gzipSync(bytes, { level: 9 }).byteLength} gzip`)
}
