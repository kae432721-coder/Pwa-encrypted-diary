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

// --- WYSIWYG RICH TEXT EDITOR ---
els.toolbarBtns.forEach(btn => {
  // We use 'mousedown' so the text editor doesn't lose your highlighted words
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault(); 

    const format = e.currentTarget.getAttribute('data-format');

    // Native browser commands that actually change the font weight/style visually
    if (format === 'bold') document.execCommand('bold', false, null);
    if (format === 'italic') document.execCommand('italic', false, null);
    if (format === 'h2') document.execCommand('formatBlock', false, 'H2');
    if (format === 'bullet') document.execCommand('insertUnorderedList', false, null);

    if (typeof window.triggerModuleAutosave === 'function') window.triggerModuleAutosave();
  });
});



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

// --- DUAL-ENGINE PHOTOREALISTIC WEATHER SYSTEM ---
const initSnowAndWind = () => {
  const canvas = document.getElementById('snow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let dpi = window.devicePixelRatio || 1;
  let logicalWidth = 0;
  let logicalHeight = 0;
  let fallenPetals = []; 

  const resizeCanvas = () => {
    // FIXING THE CUTOUT BUG: Force canvas to break out of container and cover entire screen
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '0'; // Behind your text
    canvas.style.pointerEvents = 'none'; // So you can still click the editor

    dpi = window.devicePixelRatio || 1;
    logicalWidth = window.innerWidth;
    logicalHeight = window.innerHeight;
    
    canvas.width = logicalWidth * dpi;
    canvas.height = logicalHeight * dpi;
    ctx.scale(dpi, dpi);
    
    fallenPetals = []; 
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let particles = [];
  let globalWind = 1.5; 
  let targetWind = 1.5;

  for (let i = 0; i < 1200; i++) { 
    const depth = Math.random() * 100 + 1; 
    particles.push({
      x: Math.random() * logicalWidth, 
      y: Math.random() * logicalHeight,
      depth: depth,
      
      // Blizzard Properties
      snowRadius: (depth / 100) * 0.6 + 0.15, 
      snowMass: (depth / 100) * 2.0 + 1.2, 
      
      // Sakura Properties
      petalSize: (depth / 100) * 4 + 1.5,
      sakuraMass: (depth / 100) * 0.8 + 0.4, 
      angle: Math.random() * Math.PI * 2,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 0.08,
      color: Math.random() > 0.4 ? '255, 183, 197' : '255, 230, 235'
    });
  }

  setInterval(() => {
    targetWind = (Math.random() * 2.5) - 1.25; 
  }, 30000);

  for (let i = 0; i < 300; i++) {
    globalWind += (targetWind - globalWind) * 0.005; 
    particles.forEach(p => {
      p.y += p.snowMass; 
      p.x += globalWind * (p.snowMass * 0.5); 
      if (p.y > logicalHeight) p.y = -10;
      if (p.x > logicalWidth + 50) p.x = -50;
      if (p.x < -50) p.x = logicalWidth + 50;
    });
  }

  const animateWeather = () => {
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    const lightX = logicalWidth * 0.35;
    const lightY = logicalHeight * 0.15;
    const lightRadius = 800; // Wider light throw since the canvas is bigger

    globalWind += (targetWind - globalWind) * 0.001; 

    // --- DARK MODE: PHOTOREALISTIC SNOWFALL ---
    if (isDark) {
      const gradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, lightRadius);
      gradient.addColorStop(0, 'rgba(255, 200, 100, 0.25)'); 
      gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      
      ctx.beginPath();
      ctx.arc(lightX, lightY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 240, 200, 1)';
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(255, 190, 80, 1)';
      ctx.fill();
      ctx.shadowBlur = 0; 

      particles.forEach((flake, index) => {
        // FIXED COLOR ENGINE: Base color is Deep Icy Blue, interpolating to warm yellow
        let r = 162, g = 180, b = 199; 
        let baseOpacity = (flake.depth / 100) * 0.8 + 0.2;

        const dx = flake.x - lightX;
        const dy = flake.y - lightY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < lightRadius) {
          const intensity = 1 - (distance / lightRadius);
          // Interpolate to Warm Streetlamp Amber (255, 220, 120)
          r = Math.min(255, Math.floor(r + (255 - r) * (intensity * 1.5)));
          g = Math.min(255, Math.floor(g + (220 - g) * (intensity * 1.5)));
          b = Math.min(255, Math.floor(b + (120 - b) * (intensity * 1.5)));
          baseOpacity = Math.min(1, baseOpacity + (intensity * 0.8));
        }

        const vx = globalWind * (flake.snowMass * 0.6);
        const vy = flake.snowMass;

        ctx.beginPath();
        ctx.moveTo(flake.x, flake.y);
        ctx.lineTo(flake.x - (vx * 1.2), flake.y - (vy * 1.2));
        
        // FIXED TYPO: Properly injected variables so they render correctly
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${baseOpacity})`;
        
        ctx.lineWidth = flake.snowRadius;
        ctx.lineCap = 'round';
        ctx.stroke();

        flake.y += vy; 
        flake.x += vx; 
        
        if (flake.y > logicalHeight + 10) { flake.y = -10; flake.x = Math.random() * logicalWidth; }
        if (flake.x > logicalWidth + 50) flake.x = -50;
        if (flake.x < -50) flake.x = logicalWidth + 50;
      });
    } 
    // --- LIGHT MODE: ACCUMULATING SAKURA BLOSSOMS ---
    else {
      // The Stationary Virtual Margin (Floor) - Piles up 60px above the bottom of the screen
      const floorY = logicalHeight - 60; 

      fallenPetals.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
        ctx.restore();
      });

      particles.forEach((petal, index) => {
        if (index > 350) return; 

        const baseOpacity = (petal.depth / 100) * 0.7 + 0.15;
        const vx = (globalWind * petal.sakuraMass * 1.2) + (Math.sin(petal.spin) * 0.5);
        const vy = petal.sakuraMass;

        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.angle);
        ctx.scale(Math.sin(petal.spin), 1); 
        
        ctx.beginPath();
        ctx.ellipse(0, 0, petal.petalSize, petal.petalSize / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${petal.color}, ${baseOpacity})`;
        ctx.fill();
        ctx.restore();

        petal.y += vy; 
        petal.x += vx; 
        petal.angle += 0.01;
        petal.spin += petal.spinSpeed;
        
        // Accumulate accurately on the Virtual Margin instead of off-screen
        if (petal.y > floorY - (Math.random() * 40)) { 
          if (fallenPetals.length < 2000) {
            fallenPetals.push({
              x: petal.x, y: petal.y, size: petal.petalSize, angle: petal.angle, color: petal.color, opacity: Math.min(baseOpacity + 0.4, 0.9)
            });
          } else {
            fallenPetals.shift();
            fallenPetals.push({
              x: petal.x, y: petal.y, size: petal.petalSize, angle: petal.angle, color: petal.color, opacity: Math.min(baseOpacity + 0.4, 0.9)
            });
          }
          petal.y = -20; 
          petal.x = Math.random() * logicalWidth; 
        }

        if (petal.x > logicalWidth + 50) petal.x = -50;
        if (petal.x < -50) petal.x = logicalWidth + 50;
      });
    }

    requestAnimationFrame(animateWeather);
  };
  animateWeather();
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
                                    
// --- CODEX AUTO-AGE CALCULATOR ---
const birthdateInput = document.getElementById('person-birthdate');
const ageInput = document.getElementById('person-age');

if (birthdateInput && ageInput) {
  birthdateInput.addEventListener('change', (e) => {
    if (!e.target.value) return; 
    
    const dob = new Date(e.target.value);
    const today = new Date();
    
    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    
    // Adjust age if the birthday hasn't happened yet this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    ageInput.value = age;
  });
}
