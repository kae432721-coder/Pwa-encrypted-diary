// --- MODULES & UI RENDERER ---
// SECURITY RULE: user data is only ever inserted with textContent / text nodes,
// never via innerHTML (the only HTML we ever write is the *sanitised* journal body).

let activeJournalId = null;
let typingTimer = null;
let activeCodexId = null;
let base64ImageCache = "";

// ---------- tiny safe DOM builder ----------
const h = (tag, props = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
};
const SAFE_IMG = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const safeImage = (src) => (typeof src === "string" && SAFE_IMG.test(src) ? src : null);
const stampUpdated = (o) => (window.touch ? window.touch(o) : o);
const pushNow = () => { if (window.pushToDrive) window.pushToDrive(); };

// ---------- journal body: allow-list sanitiser (contenteditable <div>) ----------
const ALLOWED_TAGS = new Set(["B", "I", "STRONG", "EM", "U", "H2", "H3", "UL", "OL", "LI", "P", "DIV", "BR"]);
const DROP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE", "NOSCRIPT", "SVG", "MATH", "LINK", "META"]);
function cleanInto(node, out) {
  for (const c of node.childNodes) {
    if (c.nodeType === 3) out.append(document.createTextNode(c.nodeValue));
    else if (c.nodeType === 1) {
      const t = c.tagName.toUpperCase();
      if (DROP_TAGS.has(t)) continue;
      if (ALLOWED_TAGS.has(t)) { const n = document.createElement(t.toLowerCase()); cleanInto(c, n); out.append(n); }
      else cleanInto(c, out);                       // unknown tag: keep its text, lose the tag
    }
  }
}
function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");   // inert: nothing runs or loads
  const box = document.createElement("div");
  cleanInto(doc.body, box);                         // attributes (onerror, href, style...) are never copied
  return box.innerHTML;
}
const bodyEl = () => document.getElementById("entry-body");
const isRich = (el) => el && el.tagName !== "TEXTAREA" && el.tagName !== "INPUT";
// index.html uses <div contenteditable>, which has NO .value -- the old code silently lost every journal body.
const getBody = () => { const el = bodyEl(); return isRich(el) ? sanitizeHtml(el.innerHTML) : el.value; };
const setBody = (v) => {
  const el = bodyEl(); if (!el) return;
  if (isRich(el)) { el.style.whiteSpace = "pre-wrap"; el.innerHTML = sanitizeHtml(v); } else el.value = v || "";
};

// --- 1. JOURNAL MODULE ---
const renderJournalHistory = () => {
  const listEl = document.getElementById("journal-history-list");
  if (!listEl) return;
  listEl.replaceChildren();
  const sorted = [...sanctuaryData.journal].sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
  for (const entry of sorted) {
    const li = h("li", { class: `history-item ${activeJournalId === entry.id ? "active" : ""}` },
      h("div", { class: "history-title" }, entry.title || "Untitled Page"),
      h("div", { class: "history-date" }, new Date(entry.timestamp).toLocaleDateString("en-GB")));
    li.addEventListener("click", () => {
      activeJournalId = entry.id;
      document.getElementById("entry-title").value = entry.title || "";
      setBody(entry.content);
      document.getElementById("btn-delete-entry").classList.remove("hidden");
      renderJournalHistory();
      const sidebar = document.getElementById("sidebar");
      if (sidebar) { sidebar.classList.remove("sidebar-expanded"); sidebar.classList.add("sidebar-collapsed"); }
    });
    listEl.appendChild(li);
  }
};

const btnNewEntry = document.getElementById("btn-new-entry");
if (btnNewEntry) {
  btnNewEntry.addEventListener("click", () => {
    activeJournalId = `JRN-${Date.now()}`;
    document.getElementById("entry-title").value = "";
    setBody("");
    document.getElementById("btn-delete-entry").classList.add("hidden");
    document.getElementById("entry-title").focus();
    renderJournalHistory();
  });
}

