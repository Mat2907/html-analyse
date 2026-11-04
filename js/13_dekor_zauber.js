/* ---------- 13_dekor_zauber.js ---------- */
/* =====================================================================
   Ausstattung der Zauberschule (kit.decor, siehe RAUM-API.md „Ausstattung eines Weltstils“)
   Bücherregale mit Lederbüchern, Tränkeregale mit leuchtenden Flaschen, Kommoden mit Sanduhren, Kristallkugeln und Leuchtern,
   Gemälde in Goldrahmen und Wandteppiche mit Wappentieren (alles mit Canvas gemalt, ein Textur-Atlas), Samtvorhänge mit Raffhaltern,
   Ritterrüstungen, Standleuchter, Globus, Armillarsphäre, Kessel, Kronleuchter, schwebende Bücher mit umblätternden Seiten und Kristallkugeln.
   Je Raum ein Thema: Strom (Gewitterkristalle in Gläsern, Funken, Gewitterkugel), Optik (Spiegel, Linsen, Prismen, Fernrohr),
   Bewegung (Sanduhren, Pendel, Standuhr, Besen), Kräfte (Balkenwaage, Gewichte, Flaschenzug, schwebende Felsen). Die Halle wird festlich.
   Jedes Teil nimmt nur einen Platz, den ctx.frei() meldet; die Bauteile der Raumhülle (Säulen, Bögen, Fackeln, Fenster, Banner, Balken,
   schwebende Kerzen) belegt die Ausstattung vorher selbst. Teile je Material zu einem Mesh verschmolzen, Wiederholungen als InstancedMesh,
   keine Schatten, keine Lichter; Zufall reproduzierbar (je Raum ein eigener Startwert).
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.util || !R3D.kits || !R3D.kits.zauber || !R3D.kits.zauber.tex) return;
const U = R3D.util, KIT = R3D.kits.zauber, PI = Math.PI;
/* ---------- Textur-Atlas (1024²): Buchrücken, Globus, Papier, Gemälde, Wandteppiche, Themenbilder ---------- */
const AW = 1024, IN = 2;
const R = (x, y, w, h) => [(x + IN) / AW, 1 - (y + h - IN) / AW, (x + w - IN) / AW, 1 - (y + IN) / AW];   // u0, v0, u1, v1 (Canvas-y nach unten)
const LEDER = ["#6e1b1b", "#1f4b2e", "#1e305e", "#5c3a1d", "#4b2462", "#2a231d", "#1e5552", "#8c6a22", "#7c2b3d", "#33421d", "#3c4855", "#9a7448"];
const A = {spine: [], cover: [], globe: R(768, 0, 256, 128), pages: R(768, 128, 64, 128), white: R(842, 140, 44, 104), parch: R(896, 128, 128, 128),
  bild: {zauberer: R(0, 256, 192, 256), hexe: R(192, 256, 192, 256), burg: R(384, 256, 320, 256), berge: R(704, 256, 320, 256),
    sterne: R(0, 512, 256, 256), still: R(256, 512, 192, 256), drache: R(448, 512, 320, 256), schiff: R(768, 512, 256, 256)},
  tep: [R(0, 768, 128, 256), R(128, 768, 128, 256), R(256, 768, 128, 256), R(384, 768, 128, 256)],
  thema: {strom: R(512, 768, 128, 256), optik: R(640, 768, 128, 256), beweg: R(768, 768, 128, 256), kraft: R(896, 768, 128, 256)}};
for (let i = 0; i < 12; i++) { A.spine.push(R(i * 64, 0, 64, 256)); A.cover.push(R(i * 64 + 22, 112, 20, 32)); }
// Seitenverhältnis (Breite : Höhe) der Bilder
const ASP = {zauberer: .75, hexe: .75, burg: 1.25, berge: 1.25, sterne: 1, still: .75, drache: 1.25, schiff: 1, tep: .5, thema: .5};

