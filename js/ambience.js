// --- AMBIENCE: snow at night, sakura petals by day, and they respond to you ---
//
//  move / drag   stirs the air (particles are dragged along, softly pushed aside)
//  tap           releases a small bloom of petals / snowflakes and a faint ripple
//  press & hold  time slows around your finger; letting go exhales a gentle puff
//  typing        the weather calms down so it never competes with your writing
//  phone tilt    steers the wind (Android; iOS needs a permission prompt, so it is skipped)
//
// Levels (Settings -> Ambience): Still (one calm frame, zero CPU), Calm (default), Lively.
// Cheap by design: pre-rendered sprites (no shadowBlur / per-particle paths), time-based physics (same speed on
// 60 and 120 Hz screens), pauses when hidden or while the sign-in screen covers it, and it sheds particles
// automatically if the device cannot keep up.
(() => {
  'use strict';
  const canvas = document.getElementById('snow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const LEVELS = {
    still:  { n: 1,   speed: 0,    wind: 0,   react: 0 },
    calm:   { n: 1,   speed: 1,    wind: 1,   react: 1 },
    lively: { n: 1.7, speed: 1.35, wind: 1.7, react: 1.3 }
  };
  let level = store.get('sanctuaryAmbience');
  if (!LEVELS[level]) level = reduce ? 'still' : 'calm';

  // ---------------------------------------------------------------- sprites
  const sprite = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w * 2; c.height = h * 2;                 // drawn at 2x so scaling down stays crisp
    const g = c.getContext('2d'); g.scale(2, 2); draw(g, w, h);
    return c;
  };
  const radial = (g, w, rgb, stops) => {
    const r = w / 2, grad = g.createRadialGradient(r, r, 0, r, r, r);
    for (const [o, a] of stops) grad.addColorStop(o, `rgba(${rgb},${a})`);
    g.fillStyle = grad; g.fillRect(0, 0, w, w);
  };
  const S = {
    flakeIcy:  sprite(64, 64, (g, w) => radial(g, w, '225,235,255', [[0, 1], [0.25, 0.85], [0.6, 0.25], [1, 0]])),
    flakeWarm: sprite(64, 64, (g, w) => radial(g, w, '255,226,170', [[0, 1], [0.25, 0.85], [0.6, 0.25], [1, 0]])),
    bokeh:     sprite(96, 96, (g, w) => radial(g, w, '220,232,255', [[0, 0.16], [0.6, 0.20], [0.88, 0.26], [1, 0]])),
    haloWarm:  sprite(128, 128, (g, w) => radial(g, w, '255,214,150', [[0, 1], [0.4, 0.35], [1, 0]])),
    haloSoft:  sprite(128, 128, (g, w) => radial(g, w, '255,236,232', [[0, 1], [0.4, 0.4], [1, 0]])),
    petals: [['#fde6ec', '#f3a8bb'], ['#f9d0da', '#ee93ab'], ['#ffffff', '#f6c0ce']].map(([tip, base]) =>
      sprite(48, 64, (g) => {
        const grad = g.createLinearGradient(0, 4, 0, 60);
        grad.addColorStop(0, tip); grad.addColorStop(1, base);
        g.beginPath();                                  // a sakura petal: teardrop with the characteristic notch
        g.moveTo(24, 60);
        g.bezierCurveTo(4, 46, -2, 20, 12, 6);
        g.quadraticCurveTo(18, 2, 24, 14);
        g.quadraticCurveTo(30, 2, 36, 6);
        g.bezierCurveTo(50, 20, 44, 46, 24, 60);
        g.closePath(); g.fillStyle = grad; g.fill();
        g.strokeStyle = 'rgba(190,90,115,0.22)'; g.lineWidth = 1;   // faint centre vein
        g.beginPath(); g.moveTo(24, 56); g.lineTo(24, 22); g.stroke();
      }))
  };

  // ---------------------------------------------------------------- state
  let W = 1, H = 1, dpr = 1, quality = 1;
  let isDark = document.body.getAttribute('data-theme') === 'dark';
  let themeFade = 1;
  let particles = [], active = 0;
  let t = 0, last = 0, raf = 0, timer = 0, running = false, frames = 0, fpsEMA = 60, slowRun = 0, lastShed = -9;
  let focus = 0, focusTarget = 0, lastType = 0;
  let tilt = 0, tiltTarget = 0;
  let gust = { t0: -99, amp: 0 }, nextGust = 22;
  let bursts = 0;
  const ripples = [];
  const ptr = { x: -999, y: -999, vx: 0, vy: 0, t: 0, lastMove: 0, active: false, down: false, downT: 0, dx: 0, dy: 0, type: 'mouse' };
  const hold = { on: false, x: 0, y: 0, r: coarse ? 150 : 170 };
  let holdTimer = 0;

  const floorY = () => H - 60;                          // petals pile up 60px above the bottom edge (as before)
  const baseCount = () => clamp(Math.round((W * H) / 6500), 90, 260);
  const wantCount = () => Math.round(baseCount() * LEVELS[level].n * quality);

  function makeParticle(scatter) {
    const z = 0.25 + Math.pow(Math.random(), 0.8) * 0.75;      // depth: 0.25 far .. 1 near
    return {
      x: rnd(0, W), y: scatter ? rnd(-20, H) : rnd(-80, -10), z,
      vx: 0, vy: 0, ph: rnd(0, TAU), sf: rnd(0.4, 1.1),
      ang: rnd(0, TAU), spin: rnd(0.6, 1.6) * (Math.random() < 0.5 ? -1 : 1), fl: rnd(0, TAU), variant: (Math.random() * 3) | 0,
      age: scatter ? 9 : 0, rest: 0, restT: 0, restMax: 0, restSx: 0.5, land: rnd(0, 34), boost: 0, glow: 0
    };
  }
  function respawn(p) {
    p.x = rnd(-20, W + 20); p.y = rnd(-70, -12); p.age = 0; p.rest = 0; p.boost = 0;
    p.vx = 0; p.vy = 0; p.land = rnd(0, 34);
  }
  function applyCount() {
    const n = LEVELS[level].speed === 0 ? baseCount() : wantCount();
    while (particles.length < n) particles.push(makeParticle(true));
    if (particles.length > n + 60) particles.length = n + 60;
    particles.sort((a, b) => a.z - b.z);                 // far -> near, so drawing order = depth order
    active = Math.min(n, particles.length);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    const nd = Math.min(window.devicePixelRatio || 1, 2) * (quality < 0.7 ? 0.75 : 1);
    if (nw === W && nh === H && nd === dpr) return;
    W = nw; H = nh; dpr = nd;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    for (const p of particles) { if (p.x > W + 40) p.x = rnd(0, W); }
    applyCount();
    if (!running) renderStill();
  }

  // ---------------------------------------------------------------- physics
  function windAt(time) {
    const env = clamp((time - gust.t0) / 9, 0, 1);
    const g = gust.amp * Math.pow(Math.sin(Math.PI * env), 2);
    return Math.sin(time * 0.07) * 0.35 + Math.sin(time * 0.031 + 1.3) * 0.25 + g + tilt;
  }
  function step(dt, now) {
    const L = LEVELS[level];
    if (t > nextGust) { gust = { t0: t, amp: rnd(0.8, 1.4) * (Math.random() < 0.5 ? -1 : 1) }; nextGust = t + rnd(25, 50); }
    focus += (focusTarget - focus) * (1 - Math.exp(-dt * 2));
    if (focusTarget && now - lastType > 2200) focusTarget = 0;
    tilt += (tiltTarget - tilt) * (1 - Math.exp(-dt * 3));
    if (themeFade < 1) themeFade = Math.min(1, themeFade + dt / 1.2);
    ptr.vx *= Math.exp(-dt * (now - ptr.lastMove > 120 ? 8 : 1)); ptr.vy *= Math.exp(-dt * (now - ptr.lastMove > 120 ? 8 : 1));

    const wind = windAt(t) * L.wind, ease = 1 - Math.exp(-dt * 1.6);
    const fall = (isDark ? 26 : 20) * L.speed * (1 - 0.5 * focus);
    const R = (coarse ? 135 : 160) * (0.8 + 0.2 * L.react), R2 = R * R;
    const wake = L.react > 0 && ptr.active && (ptr.type !== 'touch' || ptr.down) && now - ptr.lastMove < 250;
    const fy = floorY();

    for (let i = 0; i < active; i++) {
      const p = particles[i], z = p.z;
      p.age += dt;
      p.glow *= Math.exp(-dt * 4);
      const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;

      if (p.rest) {                                      // a petal lying in the pile
        p.restT += dt;
        if (p.restT >= p.restMax) { respawn(p); continue; }
        if (wake && d2 < R2 * 0.64) {                    // stir the pile: it lifts back into the air
          const d = Math.sqrt(d2) || 1;
          p.rest = 0; p.vx = ptr.vx * 0.3 + (dx / d) * 70; p.vy = -rnd(50, 110); p.boost = 1; p.age = 2;
        }
        continue;
      }

      const tvy = fall * (0.35 + 0.9 * z) + (isDark ? 0 : Math.sin(p.fl) * 5 * L.speed);
      const tvx = wind * 38 * z * (isDark ? 1 : 1.3) + Math.sin(t * p.sf + p.ph) * (isDark ? 10 : 20) * z * L.speed;
      p.vx += (tvx - p.vx) * ease; p.vy += (tvy - p.vy) * ease;

      if (wake && d2 < R2) {                             // air drag from the pointer: dragged along + pushed aside
        const d = Math.sqrt(d2) || 1, f = 1 - d / R, f2 = f * f * (0.5 + 0.5 * z);
        const k = Math.min(1, dt * 9) * f2 * L.react * 2.3;
        p.vx += (ptr.vx * 0.42 + (dx / d) * 95 * f - p.vx) * k;
        p.vy += (ptr.vy * 0.42 + (dy / d) * 95 * f - p.vy) * k;
        p.boost = Math.max(p.boost, f * 0.8); p.glow = Math.max(p.glow, f);
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 420) { p.vx *= 420 / sp; p.vy *= 420 / sp; }

      let s = 1;                                         // press-and-hold: a bubble where time moves slowly
      if (hold.on) {
        const hx = p.x - hold.x, hy = p.y - hold.y, hd2 = hx * hx + hy * hy;
        if (hd2 < hold.r * hold.r) { const k = Math.sqrt(hd2) / hold.r; s = 0.18 + 0.82 * k * k; p.glow = Math.max(p.glow, 1 - k); }
      }
      p.x += p.vx * dt * s; p.y += p.vy * dt * s;
      p.fl += dt * (2 + p.spin * 1.2) * (1 + 3 * p.boost) * s;
      p.ang += p.spin * 0.5 * dt * (1 + 3 * p.boost) * s;
      p.boost *= Math.exp(-dt * 1.5);

      if (p.x < -40) p.x = W + 40; else if (p.x > W + 40) p.x = -40;
      if (isDark) { if (p.y > H + 10) respawn(p); }
      else if (p.y > fy + p.land) {                      // land and rest in the pile for a while, then fade away
        p.rest = 1; p.restT = 0; p.restMax = rnd(14, 26); p.vx = p.vy = 0;
        p.y = fy + p.land; p.ang = rnd(0, TAU); p.restSx = rnd(0.35, 0.8);
      }
    }
  }

  // ---------------------------------------------------------------- drawing
  function render(time, animated) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const fade = themeFade, fx = 1 - 0.3 * focus;
    const lx = W * 0.35, ly = H * 0.15, lampR = Math.min(800, Math.max(W, H) * 0.6);

    if (isDark) {                                        // the street lamp (kept from the original design)
      const flick = animated ? 0.97 + 0.03 * Math.sin(time * 1.3) + 0.01 * Math.sin(time * 7.1) : 1;
      // the big amber glow is a static CSS layer (#atmosphere .lamp): painting a full-screen gradient every frame was the single most expensive thing here
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.9 * flick * fade; ctx.drawImage(S.haloWarm, lx - 26, ly - 26, 52, 52);
      ctx.globalAlpha = fade; ctx.drawImage(S.flakeWarm, lx - 6, ly - 6, 12, 12);
      ctx.globalCompositeOperation = 'source-over';
    }

    const lanternOn = animated && ptr.active && (ptr.type !== 'touch' || ptr.down) && performance.now() - ptr.lastMove < 1800;
    if (lanternOn) {                                     // a soft light that follows the pointer
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
      ctx.globalAlpha = (isDark ? 0.13 : 0.34) * fade;
      ctx.drawImage(isDark ? S.haloWarm : S.haloSoft, ptr.x - 110, ptr.y - 110, 220, 220);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (hold.on) {                                       // the "time slows here" halo breathes
      const rr = hold.r * (0.92 + 0.06 * Math.sin(time * 2.2));
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
      ctx.globalAlpha = isDark ? 0.12 : 0.3;
      ctx.drawImage(isDark ? S.haloWarm : S.haloSoft, hold.x - rr, hold.y - rr, rr * 2, rr * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    for (let i = ripples.length - 1; i >= 0; i--) {      // tap ripples
      const r = ripples[i], u = (time - r.t0) / 0.7;
      if (u >= 1) { ripples.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - u, 3);
      ctx.globalAlpha = 0.24 * (1 - u) * fade; ctx.lineWidth = 1.2;
      ctx.strokeStyle = isDark ? 'rgb(255,225,170)' : 'rgb(214,120,140)';
      ctx.beginPath(); ctx.arc(r.x, r.y, 8 + 70 * e, 0, TAU); ctx.stroke();
    }

    for (let i = 0; i < active; i++) {
      const p = particles[i], z = p.z;
      let a = Math.min(1, p.age / 1.2) * fade * fx;
      if (a <= 0.01) continue;
      if (isDark) {
        const bokeh = z > 0.94;
        const d = bokeh ? 26 + (z - 0.94) * 260 : 2.2 + Math.pow(z, 1.7) * 7;
        let base = bokeh ? 0.9 : 0.3 + 0.6 * z;
        if (animated && !bokeh) base *= 0.88 + 0.12 * Math.sin(t * 1.6 + p.ph * 3);       // far flakes twinkle
        a *= Math.min(1, (H - p.y) / 140) * (base + p.glow * 0.5);
        if (a <= 0.01) continue;
        a = Math.min(1, a);
        if (bokeh) { ctx.globalAlpha = a * 0.5; ctx.drawImage(S.bokeh, p.x - d / 2, p.y - d / 2, d, d); continue; }
        const dl = Math.hypot(p.x - lx, p.y - ly), I = dl < lampR ? Math.min(1, (1 - dl / lampR) * 1.5) : 0;
        ctx.globalAlpha = a * (1 - 0.7 * I); ctx.drawImage(S.flakeIcy, p.x - d / 2, p.y - d / 2, d, d);
        if (I > 0.02) { ctx.globalAlpha = Math.min(1, a * I * 1.2); ctx.drawImage(S.flakeWarm, p.x - d / 2, p.y - d / 2, d, d); }
      } else {
        const len = 9 + z * 13, w = len * 0.75;
        let sx = p.rest ? p.restSx : Math.cos(p.fl);
        let ang = p.ang;
        a *= 0.4 + 0.55 * z;
        a *= 0.55 + 0.45 * Math.abs(sx);                 // edge-on petals are fainter
        if (p.rest) a *= Math.min(1, (p.restMax - p.restT) / 5);
        a = Math.min(1, a + p.glow * 0.25);
        if (a <= 0.01) continue;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        ctx.globalAlpha = a;
        ctx.setTransform(dpr * ca * sx, dpr * sa * sx, -dpr * sa, dpr * ca, p.x * dpr, p.y * dpr);
        ctx.drawImage(S.petals[p.variant], -w / 2, -len / 2, w, len);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
  }
  function renderStill() { t = 0; render(0, false); }

  // ---------------------------------------------------------------- loop
  const authVisible = () => { const a = document.getElementById('auth-screen'); return !!a && !a.classList.contains('hidden'); };
  function frame(ts) {
    raf = 0;
    if (!running) return;
    if (authVisible()) { ctx.clearRect(0, 0, canvas.width, canvas.height); timer = setTimeout(() => { timer = 0; if (running) raf = requestAnimationFrame(frame); }, 300); return; }
    const dtm = last ? ts - last : 16.7; last = ts;
    const dt = Math.min(0.05, dtm / 1000);
    t += dt; frames++;
    if (dtm < 250) fpsEMA += (1000 / dtm - fpsEMA) * 0.05;
    // shed load automatically on weak devices
    if (dtm > 34 && dtm < 250) slowRun++; else slowRun = Math.max(0, slowRun - 2);
    if (slowRun > 45 && t - lastShed > 3 && quality > 0.45) {
      quality = Math.max(0.45, quality * 0.8); lastShed = t; slowRun = 0;
      dpr = 0; resize(); applyCount(); setMotion();
    }
    step(dt, performance.now());
    render(t, true);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || LEVELS[level].speed === 0) return;
    running = true; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (timer) clearTimeout(timer); timer = 0;
  }
  const setMotion = () => { document.documentElement.dataset.motion = level === 'still' ? 'still' : (quality < 0.65 ? 'lite' : 'full'); };
  function setLevel(next) {
    if (!LEVELS[next]) return;
    level = next; store.set('sanctuaryAmbience', next);
    stop(); quality = 1; dpr = 0; resize(); applyCount(); setMotion();
    if (LEVELS[level].speed === 0) renderStill(); else start();
    syncSegmented();
  }

  // ---------------------------------------------------------------- interaction
  const INTERACTIVE = 'button, a, input, textarea, select, label, [contenteditable], .card, .modal-content, .nav-item, .journal-sidebar, .editor-toolbar, .history-item, #sidebar';
  const empty = (el) => !(el && el.closest && el.closest(INTERACTIVE));

  function burst(x, y) {
    if (!LEVELS[level].react) return;
    const n = level === 'lively' ? 20 : 13;
    for (let k = 0; k < n && active > 0; k++) {
      const p = particles[(Math.random() * active) | 0];
      const a = rnd(0, TAU), sp = rnd(60, 170) * (0.5 + p.z * 0.6);
      p.rest = 0; p.age = 2; p.x = x + rnd(-8, 8); p.y = y + rnd(-8, 8);
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 50; p.boost = 1.2; p.glow = 1;
    }
    ripples.push({ x, y, t0: t }); if (ripples.length > 4) ripples.shift();
    bursts++;
  }
  function exhale(x, y, r) {
    for (let i = 0; i < active; i++) {
      const p = particles[i], dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d < r && d > 0.1) { const f = 1 - d / r; p.rest = 0; p.vx += (dx / d) * 90 * f; p.vy += (dy / d) * 90 * f - 20 * f; p.boost = Math.max(p.boost, f); }
    }
  }
  const stopHold = () => { clearTimeout(holdTimer); holdTimer = 0; hold.on = false; };

  window.addEventListener('pointermove', (e) => {
    if (LEVELS[level].react === 0) return;
    const now = performance.now();
    if (ptr.t) {
      const dtm = Math.max(8, now - ptr.t);
      ptr.vx += ((e.clientX - ptr.x) / dtm * 1000 - ptr.vx) * 0.4;
      ptr.vy += ((e.clientY - ptr.y) / dtm * 1000 - ptr.vy) * 0.4;
    }
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = now; ptr.lastMove = now; ptr.active = true; ptr.type = e.pointerType || 'mouse';
    if (hold.on) { hold.x = ptr.x; hold.y = ptr.y; }
    else if (holdTimer && Math.hypot(ptr.x - ptr.dx, ptr.y - ptr.dy) > 14) { clearTimeout(holdTimer); holdTimer = 0; }
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (LEVELS[level].react === 0 || !empty(e.target)) return;
    ptr.down = true; ptr.downT = performance.now(); ptr.dx = e.clientX; ptr.dy = e.clientY;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; ptr.type = e.pointerType || 'mouse'; ptr.lastMove = ptr.downT;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { holdTimer = 0; if (ptr.down) { hold.on = true; hold.x = ptr.x; hold.y = ptr.y; } }, 450);
  }, { passive: true });
  const release = (e, cancelled) => {
    if (!ptr.down) return;
    ptr.down = false;
    const moved = Math.hypot((e.clientX || 0) - ptr.dx, (e.clientY || 0) - ptr.dy);
    if (hold.on) { exhale(hold.x, hold.y, hold.r * 1.2); }
    else if (!cancelled && moved < 12 && performance.now() - ptr.downT < 400) burst(ptr.dx, ptr.dy);
    stopHold();
    if (ptr.type === 'touch') ptr.active = false;
  };
  window.addEventListener('pointerup', (e) => release(e, false), { passive: true });
  window.addEventListener('pointercancel', (e) => release(e, true), { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { ptr.active = false; stopHold(); ptr.down = false; });
  window.addEventListener('blur', () => { ptr.active = false; stopHold(); ptr.down = false; });

  const TYPING = '#entry-body, #entry-title, textarea, input[type="text"], input[type="password"]';
  const typed = (e) => { if (e.target && e.target.matches && e.target.matches(TYPING)) { focusTarget = 1; lastType = performance.now(); } };
  document.addEventListener('keydown', typed, true);
  document.addEventListener('input', typed, true);

  if (coarse && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', (e) => {
      const angle = (screen.orientation && screen.orientation.angle) || 0;
      if (angle !== 0 || e.gamma == null) { tiltTarget = 0; return; }
      tiltTarget = clamp(e.gamma / 35, -1, 1) * 0.8;
    }, { passive: true });
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (LEVELS[level].speed) start(); });
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);
  new MutationObserver(() => {
    const dark = document.body.getAttribute('data-theme') === 'dark';
    if (dark === isDark) return;
    isDark = dark; themeFade = 0;
    for (const p of particles) { if (p.rest) respawn(p); p.age = Math.min(p.age, 0.6); }
    if (!running) renderStill();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------------------------------------------------------------- Settings control + first-run hint
  let seg = null;
  function syncSegmented() {
    if (!seg) return;
    for (const b of seg.querySelectorAll('button')) {
      const on = b.dataset.level === level;
      b.setAttribute('aria-checked', String(on)); b.classList.toggle('on', on);
    }
  }
  function buildSettings() {
    const host = document.querySelector('#view-settings > div');
    if (!host || document.getElementById('ambience-row')) return;
    const row = document.createElement('div'); row.id = 'ambience-row'; row.className = 'setting-row';
    const text = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = 'Ambience';
    const p = document.createElement('p');
    p.textContent = isDark ? 'Falling snow. Move to stir it, tap to release a flurry, hold to slow time.' : 'Falling petals. Move to stir them, tap to release a few, hold to slow time.';
    text.append(h, p);
    seg = document.createElement('div'); seg.className = 'seg'; seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', 'Ambience');
    for (const [id, label] of [['still', 'Still'], ['calm', 'Calm'], ['lively', 'Lively']]) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.level = id; b.textContent = label; b.setAttribute('role', 'radio');
      b.addEventListener('click', () => setLevel(id));
      seg.append(b);
    }
    row.append(text, seg);
    host.insertBefore(row, host.children[1] || null);   // right under "Theme"
    syncSegmented();
    new MutationObserver(() => { p.textContent = document.body.getAttribute('data-theme') === 'dark'
      ? 'Falling snow. Move to stir it, tap to release a flurry, hold to slow time.'
      : 'Falling petals. Move to stir them, tap to release a few, hold to slow time.'; })
      .observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  }
  function buildHint() {
    const n = parseInt(store.get('sanctuaryHint') || '0', 10);
    const box = document.querySelector('.quote-container');
    if (!box || n >= 3 || LEVELS[level].speed === 0) return;
    store.set('sanctuaryHint', String(n + 1));
    const hint = document.createElement('p'); hint.className = 'ambient-hint';
    hint.textContent = coarse ? 'Touch the background. Tap to release, hold to slow time.' : 'Move your mouse through the air. Click to release, hold to slow time.';
    box.append(hint);
  }

  // ---------------------------------------------------------------- go
  resize(); applyCount(); setMotion();
  buildSettings(); buildHint();
  if (LEVELS[level].speed === 0) renderStill(); else start();

  window.Ambience = {                                     // small public surface (also used by tests)
    setLevel, getLevel: () => level, burst,
    stats: () => ({ level, kind: isDark ? 'snow' : 'petals', count: active, fps: Math.round(fpsEMA), running, quality, bursts, holding: hold.on, focus, frames, dpr }),
    probe: (x, y, r) => { let n = 0, s = 0, m = 0; for (let i = 0; i < active; i++) { const p = particles[i]; if (!p.rest && Math.hypot(p.x - x, p.y - y) < r) { const v = Math.hypot(p.vx, p.vy); n++; s += v; if (v > m) m = v; } } return { n, speed: n ? s / n : 0, max: m }; }
  };
})();
