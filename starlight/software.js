// Orthographic CPU ray-casting for browsers with WebGL disabled.
// Intersect camera rays with the rounded cake, porcelain profile and top surface;
// retain the depth of each hit for occlusion of moving sugar decorations.
async function softwareCake(){
 const old=document.querySelector('#cake'),canvas=old.cloneNode();old.replaceWith(canvas);
 cakeView.bind(canvas,false);
 const ctx=canvas.getContext('2d'),N=620,c=document.createElement('canvas');c.width=c.height=N;
 const g=c.getContext('2d'),tau=2*Math.PI,k=155,tilt=.315,co=Math.cos(tilt),si=Math.sin(tilt);
 function project(x,y,z){return [N/2+x*k,514-k*(y*co-z*si),y*si+z*co]}
 async function pixels(src){const img=new Image();img.src=src;await img.decode();const b=document.createElement('canvas');b.width=img.width;b.height=img.height;const bc=b.getContext('2d');bc.drawImage(img,0,0);return bc.getImageData(0,0,b.width,b.height)}
 const [side,icing]=await Promise.all([pixels(glaze),pixels(cream)]);
 const frame=g.createImageData(N,N),base=new Uint8ClampedArray(frame.data.length),depth=new Float32Array(N*N).fill(-99),hits=[];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
 const X=(x-N/2)/k,V=(514-y)/k,i=y*N+x,j=i*4;let color=[0,0,0],D=-99;
 // Revolve every ring from the Blender mesh. Intersections against each
 // truncated cone provide continuous surface normals, UVs and depth.
 for(const name of ['Porcelain','Glaze']){
 const rings=models[name][0];
 for(let row=0;row<rings.length/161-1;row++){
  const [,,r0]=rings[row*161],[,,r1]=rings[(row+1)*161],h0=rings[row*161][1],h1=rings[(row+1)*161][1];
  const dh=h1-h0,dr=r1-r0;
  // parameterise ray by camera-space depth
  const A=co*co*dh*dh-dr*dr*si*si,B=-2*V*si*co*dh*dh-2*(r0*dh+dr*(V*co-h0))*dr*si,C=(X*X+V*V*si*si)*dh*dh-(r0*dh+dr*(V*co-h0))**2;
  const disc=B*B-4*A*C;if(disc<0)continue;
  const roots=Math.abs(dh)<.000001?[(h0-V*co)/si]:[(-B+Math.sqrt(disc))/(2*A),(-B-Math.sqrt(disc))/(2*A)];
  for(const d of roots){if(!Number.isFinite(d)||d<=D)continue;
   const H=V*co+d*si,Z=-V*si+d*co,R=Math.hypot(X,Z);
   if(H<Math.min(h0,h1)-.00001||H>Math.max(h0,h1)+.00001||R<Math.min(r0,r1)-.0001||R>Math.max(r0,r1)+.0001)continue;
   D=d;const norm=Math.hypot(dr,dh),nx=X/R*dh/norm,ny=-dr/norm,nz=Z/R*dh/norm;
   const l=.67+.37*Math.max(0,-.55*nx+.69*ny+.48*nz);
   if(name==='Porcelain'){const sh=1-.47*Math.exp(-(((R-1)/.13)**2));color=H<.053&&R>1.42?[133*l,81*l,63*l]:[103*l*sh,89*l*sh,144*l*sh];if((R>1.479&&ny>.2)||Math.abs(R-1.373)<.005)color=[218,175,108]}
   else color={u:Math.atan2(X,Z)/tau,v:1-H/1.44,l,shine:12*Math.pow(Math.max(0,nz*.88-nx*.46),10)};
  }
 }}
 const d=(1.44-V*co)/si,Z=-V*si+d*co,R=Math.hypot(X,Z);
 if(R<=.984&&d>D){D=d;color={top:true,u:Math.atan2(X,Z)/tau,v:R,l:.82+.22*(1-R),shine:3}}
 depth[i]=D;
 if(Array.isArray(color)){for(let n=0;n<3;n++)base[j+n]=color[n]}else hits.push([j,color.u,color.v,color.l,color.shine,color.top?1:0]);base[j+3]=D>-99?255:0;
 }
 // Precompute row offsets and lighting once. Texture shifts are integral columns.
 const count=hits.length, offsets=new Int32Array(count), columns=new Int32Array(count),rows=new Int32Array(count);
 const gain=new Float32Array(count),spec=new Float32Array(count),isCap=new Uint8Array(count);
 for(let i=0;i<count;i++){
  const [pixel,u,v,l,shine,cap]=hits[i],tex=cap?icing:side;
  offsets[i]=pixel;columns[i]=Math.floor((u+1)*tex.width)%tex.width;
  rows[i]=Math.max(0,Math.min(tex.height-1,Math.floor(v*tex.height)))*tex.width;
  gain[i]=l;spec[i]=shine;isCap[i]=cap;
 }
 hits.length=0;
 const amber=['#f6dc9d','#dcbeac','#d1bcdc','#b8d7dc','#f3cd96','#d9acd3'];
 const candy=decoration.candy.map(piece=>({...piece}));
 const plate=decoration.plate.map(piece=>({...piece,x:0,screenY:0,d:0}));
 const shells=Array.from({length:29},(_,i)=>({
  angle:i*tau/29,radius:.938,y:1.454+.018*Math.sin(i*2.4),color:amber[i%amber.length],
  shape:'shell',size:.068+.034*(.5+.5*Math.sin(i*4.2)),phase:0
 }));
 candy.push(...shells);
 const air=decoration.orbit;
 const lightSprites=new Map();
 for(const {shape,color} of air){
  if(shape!=='light'||lightSprites.has(color))continue;
  const sprite=document.createElement('canvas');sprite.width=sprite.height=48;
  const paint=sprite.getContext('2d'),fade=paint.createRadialGradient(24,24,0,24,24,24);
  for(const [stop,hue] of [[0,'#fffef2'],[.25,'#fffef2'],[.35,color],[.5,color+'76'],[.78,color+'24'],[1,'transparent']])fade.addColorStop(stop,hue);
  paint.fillStyle=fade;paint.fillRect(0,0,48,48);lightSprites.set(color,sprite);
 }
 function star(x,y,r,angle,color,flatten=1){
  g.fillStyle=color;g.beginPath();
  for(let i=0;i<10;i++){
   const theta=i*Math.PI/5+angle,s=i%2?r*.43:r;
   g.lineTo(x+s*Math.sin(theta),y+s*Math.cos(theta)*flatten);
  }
  g.closePath();g.fill();
 }
 function dot(x,y,r,color){g.beginPath();g.arc(x,y,r,0,tau);g.fillStyle=color;g.fill()}
 function chip(x,y,r,angle,color,flat){
  g.save();g.translate(x,y);g.scale(1,flat);g.rotate(angle);
  for(let layer=0;layer<2;layer++){
   g.fillStyle=layer?color:'#181b38';g.beginPath();g.moveTo(-r,.34*r);g.lineTo(.12*r,-.83*r);
   g.lineTo(r,-.11*r);g.lineTo(.51*r,.76*r);g.lineTo(-.46*r,.9*r);g.closePath();g.fill();
   if(layer===0)g.translate(0,-r*.24);
  }
  g.fillStyle='#fff6d751';g.beginPath();g.moveTo(-r,.34*r);g.lineTo(.12*r,-.83*r);g.lineTo(.49*r,-.52*r);g.lineTo(-.67*r,.46*r);g.fill();
  g.restore();
 }
 function halo(x,y,r,stops){
  const gradient=g.createRadialGradient(x,y,0,x,y,r);
  for(const [p,color] of stops)gradient.addColorStop(p,color);
  g.fillStyle=gradient;g.fillRect(x-r,y-r,2*r,2*r);
 }
 const creamLight=[[0,'rgba(255,206,102,.46)'],[.42,'rgba(255,179,70,.22)'],[1,'transparent']];
 const fireLight=[[0,'rgba(255,228,159,.82)'],[.22,'rgba(255,164,53,.37)'],[1,'transparent']];
 const wax= g.createLinearGradient(N/2-7,0,N/2+7,0);
 for(const [p,color] of [[0,'#ab6c31'],[.27,'#e7b256'],[.55,'#fff0ba'],[1,'#d79b4a']])wax.addColorStop(p,color);
 const dome=[
  [247,248,.026,3.23,5.9,'#efc99288',1.2],
  [252,252,-.025,2.83,4.36,'#a3bddd55',.9],
  [254,256,-.031,4.32,6.1,'#f3c68c43',.7],
  [239,243,.007,2.91,4.48,'#99c4f06b',1.2],
  [243,245,.06,4.94,6.45,'#72a5d73d',1.1],
 ];
 function drawPiece(piece){
  const {x,screenY:y,color,size,shape,spin}=piece;
  const r=k*size;
  if(shape==='shell'){
   g.save();g.translate(x,y);g.rotate(.24*Math.sin(spin));
   const w=r*(.73+.57*Math.abs(Math.cos(spin))),h=4.5+r*.32;
   const gradient=g.createLinearGradient(0,-h,0,h);
   gradient.addColorStop(0,'#fff1cf');gradient.addColorStop(.47,color);gradient.addColorStop(1,'#8f687d');
   g.fillStyle=gradient;g.beginPath();g.moveTo(-w,2);g.bezierCurveTo(-w*.8,-h,-w*.32,-h*1.18,w*.04,-h*.62);
   g.bezierCurveTo(w*.44,-h*1.02,w*.52,h*.1,w,h*.18);g.quadraticCurveTo(w*.34,h*.94,-w,2);g.fill();
   g.strokeStyle='#876e805e';g.lineWidth=.78;
   for(let j=0;j<3;j++){g.beginPath();g.moveTo(-w*.77,1+j*1.3);g.quadraticCurveTo(-w*.12,-h*.86+j*2,w*.85,1+j*.66);g.stroke()}
   g.restore();
  }else if(shape==='pearl'||shape==='dust'){
   dot(x,y+1,r,'#896d61');dot(x,y,r,color);dot(x-r*.31,y-r*.31,r*.42,'#fff2cd');
  }else if(shape==='star'){
   star(x,y+1.8,r,spin,'#493449',.62);star(x,y,r,spin,color,.62);
  }else chip(x,y,r,spin,color,.57);
 }
 const moon = [];
 const tip = Math.PI*57/180;
 const mid = .39;
 const cut = Math.atan2(Math.sin(tip), Math.cos(tip)-mid);
 const cutRadius = Math.hypot(Math.cos(tip)-mid, Math.sin(tip));
 for(let i=0;i<=24;i++){
  const a=tip+(tau-2*tip)*i/24;
  moon.push([Math.cos(a),Math.sin(a)]);
 }
 for(let i=1;i<24;i++){
  const a=-cut-(tau-2*cut)*i/24;
  moon.push([mid+cutRadius*Math.cos(a),cutRadius*Math.sin(a)]);
 }
 const pointedStar = Array.from({length:8},(_,i)=>{
  const a=i*tau/8,r=i%2?.31:1;
  return [r*Math.sin(a),r*Math.cos(a)*1.22];
 });
 const toppings=[
  {x:-.49,y:1.69,z:.064,r:.232,a:-.35,spin:.25,shape:moon,light:'#fff1bb',color:'#bd843a'},
  {x:-.25,y:1.81,z:.035,r:.088,a:-.26,spin:-.14,shape:pointedStar,light:'#fff4d6',color:'#d4a566'},
  {x:.48,y:1.63,z:.09,r:.143,a:.31,spin:.32,shape:pointedStar,light:'#becffc',color:'#4e76b1'},
  {x:.40,y:1.65,z:-.35,r:.117,a:.57,spin:-.29,shape:pointedStar,light:'#ffe6a3',color:'#c79444'},
 ];
 function paintToppings(turn){
  const c=Math.cos(turn),s=Math.sin(turn);
  const rotated=toppings.map(t=>({t,x:t.x*c+t.z*s,z:t.z*c-t.x*s})).sort((a,b)=>a.z-b.z);
  for(const {t,x,z} of rotated){
   const [cx,cy]=project(x,t.y,z);
   const C=Math.cos(turn+t.a),S=Math.sin(turn+t.a);
   const gradient=g.createLinearGradient(cx-t.r*k,cy-t.r*k,cx+t.r*k,cy+t.r*k);
   gradient.addColorStop(0,t.light);gradient.addColorStop(.26,t.color);
   gradient.addColorStop(.53,t.light);gradient.addColorStop(1,t.color);
   g.beginPath();
   for(const [u,v] of t.shape){
    const U=(u*Math.cos(t.spin)-v*Math.sin(t.spin))*t.r;
    const V=(u*Math.sin(t.spin)+v*Math.cos(t.spin))*t.r;
    const [sx,sy]=project(x+U*C,t.y+V,z-U*S);
    g.lineTo(sx,sy);
   }
   g.closePath();
   g.strokeStyle=t.color;g.lineWidth=1.55;g.stroke();
   g.fillStyle=gradient;g.fill();
  }
 }
 function movePiece(piece,turn){
  const angle=piece.angle+turn,z=piece.radius*Math.cos(angle);
  piece.x=N/2+piece.radius*Math.sin(angle)*k;
  piece.screenY=514-k*(piece.y*co-z*si);
  piece.d=piece.y*si+z*co;piece.spin=piece.shape==='shell'?angle:piece.phase+turn;
 }
 for(const p of plate)movePiece(p,0);
 let last=0;
 function draw(time){
  requestAnimationFrame(draw);
  if(!ceremony.active || time-last<14)return;
  last=time;
  const view=cakeView.update(time);
  const t=ceremony.reduced?0:time/1000,turn=-view.yaw,shift=.5-turn/tau;
  frame.data.set(base);
  const phase=shift-Math.floor(shift),sideShift=Math.floor(phase*side.width),capShift=Math.floor(phase*icing.width);
  for(let i=0;i<count;i++){
   const cap=isCap[i],tex=cap?icing:side;
   let col=columns[i]+(cap?capShift:sideShift);
   if(col>=tex.width)col-=tex.width;
   const source=(rows[i]+col)*4,j=offsets[i],l=gain[i],shine=spec[i];
   frame.data[j]=tex.data[source]*l+shine;
   frame.data[j+1]=tex.data[source+1]*l+shine;
   frame.data[j+2]=tex.data[source+2]*l+shine;
  }
  g.putImageData(frame,0,0);
  for(const [rx,ry,rotation,start,end,color,lineWidth] of dome){
   g.strokeStyle=color;g.lineWidth=lineWidth;g.beginPath();
   g.ellipse(310,286,rx,ry,rotation,start,end);g.stroke();
  }
  for(const p of plate){
   const idx=Math.floor(p.screenY)*N+Math.floor(p.x);
   if(depth[idx]<=p.d+.012)drawPiece(p);
  }
  for(const piece of candy)movePiece(piece,turn);
  candy.sort((a,b)=>a.d-b.d);
  for(const piece of candy)drawPiece(piece);
  paintToppings(turn);

  const [cx,cy]=project(0,1.52,0),[,fy]=project(0,2.3,0);
  const flicker=2.1*Math.sin(t*3.5)+.9*Math.sin(t*5.7),ignition=ceremony.light(time);
  g.globalAlpha=ignition*(.82+.05*Math.sin(t*5));
  halo(cx,cy,91,creamLight);g.globalAlpha=1;
  g.fillStyle=wax;g.fillRect(cx-5,fy,10,cy-fy);
  g.save();g.beginPath();g.rect(cx-5,fy,10,cy-fy);g.clip();
  g.strokeStyle='#9a653eab';g.lineWidth=1.2;
  for(let y=fy+5;y<cy+6;y+=18){
   g.beginPath();g.moveTo(cx-5,y+3);g.lineTo(cx+5,y-3);g.stroke();
  }
  g.restore();
  g.fillStyle='#382a22';g.fillRect(cx-1,fy-8,2,9);
  g.globalAlpha=ignition;halo(cx,fy-24,65,fireLight);
  for(let j=0;j<2;j++){
   g.save();g.translate(cx,fy-6);g.scale(j?.56:1,j?.76:1);
   g.fillStyle=j?'#fffdf1':'#f8b641';
   g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-18,-5,-6,-27,3+flicker,-63);
   g.bezierCurveTo(4+flicker,-35,18,-7,0,0);g.fill();g.restore();
  }
  for(const p of air){
   const a=p.a+t*p.speed,z=p.radius*Math.cos(a),y=p.y+p.lift*Math.sin(t*.55+p.phase);
   const px=N/2+p.radius*Math.sin(a)*k,py=514-k*(y*co-z*si),d=y*si+z*co;
   if(depth[Math.floor(py)*N+Math.floor(px)]>d)continue;
   const front=Math.max(0,Math.min(1,(z+1.7)/3.4)),r=k*p.size*(.71+.45*front);
   g.globalAlpha=(.42+.39*front)*(.78+.22*Math.sin(t*.72+p.phase)**2);
   if(p.shape==='star')star(px,py,r,p.phase+t*.07,p.color);
   else if(p.shape==='light'){
    const glow=r*2.2;
    g.drawImage(lightSprites.get(p.color),px-glow,py-glow,glow*2,glow*2);
   }else if(p.shape==='gem'||p.shape==='chip')chip(px,py,r,p.phase+t*.10,p.color,.82);
   else dot(px,py,r,p.color);
  }
  g.globalAlpha=1;
  const w=ceremony.stage.clientWidth,h=ceremony.stage.clientHeight,dpr=Math.min(devicePixelRatio,1.5);
  const dw=Math.round(w*dpr),dh=Math.round(h*dpr);
  if(canvas.width!==dw||canvas.height!==dh){canvas.width=dw;canvas.height=dh;canvas.style.width=w+'px';canvas.style.height=h+'px'}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const size=Math.min(w*1.148,h*.91)*view.zoom;
  const centerY=514-k*1.32*co;
  ctx.drawImage(c,(w-size)/2,h/2-size*centerY/N,size,size);
 }
 ceremony.ready();
 requestAnimationFrame(draw);
}
