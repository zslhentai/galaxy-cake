(()=>{
const T=THREE, pi=Math.PI, tau=2*pi;
const scene=new T.Scene(), camera=new T.PerspectiveCamera(31,1,.1,60);
let renderer;try {renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true})} catch { softwareCake();return }
renderer.setClearColor(0x08090e);renderer.outputEncoding=T.sRGBEncoding;
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
fromModel('Porcelain',surface(0xe5e6fa,.24),scene);
function ring(r,y,width,color){const m=mesh(new T.TorusGeometry(r,width,8,150),surface(color,.27));m.rotation.x=pi/2;m.position.y=y}
ring(1.49,.082,.005,0xb79e7d);ring(1.484,.030,.008,0x525e95);
function blobTexture(stops){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
 stops.forEach(([p,s])=>g.addColorStop(p,s));ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new T.CanvasTexture(c)
}
const contact=mesh(new T.PlaneGeometry(2.72,2.72),new T.MeshBasicMaterial({map:blobTexture([[0,'#000'],[.68,'#000'],[.77,'rgba(20,16,36,.42)'],[.88,'transparent'],[1,'transparent']]),transparent:true,depthWrite:false}));contact.rotation.x=-pi/2;contact.position.y=.067;
const top=mesh(new T.SphereGeometry(1,72,20),surface(0xffffff,.5,{map:texture(cream)}),cake);top.scale.set(.992,.112,.992);top.position.y=1.385;
// Sweep a ridged piping nozzle through tapered shell-shaped arcs.
const vertices=[],faces=[],tints=[];
const palette=[0xffdfad,0xfac49b,0xffdfa1,0xefb4bb,0xbcb1df,0xffdc9d,0xeaa8b1];
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
const temp=new T.Object3D(),sweets=[0xe5aa43,0xffce69,0x42aadc,0xf688ab,0x9b8bd1,0xffecd4,0x577bcc];
function candy(geometry,count,isStar){
 const batch=new T.InstancedMesh(geometry,surface(0xffffff,.3,{metalness:.18}),count);cake.add(batch);
 for(let i=0;i<count;i++){const a=rand()*tau,r=Math.sqrt(rand())*.94,size=isStar?.028+rand()*.06:.009+rand()*.026;
 temp.position.set(r*Math.sin(a),1.396+.108*Math.sqrt(1-r*r)+(r>.83?.09:.014),r*Math.cos(a));
 temp.rotation.set(-pi/2+rand()*.7,rand()*.4,rand()*tau);temp.scale.setScalar(size);temp.updateMatrix();batch.setMatrixAt(i,temp.matrix);batch.setColorAt(i,new T.Color(sweets[i%sweets.length]))}
}
candy(star,29,true);candy(new T.IcosahedronGeometry(1,0),135,false);
const wax=mesh(new T.CylinderGeometry(.043,.053,.81,32),surface(0xffcf73,.55),cake);wax.position.y=1.89;
const wick=mesh(new T.CylinderGeometry(.009,.012,.074,12),surface(0x533833),cake);wick.position.y=2.31;
const flameShape=new T.LatheGeometry([[.001,0],[.035,.014],[.06,.053],[.065,.094],[.058,.14],[.041,.2],[.023,.26],[.01,.33],[.001,.39]].map(v=>new T.Vector2(...v)),40);
const flame=mesh(flameShape,new T.ShaderMaterial({vertexShader:'varying float h;void main(){h=position.y;vec3 p=position;p.x+=.032*pow(h/.39,2.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'varying float h;void main(){vec3 c=mix(vec3(1.,.52,.12),vec3(1.,.98,.83),smoothstep(0.,.09,h));c=mix(c,vec3(1.,.75,.33),smoothstep(.15,.39,h));gl_FragColor=vec4(c,1.);}' }));flame.position.y=2.32;
const glow=new T.Sprite(new T.SpriteMaterial({map:blobTexture([[0,'rgba(255,237,170,.94)'],[.15,'rgba(255,187,75,.5)'],[.42,'rgba(244,145,52,.13)'],[1,'transparent']]),blending:T.AdditiveBlending,transparent:true,depthWrite:false}));glow.scale.set(.78,.96,1);glow.position.y=2.46;scene.add(glow);
const lamp=new T.PointLight(0xffb457,1.4,3);lamp.position.y=2.42;scene.add(lamp,new T.HemisphereLight(0xfff4e6,0x929abe,.69));
function light(x,y,z,color,power){const l=new T.DirectionalLight(color,power);l.position.set(x,y,z);scene.add(l)}
light(-3,5,4,0xffeddf,.86);light(3,3,-4,0xa9c9ff,.93);
const dust=[];
function orbitBatch(g,count,big){
 const batch=new T.InstancedMesh(g,new T.MeshBasicMaterial({color:0xffffff}),count);scene.add(batch);
 const items=Array.from({length:count},(_,i)=>{const h=.18+2.75*rand(),r=(.9+.72*Math.sqrt(Math.max(0,1-((h-1.38)/1.7)**2)))*(.72+.28*rand());const col=new T.Color(sweets[i%sweets.length]);batch.setColorAt(i,col);return {h,r,a:rand()*tau,s:big?.019+.06*rand():.003+.015*rand()**2,p:rand()*tau}});
 dust.push({batch,items,big})
}
orbitBatch(star,23,true);
const mist=new T.BufferGeometry(),positions=[],parameters=[],colors=[];
for(let i=0;i<330;i++){
 const layer=i%3,a=rand()*tau,r=(.93+.65*rand())*(1+.14*layer);
 positions.push(r*Math.sin(a),.12+rand()*2.9,r*Math.cos(a)-.9*layer);
 parameters.push(rand()*tau,.023+.014*(2-layer),(.75+rand()*1.65)/(1+.32*layer),layer);
 const tint=new T.Color([0xffce99,0xd3dff4,0x9da9d2][layer]);colors.push(tint.r,tint.g,tint.b);
}
mist.setAttribute('position',new T.Float32BufferAttribute(positions,3));
mist.setAttribute('motion',new T.Float32BufferAttribute(parameters,4));
mist.setAttribute('color',new T.Float32BufferAttribute(colors,3));
const dustUniforms={time:{value:0},pixelScale:{value:1}};
scene.add(new T.Points(mist,new T.ShaderMaterial({
 uniforms:dustUniforms,vertexColors:true,transparent:true,depthWrite:false,
 vertexShader:`attribute vec4 motion; uniform float time,pixelScale;varying vec3 tint;varying float alpha;
 void main(){float a=time*motion.y;vec3 p=position;p.z+=.9*motion.w;
 p.xz=mat2(cos(a),sin(a),-sin(a),cos(a))*p.xz;p.z-=.9*motion.w;p.y+=.028*sin(time*.4+motion.x);
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pixelScale*motion.z/(-mv.z),1.,9.);
 tint=color;alpha=(.62+.23*sin(time*(.53+.04*motion.x)+motion.x))/(1.+.25*motion.w);}`,
 fragmentShader:`varying vec3 tint;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(tint,alpha*(1.-smoothstep(.12,1.,r)));}`
})));
for(let k=0;k<3;k++){
 const pts=[],start=-1.42+k*.66,length=1.18+rand()*.65;
 for(let j=0;j<=75;j++){const a=start+j/75*length;pts.push(new T.Vector3((1.68+.014*k)*Math.sin(a),1.30+1.85*Math.cos(a),-.28+.1*Math.sin(2*a+k)))}
 scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:k%2?0xd8aa78:0x99afca,transparent:true,opacity:.12+.05*(k%4)})))
}
let renderBudget=1.7,slowTime=0;
function resize(){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,renderBudget,w<600?1.5:1.7,Math.sqrt(2200000/(w*h))));dustUniforms.pixelScale.value=h*renderer.getPixelRatio()*.014;renderer.setSize(w,h);camera.aspect=w/h;camera.position.set(0,1.42+2.1*Math.max(1,.83/camera.aspect),6.98*Math.max(1,.83/camera.aspect));camera.lookAt(0,1.38,0);camera.updateProjectionMatrix()}
onresize=resize;resize();
let elapsed=0,last=performance.now();
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
 slowTime=dt>.029?slowTime+dt:Math.max(0,slowTime-2*dt);
 if(slowTime>3 && renderBudget>1){renderBudget=Math.max(1,renderer.getPixelRatio()-.2);slowTime=0;resize()}
 cake.rotation.y=pi+elapsed*.16;flame.rotation.z=.057*Math.sin(elapsed*3.7)+.025*Math.sin(elapsed*6.1);flame.scale.y=1+.026*Math.sin(elapsed*5);lamp.intensity=1.13+.05*Math.sin(elapsed*5);
 for(const {batch,items,big} of dust){items.forEach(({h,r,a,s,p},i)=>{let angle=a+elapsed*(.062+.022*Math.sin(p));temp.position.set(r*Math.sin(angle),h+.044*Math.sin(p+elapsed*.67),r*Math.cos(angle));temp.rotation.set(.17*Math.sin(p+elapsed*.22),big?.53*Math.sin(angle):0,p+elapsed*.07);temp.scale.setScalar(s*(.89+.16*Math.sin(elapsed*1.25+p)));temp.updateMatrix();batch.setMatrixAt(i,temp.matrix)});batch.instanceMatrix.needsUpdate=true}
 dustUniforms.time.value=elapsed;renderer.render(scene,camera);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
})();
