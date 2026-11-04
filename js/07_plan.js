/* ---------- 07_plan.js ---------- */
/* =====================================================================
   3D-Räume (nur Mac-Version) · Lernplan bis zur Schulaufgabe und Tagesrätsel
   Halle: Lernplan-Tafel (Termin eintragen, Tage bis zur Schulaufgabe, Raum im Fokus, Tagesrätsel), „Heute“-Schild über der Tür des Fokus-Raums.
   Der Plan nutzt den Lernplan der App (S.examDate, todayPlan: je Tag ein Thema im Fokus, die letzten 7 Tage Endspurt) und den
   Wiederholungsplan (S.rev: fällige Fragen). Tagesrätsel: einmal am Tag 5 Fragen von früher – fällige zuerst, dann offene Fehler,
   dann am längsten nicht gesehene. Auch als Reiter „Lernplan“ in der Akte.
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern || !R3D.lern._k) return;
const L = R3D.lern, K = L._k, A = K.A, HK = K.HK, fmtN = K.fmtN;
const ORT = {x: 3.6, z: 3.4, ry: -.42};   // Halle: rechts vor dem Mittelstück, schräg zum Eingang
const msg = (el, html, cls = "") => { el.innerHTML = html ? `<div class="r3l-msg ${cls}">${html}</div>` : ""; };
const dnice = d => dateOnly(d).toLocaleDateString("de-DE", {weekday: "long", day: "numeric", month: "long"});
const dshort = d => dateOnly(d).toLocaleDateString("de-DE", {weekday: "short", day: "numeric", month: "numeric"});
const roomNo = t => K.tIdx(t) + 1;
const plan = () => { try { return todayPlan(); } catch (e) { return null; } };
const D = () => { try { return daysToExam(); } catch (e) { return null; } };
const EX = (typeof EXN !== "undefined" && EXN) || {name: "Schulaufgabe", zum: "zur Schulaufgabe", dein: "deine Schulaufgabe"};

/* ---------- Tagesrätsel ---------- */
const valid = k => { const [t, i] = String(k).split(":"); return !!(TMAP[t] && TMAP[t].quiz[+i]); };
function tagesItems(){
  const t = today(), T = K.LS.tages || (K.LS.tages = {});
  if (T.d === t && (T.items || []).length) return T.items.filter(valid);
  const seen = new Set(), out = [], add = k => { if (out.length < 5 && !seen.has(k) && valid(k)) { seen.add(k); out.push(k); } };
  try { revDueKeys("q").forEach(add); } catch (e) {}                                                         // 1. fällige Wiederholungen
  try { errList().slice().sort((a, b) => (a.d || "").localeCompare(b.d || "")).forEach(e => add(e.t + ":" + e.i)); } catch (e) {}   // 2. offene Fehler
  const R = ((S.rev || {}).q) || {};                                                                          // 3. am längsten nicht gesehen
  Object.keys(R).filter(k => R[k].l && R[k].l < t).sort((a, b) => R[a].l.localeCompare(R[b].l)).forEach(add);
  if (out.length < 3) return [];   // zu wenig Vorgeschichte: erst ab dem zweiten Lerntag
  K.LS.tages = {d: t, items: out, gezeigt: T.d === t ? T.gezeigt : null}; K.lsave(); return out;
}
const tagesDone = items => { const R = ((S.rev || {}).q) || {}, t = today(); return items.filter(k => R[k] && R[k].l === t).length; };
function startTages(){ const items = tagesItems(); if (!items.length) return;
  const qs = items.map(k => { const [t, i] = k.split(":"); return {...TMAP[t].quiz[+i], t, i: +i}; });
  K.closeModal(); K.closeSheet(); RET = ["home"]; save(); A.leaveTo(() => A.go2("quiz", qs)); }
function tagesHTML(){ const it = tagesItems(), n = tagesDone(it), s = K.story();
  if (!it.length) return `<div class="r3l-card"><b>🧩 Tagesrätsel</b><p>Ab deinem zweiten Lerntag wartet hier jeden Tag ein Rätsel aus fünf Fragen von früher – genau die, die du sonst vergessen würdest.</p></div>`;
  return `<div class="r3l-card"><b>🧩 Tagesrätsel ${n >= it.length ? "✓" : ""}</b><p>${n >= it.length ? "Heute schon gelöst – morgen gibt es ein neues." : `${it.length} Fragen von früher: zuerst, was heute zur Wiederholung fällig ist, dann deine offenen Fehler. ${n ? `Schon ${n} von ${it.length} beantwortet.` : ""}`}</p>
    ${n >= it.length ? "" : `<div class="r3l-row"><button class="btn" data-tr>▶ Tagesrätsel lösen</button></div>`}</div>`; }

