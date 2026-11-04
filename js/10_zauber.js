/* ---------- 10_zauber.js ---------- */
/* =====================================================================
   3D-Weltstil „Zauberschule“: Steingewölbe, Fackeln, schwebende Kerzen, Spitzbogenfenster, Lesepulte, Eichentüren
   Schnittstelle eines Weltstils (gleich für alle Welten, siehe RAUM-API.md):
   pal, font, fontBody, mat(kind, o), env(ctx, scene), shell(ctx, {hall}) → Höhe, door(ctx, {label, sub}) → {group, open, update},
   station(ctx, j, name) → Group (Vorderseite +z), board(ctx, title, lines, o) → Mesh, ambient(ctx, scene), placeholder(ctx)
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.util) return;
const U = R3D.util;
const FONT = "Luminari, 'Palatino', 'Book Antiqua', Georgia, serif", BODY = "Palatino, 'Book Antiqua', Georgia, serif";
const pal = {accent: "#E3B341", accent2: "#9B2335", glow: "#FFC86B", ink: "#2B1A10", light: "#FFE2B0", cool: "#9DB7FF", danger: "#E0533D", ok: "#7BD389"};

/* ---------- Prozedurale Texturen ---------- */
const rnd = U.seeded(4242);
function noise(g, w, h, n, a, colors){ for (let i = 0; i < n; i++) { g.fillStyle = colors[(rnd() * colors.length) | 0]; g.globalAlpha = a * rnd(); const s = 1 + rnd() * 3; g.fillRect(rnd() * w, rnd() * h, s, s); } g.globalAlpha = 1; }
const tex = {
  stone: () => U.canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#2b2622"; g.fillRect(0, 0, w, h); const rh = 128;
    for (let y = 0; y < h; y += rh) { let x = -((y / rh) % 2) * 120; while (x < w) { const bw = 190 + rnd() * 140, l = 34 + rnd() * 16;
      g.fillStyle = `hsl(${28 + rnd() * 14},${8 + rnd() * 8}%,${l}%)`; g.fillRect(x + 4, y + 4, bw - 8, rh - 8);
      const gr = g.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, "rgba(255,255,255,.07)"); gr.addColorStop(1, "rgba(0,0,0,.18)"); g.fillStyle = gr; g.fillRect(x + 4, y + 4, bw - 8, rh - 8);
      x += bw; } }
    noise(g, w, h, 9000, .35, ["#000", "#5a5047", "#1a1612", "#7a6e60"]);
  }, "z-stone", [1, 1]),
  flag: () => U.canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#1e1a17"; g.fillRect(0, 0, w, h); const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const l = 26 + rnd() * 12; g.fillStyle = `hsl(${25 + rnd() * 20},${6 + rnd() * 6}%,${l}%)`;
      g.beginPath(); g.roundRect(i * s + 6, j * s + 6, s - 12, s - 12, 10); g.fill(); }
    noise(g, w, h, 12000, .3, ["#000", "#4d443c", "#857565"]);
  }, "z-flag", [1, 1]),
  wood: (dark) => U.canvasTex(512, 1024, (g, w, h) => {
    const base = dark ? [22, 30, 14] : [28, 45, 26]; g.fillStyle = `hsl(${base[0]},${base[1]}%,${base[2]}%)`; g.fillRect(0, 0, w, h);
    const pw = 128; for (let x = 0; x < w; x += pw) { g.fillStyle = `hsla(${base[0]},${base[1]}%,${base[2] + (rnd() - .5) * 8}%,1)`; g.fillRect(x + 2, 0, pw - 4, h);
      for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(0,0,0,${.06 + rnd() * .1})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); const x0 = x + rnd() * pw;
        g.moveTo(x0, 0); for (let y = 0; y <= h; y += 64) g.lineTo(x0 + Math.sin(y / 90 + k) * 6, y); g.stroke(); }
      g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(x, 0, 3, h); }
  }, dark ? "z-wood-d" : "z-wood", [1, 1]),
  parchment: () => U.canvasTex(512, 512, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, w * .1, w / 2, h / 2, w * .75); gr.addColorStop(0, "#f3e3bd"); gr.addColorStop(1, "#c9a76c"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    noise(g, w, h, 5000, .18, ["#8a6a3a", "#fff3d0"]);
  }, "z-parch"),
  night: () => U.canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0b1030"); gr.addColorStop(.7, "#1d2a5c"); gr.addColorStop(1, "#33406e"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${.3 + rnd() * .7})`; g.fillRect(rnd() * w, rnd() * h * .8, 1.5, 1.5); }
    g.fillStyle = "#fff8dc"; g.shadowColor = "#fff8dc"; g.shadowBlur = 30; g.beginPath(); g.arc(w * .68, h * .26, 22, 0, 7); g.fill(); g.shadowBlur = 0;
    g.fillStyle = "#0b0e22"; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .86 - Math.abs(Math.sin(x * .05)) * 40 - (x % 64 === 0 ? 30 : 0)); g.lineTo(w, h); g.fill();
    g.strokeStyle = "#2a2219"; g.lineWidth = 12; g.strokeRect(0, 0, w, h); g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * .5); g.lineTo(w, h * .5); g.stroke();
  }, "z-night"),
  banner: (color) => U.canvasTex(256, 768, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, .15, ["#000", "#fff"]);
    g.strokeStyle = "#E3B341"; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 120);
    g.fillStyle = "#E3B341"; g.beginPath(); g.moveTo(0, h - 100); g.lineTo(w / 2, h); g.lineTo(w, h - 100); g.lineTo(w, h); g.lineTo(0, h); g.globalCompositeOperation = "destination-out"; g.fill(); g.globalCompositeOperation = "source-over";
    g.strokeStyle = "#E3B341"; g.lineWidth = 7; g.beginPath(); g.arc(w / 2, h * .38, 70, 0, 7); g.stroke();
    for (let k = 0; k < 3; k++) { g.save(); g.translate(w / 2, h * .38); g.rotate(k * Math.PI / 3); g.beginPath(); g.ellipse(0, 0, 70, 24, 0, 0, 7); g.stroke(); g.restore(); }
    g.fillStyle = "#E3B341"; g.beginPath(); g.arc(w / 2, h * .38, 12, 0, 7); g.fill();
  }, "z-banner-" + color),
  env: () => { const t = U.canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#6d5f86"); gr.addColorStop(.3, "#9a7650"); gr.addColorStop(.48, "#6a5038"); gr.addColorStop(.56, "#4a3626"); gr.addColorStop(1, "#1e140c");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) { const x = (i + .5) * w / 8, y = h * .44, r = g.createRadialGradient(x, y, 0, x, y, 22); r.addColorStop(0, "rgba(255,236,190,1)"); r.addColorStop(.4, "rgba(255,170,80,.7)"); r.addColorStop(1, "rgba(255,140,50,0)"); g.fillStyle = r; g.fillRect(x - 22, y - 22, 44, 44); }
      for (let i = 0; i < 40; i++) { const x = rnd() * w, y = h * (.08 + rnd() * .2); g.fillStyle = `rgba(255,220,150,${.4 + rnd() * .5})`; g.beginPath(); g.arc(x, y, 1.5 + rnd() * 1.5, 0, 7); g.fill(); }
    }, "z-env"); t.mapping = T3.EquirectangularReflectionMapping; return t; }
};

