/* ---------- 20_kraft1.js ---------- */
/* =====================================================================
   Raum · Kraftpfeil – Gewichtskraft – Kräfte addieren (Kap. 4.1–4.3)
   Mittelstück: Ortswechsel-Experiment – derselbe Körper (m = 3 kg) am Federkraftmesser und auf der Balkenwaage,
                Ortswahl Erde → Mond → Mars (Federkraftmesser 29,4 N / 4,8 N / 11,1 N, Balkenwaage bleibt im Gleichgewicht),
                Anzeige F_G = m · g und schwebender Himmelskörper
   A: Kraftpfeil-Modell (Angriffspunkt, Richtung, Betrag, Maßstab) · B: Tauziehen (Kräfte addieren/subtrahieren, Gleichgewicht)
   C: Kräfteparallelogramm (3 N und 4 N unter 60°/90°/120°) · D: Kran mit Last (Gewichtskraft und Seilkraft im Gleichgewicht)
   Luftraum über dem Gang: Ortsfaktor-Planetarium (Mond, Mars, Erde, Jupiter – je 1 kg auf der Oberfläche, Gewichtskraft-Pfeil zum Mittelpunkt)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
const TAU = Math.PI * 2;
const de = (x, d = 1) => x.toFixed(d).replace(".", ",");
const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const back = x => { const c = 1.9; x = Math.max(0, Math.min(1, x)) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };   // mit Überschwingen
// Kraftfarben – in allen Welten gleich
const COL = {G: "#ff4b3a", seil: "#3d8bff", res: "#22d67a", f1: "#ff9f1c", f2: "#3d8bff", f3: "#b48cff", zug: "#ff6a2b"};

/* ---------- Weltabhängige Farben für Anzeigen und Zeichenbretter ---------- */
function look(ctx){
  const k = ctx.kit, w = ctx.world;
  if (w === "sterne") return {bg: "#061527", fg: "#eaf6ff", acc: "#FFE81F", acc2: "#4FC3F7", dim: "#8fb4cc", tf: k.font, bf: k.fontBody,
    paper: "#0b2238", paper2: "#06182a", ink: "#e2f4ff", inkDim: "#9cc3da", grid: "rgba(79,195,247,.22)", grid5: "rgba(79,195,247,.42)", dash: "#cfe9ff", scan: true};
  if (w === "detektiv") return {bg: "#17201b", fg: "#f3e6cc", acc: "#E0A86A", acc2: "#8fd1bf", dim: "#b3a68c", tf: k.font, bf: k.fontBody,
    paper: "#f3ead6", paper2: "#e2d4b4", ink: "#2a2118", inkDim: "#6b5a44", grid: "rgba(47,93,93,.20)", grid5: "rgba(47,93,93,.42)", dash: "#3a3026", speck: true};
  return {bg: "#1b221e", fg: "#f4ecd8", acc: "#E3B341", acc2: "#a9c4ff", dim: "#aab3a2", tf: k.font, bf: k.fontBody,
    paper: "#f2e4c2", paper2: "#d9bf8a", ink: "#2b1a10", inkDim: "#6e5434", grid: "rgba(110,70,30,.20)", grid5: "rgba(110,70,30,.42)", dash: "#3b2614", speck: true};
}

/* ---------- Schrift mit Tiefstellung: "F_{res}" ---------- */
function rt(g, s, x, y, size, font, align = "left", weight = 600, measure = false, maxW = 0){
  if (maxW && !measure) while (size > 12 && rt(g, s, 0, 0, size, font, align, weight, true) > maxW) size -= 1;
  const parts = []; String(s).replace(/_\{([^}]*)\}|[^_]+|_/g, (m, sub) => { parts.push(sub != null ? [sub, 1] : [m, 0]); return m; });
  const fN = `${weight} ${size}px ${font}`, fS = `${weight} ${Math.round(size * .64)}px ${font}`;
  let w = 0; for (const [t, b] of parts) { g.font = b ? fS : fN; w += g.measureText(t).width; }
  if (measure) return w;
  let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; const al = g.textAlign; g.textAlign = "left";
  for (const [t, b] of parts) { g.font = b ? fS : fN; g.fillText(t, cx, y + (b ? size * .26 : 0)); cx += g.measureText(t).width; }
  g.textAlign = al; return w;
}
// dunkle Anzeige (Schirm, Tafel)
function dark(g, W, H, L){
  g.fillStyle = L.bg; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * .3, H * .2, 10, W * .5, H * .5, Math.max(W, H) * .8); gr.addColorStop(0, "rgba(255,255,255,.07)"); gr.addColorStop(1, "rgba(0,0,0,.3)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (L.speck) { const r = R3D.util.seeded(W * 7 + H); for (let i = 0; i < W * H / 300; i++) { g.fillStyle = r() < .5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.09)"; g.fillRect(r() * W, r() * H, 2, 2); } }
  if (L.scan) for (let y = 0; y < H; y += 5) { g.fillStyle = "rgba(79,195,247,.04)"; g.fillRect(0, y, W, 2); }
  const m = Math.max(10, W / 70); g.strokeStyle = L.acc; g.globalAlpha = .7; g.lineWidth = Math.max(3, W / 300);
  g.beginPath(); g.roundRect(m, m, W - 2 * m, H - 2 * m, m * 1.3); g.stroke(); g.globalAlpha = 1;
}
// helles Zeichenbrett mit Kästchen (Sterne: dunkles Holo-Raster)
function sheet(g, W, H, L, ox, oy, step){
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, L.paper); gr.addColorStop(1, L.paper2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (L.speck) { const r = R3D.util.seeded(W + H * 3); for (let i = 0; i < W * H / 160; i++) { g.fillStyle = r() < .5 ? "rgba(120,90,50,.08)" : "rgba(255,255,255,.14)"; g.fillRect(r() * W, r() * H, 2, 2); } }
  if (L.scan) for (let y = 0; y < H; y += 6) { g.fillStyle = "rgba(79,195,247,.035)"; g.fillRect(0, y, W, 2); }
  const i0x = Math.ceil(-ox / step), i0y = Math.ceil(-oy / step);
  for (let i = i0x; ox + i * step <= W; i++) { const x = ox + i * step; g.fillStyle = i % 5 ? L.grid : L.grid5; g.fillRect(Math.round(x) - 1, 0, i % 5 ? 2 : 3, H); }
  for (let i = i0y; oy + i * step <= H; i++) { const y = oy + i * step; g.fillStyle = i % 5 ? L.grid : L.grid5; g.fillRect(0, Math.round(y) - 1, W, i % 5 ? 2 : 3); }
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, L.scan ? "rgba(0,0,0,.25)" : "rgba(90,60,20,.18)");
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
function cArrow(g, x1, y1, x2, y2, w, col){
  const a = Math.atan2(y2 - y1, x2 - x1), hl = w * 3.4; g.strokeStyle = g.fillStyle = col; g.lineWidth = w; g.lineCap = "round";
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hl * .8, y2 - Math.sin(a) * hl * .8); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - .42) * hl, y2 - Math.sin(a - .42) * hl); g.lineTo(x2 - Math.cos(a + .42) * hl, y2 - Math.sin(a + .42) * hl); g.closePath(); g.fill();
}
// Schrift mit weichem Rand (auf Rasterpapier besser lesbar)
function halo(g, s, x, y, size, font, col, L, align = "left"){
  g.save(); g.shadowColor = L.scan ? "rgba(0,0,0,.9)" : "rgba(255,250,235,.95)"; g.shadowBlur = size * .35; g.fillStyle = col;
  for (let i = 0; i < 2; i++) rt(g, s, x, y, size, font, align, 700); g.restore();
}

/* ---------- Anzeigen, Beschriftungen ---------- */
function screen(ctx, w, h, px, draw, round = false){
  const T = ctx.T, c = document.createElement("canvas"); c.width = Math.round(w >= h ? px : px * w / h); c.height = Math.round(h >= w ? px : px * h / w);
  const g = c.getContext("2d"), tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const m = new T.Mesh(round ? new T.CircleGeometry(w / 2, 64) : new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map: tex, toneMapped: false}));
  m.redraw = (...a) => { g.save(); draw(g, c.width, c.height, ...a); g.restore(); tex.needsUpdate = true; };
  m.redraw(); return m;
}
function tag(ctx, s, color, h, bgA = .62){
  const T = ctx.T, px = 64, c = document.createElement("canvas"), g = c.getContext("2d"), f = ctx.kit.fontBody;
  const tw = rt(g, s, 0, 0, px, f, "left", 700, true); c.width = Math.ceil(tw + px * .8); c.height = Math.round(px * 1.42);
  g.fillStyle = `rgba(8,10,16,${bgA})`; g.beginPath(); g.roundRect(2, 2, c.width - 4, c.height - 4, c.height * .45); g.fill();
  g.strokeStyle = color; g.globalAlpha = .55; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1;
  g.fillStyle = color; g.textBaseline = "middle"; rt(g, s, c.width / 2, c.height * .5, px, f, "center", 700);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const sp = new T.Sprite(new T.SpriteMaterial({map: t, transparent: true, depthWrite: false, toneMapped: false}));
  sp.scale.set(h * c.width / c.height, h, 1); sp.renderOrder = 7; return sp;
}
// Schild mit mehreren Zeilen (je Zeile eigene Farbe)
function tagLines(ctx, rows, h){
  const T = ctx.T, px = 56, c = document.createElement("canvas"), g = c.getContext("2d"), f = ctx.kit.fontBody;
  const tw = Math.max(...rows.map(([s]) => rt(g, s, 0, 0, px, f, "left", 700, true))); c.width = Math.ceil(tw + px * .9); c.height = Math.round(px * (1.3 * rows.length + .5));
  g.fillStyle = "rgba(8,10,16,.66)"; g.beginPath(); g.roundRect(2, 2, c.width - 4, c.height - 4, px * .5); g.fill();
  g.strokeStyle = rows[0][1]; g.globalAlpha = .55; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1; g.textBaseline = "middle";
  rows.forEach(([s, col], i) => { g.fillStyle = col; rt(g, s, c.width / 2, px * (.9 + 1.3 * i), px, f, "center", 700); });
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const sp = new T.Sprite(new T.SpriteMaterial({map: t, transparent: true, depthWrite: false, toneMapped: false}));
  sp.scale.set(h * c.width / c.height, h, 1); sp.renderOrder = 7; return sp;
}
// Pfeil im Körper: Der Körper markiert seine sichtbaren Pixel im Stencil-Puffer (spät gezeichnet), ein „Geist“ des Pfeils
// wird ohne Tiefentest nur dort gezeichnet. So sieht man den Pfeil ab dem Schwerpunkt – aber nicht durch andere Dinge hindurch.
function stencilMat(T, m, ref){ const c = m.clone(); c.userData = {}; c.stencilWrite = true; c.stencilRef = ref; c.stencilFunc = T.AlwaysStencilFunc;
  c.stencilFail = T.KeepStencilOp; c.stencilZFail = T.KeepStencilOp; c.stencilZPass = T.ReplaceStencilOp; return c; }
function stencilBody(o, order = 5){ o.traverse(n => { if (n.isMesh) n.renderOrder = order; }); return o; }
function forceArrow(ctx, parent, color, thick, ref){
  const T = ctx.T, a = ctx.arrow([0, 0, 0], [0, .1, 0], color, thick), gh = ctx.arrow([0, 0, 0], [0, .1, 0], color, thick); parent.add(a, gh);
  gh.traverse(o => { if (o.material) { const m = o.material; m.depthTest = false; m.depthWrite = false; m.stencilWrite = true; m.stencilWriteMask = 0; m.stencilRef = ref;
    m.stencilFunc = T.EqualStencilFunc; m.stencilFail = m.stencilZFail = m.stencilZPass = T.KeepStencilOp; o.renderOrder = 6; } });
  return {set(p, q){ a.set(p, q); gh.set(p, q); }, show(v){ a.visible = gh.visible = v; }};
}
// Schriftring auf einer Bodenfläche (Buchstaben mit dem Kopf zur Mitte – von außen lesbar)
function ghostDot(ctx, parent, color, ref, r = .022){
  const T = ctx.T, m = new T.Mesh(new T.SphereGeometry(r, 12, 8), new T.MeshBasicMaterial({color, depthTest: false, depthWrite: false, toneMapped: false,
    stencilWrite: true, stencilWriteMask: 0, stencilRef: ref, stencilFunc: T.EqualStencilFunc}));
  m.renderOrder = 6; parent.add(m); return m;
}
function ringText(ctx, rIn, rOut, text, color, font){
  const T = ctx.T, N = 1024, c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d"), k = N / 2 / rOut, R = (rIn + rOut) / 2 * k;
  g.font = `700 40px ${font}`; g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
  const chars = [...text], ws = chars.map(ch => g.measureText(ch).width + 7), tot = ws.reduce((x, y) => x + y, 0), sc = TAU * R / tot;
  let acc = 0;
  chars.forEach((ch, i) => { const th = Math.PI / 2 - (acc + ws[i] / 2) * sc / R; acc += ws[i];
    g.save(); g.translate(N / 2 + Math.cos(th) * R, N / 2 + Math.sin(th) * R); g.rotate(th - Math.PI / 2); g.fillText(ch, 0, 0); g.restore(); });
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  const m = new T.Mesh(new T.RingGeometry(rIn, rOut, 128, 1), new T.MeshBasicMaterial({map: t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2}));
  m.rotation.x = -Math.PI / 2; return m;
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
    // Stab von a nach b
    rod(mat, a, b, r, seg = 8){ const A = new T.Vector3(...a), Bv = new T.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
      const g = flat(new T.CylinderGeometry(r, r, L, seg)); g.applyMatrix4(new T.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()), one));
      if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g); return B; },
    build(parent, cast = true){ const out = [];
      for (const [mat, gs] of parts) { const m = new T.Mesh(merge(T, gs), mat); m.castShadow = cast && !mat.transparent; m.receiveShadow = true; parent.add(m); out.push(m); gs.forEach(g => g.dispose()); }
      parts.clear(); return out; }
  };
  return B;
}

