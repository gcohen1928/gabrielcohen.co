import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { damp, coverUV, pixelRatio } from '../src/motion.js';
import { detailViews } from '../src/camera.js';
import { books } from '../src/books.js';

test('mouse smoothing feels the same at 30, 60, and 120 fps without overshoot', () => {
  const final = fps => { let x = 0; for (let n = 0; n < fps; n++) x = damp(x, 1, 1 / fps); return x; };
  assert.ok(Math.abs(final(30) - final(120)) < 1e-10);
  assert.ok(final(60) > .99 && final(60) < 1);
});
test('cover cropping preserves source aspect across portrait and landscape', () => {
  for (const [w,h,a] of [[1500,1049,1500/1049],[1920,1080,1500/1049],[390,844,2/3],[700,600,2/3]]) {
    const [x,y] = coverUV(w,h,a);
    assert.ok(x > 0 && x <= 1 && y > 0 && y <= 1);
    assert.ok(Math.abs((x*a/y) - w/h) < 1e-10);
  }
});
test('high density and 4K displays stay within the renderer pixel budget', () => {
  for (const [w,h,dpr] of [[390,844,3],[1500,1049,2],[3840,2160,2]]) {
    const ratio = pixelRatio(w,h,dpr);
    assert.ok(w*h*ratio*ratio <= 4_000_001);
    assert.ok(ratio <= 2);
  }
});
test('all shipped asset references exist and the research route is preserved', async () => {
  const html = await readFile('index.html', 'utf8');
  const refs = [...html.matchAll(/(?:href|src|srcset)="(\/assets\/[^\"]+)"/g)].map(x => x[1]);
  for (const path of refs) await access('.' + path);
  for (const view of detailViews) for (const suffix of ['', '-mobile']) await access(`assets/detail-${view}${suffix}.webp`);
  assert.equal(books.length, 8);
  assert.ok(books.some(book => book.title === 'East of Eden'));
  assert.ok(books.some(book => book.title === 'Demon Copperhead'));
  assert.ok(!books.some(book => ['Educated', 'The Bhagavad Gita', 'Steve Jobs'].includes(book.title)));
  for(const mode of ['desktop','mobile'])await access(`assets/room-empty-${mode}.webp`);
  await access('paper.html');
  assert.ok(!html.includes('Journal AI') && !html.includes('Thriftr'));
});

test('close-up camera drift never reveals an image edge', async () => {
  const { focusMotion } = await import('../src/motion.js');
  for (const x of [-2,-1,0,1,2]) for (const y of [-2,-1,0,1,2]) for(let t=0;t<120;t+=.25) {
    const motion=focusMotion(x,y,t);
    for(const edge of [-.5,.5]) {
      assert.ok(Math.abs((edge-motion.x)/motion.zoom)<.5);
      assert.ok(Math.abs((edge-motion.y)/motion.zoom)<.5);
    }
  }
});
