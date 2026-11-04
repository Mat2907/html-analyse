/* ---------- 20_beweg1.js ---------- */
/* =====================================================================
   Raum · Geschwindigkeit und Geschwindigkeitspfeil (Kap. 3.1–3.3)
   Mittelstück: ovale Bahn mit Fahrzeug (Besen / Gleiter / Draisine) und mitfahrendem Geschwindigkeitspfeil,
                zwei Lichtschranken, Stoppuhr, Fahrhebel und Anzeigetafel (v = Δs : Δt, ganze Runde → Durchschnitt);
                Diagramm-Trainer „Fahr nach Diagramm“ (3 Ziele, das Fahrzeug fährt dabei auf der Bahn mit)
   A: t-s-Diagramm, das live mitzeichnet · B: Ball prallt von der Wand ab (v_vorher + Δv = v_nachher)
   C: Tachometer mit zwei Skalen (m/s ↔ km/h) · D: Kurvenfahrt – Δv zeigt zur Kreismitte
   Luftraum über dem Gang: Flugmodell (Papierflieger / Drohne / Luftschiff) mit Geschwindigkeitspfeil
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
const COL = {vor: "#3d8bff", dv: "#ff4b3a", nach: "#2fd27a"};      // v (vorher) · Δv · v (nachher) – in allen Welten gleich
const TAU = Math.PI * 2;
const de = (x, d = 2) => x.toFixed(d).replace(".", ",");
const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

/* ---------- Weltabhängige Farben für Anzeigen ---------- */
function look(ctx){
  const k = ctx.kit, w = ctx.world;
  if (w === "sterne") return {bg: "#061527", fg: "#eaf6ff", acc: "#FFE81F", acc2: "#4FC3F7", dim: "#8fb4cc", grid: "rgba(79,195,247,.2)", tf: k.font, bf: k.fontBody,
    frame: "steel", body: "metal", face: "#08192b", ink: "#d8f1ff", kmh: "#FFE81F", ms: "#4FC3F7", scan: true};
  if (w === "detektiv") return {bg: "#16201b", fg: "#f3e6cc", acc: "#E0A86A", acc2: "#8fd1bf", dim: "#b3a68c", grid: "rgba(243,230,204,.14)", tf: k.font, bf: k.fontBody,
    frame: "brass", body: "darkwood", face: "#f2e8d2", ink: "#2a2118", kmh: "#8a2a1e", ms: "#1f4466", speck: true};
  return {bg: "#1b221e", fg: "#f4ecd8", acc: "#E3B341", acc2: "#a9c4ff", dim: "#aab3a2", grid: "rgba(244,236,216,.13)", tf: k.font, bf: k.fontBody,
    frame: "brass", body: "darkwood", face: "#f1e4c4", ink: "#2b1a10", kmh: "#8a2a14", ms: "#1f4a8a", speck: true};
}

/* ---------- Schrift mit Tiefstellung: "v_{vorher}" ---------- */
function rt(g, s, x, y, size, font, align = "left", weight = 600, measure = false){
  const parts = []; String(s).replace(/_\{([^}]*)\}|[^_]+|_/g, (m, sub) => { parts.push(sub != null ? [sub, 1] : [m, 0]); return m; });
  const fN = `${weight} ${size}px ${font}`, fS = `${weight} ${Math.round(size * .64)}px ${font}`;
  let w = 0; for (const [t, b] of parts) { g.font = b ? fS : fN; w += g.measureText(t).width; }
  if (measure) return w;
  let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; const al = g.textAlign; g.textAlign = "left";
  for (const [t, b] of parts) { g.font = b ? fS : fN; g.fillText(t, cx, y + (b ? size * .26 : 0)); cx += g.measureText(t).width; }
  g.textAlign = al; return w;
}
// Hintergrund einer Anzeige; mit cache = true wird er nur einmal gezeichnet und danach eingesetzt (für oft neu gezeichnete Anzeigen)
function panel(g, W, H, L, cache = false){
  if (cache) { const pc = L._pc || (L._pc = new Map()), key = W + "x" + H; let c = pc.get(key);
    if (!c) { c = document.createElement("canvas"); c.width = W; c.height = H; panelDraw(c.getContext("2d"), W, H, L); pc.set(key, c); }
    g.drawImage(c, 0, 0); return; }
  panelDraw(g, W, H, L);
}
function panelDraw(g, W, H, L){
  g.fillStyle = L.bg; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * .3, H * .2, 10, W * .5, H * .5, Math.max(W, H) * .8); gr.addColorStop(0, "rgba(255,255,255,.07)"); gr.addColorStop(1, "rgba(0,0,0,.28)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (L.speck) { const r = R3D.util.seeded(W * 7 + H); for (let i = 0; i < W * H / 300; i++) { g.fillStyle = r() < .5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.09)"; g.fillRect(r() * W, r() * H, 2, 2); } }
  if (L.scan) for (let y = 0; y < H; y += 5) { g.fillStyle = "rgba(79,195,247,.04)"; g.fillRect(0, y, W, 2); }
  const m = Math.max(10, W / 70); g.strokeStyle = L.acc; g.globalAlpha = .7; g.lineWidth = Math.max(3, W / 300);
  g.beginPath(); g.roundRect(m, m, W - 2 * m, H - 2 * m, m * 1.3); g.stroke(); g.globalAlpha = 1;
}
function cArrow(g, x1, y1, x2, y2, w, col){
  const a = Math.atan2(y2 - y1, x2 - x1), hl = w * 3.2; g.strokeStyle = g.fillStyle = col; g.lineWidth = w;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hl * .8, y2 - Math.sin(a) * hl * .8); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - .42) * hl, y2 - Math.sin(a - .42) * hl); g.lineTo(x2 - Math.cos(a + .42) * hl, y2 - Math.sin(a + .42) * hl); g.closePath(); g.fill();
}

/* ---------- Geometrien zusammenfassen (wenige Zeichenaufrufe) ---------- */
function merge(T, gs){
  let n = 0; for (const g of gs) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2); let o = 0;
  for (const g of gs) { const c = g.attributes.position.count; P.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) N.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) UV.set(g.attributes.uv.array, o * 2); o += c; }
  const m = new T.BufferGeometry(); m.setAttribute("position", new T.BufferAttribute(P, 3)); m.setAttribute("normal", new T.BufferAttribute(N, 3));
  m.setAttribute("uv", new T.BufferAttribute(UV, 2)); m.computeBoundingSphere(); m.computeBoundingBox(); return m;
}
const flat = g => { if (!g.index) return g; const f = g.toNonIndexed(); g.dispose(); return f; };
function bucket(T){
  const parts = new Map(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  const B = {
    put(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0){ const g = flat(geo); g.applyMatrix4(new T.Matrix4().compose(v.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), one));
      if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g); return B; },
    putM(mat, geo, m4){ const g = flat(geo); g.applyMatrix4(m4); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g); return B; },
    box(mat, w, h, d, x, y, z, rx, ry, rz){ return B.put(mat, new T.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    cyl(mat, r1, r2, h, seg, x, y, z, rx, ry, rz){ return B.put(mat, new T.CylinderGeometry(r1, r2, h, seg), x, y, z, rx, ry, rz); },
    build(parent, cast = true){ const out = [];
      for (const [mat, gs] of parts) { const m = new T.Mesh(merge(T, gs), mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); out.push(m); gs.forEach(g => g.dispose()); }
      parts.clear(); return out; }
  };
  return B;
}
// Pfeil als Geometrie (für zusammengefasste „Momentaufnahmen“)
function arrowGeo(T, from, dir, len, th){
  const hl = Math.min(len * .35, th * 7), up = new T.Vector3(0, 1, 0), m = new T.Matrix4().compose(from, new T.Quaternion().setFromUnitVectors(up, dir.clone().normalize()), new T.Vector3(1, 1, 1));
  return [flat(new T.CylinderGeometry(th, th, len - hl, 8).translate(0, (len - hl) / 2, 0)).applyMatrix4(m), flat(new T.ConeGeometry(th * 2.6, hl, 12).translate(0, len - hl / 2, 0)).applyMatrix4(m)];
}

/* ---------- Anzeigen, Beschriftungen, Pfeile ---------- */
function screen(ctx, w, h, px, draw, back = 0, round = false){
  const T = ctx.T, c = document.createElement("canvas"); c.width = Math.round(w >= h ? px : px * w / h); c.height = Math.round(h >= w ? px : px * h / w);
  const g = c.getContext("2d"), tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new T.MeshBasicMaterial({map: tex, toneMapped: false}), m = new T.Mesh(round ? new T.CircleGeometry(w / 2, 72) : new T.PlaneGeometry(w, h), mat);
  if (back) { const b = new T.Mesh(m.geometry, mat); b.rotation.y = Math.PI; b.position.z = -back; m.add(b); }   // Rückseite (gleiches Bild)
  m.redraw = (...a) => { draw(g, c.width, c.height, ...a); tex.needsUpdate = true; };
  m.redraw(); return m;
}
function tag(ctx, s, color, h, font, bgA = .55){
  const T = ctx.T, px = 64, c = document.createElement("canvas"), g = c.getContext("2d"), f = font || ctx.kit.fontBody;
  const tw = rt(g, s, 0, 0, px, f, "left", 700, true); c.width = Math.ceil(tw + px * .75); c.height = Math.round(px * 1.4);
  g.fillStyle = `rgba(8,10,16,${bgA})`; g.beginPath(); g.roundRect(2, 2, c.width - 4, c.height - 4, c.height * .45); g.fill();
  g.fillStyle = color; g.textBaseline = "middle"; rt(g, s, c.width / 2, c.height * .5, px, f, "center", 700);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const sp = new T.Sprite(new T.SpriteMaterial({map: t, transparent: true, depthWrite: false, toneMapped: false}));
  sp.scale.set(h * c.width / c.height, h, 1); sp.renderOrder = 4; return sp;
}
// Unsichtbarer Klickkörper: Klicks zwischen Tisch und Tafel treffen das Exponat
const hitBox = (ctx, parent, w, h, d, x, y, z) => { const m = new ctx.T.Mesh(new ctx.T.BoxGeometry(w, h, d), new ctx.T.MeshBasicMaterial({visible: false})); m.position.set(x, y, z); parent.add(m); return m; };
const arrowIn = (ctx, parent, color, thick) => { const a = ctx.arrow([0, 0, 0], [0, .1, 0], color, thick); parent.add(a); return a; };
const showArrow = (a, p, q, k = 1) => { if (k < .02) { a.visible = false; return; } a.set(p, [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k]); };

/* ---------- Fahrzeuge je Welt: Besen · Gleiter · Draisine (Fahrtrichtung lokal +x) ---------- */
function vehicle(ctx, sc){
  const T = ctx.T, w = ctx.world, g = new T.Group(), body = new T.Group(); g.add(body); body.scale.setScalar(sc);
  const b = bucket(T), wheels = [], sparks = []; let rocker = null, h = 0, top = .3, bank = 0, pump = 0;
  if (w === "zauber") {                                   // Besen
    h = .16; top = .28;
    b.cyl(ctx.mat("wood"), .016, .02, .66, 10, .07, h, 0, 0, 0, -Math.PI / 2);
    b.put(ctx.mat("gold"), new T.SphereGeometry(.024, 12, 8), .41, h, 0);
    b.cyl(ctx.mat("color", {color: "#c9a14a", rough: .95}), .026, .088, .28, 16, -.385, h, 0, 0, 0, -Math.PI / 2);
    const tw = ctx.mat("color", {color: "#8f6d2e", rough: 1});
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; b.cyl(tw, .003, .006, .34, 4, -.43, h + Math.sin(a) * .066, Math.cos(a) * .066, 0, .17 * Math.cos(a), -Math.PI / 2 - .17 * Math.sin(a)); }
    for (const x of [-.248, -.28]) b.put(ctx.mat("brass"), new T.TorusGeometry(.03, .006, 6, 18), x, h, 0, 0, Math.PI / 2, 0);
    for (let i = 0; i < 3; i++) { const s = ctx.glow(0xffd27a, .16 - i * .035); s.position.set(-.62 - i * .11, h, 0); body.add(s); sparks.push(s); }
  } else if (w === "sterne") {                            // Gleiter
    h = .14; top = .25;
    const hull = ctx.mat("plastic", {color: "#e4ebf3"}), dark = ctx.mat("plastic", {color: "#2a3442"}), cyan = ctx.mat("glow", {color: "#4FC3F7", intensity: 1.8});
    b.put(hull, new T.CapsuleGeometry(.036, .22, 4, 12), 0, h, 0, 0, 0, Math.PI / 2);
    b.put(hull, new T.ConeGeometry(.034, .12, 12), .2, h, 0, 0, 0, -Math.PI / 2);
    const ws = new T.Shape(); ws.moveTo(.06, 0); ws.lineTo(-.1, .2); ws.lineTo(-.155, .2); ws.lineTo(-.13, 0); ws.lineTo(-.155, -.2); ws.lineTo(-.1, -.2); ws.closePath();
    b.put(dark, new T.ExtrudeGeometry(ws, {depth: .012, bevelEnabled: false}), 0, h - .004, 0, Math.PI / 2, 0, 0);
    for (const z of [-.19, .19]) b.box(cyan, .05, .008, .014, -.125, h - .01, z);
    b.box(cyan, .17, .006, .012, -.01, h + .037, 0);
    b.put(ctx.mat("glass", {color: "#7fd4ff", opacity: .55}), new T.SphereGeometry(.034, 16, 10).scale(1.7, .8, 1), .07, h + .028, 0);
    b.box(dark, .08, .07, .008, -.12, h + .055, 0, 0, 0, .35);
    for (const z of [-.055, .055]) { b.cyl(ctx.mat("steel"), .019, .024, .08, 12, -.165, h, z, 0, 0, Math.PI / 2); const s = ctx.glow(0x7fdcff, .15); s.position.set(-.215, h, z); body.add(s); sparks.push(s); }
  } else {                                                // Draisine auf Schienen
    h = 0; top = .44;
    const wd = ctx.mat("wood"), dw = ctx.mat("darkwood"), ms = ctx.mat("metal"), br = ctx.mat("brass");
    b.box(wd, .36, .025, .2, 0, .095, 0);
    for (const z of [-.085, .085]) b.box(dw, .38, .03, .02, 0, .072, z);
    for (const x of [-.11, .11]) b.cyl(ms, .007, .007, .17, 6, x, .045, 0, Math.PI / 2, 0, 0);
    for (const z of [-.05, .05]) b.box(dw, .022, .18, .022, 0, .19, z);
    b.box(dw, .07, .05, .17, -.13, .132, 0); b.box(br, .03, .045, .03, .185, .13, 0);
    const lamp = ctx.glow(0xffc47a, .12); lamp.position.set(.205, .13, 0); body.add(lamp); sparks.push(lamp);
    const wg = merge(T, [flat(new T.CylinderGeometry(.045, .045, .02, 18)), flat(new T.BoxGeometry(.084, .026, .008)), flat(new T.BoxGeometry(.008, .026, .084))]);
    for (const x of [-.11, .11]) for (const z of [-.07, .07]) { const m = ctx.mesh(wg, ms, false); m.rotation.x = Math.PI / 2; m.position.set(x, .045, z); body.add(m); wheels.push(m); }
    rocker = new T.Group(); rocker.position.set(0, .285, 0); body.add(rocker);
    const rb = bucket(T); rb.box(br, .34, .016, .016, 0, 0, 0); for (const x of [-.17, .17]) rb.cyl(dw, .008, .008, .18, 8, x, 0, 0, Math.PI / 2, 0, 0); rb.build(rocker, false);
  }
  b.build(body, false);
  g.userData = {h, top: top * sc};
  g.update = (dt, t, v, ds, curve) => {
    if (w !== "detektiv") { body.position.y = Math.sin(t * 3.1) * .012 * sc; const tb = curve ? -(.14 + .06 * v) : 0; bank += (tb - bank) * Math.min(1, dt * 4); body.rotation.x = bank; }
    else { for (const m of wheels) m.rotation.y -= ds / (.045 * sc); pump += ds * 5; rocker.rotation.z = Math.sin(pump) * .32; }
    sparks.forEach((s, i) => { const f = .75 + .25 * Math.sin(t * 19 + i * 2.3) * Math.sin(t * 7 + i); s.material.opacity = Math.min(1, .35 + .5 * f + .15 * v); });
  };
  return g;
}

