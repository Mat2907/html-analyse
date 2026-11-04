/* ---------- 17_raum_detektiv_kraft2.js ---------- */
/* =====================================================================
   kraft2 · Hügel von Hampstead (Raumthema der Detektei, siehe 17_raum_detektiv.js)
   Draußen auf der Wiese: Grasboden mit Kiesweg, Himmelskugel mit Sommerwolken, gewellte Hügel zu beiden Seiten, vorn fällt der Hügel ins Tal ab und gibt
   den Blick über die Stadt im Dunst frei. Seitlich ein Lattenzaun mit Schautafeln (dort hängen die Tafeln des Raums), vorn und hinten
   ein Holztor mit Hecken. Drei alte Eichen strecken ihre Äste über die Wiese – daran hängen bei 6,5 m das Schild über dem Mittelstück
   (z −1,5) und die Federleuchten (z 5,2 und −7,2). Drachen am Himmel. Ausstattung: Parkbänke, Picknick, Schubkarre, Hochrad, Heuhaufen.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D, KIT = R3D && R3D.kits && R3D.kits.detektiv;
if (!T3 || !KIT || !KIT.raum17 || !KIT.raum17.aussen || !KIT._h) return;
const H_ = KIT._h, {U, TAU, M, S, KB, tex} = H_, R17 = KIT.raum17, A17 = R17.aussen, {mt, ctex, hsl, speck, blob, bohlen, felder, moebel, HOEHE} = R17;
const PI = Math.PI, V3 = (x, y, z) => new T3.Vector3(x, y, z);

const wblob = (g, w, h, x, y, rx, ry, c) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) if (x + dx > -rx && x + dx < w + rx && y + dy > -ry && y + dy < h + ry) blob(g, x + dx, y + dy, rx, ry, c); };
const TX = {
  gras: () => ctex(512, 512, "k2-gras", (g, w, h, r) => { g.fillStyle = "#56722e"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) wblob(g, w, h, r() * w, r() * h, 30 + r() * 70, 24 + r() * 50, r() < .5 ? "rgba(120,150,60,.35)" : "rgba(40,62,22,.32)");
    for (let i = 0; i < 11000; i++) { const x = r() * w, y = r() * h, L = 4 + r() * 9, a = -PI / 2 + (r() - .5) * 1.1; g.strokeStyle = hsl(68 + r() * 40, 32 + r() * 30, 17 + r() * 30); g.lineWidth = .8 + r() * 1.3;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    for (let i = 0; i < 260; i++) { g.fillStyle = ["#f6f2e4", "#f2d24a", "#e8a8c4", "#ffffff", "#c8b4f0", "#f6f2e4"][(r() * 6) | 0]; g.beginPath(); g.arc(r() * w, r() * h, 1.5 + r() * 1.6, 0, TAU); g.fill(); } }, [1, 1]),
  // Kiesweg: sandiger Grund mit Kieseln und Fahrspuren, Ränder weich ins Gras auslaufend (Alpha)
  kies: () => ctex(256, 512, "k2-kies", (g, w, h, r) => { g.fillStyle = "#a8946c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) wblob(g, w, h, r() * w, r() * h, 20 + r() * 40, 30 + r() * 60, r() < .5 ? "rgba(90,74,50,.3)" : "rgba(200,184,150,.3)");
    for (const x of [w * .3, w * .7]) { const gr = g.createLinearGradient(x - 14, 0, x + 14, 0); gr.addColorStop(0, "rgba(70,56,36,0)"); gr.addColorStop(.5, "rgba(70,56,36,.3)"); gr.addColorStop(1, "rgba(70,56,36,0)"); g.fillStyle = gr; g.fillRect(x - 14, 0, 28, h); }
    for (let i = 0; i < 2600; i++) { g.fillStyle = hsl(30 + r() * 20, 8 + r() * 14, 40 + r() * 35); g.beginPath(); g.ellipse(r() * w, r() * h, 1 + r() * 2.6, 1 + r() * 2, r() * PI, 0, TAU); g.fill(); }
    g.globalCompositeOperation = "destination-in"; const m = g.createLinearGradient(0, 0, w, 0); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(.2, "rgba(0,0,0,1)"); m.addColorStop(.8, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = m; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over"; }, [1, 1]),
  himmel: () => ctex(1024, 512, "k2-himmel", (g, w, h, r) => A17.himmelMalen(g, w, h, r, {verlauf: [[0, "#3c6eb4"], [.5, "#6e9ed2"], [.85, "#a8c8e4"], [1, "#d4e2ea"]], unten: "#7d9070",
    dunst: "212,226,234", sonne: [.345, .17, 7, "255,240,205"], wolken: {n: 30, farbe: "rgba(255,255,255,.62)", schatten: "rgba(150,166,190,.28)", band: [.16, .46]}})),
  env: () => { const t = ctex(512, 256, "k2-env", (g, w, h, r) => { A17.himmelMalen(g, w, h, r, {verlauf: [[0, "#4a78b8"], [.8, "#a8c4dc"], [1, "#d0dce2"]], unten: "#5e7a3a"}); }); t.mapping = T3.EquirectangularReflectionMapping; return t; },
  // Blick vom Hügel: ferne Hügelkette, die Stadt im Dunst mit Türmen und einer Kuppel, Rauchfahnen, davor Felder und Baumgruppen (oben durchsichtig)
  stadt: () => ctex(1024, 256, "k2-stadt", (g, w, h, r) => { g.clearRect(0, 0, w, h); const hz = h * .3;
    const ridge = (y0, amp, col, f) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, y0 + Math.sin(x * f + 1.3) * amp + Math.sin(x * f * 2.7) * amp * .4); g.lineTo(w, h); g.fill(); };
    ridge(hz - 10, 9, "rgba(150,170,190,.9)", .006); ridge(hz + 4, 5, "#a2b2bc", .011);
    for (let x = 0; x < w; x += 3 + r() * 5) { const bh = 3 + r() * 12; g.fillStyle = hsl(210, 10 + r() * 8, 58 + r() * 12); g.fillRect(x, hz + 8 - bh + r() * 4, 3 + r() * 6, bh + 20); }
    for (let i = 0; i < 26; i++) { const x = r() * w, s = 8 + r() * 18; g.fillStyle = "#8696a4"; g.beginPath(); g.moveTo(x - 2, hz + 8); g.lineTo(x, hz + 8 - s); g.lineTo(x + 2, hz + 8); g.fill(); }
    { const x = w * .56, y = hz + 2; g.fillStyle = "#8a9aa8"; g.fillRect(x - 16, y - 8, 32, 14); g.beginPath(); g.arc(x, y - 8, 13, PI, 0); g.fill(); g.fillRect(x - 1.5, y - 30, 3, 10); }
    for (let i = 0; i < 9; i++) { const x = r() * w; for (let k = 0; k < 6; k++) blob(g, x + k * 6, hz - 2 - k * 6, 6 + k * 2, 4 + k, "rgba(190,196,204,.35)"); }
    const ne = g.createLinearGradient(0, hz - 30, 0, hz + 30); ne.addColorStop(0, "rgba(212,226,234,0)"); ne.addColorStop(.6, "rgba(212,226,234,.45)"); ne.addColorStop(1, "rgba(200,214,220,.2)"); g.fillStyle = ne; g.fillRect(0, hz - 30, w, 60);
    const fe = g.createLinearGradient(0, hz + 22, 0, h); fe.addColorStop(0, "#9aaa98"); fe.addColorStop(.4, "#7e9670"); fe.addColorStop(1, "#6c8458"); g.fillStyle = fe; g.fillRect(0, hz + 22, w, h);
    for (let i = 0; i < 70; i++) { const x = r() * w, y = hz + 26 + Math.pow(r(), .7) * (h - hz - 30); wblob(g, w, h, x, y, 8 + (y - hz) * .12, 5 + (y - hz) * .07, `rgba(${50 + r() * 20},${70 + r() * 20},${44},.6)`); }
    for (let i = 0; i < 18; i++) { const y = hz + 30 + r() * (h - hz - 40); g.strokeStyle = "rgba(110,130,90,.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (r() - .5) * 20); g.stroke(); } }),
  bretter: () => ctex(512, 512, "k2-bretter", (g, w, h, r) => bohlen(g, w, h, r, {n: 9, holz: [34, 12, 52]}), [1, 1])
};

/* ---------- Gelände außerhalb des Raums: Wiese steigt seitlich sanft an, vorn fällt der Hügel ab ---------- */
function hoehe(x, z){
  const ax = Math.abs(x), sx = Math.max(0, ax - 9), sb = Math.max(0, z - 12.5), sf = Math.max(0, -13 - z);
  // seitlich deutliche, gewellte Hügel (über Zaun und Schautafeln sichtbar); vorn ein Tal zwischen ihnen, durch das man auf die Stadt sieht
  let y = sx * .3 + (Math.sin(z * .09 + (x > 0 ? 1 : 3)) * .6 + Math.sin(z * .23 + x * .05) * .4) * Math.min(1, sx / 6) * 2.6 + sb * .14;
  if (sf) y -= Math.min(11, sf * sf * .045) * Math.max(0, 1 - sx / 18);
  return ax < 8.6 && Math.abs(z) < 11.6 ? -.04 : y - .04;
}
function gelaende(A){
  const N = 64, L = 150, g = new T3.PlaneGeometry(L, L, N, N).rotateX(-PI / 2), p = g.attributes.position, c = new Float32Array(p.count * 3), r = U.seeded(2203);
  const haze = new T3.Color(0x93a68a), gr = new T3.Color(), k0 = new T3.Color(0xffffff);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = hoehe(x, z); p.setY(i, y); const d = Math.hypot(x, z + 4);
    gr.copy(k0).multiplyScalar(.85 + r() * .25 + Math.min(.15, y * .02)); gr.lerp(haze, Math.min(1, Math.max(0, (d - 26) / 40))); c.set([gr.r, gr.g, gr.b], i * 3); }
  g.setAttribute("color", new T3.BufferAttribute(c, 3)); g.computeVertexNormals(); U.scaleUV(g, L / 2.4, L / 2.4);
  const m = A.mesh(g, mt("k2-gelaende", () => S({map: TX.gras(), vertexColors: true, roughness: 1})), {receive: true}); m.userData.noPick = true; return m;
}

