# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
RxHive — Astro + Pagefind

This repository is a starter for a static medicine reference site (RxHive) built with Astro and Pagefind. It includes:

- Content collections for compositions (single generics), combinations (multi-ingredient), and medicines (brand pages)
- Page templates that render content and output Pagefind-friendly metadata
- JSON-LD components for WebSite, MedicalWebPage/Drug, and FAQPage (rich results)
- Pagefind integrated via a `postbuild` script (postbuild indexes `dist`)

Quick prerequisites

- Node 18+
- pnpm (recommended; repo includes `pnpm-lock.yaml`) or npm

Commands (pnpm)

Install:
```bash
pnpm install
```

Build (includes Pagefind indexing):
```bash
pnpm run build
```

Preview the generated site:
```bash
pnpm run preview
```

Local dev (Pagefind assets are not generated in dev):
```bash
pnpm run dev
# Note: Pagefind is only generated during build — use build + preview to test /search
```

Pagefind notes

- `package.json` currently runs `pagefind --site dist` as a `postbuild` script.
- Pagefind v1.0+ outputs to `/pagefind/` by default. This project references `/_pagefind/` in the UI to preserve older behavior. During a build Pagefind wrote indexes to both `/pagefind` and `/_pagefind` to remain compatible. To make this explicit:

	- Option A (recommended): Update `src/pages/search.astro` to use `/pagefind/pagefind-ui.js` and `/pagefind/pagefind-ui.css`.

	- Option B (compat): Keep `/_pagefind` in the UI and change the postbuild script to:
		```json
		"postbuild": "pagefind --site dist --output-subdir _pagefind"
		```

Content collections and slugs

- Config file: `src/content/config.ts`
- Collections: `compositions`, `combinations`, and `medicines`.
- Slugs are derived from filenames. For example:
	- `src/content/compositions/abciximab.md` → `/composition/abciximab/`
	- `src/content/combinations/abacavir-lamivudine.md` → `/composition/combination/abacavir-lamivudine/`
	- `src/content/medicines/crocin-650.md` → `/medicines/crocin-650/`

FAQ & JSON-LD checklist (for rich results)

1. Ensure each page with Q/A has the visible Q/A in the page body (keep your `## FAQs` sections).
2. Add a `faqs` array to the frontmatter mirroring the visible Q/A exactly.
3. The page templates include `<FaqJsonLd />` which will render the FAQPage JSON-LD when `faqs` exists.
4. Rebuild and test the page in the Google Rich Results Test.

Files to inspect for behavior

- Layouts: `src/layouts/Base.astro`
- Components: `src/components/JsonLd.astro`, `src/components/FaqJsonLd.astro`, `src/components/AdSlot.astro`
- Pages: `src/pages/*` (index, search, sitemap, dynamic pages for compositions and medicines)

Where to go next (suggestions)

- Reconcile Pagefind path (Option A or B above). I can update your project to use the modern `/pagefind` paths and remove compatibility duplication.
- Add Open Graph and Twitter Card meta tags to `Base.astro`.
- Add a small Node script to bulk-create medicine markdown files from a CSV.
- Add CI (GitHub Actions) to run `pnpm run build` on PRs.

If you'd like, tell me which next step to take and I will implement it and run a build.

## Search (Pagefind)

This project includes Pagefind integration for fast client-side search. Key points:

- Installation: Pagefind is already listed in `devDependencies`. The `postbuild` script runs `pagefind --site dist` and will write its assets into your built `dist/` (either `pagefind/` or `/_pagefind/` depending on version/options).

- Test locally:

```bash
pnpm install
pnpm run build   # runs astro build then pagefind via postbuild
pnpm run preview # serve the generated dist for local testing
```

- Open `http://localhost:3000/search` (or the preview URL) and try queries. The search UI assets are loaded using `import.meta.env.BASE_URL` so they work on root sites and project subpaths (GitHub Pages).

- Markup for indexed pages:

```html
<article data-pagefind-body>
	<!-- main visible content for indexing -->
</article>

<!-- Optional filters (hidden) -->
<div style="display:none">
	<span data-pagefind-filter="type">composition</span>
	<span data-pagefind-filter="company">GSK</span>
</div>
```

- Accessibility: The search input includes a visible or screen-reader label. The header search is in `src/components/SearchBar.astro` and the main search page is `src/pages/search.astro`.

- GitHub Pages (project site): Set `base` in `astro.config.mjs` to your repo path (for example `base: '/rxhive/'`) and ensure the build artifacts (the `dist/` folder) include the `pagefind/` assets when deploying. The UI uses `import.meta.env.BASE_URL` so it will import `pagefind/pagefind-ui.js` from the correct subpath.

If you'd like, I can switch the project to always output `/_pagefind/` (compat) or update the site to prefer the modern `/pagefind/` path — tell me which you prefer and I'll adjust the `postbuild` script and UI imports accordingly.

## GitHub Pages (CI deploy)

This project includes a GitHub Actions workflow to build the site and publish the generated `dist/` folder to GitHub Pages.

- The workflow is located at `.github/workflows/deploy-pages.yml` and runs on pushes to the `main` branch (and via `workflow_dispatch`).
- It builds the site (`npm run build`) and uploads `dist/` using `upload-pages-artifact` then deploys with `deploy-pages`.
- In the repository Settings → Pages, set **Build and deployment** to **GitHub Actions** (Pages environment will be created automatically the first time the workflow runs).

If this repo will be published as a Project Page (e.g. `https://username.github.io/rxhive/`), update `astro.config.mjs` to set `site` and `base` accordingly (see earlier instructions in this README).

## Vercel deployment

You can deploy this project to Vercel either as a static site (recommended) or using the Astro Vercel adapter.

1) Static deploy (simple)

 - Ensure `build` script produces `dist/` (this repo already uses `astro build`).
 - The repository includes `vercel.json` configured for `@vercel/static-build` with `dist` as the output directory.

Local test commands:
```bash
pnpm install
pnpm run build
```

Push to GitHub and import the repo in Vercel (or run `vercel` from the CLI). Vercel will run `pnpm run build` and publish the `dist/` output.

2) Optional: Use the Astro Vercel adapter

If you prefer the official adapter (for advanced edge/server usage), install it and update `astro.config.mjs`:

```bash
pnpm add -D @astrojs/vercel
```

Then in `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
	adapter: vercel(),
});
```

Notes:
- If this is a project deployed under a subpath on Vercel, set `site` and `base` in `astro.config.mjs`.
- If you use Pagefind, ensure the UI imports use `import.meta.env.BASE_URL` so assets load correctly under a base path.
