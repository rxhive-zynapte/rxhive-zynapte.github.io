“RxHive” with Astro + Pagefind (No Starlight)

**Goal:**
Create a static, SEO-first medicine repository using **Astro** + **Markdown** content + **Pagefind** for client-side search (no server). The site must generate three URL types:

1. `/composition/{generic}/`
2. `/composition/combination/{combo}/`
3. `/medicines/{brand}/`

Examples (must exist and render correctly when the data is present):

* `https://rxhive.vercel.app/composition/terizidone/`
* `https://rxhive.vercel.app/composition/combination/cranberryextract-nitrofurantoin/`
* `https://rxhive.vercel.app/medicines/crocin-650`

> **Important**: Do **not** use Starlight. Use plain Astro pages, components, and Content Collections.

---

## Tech + Hosting

* Framework: **Astro** (latest)
* Node: 18+
* Search: **Pagefind** (client-side; static index)
* Content: **Markdown/MDX** via **Astro Content Collections**
* Deployment: **Vercel** (build to `dist`)
* Budget: very low; avoid servers, databases, and paid services

---

## Project Structure

```
rxhive/
  public/
    robots.txt
  src/
    components/
      AdSlot.astro
      JsonLd.astro
      FaqJsonLd.astro
    content/
      compositions/           # single-ingredient generics (slug = filename)
      combinations/           # multi-ingredient combos  (slug = filename)
      medicines/              # brand pages              (slug = filename)
      config.ts               # content collection schemas
    layouts/
      Base.astro
    pages/
      index.astro
      search.astro
      sitemap.xml.ts
      composition/[generic]/index.astro
      composition/combination/[combo]/index.astro
      medicines/[brand]/index.astro
  package.json
  astro.config.mjs
```

---

## Build Scripts

* Install Pagefind and run it **after** `astro build`:

  * `npm i -D pagefind`
  * `package.json` scripts:

    * `"dev": "astro dev"`
    * `"build": "astro build"`
    * `"postbuild": "pagefind --site dist"`
    * `"preview": "astro preview"`

**Note:** Pagefind index only exists after build. Local search testing: `npm run build && npm run preview`.

---

## Astro Config

`astro.config.mjs`

* Set the `site` to the production URL: `https://rxhive.vercel.app` (used for canonical URLs & sitemap).

---

## Content Collections (Schemas)

Define **three** collections in `src/content/config.ts`:

1. **compositions** (single-ingredient generics)

   * `title: string`
   * `description?: string`
   * `is_banned: boolean = false`
   * `lastModified?: string`
   * `faqs?: { q: string; a: string }[]`

2. **combinations** (multi-ingredient combos)

   * `title: string`
   * `description?: string`
   * `is_banned: boolean = false`
   * `lastModified?: string`
   * `ingredients?: { generic_slug: string; strength?: string }[]`
   * `faqs?: { q: string; a: string }[]`

3. **medicines** (brands)

   * `title: string`                      // brand name (e.g., “Crocin 650”)
   * `type: "single" | "combination"` = "single"
   * `generic_slug?: string`              // required if type = single
   * `combination_slug?: string`          // required if type = combination
   * `company?: string`
   * `strength?: string`
   * `pack_size?: string`
   * `mrp?: number`
   * `lastModified?: string`
   * `faqs?: { q: string; a: string }[]`
   * Add a schema refinement to enforce generic/combo slug presence based on `type`.

**Slugs** must come from filenames (e.g., `paracetamol.md` → `/composition/paracetamol/`).

---

## Pages & Routing

### 1) Composition (generic)

* File: `src/pages/composition/[generic]/index.astro`
* `getStaticPaths()` → iterate `compositions`.
* Render:

  * H1 title
  * Optional banned banner if `is_banned`
  * Markdown content (`<Content />`)
* **Pagefind**:

  * Wrap main content with `data-pagefind-body`
  * Hidden filters:

    * `<span data-pagefind-filter="type">composition</span>`
    * `<span data-pagefind-filter="is_banned">true|false</span>`
