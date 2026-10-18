# Releasing

`@vortexlabs/kirari`, `@vortexlabs/kirari-rehype`, and `@vortexlabs/kirari-react` ship to npm as public packages under the `@vortexlabs` scope. The workspace root, the docs site, and the benchmarks are private and never publish.

Versioning is driven by [Changesets](https://github.com/changesets/changesets). The three packages are a fixed group, so they always share one version, and the integrations' `peerDependencies` ranges follow Kirari when it moves out of range.

## Release

```bash
bunx changeset                                        # pick the bump (patch/minor/major) and write the note
git add .changeset && git commit -m "chore: add changeset"  # required — the release script needs a clean tree
bun run release
```

`bun run release` runs `bin/release.sh`, which:

1. Aborts if the working tree is dirty.
2. Shows the pending version bump (or the current versions when no changesets are pending) and prompts for confirmation.
3. Runs `bunx changeset version` when changesets are pending — updates versions and the peer range, and writes each package's `CHANGELOG.md`.
4. Synchronizes workspace versions in `bun.lock`, then refreshes it with `bun install --lockfile-only --ignore-scripts`.
5. Runs `bun run check`: typechecks, tests, builds, the docs site, and the packed-consumer install check. A failure stops before committing or publishing.
6. Commits `chore: release` if files changed and pushes.
7. Ensures npm auth (`npm login --auth-type=web` if needed).
8. Publishes Kirari, then the Rehype and React integrations, with `bun publish --access public`. Each tarball is checked for unresolved `workspace:` references first. Afterwards, registry verification makes up to six fresh lookups, with a 10-second request timeout and five seconds between attempts. If verification still fails, the last npm error is printed and the release stops before the next package.
9. Tags `<name>@<version>` for each package and pushes tags.

A failed release can be resumed by running `bun run release` again: versions already committed are not bumped twice, and versions already on npm are skipped.

To inspect the tarballs without publishing, run `bun run pack:preview`; archives land in `.packs/`.
