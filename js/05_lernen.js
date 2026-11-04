/* ---------- 05_lernen.js ---------- */
/* =====================================================================
   3D-Räume (nur Mac-Version) · Lernfunktionen
   Labor (selbst messen, Punkte eintragen, Gerade zeichnen) · Türrätsel · Geschichte mit Akte · Baustellen-Wegweiser
   Gestufte Hilfen und Einheiten-Check bei Rechenaufgaben · Suchbilder · Lernzettel (Selbsterklärung, druckbar)
   Rückmeldung zu jeder falschen Antwort (Quiz, Suchbild) · Werkzeugkasten L._k für 06_ueben.js (Rechenweg, Fehlersuche, Diagramme) und 07_plan.js (Lernplan, Tagesrätsel)
   Inhalte je Raum: R3D.lern.raum("<id>", {...}) in 40_lern_<id>.js, Geschichten: R3D.lern.geschichte("<welt>", {...})
   Schnittstelle: LERN-API.md
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.api || !window.THREE) return;
const A = R3D.api, T3 = window.THREE, HK = R3D.hooks;
const L = R3D.lern = {raeume: {}, stories: {}, akteTabs: [],   // akteTabs: [{id, label: () => "…", render(body)}] – weitere Reiter der Akte
  raum(id, d){ this.raeume[id] = d; prepRoom(id, d); }, geschichte(welt, d){ this.stories[welt] = d; }};

/* ---------- Speicher (eigener Schlüssel, unabhängig vom 2D-Lernstand) ---------- */
const LKEY = PFX + "-3d-lernen";
const blankLS = () => ({raetsel: {}, hinweis: {}, labor: {}, such: {}, spick: {}, spickAus: {}, besucht: {}, intro: {}, finale: {}, opts: {raetsel: true},
  rechen: {}, umst: {}, fehler: {}, diag: {}, tages: {}});
let LS = blankLS();
try { const raw = localStorage.getItem(LKEY); if (raw) LS = Object.assign(blankLS(), JSON.parse(raw)); } catch (e) {}
LS.opts = Object.assign({raetsel: true}, LS.opts || {});
const lsave = () => { try { localStorage.setItem(LKEY, JSON.stringify(LS)); } catch (e) {} };
const welt = () => (window.WELTEN_API && window.WELTEN_API.id) || "zauber";
const story = () => L.stories[welt()] || L.stories.zauber || null;
const tIdx = id => TOPICS.findIndex(t => t.id === id);
const roomName = id => { const W = window.WELTEN_API, i = tIdx(id); return W && i >= 0 ? W.roomOf(i).n : (TMAP[id] ? TMAP[id].title : id); };
const xp = n => { try { addXP(n); } catch (e) {} };

/* ---------- Zahlen ---------- */
const buchIn = (s, dein) => { const b = (s && s.buch) || "Akte", n = s && s.genus ? s.genus === "n" : /buch$/i.test(b); return dein ? `in dein${n ? "em" : "er"} ${b}` : `${n ? "im" : "in der"} ${b}`; };
const nf = (x, d = 2) => { if (x == null || isNaN(x)) return "–"; const r = +(+x).toFixed(d); return String(r).replace("-", "−").replace(".", ","); };
const pnum = s => numParse(s);
// Zahl und Einheit nicht am Zeilenende trennen („10 | kg“), siehe R3D.util.nbU
const fmtN = s => fmt(R3D.util.nbU(s));
// Begriffs-Check: Δ ↔ „delta“, * und × wie ·; Formel-Begriffe (mit = : / ·) ohne Rücksicht auf Leerzeichen
const nrm = s => norm(String(s || "")).replace(/-/g, " ").replace(/[*×]/g, "·").replace(/(δ|delta)\s*/g, "δ");
// Einheiten-Check: Liegt die Eingabe um einen typischen Umrechnungsfaktor daneben?
function einheitCheck(n, x, o = {}){
  const v = +n.value, u = (n.unit || n.einheit || "").trim(); if (!v || isNaN(x) || !x) return null;
  const r = x / v, near = f => Math.abs(r / f - 1) < 0.02;
  const pre = /^(m|k|c)?(A|V|Ω|N|m|s|g)$/.exec(u);
  if (u === "km/h" && near(1 / 3.6)) return "Du hast vermutlich in **m/s** gerechnet. Gefragt ist **km/h**: Multipliziere mit 3,6.";
  if (u === "m/s" && near(3.6)) return "Du hast vermutlich in **km/h** gerechnet. Gefragt ist **m/s**: Teile durch 3,6.";
  if (/^m\/s./.test(u) && near(3.6)) return `Du hast vermutlich mit **km/h** gerechnet. Rechne die Geschwindigkeit zuerst in **m/s** um (teile durch 3,6) – gefragt ist **${u}**.`;
  // Kehrwert (z. B. I : U statt U : I) – vor den Zehnerfaktoren prüfen, sonst hieße es fälschlich „Komma prüfen“
  if (o.kehrwert !== false && n.kehrwert !== false && Math.abs(Math.abs(v) - 1) > .2 && Math.abs(x * v - 1) < 0.02 && !near(1000) && !near(.001))
    return "Deine Zahl ist der **Kehrwert** des Ergebnisses. Hast du beim Teilen die beiden Größen vertauscht? Schau dir die Formel noch einmal an.";
  if (near(1000)) return pre && !pre[1] ? `Deine Zahl ist 1000-mal zu groß. Hast du in **m${pre[2]}** statt in **${u}** gerechnet? 1 ${u} = 1000 m${pre[2]}.` : `Deine Zahl ist genau 1000-mal zu groß. Prüfe die Einheit: gefragt ist **${u || "die angegebene Einheit"}**.`;
  if (near(0.001)) return pre && pre[1] === "m" ? `Deine Zahl ist 1000-mal zu klein. Gefragt ist **${u}** – hast du in **${pre[2]}** gerechnet? 1 ${pre[2]} = 1000 ${u}.` : `Deine Zahl ist genau 1000-mal zu klein. Prüfe die Einheit: gefragt ist **${u || "die angegebene Einheit"}**.`;
  if (near(100) || near(0.01)) return /(^|[^a-z])(c|m|k)?m(\/|$)/.test(u) ? `Deine Zahl weicht genau um den Faktor 100 ab. Prüfe die Längeneinheit (**cm** oder **m**?) – gefragt ist **${u}**.` : `Deine Zahl weicht genau um den Faktor 100 ab. Prüfe Komma und Einheit (gefragt: **${u}**).`;
  if (near(60) || near(1 / 60)) return `Deine Zahl weicht genau um den Faktor 60 ab. Prüfe die Zeiteinheit (**s**, **min** oder **h**?).`;
  if (near(9.81) || near(1 / 9.81) || near(10) || near(0.1)) return u === "N" || u === "kg" || u === "N/kg"
    ? "Deine Zahl weicht um etwa den Ortsfaktor **g ≈ 9,81 N/kg** ab. Hast du bei F_{G} = m · g das g vergessen oder doppelt verwendet?"
    : (near(10) || near(0.1)) ? `Deine Zahl weicht genau um den Faktor 10 ab. Prüfe Komma und Einheit (gefragt: **${u}**).` : null;
  if (near(-1)) return "Der Betrag stimmt, aber das **Vorzeichen** nicht.";
  return null;
}
R3D.lern.einheitCheck = einheitCheck;
const checkTitel = h => /Kehrwert|Vorzeichen/.test(h) ? "Formel prüfen:" : "Einheit prüfen:";

/* ---------- Oberfläche ---------- */
const css = document.createElement("style");
css.textContent = `
#r3d .r3l-sheet{position:absolute;top:70px;right:16px;bottom:16px;width:min(470px,calc(100% - 32px));overflow:auto;background:var(--surface);color:var(--ink);
  border:1px solid var(--line);border-radius:16px;padding:18px 18px 16px;box-shadow:0 18px 50px rgba(0,0,0,.45);animation:r3dIn .25s ease;z-index:3}
#r3d .r3l-sheet.wide{width:min(820px,calc(100% - 32px))}
#r3d .r3l-sheet h3,#r3l-modal h3{margin:2px 0 6px;font-size:1.3rem}
#r3d .r3l-sheet p,#r3l-modal p{margin:0 0 10px;line-height:1.45}
.r3l-x{position:absolute;top:10px;right:10px;border:0;background:var(--surface-2);color:var(--ink);width:32px;height:32px;border-radius:50%;font-size:1rem;cursor:pointer}
.r3l-steps{display:flex;gap:6px;margin:4px 0 12px;flex-wrap:wrap}.r3l-steps span{font-size:.78rem;padding:4px 9px;border-radius:999px;background:var(--surface-2);opacity:.7}
.r3l-steps span.on{background:var(--accent);color:#111;opacity:1;font-weight:700}.r3l-steps span.ok{opacity:1}
.r3l-ctl{display:grid;gap:10px;margin:8px 0 10px}
.r3l-ctl label{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;align-items:center;font-weight:600;font-size:.95rem}
.r3l-ctl label output{font-variant-numeric:tabular-nums;font-weight:700}
.r3l-ctl input[type=range]{grid-column:1/-1;width:100%;accent-color:var(--accent)}
.r3l-seg{display:flex;flex-wrap:wrap;gap:6px}.r3l-seg button{border:1px solid var(--line);background:var(--surface-2);color:var(--ink);border-radius:999px;padding:6px 12px;font-size:.88rem;cursor:pointer}
.r3l-seg button[aria-pressed=true]{background:var(--accent);color:#111;border-color:var(--accent);font-weight:700}
.r3l-read{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px}.r3l-read div{flex:1;min-width:120px;background:var(--surface-2);border-radius:12px;padding:8px 12px}
.r3l-read small{display:block;opacity:.75;font-size:.78rem}.r3l-read b{font-size:1.35rem;font-variant-numeric:tabular-nums}
.r3l-tab{width:100%;border-collapse:collapse;margin:6px 0 10px;font-variant-numeric:tabular-nums;font-size:.92rem}
.r3l-tab th,.r3l-tab td{border-bottom:1px solid var(--line);padding:5px 6px;text-align:right}.r3l-tab th:first-child,.r3l-tab td:first-child{text-align:left}
.r3l-tab tr.cur td{background:color-mix(in srgb,var(--accent) 22%,transparent)}.r3l-tab td.st{text-align:center;width:28px}
.r3l-chart{width:100%;height:auto;display:block;background:#fff;border-radius:10px;border:1px solid var(--line);cursor:crosshair;touch-action:none}
.r3l-msg{border-radius:12px;padding:9px 12px;margin:8px 0;background:var(--surface-2);font-size:.93rem;line-height:1.4}
.r3l-msg.ok{background:color-mix(in srgb,var(--ok) 22%,var(--surface))}.r3l-msg.no{background:color-mix(in srgb,var(--bad) 18%,var(--surface))}
.r3l-msg.warn{background:color-mix(in srgb,#f0b429 25%,var(--surface))}
.r3l-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.r3l-row .btn{padding:10px 14px;font-size:.95rem}
.r3l-tips{margin:6px 0}.r3l-tips ol{margin:6px 0 0 20px;padding:0}.r3l-tips li{margin:3px 0;line-height:1.4}
.r3l-in{display:flex;gap:8px;align-items:center;margin:8px 0}.r3l-in input{flex:1;min-width:0;font-size:1.05rem;padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink)}
.r3l-in span{font-weight:700}
#r3l-modal{position:fixed;inset:0;z-index:40;display:grid;place-items:center;background:rgba(0,0,0,.55);padding:16px}
#r3l-modal[hidden]{display:none}
#r3l-modal .box{position:relative;width:min(760px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);
  border-radius:18px;padding:22px 22px 18px;box-shadow:0 24px 60px rgba(0,0,0,.5);animation:r3dIn .25s ease}
#r3l-modal .box.wide{width:min(1180px,100%)}
#r3l-modal .story p{font-size:1.04rem}
#r3l-modal .tabs{display:flex;gap:6px;margin:4px 0 14px;flex-wrap:wrap}
#r3l-modal .tabs button{border:1px solid var(--line);background:var(--surface-2);color:var(--ink);border-radius:999px;padding:7px 14px;cursor:pointer}
#r3l-modal .tabs button[aria-pressed=true]{background:var(--accent);color:#111;border-color:var(--accent);font-weight:700}
.r3l-clue{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:8px 0}.r3l-clue.locked{opacity:.6}
.r3l-clue small{display:block;opacity:.75;font-size:.8rem;margin-bottom:2px}
.r3l-bau{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:8px 0}
.r3l-bau b{display:block}.r3l-bau .r3l-row{margin-top:6px}
.r3l-such{position:relative}.r3l-such canvas{width:auto;height:auto;max-width:100%;max-height:calc(100vh - 230px);display:block;margin:0 auto;border-radius:12px;cursor:crosshair;background:#f4efe4}
.r3l-mc{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(460px,92%);background:var(--surface);border:1px solid var(--line);border-radius:14px;
  padding:14px;box-shadow:0 18px 40px rgba(0,0,0,.45)}
.r3l-mc .opt{width:100%;margin:5px 0;text-align:left}
.r3l-spick textarea{width:100%;min-height:96px;font:inherit;font-size:1rem;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);resize:vertical}
.r3l-terms{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.r3l-terms span{font-size:.85rem;padding:3px 9px;border-radius:999px;background:var(--surface-2)}
.r3l-terms span.ok{background:color-mix(in srgb,var(--ok) 30%,var(--surface));font-weight:600}
.r3l-opt{position:absolute;top:62px;right:16px;width:min(340px,calc(100% - 32px));background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;
  padding:14px 16px;box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:4}
.r3l-opt label{display:flex;gap:10px;align-items:flex-start;font-weight:600;margin:6px 0}.r3l-opt label small{display:block;font-weight:400;opacity:.8}
.r3l-qhelp{margin:10px 0 0}.r3l-qhelp .btn{padding:8px 12px;font-size:.92rem}
.r3l-why{margin:8px 0;padding:9px 12px;border-radius:10px;background:var(--surface);border-left:4px solid var(--bad);font-size:.95rem;line-height:1.45}.r3l-why>b:first-child{display:block;margin-bottom:2px}
.r3l-badge{display:inline-block;min-width:18px;padding:0 5px;border-radius:999px;background:#e0533d;color:#fff;font-size:.72rem;line-height:18px;text-align:center;margin-left:4px}
#r3l-print{display:none}
@media print{body>*:not(#r3l-print){display:none!important}#r3l-print{display:block;color:#000;background:#fff;font:11pt/1.4 Georgia,serif}
  #r3l-print h1{font-size:18pt;margin:0 0 4mm}#r3l-print h2{font-size:13pt;margin:6mm 0 2mm;border-bottom:1px solid #999}
  #r3l-print section{break-inside:avoid}#r3l-print ul{margin:1mm 0 2mm 5mm;padding:0}#r3l-print .mine{border-left:3px solid #888;padding-left:3mm;margin:2mm 0}}
`;
document.head.appendChild(css);

