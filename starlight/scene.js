(()=>{
const T=THREE, pi=Math.PI, tau=2*pi;
const scene=new T.Scene(), camera=new T.OrthographicCamera(-2,2,2,-2,.1,60);
const canvas = document.querySelector('#cake');
let renderer;
try {
 renderer = new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
} catch {
 softwareCake();
 return;
}
cakeView.bind(canvas);
renderer.setClearColor(0x000000,0);renderer.outputEncoding=T.sRGBEncoding;
const cake=new T.Group();cake.rotation.y=pi;scene.add(cake);
const surface=(color,roughness=.48,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
const srgb=color=>new T.Color(color).convertSRGBToLinear();
function softenCreamHighlights(shader){
 // Roll off the brightest channel before sRGB encoding, preserving hue and midtones.
 shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',`
  float peak = max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b));
  float excess = max(peak - 0.54, 0.0);
  float shoulder = 0.38 * (1.0 - exp(-excess / 0.38));
  gl_FragColor.rgb *= (min(peak, 0.54) + shoulder) / max(peak, 0.0001);
  #include <tonemapping_fragment>
 `);
}
function mesh(geo,mat,parent=scene){const m=new T.Mesh(geo,mat);parent.add(m);return m}
function texture(url){const t=new T.TextureLoader().load(url);t.encoding=T.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
function fromModel(name,mat,parent){
 const [points,uv,indices]=models[name],g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv.flat(),2));g.setIndex(indices);g.computeVertexNormals();return mesh(g,mat,parent)
}
const paintedGlaze=texture(glaze);
fromModel('Glaze',new T.MeshPhysicalMaterial({
 map:paintedGlaze,bumpMap:paintedGlaze,bumpScale:.012,roughness:.43,clearcoat:.43,clearcoatRoughness:.47
}),cake);
fromModel('Porcelain',surface(srgb(0x51466f),.65,{metalness:.16,envMapIntensity:.68}),scene);
function ring(r,y,width,color,metalness=.5){
 const m=mesh(new T.TorusGeometry(r,width,7,132),surface(srgb(color),.44,{metalness}));
 m.rotation.x=pi/2;m.position.y=y;
}
ring(1.495,.082,.007,0xdaaa67);ring(1.476,.091,.004,0xe2bc80);
ring(1.375,.078,.004,0x80596a);ring(1.483,.028,.011,0xaa713f);
function blobTexture(stops){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
 stops.forEach(([p,s])=>g.addColorStop(p,s));ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;return map
}
function floorGlow(y,size,stops,additive=false){
 const m=mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({
  map:blobTexture(stops),transparent:true,depthWrite:false,
  blending:additive?T.AdditiveBlending:T.NormalBlending
 }));
 m.rotation.x=-pi/2;m.position.y=y;
}
floorGlow(.072,2.64,[[0,'#070518'],[.72,'#070518'],[.79,'#08051a86'],[.94,'transparent'],[1,'transparent']]);
floorGlow(-.072,4.94,[[0,'#050411'],[.53,'#09061be0'],[.68,'#0b082169'],[1,'transparent']]);
floorGlow(-.081,5.24,[[0,'#3230aa40'],[.62,'#5144bb31'],[1,'transparent']],true);
const frostingGeometry=new T.SphereGeometry(1,72,20);
const frostPositions=frostingGeometry.getAttribute('position'),frostUV=frostingGeometry.getAttribute('uv');
for(let i=0;i<frostUV.count;i++){
 // Preserve the seam already present in the sphere's longitudinal UV.
 frostUV.setY(i,1-Math.hypot(frostPositions.getX(i),frostPositions.getZ(i)));
}
const paintedCream=texture(cream);
const top=mesh(frostingGeometry,surface(0xffffff,.78,{
 map:paintedCream,bumpMap:paintedCream,bumpScale:.0055,envMapIntensity:.6
}),cake);
top.material.onBeforeCompile=softenCreamHighlights;
top.scale.set(.992,.112,.992);top.position.y=1.385;
// Sweep a ridged piping nozzle through tapered shell-shaped arcs.
const vertices=[],faces=[],tints=[];
const palette=decoration.piping.map(srgb);
for(let k=0;k<29;k++){
 const a=k*tau/29, tint=palette[k%palette.length],offset=vertices.length/3;
 for(let j=0;j<=12;j++){
  const t=j/12, angle=a+.26*t, rad=.895+.043*Math.sin(t*pi), y=1.439+.073*Math.sin(t*pi);
  for(let q=0;q<=24;q++){
   const b=q*tau/24,amp=.108*(.025+Math.pow(Math.sin(pi*t),.68))*(1+.22*Math.cos(6*b+t*4)),r=rad+amp*Math.cos(b);
   vertices.push(r*Math.sin(angle),y+amp*Math.sin(b)*.8,r*Math.cos(angle));
   const ridge=.5+.5*Math.cos(6*b+t*4);
   const ao=(.74+.26*(.5+.5*Math.sin(b)))*(.74+.26*ridge);
   tints.push(tint.r*ao,tint.g*ao,tint.b*ao);
   if(j<12&&q<24){let i=offset+j*25+q;faces.push(i,i+25,i+1,i+1,i+25,i+26)}
  }
 }
}
const piping=new T.BufferGeometry();piping.setIndex(faces);piping.setAttribute('position',new T.Float32BufferAttribute(vertices,3));piping.setAttribute('color',new T.Float32BufferAttribute(tints,3));piping.computeVertexNormals();
const shellMaterial=surface(0xffffff,.75,{vertexColors:true,side:T.DoubleSide,envMapIntensity:.57});
shellMaterial.onBeforeCompile=softenCreamHighlights;
mesh(piping,shellMaterial,cake);
const outline=new T.Shape();
for(let j=0;j<10;j++){let a=j*pi/5,r=j%2?.44:1;outline[j?'lineTo':'moveTo'](r*Math.sin(a),r*Math.cos(a))}
outline.closePath();
const star=new T.ExtrudeGeometry(outline,{depth:.14,bevelEnabled:true,bevelSegments:1,bevelThickness:.045,bevelSize:.06,steps:1});
const temp=new T.Object3D();
const chipOutline=new T.Shape();
chipOutline.moveTo(-1,.18);chipOutline.lineTo(.13,-.89);chipOutline.lineTo(.92,-.15);
chipOutline.lineTo(.55,.77);chipOutline.lineTo(-.46,.85);chipOutline.closePath();
const chip=new T.ExtrudeGeometry(chipOutline,{depth:.21,steps:1,bevelEnabled:true,bevelThickness:.05,bevelSize:.055,bevelSegments:1});
const pearl=new T.SphereGeometry(1,8,6),gem=new T.IcosahedronGeometry(1,0);
const candyGeometry={star,chip,pearl,dust:gem};
function arrangeSugar(pieces,parent){
 for(const shape of Object.keys(candyGeometry)){
  const items=pieces.filter(p=>p.shape===shape);
  if(!items.length)continue;
  const batch=new T.InstancedMesh(candyGeometry[shape],surface(0xffffff,.56,{metalness:.08,envMapIntensity:.7}),items.length);
  parent.add(batch);
  items.forEach((p,i)=>{
   temp.position.set(p.radius*Math.sin(p.angle),p.y,p.radius*Math.cos(p.angle));
   temp.rotation.set(-pi/2+Math.sin(p.phase)*.21,0,p.phase);
   temp.scale.setScalar(p.size);
   temp.updateMatrix();batch.setMatrixAt(i,temp.matrix);batch.setColorAt(i,srgb(p.color));
  });
 }
}
arrangeSugar(decoration.candy,cake);
arrangeSugar(decoration.plate,scene);
const sugarMaterials = {
 'Gilded sugar': surface(srgb(0xf1c375),.41,{metalness:.44}),
 'Moon pearl': surface(srgb(0xf5d4a4),.43,{metalness:.13}),
 'Sapphire sugar': surface(srgb(0x82a8d8),.39,{metalness:.26}),
};
for (const [kind,positions,indices] of blenderAdornments) {
 const geometry = new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 mesh(geometry,sugarMaterials[kind],cake);
}

const wax=mesh(new T.CylinderGeometry(.043,.053,.79,32),surface(srgb(0xe9c39a),.61),cake);
wax.position.y=1.89;
const wick=mesh(new T.CylinderGeometry(.009,.012,.074,12),surface(0x533833),cake);wick.position.y=2.31;
const flameShape=new T.LatheGeometry([[.001,0],[.035,.014],[.06,.053],[.065,.094],[.058,.14],[.041,.2],[.023,.26],[.01,.33],[.001,.42]].map(v=>new T.Vector2(...v)),40);
const flame=mesh(flameShape,new T.ShaderMaterial({vertexShader:'varying float h;void main(){h=position.y;vec3 p=position;p.x+=.032*pow(h/.39,2.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'varying float h;void main(){vec3 c=mix(vec3(1.,.52,.12),vec3(1.,.98,.83),smoothstep(0.,.09,h));c=mix(c,vec3(1.,.75,.33),smoothstep(.15,.39,h));gl_FragColor=vec4(c,1.);}' }));flame.position.y=2.32;
const glow=new T.Sprite(new T.SpriteMaterial({map:blobTexture([[0,'rgba(255,237,170,.94)'],[.15,'rgba(255,187,75,.5)'],[.42,'rgba(244,145,52,.13)'],[1,'transparent']]),blending:T.AdditiveBlending,transparent:true,depthWrite:false}));glow.scale.set(.51,.69,1);glow.position.y=2.45;scene.add(glow);
// Shift the light slightly down the candle so the small glow reaches the frosting.
const lamp=new T.PointLight(0xffbd78,0,1.06);
lamp.position.y=2.16;
scene.add(lamp,new T.HemisphereLight(0xfff4e6,0x979ac4,.61));
function light(x,y,z,color,power){const l=new T.DirectionalLight(color,power);l.position.set(x,y,z);scene.add(l)}
light(-3,4.3,4,0xffe4ca,.86);light(3,2.35,-4,0x93b4ff,.90);light(4,1,3,0xb4a1e8,.38);
function environment() {
 const surface=document.createElement('canvas');
 surface.width=256;surface.height=128;
 const ctx=surface.getContext('2d');
 ctx.fillStyle='#272436';ctx.fillRect(0,0,256,128);
 for (const [x,y,rx,ry,color] of [[57,35,48,21,'#fff2df'],[155,40,20,32,'#c9d9ff'],[227,61,20,15,'#a89ccb']]) {
  ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,color);gradient.addColorStop(.38,color+'d4');gradient.addColorStop(1,color+'00');
  ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 const image=new T.CanvasTexture(surface);
 image.encoding=T.sRGBEncoding;image.mapping=T.EquirectangularReflectionMapping;
 const pmrem=new T.PMREMGenerator(renderer);
 const target=pmrem.fromEquirectangular(image);
 image.dispose();pmrem.dispose();
 return target.texture;
}
scene.environment=environment();
const floaters=[];
for(const [shape,geometry] of Object.entries({star,gem,chip})){
 const items=decoration.orbit.filter(p=>p.shape===shape);
 const batch=new T.InstancedMesh(geometry,new T.MeshBasicMaterial({color:0xffffff}),items.length);
 batch.instanceMatrix.setUsage(T.DynamicDrawUsage);batch.frustumCulled=false;scene.add(batch);
 items.forEach((p,i)=>batch.setColorAt(i,srgb(p.color)));
 floaters.push({batch,items});
}
const mist=new T.BufferGeometry(),positions=[],motion=[],colors=[];
for(const p of decoration.orbit){
 if(p.shape!=='dust'&&p.shape!=='light')continue;
 positions.push(p.radius,p.y,p.a);
 motion.push(p.phase,p.speed,p.size,p.shape==='light'?1:0);
 const tint=new T.Color(p.color);colors.push(tint.r,tint.g,tint.b);
}
mist.setAttribute('position',new T.Float32BufferAttribute(positions,3));
mist.setAttribute('motion',new T.Float32BufferAttribute(motion,4));
mist.setAttribute('color',new T.Float32BufferAttribute(colors,3));
const dustUniforms={time:{value:0},pixelScale:{value:1}};
const dust=new T.Points(mist,new T.ShaderMaterial({
 uniforms:dustUniforms,vertexColors:true,transparent:true,depthWrite:false,
 vertexShader:`attribute vec4 motion;uniform float time,pixelScale;varying vec3 tint;varying float alpha,glint;
 void main(){
  float a=position.z+time*motion.y,z=position.x*cos(a);
  vec3 p=vec3(position.x*sin(a),position.y+.032*sin(time*.55+motion.x),z);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  gl_PointSize=clamp(pixelScale*motion.z*(2.+2.3*motion.w),1.,33.);
  tint=color;glint=motion.w;alpha=(.56+z*.12)*(.8+.2*sin(time*.81+motion.x));
 }`,
 fragmentShader:`varying vec3 tint;varying float alpha,glint;
 void main(){
  float r=length(gl_PointCoord-.5)*2.;
  float edge=1.-smoothstep(.63,1.,r);
  float core=1.-smoothstep(.19,.42,r);
  gl_FragColor=vec4(mix(tint,vec3(1.,.96,.88),glint*core*.86),alpha*mix(edge,edge*.25+core*.75,glint));
 }`
}));
dust.frustumCulled=false;scene.add(dust);
let renderBudget=1.65,slowTime=0;
const focus=new T.Vector3(0,1.32,0);
let stageSize=1;

function resize(){
 const w=ceremony.stage.clientWidth,h=ceremony.stage.clientHeight;
 const ratio=Math.min(devicePixelRatio,renderBudget,w<600?1.5:1.65,Math.sqrt(1850000/(w*h)));
 stageSize=Math.min(w*1.148,h*.91);
 renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);
 camera.left=-2*w/stageSize;camera.right=2*w/stageSize;
 camera.top=2*h/stageSize;camera.bottom=-2*h/stageSize;
 camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();

let elapsed=0,last=0;
function frame(now){
 requestAnimationFrame(frame);
 if(!ceremony.active){last=now;return}
 const dt=Math.min((now-last)/1000,.05);
 last=now;
 if(!ceremony.reduced)elapsed+=dt;
 slowTime=dt>.029?slowTime+dt:Math.max(0,slowTime-2*dt);
 if(slowTime>3 && renderBudget>1){
  renderBudget=Math.max(1,renderer.getPixelRatio()-.17);slowTime=0;resize();
 }
 const {yaw,pitch,zoom}=cakeView.update(now);
 const radius=8*Math.cos(pitch);
 camera.position.set(radius*Math.sin(yaw),focus.y+8*Math.sin(pitch),radius*Math.cos(yaw));
 camera.lookAt(focus);
 if(Math.abs(camera.zoom-zoom)>.00005){camera.zoom=zoom;camera.updateProjectionMatrix()}
 dustUniforms.pixelScale.value=stageSize*.25*renderer.getPixelRatio()*zoom;

 const ignition=ceremony.light(now);
 flame.visible=ignition>.005;
 flame.rotation.z=.057*Math.sin(elapsed*3.7)+.025*Math.sin(elapsed*6.1);
 flame.scale.y=ignition*(1+.047*Math.sin(elapsed*5));
 glow.material.opacity=ignition*.51;
 lamp.intensity=ignition*(.65+.055*Math.sin(elapsed*5));
 for(const {batch,items} of floaters){
  items.forEach((p,i)=>{
   const a=p.a+elapsed*p.speed,z=p.radius*Math.cos(a);
   temp.position.set(p.radius*Math.sin(a),p.y+p.lift*Math.sin(elapsed*.55+p.phase),z);
   temp.rotation.set(.32*Math.sin(p.phase),.4*Math.sin(a),p.phase+elapsed*.08);
   const size=p.size*decoration.orbitScale(p.shape,a-yaw)*(.89+.14*Math.sin(elapsed*.72+p.phase));
   temp.scale.setScalar(size);temp.updateMatrix();batch.setMatrixAt(i,temp.matrix);
  });
  batch.instanceMatrix.needsUpdate=true;
 }
 dustUniforms.time.value=elapsed;
 renderer.render(scene,camera);
}
ceremony.ready();
requestAnimationFrame(frame);
})();