/* ---------- Plan-Inhalt (Fenster in der Halle und Reiter der Akte) ---------- */
function planHTML(body, refresh){
  const P = plan(), d = D(), has = !!S.examDate, it = tagesItems();
  const datum = `<div class="r3l-card"><b>📅 Termin ${esc(EX.zum || "zur Schulaufgabe")}</b>
      <div class="r3l-row" style="align-items:center"><input type="date" data-ex value="${esc(S.examDate || "")}" min="${today()}" style="font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink)">
      <button class="btn" data-sv>Speichern</button>${has ? `<button class="btn ghost" data-del>Termin löschen</button>` : ""}</div><div data-f></div></div>`;
  let kopf = "", heute = "", woche = "";
  if (!has) kopf = `<p>Trag ein, wann ${esc(EX.dein || "deine Schulaufgabe")} ist. Dann verteilt die App die acht Räume auf die Tage bis dahin – jeden Tag ein Raum im Fokus, die letzten sieben Tage Endspurt mit Wiederholen und Probe-${esc(EX.name || "Schulaufgabe")}.</p>`;
  else if (!P) kopf = `<div class="r3l-msg warn">Der eingetragene Termin liegt in der Vergangenheit. Trag den nächsten ein.</div>`;
  else {
    kopf = `<div class="r3l-msg ${d <= 7 ? "warn" : ""}" style="font-size:1.05rem"><b>${d === 0 ? esc(EX.heute || "Heute ist Schulaufgabe") + " – viel Erfolg!" : `Noch ${d} ${d === 1 ? "Tag" : "Tage"} bis ${esc(EX.zum || "zur Schulaufgabe")}`}</b> (${esc(dnice(S.examDate))}) · ${esc(P.phase)}</div>`;
    if (P.focus) heute = `<div class="r3l-card"><b>Heute im Fokus: ${esc((window.WELTEN_API ? window.WELTEN_API.word : "Raum") + " " + roomNo(P.focus))} · ${esc(K.roomName(P.focus))}</b><p>${esc(TMAP[P.focus].title)}. Über der Tür in der Halle hängt heute ein Schild.</p>
      <div class="r3l-row"><button class="btn" data-hin="${esc(P.focus)}">🚶 Hingehen</button></div></div>`;
    else if (P.phase !== "Prüfungstag") heute = `<div class="r3l-card"><b>Heute: Wiederholen und ${esc(EX.name || "Schulaufgabe")} üben</b><p>Im Endspurt kommt kein neuer Stoff dazu. Jetzt zählt, dass alles sitzt.</p></div>`;
    if (P.tasks && P.tasks.length) heute += `<div class="r3l-card"><b>Dein Tagespensum</b>${P.tasks.map((t, i) => { const ok = t.done >= t.goal;
      return `<div class="rw-row" style="display:flex;gap:8px;align-items:center;margin:6px 0"><span>${ok ? "✓" : "○"}</span><span style="flex:1">${esc(t.label)} <span class="note">(${Math.min(t.done, t.goal)}/${t.goal})</span></span>${ok ? "" : `<button class="btn ghost" data-task="${i}">Start</button>`}</div>`; }).join("")}</div>`;
    // Wochenübersicht: Fokus-Raum je Tag (Lernphase) bzw. Endspurt
    const n = Math.min(d, 10); if (n > 0) { let sched = []; try { sched = d > 7 ? schedule(d - 7) : []; } catch (e) {}
      woche = `<div class="r3l-card"><b>Die nächsten Tage</b>${Array.from({length: n}, (x, j) => { const day = addDays(today(), j), left = d - j, t = left > 7 ? sched[j] : null;
        return `<div style="display:flex;gap:10px;margin:4px 0"><span style="min-width:7.5em;opacity:.8">${j === 0 ? "heute" : esc(dshort(day))}</span><span>${t ? esc((window.WELTEN_API ? window.WELTEN_API.word : "Raum") + " " + roomNo(t) + " · " + K.roomName(t)) : left > 0 ? "Endspurt: wiederholen" + (left % 2 === 1 ? ", Probe-" + esc(EX.name || "Schulaufgabe") : "") : ""}</span></div>`; }).join("")}</div>`; }
  }
  body.innerHTML = `${kopf}${heute}${tagesHTML()}${woche}${datum}<p class="note">Verteilt lernen wirkt: Jeden Tag 15 bis 20 Minuten bringen mehr als drei Stunden am Abend vorher.</p>`;
  const f = body.querySelector("[data-f]"), inp = body.querySelector("[data-ex]");
  body.querySelector("[data-sv]").onclick = () => { const v = inp.value; if (!v) { msg(f, "Bitte ein Datum wählen.", "warn"); return; } if (v < today()) { msg(f, "Das Datum liegt in der Vergangenheit.", "warn"); return; }
    S.examDate = v; save(); toast("Termin gespeichert", 1400); redrawBoard(); refresh(); };
  const del = body.querySelector("[data-del]"); if (del) del.onclick = () => { delete S.examDate; save(); redrawBoard(); refresh(); };
  const tr = body.querySelector("[data-tr]"); if (tr) tr.onclick = startTages;
  const hin = body.querySelector("[data-hin]"); if (hin) hin.onclick = () => { const t = hin.dataset.hin, c = A.cur(); K.closeModal(); if (!c || c.key !== t) R3D.enter(t, c ? c.key : "halle"); };
  body.querySelectorAll("[data-task]").forEach(b => b.onclick = () => { const task = P.tasks[+b.dataset.task]; K.closeModal(); RET = ["home"]; A.leaveTo(() => { try { startTask(task); } catch (e) { console.error(e); } }); });
  void it;
}
function openPlan(){ const box = K.openModal(`<div class="eyebrow">Lernplan</div><h3>📅 Dein Weg ${esc(EX.zum || "zur Schulaufgabe")}</h3><div data-pl></div>`);
  const body = box.querySelector("[data-pl]"), refresh = () => planHTML(body, refresh); refresh(); }
