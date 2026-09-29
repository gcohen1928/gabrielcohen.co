# gabrielcohen.co

Gabe Cohen’s personal site. A plain, readable text column next to one interactive drawing: a dithered 1-bit torus lit by the cursor. Canvas + vanilla JS, no libraries, no build step.

- `index.html`: the homepage, self-contained (inline CSS and JS)
- `photos.html`: photos (not linked from the homepage)
- `paper.html`: the 2022 TUM research write-up
- `assets/site.css`: styles for the photos and paper pages
- `assets/fonts/`: Source Serif 4 and Martian Mono, both SIL Open Font License

## Development

Requires Node.js 22 or newer.

```sh
npm run dev    # http://localhost:4173
npm test       # checks local links, anchors, image alt text and sizes
```

## Publishing

Cloudflare Pages serves the repository root from `main`. Commit and push; there is nothing to build.
