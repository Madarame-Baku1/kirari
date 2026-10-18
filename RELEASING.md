# Releasing

`@vortexlabs/kirari`, `@vortexlabs/kirari-rehype`, and `@vortexlabs/kirari-react` ship to npm as public packages under the `@vortexlabs` scope. The workspace root, the docs site, and the benchmarks are private and never publish.

Versioning is driven by [Changesets](https://github.com/changesets/changesets). Each package is versioned independently. Select only the packages affected by a change when creating its changeset. For example, a React-only patch increments `@vortexlabs/kirari-react` without changing core or Rehype.

If a core update requires new integration peer ranges, the release script requires
explicit changesets for those integrations before changing any versions. It prints
the package names that need changesets, matching Vortex's release-plan validation.

## Release

```bash
bun run changeset                                     # select affected packages, bumps, and release note
git add .changeset && git commit -m "chore: add changeset"  # required — the release script needs a clean tree
bun run release:kirari-react                           # example: publish the React update
```

Each command uses the same `bin/release.sh` with a package filter. For example,
`bun run release:kirari-react` publishes only React, without attempting Rehype.
The filter selects what is published; Changesets applies all pending changesets
in the workspace, with each affected package receiving its own version and changelog.
Packages without a planned release keep their versions. When several packages have
changesets, run each affected package's release command. Publish core first when
the integrations require a new core version. Subsequent commands use the versions
already prepared by the first command.

There is no all-packages release command. The shared script requires `--filter`:

1. Aborts if the working tree is dirty.
2. Plans all pending releases and rejects automatic dependent bumps without an explicit changeset. Shows the version plan (or the selected package's current version when no changesets are pending) and prompts for confirmation.
3. Runs `bunx changeset version` when changesets are pending — updates affected versions and peer ranges, and writes the affected packages' `CHANGELOG.md` files.
4. Synchronizes workspace versions in `bun.lock`, then refreshes it with `bun install --lockfile-only --ignore-scripts`.
5. Runs `bun run check`: typechecks, tests, builds, the docs site, and the packed-consumer install check. A failure stops before committing or publishing.
6. Commits `chore: release` if files changed and pushes.
7. Ensures npm auth (`npm login --auth-type=web` if needed).
8. Publishes the selected package with `bun publish --access public`. The tarball is checked for unresolved `workspace:` references first. Afterwards, registry verification makes up to 31 fresh lookups, with a 10-second request timeout and 10 seconds between attempts: five minutes of retry waiting, plus request time. If publishing fails because an earlier lookup missed an existing version, the same verification must confirm it before continuing. If verification still fails, the last npm error is printed and the release stops without creating a tag.
9. Tags `<name>@<version>` for the selected package and pushes tags.

A failed release can be resumed by rerunning the same package-specific command: versions already committed are not bumped twice, and versions already on npm are skipped.

If npm reports that the package is being processed, an availability check can
still return 404 after a successful upload. A verification timeout leaves the
publication status unconfirmed. Use the `npm view` command printed by the script
to check later. Wait until the version is visible before rerunning the release
command to finish tagging; do not republish or bump the version while processing
is pending.

To retry only one package, rerun its individual release command. A version that
was previously published and then unpublished cannot be reused; it needs a new
Changeset version rather than another publish attempt. An overwrite rejection
alone is not treated as success: the version must be readable from the registry.

Run `bun run test:release` to test package selection, delayed registry visibility, release recovery, and failures without publishing or pushing. These tests also run in `bun run test` and `bun run check`.

To inspect the tarballs without publishing, run `bun run pack:preview`; archives land in `.packs/`.
