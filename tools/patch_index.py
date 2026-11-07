#!/usr/bin/env python3
"""Patch index.html in place (idempotent). Usage: python3 tools/patch_index.py [index.html]"""
import re, sys
path = sys.argv[1] if len(sys.argv) > 1 else "index.html"
s = open(path, encoding="utf-8").read()
orig = s

CSP = ("default-src 'self'; "
       "script-src 'self' https://accounts.google.com/gsi/client; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style; "
       "font-src https://fonts.gstatic.com; "
       "img-src 'self' data:; "
       "connect-src 'self' https://www.googleapis.com https://accounts.google.com; "
       "frame-src https://accounts.google.com; "
       "object-src 'none'; base-uri 'none'; form-action 'none'")

def sub(label, pattern, repl, flags=0):
    global s
    new, n = re.subn(pattern, repl, s, count=1, flags=flags)
    print(("patched  " if n else "skipped  ") + label)
    s = new

if "Content-Security-Policy" not in s:
    sub("add CSP + no-referrer", r'(<meta\s+charset="UTF-8">)',
        r'\1\n<meta http-equiv="Content-Security-Policy" content="' + CSP + r'">\n<meta name="referrer" content="no-referrer">')
else:
    print("skipped  CSP (already present)")

sub("viewport: allow pinch-zoom + draw under phone notches",
    r'<meta name="viewport" content="(?![^"]*viewport-fit)[^"]*">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">')
sub("link ui.css after styles.css",
    r'(<link rel="stylesheet" href="styles\.css">)(?![\s\S]*ui\.css)',
    r'\1\n<link rel="stylesheet" href="ui.css">')
sub("load js/ui.js after app.js",
    r'(<script src="js/app\.js"></script>)(?![\s\S]*js/ui\.js)',
    r'\1\n<script src="js/ui.js"></script>')
sub("apple-touch-icon: use local icon instead of hot-linked flaticon",
    r'<link rel="apple-touch-icon" href="https?://[^"]*">',
    '<link rel="apple-touch-icon" href="icons/icon-192.png">\n<link rel="icon" type="image/png" href="icons/icon-192.png">')
sub("toolbar label was wrong (it is not Markdown)",
    r'Live Markdown Engine', 'Rich Text')
sub("password field: let the OS know it is a password",
    r'(id="diary-password"[^>]*?)autocomplete="off"', r'\1autocomplete="current-password"')

if s != orig:
    import os
    if not os.path.exists(path + ".bak"):
        open(path + ".bak", "w", encoding="utf-8").write(orig)
    open(path, "w", encoding="utf-8").write(s)
    print(f"\nwrote {path} (backup: {path}.bak)")
else:
    print("\nno changes needed")
