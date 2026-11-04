/* ---------- 06_ueben.js ---------- */
/* =====================================================================
   3D-Räume (nur Mac-Version) · Üben mit System
   Rechenwerkstatt je Raum (Tafel im Raum und Station 3 „Anwenden“):
     Rechenweg Schritt für Schritt (Gegeben – Gesucht – Formel – Umstellen – Einsetzen – Ergebnis – Antwortsatz),
     erst ein vorgerechnetes Beispiel, dann bei jeder Aufgabe ein Schritt mehr selbst (Ausblenden)
     Formeln umstellen mit Bausteinen (geprüft wird die Gleichwertigkeit, nicht die Schreibweise)
     Fehlersuche: eine Figur der Welt hat sich verrechnet – Zeile finden, Fehler benennen, richtig rechnen
   Diagramm-Trainer (ctx.diagramm am Exponat): mit einem Regler live ein vorgegebenes t-s- oder t-v-Diagramm erzeugen, dann Ablesefragen
   Inhalte: rechenweg, umstellen, fehlersuche, uebung in 40_lern_<raum>.js · ctx.diagramm(...) in 20_<raum>.js · Schnittstelle: LERN-API.md
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern || !R3D.lern._k) return;
const L = R3D.lern, K = L._k, A = K.A, HK = K.HK, nf = K.nf, pnum = K.pnum, plainT = R3D.util.plainT;
// wie K.fmtN, zeigt aber „a - b“ in Formeln mit echtem Minuszeichen (a − b)
const fmtN = s => K.fmtN(typeof s === "string" ? s.replace(/(\S) - (?=\S)/g, "$1 − ") : s);
const room = id => L.raeume[id] || {};
const store = (k, id) => { const S0 = K.LS[k] || (K.LS[k] = {}); return S0[id] || (S0[id] = {}); };
const gehilfe = () => { const s = K.story(); return (s && s.gehilfe) || {name: "Ein Mitschüler", kurz: "Er", gen: "Seine", icon: "📝"}; };
// 0.3 → „0,3“ (ohne überflüssige Nullen)
const nfs = x => { const r = +(+x).toPrecision(10); return String(r).replace("-", "−").replace(".", ","); };
const vu = (w, e) => nfs(w) + (e === "°" || !e ? "" : " ") + (e || "");
const near = (x, v, tol) => Math.abs(x - v) <= (tol != null ? tol : Math.max(1e-9, Math.abs(v) * .005)) + 1e-12;
const msg = (el, html, cls = "") => { el.innerHTML = html ? `<div class="r3l-msg ${cls}">${html}</div>` : ""; };
const has = R => !!((R.rechenweg || []).length || (R.umstellen || []).length || (R.fehlersuche || []).length);

const css = document.createElement("style");
css.textContent = `
.r3l-steps{display:flex;flex-direction:column;gap:8px;margin:10px 0}
.r3l-step{border:1px solid var(--line);border-radius:12px;padding:9px 12px}
.r3l-step>.hd{display:flex;gap:8px;align-items:center;font-weight:700}
.r3l-step>.hd .n{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:999px;background:var(--surface-2);font-size:.85rem}
.r3l-step>.hd .own{margin-left:auto;font-size:.75rem;font-weight:600;opacity:.75}
.r3l-step.done{border-color:color-mix(in srgb,var(--ok) 65%,var(--line))}.r3l-step.done>.hd .n{background:var(--ok);color:#fff}
.r3l-step.wait{opacity:.45}.r3l-step.wait .bd{display:none}
.r3l-step .val{margin:5px 0 0;font-size:1.04rem;line-height:1.5}
.r3l-step select,.r3l-step input[type=text],.r3l-step textarea,.r3l-fs input[type=text]{font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink)}
.r3l-step input.sm{width:6.5em}.r3l-step textarea{width:100%;min-height:64px;resize:vertical}
.r3l-step .bad{outline:2px solid var(--bad)}
.r3l-step .rw-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}
.r3l-step .chip{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--surface-2);font-weight:700}
.r3l-choice{display:flex;flex-direction:column;gap:6px;margin:6px 0}
.r3l-choice button{text-align:left;padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font:inherit;cursor:pointer}
.r3l-choice button.wrong{border-color:var(--bad);opacity:.7}.r3l-choice button.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 20%,var(--surface))}
.r3l-tiles{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.r3l-tiles button{min-width:46px;padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font:inherit;font-size:1.1rem;cursor:pointer}
.r3l-tiles button.op{background:var(--surface)}
.r3l-expr{min-height:48px;border:2px dashed var(--line);border-radius:12px;padding:8px 12px;font-size:1.3rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0}
.r3l-expr .ph{opacity:.5;font-size:1rem}
.r3l-paper{background:#fbf8ef;color:#222;border-radius:12px;padding:10px 14px;margin:10px 0;font-family:"Bradley Hand","Segoe Print","Comic Sans MS",cursive;font-size:1.1rem;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
.r3l-paper .ln{display:flex;gap:10px;padding:6px 8px;border-radius:8px;border-bottom:1px solid #d6e0ee}
.r3l-paper.pick .ln{cursor:pointer}.r3l-paper.pick .ln:hover{background:rgba(42,111,219,.1)}
.r3l-paper .ln .k{opacity:.45;min-width:1.4em;font-family:system-ui,sans-serif;font-size:.85rem;padding-top:3px}
.r3l-paper .ln.bad{background:rgba(220,60,40,.16)}.r3l-paper .ln.bad span:last-child{text-decoration:line-through wavy rgba(200,40,30,.85)}
.r3l-paper .ln.nope{background:rgba(42,111,219,.08)}
.r3l-paper sub,.r3l-paper sup{font-family:system-ui,sans-serif}
.r3l-card{border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:10px 0}
.r3l-card>b{display:block;font-size:1.05rem}.r3l-card p{margin:4px 0 8px}
.r3l-prog{display:flex;gap:4px;margin:6px 0}.r3l-prog i{flex:0 0 24px;height:8px;border-radius:4px;background:var(--surface-2)}.r3l-prog i.on{background:var(--ok)}
.r3l-diag canvas{width:100%;height:auto;border-radius:12px;background:#10131a;display:block}
.r3l-diag .zt{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.r3l-diag .zt button{padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font:inherit;cursor:pointer}
.r3l-diag .zt button[aria-pressed=true]{background:var(--accent);color:#111;border-color:var(--accent);font-weight:700}
.r3l-diag .zt button.ok::after{content:" ✓"}
`;
document.head.appendChild(css);

/* ---------- Auswahl mit Begründung je falscher Antwort (Formel, Umstellen, Plausibilität, Fehlersuche, Ablesefragen) ---------- */
// opts: [{t: "Text", ok: bool, warum: "…"}] – nach zwei Fehlversuchen wird die richtige Antwort gezeigt
function choice(el, frage, opts, done, o = {}){
  const order = o.keepOrder ? opts.map((x, i) => i) : shuffle(opts.map((x, i) => i)); let wrong = 0;
  el.insertAdjacentHTML("beforeend", `<div class="r3l-chq">${frage ? `<div style="margin:4px 0 6px">${fmtN(frage)}</div>` : ""}<div class="r3l-choice">${order.map(i => `<button data-i="${i}">${fmtN(opts[i].t)}</button>`).join("")}</div><div data-cf></div></div>`);
  const q = el.querySelector(".r3l-chq:last-child"), fb = q.querySelector("[data-cf]");
  const finish = (i, clean) => { q.querySelectorAll(".r3l-choice button").forEach(b => { b.disabled = true; if (opts[+b.dataset.i].ok) b.classList.add("right"); });
    msg(fb, clean ? `<b>Richtig!</b> ${o.erklaerung ? fmtN(o.erklaerung) : ""}` : `<b>Die richtige Antwort ist markiert.</b> ${o.erklaerung ? fmtN(o.erklaerung) : ""}`, clean ? "ok" : ""); done(clean); };
  q.querySelectorAll(".r3l-choice button").forEach(b => b.onclick = () => { const i = +b.dataset.i;
    if (opts[i].ok) return finish(i, !wrong);
    wrong++; b.classList.add("wrong"); b.disabled = true;
    if (wrong >= 2) return finish(i, false);
    msg(fb, `<b>Nicht ganz.</b> ${opts[i].warum ? fmtN(opts[i].warum) : "Überlege noch einmal."}`, "no"); });
  return {auto: () => { const b = [...q.querySelectorAll(".r3l-choice button")].find(b => opts[+b.dataset.i].ok); if (b && !b.disabled) b.click(); }};
}

/* =====================================================================
   1) Rechenwerkstatt: Tafel im Raum + Knöpfe an Station 3
   ===================================================================== */
