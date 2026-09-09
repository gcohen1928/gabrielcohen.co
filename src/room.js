import guitarRegistration from './guitar-registration.json';
import { WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial, TextureLoader, SRGBColorSpace, Vector2, Vector3, Vector4, Matrix3, LinearFilter } from 'three';
import { coverUV, pixelRatio, damp, focusMotion } from './motion.js';
import { cameraTransform, cameraEase, detailViews } from './camera.js';
import { createWallPaint } from './wall.js';

export async function createRoom(container) {
  const room = document.querySelector('#room');
  const debug = new URLSearchParams(location.search).has('debug');
  const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power', depth: false, stencil: false });
  renderer.outputColorSpace = SRGBColorSpace;
  container.append(renderer.domElement);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, .01, 100);
  camera.position.z = 10;
  const mobile = matchMedia('(max-width: 700px), (max-aspect-ratio: 1/1)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const loader = new TextureLoader();
  let paint = createWallPaint(mobile.matches);
  const uniforms = {
    uImage: { value: null },uCleanBench:{value:null},uUnifiedBench:{value:null},
    uNeroSurface:{value:null},uNeroSurfaceReady:{value:0},uBooksSurface:{value:null},uBooksSurfaceReady:{value:0},uGuitarSurface:{value:null},uGuitarSurfaceReady:{value:0},uGuitarRegistration:{value:new Matrix3().set(...guitarRegistration)},
    uCover: { value: new Vector2(1, 1) },
    uCamera: { value: new Vector3(0, 0, 1) },
    uLanding: { value: new Vector3(0,0,1) },
    uDetail: { value: null }, uDetailMix: { value: 0 },
    uDetailCover: { value: new Vector2(1, 1) },
    uDetailCenter: { value: new Vector2(.5, .5) },
    uGuitar:{value:0},uFocusZoom:{value:1},uShelfPhoto:{value:0},
    uDrift:{value:new Vector2()},uDriftZoom:{value:1},
    uPaint:{value:paint.texture},uPaintBounds:{value:new Vector4()},uPaintMix:{value:0},
  };
  const material = new ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `precision highp float;
      uniform sampler2D uImage;
      uniform sampler2D uCleanBench;
      uniform sampler2D uUnifiedBench;
      uniform sampler2D uNeroSurface;
      uniform float uNeroSurfaceReady;
      uniform sampler2D uBooksSurface;
      uniform float uBooksSurfaceReady;
      uniform sampler2D uGuitarSurface;
      uniform float uGuitarSurfaceReady;
      uniform mat3 uGuitarRegistration;
      uniform vec2 uCover;
      uniform vec3 uCamera;
      uniform vec3 uLanding;
      uniform sampler2D uDetail;
      uniform float uDetailMix;
      uniform vec2 uDetailCover;
      uniform vec2 uDetailCenter;
      uniform float uGuitar;
      uniform float uFocusZoom;
      uniform float uShelfPhoto;
      uniform vec2 uDrift;
      uniform float uDriftZoom;
      uniform sampler2D uPaint;
      uniform vec4 uPaintBounds;
      uniform float uPaintMix;
      varying vec2 vUv;
      void main() {
        // Sample the source at the camera position, at native canvas resolution.
        vec2 base = ((vUv - 0.5 - uCamera.xy) / uCamera.z) * uCover + 0.5;
        gl_FragColor = texture2D(uImage, clamp(base, vec2(.002), vec2(.998)));
        // One registered surface stays attached to the room for every camera view.
        vec2 benchUV=vec2(base.x,1.-base.y);
        float cleanMask=1.;
        gl_FragColor.rgb=mix(gl_FragColor.rgb,texture2D(uCleanBench,base).rgb,cleanMask*uBooksSurfaceReady);
        vec3 registered=uGuitarRegistration*vec3(base.x,1.-base.y,1.);
        vec2 guitarUV=registered.xy/registered.z;
        float edge=smoothstep(0.,.12,guitarUV.x)*(1.-smoothstep(.88,1.,guitarUV.x))*smoothstep(0.,.045,guitarUV.y)*(1.-smoothstep(.955,1.,guitarUV.y));
        vec4 guitarColor=texture2D(uGuitarSurface,clamp(vec2(guitarUV.x,1.-guitarUV.y),.001,.999));
        gl_FragColor.rgb=mix(gl_FragColor.rgb,guitarColor.rgb,edge*uGuitarSurfaceReady);
        vec2 booksUV=(vec2(base.x,1.-base.y)-vec2(.477,.372))/vec2(.337,.313);
        // Follow the bottoms of the books instead of blending a rectangular tabletop.
        float bookFloor=booksUV.x<.37 ? .746 : (booksUV.x<.80 ? mix(.781,.802,clamp((booksUV.x-.37)/.40,0.,1.)) : .771);
        float bookEdge=smoothstep(.025,.039,booksUV.x)*(1.-smoothstep(.974,.987,booksUV.x))*smoothstep(.02,.17,booksUV.y)*(1.-smoothstep(bookFloor,bookFloor+.004,booksUV.y));
        vec3 booksColor=texture2D(uBooksSurface,clamp(vec2(booksUV.x,1.-booksUV.y),.001,.999)).rgb;
        // Keep the pale jacket in the same low light as the neighboring books.
        float jacket=smoothstep(.800,.817,booksUV.x)*(1.-smoothstep(.974,.986,booksUV.x))*smoothstep(.22,.242,booksUV.y)*(1.-smoothstep(.764,.785,booksUV.y));
        booksColor*=mix(1.,.78,jacket);
        // Contact shadows sit on the shared bench, independent of the source wood.
        float contactDistance=booksUV.y-bookFloor;
        float contactWidth=smoothstep(.032,.05,booksUV.x)*(1.-smoothstep(.971,.989,booksUV.x));
        float contactShadow=exp(-max(contactDistance,0.)*110.)*smoothstep(-.004,.003,contactDistance)*contactWidth;
        gl_FragColor.rgb*=1.-.64*contactShadow*uBooksSurfaceReady;
        gl_FragColor.rgb=mix(gl_FragColor.rgb,booksColor,bookEdge*uBooksSurfaceReady);
        vec2 neroUV=(vec2(base.x,1.-base.y)-vec2(.681,.461))/vec2(.22,.197);
        float neroEdge=smoothstep(.575,.60,neroUV.x)*(1.-smoothstep(.91,.99,neroUV.x))*smoothstep(0.,.08,neroUV.y)*(1.-smoothstep(.866,.890,neroUV.y));
        vec3 neroColor=texture2D(uNeroSurface,clamp(vec2(neroUV.x,1.-neroUV.y),.001,.999)).rgb;
        gl_FragColor.rgb=mix(gl_FragColor.rgb,neroColor,neroEdge*uNeroSurfaceReady);
        // One continuous photograph includes every book, the trophy and their shared tabletop.
        vec2 unifiedUV=(vec2(base.x,1.-base.y)-vec2(.42,.3574833))/vec2(.58,.3622498);
        float unifiedMask=smoothstep(0.,.035,unifiedUV.x)*smoothstep(0.,.10,unifiedUV.y)*(1.-smoothstep(.94,1.,unifiedUV.y));
        gl_FragColor.rgb=mix(gl_FragColor.rgb,texture2D(uUnifiedBench,clamp(vec2(unifiedUV.x,1.-unifiedUV.y),.001,.999)).rgb,unifiedMask*uBooksSurfaceReady);
        // Restore native sculpture detail above its contact edge; keep the unified tabletop.
        float sculptureDetail=smoothstep(.586,.615,neroUV.x)*(1.-smoothstep(.884,.923,neroUV.x))*smoothstep(.055,.105,neroUV.y)*(1.-smoothstep(.855,.875,neroUV.y));
        gl_FragColor.rgb=mix(gl_FragColor.rgb,neroColor,sculptureDetail*uNeroSurfaceReady);
        vec2 paintUV = (base-uPaintBounds.xy)/uPaintBounds.zw;
        float paintBounds=step(0.,paintUV.x)*step(paintUV.x,1.)*step(0.,paintUV.y)*step(paintUV.y,1.);
        float pigment=texture2D(uPaint,clamp(paintUV,0.,1.)).a*paintBounds*uPaintMix;
        float light=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
        vec3 ink=vec3(.85,.81,.69)*(.63+clamp(light*2.,0.,.37));
        gl_FragColor.rgb=mix(gl_FragColor.rgb,ink,pigment*.88);
        // Project the detailed surface into the same camera path as the room.
        vec2 landingUV=((vUv-.5-uCamera.xy)/uCamera.z)*uLanding.z+uLanding.xy;
        // The full guitar is a different composition, so do not scale its
        // headstock and body through the room's unrelated camera projection.
        landingUV=mix(landingUV,vUv-.5,uGuitar);
        vec2 detailUV = (landingUV-uDrift)/(uFocusZoom*uDriftZoom)*uDetailCover+uDetailCenter;
        vec2 sampleUV=clamp(detailUV,vec2(.001),vec2(.999));
        // Never reflect image coordinates: outside the frame is a quiet dark mat.
        float photoBounds=smoothstep(0.,.018,detailUV.x)*(1.-smoothstep(.982,1.,detailUV.x))*smoothstep(0.,.018,detailUV.y)*(1.-smoothstep(.982,1.,detailUV.y));
        vec4 closeColor=mix(vec4(.016,.014,.011,1.),texture2D(uDetail,sampleUV),photoBounds);
        vec3 neutral=closeColor.rgb*vec3(.86,.96,1.12);
        float luminance=dot(neutral,vec3(.2126,.7152,.0722));
        closeColor.rgb=mix(closeColor.rgb,mix(vec3(luminance),neutral,.86),uGuitar*photoBounds);
        gl_FragColor = mix(gl_FragColor, closeColor, uDetailMix);
        #include <colorspace_fragment>
      }`,
  });
  const geometry = new PlaneGeometry(2, 2);
  const backdrop=new Mesh(geometry, material);backdrop.renderOrder=-10;scene.add(backdrop);
  let textureVersion = 0;
  let imageAspect = 1500 / 1049;
  let loaded = false;
  let paused = false;
  let lost = false;
  let raf = 0;
  let previous = 0;
  let elapsed = 0;
  const pointerTarget = new Vector2(), pointerNow = new Vector2();
  let width = 1;
  let height = 1;
  let view = 'home', flight, detailReady = false, detailVersion = 0, wasDetail=false, requestVersion=0;
  const detailCache = new Map();
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
    if (diagnostic) diagnostic.textContent = `Three.js · ${state}\n${lastStats}\nrender ${renderer.domElement.width}×${renderer.domElement.height}\nlong tasks: ${longTasks} · errors: ${errors}\nLCP: ${Math.round(lcp)} ms · CLS: ${cls.toFixed(3)}\nframes: ${frames}`;
  }
  function resize() {
    // Camera transforms must not change the render budget or pointer coordinates.
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(pixelRatio(width, height, devicePixelRatio));
    renderer.setSize(width, height, false);
    uniforms.uCover.value.set(...coverUV(width, height, imageAspect));
    camera.left=-width/height;camera.right=width/height;camera.updateProjectionMatrix();
    const t = cameraTransform(view, width, height, mobile.matches);
    uniforms.uCamera.value.set(t.x / width, -t.y / height, t.scale);
    if(detailViews.includes(view))uniforms.uLanding.value.copy(uniforms.uCamera.value);
    flight = null;
    const r=paint.rect;
    uniforms.uPaintBounds.value.set(r.x,1-r.y-r.h,r.w,r.h);
    paint.placeLinks(width,height,uniforms.uCover.value,uniforms.uCamera.value,uniforms.uPaintMix.value);
    frameDetail();
    placeTV();
    if (loaded && !lost) renderer.render(scene, camera);
  }
  async function textures() {
    const version = ++textureVersion;
    const mode = mobile.matches ? 'mobile' : 'desktop';
    container.classList.remove('ready');
    const color = await loader.loadAsync(`/assets/room-${mode}.webp`);
    if(!uniforms.uUnifiedBench.value){
      const surface=await loader.loadAsync('/assets/bench-unified.webp');surface.colorSpace=SRGBColorSpace;renderer.initTexture(surface);uniforms.uUnifiedBench.value=surface;
    }
    if(!uniforms.uCleanBench.value){
      const plate=await loader.loadAsync('/assets/room-clean-bench.webp');plate.colorSpace=SRGBColorSpace;renderer.initTexture(plate);uniforms.uCleanBench.value=plate;
    }
    if(!uniforms.uGuitarSurface.value){
      const surface=await loader.loadAsync('/assets/guitar-surface.webp');surface.colorSpace=SRGBColorSpace;
      renderer.initTexture(surface);uniforms.uGuitarSurface.value=surface;
    }
    if(!uniforms.uBooksSurface.value){
      const surface=await loader.loadAsync('/assets/books-surface.webp');surface.colorSpace=SRGBColorSpace;
      renderer.initTexture(surface);uniforms.uBooksSurface.value=surface;
    }
    if(!uniforms.uNeroSurface.value){
      const surface=await loader.loadAsync('/assets/detail-nero.webp');surface.colorSpace=SRGBColorSpace;
      renderer.initTexture(surface);uniforms.uNeroSurface.value=surface;
    }
    uniforms.uNeroSurfaceReady.value=mobile.matches?0:1;
    uniforms.uBooksSurfaceReady.value=mobile.matches?0:1;
    uniforms.uGuitarSurfaceReady.value=mobile.matches?0:1;
    if (version !== textureVersion) { color.dispose(); return; }
    color.colorSpace = SRGBColorSpace;
    color.minFilter = color.magFilter = LinearFilter;
    color.generateMipmaps = false;
    if (uniforms.uDetail.value === uniforms.uImage.value) uniforms.uDetail.value = color;
    uniforms.uImage.value?.dispose();
    uniforms.uImage.value = color;
    if (!uniforms.uDetail.value) uniforms.uDetail.value = color;
    imageAspect = color.image.width / color.image.height;
    loaded = true;
    resize();
    container.classList.add('ready');
    room.dataset.renderer = 'webgl';
    start();
  }
  function tick(now) {
    raf = 0;
    if (document.hidden || lost || !loaded) { status(); return; }
    const interval = previous ? now - previous : 16.67;
    previous = now;
    const dt = Math.min(interval/1000,.05);
    let progress = 1;
    if (flight) {
      progress = Math.min(1, (now - flight.start) / 1400);
      const ease = cameraEase(progress);
      // Interpolate magnification logarithmically for a steady camera push.
      const scale = Math.exp(Math.log(flight.from.z) * (1-ease) + Math.log(flight.to.z) * ease);
      const travel = Math.abs(flight.to.z-flight.from.z) < .001 ? ease : (scale-flight.from.z)/(flight.to.z-flight.from.z);
      uniforms.uCamera.value.lerpVectors(flight.from, flight.to, travel);
      uniforms.uCamera.value.z = scale;
      if (progress === 1) flight = null;
    }
    const entering=detailViews.includes(view)&&mobile.matches;
    const detailTarget=entering?(detailReady?cameraEase(progress):0):(wasDetail&&flight?flight.fromMix*(1.-cameraEase(progress)):0);
    uniforms.uDetailMix.value=detailTarget;
    uniforms.uPaintMix.value=damp(uniforms.uPaintMix.value,view==='about'?1:0,dt,7);
    if (Math.abs(uniforms.uPaintMix.value-(view==='about'?1:0))<.001) uniforms.uPaintMix.value=view==='about'?1:0;
    if(!paused&&!reduced.matches&&entering){
      elapsed+=dt;
      pointerNow.x=damp(pointerNow.x,pointerTarget.x,dt,4.5);
      pointerNow.y=damp(pointerNow.y,pointerTarget.y,dt,4.5);
      const motion=focusMotion(pointerNow.x,pointerNow.y,elapsed);
      const strength=cameraEase(progress);
      uniforms.uDrift.value.set(motion.x*strength,motion.y*strength);
      uniforms.uDriftZoom.value=1+(motion.zoom-1)*strength;
    }
    if(view==='about'||uniforms.uPaintMix.value>0)paint.placeLinks(width,height,uniforms.uCover.value,uniforms.uCamera.value,uniforms.uPaintMix.value);
    placeTV(progress);
    placeBooks();
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
    if (flight || (!paused&&!reduced.matches&&entering) || uniforms.uPaintMix.value!==(view==='about'?1:0)) raf = requestAnimationFrame(tick);
    else { previous=0;intervals=[];sampleStart=0;status(paused?'paused':'still'); }
  }
  function stop() {
    cancelAnimationFrame(raf); raf = 0; previous = 0;
    intervals = []; sampleStart = 0;
    status();
  }
  function start() {
    if (!raf && loaded && !document.hidden && !lost) raf = requestAnimationFrame(tick);
    status();
  }
  const pointer = event => {
    if(event.pointerType!=='mouse')return;
    const rect=container.getBoundingClientRect();
    pointerTarget.set((event.clientX-rect.left)/width*2-1,1-(event.clientY-rect.top)/height*2);
  };
  const leave = () => pointerTarget.set(0,0);
  const visibility = () => { if (document.hidden) stop(); else start(); };
  const modeChange = () => {
    paint.dispose();paint=createWallPaint(mobile.matches);uniforms.uPaint.value=paint.texture;
    detailReady = false;
    uniforms.uDetailMix.value = 0;
    textures().then(activateDetail).catch(() => { container.classList.remove('ready'); room.dataset.renderer = 'static'; stop(); });
  };
  const lostContext = event => { event.preventDefault(); lost = true; container.classList.remove('ready'); room.dataset.renderer = 'static'; stop(); status('static fallback'); };
  const restoreContext = () => { lost = false; resize(); container.classList.add('ready'); room.dataset.renderer = 'webgl'; start(); };
  function frameDetail() {
    const tex = uniforms.uDetail.value;
    if (!tex?.image) return;
    const aspect = tex.image.width / tex.image.height;
    // Fit the complete photograph with breathing room at every aspect ratio.
    const viewportAspect=width/height;
    const fit=.90;
    uniforms.uDetailCover.value.set(
      Math.max(1,viewportAspect/aspect)/fit,
      Math.max(1,aspect/viewportAspect)/fit
    );
    uniforms.uDetailCenter.value.set(.5,.5);
  }

  function placeTV(progress=1){
    const overlay=document.querySelector('#music-controls');
    if(view!=='tv'){
      if(document.querySelector('#room').classList.contains('tv-exiting')){
        const ease=cameraEase(progress);
        overlay.style.opacity=String(1-cameraEase(Math.min(1,progress/.85)));
        overlay.style.transform=`scale(${1-.22*ease})`;
      }
      return;
    }
    overlay.style.opacity='1';overlay.style.transform='none';
    const w=Math.min(width*.94,(height-130)*1424/1104),h=w*1104/1424;
    const left=(width-w)/2,top=Math.max(35,(height-h-80)/2);
    const reveal=cameraEase(Math.max(0,(progress-.45)/.55));
    const controls=document.querySelector('.tv-controls');
    controls.style.top=`${top+h*.90}px`;
    controls.classList.toggle('settled',progress>=1);
    document.querySelector('#tv-closeup').style.cssText=`left:${left}px;top:${top}px;width:${w}px;height:${h}px;opacity:${reveal}`;
    document.querySelector('#tv-video').style.cssText=`left:${left+w*.151}px;top:${top+h*.214}px;width:${w*.510}px;height:${h*.518}px;opacity:${reveal}`;
  }
  function placeBooks(){
    if(view!=='books')return;
    const boxes=mobile.matches?[[.026,.473,.21,.263],[.235,.48,.128,.256],[.363,.477,.162,.202],[.291,.724,.52,.035],[.525,.472,.153,.207],[.678,.48,.15,.199],[.301,.681,.52,.042],[.828,.483,.148,.26]]:[[.038,.22,.19,.523],[.227,.245,.134,.39],[.362,.23,.155,.403],[.370,.717,.42,.086],[.505,.203,.17,.433],[.675,.22,.133,.417],[.394,.636,.398,.08],[.803,.23,.17,.547]];
    if(!mobile.matches){
      const c=uniforms.uCamera.value,cover=uniforms.uCover.value;
      const project=(x,y)=>[((.477+x*.337-.5)/cover.x*c.z+c.x+.5)*width,((.372+y*.313-.5)/cover.y*c.z-c.y+.5)*height];
      document.querySelectorAll('.book-target').forEach((button,i)=>{const [x,y,w,h]=boxes[i],a=project(x,y),b=project(x+w,y+h);button.style.cssText=`left:${a[0]}px;top:${a[1]}px;width:${b[0]-a[0]}px;height:${b[1]-a[1]}px;pointer-events:${flight?'none':'auto'}`;});
      return;
    }
    const zoom=uniforms.uFocusZoom.value*uniforms.uDriftZoom.value;
    const c=uniforms.uCamera.value,l=uniforms.uLanding.value,cover=uniforms.uDetailCover.value,d=uniforms.uDrift.value;
    const project=(x,y)=>[(((x-.5)/cover.x*zoom+d.x-l.x)/l.z*c.z+c.x+.5)*width,(.5-(((.5-y)/cover.y*zoom+d.y-l.y)/l.z*c.z+c.y))*height];
    document.querySelectorAll('.book-target').forEach((button,i)=>{const [x,y,w,h]=boxes[i],a=project(x,y),b=project(x+w,y+h);button.style.cssText=`left:${a[0]}px;top:${a[1]}px;width:${b[0]-a[0]}px;height:${b[1]-a[1]}px;pointer-events:${uniforms.uDetailMix.value>.98?'auto':'none'}`;});
  }

  function preloadDetail(name) {
    if (!detailViews.includes(name)) return Promise.resolve(null);
    const key = `${name}${mobile.matches ? '-mobile' : ''}`;
    if (!detailCache.has(key)) {
      const promise = loader.loadAsync(`/assets/detail-${key}.webp`).then(tex => {
        tex.colorSpace = SRGBColorSpace;
        tex.minFilter = tex.magFilter = LinearFilter;
        tex.generateMipmaps = false;
        // Upload before the transition starts, rather than on its first visible frame.
        renderer.initTexture(tex);
        return tex;
      }).catch(error => { detailCache.delete(key); throw error; });
      detailCache.set(key, promise);
    }
    return detailCache.get(key);
  }
  function activateDetail() {
    detailReady = false;
    const version = ++detailVersion;
    if (detailViews.includes(view)) preloadDetail(view).then(tex => {
      if (version !== detailVersion) return;
      uniforms.uDetail.value = tex;
      uniforms.uFocusZoom.value = 1;uniforms.uGuitar.value=view==='guitar'?1:0;
      uniforms.uShelfPhoto.value = view === 'books' ? 1 : 0;
      detailReady = true;
      frameDetail();
      start();
    }).catch(() => { /* Keep the original room available if a detail image fails. */ });
  }
  async function setView(next, immediate = false) {
    const request = ++requestVersion;
    if (next === view && !immediate) return;
    if (detailViews.includes(next)) {
      try { await preloadDetail(next); } catch { /* The original room remains usable. */ }
      if (request !== requestVersion) return;
    }
    const changed = next !== view;
    if(changed)wasDetail=uniforms.uDetailMix.value>0;
    if(changed&&detailViews.includes(next)){uniforms.uDrift.value.set(0,0);uniforms.uDriftZoom.value=1;pointerNow.set(0,0);elapsed=0;}
    view = next;
    const t = cameraTransform(view, width, height, mobile.matches);
    const to = new Vector3(t.x / width, -t.y / height, t.scale);
    if(detailViews.includes(view))uniforms.uLanding.value.copy(to);
    if (immediate || reduced.matches || paused) { uniforms.uCamera.value.copy(to); flight = null; }
    else flight = {from:uniforms.uCamera.value.clone(), to, fromMix:uniforms.uDetailMix.value, start:performance.now()};
    if (changed) activateDetail();
    frameDetail();
    start();
  }
  window.addEventListener('pointermove',pointer,{passive:true});
  document.documentElement.addEventListener('pointerleave',leave,{passive:true});
  document.addEventListener('visibilitychange', visibility);
  mobile.addEventListener('change', modeChange);
  renderer.domElement.addEventListener('webglcontextlost', lostContext);
  renderer.domElement.addEventListener('webglcontextrestored', restoreContext);
  const resizer = new ResizeObserver(resize);
  resizer.observe(container);
  try { await textures();start();for(const name of detailViews)preloadDetail(name).catch(()=>{}); } catch (error) {
    window.removeEventListener('pointermove',pointer);document.documentElement.removeEventListener('pointerleave',leave);paint.dispose();
    renderer.dispose(); geometry.dispose(); material.dispose(); container.replaceChildren(); resizer.disconnect(); observer?.disconnect(); diagnostic?.remove();
    document.removeEventListener('visibilitychange', visibility); mobile.removeEventListener('change', modeChange);
    throw error;
  }
  return {
    setPaused(value) { paused = value; start(); },
    setView,
    preloadDetail,
  };
}
