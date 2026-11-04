/* ---------- lehrer/40_word.js ---------- */
/* =====================================================================
   Lehrkraft-Version · Word-Ausgabe (.docx): Schulaufgaben-Generator und Hefteinträge/Vortrag
   Ohne Fremdbibliothek: WordprocessingML von Hand, ZIP ohne Kompression, Skizzen und Diagramme als PNG (SVG → Canvas).
   LK.word(was, ctx) mit was = "A" | "B" | "EA" | "EB" | "alles"; ctx kommt aus 20_generator.js.
   LK.wordHeft(raumId, nr | "alle", mitNotizen) exportiert Hefteinträge (aus LEHRER_DATEN.hefte).
   ===================================================================== */
(() => {
const LK = window.LK; if (!LK || !LK.D) return;
const D = LK.D, zahl = LK.zahl;
const BREITE = 9638;                                       // Textbreite in twips (A4, 2 cm Rand)
const xml = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));

/* ---------- Text mit **fett**, _{tief}, ^{hoch}, \frac{a}{b} ---------- */
const bruch = s => { let i; while ((i = s.indexOf("\\frac{")) >= 0) { const arg = j => { let d = 0, k = j; for (; k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) break; } return [s.slice(j + 1, k), k + 1]; };
  const [z, j1] = arg(i + 5); if (s[j1] !== "{") break; const [n, j2] = arg(j1); const p = t => /[\s+\-·:]/.test(t) ? `(${t})` : t; s = s.slice(0, i) + p(z) + "/" + p(n) + s.slice(j2); } return s; };
