/* ---------- 20_kraft2.js ---------- */
/* =====================================================================
   Raum 8 · Trägheit – Verformung – schiefe Ebene (Kap. 4.4–4.6)
   Mittelstück: schiefe Ebene (l = 3,0 m) mit verstellbarer Höhe (Klick), Wagen mit Last (F_G = 600 N) am Seil mit Kraftmesser;
                Zerlegung von F_G in F_H und F_N mit Kräfteparallelogramm (Pfeile über allem), Messtafel mit allen Neigungen
   A: zwei Schraubenfedern (D = 0,5 N/cm und 1,0 N/cm), Wägestücke je 5 N, Maßstäbe, F-s-Diagramm wächst mit
   B: Tischtuchtrick und Münze auf der Karte – abwechselnd ruckartig und langsam gezogen
   C: zwei Pressen: Feder (elastisch) und Knetmasse (plastisch), überdehnte Feder zur Elastizitätsgrenze
   D: Wagen mit Puppe (Gurt, Kopfstütze) und loser Kugel – abwechselnd Vollbremsung und Stoß von hinten
   E: drei Federkraftmesser (2,5 N · 10 N · 50 N) mit je 2 N belastet – Messbereich und Federhärte (Ecke rechts vorne)
   Lagerecke links hinten (Kisten, Fässer, kleine Laderampe) · über dem Gang: Schild über dem Mittelstück, zwei schwingende Federleuchten
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
const TAU = Math.PI * 2;
const COL = {G: "#ff5b47", H: "#4f9dff", N: "#3ad57f", S: "#ffb02e", soft: "#ff9f45", hard: "#5fd0ff"};   // in allen Welten gleich
const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;

/* ---------- Farben der Anzeigen je Welt ---------- */
function look(ctx){ const L = look0(ctx); L.ff = formFont(ctx) || L.tf; return L; }   // ff: Titel mit Formeln
function look0(ctx){
  const k = ctx.kit, w = ctx.world;
  if (w === "sterne") return {w, bg: "#061527", fg: "#eaf6ff", acc: "#FFE81F", acc2: "#4FC3F7", dim: "#8fb4cc", grid: "rgba(79,195,247,.22)", hi: "rgba(255,232,31,.16)", tf: k.font, bf: k.fontBody, scan: true};
  if (w === "detektiv") return {w, bg: "#1c2520", fg: "#f3e6cc", acc: "#E0A86A", acc2: "#8fd1bf", dim: "#b9ab90", grid: "rgba(243,230,204,.15)", hi: "rgba(224,168,106,.22)", tf: k.font, bf: k.fontBody, speck: true};
  return {w, bg: "#1e2a23", fg: "#f4ecd8", acc: "#E3B341", acc2: "#a9c4ff", dim: "#b8bfab", grid: "rgba(244,236,216,.14)", hi: "rgba(227,179,65,.22)", tf: k.font, bf: k.fontBody, speck: true};
}

/* ---------- Schrift mit Tiefstellung: "F_{H}" ---------- */
function rt(g, s, x, y, size, font, align = "left", weight = 600, measure = false){
  const parts = []; String(s).replace(/_\{([^}]*)\}|[^_]+|_/g, (m, sub) => { parts.push(sub != null ? [sub, 1] : [m, 0]); return m; });
  const fN = `${weight} ${size}px ${font}`, fS = `${weight} ${Math.round(size * .64)}px ${font}`;
  let w = 0; for (const [t, b] of parts) { g.font = b ? fS : fN; w += g.measureText(t).width; }
  if (measure) return w;
  let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; const al = g.textAlign; g.textAlign = "left";
  for (const [t, b] of parts) { g.font = b ? fS : fN; g.fillText(t, cx, y + (b ? size * .26 : 0)); cx += g.measureText(t).width; }
  g.textAlign = al; return w;
}
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

/* ---------- Anzeigen, Schilder, Federn ---------- */
function screen(ctx, w, h, px, draw, back = 0){
  const T = ctx.T, c = document.createElement("canvas"); c.width = Math.round(w >= h ? px : px * w / h); c.height = Math.round(h >= w ? px : px * h / w);
  const g = c.getContext("2d"), tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new T.MeshBasicMaterial({map: tex, toneMapped: false}), m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
  if (back) { const bm = new T.Mesh(m.geometry, mat); bm.rotation.y = Math.PI; bm.position.z = -back; m.add(bm); }   // Rückseite (gleiches Bild, lesbar)
  m.redraw = (...a) => { g.save(); draw(g, c.width, c.height, ...a); g.restore(); tex.needsUpdate = true; };
  m.redraw(); return m;
}
// Schwebendes Schildchen mit wechselbarem Text; onTop: immer sichtbar (für Kraftpfeile)
function tag(ctx, h, onTop){
  const T = ctx.T, c = document.createElement("canvas"); c.width = 640; c.height = 112; const g = c.getContext("2d"), f = ctx.kit.fontBody;
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const sp = new T.Sprite(new T.SpriteMaterial({map: t, transparent: true, depthWrite: false, depthTest: !onTop, toneMapped: false}));
  sp.scale.set(h * c.width / c.height, h, 1); sp.renderOrder = onTop ? 22 : 6; let cur = null;
  sp.set = (s, col) => { const k = s + "|" + col; if (k === cur) return; cur = k; g.clearRect(0, 0, c.width, c.height);
    let px = 66, tw; while ((tw = rt(g, s, 0, 0, px, f, "left", 700, true)) > c.width - px * 1.1 && px > 26) px -= 3;
    const pw = tw + px * .9, x0 = (c.width - pw) / 2; g.fillStyle = "rgba(8,10,16,.74)"; g.beginPath(); g.roundRect(x0, 12, pw, c.height - 24, (c.height - 24) / 2); g.fill();
    g.strokeStyle = col; g.globalAlpha = .85; g.lineWidth = 4; g.stroke(); g.globalAlpha = 1;
    g.fillStyle = col; g.textBaseline = "middle"; rt(g, s, c.width / 2, c.height / 2 + 1, px, f, "center", 700); t.needsUpdate = true; };
  return sp;
}
// Schraubenfeder: dir = −1 von oben nach unten (Ursprung oben), +1 von unten nach oben; f(u) für ungleichmäßige Windungen
function helixGeo(T, r, len, turns, wire, dir = -1, f = u => u){
  const n = Math.max(24, Math.round(turns * 14)), pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n, a = u * turns * TAU; pts.push(new T.Vector3(Math.cos(a) * r, dir * f(u) * len, Math.sin(a) * r)); }
  return new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * 2, wire, 6, false);
}
// Pfeile und Linien über allem zeichnen (wie im Schulbuch eingezeichnet)
function onTop(o, ro){ o.traverse(n => { if (n.material) { n.material.depthTest = false; n.material.depthWrite = false; n.material.transparent = true; } n.renderOrder = ro; }); return o; }
function basic(T, color, o = {}){ return new T.MeshBasicMaterial(Object.assign({color, toneMapped: false}, o)); }
// Beschriftung der Exponate: in der Sterne-Welt mit dunklem Grund (helle Wandpaneele und Stahl dahinter)
const LAB_BG = "#0b1c2e";
function txt(ctx, s, o){ if (ctx.world === "sterne" && !("bg" in o)) o.bg = LAB_BG; return ctx.text(s, o); }
// Schrift für Formeln und Einheiten: Die Zierschrift der Zauberwelt verformt Buchstaben (N sieht aus wie Ŋ) – dort die Textschrift nehmen
const formFont = ctx => ctx.world === "detektiv" ? "Georgia, 'Times New Roman', serif" : ctx.world === "zauber" ? ctx.kit.fontBody : undefined;
// Schild hinter einer Beschriftung (Breite w, Höhe h, Mitte x|y, Vorderseite bei z): Rahmen aus Messing/Stahl, dunkle Tafel
function plateMats(ctx){ const st = ctx.world === "sterne";
  return {frame: ctx.mat(st ? "steel" : "brass"), face: st ? ctx.mat("color", {color: LAB_BG, rough: .6}) : ctx.mat("darkwood")}; }
function plateBehind(bk, PM, w, h, x, y, z){ bk.box(PM.frame, w + .04, h + .035, .01, x, y, z - .011); bk.box(PM.face, w + .016, h + .012, .006, x, y, z - .003); }

/* =====================================================================
   Mittelstück: die schiefe Ebene
   ===================================================================== */