const sheet = document.createElement("div"); sheet.className = "r3l-sheet"; sheet.hidden = true; A.root.appendChild(sheet);
const optBox = document.createElement("div"); optBox.className = "r3l-opt"; optBox.hidden = true; A.root.appendChild(optBox);
const modal = document.createElement("div"); modal.id = "r3l-modal"; modal.hidden = true; document.body.appendChild(modal);
const btns = A.root.querySelector(".r3d-btns");
const bAkte = document.createElement("button"); bAkte.className = "r3d-btn"; bAkte.id = "r3dakte"; btns.insertBefore(bAkte, btns.firstChild);
const bOpt = document.createElement("button"); bOpt.className = "r3d-btn"; bOpt.id = "r3dopt"; bOpt.textContent = "⚙"; bOpt.title = "Einstellungen"; btns.appendChild(bOpt);
let sheetClose = null;
function openSheet(html, onClose, o = {}){ closeSheet(); sheet.classList.toggle("wide", !!o.wide); sheet.innerHTML = `<button class="r3l-x" aria-label="Schließen">✕</button>${html}`; sheet.hidden = false; sheet.scrollTop = 0;
  sheetClose = onClose || null; sheet.querySelector(".r3l-x").onclick = closeSheet; A.panel.hidden = true; return sheet; }
function closeSheet(){ if (sheet.hidden) return; sheet.hidden = true; const f = sheetClose; sheetClose = null; if (f) try { f(); } catch (e) { console.error(e); } }
HK.onHidePanel.push(() => closeSheet());
let modalClose = null;
function openModal(html, o = {}){ modal.innerHTML = `<div class="box ${o.wide ? "wide" : ""}">${o.noX ? "" : `<button class="r3l-x" aria-label="Schließen">✕</button>`}${html}</div>`; modal.hidden = false;
  modalClose = o.onClose || null; const x = modal.querySelector(".r3l-x"); if (x) x.onclick = closeModal; return modal.querySelector(".box"); }
function closeModal(){ if (modal.hidden) return; modal.hidden = true; modal.innerHTML = ""; const f = modalClose; modalClose = null; if (f) try { f(); } catch (e) { console.error(e); } }
modal.addEventListener("pointerdown", e => { if (e.target === modal && !modal.querySelector(".box.sticky")) closeModal(); });
HK.onHidePanel.push(() => { if (A.root.hidden && !modal.hidden) { modalClose = null; closeModal(); } });   // 3D verlassen: Fenster still schließen, nicht über der 2D-Ansicht stehen lassen
addEventListener("keydown", e => { if (e.key === "Escape") { if (!modal.hidden) closeModal(); else if (!sheet.hidden) closeSheet(); else if (!optBox.hidden) optBox.hidden = true; } });
// Tasten im Labor/Rätsel nicht als Gehbefehl verwenden
for (const el of [sheet, modal, optBox]) el.addEventListener("keydown", e => e.stopPropagation());
const flowOf = steps => steps.reduce((p, f) => p.then(() => new Promise(res => f(res))), Promise.resolve());   // Schritte nacheinander (jeder ruft res() auf)
// Bild so drehen, dass das Objekt links neben dem Seitenblatt sichtbar bleibt
function lookAside(){ const cv = A.root.querySelector(".r3d-c"), W = cv.clientWidth || innerWidth, sw = sheet.offsetWidth + 16; if (W < 760) return;
  const cam = R3D.camera, hf = Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect), s = Math.atan(sw / W * Math.tan(hf));
  const P = R3D.player; P.faceYaw = (P.faceYaw ?? P.yaw) - s; }

/* ---------- Kopfleiste: Akte und Einstellungen ---------- */
function updButtons(){ const s = story(), n = bauList().length;
  bAkte.innerHTML = `${s ? esc(s.icon || "📜") + " " + esc(s.buch || "Akte") : "📜 Akte"}${n ? `<span class="r3l-badge" title="Baustellen">${n}</span>` : ""}`; }
bAkte.onclick = () => openAkte();
bOpt.onclick = () => { if (!optBox.hidden) { optBox.hidden = true; return; }
  optBox.innerHTML = `<b>Einstellungen</b>
    <label><input type="checkbox" id="r3lraet" ${LS.opts.raetsel ? "checked" : ""}><span>Türrätsel<small>Die Tür zum nächsten Raum öffnet sich erst, wenn das Rätsel davor gelöst ist. Für den Unterricht abschaltbar.</small></span></label>
    <div class="r3l-row"><button class="btn ghost" id="r3lclose">Fertig</button></div>`;
  optBox.hidden = false;
  optBox.querySelector("#r3lraet").onchange = e => { LS.opts.raetsel = e.target.checked; lsave(); updLocks(); toast(LS.opts.raetsel ? "Türrätsel an" : "Türrätsel aus – alle Türen sind offen", 1800); };
  optBox.querySelector("#r3lclose").onclick = () => optBox.hidden = true; };

/* ---------- Bedienelemente (Regler und Auswahl) für Labor und Rätsel ---------- */
function ctlHTML(list, v){ return `<div class="r3l-ctl">${(list || []).map(c => c.optionen
  ? `<div><div style="font-weight:600;font-size:.95rem;margin-bottom:4px">${fmtN(c.name)}</div><div class="r3l-seg" data-c="${c.id}">${c.optionen.map((o, i) => `<button data-i="${i}" aria-pressed="${v[c.id] === i}"><span>${fmtN(o)}</span></button>`).join("")}</div></div>`
  : `<label><span>${fmtN(c.name)}</span><output data-o="${c.id}">${nf(v[c.id], dec(c))} ${esc(c.einheit || "")}</output><input type="range" data-c="${c.id}" min="${c.min}" max="${c.max}" step="${c.schritt || 1}" value="${v[c.id]}" aria-label="${esc(plain(c.name))}"></label>`).join("")}</div>`; }
const dec = c => c.stellen != null ? c.stellen : Math.max(0, -Math.floor(Math.log10(c.schritt || 1) + 1e-9));
function ctlWire(box, list, v, onChange){
  box.querySelectorAll("input[type=range][data-c]").forEach(inp => { const c = list.find(x => x.id === inp.dataset.c);
    inp.oninput = () => { v[c.id] = +inp.value; box.querySelector(`output[data-o="${c.id}"]`).textContent = `${nf(v[c.id], dec(c))} ${c.einheit || ""}`; onChange(); }; });
  box.querySelectorAll(".r3l-seg[data-c]").forEach(sg => sg.querySelectorAll("button").forEach(b => b.onclick = () => {
    v[sg.dataset.c] = +b.dataset.i; sg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); onChange(); })); }
// Canvas-Text mit Tief-/Hochstellung (F_{G}, m/s^{2}); align wie textAlign
function subText(g, s, x, y, align = "left"){
  const f0 = g.font, px0 = +(/(\d+(?:\.\d+)?)px/.exec(f0) || [0, 24])[1], f1 = f0.replace(/(\d+(?:\.\d+)?)px/, Math.round(px0 * .72) + "px"), seg = [];
  String(s ?? "").replace(/\*\*/g, "").replace(/([_^])\{([^{}]{1,24})\}|[^_^]+|[_^]/g, (m, k, t) => { seg.push(k ? {t, k} : {t: m}); return m; });
  const wOf = q => { g.font = q.k ? f1 : f0; return g.measureText(q.t).width; }, tw = seg.reduce((a, q) => a + wOf(q), 0);
  let cx = align === "right" ? x - tw : align === "center" ? x - tw / 2 : x; const al = g.textAlign; g.textAlign = "left";
  for (const q of seg) { g.font = q.k ? f1 : f0; g.fillText(q.t, cx, y + (q.k === "_" ? px0 * .28 : q.k === "^" ? -px0 * .38 : 0)); cx += g.measureText(q.t).width; }
  g.font = f0; g.textAlign = al; }
const initVals = list => Object.fromEntries((list || []).map(c => [c.id, c.wert != null ? c.wert : (c.optionen ? 0 : c.min)]));

/* ---------- Gestufte Tipps + Zahl-Eingabe mit Einheiten-Check (Labor-Aufgabe, Rätsel, Quiz) ---------- */
function tipsHTML(tips){ return tips && tips.length ? `<div class="r3l-tips"><button class="btn ghost" data-tip="0">💡 Tipp 1 von ${tips.length}</button><ol hidden></ol></div>` : ""; }
function tipsWire(box, tips){ const b = box.querySelector("[data-tip]"); if (!b) return; const ol = b.nextElementSibling; let n = 0;
  b.onclick = () => { if (n >= tips.length) return; ol.hidden = false; ol.insertAdjacentHTML("beforeend", `<li>${fmtN(tips[n])}</li>`); n++;
    if (n < tips.length) b.textContent = `💡 Tipp ${n + 1} von ${tips.length}`; else b.remove(); }; }
