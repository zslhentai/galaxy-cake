(()=>{
const T=THREE, pi=Math.PI, tau=2*pi;
const scene=new T.Scene(), camera=new T.OrthographicCamera(-2,2,2,-2,.1,60);
let renderer;try {renderer=new T.WebGLRenderer({canvas:document.querySelector('#cake'),antialias:true,alpha:true})} catch { softwareCake();return }
renderer.setClearColor(0x000000,0);renderer.outputEncoding=T.sRGBEncoding;
const cake=new T.Group();scene.add(cake);
let seed=3199;
function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
const surface=(color,roughness=.48,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
function mesh(geo,mat,parent=scene){const m=new T.Mesh(geo,mat);parent.add(m);return m}
function texture(url){const t=new T.TextureLoader().load(url);t.encoding=T.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
function fromModel(name,mat,parent){
 const [points,uv,indices]=models[name],g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv.flat(),2));g.setIndex(indices);g.computeVertexNormals();return mesh(g,mat,parent)
}
const paintedGlaze=texture(glaze);
fromModel('Glaze',surface(0xffffff,.47,{map:paintedGlaze,bumpMap:paintedGlaze,bumpScale:.009}),cake);
fromModel('Porcelain',surface(0xf3eff8,.24),scene);
function ring(r,y,width,color){const m=mesh(new T.TorusGeometry(r,width,8,150),surface(color,.27));m.rotation.x=pi/2;m.position.y=y}
ring(1.49,.082,.005,0xb79e7d);ring(1.485,.027,.015,0x387bd3);
function blobTexture(stops){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
 stops.forEach(([p,s])=>g.addColorStop(p,s));ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new T.CanvasTexture(c)
}
const contact=mesh(new T.PlaneGeometry(2.72,2.72),new T.MeshBasicMaterial({map:blobTexture([[0,'#000'],[.68,'#000'],[.77,'rgba(20,16,36,.42)'],[.88,'transparent'],[1,'transparent']]),transparent:true,depthWrite:false}));contact.rotation.x=-pi/2;contact.position.y=.067;
const frostingGeometry=new T.SphereGeometry(1,72,20);
const frostPositions=frostingGeometry.getAttribute('position'),frostUV=frostingGeometry.getAttribute('uv');
for(let i=0;i<frostUV.count;i++){
 // Preserve the seam already present in the sphere's longitudinal UV.
 frostUV.setY(i,1-Math.hypot(frostPositions.getX(i),frostPositions.getZ(i)));
}
const top=mesh(frostingGeometry,surface(0xffffff,.55,{map:texture(cream)}),cake);top.scale.set(.992,.112,.992);top.position.y=1.385;
// Sweep a ridged piping nozzle through tapered shell-shaped arcs.
const vertices=[],faces=[],tints=[];
const palette=[0xf6dc9d,0xdcbeac,0xeeacd0,0xb8d7dc,0xf3cd96,0xd9acd3];
for(let k=0;k<29;k++){
 const a=k*tau/29, tint=new T.Color(palette[k%palette.length]),offset=vertices.length/3;
 for(let j=0;j<=12;j++){
  const t=j/12, angle=a+.26*t, rad=.895+.043*Math.sin(t*pi), y=1.439+.073*Math.sin(t*pi);
  for(let q=0;q<=24;q++){
   const b=q*tau/24,amp=.108*(.025+Math.pow(Math.sin(pi*t),.68))*(1+.22*Math.cos(6*b+t*4)),r=rad+amp*Math.cos(b);
   vertices.push(r*Math.sin(angle),y+amp*Math.sin(b)*.8,r*Math.cos(angle));const ao=.76+.24*(.5+.5*Math.sin(b))*(.76+.24*Math.cos(6*b+t*4));tints.push(tint.r*ao,tint.g*ao,tint.b*ao);
   if(j<12&&q<24){let i=offset+j*25+q;faces.push(i,i+25,i+1,i+1,i+25,i+26)}
  }
 }
}
const piping=new T.BufferGeometry();piping.setIndex(faces);piping.setAttribute('position',new T.Float32BufferAttribute(vertices,3));piping.setAttribute('color',new T.Float32BufferAttribute(tints,3));piping.computeVertexNormals();mesh(piping,surface(0xffffff,.56,{vertexColors:true,side:T.DoubleSide}),cake);
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
  const batch=new T.InstancedMesh(candyGeometry[shape],surface(0xffffff,.4,{metalness:.08}),items.length);
  parent.add(batch);
  items.forEach((p,i)=>{
   temp.position.set(p.radius*Math.sin(p.angle),p.y,p.radius*Math.cos(p.angle));
   temp.rotation.set(-pi/2+Math.sin(p.phase)*.21,0,p.phase);
   temp.scale.setScalar(p.size);
   temp.updateMatrix();batch.setMatrixAt(i,temp.matrix);batch.setColorAt(i,new T.Color(p.color));
  });
 }
}
arrangeSugar(decoration.candy,cake);
arrangeSugar(decoration.plate,scene);
const wax=mesh(new T.CylinderGeometry(.043,.053,.81,32),surface(0xffcf73,.55),cake);wax.position.y=1.89;
const wick=mesh(new T.CylinderGeometry(.009,.012,.074,12),surface(0x533833),cake);wick.position.y=2.31;
const flameShape=new T.LatheGeometry([[.001,0],[.035,.014],[.06,.053],[.065,.094],[.058,.14],[.041,.2],[.023,.26],[.01,.33],[.001,.42]].map(v=>new T.Vector2(...v)),40);
const flame=mesh(flameShape,new T.ShaderMaterial({vertexShader:'varying float h;void main(){h=position.y;vec3 p=position;p.x+=.032*pow(h/.39,2.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'varying float h;void main(){vec3 c=mix(vec3(1.,.52,.12),vec3(1.,.98,.83),smoothstep(0.,.09,h));c=mix(c,vec3(1.,.75,.33),smoothstep(.15,.39,h));gl_FragColor=vec4(c,1.);}' }));flame.position.y=2.32;
const glow=new T.Sprite(new T.SpriteMaterial({map:blobTexture([[0,'rgba(255,237,170,.94)'],[.15,'rgba(255,187,75,.5)'],[.42,'rgba(244,145,52,.13)'],[1,'transparent']]),blending:T.AdditiveBlending,transparent:true,depthWrite:false}));glow.scale.set(.78,.96,1);glow.position.y=2.46;scene.add(glow);
const lamp=new T.PointLight(0xffb457,1.4,3);lamp.position.y=2.42;scene.add(lamp,new T.HemisphereLight(0xfff4e6,0x929abe,.69));
function light(x,y,z,color,power){const l=new T.DirectionalLight(color,power);l.position.set(x,y,z);scene.add(l)}
light(-3,5,4,0xffeddf,.74);light(3,3,-4,0x94baff,1.06);
const floaters=[];
for(const [shape,geometry] of Object.entries({star,gem,chip})){
 const items=decoration.orbit.filter(p=>p.shape===shape);
 const batch=new T.InstancedMesh(geometry,new T.MeshBasicMaterial({color:0xffffff}),items.length);
 batch.instanceMatrix.setUsage(T.DynamicDrawUsage);batch.frustumCulled=false;scene.add(batch);
 items.forEach((p,i)=>batch.setColorAt(i,new T.Color(p.color)));
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
const tilt=.315,cosTilt=Math.cos(tilt),sinTilt=Math.sin(tilt);
const target= (514-310)/155;
const contour=[
 [247,248,.026,3.23,5.9,0xefc992,.51],[252,252,-.025,2.83,4.36,0xa3bddd,.33],
 [254,256,-.031,4.32,6.1,0xf3c68c,.26],[239,243,.007,2.91,4.48,0x99c4f0,.4],
 [243,245,.06,4.94,6.45,0x72a5d7,.23]
];
for(const [rx,ry,rotation,start,end,color,opacity] of contour){
 const pts=[];
 for(let j=0;j<=104;j++){
  const a=start+(end-start)*j/104;
  const x=rx*Math.cos(a),y=ry*Math.sin(a);
  const vx=(x*Math.cos(rotation)-y*Math.sin(rotation))/155;
  const vy=target+(24-x*Math.sin(rotation)-y*Math.cos(rotation))/155;
  pts.push(new T.Vector3(vx,vy/cosTilt-.87*sinTilt,-.87*cosTilt));
 }
 scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false})));
}
let renderBudget=1.7,slowTime=0;
function resize(){
 const w=ceremony.stage.clientWidth,h=ceremony.stage.clientHeight;
 const ratio=Math.min(devicePixelRatio,renderBudget,w<600?1.5:1.7,Math.sqrt(2200000/(w*h)));
 const size=Math.min(w*1.09,h*.995);
 renderer.setPixelRatio(ratio);renderer.setSize(w,h);
 dustUniforms.pixelScale.value=size*155/620*ratio;
 camera.left=-2*w/size;camera.right=2*w/size;camera.top=2*h/size;camera.bottom=-2*h/size;
 camera.position.set(0,target/cosTilt+8*sinTilt,8*cosTilt);
 camera.lookAt(0,target/cosTilt,0);camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();
let elapsed=0,last=performance.now();
function frame(now){ceremony.ready();if(!ceremony.active){last=now;requestAnimationFrame(frame);return}const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
 slowTime=dt>.029?slowTime+dt:Math.max(0,slowTime-2*dt);
 if(slowTime>3 && renderBudget>1){renderBudget=Math.max(1,renderer.getPixelRatio()-.2);slowTime=0;resize()}
 cake.rotation.y=pi+ceremony.turn(now);flame.rotation.z=.057*Math.sin(elapsed*3.7)+.025*Math.sin(elapsed*6.1);flame.scale.y=1+.026*Math.sin(elapsed*5);const ignition=ceremony.light(now);flame.visible=ignition>.005;flame.scale.y*=ignition;glow.material.opacity=ignition;lamp.intensity=ignition*(1.25+.06*Math.sin(elapsed*5));
 for(const {batch,items} of floaters){
  items.forEach((p,i)=>{
   const a=p.a+elapsed*p.speed,z=p.radius*Math.cos(a);
   temp.position.set(p.radius*Math.sin(a),p.y+p.lift*Math.sin(elapsed*.55+p.phase),z);
   temp.rotation.set(.32*Math.sin(p.phase),.4*Math.sin(a),p.phase+elapsed*.08);
   const size=p.size*(.89+.14*Math.sin(elapsed*.72+p.phase));
   temp.scale.setScalar(size);temp.updateMatrix();batch.setMatrixAt(i,temp.matrix);
  });
  batch.instanceMatrix.needsUpdate=true;
 }
 dustUniforms.time.value=elapsed;renderer.render(scene,camera);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
})();
