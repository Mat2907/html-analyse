// Smoke-Test für den Word-Export der Hefteinträge (node tools/smoke_word.mjs).
// Lädt daten.js + 00_basis.js + 40_word.js mit minimalen Browser-Stubs und
// prüft, dass LK.wordHeft ein gültiges .docx (ZIP, unkomprimiert) erzeugt.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const el = () => ({ content: { querySelector: () => null }, style: {}, click() {}, remove() {}, appendChild() {}, setAttribute() {} });
const ctx = {
  console, setTimeout, clearTimeout, Promise, Blob, TextEncoder,
  Uint8Array, Uint32Array, DataView, ArrayBuffer,
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  XMLSerializer: class { serializeToString() { return "<svg/>"; } },
  Image: class {},
  document: {
    createElement: el,
    head: { appendChild() {} },
    body: { appendChild() {} },
    documentElement: { classList: { add() {}, remove() {}, toggle() { return false; } } },
    addEventListener() {},
    querySelector: () => null,
    getElementById: () => null,
  },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  matchMedia: () => ({ matches: false }),
  location: { href: "" },
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["js/lehrer/daten.js", "js/lehrer/00_basis.js", "js/lehrer/40_word.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
}
const LK = ctx.window.LK;
if (!LK || !LK.wordHeft) throw new Error("LK.wordHeft fehlt – wurde 40_word.js geladen?");

async function check(raum, nr, mitNotizen, mussEnthalten) {
  const name = await LK.wordHeft(raum, nr, mitNotizen);
  const { blob } = LK.wordLetzte;
  if (!blob || blob.size < 2000) throw new Error(`docx zu klein: ${blob && blob.size} bytes`);
  const s = Buffer.from(await blob.arrayBuffer()).toString("latin1");
  for (const teil of ["[Content_Types].xml", "word/document.xml", "word/styles.xml", ...mussEnthalten]) {
    if (!s.includes(teil)) throw new Error(`docx enthält nicht: ${teil}`);
  }
  console.log(`OK  wordHeft(${raum}, ${nr}, ${mitNotizen}) -> ${name} (${blob.size} bytes)`);
}

await check("strom1", 1, true, ["Elektrischer Strom", "Vortragsnotizen"]);
await check("strom1", "alle", false, ["Elektrischer Strom"]);
console.log("SMOKE OK");