* **JSON-LD**:

  * Use `JsonLd.astro` with `type="composition"`, `url`, `lastModified`.
* **FAQ JSON-LD**:

  * Use `FaqJsonLd.astro` when `faqs` exist.

### 2) Combination

* File: `src/pages/composition/combination/[combo]/index.astro`
* `getStaticPaths()` → iterate `combinations`.
* Optionally resolve `ingredients[].generic_slug` to show links to each generic.
* Render:

  * H1 title
  * Banned banner if `is_banned`
  * Markdown content
* **Pagefind**: same idea as above with `type=combination`.
* **JSON-LD**:

  * `JsonLd.astro` with `type="combination"` and `ingredients=[resolved generic names]`.
* **FAQ JSON-LD**:

  * Include when `faqs` exist.

### 3) Medicine (brand)

* File: `src/pages/medicines/[brand]/index.astro`
* `getStaticPaths()` → iterate `medicines`.
* Resolve composition:

  * If `type="single"`, fetch the `generic_slug` entry from compositions.
  * If `type="combination"`, fetch the `combination_slug` entry from combinations.
* `isBanned` = true if linked generic or combo is banned.
* Render:

  * H1 title
  * Company, strength, pack, MRP if provided
  * Banned banner if `isBanned`
  * Markdown content
  * “Composition” section with link(s) to the corresponding composition page(s)
* **Pagefind**:

  * Wrap primary content with `data-pagefind-body`
  * Hidden filters to enable facets:

    * `type=medicine`
    * `company`
    * `generic` or `combination` (slug)
    * `is_banned`
* **JSON-LD**:

  * `JsonLd.astro` with `type="medicine"` (or `"combination"` for combo brands), `manufacturer=company`.
* **FAQ JSON-LD**:

  * Include when `faqs` exist.

---

## Components

### Base Layout

* `src/layouts/Base.astro`
* Common `<head>`:

  * Title, meta description, canonical from `Astro.site + Astro.url.pathname`
  * **Leave a placeholder for Google AdSense script** (commented)
* Page chrome: header (nav), main, footer

### Ad Slot

* `src/components/AdSlot.astro`
* Simple bordered box; later replace with AdSense `<ins>` blocks.
* Required placements:

  * Composition: `comp-top`, `comp-bottom`
  * Combination: `combo-top`, `combo-bottom`
  * Medicine: `brand-top`, `brand-bottom`
  * Home: `home-mid`
  * (Optional) Search bottom ad slot

### JSON-LD: Drug / WebSite

* `src/components/JsonLd.astro`
* Supports `type: "homepage" | "composition" | "combination" | "medicine"`
* Always include:

  * `MedicalWebPage` with `mainEntity` = `Drug`
  * `mainEntityOfPage`, `dateModified`
  * For combos, include `"activeIngredient": [{ "@type": "Drug", "name": "…" }]`
  * Add `safetyConsideration` note
* Homepage variant: `WebSite` + `SearchAction`

### JSON-LD: FAQ

* `src/components/FaqJsonLd.astro`
* Emits `FAQPage` JSON-LD with `mainEntity` Q/A.
* **Rule:** JSON-LD must match visible page FAQs. The page must visibly contain an FAQ section with the same Q/A.

---

## Search (Pagefind)

* Include default UI at `/search`:

  * File: `src/pages/search.astro`
  * Load `/ _pagefind / pagefind-ui.js` and `/ _pagefind / pagefind-ui.css`
  * Initialize `new PagefindUI({ element: "#search", showSubResults: true, showEmptyFilters: false })`
* Ensure each detail page:

  * Uses `data-pagefind-body` around the core content
  * Provides hidden **filters** with `data-pagefind-filter` for facets:

    * `type` ∈ {composition, combination, medicine}
    * `is_banned` ∈ {true,false}
    * `company` (for medicine)
    * `generic` or `combination` slugs (for medicine)
* (Optional) Add `data-pagefind-meta="mrp:123"` etc. for display purposes.

---

## SEO Requirements

