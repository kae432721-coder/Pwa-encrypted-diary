// Ambience engine: levels, interaction, typing calm, settings control, reduced motion.   node tests/ambience.cjs <site-dir>
const path = require("path"), { chromium } = require("playwright");
const { createStaticServer, listen } = require("./static-server.cjs");
const srv = createStaticServer(path.resolve(process.argv[2] || "."));
let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log((c ? "ok   " : "FAIL ") + n + (c ? "" : "  " + x)); };
const errs = [];
async function page(b, { theme = "light", level, reduce = false, showApp = true } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: "block", reducedMotion: reduce ? "reduce" : "no-preference" });
  await ctx.addInitScript(([t, l]) => { try { localStorage.setItem("sanctuaryTheme", t); localStorage.setItem("sanctuaryHint", "9"); if (l) localStorage.setItem("sanctuaryAmbience", l); } catch (e) {} }, [theme, level]);
  await ctx.route("https://accounts.google.com/gsi/client", (r) => r.fulfill({ contentType: "text/javascript", body: "window.google={accounts:{oauth2:{initTokenClient:()=>({requestAccessToken(){}})}}};" }));
  await ctx.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await ctx.route("https://www.googleapis.com/**", (r) => r.fulfill({ status: 200, body: "{}" }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" || /Content Security/.test(m.text())) errs.push(m.text()); });
  await p.goto("http://localhost:8150/"); await p.waitForTimeout(300);
  if (showApp) await p.evaluate(() => { document.getElementById("auth-screen").classList.add("hidden"); document.getElementById("quote-screen").classList.add("hidden"); document.getElementById("main-workspace").classList.remove("hidden"); });
  return { ctx, p };
}
const S = (p) => p.evaluate(() => Ambience.stats());

(async () => {
  await listen(srv, 8150);
  const b = await chromium.launch();

  // ---- basics
  let { ctx, p } = await page(b);
  await p.waitForTimeout(1200);
  let s = await S(p);
  ok("starts in Calm and runs", s.level === "calm" && s.running && s.frames > 5);
  ok("enough particles for the screen (>=90)", s.count >= 90, s.count);
  ok("canvas actually has pixels drawn", await p.evaluate(() => { const c = document.getElementById("snow-canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) return true; return false; }));
  ok("light theme = petals", s.kind === "petals");
  await p.click("#btn-theme-toggle-icon"); await p.waitForTimeout(400);
  ok("dark theme = snow (follows the theme toggle)", (await S(p)).kind === "snow");
  await p.click("#btn-theme-toggle-icon"); await p.waitForTimeout(300);

  // ---- stirring the air
  const base = await p.evaluate(() => Ambience.probe(800, 450, 160));
  let peak = 0, peakMax = 0;
  for (let k = 0; k < 5; k++) for (let i = 0; i < 16; i++) { await p.mouse.move(600 + i * 26, 520 - i * 4); await p.waitForTimeout(14); const pr = await p.evaluate(() => Ambience.probe(800, 450, 190)); peak = Math.max(peak, pr.speed); peakMax = Math.max(peakMax, pr.max); }
  console.log(`     (stir: baseline avg ${base.speed.toFixed(0)} / max ${base.max.toFixed(0)} px/s; during sweep avg ${peak.toFixed(0)} / max ${peakMax.toFixed(0)} px/s)`);
  ok("moving the pointer stirs nearby particles", peakMax > Math.max(base.max * 2.2, 100), `base max ${base.max.toFixed(0)} peak max ${peakMax.toFixed(0)}`);

  // ---- tap bloom (only on empty background)
  const tgt = await p.evaluate(() => document.elementFromPoint(1570, 420).tagName + "#" + document.elementFromPoint(1570, 420).id);
  const b0 = (await S(p)).bursts;
  await p.mouse.click(1570, 420); await p.waitForTimeout(150);
  ok("tapping the empty background releases a bloom", (await S(p)).bursts === b0 + 1, tgt);
  await p.click("#btn-toggle-sidebar"); await p.click("#btn-toggle-sidebar"); await p.waitForTimeout(100);
  ok("tapping a button does NOT trigger a bloom", (await S(p)).bursts === b0 + 1);
  await p.click("#entry-body"); await p.waitForTimeout(100);
  ok("tapping inside the editor does NOT trigger a bloom", (await S(p)).bursts === b0 + 1);

  // ---- press and hold slows time, release exhales (no bloom)
  const b1 = (await S(p)).bursts;
  await p.mouse.move(1570, 600); await p.mouse.down(); await p.waitForTimeout(700);
  ok("press-and-hold starts the slow-time bubble", (await S(p)).holding === true);
  await p.mouse.up(); await p.waitForTimeout(150);
  s = await S(p);
  ok("releasing a hold ends it without a bloom", s.holding === false && s.bursts === b1);

  // ---- petals lying on the ground (day): they persist, scatter when you drag through them, and settle again
  await p.mouse.move(20, 20);
  await p.evaluate(() => Ambience.simulate(90));
  let st = await S(p);
  ok("petals land and stay as a pile on the ground", st.pile >= 15, `pile ${st.pile}`);
  ok("the pile is capped (never buries the sky)", st.pile <= Math.round(st.count * 0.38) + 1, `pile ${st.pile} of ${st.count}`);
  const pile0 = st.pile;
  for (let k = 0; k < 3; k++) for (let i = 0; i < 40; i++) { await p.mouse.move(500 + i * 24, 860); await p.waitForTimeout(10); }
  const pile1 = (await S(p)).pile;
  ok("dragging through the pile scatters the petals", pile1 <= pile0 - 5, `${pile0} -> ${pile1}`);
  await p.mouse.move(20, 20); await p.waitForTimeout(400);
  await p.evaluate(() => Ambience.simulate(40));
  ok("scattered petals settle again", (await S(p)).pile > pile1, `${pile1} -> ${(await S(p)).pile}`);

  // ---- the night: moon, moonlit snow, ploughable ground, ripples
  await p.click("#btn-theme-toggle-icon"); await p.waitForTimeout(500);
  await p.mouse.move(20, 20);
  st = await S(p);
  ok("night shows snow", st.kind === "snow");
  ok("the moon sits where the old light was (35% across, 15% down)", Math.abs(st.moon.x - 1600 * 0.35) < 2 && Math.abs(st.moon.y - 900 * 0.15) < 2, JSON.stringify(st.moon));
  await p.waitForTimeout(1500);
  const px = await p.evaluate(() => { const c = document.getElementById("snow-canvas"), s = Ambience.stats().moon, d = c.getContext("2d").getImageData(Math.round(s.x * c.width / innerWidth) + 6, Math.round(s.y * c.height / innerHeight), 1, 1).data; return { a: d[3], lum: (d[0] + d[1] + d[2]) / 3 }; });
  ok("the moon is actually drawn (bright, opaque disc)", px.a > 200 && px.lum > 150, JSON.stringify(px));
  ok("moon halo is visible at night and hidden by day", await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".moon-glow")).opacity)) > 0.3);
  // tapping the moon makes it glow (on the Codex screen, where nothing covers it)
  await p.evaluate(() => document.querySelector('.nav-item[data-target="view-people"]').click()); await p.waitForTimeout(400);
  await p.mouse.click(Math.round(st.moon.x), Math.round(st.moon.y)); await p.waitForTimeout(250);
  ok("touching the moon makes it pulse", (await S(p)).moon.pulse > 0.3, String((await S(p)).moon.pulse));
  await p.evaluate(() => document.querySelector('.nav-item[data-target="view-journal"]').click()); await p.waitForTimeout(300);
  // tap ripple travels through the air
  await p.mouse.click(1570, 520); await p.waitForTimeout(150);
  ok("a tap sends a ripple through the air", (await S(p)).ripples >= 1);
  await p.waitForTimeout(1300);
  ok("…which fades away", (await S(p)).ripples === 0, String((await S(p)).ripples));
  // plough the snowy ground
  await p.mouse.move(20, 20); await p.waitForTimeout(300);
  const g0 = await p.evaluate(() => Ambience.groundRange(500, 900));
  ok("the ground has snow drifts (> 12px)", g0 > 12, g0.toFixed(1));
  let gmin = g0;
  for (let k = 0; k < 2; k++) for (let i = 0; i < 30; i++) { await p.mouse.move(500 + i * 14, 862); await p.waitForTimeout(10); gmin = Math.min(gmin, await p.evaluate(() => Ambience.groundRange(500, 900))); }
  ok("dragging along the ground ploughs a furrow", gmin < g0 - 3, `${g0.toFixed(1)} -> ${gmin.toFixed(1)}`);
  await p.mouse.move(20, 20); await p.waitForTimeout(400);
  await p.evaluate(() => Ambience.simulate(60));
  const g2 = await p.evaluate(() => Ambience.groundRange(500, 900));
  ok("…and the furrow heals", g2 > gmin + 2, `${gmin.toFixed(1)} -> ${g2.toFixed(1)}`);
  await p.click("#btn-theme-toggle-icon"); await p.waitForTimeout(1400);
  ok("by day the moon halo is hidden", await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".moon-glow")).opacity)) < 0.05);

  // ---- typing calms the weather, then it returns
  await p.click("#entry-title"); await p.keyboard.type("quiet", { delay: 40 }); await p.waitForTimeout(900);
  const f1 = (await S(p)).focus;
  ok("typing calms the background", f1 > 0.4, f1.toFixed(2));
  await p.waitForTimeout(5200);
  const f2 = (await S(p)).focus;
  ok("…and it gently returns after you stop", f2 < 0.2, f2.toFixed(2));

  // ---- settings control + levels
  await p.evaluate(() => document.querySelector('.nav-item[data-target="view-settings"]').click()); await p.waitForTimeout(300);
  const btns = await p.$$eval("#ambience-row .seg button", (bs) => bs.map((x) => x.textContent));
  ok("Settings has an Ambience control (Still / Calm / Lively)", btns.join() === "Still,Calm,Lively", btns.join());
  const calmCount = (await S(p)).count;
  await p.click('#ambience-row button[data-level="lively"]'); await p.waitForTimeout(300);
  s = await S(p);
  ok("Lively adds more particles", s.level === "lively" && s.count > calmCount * 1.4, `${calmCount} -> ${s.count}`);
  ok("choice is remembered", await p.evaluate(() => localStorage.getItem("sanctuaryAmbience")) === "lively");
  await p.click('#ambience-row button[data-level="still"]'); await p.waitForTimeout(300);
  const fr = (await S(p)).frames; await p.waitForTimeout(600);
  s = await S(p);
  ok("Still stops the animation loop completely", !s.running && s.frames === fr, `${fr} -> ${s.frames}`);
  ok("Still also stops the CSS mist/motes", await p.evaluate(() => document.documentElement.dataset.motion === "still" && getComputedStyle(document.querySelector(".mote") || document.body).display === "none"));
  ok("aria-checked reflects the level", await p.$eval('#ambience-row button[data-level="still"]', (e) => e.getAttribute("aria-checked")) === "true");
  await ctx.close();

  // ---- reduced motion => starts Still unless the user chose otherwise
  ({ ctx, p } = await page(b, { reduce: true }));
  await p.waitForTimeout(500);
  s = await S(p);
  ok("prefers-reduced-motion starts in Still", s.level === "still" && !s.running);
  await ctx.close();

  // ---- Still mode at night still shows the whole moon (disc + halo)
  ({ ctx, p } = await page(b, { theme: "dark", level: "still" }));
  await p.waitForTimeout(900);
  ok("Still + night: the moon's halo is visible too", await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".moon-glow")).opacity)) > 0.3);
  await ctx.close();

  // ---- idle while the sign-in screen covers the canvas
  ({ ctx, p } = await page(b, { showApp: false }));
  await p.waitForTimeout(1200);
  ok("no drawing while the sign-in screen is showing", (await S(p)).frames <= 3, String((await S(p)).frames));
  await ctx.close();

  ok("no page errors / CSP violations", errs.length === 0, errs.join("\n"));
  await b.close(); srv.close();
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
