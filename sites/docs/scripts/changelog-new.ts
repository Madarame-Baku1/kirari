import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isPackageId, packages } from '@/changelog'
import { releaseTemplate } from '@/changelog.content'

const usage = 'Usage: bun run changelog:new [package] [version]'
const [id, explicitVersion] = process.argv.slice(2)

if (id !== undefined && !isPackageId(id)) {
	console.error(`Unknown package "${id}". Use one of: ${packages.map(item => item.id).join(', ')}.\n${usage}`)
	process.exit(1)
}
if (explicitVersion !== undefined && !/^\d+\.\d+\.\d+$/.test(explicitVersion)) {
	console.error(`"${explicitVersion}" is not a full version such as 1.2.3.\n${usage}`)
	process.exit(1)
}

/** Versions the pending changesets will release, by package id. */
const pendingVersions = async () => {
	const directory = await mkdtemp(join(tmpdir(), 'kirari-changelog-'))
	const output = join(directory, 'status.json')
	try {
		const status = Bun.spawnSync(['bunx', 'changeset', 'status', `--output=${output}`], {
			cwd: join(process.cwd(), '..', '..'),
			stderr: 'pipe',
		})
		if (!status.success) throw new Error(status.stderr.toString().trim() || 'changeset status failed')
		const { releases } = JSON.parse(await readFile(output, 'utf8')) as {
			releases: { name: string; newVersion: string }[]
		}
		return new Map(
			releases.flatMap(release => {
				const item = packages.find(entry => entry.name === release.name)
				return item ? [[item.id, release.newVersion] as const] : []
			}),
		)
	} finally {
		await rm(directory, { recursive: true, force: true })
	}
}

const pending = explicitVersion ? new Map() : await pendingVersions()
const targets = id
	? [[id, explicitVersion ?? pending.get(id)] as const]
	: [...pending.entries()]

if (!targets.length) {
	console.error(`No pending changesets. Run \`bun run changeset\` first, or name a package and version.\n${usage}`)
	process.exit(1)
}

const date = new Date().toLocaleDateString('en-CA')
let failed = false
for (const [target, version] of targets) {
	if (!version) {
		console.error(`No pending changeset for ${target}. Run \`bun run changeset\` first, or pass a version: bun run changelog:new ${target} 1.2.3`)
		failed = true
		continue
	}
	const file = join('changelog', target, `${version}.md`)
	await mkdir(join('changelog', target), { recursive: true })
	try {
		await writeFile(file, releaseTemplate(target, version, date), { flag: 'wx' })
		console.log(`Created sites/docs/${file}`)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
		console.error(`sites/docs/${file} already exists; edit it instead.`)
		failed = true
	}
}
process.exit(failed ? 1 : 0)
