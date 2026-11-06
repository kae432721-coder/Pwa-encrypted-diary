// --- GOOGLE CLOUD CONFIG ---
// (A Google OAuth client ID is public by design. Protect it by restricting
//  "Authorized JavaScript origins" in Google Cloud Console.)
const GOOGLE_CLIENT_ID = "697780392985-iejrson8bir2ol3dvdngipg66k9ni0hs.apps.googleusercontent.com";

const VAULT_FILE_NAME = "sanctuary_os.json";
const MIN_NEW_KEY_LENGTH = 8;            // only enforced for NEW / CHANGED keys
const AUTO_LOCK_MS = 10 * 60 * 1000;     // lock after 10 min without interaction

// Only this global is shared with modules.js. Keys / tokens live inside the
// closure below so an injected script cannot simply read them.
let sanctuaryData = { journal: [], codex: [], lists: [], thoughts: [], deleted: {} };

// ======================================================================
// CRYPTOGRAPHY ENGINE  (AES-256-GCM, key from PBKDF2-HMAC-SHA256)
// ======================================================================
// <crypto-start>
const PBKDF2_ITERATIONS = 600000;        // OWASP 2023 guidance for PBKDF2-SHA256
const MIN_ITER = 100000;
const MAX_ITER = 5000000;                // stops a tampered header from freezing the app
const PREFIX_V1 = "ENC:";                // legacy: 100k iterations, no AAD
const PREFIX_V2 = "ENC2:";               // iterations(4) | salt(16) | iv(12) | ciphertext+tag
const _enc = new TextEncoder();
const _dec = new TextDecoder();

function bytesToB64(bytes) {
  // Chunked: String.fromCharCode(...bigArray) throws RangeError on large vaults.
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function deriveAesKey(password, salt, iterations) {
  const material = await crypto.subtle.importKey("raw", _enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}
// A session = derived key + the salt/iterations that produced it. The password
// itself is NOT kept after unlock.
async function newSession(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt, iterations: PBKDF2_ITERATIONS, key: await deriveAesKey(password, salt, PBKDF2_ITERATIONS) };
}
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
// Never fails open: throws instead of returning plaintext.
async function encryptWithSession(plaintext, session) {
  if (typeof plaintext !== "string" || !session) throw new Error("ENCRYPT_PRECONDITION");
  const iterBytes = new Uint8Array(4);
  new DataView(iterBytes.buffer).setUint32(0, session.iterations);
  const header = concat(iterBytes, session.salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = concat(_enc.encode("ENC2"), header);   // header is authenticated
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad }, session.key, _enc.encode(plaintext)));
  return PREFIX_V2 + bytesToB64(concat(header, iv, ct));
}
// Returns { text, session }. Throws "DECRYPTION_FAILED" or "PLAINTEXT_VAULT".
async function decryptWithPassword(packed, password, allowPlaintext = false) {
  if (typeof packed !== "string") throw new Error("DECRYPTION_FAILED");
  const isV2 = packed.startsWith(PREFIX_V2);
  const isV1 = !isV2 && packed.startsWith(PREFIX_V1);
  if (!isV1 && !isV2) {
    // Unauthenticated data: anyone with write access to the Drive file could have put it there.
    if (!allowPlaintext) throw new Error("PLAINTEXT_VAULT");
    return { text: packed, session: await newSession(password) };
  }
  try {
    const bytes = b64ToBytes(packed.slice(isV2 ? PREFIX_V2.length : PREFIX_V1.length));
    if (isV1) {
      const salt = bytes.slice(0, 16), iv = bytes.slice(16, 28), ct = bytes.slice(28);
      const key = await deriveAesKey(password, salt, 100000);
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return { text: _dec.decode(pt), session: await newSession(password) };   // upgrade to v2
    }
    const header = bytes.slice(0, 20);
    const iterations = new DataView(header.buffer, header.byteOffset, 4).getUint32(0);
    if (iterations < MIN_ITER || iterations > MAX_ITER) throw new Error("bad iterations");
    const salt = header.slice(4, 20), iv = bytes.slice(20, 32), ct = bytes.slice(32);
    const key = await deriveAesKey(password, salt, iterations);
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: concat(_enc.encode("ENC2"), header) }, key, ct);
    return { text: _dec.decode(pt), session: { salt, iterations, key } };
  } catch (e) {
    throw new Error("DECRYPTION_FAILED");
  }
}
// Decrypt with an already-derived key (no password needed). Used when merging a
// remote copy written by another device that shares this vault's salt.
async function decryptWithSession(packed, session) {
  if (typeof packed !== "string" || !packed.startsWith(PREFIX_V2)) throw new Error("DECRYPTION_FAILED");
  let bytes, header;
  try {
    bytes = b64ToBytes(packed.slice(PREFIX_V2.length));
    header = bytes.slice(0, 20);
  } catch (e) { throw new Error("DECRYPTION_FAILED"); }
  const iterations = new DataView(header.buffer, header.byteOffset, 4).getUint32(0);
  const salt = header.slice(4, 20);
  if (iterations !== session.iterations || salt.some((b, i) => b !== session.salt[i])) throw new Error("KEY_CONTEXT_MISMATCH");
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.slice(20, 32), additionalData: concat(_enc.encode("ENC2"), header) },
      session.key, bytes.slice(32));
    return _dec.decode(pt);
  } catch (e) { throw new Error("DECRYPTION_FAILED"); }
}
// <crypto-end>

