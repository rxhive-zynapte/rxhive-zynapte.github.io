import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

// Your sitemap URL
const SITEMAP_URL = "https://rxhive.zynapte.com/sitemap.xml";

// Wayback Machine SavePageNow endpoint
const WAYBACK_SAVE = "https://web.archive.org/save/";

// Fetch and parse sitemap XML
async function fetchUrlsFromSitemap(sitemapUrl) {
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  const res = await fetch(sitemapUrl);
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
  const xml = await res.text();

  const result = await parseStringPromise(xml);
  const urls = result.urlset.url.map(u => u.loc[0]);
  console.log(`Found ${urls.length} URLs in sitemap.`);
  return urls;
}

// Save one URL to Wayback Machine
async function saveToWayback(url) {
  const saveUrl = WAYBACK_SAVE + encodeURIComponent(url);
  try {
    const res = await fetch(saveUrl);
    if (res.ok) {
      console.log(`✅ Saved: ${url}`);
    } else {
      console.log(`⚠️ Failed (${res.status}): ${url}`);
    }
  } catch (err) {
    console.error(`❌ Error saving ${url}: ${err.message}`);
  }
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main
(async function main() {
  try {
    const urls = await fetchUrlsFromSitemap(SITEMAP_URL);

    for (const url of urls) {
      await saveToWayback(url);
      await delay(5000); // 5s delay to avoid rate limiting
    }

    console.log("✅ Done archiving all URLs.");
  } catch (err) {
    console.error("❌ Script failed:", err.message);
  }
})();
