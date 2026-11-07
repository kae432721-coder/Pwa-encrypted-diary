// Path-traversal regression test for tests/static-server.cjs   (node tests/static-server.test.cjs)
const http = require("http"), fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert");
const { createStaticServer, listen } = require("./static-server.cjs");

const raw = (port, p) => new Promise((resolve, reject) => {          // send the path exactly as written (no URL normalisation)
  http.get({ host: "127.0.0.1", port, path: p }, (res) => { let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => resolve({ status: res.statusCode, body: b })); }).on("error", reject);
});

(async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "srv-"));
  const root = path.join(base, "site"); fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, "index.html"), "<h1>hello</h1>");
  fs.writeFileSync(path.join(root, ".secret"), "dotfile");
  fs.writeFileSync(path.join(base, "outside.txt"), "TOP-SECRET-OUTSIDE-ROOT");        // sibling of root: must be unreachable
  const srv = createStaticServer(root); await listen(srv, 8130);
  let fail = 0; const t = (n, c) => { if (!c) fail++; console.log((c ? "ok   " : "FAIL ") + n); };

  t("serves a normal file", (await raw(8130, "/index.html")).body.includes("hello"));
  t("serves / as index.html", (await raw(8130, "/")).status === 200);
  for (const p of ["/../outside.txt", "/../../etc/passwd", "/%2e%2e/outside.txt", "/..%2foutside.txt", "/%2e%2e%2foutside.txt",
                   "/....//outside.txt", "//etc/passwd", "/..\\outside.txt", "/index.html%00.png", "/.secret", "/%2esecret"]) {
    const r = await raw(8130, p);
    t(`blocks ${p}`, r.status !== 200 || (!r.body.includes("TOP-SECRET") && !r.body.includes("root:") && !r.body.includes("dotfile")));
  }
  t("bad escape sequences give 400, not a crash", (await raw(8130, "/%E0%A4%A")).status === 400);
  t("binds to loopback only", srv.address().address === "127.0.0.1");
  srv.close(); fs.rmSync(base, { recursive: true, force: true });
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