function area(g, x, y, w, h, fn){ g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y); fn(g, w, h); g.restore(); }
function lin(g, x0, y0, x1, y1, stops){ const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function rad(g, x, y, r0, r1, stops){ const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function glowDot(g, x, y, r, col){ g.fillStyle = rad(g, x, y, 0, r, [[0, col], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function poly(g, pts, fill){ g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fillStyle = fill; g.fill(); }
function speckle(g, w, h, n, a, cols, rnd){ for (let i = 0; i < n; i++) { g.globalAlpha = a * rnd(); g.fillStyle = cols[(rnd() * cols.length) | 0]; const s = .6 + rnd() * 1.6; g.fillRect(rnd() * w, rnd() * h, s, s); } g.globalAlpha = 1; }
function stars(g, x0, y0, w, h, n, rnd, max = 1.6){ for (let i = 0; i < n; i++) { g.globalAlpha = .35 + rnd() * .65; g.fillStyle = rnd() < .2 ? "#ffe9b0" : "#ffffff"; const s = .5 + rnd() * max; g.fillRect(x0 + rnd() * w, y0 + rnd() * h, s, s); } g.globalAlpha = 1; }
function mountains(g, w, base, amp, col, rnd, n = 9, snow){ const pts = [0, base]; const xs = []; for (let i = 0; i <= n; i++) { const x = i / n * w + (rnd() - .5) * w / n * .6, y = base - amp * (.35 + rnd() * .65); pts.push(x, y); xs.push([x, y]); }
  pts.push(w, base + 60, 0, base + 60); poly(g, pts, col);
  if (snow) for (const [x, y] of xs) if (y < base - amp * .6) poly(g, [x, y, x - 9, y + 11, x - 3, y + 9, x + 2, y + 13, x + 9, y + 10], snow); }
function firnis(g, w, h, rnd){   // Firnis: warmer Ton, dunkle Ränder, feine Risse
  g.fillStyle = "rgba(255,200,120,.07)"; g.fillRect(0, 0, w, h);
  g.fillStyle = rad(g, w / 2, h / 2, Math.min(w, h) * .3, Math.max(w, h) * .75, [[0, "rgba(0,0,0,0)"], [1, "rgba(10,5,0,.55)"]]); g.fillRect(0, 0, w, h);
  speckle(g, w, h, w * h / 60, .08, ["#000", "#fff3d0"], rnd);
  g.strokeStyle = "rgba(20,10,0,.12)"; g.lineWidth = .7;
  for (let i = 0; i < 14; i++) { let x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - .5) * 26; y += (rnd() - .5) * 26; g.lineTo(x, y); } g.stroke(); }
}
function star4(g, x, y, r, col){ g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * .28, y - r * .28); g.lineTo(x + r, y); g.lineTo(x + r * .28, y + r * .28); g.lineTo(x, y + r); g.lineTo(x - r * .28, y + r * .28); g.lineTo(x - r, y); g.lineTo(x - r * .28, y - r * .28); g.closePath(); g.fill(); }

/* Buchrücken: Leder mit Rundung, Bünde, Goldlinien, Titelschild */
function spine(g, w, h, i, rnd){
  const c = LEDER[i]; g.fillStyle = c; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 900, .25, ["#000", "#ffffff"], rnd);
  g.fillStyle = lin(g, 0, 0, w, 0, [[0, "rgba(0,0,0,.55)"], [.38, "rgba(255,255,255,.14)"], [.55, "rgba(255,255,255,.05)"], [1, "rgba(0,0,0,.6)"]]); g.fillRect(0, 0, w, h);
  const gold = i % 4 === 3 ? "#e9d7a0" : "#d9a830", style = i % 3;
  const bands = style === 0 ? [34, 84, 172, 222] : style === 1 ? [28, 60, 196, 228] : [44, 120, 212];
  for (const y of bands) { g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, y - 5, w, 10); g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(0, y - 4, w, 3);
    g.fillStyle = gold; g.fillRect(3, y - 8, w - 6, 2); g.fillRect(3, y + 6, w - 6, 2); }
  g.fillStyle = gold; g.fillRect(2, 6, w - 4, 3); g.fillRect(2, h - 9, w - 4, 3);
  if (style !== 2) {   // Titelschild
    const y0 = style === 0 ? 92 : 70, hh = style === 0 ? 34 : 50; g.fillStyle = i % 2 ? "#1b1410" : "#5e1414"; g.fillRect(8, y0, w - 16, hh);
    g.strokeStyle = gold; g.lineWidth = 1.5; g.strokeRect(10, y0 + 2, w - 20, hh - 4); g.fillStyle = gold;
    for (let k = 0; k < (style === 0 ? 2 : 3); k++) g.fillRect(16 + rnd() * 4, y0 + 9 + k * 11, w - 34 - rnd() * 8, 2.4);
  } else { star4(g, w / 2, 82, 9, gold); g.beginPath(); g.arc(w / 2, 165, 9, 0, 7); g.strokeStyle = gold; g.lineWidth = 2; g.stroke(); }
  if (style === 0) { g.fillStyle = gold; g.beginPath(); g.moveTo(w / 2, 186); g.lineTo(w / 2 + 6, 197); g.lineTo(w / 2, 208); g.lineTo(w / 2 - 6, 197); g.closePath(); g.fill(); }
}
/* alter Globus (Plattkarte) */
function globeMap(g, w, h, rnd){
  g.fillStyle = lin(g, 0, 0, 0, h, [[0, "#6f8f86"], [.5, "#4f7a7a"], [1, "#6f8f86"]]); g.fillRect(0, 0, w, h);
  const land = (cx, cy, rx, ry, n) => { g.beginPath(); for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2, r = .7 + rnd() * .45; const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill(); g.stroke(); };
  g.fillStyle = "#cdb07a"; g.strokeStyle = "#5a3e22"; g.lineWidth = 1.2;
  [[40, 40, 26, 20], [62, 78, 16, 26], [120, 34, 34, 18], [134, 70, 18, 22], [190, 46, 30, 22], [212, 92, 16, 12], [96, 108, 40, 7]].forEach(([x, y, a, b]) => land(x, y, a, b, 14));
  g.strokeStyle = "rgba(60,40,20,.35)"; g.lineWidth = .8;
  for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(k * w / 8, 0); g.lineTo(k * w / 8, h); g.stroke(); }
  for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, k * h / 4); g.lineTo(w, k * h / 4); g.stroke(); }
  speckle(g, w, h, 1500, .15, ["#3a2a18", "#f3e3bd"], rnd); g.fillStyle = "rgba(220,180,110,.18)"; g.fillRect(0, 0, w, h);
}
function paperBlock(g, w, h, rnd){ g.fillStyle = "#e9dcbc"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(120,90,50,${.08 + rnd() * .18})`; g.fillRect(x, 0, 1, h); } }
function parchment(g, w, h, rnd){ g.fillStyle = rad(g, w / 2, h / 2, 5, w * .75, [[0, "#f3e6c4"], [1, "#d2b47c"]]); g.fillRect(0, 0, w, h); speckle(g, w, h, 900, .15, ["#8a6a3a", "#fff8e0"], rnd);
  g.fillStyle = "rgba(70,40,20,.45)"; for (let y = 18; y < h - 14; y += 9) { let x = 12; while (x < w - 16) { const l = 6 + rnd() * 16; g.fillRect(x, y, Math.min(l, w - 12 - x), 1.6); x += l + 4; } } }

/* Gemälde */
function pZauberer(g, w, h, rnd){
  g.fillStyle = lin(g, 0, 0, 0, h, [[0, "#22332f"], [1, "#0b1210"]]); g.fillRect(0, 0, w, h);
  g.fillStyle = "#0e1836"; g.beginPath(); g.moveTo(122, 128); g.lineTo(122, 52); g.arc(150, 52, 28, Math.PI, 0); g.lineTo(178, 128); g.closePath(); g.fill();
  stars(g, 124, 26, 52, 98, 26, rnd, 1.2); glowDot(g, 162, 42, 16, "rgba(255,240,200,.45)"); g.fillStyle = "#fff3cf"; g.beginPath(); g.arc(162, 42, 6, 0, 7); g.fill();
  g.strokeStyle = "#3b2c1c"; g.lineWidth = 4; g.beginPath(); g.moveTo(122, 128); g.lineTo(122, 52); g.arc(150, 52, 28, Math.PI, 0); g.lineTo(178, 128); g.closePath(); g.moveTo(150, 24); g.lineTo(150, 128); g.stroke();
  // Gewand
  g.fillStyle = lin(g, 20, 0, 170, 0, [[0, "#10163a"], [.45, "#2d3d8e"], [1, "#121842"]]);
  g.beginPath(); g.moveTo(64, 126); g.quadraticCurveTo(96, 110, 128, 126); g.quadraticCurveTo(150, 170, 170, h); g.lineTo(22, h); g.quadraticCurveTo(42, 170, 64, 126); g.fill();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; for (const x of [60, 80, 116, 134]) { g.beginPath(); g.moveTo(x + (x - 96) * .1, 150); g.quadraticCurveTo(x, 200, x + (x - 96) * .5, h); g.stroke(); }
  g.strokeStyle = "#d9a520"; g.lineWidth = 3; g.beginPath(); g.moveTo(96, 132); g.lineTo(96, h); g.stroke();
  for (let k = 0; k < 9; k++) star4(g, 40 + rnd() * 112, 160 + rnd() * 90, 3 + rnd() * 2, "rgba(233,190,80,.85)");
  // Kopf und Bart
  g.fillStyle = rad(g, 92, 96, 3, 22, [[0, "#f0c49a"], [1, "#b98058"]]); g.beginPath(); g.ellipse(96, 100, 15, 19, 0, 0, 7); g.fill();
  g.fillStyle = "#2a1a10"; g.fillRect(88, 96, 4, 2); g.fillRect(101, 96, 4, 2);
  g.fillStyle = lin(g, 0, 104, 0, 182, [[0, "#ece8df"], [1, "#a9a49a"]]); g.beginPath(); g.moveTo(80, 102); g.quadraticCurveTo(96, 120, 112, 102); g.quadraticCurveTo(114, 150, 96, 184); g.quadraticCurveTo(78, 150, 80, 102); g.fill();
  g.fillStyle = "#d8d3c9"; g.fillRect(85, 92, 9, 2.5); g.fillRect(99, 92, 9, 2.5);
  // Hut
  g.fillStyle = "#1a2460"; g.beginPath(); g.moveTo(72, 84); g.quadraticCurveTo(84, 46, 94, 24); g.quadraticCurveTo(108, 6, 132, 16); g.quadraticCurveTo(110, 28, 110, 52); g.lineTo(121, 84); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.moveTo(80, 84); g.quadraticCurveTo(88, 50, 96, 28); g.lineTo(100, 30); g.quadraticCurveTo(94, 56, 92, 84); g.fill();
  g.fillStyle = "#c8962a"; g.beginPath(); g.moveTo(73, 80); g.lineTo(120, 80); g.lineTo(117, 70); g.lineTo(76, 70); g.closePath(); g.fill();
  g.fillStyle = "#151d50"; g.beginPath(); g.ellipse(96, 84, 42, 9, 0, 0, 7); g.fill();
  star4(g, 100, 46, 5, "#e3b341"); star4(g, 88, 62, 3, "#e3b341");
  // Stab mit leuchtender Kugel
  g.strokeStyle = "#5a3a1e"; g.lineWidth = 5; g.beginPath(); g.moveTo(152, 74); g.lineTo(146, h); g.stroke();
  glowDot(g, 153, 64, 34, "rgba(150,225,255,.75)"); g.fillStyle = "#eaffff"; g.beginPath(); g.arc(153, 64, 7, 0, 7); g.fill();
  g.fillStyle = "#e0b088"; g.beginPath(); g.ellipse(148, 152, 8, 10, 0, 0, 7); g.fill();
  firnis(g, w, h, rnd);
}
function pHexe(g, w, h, rnd){
  g.fillStyle = lin(g, 0, 0, w, h, [[0, "#3a1418"], [1, "#12070a"]]); g.fillRect(0, 0, w, h);
  for (let k = 0; k < 3; k++) { const y = 30 + k * 52; g.fillStyle = "rgba(60,30,15,.8)"; g.fillRect(0, y + 40, 60, 5);
    let x = 2; while (x < 56) { const bw = 4 + rnd() * 5, bh = 24 + rnd() * 14; g.fillStyle = LEDER[(rnd() * 12) | 0]; g.globalAlpha = .55; g.fillRect(x, y + 40 - bh, bw, bh); x += bw + 1; } g.globalAlpha = 1; }
  // Kerze rechts
  glowDot(g, 166, 92, 40, "rgba(255,190,90,.5)"); g.fillStyle = "#efe2c4"; g.fillRect(160, 104, 12, 46); g.fillStyle = "#ffd27a"; g.beginPath(); g.ellipse(166, 96, 4, 8, 0, 0, 7); g.fill();
  // Haar
  g.fillStyle = "#3a2214"; g.beginPath(); g.moveTo(70, 90); g.quadraticCurveTo(60, 150, 52, 190); g.lineTo(140, 190); g.quadraticCurveTo(132, 150, 122, 90); g.closePath(); g.fill();
  // Gewand
  g.fillStyle = lin(g, 20, 0, 170, 0, [[0, "#2a1038"], [.5, "#5a2a78"], [1, "#24102f"]]);
  g.beginPath(); g.moveTo(62, 140); g.quadraticCurveTo(96, 122, 130, 140); g.quadraticCurveTo(156, 190, 168, h); g.lineTo(24, h); g.quadraticCurveTo(36, 190, 62, 140); g.fill();
  g.fillStyle = "#e3b341"; g.beginPath(); g.arc(96, 140, 5, 0, 7); g.fill();
  // Gesicht
  g.fillStyle = rad(g, 92, 104, 3, 22, [[0, "#f3cfae"], [1, "#c48d68"]]); g.beginPath(); g.ellipse(96, 108, 15, 19, 0, 0, 7); g.fill();
  g.fillStyle = "#2a1a10"; g.fillRect(88, 104, 5, 2); g.fillRect(100, 104, 5, 2); g.fillStyle = "#a0453a"; g.fillRect(92, 118, 9, 2);
  // Hut mit breiter Krempe
  g.fillStyle = "#24102f"; g.beginPath(); g.ellipse(96, 88, 52, 11, -.05, 0, 7); g.fill();
  g.beginPath(); g.moveTo(70, 88); g.quadraticCurveTo(86, 50, 90, 20); g.quadraticCurveTo(98, 8, 112, 22); g.quadraticCurveTo(100, 34, 106, 54); g.lineTo(124, 88); g.closePath(); g.fill();
  g.fillStyle = "#7a3a2a"; g.beginPath(); g.moveTo(72, 84); g.lineTo(122, 84); g.lineTo(119, 74); g.lineTo(75, 74); g.closePath(); g.fill();
  g.fillStyle = "#e3b341"; g.fillRect(92, 74, 10, 10); g.fillStyle = "#7a3a2a"; g.fillRect(95, 77, 4, 4);
  // offenes Buch mit Funken
  g.fillStyle = "#4a1a12"; g.beginPath(); g.moveTo(52, 206); g.lineTo(96, 214); g.lineTo(140, 206); g.lineTo(140, 222); g.lineTo(96, 230); g.lineTo(52, 222); g.closePath(); g.fill();
  g.fillStyle = "#f1e4c2"; g.beginPath(); g.moveTo(56, 200); g.quadraticCurveTo(76, 196, 96, 208); g.quadraticCurveTo(116, 196, 136, 200); g.lineTo(136, 214); g.quadraticCurveTo(116, 210, 96, 222); g.quadraticCurveTo(76, 210, 56, 214); g.closePath(); g.fill();
  glowDot(g, 96, 190, 36, "rgba(255,230,150,.55)"); for (let k = 0; k < 10; k++) star4(g, 70 + rnd() * 52, 150 + rnd() * 46, 1.5 + rnd() * 2.5, "rgba(255,240,190,.9)");
  firnis(g, w, h, rnd);
}
function pBurg(g, w, h, rnd){
  g.fillStyle = lin(g, 0, 0, 0, h, [[0, "#0a1032"], [.5, "#2a2f6a"], [.72, "#6a4a7a"], [.82, "#b97a6a"]]); g.fillRect(0, 0, w, h);
  stars(g, 0, 0, w, h * .55, 140, rnd); glowDot(g, 238, 58, 70, "rgba(255,236,190,.35)"); g.fillStyle = "#fff4d6"; g.beginPath(); g.arc(238, 58, 22, 0, 7); g.fill();
  g.fillStyle = "rgba(180,170,150,.25)"; g.beginPath(); g.arc(231, 52, 5, 0, 7); g.arc(246, 66, 4, 0, 7); g.fill();
  mountains(g, w, 196, 52, "#262a58", rnd, 8); mountains(g, w, 206, 30, "#1b1d40", rnd, 11);
  g.fillStyle = "#11122a"; g.beginPath(); g.moveTo(0, 214); g.quadraticCurveTo(70, 206, 104, 168); g.quadraticCurveTo(140, 146, 186, 170); g.quadraticCurveTo(230, 204, 320, 212); g.lineTo(320, 256); g.lineTo(0, 256); g.fill();
  // Burg
  g.fillStyle = "#0d0d1f"; g.fillRect(118, 104, 52, 60); g.fillRect(100, 116, 18, 48); g.fillRect(170, 110, 18, 54); g.fillRect(146, 76, 12, 40);
  for (let x = 118; x < 170; x += 8) g.fillRect(x, 98, 5, 7);
  poly(g, [97, 117, 109, 86, 121, 117], "#151432"); poly(g, [167, 111, 179, 76, 191, 111], "#151432"); poly(g, [143, 77, 152, 46, 161, 77], "#151432");
  g.fillStyle = "#ffd27a"; g.shadowColor = "#ffb84a"; g.shadowBlur = 8;
  [[126, 118], [140, 132], [156, 118], [106, 130], [176, 124], [150, 90], [130, 146], [160, 146]].forEach(([x, y]) => g.fillRect(x, y, 4, 6)); g.shadowBlur = 0;
  // See mit Spiegelung
  g.fillStyle = lin(g, 0, 222, 0, 256, [[0, "#1c1f48"], [1, "#07081a"]]); g.fillRect(0, 222, w, 34);
  for (let k = 0; k < 12; k++) { g.fillStyle = `rgba(255,240,200,${.5 - k * .035})`; const ww = 18 - k + rnd() * 8; g.fillRect(238 - ww / 2 + (rnd() - .5) * 6, 226 + k * 2.6, ww, 1.3); }
  for (let k = 0; k < 14; k++) { const x = rnd() * w; poly(g, [x, 222, x + 4, 206 - rnd() * 8, x + 8, 222], "#090918"); }
  firnis(g, w, h, rnd);
}
function pBerge(g, w, h, rnd){
  g.fillStyle = lin(g, 0, 0, 0, h * .8, [[0, "#2b2d6e"], [.45, "#b4587a"], [.75, "#f2a35e"], [1, "#ffd890"]]); g.fillRect(0, 0, w, h);
  glowDot(g, 168, 168, 80, "rgba(255,230,160,.6)"); g.fillStyle = "#fff2c0"; g.beginPath(); g.arc(168, 168, 20, 0, 7); g.fill();
  for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${200 + rnd() * 50},${110 + rnd() * 60},${140 + rnd() * 40},.45)`; g.beginPath(); g.ellipse(rnd() * w, 40 + rnd() * 80, 30 + rnd() * 40, 5 + rnd() * 5, 0, 0, 7); g.fill(); }
  mountains(g, w, 182, 88, "#6a5a8e", rnd, 7, "rgba(255,240,240,.85)"); mountains(g, w, 192, 58, "#463a68", rnd, 9, "rgba(240,230,250,.7)"); mountains(g, w, 200, 26, "#2a2442", rnd, 12);
  g.fillStyle = lin(g, 0, 200, 0, 256, [[0, "#c78a7a"], [.3, "#6a4a78"], [1, "#1e1a36"]]); g.fillRect(0, 200, w, 56);
  for (let k = 0; k < 16; k++) { g.fillStyle = `rgba(255,236,170,${.55 - k * .03})`; const ww = 30 - k * 1.5 + rnd() * 8; g.fillRect(168 - ww / 2, 204 + k * 3, ww, 1.4); }
  for (const side of [0, 1]) for (let k = 0; k < 7; k++) { const x = side ? w - 8 - k * 12 - rnd() * 6 : 8 + k * 12 + rnd() * 6, b = 236 + rnd() * 10, t = b - 30 - rnd() * 26;
    for (let j = 0; j < 4; j++) poly(g, [x - 9 + j * 1.6, b - j * (b - t) / 4, x, t + j * 2, x + 9 - j * 1.6, b - j * (b - t) / 4], "#120e20"); }
  firnis(g, w, h, rnd);
}
function pDrache(g, w, h, rnd){
  g.fillStyle = lin(g, 0, 0, 0, h, [[0, "#182636"], [.5, "#46616a"], [.78, "#d99a5c"], [1, "#e9b878"]]); g.fillRect(0, 0, w, h);
  for (let k = 0; k < 5; k++) { g.fillStyle = "rgba(30,40,55,.45)"; g.beginPath(); g.ellipse(rnd() * w, 30 + rnd() * 70, 40 + rnd() * 40, 7 + rnd() * 5, 0, 0, 7); g.fill(); }
  mountains(g, w, 210, 80, "#2f3346", rnd, 6); mountains(g, w, 228, 46, "#1c1d2a", rnd, 9);
  g.fillStyle = "#14141e"; g.fillRect(0, 236, w, 20);
  // Drache im Flug
  g.save(); g.translate(170, 92); g.rotate(-.12); const dk = "#1d1218";
  g.fillStyle = dk; g.beginPath(); g.ellipse(0, 0, 34, 11, 0, 0, 7); g.fill();
  g.strokeStyle = dk; g.lineCap = "round"; for (let k = 0; k < 6; k++) { g.lineWidth = 8 - k * 1.3; g.beginPath(); g.moveTo(-26 - k * 12, 2 + Math.sin(k * .9) * 6); g.lineTo(-38 - k * 12, 2 + Math.sin((k + 1) * .9) * 6); g.stroke(); }
  poly(g, [-106, 6, -96, 0, -98, 12], dk);
  g.lineWidth = 7; g.beginPath(); g.moveTo(26, -3); g.quadraticCurveTo(44, -16, 52, -20); g.stroke();
  poly(g, [48, -24, 66, -22, 70, -17, 54, -14], dk); poly(g, [50, -24, 46, -34, 54, -25], dk);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(-8, -4); g.lineTo(10, -8); g.lineTo(-2 + s * 6, -64 - s * 8); g.lineTo(-18, -44 - s * 4); g.lineTo(-24, -52 - s * 2); g.lineTo(-30, -30); g.lineTo(-40, -32); g.closePath(); g.fillStyle = s > 0 ? dk : "#2b1a22"; g.fill(); }
  glowDot(g, 82, -12, 22, "rgba(255,160,60,.75)"); glowDot(g, 96, -8, 14, "rgba(255,220,120,.7)");
  g.restore();
  firnis(g, w, h, rnd);
}
function pSchiff(g, w, h, rnd){
  g.fillStyle = lin(g, 0, 0, 0, 170, [[0, "#0b1634"], [1, "#2e4a7a"]]); g.fillRect(0, 0, w, h); stars(g, 0, 0, w, 140, 90, rnd);
  glowDot(g, 62, 54, 50, "rgba(255,240,210,.4)"); g.fillStyle = "#fff6dd"; g.beginPath(); g.arc(62, 54, 16, 0, 7); g.fill(); g.fillStyle = "#2e4a7a"; g.beginPath(); g.arc(70, 50, 14, 0, 7); g.fill();
  g.fillStyle = lin(g, 0, 168, 0, h, [[0, "#1a3358"], [1, "#081428"]]); g.fillRect(0, 168, w, h - 168);
  for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(150,190,240,${.15 + rnd() * .25})`; g.lineWidth = 1; const x = rnd() * w, y = 174 + rnd() * 80, l = 8 + rnd() * 20; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke(); }
  for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(255,240,200,${.4 - k * .035})`; g.fillRect(56 + (rnd() - .5) * 10, 174 + k * 6, 14 - k, 1.3); }
  // Schiff
  g.fillStyle = "#24160e"; g.beginPath(); g.moveTo(84, 160); g.lineTo(196, 156); g.lineTo(184, 182); g.lineTo(98, 184); g.closePath(); g.fill();
  g.fillRect(176, 146, 22, 12); g.strokeStyle = "#24160e"; g.lineWidth = 3; for (const x of [118, 152]) { g.beginPath(); g.moveTo(x, 160); g.lineTo(x, 66); g.stroke(); }
  g.lineWidth = 1; g.beginPath(); g.moveTo(84, 160); g.lineTo(118, 70); g.lineTo(152, 68); g.lineTo(200, 150); g.stroke();
  for (const [x, y0, y1, ww] of [[118, 76, 106, 26], [118, 110, 146, 30], [152, 74, 104, 24], [152, 108, 146, 28]]) {
    g.fillStyle = "#e7dcc0"; g.beginPath(); g.moveTo(x - ww, y0); g.quadraticCurveTo(x, y0 - 4, x + ww, y0); g.quadraticCurveTo(x + ww + 5, (y0 + y1) / 2, x + ww, y1); g.lineTo(x - ww, y1); g.quadraticCurveTo(x - ww + 5, (y0 + y1) / 2, x - ww, y0); g.fill();
    g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x - ww, y1 - 6, ww * 2, 6); }
  poly(g, [152, 66, 170, 70, 152, 74], "#9b2335");
  g.fillStyle = "#ffd27a"; g.shadowColor = "#ffb84a"; g.shadowBlur = 6; g.fillRect(180, 150, 4, 4); g.fillRect(188, 150, 4, 4); g.fillRect(120, 166, 4, 3); g.shadowBlur = 0;
  firnis(g, w, h, rnd);
}
function pSterne(g, w, h, rnd){
  g.fillStyle = rad(g, w / 2, h / 2, 10, w * .75, [[0, "#f1e2bc"], [1, "#c9a76c"]]); g.fillRect(0, 0, w, h); speckle(g, w, h, 2000, .15, ["#8a6a3a", "#fff3d0"], rnd);
  const cx = w / 2, cy = h / 2;
  g.fillStyle = rad(g, cx, cy, 10, 118, [[0, "#1d2c62"], [1, "#0d1534"]]); g.beginPath(); g.arc(cx, cy, 116, 0, 7); g.fill();
  g.strokeStyle = "#d9a830"; g.lineWidth = 3; for (const r of [116, 100]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
  g.lineWidth = 1; g.strokeStyle = "rgba(217,168,48,.55)"; g.beginPath(); g.arc(cx, cy, 58, 0, 7); g.stroke();
  for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2, r0 = k % 6 ? 108 : 102; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * 116, cy + Math.sin(a) * 116); g.strokeStyle = "#d9a830"; g.stroke(); }
  g.strokeStyle = "rgba(217,168,48,.25)"; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 100, cy + Math.sin(a) * 100); g.stroke(); }
  g.save(); g.beginPath(); g.arc(cx, cy, 99, 0, 7); g.clip(); stars(g, 0, 0, w, h, 160, rnd, 1.4); g.restore();
  for (let c = 0; c < 6; c++) { const a = rnd() * Math.PI * 2, r = 25 + rnd() * 60, x0 = cx + Math.cos(a) * r, y0 = cy + Math.sin(a) * r, pts = [[x0, y0]];
    for (let k = 0; k < 3 + (rnd() * 3 | 0); k++) { const p = pts[pts.length - 1]; let x = p[0] + (rnd() - .5) * 36, y = p[1] + (rnd() - .5) * 36; const d = Math.hypot(x - cx, y - cy); if (d > 92) { x = cx + (x - cx) * 92 / d; y = cy + (y - cy) * 92 / d; } pts.push([x, y]); }
    g.strokeStyle = "rgba(240,210,130,.75)"; g.lineWidth = 1; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    pts.forEach(([x, y]) => { glowDot(g, x, y, 6, "rgba(255,240,200,.8)"); g.fillStyle = "#fff"; g.fillRect(x - 1.3, y - 1.3, 2.6, 2.6); }); }
  g.fillStyle = "#e3b341"; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill(); g.strokeStyle = "#e3b341"; g.lineWidth = 2;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); g.lineTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18); g.stroke(); }
  g.fillStyle = "#f3e3bd"; g.beginPath(); g.arc(cx + 62, cy - 40, 9, 0, 7); g.fill(); g.fillStyle = "#13204a"; g.beginPath(); g.arc(cx + 66, cy - 43, 8, 0, 7); g.fill();
  for (const [x, y] of [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]]) star4(g, x, y, 8, "#8a5a1e");
  g.fillStyle = "rgba(255,200,120,.06)"; g.fillRect(0, 0, w, h);
}
function pStill(g, w, h, rnd){
  g.fillStyle = rad(g, 120, 90, 10, 200, [[0, "#3a2818"], [1, "#0c0805"]]); g.fillRect(0, 0, w, h);
  g.fillStyle = lin(g, 0, 182, 0, h, [[0, "#5a3820"], [1, "#24160c"]]); g.fillRect(0, 182, w, h - 182); g.fillStyle = "rgba(255,220,160,.25)"; g.fillRect(0, 182, w, 2);
  // Bücherstapel
  [[14, 160, 74, 12, "#6e1b1b"], [18, 148, 66, 12, "#1e305e"], [12, 137, 70, 11, "#5c3a1d"]].forEach(([x, y, ww, hh, c]) => { g.fillStyle = c; g.fillRect(x, y + 10, ww, hh); g.fillStyle = "#e9dcbc"; g.fillRect(x + ww - 4, y + 12, 3, hh - 4); g.fillStyle = "#d9a830"; g.fillRect(x + 8, y + 14, 2, hh - 6); });
  // Kerze auf dem Stapel
  glowDot(g, 46, 92, 60, "rgba(255,190,90,.45)"); g.fillStyle = "#efe2c4"; g.fillRect(40, 108, 12, 39); g.fillStyle = "#ffe6a0"; g.beginPath(); g.ellipse(46, 100, 4, 9, 0, 0, 7); g.fill();
  // runder Kolben (grün) und hohe Flasche (rot)
  glowDot(g, 120, 160, 34, "rgba(90,230,140,.45)"); g.fillStyle = "rgba(220,240,230,.25)"; g.beginPath(); g.arc(120, 160, 24, 0, 7); g.fill(); g.fillRect(114, 118, 12, 22);
  g.fillStyle = "#3fbf6a"; g.beginPath(); g.arc(120, 162, 20, .2, Math.PI - .2); g.fill(); g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(112, 150, 4, 7, -.4, 0, 7); g.fill();
  g.fillStyle = "#7a5030"; g.fillRect(115, 112, 10, 8);
  g.fillStyle = "rgba(230,200,200,.25)"; g.fillRect(150, 112, 22, 70); g.fillRect(156, 92, 10, 20); g.fillStyle = "#a01c2c"; g.fillRect(152, 130, 18, 50); g.fillStyle = "#7a5030"; g.fillRect(156, 86, 10, 8);
  // Feder im Tintenfass
  g.fillStyle = "#14101a"; g.beginPath(); g.ellipse(84, 182, 12, 6, 0, 0, 7); g.fill(); g.fillRect(74, 170, 20, 12);
  g.strokeStyle = "#f2efe6"; g.lineWidth = 2; g.beginPath(); g.moveTo(86, 172); g.quadraticCurveTo(96, 130, 108, 104); g.stroke();
  g.fillStyle = "rgba(242,239,230,.9)"; g.beginPath(); g.moveTo(90, 160); g.quadraticCurveTo(110, 120, 108, 104); g.quadraticCurveTo(96, 124, 90, 160); g.fill();
  // Apfel
  g.fillStyle = rad(g, 30, 196, 2, 16, [[0, "#d8513a"], [1, "#6a1a12"]]); g.beginPath(); g.arc(34, 200, 13, 0, 7); g.fill();
  firnis(g, w, h, rnd);
}
/* Wandteppiche mit Wappentieren (Eule, Hirsch, Fuchs, Einhorn) */
function teppich(g, w, h, k, rnd){
  const bg = ["#4a2462", "#1f4b2e", "#7a2a1a", "#1e305e"][k], gold = "#d9a830";
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(0,0,0,${.05 + rnd() * .06})`; g.fillRect(0, y, w, 1); }
  for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(255,255,255,${rnd() * .04})`; g.fillRect(x, 0, 1, h); }
  g.strokeStyle = gold; g.lineWidth = 5; g.strokeRect(8, 8, w - 16, h - 30); g.lineWidth = 1.5; g.strokeRect(15, 15, w - 30, h - 44);
  for (let y = 22; y < h - 30; y += 14) { star4(g, 11.5, y, 3, gold); star4(g, w - 11.5, y, 3, gold); }
  for (const x of [34, 64, 94]) star4(g, x, 36, 5, gold);
  // Schild
  const sh = () => { g.beginPath(); g.moveTo(26, 62); g.lineTo(102, 62); g.lineTo(102, 132); g.quadraticCurveTo(100, 172, 64, 196); g.quadraticCurveTo(28, 172, 26, 132); g.closePath(); };
  sh(); g.fillStyle = "rgba(0,0,0,.28)"; g.fill(); g.lineWidth = 3.5; g.strokeStyle = gold; g.stroke();
  g.save(); sh(); g.clip(); g.fillStyle = gold; g.strokeStyle = gold; g.lineCap = "round"; g.lineJoin = "round";
  if (k === 0) {   // Eule
    g.beginPath(); g.ellipse(64, 138, 20, 28, 0, 0, 7); g.fill(); g.beginPath(); g.arc(64, 106, 17, 0, 7); g.fill();
    poly(g, [49, 98, 47, 82, 58, 94], gold); poly(g, [79, 98, 81, 82, 70, 94], gold);
    g.fillStyle = bg; for (const x of [57, 71]) { g.beginPath(); g.arc(x, 106, 6.5, 0, 7); g.fill(); } g.fillStyle = gold; for (const x of [57, 71]) { g.beginPath(); g.arc(x, 106, 2.6, 0, 7); g.fill(); }
    poly(g, [61, 112, 67, 112, 64, 119], bg); g.strokeStyle = bg; g.lineWidth = 1.6; for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(64, 128 + j * 8, 8, .3, Math.PI - .3); g.stroke(); }
    g.beginPath(); g.moveTo(46, 128); g.quadraticCurveTo(52, 150, 58, 160); g.moveTo(82, 128); g.quadraticCurveTo(76, 150, 70, 160); g.stroke();
    g.fillStyle = gold; g.fillRect(40, 166, 48, 4);
  } else if (k === 1) {   // Hirsch
    g.beginPath(); g.moveTo(54, 108); g.quadraticCurveTo(64, 102, 74, 108); g.quadraticCurveTo(76, 134, 68, 158); g.quadraticCurveTo(64, 164, 60, 158); g.quadraticCurveTo(52, 134, 54, 108); g.fill();
    g.beginPath(); g.ellipse(46, 112, 10, 5, .5, 0, 7); g.fill(); g.beginPath(); g.ellipse(82, 112, 10, 5, -.5, 0, 7); g.fill();
    g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 6, 104); g.quadraticCurveTo(64 + s * 22, 92, 64 + s * 30, 70);
      g.moveTo(64 + s * 16, 92); g.lineTo(64 + s * 8, 78); g.moveTo(64 + s * 24, 84); g.lineTo(64 + s * 18, 68); g.moveTo(64 + s * 28, 76); g.lineTo(64 + s * 36, 66); g.stroke(); }
    g.fillStyle = bg; for (const x of [58, 70]) { g.beginPath(); g.ellipse(x, 122, 2.5, 3.5, 0, 0, 7); g.fill(); }
  } else if (k === 2) {   // Fuchs
    g.beginPath(); g.moveTo(40, 100); g.lineTo(52, 74); g.lineTo(62, 98); g.lineTo(66, 98); g.lineTo(76, 74); g.lineTo(88, 100); g.quadraticCurveTo(92, 124, 64, 156); g.quadraticCurveTo(36, 124, 40, 100); g.fill();
    g.fillStyle = bg; poly(g, [46, 98, 52, 82, 58, 98], bg); poly(g, [70, 98, 76, 82, 82, 98], bg);
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 11, 114, 5, 2.6, s * .35, 0, 7); g.fill(); }
    g.beginPath(); g.arc(64, 148, 4, 0, 7); g.fill(); g.strokeStyle = bg; g.lineWidth = 1.5; g.beginPath(); g.moveTo(48, 126); g.quadraticCurveTo(64, 140, 80, 126); g.stroke();
    g.fillStyle = gold; g.beginPath(); g.moveTo(84, 170); g.quadraticCurveTo(110, 150, 96, 120); g.quadraticCurveTo(104, 160, 76, 176); g.fill();
  } else {   // Einhorn
    g.beginPath(); g.moveTo(52, 176); g.quadraticCurveTo(44, 140, 56, 112); g.quadraticCurveTo(62, 98, 74, 96); g.quadraticCurveTo(90, 98, 96, 118); g.lineTo(92, 126); g.quadraticCurveTo(80, 120, 76, 128); g.quadraticCurveTo(74, 150, 82, 176); g.closePath(); g.fill();
    poly(g, [68, 98, 84, 64, 76, 100], gold); g.strokeStyle = bg; g.lineWidth = 1.2; for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(80 - j * 2, 74 + j * 7); g.lineTo(84 - j * 2.5, 76 + j * 7); g.stroke(); }
    poly(g, [62, 102, 60, 88, 68, 100], gold); g.fillStyle = bg; g.beginPath(); g.arc(80, 108, 2.6, 0, 7); g.fill();
    g.strokeStyle = gold; g.lineWidth = 3; for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(56 - j, 108 + j * 12); g.quadraticCurveTo(40 - j * 2, 114 + j * 12, 44 - j * 3, 124 + j * 12); g.stroke(); }
  }
  g.restore();
  // Fransen unten
  g.fillStyle = gold; g.fillRect(8, h - 22, w - 16, 5); for (let x = 10; x < w - 8; x += 4) g.fillRect(x, h - 17, 2, 12 + rnd() * 4);
}
/* Themenbilder (hochkant): Gewitterturm, Prisma, Bahnen mit Komet, Balkenwaage */
function thema(g, w, h, k, rnd){
  if (k === 0) {
    g.fillStyle = lin(g, 0, 0, 0, h, [[0, "#0d1024"], [.6, "#262c4a"], [1, "#111320"]]); g.fillRect(0, 0, w, h);
    for (let j = 0; j < 9; j++) { g.fillStyle = `rgba(${40 + rnd() * 30},${44 + rnd() * 30},${70 + rnd() * 40},.8)`; g.beginPath(); g.ellipse(rnd() * w, 20 + rnd() * 60, 30 + rnd() * 30, 10 + rnd() * 10, 0, 0, 7); g.fill(); }
    g.strokeStyle = "rgba(160,170,210,.18)"; g.lineWidth = 1; for (let j = 0; j < 50; j++) { const x = rnd() * w, y = 60 + rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 12); g.stroke(); }
    g.fillStyle = "#07080f"; g.beginPath(); g.moveTo(0, 230); g.quadraticCurveTo(60, 214, 128, 222); g.lineTo(128, 256); g.lineTo(0, 256); g.fill();
    g.fillRect(70, 132, 26, 96); poly(g, [66, 134, 83, 96, 100, 134], "#07080f"); for (let x = 70; x < 96; x += 7) g.fillRect(x, 128, 4, 6);
    g.fillStyle = "#ffd27a"; g.shadowColor = "#ffb84a"; g.shadowBlur = 8; g.fillRect(80, 150, 5, 8); g.fillRect(80, 186, 5, 8); g.shadowBlur = 0;
    const bolt = (pts, wd) => { g.strokeStyle = "#e8f2ff"; g.lineWidth = wd; g.shadowColor = "#8fb8ff"; g.shadowBlur = 14; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.shadowBlur = 0; };
    bolt([[40, 40], [52, 62], [44, 70], [62, 92], [56, 100], [83, 96]], 2.6); bolt([[52, 62], [34, 82], [38, 96]], 1.2); bolt([[100, 30], [94, 52], [108, 70], [102, 86]], 1.6);
    glowDot(g, 83, 96, 22, "rgba(170,200,255,.6)");
  } else if (k === 1) {   // Studierstube: Sonnenstrahl durchs Fenster, Prisma auf dem Tisch, Spektrum an der Wand
    g.fillStyle = lin(g, 0, 0, w, h, [[0, "#4a3622"], [1, "#1c130b"]]); g.fillRect(0, 0, w, h);
    g.fillStyle = "#9fc6e8"; g.beginPath(); g.moveTo(10, 96); g.lineTo(10, 40); g.arc(30, 40, 20, Math.PI, 0); g.lineTo(50, 96); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(24, 64, 10, 5, 0, 0, 7); g.fill();
    g.strokeStyle = "#3a2716"; g.lineWidth = 3.5; g.beginPath(); g.moveTo(10, 96); g.lineTo(10, 40); g.arc(30, 40, 20, Math.PI, 0); g.lineTo(50, 96); g.closePath(); g.moveTo(30, 20); g.lineTo(30, 96); g.moveTo(10, 62); g.lineTo(50, 62); g.stroke();
    g.fillStyle = "rgba(255,248,220,.22)"; g.beginPath(); g.moveTo(18, 70); g.lineTo(44, 64); g.lineTo(64, 168); g.lineTo(52, 172); g.closePath(); g.fill();
    g.fillStyle = "#2a1a0e"; g.fillRect(0, 190, w, 66); g.fillStyle = "#5a3a20"; g.fillRect(0, 184, w, 8);
    const cols = ["#ff4b3a", "#ff9a2a", "#ffe04a", "#4ad06a", "#3a9aff", "#7a6aff", "#c47aff"];
    cols.forEach((c, i) => { g.fillStyle = c; g.globalAlpha = .22; g.beginPath(); g.moveTo(64, 166); g.lineTo(112, 100 + i * 12); g.lineTo(112, 112 + i * 12); g.closePath(); g.fill();
      g.globalAlpha = .85; g.fillRect(108, 100 + i * 12, 16, 12); }); g.globalAlpha = 1;
    glowDot(g, 116, 142, 30, "rgba(255,255,255,.18)");
    g.fillStyle = "rgba(210,235,255,.45)"; g.strokeStyle = "#f2f8ff"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(60, 146); g.lineTo(74, 184); g.lineTo(46, 184); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = "#d9a830"; g.lineWidth = 2; g.beginPath(); g.moveTo(22, 184); g.lineTo(22, 160); g.stroke(); g.beginPath(); g.ellipse(22, 150, 9, 11, 0, 0, 7); g.stroke();
    g.fillStyle = "rgba(190,225,255,.35)"; g.fill();
    g.fillStyle = "#e9dcbc"; g.fillRect(84, 176, 22, 8); g.fillStyle = "#6e1b1b"; g.fillRect(84, 180, 22, 4);
  } else if (k === 2) {
    g.fillStyle = lin(g, 0, 0, 0, h, [[0, "#0a0f28"], [1, "#1a1f44"]]); g.fillRect(0, 0, w, h); stars(g, 0, 0, w, h, 90, rnd, 1.2);
    const cx = 64, cy = 150; g.strokeStyle = "rgba(217,168,48,.55)"; g.lineWidth = 1.2;
    for (const [rx, ry] of [[22, 12], [38, 22], [54, 32], [60, 52]]) { g.beginPath(); g.ellipse(cx, cy, rx, ry, -.25, 0, 7); g.stroke(); }
    glowDot(g, cx, cy, 26, "rgba(255,200,90,.7)"); g.fillStyle = "#ffd36b"; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill();
    [[22, 12, .6, "#9db7ff", 3], [38, 22, 2.4, "#e0533d", 4], [54, 32, 4.4, "#7bd389", 5], [60, 52, 1.2, "#ffe2b0", 3]].forEach(([rx, ry, a, c, r]) => {
      const x = cx + Math.cos(a) * rx * Math.cos(-.25) - Math.sin(a) * ry * Math.sin(-.25), y = cy + Math.cos(a) * rx * Math.sin(-.25) + Math.sin(a) * ry * Math.cos(-.25);
      g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.fillStyle = lin(g, 30, 30, 110, 90, [[0, "rgba(180,220,255,0)"], [1, "rgba(220,240,255,.85)"]]); g.beginPath(); g.moveTo(20, 30); g.lineTo(104, 74); g.lineTo(98, 82); g.closePath(); g.fill();
    glowDot(g, 102, 78, 12, "rgba(230,245,255,.9)");
  } else {
    g.fillStyle = rad(g, 64, 110, 10, 170, [[0, "#4a3420"], [1, "#160e08"]]); g.fillRect(0, 0, w, h);
    g.fillStyle = "#2a1c10"; g.fillRect(0, 214, w, 42); g.fillStyle = "rgba(255,220,160,.2)"; g.fillRect(0, 214, w, 2);
    const gold = "#d9a830"; g.fillStyle = gold; g.fillRect(61, 70, 6, 136); g.fillRect(44, 204, 40, 8); g.beginPath(); g.arc(64, 66, 7, 0, 7); g.fill();
    g.save(); g.translate(64, 78); g.rotate(-.12); g.fillRect(-48, -3, 96, 6); g.restore();
    const ends = [[-47, 78 + 47 * .12], [47, 78 - 47 * .12]];
    ends.forEach(([dx, y], i) => { const x = 64 + dx; g.strokeStyle = gold; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 16, y + 54); g.moveTo(x, y); g.lineTo(x + 16, y + 54); g.stroke();
      g.fillStyle = gold; g.beginPath(); g.ellipse(x, y + 56, 19, 5, 0, 0, 7); g.fill();
      if (!i) { g.fillStyle = "#5a5560"; g.fillRect(x - 12, y + 40, 24, 13); g.fillRect(x - 8, y + 30, 16, 10); } else { g.fillStyle = "#8a7a6a"; g.beginPath(); g.ellipse(x, y + 46, 12, 9, 0, 0, 7); g.fill(); } });
    g.fillStyle = "#3a3640"; g.beginPath(); g.moveTo(14, 238); g.lineTo(36, 238); g.lineTo(32, 220); g.lineTo(18, 220); g.closePath(); g.fill(); g.strokeStyle = "#3a3640"; g.lineWidth = 3; g.beginPath(); g.arc(25, 216, 5, Math.PI, 0); g.stroke();
    glowDot(g, 64, 40, 40, "rgba(255,210,140,.25)");
  }
  firnis(g, w, h, rnd);
}
let _atlas = null;
function atlasTex(){
  if (_atlas) return _atlas;
  _atlas = U.canvasTex(AW, AW, (g) => {
    const rnd = U.seeded(4711);
    g.fillStyle = "#808080"; g.fillRect(0, 0, AW, AW);
    for (let i = 0; i < 12; i++) area(g, i * 64, 0, 64, 256, (g, w, h) => spine(g, w, h, i, rnd));
    area(g, 768, 0, 256, 128, (g, w, h) => globeMap(g, w, h, rnd));
    area(g, 768, 128, 64, 128, (g, w, h) => paperBlock(g, w, h, rnd));
    area(g, 832, 128, 64, 128, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); speckle(g, w, h, 600, .12, ["#bbbbbb", "#ffffff"], rnd); });
    area(g, 896, 128, 128, 128, (g, w, h) => parchment(g, w, h, rnd));
    area(g, 0, 256, 192, 256, (g, w, h) => pZauberer(g, w, h, rnd));
    area(g, 192, 256, 192, 256, (g, w, h) => pHexe(g, w, h, rnd));
    area(g, 384, 256, 320, 256, (g, w, h) => pBurg(g, w, h, rnd));
    area(g, 704, 256, 320, 256, (g, w, h) => pBerge(g, w, h, rnd));
    area(g, 0, 512, 256, 256, (g, w, h) => pSterne(g, w, h, rnd));
    area(g, 256, 512, 192, 256, (g, w, h) => pStill(g, w, h, rnd));
    area(g, 448, 512, 320, 256, (g, w, h) => pDrache(g, w, h, rnd));
    area(g, 768, 512, 256, 256, (g, w, h) => pSchiff(g, w, h, rnd));
    for (let k = 0; k < 4; k++) area(g, k * 128, 768, 128, 256, (g, w, h) => teppich(g, w, h, k, rnd));
    for (let k = 0; k < 4; k++) area(g, 512 + k * 128, 768, 128, 256, (g, w, h) => thema(g, w, h, k, rnd));
  }, "zd-atlas");
  _atlas.userData.keep = true; return _atlas;
}