function numTask(box, task, onOk){
  box.insertAdjacentHTML("beforeend", `<div class="r3l-task"><p><b>${fmtN(task.frage)}</b></p><div class="r3l-in"><input type="text" inputmode="decimal" placeholder="Zahl eingeben" aria-label="Deine Antwort"><span>${fmtN(task.einheit || "")}</span></div>
    <div class="r3l-row"><button class="btn" data-chk>Prüfen</button></div>${tipsHTML(task.tipps)}<div data-fb></div></div>`);
  const t = box.querySelector(".r3l-task:last-child"), inp = t.querySelector("input"), fb = t.querySelector("[data-fb]"); let warned = false, tries = 0;
  tipsWire(t, task.tipps);
  const check = () => { const x = pnum(inp.value); if (isNaN(x)) { inp.focus(); return; }
    const v = +task.wert, tol = task.toleranz != null ? +task.toleranz : Math.abs(v) * (task.rtol || .03);
    if (Math.abs(x - v) <= tol + 1e-12) { fb.innerHTML = `<div class="r3l-msg ok"><b>Richtig!</b> ${fmtN(task.loesung || "")}</div>`; inp.disabled = true; t.querySelector("[data-chk]").remove(); onOk && onOk(); return; }
    const h = einheitCheck({value: v, unit: task.einheit, kehrwert: task.kehrwert}, x); tries++;
    if (h && !warned) { warned = true; fb.innerHTML = `<div class="r3l-msg warn"><b>${checkTitel(h)}</b> ${fmtN(h)} Versuch es noch einmal.</div>`; return; }
    fb.innerHTML = `<div class="r3l-msg no"><b>Noch nicht.</b> ${tries >= 2 && task.loesung ? "Lösungsweg: " + fmtN(task.loesung) : "Nutze die Tipps oder lies noch einmal genau ab."}</div>`; };
  t.querySelector("[data-chk]").onclick = check; inp.onkeydown = e => { if (e.key === "Enter") check(); };
}

/* =====================================================================
   1) Labor: Regler → Messwerte → Tabelle → selbst ins Diagramm eintragen → Gerade → Auswertung
   ===================================================================== */
HK.ctxExt.push(ctx => {
  ctx.lab = (obj, spec) => { const ia = obj.userData.ia; if (!ia) { console.warn("R3D: ctx.lab braucht ein Exponat (erst ctx.exhibit)"); return; }
    ia.lab = spec; spec._room = ctx.key; try { if (ia.sub == null || /anklicken/.test(ia.sub)) ia.sub = (ia.sub ? ia.sub + " · " : "") + "🔬 Labor"; } catch (e) {}
    const done = () => (LS.labor[ctx.key] || {})[spec.id];
    Object.defineProperty(ia, "extra", {configurable: true, get(){ return `<div class="r3d-acts"><button class="btn" data-lab="1">🔬 ${done() ? "Labor wiederholen" : "Selbst messen im Labor"}</button></div>`; }});
    return spec; };
});
A.panel.addEventListener("click", e => { const b = e.target.closest("[data-lab]"); if (!b) return; const c = A.cur(); if (!c) return;
  const o = c.ctx._inter.find(x => x.userData.ia && (x.userData.ia.title === A.panel.querySelector("h3").textContent || x.userData.ia._key === A.panel.querySelector("h3").textContent) && x.userData.ia.lab) || c.ctx._inter.find(x => x.userData.ia && x.userData.ia.lab);
  if (o) openLab(o.userData.ia.lab); });

