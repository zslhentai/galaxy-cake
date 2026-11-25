const tau = Math.PI * 2;
const tones = ['#f3d1a1','#c1ccec','#a59cd2','#fae1bb','#b4cacc'];
const spread = (n,m) => ((n*m)%1009)/1009;
const stars = Array.from({length:150},(_,i)=>({
  x:spread(i+2,641), y:spread(i+25,733), r:.42+spread(i+9,577)**3*2.1, phase:spread(i+4,571)*tau,
  tint:tones[i%tones.length],
}));
const sparks = Array.from({length:53},(_,i)=>({
  a:spread(i+1,619)*tau,r:.36+.72*spread(i+19,601), phase:spread(i+5,719)*tau,
  tint:tones[i%tones.length],
}));

export function makeSky(canvas,stage,reduced) {
  const ctx = canvas.getContext('2d');
  let width,height,cx,cy,radius,last=-100,lastPhase='';
  function resize() {
    width=canvas.clientWidth;
    height=canvas.clientHeight;
    const area=stage.getBoundingClientRect();
    const room=canvas.getBoundingClientRect();
    cx=area.left-room.left+area.width/2;
    cy=area.top-room.top+area.height*.47;
    radius=Math.min(area.width*.462,area.height*.46);
    const ratio=Math.min(1.3,devicePixelRatio||1);
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    last=-100;
    lastPhase='';
  }
  function point(x,y,r) {
    if(r<1.25) {
      ctx.beginPath();ctx.arc(x,y,r,0,tau);ctx.fill();return;
    }
    ctx.beginPath();
    for(let i=0;i<8;i++) {
      const a=i*tau/8;
      const size=r*(i%2 ? .19 : 1);
      ctx.lineTo(x+size*Math.cos(a),y+size*Math.sin(a)*1.49);
    }
    ctx.closePath();ctx.fill();
  }
  function arcs(t,phase,progress) {
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.40);
    const angle = t*.045;
    const settle = phase==='arrival' ? 1-progress : 0;
    const brighten = phase==='blessing' ? .18 : 0;
    for(const [scale,vertical,start,end,alpha] of [[1,.89,.04,5.54,.26],[.96,.86,3.07,5.58,.34],[.90,.80,.15,2.72,.16],[1.035,.918,.22,1.84,.29],[1.10,.30,3.7,6.17,.15]]) {
      ctx.beginPath();ctx.strokeStyle=scale>.93?'#c9ae82':'#a2aeca';
      ctx.globalAlpha=alpha+settle*.25+brighten;ctx.lineWidth=.65;
      ctx.ellipse(0,0,radius*scale*(1+.13*settle),radius*vertical*(1-.12*settle),angle*.13,start+angle,end+angle);
      ctx.stroke();
    }
    for(let i=0;i<54;i++) {
      const a=tau*i/54+angle*.13;
      if(Math.sin(2*a)<-.76)continue;
      ctx.strokeStyle='#d8b389';ctx.globalAlpha=i%6===0?.42:.22;
      const inner=i%6===0?.974:.995;
      ctx.beginPath();ctx.moveTo(radius*inner*Math.cos(a),radius*.89*inner*Math.sin(a));
      ctx.lineTo(radius*1.014*Math.cos(a),radius*.903*Math.sin(a));ctx.stroke();
    }
    ctx.restore();
  }
  function draw(now,phase,progress) {
    if(now-last<38 || (reduced&&lastPhase===phase))return;
    last=now;
    lastPhase=phase;
    const t=reduced?0:now*.001;
    ctx.clearRect(0,0,width,height);
    for(const p of stars) {
      const x=p.x*width+3*Math.sin(p.phase+t*.19), y=p.y*height;
      const near=Math.max(0,1-Math.hypot((x-cx)/radius,(y-cy)/radius));
      ctx.fillStyle=p.tint;
      ctx.globalAlpha=(.24+.44*Math.cos(t*.59+p.phase)**2)*(1-.60*near);
      point(x,y,p.r);
    }
    arcs(t,phase,progress);
    const active=reduced?0:phase==='arrival'?Math.sin(progress*Math.PI):phase==='blowing'?progress:phase==='blessing'?1-progress:0;
    if(active>0)for(const p of sparks) {
      const a=p.a+(phase==='arrival'?1-progress:progress)*1.15;
      const dist=radius*p.r*(.75+.35*active);
      ctx.globalAlpha=active*(.3+.39*Math.sin(t*1.24+p.phase)**2);
      ctx.fillStyle=p.tint;
      point(cx+dist*Math.cos(a),cy+dist*.64*Math.sin(a),1.1+1.1*Math.sin(p.phase)**4);
    }
    ctx.globalAlpha=1;
  }
  resize();
  addEventListener('resize',resize,{passive:true});
  return draw;
}