/* ---------- Materialien (einmal angelegt, bleiben beim Raumwechsel erhalten) ---------- */
let MAT = null;
function samtTex(){ return U.canvasTex(64, 256, (g, w, h) => { g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, w, h); const r = U.seeded(31);
  for (let x = 0; x < w; x++) { g.fillStyle = `rgba(${r() < .5 ? "0,0,0" : "255,255,255"},${r() * .07})`; g.fillRect(x, 0, 1, h); }
  speckle(g, w, h, 900, .08, ["#000", "#fff"], r); }, "zd-samt", [1, 1]); }
function mats(){
  if (MAT) return MAT;
  const keep = m => { m.userData.keep = true; return m; }, env = KIT.tex.env();
  const add = o => keep(new T3.MeshBasicMaterial(Object.assign({transparent: true, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false}, o)));
  MAT = {
    atlas: keep(new T3.MeshStandardMaterial({map: atlasTex(), vertexColors: true, roughness: .8})),
    samt: keep(new T3.MeshStandardMaterial({map: samtTex(), vertexColors: true, roughness: .92, side: T3.DoubleSide})),
    lum: keep(new T3.MeshBasicMaterial({vertexColors: true, toneMapped: false})),
    glass: keep(new T3.MeshStandardMaterial({color: 0xdcecff, transparent: true, opacity: .26, roughness: .04, metalness: .2, envMap: env, depthWrite: false})),
    spiegel: keep(new T3.MeshStandardMaterial({color: 0xe6edf5, metalness: 1, roughness: .05, envMap: env})),
    wood: KIT.mat("darkwood"), gold: KIT.mat("gold"), brass: KIT.mat("brass"), iron: KIT.mat("metal"), steel: KIT.mat("steel"), stone: KIT.mat("stone"),
    kristall: KIT.mat("crystal", {color: "#a8dcff", intensity: .75}),
    licht: add({vertexColors: true, opacity: .5, side: T3.DoubleSide}),
    flamme: keep(new T3.PointsMaterial({map: U.glowTex(), color: 0xffc070, size: .26, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})),
    schein: keep(new T3.PointsMaterial({map: U.glowTex(), vertexColors: true, size: .3, transparent: true, opacity: .75, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})),
    funke: keep(new T3.LineBasicMaterial({color: 0xd8eaff, transparent: true, opacity: .95, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false}))
  };
  return MAT;
}
const FARBIG = new Set(["atlas", "samt", "lum", "licht"]), OHNE_SCHATTEN = new Set(["lum", "licht", "glass", "kristall"]);

/* ---------- Geometrie: Hilfen, Sammeln und Verschmelzen ---------- */
const _e = new T3.Euler(), _q = new T3.Quaternion(), _p = new T3.Vector3(), _s = new T3.Vector3(), _c = new T3.Color(), _m = new T3.Matrix4(), _Y = new T3.Vector3(0, 1, 0);
function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx){ _e.set(rx, ry, rz, "YXZ"); return new T3.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e), _s.set(sx, sy, sz)); }
const box = (w, h, d) => new T3.BoxGeometry(w, h, d), cyl = (rt, rb, h, s = 10, open = false) => new T3.CylinderGeometry(rt, rb, h, s, 1, open),
  sph = (r, ws = 10, hs = 8) => new T3.SphereGeometry(r, ws, hs), tor = (r, t, rs = 6, ts = 18, arc = PI * 2) => new T3.TorusGeometry(r, t, rs, ts, arc),
  cone = (r, h, s = 8) => new T3.ConeGeometry(r, h, s), plane = (w, h, a = 1, b = 1) => new T3.PlaneGeometry(w, h, a, b);
function uvRect(g, r){ const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, r[0] + uv.getX(i) * (r[2] - r[0]), r[1] + uv.getY(i) * (r[3] - r[1])); return g; }
// Matrix, die die y-Achse von p nach q legt (für Stäbe, Seile, Beine)
function along(p, q, sx = 1, sz = 1){ const d = new T3.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = d.length();
  return [new T3.Matrix4().compose(new T3.Vector3((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new T3.Quaternion().setFromUnitVectors(_Y, d.normalize()), new T3.Vector3(sx, 1, sz)), L]; }
function merge(list, color){
  let nv = 0, ni = 0;
  for (const [g] of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = color ? new Float32Array(nv * 3) : null, idx = nv > 65000 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const [g, c] of list) {
    const n = g.attributes.position.count; pos.set(g.attributes.position.array, ov * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, ov * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, ov * 2);
    if (col) { if (g.attributes.color) col.set(g.attributes.color.array, ov * 3); else { _c.set(c == null ? 0xffffff : c); for (let k = 0; k < n; k++) { col[(ov + k) * 3] = _c.r; col[(ov + k) * 3 + 1] = _c.g; col[(ov + k) * 3 + 2] = _c.b; } } }
    if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) idx[oi + k] = a[k] + ov; oi += a.length; } else { for (let k = 0; k < n; k++) idx[oi + k] = ov + k; oi += n; }
    ov += n; g.dispose();
  }
  const out = new T3.BufferGeometry(); out.setAttribute("position", new T3.BufferAttribute(pos, 3)); out.setAttribute("normal", new T3.BufferAttribute(nor, 3));
  out.setAttribute("uv", new T3.BufferAttribute(uv, 2)); if (col) out.setAttribute("color", new T3.BufferAttribute(col, 3)); out.setIndex(new T3.BufferAttribute(idx, 1));
  out.computeBoundingSphere(); return out;
}
// Sammler: Teile je Material, am Ende ein Mesh je Material. at(m) setzt die Grundlage (Platz an der Wand), Teile kommen in deren lokalen Koordinaten.
function bucket(){
  const parts = new Map(); let base = new T3.Matrix4();
  const K = {
    get base(){ return base; },
    at(m){ base = m; return K; },
    put(key, geo, m, c, uv){ if (key === "atlas" && !uv && !geo.userData.uvFest) uv = A.white; if (uv) uvRect(geo, uv); geo.applyMatrix4(m ? _m.multiplyMatrices(base, m) : base);
      if (!parts.has(key)) parts.set(key, []); parts.get(key).push([geo, c]); return K; },
    rod(key, p, q, r, seg = 6, c, uv, r2){ const [m, L] = along(p, q); return K.put(key, cyl(r2 ?? r, r, L, seg), m, c, uv); },
    build(parent, MT){ const out = {};
      for (const [k, list] of parts) { const me = new T3.Mesh(merge(list, FARBIG.has(k)), MT[k]); me.castShadow = false; me.receiveShadow = !OHNE_SCHATTEN.has(k); me.userData.noPick = true; parent.add(me); out[k] = me; }
      parts.clear(); return out; },
    get size(){ return parts.size; }
  };
  return K;
}
// Buch als Quader: Rücken (+z) aus dem Atlas, Deckel aus glattem Leder, Schnitt aus dem Papierblock
function bookGeo(w, h, d, ci){
  const g = box(w, h, d), uv = g.attributes.uv, S = A.spine[ci], C = A.cover[ci], P = A.pages, rr = [C, C, P, P, S, P];
  for (let f = 0; f < 6; f++) { const r = rr[f]; for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, r[0] + uv.getX(i) * (r[2] - r[0]), r[1] + uv.getY(i) * (r[3] - r[1])); } }
  g.userData.uvFest = true; return g;
}
const TRANK = ["#ff4fa3", "#4dff9a", "#ffb43a", "#46d9ff", "#b06bff", "#ff5a4a", "#e8ff5a", "#5a8cff"];
const pick = (r, a) => a[(r() * a.length) | 0];
function shuffle(r, a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- Kleine Gegenstände (lokal; y = Standfläche) ---------- */
function flasche(D, x, y, z, typ, col, s = 1){
  const K = D.K, G = "glass";
  if (typ === 0) {        // runder Kolben
    K.put(G, sph(.075 * s, 8, 6), M(x, y + .075 * s, z)).put("lum", sph(.063 * s, 6, 4), M(x, y + .058 * s, z, 0, 0, 0, 1, .8, 1), col);
    K.put(G, cyl(.02 * s, .024 * s, .08 * s, 6, true), M(x, y + .175 * s, z)).put("atlas", cyl(.023 * s, .02 * s, .03 * s, 6), M(x, y + .225 * s, z), "#8a5a32");
  } else if (typ === 1) { // hohe Flasche
    K.put(G, cyl(.042 * s, .046 * s, .17 * s, 8), M(x, y + .085 * s, z)).put(G, cyl(.017 * s, .044 * s, .045 * s, 8, true), M(x, y + .192 * s, z));
    K.put(G, cyl(.016 * s, .016 * s, .05 * s, 6, true), M(x, y + .238 * s, z)).put("atlas", cyl(.019 * s, .017 * s, .028 * s, 6), M(x, y + .27 * s, z), "#7a4a2a");
    K.put("lum", cyl(.036 * s, .04 * s, .11 * s, 6), M(x, y + .06 * s, z), col);
  } else if (typ === 2) { // Erlenmeyer
    K.put(G, cyl(.022 * s, .07 * s, .13 * s, 8), M(x, y + .065 * s, z)).put(G, cyl(.022 * s, .022 * s, .05 * s, 6, true), M(x, y + .155 * s, z));
    K.put("lum", cyl(.046 * s, .064 * s, .06 * s, 6), M(x, y + .031 * s, z), col);
  } else if (typ === 3) { // Phiole
    K.put(G, cyl(.022 * s, .022 * s, .12 * s, 6), M(x, y + .06 * s, z)).put("lum", cyl(.017 * s, .017 * s, .075 * s, 6), M(x, y + .04 * s, z), col);
    K.put("atlas", cyl(.024 * s, .021 * s, .025 * s, 6), M(x, y + .13 * s, z), "#8a5a32");
  } else {                // eckige Flasche
    K.put(G, box(.075 * s, .14 * s, .075 * s), M(x, y + .07 * s, z)).put("lum", box(.062 * s, .085 * s, .062 * s), M(x, y + .045 * s, z), col);
    K.put(G, cyl(.018 * s, .022 * s, .05 * s, 8, true), M(x, y + .165 * s, z)).put("atlas", cyl(.02 * s, .018 * s, .025 * s, 6), M(x, y + .2 * s, z), "#7a4a2a");
  }
  if (D.r() < .45) D.halo(x, y + .07 * s, z, col);
}
function kerze(D, x, y, z, h = .16, halter = true){
  const K = D.K; if (halter) K.put("brass", cyl(.045, .05, .015, 10), M(x, y + .0075, z)).put("brass", cyl(.026, .03, .03, 8), M(x, y + .03, z));
  const y0 = y + (halter ? .045 : 0); K.put("atlas", cyl(.019, .021, h, 6), M(x, y0 + h / 2, z), "#efe4cc"); D.flame(x, y0 + h + .045, z);
}
function kandelaber(D, x, y, z, s = 1){
  const K = D.K, G = "brass"; K.put(G, cyl(.05 * s, .08 * s, .03 * s, 8), M(x, y + .015 * s, z)).put(G, cyl(.012 * s, .018 * s, .26 * s, 5), M(x, y + .16 * s, z));
  K.put(G, sph(.025 * s, 8, 6), M(x, y + .1 * s, z)).put(G, box(.3 * s, .014 * s, .014 * s), M(x, y + .29 * s, z));
  for (const [dx, dy] of [[-.14, 0], [0, .05], [.14, 0]]) { if (dy) K.put(G, cyl(.008 * s, .008 * s, .05 * s, 6), M(x, y + .315 * s, z));
    K.put(G, cyl(.028 * s, .02 * s, .03 * s, 6), M(x + dx * s, y + (.31 + dy) * s, z)); const h = (.13 + (dy ? .04 : 0)) * s;
    K.put("atlas", cyl(.015 * s, .016 * s, h, 6), M(x + dx * s, y + (.325 + dy) * s + h / 2, z), "#efe4cc"); D.flame(x + dx * s, y + (.325 + dy) * s + h + .04, z); }
}
function sanduhr(D, x, y, z, s = 1, sand = .6){
  const K = D.K, W = "wood", G = "glass";
  K.put(W, cyl(.07 * s, .07 * s, .022 * s, 8), M(x, y + .011 * s, z)).put(W, cyl(.07 * s, .07 * s, .022 * s, 8), M(x, y + .27 * s, z));
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; K.put("brass", cyl(.007 * s, .007 * s, .24 * s, 4), M(x + Math.cos(a) * .058 * s, y + .14 * s, z + Math.sin(a) * .058 * s)); }
  K.put(G, cyl(.05 * s, .008 * s, .12 * s, 8, true), M(x, y + .2 * s, z)).put(G, cyl(.008 * s, .05 * s, .12 * s, 8, true), M(x, y + .08 * s, z));
  K.put("lum", cone(.04 * s * sand, .07 * s * sand, 8), M(x, y + .022 * s + .035 * s * sand, z), "#e9b44a");
  K.put("lum", cone(.04 * s * (1 - sand * .7), .05 * s * (1 - sand * .7), 8), M(x, y + .165 * s, z, PI), "#e9b44a");
}
function buchstapel(D, x, y, z, n = 3, s = 1){
  let yy = y; for (let k = 0; k < n; k++) { const th = (.04 + D.r() * .03) * s, L = (.26 - k * .02) * s, d = (.19 - k * .01) * s;
    D.K.put("atlas", bookGeo(th, L, d, (D.r() * 12) | 0), M(x + (D.r() - .5) * .03, yy + th / 2, z, 0, (D.r() - .5) * .5, PI / 2)); yy += th; }
  return yy;
}
function kristallkugel(D, x, y, z, col = "#9fdcff"){
  const K = D.K; K.put("brass", cyl(.045, .065, .05, 10), M(x, y + .025, z));
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; K.put("brass", cyl(.008, .01, .06, 5), M(x + Math.cos(a) * .045, y + .07, z + Math.sin(a) * .045, Math.sin(a) * .5, 0, -Math.cos(a) * .5)); }
  K.put("glass", sph(.08, 12, 8), M(x, y + .13, z)).put("lum", sph(.03, 8, 6), M(x, y + .13, z), col); D.halo(x, y + .13, z, col);
}
function armillar(D, x, y, z, s = 1){
  const K = D.K, G = "brass"; K.put("wood", cyl(.07 * s, .09 * s, .04 * s, 10), M(x, y + .02 * s, z)).put(G, cyl(.01 * s, .012 * s, .12 * s, 6), M(x, y + .1 * s, z));
  const c = y + .3 * s; K.put(G, tor(.17 * s, .007 * s, 4, 22), M(x, c, z)).put(G, tor(.17 * s, .007 * s, 4, 22), M(x, c, z, 0, PI / 2));
  K.put(G, tor(.155 * s, .007 * s, 4, 22), M(x, c, z, PI / 2 - .41, 0, 0)).put(G, tor(.14 * s, .006 * s, 4, 20), M(x, c, z, PI / 2 + .3, .6, 0));
  K.put(G, cyl(.004 * s, .004 * s, .4 * s, 4), M(x, c, z, 0, 0, .41)); K.put("lum", sph(.035 * s, 8, 6), M(x, c, z), "#ffcf6a");
}
function globusKlein(D, x, y, z, s = 1){
  const K = D.K; K.put("wood", cyl(.06 * s, .08 * s, .03 * s, 10), M(x, y + .015 * s, z)).put("brass", cyl(.008 * s, .01 * s, .08 * s, 6), M(x, y + .07 * s, z));
  K.put("brass", tor(.13 * s, .006 * s, 5, 24), M(x, y + .23 * s, z, 0, 0, .41)).put("atlas", sph(.115 * s, 16, 12), M(x, y + .23 * s, z, 0, D.r() * 6, .41), null, A.globe);
}
function rollen(D, x, y, z, n = 3){
  for (let k = 0; k < n; k++) { const L = .2 + D.r() * .08; D.K.put("atlas", cyl(.022, .022, L, 6), M(x + (k - (n - 1) / 2) * .045, y + .022 + (k === 1 && n === 3 ? .035 : 0), z, PI / 2, (D.r() - .5) * .3, 0), null, A.parch);
    D.K.put("atlas", cyl(.024, .024, .02, 6, true), M(x + (k - (n - 1) / 2) * .045, y + .022 + (k === 1 && n === 3 ? .035 : 0), z, PI / 2, 0, 0), "#7a1a20"); }
}
function tintenfass(D, x, y, z){
  D.K.put("iron", cyl(.03, .035, .045, 8), M(x, y + .0225, z)).put("atlas", cone(.012, .02, 6), M(x, y + .055, z), "#141018");
  const [m, L] = along([x, y + .04, z], [x + .07, y + .3, z - .03]); D.K.put("atlas", cyl(.003, .002, L, 4), m, "#e8e2d4");
  const [m2] = along([x + .03, y + .14, z - .012], [x + .07, y + .3, z - .03], 1, .25); D.K.put("atlas", cone(.03, .17, 6), m2, "#f2efe6");
}