/* ---------- Materialien ---------- */
const mats = new Map();
function keep(m){ m.userData.keep = true; return m; }
function mat(kind, o = {}){
  const key = kind + "|" + JSON.stringify(o); if (mats.has(key)) return mats.get(key);
  const S = (p) => keep(new T3.MeshStandardMaterial(p));
  let m;
  switch (kind) {
    case "stone": m = S({map: tex.stone(), color: o.color || 0xffffff, roughness: .95}); break;
    case "floor": m = S({map: tex.flag(), roughness: .9}); break;
    case "wood": m = S({map: tex.wood(false), color: o.color || 0xffffff, roughness: .72}); break;
    case "darkwood": m = S({map: tex.wood(true), roughness: .78}); break;
    case "metal": m = S({color: o.color || 0x4a4950, metalness: .85, roughness: .45, envMap: tex.env()}); break;
    case "brass": case "gold": m = S({color: kind === "gold" ? 0xd9a520 : 0xb8862b, metalness: 1, roughness: .32, envMap: tex.env()}); break;
    case "copper": m = S({color: 0xb4673a, metalness: 1, roughness: .35, envMap: tex.env()}); break;
    case "steel": m = S({color: 0x9aa0a8, metalness: .9, roughness: .3, envMap: tex.env()}); break;
    case "glass": m = S({color: o.color || 0xcfe3ff, transparent: true, opacity: o.opacity ?? .28, roughness: .05, metalness: 0, depthWrite: false}); break;
    case "water": m = S({color: o.color || 0x2f6fc8, transparent: true, opacity: .6, roughness: .08, metalness: .1, depthWrite: false}); break;
    case "glow": m = S({color: o.color || pal.glow, emissive: o.color || pal.glow, emissiveIntensity: o.intensity ?? 2.2, roughness: .4}); break;
    case "crystal": m = S({color: o.color || 0x9a6bff, emissive: o.color || 0x9a6bff, emissiveIntensity: o.intensity ?? .6, transparent: true, opacity: .85, roughness: .1, metalness: .1}); break;
    case "paper": m = S({map: tex.parchment(), roughness: .95}); break;
    case "cloth": m = S({color: o.color || pal.accent2, roughness: 1, side: T3.DoubleSide}); break;
    case "rubber": m = S({color: 0x161414, roughness: .9}); break;
    case "plastic": m = S({color: o.color || 0x444444, roughness: .5}); break;
    default: m = S({color: o.color || 0x888888, roughness: o.rough ?? .6, metalness: o.metal ?? 0});
  }
  mats.set(key, m); return m;
}