R3D.rooms.beweg1 = ctx => {
  const T = ctx.T, S = ctx.slots, W = ctx.world, L0 = look(ctx), H = ctx.height || 7;
  const noun = W === "zauber" ? ["der Besen", "Der Besen"] : W === "sterne" ? ["der Gleiter", "Der Gleiter"] : ["die Draisine", "Die Draisine"];
  const mFrame = ctx.mat(L0.frame), mBody = ctx.mat(L0.body);
  // Titelschrift: Die Zier-Schrift der Zauberwelt setzt ein großes „M“ wie „(D“ – dort für solche Titel die Textschrift nehmen
  const TF = s => W === "zauber" && /M/.test(s) ? L0.bf : L0.tf;

  /* =====================================================================
     Mittelstück: Rennbahn mit Lichtschranken, Stoppuhr, Fahrhebel und Anzeigetafel
     ===================================================================== */
  const gC = new T.Group(); ctx.add(gC, S.center.x, 0, S.center.z);
  const gT = new T.Group(); gC.add(gT);
  const A_ = .8, R = .8, LAP = 4 * A_ + 2 * Math.PI * R, TOP = .9, BL = .25, KC = .6, VS = [1, 2, 3], SCL = .3;
  // Bahnpunkt zur Bogenlänge s (Gerade vorne in +x, rechte Kurve, Gerade hinten in −x, linke Kurve)
  const at = (s, o = {}) => { s = ((s % LAP) + LAP) % LAP; o.c = 0;
    if (s < 2 * A_) { o.x = -A_ + s; o.z = R; o.dx = 1; o.dz = 0; return o; }
    s -= 2 * A_; if (s < Math.PI * R) { const p = s / R; o.x = A_ + R * Math.sin(p); o.z = R * Math.cos(p); o.dx = Math.cos(p); o.dz = -Math.sin(p); o.c = 1; return o; }
    s -= Math.PI * R; if (s < 2 * A_) { o.x = A_ - s; o.z = -R; o.dx = -1; o.dz = 0; return o; }
    s -= 2 * A_; const p = s / R; o.x = -A_ - R * Math.sin(p); o.z = -R * Math.cos(p); o.dx = -Math.cos(p); o.dz = Math.sin(p); o.c = 1; return o; };
  const heading = o => Math.atan2(-o.dz, o.dx);
  // Tempo: auf den Geraden v, in den Kurven 60 % davon (vor der Kurve bremsen, danach beschleunigen)
  const fac = s => { const u = (((s % LAP) + LAP) % LAP) % (2 * A_ + Math.PI * R); return u >= 2 * A_ ? KC : KC + (1 - KC) * Math.min(sm(u / BL), sm((2 * A_ - u) / BL)); };
  // „Fahrplan“: Q(s) = ∫ ds / fac(s). Bei Fahrstufe v gilt dQ/dt = v, also Δt = ΔQ : v – genau so rechnen Simulation, Anzeigetafel und Infotexte
  const NQ = 4096, QT = new Float64Array(NQ + 1);
  { const dq = LAP / NQ, n = 8, h = dq / n; for (let i = 0; i < NQ; i++) { let I = 0; for (let k = 0; k < n; k++) I += h / fac(i * dq + (k + .5) * h); QT[i + 1] = QT[i] + I; } }
  const Q_LAP = QT[NQ];
  const qOf = s => { const k = Math.floor(s / LAP), u = (s - k * LAP) / LAP * NQ, i = Math.min(NQ - 1, Math.floor(u)); return k * Q_LAP + QT[i] + (QT[i + 1] - QT[i]) * (u - i); };
  const sOf = q => { const k = Math.floor(q / Q_LAP), r = q - k * Q_LAP; let lo = 0, hi = NQ;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (QT[m] <= r) lo = m; else hi = m; }
    return (k * NQ + lo + (r - QT[lo]) / (QT[lo + 1] - QT[lo])) * LAP / NQ; };
  const G1 = A_ - .3, G2 = [A_ + .3, 2 * A_ + Math.PI * R / 2];                       // Lichtschranke 2: Gerade oder Kurvenscheitel
  const qG1 = qOf(G1), I_LAP = Q_LAP, I_G = G2.map(g => qOf(g) - qG1);
  const DS = G2.map(g => +(g - G1).toFixed(2));
  const RAMP = .5;                                                                       // weicher Wechsel der Fahrstufe (s)
  let stage = 0, g2mode = 0, running = false, tStart = 0, meas = I_G[0] / VS[0], Qd = 0, Sd = 0, tN = 0, g2s = G2[0], qG2 = qOf(G2[0]), dirty = true, redrawAcc = 0, dotAcc = 0, dotI = 0;
  let vCur = VS[0], vFrom = VS[0], rampT = RAMP;
  let dg = null, dgAge = 9;                                                              // Diagramm-Trainer: Zustand {s, v, t} der gerade gefahrenen Bewegung
  const dtNow = () => meas != null ? meas : I_G[g2mode] / VS[stage];                  // Δt, das die Tafel zeigt (bzw. gleich zeigen wird)

  const mTop = ctx.mat(W === "sterne" ? "metal" : "darkwood");
  const mPl = W === "zauber" ? ctx.mat("stone") : W === "sterne" ? ctx.mat("plastic", {color: "#c4ced8"}) : ctx.mat("wood");
  const mTrim = ctx.mat(W === "sterne" ? "steel" : "brass");
  const mFelt = ctx.mat("cloth", {color: W === "zauber" ? "#3e1a1e" : W === "sterne" ? "#1d2c3c" : "#25402f"});
  const stad = (r, hole) => { const s = hole ? new T.Path() : new T.Shape(); s.moveTo(-A_, -r); s.lineTo(A_, -r); s.absarc(A_, 0, r, -Math.PI / 2, Math.PI / 2, false);
    s.lineTo(-A_, r); s.absarc(-A_, 0, r, Math.PI / 2, Math.PI * 1.5, false); return s; };
  const ext = (sh, d, bev = 0) => new T.ExtrudeGeometry(sh, {depth: d, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 24}).rotateX(-Math.PI / 2);
  const ringGeo = (r0, r1) => { const s = stad(r1); s.holes.push(stad(r0, true)); return new T.ShapeGeometry(s, 32).rotateX(-Math.PI / 2); };
  const stadPts = (r, y, n) => { const P = [], Lr = 4 * A_ + 2 * Math.PI * r;
    for (let i = 0; i < n; i++) { let s = i / n * Lr, x, z;
      if (s < 2 * A_) { x = -A_ + s; z = r; } else if ((s -= 2 * A_) < Math.PI * r) { x = A_ + r * Math.sin(s / r); z = r * Math.cos(s / r); }
      else if ((s -= Math.PI * r) < 2 * A_) { x = A_ - s; z = -r; } else { s -= 2 * A_; x = -A_ - r * Math.sin(s / r); z = -r * Math.cos(s / r); }
      P.push(new T.Vector3(x, y, z)); } return P; };
  const loop = (r, y, rad) => new T.TubeGeometry(new T.CatmullRomCurve3(stadPts(r, y, 140), true, "centripetal"), 280, rad, 6, true);

  // Tisch: Sockel, Leisten, Platte, Filz, Fahrbahn
  {
    const b = bucket(T);
    b.put(mPl, ext(stad(R - .06), TOP - .26), 0, .12, 0);
    b.put(mTrim, ext(stad(R + .02), .1, .012), 0, .012, 0);
    b.put(mTrim, ext(stad(R), .04, .01), 0, TOP - .16, 0);
    b.put(mTop, ext(stad(R + .26), .06, .015), 0, TOP - .075, 0);
    b.put(W === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.3}) : mTrim, loop(R + .268, TOP - .032, .016));
    b.build(gT, true);
    const t = bucket(T);
    t.put(mFelt, new T.ShapeGeometry(stad(R + .24), 24).rotateX(-Math.PI / 2), 0, TOP + .002, 0);
    const mLane = W === "zauber" ? ctx.mat("stone") : W === "sterne" ? ctx.mat("color", {color: "#0e1824", rough: .45, metal: .35}) : ctx.mat("color", {color: "#6d655b", rough: .95});
    t.put(mLane, ringGeo(R - .12, R + .12), 0, TOP + .005, 0);
    if (W === "zauber") { t.put(ctx.mat("glow", {color: "#E3B341", intensity: 1.4}), loop(R, TOP + .006, .006));
      for (const r of [R - .12, R + .12]) t.put(mTrim, loop(r, TOP + .008, .007)); }
    else if (W === "sterne") for (const r of [R - .11, R + .11]) t.put(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.8}), loop(r, TOP + .008, .006));
    else for (const r of [R - .07, R + .07]) t.put(ctx.mat("steel"), loop(r, TOP + .026, .008));
    t.build(gT, false);
    if (W === "detektiv") {   // Schwellen
      const n = Math.floor(LAP / .105), sl = new T.InstancedMesh(new T.BoxGeometry(.034, .016, .21), ctx.mat("darkwood"), n), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      for (let i = 0; i < n; i++) { const o = at((i + .5) * LAP / n); m4.compose(v.set(o.x, TOP + .013, o.z), q.setFromEuler(e.set(0, heading(o), 0)), one); sl.setMatrixAt(i, m4); }
      sl.receiveShadow = true; gT.add(sl);
    }
    // Start-/Ziellinie an Lichtschranke 1 (schwarz-weiß kariert)
    const ck = document.createElement("canvas"); ck.width = 32; ck.height = 128; const cg = ck.getContext("2d");
    for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) { cg.fillStyle = (i + j) % 2 ? "#111" : "#f2f2f2"; cg.fillRect(i * 16, j * 16, 16, 16); }
    const ct = new T.CanvasTexture(ck); ct.colorSpace = T.SRGBColorSpace; ct.magFilter = T.NearestFilter;
    const line = new T.Mesh(new T.PlaneGeometry(.05, .24), new T.MeshStandardMaterial({map: ct, roughness: .8})); line.rotation.x = -Math.PI / 2;
    line.position.set(G1 - A_, TOP + (W === "detektiv" ? .023 : .011), R); gT.add(line);
  }

  // Namensschild vorn am Sockel
  { const nm = W === "zauber" ? "Besen-Rennbahn" : W === "sterne" ? "Gleiter-Teststrecke" : "Draisinen-Bahn";
    const pl = screen(ctx, .95, .2, 512, (g, w, h) => { panel(g, w, h, L0); g.textBaseline = "middle"; g.fillStyle = L0.acc; rt(g, nm, w / 2, h / 2 + 2, 50, L0.tf, "center", 700); });
    pl.position.set(0, .52, R - .06 + .016); gT.add(pl);
    const fb = bucket(T); fb.box(mFrame, 1.0, .25, .02, 0, .52, R - .06 + .004); fb.build(gT, false); }

  // Lichtschranken
  const beamCol = W === "zauber" ? 0xffa64d : W === "sterne" ? 0xff3b3b : 0xff6a3a, HB = .15;
  const makeGate = num => {
    const g = new T.Group(), b = bucket(T), pm = ctx.mat(W === "sterne" ? "steel" : "brass"), dm = ctx.mat(W === "sterne" ? "metal" : "darkwood");
    const hm = W === "zauber" ? ctx.mat("crystal", {color: "#ffb347", intensity: .9}) : ctx.mat("glow", {color: "#ff5040", intensity: .9});
    for (const z of [-.19, .19]) { b.cyl(dm, .042, .05, .02, 16, 0, .01, z); b.cyl(pm, .012, .012, .27, 10, 0, .145, z); b.box(dm, .045, .07, .045, 0, HB, z);
      b.put(hm, W === "zauber" ? new T.OctahedronGeometry(.026, 0) : new T.SphereGeometry(.018, 12, 8), 0, .3, z); }
    b.build(g, false);
    const beam = new T.Mesh(new T.CylinderGeometry(.005, .005, .34, 6, 1, true), new T.MeshBasicMaterial({color: beamCol, transparent: true, opacity: .45, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false}));
    beam.rotation.x = Math.PI / 2; beam.position.y = HB; g.add(beam);
    const fl = ctx.glow(beamCol, .2); fl.position.set(0, HB, -.19); g.add(fl);
    const tg = tag(ctx, String(num), L0.fg, .075); tg.position.set(0, .4, .19); g.add(tg);
    let k = 0; g.flash = () => { k = 1; };
    ctx.tick(dt => { k = Math.max(0, k - dt * 2.2); beam.material.opacity = .4 + .6 * k; beam.scale.set(1 + 2.5 * k, 1, 1 + 2.5 * k); fl.scale.setScalar(.16 + .5 * k); });
    return g;
  };
  const gate1 = makeGate(1), gate2 = makeGate(2); gT.add(gate1, gate2);
  const placeGate = (gt, s) => { const o = at(s); gt.position.set(o.x, TOP, o.z); gt.rotation.y = heading(o); };
  placeGate(gate1, G1); placeGate(gate2, G2[0]);

  // Fahrzeug, Geschwindigkeitspfeil, Stroboskop-Punkte
  const car = vehicle(ctx, W === "detektiv" ? 1 : .82); gT.add(car);
  const carY = TOP + (W === "detektiv" ? .034 : 0), arrY = TOP + car.userData.top;
  const vArr = arrowIn(ctx, gT, COL.vor, .022), vTag = tag(ctx, "v", COL.vor, .12, L0.bf); gT.add(vTag);
  const ND = 14, dotY = TOP + (W === "detektiv" ? .024 : .016);
  const dots = new T.InstancedMesh(new T.CircleGeometry(.022, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false}), ND);
  dots.frustumCulled = false; gT.add(dots);
  const dotT = new Float32Array(ND).fill(-99), dotC = new T.Color(L0.acc), cc = new T.Color(), m4 = new T.Matrix4();
  for (let i = 0; i < ND; i++) { const o = at(i * LAP / ND); dots.setMatrixAt(i, m4.makeTranslation(o.x, dotY, o.z)); dots.setColorAt(i, cc.setRGB(0, 0, 0)); }

  // Stoppuhr in der Mitte der Bahn: großer Zeiger 1 Umdrehung = 1 s, kleiner Zeiger (Hilfszifferblatt oben) 1 Umdrehung = 10 s
  const swG = new T.Group(); swG.position.set(0, TOP, -.05); gT.add(swG);
  const hand = new T.Group(), hand2 = new T.Group(), SUB = 46, SUBR = 92, FPX = .34 / 512;   // Hilfszifferblatt: Mitte 46 px über der Mitte, Radius 92 px
  {
    const b = bucket(T), cm = ctx.mat(W === "sterne" ? "steel" : "brass");
    b.cyl(mBody, .09, .11, .03, 24, 0, .015, 0); b.cyl(cm, .014, .014, .1, 10, 0, .08, 0);
    const dial = new T.Group(); dial.position.set(0, .275, 0); dial.rotation.x = -.38; dial.scale.setScalar(.95); swG.add(dial);
    const d = bucket(T);
    d.cyl(cm, .19, .19, .055, 48, 0, 0, -.01, Math.PI / 2, 0, 0); d.put(cm, new T.TorusGeometry(.19, .014, 8, 48), 0, 0, .018);
    d.cyl(cm, .022, .022, .045, 12, 0, .215, 0); d.put(cm, new T.TorusGeometry(.03, .007, 6, 16), 0, .255, 0);
    for (const s of [-1, 1]) d.cyl(cm, .012, .012, .035, 8, s * .1, .17, 0, 0, 0, -s * .55);
    d.build(dial, false);
    const face = screen(ctx, .34, .34, 512, (g, w) => {
      const c = w / 2, sc = c - SUB; g.fillStyle = L0.face; g.fillRect(0, 0, w, w);
      g.strokeStyle = L0.ink; g.fillStyle = L0.ink; g.textBaseline = "middle";
      for (let i = 0; i < 50; i++) { const a = i / 50 * TAU - Math.PI / 2, big = i % 5 === 0, r0 = big ? 196 : 214; g.lineWidth = big ? 6 : 3;
        g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a) * 236, c + Math.sin(a) * 236); g.stroke(); }
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2; rt(g, i ? "0," + i : "0", c + Math.cos(a) * 158, c + Math.sin(a) * 158, 34, L0.bf, "center", 700); }
      // Hilfszifferblatt: ganze Sekunden
      g.globalAlpha = .12; g.fillStyle = L0.kmh; g.beginPath(); g.arc(c, sc, SUBR, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = L0.ink; g.lineWidth = 3; g.beginPath(); g.arc(c, sc, SUBR, 0, TAU); g.stroke();
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2; g.lineWidth = 4; g.beginPath(); g.moveTo(c + Math.cos(a) * (SUBR - 12), sc + Math.sin(a) * (SUBR - 12)); g.lineTo(c + Math.cos(a) * SUBR, sc + Math.sin(a) * SUBR); g.stroke();
        g.fillStyle = L0.ink; rt(g, String(i), c + Math.cos(a) * (SUBR - 32), sc + Math.sin(a) * (SUBR - 33), 31, L0.bf, "center", 700); }
      g.fillStyle = L0.kmh; rt(g, "ganze s", c, sc + 31, 20, L0.bf, "center", 700);
      g.fillStyle = L0.kmh; rt(g, "Δt in s", c, c + 74, 34, L0.bf, "center", 700);
      g.fillStyle = L0.ink; rt(g, "1 Umdrehung = 1 s", c, c + 103, 19, L0.bf, "center", 600);
    }, 0, true);
    face.position.z = .029; dial.add(face);
    const gl = new T.Mesh(new T.CircleGeometry(.175, 40), ctx.mat("glass", {opacity: .12})); gl.position.z = .036; dial.add(gl);
    hand.position.z = .033; dial.add(hand); hand2.position.set(0, SUB * FPX, .031); dial.add(hand2);
    const hb = bucket(T), red = ctx.mat("color", {color: "#c0392b", rough: .4});
    hb.box(red, .009, .16, .004, 0, .065, 0); hb.box(red, .016, .04, .004, 0, -.02, 0); hb.cyl(cm, .013, .013, .01, 12, 0, 0, .003, Math.PI / 2, 0, 0); hb.build(hand, false);
    const h2 = bucket(T), dark = ctx.mat("color", {color: W === "sterne" ? "#FFE81F" : L0.ink, rough: .5});
    h2.box(dark, .007, .05, .003, 0, .02, 0); h2.box(dark, .012, .014, .003, 0, -.008, 0); h2.cyl(cm, .008, .008, .008, 10, 0, 0, .002, Math.PI / 2, 0, 0); h2.build(hand2, false);
    b.build(swG, false);
  }

  // Fahrhebel (Stufe 1–3)
  const lev = new T.Group(); lev.position.set(-.9, TOP, -.02); gT.add(lev);
  const levArm = new T.Group();
  {
    const b = bucket(T), cm = ctx.mat(W === "sterne" ? "steel" : "brass");
    b.box(mBody, .4, .04, .14, 0, .02, 0); b.box(cm, .42, .012, .16, 0, .046, 0);
    b.build(lev, false);
    const plate = screen(ctx, .4, .3, 512, (g, w, h) => {
      panel(g, w, h, L0); g.textBaseline = "middle"; g.fillStyle = L0.acc; rt(g, "Fahrstufe", w / 2, 42, 34, L0.bf, "center", 700);
      const px = w / .4, cx = w / 2, cy = (.32 - .06) / .3 * h;
      g.strokeStyle = L0.dim; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, .155 * px, -Math.PI / 2 - .75, -Math.PI / 2 + .75); g.stroke();
      VS.forEach((v, i) => { const a = (i - 1) * .62; g.fillStyle = L0.fg; rt(g, `${v} m/s`, cx + Math.sin(a) * .2 * px, cy - Math.cos(a) * .19 * px, 32, L0.bf, "center", 700); });
    });
    plate.position.set(0, .17, -.035); lev.add(plate);
    levArm.position.set(0, .06, .02); lev.add(levArm);
    const ab = bucket(T); ab.box(cm, .014, .15, .014, 0, .075, 0); ab.put(ctx.mat("color", {color: "#b3261e", rough: .35}), new T.SphereGeometry(.024, 12, 8), 0, .155, 0); ab.build(levArm, false);
  }

  // Requisite je Welt (rechts in der Bahnmitte)
  {
    const g = new T.Group(); g.position.set(.86, TOP, -.02); gT.add(g); const b = bucket(T);
    if (W === "zauber") {     // Sanduhr
      for (const y of [.01, .29]) b.cyl(ctx.mat("darkwood"), .09, .09, .02, 20, 0, y, 0);
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; b.cyl(ctx.mat("brass"), .007, .007, .28, 6, Math.cos(a) * .075, .15, Math.sin(a) * .075); }
      const pr = [[.01, 0], [.06, .02], [.07, .06], [.03, .12], [.01, .14]].map(([x, y]) => new T.Vector2(x, y)), lg = new T.LatheGeometry(pr, 20);
      b.put(ctx.mat("glass", {color: "#e6f0ff", opacity: .25}), lg.clone(), 0, .02, 0); b.put(ctx.mat("glass", {color: "#e6f0ff", opacity: .25}), lg, 0, .28, 0, Math.PI, 0, 0);
      b.put(ctx.mat("glow", {color: "#E3B341", intensity: .35}), new T.ConeGeometry(.05, .05, 16), 0, .045, 0);
      b.put(ctx.mat("glow", {color: "#E3B341", intensity: .35}), new T.ConeGeometry(.04, .04, 16), 0, .2, 0, Math.PI, 0, 0);
    } else if (W === "sterne") {   // Holo-Projektor mit drehendem Ring
      b.cyl(ctx.mat("metal"), .08, .1, .06, 24, 0, .03, 0); b.cyl(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), .06, .06, .008, 24, 0, .064, 0);
      const ring = ctx.mesh(new T.TorusGeometry(.08, .006, 6, 40), ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), false); ring.position.y = .2; g.add(ring);
      const cone = new T.Mesh(new T.ConeGeometry(.08, .14, 24, 1, true), new T.MeshBasicMaterial({color: 0x4fc3f7, transparent: true, opacity: .14, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide}));
      cone.position.y = .14; cone.rotation.x = Math.PI; g.add(cone);
      ctx.tick((dt, t) => { ring.rotation.x = Math.PI / 2 + Math.sin(t * .9) * .5; ring.rotation.y = t * 1.3; });
    } else {                   // Notizbuch, Feder, Lupe
      b.box(ctx.mat("cloth", {color: "#5a2a22"}), .2, .02, .14, 0, .01, .01, 0, .25, 0); b.box(ctx.mat("paper"), .19, .006, .13, 0, .023, .01, 0, .25, 0);
      b.cyl(ctx.mat("brass"), .004, .004, .17, 6, .02, .03, .02, Math.PI / 2, 0, .9);
      b.put(ctx.mat("brass"), new T.TorusGeometry(.05, .008, 8, 24), -.02, .05, -.1, -1.2, 0, 0); b.cyl(ctx.mat("darkwood"), .01, .012, .1, 8, -.02, .03, -.03, 1.2, 0, 0);
      b.put(ctx.mat("glass", {color: "#dfeee6", opacity: .3}), new T.CircleGeometry(.046, 24), -.02, .05, -.1, -1.2 - Math.PI / 2, 0, 0);
    }
    b.build(g, false);
  }

  // Δs-Maß zwischen den Lichtschranken + Schildchen
  const dimG = new T.Group(); dimG.position.set(0, TOP, R - .25); gT.add(dimG);
  { const b = bucket(T), cm = ctx.mat(W === "sterne" ? "glow" : "brass", W === "sterne" ? {color: "#FFE81F", intensity: 1.2} : undefined);
    b.box(cm, .6, .008, .008, 0, .014, 0); for (const s of [-1, 1]) { b.box(cm, .008, .03, .008, s * .3, .014, 0); b.put(cm, new T.ConeGeometry(.014, .04, 8), s * .28, .014, 0, 0, 0, s * Math.PI / 2); }
    b.build(dimG, false); }
  const plaque = screen(ctx, .56, .17, 512, (g, w, h) => { panel(g, w, h, L0, true); g.textBaseline = "middle"; g.fillStyle = L0.fg;
    if (!g2mode) rt(g, `Δs = ${de(DS[0])} m`, w / 2, h / 2 + 2, 66, L0.bf, "center", 700);
    else { rt(g, `Δs = ${de(DS[1])} m`, w / 2, h * .36, 58, L0.bf, "center", 700); g.fillStyle = L0.dim; rt(g, "entlang der Bahn", w / 2, h * .73, 38, L0.bf, "center", 700); } });
  plaque.position.set(0, TOP + .085, R - .37); plaque.rotation.x = -.85; gT.add(plaque);

  // Anzeigetafel hinter der Bahn (Exponat 2)
  const gB = new T.Group(); gB.position.set(0, 0, -(R + .36)); gC.add(gB);
  const DYB = 1.94;                                                                     // Mitte der Anzeige (über der Stoppuhr, auch die Fußzeile bleibt frei)
  {
    const b = bucket(T);
    for (const s of [-1, 1]) { b.box(mBody, .07, DYB + .56, .07, s * 1.13, (DYB + .56) / 2, 0); b.box(mFrame, .26, .05, .26, s * 1.13, .025, 0); b.put(mFrame, new T.SphereGeometry(.05, 12, 8), s * 1.13, DYB + .6, 0); }
    b.box(mBody, 2.14, 1.16, .05, 0, DYB, 0);
    for (const s of [-1, 1]) { b.box(mFrame, 2.2, .04, .07, 0, DYB + s * .59, 0); b.box(mFrame, .04, 1.2, .07, s * 1.08, DYB, 0); }
    b.box(mFrame, 2.3, .06, .12, 0, DYB + .61, 0);
    b.build(gB, true);
  }
  // Schriftgröße so weit verkleinern, dass die Zeile in maxW passt (die Schreibmaschinenschrift der Detektei läuft sonst über den Rand)
  const fit = (g, s, size, maxW, min = 18, wt = 600) => { while (size > min && rt(g, s, 0, 0, size, L0.bf, "left", wt, true) > maxW) size -= 1; return size; };
  const disp = screen(ctx, 2.0, 1.1, 1024, (g, w, h) => {
    panel(g, w, h, L0, true); g.textBaseline = "middle";
    g.fillStyle = L0.acc; rt(g, "Lichtschranken-Messung", 44, 60, 46, TF("Lichtschranken-Messung"), "left", 700);
    g.fillStyle = L0.dim; rt(g, `Fahrstufe ${stage + 1} von 3`, w - 44, 60, 30, L0.bf, "right", 600);
    const ds = DS[g2mode], live = running, dt = live ? tN - tStart : meas;
    g.fillStyle = L0.fg; rt(g, `Δs = ${de(ds)} m`, 52, 138, 56, L0.bf, "left", 700);
    const RW = w - 112, note = (s, y) => rt(g, s, 440, y, fit(g, s, 28, w - 500, 18, 500), L0.bf, "left", 500);   // Zeilen enden spätestens 60 px vor dem Rand
    g.fillStyle = L0.dim; note(g2mode ? "Lichtschranke 1 → 2 (bis in die Kurve)" : "Abstand Lichtschranke 1 → 2", 140);
    g.fillStyle = live ? L0.acc2 : L0.fg; rt(g, dt == null ? "Δt = …" : `Δt = ${de(dt)} s`, 52, 214, 56, L0.bf, "left", 700);
    g.fillStyle = L0.dim; note(live ? "Stoppuhr läuft …" : dt == null ? "neue Messung: warte auf Lichtschranke 1" : "gestoppt an Lichtschranke 2", 216);
    if (dt != null && !live) { const v = ds / dt, s = `v = Δs : Δt = ${de(v)} m/s = ${de(v * 3.6, 1)} km/h`; g.fillStyle = L0.acc; rt(g, s, 52, 292, fit(g, s, 52, RW, 36, 700), L0.bf, "left", 700); }
    else { g.fillStyle = L0.dim; rt(g, "v = Δs : Δt = …", 52, 292, 52, L0.bf, "left", 700); }
    g.strokeStyle = L0.grid; g.lineWidth = 3; g.beginPath(); g.moveTo(44, 336); g.lineTo(w - 44, 336); g.stroke();
    const TL = I_LAP / VS[stage], va = LAP / TL;
    const r1 = `Ganze Runde: Δs = ${de(LAP)} m   Δt = ${de(TL)} s`, r2 = `Durchschnittsgeschwindigkeit: v = ${de(va)} m/s = ${de(va * 3.6, 1)} km/h`;
    g.fillStyle = L0.fg; rt(g, r1, 52, 376, fit(g, r1, 34, RW, 24), L0.bf, "left", 600);
    g.fillStyle = L0.acc2; rt(g, r2, 52, 420, fit(g, r2, 34, RW, 24, 700), L0.bf, "left", 700);
    const f1 = `In den Kurven fährt ${noun[0]} langsamer: Die Leuchtpunkte liegen dort dichter.`, f2 = "Leuchtpunkte: alle 0,25 s   ·   Pfeil: 1 m/s ≙ 30 cm";
    g.fillStyle = L0.dim; rt(g, f1, 52, 466, fit(g, f1, 30, RW, 20), L0.bf, "left", 600); rt(g, f2, 52, 508, fit(g, f2, 30, RW, 20), L0.bf, "left", 600);
  }, .055);
  disp.position.set(0, DYB, .028); gB.add(disp);
  const boardLight = ctx.light(0xfff2dc, 5, 6.5, S.center.x, 2.7, S.center.z + 1.7);

  ctx.tick((dt, t) => {
    // Lichtschranke 2 versetzen
    const tg = G2[g2mode];
    if (g2s !== tg) { g2s += (tg - g2s) * Math.min(1, dt * 2.4); if (Math.abs(tg - g2s) < .004) g2s = tg; placeGate(gate2, g2s); qG2 = qOf(g2s); running = false; dimG.visible = false; dirty = true; }
    else dimG.visible = g2mode === 0;
    // Fahrstufe weich wechseln
    if (rampT < RAMP) { rampT = Math.min(RAMP, rampT + dt); vCur = vFrom + (VS[stage] - vFrom) * sm(rampT / RAMP); }
    // Fahren nach dem Fahrplan Q(s) (dQ/dt = v, exakt) und Lichtschranken auswerten –
    // solange der Diagramm-Trainer fährt, stattdessen genau die dort eingestellte Bewegung (s ab der Startlinie, v mit Vorzeichen: rückwärts < 0)
    const s0 = Sd; let vv;
    if (dg) { dgAge += dt; Sd = G1 + dg.s; vv = dgAge < .25 ? dg.v : 0; }               // Lauf beendet (keine neuen Werte): Fahrzeug steht
    else {
      const Q0 = Qd, t0 = tN; Qd += vCur * dt; tN += dt; Sd = sOf(Qd);
      if (Qd > Q0) for (const [qg, id] of [[qG1, 1], [qG2, 2]]) { const k0 = Math.floor((Q0 - qg) / Q_LAP), k1 = Math.floor((Qd - qg) / Q_LAP);
        if (k1 > k0) { const tc = t0 + dt * (qg + k1 * Q_LAP - Q0) / (Qd - Q0);
          if (id === 1) { tStart = tc; running = g2s === G2[g2mode] && rampT >= RAMP; gate1.flash(); }
          else { if (running) { meas = tc - tStart; running = false; } gate2.flash(); }
          dirty = true; } }
      vv = vCur * fac(Sd);
    }
    const o = at(Sd), dsum = Sd - s0;
    car.position.set(o.x, carY, o.z); car.rotation.y = heading(o); car.update(dt, t, Math.abs(vv), dsum, o.c);
    const L = vv * SCL, LT = L + (L < 0 ? -.1 : .1); vArr.set([o.x, arrY, o.z], [o.x + o.dx * L, arrY, o.z + o.dz * L]); vTag.visible = vArr.visible;
    vTag.position.set(o.x + o.dx * LT, arrY + .05, o.z + o.dz * LT);
    // Stroboskop: alle 0,25 s ein Punkt
    dotAcc += dt; if (dotAcc >= .25) { dotAcc -= .25; dots.setMatrixAt(dotI, m4.makeTranslation(o.x, dotY, o.z)); dotT[dotI] = t; dotI = (dotI + 1) % ND; dots.instanceMatrix.needsUpdate = true; }
    for (let i = 0; i < ND; i++) dots.setColorAt(i, cc.copy(dotC).multiplyScalar(Math.max(0, 1 - (t - dotT[i]) / 3.5) * .95));
    dots.instanceColor.needsUpdate = true;
    // Stoppuhr, Fahrhebel, Anzeige
    const swT = dg ? dg.t || 0 : running ? tN - tStart : (meas || 0); hand.rotation.z = -TAU * swT; hand2.rotation.z = -TAU * swT / 10;
    levArm.rotation.z += ((1 - stage) * .62 - levArm.rotation.z) * Math.min(1, dt * 6);
    redrawAcc += dt; if ((running && redrawAcc > .07) || (dirty && !running)) { disp.redraw(); redrawAcc = 0; dirty = false; }
  });
  const swNote = d => { const r2 = Math.round(d * 100) / 100, k = Math.floor(r2 + 1e-9);
    return k >= 1 ? ` Auf der Stoppuhr zählt der **kleine Zeiger** die ganzen Sekunden (${k} s), der große Zeiger den Rest (${de(r2 - k)} s).` : ""; };
  const vText = () => { const v = VS[stage], d = I_G[0] / v, dm = dtNow();
    return (g2mode
      ? `Auf der Geraden fährt ${noun[0]} mit **v = ${de(v, 1)} m/s**. Lichtschranke 2 steht gerade im **Kurvenscheitel** (Δs = ${de(DS[1])} m entlang der Bahn). Die Stoppuhr misst **Δt = ${de(dm)} s**, ` +
        `also nur v = ${de(DS[1] / dm)} m/s – eine **Durchschnittsgeschwindigkeit**, weil ${noun[0]} vor der Kurve bremst.${swNote(dm)}\n\n`
      : `Auf der Geraden fährt ${noun[0]} mit **v = ${de(v, 1)} m/s**. Die Lichtschranken stehen **Δs = ${de(DS[0])} m** auseinander, die Stoppuhr misst **Δt = ${de(d)} s**: ` +
        `v = Δs : Δt = ${de(DS[0])} m : ${de(d)} s = ${de(v, 1)} m/s = ${de(v * 3.6, 1)} km/h.\n\n`) +
      `Der **Geschwindigkeitspfeil** zeigt in Fahrtrichtung, seine Länge gibt den Betrag an (1 m/s ≙ 30 cm). In den Kurven fährt ${noun[0]} langsamer: Der Pfeil dreht sich und wird kürzer. ` +
      `Die **Leuchtpunkte** entstehen alle 0,25 s: Auf der Geraden liegen sie weiter auseinander als in der Kurve – dort ist ${noun[0]} langsamer. ` +
      (stage < 2 ? "Klicke noch einmal: schneller." : "Klicke noch einmal: wieder Fahrstufe 1."); };
  ctx.exhibit(gT, {label: "Rennbahn", sub: "anklicken: Fahrstufe wechseln", dist: 2.7, pitch: -.32, title: "Geschwindigkeit messen: v = Δs : Δt",
    onClick: () => { stage = (stage + 1) % 3; vFrom = vCur; rampT = 0; running = false; meas = null; dirty = true; }, get text(){ return vText(); }});
  // Diagramm-Trainer: Das Fahrzeug fährt auf der Rennbahn sichtbar mit (s entlang der Bahn ab der Startlinie, Pfeil mit Vorzeichen, Stoppuhr läuft mit).
  // Die Rennbahn passt besser als das t-s-Diagramm-Exponat: Dort sitzt schon das Labor, und dessen Bahn ist nur 2 m lang.
  ctx.diagramm(gT, {id: "fahrt", titel: "Fahr nach Diagramm",
    text: `Stelle mit dem Regler die Geschwindigkeit ein, während die Zeit läuft – ${noun[0]} fährt auf der Rennbahn mit, die Strecke s zählt ab der Startlinie. Deine Kurve soll dem gestrichelten Ziel folgen. **Negative Werte** bedeuten: rückwärts, zurück Richtung Start.`,
    y: "s", steuer: {id: "v", name: "Geschwindigkeit v", einheit: "m/s", min: -3, max: 3, schritt: .1, wert: 0},
    start: {s: 0, v: 0, t: 0}, modell: (z, u, dt) => ({s: z.s + u * dt, v: u, t: z.t + dt}), dauer: 10,
    achsen: {x: {name: "t in s", max: 10, teil: 1}, y: {name: "s in m", max: 16, teil: 2}},
    bahn: {name: "s in m (entlang der Rennbahn)", max: 16, teil: 2}, steigung: {name: "Geschwindigkeit", einheit: "m/s"},
    figur: W === "zauber" ? "🧹" : W === "sterne" ? "🛸" : "🚃",
    ziele: [
      {name: "Immer gleich schnell", text: "Eine Gerade: In jeder Sekunde kommt gleich viel Strecke hinzu.", punkte: [[0, 0], [10, 15]], toleranz: .06,
       tipp: "Die Gerade steigt in 10 s um 15 m. Rechne v = Δs : Δt aus und stelle diesen Wert gleich am Anfang ein.",
       erklaerung: "Eine Gerade im t-s-Diagramm heißt: **gleichförmige Bewegung**. Die Steigung ist die Geschwindigkeit, hier 15 m : 10 s = 1,5 m/s."},
      {name: "Schnell – Pause – langsam", text: "Erst 3 s lang schnell, dann 2 s stehen bleiben, dann langsam weiter.", punkte: [[0, 0], [3, 9], [5, 9], [10, 14]], toleranz: .06,
       tipp: "Lies die Steigungen ab: 9 m in 3 s, dann 0 m in 2 s, dann 5 m in 5 s. Stelle bei 3 s schnell auf 0 und bei 5 s auf den neuen Wert.",
       erklaerung: "Die **waagrechte** Linie bedeutet Stillstand (v = 0). Vorher fährst du 9 m : 3 s = 3 m/s, danach 5 m : 5 s = 1 m/s. Im Durchschnitt: 14 m : 10 s = 1,4 m/s – die Pause zählt mit."},
      {name: "Hin und zurück", text: "Fahr 4 s lang schnell vorwärts, warte 2 s, dann fahr rückwärts zurück Richtung Start.", punkte: [[0, 0], [4, 12], [6, 12], [10, 4]], toleranz: .06,
       tipp: "Vorwärts: 12 m in 4 s. Zurück: von 12 m auf 4 m in 4 s – dafür muss der Regler auf einen **negativen** Wert. Achte auf das Vorzeichen der Steigung.",
       erklaerung: "Eine **fallende** Linie heißt: s wird kleiner, das Fahrzeug fährt zurück zum Start. Die Steigung ist (4 m − 12 m) : 4 s = −2 m/s; das Minus zeigt die **Gegenrichtung** – der Geschwindigkeitspfeil zeigt nach hinten."}],
    fragen: [
      {frage: "Welcher Wagen ist schneller?", kurven: [{name: "A", punkte: [[0, 0], [8, 16]]}, {name: "B", punkte: [[0, 0], [10, 8]]}],
       optionen: ["Wagen A", "Wagen B", "beide gleich schnell", "Das kann man nicht ablesen."], richtig: 0,
       warum: [null, "Die Linie von B ist zwar länger, aber flacher: B kommt in 10 s nur 8 m weit, A schafft schon in 8 s 16 m.", "Die Geraden sind verschieden steil – also unterscheiden sich die Geschwindigkeiten.",
               "Doch: Die **Steigung** der Geraden ist die Geschwindigkeit. Lies an jeder Geraden Δs und Δt ab."],
       erklaerung: "Je steiler die Gerade im t-s-Diagramm, desto größer die Geschwindigkeit: A fährt 16 m : 8 s = 2 m/s, B nur 8 m : 10 s = 0,8 m/s."},
      {frage: "Zwischen welchen Zeitpunkten steht der Wagen still?", kurven: [{name: "C", punkte: [[0, 0], [3, 6], [7, 6], [10, 12]]}],
       optionen: ["von 3 s bis 7 s", "von 0 s bis 3 s", "von 7 s bis 10 s", "Er steht nie still, weil die Kurve immer weitergeht."], richtig: 0,
       warum: [null, "Zwischen 0 s und 3 s steigt die Linie an: In dieser Zeit kommen 6 m hinzu, der Wagen fährt also.", "Ab 7 s steigt die Linie wieder an – der Wagen fährt weiter, 6 m in 3 s.",
               "Die Linie geht weiter, weil die Zeit weiterläuft. Von 3 s bis 7 s bleibt s aber bei 6 m – in dieser Zeit steht der Wagen."],
       erklaerung: "Ein **waagrechter** Abschnitt bedeutet Stillstand: Die Zeit vergeht, aber die Strecke s bleibt gleich – hier 6 m von 3 s bis 7 s."},
      {frage: "Wagen D ist bei t = 0 s schon 4 m von der Startlinie entfernt. Bestimme seine Geschwindigkeit mit einem Steigungsdreieck.", kurven: [{name: "D", punkte: [[0, 4], [8, 16]]}],
       wert: 1.5, einheit: "m/s", toleranz: .05,
       tipps: ["Wähle zwei gut ablesbare Punkte auf der Geraden, zum Beispiel bei t = 0 s und t = 8 s.", "Bei t = 0 s ist s = 4 m, bei t = 8 s ist s = 16 m. Also Δs = 16 m − 4 m und Δt = 8 s.", "v = Δs : Δt = 12 m : 8 s = …"],
       loesung: "Δs = 16 m − 4 m = 12 m, Δt = 8 s − 0 s = 8 s, also v = Δs : Δt = 12 m : 8 s = 1,5 m/s. Wer 16 m : 8 s rechnet, vergisst, dass D bei t = 0 s schon bei s = 4 m war."},
      {frage: "Was passiert bei Wagen E zwischen 5 s und 9 s?", kurven: [{name: "E", punkte: [[0, 0], [3, 12], [5, 12], [9, 4], [10, 4]]}],
       optionen: ["Er fährt zurück Richtung Start – mit 2 m/s entgegen der ursprünglichen Richtung.", "Er fährt einen Hang hinunter.", "Er wird langsamer, fährt aber weiter vorwärts.", "Er steht still."], richtig: 0,
       warum: [null, "Das t-s-Diagramm ist kein Bild der Strecke: Es zeigt nicht, ob es bergauf oder bergab geht, sondern wie weit der Wagen vom Start entfernt ist.",
               "Würde er langsamer vorwärts fahren, stiege die Kurve weiter an, nur flacher. Hier **nimmt s ab** – der Wagen kommt dem Start wieder näher.",
               "Stillstand wäre eine waagrechte Linie wie von 3 s bis 5 s. Von 5 s bis 9 s ändert sich s um 8 m."],
       erklaerung: "Fällt die Kurve, wird s kleiner: Der Wagen bewegt sich **zurück**, entgegen der ursprünglichen Richtung. Seine Geschwindigkeit ist (4 m − 12 m) : 4 s = −2 m/s – das Minus zeigt die Gegenrichtung."}],
    merke: "Im t-s-Diagramm ist die **Steigung** die Geschwindigkeit: steil = schnell, flach = langsam, **waagrecht = Stillstand**, fallend = Fahrt zurück in Gegenrichtung. Die Durchschnittsgeschwindigkeit ist Gesamtstrecke : Gesamtzeit – Pausen zählen mit.",
    live: z => { if (z) { dg = z; dgAge = 0; return; }
      if (!dg) return;                                                                   // Trainer geschlossen: von der erreichten Stelle aus normal weiterfahren (weich anfahren)
      Sd = ((Sd % LAP) + LAP) % LAP; Qd = qOf(Sd); dg = null; vFrom = vCur = 0; rampT = 0; running = false; meas = null; dirty = true; }});
  ctx.exhibit(gB, {label: "Anzeigetafel", sub: "anklicken: Lichtschranke 2 versetzen", dist: 3.2, pitch: -.04, title: "Momentan- oder Durchschnittsgeschwindigkeit?",
    onClick: () => { g2mode = 1 - g2mode; running = false; meas = null; dirty = true; plaque.redraw(); },
    get text(){ const v = VS[stage], d1 = dtNow(), TL = I_LAP / v;
      return g2mode
        ? `Lichtschranke 2 steht jetzt im **Kurvenscheitel**: Δs = ${de(DS[1])} m entlang der Bahn. Weil ${noun[0]} vor der Kurve bremst, misst die Stoppuhr Δt = ${de(d1)} s – also nur ` +
          `v = ${de(DS[1] / d1)} m/s, obwohl ${noun[0]} auf der Geraden ${de(v, 1)} m/s schnell war.${swNote(d1)}\n\nÜber eine lange Strecke misst du eine **Durchschnittsgeschwindigkeit**. Für die **Momentangeschwindigkeit** ` +
          "brauchst du eine **sehr kurze Messstrecke**. Klicke noch einmal: Lichtschranke 2 zurück auf die Gerade."
        : `Die Lichtschranken stehen nur ${de(DS[0])} m auseinander, auf der Geraden fährt ${noun[0]} gleichförmig. Darum ist v = Δs : Δt hier praktisch die **Momentangeschwindigkeit**.\n\n` +
          `Für eine **ganze Runde** (Δs = ${de(LAP)} m) braucht ${noun[0]} ${de(TL)} s, weil es in den Kurven langsamer geht. Die **Durchschnittsgeschwindigkeit** Gesamtstrecke : Gesamtzeit ` +
          `= ${de(LAP / TL)} m/s ist deshalb kleiner. Klicke noch einmal: Lichtschranke 2 in die Kurve versetzen.`; }});
  ctx.obstacle(-A_, S.center.z, R + .32); ctx.obstacle(A_, S.center.z, R + .32); ctx.obstacleBox(0, S.center.z, 2 * A_, 2 * R + .6);
  ctx.obstacleBox(0, S.center.z - R - .36, 2.45, .3);

  /* =====================================================================
     A: t-s-Diagramm, das live mitzeichnet (links, Front nach +x)
     ===================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.A.x, 0, S.A.z); g.rotation.y = Math.PI / 2;
    const b = bucket(T), mw = ctx.mat(W === "sterne" ? "metal" : "wood");
    const SW = 2.5, SH = 1.45, SY = 1.76, SZ = -.62, BY = .8, BZ = .26;
    b.box(mBody, SW + .16, SH + .16, .06, 0, SY, SZ);
    for (const s of [-1, 1]) { b.box(mFrame, SW + .2, .045, .09, 0, SY + s * (SH / 2 + .07), SZ + .02); b.box(mFrame, .045, SH + .2, .09, s * (SW / 2 + .07), SY, SZ + .02);
      b.box(mBody, .09, SY - SH / 2, .09, s * (SW / 2 - .25), (SY - SH / 2) / 2, SZ - .02); b.box(mFrame, .14, .05, .52, s * (SW / 2 - .25), .025, SZ - .02); }
    b.box(mFrame, SW + .34, .07, .14, 0, SY + SH / 2 + .13, SZ);
    // Fahrbahn mit Schiene, Endanschlägen und Maßstab
    b.box(mw, 2.56, .05, .38, 0, BY, BZ); b.box(mBody, 2.5, .11, .02, 0, BY - .08, BZ + .18);
    for (const x of [-1.18, 1.18]) for (const z of [-.14, .14]) b.box(mBody, .05, BY - .025, .05, x, (BY - .025) / 2, BZ + z);
    b.box(mBody, 2.36, .04, .03, 0, .22, BZ);
    b.box(ctx.mat("steel"), 2.34, .016, .05, 0, BY + .033, BZ);
    for (const s of [-1, 1]) b.box(mFrame, .04, .08, .1, s * 1.19, BY + .065, BZ);
    b.build(g, true);
    const ruler = screen(ctx, 2.1, .1, 1024, (g2, w, h) => { const px = w / 2.1, X = s => (s + .05) * px;
      g2.fillStyle = L0.face; g2.fillRect(0, 0, w, h); g2.fillStyle = g2.strokeStyle = L0.ink; g2.textBaseline = "middle";
      for (let i = 0; i <= 40; i++) { const x = X(i * .05), big = i % 10 === 0, mid = i % 2 === 0; g2.lineWidth = big ? 3 : 2; g2.beginPath(); g2.moveTo(x, 0); g2.lineTo(x, big ? 22 : mid ? 14 : 8); g2.stroke(); }
      for (let i = 0; i <= 4; i++) rt(g2, i === 4 ? "2,0 m" : de(i * .5, 1).replace(",0", i ? ",0" : ""), X(i * .5) + (i === 0 ? 10 : i === 4 ? -26 : 0), 34, 18, L0.bf, "center", 700); });
    ruler.position.set(0, BY - .075, BZ + .192); g.add(ruler);
    // Messwagen mit Zeiger
    const cart = new T.Group(); g.add(cart); cart.position.set(-1, BY + .041, BZ);
    { const cb = bucket(T), cm = ctx.mat("plastic", {color: W === "zauber" ? "#7b2d26" : W === "sterne" ? "#e4ebf3" : "#2f5d5d"});
      cb.box(cm, .17, .06, .1, 0, .045, 0); cb.box(mFrame, .18, .012, .11, 0, .08, 0);
      for (const x of [-.055, .055]) for (const z of [-.056, .056]) cb.cyl(ctx.mat("rubber"), .02, .02, .014, 12, x, .02, z, Math.PI / 2, 0, 0);
      cb.box(ctx.mat("color", {color: "#c0392b"}), .006, .006, .2, 0, .03, .1); cb.box(ctx.mat("color", {color: "#c0392b"}), .006, .1, .006, 0, -.02, .2);
      cb.cyl(mFrame, .004, .004, .16, 6, -.078, .16, 0); cb.put(ctx.mat("cloth", {color: L0.acc}), new T.PlaneGeometry(.07, .05), -.117, .21, 0);   // Fähnchen weht nach hinten
      cb.build(cart, false); }
    const cArr = arrowIn(ctx, g, COL.vor, .016), cTag = tag(ctx, "v", COL.vor, .09, L0.bf); g.add(cTag);
    // Messprofile: Strecke s(t) in m, t von 0 bis 8 s
    const PT = [
      {n: "Wagen A", c: L0.acc, f: t => .25 * t, v: () => .25},
      {n: "Wagen B", c: L0.acc2, f: t => .1 * t, v: () => .1},
      {n: "Wagen C", c: "#ff7b54", f: t => t < 2 ? .5 * t : t < 4 ? 1 : 1 + .15 * (t - 4), v: t => t < 2 ? .5 : t < 4 ? 0 : .15}];
    let prof = 0, tr = 0, seen = false, acc = 0, drawnT = -1; const done = new Set();
    // Labor „Videoanalyse“: Messwagen fährt gleichförmig mit 0,3 m/s; der Regler wählt den Zeitpunkt t im Video (0–6 s)
    const VL = .3, TV = 6; let lab = null, lt = 0, labDrawn = -1;
    const labDraw = (g2, w, h) => {
      labDrawn = lt; const s = VL * lt;
      g2.fillStyle = L0.acc; rt(g2, "Videoanalyse: Messwagen", 36, 52, 44, TF("Videoanalyse: Messwagen"), "left", 700);
      const sw = rt(g2, "Standbild", 0, 0, 28, L0.bf, "left", 700, true); g2.fillStyle = "#e0533d"; g2.beginPath(); g2.arc(w - 50 - sw - 22, 54, 11, 0, TAU); g2.fill();
      g2.fillStyle = L0.fg; rt(g2, "Standbild", w - 50, 54, 28, L0.bf, "right", 700);
      const s1 = "Der Wagen fährt gleichförmig geradeaus. Regler = Zeitpunkt im Video.";
      g2.fillStyle = L0.dim; rt(g2, s1, 36, 106, fit(g2, s1, 27, w - 72, 18, 600), L0.bf, "left", 600);
      for (const [x0, lb, val, col] of [[36, "Zeit im Video", `t = ${de(lt, 1)} s`, L0.fg], [524, "Strecke seit dem Start", `s = ${de(s)} m`, L0.acc2]]) {
        g2.fillStyle = "rgba(0,0,0,.32)"; g2.beginPath(); g2.roundRect(x0, 142, 464, 190, 22); g2.fill();
        g2.fillStyle = L0.dim; rt(g2, lb, x0 + 232, 182, 30, L0.bf, "center", 700);
        g2.fillStyle = col; rt(g2, val, x0 + 232, 268, fit(g2, val, 84, 430, 40, 700), L0.bf, "center", 700); }
      // Zeitleiste des Videos
      const X0 = 70, X1 = w - 70, Yb = 404, X = t => X0 + t / TV * (X1 - X0);
      g2.fillStyle = L0.dim; rt(g2, "Zeitleiste des Videos", X0, 368, 26, L0.bf, "left", 700);
      g2.strokeStyle = L0.grid; g2.lineWidth = 12; g2.lineCap = "round"; g2.beginPath(); g2.moveTo(X0, Yb); g2.lineTo(X1, Yb); g2.stroke();
      g2.strokeStyle = L0.acc; g2.beginPath(); g2.moveTo(X0, Yb); g2.lineTo(Math.max(X0 + .1, X(lt)), Yb); g2.stroke(); g2.lineCap = "butt";
      g2.fillStyle = L0.fg; for (let t = 0; t <= TV; t++) { g2.fillRect(X(t) - 2, Yb + 12, 4, 14); rt(g2, `${t} s`, X(t), Yb + 46, 24, L0.bf, "center", 600); }
      g2.fillStyle = L0.acc; g2.strokeStyle = L0.bg; g2.lineWidth = 4; g2.beginPath(); g2.arc(X(lt), Yb, 17, 0, TAU); g2.fill(); g2.stroke();
      const f1 = "Lies s am Maßstab ab (roter Zeiger am Wagen).", f2 = "Jedes Wertepaar (t | s) trägst du selbst ins Diagramm ein.";
      g2.fillStyle = L0.fg; rt(g2, f1, 36, 506, fit(g2, f1, 30, w - 72, 20, 600), L0.bf, "left", 600);
      g2.fillStyle = L0.dim; rt(g2, f2, 36, 548, fit(g2, f2, 30, w - 72, 20, 600), L0.bf, "left", 600);
    };
    const scr = screen(ctx, SW, SH, 1024, (g2, w, h) => {
      panel(g2, w, h, L0, true); g2.textBaseline = "middle";
      if (lab) return labDraw(g2, w, h);
      const X0 = 112, X1 = w - 74, Y0 = 122, Y1 = h - 86, X = t => X0 + t / 8 * (X1 - X0), Y = s => Y1 - s / 2 * (Y1 - Y0), P = PT[prof], tt = Math.min(tr, 8);
      drawnT = tt;
      g2.fillStyle = L0.acc; rt(g2, "t-s-Diagramm", 36, 52, 44, TF("t-s-Diagramm"), "left", 700);
      g2.fillStyle = P.c; rt(g2, prof === 2 ? P.n + " – mit Pause" : P.n, 372, 54, 30, L0.bf, "left", 700);
      g2.fillStyle = L0.fg; rt(g2, `t = ${de(tt, 1)} s   s = ${de(P.f(Math.round(tt * 10) / 10))} m`, w - 36, 54, 28, L0.bf, "right", 600);
      g2.strokeStyle = L0.grid; g2.lineWidth = 2;
      for (let t = 1; t <= 8; t++) { g2.beginPath(); g2.moveTo(X(t), Y0); g2.lineTo(X(t), Y1); g2.stroke(); }
      for (let s = .25; s < 2.01; s += .25) { g2.beginPath(); g2.moveTo(X0, Y(s)); g2.lineTo(X1, Y(s)); g2.stroke(); }
      cArrow(g2, X0 - 8, Y1, X1 + 34, Y1, 4, L0.fg); cArrow(g2, X0, Y1 + 8, X0, Y0 - 34, 4, L0.fg);
      g2.fillStyle = L0.fg;
      for (let t = 0; t <= 8; t++) rt(g2, String(t), X(t), Y1 + 26, 24, L0.bf, "center", 600);
      for (let s = .5; s < 2.01; s += .5) rt(g2, de(s, 1), X0 - 14, Y(s), 24, L0.bf, "right", 600);
      rt(g2, "Zeit t in s", X1 + 30, Y1 + 58, 26, L0.bf, "right", 700); rt(g2, "Strecke s in m", X0 + 16, Y0 - 30, 26, L0.bf, "left", 700);
      const curve = (Q, t1, lw, a) => { g2.globalAlpha = a; g2.strokeStyle = Q.c; g2.lineWidth = lw; g2.lineJoin = "round"; g2.beginPath();
        for (let t = 0; t <= t1 + 1e-6; t += .04) { const tt2 = Math.min(t, t1); t ? g2.lineTo(X(tt2), Y(Q.f(tt2))) : g2.moveTo(X(0), Y(0)); }
        g2.lineTo(X(t1), Y(Q.f(t1))); g2.stroke(); g2.globalAlpha = 1; };
      for (const k of done) if (k !== prof) { curve(PT[k], 8, 4, .45); g2.fillStyle = PT[k].c; g2.globalAlpha = .7; rt(g2, PT[k].n, X(8) - 6, Y(PT[k].f(8)) - 22, 22, L0.bf, "right", 700); g2.globalAlpha = 1; }
      curve(P, tt, 7, 1);
      g2.fillStyle = P.c; g2.strokeStyle = L0.bg; g2.lineWidth = 4; g2.beginPath(); g2.arc(X(tt), Y(P.f(tt)), 10, 0, TAU); g2.fill(); g2.stroke();
      if (tr >= 8) {
        const note = s => { const w2 = rt(g2, s, 0, 0, 30, L0.bf, "left", 700, true); g2.fillStyle = "rgba(0,0,0,.45)"; g2.beginPath(); g2.roundRect(X0 + 18, Y0 + 8, w2 + 36, 50, 14); g2.fill();
          g2.fillStyle = P.c; rt(g2, s, X0 + 36, Y0 + 34, 30, L0.bf, "left", 700); };
        g2.setLineDash([10, 8]); g2.strokeStyle = L0.fg; g2.lineWidth = 3; g2.fillStyle = L0.fg;
        if (prof < 2) { const [s0, s1] = prof ? [.2, .6] : [.5, 1.5];
          g2.beginPath(); g2.moveTo(X(2), Y(s0)); g2.lineTo(X(6), Y(s0)); g2.lineTo(X(6), Y(s1)); g2.stroke(); g2.setLineDash([]);
          rt(g2, "Δt = 4 s", X(4), Y(s0) + 22, 26, L0.bf, "center", 700); rt(g2, `Δs = ${de(s1 - s0, 1)} m`, X(6) + 14, Y((s0 + s1) / 2), 26, L0.bf, "left", 700);
          note(prof ? "v = Δs : Δt = 0,4 m : 4 s = 0,1 m/s" : "v = Δs : Δt = 1,0 m : 4 s = 0,25 m/s");
        } else {
          g2.beginPath(); g2.moveTo(X(0), Y(0)); g2.lineTo(X(8), Y(1.6)); g2.stroke(); g2.setLineDash([]);
          rt(g2, "Durchschnitt", X(5.2), Y(1.04) + 24, 24, L0.bf, "left", 700);
          g2.fillStyle = P.c; rt(g2, "v = 0,5 m/s", X(2) - 14, Y(1.0) - 16, 24, L0.bf, "right", 700);
          rt(g2, "Stillstand: v = 0", X(3), Y(1.0) - 24, 24, L0.bf, "center", 700); rt(g2, "v = 0,15 m/s", X(6.4), Y(1.36) - 24, 24, L0.bf, "right", 700);
          note("Durchschnitt: v = 1,6 m : 8 s = 0,2 m/s");
        }
      }
    });
    scr.position.set(0, SY, SZ + .034); g.add(scr);
    ctx.tick(dt => {
      if (lab) {   // Labor: Wagen springt nicht, sondern „spult“ weich zum eingestellten Zeitpunkt; Pfeil 0,3 m/s ≙ 0,3 m
        const d = lab.t - lt; lt = Math.abs(d) < .003 ? lab.t : lt + d * Math.min(1, dt * 7);
        const x = -1 + VL * lt, y = BY + .26; cart.position.x = x; showArrow(cArr, [x, y, BZ], [x + VL, y, BZ]); cTag.visible = true; cTag.position.set(x + VL + .07, y + .04, BZ);
        acc += dt; if (Math.abs(lt - labDrawn) > .004 && acc > .05) { scr.redraw(); acc = 0; }
        return; }
      tr += dt; const P = PT[prof], tt = Math.min(tr, 8), v = tr < 8 ? P.v(tt) : 0;
      cart.position.x = -1 + P.f(tt);
      const y = BY + .26, x = cart.position.x; showArrow(cArr, [x, y, BZ], [x + v, y, BZ], v > 0 ? 1 : 0);
      cTag.visible = v > 0; cTag.position.set(x + v + .07, y + .04, BZ);
      // nur neu zeichnen, wenn sich die Zeit sichtbar geändert hat (nach 8 s steht das Bild)
      acc += dt; if ((acc > .066 && Math.abs(Math.min(tr, 8) - drawnT) > .01) || (tr >= 8 && drawnT < 8)) { scr.redraw(); acc = 0; }
      if (tr > 14) { tr = 0; done.add(prof); scr.redraw(); }
    });
    const txt = [
      "Das t-s-Diagramm zeigt, welche Strecke s der Wagen bis zum Zeitpunkt t zurückgelegt hat. Wagen A fährt **gleichförmig**: In jeder Sekunde kommen 0,25 m hinzu – der Graph ist eine **Gerade**.\n\n" +
      "Am Steigungsdreieck liest du Δt = 4 s und Δs = 1,0 m ab: **v = Δs : Δt = 0,25 m/s**. Der Pfeil über dem Wagen zeigt seine Geschwindigkeit (Maßstab: 1 m/s ≙ 1 m). Klicke noch einmal: Wagen B.",
      "Wagen B ist langsamer: In 4 s kommt er nur 0,4 m weit, also **v = 0,1 m/s**. Seine Gerade ist **flacher** als die von Wagen A.\n\n**Merke:** Die Steigung im t-s-Diagramm ist die Geschwindigkeit – je steiler die Gerade, desto größer v. Klicke noch einmal: Wagen C.",
      "Wagen C fährt 2 s lang mit 0,5 m/s, **steht dann 2 s still** (waagrechte Linie) und fährt danach mit 0,15 m/s weiter (flachere Gerade).\n\n" +
      "Seine **Durchschnittsgeschwindigkeit** ist Gesamtstrecke : Gesamtzeit = 1,6 m : 8 s = **0,2 m/s** – die Pause zählt mit. Das ist die Steigung der gestrichelten Geraden vom Start zum Ziel."];
    hitBox(ctx, g, 2.6, 2.6, 1.15, 0, 1.3, -.1);
    ctx.exhibit(g, {label: "t-s-Diagramm", sub: "anklicken: nächster Wagen", dist: 3.0, pitch: -.08, title: "Das t-s-Diagramm zeichnet mit",
      onClick: () => { done.add(prof); if (seen) prof = (prof + 1) % 3; seen = true; tr = 0; scr.redraw(); }, get text(){ return txt[prof]; }});
    // Labor: Videoanalyse des Messwagens (t einstellen, s am Maßstab ablesen) → t-s-Diagramm, Steigung = Geschwindigkeit
    ctx.lab(g, {
      id: "messwagen", titel: "Videoanalyse: Wie schnell ist der Messwagen?",
      text: "Eine Kamera hat den **Messwagen** gefilmt, der gleichförmig über die Bahn fährt. Stelle mit dem Regler einen **Zeitpunkt t** im Video ein und lies am Maßstab ab, welche **Strecke s** der Wagen seit dem Start zurückgelegt hat. Nimm mindestens fünf Messwerte auf, trage sie selbst ins t-s-Diagramm ein und bestimme daraus die Geschwindigkeit.",
      regler: [{id: "t", name: "Zeitpunkt t im Video", einheit: "s", min: 0, max: TV, schritt: .5, wert: 0}],
      messe: v => ({s: VL * v.t}),
      anzeige: [{id: "s", name: "Strecke s seit dem Start (Maßstab)", einheit: "m", stellen: 2}],
      achsen: {x: {id: "t", name: "t in s", max: TV, teil: 1}, y: {id: "s", name: "s in m", max: 2, teil: .25}},
      punkte: 5, gerade: "ursprung",
      aufgabe: {frage: "Lies an deiner Geraden ein Steigungsdreieck ab (Δt und Δs) und berechne die Geschwindigkeit v = Δs : Δt des Messwagens.", wert: VL, toleranz: .02, einheit: "m/s",
        tipps: ["Wähle zwei gut ablesbare Punkte auf der Geraden, zum Beispiel den Ursprung und den Punkt bei t = 5 s.", "Lies ab: Von t = 0 s bis t = 5 s vergeht Δt = 5 s, dabei kommt die Strecke Δs = 1,5 m hinzu.",
          "v = Δs : Δt = 1,5 m : 5 s – rechne aus. Die Einheit ist m/s."],
        loesung: "v = Δs : Δt = 1,5 m : 5 s = **0,3 m/s** (das sind 0,3 · 3,6 = 1,08 km/h). Jedes Steigungsdreieck an der Geraden liefert denselben Wert."},
      merke: "Bei einer **gleichförmigen Bewegung** liegen die Messpunkte im t-s-Diagramm auf einer **Ursprungsgeraden**: Die Strecke s ist proportional zur Zeit t. Die **Steigung** der Geraden ist die Geschwindigkeit, hier **v = Δs : Δt = 0,3 m/s**.",
      live: v => { if (!v) { lab = null; tr = 0; scr.redraw(); return; }
        if (!lab) lt = 0; lab = {t: v.t}; scr.redraw(); }
    });
    ctx.obstacleBox(S.A.x - .18, S.A.z, 1.42, 2.75);
  }

  /* =====================================================================
     B: Ball prallt von der Wand ab – Pfeile aneinanderhängen (rechts hinten, Front nach −x)
     ===================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.B.x, 0, S.B.z); g.rotation.y = -Math.PI / 2;
    const b = bucket(T), mw = ctx.mat(W === "sterne" ? "metal" : "wood"), TY = .9, BR = .09, XW = 1.18, XC = XW - BR, WD = .32, WH = .3, TX = .03;
    b.box(mw, 2.98, .06, .56, TX, TY - .03, 0); b.box(mBody, 2.86, .1, .5, TX, TY - .11, 0);
    for (const x of [-1.38, 1.44]) for (const z of [-.22, .22]) b.box(mBody, .07, TY - .16, .07, x, (TY - .16) / 2, z);
    b.box(mBody, 2.76, .04, .04, TX, .2, 0);
    // Korb mit Ersatzbällen unter dem Tisch
    { const bm2 = W === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: .5}) : W === "zauber" ? ctx.mat("cloth", {color: "#8f2f1f"}) : ctx.mat("color", {color: "#7a1f18", rough: .5});
      if (W === "sterne") { b.box(ctx.mat("metal"), .5, .04, .3, -.6, .04, 0); for (const s2 of [-1, 1]) b.box(ctx.mat("metal"), .5, .12, .02, -.6, .1, s2 * .14); }
      else { b.cyl(ctx.mat(W === "zauber" ? "wood" : "darkwood"), .2, .16, .22, 16, -.6, .11, 0); b.put(mFrame, new T.TorusGeometry(.2, .012, 6, 24), -.6, .22, 0, Math.PI / 2, 0, 0); }
      for (const [x, z, y] of [[-.68, -.04, .25], [-.52, .05, .25], [-.6, -.02, .37]]) b.put(bm2, new T.SphereGeometry(.09, 18, 12), x, y - (W === "sterne" ? .1 : 0), z); }
    // Prallwand: so tief wie das Tischende, knapp unter der Pfeilhöhe
    let wallM;
    if (W === "detektiv") { const c = document.createElement("canvas"); c.width = c.height = 256; const q = c.getContext("2d"); q.fillStyle = "#cfc4b0"; q.fillRect(0, 0, 256, 256);
      for (let r = 0; r < 8; r++) for (let k = -1; k < 5; k++) { q.fillStyle = `hsl(${8 + (r * 7 + k * 13) % 10},${42 + (k * 5) % 12}%,${30 + (r * 3 + k * 7) % 9}%)`; q.fillRect(k * 64 + (r % 2) * 32 + 3, r * 32 + 3, 58, 26); }
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; wallM = new T.MeshStandardMaterial({map: t, roughness: .9}); }
    else wallM = ctx.mat(W === "zauber" ? "stone" : "metal");
    b.box(wallM, WD, WH, .56, XW + WD / 2, TY + WH / 2, 0); b.box(mFrame, WD + .04, .03, .6, XW + WD / 2, TY + WH + .015, 0);
    if (W === "sterne") b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4}), .01, WH - .06, .5, XW - .005, TY + WH / 2, 0);
    if (W === "zauber") b.put(ctx.mat("glow", {color: "#E3B341", intensity: 1.1}), new T.TorusGeometry(.07, .008, 6, 32), XW - .004, TY + BR, 0, 0, Math.PI / 2, 0);
    // Tafel mit Pfeildiagramm
    const BW = 2.8, BH = 1.3, BYc = 2.3, BZ = -.42;
    b.box(mBody, BW + .14, BH + .14, .05, 0, BYc, BZ - .03);
    for (const s of [-1, 1]) { b.box(mFrame, BW + .18, .04, .07, 0, BYc + s * (BH / 2 + .05), BZ - .01); b.box(mFrame, .04, BH + .18, .07, s * (BW / 2 + .05), BYc, BZ - .01);
      b.box(mBody, .08, BYc - BH / 2, .08, s * 1.25, (BYc - BH / 2) / 2, BZ - .06); b.box(mFrame, .16, .05, .4, s * 1.25, .025, BZ - .06); }
    b.build(g, true);
    const Y3 = {v: 2.55, d: 2.27, n: 1.99}, X0 = -.15, AZ = BZ + .045;
    let labK = [1, 1, 1];                                                               // Sichtbarkeit der Beschriftungen (folgt den Pfeilen)
    const brd = screen(ctx, BW, BH, 1024, (q, w, h) => {
      const [kv, kd, kn] = labK;
      panel(q, w, h, L0, true); q.textBaseline = "middle"; const X = x => (x + BW / 2) / BW * w, Y = y => (BYc + BH / 2 - y) / BH * h;
      q.fillStyle = L0.acc; rt(q, "Ball prallt von der Wand ab", 40, 52, 42, TF("Ball prallt von der Wand ab"), "left", 700);
      q.fillStyle = L0.dim; rt(q, "Zeitlupe · Tafel: 1 m/s ≙ 10 cm", 42, 96, 24, L0.bf, "left", 600);
      q.setLineDash([8, 7]); q.strokeStyle = L0.dim; q.lineWidth = 3;
      for (const [x, y0, y1, k] of [[X0 + .7, Y3.v, Y3.d, kd], [X0, Y3.v, Y3.n, kn], [X0 - .4, Y3.d, Y3.n, kn]]) { if (k <= 0) continue; q.globalAlpha = k; q.beginPath(); q.moveTo(X(x), Y(y0)); q.lineTo(X(x), Y(y1)); q.stroke(); }
      q.globalAlpha = 1; q.setLineDash([]);
      const lab = (k, col, s, x, y) => { if (k <= 0) return; q.globalAlpha = k; q.fillStyle = col; rt(q, s, X(x), Y(y), 32, L0.bf, "center", 700); q.globalAlpha = 1; };
      lab(kv, COL.vor, "v_{vorher} = 7 m/s", .2, Y3.v + .115); lab(kd, COL.dv, "Δv = 11 m/s", .2, Y3.d + .1); lab(kn, COL.nach, "v_{nachher} = 4 m/s", -.35, Y3.n - .1);
      // Wand-Symbol rechts
      const wx = X(1.0); q.fillStyle = L0.dim; q.fillRect(wx, Y(2.72), 10, Y(1.86) - Y(2.72)); q.strokeStyle = L0.dim; q.lineWidth = 3;
      for (let y = Y(2.72); y < Y(1.86); y += 22) { q.beginPath(); q.moveTo(wx + 10, y); q.lineTo(wx + 30, y + 18); q.stroke(); }
      q.fillStyle = L0.dim; rt(q, "Wand", wx + 18, Y(1.79), 24, L0.bf, "center", 700);
      q.fillStyle = L0.fg; let fs = 23; while (fs > 16 && rt(q, "Δv an die Spitze von v_{vorher} hängen.", 0, 0, fs, L0.bf, "left", 600, true) > X(-.22) - X(-1.33)) fs--;
      for (const [k, s2] of ["Δv an die Spitze von v_{vorher} hängen.", "v_{nachher} reicht vom Anfang von", "v_{vorher} bis zur Spitze von Δv."].entries()) rt(q, s2, X(-1.33), Y(2.6 - k * .09), fs, L0.bf, "left", 600);
      q.fillStyle = L0.fg; rt(q, "v_{nachher} = v_{vorher} + Δv", X(.35), Y(1.76), 40, L0.bf, "center", 700);
    });
    brd.position.set(0, BYc, BZ + .006); g.add(brd);
    const dV = arrowIn(ctx, g, COL.vor, .026), dD = arrowIn(ctx, g, COL.dv, .026), dN = arrowIn(ctx, g, COL.nach, .026);
    const q4 = k => Math.round(Math.max(0, Math.min(1, k)) * 4) / 4;
    const diag = (kv, kd, kn) => { showArrow(dV, [X0, Y3.v, AZ], [X0 + .7, Y3.v, AZ], kv); showArrow(dD, [X0 + .7, Y3.d, AZ], [X0 - .4, Y3.d, AZ], kd); showArrow(dN, [X0, Y3.n, AZ], [X0 - .4, Y3.n, AZ], kn);
      const nk = [q4(kv), q4(kd), q4(kn)]; if (nk.some((k, i) => k !== labK[i])) { labK = nk; brd.redraw(); } };
    // Schildchen vorn am Tisch: Maßstab der Pfeile am Ball
    const sp = screen(ctx, 1.1, .085, 512, (q, w, h) => { panel(q, w, h, L0); q.textBaseline = "middle"; q.fillStyle = L0.fg; rt(q, "Pfeile am Ball: 1 m/s ≙ 5 cm", w / 2, h / 2 + 1, 28, L0.bf, "center", 700); });
    sp.position.set(TX, TY - .11, .252); g.add(sp);
    // Ball und Pfeile am Ball (1 m/s ≙ 5 cm) – beim Stoß als Kette links der Wand: v_vorher endet an der Wand, Δv beginnt an seiner Spitze
    const ballM = W === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: .9}) : W === "zauber" ? ctx.mat("cloth", {color: "#8f2f1f"}) : ctx.mat("color", {color: "#7a1f18", rough: .5});
    const ball = new T.Group(); g.add(ball);
    const bm = ctx.mesh(new T.SphereGeometry(BR, 28, 20), ballM, true); ball.add(bm);
    const seam = ctx.mesh(new T.TorusGeometry(BR + .002, .006, 6, 32), ctx.mat(W === "detektiv" ? "paper" : W === "zauber" ? "gold" : "steel"), false); seam.rotation.y = Math.PI / 2; bm.add(seam);
    const bV = arrowIn(ctx, g, COL.vor, .024), bD = arrowIn(ctx, g, COL.dv, .024), bN = arrowIn(ctx, g, COL.nach, .024);
    const tV = tag(ctx, "v_{vorher}", COL.vor, .1, L0.bf), tD = tag(ctx, "Δv", COL.dv, .1, L0.bf), tN = tag(ctx, "v_{nachher}", COL.nach, .1, L0.bf); g.add(tV, tD, tN);
    const hit = ctx.glow(W === "sterne" ? 0x7fdcff : 0xffd27a, .01); hit.position.set(XW - .02, TY + BR, 0); g.add(hit);
    const KS = .05, LVo = 7 * KS, LDv = 11 * KS, LNa = 4 * KS, R1 = TY + .45, R2 = R1 - .13, R3 = R1 - .26;
    const XS = -1.25, VA = .7, VB = .4, tA = (XC - XS) / VA, tB = 2.4, tC = (XC + .55) / VB;
    let seq = -1, ts = 0;
    const put = (x, sx = 1) => { ball.position.set(x, TY + BR, 0); ball.scale.set(sx, 1 / Math.sqrt(sx), 1 / Math.sqrt(sx)); };
    const hide = () => { for (const a of [bV, bD, bN]) a.visible = false; tV.visible = tD.visible = tN.visible = false; };
    put(XS); diag(1, 1, 1); hide();
    ctx.tick(dt => {
      if (seq < 0) return;
      ts += dt; let kv = 1, kd = 1, kn = 1;
      hide();
      if (ts < tA) {                                   // Anflug mit v_vorher (Pfeil am Ball)
        const x = XS + VA * ts; put(x); bm.rotation.z = -(x - XS) / BR; kv = Math.min(1, ts / .7); kd = kn = 0;
        showArrow(bV, [x, R1, 0], [x + LVo, R1, 0]); tV.visible = true; tV.position.set(x + LVo / 2, R1 + .085, 0);
        hit.scale.setScalar(.01);
      } else if (ts < tA + tB) {                       // Stoß: v_vorher rückt in die Kette, Δv an seine Spitze hängen, v_nachher ergibt sich
        const u = (ts - tA) / tB; put(XC, 1 - .28 * Math.sin(Math.PI * Math.min(1, u / .25)) * (u < .25 ? 1 : 0));
        const x0 = XC - LVo * sm(u / .18);
        showArrow(bV, [x0, R1, 0], [x0 + LVo, R1, 0]); tV.visible = true; tV.position.set(x0 + LVo / 2, R1 + .085, 0);
        const kd2 = sm((u - .22) / .33), kn2 = sm((u - .62) / .22);
        showArrow(bD, [XC, R2, 0], [XC - LDv, R2, 0], kd2); tD.visible = kd2 > .3; tD.position.set(XC - .2, R2 - .072, 0);
        showArrow(bN, [XC - LVo, R3, 0], [XC - LDv, R3, 0], kn2); tN.visible = kn2 > .5; tN.position.set(XC - LDv - .26, R3, 0);
        kv = 1; kd = kd2; kn = kn2; hit.scale.setScalar(.01 + 1.1 * Math.max(0, 1 - u * 3));
      } else if (ts < tA + tB + tC) {                   // Rückflug mit v_nachher (Pfeil am Ball)
        const x = XC - VB * (ts - tA - tB); put(x); bm.rotation.z = -(x - XS) / BR;
        showArrow(bN, [x, R1, 0], [x - LNa, R1, 0]); tN.visible = true; tN.position.set(x - LNa / 2, R1 + .085, 0); hit.scale.setScalar(.01);
      } else { const x = XC - VB * tC; put(x); showArrow(bN, [x, R1, 0], [x - LNa, R1, 0]); tN.visible = true; tN.position.set(x - LNa / 2, R1 + .085, 0);
        if (ts > tA + tB + tC + 5) { seq = -1; put(XS); hide(); } }
      diag(kv, kd, kn);
    });
    hitBox(ctx, g, 3.0, 3.0, .8, TX, 1.5, -.1);
    ctx.exhibit(g, {label: "Ball an der Wand", sub: "anklicken: Ball werfen", dist: 3.0, pitch: -.06, title: "Abprall: Pfeile aneinanderhängen",
      onClick: () => { seq = 0; ts = 0; diag(0, 0, 0); },
      text: "Der Ball fliegt mit **v_{vorher} = 7 m/s** auf die Wand zu und prallt mit **v_{nachher} = 4 m/s** zurück. Die Wand gibt ihm die **Zusatzgeschwindigkeit Δv = 11 m/s**, von der Wand weg: " +
        "Sie baut erst die 7 m/s ab und dann 4 m/s in Gegenrichtung auf.\n\nSo hängst du die Pfeile aneinander: Δv beginnt an der Spitze von v_{vorher}. **v_{nachher} = v_{vorher} + Δv** reicht vom Anfang " +
        "von v_{vorher} bis zur Spitze von Δv. Maßstab auf der Tafel: 1 m/s ≙ 10 cm, bei den Pfeilen am Ball: 1 m/s ≙ 5 cm."});
    ctx.obstacleBox(S.B.x + .12, S.B.z + TX, .95, 3.1);
  }

  /* =====================================================================
     C: Tachometer mit zwei Skalen – m/s und km/h (rechts vorne, Front nach −x)
     ===================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.C.x + .2, 0, S.C.z); g.rotation.y = -Math.PI / 2;
    const b = bucket(T), DY = 1.98, DR = .72, VMAX = 40;
    b.box(mBody, 1.0, 1.08, .5, 0, .58, 0); b.box(mFrame, 1.08, .06, .56, 0, 1.13, 0); b.box(mFrame, 1.08, .08, .56, 0, .04, 0);
    b.box(mBody, .3, .3, .16, 0, 1.28, -.2);
    b.cyl(mBody, DR + .05, DR + .05, .16, 72, 0, DY, -.07, Math.PI / 2, 0, 0);
    b.put(W === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.5}) : mFrame, new T.TorusGeometry(DR + .025, .035, 10, 80), 0, DY, .02);
    if (W === "detektiv") for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.put(ctx.mat("brass"), new T.SphereGeometry(.014, 8, 6), Math.cos(a) * (DR + .06), DY + Math.sin(a) * (DR + .06), .03); }
    if (W === "zauber") for (const s of [-1, 1]) b.put(ctx.mat("gold"), new T.OctahedronGeometry(.06, 0), s * (DR + .14), DY + .1, -.04, 0, 0, Math.PI / 4);
    b.build(g, true);
    const ang = v => (-120 + 240 * v / VMAX) * Math.PI / 180;
    const face = screen(ctx, 2 * DR - .03, 2 * DR - .03, 1024, (q, w) => {
      const c = w / 2, Rr = c - 4, P = (v, r) => [c + Math.sin(ang(v)) * r, c - Math.cos(ang(v)) * r];
      q.fillStyle = L0.face; q.beginPath(); q.arc(c, c, Rr, 0, TAU); q.fill();
      if (L0.scan) { q.strokeStyle = "rgba(79,195,247,.25)"; q.lineWidth = 2; q.beginPath(); q.arc(c, c, Rr - 10, 0, TAU); q.stroke(); }
      q.textBaseline = "middle";
      // außen km/h
      q.strokeStyle = L0.kmh; q.lineWidth = 6; q.beginPath(); q.arc(c, c, Rr - 34, ang(0) - Math.PI / 2, ang(VMAX) - Math.PI / 2); q.stroke();
      for (let k = 0; k <= 140; k += 10) { const big = k % 20 === 0, [x1, y1] = P(k / 3.6, Rr - 34), [x2, y2] = P(k / 3.6, Rr - (big ? 82 : 60)); q.lineWidth = big ? 7 : 4; q.beginPath(); q.moveTo(x1, y1); q.lineTo(x2, y2); q.stroke();
        if (big) { const [x, y] = P(k / 3.6, Rr - 124); q.fillStyle = L0.kmh; rt(q, String(k), x, y, 50, L0.bf, "center", 700); } }
      // innen m/s
      q.strokeStyle = L0.ms; q.lineWidth = 5; q.beginPath(); q.arc(c, c, 300, ang(0) - Math.PI / 2, ang(VMAX) - Math.PI / 2); q.stroke();
      for (let v = 0; v <= VMAX; v++) { const big = v % 5 === 0, [x1, y1] = P(v, 300), [x2, y2] = P(v, big ? 266 : 282); q.lineWidth = big ? 6 : 3; q.beginPath(); q.moveTo(x1, y1); q.lineTo(x2, y2); q.stroke();
        if (big) { const [x, y] = P(v, 232); q.fillStyle = L0.ms; rt(q, String(v), x, y, 40, L0.bf, "center", 700); } }
      q.fillStyle = L0.ink; rt(q, "Momentangeschwindigkeit", c, c + 410, 32, L0.bf, "center", 600);
      q.fillStyle = L0.kmh; rt(q, "außen: km/h", c, c + 150, 40, L0.bf, "center", 700);
      q.fillStyle = L0.ms; rt(q, "innen: m/s", c, c + 205, 40, L0.bf, "center", 700);
      q.fillStyle = L0.ink; rt(q, "1 m/s = 3,6 km/h", c, c + 330, 52, L0.bf, "center", 700);
    }, 0, true);
    face.position.set(0, DY, .012); g.add(face);
    const piv = new T.Group(); piv.position.set(0, DY, .05); g.add(piv);
    { const nb = bucket(T), red = ctx.mat(W === "sterne" ? "glow" : "color", W === "sterne" ? {color: "#ff5c5c", intensity: 1.4} : {color: "#c0392b", rough: .4});
      nb.box(red, .026, .6, .012, 0, .26, 0); nb.box(red, .05, .12, .012, 0, -.06, 0); nb.cyl(ctx.mat(W === "sterne" ? "steel" : "brass"), .045, .045, .03, 20, 0, 0, .01, Math.PI / 2, 0, 0); nb.build(piv, false); }
    const cover = new T.Mesh(new T.CircleGeometry(DR - .01, 64), ctx.mat("glass", {opacity: .1})); cover.position.set(0, DY, .07); g.add(cover);
    const EX = [
      {n: "Fußgängerin", v: 1.5, s: "1,5 m/s · 3,6 = 5,4 km/h"},
      {n: "Radfahrer", v: 6, s: "6 m/s · 3,6 = 21,6 km/h"},
      {n: "Auto in der Stadt", v: 50 / 3.6, s: "50 km/h : 3,6 ≈ 13,9 m/s"},
      {n: "Auto auf der Landstraße", v: 80 / 3.6, s: "80 km/h : 3,6 ≈ 22,2 m/s"},
      {n: W === "zauber" ? "Rennbesen" : W === "sterne" ? "Schwebegleiter beim Start" : "Schnellzug", v: 120 / 3.6, s: "120 km/h : 3,6 ≈ 33,3 m/s"}];
    let ex = 3, cur = EX[3].v, vel = 0;
    const dsp = screen(ctx, 1.3, .36, 1024, (q, w, h) => { panel(q, w, h, L0, true); q.textBaseline = "middle";
      q.fillStyle = L0.acc; rt(q, EX[ex].n, w / 2, 70, 46, L0.bf, "center", 700); q.fillStyle = L0.fg; rt(q, EX[ex].s, w / 2, 178, 66, L0.bf, "center", 700); });
    dsp.position.set(0, .8, .252); g.add(dsp);
    ctx.tick(dt => { const tgt = EX[ex].v; vel += ((tgt - cur) * 26 - vel * 7) * dt; cur += vel * dt; piv.rotation.z = -ang(Math.max(0, Math.min(VMAX, cur))); });
    hitBox(ctx, g, 1.6, 2.75, .55, 0, 1.37, .02);
    ctx.exhibit(g, {label: "Tachometer", sub: "anklicken: nächstes Beispiel", dist: 2.8, pitch: .02, title: "Umrechnen: m/s und km/h",
      onClick: () => { ex = (ex + 1) % EX.length; dsp.redraw(); },
      get text(){ const e = EX[ex];
        return "Der Tacho zeigt die **Momentangeschwindigkeit**. Er hat zwei Skalen: außen km/h, innen m/s.\n\n" +
          "Es gilt **1 m/s = 3,6 km/h**, denn mit 1 m/s legst du in 1 h = 3600 s genau 3600 m = 3,6 km zurück. Von m/s nach km/h rechnest du **· 3,6**, von km/h nach m/s **: 3,6**.\n\n" +
          `Gerade eingestellt – ${e.n}: **${e.s}**.`; }});
    ctx.obstacleBox(S.C.x + .2, S.C.z, .62, 1.72);
  }

  /* =====================================================================
     D: Kurvenfahrt mit gleichem Tempo – Δv zeigt zur Kreismitte (links vorne, Front nach +x)
     ===================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.D.x, 0, S.D.z); g.rotation.y = Math.PI / 2;
    const b = bucket(T), TY = .78, RR = .6, LV = .42, DPH = Math.PI / 4, LDV = 2 * LV * Math.sin(DPH / 2);
    b.cyl(W === "sterne" ? ctx.mat("metal") : W === "zauber" ? ctx.mat("stone") : ctx.mat("darkwood"), .95, .95, .06, 72, 0, TY - .03, 0);
    b.put(mFrame, new T.TorusGeometry(.95, .022, 8, 80), 0, TY - .03, 0, Math.PI / 2, 0, 0);
    b.cyl(mBody, .2, .32, TY - .1, 24, 0, (TY - .06) / 2, 0); b.cyl(mFrame, .5, .56, .06, 40, 0, .03, 0); b.cyl(mFrame, .24, .24, .04, 24, 0, TY - .08, 0);
    b.build(g, true);
    const t2 = bucket(T);
    t2.put(mFelt, new T.CircleGeometry(.9, 64).rotateX(-Math.PI / 2), 0, TY + .002, 0);
    if (W === "detektiv") { for (const r of [RR - .053, RR + .053]) t2.put(ctx.mat("steel"), new T.TorusGeometry(r, .007, 6, 96), 0, TY + .022, 0, Math.PI / 2, 0, 0);
      for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; t2.box(ctx.mat("darkwood"), .026, .012, .16, Math.cos(a) * RR, TY + .01, -Math.sin(a) * RR, 0, a, 0); } }
    else { t2.put(W === "zauber" ? ctx.mat("stone") : ctx.mat("color", {color: "#0e1824", rough: .45, metal: .35}), new T.RingGeometry(RR - .11, RR + .11, 96).rotateX(-Math.PI / 2), 0, TY + .005, 0);
      for (const r of W === "zauber" ? [RR] : [RR - .1, RR + .1]) t2.put(ctx.mat("glow", {color: W === "zauber" ? "#E3B341" : "#4FC3F7", intensity: 1.5}), new T.TorusGeometry(r, .006, 6, 96), 0, TY + .006, 0, Math.PI / 2, 0, 0); }
    t2.cyl(mFrame, .018, .018, .12, 10, 0, TY + .06, 0); t2.put(ctx.mat("color", {color: "#c0392b", rough: .4}), new T.SphereGeometry(.03, 12, 8), 0, TY + .13, 0);
    t2.build(g, false);
    const mTag = tag(ctx, "Kreismitte", L0.fg, .06, L0.bf); mTag.position.set(0, TY + .19, .08); g.add(mTag);
    const car = vehicle(ctx, .75); g.add(car);
    const cy = TY + (W === "detektiv" ? .029 : 0), ay = TY + car.userData.top + .02;
    const aV = arrowIn(ctx, g, COL.vor, .02), aD = arrowIn(ctx, g, COL.dv, .02), tv = tag(ctx, "v", COL.vor, .1, L0.bf), td = tag(ctx, "Δv", COL.dv, .1, L0.bf); g.add(tv, td);
    // Momentaufnahmen (8 gleich lange v-Pfeile, Δv jeweils zur Mitte)
    const gv = [], gd = [], gp = [];
    for (let k = 0; k < 8; k++) { const ph = k * DPH, p = new T.Vector3(Math.cos(ph) * RR, ay, -Math.sin(ph) * RR), d = new T.Vector3(-Math.sin(ph), 0, -Math.cos(ph)), c = new T.Vector3(-Math.cos(ph), 0, Math.sin(ph));
      gv.push(...arrowGeo(T, p, d, LV, .012)); gd.push(...arrowGeo(T, p, c, LDV, .012)); gp.push(flat(new T.SphereGeometry(.03, 10, 8)).translate(p.x, TY + .03, p.z)); }
    const ghM = col => new T.MeshBasicMaterial({color: col, transparent: true, opacity: 0, depthWrite: false, toneMapped: false});
    const ghosts = [new T.Mesh(merge(T, gv), ghM(COL.vor)), new T.Mesh(merge(T, gd), ghM(COL.dv)), new T.Mesh(merge(T, gp), ghM(L0.acc))];
    ghosts.forEach(m => { m.visible = false; g.add(m); });
    // Tafel (Draufsicht): links die Pfeile aneinandergehängt, rechts die Bahn von oben mit Fahrzeug, v und Δv zur Bahnmitte – beides dreht sich mit
    const BW = 2.3, BH = 1.36, BYc = 2.12, BZ = -1.06, PXM = BW / 1024, AZ = BZ + .05;
    const bx = p => p * PXM - BW / 2, by = p => BYc + BH / 2 - p * PXM;               // Leinwand-Pixel → Tafelkoordinaten
    const OX = bx(262), OY = by(258), LB = .3, PX = bx(770), PY = by(262), PR = .25, LS = .2, LSD = LS * 2 * Math.sin(DPH / 2);
    { const bb = bucket(T);
      bb.box(mBody, BW + .14, BH + .14, .05, 0, BYc, BZ - .03);
      for (const s of [-1, 1]) { bb.box(mFrame, BW + .18, .04, .07, 0, BYc + s * (BH / 2 + .05), BZ - .01); bb.box(mFrame, .04, BH + .18, .07, s * (BW / 2 + .05), BYc, BZ - .01);
        bb.box(mBody, .08, BYc - BH / 2, .08, s * 1.05, (BYc - BH / 2) / 2, BZ - .06); bb.box(mFrame, .16, .05, .36, s * 1.05, .025, BZ - .06); }
      bb.build(g, true); }
    const brd = screen(ctx, BW, BH, 1024, (q, w, h) => { panel(q, w, h, L0); q.textBaseline = "middle"; const X = x => (x + BW / 2) / BW * w, Y = y => (BYc + BH / 2 - y) / BH * h, k = w / BW;
      q.fillStyle = L0.acc; rt(q, "Kurvenfahrt in der Draufsicht", 36, 48, 40, TF("Kurvenfahrt in der Draufsicht"), "left", 700);
      q.strokeStyle = L0.grid; q.lineWidth = 3; q.beginPath(); q.moveTo(X((OX + PX) / 2 + .04), 92); q.lineTo(X((OX + PX) / 2 + .04), 420); q.stroke();
      // links: gemeinsamer Anfang der Pfeile
      q.fillStyle = L0.dim; q.beginPath(); q.arc(X(OX), Y(OY), 6, 0, TAU); q.fill();
      // rechts: Bahn von oben mit Mittelpunkt
      q.fillStyle = L0.dim; rt(q, "Bahn von oben", X(PX), 100, 26, L0.bf, "center", 700);
      q.strokeStyle = L0.dim; q.lineWidth = 6; q.globalAlpha = .8; q.beginPath(); q.arc(X(PX), Y(PY), PR * k, 0, TAU); q.stroke(); q.globalAlpha = 1;
      q.fillStyle = COL.dv; q.beginPath(); q.arc(X(PX), Y(PY), 8, 0, TAU); q.fill();
      q.fillStyle = L0.fg; rt(q, "Mitte", X(PX), Y(PY) + 27, 22, L0.bf, "center", 700);
      // Merksätze
      q.fillStyle = L0.fg; rt(q, "v_{vorher} + Δv = v_{nachher}", 36, 468, 34, L0.bf, "left", 700);
      const s2 = "Beide v-Pfeile sind gleich lang: Nur die Richtung ändert sich.", s3 = "Δv zeigt zur Mitte der Kurvenbahn (Tischmitte).";
      let f2 = 28; while (f2 > 22 && rt(q, s2, 0, 0, f2, L0.bf, "left", 700, true) > w - 72) f2--;
      q.fillStyle = L0.dim; rt(q, s2, 36, 514, f2, L0.bf, "left", 700);
      q.fillStyle = COL.dv; rt(q, s3, 36, 556, 30, L0.bf, "left", 700);
    });
    brd.position.set(0, BYc, BZ + .006); g.add(brd);
    const kV = arrowIn(ctx, g, COL.vor, .02), kD = arrowIn(ctx, g, COL.dv, .02), kN = arrowIn(ctx, g, COL.nach, .02);
    const kt = [tag(ctx, "v_{vorher}", COL.vor, .085, L0.bf), tag(ctx, "Δv", COL.dv, .085, L0.bf), tag(ctx, "v_{nachher}", COL.nach, .085, L0.bf)]; kt.forEach(s => g.add(s));
    const sV = arrowIn(ctx, g, COL.vor, .016), sD = arrowIn(ctx, g, COL.dv, .016), sDot = ctx.mesh(new T.SphereGeometry(.026, 14, 10), ctx.mat("color", {color: L0.acc, rough: .4}), false); g.add(sDot);
    const sTv = tag(ctx, "v", COL.vor, .075, L0.bf), sTd = tag(ctx, "Δv", COL.dv, .075, L0.bf); g.add(sTv, sTd);
    let ph = .6, snap = false, gk = 0;
    ctx.tick((dt, t) => {
      const om = .5, ds = om * RR * dt; ph = (ph + om * dt) % TAU;
      const px = Math.cos(ph) * RR, pz = -Math.sin(ph) * RR, dx = -Math.sin(ph), dz = -Math.cos(ph);
      car.position.set(px, cy, pz); car.rotation.y = Math.atan2(-dz, dx); car.update(dt, t, .3, ds, 1);
      aV.set([px, ay, pz], [px + dx * LV, ay, pz + dz * LV]); tv.position.set(px + dx * (LV + .08), ay + .05, pz + dz * (LV + .08));
      aD.set([px, ay - .04, pz], [px - px / RR * LDV, ay - .04, pz - pz / RR * LDV]); td.position.set(px - px / RR * (LDV + .1), ay, pz - pz / RR * (LDV + .1));
      // Draufsicht auf der Tafel: (x, z) → (x, −z)
      const d0 = [-Math.sin(ph - DPH), Math.cos(ph - DPH)], d1 = [-Math.sin(ph), Math.cos(ph)];
      const O = [OX, OY, AZ], T0 = [OX + d0[0] * LB, OY + d0[1] * LB, AZ], T1 = [OX + d1[0] * LB, OY + d1[1] * LB, AZ + .004];
      kV.set(O, T0); kN.set(O, [T1[0], T1[1], AZ + .008]); kD.set(T0, T1);
      const m0 = LB * .5, m1 = LB * .5, sx = d0[0] + d1[0], sy = d0[1] + d1[1], sl = Math.hypot(sx, sy) || 1;
      kt[0].position.set(OX + d0[0] * m0 + d0[1] * .1, OY + d0[1] * m0 - d0[0] * .1, AZ + .02);
      kt[2].position.set(OX + d1[0] * m1 - d1[1] * .11, OY + d1[1] * m1 + d1[0] * .11, AZ + .02);
      kt[1].position.set((T0[0] + T1[0]) / 2 + sx / sl * .085, (T0[1] + T1[1]) / 2 + sy / sl * .085, AZ + .02);
      // Skizze der Bahn: Fahrzeug, v tangential, Δv zur Mitte der Bahn
      const cx2 = Math.cos(ph), cy2 = Math.sin(ph), qx = PX + cx2 * PR, qy = PY + cy2 * PR;
      sDot.position.set(qx, qy, AZ + .01);
      sV.set([qx, qy, AZ + .012], [qx + d1[0] * LS, qy + d1[1] * LS, AZ + .012]); sTv.position.set(qx + d1[0] * (LS + .06), qy + d1[1] * (LS + .06), AZ + .02);
      sD.set([qx, qy, AZ + .014], [qx - cx2 * LSD, qy - cy2 * LSD, AZ + .014]); sTd.position.set(qx - cx2 * LSD * .5 + d1[0] * -.06, qy - cy2 * LSD * .5 + d1[1] * -.06, AZ + .02);
      gk += ((snap ? 1 : 0) - gk) * Math.min(1, dt * 3); ghosts.forEach((m, i) => { m.visible = gk > .01; m.material.opacity = gk * (i === 2 ? .8 : i === 0 ? .38 : .5); });
    });
    hitBox(ctx, g, 2.35, 2.8, 2.05, 0, 1.4, -.08);
    ctx.exhibit(g, {label: "Kurvenfahrt", sub: "anklicken: Momentaufnahmen", dist: 2.8, pitch: -.26, title: "Kurvenfahrt: Δv zeigt zur Kreismitte",
      onClick: () => { snap = !snap; },
      get text(){ return "Der Körper fährt mit **gleichbleibendem Tempo** im Kreis. Alle Geschwindigkeitspfeile sind gleich lang – der **Betrag** bleibt gleich –, aber ihre **Richtung** ändert sich ständig. " +
        "Also ändert sich die Geschwindigkeit!\n\nDie Zusatzgeschwindigkeit **Δv zeigt immer zur Kreismitte**, hier also zur Mitte des Tisches. Sie dreht den Pfeil, ohne ihn länger oder kürzer zu machen – wie bei einem Auto in der Kurve. " +
        "Auf der Tafel siehst du links die aneinandergehängten Pfeile **v_{nachher} = v_{vorher} + Δv** und rechts die Bahn von oben." + (snap ? "\n\nDie hellen Pfeile sind **Momentaufnahmen** im Abstand von je einer Achtelrunde." : ""); }});
    ctx.obstacle(S.D.x, S.D.z, 1.0); ctx.obstacleBox(S.D.x - 1.06, S.D.z, .3, 2.55);
  }

  /* =====================================================================
     Luftraum über dem Gang: Flugmodell mit Geschwindigkeitspfeil
     ===================================================================== */
  {
    // Zauberwelt: über den schwebenden Kerzen des Weltstils (außerhalb |x| < 2,2, Flammen bis etwa 5,7 m) und unter den Deckenbalken (ab 7,15 m)
    const ZB = W === "zauber", fly = new T.Group(), b = bucket(T), YF = ZB ? 6.3 : Math.min(4.6, H - 2), ZC = ZB ? .5 : 2.2, AX = ZB ? 1.8 : 2.3, AZ = ZB ? 4.0 : 4.6;
    const BOB = ZB ? .08 : .12, AO = ZB ? .3 : .42;
    if (W === "zauber") {   // Papierflieger
      const pm = new T.MeshStandardMaterial({color: 0xf3e6c8, roughness: .9, side: T.DoubleSide}), geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute([.4, 0, 0, -.25, .02, .24, -.25, 0, 0,  .4, 0, 0, -.25, 0, 0, -.25, .02, -.24,  .4, 0, 0, -.25, 0, 0, -.25, -.1, 0], 3)); geo.computeVertexNormals();
      const m = new T.Mesh(geo, pm); fly.add(m); const s = ctx.glow(0xffd27a, .35); s.position.x = -.35; fly.add(s);
    } else if (W === "sterne") {   // Drohne
      b.cyl(ctx.mat("plastic", {color: "#e4ebf3"}), .14, .16, .06, 24, 0, 0, 0); b.cyl(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), .1, .1, .065, 24, 0, 0, 0);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; b.box(ctx.mat("metal"), .26, .02, .03, Math.cos(a) * .2, 0, Math.sin(a) * .2, 0, -a, 0);
        b.put(ctx.mat("glass", {color: "#bfe8ff", opacity: .3}), new T.CylinderGeometry(.1, .1, .006, 20), Math.cos(a) * .33, .03, Math.sin(a) * .33); }
      const s = ctx.glow(0xff5c5c, .2); s.position.set(.17, 0, 0); fly.add(s);
    } else {   // Luftschiff
      b.put(ctx.mat("cloth", {color: "#d8c9a6"}), new T.SphereGeometry(.2, 24, 14).scale(3, 1, 1), 0, 0, 0);
      b.box(ctx.mat("darkwood"), .28, .07, .09, .05, -.25, 0); b.cyl(ctx.mat("brass"), .004, .004, .07, 4, -.04, -.19, .03); b.cyl(ctx.mat("brass"), .004, .004, .07, 4, .14, -.19, .03);
      for (const [y, z] of [[.15, 0], [-.15, 0], [0, .15], [0, -.15]]) b.box(ctx.mat("darkwood"), .18, y ? .14 : .01, z ? .14 : .01, -.55, y * .8, z * .8);
      for (let i = 0; i < 3; i++) b.box(ctx.mat("brass"), .015, .41, .015, -.2 + i * .2, 0, 0, Math.PI / 2, 0, 0);
    }
    b.build(fly, false); fly.children.forEach(c => c.scale.multiplyScalar(W === "detektiv" ? 1.2 : 1.6)); ctx.add(fly, 0, YF, ZC);
    const fA = arrowIn(ctx, ctx.group, ctx.pal.accent, .04), fT = tag(ctx, "v", ctx.pal.accent, .26, L0.bf); ctx.group.add(fT);
    let fp = 0;
    ctx.tick((dt, t) => { const sx = -AX * Math.sin(fp), sz = AZ * Math.cos(fp), sp = Math.hypot(sx, sz) || 1; fp = (fp + 1.0 * dt / sp) % TAU;
      const x = AX * Math.cos(fp), z = ZC + AZ * Math.sin(fp), dx = sx / sp, dz = sz / sp, y = YF + Math.sin(t * .7) * BOB;
      fly.position.set(x, y, z); fly.rotation.set(0, Math.atan2(-dz, dx), 0); fly.rotateX(.28);
      fA.set([x, y + AO, z], [x + dx * 1.1, y + AO, z + dz * 1.1]); fT.position.set(x + dx * 1.3, y + AO + .08, z + dz * 1.3); });
  }

  /* =====================================================================
     Vorne rechts neben Station 4: Ausstellungsstück je Welt (Besenständer · Gleiter auf Drehteller · Hochrad)
     ===================================================================== */
  {
    const g = new T.Group(), b = bucket(T), EX = 4.25, EZ = -9.45; ctx.add(g, EX, 0, EZ); g.rotation.y = -.88;
    if (W === "zauber") {
      for (const x of [-.45, .45]) { b.cyl(ctx.mat("darkwood"), .035, .045, 1.95, 10, x, .975, -.15); b.put(ctx.mat("brass"), new T.SphereGeometry(.045, 12, 8), x, 1.99, -.15); }
      b.cyl(ctx.mat("darkwood"), .03, .03, 1.0, 10, 0, 1.38, -.15, 0, 0, Math.PI / 2); b.box(ctx.mat("darkwood"), 1.1, .06, .4, 0, .03, 0);
      // Messingstange zwischen den Pfosten, darunter hängt das Wimpeltuch „Rennbesen“ (vorn und hinten lesbar)
      b.cyl(ctx.mat("brass"), .01, .01, .92, 8, 0, 1.9, -.15, 0, 0, Math.PI / 2);
      const bt = R3D.util.canvasTex(512, 256, (q, w, h) => {
        q.fillStyle = "#6B1420"; q.fillRect(0, 0, w, h); q.strokeStyle = "#E3B341"; q.lineWidth = 8; q.strokeRect(14, 14, w - 28, h - 28);
        q.fillStyle = "#E3B341"; q.font = `700 64px ${L0.bf}`; q.textAlign = "center"; q.textBaseline = "middle"; q.fillText("Rennbesen", w / 2, h * .42);
        q.save(); q.translate(w / 2, h * .76); q.rotate(-.35); q.fillRect(-70, -3, 110, 6); q.beginPath(); q.moveTo(40, -10); q.lineTo(92, -22); q.lineTo(92, 22); q.lineTo(40, 10); q.closePath(); q.fill(); q.restore();
        for (const s of [-1, 1]) { q.beginPath(); q.arc(w / 2 + s * 150, h * .76, 7, 0, TAU); q.fill(); }
      }, "b1-rennbesen");
      const btM = new T.MeshStandardMaterial({map: bt, roughness: 1});
      for (const r of [0, Math.PI]) { const p = new T.Mesh(new T.PlaneGeometry(.5, .25), btM); p.position.set(0, 1.765, -.15 + (r ? -.002 : .002)); p.rotation.y = r; g.add(p); }
      for (const [x, a] of [[-.3, .12], [0, -.05], [.3, -.16]]) { const m = new T.Matrix4().compose(new T.Vector3(x, .78, 0), new T.Quaternion().setFromEuler(new T.Euler(-.12, 0, a)), new T.Vector3(1, 1, 1));
        b.putM(ctx.mat("wood"), new T.CylinderGeometry(.016, .02, 1.25, 8).translate(0, .2, 0), m);
        b.putM(ctx.mat("color", {color: "#c9a14a", rough: .95}), new T.CylinderGeometry(.03, .1, .36, 14).translate(0, -.55, 0), m);
        b.putM(ctx.mat("brass"), new T.TorusGeometry(.034, .007, 6, 16).rotateX(Math.PI / 2).translate(0, -.38, 0), m); }
    } else if (W === "sterne") {
      b.cyl(ctx.mat("metal"), .62, .7, .14, 40, 0, .07, 0); b.put(ctx.mat("glow", {color: "#FFE81F", intensity: 1.2}), new T.TorusGeometry(.6, .015, 6, 64), 0, .145, 0, Math.PI / 2, 0, 0);
      b.cyl(ctx.mat("plastic", {color: "#2a3442"}), .5, .5, .02, 40, 0, .15, 0);
      const tt = new T.Group(); tt.position.y = .16; g.add(tt); const gl = vehicle(ctx, 2.2); gl.position.y = .02; tt.add(gl);
      const ring = ctx.mesh(new T.TorusGeometry(.7, .01, 6, 64), ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), false); ring.rotation.x = Math.PI / 2; ring.position.y = .7; g.add(ring);
      ctx.tick((dt, t) => { tt.rotation.y = t * .35; gl.update(dt, t, 1, 0, 0); ring.position.y = .5 + .35 * (.5 + .5 * Math.sin(t * .9)); });
    } else {
      const R1 = .62, R2 = .2, LIFT = .082, yw = R1 + LIFT, xr = -.86, PL = 1.7, PX = -.25;   // Reifen stehen auf der 6 cm hohen Holzplatte
      for (const [rr, x, y] of [[R1, 0, yw], [R2, xr, R2 + LIFT]]) { b.put(ctx.mat("rubber"), new T.TorusGeometry(rr, .022, 8, 48), x, y, 0); b.put(ctx.mat("steel"), new T.TorusGeometry(rr - .02, .008, 6, 48), x, y, 0);
        b.cyl(ctx.mat("brass"), .03, .03, .1, 12, x, y, 0, Math.PI / 2, 0, 0);
        for (let i = 0; i < (rr > .5 ? 20 : 10); i++) { const a = i / (rr > .5 ? 20 : 10) * Math.PI; b.cyl(ctx.mat("steel"), .003, .003, 2 * (rr - .02), 4, x, y, 0, 0, 0, a); } }
      const fr = new T.CatmullRomCurve3([[.04, yw + .62, 0], [-.25, yw + .55, 0], [-.6, yw + .25, 0], [xr + .05, R2 + LIFT + .08, 0]].map(q => new T.Vector3(...q)));
      b.put(ctx.mat("metal"), new T.TubeGeometry(fr, 24, .02, 8, false));
      for (const z of [-.06, .06]) b.cyl(ctx.mat("metal"), .012, .012, .66, 8, .02, yw + .3, z);
      b.box(ctx.mat("cloth", {color: "#3a2418"}), .2, .05, .1, -.16, yw + .63, 0);
      b.cyl(ctx.mat("metal"), .012, .012, .6, 8, .1, yw + .72, 0, Math.PI / 2, 0, 0); for (const z of [-.3, .3]) b.cyl(ctx.mat("darkwood"), .02, .02, .1, 8, .1, yw + .72, z, Math.PI / 2, 0, 0);
      b.box(ctx.mat("darkwood"), PL, .06, .5, PX, .03, 0);                          // so kurz, dass sie den Sockel des Bücherregals an der Vorderwand nicht berührt
    }
    b.build(g, true);
    if (W === "detektiv") { const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y);   // Holzplatte (1,7 m lang, Mitte lokal x = −0,25) ganz abdecken
      ctx.obstacle(EX - .25 * c, EZ + .25 * s, .93); }
    else ctx.obstacle(EX, EZ, .85);
  }

  /* ===== Wandtafeln (Mitte 3,9 m, Unterkante 2,9 m: über den Stationsschildern, auch vom Mittelgang aus gesehen) ===== */
  // Formel nicht im Titel: der große Titel der Raumstation bricht sonst mitten in „Δs : Δt“ um
  ctx.wallBoard("left", 6.75, 3.9, 3.2, 2.0, "Geschwindigkeit", ["v = Δs : Δt", "Δs: zurückgelegte Strecke", "Δt: dafür benötigte Zeitspanne", "Einheit: 1 m/s (Meter pro Sekunde)", "Umgestellt: Δs = v · Δt und Δt = Δs : v"]);
  ctx.wallBoard("right", 2.25, 3.9, 3.2, 2.0, "Umrechnen: m/s und km/h", ["1 m/s = 3,6 km/h", "m/s → km/h: mal 3,6", "km/h → m/s: durch 3,6 teilen", "Beispiel: 25 m/s = 90 km/h"]);
  // Titel ohne großes „M“ (die Zier-Schrift der Zauberwelt setzt es wie „(D“); „Moment“ allein wäre als Fachwort missverständlich
  ctx.wallBoard("left", -2.25, 3.9, 3.2, 2.0, "Durchschnittlich oder momentan?", ["Durchschnittsgeschwindigkeit = Gesamtstrecke : Gesamtzeit", "Momentangeschwindigkeit: zeigt der Tacho", "t-s-Diagramm: Steigung = Geschwindigkeit", "Waagrechte Linie: Stillstand"]);
  // kurze Zeilen mit echten Tiefstellungen, damit nichts umbricht oder unten über den Rand läuft;
  // „mit gleichem Tempo“ muss bleiben: Bremst oder beschleunigt man in der Kurve, zeigt Δv nicht zur Kurvenmitte
  ctx.wallBoard("right", -6.75, 3.9, 3.2, 2.0, "Geschwindigkeitspfeil", ["Geschwindigkeit hat Betrag und Richtung", "Pfeillänge im Maßstab = Betrag", "v_{nachher} = v_{vorher} + Δv", "Δv an die Spitze von v_{vorher} hängen", "Kurve mit gleichem Tempo: Δv zeigt zur Kurvenmitte"]);
};
})();
