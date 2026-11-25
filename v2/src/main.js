import { makeCamera } from './camera.js';
import { makeSky } from './sky.js';
import { makeFallback, makeWebGL } from './render.js';

const body = document.body;
const stage = document.querySelector('.stage');
let canvas = document.querySelector('#cake');
const sky = document.querySelector('#sky');
const poster = document.querySelector('#poster');
const ceremony = document.querySelector('#ceremony');
const buttonLabel = document.querySelector('#ceremony-label');
const caption = document.querySelector('#caption');
const headline = document.querySelector('h1');
const english = document.querySelector('.english');
const status = document.querySelector('#status');
const audio = document.querySelector('#bgm');
const sound = document.querySelector('#sound');
const diagnostics = document.querySelector('#diagnostics');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const quality = ['high','low'].includes(params.get('quality')) ? params.get('quality') : 'auto';
const measure = params.get('diag') === '1';
const forceCanvas = params.get('mode') === 'canvas';

let phase = 'opening';
let phaseStart = performance.now();
let ritualStart = phaseStart;
let blowStart = 0;
let renderer;
let installId = 0;
let camera;
let firstVisible = false;
let attempted = false;
let renderCount = 0;

function active() { return !!renderer && phase !== 'opening'; }
const drawSky = makeSky(sky,stage,reduced);
function bindCamera() { camera = makeCamera(canvas,reduced,active); }
bindCamera();
document.querySelector('[data-camera="reset"]').addEventListener('click',()=>camera.reset());
document.querySelector('[data-camera="zoom-in"]').addEventListener('click',()=>camera.zoomBy(1.18));
document.querySelector('[data-camera="zoom-out"]').addEventListener('click',()=>camera.zoomBy(1/1.18));

const states = {
  opening: {button:'点亮星河',caption:'有些愿望，只说给今晚的星星听。'},
  arrival: {button:'星光正在亮起',caption:'有些愿望，只说给今晚的星星听。',busy:true},
  lit: {button:'吹蜡烛',caption:'闭上眼睛，许个愿吧。'},
  blowing: {button:'愿望正在启程',caption:'闭上眼睛，许个愿吧。',busy:true},
  blessing: {button:'重新点亮',caption:'愿你新的一岁，仍有抬头看星星的时刻。'},
};
function changePhase(next,now=performance.now()) {
  phase=next;
  phaseStart=now;
  if(next==='arrival')ritualStart=now;
  if(next==='blowing')blowStart=now;
  if(next==='lit')blowStart=0;
  body.dataset.phase=next;
  buttonLabel.textContent=states[next].button;
  ceremony.disabled=!!states[next].busy;
  caption.textContent=states[next].caption;
  headline.textContent=next==='blessing'?'愿你有光':'星河许愿';
  english.textContent=next==='blessing'?'Happy birthday':'A wish in the stars';
  camera.onPhase(next,now);
  if(next==='blessing') {
    status.textContent='蜡烛已吹灭。';
    ceremony.focus({preventScroll:true});
  }
}

function setAudioState() {
  const playing=!audio.paused;
  sound.setAttribute('aria-pressed',String(playing));
  sound.title=playing?'暂停背景音乐':'播放背景音乐';
}
function play() {
  audio.play().catch(e=>{
    if(e.name==='AbortError')return;
    status.textContent='音乐暂未播放，可用右下角按钮重试。';
    setAudioState();
  });
}
for(const event of ['playing','pause','ended','error']) audio.addEventListener(event,setAudioState);
sound.addEventListener('click',()=>{
  if(!audio.paused){audio.pause();return;}
  if(audio.error)audio.load();
  play();
});
ceremony.addEventListener('click',()=>{
  status.textContent='';
  if(phase==='opening'){
    play();
    changePhase('arrival');
  } else if(phase==='lit'){
    changePhase('blowing');
  } else if(phase==='blessing'){
    ritualStart=performance.now()-100;
    changePhase('lit');
  }
});

