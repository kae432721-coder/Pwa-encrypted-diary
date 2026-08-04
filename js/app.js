// --- QUOTE OF THE DAY ENGINE ---
const sanctuaryQuotes = [
  { id: 'q1', text: "The soul becomes dyed with the colour of its thoughts.", author: "Marcus Aurelius" },
  { id: 'q2', text: "It is better to be feared than loved, if you cannot be both.", author: "Niccolò Machiavelli" },
  { id: 'q3', text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { id: 'q4', text: "Everything you see I owe to spaghetti.", author: "Osamu Dazai" },
  { id: 'q5', text: "Be like a lotus flower, which grows in the mud but remains untouched by it.", author: "Osho" },
  { id: 'q6', text: "The unexamined life is not worth living.", author: "Socrates" },
  { id: 'q7', text: "I think, therefore I am.", author: "René Descartes" },
  { id: 'q8', text: "I am looking for an honest man.", author: "Diogenes" },
  { id: 'q9', text: "Victory belongs to the most persevering.", author: "Napoleon Bonaparte" },
  { id: 'q10', text: "There is nothing impossible to him who will try.", author: "Alexander the Great" },
  { id: 'q11', text: "To live is to suffer, to survive is to find some meaning in the suffering.", author: "Friedrich Nietzsche" },
  { id: 'q12', text: "First impressions are always unreliable.", author: "Franz Kafka" },
  { id: 'q13', text: "Now I have neither happiness nor unhappiness. Everything passes.", author: "Osamu Dazai" },
  { id: 'q14', text: "To find yourself, think for yourself.", author: "Socrates" },
  { id: 'q15', text: "Ignorance, the root and stem of all evil.", author: "Plato" },
  { id: 'q16', text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { id: 'q17', text: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", author: "Fyodor Dostoevsky" },
  { id: 'q18', text: "The darker the night, the brighter the stars, the deeper the grief, the closer is God.", author: "Fyodor Dostoevsky" },
  { id: 'q19', text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { id: 'q20', text: "Life is not a problem to be solved, but a mystery to be lived.", author: "Osho" }
];

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
  btnThemeIcon: document.getElementById('btn-theme-toggle-icon'),
  
  navItems: document.querySelectorAll('.nav-item'),
  viewSections: document.querySelectorAll('.view-section'),
  
  currentDateDisplay: document.getElementById('current-date'),
  btnEnterSanctuary: document.getElementById('btn-enter-sanctuary'),
  quoteText: document.getElementById('daily-quote-text'),
  quoteAuthor: document.getElementById('daily-quote-author'),
  btnLikeQuote: document.getElementById('btn-like-quote'),
  
  btnNewEntry: document.getElementById('btn-new-entry'),
  toolbarBtns: document.querySelectorAll('.toolbar-btn'),
  entryBody: document.getElementById('entry-body')
};

// --- THEME ENGINE ---
const toggleTheme = () => {
  const currentTheme = document.body.getAttribute('data-theme');
  document.body.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light');
};

if (els.btnThemeToggle) els.btnThemeToggle.addEventListener('click', toggleTheme);
if (els.btnThemeIcon) els.btnThemeIcon.addEventListener('click', toggleTheme);


// --- FULL WORKSPACE DOUBLE-SLIDE CONTROLS ---
if (els.btnToggleSidebar) {
  els.btnToggleSidebar.addEventListener('click', () => {
    const isExpanded = els.sidebar.classList.contains('sidebar-expanded');
    const journalPanel = document.getElementById('journal-history-panel'); 

    if (isExpanded) {
      els.sidebar.classList.remove('sidebar-expanded');
      els.sidebar.classList.add('sidebar-collapsed');
      if(journalPanel) journalPanel.classList.add('collapsed');
    } else {
      els.sidebar.classList.remove('sidebar-collapsed');
      els.sidebar.classList.add('sidebar-expanded');
      if(journalPanel) journalPanel.classList.remove('collapsed');
    }
  });
}

if (els.btnNewEntry) {
  els.btnNewEntry.addEventListener('click', () => {
    const journalPanel = document.getElementById('journal-history-panel');
    els.sidebar.classList.remove('sidebar-expanded');
    els.sidebar.classList.add('sidebar-collapsed');
    if(journalPanel) journalPanel.classList.add('collapsed');
  });
}

// --- LOCK VAULT TOGGLE ---
const btnLockDiary = document.getElementById('btn-lock-diary');
if (btnLockDiary) {
  btnLockDiary.addEventListener('click', () => { window.location.reload(); });
}

// --- WORKSPACE NAVIGATION ---
els.navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    els.navItems.forEach(nav => nav.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    els.viewSections.forEach(section => section.classList.add('hidden'));
    const targetId = e.currentTarget.getAttribute('data-target');
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.remove('hidden');
  });
});

