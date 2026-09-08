import { WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial, TextureLoader, SRGBColorSpace, Vector2, LinearFilter } from 'three';
import { damp, coverUV, pixelRatio } from './motion.js';

export async function createRoom(container) {
  const room = document.querySelector('#room');
  const debug = new URLSearchParams(location.search).has('debug');
  const renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power', depth: false, stencil: false });
  renderer.outputColorSpace = SRGBColorSpace;
  container.append(renderer.domElement);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const mobile = matchMedia('(max-width: 700px), (max-aspect-ratio: 1/1)');
  const loader = new TextureLoader();
  const uniforms = {
    uImage: { value: null }, uDepth: { value: null },
    uCover: { value: new Vector2(1, 1) }, uMouse: { value: new Vector2() },
    uTime: { value: 0 }, uMobile: { value: mobile.matches ? 1 : 0 },
  };
  const material = new ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `precision highp float;
      uniform sampler2D uImage;
      uniform sampler2D uDepth;
      uniform vec2 uCover;
      uniform vec2 uMouse;
      uniform float uTime;
      uniform float uMobile;
      varying vec2 vUv;
      void main() {
        vec2 base = (vUv - 0.5) * uCover + 0.5;
        float depth = texture2D(uDepth, base).r;
        // Very small displacement keeps the photograph's silhouettes intact.
        vec2 movement = uMouse * vec2(0.012, 0.008);
        movement += vec2(sin(uTime * 0.21), cos(uTime * 0.17)) * 0.00065;
        vec2 uv = base + movement * (depth - 0.12);
        // Foreground foliage has a barely perceptible independent sway.
        float leaf = smoothstep(0.78, 0.95, depth) * (1.0 - smoothstep(0.18, 0.40, base.x));
        uv.x += sin(uTime * 0.6 + base.y * 4.0) * 0.00035 * leaf;
        gl_FragColor = texture2D(uImage, clamp(uv, vec2(0.002), vec2(0.998)));
        #include <colorspace_fragment>
      }`,
  });
  const geometry = new PlaneGeometry(2, 2);
  scene.add(new Mesh(geometry, material));
  let textureVersion = 0;
  let imageAspect = 1500 / 1049;
  let loaded = false;
  let paused = false;
  let lost = false;
  let raf = 0;
  let previous = 0;
  let elapsed = 0;
  let width = 1;
  let height = 1;
  let targetX = 0;
  let targetY = 0;
  let diagnostic;
  let intervals = [];
  let frames = 0;
  let sampleStart = 0;
  let lastStats = 'measuring…';
  let longTasks = 0;
  let errors = 0;
  let lcp = 0;
  let cls = 0;
  let vitals;
  const onError = () => { errors++; status(); };
  let observer;
  if (debug) {
    diagnostic = document.createElement('output');
    diagnostic.className = 'diagnostics';
    diagnostic.setAttribute('aria-label', 'Room performance');
    document.body.append(diagnostic);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    if ('PerformanceObserver' in window) {
      try { observer = new PerformanceObserver(list => { longTasks += list.getEntries().length; }); observer.observe({ type: 'longtask', buffered: true });
        vitals = new PerformanceObserver(list => { for (const entry of list.getEntries()) { if (entry.entryType === 'largest-contentful-paint') lcp = entry.startTime; if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) cls += entry.value; } });
        vitals.observe({ type: 'largest-contentful-paint', buffered: true });
        vitals.observe({ type: 'layout-shift', buffered: true }); } catch { /* Not supported in every browser. */ }
    }
  }
  function status(state = paused ? 'paused' : document.hidden ? 'hidden' : 'running') {
    room.dataset.motion = state;
    if (diagnostic) diagnostic.textContent = `Three.js · ${state}\n${lastStats}\nrender ${renderer.domElement.width}×${renderer.domElement.height}\nlong tasks: ${longTasks} · errors: ${errors}\nLCP: ${Math.round(lcp)} ms · CLS: ${cls.toFixed(3)}\nmouse: ${uniforms.uMouse.value.x.toFixed(2)}, ${uniforms.uMouse.value.y.toFixed(2)}\nframes: ${frames}`;
  }
  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setPixelRatio(pixelRatio(width, height, devicePixelRatio));
    renderer.setSize(width, height, false);
    uniforms.uCover.value.set(...coverUV(width, height, imageAspect));
    if (loaded && !lost) renderer.render(scene, camera);
  }
  async function textures() {
    const version = ++textureVersion;
    const mode = mobile.matches ? 'mobile' : 'desktop';
    container.classList.remove('ready');
    const [color, depth] = await Promise.all([
      loader.loadAsync(`/assets/room-${mode}.webp`),
      loader.loadAsync(`/assets/depth-${mode}.webp`),
    ]);
    if (version !== textureVersion) { color.dispose(); depth.dispose(); return; }
    color.colorSpace = SRGBColorSpace;
    for (const tex of [color, depth]) { tex.minFilter = LinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = false; }
    uniforms.uImage.value?.dispose(); uniforms.uDepth.value?.dispose();
    uniforms.uImage.value = color; uniforms.uDepth.value = depth;
    imageAspect = color.image.width / color.image.height;
    uniforms.uMobile.value = mobile.matches ? 1 : 0;
    loaded = true;
    resize();
    container.classList.add('ready');
    room.dataset.renderer = 'webgl';
    start();
  }
  function tick(now) {
    raf = 0;
    if (paused || document.hidden || lost || !loaded) { status(); return; }
    const interval = previous ? now - previous : 16.67;
    const dt = Math.min(interval / 1000, 0.05);
    previous = now;
    elapsed += dt;
    uniforms.uTime.value = elapsed;
    uniforms.uMouse.value.x = damp(uniforms.uMouse.value.x, targetX, dt);
    uniforms.uMouse.value.y = damp(uniforms.uMouse.value.y, targetY, dt);
    renderer.render(scene, camera);
    frames++;
    if (debug) {
      if (!sampleStart) sampleStart = now;
      intervals.push(interval);
      if (now - sampleStart >= 5000) {
        const sorted = [...intervals].sort((a, b) => a - b);
        const fps = Math.round(intervals.length * 1000 / (now - sampleStart));
        lastStats = `${fps} fps · p95 ${sorted[Math.floor(sorted.length * .95)].toFixed(1)} ms`;
        intervals = []; sampleStart = now;
      }
      if (frames % 15 === 0) status();
    }
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(raf); raf = 0; previous = 0;
    intervals = []; sampleStart = 0;
    status();
  }
  function start() {
    if (!raf && loaded && !paused && !document.hidden && !lost) raf = requestAnimationFrame(tick);
    status();
  }
  const pointer = event => {
    if (event.pointerType !== 'mouse') return;
    targetX = Math.max(-1, Math.min(1, event.clientX / width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, -(event.clientY / height * 2 - 1)));
  };
  const leave = () => { targetX = 0; targetY = 0; };
  const visibility = () => { if (document.hidden) stop(); else start(); };
  const modeChange = () => { textures().catch(() => { container.classList.remove('ready'); room.dataset.renderer = 'static'; stop(); }); };
  const lostContext = event => { event.preventDefault(); lost = true; container.classList.remove('ready'); room.dataset.renderer = 'static'; stop(); status('static fallback'); };
  const restoreContext = () => { lost = false; resize(); container.classList.add('ready'); room.dataset.renderer = 'webgl'; start(); };
  window.addEventListener('pointermove', pointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  mobile.addEventListener('change', modeChange);
  renderer.domElement.addEventListener('webglcontextlost', lostContext);
  renderer.domElement.addEventListener('webglcontextrestored', restoreContext);
  const resizer = new ResizeObserver(resize);
  resizer.observe(container);
  try { await textures(); } catch (error) {
    renderer.dispose(); geometry.dispose(); material.dispose(); container.replaceChildren(); resizer.disconnect(); observer?.disconnect(); diagnostic?.remove();
    window.removeEventListener('pointermove', pointer); document.documentElement.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility); mobile.removeEventListener('change', modeChange);
    throw error;
  }
  return {
    setPaused(value) { paused = value; if (paused) stop(); else start(); },
  };
}
