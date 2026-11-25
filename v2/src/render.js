import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BufferGeometry, CanvasTexture, Color,
  DirectionalLight, EquirectangularReflectionMapping, Float32BufferAttribute, HemisphereLight,
  LatheGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera, PlaneGeometry, PMREMGenerator,
  PointLight, Points, PointsMaterial, Scene, Sprite, SpriteMaterial,
  SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { framing } from './camera.js';

const tau=2*Math.PI;
const wickHeight=2.24;
const focus=1.25;
const closeFocus=(width,zoom)=>width<=600?focus+.23*Math.max(0,(zoom-1)/.8):focus;
const asset=(path)=>new URL('./assets/'+path,document.baseURI).href;

function radialTexture(size, stops) {
  const c=document.createElement('canvas');
  c.width=c.height=size;
  const ctx=c.getContext('2d');
  const radius=size/2;
  const g=ctx.createRadialGradient(radius,radius,0,radius,radius,radius);
  stops.forEach(([at,color])=>g.addColorStop(at,color));
  ctx.fillStyle=g;
  ctx.fillRect(0,0,size,size);
  const texture=new CanvasTexture(c);
  texture.colorSpace=SRGBColorSpace;
  return texture;
}
function reflections(renderer) {
  const c=document.createElement('canvas');
  c.width=256;c.height=128;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#202740';
  ctx.fillRect(0,0,c.width,c.height);
  for(const [x,y,w,h,color] of [[62,39,55,29,'#ffdfb7'],[156,33,32,52,'#adbfff'],[227,66,30,20,'#a79acc']]){
    ctx.save();ctx.translate(x,y);ctx.scale(w,h);
    const brush=ctx.createRadialGradient(0,0,0,0,0,1);
    brush.addColorStop(0,color);
    brush.addColorStop(.27,color+'ce');
    brush.addColorStop(1,color+'00');
    ctx.fillStyle=brush;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
  const texture=new CanvasTexture(c);
  texture.colorSpace=SRGBColorSpace;
  texture.mapping=EquirectangularReflectionMapping;
  const pmrem=new PMREMGenerator(renderer);
  const env=pmrem.fromEquirectangular(texture);
  texture.dispose();
  pmrem.dispose();
  return env.texture;
}
function light(scene,color,level,coords) {
  const lamp=new DirectionalLight(color,level);
  lamp.position.set(...coords);
  scene.add(lamp);
  return lamp;
}
function decorate(scene) {
  const confetti=Array.from({length:50},(_,i)=>{
    const angle=i*2.39996;
    const radius=1.46+.43*((i*47%59)/59);
    const y=.07+2.78*((i*29%53)/53);
    return [radius*Math.sin(angle),y,radius*Math.cos(angle)];
  });
  const dots=new BufferGeometry().setAttribute('position',new Float32BufferAttribute(confetti.flat(),3));
  const dust=new Points(dots,new PointsMaterial({
    color:0xeed3a9,
    map:radialTexture(32,[[0,'#fff5de'],[.40,'#fff4de99'],[1,'transparent']]),
    transparent:true,depthWrite:false,opacity:.67,size:.03,sizeAttenuation:true,
  }));
  scene.add(dust);
  return dust;
}
function candle(scene) {
  const profile=[[0,0],[.024,.013],[.052,.060],[.049,.112],[.032,.18],[.013,.239],[.002,.299]];
  const geometry=new LatheGeometry(profile.map(v=>new Vector2(...v)),24);
  const position=geometry.attributes.position;
  const colors=[];
  const color=new Color();
  const amber=new Color(0xf19b47), ivory=new Color(0xfff0c3), gold=new Color(0xffc376);
  for(let i=0;i<position.count;i++){
    const y=position.getY(i);
    position.setX(i,position.getX(i)+.035*(y/.30)**2);
    if(y<.095)color.copy(amber).lerp(ivory,Math.min(1,y/.087));
    else color.copy(ivory).lerp(gold,Math.min(1,(y-.095)/.195));
    colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  const flame=new Mesh(geometry,new MeshBasicMaterial({vertexColors:true,toneMapped:false}));
  flame.position.y=wickHeight;
  const glow=new Sprite(new SpriteMaterial({
    map:radialTexture(68,[[0,'#ffdb8cbb'],[.18,'#ffbd7766'],[.52,'#c48a5524'],[1,'transparent']]),
    transparent:true,blending:AdditiveBlending,depthWrite:false,toneMapped:false,
  }));
  glow.position.set(.005,wickHeight+.13,0);
  glow.scale.set(.47,.64,1);
  const lamp=new PointLight(0xffc581,1.55,1.65,2);
  lamp.position.set(.01,2.12,0);
  scene.add(flame,glow,lamp);
  return {flame,glow,lamp};
}
function smokeTrail(scene) {
  const haze=radialTexture(50,[[0,'#d6cbf2b4'],[.4,'#c0b6d872'],[.7,'#9f9bb034'],[1,'transparent']]);
  const puffs=Array.from({length:8},()=>new Sprite(new SpriteMaterial({
    map:haze,transparent:true,opacity:0,depthWrite:false,toneMapped:false,
  })));
  puffs.forEach(puff=>scene.add(puff));
  return puffs;
}
function ground(scene) {
  const map=radialTexture(140,[[0,'#000000f0'],[.44,'#04030dd4'],[.62,'#09061873'],[1,'transparent']]);
  const shadow=new Mesh(new PlaneGeometry(4.45,4.45),new MeshBasicMaterial({
    map,transparent:true,depthWrite:false,toneMapped:false,
  }));
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=-.038;
  scene.add(shadow);
}

export async function makeWebGL(canvas,stage,quality) {
  const renderer=new WebGLRenderer({canvas,alpha:true,antialias:quality!=='low',powerPreference:'high-performance'});
  try {
    renderer.setClearColor(0,0);
    renderer.outputColorSpace=SRGBColorSpace;
    renderer.toneMapping=ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.06;
    const camera=new OrthographicCamera(-2,2,2,-2,.1,80);
    const scene=new Scene();
    scene.environment=reflections(renderer);
    scene.environmentIntensity=.68;
    scene.add(new HemisphereLight(0xf4e1db,0x6c719d,1.09),new AmbientLight(0xcdd8f8,.14));
    const key=light(scene,0xffe5cb,2.29,[-3.6,3.65,4]);
    light(scene,0xb3c8ff,1.67,[2.8,2.9,-3]);
    light(scene,0xc9b4e4,.55,[4,1.8,2]);
    const lamp=candle(scene);
    const puffs=smokeTrail(scene);
    const dust=decorate(scene);
    ground(scene);
    const loader=new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const {scene:model}=await loader.loadAsync(asset('cake.glb'));
    const matteSurfaces=new Map();
    model.traverse(object=>{
      const material=object.material;
      if(!material?.isMeshPhysicalMaterial||material.clearcoat>.14)return;
      // These matte surfaces keep e.g. albedo and roughness but need only one reflection lobe.
      if(!matteSurfaces.has(material))matteSurfaces.set(material,new MeshStandardMaterial().copy(material));
      object.material=matteSurfaces.get(material);
    });
    scene.add(model);
    let w=0,h=0,budget=quality==='low'?1:1.45,slow=0,last=0,dirty=true;
    const aim=new Vector3(0,focus,0);
    function resize() {
      dirty=true;
      w=stage.clientWidth;h=stage.clientHeight;
      const cap=Math.min(budget,w<620?1.36:1.5,Math.sqrt(1500000/Math.max(1,w*h)));
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,cap));
      renderer.setSize(w,h,false);
      const unit=framing(w,h);
      camera.left=-w/(2*unit);camera.right=w/(2*unit);
      camera.top=h/(2*unit);camera.bottom=-h/(2*unit);
      camera.updateProjectionMatrix();
    }
    resize();
    const fit=new ResizeObserver(resize);
    fit.observe(stage);
    return {
      mode:'WebGL',
      get needsFrame() { return dirty; },
      draw(now,view,effects) {
        const dt=Math.min(.1,(now-last)/1000);
        last=now;
        slow=dt>.030?slow+dt:Math.max(0,slow-dt*2);
        if(quality==='auto'&&slow>1.8&&budget>.86){
          const lower=Math.min(budget,renderer.getPixelRatio())-.16;
          budget=Math.max(.86,lower);resize();slow=0;
        }
        const ring=8*Math.cos(view.pitch);
        aim.y=closeFocus(w,view.zoom);
        camera.position.set(ring*Math.sin(view.yaw),aim.y+8*Math.sin(view.pitch),ring*Math.cos(view.yaw));
        camera.lookAt(aim);
        if(Math.abs(camera.zoom-view.zoom)>.00002){camera.zoom=view.zoom;camera.updateProjectionMatrix();}
        const t=effects.time;
        const fire=effects.flame;
        key.intensity=2.08+.21*fire;
        lamp.flame.visible=fire>.01;
        lamp.flame.rotation.z=effects.bend+.068*Math.sin(t*4.7);
        lamp.flame.scale.set(1-.22*(1-fire),fire*(1+.046*Math.sin(t*7)),1);
        lamp.glow.material.opacity=.57*fire;
        lamp.lamp.intensity=fire*(1.56+.093*Math.sin(t*5.5));
        dust.rotation.y=.065*t;
        dust.material.opacity=.40+effects.stars*.39;
        puffs.forEach((puff,index)=>{
          const life=effects.smoke-index*.072;
          puff.visible=effects.smoke>0&&life>0&&life<1;
          if(!puff.visible)return;
          const swell=.08+life*.29;
          puff.scale.set(swell*(1.06+.2*life),swell,1);
          puff.position.set(.06*index+.21*life+.096*Math.sin(4*t+index),wickHeight+life*.78+.01*index,0);
          puff.material.opacity=.28*Math.sin(life*Math.PI)*(1-index*.064);
        });
        renderer.render(scene,camera);
        dirty=false;
      },
      get stats() { return {...renderer.info.render,...renderer.info.memory,pixelRatio:renderer.getPixelRatio()}; },
      dispose() { fit.disconnect();renderer.dispose(); },
    };
  } catch (error) {
    renderer.dispose();
    throw error;
  }
}