L.akteTabs.push({id: "plan", label: () => "Lernplan", render: body => { const refresh = () => planHTML(body, refresh); refresh(); }});

/* ---------- Halle: Lernplan-Tafel und „Heute“-Schild ---------- */
let board = null;   // {canvas, tex, world}
function drawBoard(){ if (!board) return; const c = board.canvas, x = c.getContext("2d"), w = c.width, h = c.height, st = board.world === "sterne", dt = board.world === "detektiv";
  const bg = st ? "#0b1a2b" : dt ? "#efe6d2" : "#f1e3c2", ink = st ? "#d8f3ff" : "#2b2117", acc = st ? "#4fc3f7" : dt ? "#8a2b1e" : "#7a4b12";
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = acc; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20);
  x.textBaseline = "middle"; x.fillStyle = acc; x.font = "700 52px system-ui, sans-serif"; x.fillText("📅 Lernplan", 34, 66);
  const d = D(), P = plan(), it = tagesItems(), n = tagesDone(it);
  x.fillStyle = ink;
  if (!S.examDate || d == null || d < 0) { x.font = "600 36px system-ui, sans-serif"; x.fillText(`Wann ist ${EX.dein || "deine Schulaufgabe"}?`.slice(0, 30), 34, 160); x.font = "500 32px system-ui, sans-serif"; x.fillText("Anklicken: Termin eintragen", 34, 214); }
  else { x.font = "800 96px system-ui, sans-serif"; x.fillText(String(d), 34, 182); const tw = x.measureText(String(d)).width; x.font = "600 34px system-ui, sans-serif";
    x.fillText(d === 1 ? "Tag" : "Tage", 50 + tw, 160); x.fillText(`bis ${EX.zum || "zur Schulaufgabe"}`.slice(0, 26), 50 + tw, 204);
    x.font = "500 32px system-ui, sans-serif"; const fx = P && P.focus ? `Heute: ${(window.WELTEN_API ? window.WELTEN_API.word : "Raum")} ${roomNo(P.focus)} · ${K.roomName(P.focus)}` : P && P.phase === "Endspurt" ? "Heute: Endspurt – wiederholen" : "";
    x.fillText(fx.length > 34 ? fx.slice(0, 33) + "…" : fx, 34, 276); }
  x.font = "600 32px system-ui, sans-serif"; x.fillStyle = it.length && n >= it.length ? (st ? "#7ee2a8" : "#1f7a44") : acc;
  x.fillText(it.length ? (n >= it.length ? "🧩 Tagesrätsel gelöst ✓" : `🧩 Tagesrätsel: ${n} von ${it.length}`) : "🧩 Tagesrätsel ab morgen", 34, 340);
  board.tex.needsUpdate = true; }