/* ---------- Möbel (lokal: x entlang der Wand, y hoch, z von der Rückseite in den Raum) ---------- */
// Regalbrett füllen: Bücher (stehend, angelehnt, liegend), dazwischen Flaschen, Kerzen, Schriftrollen, Sanduhren
function fillShelf(D, xa, xb, y, d, maxH, mix = .2){
  const K = D.K, r = D.r; let x = xa + .01, items = 0;
  while (x < xb - .04) {
    const q = r(), room = xb - x;
    if (q < .05) { x += .04 + r() * .1; continue; }
    if (q < .12 && room > .3 && maxH > .2) { const L = Math.min(.28, room - .02); buchstapel(D, x + L / 2, y, d - .13, 2 + (r() * 3 | 0), 1.05); x += L + .02; continue; }
    if (q < .12 + mix && room > .16 && items < 2) { items++; const k = r();
      if (k < .4) flasche(D, x + .06, y, d * .55, (r() * 5) | 0, pick(r, TRANK), .85); else if (k < .55 && maxH > .26) kerze(D, x + .05, y, d * .55, .1 + r() * .06);
      else if (k < .75) rollen(D, x + .07, y, d * .5, 2 + (r() < .5 ? 1 : 0)); else if (k < .9 && maxH > .3) sanduhr(D, x + .07, y, d * .55, .8, .2 + r() * .6); else kristallkugel(D, x + .07, y, d * .55, pick(r, TRANK));
      x += .16; continue; }
    const bw = .028 + r() * .045, bh = Math.min(maxH, .19 + r() * .17), bd = Math.min(d - .05, .15 + r() * .1);
    if (bw > room) break;
    const ci = (r() * 12) | 0, z = d - .02 - bd / 2 - r() * .015;
    if (q > .93 && room > .2) { const a = .2 + r() * .25, W = bw * Math.cos(a) + bh * Math.sin(a), Hh = bw * Math.sin(a) + bh * Math.cos(a);
      if (Hh <= maxH && W < room) { K.put("atlas", bookGeo(bw, bh, bd, ci), M(x + W / 2, y + Hh / 2, z, 0, 0, a)); x += W + .05 + r() * .06; continue; } }
    K.put("atlas", bookGeo(bw, bh, bd, ci), M(x + bw / 2, y + bh / 2, z)); x += bw + .002;
  }
}
function korpus(D, w, h, d, n, base = .1){   // offener Schrank: Seiten, Rückwand, Kranz, Sockel, n Fächer übereinander → Fachböden [y, frei]
  const K = D.K, t = .045, W = "wood";
  K.put(W, box(t, h, d), M(-w / 2 + t / 2, h / 2, d / 2)).put(W, box(t, h, d), M(w / 2 - t / 2, h / 2, d / 2)).put(W, box(w - 2 * t, h - base, .02), M(0, base + (h - base) / 2, .01));
  K.put(W, box(w + .1, .07, d + .07), M(0, h - .035, d / 2 + .02)).put(W, box(w + .04, .05, d + .035), M(0, h - .095, d / 2 + .005));
  K.put(W, box(w, base, d), M(0, base / 2, d / 2)).put(W, box(w + .04, .04, d + .02), M(0, .02, d / 2 + .01));
  const sp = (h - .12 - base) / n, out = [];
  for (let i = 0; i < n; i++) { const y = base + i * sp; if (i) K.put(W, box(w - 2 * t, .03, d - .02), M(0, y - .015, d / 2 - .01)); out.push([y, sp - (i ? .015 : 0) - .015]); }
  return out;
}
function regal(D, w, h = 2.45, d = .42){
  const n = Math.max(4, Math.round((h - .3) / .43)), boards = korpus(D, w, h, d, n), t = .045, div = w > 2.8 ? 3 : w > 1.75 ? 2 : 1, cw = (w - 2 * t) / div;
  for (let k = 1; k < div; k++) D.K.put("wood", box(.035, h - .22, d - .03), M(-w / 2 + t + k * cw, .1 + (h - .22) / 2, d / 2 - .01));
  boards.forEach(([y, free], i) => { for (let k = 0; k < div; k++) { const xa = -w / 2 + t + k * cw + (k ? .018 : 0), xb = -w / 2 + t + (k + 1) * cw - (k < div - 1 ? .018 : 0);
    fillShelf(D, xa, xb, y, d, free - .03, i === boards.length - 1 ? .35 : .15); } });
}
function tuer(D, x, y, w, h, d){   // Schranktür mit Rahmen und Knauf
  const K = D.K; K.put("wood", box(w - .02, h - .02, .02), M(x, y, d + .01));
  for (const [dx, dy, ww, hh] of [[0, h / 2 - .05, w - .06, .04], [0, -h / 2 + .05, w - .06, .04], [-w / 2 + .05, 0, .04, h - .06], [w / 2 - .05, 0, .04, h - .06]]) K.put("wood", box(ww, hh, .015), M(x + dx, y + dy, d + .025));
  K.put("brass", sph(.018, 6, 4), M(x + (x < 0 ? w / 2 - .1 : -w / 2 + .1), y, d + .04));
}
function traenke(D, w, h = 2.2, d = .36){
  const r = D.r, boards = korpus(D, w, h, d, 4), t = .045;
  const [y1] = boards[1]; const nd = Math.max(1, Math.round((w - 2 * t) / .5)), dw = (w - 2 * t) / nd;   // unten geschlossener Schrank
  for (let k = 0; k < nd; k++) tuer(D, -w / 2 + t + (k + .5) * dw, (.1 + y1) / 2, dw, y1 - .12, d - .03);
  boards.slice(1).forEach(([y, free]) => { let x = -w / 2 + t + .07;
    while (x < w / 2 - t - .07) { const q = r();
      if (q < .1 && free > .3) { buchstapel(D, x + .1, y, d * .5, 2, .8); x += .24; continue; }
      if (q < .18 && free > .3) { // Glas mit Kristall oder Kräutern
        D.K.put("glass", cyl(.055, .055, .18, 10), M(x + .04, y + .09, d * .5)).put("brass", cyl(.058, .058, .02, 10), M(x + .04, y + .19, d * .5));
        D.K.put(q < .14 ? "lum" : "atlas", q < .14 ? new T3.OctahedronGeometry(.04, 0) : cyl(.048, .048, .1, 8), M(x + .04, y + (q < .14 ? .07 : .05), d * .5, 0, 0, 0, 1, q < .14 ? 1.5 : 1, 1), q < .14 ? pick(r, TRANK) : "#5a6a2a"); x += .15; continue; }
      const typ = (r() * 5) | 0, s = .75 + r() * .45; if ((typ === 1 ? .3 : .25) * s > free - .03) { x += .08; continue; }
      flasche(D, x, y, d * .5 + (r() - .5) * .08, typ, pick(r, TRANK), s); x += .13 + r() * .08; } });
}
function kommode(D, w, top = "mix", mitBild = true, h = .95, d = .46){
  const K = D.K, W = "wood", r = D.r;
  K.put(W, box(w, h - .15, d - .04), M(0, .1 + (h - .15) / 2, (d - .04) / 2)).put(W, box(w + .06, .05, d + .02), M(0, h - .025, d / 2));
  K.put(W, box(w + .02, .04, d - .02), M(0, .12, (d - .02) / 2));
  for (const sx of [-1, 1]) for (const z of [.05, d - .09]) K.put(W, cyl(.035, .025, .1, 8), M(sx * (w / 2 - .06), .05, z));
  const cols = w > 1.3 ? 2 : 1, rows = 3, dw = (w - .06) / cols, dh = (h - .25) / rows;
  for (let c = 0; c < cols; c++) for (let k = 0; k < rows; k++) { const x = -w / 2 + .03 + (c + .5) * dw, y = .16 + (k + .5) * dh;
    K.put(W, box(dw - .04, dh - .035, .025), M(x, y, d - .04 + .012)).put("brass", sph(.017, 6, 4), M(x, y, d - .005)); }
  const y = h, zt = d * .5;
  if (top === "blitz") blitzTop(D, w, y, zt); else if (top === "linsen") linsenTop(D, w, y, zt); else if (top === "sanduhr") sanduhrTop(D, w, y, zt);
  else if (top === "waage") waageTop(D, w, y, zt); else if (top !== "leer") mixTop(D, w, y, zt);
  const key = mitBild && !D.nahStation && D.bildNehmen(["still", "zauberer", "hexe", "schiff", "burg", "berge", "sterne"]);   // nicht hinter dem Schild einer Station
  if (key) { const asp = ASP[key]; let hh = .92, bw = hh * asp; if (bw > w * .85) { bw = w * .85; hh = bw / asp; }
    bild(D, bw, hh, A.bild[key], .06, M(0, 1.3 + hh / 2 + .06, -D.off)); }
}
function mixTop(D, w, y, z){
  const r = D.r, n = Math.max(2, Math.min(4, Math.floor(w / .4))), opts = shuffle(r, ["kand", "buch", "kugel", "sand", "globus", "armillar", "rollen", "tinte", "flaschen"]);
  // kein Tischglobus, wenn schon ein großer Globus im Raum steht; Ersatz zieht gleich viele Zufallszahlen (die übrige Anordnung bleibt gleich)
  const gi = opts.indexOf("globus"); if (D.zahl.globus && gi >= 0 && gi < n) opts[gi] = opts.slice(0, n).includes("kugel") ? "sand" : "kugel";
  for (let k = 0; k < n; k++) { const x = -w / 2 + (k + .5) * w / n + (r() - .5) * .06, o = opts[k];
    if (o === "kand") kandelaber(D, x, y, z); else if (o === "buch") { const yy = buchstapel(D, x, y, z, 2 + (r() * 2 | 0)); if (r() < .5) kerze(D, x, yy, z, .12); }
    else if (o === "kugel") kristallkugel(D, x, y, z, pick(r, ["#9fdcff", "#c79bff", "#7dffcf"])); else if (o === "sand") sanduhr(D, x, y, z, 1.1, .3 + r() * .5);
    else if (o === "globus") globusKlein(D, x, y, z); else if (o === "armillar") armillar(D, x, y, z); else if (o === "rollen") rollen(D, x, y, z);
    else if (o === "tinte") { tintenfass(D, x, y, z); } else { flasche(D, x - .06, y, z, 0, pick(r, TRANK), 1.1); flasche(D, x + .07, y, z + .04, 1, pick(r, TRANK)); }
  }
}
function truhe(D, w, h = .62, d = .5){
  const K = D.K; K.put("wood", box(w, h - .14, d), M(0, (h - .14) / 2, d / 2));
  K.put("wood", new T3.CylinderGeometry(d / 2, d / 2, w, 14, 1, false, 0, PI), M(0, h - .14, d / 2, 0, 0, PI / 2).multiply(M(0, 0, 0, 0, 0, 0, .56, 1, 1)));
  for (const x of [-w / 2 + .12, 0, w / 2 - .12]) { K.put("iron", box(.05, h - .12, d + .02), M(x, (h - .12) / 2, d / 2)); K.put("iron", tor(d / 2 + .005, .02, 4, 14, PI), M(x, h - .14, d / 2, 0, PI / 2, 0, 1, .55, 1)); }   // Bänder stehen auf dem Boden (nicht darunter)
  K.put("brass", box(.1, .12, .02), M(0, h - .2, d + .01)).put("brass", tor(.03, .008, 4, 10), M(0, h - .27, d + .02));
}
function bank(D, w){   // Fensterbank mit Kissen
  const K = D.K, h = .45, d = .45; K.put("wood", box(w, h - .05, d), M(0, (h - .05) / 2, d / 2)).put("wood", box(w + .04, .05, d + .03), M(0, h - .025, d / 2 + .01));
  for (const x of [-w / 4, w / 4]) tuer(D, x, .22, w / 2 - .04, .3, d - .03);
  K.put("samt", box(w - .06, .08, d - .04), M(0, h + .04, d / 2), D.samtFarbe);
  K.put("samt", sph(.13, 10, 8), M(-w / 2 + .2, h + .14, .14, .3, .2, .25, 1, .85, .45), D.samtFarbe).put("samt", sph(.12, 10, 8), M(-w / 2 + .38, h + .13, .16, .2, -.2, -.2, 1, .85, .45), "#c9a24a");
  buchstapel(D, w / 2 - .25, h + .08, d * .55, 2);
}
function ruestung(D){
  const K = D.K, z = .3, S = "steel";
  K.put("wood", box(.7, .16, .56), M(0, .08, z)).put("brass", box(.72, .02, .58), M(0, .17, z));
  for (const s of [-1, 1]) {
    K.put(S, box(.12, .07, .25), M(s * .1, .215, z + .03)).put(S, cyl(.055, .065, .4, 8), M(s * .1, .45, z)).put(S, sph(.07, 8, 6), M(s * .1, .67, z + .01));
    K.put(S, cyl(.075, .06, .4, 8), M(s * .1, .89, z)).put(S, sph(.1, 8, 6), M(s * .25, 1.56, z, 0, 0, 0, 1.15, .8, 1.1)).put(S, cyl(.05, .055, .3, 8), M(s * .28, 1.37, z, 0, 0, s * .12));
    K.put(S, sph(.055, 6, 4), M(s * .3, 1.21, z)).put(S, cyl(.048, .04, .28, 8), M(s * .3, 1.06, z + .04, -.25, 0, 0)).put("iron", sph(.05, 6, 4), M(s * .3, .92, z + .08));
  }
  K.put(S, cyl(.2, .17, .2, 10), M(0, 1.12, z)).put(S, cyl(.17, .2, .42, 10), M(0, 1.42, z)).put(S, sph(.2, 10, 6), M(0, 1.45, z + .03, 0, 0, 0, 1, 1.05, .75));
  K.put(S, cyl(.08, .09, .08, 8), M(0, 1.66, z)).put(S, cyl(.12, .12, .2, 10), M(0, 1.8, z)).put(S, sph(.12, 10, 5), M(0, 1.9, z));
  K.put("iron", box(.17, .018, .03), M(0, 1.83, z + .115)).put("iron", box(.018, .1, .03), M(0, 1.77, z + .115));
  K.put("atlas", cone(.04, .3, 6), M(0, 2.08, z - .06, -.55, 0, 0), "#9b2335");
  K.put("wood", cyl(.02, .02, 2.25, 6), M(.36, 1.295, z + .08)).put(S, box(.012, .26, .16), M(.36, 2.2, z + .16)).put(S, cone(.03, .18, 6), M(.36, 2.5, z + .08));
}
function standleuchter(D){
  const K = D.K, G = "brass", z = .25;
  K.put(G, cyl(.06, .2, .1, 8), M(0, .05, z)).put(G, sph(.07, 6, 4), M(0, .14, z)).put(G, cyl(.022, .03, 1.45, 6), M(0, .85, z));
  for (const y of [.5, 1.05, 1.5]) K.put(G, sph(.045, 6, 4), M(0, y, z));
  K.put(G, cyl(.09, .05, .05, 8), M(0, 1.6, z)).put(G, box(.52, .025, .025), M(0, 1.63, z));
  for (const [x, h] of [[-.24, .17], [-.12, .2], [0, .25], [.12, .2], [.24, .17]]) { K.put(G, cyl(.035, .025, .05, 6), M(x, 1.665, z));
    K.put("atlas", cyl(.02, .022, h, 6), M(x, 1.69 + h / 2, z), "#efe4cc"); D.flame(x, 1.69 + h + .045, z); }
}
function globus(D){
  const K = D.K, z = .35, y = .95;
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + PI / 6; K.rod("wood", [Math.cos(a) * .3, 0, z + Math.sin(a) * .3], [Math.cos(a) * .3, y, z + Math.sin(a) * .3], .022, 6); }
  K.put("wood", tor(.2, .018, 5, 24), M(0, .3, z, PI / 2)).put("brass", tor(.32, .02, 6, 36), M(0, y, z, PI / 2));
  K.put("brass", tor(.29, .012, 5, 30), M(0, y, z, 0, .3, .41)).put("atlas", sph(.27, 20, 14), M(0, y, z, 0, D.r() * 6, .41), null, A.globe);
}
function kessel(D){
  const K = D.K, z = .48, pts = [[0, .12], [.27, .13], [.35, .28], [.36, .44], [.31, .6], [.33, .64]].map(([x, y]) => new T3.Vector2(x, y));
  K.put("iron", new T3.LatheGeometry(pts, 16), M(0, 0, z)).put("iron", tor(.33, .025, 6, 24), M(0, .645, z, PI / 2));
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; K.put("iron", cyl(.025, .02, .18, 6), M(Math.cos(a) * .22, .09, z + Math.sin(a) * .22)); }
  K.put("lum", new T3.CircleGeometry(.31, 18), M(0, .57, z, -PI / 2), "#5dff8a");
  for (let k = 0; k < 3; k++) K.put("wood", cyl(.04, .04, .5, 6), M(0, .05, z, 0, k * PI / 3, PI / 2));
  K.put("lum", box(.18, .04, .12), M(0, .08, z), "#ff7a2a"); D.flame(-.05, .14, z); D.flame(.06, .13, z + .03);
  D.halo(0, .7, z, "#5dff8a"); D.halo(0, .62, z, "#5dff8a");
  D.blasen.push(D.w(0, .58, z));
}
function besen(D, w){
  const K = D.K; K.put("wood", box(w, .06, .36), M(0, .03, .18)).put("wood", box(w, .06, .1), M(0, 1.3, .05));
  for (const s of [-1, 1]) K.put("wood", box(.05, 1.3, .05), M(s * (w / 2 - .04), .65, .03));
  [-.24, 0, .24].forEach((x, i) => { const b = [x + (i - 1) * .03, .08, .28], t = [x, 1.75, .06]; besenGeo(K, b, t, i); });
}
function besenGeo(K, b, t, i = 0){   // Besen von b (Borstenende) nach t (Stielende)
  K.rod("atlas", b, t, .02, 6, ["#6b4a2a", "#5a3a20", "#7a5532"][i % 3]);
  const d = [t[0] - b[0], t[1] - b[1], t[2] - b[2]], L = Math.hypot(...d), u = d.map(v => v / L);
  const [m] = along(b, [b[0] + u[0] * .48, b[1] + u[1] * .48, b[2] + u[2] * .48]); K.put("atlas", cyl(.035, .1, .48, 8), m, "#c9a45a");
  const [m2] = along([b[0] + u[0] * .44, b[1] + u[1] * .44, b[2] + u[2] * .44], [b[0] + u[0] * .5, b[1] + u[1] * .5, b[2] + u[2] * .5]); K.put("iron", cyl(.038, .038, .06, 8), m2);
}
function standuhr(D){
  const K = D.K, w = .56, d = .38, W = "wood";
  K.put(W, box(w + .04, .25, d + .02), M(0, .125, d / 2)).put(W, box(w - .06, 1.4, d - .06), M(0, .95, (d - .06) / 2)).put(W, box(w, .62, d), M(0, 1.96, d / 2));
  K.put(W, box(w + .08, .08, d + .05), M(0, 2.3, d / 2 + .01)).put(W, box(w - .06, .1, d - .02), M(0, 2.39, d / 2)).put("brass", sph(.05, 8, 6), M(0, 2.48, d / 2));
  for (const [x, y, ww, hh] of [[0, 1.6, w - .04, .05], [0, .3, w - .04, .05], [-w / 2 + .05, .95, .05, 1.3], [w / 2 - .05, .95, .05, 1.3]]) K.put(W, box(ww, hh, .03), M(x, y, d - .045));
  K.put("glass", plane(w - .14, 1.24), M(0, .95, d - .04)).put("brass", tor(.21, .014, 5, 30), M(0, 1.96, d + .005));
  K.put("atlas", new T3.CircleGeometry(.2, 24), M(0, 1.96, d + .002), "#f3ead2");
  for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; K.put("iron", box(.012, k % 3 ? .025 : .045, .004), M(Math.sin(a) * .17, 1.96 + Math.cos(a) * .17, d + .005, 0, 0, -a)); }
  // Pendel und Zeiger bewegen sich (Pendellänge 0,8 m → Schwingungsdauer T = 2π·√(l/g) ≈ 1,8 s)
  const pend = new T3.Group(), pk = bucket(); pk.put("brass", box(.012, .8, .008), M(0, -.4, 0)).put("brass", cyl(.075, .075, .018, 16), M(0, -.8, 0, PI / 2)); pk.build(pend, D.MT);
  const hands = new T3.Group(), hh = new T3.Group(), mm = new T3.Group();   // Zeiger zeigen die echte Uhrzeit
  bucket().put("iron", box(.022, .12, .005), M(0, .045, 0)).build(hh, D.MT); bucket().put("iron", box(.014, .17, .005), M(0, .07, .004)).build(mm, D.MT); hands.add(hh, mm);
  D.place(pend, M(0, 1.55, d - .1)); D.place(hands, M(0, 1.96, d + .008));
  let last = -1;
  D.ticks.push((dt, t) => { pend.rotation.z = .1 * Math.sin(t * 2 * PI / 1.8);
    if (t - last > 1) { last = t; const n = new Date(), m = n.getMinutes() + n.getSeconds() / 60, h = (n.getHours() % 12) + m / 60; mm.rotation.z = -m / 60 * PI * 2; hh.rotation.z = -h / 12 * PI * 2; } });
}
function standspiegel(D){
  const K = D.K, z = .28, G = "gold";
  for (const s of [-1, 1]) { K.put("wood", box(.08, .05, .52), M(s * .36, .025, z)).put("wood", cyl(.025, .03, 1.7, 8), M(s * .36, .9, z)).put(G, sph(.04, 8, 6), M(s * .36, 1.78, z)).put(G, sph(.03, 8, 6), M(s * .33, 1.15, z)); }
  const m = M(0, 1.12, z, -.06, 0, 0);
  K.put("spiegel", plane(.58, 1.15), m.clone().multiply(M(0, 0, .012))).put("spiegel", new T3.CircleGeometry(.29, 16, 0, PI), m.clone().multiply(M(0, .575, .012)));
  K.put("wood", box(.64, 1.2, .02), m.clone()).put("wood", new T3.CircleGeometry(.32, 16, 0, PI), m.clone().multiply(M(0, .6, -.005)));
  for (const [x, y, ww, hh] of [[0, -.6, .66, .04], [-.31, 0, .04, 1.2], [.31, 0, .04, 1.2]]) K.put(G, box(ww, hh, .03), m.clone().multiply(M(x, y, .015)));
  K.put(G, tor(.31, .02, 6, 20, PI), m.clone().multiply(M(0, .58, .015))).put(G, sph(.035, 8, 6), m.clone().multiply(M(0, .92, .02)));
}
function fernrohr(D){
  const K = D.K, z = .45, top = [0, 1.15, z];
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + .3; K.rod("wood", [Math.cos(a) * .36, .012, z + Math.sin(a) * .3], top, .02, 6); }   // schräge Beine: Fuß knapp über dem Boden, sonst ragt die Kante hinein
  K.put("brass", sph(.05, 8, 6), M(...top));
  const dir = new T3.Vector3(.55, .72, .2).normalize(), q = new T3.Quaternion().setFromUnitVectors(_Y, dir), at = (s) => [top[0] + dir.x * s, top[1] + .06 + dir.y * s, top[2] + dir.z * s];
  const tube = (s0, s1, r0, r1, key = "brass") => { const a = at(s0), b = at(s1); K.put(key, cyl(r1, r0, s1 - s0, 12), new T3.Matrix4().compose(new T3.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new T3.Vector3(1, 1, 1))); };
  tube(-.42, -.2, .028, .03); tube(-.2, .25, .045, .05); tube(.25, .62, .055, .06); tube(.62, .66, .07, .07);
  for (const s of [-.2, .25]) { const a = at(s); K.put("gold", tor(.055, .01, 5, 16), new T3.Matrix4().compose(new T3.Vector3(...a), q.clone().multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(1, 0, 0), PI / 2)), new T3.Vector3(1, 1, 1))); }
  const e = at(.665); K.put("glass", cyl(.064, .064, .01, 14), new T3.Matrix4().compose(new T3.Vector3(...e), q, new T3.Vector3(1, 1, 1)));
}
function gewichte(D, w){
  const K = D.K, z = .28;
  [[-w / 2 + .17, 1], [-w / 2 + .45, .75], [-w / 2 + .66, .55]].forEach(([x, s]) => { if (x > w / 2 - .08) return;
    K.put("iron", cyl(.09 * s, .14 * s, .22 * s, 12), M(x, .11 * s, z)).put("iron", tor(.055 * s, .018 * s, 6, 12, PI), M(x, .22 * s, z)).put("brass", box(.07 * s, .04 * s, .006), M(x, .1 * s, z + .12 * s, -.2, 0, 0)); });
  let y = 0; for (const [r, h] of [[.19, .06], [.16, .055], [.13, .05], [.1, .045]]) { if (w < 1) break; K.put("iron", cyl(r, r, h, 16), M(w / 2 - .22, y + h / 2, z)); y += h; }
  if (w >= 1) K.put("iron", cyl(.02, .02, .15, 6), M(w / 2 - .22, y + .07, z));
}
function kristallsaeule(D){
  const K = D.K, z = .28;
  K.put("wood", box(.44, .9, .44), M(0, .45, z)).put("wood", box(.5, .06, .5), M(0, .93, z)).put("brass", box(.46, .03, .46), M(0, .045, z));
  K.put("brass", cyl(.17, .19, .05, 16), M(0, .985, z)).put("glass", cyl(.15, .15, .4, 16, true), M(0, 1.21, z)).put("glass", new T3.SphereGeometry(.15, 16, 6, 0, PI * 2, 0, PI / 2), M(0, 1.41, z));
  K.put("brass", sph(.03, 8, 6), M(0, 1.58, z));
  const c = [0, 1.13, z]; for (const [dx, h, a, col] of [[0, .2, 0, "#b48cff"], [-.05, .13, .4, "#7fc8ff"], [.05, .11, -.35, "#b48cff"]])
    K.put("lum", new T3.OctahedronGeometry(.045, 0), M(c[0] + dx, 1.01 + h / 2, z, 0, a, a * .6, 1, h / .09, 1), col);
  D.halo(0, 1.15, z, "#a98cff"); D.blitz.push({art: "glas", c: D.w(0, 1.2, z), r: .14, h: .16});
}