/* ---------- Himmelskörper (prozedurale Texturen, einmal gezeichnet) ---------- */
const PCV = {};
function planetCanvas(kind){
  if (PCV[kind]) return PCV[kind];
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d"), r = R3D.util.seeded({erde: 11, mond: 23, mars: 37, jupiter: 51}[kind]);
  const blob = (x, y, rx, ry, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; for (const dx of [-512, 0, 512]) { g.beginPath(); g.ellipse(x + dx, y, rx, ry, 0, 0, TAU); g.fill(); } g.globalAlpha = 1; };
  if (kind === "erde") {
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1d4f8f"); gr.addColorStop(.5, "#2b72c4"); gr.addColorStop(1, "#1d4f8f"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 7; i++) { const x0 = r() * 512, y0 = 62 + r() * 132, n = 12 + (r() * 12 | 0);
      for (let k = 0; k < n; k++) blob(x0 + (r() - .5) * 110, y0 + (r() - .5) * 70, 8 + r() * 22, 6 + r() * 16, k % 4 === 0 ? "#9b8a55" : k % 3 ? "#3e8a3c" : "#5a9a44"); }
    g.fillStyle = "#eef3f8"; g.fillRect(0, 0, 512, 16); g.fillRect(0, 240, 512, 16);
    for (let i = 0; i < 46; i++) blob(r() * 512, 18 + r() * 220, 12 + r() * 38, 2 + r() * 5, "#ffffff", .5);
  } else if (kind === "mond") {
    g.fillStyle = "#a3a29c"; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 9; i++) blob(r() * 512, 50 + r() * 150, 20 + r() * 50, 14 + r() * 30, "#77766f", .7);
    for (let i = 0; i < 90; i++) { const x = r() * 512, y = 10 + r() * 236, rr = 2 + r() * r() * 16; blob(x, y, rr, rr, "#86857e", .9); blob(x - rr * .2, y - rr * .2, rr * .7, rr * .7, "#6c6b65", .8);
      g.strokeStyle = "rgba(230,230,224,.5)"; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke(); }
  } else if (kind === "mars") {
    g.fillStyle = "#b8562e"; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 26; i++) blob(r() * 512, 30 + r() * 196, 14 + r() * 50, 6 + r() * 20, r() < .5 ? "#7d3519" : "#d07a45", .55);
    g.fillStyle = "#f4ece4"; g.fillRect(0, 0, 512, 10); g.fillRect(0, 248, 512, 8);
    for (let i = 0; i < 40; i++) { const rr = 1.5 + r() * 6; blob(r() * 512, 20 + r() * 216, rr, rr, "#8a3c1c", .6); }
  } else {
    const bands = ["#e3d2b0", "#b98b5c", "#efe2c8", "#a8754a", "#dcc39a", "#c49a6c", "#efe4cf", "#9e6c44", "#e0cba4"];
    for (let i = 0; i < 18; i++) { g.fillStyle = bands[i % bands.length]; g.fillRect(0, i * 256 / 18, 512, 256 / 18 + 1); }
    for (let i = 0; i < 60; i++) blob(r() * 512, r() * 256, 20 + r() * 50, 2 + r() * 3, r() < .5 ? "#f2e6cf" : "#9a6a43", .35);
    blob(330, 168, 34, 16, "#c0603a", .95); blob(330, 168, 24, 10, "#d77a4f", .9);
  }
  return PCV[kind] = c;
}
function planetMat(T, kind){ const t = new T.CanvasTexture(planetCanvas(kind)); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  return new T.MeshStandardMaterial({map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .3, roughness: .85}); }

/* =====================================================================
   Mittelstück: Ortswechsel-Experiment
   ===================================================================== */
