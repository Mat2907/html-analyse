/* ---------- 17_raum_detektiv_kraft1.js ---------- */
/* =====================================================================
   kraft1 · Hafenkran an der Themse (Raumthema der Detektei, siehe 17_raum_detektiv.js)
   Kai zwischen zwei hohen Lagerhäusern (gelbe und rote Ziegel, Ladeluken mit Wandkränen, Rundbogenfenster, Schriftzug), Holzplanken
   mit Kranschienen, eiserne Laufbrücke zwischen den Speichern (daran hängt bei 6,5 m das Planetarium, z 6,2), dahinter eine zweite
   höher oben. Vorn die Kaikante mit Geländer, Pollern und einem Tor (Anlegestelle), ein großer Hafenkran mit Kiste am Haken, die Themse
   mit Segelbarke, Dampfer und Ruderboot, das Ufer gegenüber im Abendnebel. Gaslaternen, Nebel; Ausstattung: Kisten, Fässer, Tee-Kisten,
   Anker und Taue, Sackkarre, Rettungsringe, Laternen.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D, KIT = R3D && R3D.kits && R3D.kits.detektiv;
if (!T3 || !KIT || !KIT.raum17 || !KIT.raum17.aussen || !KIT._h) return;
const H_ = KIT._h, {U, TAU, M, S, KB, FONT, tex} = H_, R17 = KIT.raum17, A17 = R17.aussen, {mt, ctex, hsl, speck, blob, bohlen, ziegel, felder, moebel, wandKlein, ecken, laterne, HOEHE} = R17;
const PI = Math.PI, V3 = (x, y, z) => new T3.Vector3(x, y, z), stab = A17.stab;

const russ = (g, w, h, r) => { for (let i = 0; i < 30; i++) { const x = r() * w, L = 60 + r() * 200, y = r() * h, gr = g.createLinearGradient(0, y, 0, y + L); gr.addColorStop(0, "rgba(20,16,14,0)"); gr.addColorStop(.4, "rgba(20,16,14,.28)"); gr.addColorStop(1, "rgba(20,16,14,0)");
  g.fillStyle = gr; g.fillRect(x, y, 4 + r() * 14, L); if (y + L > h) g.fillRect(x, y - h, 4 + r() * 14, L); } };
const TX = {
  planken: () => ctex(1024, 1024, "k1-planken", (g, w, h, r) => bohlen(g, w, h, r, {n: 8, holz: [32, 11, 34], extra: (g, w, h, r) => {
    for (let i = 0; i < 14; i++) blob(g, r() * w, r() * h, 40 + r() * 90, 30 + r() * 60, "rgba(14,12,10,.32)");
    for (let i = 0; i < 8; i++) for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(40,36,34,.9)"; g.beginPath(); g.arc(i * w / 8 + w / 16, k * h / 6 + 30, 4, 0, TAU); g.fill(); } }}), [1, 1]),
  gelb: () => ctex(512, 512, "k1-gelb", (g, w, h, r) => ziegel(g, w, h, r, {fuge: "#7a7062", stein: [36, 26, 42], var: 14, extra: russ}), [1, 1]),
  rot: () => ctex(512, 512, "k1-rot", (g, w, h, r) => ziegel(g, w, h, r, {fuge: "#6a5e52", stein: [12, 34, 30], var: 13, extra: russ}), [1, 1]),
  fenster: () => ctex(128, 128, "k1-fenster", (g, w, h, r) => { g.fillStyle = "#1a1c20"; g.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { const x = (i % 3) * 42 + 3, y = ((i / 3) | 0) * 31 + 3, lit = r() < .12;
    g.fillStyle = lit ? "#d8a050" : hsl(210, 10, 14 + r() * 14); g.fillRect(x, y, 38, 27); g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(x, y, 38, 6); } }),
  schrift: () => ctex(1024, 256, "k1-schrift", (g, w, h) => { g.clearRect(0, 0, w, h); g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `700 92px ${FONT}`; g.fillStyle = "rgba(238,228,206,.62)"; g.fillText("LAGERHAUS · TEE · KAFFEE · GEWÜRZE", w / 2, 66);
    g.fillStyle = "#1f3a30"; g.beginPath(); g.roundRect(150, 140, w - 300, 104, 18); g.fill(); g.strokeStyle = "#d8b860"; g.lineWidth = 6; g.beginPath(); g.roundRect(162, 152, w - 324, 80, 12); g.stroke();
    g.font = `700 66px ${FONT}`; g.fillStyle = "#f0dc98"; g.fillText("ANLEGESTELLE", w / 2, 194); }),
  segel: () => ctex(256, 256, "k1-segel", (g, w, h, r) => { g.fillStyle = "#8a4428"; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) blob(g, r() * w, r() * h, 20 + r() * 40, 20 + r() * 40, r() < .5 ? "rgba(60,26,14,.3)" : "rgba(170,100,60,.25)");
    g.strokeStyle = "rgba(40,18,8,.45)"; g.lineWidth = 2; for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, h); g.stroke(); } g.strokeRect(2, 2, w - 4, h - 4); }),
  wasser: () => ctex(256, 256, "k1-wasser", (g, w, h, r) => { g.fillStyle = "#6a6a5e"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const y = r() * h, x = r() * w, L = 10 + r() * 40; g.strokeStyle = r() < .5 ? "rgba(200,190,160,.35)" : "rgba(30,34,30,.4)"; g.lineWidth = 1 + r() * 2;
      g.beginPath(); for (let k = 0; k <= 6; k++) { const xx = (x + k * L / 6) % w; const yy = y + Math.sin(k) * 1.5; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } }, [1, 1]),
  himmel: () => ctex(1024, 512, "k1-himmel", (g, w, h, r) => A17.himmelMalen(g, w, h, r, {verlauf: [[0, "#4a4c54"], [.45, "#7a746e"], [.82, "#b09878"], [1, "#c4ab86"]], unten: "#5a5448",
    dunst: "190,170,138", sonne: [.65, .37, 12, "255,206,140"], wolken: {n: 16, farbe: "rgba(96,90,88,.32)", band: [.12, .4]}})),
  env: () => { const t = ctex(512, 256, "k1-env", (g, w, h, r) => A17.himmelMalen(g, w, h, r, {verlauf: [[0, "#55565c"], [.8, "#a8947a"], [1, "#bca684"]], unten: "#3e3a34"})); t.mapping = T3.EquirectangularReflectionMapping; return t; },
  // gegenüberliegendes Ufer im Nebel: Speicher, Kräne, Schornsteine, Kirchtürme, eine Brücke (oben durchsichtig)
  ufer: () => ctex(1024, 256, "k1-ufer", (g, w, h, r) => { g.clearRect(0, 0, w, h); const yb = h * .985;
    const col = k => `rgba(${150 + k * 30},${138 + k * 28},${118 + k * 24},${.9 - k * .25})`;
    for (const k of [0, 1]) { for (let x = -10; x < w; ) { const bw = 18 + r() * 46, bh = (k ? 18 : 30) + r() * (k ? 30 : 70); g.fillStyle = col(k); g.fillRect(x, yb - bh - k * 6, bw, bh + k * 6);
        if (r() < .3) g.fillRect(x + bw * .3, yb - bh - 20, 5, 20); x += bw + r() * 6; } }
    g.fillStyle = col(.5); for (let i = 0; i < 7; i++) { const x = r() * w, s = 40 + r() * 50; g.fillRect(x - 5, yb - s * .8, 10, s * .8); g.beginPath(); g.moveTo(x - 6, yb - s * .8); g.lineTo(x, yb - s * 1.3); g.lineTo(x + 6, yb - s * .8); g.fill(); }
    { const x = w * .38, y = yb - 70; g.beginPath(); g.arc(x, y, 18, PI, 0); g.fill(); g.fillRect(x - 22, y, 44, 70); g.fillRect(x - 2, y - 34, 4, 18); }
    for (let i = 0; i < 4; i++) { const x = w * (.55 + i * .1), y = yb - 40; g.strokeStyle = col(.4); g.lineWidth = 3; g.beginPath(); g.moveTo(x, yb); g.lineTo(x, y - 30); g.lineTo(x - 40, y - 46); g.stroke(); }
    { const x0 = w * .02, x1 = w * .3, yd = yb - 34; g.fillStyle = col(.2); g.fillRect(x0, yd, x1 - x0, 7); for (let x = x0 + 20; x < x1; x += 46) { g.beginPath(); g.moveTo(x - 20, yb); g.quadraticCurveTo(x, yd - 4, x + 20, yb); g.lineTo(x + 20, yd + 6); g.lineTo(x - 20, yd + 6); g.fill(); }
      for (const x of [x0 + 60, x1 - 60]) { g.fillRect(x - 10, yd - 60, 20, 60 + 34); g.beginPath(); g.moveTo(x - 12, yd - 60); g.lineTo(x, yd - 80); g.lineTo(x + 12, yd - 60); g.fill(); } }
    for (let i = 0; i < 12; i++) { const x = r() * w; for (let k = 0; k < 5; k++) blob(g, x + k * 8, yb - 110 - k * 9, 10 + k * 3, 6 + k * 2, "rgba(170,160,145,.3)"); }
    const ne = g.createLinearGradient(0, h * .4, 0, h); ne.addColorStop(0, "rgba(190,172,140,0)"); ne.addColorStop(1, "rgba(190,172,140,.55)"); g.globalCompositeOperation = "source-atop"; g.fillStyle = ne; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over"; })
};

// Schiffsrumpf: Grundriss (Heck flach, Bug spitz) als Extrusion, liegt auf y = 0 (Kiel) bis Hh, Länge entlang x
function rumpfGeo(L, Bm, Hh){ const s = new T3.Shape(), b = Bm / 2, x0 = -L / 2, x1 = L / 2;
  s.moveTo(x0, -b * .8); s.lineTo(x1 - L * .22, -b); s.quadraticCurveTo(x1 - L * .04, -b * .9, x1, 0); s.quadraticCurveTo(x1 - L * .04, b * .9, x1 - L * .22, b); s.lineTo(x0, b * .8); s.closePath();
  return new T3.ExtrudeGeometry(s, {depth: Hh, bevelEnabled: false, curveSegments: 6}).rotateX(-PI / 2); }
function segelGeo(pts){ const g = new T3.BufferGeometry(), p = [], uv = []; const tri = (a, b, c) => { for (const q of [a, b, c]) { p.push(q[0], q[1], 0); uv.push(q[2], q[3]); } };
  if (pts.length === 4) { tri(pts[0], pts[1], pts[2]); tri(pts[0], pts[2], pts[3]); } else tri(pts[0], pts[1], pts[2]);
  g.setAttribute("position", new T3.Float32BufferAttribute(p, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; }

/* ---------- Hülle ---------- */
function kai(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ, r = U.seeded(1851), lamps = A.hu.lampen, ZF = -11.25, YC = 11.2;
  A.hu.deckeY = (x, z) => Math.abs(z - 6.2) < .95 ? H : Math.abs(z + 4.5) < .9 ? 8.4 : YC;   // Laufbrücken; sonst offener Himmel
  A.boden(mt("k1-boden", () => { const t = TX.planken(); t.center.set(.5, .5); t.rotation = PI / 2; return S({map: t, color: 0xb8b0a4, roughness: .62, metalness: .05}); }), 3.2);
  A17.kuppel(A, "k1", TX.himmel());
  A17.kulisse(A, "k1-ufer", TX.ufer(), {r: 58, a0: -1.4, a1: 1.4, y0: -1.0, hh: 14});
  // Themse: Wasserfläche (Wellen ziehen langsam), Kaimauer, Kaikante
  { const wg = new T3.PlaneGeometry(220, 120).rotateX(-PI / 2); U.scaleUV(wg, 60, 33); const wm = mt("k1-wasser", () => S({map: TX.wasser(), color: 0x46524a, roughness: .12, metalness: .7}));
    const w = A.mesh(wg, wm, {receive: false}); w.position.set(0, -.75, ZF - 60); w.userData.noPick = true; ctx.tick(dt => { wm.map.offset.x = (wm.map.offset.x + dt * .006) % 1; wm.map.offset.y = (wm.map.offset.y + dt * .011) % 1; }); }
  K.box("stein", 16.6, 1.4, .3, M(0, -.75, ZF - .1)); K.box("holz", 16.6, .2, .3, M(0, -.02, ZF - .05)); K.box("boden2", 16, .02, .3, M(0, -.01, -11.12));
  for (const x of [-7.2, -4.2, 4.0, 7.4]) K.add("holz", new T3.CylinderGeometry(.17, .19, 2.4, 8), M(x, -.6, ZF - .45));
  for (const x of [-2.75, -2.6, 2.6, 2.75]) K.box("stahl", .06, .014, 22, M(x, .007, 0));   // Kranschienen im Bohlenboden
  // Lagerhäuser links (gelbe Ziegel) und rechts (rote Ziegel): Wand, Sockel, Gurtgesims, Traufgesims, Pfeiler
  for (const s of [-1, 1]) { const x = s * 8, key = s < 0 ? "gelb" : "rot", L = 11 - ZF, zc = (11 + ZF) / 2;
    const wg = new T3.PlaneGeometry(L, YC, 1, 10), p = wg.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) + YC / 2, k = y < 1.2 ? .62 + y * .3 : y > 9 ? 1 - (y - 9) * .06 : 1; c.set([k, k * .97, k * .93], i * 3); }
    wg.setAttribute("color", new T3.BufferAttribute(c, 3)); U.scaleUV(wg, L / 2.4, YC / 2.4);
    const wm = A.mesh(wg, mt("k1-" + key + "V", () => S({map: TX[key](), vertexColors: true, roughness: .9}))); wm.position.set(x, YC / 2, zc); wm.rotation.y = -s * PI / 2;
    K.box("stein", .12, .5, L, M(x - s * .06, .25, zc)); K.box("stein", .14, .16, L, M(x - s * .07, 5.72, zc)); K.box("stein", .42, .32, L + .4, M(x - s * .14, YC - .1, zc)); K.box("stein", .3, .12, L + .4, M(x - s * .1, YC - .32, zc));
    for (const z of [...P, ZF + .32]) { K.box(key, .22, YC - .4, .6, M(x - s * .11, (YC - .4) / 2, z), {uv: [.25, 4.5]}); K.box("stein", .3, .22, .7, M(x - s * .15, 5.72, z)); }
    for (let i = 0; i < 3; i++) K.box(key, 1.4, 1.6 + i * .5, 1.2, M(s * (9.5 + i * 1.8), YC + .8 + i * .25, -6 + i * 7.5), {uv: [.6, .7]});   // Schornsteine auf dem Dach
    // Felder: Ladeluken (zwei mit Wandkran), oben Fenster; bei z 6,75 die Tür der Laufbrücke
    for (const zc2 of [6.75, 2.25, -2.25, -6.75]) {
      if (s < 0) for (const dz of [-1, 1]) { const z = zc2 + dz * 1.0; K.add("fenster", new T3.PlaneGeometry(.9, 1.15), M(x - s * .012, 9.55, z, 0, -s * PI / 2, 0)); K.box("stein", .14, .1, 1.1, M(x - s * .06, 8.95, z)); K.box("stein", .12, .2, 1.1, M(x - s * .06, 10.2, z)); }
      if (zc2 === 6.75) continue;
      K.add("loch", new T3.PlaneGeometry(1.5, 1.6), M(x - s * .012, 6.75, zc2, 0, -s * PI / 2, 0)); K.box("stein", .16, .18, 1.8, M(x - s * .08, 7.64, zc2)); K.box("stein", .16, .12, 1.8, M(x - s * .08, 5.9, zc2));
      K.box("luke", .06, 1.55, .74, M(x - s * .03, 6.75, zc2 - .37));
      { const hz = zc2 + .74; K.box("luke", .06, 1.55, .74, M(x - s * .37, 6.75, hz + .03, 0, s * .2 + (s < 0 ? -PI / 2 : PI / 2), 0)); }
      A.belege({x0: s < 0 ? -8 : 7.15, x1: s < 0 ? -7.15 : 8, y0: 5.8, y1: 7.7, z0: zc2 - .9, z1: zc2 + 1.0});
      if ((s < 0 && zc2 === -2.25) || (s > 0 && zc2 === 2.25) || zc2 === -6.75) {   // Wandkran: Ausleger, Strebe, Rolle, Seil mit Haken bzw. Ballen
        const xa = x - s * 1.25; stab(K, "eisen", [x, 8.35, zc2], [xa, 8.35, zc2], .1, .14); stab(K, "eisen", [x, 7.85, zc2], [xa + s * .15, 8.3, zc2], .06);
        K.add("eisen", new T3.CylinderGeometry(.16, .16, .06, 14), M(xa, 8.2, zc2, PI / 2)); K.add("tau", new T3.CylinderGeometry(.014, .014, 1.5, 4), M(xa + s * .16, 7.45, zc2));
        if (zc2 === -6.75) { K.add("eisen", new T3.TorusGeometry(.07, .015, 4, 10, PI * 1.4), M(xa + s * .16, 6.62, zc2)); }
        else { K.box("ballen", .6, .5, .6, M(xa + s * .16, 6.45, zc2, 0, .3, 0)); for (const dy of [-.12, .12]) K.box("tau", .62, .03, .62, M(xa + s * .16, 6.45 + dy, zc2, 0, .3, 0)); }
        A.belege({x0: s < 0 ? -8 : xa - .5, x1: s < 0 ? xa + .5 : 8, y0: 6.1, y1: 8.6, z0: zc2 - .5, z1: zc2 + .5}); } }
    // Wandlaternen an den Pfeilern
    for (const z of P) lamps.push(A17.wandLaterne(K, s, z, 3.25, 7.78));
    for (const z of P) A.belege(ctx.wand(s < 0 ? "left" : "right", z, 3.1, 3.8, .45, .65));
  }
  // Schriftzug auf dem rechten Speicher (verblasste Farbe auf Ziegeln)
  K.add("schrift", new T3.PlaneGeometry(15.5, 1.9), WL.right.m(WL.right.u(8, 0), 9.6, .015), {uvr: [0, .5, 1, 1]});
  // Laufbrücke über dem Gang (Unterkante 6,5 m bei z 6,2) und eine zweite höher oben (z −4,5)
  const bruecke = (zc, y0, br) => { const z0 = zc - br / 2, z1 = zc + br / 2, yd = y0 + .14, yt = yd + 1.0;
    K.box("stahl", 16, .14, br, M(0, y0 + .07, zc)); for (const x of [-5.5, -2.5, 2.5, 5.5]) K.box("stahl", .12, .2, br, M(x, y0 - .1 + .01, zc));
    for (const z of [z0, z1]) { K.box("stahl", 16, .1, .1, M(0, yt, z)); K.box("stahl", 16, .12, .08, M(0, yd + .05, z));
      for (let i = 0; i <= 16; i++) { const x = -8 + i; K.box("stahl", .05, 1.0, .05, M(x, yd + .5, z)); if (i < 16) stab(K, "stahl", [x, yd + .06, z], [x + 1, yt - .04, z], .035, .02); } }
    for (const s of [-1, 1]) K.add("loch", new T3.PlaneGeometry(br - .2, 2.0), M(s * 7.765, yd + 1.0, zc, 0, -s * PI / 2, 0)); };
  bruecke(6.2, H, 1.9); bruecke(-4.5, 8.4, 1.7);
  for (const x of [-5.5, -2.5, 2.5, 5.5]) A.belege({x0: x - .1, x1: x + .1, y0: H - .2, y1: H, z0: 5.2, z1: 7.2});
  // Rückwand: Lagerhaus mit Torbogen um die Tür, Ladeluke mit Kranbalken und Kiste darüber, Fenster
  { const sh = new T3.Shape(); sh.moveTo(-8, 0); sh.lineTo(8, 0); sh.lineTo(8, YC); sh.lineTo(-8, YC); sh.closePath();
    const R = 3.88, yc = 3.12, ho = new T3.Path(); ho.moveTo(-2.6, 0); ho.lineTo(-2.6, 6.0); for (let i = 1; i < 12; i++) { const a = PI - Math.acos(2.6 / R) - i / 12 * (PI - 2 * Math.acos(2.6 / R)); ho.lineTo(R * Math.cos(a), yc + R * Math.sin(a)); } ho.lineTo(2.6, 6.0); ho.lineTo(2.6, 0); ho.closePath(); sh.holes.push(ho);
    for (const [x, y] of [[-5.4, 9.5], [5.4, 9.5], [-5.4, 7.0], [5.4, 7.0]]) { const f = new T3.Path(); f.moveTo(x - .5, y - .6); f.lineTo(x + .5, y - .6); f.lineTo(x + .5, y + .6); f.lineTo(x - .5, y + .6); f.closePath(); sh.holes.push(f); }
    const g = U.scaleUV(new T3.ShapeGeometry(sh, 6), 1 / 2.4, 1 / 2.4); K.add("gelb", g, M(0, 0, B.z0, 0, PI, 0), {uv: [1, 1]});
    for (const [x, y] of [[-5.4, 9.5], [5.4, 9.5], [-5.4, 7.0], [5.4, 7.0]]) { K.add("fenster", new T3.PlaneGeometry(1.0, 1.2), M(x, y, B.z0 + .05, 0, PI, 0)); K.box("stein", 1.2, .12, .2, M(x, y - .66, B.z0 - .08)); }
    const ring = new T3.Shape(), a0 = Math.acos(2.6 / R); for (let i = 0; i <= 12; i++) { const a = a0 + i / 12 * (PI - 2 * a0); i ? ring.lineTo((R + .4) * Math.cos(a), yc + (R + .4) * Math.sin(a)) : ring.moveTo((R + .4) * Math.cos(a), yc + (R + .4) * Math.sin(a)); }
    for (let i = 12; i >= 0; i--) { const a = a0 + i / 12 * (PI - 2 * a0); ring.lineTo(R * Math.cos(a), yc + R * Math.sin(a)); } ring.closePath();
    K.add("stein", new T3.ExtrudeGeometry(ring, {depth: .16, bevelEnabled: false}), M(0, 0, B.z0 - .16)); for (const s of [-1, 1]) K.box("stein", .4, 6.0, .16, M(s * 2.8, 3.0, B.z0 - .08));
    K.add("loch", new T3.PlaneGeometry(5.2, 7.2), M(0, 3.6, B.z0 + 1.6, 0, PI, 0)); for (const s of [-1, 1]) K.box("gelb", .1, 7.2, 1.6, M(s * 2.62, 3.6, B.z0 + .8), {uv: [.3, 3]});
    K.add("loch", new T3.PlaneGeometry(1.5, 1.7), M(0, 8.4, B.z0 - .012, 0, PI, 0)); K.box("stein", 1.8, .16, .2, M(0, 9.34, B.z0 - .08)); K.box("stein", 1.8, .12, .26, M(0, 7.5, B.z0 - .1));
    stab(K, "holz", [0, 9.7, B.z0], [0, 9.7, B.z0 - 1.3], .2, .24); stab(K, "holz", [0, 8.9, B.z0], [0, 9.6, B.z0 - .8], .1);
    K.add("eisen", new T3.CylinderGeometry(.15, .15, .06, 14), M(0, 9.5, B.z0 - 1.15, 0, 0, PI / 2)); K.add("tau", new T3.CylinderGeometry(.014, .014, 2.2, 4), M(0, 8.4, B.z0 - 1.15));
    K.box("ballen", .8, .7, .7, M(0, 6.95, B.z0 - 1.15, 0, .25, 0)); for (const dy of [-.18, .18]) K.box("tau", .82, .04, .72, M(0, 6.95 + dy, B.z0 - 1.15, 0, .25, 0));
    K.box("stein", 16.4, .42, .4, M(0, YC - .1, B.z0 - .14)); K.box("stein", 16, .5, .12, M(0, .25, B.z0 - .06));
    A.belege({x0: -.6, x1: .6, y0: 6.5, y1: 9.9, z0: 9.5, z1: 11}); }
  // Kaikante vorn: Torpfeiler mit Laternen und eisernem Bogen (Schild „Anlegestelle“), Geländer, Poller
  for (const s of [-1, 1]) { const x = s * 2.78; K.box("rot", .66, 5.8, .66, M(x, 2.9, -10.92), {uv: [.3, 2.4]}); K.box("stein", .8, .22, .8, M(x, 5.9, -10.92)); K.box("stein", .72, .3, .72, M(x, .15, -10.92));
    lamps.push(A17.laternenPfahl(K, x, -10.92, {h: 1.7, y0: 6.0})); A.hindernis(x, -10.92, .75, .75); A.belege({x0: x - .45, x1: x + .45, y0: 0, y1: 7.4, z0: -11, z1: -10.5}); }
  K.add("eisen", new T3.TorusGeometry(2.78, .06, 6, 40, PI), M(0, 6.0, -10.92)); K.add("eisen", new T3.TorusGeometry(2.55, .03, 4, 40, PI), M(0, 6.0, -10.92));
  for (let i = 1; i < 10; i++) { const a = i / 10 * PI; stab(K, "eisen", [Math.cos(a) * 2.55, 6 + Math.sin(a) * 2.55, -10.92], [Math.cos(a) * 2.78, 6 + Math.sin(a) * 2.78, -10.92], .03); }
  K.add("schrift", new T3.PlaneGeometry(2.4, .3), M(0, 7.9, -10.88), {uvr: [.12, .03, .88, .45]});
  for (const s of [-1, 1]) { const xs = [3.3, 4.5, 5.7, 6.9, 7.85]; for (const x of xs) K.box("eisen", .06, 1.05, .06, M(s * x, .52, -11.12)); for (const y of [.55, 1.02]) K.box("eisen", 4.6, .04, .04, M(s * 5.58, y, -11.12)); }
  for (const x of [-7.2, -4.7, 4.7]) { K.add("eisen", new T3.LatheGeometry([[0, 0], [.2, 0], [.17, .1], [.14, .42], [.2, .52], [.18, .6], [0, .62]].map(([a, b]) => new T3.Vector2(a, b)), 12), M(x, 0, -10.7)); A.hindernis(x, -10.7, .45, .45); A.belege({x0: x - .25, x1: x + .25, y0: 0, y1: .7, z0: -11, z1: -10.45}); }
  // Hafenkran vorn rechts: Sockel, Drehkranz, Kranhaus, Bock, Gitterausleger über den Fluss, Seil mit Kiste
  { const cx = 6.9, cz = -10.15, piv = [6.55, 1.6, -10.7], tip = [3.4, 12.6, -17.2];
    K.box("stein", 1.5, .5, 1.5, M(cx, .25, cz)); K.add("stahl", new T3.CylinderGeometry(.66, .7, .3, 16), M(cx, .65, cz));
    K.box("kranhaus", 1.3, 1.7, 1.4, M(cx, 1.65, cz)); for (const k of [-1, 1]) K.box("schindel", .9, .05, 1.6, M(cx + k * .36, 2.66, cz, 0, 0, -k * .5)); K.add("fenster", new T3.PlaneGeometry(.5, .5), M(cx - .66, 1.9, cz, 0, -PI / 2, 0));
    K.box("stahl", 1.0, .8, .5, M(cx, 1.0, cz + .85)); for (const k of [-1, 1]) stab(K, "stahl", [cx + k * .55, 2.5, cz + .5], [cx, 4.7, cz], .08);
    const d = V3(tip[0] - piv[0], 0, tip[2] - piv[2]).normalize(), o = V3(-d.z, 0, d.x).multiplyScalar(.32), q = (p, k, s) => [p[0] + o.x * k * s, p[1], p[2] + o.z * k * s];
    for (const k of [-1, 1]) stab(K, "stahl", q(piv, k, 1), q(tip, k, .35), .12);
    for (let i = 0; i < 14; i++) { const t0 = i / 14, t1 = (i + 1) / 14, at = t => [piv[0] + (tip[0] - piv[0]) * t, piv[1] + (tip[1] - piv[1]) * t, piv[2] + (tip[2] - piv[2]) * t], w = t => 1 - .65 * t;
      stab(K, "stahl", q(at(t0), i % 2 ? 1 : -1, w(t0)), q(at(t1), i % 2 ? -1 : 1, w(t1)), .05); stab(K, "stahl", q(at(t1), -1, w(t1)), q(at(t1), 1, w(t1)), .04); }
    for (const k of [-1, 1]) stab(K, "tau", [cx, 4.7, cz], q(tip, k, .3), .03);
    K.add("eisen", new T3.CylinderGeometry(.34, .34, .12, 16), M(...tip, 0, 0, PI / 2));
    const lg = new T3.Group(); lg.position.set(tip[0], tip[1] - .3, tip[2]); G.add(lg); const LK = H_.bucket(), yb = -7.6;
    LK.add("t", new T3.CylinderGeometry(.018, .018, -yb - .7, 4).translate(0, (yb + .7) / 2, 0), M()); LK.add("e", new T3.TorusGeometry(.12, .03, 4, 10, PI * 1.4), M(0, yb + .62, 0));
    for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) LK.add("t", new T3.CylinderGeometry(.012, .012, .9, 3), M(a * .45, yb + .2, b * .45, -b * .7, 0, a * .7));
    LK.add("k", new T3.BoxGeometry(1.1, 1.0, 1.1), M(0, yb - .5, 0, 0, .4, 0)); for (const dy of [-.35, .35]) LK.add("e", new T3.BoxGeometry(1.12, .06, 1.12), M(0, yb - .5 + dy, 0, 0, .4, 0));
    LK.mesh("t", mt("k1-tau", () => S({color: 0x8a7656, roughness: .9})), {parent: lg}); LK.mesh("e", A17.MA.eisen(), {parent: lg}); LK.mesh("k", mat0("holz"), {parent: lg, cast: true});
    ctx.tick((dt, t) => { lg.rotation.z = Math.sin(t * .5) * .025; lg.rotation.x = Math.sin(t * .37 + 1) * .02; lg.children[2] && (lg.children[2].rotation.y = Math.sin(t * .2) * .1); });
    A.hindernis(cx, cz + .15, 1.7, 1.9); A.belege({x0: 5.95, x1: 8, y0: 0, y1: 5.0, z0: -11, z1: -9.2}); }
  // Schiffe: Segelbarke am Kai, Dampfer weiter draußen (Rauch steigt auf), Ruderboot an der Treppe
  { const bx = -3.6, bz = -17.2, yw = -.75;
    K.add("rumpf", rumpfGeo(12, 3.4, 1.35), M(bx, yw - .25, bz), {c: "#1c1a18"}); K.add("rumpf", new T3.BoxGeometry(12.2, .14, 3.5), M(bx - .2, yw + .9, bz), {c: "#7a2a1e"});
    K.add("holz", new T3.BoxGeometry(10.6, .05, 3.0), M(bx - .4, yw + 1.08, bz)); for (const x of [-2.6, .4]) K.box("holz", 2.2, .35, 1.8, M(bx + x, yw + 1.25, bz));
    K.add("rumpf", new T3.CircleGeometry(1.3, 10, 0, PI), M(bx + 1.6, yw + .7, bz + 1.78, 0, 0, PI, 1, 1.8, 1), {c: "#2a2420"});
    const mx = bx + 2.4; K.add("holz", new T3.CylinderGeometry(.09, .15, 14, 8), M(mx, yw + 8, bz)); stab(K, "holz", [mx, yw + 2.2, bz], [bx - 4.2, yw + 12.6, bz], .1);
    K.add("segel", segelGeo([[0, 1.6, 1, 0], [0, 11.8, 1, 1], [-6.4, 12.4, 0, 1], [-5.6, 1.9, 0, 0]]), M(mx - .1, yw, bz + .05));
    K.add("segel", segelGeo([[0, 12.3, 1, 0], [0, 15.2, 1, 1], [-3.2, 12.6, 0, 0]]), M(mx - .1, yw, bz + .05));
    K.add("segel", segelGeo([[.2, 10.5, 0, 1], [5.6, 1.6, 1, 0], [.3, 1.8, 0, 0]]), M(mx, yw, bz + .02)); stab(K, "tau", [mx, yw + 15, bz], [bx + 6.4, yw + 1.2, bz], .02); stab(K, "tau", [mx, yw + 14, bz], [bx - 5.8, yw + 1.2, bz], .02);
    const sx = 8.5, sz = -27; K.add("rumpf", rumpfGeo(17, 3.8, 1.9), M(sx, yw - .5, sz, 0, PI, 0), {c: "#141416"}); K.add("rumpf", new T3.BoxGeometry(6.5, 1.5, 2.8), M(sx + .5, yw + 2.15, sz), {c: "#d8d2c4"});
    K.add("rumpf", new T3.CylinderGeometry(.55, .6, 4.2, 12), M(sx + 1.2, yw + 4.9, sz), {c: "#8a2418"}); K.add("rumpf", new T3.CylinderGeometry(.57, .57, .7, 12), M(sx + 1.2, yw + 6.8, sz), {c: "#141416"});
    K.add("holz", new T3.CylinderGeometry(.08, .1, 9, 6), M(sx - 4.5, yw + 5.5, sz)); K.add("holz", new T3.CylinderGeometry(.08, .1, 8, 6), M(sx + 5.5, yw + 5, sz));
    const n = 12, pp = new Float32Array(n * 3), ph = [...Array(n)].map((_, i) => i / n), pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.BufferAttribute(pp, 3));
    const rauch = new T3.Points(pg, mt("k1-rauch", () => new T3.PointsMaterial({map: tex.fog(), color: 0x8a8480, size: 5, transparent: true, opacity: .5, depthWrite: false}))); rauch.userData.noPick = true; rauch.frustumCulled = false; G.add(rauch);
    ctx.tick((dt, t) => { for (let i = 0; i < n; i++) { const k = (ph[i] + t * .035) % 1; pp.set([sx + 1.2 - k * 7, yw + 7.3 + k * 9, sz + Math.sin(k * 5 + i) * .8], i * 3); } pg.attributes.position.needsUpdate = true; });
    K.add("rumpf", rumpfGeo(3.6, 1.3, .5), M(5.6, yw - .2, -12.3), {c: "#5a3a22"}); for (const k of [-1, 1]) stab(K, "holz", [5.2, yw + .35, -12.3 + k * .5], [4.2, yw + .1, -12.3 + k * 1.4], .05);
    stab(K, "tau", [5.6 + 1.8, yw + .3, -12.3], [7.3, 0, -11.3], .02); }
  A.fertig([["gelb", () => mt("k1-gelb", () => S({map: TX.gelb(), roughness: .9}))], ["rot", () => mt("k1-rot", () => S({map: TX.rot(), roughness: .9}))],
    ["stein", () => mt("k1-stein", () => S({color: 0x8a8478, roughness: .85}))], ["stahl", () => mt("k1-stahl", () => S({color: 0x24302c, metalness: .5, roughness: .5})), {cast: true}],
    ["eisen", A17.MA.eisen], ["glasL", A17.MA.glasL], ["flamme", A17.MA.flamme], ["holz", () => mat0("holz")], ["boden2", () => mt("k1-kante", () => S({color: 0x6a6258, roughness: .8}))],
    ["fenster", () => mt("k1-fenster", () => S({map: TX.fenster(), roughness: .25, metalness: .3, emissive: 0xffffff, emissiveMap: TX.fenster(), emissiveIntensity: .25}))],
    ["loch", () => mt("k1-loch", () => KB({color: 0x0e0c0a}))], ["luke", () => mt("k1-luke", () => S({map: tex.wood(true), color: 0x5a7262, roughness: .7}))],
    ["tau", () => mt("k1-tau", () => S({color: 0x8a7656, roughness: .9}))], ["ballen", () => mt("k1-ballen", () => S({color: 0xb09a74, roughness: 1}))],
    ["kranhaus", () => mt("k1-kranhaus", () => S({map: tex.wood(false), color: 0x9a4a36, roughness: .7}))], ["schindel", () => mt("k1-schindel", () => S({color: 0x3a3634, roughness: .8}))],
    ["schrift", () => mt("k1-schrift", () => S({map: TX.schrift(), transparent: true, depthWrite: false, roughness: .9})), {receive: false}],
    ["rumpf", R17.ST.vc, {color: true}], ["segel", () => mt("k1-segel", () => S({map: TX.segel(), side: T3.DoubleSide, roughness: .95}))]]);
  A.halos(lamps, 0xffcf8a, .7);
  return {punkt: [[0xffc27a, 6, 12, -7.3, 3.45, 4.5], [0xffc27a, 6, 12, 7.3, 3.45, -4.5], [0xffcf90, 5, 13, 0, 6.6, -10.4]],
    flackern: (t, L) => { for (let i = 0; i < 3; i++) L[i].intensity = L[i].userData.i0 * (.93 + .05 * Math.sin(t * 1.9 + i * 2.3) + .02 * Math.sin(t * 2.7 + i)); }};
}
const mat0 = k => k === "holz" ? mt("k1-holz", () => S({map: tex.wood(true), color: 0x9a8a7a, roughness: .8})) : null;