const BG = {zauber: ["#1f3a2c", "#f3efe2", "#e9c46a"], sterne: ["#0b1a2b", "#d8f3ff", "#4fc3f7"], detektiv: ["#2a2e33", "#f1ece1", "#d9a441"]};
function tafel(r, R){
  const ctx = r.ctx, T = ctx.T, o = R.uebung.ort, w = R.uebung.w || 1.3, h = w * .75, yc = R.uebung.y || 1.45, g = new T.Group(); ctx.add(g, o.x, 0, o.z); g.rotation.y = o.ry || 0;
  const [bg, ink, acc] = BG[ctx.world] || BG.zauber, c = document.createElement("canvas"); c.width = 640; c.height = 480; const x = c.getContext("2d");
  x.fillStyle = bg; x.fillRect(0, 0, 640, 480); x.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 40; i++) x.fillRect((i * 97) % 640, (i * 53) % 480, 60, 2);
  x.fillStyle = acc; x.font = "700 50px system-ui, sans-serif"; x.textBaseline = "middle"; x.fillText("🧮 Rechenwerkstatt", 28, 58);
  x.fillStyle = ink; x.font = "500 34px system-ui, sans-serif";
  const G = gehilfe(), lines = [R.rechenweg && "Gegeben · Gesucht · Lösung", R.umstellen && "Formeln umstellen", R.fehlersuche && `🔎 ${G.gen || G.kurz} Fehler finden`].filter(Boolean);
  lines.forEach((s, i) => x.fillText(s.length > 30 ? s.slice(0, 29) + "…" : s, 34, 150 + i * 62));
  const deko = R.uebung.formel || ((R.rechenweg || [])[0] || {}).formel || ""; x.globalAlpha = .6; x.font = "italic 34px Georgia, serif"; x.textAlign = "right"; K.subText(x, deko, 606, 410, "right"); x.textAlign = "left"; x.globalAlpha = 1;
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const board = new T.Group(); board.position.set(0, yc, 0); board.rotation.x = -.08; g.add(board);
  const pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map: t, roughness: .85, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .22})); pic.position.z = .035; board.add(pic);
  const sterne = ctx.world === "sterne", fm = ctx.mat(sterne ? "metal" : ctx.world === "detektiv" ? "darkwood" : "wood"), b = .06;
  for (const [fw, fh, fx, fy] of [[w + 2 * b, b, 0, h / 2 + b / 2], [w + 2 * b, b, 0, -h / 2 - b / 2], [b, h, -w / 2 - b / 2, 0], [b, h, w / 2 + b / 2, 0]]) { const f = ctx.box(fw, fh, .06, fm); f.position.set(fx, fy, .02); board.add(f); }
  board.add(ctx.box(w, h, .02, fm));
  if (sterne) { const pole = ctx.cyl(.035, .035, yc, ctx.mat("steel"), 12); pole.position.set(0, yc / 2, -.05); g.add(pole);
    const foot = ctx.cyl(.3, .34, .05, ctx.mat("metal"), 24); foot.position.set(0, .025, -.05); g.add(foot);
    const edge = ctx.box(w + .16, .02, .05, ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2})); edge.position.set(0, -h / 2 - .1, .04); board.add(edge); }
  else { for (const s of [-1, 1]) { const leg = ctx.box(.05, yc + h / 2 + .1, .05, fm); leg.position.set(s * w * .36, (yc + h / 2 + .1) / 2, -.1); leg.rotation.z = s * .05; g.add(leg); }
    const tray = ctx.box(w * .9, .04, .18, fm); tray.position.set(0, yc - h / 2 - b - .02, .02); g.add(tray);
    const chalk = ctx.box(.09, .02, .02, ctx.mat("paper")); chalk.position.set(w * .25, yc - h / 2 - b + .01, .04); g.add(chalk); }
  ctx.exhibit(g, {label: "Rechenwerkstatt", get sub(){ return progText(r.key); }, onClick: () => openUebung(r.key), dist: R.uebung.dist || 1.9, stand: R.uebung.stand, pitch: R.uebung.pitch ?? -.05});
  ctx.obstacleBox(o.x, o.z, Math.abs(Math.cos(o.ry || 0)) * (w + .2) + Math.abs(Math.sin(o.ry || 0)) * .6, Math.abs(Math.sin(o.ry || 0)) * (w + .2) + Math.abs(Math.cos(o.ry || 0)) * .6);
}
function counts(id){ const R = room(id), a = (R.rechenweg || []).length, b = (R.umstellen || []).length, c = (R.fehlersuche || []).length;
  const s1 = store("rechen", id), s2 = store("umst", id), s3 = store("fehler", id), n = o => Object.values(o).filter(Boolean).length;
  return {all: a + b + c, done: Math.min(a, n(s1)) + Math.min(b, n(s2)) + Math.min(c, n(s3)), a, b, c, da: n(s1), db: n(s2), dc: n(s3)}; }
const progText = id => { const n = counts(id); return n.done >= n.all ? "✓ alles geschafft" : `${n.done} von ${n.all} Aufgaben geschafft`; };
HK.afterBuild.push(r => { if (r.isHall) return; const R = room(r.key); if (R.uebung && R.uebung.ort && has(R)) try { tafel(r, R); } catch (e) { console.error("Rechenwerkstatt", e); } });
HK.station.push((panel, t, j) => { if (j !== 2) return; const R = room(t); if (!has(R)) return; const acts = panel.querySelector(".r3d-acts"); if (!acts) return;
  acts.insertAdjacentHTML("beforeend", `<button class="btn ghost" data-uw="menu">🧮 Rechenwerkstatt</button>`);
  acts.querySelector('[data-uw="menu"]').onclick = () => { A.hidePanel(); openUebung(t); }; });

const bar = (n, d) => `<div class="r3l-prog">${Array.from({length: n}, (x, i) => `<i class="${i < d ? "on" : ""}"></i>`).join("")}</div>`;
function openUebung(id){
  const R = room(id), n = counts(id), G = gehilfe(), sR = store("rechen", id), sU = store("umst", id), sF = store("fehler", id);
  const box = K.openSheet(`<div class="eyebrow">Rechenwerkstatt · ${esc(K.roomName(id))}</div><h3>🧮 Üben mit System</h3>
    <p>Hier übst du, was in der Schulaufgabe zählt: einen sauberen Rechenweg, Formeln umstellen und Fehler erkennen.</p>
    ${n.a ? `<div class="r3l-card"><b>Rechenweg Schritt für Schritt</b><p>Gegeben · Gesucht · Formel · Einsetzen · Ergebnis · Antwortsatz. Erst ein vorgerechnetes Beispiel, dann machst du bei jeder Aufgabe einen Schritt mehr selbst.</p>
      ${bar(n.a, (R.rechenweg || []).filter((x, i) => sR[i]).length)}<div class="r3l-row"><button class="btn" data-o="rechen">▶ ${n.da >= n.a ? "Noch einmal üben" : n.da ? "Weiter mit Aufgabe " + (Math.min(n.a, (R.rechenweg || []).findIndex((x, i) => !sR[i]) + 1)) : "Mit dem Beispiel starten"}</button></div></div>` : ""}
    ${n.b ? `<div class="r3l-card"><b>Formeln umstellen</b><p>Baue die umgestellte Formel aus Bausteinen – so lange, bis sie stimmt.</p>${bar(n.b, (R.umstellen || []).filter((x, i) => sU[i]).length)}
      <div class="r3l-row"><button class="btn" data-o="umst">▶ Umstellen üben</button></div></div>` : ""}
    ${n.c ? `<div class="r3l-card"><b>${esc(G.icon || "📝")} Fehlersuche</b><p>${esc(G.name)} hat gerechnet – leider mit Fehlern. Finde die falsche Zeile, benenne den Fehler und rechne richtig.</p>${bar(n.c, (R.fehlersuche || []).filter((x, i) => sF[i]).length)}
      <div class="r3l-row"><button class="btn" data-o="fehler">▶ Fehler suchen</button></div></div>` : ""}`, null);
  K.lookAside();
  const go = {rechen: () => openRechen(id), umst: () => openUmst(id), fehler: () => openFehler(id)};
  box.querySelectorAll("[data-o]").forEach(b => b.onclick = () => go[b.dataset.o]());
}
const backBtn = id => `<button class="btn ghost" data-back>← Rechenwerkstatt</button>`;
const wireBack = (box, id) => { const b = box.querySelector("[data-back]"); if (b) b.onclick = () => openUebung(id); };

/* =====================================================================
   2) Rechenweg Schritt für Schritt (mit Ausblenden)
   ===================================================================== */
const nameOf = (a, g) => { const x = [...(a.gegeben || []), a.gesucht, ...(a.symbole || [])].find(y => y && y.g === g); return x ? x.name || "" : ""; };
const symList = a => [...(a.gegeben || []).map(x => x.g), a.gesucht.g, ...(a.symbole || []).map(x => x.g)].filter((v, i, arr) => v && arr.indexOf(v) === i);
const symOpt = (a, g) => `<option value="${esc(g)}">${esc(plain(g))}${nameOf(a, g) ? " – " + esc(nameOf(a, g)) : ""}</option>`;
const sameF = (p, q) => norm(String(p).replace(/\s+/g, "")) === norm(String(q).replace(/\s+/g, ""));
// Zahlen eines Textes (Dezimalkomma; Ziffern in F_{1} oder m/s^{2} zählen nicht)
const NUMRX = /([_^]\{[^{}]*\})|(\d+(?:,\d+)?)/g;
// Umrechnungsfaktor von der Ergebnis-Einheit e in die Einheit u (Wert in u = Wert in e · f), sonst 0
const UMF = {"mA:A": 1000, "A:mA": .001, "kΩ:Ω": .001, "Ω:kΩ": 1000, "km:m": .001, "m:km": 1000, "cm:m": 100, "mm:m": 1000, "m:cm": .01, "mm:cm": 10, "cm:mm": .1,
  "g:kg": 1000, "kg:g": .001, "kN:N": .001, "N:kN": 1000, "kV:V": .001, "mV:V": 1000, "V:mV": .001, "V:kV": 1000, "N/m:N/cm": 100, "N/cm:N/m": .01, "km/h:m/s": 3.6, "m/s:km/h": 1 / 3.6, "min:s": 1 / 60, "s:min": 60, "h:min": 1 / 60, "min:h": 60, "ms:s": 1000, "s:ms": .001, "h:s": 1 / 3600, "s:h": 3600, "N/kg:m/s²": 1, "m/s²:N/kg": 1};
const umFaktor = (e, u) => u === e ? 1 : UMF[u + ":" + e] || 0;
// Einheitenwörter auf Zeichen zurückführen („3 Ampere“ → „3 A“, „m/s^2“ → „m/s²“)
const UWORT = [["stundenkilometer", "km/h"], ["milliampere", "mA"], ["ampere", "A"], ["millivolt", "mV"], ["kilovolt", "kV"], ["volt", "V"], ["kiloohm", "kΩ"], ["kohm", "kΩ"], ["ohm", "Ω"], ["kilonewton", "kN"], ["newton", "N"],
  ["kilogramm", "kg"], ["gramm", "g"], ["kilometer", "km"], ["zentimeter", "cm"], ["millimeter", "mm"], ["meter", "m"], ["sekunden", "s"], ["sekunde", "s"], ["minuten", "min"], ["minute", "min"],
  ["stunden", "h"], ["stunde", "h"], ["grad", "°"]].map(([w, u]) => [new RegExp("(^|[^A-Za-zÄÖÜäöüß])" + w + "(?![A-Za-zäöüß])", "gi"), "$1" + u]);
// … und „Meter pro Sekunde“ → „m/s“, „N pro cm“ → „N/cm“, „m/s pro s“ / „m/s zum Quadrat“ → „m/s²“
const normU = s => UWORT.reduce((t, [rx, u]) => t.replace(rx, u), String(s || "").replace(/\s+/g, " ").replace(/−/g, "-"))
  .replace(/([A-Za-zΩ°µ/]+) (?:pro|je) (s|h|min|cm|m|kg|g)(?![A-Za-zäöüß])/gi, "$1/$2").replace(/m\/s(\^\{2\}|\^2|2|\/s| zum Quadrat| hoch 2)/g, "m/s²");