function rampCenter(ctx, L){
  const T = ctx.T, W = ctx.world, S = ctx.slots, V = (x, y, z = 0) => new T.Vector3(x, y, z);
  const g = new T.Group(); ctx.add(g, S.center.x, 0, S.center.z);
  const Y0 = .55, XH = -1.65, LEN = 3, XS = 2.3, KF = 1 / 600, SC = 1.15, CS = 1.25, HC = .07 + .3 * CS, RH = .07 + .19 * CS;   // Podest, Gelenk, Länge l, Stütze, Pfeilmaßstab (m je N), Wagen
  const ST = [{h: 0, hs: "0 m", r: "waagrecht", fh: 0, fnS: "600 N"}, {h: .5, hs: "0,5 m", r: "1 : 6", fh: 100, fnS: "≈ 592 N"},
              {h: 1, hs: "1,0 m", r: "1 : 3", fh: 200, fnS: "≈ 566 N"}, {h: 1.5, hs: "1,5 m", r: "1 : 2", fh: 300, fnS: "≈ 520 N"}];
  let si = 2, th = Math.asin(ST[si].h / LEN), thT = th;
  const sterne = W === "sterne", det = W === "detektiv", zau = W === "zauber";
  const M = {
    plinth: ctx.mat(sterne ? "metal" : "stone"), pod: sterne ? ctx.mat("plastic", {color: "#dfe6ee"}) : ctx.mat(det ? "darkwood" : "wood"),
    trim: ctx.mat(sterne ? "steel" : "brass"), board: ctx.mat(sterne ? "floor" : "wood"),
    dark: ctx.mat("color", {color: sterne ? "#1d2430" : "#2a1d14", rough: .7}), rod: ctx.mat(det ? "metal" : sterne ? "steel" : "darkwood"),
    glow: sterne ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.5}) : zau ? ctx.mat("glow", {color: "#E3B341", intensity: 1.0}) : null,
    rope: ctx.mat("color", {color: sterne ? "#2b3644" : "#c9b38a", rough: .9})
  };
  /* Podest mit Zierfeldern */
  const b = bucket(T);
  b.box(M.plinth, 4.0, .1, 1.5, 0, .05, 0);
  b.box(M.pod, 3.7, Y0 - .1, .74, 0, .1 + (Y0 - .1) / 2, 0);
  b.box(M.trim, 3.76, .03, .8, 0, Y0 - .015, 0); b.box(M.trim, 3.76, .03, .8, 0, .115, 0);
  for (const sz of [-1, 1]) for (const px of [-1.2, 0, 1.2]) { const z = sz * .372;
    b.box(M.trim, 1.0, .02, .012, px, .19, z); b.box(M.trim, 1.0, .02, .012, px, Y0 - .09, z);
    b.box(M.trim, .02, .22, .012, px - .5, (Y0 + .1) / 2, z); b.box(M.trim, .02, .22, .012, px + .5, (Y0 + .1) / 2, z); }
  if (M.glow) for (const sz of [-1, 1]) b.box(M.glow, 3.98, .012, .012, 0, .092, sz * .752);
  // Gelenk
  b.cyl(M.trim, .045, .045, .84, 16, XH, Y0, 0, Math.PI / 2, 0, 0);
  for (const z of [-.39, .39]) b.box(M.dark, .16, .07, .04, XH, Y0 + .01, z);
  // Hubgestell mit verschiebbarer Querstange
  const xs = XH + XS;
  for (const z of [-.47, .47]) { b.cyl(M.rod, .028, .028, 2.45, 12, xs, .1 + 1.225, z); b.cyl(M.trim, .07, .08, .05, 16, xs, .125, z); b.sph(M.trim, .045, xs, 2.57, z, 12); }
  b.box(M.rod, .05, .05, .99, xs, 2.52, 0);
  // Messtafel hinter der Ebene: Pfosten und Rahmen
  const DX = -.82, DY = 2.72, DZ = -.61;
  for (const x of [DX - .9, DX + .9]) b.box(M.rod, .05, DY - .5 - .1, .05, x, .1 + (DY - .5 - .1) / 2, DZ);
  b.box(M.trim, 1.98, 1.08, .04, DX, DY, DZ);
  b.build(g);
  const cross = new T.Group(); cross.position.x = xs; g.add(cross);
  { const cb = bucket(T); cb.cyl(M.trim, .026, .026, 1.04, 12, 0, 0, 0, Math.PI / 2, 0, 0); for (const z of [-.47, .47]) cb.box(M.dark, .09, .09, .07, 0, 0, z); cb.build(cross); }

  /* Die Ebene (Gruppe dreht sich um das Gelenk) */
  const rampG = new T.Group(); rampG.position.set(XH, Y0, 0); g.add(rampG);
  const rb = bucket(T);
  rb.box(M.board, LEN + .04, .07, .72, LEN / 2, .035, 0);
  for (const z of [-.35, .35]) rb.box(M.trim, LEN + .04, .045, .025, LEN / 2, .085, z);
  for (const z of [-.31, .31]) rb.box(M.dark, LEN - .14, .004, .06, LEN / 2 + .03, .072, z);
  if (sterne) rb.box(M.glow, LEN - .1, .005, .02, LEN / 2, .073, 0);
  rb.box(M.dark, .08, RH + .08 - .07, .16, LEN - .05, .07 + (RH + .08 - .07) / 2, 0);              // Endpfosten
  const mMeter = sterne ? ctx.mat("plastic", {color: "#e9eef4"}) : ctx.mat("brass");
  rb.cyl(mMeter, .032, .032, .44, 16, 2.64, RH, 0, 0, 0, Math.PI / 2);                           // Federkraftmesser
  for (const x of [2.42, 2.86]) rb.cyl(M.dark, .037, .037, .03, 16, x, RH, 0, 0, 0, Math.PI / 2);
  rb.box(M.dark, .12, .022, .022, 2.92, RH, 0);
  for (let i = 1; i < 8; i++) rb.cyl(M.dark, .0335, .0335, .006, 16, 2.44 + i * .05, RH, 0, 0, 0, Math.PI / 2);   // Skalenringe
  rb.build(rampG);
  // Maßband an der Vorder- und Rückkante: zeigt l = 3,0 m
  const tapeT = R3D.util.canvasTex(1024, 34, (q, w, h) => { q.fillStyle = "#e7c64a"; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1408";
    for (let i = 0; i <= 30; i++) { const x = 4 + i * (w - 8) / 30, big = i % 5 === 0; q.fillRect(x - (big ? 1.5 : 1), 0, big ? 3 : 2, big ? h * .55 : h * .32); }
    q.font = "700 17px Helvetica, Arial, sans-serif"; q.textBaseline = "bottom";
    for (let i = 0; i <= 6; i++) { const x = 4 + i * 5 * (w - 8) / 30; q.textAlign = i === 0 ? "left" : i === 6 ? "right" : "center"; q.fillText(i === 6 ? "3,0 m" : String(i / 2).replace(".", ","), x + (i === 0 ? 4 : i === 6 ? -4 : 0), h - 1); } }, "k2-band");
  const tapeM = new T.MeshBasicMaterial({map: tapeT, color: 0xdddddd});
  for (const s of [1, -1]) { const tp = new T.Mesh(new T.PlaneGeometry(LEN, .05), tapeM); tp.position.set(LEN / 2, .035, s * .3615); if (s < 0) tp.rotation.y = Math.PI; rampG.add(tp); }
  // Zugstange des Kraftmessers (fährt mit der Haltekraft aus) und Seil
  const rodG = new T.Group(); rampG.add(rodG);
  { const qb = bucket(T); qb.cyl(ctx.mat("steel"), .012, .012, .3, 10, .15, 0, 0, 0, 0, Math.PI / 2); qb.put(M.trim, new T.TorusGeometry(.02, .005, 6, 14), -.012, 0, 0);
    qb.build(rodG, false);
    const mark = new T.Mesh(new T.CylinderGeometry(.0145, .0145, .012, 12).rotateZ(Math.PI / 2), basic(T, "#d23a2a")); mark.position.x = .05; rodG.add(mark); }
  const rope = ctx.mesh(new T.CylinderGeometry(.009, .009, 1, 8).rotateZ(Math.PI / 2).translate(.5, 0, 0), M.rope, false); rampG.add(rope);

  /* Wagen mit Last (Truhe / Frachtcontainer / Fass) */
  const cart = new T.Group(); cart.position.set(SC, .07, 0); cart.scale.setScalar(CS); rampG.add(cart);
  { const kb = bucket(T), wheelM = sterne ? ctx.mat("rubber") : ctx.mat(zau ? "brass" : "metal"), bodyM = sterne ? ctx.mat("metal") : ctx.mat(det ? "darkwood" : "wood");
    for (const x of [-.2, .2]) { for (const z of [-.25, .25]) { kb.cyl(wheelM, .07, .07, .045, 20, x, .07, z, Math.PI / 2, 0, 0); kb.cyl(M.trim, .026, .026, .055, 10, x, .07, z, Math.PI / 2, 0, 0); }
      kb.cyl(M.dark, .012, .012, .5, 8, x, .07, 0, Math.PI / 2, 0, 0); }
    kb.box(bodyM, .68, .05, .46, 0, .135, 0); kb.box(M.trim, .7, .015, .48, 0, .167, 0);
    kb.box(M.trim, .07, .028, .028, .355, .19, 0); kb.put(M.trim, new T.TorusGeometry(.02, .006, 6, 12), .395, .19, 0);   // Zughaken
    if (zau) {
      const dw = ctx.mat("darkwood"), gold = ctx.mat("gold");
      kb.box(dw, .5, .24, .38, 0, .295, 0);
      kb.put(dw, new T.CylinderGeometry(.19, .19, .5, 18, 1, false, 0, Math.PI), 0, .415, 0, 0, 0, Math.PI / 2);
      for (const x of [-.17, .17]) { kb.box(M.trim, .035, .245, .392, x, .295, 0); kb.put(M.trim, new T.TorusGeometry(.193, .014, 6, 18, Math.PI), x, .415, 0, 0, Math.PI / 2, 0); }
      kb.box(gold, .07, .08, .025, 0, .39, .196); kb.box(gold, .5, .02, .392, 0, .41, 0);
    } else if (sterne) {
      const hull = ctx.mat("plastic", {color: "#e6ecf2"}), band = ctx.mat("plastic", {color: "#27354a"});
      kb.box(hull, .52, .3, .4, 0, .31, 0); for (const y of [.22, .4]) kb.box(band, .525, .035, .405, 0, y, 0);
      for (const x of [-.25, .25]) for (const y of [.17, .45]) for (const z of [-.19, .19]) kb.box(ctx.mat("steel"), .05, .05, .05, x, y, z);
      kb.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.8}), .22, .025, .006, 0, .31, .203);
      kb.box(ctx.mat("plastic", {color: "#FFE81F"}), .09, .06, .006, -.16, .31, .203);
    } else {
      const pts = []; for (let i = 0; i <= 10; i++) pts.push(new T.Vector2(.14 + .036 * Math.sin(Math.PI * i / 10), .44 * i / 10));
      kb.put(ctx.mat("wood"), new T.LatheGeometry(pts, 22), 0, .16, 0);
      kb.cyl(ctx.mat("darkwood"), .142, .142, .012, 22, 0, .6, 0);
      for (const [y, r] of [[.05, .155], [.13, .171], [.31, .171], [.39, .155]]) kb.put(ctx.mat("metal"), new T.TorusGeometry(r + .003, .009, 6, 26), 0, .16 + y, 0, Math.PI / 2, 0, 0);
    }
    kb.build(cart); }

  /* Kraftpfeile, Parallelogramm, Beschriftungen */
  const mkArrow = (col, thick) => { const a = ctx.arrow([0, 0, 0], [0, .1, 0], col, thick); g.add(a); return onTop(a, 20); };
  const aG = mkArrow(COL.G, .028), aH = mkArrow(COL.H, .028), aN = mkArrow(COL.N, .028), aS = mkArrow(COL.S, .02);
  const dot = new T.Mesh(new T.SphereGeometry(.035, 14, 10), basic(T, "#ffffff")); onTop(dot, 21); g.add(dot);
  const ND = 13, dash = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), basic(T, "#f4f1e6", {transparent: true, opacity: .9, depthTest: false, depthWrite: false}), ND * 2);
  dash.renderOrder = 19; dash.frustumCulled = false; g.add(dash);
  const o3 = new T.Object3D();
  function dashLine(i0, a, b2, on){
    const d = b2.clone().sub(a), Ld = d.length(), ang = Math.atan2(d.y, d.x);
    for (let k = 0; k < ND; k++) { if (!on || Ld < .03) o3.scale.set(1e-4, 1e-4, 1e-4); else { o3.position.copy(a).addScaledVector(d, (k + .5) / ND); o3.rotation.set(0, 0, ang); o3.scale.set(Ld / ND * .55, .012, .012); }
      o3.updateMatrix(); dash.setMatrixAt(i0 + k, o3.matrix); }
  }
  // Schilder in eigener Gruppe: Das renderOrder einer Gruppe wirkt als groupOrder für alle Kinder und wird vor renderOrder sortiert –
  // die Pfeilgruppen (20) würden sonst über die Schilder in g (groupOrder 0) gezeichnet.
  const lbl = new T.Group(); lbl.renderOrder = 30; g.add(lbl);
  const tG = tag(ctx, .15, true), tH = tag(ctx, .15, true), tN = tag(ctx, .15, true), tS = tag(ctx, .14, true); lbl.add(tG, tH, tN, tS);
  // Maßlinie für die Höhe h
  const dimM = basic(T, L.fg);
  const hBar = new T.Mesh(new T.BoxGeometry(.014, 1, .014), dimM), hTop = new T.Mesh(new T.BoxGeometry(.14, .014, .014), dimM), hBot = new T.Mesh(new T.BoxGeometry(.14, .014, .014), dimM);
  const base = new T.Mesh(new T.BoxGeometry(1, .01, .01).translate(.5, 0, 0), dimM); g.add(hBar, hTop, hBot, base);
  const tHd = tag(ctx, .14, false); lbl.add(tHd);
  // Seitenansicht (Blick entlang x): Schilder in z auffächern, sonst liegen sie hintereinander. fk = 0 von vorn/hinten, 1 von der Seite.
  // F_N steht dann ohne den seitlichen Hub an seinem Pfeil (weit unter F_H), das h-Schild rückt nach außen;
  // von der −x-Seite steht es am fernen Ende zwischen F_H und F_N und wird ausgeblendet (h steht auch auf der Messtafel).
  const FZ = [[tG, -.46], [tS, -.46], [tH, .46], [tN, .46]]; let fk = 0, fs = 0, nY = 0, nLift = 0, hdZ = 0;
  const fan = () => { for (const [t, z] of FZ) t.position.z = z * fk; tN.position.y = nY + nLift * (1 - fk); tHd.position.z = hdZ + .5 * fk;
    tHd.material.opacity = 1 - fk * fs; tHd.visible = tHd.material.opacity > .02; };
  const setLabels = () => { const s = ST[si];
    tG.set("F_{G} = 600 N", COL.G); tH.set(`F_{H} = ${s.fh} N`, COL.H); tN.set(`F_{N} ${s.fnS.startsWith("≈") ? s.fnS : "= " + s.fnS}`, COL.N);
    tS.set(`Haltekraft ${s.fh} N`, COL.S); tHd.set(`h = ${s.hs}`, L.fg); };
  setLabels();
  function pose(a){
    const c = Math.cos(a), s = Math.sin(a), P = (lx, ly) => V(XH + lx * c - ly * s, Y0 + lx * s + ly * c);
    rampG.rotation.z = a; cross.position.y = Y0 + XS * Math.tan(a) - .028;
    const com = P(SC, HC), fh = 600 * s, fn = 600 * c;
    const vG = V(0, -600 * KF), vH = V(-c, -s).multiplyScalar(fh * KF), vN = V(s, -c).multiplyScalar(fn * KF);
    const tg = com.clone().add(vG), thh = com.clone().add(vH), tn = com.clone().add(vN);
    aG.set(com, tg); aH.set(com, thh);
    if (a < .004) { const o = V(.07, 0); aN.set(com.clone().add(o), tn.clone().add(o)); } else aN.set(com, tn);   // waagrecht: F_N = F_G, daneben gezeichnet
    const att = P(SC + .4 * CS, RH), vS = V(c, s).multiplyScalar(fh * KF); aS.set(att, att.clone().add(vS));
    const on = fh * KF > .03; dashLine(0, thh, tg, on); dashLine(ND, tn, tg, on); dash.instanceMatrix.needsUpdate = true;
    dot.position.copy(com);
    tG.position.copy(com).addScaledVector(vG, .5).add(V(-.54, 0, 0));
    tN.position.copy(com).addScaledVector(vN, .5).add(V(c * .54, 0)); nY = tN.position.y; nLift = s * .54;
    tH.position.copy(com).addScaledVector(vH, .5).add(V(-s * .21, c * .21)); tH.visible = aH.visible;   // Mitte von F_H, senkrecht zur Ebene versetzt
    tS.position.copy(att).addScaledVector(vS, .5).add(V(c * .3 - s * .2, s * .3 + c * .2)); tS.visible = aS.visible;
    // Seil und Kraftmesser
    const pull = .05 + fh / 300 * .13, hookX = 2.42 - pull; rodG.position.set(hookX, RH, 0);
    rope.position.set(SC + .41 * CS, RH, 0); rope.scale.x = Math.max(.01, hookX - .03 - (SC + .41 * CS));
    // Maßlinie
    const ex = XH + LEN * c, eh = LEN * s, zd = .47;
    hBar.visible = hTop.visible = eh > .03; hBar.position.set(ex, Y0 + eh / 2, zd); hBar.scale.y = Math.max(.01, eh);
    hTop.position.set(ex, Y0 + eh, zd); hBot.position.set(ex, Y0 + .007, zd);
    base.position.set(XH, Y0 + .007, zd); base.scale.x = ex - XH;
    tHd.position.set(ex + .4, Y0 + Math.max(.14, eh / 2), zd); hdZ = zd;
    fan();
  }
  pose(th);

  /* Messtafel: alle Neigungen, aktuelle Zeile hervorgehoben */
  const disp = screen(ctx, 1.9, 1.0, 1024, (q, w, h, cur) => {
    panel(q, w, h, L); q.textBaseline = "middle";
    q.fillStyle = L.acc; rtFit(q, "Schiefe Ebene: l = 3,0 m · F_{G} = 600 N", w / 2, 72, 46, L.ff, w - 80, "center", 700);
    const cols = [175, 400, 640, 860], head = ["Höhe h", "h : l", "F_{H}", "F_{N}"], hc = [L.fg, L.fg, COL.H, COL.N];
    q.fillStyle = L.grid; q.fillRect(60, 178, w - 120, 3);
    head.forEach((s, i) => { q.fillStyle = hc[i]; rt(q, s, cols[i], 145, 38, L.bf, "center", 700); });
    ST.forEach((s, k) => { const y = 228 + k * 66;
      if (k === cur) { q.fillStyle = L.hi; q.beginPath(); q.roundRect(54, y - 30, w - 108, 60, 14); q.fill(); q.strokeStyle = L.acc; q.lineWidth = 3; q.stroke(); }
      [s.hs, s.r, s.fh + " N", s.fnS].forEach((v, i) => { q.fillStyle = k === cur ? (i >= 2 ? hc[i] : L.fg) : L.dim; rt(q, v, cols[i], y + 2, k === cur ? 38 : 34, L.bf, "center", k === cur ? 700 : 500); }); });
    q.fillStyle = L.fg; rtFit(q, "Je steiler, desto größer F_{H} und desto kleiner F_{N}.", w / 2, h - 52, 34, L.bf, w - 120, "center", 600);
  }, .06);
  disp.position.set(DX, DY, DZ + .03); g.add(disp); disp.redraw(si);

  /* Schild über dem Mittelstück */
  { const H = ctx.height || 7, y = Math.min(4.6, H - 2.1), sg = new T.Group(); ctx.add(sg, S.center.x, 0, S.center.z);
    for (const s of [1, -1]) { const bd = ctx.board("Kräfte an der schiefen Ebene", ["Zerlegung der Gewichtskraft"], {w: 3.0, h: .82, small: true}); bd.position.set(0, y, s * .03); if (s < 0) bd.rotation.y = Math.PI; sg.add(bd); }
    const hb = bucket(T); for (const x of [-1.3, 1.3]) hb.cyl(ctx.mat("metal"), .012, .012, H - y - .4, 8, x, y + .4 + (H - y - .4) / 2, 0); hb.box(M.trim, 3.1, .05, .08, 0, y + .43, 0); hb.build(sg, false); }

  ctx.obstacleBox(S.center.x, S.center.z, 4.0, 1.5);
  ctx.exhibit(g, {label: "Schiefe Ebene", dist: 2.6,
    get sub(){ const nx = ST[(si + 1) % ST.length]; return nx.h ? `anklicken: Höhe h = ${nx.hs}` : "anklicken: waagrecht stellen"; },   // nächster Klick
    onClick: () => { si = (si + 1) % ST.length; thT = Math.asin(ST[si].h / LEN); setLabels(); disp.redraw(si); },
    // fester Titel (Baustellen „Zum Exponat“ suchen nach dem Titel), der Zustand steht in der Kopfzeile
    title: "Schiefe Ebene: Hangabtriebskraft und Normalkraft",
    get eyebrow(){ return si === 0 ? "Exponat · waagrecht gestellt" : `Exponat · h : l = ${ST[si].r}`; },
    get text(){ const s = ST[si];
      const intro = "Die Gewichtskraft **F_{G} = 600 N** wird mit dem **Kräfteparallelogramm** in die **Hangabtriebskraft F_{H}** (parallel zur Ebene, hangabwärts) und die **Normalkraft F_{N}** (senkrecht zur Ebene) zerlegt.";
      const now = si === 0
        ? "Die Ebene ist jetzt **waagrecht**: F_{H} = 0 N und F_{N} = F_{G} = 600 N. Der Wagen bleibt auch ohne Seil stehen."
        : `Bei h = ${s.hs} und l = 3,0 m ist h : l = ${s.r}. Aus F_{H} : F_{G} = h : l folgt **F_{H} = 600 N : ${s.r.slice(-1)} = ${s.fh} N**, die Normalkraft ist F_{N} ${s.fnS}. Das Seil hält den Wagen mit ${s.fh} N hangaufwärts – Kräftegleichgewicht.`;
      return `${intro}\n\n${now}`; }});
  const cam = R3D.camera;
  ctx.tick(dt => { if (Math.abs(thT - th) > 1e-4) { th += (thT - th) * Math.min(1, dt * 2.6); if (Math.abs(thT - th) < 1e-4) th = thT; pose(th); }
    if (cam) { const dx = cam.position.x - S.center.x, dz = cam.position.z - S.center.z, k = sm((Math.atan2(Math.abs(dx), Math.abs(dz)) - .6) / .55);
      const side = dx < 0 ? 1 : 0; if (Math.abs(k - fk) > .002 || side !== fs) { fk = k; fs = side; fan(); } } });
  return g;
}

