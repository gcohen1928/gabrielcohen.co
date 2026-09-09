import { CanvasTexture, SRGBColorSpace } from 'three';

// Typeset the narrow spine labels at double resolution in the shelf's own UV space.
export function createSpineLettering() {
  const canvas=document.createElement('canvas');canvas.width=3794;canvas.height=1658;
  const ctx=canvas.getContext('2d');ctx.scale(2,2);
  const label=(x,y,w,h,bg,ink,title,size=11)=>{
    ctx.save();ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);
    ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI/2);
    ctx.font=`600 ${size}px Georgia`;ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(title,0,0,h-8);ctx.restore();
  };
  label(231,235,19,276,'#242119','#d2b974','THE SECRET HISTORY · DONNA TARTT',11);
  label(439,240,24,296,'#211f19','#cdc5aa','THE WISDOM OF INSECURITY · ALAN WATTS',10);
  label(588,267,22,205,'#161914','#45828c','THE PATH TO POWER · ROBERT A. CARO',10);
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return texture;
}
