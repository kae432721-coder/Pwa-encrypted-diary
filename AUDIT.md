# Security & bug audit

Reviewed: `js/app.js`, `js/cloud.js`, `js/modules.js`, `sw.js`, `manifest.json`, `index.html`.
Every item marked ✔ was reproduced against the old code and verified fixed (`tests/`, `poc/`).

## Critical

| # | Finding | Proof | Fix |
|---|---|---|---|
| 1 ✔ | **Fails open to plaintext.** `encryptText` returned the plaintext when encryption threw; `btoa(String.fromCharCode(...bytes))` throws `RangeError` above ~100 KB (two Codex portraits are enough). `pushToDrive` then uploaded the diary unencrypted, and `decryptText` accepts non-`ENC:` data, so you would never notice. | `poc/poc_plaintext_fallback.mjs` | Chunked base64; encryption **throws** instead of returning plaintext. |
| 2 ✔ | **Stored XSS → master-password theft.** User data is concatenated into `innerHTML` (thoughts, codex, lists, journal titles, image `src`) and inline `onclick="…('${id}')"`. A script reads the global `activeKey`. | `poc/poc_xss_key_theft.cjs`, `poc/xss-payloads.txt` | All rendering via `textContent`/DOM nodes, image URLs allow-listed, journal body sanitised, CSP, no inline handlers, keys moved into a closure (not a global). |
| 3 ✔ | **Unauthenticated vault accepted.** `decryptText` returns any non-`ENC:` payload as-is. Anyone with write access to the Drive file (compromised Google account, shared link) can inject data — and, with #2, XSS — *without knowing your key*. | `tests/crypto.test.mjs` | Plaintext is refused unless you explicitly confirm; the header is authenticated (AAD). |
| 4 ✔ | **Journal text was never saved.** `#entry-body` is a `contenteditable` `<div>` but the code used `.value` (textarea API). | stored content `""` in old code | `getBody()/setBody()` + sanitiser. |
| 5 ✔ | **Silent data loss on a failed download.** `pullFromDrive` did not check `res.ok`; an error left an empty vault marked "ready", and the next autosave overwrote your real vault with it. | code review | Every Drive call checks the status and throws; a failed unlock never marks the vault ready. |

## High / Medium

* **"Lock" didn't lock** — `sessionStorage.sanctuaryUnlocked` survived the reload, so the app showed the workspace without any vault loaded (and edits were silently not synced). Removed; lock now flushes unsynced changes, wipes memory, reloads.
* **Token expiry** — Google tokens last ~1 h; afterwards every save failed silently while you kept typing. Now: silent refresh on 401, retry with back-off, "Reconnect needed" status, `beforeunload` warning when unsynced.
* **Overlapping saves / two devices** — concurrent `PATCH`es raced and the last writer silently deleted the other device's changes. Saves are serialised, the remote version is checked, and divergent copies are merged (newest wins per item, deletions are tombstoned).
* **Weak KDF** — 100 k PBKDF2 iterations and the key was re-derived on every autosave (slow, battery-draining). Now 600 k, derived once per unlock.
* **Key change reported success on failure** (`pushToDrive` swallowed errors) — now verified, and rolled back on failure.
* **No password confirmation on vault creation** — one typo = vault locked forever. Confirmation field + 8-char minimum for new/changed passwords.
* **Codex `idx = -1`** wrote `array["-1"]`; **no way to delete Codex entries** (added); **quote "like"** was never saved and was reset on every unlock; list items used `onkeypress` (broken on Android IME).
* **Empty `sw.js`** — not actually offline-capable. Now a network-first same-origin cache that never touches Google requests.
* **Remote icons** — `manifest.json` used a Google *image-search thumbnail* and `index.html` a flaticon URL: breaks offline/install and leaks a request to a third party. Local icons added.
* `user-scalable=no` blocks pinch-zoom (accessibility) — removed. Toolbar said "Live Markdown Engine" but it is rich text.
* **Performance** — 1 200 stroked particles/frame (now 400 on phones, off for *reduced motion*), the orbs loop kept running forever behind the app, and the snow canvas reset on every keyboard open.
* Canvas re-encoding already stripped EXIF/GPS from portraits (👍) — kept; PNG transparency now becomes white rather than black.

## Honest remaining limitations
* Rollback of an older valid file is not detectable without server-side state.
* A script that runs in the page (e.g. a malicious browser extension) can still call the app's own functions while unlocked.
* Google Drive keeps old versions of the file; "burn" is not forensic deletion.
* The OAuth `userinfo.email` scope is only used to print "Signed in as…"; remove it from `cloud.js` if you want a smaller consent screen.
* GIS is loaded from Google without Subresource Integrity (Google changes it; SRI would break sign-in).

## What is genuinely good (credit where due)
AES-GCM with random IV and salt per message, `drive.file` (not full Drive) scope, a pure-client architecture with no server to breach, EXIF stripping via canvas, non-extractable CryptoKeys, a tidy modular split, clear UX copy, and a lovely visual design.
