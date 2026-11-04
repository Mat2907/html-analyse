/* ---------- 20_optik2.js ---------- */
/* =====================================================================
   Raum · Linsen und das Auge (Kap. 2.3–2.4)
   Mittelstück: optische Bank (Kerze, Sammellinse f = 0,5 m – im Raum nicht angeschrieben, das Labor fragt danach –, Schirm) mit Parallel-, Mittelpunkt- und Brennpunktstrahl –
                Klick schiebt die Kerze durch g > 2f, g = 2f, f < g < 2f, g < f (reelles Bild auf dem Schirm bzw. virtuelles Bild)
   A: aufgeschnittenes Riesenauge mit Akkommodation · B: Kurz- und Weitsichtigkeit mit Brillengläsern
   C: Lupe über einem Schriftstück (g < f aufrecht, g > f umgekehrt) · D: Kamera mit Mattscheibe (Lochkamera → Objektiv → Scharfstellen)
   Über dem Gang: Brennglas, das Licht im Brennpunkt bündelt · Vitrine (rechts): Sammel- und Zerstreuungslinse
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
const PI = Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = (v, t, dt, k) => { const n = v + (t - v) * Math.min(1, dt * k); return Math.abs(n - t) < 1e-4 ? t : n; };

/* ---------- Geometrie-Bausteine ---------- */
// Linse als Drehkörper: Radius R, Dicke t0 in der Mitte, t1 am Rand (t0 < t1: Zerstreuungslinse). Achse = x (o.axis "y": Achse = y), o.half: nur z ≤ 0
function lensGeo(T, R, t0, t1, o = {}){
  const th = r => t1 + (t0 - t1) * (1 - (r / R) ** 2), pts = [], n = 10;
  for (let i = 0; i <= n; i++) { const r = R * i / n; pts.push(new T.Vector2(r, -th(r) / 2)); }
  for (let i = n; i >= 0; i--) { const r = R * i / n; pts.push(new T.Vector2(r, th(r) / 2)); }
  const g = o.half ? new T.LatheGeometry(pts, 20, PI / 2, PI) : new T.LatheGeometry(pts, o.seg || 36);
  return o.axis === "y" ? g : g.rotateZ(-PI / 2);
}
// Schnittfläche einer Linse in der x-y-Ebene (Achse = x)
function lensFace(T, R, t0, t1){
  const th = r => t1 + (t0 - t1) * (1 - (r / R) ** 2), s = new T.Shape(), n = 12;
  for (let i = 0; i <= n; i++) { const y = -R + 2 * R * i / n; if (i) s.lineTo(th(y) / 2, y); else s.moveTo(th(y) / 2, y); }
  for (let i = n; i >= 0; i--) { const y = -R + 2 * R * i / n; s.lineTo(-th(y) / 2, y); }
  return new T.ShapeGeometry(s);
}
// Halbe Kugelschale (z ≤ 0), vorne (−x) offen mit dem Öffnungswinkel open
function bowl(T, R, open, seg = 40){ return new T.SphereGeometry(R, seg, Math.round(seg * .55), PI, PI, open, PI - open).rotateZ(PI / 2); }

// Mehrere (indizierte) Geometrien gleichen Materials zu einer zusammenfassen – spart Meshes und Zeichenaufrufe
function mergeGeos(T, geos){
  let n = 0; const pos = [], nor = [], uv = [], idx = [];
  for (const g of geos) { const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0); }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(n + g.index.getX(i)); else for (let i = 0; i < P.count; i++) idx.push(n + i);
    n += P.count; g.dispose(); }
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}

