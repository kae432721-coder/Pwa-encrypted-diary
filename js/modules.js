// --- MODULES & UI RENDERER ---

let activeJournalId = null;
let typingTimer = null; 
let activeCodexId = null; // Used when editing an existing Person/Lore card
let base64ImageCache = "";

// --- 1. JOURNAL MODULE ---
const renderJournalHistory = () => {
  const listEl = document.getElementById('journal-history-list');
  listEl.innerHTML = '';
  if (!sanctuaryData.journal) sanctuaryData.journal = [];
  
  const sorted = [...sanctuaryData.journal].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  sorted.forEach(entry => {
    const li = document.createElement('li');
    li.className = `history-item ${activeJournalId === entry.id ? 'active' : ''}`;
    const dateObj = new Date(entry.timestamp);
    
    li.innerHTML = `
      <div class="history-title">${entry.title || 'Untitled Page'}</div>
      <div class="history-date">${dateObj.toLocaleDateString('en-GB')} ${dateObj.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    
    li.addEventListener('click', () => {
      activeJournalId = entry.id;
      document.getElementById('entry-title').value = entry.title;
      document.getElementById('entry-body').value = entry.content;
      document.getElementById('btn-delete-entry').classList.remove('hidden');
      renderJournalHistory();
      
      // Auto-collapse sidebar on mobile/desktop when selecting a page
      document.getElementById('sidebar').classList.remove('sidebar-expanded');
      document.getElementById('sidebar').classList.add('sidebar-collapsed');
    });
    
    listEl.appendChild(li);
  });
};

document.getElementById('btn-new-entry').addEventListener('click', () => {
  activeJournalId = `JRN-${Date.now()}`;
  document.getElementById('entry-title').value = '';
  document.getElementById('entry-body').value = '';
  document.getElementById('btn-delete-entry').classList.add('hidden');
  document.getElementById('entry-title').focus();
  renderJournalHistory();
});

// Exposed globally so the hybrid editor in app.js can trigger it too
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
    if (!title && !content) return; // Don't save completely blank ghost files
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
  }, 1500); // 1.5 second debounce
};

document.getElementById('entry-title').addEventListener('input', window.triggerModuleAutosave);
document.getElementById('entry-body').addEventListener('input', window.triggerModuleAutosave);

document.getElementById('btn-delete-entry').addEventListener('click', () => {
  if(confirm("Are you sure you want to burn this page? This cannot be undone.")) {
    sanctuaryData.journal = sanctuaryData.journal.filter(j => j.id !== activeJournalId);
    if (window.pushToDrive) window.pushToDrive();
    document.getElementById('btn-new-entry').click(); 
  }
});


// --- 2. CODEX (PEOPLE & LORE) MODULE ---
const renderCodex = () => {
  const grid = document.getElementById('codex-grid');
  grid.innerHTML = '';
  if (!sanctuaryData.codex) sanctuaryData.codex = [];

  // Sort newest first
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
          ${entry.likes ? `<span class="tag">👍 ${entry.likes.substring(0, 20)}${entry.likes.length > 20 ? '...' : ''}</span>` : ''}
          ${entry.dislikes ? `<span class="tag">👎 ${entry.dislikes.substring(0, 20)}${entry.dislikes.length > 20 ? '...' : ''}</span>` : ''}
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

// Handle Image Base64 Upload
document.getElementById('person-image').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(file) {
    try {
      base64ImageCache = await window.compressImage(file);
      const preview = document.getElementById('person-img-preview');
      preview.src = base64ImageCache;
      preview.classList.remove('hidden');
    } catch(err) {
      alert("Image compression failed. Try a smaller file.");
    }
  }
});

// Codex Tabs Logic
document.getElementById('tab-btn-person').addEventListener('click', (e) => {
  document.getElementById('tab-btn-lore').classList.remove('active');
  e.target.classList.add('active');
  document.getElementById('input-pane-lore').classList.add('hidden');
  document.getElementById('input-pane-person').classList.remove('hidden');
});

document.getElementById('tab-btn-lore').addEventListener('click', (e) => {
  document.getElementById('tab-btn-person').classList.remove('active');
  e.target.classList.add('active');
  document.getElementById('input-pane-person').classList.add('hidden');
  document.getElementById('input-pane-lore').classList.remove('hidden');
});

document.getElementById('btn-add-codex').addEventListener('click', () => {
  activeCodexId = null; // New Entry
  base64ImageCache = "";
  document.getElementById('person-img-preview').classList.add('hidden');
  
  // Clear all inputs
  ['person-name', 'person-age', 'person-relation', 'person-likes', 'person-dislikes', 'lore-title', 'lore-category', 'codex-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  
  document.getElementById('modal-codex').classList.remove('hidden');
});

document.getElementById('btn-close-codex').addEventListener('click', () => {
  document.getElementById('modal-codex').classList.add('hidden');
});

// Load existing entry into modal
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

document.getElementById('btn-save-codex').addEventListener('click', () => {
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


// --- 3. LISTS & TASKS MODULE ---
const renderLists = () => {
  const container = document.getElementById('lists-container');
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

document.getElementById('btn-add-list').addEventListener('click', () => { document.getElementById('modal-list').classList.remove('hidden'); });
document.getElementById('btn-close-list').addEventListener('click', () => { document.getElementById('modal-list').classList.add('hidden'); });
document.getElementById('btn-save-list').addEventListener('click', () => {
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


// --- 4. THOUGHTS & ARCHIVE MODULE ---
const archiveDailyQuote = () => {
  if (!window.currentDailyQuote) return;
  const todayStr = new Date().toLocaleDateString();
  if (!sanctuaryData.thoughts) sanctuaryData.thoughts = [];
  
  // Check if today's quote has already been saved to prevent duplicates
  const alreadyArchived = sanctuaryData.thoughts.find(t => t.type === 'quote' && t.dateStr === todayStr);
  if (!alreadyArchived) {
    sanctuaryData.thoughts.push({
      id: `QT-${Date.now()}`,
      type: 'quote',
      text: window.currentDailyQuote.text,
      author: window.currentDailyQuote.author,
      dateStr: todayStr,
      timestamp: new Date().toISOString()
    });
    // Silent push to drive to back it up
    if (window.pushToDrive) window.pushToDrive();
  }
};

const renderThoughts = () => {
  const feed = document.getElementById('thoughts-feed');
  feed.innerHTML = '';
  if (!sanctuaryData.thoughts) sanctuaryData.thoughts = [];

  // Sort newest first
  const sorted = [...sanctuaryData.thoughts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  sorted.forEach(thought => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'default';
    
    if (thought.type === 'quote') {
      card.innerHTML = `
        <div class="card-subtitle">Archived Quote • ${thought.dateStr}</div>
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

document.getElementById('btn-save-thought').addEventListener('click', () => {
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

// --- HOOK INTO CLOUD INITIALIZATION ---
// Triggers the exact moment cloud.js finishes decrypting your vault
window.addEventListener('cloudDataLoaded', () => {
  archiveDailyQuote(); // Fire the archive logic immediately
  
  renderJournalHistory();
  renderCodex();
  renderLists();
  renderThoughts();
  
  // Auto-open newest journal entry if available
  if(sanctuaryData.journal && sanctuaryData.journal.length > 0 && !activeJournalId) {
    const sorted = [...sanctuaryData.journal].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activeJournalId = sorted[0].id;
    document.getElementById('entry-title').value = sorted[0].title;
    document.getElementById('entry-body').value = sorted[0].content;
    document.getElementById('btn-delete-entry').classList.remove('hidden');
    renderJournalHistory();
  } else if (!activeJournalId) {
    document.getElementById('btn-new-entry').click();
  }
});