/* ---------- Umgebung ---------- */
function env(ctx, sc){
  sc.background = new T3.Color(0x0c0a12); sc.fog = new T3.FogExp2(0x0c0a12, ctx.key === "halle" ? .018 : .024);
  const hemi = new T3.HemisphereLight(0xd8c8ff, 0x4a3420, .95), amb = new T3.AmbientLight(0xffe6c0, .22); sc.add(hemi, amb);
  const B = ctx.bounds, d = new T3.DirectionalLight(0xffe2b0, 1.5); d.position.set(5, 14, (B.z0 + B.z1) / 2 + 6); d.target.position.set(0, 0, (B.z0 + B.z1) / 2);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const s = d.shadow.camera, hw = Math.max(B.x1 - B.x0, B.z0 - B.z1) / 2 + 2;
  s.left = -hw; s.right = hw; s.top = hw; s.bottom = -hw; s.near = 1; s.far = 40; d.shadow.bias = -0.0004; d.shadow.normalBias = .02; sc.add(d, d.target);
  ctx.weltLicht = {hemi, amb, dir: d};   // für die Raumthemen (17_raum_zauber*.js): Farben, Stärken und Lage je Raum, Zahl und Art der Lichter bleiben gleich
}

/* ---------- Raumhülle ---------- */
function plane(w, h, m, sx, sy){ const g = new T3.PlaneGeometry(w, h); if (sx) U.scaleUV(g, sx, sy); const me = new T3.Mesh(g, m); me.receiveShadow = true; return me; }
function shell(ctx, {hall}){
  const B = ctx.bounds, W = B.x1 - B.x0, D = B.z0 - B.z1, H = hall ? 9 : 7.5, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, G = ctx.group;
  // Lage der Bauteile der Raumhülle für die Ausstattung (13_dekor_zauber.js): Säulen, Fackeln, Fenster, Banner, Deckenbalken
  const HU = ctx.huelle = {H, pz: null, saeuleX: [B.x0 + .3, B.x1 - .3], fackeln: [], fenster: [], banner: [], balken: []};
  const floor = plane(W, D, mat("floor"), W / 3.2, D / 3.2); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); G.add(floor); ctx.floor = floor;
  // Mittelläufer
  const run = plane(2.6, D - 1, mat("cloth", {color: "#5a1420"})); run.rotation.x = -Math.PI / 2; run.position.set(0, .012, cz); G.add(run);
  const edge = mat("glow", {color: "#C99A2E", intensity: .35});
  for (const s of [-1, 1]) { const e = new T3.Mesh(new T3.BoxGeometry(.08, .01, D - 1), edge); e.position.set(s * 1.25, .018, cz); G.add(e); }
  const st = mat("stone");
  const wl = plane(D, H, st, D / 4, H / 4); wl.rotation.y = Math.PI / 2; wl.position.set(B.x0, H / 2, cz);
  const wr = plane(D, H, st, D / 4, H / 4); wr.rotation.y = -Math.PI / 2; wr.position.set(B.x1, H / 2, cz);
  const wb = plane(W, H, st, W / 4, H / 4); wb.rotation.y = Math.PI; wb.position.set(cx, H / 2, B.z0);
  const wf = plane(W, H, st, W / 4, H / 4); wf.position.set(cx, H / 2, B.z1); G.add(wl, wr, wb, wf);
  const ceil = plane(W, D, mat("darkwood"), W / 4, D / 4); ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, H, cz); G.add(ceil);
  for (let z = B.z1 + 1.5; z < B.z0; z += 3) { HU.balken.push(z); const b = new T3.Mesh(new T3.BoxGeometry(W, .35, .4), mat("darkwood")); b.position.set(cx, H - .18, z); G.add(b); }
  // Sockel
  for (const [w, x, z, ry] of [[D, B.x0 + .15, cz, Math.PI / 2], [D, B.x1 - .15, cz, Math.PI / 2], [W, cx, B.z0 - .15, 0], [W, cx, B.z1 + .15, 0]]) {
    const p = new T3.Mesh(new T3.BoxGeometry(w, .45, .3), st); p.position.set(x, .22, z); p.rotation.y = ry; p.receiveShadow = true; G.add(p); }
  // Säulen und Bögen an den Seitenwänden
  const pz = hall ? [10, 2.5, -4.5, -11.5, -17] : [9, 4.5, 0, -4.5, -9];
  ctx.decorZ = HU.pz = pz;
  const colG = new T3.CylinderGeometry(.3, .36, H - .9, 16), capG = new T3.BoxGeometry(.9, .45, .9);
  for (const x of [B.x0 + .3, B.x1 - .3]) for (const z of pz) {
    const c = new T3.Mesh(colG, st); c.position.set(x, (H - .9) / 2, z); c.castShadow = c.receiveShadow = true; G.add(c);
    const cap = new T3.Mesh(capG, st); cap.position.set(x, H - .9, z); G.add(cap); ctx.obstacle(x, z, .45);
  }
  for (const x of [B.x0 + .12, B.x1 - .12]) for (let i = 0; i < pz.length - 1; i++) {
    const r = Math.abs(pz[i] - pz[i + 1]) / 2, a = new T3.Mesh(new T3.TorusGeometry(r, .14, 8, 28, Math.PI), st);
    a.rotation.y = Math.PI / 2; a.position.set(x, H - .9, (pz[i] + pz[i + 1]) / 2); a.scale.set(1, .55, 1); G.add(a); }
  // Fackeln (2 flackernde Lichter)
  const tz = hall ? [2.5, -11.5] : [4.5, -4.5];
  tz.forEach((z, i) => { const x = i % 2 ? B.x1 - .55 : B.x0 + .55; torch(ctx, x, 2.1, z, i % 2 ? -1 : 1); HU.fackeln.push([x, 2.1, z, i % 2 ? -1 : 1]); });
  // Fenster und Banner an Vorder- und Rückwand
  for (const z of [B.z0 - .02, B.z1 + .02]) for (const s of [-1, 1]) {
    const fx = s * (hall ? 6 : 5.2); HU.fenster.push([fx, z]); HU.banner.push([s * 2.7, z]); const win = new T3.Mesh(new T3.PlaneGeometry(1.5, 3.2), new T3.MeshBasicMaterial({map: tex.night(), toneMapped: false}));
    win.position.set(fx, 4, z); if (z > 0) win.rotation.y = Math.PI; G.add(win);
    const arch = new T3.Mesh(new T3.CircleGeometry(.75, 24, 0, Math.PI), new T3.MeshBasicMaterial({map: tex.night(), toneMapped: false}));
    arch.position.set(fx, 5.6, z); if (z > 0) arch.rotation.y = Math.PI; G.add(arch);
    const fr = new T3.Mesh(new T3.TorusGeometry(.78, .08, 6, 24, Math.PI), st); fr.position.set(fx, 5.6, z + (z > 0 ? -.03 : .03)); G.add(fr);
    const bn = new T3.Mesh(new T3.PlaneGeometry(1, 3), keep(new T3.MeshStandardMaterial({map: tex.banner(s < 0 ? "#6B1420" : "#1F3A5F"), transparent: true, side: T3.DoubleSide, roughness: 1})));
    bn.position.set(s * 2.7, 5.1, z + (z > 0 ? -.05 : .05)); if (z > 0) bn.rotation.y = Math.PI; G.add(bn);
    const rod = new T3.Mesh(new T3.CylinderGeometry(.03, .03, 1.3, 8), mat("brass")); rod.rotation.z = Math.PI / 2; rod.position.set(s * 2.7, 6.62, z + (z > 0 ? -.08 : .08)); G.add(rod);
  }
  return H;
}
function torch(ctx, x, y, z, dir){
  const g = new T3.Group(), m = mat("metal");
  const arm = new T3.Mesh(new T3.CylinderGeometry(.035, .035, .55, 8), m); arm.rotation.z = Math.PI / 2 - .5 * dir; arm.position.set(.18 * dir, -.05, 0);
  const cup = new T3.Mesh(new T3.CylinderGeometry(.12, .06, .22, 10), m); cup.position.set(.38 * dir, .16, 0);
  const fl = ctx.glow(0xffa040, .9); fl.position.set(.38 * dir, .5, 0); const core = ctx.glow(0xfff1c0, .35); core.position.set(.38 * dir, .4, 0);
  g.add(arm, cup, fl, core); g.position.set(x, y, z); ctx.group.add(g);
  const l = new T3.PointLight(0xff9a40, 7, 10, 2); l.position.set(x + .5 * dir, y + .6, z); l.castShadow = false; ctx.group.add(l);
  const ph = Math.random() * 10;
  ctx.tick((dt, t) => { const f = .8 + .2 * Math.sin(t * 13 + ph) * Math.sin(t * 7.3 + ph * 2) + .08 * Math.sin(t * 31 + ph);
    l.intensity = 7 * f; fl.scale.setScalar(.85 + .25 * f); fl.material.opacity = .75 + .25 * f; });
}

