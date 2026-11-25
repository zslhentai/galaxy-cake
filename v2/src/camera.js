export const cameraHome = Object.freeze({ yaw: 0, pitch: .31, zoom: 1 });

export function makeCamera(canvas, reduced, isInteractive) {
  const desired = {...cameraHome};
  const current = {...cameraHome};
  const fingers = new Map();
  const tau = 2 * Math.PI;
  let last = 0;
  let introUntil = 0;
  let phase = 'opening';

  function stopEntrance() {
    if (!introUntil) return;
    introUntil = 0;
    Object.assign(desired, current);
  }
  function approach(value, to, step) { return value + (to - value) * step; }
  function zoomBy(scale) {
    stopEntrance();
    desired.zoom = Math.min(1.8, Math.max(.72, desired.zoom * scale));
  }
  function rotate(dx, dy) {
    stopEntrance();
    desired.yaw -= dx * .009;
    desired.pitch = Math.max(.09, Math.min(.98, desired.pitch + dy * .006));
  }
  function reset() {
    introUntil = 0;
    desired.yaw = current.yaw - Math.atan2(Math.sin(current.yaw), Math.cos(current.yaw));
    desired.pitch = cameraHome.pitch;
    desired.zoom = cameraHome.zoom;
  }
  function pointerDown(e) {
    if (!isInteractive() || fingers.size >= 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    stopEntrance();
    fingers.set(e.pointerId, {x:e.clientX,y:e.clientY});
    canvas.setPointerCapture(e.pointerId);
  }
  function gap() {
    const [a, b] = fingers.values();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function pointerMove(e) {
    const finger = fingers.get(e.pointerId);
    if (!finger) return;
    const pinching = fingers.size === 2;
    const before = pinching ? gap() : 0;
    const dx = e.clientX - finger.x;
    const dy = e.clientY - finger.y;
    Object.assign(finger, {x:e.clientX,y:e.clientY});
    if (pinching) {
      const next = gap();
      if (before > 4 && next > 4) zoomBy(next / before);
    } else {
      rotate(dx, dy);
    }
  }
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(event, e => fingers.delete(e.pointerId));
  }
  canvas.addEventListener('wheel',e=>{
    if (!isInteractive()) return;
    e.preventDefault();
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1);
    zoomBy(Math.exp(Math.max(-.27,Math.min(.27,-delta * .00145))));
  },{passive:false});
  const keys = {
    ArrowLeft:()=>rotate(-24,0), ArrowRight:()=>rotate(24,0),
    ArrowUp:()=>rotate(0,19), ArrowDown:()=>rotate(0,-19),
    '+':()=>zoomBy(1.18), '=':()=>zoomBy(1.18), '-':()=>zoomBy(1/1.18), '0':reset, Home:reset,
  };
  canvas.addEventListener('keydown',e=>{
    const action = keys[e.key];
    if (!action || !isInteractive()) return;
    e.preventDefault();
    action();
  });
  return {
    reset, zoomBy,
    get view() { return current; },
    onPhase(next, now) {
      if (phase === 'opening' && next === 'arrival' && !reduced) {
        Object.assign(current,{yaw:-.45,pitch:.44,zoom:.89});
        introUntil = now + 1500;
      }
      phase = next;
    },
    update(now) {
      const dt = Math.min(.06,(now-last)/1000);
      last = now;
      if (introUntil && now >= introUntil) introUntil = 0;
      const damping = reduced ? 1 : 1 - Math.exp(-(introUntil ? 2.9 : 16)*dt);
      for (const key of Object.keys(cameraHome)) current[key] = approach(current[key],desired[key],damping);
      if (Math.abs(current.yaw) > 4*tau && Math.abs(current.yaw-desired.yaw) < .02) {
        const turns = Math.trunc(current.yaw/tau)*tau;
        current.yaw -= turns;
        desired.yaw -= turns;
      }
      return current;
    },
  };
}

export function framing(width,height) {
  return Math.min(width / 3.48,height / 3.09);
}