/* =====================================================================
   A: Schraubenfedern und hookesches Gesetz
   ===================================================================== */
function springsA(ctx, L){
  const T = ctx.T, W = ctx.world, S = ctx.slots, sterne = W === "sterne";
  const g = new T.Group(); ctx.add(g, S.A.x - .15, 0, S.A.z); g.rotation.y = Math.PI / 2;   // Vorderseite zeigt zum Gang (+x)
  const mBase = ctx.mat(sterne ? "metal" : W === "zauber" ? "stone" : "darkwood"), mFrame = ctx.mat(sterne ? "steel" : "darkwood"), mTrim = ctx.mat(sterne ? "steel" : "brass");
  const mSpring = ctx.mat(W === "zauber" ? "copper" : "steel"), TOP = 2.4, Y_TOP = 2.32, L0 = .3;
  const b = bucket(T);
  b.box(mBase, 2.9, .145, 1.0, 0, .0725, 0); b.box(mTrim, 2.94, .012, 1.04, 0, .133, 0);   // Messing nur als schmale Kante knapp unter der Oberkante
  if (sterne) b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4}), 2.92, .012, .012, 0, .03, .506);
  for (const x of [-1.45, .2]) { b.box(mFrame, .1, TOP - .145, .1, x, .145 + (TOP - .145) / 2, 0); b.box(mTrim, .3, .04, .3, x, .165, 0); }
  b.box(mFrame, 1.77, .1, .12, -.625, TOP + .05, 0);
  b.box(mFrame, .06, .42, .06, -1.3, TOP - .15, 0, 0, 0, -Math.PI / 4); b.box(mFrame, .06, .42, .06, .05, TOP - .15, 0, 0, 0, Math.PI / 4);
  const SX = [-1.0, -.35];
  for (const x of SX) { b.cyl(mTrim, .008, .008, .07, 8, x, TOP - .035, 0); b.put(mTrim, new T.TorusGeometry(.014, .004, 6, 12), x, Y_TOP + .012, 0);
    b.box(sterne ? ctx.mat("metal") : ctx.mat("darkwood"), .1, .47, .015, x + .14, 1.8, -.014); b.box(mTrim, .015, .32, .015, x + .14, 2.19, -.014); }
  // Diagrammtafel auf Ständer
  b.box(mFrame, .07, 1.0, .07, .9, .12 + .5, -.05); b.box(mTrim, 1.06, .96, .035, .9, 1.5, -.02);
  // Schilder der beiden Federn: stehen auf dem Querbalken über ihrer Feder
  const PM = plateMats(ctx), labels = []; let lbQ = null; SX.forEach((x, k) => {
    const lo = {size: .05, color: k ? COL.hard : COL.soft, font: W === "zauber" ? ctx.kit.fontBody : undefined};
    const lb = ctx.text(`${k ? "harte" : "weiche"} Feder\nD = ${k ? "1,0 N/cm" : "?"}`, lo);   // D der weichen Feder bestimmen die Lernenden im Labor
    const w = lb.userData.w, h = lb.userData.h, y = TOP + .1 + .018 + h / 2 + .006;
    plateBehind(b, PM, w, h, x + .05, y, .012); b.box(PM.frame, w + .06, .018, .1, x + .05, TOP + .109, 0);   // Schild mit Fußleiste
    lb.position.set(x + .05, y, .014); g.add(lb); labels.push(lb);
    if (!k) { lbQ = ctx.text("weiche Feder\nD = ?", lo); lbQ.position.copy(lb.position); lbQ.visible = false; g.add(lbQ); } });   // im Labor: Federhärte gesucht
  b.build(g);

  const wTex = R3D.util.canvasTex(256, 64, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h);
      if (sterne) { gr.addColorStop(0, "#dfe6ee"); gr.addColorStop(1, "#9aa6b4"); } else if (W === "detektiv") { gr.addColorStop(0, "#4a4440"); gr.addColorStop(1, "#24201d"); } else { gr.addColorStop(0, "#e2b552"); gr.addColorStop(1, "#8a6420"); }
      q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = sterne ? "#10202f" : W === "detektiv" ? "#e9c98a" : "#2b1a10";
      q.font = "700 38px Georgia, serif"; q.textAlign = "center"; q.textBaseline = "middle"; for (const x of [.25, .75]) q.fillText("5 N", w * x, h / 2 + 2); }, "k2-gew-" + W);
  const wMat = new T.MeshStandardMaterial({map: wTex, metalness: sterne ? .5 : .7, roughness: .38}), wGeo = new T.CylinderGeometry(.062, .062, .05, 24);
  // Gestell mit weiteren Wägestücken und Formel am Querbalken
  { const rk = bucket(T); rk.box(ctx.mat(sterne ? "metal" : "darkwood"), .6, .05, .18, -.67, .17, .28); rk.box(mTrim, .62, .012, .2, -.67, .2, .28);
    for (let i = 0; i < 3; i++) { const x = -.87 + i * .2; rk.cyl(mTrim, .008, .008, .16, 8, x, .27, .28); for (let j = 0; j < 2 - (i === 2 ? 1 : 0); j++) rk.put(wMat, new T.CylinderGeometry(.062, .062, .05, 24), x, .231 + j * .052, .28); }
    rk.build(g); }
  { const fm = txt(ctx, "F = D · s", {size: .072, color: L.acc, font: formFont(ctx)}); fm.position.set(-.625, TOP + .05, .062); g.add(fm); }
  const springs = SX.map((x, k) => {
    const D = k ? 1 : .5, col = k ? COL.hard : COL.soft;
    const sp = ctx.mesh(helixGeo(T, .045, L0, k ? 11 : 17, k ? .0075 : .0045), mSpring); sp.position.set(x, Y_TOP, 0); g.add(sp);
    const hg = new T.Group(); hg.position.set(x, Y_TOP - L0, 0); g.add(hg);
    const hb = bucket(T); hb.put(mTrim, new T.TorusGeometry(.014, .004, 6, 12), 0, -.012, 0); hb.cyl(ctx.mat("steel"), .005, .005, .2, 8, 0, -.11, 0); hb.cyl(mTrim, .07, .07, .014, 24, 0, -.215, 0); hb.build(hg, false);
    const ptr = new T.Mesh(new T.BoxGeometry(.13, .007, .007), basic(T, "#e23b2b")); ptr.position.set(.075, -.02, .005); hg.add(ptr);
    const ws = [0, 1, 2].map(i => { const m = ctx.mesh(wGeo, wMat); m.position.y = -.208 + .025 + i * .052; m.visible = false; hg.add(m); return m; });
    // Maßstab (0 cm = Zeigerstand ohne Last)
    const ruler = screen(ctx, .07, .43, 512, (q, w, h) => { q.fillStyle = "#f4efe2"; q.fillRect(0, 0, w, h); const top = h * .015 / .43, pc = (h - 2 * top) / 40;
      q.fillStyle = "#1b1b1b"; q.textBaseline = "middle"; q.textAlign = "right"; q.font = `700 ${Math.round(w * .3)}px Helvetica, Arial, sans-serif`;
      for (let i = 0; i <= 40; i++) { const y = top + i * pc, big = i % 5 === 0; q.fillRect(0, y - (big ? 1.5 : .8), big ? w * .42 : w * .24, big ? 3 : 1.6); if (big && i) q.fillText(String(i), w - 6, y); }
      q.fillStyle = "#b3261e"; q.fillText("cm", w - 6, top + 2.5 * pc); });
    ruler.position.set(x + .14, Y_TOP - L0 - .02 - .2, 0); g.add(ruler);
    const rd = screen(ctx, .3, .085, 256, (q, w, h, n, sv) => { q.clearRect(0, 0, w, h); q.fillStyle = "rgba(10,10,14,.78)"; q.beginPath(); q.roundRect(2, 2, w - 4, h - 4, h / 2.4); q.fill();
      q.fillStyle = col; q.textBaseline = "middle"; rtFit(q, `s = ${sv != null ? String(+sv.toFixed(1)).replace(".", ",") : n * (k ? 5 : 10)} cm`, w / 2, h / 2 + 1, h * .6, L.bf, w - 20, "center", 700); });
    rd.material.transparent = true; rd.position.set(.37, -.03, .01); hg.add(rd); rd.redraw(0);
    return {D, sp, hg, ws, rd, ext: 0, from: 0, to: 0, t0: -99};
  });
  // Labor: Wägestücke zu je 1 N (bis 15 Stück) an der weichen Feder – ein InstancedMesh, hell/dunkel abwechselnd zum Abzählen
  const NDISC = 15, discs = new T.InstancedMesh(new T.CylinderGeometry(.056, .056, .0112, 20), ctx.mat(sterne ? "steel" : W === "detektiv" ? "metal" : "brass"), NDISC);
  { const o = new T.Object3D(), cA = new T.Color(0xffffff), cB = new T.Color(0x8a8a8a);
    for (let i = 0; i < NDISC; i++) { o.position.set(0, -.208 + .0062 + i * .0124, 0); o.updateMatrix(); discs.setMatrixAt(i, o.matrix); discs.setColorAt(i, i % 2 ? cB : cA); } }
  discs.count = 0; discs.visible = false; discs.castShadow = true; discs.frustumCulled = false; springs[0].hg.add(discs);
  const dia = screen(ctx, 1.0, .9, 768, (q, w, h, n, lab) => {
    panel(q, w, h, L); q.textBaseline = "middle";
    q.fillStyle = L.acc; rt(q, lab ? "Labor: weiche Feder" : "F-s-Diagramm", 40, 54, lab ? 36 : 40, L.tf, "left", 700); q.fillStyle = L.fg; rt(q, `F = ${lab ? lab.F : 5 * n} N`, w - 44, 54, 36, L.bf, "right", 700);
    const x0 = 112, x1 = w - 70, y0 = 172, y1 = h - 104, sMax = 35, fMax = 17.5, X = s => x0 + s / sMax * (x1 - x0), Y = F => y1 - F / fMax * (y1 - y0);
    q.strokeStyle = L.grid; q.lineWidth = 2;
    for (let s = 5; s <= sMax; s += 5) { q.beginPath(); q.moveTo(X(s), y0); q.lineTo(X(s), y1); q.stroke(); }
    for (let F = 2.5; F <= fMax; F += 2.5) { q.beginPath(); q.moveTo(x0, Y(F)); q.lineTo(x1, Y(F)); q.stroke(); }
    cArrow(q, x0 - 6, y1, x1 + 34, y1, 4, L.fg); cArrow(q, x0, y1 + 6, x0, y0 - 34, 4, L.fg);
    q.fillStyle = L.fg; for (const s of [0, 10, 20, 30]) rt(q, String(s), X(s), y1 + 26, 26, L.bf, "center", 600);
    for (const F of [5, 10, 15]) rt(q, String(F), x0 - 14, Y(F), 26, L.bf, "right", 600);
    rt(q, "s in cm", x1 + 30, y1 + 60, 27, L.bf, "right", 700); rt(q, "F in N", x0 + 16, y0 - 26, 27, L.bf, "left", 700);
    if (lab) {   // Labor: nur der aktuelle Messwert mit Ablesehilfen – eintragen müssen die Lernenden selbst
      const X1 = X(lab.s), Y1 = Y(lab.F); q.fillStyle = COL.soft; q.fillRect(x0 + 10, 97, 34, 6); rt(q, `s = ${String(lab.s).replace(".", ",")} cm`, x0 + 54, 100, 26, L.bf, "left", 700);
      q.fillStyle = L.dim; rtFit(q, "Punkte im Laborblatt eintragen", x0 + 300, 100, 24, L.bf, x1 - x0 - 300, "left", 600);
      if (lab.F > 0) { q.setLineDash([9, 9]); q.strokeStyle = COL.soft; q.globalAlpha = .7; q.lineWidth = 3; q.beginPath(); q.moveTo(X1, y1); q.lineTo(X1, Y1); q.lineTo(x0, Y1); q.stroke(); q.setLineDash([]); q.globalAlpha = 1; }
      q.fillStyle = COL.soft; q.beginPath(); q.arc(X1, Y1, 13, 0, TAU); q.fill(); q.strokeStyle = L.bg; q.lineWidth = 3; q.stroke(); return; }
    for (const [D, col, nm] of [[.5, COL.soft, "weich"], [1, COL.hard, "hart"]]) {
      if (n) { q.setLineDash([10, 10]); q.strokeStyle = col; q.globalAlpha = .45; q.lineWidth = 3; q.beginPath(); q.moveTo(X(0), Y(0)); q.lineTo(X(Math.min(sMax, fMax / D)), Y(Math.min(fMax, sMax * D))); q.stroke(); q.setLineDash([]); q.globalAlpha = 1;
        q.lineWidth = 6; q.beginPath(); q.moveTo(X(0), Y(0)); q.lineTo(X(5 * n / D), Y(5 * n)); q.stroke(); }
      for (let i = 1; i <= n; i++) { q.fillStyle = col; q.beginPath(); q.arc(X(5 * i / D), Y(5 * i), i === n ? 13 : 10, 0, TAU); q.fill(); q.strokeStyle = L.bg; q.lineWidth = 3; q.stroke(); }
      const lx = D < 1 ? x0 + 10 : x0 + 300; q.fillStyle = col; q.fillRect(lx, 97, 34, 6); q.fillStyle = n ? col : L.dim; rt(q, `${nm}: D = ${D < 1 ? "?" : "1,0 N/cm"}`, lx + 44, 100, 25, L.bf, "left", 700);
    }
    if (!n) { q.fillStyle = L.dim; rtFit(q, "Klicke: Wägestück mit 5 N anhängen", (x0 + x1) / 2, (y0 + y1) / 2, 30, L.bf, x1 - x0 - 30, "center", 600); }
  });
  dia.position.set(.9, 1.5, .002); g.add(dia); dia.redraw(0);

  let n = 0, t0 = -99, emptied = false, tNow = 0, labF = null;   // labF: Kraft im Labor (null = Labor zu)
  ctx.tick((dt, t) => { tNow = t; const tau = t - t0;
    for (const s of springs) { const ts = t - s.t0;
      s.ext = s.to + (s.from - s.to) * Math.exp(-4.2 * ts) * Math.cos(11 * ts);
      s.sp.scale.y = (L0 + s.ext) / L0; s.hg.position.y = Y_TOP - L0 - s.ext;
      s.ws.forEach((m, i) => { const base = -.208 + .025 + i * .052;
        if (labF != null) m.visible = false;
        else if (i < n) { const fall = i === n - 1 ? 1 - sm(tau / .3) : 0; m.visible = true; m.scale.setScalar(1); m.position.y = base + .32 * fall * fall; }
        else if (emptied && tau < .35) { m.visible = true; m.position.y = base + .4 * sm(tau / .35); m.scale.setScalar(Math.max(.01, 1 - tau / .35)); }
        else m.visible = false; });
    } });
  ctx.obstacleBox(S.A.x - .15, S.A.z, 1.05, 2.95);
  ctx.exhibit(g, {label: "Federn und Wägestücke", sub: "anklicken: Wägestück anhängen", dist: 2.2,
    onClick: () => { if (labF != null) return;   // während des Labors steuern die Regler die Feder
      emptied = n === 3; n = (n + 1) % 4; t0 = tNow;
      for (const s of springs) { s.from = s.ext; s.to = 5 * n / s.D / 100; s.t0 = tNow; s.rd.redraw(n); } dia.redraw(n); },
    title: "Hookesches Gesetz: F = D · s",   // fester Titel (Baustellen), der Zustand steht in der Kopfzeile
    get eyebrow(){ return emptied && n === 0 ? "Exponat · elastisch verformt: die Federn kehren zurück" : n ? `Exponat · F = ${5 * n} N an jeder Feder` : "Exponat"; },
    get text(){
      if (n === 0) return emptied
        ? "Alle Wägestücke sind abgenommen: Beide Federn ziehen sich wieder auf ihre **Ausgangslänge** zusammen. Sie wurden **elastisch** verformt.\n\nDas gilt nur, solange die Feder nicht überdehnt wird – oberhalb der **Elastizitätsgrenze** bliebe sie länger als vorher."
        : "Zwei Schraubenfedern ohne Last. Die harte Feder hat die Federhärte **D = 1,0 N/cm**. Die Federhärte der weichen Feder bestimmst du selbst im Labor. Klicke, um an jede Feder ein Wägestück mit **5 N** anzuhängen.";
      const F = 5 * n;
      return `Kraft **F = ${F} N**: Die weiche Feder verlängert sich um **s = ${2 * F} cm**, die harte nur um **s = ${F} cm**. ${n === 2 ? "Doppelte Kraft wie bei 5 N – doppelte Verlängerung: " : n === 3 ? "Dreifache Kraft – dreifache Verlängerung: " : ""}Die Verlängerung ist **proportional** zur Kraft, es gilt **F = D · s**.\n\nIm F-s-Diagramm liegen die Messpunkte auf Ursprungsgeraden. Die harte Feder hat die **steilere** Gerade: D = F : s = ${F} N : ${F} cm = 1,0 N/cm. Die Gerade der weichen Feder ist flacher, ihre Federhärte also kleiner – wie groß sie ist, bestimmst du im Labor.`; }});
  // Labor: Wägestücke zu je 1 N an die weiche Feder hängen, Verlängerung am Maßstab ablesen, F-s-Diagramm → Federhärte
  const [soft, hard] = springs, DS = soft.D;   // D in N/cm
  ctx.lab(g, {
    id: "feder", titel: "Wie hart ist die weiche Feder?",
    text: "Hänge an die **weiche Feder** Wägestücke mit je **1 N** und lies am Maßstab die Verlängerung s ab. Nimm mindestens fünf Messwerte auf, trage sie selbst ins **F-s-Diagramm** ein (s nach rechts, F nach oben) und bestimme daraus die Federhärte D.",
    regler: [{id: "F", name: "Gewichtskraft der Wägestücke F", einheit: "N", min: 0, max: 15, schritt: 1, wert: 0}],
    messe: v => ({s: v.F / DS}),   // hookesches Gesetz: s = F : D (in cm)
    anzeige: [{id: "s", name: "Verlängerung s (Maßstab)", einheit: "cm", stellen: 1}],
    achsen: {x: {id: "s", name: "s in cm", max: 32, teil: 4}, y: {id: "F", name: "F in N", max: 16, teil: 2}},
    punkte: 5, gerade: "ursprung",
    aufgabe: {frage: "Bestimme aus der Steigung deiner Geraden die Federhärte D der weichen Feder in **N/m**.", wert: 50, toleranz: 3, einheit: "N/m",
      tipps: ["Die Steigung der Ursprungsgeraden im F-s-Diagramm ist D = F : s. Wähle einen gut ablesbaren Punkt weit oben auf deiner Geraden.",
              "Zum Beispiel: Bei s = 30 cm liest du F = 15 N ab. Gefragt ist N/m – rechne die Verlängerung in Meter um: 30 cm = 0,30 m.",
              "D = F : s = 15 N : 0,30 m = … N/m"],
      loesung: "D = F : s = 15 N : 30 cm = 0,5 N/cm. Mit 30 cm = 0,30 m: D = 15 N : 0,30 m = **50 N/m** – für jeden Punkt der Geraden derselbe Wert."},
    merke: "Die Messpunkte liegen auf einer **Ursprungsgeraden**: Die Kraft F ist **proportional** zur Verlängerung s – das **hookesche Gesetz F = D · s**. Die Steigung der Geraden ist die **Federhärte D = 0,5 N/cm = 50 N/m**. Eine härtere Feder hätte eine steilere Gerade.",
    live: (v, m) => {
      if (!v) { if (labF == null) return; labF = null; discs.count = 0; discs.visible = false; labels[0].visible = true; lbQ.visible = false;   // Labor zu: Zustand des Exponats wiederherstellen
        for (const s of springs) { s.from = s.ext; s.to = 5 * n / s.D / 100; s.t0 = tNow; s.rd.redraw(n); } t0 = tNow - 1; dia.redraw(n); return; }
      if (labF == null) { labels[0].visible = false; lbQ.visible = true; hard.from = hard.ext; hard.to = 0; hard.t0 = tNow; hard.rd.redraw(0); }   // harte Feder entlasten
      if (v.F !== labF) { soft.from = soft.ext; soft.to = v.F / DS / 100; soft.t0 = tNow; labF = v.F; discs.count = Math.round(v.F); discs.visible = v.F > 0; }
      soft.rd.redraw(0, m.s); dia.redraw(0, {F: v.F, s: m.s});
    }
  });
  return g;
}