/* ---------- Tür: Eichen-Doppeltür im Spitzbogen ---------- */
function door(ctx, {label, sub}){
  const g = new T3.Group(), st = mat("stone"), wd = mat("wood"), ir = mat("metal");
  for (const s of [-1, 1]) { const j = new T3.Mesh(new T3.BoxGeometry(.45, 3.4, .55), st); j.position.set(s * 1.45, 1.7, .2); j.castShadow = true; g.add(j); }
  const arch = new T3.Mesh(new T3.TorusGeometry(1.45, .24, 10, 28, Math.PI), st); arch.position.set(0, 3.4, .2); g.add(arch);
  const tym = new T3.Mesh(new T3.CircleGeometry(1.24, 28, 0, Math.PI), mat("darkwood")); tym.position.set(0, 3.4, .04); g.add(tym);
  const rose = ctx.glow(new T3.Color(pal.accent), .9); rose.position.set(0, 3.95, .1); g.add(rose);
  const portal = new T3.Mesh(new T3.PlaneGeometry(2.5, 3.4), new T3.MeshBasicMaterial({map: portalTex(), transparent: true, toneMapped: false, depthWrite: false}));
  portal.position.set(0, 1.7, .03); g.add(portal);
  const leaves = [];
  for (const s of [-1, 1]) {
    const piv = new T3.Group(); piv.position.set(s * 1.24, 0, .12); g.add(piv);
    const leaf = new T3.Mesh(new T3.BoxGeometry(1.22, 3.38, .1), wd); leaf.position.set(-s * .61, 1.69, 0); leaf.castShadow = true; piv.add(leaf);
    for (const y of [.6, 1.7, 2.8]) { const band = new T3.Mesh(new T3.BoxGeometry(1.18, .09, .03), ir); band.position.set(-s * .61, y, .07); piv.add(band); }
    const ring = new T3.Mesh(new T3.TorusGeometry(.11, .02, 8, 18), mat("brass")); ring.position.set(-s * .14, 1.55, .1); piv.add(ring);
    leaves.push([piv, s]);
  }
  const plaque = board(ctx, label, sub ? [sub] : [], {w: 2.7, h: .95, small: true}); plaque.position.set(0, 5.3, .5); g.add(plaque);   // vor dem Steinbogen (reicht bis z = 0,44)
  g.userData.schild = plaque;   // Raumthemen (17_raum_zauber.js, tuer): Schild umhängen, wo etwas über dem Gang die Sicht darauf nimmt
  let target = 0, ang = 0;
  return {group: g, open(){ target = 1.35; }, close(){ target = 0; },
    update(dt){ ang += (target - ang) * Math.min(1, dt * 3.2); for (const [p, s] of leaves) p.rotation.y = s < 0 ? ang : -ang; }};
}
let _portal = null;
function portalTex(){ return _portal || (_portal = U.canvasTex(256, 384, (g, w, h) => { const r = g.createRadialGradient(w / 2, h * .55, 10, w / 2, h * .55, h * .6);
  r.addColorStop(0, "rgba(255,240,200,1)"); r.addColorStop(.35, "rgba(227,179,65,.85)"); r.addColorStop(1, "rgba(60,20,80,.95)"); g.fillStyle = r; g.fillRect(0, 0, w, h); }, "z-portal")); }

