import { getCollection } from 'astro:content';

type SitemapUrl = { loc: string; lastmod?: string };

export async function GET({ request }: { request: Request }) {
  const origin = import.meta.env.SITE ? String(import.meta.env.SITE).replace(/\/$/, '') : new URL(request.url).origin.replace(/\/$/, '');

  const urls: SitemapUrl[] = [];
  urls.push({ loc: '/', lastmod: new Date().toISOString() });

  // The typed callback parameter name in the signature can trigger no-unused-vars in TS
  async function addCollection(collectionName: string, pathBuilder: Function) {
    try {
      const entries = (await getCollection(collectionName as any)) as any[];
      for (const entry of entries) {
        urls.push({ loc: pathBuilder(String(entry.slug)), lastmod: entry.data?.lastModified || new Date().toISOString() });
      }
    } catch {
      // ignore missing collections
    }
  }

  await addCollection('compositions', (s: string) => `/composition/${s}/`);
  await addCollection('combinations', (s: string) => `/composition/combination/${s}/`);
  await addCollection('medicines', (s: string) => `/medicine/${s}/`);

  const body = urls
    .map((u) => {
      const loc = `${origin}${u.loc}`;
      const lastmod = u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : '';
      return `  <url>\n    <loc>${loc}</loc>\n    ${lastmod}\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
