import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const pages = readdirSync('.').filter(file => file.endsWith('.html'));

for (const page of pages) {
  test(`${page} only links to local files that exist`, () => {
    const html = readFileSync(page, 'utf8');
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    for (const [, url] of html.matchAll(/(?:src|href)="(\/[^"]*)"/g)) {
      const [path, hash] = url.split('#');
      const file = path === '/' ? 'index.html' : path.slice(1);
      assert.ok(existsSync(file), `${page} links to missing ${url}`);
      if (hash && file.endsWith('.html')) {
        const target = file === page ? ids : new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
        assert.ok(target.has(hash), `${page} links to missing anchor ${url}`);
      }
    }
  });

  test(`${page} gives every image alt text and dimensions`, () => {
    const html = readFileSync(page, 'utf8');
    for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(img, /\salt="[^"]+"/, `missing alt: ${img}`);
      assert.match(img, /\swidth="\d+"[^>]*\sheight="\d+"/, `missing size: ${img}`);
    }
  });
}