/* ---------- Themen auf Kommoden ---------- */
function blitzTop(D, w, y, z){
  const K = D.K, xs = w >= 1.4 ? [-w / 2 + .2, -w / 2 + .5, w / 2 - .32] : [-w / 2 + .18, w / 2 - .3];
  xs.slice(0, xs.length - 1).forEach((x, i) => { const col = i % 2 ? "#7fc8ff" : "#b48cff";
    K.put("brass", cyl(.1, .1, .03, 12), M(x, y + .015, z)).put("glass", cyl(.09, .09, .3, 12, true), M(x, y + .18, z)).put("brass", cyl(.1, .095, .035, 12), M(x, y + .345, z)).put("brass", sph(.025, 6, 4), M(x, y + .375, z));
    K.put("lum", new T3.OctahedronGeometry(.05, 0), M(x, y + .17, z, 0, i, .3, 1, 1.6, 1), col); D.halo(x, y + .17, z, col); D.blitz.push({art: "glas", c: D.w(x, y + .18, z), r: .085, h: .12}); });
  // Funkenstrecke: zwei Messingkugeln auf Stäben, dazwischen springt der Funke
  const x = xs[xs.length - 1]; K.put("wood", box(.36, .05, .18), M(x, y + .025, z));
  for (const s of [-1, 1]) K.put("brass", cyl(.008, .008, .28, 6), M(x + s * .1, y + .19, z)).put("brass", cyl(.008, .008, .07, 6), M(x + s * .07, y + .33, z, 0, 0, PI / 2)).put("brass", sph(.03, 10, 8), M(x + s * .035, y + .33, z));
  D.blitz.push({art: "zu", a: D.w(x - .006, y + .33, z), b: D.w(x + .006, y + .33, z)});
}
function linsenTop(D, w, y, z){
  const K = D.K, step = w / 4;
  [-1.5, .5].forEach((k, i) => { const x = k * step; K.put("brass", cyl(.05, .06, .02, 10), M(x, y + .01, z)).put("brass", cyl(.008, .008, .18, 6), M(x, y + .1, z));
    K.put("brass", tor(.07, .009, 6, 20), M(x, y + .26, z)).put("glass", sph(.068, 14, 8), M(x, y + .26, z, 0, 0, 0, 1, 1, i ? .18 : .12)); });
  const xp = -.5 * step; K.put("wood", box(.18, .03, .14), M(xp, y + .015, z)).put("glass", cyl(.06, .06, .16, 3), M(xp, y + .08, z, PI / 2, 0, PI / 2));
  // kleiner Regenbogen auf der Platte
  const g = new T3.BufferGeometry(), P = [], C = [], cols = ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#0a84ff", "#5e5ce6", "#bf5af2"];
  cols.forEach((c, i) => { _c.set(c); const a0 = -.25 + i * .07, a1 = a0 + .07; P.push(0, 0, 0, Math.cos(a0) * .5, 0, Math.sin(a0) * .5, Math.cos(a1) * .5, 0, Math.sin(a1) * .5); for (let k = 0; k < 3; k++) C.push(_c.r * (k ? 1 : .2), _c.g * (k ? 1 : .2), _c.b * (k ? 1 : .2)); });
  g.setAttribute("position", new T3.Float32BufferAttribute(P, 3)); g.setAttribute("color", new T3.Float32BufferAttribute(C, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(new Array(P.length).fill(0).map((v, i) => i % 3 === 1 ? 1 : 0), 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(new Array(P.length / 3 * 2).fill(0), 2));
  K.put("licht", g, M(xp + .07, y + .004, z, 0, 0, 0, Math.min(1, (w / 2 - xp - .1) / .5), 1, 1));
  const xm = 1.5 * step; K.put("brass", cyl(.05, .06, .02, 10), M(xm, y + .01, z)).put("brass", cyl(.008, .008, .12, 6), M(xm, y + .07, z));
  K.put("gold", tor(.08, .01, 6, 20), M(xm, y + .22, z, -.3, -.5, 0)).put("spiegel", new T3.CircleGeometry(.075, 18), M(xm, y + .22, z, -.3, -.5, 0).multiply(M(0, 0, .004)));
}
function sanduhrTop(D, w, y, z){ const n = w > 1.3 ? 4 : 3; [1.5, 1.0, .7, 1.2].slice(0, n).forEach((s, i) => sanduhr(D, -w / 2 + (i + .5) * w / n, y, z, s, [.25, .55, .8, .4][i])); }
function waageTop(D, w, y, z){
  // Balkenwaage: der Balken pendelt langsam ein, die Schalen hängen immer senkrecht
  const K = D.K, x0 = -w / 4; K.put("wood", box(.4, .04, .22), M(x0, y + .02, z)).put("brass", cyl(.014, .018, .44, 8), M(x0, y + .24, z)).put("brass", sph(.03, 8, 6), M(x0, y + .47, z));
  const H = D.place(new T3.Group(), M(x0, y + .45, z)), beam = new T3.Group(), b = bucket(); b.put("brass", box(.5, .018, .018), M()).put("brass", cone(.02, .07, 6), M(0, -.045, 0, PI)); b.build(beam, D.MT); H.add(beam);
  const pans = [0, 1].map(i => { const g = new T3.Group(), k = bucket();
    for (let j = 0; j < 3; j++) { const a = j / 3 * PI * 2; k.rod("brass", [0, 0, 0], [Math.cos(a) * .08, -.2, Math.sin(a) * .08], .003, 3); }
    k.put("brass", cyl(.1, .07, .02, 14), M(0, -.21, 0)); if (i === 0) k.put("iron", cyl(.04, .045, .06, 10), M(-.02, -.17, 0)).put("iron", cyl(.03, .034, .045, 10), M(.045, -.177, .01));
    else k.put("stone", new T3.IcosahedronGeometry(.055, 0), M(0, -.16, 0, .3, .4, 0, 1.1, .8, 1)); k.build(g, D.MT); H.add(g); return g; });
  D.ticks.push((dt, t) => { const a = .09 + .05 * Math.sin(t * .7); beam.rotation.z = a; pans.forEach((p, i) => { const s = i ? 1 : -1; p.position.set(s * .24 * Math.cos(a), s * .24 * Math.sin(a) - .005, 0); }); });
  // Gewichtssatz daneben
  for (const [dx, r, h] of [[.12, .05, .07], [.2, .04, .055], [.27, .032, .045], [.33, .025, .035]]) K.put("iron", cyl(r, r, h, 10), M(w / 4 + dx - .15, y + h / 2, z)).put("iron", sph(r * .45, 6, 4), M(w / 4 + dx - .15, y + h + r * .3, z));
}

/* ---------- Wandschmuck ---------- */
function bild(D, w, h, uv, f = .07, m = M()){
  const K = D.K, G = "gold", t = (x, y, z) => m.clone().multiply(M(x, y, z));
  K.put("atlas", plane(w, h), t(0, 0, .04), null, uv).put("wood", box(w + .02, h + .02, .02), t(0, 0, .02));
  for (const [x, y, ww, hh] of [[0, h / 2 + f / 2, w + 2 * f, f], [0, -h / 2 - f / 2, w + 2 * f, f], [-w / 2 - f / 2, 0, f, h], [w / 2 + f / 2, 0, f, h]]) K.put(G, box(ww, hh, .05), t(x, y, .035));
  const g = f * .3; for (const [x, y, ww, hh] of [[0, h / 2 + g / 2, w + 2 * g, g], [0, -h / 2 - g / 2, w + 2 * g, g], [-w / 2 - g / 2, 0, g, h], [w / 2 + g / 2, 0, g, h]]) K.put(G, box(ww, hh, .02), t(x, y, .065));
}
function wandteppich(D, w, h, uv, m = M()){
  const K = D.K, t = (x, y, z, rx = 0, ry = 0, rz = 0) => m.clone().multiply(M(x, y, z, rx, ry, rz)), geo = plane(w, h, 10, 1), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, .06 + .02 * Math.sin((pos.getX(i) / w + .5) * PI * 5));
  geo.computeVertexNormals(); K.put("atlas", geo, t(0, 0, 0), null, uv);
  K.put("brass", cyl(.022, .022, w + .3, 8), t(0, h / 2 + .03, .08, 0, 0, PI / 2)).put("brass", sph(.045, 8, 6), t(-w / 2 - .17, h / 2 + .03, .08)).put("brass", sph(.045, 8, 6), t(w / 2 + .17, h / 2 + .03, .08));
  for (const s of [-1, 1]) K.put("iron", box(.03, .03, .08), t(s * (w / 2 + .05), h / 2 + .03, .04));
  for (let k = 0; k < 5; k++) { const x = -w / 2 + (k + .5) * w / 5; K.put("gold", cone(.028, .1, 6), t(x, -h / 2 - .045, .06 + .02 * Math.sin((x / w + .5) * PI * 5))); }
}
// Wappenschild (Bildausschnitt eines Wandteppichs) mit Goldrand – über den Türen
function wappen(D, k, s, m){
  const sh = new T3.Shape(); sh.moveTo(26, -62); sh.lineTo(102, -62); sh.lineTo(102, -132); sh.quadraticCurveTo(100, -172, 64, -196); sh.quadraticCurveTo(28, -172, 26, -132); sh.closePath();
  const g = new T3.ShapeGeometry(sh, 8), p = g.attributes.position, uv = g.attributes.uv, tx = k * 128, ty = 768;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (tx + p.getX(i)) / AW, 1 - (ty - p.getY(i)) / AW);
  g.translate(-64, 129, 0); g.scale(s / 134, s / 134, 1);
  const rim = new T3.ExtrudeGeometry(sh, {depth: .03, bevelEnabled: false, curveSegments: 8}); rim.translate(-64, 129, 0); rim.scale(s / 134 * 1.1, s / 134 * 1.08, 1);
  D.K.put("gold", rim, m.clone().multiply(M(0, 0, .01))).put("atlas", g, m.clone().multiply(M(0, 0, .045)), null, [0, 0, 1, 1]);
}

/* ---------- Samtvorhänge mit Raffhaltern an einem Fenster ---------- */
function vorhang(D, lang){
  const K = D.K, top = 6.6, tie = 2.75, bot = lang ? .04 : 2.1, col = new T3.Color(D.samtFarbe), z0 = .21;
  for (const s of [-1, 1]) {
    const nu = 10, nv = 14, P = [], UV = [], C = [], I = [];
    for (let j = 0; j <= nv; j++) { const y = top - (top - bot) * j / nv; let inner, gather;
      if (y >= tie) { const q = (top - y) / (top - tie); inner = .4 + .62 * Math.pow(q, 1.8); gather = Math.pow(q, 1.3); }
      else { const q = (tie - y) / Math.max(.01, tie - bot); inner = 1.02 - .3 * Math.sqrt(q); gather = Math.max(0, 1 - q * 1.4); }
      for (let i = 0; i <= nu; i++) { const u = i / nu, x = s * (1.3 + (inner - 1.3) * u), amp = .045 + .06 * gather, f = Math.sin(u * PI * 6 + (s > 0 ? .8 : 0));
        P.push(x, y, z0 + f * amp + .09 * gather * Math.sin(u * PI)); UV.push(u * 2, y / 2.5); const sh = .55 + .5 * (f + 1) / 2 + (y > top - .25 ? .1 : 0); C.push(col.r * sh, col.g * sh, col.b * sh); } }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, c, b, b, c, d); }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(UV, 2)); g.setAttribute("color", new T3.Float32BufferAttribute(C, 3));
    g.setIndex(I); g.computeVertexNormals(); K.put("samt", g, M());
    // Raffhalter: goldene Kordel mit Quaste
    K.put("gold", tor(.11, .016, 4, 12), M(s * 1.12, tie, z0 + .06, 0, PI / 2, 0, 1, 1.3, 1)).put("gold", cone(.04, .18, 8), M(s * 1.0, tie - .16, z0 + .14)).put("gold", sph(.03, 6, 4), M(s * 1.0, tie - .05, z0 + .14));
    K.put("iron", box(.04, .04, .2), M(s * 1.26, tie, .1));
  }
  K.put("brass", cyl(.028, .028, 2.9, 10), M(0, top + .07, z0, 0, 0, PI / 2));
  for (const s of [-1, 1]) K.put("brass", sph(.055, 6, 4), M(s * 1.48, top + .07, z0)).put("brass", cone(.03, .09, 8), M(s * 1.55, top + .07, z0, 0, 0, -s * PI / 2)).put("iron", box(.04, .04, z0), M(s * 1.32, top + .07, z0 / 2));
  for (const s of [-1, 1]) for (let j = 0; j < 3; j++) K.put("brass", tor(.04, .008, 3, 6), M(s * (.5 + j * .35), top + .07, z0, 0, PI / 2, 0));
}
function armillarStand(D){
  const K = D.K, z = .3; for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + PI / 6; K.rod("wood", [Math.cos(a) * .28, .012, z + Math.sin(a) * .24], [0, .5, z], .022, 6); }
  K.put("wood", cyl(.035, .045, .5, 8), M(0, .7, z)).put("brass", sph(.05, 8, 6), M(0, .5, z)); armillar(D, 0, .95, z, 2.1);
}

