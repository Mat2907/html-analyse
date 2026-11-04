/* ---------- 20_beweg2.js ---------- */
/* =====================================================================
   Raum · Newtonsche Bewegungsgleichung (Kap. 3.4–3.5)
   Mittelstück: Fahrbahn mit zwei Wagen (1 kg und 2 kg). Zwei Schiebewagen mit Kraftmesser drücken gleich lang mit gleicher Kraft
                → der leichtere Wagen erhält das doppelte Δv. Tafel mit live gezeichnetem t-v-Diagramm (3 Versuchsreihen per Klick).
                Labor (ctx.lab): Kraft F einstellbar, Δt = 1,0 s, nur der 2-kg-Wagen fährt, mit einer Kiste unbekannter Masse darauf (zusammen 2,5 kg);
                Lichtschranke misst Δv → F-Δv-Ursprungsgerade, m = F · Δt : Δv.
   A: Triebwerksmodell (Funkenrakete / Raumgleiter / Dampfraketen-Wagen): Schub F wirkt Δt lang → Δv
   B: Schuss in Zeitlupe: sehr kurze Kontaktzeit, große Kraft – das Netz bremst mit längerer Einwirkdauer und kleinerer Kraft
   C: Bremsen: Kraft entgegen der Bewegung, Δv zeigt nach hinten (Pfeildiagramm live), sichtbare Bremsklötze bzw. Bremsdüsen
   D: Wagen am fallenden Wägestück (Galgen mit großer Umlenkrolle, Fallschacht mit Skala): a = F : m, t-v-Gerade, danach gleichförmig
   Pfeilmaßstab überall 1 N ≙ 25 cm, 1 m/s ≙ 30 cm (nur B hat wegen 450 N einen eigenen, dort angeschriebenen Maßstab)
   Luftraum über dem Gang: Schild „1 N = 1 kg · m/s²“
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
const COL = {v: "#3d8bff", dv: "#ff4b3a", F: "#ffa733", m1: "#5ec8ff", m2: "#d39bff"};   // in allen Welten gleich
const TAU = Math.PI * 2;
const de = (x, d = 1) => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(d).replace(".", ",");
const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// Einheitliche Pfeilmaßstäbe im ganzen Raum (Ausnahme B, dort steht der eigene Maßstab auf der Tafel)
const SF = .25, SV = .3;   // 1 N ≙ 25 cm · 1 m/s ≙ 30 cm

/* ---------- Weltabhängige Farben für Anzeigen ---------- */
// tf: Titelschrift (Wörter) · ff: Schrift für Formeln und Einheiten (die Zier-Unziale der Zauberwelt zeichnet „N“ wie „n“ und „t“ wie „τ“)
function look(ctx){
  const k = ctx.kit, w = ctx.world;
  if (w === "sterne") return {bg: "#061527", fg: "#eaf6ff", acc: "#FFE81F", acc2: "#4FC3F7", dim: "#8fb4cc", grid: "rgba(79,195,247,.2)", tf: k.font, ff: k.font, bf: k.fontBody,
    frame: "steel", body: "metal", face: "#08192b", ink: "#d8f1ff", scan: true, turf: "#14263a", line: "#4FC3F7"};
  if (w === "detektiv") return {bg: "#16201b", fg: "#f3e6cc", acc: "#E0A86A", acc2: "#8fd1bf", dim: "#b3a68c", grid: "rgba(243,230,204,.14)", tf: k.font, ff: "Georgia, 'Times New Roman', serif", bf: k.fontBody,
    frame: "brass", body: "darkwood", face: "#f2e8d2", ink: "#2a2118", speck: true, turf: "#2c4a32", line: "#efe6cf"};
  return {bg: "#1b221e", fg: "#f4ecd8", acc: "#E3B341", acc2: "#a9c4ff", dim: "#aab3a2", grid: "rgba(244,236,216,.13)", tf: k.font, ff: k.fontBody || "Palatino, Georgia, serif", bf: k.fontBody,
    frame: "brass", body: "darkwood", face: "#f1e4c4", ink: "#2b1a10", speck: true, turf: "#2f5a2c", line: "#f1e4c4"};
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
// passt die Schriftgröße an die verfügbare Breite an
function rtFit(g, s, x, y, size, font, maxW, align = "left", weight = 600){
  let fs = size; while (fs > 12 && rt(g, s, 0, 0, fs, font, "left", weight, true) > maxW) fs -= 1;
  return rt(g, s, x, y, fs, font, align, weight);
}
function panel(g, W, H, L){
  g.fillStyle = L.bg; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * .3, H * .2, 10, W * .5, H * .5, Math.max(W, H) * .8); gr.addColorStop(0, "rgba(255,255,255,.07)"); gr.addColorStop(1, "rgba(0,0,0,.28)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (L.speck) { const r = R3D.util.seeded(W * 7 + H); for (let i = 0; i < W * H / 300; i++) { g.fillStyle = r() < .5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.09)"; g.fillRect(r() * W, r() * H, 2, 2); } }
  if (L.scan) for (let y = 0; y < H; y += 5) { g.fillStyle = "rgba(79,195,247,.04)"; g.fillRect(0, y, W, 2); }
  const m = Math.max(10, W / 70); g.strokeStyle = L.acc; g.globalAlpha = .7; g.lineWidth = Math.max(3, W / 300);
  g.beginPath(); g.roundRect(m, m, W - 2 * m, H - 2 * m, m * 1.3); g.stroke(); g.globalAlpha = 1;
}
function cArrow(g, x1, y1, x2, y2, w, col){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 2) return;
  const a = Math.atan2(y2 - y1, x2 - x1), hl = Math.min(w * 3.2, L * .6); g.strokeStyle = g.fillStyle = col; g.lineWidth = w;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hl * .8, y2 - Math.sin(a) * hl * .8); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - .42) * hl, y2 - Math.sin(a - .42) * hl); g.lineTo(x2 - Math.cos(a + .42) * hl, y2 - Math.sin(a + .42) * hl); g.closePath(); g.fill();
}
// Achsenkreuz mit Gitter für Diagramme: gibt Umrechnungen zurück
function axes(g, L, o){
  const {x0, x1, y0, y1, tMax, vMax, tStep, vStep, tLab, vLab, fs = 24} = o, X = t => x0 + t / tMax * (x1 - x0), Y = v => y1 - v / vMax * (y1 - y0);
  const dec = st => st < .099 ? 2 : st < 1 ? 1 : 0;
  g.strokeStyle = L.grid; g.lineWidth = 2;
  for (let t = tStep; t <= tMax + 1e-6; t += tStep) { g.beginPath(); g.moveTo(X(t), y0); g.lineTo(X(t), y1); g.stroke(); }
  for (let v = vStep; v <= vMax + 1e-6; v += vStep) { g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); }
  cArrow(g, x0 - 6, y1, x1 + 30, y1, 4, L.fg); cArrow(g, x0, y1 + 6, x0, y0 - 30, 4, L.fg);
  g.fillStyle = L.fg; g.textBaseline = "middle";
  for (let t = 0; t <= tMax + 1e-6; t += tStep) rt(g, t ? de(t, dec(tStep)) : "0", X(t), y1 + fs * 1.05, fs, L.bf, "center", 600);
  for (let v = vStep; v <= vMax + 1e-6; v += vStep) rt(g, de(v, dec(vStep)), x0 - 12, Y(v), fs, L.bf, "right", 600);
  rt(g, tLab, x1 + 26, y1 + fs * 2.2, fs, L.bf, "right", 700); rt(g, vLab, x0 + 14, y0 - fs * 1.1, fs, L.bf, "left", 700);
  return {X, Y};
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
    box(mat, w, h, d, x, y, z, rx, ry, rz){ return B.put(mat, new T.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    cyl(mat, r1, r2, h, seg, x, y, z, rx, ry, rz){ return B.put(mat, new T.CylinderGeometry(r1, r2, h, seg), x, y, z, rx, ry, rz); },
    sph(mat, r, x, y, z, seg = 14){ return B.put(mat, new T.SphereGeometry(r, seg, Math.max(6, seg * .7 | 0)), x, y, z); },
    build(parent, cast = true){ const out = [];
      for (const [mat, gs] of parts) { const m = new T.Mesh(merge(T, gs), mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); out.push(m); gs.forEach(g => g.dispose()); }
      parts.clear(); return out; }
  };
  return B;
}

/* ---------- Anzeigen, Beschriftungen, Pfeile ---------- */
function screen(ctx, w, h, px, draw, back = 0, round = false){
  // logische Zeichenfläche (px), echte Textur höchstens 1024 Pixel breit/hoch
  const T = ctx.T, c = document.createElement("canvas"), cw = Math.round(w >= h ? px : px * w / h), ch = Math.round(h >= w ? px : px * h / w), k = Math.min(1, 1024 / Math.max(cw, ch));
  c.width = Math.max(1, Math.round(cw * k)); c.height = Math.max(1, Math.round(ch * k));
  const g = c.getContext("2d"), tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new T.MeshBasicMaterial({map: tex, toneMapped: false}), m = new T.Mesh(round ? new T.CircleGeometry(w / 2, 48) : new T.PlaneGeometry(w, h), mat);
  if (back) { const b = new T.Mesh(m.geometry, mat); b.rotation.y = Math.PI; b.position.z = -back; m.add(b); }   // Rückseite (gleiches Bild)
  m.redraw = (...a) => { g.setTransform(k, 0, 0, k, 0, 0); draw(g, cw, ch, ...a); tex.needsUpdate = true; };
  m.redraw(); return m;
}
// Schwebendes Schildchen mit wechselbarem Text (feste Leinwand, keine Größenänderung der Textur)
function liveTag(ctx, h, font){
  const T = ctx.T, c = document.createElement("canvas"); c.width = 640; c.height = 96; const g = c.getContext("2d"), f = font || ctx.kit.fontBody;
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const sp = new T.Sprite(new T.SpriteMaterial({map: t, transparent: true, depthWrite: false, toneMapped: false}));
  sp.scale.set(h * c.width / c.height, h, 1); sp.renderOrder = 5; let cur = null;
  sp.set = (s, col) => { const k = s + "|" + col; if (k === cur) return; cur = k; g.clearRect(0, 0, c.width, c.height);
    let px = 66, tw; while ((tw = rt(g, s, 0, 0, px, f, "left", 700, true)) > c.width - px * .9 && px > 28) px -= 3;
    const pw = tw + px * .75, x0 = (c.width - pw) / 2; g.fillStyle = "rgba(8,10,16,.62)"; g.beginPath(); g.roundRect(x0, 8, pw, c.height - 16, (c.height - 16) / 2); g.fill();
    g.fillStyle = col; g.textBaseline = "middle"; rt(g, s, c.width / 2, c.height / 2 + 2, px, f, "center", 700); t.needsUpdate = true; };
  return sp;
}
const arrowIn = (ctx, parent, color, thick) => { const a = ctx.arrow([0, 0, 0], [0, .1, 0], color, thick); parent.add(a); return a; };
// Pfeil entlang lokal x (Länge L, auch negativ) setzen oder ausblenden
const hArrow = (a, x, y, z, L) => { if (Math.abs(L) < .015) { a.visible = false; return; } a.set([x, y, z], [x + L, y, z]); };

/* ---------- Fahrbahnen und Wagen je Welt (Fahrtrichtung lokal +x, Oberkante der Bahn = y + 0,03) ---------- */
function lane(ctx, b, x0, x1, z, y, wd = .2){
  const W = ctx.world, L = x1 - x0, xc = (x0 + x1) / 2, k = wd / .2;
  if (W === "zauber") {        // Gleitrinne aus Stein mit Messingkanten und Leuchtrune
    b.box(ctx.mat("stone"), L, .028, wd, xc, y + .014, z);
    for (const s of [-1, 1]) b.box(ctx.mat("brass"), L, .018, .016, xc, y + .037, z + s * wd / 2);
    b.box(ctx.mat("glow", {color: "#E3B341", intensity: 1.3}), L - .04, .004, .014, xc, y + .03, z);
    for (let x = x0 + .25; x < x1 - .1; x += .5) b.box(ctx.mat("brass"), .012, .02, wd + .02, x, y + .02, z);
  } else if (W === "sterne") { // Luftkissenbahn
    b.box(ctx.mat("steel"), L, .03, .13 * k, xc, y + .015, z); b.box(ctx.mat("metal"), L, .02, .07 * k, xc, y - .008, z);
    for (const s of [-1, 1]) b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), L - .04, .005, .008, xc, y + .031, z + s * .056 * k);
    for (let x = x0 + .1; x < x1 - .05; x += .08) b.box(ctx.mat("metal", {color: "#1b2533"}), .012, .002, .012, x, y + .031, z);
  } else {                     // Schienen auf Schwellen
    const n = Math.floor(L / .11); for (let i = 0; i < n; i++) b.box(ctx.mat("darkwood"), .035, .012, .19 * k, x0 + (i + .5) * L / n, y + .006, z);
    for (const s of [-1, 1]) b.box(ctx.mat("steel"), L, .018, .012, xc, y + .021, z + s * .055 * k);
  }
}
function cart(ctx, o){
  const T = ctx.T, W = ctx.world, g = new T.Group(), body = new T.Group(); g.add(body);
  const b = bucket(T), len = o.len || .26, wid = o.wid || .15, sc = o.sc || 1, axles = []; let top, mid, nose = 0;
  body.scale.setScalar(sc);
  if (W === "zauber") {        // Gleitschlitten mit Messingkufen
    const y0 = .016; mid = y0 + .035;
    b.box(ctx.mat("darkwood"), len, .05, wid, 0, y0 + .035, 0);
    b.box(ctx.mat("brass"), len + .014, .01, wid + .014, 0, y0 + .064, 0);
    for (const s of [-1, 1]) b.box(ctx.mat("brass"), .012, .052, wid + .008, s * (len / 2 + .004), y0 + .035, 0);
    for (const s of [-1, 1]) { b.box(ctx.mat("brass"), len * .86, .008, .012, -.012, y0 + .002, s * wid * .36);
      b.put(ctx.mat("brass"), new T.TorusGeometry(.024, .005, 6, 10, Math.PI * .5), len * .43 - .012, y0 + .026, s * wid * .36, 0, 0, -Math.PI / 2); }
    b.sph(ctx.mat("crystal", {color: o.color, intensity: 1.1}), .02, 0, y0 + .085, 0, 10); b.cyl(ctx.mat("brass"), .018, .022, .012, 10, 0, y0 + .072, 0);
    top = y0 + .1; nose = .01;
  } else if (W === "sterne") { // Schwebeschlitten
    const y0 = .012; mid = y0 + .03;
    const hull = ctx.mat("plastic", {color: "#e8eef5"});
    b.box(hull, len * .82, .046, wid, -len * .09, y0 + .03, 0);
    b.put(hull, new T.CylinderGeometry(wid / 2, wid / 2, .046, 18, 1, false, 0, Math.PI), len * .32, y0 + .03, 0);
    b.box(ctx.mat("plastic", {color: "#27313f"}), len * .45, .026, wid * .7, -.03, y0 + .066, 0);
    b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 2}), len * .85, .006, wid * .86, -.02, y0 + .004, 0);
    b.box(ctx.mat("glow", {color: o.color, intensity: 1.4}), .03, .012, wid * .72, -len * .44, y0 + .05, 0);
    top = y0 + .08; nose = len * .32 + wid / 2 - len / 2;
  } else {                     // Holzwagen mit Speichenrädern
    const r = .03; mid = r + .035;
    b.box(ctx.mat("wood"), len, .05, wid, 0, r + .035, 0);
    b.box(ctx.mat("brass"), len + .012, .012, wid + .012, 0, r + .066, 0);
    for (const s of [-1, 1]) b.box(ctx.mat("darkwood"), len * .98, .022, .012, 0, r + .018, s * (wid / 2 - .008));
    b.cyl(ctx.mat("brass"), .006, .006, .03, 8, len / 2 + .015, r + .03, 0, 0, 0, Math.PI / 2);
    for (const x of [-len * .3, len * .3]) { const ax = new T.Group(); ax.position.set(x, r, 0); body.add(ax); axles.push(ax);
      const ab = bucket(T);
      for (const z of [-.055, .055]) { ab.cyl(ctx.mat("metal"), r, r, .012, 18, 0, 0, z, Math.PI / 2, 0, 0);
        ab.box(ctx.mat("brass"), r * 1.7, .006, .015, 0, 0, z); ab.box(ctx.mat("brass"), .006, r * 1.7, .015, 0, 0, z); }
      ab.cyl(ctx.mat("steel"), .005, .005, .13, 6, 0, 0, 0, Math.PI / 2, 0, 0); ab.build(ax, false); }
    top = r + .074; nose = .03;
  }
  // Zusatzmasse (Schlitzgewichte auf einem Stift)
  const extra = new T.Group(); extra.position.y = top; body.add(extra);
  if (o.extra) { const eb = bucket(T), em = ctx.mat(W === "sterne" ? "steel" : "brass");
    for (let i = 0; i < o.extra; i++) eb.cyl(em, .05, .05, .022, 24, 0, .012 + i * .025, 0);
    eb.cyl(ctx.mat("metal"), .006, .006, .03 + o.extra * .025, 8, 0, .015 + o.extra * .0125, 0); eb.build(extra, true); }
  b.build(body, true);
  if (o.label) {   // Schild mit der Masse (Vorderseite +z)
    const pl = screen(ctx, .15, .046, 256, (q, w, h) => { q.fillStyle = "#0e1216"; q.fillRect(0, 0, w, h); q.fillStyle = o.color; q.textBaseline = "middle";
      rtFit(q, o.label, w / 2, h / 2 + 2, h * .74, ctx.kit.fontBody, w - 10, "center", 700); });
    pl.position.set(0, mid, wid / 2 + .008); body.add(pl);
  }
  g.userData.top = (top + (o.extra ? .015 + o.extra * .025 : 0)) * sc; g.userData.half = (len / 2 + nose) * sc; g.userData.topBody = top * sc;
  g.extra = extra; g.spin = ds => { for (const a of axles) a.rotation.z -= ds / (.03 * sc); };
  return g;
}
// Kleines Statusdisplay für die Konsolen im Raumschiff (eine gemeinsame Textur)
function miniTex(){ return R3D.util.canvasTex(256, 128, (q, w, h) => {
  q.fillStyle = "#06182a"; q.fillRect(0, 0, w, h); q.strokeStyle = "#4FC3F7"; q.lineWidth = 4; q.strokeRect(4, 4, w - 8, h - 8);
  const r = R3D.util.seeded(77); for (let i = 0; i < 8; i++) { const bh = 14 + r() * 62; q.fillStyle = i % 4 === 3 ? "#FFE81F" : "#4FC3F7"; q.fillRect(16 + i * 15, h - 16 - bh, 10, bh); }
  q.strokeStyle = "#8fe3ff"; q.lineWidth = 3; q.beginPath(); for (let x = 0; x <= 92; x += 4) { const y = 42 + Math.sin(x / 8) * 15; x ? q.lineTo(148 + x, y) : q.moveTo(148, y); } q.stroke();
  q.fillStyle = "#FFE81F"; q.fillRect(150, 80, 36, 10); q.fillStyle = "#4FC3F7"; q.fillRect(192, 80, 46, 10); q.fillRect(150, 98, 70, 8); }, "b2-mini"); }
