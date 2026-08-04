// --- MODULES & UI RENDERER ---

let activeJournalId = null;
let typingTimer = null; 
let activeCodexId = null; 
let base64ImageCache = "";

// --- 1. JOURNAL MODULE ---
const renderJournalHistory = () => {
  const listEl = document.getElementById('journal-history-list');
  if(!listEl) return;
  listEl.innerHTML = '';
  if (!sanctuaryData.journal) sanctuaryData.journal = [];
  
  const sorted = [...sanctuaryData.journal].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  sorted.forEach(entry => {
    const li = document.createElement('li');
    li.className = `history-item ${activeJournalId === entry.id ? 'active' : ''}`;
    const dateObj = new Date(entry.timestamp);
    
    li.innerHTML = `
      <div class="history-title">${entry.title || 'Untitled Page'}</div>
      <div class="history-date">${dateObj.toLocaleDateString('en-GB')}</div>
    `;
    
    li.addEventListener('click', () => {
      activeJournalId = entry.id;
      document.getElementById('entry-title').value = entry.title;
      document.getElementById('entry-body').value = entry.content;
      document.getElementById('btn-delete-entry').classList.remove('hidden');
      renderJournalHistory();
      
      const sidebar = document.getElementById('sidebar');
      if(sidebar) {
        sidebar.classList.remove('sidebar-expanded');
        sidebar.classList.add('sidebar-collapsed');
      }
    });
    
    listEl.appendChild(li);
  });
};

const btnNewEntry = document.getElementById('btn-new-entry');
if(btnNewEntry) {
  btnNewEntry.addEventListener('click', () => {
    activeJournalId = `JRN-${Date.now()}`;
    document.getElementById('entry-title').value = '';
    document.getElementById('entry-body').value = '';
    document.getElementById('btn-delete-entry').classList.add('hidden');
    document.getElementById('entry-title').focus();
    renderJournalHistory();
  });
}

window.triggerModuleAutosave = () => {
  if (!activeJournalId) return;
  clearTimeout(typingTimer); 
  
  const title = document.getElementById('entry-title').value;
  const content = document.getElementById('entry-body').value;
  
  const idx = sanctuaryData.journal.findIndex(j => j.id === activeJournalId);
  if (idx > -1) {
    sanctuaryData.journal[idx].title = title;
    sanctuaryData.journal[idx].content = content;
    sanctuaryData.journal[idx].timestamp = new Date().toISOString();
  } else {
    if (!title && !content) return; 
    sanctuaryData.journal.push({
      id: activeJournalId,
      title: title,
      content: content,
      timestamp: new Date().toISOString()
    });
  }
  
  renderJournalHistory();
  typingTimer = setTimeout(() => {
    if (window.pushToDrive) window.pushToDrive();
  }, 1500); 
};

const titleInput = document.getElementById('entry-title');
const bodyInput = document.getElementById('entry-body');
if(titleInput) titleInput.addEventListener('input', window.triggerModuleAutosave);
if(bodyInput) bodyInput.addEventListener('input', window.triggerModuleAutosave);

const btnDeleteEntry = document.getElementById('btn-delete-entry');
if(btnDeleteEntry) {
  btnDeleteEntry.addEventListener('click', () => {
    if(confirm("Are you sure you want to burn this page? This cannot be undone.")) {
      sanctuaryData.journal = sanctuaryData.journal.filter(j => j.id !== activeJournalId);
      if (window.pushToDrive) window.pushToDrive();
      document.getElementById('btn-new-entry').click(); 
    }
  });
}


