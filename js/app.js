// --- QUOTE OF THE DAY ENGINE (100 Curated Thoughts) ---
const sanctuaryQuotes = [
  // --- MARCUS AURELIUS (Heavily weighted - Meditations) ---
  { text: "The soul becomes dyed with the colour of its thoughts.", author: "Marcus Aurelius" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "If it is not right do not do it; if it is not true do not say it.", author: "Marcus Aurelius" },
  { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" },
  { text: "Accept the things to which fate binds you, and love the people with whom fate brings you together, but do so with all your heart.", author: "Marcus Aurelius" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { text: "When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.", author: "Marcus Aurelius" },
  { text: "To live a good life: We have the potential for it if we can learn to be indifferent to what makes no difference.", author: "Marcus Aurelius" },
  { text: "Loss is nothing else but change, and change is Nature's delight.", author: "Marcus Aurelius" },
  { text: "How much more grievous are the consequences of anger than the causes of it.", author: "Marcus Aurelius" },
  { text: "Let men see, let them know, a real man, who lives as he was meant to live.", author: "Marcus Aurelius" },
  { text: "Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.", author: "Marcus Aurelius" },
  { text: "Look well into thyself; there is a source of strength which will always spring up if thou wilt always look.", author: "Marcus Aurelius" },
  { text: "He who lives in harmony with himself lives in harmony with the universe.", author: "Marcus Aurelius" },
  { text: "The mind in itself has no needs, except for those it creates itself.", author: "Marcus Aurelius" },
  { text: "Whatever anyone does or says, I must be emerald and keep my colour.", author: "Marcus Aurelius" },
  { text: "Objective judgment, now, at this very moment. Unselfish action, now, at this very moment. Willing acceptance, now, at this very moment.", author: "Marcus Aurelius" },
  { text: "Soon you will have forgotten the world, and soon the world will have forgotten you.", author: "Marcus Aurelius" },
  { text: "A man's worth is no greater than the worth of his ambitions.", author: "Marcus Aurelius" },
  { text: "Do every act of your life as though it were the very last act of your life.", author: "Marcus Aurelius" },
  { text: "Nowhere can man find a quieter or more untroubled retreat than in his own soul.", author: "Marcus Aurelius" },

  // --- FYODOR DOSTOEVSKY ---
  { text: "I have thought too much to stoop to action.", author: "Fyodor Dostoevsky" },
  { text: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", author: "Fyodor Dostoevsky" },
  { text: "The soul is healed by being with children.", author: "Fyodor Dostoevsky" },
  { text: "To love someone means to see them as God intended them.", author: "Fyodor Dostoevsky" },
  { text: "Man is a mystery. It needs to be unravelled, and if you spend your whole life unravelling it, don't say that you've wasted time.", author: "Fyodor Dostoevsky" },
  { text: "It takes something more than intelligence to act intelligently.", author: "Fyodor Dostoevsky" },
  { text: "Nothing in this world is harder than speaking the truth, nothing easier than flattery.", author: "Fyodor Dostoevsky" },
  { text: "Right or wrong, it's very pleasant to break something from time to time.", author: "Fyodor Dostoevsky" },
  { text: "The darker the night, the brighter the stars, the deeper the grief, the closer is God.", author: "Fyodor Dostoevsky" },
  { text: "Don't let us forget that the causes of human actions are usually immeasurably more complex and varied than our subsequent explanations of them.", author: "Fyodor Dostoevsky" },

  // --- FRIEDRICH NIETZSCHE ---
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "And those who were seen dancing were thought to be insane by those who could not hear the music.", author: "Friedrich Nietzsche" },
  { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "Sometimes people don't want to hear the truth because they don't want their illusions destroyed.", author: "Friedrich Nietzsche" },
  { text: "There are no facts, only interpretations.", author: "Friedrich Nietzsche" },
  { text: "The individual has always had to struggle to keep from being overwhelmed by the tribe.", author: "Friedrich Nietzsche" },
  { text: "To live is to suffer, to survive is to find some meaning in the suffering.", author: "Friedrich Nietzsche" },
  { text: "He who fights with monsters should look to it that he himself does not become a monster.", author: "Friedrich Nietzsche" },
  { text: "In heaven, all the interesting people are missing.", author: "Friedrich Nietzsche" },

  // --- FRANZ KAFKA ---
  { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { text: "I am a cage, in search of a bird.", author: "Franz Kafka" },
  { text: "Youth is happy because it has the capacity to see beauty. Anyone who keeps the ability to see beauty never grows old.", author: "Franz Kafka" },
  { text: "Paths are made by walking.", author: "Franz Kafka" },
  { text: "By believing passionately in something that still does not exist, we create it.", author: "Franz Kafka" },
  { text: "Many a book is like a key to unknown chambers within the castle of one's own self.", author: "Franz Kafka" },
  { text: "Slept, awoke, slept, awoke, miserable life.", author: "Franz Kafka" },
  { text: "First impressions are always unreliable.", author: "Franz Kafka" },
  { text: "I have the true feeling of myself only when I am unbearably unhappy.", author: "Franz Kafka" },
  { text: "There is an infinite amount of hope in the universe... but not for us.", author: "Franz Kafka" },

  // --- OSAMU DAZAI ---
  { text: "Everything you see I owe to spaghetti.", author: "Osamu Dazai" },
  { text: "Mine has been a life of much shame. I can't even guess myself what it must be to live the life of a human being.", author: "Osamu Dazai" },
  { text: "As long as I can make them laugh, it doesn't matter how, I'll be alright.", author: "Osamu Dazai" },
  { text: "Is it possible that not a single human being in the world has any inkling of my suffering?", author: "Osamu Dazai" },
  { text: "The weak fear happiness itself. They can harm themselves on cotton wool.", author: "Osamu Dazai" },
  { text: "Now I have neither happiness nor unhappiness. Everything passes.", author: "Osamu Dazai" },
  { text: "Living itself is the source of sin.", author: "Osamu Dazai" },
  { text: "I thought, 'I want to die.' I wanted to die more than ever before.", author: "Osamu Dazai" },

  // --- OSHO ---
  { text: "Be like a lotus flower, which grows in the mud but remains untouched by it.", author: "Osho" },
  { text: "Truth is not something outside to be discovered, it is something inside to be realized.", author: "Osho" },
  { text: "Life is not a problem to be solved, but a mystery to be lived.", author: "Osho" },
  { text: "Experience life in all possible ways -- good-bad, bitter-sweet, dark-light, summer-winter.", author: "Osho" },
  { text: "Sadness gives depth. Happiness gives height. Sadness gives roots. Happiness gives branches.", author: "Osho" },
  { text: "If you love a flower, don’t pick it up. Because if you pick it up it dies and it ceases to be what you love.", author: "Osho" },
  { text: "Creativity is the greatest rebellion in existence.", author: "Osho" },

  // --- SOCRATES ---
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "I know that I am intelligent, because I know that I know nothing.", author: "Socrates" },
  { text: "Beware the barrenness of a busy life.", author: "Socrates" },
  { text: "To find yourself, think for yourself.", author: "Socrates" },
  { text: "He is richest who is content with the least, for content is the wealth of nature.", author: "Socrates" },

  // --- PLATO ---
  { text: "Be kind, for everyone you meet is fighting a harder battle.", author: "Plato" },
  { text: "Wise men speak because they have something to say; Fools because they have to say something.", author: "Plato" },
  { text: "Ignorance, the root and stem of all evil.", author: "Plato" },
  { text: "The greatest wealth is to live content with little.", author: "Plato" },
  { text: "Music is a moral law. It gives soul to the universe, wings to the mind, flight to the imagination.", author: "Plato" },

  // --- RENÉ DESCARTES ---
  { text: "I think, therefore I am.", author: "René Descartes" },
  { text: "Doubt is the origin of wisdom.", author: "René Descartes" },
  { text: "The reading of all good books is like conversation with the finest men of past centuries.", author: "René Descartes" },
  { text: "It is not enough to have a good mind; the main thing is to use it well.", author: "René Descartes" },
  { text: "To know what people really think, pay regard to what they do, rather than what they say.", author: "René Descartes" },

  // --- NICCOLÒ MACHIAVELLI ---
  { text: "It is not titles that honor men, but men that honor titles.", author: "Niccolò Machiavelli" },
  { text: "It is better to be feared than loved, if you cannot be both.", author: "Niccolò Machiavelli" },
  { text: "The first method for estimating the intelligence of a ruler is to look at the men he has around him.", author: "Niccolò Machiavelli" },
  { text: "Never was anything great achieved without danger.", author: "Niccolò Machiavelli" },
  { text: "If an injury has to be done to a man it should be so severe that his vengeance need not be feared.", author: "Niccolò Machiavelli" },

  // --- DIOGENES ---
  { text: "I am looking for an honest man.", author: "Diogenes" },
  { text: "I have nothing to ask but that you would remove to the other side, that you may not, by intercepting the sunshine, take from me what you cannot give.", author: "Diogenes" },
  { text: "Dogs and philosophers do the greatest good and get the fewest rewards.", author: "Diogenes" },
  { text: "He has the most who is most content with the least.", author: "Diogenes" },
  { text: "The foundation of every state is the education of its youth.", author: "Diogenes" },

  // --- NAPOLEON BONAPARTE ---
  { text: "Courage isn't having the strength to go on - it is going on when you don't have strength.", author: "Napoleon Bonaparte" },
  { text: "Victory belongs to the most persevering.", author: "Napoleon Bonaparte" },
  { text: "Death is nothing, but to live defeated and inglorious is to die daily.", author: "Napoleon Bonaparte" },

  // --- ALEXANDER THE GREAT ---
  { text: "There is nothing impossible to him who will try.", author: "Alexander the Great" },
  { text: "I am not afraid of an army of lions led by a sheep; I am afraid of an army of sheep led by a lion.", author: "Alexander the Great" }
];

// Calculate quote based on current date so it changes exactly at midnight
const getDailyQuote = () => {
  const today = Math.floor(Date.now() / 86400000); // Number of days since epoch
  const quoteIndex = today % sanctuaryQuotes.length;
  return sanctuaryQuotes[quoteIndex];
};

// --- DOM ELEMENTS ---
const els = {
  // Screens
  authScreen: document.getElementById('auth-screen'),
  quoteScreen: document.getElementById('quote-screen'),
  mainWorkspace: document.getElementById('main-workspace'),
  
  // Theme Toggle
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  iconMoon: document.getElementById('icon-moon'),
  iconSun: document.getElementById('icon-sun'),
  
  // Navigation
  navItems: document.querySelectorAll('.nav-item'),
  viewSections: document.querySelectorAll('.view-section'),
  
  // Misc UI
  currentDateDisplay: document.getElementById('current-date'),
  btnEnterSanctuary: document.getElementById('btn-enter-sanctuary'),
  quoteText: document.getElementById('daily-quote-text'),
  quoteAuthor: document.getElementById('daily-quote-author')
};

// --- THEME TOGGLE (Day / Night Sanctuary) ---
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

// --- LOCK DIARY TOGGLE ---
const btnLockDiary = document.getElementById('btn-lock-diary');
if (btnLockDiary) {
  btnLockDiary.addEventListener('click', () => {
    // Hide workspace, show auth screen, refresh to ensure a clean state
    window.location.reload();
  });
}

// --- NAVIGATION (Sidebar) ---
els.navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    // Remove active class from all nav items
    els.navItems.forEach(nav => nav.classList.remove('active'));
    // Add active class to clicked item
    e.currentTarget.classList.add('active');
    
    // Hide all views
    els.viewSections.forEach(section => section.classList.add('hidden'));
    
    // Show the targeted view
    const targetId = e.currentTarget.getAttribute('data-target');
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }
  });
});

