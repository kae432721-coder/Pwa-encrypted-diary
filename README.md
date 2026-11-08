<p align="center">
  <img src="icons/icon-512.png" width="96" alt="">
</p>

<h1 align="center">Sanctuary</h1>

<p align="center">
  An encrypted journal that lives in your browser and syncs to your own Google Drive.<br>
  No server, no account, no dependencies.
</p>

<br>

Sanctuary is a small progressive web app for private writing: a journal, a codex for people and ideas, lists, and a
place for loose thoughts. Everything is encrypted on the device before it is saved. What reaches Drive is a single
file that is unreadable without your password, to Google or anyone else.

It is plain JavaScript on top of the browser's built-in Web Crypto API. There is no build step and no backend to run
or to breach.

## How it works

```
 text ──> JSON ──> AES-256-GCM ──> "ENC2:..." ──> sanctuary_os.json (your Drive)
                        ^
        key = PBKDF2-SHA256(password, random salt, 600,000 rounds)
```

Your password never leaves the device and is not kept after unlock. Only the derived key stays in memory, as a
non-extractable `CryptoKey`.

| | |
|---|---|
| Cipher | AES-256-GCM |
| Key derivation | PBKDF2-HMAC-SHA256, 600,000 iterations, 16-byte random salt |
| Nonce | random 96-bit IV, new for every save |
| Integrity | GCM tag; the header (version, iterations, salt) is authenticated as additional data |
| On failure | the save fails. It never falls back to plaintext |

The file on Drive looks like this:

```
{"payload": "ENC2:" + base64( iterations[4] | salt[16] | iv[12] | ciphertext + tag )}
```

Vaults written by older versions (`ENC:`, 100,000 iterations) still open and are upgraded on first unlock.

An earlier README described this as Vigenère. That was never true; the app has used AES-GCM from the start.

## Interface

On desktop the sidebar is a persistent rail that collapses to icons and remembers its state. On phones it becomes a
drawer that slides over the page (menu button, swipe from the left edge, or Escape to close). The journal's page list
adapts to the screen: docked beside the editor on wide screens (1400px and up), a flyout over the editor on tablets and
small laptops, and a bottom sheet on phones. The two panels are independent.

The background follows the real time of day (dawn, daylight, golden hour, dusk, night) in both themes, with a soft
vignette, film grain, slow mist and drifting light motes.

By day, sakura petals fall and settle into a pile on the ground. At night there is a moon (a procedurally drawn
waxing gibbous with maria, craters and a faint halo ring, placed 35% across and 15% down), cloud veils that drift
across it, and snow that glitters as it passes through the moonlight. The snow settles into drifts along the bottom.

The scene responds to you and keeps the state you leave it in:

- Move the mouse or a finger and the air swirls around it; snow and petals are dragged along and curl past.
- Drag through the petals lying on the ground and they scatter, flutter, and settle again.
- Drag along the night's snowy ground and you plough a furrow and throw snow into the air; it heals after about 15 s.
- Tap the background and a ripple travels outward through the air, pushing whatever it crosses. Tap the moon and it glows.
- Press and hold to slow time in a bubble around your finger (ground petals float up inside it).
- While you type, the weather calms down so it never competes with your writing.
- On Android, tilting the phone steers the wind.

Settings has an Ambience control (Still, Calm, Lively). Still draws one frame and stops everything, which is the
battery-saver option, and it is the default for people who prefer reduced motion. The engine pauses when the tab is
hidden or the sign-in screen covers it, and sheds particles by itself if the device cannot keep up.

## Design decisions

**Rendering.** User content is only ever inserted as text. The journal body is the one place that holds markup, and
it passes through an allow-list sanitiser. A Content-Security-Policy forbids inline scripts, so a stray `<img onerror>`
has nowhere to run.

**Untrusted storage.** The Drive file is treated as hostile input. Anything that is not authenticated ciphertext is
refused unless you explicitly confirm, and the header cannot be altered without detection.

**Sync.** Saves are serialised and retried with back-off. If another device has written in the meantime, the two
copies are merged per item (newest edit wins, deletions are recorded) instead of one overwriting the other. Expired
Google tokens are refreshed silently.

**Locking.** Lock flushes anything unsynced, drops the keys and reloads the page. The app also locks itself after ten
idle minutes, provided everything is synced.

**Scope.** Sign-in requests `drive.file` only, so the app can see the one file it created and nothing else in your Drive.

Portraits are re-encoded through a canvas on upload, which removes EXIF and location data.

A review of the previous version, with proofs of concept, is in [AUDIT.md](AUDIT.md) and [poc/](poc/).

## Running it

Termux:

```bash
pkg install git python
git clone https://github.com/kae432721-coder/Pwa-encrypted-diary
cd Pwa-encrypted-diary
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://localhost:8080` in Chrome and choose Add to Home screen. Keep the bind address at `127.0.0.1`;
`0.0.0.0` would expose the server to everyone on your network.

Google sign-in needs an OAuth client ID of type Web application, with `http://localhost:8080` (and your https URL, if
you host it) listed under Authorized JavaScript origins. Put the ID in `GOOGLE_CLIENT_ID` at the top of `js/cloud.js`.
A client ID is public by design; the origin list is what protects it.

## Layout

```
index.html        interface and CSP
styles.css        base styles and theme variables
ui.css            interface layer: sidebar rail/drawer, atmosphere, cards, sheets, mobile
sw.js             network-first offline cache, same-origin only
manifest.json
icons/
js/
  cloud.js        crypto, Drive sync, sign-in, locking
  modules.js      journal, codex, lists, thoughts
  app.js          daily quote, themes, orbs on the sign-in screen
  ambience.js     snow and petals you can touch (levels, adaptive, pauses when hidden)
  ui.js           sidebar (rail on desktop, drawer on phones), pages sheet, time-of-day background, sync status
tests/            unit and browser tests
poc/              exploit demos against the old version
tools/            patch helpers
```

## Tests

```bash
node tests/crypto.test.mjs                 # no dependencies, Node 18+
npm i playwright && node tests/e2e.cjs .   # headless browser with mocked Google and Drive
node tests/ui.cjs .                        # sidebar, drawer, bottom sheet and swipe behaviour
node tests/ambience.cjs .                  # moon, snow, petals: touch, ground, ripples, hold, typing calm, levels, reduced motion
node tests/static-server.test.cjs          # the test web server cannot be tricked into reading outside its folder
```

The unit tests cover round trips, a 3 MB vault, wrong passwords, bit-flips in the ciphertext and the header, the
iteration-count limit, refusal of plaintext, migration of old vaults, and the merge rules.

## Limits

There is no password recovery. If you forget it, the data is gone.

A short password can be brute-forced offline by anyone who obtains the file. Use a passphrase of twelve characters or
more.

While the journal is unlocked, malware or a hostile browser extension can read it.

Someone with access to your Drive could put back an older valid copy of the file. They cannot read or change it.

Deleting a page removes it from the vault, but Drive keeps earlier versions of the file for a while. Remove them under
Manage versions if that matters to you.

## Contributing

Run both test suites before opening a pull request. Do not put user data into `innerHTML`; build elements with the
`h()` helper in `js/modules.js`.
