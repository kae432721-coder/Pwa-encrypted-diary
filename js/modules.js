// --- MODULES & UI RENDERER ---

let activeJournalId = null;
let typingTimer = null; // Used to delay the autosave so we don't spam Google Drive

// --- 1. JOURNAL MODULE ---
const renderJournalHistory = () => {
  const listEl = document.getElementById('journal-history-list');
  listEl.innerHTML = '';
  
  if (!sanctuaryData.journal) sanctuaryData.journal = [];
  
  // Sort newest first
  const sorted = [...sanctuaryData.journal].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  sorted.forEach(entry => {
    const li = document.createElement('li');
    li.className = `history-item ${activeJournalId === entry.id ? 'active' : ''}`;
    const dateObj = new Date(entry.timestamp);
    
    li.innerHTML = `
      <div style="font-weight: 500;">${entry.title || 'Untitled Page'}</div>
      <div class="history-date">${dateObj.toLocaleDateString('en-GB')} ${dateObj.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    
    li.addEventListener('click', () => {
      activeJournalId = entry.id;
      document.getElementById('entry-title').value = entry.title;
      document.getElementById('entry-body').value = entry.content;
      document.getElementById('btn-delete-entry').classList.remove('hidden');
      renderJournalHistory();
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

const triggerModuleAutosave = () => {
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
    sanctuaryData.journal.push({
      id: activeJournalId,
      title: title,
      content: content,
      timestamp: new Date().toISOString()
    });
  }
  
  renderJournalHistory();
  // Wait 1.5 seconds after user stops typing before pushing to cloud
  typingTimer = setTimeout(() => {
    if (window.pushToDrive) window.pushToDrive();
  }, 1500);
};

document.getElementById('entry-title').addEventListener('input', triggerModuleAutosave);
document.getElementById('entry-body').addEventListener('input', triggerModuleAutosave);

document.getElementById('btn-delete-entry').addEventListener('click', () => {
  if(confirm("Are you sure you want to burn this page? This cannot be undone.")) {
    sanctuaryData.journal = sanctuaryData.journal.filter(j => j.id !== activeJournalId);
    if (window.pushToDrive) window.pushToDrive();
    document.getElementById('btn-new-entry').click(); 
  }
});


// --- 2. PEOPLE & LORE MODULE ---
const renderPeople = () => {
  const grid = document.getElementById('people-grid');
  grid.innerHTML = '';
  if (!sanctuaryData.people) sanctuaryData.people = [];

  sanctuaryData.people.forEach(person => {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Birthday Email Link Generator
    let emailLink = '';
    if (person.birthday) {
      const bday = new Date(person.birthday).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'});
      const mailto = `mailto:?subject=Happy Birthday!&body=Draft your message here, then use Gmail's 'Schedule Send' for ${bday}.`;
      emailLink = `<a href="${mailto}" target="_blank" class="btn-small" style="text-decoration:none;">Schedule Email</a>`;
    }

    card.innerHTML = `
      <div class="card-title">${person.name}</div>
      <div class="card-subtitle">${person.relation || 'Unknown'} • Age ${person.age || '?'}</div>
      <div class="card-body">
        <p style="margin-bottom: 10px; font-size: 0.85rem; opacity: 0.8;"><strong>Vibe:</strong> ${person.likes || 'Not specified'}</p>
        <p>${person.lore || ''}</p>
      </div>
      <div class="card-actions">
        ${emailLink}
        <button class="btn-small btn-danger" onclick="deletePerson('${person.id}')" style="${emailLink ? 'margin-left:auto;' : ''}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
};

window.deletePerson = (id) => {
  if(confirm("Remove this profile from your codex?")) {
    sanctuaryData.people = sanctuaryData.people.filter(p => p.id !== id);
    if (window.pushToDrive) window.pushToDrive();
    renderPeople();
  }
};

document.getElementById('btn-add-person').addEventListener('click', () => {
  document.getElementById('modal-person').classList.remove('hidden');
});
document.getElementById('btn-close-person').addEventListener('click', () => {
  document.getElementById('modal-person').classList.add('hidden');
});
document.getElementById('btn-save-person').addEventListener('click', () => {
  sanctuaryData.people.push({
    id: `PPL-${Date.now()}`,
    name: document.getElementById('person-name').value || 'Unknown',
    age: document.getElementById('person-age').value,
    relation: document.getElementById('person-relation').value,
    birthday: document.getElementById('person-birthday').value,
    likes: document.getElementById('person-likes').value,
    lore: document.getElementById('person-lore').value
  });
  
  // Clear inputs
  ['name', 'age', 'relation', 'birthday', 'likes', 'lore'].forEach(f => document.getElementById(`person-${f}`).value = '');
  document.getElementById('modal-person').classList.add('hidden');
  if (window.pushToDrive) window.pushToDrive();
  renderPeople();
});


// --- 3. LISTS & TASKS MODULE ---
const renderLists = () => {
  const container = document.getElementById('lists-container');
  container.innerHTML = '';
  if (!sanctuaryData.lists) sanctuaryData.lists = [];

  sanctuaryData.lists.forEach(list => {
    const card = document.createElement('div');
    card.className = 'card';
    
    let itemsHtml = '<ul class="checklist">';
    list.items.forEach((item, index) => {
      itemsHtml += `
        <li class="check-item ${item.done ? 'done' : ''}">
          <div class="check-box ${item.done ? 'done' : ''}" onclick="toggleListItem('${list.id}', ${index})"></div>
          <span>${item.text}</span>
        </li>
      `;
    });
    itemsHtml += '</ul>';

    card.innerHTML = `
      <div class="card-title">${list.title}</div>
      ${itemsHtml}
      <div class="card-actions" style="margin-top: 15px;">
        <input type="text" id="add-item-${list.id}" class="input-minimal" style="margin-bottom:0; padding:5px; font-size:0.8rem; flex:1;" placeholder="+ Add new item" onkeypress="handleNewListItem(event, '${list.id}')">
        <button class="btn-small btn-danger" onclick="deleteList('${list.id}')" style="margin-left: 10px;">Delete List</button>
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

document.getElementById('btn-add-list').addEventListener('click', () => {
  document.getElementById('modal-list').classList.remove('hidden');
});
document.getElementById('btn-close-list').addEventListener('click', () => {
  document.getElementById('modal-list').classList.add('hidden');
});
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

// --- HOOK INTO CLOUD INITIALIZATION ---
// This listens for the exact moment cloud.js finishes decrypting your data
window.addEventListener('cloudDataLoaded', () => {
  renderJournalHistory();
  renderPeople();
  renderLists();
  
  // Automatically open the newest journal entry if one exists
  if(sanctuaryData.journal && sanctuaryData.journal.length > 0 && !activeJournalId) {
    // Sort to find newest
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
