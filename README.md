# gabrielcohen.co

Gabe Cohen’s personal site. Plain HTML and one stylesheet: no JavaScript, no build step.

- `index.html`: the whole homepage (now, before, reading, guitar, photos, contact)
- `photos.html`: full-size photos; the homepage grid links to each by id
- `paper.html`: the 2022 TUM research write-up
- `assets/site.css`: shared styles, light and dark
- `assets/photos/`: originals (1600px); `assets/photos/small/` holds the 800px grid versions
- `assets/fonts/`: Source Serif 4, variable (SIL Open Font License, see `OFL.txt`)

## Development

Requires Node.js 22 or newer.

```sh
npm run dev    # http://localhost:4173
npm test       # checks local links, anchors, image alt text and sizes
```

## Adding a photo

1. Put a 1600px-wide WebP in `assets/photos/` and an 800px copy in `assets/photos/small/`.
2. Add a `<figure id="NAME">` to `photos.html` and a thumbnail link to the grid in `index.html`, both with real alt text.

## Publishing

Cloudflare Pages serves the repository root from `main`. Commit and push; there is nothing to build.
