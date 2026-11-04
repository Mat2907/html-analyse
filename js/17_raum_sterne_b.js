/* ---------- 17_raum_sterne_b.js ---------- */
/* =====================================================================
   Raumthemen der Welt „Weltraum-Saga“ (Teil 2: beweg1 Hangar der Raumjäger, beweg2 Antriebsdeck)
   Bauweise wie in 17_raum_sterne.js (K.raumLib: huelle, regM, ctex …). Alles Gebaute hängt in ctx.group (die Ersatzhülle räumt es bei einem
   Fehler wieder ab), Animationen über ctx.tick, keine eigenen Lichter (nur die festen Lichter aus env/ambient über R.licht und A.sweep).
   beweg1: höhere Halle (Dach 11 m, ctx.height bleibt 7,2), vorn statt der Wand eine Brüstung mit Blick in die Startbucht (Raumjäger,
           Kraftfeld-Tor zum All), Schleusenturm mit Flugleitkanzel um die Vordertür, Kranbrücke, Fachwerkbinder, Warnleuchten,
           Wartungssteg über dem Gang (Unterkante 7,2 m: dort hängen Räume und Lehrkraft Teile auf).
   beweg2: Maschinenraum mit Gitterboden (blaues Glühen darunter), Plasmaleitungen, Heckfenster mit Blick auf zwei große Triebwerke
           (glühende Düsen, Abgasstrahlen), Schubanzeigen über den Heckfenstern, leicht vibrierendes Licht.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D;
if (!T3 || !R3D || !R3D.kits || !R3D.kits.sterne || !R3D.kits.sterne.raumLib || !R3D.kits.sterne.dlib) return;
const K = R3D.kits.sterne, L = K.lib, X = K.raumLib, D = K.dlib, U = R3D.util, PI = Math.PI, TAU = PI * 2, FONT = K.font;
const V3 = (x, y, z) => new T3.Vector3(x, y, z), Y1 = V3(0, 1, 0), PZ = X.PZ;
const {regM, std, addM, ctex, zufall, streu, niet, warnStreifen, himmel, fleck, kleber} = X;

/* ---------- Hilfen ---------- */
function stab(a, c, r, seg = 8){ const d = c.clone().sub(a), g = new T3.CylinderGeometry(r, r, d.length(), seg, 1, true); g.applyQuaternion(new T3.Quaternion().setFromUnitVectors(Y1, d.normalize())); return g.translate((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2); }
const wandM = (xw, s, zc) => new T3.Matrix4().makeBasis(V3(0, 0, -s), Y1, V3(s, 0, 0)).setPosition(xw, 0, zc);   // Seitenwand: a entlang der Wand, z in den Raum
const glowPts = (pos, col, size, op = 1) => { const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3));
  return new T3.Points(g, new T3.PointsMaterial({map: U.glowTex(), color: col, size, transparent: true, opacity: op, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})); };
// Warnleuchten: Sockel + Kuppel (gebündelt), drehende Lichtfächer (instanziert) und Schein (Punkte, Farbe je Leuchte). 0,45 Umdrehungen/s,
// zwei Fächer → jeder Betrachter sieht knapp 1 Aufleuchten pro Sekunde, sanft (kein Blitzen, kein Flackern über 3 Hz)
function warnleuchten(ctx, b, list){
  for (const [x, y, z] of list) { b.put("trim", new T3.CylinderGeometry(.13, .15, .1, 12), x, y + .05, z); b.put("hg-kuppel", new T3.SphereGeometry(.11, 12, 6, 0, TAU, 0, PI / 2), x, y + .1, z); }
  const fg = L.merge([new T3.ConeGeometry(.32, 1.6, 10, 1, true).rotateZ(PI / 2).translate(.8, 0, 0), new T3.ConeGeometry(.32, 1.6, 10, 1, true).rotateZ(-PI / 2).translate(-.8, 0, 0)]);
  const im = new T3.InstancedMesh(fg, L.imat("hg-faecher", () => addM(0xffb030, .1)), list.length); im.frustumCulled = false; im.userData.noPick = true; ctx.group.add(im);
  const pos = [], col = new Float32Array(list.length * 3); for (const [x, y, z] of list) pos.push(x, y + .17, z);
  const pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); pg.setAttribute("color", new T3.BufferAttribute(col, 3));
  const pm = new T3.Points(pg, L.imat("hg-schein", () => new T3.PointsMaterial({map: U.glowTex(), vertexColors: true, size: 1.1, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}))); ctx.group.add(pm);
  const o3 = new T3.Object3D(), W = TAU * .45;
  return t => { list.forEach(([x, y, z], i) => { const a = t * W + i * 1.3; o3.position.set(x, y + .17, z); o3.rotation.set(0, a, 0); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix);
      const f = .35 + .65 * Math.pow(.5 + .5 * Math.cos(2 * a), 6); col[i * 3] = f; col[i * 3 + 1] = .62 * f; col[i * 3 + 2] = .12 * f; });
    im.instanceMatrix.needsUpdate = true; pg.attributes.color.needsUpdate = true; };
}

/* =====================================================================
   beweg1 · Hangar der Raumjäger
   ===================================================================== */