function replacementCanvas() {
  const next = canvas.cloneNode(false);
  next.tabIndex=-1;
  next.setAttribute('aria-hidden','true');
  canvas.replaceWith(next);
  canvas=next;
  bindCamera();
}
async function install(fallbackOnly) {
  const id=++installId;
  try {
    let view;
    if(!fallbackOnly) {
      try {
        view=await makeWebGL(canvas,stage,quality);
      } catch {
        if(id!==installId)return;
        replacementCanvas();
      }
    }
    if(!view)view=await makeFallback(canvas,stage);
    if(id!==installId){view.dispose?.();return;}
    renderer=view;
    attempted=true;
    canvas.setAttribute('aria-label',view.mode==='WebGL'?'可旋转的星空蛋糕 3D 视图':'可旋转的星空蛋糕兼容视图');
    canvas.dataset.renderer=view.mode;
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();
      renderer?.dispose?.();
      renderer=undefined;
      firstVisible=false;
      delete body.dataset.rendered;
      replacementCanvas();
      install(true);
    },{once:true});
  } catch {
    if(id!==installId)return;
    attempted=true;
    status.textContent='立体视图暂时无法载入，已显示蛋糕预览。';
    poster.style.filter='brightness(1)';
    document.querySelector('.views').hidden=true;
    document.querySelector('#gesture-help').hidden=true;
    delete body.dataset.rendered;
  }
}
install(forceCanvas);

const clamp=(t)=>Math.max(0,Math.min(1,t));
const ease=(t)=>{const p=clamp(t);return p*p*(3-2*p);};
let last=0,lastRead=0;
const frameTimes=[];
function update(now) {
  requestAnimationFrame(update);
  const epoch=now-phaseStart;
  if(phase==='arrival' && (attempted || epoch>3650) && epoch>(reduced?30:1430))changePhase('lit',now);
  if(phase==='blowing' && epoch>(reduced?30:1370))changePhase('blessing',now);
  const lightAge=(now-ritualStart)/1000;
  const blown=(now-blowStart)/1000;
  const ignition=reduced?1:ease((lightAge-.28)/.64);
  const glow=phase==='blessing'?0:phase==='blowing'?(reduced?0:1-ease((blown-.09)/.53)):ignition;
  const progress=phase==='arrival'?ease(epoch/1440):phase==='blowing'?ease(epoch/1370):phase==='blessing'?ease(epoch/2200):0;
  drawSky(now,phase,progress);
  if(active()){
    renderer.draw(now,camera.update(now),{
      time:reduced?.44:now/1000,
      flame:glow,
      bend:phase==='blowing'?ease(blown/.34)*.54:0,
      smoke:!reduced&&blowStart?Math.max(0,(blown-.23)/1.42):0,
      stars:phase==='blessing'?1-progress*.68:progress*.42,
    });
    renderCount++;
    if(!firstVisible){
      firstVisible=true;
      canvas.tabIndex=0;
      canvas.removeAttribute('aria-hidden');
      body.dataset.rendered='true';
    }
  }
  if(measure&&active()){
    if(last){
      frameTimes.push(now-last);
      if(frameTimes.length>120)frameTimes.shift();
    }
    if(now-lastRead>500&&frameTimes.length>5){
      const sorted=[...frameTimes].sort((a,b)=>a-b);
      const median=sorted[sorted.length>>1];
      const p95=sorted[Math.ceil(sorted.length*.95)-1];
      const data=renderer.stats;
      diagnostics.hidden=false;
      diagnostics.textContent=[
        renderer.mode+' · '+quality+' · '+(Math.round(1000/median))+' FPS (p50)',
        'p50 '+median.toFixed(1)+' ms · p95 '+p95.toFixed(1)+' ms · '+sorted.length+' 帧',
        data.calls!=null?data.calls+' draws · '+data.triangles+' tris · DPR '+data.pixelRatio.toFixed(2):'',
      ].filter(Boolean).join('\n');
      window.galaxyDiagnostics={mode:renderer.mode,quality,median,p95,renderCount,stats:data,view:{...camera.view},phase};
      lastRead=now;
    }
  }
  last=now;
}
requestAnimationFrame(update);
