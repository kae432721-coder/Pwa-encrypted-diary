#!/data/data/com.termux/files/usr/bin/sh
# Usage (Termux), from inside your clone:  sh tools/apply.sh ~/storage/downloads/sanctuary-fixed.zip
set -e
ZIP="${1:-$HOME/storage/downloads/sanctuary-fixed.zip}"
[ -f "$ZIP" ] || { echo "zip not found: $ZIP"; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "run this inside your Pwa-encrypted-diary clone"; exit 1; }
TMP="$HOME/.sanctuary-apply"          # Termux cannot write to /tmp
rm -rf "$TMP" && mkdir -p "$TMP"
unzip -o "$ZIP" -d "$TMP" >/dev/null
cp -r "$TMP"/. .
rm -rf "$TMP"
python3 tools/patch_index.py index.html
git add -A && git status --short
echo; echo "Review, then:  git commit -m 'UI refresh' && git push"
