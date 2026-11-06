// PoC #2 - the old encryptText() silently returns PLAINTEXT when encryption throws,
// and pushToDrive() then uploads it. Triggered by any vault > ~100 KB (e.g. two portraits in the Codex).
//   node poc/poc_plaintext_fallback.mjs <path to OLD cloud.js>
// (git show <old-commit>:js/cloud.js > /tmp/old_cloud.js)
import fs from "fs";
const file = process.argv[2] || "js/cloud.js";
const src = fs.readFileSync(file, "utf8").split("\n");
const start = src.findIndex((l) => l.includes("async function getCryptoKey"));
const end = src.findIndex((l) => /^async function decryptText/.test(l));
let endFn = end; while (!/^}/.test(src[endFn])) endFn++;
const api = new Function("crypto", "TextEncoder", "TextDecoder", "btoa", "atob",
  src.slice(start, endFn + 1).join("\n") + "; return {encryptText};")(globalThis.crypto, TextEncoder, TextDecoder, btoa, atob);
const log = console.error; console.error = () => {};
for (const [label, size] of [["small vault", 1000], ["vault with photos (300 KB)", 300000]]) {
  const out = await api.encryptText(JSON.stringify({ diary: "my secret " + "A".repeat(size) }), "pw");
  console.log(label.padEnd(28), out.startsWith("ENC:") ? "encrypted" : "UPLOADED AS PLAINTEXT  <-- vulnerable");
}
console.error = log;