// --- 2. CODEX MODULE ---
const renderCodex = () => {
  const grid = document.getElementById('codex-grid');
  if(!grid) return;
  grid.innerHTML = '';
  if (!sanctuaryData.codex) sanctuaryData.codex = [];

  const sorted = [...sanctuaryData.codex].sort((a, b) => b.id.localeCompare(a.id));

  sorted.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => editCodexEntry(entry);
    
    if (entry.type === 'person') {
      const imgHtml = entry.image ? `<img src="${entry.image}" class="profile-img-preview" style="margin: 0 auto 15px auto; display:block;">` : '';
      card.innerHTML = `
        ${imgHtml}
        <div class="card-title" style="text-align: center;">${entry.name}</div>
        <div class="card-subtitle" style="text-align: center;">${entry.relation || 'Unknown'} • ${entry.age || '?'}</div>
        <div class="card-meta" style="justify-content: center;">
          ${entry.likes ? `<span class="tag">Likes: ${entry.likes.substring(0, 15)}...</span>` : ''}
          ${entry.dislikes ? `<span class="tag">Dislikes: ${entry.dislikes.substring(0, 15)}...</span>` : ''}
        </div>
        ${entry.notes ? `<div class="card-body" style="margin-top:15px; border-top: 1px solid var(--border-light); padding-top: 15px;">${entry.notes}</div>` : ''}
      `;
    } else {
      card.innerHTML = `
        <div class="card-title">${entry.title}</div>
        <div class="card-subtitle">${entry.category || 'Lore'}</div>
        <div class="card-body">${entry.notes}</div>
      `;
    }
    grid.appendChild(card);
  });
};

const personImgInput = document.getElementById('person-image');
if(personImgInput) {
  personImgInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(file) {
      if(file.size > 5242880) { // 5MB limit check
        alert("Image exceeds 5MB limit. Please upload a smaller portrait.");
        return;
      }
      try {
        base64ImageCache = await window.compressImage(file);
        const preview = document.getElementById('person-img-preview');
        preview.src = base64ImageCache;
        preview.classList.remove('hidden');
      } catch(err) {
        alert("Image compression failed.");
      }
    }
  });
}

const tabPerson = document.getElementById('tab-btn-person');
const tabLore = document.getElementById('tab-btn-lore');
if(tabPerson && tabLore) {
  tabPerson.addEventListener('click', (e) => {
    tabLore.classList.remove('active');
    e.target.classList.add('active');
    document.getElementById('input-pane-lore').classList.add('hidden');
    document.getElementById('input-pane-person').classList.remove('hidden');
  });

  tabLore.addEventListener('click', (e) => {
    tabPerson.classList.remove('active');
    e.target.classList.add('active');
    document.getElementById('input-pane-person').classList.add('hidden');
    document.getElementById('input-pane-lore').classList.remove('hidden');
  });
}