// Experimentiertisch (lokal: Länge entlang x, Front nach +z): Holz mit Filz und Messing · im Raumschiff eine Konsole
function bench(ctx, b, L0, len, dep, top, o = {}){
  const W = ctx.world, mF = ctx.mat(L0.frame), zc = o.zc || 0, front = zc + dep / 2;
  if (W === "sterne") {
    const shell = ctx.mat("plastic", {color: "#c9d2dc"}), dark = ctx.mat("plastic", {color: "#27313f"}), glow = ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4});
    const pan = ctx.mat("plastic", {color: "#b4bfcb"}), amber = ctx.mat("glow", {color: "#FFE81F", intensity: 1.2});
    const mini = ctx._b2mini || (ctx._b2mini = new ctx.T.MeshBasicMaterial({map: miniTex(), toneMapped: false}));
    b.box(ctx.mat("metal"), len, .05, dep, 0, top - .025, zc);
    b.box(dark, len - .08, .006, dep - .08, 0, top + .003, zc);
    b.box(shell, len - .14, top - .17, dep - .16, 0, (top - .17) / 2 + .12, zc);
    b.box(dark, len - .26, .12, dep - .28, 0, .06, zc);
    b.box(glow, len - .26, .012, .012, 0, .1, front - .14);
    b.box(glow, len, .012, .012, 0, top - .052, front + .002);
    const n = Math.max(2, Math.round((len - .3) / .75)), pw = (len - .3) / n, fz = front - .08, yc = (top - .17) / 2 + .12;
    // Fugen: waagrecht über und unter den Paneelen, senkrecht zwischen ihnen und an den Stirnseiten
    for (const y of [top - .135, .17]) b.box(dark, len - .13, .008, .006, 0, y, fz + .002);
    for (let i = 0; i <= n; i++) b.box(dark, .012, top - .2, .006, -(len - .3) / 2 + i * pw, yc, fz + .002);
    for (const sx of [-1, 1]) { b.box(dark, .006, .008, dep - .15, sx * (len - .14) / 2, top - .135, zc); b.box(dark, .006, top - .2, .012, sx * (len - .14) / 2, yc, zc); }
    for (let i = 0; i < n; i++) { const x = -(len - .3) / 2 + (i + .5) * pw;
      b.box(pan, pw - .08, top - .38, .012, x, yc, front - .074);
      b.box(glow, .05, .012, .014, x - pw / 2 + .12, top - .3, front - .07); b.box(amber, .02, .012, .014, x - pw / 2 + .18, top - .3, front - .07);
      if (i % 2 === 0) { b.box(dark, .25, .15, .006, x + pw / 2 - .2, top - .34, front - .066); b.put(mini, new ctx.T.PlaneGeometry(.22, .12), x + pw / 2 - .2, top - .34, front - .0625); }   // kleines Display
      else for (let k = 0; k < 4; k++) b.box(dark, pw * .5, .012, .006, x + pw * .12, .29 + k * .034, front - .066);                                                                      // Lüftungsschlitze
    }
  } else {
    const body = ctx.mat(L0.body), felt = ctx.mat("cloth", {color: W === "zauber" ? "#3e1a1e" : "#25402f"});
    b.box(ctx.mat("darkwood"), len, .06, dep, 0, top - .03, zc);
    b.box(felt, len - .12, .006, dep - .12, 0, top + .002, zc);
    b.box(mF, len + .03, .02, dep + .03, 0, top - .066, zc);
    b.box(body, len - .16, .14, dep - .14, 0, top - .146, zc);
    const n = Math.max(2, Math.round((len - .4) / .7)), pw = (len - .4) / n;
    for (let i = 0; i < n; i++) { const x = -(len - .4) / 2 + (i + .5) * pw;
      b.box(ctx.mat("wood"), pw - .1, .08, .012, x, top - .146, front - .066); b.box(mF, .05, .03, .016, x, top - .146, front - .062); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * (len / 2 - .12), z = zc + sz * (dep / 2 - .1), hl = top - .22;
      b.cyl(body, .045, .032, hl, 12, x, .06 + hl / 2, z); b.cyl(mF, .055, .055, .025, 12, x, top - .23, z); b.cyl(mF, .042, .042, .02, 12, x, .3, z);
      b.sph(body, .06, x, top - .3, z, 12); b.sph(mF, .05, x, .05, z, 10); }
    b.box(body, len - .3, .035, .05, 0, .22, zc); for (const sx of [-1, 1]) b.box(body, .05, .035, dep - .25, sx * (len / 2 - .12), .22, zc);
  }
}
// Namensschild an der Vorderkante eines Tisches
function namePlate(ctx, parent, L0, txt, x, y, z, w = 1.0){
  const pl = screen(ctx, w, .17, 512, (g, ww, hh) => { panel(g, ww, hh, L0); g.textBaseline = "middle"; g.fillStyle = L0.acc; rtFit(g, txt, ww / 2, hh / 2 + 2, 46, L0.tf, ww - 60, "center", 700); });
  pl.position.set(x, y, z + .012); parent.add(pl);
  const b = bucket(ctx.T); b.box(ctx.mat(L0.frame), w + .04, .21, .02, x, y, z); b.build(parent, false); return pl;
}
// Kleine Requisiten auf einem Tisch (Kerze und Buch · Datenpad · Öllampe und Notizbuch)
function deskProps(ctx, b, parent, x, y, z, ry = 0){
  const W = ctx.world, T = ctx.T, c = Math.cos(ry), s = Math.sin(ry), P = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  if (W === "zauber") {
    let [px, pz] = P(-.08, 0); b.cyl(ctx.mat("brass"), .05, .055, .012, 16, px, y + .006, pz); b.cyl(ctx.mat("color", {color: "#f2ead8", rough: .7}), .016, .018, .12, 10, px, y + .072, pz);
    const fl = ctx.glow(0xffc070, .16); fl.position.set(px, y + .15, pz); parent.add(fl);
    [px, pz] = P(.1, 0); b.box(ctx.mat("cloth", {color: "#6B1420"}), .2, .02, .15, px, y + .01, pz, 0, ry + .2, 0);
    b.box(ctx.mat("paper"), .09, .012, .135, px - .045 * Math.cos(ry + .2), y + .027, pz + .045 * Math.sin(ry + .2), 0, ry + .2, .12);
    b.box(ctx.mat("paper"), .09, .012, .135, px + .045 * Math.cos(ry + .2), y + .027, pz - .045 * Math.sin(ry + .2), 0, ry + .2, -.12);
  } else if (W === "sterne") {
    let [px, pz] = P(-.06, 0); b.box(ctx.mat("plastic", {color: "#27313f"}), .2, .012, .13, px, y + .006, pz, 0, ry - .15, 0);
    b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.5}), .17, .002, .1, px, y + .013, pz, 0, ry - .15, 0);
    [px, pz] = P(.13, .02); b.cyl(ctx.mat("steel"), .035, .035, .12, 16, px, y + .06, pz); b.cyl(ctx.mat("glow", {color: "#FFE81F", intensity: 1.4}), .037, .037, .015, 16, px, y + .08, pz);
  } else {
    let [px, pz] = P(-.09, 0); b.cyl(ctx.mat("brass"), .05, .06, .03, 16, px, y + .015, pz); b.cyl(ctx.mat("brass"), .02, .03, .05, 12, px, y + .055, pz);
    b.cyl(ctx.mat("glass", {color: "#fff3d6", opacity: .3}), .03, .035, .1, 14, px, y + .13, pz);
    const fl = ctx.glow(0xffc98a, .2); fl.position.set(px, y + .12, pz); parent.add(fl);
    [px, pz] = P(.1, 0); b.box(ctx.mat("cloth", {color: "#2f5d5d"}), .18, .025, .13, px, y + .0125, pz, 0, ry - .25, 0); b.box(ctx.mat("paper"), .17, .006, .12, px, y + .028, pz, 0, ry - .25, 0);
    b.cyl(ctx.mat("darkwood"), .005, .005, .15, 6, px + .02, y + .036, pz, Math.PI / 2, 0, .6);
  }
}
// Maßband (flach, lokal entlang x ab x0, Länge L in m)
function ruler(ctx, parent, L0, x0, L, y, z){
  const pxm = 680, sc = screen(ctx, L + .06, .07, Math.round((L + .06) * pxm), (g, w, h) => { const X = s => (s + .03) * w / (L + .06);
    g.fillStyle = L0.face; g.fillRect(0, 0, w, h); g.fillStyle = g.strokeStyle = L0.ink; g.textBaseline = "middle";
    for (let i = 0; i <= Math.round(L * 20); i++) { const x = X(i * .05), big = i % 10 === 0, mid = i % 2 === 0; g.lineWidth = big ? 3 : 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, big ? h * .5 : mid ? h * .32 : h * .2); g.stroke(); }
    for (let i = 0; i <= Math.floor(L * 2 + 1e-6); i++) rt(g, i ? de(i * .5) + " m" : "0", X(i * .5) + (i ? 0 : 8), h * .74, h * .4, L0.bf, "center", 700); });
  sc.rotation.x = -Math.PI / 2; sc.position.set(x0 + L / 2, y, z); parent.add(sc); return sc;
}
// Tafel auf zwei Pfosten (lokal, Front nach +z)
function postBoard(ctx, b, L0, w, h, yc, z){
  const mB = ctx.mat(L0.body), mF = ctx.mat(L0.frame);
  b.box(mB, w + .12, h + .12, .05, 0, yc, z - .03);
  for (const s of [-1, 1]) { b.box(mF, w + .16, .04, .07, 0, yc + s * (h / 2 + .05), z - .01); b.box(mF, .04, h + .16, .07, s * (w / 2 + .05), yc, z - .01);
    b.box(mB, .08, yc - h / 2, .08, s * (w / 2 - .2), (yc - h / 2) / 2, z - .05); b.box(mF, .16, .05, .38, s * (w / 2 - .2), .025, z - .05);
    b.sph(mF, .045, s * (w / 2 + .12), yc + h / 2 + .11, z - .03, 12); }
  b.box(mF, w + .3, .06, .12, 0, yc + h / 2 + .11, z - .03);
  if (ctx.world === "sterne") b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.3}), w + .2, .012, .012, 0, yc - h / 2 - .09, z + .005);
}

