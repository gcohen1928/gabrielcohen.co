import { coverUV } from './motion.js';
const views={
  desktop:{tv:[.144,.555,4.3,.5,.48],home:[.5,.5,1,.5,.5],guitar:[.46,.45,1.20,.5,.5],books:[.648,.535,2.65,.5,.47],nero:[.843,.552,4.6,.29,.56],about:[.7075,.37,1.35,.50,.51]},
  mobile:{tv:[.112,.66,4.0,.5,.48],home:[.5,.5,1,.5,.5],guitar:[.46,.55,1,.5,.66],books:[.605,.649,3.25,.50,.618],nero:[.765,.65,4.2,.65,.65],about:[.60,.37,1.55,.50,.46]},
};
export const detailViews = ['books', 'nero'];
export const cameraEase = progress => {const p=Math.max(0,Math.min(1,progress));return p*p*p*(p*(p*6-15)+10);};
export function cameraTransform(mode,width,height,mobile){
  const shot=views[mobile?'mobile':'desktop'][mode]||views.desktop.home;
  const [x,y,requestedScale,sx,sy]=shot;
  const [cx,cy]=coverUV(width,height,mobile?2/3:1500/1049);
  const scale=mode==='books'&&!mobile?Math.min(requestedScale,.86*cx/.33,.67*cy/.20):mode==='tv'?Math.min(requestedScale,.72*cx/(mobile?.17:.14),.68*cy/(mobile?.08:.15)):mode==='about'?Math.min(requestedScale, .76*cx/(mobile?.40:.415)):requestedScale;
  const boundX=(scale/((mode==='tv'||mode==='nero')?cx:1)-1)*width/2,boundY=(scale/(mode==='tv'?cy:1)-1)*height/2;
  const clamp=(n,b)=>Math.max(-b,Math.min(b,n));
  return {x:clamp((sx-.5)*width-(x-.5)/cx*width*scale,boundX),y:clamp((sy-.5)*height-(y-.5)/cy*height*scale,boundY),scale};
}