function R(t, f = {}){
  return `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${f.b ? "<w:b/>" : ""}${f.i ? "<w:i/>" : ""}${f.color ? `<w:color w:val="${f.color}"/>` : ""}${f.sz ? `<w:sz w:val="${f.sz}"/><w:szCs w:val="${f.sz}"/>` : ""}${f.va ? `<w:vertAlign w:val="${f.va}"/>` : ""}</w:rPr><w:t xml:space="preserve">${xml(t)}</w:t></w:r>`;
}
const TAB = "<w:r><w:tab/></w:r>", BR = "<w:r><w:br/></w:r>";
function runs(text, f = {}){
  const s = bruch(String(text || "")); let out = "", b = false;
  const re = /\*\*|_\{([^{}]*)\}|\^\{([^{}]*)\}|\n/g; let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out += R(s.slice(last, m.index), Object.assign({}, f, {b: f.b || b}));
    if (m[0] === "**") b = !b; else if (m[0] === "\n") out += BR;
    else out += R(m[1] ?? m[2], Object.assign({}, f, {b: f.b || b, va: m[1] != null ? "subscript" : "superscript"}));
    last = re.lastIndex;
  }
  if (last < s.length) out += R(s.slice(last), Object.assign({}, f, {b: f.b || b}));
  return out;
}
function P(inhalt, o = {}){
  const pPr = [o.style ? `<w:pStyle w:val="${o.style}"/>` : "", o.keep ? "<w:keepNext/>" : "", o.seite ? "<w:pageBreakBefore/>" : "",
    o.linie ? '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="000000"/></w:pBdr>' : "",
    o.tabs ? `<w:tabs>${o.tabs.map(t => `<w:tab w:val="${t[0]}" w:pos="${t[1]}"/>`).join("")}</w:tabs>` : "",
    `<w:spacing w:before="${o.vor || 0}" w:after="${o.nach ?? 60}"/>`, o.ind ? `<w:ind w:left="${o.ind[0]}" w:hanging="${o.ind[1] || 0}"/>` : "", o.jc ? `<w:jc w:val="${o.jc}"/>` : ""].join("");
  return `<w:p><w:pPr>${pPr}</w:pPr>${inhalt}</w:p>`;
}
function tabelle(zeilen, breiten, o = {}){
  const sum = breiten.reduce((a, b) => a + b, 0), w = breiten.map(b => Math.round(b / sum * (o.breite || BREITE)));
  const rand = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="888888"/><w:left w:val="single" w:sz="4" w:color="888888"/><w:bottom w:val="single" w:sz="4" w:color="888888"/><w:right w:val="single" w:sz="4" w:color="888888"/><w:insideH w:val="single" w:sz="4" w:color="888888"/><w:insideV w:val="single" w:sz="4" w:color="888888"/></w:tblBorders>';
  return `<w:tbl><w:tblPr><w:tblW w:w="${w.reduce((a, b) => a + b, 0)}" w:type="dxa"/>${o.ind ? `<w:tblInd w:w="${o.ind}" w:type="dxa"/>` : ""}${rand}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr>
    <w:tblGrid>${w.map(x => `<w:gridCol w:w="${x}"/>`).join("")}</w:tblGrid>${zeilen.map((z, i) => `<w:tr>${z.map((c, j) => `<w:tc><w:tcPr><w:tcW w:w="${w[j]}" w:type="dxa"/>${(o.kopf && i === 0) ? '<w:shd w:val="clear" w:color="auto" w:fill="EEF1F5"/>' : ""}</w:tcPr>${P(runs(c, {sz: o.sz || 20, b: o.kopf && i === 0}), {nach: 0, jc: o.mitte && j ? "center" : undefined})}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>${P("", {nach: 60})}`;
}

/* ---------- Bilder: SVG → PNG ---------- */
const FARBEN = {weiss: "#111111", gelb: "#7A5600", rot: "#B3202A", blau: "#12509C", gruen: "#26702B", orange: "#B04B00", raster: "#BDBDBD"};
const SVGCSS = `svg{color:${FARBEN.weiss}}text{fill:currentColor;stroke:none;font-family:Arial,Helvetica,sans-serif;font-size:16px}
${Object.entries(FARBEN).filter(([k]) => k !== "raster").map(([k, v]) => `.k-${k}{color:${v}}`).join("")}
.voll{fill:currentColor}.flaeche{fill:currentColor;fill-opacity:.16}.strich{stroke-dasharray:8 6}.punkt{stroke-dasharray:1.5 6}.duenn{stroke-width:1.5}.dick{stroke-width:4.5}.ohne{stroke:none}
.klein{font-size:13px}.gross{font-size:20px}.fett{font-weight:700}.lt-gitter{stroke:${FARBEN.raster};stroke-width:1}.lt-achsz{font-size:15px}.lt-achsn{font-size:16px;font-weight:700}.lt-kname{font-size:15px;font-weight:700}`;
let DEFS = null;
const defs = () => DEFS || (DEFS = ((D.symbole || "").match(/<defs>[\s\S]*<\/defs>/) || [""])[0].replace(/var\(--k-(\w+)\)/g, (m, k) => FARBEN[k] || "#111"));
async function png(svgHTML){
  const t = document.createElement("template"); t.innerHTML = svgHTML; const s = t.content.querySelector("svg"); if (!s) return null;
  const vb = (s.getAttribute("viewBox") || "0 0 400 300").split(/[\s,]+/).map(Number), k = 2.5;
  const mm = Math.min(170, parseFloat(((s.getAttribute("style") || "").match(/--mmw:([\d.]+)mm/) || [])[1]) || vb[2] / 4);
  s.removeAttribute("style"); s.removeAttribute("class"); s.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  s.setAttribute("width", vb[2] * k); s.setAttribute("height", vb[3] * k);
  s.insertAdjacentHTML("afterbegin", `<style>${SVGCSS}</style><g stroke="none" fill="none">${defs()}</g>`);
  const str = new XMLSerializer().serializeToString(s);
  const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
  await img.decode();
  const c = document.createElement("canvas"); c.width = Math.round(vb[2] * k); c.height = Math.round(vb[3] * k);
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, "image/png")); if (!blob) return null;
  return {daten: new Uint8Array(await blob.arrayBuffer()), mm, verh: vb[3] / vb[2]};
}