/* ---------- Hülle ---------- */
function huegel(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ, r = U.seeded(4711), lamps = A.hu.lampen;
  A.hu.deckeY = () => H;   // Hängendes nur unter den Ästen (Belegung oben)
  A.boden(mt("k2-boden", () => S({map: TX.gras(), roughness: 1})), 2.4);
  { const w = 3.4, pg = new T3.PlaneGeometry(w, 22.6).rotateX(-PI / 2); U.scaleUV(pg, 1, 22.6 / 3.4);
    const pm = A.mesh(pg, mt("k2-kies", () => S({map: TX.kies(), transparent: true, depthWrite: false, roughness: .95, polygonOffset: true, polygonOffsetFactor: -2})), {receive: true}); pm.position.set(0, .004, 0); pm.renderOrder = 1; pm.userData.noPick = true; }
  gelaende(A); A17.kuppel(A, "k2", TX.himmel());
  A17.kulisse(A, "k2-stadt", TX.stadt(), {r: 62, a0: -1.3, a1: 1.3, y0: -8.8, hh: 16});

  // Eichen: Hauptast über der Wiese (Unterseite bei 6,5 m über x = 0 bzw. x = ±1,3), Äste nach oben, Laubkronen erst über 7,2 m
  const eiche = (x0, z0, haupt, auf, kr) => { const y0 = hoehe(x0, z0) - .3, sx = Math.sign(x0);
    A17.baum(K, {aeste: [[[[x0, y0, z0], [x0 - sx * .1, y0 + 2.2, z0 - .05], [x0 + sx * .25, 4.4, z0 - .1]], .66, .46, 6], [haupt, .45, .09, 22], ...auf]}, r);
    for (const [x, y, z, rad, n, ymin, s] of kr) A17.krone(K, x, y, z, rad, n, r, ymin, s); };
  eiche(-10.6, 5.6, [[-10.3, 4.0, 5.5], [-7.6, 6.15, 5.3], [-3.6, 6.86, 5.2], [0, 6.72, 5.2], [3.2, 6.95, 5.05], [5.6, 7.7, 4.6]],
    [[[[-10.4, 4.2, 5.6], [-10.0, 6.8, 7.6], [-9.0, 9.0, 9.6], [-8.4, 10.6, 10.8]], .36, .08], [[[-10.5, 4.2, 5.4], [-11.8, 7.2, 4.0], [-12.6, 9.6, 2.6]], .34, .08], [[[-7.6, 6.15, 5.3], [-6.0, 7.6, 3.6], [-4.6, 8.6, 2.3]], .16, .05]],
    [[5.6, 7.9, 4.6, 1.6, 12, 7.3], [2.0, 7.7, 5.0, 1.5, 9, 7.35], [-2.2, 7.8, 5.2, 1.6, 10, 7.4], [-4.6, 8.8, 2.3, 1.7, 12, 7.6], [-8.4, 10.6, 10.8, 2.6, 22], [-12.6, 9.8, 2.6, 2.7, 22], [-10.6, 9.0, 6.0, 3.0, 28, 7.6, 2.2]]);
  eiche(10.8, -1.2, [[10.4, 4.3, -1.3], [6.8, 6.75, -1.45], [2.6, 6.98, -1.5], [0, 6.76, -1.5], [-2.6, 7.0, -1.48], [-5.6, 7.9, -1.2]],
    [[[[10.6, 4.5, -1.2], [11.4, 7.6, -3.0], [11.8, 10.0, -4.6]], .4, .08], [[[10.5, 4.4, -1.1], [10.0, 7.4, 1.2], [9.4, 9.6, 2.6]], .36, .08], [[[6.8, 6.75, -1.45], [5.4, 8.2, -3.2], [4.0, 9.0, -4.4]], .17, .05]],
    [[-5.6, 8.1, -1.2, 1.6, 11, 7.4], [-1.8, 7.8, -1.5, 1.5, 9, 7.5], [2.4, 7.9, -1.6, 1.6, 9, 7.5], [4.0, 9.1, -4.4, 1.8, 13, 7.6], [11.8, 10.2, -4.6, 2.8, 24], [9.4, 9.8, 2.6, 2.6, 22], [10.8, 9.2, -1.0, 3.0, 28, 7.6, 2.2]]);
  eiche(-10.7, -7.6, [[-10.3, 4.0, -7.5], [-6.6, 6.5, -7.3], [-2.2, 6.9, -7.2], [0, 6.73, -7.2], [2.8, 6.98, -7.1], [5.2, 7.8, -6.6]],
    [[[[-10.5, 4.2, -7.4], [-11.5, 7.4, -9.4], [-12.0, 9.8, -10.8]], .36, .08], [[[-10.4, 4.2, -7.6], [-9.6, 7.6, -5.2], [-9.0, 9.8, -3.6]], .34, .08], [[[-6.6, 6.5, -7.3], [-5.2, 8.2, -9.0], [-4.0, 9.2, -10.0]], .16, .05]],
    [[5.2, 8.0, -6.6, 1.6, 11, 7.3], [1.8, 7.8, -7.1, 1.5, 9, 7.4], [-2.4, 7.9, -7.2, 1.6, 10, 7.4], [-4.0, 9.3, -10.0, 1.8, 12, 7.6], [-12.0, 10.0, -10.8, 2.7, 22], [-9.0, 10.0, -3.6, 2.6, 22], [-10.7, 9.0, -7.4, 3.0, 28, 7.6, 2.2]]);
  // eiserne Haken: das Schild (x ±1,3) und die Federleuchten hängen am Ast
  for (const [x, z, y1] of [[1.3, -1.5, 6.62], [-1.3, -1.5, 6.62], [0, 5.2, 6.56], [0, -7.2, 6.56]]) { K.add("eisen", new T3.CylinderGeometry(.016, .016, y1 - H + .03, 6), M(x, (y1 + H - .03) / 2, z)); K.add("eisen", new T3.TorusGeometry(.05, .014, 4, 10), M(x, y1 - .02, z, 0, PI / 2, 0)); }
  for (const z of [5.2, -1.5, -7.2]) A.belege({x0: -8, x1: 8, y0: 6.0, y1: H + .3, z0: z - .6, z1: z + .6});
  // Bäume in der Ferne (auf dem Gelände)
  for (const [x, z, s] of [[-17, 13, 1], [-23, -2, 1.2], [-16, -17, .9], [-30, 9, 1.3], [17, 11, 1.1], [22, -6, 1.2], [15, -19, .9], [29, 4, 1.3], [-8, 21, 1], [7, 23, 1.1], [-2, 31, 1.3], [-12, -25, 1], [13, -28, 1.1], [-26, -21, 1.2], [26, -19, 1]]) {
    const y0 = hoehe(x, z) - .2, ht = 3.6 * s; A17.baum(K, {aeste: [[[[x, y0, z], [x + .2, y0 + ht * .6, z], [x - .1, y0 + ht, z + .1]], .38 * s, .2 * s, 5], [[[x, y0 + ht * .55, z], [x + 1.4 * s, y0 + ht * 1.2, z + .5]], .14 * s, .05, 4]],
      kronen: [[x, y0 + ht + 1.6 * s, z, 2.6 * s, 18, -99, 2.4 * s], [x + 1.2 * s, y0 + ht + .8 * s, z + .6, 1.6 * s, 8, -99, 2 * s]]}, r); }
  // Lattenzaun an den Seiten und vorn/hinten neben den Toren
  const zr = U.seeded(77);
  A17.latten(K, "zaun", [-8.12, -11.1], [-8.12, 11.1], {r: zr}); A17.latten(K, "zaun", [8.12, 11.1], [8.12, -11.1], {r: zr});
  for (const s of [-1, 1]) { A17.latten(K, "zaun", [s * 8.1, -11.12], [s * 2.62, -11.12], {r: zr}); A17.latten(K, "zaun", [s * 2.62, 11.12], [s * 8.1, 11.12], {r: zr}); }
  // Hecken hinter dem Zaun vorn und hinten
  for (const s of [-1, 1]) for (let x = 3.0; x < 8.2; x += .55) A17.krone(K, s * x, .95, 11.55 + r() * .25, .55, 3, r, .35, 1.2);   // Hecke nur hinten: vorn bleibt der Blick ins Tal frei
  // Schautafeln: je Feld eine Bretterwand auf zwei Pfosten mit Satteldach (die Tafeln des Raums hängen davor bei x = ±7,94)
  for (const s of [-1, 1]) for (const zc of [6.75, 2.25, -2.25, -6.75]) { const x = s * 8.06;
    K.box("bretter", .12, 3.75, 3.7, M(x, 3.68, zc), {uv: [1, 1]}); for (const k of [-1, 1]) { K.box("dunkel", .2, 6.0, .18, M(s * 8.08, 3.0, zc + k * 1.95)); K.box("dunkel", .16, .12, 3.9, M(s * 8.02, 1.8 + (k > 0 ? 3.82 : 0), zc)); }
    for (const k of [-1, 1]) K.box("schindel", .62, .05, 4.3, M(s * 8.06 + k * .26, 5.82, zc, 0, 0, -k * .52)); K.box("dunkel", .1, .1, 4.3, M(s * 8.06, 6.04, zc));
    A.belege({x0: s < 0 ? -8 : 7.55, x1: s < 0 ? -7.55 : 8, y0: 5.6, y1: 6.2, z0: zc - 2.15, z1: zc + 2.15}); }
  // Holztore um die Türen: Pfosten bei x = ±2,45, Riegel ab 6,25 m, kleines Schindeldach, Laternen außen an den Pfosten
  for (const [zW, n] of [[B.z1, 1], [B.z0, -1]]) { const z = zW + n * .02;
    for (const s of [-1, 1]) { K.box("dunkel", .26, 6.6, .26, M(s * 2.48, 3.3, z)); K.box("dunkel", .4, .18, .4, M(s * 2.48, 6.62, z)); K.add("dunkel", new T3.ConeGeometry(.2, .3, 4, 1, false, PI / 4), M(s * 2.48, 6.86, z)); }
    K.box("dunkel", 5.9, .28, .22, M(0, 6.39, z)); K.box("dunkel", 5.2, .1, .14, M(0, 6.58, z));
    for (const k of [-1, 1]) K.box("schindel", 6.3, .05, .5, M(0, 6.82, z + k * .19, k * .5, 0, 0));
    for (const s of [-1, 1]) { const lp = V3(s * 2.86, 4.25, z + n * .15); K.box("eisen", .4, .03, .03, M(s * 2.7, 4.62, z + n * .1)); K.add("glasL", new T3.CylinderGeometry(.12, .09, .3, 4, 1, false, PI / 4), M(lp.x, lp.y, lp.z));
      K.add("eisen", new T3.ConeGeometry(.17, .14, 4, 1, false, PI / 4), M(lp.x, lp.y + .22, lp.z)); K.box("eisen", .015, .2, .015, M(lp.x, lp.y + .38, lp.z)); A.lampe(lp.clone()); } }
  // Laternen und Wegweiser in den Ecken
  for (const [x, z] of [[-7.35, 10.35], [7.35, -10.35]]) { lamps.push(A17.laternenPfahl(K, x, z, {h: 3.4})); A.hindernis(x, z, .5, .5); A.belege({x0: x - .45, x1: x + .45, y0: 0, y1: 3.6, z0: z - .45, z1: z + .45}); }
  { const x = -7.3, z = -10.35; K.box("dunkel", .14, 2.8, .14, M(x, 1.4, z));
    [["London", .4, 2.45], ["Highgate", -.6, 2.1], ["Heath", 2.2, 1.75]].forEach(([, ry, y], i) => { K.box("schild", 1.0, .2, .04, M(x, y, z, 0, ry, 0).multiply(M(.4, 0, 0))); K.add("schild", new T3.ConeGeometry(.12, .16, 3), M(x, y, z, 0, ry, 0).multiply(M(.95, 0, 0, 0, 0, -PI / 2, 1, 1, .3))); });
    A.hindernis(x, z, .4, .4); A.belege({x0: x - 1.1, x1: x + 1.1, y0: 0, y1: 2.9, z0: z - .7, z1: z + .7}); }
  // Drachen am Himmel (schwingen sanft an ihren Schnüren)
  [[-6, 15, -30, 0, "#b8261c", "#f0d860"], [9, 18.5, -40, 1.7, "#24508a", "#f2efe4"]].forEach(([x, y, z, ph, c1, c2]) => {
    const g = new T3.Group(); g.position.set(x, y, z); G.add(g); const D = H_.bucket(), Q = (a, b) => D.add("v", a, b.m || M(), {c: b.c});
    const dg = (s) => { const q = new T3.BufferGeometry(); q.setAttribute("position", new T3.Float32BufferAttribute([0, 1.1 * s, 0, -.7 * s, .25 * s, 0, 0, -1.3 * s, 0, 0, 1.1 * s, 0, 0, -1.3 * s, 0, .7 * s, .25 * s, 0], 3)); q.computeVertexNormals(); return q; };
    Q(dg(1), {c: c1}); Q(dg(.55), {c: c2, m: M(0, -.1, .01)});
    for (let i = 0; i < 7; i++) Q(new T3.BoxGeometry(.28, .08, .02), {c: i % 2 ? c1 : c2, m: M(Math.sin(i * .9) * .3, -1.5 - i * .32, 0, 0, 0, i % 2 ? .6 : -.6)});
    Q(new T3.CylinderGeometry(.012, .012, 40, 3).translate(0, -20, 0), {c: "#e8e4d8", m: M(0, -.3, 0, -.55, 0, .25)});
    const me = D.mesh("v", R17.ST.vc(), {parent: g, color: true}); me.userData.noPick = true;
    ctx.tick((dt, t) => { g.rotation.z = Math.sin(t * .45 + ph) * .12; g.rotation.y = Math.sin(t * .3 + ph) * .25; g.position.y = y + Math.sin(t * .37 + ph) * .5; }); });

  A.fertig([["rinde", A17.MA.rinde, {cast: true}], ["laub", A17.MA.laub, {cast: true}], ["zaun", () => mt("k2-zaun", () => S({color: 0xa49c8c, roughness: .9}))],
    ["bretter", () => mt("k2-bretter", () => S({map: TX.bretter(), roughness: .9}))], ["dunkel", () => mt("k2-dunkel", () => S({map: tex.wood(true), color: 0x8a7a6a, roughness: .85})), {cast: true}],
    ["schindel", () => mt("k2-schindel", () => S({color: 0x4a4440, roughness: .9}))], ["schild", () => mt("k2-schild", () => S({color: 0xe8dcc0, roughness: .7}))],
    ["eisen", A17.MA.eisen], ["glasL", A17.MA.glasL], ["flamme", A17.MA.flamme]]);
  A.halos(lamps, 0xffe0a8, .45);
  return {punkt: [[0xfff0d8, 3.2, 14, -6.6, 4.4, 2.25], [0xfff0d8, 3.2, 14, 6.6, 4.4, -2.25], [0xffe6c4, 2.4, 12, 0, 5.2, -8.5]]};
}

