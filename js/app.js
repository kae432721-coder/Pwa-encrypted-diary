// --- QUOTE OF THE DAY ENGINE ---
const sanctuaryQuotes = [
  { id: 'q1', text: "The soul becomes dyed with the colour of its thoughts.", author: "Marcus Aurelius" },
    // THE LITERARY STRAY DOGS
  { id: 'q1', text: "Mine has been a life of much shame.", author: "Osamu Dazai" },
  { id: 'q2', text: "Now I have neither happiness nor unhappiness. Everything passes.", author: "Osamu Dazai" },
  { id: 'q3', text: "The weak fear happiness itself. They can harm themselves on cotton wool.", author: "Osamu Dazai" },
  { id: 'q4', text: "Cowardice is catching.", author: "Osamu Dazai" },
  { id: 'q5', text: "Everything you see I owe to spaghetti.", author: "Osamu Dazai" },
  { id: 'q6', text: "Stop pitying yourself. Pity yourself, and life becomes an endless nightmare.", author: "Osamu Dazai" },
  { id: 'q7', text: "A good book is always good, no matter how many times you've already read it.", author: "Osamu Dazai" },
  { id: 'q8', text: "People need to be told they're worthy of being alive by someone else or they can't go on.", author: "Atsushi Nakajima" },
  { id: 'q9', text: "Fear is a good thing. It means you are not ready to die.", author: "Ryunosuke Akutagawa" },
  { id: 'q10', text: "I have no choice but to write.", author: "Ryunosuke Akutagawa" },
  { id: 'q11', text: "Human life is like dew, like a flash of lightning.", author: "Ryunosuke Akutagawa" },
  { id: 'q12', text: "To know the sorrow of life is to know its beauty.", author: "Soseki Natsume" },
  
  // ABSURDISM & KAFKA
  { id: 'q13', text: "I am free, that is why I am lost.", author: "Franz Kafka" },
  { id: 'q14', text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { id: 'q15', text: "First impressions are always unreliable.", author: "Franz Kafka" },
  { id: 'q16', text: "There is an infinite amount of hope in the universe... but not for us.", author: "Franz Kafka" },
  { id: 'q17', text: "I write differently from what I speak, I speak differently from what I think...", author: "Franz Kafka" },
  { id: 'q18', text: "By believing passionately in something that still does not exist, we create it.", author: "Franz Kafka" },
  { id: 'q19', text: "Youth is happy because it has the capacity to see beauty.", author: "Franz Kafka" },
  { id: 'q20', text: "Paths are made by walking.", author: "Franz Kafka" },

  // NIETZSCHE & THE OVERMAN
  { id: 'q21', text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { id: 'q22', text: "To live is to suffer, to survive is to find some meaning in the suffering.", author: "Friedrich Nietzsche" },
  { id: 'q23', text: "And those who were seen dancing were thought to be insane by those who could not hear the music.", author: "Friedrich Nietzsche" },
  { id: 'q24', text: "Sometimes people don't want to hear the truth because they don't want their illusions destroyed.", author: "Friedrich Nietzsche" },
  { id: 'q25', text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { id: 'q26', text: "The snake which cannot cast its skin has to die.", author: "Friedrich Nietzsche" },
  { id: 'q27', text: "There are no facts, only interpretations.", author: "Friedrich Nietzsche" },
  { id: 'q28', text: "No one can construct for you the bridge upon which precisely you must cross the stream of life, no one but you yourself alone.", author: "Friedrich Nietzsche" },
  { id: 'q29', text: "One must still have chaos in oneself to be able to give birth to a dancing star.", author: "Friedrich Nietzsche" },
  { id: 'q30', text: "Whoever fights monsters should see to it that in the process he does not become a monster.", author: "Friedrich Nietzsche" },

  // DOSTOEVSKY & THE HUMAN CONDITION
  { id: 'q31', text: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", author: "Fyodor Dostoevsky" },
  { id: 'q32', text: "The darker the night, the brighter the stars, the deeper the grief, the closer is God.", author: "Fyodor Dostoevsky" },
  { id: 'q33', text: "To go wrong in one's own way is better than to go right in someone else's.", author: "Fyodor Dostoevsky" },
  { id: 'q34', text: "It takes something more than intelligence to act intelligently.", author: "Fyodor Dostoevsky" },
  { id: 'q35', text: "The mystery of human existence lies not in just staying alive, but in finding something to live for.", author: "Fyodor Dostoevsky" },
  { id: 'q36', text: "Above all, don't lie to yourself.", author: "Fyodor Dostoevsky" },
  { id: 'q37', text: "What is hell? I maintain that it is the suffering of being unable to love.", author: "Fyodor Dostoevsky" },
  { id: 'q38', text: "A hundred suspicions don't make a proof.", author: "Fyodor Dostoevsky" },
  { id: 'q39', text: "Nothing in this world is harder than speaking the truth, nothing easier than flattery.", author: "Fyodor Dostoevsky" },
  { id: 'q40', text: "I love mankind, he said, but I find to my amazement that the more I love mankind as a whole, the less I love man in particular.", author: "Fyodor Dostoevsky" },

  // EXISTENTIAL REBELLION
  { id: 'q41', text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.", author: "Jean-Paul Sartre" },
  { id: 'q42', text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus" },
  { id: 'q43', text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus" },
  { id: 'q44', text: "Nobody realizes that some people expend tremendous energy merely to be normal.", author: "Albert Camus" },
  { id: 'q45', text: "We must imagine Sisyphus happy.", author: "Albert Camus" },
  { id: 'q46', text: "Hell is other people.", author: "Jean-Paul Sartre" },
  { id: 'q47', text: "Freedom is what you do with what's been done to you.", author: "Jean-Paul Sartre" },
  { id: 'q48', text: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard" },
  { id: 'q49', text: "Life can only be understood backwards; but it must be lived forwards.", author: "Søren Kierkegaard" },
  { id: 'q50', text: "Man is the only creature who refuses to be what he is.", author: "Albert Camus" },
  { id: 'q51', text: "Every existing thing is born without reason, prolongs itself out of weakness, and dies by chance.", author: "Jean-Paul Sartre" },
  { id: 'q52', text: "Life is meaningless, but worth living, provided you recognize it's meaningless.", author: "Albert Camus" },
  { id: 'q53', text: "If you are lonely when you're alone, you are in bad company.", author: "Jean-Paul Sartre" },
  { id: 'q54', text: "To dare is to lose one's footing momentarily. Not to dare is to lose oneself.", author: "Søren Kierkegaard" },
  { id: 'q55', text: "The highest and most beautiful things in life are not to be heard about, nor read about, nor seen but, if one will, are to be lived.", author: "Søren Kierkegaard" },

  // STOICISM 
  { id: 'q56', text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { id: 'q57', text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { id: 'q58', text: "We suffer more often in imagination than in reality.", author: "Lucius Annaeus Seneca" },
  { id: 'q59', text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Lucius Annaeus Seneca" },
  { id: 'q60', text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" },
  { id: 'q61', text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { id: 'q62', text: "Luck is what happens when preparation meets opportunity.", author: "Lucius Annaeus Seneca" },
  { id: 'q63', text: "If a man knows not to which port he sails, no wind is favorable.", author: "Lucius Annaeus Seneca" },
  { id: 'q64', text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { id: 'q65', text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { id: 'q66', text: "No man is free who is not master of himself.", author: "Epictetus" },
  { id: 'q67', text: "He who fears death will never do anything worth of a man who is alive.", author: "Lucius Annaeus Seneca" },
  { id: 'q68', text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { id: 'q69', text: "It is not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { id: 'q70', text: "How much more grievous are the consequences of anger than the causes of it.", author: "Marcus Aurelius" },

  // THE INNER SHADOW
  { id: 'q71', text: "Compassion is the basis of morality.", author: "Arthur Schopenhauer" },
  { id: 'q72', text: "Talent hits a target no one else can hit; Genius hits a target no one else can see.", author: "Arthur Schopenhauer" },
  { id: 'q73', text: "A man can do what he wants, but not want what he wants.", author: "Arthur Schopenhauer" },
  { id: 'q74', text: "Every man takes the limits of his own field of vision for the limits of the world.", author: "Arthur Schopenhauer" },
  { id: 'q75', text: "Who looks outside, dreams; who looks inside, awakes.", author: "Carl Jung" },
  { id: 'q76', text: "Knowing your own darkness is the best method for dealing with the darknesses of other people.", author: "Carl Jung" },
  { id: 'q77', text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung" },
  { id: 'q78', text: "The pendulum of the mind oscillates between sense and nonsense, not between right and wrong.", author: "Carl Jung" },
  { id: 'q79', text: "Some of us think holding on makes us strong, but sometimes it is letting go.", author: "Hermann Hesse" },
  { id: 'q80', text: "Words do not express thoughts very well.", author: "Hermann Hesse" },
  { id: 'q81', text: "If you hate a person, you hate something in him that is part of yourself.", author: "Hermann Hesse" },
  { id: 'q82', text: "Knowledge can be communicated, but not wisdom.", author: "Hermann Hesse" },

  // THE ANCIENTS
  { id: 'q83', text: "I am looking for an honest man.", author: "Diogenes" },
  { id: 'q84', text: "Dogs and philosophers do the greatest good and get the fewest rewards.", author: "Diogenes" },
  { id: 'q85', text: "I know that I know nothing.", author: "Socrates" },
  { id: 'q86', text: "The unexamined life is not worth living.", author: "Socrates" },
  { id: 'q87', text: "To find yourself, think for yourself.", author: "Socrates" },
  { id: 'q88', text: "Ignorance, the root and stem of all evil.", author: "Plato" },
  { id: 'q89', text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { id: 'q90', text: "The root of suffering is attachment.", author: "Buddha" },
  { id: 'q91', text: "The mind is everything. What you think you become.", author: "Buddha" },
  { id: 'q92', text: "There is only one good, knowledge, and one evil, ignorance.", author: "Socrates" },
  { id: 'q93', text: "He has the most who is most content with the least.", author: "Diogenes" },
  { id: 'q94', text: "Wise men speak because they have something to say; Fools because they have to say something.", author: "Plato" },
  { id: 'q95', text: "He who is not a good servant will not be a good master.", author: "Plato" },

  // CLASSIC LITERATURE & PROSE
  { id: 'q96', text: "Courage is grace under pressure.", author: "Ernest Hemingway" },
  { id: 'q97', text: "The world breaks everyone, and afterward, some are strong at the broken places.", author: "Ernest Hemingway" },
  { id: 'q98', text: "There is nothing noble in being superior to your fellow man; true nobility is being superior to your former self.", author: "Ernest Hemingway" },
  { id: 'q99', text: "Who controls the past controls the future. Who controls the present controls the past.", author: "George Orwell" },
  { id: 'q100', text: "In a time of deceit telling the truth is a revolutionary act.", author: "George Orwell" },
  { id: 'q101', text: "Perhaps one did not want to be loved so much as to be understood.", author: "George Orwell" },
  { id: 'q102', text: "A writer is someone for whom writing is more difficult than it is for other people.", author: "Thomas Mann" },
  { id: 'q103', text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
  { id: 'q104', text: "To define is to limit.", author: "Oscar Wilde" },
  { id: 'q105', text: "Experience is not what happens to a man; it is what a man does with what happens to him.", author: "Aldous Huxley" },
  { id: 'q106', text: "The reading of all good books is like conversation with the finest men of past centuries.", author: "René Descartes" },
  { id: 'q107', text: "I think, therefore I am.", author: "René Descartes" },
  { id: 'q108', text: "If you would be a real seeker after truth, it is necessary that at least once in your life you doubt, as far as possible, all things.", author: "René Descartes" },

  // MODERN INTROSPECTION
  { id: 'q109', text: "It is a joy to be hidden, and disaster not to be found.", author: "D.W. Winnicott" },
  { id: 'q110', text: "I took a deep breath and listened to the old brag of my heart. I am, I am, I am.", author: "Sylvia Plath" },
  { id: 'q111', text: "Let me live, love, and say it well in good sentences.", author: "Sylvia Plath" },
  { id: 'q112', text: "There are no wrong turnings. Only paths we had not known we were meant to walk.", author: "Guy Gavriel Kay" },
  { id: 'q113', text: "If you only read the books that everyone else is reading, you can only think what everyone else is thinking.", author: "Haruki Murakami" },
  { id: 'q114', text: "Pain is inevitable. Suffering is optional.", author: "Haruki Murakami" },
  { id: 'q115', text: "And once the storm is over, you won’t remember how you made it through, how you managed to survive.", author: "Haruki Murakami" },

  // EASTERN TACTICS & DISCIPLINE
  { id: 'q116', text: "Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat.", author: "Sun Tzu" },
  { id: 'q117', text: "Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.", author: "Sun Tzu" },
  { id: 'q118', text: "In the midst of chaos, there is also opportunity.", author: "Sun Tzu" },
  { id: 'q119', text: "Do nothing which is of no use.", author: "Miyamoto Musashi" },
  { id: 'q120', text: "Think lightly of yourself and deeply of the world.", author: "Miyamoto Musashi" },
  { id: 'q121', text: "There is nothing outside of yourself that can ever enable you to get better, stronger, richer, quicker, or smarter. Everything is within.", author: "Miyamoto Musashi" },
  { id: 'q122', text: "It is better to be feared than loved, if you cannot be both.", author: "Niccolò Machiavelli" },
  { id: 'q123', text: "The lion cannot protect himself from traps, and the fox cannot defend himself from wolves.", author: "Niccolò Machiavelli" },
  { id: 'q124', text: "Never attempt to win by force what can be won by deception.", author: "Niccolò Machiavelli" },
  { id: 'q125', text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { id: 'q126', text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu" },
  { id: 'q127', text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },

  // THE FINAL REFLECTIONS
  { id: 'q128', text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
  { id: 'q129', text: "Music expresses that which cannot be put into words and that which cannot remain silent.", author: "Victor Hugo" },
  { id: 'q130', text: "To love or have loved, that is enough. Ask nothing further.", author: "Victor Hugo" },
  { id: 'q131', text: "Everyone thinks of changing the world, but no one thinks of changing himself.", author: "Leo Tolstoy" },
  { id: 'q132', text: "If you look for perfection, you'll never be content.", author: "Leo Tolstoy" },
  { id: 'q133', text: "Wrong does not cease to be wrong because the majority share in it.", author: "Leo Tolstoy" },
  { id: 'q134', text: "It is an absolute human certainty that no one can know his own beauty or perceive a sense of his own worth until it has been reflected back to him.", author: "John Joseph Powell" },
  { id: 'q135', text: "Only in the darkness can you see the stars.", author: "Martin Luther King Jr." },
  { id: 'q136', text: "There is always some madness in love. But there is also always some reason in madness.", author: "Friedrich Nietzsche" },
  { id: 'q137', text: "No tree, it is said, can grow to heaven unless its roots reach down to hell.", author: "Carl Jung" },
  { id: 'q138', text: "A man who fears suffering is already suffering from what he fears.", author: "Michel de Montaigne" },
  { id: 'q139', text: "My life has been full of terrible misfortunes most of which never happened.", author: "Michel de Montaigne" },
  { id: 'q140', text: "Lend yourself to others, but give yourself to yourself.", author: "Michel de Montaigne" },
  { id: 'q141', text: "Man is troubled not by events, but by the meaning he gives them.", author: "Epictetus" },
  { id: 'q142', text: "We are entirely responsible for our own lives.", author: "Jean-Paul Sartre" },
  { id: 'q143', text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
  { id: 'q144', text: "He who jumps into the void owes no explanation to those who stand and watch.", author: "Jean-Luc Godard" },
  { id: 'q145', text: "There is no sun without shadow, and it is essential to know the night.", author: "Albert Camus" },
  { id: 'q146', text: "You will never be happy if you continue to search for what happiness consists of.", author: "Albert Camus" },
  { id: 'q147', text: "True terror is to wake up one morning and discover that your high school class is running the country.", author: "Kurt Vonnegut" },
  { id: 'q148', text: "And so it goes...", author: "Kurt Vonnegut" },
  { id: 'q149', text: "Those who do not move, do not notice their chains.", author: "Rosa Luxemburg" },
  { id: 'q150', text: "The wound is the place where the Light enters you.", author: "Rumi" }
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

// --- AUTHENTICATION & SESSION MANAGEMENT ---
const btnUnlock = document.getElementById('btn-unlock');
const passwordInput = document.getElementById('diary-password');

// 1. SESSION CHECK: Are you already logged in for this browser session?
if (sessionStorage.getItem('sanctuary_unlocked') === 'true') {
  els.authScreen.classList.add('hidden');
  els.mainWorkspace.classList.remove('hidden'); 
}

// 2. THE LOGIN / SETUP PROCESS
if (btnUnlock && passwordInput) {
  // Check if this is the user's very first time here
  const isFirstTime = !localStorage.getItem('sanctuary_password');
  
  if (isFirstTime) {
    passwordInput.placeholder = "Create your password...";
    btnUnlock.textContent = "Set Password & Enter";
  }

  btnUnlock.addEventListener('click', () => {
    const enteredText = passwordInput.value.trim();
    if (!enteredText) return; // Don't allow empty passwords

    if (isFirstTime) {
      // FIRST TIME: Save their brand new password permanently
      localStorage.setItem('sanctuary_password', enteredText);
      unlockApp();
    } else {
      // RETURNING USER: Check against their saved password
      const savedPassword = localStorage.getItem('sanctuary_password');
      if (enteredText === savedPassword) {
        unlockApp();
      } else {
        // Wrong password visual feedback
        passwordInput.style.borderBottomColor = 'var(--danger-color)';
        passwordInput.value = '';
        passwordInput.placeholder = 'Incorrect password...';
        
        setTimeout(() => {
          passwordInput.style.borderBottomColor = 'var(--border-light)';
          passwordInput.placeholder = 'Enter your password...';
        }, 2000);
      }
    }
  });

  // Allow pressing "Enter" on the keyboard
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnUnlock.click();
    }
  });
}

function unlockApp() {
  // Give them a temporary 'Session' key
  sessionStorage.setItem('sanctuary_unlocked', 'true');
  
  els.authScreen.style.opacity = '0';
  els.authScreen.style.transition = 'opacity 0.8s ease';
  
  setTimeout(() => {
    els.authScreen.classList.add('hidden');
    els.quoteScreen.classList.remove('hidden');
    
    els.quoteScreen.style.opacity = '0';
    setTimeout(() => els.quoteScreen.style.opacity = '1', 50);
    els.quoteScreen.style.transition = 'opacity 0.8s ease';
    
    // Automatically change the UI for next time they log out
    passwordInput.placeholder = "Enter your password...";
    btnUnlock.textContent = "Open Journal";
    passwordInput.value = '';
    
    // Refresh the page slightly to ensure First-Time setup changes UI immediately
    if (!localStorage.getItem('sanctuary_setup_complete')) {
       localStorage.setItem('sanctuary_setup_complete', 'true');
       location.reload();
    }
  }, 800);
}

// --- LOCK VAULT TOGGLE ---
const btnLockDiary = document.getElementById('btn-lock-diary');
if (btnLockDiary) {
  btnLockDiary.addEventListener('click', () => { 
    // Erase temporary memory and reset to lock screen
    sessionStorage.removeItem('sanctuary_unlocked');
    window.location.reload(); 
  });
}

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

// --- CHANGE PASSWORD (SETTINGS PAGE) ---
const btnConfirmKeyChange = document.getElementById('btn-confirm-key-change');
const oldKeyInput = document.getElementById('old-key');
const newKeyInput = document.getElementById('new-key');
const newKeyConfirm = document.getElementById('new-key-confirm');

if (btnConfirmKeyChange) {
  btnConfirmKeyChange.addEventListener('click', () => {
    const currentSaved = localStorage.getItem('sanctuary_password');
    
    if (oldKeyInput.value !== currentSaved) {
      alert('Current password is incorrect.');
      return;
    }
    if (newKeyInput.value !== newKeyConfirm.value) {
      alert('New passwords do not match.');
      return;
    }
    if (newKeyInput.value.trim() === '') {
      alert('Password cannot be empty.');
      return;
    }
    
    // Save the new password
    localStorage.setItem('sanctuary_password', newKeyInput.value.trim());
    alert('Password successfully updated!');
    
    // Clear inputs
    oldKeyInput.value = '';
    newKeyInput.value = '';
    newKeyConfirm.value = '';
  });
}

// --- CSS OVERRIDE: FORCE SLEEK DELETE BUTTONS ---
const styleFix = document.createElement('style');
styleFix.innerHTML = `
  #lists-container button,
  #thoughts-feed button {
    background: transparent !important;
    border: none !important;
    color: var(--text-muted) !important;
    font-family: var(--font-ui) !important;
    font-size: 0.85rem !important;
    cursor: pointer !important;
    padding: 0 !important;
    margin-top: 10px !important;
    box-shadow: none !important;
    outline: none !important;
    transition: color 0.2s ease !important;
  }
  #lists-container button:hover,
  #thoughts-feed button:hover {
    color: #E06C75 !important;
    text-decoration: underline !important;
  }
`;
document.head.appendChild(styleFix);