function centerPiece(ctx, L, PM){
  const T = ctx.T, S = ctx.slots, cx = S.center.x, cz = S.center.z, w = ctx.world, TOP = .215, DY = 2.2, PUH = .47;   // Podestoberkante, Mitte der Anzeige, Pulthöhe
  const LOC = [
    {n: "Erde", gs: "9,81", F: 29.4, eq: "≈", col: "#6fb2ff", light: 0xcfe0ff, pm: "erde"},
    {n: "Mond", gs: "1,6", F: 4.8, eq: "=", col: "#e4e2d8", light: 0xf2f0e8, pm: "mond"},
    {n: "Mars", gs: "3,7", F: 11.1, eq: "=", col: "#ff8a50", light: 0xffc0a0, pm: "mars"}];
  let li = 0;
  const labF0 = m => Math.round(m * 98.1) / 10;   // Labor (Erde): Anzeige des Federkraftmessers F_G = m · 9,81 N/kg, auf 0,1 N abgelesen
  const mDais = ctx.mat(w === "sterne" ? "metal" : w === "detektiv" ? "darkwood" : "stone");
  const mTop = w === "sterne" ? ctx.mat("plastic", {color: "#26303d"}) : ctx.mat(w === "detektiv" ? "stone" : "darkwood");
  const mTrim = w === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.5}) : ctx.mat("brass");
  const mStand = ctx.mat(w === "sterne" ? "steel" : "metal"), mFrame = ctx.mat(w === "sterne" ? "metal" : "darkwood");
  const mBody = ctx.mat(w === "sterne" ? "steel" : w === "detektiv" ? "brass" : "metal"), mBand = w === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2}) : ctx.mat(w === "detektiv" ? "darkwood" : "gold");
  const lblCol = w === "detektiv" ? "#2a2118" : "#fff4d0";

  /* --- Podest, Ortswahl-Pult, Anzeige, Himmelskörper --- */
  const base = new T.Group(); ctx.add(base, cx, 0, cz);
  const b = bucket(T);
  b.cyl(mDais, 1.6, 1.68, .2, 56, 0, .1, 0); b.cyl(mTop, 1.47, 1.47, .02, 56, 0, .205, 0);
  b.put(mTrim, new T.TorusGeometry(1.6, .022, 8, 72), 0, .2, 0, Math.PI / 2);
  if (w !== "sterne") b.put(mTrim, new T.TorusGeometry(1.47, .012, 6, 72), 0, .216, 0, Math.PI / 2);
  // Pult mit schräger Bedienfläche (flach, damit es den Körper am Federkraftmesser nicht verdeckt)
  b.box(mFrame, .72, PUH, .34, 0, TOP + PUH / 2, 1.02); b.box(mTrim, .76, .03, .38, 0, TOP + .02, 1.02); b.box(mTrim, .74, .025, .025, 0, TOP + PUH - .12, 1.19);
  b.box(mStand, .78, .035, .44, 0, TOP + PUH + .025, 1.02, .45);
  // Anzeige auf zwei Säulen
  for (const s of [-1, 1]) b.cyl(mStand, .035, .035, DY - .45 - TOP, 12, s * .62, (DY - .45 + TOP) / 2, -.93);
  b.box(mFrame, 1.62, .97, .07, 0, DY, -.955); b.box(mTrim, 1.66, .035, .11, 0, DY + .5, -.955); b.box(mTrim, 1.66, .035, .11, 0, DY - .5, -.955);
  // Halter für den Himmelskörper
  b.cyl(mTrim, .02, .02, .14, 8, 0, DY + .585, -.93); b.put(mTrim, new T.TorusGeometry(.16, .014, 6, 40), 0, DY + .66, -.93, Math.PI / 2);
  // Wägesatz im Kasten (Wägestücke 1 kg … 50 g) – innerhalb des Schriftrings (Radius < 1,0 m)
  { const kx = .52, kz = .52, ry = -.7, cs = Math.cos(ry), sn = Math.sin(ry), at = (x, z) => [kx + x * cs + z * sn, kz - x * sn + z * cs];
    b.box(mFrame, .44, .07, .26, kx, TOP + .035, kz, 0, ry); b.box(ctx.mat("cloth", {color: w === "sterne" ? "#1d3a5a" : "#5a1420"}), .4, .01, .22, kx, TOP + .072, kz, 0, ry);
    b.box(mFrame, .44, .18, .02, ...(() => { const [x, z] = at(0, -.14); return [x, TOP + .16, z]; })(), -.25, ry);
    [[-.14, .05, .052, .09], [-.015, .05, .042, .075], [.095, .05, .033, .058], [.172, .05, .026, .046], [-.1, -.06, .03, .05], [.005, -.06, .024, .042], [.1, -.06, .02, .035]].forEach(([x, z, r, h]) => {
      const [px, pz] = at(x, z); b.cyl(ctx.mat("brass"), r, r, h, 18, px, TOP + .075 + h / 2, pz); b.cyl(ctx.mat("brass"), r * .42, r * .55, h * .4, 12, px, TOP + .075 + h + h * .2, pz); }); }
  b.build(base);
  const ring = ringText(ctx, 1.12, 1.44, "MASSE: ÜBERALL GLEICH  ✦  GEWICHTSKRAFT: HÄNGT VOM ORT AB  ✦  MASSE: ÜBERALL GLEICH  ✦  GEWICHTSKRAFT: HÄNGT VOM ORT AB  ✦  ",
    w === "sterne" ? "rgba(79,195,247,.9)" : w === "detektiv" ? "rgba(122,78,30,.9)" : "rgba(227,179,65,.85)", L.bf);
  ring.position.y = TOP + .004; base.add(ring);
  // Labor-Anzeige: Masse und Messwert des Federkraftmessers (auf der Erde); den Ortsfaktor bestimmen die Lernenden selbst
  function labScreen(g, W, H, lm){
    const F = labF0(lm), y0 = 160, dy = 72, bx = 670, bw = 270;
    g.textBaseline = "middle"; g.fillStyle = L.dim; rt(g, "LABOR: MASSE UND GEWICHTSKRAFT", 44, 54, 26, L.bf, "left", 700, false, W - 400);
    g.fillStyle = LOC[0].col; g.beginPath(); g.arc(W - 262, 58, 22, 0, TAU); g.fill();
    g.fillStyle = L.acc; rt(g, "Ort: Erde", W - 226, 58, 50, L.tf, "left", 700, false, 200);
    g.fillStyle = L.acc; g.globalAlpha = .5; g.fillRect(44, 100, W - 88, 3); g.globalAlpha = 1;
    g.fillStyle = L.dim; rt(g, "Masse", 48, y0, 34, L.bf); g.fillStyle = L.fg; rt(g, `m = ${de(lm, 2)} kg`, 290, y0, 42, L.bf, "left", 700);
    g.fillStyle = L.dim; rt(g, "Gewichtskraft", 48, y0 + dy, 34, L.bf); g.fillStyle = L.fg; rt(g, `F_{G} = ${de(F)} N`, 290, y0 + dy, 42, L.bf, "left", 700);
    g.fillStyle = L.dim; rt(g, "Ortsfaktor", 48, y0 + dy * 2, 34, L.bf); g.fillStyle = L.fg; rt(g, "g = F_{G} : m = ?", 290, y0 + dy * 2, 42, L.bf, "left", 700, false, bx - 320);
    g.fillStyle = L.acc; rt(g, "Bestimme g aus deinem Diagramm!", 48, y0 + dy * 3 + 10, 40, L.bf, "left", 700, false, bx - 90);
    // zwei Balken: Masse und Gewichtskraft wachsen gemeinsam
    [["Masse m", lm / 2, "0 kg", "2 kg", L.acc2], ["Gewichtskraft F_{G}", F / 20, "0 N", "20 N", COL.G]].forEach(([n, f, a, b2, col], k) => { const yy = 196 + k * 132;
      g.fillStyle = L.dim; rt(g, n, bx, yy - 40, 28, L.bf, "left", 600, false, bw);
      g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(bx, yy - 15, bw, 30); g.fillStyle = col; g.fillRect(bx, yy - 15, bw * Math.max(0, Math.min(1, f)), 30);
      g.fillStyle = L.dim; rt(g, a, bx, yy + 38, 24, L.bf, "left", 500); rt(g, b2, bx + bw, yy + 38, 24, L.bf, "right", 500); });
    g.fillStyle = L.dim; rt(g, "Regler im Laborblatt: Masse wählen  ·  Federkraftmesser: Gewichtskraft ablesen", W / 2, H - 50, 25, L.bf, "center", 500, false, W - 100);
  }
  const disp = screen(ctx, 1.5, .86, 1024, (g, W, H, i = 0, lm = null) => {
    const P = LOC[i]; dark(g, W, H, L);
    if (lm != null) return labScreen(g, W, H, lm);
    g.textBaseline = "middle"; g.fillStyle = L.dim; rt(g, "ORTSWECHSEL-EXPERIMENT", 44, 54, 26, L.bf, "left", 700);
    g.fillStyle = P.col; g.beginPath(); g.arc(W - 262, 58, 22, 0, TAU); g.fill();
    g.fillStyle = L.acc; rt(g, "Ort: " + P.n, W - 226, 58, 50, L.tf, "left", 700, false, 200);
    g.fillStyle = L.acc; g.globalAlpha = .5; g.fillRect(44, 100, W - 88, 3); g.globalAlpha = 1;
    const y0 = 160, dy = 72;
    g.fillStyle = L.dim; rt(g, "Ortsfaktor", 48, y0, 34, L.bf); g.fillStyle = L.fg; rt(g, `g ${P.eq === "≈" ? "=" : "≈"} ${P.gs} N/kg`, 290, y0, 42, L.bf, "left", 700);
    g.fillStyle = L.dim; rt(g, "Masse", 48, y0 + dy, 34, L.bf); g.fillStyle = L.fg; rt(g, "m = 3,0 kg", 290, y0 + dy, 42, L.bf, "left", 700);
    g.fillStyle = L.dim; rt(g, "Gewichtskraft", 48, y0 + dy * 2, 34, L.bf); g.fillStyle = L.fg; rt(g, "F_{G} = m · g", 290, y0 + dy * 2, 42, L.bf, "left", 700);
    g.fillStyle = L.acc; rt(g, `F_{G} = 3,0 kg · ${P.gs} N/kg ${P.eq} ${de(P.F)} N`, 48, y0 + dy * 3 + 10, 44, L.bf, "left", 700, false, 610);
    // Übersicht: Gewichtskraft auf 3 kg an allen drei Orten
    // Übersicht schmaler: die Werte rechts neben den Balken bleiben innerhalb des Rahmens
    const bx = 670, by = 150, bw = 226; g.fillStyle = L.dim; rt(g, "F_{G} (m = 3 kg):", bx, by - 6, 28, L.bf, "left", 600);
    LOC.forEach((Q, k) => { const yy = by + 46 + k * 56, on = k === i;
      g.fillStyle = on ? L.fg : L.dim; rt(g, Q.n, bx, yy, 28, L.bf, "left", on ? 700 : 500);
      g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(bx + 90, yy - 13, bw - 90, 26);
      g.fillStyle = on ? COL.G : "rgba(255,75,58,.45)"; g.fillRect(bx + 90, yy - 13, (bw - 90) * Q.F / 30, 26);
      g.fillStyle = on ? L.fg : L.dim; rt(g, de(Q.F) + " N", bx + bw + 8, yy, 26, L.bf, "left", on ? 700 : 500); });
    g.fillStyle = L.dim; rt(g, "Masse überall: 3,0 kg", bx, by + 46 + 3 * 56, 26, L.bf, "left", 600);
    g.fillStyle = L.acc2; rt(g, "Kraftpfeile: 10 cm ≙ 10 N", bx, by + 46 + 3 * 56 + 44, 26, L.bf, "left", 600, false, W - bx - 40);
    g.fillStyle = L.dim; rt(g, "Federkraftmesser: Gewichtskraft (ortsabhängig)  ·  Balkenwaage: Masse (überall gleich)", W / 2, H - 50, 25, L.bf, "center", 500, false, W - 100);
  });
  disp.position.set(0, DY, -.917); base.add(disp);
  const dispB = new T.Mesh(disp.geometry, disp.material); dispB.rotation.y = Math.PI; dispB.position.set(0, DY, -.994); base.add(dispB);   // Rückseite zeigt dasselbe
  const pult = screen(ctx, .66, .32, 512, (g, W, H, i = 0) => {
    g.fillStyle = w === "sterne" ? "#0a1a2c" : "#1d1712"; g.fillRect(0, 0, W, H);
    g.fillStyle = L.dim; g.textBaseline = "middle"; rt(g, "ORTSWAHL", W / 2, 26, 24, L.bf, "center", 700);
    LOC.forEach((Q, k) => { const x = 22 + k * 160, y = 50, on = k === i;
      g.fillStyle = on ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.04)"; g.beginPath(); g.roundRect(x, y, 148, 140, 18); g.fill();
      g.strokeStyle = on ? L.acc : "rgba(255,255,255,.18)"; g.lineWidth = on ? 6 : 2; g.stroke();
      if (on) { g.save(); g.shadowColor = Q.col; g.shadowBlur = 26; }
      g.fillStyle = on ? Q.col : "#55595e"; g.beginPath(); g.arc(x + 74, y + 52, 30, 0, TAU); g.fill(); if (on) g.restore();
      g.fillStyle = on ? L.fg : "#8b8f94"; rt(g, Q.n, x + 74, y + 112, 28, L.bf, "center", 700); });
  });
  pult.position.set(0, TOP + PUH + .025 + .02 * Math.cos(.45), 1.02 + .02 * Math.sin(.45)); pult.rotation.x = .45 - Math.PI / 2; base.add(pult);
  const GY = DY + .96;
  const globe = new T.Mesh(new T.SphereGeometry(.3, 48, 32), PM.erde); globe.position.set(0, GY, -.93); globe.rotation.z = .41; base.add(globe);
  const gHalo = ctx.glow(new T.Color(LOC[0].col), 1.3); gHalo.position.set(0, GY, -1.05); gHalo.material.opacity = .45; base.add(gHalo);
  let holo = null; if (w === "sterne") { holo = new T.Mesh(new T.TorusGeometry(.42, .007, 6, 72), ctx.mat("glow", {color: "#4FC3F7", intensity: 2})); holo.position.set(0, GY, -.93); holo.rotation.x = 1.2; base.add(holo); }
  const lamp = ctx.light(LOC[0].light, 3.4, 7, cx, 3.2, cz + 1.1);

  /* --- Federkraftmesser am Stativ --- */
  const fx = -.85, fz = .05, Y0 = 2.04, STR = .02, SG = .01;   // Nullmarke, Dehnung je Newton (m/N, Skala 0 … 30 N), Pfeilmaßstab 1 m ≙ 100 N
  const fk = new T.Group(); ctx.add(fk, cx + fx, 0, cz + fz);
  const bf = bucket(T), PZS = -.28;   // Stativstange hinter der Feder (verdeckt weder Anzeige noch Schriftring)
  bf.cyl(mStand, .03, .03, 2.44 - TOP, 12, 0, (2.44 + TOP) / 2, PZS); bf.box(mStand, .26, .04, .26, 0, TOP + .02, PZS - .02); bf.box(mStand, .04, .04, -PZS + .04, 0, 2.42, PZS / 2);
  bf.cyl(mTrim, .045, .045, .07, 14, 0, 2.42, PZS);
  bf.box(mTrim, .07, .09, .07, 0, 2.42, 0); bf.put(mTrim, new T.TorusGeometry(.028, .006, 6, 16), 0, 2.355, 0);
  bf.cyl(mTrim, .062, .062, .045, 20, 0, 2.285, 0); bf.cyl(mTrim, .06, .06, .03, 20, 0, 1.24, 0);
  bf.cyl(ctx.mat("glass", {opacity: .2}), .052, .052, 1.02, 24, 0, 1.75, 0);
  bf.box(mFrame, .23, .74, .02, .17, 1.72, -.02);
  bf.build(fk);
  const strip = screen(ctx, .2, .7, 448, (g, W, H) => {
    g.fillStyle = "#f6f0e2"; g.fillRect(0, 0, W, H); g.fillStyle = "#222"; g.textBaseline = "middle";
    for (let n = 0; n <= 30; n++) { const y = (2.07 - (Y0 - n * STR)) / .7 * H, big = n % 5 === 0; g.fillRect(0, y - (big ? 2 : 1), big ? 46 : 26, big ? 4 : 2);
      if (big) { g.font = `700 30px ${L.bf}`; g.textAlign = "left"; g.fillText(String(n), 54, y); } }
    g.font = `700 28px ${L.bf}`; g.textAlign = "center"; g.fillStyle = "#b3261e"; g.fillText("N", W - 22, H - 18);
  });
  strip.position.set(.17, 1.72, -.008); fk.add(strip);
  const NC = 16, coils = new T.InstancedMesh(new T.TorusGeometry(.034, .0065, 6, 20), ctx.mat("steel"), NC); coils.castShadow = true; fk.add(coils);
  const hang = new T.Group(); fk.add(hang);
  const bh = bucket(T), mRed = ctx.mat("color", {color: "#c0392b", rough: .5});
  bh.cyl(mRed, .045, .045, .014, 20, 0, Y0, 0); bh.box(mRed, .09, .012, .012, .07, Y0, 0);
  bh.cyl(mStand, .007, .007, .62, 8, 0, Y0 - .31, 0); bh.put(mStand, new T.TorusGeometry(.024, .006, 6, 16), 0, Y0 - .635, 0);
  bh.build(hang);
  const MC = Y0 - .79;   // Schwerpunkt des Körpers (relativ zu hang)
  const bk = bucket(T), sBody = stencilMat(T, mBody, 1), sBand = stencilMat(T, mBand, 1);
  bk.cyl(sBody, .016, .016, .05, 10, 0, Y0 - .665, 0); bk.cyl(sBody, .09, .09, .2, 28, 0, MC, 0); bk.cyl(sBand, .092, .092, .03, 28, 0, MC - .065, 0);
  // Körper in eigener Gruppe mit Drehpunkt an der Aufhängung: Im Labor wächst/schrumpft er mit der Masse (gleiches Material: Volumen ~ Masse)
  const PIV = Y0 - .64, bodyG = new T.Group(), bodyI = new T.Group(); bodyG.position.y = PIV; bodyI.position.y = -PIV; bodyG.add(bodyI); hang.add(bodyG);
  bk.build(bodyI).forEach(m => stencilBody(m));
  const mLbl = ctx.text("3 kg", {size: .034, color: lblCol}); mLbl.position.set(0, MC + .058, .093); hang.add(mLbl);   // oberhalb des Schwerpunkts (frei von den Pfeilen)
  const aG = forceArrow(ctx, fk, COL.G, .022, 1), dotG = ghostDot(ctx, fk, "#ffe9a8", 1, .02);
  // Federkraft (blau): greift oben am Körper an und folgt der Dehnung – der Körper hängt erst ruhig, wenn sie so groß ist wie F_G
  const aF = ctx.arrow([0, 0, 0], [0, .1, 0], COL.seil, .02); fk.add(aF);
  const tF = tag(ctx, "F_{Feder}", COL.seil, .1); fk.add(tF);
  const tScale = tag(ctx, "Maßstab: 10 cm ≙ 10 N", "#ffe9a8", .075); fk.add(tScale);
  // Schild F_G: je Wert einmal erzeugt und wiederverwendet (Ortswechsel und Labor-Regler)
  const tagsG = new Map(); let tG = null;
  const setTagG = F => { const s = `F_{G} = ${de(F)} N`; if (tG) tG.visible = false; tG = tagsG.get(s);
    if (!tG) { tG = tag(ctx, s, COL.G, .11); fk.add(tG); tagsG.set(s, tG); } tG.visible = F > .05; };
  setTagG(LOC[0].F);

  /* --- Balkenwaage --- */
  const wx = .72, AR = .5, BY = 1.35;   // Waagbalken tiefer: Zeiger und Balken liegen von vorn unterhalb der Anzeige
  const bw = new T.Group(); ctx.add(bw, cx + wx, 0, cz + fz);
  const bb = bucket(T);
  bb.box(mFrame, .62, .05, .34, 0, TOP + .025, 0); bb.box(mTrim, .64, .012, .36, 0, TOP + .052, 0);
  bb.cyl(mStand, .03, .036, BY - TOP - .06, 14, 0, (BY + TOP) / 2, 0); bb.box(mTrim, .08, .06, .08, 0, BY - .03, 0);
  bb.put(mTrim, new T.TorusGeometry(.2, .006, 6, 24, Math.PI / 2), 0, BY, -.03, 0, 0, Math.PI / 4); bb.box(mRed, .008, .05, .01, 0, BY + .2, -.03);
  bb.build(bw);
  const beam = new T.Group(); beam.position.set(0, BY, 0); bw.add(beam);
  const bm = bucket(T);
  bm.box(mTrim, AR * 2 + .02, .035, .04, 0, 0, 0); bm.cyl(mTrim, .03, .03, .07, 16, 0, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) bm.put(mTrim, new T.TorusGeometry(.02, .005, 6, 14), s * AR, -.03, 0);
  bm.box(mRed, .012, .23, .008, 0, .12, .03);
  bm.build(beam);
  const pans = [-1, 1].map(s => { const p = new T.Group(); bw.add(p); const q = bucket(T), R = .18, dy = -.56;
    q.cyl(mStand, .012, .012, .1, 8, 0, -.05, 0); q.put(mStand, new T.TorusGeometry(.02, .004, 6, 12), 0, -.11, 0, Math.PI / 2);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + Math.PI / 2; q.rod(mStand, [0, -.11, 0], [Math.cos(a) * R, dy + .01, Math.sin(a) * R], .0035, 5); }
    q.cyl(mTrim, .19, .15, .025, 32, 0, dy, 0);
    if (s < 0) { q.cyl(mBody, .016, .016, .05, 10, 0, dy + .24, 0); q.cyl(mBody, .09, .09, .2, 28, 0, dy + .1125, 0); q.cyl(mBand, .092, .092, .03, 28, 0, dy + .0475, 0); }
    else for (const [x, r, h] of [[-.075, .068, .13], [.075, .056, .1]]) { q.cyl(ctx.mat("brass"), r, r, h, 24, x, dy + .0125 + h / 2, 0); q.cyl(ctx.mat("brass"), r * .45, r * .58, .045, 16, x, dy + .035 + h, 0); }   // Wägestücke 2 kg und 1 kg
    q.build(p);
    if (s < 0) { const t2 = ctx.text("3 kg", {size: .034, color: lblCol}); t2.position.set(0, dy + .1705, .093); p.add(t2); }
    else { const t2 = ctx.text("2 kg   1 kg", {size: .03, color: w === "sterne" ? "#fff4d0" : "#2a1a08"}); t2.position.set(0, dy + .07, .076); p.add(t2); }   // Messing: dunkle Schrift, in der Sterne-Welt (dunkler Stahl) hell
    return [p, s]; });
  const tM = tag(ctx, "Masse m = 3 kg", L.acc, .11); tM.position.set(0, BY - .17, .3); bw.add(tM);

  /* --- Bewegung --- */
  let e = LOC[0].F * STR, ev = 0, swap = 1, wob = 0, wobT = 9, fgLen = LOC[0].F * SG, fgFrom = fgLen, fgK = 1;
  let labM = null, labF = 0, li0 = 0;   // Labor: gewählte Masse (null = kein Labor), abgelesene Gewichtskraft, Ort vor dem Labor
  const Fnow = () => labM != null ? labF : LOC[li].F;
  const o3 = new T.Object3D();
  ctx.tick((dt, t) => {
    // Feder: gedämpfte Schwingung zur neuen Dehnung
    const tgt = Fnow() * STR; ev += (-(e - tgt) * 38 - ev * 3.2) * dt; e += ev * dt;
    const Ls = .18 + e;
    for (let k = 0; k < NC; k++) { o3.position.set(0, 2.22 - (k + .5) / NC * Ls, 0); o3.rotation.set(Math.PI / 2 + (k % 2 ? .16 : -.16), 0, 0); o3.updateMatrix(); coils.setMatrixAt(k, o3.matrix); }
    coils.instanceMatrix.needsUpdate = true;
    hang.position.y = -e;
    // Gewichtskraft: hängt nur von m und g ab (beim Ortswechsel kurz gleichmäßig überblenden) – sie schwingt NICHT mit
    if (fgK < 1) fgK = Math.min(1, fgK + dt * 2.2);
    fgLen = fgFrom + (Fnow() * SG - fgFrom) * sm(fgK);
    const bs = bodyG.scale.y, yc = PIV - .15 * bs - e, yTop = PIV - .05 * bs - e, lenF = Math.max(0, e) / STR * SG;   // Schwerpunkt und Oberkante des (ggf. skalierten) Körpers
    aG.set([0, yc, 0], [0, yc - fgLen, 0]); dotG.position.set(0, yc, 0);
    aF.set([0, yTop, 0], [0, yTop + lenF, 0]);
    // Schilder vor den Pfeilen (auch von der Seite frei): F_G links unten, F_Feder rechts darüber
    const yT = Math.max(.98, yc - fgLen * .5); tG.position.set(-.34, yT, .42); tScale.position.set(-.34, yT - .12, .42);
    tF.position.set(.3, Math.max(1.13, yTop + lenF * .5 + .1), .3);
    // Waage: kurzes Nachwippen, dann wieder waagrecht
    wobT += dt; const th = wob * Math.exp(-wobT * 1.7) * Math.sin(wobT * 7.5); beam.rotation.z = th;
    for (const [p, s] of pans) p.position.set(s * AR * Math.cos(th), BY + s * AR * Math.sin(th) - .03, 0);
    // Himmelskörper wechseln (schrumpfen – tauschen – wachsen)
    if (swap < 1) { const was = swap; swap = Math.min(1, swap + dt * 1.6);
      if (was < .5 && swap >= .5) { globe.material = PM[LOC[li].pm]; gHalo.material.color.set(LOC[li].col); if (lamp) lamp.color.setHex(LOC[li].light); }
      globe.scale.setScalar(swap < .5 ? Math.max(.001, 1 - sm(swap * 2)) : Math.max(.001, back((swap - .5) * 2))); }
    globe.rotation.y = t * .25; if (holo) { holo.rotation.z = t * .6; holo.position.y = GY + Math.sin(t * 1.3) * .03; }
    gHalo.material.opacity = .38 + .1 * Math.sin(t * 1.7);
  });
  const setLoc = i => { if (i === li) return; fgFrom = fgLen; fgK = 0; li = i; swap = 0; wob = .13; wobT = 0; disp.redraw(li); pult.redraw(li); setTagG(LOC[li].F); };
  const go = () => { if (labM == null) setLoc((li + 1) % 3); };   // während des Labors bleibt der Ort die Erde
  // Labor: Masse am Federkraftmesser einstellen – Körper, Federdehnung, F_G-Pfeil, Schild und Anzeige laufen mit; live(null) stellt alles zurück
  const labLive = v => {
    if (!v) { if (labM == null) return; labM = null; fgFrom = fgLen; fgK = 0; bodyG.scale.setScalar(1); bodyG.visible = mLbl.visible = true;
      if (li0 !== li) setLoc(li0); else { disp.redraw(li); setTagG(LOC[li].F); } return; }
    if (labM == null) { li0 = li; setLoc(0); }
    if (labM !== v.m) { fgFrom = fgLen; fgK = 0; }
    labM = v.m; labF = labF0(v.m);
    bodyG.scale.setScalar(Math.max(.001, Math.cbrt(v.m / 3))); bodyG.visible = v.m > 0; mLbl.visible = false;
    disp.redraw(0, v.m); setTagG(labF); };

  ctx.exhibit(base, {label: "Ortswahl: Erde · Mond · Mars", sub: "anklicken: Ort wechseln", title: "Masse und Gewichtskraft an verschiedenen Orten", onClick: go,
    get text(){ return [
      "Wir sind auf der **Erde**: Der Ortsfaktor beträgt **g = 9,81 N/kg**. Der Körper mit **m = 3,0 kg** hat die Gewichtskraft **F_{G} = m · g = 3,0 kg · 9,81 N/kg ≈ 29,4 N** – das zeigt der Federkraftmesser.\n\nDie Balkenwaage ist im Gleichgewicht: links der Körper, rechts Wägestücke mit zusammen 3 kg (2 kg + 1 kg). Klicke weiter, um auf den Mond zu reisen.",
      "Auf dem **Mond** ist der Ortsfaktor nur etwa **1,6 N/kg**. Der Federkraftmesser zeigt deshalb nur **F_{G} = 3,0 kg · 1,6 N/kg = 4,8 N** – rund ein Sechstel des Werts auf der Erde.\n\nDie **Masse** bleibt 3,0 kg: Die Balkenwaage ist weiterhin im Gleichgewicht, denn der kleinere Ortsfaktor wirkt auf beide Waagschalen gleich.",
      "Auf dem **Mars** beträgt der Ortsfaktor etwa **3,7 N/kg**, also **F_{G} = 3,0 kg · 3,7 N/kg = 11,1 N**.\n\nMerke: Die **Masse** (in kg) hängt nicht vom Ort ab, die **Gewichtskraft** (in N) schon. Die Masse bestimmst du mit der Balkenwaage, die Gewichtskraft mit dem Federkraftmesser."][li]; }});
  // fester Standpunkt schräg vor dem Federkraftmesser: Skala, Körper, beide Pfeile und die Anzeige dahinter im Blick (auch beim Labor)
  ctx.exhibit(fk, {label: "Federkraftmesser", sub: "anklicken: Körper anstoßen", title: "Der Federkraftmesser", stand: {x: cx - .5, z: cz + 2.45}, pitch: -.06, onClick: () => { ev -= Math.min(.9, LOC[li].F * STR * 6); },
    get text(){ const P = LOC[li]; return `Die Gewichtskraft des Körpers dehnt die Feder – je größer die Kraft, desto weiter. An der Skala liest du den Betrag in **Newton (N)** ab, hier auf ${P.n === "Erde" ? "der Erde" : P.n === "Mond" ? "dem Mond" : "dem Mars"}: **${de(P.F)} N**.\n\nDer rote Pfeil **F_{G}** beginnt im **Schwerpunkt**, zeigt senkrecht nach unten und bleibt gleich lang. Die blaue **Federkraft** ändert sich mit der Dehnung: Nach dem Anstoßen schwingt der Körper und hängt erst wieder ruhig, wenn beide Kräfte gleich groß sind.`; }});
  // Labor: verschiedene Massen anhängen, Gewichtskraft ablesen → F_G-m-Diagramm (Ursprungsgerade), Steigung = Ortsfaktor der Erde
  if (ctx.lab) ctx.lab(fk, {
    id: "gewicht", titel: "Wie hängt die Gewichtskraft von der Masse ab?",
    text: "Hänge auf der **Erde** Körper mit verschiedener **Masse m** an den Federkraftmesser und lies jeweils die **Gewichtskraft F_{G}** ab. Nimm mindestens fünf Messwerte auf, trage sie selbst ins F_{G}-m-Diagramm ein und bestimme daraus den **Ortsfaktor g**.",
    regler: [{id: "m", name: "Masse m", einheit: "kg", min: 0, max: 2, schritt: .1, wert: .5}],
    messe: v => ({F: labF0(v.m)}),
    anzeige: [{id: "F", name: "Gewichtskraft F_{G} (Federkraftmesser)", einheit: "N", stellen: 1}],
    achsen: {x: {id: "m", name: "m in kg", max: 2, teil: .25}, y: {id: "F", name: "F_{G} in N", max: 20, teil: 2.5}},
    punkte: 5, gerade: "ursprung",
    aufgabe: {frage: "Lies an deiner Geraden ein Wertepaar ab und berechne den Ortsfaktor g = F_{G} : m.", wert: 9.81, toleranz: .3, einheit: "N/kg",
      tipps: ["Wähle einen gut ablesbaren Punkt auf der Geraden, zum Beispiel ganz rechts bei m = 2,0 kg.", "Lies dazu die Gewichtskraft ab: Bei m = 2,0 kg ist F_{G} ≈ 19,6 N.",
        "g = F_{G} : m = 19,6 N : 2,0 kg – rechne aus. Einheit: 1 N : 1 kg = 1 N/kg."],
      loesung: "g = F_{G} : m = 19,6 N : 2,0 kg ≈ **9,8 N/kg** (genauer 9,81 N/kg) – für jeden Punkt der Geraden derselbe Wert. Die **Steigung** der Geraden ist der Ortsfaktor."},
    merke: "Die Messpunkte liegen auf einer **Ursprungsgeraden**: Die Gewichtskraft ist **proportional** zur Masse – doppelte Masse, doppelte Gewichtskraft. Der Quotient F_{G} : m ist an einem Ort immer gleich: Das ist der **Ortsfaktor**, auf der Erde **g = 9,81 N/kg**. Auf dem Mond wäre die Gerade viel flacher (g ≈ 1,6 N/kg).",
    live: (v, m) => labLive(v)
  });
  ctx.exhibit(bw, {label: "Balkenwaage", sub: "vergleicht Massen", title: "Die Balkenwaage", onClick: () => { wob = .16; wobT = 0; },
    text: "Die Balkenwaage vergleicht die Masse des Körpers mit Wägestücken: Sie steht im Gleichgewicht, wenn auf beiden Seiten gleich viel Masse liegt – hier **m = 3 kg**.\n\nAn jedem Ort wirkt derselbe Ortsfaktor auf **beide** Waagschalen. Deshalb zeigt die Balkenwaage auf Erde, Mond und Mars dieselbe Masse an."});
  ctx.obstacle(cx, cz, 1.72);
}