/* ---------- Ausstattung ---------- */
function parkbank(D, C){ const {bx, rod} = D;
  for (const s of [-1, 1]) { const X = s * .86; rod("iron", C, [X, 0, .2], [X, .44, .17], .022); rod("iron", C, [X, 0, -.2], [X, .44, -.17], .022); rod("iron", C, [X, .44, .21], [X, .44, -.22], .02);
    rod("iron", C, [X, .44, -.2], [X, .95, -.33], .022); rod("iron", C, [X, .64, .2], [X, .64, -.12], .018); rod("iron", C, [X, .44, .2], [X, .64, .2], .018); }
  for (let i = 0; i < 4; i++) bx("wood", 1.92, .03, .085, C.m(0, .465, .17 - i * .11));
  for (let i = 0; i < 3; i++) bx("wood", 1.92, .085, .028, C.m(0, .6 + i * .12, -.23 - i * .026, -.21)); }
function picknick(D, F){ const {bx, cy, sp, tor} = D;
  bx("vc", 1.5, .012, 1.1, F.m(0, .006, .7), "#8a2a22"); for (let i = 0; i < 5; i++) bx("vc", 1.5, .013, .05, F.m(0, .0065, .27 + i * .21), "#e4d4a8"); for (let j = 0; j < 6; j++) bx("vc", .05, .0135, 1.1, F.m(-.65 + j * .26, .007, .7), "#e4d4a8");
  cy("vc", .2, .16, .2, 12, F.m(.42, .1, .55), "#a07840"); bx("vc", .36, .03, .3, F.m(.42, .215, .55, 0, .2, .25), "#8a6434"); tor("vc", .15, .012, 4, 12, F.m(.42, .21, .55), "#6a4a24", PI);
  cy("glass", .035, .035, .22, 10, F.m(-.3, .11, .45)); cy("vc", .033, .033, .12, 8, F.m(-.3, .07, .45), "#3a6a2a"); for (const [x, z] of [[-.1, .8], [-.02, .86], [.08, .78]]) sp("vc", .035, 8, 6, F.m(x, .035, z), "#b8261c");
  for (const x of [-.45, .1]) cy("vc", .1, .1, .012, 14, F.m(x, .012, .95), "#f2ede0"); bx("vc", .2, .03, .14, F.m(-.5, .02, .78, 0, .3, 0), "#2a3a5a"); }
