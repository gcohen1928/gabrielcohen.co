import './styles.css';
import { coverUV } from './motion.js';
import { books } from './books.js';
import { cameraTransform, detailViews } from './camera.js';
import { createSoloPlayer, SOLO_START, VIDEO_ID, CHANNELS } from './player.js';
const $=selector=>document.querySelector(selector);
const room=$('#room'),world=$('#room-world');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 700px), (max-aspect-ratio: 1/1)');
let scene,opening=false,view='home',selected=0,opener;
const player=createSoloPlayer($('#player'),document.createElement('span'));
function camera(){const rect=room.getBoundingClientRect();
const introRect=$('.intro').getBoundingClientRect();
const guitarText=$('#guitar-view');
guitarText.style.left=`${introRect.left-rect.left}px`;
guitarText.style.top=`${introRect.top-rect.top}px`;
guitarText.style.width=`${introRect.width}px`;
const t=cameraTransform(room.classList.contains('watching')?'tv':view,rect.width,rect.height,mobile.matches,selected);world.style.transform=`translate(${t.x}px,${t.y}px) scale(${t.scale})`;
if(!scene&&room.classList.contains('watching')){const w=Math.min(rect.width*.94,(rect.height-130)*1424/1104),h=w*1104/1424,left=(rect.width-w)/2,top=Math.max(35,(rect.height-h-80)/2);$('.tv-controls').classList.add('settled');$('.tv-controls').style.top=`${top+h*.90}px`;$('#tv-closeup').style.cssText=`left:${left}px;top:${top}px;width:${w}px;height:${h}px;opacity:1`;$('#tv-video').style.cssText=`left:${left+w*.151}px;top:${top+h*.214}px;width:${w*.510}px;height:${h*.518}px;opacity:1`;}

scene?.setView(room.classList.contains('watching')?'tv':view);}
const focusImage=$('#focus-image');let focusVersion=0;
function loadFocus(){
  const version=++focusVersion;focusImage.classList.remove('ready');
  if(!detailViews.includes(view)||room.dataset.renderer==='webgl')return;
  const name=view,image=new Image();image.src=`/assets/detail-${name}${mobile.matches?'-mobile':''}.webp`;
  image.decode().then(()=>{if(version!==focusVersion)return;focusImage.src=image.src;focusImage.classList.add('ready');}).catch(()=>{});
}
function syncMotion(){scene?.setPaused(reduced.matches);}
function bookText(){const b=books[selected];$('#book-title').textContent=b.title;$('#book-author').textContent=b.author;$('#book-rating').textContent=b.rating?`my rating: ${b.rating} / 5`:'';$('#book-rating').hidden=!b.rating;$('#book-link').href=`https://www.goodreads.com/${b.url.startsWith('search?')?b.url:'book/show/'+b.url}`;}
let tvExitTimer;
function stopMusic(){
 clearTimeout(tvExitTimer);$('.tv-controls').classList.remove('settled');
 const exiting=room.classList.contains('watching')&&!reduced.matches;
 room.classList.remove('watching');$('#listen').hidden=false;
 if(exiting){room.classList.add('tv-exiting');tvExitTimer=setTimeout(()=>{player.stop();$('#music-controls').hidden=true;room.classList.remove('tv-exiting');},1400);}
 else{player.stop();$('#music-controls').hidden=true;room.classList.remove('tv-exiting');}
}

function go(next,button){
  if(next===view)return;
  if(button)opener=button;
  stopMusic();view=next;room.dataset.view=view;
  $('#scene-ui').inert=view!=='home';$('#scene-ui').setAttribute('aria-hidden',String(view!=='home'));
  for(const name of ['books','guitar','nero','about'])$(`#${name}-view`).hidden=name!==view;
  $('#room-back').hidden=view==='home';
  $('#book-targets').hidden=view!=='books';if(view==='books')bookText();camera();loadFocus();
  if(view==='home')opener?.focus({preventScroll:true});else $(`#${view==='books'?'book':view}-title`)?.focus({preventScroll:true});
}
for(const button of document.querySelectorAll('button[data-view]')){
  button.addEventListener('click',()=>go(button.dataset.view,button));
  const warm=()=>scene?.preloadDetail(button.dataset.view).catch(()=>{});
  button.addEventListener('pointerenter',warm,{passive:true});button.addEventListener('focus',warm);
}
$('#room-back').addEventListener('click',()=>go('home'));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&view!=='home'){event.preventDefault();go('home');}if(view==='books'&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();selectBook(event.key==='ArrowLeft'?-1:1);}});
function selectBook(step){selected=(selected+step+books.length)%books.length;bookText();camera();}
for(const [index,book] of books.entries()){
 const button=document.createElement('button');button.type='button';button.className='book-target';button.setAttribute('aria-label',book.title);button.dataset.book=book.id;
 const choose=()=>{selected=index;bookText();};button.addEventListener('pointerenter',choose);button.addEventListener('focus',choose);button.addEventListener('click',choose);$('#book-targets').append(button);
}
function watchTV(){clearTimeout(tvExitTimer);room.classList.remove('tv-exiting');$('#music-controls').style.transform='none';$('#music-controls').style.opacity='1'; $('#music-controls').hidden=false;$('#listen').hidden=true;room.classList.add('watching');camera();tune(0); }
$('#listen').addEventListener('click',watchTV);
$('#open-tv').addEventListener('click',()=>{opener=$('#open-tv');view='tv';room.dataset.view='tv';$('#scene-ui').inert=true;$('#scene-ui').setAttribute('aria-hidden','true');$('#room-back').hidden=false;watchTV();});
let channelIndex=0;
function tune(index){channelIndex=(index+CHANNELS.length)%CHANNELS.length;const channel=CHANNELS[channelIndex];$('#channel-name').textContent=`${String(channelIndex+1).padStart(2,'0')} · ${channel.title}`;player.play(channel);}
$('#channel-prev').addEventListener('click',()=>tune(channelIndex-1));
for(const id of ['channel-next','tv-dial'])$('#'+id).addEventListener('click',()=>tune(channelIndex+1));


async function start(){if(reduced.matches||opening||scene)return;opening=true;try{const {createRoom}=await import('./room.js');scene=await createRoom($('#room-canvas'));scene.setView(room.classList.contains('watching')?'tv':view,true);syncMotion();}catch(error){$('#room-canvas').classList.remove('ready');room.dataset.renderer='static';if(new URLSearchParams(location.search).has('debug'))console.warn('Static room fallback:',error);}finally{opening=false;}}
reduced.addEventListener('change',()=>{syncMotion();if(!reduced.matches)start();});mobile.addEventListener('change',()=>{camera();loadFocus();});new ResizeObserver(camera).observe(room);
if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:1200});else setTimeout(start,100);

