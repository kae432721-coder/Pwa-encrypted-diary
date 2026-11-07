// Sidebar / sheet behaviour in headless Chromium.  node tests/ui.cjs <site-dir>
const path=require("path");const {chromium}=require("playwright");const assert=require("assert");
const {createStaticServer,listen}=require("./static-server.cjs");
const root=path.resolve(process.argv[2]||".");
const srv=createStaticServer(root);
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
(async()=>{await listen(srv,8128);const b=await chromium.launch();
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
  // mid-width (1280): pages list is a closed flyout, editor gets the room
  const vis=()=>p.evaluate(()=>getComputedStyle(document.getElementById('journal-history-panel')).visibility);
  ok("1280px: pages list is closed by default (editor gets the full width)",await vis()==='hidden');
  const ed=await box(p,'.journal-editor-container'); ok("1280px: editor is wide (>=700px)",ed.w>=700,ed.w);
  await p.click('#btn-toggle-pages');await p.waitForTimeout(500);
  ok("1280px: Pages button opens the flyout",await vis()==='visible');
  ok("1280px: flyout overlays the editor instead of pushing it",Math.abs((await box(p,'.journal-editor-container')).w-ed.w)<2);
  ok("1280px: flyout is not dimmed by a scrim",await p.evaluate(()=>document.elementFromPoint(150,260).closest('#journal-history-panel')!==null));
  await p.mouse.click(900,600);await p.waitForTimeout(450);ok("1280px: clicking outside closes the flyout",await vis()==='hidden');
  await p.click('#btn-toggle-pages');await p.waitForTimeout(400);await p.keyboard.press('Escape');await p.waitForTimeout(400);ok("1280px: Escape closes the flyout",await vis()==='hidden');
  await p.evaluate(()=>{sanctuaryData.journal.push({id:'J9',title:'Seed',content:'c',timestamp:new Date().toISOString()});window.dispatchEvent(new Event('vaultMerged'))});
  await p.click('#btn-toggle-pages');await p.waitForTimeout(400);await p.click('.history-item');await p.waitForTimeout(450);ok("1280px: choosing a page closes the flyout",await vis()==='hidden');
  const n0=await p.evaluate(()=>sanctuaryData.journal.length);
  await p.click('#btn-quick-new');await p.fill('#entry-title','quick');await p.waitForTimeout(300);
  ok("1280px: one-tap New button starts a page without opening the flyout",await p.evaluate(()=>sanctuaryData.journal.length)===n0+1 && await vis()==='hidden');
  await ctx.close();
  // wide (1600): docked panel, collapsible, remembered
  ({ctx,p}=await open(b,1600,900,false));
  const vis2=()=>p.evaluate(()=>document.getElementById('journal-history-panel').getBoundingClientRect().width);
  ok("1600px: pages list is docked by default",await vis2()>200,await vis2());
  ok("1600px: quick-New button hidden when the list is docked",await p.evaluate(()=>getComputedStyle(document.getElementById('btn-quick-new')).display==='none'));
  await p.click('#btn-toggle-pages');await p.waitForTimeout(600);ok("1600px: Pages button collapses the docked panel",await vis2()<2,await vis2());
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
