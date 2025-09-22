import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, resolve, relative } from 'path';
import process from 'process';

const root = process.cwd();

const pairs = [
  { src: resolve(root, 'dist/pagefind'), dest: resolve(root, 'public/pagefind') },
  { src: resolve(root, 'dist/_pagefind'), dest: resolve(root, 'public/_pagefind') },
];

let copiedAny = false;

for (const { src, dest } of pairs) {
  if (!existsSync(src)) continue;

  try {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.log(`Pagefind assets copied: ${relative(root, src)} -> ${relative(root, dest)}`);
    copiedAny = true;
  } catch (error) {
    console.warn(`Failed to copy ${relative(root, src)} to ${relative(root, dest)}:`, error);
  }
}

if (!copiedAny) {
  console.warn('Pagefind assets not found in dist/. Run "pnpm build" (or pagefind --site dist) before starting dev to enable local search.');
}