/* ---------- Strahlenbündel: viele Lichtstrahlen in einem Mesh (Kern + Lichthof), optional gestrichelt ---------- */
let UNIT = null;
function rays(ctx, parent, color, width, o = {}){
  const T = ctx.T; UNIT = UNIT || new T.CylinderGeometry(1, 1, 1, 7, 1, true);
  const mk = op => new T.MeshBasicMaterial(Object.assign({color, transparent: true, opacity: op, depthWrite: false, toneMapped: false},
    o.normal ? {} : {blending: T.AdditiveBlending}, o.dash ? {map: o.dash} : {}));
  const mc = new T.Mesh(new T.BufferGeometry(), mk(o.normal ? .85 : .95)), mh = o.normal || o.halo === false ? null : new T.Mesh(new T.BufferGeometry(), mk(.2));
  mc.renderOrder = 3; parent.add(mc); if (mh) { mh.renderOrder = 3; parent.add(mh); }
  const up = new T.Vector3(0, 1, 0), q = new T.Quaternion(), M = new T.Matrix4(), s = new T.Vector3(), d = new T.Vector3(), mid = new T.Vector3(), v = new T.Vector3();
  const P = UNIT.attributes.position, UV = UNIT.attributes.uv, I = UNIT.index, DL = o.dashLen || .05;
  function build(lines, r){
    const pos = [], uv = [], idx = []; let base = 0;
    for (const pts of lines) for (let i = 0; i < pts.length - 1; i++) {
      d.subVectors(pts[i + 1], pts[i]); const L = d.length(); if (L < 1e-4) continue; d.divideScalar(L);
      q.setFromUnitVectors(up, d); mid.copy(pts[i]).addScaledVector(d, L / 2); M.compose(mid, q, s.set(r, L, r));
      for (let k = 0; k < P.count; k++) { v.fromBufferAttribute(P, k).applyMatrix4(M); pos.push(v.x, v.y, v.z); uv.push(UV.getX(k), UV.getY(k) * L / DL); }
      for (let k = 0; k < I.count; k++) idx.push(base + I.getX(k)); base += P.count;
    }
    if (!pos.length) { pos.push(0, 0, 0, 0, .001, 0, .001, 0, 0); uv.push(0, 0, 0, 1, 1, 0); idx.push(0, 1, 2); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  }
  let has = false, k = 1;
  const vis = () => { mc.visible = has && k > .01; if (mh) mh.visible = mc.visible; };
  const ctl = {core: mc,
    set(lines){ lines = (lines || []).filter(Boolean).map(l => l.map(p => p.isVector3 ? p : new T.Vector3(...p)));
      mc.geometry.dispose(); mc.geometry = build(lines, width); if (mh) { mh.geometry.dispose(); mh.geometry = build(lines, width * 3.2); }
      has = lines.length > 0; vis(); },
    fade(x){ k = x; mc.material.opacity = (o.normal ? .85 : .95) * x; if (mh) mh.material.opacity = .2 * x; vis(); }};
  ctl.set(o.lines || []); return ctl;
}

R3D.rooms.optik2 = ctx => {
  const T = ctx.T, S = ctx.slots, W = ctx.world, pal = ctx.pal, H = ctx.height || 7;
  const ZB = W === "zauber", ST = W === "sterne", DT = W === "detektiv";
  const BODY = (ctx.kit && ctx.kit.fontBody) || "Georgia, serif", HEAD = (ctx.kit && ctx.kit.font) || BODY;
  const V = (x, y, z = 0) => new T.Vector3(x, y, z);
  const FLAME = ST ? [159, 232, 255] : [255, 176, 72], flameHex = ST ? "#9FE8FF" : "#FFB048";
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const RC = {par: "#FF6A4D", mid: "#FFE14D", foc: "#4CC9FF"};
  const noCast = (...os) => os.forEach(o => o.traverse(n => { n.castShadow = false; }));
  const txt = (s, size, color = pal.light, o = {}) => ctx.text(s, Object.assign({size, color, font: BODY}, o));
  const rod = (a, b, r, mat, seg = 8) => { const d = b.clone().sub(a), L = d.length(), m = ctx.mesh(new T.CylinderGeometry(r, r, L, seg), mat, false);
    m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; };
  const rodGeo = (a, b, r, seg = 8) => { const d = b.clone().sub(a), L = d.length(), g = new T.CylinderGeometry(r, r, L, seg), m = a.clone().addScaledVector(d, .5);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())); return g.translate(m.x, m.y, m.z); };
  const legs = (pts, h, mat, round, r = .04) => ctx.mesh(mergeGeos(T, pts.map(([x, z]) => (round ? new T.CylinderGeometry(r * .8, r, h, 10) : new T.BoxGeometry(r * 2, h, r * 2)).translate(x, h / 2, z))), mat);
  const cv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const ctex = c => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
  const dash = (() => { const [c, g] = cv(4, 32); g.fillStyle = "#000"; g.fillRect(0, 0, 4, 32); g.fillStyle = "#fff"; g.fillRect(0, 0, 4, 17);
    const t = ctex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; })();
  // Feste Kleinteile gleichen Materials zu einem Mesh des Elternobjekts zusammenbacken (Lage, Drehung und Maßstab bleiben erhalten)
  const bake = (parent, ms, mat, cast = true) => {
    parent.updateWorldMatrix(true, true); const inv = parent.matrixWorld.clone().invert();
    const geos = ms.map(m => { m.updateWorldMatrix(true, false); const M = m.parent ? inv.clone().multiply(m.matrixWorld) : (m.updateMatrix(), m.matrix);
      const g = m.geometry.clone().applyMatrix4(M); m.geometry.dispose(); if (m.parent) m.parent.remove(m); return g; });
    const out = ctx.mesh(mergeGeos(T, geos), mat, cast); parent.add(out); return out; };
  const bakeBy = (parent, ms, cast = true) => { const by = new Map(); for (const m of ms.filter(Boolean)) { if (!by.has(m.material)) by.set(m.material, []); by.get(m.material).push(m); }
    const out = new Map(); for (const [mat, list] of by) out.set(mat, list.length > 1 ? bake(parent, list, mat, cast) : list[0]); return out; };
  // Kameraposition im Koordinatensystem eines Objekts (für Schilder, die sich zum Betrachter drehen)
  const camL = V(0, 0, 0), camIn = o => { const c = R3D.camera; return c ? o.worldToLocal(camL.copy(c.position)) : null; };

  /* ---------- Weltmaterialien ---------- */
  const mWood = ctx.mat(ST ? "metal" : DT ? "darkwood" : "wood"), mDark = ctx.mat(ST ? "metal" : "darkwood"), mTrim = ctx.mat(ST ? "steel" : "brass");
  const mBase = ctx.mat(ZB ? "stone" : ST ? "metal" : "darkwood"), mGlass = ctx.mat("glass", {color: "#cdeaff", opacity: .38});
  const mPanel = ctx.mat("color", {color: ZB ? "#191424" : ST ? "#0b1524" : "#16201b", rough: .9});
  const mScreen = ctx.mat("color", {color: ST ? "#e2ecf5" : "#f3eee2", rough: .92});
  const mEdge = ST ? ctx.mat("glow", {color: pal.cool, intensity: 1.3}) : ctx.mat("gold");
  const mWax = ctx.mat("color", {color: ST ? "#e6eef7" : "#f2e7cf", rough: .55});
  const mFlame = ctx.mat("glow", {color: flameHex, intensity: 3});

  // Rahmentafel mit Titel (Hintergrund für Augenmodelle)
  function backdrop(parent, w, h, x, y, z, title){
    const p = ctx.box(w, h, .05, mPanel); p.position.set(x, y, z);
    const f = ctx.box(w + .1, h + .1, .03, ST ? ctx.mat("metal") : mTrim); f.position.set(x, y, z - .03);
    const lineM = ST ? ctx.mat("glow", {color: pal.cool, intensity: 1.1}) : mTrim;
    const l1 = ctx.box(w - .3, .012, .01, lineM); l1.position.set(x, y + h / 2 - .3, z + .03);
    const t = txt(title, .115, pal.accent, {font: HEAD}); t.position.set(x, y + h / 2 - .16, z + .035);
    parent.add(p, f, l1, t); noCast(p, f, l1); bakeBy(parent, [p, f, l1], false);
  }

  /* ===================================================================
     Mittelstück: optische Bank
     =================================================================== */
  const PHI = 1.0, AX = 1.42, FB = .5, GK = .2, LR = .42, RT = .87, TT = .8;   // Achsenhöhe, Brennweite, Kerzenhöhe (G), Linsenradius, Schienen- und Tischoberkante
  const CASES = [
    {g: 1.5, title: "g > 2f: verkleinert", lines: ["f = ? · g = 1,5 m · b = 0,75 m", "B : G = b : g = 0,5", "Bild: reell, umgekehrt, verkleinert"]},
    {g: 1.0, title: "g = 2f: gleich groß", lines: ["f = ? · g = b = 2f", "B : G = b : g = 1", "Bild: reell, umgekehrt, gleich groß"]},
    {g: .75, title: "f < g < 2f: vergrößert", lines: ["f = ? · g = 0,75 m · b = 1,5 m", "B : G = b : g = 2", "Bild: reell, umgekehrt, vergrößert"]},
    {g: .25, title: "g < f: Lupe", lines: ["f = ? · g = 0,25 m", "Kein Bild auf dem Schirm", "Virtuell, aufrecht, 2-fach vergrößert"]}];
  const TEXTS = [
    "**g > 2f:** Die Kerze steht weiter als die doppelte Brennweite von der Linse entfernt (g = 1,5 m). Auf dem Schirm entsteht bei b = 0,75 m ein **reelles, umgekehrtes, verkleinertes** Bild.\n\nAbbildungsmaßstab: **B : G = b : g** = 0,75 m : 1,5 m = 0,5. So arbeitet ein Fotoapparat.",
    "**g = 2f:** Steht die Kerze genau in der doppelten Brennweite, entsteht ihr Bild ebenfalls bei b = 2f. Es ist **gleich groß** (B : G = 1), reell und umgekehrt. Wie groß f bei dieser Linse ist, findest du im **Labor** selbst heraus.\n\nParallelstrahl (rot), Mittelpunktstrahl (gelb) und Brennpunktstrahl (blau) treffen sich im Bildpunkt der Flammenspitze.",
    "**f < g < 2f:** Bei g = 0,75 m rückt das Bild weit nach hinten: b = 1,5 m. Es ist **vergrößert** (B : G = 1,5 m : 0,75 m = 2), reell und umgekehrt – so arbeitet ein Beamer.\n\nJe näher die Kerze an den Brennpunkt rückt, desto größer und weiter entfernt ist das Bild.",
    "**g < f:** Die Kerze steht innerhalb der Brennweite (g = 0,25 m). Hinter der Linse laufen die Strahlen **auseinander** – auf dem Schirm entsteht kein Bild, nur ein schwacher Lichtschein.\n\nVerlängert man alle drei Strahlen rückwärts (gestrichelt), treffen sie sich auf der Kerzenseite: Dort siehst du durch die Linse ein **virtuelles, aufrechtes, vergrößertes** Bild, hier doppelt so groß – die Linse wirkt als **Lupe**. Der Brennpunktstrahl (blau) verläuft hier so, als käme er vom Brennpunkt F auf der Kerzenseite."];
  const bank = new T.Group(); ctx.add(bank, S.center.x, 0, S.center.z); bank.rotation.y = PHI;
  const flat = [];   // flache Schilder an der Bank [Mesh, z]: klappen zur Seite des Betrachters (Mittelstück ist von beiden Seiten zugänglich)
  {
    const rail = ctx.box(3.6, .07, .16, mDark); rail.position.y = RT - .035;
    const ridge = ctx.box(3.6, .015, .05, mTrim); ridge.position.y = RT + .004;
    // Tisch unter der Schiene
    const tt = ctx.box(3.8, .05, .62, ST ? ctx.mat("metal") : mWood); tt.position.y = TT - .025;
    const parts = [rail, ridge, tt]; bank.add(rail, ridge, tt);
    if (ST) { const e = ctx.box(3.82, .02, .64, mEdge); e.position.y = TT - .06; e.castShadow = false; parts.push(e);
      for (const x of [-1.45, 1.45]) { const col = ctx.box(.3, TT - .07, .36, mDark); col.position.set(x, (TT - .07) / 2, 0); const ft = ctx.box(.5, .05, .56, mTrim); ft.position.set(x, .025, 0);
        const gl = ctx.box(.31, .03, .37, mEdge); gl.position.set(x, .45, 0); parts.push(col, ft, gl); } }
    else { const ap = ctx.box(3.6, .12, .5, mDark); ap.position.y = TT - .11;
      const sh = ctx.box(3.4, .03, .4, mWood); sh.position.y = .2;
      parts.push(ap, sh, legs([[-1.75, -.24], [1.75, -.24], [-1.75, .24], [1.75, .24]], TT - .1, DT ? mDark : mWood, DT, .045)); }
    bank.add(...parts); bakeBy(bank, parts);
    // Messleiste: Striche alle 10 cm, lange Striche alle 50 cm (symmetrisch, daher auch umgeklappt richtig)
    const [sc, sg] = cv(1024, 32); sg.fillStyle = ST ? "#0e1a2a" : "#efe3c2"; sg.fillRect(0, 0, 1024, 32); sg.fillStyle = ST ? "#9be7ff" : "#3a2414";
    for (let i = 0; i <= 36; i++) { const x = 4 + i * (1016 / 36), big = i % 5 === 3; sg.fillRect(x - (big ? 1.5 : .8), 0, big ? 3 : 1.6, big ? 32 : 16); }
    const scale = new T.Mesh(new T.PlaneGeometry(3.6, .05), new T.MeshStandardMaterial({map: ctex(sc), roughness: .7})); scale.position.set(0, RT - .035, .081); bank.add(scale); flat.push([scale, .081]);
  }
  const rider = g => { const b = ctx.box(.13, .05, .24, mTrim); b.position.y = RT + .025; g.add(b); return b; };   // Reiter auf der Schiene
  // Kerze (Gegenstand G: vom Teller bis zur Flammenspitze 0,2 m)
  const cand = new T.Group(); bank.add(cand);
  const flameHalo = ctx.glow(flameHex, .5), flameCore = ctx.glow(0xffffff, .12);
  {
    const post = ctx.cyl(.016, .022, AX - RT - .07, mTrim, 12); post.position.y = RT + .05 + (AX - RT - .07) / 2;
    const plate = ctx.cyl(.075, .05, .02, mTrim, 20); plate.position.y = AX - .01;
    const body = ctx.cyl(.04, .04, .14, mWax, 22); body.position.y = AX + .07;
    const flame = ctx.sphere(.021, mFlame, 12); flame.scale.set(1, 2, 1); flame.position.y = AX + .158;
    flameHalo.position.y = AX + .162; flameCore.position.y = AX + .158;
    cand.add(post, plate, body, flame, flameHalo, flameCore); noCast(flame);
    bakeBy(cand, [rider(cand), post, plate]);
  }
  // Sammellinse
  const lensC = new T.Group(); bank.add(lensC);
  {
    const lens = ctx.mesh(lensGeo(T, LR, .085, .012), mGlass, false); lens.position.y = AX;
    const ring = ctx.mesh(new T.TorusGeometry(LR + .012, .016, 8, 64).rotateY(PI / 2), mTrim, false); ring.position.y = AX;
    const fork = ctx.box(.04, .1, .04, mTrim); fork.position.y = RT + .1;
    lensC.add(lens, ring, fork); bakeBy(lensC, [rider(lensC), ring, fork]);
  }
  // Schirm mit Bild (beidseitig, Mattscheibe)
  const scr = new T.Group(); bank.add(scr);
  const SH = .74, SW = .64, SY = 1.37, mScrB = ctx.mat("color", {color: ST ? "#7f8c98" : "#8e887d", rough: .95});
  const [cc, cg] = cv(256, 512), [gc, gg] = cv(256, 512);
  function drawCandle(g, ghost){
    const cx = 128, top = 181, tip = 40; g.clearRect(0, 0, 256, 512);
    const r = g.createRadialGradient(cx, 105, 4, cx, 105, 125); r.addColorStop(0, rgba(FLAME, ghost ? .3 : .55)); r.addColorStop(1, rgba(FLAME, 0)); g.fillStyle = r; g.fillRect(0, 0, 256, 250);
    const lg = g.createLinearGradient(cx - 94, 0, cx + 94, 0); const wax = ST ? ["#7d8da0", "#d8e4f0", "#7d8da0"] : ["#a08560", "#f6e6c4", "#a08560"];
    lg.addColorStop(0, wax[0]); lg.addColorStop(.45, wax[1]); lg.addColorStop(1, wax[2]); g.fillStyle = lg; g.globalAlpha = ghost ? .5 : 1;
    g.beginPath(); g.roundRect(cx - 94, top, 188, 512 - top, 14); g.fill(); g.globalAlpha = 1;
    const tg = g.createLinearGradient(0, top, 0, top + 130); tg.addColorStop(0, rgba(FLAME, .6)); tg.addColorStop(1, rgba(FLAME, 0)); g.fillStyle = tg; g.fillRect(cx - 94, top, 188, 130);
    g.strokeStyle = "#2a1a10"; g.lineWidth = 7; g.beginPath(); g.moveTo(cx, top + 4); g.lineTo(cx, top - 24); g.stroke();
    const fr = g.createRadialGradient(cx, top - 45, 2, cx, top - 60, 95); fr.addColorStop(0, "#ffffff"); fr.addColorStop(.35, ST ? "#d4f6ff" : "#fff1b0");
    fr.addColorStop(.75, flameHex); fr.addColorStop(1, rgba(FLAME, 0)); g.fillStyle = fr;
    const fl = () => { g.beginPath(); g.moveTo(cx, tip); g.bezierCurveTo(cx + 52, top - 75, cx + 42, top - 6, cx, top - 4); g.bezierCurveTo(cx - 42, top - 6, cx - 52, top - 75, cx, tip); };
    fl(); g.fill();
    if (ghost) { const out = () => { fl(); g.stroke(); g.beginPath(); g.rect(cx - 94, top, 188, 512 - top - 6); g.stroke(); };
      g.setLineDash([]); g.strokeStyle = "rgba(20,14,30,.55)"; g.lineWidth = 13; out(); g.setLineDash([18, 12]); g.strokeStyle = "#FFE14D"; g.lineWidth = 7; out(); g.setLineDash([]); }
  }
  drawCandle(cg, false); drawCandle(gg, true);
  const imgMat = new T.MeshBasicMaterial({map: ctex(cc), transparent: true, depthWrite: false, toneMapped: false});
  const imgs = [];
  {
    const post = ctx.box(.05, SY - SH / 2 - RT - .04, .05, mTrim); post.position.y = (SY - SH / 2 + RT + .04) / 2;
    const frame = ctx.box(.035, SH + .05, SW + .05, mDark); frame.position.y = SY;
    scr.add(post, frame); const sp = [rider(scr), post];
    for (const s of [-1, 1]) {
      const p = new T.Mesh(new T.PlaneGeometry(SW, SH), mScrB); p.position.set(s * .0185, SY, 0); p.rotation.y = s * PI / 2; scr.add(p); sp.push(p);
      const piv = new T.Group(); piv.position.set(s * .021, AX, 0); piv.rotation.y = s * PI / 2; scr.add(piv);
      const m = new T.Mesh(new T.PlaneGeometry(1, 1), imgMat); m.rotation.z = PI; m.renderOrder = 2; piv.add(m); imgs.push(m);
    }
    bakeBy(scr, sp);
  }
  // Lichtfleck auf dem Schirm (unscharfes Bild) und Lichtkegel vor und hinter der Linse
  // Lichtkegel mit Deckkraft je Ring (Vertex-Alpha): Hinter der Linse wird er mit wachsendem Querschnitt schwächer
  const coneMat = new T.MeshBasicMaterial({color: flameHex, transparent: true, opacity: .07, vertexColors: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false});
  const coneIn = new T.Mesh(new T.BufferGeometry(), coneMat), coneOut = new T.Mesh(new T.BufferGeometry(), coneMat.clone());
  const spot = new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshBasicMaterial({map: R3D.util.glowTex(), color: flameHex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false}));
  spot.rotation.y = -PI / 2; coneIn.renderOrder = coneOut.renderOrder = spot.renderOrder = 2; bank.add(coneIn, coneOut, spot);
  function frustum(mesh, rings){   // rings: [x, y, r, alpha]
    const n = 28, pos = [], col = [], idx = [];
    for (const [x, y, r, a] of rings) for (let i = 0; i <= n; i++) { const t = i / n * PI * 2; pos.push(x, y + Math.cos(t) * r, Math.sin(t) * r); col.push(1, 1, 1, a); }
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) { const a = k * (n + 1) + i, b = a + n + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    mesh.geometry.dispose(); const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new T.Float32BufferAttribute(col, 4));
    g.setIndex(idx); mesh.geometry = g;
  }
  // Virtuelles Bild (Geisterkerze) auf der Kerzenseite
  const ghost = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map: ctex(gc), transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, toneMapped: false}));
  const signs = new T.Group(); ctx.add(signs, S.center.x, 0, S.center.z); signs.rotation.y = PHI;   // Tafeln über der Bank: nicht anklickbar (Klicks gehen zur Tür dahinter)
  const ghostTag = txt("virtuelles Bild", .06, pal.light); ghost.renderOrder = 2; ghostTag.renderOrder = 5; bank.add(ghost, ghostTag);
  // Konstruktionsstrahlen (je Farbe ein Bündel), Rückverlängerungen (gestrichelt), optische Achse
  const beams = [RC.par, RC.mid, RC.foc].map(c => rays(ctx, bank, c, .009));
  const back = rays(ctx, bank, "#ffffff", .005, {dash, dashLen: .045});
  rays(ctx, bank, pal.light, .0035, {dash, dashLen: .06, halo: false, lines: [[V(-1.78, AX), V(1.78, AX)]]}).fade(.55);
  {
    const [tc, tg] = cv(1024, 48); tg.textAlign = "center"; tg.textBaseline = "middle"; tg.lineJoin = "round";
    // dunkle Kontur: Die Marken liegen vor der hellen Messleiste und den Messingreitern
    for (const [x, t] of [[-1, "2F"], [-.5, "F"], [0, "Linse"], [.5, "F"], [1, "2F"]]) { tg.font = `700 ${t === "Linse" ? 28 : 36}px ${BODY}`; const px = (x + 1.1) / 2.2 * 1024;
      tg.lineWidth = 9; tg.strokeStyle = "rgba(12,9,6,.88)"; tg.strokeText(t, px, 26); tg.fillStyle = t === "Linse" ? pal.light : pal.accent; tg.fillText(t, px, 26);
      if (x) { const gl = ctx.glow(pal.accent, Math.abs(x) < .9 ? .13 : .09); gl.position.set(x, AX, 0); bank.add(gl); } }
    const strip = new T.Mesh(new T.PlaneGeometry(2.2, .103), new T.MeshBasicMaterial({map: ctex(tc), transparent: true, depthWrite: false, toneMapped: false})); strip.position.set(0, RT + .065, .13); bank.add(strip);
    flat.push([strip, .13]);
  }
  // Maßlinien für g und b, Bildpfeil B und Beschriftung G
  const DY = RT + .19, dims = rays(ctx, bank, pal.light, .0035, {normal: true});
  const gTag = txt("g", .075, pal.light), bTag = txt("b", .075, pal.light), GTag = txt("G", .075, pal.accent), BTag = txt("B", .075, pal.accent);
  bank.add(gTag, bTag, GTag, BTag);
  const bArrow = ctx.arrow(V(0, AX), V(0, AX - .1), pal.accent, .007); bank.add(bArrow); noCast(bArrow);
  // Seite des Betrachters: Beschriftungen stehen immer lesbar zu ihm (SIDE = +1 vorn, −1 hinten)
  let SIDE = 1;
  const setSide = s => { SIDE = s; for (const [m, z0] of flat) { m.position.z = z0 * s; m.rotation.y = s > 0 ? 0 : PI; }
    for (const t of [gTag, bTag, GTag, BTag, ghostTag]) t.rotation.y = s > 0 ? 0 : PI; draw(); };
  // Zustandstafel (eine Tafel, deren Bild je Fall ausgetauscht wird) und Legende darüber; beide drehen sich zum Betrachter
  const BY = 2.65, turn = [];
  const faceOf = o => { let f = null; o.traverse(n => { if (!f && n.isMesh && n.material && n.material.map && !n.material.userData.keep) f = n; }); return f; };
  const stBoard = ctx.board(CASES[0].title, CASES[0].lines, {w: 2.1, h: .95}); stBoard.position.set(0, BY, 0); stBoard.rotation.y = -.45; signs.add(stBoard); noCast(stBoard);
  turn.push([stBoard, -.45]);
  const stFace = faceOf(stBoard); let shownCase = 0;
  const showCase = i => { if (i === shownCase || !stFace) return; shownCase = i;
    const tmp = ctx.board(CASES[i].title, CASES[i].lines, {w: 2.1, h: .95}), f = faceOf(tmp);
    if (f) { const old = stFace.material.map, nt = f.material.map; stFace.material.map = nt; if (stFace.material.emissiveMap) stFace.material.emissiveMap = nt; if (old && old !== nt) old.dispose(); }
    tmp.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material && !n.material.userData.keep) n.material.dispose(); }); };
  {
    const [lc, lg] = cv(1024, 112); lg.fillStyle = "rgba(8,8,14,.78)"; lg.beginPath(); lg.roundRect(2, 2, 1020, 108, 24); lg.fill();
    lg.font = `600 30px ${BODY}`; lg.textBaseline = "middle"; const items = [["Parallelstrahl", RC.par], ["Mittelpunktstrahl", RC.mid], ["Brennpunktstrahl", RC.foc]];
    const ws = items.map(([n]) => lg.measureText(n).width + 64), gap = (1024 - ws.reduce((a, b) => a + b, 0)) / 4; let x = gap;
    items.forEach(([n, c], i) => { lg.strokeStyle = c; lg.lineWidth = 9; lg.lineCap = "round"; lg.beginPath(); lg.moveTo(x, 56); lg.lineTo(x + 46, 56); lg.stroke();
      lg.fillStyle = "#f4f1ea"; lg.fillText(n, x + 60, 58); x += ws[i] + gap; });
    const leg = new T.Mesh(new T.PlaneGeometry(2.1, .23), new T.MeshBasicMaterial({map: ctex(lc), transparent: true, toneMapped: false}));
    leg.position.set(0, BY + .65, 0); leg.rotation.y = -.45; signs.add(leg); turn.push([leg, -.45]);
    // Detektei: Tafel und Legende hängen an zwei Messingstangen (knapp hinter der Tafelebene)
    if (DT) { const c = .95 * Math.cos(.45), s = .95 * Math.sin(.45), bz = -.03 * Math.cos(.45), bx = .03 * Math.sin(.45);
      signs.add(ctx.mesh(mergeGeos(T, [-1, 1].map(k => rodGeo(V(k * c + bx, BY + .475, k * s + bz), V(k * c + bx, H, k * s + bz), .008, 6))), mTrim, false)); }
  }
  // Rechnen und Zeichnen (labG: Gegenstandsweite aus dem Labor, solange es offen ist)
  let cs = 0, gNow = CASES[0].g, xsNow = FB * gNow / (gNow - FB), imgK = 1, ghostK = 0, flashT = 0, labG = null;
  const candLight = ctx.light(flameHex, 1.6, 3.5, 0, AX + .3, S.center.z);
  const bOf = g => g > FB + 1e-3 ? FB * g / (g - FB) : Infinity;
  function draw(){
    const g = gNow, P = V(-g, AX + GK), xe = xsNow - .02, floorY = RT + .04;
    const ext = (a, b, x) => { const k = (x - a.x) / (b.x - a.x); let p = V(x, a.y + (b.y - a.y) * k);
      if (p.y < floorY && b.y !== a.y) { const k2 = (floorY - a.y) / (b.y - a.y); p = V(a.x + (b.x - a.x) * k2, floorY); } return p; };
    const L1 = V(0, AX + GK), O = V(0, AX), zs = SIDE;
    beams[0].set([[P, L1, ext(L1, V(FB, AX), xe)]]);
    beams[1].set([[P, O, ext(P, O, xe)]]);
    // Brennpunktstrahl: g > f durch F vor der Linse; g < f so, als käme er von F (Verlängerung F → Flamme gestrichelt); danach parallel zur Achse
    const yl = Math.abs(g - FB) > .01 ? AX - GK * FB / (g - FB) : null, focOK = yl != null && Math.abs(yl - AX) <= LR - .01;
    beams[2].set(focOK ? [g > FB ? [P, V(-FB, AX), V(0, yl), V(xe, yl)] : [P, V(0, yl), V(xe, yl)]] : []);
    cand.position.x = -g; scr.position.x = xsNow;
    const zd = .16 * zs, tick = x => [V(x, DY - .03, zd), V(x, DY + .03, zd)], bReal = isFinite(bOf(g)) && Math.abs(xsNow - bOf(g)) < .03;
    dims.set([[V(-g, DY, zd), V(0, DY, zd)], tick(-g), tick(0)].concat(bReal ? [[V(0, DY, zd), V(xsNow, DY, zd)], tick(xsNow)] : []));
    gTag.position.set(-g / 2, DY + .055, zd); bTag.position.set(xsNow / 2, DY + .055, zd); bTag.visible = bReal;
    GTag.position.set(-g - .09, AX + GK / 2, .05 * zs);
    if (bReal) { const B = GK * bOf(g) / g; bArrow.set(V(xsNow - .06, AX, 0), V(xsNow - .06, AX - B, 0)); BTag.position.set(xsNow - .14, AX - B / 2, .02 * zs); }
    bArrow.visible = BTag.visible = bReal;
    // Lichtkegel: von der Flamme zur Linse, dann zum Bildpunkt und weiter bis zum Schirm; wird er breiter als die Linse, nimmt die Deckkraft ab (∼ 1/r²)
    frustum(coneIn, [[-g + .01, AX + GK - .03, 0, 1], [0, AX, LR, 1]]);
    const inv = 1 / FB - 1 / g, rAt = x => LR * Math.abs(1 - x * inv), cAt = x => AX - GK * x / g, bI = bOf(g);
    const xs = [...Array(11)].map((_, i) => xe * i / 10); if (isFinite(bI) && bI > .02 && bI < xe - .02) xs.push(bI);
    frustum(coneOut, xs.sort((p, q) => p - q).map(x => { const r = rAt(x); return [x, cAt(x), r, Math.min(1, (LR / Math.max(r, LR)) ** 2)]; }));
    const rs = rAt(xe), cy = cAt(xe);
    if (rs > .012 && rs < .32 && Math.abs(cy - SY) < SH / 2) { spot.visible = true; spot.position.set(xe - .003, cy, 0); spot.scale.setScalar(rs * 1.35); spot.material.opacity = clamp(.035 / rs, .15, .9); }
    else if (g < FB - .01) { spot.visible = true; spot.position.set(xe - .003, SY, 0); spot.scale.setScalar(.3); spot.material.opacity = .12; }   // großer, schwacher Lichtschein
    else spot.visible = false;
    // virtuelles Bild: alle drei Rückverlängerungen treffen sich im Bildpunkt Iv
    const bv = g < FB - .01 ? FB * g / (FB - g) : Infinity;
    if (isFinite(bv) && bv < 1.7) { const Bv = GK * bv / g, hp = Bv * 512 / 472, Iv = V(-bv, AX + Bv); ghost.scale.set(hp / 2, hp, 1); ghost.position.set(-bv, AX + hp / 2, 0);
      ghostTag.position.set(-bv, AX + Bv + .09, .01 * zs);
      back.set([[L1, Iv], [P, Iv]].concat(focOK ? [[V(0, yl), Iv], [V(-FB, AX), P]] : []));
      BTag.visible = true; BTag.position.set(-bv - hp / 4 - .06, AX + Bv / 2, .02 * zs); }
    else back.set([]);
    if (candLight) { bank.updateMatrixWorld(); candLight.position.copy(bank.localToWorld(V(-g, AX + .32, .1))); }
  }
  // Paralleles Lichtbündel beim Klick auf die Linse
  const flash = rays(ctx, bank, ST ? "#c9f6ff" : "#fff0c0", .0055);
  flash.set([-.33, -.22, -.11, .11, .22, .33].map(h => [V(-1.6, AX + h), V(0, AX + h), V(1.1, AX + h * (1 - 1.1 / FB))])); flash.fade(0);
  const fGlow = ctx.glow(pal.accent, .01); fGlow.position.set(FB, AX, 0); bank.add(fGlow);
  draw();
  ctx.tick((dt, t) => {
    const cl = camIn(bank);   // Bank und Tafelgruppe haben dieselbe Lage
    if (cl) { if (cl.z > .12 && SIDE < 0) setSide(1); else if (cl.z < -.12 && SIDE > 0) setSide(-1);
      for (const [o, r0] of turn) { const fr = (cl.x - o.position.x) * Math.sin(r0) + (cl.z - o.position.z) * Math.cos(r0) >= 0; o.rotation.y = r0 + (fr ? 0 : PI); } }
    const gT = labG != null ? labG : CASES[cs].g, g0 = gNow, x0 = xsNow; gNow = ease(gNow, gT, dt, 2.2);
    const b = bOf(gNow), sT = isFinite(b) && b < 1.62 ? Math.max(b, .55) : 1.62; xsNow = ease(xsNow, sT, dt, 2.6);
    if (gNow !== g0 || xsNow !== x0) draw();
    const sharp = isFinite(b) ? clamp(1 - Math.abs(xsNow - b) / .05, 0, 1) : 0;
    imgK = ease(imgK, sharp, dt, 5);
    if (isFinite(b)) { const B = GK * b / gNow, hp = B * 512 / 472; for (const m of imgs) { m.scale.set(hp / 2, hp, 1); m.position.y = -hp / 2; } }
    imgMat.opacity = imgK * clamp(.6 + .25 * gNow / (isFinite(b) ? b : 1), .55, 1); for (const m of imgs) m.visible = imgK > .02;
    ghostK = ease(ghostK, gNow < FB - .02 ? 1 : 0, dt, 3); ghost.material.opacity = .95 * ghostK; ghost.visible = ghostTag.visible = ghostK > .02; back.fade(ghostK);
    coneOut.material.opacity = .05 + .05 * imgK;
    const fl = .85 + .1 * Math.sin(t * 11) * Math.sin(t * 6.7) + .05 * Math.sin(t * 23);
    flameHalo.scale.setScalar(.42 * fl); if (candLight) candLight.intensity = 1.6 * fl;
    showCase(cs); if (ZB) stBoard.position.y = BY + Math.sin(t * 1.1) * .03;
    if (flashT > 0) { flashT -= dt; flash.fade(clamp(flashT, 0, 1)); fGlow.scale.setScalar(.01 + .5 * clamp(flashT, 0, 1) * (.8 + .2 * Math.sin(t * 12))); }
  });
  for (const k of [-1.55, -.78, 0, .78, 1.55]) ctx.obstacle(S.center.x + k * Math.cos(PHI), S.center.z - k * Math.sin(PHI), .42);
  ctx.exhibit(bank, {label: "Optische Bank", sub: "anklicken: Kerze verschieben", title: "Bilder an der Sammellinse", dist: 2.4, pitch: -.14,
    onClick: () => { cs = (cs + 1) % 4; }, get text(){ return TEXTS[cs]; }});
  // Labor: Gegenstandsweite g einstellen – Kerze und Schirm fahren mit, der Schirm steht jeweils beim scharfen Bild; Anzeige ersetzt dabei die Zustandstafel
  {
    const [lc2, lg2] = cv(1024, 464), labTex = ctex(lc2);
    const labScr = new T.Mesh(new T.PlaneGeometry(2.1, .95), new T.MeshBasicMaterial({map: labTex, toneMapped: false}));
    labScr.position.set(0, BY - .26, 0); labScr.rotation.y = -.45;   // tiefer als die Zustandstafel: beim Messen (Blatt offen) ganz im Blick
    labScr.visible = false; labScr.renderOrder = 4; signs.add(labScr); turn.push([labScr, -.45]);
    const de = (x, d = 0) => String(+x.toFixed(d)).replace(".", ",");   // wie im Laborblatt: 40 statt 40,0
    const drawLab = (gc, b, B) => { const q = lg2; q.fillStyle = ST ? "#0b1524" : DT ? "#1c1712" : "#1a1226"; q.fillRect(0, 0, 1024, 464);
      q.strokeStyle = pal.accent; q.lineWidth = 8; q.strokeRect(6, 6, 1012, 452); q.textAlign = "center"; q.textBaseline = "middle";
      q.fillStyle = pal.accent; q.font = `700 62px ${BODY}`; q.fillText("Labor: Bildweite messen", 512, 76);
      q.fillStyle = "#f4efe2"; q.font = `600 54px ${BODY}`;
      q.fillText(`Gegenstandsweite g = ${de(gc)} cm`, 512, 182); q.fillText(`Bildweite b = ${de(b)} cm (scharf)`, 512, 268);
      q.fillStyle = "#ffe9b0"; q.fillText(`Bildgröße B = ${de(B, 1)} cm · G = 20 cm`, 512, 360); labTex.needsUpdate = true; };
    if (ctx.lab) ctx.lab(bank, {
      id: "bildweite", titel: "Wo entsteht das scharfe Bild?",
      text: "Stelle mit dem Regler die **Gegenstandsweite g** der Kerze ein (Kerze G = 20 cm). Die Brennweite der Sammellinse sollst du selbst herausfinden. Der Schirm fährt jeweils dorthin, wo das Bild **scharf** ist – lies die **Bildweite b** ab. Nimm mindestens fünf Messwerte auf, trage sie selbst ins g-b-Diagramm ein und werte die Kurve aus.",
      regler: [{id: "g", name: "Gegenstandsweite g", einheit: "cm", min: 75, max: 170, schritt: 5, wert: 150}],
      messe: v => ({b: Math.round(50 * v.g / (v.g - 50)), B: Math.round(10000 / (v.g - 50)) / 10}),   // scharfes Bild bei 1/f = 1/g + 1/b, B = G · b : g (auf 1 cm bzw. 1 mm abgelesen)
      anzeige: [{id: "b", name: "Bildweite b (Schirm scharf)", einheit: "cm", stellen: 0}, {id: "B", name: "Bildgröße B", einheit: "cm", stellen: 1}],
      achsen: {x: {id: "g", name: "g in cm", min: 60, max: 180, teil: 20}, y: {id: "b", name: "b in cm", min: 60, max: 160, teil: 20}},
      punkte: 5, gerade: false,
      aufgabe: {frage: "Lies an deiner Kurve ab, bei welcher Gegenstandsweite das Bild genau so weit hinter der Linse entsteht, wie die Kerze davor steht (b = g). Dort gilt g = b = 2f. Wie groß ist die Brennweite f der Linse?",
        wert: 50, toleranz: 4, einheit: "cm",   // Ablesen an einer Kurve aus wenigen Punkten: ±4 cm
        tipps: ["Suche auf deiner Kurve die Stelle, an der b und g gleich groß sind – oder stelle den Regler so ein, dass die Anzeige b denselben Wert zeigt wie g.",
                "Das ist bei g = 100 cm der Fall: Dort ist auch b = 100 cm, und das Bild ist so groß wie die Kerze (B = G = 20 cm).",
                "Aus g = 2f folgt f = g : 2 = 100 cm : 2 = … cm."],
        loesung: "Bei **g = b = 100 cm** ist das Bild gleich groß wie die Kerze. Dort gilt g = 2f, also **f = 100 cm : 2 = 50 cm** – genau der Abstand vom Brennpunkt F zur Linsenmitte."},
      merke: "Rückt die Kerze von weit weg auf den Brennpunkt zu, entsteht das scharfe Bild **immer weiter hinten** und wird **größer**. Bei **g = b = 2f** ist es gleich groß (hier f = 50 cm). Für g > 2f ist b < g und das Bild verkleinert, für f < g < 2f ist b > g und das Bild vergrößert – denn **B : G = b : g**.",
      live: (v, m) => {
        if (!v) { labG = null; labScr.visible = false; stBoard.visible = true; return; }
        labG = v.g / 100; stBoard.visible = false; labScr.visible = true; drawLab(v.g, m.b, m.B); }
    });
  }
  ctx.exhibit(lensC, {label: "Sammellinse", sub: "anklicken: paralleles Licht", title: "Sammellinse, Brennpunkt und Brennweite", dist: 2.2, pitch: -.12,
    onClick: () => { flashT = 4.5; },
    text: "Die Sammellinse ist in der Mitte dicker als am Rand. Licht, das **parallel zur optischen Achse** einfällt, trifft sich hinter der Linse im **Brennpunkt F**. Der Abstand von F zur Linsenmitte ist die **Brennweite f**. Wie groß sie bei dieser Linse ist, misst du im Labor an der optischen Bank.\n\n**Parallelstrahl** → nach der Linse durch F · **Mittelpunktstrahl** → geradeaus weiter · **Brennpunktstrahl** → nach der Linse parallel zur Achse."});

  /* ===================================================================
     Gemeinsame Teile der Augenmodelle
     =================================================================== */
  const mSclera = ctx.mat("color", {color: "#f1e8db", rough: .5});
  const mCorneaEdge = ctx.mat("color", {color: "#a8d6ff", rough: .2});
  const mCiliary = ctx.mat("color", {color: "#b0473f", rough: .7});
  const mYellow = ctx.mat("glow", {color: "#FFD84A", intensity: .9}), mBlind = ctx.mat("color", {color: "#f7f1e3", rough: .5});
  const retinaT = (() => { const [c, g] = cv(512, 256), rnd = ctx.rand;
    const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "#a3402c"); gr.addColorStop(.5, "#c95f3e"); gr.addColorStop(1, "#a3402c"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 30; i++) { let x = rnd() * 512, y = rnd() * 256, a = rnd() * 6.3; g.strokeStyle = `rgba(110,15,15,${.35 + rnd() * .3})`; g.lineWidth = 1 + rnd() * 3;
      g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 14; k++) { a += (rnd() - .5) * .9; x += Math.cos(a) * 12; y += Math.sin(a) * 12; g.lineTo(x, y); } g.stroke(); }
    return ctex(c); })();
  const irisT = (() => { const [c, g] = cv(256, 256), rnd = ctx.rand; g.translate(128, 128);
    for (let i = 0; i < 260; i++) { const a = rnd() * PI * 2, r0 = 22 + rnd() * 20, r1 = 90 + rnd() * 36; g.strokeStyle = ["#3f78a8", "#5b93b8", "#2f5d86", "#7a6a3a"][(rnd() * 4) | 0]; g.lineWidth = 2 + rnd() * 3;
      g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.stroke(); }
    g.strokeStyle = "#1a2f44"; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 122, 0, 7); g.stroke(); return ctex(c); })();
  const fiberT = (() => { const [c, g] = cv(256, 256); g.translate(128, 128); g.strokeStyle = "rgba(255,240,215,.85)"; g.lineWidth = 1.6;
    for (let i = 0; i < 90; i++) { const a = i / 90 * PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); g.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); g.stroke(); } return ctex(c); })();
  const mRetina = new T.MeshStandardMaterial({map: retinaT, side: T.BackSide, roughness: .75});
  const mIris = new T.MeshStandardMaterial({map: irisT, side: T.DoubleSide, roughness: .6});
  const mEyeLens = new T.MeshStandardMaterial({color: 0xfff1c8, transparent: true, opacity: .5, roughness: .15, side: T.DoubleSide, depthWrite: false});
  const mEyeFace = new T.MeshStandardMaterial({color: 0xffe7a6, emissive: 0x3a2a00, transparent: true, opacity: .82, roughness: .3, side: T.DoubleSide});
  const mCornea = new T.MeshStandardMaterial({color: 0xd6ecff, transparent: true, opacity: .3, roughness: .05, side: T.DoubleSide, depthWrite: false});
  const mFiber = new T.MeshBasicMaterial({map: fiberT, transparent: true, opacity: .8, depthWrite: false, side: T.DoubleSide});
  const mGel = new T.MeshStandardMaterial({color: 0xcfe9ff, transparent: true, opacity: .14, roughness: .1, depthWrite: false});
  const mNerve = new T.MeshStandardMaterial({color: 0xe9d39f, roughness: .6, side: T.DoubleSide});
  const mNerveFace = new T.MeshStandardMaterial({roughness: .65, side: T.DoubleSide, map: (() => { const [c, g] = cv(64, 256); g.fillStyle = "#ead3a0"; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 15; i++) { g.strokeStyle = i % 2 ? "rgba(160,120,62,.45)" : "rgba(255,246,220,.5)"; g.lineWidth = 1.6; const x = 3 + i * 4.1;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 2, 90, x - 2, 170, x + Math.sin(i) * 2, 256); g.stroke(); }
    g.strokeStyle = "rgba(120,84,40,.6)"; g.lineWidth = 3; g.strokeRect(1.5, -2, 61, 260); return ctex(c); })()});
  const LT0 = .6, LT1 = .08;   // Dicke der Augenlinse relativ zu ihrem Radius
  function makeEye(R, s = 1, full = true){
    const g = new T.Group(), cxs = .913 * R * (s - 1);
    const E = {g, R, s, cxs, Rc: .5 * R, xcc: -.624 * R, xi: -.62 * R, xL: -.47 * R, rl: .3 * R, rr: .955 * R};
    const scl = ctx.mesh(bowl(T, R, .42), mSclera); scl.scale.x = s; scl.position.x = cxs;
    const ret = new T.Mesh(bowl(T, E.rr, .8), mRetina); ret.scale.x = s; ret.position.x = cxs; ret.receiveShadow = true;
    const rim = new T.Mesh(new T.TorusGeometry(R * .975, R * .032, 6, 60, 2 * PI - .84).rotateZ(-(PI - .42)), mSclera); rim.scale.x = s; rim.position.x = cxs;
    const tc = Math.asin(.816);
    const cor = new T.Mesh(new T.SphereGeometry(E.Rc, 28, 10, PI, PI, 0, tc).rotateZ(PI / 2), mCornea); cor.position.x = E.xcc;
    const corRim = new T.Mesh(new T.TorusGeometry(E.Rc, R * .014, 5, 20, 2 * tc).rotateZ(PI - tc), mCorneaEdge); corRim.position.x = E.xcc;
    const iris = new T.Mesh(new T.RingGeometry(R * .18, R * .6, 40, 1, -PI / 2, PI).rotateY(PI / 2), mIris); iris.position.x = E.xi;
    E.lens = new T.Group(); E.lens.position.x = E.xL;
    E.lens.add(new T.Mesh(lensGeo(T, E.rl, LT0 * E.rl, LT1 * E.rl, {half: true}), mEyeLens), new T.Mesh(lensFace(T, E.rl, LT0 * E.rl, LT1 * E.rl), mEyeFace));
    g.add(scl, ret, rim, cor, corRim, iris, E.lens);
    const shell = bake(g, [scl, rim], mSclera);
    if (full) {
      E.cil = new T.Mesh(new T.TorusGeometry(R * .74, R * .075, 8, 22, PI).rotateZ(-PI / 2).rotateY(PI / 2), mCiliary); E.cil.position.x = E.xL;
      E.fib = new T.Mesh(new T.RingGeometry(E.rl * 1.02, R * .68, 24, 1, -PI / 2, PI).rotateY(PI / 2), mFiber); E.fib.position.x = E.xL;
      const a = -.32; E.blindA = a;
      // Sehnerv: hintere Hälfte (beidseitig, sonst sähe man von vorn nur weggeschnittene Rückseiten) + flache Schnittfläche mit Nervenfasern
      const nc = V(Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.25, 0);
      const nerve = new T.Mesh(new T.CylinderGeometry(R * .11, R * .13, R * .7, 16, 1, true, PI / 2, PI).rotateZ(a - PI / 2), mNerve); nerve.position.copy(nc);
      const ng = new T.PlaneGeometry(R * .26, R * .7), np = ng.attributes.position;
      for (let i = 0; i < np.count; i++) if (np.getY(i) > 0) np.setX(i, np.getX(i) * .11 / .13);
      const nFace = new T.Mesh(ng.rotateZ(a - PI / 2), mNerveFace); nFace.position.copy(nc); g.add(nFace);
      const ys = new T.Mesh(new T.SphereGeometry(R * .065, 14, 10), mYellow); ys.position.set(E.rr * .985, 0, 0);
      const bs = new T.Mesh(new T.SphereGeometry(R * .06, 14, 10), mBlind); bs.position.set(Math.cos(a) * E.rr * .985, Math.sin(a) * E.rr * .985, 0);
      const gr = E.rr * .97, a0 = 2.2, sh = new T.Shape();
      sh.moveTo(Math.cos(-a0) * gr, Math.sin(-a0) * gr); sh.absarc(0, 0, gr, -a0, a0, false);
      sh.quadraticCurveTo(-.3 * R, .3 * R, -.29 * R, 0); sh.quadraticCurveTo(-.3 * R, -.3 * R, Math.cos(-a0) * gr, Math.sin(-a0) * gr);
      const gel = new T.Mesh(new T.ShapeGeometry(sh, 24), mGel); gel.position.z = -.004;
      g.add(E.cil, E.fib, nerve, ys, bs, gel);
      E.yellow = ys; E.blind = bs;
    }
    noCast(g); shell.castShadow = true;
    return E;
  }
  // Strahlengang im Auge (Augen-Koordinaten): Start → (Brillenglas) → Hornhaut → Linse → Richtung Brennpunkt xf bis zur Netzhaut
  const corneaX = (E, h) => E.xcc - Math.sqrt(Math.max(0, E.Rc * E.Rc - h * h));
  function hitRetina(E, p, d){
    const a = E.s * E.rr, r = E.rr, px = (p.x - E.cxs) / a, py = p.y / r, dx = d.x / a, dy = d.y / r;
    const A = dx * dx + dy * dy, B = 2 * (px * dx + py * dy), C = px * px + py * py - 1;
    return (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A);
  }
  function traceEye(E, starts, hs, xf, via){
    const out = {lines: [], hits: [], beyond: []};
    hs.forEach((h, i) => {
      const pts = [starts[i]]; if (via && via[i]) pts.push(via[i]);
      const xc = corneaX(E, h); pts.push(V(xc, h));
      const xa = xf + .55 * E.R, h2 = h * (xa - E.xL) / (xa - xc), p2 = V(E.xL, h2); pts.push(p2);
      const d = V(xf - E.xL, -h2), hit = p2.clone().addScaledVector(d, hitRetina(E, p2, d)); pts.push(hit);
      out.lines.push(pts); out.hits.push(hit); if (hit.x < xf - .01) out.beyond.push([hit, V(xf, 0)]);
    });
    return out;
  }

  /* ===================================================================
     A: Aufgeschnittenes Riesenauge mit Akkommodation (links)
     =================================================================== */
  {
    const aG = new T.Group(); ctx.add(aG, S.A.x - 1.0, 0, 2.05); aG.rotation.y = PI / 2;
    const R = .62, EY = 1.76;
    // Rückwand dicht hinter dem Augapfel (reicht bis z = −0,62): wenig Parallaxe zwischen Beschriftung und Titel
    backdrop(aG, 3.75, 2.6, -.175, 2.0, -.68, "Das Auge – ein optisches System");
    // Sockel
    const ped = ctx.cyl(.16, .24, 1.1, mBase, 20); ped.position.set(0, .55, -.28);
    const cup = ctx.cyl(.3, .2, .1, mTrim, 24); cup.position.set(0, 1.155, -.28);
    const foot = ctx.cyl(.34, .38, .08, mBase, 24); foot.position.set(0, .04, -.28);
    aG.add(ped, cup, foot); bakeBy(aG, [ped, foot]);
    if (ST) { const ring = ctx.cyl(.25, .25, .025, mEdge, 32); ring.position.set(0, .82, -.28); aG.add(ring); noCast(ring); }
    const E = makeEye(R, 1, true); E.g.position.set(0, EY, 0); aG.add(E.g);
    // Nahe Kerze (Gegenstand in der Nähe)
    const XS = -2.0, src = new T.Group(); src.position.set(XS, 0, 0); aG.add(src);
    {
      const post = ctx.cyl(.018, .025, EY - .14, mTrim, 10); post.position.y = (EY - .14) / 2;
      const ft = ctx.cyl(.12, .14, .04, mBase, 16); ft.position.y = .02;
      const pl = ctx.cyl(.05, .04, .02, mTrim, 16); pl.position.y = EY - .135;
      const bd = ctx.cyl(.022, .022, .1, mWax, 14); bd.position.y = EY - .075;
      const fl = ctx.sphere(.013, mFlame, 10); fl.scale.set(1, 1.8, 1); fl.position.y = EY;
      const gw = ctx.glow(flameHex, .3); gw.position.y = EY;
      src.add(post, ft, pl, bd, fl, gw); noCast(pl, fl); bakeBy(src, [post, pl]);
    }
    // Beschriftung (obere Reihe knapp über dem Augapfel, damit sie unter dem Rückwandtitel bleibt)
    const labs = [["Hornhaut", -1.06, .5, -.66, .15], ["Iris", -.78, .72, -.39, .27], ["Ziliarmuskel", -.22, .74, -.3, .5], ["Pupille", -1.08, -.42, -.39, -.04],
      ["Linse", -.62, -.66, -.29, -.12], ["Glaskörper", .46, .74, .12, .3], ["Netzhaut", 1.05, .58, .43, .41], ["Gelber Fleck", 1.12, .2, .6, 0],
      ["Blinder Fleck", 1.13, -.13, .58, -.19], ["Sehnerv", 1.0, -.6, .76, -.25]];
    // Beschriftung, Hinweislinien und Zustandstext auf zwei Leinwänden (links/rechts, je 1024²) direkt vor der Schnittfläche
    let aS = 0;
    const OW = 1.95, OY0 = -1.05, PXM = 1024 / OW;
    const ovs = [-2.05, -.1].map(x0 => { const [c, g] = cv(1024, 1024), m = new T.Mesh(new T.PlaneGeometry(OW, OW), new T.MeshBasicMaterial({map: ctex(c), transparent: true, depthWrite: false, toneMapped: false}));
      m.position.set(x0 + OW / 2, OY0 + OW / 2, .03); m.renderOrder = 4; E.g.add(m); return {x0, g, m}; });
    const drawLabels = () => { for (const o of ovs) { const g = o.g, X = x => (x - o.x0) * PXM, Y = y => (OY0 + OW - y) * PXM;
      g.clearRect(0, 0, 1024, 1024); g.lineJoin = "round"; g.textBaseline = "middle";
      const label = (s, x, y, size, col) => { g.font = `700 ${size}px ${BODY}`; g.textAlign = "center"; g.lineWidth = size * .28; g.strokeStyle = "rgba(8,6,12,.9)"; g.strokeText(s, X(x), Y(y)); g.fillStyle = col; g.fillText(s, X(x), Y(y)); };
      for (const [s, tx, ty, ax, ay] of labs) { g.font = `700 34px ${BODY}`; const w = g.measureText(s).width / PXM / 2;
        const ex = ax < tx - w ? tx - w - .02 : ax > tx + w ? tx + w + .02 : tx, ey = ex === tx ? (ay < ty ? ty - .045 : ty + .045) : ty;
        g.beginPath(); g.moveTo(X(ex), Y(ey)); g.lineTo(X(ax), Y(ay)); g.strokeStyle = "rgba(8,6,12,.75)"; g.lineWidth = 6; g.stroke(); g.strokeStyle = pal.light; g.lineWidth = 2.6; g.stroke();
        g.fillStyle = pal.accent; g.beginPath(); g.arc(X(ax), Y(ay), 6.5, 0, 7); g.fill(); label(s, tx, ty, 34, pal.light); }
      if (aS === 0) label("Licht von einem fernen Gegenstand", -1.45, .24, 27, pal.light); else label("nahe Kerze", -1.55, .2, 30, pal.light);
      const st = [["Ferne: Linse flach", "Bild scharf auf der Netzhaut"], ["Nähe: Bild läge hinter", "der Netzhaut – unscharf!"], ["Akkommodation: Linse gewölbt", "Bild wieder scharf"]][aS];
      g.font = `700 30px ${BODY}`; const bw = Math.max(...st.map(t => g.measureText(t).width)) + 44; g.fillStyle = "rgba(10,8,14,.86)"; g.beginPath(); g.roundRect(X(-1.2) - bw / 2, Y(-.78), bw, 92, 14); g.fill();
      g.fillStyle = aS === 1 ? "#ff9a8a" : "#9be8a8"; g.textAlign = "center"; st.forEach((t, i) => g.fillText(t, X(-1.2), Y(-.78) + 27 + i * 38));
      o.m.material.map.needsUpdate = true; } };
    drawLabels();
    // Strahlen, Unschärfefleck, Lage des scharfen Bildes
    const hs = [.19 * R, 0, -.19 * R], beam = rays(ctx, E.g, flameHex, .005), ghostL = rays(ctx, E.g, flameHex, .004, {dash, dashLen: .035, halo: false});
    noCast(E.g);
    const blur = ctx.glow(flameHex, .05); E.g.add(blur); const fmark = ctx.glow(pal.danger, .08); E.g.add(fmark);
    const AST = [{near: 0, acc: 0}, {near: 1, acc: 0}, {near: 1, acc: 1}];
    let near = 0, acc = 0;
    const drawA = () => {
      const xf = E.rr + .32 * R * near * (1 - acc);
      const starts = hs.map(h => V(XS, h * (1 - near)));
      const tr = traceEye(E, starts, hs, xf); beam.set(tr.lines); ghostL.set(tr.beyond); ghostL.fade(clamp((xf - E.rr) / .1, 0, 1));
      const sp = Math.abs(tr.hits[0].y - tr.hits[2].y); blur.position.set(E.rr * .97, (tr.hits[0].y + tr.hits[2].y) / 2, .02); blur.scale.setScalar(.06 + sp * 2.2);
      blur.material.opacity = clamp(.9 - sp * 3, .35, .9);
      fmark.position.set(xf, 0, .02); fmark.visible = xf > E.rr + .03; fmark.scale.setScalar(.09);
      E.lens.scale.x = 1 + .6 * acc; E.cil.scale.set(1, 1 - .1 * acc, 1 - .1 * acc); E.fib.scale.set(1, 1 - .05 * acc, 1 - .05 * acc);
      src.scale.setScalar(Math.max(.001, near)); src.visible = near > .02;
    };
    drawA();
    ctx.tick((dt, t) => { const s = AST[aS], n0 = near, a0 = acc; near = ease(near, s.near, dt, 2.4); acc = aS === 2 && near < .97 ? acc : ease(acc, s.acc, dt, 1.8);
      if (near !== n0 || acc !== a0) drawA();
      if (E.yellow) E.yellow.material.emissiveIntensity = .7 + .3 * Math.sin(t * 2.4); });
    ctx.light(pal.light, 4.5, 6, S.A.x + 1.0, 2.9, 2.0);
    ctx.obstacleBox(S.A.x - 1.45, 2.15, 1.75, 4.1);
    ctx.exhibit(aG, {label: "Augenmodell", sub: "anklicken: Ferne – Nähe – Akkommodation", title: "Das Auge – ein optisches System", dist: 2.3, pitch: -.04,
      onClick: () => { aS = (aS + 1) % 3; drawLabels(); },
      get text(){ return [
        "**Ferne:** Licht eines weit entfernten Gegenstands fällt fast parallel ins Auge. **Hornhaut** und **Augenlinse** bündeln es wie eine Sammellinse: Auf der **Netzhaut** entsteht ein **reelles, umgekehrtes, verkleinertes** Bild. Der Ziliarmuskel ist entspannt, die Linse flach.\n\nAm schärfsten siehst du im **gelben Fleck**. Am **blinden Fleck** verlässt der Sehnerv das Auge – dort gibt es keine Sinneszellen.",
        "**Nähe ohne Anpassung:** Das Licht der nahen Kerze läuft auseinander ins Auge. Mit flacher Linse läge das scharfe Bild **hinter der Netzhaut** (roter Punkt) – auf der Netzhaut entsteht nur ein unscharfer Fleck.\n\nKlicke noch einmal: Das Auge passt sich an.",
        "**Akkommodation:** Der **Ziliarmuskel** spannt sich an, die elastische Augenlinse wölbt sich stärker. Ihre **Brennweite wird kleiner** – das Bild rückt genau auf die Netzhaut.\n\nDer Abstand zwischen Linse und Netzhaut bleibt gleich: Das Auge stellt durch Ändern der Brennweite scharf, eine Kamera durch Ändern der Bildweite."][aS]; }});
  }

  /* ===================================================================
     B: Kurz- und Weitsichtigkeit (rechts hinten)
     =================================================================== */
  {
    const bG = new T.Group(); ctx.add(bG, S.B.x + .65, 0, 6.75); bG.rotation.y = -PI / 2;
    const R = .42, EY = 1.5, X1 = -.45, X2 = 1.32, XG = -1.65 * R, GR = .18;
    // Rückwand dicht hinter den Augen, Titel an ihrer Oberkante (über den Streifentexten)
    backdrop(bG, 3.7, 2.2, .1, 1.9, -.55, "Sehfehler und ihre Korrektur");
    const top = ctx.box(3.3, .06, .74, mWood); top.position.set(.05, .95, 0);
    const stat = [top, legs([[-1.55, -.3], [1.65, -.3], [-1.55, .3], [1.65, .3]], .92, mDark, false, .035)]; bG.add(...stat);
    if (ST) { const e = ctx.box(3.32, .02, .76, mEdge); e.position.set(.05, .915, 0); bG.add(e); noCast(e); }
    const HZ = -.26, HY = GR + .1;   // Brillenhalter: Stativstange hinter dem Glas, Arm mit Klemme fährt beim Einsetzen mit nach unten
    const mHold = ctx.mat("color", {color: ST ? "#b9c4d0" : "#c99a45", rough: .38, metal: .35});   // matt glänzend: vor der dunklen Rückwand gut sichtbar
    const eyes = [[X1, 1.22, "Kurzsichtig\nAugapfel zu lang", false], [X2, .8, "Weitsichtig\nAugapfel zu kurz", true]].map(([x, s, name, conv]) => {
      const E = makeEye(R, s, false); E.g.position.set(x, EY, 0); bG.add(E.g);
      const stH = EY - Math.sqrt(R * R - .16 * .16) - .97; const st = ctx.cyl(.05, .07, stH, mTrim, 12); st.position.set(x + E.cxs, .98 + stH / 2, -.16); bG.add(st);
      const gx = x + XG, pole = rod(V(gx, .98, HZ), V(gx, EY + .5 + HY + .08, HZ), .016, mHold, 10), pf = ctx.cyl(.065, .075, .025, mHold, 16); pf.position.set(gx, .9925, HZ);
      bG.add(pole, pf); stat.push(st, pole, pf);
      const [sc, sg] = cv(1024, 304), strip = new T.Mesh(new T.PlaneGeometry(1.7, .505), new T.MeshBasicMaterial({map: ctex(sc), transparent: true, depthWrite: false, toneMapped: false}));
      strip.position.set(x + .05, EY + .63, .03); strip.renderOrder = 4; bG.add(strip);
      const drawStrip = ok => { sg.clearRect(0, 0, 1024, 304); sg.textAlign = "center"; sg.textBaseline = "middle"; sg.lineJoin = "round";
        const line = (t, y, size, col) => { sg.font = `700 ${size}px ${BODY}`; sg.lineWidth = size * .25; sg.strokeStyle = "rgba(8,6,12,.85)"; sg.strokeText(t, 512, y); sg.fillStyle = col; sg.fillText(t, 512, y); };
        const [n1, n2] = name.split("\n"); line(n1, 48, 46, pal.accent); line(n2, 98, 36, pal.accent);
        line(ok ? "Bild auf der Netzhaut" : conv ? "Bild läge hinter der Netzhaut" : "Bild vor der Netzhaut", 205, 36, ok ? "#9be8a8" : "#ff9a8a"); strip.material.map.needsUpdate = true; };
      drawStrip(false);
      // Brillenglas (halb aufgeschnitten) an einem Halter
      const gl = new T.Group(); gl.position.set(x + XG, EY + .5, 0); bG.add(gl);
      const t0 = conv ? .07 : .018, t1 = conv ? .012 : .075;
      gl.add(new T.Mesh(lensGeo(T, GR, t0 * 1.2, t1 * 1.2, {half: true}), mGlass), new T.Mesh(lensFace(T, GR, t0 * 1.2, t1 * 1.2), new T.MeshStandardMaterial({color: 0xcfeaff, transparent: true, opacity: .5, roughness: .1, side: T.DoubleSide})));
      const rim = ctx.mesh(new T.TorusGeometry(GR + .006, .012, 6, 24, PI).rotateZ(-PI / 2).rotateY(PI / 2), ST ? mEdge : mHold, false); gl.add(rim);
      const stem = rod(V(0, GR + .004, 0), V(0, HY, 0), .015, mHold, 8), arm = rod(V(0, HY, 0), V(0, HY, HZ), .015, mHold, 8);
      const clampB = ctx.box(.06, .07, .06, mHold); clampB.position.set(0, HY, HZ); gl.add(stem, arm, clampB);
      bakeBy(gl, [rim, stem, arm, clampB]); noCast(gl);
      const gt = txt(conv ? "Sammellinse" : "Zerstreuungslinse", .05, pal.light); gt.position.set(0, -GR - .06, .03); gl.add(gt);
      const bm = rays(ctx, E.g, flameHex, .0045, {halo: false}), blur = ctx.glow(flameHex, .04); E.g.add(blur);
      // Weitsichtig: Lage des scharfen Bildes hinter der Netzhaut (gestrichelt + roter Punkt wie im Augenmodell)
      const gh = conv ? rays(ctx, E.g, flameHex, .0035, {dash, dashLen: .03, halo: false}) : null, fm = conv ? ctx.glow(pal.danger, .07) : null; if (fm) E.g.add(fm);
      return {E, x, conv, gl, bm, blur, gh, fm, drawStrip, ok: false};
    });
    bakeBy(bG, stat);
    // Quellen: ferner Gegenstand (parallel) bzw. nahe Kerze
    const fromFar = txt("Licht von fern", .052, pal.light); fromFar.position.set(X1 - .9, EY + .17, .03); bG.add(fromFar);
    const XS2 = X2 - 2.6 * R;
    {
      const c = new T.Group(); c.position.set(XS2, 0, 0); bG.add(c);
      const post = ctx.cyl(.012, .016, EY - .07 - .98, mTrim, 8); post.position.y = (EY - .07 + .98) / 2;
      const bd = ctx.cyl(.016, .016, .06, mWax, 12); bd.position.y = EY - .04; const fl = ctx.sphere(.01, mFlame, 8); fl.scale.set(1, 1.8, 1); fl.position.y = EY;
      const gw = ctx.glow(flameHex, .22); gw.position.y = EY; c.add(post, bd, fl, gw); noCast(c);
      const nt = txt("nahe Kerze", .052, pal.light); nt.position.set(XS2, EY - .22, .05); bG.add(nt);
    }
    let bS = 0, lift = 1, corr = 0;
    const hs = [.17 * R, 0, -.17 * R];
    const drawB = () => {
      for (const o of eyes) {
        const E = o.E, xg = XG, retBack = E.cxs + E.rr * E.s;
        o.gl.position.y = EY + .5 * lift;
        let lines;
        if (!o.conv) {   // kurzsichtig: paralleles Licht, Zerstreuungslinse lässt es auseinanderlaufen
          const xf = .955 * R + (retBack - .955 * R) * corr, hc = hs.map(h => h * (1 + .2 * corr));
          lines = traceEye(E, hs.map(h => V(-2.6 * R, h)), hc, xf, corr > .02 ? hs.map(h => V(xg, h)) : null);
        } else {         // weitsichtig: nahe Kerze, Sammellinse bündelt zusätzlich
          const xs = -2.6 * R, xf = 1.25 * R + (retBack - 1.25 * R) * corr;
          const hc = hs.map(h => { const hg = h * (xg - xs) / (corneaX(E, h) - xs); return h + (hg * .92 - h) * corr; });
          lines = traceEye(E, hs.map(() => V(xs, 0)), hc, xf, corr > .02 ? hs.map(h => V(xg, h * (xg - xs) / (corneaX(E, h) - xs))) : null);
        }
        o.bm.set(lines.lines);
        if (o.gh) { const xf = 1.25 * R + (retBack - 1.25 * R) * corr, k = clamp((xf - retBack) / .08, 0, 1);
          o.gh.set(lines.beyond); o.gh.fade(k); o.fm.position.set(xf, 0, .02); o.fm.visible = k > .05; o.fm.material.opacity = k; }
        const sp = Math.abs(lines.hits[0].y - lines.hits[2].y); o.blur.position.set(retBack - .01, (lines.hits[0].y + lines.hits[2].y) / 2, .02); o.blur.scale.setScalar(.04 + sp * 2.2);
        if ((corr >= .5) !== o.ok) { o.ok = corr >= .5; o.drawStrip(o.ok); }
      }
    };
    drawB();
    ctx.tick(dt => { const l0 = lift, c0 = corr; lift = ease(lift, bS ? 0 : 1, dt, 3.2); corr = ease(corr, bS && lift < .1 ? 1 : 0, dt, 3); if (lift !== l0 || corr !== c0) drawB(); });
    ctx.obstacleBox(S.B.x + 1.15, 6.75, 1.6, 3.5);
    ctx.exhibit(bG, {label: "Sehfehler", sub: "anklicken: Brillengläser einsetzen", title: "Kurzsichtigkeit und Weitsichtigkeit", dist: 2.5, pitch: -.1,
      onClick: () => { bS = 1 - bS; },
      get text(){ return bS
        ? "Eine **Zerstreuungslinse** (in der Mitte dünner als am Rand) lässt das Licht vor dem kurzsichtigen Auge etwas auseinanderlaufen – das Bild rückt nach hinten auf die Netzhaut.\n\nEine **Sammellinse** (in der Mitte dicker) bündelt das Licht vor dem weitsichtigen Auge zusätzlich – das Bild rückt nach vorn auf die Netzhaut. Auch bei Alterssichtigkeit hilft eine Lesebrille mit Sammellinsen."
        : "**Kurzsichtig** (links): Der Augapfel ist zu lang. Licht von fernen Gegenständen wird schon **vor der Netzhaut** gebündelt – Fernes sieht man unscharf.\n\n**Weitsichtig** (rechts): Der Augapfel ist zu kurz. Das scharfe Bild naher Gegenstände läge **hinter der Netzhaut** – Nahes sieht man unscharf. Klicke, um die passenden Brillengläser einzusetzen."; }});
  }

  /* ===================================================================
     C: Lupe über einem Schriftstück (rechts vorne)
     =================================================================== */
  {
    const cG = new T.Group(); ctx.add(cG, S.C.x + .45, 0, -2.4); cG.rotation.y = -PI / 2;
    const FL = .3, DW = .9, DH = .62;
    // Pult
    const pult = [];
    if (ZB) { const c = ctx.cyl(.15, .22, .98, mBase, 16); c.position.y = .49; const b = ctx.box(.7, .1, .55, mBase); b.position.y = .05; pult.push(c, b); }
    else if (ST) { const c = ctx.box(.5, .96, .36, mDark); c.position.y = .48; const e = ctx.box(.04, .8, .37, mEdge); e.position.set(0, .48, .0); const b = ctx.box(.7, .06, .55, mTrim); b.position.y = .03; noCast(e); pult.push(c, e, b); }
    else { const c = ctx.box(.78, .94, .42, mWood); c.position.y = .47; const p = ctx.box(.66, .7, .02, ctx.mat("wood")); p.position.set(0, .5, .215); const b = ctx.box(.86, .05, .5, mDark); b.position.y = .025; pult.push(c, p, b); }
    cG.add(...pult);
    const tilt = new T.Group(); tilt.position.set(0, 1.12, .05); tilt.rotation.x = -.96; cG.add(tilt);
    const board = ctx.box(1.04, .92, .04, mWood); board.position.z = -.022; tilt.add(board);
    const lip = ctx.box(1.04, .03, .05, mTrim); lip.position.set(0, -.46, .02); tilt.add(lip); pult.push(board, lip);
    // Schriftstück (Weltvariante)
    const [dc, dg] = cv(1024, 704);
    (function drawDoc(g){
      const tiny = (x, y) => { g.save(); g.fillStyle = ST ? "#d8f6ff" : "#2a1a10"; g.font = `600 9px ${BODY}`; g.textAlign = "center";
        ["Kleingedrucktes:", "Mit der Lupe", "kannst du sogar", "das hier lesen!"].forEach((s, i) => g.fillText(s, x, y - 15 + i * 11)); g.restore(); };
      const para = (lines, x, y, size, color, lh = 1.45, font = BODY, style = "") => { g.fillStyle = color; g.font = `${style} ${size}px ${font}`; g.textAlign = "left"; lines.forEach((s, i) => g.fillText(s, x, y + i * size * lh)); };
      if (ST) {
        g.fillStyle = "#07121e"; g.fillRect(0, 0, 1024, 704); g.strokeStyle = "rgba(79,195,247,.14)"; g.lineWidth = 1;
        for (let x = 0; x < 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 704); g.stroke(); } for (let y = 0; y < 704; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
        const r = ctx.rand; for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(220,245,255,${.3 + r() * .7})`; g.fillRect(r() * 1024, r() * 704, 1.5 + r() * 2, 1.5 + r() * 2); }
        g.strokeStyle = "#4FC3F7"; g.lineWidth = 3; g.strokeRect(10, 10, 1004, 684);
        g.fillStyle = "#FFE81F"; g.font = `700 46px ${HEAD}`; g.textAlign = "left"; g.fillText("Navigationskarte · Sektor 7", 40, 72);
        para(["Kurs: 214,5° · Ziel: Station Kepler", "Antrieb: 78 % · Schilde: bereit", "Nächster Sprungpunkt: 4,2 Lichtjahre", "Nebel K-12 meiden – Sensoren gestört!", "Asteroidengürtel: Abstand 0,3 AE halten", "Funkkanal 7 bleibt offen.", "Wache: 3. Schicht, Brücke"], 40, 130, 19, "#cfefff");
        for (const [x, y, r0, c] of [[690, 300, 34, "#ffb35c"], [820, 470, 22, "#7fd8ff"], [560, 520, 16, "#c58cff"]]) { g.strokeStyle = "rgba(127,216,255,.4)"; g.beginPath(); g.ellipse(690, 380, Math.abs(x - 690) * 1.1 + 140, 90 + r0 * 2, 0, 0, 7); g.stroke();
          const gr = g.createRadialGradient(x - r0 * .3, y - r0 * .3, 2, x, y, r0); gr.addColorStop(0, "#fff"); gr.addColorStop(.3, c); gr.addColorStop(1, "#102030"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r0, 0, 7); g.fill(); }
        para(["Kepler-Station", "X 41,07 · Y 12,93"], 730, 290, 14, "#7fd8ff", 1.3); para(["Nebel K-12"], 520, 560, 14, "#c58cff");
        para(["Nur für den Dienstgebrauch an Bord · Blatt 3 von 12"], 40, 670, 13, "rgba(207,239,255,.7)");
        tiny(671, 489);
      } else if (DT) {
        const gr = g.createRadialGradient(512, 352, 80, 512, 352, 700); gr.addColorStop(0, "#efe2c4"); gr.addColorStop(1, "#c9ad7c"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 704);
        const r = ctx.rand; for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(110,80,40,${r() * .12})`; g.fillRect(r() * 1024, r() * 704, 2, 2); }
        g.fillStyle = "#2b1d12"; g.font = `italic 700 42px ${HEAD}`; g.textAlign = "left"; g.fillText("An die Detektei am Nebelufer", 50, 76);
        para(["London, 14. November 1889"], 640, 120, 18, "#3a2a1a", 1.4, BODY, "italic");
        para(["Sehr geehrte Herren,", "seit drei Nächten brennt im Haus gegenüber", "um Mitternacht ein Licht, obwohl dort", "niemand wohnt. Gestern fand ich am", "Fenstersims den Abdruck, den ich Ihnen", "hier aufgezeichnet habe. Ich bitte Sie", "inständig, der Sache nachzugehen.", "", "Hochachtungsvoll, E. Hartmann"], 50, 170, 21, "#2b1d12", 1.5, BODY, "italic");
        g.save(); g.translate(820, 300); g.strokeStyle = "rgba(40,28,18,.8)"; g.lineWidth = 2.2;
        for (let k = 1; k < 15; k++) { g.beginPath(); g.ellipse(0, 0, k * 5.2, k * 7, .2, .3 + k * .07, PI * 2 - .4 + k * .03); g.stroke(); } g.restore();
        para(["Abdruck vom Fenstersims"], 740, 420, 15, "#3a2a1a", 1.3, BODY, "italic");
        g.fillStyle = "#8a1f1a"; g.beginPath(); g.arc(900, 610, 34, 0, 7); g.fill(); g.fillStyle = "#b8463c"; g.beginPath(); g.arc(894, 604, 20, 0, 7); g.fill();
        tiny(671, 489);
      } else {
        const gr = g.createRadialGradient(512, 352, 80, 512, 352, 700); gr.addColorStop(0, "#f3e3bd"); gr.addColorStop(1, "#c4a066"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 704);
        const r = ctx.rand; for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(120,80,30,${r() * .12})`; g.fillRect(r() * 1024, r() * 704, 2, 2); }
        g.strokeStyle = "#6b4a22"; g.lineWidth = 4; g.strokeRect(18, 18, 988, 668); g.lineWidth = 1.5; g.strokeRect(28, 28, 968, 648);
        g.fillStyle = "#4a1a12"; g.font = `700 46px ${HEAD}`; g.textAlign = "center"; g.fillText("Rezept für einen Leuchttrank", 512, 82);
        para(["Zutaten:", "– 3 Tropfen Morgentau", "– 1 Prise Sternenstaub", "– 2 Blätter Silberminze", "– 250 ml Quellwasser", "", "Zubereitung:", "1. Wasser langsam erwärmen.", "2. Minze im Uhrzeigersinn einrühren.", "3. Sternenstaub zuletzt hinzufügen.", "4. Sieben Minuten ziehen lassen."], 60, 140, 20, "#3a2414", 1.42);
        g.save(); g.translate(800, 280); g.strokeStyle = "#5a3a1a"; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 110, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 86, 0, 7); g.stroke();
        for (let k = 0; k < 12; k++) { g.save(); g.rotate(k * PI / 6); g.beginPath(); g.moveTo(0, -86); g.lineTo(0, -110); g.stroke(); g.restore(); }
        g.fillStyle = "#5a3a1a"; g.font = `700 20px ${BODY}`; g.textAlign = "center"; [["N", 0, -122], ["O", 126, 6], ["S", 0, 136], ["W", -126, 6]].forEach(([s, x, y]) => g.fillText(s, x, y));
        g.beginPath(); for (let k = 0; k < 5; k++) { const a = -PI / 2 + k * 4 * PI / 5; if (k) g.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); else g.moveTo(Math.cos(a) * 60, Math.sin(a) * 60); } g.closePath(); g.stroke(); g.restore();
        para(["Leuchtdauer: etwa drei Stunden"], 690, 430, 17, "#3a2414", 1.3, BODY, "italic");
        para(["Hinweis: Nur unter Aufsicht einer Lehrkraft brauen. · Seite 42"], 60, 660, 14, "#5a3a1a");
        tiny(671, 489);
      }
    })(dg);
    const docTex = ctex(dc), doc = new T.Mesh(new T.PlaneGeometry(DW, DH), new T.MeshStandardMaterial({map: docTex, roughness: .9})); doc.position.set(0, .07, .002); doc.receiveShadow = true; tilt.add(doc);
    // Lupe an einer Stange senkrecht zum Blatt
    const LX = .14, LY = -.0507, RX = .5, RY = .3;
    const pole = rod(V(RX, RY, 0), V(RX, RY, .62), .012, mTrim); tilt.add(pole); pult.push(pole); bakeBy(cG, pult);
    // Marke in Höhe f über dem Blatt: Hier stünde die Linse bei g = f (der Brennpunkt selbst wandert mit der Linse)
    const fRing = ctx.mesh(new T.TorusGeometry(.024, .006, 6, 16), ctx.mat("glow", {color: pal.accent, intensity: 1.2}), false); fRing.position.set(RX, RY, FL); tilt.add(fRing);
    const fTag = txt("g = f", .05, pal.accent); fTag.position.set(RX + .12, RY, FL); tilt.add(fTag);
    const lup = new T.Group(); tilt.add(lup);
    const zoomTex = ctex(dc); zoomTex.center.set(.5, .5);
    // matt: keine graue Spiegelung der Umgebung (Raumstation)
    const zoom = new T.Mesh(new T.CircleGeometry(.165, 48), new T.MeshStandardMaterial({map: zoomTex, roughness: .95, envMapIntensity: .2})); zoom.position.set(LX, LY, 0); lup.add(zoom);
    // fast klares Glas: Das vergrößerte Bild darunter soll nicht grau überdeckt werden (dunkle Sternenkarte)
    const lgl = ctx.mesh(lensGeo(T, .172, .03, .006, {axis: "y"}).rotateX(PI / 2), ctx.mat("glass", {color: "#e8f4ff", opacity: .1}), false); lgl.position.set(LX, LY, .004); lup.add(lgl);
    const lrim = ctx.mesh(new T.TorusGeometry(.176, .013, 8, 48), ST ? mEdge : mTrim, false); lrim.position.set(LX, LY, 0); lup.add(lrim);
    const dir = V(RX - LX, RY - LY, 0).normalize();
    const handle = rod(V(LX, LY, 0).addScaledVector(dir, .185), V(RX, RY, 0).addScaledVector(dir, -.03), .014, ZB || DT ? ctx.mat("darkwood") : mDark); lup.add(handle);
    const clampM = ctx.mesh(new T.CylinderGeometry(.026, .026, .06, 12).rotateX(PI / 2), mTrim, false); clampM.position.set(RX, RY, 0); lup.add(clampM);
    bakeBy(lup, [lrim, clampM, handle], false);
    // Hinweisschild am Pult
    const [pc, pg] = cv(1024, 128), plate = new T.Mesh(new T.PlaneGeometry(.98, .1225), new T.MeshBasicMaterial({map: ctex(pc), toneMapped: false}));
    plate.position.set(0, -.355, .003); tilt.add(plate);
    const CST = [{g: .5 * FL, t: ["g = 0,5 · f  →  B : G = 2", "virtuell · aufrecht · vergrößert"]}, {g: .8 * FL, t: ["g = 0,8 · f  →  B : G = 5", "virtuell · aufrecht · stärker vergrößert"]},
      {g: 1.5 * FL, t: ["g = 1,5 · f  →  B : G = 2", "reell · umgekehrt – keine Lupe mehr!"]}];
    let cS = 0, gC = CST[0].g;
    const drawPlate = () => { pg.fillStyle = ST ? "#0b1a2a" : DT ? "#2a2118" : "#2b1a10"; pg.fillRect(0, 0, 1024, 128); pg.strokeStyle = ST ? "#4FC3F7" : "#c9a24a"; pg.lineWidth = 5; pg.strokeRect(4, 4, 1016, 120);
      const [a, b] = CST[cS].t; pg.textAlign = "center"; pg.textBaseline = "middle"; pg.fillStyle = cS === 2 ? "#ff9a8a" : "#ffe9b0"; pg.font = `700 40px ${BODY}`; pg.fillText(a, 512, 44);
      pg.fillStyle = "#f4efe2"; pg.font = `500 32px ${BODY}`; pg.fillText(b, 512, 94); plate.material.map.needsUpdate = true; };
    drawPlate();
    const uc = LX / DW + .5, vc = (LY - .07) / DH + .5;
    const setZoom = () => { lup.position.z = gC; const virt = gC < FL, m = clamp(virt ? FL / (FL - gC) : FL / (gC - FL), 1, 14);
      zoomTex.repeat.set(.33 / (m * DW), .33 / (m * DH)); zoomTex.offset.set(uc - .5, vc - .5); zoomTex.rotation = virt ? 0 : PI;
      zoom.material.opacity = 1; zoom.material.color.setScalar(clamp(Math.abs(gC - FL) / .04, .35, 1)); };
    setZoom();
    ctx.tick(dt => { const g0 = gC; gC = ease(gC, CST[cS].g, dt, 2.2); if (gC !== g0) setZoom(); });
    ctx.obstacleBox(S.C.x + .5, -2.4, 1.0, 1.3);
    ctx.exhibit(cG, {label: "Lupe", sub: "anklicken: Abstand ändern", title: "Die Lupe", dist: 1.9, pitch: -.3,
      onClick: () => { cS = (cS + 1) % 3; drawPlate(); },
      get text(){ return [
        "**Lupe:** Die Sammellinse ist näher am Blatt als ihre Brennweite (**g < f**). Du siehst ein **virtuelles, aufrechtes, vergrößertes** Bild – hier bei g = 0,5 · f doppelt so groß. Auf einem Schirm auffangen kannst du dieses Bild nicht.",
        "Die Lupe ist jetzt weiter vom Blatt entfernt, aber immer noch innerhalb der Brennweite (g = 0,8 · f). Das virtuelle Bild wird **noch größer** – hier 5-mal so groß wie die Schrift (B : G = b : g).",
        "Jetzt ist **g > f**: Die Linse wirkt **nicht mehr als Lupe**. Sie erzeugt ein **reelles, umgekehrtes** Bild – die Schrift steht auf dem Kopf und ist seitenvertauscht. Eine Lupe hältst du deshalb immer innerhalb ihrer Brennweite."][cS]; }});
  }

  /* ===================================================================
     D: Kamera mit Mattscheibe (links vorne) – Lochkamera, Objektiv, Scharfstellen
     =================================================================== */
  {
    const dG = new T.Group(); ctx.add(dG, S.D.x + .1, 0, S.D.z + .05); dG.rotation.y = 1.9;
    const TTD = .78, K = 1.5, AXR = .32, FD = .3, XSI = -.68, GO = .3;   // Tischhöhe, Maßstab des Aufbaus, Achse über dem Tisch, Brennweite, Mattscheibe (innen), Gegenstandshöhe
    // Tisch
    const top = ctx.box(2.65, .05, .78, mWood); top.position.set(.08, TTD - .025, 0);
    const apron = ctx.box(2.5, .1, .66, mDark); apron.position.set(.08, TTD - .1, 0);
    const dStat = [top, apron, legs([[-1.15, -.31], [1.3, -.31], [-1.15, .31], [1.3, .31]], TTD - .05, mDark, true, .045)]; dG.add(...dStat);
    if (ST) { const e = ctx.box(2.67, .02, .8, mEdge); e.position.set(.08, TTD - .055, 0); dG.add(e); noCast(e); }
    // Aufbau (vergrößert): Kamera mit Balgen, Objektiv bzw. Lochblende, Mattscheibe; Gegenstand auf einem Schlitten
    const rig = new T.Group(); rig.position.set(0, TTD, 0); rig.scale.setScalar(K); dG.add(rig);
    const bellT = (() => { const [c, g] = cv(64, 16); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#8a8a8a"; g.fillRect(i * 8, 0, 8, 16); } const t = ctex(c); t.wrapS = T.RepeatWrapping; return t; })();
    const camCol = new T.MeshStandardMaterial({map: bellT, color: ZB ? 0x5a3a24 : ST ? 0x3a4656 : 0x7a2a22, roughness: ST ? .45 : .9, metalness: ST ? .4 : 0});
    const trackA = ctx.box(.78, .03, .22, mDark); trackA.position.set(XSI + .3, .015, 0);
    const trackB = ctx.box(.62, .02, .12, mTrim); trackB.position.set(.62, .01, 0);
    const rear = ctx.box(.05, .5, .5, mWood); rear.position.set(XSI - .025, AXR, 0);
    const rearFoot = ctx.box(.12, AXR - .25, .32, mTrim); rearFoot.position.set(XSI - .025, (AXR - .25) / 2, 0);
    const ground = new T.Mesh(new T.PlaneGeometry(.42, .42), ctx.mat("color", {color: ST ? "#a9b7c4" : "#bdbcae", rough: .95})); ground.position.set(XSI - .051, AXR, 0); ground.rotation.y = -PI / 2;
    const inner = new T.Mesh(new T.PlaneGeometry(.44, .44), mScreen); inner.position.set(XSI + .001, AXR, 0); inner.rotation.y = PI / 2;
    rig.add(trackA, trackB, rear, rearFoot, ground, inner); dStat.push(trackA, trackB, rear, rearFoot); bakeBy(dG, dStat);
    // Balgen (oben, unten, Rückwand) als ein Mesh der Länge 1, das in x gestreckt wird
    const bell = ctx.mesh(mergeGeos(T, [[.22, 0, .02, .46], [-.22, 0, .02, .46], [0, -.225, .44, .02]].map(([y, z, h, d]) => new T.BoxGeometry(1, h, d).translate(0, AXR + y, z))), camCol); rig.add(bell);
    const front = new T.Group(); rig.add(front);
    const fb = ctx.box(.04, .48, .48, mWood); fb.position.y = AXR; const ff = ctx.box(.1, AXR - .24, .26, mTrim); ff.position.y = (AXR - .24) / 2;
    const tube = ctx.mesh(new T.CylinderGeometry(.08, .08, .14, 24, 1, false, PI / 2, PI).rotateZ(-PI / 2), mTrim, false); tube.position.set(.09, AXR, 0);
    const tubeIn = new T.Mesh(new T.CylinderGeometry(.078, .078, .14, 24, 1, true, PI / 2, PI).rotateZ(-PI / 2), new T.MeshStandardMaterial({color: 0x111111, roughness: .8, side: T.BackSide})); tubeIn.position.copy(tube.position);
    const lensD = ctx.mesh(lensGeo(T, .07, .036, .008), mGlass, false); lensD.position.set(.1, AXR, 0);
    const cap = ctx.cyl(.083, .083, .012, ctx.mat("color", {color: "#141414", rough: .7}), 24); cap.rotation.z = PI / 2; cap.position.set(.165, AXR, 0);
    const hole = ctx.glow(0xffffff, .03); hole.position.set(.175, AXR, 0);
    front.add(fb, ff, tube, tubeIn, lensD, cap, hole); noCast(cap, lensD); bakeBy(front, [ff, tube]);
    // Gegenstand (Weltvariante): oben und unten deutlich verschieden, damit man die Umkehrung sieht
    const obj = new T.Group(); rig.add(obj);
    const sled = ctx.box(.16, AXR - GO / 2, .16, mTrim); sled.position.y = (AXR - GO / 2) / 2; obj.add(sled);
    let objCol;
    if (ZB) { objCol = "#B98CFF"; const cr = ctx.mesh(new T.OctahedronGeometry(.08, 0), ctx.mat("crystal", {color: "#9a6bff", intensity: 1.1})); cr.scale.set(1, 1.6, 1); cr.position.y = AXR + .02;
      const cup = ctx.cyl(.07, .05, .08, mTrim, 16); cup.position.y = AXR - .11; obj.add(cr, cup); bakeBy(obj, [sled, cup]); ctx.tick((dt, t) => { cr.rotation.y = t * .5; }); }
    else if (ST) { objCol = "#7FD8FF"; const hull = ctx.mat("plastic", {color: "#e8eef5"});
      const body = ctx.cyl(.045, .045, .16, hull, 18); body.position.y = AXR - .01; const nose = ctx.mesh(new T.ConeGeometry(.045, .08, 18), ctx.mat("plastic", {color: "#ff5c5c"})); nose.position.y = AXR + .11;
      const fins = [0, 1].map(i => { const f = ctx.box(i ? .14 : .012, .07, i ? .012 : .14, ctx.mat("plastic", {color: "#ff5c5c"})); f.position.y = AXR - .065; return f; });
      const jet = ctx.mesh(new T.ConeGeometry(.03, .06, 12).rotateX(PI), ctx.mat("glow", {color: "#7FD8FF", intensity: 2}), false); jet.position.y = AXR - .12; obj.add(body, nose, ...fins, jet); bakeBy(obj, [nose, ...fins]); }
    else { objCol = "#FFC070"; const b = ctx.cyl(.07, .08, .05, mTrim, 16); b.position.y = AXR - .125; const fnt = ctx.sphere(.06, mTrim, 16); fnt.scale.y = .7; fnt.position.y = AXR - .07;
      const ch = ctx.cyl(.032, .04, .15, ctx.mat("glass", {color: "#fff4dc", opacity: .35}), 16); ch.position.y = AXR + .05; const fl = ctx.sphere(.012, mFlame, 8); fl.scale.y = 2; fl.position.y = AXR + .02;
      obj.add(b, fnt, ch, fl); noCast(fl, ch); bakeBy(obj, [sled, b, fnt]); }
    const og = ctx.glow(objCol, .5); og.position.y = AXR; obj.add(og);
    // Bild auf der Mattscheibe (scharf und unscharf, umgekehrt)
    const objImg = blurPx => { const [c, g] = cv(256, 256); g.save(); g.translate(128, 128); g.rotate(PI);   // umgekehrt und seitenvertauscht
      const paint = () => {
        if (ZB) { g.fillStyle = "#b98cff"; g.beginPath(); g.moveTo(0, -126); g.lineTo(68, -17); g.lineTo(0, 92); g.lineTo(-68, -17); g.closePath(); g.fill();
          g.fillStyle = "#e6d6ff"; g.beginPath(); g.moveTo(0, -126); g.lineTo(68, -17); g.lineTo(0, -10); g.closePath(); g.fill();
          g.fillStyle = "#c9a24a"; g.beginPath(); g.moveTo(-60, 60); g.lineTo(60, 60); g.lineTo(43, 128); g.lineTo(-43, 128); g.closePath(); g.fill(); }
        else if (ST) { g.fillStyle = "#e8eef5"; g.fillRect(-38, -60, 76, 137); g.fillStyle = "#ff5c5c"; g.beginPath(); g.moveTo(0, -128); g.lineTo(38, -60); g.lineTo(-38, -60); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(-38, 30); g.lineTo(-64, 92); g.lineTo(-38, 86); g.closePath(); g.fill(); g.beginPath(); g.moveTo(38, 30); g.lineTo(64, 92); g.lineTo(38, 86); g.closePath(); g.fill();
          g.fillStyle = "#7fd8ff"; g.beginPath(); g.moveTo(-24, 80); g.lineTo(24, 80); g.lineTo(0, 128); g.closePath(); g.fill(); g.fillStyle = "#4FC3F7"; g.beginPath(); g.arc(0, -20, 14, 0, 7); g.fill(); }
        else { g.fillStyle = "#b8862b"; g.fillRect(-60, 86, 120, 40); g.beginPath(); g.ellipse(0, 70, 54, 36, 0, 0, 7); g.fill(); g.fillStyle = "rgba(255,244,220,.45)"; g.fillRect(-28, -86, 56, 136);
          const r = g.createRadialGradient(0, 0, 2, 0, -10, 60); r.addColorStop(0, "#fff"); r.addColorStop(.4, "#ffd27a"); r.addColorStop(1, "rgba(255,170,60,0)"); g.fillStyle = r; g.beginPath(); g.ellipse(0, -10, 26, 52, 0, 0, 7); g.fill(); }
      };
      if (!blurPx) paint(); else { g.globalAlpha = .16; for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; g.save(); g.translate(Math.cos(a) * blurPx, Math.sin(a) * blurPx); paint(); g.restore(); } }
      g.restore(); return ctex(c); };
    const imgSharp = new T.MeshBasicMaterial({map: objImg(0), transparent: true, depthWrite: false, toneMapped: false}), imgBlur = new T.MeshBasicMaterial({map: objImg(16), transparent: true, depthWrite: false, toneMapped: false});
    const pS = new T.Mesh(new T.PlaneGeometry(1, 1), imgSharp), pB = new T.Mesh(new T.PlaneGeometry(1, 1), imgBlur);
    for (const p of [pS, pB]) { p.rotation.y = -PI / 2; p.position.set(XSI - .053, AXR, 0); p.renderOrder = 2; rig.add(p); }
    pB.position.x = XSI - .054;
    // dasselbe Bild auf der Innenseite der Mattscheibe (von innen gesehen seitenverkehrt, daher Textur gespiegelt)
    const mirGeo = new T.PlaneGeometry(1, 1), muv = mirGeo.attributes.uv; for (let i = 0; i < muv.count; i++) muv.setX(i, 1 - muv.getX(i));
    const pS2 = new T.Mesh(mirGeo, imgSharp), pB2 = new T.Mesh(mirGeo.clone(), imgBlur);
    for (const p of [pS2, pB2]) { p.rotation.y = PI / 2; p.position.set(XSI + .003, AXR, 0); p.renderOrder = 2; rig.add(p); }
    pB2.position.x = XSI + .004;
    const rTop = rays(ctx, rig, "#FFCF6B", .005, {halo: false}), rBot = rays(ctx, rig, "#7FD8FF", .005, {halo: false});
    // Hinweisschild: Auge und Kamera im Vergleich (schräg auf der Tischkante, rechts neben dem Weg der Objektivstandarte)
    const [qc, qg] = cv(1024, 320), sign = new T.Mesh(new T.PlaneGeometry(1.0, .3125), new T.MeshBasicMaterial({map: ctex(qc), toneMapped: false}));
    sign.position.set(.45, TTD + .125, .29); sign.rotation.x = -1.0; dG.add(sign);
    const sn = V(0, Math.sin(1.0), Math.cos(1.0)), sBack = ctx.box(1.03, .33, .014, mTrim); sBack.position.copy(sign.position).addScaledVector(sn, -.009); sBack.rotation.x = -1.0;
    const sLip = ctx.box(1.03, .04, .06, mTrim); sLip.position.set(.45, TTD + .02, .39); dG.add(sBack, sLip); bake(dG, [sBack, sLip], mTrim);
    const DST = [{g: 1.0, pin: 1, s: "Lochkamera: lichtschwaches Bild"}, {g: 1.0, pin: 0, s: "Mit Objektiv: helles, scharfes Bild"}, {g: .6, pin: 0, s: "Scharfstellen: Bildweite vergrößert"}];
    let dS = 0;
    const drawSign = () => { qg.fillStyle = ST ? "#0b1a2a" : DT ? "#2a2118" : "#24160e"; qg.fillRect(0, 0, 1024, 320); qg.strokeStyle = ST ? "#4FC3F7" : "#c9a24a"; qg.lineWidth = 6; qg.strokeRect(5, 5, 1014, 310);
      qg.textAlign = "center"; qg.textBaseline = "middle"; qg.fillStyle = pal.accent; qg.font = `700 42px ${BODY}`; qg.fillText("Auge und Fotoapparat", 512, 46);
      qg.fillStyle = "#f4efe2"; qg.font = `500 33px ${BODY}`; ["Hornhaut + Linse ↔ Objektiv", "Iris mit Pupille ↔ Blende", "Netzhaut ↔ Bildsensor (hier: Mattscheibe)"].forEach((s, i) => qg.fillText(s, 512, 100 + i * 42));
      qg.fillStyle = ST ? "#4FC3F7" : "#c9a24a"; qg.fillRect(120, 226, 784, 3);
      qg.fillStyle = "#ffe9b0"; qg.font = `700 38px ${BODY}`; qg.fillText(DST[dS].s, 512, 270); sign.material.map.needsUpdate = true; };
    drawSign();
    const bOfD = g => FD * g / (g - FD);
    let xC = XSI + bOfD(1.0), xObj = xC + 1.0, pin = 1;
    const drawD = () => {
      const g = xObj - xC, bNeed = bOfD(g), bAct = xC - XSI, half = GO / 2;
      front.position.x = xC - .1; obj.position.x = xObj;
      const len = (xC - .12) - XSI; bell.scale.x = Math.max(.01, len); bell.position.x = XSI + len / 2; bellT.repeat.x = len / .05;
      cap.position.y = AXR + .26 * (1 - pin); cap.visible = pin > .02; hole.visible = pin > .5; lensD.scale.setScalar(Math.max(.001, 1 - pin));
      // Projektionszentrum: Linsenmitte bzw. (Lochkamera) das Loch im Deckel
      const cP = xC + .075 * pin, gP = xObj - cP, bP = cP - XSI;
      const sharp = clamp(1 - Math.abs(bAct - bNeed) / .04, 0, 1), B = GO * bP / gP;
      for (const p of [pS, pB, pS2, pB2]) p.scale.set(B, B, 1);
      imgSharp.opacity = sharp * (1 - pin); imgBlur.opacity = (1 - sharp) * .8 * (1 - pin) + .4 * pin;
      const xs = XSI + .002, T0 = V(xObj, AXR + half), B0 = V(xObj, AXR - half);
      if (pin > .5) { rTop.set([[T0, V(cP, AXR), V(xs, AXR - half * (cP - xs) / gP)]]); rBot.set([[B0, V(cP, AXR), V(xs, AXR + half * (cP - xs) / gP)]]); }
      else for (const [r, P0, sg] of [[rTop, T0, 1], [rBot, B0, -1]]) {
        const I = V(xC - bNeed, AXR - sg * half * bNeed / g);
        r.set([-.055, 0, .055].map(h => { const L = V(xC, AXR + h); return [P0, L, V(xs, L.y + (I.y - L.y) * (xs - L.x) / (I.x - L.x))]; })); }
    };
    drawD();
    const objLight = ctx.light(objCol, 1.4, 2.6, 0, 0, 0);
    const placeLight = () => { if (objLight) { dG.updateMatrixWorld(); objLight.position.copy(rig.localToWorld(V(xObj, AXR + .1, .25))); } };
    placeLight();
    ctx.tick((dt, t) => { const s = DST[dS], x0 = xObj, c0 = xC, p0 = pin;
      const xcT = XSI + bOfD(s.g), xoT = xcT + s.g;
      xObj = ease(xObj, xoT, dt, 1.8); if (Math.abs(xObj - xoT) < .02) xC = ease(xC, xcT, dt, 1.6);
      pin = ease(pin, s.pin, dt, 3);
      if (xObj !== x0 || xC !== c0 || pin !== p0) { drawD(); placeLight(); }
      og.scale.setScalar(.45 + .05 * Math.sin(t * 3)); });
    dG.updateMatrixWorld(true);   // unabhängig vom Zusatzlicht: Hindernisse brauchen die aktuelle Lage der Gruppe
    for (const k of [-1.1, -.37, .37, 1.1]) { const p = dG.localToWorld(V(k, 0, 0)); ctx.obstacle(p.x, p.z, .58); }
    ctx.exhibit(dG, {label: "Kamera", sub: "anklicken: Lochkamera – Objektiv – Scharfstellen", title: "Kamera und Auge", dist: 2.3, pitch: -.16,
      onClick: () => { dS = (dS + 1) % 3; drawSign(); },
      get text(){ return [
        "**Lochkamera:** Durch ein kleines Loch fällt von jedem Punkt des Gegenstands nur ein schmales Lichtbündel. Auf der Mattscheibe entsteht ein **umgekehrtes, seitenvertauschtes** Bild – es ist aber sehr lichtschwach.",
        "**Fotoapparat:** Statt des Lochs bündelt eine Sammellinse, das **Objektiv**, viel mehr Licht. Das Bild auf der Mattscheibe (beim Fotoapparat: dem Bildsensor) ist **reell, umgekehrt, verkleinert** und hell – genau wie das Bild auf deiner Netzhaut. Die Lichtmenge regelt die **Blende**, beim Auge die Iris mit der Pupille.",
        "**Scharfstellen:** Der Gegenstand ist näher gerückt, sein scharfes Bild entsteht weiter hinten. Die Kamera schiebt das Objektiv deshalb weiter von der Mattscheibe weg – sie ändert die **Bildweite**. Das Auge kann das nicht: Es ändert die **Brennweite** seiner Linse (Akkommodation)."][dS]; }});
  }

  /* ===================================================================
     Über dem Gang: Brennglas
     =================================================================== */
  {
    const g = new T.Group(); ctx.add(g, 0, 0, 3.6);
    const YL = Math.min(5.0, H - 1.4), FBG = 1.3, YF = YL - FBG, RB = .6;
    const lens = ctx.mesh(lensGeo(T, RB, .1, .014, {axis: "y", seg: 48}), mGlass, false); lens.position.y = YL;
    const ring = ctx.mesh(new T.TorusGeometry(RB + .02, .03, 8, 64).rotateX(PI / 2), ST ? ctx.mat("steel") : ctx.mat("gold"), false); ring.position.y = YL;
    g.add(lens, ring);
    const rg = []; for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + .5, x = Math.cos(a) * (RB + .02), z = Math.sin(a) * (RB + .02);
      rg.push(rodGeo(V(x, YL, z), V(x * .3, H, z * .3), .01, 6), rodGeo(V(x, YL, z), V(Math.cos(a) * .1, YF - .02, Math.sin(a) * .1), .006, 6)); }
    const rods = ctx.mesh(mergeGeos(T, rg), mTrim, false); g.add(rods);
    const target = ctx.cyl(.12, .12, .012, ctx.mat("paper"), 24); target.position.y = YF - .02; g.add(target);
    const burnM = new T.MeshBasicMaterial({map: R3D.util.glowTex(), color: 0xffa040, transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false});
    const burn = new T.Mesh(new T.CircleGeometry(.12, 24), burnM); burn.rotation.x = -PI / 2; burn.position.y = YF - .012; g.add(burn);
    // Lichtquelle oben: Raumschiff/Detektei eine helle Lichtöffnung, Zauberschule ein warm leuchtender Lichtkristall im Runenring (statt einer Sonne im Nachthimmel)
    const crystalT = ZB ? (() => { const [c, q] = cv(512, 512), rnd = ctx.rand; q.translate(256, 256);
      const r = q.createRadialGradient(0, -20, 8, 0, 0, 200); r.addColorStop(0, "#fff4d6"); r.addColorStop(.55, "#f4cf82"); r.addColorStop(1, "#b97a34");
      q.fillStyle = r; q.beginPath(); q.arc(0, 0, 202, 0, 7); q.fill();
      const hex = (rr, a0) => { q.beginPath(); for (let k = 0; k <= 6; k++) { const a = a0 + k * PI / 3; q[k ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); } q.stroke(); };
      q.strokeStyle = "rgba(255,255,255,.55)"; q.lineWidth = 3; hex(72, PI / 6); hex(150, 0);
      for (let k = 0; k < 6; k++) { const a1 = PI / 6 + k * PI / 3, a2 = k * PI / 3; q.beginPath(); q.moveTo(Math.cos(a1) * 72, Math.sin(a1) * 72); q.lineTo(Math.cos(a2) * 150, Math.sin(a2) * 150); q.lineTo(Math.cos(a2) * 202, Math.sin(a2) * 202); q.stroke(); }
      q.fillStyle = "#24160c"; q.beginPath(); q.arc(0, 0, 256, 0, 7); q.arc(0, 0, 204, 0, 7, true); q.fill();
      q.strokeStyle = "#E3B341"; q.lineWidth = 4; for (const rr of [208, 250]) { q.beginPath(); q.arc(0, 0, rr, 0, 7); q.stroke(); }
      q.lineWidth = 4.5; q.lineCap = "round"; q.shadowColor = "#ffcf6b"; q.shadowBlur = 8;
      for (let k = 0; k < 20; k++) { q.save(); q.rotate(k / 20 * PI * 2); q.translate(0, -229); const s = 12, ty = (rnd() * 5) | 0; q.beginPath(); q.moveTo(0, -s); q.lineTo(0, s);
        if (ty === 0) { q.moveTo(0, -s); q.lineTo(8, -4); q.moveTo(0, -2); q.lineTo(8, 6); } else if (ty === 1) { q.moveTo(-7, -s); q.lineTo(7, s); }
        else if (ty === 2) { q.moveTo(0, -4); q.lineTo(-8, -s); q.moveTo(0, -4); q.lineTo(8, -s); } else if (ty === 3) { q.moveTo(0, -s); q.lineTo(8, -2); q.lineTo(0, 6); }
        else { q.moveTo(-7, -6); q.lineTo(7, 2); q.moveTo(-7, 2); q.lineTo(7, -6); }
        q.stroke(); q.restore(); }
      return ctex(c); })() : null;
    const sky = new T.Mesh(new T.CircleGeometry(RB + .15, 40), new T.MeshBasicMaterial(ZB ? {map: crystalT, color: 0xf0e2c8, toneMapped: false} : {color: ST ? 0xd8f4ff : 0xfff1c8, toneMapped: false}));
    sky.rotation.x = PI / 2; sky.position.y = H - .03; g.add(sky);
    const skyRing = ctx.mesh(new T.TorusGeometry(RB + .17, .04, 6, 48).rotateX(PI / 2), ST ? mEdge : mTrim, false); skyRing.position.y = H - .05; g.add(skyRing);
    bakeBy(g, [rods, skyRing], false);
    const colM = new T.MeshBasicMaterial({color: ST ? 0xbff0ff : 0xffe7b0, transparent: true, opacity: .06, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false});
    const col = new T.Mesh(new T.CylinderGeometry(RB, RB, H - YL - .05, 32, 1, true), colM); col.position.y = (H + YL) / 2; g.add(col);
    const cone = new T.Mesh(new T.ConeGeometry(RB, FBG, 32, 1, true).rotateX(PI), colM.clone()); cone.material.opacity = .1; cone.position.y = YL - FBG / 2; g.add(cone);
    const lines = []; for (const [x, z] of [[-.45, 0], [-.22, 0], [0, 0], [.22, 0], [.45, 0], [0, -.4], [0, .4]]) lines.push([V(x, H - .05, z), V(x, YL, z), V(0, YF, 0)]);
    rays(ctx, g, ST ? "#c9f6ff" : "#ffe9a8", .0045, {lines});
    const fg = ctx.glow(0xffd27a, .25); fg.position.y = YF; g.add(fg);
    const ft = txt("F", .1, pal.accent); ft.position.set(.22, YF + .08, 0); g.add(ft);
    const smoke = new T.Points(new T.BufferGeometry().setAttribute("position", new T.Float32BufferAttribute(new Array(36 * 3).fill(0), 3)),
      new T.PointsMaterial({map: R3D.util.glowTex(), color: 0xcfc6b8, size: .12, transparent: true, opacity: 0, depthWrite: false}));
    g.add(smoke); const sp = smoke.geometry.attributes.position, sd = [...Array(36)].map(() => [ctx.rand() - .5, ctx.rand(), ctx.rand() - .5]);
    noCast(g);
    const fl = ctx.light(0xffc070, 1.2, 4, 0, YF - .3, 3.6);
    let burnT = 0;
    ctx.tick((dt, t) => { burnT = Math.max(0, burnT - dt); const k = clamp(burnT / 2, 0, 1);
      fg.scale.setScalar(.25 + .5 * k + .03 * Math.sin(t * 9)); burnM.opacity = .45 + .5 * k; burnM.color.setHSL(.07 - .04 * k, 1, .55);
      if (fl) fl.intensity = 1.2 + 6 * k; smoke.material.opacity = .45 * k;
      for (let i = 0; i < 36; i++) { const [a, b, c] = sd[i], h = ((t * .25 + b) % 1); sp.setXYZ(i, a * .15 * (1 + h * 3), YF + h * .9, c * .15 * (1 + h * 3)); } sp.needsUpdate = true;
      ring.rotation.y = t * .1;
      // „F“ dreht sich zum Betrachter (nie spiegelverkehrt) und steht seitlich neben dem Brennpunkt
      const cam = R3D.camera; if (cam) { const th = Math.atan2(cam.position.x - g.position.x, cam.position.z - g.position.z); ft.rotation.y = th; ft.position.set(Math.cos(th) * .22, YF + .08, -Math.sin(th) * .22); } });
    ctx.exhibit(g, {label: "Brennglas", sub: "anklicken", title: "Das Brennglas – warum F „Brennpunkt“ heißt", dist: 2.4, pitch: .55,
      onClick: () => { burnT = 6; },
      text: "Ein Brennglas ist eine große **Sammellinse**. Paralleles Licht von oben wird im **Brennpunkt F** gebündelt. Dort ist das Licht so konzentriert, dass Papier zu glimmen beginnt – daher der Name **Brennpunkt**. Der Abstand von F zur Linsenmitte ist die **Brennweite f**.\n\nAchtung: Schau nie durch eine Linse in die Sonne!"});
  }

  /* ===================================================================
     Vitrine: Linsenformen (rechts, zwischen Station 2 und der Lupe)
     =================================================================== */
  {
    const vG = new T.Group(); ctx.add(vG, 6.7, 0, .1); vG.rotation.y = -PI / 2;
    const ped = ctx.box(1.02, .95, .46, mBase); ped.position.y = .475; vG.add(ped);
    const lid = ctx.box(1.08, .04, .52, mTrim); lid.position.y = .97; vG.add(lid);
    const caseM = ctx.mat("glass", {color: "#e8f4ff", opacity: .14});
    const glassBox = new T.Mesh(new T.BoxGeometry(1.0, .58, .44), caseM); glassBox.position.y = 1.28; vG.add(glassBox);
    const capB = ctx.box(1.04, .03, .48, mTrim); capB.position.y = 1.585; vG.add(capB);
    if (ST) { const e = ctx.box(1.03, .02, .47, mEdge); e.position.y = .93; vG.add(e); }
    const YV = 1.3, LRV = .13, demo = [], vStat = [ped, lid, capB];
    [[-.25, true, "Sammellinse\nin der Mitte dicker"], [.25, false, "Zerstreuungslinse\nin der Mitte dünner"]].forEach(([x, conv, name]) => {
      const t0 = conv ? .07 : .014, t1 = conv ? .01 : .065;
      const ln = ctx.mesh(lensGeo(T, LRV, t0, t1), ctx.mat("glass", {color: "#bfe6ff", opacity: .5}), false); ln.position.set(x, YV, 0);
      const rg = ctx.mesh(new T.TorusGeometry(LRV + .006, .006, 6, 32).rotateY(PI / 2), mTrim, false); rg.position.set(x, YV, 0);
      const post = ctx.cyl(.008, .012, YV - LRV - .99, mTrim, 8); post.position.set(x, (YV - LRV + .99) / 2, 0);
      const fx = conv ? .14 : -.14, fd = ctx.glow(pal.accent, .06); fd.position.set(x + fx, YV, .002);
      vG.add(ln, rg, post, fd); vStat.push(ln, rg, post);
      const r = rays(ctx, vG, flameHex, .0035, {halo: false}), d = conv ? null : rays(ctx, vG, flameHex, .0025, {dash, dashLen: .02, halo: false});
      demo.push({x, conv, r, d, fx});
    });
    bakeBy(vG, vStat);
    {
      const [tc, tg] = cv(1024, 160), tags = new T.Mesh(new T.PlaneGeometry(1.0, .156), new T.MeshBasicMaterial({map: ctex(tc), transparent: true, depthWrite: false, toneMapped: false}));
      tg.textAlign = "center"; tg.textBaseline = "middle";
      // dunkles Schildchen hinter jeder Beschriftung (in der hellen Raumstation sonst kaum lesbar)
      tg.fillStyle = "rgba(10,10,16,.8)"; for (const x of [256, 768]) { tg.beginPath(); tg.roundRect(x - 236, 8, 472, 144, 18); tg.fill(); }
      [[256, "Sammellinse", "in der Mitte dicker"], [768, "Zerstreuungslinse", "in der Mitte dünner"]].forEach(([x, a, b]) => { tg.fillStyle = pal.accent; tg.font = `700 44px ${BODY}`; tg.fillText(a, x, 50);
        tg.fillStyle = "#f4efe2"; tg.font = `500 36px ${BODY}`; tg.fillText(b, x, 108); });
      tags.position.set(0, 1.075, .2); vG.add(tags);
    }
    noCast(vG);
    let k = 1, run = 0;
    const drawV = () => { for (const o of demo) { const hs = [-.08, -.04, 0, .04, .08], x0 = o.x - .22, x1 = o.x + .22, lines = [], back = [];
      for (const h of hs) { const A = V(x0, YV + h), L = V(o.x, YV + h), Fp = V(o.x + o.fx, YV), dir = o.conv ? Fp.clone().sub(L) : L.clone().sub(Fp);
        const E = L.clone().addScaledVector(dir, (x1 - o.x) / dir.x), seg = k < .5 ? [A, A.clone().lerp(L, k * 2)] : [A, L, L.clone().lerp(E, (k - .5) * 2)];
        lines.push(seg); if (!o.conv && k > .5 && h) back.push([L, Fp]); }
      o.r.set(lines); if (o.d) o.d.set(back); } };
    drawV();
    ctx.tick(dt => { if (run > 0) { run -= dt; k = clamp(1 - run / 1.6, 0, 1); drawV(); } });
    ctx.obstacleBox(6.7, .1, .55, 1.1);
    ctx.exhibit(vG, {label: "Linsenformen", sub: "anklicken: Licht einschalten", title: "Sammellinse und Zerstreuungslinse", dist: 1.9, pitch: -.12,
      onClick: () => { run = 1.6; k = 0; drawV(); },
      text: "Die **Sammellinse** (links) ist in der Mitte dicker als am Rand. Paralleles Licht wird hinter ihr im **Brennpunkt F** gebündelt.\n\nDie **Zerstreuungslinse** (rechts) ist in der Mitte dünner als am Rand. Paralleles Licht läuft hinter ihr **auseinander** – so, als käme es von einem Punkt vor der Linse (gestrichelt). Zerstreuungslinsen helfen bei Kurzsichtigkeit, Sammellinsen bei Weitsichtigkeit."});
  }

  /* ===================================================================
     Wandtafeln (über den Stationen)
     =================================================================== */
  ctx.wallBoard("left", 6.75, 3.65, 3.2, 2.1, "Sammellinse und Brennpunkt", ["Sammellinse: in der Mitte dicker als am Rand", "Parallelstrahl → nach der Linse durch F",
    "Mittelpunktstrahl → geht geradeaus weiter", "Brennpunktstrahl → danach parallel zur Achse", "Brennweite f: Abstand Brennpunkt – Linsenmitte"]);
  ctx.wallBoard("right", 2.25, 3.65, 3.2, 2.1, "Bilder an der Sammellinse", ["g > 2f: verkleinert, reell, umgekehrt (Fotoapparat)", "g = 2f: gleich groß, reell, umgekehrt",
    "f < g < 2f: vergrößert, reell, umgekehrt (Beamer)", "g < f: vergrößert, virtuell, aufrecht (Lupe)"]);
  ctx.wallBoard("left", -2.25, 3.65, 3.2, 2.1, "Abbildungsmaßstab", ["B : G = b : g", "G, B: Gegenstands- und Bildgröße", "g, b: Gegenstands- und Bildweite",
    "Beispiel: G = 5 cm, g = 20 cm, b = 28 cm", "→ B = G · b : g = 7 cm", "Reelles Bild: auf einem Schirm auffangbar"]);
  ctx.wallBoard("right", -6.75, 3.65, 3.2, 2.1, "Das Auge – ein optisches System", ["Hornhaut und Linse bündeln das Licht", "Netzhautbild: reell, umgekehrt, verkleinert",
    "Akkommodation: Die Linse ändert ihre Wölbung", "Kurzsichtig → Zerstreuungslinse", "Weitsichtig → Sammellinse"]);
};
})();