const redrawBoard = () => { try { drawBoard(); } catch (e) {} };
function hallBoard(room){
  const ctx = room.ctx, T = ctx.T, g = new T.Group(); ctx.add(g, ORT.x, 0, ORT.z); g.rotation.y = ORT.ry;
  const c = document.createElement("canvas"); c.width = 640; c.height = 400; const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  board = {canvas: c, tex, world: ctx.world}; drawBoard();
  const w = 1.5, h = w * 400 / 640, yc = 1.55, pnl = new T.Group(); pnl.position.set(0, yc, 0); pnl.rotation.x = -.06; g.add(pnl);
  const pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map: tex, roughness: .8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .25})); pic.position.z = .03; pnl.add(pic);
  const fm = ctx.mat(ctx.world === "sterne" ? "metal" : "darkwood"); pnl.add(ctx.box(w + .1, h + .1, .04, fm));
  const post = ctx.cyl(.05, .06, yc, fm, 12); post.position.set(0, yc / 2, -.06); g.add(post); const foot = ctx.cyl(.3, .34, .05, fm, 20); foot.position.set(0, .025, -.06); g.add(foot);
  if (ctx.world === "sterne") { const edge = ctx.box(w + .14, .02, .05, ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2})); edge.position.set(0, -h / 2 - .08, .03); pnl.add(edge); }
  ctx.obstacle(ORT.x, ORT.z, .55);
  ctx.exhibit(g, {label: "Lernplan", get sub(){ const d = D(), it = tagesItems(), n = tagesDone(it); return `${S.examDate && d != null && d >= 0 ? `noch ${d} ${d === 1 ? "Tag" : "Tage"}` : "Termin eintragen"}${it.length && n < it.length ? " · Tagesrätsel offen" : ""}`; },
    onClick: () => openPlan(), dist: 1.9, pitch: -.05});
}
function focusSign(room){ const P = plan(); if (!P || !P.focus) return; const d = room.doors.find(x => x.to === P.focus); if (!d) return;
  const ctx = room.ctx, grp = new ctx.T.Group(); grp.position.set(0, 4.05, .4); d.door.group.add(grp);
  const t = ctx.text("📅 Heute im Plan", {size: .3, bg: ctx.world === "sterne" ? "#0b2a40" : "#7a1f12", color: "#ffffff"}); grp.add(t);
  const gl = ctx.glow(0xffd166, 1.4); gl.position.z = -.05; gl.userData.noPick = true; grp.add(gl);
  ctx.tick((dt, tt) => { grp.position.y = 4.05 + .05 * Math.sin(tt * 2); }); }
HK.afterBuild.push(room => { if (!room.isHall) return; try { hallBoard(room); focusSign(room); } catch (e) { console.error("Lernplan", e); } });

/* ---------- Einmal am Tag in der Halle: Tagesrätsel anbieten ---------- */
HK.afterEnter.push(c => {
  if (!c.isHall) return; redrawBoard(); const w = K.welt();
  setTimeout(() => { const T = K.LS.tages || {}, it = tagesItems();
    if (A.root.hidden || A.cur() !== c || !K.modalEl.hidden || A.moving() || K.welt() !== w || !K.LS.intro[w]) return;   // erst nach dem Auftrag der Welt
    if (!it.length || tagesDone(it) >= it.length || (K.LS.tages || {}).gezeigt === today()) return;
    const s = K.story() || {};
    K.openModal(`<div class="story"><div class="eyebrow">${esc(s.icon || "🧩")} Tagesrätsel · ${esc(dnice(today()))}</div><h3>🧩 Fünf Fragen von früher</h3>
      <p>${fmtN(s.tages || "Dein Tagesrätsel liegt bereit.")}</p><p>Heute dabei: ${esc(String(Math.min(it.length, revDueCount())))} zur Wiederholung fällig, der Rest aus deinen offenen Fehlern und aus Räumen, die schon länger her sind. Dauert etwa fünf Minuten.</p>
      <div class="r3l-row"><button class="btn" data-go>▶ Los geht's</button><button class="btn ghost" data-later>Später (an der Lernplan-Tafel)</button></div></div>`,
      {onClose: () => { K.LS.tages = Object.assign(K.LS.tages || {}, {gezeigt: today()}); K.lsave(); }});
    const m = K.modalEl; m.querySelector("[data-go]").onclick = () => { K.LS.tages.gezeigt = today(); K.lsave(); startTages(); }; m.querySelector("[data-later]").onclick = () => K.closeModal();
  }, 1300);
});
const revDueCount = () => { try { return revDueKeys("q").length; } catch (e) { return 0; } };

/* ---------- Für Bedientests ---------- */
Object.assign(L.debug, {
  plan: () => ({examDate: S.examDate || null, days: D(), focus: (plan() || {}).focus || null, tages: tagesItems(), tagesDone: tagesDone(tagesItems())}),
  planOpen: () => { openPlan(); return !K.modalEl.hidden; }, tagesStart: startTages, boardText: () => board ? true : false,
  setExam: d => { S.examDate = d; save(); redrawBoard(); }
});
})();
