export const SOLO_START = 390;
export const VIDEO_ID = 'rlgjWuQPaEQ';
export const CHANNELS=[{id:VIDEO_ID,start:SOLO_START,title:'I Love You More Than You’ll Ever Know'},{id:'JmsUkutNnI0',start:195,title:'Still Got the Blues'},{id:'hIiuv6PwkdQ',start:0,title:'Parisienne Walkways · live'}];
let apiPromise;
function youtubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
    window.onYouTubeIframeAPIReady=()=>resolve(window.YT);
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{apiPromise=null;script.remove();reject(new Error('YouTube unavailable'));};document.head.append(script);
  });
  return apiPromise;
}
export function createSoloPlayer(container,status){
  let player,frame,timer,version=0;
  const time=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
  function stop(){version++;clearInterval(timer);timer=null;player?.destroy();player=null;frame?.remove();frame=null;container.replaceChildren();status.textContent='';}
  async function play(channel=CHANNELS[0]){
    stop();const v=version;
    frame=document.createElement('iframe');frame.title=`Gary Moore — ${channel.title}`;
    frame.src=`https://www.youtube.com/embed/${channel.id}?start=${channel.start}&autoplay=1&controls=0&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';container.append(frame);
    status.textContent='loading gary moore…';
    try{
      const YT=await youtubeAPI();if(v!==version)return;
      player=new YT.Player(frame,{events:{
        onReady:event=>{if(v!==version)return;event.target.seekTo(channel.start,true);event.target.playVideo();},
        onStateChange:event=>{
          if(v!==version)return;clearInterval(timer);timer=null;
          const update=()=>{const seconds=event.target.getCurrentTime?.()||0;container.dataset.playbackTime=seconds.toFixed(1);container.dataset.playbackState=String(event.data);status.textContent=event.data===1?`Playing · ${time(seconds)}`:event.data===2?'Paused':event.data===0?'one more time?':'hit play above.';};
          update();if(event.data===1)timer=setInterval(update,1000);
        },
        onAutoplayBlocked:()=>{if(v===version)status.textContent='hit play above.';},
        onError:()=>{if(v===version)status.textContent='not playing? try the youtube link below.';},
      }});
    }catch{if(v===version)status.textContent='try hitting play above, or open it on youtube.';}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){player?.pauseVideo?.();clearInterval(timer);timer=null;}});
  return {play,stop};
}