let LAB = null;   // offenes Labor (für Tests)
function openLab(spec){
  const v = initVals(spec.regler), rows = [], ax = spec.achsen, fit = spec.gerade ?? "ursprung", need = spec.punkte || 5;
  let stage = 0, plotted = 0, line = null, lineOk = false, done = false, fitT = 0;
  const all = () => Object.assign({}, v, spec.messe(v));
  const getX = r => r[ax.x.id], getY = r => r[ax.y.id];
  const stOf = id => { const a = (spec.anzeige || []).find(x => x.id === id); if (a) return a.stellen ?? 2; const c = (spec.regler || []).find(x => x.id === id); return c ? dec(c) : 3; }, stX = stOf(ax.x.id), stY = stOf(ax.y.id);
  const box = openSheet(`<div class="eyebrow">Labor · ${esc(SHORT[spec._room] || "")}</div><h3>🔬 ${fmtN(spec.titel)}</h3><p>${fmtN(spec.text || "")}</p>
    <div class="r3l-steps"><span data-s="0">1 Messen</span><span data-s="1">2 Ins Diagramm</span><span data-s="2">3 Auswerten</span></div>
    ${ctlHTML(spec.regler, v)}<div class="r3l-read"></div>
    <div class="r3l-row"><button class="btn" id="r3lrec">＋ Messwert aufnehmen</button></div><div class="r3l-row" id="r3lbackrow" hidden><button class="btn ghost" id="r3lback">← Weitere Messwerte aufnehmen</button></div>
    <table class="r3l-tab"><thead><tr><th>Nr.</th><th>${fmtN(ax.x.name)}</th><th>${fmtN(ax.y.name)}</th><th></th></tr></thead><tbody></tbody></table>
    <div id="r3lchartw"><canvas class="r3l-chart" width="880" height="600"></canvas></div><div id="r3lmsg"></div><div id="r3ltask"></div>`,
    () => { clearTimeout(fitT); LAB = null; spec.live && spec.live(null, null); });
  lookAside();
  const read = box.querySelector(".r3l-read"), tb = box.querySelector("tbody"), cv = box.querySelector(".r3l-chart"), g = cv.getContext("2d"), msg = box.querySelector("#r3lmsg");
  const say = (html, cls = "") => { msg.innerHTML = html ? `<div class="r3l-msg ${cls}">${html}</div>` : ""; };
  const upd = () => { const m = spec.messe(v); read.innerHTML = (spec.anzeige || []).map(a => `<div><small>${fmtN(a.name)}</small><b>${nf(m[a.id], a.stellen ?? 2)} ${esc(a.einheit || "")}</b></div>`).join("");
    try { spec.live && spec.live(Object.assign({}, v), m); } catch (e) { console.error(e); } };
  ctlWire(box, spec.regler, v, upd); upd();
  // Diagramm
  const PAD = {l: 92, r: 24, t: 22, b: 70}, W = cv.width, H = cv.height, x0 = ax.x.min || 0, y0 = ax.y.min || 0;
  const px = x => PAD.l + (x - x0) / (ax.x.max - x0) * (W - PAD.l - PAD.r), py = y => H - PAD.b - (y - y0) / (ax.y.max - y0) * (H - PAD.t - PAD.b);
  const dx = X => x0 + (X - PAD.l) / (W - PAD.l - PAD.r) * (ax.x.max - x0), dy = Y => y0 + (H - PAD.b - Y) / (H - PAD.t - PAD.b) * (ax.y.max - y0);
  let miss = null;
  function draw(){
    g.clearRect(0, 0, W, H); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); g.font = "22px system-ui, sans-serif"; g.fillStyle = "#333"; g.strokeStyle = "#e3e3e3"; g.lineWidth = 1;
    const tx = ax.x.teil, ty = ax.y.teil;
    for (let x = x0; x <= ax.x.max + 1e-9; x += tx) { g.beginPath(); g.moveTo(px(x), py(y0)); g.lineTo(px(x), py(ax.y.max)); g.stroke(); g.textAlign = "center"; g.fillText(nf(x, 3), px(x), H - PAD.b + 28); }
    for (let y = y0; y <= ax.y.max + 1e-9; y += ty) { g.beginPath(); g.moveTo(px(x0), py(y)); g.lineTo(px(ax.x.max), py(y)); g.stroke(); g.textAlign = "right"; g.fillText(nf(y, 3), PAD.l - 10, py(y) + 7); }
    // feines Raster (halbe Teilung) zum genauen Ablesen
    g.strokeStyle = "#f2f2f2"; for (let x = x0 + tx / 2; x < ax.x.max; x += tx) { g.beginPath(); g.moveTo(px(x), py(y0)); g.lineTo(px(x), py(ax.y.max)); g.stroke(); }
    for (let y = y0 + ty / 2; y < ax.y.max; y += ty) { g.beginPath(); g.moveTo(px(x0), py(y)); g.lineTo(px(ax.x.max), py(y)); g.stroke(); }
    g.strokeStyle = "#222"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px(x0), py(ax.y.max) - 8); g.lineTo(px(x0), py(y0)); g.lineTo(px(ax.x.max) + 8, py(y0)); g.stroke();
    g.fillStyle = "#111"; g.font = "600 24px system-ui, sans-serif"; subText(g, ax.x.name, W - PAD.r, H - 14, "right");
    g.save(); g.translate(26, PAD.t + 4); g.rotate(-Math.PI / 2); subText(g, ax.y.name, 0, 0, "right"); g.restore();
    // Gerade / Kurve
    if (line) { g.strokeStyle = lineOk ? "#1a8a4a" : "#2f6fd6"; g.lineWidth = 4; g.beginPath(); g.moveTo(px(line[0][0]), py(line[0][1])); g.lineTo(px(line[1][0]), py(line[1][1])); g.stroke();
      if (!lineOk) for (const [i, p] of line.entries()) if (fit === "frei" || i === 1) { g.fillStyle = "#2f6fd6"; g.beginPath(); g.arc(px(p[0]), py(p[1]), 13, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(px(p[0]), py(p[1]), 5, 0, 7); g.fill(); } }
    if (!fit && plotted >= need && plotted === rows.length) { const pts = rows.map(r => [getX(r), getY(r)]).sort((a, b) => a[0] - b[0]);
      if (spec.nullpunkt && x0 <= 0 && y0 <= 0 && pts[0][0] > 1e-9) pts.unshift([0, 0]);   // Kennlinie beginnt bei (0 | 0), auch wenn dort nicht gemessen wurde
      g.strokeStyle = "#1a8a4a"; g.lineWidth = 3.5; g.beginPath(); pts.forEach(([x, y], i) => { const X = px(x), Y = py(y); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); }
    // Punkte
    rows.forEach(r => { if (!r._p) return; const X = px(getX(r)), Y = py(getY(r)); g.strokeStyle = "#c0392b"; g.lineWidth = 4; g.beginPath(); g.moveTo(X - 9, Y - 9); g.lineTo(X + 9, Y + 9); g.moveTo(X + 9, Y - 9); g.lineTo(X - 9, Y + 9); g.stroke(); });
    if (miss) { g.strokeStyle = "rgba(120,120,120,.8)"; g.lineWidth = 3; g.beginPath(); g.arc(miss[0], miss[1], 12, 0, 7); g.stroke(); }
  }
  function table(){
    const nxt = rows.findIndex(r => !r._p);
    tb.innerHTML = rows.map((r, i) => `<tr class="${stage === 1 && i === nxt ? "cur" : ""}"><td>${i + 1}</td><td>${nf(getX(r), stX)}</td><td>${nf(getY(r), stY)}</td><td class="st">${r._p ? "✓" : stage >= 1 ? "○" : ""}</td></tr>`).join("")
      || `<tr><td colspan="4" class="muted" style="text-align:center">Noch keine Messwerte – stelle den Regler ein und nimm Werte auf.</td></tr>`;
    box.querySelectorAll(".r3l-steps span").forEach(s => { const k = +s.dataset.s; s.className = k === stage ? "on" : k < stage ? "ok" : ""; });
  }
  function setStage(s){ stage = s; box.querySelector("#r3lbackrow").hidden = s === 0 || done; table(); draw();
    // Messteil einklappen, damit Tabelle und Diagramm zusammen ins Blatt passen
    if (s >= 1) [box.querySelector(".r3l-ctl"), read, box.querySelector("#r3lrec").parentElement].forEach(e => { if (e) e.hidden = true; });
    if (s === 1 && plotted === rows.length && rows.length) return setStage(2);   // nach „Weitere Messwerte“ ohne neuen Wert: gleich weiter zur Auswertung
    if (s === 1) {
      say(`Trage jetzt jeden Messpunkt selbst ins Diagramm ein: <b>Klicke an die richtige Stelle</b>. Die markierte Zeile ist dran.`); cv.scrollIntoView({block: "center"}); }
    if (s === 2) startFit(); }
  box.querySelector("#r3lrec").onclick = () => {
    const r = all(), k = rows.findIndex(q => Math.abs(getX(q) - getX(r)) < 1e-9 && (spec.regler || []).every(c => !c.optionen || q[c.id] === r[c.id]));
    if (k >= 0) { say(`Diesen Messwert hast du schon (Nr. ${k + 1}). Stelle einen anderen Wert ein.`, "warn"); return; }
    if (getX(r) > ax.x.max + 1e-9 || getY(r) > ax.y.max + 1e-9 || getX(r) < x0 - 1e-9 || getY(r) < y0 - 1e-9) { say("Dieser Wert passt nicht ins Diagramm. Wähle einen kleineren Wert.", "warn"); return; }
    rows.push(r); rows.sort((a, b) => getX(a) - getX(b)); if (stage === 0 && rows.length >= need) { say(`✓ ${rows.length} Messwerte – genug für ein Diagramm. Du kannst noch mehr aufnehmen oder weitermachen.`, "ok");
      goBtn(); }
    else if (stage === 0) say(`Messwert ${rows.length} aufgenommen. Noch ${need - rows.length} bis zum Diagramm.`);
    table(); };
  function goBtn(){ if (box.querySelector("#r3lgo")) return; box.querySelector("#r3lrec").insertAdjacentHTML("afterend", `<button class="btn ghost" id="r3lgo">Weiter: ins Diagramm eintragen →</button>`);
    box.querySelector("#r3lgo").onclick = () => { box.querySelector("#r3lgo").remove(); box.querySelector("#r3lrec").disabled = true; setStage(1); }; }
  // Zurück zum Messen (z. B. wenn die Messpunkte den gefragten Bereich nicht abdecken): eingetragene Punkte bleiben, Gerade und Aufgabe beginnen neu
  box.querySelector("#r3lback").onclick = () => { if (done) return; clearTimeout(fitT); fitT = 0; line = null; lineOk = false; drag = -1; miss = null;
    const fr = box.querySelector("#r3lfitrow"); if (fr) fr.remove(); box.querySelector("#r3ltask").innerHTML = "";
    [box.querySelector(".r3l-ctl"), read, box.querySelector("#r3lrec").parentElement].forEach(e => { if (e) e.hidden = false; });
    box.querySelector("#r3lrec").disabled = false; setStage(0); if (rows.length >= need) goBtn();
    say(`Nimm weitere Messwerte auf – deine eingetragenen Punkte bleiben erhalten. Danach trägst du die Punkte ein, die ${plotted ? "noch fehlen" : "in der Tabelle stehen"}.`);
    box.querySelector(".r3l-ctl").scrollIntoView({block: "center"}); };
  const evPt = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height]; };
  let drag = -1;
  cv.addEventListener("pointerdown", e => { const [X, Y] = evPt(e);
    if (stage === 1) { const i = rows.findIndex(r => !r._p); if (i < 0) return; const r = rows[i];
      const okx = Math.abs(dx(X) - getX(r)) <= (ax.x.max - x0) * .035, oky = Math.abs(dy(Y) - getY(r)) <= (ax.y.max - y0) * .035;
      if (okx && oky) { r._p = true; plotted++; miss = null; const nx = rows.findIndex(q => !q._p);
        if (nx < 0) { say("✓ Alle Punkte eingetragen.", "ok"); clearTimeout(fitT); fitT = setTimeout(() => { fitT = 0; if (stage === 1 && plotted === rows.length && cv.isConnected) setStage(2); }, 400); }
        else say(`✓ Punkt ${i + 1} sitzt. Weiter mit Punkt ${nx + 1}.`, "ok"); }
      else { miss = [X, Y]; say(`Daneben: Du hast bei ${fmtN(ax.x.name.split(" in ")[0])} ≈ ${nf(dx(X), 2)} und ${fmtN(ax.y.name.split(" in ")[0])} ≈ ${nf(dy(Y), 3)} geklickt. Gesucht ist (${nf(getX(r), stX)} | ${nf(getY(r), stY)}). Lies beide Achsen noch einmal ab.`, "no"); }
      table(); draw(); return; }
    if (stage === 2 && line && !lineOk) { const hit = line.findIndex((p, i) => (fit === "frei" || i === 1) && Math.hypot(px(p[0]) - X, py(p[1]) - Y) < 34);
      drag = hit >= 0 ? hit : (fit === "ursprung" ? 1 : -1); if (drag >= 0) { cv.setPointerCapture(e.pointerId); move(X, Y); } } });
  const move = (X, Y) => { const p = [Math.max(x0, Math.min(ax.x.max, dx(X))), Math.max(y0, Math.min(ax.y.max, dy(Y)))]; line[drag] = p; draw(); };
  cv.addEventListener("pointermove", e => { if (drag < 0) return; const [X, Y] = evPt(e); move(X, Y); });
  cv.addEventListener("pointerup", () => { drag = -1; });
  function startFit(){
    const pts = rows.map(r => [getX(r), getY(r)]);
    if (!fit) { say("Die Punkte sind zu einer Kurve verbunden. Beantworte jetzt die Frage zur Auswertung.", "ok"); draw(); return finish(); }
    if (fit === "ursprung") line = [[x0, y0], [ax.x.max * .55, ax.y.max * .25]]; else line = [[x0 + (ax.x.max - x0) * .08, y0 + (ax.y.max - y0) * .6], [ax.x.max * .8, y0 + (ax.y.max - y0) * .2]];
    say(fit === "ursprung" ? "Zeichne die <b>Ausgleichsgerade</b>: Sie beginnt im Ursprung. Ziehe den blauen Griff so, dass die Gerade möglichst gut durch alle Punkte geht."
      : "Zeichne die <b>Ausgleichsgerade</b>: Ziehe die beiden blauen Griffe so, dass die Gerade möglichst gut durch alle Punkte geht.");
    draw(); const old = box.querySelector("#r3lfitrow"); if (old) old.remove(); msg.insertAdjacentHTML("afterend", `<div class="r3l-row" id="r3lfitrow"><button class="btn" id="r3lfit">Gerade prüfen</button></div>`); cv.scrollIntoView({block: "center"});
    box.querySelector("#r3lfit").onclick = () => {
      const [[ax1, ay1], [ax2, ay2]] = line; if (Math.abs(ax2 - ax1) < 1e-9) return;
      const k = (ay2 - ay1) / (ax2 - ax1), b = ay1 - k * ax1, span = ax.y.max - y0;
      const dev = Math.max(...pts.map(([x, y]) => Math.abs(k * x + b - y))) / span;
      // Vergleich mit der besten Geraden
      let kb, bb; if (fit === "ursprung") { kb = pts.reduce((s, [x, y]) => s + x * y, 0) / (pts.reduce((s, [x]) => s + x * x, 0) || 1); bb = 0; }
      else { const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0), sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
        kb = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1); bb = (sy - kb * sx) / n; }
      const devBest = Math.max(...pts.map(([x, y]) => Math.abs(kb * x + bb - y))) / span;
      if (dev <= Math.max(.045, devBest * 1.6)) { lineOk = true; line = [[x0, kb * x0 + bb], [ax.x.max, kb * ax.x.max + bb]];
        if (fit === "ursprung") line[0] = [0, 0];
        say(`✓ Die Gerade passt gut. ${fit === "ursprung" ? "Eine <b>Ursprungsgerade</b> bedeutet: Die beiden Größen sind <b>proportional</b>." : ""}`, "ok");
        box.querySelector("#r3lfitrow").remove(); draw(); finish(); }
      else say("Die Gerade liegt noch zu weit neben einigen Punkten. Verschiebe den Griff, bis die Punkte gleichmäßig um die Gerade herum liegen.", "no"); };
  }
  function finish(){
    const tbox = box.querySelector("#r3ltask");
    const end = () => { if (done) return; done = true; box.querySelector("#r3lbackrow").hidden = true; const R = LS.labor[spec._room] || (LS.labor[spec._room] = {}); const first = !R[spec.id]; R[spec.id] = 1; lsave();
      if (first) xp(25); tbox.insertAdjacentHTML("beforeend", `<div class="r3l-msg ok"><b>✓ Labor geschafft${first ? " · +25 XP" : ""}</b><br>${fmtN(spec.merke || "")}</div>`); };
    tbox.innerHTML = ""; if (spec.aufgabe) numTask(tbox, spec.aufgabe, end); else end();
    tbox.scrollIntoView({block: "nearest", behavior: "smooth"});
  }
  table(); draw();
  LAB = {spec, v, rows, get stage(){ return stage; }, get lineOk(){ return lineOk; }, get done(){ return done; }, cv, px, py, ax, line: () => line, set: (id, val) => {
    const inp = box.querySelector(`input[data-c="${id}"]`); if (inp) { inp.value = val; inp.dispatchEvent(new Event("input")); } else { const b = box.querySelector(`.r3l-seg[data-c="${id}"] button[data-i="${val}"]`); if (b) b.click(); } }};
}

/* =====================================================================
   2) Türrätsel + 3) Geschichte (Hinweis je Raum) + 7) Lernzettel vor dem Weitergehen
   ===================================================================== */