// ======================================================================
// IMAGE COMPRESSOR (re-encoding through <canvas> also strips EXIF/GPS data)
// ======================================================================
window.compressImage = (file) => new Promise((resolve, reject) => {
  if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return reject(new Error("Unsupported image type"));
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = (event) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Could not decode image"));
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
      else if (height > MAX) { width *= MAX / height; height = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width); canvas.height = Math.round(height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); // PNG transparency -> white, not black
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// ======================================================================
// VAULT STATE + MERGE HELPERS (used by modules.js)
// ======================================================================
const COLLECTIONS = ["journal", "codex", "lists", "thoughts"];
const stamp = (o) => Math.max(o.updated || 0, Date.parse(o.timestamp) || 0);

function normalizeVault(obj) {
  const out = { journal: [], codex: [], lists: [], thoughts: [], deleted: {} };
  if (!obj || typeof obj !== "object") return out;
  for (const c of COLLECTIONS) {
    if (Array.isArray(obj[c])) out[c] = obj[c].filter((x) => x && typeof x === "object" && typeof x.id === "string");
  }
  for (const l of out.lists) if (!Array.isArray(l.items)) l.items = [];
  if (obj.deleted && typeof obj.deleted === "object" && !Array.isArray(obj.deleted)) out.deleted = { ...obj.deleted };
  return out;
}
function mergeVaults(local, remote) {
  const a = normalizeVault(local), b = normalizeVault(remote);
  const tomb = { ...b.deleted, ...a.deleted };
  const out = { deleted: tomb };
  for (const c of COLLECTIONS) {
    const map = new Map();
    for (const item of [...b[c], ...a[c]]) {          // local listed last: wins ties
      if (tomb[item.id]) continue;
      const prev = map.get(item.id);
      if (!prev || stamp(item) >= stamp(prev)) map.set(item.id, item);
    }
    out[c] = [...map.values()];
  }
  return out;
}
window.touch = (obj) => { obj.updated = Date.now(); return obj; };
window.markDeleted = (id) => { sanctuaryData.deleted[id] = Date.now(); };

// ======================================================================
// GOOGLE DRIVE SYNC + AUTH  (all secrets are private to this closure)
// ======================================================================
(() => {
  let gDriveToken = null, gDriveFileId = null, lastRemoteVersion = null;
  let session = null, knownSessions = [], isCloudReady = false;
  let tokenClient = null, refreshing = null, pendingToken = null;
  let dirty = false, syncing = null, retryTimer = null, retryDelay = 5000;
  let lastActive = Date.now();

  const $ = (id) => document.getElementById(id);
  const setStatus = (t) => { const i = $("cloud-indicator"); if (i) i.innerText = "Status: " + t; };
  const DRIVE = "https://www.googleapis.com/drive/v3/files";
  const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
  const setSession = (s) => { session = s; if (s) knownSessions.push(s); };

  // ---------- token handling ----------
  function refreshToken() {
    if (refreshing) return refreshing;
    refreshing = new Promise((resolve, reject) => {
      if (!tokenClient) return reject(new Error("NO_TOKEN_CLIENT"));
      const timer = setTimeout(() => reject(new Error("TOKEN_TIMEOUT")), 60000);
      pendingToken = {
        resolve: (t) => { clearTimeout(timer); resolve(t); },
        reject: (e) => { clearTimeout(timer); reject(e); }
      };
      tokenClient.requestAccessToken({ prompt: "" });
    }).finally(() => { refreshing = null; pendingToken = null; });
    return refreshing;
  }

  async function driveFetch(url, opts = {}, retry = true) {
    const res = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${gDriveToken}` } });
    if (res.status === 401 && retry) {          // Google access tokens expire after ~1 hour
      await refreshToken();
      return driveFetch(url, opts, false);
    }
    if (!res.ok) throw new Error(`Drive HTTP ${res.status}`);
    return res;
  }

  // ---------- Drive file ops ----------
  async function findDriveFile() {
    const qs = new URLSearchParams({
      q: `name='${VAULT_FILE_NAME}' and trashed=false`,
      fields: "files(id,modifiedTime)", orderBy: "modifiedTime desc", spaces: "drive", pageSize: "10"
    });
    const data = await (await driveFetch(`${DRIVE}?${qs}`)).json();
    return data.files && data.files.length ? data.files[0].id : null;
  }
  async function fetchRemote(fileId) {
    const meta = await (await driveFetch(`${DRIVE}/${fileId}?fields=version`)).json();
    const text = await (await driveFetch(`${DRIVE}/${fileId}?alt=media`)).text();
    let payload = null;
    if (text.trim()) {
      try { payload = JSON.parse(text).payload || null; } catch (e) { throw new Error("CORRUPT_REMOTE"); }
    }
    return { payload, version: meta.version };
  }
  async function createDriveFile(contentStr) {
    // One multipart request -> no orphan empty file if a second request fails.
    const b = "sanctuary" + [...crypto.getRandomValues(new Uint8Array(12))].map((x) => x.toString(16).padStart(2, "0")).join("");
    const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: VAULT_FILE_NAME })}\r\n` +
                 `--${b}\r\nContent-Type: application/json\r\n\r\n${contentStr}\r\n--${b}--`;
    const res = await driveFetch(`${UPLOAD}?uploadType=multipart&fields=id,version`, {
      method: "POST", headers: { "Content-Type": `multipart/related; boundary=${b}` }, body });
    return res.json();
  }
  async function decryptRemoteWithKnownKeys(payload) {
    for (const s of [...knownSessions].reverse()) {
      try { return await decryptWithSession(payload, s); }
      catch (e) { if (e.message !== "KEY_CONTEXT_MISMATCH") throw e; }
    }
    throw new Error("REMOTE_KEY_CHANGED");
  }

  // ---------- sync: serialised, retried, conflict-aware ----------
  async function syncOnce() {
    if (gDriveFileId) {
      const meta = await (await driveFetch(`${DRIVE}/${gDriveFileId}?fields=version`)).json();
      if (meta.version !== lastRemoteVersion) {          // another device wrote since we last looked
        const remote = await fetchRemote(gDriveFileId);
        if (remote.payload) {
          const text = await decryptRemoteWithKnownKeys(remote.payload);
          sanctuaryData = mergeVaults(sanctuaryData, JSON.parse(text));
          window.dispatchEvent(new Event("vaultMerged"));
        }
        lastRemoteVersion = remote.version;
      }
    }
    const contentStr = JSON.stringify({ payload: await encryptWithSession(JSON.stringify(sanctuaryData), session) });
    if (!gDriveFileId) {
      const f = await createDriveFile(contentStr);
      gDriveFileId = f.id; lastRemoteVersion = f.version;
    } else {
      const res = await driveFetch(`${UPLOAD}/${gDriveFileId}?uploadType=media&fields=version`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: contentStr });
      lastRemoteVersion = (await res.json()).version;
    }
  }
  function runSync() {
    clearTimeout(retryTimer);
    if (syncing) return syncing;                 // running loop will also pick up newly set dirty flag
    syncing = (async () => {
      let ok = true;
      try {
        setStatus("Syncing...");
        while (dirty) { dirty = false; await syncOnce(); }
        retryDelay = 5000;
        setStatus("Synced");
      } catch (err) {
        ok = false; dirty = true;
        console.error("Sync error:", err);
        if (err.message === "REMOTE_KEY_CHANGED") setStatus("Password changed on another device - lock & unlock");
        else if (/TOKEN|popup|NO_TOKEN/i.test(err.message)) setStatus("Reconnect needed (tap here)");
        else setStatus("Sync failed - retrying");
        if (err.message !== "REMOTE_KEY_CHANGED") {
          retryTimer = setTimeout(runSync, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 120000);
        }
      } finally { syncing = null; }
      return ok;
    })();
    return syncing;
  }
  window.pushToDrive = () => {
    if (!gDriveToken || !isCloudReady || !session) return Promise.resolve(false);
    dirty = true;
    return runSync();
  };
  window.addEventListener("online", () => { if (dirty && isCloudReady) runSync(); });
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- lock / auto-lock ----------
  window.lockVault = async () => {
    if (isCloudReady && (dirty || syncing)) {
      try { await Promise.race([runSync(), new Promise((r) => setTimeout(r, 8000))]); } catch (e) {}
      if (dirty && !confirm("Some changes are not synced yet and will be lost. Lock anyway?")) return;
    }
    dirty = false; session = null; knownSessions = []; gDriveToken = null;
    window.location.reload();
  };
  for (const ev of ["pointerdown", "keydown", "touchstart", "scroll"]) {
    window.addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true, capture: true });
  }
  const idleCheck = () => { if (isCloudReady && !dirty && Date.now() - lastActive > AUTO_LOCK_MS) window.lockVault(); };
  setInterval(idleCheck, 15000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) idleCheck(); });

  // ---------- master key change ----------
  const btnKey = $("btn-confirm-key-change");
  if (btnKey) {
    btnKey.addEventListener("click", async () => {
      if (!session) { alert("Vault is locked."); return; }
      const oldKey = $("old-key").value.trim();
      const newKey = $("new-key").value.trim();
      const newKey2 = $("new-key-confirm").value.trim();
      try {   // verify the old password by actually deriving a key from it
        const probe = await encryptWithSession("probe", session);
        await decryptWithPassword(probe, oldKey);
      } catch (e) { alert("Current password is incorrect."); return; }
      if (newKey.length < MIN_NEW_KEY_LENGTH) { alert(`New password must be at least ${MIN_NEW_KEY_LENGTH} characters.`); return; }
      if (newKey !== newKey2) { alert("New passwords do not match."); return; }

      btnKey.innerText = "Re-encrypting Vault...";
      btnKey.disabled = true;
      const prev = session;
      try {
        setSession(await newSession(newKey));
        if (!(await window.pushToDrive())) throw new Error("push failed");
        alert("Password changed. Your vault has been re-encrypted.");
        for (const id of ["old-key", "new-key", "new-key-confirm"]) $(id).value = "";
      } catch (err) {
        session = prev;     // revert; nothing is lost, the old password still works
        alert("Failed to change password (connection problem). The old password is still active.");
      }
      btnKey.innerText = "Change Password";
      btnKey.disabled = false;
    });
  }

  // ---------- Google sign-in ----------
  function initAuth(attempt = 0) {
    if (window.google && google.accounts && google.accounts.oauth2) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
        callback: async (resp) => {
          if (!resp || !resp.access_token) { if (pendingToken) pendingToken.reject(new Error("TOKEN_ERROR")); return; }
          gDriveToken = resp.access_token;
          if (pendingToken) { pendingToken.resolve(gDriveToken); return; }   // silent refresh
          try {
            const u = await (await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${gDriveToken}` } })).json();
            $("user-email-display").innerText = `Signed in as ${u.email}`;
          } catch (e) { $("user-email-display").innerText = "Signed in."; }
          $("step-google").classList.add("hidden");
          $("step-password").classList.remove("hidden");
          $("diary-password").focus();
        },
        error_callback: (err) => { if (pendingToken) pendingToken.reject(new Error("TOKEN_" + (err && err.type))); }
      });
    } else if (attempt < 50) setTimeout(() => initAuth(attempt + 1), 200);
    else console.error("Google Identity Services script not loaded.");
  }
  initAuth();

  const btnGoogle = $("btn-google-login");
  if (btnGoogle) btnGoogle.addEventListener("click", () => {
    if (tokenClient) tokenClient.requestAccessToken();
    else alert("Google sign-in is still loading or was blocked. Open the app via http://localhost or https.");
  });
  const indicator = $("cloud-indicator");
  if (indicator) indicator.addEventListener("click", () => {
    if (isCloudReady) refreshToken().then(() => runSync()).catch(() => setStatus("Reconnect failed"));
  });

  // ---------- unlock ----------
  function requireConfirmedNewKey(pass) {
    if (pass.length < MIN_NEW_KEY_LENGTH) throw new Error("WEAK_KEY");
    let c = $("diary-password-confirm");
    if (!c) {
      c = document.createElement("input");
      c.type = "password"; c.id = "diary-password-confirm"; c.className = "input-minimal";
      c.placeholder = "Confirm new password..."; c.autocomplete = "off";
      $("diary-password").insertAdjacentElement("afterend", c);
    }
    if (!c.value.trim()) { c.focus(); throw new Error("NEED_CONFIRM"); }
    if (c.value.trim() !== pass) throw new Error("KEY_MISMATCH");
  }

  const btnUnlock = $("btn-unlock");
  if (btnUnlock) {
    const unlock = async () => {
      const passInput = $("diary-password");
      const pass = passInput.value.trim();
      if (!pass || btnUnlock.disabled) return;
      btnUnlock.innerText = "Verifying Vault...";
      btnUnlock.disabled = true;
      try {
        gDriveFileId = await findDriveFile();
        let needsPush = false;
        let remote = null;
        if (gDriveFileId) { remote = await fetchRemote(gDriveFileId); lastRemoteVersion = remote.version; }

        if (remote && remote.payload) {
          let opened;
          try { opened = await decryptWithPassword(remote.payload, pass, false); }
          catch (e) {
            if (e.message !== "PLAINTEXT_VAULT") throw e;
            if (!confirm("The vault on your Drive is NOT encrypted (it may have been tampered with, or saved by an old bug). Load it and encrypt it now?")) throw new Error("CANCELLED");
            opened = await decryptWithPassword(remote.payload, pass, true);
          }
          let parsed;
          try { parsed = JSON.parse(opened.text); } catch (e) { throw new Error("CORRUPT_REMOTE"); }
          sanctuaryData = normalizeVault(parsed);
          setSession(opened.session);
          needsPush = !remote.payload.startsWith(PREFIX_V2);     // migrate old formats
        } else {                                                   // no vault yet (or empty file)
          requireConfirmedNewKey(pass);
          sanctuaryData = normalizeVault(null);
          setSession(await newSession(pass));
          needsPush = true;
        }

        isCloudReady = true;
        if (needsPush && !(await window.pushToDrive())) throw new Error("INITIAL_PUSH_FAILED");

        passInput.value = "";
        const c = $("diary-password-confirm"); if (c) c.value = "";
        $("auth-screen").classList.add("hidden");
        $("quote-screen").classList.remove("hidden");
        window.dispatchEvent(new Event("cloudDataLoaded"));
      } catch (err) {
        isCloudReady = false; session = null; knownSessions = [];
        const m = err.message;
        if (m === "DECRYPTION_FAILED") { alert("Incorrect password for this vault."); passInput.value = ""; }
        else if (m === "NEED_CONFIRM") alert("No vault found for this Google account, so a new one will be created.\n\nRe-enter your password in the new box to confirm. If you forget it, your data can never be recovered.");
        else if (m === "KEY_MISMATCH") alert("The two passwords do not match.");
        else if (m === "WEAK_KEY") alert(`Choose a password of at least ${MIN_NEW_KEY_LENGTH} characters.`);
        else if (m === "CORRUPT_REMOTE") alert("The vault file on Drive is damaged. Nothing was changed. Restore an earlier version from Google Drive (right-click > Manage versions).");
        else if (m === "CANCELLED") { /* user declined */ }
        else { alert("Network error establishing secure connection."); console.error(err); }
      }
      btnUnlock.innerText = "Unlock Journal";
      btnUnlock.disabled = false;
    };
    btnUnlock.addEventListener("click", unlock);
    $("diary-password").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) unlock(); });
  }
})();