// --- HYBRID EDITOR & LIVE MARKDOWN ---
els.toolbarBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const format = e.currentTarget.getAttribute('data-format');
    const textarea = els.entryBody;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    let replacement = '';
    
    if (format === 'bold') replacement = `**${selectedText || 'bold text'}**`;
    if (format === 'italic') replacement = `*${selectedText || 'italic text'}*`;
    if (format === 'h2') replacement = `\n## ${selectedText || 'Header'}`;
    if (format === 'bullet') replacement = `\n- ${selectedText || 'list item'}`;
    
    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();
    if (typeof window.triggerModuleAutosave === 'function') window.triggerModuleAutosave();
  });
});

if (els.entryBody) {
  els.entryBody.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 4;
    }
  });
}

// --- QUOTE LIKE BUTTON LOGIC ---
if (els.btnLikeQuote) {
  els.btnLikeQuote.addEventListener('click', () => {
    els.btnLikeQuote.classList.toggle('liked');
    if (els.btnLikeQuote.classList.contains('liked')) {
      els.btnLikeQuote.style.color = '#E06C75';
      els.btnLikeQuote.style.fill = '#E06C75';
    } else {
      els.btnLikeQuote.style.color = 'var(--text-muted)';
      els.btnLikeQuote.style.fill = 'none';
    }
    if (window.currentDailyQuote) {
      window.currentDailyQuote.liked = els.btnLikeQuote.classList.contains('liked');
    }
  });
}

// --- ORBS BACKGROUND ENGINE (Auth Screen) ---
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

// --- ULTRA-REAL SNOW PHYSICS ENGINE ---
const initSnowAndWind = () => {
  const canvas = document.getElementById('snow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const resizeCanvas = () => {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let snowflakes = [];
  let globalWind = 0; 
  let targetWind = 0;

  // Building the volumetric 3D field
  for (let i = 0; i < 200; i++) { 
    const depth = Math.random() * 100 + 1; // Z-axis: 1 (background) to 100 (foreground)
    
    snowflakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      depth: depth,
      // Optics: Closer flakes are larger
      radius: (depth / 100) * 1.8 + 0.4, 
      // Gravity: Closer flakes appear to fall faster (Parallax)
      speedY: (depth / 100) * 1.5 + 0.4, 
      sway: Math.random() * Math.PI * 2, 
      swaySpeed: Math.random() * 0.015 + 0.005 
    });
  }

  // Global weather system: Wind changes gradually and applies to all particles
  setInterval(() => {
    targetWind = (Math.random() * 3) - 1.5; 
  }, 8000);

  const animateSnow = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    // Day mode: Frosted slate-blue for contrast. Night mode: Crisp white.
    ctx.fillStyle = isDark ? '#ffffff' : '#b3c3d4';

    // Smooth transition of the global wind vector
    globalWind += (targetWind - globalWind) * 0.005; 

    snowflakes.forEach(flake => {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      
      // Depth of Field Optics: Closer flakes are more opaque
      const baseOpacity = isDark ? 0.9 : 0.7;
      ctx.globalAlpha = (flake.depth / 100) * baseOpacity + 0.1;
      ctx.fill();

      // Kinematics
      flake.y += flake.speedY;
      flake.sway += flake.swaySpeed;

      // The micro-flutter is restricted to 0.15, meaning the globalWind dictates direction.
      // The wind pushes closer flakes horizontally faster, cementing the 3D parallax effect.
      const microFlutter = Math.sin(flake.sway) * 0.15;
      flake.x += (globalWind * (flake.depth / 50)) + microFlutter; 

      // Infinite volumetric looping
      if (flake.y > canvas.height) {
        flake.y = -10;
        flake.x = Math.random() * canvas.width;
      }
      
      if (flake.x > canvas.width + 10) flake.x = -10;
      if (flake.x < -10) flake.x = canvas.width + 10;
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(animateSnow);
  };
  animateSnow();
};

  
// --- INITIALIZATION ---
const initUI = () => {
  if (els.currentDateDisplay) {
    const now = new Date();
    els.currentDateDisplay.innerText = now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (els.quoteText && els.quoteAuthor) {
    const dailyQuote = getDailyQuote();
    els.quoteText.innerText = `"${dailyQuote.text}"`;
    els.quoteAuthor.innerText = `— ${dailyQuote.author}`;
    window.currentDailyQuote = dailyQuote;
    window.currentDailyQuote.liked = false;
  }
};

if (els.btnEnterSanctuary) {
  els.btnEnterSanctuary.addEventListener('click', () => {
    els.quoteScreen.style.opacity = '0';
    setTimeout(() => {
      els.quoteScreen.classList.add('hidden');
      els.mainWorkspace.classList.remove('hidden');
      els.mainWorkspace.style.opacity = '0';
      setTimeout(() => els.mainWorkspace.style.opacity = '1', 50);
      els.mainWorkspace.style.transition = 'opacity 0.8s ease';
      
      window.dispatchEvent(new Event('resize'));
    }, 1000);
  });
}

initUI();
initOrbs();
initSnowAndWind();
