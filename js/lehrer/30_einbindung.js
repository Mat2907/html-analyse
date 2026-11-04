/* ---------- lehrer/30_einbindung.js ---------- */
/* =====================================================================
   Lehrkraft-Version · Einbindung in die App
   3D (Mac-Version): je Raum eine große Tafel (Klick → vier Hefteinträge), in der Halle die Tafel „Schulaufgaben-Werkstatt“ (Klick → Generator),
   Knopf „🎓 Lehrkraft“ in der Kopfzeile. 2D: Lehrkraft-Karte auf der Startseite und Hefteinträge im Raum (Lernpfad).
   Die Tafel sucht sich je Raum einen freien Platz, den man vom Eingang aus sieht und der nichts Klickbares verdeckt.
   ===================================================================== */
(() => {
const LK = window.LK; if (!LK || !LK.D) return;
const esc = LK.esc, D = LK.D;
const offen = () => !document.getElementById("lt-vortrag").hidden || !document.getElementById("lt-wahl").hidden || (document.getElementById("lt-gen") && !document.getElementById("lt-gen").hidden);

/* ---------- 3D ---------- */
const R3D = window.R3D, T3 = window.THREE;
if (R3D && R3D.api && T3) {
  const A = R3D.api;
  // Während eine Lehrkraft-Ansicht offen ist, zeichnet die 3D-Szene nicht (spart Rechenzeit am Beamer-Rechner)
  const rr = R3D.renderer, render0 = rr.render.bind(rr);
  rr.render = (s, c) => { if (!offen() || document.documentElement.classList.contains("lt-test3d")) render0(s, c); };
  // Tasten in Lehrkraft-Ansichten nicht an die 3D-Steuerung weitergeben (sonst läuft die Figur unsichtbar mit und Pfeiltasten scrollen nicht)
  document.addEventListener("keydown", ev => { if (offen()) ev.stopPropagation(); });

  const STIL = {
    zauber: {grund: "#232027", rahmen: "brass", fuss: "darkwood", titel: "#E8C25A", schrift: "#F4EEDD", font: "Georgia, 'Times New Roman', serif"},
    sterne: {grund: "#0B1830", rahmen: "metal", fuss: "steel", titel: "#7FD8FF", schrift: "#E6F2FF", font: "'Avenir Next', 'Segoe UI', system-ui, sans-serif"},
    detektiv: {grund: "#24372B", rahmen: "darkwood", fuss: "darkwood", titel: "#F1DFA6", schrift: "#F2EEE2", font: "Georgia, 'Times New Roman', serif"}};
  const hand = "'Chalkboard SE', 'Comic Neue', 'Segoe Print', system-ui, sans-serif";

  function tafelTex(ctx, kopf, titel, zeilen, fuss){
    const s = STIL[ctx.world] || STIL.detektiv;
    return R3D.util.canvasTex(1280, 800, (g, w, h) => {
      g.fillStyle = s.grund; g.fillRect(0, 0, w, h);
      const gr = g.createRadialGradient(w * .35, h * .2, 50, w * .5, h * .5, w * .75); gr.addColorStop(0, "rgba(255,255,255,.07)"); gr.addColorStop(1, "rgba(0,0,0,.25)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalAlpha = .05; for (let i = 0; i < 260; i++) { g.fillStyle = "#fff"; g.fillRect((i * 397) % w, (i * 211) % h, 40 + (i % 7) * 12, 2); } g.globalAlpha = 1;
      g.textBaseline = "alphabetic"; g.fillStyle = s.schrift; g.globalAlpha = .75; g.font = `600 36px ${hand}`; g.fillText(kopf, 64, 84); g.globalAlpha = 1;
      g.fillStyle = s.titel; let fs = 74; g.font = `700 ${fs}px ${hand}`; while (g.measureText(titel).width > w - 128 && fs > 40) { fs -= 2; g.font = `700 ${fs}px ${hand}`; }
      g.fillText(titel, 64, 170); g.strokeStyle = s.titel; g.lineWidth = 4; g.beginPath(); g.moveTo(64, 196); g.lineTo(Math.min(w - 64, 64 + g.measureText(titel).width), 196); g.stroke();
      g.fillStyle = s.schrift; let y = 300;
      zeilen.forEach((z, i) => { let f2 = 56; g.font = `500 ${f2}px ${hand}`; while (g.measureText(z).width > w - 200 && f2 > 30) { f2 -= 2; g.font = `500 ${f2}px ${hand}`; }
        g.fillStyle = s.titel; g.font = `700 56px ${hand}`; g.fillText(String(i + 1), 70, y); g.fillStyle = s.schrift; g.font = `500 ${f2}px ${hand}`; g.fillText(z, 140, y); y += 112; });
      if (fuss) { g.globalAlpha = .7; g.font = `500 32px ${hand}`; g.fillText(fuss, 64, h - 50); g.globalAlpha = 1; }
    });
  }
  // Freistehende Tafel im Weltstil; Vorderseite +z lokal
  function tafel(ctx, tex){
    const T = ctx.T, s = STIL[ctx.world] || STIL.detektiv, w = 2.9, h = 1.8, yc = 1.85, g = new T.Group();
    const face = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map: tex, roughness: .9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: ctx.world === "sterne" ? .55 : .22}));
    face.position.set(0, yc, .045); g.add(face);
    const fm = ctx.mat(s.rahmen), b = .08;
    for (const [fw, fh, fx, fy] of [[w + 2 * b, b, 0, h / 2 + b / 2], [w + 2 * b, b, 0, -h / 2 - b / 2], [b, h, -w / 2 - b / 2, 0], [b, h, w / 2 + b / 2, 0]]) { const fr = ctx.box(fw, fh, .09, fm); fr.position.set(fx, yc + fy, .03); g.add(fr); }
    const back = ctx.box(w, h, .03, ctx.mat(s.fuss)); back.position.set(0, yc, 0); g.add(back);
    if (ctx.world === "sterne") {
      const edge = ctx.box(w + .2, .025, .06, ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4})); edge.position.set(0, yc - h / 2 - .13, .05); g.add(edge);
      const top = edge.clone(); top.position.y = yc + h / 2 + .13; g.add(top);
      for (const sx of [-1, 1]) { const p = ctx.cyl(.04, .04, yc - h / 2, ctx.mat("steel"), 12); p.position.set(sx * w * .32, (yc - h / 2) / 2, 0); g.add(p);
        const fo = ctx.cyl(.22, .26, .05, ctx.mat("metal"), 20); fo.position.set(sx * w * .32, .025, 0); g.add(fo); }
    } else {
      const fu = ctx.mat(s.fuss);
      for (const sx of [-1, 1]) { const leg = ctx.box(.07, yc + h / 2 + .05, .07, fu); leg.position.set(sx * (w / 2 + .02), (yc + h / 2 + .05) / 2, -.04); g.add(leg);
        const ft = ctx.box(.09, .06, .7, fu); ft.position.set(sx * (w / 2 + .02), .03, 0); g.add(ft); }
      const tray = ctx.box(w * .8, .035, .12, fu); tray.position.set(0, yc - h / 2 - .1, .09); g.add(tray);
      const chalk = ctx.cyl(.012, .012, .1, ctx.mat("color", {color: "#f4f1e8", rough: .9}), 8); chalk.rotation.z = Math.PI / 2; chalk.position.set(-.5, yc - h / 2 - .07, .1); g.add(chalk);
      const sponge = ctx.box(.14, .05, .07, ctx.mat("color", {color: ctx.world === "zauber" ? "#6b3a2a" : "#c9b27a", rough: 1})); sponge.position.set(.6, yc - h / 2 - .06, .1); g.add(sponge);
      if (ctx.world === "zauber") { const k = ctx.sphere(.07, ctx.mat("crystal", {color: "#E8C25A", intensity: 1}), 12); k.position.set(0, yc + h / 2 + .2, 0); g.add(k); }
    }
    return {g, w, d: .8, h: yc + h / 2 + .25, yc};
  }
  // Platzsuche: frei, Stand davor frei, vom Eingang aus sichtbar, verdeckt keine Station/Tür/Exponat
  // wie blocked() im Kern, aber für den Raum, der gerade gebaut wird (cur ist dann noch der alte Raum)
  const RAD = .38;
  const besetzt = (room, x, z) => { const B = room.bounds, m = RAD + .15;
    if (x < B.x0 + m || x > B.x1 - m || z > B.z0 - m || z < B.z1 + m) return true;
    return room.ctx._obst.some(o => o.r != null ? (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + RAD) ** 2 : Math.abs(x - o.x) < o.w / 2 + RAD && Math.abs(z - o.z) < o.d / 2 + RAD); };
  // Platzsuche: Tafel frei, Standplatz davor frei, vom Eingang aus sichtbar (Sichtstrahlen auf die Tafelfläche nicht durch Möbel oder Exponate),
  // nicht zu weit weg, möglichst in Blickrichtung, und sie verdeckt keine Station, Tür und kein Exponat
  function platz(room, w, d, wunsch){
    const ctx = room.ctx, B = room.bounds, ein = {x: 0, z: B.z0 - 2.2}, eye = new T3.Vector3(0, 1.62, B.z0 - 2.2);
    const ziele = ctx._inter.map(o => { const p = new T3.Vector3(); o.getWorldPosition(p); return p; });
    ctx.group.updateMatrixWorld(true); const phys = [], bb = new T3.Box3();
    for (const o of ctx.group.children.slice(ctx._shellEnd || 0)) {
      if (o.isLight || o.isSprite || o.isPoints || o.isLine || o.userData.noOcc) continue;
      bb.setFromObject(o); if (bb.isEmpty() || bb.min.y > 2.6 || bb.max.y < .9 || bb.containsPoint(eye)) continue;
      const sz = bb.getSize(new T3.Vector3()); if (sz.x > 8 || sz.z > 12) continue;   // raumgroße Hüllen (Lichtvorhänge, Glas, Partikel) sind kein Sichthindernis
      phys.push(bb.clone()); }
    const ray = new T3.Ray(), hit = new T3.Vector3();
    const sichtbar = q => { const dir = q.clone().sub(eye), L = dir.length(); ray.set(eye, dir.normalize());
      return !phys.some(b => ray.intersectBox(b, hit) && hit.distanceTo(eye) < L - .05); };
    const kreuzt = (ax, az, bx, bz, box) => { // Strecke a–b schneidet Rechteck (2D)?
      let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
      for (const [p, q] of [[-dx, ax - box.x0], [dx, box.x1 - ax], [-dz, az - box.z0], [dz, box.z1 - az]]) {
        if (Math.abs(p) < 1e-9) { if (q < 0) return false; } else { const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } } }
      return t0 <= t1; };
    let best = null;
    const rys = [0, .3, -.3, .6, -.6, .9, -.9, Math.PI / 2, -Math.PI / 2];
    for (let x = B.x0 + 1.4; x <= B.x1 - 1.4 + 1e-9; x += .25) for (let z = B.z1 + 1.2; z <= B.z0 - 2.5 + 1e-9; z += .25) for (const ry of rys) {
      const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), hx = (w * c + d * s) / 2, hz = (w * s + d * c) / 2;
      const box = {x0: x - hx, x1: x + hx, y0: 0, y1: 3.1, z0: z - hz, z1: z + hz};
      if (!ctx.frei(box, .15)) continue;
      const fx = Math.sin(ry), fz = Math.cos(ry), sx = x + fx * 2.4, sz = z + fz * 2.4;
      if (besetzt(room, sx, sz) || besetzt(room, x + fx * 1.4, z + fz * 1.4)) continue;
      const vx = ein.x - x, vz = ein.z - z, dist = Math.hypot(vx, vz), zu = (vx * fx + vz * fz) / dist;
      if (zu < .55 || dist > 15) continue;
      const blick = Math.abs(Math.atan2(x - ein.x, ein.z - z)) * 180 / Math.PI;   // Winkel zur Blickrichtung beim Betreten
      let sc = zu * 5 - Math.max(0, Math.abs(dist - 8.5) - 1.5) * .6 - Math.max(0, blick - 22) * .3;
      if (wunsch) sc -= Math.hypot(x - wunsch.x, z - wunsch.z) * 3;
      const bx = {x0: box.x0, x1: box.x1, z0: box.z0, z1: box.z1};
      for (const p of ziele) if (Math.hypot(p.x - ein.x, p.z - ein.z) > dist && kreuzt(ein.x, ein.z, p.x, p.z, bx)) sc -= 12;
      if (best && sc + 6 <= best.sc) continue;
      // Sichtbarkeit: fünf Punkte der Tafelfläche (Ecken und Mitte)
      const px = Math.cos(ry), pz = -Math.sin(ry); let vis = 0;
      for (const [u, y] of [[0, 1.85], [-1.15, 1.2], [1.15, 1.2], [-1.15, 2.5], [1.15, 2.5]]) if (sichtbar(new T3.Vector3(x + px * u + fx * .1, y, z + pz * u + fz * .1))) vis++;
      sc += vis * 1.2 - (vis < 4 ? 9 : 0);   // gut sichtbare Plätze (ab 4 von 5 Punkten) klar bevorzugen
      if (!best || sc > best.sc) best = {x, z, ry, box, sc, vis};
    }
    return best;
  }
  function aufstellen(room, kopf, titel, zeilen, fuss, ia, wunsch){
    const ctx = room.ctx, tf = tafel(ctx, tafelTex(ctx, kopf, titel, zeilen, fuss)), p = platz(room, tf.w + .3, tf.d, wunsch);
    if (!p) { console.warn("Lehrkraft: kein Platz für die Tafel in", room.key); return null; }
    room.lehrkraftPlatz = {x: +p.x.toFixed(2), z: +p.z.toFixed(2), ry: +p.ry.toFixed(2), sc: +p.sc.toFixed(2), sicht: p.vis};
    ctx.add(tf.g, p.x, 0, p.z); tf.g.rotation.y = p.ry; ctx.belege(p.box);
    const c = Math.abs(Math.cos(p.ry)), s = Math.abs(Math.sin(p.ry));
    ctx.obstacleBox(p.x, p.z, (tf.w + .3) * c + .5 * s, (tf.w + .3) * s + .5 * c);
    ctx.exhibit(tf.g, Object.assign({dist: 2.4, pitch: -.03, stand: {x: p.x + Math.sin(p.ry) * 2.4, z: p.z + Math.cos(p.ry) * 2.4}}, ia));
    tf.g.userData.lehrkraft = true; return tf.g;
  }
  R3D.hooks.afterBuild.push(room => {
    try {
      if (room.isHall) {
        aufstellen(room, "Lehrkraft", "Schulaufgaben-Werkstatt", ["Aufgaben aus allen 8 Räumen wählen", "Anforderungsbereiche I · II · III", "Angabe, Erwartungshorizont, Notenschlüssel"],
          "Anklicken zum Erstellen", {label: "Schulaufgaben-Werkstatt", sub: "Schulaufgabe erstellen", onClick: () => LK.generator && LK.generator.oeffnen()}, {x: 3.4, z: 8.4});
        return;
      }
      const E = ((D.hefte[room.key] || {}).eintraege || []); if (!E.length) return;
      aufstellen(room, `Tafel · ${(D.raeume[room.key] || {}).kap || ""}`, "Hefteinträge", E.map(e => LK.plain(e.titel)), "Anklicken: Vortrag starten oder drucken",
        {label: "Tafel", sub: `${E.length} Hefteinträge`, onClick: () => LK.vortrag.raum(room.key)});
    } catch (e) { console.error("Lehrkraft-Tafel", e); }
  });
  // Kopfzeile: Knopf „Lehrkraft“ mit Menü
  const btns = A.root.querySelector(".r3d-btns");
  if (btns) {
    const b = document.createElement("button"); b.className = "r3d-btn"; b.id = "r3dlk"; b.textContent = "🎓 Lehrkraft"; btns.insertBefore(b, btns.firstChild);
    const m = document.createElement("div"); m.className = "lt-menue"; m.hidden = true; A.root.appendChild(m);
    b.onclick = ev => { ev.stopPropagation(); const c = A.cur(), raum = c && !c.isHall ? c.key : null;
      m.innerHTML = `${raum ? `<button data-a="raum">📋 Hefteinträge: ${esc(LK.raumName(raum))}</button>` : ""}<button data-a="alle">📚 Alle 32 Hefteinträge</button><button data-a="gen">📝 Schulaufgabe erstellen</button>`;
      const r = b.getBoundingClientRect(); m.style.top = r.bottom + 6 + "px"; m.style.right = Math.max(8, innerWidth - r.right) + "px"; m.hidden = !m.hidden;
      m.querySelectorAll("button").forEach(x => x.onclick = () => { m.hidden = true; if (x.dataset.a === "raum") LK.vortrag.raum(raum); else if (x.dataset.a === "alle") LK.vortrag.uebersicht(); else LK.generator && LK.generator.oeffnen(); }); };
    document.addEventListener("click", ev => { if (!m.hidden && !ev.target.closest(".lt-menue,#r3dlk")) m.hidden = true; });
  }
  // Tests
  R3D.debug.lehrkraftPlatz = () => { const c = A.cur(); return c && c.lehrkraftPlatz; };
  R3D.debug.lehrkraft = () => { const c = A.cur(); return c ? c.ctx._inter.map((o, i) => [i, o.userData.lehrkraft ? "lehrkraft" : "", o.userData.ia.label || o.userData.ia.title]).filter(x => x[1]) : []; };
}

