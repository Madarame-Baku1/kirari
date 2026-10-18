# Kirari

A Bun workspace for the Kirari syntax highlighter and its documentation site.
Published on npm as `@vortexlabs/kirari`, `@vortexlabs/kirari-rehype`, and `@vortexlabs/kirari-react`.
Documentation: <https://kirari.vortex.design>.

- [`packages/kirari`](packages/kirari/README.md): the dependency-free TypeScript library, language definitions, theme, and tests.
- [`packages/rehype`](packages/rehype/README.md): the optional Rehype plugin for Markdown and MDX code blocks.
- [`packages/react`](packages/react/README.md): the optional React component and streaming hook.
- [`sites/docs`](sites/docs): the documentation site, consuming the workspace `@vortexlabs/kirari` package.
- [`packages/benchmarks`](packages/benchmarks/README.md): speed and bundle-size benchmarks.
- [`docs`](docs): guides and design notes linked from this README.

Run commands from this directory:

```sh
bun install
bun run dev
```

`dev` builds the library before starting the documentation server. After changing
library source, run `bun run build:library` to refresh its exported files.
Open [localhost:4173](http://localhost:4173). The server rebuilds when site files
or the library's built files change; refresh the browser to see updates.

```sh
bun run build          # Build all packages and the documentation site
bun run build:integrations # Build Kirari and its Rehype and React integrations
bun run pack:preview   # Pack release archives into .packs for testing
bun run check          # Lint with Biome, then check all packages, documentation site, and benchmark harness
bun run lint           # Lint the workspace with Biome
bun run test           # Run library and integration tests
bun run test:integrations # Run Rehype and React integration tests
bun run test:corpus    # Run annotated correctness and partial-input checks
bun run benchmark      # Measure highlighting speed and browser bundle size
bun run benchmark:stream # Compare full-prefix and checkpoint streaming
bun run size           # Measure library browser bundles
bun run check:browser  # Generate the standalone browser checks
bun run check:packages # Install archives in a fresh external consumer; check types and exports
bun run changeset      # Describe a change for the next release
bun run release:kirari # Publish only the core package
bun run release:kirari-rehype # Publish only the Rehype integration
bun run release:kirari-react # Publish only the React integration
```

Open `packages/kirari/.checks/browser.html` after `check:browser` to run the browser
checks. See the [library README](packages/kirari/README.md) for its API and examples.
See the [installation guide](docs/installation.md) and [release process](RELEASING.md).

Packages are versioned independently. Run `bun run changeset` and select the
affected packages, then use their package-specific release commands.

The docs build writes three static pages to `sites/docs/dist/`: a landing page,
`/docs/`, and `/playground/`. GSAP powers the site's motion and stays out of the
library package. Reduced-motion preferences disable the animations.

The docs include editable examples for all 48 languages, token inspection,
per-category color controls, theme CSS export, HTML export, search, and local
installation instructions. Documentation content is rendered at build time.

The correctness corpus covers six priority languages with 30 original fixtures.
All 14 formerly tracked gap annotations are now required passing assertions;
see [syntax coverage and limits](docs/accuracy.md). Benchmarks generate a local report in
`packages/benchmarks/results/`; timings are environment-specific. See the
benchmark README for methodology.

Optional APIs add [token streaming](docs/streaming.md),
[range/line decorations](docs/decorations.md), and
[language lookup with Markdown fence highlighting](docs/language-integration.md).
The default bundle stays independent of these integrations.

[`@vortexlabs/kirari-rehype`](packages/rehype/README.md) uses those tokens in rendered Markdown
and MDX documents. Register languages explicitly, then run it after
`remark-rehype` or through MDX's `rehypePlugins`. It creates structured HTML nodes,
supports optional line wrappers and fence line selections, and keeps unknown
languages unchanged. It is a separate package; its dependencies do not
enter Kirari's core or default browser bundle.

[`@vortexlabs/kirari-react`](packages/react/README.md) renders the same tokens as
React elements. `<Code>` uses no hooks, so it works as a Server Component, and it
supports line wrappers, highlighted line ranges, and decorations. The
`useTokenStream` hook highlights code that arrives in chunks.

The streaming benchmark compares full-prefix and checkpoint rendering at matching
update boundaries, including adverse inputs. It records total response work and
timing in separate `streaming-latest` reports. Performance depends on the source,
language, and how callers apply token patches.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 [Ugi](https://ugi.dev)
