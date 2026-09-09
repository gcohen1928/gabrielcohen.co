import { Group, Mesh, BoxGeometry, MeshStandardMaterial, TextureLoader, SRGBColorSpace, CanvasTexture, AmbientLight, DirectionalLight, Raycaster, PlaneGeometry, ShaderMaterial } from 'three';
import { books, bookAnchor } from './books.js';
import { coverUV, damp } from './motion.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function spineTexture(book) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=1024;
  const ctx=canvas.getContext('2d');ctx.fillStyle=book.color;ctx.fillRect(0,0,128,1024);
  ctx.translate(64,55);ctx.rotate(Math.PI/2);ctx.fillStyle='#f7eedb';
  ctx.font='38px Georgia';ctx.fillText(book.title,0,12,840);
  ctx.font='20px Arial';ctx.fillText(book.author,20,-32,760);
  const tex=new CanvasTexture(canvas);tex.colorSpace=SRGBColorSpace;return tex;
}

export async function createShelf(scene) {
  const root=new Group();root.renderOrder=2;scene.add(root);
  const ambient=new AmbientLight(0xffedcd,1.8);scene.add(ambient);
  const light=new DirectionalLight(0xffdcac,2);light.position.set(-4,6,8);scene.add(light);
  const loader=new TextureLoader(),ray=new Raycaster(),items=[];
  await Promise.all(books.map(async(book,index)=>{
    const cover=await loader.loadAsync(`/assets/books/${book.id}.webp`);cover.colorSpace=SRGBColorSpace;cover.anisotropy=4;
    const cloth=new MeshStandardMaterial({color:book.color,roughness:.93});
    const front=new MeshStandardMaterial({map:cover,color:0xb7b2a9,roughness:.9});
    const spine=new MeshStandardMaterial({map:spineTexture(book),color:0xb7b2a9,roughness:.95});
    const pages=new MeshStandardMaterial({color:0xb5a78e,roughness:1});
    const group=new Group();root.add(group);group.userData.bookIndex=index;
    const body=new Mesh(new BoxGeometry(.62,.98,.115),[pages,spine,pages,pages,front,cloth]);group.add(body);
    for(const z of [-.062,.062]){
      const board=new Mesh(new RoundedBoxGeometry(.65,1,.016,2,.006),[cloth,cloth,cloth,cloth,z>0?front:cloth,cloth]);
      board.position.z=z;group.add(board);
    }
    const shadow=new Mesh(new PlaneGeometry(1,.15),new ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;void main(){vec2 p=(v-.5)*2.;gl_FragColor=vec4(0.,0.,0.,exp(-dot(p,p)*3.)*.42);}'}));
    shadow.renderOrder=1;root.add(shadow);
    for(const child of group.children)child.userData.bookIndex=index;
    items[index]={group,shadow,index};
  }));
  let hover=-1;
  return {
    root,
    hit(pointer,camera){ray.setFromCamera(pointer,camera);const found=ray.intersectObjects(items.flatMap(item=>item.group.children),false)[0];hover=found?.object.userData.bookIndex??-1;return hover;},
    update(width,height,mobile,selected,view,mouse,dt,still){
      const aspect=width/height,[cx,cy]=coverUV(width,height,mobile?2/3:1500/1049);
      for(const item of items){
        const anchor=bookAnchor(item.index,mobile),h=anchor.height*2/cy;
        const chosen=view==='books'&&selected===item.index;
        const focused=chosen||hover===item.index;
        const grow=chosen?1.1:1;
        item.group.scale.setScalar(h*grow);
        const px=(anchor.x-.5)*2/cx*aspect;
        const py=(.5-anchor.y)*2/cy+h*grow/2;
        const speed=still?1000:8;
        item.group.position.x=damp(item.group.position.x,px,dt,speed);
        item.group.position.y=damp(item.group.position.y,py+(chosen?h*(mobile?.035:.635):0),dt,speed);
        item.group.position.z=damp(item.group.position.z,chosen?.28:focused?.1:.02,dt,speed);
        item.group.rotation.y=damp(item.group.rotation.y,chosen?mouse.x*.5:focused?-.35:-.9,dt,speed);
        item.group.rotation.x=damp(item.group.rotation.x,chosen?-mouse.y*.18:0,dt,speed);
        item.group.rotation.z=damp(item.group.rotation.z,chosen?-mouse.x*.025:0,dt,speed);
        item.shadow.position.set(px,(.5-anchor.y)*2/cy-.008,-.08);
        item.shadow.scale.setScalar(h);
      }
    },
  };
}