/* ---------- Dokument ---------- */
function Doku(){
  const bilder = [], teile = [];
  return {
    teile, bilder,
    add(x){ teile.push(x); },
    async bild(svgHTML, ind = 0){
      let b = null; try { b = await png(svgHTML); } catch (e) { console.warn("Bild", e); }
      if (!b) { teile.push(P(R("[Abbildung: siehe Druckfassung]", {i: true, color: "666666"}), {ind: [ind]})); return; }
      const n = bilder.push(b), cx = Math.round(Math.min(b.mm, (BREITE - ind) / 56.7) * 36000), cy = Math.round(cx * b.verh);
      teile.push(P(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Abbildung ${n}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:nvPicPr><pic:cNvPr id="${n}" name="bild${n}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdB${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
        <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`, {ind: [ind], nach: 80}));
    }
  };
}
async function bausteine(doc, bl, ind){
  const liste = (punkte, nummeriert) => (punkte || []).forEach((p, i) => doc.add(P(R(nummeriert ? (i + 1) + ".)" : "•") + TAB + runs(p), {ind: [ind + 340, 340], tabs: [["left", ind + 340]]})));
  for (const b of bl ? [].concat(bl) : []) {
    if (b.art === "skizze") { await doc.bild(LK.svg(b.svg, b.titel), ind); if (b.titel) doc.add(P(runs(b.titel, {sz: 18, color: "555555"}), {ind: [ind]})); }
    else if (b.art === "diagramm") { await doc.bild(LK.diagramm(b), ind); if (b.titel) doc.add(P(runs(b.titel, {sz: 18, color: "555555"}), {ind: [ind]})); }
    else if (b.art === "tabelle") { if (b.titel) doc.add(P(runs(b.titel, {b: true}), {ind: [ind]})); doc.add(tabelle((b.kopf ? [b.kopf] : []).concat(b.zeilen || []), (b.kopf || b.zeilen[0]).map(() => 1), {kopf: !!b.kopf, ind, breite: Math.min(BREITE - ind, 1400 * (b.kopf || b.zeilen[0]).length), mitte: true})); }
    else if (b.art === "liste") { if (b.titel) doc.add(P(runs(b.titel, {b: true}), {ind: [ind], keep: true})); liste(b.punkte, b.nummeriert); }
    else if (b.art === "groesse") doc.add(tabelle([["Größe", b.name], ["Formelzeichen", b.zeichen], ["Einheit", b.einheit]].concat(b.messgeraet ? [["Messgerät", b.messgeraet]] : []), [1, 2], {ind, breite: 6000}));
    else if (b.art === "merke" || b.art === "achtung") doc.add(P(R((b.art === "achtung" ? "⚠ " : "") + (b.titel || (b.art === "achtung" ? "Achtung" : "Merke")) + ": ", {b: true}) + runs(b.text), {ind: [ind], vor: 100}));
    else if (b.art === "formel") { doc.add(P(runs(b.formel, {b: true, sz: 24}), {ind: [ind], vor: 100, keep: true})); if (b.legende && b.legende.length) doc.add(tabelle(b.legende, b.legende[0].map(() => 1), {ind, breite: Math.min(BREITE - ind, 3000)})); if (b.text) doc.add(P(runs(b.text), {ind: [ind]})); }
    else if (b.art === "versuch") { doc.add(P(R("Versuch" + (b.titel ? ": " + b.titel : ""), {b: true}), {ind: [ind], vor: 100, keep: true})); [["aufbau", "Aufbau"], ["durchfuehrung", "Durchführung"], ["beobachtung", "Beobachtung"], ["ergebnis", "Ergebnis"]].forEach(([k, lab]) => { if (b[k]) doc.add(P(R(lab + ": ", {b: true}) + runs(b[k]), {ind: [ind + 340]})); }); }
    else if (b.art === "beispiel") { doc.add(P(R(b.titel || "Beispiel", {b: true}), {ind: [ind], vor: 100, keep: true})); if (b.aufgabe) doc.add(P(runs(b.aufgabe), {ind: [ind]})); if (b.gegeben || b.gesucht) doc.add(P(R("Gegeben: ", {b: true}) + runs((b.gegeben || []).join("; ")) + (b.gesucht ? BR + R("Gesucht: ", {b: true}) + runs([].concat(b.gesucht).join("; ")) : ""), {ind: [ind + 340]})); (b.loesung || []).forEach(z => doc.add(P(runs(z), {ind: [ind + 340]}))); if (b.antwort) doc.add(P(runs(b.antwort, {i: true}), {ind: [ind + 340]})); }
    else if (b.art === "frage") { doc.add(P(R("Frage", {b: true}), {ind: [ind], vor: 100, keep: true})); doc.add(P(runs(b.frage), {ind: [ind + 340]})); if (b.antwort) doc.add(P(runs(b.antwort, {i: true}), {ind: [ind + 340]})); }
    else if (b.art === "vergleich") { const sp = b.spalten || []; if (sp.length) doc.add(tabelle([sp.map(s => s.titel || ""), sp.map(s => (s.punkte || []).map(p => "• " + p).join("\n"))], sp.map(() => 1), {kopf: true, sz: 18, ind, breite: BREITE - ind})); }
    else { const t = b.text || b.formel || b.frage || b.aufgabe; if (t) doc.add(P(runs(t), {ind: [ind]})); }
  }
}
const TT = "abcdefghij";
const titelText = h => LK.plain(String(h)).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
async function angabe(doc, ctx, g, neueSeite){
  const {G, auswahl, summen, titel} = ctx, s = summen(auswahl), dat = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? `${+m[3]}.${+m[2]}.${m[1]}` : (v || ""); };
  doc.add(P(runs(G.schule || "", {sz: 18}) + TAB + runs(G.schuljahr ? "Schuljahr " + G.schuljahr : "", {sz: 18}), {tabs: [["right", BREITE]], seite: neueSeite}));
  doc.add(P(runs(titelText(titel(g)), {b: true, sz: 30}), {nach: 120}));
  doc.add(P(R("Name: ______________________________") + TAB + R("Datum: " + (G.datum ? dat(G.datum) : "______________")), {tabs: [["right", BREITE]], nach: 80}));
  doc.add(P(R(`Bearbeitungszeit: ${G.dauer} Minuten · Hilfsmittel: ${G.hilfsmittel || "keine"} · insgesamt ${zahl(s.be)} BE (die BE stehen am rechten Rand)`, {sz: 18}), {linie: true, nach: 200}));
  for (const [i, x] of auswahl.entries()) {
    const a = LK.fassung(x.a, g), eins = a.teile.length === 1;
    if (a.stamm) doc.add(P(R(String(i + 1), {b: true}) + TAB + runs(a.stamm), {ind: [567, 567], tabs: [["left", 567]], keep: true, vor: 160}));
    await bausteine(doc, a.abbildung, 567);
    for (const [j, t] of a.teile.entries()) {
      const L = eins ? 567 : 1134, kopf = j === 0 && !a.stamm ? R(String(i + 1), {b: true}) : "";
      doc.add(P(kopf + TAB + (eins ? "" : R(TT[j] + ")") + TAB) + runs(t.text) + TAB + R(zahl(t.be), {b: true}),
        {ind: [L, L], tabs: [["left", 567]].concat(eins ? [] : [["left", 1134]], [["right", BREITE]]), vor: j === 0 && !a.stamm ? 160 : 40, keep: !!t.abbildung}));
      await bausteine(doc, t.abbildung, L);
    }
  }
  doc.add(P(R("Viel Erfolg!", {i: true}), {jc: "right", vor: 300}));
}
async function erwartung(doc, ctx, g, neueSeite){
  const {G, auswahl, summen, schluessel, titel} = ctx, s = summen(auswahl), KBN = D.kompetenzen || {};
  doc.add(P(runs("Erwartungshorizont: " + titelText(titel(g)), {b: true, sz: 28}), {seite: neueSeite, linie: true, nach: 160}));
  for (const [i, x] of auswahl.entries()) {
    const a = LK.fassung(x.a, g), eins = a.teile.length === 1;
    doc.add(P(R(String(i + 1), {b: true}) + TAB + runs(`${a.kap || ""} · ${a.thema || ""} · ${a.ke || ""}`, {sz: 18, color: "555555"}), {ind: [567, 567], tabs: [["left", 567]], keep: true, vor: 160}));
    for (const [j, t] of a.teile.entries()) {
      doc.add(P(R(eins ? "" : TT[j] + ")") + TAB + R(`AFB ${t.afb} · ${t.op || ""} · ${KBN[t.kb] || t.kb || ""}${t.rechnen ? " · Rechnen" : ""}`, {sz: 18, color: "555555"}), {ind: [1134, 567], tabs: [["left", 1134]], keep: true}));
      for (const z of t.loesung || []) doc.add(P(runs(z.text) + TAB + R(z.be ? zahl(z.be) : "", {b: true}), {ind: [1134], tabs: [["right", BREITE]], nach: 30}));
      await bausteine(doc, t.loesung_bild, 1134);
      if (t.hinweis) doc.add(P(runs(t.hinweis, {i: true, sz: 18}), {ind: [1134]}));
    }
  }
  doc.add(P(R("Gleichwertige, nicht aufgeführte Lösungswege werden gleichberechtigt gewertet. Folgefehler werden nicht doppelt angerechnet.", {sz: 18, i: true}), {vor: 160}));
  doc.add(P(R(`Notenschlüssel (${zahl(s.be)} BE)`, {b: true}), {vor: 160, keep: true}));
  const rows = schluessel(s.be, G.grenzen, G.halbe);
  doc.add(tabelle([["Note"].concat(rows.map(r => String(r[0]))), ["BE"].concat(rows.map(r => `${zahl(r[2])} – ${zahl(r[1])}`))], [1.2, 1, 1, 1, 1, 1, 1], {kopf: true, mitte: true}));
}
function matrix(doc, ctx){
  const {auswahl, summen, G} = ctx, s = summen(auswahl), KB = ["MEN", "EG", "K", "B"], AF = ["I", "II", "III"];
  doc.add(P(R("Einschätzungsmatrix", {b: true, sz: 28}), {seite: true, linie: true, nach: 160}));
  const z = [["TA", "Kap. · KE", "Operator"].concat(KB, ["Rechnen"], AF.map(k => "AFB " + k), ["BE", "min"])];
  auswahl.forEach((x, i) => x.a.teile.forEach((t, j) => z.push([`${i + 1}${x.a.teile.length > 1 ? TT[j] : ""}`, `${x.a.kap || ""} · ${x.a.ke || ""}`, t.op || ""]
    .concat(KB.map(k => t.kb === k ? zahl(t.be) : ""), [t.rechnen ? zahl(t.be) : ""], AF.map(k => t.afb === k ? zahl(t.be) : ""), [zahl(t.be), zahl(t.min || "")]))));
  const pz = v => s.be ? Math.round(v / s.be * 100) + " %" : "";
  z.push(["Summe", "", ""].concat(KB.map(k => zahl(s.kb[k])), [zahl(s.rech)], AF.map(k => zahl(s.afb[k])), [zahl(s.be), String(Math.round(s.min))]));
  z.push(["Anteil", "", ""].concat(KB.map(k => pz(s.kb[k])), [pz(s.rech)], AF.map(k => pz(s.afb[k])), ["", ""]));
  z.push(["Ziel", "", ""].concat(KB.map((k, i) => G.kbAn !== false && G.kb ? G.kb[i] + " %" : ""), [`≤ ${G.rechenMax} %`], G.afb.map(v => v + " %"), [String(G.be), String(G.dauer)]));
  doc.add(tabelle(z, [0.7, 2.4, 1.6, 0.8, 0.7, 0.6, 0.6, 1, 0.9, 0.9, 0.9, 0.6, 0.6], {kopf: true, sz: 16, mitte: true}));
  doc.add(P(R(KB.map(k => `${k} = ${(D.kompetenzen || {})[k]}`).join(" · "), {sz: 16, color: "555555"})));
  if (ctx.stoff) doc.add(P(R("Abgefragter Stoff: ", {b: true, sz: 18}) + R(ctx.stoff, {sz: 18}), {vor: 120}));
}

/* ---------- Hefteintrag / Vortrag als Word ---------- */
const raumTitel = id => (D.raeume && D.raeume[id] && D.raeume[id].titel) || id;
function vortragDoc(doc, e){
  const v = e.vortrag || {}, li = a => (a || []).forEach(x => doc.add(P(R("•") + TAB + runs(x), {ind: [340, 340], tabs: [["left", 340]]})));
  doc.add(P(R("Vortragsnotizen", {b: true, sz: 24}), {seite: true, linie: true, nach: 160}));
  if (v.ziel) doc.add(P(R("Ziel: ", {b: true}) + runs(v.ziel)));
  if (v.einstieg) doc.add(P(R("Einstieg: ", {b: true}) + runs(v.einstieg)));
  if (v.material && v.material.length) { doc.add(P(R("Material:", {b: true}), {keep: true})); li(v.material); }
  if (v.fehlvorstellungen && v.fehlvorstellungen.length) { doc.add(P(R("Typische Fehlvorstellungen:", {b: true}), {keep: true})); li(v.fehlvorstellungen); }
  if (v.fragen && v.fragen.length) { doc.add(P(R("Verständnisfragen an die Klasse:", {b: true}), {keep: true})); v.fragen.forEach(q => doc.add(P(R("•") + TAB + runs(q.frage) + (q.erwartung ? BR + R("Erwartung: ", {i: true}) + runs(q.erwartung, {i: true}) : ""), {ind: [340, 340], tabs: [["left", 340]]}))); }
  if (v.abschluss) doc.add(P(R("Abschluss: ", {b: true}) + runs(v.abschluss)));
  if (v.hausaufgabe) doc.add(P(R("Hausaufgabe: ", {b: true}) + runs(v.hausaufgabe)));
}
async function heftDoc(doc, raumId, e, mitNotizen, erste){
  doc.add(P(runs(`Physik 8 · ${raumTitel(raumId)}${e.kap ? " · " + e.kap : ""} · Hefteintrag ${e.nr} von 4${e.dauer ? " · etwa " + e.dauer + " min" : ""}`, {sz: 18, color: "555555"}), {seite: !erste, nach: 60}));
  doc.add(P(runs(e.titel, {b: true, sz: 30}), {nach: 120, linie: true}));
  for (const s of e.schritte || []) {
    if (s.ueberschrift) doc.add(P(runs(s.ueberschrift, {b: true, sz: 24}), {vor: 160, keep: true}));
    await bausteine(doc, s.bloecke, 0);
    if (mitNotizen) {
      if (s.sprechtext) doc.add(P(runs(s.sprechtext, {i: true, color: "444444"}), {vor: 60}));
      if (s.impuls) doc.add(P(R("Impuls: ", {b: true}) + runs(s.impuls.frage) + (s.impuls.erwartung ? BR + R("Erwartung: ", {i: true}) + runs(s.impuls.erwartung, {i: true}) : "")));
      if (s.zeigen) doc.add(P(R("Zeigen: ", {b: true}) + runs(s.zeigen)));
    }
  }
  if (mitNotizen) vortragDoc(doc, e);
}
const sane = s => String(s).replace(/[^\wäöüÄÖÜß.-]+/g, "-").replace(/^-+|-+$/g, "");
function herunterladen(blob, name){
  LK.wordLetzte = {blob, name};
  const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return name;
}
LK.wordHeft = async (raumId, nr, mitNotizen) => {
  const es = ((D.hefte || {})[raumId] || {}).eintraege || [];
  const liste = nr === "alle" ? es : es.filter(e => e.nr === nr);
  if (!liste.length) throw new Error("kein Hefteintrag gefunden: " + raumId + " / " + nr);
  const doc = Doku();
  for (const [i, e] of liste.entries()) await heftDoc(doc, raumId, e, !!mitNotizen, i === 0);
  return herunterladen(docx(doc), sane((nr === "alle" ? "Heft-" + raumId : "Hefteintrag-" + raumId + "-" + nr) + (mitNotizen ? "-mit-Notizen" : "")) + ".docx");
};

/* ---------- ZIP (ohne Kompression) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(dateien){
  const enc = new TextEncoder(), teile = [], zentral = []; let off = 0;
  for (const f of dateien) {
    const name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    teile.push(new Uint8Array(h.buffer), name, data);
    const z = new DataView(new ArrayBuffer(46)); z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true);
    z.setUint32(16, crc, true); z.setUint32(20, data.length, true); z.setUint32(24, data.length, true); z.setUint16(28, name.length, true); z.setUint32(42, off, true);
    zentral.push(new Uint8Array(z.buffer), name); off += 30 + name.length + data.length;
  }
  const zl = zentral.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, dateien.length, true); e.setUint16(10, dateien.length, true); e.setUint32(12, zl, true); e.setUint32(16, off, true);
  return new Blob([...teile, ...zentral, new Uint8Array(e.buffer)], {type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
}
function docx(doc){
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const body = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${doc.teile.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Standard"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style></w:styles>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${doc.bilder.map((_, i) => `<Relationship Id="rIdB${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/bild${i + 1}.png"/>`).join("")}</Relationships>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  const root = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  return zip([{name: "[Content_Types].xml", data: ct}, {name: "_rels/.rels", data: root}, {name: "word/document.xml", data: body}, {name: "word/_rels/document.xml.rels", data: rels},
    {name: "word/styles.xml", data: styles}].concat(doc.bilder.map((b, i) => ({name: `word/media/bild${i + 1}.png`, data: b.daten}))));
}

LK.word = async (was, ctx) => {
  const doc = Doku(), ab = ctx.G.gruppen === "AB";
  const folge = was === "alles" ? (ab ? ["A", "B", "EA", "EB", "M"] : ["A", "EA", "M"]) : [was];
  for (const [i, k] of folge.entries()) {
    if (k === "A" || k === "B") await angabe(doc, ctx, ab ? k : "", i > 0);
    else if (k === "EA" || k === "EB") await erwartung(doc, ctx, ab ? k.slice(1) : "", i > 0);
    else matrix(doc, ctx);
  }
  const name = `${(ctx.G.nr || "").replace(/\.$/, "")}-${ctx.artName()}-Physik-${ctx.G.klasse || "8"}${was === "alles" ? "" : "-" + {A: "Angabe-A", B: "Angabe-B", EA: "Erwartungshorizont-A", EB: "Erwartungshorizont-B"}[was]}.docx`
    .replace(/^-/, "").replace(/[^\wäöüÄÖÜß.-]+/g, "-");
  return herunterladen(docx(doc), name);
};
})();
