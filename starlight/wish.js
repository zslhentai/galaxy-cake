const ceremony=(()=>{
 const sky=document.querySelector('#sky'),ctx=sky.getContext('2d'),button=document.querySelector('button');
 const stage=document.querySelector('.stage'),tau=Math.PI*2,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let width,height,size,started=null,ready=false,pending=false,last=0;
 const sparks=Array.from({length:74},(_,i)=>({a:i*2.39996,r:.23+.64*((i*73%101)/101),v:.07+.003*(i%17)}));
 function resize(){width=innerWidth;height=innerHeight;size=Math.min(width,height);const ratio=Math.min(devicePixelRatio,1.5);sky.width=width*ratio;sky.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0)}
 resize();addEventListener('resize',resize);
 function ease(t){t=Math.min(1,Math.max(0,t));return t*t*(3-2*t)}
 function age(now){return started===null?0:(now-started)/1000}
 function start(){if(started!==null)return;started=performance.now()-(reduced?2050:0);document.body.classList.add('started');button.disabled=true}
 button.addEventListener('click',()=>{pending=true;if(ready)start()},{once:true});
 function star(x,y,r,stretch=1){ctx.beginPath();for(let i=0;i<8;i++){let a=i*Math.PI/4,l=i%2?r*.16:r;ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l*stretch)}ctx.closePath();ctx.fill()}
 function frame(now){if(now-last<31){requestAnimationFrame(frame);return}last=now;
 const t=age(now),f=started!==null,collapse=ease(t/.95),scatter=ease((t-1.65)/.88);
 if(t>.76)document.body.classList.add('seen');if(t>1.85)document.body.classList.add('lit');
 ctx.clearRect(0,0,width,height);if(t>=2.58){sky.hidden=true;button.hidden=true;return}
 const cx=width/2,cy=height*(.45-.07*collapse),s=Math.min(size*.157,88);
 ctx.save();ctx.translate(cx,cy);ctx.strokeStyle='#d8b480';ctx.fillStyle='#ffe4ae';ctx.lineWidth=.8;
 ctx.globalAlpha=.76*(1-collapse);ctx.rotate(.07*Math.sin(now*.0003));
 for(const r of [.71,.91,1]){ctx.beginPath();ctx.ellipse(0,0,s*r,s*r,0,.12,6.17);ctx.stroke()}
 for(let j=0;j<48;j++){let a=j*tau/48,R=j%4===0?.79:.87;ctx.beginPath();ctx.moveTo(s*R*Math.cos(a),s*R*Math.sin(a));ctx.lineTo(s*.91*Math.cos(a),s*.91*Math.sin(a));ctx.stroke()}
 star(0,0,s*.58,1.22);ctx.rotate(Math.PI/4);star(0,0,s*.32);ctx.restore();
 for(const [i,p] of sparks.entries()){let a=p.a+now*.00004*p.v+(collapse-scatter)*.86,r=size*p.r*(1-collapse+.88*scatter);
 const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*1.2;
 ctx.globalAlpha=(.45+.32*Math.sin(now*.001*p.v+p.a)**2)*(1-scatter);
 ctx.fillStyle=['#efcd8c','#a0bbde','#c791ba'][i%3];star(x,y,(i%7===0?3:1.15)*(1+.45*collapse))}
 if(f){const alpha=Math.sin(Math.PI*ease((t-.55)/1.35))*.56;
 const r=size*(.025+.36*ease((t-.55)/1.35));const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
 g.addColorStop(0,'rgba(255,225,163,'+alpha+')');g.addColorStop(.26,'rgba(224,152,87,'+alpha*.48+')');g.addColorStop(1,'transparent');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,2*r,2*r)}
 ctx.globalAlpha=1;requestAnimationFrame(frame)}
 requestAnimationFrame(frame);
 return {stage,age,get active(){return started!==null},ready(){ready=true;if(pending)start()},light:now=>ease((age(now)-1.52)/.42),turn:now=>Math.max(0,age(now)-2.42)*.16}
})();
