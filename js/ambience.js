// --- AMBIENCE: snow at night, sakura petals by day, and they respond to you ---
//
//  move / drag   stirs the air: particles are dragged along and swirl around your finger. Dragging through the
//                petals lying on the ground scatters them (they flutter up and settle again)
//  tap           a ripple travels outward through the air, pushing snow / petals as it passes, with a small bloom
//  press & hold  time slows around your finger; ground petals float up in the bubble; letting go exhales a puff
//  typing        the weather calms down so it never competes with your writing
//  phone tilt    steers the wind (Android; iOS needs a permission prompt, so it is skipped)
//  night         a golden moon (35% across, 15% down) with a warm halo, drifting cloud veils, and snow lit amber near it
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
    flakeIcy:  sprite(64, 64, (g, w) => radial(g, w, '236,240,250', [[0, 1], [0.25, 0.85], [0.6, 0.25], [1, 0]])),
    flakeWarm: sprite(64, 64, (g, w) => radial(g, w, '255,214,130', [[0, 1], [0.25, 0.85], [0.6, 0.25], [1, 0]])),
    bokeh:     sprite(96, 96, (g, w) => radial(g, w, '255,226,170', [[0, 0.16], [0.6, 0.20], [0.88, 0.26], [1, 0]])),
    haloWarm:  sprite(128, 128, (g, w) => radial(g, w, '255,205,120', [[0, 1], [0.4, 0.35], [1, 0]])),
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


  // The moon: a golden, nearly full moon. Lit from the upper left, with maria, craters, Tycho and its rays, limb darkening.
  // Drawn procedurally once (seeded, so it is the same moon every time).
  const makeMoon = () => sprite(240, 240, (g, w) => {
    const c = w / 2, R = 100;
    g.save(); g.beginPath(); g.arc(c, c, R, 0, TAU); g.clip();
    const base = g.createRadialGradient(c - 30, c - 34, 8, c, c, R * 1.05);
    base.addColorStop(0, '#fffbe4'); base.addColorStop(0.5, '#fbe9a4'); base.addColorStop(1, '#dcb35a');
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    for (const [x, y, rx, ry, al, rot] of [[-30, -34, 34, 26, 0.46, -0.3], [22, -30, 22, 20, 0.40, 0.2], [8, -6, 26, 22, 0.38, 0],
      [44, -2, 16, 12, 0.32, 0.4], [-52, 6, 18, 24, 0.30, 0], [-10, 38, 24, 14, 0.22, 0.2], [38, 34, 14, 10, 0.24, 0]]) {
      g.save(); g.translate(c + x, c + y); g.rotate(rot); g.scale(1, ry / rx);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      rg.addColorStop(0, `rgba(168,122,46,${al})`); rg.addColorStop(0.7, `rgba(168,122,46,${al * 0.7})`); rg.addColorStop(1, 'rgba(168,122,46,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
    }
    let seed = 7; const rr = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 52; i++) {                                    // craters: soft pit + a lit rim on the upper-left
      const ang = rr() * TAU, d = Math.sqrt(rr()) * R * 0.93, x = c + Math.cos(ang) * d, y = c + Math.sin(ang) * d, cr = 1.2 + Math.pow(rr(), 2.2) * 7;
      g.fillStyle = 'rgba(160,115,42,0.24)'; g.beginPath(); g.arc(x, y, cr, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,251,226,0.42)'; g.lineWidth = 0.8; g.beginPath(); g.arc(x - cr * 0.18, y - cr * 0.18, cr, Math.PI * 0.9, Math.PI * 1.9); g.stroke();
    }
    const ty = c + 56, tx = c - 8;                                    // Tycho and its rays
    g.strokeStyle = 'rgba(255,250,222,0.15)'; g.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) { const ang = rr() * TAU, len = 22 + rr() * 38; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + Math.cos(ang) * len, ty + Math.sin(ang) * len); g.stroke(); }
    const tg = g.createRadialGradient(tx, ty, 0, tx, ty, 9); tg.addColorStop(0, 'rgba(255,253,235,0.9)'); tg.addColorStop(1, 'rgba(255,253,235,0)');
    g.fillStyle = tg; g.beginPath(); g.arc(tx, ty, 9, 0, TAU); g.fill();
    const limb = g.createRadialGradient(c, c, R * 0.55, c, c, R);      // limb darkening
    limb.addColorStop(0, 'rgba(120,76,18,0)'); limb.addColorStop(1, 'rgba(120,76,18,0.36)');
    g.fillStyle = limb; g.fillRect(0, 0, w, w);
    g.filter = 'blur(2.5px)';                                          // phase: nearly full, with a thin soft shadow on the left edge
    g.fillStyle = 'rgba(14,9,3,0.82)'; g.beginPath(); g.moveTo(c, c - R - 4);
    g.arc(c, c, R + 4, -Math.PI / 2, Math.PI / 2, true);
    g.ellipse(c, c, R * 0.84, R + 4, 0, Math.PI / 2, Math.PI * 1.5, false);
    g.closePath(); g.fill(); g.filter = 'none';
    g.restore();
    g.strokeStyle = 'rgba(255,240,190,0.34)'; g.lineWidth = 1.2; g.beginPath(); g.arc(c, c, R - 0.6, 0, TAU); g.stroke();
  });
  // a drifting veil of cloud (several overlapping soft blobs)
  const makeCloud = () => sprite(360, 100, (g) => {
    for (const [x, y, r, al] of [[70, 56, 44, 0.5], [130, 46, 52, 0.6], [190, 52, 58, 0.6], [250, 48, 50, 0.5], [300, 56, 38, 0.4], [160, 62, 40, 0.4]]) {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(34,24,10,${al})`); rg.addColorStop(1, 'rgba(34,24,10,0)');
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  S.moon = makeMoon(); S.cloud = makeCloud();

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
  const moon = { x: 0, y: 0, r: 40, lift: 0, pulse: 0, dim: 0 };
  let clouds = [], moonGlow = null, lastGlowO = -1;
  let pile = [], pileLive = 0;                          // petals lying on the ground (day)
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
      age: scatter ? 9 : 0, rest: 0, restT: 0, restMax: 0, restSx: 0.5, land: rnd(0, 46), inPile: false, boost: 0, glow: 0
    };
  }
  function respawn(p) {
    p.x = rnd(-20, W + 20); p.y = rnd(-70, -12); p.age = 0; p.rest = 0; p.boost = 0;
    p.vx = 0; p.vy = 0; p.land = rnd(0, 46);
    if (p.inPile) { p.inPile = false; pileLive--; }
  }

  function layoutScene() {
    moon.x = W * 0.35; moon.y = H * 0.15; moon.r = clamp(Math.min(W, H) * 0.07, 30, 72);
    if (!clouds.length) {                                // veils drift past the moon; the first one arrives within ~30 s
      const s = moon.r / 50;
      clouds = [{ x: moon.x - 380 * s, y: moon.y - 6 * s, w: 520 * s, h: 100 * s, v: 16 },
                { x: moon.x + 900 * s, y: moon.y + 50 * s, w: 700 * s, h: 120 * s, v: 11 },
                { x: moon.x - 1500 * s, y: moon.y - 60 * s, w: 600 * s, h: 95 * s, v: 14 }];
    }
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
    layoutScene();
    applyCount();
    if (!running) renderStill();
  }

  // ---------------------------------------------------------------- physics
  function windAt(time) {
    const env = clamp((time - gust.t0) / 9, 0, 1);
    const g = gust.amp * Math.pow(Math.sin(Math.PI * env), 2);
    return Math.sin(time * 0.07) * 0.35 + Math.sin(time * 0.031 + 1.3) * 0.25 + g + tilt;
  }
  const liftPetal = (p, vx, vy) => {                     // a petal leaves the pile
    p.rest = 0; p.vx = vx; p.vy = vy; p.boost = 1; p.age = 2; p.land = rnd(0, 46);
    if (p.inPile) { p.inPile = false; pileLive--; }
  };
  function trimPile() {
    const cap = Math.round(active * 0.38);
    while (pileLive > cap && pile.length) {
      const q = pile.shift();
      if (q && q.inPile) { q.restMax = Math.min(q.restMax, q.restT + 4); q.inPile = false; pileLive--; }   // oldest fades out
    }
    if (pile.length > cap * 3 + 30) pile = pile.filter((q) => q.inPile);
  }
  function updateMoon(dt, now) {
    const s = moon.r / 50;
    let cover = 0;
    for (const c of clouds) {
      c.x += c.v * dt * s;
      if (c.x - c.w / 2 > W + 100) { c.x = -c.w / 2 - rnd(0, 500); c.y = moon.y + rnd(-90, 90) * s; }
      const dx = (moon.x - c.x) / (c.w * 0.42), dy = (moon.y - c.y) / (c.h * 0.5);
      cover = Math.max(cover, Math.exp(-(dx * dx + dy * dy) * 1.6));
    }
    moon.dim += (cover - moon.dim) * (1 - Math.exp(-dt * 1.5));
    const near = ptr.active && now - ptr.lastMove < 1500 ? Math.max(0, 1 - Math.hypot(ptr.x - moon.x, ptr.y - moon.y) / (moon.r * 5)) : 0;
    moon.lift += (near - moon.lift) * (1 - Math.exp(-dt * 3));      // the halo brightens when you reach toward the moon
    moon.pulse *= Math.exp(-dt * 1.1);
    setGlow();
  }
  function setGlow() {
    if (!moonGlow) moonGlow = document.querySelector('.moon-glow');
    if (!moonGlow) return;
    const o = isDark ? Math.min(1, 0.78 * (1 - 0.5 * moon.dim) * (1 + 0.35 * moon.lift + 0.6 * moon.pulse)) : 0;
    if (Math.abs(o - lastGlowO) > 0.015) { lastGlowO = o; moonGlow.style.opacity = o.toFixed(2); }
  }
  function step(dt, now) {
    const L = LEVELS[level];
    if (t > nextGust) { gust = { t0: t, amp: rnd(0.8, 1.4) * (Math.random() < 0.5 ? -1 : 1) }; nextGust = t + rnd(25, 50); }
    focus += (focusTarget - focus) * (1 - Math.exp(-dt * 2));
    if (focusTarget && now - lastType > 2200) focusTarget = 0;
    tilt += (tiltTarget - tilt) * (1 - Math.exp(-dt * 3));
    if (themeFade < 1) themeFade = Math.min(1, themeFade + dt / 1.2);
    const pdecay = Math.exp(-dt * (now - ptr.lastMove > 120 ? 8 : 1));
    ptr.vx *= pdecay; ptr.vy *= pdecay;

    const wind = windAt(t) * L.wind, ease = 1 - Math.exp(-dt * 1.6);
    const fall = (isDark ? 26 : 20) * L.speed * (1 - 0.5 * focus);
    const R = (coarse ? 135 : 160) * (0.8 + 0.2 * L.react), R2 = R * R;
    const wake = L.react > 0 && ptr.active && (ptr.type !== 'touch' || ptr.down) && now - ptr.lastMove < 250;
    const fy = floorY();
    const spd = Math.hypot(ptr.vx, ptr.vy), swirl = Math.min(1, spd / 500) * 70;
    const sgnBase = ptr.vx, sgnBaseY = ptr.vy;
    const waves = [];                                    // tap ripples travel through the air and push what they cross
    for (let k = ripples.length - 1; k >= 0; k--) {
      const r = ripples[k], u = (t - r.t0) / 0.9;
      if (u >= 1) { ripples.splice(k, 1); continue; }
      waves.push({ x: r.x, y: r.y, rad: 24 + 380 * (1 - Math.pow(1 - u, 3)), f0: 1 - u });
    }
    if (isDark) updateMoon(dt, now);

    for (let i = 0; i < active; i++) {
      const p = particles[i], z = p.z;
      p.age += dt;
      p.glow *= Math.exp(-dt * 4);
      const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;

      let wvx = 0, wvy = 0;                              // push from any ripple front passing through this particle
      for (const w of waves) {
        const ex = p.x - w.x, ey = p.y - w.y, ed = Math.hypot(ex, ey) || 1, dd = Math.abs(ed - w.rad);
        if (dd < 36) { const f = (1 - dd / 36) * w.f0; wvx += (ex / ed) * 150 * f; wvy += (ey / ed) * 150 * f; }
      }

      if (p.rest) {                                      // a petal lying in the pile
        p.restT += dt;
        if (p.restT >= p.restMax) { respawn(p); continue; }
        if (wvx || wvy) { liftPetal(p, wvx * 0.6, wvy * 0.6 - rnd(40, 90)); continue; }
        if (wake && d2 < R2 * 0.7) {                     // drag through the pile: petals scatter, flutter, and settle again
          const d = Math.sqrt(d2) || 1;
          liftPetal(p, ptr.vx * 0.35 + (dx / d) * 80, -rnd(60, 130)); continue;
        }
        if (hold.on) {                                   // inside the slow-time bubble, resting petals float up
          const hx = p.x - hold.x, hy = p.y - hold.y;
          if (hx * hx + hy * hy < hold.r * hold.r) { liftPetal(p, rnd(-14, 14), -rnd(28, 52)); continue; }
        }
        continue;
      }

      // slow, large-scale air currents (eddies) so the whole sky never moves as one sheet
      const eddyX = Math.sin(p.y * 0.006 + t * 0.21 + Math.sin(p.x * 0.003 + t * 0.11) * 2) * 18 * z * L.wind;
      const eddyY = Math.cos(p.x * 0.005 - t * 0.17 + Math.sin(p.y * 0.004) * 1.5) * 7 * z * L.wind;
      const tvy = fall * (0.35 + 0.9 * z) + (isDark ? 0 : Math.sin(p.fl) * 5 * L.speed) + eddyY;
      const tvx = wind * 38 * z * (isDark ? 1 : 1.3) + eddyX + Math.sin(t * p.sf + p.ph) * (isDark ? 10 : 20) * z * L.speed;
      p.vx += (tvx - p.vx) * ease; p.vy += (tvy - p.vy) * ease;
      if (wvx || wvy) { const k = Math.min(1, dt * 10); p.vx += wvx * k; p.vy += wvy * k; p.boost = Math.max(p.boost, 0.7); }

      if (wake && d2 < R2) {                             // air drag from the pointer, plus a swirl that curls around it
        const d = Math.sqrt(d2) || 1, f = 1 - d / R, f2 = f * f * (0.5 + 0.5 * z);
        const k = Math.min(1, dt * 9) * f2 * L.react * 2.3;
        const sg = Math.sign(sgnBase * dy - sgnBaseY * dx) || 1, sw = swirl * f;
        p.vx += (ptr.vx * 0.42 + (dx / d) * 95 * f + (-dy / d) * sg * sw - p.vx) * k;
        p.vy += (ptr.vy * 0.42 + (dy / d) * 95 * f + (dx / d) * sg * sw - p.vy) * k;
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
      if (isDark) {
        if (p.y > H + 10) respawn(p);                    // snow simply falls out of the bottom of the screen
      } else if (p.y > fy + p.land) {                    // a petal lands and stays; the oldest ones fade when the pile is full
        p.rest = 1; p.restT = 0; p.restMax = rnd(70, 140); p.vx = p.vy = 0;
        p.y = fy + p.land; p.ang = rnd(0, TAU); p.restSx = rnd(0.35, 0.8);
        if (!p.inPile) { p.inPile = true; pileLive++; pile.push(p); trimPile(); }
      }
    }
  }

  // ---------------------------------------------------------------- drawing
  function render(time, animated) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const fade = themeFade, fx = 1 - 0.3 * focus;
    const moonLightR = Math.min(700, Math.max(W, H) * 0.55);

    if (isDark) {                                        // the moon and its drifting cloud veils
      const sc = moon.r / 100, rot = -0.32, cr = Math.cos(rot) * dpr, sr = Math.sin(rot) * dpr;
      ctx.globalAlpha = fade * 0.94 * (1 - 0.55 * moon.dim);
      ctx.setTransform(cr, sr, -sr, cr, moon.x * dpr, moon.y * dpr);
      ctx.drawImage(S.moon, -120 * sc, -120 * sc, 240 * sc, 240 * sc);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const c of clouds) { ctx.globalAlpha = 0.32 * fade; ctx.drawImage(S.cloud, c.x - c.w / 2, c.y - c.h / 2, c.w, c.h); }
      ctx.globalAlpha = 1;
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
      const r = ripples[i], u = (time - r.t0) / 0.9;
      if (u >= 1) { ripples.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - u, 3);
      ctx.globalAlpha = 0.24 * (1 - u) * fade; ctx.lineWidth = 1.2;
      ctx.strokeStyle = isDark ? 'rgb(255,222,150)' : 'rgb(214,120,140)';
      ctx.beginPath(); ctx.arc(r.x, r.y, 24 + 380 * e, 0, TAU); ctx.stroke();
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
        const dm = Math.hypot(p.x - moon.x, p.y - moon.y), I = dm < moonLightR ? Math.pow(1 - dm / moonLightR, 1.5) : 0;
        base *= 1 + 0.9 * I + 0.8 * moon.pulse * I;                                  // flakes near the moon catch its light
        if (animated && I > 0.25) base *= 0.82 + 0.18 * Math.sin(t * 5 + p.ph * 7);   // and glitter a little
        a *= Math.min(1, (H - p.y) / 140) * (base + p.glow * 0.5);
        if (a <= 0.01) continue;
        a = Math.min(1, a);
        if (bokeh) { ctx.globalAlpha = a * 0.5; ctx.drawImage(S.bokeh, p.x - d / 2, p.y - d / 2, d, d); continue; }
        ctx.globalAlpha = a * (1 - 0.7 * Math.min(1, I * 1.5)); ctx.drawImage(S.flakeIcy, p.x - d / 2, p.y - d / 2, d, d);
        if (I > 0.02) { ctx.globalAlpha = Math.min(1, a * Math.min(1, I * 1.5) * 1.2); ctx.drawImage(S.flakeWarm, p.x - d / 2, p.y - d / 2, d, d); }
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
  function renderStill() { t = 0; setGlow(); render(0, false); }       // setGlow: the moon's halo must also show in Still mode

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
    if (isDark && Math.hypot(x - moon.x, y - moon.y) < moon.r * 2.6) {          // touching the moon makes it glow and the snow around it glitter
      moon.pulse = 1;
      for (let i = 0; i < active; i++) { const p = particles[i]; if (Math.hypot(p.x - moon.x, p.y - moon.y) < moon.r * 7) { p.glow = 1; p.boost = Math.max(p.boost, 0.6); } }
    }
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
    for (const p of particles) { if (p.rest) respawn(p); p.age = Math.min(p.age, 0.6); p.inPile = false; }
    pile = []; pileLive = 0; lastGlowO = -1; setGlow();
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
    p.textContent = isDark ? 'Snow under a golden moon. Move to stir the air, tap to send a ripple, hold to slow time.' : 'Falling petals. Move to stir them, drag through the pile to scatter it, tap to send a ripple, hold to slow time.';
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
      ? 'Snow under a golden moon. Move to stir the air, tap to send a ripple, hold to slow time.'
      : 'Falling petals. Move to stir them, drag through the pile to scatter it, tap to send a ripple, hold to slow time.'; })
      .observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  }
  function buildHint() {
    const n = parseInt(store.get('sanctuaryHint') || '0', 10);
    const box = document.querySelector('.quote-container');
    if (!box || n >= 3 || LEVELS[level].speed === 0) return;
    store.set('sanctuaryHint', String(n + 1));
    const hint = document.createElement('p'); hint.className = 'ambient-hint';
    hint.textContent = coarse ? 'Touch the background. Tap for a ripple, hold to slow time.' : 'Move your mouse through the air. Click for a ripple, hold to slow time.';
    box.append(hint);
  }

  // ---------------------------------------------------------------- go
  resize(); applyCount(); setMotion();
  buildSettings(); buildHint();
  if (LEVELS[level].speed === 0) renderStill(); else start();

  window.Ambience = {                                     // small public surface (also used by tests)
    setLevel, getLevel: () => level, burst,
    stats: () => ({ level, kind: isDark ? 'snow' : 'petals', count: active, fps: Math.round(fpsEMA), running, quality, bursts, holding: hold.on, focus, frames, dpr,
      moon: { x: moon.x, y: moon.y, r: moon.r, pulse: moon.pulse, lift: moon.lift, dim: moon.dim }, pile: pileLive, ripples: ripples.length, }),
    simulate: (sec) => { const n = Math.round(sec / 0.05), now = performance.now(); for (let k = 0; k < n; k++) { t += 0.05; step(0.05, now); } },
    probe: (x, y, r) => { let n = 0, s = 0, m = 0; for (let i = 0; i < active; i++) { const p = particles[i]; if (!p.rest && Math.hypot(p.x - x, p.y - y) < r) { const v = Math.hypot(p.vx, p.vy); n++; s += v; if (v > m) m = v; } } return { n, speed: n ? s / n : 0, max: m }; }
  };
})();