const HG = {dach: 11, tor: -21, zS: -13.8, binder: [...PZ, -13.5, -18]};
const hgTex = {
  boden: () => ctex(1024, 1024, (g, w, h) => {   // 4 × 4 m Hallenboden: Platten 2 × 2 m, Fugen, Ölflecken, Reifenspuren, Verzurrpunkte
    const r = zufall(101); g.fillStyle = "#3b4046"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = `hsl(210,6%,${28 + r() * 5}%)`; g.fillRect(i * 512 + 4, j * 512 + 4, 504, 504); }
    streu(g, w, h, 26000, .22, ["#000", "#9aa3ac", "#2a2f35", "#5c636b"], r, 2);
    for (let i = 0; i < 7; i++) fleck(g, r() * w, r() * h, 30 + r() * 90, "8,10,14", .2 + r() * .25);
    g.lineCap = "round"; for (let k = 0; k < 5; k++) { const y = r() * h, a = (r() - .5) * .6; g.strokeStyle = `rgba(10,12,16,${.08 + r() * .1})`; g.lineWidth = 14 + r() * 10;
      g.beginPath(); g.moveTo(-20, y); g.bezierCurveTo(w * .3, y + a * 300, w * .6, y - a * 200, w + 20, y + a * 120); g.stroke(); }
    g.fillStyle = "#1c1f23"; for (const p of [-3, 509, 1021]) { g.fillRect(p, 0, 6, h); g.fillRect(0, p, w, 6); }
    g.fillStyle = "rgba(255,255,255,.08)"; for (const p of [3, 515]) { g.fillRect(p, 0, 2, h); g.fillRect(0, p, w, 2); }
    for (const [a, c] of [[256, 256], [768, 256], [256, 768], [768, 768]]) { g.fillStyle = "#24282d"; g.beginPath(); g.arc(a, c, 16, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 2; g.stroke(); }
  }, "hg-boden", [1, 1]),
  wand: () => ctex(512, 1024, (g, w, h) => {   // 2,25 × 7,2 m: Trapezblech, Sockel mit Warnband, Leitungskanal oben
    const r = zufall(102), Y = m => (7.2 - m) / 7.2 * h; g.fillStyle = "#30363d"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, "#4a525b"); gr.addColorStop(.3, "#6d7782"); gr.addColorStop(.55, "#606973"); gr.addColorStop(1, "#434a52");
      g.fillStyle = gr; g.fillRect(x, Y(6.5), 32, Y(1.15) - Y(6.5)); }
    g.fillStyle = "#2a2f35"; g.fillRect(0, Y(1.0), w, h - Y(1.0)); warnStreifen(g, 0, Y(1.15), w, Y(.98) - Y(1.15), "#E8B923", "#16181b", 30);
    for (let x = 24; x < w; x += 64) { g.fillStyle = "#1a1e22"; g.fillRect(x, Y(.72), 34, Y(.3) - Y(.72)); g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(x, Y(.3), 34, 2); }
    g.fillStyle = "#1e2227"; g.fillRect(0, Y(6.62), w, 10); g.fillStyle = "#3a4048"; g.fillRect(0, Y(7.0), w, Y(6.68) - Y(7.0));
    for (const m of [2.6, 5.0]) { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, Y(m), w, 4); g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(0, Y(m) + 4, w, 2); for (let x = 12; x < w; x += 40) niet(g, x, Y(m) - 6, 2.6); }
    streu(g, w, h, 8000, .1, ["#000", "#fff", "#7a5a30"], r);
  }, "hg-wand", [1, 1]),
  mark: () => ctex(1024, 1024, (g, w, h) => {   // Bodenmarkierungen: Landekreis | Leitpfeile | Schriftzug | Warnband | Haltelinie
    g.clearRect(0, 0, w, h); const Ye = "#F2C230", c = 256; g.textAlign = "center"; g.textBaseline = "middle";
    g.strokeStyle = Ye; g.lineWidth = 16; g.beginPath(); g.arc(c, c, 236, 0, TAU); g.stroke();
    g.setLineDash([26, 18]); g.lineWidth = 6; g.strokeStyle = "rgba(240,244,248,.9)"; g.beginPath(); g.arc(c, c, 196, 0, TAU); g.stroke(); g.setLineDash([]);
    g.lineWidth = 8; g.strokeStyle = Ye; for (let k = 0; k < 4; k++) { const a = k * PI / 2; g.beginPath(); g.moveTo(c + Math.cos(a) * 92, c + Math.sin(a) * 92); g.lineTo(c + Math.cos(a) * 180, c + Math.sin(a) * 180); g.stroke(); }
    g.fillStyle = Ye; g.font = `800 112px ${FONT}`; g.fillText("03", c, c + 6);
    g.lineWidth = 40; g.lineJoin = "miter"; for (let k = 0; k < 3; k++) { const y = 110 + k * 130; g.beginPath(); g.moveTo(512 + 120, y + 92); g.lineTo(768, y); g.lineTo(1024 - 120, y + 92); g.stroke(); }
    g.font = `800 158px ${FONT}`; g.fillText("HANGAR 3", 512, 646);
    warnStreifen(g, 0, 774, w, 116, Ye, "#141518", 80);
    g.fillStyle = "rgba(240,244,248,.92)"; g.fillRect(0, 900, w, 34); g.font = `800 66px ${FONT}`; g.fillText("HALTELINIE", 512, 982);
  }, "hg-mark"),
  feld: () => ctex(443, 480, (g, w, h) => {   // Kraftfeld: Sechseckgitter (nahtlos: 8 × 5 Zellen), weich leuchtende Kanten
    g.clearRect(0, 0, w, h); const r = 32, dx = Math.sqrt(3) * r;
    const hex = (x, y) => { g.beginPath(); for (let k = 0; k < 6; k++) { const a = PI / 6 + k * PI / 3, px = x + Math.cos(a) * r * .94, py = y + Math.sin(a) * r * .94; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); };
    for (const [lw, a] of [[7, .18], [2.2, .85]]) { g.lineWidth = lw; g.strokeStyle = `rgba(255,255,255,${a})`;
      for (let row = -1; row < 11; row++) for (let col = -1; col < 10; col++) { hex(col * dx + (row % 2 ? dx / 2 : 0), row * 1.5 * r); g.stroke(); } }
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.05)"); gr.addColorStop(.5, "rgba(255,255,255,.14)"); gr.addColorStop(1, "rgba(255,255,255,.05)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, "hg-feld", [1, 1]),
  welle: () => ctex(64, 256, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h);   // langsam aufsteigende Welle im Kraftfeld + Randschein
    gr.addColorStop(0, "rgba(255,255,255,.08)"); gr.addColorStop(.42, "rgba(255,255,255,.1)"); gr.addColorStop(.5, "rgba(255,255,255,.55)"); gr.addColorStop(.58, "rgba(255,255,255,.1)"); gr.addColorStop(1, "rgba(255,255,255,.08)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, "hg-welle", [1, 1]),
  raum: () => ctex(512, 256, (g, w, h) => {   // Inneres der Flugleitkanzel (von außen durch die Scheiben): Pulte mit Schirmen, Deckenlicht
    himmel(g, w, h, [[0, "#1b2a3a"], [.5, "#0d1824"], [1, "#081018"]]); g.fillStyle = "#d8f0ff"; g.fillRect(0, 6, w, 8);
    for (let i = 0; i < 8; i++) { const x = 14 + i * 62; g.fillStyle = "#04121f"; g.fillRect(x, 120, 48, 34); g.fillStyle = i % 3 ? "rgba(79,195,247,.85)" : "rgba(255,232,31,.8)"; g.fillRect(x + 4, 124, 40, 26);
      g.fillStyle = "rgba(4,18,31,.7)"; for (let k = 0; k < 4; k++) g.fillRect(x + 8, 128 + k * 6, 10 + (k * 7 + i * 5) % 26, 2); }
    g.fillStyle = "#1a2430"; g.fillRect(0, 158, w, 34); g.fillStyle = "#4FC3F7"; g.fillRect(0, 158, w, 3);
  }, "hg-raum"),
  schild: () => ctex(1024, 256, (g, w, h) => { g.fillStyle = "#1d2127"; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 18); g.fill();
    warnStreifen(g, 14, 14, 70, h - 28, "#E8B923", "#141414", 30); warnStreifen(g, w - 84, 14, 70, h - 28, "#E8B923", "#141414", 30);
    g.fillStyle = "#F2C230"; g.font = `800 132px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("HANGAR 3", w / 2, h * .44);
    g.fillStyle = "#dfe8f0"; g.font = `600 40px ${FONT}`; g.fillText("STARTBUCHT · RAUMJÄGER", w / 2, h * .8); }, "hg-schild")
};
regM("hg-boden", () => std({map: hgTex.boden(), roughness: .7, metalness: .25}));
regM("hg-wand", () => std({map: hgTex.wand(), roughness: .5, metalness: .45}));
regM("hg-oben", () => std({map: L.tex.bulk(), color: 0x737d89, roughness: .5, metalness: .4}));
regM("hg-dach", () => std({map: L.tex.ceil(), color: 0x4a525c, roughness: .6, metalness: .4}));
regM("hg-stahl", () => std({color: 0x4d5661, roughness: .42, metalness: .7}));
regM("hg-gelb", () => std({color: 0xe0a91c, roughness: .45, metalness: .35}));
regM("hg-rumpf", () => std({color: 0xdfe4ea, roughness: .34, metalness: .3}));
regM("hg-dunkel", () => std({color: 0x30363e, roughness: .4, metalness: .6}));
regM("hg-scheibe", () => std({color: 0x0a1626, roughness: .06, metalness: .9, emissive: 0x123452, emissiveIntensity: .7}));   // getöntes Cockpitglas
regM("hg-mark", () => std({map: hgTex.mark(), transparent: true, alphaTest: .35, roughness: .75, metalness: .1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}));
regM("hg-feld", () => addM(0x63c8ff, .36, {map: hgTex.feld()}));
regM("hg-welle", () => addM(0x3f9fff, .45, {map: hgTex.welle()}));
regM("hg-raum", () => L.basic({map: hgTex.raum(), side: T3.BackSide}));
regM("hg-schild", () => std({map: hgTex.schild(), roughness: .5, emissive: 0xffffff, emissiveMap: hgTex.schild(), emissiveIntensity: .35}));
regM("hg-kuppel", () => L.basic({color: 0xffa21f}));
regM("hg-kiste", () => D.MAT("crate"));
regM("hg-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0xffc23a}, L.ADD)));
const MARK = {kreis: [0, 0, 512, 512], pfeil: [512, 0, 512, 512], schrift: [0, 512, 1024, 256], warn: [0, 768, 1024, 128], halt: [0, 896, 1024, 128]};
const decal = (b, reg, w, h, x, z, ry = 0, y = .006) => b.put("hg-mark", D.uvR(new T3.PlaneGeometry(w, h), reg, 1024, 0).rotateX(-PI / 2).rotateY(ry), x, y, z);

// Raumjäger (eigener Entwurf: Deltaflügel, Doppelleitwerk, zwei Triebwerke); lokal: Bug nach −z, Boden bei y = 0
function jaeger(b, M, glow){
  const y0 = 1.45, P = (k, g) => b.putM(k, g, M);
  const prof = [[0, 3.7], [.16, 3.4], [.4, 2.7], [.6, 1.7], [.7, .5], [.68, -1.1], [.58, -2.4], [.46, -3.15], [0, -3.2]].map(([r, y]) => new T3.Vector2(r, y));
  P("hg-rumpf", new T3.LatheGeometry(prof, 20).scale(1, 1, .68).rotateX(-PI / 2).translate(0, y0, 0));
  P("hg-scheibe", new T3.SphereGeometry(.5, 16, 8, 0, TAU, 0, PI / 2).scale(.78, .62, 2.1).translate(0, y0 + .3, -1.1));
  for (const s of [-1, 1]) {
    const ws = new T3.Shape(); ws.moveTo(s * .45, -.6); ws.lineTo(s * 3.3, 1.5); ws.lineTo(s * 3.3, 2.15); ws.lineTo(s * .45, 2.55); ws.closePath();
    P("hg-rumpf", new T3.ExtrudeGeometry(ws, {depth: .1, bevelEnabled: false}).rotateX(PI / 2).translate(0, y0 - .12, 0));
    P("acc:#ffb020", new T3.BoxGeometry(.5, .02, .7).translate(s * 2.75, y0 - .11, 1.75));
    P("hg-dunkel", new T3.CylinderGeometry(.09, .09, 1.7, 10).rotateX(PI / 2).translate(s * 3.32, y0 - .14, 1.35));
    P(s < 0 ? "acc:#ff4a4a" : "acc:#4aff8a", new T3.BoxGeometry(.06, .06, .1).translate(s * 3.33, y0 - .14, .45));
    const fs = new T3.Shape(); fs.moveTo(1.7, 0); fs.lineTo(3.1, 0); fs.lineTo(3.25, 1.25); fs.lineTo(2.75, 1.3); fs.closePath();
    P("hg-rumpf", new T3.ExtrudeGeometry(fs, {depth: .08, bevelEnabled: false}).rotateY(-PI / 2).translate(.04, 0, 0).rotateZ(-s * .32).translate(s * .42, y0 + .22, 0));
    P("acc:#ffb020", new T3.BoxGeometry(.1, .14, .5).rotateZ(-s * .32).translate(s * (.42 + 1.22 * Math.sin(.32)), y0 + .22 + 1.2 * Math.cos(.32), 3.0));
    P("hg-rumpf", new T3.CylinderGeometry(.34, .38, 2.6, 16).rotateX(PI / 2).translate(s * .66, y0 - .08, 1.95));
    P("hg-dunkel", new T3.CylinderGeometry(.3, .36, .32, 16, 1, true).rotateX(PI / 2).translate(s * .66, y0 - .08, 3.4));
    P("hg-dunkel", new T3.BoxGeometry(.46, .4, .34).translate(s * .66, y0 - .06, .6));
    P("acc:#8fe2ff", new T3.CircleGeometry(.27, 16).translate(s * .66, y0 - .08, 3.42));
    glow.push(V3(s * .66, y0 - .08, 3.55).applyMatrix4(M));
    P("steel", new T3.CylinderGeometry(.05, .05, y0 - .5, 8).translate(s * 1.25, (y0 - .5) / 2 + .08, 1.4)); P("hg-dunkel", new T3.CylinderGeometry(.2, .2, .08, 12).translate(s * 1.25, .04, 1.4));
  }
  P("steel", new T3.CylinderGeometry(.05, .05, y0 - .6, 8).translate(0, (y0 - .6) / 2 + .08, -2.2)); P("hg-dunkel", new T3.CylinderGeometry(.18, .18, .08, 12).translate(0, .04, -2.2));
}
function binder(b, z, HD){   // Fachwerkbinder quer unter dem Dach
  const y0 = 9.55, y1 = HD - .14, n = 8, x0 = -7.6, dx = 15.2 / n;
  b.box("hg-stahl", 15.2, .2, .24, 0, y0, z); b.box("hg-stahl", 15.2, .2, .24, 0, y1, z);
  for (let i = 0; i <= n; i++) { const x = x0 + i * dx; b.box("hg-stahl", .12, y1 - y0, .14, x, (y0 + y1) / 2, z);
    if (i < n) b.put("hg-stahl", stab(V3(x, i % 2 ? y0 : y1, z), V3(x + dx, i % 2 ? y1 : y0, z), .05, 6)); }
}
function hangar(ctx, b, S){
  const B = ctx.bounds, HD = HG.dach, ZT = HG.tor, WH = S.WH, G = ctx.group, Lz = B.z0 - ZT, zc = (B.z0 + ZT) / 2, le = B.z1 - ZT, zl = (B.z1 + ZT) / 2;
  // Seitenwände: Verlängerung bis zum Tor, oberer Teil bis zum Dach, Stützen, Kranbahn, Lichtband
  for (const [xw, s] of [[B.x0, 1], [B.x1, -1]]) { const Xd = d => xw + s * d;
    b.putM("hg-wand", L.wallGeo(le, WH, [], [], 1 / 2.25, 1 / WH), wandM(xw, s, zl));
    b.putM("hg-oben", L.wallGeo(Lz, HD - WH, [], [], .25, .25).translate(0, WH, 0), wandM(xw, s, zc));
    b.box("acc:#FFB020", .05, .06, Lz, Xd(.025), WH, zc); b.box("lw", .04, .34, Lz - .6, Xd(.03), 8.9, zc);
    for (const z of HG.binder) { if (z < B.z1) { b.box("hg-stahl", .36, WH, .6, Xd(.18), WH / 2, z); b.box("trim", .56, .46, .78, Xd(.28), .23, z); b.put("haz", U.scaleUV(new T3.BoxGeometry(.4, 1.0, .64), 1, 2), Xd(.2), .98, z); }
      b.box("hg-stahl", .36, HD - WH, .6, Xd(.18), (HD + WH) / 2, z); b.box("trim", .5, .3, .78, Xd(.25), WH + .15, z); b.box("hg-stahl", .62, .26, .5, Xd(.6), 7.42, z); }
    b.box("hg-gelb", .3, .34, Lz - .2, Xd(.62), 7.72, zc); b.box("steel", .08, .06, Lz - .2, Xd(.62), 7.92, zc);
  }
  // Dach mit Fachwerkbindern und Oberlichtbändern
  b.put("hg-dach", U.scaleUV(new T3.PlaneGeometry(16, Lz), 4, Lz / 4), 0, HD, zc, PI / 2);
  const bz = HG.binder.concat([B.z0, ZT]).sort((p, q) => q - p);
  for (const z of HG.binder) binder(b, z, HD);
  for (let i = 0; i < bz.length - 1; i++) { const z0 = bz[i], z1 = bz[i + 1], zm = (z0 + z1) / 2, Lp = z0 - z1 - 1.0; if (Lp < 1) continue;
    for (const s of [-1, 1]) { b.box("trim", 1.5, .08, Lp + .2, s * 3.6, HD - .04, zm); b.put("lw", new T3.PlaneGeometry(1.2, Lp), s * 3.6, HD - .09, zm, PI / 2); } }
  // Rückwand bis zum Dach: Tür-Aussparung, Fensterband der Flugleitung, Schild
  const mB = new T3.Matrix4().makeBasis(V3(-1, 0, 0), Y1, V3(0, 0, -1)).setPosition(0, 0, B.z0), win = {x0: -6.2, x1: 6.2, y0: 7.5, y1: 8.9, c: .3};
  b.putM("hg-oben", L.wallGeo(16, HD, [[-1.25, 1.25, 3.4]], [win], .25, .25), mB);
  b.putM("hg-raum", new T3.BoxGeometry(12.4, 1.4, 2.2).translate(0, 8.2, -1.12), mB); b.putM("glass", new T3.PlaneGeometry(12.4, 1.4).translate(0, 8.2, -.05), mB);
  for (const y of [7.45, 8.95]) b.putM("hg-stahl", new T3.BoxGeometry(12.7, .14, .3).translate(0, y, .08), mB);
  for (let k = 0; k <= 8; k++) b.putM("hg-stahl", new T3.BoxGeometry(.12, 1.5, .2).translate(-6.2 + k * 1.55, 8.2, .06), mB);
  b.putM("hg-schild", new T3.PlaneGeometry(4.4, 1.1).translate(0, 9.85, .05), mB);
  for (const [x0, x1] of L.cut([-8, 8], [[-1.55, 1.55]])) b.putM("haz", U.scaleUV(new T3.BoxGeometry(x1 - x0, .3, .06), (x1 - x0) / .5, 1).translate((x0 + x1) / 2, .3, .03), mB);
  // Vorn: Brüstung mit Geländer (Blick in die Startbucht), Schleusenturm um die Tür, Flugleitkanzel darauf
  const zB = B.z1, xs = 2.5, zS = HG.zS, hT = 6.2;
  for (const s of [-1, 1]) { const x0 = s * xs, x1 = s * 8, xm = (x0 + x1) / 2, w = 8 - xs;
    b.box("hg-dunkel", w, .9, .3, xm, .45, zB + .15); b.put("haz", U.scaleUV(new T3.PlaneGeometry(w, .2), w / .5, 1), xm, .78, zB + .305);
    b.box("hg-gelb", w, .07, .09, xm, 1.3, zB + .12); for (let k = 0; k <= 5; k++) b.box("hg-gelb", .06, .42, .06, x0 + s * (.15 + k * (w - .3) / 5), 1.08, zB + .12);
    ctx.obstacleBox(xm, zB + .3, w, .6); S.bel(Math.min(x0, x1), Math.max(x0, x1), 0, 1.45, zB, zB + .45); }
  const mF = new T3.Matrix4().makeBasis(V3(1, 0, 0), Y1, V3(0, 0, 1)).setPosition(0, 0, zB);
  b.putM("hg-oben", L.wallGeo(2 * xs, hT, [[-1.25, 1.25, 3.4]], [], .25, .25), mF);
  for (const s of [-1, 1]) { b.box("hg-dunkel", .24, hT, zB - zS, s * (xs - .12), hT / 2, (zB + zS) / 2); b.put("haz", U.scaleUV(new T3.PlaneGeometry(.3, hT), 1, hT / .4), s * (xs - .17), hT / 2, zB + .01); }
  b.box("hg-dunkel", 2 * xs, hT, .24, 0, hT / 2, zS + .12);
  b.box("hg-dunkel", 2 * xs + .3, .3, zB - zS + .3, 0, hT + .15, (zB + zS) / 2); b.box("hg-dunkel", 2 * xs + .3, .22, zB - zS + .3, 0, hT + 1.85, (zB + zS) / 2);
  b.box("hg-raum", 2 * xs - .3, 1.55, zB - zS - .4, 0, hT + 1.08, (zB + zS) / 2);
  for (const x of [-xs + .1, -.8, .8, xs - .1]) b.box("hg-stahl", .1, 1.6, .1, x, hT + 1.08, zB - .1);
  for (const s of [-1, 1]) b.box("hg-stahl", .1, 1.6, .1, s * (xs - .1), hT + 1.08, zS + .2);
  b.box("acc:#7fdcff", 2 * xs + .3, .04, .04, 0, hT + .32, zB + .04);
  // Startbucht hinter der Brüstung: Boden bis vor das Tor (ohne Klickfläche), Landekreise, Leitpfeile, Warnband, Haltelinie
  const LB = B.z1 - ZT + 6; b.put("hg-boden", U.scaleUV(new T3.PlaneGeometry(16, LB), 4, LB / 4), 0, 0, B.z1 - LB / 2, -PI / 2);
  const J = [[4.6, -15.1, .6], [-4.75, -15.5, -.5]], JS = 1.12;
  for (const [x, z] of J) decal(b, MARK.kreis, 7.2, 7.2, x, z);
  for (const s of [-1, 1]) decal(b, MARK.warn, 5.4, .5, s * 5.2, zB - .45);
  decal(b, MARK.pfeil, 2.2, 2.2, 0, -8.0); decal(b, MARK.schrift, 2.5, .62, 0, 4.6); decal(b, MARK.halt, 2.6, .34, 0, -9.85);
  decal(b, MARK.pfeil, 3.0, 3.0, 0, -19.0);
  // Tor zum All: Torwand mit großer Öffnung, Torpfosten mit Warnstreifen, Kraftfeld, Emitterleiste, Schild
  const mT = new T3.Matrix4().makeBasis(V3(1, 0, 0), Y1, V3(0, 0, 1)).setPosition(0, 0, ZT), TW = 7.0, TH = 9.2;
  b.putM("hg-oben", L.wallGeo(16, HD, [[-TW, TW, TH]], [], .25, .25), mT);
  for (const s of [-1, 1]) { b.box("hg-stahl", .6, TH, 1.3, s * (TW + .3), TH / 2, ZT); b.put("haz", U.scaleUV(new T3.PlaneGeometry(1.3, TH), 2, TH / .5), s * (TW - .005), TH / 2, ZT, 0, -s * PI / 2);
    b.box("acc:#7fdcff", .05, TH - .2, .05, s * (TW - .03), TH / 2, ZT + .5); }
  b.box("hg-stahl", 2 * TW + 1.2, .7, 1.3, 0, TH + .35, ZT); b.put("haz", U.scaleUV(new T3.PlaneGeometry(2 * TW + 1.2, .5), (2 * TW + 1.2) / .5, 1), 0, TH + .35, ZT + .66);
  b.box("acc:#7fdcff", 2 * TW - .1, .05, .05, 0, TH - .03, ZT + .5); b.box("acc:#7fdcff", 2 * TW, .03, .22, 0, .015, ZT);
  b.putM("hg-schild", new T3.PlaneGeometry(3.6, .9).translate(0, TH + 1.28, .03), mT);
  const feld = new T3.Mesh(new T3.PlaneGeometry(2 * TW, TH), L.matOf("hg-feld")); feld.position.set(0, TH / 2, ZT); feld.userData.noPick = true; G.add(feld);
  const welle = new T3.Mesh(new T3.PlaneGeometry(2 * TW, TH), L.matOf("hg-welle")); welle.position.set(0, TH / 2, ZT + .05); welle.userData.noPick = true; G.add(welle); const wt = hgTex.welle();
  const ft = hgTex.feld(); ft.repeat.set(5, 3.2);
  for (let k = 0; k < 9; k++) b.box("acc:#ffd36a", .16, .05, .16, -7.2 + k * 1.8, .03, ZT - 5.8);   // Kante des Vorfelds draußen
  // Zwei Raumjäger auf Landekreisen, Kisten und Tankwagen
  const glow = []; for (const [x, z, ry] of J) jaeger(b, new T3.Matrix4().compose(V3(x, 0, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, ry, 0)), V3(JS, JS, JS)), glow);
  G.add(glowPts(glow.flatMap(v => [v.x, v.y, v.z]), 0x7fd8ff, 1.2, .9));
  for (const [x, y, z, w, h, d, ry] of [[-7.0, .45, -12.2, .9, .9, .9, .1], [-7.05, 1.25, -12.25, .7, .7, .7, -.2], [-6.1, .4, -12.1, .8, .8, .8, .3], [7.0, .5, -19.6, 1.0, 1.0, 1.0, .2], [6.9, 1.35, -19.5, .7, .7, .7, -.1], [6.0, .35, -19.9, .7, .7, .7, 0]])
    b.put("hg-kiste", D.uvR(new T3.BoxGeometry(w, h, d), D.PR.crate), x, y, z, 0, ry, 0);
  b.box("hg-gelb", 1.0, .7, 2.0, 1.4 - 8, .55, -18.5); b.put("white", new T3.CylinderGeometry(.42, .42, 1.6, 14).rotateX(PI / 2), -6.6, 1.25, -18.5);
  for (const dz of [-.65, .65]) for (const s of [-1, 1]) b.put("rubber", new T3.CylinderGeometry(.2, .2, .14, 12).rotateZ(PI / 2), -6.6 + s * .52, .2, -18.5 + dz);
  // Warnleuchten am Tor, auf der Kanzel und an der Rückwand
  const wl = warnleuchten(ctx, b, [[-6.2, TH + .7, ZT + .4], [-2.2, TH + .7, ZT + .4], [2.2, TH + .7, ZT + .4], [6.2, TH + .7, ZT + .4], [-2.2, hT + 1.96, zB - .25], [2.2, hT + 1.96, zB - .25], [-2.8, 5.5, B.z0 - .25], [2.8, 5.5, B.z0 - .25]]);
  for (const s of [-1, 1]) b.box("hg-stahl", .3, .1, .3, s * 2.8, 5.45, B.z0 - .2);   // Rückwand: neben dem Türbereich (|x| < 2,3 bleibt bis 6,2 m frei)
  // Kranbrücke (fährt langsam längs, Katze quer; Haken bleibt über 6,35 m)
  const kr = new T3.Group(), kt = new T3.Group(), kb = L.Bld(), tb = L.Bld(); G.add(kr); kr.add(kt);
  for (const dz of [-.55, .55]) { kb.box("hg-gelb", 14.9, .62, .34, 0, 8.3, dz); kb.put("haz", U.scaleUV(new T3.PlaneGeometry(14.6, .3), 29, 1), 0, 8.3, dz + Math.sign(dz) * .175, 0, dz < 0 ? PI : 0, 0); }
  for (const s of [-1, 1]) { kb.box("hg-gelb", .5, .5, 2.4, s * 7.38, 8.17, 0); kb.box("hg-dunkel", .3, .2, 2.0, s * 7.38, 7.98, 0); kb.box("acc:#ffd36a", .04, .04, 1.8, s * (7.38 - .27), 8.17, 0); }
  kb.build(kr);
  tb.box("hg-dunkel", 1.3, .5, 1.6, 0, 8.86, 0); tb.box("hg-gelb", 1.0, .3, .7, 0, 7.85, 0);
  for (const dx of [-.18, .18]) tb.put("steel", new T3.CylinderGeometry(.015, .015, 1.2, 5), dx, 7.1, 0);
  tb.box("hg-gelb", .55, .45, .3, 0, 6.38 + .22, 0); tb.put("steel", new T3.TorusGeometry(.13, .035, 6, 14, PI * 1.5), 0, 6.25, 0, 0, 0, PI * .75); tb.build(kt);
  S.bel(-8, 8, 6.0, 8.9, -11, -3.6);
  // Wartungssteg von der Flugleitung (Rückwand) längs über dem Gang bis vor die Kranbahn: Unterkante in ctx.height (7,2 m) – daran können
  // Räume und Lehrkraft Teile aufhängen (vorn trägt die Kranbrücke); an den Bindern abgehängt
  const zs0 = -3.1, zs1 = B.z0 - .25, Ls = zs1 - zs0, zsm = (zs0 + zs1) / 2;
  b.box("hg-dunkel", 1.5, .1, Ls, 0, 7.25, zsm);
  for (const s of [-1, 1]) { b.box("hg-stahl", .1, .32, Ls, s * .75, 7.36, zsm); b.box("acc:#ffd36a", .04, .03, Ls - .2, s * .75, 7.19, zsm);
    for (const y of [7.85, 8.3]) b.box("hg-gelb", .05, .05, Ls, s * .72, y, zsm);
    for (let z = zs0 + .05; z <= zs1; z += 1.38) b.box("hg-gelb", .05, .95, .05, s * .72, 7.825, z);
    for (const z of PZ.filter(q => q > zs0 && q < zs1)) b.box("hg-stahl", .06, 1.2, .06, s * .75, 8.9, z); }   // Abhänger zum Untergurt der Binder (9,45 m)
  b.box("hg-gelb", 1.49, .05, .05, 0, 8.3, zs0 + .02); b.box("hg-gelb", 1.49, .05, .05, 0, 7.85, zs0 + .02);
  S.bel(-.85, .85, 7.15, 8.4, zs0 - .1, zs1);
  const t0 = Math.random() * 30;
  ctx.tick((dt, t) => { const tt = t + t0; kr.position.z = -8.8 + 4.6 * Math.sin(tt * .05); kt.position.x = 3.2 * Math.sin(tt * .037 + 1);
    ft.offset.y -= dt * .025; ft.offset.x = Math.sin(t * .2) * .02; L.matOf("hg-feld").opacity = .34 + .06 * Math.sin(t * .8); wt.offset.y = (t * .07) % 1; wl(t); });
}
// Ersatztriebwerk auf Montagebock (Ausstattung) und neue Füllteile
function ersatzTw(B, w){
  const zc = .45, y = .75; B.box("frame", w, .08, .8, 0, .04, zc); B.add("haz", U.scaleUV(new T3.BoxGeometry(w, .02, .82), w / .5, 1), 0, .085, zc);
  for (const x of [-.45, .35]) { B.rod("rib", [x - .25, .1, zc - .3], [x, y - .1, zc], .03, 6); B.rod("rib", [x + .25, .1, zc - .3], [x, y - .1, zc], .03, 6); B.rod("rib", [x, .1, zc + .3], [x, y - .1, zc], .03, 6); B.tor("frame", .3, .03, x, y, zc, 0, PI / 2, 0); }
  B.cyl("white", .3, .3, 1.2, 18, -.15, y, zc, 0, 0, PI / 2); B.cyl("gold", .31, .31, .14, 18, -.5, y, zc, 0, 0, PI / 2); B.cyl("frame", .26, .3, .2, 16, -.85, y, zc, 0, 0, PI / 2);
  const prof = [[.22, 0], [.2, .08], [.26, .3], [.36, .55]].map(([r, yy]) => new T3.Vector2(r, yy)); B.add("copper", new T3.LatheGeometry(prof, 18), .45, y, zc, 0, 0, -PI / 2);
  B.tor("lc", .3, .014, -.15 + .45, y, zc, 0, PI / 2, 0); B.box("frame", .06, 1.3, .06, w / 2 - .1, .65, .1); B.plane("screen", .3, .3, D.PR.gauge, w / 2 - .1, 1.15, .14);
}
if (D.ITEMS) {
  D.ITEMS.werkzeugwagen = {minW: .85, maxW: .85, d: .6, h: 1.15, build: B => {   // rollbarer Werkzeugschrank mit Schubladen
    B.box("red", .8, .82, .5, 0, .53, .3); for (let k = 0; k < 5; k++) { B.box("frame", .7, .012, .01, 0, .25 + k * .15, .555); B.box("steel", .2, .02, .02, 0, .3 + k * .15, .565); }
    B.box("frame", .84, .04, .54, 0, .96, .3); for (const x of [-.32, .32]) for (const z of [.1, .5]) B.cyl("rubber", .05, .05, .04, 10, x, .05, z, PI / 2);
    B.box("steel", .7, .03, .03, 0, 1.05, .58); for (const x of [-.36, .36]) B.box("steel", .03, .1, .03, x, 1.0, .58);
    for (let k = 0; k < 4; k++) B.box(k % 2 ? "ly" : "dark", .26, .05, .07, -.24 + k * .16, 1.005, .26, 0, k * .4, 0); B.plane("print", .5, .25, D.PR.tools, 0, .6, .556); }};
  D.ITEMS.ladesaeule = {minW: .55, maxW: .55, d: .45, h: 1.95, build: B => {   // Lade- und Tanksäule mit Schlauch
    B.box("white", .4, 1.7, .3, 0, .85, .2); B.box("frame", .44, .06, .34, 0, 1.73, .2); B.box("frame", .44, .08, .34, 0, .04, .2);
    B.plane("screen", .3, .2, D.PR.energie, 0, 1.4, .352); B.box("acc:#7fdcff", .02, 1.4, .01, -.19, .85, .352); B.box("ly", .3, .03, .01, 0, 1.12, .352);
    B.tor("rubber", .13, .022, 0, .75, .38, 0, 0, 0); B.box("dark", .08, .2, .08, .14, .95, .38); B.cyl("rubber", .02, .02, .3, 6, .14, 1.1, .38); }};
}
K.raum.beweg1 = {
  licht: {bg: 0x020409, nebel: [0x0a0f16, .0085], himmel: [0xe4eeff, 0x40464e, .95], umgebung: [0xdce8ff, .24], sonne: [0xf2f6ff, 1.35, [5, 16, 6]],
    decke: [[0xeaf3ff, 55, -3.5, 9.2, 2.5], [0xeaf3ff, 60, 3.5, 9.2, -6.5]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#2a323c"], [.3, "#56606c"], [.47, "#8a96a4"], [.5, "#5fbfff"], [.53, "#3a424c"], [1, "#1e2226"]]);
    for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(240,248,255,.95)"; g.fillRect(i * 64 + 12, h * .08, 40, 10); } g.fillStyle = "#e0a91c"; g.fillRect(0, h * .4, w, 4); },
  all: {planet: [-6, -12.5, -70], sonne: [20, 30, -62], nebel: [[205, 64, 44, [10, 24, -78]]]},   // Planet unter der Station: Horizontbogen im Tor
  huelle: ctx => X.huelle(ctx, {
    boden: "hg-boden", lauf: null, leit: "hg-leit", wand: "hg-wand", WH: 7.2, schraege: false, oben: null, stirn: null, decke: null, rippe: "hg-stahl", einlage: null,
    leiste: "acc:#ffd36a", akzent: null, rohr: null, fenster: {front: [], back: []}, eckrohre: false, ledFarben: ["#FFB020", "#4FC3F7", "#3DDC97", "#FF5C5C"],
    rippeExtra(b, {s, z, Xd}){ b.put("haz", U.scaleUV(new T3.BoxGeometry(.4, 1.0, .64), 1, 2), Xd(.2), .98, z); },
    extra: hangar
  }),
  stimmung(ctx, sc, A){ for (let i = 0; i < A.farben.length; i += 3) { const k = (i / 3) % 5; A.farben[i] = 1; A.farben[i + 1] = k ? .93 : .78; A.farben[i + 2] = k ? .82 : .45; }
    A.geo.attributes.color.needsUpdate = true; A.pts.material.size = .05; },
  dekor: {moebel: ["workshop", "lockers", "suit", "werkzeugwagen"], fueller: ["ladesaeule", "sos", "locker1"], bilder: [2], pflanzen: false, globus: false, drohnen: 2,
    thema(ctx, B, R, I, env, D){ D.wallPiece(ctx, B, {minW: 1.7, maxW: 2.0, d: .9, h: 1.3}, w => ersatzTw(B, w), {pref: -2});
      D.wallPiece(ctx, B, {minW: 1.2, maxW: 1.8, d: .47, h: 2.25}, w => D.shipShelf(B, w), {pref: 6}); }}
};

/* =====================================================================
   beweg2 · Antriebsdeck
   ===================================================================== */
// Triebwerke hinter den Heckfenstern: Gondelspitze (x | y | z), Gierwinkel nach außen (Schwenkdüsen, ≈ 60°) – nur so sieht man vom Eingang aus
// Gondel, glühende Düse und Strahl im Profil (bei Achse fast in Blickrichtung wirkt die Gondel wie eine dunkle Kugel im Fenster)
const AD_E = [[-2.3, 3.4, -13.7, 1.05], [2.3, 3.4, -13.7, -1.05]];
const adTex = {
  boden: e => ctex(1024, 1024, (g, w, h) => {   // 4 × 4 m Gitterrost; e: Leuchtkarte – blaues Glühen der Triebwerksleitungen darunter
    const r = zufall(e ? 121 : 120); g.fillStyle = e ? "#000" : "#121821"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 256, y = j * 256;
      if (!e) { g.fillStyle = "#3a4552"; g.fillRect(x + 2, y + 2, 252, 252); g.fillStyle = "#0e131a"; g.fillRect(x + 12, y + 12, 232, 232); }
      for (let k = 16; k < 240; k += 10) { if (e) { g.fillStyle = `rgba(${60 + r() * 40 | 0},${150 + r() * 60 | 0},255,${.3 + .5 * r()})`; g.fillRect(x + k + 2, y + 14, 5, 228); }
        else { g.fillStyle = "#566474"; g.fillRect(x + k, y + 14, 3, 228); g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x + k, y + 14, 1, 228); } }
      if (!e) { for (let k = 40; k < 240; k += 50) { g.fillStyle = "#3e4a58"; g.fillRect(x + 14, y + k, 228, 4); } for (const [a, c] of [[x + 7, y + 7], [x + 249, y + 7], [x + 7, y + 249], [x + 249, y + 249]]) niet(g, a, c); } }
    if (e) { g.globalCompositeOperation = "destination-in"; for (let i = 0; i < 10; i++) fleck(g, r() * w, r() * h, 240, "0,0,0", .9); g.globalCompositeOperation = "source-over"; }
    else streu(g, w, h, 8000, .16, ["#000", "#8aa0b8", "#22303e"], r);
  }, e ? "ad-boden-e" : "ad-boden", [1, 1]),
  wand: () => ctex(512, 1024, (g, w, h) => {   // 2,25 × 5,8 m: dunkle Maschinenpaneele, unten Leitungsband mit Flanschen, oben blaues Lichtband
    const r = zufall(122), Y = m => (5.8 - m) / 5.8 * h; g.fillStyle = "#1c232c"; g.fillRect(0, 0, w, h);
    for (const [y0, y1, c] of [[.08, 1.0, "#2b3440"], [1.06, 2.62, "#323c49"], [2.7, 5.36, "#28313c"]]) L.plate(g, 6, Y(y1), w - 12, Y(y0) - Y(y1), c, {hi: .16, lo: .5, sheen: .05, shade: .2});
    for (let x = 30; x < w; x += 60) { g.fillStyle = "#11161c"; g.fillRect(x, Y(.8), 36, Y(.3) - Y(.8)); g.fillStyle = "rgba(111,200,255,.25)"; g.fillRect(x, Y(.3) - 3, 36, 3); }
    for (const [y, c] of [[1.55, "#5a6878"], [2.1, "#3e6fa8"]]) { const gr = g.createLinearGradient(0, Y(y) - 16, 0, Y(y) + 16); gr.addColorStop(0, "#0e1218"); gr.addColorStop(.35, c); gr.addColorStop(.5, "#c8d8ea"); gr.addColorStop(1, "#0e1218");
      g.fillStyle = gr; g.fillRect(0, Y(y) - 16, w, 32); for (const x of [90, 330]) { g.fillStyle = "#151b22"; g.fillRect(x, Y(y) - 22, 18, 44); } }
    g.fillStyle = "#0b1016"; g.beginPath(); g.arc(210, Y(1.82), 34, 0, TAU); g.fill(); g.strokeStyle = "#9fb4c8"; g.lineWidth = 4; g.stroke(); g.strokeStyle = "#4FC3F7"; g.beginPath(); g.moveTo(210, Y(1.82)); g.lineTo(232, Y(1.82) - 18); g.stroke();
    kleber(g, 400, Y(1.82), 60, "PLASMA 2", "#4FC3F7", "#0b1016");
    g.fillStyle = "#0e141b"; g.fillRect(0, Y(5.78), w, Y(5.42) - Y(5.78)); g.fillStyle = "rgba(111,200,255,.9)"; g.fillRect(0, Y(5.62), w, 5);
    streu(g, w, h, 6000, .1, ["#000", "#fff"], r);
  }, "ad-wand", [1, 1]),
  plasma: () => ctex(128, 512, (g, w, h) => {   // fließende blaue Bänder
    const id = g.createImageData(w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / w * TAU, v = y / h * TAU;
      const f = .55 + .45 * Math.sin(v * 3 + Math.sin(u * 2 + v) * 1.4) * Math.sin(u * 3 + v * 5 + Math.sin(v * 2)), q = Math.max(0, Math.min(1, f)), i = (y * w + x) * 4;
      d[i] = 60 + 150 * q * q; d[i + 1] = 150 + 100 * q; d[i + 2] = 255; d[i + 3] = 255 * (.35 + .65 * q); }
    g.putImageData(id, 0, 0); }, "ad-plasma", [1, 1]),
  glocke: () => ctex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, "#0a1a30"); gr.addColorStop(.35, "#14386a"); gr.addColorStop(.75, "#3a86e0"); gr.addColorStop(1, "#d8f0ff");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); }, "ad-glocke"),
  strahl: () => ctex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "destination-out"; for (let x = 0; x < w; x += 8) { g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x, 0, 3, h); } }, "ad-strahl"),
  schub: () => ctex(1024, 256, (g, w, h) => {   // Schubanzeigen über den Heckfenstern: oben TW 1 (links), unten TW 2 (rechts), je 1024 × 128
    g.fillStyle = "#04121f"; g.fillRect(0, 0, w, h);
    [["TW 1", .82], ["TW 2", .8]].forEach(([n, v], i) => { const y0 = i * 128; g.strokeStyle = "#4FC3F7"; g.lineWidth = 5; L.chamf(g, 6, y0 + 6, w - 12, 116, 18); g.stroke();
      g.textBaseline = "middle"; g.textAlign = "left"; g.fillStyle = "#FFE81F"; g.font = `800 46px ${FONT}`; g.fillText("SCHUB", 30, y0 + 66);
      g.fillStyle = "#BFEBFF"; g.font = `700 40px ${FONT}`; g.fillText(n, 200, y0 + 66);
      for (let k = 0; k < 24; k++) { g.fillStyle = k / 24 < v ? (k > 19 ? "#FFE81F" : "#4FC3F7") : "rgba(79,195,247,.18)"; g.fillRect(330 + k * 22, y0 + 40, 16, 52); }
      g.fillStyle = "#EAF6FF"; g.textAlign = "right"; g.fillText(`${Math.round(v * 100)} %`, w - 30, y0 + 66); }); }, "ad-schub")
};
regM("ad-boden", () => std({map: adTex.boden(false), emissive: 0xffffff, emissiveMap: adTex.boden(true), emissiveIntensity: .6, roughness: .5, metalness: .6}));
regM("ad-wand", () => std({map: adTex.wand(), roughness: .5, metalness: .45}));
regM("ad-oben", () => std({map: L.tex.bulk(), color: 0x4a5668, roughness: .5, metalness: .45}));
regM("ad-decke", () => std({map: L.tex.ceil(), color: 0x46526a, roughness: .5, metalness: .45}));
regM("ad-rippe", () => std({color: 0x2c3542, roughness: .38, metalness: .78}));
regM("ad-rohr", () => std({color: 0x7d8da0, roughness: .3, metalness: .85}));
regM("ad-plasma", () => addM(0x7fc8ff, .85, {map: adTex.plasma()}));
regM("ad-gondel", () => std({map: L.tex.bulk(), color: 0x5a6576, roughness: .45, metalness: .6}));
regM("ad-glocke", () => std({color: 0x2a3340, roughness: .35, metalness: .8, emissive: 0xffffff, emissiveMap: adTex.glocke(), emissiveIntensity: 1.9, side: T3.DoubleSide}));
regM("ad-strahl", () => addM(0x7fc8ff, .55, {map: adTex.strahl(), fog: false}));
regM("ad-kern", () => addM(0xd8f0ff, .7, {map: adTex.strahl(), fog: false}));
regM("ad-schub", () => L.basic({map: adTex.schub()}));
regM("ad-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0x5fb8ff}, L.ADD)));
function triebwerke(ctx, b, S){   // Blick vom Heckfenster auf die laufenden Triebwerke: Gondel, glühende Düsenglocke, sich aufweitender Abgasstrahl (lokal: Achse nach −z)
  const G = ctx.group, pk = [], pd = [], gs = [], gk = [], v = V3(0, 0, 0);
  b.put("ad-gondel", U.scaleUV(new T3.PlaneGeometry(20, 10), 5, 2.5), 0, -.3, -16.0, -PI / 2);   // Heckdeck draußen unter den Fenstern
  for (const [x, y, z, ry] of AD_E) {
    const M = new T3.Matrix4().makeRotationY(ry).setPosition(x, y, z), P = (k, g) => b.putM(k, g, M), W = g => g.applyMatrix4(M);
    P("ad-gondel", new T3.CylinderGeometry(1.2, 1.3, 2.8, 28).rotateX(PI / 2).translate(0, 0, -1.4));
    P("ad-gondel", new T3.SphereGeometry(1.2, 24, 10, 0, TAU, 0, PI / 2).scale(1, 1, .5).rotateX(PI / 2).translate(0, 0, 0));
    P("ad-gondel", new T3.BoxGeometry(1.0, y - .9, 2.4).translate(0, -(y + .9) / 2 + .3 - .3, -1.4));
    for (const zz of [-.6, -1.5, -2.4]) P("acc:#7fd0ff", new T3.TorusGeometry(1.27, .06, 6, 40).translate(0, 0, zz));
    const prof = [[.95, 0], [1.0, .4], [1.3, 1.3], [1.8, 2.5], [2.4, 3.8], [2.7, 4.6]].map(([r, yy]) => new T3.Vector2(r, yy));
    P("ad-glocke", new T3.LatheGeometry(prof, 36).rotateX(-PI / 2).translate(0, 0, -2.8));
    for (const [zz, rr] of [[-4.1, 1.33], [-5.3, 1.86], [-6.5, 2.42]]) P("ad-rohr", new T3.TorusGeometry(rr, .06, 6, 40).translate(0, 0, zz));
    P("acc:#bfe8ff", new T3.TorusGeometry(2.7, .08, 6, 56).translate(0, 0, -7.4));
    gs.push(W(new T3.CylinderGeometry(2.5, 6.0, 24, 28, 1, true).rotateX(PI / 2).translate(0, 0, -19.4)));   // Strahl: weitet sich im Vakuum auf
    gk.push(W(new T3.CylinderGeometry(1.45, .3, 12, 20, 1, true).rotateX(PI / 2).translate(0, 0, -13.4)));    // heller Kern
    v.set(0, 0, -8.6).applyMatrix4(M); pk.push(v.x, v.y, v.z); for (let k = 0; k < 4; k++) { v.set(0, 0, -10.2 - k * 3.4).applyMatrix4(M); pd.push(v.x, v.y, v.z); }
  }
  const pl = new T3.Mesh(L.merge(gs), L.matOf("ad-strahl")), kn = new T3.Mesh(L.merge(gk), L.matOf("ad-kern")); pl.userData.noPick = kn.userData.noPick = true; G.add(pl, kn);
  const pa = glowPts(pk, 0x7fd0ff, 8.0, .8), pb = glowPts(pd, 0xbfe8ff, 2.4, .7); G.add(pa, pb);
  ctx.tick((dt, t) => { const f = .5 + .5 * Math.sin(t * 2.1) * Math.sin(t * .63 + 1);   // ruhiges Atmen der Abgasstrahlen (< 3 Hz, kleiner Hub)
    L.matOf("ad-strahl").opacity = .64 + .08 * f; L.matOf("ad-kern").opacity = .74 + .1 * f; pa.material.opacity = .72 + .1 * f; pb.material.opacity = .55 + .15 * Math.sin(t * 1.4); });
}
function plasmaDecke(ctx, b, S){   // Hauptleitung längs unter der Decke: Rohrstücke, gläserne Abschnitte mit fließendem Plasma, Leuchtringe
  const y = 6.68, r = .4, G = ctx.group, glas = [];
  for (let z = -10.5; z < 10.6; z += 3) { b.put("ad-rohr", new T3.CylinderGeometry(r, r, 2.0, 18, 1, true).rotateX(PI / 2), 0, y, z + 1.0);
    for (const zz of [z, z + 2.0]) { b.put("ad-rippe", new T3.CylinderGeometry(r + .07, r + .07, .16, 18).rotateX(PI / 2), 0, y, zz); b.put("acc:#7fd0ff", new T3.TorusGeometry(r + .075, .02, 4, 24), 0, y, zz + (zz === z ? .09 : -.09)); }
    if (z + 2.08 < 10.6) glas.push(new T3.CylinderGeometry(r - .04, r - .04, .84, 18, 1, true).rotateX(PI / 2).translate(0, y, z + 2.5)); }
  for (const z of PZ) b.box("ad-rippe", .18, .55, .18, 0, 7.2 - .27, z);
  const gm = new T3.Mesh(L.merge(glas), L.matOf("ad-plasma")); gm.userData.noPick = true; G.add(gm);
  const pt = adTex.plasma(); pt.repeat.set(2, 1); ctx.tick(dt => { pt.offset.y -= dt * .22; });
  S.bel(-.55, .55, y - .5, 7.2, -11, 11);
}
function hangRinge(b, S){   // Leuchtringe um die dicken Leitungen der Schrägen (Schrägen-Matrix der Hülle)
  for (const s of [-1, 1]) { const mc = S.mc && S.mc[s]; if (!mc) continue;
    for (let a = -10.2; a <= 10.2; a += 1.7) { b.putM("ad-rippe", new T3.CylinderGeometry(.27, .27, .12, 16).rotateZ(PI / 2).translate(a, -.4, .27), mc); b.putM("acc:#7fd0ff", new T3.TorusGeometry(.275, .018, 4, 20).rotateY(PI / 2).translate(a + .07, -.4, .27), mc); } }
}
K.raum.beweg2 = {
  licht: {bg: 0x01030a, nebel: [0x040a16, .011], himmel: [0xcfe0ff, 0x0e1626, .72], umgebung: [0xa9c4ff, .16], sonne: [0xe2ecff, 1.1],
    decke: [[0x9cc8ff, 28, 0, 6.0, 5.7], [0x7fb0ff, 30, 0, 6.0, -5.7]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#0a1220"], [.4, "#1e2e48"], [.5, "#4f8fd8"], [.56, "#162236"], [1, "#05080e"]]);
    for (let i = 0; i < 6; i++) fleck(g, i * 90 + 30, h * .5, 26, "120,200,255", .9); for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(190,220,255,.8)"; g.fillRect(i * 64 + 14, h * .12, 36, 6); } },
  all: {planet: [22, -8, 70], sonne: [34, 26, -58], nebel: [[215, 70, 46, [-10, 16, -80]]]},   // Planet hinter dem Heck nicht im Blick: die Triebwerke sollen wirken
  huelle: ctx => X.huelle(ctx, {
    boden: "ad-boden", leit: "ad-leit", wand: "ad-wand", oben: "ad-oben", stirn: "ad-oben", decke: "ad-decke", rippe: "ad-rippe", einlage: "acc:#4FA8FF",
    leiste: "acc:#7fd0ff", akzent: "acc:#4FA8FF", rohr: "ad-rohr", rohre: [[-.4, .26], [.05, .13], [.3, .08]], deckenlicht: "acc:#bfe2ff", mittel: null,
    fenster: {front: [{x0: 2.8, x1: 7.4, y0: 1.3, y1: 6.5, c: .9}, {x0: -7.4, x1: -2.8, y0: 1.3, y1: 6.5, c: .9}]}, ledFarben: ["#4FC3F7", "#9BE7FF", "#FFE81F", "#3DDC97"],
    rippeExtra(b, {z, Xd, WH}){ for (const dz of [-.44, .44]) { b.put("ad-rohr", new T3.CylinderGeometry(.075, .075, WH - .2, 10, 1, true), Xd(.2), WH / 2, z + dz);
      for (const y of [1.2, 2.8, 4.4]) { b.put("ad-rippe", new T3.CylinderGeometry(.1, .1, .1, 10), Xd(.2), y, z + dz); b.put("acc:#7fd0ff", new T3.TorusGeometry(.1, .012, 4, 14), Xd(.2), y + .06, z + dz, PI / 2); } } },
    stirnExtra(b, {side, m, S}){ if (side !== "front") return;   // Schubanzeige je Triebwerk über seinem Heckfenster (nicht über der Tür: dort sitzt das Türschild)
      for (const [k, xc] of [[0, -5.1], [1, 5.1]]) { const g = new T3.PlaneGeometry(3.3, .41), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, (1 - k) * .5 + uv.getY(i) * .5);
        b.putM("ad-rippe", new T3.BoxGeometry(3.42, .52, .1).translate(xc, 6.88, .1), m); b.putM("ad-schub", g.translate(xc, 6.88, .152), m); b.putM("acc:#7fd0ff", new T3.BoxGeometry(3.42, .025, .025).translate(xc, 6.6, .14), m);
        S.bel(xc - 1.75, xc + 1.75, 6.58, 7.15, -11, -10.8); } },
    extra(c, b, S){ triebwerke(c, b, S); plasmaDecke(c, b, S); hangRinge(b, S); }
  }),
  stimmung(ctx, sc, A){
    A.eigen = true; const sw = A.sweep, dl = ctx._licht ? ctx._licht.decke : []; sw.color.set(0x4fa8ff); sw.position.set(0, 4.0, -9.8);
    for (let i = 0; i < A.farben.length; i += 3) { const w = (i / 3) % 6 === 0; A.farben[i] = w ? .9 : .35; A.farben[i + 1] = w ? .95 : .7; A.farben[i + 2] = 1; } A.geo.attributes.color.needsUpdate = true; A.pts.material.size = .06;
    const b0 = dl.map(l => l.intensity);
    ctx.tick((dt, t) => { const v = .05 * Math.sin(t * TAU * .9) * Math.sin(t * .7) + .03 * Math.sin(t * TAU * 1.6);   // leichtes Vibrieren (≤ 1,6 Hz, ± 8 %)
      dl.forEach((l, i) => { l.intensity = b0[i] * (1 + v); }); sw.intensity = 16 + 5 * Math.sin(t * 1.9) * Math.sin(t * .45 + .5); });
  },
  dekor: {moebel: ["tanks", "workshop", "breaker", "fuse"], fueller: ["ventil", "kasten", "ventil", "sos"], bilder: [2], pflanzen: false, globus: false, drohnen: 1}
};
})();
