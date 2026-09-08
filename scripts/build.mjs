import { build } from 'esbuild';
import { readdir, rm } from 'node:fs/promises';
for (const name of await readdir('assets')) {
  if (/^(main|room|chunk)-.*\.js$/.test(name) || name === 'main.js' || name === 'main.css') {
    await rm(`assets/${name}`);
  }
}
await build({
  entryPoints: ['src/main.js'], outdir: 'assets', bundle: true,
  splitting: true, format: 'esm', minify: true, target: ['es2022'],
  entryNames: '[name]', chunkNames: '[name]-[hash]', legalComments: 'eof',
});