/* =====================================================================
   B: Tischtuchtrick und Münze auf der Karte
   ===================================================================== */
function clothTex(T, W){
  const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
  if (W === "zauber") { g.fillStyle = "#6e1420"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#d9a83a"; g.lineWidth = 8; g.strokeRect(22, 22, 468, 468); g.lineWidth = 3; g.strokeRect(40, 40, 432, 432);
    g.fillStyle = "rgba(227,179,65,.55)"; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const x = 86 + i * 68, y = 86 + j * 68; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 5 : 12, a = k * Math.PI / 5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } }
  else if (W === "sterne") { g.fillStyle = "#c3cfdb"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(40,120,170,.45)"; g.lineWidth = 2; for (let i = 0; i <= 512; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
    g.strokeStyle = "#2a5d86"; g.lineWidth = 12; g.strokeRect(10, 10, 492, 492); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, 200, 512, 60); }
  else { g.fillStyle = "#efe8d8"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(150,40,30,.6)"; g.lineWidth = 6; g.strokeRect(30, 30, 452, 452);
    g.fillStyle = "rgba(200,185,160,.35)"; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc(64 + i * 55, 64 + j * 55, 14, 0, TAU); g.fill(); }
    g.fillStyle = "#fbf6ea"; for (let i = 0; i < 32; i++) for (const [x, y] of [[i * 16 + 8, 6], [i * 16 + 8, 506], [6, i * 16 + 8], [506, i * 16 + 8]]) { g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); } }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function tableB(ctx, L){
  const T = ctx.T, W = ctx.world, S = ctx.slots, sterne = W === "sterne", det = W === "detektiv", zau = W === "zauber";
  const g = new T.Group(); ctx.add(g, S.B.x + .1, 0, S.B.z); g.rotation.y = -Math.PI / 2;   // lokal +x zeigt zur Rückwand
  const TX = .25, TY = .86, b = bucket(T), mTop = ctx.mat(sterne ? "metal" : det ? "darkwood" : "wood"), mLeg = ctx.mat(sterne ? "steel" : "darkwood"), mTrim = ctx.mat(sterne ? "steel" : "brass");
  b.box(mTop, 1.6, .06, .9, TX, TY - .03, 0); b.box(mLeg, 1.46, .2, .78, TX, TY - .16, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = TX + sx * .7, z = sz * .36;
    if (det) { b.cyl(mLeg, .035, .026, TY - .06, 12, x, (TY - .06) / 2, z); b.sph(mLeg, .045, x, TY * .55, z, 12); b.sph(mTrim, .035, x, .03, z, 10); }
    else if (sterne) { b.box(mLeg, .07, TY - .06, .07, x, (TY - .06) / 2, z); b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.3}), .074, .3, .01, x, TY * .5, z + sz * .036); }
    else { b.box(mLeg, .08, TY - .06, .08, x, (TY - .06) / 2, z); b.box(mTrim, .1, .05, .1, x, .025, z); } }
  // Sockel für Münze und Karte
  const PX = -.95, PY = .96;
  b.cyl(mLeg, .1, .13, PY - .03, 18, PX, (PY - .03) / 2, 0); b.cyl(mTrim, .14, .14, .03, 22, PX, PY - .015, 0); b.cyl(mTrim, .16, .17, .04, 22, PX, .02, 0);
  const labCol = zau ? "#ffe2a0" : sterne ? "#bfefff" : "#f3e6cc";
  const lab = txt(ctx, "Tischtuchtrick", {size: .055, color: labCol}); lab.position.set(TX, TY - .22, .395); g.add(lab);
  // Schild vorn am Sockel (Höhe wie „Tischtuchtrick“)
  const lab2 = ctx.text("Münze und Karte", {size: .052, color: labCol}), LY = TY - .22, LZ = .14;
  plateBehind(b, plateMats(ctx), lab2.userData.w, lab2.userData.h, PX, LY, LZ); b.box(mTrim, .03, .05, .05, PX, LY, .1);   // Halter am Sockel
  lab2.position.set(PX, LY, LZ + .002); g.add(lab2);
  b.build(g);

  // Tuch (eigene Gruppe, wird gezogen)
  const clothM = new T.MeshStandardMaterial({map: clothTex(T, W), roughness: sterne ? .45 : .95, metalness: sterne ? .35 : 0, side: T.DoubleSide});
  const cloth = new T.Group(); cloth.position.set(TX, TY, 0); g.add(cloth);
  { const cb = bucket(T); cb.box(clothM, 1.7, .008, 1.0, 0, .004, 0); for (const z of [-.5, .5]) cb.box(clothM, 1.7, .11, .008, 0, -.051, z); cb.build(cloth, false); }
  // Geschirr (alles in einer Gruppe; steht auf dem Tuch)
  const dishes = new T.Group(); dishes.position.set(TX, TY + .008, 0); g.add(dishes); let flame = null;
  { const d = bucket(T), por = ctx.mat("color", {color: "#f3efe6", rough: .25}), gold = ctx.mat("gold");
    const plate = (x, z, rim) => { d.cyl(por, .12, .095, .014, 26, x, .007, z); d.put(rim, new T.TorusGeometry(.112, .006, 6, 28), x, .015, z, Math.PI / 2, 0, 0); };
    const candle = (x, z) => { d.cyl(mTrim, .055, .065, .02, 18, x, .01, z); d.cyl(mTrim, .012, .016, .16, 10, x, .1, z); d.cyl(mTrim, .035, .03, .012, 14, x, .186, z);
      d.cyl(ctx.mat("color", {color: "#f2ead8", rough: .7}), .014, .014, .12, 10, x, .252, z); flame = ctx.glow(0xffc070, .16); flame.position.set(x, .33, z); dishes.add(flame); };
    if (zau) {
      plate(-.42, .12, gold); plate(.32, .14, gold);
      for (const [x, z] of [[-.2, -.18], [.55, -.14]]) { d.cyl(mTrim, .035, .042, .01, 16, x, .005, z); d.cyl(mTrim, .008, .008, .07, 8, x, .045, z); d.cyl(mTrim, .045, .025, .075, 16, x, .115, z); }
      candle(.08, -.2);
      d.cyl(mTrim, .1, .055, .055, 22, -.05, .028, .16); d.cyl(mTrim, .04, .05, .01, 16, -.05, .003, .16); for (const [x, z] of [[-.09, .15], [-.01, .17], [-.05, .12], [-.05, .2]]) d.sph(ctx.mat("color", {color: "#b3261e", rough: .4}), .036, x, .085, z, 12);
    } else if (sterne) {
      const cup = ctx.mat("plastic", {color: "#f2f6fa"}), gl = ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6});
      for (const [x, z] of [[-.42, .12], [.32, .14]]) { d.box(ctx.mat("steel"), .3, .014, .2, x, .007, z); d.box(ctx.mat("plastic", {color: "#ff9a3c"}), .07, .05, .07, x - .06, .039, z); d.box(ctx.mat("plastic", {color: "#3ddc97"}), .06, .04, .06, x + .07, .034, z + .02); }
      for (const [x, z] of [[-.2, -.18], [.55, -.14]]) { d.cyl(cup, .04, .032, .08, 18, x, .04, z); d.put(gl, new T.TorusGeometry(.04, .005, 6, 20), x, .07, z, Math.PI / 2, 0, 0); }
      d.cyl(ctx.mat("glass", {color: "#bfe8ff", opacity: .35}), .035, .035, .2, 16, .08, .1, -.2); d.cyl(gl, .026, .026, .13, 14, .08, .07, -.2); d.cyl(ctx.mat("steel"), .02, .028, .04, 12, .08, .22, -.2);
    } else {
      const blue = ctx.mat("color", {color: "#2f4f8a", rough: .3});
      plate(-.42, .12, blue); plate(.32, .14, blue);
      for (const [x, z] of [[-.2, -.18], [.55, -.14]]) { d.cyl(por, .055, .045, .008, 20, x, .004, z); d.cyl(por, .035, .027, .055, 18, x, .036, z); d.put(por, new T.TorusGeometry(.017, .004, 6, 12), x + .038, .038, z); }
      d.put(por, new T.SphereGeometry(.07, 18, 12).scale(1, .82, 1), -.02, .06, -.02); d.cyl(por, .012, .022, .1, 10, .055, .08, -.02, 0, 0, -.9);
      d.put(por, new T.TorusGeometry(.04, .008, 6, 14), -.09, .07, -.02); d.sph(blue, .016, -.02, .125, -.02, 10);
      candle(.12, -.25);
    }
    d.build(dishes); }
  // Glas, Karte, Münze
  const glassM = new T.MeshStandardMaterial({color: 0xdff0ff, transparent: true, opacity: .3, roughness: .05, side: T.DoubleSide, depthWrite: false});
  const glass = ctx.mesh(new T.CylinderGeometry(.05, .045, .13, 22, 1, true), glassM, false); glass.position.set(PX, PY + .065, 0); g.add(glass);
  const gBot = ctx.mesh(new T.CylinderGeometry(.045, .045, .01, 22), glassM, false); gBot.position.set(PX, PY + .005, 0); g.add(gBot);
  const card = ctx.mesh(new T.BoxGeometry(.16, .004, .11), ctx.mat(sterne ? "plastic" : "paper", {color: "#ffffff"}), false); g.add(card);
  const coin = ctx.mesh(new T.CylinderGeometry(.026, .026, .006, 22), ctx.mat("gold"), false); g.add(coin);
  const CY = PY + .13 + .002;

  let mode = 0, t0 = -99, tNow = 0, R = 0;
  const st = {cx: 0, cy: 0, cs: 1, dx: 0, dy: 0, kx: 0, ky: 0, kr: 0, mx: 0, my: 0}, from = Object.assign({}, st);
  const apply = () => { cloth.position.set(TX + st.cx, TY + st.cy, 0); cloth.scale.y = st.cs; cloth.rotation.z = st.cy < -.1 ? -.05 : 0;
    dishes.position.set(TX + st.dx, TY + .008 + st.dy, 0);
    card.position.set(PX + st.kx, CY + st.ky, 0); card.rotation.z = st.kr; coin.position.set(PX + st.mx, CY + .005 + st.my, 0); };
  apply();
  ctx.tick((dt, t) => { tNow = t; if (flame) flame.scale.setScalar(.15 + .02 * Math.sin(t * 11));
    if (!mode) return; let tau = t - t0;
    if (tau < R) { const k = sm(tau / R); for (const key in st) st[key] = lerp(from[key], key === "cs" ? 1 : 0, k); apply(); return; }
    tau -= R;
    if (mode === 1) {   // ruckartig
      st.cx = 1.95 * Math.min(1, (tau / .13) ** 2); const f = sm((tau - .13) / .38); st.cy = -(TY - .012) * f; st.cs = 1 - .95 * f;
      const w = Math.exp(-6 * tau) * Math.sin(tau * 40); st.dx = .012 * Math.min(1, tau / .13); st.dy = -.008 * Math.min(1, tau / .13) + .003 * Math.abs(w);
      st.kx = -.7 * Math.min(1, (tau / .07) ** 2); const kf = sm((tau - .07) / .4); st.ky = -(PY + .13 - .005) * kf; st.kr = 1.2 * kf;
      const ft = Math.max(0, tau - .03); st.mx = 0; st.my = -Math.min(.12, .5 * 9.81 * ft * ft);
    } else {            // langsam
      // Karte samt Münze nur so weit, dass ihr Schwerpunkt über dem Glasrand (r = 5 cm) bleibt
      const k = sm(tau / 2.2); st.cx = .35 * k; st.cy = 0; st.cs = 1; st.dx = .35 * k; st.dy = 0; st.kx = -.035 * k; st.ky = 0; st.kr = 0; st.mx = -.035 * k; st.my = 0;
    }
    apply(); });
  ctx.obstacleBox(S.B.x + .1, S.B.z + .05, .95, 2.25);
  ctx.exhibit(g, {label: "Tischtuchtrick", sub: "anklicken: Tuch wegziehen", dist: 2.1,
    onClick: () => { Object.assign(from, st); const moved = Object.keys(st).some(k => Math.abs(st[k] - (k === "cs" ? 1 : 0)) > 1e-3); R = moved ? .5 : 0; mode = mode === 1 ? 2 : 1; t0 = tNow; },
    title: "Der Tischtuchtrick",
    get eyebrow(){ return mode === 2 ? "Exponat · langsam gezogen: das Geschirr rutscht mit" : "Exponat · ruckartig gezogen"; },
    get text(){ return mode === 2
      ? "Jetzt wird das Tuch **langsam** gezogen. Die Reibungskraft wirkt lange genug auf das Geschirr und nimmt es mit – es rutscht zusammen mit dem Tuch. Auch die Münze fährt auf der Karte mit.\n\nKlicke noch einmal: Dann wird wieder **ruckartig** gezogen."
      : "Das Tuch wird **ruckartig** weggezogen. Die Reibungskraft wirkt nur sehr kurz auf das Geschirr, deshalb bleibt seine Geschwindigkeitsänderung winzig: Wegen seiner **Trägheit** bleibt es fast an seinem Platz.\n\nGenauso die Münze: Die Karte schnellt weg, die Münze bleibt in Ruhe und fällt ins Glas. Klicke noch einmal für den Vergleich mit langsamem Ziehen."; }});
  return g;
}

