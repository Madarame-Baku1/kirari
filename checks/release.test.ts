import { expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const release = fileURLToPath(new URL('../bin/release.sh', import.meta.url))

// Run the real release script and tarball checks; replace remote writes and waiting.
const runRelease = async (options: {
  delay?: number
  existing?: string[]
  invisible?: string
  publishFailure?: string
  registryError?: string
  hiddenExisting?: string[]
} = {}) => {
  const directory = await mkdtemp(join(tmpdir(), 'kirari-release-'))
  try {
    await mkdir(join(directory, '.changeset'))
    const workspaces: Record<string, { name: string, version: string }> = {}
    for (const [id, name] of [['kirari', '@vortexlabs/kirari'], ['rehype', '@vortexlabs/kirari-rehype'], ['react', '@vortexlabs/kirari-react']] as const) {
      await mkdir(join(directory, 'packages', id), { recursive: true })
      const manifest = { name, version: '0.1.0' }
      workspaces[`packages/${id}`] = manifest
      await writeFile(join(directory, 'packages', id, 'package.json'), JSON.stringify(manifest))
    }
    await writeFile(join(directory, 'bun.lock'), JSON.stringify({ workspaces }, null, 2))
    await writeFile(join(directory, 'events'), '')
    for (const id of options.existing ?? []) await writeFile(join(directory, `${id}.visible`), '')
    for (const id of options.hiddenExisting ?? []) await writeFile(join(directory, `${id}.published`), '')
    const result = Bun.spawnSync(['bash', '-c', `
      git() {
        echo "git $*" >> "$RELEASE_FIXTURE/events"
        if [ "$1" = rev-parse ]; then return 1; fi
      }
      bun() {
        case "$1" in
          install|run) return 0 ;;
          pm) "$RELEASE_BUN" "$@" ;;
          publish)
            local id
            id=$(basename "$PWD")
            echo "publish $id" >> "$RELEASE_FIXTURE/events"
            if [ -f "$RELEASE_FIXTURE/$id.published" ]; then
              echo '403 Forbidden: You cannot publish over the previously published versions: 0.1.0.' >&2
              return 1
            fi
            if [ "$id" = "$PUBLISH_FAILURE" ]; then
              echo 'npm error E403 publish denied' >&2
              return 1
            fi
            touch "$RELEASE_FIXTURE/$id.published"
            ;;
          *) echo "Unexpected bun command: $*" >&2; return 1 ;;
        esac
      }
      npm() {
        if [ "$1" = whoami ]; then echo fixture-user; return 0; fi
        if [ "$1" != view ]; then echo "Unexpected npm command: $*" >&2; return 1; fi
        local id count=0
        case "$2" in
          @vortexlabs/kirari@0.1.0) id=kirari ;;
          @vortexlabs/kirari-rehype@0.1.0) id=rehype ;;
          @vortexlabs/kirari-react@0.1.0) id=react ;;
          *) echo "Unexpected package: $2" >&2; return 1 ;;
        esac
        echo "view $id $*" >> "$RELEASE_FIXTURE/events"
        if [ -f "$RELEASE_FIXTURE/$id.visible" ]; then echo 0.1.0; return 0; fi
        if [ -f "$RELEASE_FIXTURE/$id.published" ]; then
          if [ -f "$RELEASE_FIXTURE/$id.count" ]; then read -r count < "$RELEASE_FIXTURE/$id.count"; fi
          count=$((count + 1))
          echo "$count" > "$RELEASE_FIXTURE/$id.count"
          if [ "$id" != "$INVISIBLE" ] && [ "$count" -gt "$VISIBILITY_DELAY" ]; then
            touch "$RELEASE_FIXTURE/$id.visible"
            echo 0.1.0
            return 0
          fi
        fi
        echo "$REGISTRY_ERROR" >&2
        return 1
      }
      sleep() { echo "sleep $*" >> "$RELEASE_FIXTURE/events"; }
      source "$1"
    `, 'release-test', release], {
      cwd: directory,
      stdin: Buffer.from('y\n'),
      env: {
        ...process.env,
        RELEASE_FIXTURE: directory,
        RELEASE_BUN: process.execPath,
        VISIBILITY_DELAY: String(options.delay ?? 0),
        INVISIBLE: options.invisible ?? '',
        PUBLISH_FAILURE: options.publishFailure ?? '',
        REGISTRY_ERROR: options.registryError ?? 'npm error E404 package not found',
      },
      timeout: 10_000,
    })
    return {
      exitCode: result.exitCode,
      output: result.stdout.toString() + result.stderr.toString(),
      events: (await Bun.file(join(directory, 'events')).text()).trim().split('\n'),
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('release waits for registry visibility and publishes all three packages once in dependency order', async () => {
  const result = await runRelease({ delay: 2 })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish kirari', 'publish rehype', 'publish react'])
  expect(result.events.filter(event => event.startsWith('git tag '))).toEqual([
    'git tag @vortexlabs/kirari@0.1.0', 'git tag @vortexlabs/kirari-rehype@0.1.0', 'git tag @vortexlabs/kirari-react@0.1.0',
  ])
  expect(result.events.at(-1)).toBe('git push --tags')
  expect(result.events.filter(event => event.startsWith('view ')).every(event => event.includes('--prefer-online'))).toBe(true)
})

test('release resumes after core was already published', async () => {
  const result = await runRelease({ existing: ['kirari'] })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish rehype', 'publish react'])
})

test('release publishes React when core and Rehype are already on npm', async () => {
  const result = await runRelease({ existing: ['kirari', 'rehype'], delay: 2 })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish react'])
  expect(result.events).toContain('git tag @vortexlabs/kirari-react@0.1.0')
  expect(result.events.at(-1)).toBe('git push --tags')
})

test('release accepts visibility on the final verification attempt', async () => {
  const result = await runRelease({ existing: ['kirari', 'rehype'], delay: 5 })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish react'])
})

test('release recovers when an existing version is missing from the initial registry lookup', async () => {
  const result = await runRelease({ existing: ['kirari'], hiddenExisting: ['rehype'], delay: 2 })
  expect(result.exitCode).toBe(0)
  expect(result.output).toContain('You cannot publish over the previously published versions')
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish rehype', 'publish react'])
  expect(result.events).toContain('git tag @vortexlabs/kirari-react@0.1.0')
})

test('a previously used but unavailable version is not tagged or treated as published', async () => {
  const result = await runRelease({ existing: ['kirari'], hiddenExisting: ['rehype'], invisible: 'rehype' })
  expect(result.exitCode).not.toBe(0)
  expect(result.output).toContain('You cannot publish over the previously published versions')
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish rehype'])
  expect(result.events).not.toContain('git tag @vortexlabs/kirari-rehype@0.1.0')
})

test('immediately visible releases do not wait', async () => {
  const result = await runRelease()
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('sleep '))).toEqual([])
})

test('failed publishing stops before the next package without retrying the publish', async () => {
  const result = await runRelease({ existing: ['kirari'], publishFailure: 'rehype' })
  expect(result.exitCode).not.toBe(0)
  expect(result.output).toContain('E403 publish denied')
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish rehype'])
  expect(result.events).not.toContain('git tag @vortexlabs/kirari-rehype@0.1.0')
  expect(result.events).not.toContain('git push --tags')
})

test.each(['npm error E404 package not found', 'npm error E503 registry unavailable'])(
  'unconfirmed publishing stops with the registry diagnostic: %s', async registryError => {
    const result = await runRelease({ invisible: 'kirari', registryError })
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain(registryError)
    expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish kirari'])
    expect(result.events.filter(event => event.startsWith('git tag '))).toEqual([])
    expect(result.events).not.toContain('git push --tags')
    const lookups = result.events.filter(event => event.startsWith('view '))
    expect(lookups.length).toBeGreaterThan(2)
    expect(lookups.length).toBeLessThanOrEqual(10)
  },
)
