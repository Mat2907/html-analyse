/* ---------- lehrer/00_basis.js ---------- */
/* =====================================================================
   Lehrkraft-Version · Grundlage
   Darstellung der Hefteinträge (Tafelbild, schrittweise aufdeckbar) und der Schulaufgaben (Angabe, Erwartungshorizont)
   aus window.LEHRER_DATEN = {hefte: {<raum>: {eintraege}}, aufgaben: {<raum>: {aufgaben}}, operatoren, symbole, raeume}.
   Format: LEHRER-SCHEMA.md · Zeichensatz der Skizzen: symbole.svg
   ===================================================================== */
(() => {
const D = window.LEHRER_DATEN; if (!D) return;
const LK = window.LK = window.LK || {};
LK.D = D;
LK.RAEUME = Object.keys(D.raeume || {});

/* ---------- Text ---------- */
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
LK.esc = esc;
// Brüche: \frac{Zähler}{Nenner} (auch verschachtelte Klammern im Zähler/Nenner)
function bruch(s){
  let i;
  while ((i = s.indexOf("\\frac{")) >= 0) {
    const arg = j => { let d = 0, k = j; for (; k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) break; } return [s.slice(j + 1, k), k + 1]; };
    const [z, j1] = arg(i + 5); if (s[j1] !== "{") break; const [n, j2] = arg(j1);
    s = s.slice(0, i) + `<span class="lt-bruch"><span>${z}</span><span>${n}</span></span>` + s.slice(j2);
  }
  return s;
}
// **fett**, F_{G} tief, m/s^{2} hoch, \frac{a}{b}, Zeilenumbruch; geschütztes Leerzeichen zwischen Zahl und Einheit
LK.fmt = s => {
  let h = esc(s);
  h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  h = h.replace(/_\{([^{}]*)\}/g, "<sub>$1</sub>").replace(/\^\{([^{}]*)\}/g, "<sup>$1</sup>");
  h = bruch(h);
  h = h.replace(/(\d) (?=(?:°C|kWh|Wh|dpt|Uhr|t|(?:k|m|M|µ|c|d)?(?:A|V|Ω|N|m|s|h|g|J|W|°|%|kg|km|cm|mm|min|Hz))(?![A-Za-zäöüß]))/g, "$1 ");
  return h.replace(/\n/g, "<br>");
};
LK.plain = s => String(s || "").replace(/\*\*/g, "").replace(/_\{([^{}]*)\}/g, "$1").replace(/\^\{([^{}]*)\}/g, "$1").replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
const zahl = (v, st) => { const r = st == null ? +(+v).toFixed(4) : (+v).toFixed(st); return String(r).replace(".", ","); };
LK.zahl = zahl;

/* ---------- Skizzen (SVG der Autoren) ---------- */
const SVG_OK = new Set(["svg", "g", "line", "polyline", "polygon", "path", "rect", "circle", "ellipse", "text", "tspan", "use", "title"]);
LK.defs = () => {
  if (document.getElementById("ts-defs") || !D.symbole) return;
  const t = document.createElement("template"); t.innerHTML = D.symbole.trim(); const el = t.content.firstElementChild; if (el) document.body.appendChild(el);
};
LK.svg = (src, label) => {
  const t = document.createElement("template"); t.innerHTML = String(src || "").trim(); const s = t.content.querySelector("svg");
  if (!s) return `<div class="lt-fehlt">Skizze fehlt</div>`;
  [s, ...s.querySelectorAll("*")].forEach(n => { if (n !== s && !SVG_OK.has(n.localName)) { n.remove(); return; }
    for (const a of [...n.attributes]) { const k = a.name.toLowerCase();
      if (k.startsWith("on") || k === "style" || ((k === "href" || k === "xlink:href") && !/^#ts-/.test(a.value))) n.removeAttribute(a.name); } });
  s.removeAttribute("width"); s.removeAttribute("height"); s.removeAttribute("style");
  const set = {fill: "none", stroke: "currentColor", "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round", role: "img"};
  for (const k in set) if (!s.hasAttribute(k)) s.setAttribute(k, set[k]);
  s.setAttribute("class", ("lt-svg " + (s.getAttribute("class") || "")).trim()); if (label) s.setAttribute("aria-label", LK.plain(label));
  // Druckbreite: 4 Einheiten ≙ 1 mm (Kästchenraster mit 20 Einheiten = 5 mm), höchstens Seitenbreite
  const vb = (s.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number); if (vb.length === 4 && vb[2] > 0) s.setAttribute("style", `--mmw:${Math.min(170, vb[2] / 4).toFixed(1)}mm`);
  return s.outerHTML;
};

/* ---------- Diagramme ---------- */
// Text mit F_{G} und m/s^{2} für SVG: Tief- und Hochstellung als tspan mit dy (funktioniert auch beim Umwandeln in Bilder für Word)
const svgText = s => { const out = []; let rest = String(s || "").replace(/\*\*/g, ""), m;
  const re = /_\{([^{}]*)\}|\^\{([^{}]*)\}/g; let last = 0;
  while ((m = re.exec(rest))) { if (m.index > last) out.push(esc(rest.slice(last, m.index)));
    const d = m[1] != null ? .35 : -.45; out.push(`<tspan dy="${d}em" font-size="75%">${esc(m[1] ?? m[2])}</tspan><tspan dy="${-d}em">\u200b</tspan>`); last = re.lastIndex; }
  if (last < rest.length) out.push(esc(rest.slice(last))); return out.join(""); };
LK.svgText = svgText;
// {x: {name, min, max, teil}, y: {…}, kurven: [{punkte: [[x, y], …], linie, fn: "x/10", von, bis, farbe, name, strich, beschriftung}], leer}
LK.diagramm = sp => {
  const W = 560, H = 380, L = 70, R = 24, T = 22, B = 58, ax = sp.x || {}, ay = sp.y || {};
  const x0 = ax.min || 0, x1 = ax.max || 1, y0 = ay.min || 0, y1 = ay.max || 1;
  const X = v => L + (v - x0) / (x1 - x0) * (W - L - R), Y = v => H - B - (v - y0) / (y1 - y0) * (H - T - B);
  const tx = ax.teil || (x1 - x0) / 5, ty = ay.teil || (y1 - y0) / 5; let g = "";
  for (let v = x0; v <= x1 + 1e-9; v += tx) g += `<line x1="${X(v)}" y1="${Y(y0)}" x2="${X(v)}" y2="${Y(y1)}" class="lt-gitter"/><text x="${X(v)}" y="${Y(y0) + 22}" text-anchor="middle" class="lt-achsz">${zahl(v)}</text>`;
  for (let v = y0; v <= y1 + 1e-9; v += ty) g += `<line x1="${X(x0)}" y1="${Y(v)}" x2="${X(x1)}" y2="${Y(v)}" class="lt-gitter"/><text x="${X(x0) - 8}" y="${Y(v) + 5}" text-anchor="end" class="lt-achsz">${zahl(v)}</text>`;
  g += `<line x1="${X(x0)}" y1="${Y(y0)}" x2="${X(x1) + 14}" y2="${Y(y0)}" marker-end="url(#ts-spitze)"/><line x1="${X(x0)}" y1="${Y(y0)}" x2="${X(x0)}" y2="${Y(y1) - 14}" marker-end="url(#ts-spitze)"/>`;
  g += `<text x="${X(x1)}" y="${H - 10}" text-anchor="end" class="lt-achsn">${svgText(ax.name)}</text><text x="${X(x0) + 8}" y="${T - 4}" class="lt-achsn">${svgText(ay.name)}</text>`;
  if (!sp.leer) (sp.kurven || []).forEach((k, i) => {
    const c = "k-" + (k.farbe || ["gelb", "blau", "rot", "gruen"][i % 4]); let pts = k.punkte || [];
    if (k.fn) { let f; try { f = new Function("x", "return " + k.fn); } catch (e) { f = () => NaN; } const a = k.von ?? x0, b = k.bis ?? x1; pts = [];
      for (let j = 0; j <= 80; j++) { const x = a + (b - a) * j / 80, y = f(x); if (isFinite(y) && y >= y0 - 1e-9 && y <= y1 + 1e-9) pts.push([x, y]); } }
    const line = k.linie ?? (!!k.fn || !k.punkte);
    if (line && pts.length > 1) g += `<polyline class="${c}${k.strich ? " strich" : ""}" stroke-width="3" points="${pts.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ")}"/>`;
    if (k.punkte && !k.fn) g += k.punkte.map(p => `<g class="${c}"><path d="M${X(p[0]) - 5} ${Y(p[1]) - 5}l10 10m0 -10l-10 10" stroke-width="2.5"/></g>`).join("");
    if (k.name) { const p = pts[pts.length - 1] || [x1, y1]; g += `<text x="${Math.min(X(p[0]), W - R - 4)}" y="${Y(p[1]) - 10}" text-anchor="end" class="${c} lt-kname">${svgText(k.name)}</text>`; }
  });
  (sp.marken || []).forEach(m => { g += `<g class="k-${m.farbe || "rot"}"><circle cx="${X(m.x)}" cy="${Y(m.y)}" r="5" fill="currentColor" stroke="none"/><text x="${X(m.x) + 9}" y="${Y(m.y) - 8}" class="lt-kname">${svgText(m.text)}</text></g>`; });
  return `<svg class="lt-svg lt-dia" style="--mmw:112mm" viewBox="0 0 ${W} ${H}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" role="img" aria-label="${esc(LK.plain(sp.titel || "Diagramm"))}">${g}</svg>`;
};

/* ---------- Bausteine ---------- */
const BILD = new Set(["skizze", "diagramm"]);
LK.istBild = b => BILD.has(b.art);
// r = Zähler für das schrittweise Aufdecken: r.n ist die Nummer des aktuellen Aufdeckschritts; r.neu() beginnt einen weiteren im selben Tafelschritt
function block(b, r){
  const R = () => r ? ` data-r="${r.neu()}"` : "";
  const f = LK.fmt;
  switch (b.art) {
    case "text": return `<p class="lt-p">${f(b.text)}</p>`;
    case "merke": return `<div class="lt-merke"><b class="lt-mk">${esc(b.titel || "Merke")}</b><div>${f(b.text)}</div></div>`;
    case "achtung": return `<div class="lt-achtung"><b class="lt-mk">⚠ ${esc(b.titel || "Achtung")}</b><div>${f(b.text)}</div></div>`;
    case "liste": { const tag = b.nummeriert ? "ol" : "ul"; return `${b.titel ? `<p class="lt-p"><b>${f(b.titel)}</b></p>` : ""}<${tag} class="lt-liste">${(b.punkte || []).map((p, i) => `<li${b.schrittweise && i ? R() : ""}>${f(p)}</li>`).join("")}</${tag}>`; }
    case "formel": return `<div class="lt-formel"><div class="lt-f">${f(b.formel)}</div>${b.legende ? `<table class="lt-leg">${b.legende.map(z => `<tr>${z.map(c => `<td>${f(c)}</td>`).join("")}</tr>`).join("")}</table>` : ""}${b.text ? `<p class="lt-p">${f(b.text)}</p>` : ""}</div>`;
    case "groesse": return `<table class="lt-gr"><tr><th>Größe</th><td>${f(b.name)}</td></tr><tr><th>Formelzeichen</th><td>${f(b.zeichen)}</td></tr><tr><th>Einheit</th><td>${f(b.einheit)}</td></tr>${b.messgeraet ? `<tr><th>Messgerät</th><td>${f(b.messgeraet)}</td></tr>` : ""}${b.text ? `<tr><td colspan="2">${f(b.text)}</td></tr>` : ""}</table>`;
    case "versuch": return `<div class="lt-versuch"><b class="lt-mk">Versuch${b.titel ? ": " + f(b.titel) : ""}</b>${b.aufbau ? `<p class="lt-p"><b>Aufbau:</b> ${f(b.aufbau)}</p>` : ""}${b.durchfuehrung ? `<p class="lt-p"><b>Durchführung:</b> ${f(b.durchfuehrung)}</p>` : ""}${b.beobachtung ? `<p class="lt-p"${R()}><b>Beobachtung:</b> ${f(b.beobachtung)}</p>` : ""}${b.ergebnis ? `<p class="lt-p"${R()}><b>Ergebnis:</b> ${f(b.ergebnis)}</p>` : ""}</div>`;
    case "beispiel": { const sw = b.schrittweise !== false;
      return `<div class="lt-beispiel"><b class="lt-mk">${esc(b.titel || "Beispiel")}</b><p class="lt-p">${f(b.aufgabe)}</p>
        ${b.gegeben || b.gesucht ? `<div class="lt-gg">${b.gegeben ? `<div><b>Gegeben:</b> ${b.gegeben.map(f).join("; ")}</div>` : ""}${b.gesucht ? `<div><b>Gesucht:</b> ${[].concat(b.gesucht).map(f).join("; ")}</div>` : ""}</div>` : ""}
        <div class="lt-loes">${(b.loesung || []).map((z, i) => `<div${sw ? R() : ""}>${f(z)}</div>`).join("")}</div>${b.antwort ? `<p class="lt-p lt-antwort"${sw ? R() : ""}>${f(b.antwort)}</p>` : ""}</div>`; }
    case "frage": return `<div class="lt-frage"><b class="lt-mk">Frage</b><p class="lt-p">${f(b.frage)}</p><div class="lt-antw"${R()}>${f(b.antwort)}</div></div>`;
    case "vergleich": return `<div class="lt-vgl" style="--n:${(b.spalten || []).length}">${(b.spalten || []).map(s => `<div><b class="lt-mk">${f(s.titel)}</b><ul class="lt-liste">${(s.punkte || []).map(p => `<li>${f(p)}</li>`).join("")}</ul></div>`).join("")}</div>`;
    case "tabelle": return `<table class="lt-tab">${b.titel ? `<caption>${f(b.titel)}</caption>` : ""}${b.kopf ? `<tr>${b.kopf.map(c => `<th>${f(c)}</th>`).join("")}</tr>` : ""}${(b.zeilen || []).map(z => `<tr>${z.map((c, i) => b.kopfspalte && !i ? `<th>${f(c)}</th>` : `<td>${f(c)}</td>`).join("")}</tr>`).join("")}</table>`;
    case "skizze": return `<figure class="lt-fig">${LK.svg(b.svg, b.titel)}${b.titel ? `<figcaption>${f(b.titel)}</figcaption>` : ""}</figure>`;
    case "diagramm": return `<figure class="lt-fig">${LK.diagramm(b)}${b.titel ? `<figcaption>${f(b.titel)}</figcaption>` : ""}</figure>`;
    default: return `<div class="lt-fehlt">Unbekannter Baustein „${esc(b.art)}“</div>`;
  }
}
LK.block = block;

/* ---------- Hefteintrag ---------- */
// liefert {html, n (Zahl der Aufdeckschritte), schritt: [Aufdeckschritt → Tafelschritt]}
LK.heft = (e, o = {}) => {
  let n = 0; const schritt = [];
  const r = o.alles ? null : {neu(){ schritt.push(this.s); return ++n - 1; }, s: 0};
  const rows = (e.schritte || []).map((s, i) => {
    let start = 0; if (r) { r.s = i; start = r.neu(); }
    const bl = s.bloecke || [], bild = bl.filter(LK.istBild), text = bl.filter(b => !LK.istBild(b));
    const inner = bild.length && text.length
      ? `<div class="lt-zwei"><div class="lt-txt">${text.map(b => block(b, r)).join("")}</div><div class="lt-bild">${bild.map(b => block(b, r)).join("")}</div></div>`
      : `<div class="lt-txt${bild.length ? " lt-nurbild" : ""}">${bl.map(b => block(b, r)).join("")}</div>`;
    const notiz = o.notizen ? notizHTML(s) : "";
    return `<section class="lt-schritt"${r ? ` data-r="${start}"` : ""} data-s="${i}">${s.ueberschrift ? `<h3 class="lt-h3">${LK.fmt(s.ueberschrift)}</h3>` : ""}${inner}${notiz}</section>`;
  }).join("");
  const kopf = `<header class="lt-kopf"><small>${esc(e.kap || "")}${o.nr ? " · Hefteintrag " + esc(o.nr) : ""}</small><h2>${LK.fmt(e.titel)}</h2></header>`;
  return {html: `<article class="lt-heft">${kopf}${rows}</article>`, n, schritt};
};
function notizHTML(s){
  const t = [];
  if (s.sprechtext) t.push(`<p>${LK.fmt(s.sprechtext)}</p>`);
  if (s.impuls) t.push(`<p><b>Impuls:</b> ${LK.fmt(s.impuls.frage)}${s.impuls.erwartung ? `<br><i>Erwartung:</i> ${LK.fmt(s.impuls.erwartung)}` : ""}</p>`);
  if (s.zeigen) t.push(`<p><b>Zeigen:</b> ${LK.fmt(s.zeigen)}</p>`);
  return t.length ? `<aside class="lt-notiz">${t.join("")}</aside>` : "";
}
LK.notizHTML = notizHTML;
LK.vortragHTML = e => { const v = e.vortrag || {}, f = LK.fmt, li = a => `<ul>${a.map(x => `<li>${f(x)}</li>`).join("")}</ul>`;
  return [v.ziel ? `<p><b>Ziel:</b> ${f(v.ziel)}</p>` : "", v.einstieg ? `<p><b>Einstieg:</b> ${f(v.einstieg)}</p>` : "",
    v.material && v.material.length ? `<div><b>Material:</b>${li(v.material)}</div>` : "",
    v.fehlvorstellungen && v.fehlvorstellungen.length ? `<div><b>Typische Fehlvorstellungen:</b>${li(v.fehlvorstellungen)}</div>` : "",
    v.fragen && v.fragen.length ? `<div><b>Verständnisfragen an die Klasse:</b><ul>${v.fragen.map(q => `<li>${f(q.frage)}${q.erwartung ? `<br><i>Erwartung:</i> ${f(q.erwartung)}` : ""}</li>`).join("")}</ul></div>` : "",
    v.abschluss ? `<p><b>Abschluss:</b> ${f(v.abschluss)}</p>` : "", v.hausaufgabe ? `<p><b>Hausaufgabe:</b> ${f(v.hausaufgabe)}</p>` : ""].join(""); };

/* ---------- Aufgaben (Schulaufgabe) ---------- */
const TT = "abcdefghij";
const fassung = (a, g) => g === "B" && a.b ? Object.assign({}, a, a.b, {teile: a.teile.map((t, i) => Object.assign({}, t, (a.b.teile || [])[i] || {}))}) : a;
LK.fassung = fassung;
LK.beSumme = a => a.teile.reduce((s, t) => s + (+t.be || 0), 0);
// Angabe einer Aufgabe (nr = Aufgabennummer)
LK.angabe = (a, nr, g) => { const x = fassung(a, g), f = LK.fmt, eins = x.teile.length === 1;
  return `<div class="la-aufg"><div class="la-nr">${nr}</div><div class="la-in">${x.stamm ? `<p class="lt-p">${f(x.stamm)}</p>` : ""}${(x.abbildung ? [].concat(x.abbildung) : []).map(b => block(b, null)).join("")}
    <div class="la-teile">${x.teile.map((t, i) => `<div class="la-teil"><span class="la-tt">${eins ? "" : TT[i] + ")"}</span><div class="la-tx">${f(t.text)}${(t.abbildung ? [].concat(t.abbildung) : []).map(b => block(b, null)).join("")}</div><span class="la-be">${zahl(t.be)}</span></div>`).join("")}</div></div></div>`; };
// Erwartungshorizont einer Aufgabe
LK.loesung = (a, nr, g, o = {}) => { const x = fassung(a, g), f = LK.fmt, eins = x.teile.length === 1, OP = D.operatoren || {};
  return `<div class="la-aufg la-l"><div class="la-nr">${nr}</div><div class="la-in">${o.kurz ? "" : `<p class="la-kap">${esc(a.kap || "")}${a.thema ? " · " + f(a.thema) : ""}</p>`}
    ${x.teile.map((t, i) => `<div class="la-lteil"><div class="la-lk"><span class="la-tt">${eins ? "" : TT[i] + ")"}</span><span class="la-tag afb${esc(t.afb)}">AFB ${esc(t.afb)}</span><span class="la-tag">${esc(t.op || "")}</span><span class="la-tag">${esc((D.kompetenzen || {})[t.kb] || t.kb || "")}</span></div>
      ${(t.loesung || []).map(z => `<div class="la-lz"><div>${f(z.text)}</div><span class="la-be">${z.be ? zahl(z.be) : ""}</span></div>`).join("")}
      ${(t.loesung_bild ? [].concat(t.loesung_bild) : []).map(b => block(b, null)).join("")}${t.hinweis ? `<p class="la-hinw">${f(t.hinweis)}</p>` : ""}</div>`).join("")}</div></div>`; };

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.textContent = `
:root{--k-weiss:#F4F1E8;--k-gelb:#FFE27A;--k-rot:#FF948A;--k-blau:#93CDFF;--k-gruen:#A8E59C;--k-orange:#FFBC75;--k-raster:rgba(255,255,255,.16);
  --lt-tafel:#1F3B2E;--lt-tafel2:#183024;--lt-rahmen:#6B4A2A;--lt-ink:var(--k-weiss);--lt-hand:"Chalkboard SE","Chalkboard","Comic Neue","Segoe Print","Bradley Hand",system-ui,sans-serif;--lt-akz:var(--k-gelb)}
html[data-world="zauber"]{--lt-tafel:#232027;--lt-tafel2:#1A171E;--lt-rahmen:#8A6A2A}
html[data-world="sterne"]{--lt-tafel:#0C1A2E;--lt-tafel2:#081325;--lt-rahmen:#2E4A70;--lt-hand:"Avenir Next","Segoe UI",system-ui,sans-serif}
html[data-world="detektiv"]{--lt-tafel:#24372B;--lt-tafel2:#1C2C22;--lt-rahmen:#5A3D24}
html.lt-hell,html.lt-papier{--k-weiss:#161616;--k-gelb:#8C6200;--k-rot:#C0262D;--k-blau:#1557A8;--k-gruen:#2C7A31;--k-orange:#C25400;--k-raster:#C9CED6;--lt-ink:#161616}
html.lt-hell{--lt-tafel:#FBFBF7;--lt-tafel2:#F1F1EA;--lt-rahmen:#9AA3AE}
@media print{:root,html[data-world]{--k-weiss:#111;--k-gelb:#7A5600;--k-rot:#B3202A;--k-blau:#12509C;--k-gruen:#26702B;--k-orange:#B04B00;--k-raster:#BDBDBD;--lt-ink:#111;--lt-hand:"Helvetica Neue",Arial,sans-serif}}
.lt-svg{display:block;width:100%;height:auto;color:var(--k-weiss);overflow:visible}
.lt-svg text{fill:currentColor;stroke:none;font-family:var(--lt-hand);font-size:16px}
.lt-svg .k-weiss,.k-weiss{color:var(--k-weiss)}.lt-svg .k-gelb,.k-gelb{color:var(--k-gelb)}.lt-svg .k-rot,.k-rot{color:var(--k-rot)}
.lt-svg .k-blau,.k-blau{color:var(--k-blau)}.lt-svg .k-gruen,.k-gruen{color:var(--k-gruen)}.lt-svg .k-orange,.k-orange{color:var(--k-orange)}
.lt-svg .voll{fill:currentColor}.lt-svg .flaeche{fill:currentColor;fill-opacity:.16}.lt-svg .strich{stroke-dasharray:8 6}.lt-svg .punkt{stroke-dasharray:1.5 6}
.lt-svg .duenn{stroke-width:1.5}.lt-svg .dick{stroke-width:4.5}.lt-svg .ohne{stroke:none}.lt-svg .klein{font-size:13px}.lt-svg .gross{font-size:20px}.lt-svg .fett{font-weight:700}
.lt-dia .lt-gitter{stroke:var(--k-raster);stroke-width:1}.lt-dia .lt-achsz{font-size:15px}.lt-dia .lt-achsn{font-size:16px;font-weight:700}.lt-dia .lt-kname{font-size:15px;font-weight:700}
.lt-bruch{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 .15em;line-height:1.15}
.lt-bruch>span:first-child{border-bottom:.08em solid currentColor;padding:0 .2em}.lt-bruch>span:last-child{padding:0 .2em}
/* Hefteintrag */
.lt-heft{color:var(--lt-ink);font-family:var(--lt-hand);line-height:1.45}
.lt-heft .lt-kopf small{display:block;opacity:.75;font-size:.8em;letter-spacing:.04em}
.lt-heft .lt-kopf h2{margin:.1em 0 .5em;font-size:1.65em;color:var(--lt-akz);border-bottom:.08em solid currentColor;padding-bottom:.15em;font-family:inherit}
.lt-heft .lt-h3{margin:.6em 0 .25em;font-size:1.15em;color:var(--k-blau);font-family:inherit}
.lt-schritt{margin:0 0 .7em}
.lt-zwei{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:1.2em;align-items:start}
.lt-nurbild .lt-fig{max-width:min(100%,46em);margin-left:auto;margin-right:auto}
.lt-p{margin:.3em 0}
.lt-mk{display:block;font-size:.85em;letter-spacing:.06em;text-transform:uppercase;margin-bottom:.15em}
.lt-merke{border:.12em solid var(--k-rot);border-radius:.4em;padding:.45em .7em;margin:.5em 0}.lt-merke .lt-mk{color:var(--k-rot)}
.lt-achtung{border:.12em dashed var(--k-orange);border-radius:.4em;padding:.45em .7em;margin:.5em 0}.lt-achtung .lt-mk{color:var(--k-orange)}
.lt-versuch,.lt-beispiel,.lt-frage{border-left:.25em solid var(--k-blau);padding:.2em .7em;margin:.5em 0}.lt-versuch .lt-mk,.lt-beispiel .lt-mk,.lt-frage .lt-mk{color:var(--k-blau)}
.lt-beispiel{border-left-color:var(--k-gruen)}.lt-beispiel .lt-mk{color:var(--k-gruen)}
.lt-frage{border-left-color:var(--k-gelb)}.lt-frage .lt-mk{color:var(--k-gelb)}.lt-antw{margin-top:.25em;padding-left:.8em;border-left:.1em dotted currentColor}
.lt-gg{display:flex;flex-wrap:wrap;gap:.2em 2em;margin:.3em 0}.lt-loes>div{margin:.12em 0 .12em 1em}.lt-antwort{font-style:italic}
.lt-formel{text-align:center;margin:.5em 0}.lt-f{display:inline-block;font-size:1.45em;border:.09em solid var(--k-gelb);color:var(--k-gelb);border-radius:.3em;padding:.15em .8em}
.lt-leg{margin:.35em auto 0;border-collapse:collapse;font-size:.9em}.lt-leg td{padding:.05em .6em;text-align:left}
.lt-gr,.lt-tab{border-collapse:collapse;margin:.5em 0;font-size:.95em}.lt-gr th,.lt-gr td,.lt-tab th,.lt-tab td{border:.06em solid color-mix(in srgb,currentColor 55%,transparent);padding:.2em .6em;text-align:left;vertical-align:top}
.lt-gr th,.lt-tab th{color:var(--k-blau);font-weight:700}.lt-tab td{text-align:center}.lt-tab caption{text-align:left;font-weight:700;margin-bottom:.2em}
.lt-liste{margin:.3em 0 .3em 1.3em;padding:0}.lt-liste li{margin:.15em 0}
.lt-vgl{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:1em;margin:.5em 0}.lt-vgl>div{border:.06em solid color-mix(in srgb,currentColor 45%,transparent);border-radius:.4em;padding:.4em .6em}.lt-vgl .lt-mk{color:var(--k-gelb)}
.lt-fig{margin:.3em 0}.lt-fig figcaption{font-size:.85em;opacity:.85;text-align:center;margin-top:.2em}
.lt-notiz{display:none}
.lt-fehlt{border:2px dashed #c33;color:#c33;padding:.5em;font:600 14px system-ui}
/* Schulaufgabe (Papier) */
.la-blatt{color:#111;font:15px/1.45 "Helvetica Neue",Arial,sans-serif}
.la-blatt .lt-svg{color:#111;width:min(var(--mmw,120mm),100%)}.la-blatt .lt-fig{margin:.5em 0}.la-blatt .lt-fig figcaption{font-size:.85em;color:#444;text-align:left}
.la-blatt .lt-svg text{font-family:"Helvetica Neue",Arial,sans-serif}
.la-blatt .lt-tab,.la-blatt .lt-gr{font-size:.95em}.la-blatt .lt-tab th{color:#111}.la-blatt table td,.la-blatt table th{border-color:#888}
.la-aufg{display:grid;grid-template-columns:2.2em minmax(0,1fr);gap:0 .4em;margin:0 0 1.1em}
.la-nr{font-weight:700;font-size:1.1em}
.la-teil,.la-lz{display:grid;grid-template-columns:1.6em minmax(0,1fr) 2.4em;gap:.4em;margin:.25em 0}
.la-lz{grid-template-columns:minmax(0,1fr) 2.4em;margin:.1em 0 .1em 2em}
.la-be{text-align:right;font-weight:700}
.la-teile{margin-top:.2em}
.la-lteil{margin:.35em 0 .6em}.la-lk{display:flex;flex-wrap:wrap;gap:.35em;align-items:center}
.la-tag{font-size:.75em;border:1px solid #999;border-radius:99px;padding:0 .55em;color:#333}.la-tag.afbI{background:#E3F1E1}.la-tag.afbII{background:#FFF2CC}.la-tag.afbIII{background:#FBE0DC}
.la-kap{margin:0 0 .2em;color:#555;font-size:.85em}.la-hinw{margin:.2em 0 0 2em;font-size:.9em;color:#444}
`;
document.head.appendChild(css);
if (document.body) LK.defs(); else document.addEventListener("DOMContentLoaded", LK.defs);
})();
