# Kirari docs

An original static documentation site built with Bun and TypeScript. It consumes
the local library through its public exports. GSAP is used only by this site.

From the workspace root, run `bun install` then `bun run dev` and open
http://localhost:4173. Site changes rebuild automatically; refresh to view them.
After changing library source, run `bun run build:library` to update its exports.

`bun run build` at the root builds all packages and the site. The site has three
static pages, each a standalone HTML file with inlined styles and its own client bundle:

- `dist/index.html`: landing page with the animated highlighting demo.
- `dist/docs/index.html`: the documentation.
- `dist/playground/index.html`: the full-screen playground (bundles all 48 languages).

Serve `dist/` from any static host; links use root paths (`/docs/`, `/playground/`).

- `src/pages/`: pre-rendered page markup (`landing.ts`, `docs.ts`, `playground.ts`).
- `src/shared.ts`: layout, top bar, search index, code blocks, footer.
- `src/client/`: per-page scripts; `common.ts` holds theme, search, menu, and copy.
- `src/style.css`: visual design, code palettes, responsive layouts.
- `src/languages.ts`: original samples using public language imports.
- `src/navigation.ts`: documentation sections and routes.
- `scripts/`: build and local development server.

The playground limits input to 20,000 characters. All processing stays in the
browser. Theme presets reset custom token colors. Copy CSS exports the current palette;
Copy code exports the usage snippet.

No reference-site source or assets are reused. The site is deployed at
<https://kirari.vortex.design>.