/* =====================================================================
   A: Kraftpfeil-Modell (links, Vorderseite zum Gang)
   ===================================================================== */
function exhibitA(ctx, L){
  const T = ctx.T, S = ctx.slots, w = ctx.world;
  const g = new T.Group(); ctx.add(g, S.A.x - .15, 0, S.A.z); g.rotation.y = Math.PI / 2;
  const PW = 2.6, PH = 1.7, PY = 1.65, PZ = -.38, HX = -.6, HY = 1.35, AZ = PZ + .045, K = .2, PX = 320;   // Brett, Haken (Angriffspunkt), Kästchen 0,2 m ≙ 10 N
  const mP = w === "sterne" ? ctx.mat("plastic", {color: "#d5dbe2"}) : ctx.mat(w === "detektiv" ? "darkwood" : "stone");
  const mT = w === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2}) : ctx.mat("brass"), mF = ctx.mat(w === "sterne" ? "metal" : "darkwood");
  const b = bucket(T);
  b.box(mP, 2.7, .5, .8, 0, .25, -.02); b.box(mF, 2.78, .04, .86, 0, .52, -.02); b.box(mT, 2.78, .02, .02, 0, .48, .41);
  for (const s of [-1, 1]) b.box(mF, .07, PY + PH / 2 + .04 - .54, .07, s * (PW / 2 + .035), (PY + PH / 2 + .04 + .54) / 2, PZ - .02);
  b.box(mF, PW + .14, .07, .07, 0, PY + PH / 2 + .02, PZ - .02); b.box(mF, PW + .14, .05, .06, 0, PY - PH / 2 - .01, PZ - .02);
  // Konsole mit Körper: Truhe / Frachtkiste / Holzkiste, Haken als Angriffspunkt
  const cX = HX - .25, cZ = PZ + .25;
  // Konsole: Streben laufen bis an das untere Querholz des Rahmens
  b.box(mF, .66, .05, .52, cX, HY - .275, cZ); for (const x of [cX - .22, cX + .22]) b.rod(mF, [x, HY - .3, cZ + .2], [x, PY - PH / 2 - .01, PZ - .02], .022, 6);
  if (w === "sterne") { b.box(ctx.mat("metal"), .5, .5, .5, cX, HY, cZ); b.box(ctx.mat("glow", {color: "#FFE81F", intensity: 1}), .51, .05, .51, cX, HY + .12, cZ); b.box(ctx.mat("plastic", {color: "#2a3442"}), .52, .06, .52, cX, HY - .22, cZ); }
  else { b.box(ctx.mat("wood"), .5, .5, .5, cX, HY, cZ);   // helles Holz: hebt sich vom Rahmen ab
    const band = ctx.mat(w === "detektiv" ? "darkwood" : "brass"); for (const y of [-.17, .17]) b.box(band, .515, .05, .515, cX, HY + y, cZ); b.box(band, .05, .515, .515, cX, HY, cZ); }
  b.cyl(ctx.mat("brass"), .02, .02, .05, 10, HX + .02, HY, AZ, 0, 0, Math.PI / 2); b.put(ctx.mat("brass"), new T.TorusGeometry(.03, .007, 6, 16), HX + .065, HY, AZ);
  b.build(g);
  // Zeichenbrett mit Kästchen (Raster läuft durch den Angriffspunkt)
  const ox = (HX + PW / 2) * PX, oy = (PH / 2 - (HY - PY)) * PX, box = L.scan ? "rgba(6,24,42,.88)" : "rgba(255,250,235,.9)";
  const ST = [{F: 30, dx: 1, dy: 0}, {F: 50, dx: 1, dy: 0}, {F: 50, dx: .6, dy: .8}];
  let si = 0;
  const board = screen(ctx, PW, PH, 832, (c, W, H, i = 0) => {
    sheet(c, W, H, L, ox % (K * PX), oy % (K * PX), K * PX); const P = ST[i];
    // Titel und Anleitung (oben links – frei vom Pfeil)
    c.textBaseline = "middle"; c.fillStyle = box; c.beginPath(); c.roundRect(14, 14, 320, 182, 14); c.fill();
    c.fillStyle = L.ink; rt(c, "Der Kraftpfeil", 30, 50, 42, L.tf, "left", 700, false, 290);
    ["1. Angriffspunkt markieren", "2. Richtung festlegen", "3. Länge nach Maßstab"].forEach((t2, k) => { c.fillStyle = L.ink; rt(c, t2, 30, 100 + k * 34, 24, L.bf, "left", 600, false, 290); });
    // Maßstab und Rechnung (unten rechts)
    const bw2 = 410; c.fillStyle = box; c.beginPath(); c.roundRect(W - 14 - bw2, H - 118, bw2, 104, 14); c.fill();
    c.strokeStyle = COL.zug; c.lineWidth = 5; c.strokeRect(W - bw2, H - 102, 30, 30);
    c.fillStyle = L.ink; rt(c, "Maßstab: 1 Kästchen ≙ 10 N", W - bw2 + 44, H - 86, 25, L.bf, "left", 700, false, bw2 - 64);
    rt(c, `Betrag: ${P.F / 10} Kästchen · 10 N = ${P.F} N`, W - bw2, H - 40, 25, L.bf, "left", 700, false, bw2 - 30);
  });
  board.position.set(0, PY, PZ); g.add(board);
  const plate = screen(ctx, 1.7, .26, 1024, (c, W, H) => { c.fillStyle = w === "sterne" ? "#0e1726" : "#2a1d12"; c.fillRect(0, 0, W, H);
    c.strokeStyle = L.acc; c.lineWidth = 6; c.strokeRect(10, 10, W - 20, H - 20); c.fillStyle = L.acc; c.textBaseline = "middle";
    rt(c, "Angriffspunkt  ·  Richtung  ·  Betrag", W / 2, H / 2 + 2, 50, L.bf, "center", 700, false, W - 70); });
  plate.position.set(0, .26, .383); g.add(plate);
  // Pfeil, Angriffspunkt, Beschriftungen
  const a0 = new T.Vector3(HX, HY, AZ), arrow = ctx.arrow(a0, [HX + .6, HY, AZ], COL.zug, .036); g.add(arrow);
  const dot = ctx.sphere(.03, ctx.mat("glow", {color: "#ffe9a8", intensity: 2.4}), 12); dot.position.copy(a0); g.add(dot);
  const dHalo = ctx.glow(0xffd27a, .22); dHalo.position.copy(a0); g.add(dHalo);
  const tA = tag(ctx, "Angriffspunkt", "#ffe9a8", .11); tA.position.set(HX - .22, HY + .37, cZ + .3); g.add(tA);
  const tR = tag(ctx, "Richtung", COL.zug, .11); g.add(tR);
  const tagsB = ST.map(P => { const s = tag(ctx, `Betrag: ${P.F} N`, COL.zug, .11); s.visible = false; g.add(s); return s; });
  let cur = {F: 30, a: 0}, from = {...cur}, k = 1, pulse = 0;
  const place = () => { const P = ST[si], F = from.F + (P.F - from.F) * sm(k), a = from.a + (Math.atan2(P.dy, P.dx) - from.a) * sm(k), Lm = F / 10 * K;
    const ux = Math.cos(a), uy = Math.sin(a), tip = [HX + ux * Lm, HY + uy * Lm, AZ]; arrow.set(a0, tip); cur = {F, a};
    tR.position.set(tip[0] + (uy > .3 ? .3 : .34), tip[1] + (uy > .3 ? .05 : .02), AZ + .15);
    tagsB.forEach((s, j) => { s.visible = j === si; s.position.set(HX + ux * Lm * .5 + uy * .36, HY + uy * Lm * .5 - ux * .17, AZ + .15); }); };
  place();
  ctx.tick((dt, t) => { if (k < 1) { k = Math.min(1, k + dt * 1.1); place(); } pulse = Math.max(0, pulse - dt);
    dHalo.scale.setScalar(.22 + .06 * Math.sin(t * 3) + pulse * .5); });
  ctx.obstacleBox(S.A.x - .15, S.A.z, .9, 2.9);
  // fester Standpunkt frontal vor dem Brett (sonst steht man nach dem Klick vom Eingang oder einer Station aus schräg daneben)
  ctx.exhibit(g, {label: "Kraftpfeil-Modell", sub: "anklicken: Kraft ändern", title: "Der Kraftpfeil", stand: {x: S.A.x + 2.3, z: S.A.z},
    onClick: () => { from = {...cur}; si = (si + 1) % 3; k = 0; pulse = 1; board.redraw(si); },
    get text(){ return [
      "Eine Kraft stellst du mit einem **Kraftpfeil** dar: Er beginnt im **Angriffspunkt** (hier am Haken der Kiste), zeigt in **Richtung** der Kraft, und seine **Länge** gibt den **Betrag** an.\n\nMaßstab: 1 Kästchen ≙ 10 N. Der Pfeil ist 3 Kästchen lang, also **F = 3 · 10 N = 30 N**.",
      "Jetzt zieht die Kraft stärker: Der Pfeil ist **5 Kästchen** lang, also **F = 5 · 10 N = 50 N**.\n\nAngriffspunkt und Richtung sind gleich geblieben – nur der **Betrag** hat sich geändert.",
      "Gleicher Betrag (**50 N**), aber eine andere **Richtung**: Der Pfeil zeigt schräg nach rechts oben. Er ist wieder 5 Kästchen lang – miss entlang des Pfeils, nicht nur waagrecht!\n\nEine Kraft ist erst vollständig beschrieben, wenn **Angriffspunkt, Richtung und Betrag** bekannt sind."][si]; }});
}