window.triggerModuleAutosave = () => {
  if (!activeJournalId) return;
  clearTimeout(typingTimer);
  const title = document.getElementById("entry-title").value;
  const content = getBody();
  const idx = sanctuaryData.journal.findIndex((j) => j.id === activeJournalId);
  if (idx > -1) {
    Object.assign(sanctuaryData.journal[idx], { title, content, timestamp: new Date().toISOString() });
  } else {
    if (!title && !content) return;
    sanctuaryData.journal.push({ id: activeJournalId, title, content, timestamp: new Date().toISOString() });
    document.getElementById("btn-delete-entry").classList.remove("hidden");
  }
  renderJournalHistory();
  typingTimer = setTimeout(pushNow, 1500);
};

const titleInput = document.getElementById("entry-title");
const bodyInput = document.getElementById("entry-body");
if (titleInput) titleInput.addEventListener("input", window.triggerModuleAutosave);
if (bodyInput) {
  bodyInput.addEventListener("input", window.triggerModuleAutosave);
  // Pasting from a web page would bring its HTML/styles along: force plain text.
  bodyInput.addEventListener("paste", (e) => {
    if (!isRich(bodyInput)) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  });
}

const btnDeleteEntry = document.getElementById("btn-delete-entry");
if (btnDeleteEntry) {
  btnDeleteEntry.addEventListener("click", () => {
    if (!confirm("Are you sure you want to burn this page? This cannot be undone.")) return;
    sanctuaryData.journal = sanctuaryData.journal.filter((j) => j.id !== activeJournalId);
    window.markDeleted(activeJournalId);
    pushNow();
    document.getElementById("btn-new-entry").click();
  });
}

// --- 2. CODEX MODULE ---
const renderCodex = () => {
  const grid = document.getElementById("codex-grid");
  if (!grid) return;
  grid.replaceChildren();
  const sorted = [...sanctuaryData.codex].sort((a, b) => b.id.localeCompare(a.id));
  for (const entry of sorted) {
    const card = h("div", { class: "card" });
    card.addEventListener("click", () => editCodexEntry(entry));
    const notes = (style) => entry.notes ? h("div", { class: "card-body", style: "white-space: pre-wrap; " + style }, entry.notes) : null;
    if (entry.type === "person") {
      const img = safeImage(entry.image);
      card.append(
        img ? h("img", { src: img, class: "profile-img-preview", style: "margin: 0 auto 15px auto; display:block;", alt: "" }) : null,
        h("div", { class: "card-title", style: "text-align:center;" }, entry.name || "Unknown"),
        h("div", { class: "card-subtitle", style: "text-align:center;" }, `${entry.relation || "Unknown"} • ${entry.age || "?"}`),
        h("div", { class: "card-meta", style: "justify-content:center;" },
          entry.likes ? h("span", { class: "tag" }, `Likes: ${String(entry.likes).substring(0, 15)}...`) : null,
          entry.dislikes ? h("span", { class: "tag" }, `Dislikes: ${String(entry.dislikes).substring(0, 15)}...`) : null),
        notes("margin-top:15px; border-top:1px solid var(--border-light); padding-top:15px;"));
    } else {
      card.append(
        h("div", { class: "card-title" }, entry.title || "Untitled Lore"),
        h("div", { class: "card-subtitle" }, entry.category || "Lore"),
        notes(""));
    }
    grid.appendChild(card);
  }
};

const personImgInput = document.getElementById("person-image");
if (personImgInput) {
  personImgInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5242880) { alert("Image exceeds 5MB limit. Please upload a smaller portrait."); return; }
    try {
      base64ImageCache = await window.compressImage(file);
      const preview = document.getElementById("person-img-preview");
      preview.src = base64ImageCache;
      preview.classList.remove("hidden");
    } catch (err) { alert("Image compression failed."); }
  });
}

const tabPerson = document.getElementById("tab-btn-person");
const tabLore = document.getElementById("tab-btn-lore");
if (tabPerson && tabLore) {
  tabPerson.addEventListener("click", () => {
    tabLore.classList.remove("active"); tabPerson.classList.add("active");
    document.getElementById("input-pane-lore").classList.add("hidden");
    document.getElementById("input-pane-person").classList.remove("hidden");
  });
  tabLore.addEventListener("click", () => {
    tabPerson.classList.remove("active"); tabLore.classList.add("active");
    document.getElementById("input-pane-person").classList.add("hidden");
    document.getElementById("input-pane-lore").classList.remove("hidden");
  });
}

