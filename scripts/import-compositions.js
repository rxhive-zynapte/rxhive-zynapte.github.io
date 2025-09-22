#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const srcDir = path.resolve('data/composition');
const destDir = path.resolve('src/content/compositions');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function extractFaqs(body) {
  // Find FAQ section heading (## ...FAQ)
  const faqHeadingRe = /(^|\n)##+\s*\**FAQ/i;
  const m = body.match(faqHeadingRe);
  if (!m) return [];
  const start = m.index + m[0].length;
  // take substring from start to end or next top-level H2
  const rest = body.slice(start);
  // split into questions (### headings)
  const qaRe = /(^|\n)###+\s*(.*?)(?=\n###|$)/gs;
  const faqs = [];
  let match;
  while ((match = qaRe.exec(rest))) {
    const rawQ = match[2].trim();
    // split question and answer by first blank line after q's header
    const q = rawQ.replace(/^\*+|\*+$/g, '').replace(/^Q\d+:?\s*/i, '').trim();
    // answer lines come after the header within match[0]
    // Remove the header line from match[0]
    const afterHeader = match[0].replace(/(^|\n)###+\s*.*\n?/, '\n');
    const a = afterHeader.trim().replace(/^\*+|\*+$/g, '');
    faqs.push({ q, a });
  }
  return faqs;
}

// ...existing code (stripLeadingH1 removed as it's unused)

function stripLeadingH1IfMatchesTitle(body, title) {
  // Match leading H1 and remove it only when it equals the provided title (normalized)
  const m = body.match(/^#\s*(.*)\r?\n(\s*\r?\n)?/);
  if (!m) return body;
  const heading = m[1].trim();

  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/\*|\*\*|`|\[|\]|\(|\)|["'“”‘’]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

  if (normalize(heading) === normalize(title || '')) {
    // remove the heading and any following blank line
    return body.replace(/^#\s*.*\r?\n(\s*\r?\n)?/, '');
  }
  return body;
}

function extractUsageDescription(body) {
  // Look for headings like ## **Usage** or ## Usage and return the first paragraph under it
  const usageRe = /(^|\n)##+\s*\**Usage\**\s*\n([\s\S]*?)(?=\n##|\n#|$)/i;
  const m = body.match(usageRe);
  if (!m) return null;
  const usageBlock = m[2].trim();
  // Take first paragraph (up to first double newline)
  const para = usageBlock.split(/\n\s*\n/)[0].replace(/\n/g, ' ').trim();
  // Shorten if too long (e.g., > 300 chars)
  return para.length > 300 ? para.slice(0, 297) + '...' : para;
}

async function processFile(file) {
  const filePath = path.join(srcDir, file);
  const text = await fs.readFile(filePath, 'utf8');
  const parsed = matter(text);
  const slug = path.basename(file, path.extname(file)).toLowerCase();

  const title = parsed.data.title || slug;

  // Clean body: remove leading H1 only if it duplicates the title
  let body = stripLeadingH1IfMatchesTitle(parsed.content, title);

  // Extract description from Usage if description not present
  let description = parsed.data.description || '';
  if (!description) {
    const fromUsage = extractUsageDescription(body);
    if (fromUsage) description = fromUsage;
  }

  const faqs = extractFaqs(body);

  const outputData = {
    title,
    description,
    is_banned: parsed.data.is_banned || false,
    lastModified: parsed.data.lastModified || new Date().toISOString(),
  };
  if (faqs.length) outputData.faqs = faqs;

  const out = matter.stringify(body, outputData);
  await fs.writeFile(path.join(destDir, `${slug}.md`), out, 'utf8');
  console.log('Wrote', `${slug}.md`);
}

async function main() {
  await ensureDir(destDir);
  const files = await fs.readdir(srcDir);
  const md = files.filter((f) => f.endsWith('.md'));
  for (const f of md) {
    try {
      await processFile(f);
    } catch (e) {
      console.error('Failed', f, e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