// Tausender mit Leerzeichen zusammenziehen („1 020 m“ → „1020 m“)
const normZ = s => String(s || "").replace(/(\d{1,3})((?: \d{3})+)(?![\d,.])/g, (m, a, b) => a + b.replace(/ /g, ""));
// Zahl mit der Einheit direkt dahinter („0,3 A“, „65°“, „18 km/h“); Ziffern in R2 oder F_{1} zählen nicht
const NUMU = /(^|[^\w.,^{}_])(-?\d+(?:[.,]\d+)?)\s*([A-Za-zΩ°µ²³/]*)/g;
const EINH = new Set(["A", "mA", "V", "mV", "kV", "Ω", "kΩ", "N", "kN", "kg", "g", "t", "m", "cm", "mm", "km", "s", "ms", "min", "h", "°", "m/s", "km/h", "m/s²", "N/kg", "N/cm", "N/m"]);
// Antwortsatz prüfen: Das Ergebnis muss mit einer erlaubten Einheit direkt dahinter stehen (Vielfache werden umgerechnet: 300 mA = 0,3 A)
function antwortCheck(a, text){
  const ein = normU(a.ergebnis.einheit), w = a.ergebnis.wert, tol = antTol(a);
  // erlaubt: Ergebnis-Einheit, alle umrechenbaren Vielfachen davon und einheitAuch
  const erl = [[ein, 1], ...Object.keys(UMF).map(k => k.split(":")).filter(([u, e]) => e === ein).map(([u]) => [u, UMF[u + ":" + ein]]),
    ...(a.einheitAuch || []).map(u => { const n = normU(u); return [n, n === ein ? 1 : umFaktor(ein, n)]; }).filter(([u, f]) => f)];
  // ein Wort hinter der Zahl gilt nur als Einheit, wenn es eine ist („600 hoch“ hat keine Einheit)
  const pairs = []; normU(normZ(text)).replace(NUMU, (m, pre, num, u) => { pairs.push([pnum(num), EINH.has(u) || erl.some(([e]) => e === u) ? u : ""]); return m; });
  const hit = ([x, u]) => erl.some(([e, f]) => (u === e || !ein) && near(x, w * f, tol * Math.abs(f)));
  const zahl = ([x]) => erl.some(([e, f]) => near(x, w * f, tol * Math.abs(f)));
  const passt = x => (erl.find(([e, f]) => near(x, w * f, tol * Math.abs(f))) || [])[0];   // zu welcher Einheit die Zahl gehört
  const grob = ([x, u]) => erl.some(([e, f]) => u === e && Math.abs(x - w * f) <= .1 * Math.abs(w * f));
  const fu = pairs.find(p => p[1] && zahl(p) && !hit(p));
  return {ok: pairs.some(hit), falschU: fu && [...fu, passt(fu[0])], ohneU: pairs.some(p => !p[1] && zahl(p)), zahl: pairs.some(zahl), grob: !pairs.some(hit) && pairs.some(grob)};
}
// Toleranz für die Zahl im Antwortsatz: wie im Schritt Ergebnis (3 %), damit sinnvoll gerundete Werte zählen
const antTol = a => a.ergebnis.toleranz != null ? a.ergebnis.toleranz : Math.abs(a.ergebnis.wert) * .03;
function rwSteps(a){
  const S = [], ein = a.ergebnis.einheit || "", gs = a.gesucht;
  // 1 Gegeben (mit Umrechnen)
  S.push({title: "Gegeben", show: () => a.gegeben.map(x => `${fmtN(x.g)} = ${fmtN(vu(x.wert, x.einheit))}${x.si ? " = " + fmtN(vu(x.si.wert, x.si.einheit)) : ""}`).join("<br>"),
    ask(bd, ok){ const syms = shuffle(symList(a)); let tries = 0;
      bd.innerHTML = `<div class="val">Welche Größe steckt hinter jeder Angabe aus dem Text?${a.gegeben.some(x => x.si) ? " Rechne, wo nötig, in die Einheit der Formel um." : ""}</div>
        ${a.gegeben.map((x, j) => `<div class="rw-row"><span class="chip">${fmtN(vu(x.wert, x.einheit))}</span> gehört zu <select data-g="${j}"><option value="">Größe wählen</option>${syms.map(g => symOpt(a, g)).join("")}</select>
          ${x.si ? `<span>= <input type="text" class="sm" data-si="${j}" inputmode="decimal" placeholder="Zahl"> ${esc(x.si.einheit)}</span>` : ""}</div>`).join("")}
        <div class="r3l-row"><button class="btn" data-p>Prüfen</button></div><div data-f></div>`;
      const fb = bd.querySelector("[data-f]");
      const check = () => { let bad = [], conv = [];
        a.gegeben.forEach((x, j) => { const s = bd.querySelector(`[data-g="${j}"]`); const okS = s.value === x.g; s.classList.toggle("bad", !okS); if (!okS) bad.push(x);
          if (x.si) { const inp = bd.querySelector(`[data-si="${j}"]`), v = pnum(inp.value), okV = !isNaN(v) && near(v, x.si.wert); inp.classList.toggle("bad", !okV); if (!okV) conv.push([x, v]); } });
        if (!bad.length && !conv.length) return ok(!tries);
        tries++;
        const t1 = bad.length ? (tries >= 2 ? bad.map(x => `„${vu(x.wert, x.einheit)}“ ist ${x.name ? "die Größe **" + x.name + "**" : "eine andere Größe"} (Zeichen ${x.g}).`).join(" ") : "Mindestens eine Zuordnung stimmt noch nicht. " + (new Set(a.gegeben.map(x => x.si ? x.si.einheit : x.einheit)).size === a.gegeben.length ? "Tipp: Die **Einheit** verrät die Größe." : "Tipp: Hier haben mehrere Angaben dieselbe Einheit – lies im Text genau nach, wozu jede Zahl gehört.")) : "";
        const t2 = conv.map(([x, v]) => { const h = isNaN(v) ? null : K.einheitCheck({value: x.si.wert, unit: x.si.einheit}, v); return h ? K.fmtN(h) : `Rechne ${fmtN(vu(x.wert, x.einheit))} in **${esc(x.si.einheit)}** um.`; }).join(" ");
        msg(fb, fmtN(t1) + " " + t2, "no"); if (tries >= 3) reveal(bd, ok); };
      bd.querySelector("[data-p]").onclick = check;
      return {auto(){ a.gegeben.forEach((x, j) => { bd.querySelector(`[data-g="${j}"]`).value = x.g; const i = bd.querySelector(`[data-si="${j}"]`); if (i) i.value = nfs(x.si.wert); }); check(); }}; }});
  // 2 Gesucht
  S.push({title: "Gesucht", show: () => `${fmtN(gs.g)}${gs.name ? " (" + esc(gs.name) + ")" : ""} in ${fmtN(gs.einheit || ein)}`,
    ask(bd, ok){ const syms = shuffle(symList(a)); let tries = 0;
      bd.innerHTML = `<div class="rw-row">Gesucht ist <select data-s><option value="">Größe wählen</option>${syms.map(g => symOpt(a, g)).join("")}</select></div><div class="r3l-row"><button class="btn" data-p>Prüfen</button></div><div data-f></div>`;
      const sel = bd.querySelector("[data-s]"), fb = bd.querySelector("[data-f]");
      const check = () => { if (sel.value === gs.g) return ok(!tries); tries++; sel.classList.add("bad");
        msg(fb, fmtN(tries >= 2 ? `Gefragt ist nach ${gs.name ? "der Größe **" + gs.name + "**" : "einer anderen Größe"} – Zeichen ${gs.g}.` : "Lies die Frage am Ende des Aufgabentextes noch einmal: Wonach wird gefragt?"), "no"); };
      bd.querySelector("[data-p]").onclick = check; return {auto(){ sel.value = gs.g; check(); }}; }});
  // 3 Formel (Zusammenhang) · 4 Umstellen
  const fOpts = [{t: a.formel, ok: true}, ...(a.formelAblenker || []).map(x => ({t: x.f, warum: x.warum}))];
  S.push({title: "Formel", show: () => fmtN(a.formel), ask(bd, ok){ bd.innerHTML = ""; return choice(bd, "Welcher Zusammenhang gilt hier?", fOpts, ok); }});
  if (a.umgestellt && !sameF(a.umgestellt, a.formel)) {
    const uOpts = [{t: a.umgestellt, ok: true}, ...(a.umstellAblenker || []).map(x => ({t: x.f, warum: x.warum}))];
    S.push({title: `Nach ${gs.g} umstellen`, show: () => fmtN(a.umgestellt) + (a.umstellWeg ? `<div class="note">${fmtN(a.umstellWeg)}</div>` : ""),
      ask(bd, ok){ bd.innerHTML = ""; return choice(bd, `Wie lautet die Formel, nach ${fmtN(gs.g)} aufgelöst?`, uOpts, ok, {erklaerung: a.umstellWeg}); }});
  }
  // 5 Einsetzen (jede Zahl der Vorlage wird zur Lücke)
  const nums = []; String(a.einsetzen).replace(NUMRX, (m, sub, num) => { if (num) nums.push(pnum(num)); return m; });
  S.push({title: "Einsetzen", show: () => fmtN(a.einsetzen),
    ask(bd, ok){ let k = 0, tries = 0;
      let tpl = "", last = 0; const E = String(a.einsetzen);
      E.replace(NUMRX, (m, sub, num, off) => { if (num) { tpl += fmtN(E.slice(last, off)) + `<input type="text" class="sm" data-n="${k++}" inputmode="decimal" aria-label="Zahl">`; last = off + m.length; } return m; }); tpl += fmtN(E.slice(last));
      bd.innerHTML = `<div class="val">Setze die Werte mit Einheit in die umgestellte Formel ein:</div><div class="rw-row" style="font-size:1.1rem">${tpl}</div>
        <div class="r3l-row"><button class="btn" data-p>Prüfen</button></div><div data-f></div>`;
      const fb = bd.querySelector("[data-f]"), ins = [...bd.querySelectorAll("[data-n]")];
      const check = () => { let bad = 0, unconv = false;
        ins.forEach((inp, j) => { const v = pnum(inp.value), okV = !isNaN(v) && near(v, nums[j]); inp.classList.toggle("bad", !okV); if (!okV) { bad++;
          if (a.gegeben.some(x => x.si && near(v, x.wert) && near(nums[j], x.si.wert))) unconv = true; } });
        if (!bad) return ok(!tries); tries++;
        msg(fb, unconv ? "Setze die <b>umgerechneten</b> Werte ein (in der Einheit der Formel)." : tries >= 2 ? `So geht's: ${fmtN(a.einsetzen)}` : "Vergleiche mit deinen gegebenen Größen – welcher Wert gehört an welche Stelle?", "no"); };
      bd.querySelector("[data-p]").onclick = check; return {auto(){ ins.forEach((inp, j) => inp.value = nfs(nums[j])); check(); }}; }});
  // 6 Ergebnis (Zahl mit Einheiten-Check und gestuften Tipps)
  S.push({title: "Ergebnis", show: () => { const w = a.ergebnis.wert, r = +(+w).toPrecision(3); return `${fmtN(gs.g)} ${r === +(+w).toPrecision(10) ? "=" : "≈"} ${fmtN(vu(r, ein))}`; },
    ask(bd, ok){ bd.innerHTML = ""; let tries = 0;
      K.numTask(bd, {frage: `Rechne aus: ${gs.g} = ?`, wert: a.ergebnis.wert, einheit: ein, toleranz: a.ergebnis.toleranz, tipps: a.tipps, loesung: a.loesung, kehrwert: a.kehrwert}, () => ok(tries <= 1));
      const chk = bd.querySelector("[data-chk]"); chk.addEventListener("click", () => { tries++; }, true);
      return {auto(){ const i = bd.querySelector(".r3l-task input"); i.value = nfs(a.ergebnis.wert); bd.querySelector("[data-chk]").click(); }}; }});
  // 7 Antwortsatz (frei formuliert: Zahl, Einheit und ganzer Satz)
  S.push({title: "Antwortsatz", show: v => esc(v || plainT(a.antwort)),
    ask(bd, ok){ let tries = 0;
      bd.innerHTML = `<div class="val">Schreibe einen Antwortsatz mit Zahl und Einheit – so, wie er in der Schulaufgabe unter der Rechnung steht.</div><textarea data-a placeholder="${esc(plainT(a.antwortAnfang || "Der …"))}"></textarea>
        <div class="r3l-row"><button class="btn" data-p>Prüfen</button></div><div data-f></div>`;
      const ta = bd.querySelector("[data-a]"), fb = bd.querySelector("[data-f]");
      const check = () => { const s = ta.value.trim(), w = (s.match(/\S+/g) || []).length, r = antwortCheck(a, s), okW = w >= 4;
        if (r.ok && okW) { ok(!tries, s); return; } tries++;
        const t = r.ok ? "" : r.falschU ? `„${nfs(r.falschU[0])} ${r.falschU[1]}“ passt nicht – Zahl und Einheit gehören zusammen: Die Zahl ${nfs(r.falschU[0])} gehört zur Einheit **${r.falschU[2]}**.`
          : r.ohneU ? `Schreibe die Einheit direkt hinter die Zahl (**${ein}**).` : r.grob ? "Die Zahl ist zu ungenau – gib das Ergebnis so genau an wie im Schritt „Ergebnis“."
          : "Im Satz fehlt noch das Ergebnis (die Zahl mit Einheit).";
        msg(fb, fmtN([!okW && "Schreibe einen ganzen Satz.", t].filter(Boolean).join(" ")) + (tries >= 2 ? ` Beispiel: „${fmtN(a.antwort)}“` : ""), "no"); };
      bd.querySelector("[data-p]").onclick = check; return {auto(){ ta.value = plainT(a.antwort); check(); }}; }});
  // 8 Plausibel? (optional)
  if (a.plausibel) S.push({title: "Ist das Ergebnis plausibel?", show: () => fmtN(a.plausibel.erklaerung || ""),
    ask(bd, ok){ bd.innerHTML = ""; const P = a.plausibel; return choice(bd, P.frage, P.optionen.map((t, i) => ({t, ok: i === P.richtig, warum: (P.warum || [])[i]})), ok, {erklaerung: P.erklaerung}); }});
  return S;
}
function reveal(bd, ok){ if (bd.querySelector("[data-rv]")) return; bd.insertAdjacentHTML("beforeend", `<div class="r3l-row"><button class="btn ghost" data-rv>Lösung zeigen</button></div>`); bd.querySelector("[data-rv]").onclick = () => ok(false); }
let RWS = null;   // offener Rechenweg (für Tests)
function openRechen(id, k){
  const RW = room(id).rechenweg || [], n = RW.length; if (!n) return; const st = store("rechen", id);
  if (k == null) { k = RW.findIndex((x, i) => !st[i]); if (k < 0) k = 0; }
  const a = RW[k], S = rwSteps(a), own = n > 1 ? Math.round(S.length * k / (n - 1)) : S.length, first = S.length - own;
  const box = K.openSheet(`<div class="eyebrow">Rechenweg · Aufgabe ${k + 1} von ${n} · ${esc(K.roomName(id))}</div><h3>🧮 ${fmtN(a.titel || "Aufgabe " + (k + 1))}</h3>
    <div class="r3l-row">${backBtn(id)}</div>
    <p class="note">${k === 0 && own === 0 ? "Beispiel: Lies den Rechenweg Schritt für Schritt und klicke jeweils auf „Verstanden“. So sieht eine vollständige Lösung aus." : own >= S.length ? "Jetzt machst du jeden Schritt selbst." : `Die Schritte 1 bis ${first} sind vorgegeben, ab Schritt ${first + 1} rechnest du selbst.`}</p>
    <div class="r3l-msg"><b>Aufgabe:</b> ${fmtN(a.text)}</div><div class="r3l-steps">${S.map((s, i) => `<div class="r3l-step wait" data-s="${i}"><div class="hd"><span class="n">${i + 1}</span><span>${fmtN(s.title)}</span>${i >= first ? `<span class="own">✎ selbst</span>` : ""}</div><div class="bd"></div></div>`).join("")}</div>
    <div data-end></div>`, () => { RWS = null; }, {wide: true});
  K.lookAside(); wireBack(box, id);
  let clean = true; RWS = {id, k, n, steps: S.length, cur: 0, ctl: null, done: false};
  const el = i => box.querySelector(`[data-s="${i}"]`);
  const step = i => { RWS.cur = i; if (i >= S.length) return finish(); const e = el(i), bd = e.querySelector(".bd"); e.classList.remove("wait"); RWS.ctl = null;
    if (i < first) { bd.innerHTML = `<div class="val">${S[i].show()}</div>`;
      if (own === 0) { bd.insertAdjacentHTML("beforeend", `<div class="r3l-row"><button class="btn ghost" data-v>Verstanden ✓</button></div>`); const v = bd.querySelector("[data-v]");
        v.onclick = () => { v.parentElement.remove(); e.classList.add("done"); step(i + 1); }; RWS.ctl = {auto: () => v.click()}; v.scrollIntoView({block: "nearest"}); }
      else { e.classList.add("done"); step(i + 1); } return; }
    RWS.ctl = S[i].ask(bd, (c, val) => { clean = clean && c !== false; e.classList.add("done"); bd.innerHTML = `<div class="val">${S[i].show(val)}</div>`; step(i + 1); });
    setTimeout(() => { const f = bd.querySelector("select, input, textarea, button"); if (f && !e.classList.contains("done")) { f.scrollIntoView({block: "nearest"}); if (f.tagName !== "BUTTON") f.focus({preventScroll: true}); } }, 30); };
  const finish = () => { RWS.done = true; const first0 = !st[k]; st[k] = clean ? 2 : Math.max(1, st[k] || 0); K.lsave(); if (first0) K.xp(10);
    const end = box.querySelector("[data-end]");
    end.innerHTML = `<div class="r3l-msg ok"><b>✓ Rechenweg vollständig${first0 ? " · +10 XP" : ""}!</b> ${clean ? "Alles selbst geschafft." : "Schau dir die Schritte mit Lösung noch einmal an."}</div>
      <div class="r3l-row">${k + 1 < n ? `<button class="btn" data-nx>Nächste Aufgabe →</button>` : `<button class="btn" data-bk>Zur Rechenwerkstatt</button>`}${k > 0 || own > 0 ? `<button class="btn ghost" data-re>Diese Aufgabe noch einmal</button>` : ""}</div>`;
    const nx = end.querySelector("[data-nx]"), bk = end.querySelector("[data-bk]"), re = end.querySelector("[data-re]");
    if (nx) nx.onclick = () => openRechen(id, k + 1); if (bk) bk.onclick = () => openUebung(id); if (re) re.onclick = () => openRechen(id, k); end.scrollIntoView({block: "nearest"}); };
  step(0);
}

