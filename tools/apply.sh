#!/data/data/com.termux/files/usr/bin/sh
# Usage (Termux):  sh tools/apply.sh ~/storage/downloads/sanctuary-fixed.zip
set -e
ZIP="${1:-$HOME/storage/downloads/sanctuary-fixed.zip}"
[ -f "$ZIP" ] || { echo "zip not found: $ZIP"; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "run this inside your Pwa-encrypted-diary clone"; exit 1; }
unzip -o "$ZIP" -d /tmp/sanctuary-fixed >/dev/null
cp -r /tmp/sanctuary-fixed/. .
python3 tools/patch_index.py index.html
git add -A && git status --short
echo; echo "Review with: git diff --cached --stat   then commit & push."