/* =====================================================================
   B: Tauziehen (rechts hinten)
   ===================================================================== */
function exhibitB(ctx, L){
  const T = ctx.T, S = ctx.slots, w = ctx.world, RY = .95, SCL = .001;   // Seilhöhe, Maßstab 1 m ≙ 1000 N
  const g = new T.Group(); ctx.add(g, S.B.x + .15, 0, S.B.z); g.rotation.y = -Math.PI / 2;
  const b = bucket(T);
  const mMat = w === "sterne" ? ctx.mat("plastic", {color: "#2a3442"}) : w === "detektiv" ? ctx.mat("wood") : ctx.mat("cloth", {color: "#2d4a2c"});
  const mPost = ctx.mat(w === "sterne" ? "steel" : "darkwood"), mT = w === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2}) : ctx.mat("brass");
  const MAT = 4.0;   // Matte so lang, dass auch die dritte Person rechts darauf steht
  b.box(mMat, MAT, .05, 1.15, 0, .025, 0); b.box(mT, MAT + .02, .015, .02, 0, .05, .58);
  b.box(ctx.mat("color", {color: "#f2efe6", rough: .6}), .05, .006, 1.05, 0, .053, 0);
  for (const s of [-1, 1]) b.box(ctx.mat("color", {color: s < 0 ? COL.f1 : COL.f2, rough: .5}), .04, .006, 1.05, s * .4, .053, 0);
  for (const s of [-1, 1]) { b.box(mPost, .08, 2.5, .08, s * 1.42, 1.25, -.52); b.box(mPost, .3, .06, .3, s * 1.42, .03 + .05, -.52); }
  b.box(mPost, 2.98, .92, .05, 0, 2.06, -.56); b.box(mT, 3.0, .03, .08, 0, 2.53, -.54);
  b.build(g);
  const ST = [{L: [200, 200], R: [200, 200], sc: [1, 1]}, {L: [200, 200], R: [200, 200, 200], sc: [1, 1]}, {L: [350, 250], R: [200, 200, 200], sc: [1.14, 1]}];
  const sum = a => a.reduce((x, y) => x + y, 0), list = a => a.every(v => v === a[0]) ? `${a.length} · ${a[0]} N` : a.join(" N + ") + " N";
  let si = 0;
  const sign = screen(ctx, 2.8, .82, 1024, (c, W, H, i = 0, won = false) => { const P = ST[i], FL = sum(P.L), FR = sum(P.R), d = FR - FL;
    dark(c, W, H, L); c.textBaseline = "middle";
    c.fillStyle = L.acc; rt(c, "Tauziehen", W / 2, 50, 44, L.tf, "center", 700);
    c.fillStyle = COL.f1; rt(c, "← links", 50, 50, 30, L.bf, "left", 700); rt(c, `${list(P.L)} = ${FL} N`, 50, 112, 36, L.bf, "left", 700, false, W / 2 - 80);
    c.fillStyle = COL.f2; rt(c, "rechts →", W - 50, 50, 30, L.bf, "right", 700); rt(c, `${list(P.R)} = ${FR} N`, W - 50, 112, 36, L.bf, "right", 700, false, W / 2 - 80);
    c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(40, 150, W - 80, 3);
    c.fillStyle = COL.res; rt(c, d === 0 ? `F_{res} = ${FR} N − ${FL} N = 0 N  →  Kräftegleichgewicht` : `F_{res} = ${Math.max(FL, FR)} N − ${Math.min(FL, FR)} N = ${Math.abs(d)} N nach ${d > 0 ? "rechts" : "links"}`, W / 2, 205, 40, L.bf, "center", 700, false, W - 90);
    if (won) { c.fillStyle = L.acc; rt(c, `${d > 0 ? "Rechts" : "Links"} gewinnt! Die Markierung hat die ${d > 0 ? "blaue" : "orange"} Linie erreicht.`, W / 2, 258, 32, L.bf, "center", 700, false, W - 90); }
    else { c.fillStyle = L.dim; rt(c, "gleiche Richtung: addieren  ·  entgegengesetzt: subtrahieren  ·  Maßstab: 1 dm ≙ 100 N", W / 2, 258, 26, L.bf, "center", 500, false, W - 90); }
  });
  sign.redraw(0); sign.position.set(0, 2.06, -.53); g.add(sign);
  // Seil mit Markierung
  const rope = new T.Group(); rope.position.y = RY; g.add(rope);   // Ursprung auf der Seilachse (zum Ein-/Ausblenden skalierbar)
  const rb = bucket(T), mRope = ctx.mat("color", {color: w === "sterne" ? "#d8dee6" : "#b59a6a", rough: 1});
  rb.cyl(mRope, .022, .022, 3.5, 10, 0, 0, 0, 0, 0, Math.PI / 2);
  rb.put(ctx.mat("color", {color: "#c0392b", rough: .8}), new T.TorusGeometry(.04, .016, 8, 18), 0, 0, 0, 0, Math.PI / 2);
  rb.box(ctx.mat("cloth", {color: "#c0392b"}), .05, .26, .012, 0, -.15, 0, 0, 0, .06);
  rb.build(rope);
  // Figuren (instanziert): Beine, Rumpf, Kopf, Arme, Hüte
  const team = w === "sterne" ? {L: "#d99a3a", R: "#3b82c4", leg: "#2a3442", hat: null} : w === "detektiv" ? {L: "#7a4e2c", R: "#34465e", leg: "#2a2420", hat: "#2c241c"} : {L: "#8a1f2c", R: "#2a4f86", leg: "#2a2420", hat: "cone"};
  const skin = "#e2b791", mF = new T.MeshStandardMaterial({color: 0xffffff, roughness: .78});
  const IM = (geo, n) => { const m = new T.InstancedMesh(geo, mF, n); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const legs = IM(new T.CylinderGeometry(.045, .055, 1, 8), 12), torso = IM(new T.CylinderGeometry(.11, .145, .5, 14), 6), head = IM(new T.SphereGeometry(.1, 16, 12), 6),
        arms = IM(new T.CylinderGeometry(.03, .034, 1, 8), 12),
        hats = IM(team.hat === "cone" ? new T.ConeGeometry(.11, .28, 14) : team.hat ? new T.CylinderGeometry(.115, .125, .06, 14) : new T.SphereGeometry(.112, 14, 10, 0, TAU, 0, 1.2), 6),
        feet = IM(new T.BoxGeometry(.15, .06, .085), 12);
  const figs = []; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) figs.push({s, k, on: k < 2 ? 1 : 0, sc: 1});
  const cc = new T.Color();
  figs.forEach((f, i) => { const tc = f.s < 0 ? team.L : team.R; torso.setColorAt(i, cc.set(tc)); head.setColorAt(i, cc.set(skin));
    hats.setColorAt(i, cc.set(team.hat === "cone" ? (f.s < 0 ? "#5a1520" : "#1b355c") : team.hat ? team.hat : "#e8eef4"));
    for (const j of [0, 1]) { legs.setColorAt(i * 2 + j, cc.set(team.leg)); arms.setColorAt(i * 2 + j, cc.set(tc)); feet.setColorAt(i * 2 + j, cc.set("#1c1714")); } });
  const M = new T.Matrix4(), Mf = new T.Matrix4(), Mp = new T.Matrix4(), q = new T.Quaternion(), qf = new T.Quaternion(), up = new T.Vector3(0, 1, 0), vS = new T.Vector3(), vP = new T.Vector3(), vD = new T.Vector3(), vA = new T.Vector3(), vB = new T.Vector3();
  const segM = (a, c, r = 1) => { vD.copy(c).sub(a); const len = vD.length(); q.setFromUnitVectors(up, vD.divideScalar(len)); return Mp.compose(vP.copy(a).add(c).multiplyScalar(.5), q, vS.set(r, len, r)); };
  const rot = (x, y, l) => [x * Math.cos(l) - y * Math.sin(l), x * Math.sin(l) + y * Math.cos(l)];
  // Pfeile und Werte
  const aL = ctx.arrow([0, RY, .2], [-.4, RY, .2], COL.f1, .028), aR = ctx.arrow([0, RY, .2], [.4, RY, .2], COL.f2, .028), aRes = ctx.arrow([0, 1.4, .2], [.2, 1.4, .2], COL.res, .032);
  g.add(aL, aR, aRes);
  const mk = (s, c) => { const t2 = tag(ctx, s, c, .1); g.add(t2); return t2; };
  const vals = {}; const tagFor = (s, c) => vals[s + c] || (vals[s + c] = mk(s, c));
  let tL = null, tR = null, tRes = null;
  // vs = gezeigter Zustand (wechselt erst beim Neuaufstellen), si = Zustand für den Infotext (wechselt sofort beim Klick)
  let vs = 0, off = 0, vel = 0, fl = [400, 400], ph = "rest", pt = 0, vis = 1, pull = 1;
  const setTags = () => { const P = ST[vs], FL = sum(P.L), FR = sum(P.R), d = FR - FL; for (const k2 in vals) vals[k2].visible = false;
    tL = tagFor(`${FL} N`, COL.f1); tR = tagFor(`${FR} N`, COL.f2); tRes = tagFor(d ? `F_{res} = ${Math.abs(d)} N` : "F_{res} = 0 N", COL.res); };
  setTags();
  // Neuaufstellen: Figuren sind ausgeblendet, Seil zurück zur Mitte, neue Mannschaften
  const restart = () => { vs = si; off = 0; vel = 0; pull = 1; const P = ST[vs]; fl = [sum(P.L), sum(P.R)];
    figs.forEach(f => { f.on = (f.s < 0 ? f.k < P.L.length : f.k < P.R.length) ? 1 : 0; f.sc = f.s < 0 ? (P.sc[f.k] || 1) : 1; });
    sign.redraw(vs, false); setTags(); };
  ctx.tick((dt, t) => {
    const P = ST[vs], FL = sum(P.L), FR = sum(P.R), d = FR - FL; pt += dt;
    if (ph === "out") { vis = 1 - sm(pt / .35); if (pt >= .35) { restart(); ph = "in"; pt = 0; vis = 0; } }
    else if (ph === "in") { vis = sm(pt / .45); if (pt >= .45) { vis = 1; ph = d ? "wait" : "rest"; pt = 0; } }
    else if (ph === "wait") { if (pt >= .4) { ph = "pull"; pt = 0; } }
    // F_res ≠ 0: das Seil wird immer schneller, bis die Markierung die farbige Linie erreicht
    else if (ph === "pull") { vel += Math.sign(d) * .32 * dt; off += vel * dt; if (Math.abs(off) >= .4) { ph = "won"; pt = 0; sign.redraw(vs, true); } }
    // Spiel vorbei: beide hören auf zu ziehen, die Füße bremsen das Seil ab
    else if (ph === "won") { vel *= Math.exp(-dt * 5); off += vel * dt; pull = Math.max(0, pull - dt * 1.6); }
    // ph === "rest" (F_res = 0): Kräftegleichgewicht – das Seil bleibt, wo es ist
    rope.position.x = off; rope.scale.set(1, Math.max(.001, vis), Math.max(.001, vis));
    figs.forEach((f, i) => {
      const win = d === 0 ? 0 : Math.sign(d) === f.s ? 1 : -1, lean = .12 + ((.22 + .1 * win) + .035 * Math.sin(t * 3.2 + i * 1.7)) * pull;
      const x = f.s * (.7 + .36 * f.k) + off, s = Math.max(.001, f.on * vis) * f.sc;
      qf.setFromAxisAngle(up, f.s < 0 ? 0 : Math.PI); Mf.compose(vA.set(x, 0, 0), qf, vB.set(s, s, s));
      const hip = [0, .55], yr = RY / f.sc;
      const P2 = (px, py) => { const [rx, ry] = rot(px, py, lean); return [hip[0] + rx, hip[1] + ry]; };
      const [tx, ty] = P2(0, .25), [hx, hy] = P2(0, .63), [sx, sy] = P2(0, .45), [cx2, cy2] = P2(0, .74);
      // Rumpf, Kopf, Hut
      q.setFromAxisAngle(new T.Vector3(0, 0, 1), lean); M.multiplyMatrices(Mf, Mp.compose(vP.set(tx, ty, 0), q, vS.set(1, 1, 1))); torso.setMatrixAt(i, M);
      M.multiplyMatrices(Mf, Mp.compose(vP.set(hx, hy, 0), q, vS.set(1, 1, 1))); head.setMatrixAt(i, M);
      const hs = team.hat ? 1 : 1.0; M.multiplyMatrices(Mf, Mp.compose(vP.set(...(team.hat === "cone" ? P2(0, .8) : team.hat ? P2(0, .7) : P2(0, .64)), 0), q, vS.set(hs, hs, hs))); hats.setMatrixAt(i, M);
      // Beine: vorderes Bein zum Seil hin gestemmt
      M.multiplyMatrices(Mf, segM(vA.set(0, .55, .08), vB.set(.3, .02, .1), 1)); legs.setMatrixAt(i * 2, M);
      M.multiplyMatrices(Mf, segM(vA.set(0, .55, -.08), vB.set(-.06, .02, -.1), 1)); legs.setMatrixAt(i * 2 + 1, M);
      q.identity(); M.multiplyMatrices(Mf, Mp.compose(vP.set(.34, .03, .1), q, vS.set(1, 1, 1))); feet.setMatrixAt(i * 2, M);
      M.multiplyMatrices(Mf, Mp.compose(vP.set(-.02, .03, -.1), q, vS.set(1, 1, 1))); feet.setMatrixAt(i * 2 + 1, M);
      // Arme zum Seil
      M.multiplyMatrices(Mf, segM(vA.set(sx, sy, .15), vB.set(sx + .3, yr, .035), 1)); arms.setMatrixAt(i * 2, M);
      M.multiplyMatrices(Mf, segM(vA.set(sx, sy, -.15), vB.set(sx + .44, yr, -.035), 1)); arms.setMatrixAt(i * 2 + 1, M);
      void cx2; void cy2;
    });
    for (const m of [legs, torso, head, arms, hats, feet]) m.instanceMatrix.needsUpdate = true;
    const k0 = off, kf = pull * vis, fL = fl[0] * kf, fR = fl[1] * kf, dr = fR - fL;
    aL.set([k0, RY, .2], [k0 - fL * SCL, RY, .2]); aR.set([k0, RY, .2], [k0 + fR * SCL, RY, .2]); aRes.set([k0, 1.4, .2], [k0 + dr * SCL, 1.4, .2]);
    tL.visible = tR.visible = tRes.visible = kf > .5;
    tL.position.set(k0 - fL * SCL - .2, RY + .16, .25); tR.position.set(k0 + fR * SCL + .2, RY + .16, .25); tRes.position.set(k0 + dr * SCL * .5, 1.58, .25);
  });
  // Kollision: Matte und alle Figuren (die dritte Person rechts lehnt sich bis ≈ 2,3 m über die Mitte hinaus)
  ctx.obstacleBox(S.B.x + .15, S.B.z + .18, 1.2, 4.5);
  ctx.exhibit(g, {label: "Tauziehen", sub: "anklicken: Mannschaften ändern", title: "Tauziehen – Kräfte addieren und subtrahieren", stand: {x: S.B.x - 2.5, z: S.B.z},   // frontal vor Schild und Matte
    onClick: () => { si = (si + 1) % 3; if (ph !== "out") { ph = "out"; pt = 0; } },
    get text(){ return [
      "Beide Mannschaften ziehen mit **400 N** (je 2 · 200 N) in **entgegengesetzte** Richtungen am Seil. Die resultierende Kraft ist **F_{res} = 400 N − 400 N = 0 N**.\n\nDas ist ein **Kräftegleichgewicht**: Das Seil bleibt in Ruhe.",
      "Rechts zieht eine dritte Person mit: Kräfte in **gleicher Richtung** werden addiert, **3 · 200 N = 600 N**.\n\nEntgegengesetzte Kräfte werden subtrahiert: **F_{res} = 600 N − 400 N = 200 N**. Die Resultierende zeigt in Richtung der größeren Kraft: Das Seil wird nach rechts immer schneller, bis die Markierung die blaue Linie erreicht – **rechts gewinnt**.",
      "Links ziehen zwei unterschiedlich starke Personen: **350 N + 250 N = 600 N**. Rechts sind es **3 · 200 N = 600 N**.\n\nBeide Seiten sind gleich stark, also **F_{res} = 0 N** – wieder ein Kräftegleichgewicht, obwohl links weniger Personen ziehen."][si]; }});
}