/* ---------- Schwebendes und Hängendes ---------- */
// Kronleuchter: Ring mit Kerzen an einer Kette. Koordinaten relativ zum Aufhängepunkt; fl(x, y, z) nimmt die Flammen auf
function kronleuchter(K, R, drop, fl){
  K.put("iron", cyl(.012, .012, drop, 6), M(0, -drop / 2, 0)); for (let k = 0; k < Math.floor(drop / .12); k++) K.put("iron", tor(.03, .008, 4, 8), M(0, -.06 - k * .12, 0, 0, k * PI / 2, 0));
  const yR = -drop - .5;
  K.put("gold", tor(R, .035, 5, 32), M(0, yR, 0, PI / 2)).put("gold", tor(R * .5, .028, 5, 22), M(0, yR + .24, 0, PI / 2)).put("gold", tor(R * 1.02, .015, 3, 32), M(0, yR - .05, 0, PI / 2));
  K.put("gold", cyl(.05, .05, .52, 8), M(0, yR + .16, 0)).put("gold", sph(.11, 8, 6), M(0, yR - .06, 0)).put("gold", cone(.05, .22, 8), M(0, yR - .26, 0, PI)).put("gold", sph(.06, 8, 6), M(0, -drop + .02, 0));
  for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; K.put("gold", box(R, .022, .022), M(Math.cos(a) * R / 2, yR, Math.sin(a) * R / 2, 0, -a)); }
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + .5; K.rod("iron", [Math.cos(a) * R, yR, Math.sin(a) * R], [0, -drop + .02, 0], .007, 4); }
  const ring = (r, y, n, h0) => { for (let k = 0; k < n; k++) { const a = (k + .5) / n * PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r, h = h0 + (k % 3) * .02;
    K.put("gold", cyl(.05, .03, .04, 6), M(x, y + .03, z)).put("atlas", cyl(.02, .022, h, 6), M(x, y + .05 + h / 2, z), "#f0e6cf"); fl(x, y + .05 + h + .045, z);
    K.put("lum", new T3.OctahedronGeometry(.022, 0), M(x * 1.04, y - .11, z * 1.04, 0, 0, 0, 1, 1.8, 1), "#fff3d6"); } };
  ring(R, yR, Math.round(R * 8), .15); ring(R * .5, yR + .24, 3, .13);
  return -drop - .9;   // tiefster Punkt
}
function kronleuchterRaum(D){
  const yTop = D.H - .36, pref = [2.5, 5.5, -.5, -3.5, -6.5, 8.5];
  // über dem Mittelgang groß; ist dort kein Platz (z. B. ein Strahlengang unter der Decke), kleiner über einem Seitenbereich
  const plaetze = [...pref.map(z => [0, z, .85, .9]), ...pref.flatMap(z => [[-4.3, z, .6, .15], [4.3, z, .6, .15]])];
  const th = D.themaLuft;   // nicht direkt neben dem schwebenden Themenstück: vom Eingang aus säße es sonst wie ein Teil des Leuchters darauf
  for (const [x, z, R, drop] of plaetze) { if (!(D.HU.balken || []).some(b => Math.abs(b - z) < .01) || (th && Math.hypot(x - th.x, z - th.z) < R + th.r + 1.4)) continue;
    const yR = yTop - drop - .5, ring = {x0: x - R - .1, x1: x + R + .1, y0: yR - .4, y1: yR + .45, z0: z - R - .1, z1: z + R + .1};   // Ring mit Kerzen; die Kette verdeckt nichts
    if (!luft(D, x, z, yTop - drop - .95, yTop - .14, R + .25, R + .25, [ring])) continue;
    const g = new T3.Group(), k = bucket(), fl = [];
    kronleuchter(k, R, drop, (x, y, zz) => fl.push(new T3.Vector3(x, y, zz))); k.build(g, D.MT);
    const pts = new T3.Points(new T3.BufferGeometry().setFromPoints(fl), D.MT.flamme); pts.userData.noPick = true; g.add(pts);
    g.position.set(x, yTop, z); g.userData.noPick = true; D.ctx.group.add(g);
    D.ticks.push((dt, t) => { g.rotation.z = Math.sin(t * .55) * .012; g.rotation.x = Math.sin(t * .43 + 1) * .01; g.rotation.y = t * .03; });
    D.zahl.kronleuchter = 1; return true; }
  return false;
}
// Sichtlinien vom Mittelgang (Augenhöhe) zu Exponaten, Türen und hängenden Tafeln: Schwebendes und Hängendes darf sie nicht kreuzen,
// sonst verdeckt es z. B. eine hängende Formeltafel oder ein Planetenkarussell, sobald man darunter entlanggeht
function sichtZiele(D){
  const {ctx, B} = D, eyes = [], pts = [];
  for (let z = B.z1 + 1.8; z <= B.z0 - 1.8 + 1e-6; z += 1.2) eyes.push(new T3.Vector3(0, 1.62, z));
  ctx.group.updateMatrixWorld(true);
  for (const o of ctx.group.children.slice(ctx._shellEnd || 0)) {
    if (o.isLight || o.isSprite || o.isPoints || o.isLine) continue;
    const ia = o.userData.ia, kind = ia && ia.kind, b = new T3.Box3().setFromObject(o); if (b.isEmpty() || kind === "station") continue;
    const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z, bahn = (BAHNEN[ctx.key] || []).some(q => b.min.x >= q.x0 && b.max.x <= q.x1 && b.min.y >= q.y0 && b.max.y <= q.y1 && b.min.z >= q.z0 && b.max.z <= q.z1),
      haengt = !ia && !bahn && b.min.y > 2.6 && Math.max(sx, sz) >= 1.5 && Math.min(sx, sz) < 4;   // Wandtafel, hängendes Banner, Leuchter des Raums (nicht: Bewegtes auf seiner Bahn)
    if (kind !== "exhibit" && kind !== "door" && !haengt) continue;
    const c = b.getCenter(new T3.Vector3()); pts.push(c);
    if (kind === "door") { pts.push(new T3.Vector3(c.x, b.max.y - .6, c.z)); continue; }   // Türschild
    const lx = sx >= sz; for (const f of [.2, .8]) for (const fy of [.45, .85]) pts.push(new T3.Vector3(lx ? b.min.x + sx * f : c.x, b.min.y + (b.max.y - b.min.y) * fy, lx ? c.z : b.min.z + sz * f));
  }
  return {eyes, pts};
}
function segBox(p, q, b){   // schneidet die Strecke p → q den Quader b?
  let t0 = 0, t1 = 1;
  for (const [a, lo, hi] of [["x", b.x0, b.x1], ["y", b.y0, b.y1], ["z", b.z0, b.z1]]) { const d = q[a] - p[a];
    if (Math.abs(d) < 1e-9) { if (p[a] < lo || p[a] > hi) return false; continue; }
    let ta = (lo - p[a]) / d, tb = (hi - p[a]) / d; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return false; }
  return true;
}
function sichtFrei(D, b, m = .05){
  const S = D.sicht, e = {x0: b.x0 - m, x1: b.x1 + m, y0: b.y0 - m, y1: b.y1 + m, z0: b.z0 - m, z1: b.z1 + m};
  for (const p of S.pts) { if (p.x > e.x0 && p.x < e.x1 && p.y > e.y0 && p.y < e.y1 && p.z > e.z0 && p.z < e.z1) continue;   // Ziel im Quader selbst: das prüft frei()
    for (const q of S.eyes) if (segBox(q, p, e)) return false; }
  return true;
}
// freier Quader in der Luft (belegt ihn gleich). sicht: true = der ganze Quader darf keine Sichtlinie kreuzen, false = keine Prüfung
// (Teile, die bewusst ein Exponat umkreisen), Liste = nur diese Teilquader prüfen (der dünne Faden eines Pendels verdeckt nichts, die Kugel schon)
function luft(D, x, z, y0, y1, hx, hz, sicht = true){ const b = {x0: x - hx, x1: x + hx, y0, y1, z0: z - hz, z1: z + hz};
  if (!D.ctx.frei(b, .08) || (sicht === true ? [b] : sicht || []).some(q => !sichtFrei(D, q))) return false; D.ctx.belege(b); return true; }
// Plätze im Luftraum: zuerst über dem Mittelgang, dann seitlich über den Kerzen
function luftPlaetze(D, n, hx, hy, hz, o = {}){
  const r = D.r, out = [], zs = o.zs || shuffle(r, [5.2, 3.6, 2.0, .4, -1.2, -2.8, -4.4]), ys = o.ys || [5.5, 6.05, 5.15], xs = o.xs || [0, -.85, .85];
  const cand = []; for (const y of ys) for (const z of zs) for (const x of xs) cand.push([x + (r() - .5) * .3, y + (r() - .5) * .12, z + (r() - .5) * .5]);
  if (!o.nurGang) for (const z of zs) for (const s of [-1, 1]) cand.push([s * (3.2 + r() * 1.6), 6.35 + (r() - .5) * .1, z]);
  for (const [x, y, z] of cand) { if (out.length >= n) break; if (out.some(p => Math.hypot(p[0] - x, p[2] - z) < (o.abstand || 1.4) && Math.abs(p[1] - y) < .6)) continue;
    if (luft(D, x, z, y - hy, y + hy, hx, hz)) out.push([x, y, z]); }
  return out;
}
// schwebende, offene Bücher mit langsam umblätternden Seiten (drei InstancedMeshes)
function buecherflug(D, plaetze, orbit){
  const n = plaetze.length; if (!n) return; D.zahl.buecherflug = n;
  const a = .3, w = .24, h = .34, kc = bucket(), kp = bucket(), kf = bucket();
  for (const s of [-1, 1]) kc.put("atlas", box(w + .012, .012, h + .02), M(0, 0, 0, 0, 0, s * a).multiply(M(s * (w + .012) / 2, .006, 0)));
  kc.put("atlas", cyl(.016, .016, h + .02, 8), M(0, 0, 0, PI / 2));
  for (const s of [-1, 1]) kp.put("atlas", box(w, .03, h), M(0, 0, 0, 0, 0, s * a).multiply(M(s * w / 2, .027, 0)), null, A.parch);
  kf.put("atlas", box(w - .01, .003, h - .012), M((w - .01) / 2, .044, 0), null, A.parch);
  const mk = (K) => { const g = new T3.Group(); K.build(g, D.MT); const geo = g.children[0].geometry, im = new T3.InstancedMesh(geo, D.MT.atlas, n);
    im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.userData.noPick = true; D.ctx.group.add(im); return im; };
  const C = mk(kc), P = mk(kp), F = mk(kf), r = D.r, gl = new Float32Array(n * 3), gg = new T3.BufferGeometry();
  gg.setAttribute("position", new T3.BufferAttribute(gl, 3)); gg.setAttribute("color", new T3.Float32BufferAttribute(new Array(n).fill(0).flatMap(() => [1, .82, .5]), 3));
  const glow = new T3.Points(gg, D.MT.schein); glow.frustumCulled = false; glow.userData.noPick = true; D.ctx.group.add(glow); const up = new T3.Vector3();
  plaetze.forEach((p, i) => { _c.set(pick(r, LEDER)); C.setColorAt(i, _c); });
  const st = plaetze.map(([x, y, z], i) => ({x, y, z, ph: orbit ? i / n * PI * 2 : r() * 6, yaw: r() * 6, ax: .1 + r() * .15, az: .1 + r() * .15, sp: .18 + r() * .1}));
  const m = new T3.Matrix4(), mf = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), v = new T3.Vector3(), one = new T3.Vector3(1, 1, 1);
  D.ticks.push((dt, t) => {
    st.forEach((s, i) => {
      if (orbit) { const an = s.ph + t * orbit.w; v.set(orbit.x + Math.cos(an) * orbit.r, s.y + Math.sin(t * .9 + s.ph) * .1, orbit.z + Math.sin(an) * orbit.r); e.set(-.55, -an + PI, Math.sin(t * .7 + s.ph) * .08, "YXZ"); }
      else { v.set(s.x + Math.sin(t * s.sp + s.ph) * s.ax, s.y + Math.sin(t * .8 + s.ph * 2) * .1, s.z + Math.cos(t * s.sp * .8 + s.ph) * s.az); e.set(-.85 + Math.sin(t * .5 + s.ph) * .12, s.yaw + Math.sin(t * .15 + s.ph) * .6, Math.sin(t * .6 + s.ph) * .08, "YXZ"); }
      m.compose(v, q.setFromEuler(e), one); C.setMatrixAt(i, m); P.setMatrixAt(i, m);
      up.set(0, .12, 0).applyQuaternion(q).add(v); gl[i * 3] = up.x; gl[i * 3 + 1] = up.y; gl[i * 3 + 2] = up.z;
      const f = (t * .22 + s.ph) % 1, k = f < .4 ? f / .4 : 1, sm = k * k * (3 - 2 * k), phi = a + (PI - 2 * a) * sm;
      mf.makeRotationZ(phi); F.setMatrixAt(i, mf.premultiply(m));
    });
    C.instanceMatrix.needsUpdate = P.instanceMatrix.needsUpdate = F.instanceMatrix.needsUpdate = true; gg.attributes.position.needsUpdate = true; });
}
// schwebende Kristallkugeln mit kreisendem Goldring
function kugelflug(D, plaetze){
  const n = plaetze.length; if (!n) return; D.zahl.kugeln = n;
  const B = new T3.InstancedMesh(new T3.SphereGeometry(.14, 20, 14), D.MT.kristall, n), Rg = new T3.InstancedMesh(new T3.TorusGeometry(.21, .012, 6, 36), D.MT.gold, n);
  const gl = new Float32Array(n * 3), gg = new T3.BufferGeometry(); gg.setAttribute("position", new T3.BufferAttribute(gl, 3)); gg.setAttribute("color", new T3.Float32BufferAttribute(new Array(n).fill(0).flatMap(() => [.6, .85, 1]), 3));
  const glow = new T3.Points(gg, D.MT.schein);
  for (const o of [B, Rg, glow]) { o.frustumCulled = false; o.castShadow = false; o.userData.noPick = true; D.ctx.group.add(o); }
  const st = plaetze.map(([x, y, z]) => ({x, y, z, ph: D.r() * 6})), m = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), v = new T3.Vector3(), one = new T3.Vector3(1, 1, 1);
  D.ticks.push((dt, t) => { st.forEach((s, i) => { v.set(s.x + Math.sin(t * .3 + s.ph) * .12, s.y + Math.sin(t * .7 + s.ph) * .12, s.z + Math.cos(t * .25 + s.ph) * .12);
      m.makeTranslation(v.x, v.y, v.z); B.setMatrixAt(i, m); gl[i * 3] = v.x; gl[i * 3 + 1] = v.y; gl[i * 3 + 2] = v.z;
      e.set(1.1 + Math.sin(t * .4 + s.ph) * .3, t * .6 + s.ph, .3, "YXZ"); m.compose(v, q.setFromEuler(e), one); Rg.setMatrixAt(i, m); });
    B.instanceMatrix.needsUpdate = Rg.instanceMatrix.needsUpdate = true; gg.attributes.position.needsUpdate = true; });
}

