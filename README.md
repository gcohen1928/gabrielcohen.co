# gabrielcohen.co

Gabe Cohen’s personal site. The homepage is a guitar tab: six strings (e B G D A E) with a line of bio on each. Move the cursor or a finger across them to pluck; the words ride the strings. `sound: on` plays each string (Karplus–Strong, synthesized in the browser, no audio files). No build step.

- `index.html`: the homepage, self-contained (inline CSS and ~150 lines of JS)
- `photos.html`: photos (not linked from the homepage)
- `paper.html`: the 2022 TUM research write-up
- `assets/site.css`: styles for the photos and paper pages
- `assets/fonts/`: Martian Mono (homepage) and Source Serif 4 (other pages), both SIL Open Font License

## Development

Requires Node.js 22 or newer.

```sh
npm run dev    # http://localhost:4173
npm test       # checks local links, anchors, image alt text and sizes
```

## Publishing

Cloudflare Pages serves the repository root from `main`. Commit and push; there is nothing to build.