const CODEX_FIELDS = ["person-name", "person-birthdate", "person-age", "person-relation", "person-likes", "person-dislikes", "lore-title", "lore-category", "codex-notes"];
const btnSaveCodex = document.getElementById("btn-save-codex");

// The original UI had no way to delete a Codex entry. Add a Delete button next to Save.
function codexDeleteButton() {
  let b = document.getElementById("btn-delete-codex");
  if (!b && btnSaveCodex) {
    b = h("button", { id: "btn-delete-codex", type: "button", class: "btn-secondary btn-danger hidden" }, "Delete");
    btnSaveCodex.parentElement.append(b);
    b.addEventListener("click", () => {
      if (!activeCodexId || !confirm("Delete this Codex entry? This cannot be undone.")) return;
      sanctuaryData.codex = sanctuaryData.codex.filter((e) => e.id !== activeCodexId);
      window.markDeleted(activeCodexId);
      document.getElementById("modal-codex").classList.add("hidden");
      pushNow(); renderCodex();
    });
  }
  return b;
}

const btnAddCodex = document.getElementById("btn-add-codex");
if (btnAddCodex) {
  btnAddCodex.addEventListener("click", () => {
    activeCodexId = null; base64ImageCache = "";
    document.getElementById("person-img-preview").classList.add("hidden");
    CODEX_FIELDS.forEach((id) => { document.getElementById(id).value = ""; });
    const d = codexDeleteButton(); if (d) d.classList.add("hidden");
    document.getElementById("modal-codex").classList.remove("hidden");
  });
}
const btnCloseCodex = document.getElementById("btn-close-codex");
if (btnCloseCodex) btnCloseCodex.addEventListener("click", () => document.getElementById("modal-codex").classList.add("hidden"));

const editCodexEntry = (entry) => {
  activeCodexId = entry.id;
  CODEX_FIELDS.forEach((id) => { document.getElementById(id).value = ""; });
  document.getElementById("codex-notes").value = entry.notes || "";
  if (entry.type === "person") {
    tabPerson.click();
    document.getElementById("person-name").value = entry.name || "";
    document.getElementById("person-age").value = entry.age || "";
    document.getElementById("person-relation").value = entry.relation || "";
    document.getElementById("person-likes").value = entry.likes || "";
    document.getElementById("person-dislikes").value = entry.dislikes || "";
    const img = safeImage(entry.image);
    const preview = document.getElementById("person-img-preview");
    base64ImageCache = img || "";
    if (img) { preview.src = img; preview.classList.remove("hidden"); } else preview.classList.add("hidden");
  } else {
    tabLore.click();
    document.getElementById("lore-title").value = entry.title || "";
    document.getElementById("lore-category").value = entry.category || "";
  }
  const d = codexDeleteButton(); if (d) d.classList.remove("hidden");
  document.getElementById("modal-codex").classList.remove("hidden");
};

if (btnSaveCodex) {
  btnSaveCodex.addEventListener("click", () => {
    const isPerson = tabPerson.classList.contains("active");
    const val = (id) => document.getElementById(id).value.trim();
    const newEntry = { id: activeCodexId || `CDX-${Date.now()}`, type: isPerson ? "person" : "lore", notes: val("codex-notes") };
    if (isPerson) {
      Object.assign(newEntry, { name: val("person-name") || "Unknown", age: val("person-age"), relation: val("person-relation"),
        likes: val("person-likes"), dislikes: val("person-dislikes"), image: base64ImageCache });
    } else {
      Object.assign(newEntry, { title: val("lore-title") || "Untitled Lore", category: val("lore-category") });
    }
    stampUpdated(newEntry);
    const idx = activeCodexId ? sanctuaryData.codex.findIndex((e) => e.id === activeCodexId) : -1;
    if (idx > -1) sanctuaryData.codex[idx] = newEntry; else sanctuaryData.codex.push(newEntry);   // old code wrote array["-1"] here
    document.getElementById("modal-codex").classList.add("hidden");
    pushNow(); renderCodex();
  });
}

