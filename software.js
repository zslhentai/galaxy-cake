// Orthographic CPU ray-casting for browsers with WebGL disabled.
// Intersect camera rays with the rounded cake, porcelain profile and top surface;
// retain the depth of each hit for occlusion of moving sugar decorations.
async function softwareCake(){
 const old=document.querySelector('canvas'),canvas=old.cloneNode();old.replaceWith(canvas);
 const ctx=canvas.getContext('2d'),N=620,c=document.createElement('canvas');c.width=c.height=N;
 const g=c.getContext('2d'),tau=2*Math.PI,k=149,tilt=.32,co=Math.cos(tilt),si=Math.sin(tilt);
 function project(x,y,z){return [N/2+x*k,505-k*(y*co-z*si),y*si+z*co]}
 async function pixels(src){const img=new Image();img.src=src;await img.decode();const b=document.createElement('canvas');b.width=img.width;b.height=img.height;const bc=b.getContext('2d');bc.drawImage(img,0,0);return bc.getImageData(0,0,b.width,b.height)}
 const [side,icing]=await Promise.all([pixels(glaze),pixels(cream)]);
 const frame=g.createImageData(N,N),base=new Uint8ClampedArray(frame.data.length),depth=new Float32Array(N*N).fill(-99),hits=[];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
 const X=(x-N/2)/k,V=(505-y)/k,i=y*N+x,j=i*4;let color=[8,9,14],D=-99;
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
   if(name==='Porcelain'){const sh=1-.47*Math.exp(-(((R-1)/.13)**2));color=[225*l*sh,226*l*sh,236*l*sh];if(R>1.496&&ny>.25)color=[214,196,165]}
   else color={u:Math.atan2(X,Z)/tau,v:1-H/1.44,l,shine:12*Math.pow(Math.max(0,nz*.88-nx*.46),10)};
  }
 }}
 const d=(1.44-V*co)/si,Z=-V*si+d*co,R=Math.hypot(X,Z);
 if(R<=.984&&d>D){D=d;color={top:true,u:Math.atan2(X,Z)/tau,v:R,l:.91+.09*(1-R),shine:2}}
 depth[i]=D;
 if(Array.isArray(color)){for(let n=0;n<3;n++)base[j+n]=color[n]}else hits.push([j,color.u,color.v,color.l,color.shine,color.top?1:0]);base[j+3]=255;
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
 let seed=23;function rnd(){seed=seed*16807%2147483647;return seed/2147483647}
 const colors=['#ffe885','#e2a646','#499fe8','#fb8ea7','#b4a1ed','#fff4ca','#45c5bc'];
 const chips=Array.from({length:138},(_,i)=>({a:rnd()*tau,r:Math.sqrt(rnd())*.965,s:.012+rnd()**2*.079,col:colors[i%7],p:rnd()*tau}));
 const air=Array.from({length:305},(_,i)=>{let h=.16+2.8*rnd();return {a:rnd()*tau,r:(.48+.52*rnd())*1.63*Math.sqrt(Math.max(.15,1-((h-1.42)/1.8)**2)),h,s:i<21?.018+rnd()*.049:.003+rnd()**2*.014,c:colors[i%7],p:rnd()*tau}});
 function star(x,y,r,ang,col,flatten=1){g.fillStyle=col;g.beginPath();for(let j=0;j<10;j++){let b=j*Math.PI/5+ang,s=j%2?r*.43:r;g.lineTo(x+s*Math.sin(b),y+s*Math.cos(b)*flatten)}g.closePath();g.fill()}
 function dot(x,y,r,col){g.beginPath();g.arc(x,y,r,0,tau);g.fillStyle=col;g.fill()}
 function halo(x,y,r,stops){const gr=g.createRadialGradient(x,y,0,x,y,r);stops.forEach(([p,c])=>gr.addColorStop(p,c));g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
 const decor=chips.map(chip=>({...chip,phase:chip.p,h:1.457+.025*(1-chip.r)}));
 const shellColors=['#f1bba4','#e5a5c0','#f9d58c','#aebbdf','#f6c4a3'];
 for(let j=0;j<29;j++){
  const a=j*tau/29;decor.push({a,r:.939,h:1.444+.018*Math.sin(a*7),s:.10,col:shellColors[j%5],shell:true});
 }
 function draw(time){
 const t=time/1000,turn=t*.16,shift=.5-turn/tau;frame.data.set(base);
 const phase=shift-Math.floor(shift),sideShift=Math.floor(phase*side.width),capShift=Math.floor(phase*icing.width);
 for(let i=0;i<count;i++){
  const cap=isCap[i],tex=cap?icing:side;
  let col=columns[i]+(cap?capShift:sideShift);if(col>=tex.width)col-=tex.width;
  const k=(rows[i]+col)*4,j=offsets[i],l=gain[i],shine=spec[i];
  frame.data[j]=tex.data[k]*l+shine;frame.data[j+1]=tex.data[k+1]*l+shine;frame.data[j+2]=tex.data[k+2]*l+shine;
 }
 g.putImageData(frame,0,0);
 for(let j=0;j<3;j++){g.strokeStyle=['#8f775a','#897b72','#5f6479'][j%3];g.globalAlpha=.34;g.lineWidth=j%2?.65:1.2;g.beginPath();g.ellipse(310,279,245+j*1.3,241+j*1.9,-.045*j,3.48+j*.85,4.60+j*.93);g.stroke()}g.globalAlpha=1;
 for(const e of decor){
  const angle=e.a+turn,z=e.r*Math.cos(angle);
  e.x=N/2+e.r*Math.sin(angle)*k;e.y=505-k*(e.h*co-z*si);e.d=e.h*si+z*co;
  e.p=e.shell?angle:e.phase;
 }
 decor.sort((a,b)=>a.d-b.d);for(const e of decor){if(e.shell){g.save();g.translate(e.x,e.y);g.rotate(.18*Math.sin(e.p));const w=8+12*Math.abs(Math.cos(e.p)),gradient=g.createLinearGradient(0,-6,0,6);gradient.addColorStop(0,'#ebd7bf');gradient.addColorStop(.35,e.col);gradient.addColorStop(1,'#9a716f');g.fillStyle=gradient;g.beginPath();g.moveTo(-w,2);g.bezierCurveTo(-w*.6,-6,-w*.3,-8,0,-4);g.bezierCurveTo(w*.22,-8,w*.55,-2,w,2);g.quadraticCurveTo(0,10,-w,2);g.fill();g.strokeStyle='rgba(121,86,86,.38)';g.lineWidth=.85;for(let ridge=-1;ridge<=1;ridge++){g.beginPath();g.moveTo(-w*.72,3);g.bezierCurveTo(-w*.15,-6+ridge*2,w*.2,-5+ridge*2,w*.8,2+ridge);g.stroke()}g.restore()}else {star(e.x+.5,e.y+1.4,e.s*k,e.p+turn,'#9e806b',.55);star(e.x,e.y,e.s*k,e.p+turn,e.col,.55)}}
 const [cx,cy]=project(0,1.48,0),[,fy]=project(0,2.3,0),f=2*Math.sin(t*3.4)+.8*Math.sin(t*5.7);
 g.globalAlpha=.78+.05*Math.sin(t*5);halo(cx,cy,65,[[0,'rgba(255,202,75,.38)'],[1,'transparent']]);g.globalAlpha=1;let wax=g.createLinearGradient(cx-7,0,cx+7,0);[[0,'#ae7636'],[.25,'#f0c673'],[.52,'#ffedac'],[1,'#d99941']].forEach(([p,c])=>wax.addColorStop(p,c));g.fillStyle=wax;g.fillRect(cx-6,fy,12,cy-fy);g.fillStyle='#3e291d';g.fillRect(cx-1,fy-8,2,9);
 halo(cx,fy-18,56,[[0,'rgba(255,213,125,.85)'],[.22,'rgba(255,164,53,.37)'],[1,'transparent']]);
 for(let j=0;j<2;j++){g.save();g.translate(cx,fy-6);g.scale(j?.58:1,j?.73:1);g.fillStyle=j?'#fff9d5':'#ffbd55';g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-17,-4,-5,-25,3+f,-55);g.bezierCurveTo(2+f,-31,21,-4,0,0);g.fill();g.restore()}
 air.forEach(({a,r,h,s,c,p},i)=>{const layer=i%3;a+=t*(.026+.012*(2-layer));const [x,y,d]=project(r*Math.sin(a),h+.027*Math.sin(t+p),r*Math.cos(a)-layer*.43);if(depth[Math.floor(y)*N+Math.floor(x)]>d)return;g.globalAlpha=(.69+.25*Math.sin(t*(.66+.04*p)+p)**2)/(1+.38*layer);if(i<21)star(x,y,k*s,p+t*.09,c);else dot(x,y,k*s,c)});g.globalAlpha=1;
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px'}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#08090e';ctx.fillRect(0,0,w,h);const size=Math.min(w*1.10,h*.9);ctx.drawImage(c,(w-size)/2,(h-size)/2-h*.025,size,size);requestAnimationFrame(draw)
 }requestAnimationFrame(draw)
}
