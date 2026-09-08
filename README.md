# gabrielcohen.co

A quiet, interactive room for Gabriel Cohen. Static HTML provides the content and links; a deferred Three.js renderer adds subtle depth-based parallax to original room artwork. The camera stays bounded so the image remains natural.

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://localhost:4173. Append `?debug=1` for frame timing, render dimensions, LCP, CLS, and error counts. The timing overlay is never present on the ordinary URL.

## Publishing

Cloudflare Pages is connected to `main`. The root `index.html`, `paper.html`, favicons, and `assets/` are deploy-ready static files. **Run `npm run build` and commit the generated assets whenever source changes.** No host configuration change is needed. The dynamic Three.js chunk has a content hash; HTML/main CSS/main JS use the existing revalidation policy.

## Design and behavior

- Dark Japanese-inspired room: warm wood, charcoal plaster, plants, muted evening light.
- Yellow Mexican Strat, black pickguard, cream HSH pickups; four five-star Goodreads books; a small monochrome Nero flame.
- Portrait art direction and image-aligned hit areas for phones and tablets.
- Pointer movement is damped independently of frame rate. One full-screen draw call, no postprocessing, capped pixel density and a 2.6-million-pixel render budget.
- Animation stops while the tab is hidden, a dialog is open, motion is paused, or the user requests reduced motion. Pausing persists locally.
- The image, intro, contact link, and Nero link work before the renderer loads. Renderer failure falls back to the image; the ordinary HTML controls remain usable.
- Native dialogs support keyboard focus containment, Escape, close buttons, and backdrop dismissal.
- `paper.html` is preserved. The discontinued consumer app links were removed.

Book ratings were checked on Gabe’s public Goodreads profile (user 116748355). Book destinations are external Goodreads pages.

## Credits

Room artwork was generated from the approved visual direction and guitar reference. Depth artwork drives a small Three.js displacement; this is a fixed-view interactive scene, not a freely navigable 3D model. Icons are from Feather (MIT). Three.js is MIT licensed; bundled notices are retained in the generated JavaScript.
