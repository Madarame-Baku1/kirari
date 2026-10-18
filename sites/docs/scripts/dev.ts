import { watch } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = fileURLToPath(new URL('..', import.meta.url))
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
let child: ReturnType<typeof Bun.spawn> | undefined

const build = async () => {
  child = Bun.spawn([process.execPath, 'scripts/build.ts'], {
    cwd: site,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const exitCode = await child.exited
  child = undefined
  if (exitCode !== 0) throw new Error(`Docs build exited with status ${exitCode}`)
}

await build()

const server = Bun.serve({
  hostname: 'localhost',
  port: Number(process.env.PORT ?? 4173),
  async fetch(request) {
    const path = new URL(request.url).pathname
    // Only the generated pages are served; directory paths without a trailing slash redirect.
    const routes: Record<string, string> = { '/': 'index.html', '/docs/': 'docs/index.html', '/playground/': 'playground/index.html' }
    if (routes[`${path}/`]) return Response.redirect(`${path}/`, 301)
    const file = routes[path.replace(/index\.html$/, '')]
    return file
      ? new Response(Bun.file(join(dist, file)), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
      : new Response('Not found', { status: 404 })
  },
})

let pending = false
let rebuilding = false
let closed = false
let timer: ReturnType<typeof setTimeout> | undefined

const rebuild = async () => {
  pending = true
  if (rebuilding || closed) return
  rebuilding = true
  try {
    while (pending && !closed) {
      pending = false
      try {
        await build()
        console.log('Docs rebuilt. Refresh the browser to see changes.')
      } catch (error) {
        console.error(error)
      }
    }
  } finally {
    rebuilding = false
  }
}

const watchers = [
  fileURLToPath(new URL('../src', import.meta.url)),
  dirname(fileURLToPath(import.meta.resolve('@vortexlabs/kirari'))),
  dirname(fileURLToPath(import.meta.resolve('@vortexlabs/kirari/theme.css'))),
].map(path => {
  const watcher = watch(path, { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => void rebuild(), 100)
  })
  watcher.on('error', error => console.error(`Watcher failed for ${path}:`, error))
  return watcher
})

const shutdown = () => {
  closed = true
  clearTimeout(timer)
  for (const watcher of watchers) watcher.close()
  child?.kill()
  void server.stop(true)
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
console.log(`Site available at ${server.url} (docs: ${server.url}docs/, playground: ${server.url}playground/)`)