/* =====================================================================
   C: Pressen – elastische und plastische Verformung
   ===================================================================== */
function pressesC(ctx, L){
  const T = ctx.T, W = ctx.world, S = ctx.slots, sterne = W === "sterne", pal = ctx.pal;
  const g = new T.Group(); ctx.add(g, S.C.x + .15, 0, S.C.z); g.rotation.y = -Math.PI / 2;
  const mTop = ctx.mat(sterne ? "metal" : "darkwood"), mLeg = ctx.mat(sterne ? "steel" : "darkwood"), mFrame = ctx.mat(sterne ? "steel" : W === "zauber" ? "darkwood" : "metal"), mTrim = ctx.mat(sterne ? "steel" : "brass");
  const B0 = .96, BT = .9, b = bucket(T);
  b.box(mTop, 2.3, .07, .8, 0, BT - .035, 0); b.box(mTrim, 2.32, .015, .82, 0, BT - .072, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(mLeg, .07, BT - .08, .07, sx * 1.05, (BT - .08) / 2, sz * .33);
  b.box(mTop, 2.1, .03, .66, 0, .18, 0);
  if (sterne) b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4}), 2.3, .012, .012, 0, BT - .02, .405);
  const P = [{x: -.5, top: .3, rest: B0 + .38, min: B0 + .15}, {x: .5, top: .22, rest: B0 + .3, min: B0 + .092}];
  for (const p of P) { const x = p.x;
    b.box(ctx.mat(sterne ? "metal" : "steel"), .42, .06, .34, x, B0 - .03, -.02);
    for (const s of [-1, 1]) { b.cyl(mFrame, .026, .026, .86, 12, x + s * .19, B0 + .43, -.14); b.cyl(mTrim, .04, .04, .03, 12, x + s * .19, B0 + .015, -.14); }
    b.box(mFrame, .5, .1, .3, x, 1.82, -.05);
    if (sterne) { b.box(ctx.mat("plastic", {color: "#dfe6ee"}), .18, .3, .18, x, 2.02, 0); b.box(ctx.mat("glow", {color: "#FFE81F", intensity: 1.4}), .185, .02, .185, x, 2.12, 0); }
    else b.cyl(mTrim, .055, .055, .1, 14, x, 1.92, 0);
  }
  // überdehnte Feder vorne auf der Werkbank (Windungen in der Mitte auseinandergezogen)
  const fx = u => u < .3 ? u * .45 : u < .7 ? .135 + (u - .3) / .4 * .73 : .865 + (u - .7) / .3 * .135;
  b.put(ctx.mat(W === "zauber" ? "copper" : "steel"), helixGeo(T, .028, .36, 10, .004, 1, fx), -.18, BT + .03, .27, 0, 0, -Math.PI / 2);
  // Kärtchen vor der überdehnten Feder: liegt schräg auf der Werkbank, hinten von einem Klötzchen gestützt
  { const CA = .35, cardC = ctx.text("überdehnte Feder", {size: .036, color: sterne ? "#bfefff" : "#3a2614", bg: sterne ? LAB_BG : "#efe4c8"});
    const ch = cardC.userData.h, cz = .385; cardC.geometry.translate(0, ch / 2, 0); cardC.rotation.x = -(Math.PI / 2 - CA); cardC.position.set(0, BT + .001, cz); g.add(cardC);
    const sh = ch * Math.sin(CA) - .006; b.box(mTrim, cardC.userData.w * .7, sh, .012, 0, BT + sh / 2, cz - ch * Math.cos(CA) + .008); }
  b.build(g);
  for (const [p, s, c] of [[P[0], "elastisch", pal.ok], [P[1], "plastisch", "#ff9a52"]]) { const t = txt(ctx, s, {size: sterne ? .062 : .075, color: c}); t.position.set(p.x, 1.82, .106); g.add(t); }

  // Stempel (bewegt), Feder, Knetmasse
  const stamps = P.map(p => { const sg = new T.Group(); sg.position.set(p.x, 0, 0); g.add(sg); const sb = bucket(T);
    sb.cyl(ctx.mat("steel"), .022, .022, .8, 12, 0, .44, 0); sb.cyl(sterne ? ctx.mat("steel") : mTrim, .12, .12, .04, 26, 0, .02, 0);
    if (sterne) sb.put(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.8}), new T.TorusGeometry(.121, .006, 6, 28), 0, .02, 0, Math.PI / 2, 0, 0);
    sb.build(sg);
    let wheel = null;
    if (!sterne) { wheel = new T.Group(); wheel.position.y = .86; sg.add(wheel); const wb = bucket(T); wb.put(mTrim, new T.TorusGeometry(.15, .013, 8, 30), 0, 0, 0, Math.PI / 2, 0, 0);
      for (let i = 0; i < 3; i++) wb.box(mTrim, .3, .016, .016, 0, 0, 0, 0, i * Math.PI / 3, 0); wb.sph(ctx.mat(W === "zauber" ? "crystal" : "brass", {color: "#9a6bff"}), .03, .15, .03, 0, 10); wb.build(wheel); }
    return {sg, wheel, p}; });
  const spr = ctx.mesh(helixGeo(T, .085, .3, 6.5, .011, 1), ctx.mat(W === "zauber" ? "copper" : "steel")); spr.position.set(P[0].x, B0, 0); g.add(spr);
  const cap = ctx.mesh(new T.CylinderGeometry(.095, .095, .016, 24), mTrim); cap.position.set(P[0].x, B0 + .3, 0); g.add(cap);
  const clayM = ctx.mat("color", {color: W === "zauber" ? "#c0503c" : sterne ? "#ff8a3d" : "#b5654a", rough: .85});
  const clay = ctx.mesh(new T.SphereGeometry(.11, 28, 18).translate(0, .11, 0), clayM); clay.position.set(P[1].x, B0, 0); g.add(clay);

  let t0 = -99, tNow = 0, q = 1, qFrom = 1, R = 0, started = false;
  ctx.tick((dt, t) => { tNow = t; let tau = t - t0;
    if (tau < R) { const k = sm(tau / R); q = lerp(qFrom, 1, k); const wob = Math.sin(k * Math.PI * 3) * .06 * (1 - k); clay.scale.set(1 / Math.sqrt(q) + wob, q - wob, 1 / Math.sqrt(q) + wob); tau = -1; }
    else tau -= R;
    const s = !started || tau < 0 ? 0 : tau < .55 ? sm(tau / .55) : tau < .9 ? 1 : tau < 1.45 ? 1 - sm((tau - .9) / .55) : 0;
    stamps.forEach(({sg, wheel, p}) => { const yb = lerp(p.rest, p.min, s); sg.position.y = yb; if (wheel) wheel.rotation.y = s * TAU * 1.5; });
    // Feder: folgt dem Stempel, nach dem Loslassen kurzes Nachschwingen
    const yb0 = lerp(P[0].rest, P[0].min, s), after = tau - 1.45;
    let top = Math.min(B0 + .3, yb0); if (started && after > 0 && after < 2) top = B0 + .3 + .014 * Math.exp(-4 * after) * Math.sin(after * 17);
    spr.scale.y = (top - B0) / .3; cap.position.y = top + .008;
    // Knetmasse: bleibt so platt, wie sie gedrückt wurde
    if (tau >= 0 && started) { const yb1 = lerp(P[1].rest, P[1].min, s), qq = (yb1 - B0) / .22; if (qq < q) q = Math.max(.42, qq); clay.scale.set(1 / Math.sqrt(q), q, 1 / Math.sqrt(q)); }
  });
  ctx.obstacleBox(S.C.x + .15, S.C.z, .85, 2.35);
  ctx.exhibit(g, {label: "Pressen: Feder und Knetmasse", sub: "anklicken: zusammendrücken", dist: 2.1,
    onClick: () => { qFrom = q; R = q < .99 ? .6 : 0; t0 = tNow; started = true; },
    title: "Elastisch oder plastisch?",
    text: "Beide Stempel drücken mit einer Kraft auf ihren Körper und verformen ihn. Die **Feder** nimmt nach dem Entlasten wieder ihre alte Form an: Sie wurde **elastisch** verformt. Die **Knetmasse** bleibt platt: Sie wurde **plastisch** verformt.\n\nAuch eine Feder bleibt verformt, wenn man sie über ihre **Elastizitätsgrenze** hinaus belastet – wie die überdehnte Feder vorne auf der Werkbank. Nur im elastischen Bereich gilt das hookesche Gesetz."});
  return g;
}

