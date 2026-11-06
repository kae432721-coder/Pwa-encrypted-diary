# Proof-of-concepts (for the OLD code)

Run these against the commit *before* the fixes to see the bugs, and against the fixed code to see them gone.

```bash
# Termux
pkg install nodejs git
git worktree add /tmp/old <old-commit-hash>           # e.g. git log --oneline  -> pick the last commit before the fix
git show <old-commit-hash>:js/cloud.js > /tmp/old_cloud.js
node poc/poc_plaintext_fallback.mjs /tmp/old_cloud.js  # vault is uploaded UNENCRYPTED when large
node poc/poc_plaintext_fallback.mjs js/cloud.js        # (fixed file: prints a note, see below)
# XSS + key theft needs a headless browser (desktop/CI): npm i playwright && npx playwright install chromium
node poc/poc_xss_key_theft.cjs /tmp/old
```

`xss-payloads.txt` has strings you can paste into *Thoughts*, a *Codex* name, or a *list* title in the old app to
see the same thing by hand (an alert box shows the master password).
