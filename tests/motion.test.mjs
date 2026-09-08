import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { damp, coverUV, pixelRatio } from '../src/motion.js';

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
    assert.ok(w*h*ratio*ratio <= 2_600_001);
    assert.ok(ratio <= 1.5);
  }
});
test('all shipped asset references exist and the research route is preserved', async () => {
  const html = await readFile('index.html', 'utf8');
  const refs = [...html.matchAll(/(?:href|src|srcset)="(\/assets\/[^\"]+)"/g)].map(x => x[1]);
  for (const path of refs) await access('.' + path);
  await access('paper.html');
  assert.ok(!html.includes('Journal AI') && !html.includes('Thriftr'));
});