/* =====================================================================
   D: Trägheit im Fahrzeug – Vollbremsung (Gurt) und Stoß von hinten (Kopfstütze)
   ===================================================================== */
function vehicleD(ctx, L){
  const T = ctx.T, W = ctx.world, S = ctx.slots, sterne = W === "sterne", det = W === "detektiv", zau = W === "zauber";
  const g = new T.Group(); ctx.add(g, S.D.x - .1, 0, S.D.z); g.rotation.y = Math.PI / 2;   // lokal +x = Fahrtrichtung (zur Vorderwand)
  const TT = .83, RY = .845, b = bucket(T), mTop = ctx.mat(sterne ? "metal" : det ? "darkwood" : "wood"), mLeg = ctx.mat(sterne ? "steel" : "darkwood"), mTrim = ctx.mat(sterne ? "steel" : "brass");
  b.box(mTop, 3.0, .06, .72, 0, TT - .03, 0); b.box(mLeg, 2.86, .1, .7, 0, TT - .11, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.box(mLeg, .08, TT - .06, .08, sx * 1.38, (TT - .06) / 2, sz * .29); if (!sterne) b.box(mTrim, .1, .04, .1, sx * 1.38, .02, sz * .29); }
  b.box(mLeg, 2.7, .03, .5, 0, .16, 0);
  if (sterne) { b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4}), 3.0, .012, .012, 0, TT - .02, .365); }
  // Gleise
  for (const z of [-.13, .13]) b.box(ctx.mat(zau ? "brass" : "steel"), 2.9, .015, .02, 0, TT + .0075, z);
  if (det) for (let i = 0; i < 20; i++) b.box(ctx.mat("darkwood"), .04, .008, .34, -1.42 + i * .149, TT + .004, 0);
  else b.box(ctx.mat(sterne ? "plastic" : "darkwood", {color: "#27354a"}), 2.9, .006, .2, 0, TT + .003, 0);
  // Prellpolster vorne, Stoßgerät hinten
  b.box(ctx.mat("cloth", {color: sterne ? "#2b4a6f" : "#7a2a22"}), .1, .2, .5, 1.41, TT + .1, 0); b.box(mTrim, .03, .22, .52, 1.47, TT + .11, 0);
  b.box(ctx.mat(sterne ? "plastic" : "metal", {color: "#dfe6ee"}), .16, .2, .26, -1.42, TT + .1, 0); b.box(mTrim, .17, .02, .27, -1.42, TT + .2, 0);
  b.build(g);
  const VS = 1.4, R_B = .065, PLAT = .12 * VS, HOME = .2 * VS, FRONT = .32 * VS, STOP = .02 * VS + R_B, WR = .05 * VS, X0 = -.69;
  const ram = new T.Group(); ram.position.set(-1.36, RY + .14, 0); g.add(ram);
  { const rb2 = bucket(T); rb2.box(ctx.mat("steel"), .12, .045, .045, .06, 0, 0); rb2.box(ctx.mat("rubber"), .03, .12, .2, .135, 0, 0); rb2.build(ram, false); }
  const lab = txt(ctx, "Trägheit im Fahrzeug", {size: .055, color: zau ? "#ffe2a0" : sterne ? "#bfefff" : "#f3e6cc"}); lab.position.set(0, TT - .11, .355); g.add(lab);

  // Fahrzeug (lokale Maße × VS)
  const veh = new T.Group(); veh.scale.setScalar(VS); g.add(veh); const vb = bucket(T);
  const bodyM = sterne ? ctx.mat("plastic", {color: "#eef2f6"}) : det ? ctx.mat("color", {color: "#7b2d26", rough: .45}) : ctx.mat("wood");
  vb.box(ctx.mat(sterne ? "metal" : "darkwood"), .64, .03, .34, 0, .105, 0);
  for (const z of [-.17, .17]) { vb.box(bodyM, .3, .14, .02, -.17, .19, z); vb.box(mTrim, .3, .012, .024, -.17, .262, z); vb.box(mTrim, .62, .012, .022, 0, .123, z); }
  vb.box(bodyM, .02, .14, .36, -.33, .19, 0);
  for (const s of [-1, 1]) vb.box(ctx.mat(sterne ? "steel" : "metal"), .03, .04, .36, s * .335, .09, 0);
  const seatM = ctx.mat("cloth", {color: sterne ? "#2b4a6f" : zau ? "#6b1420" : "#2f5d5d"});
  vb.box(seatM, .17, .06, .28, -.16, .17, 0); vb.box(seatM, .035, .3, .28, -.255, .28, 0); vb.box(seatM, .035, .1, .16, -.257, .48, 0);
  vb.box(mTrim, .012, .03, .012, -.257, .425, -.05); vb.box(mTrim, .012, .03, .012, -.257, .425, .05);
  if (sterne) for (const z of [-.182, .182]) vb.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), .3, .012, .006, -.17, .2, z);
  if (det) for (const z of [-.181, .181]) vb.box(ctx.mat("gold"), .26, .008, .004, -.17, .23, z);
  for (const z of [-.12, .12]) vb.box(ctx.mat(sterne ? "glow" : "color", {color: sterne ? "#ff4d4d" : "#e8d9a0", intensity: 1.2}), .012, .03, .05, -.341, .2, z);   // Rücklichter / Laternen
  // Beine der Puppe (fest), Beckengurt
  const dumM = zau ? ctx.mat("wood") : sterne ? ctx.mat("plastic", {color: "#f2c32e"}) : ctx.mat("color", {color: "#d9c7a5", rough: .8});
  const jointM = ctx.mat("color", {color: sterne ? "#1b1d21" : "#3a2b1c", rough: .6});
  for (const z of [-.042, .042]) { vb.box(dumM, .16, .045, .05, -.09, .215, z); vb.box(dumM, .045, .09, .045, .0, .165, z); vb.box(jointM, .06, .025, .05, .02, .13, z); }
  const beltM = ctx.mat("color", {color: "#c0392b", rough: .6});
  vb.box(beltM, .03, .03, .19, -.15, .245, 0); vb.box(mTrim, .03, .04, .03, -.16, .22, .155); vb.box(mTrim, .03, .04, .03, -.16, .22, -.155);
  vb.build(veh);
  const axles = [-.21, .21].map(x => { const a = new T.Group(); a.position.set(x, .05, 0); veh.add(a); const ab = bucket(T);
    for (const z of [-.13, .13]) { ab.cyl(sterne ? ctx.mat("rubber") : ctx.mat(zau ? "brass" : "metal"), .05, .05, .028, 18, 0, 0, z, Math.PI / 2, 0, 0); ab.box(mTrim, .085, .008, .03, 0, 0, z); ab.box(mTrim, .008, .085, .03, 0, 0, z); }
    ab.cyl(ctx.mat("steel"), .006, .006, .3, 6, 0, 0, 0, Math.PI / 2, 0, 0); ab.build(a, false); return a; });
  // Oberkörper (kippt um die Hüfte), Kopf (kippt um den Hals)
  const hip = new T.Group(); hip.position.set(-.17, .2, 0); veh.add(hip);
  const neck = new T.Group(); neck.position.set(0, .2, 0); hip.add(neck);
  { const tb = bucket(T); tb.box(dumM, .085, .2, .15, 0, .1, 0); for (const z of [-.095, .095]) { tb.box(dumM, .04, .15, .035, .02, .11, z); tb.sph(jointM, .022, .02, .19, z, 10); }
    tb.box(beltM, .012, .25, .03, .046, .1, 0, .62, 0, 0); tb.build(hip);
    const nb = bucket(T); nb.cyl(jointM, .02, .02, .03, 10, 0, .015, 0); nb.sph(dumM, .05, 0, .065, 0, 18);
    nb.box(jointM, .006, .02, .02, .05, .072, -.018); nb.box(jointM, .006, .02, .02, .05, .072, .018); nb.build(neck); }
  // lose Kugel
  const ballM = zau ? ctx.mat("crystal", {color: "#9a6bff", intensity: .8}) : sterne ? ctx.mat("glow", {color: "#FFE81F", intensity: 1.6}) : ctx.mat("color", {color: "#8b2a1e", rough: .5});
  const ball = ctx.mesh(new T.SphereGeometry(R_B, 22, 16), ballM); g.add(ball);
  if (det) { const seam = ctx.mesh(new T.TorusGeometry(R_B * 1.005, .004, 6, 28), ctx.mat("color", {color: "#f3e6cc"}), false); ball.add(seam); }
  // Bremsfunken an den Vorderrädern
  const sparks = [-.13, .13].map(z => { const s = ctx.glow(sterne ? 0xff4d4d : 0xffb347, .01); s.position.set(.21, .0, z); veh.add(s); return s; });

  let phase = "idle", pt = 0, runMode = 0, x = X0, v = 0, acc = 0, rFrom = X0, ballBack = false;
  // Startplatz der Kugel: Vollbremsung (Modus 1) an den Beinen der Puppe – beim Anfahren schieben die Beine sie mit;
  // Stoß von hinten (Modus 2) frei vor den Beinen – der Wagen fährt unter ihr weg
  const restRel = m => m === 2 ? HOME : STOP;
  const bl = {att: true, rel: restRel(1), x: 0, y: 0, v: 0, vy: 0, s: 1, on: "veh"};
  const dm = {a: 0, av: 0, b: 0, bv: 0}, ramX = {v: 0};
  const setBall = () => { const bx = bl.att ? x + bl.rel : bl.x, by = bl.att ? RY + PLAT + R_B : bl.y; ball.position.set(bx, by, 0); ball.scale.setScalar(Math.max(.01, bl.s)); };
  setBall(); veh.position.set(x, RY, 0);
  ctx.tick((dt, t) => {
    pt += dt; acc = 0;
    if (phase === "reset") { const k = sm(pt / .8); x = lerp(rFrom, X0, k); v = 0;
      if (ballBack) { if (pt < .4) bl.s = 1 - pt / .4; else { bl.att = true; bl.rel = restRel(runMode); bl.s = (pt - .4) / .4; } }
      dm.a *= .9; dm.b *= .9; dm.av = dm.bv = 0;
      if (pt >= .8) { bl.s = 1; bl.att = true; bl.rel = restRel(runMode); phase = runMode === 1 ? "accel" : "push"; pt = 0; } }
    else if (phase === "accel") { acc = 1.6; if (v >= 1) { v = 1; acc = 0; phase = "cruise"; } }
    else if (phase === "cruise") { if (x >= .3) phase = "brake"; }
    else if (phase === "brake") { acc = -9; if (v <= 0) { v = 0; acc = 0; phase = "idle"; } }
    else if (phase === "push") { ramX.v = pt < .06 ? .07 * pt / .06 : .07; if (pt > .025 && pt < .095) acc = 12; if (pt >= .095) phase = "coast"; }
    else if (phase === "coast") { ramX.v = Math.max(0, ramX.v - dt * .1); acc = -.6; if (v <= 0) { v = 0; acc = 0; phase = "idle"; } }
    else ramX.v = Math.max(0, ramX.v - dt * .1);
    const vOld = v; v = Math.max(0, v + acc * dt); const dx = v * dt; x += dx;
    veh.position.x = x; axles.forEach(a => a.rotation.z -= dx / WR); ram.position.x = -1.36 + ramX.v;
    const brake = phase === "brake" ? 1 : 0; sparks.forEach(s => s.scale.setScalar(.01 + .3 * brake * (.7 + .3 * Math.random())));
    // Kugel (Trägheitssatz): Ohne Kraft behält sie ihre Geschwindigkeit. Sie fährt nur mit, solange der Wagen gleichförmig fährt
    // oder die Beine der Puppe sie beim Beschleunigen schieben; sonst rollt sie frei (Rollreibung klein, relativ zur Unterlage).
    const pushed = acc > 0 && bl.rel <= STOP + 1e-3;
    if (bl.att && phase !== "reset" && Math.abs(acc) > .05 && !pushed) { bl.att = false; bl.x = x - dx + bl.rel; bl.y = RY + PLAT + R_B; bl.v = vOld; bl.vy = 0; bl.on = "veh"; }
    if (!bl.att) { const ox = bl.x; bl.v = bl.on === "veh" ? v + (bl.v - v) * (1 - .35 * dt) : bl.v * (1 - .35 * dt); bl.x += bl.v * dt;
      if (bl.on === "veh") { const rel = bl.x - x;
        if (rel < STOP) { bl.att = true; bl.rel = STOP; }                      // stößt an die Beine der Puppe und fährt mit
        else if (rel > FRONT) bl.on = "air";
        ball.rotation.z -= ((bl.x - ox) - dx) / R_B; }
      else { if (bl.on === "air") { bl.vy -= 9.81 * dt; bl.y += bl.vy * dt; if (bl.y <= TT + R_B) { bl.y = TT + R_B; bl.vy = 0; bl.on = "table"; } }
        if (bl.x > 1.36 - R_B) { bl.x = 1.36 - R_B; bl.v = -.15 * Math.abs(bl.v); }
        ball.rotation.z -= (bl.x - ox) / R_B; } }
    setBall();
    // Puppe: Trägheit gegenüber dem beschleunigten Wagen; Gurt und Lehne begrenzen den Oberkörper, die Kopfstütze den Kopf
    dm.av += (-acc * 3 - 40 * dm.a - 5 * dm.av) * dt; dm.a += dm.av * dt; if (dm.a > .3) { dm.a = .3; dm.av = Math.min(0, dm.av); } if (dm.a < -.02) { dm.a = -.02; dm.av = Math.max(0, dm.av); }
    dm.bv += (-acc * 4 - 50 * dm.b - 5 * dm.bv) * dt; dm.b += dm.bv * dt; if (dm.b > .45) { dm.b = .45; dm.bv = Math.min(0, dm.bv); } if (dm.b < -.3) { dm.b = -.3; dm.bv = Math.max(0, dm.bv) * -.2; }
    hip.rotation.z = -dm.a; neck.rotation.z = -dm.b;
  });
  ctx.obstacleBox(S.D.x - .1, S.D.z, .8, 3.05);
  ctx.exhibit(g, {label: "Wagen mit Puppe", dist: 2.2,
    get sub(){ return runMode === 1 ? "anklicken: Stoß von hinten" : "anklicken: Vollbremsung"; },   // nächster Klick
    onClick: () => { runMode = runMode === 1 ? 2 : 1; rFrom = x; ballBack = !bl.att || Math.abs(bl.rel - restRel(runMode)) > .01 || bl.s < 1;
      if (ballBack || Math.abs(x - X0) > .01 || phase !== "idle") { phase = "reset"; pt = 0; } else { phase = runMode === 1 ? "accel" : "push"; pt = 0; } },
    title: "Trägheit im Fahrzeug: Gurt und Kopfstütze",
    get eyebrow(){ return runMode === 2 ? "Exponat · Stoß von hinten: wozu die Kopfstütze da ist" : "Exponat · Vollbremsung: wozu der Gurt da ist"; },
    get text(){ return runMode === 2
      ? "Der Wagen wird von hinten angestoßen und ruckartig nach vorne beschleunigt. Der Sitz schiebt den Körper der Puppe mit, ihr **Kopf bleibt wegen seiner Trägheit zurück** und kippt nach hinten – die **Kopfstütze** fängt ihn auf und schützt die Halswirbelsäule.\n\nAuch die lose Kugel bleibt zunächst in Ruhe: Der Wagen fährt unter ihr weg, bis die Beine der Puppe sie mitnehmen. Beim Ausrollen wird der Wagen langsamer, die Kugel aber rollt wegen ihrer Trägheit nach vorne weiter."
      : "Der Wagen bremst stark ab. Die lose Kugel bewegt sich wegen ihrer **Trägheit** mit der alten Geschwindigkeit weiter und rollt nach vorne davon – eine Kraft nach vorne gibt es dabei nicht.\n\nDie Puppe wird vom **Sicherheitsgurt** gehalten: Er übt die Kraft aus, die sie zusammen mit dem Wagen abbremst. Beim Anfahren lag die Kugel an den Beinen der Puppe an: Die Beine haben sie mitbeschleunigt."; }});
  return g;
}