R3D.rooms.beweg2 = ctx => {
  const T = ctx.T, S = ctx.slots, W = ctx.world, L0 = look(ctx), H = ctx.height || 7;
  const mFrame = ctx.mat(L0.frame), mBody = ctx.mat(L0.body);

  /* =====================================================================
     Mittelstück: Fahrbahn mit zwei Wagen (1 kg / 2 kg) und Schiebewagen
     ===================================================================== */
  const gC = new T.Group(); ctx.add(gC, S.center.x, 0, S.center.z);
  const TOP = .9, LT = TOP + .03, LZ = [.3, -.3], MASS = [1, 2], CS = 1.3, X0 = -1.0, XE = 1.36, GX = .55, DEP = 1.35;
  const GDX = GX + .45, GDY = TOP - .18, GDZ = DEP / 2 - .05;   // Lichtschranken-Anzeige an der Tischvorderseite (weg von Gabel und Haltepunkt der Wagen)
  const HB = .13 * CS, OFFP = HB + .192 * CS + .004, YF = LT + .25, YV = LT + .36;   // halbe Wagenlänge, Abstand Schiebewagen, Pfeilhöhen
  const MODES = [{F: 1, dt: 1, sub: "Gleiche Kraft, gleiche Einwirkdauer", note: "Doppelte Masse → halbes Δv"},
                 {F: 2, dt: .5, sub: "Doppelte Kraft, halbe Einwirkdauer", note: "F · Δt gleich → Δv gleich"},
                 {F: 2, dt: 1, sub: "Doppelte Kraft, gleiche Einwirkdauer", note: "Doppelte Kraft → doppeltes Δv"}];
  const kin = (M, md, t) => { const a = md.F / M, sP = .5 * a * md.dt * md.dt, vE = a * md.dt, tS = md.dt + (XE - X0 - sP) / vE;
    if (t <= md.dt) return {x: X0 + .5 * a * t * t, v: a * t, tS};
    if (t >= tS) return {x: XE, v: 0, stop: true, tS};
    return {x: X0 + sP + vE * (t - md.dt), v: vE, tS}; };
  let cm = 0, cPh = "idle", cT = 0, cRet = 0, cRuns = 0, cHold = false; const from = [{x: X0, xp: X0 - OFFP}, {x: X0, xp: X0 - OFFP}];
  const xpNow = [X0 - OFFP, X0 - OFFP], xNow = [X0, X0];
  // Labor: Kraft F frei einstellbar, Δt = 1,0 s, nur der 2-kg-Wagen fährt – mit einer Kiste unbekannter Masse darauf (labF = null: kein Labor offen).
  // Gesucht ist die Gesamtmasse MLAB = 2 kg + 0,5 kg; sie steht nirgends angeschrieben (die Aufschrift „2 kg“ allein wäre sonst schon die Lösung).
  let labF = null; const MLAB = 2.5, LABMD = {F: 0, dt: 1, sub: "Labor: Kraft F einstellen – nur der Wagen mit Kiste fährt", note: "Doppelte Kraft → doppeltes Δv"};
  const curMd = () => labF == null ? MODES[cm] : Object.assign(LABMD, {F: labF});
  const mOf = i => labF != null && i === 1 ? MLAB : MASS[i];   // beschleunigte Masse je Bahn
  const fN = F => Number.isInteger(F) ? String(F) : de(F, 1);
  const restartC = hold => { for (let i = 0; i < 2; i++) from[i] = {x: xNow[i], xp: xpNow[i]}; cPh = "ret"; cRet = 0; cHold = !!hold; };
  const mBr = ctx.mat(W === "sterne" ? "steel" : "brass");
  {
    const b = bucket(T);
    bench(ctx, b, L0, 3.6, DEP, TOP);
    for (const z of LZ) lane(ctx, b, -1.74, 1.74, z, TOP, .26);
    // Startblöcke links, Puffer rechts
    for (const z of LZ) { b.box(mBody, .14, .14, .3, -1.68, LT + .07, z); b.box(mFrame, .15, .02, .31, -1.68, LT + .145, z);
      b.box(mFrame, .07, .12, .26, 1.67, LT + .06, z); b.box(ctx.mat("rubber"), .03, .09, .18, 1.62, LT + .06, z); }
    // Lichtschranken: je Bahn eine Gabel mit Sender und Empfänger
    for (const z of LZ) for (const s of [-1, 1]) { b.box(mBody, .07, .02, .07, GX, LT + .01, z + s * .19); b.cyl(mBr, .013, .013, .46, 8, GX, LT + .23, z + s * .19);
      b.box(mBody, .045, .055, .045, GX, LT + .075, z + s * .19); }
    for (const z of LZ) b.box(mBr, .035, .03, .43, GX, LT + .46, z);
    // Anzeige der Lichtschranken: Gehäuse an der Tischvorderseite, Kabel von der vorderen Gabel über die Tischkante
    b.box(mFrame, .62, .23, .025, GDX, GDY, GDZ);
    b.put(ctx.mat("rubber"), new T.TubeGeometry(new T.CatmullRomCurve3([[GX + .03, TOP + .014, LZ[0] + .19], [GX + .07, TOP + .008, LZ[0] + .28], [GX + .11, TOP + .008, DEP / 2 + .012],
      [GX + .15, TOP - .04, DEP / 2 + .02], [GDX - .2, GDY + .11, GDZ + .016]].map(p => new T.Vector3(...p))), 24, .006, 6));
    // Auslösehebel vorn links
    b.box(mBody, .2, .05, .14, -1.45, TOP + .025, DEP / 2 - .14); b.box(mBr, .21, .012, .15, -1.45, TOP + .055, DEP / 2 - .14);
    // Requisite je Welt am rechten Ende (zwischen den Bahnen)
    if (W === "zauber") {        // Sanduhr
      for (const y of [.01, .31]) b.cyl(ctx.mat("darkwood"), .1, .1, .02, 20, 1.6, TOP + y, 0);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; b.cyl(mBr, .008, .008, .3, 6, 1.6 + Math.cos(a) * .082, TOP + .16, Math.sin(a) * .082); }
      const pr = [[.01, 0], [.065, .02], [.075, .065], [.03, .13], [.01, .15]].map(([x, y]) => new T.Vector2(x, y)), lg = new T.LatheGeometry(pr, 20);
      b.put(ctx.mat("glass", {color: "#e6f0ff", opacity: .25}), lg.clone(), 1.6, TOP + .02, 0); b.put(ctx.mat("glass", {color: "#e6f0ff", opacity: .25}), lg, 1.6, TOP + .3, 0, Math.PI, 0, 0);
      b.put(ctx.mat("glow", {color: "#E3B341", intensity: .35}), new T.ConeGeometry(.055, .05, 16), 1.6, TOP + .045, 0);
      b.put(ctx.mat("glow", {color: "#E3B341", intensity: .35}), new T.ConeGeometry(.045, .045, 16), 1.6, TOP + .21, 0, Math.PI, 0, 0);
    } else if (W === "sterne") { // Holo-Sockel
      b.cyl(ctx.mat("metal"), .1, .12, .06, 24, 1.6, TOP + .03, 0); b.cyl(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), .075, .075, .008, 24, 1.6, TOP + .064, 0);
    } else {                     // Taschenuhr auf Ständer, Notizbuch
      b.box(ctx.mat("darkwood"), .16, .03, .12, 1.6, TOP + .015, 0); b.cyl(mBr, .008, .008, .16, 8, 1.6, TOP + .1, -.03);
      b.cyl(mBr, .06, .06, .02, 24, 1.6, TOP + .2, -.02, Math.PI / 2, 0, 0); b.put(mBr, new T.TorusGeometry(.016, .004, 6, 12), 1.6, TOP + .275, -.02);
      b.box(ctx.mat("cloth", {color: "#5a2a22"}), .2, .02, .14, 1.5, TOP + .01, .55, 0, .3, 0); b.box(ctx.mat("paper"), .19, .006, .13, 1.5, TOP + .023, .55, 0, .3, 0);
    }
    b.build(gC, true);
    namePlate(ctx, gC, L0, W === "zauber" ? "Schlitten-Gleitbahn" : W === "sterne" ? "Luftkissen-Teststrecke" : "Wagen-Versuchsbahn", 0, TOP - .15, DEP / 2 - .05, 1.1);
  }
  // Leuchtende Teile: Lichtschranken-Strahlen, Uhrblatt bzw. Holo-Ring
  const beams = LZ.map(z => { const m = new T.Mesh(new T.CylinderGeometry(.004, .004, .34, 6, 1, true), new T.MeshBasicMaterial({color: 0xff5040, transparent: true, opacity: .45,
    blending: T.AdditiveBlending, depthWrite: false, toneMapped: false})); m.rotation.x = Math.PI / 2; m.position.set(GX, LT + .075, z); gC.add(m); return m; });
  const gk = [0, 0], gv = [null, null];
  const gDisp = screen(ctx, .56, .2, 512, (q, w, h) => { q.fillStyle = "#08100c"; q.fillRect(0, 0, w, h); q.strokeStyle = L0.acc; q.lineWidth = 4; q.strokeRect(3, 3, w - 6, h - 6);
    q.textBaseline = "middle"; q.fillStyle = L0.dim; rt(q, "Lichtschranken", w / 2, 30, 26, L0.bf, "center", 700);
    MASS.forEach((M, i) => { q.fillStyle = i ? COL.m2 : COL.m1; rtFit(q, `${labF != null && i ? "mit Kiste" : M + " kg"}:  v = ${gv[i] == null ? "–,–– m/s" : de(gv[i], 2) + " m/s"}`, w / 2, 86 + i * 54, 40, L0.bf, w - 40, "center", 700); }); });
  gDisp.position.set(GDX, GDY, GDZ + .014); gC.add(gDisp);
  const lever = new T.Group(); lever.position.set(-1.45, TOP + .06, DEP / 2 - .14); gC.add(lever);
  { const lb = bucket(T); lb.cyl(mBr, .01, .01, .2, 8, 0, .1, 0); lb.sph(ctx.mat("color", {color: "#b3261e", rough: .35}), .03, 0, .2, 0, 14); lb.build(lever, false); }
  if (W === "sterne") { const ring = ctx.mesh(new T.TorusGeometry(.09, .006, 6, 40), ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), false); ring.position.set(1.6, TOP + .24, 0); gC.add(ring);
    const cone = new T.Mesh(new T.ConeGeometry(.09, .17, 24, 1, true), new T.MeshBasicMaterial({color: 0x4fc3f7, transparent: true, opacity: .14, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide}));
    cone.position.set(1.6, TOP + .15, 0); cone.rotation.x = Math.PI; gC.add(cone); ctx.tick((dt, t) => { ring.rotation.x = Math.PI / 2 + Math.sin(t * .9) * .5; ring.rotation.y = t * 1.3; }); }
  if (W === "detektiv") { const face = screen(ctx, .1, .1, 128, (q, w) => { q.fillStyle = "#f2e8d2"; q.beginPath(); q.arc(w / 2, w / 2, w / 2 - 2, 0, TAU); q.fill(); q.strokeStyle = "#2a2118";
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; q.lineWidth = k % 3 ? 2 : 4; q.beginPath(); q.moveTo(w / 2 + Math.cos(a) * 46, w / 2 + Math.sin(a) * 46); q.lineTo(w / 2 + Math.cos(a) * 58, w / 2 + Math.sin(a) * 58); q.stroke(); } }, 0, true);
    face.position.set(1.6, TOP + .2, -.009); gC.add(face);
    const hand = new T.Group(); hand.position.set(1.6, TOP + .2, -.007); gC.add(hand); const hb = bucket(T); hb.box(ctx.mat("color", {color: "#2a2118"}), .004, .04, .002, 0, .018, 0); hb.build(hand, false);
    ctx.tick((dt, t) => { hand.rotation.z = -t * TAU / 6; }); }
  // Wagen, Schiebewagen mit Kraftmesser, Pfeile, Schildchen
  const carts = [], pushers = [], needles = [], fA = [], dA = [], fT = [], dT = [], mT = [];
  const dialTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.fillStyle = L0.face; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill(); g.strokeStyle = L0.ink; g.fillStyle = L0.ink;
    for (let i = 0; i <= 10; i++) { const a = -Math.PI * .5 - Math.PI * .75 + i / 10 * Math.PI * 1.5, r0 = i % 5 ? 46 : 40; g.lineWidth = i % 5 ? 2 : 4;
      g.beginPath(); g.moveTo(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0); g.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); g.stroke(); }
    g.font = `700 22px ${L0.bf}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("0", 64 + Math.cos(-Math.PI * 1.25) * 28, 64 + Math.sin(-Math.PI * 1.25) * 28 + 4);
    g.fillText("2", 64 + Math.cos(Math.PI * .25) * 28, 64 + Math.sin(Math.PI * .25) * 28 + 4); g.fillText("N", 64, 92);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  for (let i = 0; i < 2; i++) {
    const c = cart(ctx, {len: .26, wid: .15, sc: CS, extra: i ? 2 : 0, color: i ? COL.m2 : COL.m1, label: i ? "2 kg" : "1 kg"}); c.position.set(X0, LT, LZ[i]); gC.add(c); carts.push(c);
    const p = new T.Group(), pb = bucket(T), mm = ctx.mat(W === "sterne" ? "plastic" : "darkwood", W === "sterne" ? {color: "#3a4656"} : undefined);
    pb.box(mm, .12, .07, .13, 0, .045, 0); pb.box(mFrame, .125, .012, .135, 0, .083, 0);
    pb.cyl(ctx.mat("steel"), .012, .012, .12, 10, .12, .05, 0, 0, 0, Math.PI / 2);                   // Federkraftmesser (Hülse)
    for (let k = 0; k < 5; k++) pb.put(ctx.mat("copper"), new T.TorusGeometry(.016, .003, 6, 12), .075 + k * .018, .05, 0, 0, Math.PI / 2, 0);
    pb.cyl(ctx.mat("rubber"), .03, .03, .012, 16, .186, .05, 0, 0, 0, Math.PI / 2);                // Druckplatte
    pb.cyl(mFrame, .008, .008, .12, 8, -.04, .14, 0); pb.sph(ctx.mat("color", {color: "#b3261e", rough: .4}), .022, -.04, .2, 0, 12);   // Griff
    if (W === "detektiv") for (const x of [-.04, .04]) for (const z of [-.055, .055]) pb.cyl(ctx.mat("metal"), .022, .022, .01, 12, x, .022, z, Math.PI / 2, 0, 0);
    pb.build(p, true);
    const dial = new T.Mesh(new T.CircleGeometry(.034, 28), new T.MeshBasicMaterial({map: dialTex, toneMapped: false})); dial.position.set(0, .045, .067); p.add(dial);
    const nd = new T.Group(); nd.position.set(0, .045, .069); p.add(nd);
    const nb = bucket(T); nb.box(ctx.mat("color", {color: "#c0392b"}), .004, .028, .002, 0, .012, 0); nb.build(nd, false);
    p.scale.setScalar(CS); p.position.set(X0 - OFFP, LT, LZ[i]); gC.add(p); pushers.push(p); needles.push(nd);
    fA.push(arrowIn(ctx, gC, COL.F, .018)); dA.push(arrowIn(ctx, gC, COL.dv, .016));
    const ft = liveTag(ctx, .085, L0.bf), dt2 = liveTag(ctx, .085, L0.bf), mt = liveTag(ctx, .085, L0.bf); gC.add(ft, dt2, mt); fT.push(ft); dT.push(dt2); mT.push(mt);
    ft.visible = dt2.visible = false; mt.set(`m = ${MASS[i]} kg`, i ? COL.m2 : COL.m1);
  }
  fA.forEach(a => a.visible = false); dA.forEach(a => a.visible = false);
  // Labor: Kiste mit (für die Lernenden) unbekannter Masse auf dem 2-kg-Wagen, nur bei offenem Laborblatt sichtbar
  const KH = .09, kiste = new T.Group(); kiste.position.y = carts[1].userData.top - .017 * CS; carts[1].add(kiste); kiste.visible = false;   // Kiste direkt auf den Schlitzgewichten
  { const kb = bucket(T), km = W === "sterne" ? ctx.mat("plastic", {color: "#b98a2e"}) : ctx.mat("wood");
    kb.box(km, .16, KH, .13, 0, KH / 2, 0); kb.box(mFrame, .165, .012, .135, 0, KH - .004, 0); kb.build(kiste, true);
    const kq = screen(ctx, .08, .06, 128, (q, w, h) => { q.fillStyle = "#0e1216"; q.fillRect(0, 0, w, h); q.fillStyle = "#ffe9a8"; q.textBaseline = "middle"; rt(q, "?", w / 2, h / 2 + 3, h * .82, ctx.kit.fontBody, "center", 800); });
    kq.position.set(0, KH * .45, .068); kiste.add(kq); }
  // Tafel mit t-v-Diagramm hinter der Bahn
  const gB = new T.Group(); gB.position.set(0, 0, -.98); gC.add(gB);
  { const b = bucket(T); postBoard(ctx, b, L0, 2.7, 1.22, 2.0, 0); b.build(gB, true); }
  const drawC = (g, w, h) => {
    panel(g, w, h, L0); g.textBaseline = "middle"; const md = curMd(), lab = labF != null;
    g.fillStyle = L0.acc; rt(g, "F · Δt = m · Δv", 50, 74, 66, L0.ff, "left", 700);
    g.fillStyle = L0.dim; rtFit(g, md.sub, 52, 142, 32, L0.bf, 620, "left", 600);
    g.fillStyle = COL.F; rt(g, `F = ${fN(md.F)} N`, 52, 214, 46, L0.bf, "left", 700); g.fillStyle = L0.fg; rt(g, `Δt = ${de(md.dt)} s`, 300, 214, 46, L0.bf, "left", 700);
    // im Labor: keine Rechnung mit der Masse des beladenen Wagens (die sollen die Lernenden selbst bestimmen)
    MASS.forEach((M, i) => { const y = 296 + i * 66, off = lab && !i, box = lab && i; g.fillStyle = i ? COL.m2 : COL.m1; rt(g, box ? "m = ?" : `${M} kg:`, 52, y, 40, L0.bf, "left", 700);
      g.fillStyle = off ? L0.dim : L0.fg; rtFit(g, off ? "bleibt im Labor am Start stehen" : box ? "2-kg-Wagen mit Kiste" : `Δv = ${fN(md.F)} N · ${de(md.dt)} s : ${M} kg = ${de(md.F * md.dt / M)} m/s`, 172, y, 36, L0.bf, 500, "left", 600); });
    g.fillStyle = L0.acc2; rtFit(g, md.note, 52, 444, 38, L0.bf, 620, "left", 700);
    const live = cPh === "run" && cT < md.dt;
    g.fillStyle = live && md.F ? COL.F : L0.dim;
    rtFit(g, cPh === "idle" ? "Klicke auf die Bahn: Start!" : lab && !md.F && cPh === "run" ? "F = 0 N: Der Wagen bleibt stehen" : live ? `Kraft wirkt … t = ${de(cT, 2)} s` : cPh === "ret" ? "Wagen zurück zum Start …" : "Keine Kraft mehr: v bleibt gleich", 52, 520, 32, L0.bf, 620, "left", 600);
    // Diagramm rechts
    const A = axes(g, L0, {x0: 770, x1: w - 80, y0: 120, y1: h - 92, tMax: 3, vMax: 2, tStep: .5, vStep: .5, tLab: "t in s", vLab: "v in m/s", fs: 24});
    g.fillStyle = "rgba(255,167,51,.16)"; g.fillRect(A.X(0), A.Y(2), A.X(md.dt) - A.X(0), A.Y(0) - A.Y(2));
    g.fillStyle = COL.F; rt(g, "Kraft wirkt", A.X(0) + 8, A.Y(2) + 22, 22, L0.bf, "left", 700);
    if (cPh === "run") MASS.forEach((M0, i) => { if (lab && !i) return; const M = mOf(i), col = i ? COL.m2 : COL.m1, k0 = kin(M, md, 0), tEnd = Math.min(cT, 3, k0.tS);
      g.strokeStyle = col; g.lineWidth = 7; g.lineJoin = "round"; g.beginPath();
      for (let t = 0; t <= tEnd + 1e-6; t += .02) { const tq = Math.min(t, tEnd), v = kin(M, md, Math.min(tq, k0.tS - 1e-6)).v; t ? g.lineTo(A.X(tq), A.Y(v)) : g.moveTo(A.X(0), A.Y(0)); }
      const vv = kin(M, md, Math.max(0, tEnd - 1e-6)).v, vE = kin(M, md, Math.min(tEnd, md.dt)).v; g.lineTo(A.X(tEnd), A.Y(vv)); g.stroke();
      g.fillStyle = col; g.beginPath(); g.arc(A.X(tEnd), A.Y(vv), 9, 0, TAU); g.fill();
      if (tEnd >= md.dt) { if (tEnd < 2.2) rt(g, `Δv = ${de(vE, lab ? 2 : 1)} m/s`, A.X(tEnd) + 16, A.Y(vE), 24, L0.bf, "left", 700);
        else rt(g, `${lab ? "mit Kiste" : M0 + " kg"}: Δv = ${de(vE, lab ? 2 : 1)} m/s`, A.X(Math.min(tEnd, 2.95)) - 6, A.Y(vE) - 26, 24, L0.bf, "right", 700); } });
  };
  const brd = screen(ctx, 2.7, 1.22, 1280, drawC, .095); brd.position.set(0, 2.0, .028); gB.add(brd);
  ctx.light(0xfff2dc, 4.5, 6.5, S.center.x, 2.8, S.center.z + 1.6);
  let cAcc = 0, cDirty = false, lev = 0;
  ctx.tick((dt, t) => {
    const md = curMd();
    if (cPh === "run") { cT += dt; } else if (cPh === "ret") { cRet += dt; if (cRet >= .9) { if (cHold) { cPh = "idle"; cHold = false; } else { cPh = "run"; cT = 0; lev = 1; } cDirty = true; } }
    // Labor: Versuch nach dem Anschlag am Puffer (bzw. nach 15 s) von selbst wiederholen, damit die Lichtschranke immer wieder misst
    // (bis 20 s: auch bei der kleinsten Kraft, 0,2 N → 0,08 m/s, erreicht der beladene Wagen die Lichtschranke vorher)
    if (labF != null && labF > 0 && cPh === "run" && cT > Math.min(kin(MLAB, md, 0).tS, 20) + 1.6) restartC();
    kiste.visible = labF != null;
    lev = Math.max(0, lev - dt * 1.2); lever.rotation.x = .5 * Math.sin(Math.min(1, lev) * Math.PI) + .35;
    for (let i = 0; i < 2; i++) {
      let x = X0, xp = X0 - OFFP, v = 0, push = false, stop = false;
      if (cPh === "run" && (labF == null || i === 1)) { const k = kin(mOf(i), md, cT); x = k.x; v = k.v; stop = !!k.stop; push = cT < md.dt;
        if (push) xp = x - OFFP;
        else { const ke = kin(mOf(i), md, md.dt), tau = cT - md.dt, aB = 7, tb = Math.min(tau, ke.v / aB); xp = ke.x - OFFP + ke.v * tb - .5 * aB * tb * tb; } }
      else if (cPh === "ret") { const k = sm(cRet / .9); x = from[i].x + (X0 - from[i].x) * k; xp = from[i].xp + (X0 - OFFP - from[i].xp) * k; }
      // Lichtschranke: misst beim Durchfahren
      const hf = carts[i].userData.half;
      if (cPh === "run" && xNow[i] + hf < GX && x + hf >= GX) { gv[i] = v; gk[i] = 1; gDisp.redraw(); }
      gk[i] = Math.max(0, gk[i] - dt * 2.5); beams[i].material.opacity = .4 + .6 * gk[i]; beams[i].scale.set(1 + 2.5 * gk[i], 1, 1 + 2.5 * gk[i]);
      carts[i].spin(x - xNow[i]); xNow[i] = x; xpNow[i] = xp;
      carts[i].position.x = x; pushers[i].position.x = xp;
      const z = LZ[i], rear = x - HB;
      needles[i].rotation.z += ((push ? -md.F / 2 * Math.PI * 1.5 : 0) + Math.PI * .75 - needles[i].rotation.z) * Math.min(1, dt * 12);
      // Kraftpfeil während Δt, danach Δv-Pfeil · Pfeile und Schildchen der hinteren Bahn liegen höher (sonst decken sie sich aus der Gangsicht)
      const dy = i ? .15 : 0;
      if (push && cPh === "run") { hArrow(fA[i], rear, YF + dy, z, md.F * SF); fT[i].visible = true; fT[i].set(`F = ${fN(md.F)} N`, COL.F); fT[i].position.set(rear + md.F * SF + .2, YF + dy + .02, z); }
      else { fA[i].visible = false; fT[i].visible = false; }
      if (cPh === "run" && !stop && v > .01) { const Lv = v * SV; hArrow(dA[i], x, YV + dy, z, Lv); dT[i].visible = true;
        dT[i].set(push ? "Δv" : `Δv = ${de(v, labF != null ? 2 : 1)} m/s`, COL.dv); dT[i].position.set(x + Lv + (push ? .1 : .3), YV + dy + .03, z); }   // Labor: 2 Stellen wie die Lichtschranke
      else { dA[i].visible = false; dT[i].visible = false; }
      const kb = i === 1 && kiste.visible; mT[i].set(kb ? "m = ?" : `m = ${MASS[i]} kg`, i ? COL.m2 : COL.m1);
      mT[i].visible = !dT[i].visible && !fT[i].visible; mT[i].position.set(x, LT + carts[i].userData.top + .1 + (kb ? KH : 0), z);
    }
    cAcc += dt; if ((cPh === "run" && cT < 3.3 && cAcc > .05) || cDirty) { brd.redraw(); cAcc = 0; cDirty = false; }
  });
  const cText = () => { const md = MODES[cm], v1 = de(md.F * md.dt), v2 = de(md.F * md.dt / 2);
    return [
      "Beide Schiebewagen drücken **gleich lang** (Δt = 1,0 s) mit **gleicher Kraft** (F = 1 N). Aus **F · Δt = m · Δv** folgt Δv = F · Δt : m:\n" +
      `1-kg-Wagen: Δv = 1 N · 1,0 s : 1 kg = **${v1} m/s**\n2-kg-Wagen: Δv = 1 N · 1,0 s : 2 kg = **${v2} m/s**\n\n` +
      "Doppelte Masse – halbe Zusatzgeschwindigkeit. Danach wirkt keine Kraft mehr, die Wagen fahren gleichförmig weiter. Klicke noch einmal: doppelte Kraft, halbe Zeit.",
      "Jetzt drücken die Schiebewagen mit **doppelter Kraft** (F = 2 N), aber nur **halb so lang** (Δt = 0,5 s). Das Produkt F · Δt = 2 N · 0,5 s ist so groß wie vorher (1 N · 1,0 s) – " +
      `deshalb ist auch Δv gleich: **${v1} m/s** für den 1-kg-Wagen, **${v2} m/s** für den 2-kg-Wagen.\n\nIm Diagramm steigen die Geraden doppelt so steil, aber nur halb so lang. Klicke noch einmal: doppelte Kraft, gleiche Zeit.`,
      "Doppelte Kraft bei gleicher Einwirkdauer (F = 2 N, Δt = 1,0 s): Beide Wagen erhalten das **doppelte Δv** – " +
      `**${v1} m/s** und **${v2} m/s**.\n\nDie Zusatzgeschwindigkeit Δv zeigt immer **in Richtung der Kraft**. Klicke noch einmal: wieder 1 N und 1,0 s.`][cm]; };
  ctx.exhibit(gC, {label: "Fahrbahn mit zwei Wagen", sub: "anklicken: Versuch starten", title: "Gleiche Kraft, gleiche Zeit – verschiedene Massen", pitch: -.3,
    onClick: () => { if (cPh === "idle") { cPh = "run"; cT = 0; lev = 1; } else { if (labF == null) cm = (cm + 1) % 3; restartC(); }   // idle: Anfang oder nach dem Labor
      gv[0] = gv[1] = null; gDisp.redraw(); cRuns++; cDirty = true; },
    get text(){ return cText(); }});
  ctx.obstacleBox(0, S.center.z, 3.75, DEP + .1); ctx.obstacleBox(0, S.center.z - .98, 2.95, .45);
  // Labor: Der Schiebewagen drückt den 2-kg-Wagen mit einer Kiste unbekannter Masse 1,0 s lang mit einstellbarer Kraft; die Lichtschranke misst danach Δv (Start aus dem Stand)
  ctx.lab(gC, {
    id: "kraft", titel: "Wie hängt Δv von der Kraft ab?",
    text: "Auf dem **2-kg-Wagen** liegt jetzt eine **Kiste**, deren Masse du nicht kennst. Der Schiebewagen drückt den beladenen Wagen immer genau **Δt = 1,0 s** lang mit der Kraft F, die du am Kraftmesser einstellst. " +
      "Danach fährt der Wagen ohne Kraft gleichförmig weiter, und die **Lichtschranke** misst seine Geschwindigkeit. Weil er aus dem Stand startet, ist das seine Zusatzgeschwindigkeit Δv. " +
      "Nimm mindestens fünf Messwerte zwischen 0 N und 2,0 N auf, trage sie selbst ins F-Δv-Diagramm ein und werte aus.",
    regler: [{id: "F", name: "Kraft F am Kraftmesser", einheit: "N", min: 0, max: 2, schritt: .2, wert: 0}],
    messe: v => ({dv: v.F * 1.0 / MLAB}),                                          // Δv = F · Δt : m mit Δt = 1,0 s, m = 2,0 kg + 0,5 kg (Kiste) = 2,5 kg
    anzeige: [{id: "dv", name: "Lichtschranke: Δv des beladenen Wagens", einheit: "m/s", stellen: 2}],
    achsen: {x: {id: "F", name: "F in N", max: 2, teil: .4}, y: {id: "dv", name: "Δv in m/s", max: .8, teil: .1}},
    punkte: 5, gerade: "ursprung",
    aufgabe: {frage: "Lies an deiner Geraden einen gut ablesbaren Punkt ab und berechne daraus die Masse von Wagen und Kiste zusammen: m = F · Δt : Δv (mit Δt = 1,0 s).", wert: 2.5, toleranz: .15, einheit: "kg",
      tipps: ["Wähle einen Punkt, der genau auf der Geraden liegt und sich gut ablesen lässt, zum Beispiel bei F = 2,0 N.",
        "Lies dazu Δv ab: Bei F = 2,0 N ist Δv = 0,8 m/s. Aus F · Δt = m · Δv folgt m = F · Δt : Δv.",
        "m = 2,0 N · 1,0 s : 0,8 m/s – rechne aus. Einheit: 1 N · s : (1 m/s) = 1 kg."],
      loesung: "m = F · Δt : Δv = 2,0 N · 1,0 s : 0,8 m/s = **2,5 kg** – für jeden Punkt der Geraden derselbe Wert. Der Wagen allein hat 2 kg, die Kiste also 0,5 kg."},
    merke: "Die Messpunkte liegen auf einer **Ursprungsgeraden**: Bei gleicher Masse und gleicher Einwirkdauer ist die Zusatzgeschwindigkeit **Δv proportional zur Kraft F** – doppelte Kraft, doppeltes Δv. " +
      "Der Quotient F · Δt : Δv ist für alle Punkte gleich groß: Das ist die Masse des beladenen Wagens, **m = 2,5 kg**. So lässt sich eine unbekannte Masse über ihre Trägheit bestimmen.",
    live: (v, m) => {
      if (!v) { if (labF != null) { labF = null; gv[0] = gv[1] = null; gDisp.redraw(); restartC(true); cDirty = true; } return; }   // zurück zum Start, dann Ruhe
      if (labF === v.F) return;
      labF = v.F; gv[0] = gv[1] = null; gDisp.redraw(); restartC(); cDirty = true;   // neue Kraft: Wagen zurück, Kraftmesser, Pfeile und Tafel zeigen den neuen Versuch
    }
  });

  /* =====================================================================
     Luftraum: Schild „1 N = 1 kg · m/s²“
     ===================================================================== */
  {
    const g = new T.Group(), YS = Math.min(4.05, H - 2.4), ZS = 2.7; ctx.add(g, 0, YS, ZS);
    const sw = 2.6, sh = .78, b = bucket(T);
    b.box(mBody, sw + .1, sh + .1, .05, 0, 0, 0);
    for (const s of [-1, 1]) { b.box(mFrame, sw + .16, .04, .08, 0, s * (sh / 2 + .05), 0); b.box(mFrame, .04, sh + .16, .08, s * (sw / 2 + .05), 0, 0); }
    const hang = H - YS - sh / 2;
    for (const s of [-1, 1]) { b.cyl(ctx.mat(W === "sterne" ? "steel" : "metal"), .012, .012, hang, 6, s * 1.0, sh / 2 + hang / 2, 0); b.sph(mFrame, .035, s * 1.0, sh / 2 + .05, 0, 10); }
    b.build(g, false);
    const face = screen(ctx, sw, sh, 1024, (q, w, h) => { panel(q, w, h, L0); q.textBaseline = "middle";
      q.fillStyle = L0.acc; rtFit(q, "1 N = 1 kg · m/s²", w / 2, h * .4, 108, L0.ff, w - 90, "center", 700);
      q.fillStyle = L0.fg; rtFit(q, "1 N ändert die Geschwindigkeit von 1 kg in 1 s um 1 m/s", w / 2, h * .78, 38, L0.bf, w - 100, "center", 600); }, .06);
    face.position.z = .03; g.add(face);
    let kick = 0;
    ctx.tick((dt, t) => { kick = Math.max(0, kick - dt * .35); g.rotation.x = Math.sin(t * .6) * .02 + Math.sin(t * 3.2) * .12 * kick; g.rotation.y = Math.sin(t * .4) * .03; });
    ctx.exhibit(g, {label: "Die Einheit Newton", sub: "anklicken", title: "1 N = 1 kg · m/s²", pitch: .32, onClick: () => { kick = 1; },
      text: "Aus F · Δt = m · Δv folgt für die Einheiten: 1 N · 1 s = 1 kg · 1 m/s, also **1 N = 1 kg · m/s^{2}**.\n\n" +
        "Eine Kraft von **1 N** ändert die Geschwindigkeit eines Körpers mit der Masse **1 kg** in **1 s** um **1 m/s**. Deshalb ist auch 1 N/kg = 1 m/s^{2}: Der Ortsfaktor g = 9,81 N/kg ist eine Beschleunigung von 9,81 m/s^{2}."});
  }

  /* =====================================================================
     A: Triebwerksmodell (links, Front nach +x): Schub wirkt Δt lang
     ===================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.A.x, 0, S.A.z); g.rotation.y = Math.PI / 2;
    const RY = .95, XS = -1.12, XB = .95, M = .5, F = .5, DTS = [.5, 1], CA = 1.4, VB = 1.2;   // Brenndauern so kurz, dass die Gleitphase sichtbar bleibt
    const b = bucket(T); bench(ctx, b, L0, 3.3, .62, RY); lane(ctx, b, -1.62, 1.62, 0, RY);
    b.box(mFrame, .08, .14, .2, 1.6, RY + .1, 0); b.cyl(ctx.mat("steel"), .015, .015, .18, 8, 1.48, RY + .1, 0, 0, 0, Math.PI / 2);   // Fangfeder
    b.box(ctx.mat("rubber"), .03, .1, .14, 1.38, RY + .1, 0);
    b.box(mBody, .1, .12, .26, -1.57, RY + .09, 0); b.box(mFrame, .11, .015, .27, -1.57, RY + .155, 0);                                // Prallblech hinten
    postBoard(ctx, b, L0, 2.5, 1.0, 2.1, -.48); b.build(g, true);
    namePlate(ctx, g, L0, W === "zauber" ? "Startbahn der Funkenrakete" : W === "sterne" ? "Triebwerks-Prüfstand" : "Dampfraketen-Versuch", 0, RY - .15, .26, 1.1);
    ruler(ctx, g, L0, XS, 2.2, RY + .008, .19);
    // Zündkasten mit Knopf
    { const zb = bucket(T); zb.box(mBody, .2, .09, .12, -1.38, RY + .045, .2); zb.box(mFrame, .21, .012, .13, -1.38, RY + .094, .2); zb.build(g, true); }
    const btn = ctx.mesh(new T.CylinderGeometry(.03, .03, .03, 18), ctx.mat("glow", {color: "#e0533d", intensity: .9})); btn.position.set(-1.38, RY + .11, .2); g.add(btn);
    { const pb = bucket(T); deskProps(ctx, pb, g, 1.34, RY, .2); pb.build(g, true); }
    const craft = new T.Group(); g.add(craft); craft.position.set(XS, RY + .03, 0); craft.scale.setScalar(CA);
    const cb = bucket(T); let nozzle = -.24, ex = {};
    if (W === "zauber") {        // Funkenrakete auf einem Schlitten
      cb.box(ctx.mat("darkwood"), .4, .03, .14, 0, .03, 0); for (const s of [-1, 1]) cb.box(ctx.mat("brass"), .38, .008, .012, 0, .012, s * .05);
      cb.cyl(ctx.mat("cloth", {color: "#8f1d2c"}), .045, .045, .34, 18, 0, .1, 0, 0, 0, -Math.PI / 2);
      cb.put(ctx.mat("gold"), new T.ConeGeometry(.045, .12, 18), .23, .1, 0, 0, 0, -Math.PI / 2);
      for (let k = 0; k < 3; k++) cb.put(ctx.mat("brass"), new T.TorusGeometry(.047, .006, 6, 20), -.1 + k * .1, .1, 0, 0, Math.PI / 2, 0);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; cb.box(ctx.mat("gold"), .08, .004, .05, -.14, .1 + Math.cos(a) * .06, Math.sin(a) * .06, a, 0, 0); }
      cb.cyl(ctx.mat("metal"), .03, .04, .04, 14, -.19, .1, 0, 0, 0, -Math.PI / 2); nozzle = -.22; ex = {col: 0xffb347, size: .07, add: true, spread: .05, sp: 1.6};
    } else if (W === "sterne") { // Raumgleiter-Modell mit Ionentriebwerk
      const hull = ctx.mat("plastic", {color: "#e4ebf3"}), dark = ctx.mat("plastic", {color: "#2a3442"});
      cb.put(hull, new T.CapsuleGeometry(.05, .24, 4, 14), 0, .09, 0, 0, 0, Math.PI / 2);
      cb.put(hull, new T.ConeGeometry(.05, .12, 16), .23, .09, 0, 0, 0, -Math.PI / 2);
      const ws = new T.Shape(); ws.moveTo(.08, 0); ws.lineTo(-.1, .2); ws.lineTo(-.16, .2); ws.lineTo(-.13, 0); ws.lineTo(-.16, -.2); ws.lineTo(-.1, -.2); ws.closePath();
      cb.put(dark, new T.ExtrudeGeometry(ws, {depth: .014, bevelEnabled: false}), 0, .08, 0, Math.PI / 2, 0, 0);
      cb.put(ctx.mat("glass", {color: "#7fd4ff", opacity: .55}), new T.SphereGeometry(.045, 16, 10).scale(1.7, .8, 1), .08, .13, 0);
      cb.box(dark, .1, .09, .012, -.13, .16, 0, 0, 0, .35);
      for (const z of [-.06, .06]) cb.cyl(ctx.mat("steel"), .026, .032, .09, 14, -.18, .09, z, 0, 0, Math.PI / 2);
      cb.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.8}), .2, .006, .014, .0, .14, 0);
      nozzle = -.23; ex = {col: 0x7fdcff, size: .07, add: true, spread: .035, sp: 2.2, twin: true};
    } else {                     // Dampfraketen-Wagen: Kessel auf Rädern
      cb.box(ctx.mat("darkwood"), .4, .025, .15, 0, .045, 0);
      cb.cyl(ctx.mat("brass"), .06, .06, .26, 20, -.02, .12, 0, 0, 0, Math.PI / 2);
      for (const x of [-.13, .09]) cb.put(ctx.mat("copper"), new T.TorusGeometry(.061, .007, 6, 20), x, .12, 0, 0, Math.PI / 2, 0);
      cb.put(ctx.mat("brass"), new T.SphereGeometry(.06, 16, 10, 0, TAU, 0, Math.PI / 2), .11, .12, 0, 0, 0, -Math.PI / 2);
      cb.cyl(ctx.mat("metal"), .012, .022, .07, 10, -.18, .12, 0, 0, 0, Math.PI / 2);
      cb.cyl(ctx.mat("metal"), .015, .015, .07, 8, .02, .2, 0); cb.box(ctx.mat("darkwood"), .05, .02, .05, .02, .24, 0);
      for (const x of [-.13, .13]) for (const z of [-.055, .055]) cb.cyl(ctx.mat("metal"), .03, .03, .012, 14, x, .03, z, Math.PI / 2, 0, 0);
      nozzle = -.22; ex = {col: 0xe8eef2, size: .16, add: false, spread: .06, sp: 1.2};
    }
    cb.build(craft, true);
    // Abgasstrahl: Teilchen und Leuchtkern
    const NP = 70, pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3), life = new Float32Array(NP).fill(0);
    for (let i = 0; i < NP; i++) pp[i * 3 + 1] = -20;
    const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pp, 3));
    const pts = new T.Points(pg, new T.PointsMaterial({map: R3D.util.glowTex(), color: ex.col, size: ex.size, transparent: true, opacity: ex.add ? 1 : .55, depthWrite: false,
      blending: ex.add ? T.AdditiveBlending : T.NormalBlending, toneMapped: false}));
    pts.frustumCulled = false; g.add(pts);
    const core = ctx.glow(ex.col, .01); craft.add(core); core.position.set(nozzle - .03, ex.twin ? .09 : .1, 0);
    const flash = ctx.light(ex.add ? ex.col : 0xffe0b0, 0, 4, S.A.x + .4, RY + .45, S.A.z);
    const scr = screen(ctx, 2.5, 1.0, 1024, (q, w, h, st) => {
      panel(q, w, h, L0); q.textBaseline = "middle"; const s = st || {t: 0, v: 0, on: false, m: 0, done: false, stop: false}, dts = DTS[s.m], vE = F * dts / M;
      q.fillStyle = L0.acc; rtFit(q, W === "zauber" ? "Funkenrakete: Schub wirkt Δt lang" : W === "sterne" ? "Raumgleiter: Schub wirkt Δt lang" : "Dampfrakete: Schub wirkt Δt lang", 40, 52, 44, L0.ff, w - 80, "left", 700);
      q.fillStyle = COL.F; rt(q, "Schubkraft F = 0,5 N", 44, 114, 32, L0.bf, "left", 700);
      q.fillStyle = L0.fg; rt(q, "Masse m = 0,5 kg", 44, 158, 32, L0.bf, "left", 700);
      q.fillStyle = L0.acc2; rt(q, `Brenndauer Δt = ${de(dts)} s`, 44, 202, 32, L0.bf, "left", 700);
      // Statuslampe, Zeit, Geschwindigkeit (nach dem Anschlag bleibt die Geschwindigkeit nach Brennschluss stehen)
      const x2 = 520, glide = !s.on && !s.stop && s.t > 0;
      q.fillStyle = s.on ? COL.F : glide ? COL.dv : "rgba(255,255,255,.14)"; q.beginPath(); q.arc(x2 + 14, 114, 15, 0, TAU); q.fill();
      q.fillStyle = s.on ? COL.F : glide ? COL.dv : L0.dim;
      rtFit(q, s.on ? "Triebwerk an: Kraft wirkt" : glide ? "Brennschluss: gleitet ohne Kraft" : s.stop ? "am Puffer gestoppt" : "bereit", x2 + 42, 116, 30, L0.bf, w - 60 - x2 - 42, "left", 700);
      q.fillStyle = L0.fg; rt(q, `t = ${de(Math.min(s.t, 9.99), 2)} s`, x2, 158, 32, L0.bf, "left", 600);
      q.fillStyle = COL.dv; rtFit(q, s.stop ? `v nach Brennschluss: ${de(vE, 2)} m/s` : `v = ${de(s.v, 2)} m/s`, x2, 202, 32, L0.bf, w - 60 - x2, "left", 700);
      // Geschwindigkeitsbalken 0 … 1,2 m/s
      const bx0 = 44, bx1 = w - 60, by = 262, X = v => bx0 + v / VB * (bx1 - bx0), vb = s.stop ? vE : s.v;
      q.fillStyle = "rgba(255,255,255,.08)"; q.fillRect(bx0, by - 12, bx1 - bx0, 24);
      q.fillStyle = COL.dv; q.globalAlpha = s.stop ? .45 : 1; q.fillRect(bx0, by - 12, X(vb) - bx0, 24); q.globalAlpha = 1;
      q.fillStyle = L0.fg; for (let v = 0; v <= VB + .01; v += .25) { const big = Math.abs(v * 2 - Math.round(v * 2)) < .01; q.fillRect(X(v) - 1, by + 12, 3, big ? 10 : 6);
        if (big) rt(q, v ? de(v) : "0", X(v), by + 36, 22, L0.bf, "center", 600); }
      rt(q, "v in m/s", bx1, by - 28, 22, L0.bf, "right", 700);
      q.fillStyle = s.done ? L0.acc : L0.dim;
      rtFit(q, `Δv = F · Δt : m = 0,5 N · ${de(dts)} s : 0,5 kg = ${s.done ? de(F * dts / M) + " m/s" : "…"}`, 44, h - 46, 32, L0.bf, w - 90, "left", 700);
    });
    scr.position.set(0, 2.1, -.45); g.add(scr);
    const aF = arrowIn(ctx, g, COL.F, .016), aV = arrowIn(ctx, g, COL.dv, .014), tF = liveTag(ctx, .085, L0.bf), tV = liveTag(ctx, .085, L0.bf); g.add(tF, tV);
    aF.visible = aV.visible = tF.visible = tV.visible = false;
    let am = 0, ph = "idle", at = 0, ret = 0, retFrom = XS, runs = 0, acc = 0, x = XS, emit = 0, press = 0;
    const tStopA = () => { const dts = DTS[am], a = F / M; return dts + (XB - XS - .5 * a * dts * dts) / (a * dts); };
    const kinA = t => { const dts = DTS[am], a = F / M, sP = .5 * a * dts * dts, vE = a * dts, tS = tStopA();
      if (t <= dts) return {x: XS + .5 * a * t * t, v: a * t, on: true}; if (t >= tS) return {x: XB, v: 0, stop: true}; return {x: XS + sP + vE * (t - dts), v: vE}; };
    ctx.tick((dt, t) => {
      let v = 0, on = false, stop = false;
      if (ph === "run") { at += dt; const k = kinA(at); x = k.x; v = k.v; on = !!k.on; stop = !!k.stop; }
      else if (ph === "ret") { ret += dt; x = retFrom + (XS - retFrom) * sm(ret / 1.0); if (ret >= 1) { ph = "run"; at = 0; } }
      craft.position.x = x; craft.position.y = RY + .03 + (W === "sterne" ? .008 + Math.sin(t * 2.4) * .006 : 0);
      press = Math.max(0, press - dt * 2); btn.position.y = RY + .11 - .015 * Math.min(1, press * 2);
      // Teilchen
      const nx = x + nozzle * CA, ny = RY + .03 + (ex.twin ? .09 : .1) * CA;
      if (on) emit += dt * 160;
      for (let i = 0; i < NP; i++) {
        if (life[i] <= 0 && emit >= 1) { emit -= 1; life[i] = .35 + Math.random() * .3; const zz = ex.twin ? (i % 2 ? .06 : -.06) * CA : 0;
          pp[i * 3] = nx; pp[i * 3 + 1] = ny + (Math.random() - .5) * .02; pp[i * 3 + 2] = zz + (Math.random() - .5) * .02;
          pv[i * 3] = -ex.sp * (.6 + Math.random() * .6) + v * .3; pv[i * 3 + 1] = (Math.random() - .5) * ex.spread * 4 + (ex.add ? 0 : .25); pv[i * 3 + 2] = (Math.random() - .5) * ex.spread * 4; }
        if (life[i] > 0) { life[i] -= dt; pp[i * 3] += pv[i * 3] * dt; pp[i * 3 + 1] += pv[i * 3 + 1] * dt; pp[i * 3 + 2] += pv[i * 3 + 2] * dt; if (life[i] <= 0) pp[i * 3 + 1] = -20; }
      }
      emit = Math.min(emit, 3); pg.attributes.position.needsUpdate = true;
      const fl = on ? .85 + .15 * Math.sin(t * 41) * Math.sin(t * 17) : 0; core.scale.setScalar(.01 + .3 * fl); if (flash) flash.intensity = on ? 3.5 * fl : 0;
      if (flash && on) flash.position.set(S.A.x + .25, RY + .45, S.A.z - (x + nozzle * CA));
      // Pfeile
      const yA = RY + .03 + .3 * CA;
      if (on) { hArrow(aF, x, yA, 0, F * SF); tF.visible = true; tF.set("F = 0,5 N", COL.F); tF.position.set(x + F * SF + .24, yA + .03, 0); } else { aF.visible = tF.visible = false; }
      if (ph === "run" && !stop && v > .01) { const Lv = v * SV; hArrow(aV, x, yA + .14, 0, Lv); tV.visible = true; tV.set(on ? "Δv" : `Δv = ${de(v)} m/s`, COL.dv); tV.position.set(x + Lv + (on ? .1 : .3), yA + .17, 0); }
      else { aV.visible = tV.visible = false; }
      acc += dt; if ((ph === "run" && at < tStopA() + .5 && acc > .05) || (ph !== "run" && acc > .5)) { scr.redraw({t: ph === "run" ? Math.min(at, tStopA()) : 0, v, on, m: am, done: ph === "run" && at >= DTS[am], stop}); acc = 0; }
    });
    const nm = W === "zauber" ? "die Funkenrakete" : W === "sterne" ? "der Raumgleiter" : "der Dampfraketen-Wagen";
    ctx.exhibit(g, {label: W === "zauber" ? "Funkenrakete" : W === "sterne" ? "Raumgleiter-Modell" : "Dampfraketen-Wagen", sub: "anklicken: Triebwerk zünden",
      title: "Schubkraft und Einwirkdauer", pitch: -.22,
      onClick: () => { if (ph === "idle" && !runs) { ph = "run"; at = 0; } else { am = (am + 1) % 2; ph = "ret"; ret = 0; retFrom = x; } runs++; press = 1; },
      get text(){ return am === 0
        ? `Das Triebwerk erzeugt die **Schubkraft F = 0,5 N** in Fahrtrichtung. Sie wirkt **Δt = 0,5 s** lang auf das Modell (m = 0,5 kg):\nΔv = F · Δt : m = 0,5 N · 0,5 s : 0,5 kg = **0,5 m/s**.\n\n` +
          `Nach Brennschluss wirkt keine Kraft mehr – ${nm} gleitet mit konstanter Geschwindigkeit weiter bis zur Fangfeder am Ende der Bahn. (Der Treibstoff ist so leicht, dass die Masse fast gleich bleibt.) Klicke noch einmal: doppelte Brenndauer.`
        : "Gleicher Schub, aber **doppelte Einwirkdauer** Δt = 1,0 s:\nΔv = 0,5 N · 1,0 s : 0,5 kg = **1,0 m/s** – doppelt so groß.\n\n" +
          "Die Beschleunigung a = F : m = 1 m/s^{2} ist dieselbe wie vorher, das Triebwerk wirkt nur länger. Danach gleitet das Modell doppelt so schnell. Klicke noch einmal: wieder 0,5 s Brenndauer."; }});
    ctx.obstacleBox(S.A.x - .12, S.A.z, 1.05, 3.45);
  }

  /* =====================================================================
     B: Schuss in Zeitlupe (rechts hinten, Front nach −x)
     ===================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.B.x, 0, S.B.z); g.rotation.y = -Math.PI / 2;
    const FY = .15, BR = .11, PX = -1.45, PY = 1.12, LEG = .86, TOE = .13, XB0 = PX + TOE + BR + .005, SLOW = 20, m = .45;
    const GM = .55, NB = 1.0, GW = 1.1, GH = .8, XN = NB - BR;           // Torlinie, Netz hinten (Ruhe), Beginn des Abbremsens
    const b = bucket(T);
    b.box(mBody, 3.4, FY - .01, 1.3, 0, (FY - .01) / 2, 0); b.box(mFrame, 3.44, .02, 1.34, 0, FY - .02, 0);
    b.box(ctx.mat("cloth", {color: L0.turf}), 3.3, .01, 1.22, 0, FY - .004, 0);
    const lm = W === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4}) : ctx.mat("color", {color: L0.line, rough: .9});
    b.box(lm, 3.2, .004, .025, 0, FY + .003, .52); b.box(lm, 3.2, .004, .025, 0, FY + .003, -.52); b.box(lm, .025, .004, 1.04, -.2, FY + .003, 0);
    b.put(lm, new T.RingGeometry(.2, .225, 32), -.2, FY + .004, 0, -Math.PI / 2, 0, 0); b.put(lm, new T.CircleGeometry(.035, 16), XB0, FY + .004, 0, -Math.PI / 2, 0, 0);
    b.box(lm, .025, .004, GW, GM, FY + .003, 0);
    // Gestell des Schussbeins
    for (const z of [-.3, .3]) { b.box(mBody, .1, PY + .05 - FY, .1, PX, (PY + .05 + FY) / 2, z); b.box(mFrame, .2, .04, .2, PX, FY + .02, z); }
    b.cyl(mFrame, .03, .03, .7, 14, PX, PY, 0, Math.PI / 2, 0, 0);
    // Tor
    const pm = ctx.mat(W === "sterne" ? "steel" : W === "zauber" ? "wood" : "color", W === "detektiv" ? {color: "#efe9dc", rough: .5} : undefined);
    for (const z of [-GW / 2, GW / 2]) { b.cyl(pm, .025, .025, GH, 12, GM, FY + GH / 2, z); b.cyl(pm, .012, .012, Math.hypot(NB - GM, GH), 8, (GM + NB) / 2, FY + GH / 2, z, 0, 0, Math.atan2(NB - GM, GH)); }
    b.cyl(pm, .025, .025, GW + .05, 12, GM, FY + GH, 0, Math.PI / 2, 0, 0); b.cyl(pm, .012, .012, GW, 8, NB, FY + .012, 0, Math.PI / 2, 0, 0);
    postBoard(ctx, b, L0, 2.5, 1.1, 2.05, -.62);
    // Hochgeschwindigkeitskamera auf Stativ (je Welt)
    { const cx = -.25, cz = -.42, h = .95;
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + .5; b.cyl(mBody, .012, .012, h, 6, cx + Math.cos(a) * .12, FY + h / 2, cz + Math.sin(a) * .12, Math.sin(a) * .13, 0, -Math.cos(a) * .13); }
      if (W === "zauber") { b.sph(ctx.mat("crystal", {color: "#9DB7FF", intensity: .7}), .12, cx, FY + h + .1, cz, 18); b.put(mFrame, new T.TorusGeometry(.12, .012, 6, 24), cx, FY + h + .02, cz, Math.PI / 2, 0, 0); }
      else if (W === "sterne") { b.box(ctx.mat("plastic", {color: "#e4ebf3"}), .22, .13, .16, cx, FY + h + .07, cz); b.cyl(ctx.mat("glass", {color: "#4FC3F7", opacity: .7}), .045, .045, .05, 16, cx, FY + h + .07, cz + .1, Math.PI / 2, 0, 0);
        b.box(ctx.mat("glow", {color: "#ff5c5c", intensity: 2}), .02, .02, .02, cx + .08, FY + h + .12, cz + .08); }
      else { b.box(ctx.mat("darkwood"), .24, .18, .18, cx, FY + h + .09, cz); b.box(ctx.mat("cloth", {color: "#2a1d14"}), .16, .14, .1, cx, FY + h + .09, cz + .13); b.cyl(ctx.mat("brass"), .05, .05, .05, 16, cx, FY + h + .09, cz + .2, Math.PI / 2, 0, 0); } }
    b.build(g, true);
    // Netz: Rückwand beult sich mit dem Ball aus
    const netTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const q = c.getContext("2d"); q.strokeStyle = W === "sterne" ? "rgba(140,220,255,1)" : "rgba(245,240,225,1)"; q.lineWidth = 6;
      q.strokeRect(0, 0, 64, 64);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; return t; })();
    const netM = new T.MeshBasicMaterial({map: netTex, transparent: true, side: T.DoubleSide, depthWrite: false, toneMapped: false, opacity: .75, alphaTest: .05});
    const netGeo = (sx, sy, nx = 1, ny = 1) => R3D.util.scaleUV(new T.PlaneGeometry(1, 1, nx, ny), sx, sy);
    const netBack = new T.Mesh(netGeo(GW / .09, GH / .09, 10, 8), netM); netBack.rotation.y = Math.PI / 2; netBack.position.set(NB, FY + GH / 2, 0); netBack.scale.set(GW, GH, 1); g.add(netBack);
    const nbPos = netBack.geometry.attributes.position, nb0 = Float32Array.from(nbPos.array), vb = (BR - GH / 2) / GH;
    const netTop = new T.Mesh(netGeo((NB - GM) / .09, GW / .09), netM); netTop.rotation.x = -Math.PI / 2; netTop.position.set((GM + NB) / 2, FY + GH, 0); netTop.scale.set(NB - GM, GW, 1);
    const netS = [-1, 1].map(s => { const n = new T.Mesh(netGeo((NB - GM) / .09, GH / .09), netM); n.position.set((GM + NB) / 2, FY + GH / 2, s * GW / 2); n.scale.set(NB - GM, GH, 1); return n; });
    g.add(netTop, ...netS);
    let lastBulge = -1;
    const setNet = bulge => { if (Math.abs(bulge - lastBulge) < 1e-4) return; lastBulge = bulge;
      for (let i = 0; i < nbPos.count; i++) { const u = nb0[i * 3], v = nb0[i * 3 + 1], w = Math.cos(u * Math.PI) * Math.cos(clamp((v - vb) * Math.PI * .75, -Math.PI / 2, Math.PI / 2));
        nbPos.setZ(i, Math.max(0, w) * bulge); }   // lokal +z der gedrehten Fläche = +x (vom Tor weg)
      nbPos.needsUpdate = true; };
    setNet(0);
    // Schussbein
    const leg = new T.Group(); leg.position.set(PX, PY, 0); g.add(leg);
    { const lb = bucket(T);
      if (W === "zauber") { lb.cyl(ctx.mat("cloth", {color: "#3a2a5a"}), .045, .04, LEG - .1, 14, 0, -(LEG - .1) / 2, 0);
        lb.box(ctx.mat("cloth", {color: "#7b2d26"}), .2, .1, .1, .03, -LEG + .02, 0); lb.box(ctx.mat("gold"), .04, .03, .105, -.02, -LEG + .06, 0);
        lb.sph(ctx.mat("glow", {color: "#FFC86B", intensity: 1.4}), .02, .13, -LEG + .02, 0, 10); }
      else if (W === "sterne") { lb.cyl(ctx.mat("steel"), .035, .035, LEG - .1, 14, 0, -(LEG - .1) / 2, 0); lb.sph(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.8}), .05, 0, -LEG * .5, 0, 14);
        lb.box(ctx.mat("plastic", {color: "#e4ebf3"}), .2, .1, .11, .03, -LEG + .02, 0); lb.box(ctx.mat("glow", {color: "#FFE81F", intensity: 1.4}), .02, .06, .115, .13, -LEG + .02, 0); }
      else { lb.cyl(ctx.mat("wood"), .04, .035, LEG - .1, 12, 0, -(LEG - .1) / 2, 0); lb.put(ctx.mat("brass"), new T.TorusGeometry(.042, .008, 6, 16), 0, -LEG * .5, 0, Math.PI / 2, 0, 0);
        lb.box(ctx.mat("color", {color: "#1a1412", rough: .5}), .21, .1, .1, .03, -LEG + .02, 0); lb.box(ctx.mat("brass"), .03, .02, .102, -.04, -LEG + .07, 0); }
      lb.cyl(mFrame, .05, .05, .1, 16, 0, 0, 0, Math.PI / 2, 0, 0); lb.build(leg, true); }
    // Ball mit Nähten
    const ballTex = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 128; const q = c.getContext("2d");
      q.fillStyle = W === "sterne" ? "#f2f6fa" : W === "zauber" ? "#9a5a2a" : "#7a4a24"; q.fillRect(0, 0, 256, 128);
      q.strokeStyle = W === "sterne" ? "#2a3442" : "#f0e2c0"; q.lineWidth = 3;
      for (let i = 0; i < 6; i++) { q.beginPath(); q.moveTo(i * 256 / 6, 0); q.bezierCurveTo(i * 256 / 6 + 20, 40, i * 256 / 6 - 20, 88, i * 256 / 6, 128); q.stroke(); }
      q.beginPath(); q.moveTo(0, 64); q.lineTo(256, 64); q.stroke();
      if (W === "sterne") { q.fillStyle = "#4FC3F7"; for (let i = 0; i < 6; i++) q.fillRect(i * 256 / 6 + 14, 54, 14, 20); }
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
    const ball = ctx.mesh(new T.SphereGeometry(BR, 28, 18), new T.MeshStandardMaterial({map: ballTex, roughness: .55})); g.add(ball);
    // Ablauf (Sekunden der Animation): Ausholen, Durchschwung, Kontakt (0,02 s · 20), Flug, Netz (0,05 s · 20), Rückfedern
    const TW = .8, TD = .45, TC = .02 * SLOW, aK = 450 / m, vK = 20, sK = .5 * aK * .02 * .02, TFl = (XN - (XB0 + sK)) / vK * SLOW, aN = vK / .05, TN = .05 * SLOW, tN0 = .02 + TFl / SLOW;
    const scr = screen(ctx, 2.5, 1.1, 1024, (q, w, h, st) => {
      panel(q, w, h, L0); q.textBaseline = "middle"; const s = st || {tr: 0, v: 0, ph: 0, seen: 0};
      q.fillStyle = L0.acc; rt(q, "Schuss in Zeitlupe (1 : 20)", 40, 54, 44, L0.tf, "left", 700);
      const row = (k, y, txt, res) => { const act = s.ph === k + 1; q.fillStyle = act ? "rgba(255,167,51,.2)" : "rgba(255,255,255,.05)"; q.beginPath(); q.roundRect(30, y - 30, 630, 104, 16); q.fill();
        q.fillStyle = act ? COL.F : L0.fg; rtFit(q, txt, 48, y, 30, L0.bf, 600, "left", 700); q.fillStyle = L0.fg; rtFit(q, res, 48, y + 46, 25, L0.bf, 600, "left", 600); };
      row(0, 126, "① Fuß: F ≈ 450 N, Δt = 0,02 s", "Δv = 450 N · 0,02 s : 0,45 kg = 20 m/s (72 km/h)");
      row(1, 236, "② Netz: F = 180 N, Δt = 0,05 s", "Δv = 20 m/s entgegen der Flugrichtung → Ball steht");
      q.fillStyle = COL.v; rtFit(q, `Ball: echte Zeit t = ${de(s.tr, 3)} s   v = ${de(s.v)} m/s`, 48, 346, 28, L0.bf, 620, "left", 700);
      q.fillStyle = L0.dim; rtFit(q, "Pfeilmaßstab hier: 100 N ≙ 20 cm · 10 m/s ≙ 25 cm", 48, 386, 22, L0.bf, 620, "left", 600);
      q.fillStyle = L0.acc2; rtFit(q, "Kurze Einwirkdauer → große Kraft", 48, h - 30, 30, L0.bf, 600, "left", 700);
      // F-t-Diagramm über der echten Zeit: zwei Rechtecke mit gleichem Produkt F · Δt
      const A = axes(q, L0, {x0: 730, x1: w - 64, y0: 112, y1: h - 80, tMax: .2, vMax: 500, tStep: .05, vStep: 100, tLab: "t in s", vLab: "F in N", fs: 20});
      const rect = (t0, t1, F, col, on) => { q.globalAlpha = on ? 1 : .3; q.fillStyle = col; q.fillRect(A.X(t0), A.Y(F), A.X(t1) - A.X(t0), A.Y(0) - A.Y(F)); q.globalAlpha = 1; };
      rect(0, .02, 450, COL.F, s.seen >= 1); rect(tN0, tN0 + .05, 180, COL.dv, s.seen >= 2);
      q.fillStyle = L0.fg; rt(q, "①", A.X(.01), A.Y(450) - 16, 22, L0.bf, "center", 700); rt(q, "② rückwärts", A.X(tN0 + .025), A.Y(180) - 16, 20, L0.bf, "center", 700);
      rt(q, "F · Δt = 9 N · s", A.X(.115), A.Y(420), 21, L0.bf, "center", 700); rt(q, "bei ① und ②", A.X(.115), A.Y(355), 20, L0.bf, "center", 600);
    });
    scr.position.set(0, 2.05, -.59); g.add(scr);
    const aF = arrowIn(ctx, g, COL.F, .02), aV = arrowIn(ctx, g, COL.v, .016), tF = liveTag(ctx, .09, L0.bf), tV = liveTag(ctx, .09, L0.bf); g.add(tF, tV);
    for (const s of [tF, tV]) s.material.depthTest = false;   // Schilder im Tor: nicht von Pfosten und Netz verdeckt
    aF.visible = aV.visible = tF.visible = tV.visible = false;
    let bt = -1, acc = 0, sq = 0, seen = 0, fadeIn = 1, again = 9, lastPh = 0, vB = 0;
    const ballM = ball.material, setOp = o => { const tr = o < .999; if (ballM.transparent !== tr) { ballM.transparent = tr; ballM.needsUpdate = true; } ballM.opacity = o; ball.visible = o > .01; };
    const footA = bx => Math.asin(clamp((bx - BR - TOE - PX) / LEG, -1, 1));
    ctx.tick((dt, t) => {
      let tr = 0, F = 0, v = 0, ph = 0, bx = XB0, la = 0, op = 1;
      if (bt >= 0) bt += dt;
      const u = bt;
      if (u < 0) { la = Math.sin(t * .9) * .02; fadeIn = Math.min(1, fadeIn + dt / .45); op = fadeIn; again += dt; }
      else if (u < TW) la = -1.15 * sm(u / TW);
      else if (u < TW + TD) { const k = (u - TW) / TD; la = -1.15 * (1 - k * k); }
      else {
        const uc = u - TW - TD;
        if (uc < TC) { const tq = uc / SLOW; tr = tq; v = aK * tq; bx = XB0 + .5 * aK * tq * tq; F = 450; ph = 1; }
        else if (uc < TC + TFl) { const tq = (uc - TC) / SLOW; tr = .02 + tq; v = vK; bx = XB0 + sK + vK * tq; }
        else if (uc < TC + TFl + TN) { const tq = (uc - TC - TFl) / SLOW; tr = tN0 + tq; v = vK - aN * tq; bx = XN + vK * tq - .5 * aN * tq * tq; F = -180; ph = 2; }
        else {   // Ball bleibt im Netz liegen (das Netz entspannt sich nur leicht), dann wird er ausgeblendet, während das Netz zurückschwingt
          const ur = uc - TC - TFl - TN, rest = .5 * vK * .05 - .06 * sm(ur / .6), f = 1 - clamp((ur - 2.8) / .45, 0, 1);
          tr = tN0 + .05; bx = XN + rest * f; op = f; }
        if (uc < TC) la = footA(bx);
        else { const k2 = uc - TC, a0 = footA(XB0 + sK); la = k2 < .5 ? a0 + .5 * sm(k2 / .5) : k2 < 1.7 ? (a0 + .5) * (1 - sm((k2 - .5) / 1.2)) : 0; }
        if (uc > TC + TFl + TN + 3.3) { bt = -1; fadeIn = 0; again = 0; }   // neuer Ball erscheint auf dem Anstoßpunkt
      }
      if (ph > seen) seen = ph;
      leg.rotation.z = la;
      sq += ((ph === 1 ? .22 : ph === 2 ? .12 : 0) - sq) * Math.min(1, dt * 18);
      ball.position.set(bx, FY + BR, 0); ball.scale.set(1 - sq, 1 + sq * .5, 1 + sq * .5); if (v > 0) ball.rotation.z -= v / SLOW * dt / BR; setOp(op);
      setNet(Math.max(0, bx + BR - NB));
      // Tafel: während Kontakt und Netz jedes Bild neu (v ändert sich schnell), sonst gedrosselt; das v-Schild zeigt denselben Wert wie die Tafel
      acc += dt; if ((bt >= 0 && (acc > .05 || ph || ph !== lastPh)) || acc > 1) { scr.redraw({tr, v, ph, seen}); vB = v; acc = 0; } lastPh = ph;
      // Pfeile über dem Ball (Maßstab: 100 N ≙ 20 cm · 10 m/s ≙ 25 cm)
      const yA = FY + BR * 2 + .14;
      if (ph) { hArrow(aF, bx, yA, 0, F * .002); tF.visible = true; tF.set(ph === 1 ? "F ≈ 450 N" : "F = 180 N", COL.F); tF.position.set(F > 0 ? bx + F * .002 + .25 : bx + F * .001, F > 0 ? yA + .04 : yA + .09, 0); }
      else aF.visible = tF.visible = false;
      if (v > .2) { hArrow(aV, bx, yA + .17, 0, v * .025); tV.visible = true; tV.set(`v = ${de(vB)} m/s`, COL.v); tV.position.set(bx + v * .025 + .3, yA + .21, 0); }
      else if (bt < 0 && again < 2.2) { aV.visible = false; tV.visible = true; tV.set("Ball liegt bereit: neuer Versuch", L0.acc2); tV.position.set(XB0 + .55, FY + BR * 2 + .12, 0); }
      else aV.visible = tV.visible = false;
    });
    ctx.exhibit(g, {label: "Schuss in Zeitlupe", sub: "anklicken: schießen", title: "Kurze Einwirkdauer – große Kraft", pitch: -.2,
      onClick: () => { bt = 0; seen = 0; fadeIn = 1; again = 9; },
      text: "Beim Schuss berührt der Fuß den Ball (m = 0,45 kg) nur etwa **Δt = 0,02 s** lang. In dieser kurzen Zeit wirkt eine **große Kraft** von rund 450 N:\n" +
        "Δv = F · Δt : m = 450 N · 0,02 s : 0,45 kg = **20 m/s** (72 km/h).\n\n" +
        "Das Netz gibt nach und bremst den Ball länger (Δt = 0,05 s). Dafür reicht eine **kleinere Kraft**: F = m · Δv : Δt = 0,45 kg · 20 m/s : 0,05 s = **180 N**. " +
        "Diese Kraft zeigt **entgegen** der Flugrichtung – ebenso Δv."});
    ctx.obstacleBox(S.B.x + .05, S.B.z, 1.45, 3.5);
  }

  /* =====================================================================
     C: Bremsen (rechts vorne, Front nach −x)
     ===================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.C.x, 0, S.C.z); g.rotation.y = -Math.PI / 2;
    const RY = .92, XS = -1.2, XBZ = -.45, M = 2, V0 = 1.2, FS = [1.2, 2.4];
    const b = bucket(T); bench(ctx, b, L0, 3.3, .62, RY); lane(ctx, b, -1.62, 1.62, 0, RY, .26);
    b.box(mFrame, .08, .12, .2, 1.6, RY + .09, 0); b.box(ctx.mat("rubber"), .03, .09, .14, 1.55, RY + .09, 0);
    b.box(mBody, .12, .12, .2, -1.58, RY + .09, 0);                                    // Abschussfeder-Gehäuse
    postBoard(ctx, b, L0, 2.5, 1.0, 2.08, -.48); b.build(g, true);
    namePlate(ctx, g, L0, W === "zauber" ? "Bremsrinne" : W === "sterne" ? "Bremsdüsen-Test" : "Bremsversuch", 0, RY - .185, .26, .8);   // tiefer und schmaler: darüber sitzt das Schild der Bremsstrecke
    { const pb = bucket(T); deskProps(ctx, pb, g, 1.25, RY, -.22); pb.build(g, true); }
    // Markierung der Bremsstrecke neben der Bahn: Länge passt sich der Bremskraft an (Fläche wird in x gestaucht, die Zeichnung gleicht das aus).
    // Die Länge steht auf einem Schildchen an der Tischkante (flach auf dem Tisch wäre sie aus dem Stand nicht lesbar). Es ragt nur knapp über
    // die Tischplatte, sonst verdeckt es aus dem Stand die Markierung dahinter (die 0,6-m-Markierung ganz). Senkrechte Fläche statt Sprite:
    // ein Sprite drehte sich bei Schrägsicht mit einer Hälfte in die Tischplatte.
    const sBr = Fb => M * V0 * V0 / (2 * Fb);
    const zone = screen(ctx, 1.2, .1, 512, (q, w, h, sx = 1) => { q.save(); q.scale(1 / sx, 1); const W2 = w * sx;
      q.fillStyle = W === "sterne" ? "#1b2633" : "#2a1f17"; q.fillRect(0, 0, W2, h);
      for (let x = -h; x < W2; x += 28) { q.fillStyle = W === "sterne" ? "#FFE81F" : "#c9a14a"; q.beginPath(); q.moveTo(x, h); q.lineTo(x + 14, h); q.lineTo(x + 14 + h, 0); q.lineTo(x + h, 0); q.fill(); }
      q.fillStyle = "#fff"; q.fillRect(0, 0, 5, h); q.fillRect(W2 - 5, 0, 5, h); q.restore(); });
    zone.rotation.x = -Math.PI / 2; g.add(zone);
    const tZs = liveTag(ctx, .095, L0.bf), tZ = new T.Mesh(new T.PlaneGeometry(.095 * 640 / 96, .095), new T.MeshBasicMaterial({map: tZs.material.map, transparent: true, depthWrite: false, toneMapped: false}));
    tZ.renderOrder = 5; tZ.set = tZs.set; g.add(tZ);
    let zs = 1, zDrawn = 1;
    const plunger = new T.Group(); plunger.position.set(-1.5, RY + .09, 0); g.add(plunger);
    { const pb = bucket(T); pb.cyl(ctx.mat("steel"), .012, .012, .1, 8, .05, 0, 0, 0, 0, Math.PI / 2); pb.cyl(ctx.mat("rubber"), .035, .035, .015, 16, .1, 0, 0, 0, 0, Math.PI / 2); pb.build(plunger, false); }
    const c = cart(ctx, {len: .26, wid: .15, sc: CS, extra: 2, color: COL.m2, label: "2 kg"}); c.position.set(XS, RY + .03, 0); g.add(c); const HC = c.userData.half;   // wie der 2-kg-Wagen am Mittelstück
    // Sichtbare Bremse am Wagen: Bremsklötze an den Kufen · Bremsdüsen an der Nase · Bremsklötze an den Vorderrädern
    const hot = new T.MeshStandardMaterial({color: W === "sterne" ? 0x9fb4c8 : 0x2a2622, emissive: W === "sterne" ? 0x7fdcff : 0xff7a1a, emissiveIntensity: 0, roughness: .55, metalness: .4});
    const shoe = new T.Group(), lev = new T.Group(); c.add(shoe, lev); let SP;
    { const kb = bucket(T), sb = bucket(T), mB = ctx.mat(W === "sterne" ? "steel" : "brass");
      if (W === "zauber") { for (const s of [-1, 1]) { kb.box(mB, .07, .05, .008, -.05, .062, s * .1035); kb.cyl(mB, .008, .008, .02, 8, -.05, .08, s * .108, Math.PI / 2, 0, 0);
          sb.box(hot, .1, .026, .018, -.05, .013, s * .113); sb.box(mB, .1, .007, .02, -.05, .029, s * .113); }
        SP = {x: -.05, y: .004, z: .12, dx: .07}; }
      else if (W === "sterne") { kb.box(ctx.mat("plastic", {color: "#27313f"}), .05, .04, .16, .175, .06, 0);
        for (const s of [-1, 1]) { kb.cyl(mB, .018, .025, .065, 16, .215, .06, s * .055, 0, 0, Math.PI / 2); kb.cyl(hot, .015, .015, .006, 14, .249, .06, s * .055, 0, 0, Math.PI / 2); }
        SP = {x: .25, y: .06, z: .055}; }
      else { kb.cyl(mB, .004, .004, .17, 6, .045, .062, 0, Math.PI / 2, 0, 0); kb.box(mB, .008, .05, .008, .045, .085, 0);
        for (const s of [-1, 1]) sb.box(hot, .016, .034, .018, .052, .042, s * .0715); SP = {x: .06, y: .02, z: .082, dx: .02}; }
      if (W !== "sterne") {   // Bremshebel an beiden Seiten: kippt beim Bremsen nach hinten
        const lb = bucket(T), pz = W === "zauber" ? .109 : .09; lev.position.set(W === "zauber" ? -.05 : .03, W === "zauber" ? .085 : .1, 0);
        for (const s of [-1, 1]) { lb.cyl(mB, .005, .005, .12, 6, 0, .06, s * pz); lb.sph(ctx.mat("color", {color: "#b3261e", rough: .4}), .014, 0, .125, s * pz, 10);
          lb.cyl(mB, .011, .011, .012, 10, 0, 0, s * pz, Math.PI / 2, 0, 0); }
        lb.build(lev, false); }
      kb.build(c, false); sb.build(shoe, false); }
    let bk = 0;
    // Bremswirkung: Funken (Reibung) oder Gegenschub (Raumschiff)
    const NP = 50, pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3), life = new Float32Array(NP);
    for (let i = 0; i < NP; i++) pp[i * 3 + 1] = -20;
    const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pp, 3));
    const sparkCol = W === "sterne" ? 0x7fdcff : W === "zauber" ? 0xffd27a : 0xffb060;
    const pts = new T.Points(pg, new T.PointsMaterial({map: R3D.util.glowTex(), color: sparkCol, size: W === "sterne" ? .07 : .05, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}));
    pts.frustumCulled = false; g.add(pts);
    const bglow = ctx.glow(sparkCol, .01); g.add(bglow);
    const scr = screen(ctx, 2.5, 1.0, 1024, (q, w, h, st) => {
      panel(q, w, h, L0); q.textBaseline = "middle"; const s = st || {v: V0, t: 0, m: 0, br: false, done: false, run: false}, Fb = FS[s.m], Dt = M * V0 / Fb;
      q.fillStyle = L0.acc; rt(q, "Bremsen: Kraft gegen die Bewegung", 40, 54, 44, L0.tf, "left", 700);
      q.fillStyle = L0.fg; rt(q, "m = 2,0 kg", 44, 116, 30, L0.bf, "left", 700);
      q.fillStyle = COL.F; rtFit(q, `Bremskraft F = ${de(Fb)} N (nach hinten)`, 240, 116, 30, L0.bf, 470, "left", 700);
      // Pfeildiagramm v_vorher + Δv = v_nachher (Maßstab 1 m/s ≙ 300 px)
      const sc = 250, ox = 70, y1 = 186, y2 = 246, y3 = 306, dv = s.v - V0;   // s.v ist bereits auf 2 Stellen gerundet → v_vorher + Δv = v stimmt auch in den Ziffern
      cArrow(q, ox, y1, ox + V0 * sc, y1, 9, COL.v); q.fillStyle = COL.v; rt(q, "v_{vorher} = 1,20 m/s", ox + V0 * sc + 18, y1, 28, L0.bf, "left", 700);
      if (dv < -.005) { cArrow(q, ox + V0 * sc, y2, ox + s.v * sc, y2, 9, COL.dv); q.fillStyle = COL.dv; rtFit(q, `Δv = ${de(-dv, 2)} m/s nach hinten`, ox + V0 * sc + 18, y2, 26, L0.bf, 330, "left", 700);
        q.setLineDash([6, 6]); q.strokeStyle = L0.dim; q.lineWidth = 2; q.beginPath(); q.moveTo(ox + V0 * sc, y1 + 12); q.lineTo(ox + V0 * sc, y2 - 10); q.stroke(); q.setLineDash([]); }
      if (s.v > .01) { cArrow(q, ox, y3, ox + s.v * sc, y3, 9, "#2fd27a"); q.fillStyle = "#2fd27a"; rt(q, `v = ${de(s.v, 2)} m/s`, ox + s.v * sc + 18, y3, 28, L0.bf, "left", 700); }
      else { q.fillStyle = "#2fd27a"; rt(q, "v_{nachher} = 0: der Wagen steht", ox, y3, 28, L0.bf, "left", 700); }
      q.strokeStyle = L0.grid; q.lineWidth = 2; q.beginPath(); q.moveTo(ox, 160); q.lineTo(ox, 330); q.stroke();
      q.fillStyle = s.done ? L0.acc : L0.dim; rtFit(q, `Bremsdauer Δt = m · Δv : F = 2,0 kg · 1,2 m/s : ${de(Fb)} N = ${s.done ? de(Dt) + " s" : "…"}`, 44, h - 50, 32, L0.bf, 640, "left", 700);
      // t-v-Diagramm rechts
      const A = axes(q, L0, {x0: 760, x1: w - 60, y0: 110, y1: h - 80, tMax: 3, vMax: 1.5, tStep: 1, vStep: .5, tLab: "t in s", vLab: "v in m/s", fs: 21});
      const tb = s.run ? Math.min(s.t, 3) : 0, t1 = (XBZ - XS) / V0, a = Fb / M;
      if (s.run) { q.strokeStyle = COL.v; q.lineWidth = 6; q.beginPath(); q.moveTo(A.X(0), A.Y(V0));
        for (let tt = 0; tt <= tb + 1e-6; tt += .03) { const vv = tt < t1 ? V0 : Math.max(0, V0 - a * (tt - t1)); q.lineTo(A.X(Math.min(tt, tb)), A.Y(vv)); } q.stroke();
        q.fillStyle = "rgba(255,167,51,.14)"; q.fillRect(A.X(t1), A.Y(1.5), A.X(Math.min(3, t1 + Dt)) - A.X(t1), A.Y(0) - A.Y(1.5));
        q.fillStyle = COL.F; rt(q, "Bremsen", A.X(t1) + 8, A.Y(1.5) + 18, 20, L0.bf, "left", 700); }
    });
    scr.position.set(0, 2.08, -.45); g.add(scr);
    const aV = arrowIn(ctx, g, COL.v, .016), aF = arrowIn(ctx, g, COL.F, .016), tV = liveTag(ctx, .085, L0.bf), tF = liveTag(ctx, .085, L0.bf); g.add(tV, tF);
    aV.visible = aF.visible = tV.visible = tF.visible = false;
    let cm2 = 0, ph = "idle", ct = 0, ret = 0, retFrom = XS, runs = 0, acc = 0, x = XS, xl = XS, emit = 0, pk = 0, vShow = V0;
    const kinC = t => { const a = FS[cm2] / M, t1 = (XBZ - XS) / V0, tS = t1 + V0 / a;
      if (t < t1) return {x: XS + V0 * t, v: V0}; if (t < tS) { const tau = t - t1; return {x: XBZ + V0 * tau - .5 * a * tau * tau, v: V0 - a * tau, br: true}; }
      return {x: XBZ + V0 * V0 / (2 * a), v: 0, stop: true}; };
    zone.position.set(XBZ + .6, RY + .009, .2);
    ctx.tick((dt, t) => {
      let v = 0, br = false, stop = false;
      if (ph === "run") { ct += dt; const k = kinC(ct); x = k.x; v = k.v; br = !!k.br; stop = !!k.stop; }
      else if (ph === "ret") { ret += dt; x = retFrom + (XS - retFrom) * sm(ret / 1.0); if (ret >= 1) { ph = "run"; ct = 0; pk = 1; } }
      c.position.x = x; c.spin(x - xl); xl = x;
      pk = Math.max(0, pk - dt * 5); plunger.position.x = -1.5 + .07 * pk;
      // Funken / Gegenschub
      bk += ((br ? 1 : 0) - bk) * Math.min(1, dt * 10); hot.emissiveIntensity = W === "sterne" ? .3 + 2.8 * bk : 2.6 * bk; lev.rotation.z = -.15 + .65 * bk;
      if (W === "zauber") shoe.position.y = .012 * (1 - bk); else if (W === "detektiv") shoe.position.x = -.012 * (1 - bk);
      const fx = x + SP.x, fy = RY + .03 + SP.y;
      if (br) emit += dt * 140;
      for (let i = 0; i < NP; i++) {
        if (life[i] <= 0 && emit >= 1) { emit -= 1; life[i] = .2 + Math.random() * .25;
          if (W === "sterne") { pp[i * 3] = fx + .01; pp[i * 3 + 1] = fy; pp[i * 3 + 2] = (i % 2 ? SP.z : -SP.z); pv[i * 3] = 1.6 + Math.random(); pv[i * 3 + 1] = (Math.random() - .5) * .15; pv[i * 3 + 2] = (Math.random() - .5) * .2; }
          else { const sz = Math.random() < .5 ? -1 : 1; pp[i * 3] = fx + (Math.random() - .5) * SP.dx; pp[i * 3 + 1] = fy; pp[i * 3 + 2] = sz * SP.z; pv[i * 3] = -.4 - Math.random() * .8 + v * .5; pv[i * 3 + 1] = .4 + Math.random() * .8; pv[i * 3 + 2] = sz * (.2 + Math.random() * .5); } }
        if (life[i] > 0) { life[i] -= dt; pv[i * 3 + 1] -= (W === "sterne" ? 0 : 4) * dt; pp[i * 3] += pv[i * 3] * dt; pp[i * 3 + 1] += pv[i * 3 + 1] * dt; pp[i * 3 + 2] += pv[i * 3 + 2] * dt; if (life[i] <= 0) pp[i * 3 + 1] = -20; }
      }
      emit = Math.min(emit, 3); pg.attributes.position.needsUpdate = true;
      bglow.position.set(W === "sterne" ? fx + .03 : fx, fy, 0); bglow.scale.setScalar(br ? .22 + .06 * Math.sin(t * 37) : .01);
      // Bremszone auf die Bremsstrecke des aktuellen Versuchs bringen
      const zt = sBr(FS[cm2]) / 1.2; zs += (zt - zs) * Math.min(1, dt * 4); if (Math.abs(zs - zt) < .002) zs = zt;
      if (Math.abs(zs - zDrawn) > .01 || (zs === zt && zDrawn !== zt)) { zone.redraw(zs, sBr(FS[cm2])); zDrawn = zs; }
      zone.scale.x = zs; zone.position.x = XBZ + .6 * zs;
      tZ.set(`Bremsstrecke ${de(sBr(FS[cm2]))} m`, "#ffffff"); tZ.position.set(XBZ + .6 * zs, RY - .036, .34);
      // Pfeile: v (blau) schrumpft, Bremskraft (orange) zeigt nach hinten
      const yT = RY + .03 + c.userData.top;
      // Tafel und Schild zeigen denselben, auf 2 Stellen gerundeten Wert (wird gemeinsam aktualisiert)
      acc += dt; if ((ph === "run" && ct < 3.6 && acc > .05) || (ph !== "run" && acc > .5)) { vShow = Math.round((ph === "run" ? v : V0) * 100) / 100;
        scr.redraw({v: vShow, t: ct, m: cm2, br, done: stop, run: ph === "run"}); acc = 0; }
      if (ph === "run" && !stop) { hArrow(aV, x, yT + .2, 0, v * SV); tV.visible = true; tV.set(`v = ${de(vShow, 2)} m/s`, COL.v); tV.position.set(x + v * SV + .32, yT + .24, 0); }
      else aV.visible = tV.visible = false;
      if (br) { const Lf = -FS[cm2] * SF; hArrow(aF, x - HC + .04, yT + .06, 0, Lf); tF.visible = true; tF.set(`F = ${de(FS[cm2])} N`, COL.F); tF.position.set(x - HC + .04 + Lf - .27, yT + .1, 0); }
      else aF.visible = tF.visible = false;
    });
    const how = W === "zauber" ? "Die Bremsklötze reiben an der Gleitrinne" : W === "sterne" ? "Die Bremsdüsen stoßen ihr Gas nach vorn aus" : "Der Bremsklotz reibt an den Rädern";
    ctx.exhibit(g, {label: "Bremsstrecke", sub: "anklicken: Wagen starten", title: "Bremsen: Δv zeigt nach hinten", pitch: -.22,
      onClick: () => { if (ph === "idle" && !runs) { ph = "run"; ct = 0; pk = 1; } else { cm2 = (cm2 + 1) % 2; ph = "ret"; ret = 0; retFrom = x; } runs++; },
      get text(){ return cm2 === 0
        ? `Der Wagen (m = 2,0 kg) rollt mit v = 1,2 m/s heran. ${how} – die **Bremskraft F = 1,2 N** wirkt **entgegen der Bewegung**. ` +
          "Darum zeigt auch **Δv nach hinten**: Die Geschwindigkeit nimmt ab, bis der Wagen steht.\n\nBremsdauer: Δt = m · Δv : F = 2,0 kg · 1,2 m/s : 1,2 N = **2,0 s**. Klicke noch einmal: doppelte Bremskraft."
        : "Mit der **doppelten Bremskraft** F = 2,4 N halbiert sich die Bremsdauer:\nΔt = 2,0 kg · 1,2 m/s : 2,4 N = **1,0 s**.\n\n" +
          "Auch die Bremsstrecke halbiert sich (1,2 m → 0,6 m, siehe Markierung). Δv ist wieder 1,2 m/s nach hinten – nur schneller erreicht. Klicke noch einmal: wieder 1,2 N."; }});
    ctx.obstacleBox(S.C.x + .12, S.C.z, 1.05, 3.45);
  }

  /* =====================================================================
     D: Wagen am fallenden Wägestück (links vorne, Front nach +x)
     ===================================================================== */
  {
    const ZD = S.D.z + .35, g = new T.Group(); ctx.add(g, S.D.x, 0, ZD); g.rotation.y = Math.PI / 2;   // etwas von der Vorderwand abgerückt
    const TD = 1.2, LTD = TD + .03, XS = -1.25, XE = 1.2, PXL = 1.72, PR = .09, PY = LTD + .03, HX = PXL + PR, gN = 9.81, mTot = 1.0, HS = 1.7;   // Rolle: Achse (PXL | PY), Faden fällt bei HX
    const MD = [{mh: .05, onCart: 1}, {mh: .1, onCart: 0}];
    const b = bucket(T); bench(ctx, b, L0, 3.2, .56, TD); lane(ctx, b, -1.55, 1.42, 0, TD, .26);
    b.box(mFrame, .06, .1, .2, 1.46, LTD + .05, 0); b.box(ctx.mat("rubber"), .025, .07, .14, 1.42, LTD + .05, 0);
    // Galgen neben dem Tischende: ein Pfosten hinten (der Fallschacht bleibt von vorn frei), Arm über der großen Umlenkrolle, freitragende Achse,
    // darunter Fallschacht und Auffangkissen
    const pad = W === "sterne" ? ctx.mat("plastic", {color: "#2a3442"}) : ctx.mat("cloth", {color: W === "zauber" ? "#5a1420" : "#4a3a2a"});
    b.box(pad, .3, .1, .3, HX, .05, 0); b.box(mFrame, .32, .012, .32, HX, .105, 0);
    const GT = LTD + .36, GZ = .19;
    b.box(mFrame, .24, .03, .1, PXL, .015, -GZ); b.box(mBody, .05, GT - .03, .05, PXL, (GT + .03) / 2, -GZ);                   // Fuß, Pfosten
    b.box(mFrame, .065, .02, .065, PXL, GT + .01, -GZ); b.sph(mFrame, .034, PXL, GT + .05, -GZ, 12);
    b.box(mBody, .05, .05, GZ + .09, PXL, GT - .025, (-GZ + .06) / 2); b.box(mFrame, .055, .012, GZ + .1, PXL, GT - .056, (-GZ + .06) / 2);   // Galgenarm
    b.box(mBody, .032, .22, .032, PXL, GT - .13, -GZ + .075, Math.PI / 4, 0, 0);                                                // Strebe
    b.sph(mFrame, .026, PXL, GT - .025, .07, 10);                                                                               // Knauf am Armende
    b.cyl(mFrame, .024, .024, .04, 14, PXL, PY, -GZ + .045, Math.PI / 2, 0, 0);                                                 // Lagerbuchse
    b.cyl(ctx.mat("steel"), .007, .007, GZ + .035, 8, PXL, PY, (-GZ + .035) / 2, Math.PI / 2, 0, 0);                            // freitragende Achse
    b.cyl(mFrame, .013, .013, .01, 10, PXL, PY, .03, Math.PI / 2, 0, 0);                                                        // Mutter
    const ys0 = .118, ys1 = PY - PR - .05, hs = ys1 - ys0;                                                                 // Fallschacht
    if (W === "zauber") { b.put(ctx.mat("glass", {color: "#dfe9ff", opacity: .16}), new T.CylinderGeometry(.085, .085, hs, 24, 1, true), HX, ys0 + hs / 2, 0);
      for (const y of [ys0 + .012, ys0 + hs / 2, ys1 - .012]) b.put(mFrame, new T.TorusGeometry(.087, .009, 6, 28), HX, y, 0, Math.PI / 2, 0, 0); }
    else if (W === "sterne") { const st = ctx.mat("steel"), gl = ctx.mat("glow", {color: "#4FC3F7", intensity: 1.5});
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(st, .014, hs, .014, HX + sx * .075, ys0 + hs / 2, sz * .075);
      for (const sx of [-1, 1]) b.box(gl, .005, hs - .05, .005, HX + sx * .075, ys0 + hs / 2, .084);
      for (const y of [ys0 + .01, ys1 - .01]) for (const sz of [-1, 1]) { b.box(st, .164, .016, .016, HX, y, sz * .075); b.box(st, .016, .016, .164, HX + sz * .075, y, 0); } }
    else { for (const sz of [-1, 1]) b.cyl(mFrame, .007, .007, hs, 8, HX, ys0 + hs / 2, sz * .075);
      b.box(ctx.mat("darkwood"), .2, hs + .04, .02, HX, ys0 + hs / 2, -.11);
      for (const y of [ys0 + .012, ys1 - .012]) b.box(mFrame, .03, .02, .18, HX, y, 0); }
    postBoard(ctx, b, L0, 2.6, 1.15, 2.3, -.45); b.build(g, true);
    namePlate(ctx, g, L0, W === "zauber" ? "Zug des fallenden Gewichts" : W === "sterne" ? "Beschleunigungs-Prüfstand" : "Fallgewicht-Versuch", 0, TD - .15, .23, 1.1);
    ruler(ctx, g, L0, XS, 2.4, TD + .008, .19);
    { const wb = bucket(T), wm2 = ctx.mat(W === "sterne" ? "steel" : "brass");   // Kästchen mit Wägestücken
      wb.box(ctx.mat(W === "sterne" ? "metal" : "wood"), .28, .05, .14, -1.35, TD + .025, -.2); for (let k = 0; k < 4; k++) wb.cyl(wm2, .028, .028, .02, 16, -1.45 + k * .065, TD + .06, -.2);
      deskProps(ctx, wb, g, 1.0, TD, -.2); wb.build(g, true); }
    if (W === "sterne") { const rg = ctx.mesh(new T.TorusGeometry(.075, .006, 6, 32), ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), false); rg.rotation.x = Math.PI / 2; rg.position.set(HX, .113, 0); g.add(rg); }
    const pul = new T.Group(); pul.position.set(PXL, PY, 0); g.add(pul);
    { const pb = bucket(T), pm = ctx.mat(W === "sterne" ? "steel" : "brass"), dk = ctx.mat("metal");   // große Umlenkrolle mit Rille, Speichen und Nabe
      pb.cyl(pm, PR - .012, PR - .012, .016, 32, 0, 0, 0, Math.PI / 2, 0, 0); for (const z of [-.011, .011]) pb.put(pm, new T.TorusGeometry(PR - .006, .006, 6, 36), 0, 0, z);
      pb.box(dk, PR * 1.75, .012, .02, 0, 0, 0); pb.box(dk, .012, PR * 1.75, .02, 0, 0, 0); pb.cyl(dk, .018, .018, .03, 14, 0, 0, 0, Math.PI / 2, 0, 0); pb.build(pul, false); }
    const c = cart(ctx, {len: .26, wid: .15, sc: 1.3, extra: 0, color: COL.m1, label: "0,90 kg"}); c.position.set(XS, LTD, 0); g.add(c); const HD = c.userData.half;
    const onCart = new T.Group(); c.add(onCart); { const ob = bucket(T); ob.cyl(ctx.mat(W === "sterne" ? "steel" : "brass"), .04, .04, .02, 20, 0, c.userData.top + .01, 0); ob.build(onCart, false); }
    // zweites 50-g-Stück auf dem Wagen: nur im Diagramm-Trainer (Faden abgehängt, m = 0,90 kg + 2 · 50 g = 1,0 kg)
    const onCart2 = new T.Group(); c.add(onCart2); { const ob = bucket(T); ob.cyl(ctx.mat(W === "sterne" ? "steel" : "brass"), .04, .04, .02, 20, 0, c.userData.top + .031, 0); ob.build(onCart2, false); }
    onCart2.visible = false;
    // Hänger mit Wägestücken
    const hang = new T.Group(); g.add(hang); hang.scale.setScalar(HS);
    const hb2 = bucket(T), wm = ctx.mat("color", {color: W === "sterne" ? "#c6cfd9" : "#d4a63a", rough: .35, metal: .35});
    hb2.cyl(ctx.mat("metal"), .004, .004, .16, 6, 0, -.08, 0); hb2.put(ctx.mat("metal"), new T.TorusGeometry(.012, .003, 6, 12), 0, .008, 0); hb2.cyl(ctx.mat("metal"), .03, .03, .008, 16, 0, -.16, 0);
    hb2.build(hang, false);
    const disc2 = new T.Group(); hang.add(disc2);
    { const db = bucket(T); db.cyl(wm, .04, .04, .02, 20, 0, -.145, 0); db.build(hang, false); const d2 = bucket(T); d2.cyl(wm, .04, .04, .02, 20, 0, -.123, 0); d2.build(disc2, false); }
    // Faden (dünne Linie, wird jedes Bild angepasst)
    const NS = 16, sPos = new Float32Array((NS + 6) * 3), sGeo = new T.BufferGeometry(); sGeo.setAttribute("position", new T.BufferAttribute(sPos, 3));
    const str = new T.Line(sGeo, new T.LineBasicMaterial({color: W === "sterne" ? 0xbfe8ff : 0xf3ead2})); str.frustumCulled = false; g.add(str);
    const yS = PY + PR, yH0 = LTD - .1, yLand = .112 + .164 * HS, fallH = yH0 - yLand;
    // Fallweg-Skala hinter dem Hänger (0 bei der Startlage der Unterkante)
    { const yb = yH0 - .164 * HS, sc = screen(ctx, .09, fallH, 768, (q, w, h) => { q.fillStyle = L0.face; q.fillRect(0, 0, w, h); q.fillStyle = L0.ink; q.textBaseline = "middle";
        for (let i = 0; i <= Math.floor(fallH * 20 + 1e-6); i++) { const y = i * .05 / fallH * h, big = i % 2 === 0; q.fillRect(0, y - (big ? 2 : 1), big ? w * .42 : w * .24, big ? 4 : 2);
          if (big && i) rt(q, de(i * .05), w * .72, Math.min(h - 14, y), 24, L0.bf, "center", 700); }
        rt(q, "0", w * .72, 14, 24, L0.bf, "center", 700); });
      sc.position.set(HX, yb - fallH / 2, -.092); g.add(sc); }
    const scr = screen(ctx, 2.6, 1.15, 1280, (q, w, h, st) => {
      panel(q, w, h, L0); q.textBaseline = "middle"; const s = st || {m: 0, t: 0, run: false, done: false, hist: []}, md = MD[s.m], Fz = md.mh * gN, a = Fz / mTot;
      q.fillStyle = L0.acc; const tw0 = rt(q, "F = m · a", 44, 66, 60, L0.ff, "left", 700); q.fillStyle = L0.dim; rt(q, "und  a = Δv : Δt", 44 + tw0 + 36, 70, 40, L0.ff, "left", 700);
      q.fillStyle = L0.fg; rtFit(q, `Am Faden: ${md.mh === .05 ? "50 g" : "100 g"}`, 48, 150, 34, L0.bf, 560, "left", 700);
      q.fillStyle = COL.F; rtFit(q, `F_{G} = ${de(md.mh, 2)} kg · 9,81 N/kg ≈ ${de(Fz, 2)} N`, 48, 206, 32, L0.bf, 600, "left", 700);
      q.fillStyle = L0.fg; rtFit(q, `beschleunigte Masse: m = 1,0 kg`, 48, 262, 30, L0.bf, 600, "left", 600);
      q.fillStyle = L0.dim; rtFit(q, md.onCart ? "(Wagen 0,90 kg + 50 g darauf + 50 g am Faden)" : "(Wagen 0,90 kg + 100 g am Faden)", 48, 306, 24, L0.bf, 600, "left", 600);
      q.fillStyle = COL.dv; rtFit(q, `a = F_{G} : m ≈ ${de(Fz, 2)} N : 1,0 kg ≈ ${de(a, 2)} m/s²`, 48, 370, 34, L0.bf, 600, "left", 700);
      q.fillStyle = L0.acc2; rtFit(q, s.run && s.t > Math.sqrt(2 * fallH / a) ? "Wägestück liegt auf: F = 0 → v bleibt gleich" : "v nimmt in jeder Sekunde gleich viel zu", 48, 440, 28, L0.bf, 600, "left", 700);
      const A = axes(q, L0, {x0: 720, x1: w - 70, y0: 110, y1: h - 82, tMax: 4, vMax: 1.5, tStep: 1, vStep: .5, tLab: "t in s", vLab: "v in m/s", fs: 23});
      const curve = (mm, tEnd, alpha, dots) => { const mdd = MD[mm], aa = mdd.mh * gN / mTot, tL = Math.sqrt(2 * fallH / aa), vL = aa * tL, tS = tL + (XE - XS - fallH) / vL, te = Math.min(tEnd, tS, 4);
        const col = mm ? COL.m2 : COL.m1; q.globalAlpha = alpha; q.strokeStyle = col; q.lineWidth = 6; q.beginPath(); q.moveTo(A.X(0), A.Y(0));
        for (let tt = 0; tt <= te + 1e-6; tt += .04) { const t2 = Math.min(tt, te); q.lineTo(A.X(t2), A.Y(t2 < tL ? aa * t2 : vL)); } q.lineTo(A.X(te), A.Y(te < tL ? aa * te : vL)); q.stroke();
        if (dots) { q.fillStyle = col; for (let tt = .5; tt <= te + 1e-6; tt += .5) { q.beginPath(); q.arc(A.X(tt), A.Y(tt < tL ? aa * tt : vL), 8, 0, TAU); q.fill(); } }
        q.globalAlpha = 1; return {aa, tL, vL, te}; };
      for (const k of s.hist) if (k !== s.m) curve(k, 4, .35, false);
      if (s.run) { const r = curve(s.m, s.t, 1, true);
        if (s.done || s.t > 1.6) { const t0 = .1, t1 = 1.1, v0 = r.aa * t0, v1 = r.aa * t1;   // Δt = 1 s, endet bei beiden Versuchen vor dem Aufsetzen (100 g: nach 1,23 s)
          q.setLineDash([8, 7]); q.strokeStyle = L0.fg; q.lineWidth = 3;
          q.beginPath(); q.moveTo(A.X(t0), A.Y(v0)); q.lineTo(A.X(t1), A.Y(v0)); q.lineTo(A.X(t1), A.Y(v1)); q.stroke(); q.setLineDash([]); q.fillStyle = L0.fg;
          const lab = (txt, x, y, al) => { const tw = rt(q, txt, 0, 0, 22, L0.bf, al, 700, true), x0 = al === "center" ? x - tw / 2 : x;
            q.fillStyle = L0.bg; q.globalAlpha = .82; q.fillRect(x0 - 5, y - 14, tw + 10, 28); q.globalAlpha = 1; q.fillStyle = L0.fg; rt(q, txt, x, y, 22, L0.bf, al, 700); };
          lab("Δt = 1 s", A.X((t0 + t1) / 2 + .1), A.Y(v0) - 18, "center"); lab(`Δv ≈ ${de(v1 - v0, 2)} m/s`, A.X(t1) + 12, A.Y((v0 + v1) / 2), "left"); } }
    });
    scr.position.set(0, 2.3, -.42); g.add(scr);
    const aF = arrowIn(ctx, g, COL.F, .014), aV = arrowIn(ctx, g, COL.v, .014), tV = liveTag(ctx, .08, L0.bf), tF = liveTag(ctx, .08, L0.bf); g.add(tV, tF);
    aF.visible = aV.visible = tV.visible = tF.visible = false;
    let dm = 0, ph = "idle", dtm = 0, ret = 0, retFrom = XS, runs = 0, acc = 0, x = XS, xl = XS; const hist = new Set();
    let dz = null, retIdle = false;   // Diagramm-Trainer: Zustand {s, v, F} (null: aus) · retIdle: nach dem Zurückfahren nicht von selbst starten
    const kinD = t => { const md = MD[dm], a = md.mh * gN / mTot, tL = Math.sqrt(2 * fallH / a), vL = a * tL, tS = tL + (XE - XS - fallH) / vL;
      if (t < tL) return {x: XS + .5 * a * t * t, v: a * t, pull: true, yh: yH0 - .5 * a * t * t};
      if (t < tS) return {x: XS + fallH + vL * (t - tL), v: vL, yh: yLand}; return {x: XE, v: 0, stop: true, yh: yLand}; };
    const setStr = (xc, yh, slack) => {   // Wagen → Rolle (oben) → senkrecht zum Hänger
      const x0 = xc + HD, y0 = yS, xr = PXL; let k = 0;
      for (let i = 0; i <= NS; i++) { const u = i / NS, sag = slack > 0 ? Math.sin(u * Math.PI) * Math.min(.12, Math.sqrt(slack) * .14) : 0;
        sPos[k++] = x0 + (xr - x0) * u; sPos[k++] = y0 - sag; sPos[k++] = 0; }
      for (let i = 1; i <= 4; i++) { const a = Math.PI / 2 - i / 4 * Math.PI / 2; sPos[k++] = PXL + Math.cos(a) * PR; sPos[k++] = PY + Math.sin(a) * PR; sPos[k++] = 0; }
      sPos[k++] = HX; sPos[k++] = yh + .02; sPos[k++] = 0; sGeo.attributes.position.needsUpdate = true; };
    ctx.tick((dt, t) => {
      if (dz) {   // Diagramm-Trainer: Faden abgehängt, die eingestellte Kraft F zieht (F > 0) oder bremst (F < 0) den Wagen; Weg 1 : 1 auf der Bahn
        const xw = XS + dz.s, xd = clamp(xw, XS - .25, XE), vd = xd === xw ? dz.v : 0, yT = LTD + c.userData.top + .045;
        c.position.x = xd; c.spin(xd - xl); xl = x = xd;
        onCart.visible = onCart2.visible = true; disc2.visible = false; hang.visible = str.visible = false;
        if (Math.abs(dz.F) > .01) { hArrow(aF, xd, yT + .06, 0, dz.F * SF); tF.visible = true; tF.set(`F = ${dz.F < 0 ? "−" : ""}${de(Math.abs(dz.F), 2)} N`, COL.F); tF.position.set(xd + dz.F * SF + (dz.F > 0 ? .26 : -.26), yT + .09, 0); }
        else aF.visible = tF.visible = false;
        if (Math.abs(vd) > .005) { hArrow(aV, xd, yT + .2, 0, vd * SV); tV.visible = true; tV.set(`v = ${vd < 0 ? "−" : ""}${de(Math.abs(vd), 2)} m/s`, COL.v); tV.position.set(xd + vd * SV + (vd > 0 ? .3 : -.3), yT + .24, 0); }
        else aV.visible = tV.visible = false;
        return;
      }
      let v = 0, pull = false, stop = false, yh = yH0, md = MD[dm];
      if (ph === "run") { dtm += dt; const k = kinD(dtm); x = k.x; v = k.v; pull = !!k.pull; stop = !!k.stop; yh = k.yh; }
      else if (ph === "ret") { ret += dt; const k = sm(ret / 1.0); x = retFrom + (XS - retFrom) * k; yh = yLand + (yH0 - yLand) * k;
        if (ret >= 1) { if (retIdle) { ph = "idle"; retIdle = false; } else { ph = "run"; dtm = 0; } } }
      c.position.x = x; c.spin(x - xl); pul.rotation.z -= (x - xl) / PR; xl = x;
      onCart.visible = !!md.onCart; disc2.visible = !md.onCart;
      hang.position.set(HX, yh, 0); hang.rotation.z = ph === "idle" ? Math.sin(t * 1.3) * .03 : 0;
      setStr(x, yh, ph === "run" && !pull ? (x - (XS + fallH)) : 0);
      const yT = LTD + c.userData.top + (md.onCart ? .02 : 0);
      // F_G-Pfeil vor dem Fallschacht (zur Gangseite versetzt), Schild daneben
      if (pull) { const yw = yh - .15 * HS, Lf = md.mh * gN * SF; aF.visible = true; aF.set([HX, yw, .15], [HX, yw - Lf, .15]); tF.visible = true;
        tF.set(`F_{G} ≈ ${de(md.mh * gN, 2)} N`, COL.F); tF.position.set(HX + .25, yw - Lf * .5, .17); }
      else aF.visible = tF.visible = false;
      if (ph === "run" && !stop && v > .02) { hArrow(aV, x, yT + .18, 0, v * SV); tV.visible = true; tV.set(`v = ${de(v, 2)} m/s`, COL.v); tV.position.set(x + v * SV + .3, yT + .22, 0); }
      else aV.visible = tV.visible = false;
      acc += dt; if ((ph === "run" && dtm < 4.3 && acc > .05) || (ph !== "run" && acc > .5)) { scr.redraw({m: dm, t: dtm, run: ph === "run", done: stop, hist: [...hist]}); acc = 0; }
      if (stop) hist.add(dm);
    });
    ctx.exhibit(g, {label: "Wagen am Wägestück", sub: "anklicken: loslassen", title: "Beschleunigung: a = F : m", pitch: -.12,
      onClick: () => { if (ph === "idle" && !runs) { ph = "run"; dtm = 0; } else { hist.add(dm); dm = (dm + 1) % 2; ph = "ret"; ret = 0; retFrom = x; } runs++; },
      get text(){ return dm === 0
        ? "Das Wägestück am Faden (50 g) zieht mit seiner Gewichtskraft F_{G} = 0,05 kg · 9,81 N/kg ≈ **0,49 N**. Beschleunigt werden Wagen und Wägestücke zusammen: **m = 1,0 kg**. " +
          "Also gilt **a = F_{G} : m ≈ 0,49 m/s^{2}**: Die Geschwindigkeit wächst in jeder Sekunde um 0,49 m/s, der t-v-Graph ist eine Gerade.\n\n" +
          "Sobald das Wägestück aufliegt, wirkt keine Kraft mehr: Der Wagen fährt gleichförmig weiter. Klicke noch einmal: die 50 g vom Wagen auch an den Faden hängen."
        : "Jetzt hängen **100 g** am Faden: F_{G} ≈ 0,98 N. Die Gesamtmasse ist mit 1,0 kg gleich geblieben, denn das zweite Wägestück kam vom Wagen.\n\n" +
          "**Doppelte Kraft – doppelte Beschleunigung**: a = F_{G} : m ≈ 0,98 m/s^{2}. Der Graph steigt doppelt so steil. Klicke noch einmal: wieder 50 g."; }});
    // Diagramm-Trainer (t-v-Diagramm): feste Masse 1,0 kg, Regler = resultierende Kraft F (negativ: bremsen) → a = F : m, v += a · Δt, s += v · Δt.
    // Ziele so gewählt, dass der Weg auf die Bahn passt (s ≤ 2,4 m, der Wagen fährt im 3D-Raum 1 : 1 mit)
    const MDG = 1.0;
    ctx.diagramm(g, {
      id: "kraft-tv", titel: "Steuere die Kraft",
      text: "Der Faden ist abgehängt, beide 50-g-Stücke liegen auf dem Wagen: **m = 1,0 kg**. Er rollt reibungsfrei mit 0,1 m/s los. Jetzt bestimmst du die **resultierende Kraft F**: " +
        "positiv zieht in Fahrtrichtung, negativ bremst. Stelle den Regler während der Fahrt so ein, dass deine t-v-Kurve dem gestrichelten Ziel folgt.",
      y: "v", steuer: {id: "F", name: "resultierende Kraft F", einheit: "N", min: -.5, max: .5, schritt: .05, wert: 0},
      start: {s: 0, v: .1, F: 0},
      modell: (z, u, dt) => { const a = u / MDG, v = z.v + a * dt; return {s: z.s + v * dt, v, F: u}; },
      dauer: 8, achsen: {x: {name: "t in s", max: 8, teil: 1}, y: {name: "v in m/s", max: .6, teil: .1}},
      bahn: {name: "s in m", max: 2.4, teil: .4}, steigung: {name: "Beschleunigung", einheit: "m/s^{2}"},
      figur: W === "zauber" ? "🛷" : W === "sterne" ? "🛸" : "🛒",
      ziele: [
        {name: "Gleich schnell weiter", text: "Der Wagen soll die ganzen 8 s lang genau mit 0,1 m/s weiterfahren. Welche Kraft brauchst du dafür?",
         punkte: [[0, .1], [8, .1]], toleranz: .06, tipp: "Jede Kraft ändert die Geschwindigkeit. Was passiert ohne Kraft?",
         erklaerung: "Dafür brauchst du **keine Kraft**: Bei F = 0 ist Δv = 0, der Wagen fährt wegen seiner **Trägheit** gleichförmig weiter. Im t-v-Diagramm ist das eine **waagrechte** Linie."},
        {name: "Gleichmäßig schneller", text: "Erst 2 s rollen lassen, dann bis 6 s gleichmäßig auf 0,5 m/s beschleunigen und danach gleich schnell weiterfahren.",
         punkte: [[0, .1], [2, .1], [6, .5], [8, .5]], toleranz: .06,
         tipp: "Die Steigung ist die Beschleunigung: a = Δv : Δt. Die Kraft dafür ist F = m · a – und bei 6 s stellst du sie wieder auf 0.",
         erklaerung: "Zwischen 2 s und 6 s ist a = 0,4 m/s : 4 s = 0,1 m/s^{2}, dafür braucht der Wagen F = m · a = 1,0 kg · 0,1 m/s^{2} = **0,1 N**. Eine konstante Kraft ergibt eine **steigende Gerade**."},
        {name: "Bremsen bis zum Stillstand", text: "Bis 2 s auf 0,5 m/s beschleunigen, 2 s lang gleich schnell fahren, dann bis 6 s gleichmäßig abbremsen, bis der Wagen steht – und stehen bleiben.",
         punkte: [[0, .1], [2, .5], [4, .5], [6, 0], [8, 0]], toleranz: .06,
         tipp: "Bremsen heißt: Kraft entgegen der Fahrtrichtung, also ein negatives F. Stelle die Kraft auf 0, sobald der Wagen steht – sonst fährt er rückwärts.",
         erklaerung: "Anfahren: a = 0,4 m/s : 2 s = 0,2 m/s^{2}, also F = 0,2 N. Bremsen: a = −0,5 m/s : 2 s = −0,25 m/s^{2}, also F = **−0,25 N** – die Kraft zeigt nach hinten und mit ihr Δv. " +
           "Der Graph **fällt**. Sobald der Wagen steht, muss F = 0 sein."}
      ],
      fragen: [
        {frage: "Auf welchen Wagen wirkt **während der ganzen 8 s** keine resultierende Kraft?",
         kurven: [{name: "A", punkte: [[0, .1], [8, .5]]}, {name: "B", punkte: [[0, .4], [8, .4]]}, {name: "C", punkte: [[0, .6], [6, 0], [8, 0]]}],
         optionen: ["auf Wagen B", "auf Wagen A", "auf Wagen C", "auf keinen – ohne Kraft würde jeder Wagen stehen bleiben"], richtig: 0,
         warum: [null, "A wird gleichmäßig schneller, seine Gerade steigt. Dafür braucht er die ganze Zeit eine Kraft in Fahrtrichtung.",
                 "C wird bis 6 s langsamer, sein Graph fällt. Dafür braucht er eine Bremskraft – erst danach steht er ohne Kraft.",
                 "Ohne resultierende Kraft bleibt ein Wagen nicht stehen, sondern behält seine Geschwindigkeit (Trägheit). Genau das zeigt die waagrechte Linie von B."],
         erklaerung: "Waagrecht im t-v-Diagramm heißt: v bleibt gleich, Δv = 0 – also F = 0. Steigend: Kraft in Fahrtrichtung, fallend: Kraft entgegen der Fahrtrichtung."},
        {frage: "Beide Wagen haben die gleiche Masse und starten aus dem Stand. Auf welchen wirkt die größere resultierende Kraft?",
         kurven: [{name: "A", punkte: [[0, 0], [6, .6]]}, {name: "B", punkte: [[0, 0], [8, .4]]}],
         optionen: ["auf Wagen A", "auf Wagen B", "auf beide eine gleich große Kraft", "Das kann man ohne Angabe des Wegs nicht sagen."], richtig: 0,
         warum: [null, "B fährt zwar länger, aber seine Gerade ist flacher: Seine Geschwindigkeit nimmt in jeder Sekunde nur um 0,05 m/s zu, die von A um 0,1 m/s.",
                 "Gleich große Kräfte auf gleiche Massen ergäben gleich steile Geraden. Die Steigungen sind aber verschieden.",
                 "Den Weg brauchst du nicht: Die Steigung im t-v-Diagramm ist die Beschleunigung, und mit F = m · a folgt daraus die Kraft."],
         erklaerung: "Die steilere Gerade gehört zur größeren Beschleunigung. Bei gleicher Masse gilt F = m · a: Auf A wirkt die doppelte Kraft."},
        // eigene Kurven (nicht die der Ziele): deren Erklärungen nennen die Steigungen 0,1 und 0,2 m/s^{2} schon
        {frage: "Lies ab: Wie groß ist die Beschleunigung des Wagens zwischen 2 s und 6 s?", kurven: [{name: "Wagen", punkte: [[0, 0], [2, 0], [6, .6], [8, .6]]}],
         wert: .15, einheit: "m/s^{2}", toleranz: .01,
         tipps: ["Die Beschleunigung ist die Steigung: a = Δv : Δt.", "Bei 2 s ist v = 0, bei 6 s ist v = 0,6 m/s. Also Δv = 0,6 m/s in Δt = 4 s."],
         loesung: "a = Δv : Δt = 0,6 m/s : 4 s = 0,15 m/s^{2}"},
        {frage: "Ein Wagen mit m = 2,0 kg bremst. Lies die Beschleunigung ab und berechne den Betrag der Bremskraft.", kurven: [{name: "Wagen", punkte: [[0, .6], [2, .6], [4, 0], [8, 0]]}],
         wert: .6, einheit: "N", toleranz: .03,
         tipps: ["Zwischen 2 s und 4 s nimmt v in 2 s um 0,6 m/s ab. Das ergibt den Betrag der Beschleunigung: a = Δv : Δt.", "a = 0,6 m/s : 2 s = 0,3 m/s^{2}. Jetzt F = m · a."],
         loesung: "a = 0,6 m/s : 2 s = 0,3 m/s^{2};  F = m · a = 2,0 kg · 0,3 m/s^{2} = 0,6 N – entgegen der Fahrtrichtung"}
      ],
      merke: "Im t-v-Diagramm ist die **Steigung** die Beschleunigung a = Δv : Δt. **Waagrecht**: v bleibt gleich, die resultierende Kraft ist null (Trägheit). " +
        "**Steigend**: Kraft in Fahrtrichtung, **fallend**: Kraft entgegen der Fahrtrichtung (Bremsen). Mit F = m · a gehört zu jeder Steigung eine Kraft.",
      live: z => {
        if (!z) { if (dz) { dz = null; hang.visible = str.visible = true; onCart2.visible = false; aF.visible = aV.visible = tF.visible = tV.visible = false;
          ph = "ret"; ret = 0; retFrom = x; retIdle = true; } return; }   // zurück zum Start, Wägestück wieder am Faden, dann Ruhe
        dz = z; ph = "idle";
      }
    });
    ctx.obstacleBox(S.D.x - .1, ZD - .2, 1.0, 3.95);
  }

  /* ===== Wandtafeln (über den Stationen; Unterkante ≥ 2,75 m, damit die Stationsschilder sie nicht verdecken und der Kern nichts anheben muss).
     Raumstation und Detektei: 2,3 m hoch, sonst setzen ihre Tafeln bei zweizeiligem Titel die Zeilen sehr klein; das Pergament der Zauberwelt
     hat eine feste Zeilengröße und bleibt 2,0 m hoch (sonst unten leer). Unterkante 2,85 bzw. 2,9 m: etwas Luft über den Stationsschildern
     (bei 2,75 m berührt die Messingnummer der Detektei die Tafel aus der Gangsicht). ===== */
  const isZ = W === "zauber", YW = isZ ? 3.9 : 4.0, HW = isZ ? 2.0 : 2.3;
  ctx.wallBoard("left", 6.75, YW, 3.2, HW, "Newtonsche Bewegungsgleichung", ["F · Δt = m · Δv", "F: resultierende Kraft (in N)", "Δt: Einwirkdauer (in s)", "m: Masse (in kg)", "Δv: Zusatzgeschwindigkeit (in m/s)"]);
  // Zeilen kurz halten (≤ ca. 32 Zeichen): sonst brechen Raumstation und Detektei um und setzen alles kleiner
  ctx.wallBoard("right", 2.25, YW, 3.2, HW, "Kraft ändert die Geschwindigkeit", ["Δv zeigt immer in Kraftrichtung", "Kraft nach vorn: schneller", "Kraft nach hinten: langsamer", "Kraft quer: Richtung ändert sich", "Ohne resultierende Kraft: Δv = 0"]);
  ctx.wallBoard("left", -2.25, YW, 3.2, HW, "Die Beschleunigung", ["a = Δv : Δt", "Einheit: 1 m/s^{2}", "a = 1 m/s^{2}: +1 m/s je Sekunde", "F = m · a (aus F · Δt = m · Δv)", "Freier Fall: a = g ≈ 9,81 m/s^{2}"]);
  ctx.wallBoard("right", -6.75, YW, 3.2, HW, "Umstellen und Einheiten", ["Δv = F · Δt : m", "Δt = m · Δv : F", "1 N = 1 kg · m/s^{2}", "km/h durch 3,6 teilen → m/s", "Kraftpfeile: 1 N ≙ 25 cm", "v-Pfeile: 1 m/s ≙ 30 cm"]);
};
})();