/* ---------- Themen im Luftraum ---------- */
function gewitterkugel(D){   // Strom: Glaskugel mit Gewitterkristall, Blitze springen zur Hülle
  const p = luftPlaetze(D, 1, .5, .6, .5, {ys: [5.5, 5.9], xs: [0, .6, -.6], nurGang: true})[0] || luftPlaetze(D, 1, .5, .55, .5, {ys: [6.3], xs: [-3.6, 3.6], nurGang: true})[0]; if (!p) return false;
  const g = new T3.Group(), k = bucket();
  k.put("glass", sph(.32, 20, 14)).put("brass", tor(.335, .018, 5, 30), M(0, 0, 0, PI / 2)).put("brass", tor(.335, .012, 5, 30)).put("brass", cyl(.06, .03, .08, 10), M(0, -.36, 0)).put("brass", cone(.03, .12, 8), M(0, -.45, 0, PI)).put("brass", sph(.035, 8, 6), M(0, .36, 0));
  k.put("lum", new T3.OctahedronGeometry(.09, 0), M(0, 0, 0, 0, 0, 0, 1, 1.5, 1), "#b48cff").put("lum", new T3.OctahedronGeometry(.05, 0), M(.06, -.03, .02, .5, .3, .4, 1, 1.4, 1), "#7fc8ff");
  k.build(g, D.MT); g.position.set(...p); g.userData.noPick = true; D.ctx.group.add(g);
  const c = new T3.Vector3(); D.blitz.push({art: "kugel", c: () => c.copy(g.position), r: .3}); D.halos.push([g.position, "#a98cff", true]);
  D.ticks.push((dt, t) => { g.position.y = p[1] + Math.sin(t * .8) * .12; g.rotation.y = t * .3; });
  D.themaLuft = {x: p[0], z: p[2], r: .4}; D.zahl.gewitterkugel = 1; return true;
}
function prismaflug(D){   // Optik: schwebendes Prisma, weißer Strahl hinein, Farbfächer hinaus
  let p = luftPlaetze(D, 1, 1.35, .5, 1.35, {ys: [5.7, 6.0], xs: [0], nurGang: true})[0], sk = 1;
  if (!p) { p = luftPlaetze(D, 1, .95, .32, .95, {ys: [6.45], xs: [-4.2, 4.2], nurGang: true})[0]; sk = .68; } if (!p) return false;
  const g = new T3.Group(), k = bucket();
  k.put("glass", cyl(.2, .2, .42, 3), M(0, 0, 0, PI / 2, 0, 0)).put("glass", cyl(.2, .2, .42, 3), M(0, 0, 0, PI / 2, 0, 0, .96, .99, .96));
  for (const s of [-1, 1]) k.put("gold", cyl(.215, .215, .02, 3), M(0, 0, s * .215, PI / 2, 0, 0));
  const P = [], C = [], push = (x, y, z, c, f = 1) => { P.push(x, y, z); _c.set(c); C.push(_c.r * f, _c.g * f, _c.b * f); };
  // Strahl hinein (flaches Band)
  for (const [x, y] of [[-1.25, .2], [-.12, .02]]) { push(x, y - .025, 0, "#fff8e6"); push(x, y + .025, 0, "#fff8e6"); }
  const cols = ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#0a84ff", "#5e5ce6", "#bf5af2"], I = [0, 2, 1, 1, 2, 3];
  cols.forEach((c, i) => { const b = P.length / 3, a0 = -.12 - i * .055, a1 = a0 - .055; push(.1, -.02, 0, c, .9); push(.1 + Math.cos(a0) * 1.2, -.02 + Math.sin(a0) * 1.2, 0, c, .9); push(.1 + Math.cos(a1) * 1.2, -.02 + Math.sin(a1) * 1.2, 0, c, .9); I.push(b, b + 1, b + 2); });
  const fg = new T3.BufferGeometry(); fg.setAttribute("position", new T3.Float32BufferAttribute(P, 3)); fg.setAttribute("color", new T3.Float32BufferAttribute(C, 3));
  fg.setAttribute("normal", new T3.Float32BufferAttribute(new Array(P.length).fill(0), 3)); fg.setAttribute("uv", new T3.Float32BufferAttribute(new Array(P.length / 3 * 2).fill(0), 2)); fg.setIndex(I);
  k.put("licht", fg); k.build(g, D.MT); g.position.set(...p); g.scale.setScalar(sk); g.userData.noPick = true; D.ctx.group.add(g);
  D.ticks.push((dt, t) => { g.rotation.y = t * .12; g.position.y = p[1] + Math.sin(t * .6) * .08 * sk; });
  D.themaLuft = {x: p[0], z: p[2], r: 1.2 * sk}; D.zahl.prisma = 1; return true;
}
function besenflug(D){   // Bewegung: zwei Besen kreisen über dem Gang
  const p = luftPlaetze(D, 1, 1.8, .45, 1.8, {ys: [5.9, 5.6, 5.3], xs: [0], nurGang: true})[0]; if (!p) return false;
  const g = new T3.Group(), k = bucket(), R = 1.1;
  for (const s of [-1, 1]) besenGeo(k, [s * R, -.05, -s * .6], [s * R, .08, s * .7], s > 0 ? 0 : 2);
  k.build(g, D.MT); g.position.set(...p); g.userData.noPick = true; D.ctx.group.add(g);
  D.ticks.push((dt, t) => { g.rotation.y = -t * .45; g.position.y = p[1] + Math.sin(t * 1.1) * .1; g.rotation.z = Math.sin(t * .8) * .05; });
  D.themaLuft = {x: p[0], z: p[2], r: 1.3}; D.zahl.besenflug = 1; return true;
}
function pendel(D){   // Bewegung: großes Fadenpendel am Deckenbalken, T = 2π·√(l/g); ist für den langen Faden kein Platz (Sicht auf Tafeln und Türen), ein kürzerer
  const yTop = D.H - .36, amp = .2;
  for (const L of [2.9, 2.4, 2.0]) for (const z of [-.5, 5.5, -3.5, 2.5, -6.5]) { if (!(D.HU.balken || []).some(b => Math.abs(b - z) < .01)) continue;
    const yb = yTop - .07 - L, kugel = {x0: -L * Math.sin(amp) - .2, x1: L * Math.sin(amp) + .2, y0: yb - .42, y1: yb + .2, z0: z - .2, z1: z + .2};   // Pendelkörper über die ganze Schwingung
    if (!luft(D, 0, z, yTop - L - .3, yTop - .14, L * Math.sin(amp) + .3, .3, [kugel])) continue;
    const g = new T3.Group(), k = bucket(); k.put("iron", cyl(.008, .008, L, 5), M(0, -L / 2, 0)).put("gold", sph(.17, 18, 12), M(0, -L, 0)).put("gold", cone(.05, .16, 10), M(0, -L - .23, 0, PI)).put("gold", tor(.17, .015, 6, 30), M(0, -L, 0, PI / 2));
    k.build(g, D.MT); const top = bucket(); top.put("iron", box(.3, .05, .2), M(0, yTop - .02, z)).put("iron", cyl(.03, .03, .08, 8), M(0, yTop - .07, z)).build(D.ctx.group, D.MT);
    g.position.set(0, yTop - .07, z); g.userData.noPick = true; D.ctx.group.add(g); const om = Math.sqrt(9.81 / L);
    D.ticks.push((dt, t) => { g.rotation.z = amp * Math.sin(om * t); });
    D.themaLuft = {x: 0, z, r: .8}; D.zahl.pendel = 1; return true; }
  return false;
}
function steinflug(D){   // Kräfte: schwebende Felsbrocken
  const ps = luftPlaetze(D, 5, .45, .45, .45, {ys: [5.0, 5.7, 6.2], abstand: 1.6}); if (!ps.length) return false;
  const im = new T3.InstancedMesh(new T3.IcosahedronGeometry(.28, 0), D.MT.stone, ps.length); im.frustumCulled = false; im.castShadow = false; im.userData.noPick = true; D.ctx.group.add(im);
  const st = ps.map(([x, y, z]) => ({x, y, z, ph: D.r() * 6, s: [.7 + D.r() * .6, .6 + D.r() * .4, .7 + D.r() * .5]})), m = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), v = new T3.Vector3(), sc = new T3.Vector3();
  D.ticks.push((dt, t) => { st.forEach((s, i) => { v.set(s.x, s.y + Math.sin(t * .6 + s.ph) * .15, s.z); e.set(t * .1 + s.ph, t * .07 + s.ph, s.ph); m.compose(v, q.setFromEuler(e), sc.set(...s.s)); im.setMatrixAt(i, m); }); im.instanceMatrix.needsUpdate = true; });
  D.zahl.felsen = ps.length; return true;
}
function flaschenzug(D){   // Kräfte: lose Rolle am Seil – die Last steigt um h, das Gegengewicht sinkt um 2h
  const yTop = D.H - .36, r = .12;
  // über dem Gang, sonst etwas seitlich davon (dann verdecken Last und Gegengewicht weder Türschild noch hängende Tafeln über dem Gang)
  for (const x0 of [0, -1.2, 1.2]) for (const z of [-3.5, -.5, 2.5, 5.5, -6.5]) { if (!(D.HU.balken || []).some(b => Math.abs(b - z) < .01)) continue;
    const teile = [{x0: x0 - .2, x1: x0 + .52, y0: 3.8, y1: 5.6, z0: z - .2, z1: z + .2}, {x0: x0 - .2, x1: x0 + .45, y0: yTop - .45, y1: yTop, z0: z - .1, z1: z + .1}];   // Last und Gegengewicht, Rollen oben
    if (!luft(D, x0 + .15, z, 3.75, yTop - .14, .65, .35, teile)) continue;   // tiefster Punkt: Last an der losen Rolle bei 3,82 m
    const Y1 = yTop - .3, base = 4.6, cb = 4.9, k = bucket();
    // feste Rolle oben mit Bügel, Haken für das Seilende
    k.put("iron", box(.5, .05, .16), M(x0 + r, yTop - .02, z)).put("iron", box(.03, .3, .03), M(x0 + 2 * r, Y1 + .15, z)).put("brass", cyl(r, r, .05, 18), M(x0 + 2 * r, Y1, z, PI / 2));
    for (const s of [-1, 1]) k.put("iron", box(.03, .3, .02), M(x0 + 2 * r, Y1 + .1, z + s * .04));
    k.put("iron", tor(.03, .008, 4, 10), M(x0 - r, yTop - .07, z)); k.build(D.ctx.group, D.MT);
    // lose Rolle mit Last
    const lo = new T3.Group(), kl = bucket(); kl.put("brass", cyl(r, r, .05, 18), M(0, 0, 0, PI / 2)); for (const s of [-1, 1]) kl.put("iron", box(.26, .03, .02), M(0, -.02, s * .04, 0, 0, PI / 2));
    kl.put("iron", tor(.04, .01, 4, 12), M(0, -.2, 0)).put("iron", cyl(.11, .14, .22, 14), M(0, -.37, 0)).put("iron", tor(.05, .015, 5, 12, PI), M(0, -.25, 0)).put("brass", box(.08, .05, .006), M(0, -.37, .135, -.12, 0, 0));
    kl.build(lo, D.MT); lo.userData.noPick = true; D.ctx.group.add(lo);
    const cw = new T3.Group(), kc = bucket(); kc.put("atlas", sph(.12, 10, 8), M(0, -.12, 0, 0, 0, 0, 1, 1.25, 1), "#8a6a44").put("atlas", cyl(.03, .05, .08, 8), M(0, 0, 0), "#6a4a2a"); kc.build(cw, D.MT); D.ctx.group.add(cw);
    const rope = new T3.InstancedMesh(new T3.CylinderGeometry(.009, .009, 1, 5), D.MT.atlas, 3); rope.geometry.setAttribute("color", new T3.Float32BufferAttribute(new Array(rope.geometry.attributes.position.count * 3).fill(0).map((v, i) => [.62, .5, .32][i % 3]), 3));
    uvRect(rope.geometry, A.white); rope.frustumCulled = false; rope.userData.noPick = true; D.ctx.group.add(rope);
    const m = new T3.Matrix4(), seg = (i, x, y0, y1) => { m.makeScale(1, Math.max(.01, y1 - y0), 1).setPosition(x, (y0 + y1) / 2, z); rope.setMatrixAt(i, m); };
    D.ticks.push((dt, t) => { const yl = base + Math.sin(t * .5) * .3, yc = cb - 2 * (yl - base);
      lo.position.set(x0, yl, z); cw.position.set(x0 + 3 * r, yc, z);
      seg(0, x0 - r, yl, yTop - .07); seg(1, x0 + r, yl, Y1); seg(2, x0 + 3 * r, yc, Y1); rope.instanceMatrix.needsUpdate = true; });
    D.themaLuft = {x: x0 + .2, z, r: .5}; D.zahl.flaschenzug = 1; return true; }
  return false;
}
// Blitze (Liniensegmente, alle 50–110 ms neu): in Gläsern, in der Gewitterkugel, an der Funkenstrecke
function blitzSystem(D){
  const em = D.blitz; if (!em.length) return;
  const per = 3, seg = 6, max = em.length * per * seg * 2, pos = new Float32Array(max * 3), geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.BufferAttribute(pos, 3));
  const ls = new T3.LineSegments(geo, D.MT.funke); ls.frustumCulled = false; ls.userData.noPick = true; D.ctx.group.add(ls);
  const r = U.seeded(77), a = new T3.Vector3(), b = new T3.Vector3(), p = new T3.Vector3(), q = new T3.Vector3(); let next = 0;
  D.ticks.push((dt, t) => { if (t < next && t > next - 1) return; next = t + .05 + r() * .06; let o = 0;
    for (const e of em) {
      const n = e.art === "zu" ? (r() < .35 ? 1 : 0) : per;
      for (let k = 0; k < n; k++) { if (e.art !== "zu" && r() < .3) continue;
        if (e.art === "zu") { a.copy(e.a); b.copy(e.b); }
        else { a.copy(typeof e.c === "function" ? e.c() : e.c); const th = r() * PI * 2;
          if (e.art === "kugel") { const u = r() * 2 - 1, s = Math.sqrt(1 - u * u); b.set(a.x + Math.cos(th) * s * e.r, a.y + u * e.r, a.z + Math.sin(th) * s * e.r); }
          else b.set(a.x + Math.cos(th) * e.r, a.y + (r() - .5) * 2 * e.h, a.z + Math.sin(th) * e.r); }
        const j = a.distanceTo(b) * .18; p.copy(a);
        for (let s = 1; s <= seg; s++) { q.lerpVectors(a, b, s / seg); if (s < seg) q.set(q.x + (r() - .5) * j, q.y + (r() - .5) * j, q.z + (r() - .5) * j);
          pos[o++] = p.x; pos[o++] = p.y; pos[o++] = p.z; pos[o++] = q.x; pos[o++] = q.y; pos[o++] = q.z; p.copy(q); } } }
    geo.setDrawRange(0, o / 3); geo.attributes.position.needsUpdate = true; });
}
// Blasen über dem Kessel
function blasenSystem(D){
  const src = D.blasen; if (!src.length) return;
  const n = src.length * 6, pos = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(0).map((v, i) => [.35, 1, .55][i % 3]), geo = new T3.BufferGeometry();
  geo.setAttribute("position", new T3.BufferAttribute(pos, 3)); geo.setAttribute("color", new T3.BufferAttribute(col, 3));
  const pts = new T3.Points(geo, D.MT.schein); pts.frustumCulled = false; pts.userData.noPick = true; D.ctx.group.add(pts);
  const st = []; src.forEach(c => { for (let k = 0; k < 6; k++) st.push({c, ph: k / 6, dx: (D.r() - .5) * .4, dz: (D.r() - .5) * .4}); });
  D.ticks.push((dt, t) => { st.forEach((s, i) => { const f = (t * .35 + s.ph) % 1; pos[i * 3] = s.c.x + s.dx * (1 - f * .5); pos[i * 3 + 1] = s.c.y + f * .45; pos[i * 3 + 2] = s.c.z + s.dz * (1 - f * .5); }); geo.attributes.position.needsUpdate = true; });
}

/* ---------- Platzsuche an den Wänden ---------- */
function frame(D, side, along, off = 0){ const B = D.B;
  return side === "left" ? M(B.x0 + off, 0, along, 0, PI / 2) : side === "right" ? M(B.x1 - off, 0, along, 0, -PI / 2) : side === "front" ? M(along, 0, B.z1 + off) : M(along, 0, B.z0 - off, 0, PI); }
