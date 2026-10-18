# Releasing

`@vortexlabs/kirari`, `@vortexlabs/kirari-rehype`, and `@vortexlabs/kirari-react` ship to npm as public packages under the `@vortexlabs` scope. The workspace root, the docs site, and the benchmarks are private and never publish.

Versioning is driven by [Changesets](https://github.com/changesets/changesets). The three packages are a fixed group, so they always share one version, and the integrations' `peerDependencies` ranges follow Kirari when it moves out of range.

## Release

```bash
bunx changeset                                        # pick the bump (patch/minor/major) and write the note
git add .changeset && git commit -m "chore: add changeset"  # required — the release script needs a clean tree
bun run release:kirari
bun run release:kirari-rehype
bun run release:kirari-react
```

Each command uses the same `bin/release.sh` with a package filter. For example,
`bun run release:kirari-react` publishes only React, without attempting Rehype.
The filter selects what is published; pending Changesets still version the entire
fixed group together. Publish core first when the integrations require a new core
version. Subsequent commands use the versions already prepared by the first command.

There is no all-packages release command. The shared script requires `--filter`:

1. Aborts if the working tree is dirty.
2. Shows the pending version bump (or the current versions when no changesets are pending) and prompts for confirmation.
3. Runs `bunx changeset version` when changesets are pending — updates versions and the peer range, and writes each package's `CHANGELOG.md`.
4. Synchronizes workspace versions in `bun.lock`, then refreshes it with `bun install --lockfile-only --ignore-scripts`.
5. Runs `bun run check`: typechecks, tests, builds, the docs site, and the packed-consumer install check. A failure stops before committing or publishing.
6. Commits `chore: release` if files changed and pushes.
7. Ensures npm auth (`npm login --auth-type=web` if needed).
8. Publishes the selected package with `bun publish --access public`. The tarball is checked for unresolved `workspace:` references first. Afterwards, registry verification makes up to six fresh lookups, with a 10-second request timeout and five seconds between attempts. If publishing fails because an earlier lookup missed an existing version, the same verification must confirm it before continuing. If verification still fails, the last npm error is printed and the release stops.
9. Tags `<name>@<version>` for the selected package and pushes tags.

A failed release can be resumed by rerunning the same package-specific command: versions already committed are not bumped twice, and versions already on npm are skipped.

To retry only one package, rerun its individual release command. A version that
was previously published and then unpublished cannot be reused; it needs a new
Changeset version rather than another publish attempt. An overwrite rejection
alone is not treated as success: the version must be readable from the registry.

Run `bun run test:release` to test package selection, delayed registry visibility, release recovery, and failures without publishing or pushing. These tests also run in `bun run test` and `bun run check`.

To inspect the tarballs without publishing, run `bun run pack:preview`; archives land in `.packs/`.
