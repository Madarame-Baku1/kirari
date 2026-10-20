# Kirari docs

Next.js App Router documentation and playground for <https://kirari.sh>.
Pages are prerendered at build time. Kirari highlights examples on the server;
React client components handle search, demos, and the playground.

## Development

From the repository root:

```sh
bun install
bun run dev
```

Open <http://localhost:4173>. Next.js handles code updates with Fast Refresh.
After editing library source, run `bun run build:integrations` to rebuild the
packages consumed by the site.

```sh
bun run build                     # Build packages and the production site
bun run --cwd sites/docs start    # Serve the production site locally
bun run --cwd sites/docs check    # Types, tests, production build, and SEO checks
```

Use Node.js 22 or 24 and the Bun version pinned in the root `package.json`.

## Writing documentation

Edit `content/*.md`. Each guide is ordinary Markdown with headings, links,
tables, and fenced code examples. No JSX, MDX imports, or custom components
are needed. Refresh the page after editing Markdown.

For a new guide, add its ID, title, description, and group to `src/navigation.ts`.
That list controls navigation, search, routes, the sitemap, and the AI index.

The same source is available in three forms:

- `/docs/react/`: rendered HTML.
- `/docs/react.md`: the original Markdown, with `text/markdown` content type.
- `/llms-full.txt`: every guide combined into one Markdown document.

`/llms.txt` links to all Markdown guides. `/docs.md` combines the introduction and installation.
The **Copy page** button at the end of the breadcrumbs copies the guide. The adjacent arrow opens **View as Markdown** in a new tab.
`/docs/installation/` redirects to `/docs/#installation`. Existing links such as `/docs/#react`
continue to work through a browser redirect to the corresponding guide.

## Changelog

`/changelog/` is built from one Markdown file per release in
`changelog/<package>/<version>.md`. Run `bun run changelog:new` from the
repository root to scaffold a file for each pending changeset. See
[Site changelog](../../RELEASING.md#site-changelog) for the file format.

## Styling

Shared design values live in `src/tokens.css`. Reuse a token when a size, color,
weight, or duration appears more than twice. Size names describe their equivalent
pixels at the default root size: `--size-16` is `1rem`. Use `rem` for lengths above
`1px`; keep hairlines and smaller precision values in pixels. Breakpoints use
literal `rem` values because CSS variables cannot be used in media queries.

Reusable UI lives in dedicated folders under `src/components/`, following Vortex:

```text
Button/
  Button.tsx
  Button.types.ts
  Button.module.css
  index.ts
```

Extract a shared component when the same UI pattern is used twice. Use `type`
for props unless an interface needs to extend another interface. Import types
as `Types` and destructure `props` inside the component.

Build features from the shared primitives instead of styling raw elements:

- `Button`: `variant` (`primary`, `secondary`, `tertiary`), `size` (`xs`, `sm`, `md`, `lg`), `startIcon`, and `endIcon`.
  Pass `href` to render a link with button styling.
- `IconButton`: icon-only control with a required `label` for its accessible name.
- `Link`: `variant` (`plain`, `subtle`, `strong`), `arrow`, and `external` for new-tab links.
- `Divider`: horizontal or vertical separator.
- `Dialog` with `Dialog.Close`, `Tabs` with `Tabs.List`, `Tabs.Tab`, and `Tabs.Panel`,
  `SegmentedControl` with `SegmentedControl.Item`, and `NavList` with `NavList.Group`
  and `NavList.Item` are compound components: the root owns state and its parts read it
  from context.
- `useCopy` copies text and reports a short-lived `copied` flag; `CopyButton` and
  `CopyIconButton` wrap it.

Primitives expose CSS custom properties such as `--icon-button-color` or
`--button-tertiary-color` for contextual theming, so callers never override their classes.
Primitives own no outer margin; the parent decides spacing. Combine classes with the
[`classnames`](https://www.npmjs.com/package/classnames) package.

Use the shared `Link` for navigation, including external URLs, hash links, and links
rendered from Markdown. Disable prefetching for raw Markdown and text files.
Keep the skip-to-content link native so hash navigation transfers keyboard focus
to the main content. React owns
interactive state; refs handle dialog focus, scrolling, and animation targets.
Component styles belong in CSS Modules; shared tokens, resets, and page layout
remain global. Use local module classes without `:global` selectors. Next.js supports
this without an extra PostCSS configuration.

Use tabs with a width of four spaces and put object type properties on separate
lines. Keep simple, single-line returns inline;
wrap nested, multiline JSX in `return (...)`. Biome formats the docs source to
keep these conventions consistent.

## Search and sharing

Each HTML page has a title, description, canonical URL, and Open Graph/Twitter
metadata. `/sitemap.xml` lists the canonical HTML pages; `/robots.txt` permits
crawling. The home page describes the project with `SoftwareSourceCode` JSON-LD,
and guides include breadcrumbs. `/opengraph-image` generates the social preview.

Raw Markdown has a canonical response header pointing at its HTML page and a
`noindex` header to avoid duplicate search results. It remains publicly readable.
The AI index helps tools find the content; it is not a search-ranking guarantee.

Set the production origin in `src/site.ts`. After deploying, submit
`https://kirari.sh/sitemap.xml` in Google Search Console and monitor indexing.

## Deployment

In the existing Vercel project, set **Root Directory** to `sites/docs` and enable
access to files outside that directory. The local `vercel.json` selects Next.js,
installs from the workspace root, builds all packages, and uses `.next` output.
Remove any old project-level `sites/docs/dist` output override.

The Vercel dashboard settings and live deployment are not changed by editing
this repository. For other hosts, build from the workspace root, then run the
site's `start` command. This is a Next.js application, not a `dist/` static folder.

## Files

- `content/`: plain Markdown guides.
- `changelog/`: one Markdown release file per package version.
- `src/app/`: page routes, metadata, Markdown endpoints, and AI indexes.
- `src/components/`: React components with colocated types, CSS Modules, and helpers.
- `src/content.ts`: plain Markdown parsing and Kirari highlighting; `MarkdownContent` renders the tree as React.
- `src/client/`: shared animation utilities.
- `src/tokens.css`: shared design values.
- `src/style.css`: site styles; package themes supply code colors.
- `src/changelog.ts`: changelog categories and packages; `src/changelog.content.tsx` parses and validates release files.
- `scripts/check-build.ts`: checks the actual prerendered HTML and text output.
- `scripts/changelog-new.ts`: scaffolds release files from pending changesets.

The playground processes code in the browser and keeps its 20,000-character
limit. Its language definitions are loaded only when visiting the playground.
