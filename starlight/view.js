const cakeView = (() => {
  const canvas = document.querySelector('#cake');
  const pointers = new Map();
  const initialPitch = .31;
  const initial = { yaw: 0, pitch: initialPitch, zoom: 1 };
  const target = { ...initial };
  const current = { ...initial };
  const tau = 2 * Math.PI;
  let auto = !ceremony.reduced;
  let supportsTilt = true;
  let last = 0;
  let element = canvas;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function zoomBy(multiplier) {
    auto = false;
    target.zoom = clamp(target.zoom * multiplier, .72, 1.76);
  }

  function startingView() {
    auto = false;
    target.yaw = current.yaw + Math.atan2(-Math.sin(current.yaw), Math.cos(current.yaw));
    target.pitch = initialPitch;
    target.zoom = 1;
  }

  function rotate(x, y) {
    auto = false;
    target.yaw -= x * .009;
    if (supportsTilt) target.pitch = clamp(target.pitch + y * .006, .09, .97);
  }

  function distance() {
    const [a, b] = pointers.values();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function pointerDown(event) {
    if (!ceremony.active || (event.pointerType === 'mouse' && event.button !== 0) || pointers.size >= 2) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    element.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    const p = pointers.get(event.pointerId);
    if (!p) return;
    const pinch = pointers.size === 2;
    const previousGap = pinch ? distance() : 0;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    p.x = event.clientX;
    p.y = event.clientY;
    if (pinch) {
      const gap = distance();
      if (previousGap > 4 && gap > 4) {
        zoomBy(gap / previousGap);
      }
    } else if (dx || dy) {
      rotate(dx, dy);
    }
  }

  function forgetPointer(event) { pointers.delete(event.pointerId); }

  function wheel(event) {
    if (!ceremony.active) return;
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
    zoomBy(Math.exp(clamp(-event.deltaY * scale * .00145, -.25, .25)));
  }

  const controls = {
    ArrowLeft: () => rotate(-24, 0),
    ArrowRight: () => rotate(24, 0),
    ArrowUp: () => rotate(0, 19),
    ArrowDown: () => rotate(0, -19),
    '+': () => zoomBy(1.18),
    '=': () => zoomBy(1.18),
    '-': () => zoomBy(1 / 1.18),
    '0': startingView,
    Home: startingView,
  };
  function keyDown(event) {
    const action = controls[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  function bind(targetElement, tilt = true) {
    element = targetElement;
    supportsTilt = tilt;
    if (!tilt) element.setAttribute('aria-label', '星空蛋糕兼容视图');
    element.addEventListener('pointerdown', pointerDown);
    element.addEventListener('pointermove', pointerMove);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      element.addEventListener(type, forgetPointer);
    }
    element.addEventListener('wheel', wheel, { passive: false });
    element.addEventListener('keydown', keyDown);
  }

  document.querySelector('[data-camera="reset"]').addEventListener('click', startingView);
  document.querySelector('[data-camera="zoom-in"]').addEventListener('click', () => zoomBy(1.18));
  document.querySelector('[data-camera="zoom-out"]').addEventListener('click', () => zoomBy(1 / 1.18));

  function update(now) {
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    if (auto && !pointers.size && ceremony.age(now) > 1.53) target.yaw += .13 * dt;
    const damping = ceremony.reduced ? 1 : 1 - Math.exp(-15 * dt);
    for (const key of ['yaw', 'pitch', 'zoom']) current[key] += (target[key] - current[key]) * damping;
    if (Math.abs(current.yaw) > tau * 4 && Math.abs(current.yaw - target.yaw) < .04) {
      const loops = tau * Math.trunc(current.yaw / tau);
      current.yaw -= loops;
      target.yaw -= loops;
    }
    return current;
  }
  return { bind, update };
})();