/* =====================================================================
   3) Formeln umstellen mit Bausteinen
   ===================================================================== */
const TOK = /(Δ?[A-Za-zÄÖÜäöüα-ωΑ-Ω](?:_\{[^{}]*\})?)|(\d+(?:,\d+)?)|([·:\/()+\-*×])/g;
const toks = s => { const out = []; String(s).replace(/−/g, "-").replace(TOK, (m, sym, num, op) => { out.push(sym ? {s: sym} : num ? {n: pnum(num)} : {o: op}); return m; }); return out; };
function evalT(ts, val){ let p = 0;
  const peek = () => ts[p], take = () => ts[p++];
  const factor = () => { const t = take(); if (!t) throw 0; if (t.n != null) return t.n; if (t.s) { if (!(t.s in val)) throw 0; return val[t.s]; }
    if (t.o === "(") { const v = expr(); if (!take() || ts[p - 1].o !== ")") throw 0; return v; } if (t.o === "-") return -factor(); throw 0; };
  const term = () => { let v = factor(); while (peek() && /^[·:\/*×]$/.test(peek().o || "")) { const o = take().o, w = factor(); v = o === ":" || o === "/" ? v / w : v * w; } return v; };
  const expr = () => { let v = term(); while (peek() && /^[+\-]$/.test(peek().o || "")) { const o = take().o, w = term(); v = o === "+" ? v + w : v - w; } return v; };
  const v = expr(); if (p !== ts.length) throw 0; return v; }
const rhs = s => String(s).split("=").slice(1).join("=");
const lhs = s => String(s).split("=")[0].trim();
// Gleichwertig? An vier festen Zahlenbelegungen vergleichen (keine Schreibweise erzwingen: U : R = (1 : R) · U)
function same(tsA, tsB, syms){ const VALS = [[2.3, 4.1, .7, 3.3, 1.9], [1.7, .45, 5.2, 2.8, 3.6], [3.9, 2.2, 1.3, .6, 4.4], [.8, 3.1, 2.6, 4.7, 1.2]];
  try { return VALS.every(r => { const val = Object.fromEntries(syms.map((s, i) => [s, r[i % 5] + i * .37])); const a = evalT(tsA, val), b = evalT(tsB, val); return isFinite(a) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)); }); }
  catch (e) { return false; } }
let UMS = null;   // offenes Umstellen (für Tests)
function openUmst(id, k){
  const U = room(id).umstellen || [], n = U.length; if (!n) return; const st = store("umst", id);
  if (k == null) { k = U.findIndex((x, i) => !st[i]); if (k < 0) k = 0; }
  const u = U[k], ziel = lhs(u.loesung), solT = toks(rhs(u.loesung)), syms = [...new Set(toks(u.formel).filter(t => t.s).map(t => t.s))];
  const tileSyms = syms.filter(s => s !== ziel), tileNums = [...new Set(solT.filter(t => t.n != null).map(t => t.n))];
  const box = K.openSheet(`<div class="eyebrow">Formeln umstellen · ${k + 1} von ${n} · ${esc(K.roomName(id))}</div><h3>🔁 Stelle nach ${fmtN(ziel)} um</h3>
    <div class="r3l-row">${backBtn(id)}</div>
    <div class="r3l-msg" style="font-size:1.25rem;text-align:center">${fmtN(u.formel)}</div>${u.text ? `<p>${fmtN(u.text)}</p>` : ""}
    <p class="note">Klicke die Bausteine in der richtigen Reihenfolge an. Es zählt, ob deine Formel stimmt – nicht, wie du sie schreibst.</p>
    <div class="r3l-expr"><b>${fmtN(ziel)} =</b><span data-x><span class="ph">Bausteine anklicken …</span></span></div>
    <div class="r3l-tiles">${tileSyms.map(s => `<button data-t="s:${esc(s)}">${fmtN(s)}</button>`).join("")}${tileNums.map(x => `<button data-t="n:${x}">${nf(x, 4)}</button>`).join("")}
      ${["·", ":", ...(/[+\-−]/.test(u.formel + rhs(u.loesung) + (u.typisch || []).map(x => rhs(x.f)).join(" ")) ? ["+", "-"] : []), "(", ")"].map(o => `<button class="op" data-t="o:${o}">${o === "-" ? "−" : o}</button>`).join("")}<button class="op" data-del>⌫</button><button class="op" data-clr>Leeren</button></div>
    <div class="r3l-row"><button class="btn" data-p>Prüfen</button></div>${K.tipsHTML(u.tipps)}<div data-f></div><div data-end></div>`, () => { UMS = null; }, {wide: true});
  K.lookAside(); wireBack(box, id); K.tipsWire(box, u.tipps);
  const cur = [], xEl = box.querySelector("[data-x]"), fb = box.querySelector("[data-f]"); let tries = 0, done = false;
  const show = () => { xEl.innerHTML = cur.length ? cur.map(t => t.s ? fmtN(t.s) : t.n != null ? nf(t.n, 4) : t.o === "-" ? "−" : t.o).join(" ") : `<span class="ph">Bausteine anklicken …</span>`; };
  box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { if (done) return; const [k2, v] = b.dataset.t.split(/:(.*)/s); cur.push(k2 === "s" ? {s: v} : k2 === "n" ? {n: +v} : {o: v}); show(); msg(fb, ""); });
  box.querySelector("[data-del]").onclick = () => { if (!done) { cur.pop(); show(); } };
  box.querySelector("[data-clr]").onclick = () => { if (!done) { cur.length = 0; show(); } };
  const check = () => { if (done || !cur.length) return;
    if (same(cur, solT, syms)) { done = true; const first0 = !st[k]; st[k] = tries ? 1 : 2; K.lsave(); if (first0) K.xp(5);
      msg(fb, `<b>Richtig!</b> ${fmtN(u.loesung)}${u.weg ? `<div class="note" style="margin-top:4px">${fmtN(u.weg)}</div>` : ""}`, "ok");
      const end = box.querySelector("[data-end]"); end.innerHTML = `<div class="r3l-row">${k + 1 < n ? `<button class="btn" data-nx>Nächste Formel →</button>` : `<button class="btn" data-bk>Zur Rechenwerkstatt</button>`}</div>`;
      const nx = end.querySelector("[data-nx]"), bk = end.querySelector("[data-bk]"); if (nx) nx.onclick = () => openUmst(id, k + 1); if (bk) bk.onclick = () => openUebung(id); UMS.done = true; return; }
    tries++;
    const typ = (u.typisch || []).find(x => same(cur, toks(rhs(x.f)), syms));
    let inv = false; try { inv = [[2.3, 4.1, .7, 3.3, 1.9]].every(r => { const val = Object.fromEntries(syms.map((s, i) => [s, r[i % 5] + i * .37])); return Math.abs(evalT(cur, val) * evalT(solT, val) - 1) < 1e-9; }); } catch (e) {}
    let valid = true; try { evalT(cur, Object.fromEntries(syms.map(s => [s, 1.5]))); } catch (e) { valid = false; }
    msg(fb, !valid ? "Diese Formel ist unvollständig – prüfe Rechenzeichen und Klammern." : typ ? `<b>Nicht ganz.</b> ${fmtN(typ.warum)}` : inv ? "<b>Fast:</b> Du hast den <b>Kehrwert</b> gebildet – Zähler und Nenner sind vertauscht." : `<b>Noch nicht.</b> ${tries >= 2 ? "Tipp: Was mit der gesuchten Größe malgenommen wird, musst du auf der anderen Seite teilen – und umgekehrt." : "Setze zur Probe Zahlen ein: Stimmt dann die Ausgangsformel?"}`, "no");
    if (tries >= 3 && !box.querySelector("[data-rv]")) { fb.insertAdjacentHTML("beforeend", `<div class="r3l-row"><button class="btn ghost" data-rv>Lösung zeigen</button></div>`);
      fb.querySelector("[data-rv]").onclick = () => { cur.length = 0; cur.push(...solT); show(); check(); }; } };
  box.querySelector("[data-p]").onclick = check;
  UMS = {id, k, n, done: false, auto(){ cur.length = 0; cur.push(...solT); show(); check(); }, typisch(j){ const x = (u.typisch || [])[j]; if (!x) return null; cur.length = 0; cur.push(...toks(rhs(x.f))); show(); check(); return fb.textContent; }};
}

/* =====================================================================
   4) Fehlersuche: Wo hat sich die Figur verrechnet?
   ===================================================================== */
let FS = null;   // offene Fehlersuche (für Tests)
function openFehler(id, k){
  const F = room(id).fehlersuche || [], n = F.length; if (!n) return; const st = store("fehler", id), G = gehilfe();
  if (k == null) { k = F.findIndex((x, i) => !st[i]); if (k < 0) k = 0; }
  const f = F[k];
  const box = K.openSheet(`<div class="eyebrow">Fehlersuche · ${k + 1} von ${n} · ${esc(K.roomName(id))}</div><h3>${esc(G.icon || "📝")} ${fmtN(f.titel || G.name + " hat gerechnet")}</h3>
    <div class="r3l-row">${backBtn(id)}</div>
    <div class="r3l-msg"><b>Aufgabe:</b> ${fmtN(f.aufgabe)}</div><p>${esc(G.name)} hat das gerechnet. <b>Klicke auf die erste Zeile, in der ein Fehler steckt.</b></p>
    <div class="r3l-paper pick">${f.zeilen.map((z, i) => `<div class="ln" data-l="${i}"><span class="k">${i + 1}</span><span>${fmtN(z)}</span></div>`).join("")}</div>
    <div data-f></div><div data-q></div><div data-end></div>`, () => { FS = null; }, {wide: true});
  K.lookAside(); wireBack(box, id);
  const paper = box.querySelector(".r3l-paper"), fb = box.querySelector("[data-f]"), qEl = box.querySelector("[data-q]"); let found = false, clean = true, misses = 0;
  FS = {id, k, n, stage: 0, done: false, ctl: null};
  paper.querySelectorAll(".ln").forEach(l => l.onclick = () => { if (found) return; const i = +l.dataset.l;
    if (i === f.falsch) { found = true; paper.classList.remove("pick"); l.classList.add("bad"); paper.querySelectorAll(".ln").forEach(x => x.classList.remove("nope")); msg(fb, `<b>Gefunden:</b> In Zeile ${i + 1} steckt der Fehler.`, "ok"); ask(); return; }
    misses++; clean = false; l.classList.add("nope");
    msg(fb, i < f.falsch ? `Zeile ${i + 1} stimmt noch. ${(f.zeilenOk || [])[i] ? fmtN(f.zeilenOk[i]) : "Such weiter unten."}` : `Zeile ${i + 1} ist nicht der erste Fehler – der passiert <b>weiter oben</b>. Folgefehler zählen nicht als erster Fehler.`, "no");
    if (misses >= 3) { const b = paper.querySelector(`[data-l="${f.falsch}"]`); setTimeout(() => b.click(), 50); } });
  const ask = () => { FS.stage = 1; qEl.innerHTML = `<p style="margin-top:12px"><b>Was ist in Zeile ${f.falsch + 1} falsch?</b></p>`;
    FS.ctl = choice(qEl, "", f.optionen.map((t, i) => ({t, ok: i === f.richtig, warum: (f.warum || [])[i]})), c => { clean = clean && c; korr(); }); };
  const korr = () => { FS.stage = 2; const c = f.korrektur; qEl.insertAdjacentHTML("beforeend", `<p style="margin-top:12px"><b>Jetzt du: Rechne richtig.</b></p>`);
    K.numTask(qEl, {frage: c.frage, wert: c.wert, einheit: c.einheit, toleranz: c.toleranz, tipps: c.tipps, loesung: c.loesung, kehrwert: c.kehrwert}, fin);
    FS.ctl = {auto(){ const ins = qEl.querySelectorAll(".r3l-task input"), i = ins[ins.length - 1]; i.value = nfs(c.wert); const b = qEl.querySelectorAll("[data-chk]"); b[b.length - 1].click(); }}; };
  const fin = () => { FS.stage = 3; FS.done = true; const first0 = !st[k]; st[k] = clean ? 2 : 1; K.lsave(); if (first0) K.xp(15);
    const end = box.querySelector("[data-end]");
    end.innerHTML = `<div class="r3l-msg ok"><b>✓ Fehler gefunden und verbessert${first0 ? " · +15 XP" : ""}!</b> ${fmtN(f.erklaerung || "")}</div>
      <div class="r3l-row">${k + 1 < n ? `<button class="btn" data-nx>Nächste Rechnung →</button>` : `<button class="btn" data-bk>Zur Rechenwerkstatt</button>`}</div>`;
    const nx = end.querySelector("[data-nx]"), bk = end.querySelector("[data-bk]"); if (nx) nx.onclick = () => openFehler(id, k + 1); if (bk) bk.onclick = () => openUebung(id); end.scrollIntoView({block: "nearest"}); };
  FS.line = i => paper.querySelector(`[data-l="${i}"]`).click(); FS.fb = () => fb.textContent;
}

/* =====================================================================
   5) Diagramm-Trainer: ctx.diagramm(exponat, spec) – live ein Zeit-Weg- oder Zeit-Geschwindigkeits-Diagramm erzeugen
   ===================================================================== */
HK.ctxExt.push(ctx => {
  ctx.diagramm = (obj, spec) => { const ia = obj.userData.ia; if (!ia) { console.warn("R3D: ctx.diagramm braucht ein Exponat (erst ctx.exhibit)"); return; }
    ia.diag = spec; spec._room = ctx.key; try { if (ia.sub == null || /anklicken/.test(ia.sub)) ia.sub = (ia.sub ? ia.sub + " · " : "") + "📈 Diagramm"; else if (!/Diagramm/.test(ia.sub)) ia.sub += " · 📈 Diagramm"; } catch (e) {}
    const prev = Object.getOwnPropertyDescriptor(ia, "extra"), done = () => ((K.LS.diag || {})[ctx.key] || {})[spec.id];
    Object.defineProperty(ia, "extra", {configurable: true, get(){ const p = prev ? (prev.get ? prev.get.call(ia) : prev.value) || "" : "";
      const btn = `<button class="btn" data-diag="${esc(spec.id)}">📈 ${done() && done().ok ? "Diagramm-Trainer wiederholen" : "Diagramm selbst erzeugen"}</button>`;
      return p.includes("r3d-acts") ? p.replace(/<\/div>\s*$/, btn + "</div>") : p + `<div class="r3d-acts">${btn}</div>`; }});
    return spec; };
});
A.panel.addEventListener("click", e => { const b = e.target.closest("[data-diag]"); if (!b) return; const c = A.cur(); if (!c) return;
  const o = c.ctx._inter.find(x => x.userData.ia && x.userData.ia.diag && x.userData.ia.diag.id === b.dataset.diag); if (o) openDiag(o.userData.ia.diag); });
// Zielkurve an der Stelle t (stückweise linear)
const at = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a0, b0] = pts[i - 1], [a1, b1] = pts[i]; return b0 + (b1 - b0) * (t - a0) / (a1 - a0 || 1); } return pts[pts.length - 1][1]; };
let DG = null;   // offener Diagramm-Trainer (für Tests)
function openDiag(spec){
  const id = spec._room, st = store("diag", id), rec = st[spec.id] || (st[spec.id] = {ziele: []}), Z = spec.ziele || [], ax = spec.achsen, Y = spec.y || "s";
  const stg = spec.steigung || (Y === "s" ? {name: "Geschwindigkeit", einheit: "m/s"} : {name: "Geschwindigkeitsänderung pro Sekunde", einheit: "m/s^{2}"});
  const ctl = [spec.steuer], v = K.initVals(ctl), H = 560, W = 900, top = 120, pad = {l: 84, r: 24, t: top + 26, b: 58};
  let zi = Math.max(0, Z.findIndex((x, i) => !(rec.ziele || [])[i])); if (zi < 0) zi = 0;
  let run = null, trace = [], raf = 0, last = 0, result = null;
  const box = K.openSheet(`<div class="eyebrow">Diagramm-Trainer · ${esc(K.roomName(id))}</div><h3>📈 ${fmtN(spec.titel)}</h3><p>${fmtN(spec.text || "")}</p>
    <div class="r3l-diag"><div class="zt">${Z.map((z, i) => `<button data-z="${i}" class="${(rec.ziele || [])[i] ? "ok" : ""}">Ziel ${i + 1}</button>`).join("")}</div>
    <div data-zt class="note"></div><canvas width="${W}" height="${H}"></canvas>${K.ctlHTML(ctl, v)}
    <div class="r3l-row"><button class="btn" data-go>▶ Start</button><button class="btn ghost" data-stop hidden>■ Stopp</button></div><div data-f></div><div data-q></div></div>`,
    () => { cancelAnimationFrame(raf); try { spec.live && spec.live(null); } catch (e) {} DG = null; }, {wide: true});
  K.lookAside();
  const cv = box.querySelector("canvas"), g = cv.getContext("2d"), fb = box.querySelector("[data-f]"), qEl = box.querySelector("[data-q]"), zt = box.querySelector("[data-zt]");
  const goB = box.querySelector("[data-go]"), stopB = box.querySelector("[data-stop]");
  K.ctlWire(box, ctl, v, () => {});
  const X0 = pad.l, X1 = W - pad.r, Y0 = H - pad.b, Y1 = pad.t, xmax = ax.x.max || spec.dauer, ymin = ax.y.min || 0, ymax = ax.y.max;
  const px = t => X0 + (X1 - X0) * t / xmax, py = y => Y0 - (Y0 - Y1) * (y - ymin) / (ymax - ymin);
  const bahn = spec.bahn || (Y === "s" ? {max: ymax, name: ax.y.name} : null);
  function draw(z){
    g.clearRect(0, 0, W, H); g.fillStyle = "#10131a"; g.fillRect(0, 0, W, H);
    // Laufbahn oben: Position und Geschwindigkeitspfeil
    if (bahn) { const bx0 = X0, bx1 = X1, by = 62, s = z ? z.s : (spec.start || {}).s || 0, bxs = bx0 + (bx1 - bx0) * Math.max(0, Math.min(1, s / bahn.max));
      g.strokeStyle = "#5b6577"; g.lineWidth = 6; g.beginPath(); g.moveTo(bx0, by + 22); g.lineTo(bx1, by + 22); g.stroke();
      g.fillStyle = "#9aa6b8"; g.font = "18px system-ui"; g.textAlign = "center"; for (let k2 = 0; k2 <= bahn.max + 1e-9; k2 += (bahn.teil || ax.y.teil || 5)) { const xx = bx0 + (bx1 - bx0) * k2 / bahn.max; g.fillRect(xx - 1, by + 16, 2, 12); g.fillText(nf(k2, 2), xx, by + 46); }
      g.fillStyle = "#ffd166"; g.beginPath(); g.arc(bxs, by, 15, 0, 7); g.fill(); g.fillStyle = "#10131a"; g.font = "700 16px system-ui"; g.fillText(spec.figur || "●", bxs, by + 6);
      const vv = z ? z.v : 0; if (Math.abs(vv) > 1e-3) { const L2 = Math.min(160, 40 * Math.abs(vv)); g.strokeStyle = "#4fc3f7"; g.fillStyle = "#4fc3f7"; g.lineWidth = 4; g.beginPath(); g.moveTo(bxs, by - 26); g.lineTo(bxs + Math.sign(vv) * L2, by - 26); g.stroke();
        g.beginPath(); g.moveTo(bxs + Math.sign(vv) * (L2 + 10), by - 26); g.lineTo(bxs + Math.sign(vv) * L2, by - 33); g.lineTo(bxs + Math.sign(vv) * L2, by - 19); g.fill(); }
      g.textAlign = "left"; g.fillStyle = "#cfd8e3"; g.font = "18px system-ui"; K.subText(g, bahn.name || "s in m", bx0, 22); }
    // Gitter und Achsen
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.fillStyle = "#9aa6b8"; g.font = "18px system-ui";
    for (let t = 0; t <= xmax + 1e-9; t += ax.x.teil || 1) { g.beginPath(); g.moveTo(px(t), Y1); g.lineTo(px(t), Y0); g.stroke(); g.textAlign = "center"; g.fillText(nf(t, 2), px(t), Y0 + 24); }
    for (let y = ymin; y <= ymax + 1e-9; y += ax.y.teil || 1) { g.beginPath(); g.moveTo(X0, py(y)); g.lineTo(X1, py(y)); g.stroke(); g.textAlign = "right"; g.fillText(nf(y, 2), X0 - 10, py(y) + 6); }
    g.strokeStyle = "#cfd8e3"; g.lineWidth = 2; g.beginPath(); g.moveTo(X0, Y1 - 6); g.lineTo(X0, Y0); g.lineTo(X1 + 6, Y0); g.stroke();
    g.fillStyle = "#cfd8e3"; g.font = "600 20px system-ui"; g.textAlign = "right"; K.subText(g, ax.x.name || "t in s", X1, Y0 + 50, "right"); g.textAlign = "left"; K.subText(g, ax.y.name, X0 - 70, Y1 - 12);
    // Ziel (gestrichelt) und eigene Kurve
    const zz = Z[zi]; if (zz) { g.setLineDash([12, 9]); g.strokeStyle = "#ffd166"; g.lineWidth = 4; g.beginPath(); zz.punkte.forEach(([t, y], i) => i ? g.lineTo(px(t), py(y)) : g.moveTo(px(t), py(y))); g.stroke(); g.setLineDash([]); }
    if (trace.length > 1) { g.strokeStyle = "#4fc3f7"; g.lineWidth = 4; g.beginPath(); trace.forEach(([t, y], i) => i ? g.lineTo(px(t), py(Math.max(ymin - (ymax - ymin) * .05, Math.min(ymax * 1.05, y)))) : g.moveTo(px(t), py(y))); g.stroke(); }
    if (run) { g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(px(run.t), Y1); g.lineTo(px(run.t), Y0); g.stroke(); }
    g.font = "600 18px system-ui"; g.textAlign = "left"; g.fillStyle = "#ffd166"; g.fillText("- - Ziel", X1 - 190, Y1 + 4); g.fillStyle = "#4fc3f7"; g.fillText("— deine Kurve", X1 - 110, Y1 + 4);
  }
  function setZiel(i){ zi = i; trace = []; result = null; msg(fb, ""); box.querySelectorAll("[data-z]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.z === i));
    const z = Z[i]; zt.innerHTML = z ? `<b>Ziel ${i + 1}: ${fmtN(z.name || "")}</b> ${fmtN(z.text || "Stelle den Regler während der Fahrt so ein, dass deine Kurve dem gestrichelten Ziel folgt.")}` : ""; draw(null); }
  box.querySelectorAll("[data-z]").forEach(b => b.onclick = () => { if (!run) setZiel(+b.dataset.z); });
  const H0 = 1 / 60;
  function startRun(){ if (run) return; result = null; msg(fb, ""); trace = []; run = {t: 0, z: Object.assign({s: 0, v: 0}, spec.start || {})}; trace.push([0, run.z[Y]]);
    goB.hidden = true; stopB.hidden = false; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stepSim(dt){ let acc = dt; while (acc > 1e-9 && run.t < spec.dauer - 1e-9) { const h = Math.min(H0, acc, spec.dauer - run.t); run.z = spec.modell(Object.assign({}, run.z), v[spec.steuer.id], h); run.t += h; acc -= h;
      if (run.t - trace[trace.length - 1][0] >= .05 - 1e-9 || run.t >= spec.dauer - 1e-9) trace.push([run.t, run.z[Y]]); } }
  function loop(now){ const dt = Math.min(.05, (now - last) / 1000); last = now; stepSim(dt); try { spec.live && spec.live(run.z); } catch (e) {} draw(run.z);
    if (run.t >= spec.dauer - 1e-9) return endRun(); raf = requestAnimationFrame(loop); }
  function stopRun(){ cancelAnimationFrame(raf); run = null; goB.hidden = false; stopB.hidden = true; goB.textContent = "▶ Nochmal"; draw(null); }
  function endRun(){ const z = run.z; cancelAnimationFrame(raf); run = null; goB.hidden = false; stopB.hidden = true; goB.textContent = "▶ Nochmal"; draw(z); evaluate(); }
  // Bewertung: mittlere und größte Abweichung (bezogen auf die y-Achse); Rückmeldung zum Abschnitt mit der größten Abweichung über die Steigung
  // was im schlechtesten Abschnitt anders war: Richtung (Vorzeichen) zuerst, dann der Betrag
  function trend(km, kz, eps){
    if (Y === "s") { if (Math.abs(kz) < eps) return "hätte der Wagen stehen sollen"; if (km * kz < 0 || Math.abs(km) < eps) return km * kz < 0 ? "bist du in die falsche Richtung gefahren" : "bist du stehen geblieben";
      return Math.abs(km) > Math.abs(kz) ? "warst du zu schnell" : "warst du zu langsam"; }
    if (Math.abs(kz) < eps) return km > 0 ? "ist die Geschwindigkeit gestiegen – sie sollte gleich bleiben" : "ist die Geschwindigkeit gesunken – sie sollte gleich bleiben";
    if (kz > 0) return km > kz ? "ist die Geschwindigkeit zu schnell gestiegen" : km <= eps ? "hätte die Geschwindigkeit steigen sollen" : "ist die Geschwindigkeit zu langsam gestiegen";
    return km < kz ? "ist die Geschwindigkeit zu schnell gesunken" : km >= -eps ? "hätte die Geschwindigkeit sinken sollen" : "ist die Geschwindigkeit zu langsam gesunken"; }
  function evaluate(){ const z = Z[zi]; if (!z) return; const tol = z.toleranz || .06, span = ymax - ymin, T = spec.dauer; let sum = 0, mx = 0, n = 0;
    const mine = t => at(trace, t);
    for (let t = 0; t <= T + 1e-9; t += .25) { const d = Math.abs(mine(t) - at(z.punkte, t)) / span; sum += d; mx = Math.max(mx, d); n++; }
    const mean = sum / n, ok = mean <= tol && mx <= tol * 3; result = {mean, mx, ok};
    if (ok) { const first0 = !(rec.ziele || [])[zi]; rec.ziele[zi] = 1; K.lsave(); box.querySelector(`[data-z="${zi}"]`).classList.add("ok");
      msg(fb, `<b>✓ Geschafft!</b> Abweichung im Mittel ${nf(mean * 100, 0)} %. ${fmtN(z.erklaerung || "")}${zi + 1 < Z.length ? "" : ""}`, "ok");
      if (first0) K.xp(5);
      if (Z.every((x, i) => rec.ziele[i])) fragen(); else if (zi + 1 < Z.length) { fb.insertAdjacentHTML("beforeend", `<div class="r3l-row"><button class="btn" data-nz>Nächstes Ziel →</button></div>`); fb.querySelector("[data-nz]").onclick = () => setZiel(Z.findIndex((x, i) => !rec.ziele[i])); }
      return; }
    // größter Unterschied der Steigung je Zielabschnitt
    let worst = null; for (let i = 1; i < z.punkte.length; i++) { const [a0, y0] = z.punkte[i - 1], [a1, y1] = z.punkte[i]; if (a1 - a0 < .5) continue;
      const kz = (y1 - y0) / (a1 - a0), km = (mine(a1) - mine(a0)) / (a1 - a0), d = Math.abs(km - kz); if (!worst || d > worst.d) worst = {a0, a1, kz, km, d}; }
    const tip = worst ? `Zwischen ${nf(worst.a0, 1)} s und ${nf(worst.a1, 1)} s ${trend(worst.km, worst.kz, span / T * .02)}:
      Die Steigung (${esc(stg.name)}) war bei dir etwa ${fmtN(nf(worst.km, 2) + " " + stg.einheit)}, im Ziel ${fmtN(nf(worst.kz, 2) + " " + stg.einheit)}.` : "";
    msg(fb, `<b>Noch nicht ganz.</b> Abweichung im Mittel ${nf(mean * 100, 0)} % (erlaubt: ${nf(tol * 100, 0)} %). ${tip} ${z.tipp ? "Tipp: " + fmtN(z.tipp) : ""}`, "no"); }
  goB.onclick = startRun; stopB.onclick = stopRun;
  // Ablesefragen nach allen Zielen (eigenes Schaubild je Frage möglich)
  function fragen(){ const Q = spec.fragen || []; if (!Q.length) return finishAll(); if (qEl.dataset.on) return; qEl.dataset.on = 1; let k = 0;
    qEl.innerHTML = `<p style="margin-top:14px"><b>Jetzt lesen wir Diagramme ab.</b></p>`;
    const next = () => { if (k >= Q.length) return finishAll(); const q = Q[k++], d = document.createElement("div"); d.className = "r3l-card"; qEl.appendChild(d);
      if (q.kurven) { d.insertAdjacentHTML("beforeend", `<canvas width="${W}" height="380" style="width:100%;height:auto;border-radius:10px;background:#10131a"></canvas>`); mini(d.querySelector("canvas"), q); }
      if (q.optionen) DG.ctl = choice(d, q.frage, q.optionen.map((t, i) => ({t, ok: i === q.richtig, warum: (q.warum || [])[i]})), () => next(), {erklaerung: q.erklaerung});
      else { K.numTask(d, {frage: q.frage, wert: q.wert, einheit: q.einheit, toleranz: q.toleranz, tipps: q.tipps, loesung: q.loesung}, () => next());
        DG.ctl = {auto(){ const i = d.querySelector(".r3l-task input"); i.value = nfs(q.wert); d.querySelector("[data-chk]").click(); }}; }
      d.scrollIntoView({block: "nearest"}); };
    next(); }
  function finishAll(){ const first0 = !rec.ok; rec.ok = 1; K.lsave(); if (first0) K.xp(20); DG.done = true;
    qEl.insertAdjacentHTML("beforeend", `<div class="r3l-msg ok"><b>✓ Diagramm-Trainer geschafft${first0 ? " · +20 XP" : ""}!</b> ${fmtN(spec.merke || "")}</div>`); }
  function mini(c, q){ const x = c.getContext("2d"), w = c.width, h = c.height, P = {l: 84, r: 30, t: 30, b: 56}, xm = (q.achsen || ax).x.max || xmax, ya = (q.achsen || ax).y, y0 = ya.min || 0, ym = ya.max;
    const X = t => P.l + (w - P.l - P.r) * t / xm, Yy = y => h - P.b - (h - P.b - P.t) * (y - y0) / (ym - y0); x.fillStyle = "#10131a"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(255,255,255,.12)"; x.fillStyle = "#9aa6b8"; x.font = "18px system-ui";
    for (let t = 0; t <= xm + 1e-9; t += ((q.achsen || ax).x.teil || 1)) { x.beginPath(); x.moveTo(X(t), P.t); x.lineTo(X(t), h - P.b); x.stroke(); x.textAlign = "center"; x.fillText(nf(t, 2), X(t), h - P.b + 24); }
    for (let y = y0; y <= ym + 1e-9; y += ya.teil || 1) { x.beginPath(); x.moveTo(P.l, Yy(y)); x.lineTo(w - P.r, Yy(y)); x.stroke(); x.textAlign = "right"; x.fillText(nf(y, 2), P.l - 10, Yy(y) + 6); }
    x.strokeStyle = "#cfd8e3"; x.lineWidth = 2; x.beginPath(); x.moveTo(P.l, P.t); x.lineTo(P.l, h - P.b); x.lineTo(w - P.r, h - P.b); x.stroke();
    x.fillStyle = "#cfd8e3"; x.font = "600 20px system-ui"; K.subText(x, (q.achsen || ax).x.name || "t in s", w - P.r, h - 10, "right"); K.subText(x, ya.name, 8, 22);
    const COL = ["#4fc3f7", "#ff8a65", "#a5d6a7", "#ce93d8"];
    q.kurven.forEach((k2, i) => { x.strokeStyle = k2.farbe || COL[i % 4]; x.lineWidth = 4; x.beginPath(); k2.punkte.forEach(([t, y], j) => j ? x.lineTo(X(t), Yy(y)) : x.moveTo(X(t), Yy(y))); x.stroke();
      const [lt, ly] = k2.punkte[k2.punkte.length - 1]; x.fillStyle = k2.farbe || COL[i % 4]; x.font = "700 20px system-ui"; x.textAlign = "right"; x.fillText(plain(k2.name || ""), X(lt) - 6, Yy(ly) - 10); }); }
  setZiel(zi);
  if (rec.ok && (spec.fragen || []).length) {}   // schon geschafft: Ziele frei wählbar, Fragen kommen nach dem nächsten Erfolg wieder
  // Für Tests: Regler gierig so stellen, dass die Kurve dem Ziel folgt (prüft zugleich, ob ein Ziel mit dem Regler erreichbar ist)
  DG = {id: spec.id, room: id, get zi(){ return zi; }, get result(){ return result; }, done: false, ctl: null, ziele: () => Z.length,
    setZiel, auto(){ const c = spec.steuer, steps = Math.round((c.max - c.min) / (c.schritt || .1)); const z0 = Z[zi]; run = {t: 0, z: Object.assign({s: 0, v: 0}, spec.start || {})}; trace = [[0, run.z[Y]]];
      while (run.t < spec.dauer - 1e-9) { const h = Math.min(H0, spec.dauer - run.t); let best = v[c.id], bd = Infinity;
        for (let i = 0; i <= steps; i++) { const u = c.min + i * (c.schritt || .1), zn = spec.modell(Object.assign({}, run.z), u, h), ahead = Math.min(spec.dauer, run.t + h + .3);
          // ein kurzes Stück vorausschauen, damit z. B. die Geschwindigkeit rechtzeitig angepasst wird
          let zf = zn, tt = run.t + h; while (tt < ahead - 1e-9) { zf = spec.modell(Object.assign({}, zf), u, H0); tt += H0; }
          const d = Math.abs(zn[Y] - at(z0.punkte, run.t + h)) + .5 * Math.abs(zf[Y] - at(z0.punkte, tt)); if (d < bd) { bd = d; best = u; } }
        v[c.id] = best; stepSim(h); }
      run = {t: spec.dauer, z: run.z}; endRun(); return result; }};
}

/* ---------- Für Bedientests ---------- */
Object.assign(L.debug, {
  uebung: id => { openUebung(id || (A.cur() || {}).key); return !!K.sheetEl && !K.sheetEl.hidden; },
  rechen: () => RWS && {k: RWS.k, n: RWS.n, steps: RWS.steps, cur: RWS.cur, done: RWS.done},
  rechenOpen: (id, k) => openRechen(id || A.cur().key, k), rechenAuto: () => RWS && RWS.ctl && RWS.ctl.auto(),
  umst: () => UMS && {k: UMS.k, n: UMS.n, done: UMS.done}, umstOpen: (id, k) => openUmst(id || A.cur().key, k), umstAuto: () => UMS && UMS.auto(), umstTypisch: j => UMS && UMS.typisch(j),
  fehler: () => FS && {k: FS.k, n: FS.n, stage: FS.stage, done: FS.done}, fehlerOpen: (id, k) => openFehler(id || A.cur().key, k), fehlerLine: i => FS && FS.line(i), fehlerFb: () => FS && FS.fb(),
  fehlerAuto: () => FS && FS.ctl && FS.ctl.auto(),
  diag: () => DG && {id: DG.id, zi: DG.zi, ziele: DG.ziele(), result: DG.result, done: DG.done}, diagOpen: id => { const c = A.cur(); const o = c && c.ctx._inter.find(x => x.userData.ia && x.userData.ia.diag && (!id || x.userData.ia.diag.id === id)); if (o) openDiag(o.userData.ia.diag); return !!o; },
  diagZiel: i => DG && DG.setZiel(i), diagAuto: () => DG && DG.auto(), diagFrage: () => DG && DG.ctl && DG.ctl.auto(),
  // Inhalte prüfen ohne Klicks: Rechenwege (Einsetzen-Zahlen, Ergebnis), Umstellungen (Lösung ≡ Ausgangsformel), Fehlersuche (Indizes)
  antwort: (id, k, text) => { const a = (room(id).rechenweg || [])[k]; return a ? antwortCheck(a, text) : null; },
  pruefeInhalte(id){ const R = room(id), out = [];
    (R.rechenweg || []).forEach((a, i) => { const tag = `rechenweg[${i}]`;
      if (!a.gegeben || !a.gesucht || !a.formel || !a.einsetzen || !a.ergebnis || !a.antwort) out.push(tag + ": Feld fehlt");
      const syms = [...new Set([...toks(a.formel), ...toks(a.umgestellt || a.formel)].filter(t => t.s).map(t => t.s))];
      if (a.umgestellt && !syms.includes(lhs(a.umgestellt))) out.push(tag + ": umgestellt beginnt nicht mit einer Größe der Formel");
      // umgestellt muss zur Formel passen: Werte aus gegeben einsetzen und Ergebnis vergleichen
      try { const val = {}; a.gegeben.forEach(x => val[x.g] = x.si ? x.si.wert : x.wert); const r = evalT(toks(rhs(a.umgestellt || a.formel)), val);
        if (Math.abs(r - a.ergebnis.wert) > (a.ergebnis.toleranz != null ? a.ergebnis.toleranz : Math.abs(a.ergebnis.wert) * .005) + 1e-9) out.push(`${tag}: Formel mit den gegebenen Werten ergibt ${r}, Ergebnis ist ${a.ergebnis.wert}`); }
      catch (e) { out.push(tag + ": umgestellte Formel nicht auswertbar (Größen aus gegeben?)"); }
      const ns = []; String(a.einsetzen).replace(NUMRX, (m, sub, num) => { if (num) ns.push(pnum(num)); return m; });
      // erlaubt: gegebene Werte (umgerechnet) und Zahlen, die schon in der umgestellten Formel stehen (90°, 2, 3,6 …)
      const gv = [...a.gegeben.map(x => x.si ? x.si.wert : x.wert), ...toks(a.umgestellt || a.formel).filter(t => t.n != null).map(t => t.n)];
      ns.forEach(x => { if (!gv.some(y => near(x, y))) out.push(`${tag}: Zahl ${x} in einsetzen ist weder gegeben noch Teil der Formel`); });
      (a.einheitAuch || []).forEach(u => { const n = normU(u), e = normU(a.ergebnis.einheit); if (n !== e && !umFaktor(e, n)) out.push(`${tag}: einheitAuch „${u}“ lässt sich nicht in ${e} umrechnen (wird ignoriert)`); });
      if (!antwortCheck(a, plainT(a.antwort)).ok) out.push(tag + ": Musterantwort besteht die Prüfung nicht (Ergebnis mit Einheit direkt dahinter)");
      [...(a.formelAblenker || []), ...(a.umstellAblenker || [])].forEach(x => { if (!x.warum) out.push(`${tag}: Ablenker ohne warum`); });
      if ((a.umstellAblenker || []).some(x => same(toks(rhs(x.f)), toks(rhs(a.umgestellt)), syms))) out.push(tag + ": ein Umstell-Ablenker ist gleichwertig zur Lösung");
      (a.formelAblenker || []).forEach((x, j) => { try { if (lhs(x.f) === lhs(a.formel) && same(toks(rhs(x.f)), toks(rhs(a.formel)), syms)) out.push(`${tag}: formelAblenker[${j}] ist gleichwertig zur Formel`); } catch (e) {} }); });
    (R.umstellen || []).forEach((u, i) => { const tag = `umstellen[${i}]`, syms = [...new Set(toks(u.formel).filter(t => t.s).map(t => t.s))], z = lhs(u.loesung);
      if (!syms.includes(z)) { out.push(tag + ": Zielgröße nicht in der Formel"); return; }
      // Lösung erfüllt die Ausgangsformel? Andere Größen frei wählen, Zielgröße aus der Lösung, dann beide Seiten der Formel vergleichen
      try { [[2.3, 4.1, .7, 3.3], [1.7, .45, 5.2, 2.8]].forEach(r => { const val = Object.fromEntries(syms.filter(s => s !== z).map((s, j) => [s, r[j % 4] + j * .37])); val[z] = evalT(toks(rhs(u.loesung)), val);
          const L1 = evalT(toks(lhs(u.formel)), val), R1 = evalT(toks(rhs(u.formel)), val); if (Math.abs(L1 - R1) > 1e-9 * Math.max(1, Math.abs(L1))) throw 1; }); }
      catch (e) { out.push(tag + ": Lösung erfüllt die Ausgangsformel nicht"); }
      (u.typisch || []).forEach((x, j) => { if (same(toks(rhs(x.f)), toks(rhs(u.loesung)), syms)) out.push(`${tag}: typisch[${j}] ist gleichwertig zur Lösung`); if (!x.warum) out.push(`${tag}: typisch[${j}] ohne warum`); }); });
    // Rückmeldung je falscher Antwort: jede Auswahlfrage des Themas, Länge wie options, an der richtigen Stelle null
    const T = TMAP[id]; if (T && R.warum) { T.quiz.forEach((q, i) => { if (!q.options) return; const w = R.warum[i];
        if (!w) { out.push(`warum[${i}] fehlt`); return; } if (w.length !== q.options.length) out.push(`warum[${i}]: ${w.length} statt ${q.options.length} Einträge`);
        w.forEach((x, j) => { if (j === q.answer && x) out.push(`warum[${i}][${j}]: an der richtigen Antwort muss null stehen`); if (j !== q.answer && !(typeof x === "string" && x.trim().length > 10)) out.push(`warum[${i}][${j}] fehlt oder zu kurz`); }); });
      Object.keys(R.warum).forEach(k => { if (!T.quiz[+k] || !T.quiz[+k].options) out.push(`warum[${k}]: keine Auswahlfrage mit diesem Index`); }); }
    const sb = R.suchbild; if (sb) { (sb.fehler || []).forEach((f, k) => { if (!f.warum) return; if (f.warum.length !== f.optionen.length) out.push(`suchbild.fehler[${k}].warum: Länge`);
        f.warum.forEach((x, j) => { if (j === f.richtig && x) out.push(`suchbild.fehler[${k}].warum[${j}]: an der richtigen Begründung null`); if (j !== f.richtig && !(typeof x === "string" && x.trim().length > 10)) out.push(`suchbild.fehler[${k}].warum[${j}] fehlt`); }); });
      (sb.ablenker || []).forEach((a, k) => { if (!(a.x >= 0 && a.x <= 1200 && a.y >= 0 && a.y <= 800 && a.r >= 30 && a.r <= 140 && a.text)) out.push(`suchbild.ablenker[${k}]: x, y, r (30–140) oder text`);
        (sb.fehler || []).forEach((f, j) => { if (Math.hypot(f.x - a.x, f.y - a.y) < f.r + a.r) out.push(`suchbild.ablenker[${k}] überlappt fehler[${j}]`); }); }); }
    (R.fehlersuche || []).forEach((f, i) => { const tag = `fehlersuche[${i}]`;
      if (!(f.falsch >= 0 && f.falsch < f.zeilen.length)) out.push(tag + ": falsch außerhalb der Zeilen"); if (!(f.optionen && f.optionen.length === 4 && f.richtig >= 0 && f.richtig < 4)) out.push(tag + ": optionen/richtig");
      if (!f.korrektur || f.korrektur.wert == null) out.push(tag + ": korrektur fehlt"); });
    return out; }
});
})();