// --- 3. LISTS MODULE ---
const renderLists = () => {
  const container = document.getElementById("lists-container");
  if (!container) return;
  container.replaceChildren();
  for (const list of sanctuaryData.lists) {
    const card = h("div", { class: "card", style: "cursor: default;" });
    const ul = h("ul", { class: "checklist" });
    const row = (item, index, done) => {
      const box = h("div", { class: done ? "check-box done" : "check-box" }, done ? "✓" : null);
      box.addEventListener("click", () => toggleListItem(list.id, index));
      return h("li", { class: done ? "check-item done" : "check-item", style: done ? "opacity:0.6; text-decoration:line-through;" : null }, box, h("span", {}, item.text));
    };
    list.items.forEach((item, i) => { if (!item.done) ul.append(row(item, i, false)); });
    const completed = list.items.filter((i) => i.done).length;
    if (completed) ul.append(h("div", { style: "margin:15px 0 10px 0; border-top:1px solid var(--border-light); padding-top:10px; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;" }, `${completed} Completed`));
    list.items.forEach((item, i) => { if (item.done) ul.append(row(item, i, true)); });

    const input = h("input", { type: "text", class: "input-minimal", style: "margin:0; padding:5px; flex:1;", placeholder: "+ Add new item" });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) handleNewListItem(input, list.id); });
    const del = h("button", { class: "btn-text-only btn-danger", style: "margin:0; font-size:0.75rem;" }, "Delete");
    del.addEventListener("click", () => deleteList(list.id));
    card.append(h("div", { class: "card-title" }, list.title || "Untitled List"), ul,
      h("div", { style: "margin-top:15px; display:flex; gap:10px; align-items:center; border-top:1px solid var(--border-light); padding-top:15px;" }, input, del));
    container.appendChild(card);
  }
};

const toggleListItem = (listId, i) => {
  const list = sanctuaryData.lists.find((l) => l.id === listId);
  if (!list || !list.items[i]) return;
  list.items[i].done = !list.items[i].done;
  stampUpdated(list); pushNow(); renderLists();
};
const handleNewListItem = (input, listId) => {
  const text = input.value.trim();
  const list = sanctuaryData.lists.find((l) => l.id === listId);
  if (!text || !list) return;
  list.items.push({ text, done: false });
  stampUpdated(list); pushNow(); renderLists();
};
const deleteList = (id) => {
  if (!confirm("Delete this entire list?")) return;
  sanctuaryData.lists = sanctuaryData.lists.filter((l) => l.id !== id);
  window.markDeleted(id); pushNow(); renderLists();
};

const btnAddList = document.getElementById("btn-add-list");
if (btnAddList) btnAddList.addEventListener("click", () => document.getElementById("modal-list").classList.remove("hidden"));
const btnCloseList = document.getElementById("btn-close-list");
if (btnCloseList) btnCloseList.addEventListener("click", () => document.getElementById("modal-list").classList.add("hidden"));
const btnSaveList = document.getElementById("btn-save-list");
if (btnSaveList) {
  btnSaveList.addEventListener("click", () => {
    const title = document.getElementById("list-title").value.trim() || "Untitled List";
    const first = document.getElementById("list-first-item").value.trim();
    const newList = stampUpdated({ id: `LST-${Date.now()}`, title, items: first ? [{ text: first, done: false }] : [] });
    sanctuaryData.lists.push(newList);
    document.getElementById("list-title").value = "";
    document.getElementById("list-first-item").value = "";
    document.getElementById("modal-list").classList.add("hidden");
    pushNow(); renderLists();
  });
}