const btnAddCodex = document.getElementById('btn-add-codex');
if(btnAddCodex) {
  btnAddCodex.addEventListener('click', () => {
    activeCodexId = null; 
    base64ImageCache = "";
    document.getElementById('person-img-preview').classList.add('hidden');
    ['person-name', 'person-age', 'person-relation', 'person-likes', 'person-dislikes', 'lore-title', 'lore-category', 'codex-notes'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('modal-codex').classList.remove('hidden');
  });
}

const btnCloseCodex = document.getElementById('btn-close-codex');
if(btnCloseCodex) btnCloseCodex.addEventListener('click', () => document.getElementById('modal-codex').classList.add('hidden'));

const editCodexEntry = (entry) => {
  activeCodexId = entry.id;
  document.getElementById('codex-notes').value = entry.notes || '';
  
  if (entry.type === 'person') {
    document.getElementById('tab-btn-person').click();
    document.getElementById('person-name').value = entry.name || '';
    document.getElementById('person-age').value = entry.age || '';
    document.getElementById('person-relation').value = entry.relation || '';
    document.getElementById('person-likes').value = entry.likes || '';
    document.getElementById('person-dislikes').value = entry.dislikes || '';
    
    if (entry.image) {
      base64ImageCache = entry.image;
      document.getElementById('person-img-preview').src = base64ImageCache;
      document.getElementById('person-img-preview').classList.remove('hidden');
    } else {
      base64ImageCache = "";
      document.getElementById('person-img-preview').classList.add('hidden');
    }
  } else {
    document.getElementById('tab-btn-lore').click();
    document.getElementById('lore-title').value = entry.title || '';
    document.getElementById('lore-category').value = entry.category || '';
  }
  document.getElementById('modal-codex').classList.remove('hidden');
};

const btnSaveCodex = document.getElementById('btn-save-codex');
if(btnSaveCodex) {
  btnSaveCodex.addEventListener('click', () => {
    const isPerson = document.getElementById('tab-btn-person').classList.contains('active');
    const entryId = activeCodexId || `CDX-${Date.now()}`;
    
    let newEntry = {
      id: entryId,
      type: isPerson ? 'person' : 'lore',
      notes: document.getElementById('codex-notes').value.trim()
    };

    if (isPerson) {
      newEntry.name = document.getElementById('person-name').value.trim() || 'Unknown';
      newEntry.age = document.getElementById('person-age').value.trim();
      newEntry.relation = document.getElementById('person-relation').value.trim();
      newEntry.likes = document.getElementById('person-likes').value.trim();
      newEntry.dislikes = document.getElementById('person-dislikes').value.trim();
      newEntry.image = base64ImageCache;
    } else {
      newEntry.title = document.getElementById('lore-title').value.trim() || 'Untitled Lore';
      newEntry.category = document.getElementById('lore-category').value.trim();
    }
    
    if (activeCodexId) {
      const idx = sanctuaryData.codex.findIndex(e => e.id === activeCodexId);
      sanctuaryData.codex[idx] = newEntry;
    } else {
      sanctuaryData.codex.push(newEntry);
    }
    
    document.getElementById('modal-codex').classList.add('hidden');
    if (window.pushToDrive) window.pushToDrive();
    renderCodex();
  });
}

// --- 3. LISTS MODULE ---
const renderLists = () => {
  const container = document.getElementById('lists-container');
  if(!container) return;
  container.innerHTML = '';
  if (!sanctuaryData.lists) sanctuaryData.lists = [];

  sanctuaryData.lists.forEach(list => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'default';
    
    let itemsHtml = '<ul class="checklist">';
    list.items.forEach((item, index) => {
      itemsHtml += `
        <li class="check-item ${item.done ? 'done' : ''}">
          <div class="check-box ${item.done ? 'done' : ''}" onclick="toggleListItem('${list.id}', ${index})">
             ${item.done ? '✓' : ''}
          </div>
          <span>${item.text}</span>
        </li>
      `;
    });
    itemsHtml += '</ul>';

    card.innerHTML = `
      <div class="card-title">${list.title}</div>
      ${itemsHtml}
      <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center; border-top: 1px solid var(--border-light); padding-top: 15px;">
        <input type="text" class="input-minimal" style="margin:0; padding:5px; flex:1;" placeholder="+ Add new item" onkeypress="handleNewListItem(event, '${list.id}')">
        <button class="btn-text-only btn-danger" onclick="deleteList('${list.id}')" style="margin:0; font-size: 0.75rem;">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
};

window.toggleListItem = (listId, itemIndex) => {
  const list = sanctuaryData.lists.find(l => l.id === listId);
  list.items[itemIndex].done = !list.items[itemIndex].done;
  if (window.pushToDrive) window.pushToDrive();
  renderLists();
};

window.handleNewListItem = (e, listId) => {
  if (e.key === 'Enter' && e.target.value.trim() !== '') {
    const list = sanctuaryData.lists.find(l => l.id === listId);
    list.items.push({ text: e.target.value.trim(), done: false });
    e.target.value = '';
    if (window.pushToDrive) window.pushToDrive();
    renderLists();
  }
};

window.deleteList = (id) => {
  if(confirm("Delete this entire list?")) {
    sanctuaryData.lists = sanctuaryData.lists.filter(l => l.id !== id);
    if (window.pushToDrive) window.pushToDrive();
    renderLists();
  }
};

const btnAddList = document.getElementById('btn-add-list');
if(btnAddList) btnAddList.addEventListener('click', () => { document.getElementById('modal-list').classList.remove('hidden'); });
const btnCloseList = document.getElementById('btn-close-list');
if(btnCloseList) btnCloseList.addEventListener('click', () => { document.getElementById('modal-list').classList.add('hidden'); });

const btnSaveList = document.getElementById('btn-save-list');
if(btnSaveList) {
  btnSaveList.addEventListener('click', () => {
    const title = document.getElementById('list-title').value || 'Untitled List';
    const firstItem = document.getElementById('list-first-item').value;
    const newList = { id: `LST-${Date.now()}`, title: title, items: [] };
    if (firstItem) newList.items.push({ text: firstItem, done: false });
    
    sanctuaryData.lists.push(newList);
    document.getElementById('list-title').value = '';
    document.getElementById('list-first-item').value = '';
    document.getElementById('modal-list').classList.add('hidden');
    if (window.pushToDrive) window.pushToDrive();
    renderLists();
  });
}

// --- 4. THOUGHTS & ARCHIVE MODULE ---
const archiveDailyQuote = () => {
  if (!window.currentDailyQuote) return;
  const todayStr = new Date().toLocaleDateString();
  if (!sanctuaryData.thoughts) sanctuaryData.thoughts = [];
  
  const alreadyArchived = sanctuaryData.thoughts.find(t => t.type === 'quote' && t.dateStr === todayStr);
  
  if (!alreadyArchived) {
    sanctuaryData.thoughts.push({
      id: `QT-${Date.now()}`,
      type: 'quote',
      text: window.currentDailyQuote.text,
      author: window.currentDailyQuote.author,
      liked: window.currentDailyQuote.liked || false,
      dateStr: todayStr,
      timestamp: new Date().toISOString()
    });
    if (window.pushToDrive) window.pushToDrive();
  } else if (alreadyArchived && window.currentDailyQuote.liked !== alreadyArchived.liked) {
    // Update like status if changed before midnight
    alreadyArchived.liked = window.currentDailyQuote.liked;
    if (window.pushToDrive) window.pushToDrive();
  }
};

const renderThoughts = () => {
  const feed = document.getElementById('thoughts-feed');
  if(!feed) return;
  feed.innerHTML = '';
  if (!sanctuaryData.thoughts) sanctuaryData.thoughts = [];

  const sorted = [...sanctuaryData.thoughts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  sorted.forEach(thought => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'default';
    
    if (thought.type === 'quote') {
      const heartColor = thought.liked ? '#E06C75' : 'var(--text-muted)';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div class="card-subtitle" style="margin: 0;">Archived Quote • ${thought.dateStr}</div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${thought.liked ? heartColor : 'none'}" stroke="${heartColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </div>
        <div class="card-body" style="font-size: 1.15rem; font-style: italic;">"${thought.text}"</div>
        <div class="card-meta" style="margin-top: 15px; color: var(--text-muted); font-size: 0.85rem;">— ${thought.author}</div>
      `;
    } else {
      card.innerHTML = `
        <div class="card-subtitle">Quick Thought • ${new Date(thought.timestamp).toLocaleDateString('en-GB')}</div>
        <div class="card-body">${thought.text}</div>
        <button class="btn-text-only btn-danger" onclick="deleteThought('${thought.id}')" style="margin-top: 15px; font-size: 0.75rem;">Delete</button>
      `;
    }
    feed.appendChild(card);
  });
};