/* ---------- Station: Lesepult mit offenem Buch und schwebender Rune ---------- */
function station(ctx, j, name){
  const g = new T3.Group(), wd = mat("wood"), dk = mat("darkwood");
  const base = new T3.Mesh(new T3.CylinderGeometry(.32, .45, .12, 8), dk); base.position.y = .06;
  const col = new T3.Mesh(new T3.CylinderGeometry(.12, .16, 1.0, 8), wd); col.position.y = .6;
  const top = new T3.Mesh(new T3.BoxGeometry(.9, .06, .62), wd); top.position.set(0, 1.15, 0); top.rotation.x = -.42;
  const pages = new T3.Mesh(new T3.BoxGeometry(.78, .03, .5), mat("paper")); pages.position.set(0, 1.2, .02); pages.rotation.x = -.42;
  const spine = new T3.Mesh(new T3.BoxGeometry(.04, .05, .5), mat("cloth", {color: "#6B1420"})); spine.position.set(0, 1.22, .02); spine.rotation.x = -.42;
  [base, col, top, pages, spine].forEach(m => { m.castShadow = m.receiveShadow = true; g.add(m); });
  const ring = new T3.Mesh(new T3.RingGeometry(.75, .82, 48), new T3.MeshBasicMaterial({color: pal.accent, transparent: true, opacity: .5, toneMapped: false}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; g.add(ring);
  const num = ctx.text(String(j + 1), {size: .42, color: "#FFE9A8", font: FONT}); num.position.set(0, 2.05, 0); g.add(num);
  const nm = ctx.text(name, {size: .16, color: "#FFE9A8", font: FONT}); nm.position.set(0, 1.68, 0); g.add(nm);
  const gl = ctx.glow(new T3.Color(pal.glow), 1.1); gl.position.set(0, 2.05, -.05); g.add(gl);
  const ph = j * 1.7; ctx.tick((dt, t) => { num.position.y = 2.05 + Math.sin(t * 1.6 + ph) * .06; gl.position.y = num.position.y; ring.material.opacity = .35 + .2 * Math.sin(t * 2 + ph); });
  return g;
}

/* ---------- Tafel: Pergament ---------- */
function board(ctx, title, lines, o = {}){
  const w = o.w || 2.4, h = o.h || 1.6, px = 512, cw = Math.round(px * w / Math.max(w, h) * 2), ch = Math.round(px * h / Math.max(w, h) * 2);
  const c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d");
  const r = g.createRadialGradient(cw / 2, ch / 2, ch * .1, cw / 2, ch / 2, Math.max(cw, ch) * .7); r.addColorStop(0, "#f4e4bf"); r.addColorStop(1, "#c39d5c");
  g.fillStyle = r; g.beginPath(); g.roundRect(4, 4, cw - 8, ch - 8, 18); g.fill();
  g.strokeStyle = "rgba(90,50,20,.55)"; g.lineWidth = 6; g.strokeRect(18, 18, cw - 36, ch - 36);
  const padX = cw * .07, maxW = cw - padX * 2, tf = /[=·Δ_^0-9+]/.test(title) ? BODY : FONT;   // Formeln im Titel in der Textschrift (Zierschrift verformt Buchstaben)
  g.textBaseline = "top";
  let tsz, bsz, y, tl = [], bl = [];
  const items = (lines || []).map(l => U.richT(l)).filter(Boolean), dot = !o.small && items.length > 1;
  const wrapAll = () => { bl = []; const ind = dot ? g.measureText("• ").width : 0; for (const it of items) U.wrapText(g, it, maxW - ind).forEach((q, i) => bl.push([q, dot ? (i ? ind : -1) : 0])); };
  if (o.small) { tsz = ch * .34; bsz = ch * .2; g.font = `700 ${tsz}px ${tf}`; tl = U.wrapText(g, U.richT(title), maxW).slice(0, 2); g.font = `400 ${bsz}px ${BODY}`; wrapAll(); y = ch * .14; }
  else {
    // Schriftgrößen so wählen, dass Titel und Zeilen die Tafel gut ausfüllen (vom Gang aus lesbar), dann senkrecht mittig setzen
    const top = ch * .09, bottom = ch - ch * .08, avail = bottom - top;
    tsz = Math.min(ch * .15, 84); do { g.font = `700 ${tsz}px ${tf}`; tl = U.wrapText(g, U.richT(title), maxW); if (tl.length <= 2) break; tsz -= 3; } while (tsz > 24); tl = tl.slice(0, 2);
    const th = tl.length * tsz * 1.1 + tsz * .35;
    for (bsz = Math.min(ch * .11, 60); bsz > 16; bsz -= 2) { g.font = `400 ${bsz}px ${BODY}`; wrapAll(); if (th + bl.length * bsz * 1.32 <= avail) break; }
    y = top + Math.max(0, (avail - th - bl.length * bsz * 1.32) * .4);
  }
  g.fillStyle = "#4a1a12"; g.textAlign = "center"; g.font = `700 ${tsz}px ${tf}`;
  for (const l of tl) { U.fillRich(g, l, cw / 2, y); y += tsz * 1.1; }
  if (!o.small && tl.length && bl.length) { g.fillStyle = "rgba(90,50,20,.45)"; g.fillRect(cw * .3, y + tsz * .05, cw * .4, 3); }
  g.font = `400 ${bsz}px ${BODY}`; g.fillStyle = "#2b1a10"; g.textAlign = o.small ? "center" : "left"; y += o.small ? bsz * .5 : tsz * .35;
  const ind = dot ? g.measureText("• ").width : 0;
  for (const [l, k] of bl) { if (y > ch - bsz * 1.2) break; const x = o.small ? cw / 2 : padX + ind;
    if (k < 0) { g.fillStyle = "#8a3a1c"; g.fillText("•", padX, y); g.fillStyle = "#2b1a10"; } U.fillRich(g, l, x, y); y += bsz * 1.32; }
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8;
  const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshStandardMaterial({map: t, roughness: .95, transparent: true}));
  m.receiveShadow = true;
  // Rückseite (freistehende Tafeln sind auch von hinten sichtbar)
  const back = new T3.Mesh(m.geometry, mat("darkwood")); back.rotation.y = Math.PI; back.position.z = -.004; m.add(back);
  return m;
}

/* ---------- Stimmung: schwebende Kerzen und Staub ---------- */
// o (Raumthemen): kerzen = Zahl der schwebenden Kerzen (0 = keine), staub = Zahl der Staubteilchen, staubFarbe, steigen (m/s, negativ = sinken)
function ambient(ctx, sc, o = {}){
  const B = ctx.bounds, H = ctx.height || 7.5, N = o.kerzen ?? (ctx.key === "halle" ? 70 : 42), r = U.seeded(99);
  const cand = new T3.InstancedMesh(new T3.CylinderGeometry(.045, .05, .34, 10), mat("color", {color: "#f2ead8", rough: .7}), Math.max(1, N)); cand.castShadow = false; cand.visible = N > 0;
  const pos = [], fl = new Float32Array(N * 3);
  // in den Räumen bleibt der Luftraum über dem Mittelgang (|x| < 2,2) frei für Hängendes und Schwebendes
  const cx = () => { if (ctx.key === "halle") return B.x0 + 1.2 + r() * (B.x1 - B.x0 - 2.4); const s = r() < .5 ? -1 : 1; return s * (2.2 + r() * (B.x1 - 1.2 - 2.2)); };
  for (let i = 0; i < N; i++) pos.push([cx(), H - 2.2 - r() * 1.8, B.z1 + 1 + r() * (B.z0 - B.z1 - 2), r() * 6]);
  ctx.kerzen = pos;   // für die Ausstattung: dort schwebt schon eine Kerze
  const fg = new T3.BufferGeometry(); fg.setAttribute("position", new T3.BufferAttribute(fl, 3));
  const flames = new T3.Points(fg, new T3.PointsMaterial({map: U.glowTex(), color: 0xffc070, size: .32, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}));
  if (N > 0) sc.add(cand, flames);
  const m = new T3.Matrix4();
  const dn = o.staub ?? 260, up = o.steigen ?? .05, dp = new Float32Array(dn * 3); for (let i = 0; i < dn; i++) { dp[i * 3] = B.x0 + r() * (B.x1 - B.x0); dp[i * 3 + 1] = r() * H; dp[i * 3 + 2] = B.z1 + r() * (B.z0 - B.z1); }
  const dg = new T3.BufferGeometry(); dg.setAttribute("position", new T3.BufferAttribute(dp, 3));
  const dust = new T3.Points(dg, new T3.PointsMaterial({color: o.staubFarbe ?? 0xffd98a, size: .03, transparent: true, opacity: .55, depthWrite: false, blending: T3.AdditiveBlending})); sc.add(dust);
  ctx.tick((dt, t) => {
    for (let i = 0; i < N; i++) { const [x, y, z, p] = pos[i], yy = y + Math.sin(t * .8 + p) * .12; m.makeTranslation(x, yy, z); cand.setMatrixAt(i, m);
      fl[i * 3] = x; fl[i * 3 + 1] = yy + .23; fl[i * 3 + 2] = z; }
    cand.instanceMatrix.needsUpdate = true; fg.attributes.position.needsUpdate = true;
    flames.material.size = .3 + .04 * Math.sin(t * 9);
    for (let i = 0; i < dn; i++) { dp[i * 3 + 1] += dt * up; if (dp[i * 3 + 1] > H) dp[i * 3 + 1] = 0; else if (dp[i * 3 + 1] < 0) dp[i * 3 + 1] = H; dp[i * 3] += Math.sin(t * .3 + i) * dt * .02; }
    dg.attributes.position.needsUpdate = true;
  });
}
function placeholder(ctx){ const b = ctx.board(ctx.room.n, [ctx.topic ? ctx.topic.title : ""], {w: 3, h: 1.6}); b.position.set(0, 2.2, -1.5); ctx.group.add(b); }

R3D.kits.zauber = {pal, font: FONT, fontBody: BODY, mat, env, shell, door, station, board, ambient, placeholder, tex, keep};   // tex/keep: für die Ausstattung (13_dekor_zauber.js)
})();