/* =====================================================================
   Über dem Gang: schwingende Federleuchten
   ===================================================================== */
function springLamp(ctx, z, ph){
  const T = ctx.T, W = ctx.world, H = ctx.height || 7, top = H - (W === "sterne" ? .26 : .02), LS = .55;
  const g = new T.Group(); ctx.add(g, 0, 0, z);
  const b = bucket(T), mT = ctx.mat(W === "sterne" ? "steel" : "brass"), sTop = top - .9;
  b.cyl(mT, .11, .13, .05, 20, 0, top - .025, 0); b.cyl(ctx.mat("metal"), .012, .012, .9, 8, 0, top - .45, 0); b.cyl(mT, .03, .03, .04, 10, 0, sTop + .01, 0);
  b.build(g, false);
  const sp = ctx.mesh(helixGeo(T, .07, LS, 12, .009), ctx.mat(W === "zauber" ? "copper" : "steel"), false); sp.position.y = sTop; g.add(sp);
  const lamp = new T.Group(); g.add(lamp); const lb = bucket(T); let gc;
  lb.put(mT, new T.TorusGeometry(.022, .006, 6, 12), 0, -.02, 0);
  if (W === "zauber") { gc = 0xffc86b; lb.cyl(mT, .02, .13, .08, 8, 0, -.08, 0); lb.cyl(mT, .12, .12, .02, 8, 0, -.4, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; lb.box(mT, .015, .3, .015, Math.cos(a) * .11, -.26, Math.sin(a) * .11); }
    lb.put(ctx.mat("crystal", {color: "#ffcf73", intensity: 1.8}), new T.OctahedronGeometry(.07, 0).scale(1, 1.5, 1), 0, -.26, 0); }
  else if (W === "sterne") { gc = 0x9be7ff; lb.cyl(mT, .03, .03, .08, 10, 0, -.06, 0); lb.put(mT, new T.TorusGeometry(.15, .018, 8, 32), 0, -.22, 0, Math.PI / 2, 0, 0);
    lb.sph(ctx.mat("glow", {color: "#9be7ff", intensity: 2.2}), .09, 0, -.22, 0, 20); lb.put(mT, new T.TorusGeometry(.15, .012, 8, 32), 0, -.22, 0); }
  else { gc = 0xffd29a; lb.cyl(mT, .025, .09, .08, 14, 0, -.07, 0); lb.sph(ctx.mat("glow", {color: "#ffe2b8", intensity: 1.3}), .11, 0, -.2, 0, 20); lb.cyl(mT, .03, .015, .06, 10, 0, -.33, 0); }
  lb.build(lamp, false);
  const halo = ctx.glow(gc, 1.1); halo.position.y = W === "detektiv" ? -.2 : -.24; lamp.add(halo);
  ctx.tick((dt, t) => { const e = .08 * Math.sin(t * 2.3 + ph); sp.scale.y = (LS + e) / LS; lamp.position.y = sTop - LS - e; });
}

/* =====================================================================
   E: Federkraftmesser mit verschiedenen Messbereichen (Ecke rechts vorne)
   ===================================================================== */
