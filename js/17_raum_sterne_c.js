/* ---------- 17_raum_sterne_c.js ---------- */
/* =====================================================================
   Raumthemen der Welt „Weltraum-Saga“ (Teil 3: kraft1 Gravitationslabor, kraft2 Asteroiden-Rampe)
   Bauweise wie in 17_raum_sterne.js (K.raumLib). Alles Gebaute hängt in ctx.group, Animationen über ctx.tick, keine eigenen Lichter.
   kraft1: Labor in violettem Licht – Schwerefeld-Generator mit drehenden Ringen im Deckenschacht über dem Mittelstück, darunter ein
           violettes Feld mit sinkenden Feldringen und kreisenden Testmassen, Gravitationsringe mit schwebenden Testwürfeln an den Schrägen
           (keine Planeten: die zeigt das Planetarium des Raums), sich langsam drehender Gravitationstrichter am Boden.
   kraft2: draußen auf einem Asteroiden – Regolithboden, gekrümmter Horizont mit Kratern und Felsbrocken, offener Sternenhimmel mit Planet,
           Frachtcontainer-Stapel als Seitenwände (Tafeln bündig bei x = ±8), Portalgerüst mit Laufschienen über dem Gang (trägt Schild und
           Federleuchten in 7,2 m), Stationsmodul mit Tür hinten, Schleusenmodul vorn, Startrampe mit Frachtkapsel, Frachtfähre mit Laderampe.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D;
if (!T3 || !R3D || !R3D.kits || !R3D.kits.sterne || !R3D.kits.sterne.raumLib || !R3D.kits.sterne.dlib) return;
const K = R3D.kits.sterne, L = K.lib, X = K.raumLib, D = K.dlib, U = R3D.util, PI = Math.PI, TAU = PI * 2, FONT = K.font;
const V3 = (x, y, z) => new T3.Vector3(x, y, z), Y1 = V3(0, 1, 0), PZ = X.PZ;
const {regM, std, addM, ctex, zufall, streu, niet, warnStreifen, himmel, fleck, kleber, WY} = X;
function stab(a, c, r, seg = 8){ const d = c.clone().sub(a), g = new T3.CylinderGeometry(r, r, d.length(), seg, 1, true); g.applyQuaternion(new T3.Quaternion().setFromUnitVectors(Y1, d.normalize())); return g.translate((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2); }
const glowPts = (pos, col, size, op = 1) => { const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3));
  return new T3.Points(g, new T3.PointsMaterial({map: U.glowTex(), color: col, size, transparent: true, opacity: op, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})); };

/* =====================================================================
   kraft1 · Gravitationslabor
   ===================================================================== */