// --- 4. THOUGHTS & ARCHIVE MODULE ---
// Syncs the heart button with what is already archived for today (the old code reset it to "unliked" on every unlock).
const syncQuoteLikeFromVault = () => {
  if (!window.currentDailyQuote) return;
  const today = new Date().toLocaleDateString();
  const a = sanctuaryData.thoughts.find((t) => t.type === "quote" && t.dateStr === today);
  if (a) { window.currentDailyQuote.liked = !!a.liked; if (window.setQuoteLikedUI) window.setQuoteLikedUI(!!a.liked); }
};
window.archiveDailyQuote = () => {
  const q = window.currentDailyQuote;
  if (!q) return;
  const today = new Date().toLocaleDateString();
  const existing = sanctuaryData.thoughts.find((t) => t.type === "quote" && t.dateStr === today);
  if (!existing) {
    sanctuaryData.thoughts.push(stampUpdated({ id: `QT-${Date.now()}`, type: "quote", text: q.text, author: q.author,
      liked: !!q.liked, dateStr: today, timestamp: new Date().toISOString() }));
    pushNow();
  } else if (!!q.liked !== !!existing.liked) {
    existing.liked = !!q.liked; stampUpdated(existing); pushNow();
  }
  renderThoughts();
};

const heartSvg = (color, filled) => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  for (const [k, v] of Object.entries({ width: 16, height: 16, viewBox: "0 0 24 24", fill: filled ? color : "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" })) svg.setAttribute(k, v);
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z");
  svg.append(p);
  return svg;
};

const renderThoughts = () => {
  const feed = document.getElementById("thoughts-feed");
  if (!feed) return;
  feed.replaceChildren();
  const sorted = [...sanctuaryData.thoughts].sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
  for (const t of sorted) {
    const card = h("div", { class: "card", style: "cursor: default;" });
    if (t.type === "quote") {
      const color = t.liked ? "#E06C75" : "var(--text-muted)";
      card.append(
        h("div", { style: "display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;" },
          h("div", { class: "card-subtitle", style: "margin:0;" }, `Archived Quote • ${t.dateStr}`), heartSvg(color, !!t.liked)),
        h("div", { class: "card-body", style: "font-size:1.15rem; font-style:italic;" }, `"${t.text}"`),
        h("div", { class: "card-meta", style: "margin-top:15px; color:var(--text-muted); font-size:0.85rem;" }, `— ${t.author}`));
    } else {
      const del = h("button", { class: "btn-text-only btn-danger", style: "margin-top:15px; font-size:0.75rem;" }, "Delete");
      del.addEventListener("click", () => deleteThought(t.id));
      card.append(h("div", { class: "card-subtitle" }, `Quick Thought • ${new Date(t.timestamp).toLocaleDateString("en-GB")}`),
        h("div", { class: "card-body", style: "white-space: pre-wrap;" }, t.text), del);
    }
    feed.appendChild(card);
  }
};

const deleteThought = (id) => {
  if (!confirm("Discard this thought?")) return;
  sanctuaryData.thoughts = sanctuaryData.thoughts.filter((t) => t.id !== id);
  window.markDeleted(id); pushNow(); renderThoughts();
};

const btnSaveThought = document.getElementById("btn-save-thought");
if (btnSaveThought) {
  btnSaveThought.addEventListener("click", () => {
    const input = document.getElementById("quick-thought-input");
    const text = input.value.trim();
    if (!text) return;
    sanctuaryData.thoughts.push({ id: `THT-${Date.now()}`, type: "personal", text, timestamp: new Date().toISOString() });
    input.value = "";
    pushNow(); renderThoughts();
  });
}

// --- CLOUD EVENT HOOKS ---
const renderAll = () => { renderJournalHistory(); renderCodex(); renderLists(); renderThoughts(); };

window.addEventListener("vaultMerged", renderAll);   // another device changed something

window.addEventListener("cloudDataLoaded", () => {
  syncQuoteLikeFromVault();
  window.archiveDailyQuote();
  renderAll();
  if (sanctuaryData.journal.length > 0 && !activeJournalId) {
    const first = [...sanctuaryData.journal].sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))[0];
    activeJournalId = first.id;
    document.getElementById("entry-title").value = first.title || "";
    setBody(first.content);
    document.getElementById("btn-delete-entry").classList.remove("hidden");
    renderJournalHistory();
  } else if (!activeJournalId) {
    const btn = document.getElementById("btn-new-entry");
    if (btn) btn.click();
  }
});
