import { expect, test } from 'bun:test'

test.each([
  ['development', '', '', '', 'http://localhost:4173'],
  ['development', '4321', '', '', 'http://localhost:4321'],
  ['production', '', 'preview', 'kirari-preview.vercel.app', 'https://kirari-preview.vercel.app'],
  ['production', '', 'production', 'kirari-release.vercel.app', 'https://kirari.sh'],
  ['production', '', '', '', 'https://kirari.sh'],
])('social images use the serving environment: %s %s %s %s', (mode, port, vercelEnv, vercelUrl, origin) => {
  const result = Bun.spawnSync([process.execPath, '--eval', `
    import { pageMetadata } from './src/lib/seo.ts'
    console.log(JSON.stringify(pageMetadata('React', 'React integration', '/docs/react/')))
  `], {
    cwd: new URL('..', import.meta.url).pathname,
    env: { ...process.env, NODE_ENV: mode, PORT: port, VERCEL_ENV: vercelEnv, VERCEL_URL: vercelUrl },
  })
  expect(result.exitCode).toBe(0)
  const metadata = JSON.parse(result.stdout.toString())
  expect(metadata.openGraph.images[0].url).toBe(`${origin}/opengraph-image/`)
  expect(metadata.twitter.images).toEqual([`${origin}/opengraph-image/`])
  expect(metadata.alternates.canonical).toBe('/docs/react/')
})