/* ---------- Ausstattung ---------- */
function rettungsring(D, F, x, y){ D.tor("vc", .26, .065, 8, 22, F.m(x, y, .09), "#ece6d8"); for (let k = 0; k < 4; k++) D.tor("vc", .262, .068, 8, 6, F.m(x, y, .09, 0, 0, k * PI / 2 + PI / 8), "#b02a1e", PI / 4);
  D.bx("iron", .04, .14, .06, F.m(x, y + .3, .03)); D.rod("vc", F, [x - .2, y + .12, .1], [x, y + .3, .05], .008, 3, "#c8b890"); D.rod("vc", F, [x + .2, y + .12, .1], [x, y + .3, .05], .008, 3, "#c8b890"); }
function taurolle(D, F, x, z, y = 0, n = 5, col = "#a88a5a"){ for (let i = 0; i < n; i++) D.tor("vc", .26 - i * .018, .04, 6, 20, F.m(x, y + .04 + i * .07, z, PI / 2), col); }
function sackkarre(D, F){ const C = D.subF(F, .1, .32, 0); for (const s of [-1, 1]) { D.rod("iron", C, [s * .2, .05, .05], [s * .2, 1.3, -.12], .018, 5); D.tor("iron", .14, .03, 6, 14, C.m(s * .26, .14, -.02, 0, PI / 2, 0)); }
  D.bx("iron", .5, .03, .25, C.m(0, .04, .14)); for (const y of [.5, .9]) D.rod("iron", C, [-.2, y, (1.3 - y) * -.12 + .03], [.2, y, (1.3 - y) * -.12 + .03], .012, 4);
  for (let i = 0; i < 3; i++) { D.bx("vc", .42, .36, .3, C.m(0, .26 + i * .3, .2 - i * .03, -.12, (i - 1) * .1, 0), "#a8946c"); D.sp("vc", .14, 8, 6, C.m(0, .44 + i * .3, .2 - i * .03, 0, 0, 0, 1.4, .5, 1), "#9a8660"); } }
