import './styles.css';

const motionButton = document.querySelector('#motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
try { userPaused = localStorage.getItem('room-motion') === 'paused'; } catch { /* Storage is optional. */ }
let scene;
let opening = false;
let lastOpener;

function syncMotion() {
  const paused = userPaused || reduced.matches;
  motionButton.textContent = paused ? 'resume motion' : 'pause motion';
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.hidden = reduced.matches || !scene;
  scene?.setPaused(paused || !!document.querySelector('dialog[open]'));
}

for (const opener of document.querySelectorAll('[data-open]')) {
  opener.addEventListener('click', () => {
    const dialog = document.getElementById(opener.dataset.open);
    if (!dialog || dialog.open) return;
    lastOpener = opener;
    dialog.showModal();
    syncMotion();
  });
}
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  let beganOutside = false;
  const outside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { beganOutside = outside(event); });
  dialog.addEventListener('click', event => { if (beganOutside && outside(event)) dialog.close(); });
  dialog.addEventListener('close', () => { syncMotion(); lastOpener?.focus({ preventScroll: true }); });
}
motionButton.addEventListener('click', () => {
  userPaused = !userPaused;
  try { localStorage.setItem('room-motion', userPaused ? 'paused' : 'active'); } catch { /* Storage is optional. */ }
  syncMotion();
});
async function start() {
  if (reduced.matches || opening || scene) return;
  opening = true;
  try {
    const { createRoom } = await import('./room.js');
    scene = await createRoom(document.querySelector('#room-canvas'), document.querySelector('#room-image'));
    syncMotion();
  } catch (error) {
    // The real image and all HTML links remain usable when WebGL is unavailable.
    document.querySelector('#room-canvas').classList.remove('ready');
    document.querySelector('#room').dataset.renderer = 'static';
    if (new URLSearchParams(location.search).has('debug')) console.warn('Room uses static fallback:', error);
  } finally { opening = false; }
}
reduced.addEventListener('change', () => { syncMotion(); if (!reduced.matches) start(); });
// The poster is the first paint. Defer the optional renderer until the browser is idle.
if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
else setTimeout(start, 100);
