import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import process from "process";

// Your sitemap URL
const SITEMAP_URL = process.env.SITEMAP_URL || "https://rxhive.zynapte.com/sitemap.xml";

// Wayback Machine SavePageNow endpoint
const WAYBACK_SAVE = process.env.WAYBACK_SAVE || "https://web.archive.org/save/";

// Config
const DELAY_MS = Number(process.env.DELAY_MS || 5000);
const RETRIES = Number(process.env.RETRIES || 2);
const BACKOFF_BASE = Number(process.env.BACKOFF_BASE || 1500); // ms
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : undefined; // optional limit for smoke-tests
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

function now() {
  return new Date().toISOString();
}

// Fetch and parse sitemap XML
async function fetchUrlsFromSitemap(sitemapUrl) {
  console.log(`[${now()}] Fetching sitemap: ${sitemapUrl}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(sitemapUrl, { signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Sitemap fetch timed out after ${REQUEST_TIMEOUT_MS}ms`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
  const xml = await res.text();

  const result = await parseStringPromise(xml);
  const urls = result.urlset.url.map(u => u.loc[0]);
  console.log(`[${now()}] Found ${urls.length} URLs in sitemap.`);
  return urls;
}

// Save one URL to Wayback Machine with retries and logging
async function saveToWayback(url, index, total) {
  const saveUrl = WAYBACK_SAVE + encodeURIComponent(url);
  let attempt = 0;

  while (attempt <= RETRIES) {
    const attemptLabel = `#${index}/${total} attempt ${attempt + 1}`;
    try {
      console.log(`[${now()}] ${attemptLabel} -> Saving: ${url} - ${saveUrl}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let res;
      try {
        res = await fetch(saveUrl, { method: "GET", signal: controller.signal });
      } catch (err) {
        if (err.name === 'AbortError') throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
        throw err;
      } finally {
        clearTimeout(timeout);
      }

      const headers = {};
      res.headers.forEach((v, k) => (headers[k] = v));

      if (res.ok) {
        console.log(
          `[${now()}] ✅ Saved ${url} (${res.status}). Location header: ${headers.location || "-"}`
        );
        return { ok: true, status: res.status, headers };
      }

      // Non-OK response
      const text = await safeRead(res);
      console.warn(
        `[${now()}] ⚠️ Failed to save ${url} (status ${res.status}). Body (truncated): ${truncate(text, 400)}`
      );
      // For 429 or 5xx, we may retry
      if (shouldRetryStatus(res.status) && attempt < RETRIES) {
        attempt++;
        const backoff = BACKOFF_BASE * attempt;
        console.log(`[${now()}] Backing off ${backoff}ms before retrying (${attempt}/${RETRIES})`);
        await delay(backoff);
        continue;
      }

      return { ok: false, status: res.status, headers, body: text };
    } catch (err) {
      console.error(`[${now()}] ❌ Error saving ${url}: ${err.message}`);
      if (attempt < RETRIES) {
        attempt++;
        const backoff = BACKOFF_BASE * attempt;
        console.log(`[${now()}] Retry after ${backoff}ms (network/error)`);
        await delay(backoff);
        continue;
      }
      return { ok: false, error: err.message };
    }
  }
}

function shouldRetryStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

async function safeRead(res) {
  try {
    return await res.text();
  } catch (err) {
    return `<unable to read body: ${err.message}>`;
  }
}

function truncate(s = "", n = 200) {
  return s.length > n ? s.slice(0, n) + "..." : s;
}

// Delay helper
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main
(async function main() {
  console.log(`[${now()}] Starting Wayback archiver`);
  const startedAt = Date.now();
  let success = 0;
  let failed = 0;
  try {
    const urls = await fetchUrlsFromSitemap(SITEMAP_URL);
    const total = LIMIT ? Math.min(LIMIT, urls.length) : urls.length;
    console.log(`[${now()}] Processing ${total} of ${urls.length} URLs`);

    for (let i = 0; i < total; i++) {
      const url = urls[i];
      const result = await saveToWayback(url, i + 1, total);
      if (result && result.ok) success++;
      else failed++;

      console.log(
        `[${now()}] Progress: ${i + 1}/${total} (success: ${success}, failed: ${failed})`
      );

      // small delay between requests to avoid rate limits
      if (i < total - 1) await delay(DELAY_MS);
    }

    const elapsed = (Date.now() - startedAt) / 1000;
    console.log(`[${now()}] ✅ Done. success=${success} failed=${failed} elapsed=${elapsed}s`);
  } catch (err) {
    console.error(`[${now()}] ❌ Script failed: ${err.message}`);
  }
})();
