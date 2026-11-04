/* ---------- lehrer/10_vortrag.js ---------- */
/* =====================================================================
   Lehrkraft-Version · Hefteinträge im Vortrag
   Auswahl der vier Hefteinträge eines Raums, Tafelbild Schritt für Schritt (Klick, Leertaste, Pfeiltasten, Präsentations-Fernbedienung),
   Vortragsnotizen, Referentenfenster für einen zweiten Bildschirm, Druck (Schülerfassung / mit Notizen).
   API: LK.vortrag.raum(id[, nr]) · LK.vortrag.uebersicht() · LK.drucken(html, titel)
   ===================================================================== */
(() => {
const LK = window.LK; if (!LK || !LK.D) return;
const D = LK.D, esc = LK.esc, f = LK.fmt;
const W = () => window.WELTEN_API;
const raumName = id => { const i = LK.RAEUME.indexOf(id), w = W(); return w && w.roomOf ? w.roomOf(i).n : (D.raeume[id] || {}).titel || id; };
LK.raumName = raumName;
const eintraege = id => ((D.hefte[id] || {}).eintraege || []);

/* ---------- Druck ---------- */
const druck = document.createElement("div"); druck.id = "lt-druck";
const addDruck = () => document.body.appendChild(druck);
if (document.body) addDruck(); else document.addEventListener("DOMContentLoaded", addDruck);
LK.drucken = (html, titel) => {
  druck.innerHTML = html; const t0 = document.title; if (titel) document.title = titel;
  document.documentElement.classList.add("lt-drucken");
  const fertig = () => { document.documentElement.classList.remove("lt-drucken"); document.title = t0; druck.innerHTML = ""; window.removeEventListener("afterprint", fertig); };
  window.addEventListener("afterprint", fertig);
  setTimeout(() => { window.print(); setTimeout(() => { if (document.documentElement.classList.contains("lt-drucken") && !matchMedia("print").matches) fertig(); }, 1500); }, 60);
};
const druckHeft = (e, raum, mitNotizen) => {
  const h = LK.heft(e, {alles: true, notizen: mitNotizen, nr: `${e.nr} von 4`}).html;
  return `<div class="lt-dseite lt-heft-druck${mitNotizen ? " mit-notizen" : ""}"><div class="lt-dkopf">Physik 8 · ${esc(raumName(raum))}</div>
    ${mitNotizen ? `<div class="lt-vinfo"><b>Vortrag (${e.dauer} min)</b>${LK.vortragHTML(e)}</div>` : ""}${h}</div>`;
};
LK.druckHeft = druckHeft;

/* ---------- Oberfläche ---------- */
const ov = document.createElement("div"); ov.id = "lt-vortrag"; ov.hidden = true; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Hefteintrag");
ov.innerHTML = `<div class="lv-leiste"><div class="lv-wo"><small id="lvort"></small><b id="lvtitel"></b></div><div class="lv-tabs" id="lvtabs"></div>
  <div class="lv-knoepfe"><button class="lv-k" id="lvnotiz" title="Vortragsnotizen ein/aus (N)">📝 Notizen</button><button class="lv-k" id="lvref" title="Notizen in einem eigenen Fenster für den zweiten Bildschirm">🖥 Referentenfenster</button>
  <button class="lv-k" id="lvhell" title="Helle Tafel (für helle Räume)">◐</button><button class="lv-k" id="lvdruck">🖨 Drucken</button><button class="lv-k" id="lvvoll" title="Vollbild (F)">⛶</button><button class="lv-k lv-x" id="lvzu" aria-label="Schließen">✕</button></div></div>
  <div class="lv-haupt"><div class="lv-tafel" id="lvtafel" tabindex="0"></div><aside class="lv-notizen" id="lvnotizen" hidden></aside></div>
  <div class="lv-fuss"><button class="lv-k" id="lvzurueck">◀ Zurück</button><div class="lv-fort"><i id="lvbar"></i></div><span id="lvzahl"></span><button class="lv-k" id="lvalles">Alles zeigen</button><button class="lv-k lv-weiter" id="lvweiter">Weiter ▶</button></div>
  <div class="lv-druckmenue" id="lvdm" hidden><button data-d="schueler">Hefteintrag (Schülerfassung)</button><button data-d="notizen">Hefteintrag mit Vortragsnotizen</button><button data-d="raum">Alle 4 Einträge dieses Raums</button></div>`;
const add = () => document.body.appendChild(ov);
if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
const $ = s => ov.querySelector(s);

let V = null;     // {raum, nr, e, n, schritt, cur}
let ref = null;   // Referentenfenster
let t0 = 0;

function zeigen(raum, nr, amEnde){
  const E = eintraege(raum); if (!E.length) return;
  const e = E.find(x => x.nr === nr) || E[0]; const r = LK.heft(e, {nr: `${e.nr} von ${E.length}`});
  V = {raum, nr: e.nr, e, n: r.n, schritt: r.schritt, cur: 0};
  $("#lvort").textContent = `${raumName(raum)} · ${e.kap || ""} · etwa ${e.dauer || "?"} min`; $("#lvtitel").innerHTML = f(e.titel);
  $("#lvtabs").innerHTML = E.map(x => `<button class="lv-tab" data-nr="${x.nr}" aria-pressed="${x.nr === e.nr}" title="${esc(LK.plain(x.titel))}">${x.nr}</button>`).join("");
  $("#lvtabs").querySelectorAll("button").forEach(b => b.onclick = () => zeigen(raum, +b.dataset.nr));
  $("#lvtafel").innerHTML = r.html; $("#lvtafel").scrollTop = 0;
  ov.hidden = false; document.documentElement.classList.add("lt-offen"); t0 = Date.now();
  stand(amEnde ? r.n - 1 : 0); $("#lvtafel").focus({preventScroll: true});
}
function stand(c){
  if (!V) return; c = Math.max(0, Math.min(V.n - 1, c)); const vor = V.cur; V.cur = c; let neu = null;
  $("#lvtafel").querySelectorAll("[data-r]").forEach(el => { const r = +el.dataset.r, zu = r > c; el.classList.toggle("lt-zu", zu);
    const war = el.classList.contains("lt-auf"); el.classList.toggle("lt-auf", !zu); if (!zu && !war && c > vor) { el.classList.add("lt-neu"); setTimeout(() => el.classList.remove("lt-neu"), 700); neu = el; } });
  if (neu) setTimeout(() => neu.scrollIntoView({block: "nearest", behavior: "smooth"}), 30);
  $("#lvbar").style.width = (V.n > 1 ? c / (V.n - 1) * 100 : 100) + "%";
  $("#lvzahl").textContent = `Schritt ${c + 1} von ${V.n}`;
  // Am Ende eines Eintrags führt „Weiter“ zum nächsten Hefteintrag des Raums, am Anfang „Zurück“ zum Ende des vorigen
  const E = eintraege(V.raum), i = E.findIndex(x => x.nr === V.nr), ende = c >= V.n - 1;
  $("#lvweiter").disabled = ende && !E[i + 1]; $("#lvweiter").textContent = ende && E[i + 1] ? "Nächster Hefteintrag ▶" : "Weiter ▶";
  $("#lvzurueck").disabled = c <= 0 && !E[i - 1];
  notizen(); referent();
}
const weiter = () => { if (!V) return; if (V.cur >= V.n - 1) { const E = eintraege(V.raum), i = E.findIndex(x => x.nr === V.nr); if (E[i + 1]) zeigen(V.raum, E[i + 1].nr); return; } stand(V.cur + 1); };
const zurueck = () => { if (!V) return; if (V.cur <= 0) { const E = eintraege(V.raum), i = E.findIndex(x => x.nr === V.nr); if (E[i - 1]) zeigen(V.raum, E[i - 1].nr, true); return; } stand(V.cur - 1); };
// Inhalt neu setzen, aufgeklappte Vortragsinfo bleibt offen
const notizenIn = el => { const offen = !!(el.querySelector("details.ln-info") || {}).open; el.innerHTML = notizHTML(); if (offen) { const d = el.querySelector("details.ln-info"); if (d) d.open = true; } };
function notizHTML(){
  if (!V) return ""; const s = V.e.schritte[V.schritt[V.cur]] || {};
  const naechst = V.cur < V.n - 1 ? (() => { const el = $("#lvtafel").querySelector(`[data-r="${V.cur + 1}"]`); return el ? el.textContent.trim().replace(/\s+/g, " ").slice(0, 180) : ""; })() : "";
  return `<div class="ln-akt"><small>Schritt ${V.cur + 1} von ${V.n}${s.ueberschrift ? " · " + esc(LK.plain(s.ueberschrift)) : ""}</small>${LK.notizHTML(s).replace(/^<aside class="lt-notiz">|<\/aside>$/g, "") || "<p>–</p>"}</div>
    ${naechst ? `<div class="ln-next"><small>Als Nächstes an der Tafel</small><p>${esc(naechst)}…</p></div>` : `<div class="ln-next"><small>Ende des Hefteintrags</small></div>`}
    <details class="ln-info"><summary>Ziel, Einstieg, Material, Fragen</summary>${LK.vortragHTML(V.e)}</details>`;
}
function notizen(){ const n = $("#lvnotizen"); if (!n.hidden) notizenIn(n); }
function referent(){
  if (!ref || ref.closed || !V) return;
  try { const d = ref.document, el = d.getElementById("rn"); if (!el) return; notizenIn(el); d.getElementById("rt").textContent = `${raumName(V.raum)} · ${LK.plain(V.e.titel)}`; }
  catch (e) { ref = null; }   // Fenster gehört zu einer früheren Sitzung der Seite (nach Neuladen nicht mehr erreichbar)
}
const FENSTER = "width=760,height=820";
function referentOeffnen(){
  if (ref && !ref.closed) { try { void ref.document.body; ref.focus(); return; } catch (e) { ref = null; } }
  let w = window.open("", "lt-referent", FENSTER);
  if (w) { try { void w.document.body; } catch (e) { try { w.close(); } catch (e2) {} w = window.open("", "lt-referent-" + Date.now(), FENSTER); } }
  if (!w) { alert("Das Fenster wurde vom Browser blockiert. Bitte Pop-ups für diese Datei erlauben."); return; }
  ref = w; const d = ref.document; d.open();
  d.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Referentenansicht</title><style>
    body{margin:0;font:17px/1.5 -apple-system,"Segoe UI",system-ui,sans-serif;background:#1b1d21;color:#eee}
    header{position:sticky;top:0;display:flex;gap:8px;align-items:center;padding:10px 14px;background:#2a2d33;border-bottom:1px solid #444}
    header b{flex:1;font-size:15px}button{font:600 16px system-ui;padding:8px 14px;border-radius:8px;border:1px solid #555;background:#3a3e46;color:#fff;cursor:pointer}
    #uhr{font:600 15px ui-monospace,Menlo,monospace;color:#9fd}main{padding:14px 18px}small{display:block;color:#aaa;text-transform:uppercase;letter-spacing:.06em;font-size:12px;margin-bottom:4px}
    .ln-akt{background:#23262c;border-radius:10px;padding:10px 14px;font-size:19px}.ln-next{margin:14px 0;padding:10px 14px;border-left:4px solid #6aa;color:#cde}
    details{margin-top:10px}summary{cursor:pointer;color:#aaa}sub,sup{font-size:.7em}.lt-bruch{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center}.lt-bruch>span:first-child{border-bottom:1px solid}
    </style></head><body><header><b id="rt"></b><span id="uhr">0:00</span><button id="rz">◀</button><button id="rw">Weiter ▶</button></header><main id="rn"></main></body></html>`);
  d.close();
  d.getElementById("rw").onclick = weiter; d.getElementById("rz").onclick = zurueck;
  d.addEventListener("keydown", ev => tasten(ev, true));
  const uhr = setInterval(() => { if (!ref || ref.closed) return clearInterval(uhr); const s = Math.round((Date.now() - t0) / 1000); d.getElementById("uhr").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 1000);
  referent();
}
function schliessen(){
  ov.hidden = true; document.documentElement.classList.remove("lt-offen"); $("#lvdm").hidden = true;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (ref && !ref.closed) ref.close(); ref = null;
}
function tasten(ev, ausReferent){
  if (ov.hidden || ev.ctrlKey || ev.metaKey || ev.altKey) return; const k = ev.key, t = ev.target;
  if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  if (k === "Escape" && !$("#lvdm").hidden) { $("#lvdm").hidden = true; ev.stopPropagation(); return; }
  if ((k === " " || k === "Enter") && t && t.closest && t.closest("button,a,summary")) return;   // Knöpfe mit Tastatur bedienen
  if (ausReferent && /^[nNfF]$/.test(k)) return;   // Notizen/Vollbild nur am Hauptfenster schalten (sonst sieht die Klasse die Notizen)
  if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) { ev.preventDefault(); weiter(); }
  else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) { ev.preventDefault(); zurueck(); }
  else if (k === "Home") stand(0); else if (k === "End") stand(V.n - 1);
  else if (k === "n" || k === "N") $("#lvnotiz").click();
  else if (k === "f" || k === "F") $("#lvvoll").click();
  else if (k === "Escape" && !document.fullscreenElement) schliessen();
  else return;
  ev.stopPropagation();
}
document.addEventListener("keydown", tasten, true);
$("#lvtafel").addEventListener("click", ev => { if (ev.target.closest("a,button,details")) return; if (!$("#lvdm").hidden) { $("#lvdm").hidden = true; return; } weiter(); });
$("#lvweiter").onclick = weiter; $("#lvzurueck").onclick = zurueck; $("#lvalles").onclick = () => V && stand(V.n - 1);
$("#lvzu").onclick = schliessen;
$("#lvnotiz").onclick = () => { const n = $("#lvnotizen"); n.hidden = !n.hidden; $("#lvnotiz").setAttribute("aria-pressed", !n.hidden); notizen(); };
$("#lvref").onclick = referentOeffnen;
$("#lvhell").onclick = () => { const h = document.documentElement.classList.toggle("lt-hell"); try { localStorage.setItem("lt-hell", h ? "1" : ""); } catch (e) {} };
try { if (localStorage.getItem("lt-hell")) document.documentElement.classList.add("lt-hell"); } catch (e) {}
$("#lvvoll").onclick = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else if (ov.requestFullscreen) ov.requestFullscreen().catch(() => {}); };
$("#lvdruck").onclick = ev => { ev.stopPropagation(); $("#lvdm").hidden = !$("#lvdm").hidden; };
$("#lvdm").onclick = ev => { const b = ev.target.closest("button"); if (!b || !V) return; $("#lvdm").hidden = true;
  if (b.dataset.d === "raum") LK.drucken(eintraege(V.raum).map(e => druckHeft(e, V.raum, false)).join(""), `Hefteinträge ${raumName(V.raum)}`);
  else LK.drucken(druckHeft(V.e, V.raum, b.dataset.d === "notizen"), LK.plain(V.e.titel)); };
ov.addEventListener("click", ev => { if (!ev.target.closest("#lvdm,#lvdruck")) $("#lvdm").hidden = true;
  // Nach einem Mausklick auf einen Knopf der Leiste wieder die Tafel fokussieren, damit Leertaste/Pfeile weiter durch das Tafelbild schalten
  if (ev.detail > 0 && ev.target.closest(".lv-leiste button:not(#lvdruck),.lv-fuss button")) setTimeout(() => $("#lvtafel").focus({preventScroll: true}), 0); });

/* ---------- Auswahl: vier Einträge eines Raums / alle Räume ---------- */
const wahl = document.createElement("div"); wahl.id = "lt-wahl"; wahl.hidden = true; wahl.setAttribute("role", "dialog");
const addW = () => document.body.appendChild(wahl);
if (document.body) addW(); else document.addEventListener("DOMContentLoaded", addW);
function karte(raum, e){
  const skizzen = (e.schritte || []).flatMap(s => s.bloecke || []).filter(b => b.art === "skizze" || b.art === "diagramm").length;
  return `<div class="lw-karte"><small>Hefteintrag ${e.nr} · ${esc(e.kap || "")} · ${e.dauer || "?"} min</small><b>${f(e.titel)}</b>
    <span class="lw-meta">${(e.schritte || []).length} Tafelschritte · ${skizzen} ${skizzen === 1 ? "Abbildung" : "Abbildungen"}</span>
    <div class="lw-knoepfe"><button class="lw-start" data-raum="${raum}" data-nr="${e.nr}">▶ Vortrag</button><button class="lw-dr" data-raum="${raum}" data-nr="${e.nr}" title="Schülerfassung drucken">🖨</button></div></div>`;
}
function wahlZeigen(html){
  wahl.innerHTML = `<div class="lw-box"><button class="lv-k lv-x lw-zu" aria-label="Schließen">✕</button>${html}</div>`; wahl.hidden = false; document.documentElement.classList.add("lt-offen");
  wahl.querySelector(".lw-zu").onclick = wahlZu;
  wahl.querySelectorAll(".lw-start").forEach(b => b.onclick = () => { wahlZu(); zeigen(b.dataset.raum, +b.dataset.nr); });
  wahl.querySelectorAll(".lw-dr").forEach(b => b.onclick = () => { const e = eintraege(b.dataset.raum).find(x => x.nr === +b.dataset.nr); LK.drucken(druckHeft(e, b.dataset.raum, false), LK.plain(e.titel)); });
  wahl.querySelectorAll("[data-alle]").forEach(b => b.onclick = () => { const r = b.dataset.alle, nz = b.dataset.notizen === "1";
    const rs = r === "*" ? LK.RAEUME : [r]; LK.drucken(rs.flatMap(id => eintraege(id).map(e => druckHeft(e, id, nz))).join(""), r === "*" ? "Alle Hefteinträge Physik 8" : `Hefteinträge ${raumName(r)}`); });
}
function wahlZu(){ wahl.hidden = true; if (ov.hidden) document.documentElement.classList.remove("lt-offen"); }
wahl.addEventListener("click", ev => { if (ev.target === wahl) wahlZu(); });
document.addEventListener("keydown", ev => { if (!wahl.hidden && ev.key === "Escape") { ev.stopPropagation(); wahlZu(); } }, true);

LK.vortrag = {
  raum(id, nr){
    if (nr) return zeigen(id, nr);
    const E = eintraege(id);
    wahlZeigen(`<div class="lw-kopf"><small>Tafel · ${esc((D.raeume[id] || {}).kap || "")}</small><h2>${esc(raumName(id))}</h2><p>${esc((D.raeume[id] || {}).titel || "")}</p></div>
      <div class="lw-grid">${E.map(e => karte(id, e)).join("") || "<p>Für diesen Raum gibt es noch keine Hefteinträge.</p>"}</div>
      <div class="lw-fuss"><button class="lv-k" data-alle="${id}">🖨 Alle 4 drucken</button><button class="lv-k" data-alle="${id}" data-notizen="1">🖨 Alle 4 mit Vortragsnotizen</button></div>`);
  },
  uebersicht(){
    wahlZeigen(`<div class="lw-kopf"><small>Lehrkraft</small><h2>Alle Hefteinträge</h2><p>${LK.RAEUME.length} Räume · je 4 Hefteinträge zum Vortragen und Drucken</p></div>
      ${LK.RAEUME.map(id => `<h3 class="lw-raum">${esc(raumName(id))} <small>${esc((D.raeume[id] || {}).kap || "")} · ${esc((D.raeume[id] || {}).titel || "")}</small></h3><div class="lw-grid">${eintraege(id).map(e => karte(id, e)).join("")}</div>`).join("")}
      <div class="lw-fuss"><button class="lv-k" data-alle="*">🖨 Alle 32 drucken (Schülerfassung)</button><button class="lv-k" data-alle="*" data-notizen="1">🖨 Alle mit Vortragsnotizen</button></div>`);
  },
  weiter, zurueck, stand: c => stand(c), schliessen, get zustand(){ return V && {raum: V.raum, nr: V.nr, cur: V.cur, n: V.n}; }
};

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.textContent = `
#lt-vortrag{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;background:var(--lt-tafel2);color:var(--lt-ink)}
#lt-vortrag[hidden],#lt-wahl[hidden]{display:none}
.lv-leiste,.lv-fuss{display:flex;align-items:center;gap:10px;padding:8px 14px;background:color-mix(in srgb,var(--lt-tafel2) 80%,#000);font:500 15px/1.3 -apple-system,"Segoe UI",system-ui,sans-serif;color:#eee}
html.lt-hell .lv-leiste,html.lt-hell .lv-fuss{background:#E6E8EC;color:#222}
.lv-wo{flex:1;min-width:0;display:flex;flex-direction:column}.lv-wo small{opacity:.7;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lv-wo b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lv-tabs{display:flex;gap:4px}.lv-tab{width:34px;height:34px;border-radius:50%;border:1px solid currentColor;background:none;color:inherit;font:700 15px system-ui;cursor:pointer;opacity:.7}
.lv-tab[aria-pressed="true"]{opacity:1;background:var(--lt-akz);color:#222;border-color:var(--lt-akz)}
.lv-knoepfe{display:flex;gap:6px;flex-wrap:wrap}
.lv-k{font:600 14px system-ui,sans-serif;padding:7px 12px;border-radius:8px;border:1px solid color-mix(in srgb,currentColor 35%,transparent);background:color-mix(in srgb,currentColor 10%,transparent);color:inherit;cursor:pointer}
.lv-k:hover{background:color-mix(in srgb,currentColor 18%,transparent)}.lv-k[aria-pressed="true"]{background:var(--lt-akz);color:#222}.lv-k:disabled{opacity:.35;cursor:default}
.lv-weiter{background:var(--lt-akz);color:#222;border-color:transparent;padding:7px 18px}
.lv-haupt{flex:1;min-height:0;display:flex}
.lv-tafel{flex:1;min-width:0;overflow:auto;padding:2.2vw 3vw 6vh;font-size:clamp(17px,1.55vw,34px);background:radial-gradient(120% 80% at 30% 0%,color-mix(in srgb,var(--lt-tafel) 92%,#fff),var(--lt-tafel));
  border:10px solid var(--lt-rahmen);box-shadow:inset 0 0 40px rgba(0,0,0,.35);outline:none;cursor:pointer}
html.lt-hell .lv-tafel{box-shadow:inset 0 0 20px rgba(0,0,0,.08)}
.lv-tafel .lt-heft{max-width:1600px;margin:0 auto}
.lv-tafel .lt-zu.lt-schritt{display:none}.lv-tafel [data-r].lt-zu:not(.lt-schritt){visibility:hidden}
.lv-tafel .lt-neu{animation:lt-kreide .6s ease-out}@keyframes lt-kreide{from{opacity:0;filter:blur(2px);transform:translateY(4px)}to{opacity:1;filter:none;transform:none}}
.lv-notizen{width:min(32vw,460px);overflow:auto;padding:14px 16px;background:#1d2024;color:#eee;font:16px/1.5 -apple-system,"Segoe UI",system-ui,sans-serif;border-left:1px solid #444}
.lv-notizen small{display:block;color:#aaa;text-transform:uppercase;letter-spacing:.06em;font-size:11px;margin-bottom:4px}
.ln-akt{background:#26292e;border-radius:8px;padding:8px 12px}.ln-next{margin:12px 0;padding:6px 12px;border-left:3px solid #6aa;color:#cde}.ln-info summary{cursor:pointer;color:#aaa}
.lv-fort{flex:1;height:6px;border-radius:3px;background:color-mix(in srgb,currentColor 18%,transparent);overflow:hidden}.lv-fort i{display:block;height:100%;background:var(--lt-akz);transition:width .3s}
#lvzahl{font-size:13px;opacity:.8;white-space:nowrap}
.lv-druckmenue{position:absolute;top:52px;right:60px;z-index:2;display:flex;flex-direction:column;background:#fff;color:#222;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.35);overflow:hidden}
.lv-druckmenue button{font:500 15px system-ui;padding:10px 16px;border:0;background:none;text-align:left;cursor:pointer}.lv-druckmenue button:hover{background:#eef}
.lv-druckmenue[hidden]{display:none}
#lt-wahl{position:fixed;inset:0;z-index:69;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:20px;overflow:auto}
.lw-box{position:relative;width:min(1100px,100%);max-height:calc(100vh - 40px);overflow:auto;background:var(--lt-tafel);color:var(--lt-ink);border:8px solid var(--lt-rahmen);border-radius:10px;padding:22px 26px;font-family:var(--lt-hand)}
.lw-zu{position:absolute;top:12px;right:12px}
.lw-kopf small{opacity:.75}.lw-kopf h2{margin:.1em 0 .1em;color:var(--lt-akz);font-size:1.7rem}.lw-kopf p{margin:0 0 14px;opacity:.85}
.lw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-bottom:10px}
.lw-karte{display:flex;flex-direction:column;gap:6px;border:2px solid color-mix(in srgb,var(--lt-ink) 30%,transparent);border-radius:10px;padding:12px;background:color-mix(in srgb,var(--lt-tafel) 85%,#000)}
html.lt-hell .lw-karte{background:#fff}
.lw-karte small{opacity:.75;font-size:.8rem}.lw-karte b{font-size:1.1rem;line-height:1.25;flex:1}.lw-meta{font-size:.8rem;opacity:.7}
.lw-knoepfe{display:flex;gap:6px}.lw-start{flex:1;font:700 15px system-ui;padding:8px;border-radius:8px;border:0;background:var(--lt-akz);color:#222;cursor:pointer}
.lw-dr{font:15px system-ui;padding:8px 10px;border-radius:8px;border:1px solid color-mix(in srgb,currentColor 35%,transparent);background:none;color:inherit;cursor:pointer}
.lw-raum{margin:18px 0 8px;color:var(--k-blau);font-size:1.2rem}.lw-raum small{color:var(--lt-ink);opacity:.7;font-size:.8rem;margin-left:6px}
.lw-fuss{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
html.lt-offen #r3d canvas{visibility:hidden}
#lt-druck{display:none}
@media print{
  @page{size:A4;margin:14mm 14mm 16mm}
  html.lt-drucken body>*:not(#lt-druck):not(#ts-defs){display:none!important}
  html.lt-drucken body>svg#ts-defs{display:block!important;position:absolute!important;width:0!important;height:0!important;overflow:hidden!important}
  html.lt-drucken #lt-druck{display:block!important}
  html.lt-drucken,html.lt-drucken body{background:#fff!important;height:auto!important;overflow:visible!important}
  #lt-druck .lt-dseite{break-after:page;font-size:12.5pt}#lt-druck .lt-dseite:last-child{break-after:auto}
  #lt-druck .lt-dkopf{font:9pt Arial,sans-serif;color:#666;border-bottom:1px solid #bbb;margin-bottom:6pt;padding-bottom:2pt}
  #lt-druck .lt-heft{color:#111}#lt-druck .lt-schritt,#lt-druck .lt-merke,#lt-druck .lt-fig,#lt-druck table{break-inside:avoid}
  #lt-druck .lt-kopf,#lt-druck .lt-h3,#lt-druck .lt-mk{break-after:avoid}#lt-druck .lt-kopf{break-inside:avoid}
  #lt-druck .lt-heft .lt-svg{width:min(var(--mmw,120mm),100%);max-height:90mm}
  #lt-druck .mit-notizen .lt-notiz{display:block;font:10pt/1.4 Arial,sans-serif;color:#333;background:#f1f3f6;border-left:3px solid #789;padding:4pt 8pt;margin:4pt 0 0}
  #lt-druck .mit-notizen .lt-notiz p{margin:2pt 0}
  #lt-druck .lt-vinfo{font:10pt/1.4 Arial,sans-serif;border:1px solid #bbb;border-radius:4pt;padding:6pt 10pt;margin-bottom:8pt}#lt-druck .lt-vinfo p,#lt-druck .lt-vinfo ul{margin:2pt 0}
}
`;
document.head.appendChild(css);
})();