const isFront = (ia, c) => ia.kind === "door" && !c.isHall && c.doors && c.doors.indexOf(ia) === 1;   // [0] = Rücktür, [1] = Vordertür
const locked = id => LS.opts.raetsel && L.raeume[id] && L.raeume[id].raetsel && !LS.raetsel[id];
R3D.gate = (ia, pass) => {
  const c = A.cur();
  if (c && c.isHall && ia.kind === "door" && ia.to === "pruefung") {   // Prüfungstür der Halle: Finale, sobald alle Hinweise gefunden sind
    const s = story(); if (!s || !s.finale || !allClues() || LS.finale[welt()]) return false;
    const a = A.approachDoor(ia); A.walkTo(a.x, a.z, () => showFinale(pass), a.yaw); return true; }
  if (!c || !isFront(ia, c)) return false;
  const id = c.key, steps = [];
  if (locked(id)) { const a = A.approachDoor(ia); A.walkTo(a.x, a.z, () => openRaetsel(id, ia, pass), a.yaw); return true; }
  if (!hat(id) && story()) steps.push(res => revealClue(id, res));
  if (L.raeume[id] && L.raeume[id].spick && !LS.spick[id] && !LS.spickAus[id]) steps.push(res => openSpick(id, {vorDerTuer: true, weiter: res}));
  const fin = ia.to === "pruefung" && allClues() && story() && !LS.finale[welt()];
  if (!steps.length && !fin) return false;
  const a = A.approachDoor(ia); A.walkTo(a.x, a.z, () => flowOf(steps).then(() => { if (ia.to === "pruefung" && allClues() && !LS.finale[welt()]) showFinale(pass); else pass(); }), a.yaw);
  return true;
};
let RTS = null;   // offenes Rätsel (für Tests)
function openRaetsel(id, ia, pass){
  const R = L.raeume[id].raetsel, v = initVals(R.regler); let raf = 0, t0 = performance.now(), solved = false, tries = 0;
  const box = openSheet(`<div class="eyebrow">Türrätsel · ${esc(roomName(id))}</div><h3>🔒 ${fmtN(R.titel)}</h3><p>${fmtN(R.text)}</p>
    <canvas class="r3l-chart" width="900" height="540" style="cursor:default;background:#10131a"></canvas>${ctlHTML(R.regler, v)}
    <div class="r3l-row"><button class="btn" id="r3lpr">Prüfen</button></div>${tipsHTML(R.tipps)}<div id="r3lrm"></div>`,
    () => { cancelAnimationFrame(raf); RTS = null; }, {wide: true});
  lookAside();
  const cv = box.querySelector("canvas"), g = cv.getContext("2d"), m = box.querySelector("#r3lrm");
  const frame = () => { try { g.save(); R.zeichne(g, cv.width, cv.height, Object.assign({}, v), (performance.now() - t0) / 1000, solved); g.restore(); } catch (e) { console.error(e); } raf = requestAnimationFrame(frame); };
  ctlWire(box, R.regler, v, () => { if (!solved) m.innerHTML = ""; }); tipsWire(box, R.tipps); frame();
  box.querySelector("#r3lpr").onclick = () => {
    let r; try { r = R.pruefe(Object.assign({}, v)); } catch (e) { console.error(e); r = false; } if (typeof r === "boolean") r = {ok: r};
    if (!r.ok) { tries++; m.innerHTML = `<div class="r3l-msg no">${fmtN(r.text || "Noch nicht – die Tür bleibt zu.")}${tries >= 2 && R.tipps && R.tipps.length ? " Tipp: Nutze die Hinweise oben." : ""}</div>`; return; }
    solved = true; const first = !LS.raetsel[id]; LS.raetsel[id] = 1; lsave(); if (first) xp(20); updLocks(); try { (sfxUnlock || (() => {}))(); } catch (e) {}
    box.querySelectorAll("input,.r3l-seg button,#r3lpr").forEach(x => x.disabled = true);
    m.innerHTML = `<div class="r3l-msg ok"><b>🔓 Geschafft${first ? " · +20 XP" : ""}!</b> ${fmtN(R.erfolg || r.text || "Die Tür ist entriegelt.")}</div><div class="r3l-row"><button class="btn" id="r3lweiter">Weiter →</button></div>`;
    box.querySelector("#r3lweiter").onclick = () => { sheetClose = null; closeSheet(); cancelAnimationFrame(raf); RTS = null;
      const steps = []; if (!hat(id) && story()) steps.push(res => revealClue(id, res));
      if (L.raeume[id].spick && !LS.spick[id] && !LS.spickAus[id]) steps.push(res => openSpick(id, {vorDerTuer: true, weiter: res}));
      flowOf(steps).then(() => { if (ia.to === "pruefung" && allClues() && !LS.finale[welt()]) showFinale(pass); else pass(); }); };
  };
  RTS = {id, v, set: (k, val) => { const inp = box.querySelector(`input[data-c="${k}"]`); if (inp) { inp.value = val; inp.dispatchEvent(new Event("input")); } else { const b = box.querySelector(`.r3l-seg[data-c="${k}"] button[data-i="${val}"]`); if (b) b.click(); } },
    pruefen: () => box.querySelector("#r3lpr").click(), weiter: () => { const b = box.querySelector("#r3lweiter"); if (b) b.click(); }, get solved(){ return solved; }};
}
let sfxUnlock = null;
try { const AC = window.AudioContext || window.webkitAudioContext; let ac = null;
  sfxUnlock = () => { if (!AC) return; ac = ac || new AC(); const t = ac.currentTime; [523, 659, 784].forEach((f, i) => { const o = ac.createOscillator(), gn = ac.createGain(); o.frequency.value = f;
    gn.gain.setValueAtTime(0, t + i * .09); gn.gain.linearRampToValueAtTime(.12, t + i * .09 + .02); gn.gain.exponentialRampToValueAtTime(.001, t + i * .09 + .35); o.connect(gn).connect(ac.destination); o.start(t + i * .09); o.stop(t + i * .09 + .4); }); }; } catch (e) {}