function schubkarre(D, C){ const {bx, rod, tor, cy, sp} = D;
  bx("wood", .7, .04, .52, C.m(-.05, .42, 0)); for (const s of [-1, 1]) bx("wood", .72, .22, .03, C.m(-.05, .53, s * .27, s * .18)); bx("wood", .03, .24, .55, C.m(.3, .52, 0, 0, 0, -.35)); bx("wood", .03, .2, .55, C.m(-.4, .5, 0));
  tor("iron", .2, .025, 6, 16, C.m(.55, .2, 0)); for (let i = 0; i < 6; i++) rod("wood", C, [.55, .2, 0], [.55 + Math.cos(i * PI / 3) * .18, .2 + Math.sin(i * PI / 3) * .18, 0], .012, 4); cy("iron", .02, .02, .14, 6, C.m(.55, .2, 0, PI / 2));
  for (const s of [-1, 1]) { rod("wood", C, [.55, .2, s * .07], [-.95, .55, s * .27], .025, 5); rod("wood", C, [-.3, .4, s * .25], [-.3, 0, s * .27], .02, 4); }
  for (let i = 0; i < 6; i++) sp("vc", .1 + (i % 3) * .02, 8, 6, C.m(-.25 + (i % 3) * .2, .5, -.12 + (i >> 1) % 2 * .22, 0, 0, 0, 1.2, .6, 1), "#7a5a3a"); }