function metersE(ctx, L){
  const T = ctx.T, W = ctx.world, sterne = W === "sterne", zau = W === "zauber";
  const g = new T.Group(); ctx.add(g, 6.25, 0, -9.35); g.rotation.y = -1.2;
  const mFrame = ctx.mat(sterne ? "steel" : "darkwood"), mTrim = ctx.mat(sterne ? "steel" : "brass"), b = bucket(T), TOP = 2.05;
  b.box(ctx.mat(sterne ? "metal" : zau ? "stone" : "darkwood"), 1.2, .08, .6, 0, .04, 0); b.box(mTrim, 1.22, .02, .62, 0, .09, 0);
  for (const x of [-.52, .52]) { b.box(mFrame, .07, TOP - .1, .07, x, .1 + (TOP - .1) / 2, -.05); b.box(mTrim, .18, .03, .18, x, .115, -.05); }
  b.box(mFrame, 1.14, .08, .09, 0, TOP + .04, -.05);
  for (const x of [-.3, 0, .3]) b.cyl(mTrim, .007, .007, .07, 8, x, TOP - .02, 0);
  if (sterne) b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4}), 1.1, .012, .01, 0, TOP, .0);
  b.build(g);
  const MR = [{r: 2.5, col: "#d23a2a", txt: "2,5 N"}, {r: 10, col: "#2f6db5", txt: "10 N"}, {r: 50, col: "#2e8b57", txt: "50 N"}], SL = .3;
  const tubeM = sterne ? ctx.mat("plastic", {color: "#e9eef4"}) : ctx.mat("brass");
  const ms = MR.map((m, k) => { const x = -.3 + k * .3, y0 = TOP - .07;
    const mb = bucket(T); mb.put(mTrim, new T.TorusGeometry(.018, .005, 6, 12), x, y0 + .03, 0); mb.cyl(tubeM, .035, .035, .42, 18, x, y0 - .21, 0);
    mb.cyl(ctx.mat("color", {color: m.col, rough: .5}), .038, .038, .04, 18, x, y0 - .02, 0); mb.cyl(ctx.mat("color", {color: "#1d1d1d", rough: .6}), .038, .038, .02, 18, x, y0 - .42, 0); mb.build(g);
    // Skala: 10 Teilstriche, Zahlen an 0, Mitte und Ende (Dezimalkomma)
    const sc = screen(ctx, .064, .36, 768, (q, w, h) => { q.fillStyle = "#f4efe2"; q.fillRect(0, 0, w, h); q.fillStyle = "#1b1b1b"; const pc = (h * .82) / 10, t0 = h * .1;
      for (let i = 0; i <= 10; i++) { const y = t0 + i * pc, big = i % 5 === 0; q.fillRect(0, y - (big ? 3 : 1.6), big ? w * .36 : w * .22, big ? 6 : 3.2); }
      q.font = `700 ${Math.round(w * .29)}px Helvetica, Arial, sans-serif`; q.textAlign = "right"; q.textBaseline = "middle";
      for (const i of [0, 5, 10]) q.fillText(String(m.r * i / 10).replace(".", ","), w - 5, t0 + i * pc + 1);
      q.fillStyle = m.col; q.font = `700 ${Math.round(w * .24)}px Helvetica, Arial, sans-serif`; q.textAlign = "center"; q.fillText(m.txt, w / 2, h * .045); });
    sc.position.set(x, y0 - .22, .037); g.add(sc);
    const rod = new T.Group(); rod.position.set(x, y0 - .42, 0); g.add(rod); const rb = bucket(T);
    rb.cyl(ctx.mat("steel"), .008, .008, .39, 8, 0, .165, 0); rb.put(mTrim, new T.TorusGeometry(.02, .005, 6, 12), 0, -.05, 0, 0, Math.PI / 2, 0); rb.build(rod, false);
    const mark = new T.Mesh(new T.BoxGeometry(.064, .008, .006), basic(T, "#e23b2b")); mark.position.set(0, .344, .044); rod.add(mark);
    const wt = new T.Group(); wt.position.y = -.12; rod.add(wt); const wb = bucket(T);
    wb.cyl(ctx.mat("steel"), .004, .004, .06, 6, 0, .03, 0); wb.cyl(ctx.mat(sterne ? "steel" : zau ? "gold" : "metal"), .045, .045, .07, 20, 0, -.035, 0); wb.build(wt, false); wt.visible = false;
    return {rod, wt, e: 0, from: 0, to: 0, y0, ext: SL * 2 / m.r}; });
  const labCol = zau ? "#ffe2a0" : sterne ? "#bfefff" : "#f3e6cc";
  // Schild steht auf dem Querbalken (Fußleiste), Messbereiche vorn auf dem Balken
  { const lab = ctx.text("Federkraftmesser", {size: .062, color: labCol}), w = lab.userData.w, h = lab.userData.h, y = TOP + .08 + .018 + h / 2 + .006, pb = bucket(T), PM = plateMats(ctx);
    plateBehind(pb, PM, w, h, 0, y, -.038); pb.box(PM.frame, w + .06, .018, .1, 0, TOP + .089, -.05); pb.build(g);
    lab.position.set(0, y, -.036); g.add(lab); }
  const lab2 = txt(ctx, "Messbereiche 2,5 N · 10 N · 50 N", {size: .04, color: labCol, font: formFont(ctx)}); lab2.position.set(0, TOP + .04, .002); g.add(lab2);
  let on = false, t0 = -99, tNow = 0;
  ctx.tick((dt, t) => { tNow = t; const tau = t - t0;
    for (const m of ms) { m.e = m.to + (m.from - m.to) * Math.exp(-4 * tau) * Math.cos(12 * tau); m.rod.position.y = m.y0 - .42 - m.e;
      m.wt.visible = on || tau < .25; if (!on && tau < .25) m.wt.position.y = -.12 - .3 * tau; else m.wt.position.y = -.12; } });
  ctx.obstacleBox(6.25, -9.35, 1.0, 1.3);
  ctx.exhibit(g, {label: "Federkraftmesser", sub: "anklicken: Wägestücke anhängen", dist: 2.0,
    onClick: () => { on = !on; t0 = tNow; for (const m of ms) { m.from = m.e; m.to = on ? m.ext : 0; } },
    get title(){ return "Federkraftmesser – den Messbereich richtig wählen"; },
    get text(){ return on
      ? "An allen drei Kraftmessern hängt ein Wägestück mit **2 N**. Der Kraftmesser für **2,5 N** hat eine weiche Feder und dehnt sich weit – du kannst genau ablesen. Der für **50 N** hat eine sehr harte Feder und dehnt sich kaum.\n\nDie Skalen sind gleichmäßig eingeteilt, weil die Verlängerung nach dem hookeschen Gesetz proportional zur Kraft ist. Den Messbereich nie überschreiten – sonst wird die Feder überdehnt."
      : "Ohne Last stehen alle drei Zeiger wieder auf null: Die Federn wurden nur **elastisch** verformt. Wähle den Messbereich so, dass die Kraft gut ablesbar ist, ihn aber nicht überschreitet."; }});
  return g;
}

/* ---------- Lagerecke links hinten: träge Lasten und eine kleine Laderampe ---------- */
function storeCorner(ctx){
  const T = ctx.T, W = ctx.world, sterne = W === "sterne", zau = W === "zauber";
  const g = new T.Group(); ctx.add(g, -6.15, 0, 9.35); g.rotation.y = .5;
  const b = bucket(T), boxM = sterne ? ctx.mat("plastic", {color: "#e6ecf2"}) : ctx.mat(zau ? "darkwood" : "wood"), band = sterne ? ctx.mat("plastic", {color: "#27354a"}) : ctx.mat(zau ? "brass" : "metal");
  b.box(boxM, .9, .6, .7, 0, .3, 0); for (const x of [-.32, .32]) b.box(band, .05, .61, .71, x, .3, 0);
  b.box(boxM, .62, .4, .5, -.05, .8, 0, 0, .25, 0); b.box(band, .64, .04, .52, -.05, .9, 0, 0, .25, 0);
  if (zau) { b.box(ctx.mat("gold"), .08, .09, .02, 0, .42, .36); b.put(boxM, new T.CylinderGeometry(.25, .25, .62, 18, 1, false, 0, Math.PI), -.05, 1.0, 0, 0, .25, Math.PI / 2); }
  if (sterne) { b.box(ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), .3, .03, .006, 0, .3, .353); b.box(ctx.mat("plastic", {color: "#FFE81F"}), .14, .08, .006, -.22, .45, .353); }
  // Fass (stehend) und Fass (liegend)
  const pts = []; for (let i = 0; i <= 10; i++) pts.push(new T.Vector2(.17 + .04 * Math.sin(Math.PI * i / 10), .56 * i / 10));
  const barM = sterne ? ctx.mat("steel") : ctx.mat("wood"), hoopM = sterne ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2}) : ctx.mat("metal"), capM = ctx.mat(sterne ? "metal" : "darkwood");
  b.put(barM, new T.LatheGeometry(pts, 20), .8, 0, .35); for (const y of [.08, .48]) b.put(hoopM, new T.TorusGeometry(.198, .01, 6, 24), .8, y, .35, Math.PI / 2, 0, 0);
  b.cyl(capM, .17, .17, .012, 20, .8, .56, .35);
  b.put(barM, new T.LatheGeometry(pts, 20).translate(0, -.28, 0), .75, .21, -.35, 0, 0, Math.PI / 2); for (const x of [-.2, .2]) b.put(hoopM, new T.TorusGeometry(.198, .01, 6, 24), .75 + x, .21, -.35, 0, Math.PI / 2, 0);
  for (const x of [-.276, .276]) b.cyl(capM, .172, .172, .012, 20, .75 + x, .21, -.35, 0, 0, Math.PI / 2);
  // Laderampe (Planke) an der Kiste – auf der zur Raummitte zeigenden Seite (lokal −z), unteres Ende auf dem Boden
  const a = Math.atan(.6 / .95), Lp = Math.hypot(.6, .95);
  b.box(ctx.mat(sterne ? "floor" : "wood"), .34, .045, Lp, -.05, .3, -(.35 + .475), -a, 0, 0);
  for (const x of [-.18, .08]) b.box(ctx.mat(sterne ? "steel" : "brass"), .02, .05, Lp, x, .32, -(.35 + .475), -a, 0, 0);
  // kleine Laterne auf der oberen Kiste
  b.cyl(ctx.mat(sterne ? "steel" : "brass"), .06, .07, .03, 12, -.05, 1.015 + (zau ? .25 : 0), 0); b.cyl(ctx.mat(sterne ? "steel" : "brass"), .015, .06, .05, 12, -.05, 1.19 + (zau ? .25 : 0), 0);
  b.cyl(ctx.mat("glow", {color: sterne ? "#9BE7FF" : "#FFC86B", intensity: 1.6}), .04, .04, .13, 12, -.05, 1.1 + (zau ? .25 : 0), 0);
  b.build(g);
  const lg = ctx.glow(sterne ? 0x9be7ff : 0xffc070, .7); lg.position.set(-.05, 1.1 + (zau ? .25 : 0), 0); g.add(lg);
  ctx.obstacleBox(-6.05, 9.45, 1.9, 1.7);
  { const lx = -.05, lz = -1.1, c = Math.cos(.5), s = Math.sin(.5); ctx.obstacle(-6.15 + lx * c + lz * s, 9.35 - lx * s + lz * c, .3); }   // unteres Ende der Planke
}

/* =====================================================================
   Raum
   ===================================================================== */
R3D.rooms.kraft2 = ctx => {
  const L = look(ctx);
  rampCenter(ctx, L);
  springsA(ctx, L);
  tableB(ctx, L);
  pressesC(ctx, L);
  vehicleD(ctx, L);
  metersE(ctx, L);
  storeCorner(ctx);
  springLamp(ctx, 5.2, 0); springLamp(ctx, -7.2, 1.7);
  const warm = ctx.world === "sterne" ? 0xe8f6ff : 0xffdcae;
  ctx.light(ctx.world === "sterne" ? 0xe8f6ff : 0xffe6c4, 7, 9, 0, 3.3, -.6);
  ctx.light(warm, 5, 7, -4.2, 3.0, -7.4); ctx.light(warm, 5, 7, 4.2, 3.0, 6.4); ctx.light(warm, 4, 6, 4.6, 3.0, -8.4);

  /* Wandtafeln */
  ctx.wallBoard("left", 6.75, 3.6, 3.2, 2.1, "Der Trägheitssatz", ["Ohne resultierende Kraft bleibt ein Körper in Ruhe oder bewegt sich gleichförmig geradlinig weiter.",
    "Maß für die Trägheit ist die Masse.", "Gurt und Kopfstütze schützen vor den Folgen der Trägheit."]);
  ctx.wallBoard("right", 2.25, 3.6, 3.2, 2.1, "Hookesches Gesetz", ["F = D · s (im elastischen Bereich)", "s: Verlängerung der Feder", "D: Federhärte in N/m oder N/cm",
    "Doppelte Kraft – doppelte Verlängerung", "Große Federhärte: harte Feder, steile Gerade im F-s-Diagramm"]);
  ctx.wallBoard("left", -2.25, 3.6, 3.2, 2.1, "Die schiefe Ebene", ["Gewichtskraft F_{G}: senkrecht nach unten", "Hangabtriebskraft F_{H}: parallel zur Ebene, hangabwärts",
    "Normalkraft F_{N}: senkrecht zur Ebene", "F_{H} : F_{G} = h : l", "Je steiler die Ebene, desto größer F_{H} und desto kleiner F_{N}."]);
  ctx.wallBoard("right", -6.75, 3.6, 3.2, 2.1, "Elastisch oder plastisch?", ["Elastisch: Der Körper nimmt seine alte Form wieder an – Feder, Gummiband.",
    "Plastisch: Der Körper bleibt verformt – Knetmasse, verbogener Draht.", "Oberhalb der Elastizitätsgrenze bleibt auch eine Feder verformt."]);
};
})();