const GL = {x: 0, z: -1.5, r: 3.0, yG: 8.1};   // Deckenschacht über dem Mittelstück, Mitte des Generators
const glTex = {
  boden: () => ctex(1024, 1024, (g, w, h) => {   // 4 × 4 m Laborboden: dunkle Fliesen 1 × 1 m, helle Fugen
    const r = zufall(141); g.fillStyle = "#151325"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = `hsl(252,${18 + r() * 6}%,${12 + r() * 3}%)`; g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250);
      const gr = g.createLinearGradient(i * 256, j * 256, i * 256 + 256, j * 256 + 256); gr.addColorStop(0, "rgba(255,255,255,.05)"); gr.addColorStop(1, "rgba(0,0,0,.08)"); g.fillStyle = gr; g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250); }
    g.fillStyle = "rgba(180,150,255,.35)"; for (let i = 0; i <= 4; i++) { g.fillRect(i * 256 - 1.5, 0, 3, h); g.fillRect(0, i * 256 - 1.5, w, 3); }
    streu(g, w, h, 6000, .08, ["#000", "#b8a8e8"], r); }, "gl-boden", [1, 1]),
  wand: () => ctex(512, 1024, (g, w, h) => {   // 2,25 × 5,8 m: unten weiße Laborschränke, darüber dunkelviolette Paneele mit feinem Raster, oben Lichtband
    const r = zufall(142), Y = m => WY(h, m); g.fillStyle = "#1b1830"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { L.plate(g, 6 + i * 250, Y(1.05), 244, Y(.1) - Y(1.05), "#d6d9e2", {hi: .5, lo: .3, sheen: .1}); g.fillStyle = "#8a8fa0"; g.fillRect(6 + i * 250 + 100, Y(.66), 44, 6); }
    g.fillStyle = "#0f0d1c"; g.fillRect(0, Y(1.16), w, Y(1.05) - Y(1.16)); g.fillStyle = "#b48cff"; g.fillRect(0, Y(1.12), w, 3);
    for (const [y0, y1, c] of [[1.2, 2.62, "#2a2446"], [2.7, 5.4, "#221d3c"]]) { L.plate(g, 8, Y(y1), w - 16, Y(y0) - Y(y1), c, {hi: .14, lo: .5, sheen: .05, shade: .2});
      g.strokeStyle = "rgba(180,140,255,.12)"; g.lineWidth = 1; for (let x = 32; x < w - 16; x += 32) { g.beginPath(); g.moveTo(x, Y(y1) + 6); g.lineTo(x, Y(y0) - 6); g.stroke(); }
      for (let y = Y(y1) + 32; y < Y(y0) - 6; y += 32) { g.beginPath(); g.moveTo(14, y); g.lineTo(w - 14, y); g.stroke(); } }
    g.strokeStyle = "rgba(200,170,255,.55)"; g.lineWidth = 2.5; for (let k = 1; k <= 4; k++) { g.beginPath(); g.ellipse(w / 2, Y(1.9), k * 26, k * 9, 0, 0, TAU); g.stroke(); }   // kleiner Trichter im mittleren Paneel
    g.fillStyle = "#e2d4ff"; g.beginPath(); g.arc(w / 2, Y(1.9), 7, 0, TAU); g.fill(); kleber(g, 90, Y(2.4), 46, "G-FELD", "#b48cff", "#16122a");
    g.fillStyle = "#0e0c1a"; g.fillRect(0, Y(5.78), w, Y(5.45) - Y(5.78)); g.fillStyle = "rgba(190,150,255,.95)"; g.fillRect(0, Y(5.62), w, 5);
    streu(g, w, h, 5000, .08, ["#000", "#fff"], r); }, "gl-wand", [1, 1]),
  trichter: () => ctex(1024, 1024, (g, w) => {   // Gravitationstrichter (Draufsicht): Ringe werden zur Mitte hin dichter, Speichen, heller Kern
    const c = w / 2; g.clearRect(0, 0, w, w); g.strokeStyle = "rgba(255,255,255,.9)";
    for (let k = 1; k <= 14; k++) { const q = k / 14, rr = 500 * Math.pow(q, 1.7); g.lineWidth = 1.5 + 2.5 * q; g.globalAlpha = .25 + .6 * (1 - q * .6); g.beginPath(); g.arc(c, c, rr, 0, TAU); g.stroke(); }
    for (let k = 0; k < 32; k++) { const a = k / 32 * TAU; g.lineWidth = 2; g.globalAlpha = .45; g.beginPath(); g.moveTo(c + Math.cos(a) * 30, c + Math.sin(a) * 30); g.lineTo(c + Math.cos(a) * 500, c + Math.sin(a) * 500); g.stroke(); }
    g.globalAlpha = 1; fleck(g, c, c, 160, "255,255,255", .55); }, "gl-trichter"),
  feld: () => ctex(128, 256, (g, w, h) => { g.clearRect(0, 0, w, h);   // senkrechte Feldlinien (laufen langsam nach oben)
    const r = zufall(143); for (let i = 0; i < 18; i++) { const x = r() * w, ww = 2 + r() * 8, gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(.3 + r() * .3, `rgba(255,255,255,${.25 + r() * .4})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x, 0, ww, h); }
    const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, "rgba(255,255,255,0)"); gv.addColorStop(1, "rgba(255,255,255,.25)"); g.fillStyle = gv; g.fillRect(0, 0, w, h); }, "gl-feld", [1, 1]),
};
regM("gl-boden", () => std({map: glTex.boden(), roughness: .35, metalness: .4}));
regM("gl-wand", () => std({map: glTex.wand(), roughness: .48, metalness: .3}));
regM("gl-oben", () => std({map: L.tex.bulk(), color: 0x5e5678, roughness: .5, metalness: .4}));
regM("gl-decke", () => std({map: L.tex.ceil(), color: 0x5a5274, roughness: .5, metalness: .4}));
regM("gl-rippe", () => std({color: 0x34304a, roughness: .36, metalness: .75}));
regM("gl-rohr", () => std({color: 0x9a94b4, roughness: .28, metalness: .85}));
regM("gl-schacht", () => std({color: 0x1d1830, emissive: 0x2a1458, emissiveIntensity: .7, roughness: .5, metalness: .5, side: T3.BackSide}));
regM("gl-trichter", () => addM(0xa77bff, .58, {map: glTex.trichter()}));
regM("gl-feld", () => addM(0x9f6bff, .28, {map: glTex.feld()}));
regM("gl-sink", () => addM(0xc4a0ff, .55));
regM("gl-ring", () => std({color: 0x3a3456, roughness: .3, metalness: .85, emissive: 0x3b1a7a, emissiveIntensity: .5}));
regM("gl-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0xb48cff}, L.ADD)));
function generator(ctx, b, S){   // Schwerefeld-Generator im Deckenschacht, violettes Feld darunter, kreisende Testmassen
  const G = ctx.group, {x, z, yG} = GL, H = S.H;
  // Feldsäule (offen, additiv) vom Schacht bis 4,3 m
  const fH = H - 4.3, feld = new T3.Mesh(new T3.CylinderGeometry(GL.r - .08, GL.r - .08, fH, 40, 1, true), L.matOf("gl-feld")); feld.position.set(x, 4.3 + fH / 2, z); feld.userData.noPick = true; G.add(feld);
  const ft = glTex.feld(); ft.repeat.set(6, 1);
  // Gravitationstrichter am Boden (nur Leuchtlinien, belegt nichts; dreht sich langsam)
  const tr = new T3.Mesh(new T3.PlaneGeometry(9.6, 9.6), L.matOf("gl-trichter")); tr.rotation.x = -PI / 2; tr.position.set(x, .007, z); tr.userData.noPick = true; G.add(tr);
  const NS = 4, sk = new T3.InstancedMesh(new T3.TorusGeometry(1, .012, 4, 72), L.matOf("gl-sink"), NS); sk.frustumCulled = false; sk.userData.noPick = true; G.add(sk);   // sinkende Feldringe (blenden über die Instanzfarbe weich ein und aus)
  const cS = new T3.Color(); for (let i = 0; i < NS; i++) sk.setColorAt(i, cS.setRGB(0, 0, 0));
  // Generator: Kern, drei Ringe (instanziert: Metall + Leuchtstreifen), Halterungen am Schachtrand
  const core = new T3.Mesh(new T3.SphereGeometry(.42, 24, 16), L.basic({color: 0xe8d8ff})); core.position.set(x, yG, z); G.add(core);
  const halo = glowPts([x, yG, z], 0xb48cff, 4.5, .85); G.add(halo);
  const tg = new T3.TorusGeometry(1, .05, 8, 72), tl = new T3.TorusGeometry(1, .018, 4, 72);
  const rM = new T3.InstancedMesh(tg, L.matOf("gl-ring"), 3), rL = new T3.InstancedMesh(tl, L.matOf("acc:#c9a8ff"), 3); rM.frustumCulled = rL.frustumCulled = false; rM.userData.noPick = rL.userData.noPick = true; G.add(rM, rL);
  b.put("gl-rippe", new T3.CylinderGeometry(.07, .07, H + 2.4 - yG, 8), x, (H + 2.4 + yG) / 2, z); b.put("gl-rippe", new T3.CylinderGeometry(.6, .6, .2, 24), x, H + 2.28, z); b.put("acc:#c9a8ff", new T3.TorusGeometry(.62, .025, 4, 32), x, H + 2.17, z, PI / 2);
  // Testmassen: Würfel, Kugeln, Zylinder (je ein InstancedMesh), kreisen langsam im Feld
  const mm = L.imat("gl-masse", () => new T3.MeshStandardMaterial({color: 0xffffff, roughness: .3, metalness: .8, emissive: 0x24104a, emissiveIntensity: .6}));
  const geos = [new T3.BoxGeometry(.34, .34, .34), new T3.SphereGeometry(.2, 20, 14), new T3.CylinderGeometry(.16, .16, .32, 20)], n = [3, 3, 2], cols = ["#c9ced8", "#d9b45a", "#8a90a0", "#b48cff"];
  const ims = geos.map((g, i) => { const im = new T3.InstancedMesh(g, mm, n[i]); im.frustumCulled = false; im.userData.noPick = true; G.add(im); for (let k = 0; k < n[i]; k++) im.setColorAt(k, new T3.Color(cols[(i + k) % 4])); return im; });
  const M8 = []; ims.forEach((im, i) => { for (let k = 0; k < n[i]; k++) M8.push([im, k]); });
  const o3 = new T3.Object3D(), RG = [[2.35, .5, .21], [2.05, -.38, -.29], [1.75, .22, .37]];   // Ringe: Radius, Neigung, Drehzahl – gekippt, kreisen um die Senkrechte (bleiben im Schacht und knapp darunter)
  ctx.tick((dt, t) => { o3.rotation.order = "YXZ";
    RG.forEach(([s, k, w], i) => { o3.position.set(x, yG, z); o3.rotation.set(PI / 2 + k, t * w + i * 2, 0); o3.scale.setScalar(s); o3.updateMatrix(); rM.setMatrixAt(i, o3.matrix); o3.scale.setScalar(s + .001); o3.updateMatrix(); rL.setMatrixAt(i, o3.matrix); });
    o3.rotation.order = "XYZ";
    rM.instanceMatrix.needsUpdate = rL.instanceMatrix.needsUpdate = true;
    M8.forEach(([im, k], j) => { const a = t * .11 + j / M8.length * TAU, rr = 2.0 + .25 * Math.sin(j * 2.3); o3.position.set(x + Math.cos(a) * rr, 5.1 + .45 * Math.sin(j * 1.7) + .12 * Math.sin(t * .8 + j), z + Math.sin(a) * rr);
      o3.rotation.set(t * .3 + j, t * .2 + j * 2, 0); o3.scale.setScalar(1); o3.updateMatrix(); im.setMatrixAt(k, o3.matrix); });
    ims.forEach(im => { im.instanceMatrix.needsUpdate = true; });
    ft.offset.y -= dt * .06; const f = .5 + .5 * Math.sin(t * .9); L.matOf("gl-feld").opacity = .24 + .08 * f; halo.material.opacity = .7 + .2 * f; core.scale.setScalar(1 + .05 * f);
    for (let i = 0; i < NS; i++) { const q = ((t / 7 + i / NS) % 1 + 1) % 1, rr = GL.r - .15 - 1.1 * q;   // sinken in 7 s von 7,0 auf 4,4 m und ziehen sich zusammen (Trichter)
      o3.position.set(x, 7.0 - 2.6 * q, z); o3.rotation.set(PI / 2, 0, 0); o3.scale.set(rr, rr, 1); o3.updateMatrix(); sk.setMatrixAt(i, o3.matrix); const a = Math.sin(PI * q); sk.setColorAt(i, cS.setRGB(a, a, a)); }
    sk.instanceMatrix.needsUpdate = sk.instanceColor.needsUpdate = true; L.matOf("gl-sink").opacity = .4 + .12 * f; tr.rotation.z += dt * .035;
  });
  S.bel(x - GL.r - .2, x + GL.r + .2, 4.2, H, z - GL.r - .2, z + GL.r + .2);
}
function feldRinge(ctx, b, S){   // Gravitationsringe an den Schrägen: Feldring mit violettem Schein, darin eine schwebende Testmasse (neutral – die Planeten zeigt das Planetarium des Raums)
  const B = ctx.bounds, G = ctx.group, ZR = [9, 0, -9], n = ZR.length * 2, cols = ["#c9ced8", "#d9b45a", "#8a90a0"];
  const im = new T3.InstancedMesh(new T3.BoxGeometry(.3, .3, .3), L.imat("gl-masse", () => new T3.MeshStandardMaterial({color: 0xffffff, roughness: .3, metalness: .8, emissive: 0x24104a, emissiveIntensity: .6})), n);
  const o3 = new T3.Object3D(), P = [], gl = [], R0 = .52;
  [[B.x0, 1], [B.x1, -1]].forEach(([xw, s], si) => ZR.forEach((z, k) => { const i = si * ZR.length + k, x = xw + s * 1.08, y = 6.3;
    b.put("gl-rippe", new T3.TorusGeometry(R0, .055, 6, 40), x, y, z, 0, PI / 2 + s * .5, 0); b.put("acc:#c9a8ff", new T3.TorusGeometry(R0 - .06, .02, 4, 40), x, y, z, 0, PI / 2 + s * .5, 0);
    for (const q of [-1, 1]) b.put("acc:#c9a8ff", new T3.TorusGeometry(R0 + .11, .012, 4, 40, PI * .5).rotateZ(q > 0 ? PI * .1 : PI * 1.1), x, y, z, 0, PI / 2 + s * .5, 0);   // Feldbögen
    b.put("gl-rippe", stab(V3(xw + s * .22, 6.05, z), V3(x - s * (R0 + .02), y - .05, z), .035, 6));
    im.setColorAt(i, new T3.Color(cols[i % 3])); P.push([x, y, z]); gl.push(x, y, z);
    S.bel(Math.min(x - R0 - .2, xw), Math.max(x + R0 + .2, xw), y - R0 - .2, Math.min(7.2, y + R0 + .2), z - R0 - .2, z + R0 + .2); }));
  im.userData.noPick = true; im.frustumCulled = false; G.add(im); const hl = glowPts(gl, 0xa77bff, 1.3, .55); G.add(hl);
  const upd = t => { P.forEach(([x, y, z], i) => { o3.position.set(x, y + .06 * Math.sin(t * .7 + i * 1.3), z); o3.rotation.set(.4 + t * .21 + i, t * .27 + i * 2, .2); o3.scale.setScalar(1); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); }); im.instanceMatrix.needsUpdate = true; };
  upd(0); ctx.tick((dt, t) => { upd(t); hl.material.opacity = .45 + .15 * Math.sin(t * .9); });
}
if (D.ITEMS) {
  D.ITEMS.planeten = {minW: 1.4, maxW: 1.8, d: .55, h: 2.0, build: (B, w) => {   // Vitrine mit Planetenmodellen auf Sockeln
    B.box("white", w, .9, .5, 0, .45, .27); B.box("frame", w + .04, .05, .54, 0, .925, .27); B.box("acc:#c9a8ff", w - .1, .015, .01, 0, .8, .525);
    B.box("glass", w - .06, .9, .46, 0, 1.4, .27); B.box("frame", w, .05, .5, 0, 1.87, .27);
    [["orange", .13], ["panel", .17], ["gold", .2]].forEach(([k, r], i) => { const x = -w / 3 + i * w / 3; B.cyl("frame", .05, .07, .12, 12, x, .99, .27); B.sph(k, r, x, 1.08 + r, .27, 1, 1, 1, 16, 12);
      if (i === 2) B.tor("brass", r * 1.6, .012, x, 1.08 + r, .27, PI / 2 - .4, 0, 0, 4, 28); });
    B.plane("print", .3, .05, D.PR.plaque, 0, .6, .523); }};
  D.ITEMS.schwebeprobe = {minW: .55, maxW: .55, d: .5, h: 1.75, build: B => {   // Schwebeprobe: Glasröhre auf Sockel, darin eine violett leuchtende Kugel im Feld
    B.cyl("white", .2, .24, .8, 16, 0, .4, .27); B.cyl("frame", .22, .22, .05, 16, 0, .82, .27); B.cyl("glass", .17, .17, .7, 16, 0, 1.2, .27, 0, 0, 0, true);
    B.cyl("frame", .19, .19, .05, 16, 0, 1.57, .27); B.sph("acc:#d6b8ff", .07, 0, 1.2, .27, 1, 1, 1, 12, 8); for (const y of [.95, 1.45]) B.tor("acc:#b48cff", .175, .008, 0, y, .27, PI / 2, 0, 0, 4, 24);
    B.box("acc:#c9a8ff", .2, .015, .01, 0, .6, .5); }};
  D.ITEMS.messpult = {minW: 1.2, maxW: 1.6, d: .62, h: 1.5, build: (B, w) => {   // Messpult mit Schirmen
    B.box("white", w, .82, .52, 0, .41, .3); B.add("rib", new T3.BoxGeometry(w, .05, .44).rotateX(.42), 0, .93, .32); B.box("acc:#c9a8ff", w - .1, .015, .01, 0, .78, .565);
    B.plane("screen", w * .38, .26, D.PR.energie, -w * .22, .955, .33, -PI / 2 + .42); B.plane("screen", .24, .24, D.PR.gauge, w * .25, .955, .33, -PI / 2 + .42);
    B.box("frame", w * .7, .4, .04, 0, 1.25, .06); B.plane("screen", w * .66, .36, D.PR.energie, 0, 1.25, .082); }};
}
K.raum.kraft1 = {
  licht: {bg: 0x04020a, nebel: [0x0c0718, .011], himmel: [0xece2ff, 0x1c1430, .8], umgebung: [0xd6c4ff, .19], sonne: [0xf2ecff, 1.15],
    decke: [[0xd8c4ff, 26, 0, 6.1, 5.7], [0xb98cff, 24, 0, 6.4, -1.5]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#120c22"], [.4, "#2a2046"], [.5, "#7a5ac8"], [.56, "#1e1834"], [1, "#08060e"]]);
    for (let i = 0; i < 8; i++) fleck(g, i * 64 + 30, h * .2, 14, "220,200,255", .9); g.fillStyle = "rgba(180,140,255,.8)"; g.fillRect(0, h * .62, w, 3); },
  all: {planet: [-24, -6, -66], nebel: [[275, 76, 52, [-12, 26, -78]]]},
  huelle: ctx => X.huelle(ctx, {
    boden: "gl-boden", lauf: null, leit: "gl-leit", wand: "gl-wand", oben: "gl-oben", stirn: "gl-oben", decke: "gl-decke", rippe: "gl-rippe", einlage: "acc:#9b6bff",
    leiste: "acc:#c9a8ff", akzent: "acc:#b48cff", rohr: "gl-rohr", rohre: [[-.45, .14], [.15, .08]], deckenlicht: "acc:#efe6ff",
    loch: [{x: GL.x, z: GL.z, r: GL.r, schacht: "gl-schacht", tief: 2.6, deckel: "acc:#4a2a8a"}], ledFarben: ["#c9a8ff", "#4FC3F7", "#FFE81F", "#3DDC97"],
    extra(c, b, S){ generator(c, b, S); feldRinge(c, b, S); }
  }),
  stimmung(ctx, sc, A){ for (let i = 0; i < A.farben.length; i += 3) { const w = (i / 3) % 5 === 0; A.farben[i] = w ? 1 : .72; A.farben[i + 1] = w ? .9 : .55; A.farben[i + 2] = 1; } A.geo.attributes.color.needsUpdate = true;
    const l = ctx._licht && ctx._licht.decke[1]; if (l) { const i0 = l.intensity; ctx.tick((dt, t) => { l.intensity = i0 * (.9 + .1 * Math.sin(t * .9)); }); } },
  dekor: {moebel: ["planeten", "archive", "messpult", "bench"], fueller: ["schwebeprobe", "locker1", "schwebeprobe", "sos"], bilder: [4, 0], pflanzen: false, globus: false, drohnen: 1}
};

/* =====================================================================
   kraft2 · Asteroiden-Rampe (draußen)
   ===================================================================== */
const AK_R = 260, AK_KR = [[-30, -40, 9], [26, -54, 12], [-48, 8, 10], [42, 4, 8], [-16, 46, 9], [32, 42, 11], [8, -84, 14], [-62, -52, 13], [64, -30, 12], [-28, -16, 4], [22, -22, 5]];
function akHoehe(x, z){   // Gelände: eben um den Raum (Plattform), dahinter gekrümmt (Asteroid R ≈ 150 m), Krater, Wellen
  const dx = Math.max(0, Math.abs(x) - 8), dz = Math.max(0, Math.abs(z) - 11), d = Math.hypot(dx, dz), e = Math.max(0, d - 2.5), w = Math.min(1, e / 6);
  let y = -.04 - e * e / (2 * AK_R) + w * (.35 * Math.sin(x * .31 + z * .17) * Math.sin(z * .23 - x * .11) + .18 * Math.sin(x * .9 + 1) * Math.sin(z * .7));
  for (const [cx, cz, cr] of AK_KR) { const q = Math.hypot(x - cx, z - cz) / cr; if (q < 1.6) y += w * (q < 1 ? -.24 * cr * (1 - q * q) : 0) + w * .08 * cr * Math.exp(-(((q - 1) / .22) ** 2)); }
  return y;
}
const akTex = {
  boden: () => ctex(1024, 1024, (g, w, h) => {   // 4 × 4 m Regolith: Staub, Steinchen, kleine Krater
    const r = zufall(161); g.fillStyle = "#6a635b"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) fleck(g, r() * w, r() * h, 60 + r() * 160, r() < .5 ? "40,36,32" : "150,142,130", .12 + r() * .12);
    streu(g, w, h, 40000, .35, ["#3e3a35", "#8e867b", "#55504a", "#a39a8d"], r, 2);
    for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, rr = 8 + r() * r() * 70;
      for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) { const cx = x + ox, cy = y + oy; if (cx < -rr - 10 || cx > w + rr + 10 || cy < -rr - 10 || cy > h + rr + 10) continue;
        const gr = g.createRadialGradient(cx - rr * .2, cy - rr * .2, 0, cx, cy, rr); gr.addColorStop(0, "rgba(30,27,24,.55)"); gr.addColorStop(.75, "rgba(45,41,36,.35)"); gr.addColorStop(1, "rgba(45,41,36,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
        g.strokeStyle = "rgba(190,182,168,.4)"; g.lineWidth = 2 + rr * .06; g.beginPath(); g.arc(cx, cy, rr * .95, PI * .1, PI * 1.0); g.stroke(); } }
    for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, s = 2 + r() * 6; g.fillStyle = "rgba(25,22,20,.6)"; g.beginPath(); g.ellipse(x + 1.5, y + 1.5, s, s * .7, r() * 3, 0, TAU); g.fill(); g.fillStyle = "#8a8174"; g.beginPath(); g.ellipse(x, y, s, s * .7, r() * 3, 0, TAU); g.fill(); }
  }, "ak-boden", [1, 1]),
  container: () => ctex(1024, 1024, (g, w, h) => {   // 4 Farben je 1024 × 256 (eine Containerseite ≈ 4,3 × 2,75 m, Schrift senkrecht gestaucht)
    const r = zufall(162), cols = [["#b5502a", "AST-2041"], ["#2f5f8a", "KRT-0715"], ["#c4cad0", "ERZ-3302"], ["#3f7a4a", "AST-1188"]];
    cols.forEach(([c, id], k) => { const y0 = k * 256; g.fillStyle = c; g.fillRect(0, y0, w, 256);
      for (let x = 0; x < w; x += 22) { const gr = g.createLinearGradient(x, 0, x + 22, 0); gr.addColorStop(0, "rgba(0,0,0,.28)"); gr.addColorStop(.35, "rgba(255,255,255,.14)"); gr.addColorStop(.6, "rgba(0,0,0,.05)"); gr.addColorStop(1, "rgba(0,0,0,.3)"); g.fillStyle = gr; g.fillRect(x, y0 + 14, 22, 228); }
      g.fillStyle = "rgba(20,20,22,.75)"; g.fillRect(0, y0, w, 14); g.fillRect(0, y0 + 242, w, 14); g.fillRect(0, y0, 20, 256); g.fillRect(w - 20, y0, 20, 256);
      const gd = g.createLinearGradient(0, y0 + 160, 0, y0 + 242); gd.addColorStop(0, "rgba(110,100,88,0)"); gd.addColorStop(1, "rgba(110,100,88,.55)"); g.fillStyle = gd; g.fillRect(0, y0 + 160, w, 82);
      // Kennung klein und gedämpft: große weiße Schrift neben Tafeln und Stationsschildern machte den Hintergrund unruhig („3 Anwenden -0715“)
      g.save(); g.translate(60, y0 + 42); g.scale(1, .42); g.fillStyle = k === 2 ? "rgba(29,34,40,.55)" : "rgba(238,242,245,.5)"; g.font = `800 44px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(id, 0, 0);
      g.font = `600 26px ${FONT}`; g.fillText("FRACHT · ASTEROIDENGÜRTEL", 0, 52); g.restore();
      g.save(); g.translate(w - 120, y0 + 60); g.scale(1, .42); g.fillStyle = "#E8B923"; g.beginPath(); g.moveTo(0, -46); g.lineTo(46, 0); g.lineTo(0, 46); g.lineTo(-46, 0); g.closePath(); g.fill(); g.fillStyle = "#17181b"; g.font = `800 40px ${FONT}`; g.textAlign = "center"; g.fillText("!", 0, 4); g.restore();
      streu(g, w, 256, 3000, .14, ["#000", "#fff", "#6a5a48"], r); });
  }, "ak-container"),
  modul: () => ctex(512, 256, (g, w, h) => {   // Inneres der Module (durch die Fenster): warmes Licht, Regale
    himmel(g, w, h, [[0, "#fff2d8"], [.25, "#c8b89a"], [1, "#4a4036"]]); for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(60,50,40,.6)"; g.fillRect(20 + i * 82, 110, 60, 120); g.fillStyle = "rgba(255,240,210,.5)"; g.fillRect(24 + i * 82, 120, 52, 8); } }, "ak-modul"),
  schild: () => ctex(1024, 256, (g, w, h) => { g.fillStyle = "#e9edf1"; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 20); g.fill(); warnStreifen(g, 4, h - 44, w - 8, 36, "#E8B923", "#17181b", 40);
    g.fillStyle = "#1d2228"; g.font = `800 96px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("FÖRDERSTATION K-2", w / 2, h * .38); g.fillStyle = "#b5502a"; g.font = `700 36px ${FONT}`; g.fillText("ASTEROID 1187 · RAMPE 1", w / 2, h * .66); }, "ak-schild")
};
regM("ak-boden", () => std({map: akTex.boden(), roughness: .96, metalness: .02}));
regM("ak-gelaende", () => std({map: akTex.boden(), color: 0xd8d0c4, roughness: .97, metalness: .02}));
regM("ak-container", () => std({map: akTex.container(), roughness: .62, metalness: .35}));
regM("ak-gelb", () => std({color: 0xd9a21e, roughness: .5, metalness: .4}));
regM("ak-modulwand", () => std({map: L.tex.bulk(), color: 0xe6eaee, roughness: .42, metalness: .2}));
regM("ak-innen", () => L.basic({map: akTex.modul(), side: T3.BackSide}));
regM("ak-schild", () => std({map: akTex.schild(), roughness: .5, emissive: 0xffffff, emissiveMap: akTex.schild(), emissiveIntensity: .2}));
regM("ak-schiff", () => std({color: 0xd8dde2, roughness: .45, metalness: .3}));
regM("ak-scheibe", () => std({color: 0x0a1626, roughness: .06, metalness: .9, emissive: 0x123452, emissiveIntensity: .7}));
regM("ak-orange", () => std({color: 0xd96a2a, roughness: .5, metalness: .2}));
regM("ak-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0x7fe0ff}, L.ADD)));
const AK_ROW = k => [0, k * 256, 1024, 256];
function container(b, x, y, z, Lz, k){ b.put("ak-container", D.uvR(new T3.BoxGeometry(2.42, 2.72, Lz), AK_ROW(k), 1024, 1), x, y + 1.36, z); }
function gelaende(ctx, b){   // Asteroidenoberfläche rund um den Raum (Polarnetz, unter dem Raumboden verborgen) + Felsbrocken
  const NA = 72, NR = 30, pos = [], uv = [], idx = [];
  for (let i = 0; i <= NR; i++) { const rr = 7 + (100 - 7) * Math.pow(i / NR, 1.55);
    for (let j = 0; j <= NA; j++) { const a = j / NA * TAU, x = Math.cos(a) * rr, z = Math.sin(a) * rr; pos.push(x, akHoehe(x, z), z); uv.push(x / 4, z / 4); } }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, c = a + NA + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T3.Mesh(g, L.matOf("ak-gelaende")); m.receiveShadow = true; m.userData.noPick = true; ctx.group.add(m);
  // Felsbrocken (instanziert) außerhalb des Raums
  const R = zufall(163), n = 46, rk = new T3.InstancedMesh(D.rockGeo(1, R), D.MAT("rock"), n), o3 = new T3.Object3D(); let k = 0;
  for (let tries = 0; tries < 400 && k < n; tries++) { const a = R() * TAU, rr = 15 + R() * R() * 60, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (Math.abs(x) < 11.5 && Math.abs(z) < 14.5) continue; if (x > 2 && x < 12 && z < -12 && z > -70) continue;   // nicht auf der Startrampe
    const s = .35 + R() * R() * 2.2; o3.position.set(x, akHoehe(x, z) + s * .25, z); o3.rotation.set(R() * 3, R() * 6, R() * 3); o3.scale.set(s * (.8 + R() * .5), s * (.6 + R() * .4), s * (.8 + R() * .5)); o3.updateMatrix(); rk.setMatrixAt(k++, o3.matrix); }
  rk.count = k; rk.castShadow = false; rk.receiveShadow = true; rk.userData.noPick = true; ctx.group.add(rk);
}
function startrampe(ctx, b){   // Startrampe (Massebeschleuniger) schräg in den Himmel, Frachtkapsel fährt regelmäßig gleichmäßig beschleunigt hinauf
  const G = ctx.group, a = .3, Lr = 64, s0 = V3(5.4, .25, -15.5), d = V3(.2, 0, -1).normalize(), f = V3(d.x * Math.cos(a), Math.sin(a), d.z * Math.cos(a));
  const ez = f.clone().negate(), ex = V3(-d.z, 0, d.x).normalize(), ey = new T3.Vector3().crossVectors(ez, ex), M = new T3.Matrix4().makeBasis(ex, ey, ez).setPosition(s0);
  const P = (k, g) => b.putM(k, g, M);
  for (const s of [-1, 1]) { P("steel", new T3.BoxGeometry(.22, .3, Lr).translate(s * .85, .15, -Lr / 2)); P("acc:#7fe0ff", new T3.BoxGeometry(.04, .04, Lr - .4).translate(s * .97, .22, -Lr / 2)); }
  P("trim", new T3.BoxGeometry(2.4, .18, Lr).translate(0, -.12, -Lr / 2));
  for (let z = -1; z > -Lr; z -= 2) P("ak-gelb", new T3.BoxGeometry(2.3, .1, .12).translate(0, .02, z));
  P("guide", U.scaleUV(new T3.PlaneGeometry(.3, Lr - 1), 1, (Lr - 1) / 1.6).rotateX(-PI / 2).translate(0, .04, -Lr / 2));
  P("ak-gelb", new T3.BoxGeometry(3.0, .5, 1.6).translate(0, -.15, .2));
  for (let s = 6; s < Lr; s += 7) { const p = s0.clone().addScaledVector(f, s), yb = akHoehe(p.x, p.z), hh = p.y - .3 - yb; if (hh < .3) continue;
    // Stützen hell mit Leuchtband zum Eingang hin: vom Eingang aus blickt man die Rampe fast längs entlang – die Mittelstützen stehen hinter dem
    // näheren Rampenstück, nur weit gespreizte Bockbeine ragen seitlich heraus (sonst schien die Rampe frei zu schweben)
    for (const q of [-1, 1]) { const fx = p.x + ex.x * q * 3.2, fz = p.z + ex.z * q * 3.2, a = V3(fx, akHoehe(fx, fz) - .1, fz), c = V3(p.x + ex.x * q * .75, p.y - .25, p.z + ex.z * q * .75), rb = .1 + hh * .006;
      b.put("ak-schiff", stab(a, c, rb, 6)); b.put("acc:#ffb020", stab(a.clone().lerp(c, .06).add(V3(0, 0, rb + .01)), a.clone().lerp(c, .9).add(V3(0, 0, rb + .01)), .028, 4)); }
    b.put("ak-schiff", stab(V3(p.x, yb, p.z), V3(p.x, p.y - .25, p.z), .16 + hh * .01, 8)); }
  // Frachtkapsel (eigene Gruppe im Rampenrahmen)
  const rg = new T3.Group(); rg.applyMatrix4(M); G.add(rg); const kap = new T3.Group(); rg.add(kap); const kb = L.Bld();
  kb.put("ak-schiff", new T3.CapsuleGeometry(.55, 1.6, 6, 16).rotateX(PI / 2), 0, .75, 0); kb.put("ak-orange", new T3.CylinderGeometry(.57, .57, .4, 16).rotateX(PI / 2), 0, .75, -.3);
  kb.put("acc:#9fe8ff", new T3.CircleGeometry(.3, 16), 0, .75, 1.38); for (const s of [-1, 1]) kb.box("trim", .2, .2, 1.6, s * .55, .3, 0); kb.build(kap);
  const glw = glowPts([0, .75, 1.6], 0x8fe0ff, 2.4, .9); kap.add(glw);
  const T = 3.6, acc = 2 * (Lr - 2) / (T * T);   // gleichmäßig beschleunigt: s = a/2 · t²
  ctx.tick((dt, t) => { const tau = t % 15; let s = 0, y = 0;
    if (tau < 1.2) { y = -1.2 + tau; kap.visible = true; } else if (tau < 9) { kap.visible = true; } else if (tau < 9 + T) { s = .5 * acc * (tau - 9) ** 2; kap.visible = true; } else kap.visible = false;
    kap.position.set(0, Math.min(0, y), -s); glw.material.opacity = tau > 9 && tau < 9 + T ? 1 : .35 + .15 * Math.sin(t * 2); });
}
function faehre(ctx, b){   // gelandete Frachtfähre (Seitenprofil mit Schrägbug und Kanzel, Seitengondeln), Heck mit abgesenkter Laderampe – vorn links hinter der Absperrung
  const x0 = -9.6, z0 = -21.5, ry = .55, M = new T3.Matrix4().makeRotationY(ry).setPosition(x0, akHoehe(x0, z0) + 1.75, z0), P = (k, g) => b.putM(k, g, M);
  const sp = new T3.Shape(); [[-5.2, -.5], [-4.5, .55], [-3.0, 1.3], [3.3, 1.3], [3.9, .9], [3.9, -1.1], [-4.4, -1.1]].forEach(([zz, yy], i) => i ? sp.lineTo(zz, yy) : sp.moveTo(zz, yy)); sp.closePath();
  P("ak-schiff", new T3.ExtrudeGeometry(sp, {depth: 3.0, bevelEnabled: true, bevelSize: .22, bevelThickness: .22, bevelSegments: 2}).rotateY(-PI / 2).translate(1.5, 0, 0));
  P("ak-scheibe", new T3.PlaneGeometry(2.6, .7).rotateX(-2.5).translate(0, 1.02, -3.9)); P("ak-orange", new T3.BoxGeometry(3.5, .26, 7.4).translate(0, -.45, -.4));
  for (const s of [-1, 1]) { P("ak-schiff", new T3.CylinderGeometry(.55, .6, 3.2, 16).rotateX(PI / 2).translate(s * 2.35, -.2, 2.3)); P("trim", new T3.BoxGeometry(.9, .14, 2.2).translate(s * 1.9, -.2, 2.2));
    P("trim", new T3.CylinderGeometry(.48, .58, .5, 16, 1, true).rotateX(PI / 2).translate(s * 2.35, -.2, 4.1)); P("acc:#8fd8ff", new T3.CircleGeometry(.45, 16).translate(s * 2.35, -.2, 4.2));
    for (const zz of [-2.8, 2.4]) { P("steel", new T3.CylinderGeometry(.08, .08, 1.0, 8).translate(s * 1.3, -1.5, zz)); P("trim", new T3.CylinderGeometry(.35, .35, .1, 12).translate(s * 1.3, -1.95, zz)); } }
  P("trim", new T3.BoxGeometry(2.6, 2.0, .1).translate(0, .05, 4.12));   // dunkle Ladeluke
  P("steel", new T3.BoxGeometry(2.4, .08, 3.1).rotateX(.3).translate(0, -1.55, 5.55)); for (const sx of [-1, 1]) P("haz", U.scaleUV(new T3.BoxGeometry(.12, .1, 3.1), 1, 6).rotateX(.3).translate(sx * 1.18, -1.5, 5.55));   // Laderampe
}
function asteroid(ctx, b, S){
  const B = ctx.bounds, G = ctx.group, H = S.H;
  gelaende(ctx, b);
  // Containerstapel als Seitenwände: Innenseite bündig bei x = ±8 (Tafelfelder), Pfosten des Portalgerüsts bei z ∈ PZ dazwischen
  const segs = [[-11, -9.1], [-8.9, -4.6], [-4.4, -.1], [.1, 4.4], [4.6, 8.9], [9.1, 11]], R = zufall(164);
  for (const s of [-1, 1]) segs.forEach(([z0, z1], i) => { const zc = (z0 + z1) / 2, Lz = z1 - z0, x = s * (8 + 1.21);
    container(b, x, 0, zc, Lz, (i + (s > 0 ? 1 : 0)) % 4); container(b, x, 2.72, zc, Lz, (i + (s > 0 ? 3 : 2)) % 4);
    if (i === 0 || i === 5 || (i + (s > 0 ? 1 : 0)) % 3 === 0) container(b, x + s * .3, 5.44, zc + (R() - .5) * .4, Lz - .3, (i + 2) % 4);
    container(b, s * (8 + 3.9), 0, zc + .6, Lz, (i + 1) % 4); if ((i + (s > 0 ? 0 : 1)) % 2) container(b, s * (8 + 3.9), 2.72, zc + .6, Lz, (i + 3) % 4); });
  // Portalgerüst: Pfosten an den Containerfugen, Querträger, zwei Laufschienen über dem Gang, Querstreben für die Federleuchten, Scheinwerfer
  for (const z of PZ) { for (const s of [-1, 1]) { b.box("ak-gelb", .36, 7.9, .36, s * 8.1, 3.95, z); b.box("trim", .5, .3, .5, s * 8.1, .15, z); S.bel(s * 7.85, s * 8, 0, H, z - .3, z + .3); }
    b.box("ak-gelb", 16.6, .42, .42, 0, 7.72, z); b.put("haz", U.scaleUV(new T3.PlaneGeometry(16.4, .3), 33, 1), 0, 7.72, z + .215); }
  for (const s of [-1, 1]) { b.box("steel", .24, .3, 22.2, s * 1.3, 7.35, 0); b.box("trim", .3, .06, 22.2, s * 1.3, 7.2 + .03, 0); }
  for (const z of [5.2, -7.2]) b.box("steel", 2.84, .26, .2, 0, 7.07, z);   // Querstreben: tragen die Federleuchten (Kappe bis 6,94 m)
  S.bel(-1.5, 1.5, 6.95, H, -11, 11); S.bel(-8, 8, 7.1, H, -11, 11);
  for (const z of [4.5, -4.5]) for (const s of [-1, 1]) { b.box("trim", .6, .3, .44, s * 3.2, 7.36, z); b.box("acc:#fff4dc", .5, .02, .36, s * 3.2, 7.2, z); }
  // Hinten: Stationsmodul mit Tür, Fenstern, gewölbtem Dach, Antenne, Schild
  const mB = new T3.Matrix4().makeBasis(V3(-1, 0, 0), Y1, V3(0, 0, -1)).setPosition(0, 0, B.z0), wins = [{x0: -6.6, x1: -3.4, y0: 2.0, y1: 3.4, c: .4}, {x0: 3.4, x1: 6.6, y0: 2.0, y1: 3.4, c: .4}];
  b.putM("ak-modulwand", L.wallGeo(16, 5.8, [[-1.25, 1.25, 3.4]], wins, .25, .25), mB);
  for (const w of wins) { b.putM("ak-innen", new T3.BoxGeometry(w.x1 - w.x0, w.y1 - w.y0, 1.6).translate((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, -.82), mB); b.putM("glass", new T3.PlaneGeometry(w.x1 - w.x0, w.y1 - w.y0).translate((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, -.06), mB);
    for (const yy of [w.y0 - .08, w.y1 + .08]) b.putM("trim", new T3.BoxGeometry(w.x1 - w.x0 + .3, .14, .2).translate((w.x0 + w.x1) / 2, yy, .06), mB); }
  b.put("ak-modulwand", new T3.CylinderGeometry(3.0, 3.0, 16.2, 28, 1, false, 0, PI).rotateZ(PI / 2), 0, 5.8, B.z0 + 3.0);   // gewölbtes Moduldach
  for (const [x0, x1] of L.cut([-8, 8], [[-1.55, 1.55]])) b.putM("haz", U.scaleUV(new T3.BoxGeometry(x1 - x0, .3, .06), (x1 - x0) / .5, 1).translate((x0 + x1) / 2, .15, .03), mB);
  b.putM("ak-schild", new T3.PlaneGeometry(3.6, .9).translate(-4.9, 4.45, .03), mB); b.putM("acc:#7fe0ff", new T3.BoxGeometry(16, .05, .04).translate(0, 5.75, .03), mB);
  b.put("trim", new T3.CylinderGeometry(.06, .08, 3.2, 8), 5.2, 10.0, B.z0 + 2.4); b.put("ak-schiff", new T3.SphereGeometry(1.1, 18, 8, 0, TAU, 0, PI / 2.6).rotateX(-.9), 5.2, 11.4, B.z0 + 2.3);
  // Vorn: Schleusenmodul um die Tür, Absperrung daneben (Blick auf Rampe, Fähre und Horizont)
  const zB = B.z1, xs = 2.6, hS = 5.0, mF = new T3.Matrix4().makeBasis(V3(1, 0, 0), Y1, V3(0, 0, 1)).setPosition(0, 0, zB);
  b.putM("ak-modulwand", L.wallGeo(2 * xs, hS, [[-1.25, 1.25, 3.4]], [], .25, .25), mF);
  for (const s of [-1, 1]) b.box("ak-modulwand", .24, hS, 3.2, s * (xs - .12), hS / 2, zB - 1.6);   // Schleuse: Seiten, Rückwand, Tonnendach (kein Vollkörper – der Leuchtgang der Tür liegt darin)
  b.box("ak-modulwand", 2 * xs, hS, .24, 0, hS / 2, zB - 3.08); b.put("ak-modulwand", new T3.CylinderGeometry(xs, xs, 3.2, 24, 1, false, 0, PI).rotateZ(PI / 2).rotateY(PI / 2), 0, hS, zB - 1.6);
  for (const s of [-1, 1]) b.put("haz", U.scaleUV(new T3.PlaneGeometry(.3, hS), 1, hS / .4), s * (xs - .17), hS / 2, zB + .01);
  b.put("acc:#ffb020", new T3.SphereGeometry(.16, 12, 8), 0, hS + xs + .1, zB - 1.6);
  for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { const x = s * (xs + .95 + k * 1.82); b.put("ak-schiff", new T3.BoxGeometry(1.75, .82, .5).translate(0, .41, 0), x, 0, zB + .2); b.put("haz", U.scaleUV(new T3.PlaneGeometry(1.75, .26), 3.5, 1), x, .62, zB + .451); }
    ctx.obstacleBox(s * 5.3, zB + .3, 5.4, .6); S.bel(s * xs, s * 8, 0, 1.0, zB, zB + .5); }
  startrampe(ctx, b); faehre(ctx, b);
}
if (D.ITEMS) {
  D.ITEMS.kistenstapel = {minW: 1.3, maxW: 1.8, d: .95, h: 1.9, build: (B, w, R, I) => {   // Kisten auf einer Palette
    B.box("frame", w, .12, .9, 0, .06, .47); const n = w > 1.55 ? 2 : 1, cw = (w - .1) / n;
    for (let i = 0; i < n; i++) { const x = -w / 2 + .05 + cw * (i + .5); D.crate(B, I, x, .12 + .4, .47, cw - .06, .8, .8, (R() - .5) * .1, (R() * D.CRATE_COLS.length) | 0); }
    D.crate(B, I, (R() - .5) * .2, .92 + .3, .45, Math.min(.8, w - .3), .6, .62, (R() - .5) * .3, (R() * D.CRATE_COLS.length) | 0); }};
  D.ITEMS.faesser = {minW: .95, maxW: 1.25, d: .7, h: 1.0, build: (B, w) => {   // Stahlfässer mit Warnschild
    const n = w > 1.1 ? 3 : 2; for (let i = 0; i < n; i++) { const x = -w / 2 + .32 + i * (w - .64) / (n - 1), k = ["steel", "orange", "panel"][i % 3];
      B.cyl(k, .28, .28, .86, 16, x, .43, .36); for (const y of [.2, .62]) B.tor("frame", .285, .014, x, y, .36, PI / 2, 0, 0); B.cyl("frame", .26, .26, .02, 14, x, .87, .36); }
    B.plane("print", .2, .2, D.PR.warn, -w / 2 + .32, .45, .645); }};
  D.ITEMS.felsen = {minW: .8, maxW: 1.2, d: .8, h: .8, build: (B, w, R) => {   // Gesteinsbrocken (Erzproben)
    B.add("rock", D.rockGeo(.36, R), -w / 4, .28, .42, R(), R() * 3, R()); B.add("rock", D.rockGeo(.24, R), w / 4, .2, .38, R(), R() * 3, R()); B.add("rock", D.rockGeo(.14, R), 0, .11, .62, R(), R(), R()); }};
}
K.raum.kraft2 = {
  licht: {bg: 0x010204, nebel: [0x04060a, .0075], himmel: [0xa8b8d8, 0x3a332c, .55], umgebung: [0xb8c4e0, .12], sonne: [0xfff2e0, 2.3, [26, 13, -22]],
    decke: [[0xfff0dc, 34, 0, 6.85, 4.5], [0xfff0dc, 34, 0, 6.85, -4.5]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#000000"], [.46, "#05070c"], [.5, "#3a352f"], [.6, "#5a534a"], [1, "#2a2622"]]); const r = zufall(165);
    for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,255,255,${.3 + r() * .7})`; g.fillRect(r() * w, r() * h * .45, 1.4, 1.4); } fleck(g, w * .8, h * .3, 22, "255,244,224", 1); },
  all: {planet: [-34, 40, -46], sonne: [46, 14, -44], mond: [30, 22, 40], nebel: [[300, 80, 52, [16, 34, -70]]]},
  huelle: ctx => X.huelle(ctx, {
    boden: "ak-boden", bodenM: 6, leit: "ak-leit", wand: null, oben: null, stirn: null, decke: null, rippe: null, schraege: false, leiste: null, akzent: null, rohr: null,
    fenster: {front: [], back: []}, eckrohre: false, konsole: false, extra: asteroid
  }),
  stimmung(ctx, sc, A){ A.pts.visible = false; },   // draußen kein Schwebestaub; der vorbeifliegende Frachter bleibt
  dekor: {moebel: ["kistenstapel", "tanks", "faesser", "kistenstapel"], fueller: ["felsen", "faesser", "felsen"], bilder: false, plakate: false, pflanzen: false, globus: false, drohnen: 1}
};
})();
