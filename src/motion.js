export const damp = (current, target, elapsed, speed = 5.5) => current + (target - current) * (1 - Math.exp(-speed * elapsed));
export function coverUV(width, height, imageAspect) {
  const aspect = width / height;
  return aspect > imageAspect ? [1, imageAspect / aspect] : [aspect / imageAspect, 1];
}
export function pixelRatio(width, height, deviceRatio) {
  return Math.min(deviceRatio || 1, 1.5, Math.sqrt(2_600_000 / (width * height)));
}