/* ---------- 2D ---------- */
if (typeof VIEWS !== "undefined" && typeof go === "function") {
  const lkKarte = () => {
    const s = document.createElement("section"); s.className = "card stack lt-2dkarte"; s.style.gap = "10px";
    s.innerHTML = `<div><div class="eyebrow">🎓 Lehrkraft</div><h2>Unterricht und Schulaufgaben</h2><p class="note" style="margin:4px 0 0">32 Hefteinträge zum Vortragen (Tafelbild Schritt für Schritt) und der Schulaufgaben-Generator nach den drei Anforderungsbereichen.</p></div>
      <div class="lt-2dkn"><button class="btn" data-a="alle">📚 Hefteinträge</button><button class="btn" data-a="gen">📝 Schulaufgabe erstellen</button></div>`;
    s.querySelector('[data-a="alle"]').onclick = () => LK.vortrag.uebersicht();
    s.querySelector('[data-a="gen"]').onclick = () => LK.generator && LK.generator.oeffnen();
    return s; };
  const homeL = VIEWS.home;
  VIEWS.home = (...a) => { homeL(...a); const st = document.querySelector("#app .stack, main .stack, .stack"); if (st && !st.querySelector(".lt-2dkarte")) st.insertBefore(lkKarte(), st.children[1] || null); };
  const topicL = VIEWS.topic;
  VIEWS.topic = t => { topicL(t); const id = t || (typeof S !== "undefined" && S.sel && S.sel[0]); const E = ((D.hefte[id] || {}).eintraege || []); if (!E.length) return;
    const st = document.querySelector(".stack"); if (!st) return;
    const s = document.createElement("section"); s.className = "card stack lt-2dkarte"; s.style.gap = "8px";
    s.innerHTML = `<div><div class="eyebrow">🎓 Tafel · ${esc((D.raeume[id] || {}).kap || "")}</div><h2>Hefteinträge</h2></div>
      <div class="lt-2dliste">${E.map(e => `<button class="btn ghost" data-nr="${e.nr}"><b>${e.nr}</b> ${LK.fmt(e.titel)} <small>${e.dauer || ""} min</small></button>`).join("")}</div>`;
    s.querySelectorAll("[data-nr]").forEach(b => b.onclick = () => LK.vortrag.raum(id, +b.dataset.nr));
    st.insertBefore(s, st.children[1] || null); };
  // Die Startseite wurde schon gezeichnet, bevor dieses Modul geladen war
  setTimeout(() => { const on3d = window.R3D && R3D.api && !R3D.api.root.hidden; if (!on3d && document.querySelector(".stack") && !document.querySelector(".lt-2dkarte") && document.querySelector(".tprog, .wmap, .doors")) go("home"); }, 0);
}

const css = document.createElement("style");
css.textContent = `
.lt-menue{position:fixed;z-index:30;display:flex;flex-direction:column;min-width:240px;background:#fff;color:#222;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.4);overflow:hidden;pointer-events:auto}
.lt-menue[hidden]{display:none}.lt-menue button{font:500 15px system-ui,sans-serif;text-align:left;padding:11px 16px;border:0;background:none;cursor:pointer}.lt-menue button:hover{background:#eef2ff}
.lt-2dkn{display:flex;gap:8px;flex-wrap:wrap}.lt-2dliste{display:flex;flex-direction:column;gap:6px}.lt-2dliste .btn{display:flex;align-items:baseline;justify-content:flex-start;text-align:left;gap:8px}.lt-2dliste small{margin-left:auto;opacity:.7}
`;
document.head.appendChild(css);
})();
