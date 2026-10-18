import { expect, test } from 'bun:test'
import { mkdtemp, mkdir, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const release = fileURLToPath(new URL('../bin/release.sh', import.meta.url))
const root = fileURLToPath(new URL('..', import.meta.url))
const packages = [['kirari', '@vortexlabs/kirari'], ['rehype', '@vortexlabs/kirari-rehype'], ['react', '@vortexlabs/kirari-react']] as const

// Run the real release script and tarball checks; replace remote writes and waiting.
const runRelease = async (options: {
  delay?: number
  existing?: string[]
  invisible?: string
  publishFailure?: string
  registryError?: string
  args?: string[]
  hiddenExisting?: string[]
  changes?: Record<string, 'patch' | 'minor' | 'major'>
} = {}) => {
  const directory = await mkdtemp(join(tmpdir(), 'kirari-release-'))
  try {
    await mkdir(join(directory, '.changeset'))
    await writeFile(join(directory, '.changeset/config.json'), await Bun.file(join(root, '.changeset/config.json')).text())
    await writeFile(join(directory, 'package.json'), JSON.stringify({ name: 'release-fixture', private: true, workspaces: ['packages/*'] }))
    await symlink(join(root, 'node_modules'), join(directory, 'node_modules'))
    for (const [name, bump] of Object.entries(options.changes ?? {})) {
      await writeFile(join(directory, '.changeset', `${name}.md`), `---\n"@vortexlabs/${name}": ${bump}\n---\n\nUpdate ${name}.\n`)
    }
    const workspaces: Record<string, { name: string, version: string }> = {}
    for (const [id, name] of packages) {
      await mkdir(join(directory, 'packages', id), { recursive: true })
      const manifest = { name, version: '0.1.0', ...(id === 'kirari' ? {} : { peerDependencies: { '@vortexlabs/kirari': '^0.1.0' } }) }
      workspaces[`packages/${id}`] = manifest
      await writeFile(join(directory, 'packages', id, 'package.json'), JSON.stringify(manifest))
    }
    await writeFile(join(directory, 'bun.lock'), JSON.stringify({ lockfileVersion: 1, configVersion: 1, workspaces: { '': { name: 'release-fixture' }, ...workspaces }, packages: {} }, null, 2))
    await writeFile(join(directory, 'events'), '')
    if (options.changes) {
      for (const args of [['init', '-b', 'main'], ['add', '.'], ['-c', 'user.name=Release Test', '-c', 'user.email=release@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'Initial fixture']]) {
        const result = Bun.spawnSync(['git', ...args], { cwd: directory })
        expect(result.exitCode, result.stderr.toString()).toBe(0)
      }
    }
    for (const id of options.existing ?? []) await writeFile(join(directory, `${id}.visible`), '')
    for (const id of options.hiddenExisting ?? []) await writeFile(join(directory, `${id}.published`), '')
    const result = Bun.spawnSync(['bash', '-c', `
      git() {
        echo "git $*" >> "$RELEASE_FIXTURE/events"
        if [ "$1" = rev-parse ]; then return 1; fi
      }
      bunx() {
        if [ "$1" != changeset ]; then echo "Unexpected bunx command: $*" >&2; return 1; fi
        shift
        echo "changeset $*" >> "$RELEASE_FIXTURE/events"
        node "$RELEASE_CHANGESETS" "$@"
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
          @vortexlabs/kirari@*) id=kirari ;;
          @vortexlabs/kirari-rehype@*) id=rehype ;;
          @vortexlabs/kirari-react@*) id=react ;;
          *) echo "Unexpected package: $2" >&2; return 1 ;;
        esac
        echo "view $id $*" >> "$RELEASE_FIXTURE/events"
        if [ -f "$RELEASE_FIXTURE/$id.visible" ]; then echo "\${2##*@}"; return 0; fi
        if [ -f "$RELEASE_FIXTURE/$id.published" ]; then
          if [ -f "$RELEASE_FIXTURE/$id.count" ]; then read -r count < "$RELEASE_FIXTURE/$id.count"; fi
          count=$((count + 1))
          echo "$count" > "$RELEASE_FIXTURE/$id.count"
          if [ "$id" != "$INVISIBLE" ] && [ "$count" -gt "$VISIBILITY_DELAY" ]; then
            touch "$RELEASE_FIXTURE/$id.visible"
            echo "\${2##*@}"
            return 0
          fi
        fi
        echo "$REGISTRY_ERROR" >&2
        return 1
      }
      sleep() { echo "sleep $*" >> "$RELEASE_FIXTURE/events"; }
      release_script="$1"
      shift
      source "$release_script" "$@"
    `, 'release-test', release, ...(options.args ?? ['--filter', 'react'])], {
      cwd: directory,
      stdin: Buffer.from('y\n'),
      env: {
        ...process.env,
        RELEASE_FIXTURE: directory,
        RELEASE_BUN: process.execPath,
        RELEASE_CHANGESETS: join(root, 'node_modules/.bin/changeset'),
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
      events: (await Bun.file(join(directory, 'events')).text()).trim().split('\n').filter(Boolean),
      versions: Object.fromEntries(await Promise.all(packages.map(async ([id]) => [id, (await Bun.file(join(directory, 'packages', id, 'package.json')).json()).version]))),
      changelogs: Object.fromEntries(await Promise.all(packages.map(async ([id]) => [id, await Bun.file(join(directory, 'packages', id, 'CHANGELOG.md')).exists()]))),
      remainingChangesets: (await readdir(join(directory, '.changeset'))).filter(name => name.endsWith('.md')),
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test.each([
  ['react', 'kirari-react', { kirari: '0.1.0', rehype: '0.1.0', react: '0.1.1' }],
  ['rehype', 'kirari-rehype', { kirari: '0.1.0', rehype: '0.1.1', react: '0.1.0' }],
  ['kirari', 'kirari', { kirari: '0.1.1', rehype: '0.1.0', react: '0.1.0' }],
] as const)('a %s patch changeset versions only that package', async (filter, name, versions) => {
  const result = await runRelease({ args: ['--filter', filter], changes: { [name]: 'patch' } })
  expect(result.exitCode, result.output).toBe(0)
  expect(result.versions).toEqual(versions)
  expect(result.changelogs).toEqual({ kirari: filter === 'kirari', rehype: filter === 'rehype', react: filter === 'react' })
  expect(result.remainingChangesets).toEqual([])
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual([`publish ${filter}`])
  expect(result.events).toContain(`git tag @vortexlabs/${name}@0.1.1`)
})

test('core changes requiring new peer ranges need explicit integration changesets before versioning', async () => {
  const result = await runRelease({ args: ['--filter', 'kirari'], changes: { kirari: 'minor' } })
  expect(result.exitCode).not.toBe(0)
  expect(result.output).toContain('explicit changeset')
  expect(result.output).toContain('@vortexlabs/kirari-react')
  expect(result.output).toContain('@vortexlabs/kirari-rehype')
  expect(result.versions).toEqual({ kirari: '0.1.0', rehype: '0.1.0', react: '0.1.0' })
  expect(result.remainingChangesets).toEqual(['kirari.md'])
  expect(result.events).not.toContain('changeset version')
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual([])
})

test('explicit integration changesets allow a core update while publishing only core', async () => {
  const result = await runRelease({ args: ['--filter', 'kirari'], changes: {
    kirari: 'minor', 'kirari-react': 'minor', 'kirari-rehype': 'minor',
  } })
  expect(result.exitCode, result.output).toBe(0)
  expect(result.versions.kirari).toBe('0.2.0')
  expect(result.changelogs).toEqual({ kirari: true, rehype: true, react: true })
  expect(result.remainingChangesets).toEqual([])
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish kirari'])
  expect(result.events).toContain('git tag @vortexlabs/kirari@0.2.0')
})

test('release waits for registry visibility and publishes the selected package only once', async () => {
  const result = await runRelease({ delay: 2 })
  expect(result.exitCode).toBe(0)
  expect(result.output.match(/Waiting for registry availability/g)).toHaveLength(1)
  expect(result.output).not.toContain('retrying in')
  expect(result.output).toContain('Published and available on npm: @vortexlabs/kirari-react@0.1.0')
  expect(result.output.indexOf('Waiting for registry availability')).toBeLessThan(result.output.indexOf('Published and available on npm:'))
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish react'])
  expect(result.events.filter(event => event.startsWith('git tag '))).toEqual(['git tag @vortexlabs/kirari-react@0.1.0'])
  expect(result.events.at(-1)).toBe('git push --tags')
  expect(result.events.filter(event => event.startsWith('view ')).every(event => event.includes('--prefer-online'))).toBe(true)
})

test('release skips publishing when the selected package version already exists', async () => {
  const result = await runRelease({ existing: ['react'] })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual([])
})

test('release publishes React when core and Rehype are already on npm', async () => {
  const result = await runRelease({ existing: ['kirari', 'rehype'], delay: 2 })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish react'])
  expect(result.events).toContain('git tag @vortexlabs/kirari-react@0.1.0')
  expect(result.events.at(-1)).toBe('git push --tags')
})

test('release waits through several minutes of npm processing without uploading again', async () => {
  const result = await runRelease({ delay: 18 })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish react'])
  const waited = result.events.filter(event => event.startsWith('sleep '))
    .reduce((seconds, event) => seconds + Number(event.split(' ')[1]), 0)
  expect(waited).toBeGreaterThanOrEqual(180)
  expect(result.events).toContain('git tag @vortexlabs/kirari-react@0.1.0')
})

test('release accepts visibility on the final verification attempt after twenty minutes of waiting', async () => {
  const result = await runRelease({ delay: 40 })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish react'])
  expect(result.events.filter(event => event === 'sleep 30')).toHaveLength(40)
  expect(result.output.match(/Still waiting for registry confirmation/g)).toHaveLength(9)
  expect(result.output).toContain('Published and available on npm: @vortexlabs/kirari-react@0.1.0')
})

test.each([
  ['kirari', '@vortexlabs/kirari'],
  ['rehype', '@vortexlabs/kirari-rehype'],
  ['react', '@vortexlabs/kirari-react'],
])('filtered release publishes and tags only %s', async (filter, name) => {
  const result = await runRelease({ args: ['--filter', filter!] })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual([`publish ${filter}`])
  expect(result.events.filter(event => event.startsWith('git tag '))).toEqual([`git tag ${name}@0.1.0`])
  expect(result.output).toContain(`Publish only: ${name}`)
})

test.each([['--filter'], ['--filter', 'unknown'], ['--filter', 'react', 'extra'], ['--unknown']])(
  'invalid release arguments stop before any side effects: %j', async (...args) => {
    const result = await runRelease({ args })
    expect(result.exitCode).not.toBe(0)
    expect(result.events).toEqual([])
  },
)

test('release without a package filter stops before any side effects', async () => {
  const result = await runRelease({ args: [] })
  expect(result.exitCode).not.toBe(0)
  expect(result.events).toEqual([])
})

test('React can publish independently of an unavailable Rehype release', async () => {
  const result = await runRelease({ args: ['--filter', 'react'], publishFailure: 'rehype', invisible: 'rehype' })
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish react'])
})

test('release recovers when an existing version is missing from the initial registry lookup', async () => {
  const result = await runRelease({ args: ['--filter', 'rehype'], hiddenExisting: ['rehype'], delay: 2 })
  expect(result.exitCode).toBe(0)
  expect(result.output).toContain('You cannot publish over the previously published versions')
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish rehype'])
  expect(result.events).toContain('git tag @vortexlabs/kirari-rehype@0.1.0')
})

test('a previously used but unavailable version is not tagged or treated as published', async () => {
  const result = await runRelease({ args: ['--filter', 'rehype'], hiddenExisting: ['rehype'], invisible: 'rehype' })
  expect(result.exitCode).not.toBe(0)
  expect(result.output).toContain('You cannot publish over the previously published versions')
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish rehype'])
  expect(result.events).not.toContain('git tag @vortexlabs/kirari-rehype@0.1.0')
})

test('immediately visible releases do not wait', async () => {
  const result = await runRelease()
  expect(result.exitCode).toBe(0)
  expect(result.events.filter(event => event.startsWith('sleep '))).toEqual([])
  expect(result.output).not.toContain('Waiting for registry availability')
  expect(result.output).toContain('Published and available on npm: @vortexlabs/kirari-react@0.1.0')
})

test('failed publishing stops without retrying the publish', async () => {
  const result = await runRelease({ args: ['--filter', 'rehype'], publishFailure: 'rehype' })
  expect(result.exitCode).not.toBe(0)
  expect(result.output).toContain('E403 publish denied')
  expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish rehype'])
  expect(result.events).not.toContain('git tag @vortexlabs/kirari-rehype@0.1.0')
  expect(result.events).not.toContain('git push --tags')
})

test.each(['npm error E404 package not found', 'npm error E503 registry unavailable'])(
  'unconfirmed publishing stops with the registry diagnostic: %s', async registryError => {
    const result = await runRelease({ args: ['--filter', 'kirari'], invisible: 'kirari', registryError })
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain(registryError)
    expect(result.output).not.toContain('Published and available on npm:')
    expect(result.events.filter(event => event.startsWith('publish '))).toEqual(['publish kirari'])
    expect(result.events.filter(event => event.startsWith('git tag '))).toEqual([])
    expect(result.events).not.toContain('git push --tags')
    const lookups = result.events.filter(event => event.startsWith('view '))
    expect(lookups.length).toBeGreaterThan(2)
    expect(lookups.length).toBe(42)
    const waited = result.events.filter(event => event.startsWith('sleep '))
      .reduce((seconds, event) => seconds + Number(event.split(' ')[1]), 0)
    expect(waited).toBe(1200)
    expect(result.output).toContain('may still be processing')
    expect(result.output).toContain('npm view @vortexlabs/kirari@0.1.0 version --prefer-online')
  },
)
