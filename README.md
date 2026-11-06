# Sanctuary — an end-to-end encrypted journal (PWA)

A private journal, codex, lists and thoughts archive that runs entirely in your browser and syncs to **your own
Google Drive** as a single encrypted file. There is no server.

## Encryption

| | |
|---|---|
| Cipher | **AES-256-GCM** (authenticated encryption, Web Crypto API) |
| Key derivation | **PBKDF2-HMAC-SHA256**, 600 000 iterations, random 16-byte salt |
| Nonce | fresh random 12-byte IV for every save |
| Integrity | GCM tag + the file header (version, iteration count, salt) is authenticated as AAD |
| Where keys live | derived key is held in memory only (non-extractable `CryptoKey`); the password is not kept after unlock |

> Earlier versions of this README said "Vigenère". That was wrong: the app has always used AES-GCM. (Vigenère is a
> 16th-century cipher that is trivially breakable and is **not** used anywhere.)

Vault file format (`sanctuary_os.json` on Drive): `{"payload": "ENC2:" + base64(iterations(4) | salt(16) | iv(12) | ciphertext+tag)}`.
Old `ENC:` vaults (100 k iterations) are still readable and are upgraded automatically on first unlock.

## What this protects against — and what it doesn't

* ✅ Someone reading your Drive file / Google reading it: they see only ciphertext.
* ✅ Someone editing the file: GCM rejects any change; non-encrypted content is refused (you get a warning).
* ✅ Malicious text inside entries: everything is rendered as text, the journal body goes through an allow-list
  sanitiser, and a Content-Security-Policy blocks inline scripts.
* ❌ **Forgotten password = lost data.** There is no recovery.
* ❌ A weak password can be brute-forced offline by anyone who gets the file. Use a long passphrase (≥ 12 chars).
* ❌ Malware / a compromised phone or browser extension sees your data while the journal is unlocked.
* ❌ Rollback: someone with Drive access could restore an *older* valid copy of the file (they can't read or alter it).
* ❌ "Burning" a page removes it from the current vault, but Google Drive keeps older file versions for a while
  (Drive → right-click the file → *Manage versions*). Delete old versions if that matters.
* ℹ️ Auto-lock after 10 minutes without interaction (only when everything is synced).

## Run it (Termux)

```bash
pkg install git python
git clone https://github.com/kae432721-coder/Pwa-encrypted-diary && cd Pwa-encrypted-diary
python -m http.server 8080 --bind 127.0.0.1      # never use 0.0.0.0 - that exposes it to your whole Wi-Fi
# open http://localhost:8080 in Chrome, then "Add to Home screen"
```

Google sign-in needs an OAuth *Web client ID* whose "Authorized JavaScript origins" include `http://localhost:8080`
(and your https URL if you host it). Put the client ID in `js/cloud.js` (`GOOGLE_CLIENT_ID`). A client ID is public by
design; the origin restriction is what protects it.

## Tests

```bash
node tests/crypto.test.mjs            # crypto + merge logic, no dependencies (Node >= 18)
npm i playwright && node tests/e2e.cjs <site-dir>   # full browser flow with a mocked Google/Drive
```

See `AUDIT.md` for the security review and `poc/` for the proofs of concept against the old code.
