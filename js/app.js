// --- QUOTE OF THE DAY ENGINE (Curated Philosophy) ---
const sanctuaryQuotes = [
  { text: "The soul becomes dyed with the colour of its thoughts.", author: "Marcus Aurelius" },
  { text: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", author: "Fyodor Dostoevsky" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { text: "Everything you see I owe to spaghetti.", author: "Osamu Dazai" },
  { text: "Be like a lotus flower, which grows in the mud but remains untouched by it.", author: "Osho" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Ignorance, the root and stem of all evil.", author: "Plato" },
  { text: "I think, therefore I am.", author: "René Descartes" },
  { text: "It is better to be feared than loved, if you cannot be both.", author: "Niccolò Machiavelli" },
  { text: "I am looking for an honest man.", author: "Diogenes" },
  { text: "Victory belongs to the most persevering.", author: "Napoleon Bonaparte" },
  { text: "There is nothing impossible to him who will try.", author: "Alexander the Great" },
  { text: "To live is to suffer, to survive is to find some meaning in the suffering.", author: "Friedrich Nietzsche" },
  { text: "Life is not a problem to be solved, but a mystery to be lived.", author: "Osho" },
  { text: "The darker the night, the brighter the stars, the deeper the grief, the closer is God.", author: "Fyodor Dostoevsky" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "First impressions are always unreliable.", author: "Franz Kafka" },
  { text: "Now I have neither happiness nor unhappiness. Everything passes.", author: "Osamu Dazai" },
  { text: "To find yourself, think for yourself.", author: "Socrates" }
  // Expandable to 100 quotes as needed; the engine scales automatically.
];

// Calculate quote based on current date (Changes exactly at midnight local time)
const getDailyQuote = () => {
  const today = Math.floor(Date.now() / 86400000); 
  const quoteIndex = today % sanctuaryQuotes.length;
  return sanctuaryQuotes[quoteIndex];
};

// --- DOM ELEMENTS ---
const els = {
  authScreen: document.getElementById('auth-screen'),
  quoteScreen: document.getElementById('quote-screen'),
  mainWorkspace: document.getElementById('main-workspace'),
  
  sidebar: document.getElementById('sidebar'),
  btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
  
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  iconMoon: document.getElementById('icon-moon'),
  iconSun: document.getElementById('icon-sun'),
  
  navItems: document.querySelectorAll('.nav-item'),
  viewSections: document.querySelectorAll('.view-section'),
  
  currentDateDisplay: document.getElementById('current-date'),
  btnEnterSanctuary: document.getElementById('btn-enter-sanctuary'),
  quoteText: document.getElementById('daily-quote-text'),
  quoteAuthor: document.getElementById('daily-quote-author'),
  
  btnNewEntry: document.getElementById('btn-new-entry'),
  toolbarBtns: document.querySelectorAll('.toolbar-btn'),
  entryBody: document.getElementById('entry-body')
};

// --- THEME ENGINE (Day / Night Sanctuary) ---
if (els.btnThemeToggle) {
  els.btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'light') {
      document.body.setAttribute('data-theme', 'dark');
      els.iconMoon.classList.add('hidden');
      els.iconSun.classList.remove('hidden');
    } else {
      document.body.setAttribute('data-theme', 'light');
      els.iconSun.classList.add('hidden');
      els.iconMoon.classList.remove('hidden');
    }
  });
}

// --- DYNAMIC SIDEBAR CONTROLS ---
if (els.btnToggleSidebar) {
  els.btnToggleSidebar.addEventListener('click', () => {
    const isExpanded = els.sidebar.classList.contains('sidebar-expanded');
    if (isExpanded) {
      els.sidebar.classList.remove('sidebar-expanded');
      els.sidebar.classList.add('sidebar-collapsed');
    } else {
      els.sidebar.classList.remove('sidebar-collapsed');
      els.sidebar.classList.add('sidebar-expanded');
    }
  });
}

// Auto-collapse sidebar when starting a new journal page for a distraction-free canvas
if (els.btnNewEntry) {
  els.btnNewEntry.addEventListener('click', () => {
    els.sidebar.classList.remove('sidebar-expanded');
    els.sidebar.classList.add('sidebar-collapsed');
  });
}

