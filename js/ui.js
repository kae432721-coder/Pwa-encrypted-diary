// --- UI LAYER: living background, sidebar (rail / drawer), pages sheet, sync status ---
// Loaded after app.js. No user data is touched here; everything is built with DOM APIs.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const mqMobile = window.matchMedia('(max-width: 899.98px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  const svg = (paths, cls) => {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', cls || 'nav-icon');
    s.setAttribute('aria-hidden', 'true');
    for (const d of paths) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p); }
    return s;
  };
  const ICONS = {
    'view-journal': ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
    'view-people': ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    'view-lists': ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
    'view-thoughts': ['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'],
    'view-settings': ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6']
  };
  const PAGES_ICON = ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'];
  const MOON = ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'];

  // ======================================================================
  // 1. ATMOSPHERE: colour follows the real time of day, plus mist and light motes
  // ======================================================================
  const SKY = {
    light: [[0, '#e9e8f0', '#f3f0f4'], [5, '#efe6ea', '#f8efe8'], [7.5, '#fbeee4', '#fdf6ee'], [11, '#f7f7f5', '#fbfaf7'],
            [15.5, '#f6f5f0', '#faf6ee'], [18.2, '#f9ead7', '#f6e3d6'], [20.5, '#ede6ee', '#f1e9ee'], [24, '#e9e8f0', '#f3f0f4']],
    dark:  [[0, '#07080c', '#0d0e14'], [5, '#0a0c13', '#13131b'], [7.5, '#15121a', '#1c191e'], [11, '#0e0f11', '#151517'],
            [15.5, '#0e0f11', '#151517'], [18.2, '#17130f', '#1f1713'], [20.5, '#110e16', '#18121b'], [24, '#07080c', '#0d0e14']]
  };
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lerp = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const skyFor = (theme, now) => {
    const stops = SKY[theme];
    const h = now.getHours() + now.getMinutes() / 60;
    for (let i = 0; i < stops.length - 1; i++) {
      const [h0, t0, b0] = stops[i], [h1, t1, b1] = stops[i + 1];
      if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0); return [lerp(t0, t1, t), lerp(b0, b1, t)]; }
    }
    return [stops[0][1], stops[0][2]];
  };

  const atmosphere = document.createElement('div');
  atmosphere.id = 'atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  const far = document.createElement('div'); far.className = 'atm-layer atm-far';
  const near = document.createElement('div'); near.className = 'atm-layer atm-near';
  for (const c of ['a', 'b']) { const m = document.createElement('i'); m.className = 'mist ' + c; far.append(m); }
  if (!reduced) {
    const count = mqMobile.matches ? 9 : 16;
    for (let i = 0; i < count; i++) {
      const m = document.createElement('i');
      m.className = 'mote';
      const size = 8 + Math.random() * 20, d = 16 + Math.random() * 18;
      const st = m.style;
      st.left = (Math.random() * 100).toFixed(1) + '%';
      st.top = (30 + Math.random() * 75).toFixed(1) + '%';
      st.width = st.height = size.toFixed(1) + 'px';
      st.setProperty('--d', d.toFixed(1) + 's');
      st.setProperty('--delay', (-Math.random() * d).toFixed(1) + 's');
      st.setProperty('--o', (0.22 + Math.random() * 0.34).toFixed(2));
      st.setProperty('--dx', (Math.random() * 90 - 45).toFixed(0) + 'px');
      st.setProperty('--dy', (-50 - Math.random() * 110).toFixed(0) + 'px');
      near.append(m);
    }
  }
  atmosphere.append(far, near);
  document.body.prepend(atmosphere);

  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) { themeMeta = document.createElement('meta'); themeMeta.name = 'theme-color'; document.head.append(themeMeta); }
  const applyAtmosphere = () => {
    const theme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const [top, bottom] = skyFor(theme, new Date());
    document.documentElement.style.setProperty('--sky-top', top);
    document.documentElement.style.setProperty('--sky-bottom', bottom);
    themeMeta.setAttribute('content', top);          // browser chrome blends with the page
  };
  applyAtmosphere();
  setInterval(applyAtmosphere, 5 * 60 * 1000);
  new MutationObserver(applyAtmosphere).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {   // gentle desktop parallax
    let raf = 0, nx = 0, ny = 0;
    window.addEventListener('pointermove', (e) => {
      nx = (e.clientX / window.innerWidth - 0.5) * 2; ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        atmosphere.style.setProperty('--px', nx.toFixed(3));
        atmosphere.style.setProperty('--py', ny.toFixed(3));
      });
    }, { passive: true });
  }

  // ======================================================================
  // 2. SIDEBAR: icons, rail (desktop), drawer (phone), swipe, a11y
  // ======================================================================
  const sidebar = $('#sidebar');
  const toggleBtn = $('#btn-toggle-sidebar');
  const workspace = $('#main-workspace');
  if (!sidebar || !toggleBtn) return;

  const header = $('.sidebar-header');
  if (header) { const mark = svg(MOON, 'brand-mark'); header.prepend(mark); }

  const navItems = [...document.querySelectorAll('.nav-item')];
  for (const item of navItems) {
    const target = item.getAttribute('data-target');
    const label = (item.textContent || '').trim();
    if (ICONS[target]) item.prepend(svg(ICONS[target]));
    item.setAttribute('title', label);
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    if (target === 'view-settings') { item.removeAttribute('style'); item.classList.add('nav-push'); }
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
    item.addEventListener('click', () => {
      navItems.forEach((n) => n.removeAttribute('aria-current'));
      item.setAttribute('aria-current', 'page');
      if (mqMobile.matches) setNavOpen(false);
    });
  }
  const activeNav = navItems.find((n) => n.classList.contains('active'));
  if (activeNav) activeNav.setAttribute('aria-current', 'page');
  for (const b of document.querySelectorAll('.icon-btn[title]')) b.setAttribute('aria-label', b.getAttribute('title'));

  // scrim (phone only; CSS hides it on desktop)
  const scrim = document.createElement('div');
  scrim.id = 'scrim';
  document.body.append(scrim);

  const pagesPanel = $('#journal-history-panel');
  const isNavOpen = () => document.body.classList.contains('nav-open');
  const isSheetOpen = () => document.body.classList.contains('sheet-open');

  function syncInert() {
    sidebar.inert = mqMobile.matches && !isNavOpen();
    if (pagesPanel) pagesPanel.inert = mqMobile.matches && !isSheetOpen();
  }
  function setNavOpen(open) {
    document.body.classList.toggle('nav-open', open);
    if (open) setSheetOpen(false);
    toggleBtn.setAttribute('aria-expanded', String(open));
    syncInert();
  }
  function setSheetOpen(open) {
    if (!pagesPanel) return;
    document.body.classList.toggle('sheet-open', open);
    pagesPanel.classList.toggle('open', open);
    syncInert();
  }
  function setRail(collapsed) {
    sidebar.classList.toggle('sidebar-collapsed', collapsed);
    sidebar.classList.toggle('sidebar-expanded', !collapsed);
    toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    store.set('sanctuaryRail', collapsed ? '1' : '0');
  }

  toggleBtn.setAttribute('aria-controls', 'sidebar');
  toggleBtn.addEventListener('click', () => {
    if (mqMobile.matches) setNavOpen(!isNavOpen());
    else setRail(!sidebar.classList.contains('sidebar-collapsed'));
  });
  scrim.addEventListener('click', () => { setNavOpen(false); setSheetOpen(false); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setNavOpen(false); setSheetOpen(false); } });

  // swipe: from the left edge to open, left anywhere to close
  let sx = 0, sy = 0, tracking = false;
  window.addEventListener('touchstart', (e) => {
    if (!mqMobile.matches || !workspace || workspace.classList.contains('hidden')) return;
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    tracking = isNavOpen() || sx < 22;
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0 && !isNavOpen()) setNavOpen(true);
    else if (dx < 0 && isNavOpen()) setNavOpen(false);
  }, { passive: true });

  const applyMode = () => {
    document.body.classList.remove('nav-open', 'sheet-open');
    if (pagesPanel) pagesPanel.classList.remove('open');
    if (mqMobile.matches) {
      sidebar.classList.remove('sidebar-collapsed'); sidebar.classList.add('sidebar-expanded');
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      setRail(store.get('sanctuaryRail') === '1');
      if (pagesPanel) pagesPanel.classList.toggle('collapsed', store.get('sanctuaryPages') === '0');
    }
    syncInert();
  };
  (mqMobile.addEventListener ? mqMobile.addEventListener.bind(mqMobile, 'change') : mqMobile.addListener.bind(mqMobile))(applyMode);

  // ======================================================================
  // 3. JOURNAL PAGES PANEL: its own toggle (decoupled from the nav)
  // ======================================================================
  const toolbar = $('.editor-toolbar');
  if (toolbar && pagesPanel) {
    const pb = document.createElement('button');
    pb.type = 'button'; pb.id = 'btn-toggle-pages'; pb.className = 'toolbar-btn';
    pb.title = 'Show or hide your pages';
    pb.append(svg(PAGES_ICON), document.createTextNode('Pages'));
    const div = document.createElement('div'); div.className = 'toolbar-divider';
    toolbar.prepend(pb, div);
    pb.addEventListener('click', () => {
      if (mqMobile.matches) { setSheetOpen(!isSheetOpen()); return; }
      const hide = !pagesPanel.classList.contains('collapsed');
      pagesPanel.classList.toggle('collapsed', hide);
      store.set('sanctuaryPages', hide ? '0' : '1');
    });
  }
  window.addEventListener('journalEntryChosen', () => { if (mqMobile.matches) setSheetOpen(false); });
  const newBtn = $('#btn-new-entry');
  if (newBtn) newBtn.addEventListener('click', () => { if (mqMobile.matches) setSheetOpen(false); });

  // ======================================================================
  // 4. SYNC STATUS: sidebar footer + editor toolbar mirror the cloud indicator
  // ======================================================================
  const footer = document.createElement('div');
  footer.className = 'sidebar-footer';
  const dot = document.createElement('span'); dot.className = 'sync-dot';
  const lbl = document.createElement('span'); lbl.className = 'sync-label'; lbl.textContent = 'Locked';
  footer.append(dot, lbl);
  sidebar.append(footer);

  const indicator = $('#cloud-indicator');
  const toolbarStatus = $('.toolbar-status');
  const renderStatus = () => {
    const t = (indicator ? indicator.textContent : '').toLowerCase();
    let state = 'idle', side = 'Offline', tool = 'Rich text';
    if (t.includes('synced')) { state = 'ok'; side = 'Saved to Drive'; tool = 'Saved'; }
    else if (t.includes('syncing')) { state = 'busy'; side = 'Saving…'; tool = 'Saving…'; }
    else if (t.includes('reconnect')) { state = 'err'; side = 'Reconnect needed'; tool = 'Reconnect needed'; }
    else if (t.includes('fail') || t.includes('retry') || t.includes('changed')) { state = 'err'; side = 'Not saved, retrying'; tool = 'Not saved yet'; }
    dot.className = 'sync-dot ' + state;
    lbl.textContent = side;
    if (toolbarStatus) toolbarStatus.textContent = tool;
  };
  if (indicator) new MutationObserver(renderStatus).observe(indicator, { childList: true, characterData: true, subtree: true });
  renderStatus();

  applyMode();
})();