window.deleteThought = (id) => {
  if(confirm("Discard this thought?")) {
    sanctuaryData.thoughts = sanctuaryData.thoughts.filter(t => t.id !== id);
    if (window.pushToDrive) window.pushToDrive();
    renderThoughts();
  }
};

const btnSaveThought = document.getElementById('btn-save-thought');
if(btnSaveThought) {
  btnSaveThought.addEventListener('click', () => {
    const input = document.getElementById('quick-thought-input');
    const text = input.value.trim();
    if (!text) return;

    sanctuaryData.thoughts.push({
      id: `THT-${Date.now()}`,
      type: 'personal',
      text: text,
      timestamp: new Date().toISOString()
    });
    
    input.value = '';
    if (window.pushToDrive) window.pushToDrive();
    renderThoughts();
  });
}

// --- CLOUD EVENT HOOK ---
window.addEventListener('cloudDataLoaded', () => {
  archiveDailyQuote(); 
  renderJournalHistory();
  renderCodex();
  renderLists();
  renderThoughts();
  
  if(sanctuaryData.journal && sanctuaryData.journal.length > 0 && !activeJournalId) {
    const sorted = [...sanctuaryData.journal].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activeJournalId = sorted[0].id;
    document.getElementById('entry-title').value = sorted[0].title;
    document.getElementById('entry-body').value = sorted[0].content;
    document.getElementById('btn-delete-entry').classList.remove('hidden');
    renderJournalHistory();
  } else if (!activeJournalId) {
    const btn = document.getElementById('btn-new-entry');
    if(btn) btn.click();
  }
});