// --- INITIALIZATION & DATE FORMATTING ---
const initUI = () => {
  // Set Date
  if (els.currentDateDisplay) {
    const now = new Date();
    els.currentDateDisplay.innerText = now.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Set Quote
  if (els.quoteText && els.quoteAuthor) {
    const dailyQuote = getDailyQuote();
    els.quoteText.innerText = `"${dailyQuote.text}"`;
    els.quoteAuthor.innerText = `— ${dailyQuote.author}`;
  }
};

// Transition from Quote Screen to Main Workspace
if (els.btnEnterSanctuary) {
  els.btnEnterSanctuary.addEventListener('click', () => {
    els.quoteScreen.style.opacity = '0';
    setTimeout(() => {
      els.quoteScreen.classList.add('hidden');
      els.mainWorkspace.classList.remove('hidden');
      // Slight fade-in effect for the workspace
      els.mainWorkspace.style.opacity = '0';
      setTimeout(() => els.mainWorkspace.style.opacity = '1', 50);
      els.mainWorkspace.style.transition = 'opacity 1s ease';
    }, 1000);
  });
}

// Run UI setup on load
initUI();
// --- ORBS CONNECTION ANIMATION ---
const initOrbs = () => {
  const canvas = document.getElementById('orbs-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particlesArray = [];
  const numberOfParticles = 80;

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedX = (Math.random() * 1) - 0.5;
      this.speedY = (Math.random() * 1) - 0.5;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
      if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
    }
    draw() {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      ctx.fillStyle = isDark ? 'rgba(228, 224, 217, 0.8)' : 'rgba(74, 63, 53, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const connect = () => {
    let opacityValue = 1;
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const rgb = isDark ? '228, 224, 217' : '74, 63, 53';

    for (let a = 0; a < particlesArray.length; a++) {
      for (let b = a; b < particlesArray.length; b++) {
        let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                     + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
        if (distance < 15000) {
          opacityValue = 1 - (distance / 15000);
          ctx.strokeStyle = `rgba(${rgb}, ${opacityValue * 0.2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }
    }
  }

  for (let i = 0; i < numberOfParticles; i++) {
    particlesArray.push(new Particle());
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
    connect();
    requestAnimationFrame(animate);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
};

initOrbs();