// Schloss an der Vordertür (rot = verschlossen); verschwindet, sobald das Rätsel gelöst oder abgeschaltet ist
const lockTex = () => R3D.util.canvasTex(256, 256, (g, w) => { g.clearRect(0, 0, w, w); const c = w / 2;
  const gr = g.createRadialGradient(c, c, 10, c, c, c); gr.addColorStop(0, "rgba(255,90,70,.95)"); gr.addColorStop(.7, "rgba(160,20,20,.9)"); gr.addColorStop(1, "rgba(80,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 14; g.beginPath(); g.arc(c, c - 18, 34, Math.PI, 0); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.roundRect(c - 52, c - 18, 104, 82, 12); g.fill(); g.fillStyle = "#8a1010"; g.beginPath(); g.arc(c, c + 16, 12, 0, 7); g.fill(); g.fillRect(c - 5, c + 16, 10, 28); }, "r3l-lock");
function updLocks(){ const c = A.cur(); if (!c || c.isHall) return; const ia = c.doors && c.doors[1]; if (!ia) return;
  const on = locked(c.key); if (ia._lock) ia._lock.visible = on; ia.sub = on ? "🔒 verschlossen – Rätsel lösen" : (ia._sub0 ?? ia.sub); }
HK.afterBuild.push(room => {
  if (room.isHall) return hallExtras(room);
  const d = room.doors && room.doors[1]; if (d && L.raeume[room.key] && L.raeume[room.key].raetsel) {
    d._sub0 = d.sub; const grp = new T3.Group(); grp.position.set(0, 1.75, .34); d.door.group.add(grp);
    const disc = new T3.Mesh(new T3.CircleGeometry(.32, 40), new T3.MeshBasicMaterial({map: lockTex(), transparent: true, toneMapped: false, depthWrite: false})); grp.add(disc);
    const gl = room.ctx.glow(0xff4a3a, 1.1); gl.position.z = -.02; gl.userData.noPick = true; grp.add(gl); d._lock = grp;
    room.ctx.tick((dt, t) => { if (grp.visible) { const k = .9 + .1 * Math.sin(t * 3); grp.scale.setScalar(k); } });
  }
  const sb = L.raeume[room.key] && L.raeume[room.key].suchbild; if (sb && sb.ort) suchbildFrame(room, sb);
});
HK.afterEnter.push(c => { updLocks(); updButtons(); });

/* ---------- Geschichte ---------- */
// Hinweise je Welt (jede Welt erzählt ihre eigene Geschichte); das Türrätsel bleibt weltübergreifend gelöst
const hk = id => welt() + ":" + id, hat = id => !!LS.hinweis[hk(id)];
const allClues = () => TOPICS.every(t => hat(t.id));
function revealClue(id, done){
  const s = story(), r = s && s.raeume && s.raeume[id]; LS.hinweis[hk(id)] = 1; lsave(); updButtons();
  if (!r) return done();
  const n = TOPICS.filter(t => hat(t.id)).length;
  openModal(`<div class="story"><div class="eyebrow">${esc(s.icon || "📜")} ${esc(s.buch || "Akte")} · Hinweis ${n} von ${TOPICS.length}</div><h3>${fmtN(r.kapitel || roomName(id))}</h3>
    <p>${fmtN(r.hinweis)}</p>${luecke(id, "hinweis")}<p class="note">Der Hinweis steht jetzt ${esc(buchIn(s, 1))} (Knopf oben rechts).</p>
    <div class="r3l-row"><button class="btn" id="r3lok">Weiter</button></div></div>`, {onClose: done});
  modal.querySelector("#r3lok").onclick = closeModal;
}
// Räume lassen sich in beliebiger Reihenfolge besuchen, die Geschichte ist aber der Reihe nach erzählt: auf fehlende Kapitel hinweisen
const gesehen = id => LS.besucht[welt() + ":" + id] || hat(id);
// [3, 4, 5, 6, 8] → „3 bis 6 und 8“
function kapListe(ns){ const runs = []; ns.forEach(n => { const r = runs[runs.length - 1]; if (r && n === r[1] + 1) r[1] = n; else runs.push([n, n]); });
  const parts = runs.flatMap(([a, b]) => b - a >= 2 ? [`${a} bis ${b}`] : a === b ? [String(a)] : [String(a), String(b)]);
  return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(", ") + " und " + parts[parts.length - 1]; }
function luecke(id, art){ const i = tIdx(id), s = story(); if (i <= 0 || !s) return "";
  const fehlt = TOPICS.slice(0, i).map((t, j) => [t.id, j + 1]).filter(([t]) => art === "hinweis" ? !hat(t) : !gesehen(t)).map(([, n]) => n);
  if (!fehlt.length) return ""; const liste = kapListe(fehlt), viele = fehlt.length > 1;   // \u00a0: Zahl bleibt bei „Kapitel“
  if (art === "hinweis") return `<p class="note">${esc(viele ? `Dir fehlen noch die Hinweise aus den Kapiteln\u00a0${liste} – sie warten an den Vordertüren der Räume davor.`
    : `Dir fehlt noch der Hinweis aus Kapitel\u00a0${liste} – er wartet an der Vordertür des ${liste}.\u00a0Raums.`)}</p>`;
  const txt = `Die Geschichte wird der Reihe nach erzählt – ${viele ? "die Kapitel" : "Kapitel"}\u00a0${liste} kennst du noch nicht. Du kannst hier trotzdem lernen; alle Kapitel sammelst du ${buchIn(s, 1)}.`;
  return art === "text" ? txt : `<p class="note">${esc(txt)}</p>`; }
function showFinale(pass){ const s = story(); LS.finale[welt()] = 1; lsave();
  if (!s || !s.finale) return pass();
  openModal(`<div class="story"><div class="eyebrow">${esc(s.icon || "📜")} ${esc(s.titel || "")}</div><h3>${fmtN(s.finaleTitel || "Das Finale")}</h3>${s.finale.map(p => `<p>${fmtN(p)}</p>`).join("")}
    <div class="r3l-row"><button class="btn" id="r3lok">${fmtN(s.finaleKnopf || "Zur Schulaufgabe")}</button></div></div>`, {onClose: pass});
  modal.querySelector("#r3lok").onclick = closeModal; }
HK.afterEnter.push((c, from, opt) => {
  const s = story(), w = welt(); if (!s) return;
  // Auftrag und Kapitelauftakt nur zeigen, solange man noch hier ist (kein Weltwechsel, kein Raumwechsel, kein Abblenden zur 2D-Ansicht);
  // der Auftrag gilt erst als gesehen, wenn man ihn selbst schließt – still geschlossen (3D verlassen) erscheint er beim nächsten Mal wieder
  const still = () => !A.root.hidden && A.cur() === c && modal.hidden && welt() === w && !A.moving();
  if (c.isHall) { if (!LS.intro[w]) setTimeout(() => { if (!still() || LS.intro[w]) return; openModal(`<div class="story"><div class="eyebrow">${esc(s.icon || "📜")} ${esc(s.titel || "")}</div>
      <h3>${fmtN(s.introTitel || "Dein Auftrag")}</h3>${(s.intro || []).map(p => `<p>${fmtN(p)}</p>`).join("")}
      <p class="note">Deine Hinweise sammelst du ${esc(buchIn(s))} – Knopf oben rechts.</p><div class="r3l-row"><button class="btn" id="r3lok">${fmtN(s.introKnopf || "Los geht's")}</button></div></div>`, {onClose: () => { LS.intro[w] = 1; lsave(); }});
      modal.querySelector("#r3lok").onclick = closeModal; }, 700); return; }
  const r = s.raeume && s.raeume[c.key], key = w + ":" + c.key;
  if (r && r.auftakt && !LS.besucht[key] && !(opt && opt.stage != null))
    setTimeout(() => { if (!still() || LS.besucht[key] || !A.panel.hidden || !sheet.hidden) return; LS.besucht[key] = 1; lsave(); A.infoPanel({eyebrow: `${s.icon || "📜"} Kapitel ${tIdx(c.key) + 1} · ${s.buch || ""}`, title: r.kapitel || roomName(c.key), text: r.auftakt + (luecke(c.key, "text") ? "\n\n" + luecke(c.key, "text") : "")}); }, 900);
});

/* ---------- Akte: Geschichte · Baustellen · Lernzettel ---------- */
let akteTab = "geschichte";
function openAkte(tab){
  akteTab = tab || akteTab; const s = story();
  const box = openModal(`<div class="eyebrow">${esc(s ? s.titel || "" : "")}</div><h3>${esc(s ? (s.icon || "📜") + " " + (s.buch || "Akte") : "📜 Akte")}</h3>
    <div class="tabs"><button data-t="geschichte">Geschichte</button><button data-t="baustellen">Baustellen${bauList().length ? ` (${bauList().length})` : ""}</button><button data-t="zettel">Lernzettel</button>${L.akteTabs.map(x => `<button data-t="${esc(x.id)}">${esc(x.label())}</button>`).join("")}</div><div id="r3lakte"></div>`, {wide: false});
  const body = box.querySelector("#r3lakte");
  const show = t => { akteTab = t; box.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === t));
    if (t === "geschichte") body.innerHTML = s ? `${(s.intro || []).map(p => `<p>${fmtN(p)}</p>`).join("")}${TOPICS.map((tp, i) => { const r = (s.raeume || {})[tp.id] || {}, ok = hat(tp.id), seen = LS.besucht[welt() + ":" + tp.id] && r.auftakt;
      const zu = `🔒 Hinweis noch nicht gefunden – ${LS.opts.raetsel ? "löse das Türrätsel" : "gehe durch die Vordertür"} in diesem Raum.`;
      return `<div class="r3l-clue ${ok || seen ? "" : "locked"}"><small>Kapitel ${i + 1} · ${esc(roomName(tp.id))}</small>${ok || seen ? `<b>${fmtN(r.kapitel || "")}</b>` : ""}${seen ? `<p class="note" style="margin:4px 0">${fmtN(r.auftakt)}</p>` : ""}${ok ? `<p style="margin:4px 0">${fmtN(r.hinweis || "")}</p>` : `<div>${zu}</div>`}</div>`; }).join("")}
      ${allClues() && s.finale && !LS.finale[welt()] ? `<div class="r3l-clue"><small>Finale</small><div>✓ Alle Hinweise gefunden – das Finale erlebst du, sobald du durch die Tür zur Schulaufgabe gehst.</div></div>` : ""}
      ${allClues() && s.finale && LS.finale[welt()] ? `<div class="r3l-clue"><small>Finale</small><b>${fmtN(s.finaleTitel || "Das Finale")}</b>${s.finale.map(p => `<p style="margin:6px 0">${fmtN(p)}</p>`).join("")}</div>` : ""}` : `<p>Für diese Welt gibt es noch keine Geschichte.</p>`;
    if (t === "baustellen") bauHTML(body);
    if (t === "zettel") zettelHTML(body);
    const x = L.akteTabs.find(x => x.id === t); if (x) x.render(body); };
  box.querySelectorAll(".tabs button").forEach(b => b.onclick = () => show(b.dataset.t)); show(box.querySelector(`.tabs [data-t="${akteTab}"]`) ? akteTab : "geschichte");
}

/* =====================================================================
   4) Baustellen: häufige Fehler je Thema und Exponat → Wegweiser in der Halle, „Hingehen“, „Gezielt üben“
   ===================================================================== */
const tagOf = {};   // Thema → Fragenummer → Exponat-Titel
function prepRoom(id, d){ const m = tagOf[id] = {}; Object.entries(d.zuordnung || {}).forEach(([title, list]) => list.forEach(i => m[i] = title)); }
function bauList(){
  let E = []; try { E = errList(); } catch (e) { return []; }
  const by = {}; E.forEach(e => { const tag = (tagOf[e.t] || {})[e.i] || null, k = e.t + "|" + (tag || "");
    const b = by[k] || (by[k] = {t: e.t, tag, w: 0, items: []}); b.w += e.w; b.items.push(e.i); });
  return Object.values(by).sort((a, b) => b.w - a.w || b.items.length - a.items.length).slice(0, 5);
}
function bauHTML(body){
  const B = bauList();
  body.innerHTML = B.length ? `<p>Hier sammelt die App, was in Quiz, Prüfung, Sprint und Wissensleiter noch nicht sitzt – sortiert nach Thema und passendem Exponat.
      Eine Frage verschwindet, sobald du sie zweimal hintereinander richtig beantwortest.</p>${B.map((b, k) => `<div class="r3l-bau"><b>Baustelle ${k + 1}: ${esc(roomName(b.t))}${b.tag ? " · " + esc(b.tag) : ""}</b>
      <span class="note">${b.items.length} ${b.items.length === 1 ? "Frage" : "Fragen"} offen · ${b.w}× falsch beantwortet</span>
      <div class="r3l-row">${b.tag ? `<button class="btn" data-hin="${k}">🚶 Zum Exponat</button>` : `<button class="btn" data-hin="${k}">🚶 In den Raum</button>`}<button class="btn ghost" data-ueb="${k}">🎯 Gezielt üben</button></div></div>`).join("")}`
    : `<div class="r3l-msg ok"><b>Keine Baustellen!</b> Alles, was du falsch hattest, sitzt inzwischen. Weiter so.</div>`;
  body.querySelectorAll("[data-hin]").forEach(b => b.onclick = () => { const x = B[+b.dataset.hin]; closeModal(); gotoExhibit(x.t, x.tag); });
  body.querySelectorAll("[data-ueb]").forEach(b => b.onclick = () => { const x = B[+b.dataset.ueb]; closeModal(); practise(x.t, x.tag, x.items); });
}
let pendingGoto = null;
function gotoExhibit(t, title){ const c = A.cur();
  if (c && c.key === t) return walkToExhibit(title);
  pendingGoto = {t, title}; R3D.enter(t, c ? c.key : null); }
function walkToExhibit(title){ const c = A.cur(); if (!c || !title) return; const o = c.ctx._inter.find(x => x.userData.ia && (x.userData.ia._key === title || x.userData.ia.title === title));
  if (o) A.activate(o.userData.ia); else toast("Exponat nicht gefunden", 1500); }
HK.afterEnter.push(c => { if (pendingGoto && c.key === pendingGoto.t) { const g = pendingGoto; pendingGoto = null; setTimeout(() => walkToExhibit(g.title), 600); } });
function practise(t, tag, wrong){
  const T = TMAP[t], same = tag ? Object.entries(tagOf[t] || {}).filter(([i, x]) => x === tag).map(([i]) => +i) : [];
  const ids = [...new Set([...wrong, ...shuffle(same.filter(i => !wrong.includes(i)))])].slice(0, Math.max(6, wrong.length));
  const items = ids.filter(i => T.quiz[i]).map(i => ({...T.quiz[i], t, i}));
  RET = ["topic", t]; S.sel = [t]; save(); A.leaveTo(() => A.go2("quiz", items));
}
// Wegweiser in der Halle (rechts vom Eingang)
function hallExtras(room){
  const ctx = room.ctx, T = ctx.T, B = bauList(), g = new T.Group(); ctx.add(g, 3.4, 0, 8.6); g.rotation.y = -.5;
  const post = ctx.cyl(.06, .07, 2.6, ctx.mat(ctx.world === "sterne" ? "steel" : "darkwood"), 12); post.position.y = 1.3; g.add(post);
  const signs = [["Deine Baustellen", B.length ? `${B.length} offen` : "keine offen", B.length ? "#e0533d" : "#3c9a5f"], ...B.slice(0, 2).map(b => [roomName(b.t), b.tag || SHORT[b.t], "#3a3f4b"])];
  signs.forEach(([a, b2, col], i) => { const L2 = i % 2 === 1, c = document.createElement("canvas"); c.width = 640; c.height = 180; const x = c.getContext("2d");
    x.save(); if (L2) { x.translate(640, 0); x.scale(-1, 1); }   // Pfeil nach links
    x.fillStyle = col; x.beginPath(); x.moveTo(0, 12); x.lineTo(560, 12); x.lineTo(630, 90); x.lineTo(560, 168); x.lineTo(0, 168); x.closePath(); x.fill();
    x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 6; x.stroke(); x.restore(); x.fillStyle = "#fff"; x.font = "700 54px system-ui, sans-serif"; x.textBaseline = "middle";
    const ox = L2 ? 84 : 26; x.fillText(a.length > 20 ? a.slice(0, 19) + "…" : a, ox, 66); x.font = "500 38px system-ui, sans-serif"; x.fillText(b2.length > 28 ? b2.slice(0, 27) + "…" : b2, ox + 2, 126);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; const mt = new T.MeshStandardMaterial({map: t, roughness: .6, transparent: true});
    for (const back of [0, 1]) { const m = new T.Mesh(new T.PlaneGeometry(1.25, .35), mt); m.position.set(L2 ? -.55 : .55, 2.35 - i * .42, back ? -.012 : .012); m.rotation.y = back ? Math.PI : 0; g.add(m); } });
  ctx.obstacle(3.4, 8.6, .4);
  ctx.exhibit(g, {label: "Wegweiser: Deine Baustellen", sub: B.length ? `${B.length} offen – anklicken` : "anklicken", onClick: () => openAkte("baustellen"), dist: 1.8});
}

/* =====================================================================
   5) Gestufte Hilfen und Einheiten-Check bei Rechenaufgaben im Quiz (2D)
   ===================================================================== */
const QIDX = new Map();   // Fragetext → {t, i, q}
const qkey = s => plain(s).replace(/\s+/g, " ").trim();
TOPICS.forEach(t => t.quiz.forEach((q, i) => { if (q.num) QIDX.set(qkey(q.q), {t: t.id, i, q}); }));
function quizHelp(){
  if (typeof curView !== "undefined" && curView === "exam") return;
  const qc = app.querySelector(".qcard .question"), inq = app.querySelector("#inq"); if (!qc || !inq || inq.disabled || app.querySelector(".r3l-qhelp")) return;
  const it = QIDX.get(qkey(qc.textContent)); if (!it) return;
  const tips = ((L.raeume[it.t] || {}).hilfen || {})[it.i] || [`Gefragt ist eine Größe in **${it.q.num.unit || "der angegebenen Einheit"}**. Schreibe zuerst die passende Formel auf.`];
  const wrap = document.createElement("div"); wrap.className = "r3l-qhelp"; wrap.innerHTML = tipsHTML(tips) + `<div data-uh></div>`;
  const chk = app.querySelector("#chk"); (chk || inq.parentElement).insertAdjacentElement("afterend", wrap); tipsWire(wrap, tips);
  wrap._it = it; wrap._warned = false;
}
// Rückmeldung zur gewählten falschen Antwort: warum gerade diese Auswahl nicht stimmt (warum in 40_lern_<raum>.js, nicht in der Prüfung)
const QALL = new Map();   // Fragetext → {t, i, q} für alle Auswahlfragen
TOPICS.forEach(t => t.quiz.forEach((q, i) => { if (q.options) QALL.set(qkey(q.q), {t: t.id, i, q}); }));
function whyText(t, i, j){ const W = ((L.raeume[t] || {}).warum || {})[i]; return W && W[j] ? W[j] : ""; }
function quizWhy(){
  if (typeof curView !== "undefined" && curView === "exam") return;
  const ex = app.querySelector("#fb .explain.no"), w = app.querySelector(".opts .opt.wrong"), qc = app.querySelector(".qcard .question");
  if (!ex || !w || !qc || ex.querySelector(".r3l-why")) return;
  const it = QALL.get(qkey(qc.textContent)); if (!it) return;
  const sp = w.querySelectorAll("span"), txt = qkey(sp.length ? sp[sp.length - 1].textContent : w.textContent), j = it.q.options.findIndex(o => qkey(o) === txt);
  const why = j >= 0 && j !== it.q.answer ? whyText(it.t, it.i, j) : ""; if (!why) return;
  const head = ex.querySelector("b"); (head || ex.firstChild).insertAdjacentHTML(head ? "afterend" : "beforebegin", `<div class="r3l-why"><b>Warum nicht „${fmtN(it.q.options[j])}“?</b>${fmtN(why)}</div>`);
}
new MutationObserver(() => { quizHelp(); quizWhy(); }).observe(app, {childList: true, subtree: true});
// Einheiten-Check vor dem Prüfen: einmal freier Versuch, wenn die Zahl nur um einen Umrechnungsfaktor danebenliegt
document.addEventListener("click", e => {
  if (!e.target || e.target.id !== "chk") return; const w = app.querySelector(".r3l-qhelp"), inq = app.querySelector("#inq"); if (!w || !w._it || !inq || w._warned) return;
  const q = w._it.q, x = pnum(inq.value); if (isNaN(x) || checkInput(q, inq.value)) return;
  const h = einheitCheck(q.num, x, {kehrwert: !((L.raeume[w._it.t] || {}).ohneKehrwert || []).includes(w._it.i)}); if (!h) return;
  e.preventDefault(); e.stopImmediatePropagation(); w._warned = true;
  w.querySelector("[data-uh]").innerHTML = `<div class="r3l-msg warn"><b>${checkTitel(h)}</b> ${fmtN(h)} Du hast noch einen Versuch.</div>`; inq.focus();
}, true);

/* =====================================================================
   6) Suchbild: Fehler in einer Alltagsszene finden und begründen
   ===================================================================== */
function suchbildFrame(room, sb){
  // Freistehende Staffelei (Holz) bzw. Bildständer (Raumstation): unabhängig von den Wänden der Weltstile überall gleich sichtbar
  const ctx = room.ctx, T = ctx.T, o = sb.ort, w = o.w || 1.5, h = w * 2 / 3, yc = o.y || 1.5, g = new T.Group(); ctx.add(g, o.x, 0, o.z); g.rotation.y = o.ry || 0;
  const c = document.createElement("canvas"); c.width = 600; c.height = 400; const x = c.getContext("2d"); x.save(); x.scale(.5, .5); try { sb.zeichne(x, 1200, 800); } catch (e) { console.error(e); } x.restore();
  x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, 344, 600, 56); x.fillStyle = "#fff"; x.font = "700 28px system-ui, sans-serif"; x.textBaseline = "middle"; x.fillText(`🔍 Suchbild: ${plain(sb.titel)}`.slice(0, 42), 14, 372);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const board = new T.Group(); board.position.set(0, yc, 0); board.rotation.x = -.1; g.add(board);
  const pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map: t, roughness: .7, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .18})); pic.position.z = .035; board.add(pic);
  const sterne = ctx.world === "sterne", fm = ctx.mat(sterne ? "metal" : ctx.world === "detektiv" ? "darkwood" : "wood"), b = .06;
  for (const [fw, fh, fx, fy] of [[w + 2 * b, b, 0, h / 2 + b / 2], [w + 2 * b, b, 0, -h / 2 - b / 2], [b, h, -w / 2 - b / 2, 0], [b, h, w / 2 + b / 2, 0]]) { const f = ctx.box(fw, fh, .06, fm); f.position.set(fx, fy, .02); board.add(f); }
  const back = ctx.box(w, h, .02, fm); board.add(back);
  if (sterne) { const pole = ctx.cyl(.035, .035, yc, ctx.mat("steel"), 12); pole.position.set(0, yc / 2, -.05); g.add(pole);
    const foot = ctx.cyl(.32, .36, .05, ctx.mat("metal"), 24); foot.position.set(0, .025, -.05); g.add(foot);
    const edge = ctx.box(w + .16, .02, .05, ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2})); edge.position.set(0, -h / 2 - .1, .04); board.add(edge); }
  else { const bot = yc - h / 2 - b; for (const s of [-1, 1]) { const leg = ctx.box(.05, yc + h / 2 + .1, .05, fm); leg.position.set(s * w * .36, (yc + h / 2 + .1) / 2, -.1); leg.rotation.z = s * .05; g.add(leg); }
    const rear = ctx.box(.05, yc + h / 2 - .1, .05, fm); rear.position.set(0, (yc + h / 2) / 2 - .05, -.42); rear.rotation.x = .28; g.add(rear);
    const tray = ctx.box(w * .9, .04, .22, fm); tray.position.set(0, bot - .02, 0); g.add(tray); }
  ctx.exhibit(g, {label: "Suchbild", get sub(){ const f = ((LS.such[room.key] || {}).found || []).length; return f >= sb.fehler.length ? "✓ alle Fehler gefunden" : `Finde ${sb.fehler.length} Fehler`; },
    onClick: () => openSuchbild(room.key), dist: o.dist || 2.0, stand: o.stand, pitch: o.pitch ?? -.05});
  ctx.obstacleBox(o.x, o.z, Math.abs(Math.cos(o.ry || 0)) * (w + .2) + Math.abs(Math.sin(o.ry || 0)) * .7, Math.abs(Math.sin(o.ry || 0)) * (w + .2) + Math.abs(Math.cos(o.ry || 0)) * .7);
}
let SB = null;   // offenes Suchbild (für Tests)
function openSuchbild(id){
  const sb = L.raeume[id].suchbild, st = LS.such[id] || (LS.such[id] = {found: []}); let misses = [];
  const box = openModal(`<div class="eyebrow">Suchbild · ${esc(roomName(id))}</div><h3>🔍 ${fmtN(sb.titel)}</h3><p>${fmtN(sb.text)}${(sb.ablenker || []).length && !/nicht alles/i.test(sb.text) ? " Vorsicht – nicht alles, was auffällt, ist falsch!" : ""}</p>
    <div class="r3l-such"><canvas width="1200" height="800"></canvas></div><div id="r3lsbh"></div><div id="r3lsbm" style="margin-top:8px"></div>`, {wide: true});
  const cv = box.querySelector("canvas"), g = cv.getContext("2d"), m = box.querySelector("#r3lsbm"), hint = box.querySelector("#r3lsbh"), wrapEl = box.querySelector(".r3l-such"); let okMark = null;
  const status = () => { const n = st.found.length, N = sb.fehler.length;
    m.innerHTML = n >= N ? `<div class="r3l-msg ok"><b>✓ Alle ${N} Fehler gefunden und begründet!</b> ${fmtN(sb.abschluss || "")}</div>` : `<div class="r3l-msg">Gefunden: <b>${n} von ${N}</b>. Klicke auf eine Stelle, die physikalisch falsch oder gefährlich ist.</div>`; };
  function draw(){ g.clearRect(0, 0, 1200, 800); g.save(); try { sb.zeichne(g, 1200, 800); } catch (e) { console.error(e); } g.restore();
    st.found.forEach(k => { const f = sb.fehler[k]; g.strokeStyle = "#1a8a4a"; g.lineWidth = 7; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.stroke();
      g.fillStyle = "#1a8a4a"; g.beginPath(); g.arc(f.x + f.r * .72, f.y - f.r * .72, 22, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "700 26px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(st.found.indexOf(k) + 1), f.x + f.r * .72, f.y - f.r * .72); });
    if (okMark) { g.strokeStyle = "#2a6fdb"; g.lineWidth = 6; g.setLineDash([14, 10]); g.beginPath(); g.arc(okMark.x, okMark.y, okMark.r, 0, 7); g.stroke(); g.setLineDash([]); }
    misses.forEach(([x, y]) => { g.strokeStyle = "rgba(200,40,30,.85)"; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 14, y - 14); g.lineTo(x + 14, y + 14); g.moveTo(x + 14, y - 14); g.lineTo(x - 14, y + 14); g.stroke(); }); }
  function ask(k){ const f = sb.fehler[k]; let wrongOnce = false;
    const d = document.createElement("div"); d.className = "r3l-mc"; d.innerHTML = `<b>${fmtN(f.name)}</b><p style="margin:6px 0">${fmtN(f.frage || "Warum ist das falsch?")}</p>${f.optionen.map((o, i) => `<button class="btn ghost opt" data-i="${i}"><span>${fmtN(o)}</span></button>`).join("")}<div data-f></div>`;
    wrapEl.appendChild(d);
    d.querySelectorAll(".opt").forEach(b => b.onclick = () => { const i = +b.dataset.i, fb = d.querySelector("[data-f]");
      if (i === f.richtig || wrongOnce) { if (i !== f.richtig) d.querySelectorAll(".opt")[f.richtig].classList.add("right");
        st.found.push(k); lsave(); fb.innerHTML = `<div class="r3l-msg ${i === f.richtig ? "ok" : "no"}">${i === f.richtig ? "<b>Richtig!</b> " : "<b>Die richtige Begründung:</b> "}${fmtN(f.erklaerung)}</div><div class="r3l-row"><button class="btn" data-w>Weiter suchen</button></div>`;
        d.querySelectorAll(".opt").forEach(x => x.disabled = true); draw(); status();
        if (st.found.length >= sb.fehler.length && !st.done) { st.done = 1; lsave(); xp(20); toast("🔍 Suchbild geschafft · +20 XP", 2200); }
        d.querySelector("[data-w]").onclick = () => d.remove(); }
      else { wrongOnce = true; b.classList.add("wrong"); const w = (f.warum || [])[i];
        fb.innerHTML = `<div class="r3l-msg no"><b>Nicht ganz.</b> ${w ? fmtN(w) + " " : ""}Überlege noch einmal.</div>`; } }); }
  cv.addEventListener("pointerdown", e => { if (wrapEl.querySelector(".r3l-mc")) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 1200 / r.width, y = (e.clientY - r.top) * 800 / r.height;
    const k = sb.fehler.findIndex((f, i) => !st.found.includes(i) && Math.hypot(f.x - x, f.y - y) <= f.r);
    // Ablenker: richtig dargestellte Details erklären, statt nur ein rotes Kreuz zu zeigen
    const ab = k < 0 ? (sb.ablenker || []).find(a => Math.hypot(a.x - x, a.y - y) <= a.r) : null;
    if (k >= 0) { misses = []; okMark = null; hint.innerHTML = ""; draw(); ask(k); }
    else if (ab) { okMark = ab; hint.innerHTML = `<div class="r3l-msg"><b>✓ Das ist richtig so.</b> ${fmtN(ab.text)}</div>`; draw(); }
    else { okMark = null; misses.push([x, y]); if (misses.length > 4) misses.shift(); hint.innerHTML = misses.length >= 3 ? `<div class="r3l-msg">An diesen Stellen ist nichts falsch. Tipp: Achte auf Messgeräte, Pfeile, Strahlen, Einheiten und gefährliches Verhalten.</div>` : ""; draw(); } });
  draw(); status();
  SB = {id, sb, st, cv, hint, click: (x, y) => { const r = cv.getBoundingClientRect(); return {x: r.left + x * r.width / 1200, y: r.top + y * r.height / 800}; }};
}

/* =====================================================================
   7) Lernzettel: Selbsterklärung je Raum mit Begriffs-Check, druckbar
   ===================================================================== */
// Teilwort-Treffer ohne Groß/klein; „^Lot“ = nur am Wortanfang, „rau$“ = nur am Wortende, „^Ohm$“ = ganzes Wort
const OPS = /[=:\/·+]/, OPSG = /\s*([=:\/·+])\s*/g, isW = ch => !!ch && /[\p{L}\p{N}]/u.test(ch), isL = ch => !!ch && /\p{L}/u.test(ch);
function termHit(n, w){ let a = false, e = false; w = String(w || "").trim(); if (w[0] === "^") { a = true; w = w.slice(1); } if (w.endsWith("$")) { e = true; w = w.slice(0, -1); }
  let t = nrm(w); if (!t) return false; let h = n; const f = OPS.test(t);
  if (f) { t = t.replace(OPSG, "$1"); h = n.replace(OPSG, "$1"); }   // „R=U:I“ = „R = U : I“, aber nur um die Rechenzeichen herum
  for (let i = h.indexOf(t); i >= 0; i = h.indexOf(t, i + 1)) { const lc = h[i - 1], rc = h[i + t.length];
    if (f && ((isL(t[0]) && isL(lc)) || (isL(t[t.length - 1]) && isL(rc)))) continue;   // Formel nicht aus Wortteilen zusammensetzen („zu: Ist“ ≠ „U : I“)
    if ((!a || !isW(lc)) && (!e || !isW(rc))) return true; }
  return false; }
const termLabel = w => String(w || "").replace(/^\^|\$$/g, "");
function termHits(text, groups){ const n = " " + nrm(text) + " "; return (groups || []).map(gp => gp.some(w => termHit(n, w))); }
const words = s => (String(s || "").trim().match(/\S+/g) || []).length;
function openSpick(id, o = {}){
  const D = L.raeume[id].spick, saved = LS.spick[id] || {}, texts = D.fragen.map((f, i) => (saved.t || [])[i] || "");
  const box = openModal(`<div class="r3l-spick"><div class="eyebrow">Lernzettel · ${esc(roomName(id))}</div><h3>✍️ ${o.vorDerTuer ? "Bevor du weitergehst: " : ""}Erkläre es in eigenen Worten</h3>
    <p>Schreibe zu jeder Frage <b>zwei, drei Sätze</b> – so, als würdest du es deinem Banknachbarn erklären. Selbst formulieren hilft dir, es dir zu merken. Alles landet auf deinem druckbaren Lernzettel.</p>
    ${D.fragen.map((f, i) => `<div style="margin:12px 0"><b>${i + 1}. ${fmtN(f.frage)}</b><textarea data-i="${i}" placeholder="Deine Erklärung …">${esc(texts[i])}</textarea>
      <div data-fb="${i}"></div></div>`).join("")}
    <div class="r3l-row"><button class="btn" id="r3lsp">Prüfen und speichern</button>${o.vorDerTuer ? `<button class="btn ghost" id="r3lsl">Später</button>` : ""}</div></div>`, {onClose: () => o.weiter && o.weiter()});
  const fb = i => box.querySelector(`[data-fb="${i}"]`);
  box.querySelector("#r3lsp").onclick = () => {
    const tx = [...box.querySelectorAll("textarea")].map(t => t.value.trim()); let all = true;
    D.fragen.forEach((f, i) => { const hit = termHits(tx[i], f.begriffe), inQ = termHits(plain(f.frage), f.begriffe), w = words(tx[i]);
      // Begriffe, die schon in der Frage stehen, bringen beim Umformulieren keinen Punkt: Schwelle (60 %) nur über die übrigen Gruppen
      const zaehlt = hit.map((h, k) => !inQ[k]), n = hit.filter((h, k) => h && zaehlt[k]).length, soll = Math.ceil(zaehlt.filter(Boolean).length * .6);
      if (w < 12) all = false;
      fb(i).innerHTML = `<div class="r3l-msg ${w < 12 ? "warn" : n >= soll ? "ok" : ""}">${w < 12 ? `Schreibe noch etwas mehr (${w} von mindestens 12 Wörtern).` : "Gut! Diese Fachbegriffe gehören in eine vollständige Erklärung:"}
        <div class="r3l-terms">${(f.begriffe || []).map((gp, k) => `<span class="${hit[k] ? "ok" : ""}">${hit[k] ? "✓" : "○"} ${esc(termLabel(gp[0]))}</span>`).join("")}</div>
        <details><summary>Musterantwort ansehen</summary><p style="margin:6px 0 0">${fmtN(f.muster)}</p></details></div>`; });
    LS.spick[id] = Object.assign(LS.spick[id] || {}, {t: tx, d: today()}); if (all && !LS.spick[id].ok) { LS.spick[id].ok = 1; xp(15); toast("✍️ Lernzettel ergänzt · +15 XP", 2000); }
    if (!all) { LS.spick[id].ok = LS.spick[id].ok || 0; } lsave(); if (!o.vorDerTuer) toast("Gespeichert", 1200);
    if (all && o.vorDerTuer && !box.querySelector("#r3lsw")) box.querySelector(".r3l-row").insertAdjacentHTML("beforeend", `<button class="btn" id="r3lsw">Weiter →</button>`), box.querySelector("#r3lsw").onclick = closeModal; };
  const later = box.querySelector("#r3lsl"); if (later) later.onclick = () => { LS.spickAus[id] = 1; lsave(); closeModal(); };
}
function zettelHTML(body){
  body.innerHTML = `<p>Dein persönlicher Lernzettel: das Wichtigste aus jedem Raum und deine eigenen Erklärungen. Drucke ihn aus oder speichere ihn als PDF (im Druckfenster „Als PDF sichern“).</p>
    <div class="r3l-row"><button class="btn" id="r3lprint">🖨 Lernzettel drucken</button></div>
    ${TOPICS.map((t, i) => { const D = (L.raeume[t.id] || {}).spick, mine = (LS.spick[t.id] || {}).t || [];
      return `<div class="r3l-clue"><small>Raum ${i + 1} · ${esc(roomName(t.id))}</small><b>${esc(t.title)}</b>
      ${D ? `<div class="r3l-row"><button class="btn ghost" data-sp="${t.id}">${mine.some(Boolean) ? "✎ Erklärung bearbeiten" : "✍️ Erklärung schreiben"}</button></div>` : ""}</div>`; }).join("")}`;
  body.querySelector("#r3lprint").onclick = printZettel;
  body.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => openSpick(b.dataset.sp, {weiter: () => openAkte("zettel")}));
}
function printZettel(){
  let el = document.getElementById("r3l-print"); if (!el) { el = document.createElement("div"); el.id = "r3l-print"; document.body.appendChild(el); }
  const W = window.WELTEN_API, B = bauList();
  el.innerHTML = `<h1>Mein Lernzettel – ${esc(document.title || "Physik")}</h1><p>${esc(S.nick || "")}${S.nick ? " · " : ""}Stand: ${new Date().toLocaleDateString("de-DE")}</p>
    ${TOPICS.map((t, i) => { const D = (L.raeume[t.id] || {}).spick || {}, mine = (LS.spick[t.id] || {}).t || [];
      return `<section><h2>${i + 1}. ${esc(t.title)}</h2>${(D.kern || []).length ? `<b>Das Wichtigste</b><ul>${D.kern.map(k => `<li>${fmtN(k)}</li>`).join("")}</ul>` : ""}
      ${(D.fragen || []).map((f, k) => mine[k] ? `<div class="mine"><b>${fmtN(f.frage)}</b><br>${esc(mine[k]).replace(/\n/g, "<br>")}</div>` : "").join("")}</section>`; }).join("")}
    ${B.length ? `<section><h2>Meine Baustellen</h2><ul>${B.map(b => `<li>${esc(t3(b.t))}${b.tag ? " – " + esc(b.tag) : ""}: ${b.items.length} offene Fragen</li>`).join("")}</ul></section>` : ""}`;
  const done = () => { removeEventListener("afterprint", done); };
  addEventListener("afterprint", done); window.print();
}
const t3 = id => TMAP[id] ? TMAP[id].title : id;

/* ---------- Für Bedientests ---------- */
R3D.lern.debug = {
  state: () => JSON.parse(JSON.stringify(LS)), reset(){ LS = blankLS(); lsave(); },
  lab: () => LAB && {stage: LAB.stage, rows: LAB.rows.length, plotted: LAB.rows.filter(r => r._p).length, lineOk: LAB.lineOk, done: LAB.done},
  labSet: (id, v) => LAB && LAB.set(id, v),
  labPt(i){ if (!LAB) return null; const r = LAB.rows[i], b = LAB.cv.getBoundingClientRect(), W = LAB.cv.width, H = LAB.cv.height;
    return {x: b.left + LAB.px(r[LAB.ax.x.id]) * b.width / W, y: b.top + LAB.py(r[LAB.ax.y.id]) * b.height / H}; },
  labLinePts(){ if (!LAB) return null; const b = LAB.cv.getBoundingClientRect(), W = LAB.cv.width, H = LAB.cv.height, rows = LAB.rows, X = LAB.ax.x.id, Y = LAB.ax.y.id;
    const n = rows.length, sx = rows.reduce((s, r) => s + r[X], 0), sy = rows.reduce((s, r) => s + r[Y], 0), sxx = rows.reduce((s, r) => s + r[X] * r[X], 0), sxy = rows.reduce((s, r) => s + r[X] * r[Y], 0);
    const org = (LAB.spec.gerade ?? "ursprung") === "ursprung", k = org ? sxy / sxx : (n * sxy - sx * sy) / (n * sxx - sx * sx), c = org ? 0 : (sy - k * sx) / n, x0 = LAB.ax.x.min || 0;
    const P = (x, y) => ({x: b.left + LAB.px(x) * b.width / W, y: b.top + LAB.py(y) * b.height / H}), cur = LAB.line();
    const xa = cur ? cur[0][0] : x0, xb = cur ? cur[1][0] : LAB.ax.x.max * .55;
    return {from: [P(cur[0][0], cur[0][1]), P(cur[1][0], cur[1][1])], to: [P(xa, k * xa + c), P(xb, k * xb + c)]}; },
  raetsel: () => RTS && {id: RTS.id, solved: RTS.solved}, raetselSet: (k, v) => RTS && RTS.set(k, v), raetselPruefen: () => RTS && RTS.pruefen(), raetselWeiter: () => RTS && RTS.weiter(),
  such: () => SB && {id: SB.id, found: SB.st.found.length, n: SB.sb.fehler.length}, suchPt: k => SB && SB.click(SB.sb.fehler[k].x, SB.sb.fehler[k].y),
  suchAbPt: k => SB && SB.sb.ablenker && SB.sb.ablenker[k] && SB.click(SB.sb.ablenker[k].x, SB.sb.ablenker[k].y), suchHint: () => SB ? SB.hint.textContent : "", suchOpen: id => { openSuchbild(id || A.cur().key); return !modal.hidden; },
  termHits, bau: () => bauList(), modalOpen: () => !modal.hidden, sheetOpen: () => !sheet.hidden, closeModal, closeSheet, openAkte, openSpick, openLab: id => { const c = A.cur(); const o = c && c.ctx._inter.find(x => x.userData.ia && x.userData.ia.lab && (!id || x.userData.ia.lab.id === id)); if (o) openLab(o.userData.ia.lab); return !!o; },
  printHTML(){ printZettelHTMLOnly(); return document.getElementById("r3l-print").innerHTML; }
};
function printZettelHTMLOnly(){ const p = window.print; window.print = () => {}; try { printZettel(); } finally { window.print = p; } }
// Werkzeugkasten für die Zusatzmodule (06_ueben.js, 07_plan.js)
L._k = {A, HK, T3, get LS(){ return LS; }, lsave, welt, story, tIdx, roomName, xp, nf, pnum, fmtN, nrm, einheitCheck, checkTitel, whyText, QALL, qkey,
  openModal, closeModal, openSheet, closeSheet, modalEl: modal, sheetEl: sheet, tipsHTML, tipsWire, numTask, subText, ctlHTML, ctlWire, initVals, dec, lookAside, flowOf,
  bauList, openAkte, hat, updButtons};
updButtons();
})();
