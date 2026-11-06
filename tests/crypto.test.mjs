// Run: node tests/crypto.test.mjs   (Node >= 18). Extracts the crypto + merge code from js/cloud.js.
import fs from "fs";
import assert from "assert/strict";
const src = fs.readFileSync(new URL("../js/cloud.js", import.meta.url), "utf8");
const crypto_part = src.slice(src.indexOf("// <crypto-start>"), src.indexOf("// <crypto-end>"));
const merge_part = src.slice(src.indexOf("const COLLECTIONS"), src.indexOf("window.touch"));
const code = crypto_part + "\n" + merge_part;
const api = new Function("crypto", "TextEncoder", "TextDecoder", "btoa", "atob",
  code + "; return {newSession,encryptWithSession,decryptWithPassword,decryptWithSession,mergeVaults,normalizeVault,PREFIX_V2};")
  (globalThis.crypto, TextEncoder, TextDecoder, btoa, atob);
const T = [];
const t = (n, f) => T.push([n, f]);

// legacy v1 encryptor copied from the ORIGINAL code, to prove old vaults still open
async function legacyEncrypt(text, pw) {
  const e = new TextEncoder(), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const m = await crypto.subtle.importKey("raw", e.encode(pw), "PBKDF2", false, ["deriveKey"]);
  const k = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, m, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, e.encode(text)));
  const p = new Uint8Array(28 + ct.length); p.set(salt); p.set(iv, 16); p.set(ct, 28);
  return "ENC:" + btoa(String.fromCharCode(...p));
}

t("roundtrip", async () => {
  const s = await api.newSession("correct horse"); const c = await api.encryptWithSession("héllo 日記", s);
  assert(c.startsWith("ENC2:")); assert.equal((await api.decryptWithPassword(c, "correct horse")).text, "héllo 日記");
});
t("LARGE vault (the bug that leaked plaintext) is encrypted", async () => {
  const s = await api.newSession("pw-pw-pw-pw"); const big = "A".repeat(3_000_000);
  const c = await api.encryptWithSession(big, s); assert(c.startsWith("ENC2:"));
  assert.equal((await api.decryptWithPassword(c, "pw-pw-pw-pw")).text.length, big.length);
});
t("wrong password rejected", async () => {
  const s = await api.newSession("right-right"); const c = await api.encryptWithSession("x", s);
  await assert.rejects(api.decryptWithPassword(c, "wrong-wrong"), /DECRYPTION_FAILED/);
});
t("ciphertext bit-flip rejected", async () => {
  const s = await api.newSession("right-right"); const c = await api.encryptWithSession("secret", s);
  const raw = atob(c.slice(5)).split(""); raw[raw.length - 3] = String.fromCharCode(raw[raw.length - 3].charCodeAt(0) ^ 1);
  await assert.rejects(api.decryptWithPassword("ENC2:" + btoa(raw.join("")), "right-right"), /DECRYPTION_FAILED/);
});
t("header (iterations/salt) is authenticated", async () => {
  const s = await api.newSession("right-right"); const c = await api.encryptWithSession("secret", s);
  const raw = atob(c.slice(5)).split(""); raw[5] = String.fromCharCode(raw[5].charCodeAt(0) ^ 1); // flip a salt bit
  await assert.rejects(api.decryptWithPassword("ENC2:" + btoa(raw.join("")), "right-right"), /DECRYPTION_FAILED/);
});
t("absurd iteration count rejected (DoS guard)", async () => {
  const s = await api.newSession("right-right"); const c = await api.encryptWithSession("x", s);
  const raw = atob(c.slice(5)).split(""); raw[0] = "\xff";
  await assert.rejects(api.decryptWithPassword("ENC2:" + btoa(raw.join("")), "right-right"), /DECRYPTION_FAILED/);
});
t("unauthenticated plaintext is refused unless explicitly allowed", async () => {
  await assert.rejects(api.decryptWithPassword('{"thoughts":[]}', "pw"), /PLAINTEXT_VAULT/);
  assert.equal((await api.decryptWithPassword('{"a":1}', "pw", true)).text, '{"a":1}');
});
t("legacy ENC: vault still opens and upgrades to a v2 session", async () => {
  const old = await legacyEncrypt('{"journal":[]}', "oldpass-1"); const r = await api.decryptWithPassword(old, "oldpass-1");
  assert.equal(r.text, '{"journal":[]}'); assert.equal(r.session.iterations, 600000);
});
t("decryptWithSession works without the password, and detects other salts", async () => {
  const s = await api.newSession("pw-pw-pw-pw"); const c = await api.encryptWithSession("hi", s);
  assert.equal(await api.decryptWithSession(c, s), "hi");
  const other = await api.newSession("pw-pw-pw-pw");
  await assert.rejects(api.decryptWithSession(c, other), /KEY_CONTEXT_MISMATCH/);
});
t("encrypt never fails open", async () => {
  await assert.rejects(api.encryptWithSession("x", null), /ENCRYPT_PRECONDITION/);
});
t("merge: union, newest wins, tombstones win", () => {
  const A = { journal: [{ id: "a", content: "old", timestamp: "2026-01-01T00:00:00Z" }, { id: "dead", timestamp: "2026-01-01T00:00:00Z" }], deleted: {} };
  const B = { journal: [{ id: "a", content: "new", timestamp: "2026-02-01T00:00:00Z" }, { id: "b", timestamp: "2026-01-01T00:00:00Z" }], deleted: { dead: 1 } };
  const m = api.mergeVaults(A, B);
  assert.deepEqual(m.journal.map((x) => x.id).sort(), ["a", "b"]);
  assert.equal(m.journal.find((x) => x.id === "a").content, "new");
});
t("normalizeVault drops junk", () => {
  const n = api.normalizeVault({ journal: [null, 5, { id: 1 }, { id: "ok" }], lists: [{ id: "l" }], deleted: [] });
  assert.equal(n.journal.length, 1); assert.deepEqual(n.lists[0].items, []); assert.deepEqual(n.deleted, {});
});

let fail = 0;
for (const [n, f] of T) { try { await f(); console.log("ok  ", n); } catch (e) { fail++; console.log("FAIL", n, "\n    ", e.message); } }
console.log(fail ? `\n${fail} FAILED` : `\nall ${T.length} passed`); process.exit(fail ? 1 : 0);
