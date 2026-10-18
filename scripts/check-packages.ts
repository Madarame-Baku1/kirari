import { strict as assert } from 'node:assert'
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const temporary = await realpath(await mkdtemp(join(tmpdir(), 'kirari-consumer-')))
const consumer = join(temporary, 'app')
const env = { ...process.env, TMPDIR: join(temporary, 'tmp'), BUN_INSTALL_CACHE_DIR: join(temporary, 'cache') }

const run = (command: string[], cwd: string): string => {
  const result = Bun.spawnSync(command, { cwd, env })
  if (result.exitCode !== 0) {
    throw new Error(`${command.join(' ')} failed:\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout.toString()
}

const pack = (directory: string, filename: string): string => {
  const archive = join(temporary, filename)
  run(['bun', 'pm', 'pack', '--ignore-scripts', '--filename', archive], directory)
  return `file:${archive}`
}

try {
  for (const directory of [consumer, env.TMPDIR, env.BUN_INSTALL_CACHE_DIR]) await mkdir(directory)
  const kirari = pack(join(root, 'packages/kirari'), 'kirari.tgz')
  const rehype = pack(join(root, 'packages/rehype'), 'rehype.tgz')
  const react = pack(join(root, 'packages/react'), 'kirari-react.tgz')
  const require = createRequire(join(root, 'packages/rehype/package.json'))
  const hastPath = require.resolve('@types/hast/package.json')
  const unistPath = createRequire(hastPath).resolve('@types/unist/package.json')
  const requireReact = createRequire(join(root, 'packages/react/package.json'))
  const reactPaths = Object.fromEntries(['react', 'react-dom', '@types/react', '@types/react-dom']
    .map(name => [name, requireReact.resolve(`${name}/package.json`)]))
  const schedulerPath = createRequire(reactPaths['react-dom']!).resolve('scheduler/package.json')
  const csstypePath = createRequire(reactPaths['@types/react']!).resolve('csstype/package.json')
  const reactArchives = Object.fromEntries(Object.entries(reactPaths)
    .map(([name, path]) => [name, pack(dirname(path), `npm-${name.replace('/', '-')}.tgz`)]))
  const overrides = {
    // Keep the peer on the freshly packed archive instead of a registry version.
    '@vortexlabs/kirari': kirari,
    // Resolve declared type dependencies from local archives for an offline installation check.
    '@types/hast': pack(dirname(hastPath), 'hast.tgz'),
    '@types/unist': pack(dirname(unistPath), 'unist.tgz'),
    ...reactArchives,
    'scheduler': pack(dirname(schedulerPath), 'scheduler.tgz'),
    'csstype': pack(dirname(csstypePath), 'csstype.tgz'),
  }
  await writeFile(join(consumer, 'package.json'), JSON.stringify({
    private: true, type: 'module',
    dependencies: {
      '@vortexlabs/kirari': kirari, '@vortexlabs/kirari-rehype': rehype, '@vortexlabs/kirari-react': react, ...reactArchives,
    },
    overrides,
  }))
  run(['bun', 'install', '--ignore-scripts'], consumer)
  for (const name of ['@vortexlabs/kirari', '@vortexlabs/kirari-rehype', '@vortexlabs/kirari-react']) {
    const path = join(consumer, 'node_modules', name)
    assert.ok((await realpath(path)).startsWith(temporary + '/'), `${name} must be installed outside the source workspace`)
    const manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'))
    assert.ok(!JSON.stringify(manifest).includes('workspace:'), `${name} has unresolved workspace references`)
    assert.ok(!await readdir(join(path, 'src')).catch(() => undefined), `${name} should ship built files`)
  }
  const installed = JSON.parse(await readFile(join(consumer, 'node_modules/@vortexlabs/kirari-rehype/package.json'), 'utf8'))
  assert.ok(installed.dependencies['@types/hast'], 'Public declarations require HAST types')
  assert.ok(installed.peerDependencies['@vortexlabs/kirari'], 'The integration must use the host Kirari')
  const reactManifest = JSON.parse(await readFile(join(consumer, 'node_modules/@vortexlabs/kirari-react/package.json'), 'utf8'))
  for (const peer of ['@vortexlabs/kirari', 'react']) {
    assert.ok(reactManifest.peerDependencies[peer], `The React integration must use the host ${peer}`)
  }
  assert.ok(!reactManifest.dependencies, 'The React integration must not bundle its own dependencies')
  await writeFile(join(consumer, 'consumer.ts'), await readFile(join(root, 'checks/pack-consumer.ts')))
  await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'NodeNext', strict: true, types: [], outDir: 'dist' },
    include: ['consumer.ts'],
  }))
  run([join(root, 'node_modules/.bin/tsc'), '-p', 'tsconfig.json'], consumer)
  const names = (await readdir(join(root, 'packages/kirari/dist/languages')))
    .filter(name => name.endsWith('.js')).map(name => name.slice(0, -3))
  await writeFile(join(consumer, 'exports.mjs'), `
    import { readFile } from 'node:fs/promises';
    for (const name of ${JSON.stringify(names)}) {
      const module = await import('@vortexlabs/kirari/languages/' + name);
      if (module[name]?.name !== name) throw new Error('Missing language: ' + name);
    }
    const theme = await readFile(new URL(import.meta.resolve('@vortexlabs/kirari/theme.css')), 'utf8');
    if (!theme.includes('--kirari-variable')) throw new Error('Missing theme export');
    for (const name of ['github-dark', 'catppuccin-latte']) {
      const css = await readFile(new URL(import.meta.resolve('@vortexlabs/kirari/themes/' + name + '.css')), 'utf8');
      if (!css.includes('--kirari-keyword')) throw new Error('Missing theme: ' + name);
    }
  `)
  for (const runtime of ['node', 'bun']) {
    run([runtime, 'dist/consumer.js'], consumer)
    run([runtime, 'exports.mjs'], consumer)
  }
  console.log(`Packed packages installed outside workspace; TypeScript, Node, Bun, ${names.length} languages and CSS exports passed.`)
} finally {
  await rm(temporary, { recursive: true, force: true })
}
