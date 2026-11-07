// Sidebar / sheet behaviour in headless Chromium.  node tests/ui.cjs <site-dir>
const http=require("http"),fs=require("fs"),path=require("path");const {chromium}=require("playwright");const assert=require("assert");
const root=path.resolve(process.argv[2]||".");const MIME={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png"};
const srv=http.createServer((q,r)=>{let p=path.join(root,q.url.split("?")[0]);if(p.endsWith("/"))p+="index.html";fs.readFile(p,(e,d)=>e?(r.writeHead(404),r.end()):(r.writeHead(200,{"content-type":MIME[path.extname(p)]||"text/plain"}),r.end(d)))});
let pass=0,fail=0;const ok=(n,c,x="")=>{c?pass++:fail++;console.log((c?"ok   ":"FAIL ")+n+(c?"":"  "+x))};
async function open(b,w,h,mobile){const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:!!mobile,hasTouch:!!mobile,serviceWorkers:"block"});
  await ctx.route("https://accounts.google.com/gsi/client",r=>r.fulfill({contentType:"text/javascript",body:"window.google={accounts:{oauth2:{initTokenClient:()=>({requestAccessToken(){}})}}};"}));
  await ctx.route("https://fonts.googleapis.com/**",r=>r.fulfill({status:200,contentType:"text/css",body:""}));
  await ctx.route("https://www.googleapis.com/**",r=>r.fulfill({status:200,body:"{}"}));
  const p=await ctx.newPage();await p.goto("http://localhost:8128/");await p.waitForTimeout(300);
  await p.evaluate(()=>{document.getElementById('auth-screen').classList.add('hidden');document.getElementById('quote-screen').classList.add('hidden');document.getElementById('main-workspace').classList.remove('hidden');
    sanctuaryData.journal.push({id:'J1',title:'T',content:'c',timestamp:new Date().toISOString()});window.dispatchEvent(new Event('cloudDataLoaded'));});
  await p.waitForTimeout(300);return {ctx,p};}
const box=(p,s)=>p.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,w:r.width,r:r.right}},s);
(async()=>{await new Promise(r=>srv.listen(8128,r));const b=await chromium.launch();
  // ---------- desktop ----------
  let {ctx,p}=await open(b,1280,800,false);
  let w1=(await box(p,'#sidebar')).w; ok("desktop: sidebar expanded by default (~272px)",Math.abs(w1-272)<2,w1);
  const tb=await box(p,'#btn-toggle-sidebar'); ok("desktop: toggle button no longer overlaps the sidebar title",tb.x>w1-1,`btn x=${tb.x} sidebar w=${w1}`);
  await p.click('#btn-toggle-sidebar');await p.waitForTimeout(600);
  let w2=(await box(p,'#sidebar')).w; ok("desktop: collapses to an icon rail (not to 0)",Math.abs(w2-76)<2,w2);
  ok("desktop: rail hides labels",await p.evaluate(()=>getComputedStyle(document.querySelector('.nav-text')).opacity==='0'));
  const ca=await box(p,'#content-area'); ok("desktop: content area grows into the freed space",ca.x<100,ca.x);
  await p.reload();await p.waitForTimeout(400);
  await p.evaluate(()=>{document.getElementById('main-workspace').classList.remove('hidden');document.getElementById('auth-screen').classList.add('hidden')});
  await p.waitForTimeout(500);
  ok("desktop: rail state survives reload",Math.abs((await box(p,'#sidebar')).w-76)<2 && await p.evaluate(()=>document.getElementById('sidebar').classList.contains('sidebar-collapsed')));
  await p.click('#btn-toggle-pages');await p.waitForTimeout(600);
  ok("desktop: pages panel toggles independently of the nav",(await box(p,'#journal-history-panel')).w<2 && Math.abs((await box(p,'#sidebar')).w-76)<2);
  await ctx.close();
  // ---------- phone ----------
  ({ctx,p}=await open(b,390,844,true));
  ok("phone: drawer closed by default",(await box(p,'#sidebar')).r<=1 || await p.evaluate(()=>getComputedStyle(document.getElementById('sidebar')).visibility==='hidden'));
  ok("phone: content uses the full width (old build squeezed it to ~100px)",(await box(p,'#content-area')).w>=388);
  await p.tap('#btn-toggle-sidebar');await p.waitForTimeout(600);
  ok("phone: drawer opens",await p.evaluate(()=>document.body.classList.contains('nav-open')) && (await box(p,'#sidebar')).x>=-1);
  ok("phone: drawer is aria-expanded + not inert",await p.evaluate(()=>document.getElementById('btn-toggle-sidebar').getAttribute('aria-expanded')==='true' && !document.getElementById('sidebar').inert));
  await p.keyboard.press('Escape');await p.waitForTimeout(500);ok("phone: Escape closes drawer",await p.evaluate(()=>!document.body.classList.contains('nav-open')));
  await p.tap('#btn-toggle-sidebar');await p.waitForTimeout(500);await p.tap('#scrim',{position:{x:370,y:400}});await p.waitForTimeout(500);
  ok("phone: tapping the scrim closes drawer",await p.evaluate(()=>!document.body.classList.contains('nav-open')));
  await p.tap('#btn-toggle-sidebar');await p.waitForTimeout(500);
  await p.evaluate(()=>document.querySelector('.nav-item[data-target="view-lists"]').click());await p.waitForTimeout(500);
  ok("phone: choosing a section closes the drawer and shows it",await p.evaluate(()=>!document.body.classList.contains('nav-open') && !document.getElementById('view-lists').classList.contains('hidden')));
  await p.evaluate(()=>document.querySelector('.nav-item[data-target="view-journal"]').click());await p.waitForTimeout(300);
  await p.tap('#btn-toggle-pages');await p.waitForTimeout(600);
  ok("phone: pages sheet opens",await p.evaluate(()=>document.body.classList.contains('sheet-open')));
  const top=await p.evaluate(()=>document.elementFromPoint(195,700).closest('#journal-history-panel')!==null);
  ok("phone: sheet sits ABOVE the scrim (not dimmed by it)",top);
  await p.evaluate(()=>document.querySelector('.history-item').click());await p.waitForTimeout(500);
  ok("phone: choosing a page closes the sheet",await p.evaluate(()=>!document.body.classList.contains('sheet-open')));
  // swipe from left edge opens drawer
  await p.evaluate(()=>{const f=(t,x,y)=>{const to=new Touch({identifier:1,target:document.body,clientX:x,clientY:y});window.dispatchEvent(new TouchEvent(t,{touches:t==='touchend'?[]:[to],changedTouches:[to],bubbles:true}))};f('touchstart',8,400);f('touchend',140,410)});
  await p.waitForTimeout(500);ok("phone: swipe from the left edge opens the drawer",await p.evaluate(()=>document.body.classList.contains('nav-open')));
  ok("phone: no horizontal page scroll",await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await ctx.close();await b.close();srv.close();console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(2)});