async function loadImage(src) {
  const image=new Image();
  image.src=asset(src);
  await image.decode();
  return image;
}

export async function makeFallback(canvas,stage) {
  const cellWidth=360,cellHeight=385;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas rendering unavailable');
  const [low,high]=await Promise.all([loadImage('orbit-low.webp'),loadImage('orbit-high.webp')]);
  let width,height,dpr,dirty=true;
  function resize() {
    dirty=true;
    width=stage.clientWidth;
    height=stage.clientHeight;
    dpr=Math.min(devicePixelRatio||1,1.25);
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  new ResizeObserver(resize).observe(stage);
  return {
    mode:'Canvas 360°',
    get needsFrame() { return dirty; },
    draw(now,view,effects) {
      dirty=false;
      ctx.clearRect(0,0,width,height);
      const useHigh=view.pitch>.615;
      const frame=(Math.round(view.yaw/tau*16)%16+16)%16;
      const x=frame%4*cellWidth, y=Math.floor(frame/4)*cellHeight;
      const unit=framing(width,height)*view.zoom;
      const imageScale=unit*3.6/cellHeight;
      const w=cellWidth*imageScale,h=cellHeight*imageScale;
      const pitch=useHigh?.88:.31;
      const focalHeight=closeFocus(width,view.zoom);
      const off=(focalHeight-focus)*Math.cos(pitch)*unit;
      ctx.drawImage(useHigh?high:low,x,y,cellWidth,cellHeight,(width-w)/2,(height-h)/2+off,w,h);
      const cy=height/2-(wickHeight-focalHeight)*Math.cos(pitch)*unit;
      const cx=width/2;
      if(effects.flame>.01) {
        const size=unit*(.295+.012*Math.sin(effects.time*7))*effects.flame;
        const lean=unit*(-effects.bend*.20+.014*Math.sin(effects.time*4));
        const radius=unit*.225;
        const g=ctx.createRadialGradient(cx,cy-size*.42,0,cx,cy-size*.42,radius);
        g.addColorStop(0,'#ffd49399');
        g.addColorStop(.37,'#ec9e4844');
        g.addColorStop(1,'transparent');
        ctx.save();
        ctx.globalAlpha=effects.flame;
        ctx.fillStyle=g;
        ctx.fillRect(cx-radius,cy-size*.42-radius,radius*2,radius*2);
        ctx.beginPath();
        ctx.moveTo(cx,cy+size*.04);
        ctx.bezierCurveTo(cx-size*.31,cy-size*.15,cx+lean*.49-size*.09,cy-size*.57,cx+lean+size*.13,cy-size);
        ctx.bezierCurveTo(cx+lean+size*.13,cy-size*.59,cx+size*.36,cy-size*.22,cx,cy+size*.04);
        ctx.fillStyle='#fff1c5';
        ctx.fill();ctx.restore();
      }
      if(effects.smoke>0&&effects.smoke<1.32) {
        ctx.save();ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.quadraticCurveTo(cx+unit*.32,cy-unit*.29,cx+unit*.15,cy-unit*.52);
        ctx.strokeStyle='#e2d7f2';
        ctx.lineWidth=unit*.027;
        ctx.lineCap='round';
        ctx.globalAlpha=.29*Math.sin(Math.min(1,effects.smoke/1.32)*Math.PI);
        ctx.stroke();ctx.restore();
      }
    },
    get stats() { return {pixelRatio:dpr}; },
  };
}