/* =====================================================================
   C: Kräfteparallelogramm (rechts vorne)
   ===================================================================== */
function exhibitC(ctx, L){
  const T = ctx.T, S = ctx.slots, w = ctx.world;
  const g = new T.Group(); ctx.add(g, S.C.x + .35, 0, S.C.z); g.rotation.y = -Math.PI / 2;
  const BW = 3.2, BH = 2.2, BY = 1.65, RX = -.6, RY = -.3, SC = .2, PX = 320, D1 = .95, D1a = .85, D3 = .55;   // D1a: Kraftmesser für F_1 näher am Ring (ragt bei 90° nicht über den Rahmen)
  const mF = ctx.mat(w === "sterne" ? "metal" : "darkwood"), mT = w === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2}) : ctx.mat("brass");
  const b = bucket(T);
  for (const s of [-1, 1]) { b.box(mF, .08, BY + BH / 2 + .1, .08, s * 1.25, (BY + BH / 2 + .1) / 2, -.07); b.box(mF, .1, .06, .8, s * 1.25, .03, -.07); }
  b.box(mF, BW + .16, .08, .08, 0, BY + BH / 2 + .04, -.02); b.box(mF, BW + .16, .08, .08, 0, BY - BH / 2 - .04, -.02);
  for (const s of [-1, 1]) b.box(mF, .08, BH + .16, .08, s * (BW / 2 + .04), BY, -.02);
  b.box(mF, BW + .1, .04, .16, 0, BY - BH / 2 - .1, .06); b.box(mT, BW + .18, .02, .02, 0, BY + BH / 2 + .09, .02);
  b.build(g);
  const cvX = bx => (bx + BW / 2) * PX, cvY = by => (BH / 2 - by) * PX, rcx = cvX(RX), rcy = cvY(RY);
  const vec = a => [Math.cos(a), Math.sin(a)];
  const ANG = [90, 120, 60]; let ai = 0, aCur = 90, aFrom = 90, kA = 1, p = 1, pR = 1;
  const res = a => { const r = a * Math.PI / 180, x = 4 + 3 * Math.cos(r), y = 3 * Math.sin(r); return {F: Math.hypot(x, y), phi: Math.atan2(y, x)}; };
  // Rasterpapier einmal in eine Zwischenfläche zeichnen – während der Animation wird es nur noch kopiert
  let bg = null;
  const board = screen(ctx, BW, BH, 1024, (c, W, H, aDeg = 90, pp = 1, pr = 1) => {
    if (!bg || bg.width !== W || bg.height !== H) { bg = document.createElement("canvas"); bg.width = W; bg.height = H; sheet(bg.getContext("2d"), W, H, L, rcx % (SC * PX), rcy % (SC * PX), SC * PX); }
    c.drawImage(bg, 0, 0);
    const a = aDeg * Math.PI / 180, R = res(aDeg), u1 = vec(a), k = SC * PX, t1 = [rcx + u1[0] * 3 * k, rcy - u1[1] * 3 * k], t2 = [rcx + 4 * k, rcy];
    c.textBaseline = "middle";
    // Titel
    c.fillStyle = L.scan ? "rgba(6,24,42,.85)" : "rgba(255,250,235,.88)"; c.beginPath(); c.roundRect(W - 440, 18, 420, 112, 16); c.fill();
    c.fillStyle = L.ink; rt(c, "Kräfteparallelogramm", W - 230, 52, 42, L.tf, "center", 700, false, 390); c.fillStyle = L.inkDim; rt(c, "Maßstab: 1 Kästchen ≙ 1 N", W - 230, 100, 28, L.bf, "center", 600, false, 390);
    // Winkel
    c.strokeStyle = L.dash; c.lineWidth = 4;
    if (Math.abs(aDeg - 90) < .6) { const s = 34; c.beginPath(); c.moveTo(rcx + s, rcy); c.lineTo(rcx + s, rcy - s); c.lineTo(rcx, rcy - s); c.stroke(); c.fillStyle = L.dash; c.beginPath(); c.arc(rcx + s * .5, rcy - s * .5, 4, 0, TAU); c.fill(); }
    else { c.beginPath(); c.arc(rcx, rcy, 62, -a, 0); c.stroke(); }
    // Winkelzahl zwischen F_1 und der Resultierenden (nicht unter den 3D-Pfeilen)
    const aL2 = (a + R.phi) / 2, rL = 124; halo(c, `${Math.round(aDeg)}°`, rcx + Math.cos(aL2) * rL, rcy - Math.sin(aL2) * rL, 30, L.bf, L.ink, L, "center");
    // Parallelogramm (gestrichelt)
    if (pp > 0) { c.setLineDash([16, 12]); c.lineWidth = 5; c.strokeStyle = L.dash; c.globalAlpha = .85;
      c.beginPath(); c.moveTo(t1[0], t1[1]); c.lineTo(t1[0] + 4 * k * pp, t1[1]); c.stroke();
      c.beginPath(); c.moveTo(t2[0], t2[1]); c.lineTo(t2[0] + u1[0] * 3 * k * pp, t2[1] - u1[1] * 3 * k * pp); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
    // Beschriftungen
    // seitlich genug vom Seil des F_1-Kraftmessers abgerückt (bei 60°/120° lief das Seil sonst durch den Schriftzug)
    halo(c, "F_{1} = 3 N", t1[0] + (u1[0] < -.2 ? -34 : 34), t1[1] - 30, 34, L.bf, COL.f1, L, u1[0] < -.2 ? "right" : "left");
    halo(c, "F_{2} = 4 N", t2[0] - 60, t2[1] + 40, 34, L.bf, COL.f2, L, "center");
    if (pr > .98) { const cr = [rcx + Math.cos(R.phi) * R.F * k, rcy - Math.sin(R.phi) * R.F * k];
      halo(c, `F_{res} ${Math.abs(aDeg - 90) < .6 ? "=" : "≈"} ${de(R.F)} N`, cr[0] + 24, cr[1] - 26, 38, L.bf, COL.res, L, "left");
      // F_3 neben dem dritten Kraftmesser (unten rechts von ihm), immer innerhalb des Bretts
      const u3 = vec(R.phi + Math.PI), mid = D3 + .27, nx = -u3[1], ny = u3[0], sgn = -ny > 0 ? 1 : -1;
      const e3x = Math.max(16, Math.min(W - 230, rcx + u3[0] * mid * PX + nx * 58 * sgn)), e3y = Math.max(40, Math.min(H - 30, rcy - u3[1] * mid * PX - ny * 58 * sgn));
      halo(c, `F_{3} = ${de(R.F)} N`, e3x, e3y, 28, L.bf, L.inkDim, L, "left");
      c.fillStyle = L.scan ? "rgba(6,24,42,.85)" : "rgba(255,250,235,.88)"; c.beginPath(); c.roundRect(W - 520, H - 92, 500, 72, 14); c.fill();
      c.fillStyle = L.ink; rt(c, `Diagonale abgemessen: ${de(R.F)} Kästchen → ${de(R.F)} N`, W - 270, H - 56, 28, L.bf, "center", 700, false, 470); }
  });
  board.redraw(90, 1, 1); board.position.set(0, BY, 0); g.add(board);
  // Kraftmesser (Achse lokal +x: Haken bei 0, Gehäuse, Stift im Brett)
  const bf = new T.Group(); bf.position.set(0, BY, 0); g.add(bf);
  const ring = ctx.mesh(new T.TorusGeometry(.05, .012, 10, 28), ctx.mat("steel")); ring.position.set(RX, RY, .07); bf.add(ring);
  const unit = color => { const u = new T.Group(), q = bucket(T), hm = ctx.mat("plastic", {color});
    q.put(ctx.mat("steel"), new T.TorusGeometry(.022, .005, 6, 14), .022, 0, .07); q.cyl(ctx.mat("steel"), .006, .006, .08, 6, .08, 0, .07, 0, 0, Math.PI / 2);
    q.cyl(hm, .036, .036, .3, 16, .27, 0, .07, 0, 0, Math.PI / 2); q.cyl(ctx.mat("color", {color: "#f4efe2", rough: .5}), .037, .037, .12, 16, .24, 0, .07, 0, 0, Math.PI / 2);
    q.cyl(mT, .04, .04, .02, 16, .42, 0, .07, 0, 0, Math.PI / 2); q.cyl(mT, .016, .016, .06, 10, .45, 0, .04, Math.PI / 2);
    q.build(u); bf.add(u); return u; };
  const s1 = unit(COL.f1), s2 = unit(COL.f2), s3 = unit("#7d6aa8");
  const ropeGeo = new T.CylinderGeometry(.007, .007, 1, 6).rotateZ(-Math.PI / 2), mRope = ctx.mat("color", {color: w === "sterne" ? "#d8dee6" : "#b59a6a", rough: 1});
  const ropes = [0, 1, 2].map(() => { const r = new T.Mesh(ropeGeo, mRope); bf.add(r); return r; });
  const setRope = (r, a, d) => { r.position.set(RX + Math.cos(a) * d / 2, RY + Math.sin(a) * d / 2, .07); r.rotation.z = a; r.scale.set(d, 1, 1); };
  const a1 = ctx.arrow([0, 0, 0], [.1, 0, 0], COL.f1, .026), a2 = ctx.arrow([0, 0, 0], [.1, 0, 0], COL.f2, .026), aR = ctx.arrow([0, 0, 0], [.1, 0, 0], COL.res, .03);
  bf.add(a1, a2, aR);
  const pose = () => { const a = aCur * Math.PI / 180, R = res(aCur), Z = .1;
    s1.position.set(RX + Math.cos(a) * D1a, RY + Math.sin(a) * D1a, 0); s1.rotation.z = a; setRope(ropes[0], a, D1a);
    s2.position.set(RX + D1, RY, 0); s2.rotation.z = 0; setRope(ropes[1], 0, D1);
    const a3 = R.phi + Math.PI; s3.position.set(RX + Math.cos(a3) * D3, RY + Math.sin(a3) * D3, 0); s3.rotation.z = a3; setRope(ropes[2], a3, D3);
    a1.set([RX, RY, Z], [RX + Math.cos(a) * 3 * SC, RY + Math.sin(a) * 3 * SC, Z]); a2.set([RX, RY, Z], [RX + 4 * SC, RY, Z]);
    const Lr = R.F * SC * sm(pR); aR.set([RX, RY, Z + .01], [RX + Math.cos(R.phi) * Lr, RY + Math.sin(R.phi) * Lr, Z + .01]); };
  pose();
  ctx.tick(dt => {
    if (kA < 1) { kA = Math.min(1, kA + dt * 1.1); aCur = aFrom + (ANG[ai] - aFrom) * sm(kA); pose(); board.redraw(aCur, 0, 0); return; }
    if (p < 1) { p = Math.min(1, p + dt * 1.25); board.redraw(aCur, sm(p), 0); return; }
    if (pR < 1) { pR = Math.min(1, pR + dt * 1.6); pose(); if (pR >= 1) board.redraw(aCur, 1, 1); }
  });
  ctx.obstacleBox(S.C.x + .35, S.C.z, .95, 3.4);
  ctx.exhibit(g, {label: "Kräfteparallelogramm", sub: "anklicken: Winkel ändern", title: "Das Kräfteparallelogramm", stand: {x: S.C.x - 2.25, z: S.C.z},   // frontal, ganzes Brett im Blick
    onClick: () => { aFrom = aCur; ai = (ai + 1) % 3; kA = 0; p = 0; pR = 0; pose(); },
    get text(){ return {
      90: "Zwei Seile ziehen am Ring: **F_{1} = 3 N** und **F_{2} = 4 N**, der Winkel zwischen ihnen beträgt **90°**. Zeichne beide Pfeile vom Angriffspunkt aus und ergänze sie zum **Parallelogramm**.\n\nDie Diagonale ist die Resultierende: Sie ist 5 Kästchen lang, also **F_{res} = 5,0 N** – nicht 7 N! Der dritte Kraftmesser hält mit 5,0 N dagegen, deshalb bleibt der Ring in Ruhe.",
      120: "Bei **120°** zwischen F_{1} = 3 N und F_{2} = 4 N wird das Parallelogramm flach. Die Diagonale ist nur etwa 3,6 Kästchen lang: **F_{res} ≈ 3,6 N**.\n\nJe größer der Winkel, desto kleiner die Resultierende. Bei entgegengesetzten Kräften (180°) bliebe nur die Differenz: 4 N − 3 N = 1 N.",
      60: "Bei **60°** misst die Diagonale etwa 6,1 Kästchen: **F_{res} ≈ 6,1 N**.\n\nJe kleiner der Winkel, desto größer die Resultierende. Zeigen beide Kräfte in dieselbe Richtung (0°), werden die Beträge einfach addiert: 3 N + 4 N = 7 N."}[ANG[ai]]; }});
}