function runs(D, side, y0, y1, d, st = .1){
  const B = D.B, [a, b] = side === "left" || side === "right" ? [B.z1, B.z0] : [B.x0, B.x1], out = []; let s = null;
  for (let u = a + st / 2; u < b; u += st) { const ok = D.ctx.frei(D.ctx.wand(side, u, y0, y1, st, d), .03);
    if (ok && s == null) s = u - st / 2; else if (!ok && s != null) { out.push([s, u - st / 2]); s = null; } }
  if (s != null) out.push([s, b]); return out;
}
function take(D, side, along, y0, y1, w, d, rand = .05){ const b = D.ctx.wand(side, along, y0, y1, w, d); if (!D.ctx.frei(b, rand)) return null; D.ctx.belege(b); return b; }
const STUECK = {
  regal:    {min: 1.1, max: 2.3, h: 2.45, d: .42, off: .25, bau: (D, w) => regal(D, w)},
  traenke:  {min: .9, max: 1.6, h: 2.2, d: .36, off: .25, bau: (D, w) => traenke(D, w)},
  kommode:  {min: .95, max: 1.6, h: 2.45, d: .46, off: .25, bau: (D, w, o) => kommode(D, w, o || "mix", true)},
  ruestung: {min: .75, max: .75, h: 2.62, d: .6, off: .28, bau: D => ruestung(D)},
  leuchter: {min: .55, max: .55, h: 2.0, d: .5, off: .3, bau: D => standleuchter(D)},
  globus:   {min: .75, max: .75, h: 1.3, d: .7, off: .3, bau: D => globus(D), einmal: true},
  armillar: {min: .8, max: .8, h: 1.98, d: .76, off: .25, bau: D => armillarStand(D), einmal: true},
  kessel:   {min: .95, max: .95, h: 1.0, d: .95, off: .2, bau: D => kessel(D), einmal: true},
  besen:    {min: .8, max: .85, h: 1.8, d: .4, off: .25, bau: (D, w) => besen(D, w), einmal: true},
  standuhr: {min: .66, max: .66, h: 2.55, d: .44, off: .25, bau: D => standuhr(D), einmal: true},
  spiegel:  {min: .85, max: .85, h: 2.1, d: .56, off: .3, bau: D => standspiegel(D), einmal: true},
  fernrohr: {min: .95, max: .95, h: 1.85, d: .95, off: .2, bau: D => fernrohr(D), einmal: true},
  gewichte: {min: .75, max: 1.1, h: .6, d: .5, off: .25, bau: (D, w) => gewichte(D, w), einmal: true},
  saeule:   {min: .62, max: .62, h: 1.62, d: .56, off: .3, bau: D => kristallsaeule(D), einmal: true},
  truhe:    {min: .85, max: 1.2, h: .65, d: .5, off: .25, bau: (D, w) => truhe(D, w)},
  bank:     {min: 1.0, max: 1.3, h: .75, d: .45, off: .25, bau: (D, w) => bank(D, w)},
  anrichte: {min: .9, max: 1.4, h: 1.45, d: .46, off: .25, bau: (D, w) => kommode(D, w, "mix", false)}
};
// frei stehende Figuren: hinter einem Exponat mischt sich ihr Umriss mit dem Exponat (Rüstung zwischen den Tauziehern, Leuchter hinter dem Versuchstisch)
const FIGUR = new Set(["ruestung", "leuchter", "spiegel", "fernrohr", "armillar", "standuhr", "besen", "saeule", "globus"]);
// das nächste passende Stück aus dem Stapel (geordnet, jedes Stück einmal) in den Abschnitt [s0, s1] stellen; der Rest bekommt das nächste Stück
// (möglichst nicht dasselbe Stück wie direkt daneben, z. B. zwei gleiche Fensterbänke nebeneinander; bei den niedrigen Stücken auch über Abschnitte hinweg)
function stellen(D, side, s0, s1, mode, vorher){
  const l = s1 - s0, L = mode === "tief" ? D.deck.tief : D.deck.hoch; if (l < .55 || !L.length) return;
  const nah = new Set(vorher ? [vorher] : []);
  if (mode === "tief") for (const p of D.plaetze) if (p.side === side && p.hi > s0 - 1.0 && p.lo < s1 + 1.0) nah.add(p.name);
  for (const gleich of [false, true]) for (let k = 0; k < L.length; k++) {
    const [name, opt] = L[k].split(":"), P = STUECK[name]; if (!P || P.min > l + 1e-6 || nah.has(name) !== gleich) continue;
    const w = Math.min(P.max, l), rest = l - w, c = rest >= .62 ? s0 + w / 2 : (s0 + s1) / 2;
    if (FIGUR.has(name) && D.exponate.some(e => e.side === side && c + w / 2 > e.z0 - .3 && c - w / 2 < e.z1 + .3)) continue;
    // hinter dem schwebenden Schild einer Station (Schrift ab 1,68 m) nur niedrige Stücke, damit die Schrift vor der Steinwand steht
    D.nahStation = D.stationen.some(s => s.side === side && Math.abs(s.u - c) < w / 2 + .9);
    const h = D.nahStation ? (name === "kommode" ? 1.45 : P.h) : P.h; if (D.nahStation && h > 1.45) continue;
    const b = take(D, side, c, 0, h, w, P.off + P.d); if (!b) continue;
    D.off = P.off; D.K.at(frame(D, side, c, P.off)); P.bau(D, w, opt);
    D.ctx.obstacleBox((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0, b.z1 - b.z0);
    L.splice(k, 1); D.plaetze.push({name, side, lo: c - w / 2, hi: c + w / 2}); D.zahl[name] = (D.zahl[name] || 0) + 1; (D.zahl.orte || (D.zahl.orte = [])).push([opt ? name + ":" + opt : name, side, +c.toFixed(2)]);
    if (rest >= .62) stellen(D, side, s0 + w + .15 + D.r() * .25, s1, mode, name);
    return true;
  }
  return false;
}
function moebel(D){
  const all = [], mitte = D.hall ? -3 : 0;
  for (const side of ["left", "right", "back", "front"]) for (const [a, b] of runs(D, side, 0, 2.62, .95)) all.push([side, a, b]);
  // zuerst die mittleren Wandfelder, vor denen nichts steht (dort sieht man die Stücke am besten), dann Ecken und Stirnwände
  const offen = ([side, a, b]) => D.ctx.frei(D.ctx.wand(side, (a + b) / 2, 0, 2, Math.max(.2, b - a - .4), 2.0), .02);   // nichts davor (auch keine Station)
  const prio = (q) => { const [side, a, b] = q; return (side === "left" || side === "right" ? Math.abs((a + b) / 2 - mitte) : 30 + Math.abs((a + b) / 2)) + (b - a < 1 ? 15 : 0) + (offen(q) ? 0 : 8); };
  all.forEach(q => q.push(prio(q))); all.sort((p, q) => p[3] - q[3]);
  for (const [side, a, b] of all) stellen(D, side, a + .06, b - .06, "hoch");
  for (const side of ["left", "right", "back", "front"]) for (const [a, b] of runs(D, side, 0, 1.5, .85)) stellen(D, side, a + .06, b - .06, "tief");
}
// Wandbilder und Wandteppiche: Mittelband (Felder ohne Tafel), Oberband (über den Tafeln)
function kunstStueck(D, side, c, l, y0, y1, wunsch){
  for (const key of wunsch) { if (!D.bildFrei(key) || (key === "thema" && !A.thema[D.thema])) continue;   // Halle: kein eigenes Themenbild (sonst leere weiße Leinwand)
    if (D.Z.bilder && !D.Z.bilder.includes(key.startsWith("tep") ? "tep" : key)) continue;   // Raumthema: nur passende Bilder (z. B. keine Wandteppiche im Spiegelsaal)
    const tep = key.startsWith("tep"), th = key === "thema", asp = tep || th ? .5 : ASP[key], f = tep ? 0 : (l > 1.6 ? .085 : .07);
    const extra = tep ? .3 : 2 * f + .04, hMax = y1 - y0 - extra; let h = Math.min(hMax, tep ? 2.5 : 2.3), w = h * asp;
    if (w + (tep ? .4 : 2 * f) > l) { w = l - (tep ? .4 : 2 * f); h = w / asp; }
    if (h < .75 || w < .5) continue;
    const yc = (y0 + y1) / 2 + (tep ? .04 : 0);
    if (!take(D, side, c, yc - h / 2 - (tep ? .2 : f) - .02, yc + h / 2 + (tep ? .1 : f) + .02, w + (tep ? .45 : 2 * f) + .06, .16)) return false;
    D.K.at(frame(D, side, c, 0)); const uv = tep ? A.tep[+key.slice(3)] : th ? A.thema[D.thema] : A.bild[key];
    if (tep) wandteppich(D, w, h, uv, M(0, yc, 0)); else bild(D, w, h, uv, f, M(0, yc, 0));
    D.bildNehmen([key]); D.zahl[tep ? "teppich" : "bild"] = (D.zahl[tep ? "teppich" : "bild"] || 0) + 1; return true;
  }
  return false;
}
function kunst(D){
  const mid = D.hall ? [2.9, 5.75] : [2.85, 5.75], hoch = D.hall ? [6.3, 8.0] : [5.0, 6.5], r = D.r;
  const gross = () => (D.hall ? [] : ["thema"]).concat(shuffle(r, ["tep0", "tep1", "tep2", "tep3"]), shuffle(r, ["zauberer", "hexe", "sterne"]));
  const quer = () => shuffle(r, ["burg", "berge", "drache", "schiff"]).concat(["sterne"]);
  for (const side of ["left", "right"]) for (const [a, b] of runs(D, side, mid[0], mid[1], .3)) { const l = b - a - .3; if (l < .9) continue;
    if (l > 2.6) kunstStueck(D, side, (a + b) / 2, l, mid[0], mid[1], quer().concat(gross())); else kunstStueck(D, side, (a + b) / 2, l, mid[0], mid[1], gross()); }
  let n = 0; for (const side of ["right", "left"]) for (const [a, b] of runs(D, side, hoch[0], hoch[1], .3)) { const l = b - a - .3; if (l < .9 || n >= (D.hall ? 6 : 4)) continue;
    if (kunstStueck(D, side, (a + b) / 2, Math.min(l, 1.9), hoch[0], hoch[1], quer().concat(["thema", "still"]))) n++; }
  for (const side of ["back", "front"]) for (const [a, b] of runs(D, side, mid[0], mid[1], .3)) { const l = b - a - .3; if (l < .8) continue; kunstStueck(D, side, (a + b) / 2, Math.min(l, 1.3), mid[0], mid[1] - .4, ["still", "zauberer", "hexe", "sterne", "schiff"]); }
}
// Vorhänge an allen Fenstern (bodenlang, sonst kurz), danach das Fenster selbst belegen
function vorhaenge(D){
  for (const [fx, z] of D.HU.fenster || []) { const side = z > 0 ? "back" : "front";
    // unterhalb der Raffung hängen die Bahnen schmal (|x − Fenstermitte| ≥ 0,72), darüber reichen sie bis 0,48 ans Fenster heran
    let lang = true; const box = (y0) => [[-1.55, -.7, y0, 2.9], [.7, 1.55, y0, 2.9], [-1.55, -.46, 2.9, 6.8], [.46, 1.55, 2.9, 6.8]].filter(([a, b, u, v]) => v > u)
      .map(([a, b, u, v]) => Object.assign({x0: fx + a, x1: fx + b, y0: u, y1: v}, side === "back" ? {z0: D.B.z0 - .45, z1: D.B.z0} : {z0: D.B.z1, z1: D.B.z1 + .45}));
    let bx = box(0); if (!bx.every(q => D.ctx.frei(q, .04))) { lang = false; bx = box(2.0); if (!bx.every(q => D.ctx.frei(q, .04))) continue; }
    bx.forEach(q => D.ctx.belege(q)); D.K.at(frame(D, side, fx, 0)); vorhang(D, lang); D.zahl.vorhang = (D.zahl.vorhang || 0) + 1; }
  for (const [fx, z] of D.HU.fenster || []) D.ctx.belege({x0: fx - .9, x1: fx + .9, y0: 2.3, y1: 6.85, z0: z - .3, z1: z + .3});
}
// Wappenschilde über den Türen an Vorder- und Rückwand
function wappenUeberTueren(D, k){
  for (const side of ["back", "front"]) { const yc = D.hall ? 6.95 : 6.78, s = .78;
    if (!take(D, side, 0, yc - s / 2 - .06, yc + s / 2 + .06, s * .7, .12)) continue; D.K.at(frame(D, side, 0, 0)); wappen(D, (k + (side === "front" ? 1 : 0)) % 4, s, M(0, yc, 0)); D.zahl.wappen = (D.zahl.wappen || 0) + 1; }
}
// Halle der Säulen, Fackeln, Banner, Balken und Kerzen belegen, damit nichts hineinragt
function huelleBelegen(D){
  const {ctx, B, H, HU} = D, bel = b => ctx.belege(b);
  for (const x of HU.saeuleX || []) for (const z of HU.pz || []) bel({x0: x - .48, x1: x + .48, y0: 0, y1: H, z0: z - .48, z1: z + .48});
  for (const z of HU.pz || []) { bel({x0: B.x0, x1: B.x0 + .34, y0: H - 1.05, y1: H, z0: z - 1.3, z1: z + 1.3}); bel({x0: B.x1 - .34, x1: B.x1, y0: H - 1.05, y1: H, z0: z - 1.3, z1: z + 1.3}); }
  for (const z of HU.balken || []) bel({x0: B.x0, x1: B.x1, y0: H - .38, y1: H, z0: z - .22, z1: z + .22});
  for (const [x, y, z, d] of HU.fackeln || []) bel({x0: d > 0 ? B.x0 : x - .65, x1: d > 0 ? x + .65 : B.x1, y0: y - .35, y1: y + 1.0, z0: z - .38, z1: z + .38});
  for (const [x, z] of HU.banner || []) bel({x0: x - .7, x1: x + .7, y0: 3.5, y1: 6.75, z0: z - .16, z1: z + .16});
  for (const [x, y, z] of ctx.kerzen || []) bel({x0: x - .1, x1: x + .1, y0: y - .32, y1: y + .5, z0: z - .1, z1: z + .1});
  for (const b of BAHNEN[ctx.key] || []) bel(b);
}
// Bahnen bewegter Raumteile im Luftraum: Die Belegung des Kerns kennt nur ihre Lage beim Aufbau, nicht den ganzen Weg
const BAHNEN = {
  beweg1: [{x0: -2.7, x1: 2.7, y0: 5.95, y1: 7.0, z0: -5.0, z1: 6.0}]   // Papierflieger mit Geschwindigkeitspfeil (20_beweg1.js): Ellipse 1,8 m × 4 m um z = 0,5 in 6,3 m Höhe
};

/* ---------- Räume ---------- */
const DECKS = {
  strom1: ["kommode:blitz", "regal", "saeule", "traenke", "leuchter", "regal", "ruestung", "kommode", "globus", "regal", "leuchter", "kessel"],
  strom2: ["kommode:blitz", "traenke", "saeule", "regal", "leuchter", "kommode", "armillar", "regal", "ruestung", "leuchter", "kessel"],
  optik1: ["kommode:linsen", "regal", "spiegel", "traenke", "leuchter", "regal", "ruestung", "kommode", "globus", "leuchter", "kessel"],
  optik2: ["kommode:linsen", "fernrohr", "regal", "spiegel", "traenke", "leuchter", "armillar", "kommode", "regal", "ruestung", "globus"],
  beweg1: ["kommode:sanduhr", "besen", "regal", "standuhr", "traenke", "leuchter", "regal", "ruestung", "kommode", "globus", "leuchter"],
  beweg2: ["kommode:sanduhr", "standuhr", "regal", "armillar", "traenke", "leuchter", "kommode", "besen", "regal", "ruestung", "kessel"],
  kraft1: ["kommode:waage", "gewichte", "regal", "traenke", "ruestung", "leuchter", "regal", "kommode", "kessel", "globus", "leuchter"],
  kraft2: ["kommode:waage", "gewichte", "regal", "ruestung", "traenke", "leuchter", "kommode", "regal", "armillar", "ruestung", "globus"],
  halle:  ["kommode", "globus", "regal"]
};
function decks(D){
  D.deck = {hoch: (D.Z.deck || DECKS[D.ctx.key] || DECKS.strom1).slice(), tief: shuffle(D.r, D.Z.tief || ["bank", "anrichte", "truhe", "bank"])};
  const used = new Set(); D.bildFrei = k => !used.has(k); D.bildNehmen = list => { const k = list.find(x => !used.has(x)); if (k) used.add(k); return k; };
}
// Raumthemen (17_raum_zauber*.js, KIT.raum[key].dekor = D.Z): ohne = ausgelassene Schritte, vorher/nachher = eigene Schritte [[Name, (D, H) => …]],
// buecher = Zahl der schwebenden Bücher; deck/tief/bilder siehe decks() und kunstStueck()
function decorRaum(D, step){
  const Z = D.Z, ohne = new Set(Z.ohne || []), s = (n, f) => { if (!ohne.has(n)) step(n, f); }, eigen = l => (l || []).forEach(([n, f]) => step(n, () => f(D, HILFE)));
  s("Hülle", () => huelleBelegen(D));
  eigen(Z.vorher);
  s("Thema", () => ({strom: gewitterkugel, optik: prismaflug, beweg: D.ctx.key === "beweg1" ? besenflug : pendel, kraft: D.ctx.key === "kraft1" ? steinflug : flaschenzug})[D.thema]?.(D));
  s("Kronleuchter", () => kronleuchterRaum(D));
  s("Vorhänge", () => vorhaenge(D));
  s("Wappen", () => wappenUeberTueren(D, Math.max(0, D.ctx.index)));
  s("Möbel", () => moebel(D));
  s("Kunst", () => kunst(D));
  s("Bücher", () => buecherflug(D, luftPlaetze(D, Z.buecher ?? 7, .5, .35, .5)));
  s("Kugeln", () => kugelflug(D, luftPlaetze(D, D.thema === "strom" || D.thema === "optik" ? 1 : 2, .4, .35, .4)));
  eigen(Z.nachher);
}

/* ---------- Halle: festlich ---------- */
function ahnenwand(D){   // Rückwand der Halle: großes Porträt über dem Mittelgang (der bis 3,2 m frei bleibt), daneben zwei Standleuchter
  if (take(D, "back", 0, 3.32, 6.4, 2.2, .16)) { D.K.at(frame(D, "back", 0, 0)); bild(D, 1.75, 2.33, A.bild.zauberer, .11, M(0, 4.86, 0)); D.bildNehmen(["zauberer"]); D.zahl.bild = (D.zahl.bild || 0) + 1;   // das Porträt nicht noch einmal an einer Seitenwand
    D.K.put("brass", box(1.5, .05, .2), M(0, 3.48, .1)); kandelaber(D, -.55, 3.505, .12, .9); kandelaber(D, .55, 3.505, .12, .9); }
  for (const s of [-1, 1]) { const P = STUECK.leuchter, b = take(D, "back", s * 1.98, 0, P.h, P.max, P.off + P.d); if (!b) continue;
    D.off = P.off; D.K.at(frame(D, "back", s * 1.98, P.off)); P.bau(D, P.max); D.ctx.obstacleBox((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0, b.z1 - b.z0); D.zahl.leuchter = (D.zahl.leuchter || 0) + 1; }
}
// Festtafel mit Tischtuch, Bänken, Tellern, Pokalen, Obstschalen und Leuchtern – frei stehend in den Seitenbereichen der Halle
function festtafel(D, cx, cz){
  const L = 2.6, T = .9, b = {x0: cx - L / 2 - .15, x1: cx + L / 2 + .15, y0: 0, y1: 1.45, z0: cz - .98, z1: cz + .98};
  if (!D.ctx.frei(b, .06)) return false; D.ctx.belege(b); D.ctx.obstacleBox(cx, cz, L + .3, 1.96);
  const K = D.K.at(M(cx, 0, cz)), r = D.r, rot = D.samtFarbe;
  K.put("wood", box(L, .06, T), M(0, .74, 0)); for (const sx of [-1, 1]) { K.put("wood", box(.08, .7, .7), M(sx * (L / 2 - .25), .36, 0)).put("wood", box(.12, .05, .8), M(sx * (L / 2 - .25), .025, 0)); }
  K.put("wood", box(L - .5, .06, .06), M(0, .2, 0));
  K.put("samt", box(L + .06, .015, T + .06), M(0, .778, 0), rot);
  for (const sz of [-1, 1]) K.put("samt", box(L + .06, .3, .012), M(0, .63, sz * (T / 2 + .036)), rot).put("samt", box(L + .07, .025, .016), M(0, .49, sz * (T / 2 + .038)), "#d9a830");
  for (const sx of [-1, 1]) K.put("samt", box(.012, .3, T + .08), M(sx * (L / 2 + .036), .63, 0), rot);
  K.put("samt", box(L - .1, .004, .3), M(0, .788, 0), "#d9a830");
  for (const sz of [-1, 1]) { K.put("wood", box(L - .3, .05, .32), M(0, .44, sz * .78)); for (const sx of [-1, 1]) K.put("wood", box(.06, .42, .26), M(sx * (L / 2 - .35), .21, sz * .78)); }
  const y = .79;
  for (const sz of [-1, 1]) for (let i = 0; i < 4; i++) { const x = -L / 2 + .35 + i * (L - .7) / 3;
    K.put("gold", cyl(.11, .09, .012, 10), M(x, y + .006, sz * .3)).put("gold", cyl(.025, .035, .01, 6), M(x + .16, y + .005, sz * .25)).put("gold", cyl(.006, .006, .07, 4), M(x + .16, y + .045, sz * .25))
     .put("gold", cyl(.035, .012, .07, 6, true), M(x + .16, y + .11, sz * .25));
    if (r() < .5) K.put("atlas", sph(.035, 5, 3), M(x + (r() - .5) * .05, y + .03, sz * .3), pick(r, ["#b3262e", "#d9a830", "#6a9a2a"])); }
  for (const x of [-.6, .6]) kandelaber(D, x, y, 0, 1.25);
  for (const x of [-1.15, 1.15]) { K.put("gold", cyl(.14, .07, .07, 10, true), M(x, y + .035, 0)).put("gold", cyl(.07, .07, .01, 8), M(x, y + .005, 0));
    for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; K.put("atlas", sph(.045, 5, 3), M(x + Math.cos(a) * .06, y + .07 + (k % 2) * .02, Math.sin(a) * .06), pick(r, ["#b3262e", "#e0a030", "#6a9a2a", "#5a2a6a"])); }
    K.put("atlas", sph(.045, 5, 3), M(x, y + .11, 0), "#d9502a"); }
  K.put("gold", cyl(.2, .2, .02, 12), M(0, y + .01, 0)).put("atlas", cyl(.17, .19, .12, 10), M(0, y + .08, 0), "#9a5a2a").put("atlas", cyl(.17, .17, .015, 10), M(0, y + .145, 0), "#f2e2c2");   // Kuchen
  for (const x of [-.4, .4]) flasche(D, x, y, (r() - .5) * .2, 1, pick(r, TRANK), 1.2);
  D.zahl.festtafel = (D.zahl.festtafel || 0) + 1; return true;
}
function deckenfahnen(D){   // lange Fahnen mit Wappentieren, an den Deckenbalken über den Seitenbereichen
  const B = D.B, H = D.H, w = .9, h = 2.6, y1 = H - .4; let n = 0;
  for (const z of D.HU.balken || []) for (const s of [-1, 1]) { if (z > 9 || z < -16 || n >= 8) continue; const x = s * 5.3;
    if (!luft(D, x, z, y1 - h - .2, y1 - .1, w / 2 + .15, .12)) continue;
    const k = n % 4, geo = (flip) => { const g = plane(w, h, 1, 1); if (flip) g.rotateY(PI); return g; };
    D.K.at(M(x, 0, z, 0, s > 0 ? -PI / 2 : PI / 2));
    D.K.put("atlas", geo(false), M(0, y1 - h / 2 - .05, .003), null, A.tep[k]).put("atlas", geo(true), M(0, y1 - h / 2 - .05, -.003), null, A.tep[k]);
    D.K.put("brass", cyl(.02, .02, w + .2, 8), M(0, y1 - .02, 0, 0, 0, PI / 2)).put("brass", sph(.035, 6, 4), M(-w / 2 - .12, y1 - .02, 0)).put("brass", sph(.035, 6, 4), M(w / 2 + .12, y1 - .02, 0));
    for (const dx of [-w / 2 + .05, w / 2 - .05]) D.K.put("iron", cyl(.004, .004, .38, 3), M(dx, y1 + .17, 0));
    for (let j = 0; j < 4; j++) D.K.put("gold", cone(.03, .1, 6), M(-w / 2 + (j + .5) * w / 4, y1 - h - .1, 0));
    n++; }
  D.zahl.fahnen = n;
}
function wimpel(D, z){   // Wimpelkette zwischen zwei Säulenkapitellen
  const B = D.B, x0 = B.x0 + .9, x1 = B.x1 - .9, top = D.H - .95, sag = .25;
  if (!luft(D, 0, z, top - sag - .42, top + .05, (x1 - x0) / 2, .1)) return;
  const n = Math.floor((x1 - x0) / .42), Y = x => top - sag * (1 - Math.pow((2 * (x - x0) / (x1 - x0) - 1), 2)), cols = ["#9b2335", "#d9a830", "#1f3a5f", "#1f4f33", "#4a2462"];
  const P = [], C = [], I = [];
  for (let i = 0; i < n; i++) { const xa = x0 + (i + .12) * (x1 - x0) / n, xb = x0 + (i + .88) * (x1 - x0) / n, xm = (xa + xb) / 2, b = P.length / 3; _c.set(cols[i % cols.length]);
    P.push(xa, Y(xa), z, xb, Y(xb), z, xm, Y(xm) - .38, z); for (let k = 0; k < 3; k++) C.push(_c.r, _c.g, _c.b); I.push(b, b + 2, b + 1); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(P, 3)); g.setAttribute("color", new T3.Float32BufferAttribute(C, 3));
  g.setAttribute("uv", new T3.Float32BufferAttribute(new Array(P.length / 3 * 2).fill(.5), 2)); g.setIndex(I); g.computeVertexNormals();
  D.K.at(M()).put("samt", g, M());
  const pts = []; for (let i = 0; i <= 24; i++) { const x = x0 + i / 24 * (x1 - x0); pts.push(new T3.Vector3(x, Y(x) + .01, z)); }
  D.K.put("atlas", new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 24, .008, 3), M(), "#d9a830"); D.zahl.wimpel = (D.zahl.wimpel || 0) + 1;
}
function decorHalle(D, step){
  step("Hülle", () => huelleBelegen(D));
  step("Ahnenwand", () => ahnenwand(D));
  step("Vorhänge", () => vorhaenge(D));
  step("Ehrenwache", () => { for (const s of [-1, 1]) for (const [x, name] of [[2.95, "ruestung"], [4.05, "leuchter"]]) { const P = STUECK[name], b = take(D, "front", s * x, 0, P.h, P.max, P.off + P.d);
    if (!b) continue; D.off = P.off; D.K.at(frame(D, "front", s * x, P.off)); P.bau(D, P.max); D.ctx.obstacleBox((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0, b.z1 - b.z0); D.zahl[name] = (D.zahl[name] || 0) + 1; } });
  step("Türbilder", () => { for (const o of D.ctx._inter) { const ia = o.userData.ia; if (!ia || ia.kind !== "door" || !ia.topic) continue;
    // über der Tür (deren Weg bis 6,2 m Höhe frei bleibt) ein Bild zum Thema des Raums
    const th = ia.topic.replace(/\d+$/, ""), side = o.position.x < 0 ? "left" : "right", z = o.position.z, w = .75, h = 1.5, f = .08, yc = 7.17;
    if (!A.thema[th] || !take(D, side, z, yc - h / 2 - f - .02, yc + h / 2 + f + .02, w + 2 * f + .06, .16)) continue;
    D.K.at(frame(D, side, z, 0)); bild(D, w, h, A.thema[th], f, M(0, yc, 0)); D.zahl.tuerbild = (D.zahl.tuerbild || 0) + 1; } });
  step("Wappen", () => wappenUeberTueren(D, 0));
  // Festtafeln im vorderen Teil der Halle (hinten bleibt der Blick vom Eingang auf die Seitentüren frei)
  step("Festtafeln", () => { let n = 0; for (const z of (D.HU.pz || []).filter(z => z < -2 && z > -15)) for (const s of [-1, 1]) if (n < 3 && festtafel(D, s * 4.4, z)) n++; });
  step("Möbel", () => moebel(D));
  step("Kunst", () => kunst(D));
  step("Kronleuchter", () => { for (const z of [-4.5, 4.5, -13.5]) { const yTop = D.H - .36; if (!luft(D, 0, z, yTop - 1.2, yTop - .14, 1.45, 1.45)) continue;
    D.K.at(M(0, yTop, z)); kronleuchter(D.K, 1.2, .3, (x, y, zz) => D.flame(x, y, zz)); D.zahl.kronleuchter = (D.zahl.kronleuchter || 0) + 1; } });
  step("Wimpel", () => { for (const z of [2.5, -11.5]) wimpel(D, z); });
  step("Fahnen", () => deckenfahnen(D));
  step("Bücherkreis", () => { const c = {x: 0, z: -3.5, r: 3.1, w: .13}; if (!luft(D, 0, c.z, 3.85, 4.6, c.r + .45, c.r + .45, false)) return;   // kreist bewusst um die Sanduhr
    buecherflug(D, Array.from({length: 7}, (_, i) => [0, 4.2 + (i % 2) * .1, 0]), c); });
}

/* ---------- Einstieg ---------- */
function setup(ctx, hall){
  const MT = mats(), K = bucket(), key = ctx.key, th = hall ? "halle" : String(key).replace(/\d+$/, "");
  const D = {ctx, hall, MT, K, B: ctx.bounds, H: ctx.height || 7.5, HU: ctx.huelle || {pz: ctx.decorZ || [], saeuleX: [], fackeln: [], fenster: [], banner: [], balken: []},
    r: U.seeded([...String(key)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11)), thema: th, flames: [], halos: [], ticks: [], blitz: [], blasen: [], plaetze: [], off: 0, zahl: {}};
  const RZ = !hall && !ctx._raumFehler && KIT.raum && KIT.raum[key];   // Raumthema (17_raum_zauber*.js); fehlt es oder scheiterte die Raumhülle: bisherige Ausstattung
  D.Z = (RZ && RZ.dekor) || {};
  D.samtFarbe = {strom: "#3a50a8", optik: "#6e2f90", beweg: "#2e6e46", kraft: "#962638", halle: "#962638"}[th] || "#962638";
  D.w = (x, y, z) => new T3.Vector3(x, y, z).applyMatrix4(K.base);
  D.flame = (x, y, z) => D.flames.push(D.w(x, y, z));
  D.halo = (x, y, z, c) => D.halos.push([D.w(x, y, z), c]);
  D.place = (obj, m) => { const h = new T3.Group(); h.applyMatrix4(new T3.Matrix4().multiplyMatrices(K.base, m)); h.add(obj); h.userData.noPick = true; ctx.group.add(h); return h; };
  decks(D);
  D.stationen = (ctx._inter || []).filter(o => o.userData.ia && o.userData.ia.kind === "station").map(o => ({side: o.position.x < 0 ? "left" : "right", u: o.position.z}));
  // Exponate an den Seitenwänden (Bereich entlang der Wand): davor stehen keine frei stehenden Figuren (Rüstung, Leuchter …), die sich mit dem Umriss mischen
  D.exponate = []; ctx.group.updateMatrixWorld(true);
  for (const o of ctx._inter || []) { const ia = o.userData.ia; if (!ia || ia.kind !== "exhibit") continue; const b = new T3.Box3().setFromObject(o); if (b.isEmpty()) continue;
    if (b.min.x < D.B.x0 + 3.2) D.exponate.push({side: "left", z0: b.min.z, z1: b.max.z}); if (b.max.x > D.B.x1 - 3.2) D.exponate.push({side: "right", z0: b.min.z, z1: b.max.z}); }
  D.sicht = sichtZiele(D);   // vor dem ersten eigenen Teil: nur Raum, Türen, Exponate und Lernstationen
  return D;
}
function finish(D){
  const MT = D.MT, g = D.ctx.group;
  const built = D.K.build(g, MT); D.zahl.dreiecke = Object.values(built).reduce((a, m) => a + (m.geometry.index ? m.geometry.index.count / 3 : 0), 0); D.zahl.meshes = Object.keys(built).length;
  if (D.flames.length) { const p = new T3.Points(new T3.BufferGeometry().setFromPoints(D.flames), MT.flamme); p.userData.noPick = true; g.add(p); }
  if (D.halos.length) { const pos = [], col = []; for (const [v, c] of D.halos) { pos.push(v.x, v.y, v.z); _c.set(c); col.push(_c.r, _c.g, _c.b); }
    const geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new T3.Float32BufferAttribute(col, 3));
    const p = new T3.Points(geo, MT.schein); p.userData.noPick = true; g.add(p);
    const live = []; D.halos.forEach(([v, c, l], i) => { if (l) live.push([v, i]); });   // Gewitterkugel: der Schein folgt der Kugel
    if (live.length) D.ticks.push(() => { const a = geo.attributes.position.array; for (const [v, i] of live) { a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; } geo.attributes.position.needsUpdate = true; }); }
  blitzSystem(D); blasenSystem(D);
  D.ticks.push((dt, t) => { MT.flamme.size = .25 + .03 * Math.sin(t * 9.3) + .02 * Math.sin(t * 23.7); MT.schein.opacity = .68 + .07 * Math.sin(t * 2.1); });
  for (const f of D.ticks) D.ctx.tick(f);
  D.ctx.dekor = D.zahl;
}
KIT.decor = (ctx, {hall} = {}) => {
  const D = setup(ctx, hall);
  const step = (name, fn) => { try { fn(); } catch (e) { console.error("Ausstattung (" + name + ")", e); } };
  if (hall) decorHalle(D, step); else decorRaum(D, step);
  finish(D);
};
KIT.decorAtlas = () => atlasTex();
// Werkzeug der Ausstattung für die Raumthemen (17_raum_zauber*.js): eigene Stücke in STUECK eintragen, eigene Schritte mit Sammler, Platzsuche und kleinen Gegenständen
const HILFE = KIT.dekorHilfe = {M, box, cyl, sph, tor, cone, plane, uvRect, along, merge, bucket, A, ASP, TRANK, LEDER, pick, shuffle, frame, runs, take, luft, luftPlaetze, sichtFrei,
  STUECK, FIGUR, stellen, flasche, kerze, kandelaber, sanduhr, buchstapel, kristallkugel, armillar, globusKlein, rollen, tintenfass, truhe, kommode, bild, wandteppich, kessel, mats};
})();
