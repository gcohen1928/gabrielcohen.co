export const damp = (current, target, elapsed, speed = 5.5) => current + (target - current) * (1 - Math.exp(-speed * elapsed));
export function coverUV(width, height, imageAspect) {
  const aspect = width / height;
  return aspect > imageAspect ? [1, imageAspect / aspect] : [aspect / imageAspect, 1];
}
export function pixelRatio(width, height, deviceRatio) {
  return Math.min(deviceRatio || 1, 2, Math.sqrt(4_000_000 / (width * height)));
}

// Translate the whole close-up like a small camera move. No depth displacement,
// stretching, or per-pixel deformation. Overscan keeps the image edges offscreen.
export function focusMotion(x, y, seconds) {
  return {
    x: Math.max(-1, Math.min(1, x)) * .009 + Math.sin(seconds * .33) * .002,
    y: Math.max(-1, Math.min(1, y)) * .006 + Math.sin(seconds * .27) * .0015,
    zoom: 1.045 + Math.sin(seconds * .19) * .002,
  };
}
