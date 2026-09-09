import { coverUV } from '../src/motion.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraTransform } from '../src/camera.js';

test('focused camera keeps the room covering the viewport at every transition point', () => {
  for (const [width, height, mobile] of [[1500,1049,false],[1920,1080,false],[844,390,false],[390,844,true],[768,1024,true],[320,600,true]]) {
    const views = ['home','guitar','books','nero','about'].map(mode => cameraTransform(mode,width,height,mobile));
    views.push(...Array.from({length:8},(_,index)=>cameraTransform('books',width,height,mobile,index)));
    for (const from of views) for (const to of views) for (const progress of [0,.1,.3,.5,.8,1]) {
      const lerp = key => from[key] + (to[key] - from[key]) * progress;
      const x = lerp('x'), y = lerp('y'), scale = lerp('scale');
      assert.ok(Math.abs(x) <= (scale-1)*width/2 + 1e-8);
      assert.ok(Math.abs(y) <= (scale-1)*height/2 + 1e-8);
    }
    assert.deepEqual(cameraTransform('home',width,height,mobile), {x:0,y:0,scale:1});
  }
});

test('the entire television fits with breathing room across viewport shapes', async () => {
  const { coverUV } = await import('../src/motion.js');
  for (const [width,height,mobile] of [[1554,1058,false],[1920,1080,false],[1030,960,false],[844,390,false],[390,844,true],[768,1024,true]]) {
    const c=cameraTransform('tv',width,height,mobile);
    const [cx,cy]=coverUV(width,height,mobile?2/3:1500/1049);
    const bounds=mobile?[.02,.185,.623,.699]:[.076,.214,.484,.636];
    for(const x of bounds.slice(0,2)){
      const screen=(x-.5)/cx*c.scale+.5+c.x/width;
      assert.ok(screen>.04&&screen<.96,`TV horizontal edge ${screen} at ${width}x${height}`);
    }
    for(const y of bounds.slice(2)){
      const screen=(y-.5)/cy*c.scale+.5+c.y/height;
      assert.ok(screen>.04&&screen<.96,`TV vertical edge ${screen} at ${width}x${height}`);
    }
  }
});


test('the complete registered bookshelf stays inside the desktop frame',()=>{
 for(const [width,height] of [[1573,1284],[1280,720],[1920,1080],[1024,1000],[844,390]]){
  const t=cameraTransform('books',width,height,false);
  const [cx,cy]=coverUV(width,height,1500/1049);
  for(const x of [.488,.808]){
   const screen=(x-.5)/cx*t.scale+.5+t.x/width;
   assert.ok(screen>.035&&screen<.965,`horizontal edge ${screen} at ${width}x${height}`);
  }
  for(const y of [.434,.628]){
   const screen=(y-.5)/cy*t.scale+.5+t.y/height;
   assert.ok(screen>.08&&screen<.85,`vertical edge ${screen} at ${width}x${height}`);
  }
 }
});
