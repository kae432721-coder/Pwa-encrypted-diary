// End-to-end test in headless Chromium with a mocked Google + Drive.
// Usage: node tests/e2e.cjs <site_dir>      (needs: npm i playwright)
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const assert = require("assert");
const root = path.resolve(process.argv[2] || ".");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png" };
const srv = http.createServer((q, r) => {
  let p = path.join(root, decodeURIComponent(q.url.split("?")[0])); if (p.endsWith("/")) p += "index.html";
  fs.readFile(p, (e, d) => e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { "content-type": MIME[path.extname(p)] || "text/plain" }), r.end(d)));
});
const GSI = `window.google={accounts:{oauth2:{initTokenClient:(c)=>({requestAccessToken:()=>setTimeout(()=>c.callback({access_token:window.__tok||'tok1'}),10)})}}};`;
const drive = { file: null, version: 1, expireNext: false };   // mocked Drive
let pass = 0, fail = 0;
const ok = (n, c, extra = "") => { c ? pass++ : fail++; console.log((c ? "ok   " : "FAIL ") + n + (c ? "" : "  " + extra)); };

(async () => {
  await new Promise((r) => srv.listen(8123, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ serviceWorkers: "block" });
  const page = await ctx.newPage();
  const dialogs = [], errors = [], csp = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { const t = m.text(); if (/Content Security Policy/i.test(t)) csp.push(t); else if (m.type() === "error" && !/Sync error|status of 401/.test(t)) errors.push(t); });
  await ctx.route("https://accounts.google.com/gsi/client", (r) => r.fulfill({ contentType: "text/javascript", body: GSI }));
  await ctx.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await ctx.route("https://www.googleapis.com/**", async (r) => {
    const req = r.request(), u = new URL(req.url()), j = (o, s = 200) => r.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(o) });
    if (drive.expireNext && !/userinfo/.test(u.pathname)) { drive.expireNext = false; return r.fulfill({ status: 401, body: "{}" }); }
    if (u.pathname.endsWith("userinfo")) return j({ email: "me@test.dev" });
    if (u.pathname === "/drive/v3/files") return j({ files: drive.file ? [{ id: "F1" }] : [] });
    if (u.pathname === "/upload/drive/v3/files" && req.method() === "POST") {
      drive.file = req.postData().match(/\r\n\r\n(\{"payload".*\})\r\n--/s)[1]; drive.version++; return j({ id: "F1", version: String(drive.version) }); }
    if (u.pathname === "/upload/drive/v3/files/F1") { drive.file = req.postData(); drive.version++; return j({ version: String(drive.version) }); }
    if (u.pathname === "/drive/v3/files/F1") {
      if (u.searchParams.get("alt") === "media") return r.fulfill({ status: 200, body: drive.file });
      return j({ version: String(drive.version) }); }
    return j({}, 404);
  });
  const open = async () => { await page.goto("http://localhost:8123/"); await page.click("#btn-google-login"); await page.waitForSelector("#step-password:not(.hidden)"); };
  const unlock = async (pw, confirmPw) => {
    await page.fill("#diary-password", pw);
    if (confirmPw !== undefined) { await page.click("#btn-unlock"); await page.waitForSelector("#diary-password-confirm"); await page.fill("#diary-password-confirm", confirmPw); }
    await page.click("#btn-unlock");
  };

  // 1. brand-new vault needs a confirmed password
  await open(); await unlock("short"); await page.waitForTimeout(300);
  ok("weak password refused on creation", dialogs.some((d) => /at least 8/.test(d)));
  await unlock("correct-horse-battery", "correct-horse-batterx"); await page.waitForTimeout(300);
  ok("mismatched confirmation refused", dialogs.some((d) => /do not match/.test(d)));
  await page.fill("#diary-password-confirm", "correct-horse-battery"); await page.click("#btn-unlock");
  await page.waitForSelector("#quote-screen:not(.hidden)");
  ok("new vault created + stored encrypted (ENC2)", drive.file && JSON.parse(drive.file).payload.startsWith("ENC2:"));
  ok("password field wiped from DOM after unlock", (await page.inputValue("#diary-password")) === "");

  // 2. journal body (contenteditable) is saved + survives lock/unlock
  await page.click("#btn-enter-sanctuary"); await page.waitForSelector("#main-workspace:not(.hidden)");
  await page.click("#btn-quick-new"); await page.fill("#entry-title", "Day one");
  await page.click("#entry-body"); await page.keyboard.type("dear diary, secret text");
  await page.waitForTimeout(2200);
  ok("vault on Drive does not contain plaintext", !drive.file.includes("secret text") && !drive.file.includes("Day one"));

  // 3. XSS payloads must stay inert
  await page.evaluate(() => document.querySelector('[data-target="view-thoughts"]').click());
  await page.fill("#quick-thought-input", `<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>`); await page.click("#btn-save-thought");
  await page.evaluate(() => { sanctuaryData.codex.push({ id: "CDX-evil", type: "person", name: `<img src=x onerror="window.__xss=3">`, image: `x" onerror="window.__xss=4`, notes: "n" });
    sanctuaryData.journal.push({ id: "J-evil", title: `<img src=x onerror="window.__xss=5">`, content: `<b>ok</b><img src=x onerror="window.__xss=6"><script>window.__xss=7</script><a href="javascript:window.__xss=8">x</a>`, timestamp: new Date().toISOString() });
    document.querySelector('[data-target="view-people"]').click(); document.getElementById("btn-add-codex").click(); document.getElementById("btn-close-codex").click(); window.dispatchEvent(new Event("vaultMerged")); });
  await page.waitForTimeout(500);
  ok("no injected script executed", (await page.evaluate(() => window.__xss)) === undefined);
  ok("payload rendered as literal text", (await page.textContent("#thoughts-feed")).includes("<img src=x"));
  await page.evaluate(() => { activeJournalId = "J-evil"; setBody(sanctuaryData.journal.find(j => j.id === "J-evil").content); });
  const bodyHtml = await page.innerHTML("#entry-body");
  ok("journal HTML sanitised (keeps <b> + text, drops img/script/a/handlers)", bodyHtml === "<b>ok</b>x", bodyHtml);
  ok("global lexical keys not reachable (no activeKey/gDriveToken)", await page.evaluate(() => typeof activeKey === "undefined" && typeof gDriveToken === "undefined"));

  // 4. lock really locks; entries persisted
  await page.evaluate(() => { sanctuaryData.journal = sanctuaryData.journal.filter(j => j.id !== "J-evil"); sanctuaryData.codex = []; window.pushToDrive(); });
  await page.waitForTimeout(800);
  await page.click("#btn-lock-diary"); await page.waitForLoadState("load"); await page.waitForTimeout(300);
  ok("after lock the auth screen is shown (no sessionStorage bypass)", await page.isVisible("#auth-screen") && !(await page.isVisible("#main-workspace")));
  await page.click("#btn-google-login"); await page.waitForSelector("#step-password:not(.hidden)");
  await unlock("wrong-password-1"); await page.waitForTimeout(1500);
  ok("wrong password rejected", dialogs.some((d) => /Incorrect password/.test(d)));
  await unlock("correct-horse-battery"); await page.waitForSelector("#quote-screen:not(.hidden)");
  await page.click("#btn-enter-sanctuary");
  ok("journal body + title restored after unlock", (await page.inputValue("#entry-title")) === "Day one" && (await page.textContent("#entry-body")).includes("secret text"));

  // 5. like persists across unlock (old code reset it)
  await page.evaluate(() => { document.getElementById("btn-like-quote").click(); });
  await page.waitForTimeout(2000);
  await page.click("#btn-lock-diary"); await page.waitForLoadState("load");
  await page.click("#btn-google-login"); await page.waitForSelector("#step-password:not(.hidden)");
  await unlock("correct-horse-battery"); await page.waitForSelector("#quote-screen:not(.hidden)");
  ok("quote 'like' persisted", await page.evaluate(() => document.getElementById("btn-like-quote").classList.contains("liked")));
  await page.click("#btn-enter-sanctuary");

  // 6. huge vault is still encrypted
  await page.evaluate(() => { sanctuaryData.thoughts.push({ id: "big", type: "personal", text: "Z".repeat(3000000), timestamp: new Date().toISOString() }); return window.pushToDrive(); });
  await page.waitForTimeout(2500);
  ok("3 MB vault stored encrypted (old code: plaintext)", JSON.parse(drive.file).payload.startsWith("ENC2:") && !drive.file.includes("ZZZZZZZZ"));

  // 7. expired token -> silent refresh, no data loss
  drive.expireNext = true; await page.evaluate(() => { window.__tok = "tok2"; sanctuaryData.thoughts.push({ id: "after401", type: "personal", text: "written after token expiry", timestamp: new Date().toISOString() }); window.pushToDrive(); });
  await page.waitForTimeout(2500);
  ok("sync status OK after a 401 + token refresh", (await page.textContent("#cloud-indicator")).includes("Synced"), await page.textContent("#cloud-indicator"));

  // 8. tampered (plaintext) vault on Drive is NOT silently trusted
  const good = drive.file;
  drive.file = JSON.stringify({ payload: JSON.stringify({ thoughts: [{ id: "t", type: "personal", text: `<img src=x onerror="window.__xss=9">`, timestamp: new Date().toISOString() }] }) });
  dialogs.length = 0; await open(); await unlock("correct-horse-battery"); await page.waitForTimeout(600);
  ok("plaintext vault triggers a warning dialog (declined -> not loaded)", dialogs.some((d) => /NOT encrypted/.test(d)) && !(await page.isVisible("#quote-screen")));
  ok("tampering did not execute code", (await page.evaluate(() => window.__xss)) === undefined);
  drive.file = good;

  // 9. password change
  await open(); await unlock("correct-horse-battery"); await page.waitForSelector("#quote-screen:not(.hidden)"); await page.click("#btn-enter-sanctuary");
  await page.evaluate(() => document.querySelector('[data-target="view-settings"]').click());
  await page.fill("#old-key", "correct-horse-battery"); await page.fill("#new-key", "a-brand-new-passphrase"); await page.fill("#new-key-confirm", "a-brand-new-passphrase");
  await page.click("#btn-confirm-key-change"); await page.waitForTimeout(4000);
  ok("password changed", dialogs.some((d) => /Password changed/.test(d)));
  await open(); dialogs.length = 0; await unlock("correct-horse-battery"); await page.waitForTimeout(1500);
  ok("old password no longer works", dialogs.some((d) => /Incorrect password/.test(d)));
  await unlock("a-brand-new-passphrase"); await page.waitForSelector("#quote-screen:not(.hidden)");
  ok("new password works and data intact", await page.evaluate(() => sanctuaryData.journal.some(j => j.title === "Day one")));

  ok("no CSP violations", csp.length === 0, csp.join("\n"));
  ok("no uncaught page errors", errors.length === 0, errors.join("\n"));
  await browser.close(); srv.close();
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