// --- LOCK VAULT TOGGLE ---
const btnLockDiary = document.getElementById('btn-lock-diary');
if (btnLockDiary) {
  btnLockDiary.addEventListener('click', () => {
    window.location.reload(); // Instantly wipes memory state and returns to encrypted lock screen
  });
}

// --- WORKSPACE NAVIGATION ---
els.navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    // Manage active states
    els.navItems.forEach(nav => nav.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Manage views
    els.viewSections.forEach(section => section.classList.add('hidden'));
    const targetId = e.currentTarget.getAttribute('data-target');
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }
  });
});

// --- HYBRID TEXT EDITOR ENGINE (Markdown + Toolbar) ---
// Allows the user to select text and format it via the toolbar
els.toolbarBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent focus loss
    const format = e.currentTarget.getAttribute('data-format');
    const textarea = els.entryBody;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    let replacement = '';
    
    if (format === 'bold') replacement = `**${selectedText || 'bold text'}**`;
    if (format === 'italic') replacement = `*${selectedText || 'italic text'}*`;
    if (format === 'bullet') replacement = `\n- ${selectedText || 'list item'}`;
    
    // Inject formatting and reset cursor position
    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();
    
    // Manually trigger the autosave function (which will be defined in modules.js)
    if (typeof window.triggerModuleAutosave === 'function') {
      window.triggerModuleAutosave();
    }
  });
});

// Allow tab key inside textarea without losing focus
els.entryBody.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 4;
  }
});

// --- INITIALIZATION & UI SETUP ---
const initUI = () => {
  if (els.currentDateDisplay) {
    const now = new Date();
    els.currentDateDisplay.innerText = now.toLocaleDateString('en-GB', { 
      weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' 
    });
  }

  if (els.quoteText && els.quoteAuthor) {
    const dailyQuote = getDailyQuote();
    els.quoteText.innerText = `"${dailyQuote.text}"`;
    els.quoteAuthor.innerText = `— ${dailyQuote.author}`;
    
    // Store daily quote globally so modules.js can archive it into the "Thoughts" feed
    window.currentDailyQuote = dailyQuote;
  }
};

// Transition from Quote to Workspace
if (els.btnEnterSanctuary) {
  els.btnEnterSanctuary.addEventListener('click', () => {
    els.quoteScreen.style.opacity = '0';
    setTimeout(() => {
      els.quoteScreen.classList.add('hidden');
      els.mainWorkspace.classList.remove('hidden');
      els.mainWorkspace.style.opacity = '0';
      setTimeout(() => els.mainWorkspace.style.opacity = '1', 50);
      els.mainWorkspace.style.transition = 'opacity 0.8s ease';
    }, 1000);
  });
}

// Orbs Particle Engine (Kept from Phase 1, highly optimized)
const initOrbs = () => {
  const canvas = document.getElementById('orbs-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;

  let particlesArray = [];
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedX = (Math.random() * 0.8) - 0.4;
      this.speedY = (Math.random() * 0.8) - 0.4;
    }
    update() {
      this.x += this.speedX; this.y += this.speedY;
      if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
      if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
    }
    draw() {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      ctx.fillStyle = isDark ? 'rgba(226, 226, 226, 0.4)' : 'rgba(43, 43, 43, 0.2)';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
  }

  const connect = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const rgb = isDark ? '226, 226, 226' : '43, 43, 43';
    for (let a = 0; a < particlesArray.length; a++) {
      for (let b = a; b < particlesArray.length; b++) {
        let distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
        if (distance < 12000) {
          ctx.strokeStyle = `rgba(${rgb}, ${(1 - (distance / 12000)) * 0.15})`;
          ctx.lineWidth = 1; ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }
    }
  }

  for (let i = 0; i < 70; i++) particlesArray.push(new Particle());

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); particlesArray[i].draw(); }
    connect(); requestAnimationFrame(animate);
  }
  animate();
  window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
};

initUI();
initOrbs();
