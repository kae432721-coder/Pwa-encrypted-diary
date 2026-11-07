// Minimal static file server for the tests and proofs of concept.
//
// Security: the request URL is NEVER turned into a file path. At start-up we index the files that exist under
// `root` into a Map (url path -> absolute path); a request can only look a key up in that Map. So "/../../etc/passwd",
// "%2e%2e/", absolute paths, NUL bytes etc. simply miss the Map and get a 404. It listens on 127.0.0.1 only.
const http = require("http"), fs = require("fs"), path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8"
};

function indexFiles(root) {
  const files = new Map();
  (function walk(dir, urlPrefix) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;     // never serve dotfiles / deps
      const abs = path.join(dir, ent.name), url = urlPrefix + "/" + ent.name;
      if (ent.isDirectory()) walk(abs, url);
      else if (ent.isFile()) files.set(url, abs);                                // symlinks are skipped on purpose
    }
  })(path.resolve(root), "");
  return files;
}

function createStaticServer(root) {
  const files = indexFiles(root);
  return http.createServer((req, res) => {
    let name;
    try { name = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
    catch (e) { res.writeHead(400); return res.end(); }
    if (name.endsWith("/")) name += "index.html";
    const file = files.get(name);                                                 // lookup only, no path building
    if (!file) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
}

const listen = (server, port) => new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

module.exports = { createStaticServer, listen };