/* =====================================================================
   D: Kran mit Last (links vorne) – Gewichtskraft und Seilkraft
   ===================================================================== */
function exhibitD(ctx, L){
  const T = ctx.T, S = ctx.slots, w = ctx.world, LX = -.45, LZ = -.1, HY = 2.0, SCL = 1 / 500, DC = 2.92, MX = .8, TIP = 3.45;   // Lasthaken, Maßstab 1 m ≙ 500 N, Kranwaage, Mast, Auslegerspitze
  const g = new T.Group(); ctx.add(g, S.D.x - .1, 0, S.D.z); g.rotation.y = Math.PI / 2;
  const mMast = w === "zauber" ? ctx.mat("darkwood") : ctx.mat("metal"), mBoom = w === "zauber" ? ctx.mat("wood") : w === "detektiv" ? ctx.mat("color", {color: "#2c3f35", rough: .5, metal: .5}) : ctx.mat("steel");
  const mIron = ctx.mat(w === "sterne" ? "steel" : "metal"), mT = w === "sterne" ? ctx.mat("glow", {color: "#FFE81F", intensity: 1.2}) : ctx.mat("brass");
  const mRope = w === "sterne" ? ctx.mat("rubber") : ctx.mat("color", {color: w === "zauber" ? "#8f7a55" : "#b59a6a", rough: 1});
  const b = bucket(T);
  // Drehkranz, Gegengewicht, Mast
  b.box(mIron, 1.0, .1, 1.0, MX + .1, .05, LZ); b.cyl(mMast, .42, .46, .14, 32, MX, .17, LZ); b.put(mT, new T.TorusGeometry(.44, .02, 6, 40), MX, .24, LZ, Math.PI / 2);
  b.box(w === "sterne" ? ctx.mat("plastic", {color: "#2a3442"}) : w === "zauber" ? ctx.mat("stone") : mIron, .34, .42, .56, MX + .38, .45, LZ); b.box(mT, .35, .03, .57, MX + .38, .6, LZ);
  b.box(mMast, .16, 3.55, .16, MX, .24 + 1.775, LZ); b.cyl(mT, .1, .1, .06, 16, MX, 3.82, LZ);
  for (const y of [.8, 1.6, 2.4, 3.2]) b.box(mIron, .2, .04, .2, MX, y, LZ);
  // Gitterausleger (zwei Gurte mit Streben) vom Mastfuß zur Spitze
  const A0 = new T.Vector3(MX - .1, .55, 0), A1 = new T.Vector3(LX + .02, TIP, 0), NS = 7;
  for (const z of [-.07, .07]) b.rod(mBoom, [A0.x, A0.y, LZ + z], [A1.x, A1.y, LZ + z], .026, 6);
  for (let i = 0; i < NS; i++) { const p = A0.clone().lerp(A1, i / NS), q = A0.clone().lerp(A1, (i + 1) / NS);
    b.rod(mBoom, [p.x, p.y, LZ + (i % 2 ? .07 : -.07)], [q.x, q.y, LZ + (i % 2 ? -.07 : .07)], .011, 5); }
  b.cyl(mIron, .085, .085, .06, 20, LX, TIP - .05, LZ, Math.PI / 2); b.box(mIron, .08, .12, .2, LX + .02, TIP + .02, LZ);
  // Seile: Halteseil Mastspitze → Auslegerspitze, Hubseil Spitze → Winde
  b.rod(mRope, [MX, 3.8, LZ], [LX + .03, TIP + .06, LZ], .01, 5); b.rod(mRope, [LX + .07, TIP - .1, LZ + .03], [MX - .02, 1.02, LZ + .1], .009, 5);
  // Winde am Mast (Sterne: Motorblock)
  if (w === "sterne") { b.box(ctx.mat("plastic", {color: "#2a3442"}), .26, .3, .34, MX - .02, .95, LZ + .2); b.box(mT, .27, .03, .35, MX - .02, 1.06, LZ + .2);
    // Leuchtstreifen am Mast: unterhalb und oberhalb der Kranwaage-Tafel (nicht durch sie hindurch)
    const mL = ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}); b.box(mL, .03, 1.42, .03, MX, 1.16, LZ + .092); b.box(mL, .03, .5, .03, MX, 3.22, LZ + .092); }
  else { b.cyl(mMast, .07, .07, .22, 16, MX - .02, .95, LZ + .2, 0, 0, Math.PI / 2); for (const x of [-.13, .13]) b.cyl(mIron, .12, .12, .02, 20, MX - .02 + x, .95, LZ + .2, 0, 0, Math.PI / 2);
    b.cyl(mRope, .078, .078, .2, 16, MX - .02, .95, LZ + .2, 0, 0, Math.PI / 2); b.cyl(mIron, .014, .014, .36, 8, MX - .02, .95, LZ + .2, 0, 0, Math.PI / 2);
    b.box(mIron, .03, .2, .03, MX + .17, .87, LZ + .2); b.cyl(mMast, .02, .02, .12, 8, MX + .23, .78, LZ + .2, 0, 0, Math.PI / 2); }
  if (w === "detektiv") { b.put(mRope, new T.TorusGeometry(.2, .05, 8, 24), MX + .05, .3, LZ + .62, Math.PI / 2); b.put(mRope, new T.TorusGeometry(.16, .05, 8, 24), MX + .05, .38, LZ + .62, Math.PI / 2); }
  // Kranwaage: Gehäuse mit Zifferblatt
  b.rod(mRope, [LX, TIP - .13, LZ], [LX, DC + .22, LZ], .012, 6); b.put(mIron, new T.TorusGeometry(.04, .01, 6, 14), LX, DC + .2, LZ);
  b.cyl(mIron, .18, .18, .09, 32, LX, DC, LZ, Math.PI / 2); b.put(mT, new T.TorusGeometry(.172, .014, 8, 40), LX, DC, LZ + .046);
  b.cyl(mIron, .012, .012, .14, 8, LX, DC - .24, LZ);
  b.build(g);
  const dial = screen(ctx, .32, .32, 256, (c, W) => { const r = W / 2; c.fillStyle = "#f6f0e2"; c.beginPath(); c.arc(r, r, r, 0, TAU); c.fill();
    c.strokeStyle = "#222"; c.fillStyle = "#222"; c.textAlign = "center"; c.textBaseline = "middle";
    for (let n = 0; n <= 30; n++) { const a = Math.PI * .75 + n / 30 * Math.PI * 1.5, big = n % 5 === 0, r1 = big ? r * .7 : r * .8; c.lineWidth = big ? 4 : 2;
      c.beginPath(); c.moveTo(r + Math.cos(a) * r1, r + Math.sin(a) * r1); c.lineTo(r + Math.cos(a) * r * .9, r + Math.sin(a) * r * .9); c.stroke();
      if (big) { c.font = `700 22px ${L.bf}`; c.fillText(String(n * 10), r + Math.cos(a) * r * .52, r + Math.sin(a) * r * .52); } }
    c.fillStyle = "#b3261e"; c.font = `700 30px ${L.bf}`; c.fillText("N", r, r * 1.45); }, true);
  dial.position.set(LX, DC, LZ + .047); g.add(dial);
  const needle = new T.Group(); needle.position.set(LX, DC, LZ + .055); g.add(needle);
  const nd = ctx.box(.008, .12, .005, ctx.mat("color", {color: "#b3261e"})); nd.position.y = .05; needle.add(nd);
  // Last: Haken, Traverse, Palette, Kisten (Palette und Kisten markieren den Stencil für den Gewichtskraft-Pfeil)
  const load = new T.Group(); load.position.set(LX, HY, LZ); g.add(load);
  const rope2 = ctx.mesh(new T.CylinderGeometry(.012, .012, 1, 6), mRope); g.add(rope2);
  const lb = bucket(T), W2 = .74, Z2 = .26;
  lb.put(mIron, new T.TorusGeometry(.045, .012, 8, 16), 0, .0, 0); lb.cyl(mIron, .012, .012, .1, 6, 0, -.08, 0);
  for (const s of [-1, 1]) lb.rod(mRope, [0, -.12, 0], [s * W2, -.32, 0], .009, 5);
  lb.box(mIron, W2 * 2 + .08, .06, .06, 0, -.33, 0);
  for (const s of [-1, 1]) for (const t of [-1, 1]) lb.rod(mRope, [s * W2, -.33, 0], [s * W2, -.92, t * Z2], .008, 5);
  lb.build(load);
  const pal = ctx.mesh(new T.BoxGeometry(W2 * 2 + .06, .06, .58), stencilMat(T, w === "sterne" ? ctx.mat("plastic", {color: "#3a4554"}) : ctx.mat("wood"), 2)); pal.position.y = -.95; load.add(stencilBody(pal));
  const crateMat = stencilMat(T, w === "sterne" ? ctx.mat("plastic", {color: "#d5dbe2"}) : ctx.mat("wood"), 2);
  const bandMat = stencilMat(T, w === "sterne" ? mT : ctx.mat(w === "detektiv" ? "darkwood" : "brass"), 2);
  const CW = .42, CH = .38, CD = .44;
  const crateGeo = new T.BoxGeometry(CW, CH, CD), bandGeo = (() => { const q = bucket(T); for (const y of [-.13, .13]) q.box(bandMat, CW + .012, .04, CD + .012, 0, y, 0); q.box(bandMat, .04, CH + .012, CD + .012, 0, 0, 0);
    return q.build(new T.Group())[0].geometry; })();
  const lblTex = screen(ctx, .22, .11, 256, (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = w === "sterne" ? "#0e1726" : "#f2e6c8"; c.beginPath(); c.roundRect(4, 4, W - 8, H - 8, 14); c.fill();
    c.fillStyle = w === "sterne" ? "#FFE81F" : "#2a1a08"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `700 70px ${L.bf}`; c.fillText("10 kg", W / 2, H / 2 + 4); });
  const crates = [0, 1, 2].map(i => { const cg = new T.Group(), body = ctx.mesh(crateGeo, crateMat), band = ctx.mesh(bandGeo, bandMat), lbl = new T.Mesh(lblTex.geometry, lblTex.material);
    body.renderOrder = 5; band.renderOrder = 5.5; lbl.position.set(0, .085, CD / 2 + .008); cg.add(body, band, lbl);   /* Etikett über dem Schwerpunkt: Pfeilanfang bleibt sichtbar */ load.add(cg); return {g: cg, x: 0, s: i === 0 ? 1 : 0}; });
  const aG = forceArrow(ctx, g, COL.G, .028, 2), dotG = ghostDot(ctx, g, "#ffe9a8", 2, .026);
  const aS = ctx.arrow([0, 0, 0], [0, .2, 0], COL.seil, .028); g.add(aS);
  const plaque = screen(ctx, .74, .92, 512, (c, W, H, n = 1) => { const m = n * 10, F = m * 9.81;
    dark(c, W, H, L); c.textBaseline = "middle"; c.fillStyle = L.acc; rt(c, "Kranwaage", W / 2, 44, 40, L.tf, "center", 700, false, W - 60);
    c.fillStyle = L.dim; rt(c, "1 Kiste: 10 kg", W / 2, 90, 26, L.bf, "center", 600);
    c.fillStyle = L.fg; rt(c, `m = ${n} · 10 kg = ${m} kg`, 30, 142, 30, L.bf, "left", 700, false, W - 60);
    rt(c, "F_{G} = m · g", 30, 190, 30, L.bf, "left", 700); rt(c, `= ${m} kg · 9,81 N/kg`, 30, 236, 30, L.bf, "left", 600, false, W - 60);
    c.fillStyle = COL.G; rt(c, `≈ ${Math.round(F)} N`, 30, 286, 38, L.bf, "left", 700);
    c.fillStyle = "rgba(255,255,255,.14)"; c.fillRect(30, 316, W - 60, 3);
    c.fillStyle = COL.seil; rt(c, `Seilkraft ≈ ${Math.round(F)} N`, 30, 350, 30, L.bf, "left", 700, false, W - 60);
    c.fillStyle = COL.res; rt(c, "F_{res} = 0 N", 30, 392, 30, L.bf, "left", 700); c.fillStyle = L.dim; rt(c, "→ Kräftegleichgewicht", 30, 430, 26, L.bf, "left", 600, false, W - 60);
    c.fillStyle = L.acc2; rt(c, "Pfeile: 10 cm ≙ 50 N", W / 2, 472, 24, L.bf, "center", 600, false, W - 60); });
  plaque.position.set(MX, 2.45, LZ + .13); g.add(plaque);   // vor den Mastringen (Vorderkante LZ + 0,10)
  const tagsG = [1, 2, 3].map(n => { const t2 = tag(ctx, `F_{G} ≈ ${Math.round(n * 98.1)} N`, COL.G, .11); t2.visible = n === 1; g.add(t2); return t2; });
  const tagsS = [1, 2, 3].map(n => { const t2 = tag(ctx, `F_{Seil} ≈ ${Math.round(n * 98.1)} N`, COL.seil, .11); t2.visible = n === 1; g.add(t2); return t2; });
  const lampD = ctx.light(0xffdcb0, 3.2, 6.5, S.D.x + 1.7, 3.3, S.D.z + .4);
  let n = 1, F = 98.1, Fv = 0, sag = .03, sv = 0;
  ctx.tick(dt => {
    // F = Seilkraft (schwingt ein), tgt = Gewichtskraft (springt sofort auf n · 98,1 N)
    const tgt = n * 98.1; Fv += (-(F - tgt) * 30 - Fv * 3.4) * dt; F += Fv * dt;
    const sT = .03 * n; sv += (-(sag - sT) * 30 - sv * 3.4) * dt; sag += sv * dt;
    const hy = HY - sag; load.position.y = hy;
    rope2.position.set(LX, (DC - .3 + hy) / 2, LZ); rope2.scale.set(1, Math.max(.01, DC - .3 - hy), 1);
    needle.rotation.z = Math.PI * .75 - Math.max(0, F) / 300 * Math.PI * 1.5;
    const xs = n === 1 ? [0] : n === 2 ? [-.24, .24] : [-.48, 0, .48];
    crates.forEach((c, i) => { const on = i < n, tx = on ? xs[i] : c.x; c.x += (tx - c.x) * Math.min(1, dt * 6); c.s += ((on ? 1 : 0) - c.s) * Math.min(1, dt * 5);
      const s = Math.max(.001, c.s); c.g.scale.setScalar(s); c.g.position.set(c.x, -.92 + CH / 2 * s + (1 - s) * .5, 0); c.g.visible = c.s > .01; });
    const yc = hy - .92 + CH / 2, Lg = tgt * SCL, Ls = Math.max(.02, F * SCL);
    aG.set([LX, yc, LZ], [LX, yc - Lg, LZ]); dotG.position.set(LX, yc, LZ);
    aS.set([LX, hy + .02, LZ + .06], [LX, hy + .02 + Ls, LZ + .06]);
    tagsG.forEach(t2 => t2.position.set(LX + .55, yc - Lg * .6, LZ + .42)); tagsS.forEach(t2 => t2.position.set(LX + .55, hy + Ls * .5, LZ + .25));
  });
  void lampD;
  ctx.obstacleBox(S.D.x - .15, S.D.z - .15, 1.15, 2.45);
  ctx.exhibit(g, {label: w === "detektiv" ? "Hafenkran" : w === "sterne" ? "Lastenkran" : "Truhenkran", sub: "anklicken: Kiste anhängen", title: "Kräftegleichgewicht am Seil", pitch: .1, stand: {x: S.D.x + 2.4, z: S.D.z + .1},   // frontal: Last, Kranwaage und Tafel im Blick
    onClick: () => { n = n % 3 + 1; plaque.redraw(n); tagsG.forEach((t2, i) => t2.visible = i === n - 1); tagsS.forEach((t2, i) => t2.visible = i === n - 1); },
    get text(){ const m = n * 10, F2 = Math.round(m * 9.81);
      return `${n === 1 ? "Am Kran hängt **eine Kiste** mit 10 kg" : `Am Kran hängen **${n} Kisten** zu je 10 kg, zusammen **m = ${m} kg**`}. Ihre Gewichtskraft beträgt **F_{G} = m · g = ${m} kg · 9,81 N/kg ≈ ${F2} N**, zeigt senkrecht nach unten und greift im Schwerpunkt an.\n\nErst wenn die Seilkraft so groß ist wie die Gewichtskraft, hängt die Last ruhig: Das Seil zieht dann **gleich stark, entgegengesetzt** nach oben – ein **Kräftegleichgewicht** mit F_{res} = 0 N. Die Kranwaage zeigt die Seilkraft an, also etwa ${F2} N (Palette und Gehänge vernachlässigt).`; }});
}