* **Canonical** tags on all pages (use `Astro.site`)
* **Sitemap** at `/sitemap.xml`:

  * Include `/`, `/search`, all compositions, all combinations, all medicines
  * Implement in `src/pages/sitemap.xml.ts`
* **robots.txt** in `public/robots.txt` pointing to the sitemap
* **JSON-LD**:

  * Home: `WebSite + SearchAction`
  * Detail pages: `MedicalWebPage` + `Drug`
  * **FAQPage** JSON-LD when FAQs exist
* **Headings**: one `<h1>` per page, semantic subheadings
* **Lighthouse**: aim for 90+ on Performance/SEO/Best Practices/Accessibility

---

## Accessibility

* Semantic HTML, labels for interactive elements
* Color contrast AA
* Skip-to-content link in layout (nice to have)
* Alt text for images (if any)

---

## Ads (Placeholders Now, Real Later)

* Global script placeholder in `<head>` of `Base.astro`
* Replace `<AdSlot />` components with AdSense `<ins>` blocks later
* Ad slots placed:

  * Above and below content on each page type
  * One on homepage mid-content
  * Optional one below search UI

---

## Example Markdown (Brand)

`src/content/medicines/crocin-650.md`

```md
---
title: "Crocin 650"
type: "single"
generic_slug: "paracetamol"   # must match an existing composition slug
company: "GSK"
strength: "650 mg"
pack_size: "15 tablets"
mrp: 35
faqs:
  - { q: "Is Crocin 650 the same as paracetamol?", a: "Yes. Crocin 650 contains paracetamol as its active ingredient." }
  - { q: "What is Crocin 650 used for?", a: "Relief of fever and mild to moderate pain; follow dosage instructions on the page." }
---
Short brand description and notes. Add precautions, storage, etc.
```

> Generic and combination files follow your existing style; add optional `faqs` to frontmatter to enable FAQ rich results.

---

## Acceptance Criteria (Checklist)

**Routing & Pages**

* [ ] `/composition/{generic}/` renders from `compositions/*.md`
* [ ] `/composition/combination/{combo}/` renders from `combinations/*.md`
* [ ] `/medicines/{brand}/` renders from `medicines/*.md`
* [ ] Each page shows H1 title and MD content
* [ ] Banned banner displays when `is_banned = true`

**Search**

* [ ] `npm run build` generates `dist/_pagefind/*`
* [ ] `/search` loads Pagefind UI
* [ ] Searching returns results across all three types
* [ ] Filters present: `type`, `is_banned`, and for medicines: `company`, `generic` or `combination`

**SEO**

* [ ] Canonical tag set on all pages (built from `Astro.site`)
* [ ] JSON-LD present:

  * [ ] Home: `WebSite + SearchAction`
  * [ ] Composition/Combination/Medicine: `MedicalWebPage + Drug`
  * [ ] FAQ pages: `FAQPage` matching visible Q/A
* [ ] `/sitemap.xml` includes home, search, and all detail pages
* [ ] `robots.txt` present and references sitemap

**Ads**

* [ ] `AdSlot` placeholders included on each page as specified
* [ ] Global ad script placeholder in `Base.astro` head (commented)

**Quality**

* [ ] Lighthouse ≥ 90 on Performance/SEO/Best/Accessibility
* [ ] No build errors; deploys on Vercel (Output: `dist`)
* [ ] Clear instructions in README for:

  * Running dev, build, preview
  * Adding new Markdown files to create new pages
  * Adding FAQs via frontmatter to enable FAQ rich results

---

## Deliverables

1. Complete Astro project with the structure above
2. README with run/build/deploy steps and content authoring notes
3. Working demo deployed on Vercel at `https://rxhive.vercel.app` (or preview URL)
4. Sample pages live:

   * At least 2 generics, 2 combinations, 1 medicine page
   * Search working and indexing those pages
   * Sitemap and robots present
   * JSON-LD validating in Google Rich Results Test for at least one page of each type (including FAQ)

---

**Constraints / Notes**

* No Starlight. Keep dependencies minimal.
* No server code, DB, or headless CMS. All content = Markdown.
* Keep code simple, readable, and commented where non-obvious.
