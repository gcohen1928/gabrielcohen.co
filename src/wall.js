import { CanvasTexture, LinearFilter } from 'three';

// The visible lettering is part of the room shader. Keep its source text in the
// document so it stays selectable by assistive technology and editable in HTML.
export function createWallPaint(mobile) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = mobile ? 2600 : 1040;
  const ctx = canvas.getContext('2d');
  const section = document.querySelector('#about-view');
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  ctx.font = `${mobile ? 126 : 112}px Georgia`;
  ctx.fillText(section.querySelector('h2').textContent, 8, 8);
  let y = mobile ? 200 : 177;
  const size = mobile ? 74 : 56;
  ctx.font = `${size}px Arial`;
  for (const p of section.querySelectorAll(':scope > p')) {
    let line = '';
    for (const word of p.textContent.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > canvas.width - 30 && line) {
        ctx.fillText(line, 8, y);
        y += size * 1.7;
        line = word;
      } else line = next;
    }
    ctx.fillText(line, 8, y);
    y += size * 1.7 + (mobile ? 48 : 52);
  }
  // Fine gaps in the pigment let the actual wall texture show through.
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let seed = 17;
  for (let i = 3; i < pixels.data.length; i += 4) {
    if (!pixels.data[i]) continue;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    pixels.data[i] *= .72 + (seed / 4294967296) * .28;
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  // Source-image coordinates measured from the top-left corner.
  const rect = mobile ? { x: .40, y: .19, w: .40, h: .34 } : { x: .485, y: .115, w: .34, h: .34 * (1500 / 1049) * (1040 / 2048) };
  const links = section.querySelector('.links');
  return {
    texture, rect,
    placeLinks(width, height, cover, camera, opacity) {
      const scale = rect.w / cover.x * width * camera.z / canvas.width;
      const x = (((rect.x - .5) / cover.x) * camera.z + camera.x + .5) * width;
      const sourceY = rect.y + y / canvas.height * rect.h;
      const top = (((sourceY - .5) / cover.y) * camera.z - camera.y + .5) * height;
      links.style.cssText = `position:fixed;left:${x}px;top:${top}px;width:2048px;max-width:none;margin:0;gap:65px;transform-origin:0 0;transform:scale(${scale});opacity:${opacity};pointer-events:${opacity > .8 ? 'auto' : 'none'}`;
    },
    dispose() { texture.dispose(); links.style.cssText = ''; },
  };
}