function heu(D, F){ D.cy("vc", .72, .78, .35, 14, F.m(0, .175, .75), "#b8984c"); D.cone("vc", .74, 1.15, 14, F.m(0, .92, .75), "#c8a858"); D.sp("vc", .2, 8, 6, F.m(0, 1.48, .75, 0, 0, 0, 1, .6, 1), "#a8883c");
  D.rod("wood", F, [.75, 0, .2], [.62, 1.55, .5], .015, 5); for (let k = -1; k <= 1; k++) D.rod("iron", F, [.62 + k * .04, 1.55, .5], [.61 + k * .05, 1.78, .52], .005, 4); }
function ausstattung(D){
  R17.dekorMat(D); const C = D.COMP;
  C.t_bank = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.05, .72, true)], build: F => parkbank(D, D.subF(F, 0, .38))});
  C.t_picknick = (w, a) => ({b: [D.q(w, a, -.85, .85, 0, .5, 1.3, true)], build: F => picknick(D, F)});
  C.t_karre = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, .9, .7, true)], build: F => schubkarre(D, D.subF(F, 0, .38, .1))});
  C.t_rad = (w, a) => ({b: [D.q(w, a, -.7, 1.1, 0, 1.6, .74, true)], build: F => D.pennyFarthing(F, .1)});
  C.t_heu = (w, a) => ({b: [D.q(w, a, -.9, .9, 0, 1.85, 1.55, true)], build: F => heu(D, F)});
  moebel(D, felder(D), ["t_bank", "t_picknick", "t_karre", "t_bank", "t_rad", "t_heu", "t_bank", "t_picknick"], 7, ["t_bank"]);
  // vorn und hinten neben den Toren: Bank und Heuhaufen, wenn Platz ist
  const {WL} = D.st();
  for (const [s, x, kind] of [["back", -5.3, "t_bank"], ["back", 5.4, "t_heu"], ["front", -6.2, "t_heu"], ["front", 6.0, "t_bank"]]) { const w = WL[s], c = C[kind](w, x); if (D.claim(...c.b)) c.build(D.FW(w, x)); }
}

KIT.raum.kraft2 = {titel: "Hügel von Hampstead", pult: true,   // Stationen als Stehpult mit Laterne statt Schreibtisch (12_detektiv.js)
  licht: {bg: 0x9cc0e4, nebel: 0xcfdde6, dichte: .011, envTex: () => TX.env(), himmel: [0xd8ecff, 0x6e8e48, 1.15], umgebung: [0xfff8ee, .22], sonne: [0xfff2d6, 2.1, [6, 18, 9]], fuell: [0xd0e0ff, .55, [-8, 10, -12]]},
  huelle: huegel, ausstattung,
  stimmung: {staub: {farbe: 0xfff4c8, n: 70, groesse: .035},
    boden: {n: 2, mat: () => mt("k2-dunst0", () => KB({map: tex.fog(), color: 0xf0f4f0, transparent: true, opacity: .05, depthWrite: false, side: T3.DoubleSide}))},
    dunst: {n: 2, mat: () => mt("k2-dunst1", () => KB({map: tex.fog(), color: 0xf4f8fa, transparent: true, opacity: .04, depthWrite: false, side: T3.DoubleSide}))}}};
})();
