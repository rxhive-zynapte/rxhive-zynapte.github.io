// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// NOTE: Replace the `site` value with your production URL (or GitHub Pages URL)
// For project-site (GitHub Pages) deployments set `base: '/repo/'` as needed.
export default defineConfig({
	site: 'https://rxhive.zynapte.com', // <-- set to your site URL (used for canonical links & sitemap)
	// base: '/repo/', // uncomment and set when deploying under a subpath (GitHub Pages project site)
});