/* =====================================================================
   Luftraum: Ortsfaktor-Planetarium über dem Gang
   ===================================================================== */
function orrery(ctx, L, PM){
  // Höhe: Unterkante (Namensschilder) ≈ 3,3 m über dem Gang. Lage z = 6,2: in der Zauberwelt ≥ 2 m Abstand zu allen schwebenden Kerzen.
  const T = ctx.T, w = ctx.world, H = ctx.height || 7, yA = 3.95, R = 1.1, SCL = .025, Z0 = 6.2, PED = .1, CS = .08;   // Maßstab 10 N ≙ 25 cm
  const g = new T.Group(); ctx.add(g, 0, yA, Z0);
  const mArm = w === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}) : ctx.mat("brass");
  const b = bucket(T), IY = 1.95, mRod = w === "sterne" ? ctx.mat("steel") : ctx.mat("metal");   // IY: Höhe des Schilds an der Aufhängung
  // Aufhängestange in zwei Stücken – das Schild sitzt dazwischen (die Stange schneidet die Schrift nicht)
  b.cyl(mRod, .02, .02, IY - .16, 8, 0, (IY - .16) / 2, 0); b.cyl(mRod, .02, .02, H - yA - IY - .16, 8, 0, (H - yA + IY + .16) / 2, 0);
  if (w === "sterne") { b.cyl(ctx.mat("steel"), .35, .4, .1, 32, 0, H - yA - .05, 0); b.put(mArm, new T.TorusGeometry(.36, .02, 6, 40), 0, H - yA - .1, 0, Math.PI / 2);
    b.put(ctx.mat("steel"), new T.SphereGeometry(.09, 16, 12), 0, 0, 0); }
  else { b.put(ctx.mat("brass"), new T.SphereGeometry(.12, 20, 14), 0, 0, 0); b.cyl(ctx.mat("brass"), .16, .2, .06, 24, 0, H - yA - .03, 0); }
  b.build(g, false);
  const rot = new T.Group(); g.add(rot);
  const P = [{k: "mond", n: "Mond", g: 1.6, gs: "1,6", r: .13}, {k: "mars", n: "Mars", g: 3.7, gs: "3,7", r: .17}, {k: "erde", n: "Erde", g: 9.81, gs: "9,81", r: .25}, {k: "jupiter", n: "Jupiter", g: 24.8, gs: "24,8", r: .42}];
  const rb = bucket(T), mThing = ctx.mat(w === "sterne" ? "steel" : "brass");
  rb.put(mArm, new T.TorusGeometry(R, w === "sterne" ? .01 : .016, 6, 96), 0, 0, 0, Math.PI / 2);
  const planets = [];
  // Je Himmelskörper: 1-kg-Würfel auf einer kleinen Plattform an der Oberfläche (oben), Gewichtskraft-Pfeil vom Schwerpunkt zum Mittelpunkt.
  // Würfel, Plattform und Himmelskörper markieren den Stencil (eigener Wert je Himmelskörper) – der Pfeil ist so auch im Inneren sichtbar.
  P.forEach((p, i) => { const a = i / 4 * TAU + .4, x = Math.cos(a) * R, z = Math.sin(a) * R, ref = 3 + i;
    rb.rod(mArm, [0, 0, 0], [x, 0, z], w === "sterne" ? .008 : .014, 6);
    const pl = new T.Mesh(new T.SphereGeometry(p.r, 32, 22), stencilMat(T, PM[p.k], ref)); pl.position.set(x, 0, z); pl.rotation.z = .2; rot.add(stencilBody(pl)); planets.push(pl);
    const yc = p.r + PED + CS / 2, q = bucket(T), mS = stencilMat(T, mThing, ref);
    q.cyl(mS, .012, .018, PED, 10, x, p.r + PED / 2 - .012, z); q.cyl(mS, .06, .06, .014, 20, x, p.r + PED - .007, z); q.box(mS, CS, CS, CS, x, yc, z);
    q.build(rot, false).forEach(m => stencilBody(m));
    forceArrow(ctx, rot, COL.G, .016, ref).set([x, yc, z], [x, yc - p.g * SCL, z]); ghostDot(ctx, rot, "#ffe9a8", ref, .013).position.set(x, yc, z);
    const tn = tag(ctx, `${p.n}: ${p.gs} N/kg`, "#ffe9a8", .15); tn.position.set(x, -p.r - .13, z); rot.add(tn);
    const tv = tag(ctx, `${p.gs} N`, COL.G, .14); tv.position.set(x, yc + CS / 2 + .12, z); rot.add(tv); });
  rb.build(rot, false);
  // Schild an der Aufhängung, über allen Himmelskörpern (Unterkante ≈ 5,7 m)
  const info = tagLines(ctx, [["je 1 kg auf der Oberfläche", "#ffe9a8"], ["Maßstab: 10 N ≙ 25 cm", COL.G]], .32); info.position.set(0, IY, 0); g.add(info);
  let spin = 0;
  ctx.tick((dt, t) => { spin = Math.max(0, spin - dt * .5); rot.rotation.y += dt * (.1 + spin * 1.6); planets.forEach((p, i) => p.rotation.y = t * (.3 + i * .08)); });
  ctx.exhibit(g, {label: "Ortsfaktoren im Sonnensystem", sub: "anklicken: drehen", title: "Ortsfaktoren im Sonnensystem", pitch: .47, dist: 4.3, onClick: () => { spin = 1.4; },
    text: "Auf jedem Himmelskörper steht ein Körper mit **1 kg** Masse. Die roten Pfeile zeigen seine Gewichtskraft an der Oberfläche – sie zeigt immer zum Mittelpunkt des Himmelskörpers: Mond **1,6 N**, Mars **3,7 N**, Erde **9,81 N**, Jupiter **24,8 N** (Jupiter hat keine feste Oberfläche – der Wert gilt an seiner Wolkenobergrenze).\n\nDer **Ortsfaktor g** gibt an, wie groß die Gewichtskraft auf 1 kg Masse ist (Einheit N/kg). Auf dem Jupiter wäre deine Gewichtskraft etwa 2,5-mal so groß wie auf der Erde – deine Masse bliebe gleich."});
}

/* =====================================================================
   Raum
   ===================================================================== */
R3D.rooms.kraft1 = ctx => {
  const T = ctx.T, L = look(ctx);
  const PM = {erde: planetMat(T, "erde"), mond: planetMat(T, "mond"), mars: planetMat(T, "mars"), jupiter: planetMat(T, "jupiter")};
  centerPiece(ctx, L, PM);
  exhibitA(ctx, L);
  exhibitB(ctx, L);
  exhibitC(ctx, L);
  exhibitD(ctx, L);
  orrery(ctx, L, PM);
  /* ===== Wandtafeln ===== */
  // Zeilen so kurz, dass sie in keiner Welt umbrechen (die Tafeln wählen die Schriftgröße selbst und rücken für Aufzählungszeichen ein –
  // mit kit.board in allen drei Welten nachgemessen, auch mit ±1 % abweichender Schriftbreite)
  ctx.wallBoard("left", 6.75, 3.9, 3.2, 1.95, "Der Kraftpfeil", ["Beginnt im Angriffspunkt", "Zeigt in Richtung der Kraft", "Länge ≙ Betrag (nach Maßstab)", "z. B. 1 cm ≙ 10 N, also 3 cm ≙ 30 N", "Einheit der Kraft: 1 Newton (1 N)"]);
  ctx.wallBoard("right", 2.25, 3.9, 3.2, 1.95, "Gewichtskraft und Masse", ["Gewichtskraft = Masse · Ortsfaktor", "F_{G} = m · g   (g: Ortsfaktor in N/kg)", "Erde: g = 9,81 N/kg (≈ 10 N/kg)", "Mond: g ≈ 1,6 N/kg", "Masse in kg: überall gleich – Balkenwaage", "F_{G} in N: ortsabhängig – Federkraftmesser"]);
  ctx.wallBoard("left", -2.25, 3.9, 3.2, 1.95, "Mehrere Kräfte an einem Körper", ["Gleiche Richtung: Beträge addieren", "Entgegengesetzt: Beträge subtrahieren", "F_{res} zeigt in Richtung der größeren Kraft", "Kräftegleichgewicht: F_{res} = 0 N", "z. B. 400 N nach links, 400 N nach rechts"]);
  ctx.wallBoard("right", -6.75, 3.9, 3.2, 1.95, "Das Kräfteparallelogramm", ["Kraftpfeile vom Angriffspunkt aus zeichnen", "Zum Parallelogramm ergänzen", "Die Diagonale ist die Resultierende F_{res}", "z. B. 3 N und 4 N im rechten Winkel → 5 N", "Größerer Winkel → kleinere Resultierende"]);
};
})();