function ausstattung(D){
  R17.dekorMat(D); const C = D.COMP, {WL, R} = D.st();
  C.t_kisten = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.3, .8, true)], build: F => { D.crate(F, -.45, 0, .36, .64, .08, true); D.crate(F, -.42, .64, .34, .44, -.15); D.crate(F, .38, 0, .32, .5, -.1, true);
    for (const [x, y, ry] of [[.38, .75, .3], [.8, .25, -.2]]) { D.bx("vc", .36, .5, .3, F.m(x, y, .3, 0, ry, .06), "#8a7656"); D.sp("vc", .15, 8, 6, F.m(x, y + .27, .3, 0, 0, 0, 1.1, .5, .9), "#7a6646"); } }});
  C.t_faesser = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.4, .75, true)], build: F => { D.barrel(F, -.45, 0, .35); D.barrel(F, .42, 0, .35, .9); D.barrel(F, -.2, .84, .32, .55, true); }});
  C.t_anker = (w, a) => ({b: [D.q(w, a, -1.25, 1.25, 0, 1.6, .85, true)], build: F => { D.anchor(F, -.5); taurolle(D, F, .75, .45, 0, 6); }});
  C.t_tee = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.25, .7, true)], build: F => { for (let i = 0; i < 3; i++) D.crate(F, -.6 + i * .6, 0, .35, .56, (R() - .5) * .1, true); for (let i = 0; i < 2; i++) D.crate(F, -.3 + i * .6, .56, .35, .54, (R() - .5) * .2, true); }});
  C.t_karre = (w, a) => ({b: [D.q(w, a, -.5, .7, 0, 1.45, .75, true)], build: F => sackkarre(D, F)});
  C.t_taue = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, .9, .8, true)], build: F => { taurolle(D, F, -.45, .4, 0, 7); taurolle(D, F, .35, .38, 0, 4, "#7a6a4a"); D.barrel(F, .5, .28, .3, .6, true);
    for (let i = 0; i < 9; i++) D.tor("iron", .05, .014, 4, 8, F.m(-.1 + i * .06, .04, .7, PI / 2 + (i % 2) * PI / 2, 0, 0)); }});
  moebel(D, felder(D), ["t_kisten", "t_faesser", "t_anker", "t_tee", "t_karre", "t_taue", "t_kisten", "t_faesser"], 6, ["t_kisten", "t_faesser"]);
  wandKlein(D, felder(D).filter(p => !p.low), [{w: .62, y0: 1.95, y1: 2.62, d: .2, fn: (F, x) => rettungsring(D, F, x, 2.28)}, {w: .3, y0: 1.95, y1: 2.6, d: .26, fn: (F, x) => { D.bx("iron", .03, .03, .2, F.m(x, 2.5, .1)); laterne(D, F, x, 2.06, .2); }},
    {w: .5, y0: 1.95, y1: 2.62, d: .2, fn: (F, x) => { D.bx("iron", .03, .03, .2, F.m(x, 2.48, .1)); for (let k = 0; k < 6; k++) D.tor("vc", .16, .025, 4, 16, F.m(x, 2.25, .06 + k * .025, 0, 0, 0, 1, 1.3, 1), "#a88a5a"); }}]);
  for (const [s, x, kind] of [["front", -6.3, "t_kisten"], ["back", -5.4, "t_faesser"], ["back", 5.6, "t_tee"]]) { const w = WL[s], c = C[kind](w, x); if (D.claim(...c.b)) c.build(D.FW(w, x)); }
  ecken(D, (w, a, F, i) => { if (D.claim(D.q(w, a, -.45, .45, 0, 1.3, .7, true))) { D.barrel(F, 0, 0, .34, .85); if (i % 2) taurolle(D, F, .1, .5, .85, 3); } });
  // Flaschenzug mit Kiste an der Laufbrücke (seitlich des Planetariums), wenn die Sicht frei bleibt
  const placed = [], Z = R17.luft(D, placed, [6.2], [3.4, -3.4], .5, 3.7, HOEHE); if (Z) D.pulley(...Z, .8);
}

KIT.raum.kraft1 = {titel: "Hafenkran an der Themse", pult: true,   // Stationen als Stehpult mit Laterne statt Schreibtisch (12_detektiv.js)
  licht: {bg: 0x8a7c6c, nebel: 0xb6a488, dichte: .024, envTex: () => TX.env(), himmel: [0xead8bc, 0x4a4238, 1.0], umgebung: [0xdccab0, .22], sonne: [0xffc890, 1.45, [10, 9, -14]], fuell: [0xb8c6dc, .5, [-6, 10, 15]]},
  huelle: kai, ausstattung,
  stimmung: {staub: {farbe: 0xe8e0cc, n: 160, groesse: .04},
    boden: {n: 18, mat: () => mt("k1-bnebel", () => KB({map: tex.fog(), color: 0xd0c4ac, transparent: true, opacity: .32, depthWrite: false, side: T3.DoubleSide}))},
    dunst: {n: 9, mat: () => mt("k1-dunst", () => KB({map: tex.fog(), color: 0xc8b898, transparent: true, opacity: .16, depthWrite: false, side: T3.DoubleSide}))}}};
})();
