import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

// Bun can retain old workspace versions when only package versions change.
// Update those metadata fields without re-resolving or reformatting dependencies.
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const original = readFileSync("bun.lock", "utf8");
let lockfile = original;

for (const entry of readdirSync("packages", { withFileTypes: true })) {
	const workspace = `packages/${entry.name}`;
	const manifestPath = `${workspace}/package.json`;
	if (!entry.isDirectory() || !existsSync(manifestPath)) continue;
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
	if (!manifest.version) continue;
	// Match Bun's workspace header only, not version strings in resolved packages.
	const header = new RegExp(
		`(^\\s*${escapeRegExp(JSON.stringify(workspace))}\\s*:\\s*\\{\\s*"name"\\s*:\\s*${escapeRegExp(JSON.stringify(manifest.name))}\\s*,\\s*"version"\\s*:\\s*)"[^"\\r\\n]*"`,
		"m",
	);
	if (!header.test(lockfile)) {
		throw new Error(`Cannot find the version for ${workspace} in bun.lock. Run bun install and retry.`);
	}
	lockfile = lockfile.replace(header, (_, prefix) => `${prefix}${JSON.stringify(manifest.version)}`);
}

if (lockfile !== original) writeFileSync("bun.lock", lockfile);
