const ceremony = (() => {
  const body = document.body;
  const opening = document.querySelector('#opening');
  const experience = document.querySelector('#experience');
  const enter = document.querySelector('#enter');
  const birthday = document.querySelector('#birthday');
  const stage = document.querySelector('.stage');
  const sky = document.querySelector('#sky');
  const sealSpace = document.querySelector('.seal-space');
  const sound = document.querySelector('#sound');
  const soundLabel = sound.querySelector('.sound-label');
  const audio = document.querySelector('#bgm');
  const status = document.querySelector('#status');
  const ctx = sky.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tau = Math.PI * 2;
  const gold = '#eac186';
  const cream = '#fff1cd';
  const clamp = (t) => Math.max(0, Math.min(1, t));
  const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

  let width, height, size, sealY, sealRadius;
  let started = null;
  let requested = false;
  let rendererReady = false;
  let unveiled = false;
  let revealed = false;
  let audioError = false;
  let timestamp = 0;
  let seed = 13041;
  function rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }

  const tones = [cream, '#98b3f3', '#b39ad8', gold, '#ecafbc'];
  const dust = Array.from({ length: 430 }, (_, index) => ({
    x: rand(), y: rand(), pulse: rand() * tau, drift: rand() * 12,
    r: index < 17 ? 2.1 + rand() * 2.3 : .34 + rand() ** 1.8 * 1.65,
    tone: tones[index % tones.length],
  }));
  const sparks = Array.from({ length: 102 }, (_, index) => ({
    a: rand() * tau, r: .15 + rand() ** .8 * .93, spin: 1.2 + rand() * 1.4,
    size: .45 + rand() ** 1.5 * 3.1, tone: tones[index % tones.length],
  }));
  const charts = [
    [[.028,.28],[.087,.33],[.14,.295],[.186,.35],[.255,.328]],
    [[.738,.235],[.79,.27],[.846,.225],[.883,.28],[.977,.255]],
    [[.04,.671],[.093,.71],[.139,.666],[.202,.735],[.251,.68]],
    [[.755,.746],[.819,.713],[.86,.75],[.941,.666],[.979,.708]],
    [[.08,.12],[.15,.157],[.223,.104],[.284,.16]],
    [[.717,.848],[.788,.904],[.837,.865],[.914,.922]],
  ];

  function age(now) { return started === null ? 0 : (now - started) / 1000; }

  function renderAudioState() {
    const playing = !audio.paused && !audioError;
    sound.setAttribute('aria-pressed', String(playing));
    soundLabel.textContent = playing ? '暂停音乐' : '开启音乐';
    sound.title = soundLabel.textContent;
  }

  function playAudio() {
    audioError = false;
    audio.play().catch((error) => {
      if (error.name === 'AbortError') return;
      audioError = true;
      status.textContent = '背景音乐暂未播放，可点击音乐按钮重试。';
      renderAudioState();
    });
  }

  audio.addEventListener('playing', renderAudioState);
  audio.addEventListener('pause', renderAudioState);
  audio.addEventListener('error', () => {
    audioError = true;
    status.textContent = '背景音乐暂未载入。';
    renderAudioState();
  });
  sound.addEventListener('click', () => {
    if (!audio.paused && !audioError) audio.pause();
    else {
      if (audio.error) audio.load();
      playAudio();
    }
  });

  function activate() {
    if (!requested || !rendererReady || started !== null) return;
    started = performance.now() - (reduced ? 2400 : 0);
    body.classList.add('started');
    enter.disabled = true;
    opening.inert = true;
    if (reduced) advance(2.4);
  }
  opening.addEventListener('click', () => {
    if (requested) return;
    requested = true;
    playAudio();
    activate();
  });

  function advance(t) {
    if (!unveiled && t >= .48) {
      unveiled = true;
      body.classList.add('unveiled');
    }
    if (!revealed && t >= 1.54) {
      revealed = true;
      body.classList.add('revealed');
      opening.hidden = true;
      experience.inert = false;
      experience.removeAttribute('aria-hidden');
      birthday.focus({ preventScroll: true });
    }
  }

  function resize() {
    width = sky.clientWidth;
    height = sky.clientHeight;
    size = Math.min(width, height);
    const ratio = Math.min(devicePixelRatio, 1.5, Math.sqrt(1700000 / (width * height)));
    sky.width = Math.round(width * ratio);
    sky.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!opening.hidden) {
      const slot = sealSpace.getBoundingClientRect();
      sealY = slot.top + slot.height * .44;
      sealRadius = Math.min(slot.height * .46, size * .235, 116);
    }
    paint(performance.now());
  }

  function star(x, y, r, stretch = 1) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const rayon = i % 2 ? r * .17 : r;
      ctx.lineTo(x + Math.cos(angle) * rayon, y + Math.sin(angle) * rayon * stretch);
    }
    ctx.closePath();
    ctx.fill();
  }

  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, tau);
    ctx.fill();
  }

  function arc(radius, begin, end) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, begin, end);
    ctx.stroke();
  }

  function halo(x, y, r, opacity, cool = false) {
    if (r <= 0 || opacity <= 0) return;
    const fill = ctx.createRadialGradient(x, y, 0, x, y, r);
    fill.addColorStop(0, cool ? '#95abfa' : '#ffe5aa');
    fill.addColorStop(.27, cool ? '#665be680' : '#f3ae664f');
    fill.addColorStop(1, 'transparent');
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = fill;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
  }

  function skyField(time, showCake) {
    const centerX = width * .5;
    const centerY = height * .46;
    const radius = Math.min(width * .46, height * .44, 455);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-.1 + .027 * Math.sin(time * .23));
    ctx.strokeStyle = gold;
    ctx.lineWidth = .65;
    for (const [r, a, b, alpha] of [[1,.15,2.13,.27],[1.03,.34,1.3,.22],[1,2.34,3.48,.33],
      [1.04,2.6,3.12,.21],[1,3.72,4.92,.34],[1.033,4.02,4.69,.2],[1,5.05,6.12,.34],[.98,5.63,6.21,.16]]) {
      ctx.globalAlpha = alpha * (1 - showCake * .27);
      arc(radius * r, a, b);
    }
    for (let i = 0; i < 72; i++) {
      const a = i * tau / 72;
      if (Math.sin(a * 3 + .5) < -.58) continue;
      ctx.globalAlpha = (i % 6 ? .16 : .42) * (1 - showCake * .25);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * .997, Math.sin(a) * radius * .997);
      const outer = radius * 1.017 + (i % 6 ? 0 : 4);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    }
    ctx.restore();

    for (const chart of charts) {
      ctx.strokeStyle = '#d2b1ce';
      ctx.globalAlpha = .22 - showCake * .07;
      ctx.lineWidth = .75;
      ctx.beginPath();
      for (const [x, y] of chart) ctx.lineTo(width * x, height * y);
      ctx.stroke();
      ctx.fillStyle = gold;
      chart.forEach(([x,y], i) => {
        ctx.globalAlpha = (.38 + .22 * Math.sin(time * .8 + x * 30)) * (1 - showCake * .16);
        star(width * x, height * y, i === 2 ? 5 : 2.3, 1.26);
      });
    }

    for (const p of dust) {
      const x = p.x * width + Math.sin(time * .16 + p.pulse) * p.drift;
      const y = p.y * height + Math.cos(time * .11 + p.pulse) * p.drift * .48;
      ctx.globalAlpha = (.27 + .49 * (.5 + .5 * Math.sin(time * (1.05 + p.r * .21) + p.pulse)) ** 2)
        * (1 - showCake * (Math.abs(p.x - .5) < .28 ? .23 : 0));
      ctx.fillStyle = p.tone;
      if (p.r > 2) star(x, y, p.r, 1.48);
      else circle(x, y, p.r * .73);
    }
    ctx.globalAlpha = 1;
  }

  function drawSeal(time, t) {
    const fold = ease(t / .77);
    const release = ease((t - .38) / 1.34);
    const x = width / 2;
    const y = sealY + (height * .46 - sealY) * fold;
    const r = sealRadius;
    halo(x, y, r * (1.5 + release * 2.3), (.2 + .07 * Math.sin(time * 1.2)) * (1 - release), true);
    if (fold < 1) {
      ctx.save();
      ctx.translate(x, y);
      const scale = 1 - fold * .91;
      ctx.scale(scale, scale * (1 - fold * .6));
      ctx.rotate(.38 * fold);
      ctx.lineWidth = .9;
      ctx.strokeStyle = gold;
      ctx.globalAlpha = .66 * (1 - fold);
      arc(r * .95, .04, 3.02);
      arc(r * .95, 3.16, 6.23);
      arc(r * .895, 0, tau);
      arc(r * .57, 0, tau);

      ctx.rotate(time * .042);
      for (let i = 0; i < 60; i++) {
        const a = i * tau / 60;
        const tick = i % 5 ? .84 : .78;
        ctx.globalAlpha = (i % 5 ? .58 : .96) * (1 - fold);
        ctx.beginPath();
        ctx.moveTo(r * tick * Math.cos(a), r * tick * Math.sin(a));
        ctx.lineTo(r * .895 * Math.cos(a), r * .895 * Math.sin(a));
        ctx.stroke();
      }

      for (let i = 0; i < 3; i++) {
        ctx.rotate(tau / 3);
        ctx.strokeStyle = i === 0 ? '#b8c9f3' : gold;
        ctx.globalAlpha = (.58 + .14 * Math.sin(time * 1.1 + i)) * (1 - fold);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.06, r * (.32 + .12 * Math.sin(time * .7 + i)), time * -.35, 0, tau);
        ctx.stroke();
      }
      ctx.rotate(-time * .11);
      for (let i = 0; i < 8; i++) {
        const a = i * tau / 8;
        ctx.globalAlpha = (.55 + .33 * Math.sin(time * 1.8 + i)) * (1 - fold);
        ctx.fillStyle = i % 2 ? gold : cream;
        star(r * .96 * Math.cos(a), r * .96 * Math.sin(a), i % 2 ? 2 : 4.3, 1.55);
      }
      ctx.restore();

      halo(x, y, r * .84 * scale, (.27 + .12 * Math.sin(time * 1.9)) * (1 - fold));
      ctx.fillStyle = cream;
      ctx.globalAlpha = .88 * (1 - fold);
      star(x, y, r * (.24 + .022 * Math.sin(time * 2.1)) * scale, 1.55);
      ctx.fillStyle = gold;
      ctx.globalAlpha = .5 * (1 - fold);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      star(0, 0, r * .18 * scale);
      ctx.restore();
    }

    if (release < 1) {
      for (const p of sparks) {
        const a = p.a + time * .19 + fold * p.spin - release * .43;
        const length = p.r * (r * (1.32 - 1.28 * fold) + size * .73 * release);
        const sx = x + Math.cos(a) * length;
        const sy = y + Math.sin(a) * length * (.9 + .2 * release);
        ctx.fillStyle = p.tone;
        ctx.globalAlpha = (.39 + .53 * Math.sin(time * 2.7 + p.a) ** 2) * (1 - release);
        if (p.size > 2) star(sx, sy, p.size * (1 + .36 * fold), 1.3);
        else circle(sx, sy, p.size);
        if (release > 0 && p.size > 2.25) {
          ctx.strokeStyle = p.tone;
          ctx.globalAlpha *= .5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - Math.cos(a - .3) * p.size * 5, sy - Math.sin(a - .3) * p.size * 5);
          ctx.stroke();
        }
      }
    }

    if (t > 0) {
      const flash = Math.sin(Math.PI * ease((t - .28) / .9));
      halo(x, y, r * (.22 + 2.4 * release), flash * .7);
      if (release > 0 && release < 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-.27);
        ctx.globalAlpha = flash * .53;
        ctx.strokeStyle = cream;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * release * .76, size * release * .37, 0, .13, tau - .24);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  function paint(now) {
    const t = age(now);
    advance(t);
    const time = reduced ? .77 : now * .001;
    ctx.clearRect(0, 0, width, height);
    skyField(time, ease((t - .44) / 1.6));
    if (t < 1.72) drawSeal(time, t);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - timestamp < 32 || (reduced && !requested)) return;
    if (reduced && revealed && timestamp > started + 2400) return;
    timestamp = now;
    paint(now);
  }

  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
  return {
    stage, reduced, age,
    get active() { return started !== null; },
    ready() { rendererReady = true; activate(); },
    light(now) { return ease((age(now) - .97) / .52); },
  };
})();
