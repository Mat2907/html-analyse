/* ---------- 14_dekor_sterne.js ---------- */
/* =====================================================================
   Ausstattung der Welt „Weltraum-Saga“ (Innenraum einer Raumstation): R3D.kits.sterne.decor(ctx, {hall})
   Läuft nach Raum, Lernstationen und Stimmung (RAUM-API.md, „Ausstattung eines Weltstils“) und nimmt nur Plätze, die ctx.frei() meldet.
   - Seitenwände unter den Tafeln: Frachtregale mit Kisten, Spinde mit Bank, Datenarchiv mit leuchtenden Datenkristallen, Werkzeugwand mit
     Werkbank, Hydrokultur-Röhren, Raumanzug-Vitrine, Sitzbank mit Ladestation; neben den Türen Pflanzen in Hydro-Töpfen
   - freie Wandfelder: gerahmte Bilder mit Bilderleuchte (Sternkarte, Reiseposter, Bauplan, Nebel, Planetenbahnen, Mondlandschaft),
     an den Wandenden Sektor-Banner und Sicherheitsplakate, über den Tafeln Missionsabzeichen
   - Panoramafenster: gerafte Thermovorhänge und eine halb herabgelassene Lamellenblende
   - Luftraum: Wartungsdrohnen und ein Holo-Globus, die langsam kreisen
   - je Raum Dinge zum Thema (Energiezellen, Leitungsbündel, Linsen-Vitrine, Spiegelsegel, Teleskop, Linsenstapel, Schiffsmodelle,
     Schubdüsen-Prüfstand, Gewichtsplatten, Federwand, Ladekran mit Asteroidenbrocken, Federplattform)
   - Halle (festlich): Lichterketten vom Oberlicht, Lichtvorhang am großen Fenster, Sektor-Banner und -Abzeichen je Tür, Stationsmodell
   Sparsam: Teile je Material zu einem Mesh verschmolzen, Kisten/Kristalle/Drohnen instanziert, Bilder in zwei Textur-Atlanten (1024²),
   kein Schattenwurf, keine Lichter; Zufall nur über eigene, feste Startwerte.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D;
if (!T3 || !R3D || !R3D.kits || !R3D.kits.sterne || !R3D.kits.sterne.lib) return;
const K = R3D.kits.sterne, L = K.lib, U = R3D.util, FONT = K.font, CYAN = L.CYAN, YEL = L.YEL, SECTOR = L.SECTOR;
const PI = Math.PI, TAU = PI * 2;
const hashS = s => String(s).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);

/* ---------- Zeichenhilfen ---------- */
function nz(g, w, h, n, a, cols, r){ for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.globalAlpha = a * r(); const s = 1 + r() * 2; g.fillRect(r() * w, r() * h, s, s); } g.globalAlpha = 1; }
function starsF(g, w, h, n, r, a = 1){
  for (let i = 0; i < n; i++) { const big = r() > .93, s = big ? 1.3 + r() * 1.1 : .5 + r() * .8, t = r();
    g.fillStyle = `rgba(${t < .2 ? "255,232,200" : t < .4 ? "190,214,255" : "255,255,255"},${((.35 + r() * .65) * a).toFixed(3)})`; g.beginPath(); g.arc(r() * w, r() * h, s, 0, TAU); g.fill(); } }
function star5(g, x, y, r){ g.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, q = i % 2 ? r * .45 : r; if (i) g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); else g.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }
function glowDot(g, x, y, r, rgb, a){ const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function poly(g, pts, s = 1){ g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * s, y * s) : g.moveTo(x * s, y * s)); g.closePath(); }
function vents(g, x, y, w, h, n){ const sh = h / (n * 2 - 1); for (let i = 0; i < n; i++) { g.fillStyle = "#1c232c"; g.beginPath(); g.roundRect(x, y + i * sh * 2, w, sh, sh / 2); g.fill(); g.fillStyle = "rgba(255,255,255,.16)"; g.fillRect(x + 3, y + i * sh * 2 + sh, w - 6, 1.5); } }
function fitText(g, txt, maxW, px, weight = 700, font = FONT){ let f = px; g.font = `${weight} ${f}px ${font}`; while (g.measureText(txt).width > maxW && f > 8) { f -= 1; g.font = `${weight} ${f}px ${font}`; } return f; }

/* ---------- Bild-Atlas (6 Gemälde, je 512 × 341) ---------- */
const ART = i => [(i % 2) * 512, Math.floor(i / 2) * 341, 512, 341];
function sternkarte(g, w, h, r){
  const bg = g.createRadialGradient(w * .5, h * .45, 20, w * .5, h * .5, w * .7); bg.addColorStop(0, "#16345f"); bg.addColorStop(1, "#060f20"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(140,190,255,.14)"; g.lineWidth = 1;
  for (let x = 16; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 10; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  const cx = w / 2, cy = h / 2 - 12; g.strokeStyle = "rgba(160,205,255,.4)"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 138, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, 70, 0, TAU); g.stroke();
  for (let k = 0; k < 72; k++) { const a = k / 72 * TAU, r0 = k % 6 ? 132 : 124; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * 138, cy + Math.sin(a) * 138); g.stroke(); }
  g.setLineDash([6, 5]); g.strokeStyle = "rgba(255,214,90,.55)"; g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = h * .48 + Math.sin(x / w * TAU) * 58; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
  starsF(g, w, h - 34, 260, r, .9);
  const figs = [[[66, 64], [102, 48], [140, 60], [170, 36], [150, 94], [110, 102]], [[300, 64], [334, 88], [372, 82], [404, 108], [366, 132]], [[86, 206], [128, 232], [176, 222], [206, 252], [160, 272]], [[318, 196], [350, 226], [394, 214], [424, 246], [382, 264], [344, 258]]];
  ["KRONE", "SEGLER", "PFEIL", "LEIER"].forEach((nm, k) => { const f = figs[k]; g.strokeStyle = "rgba(120,220,255,.8)"; g.lineWidth = 1.8; g.beginPath(); f.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    f.forEach(([x, y], i) => { glowDot(g, x, y, i % 3 ? 8 : 12, "210,235,255", 1); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, i % 3 ? 1.8 : 2.6, 0, TAU); g.fill(); });
    g.fillStyle = "rgba(200,235,255,.92)"; g.font = `600 13px ${FONT}`; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText(nm, f[0][0] - 8, f[0][1] - 14); });
  g.fillStyle = "rgba(4,10,22,.86)"; g.fillRect(0, h - 34, w, 34); g.fillStyle = "#ffd65a"; g.font = `700 17px ${FONT}`; g.textBaseline = "middle"; g.textAlign = "left"; g.fillText("STERNKARTE · NÖRDLICHER HIMMEL", 16, h - 17);
  g.fillStyle = "rgba(190,220,255,.85)"; g.font = `500 12px ${FONT}`; g.textAlign = "right"; g.fillText("RA 0 h – 24 h", w - 14, h - 17);
  g.strokeStyle = "#c9a54a"; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
}
function reiseposter(g, w, h, r){
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#141033"); sky.addColorStop(.45, "#4b2466"); sky.addColorStop(.72, "#c8506a"); sky.addColorStop(.86, "#f59a52"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  starsF(g, w, h * .5, 90, r, .8);
  const px = 336, py = 132, pr = 76;
  const ring = front => { g.save(); g.translate(px, py); g.rotate(-.32); g.scale(1, .26); g.lineWidth = 16; g.strokeStyle = "rgba(255,226,180,.78)"; g.beginPath(); g.arc(0, 0, 140, front ? 0 : PI, front ? PI : TAU); g.stroke();
    g.lineWidth = 7; g.strokeStyle = "rgba(255,200,150,.5)"; g.beginPath(); g.arc(0, 0, 116, front ? 0 : PI, front ? PI : TAU); g.stroke(); g.restore(); };
  ring(false);
  const pg = g.createLinearGradient(px - pr, py - pr, px + pr, py + pr); pg.addColorStop(0, "#ffe2b0"); pg.addColorStop(.5, "#e89a5a"); pg.addColorStop(1, "#7a3a3a"); g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(px, py, pr, 0, TAU); g.clip(); for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? "rgba(255,240,210,.18)" : "rgba(150,70,50,.2)"; g.fillRect(px - pr, py - pr + i * 23 + 6, pr * 2, 9); }
  const sh = g.createLinearGradient(px - pr, 0, px + pr, 0); sh.addColorStop(.5, "rgba(20,8,30,0)"); sh.addColorStop(1, "rgba(20,8,30,.72)"); g.fillStyle = sh; g.fillRect(px - pr, py - pr, pr * 2, pr * 2); g.restore();
  ring(true);
  g.fillStyle = "#f3e9ff"; g.beginPath(); g.arc(96, 128, 14, 0, TAU); g.fill(); g.fillStyle = "rgba(60,30,90,.5)"; g.beginPath(); g.arc(102, 124, 14, 0, TAU); g.fill();
  g.fillStyle = "#3a1840"; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 250); [[40, 232], [90, 256], [150, 222], [210, 250], [270, 236], [330, 262], [400, 228], [460, 250], [512, 238]].forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(w, h); g.fill();
  g.fillStyle = "#1f0c26"; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 290); [[60, 276], [140, 298], [220, 280], [300, 300], [380, 284], [450, 296], [512, 286]].forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(w, h); g.fill();
  g.fillStyle = "#2c1434"; g.beginPath(); g.arc(150, 288, 26, PI, TAU); g.fill(); g.fillRect(176, 276, 40, 12); g.beginPath(); g.arc(232, 288, 16, PI, TAU); g.fill();
  g.fillStyle = "#ffd36b"; for (const [x, y] of [[138, 278], [150, 274], [162, 278], [190, 280], [228, 282]]) g.fillRect(x, y, 4, 3);
  g.strokeStyle = "#2c1434"; g.lineWidth = 2; g.beginPath(); g.moveTo(150, 262); g.lineTo(150, 238); g.stroke(); g.fillStyle = "#ff5c7a"; g.beginPath(); g.arc(150, 237, 2.5, 0, TAU); g.fill();
  g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = "#fff4dc"; g.font = `800 42px ${FONT}`; g.fillText("KELVOS III", 24, 58);
  g.font = `600 14px ${FONT}`; g.fillStyle = "#ffd9a8"; g.fillText("REISEZIEL DER SAISON", 26, 80);
  g.textAlign = "center"; g.font = `600 13px ${FONT}`; g.fillStyle = "#ffe6c4"; g.fillText("Shuttle täglich ab Andockring B · Ringblick inklusive", w / 2, h - 14);
  g.strokeStyle = "#fff1d6"; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
}
function bauplan(g, w, h){
  g.fillStyle = "#123a6b"; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) { g.fillStyle = x % 64 ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.15)"; g.fillRect(x, 0, 1, h); }
  for (let y = 0; y < h; y += 16) { g.fillStyle = y % 64 ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.15)"; g.fillRect(0, y, w, 1); }
  g.strokeStyle = "rgba(235,245,255,.92)"; g.lineWidth = 2; const cx = 156, cy = 150;
  for (const rr of [112, 96, 26, 12]) { g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke(); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .26; g.beginPath(); g.moveTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); g.lineTo(cx + Math.cos(a) * 96, cy + Math.sin(a) * 96); g.stroke();
    g.save(); g.translate(cx + Math.cos(a + .52) * 104, cy + Math.sin(a + .52) * 104); g.rotate(a + .52); g.strokeRect(-8, -14, 16, 28); g.restore(); }
  const sx = 392; g.strokeRect(sx - 70, cy - 12, 140, 24); g.beginPath(); g.ellipse(sx, cy, 18, 104, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(sx, cy, 10, 92, 0, 0, TAU); g.stroke();
  for (const s of [-1, 1]) g.strokeRect(s > 0 ? sx + 70 : sx - 92, cy - 4, 22, 8);
  g.lineWidth = 1.5; for (const s of [-1, 1]) { const x0 = sx + s * 92, x1 = sx + s * 124; g.strokeRect(Math.min(x0, x1), cy - 36, 32, 72); for (let k = 1; k < 4; k++) { const xx = Math.min(x0, x1) + k * 8; g.beginPath(); g.moveTo(xx, cy - 36); g.lineTo(xx, cy + 36); g.stroke(); } }
  g.lineWidth = 1; g.strokeStyle = "rgba(200,230,255,.85)"; g.beginPath(); g.moveTo(cx - 112, 284); g.lineTo(cx + 112, 284); g.moveTo(cx - 112, 276); g.lineTo(cx - 112, 292); g.moveTo(cx + 112, 276); g.lineTo(cx + 112, 292); g.stroke();
  g.fillStyle = "#eaf4ff"; g.font = `600 13px ${FONT}`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText("Ø 240 m", cx, 278);
  g.beginPath(); g.moveTo(sx + 146, 46); g.lineTo(sx + 146, 254); g.stroke(); g.save(); g.translate(sx + 160, cy); g.rotate(-PI / 2); g.fillText("DECK 1 – 8", 0, 0); g.restore();
  g.strokeStyle = "#eaf4ff"; g.lineWidth = 1.5; g.strokeRect(296, 280, 206, 50); g.beginPath(); g.moveTo(296, 304); g.lineTo(502, 304); g.stroke();
  g.textAlign = "left"; g.font = `700 14px ${FONT}`; g.fillText("STATIONSRING · BAUPLAN", 304, 297); g.font = `500 12px ${FONT}`; g.fillText("Blatt 3 / 12 · Maßstab 1 : 2000", 304, 321);
}
function nebel(g, w, h, r){
  g.fillStyle = "#03040a"; g.fillRect(0, 0, w, h); starsF(g, w, h, 220, r, .7);
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 80; i++) { const t = i / 80, x = 60 + t * 400 + (r() - .5) * 70, y = 210 - Math.sin(t * PI) * 110 + (r() - .5) * 70, rr = 30 + r() * 64;
    glowDot(g, x, y, rr, i % 3 ? "230,80,150" : "60,200,220", .05 + r() * .07); }
  for (let i = 0; i < 12; i++) glowDot(g, 120 + r() * 280, 100 + r() * 120, 8 + r() * 14, "255,240,250", .35);
  g.globalCompositeOperation = "source-over";
  g.strokeStyle = "rgba(10,4,12,.35)"; g.lineCap = "round"; for (let i = 0; i < 6; i++) { g.lineWidth = 6 + r() * 14; g.beginPath(); const x = 140 + r() * 220, y = 120 + r() * 100; g.moveTo(x, y); g.bezierCurveTo(x + 40, y - 30, x + 80, y + 20, x + 130, y - 10); g.stroke(); }
  for (const [x, y, s] of [[110, 80, 7], [400, 60, 9], [300, 270, 6], [460, 220, 5]]) { g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - s * 2, y); g.lineTo(x + s * 2, y); g.moveTo(x, y - s * 2); g.lineTo(x, y + s * 2); g.stroke(); glowDot(g, x, y, s, "255,255,255", .95); }
  g.save(); g.translate(92, 270); g.rotate(-.35); g.fillStyle = "#c9d3de"; poly(g, [[26, 0], [-14, -8], [-20, 0], [-14, 8]]); g.fill(); g.fillStyle = "#7d8a99"; g.fillRect(-12, -14, 10, 28);
  const fl = g.createLinearGradient(-20, 0, -72, 0); fl.addColorStop(0, "rgba(140,220,255,.95)"); fl.addColorStop(1, "rgba(140,220,255,0)"); g.fillStyle = fl; g.fillRect(-72, -3, 52, 6); g.restore();
  g.strokeStyle = "#1c2230"; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
}
function bahnen(g, w, h, r){
  const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, "#1a1608"); bg.addColorStop(.25, "#0b1424"); bg.addColorStop(1, "#070c18"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  starsF(g, w, h, 120, r, .5);
  const sx = 36, sy = h / 2 + 10; glowDot(g, sx, sy, 92, "255,170,60", .55); glowDot(g, sx, sy, 34, "255,246,216", 1);
  [[92, 7, "#c7b39a", "ARIS"], [152, 10, "#e3a35a", "BENU"], [218, 11, "#5fa8e8", "CYRA"], [292, 8, "#d06a4a", "DOMA"], [380, 22, "#e8c890", "ELIO"], [458, 15, "#8fd0e0", "FENA"]].forEach(([rr, s, c, n], i) => {
    g.strokeStyle = "rgba(160,200,255,.38)"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(sx, sy, rr, rr * .8, 0, -1.15, 1.15); g.stroke();
    const a = [-.5, .35, -.2, .6, -.08, .3][i], x = sx + Math.cos(a) * rr, y = sy + Math.sin(a) * rr * .8;
    const pg = g.createRadialGradient(x - s * .4, y - s * .4, 1, x, y, s); pg.addColorStop(0, "#fff"); pg.addColorStop(.3, c); pg.addColorStop(1, "#141414"); g.fillStyle = pg; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    if (i === 4) { g.strokeStyle = "rgba(240,215,170,.85)"; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, s * 1.9, s * .5, -.3, 0, TAU); g.stroke(); }
    g.fillStyle = "rgba(220,235,255,.92)"; g.font = `600 12px ${FONT}`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(n, x, y + s + 15); });
  g.fillStyle = "#ffd65a"; g.font = `700 18px ${FONT}`; g.textAlign = "left"; g.fillText("PLANETENBAHNEN · SYSTEM KELVOS", 16, 30);
  g.fillStyle = "rgba(200,225,255,.78)"; g.font = `500 12px ${FONT}`; g.fillText("Bahnen nicht maßstäblich", 16, 48);
  g.strokeStyle = "#c9a54a"; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
}
function mondland(g, w, h, r){
  const sky = g.createLinearGradient(0, 0, 0, h * .7); sky.addColorStop(0, "#02040a"); sky.addColorStop(1, "#0f1c36"); g.fillStyle = sky; g.fillRect(0, 0, w, h); starsF(g, w, h * .62, 160, r, .9);
  const px = 360, py = 108, pr = 64; glowDot(g, px, py, pr + 18, "120,190,255", .35);
  const pg = g.createRadialGradient(px - 20, py - 20, 4, px, py, pr); pg.addColorStop(0, "#a4e3ff"); pg.addColorStop(.6, "#2f7fc0"); pg.addColorStop(1, "#163e70"); g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(px, py, pr, 0, TAU); g.clip(); g.fillStyle = "rgba(80,170,90,.78)"; for (const [x, y, rx, ry] of [[-20, -10, 26, 16], [18, 22, 20, 12], [30, -30, 14, 9]]) { g.beginPath(); g.ellipse(px + x, py + y, rx, ry, .4, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(px - 10 + k * 8, py - 6 + k * 12, 40 + k * 6, 3.6, 4.6); g.stroke(); }
  const sh = g.createLinearGradient(px - pr, py - pr, px + pr, py + pr); sh.addColorStop(.48, "rgba(0,0,0,0)"); sh.addColorStop(.85, "rgba(0,0,0,.78)"); g.fillStyle = sh; g.fillRect(px - pr, py - pr, 2 * pr, 2 * pr); g.restore();
  const gr = g.createLinearGradient(0, 220, 0, h); gr.addColorStop(0, "#9a9ca3"); gr.addColorStop(1, "#4a4c52"); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 236); g.bezierCurveTo(120, 214, 260, 246, 380, 226); g.bezierCurveTo(440, 218, 490, 230, w, 224); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  for (let i = 0; i < 14; i++) { const x = r() * w, y = 252 + r() * 78, rr = 6 + r() * 22; g.fillStyle = "rgba(40,42,48,.45)"; g.beginPath(); g.ellipse(x, y, rr, rr * .3, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(220,222,228,.35)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y + 1, rr, rr * .3, 0, 0, PI); g.stroke(); }
  g.fillStyle = "#c9a54a"; g.fillRect(80, 232, 46, 22); g.fillStyle = "#dfe3e8"; poly(g, [[84, 232], [92, 214], [114, 214], [122, 232]]); g.fill();
  g.strokeStyle = "#9aa1aa"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(82, 252); g.lineTo(68, 272); g.moveTo(124, 252); g.lineTo(138, 272); g.moveTo(103, 254); g.lineTo(103, 272); g.stroke();
  const fx = 240, fy = 262; g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(fx + 14, fy + 2, 26, 4, 0, 0, TAU); g.fill();
  g.fillStyle = "#eef0f3"; g.beginPath(); g.ellipse(fx, fy - 30, 11, 16, 0, 0, TAU); g.fill(); g.fillRect(fx - 9, fy - 18, 7, 20); g.fillRect(fx + 2, fy - 18, 7, 20);
  g.beginPath(); g.arc(fx, fy - 52, 10, 0, TAU); g.fill(); g.fillStyle = "#d9a53a"; g.beginPath(); g.ellipse(fx + 3, fy - 52, 6, 5, 0, 0, TAU); g.fill(); g.fillStyle = "#b9c0c8"; g.fillRect(fx - 17, fy - 44, 7, 16);
  g.strokeStyle = "#eef0f3"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(fx + 8, fy - 38); g.lineTo(fx + 22, fy - 46); g.stroke();
  g.strokeStyle = "#b9c0c8"; g.lineWidth = 2; g.beginPath(); g.moveTo(fx + 24, fy - 4); g.lineTo(fx + 24, fy - 80); g.stroke();
  g.fillStyle = "#2a5fa8"; g.fillRect(fx + 25, fy - 80, 40, 26); g.fillStyle = "#ffd65a"; star5(g, fx + 45, fy - 67, 8);
  g.strokeStyle = "#20252c"; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
}
function artTex(){ return U.canvasTex(1024, 1024, g => {
  g.fillStyle = "#000"; g.fillRect(0, 0, 1024, 1024); const r = U.seeded(8123);
  [sternkarte, reiseposter, bauplan, nebel, bahnen, mondland].forEach((f, i) => { const [x, y, w, h] = ART(i); g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, w, h); g.clip(); f(g, w, h, r); g.restore(); });
}, "sd-art"); }

/* ---------- Druck-Atlas: Banner, Abzeichen, Plakate, Kisten, Spinde, Werkzeug, Anzeigen ---------- */
const PR = {
  banner: i => [i * 128, 0, 128, 384], badge: i => [i * 128, 384, 128, 128], poster: i => [i * 160, 512, 160, 256],
  crate: [640, 512, 256, 256], locker: [896, 512, 128, 512], tools: [0, 768, 384, 192], sos: [384, 768, 128, 192],
  archiv: [512, 768, 256, 64], energie: [512, 832, 256, 128], gauge: [768, 768, 128, 128], warn: [768, 896, 128, 128],
  plaque: [0, 960, 256, 64], kg: i => [256 + i * 64, 960, 64, 64], lade: [512, 960, 128, 64], hydro: [640, 960, 128, 64]
};
const ICON = [
  g => { g.fillStyle = YEL; poly(g, [[-.15, -1], [.45, -1], [.08, -.2], [.42, -.2], [-.3, 1.05], [-.04, .12], [-.42, .12]], g.S); g.fill(); },
  (g, c) => { const s = g.S; g.beginPath(); g.moveTo(-s, 0); g.lineTo(-.3 * s, 0); g.lineTo(.25 * s, -.55 * s); g.lineTo(s, -.55 * s); g.moveTo(-.3 * s, 0); g.lineTo(.25 * s, .55 * s); g.lineTo(s, .55 * s); g.moveTo(-.3 * s, 0); g.lineTo(s, 0); g.stroke();
    for (const [x, y] of [[-1, 0], [1, -.55], [1, 0], [1, .55]]) { g.fillStyle = c; g.beginPath(); g.arc(x * s, y * s, .17 * s, 0, TAU); g.fill(); g.stroke(); } },
  g => { const s = g.S, lw = g.lineWidth; g.beginPath(); g.moveTo(-s, .55 * s); g.lineTo(s, .55 * s); g.stroke(); g.lineWidth = lw * .5; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(k * .22 * s, .62 * s); g.lineTo(k * .22 * s - .2 * s, .86 * s); g.stroke(); }
    g.strokeStyle = YEL; g.lineWidth = lw; g.beginPath(); g.moveTo(-.8 * s, -.85 * s); g.lineTo(0, .5 * s); g.lineTo(.8 * s, -.85 * s); g.stroke(); },
  g => { const s = g.S; g.save(); g.rotate(-.6); g.fillRect(-.9 * s, -.17 * s, 1.5 * s, .34 * s); g.fillRect(.58 * s, -.24 * s, .26 * s, .48 * s); g.restore();
    g.beginPath(); g.moveTo(-.1 * s, .1 * s); g.lineTo(-.5 * s, s); g.moveTo(-.1 * s, .1 * s); g.lineTo(.3 * s, s); g.stroke(); g.fillStyle = YEL; star5(g, .62 * s, -.72 * s, .28 * s); },
  g => { const s = g.S; poly(g, [[0, -1.05], [.62, .55], [.18, .32], [0, .7], [-.18, .32], [-.62, .55]], s); g.fill(); g.fillStyle = CYAN; g.beginPath(); g.arc(0, .84 * s, .14 * s, 0, TAU); g.fill(); },
  g => { const s = g.S; poly(g, [[-.35, -.9], [.35, -.9], [.6, .05], [-.6, .05]], s); g.fill(); const fl = g.createLinearGradient(0, .05 * s, 0, s); fl.addColorStop(0, "#fff3b0"); fl.addColorStop(.5, "#ff9a3d"); fl.addColorStop(1, "rgba(255,90,40,0)");
    g.fillStyle = fl; g.beginPath(); g.moveTo(-.5 * s, .08 * s); g.quadraticCurveTo(0, 1.45 * s, .5 * s, .08 * s); g.fill(); },
  g => { const s = g.S; poly(g, [[-.4, -.75], [.4, -.75], [.6, .1], [-.6, .1]], s); g.fill(); g.fillStyle = "#0a1626"; g.font = `800 ${(.42 * s).toFixed(1)}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("kg", 0, -.3 * s);
    g.strokeStyle = YEL; g.beginPath(); g.moveTo(0, .3 * s); g.lineTo(0, .95 * s); g.moveTo(-.25 * s, .7 * s); g.lineTo(0, .98 * s); g.lineTo(.25 * s, .7 * s); g.stroke(); },
  g => { const s = g.S; poly(g, [[-.7, .25], [-.4, -.2], [.1, -.3], [.6, -.1], [.75, .35], [.4, .8], [-.2, .85], [-.65, .6]], s); g.fill(); g.fillStyle = "rgba(10,22,38,.45)"; g.beginPath(); g.arc(.15 * s, .3 * s, .16 * s, 0, TAU); g.fill(); g.beginPath(); g.arc(-.3 * s, .5 * s, .1 * s, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(0, -.3 * s); g.lineTo(0, -1.0 * s); g.stroke(); g.beginPath(); g.arc(0, -.45 * s, .17 * s, PI * .05, PI * 1.05); g.stroke(); }
];
function emblem(g, i, x, y, r){
  const c = SECTOR[i % 8]; g.save(); g.translate(x, y);
  g.fillStyle = "#0a1626"; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.lineWidth = r * .16; g.strokeStyle = c; g.beginPath(); g.arc(0, 0, r * .9, 0, TAU); g.stroke();
  g.lineWidth = Math.max(1, r * .03); g.strokeStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(0, 0, r * .74, 0, TAU); g.stroke();
  g.fillStyle = "#fff"; for (let k = 0; k < 3; k++) { const a = -PI / 2 + (k - 1) * .42; star5(g, Math.cos(a) * r * .9, Math.sin(a) * r * .9, r * .085); }
  g.strokeStyle = "#ffffff"; g.fillStyle = "#ffffff"; g.lineWidth = r * .09; g.lineCap = "round"; g.lineJoin = "round"; g.S = r * .42; g.translate(0, r * .04);
  ICON[i % 8](g, c); g.restore();
}
function drawBanner(g, i, [x, y, w, h]){
  const c = SECTOR[i]; g.save(); g.translate(x, y); poly(g, [[3, 0], [w - 3, 0], [w - 3, h - 3], [w / 2, h - 46], [3, h - 3]]); g.clip();
  const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, "#0b1524"); bg.addColorStop(.5, "#18283e"); bg.addColorStop(1, "#0b1524"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let xx = 6; xx < w; xx += 4) { g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(xx, 0, 1.5, h); }
  g.fillStyle = c; g.fillRect(0, 0, w, 32); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 30, w, 4); g.fillStyle = c; g.fillRect(10, 40, 3, h - 92); g.fillRect(w - 13, 40, 3, h - 92);
  emblem(g, i, w / 2, 112, 46);
  g.fillStyle = "#eaf4ff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `600 15px ${FONT}`; g.fillText("DECK", w / 2, 186);
  g.fillStyle = c; g.font = `800 58px ${FONT}`; g.fillText(String(i + 1), w / 2, 232);
  g.strokeStyle = c; g.lineWidth = 6; for (let k = 0; k < 3; k++) { const yy = 274 + k * 19; g.beginPath(); g.moveTo(w / 2 - 22, yy); g.lineTo(w / 2, yy + 14); g.lineTo(w / 2 + 22, yy); g.stroke(); }
  g.restore();
}
const PICT = [
  g => { const s = g.S; g.fillRect(-.35 * s, -.8 * s, .45 * s, 1.1 * s); g.beginPath(); g.moveTo(-.35 * s, .3 * s); g.lineTo(.6 * s, .3 * s); g.quadraticCurveTo(.78 * s, .3 * s, .78 * s, .52 * s); g.lineTo(-.35 * s, .52 * s); g.fill();
    g.fillStyle = YEL; g.fillRect(-.42 * s, .58 * s, 1.24 * s, .14 * s); g.strokeStyle = YEL; g.lineWidth = .08 * s; for (const k of [0, 1, 2]) { g.beginPath(); g.arc(.2 * s, .65 * s, (.36 + k * .17) * s, PI * .25, PI * .75); g.stroke(); } },
  g => { const s = g.S; g.beginPath(); g.arc(0, 0, .8 * s, PI * .9, PI * 2.1); g.lineTo(.72 * s, .58 * s); g.lineTo(-.72 * s, .58 * s); g.closePath(); g.fill(); g.fillStyle = "#d9a53a"; g.beginPath(); g.ellipse(.12 * s, -.05 * s, .5 * s, .32 * s, 0, 0, TAU); g.fill(); },
  g => { const s = g.S; g.lineWidth = .12 * s; g.strokeStyle = "#fff"; g.beginPath(); g.arc(0, 0, .8 * s, 0, TAU); g.stroke();
    for (let k = 0; k < 9; k++) { const a = PI * .75 + k / 8 * PI * 1.5; g.lineWidth = .06 * s; g.beginPath(); g.moveTo(Math.cos(a) * .52 * s, Math.sin(a) * .52 * s); g.lineTo(Math.cos(a) * .68 * s, Math.sin(a) * .68 * s); g.stroke(); }
    g.lineWidth = .1 * s; g.strokeStyle = "#ff5c5c"; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(-.5) * .6 * s, Math.sin(-.5) * .6 * s); g.stroke(); g.beginPath(); g.arc(0, 0, .1 * s, 0, TAU); g.fill(); },
  g => { const s = g.S; g.fillRect(-.95 * s, -.78 * s, 1.9 * s, .12 * s); g.beginPath(); g.arc(0, -.28 * s, .17 * s, 0, TAU); g.fill(); g.lineCap = "round"; g.lineWidth = .15 * s; g.strokeStyle = "#fff";
    g.beginPath(); g.moveTo(-.38 * s, -.68 * s); g.lineTo(0, -.02 * s); g.lineTo(.38 * s, -.68 * s); g.moveTo(0, -.08 * s); g.lineTo(0, .42 * s); g.lineTo(-.42 * s, .85 * s); g.moveTo(0, .42 * s); g.lineTo(.48 * s, .72 * s); g.stroke(); }
];
function drawPoster(g, i, [x, y, w, h]){
  const c = [YEL, CYAN, "#FF8A3D", "#3DDC97"][i], txt = [["MAGNETSTIEFEL", "ANLEGEN"], ["HELM", "GRIFFBEREIT"], ["ERST DRUCK", "PRÜFEN"], ["SCHWERELOS?", "FESTHALTEN!"]][i];
  g.save(); g.translate(x, y); g.fillStyle = "#e9eef3"; g.fillRect(0, 0, w, h); g.fillStyle = "#1b222c"; g.fillRect(0, 0, w, 40); g.fillStyle = c; g.fillRect(0, 36, w, 6);
  g.fillStyle = c; g.font = `700 16px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SICHERHEIT", w / 2, 19);
  g.fillStyle = "#1b222c"; g.beginPath(); g.arc(w / 2, 112, 52, 0, TAU); g.fill(); g.strokeStyle = c; g.lineWidth = 6; g.stroke();
  g.save(); g.translate(w / 2, 112); g.fillStyle = "#fff"; g.strokeStyle = "#fff"; g.S = 38; PICT[i](g); g.restore();
  g.fillStyle = "#1b222c"; txt.forEach((t, k) => { fitText(g, t, w - 16, 19, 800); g.fillText(t, w / 2, 192 + k * 24); });
  g.fillStyle = "#6b7684"; g.font = `500 10px ${FONT}`; g.fillText("Deck-Ordnung § 4", w / 2, h - 10);
  g.strokeStyle = "#1b222c"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3); g.restore();
}
function drawCrate(g, [x, y, w, h], r){
  g.save(); g.translate(x, y); g.fillStyle = "#d7dce2"; g.fillRect(0, 0, w, h); nz(g, w, h, 1800, .14, ["#000", "#fff"], r);
  g.strokeStyle = "rgba(38,46,56,.72)"; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 2; g.strokeRect(15, 15, w - 30, h - 30);
  g.fillStyle = "rgba(38,46,56,.78)"; for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + (cx ? -44 : 44), cy); g.lineTo(cx, cy + (cy ? -44 : 44)); g.closePath(); g.fill(); }
  g.fillStyle = "rgba(30,36,44,.82)"; g.font = `800 34px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("FRACHT", w / 2, 92); g.font = `600 19px ${FONT}`; g.fillText("K-0471 · 38 kg", w / 2, 126);
  for (let i = 0; i < 24; i++) g.fillRect(62 + i * 5, 156, r() < .5 ? 2 : 3.5, 40);
  g.fillStyle = "#e8b923"; poly(g, [[204, 160], [224, 180], [204, 200], [184, 180]]); g.fill(); g.fillStyle = "#1b1e23"; g.font = `800 20px ${FONT}`; g.fillText("!", 204, 181);
  g.restore();
}
function drawLocker(g, [x, y, w, h], r){
  g.save(); g.translate(x, y); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#66758b"); gr.addColorStop(1, "#4d5a6c"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16); g.strokeStyle = "rgba(0,0,0,.35)"; g.strokeRect(11, 11, w - 16, h - 16);
  vents(g, 26, 34, w - 52, 74, 6); vents(g, 26, h - 108, w - 52, 74, 6);
  g.fillStyle = "#18202a"; g.fillRect(24, 140, w - 48, 40); g.fillStyle = CYAN; g.font = `700 18px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CREW", w / 2, 160);
  g.fillStyle = YEL; g.fillRect(16, 200, 6, 120); nz(g, w, h, 1400, .1, ["#000", "#fff"], r); g.restore();
}
function drawTools(g, [x, y, w, h]){
  g.save(); g.translate(x, y); g.fillStyle = "#2b333d"; g.fillRect(0, 0, w, h);
  for (let yy = 9; yy < h; yy += 13) for (let xx = 9; xx < w; xx += 13) { g.fillStyle = "#12171d"; g.beginPath(); g.arc(xx, yy, 2.3, 0, TAU); g.fill(); }
  const metal = (x0, y0, x1, y1) => { const m = g.createLinearGradient(x0, y0, x1, y1); m.addColorStop(0, "#e6ebf0"); m.addColorStop(.5, "#9aa5b2"); m.addColorStop(1, "#d2d9e0"); return m; };
  const out = () => { g.strokeStyle = "rgba(255,232,31,.85)"; g.lineWidth = 2; g.stroke(); };
  for (const [cx, Lw, k] of [[40, 118, 1], [76, 98, .85], [108, 80, .7]]) { g.save(); g.translate(cx, 30); g.fillStyle = metal(-10, 0, 10, 0);
    g.beginPath(); g.roundRect(-6 * k, 18 * k, 12 * k, Lw, 5 * k); g.fill(); out(); g.beginPath(); g.arc(0, 12 * k, 16 * k, 0, TAU); g.fill(); out(); g.fillStyle = "#2b333d"; g.fillRect(-6 * k, -6 * k, 12 * k, 17 * k); g.restore(); }
  for (const [cx, c] of [[150, "#e8792b"], [172, "#4FC3F7"], [194, "#3DDC97"]]) { g.fillStyle = c; g.beginPath(); g.roundRect(cx - 7, 30, 14, 52, 5); g.fill(); g.fillStyle = metal(cx - 3, 0, cx + 3, 0); g.fillRect(cx - 2.5, 82, 5, 62); }
  g.fillStyle = "#6b4a2e"; g.beginPath(); g.roundRect(236, 54, 12, 108, 4); g.fill(); g.fillStyle = metal(212, 30, 272, 56); g.beginPath(); g.roundRect(212, 30, 60, 26, 5); g.fill(); out();
  g.fillStyle = "#c8392f"; for (const s of [-1, 1]) { g.save(); g.translate(318, 100); g.rotate(s * .14); g.beginPath(); g.roundRect(-5 + s * 8, 0, 10, 70, 5); g.fill(); g.restore(); }
  g.fillStyle = metal(300, 40, 336, 100); poly(g, [[306, 100], [312, 40], [324, 40], [330, 100]]); g.fill();
  g.fillStyle = "#e9b824"; g.beginPath(); g.roundRect(344, 40, 30, 54, 5); g.fill(); g.fillStyle = "#12171d"; g.fillRect(349, 46, 20, 14); g.fillStyle = "#3DDC97"; g.fillRect(352, 49, 9, 8);
  g.fillStyle = "rgba(255,232,31,.9)"; g.font = `700 13px ${FONT}`; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText("WERKZEUG · BITTE ZURÜCKHÄNGEN", 12, h - 10);
  g.restore();
}
function drawSos(g, [x, y, w, h]){
  g.save(); g.translate(x, y); g.fillStyle = "#c8392f"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(0, 0, w, 6); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, h - 6, w, 6);
  g.fillStyle = "#3a0d0a"; g.beginPath(); g.roundRect(14, 14, w - 28, 74, 8); g.fill();
  g.fillStyle = "#f2f2f2"; g.beginPath(); g.ellipse(w / 2, 50, 18, 14, 0, 0, TAU); g.fill(); g.fillStyle = "#3a0d0a"; g.beginPath(); g.ellipse(w / 2, 50, 9, 7, 0, 0, TAU); g.fill();
  g.strokeStyle = "#f2f2f2"; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 16, 44); g.quadraticCurveTo(w / 2 - 34, 26, w / 2 - 12, 24); g.moveTo(w / 2 + 16, 44); g.quadraticCurveTo(w / 2 + 34, 26, w / 2 + 12, 24); g.stroke();
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `800 34px ${FONT}`; g.fillText("O₂", w / 2, 118); g.font = `700 15px ${FONT}`; g.fillText("NOTFALL", w / 2, 150);
  g.save(); g.beginPath(); g.rect(0, h - 26, w, 20); g.clip(); g.fillStyle = "#1b1e23"; g.fillRect(0, h - 26, w, 20); g.fillStyle = "#F2C81B";
  for (let k = -20; k < w; k += 20) { poly(g, [[k, h - 6], [k + 10, h - 6], [k + 30, h - 26], [k + 20, h - 26]]); g.fill(); } g.restore(); g.restore();
}
function screenBg(g, x, y, w, h){ g.fillStyle = "#04121f"; g.fillRect(x, y, w, h); g.strokeStyle = "rgba(79,195,247,.12)"; g.lineWidth = 1; for (let xx = x + 12; xx < x + w; xx += 12) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
  g.strokeStyle = CYAN; g.lineWidth = 3; L.chamf(g, x + 3, y + 3, w - 6, h - 6, Math.min(w, h) * .18); g.stroke(); }
function drawScreens(g){
  let [x, y, w, h] = PR.archiv; screenBg(g, x, y, w, h); g.textBaseline = "middle"; g.textAlign = "left"; g.fillStyle = "#EAF6FF"; g.font = `700 24px ${FONT}`; g.fillText("DATENARCHIV", x + 16, y + h / 2);
  for (let i = 0; i < 7; i++) { g.fillStyle = i < 5 ? CYAN : "rgba(79,195,247,.3)"; g.fillRect(x + 186 + i * 9, y + 22, 6, 20); }
  [x, y, w, h] = PR.energie; screenBg(g, x, y, w, h); g.fillStyle = CYAN; g.font = `600 18px ${FONT}`; g.fillText("ENERGIEZELLEN", x + 14, y + 22); g.textAlign = "right"; g.fillStyle = YEL; g.font = `700 30px ${FONT}`; g.fillText("87 %", x + w - 14, y + 26);
  for (let i = 0; i < 10; i++) { const v = .45 + .5 * Math.abs(Math.sin(i * 1.3 + .7)); g.fillStyle = i % 4 === 3 ? YEL : CYAN; g.fillRect(x + 16 + i * 23, y + h - 14 - v * 66, 15, v * 66); } g.textAlign = "left";
  [x, y, w, h] = PR.gauge; g.fillStyle = "#0b1420"; g.fillRect(x, y, w, h); const cx = x + w / 2, cy = y + h / 2 + 8;
  g.strokeStyle = "rgba(79,195,247,.35)"; g.lineWidth = 9; g.beginPath(); g.arc(cx, cy, 44, PI * .8, PI * 2.2); g.stroke(); g.strokeStyle = YEL; g.beginPath(); g.arc(cx, cy, 44, PI * .8, PI * 1.85); g.stroke();
  g.strokeStyle = "#ff5c5c"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(PI * 1.8) * 38, cy + Math.sin(PI * 1.8) * 38); g.stroke();
  g.fillStyle = "#EAF6FF"; g.textAlign = "center"; g.font = `700 18px ${FONT}`; g.fillText("12 kN", cx, cy + 22); g.fillStyle = CYAN; g.font = `600 12px ${FONT}`; g.fillText("SCHUB", cx, y + 14);
  [x, y, w, h] = PR.warn; g.fillStyle = "#1b1e23"; g.fillRect(x, y, w, h); g.fillStyle = "#F2C81B"; poly(g, [[x + w / 2, y + 10], [x + w - 10, y + h - 14], [x + 10, y + h - 14]]); g.fill();
  g.strokeStyle = "#1b1e23"; g.lineWidth = 6; poly(g, [[x + w / 2, y + 22], [x + w - 22, y + h - 22], [x + 22, y + h - 22]]); g.stroke();
  g.fillStyle = "#1b1e23"; poly(g, [[x + 66, y + 42], [x + 52, y + 74], [x + 64, y + 74], [x + 58, y + 98], [x + 78, y + 64], [x + 66, y + 64], [x + 74, y + 42]]); g.fill();
  [x, y, w, h] = PR.plaque; const pg = g.createLinearGradient(x, y, x, y + h); pg.addColorStop(0, "#d7dde4"); pg.addColorStop(1, "#9aa5b1"); g.fillStyle = pg; g.fillRect(x, y, w, h);
  for (let i = 0; i < h; i += 2) { g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(x, y + i, w, 1); }
  g.fillStyle = "#2b333d"; g.textAlign = "center"; g.font = `700 20px ${FONT}`; g.fillText("RAUMANZUG · MODELL EVA-4", x + w / 2, y + 24); g.font = `500 13px ${FONT}`; g.fillText("Außeneinsatz bis 8 h · 130 kg mit Rucksack", x + w / 2, y + 46);
  ["1 kg", "2 kg", "5 kg", "10 kg"].forEach((t, i) => { const [kx, ky, kw, kh] = PR.kg(i); g.fillStyle = "#1a1d22"; g.beginPath(); g.arc(kx + kw / 2, ky + kh / 2, kw / 2 - 1, 0, TAU); g.fill();
    g.strokeStyle = ["#3DDC97", YEL, CYAN, "#FF5C5C"][i]; g.lineWidth = 4; g.beginPath(); g.arc(kx + kw / 2, ky + kh / 2, kw / 2 - 5, 0, TAU); g.stroke(); g.fillStyle = "#fff"; fitText(g, t, kw - 16, 16, 800); g.fillText(t, kx + kw / 2, ky + kh / 2 + 1); });
  [x, y, w, h] = PR.lade; screenBg(g, x, y, w, h); g.fillStyle = "#3DDC97"; g.textAlign = "left"; g.font = `700 16px ${FONT}`; g.fillText("LADEN", x + 12, y + h / 2);
  g.strokeStyle = "#3DDC97"; g.lineWidth = 2; g.strokeRect(x + 70, y + 20, 42, 24); g.fillRect(x + 112, y + 27, 4, 10); for (let i = 0; i < 3; i++) g.fillRect(x + 74 + i * 13, y + 24, 10, 16);
  [x, y, w, h] = PR.hydro; screenBg(g, x, y, w, h); g.fillStyle = "#7CE38B"; g.font = `700 14px ${FONT}`; g.fillText("HYDRO", x + 12, y + 22); g.fillStyle = "#EAF6FF"; g.font = `600 13px ${FONT}`; g.fillText("pH 6,1 · 22 °C", x + 12, y + 44);
}
function printTex(){ return U.canvasTex(1024, 1024, g => {
  const r = U.seeded(9091); g.clearRect(0, 0, 1024, 1024);
  for (let i = 0; i < 8; i++) { drawBanner(g, i, PR.banner(i)); const [x, y, w] = PR.badge(i); emblem(g, i, x + w / 2, y + w / 2, w / 2 - 3); }
  for (let i = 0; i < 4; i++) drawPoster(g, i, PR.poster(i));
  drawCrate(g, PR.crate, r); drawLocker(g, PR.locker, r); drawTools(g, PR.tools); drawSos(g, PR.sos); drawScreens(g);
}, "sd-print"); }
function leafTex(){ return U.canvasTex(128, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h); const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, "#2a6e2a"); gr.addColorStop(.6, "#58b047"); gr.addColorStop(1, "#93da6c");
  g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, h - 4); g.bezierCurveTo(w * .02, h * .7, w * .1, h * .2, w / 2, 4); g.bezierCurveTo(w * .9, h * .2, w * .98, h * .7, w / 2, h - 4); g.fill();
  g.strokeStyle = "rgba(225,255,205,.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h - 6); g.lineTo(w / 2, 14); g.stroke();
  g.lineWidth = 1.5; g.strokeStyle = "rgba(225,255,205,.32)"; for (let k = 0; k < 7; k++) { const y = h * .8 - k * 26; g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w * .3, y - 12, w * .17, y - 30); g.moveTo(w / 2, y); g.quadraticCurveTo(w * .7, y - 12, w * .83, y - 30); g.stroke(); }
}, "sd-leaf"); }
function quiltTex(){ return U.canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#c2cbd5"; g.fillRect(0, 0, w, h); const r = U.seeded(313);
  for (let y = -16; y <= h + 16; y += 32) for (let x = -16; x <= w + 16; x += 32) { const xx = x + ((y / 32) % 2 ? 16 : 0); const gr = g.createRadialGradient(xx, y, 0, xx, y, 20); gr.addColorStop(0, "rgba(255,255,255,.32)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(xx - 20, y - 20, 40, 40); }
  for (let i = -w; i <= 2 * w; i += 32) { g.strokeStyle = "rgba(60,70,85,.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
  nz(g, w, h, 2500, .08, ["#000", "#fff"], r);
}, "sd-quilt", [1, 1]); }
function globeTex(){ return U.canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h); const r = U.seeded(2718);
  for (let k = 0; k < 9; k++) { let x = r() * w, y = h * (.2 + r() * .6); for (let i = 0; i < 14; i++) { x += (r() - .5) * 22; y += (r() - .5) * 12; glowDot(g, (x + w) % w, Math.max(8, Math.min(h - 8, y)), 8 + r() * 12, "120,220,255", .45); } }
  g.strokeStyle = "rgba(160,235,255,.35)"; g.lineWidth = 1; for (let y = 0; y < h; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}, "sd-globe"); }

/* ---------- Materialien (gecacht, nicht freigeben) ---------- */
const MATS = new Map();
const keep = m => { m.userData.keep = true; return m; };
const STD = (k, p) => L.imat("sd-" + k, () => new T3.MeshStandardMaterial(p));
function MAT(k){
  if (MATS.has(k)) return MATS.get(k); let m;
  switch (k) {
    case "frame": m = L.M.trim(); break; case "rib": m = L.M.rib(); break; case "white": m = L.M.white(); break; case "pipe": m = L.M.pipe(); break; case "haz": m = L.M.haz(); break;
    case "lc": m = L.M.lc(); break; case "ly": m = L.M.ly(); break; case "lw": m = L.M.lw(); break;
    case "lp": m = L.imat("sd-lp", () => L.basic({color: 0xff74d8})); break;
    case "lg": m = L.imat("sd-lg", () => L.basic({color: 0x7cf08b})); break;
    case "lr": m = L.imat("sd-lr", () => L.basic({color: 0xff5c5c})); break;
    case "steel": case "metal": case "copper": case "gold": case "brass": case "rubber": m = K.mat(k); break;
    case "glass": m = K.mat("glass", {opacity: .16}); break; case "water": m = K.mat("water", {color: "#3aa0c8"}); break;
    case "cushion": m = K.mat("cloth", {color: "#33567c"}); break;
    case "red": m = K.mat("plastic", {color: "#c8392f"}); break; case "orange": m = K.mat("plastic", {color: "#e8792b"}); break;
    case "dark": m = K.mat("plastic", {color: "#20262e"}); break; case "stem": m = K.mat("plastic", {color: "#3f7d33"}); break; case "soil": m = K.mat("plastic", {color: "#2e2219"}); break;
    case "panel": m = STD("panel", {color: 0x1d3a6b, metalness: .6, roughness: .32}); break;
    case "suit": m = STD("suit", {color: 0xeef1f4, roughness: .78, metalness: 0}); break;
    case "print": m = STD("print", {map: printTex(), roughness: .55, metalness: .1, emissive: 0xffffff, emissiveMap: printTex(), emissiveIntensity: .16, alphaTest: .5}); break;
    case "crate": m = STD("crate", {map: printTex(), roughness: .62, metalness: .12}); break;
    case "screen": m = L.imat("sd-screen", () => L.basic({map: printTex(), alphaTest: .5})); break;
    case "art": m = STD("art", {map: artTex(), roughness: .5, metalness: 0, emissive: 0xffffff, emissiveMap: artTex(), emissiveIntensity: .3}); break;
    case "leaf": m = STD("leaf", {map: leafTex(), alphaTest: .45, side: T3.DoubleSide, roughness: .7, emissive: 0x1d4f1a, emissiveIntensity: .35}); break;
    case "quilt": m = STD("quilt", {map: quiltTex(), color: 0xe6ecf2, roughness: .42, metalness: .55, side: T3.DoubleSide}); break;
    case "mirror": m = STD("mirror", {color: 0xe8f0f8, metalness: 1, roughness: .05}); break;
    case "lens": m = STD("lens", {color: 0xc4ecff, emissive: 0x1d5a7a, emissiveIntensity: .6, transparent: true, opacity: .58, roughness: .04, metalness: .25, side: T3.DoubleSide, depthWrite: false}); break;
    case "rock": m = STD("rock", {color: 0x6f665c, roughness: .95, metalness: .05, flatShading: true}); break;
    case "crystal": m = L.imat("sd-crystal", () => L.basic({color: 0xffffff})); break;
    default: m = k.startsWith("acc:") || (k.includes("-") && L.M[k]) ? L.matOf(k) : K.mat(k);   // "xx-…": Materialien der Raumthemen (17_raum_sterne.js)
  }
  MATS.set(k, m); return m;
}
const ADDM = (k, col, op, extra = {}) => L.imat("sd-add-" + k, () => L.basic(Object.assign({color: col, opacity: op, side: T3.DoubleSide}, L.ADD, extra)));

/* ---------- Geometrie bündeln (je Material ein Mesh) ---------- */
const _m = new T3.Matrix4(), _q = new T3.Quaternion(), _e = new T3.Euler(), _v = new T3.Vector3(), _s = new T3.Vector3(), Y1 = new T3.Vector3(0, 1, 0);
function uvR(geo, [x, y, w, h], S = 1024, ins = 1.5){ const uv = geo.attributes.uv, u0 = (x + ins) / S, u1 = (x + w - ins) / S, v0 = 1 - (y + h - ins) / S, v1 = 1 - (y + ins) / S;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0)); return geo; }
function Mb(){
  const parts = new Map();
  const api = {
    F: new T3.Matrix4(),
    add(k, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1){
      geo.applyMatrix4(_m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz))); geo.applyMatrix4(api.F);
      if (!parts.has(k)) parts.set(k, []); parts.get(k).push(geo); return geo; },
    box(k, w, h, d, x, y, z, rx, ry, rz){ return api.add(k, new T3.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    // sparsam: Segmentzahlen gedeckelt (Ausstattung soll höchstens +40 000 Dreiecke je Raum kosten)
    cyl(k, rt, rb, h, seg, x, y, z, rx, ry, rz, open = false){ return api.add(k, new T3.CylinderGeometry(rt, rb, h, Math.max(6, Math.min(14, Math.round(seg * .6))), 1, open), x, y, z, rx, ry, rz); },
    sph(k, r, x, y, z, sx = 1, sy = 1, sz = 1, ws = 12, hs = 8){ return api.add(k, new T3.SphereGeometry(r, Math.max(6, Math.round(ws * .75)), Math.max(4, Math.round(hs * .75))), x, y, z, 0, 0, 0, sx, sy, sz); },
    tor(k, R, r, x, y, z, rx = 0, ry = 0, rz = 0, rs = 4, ts = 20){ return api.add(k, new T3.TorusGeometry(R, r, Math.min(rs, 4), Math.max(8, Math.round(ts * .7))), x, y, z, rx, ry, rz); },
    plane(k, w, h, reg, x, y, z, rx = 0, ry = 0, rz = 0, S = 1024){ return api.add(k, uvR(new T3.PlaneGeometry(w, h), reg, S), x, y, z, rx, ry, rz); },
    rod(k, a, b, r, seg = 8){ const d = _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), Ln = d.length(), g = new T3.CylinderGeometry(r, r, Ln, Math.max(4, Math.min(14, Math.round(seg * .75))), 1, true);
      g.applyQuaternion(_q.setFromUnitVectors(Y1, d.normalize())); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); return api.add(k, g); },
    build(group){ for (const [k, list] of parts) { if (!list.length) continue; const mesh = new T3.Mesh(L.merge(list), MAT(k)); mesh.castShadow = false;
        mesh.receiveShadow = !/^l[a-z]$|^acc|glass|screen|lens/.test(k); mesh.userData.noPick = true; group.add(mesh); } parts.clear(); }
  };
  return api;
}

/* ---------- Plätze: Wandrahmen, Weltquader, freie Abschnitte ---------- */
function wallF(ctx, side, along, out = 0, y = 0){ const B = ctx.bounds, m = new T3.Matrix4(), V = (a, b, c) => new T3.Vector3(a, b, c);
  if (side === "left") m.makeBasis(V(0, 0, -1), Y1, V(1, 0, 0)).setPosition(B.x0 + out, y, along);
  else if (side === "right") m.makeBasis(V(0, 0, 1), Y1, V(-1, 0, 0)).setPosition(B.x1 - out, y, along);
  else if (side === "front") m.makeBasis(V(1, 0, 0), Y1, V(0, 0, 1)).setPosition(along, y, B.z1 + out);
  else m.makeBasis(V(-1, 0, 0), Y1, V(0, 0, -1)).setPosition(along, y, B.z0 - out);
  return m; }
const atF = (x, y, z, ry = 0) => new T3.Matrix4().makeRotationY(ry).setPosition(x, y, z);
function wbox(F, x0, x1, y0, y1, z0, z1){ const b = new T3.Box3(), p = new T3.Vector3(); for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) b.expandByPoint(p.set(x, y, z).applyMatrix4(F));
  return {x0: b.min.x, x1: b.max.x, y0: b.min.y, y1: b.max.y, z0: b.min.z, z1: b.max.z}; }
function claim(ctx, box, obst = false, rand = .08){ if (!ctx.frei(box, rand)) return false; ctx.belege(box);
  if (obst) ctx.obstacleBox((box.x0 + box.x1) / 2, (box.z0 + box.z1) / 2, box.x1 - box.x0, box.z1 - box.z0); return true; }
const isSide = s => s === "left" || s === "right";
function runs(ctx, side, a0, a1, y0, y1, dep, step = .1){
  const out = []; let cur = null;
  for (let a = a0; a <= a1 - step + 1e-6; a += step) { const ok = ctx.frei(ctx.wand(side, a + step / 2, y0, y1, step, dep));
    if (ok) { if (cur) cur[1] = a + step; else cur = [a, a + step]; } else if (cur) { out.push(cur); cur = null; } }
  if (cur) out.push(cur); return out; }
function wallRange(ctx, side){ const B = ctx.bounds; return isSide(side) ? [B.z1, B.z0] : [B.x0, B.x1]; }
// Platz an einer Wand für ein Teil der Breite minW…maxW suchen (nächster zu pref oder längster Abschnitt) und belegen
function wallSpot(ctx, sides, y0, y1, dep, minW, maxW, {pref = null, obst = true, snap = 0, yF = 0} = {}){
  const c = [];
  for (const side of sides) { const [lo, hi] = wallRange(ctx, side);
    for (const [s, e] of runs(ctx, side, lo, hi, y0, y1, dep)) { let w = Math.min(maxW, e - s - .04); if (snap) w = Math.floor(w / snap + 1e-6) * snap; if (w < minW) continue;
      const along = pref == null ? (s + e) / 2 : Math.max(s + .02 + w / 2, Math.min(e - .02 - w / 2, pref)); c.push({side, along, w, k: pref == null ? -(e - s) : Math.abs(along - pref)}); } }
  c.sort((p, q) => p.k - q.k);
  for (const o of c) { const F = wallF(ctx, o.side, o.along, 0, yF); if (claim(ctx, wbox(F, -o.w / 2, o.w / 2, y0 - yF, y1 - yF, 0, dep), obst)) return Object.assign(o, {F}); }
  return null;
}
// Belegt die Bauteile der Raumhülle, die der Kern nicht kennt (Rippen, Schräge, Eckrohre, Deckenträger, Fenster, Statusschirme)
function shellWins(S, dir){ const w = S.win, out = [w, {...w, x0: -w.x1, x1: -w.x0}];
  if (S.hall) out.push(dir > 0 ? {x0: -2.6, x1: 2.6, y0: 6.4, y1: 8.8, c: .6, top: true} : {x0: -2.8, x1: 2.8, y0: 1.3, y1: 7.4, c: .8, big: true});
  return out; }
function reserveShell(ctx, S){
  if (S.belegt) { for (const b of S.belegt) ctx.belege(b); return; }   // Raumthema: die Hülle meldet ihre Teile selbst (17_raum_sterne.js)
  const B = ctx.bounds, H = S.H, WH = S.WH, cx = (B.x0 + B.x1) / 2, bx = (xw, s, a, b) => ({x0: Math.min(xw + s * a, xw + s * b), x1: Math.max(xw + s * a, xw + s * b)});
  for (const [xw, s] of [[B.x0, 1], [B.x1, -1]]) {
    for (const z of S.pz) ctx.belege({...bx(xw, s, 0, .62), y0: 0, y1: WH, z0: z - .4, z1: z + .4});
    ctx.belege({...bx(xw, s, 0, 1.05), y0: WH - .05, y1: H, z0: B.z1, z1: B.z0});
    for (const zw of [B.z1, B.z0]) { const z2 = zw + (zw < 0 ? .5 : -.5); ctx.belege({...bx(xw, s, 0, .56), y0: 0, y1: H, z0: Math.min(zw, z2), z1: Math.max(zw, z2)}); }
  }
  for (const z of S.pz) ctx.belege({x0: B.x0, x1: B.x1, y0: H - .38, y1: H, z0: z - .27, z1: z + .27});
  ctx.belege({x0: cx - .42, x1: cx + .42, y0: H - .27, y1: H, z0: B.z1, z1: B.z0});
  const lx = S.hall ? 3.3 : 2.6; for (const s of [-1, 1]) ctx.belege({x0: cx + s * lx - .72, x1: cx + s * lx + .72, y0: H - .1, y1: H, z0: B.z1, z1: B.z0});
  for (const [zw, dir] of [[B.z1, 1], [B.z0, -1]]) { const z0 = Math.min(zw, zw + dir * .2), z1 = Math.max(zw, zw + dir * .2);
    for (const w of shellWins(S, dir)) ctx.belege({x0: w.x0 - .12, x1: w.x1 + .12, y0: w.y0 - .12, y1: w.y1 + .12, z0, z1});
    if (!S.hall || dir > 0) for (const s of [-1, 1]) { const x = s * (S.hall ? 2.38 : 2.3); ctx.belege({x0: x - .47, x1: x + .47, y0: 2.33, y1: 3.4, z0, z1}); } }
}

/* ---------- Möbel (lokal: x entlang der Wand, y nach oben, z von der Wand in den Raum) ---------- */
const CRATE_COLS = ["#e8792b", "#cfd6de", "#4f7fa8", "#7b9a55", "#d9b13b", "#9aa5b2", "#c8504a"];
function crate(B, I, x, y, z, w, h, d, ry, col){ I.crates.push([B.F.clone(), x, y, z, w, h, d, ry, col]); }
function shelf(B, w, R, I){
  const d = .52, H = 2.16, lv = [.1, .78, 1.46, 2.14], posts = w > 1.9 ? [-w / 2 + .03, 0, w / 2 - .03] : [-w / 2 + .03, w / 2 - .03];
  for (const x of posts) for (const z of [.05, d - .03]) B.box("frame", .05, H + .04, .05, x, (H + .04) / 2, z);
  for (const y of lv) { B.box("rib", w, .035, d - .02, 0, y, d / 2 + .01); B.add("haz", U.scaleUV(new T3.BoxGeometry(w, .055, .012), w / .5, 1), 0, y - .012, d + .006);
    if (y < 2) B.box("lc", w - .14, .012, .014, 0, y - .03, d - .07); }
  for (let i = 0; i < posts.length - 1; i++) { const xa = posts[i], xb = posts[i + 1], a = Math.atan2(H, xb - xa), Ln = Math.hypot(xb - xa, H);
    for (const s of [1, -1]) B.box("frame", Ln, .025, .012, (xa + xb) / 2, H / 2, .025, 0, 0, s * a); }
  // Mittelpfosten (breite Regale) freihalten: Kisten und Kanister springen hinter den Pfosten, statt ihn zu durchdringen
  const mid = posts.slice(1, -1), past = (x0, x1) => { for (const p of mid) if (x0 < p + .045 && x1 > p - .045) return p + .045; return null; };
  for (let k = 0; k < 4; k++) { const y = lv[k] + .0175, top = k === 3, kind = top ? 0 : (R() * 3) | 0; let x = -w / 2 + .1;
    while (x < w / 2 - .25) {
      if (kind === 2 && R() < .75) { const r = .075 + R() * .03, h = .3 + R() * .2, q = past(x, x + 2 * r + .006); if (q != null) x = q + .01; if (x + 2 * r > w / 2 - .08) break;
        const c = R() < .5 ? "white" : "orange"; B.cyl(c, r, r, h, 14, x + r, y + h / 2, d / 2); B.cyl("frame", r * .55, r * .55, .04, 10, x + r, y + h + .02, d / 2); B.cyl("ly", r + .003, r + .003, .03, 14, x + r, y + h * .7, d / 2); x += 2 * r + .05; }
      else { const cw = .28 + R() * .3, ch = top ? .16 + R() * .1 : .22 + R() * .3, cd = .26 + R() * .16, q = past(x - .02, x + cw + .02); if (q != null) x = q + .025; if (x + cw > w / 2 - .08) break;
        if (R() < .82) crate(B, I, x + cw / 2, y + ch / 2, d / 2 + (R() - .5) * .06, cw, ch, cd, (R() - .5) * .14, (R() * CRATE_COLS.length) | 0);
        x += cw + .05 + R() * .1; } } }
}
function lockers(B, n, R, bench = true){
  const lw = .6, w = n * lw, d = .5, H = 2.05;
  B.box("frame", w, .08, d - .04, 0, .04, (d - .04) / 2);
  for (let i = 0; i < n; i++) { const x = -w / 2 + lw * (i + .5);
    B.box("white", lw - .012, H - .08, d, x, .08 + (H - .08) / 2, d / 2); B.plane("print", lw - .08, H - .22, PR.locker, x, .08 + (H - .08) / 2, d + .003);
    B.box("steel", .03, .24, .035, x + lw / 2 - .1, 1.12, d + .02); B.box(i % 3 === 1 ? "ly" : "lc", .035, .035, .01, x - lw / 2 + .1, 1.86, d + .006); }
  B.box("rib", w + .04, .05, d + .04, 0, H + .025, d / 2); B.box("lc", w, .012, .01, 0, H - .03, d + .021);
  if (bench) { B.box("cushion", w - .2, .07, .36, 0, .465, d + .25); B.box("frame", w - .24, .05, .32, 0, .405, d + .25); for (const x of [-(w / 2 - .26), w / 2 - .26]) B.box("frame", .06, .38, .26, x, .19, d + .25); }
  const top = H + .05, hx = -w / 2 + lw * (((R() * n) | 0) + .5);
  B.sph("suit", .14, hx, top + .13, d / 2, 1, .95, 1, 16, 12); B.add("gold", new T3.SphereGeometry(.143, 16, 10, PI / 2 - .85, 1.7, .95, .85), hx, top + .13, d / 2);
  if (n > 1) { const bx = hx > 0 ? hx - lw : hx + lw; B.add("cushion", new T3.CapsuleGeometry(.11, .3, 4, 10), bx, top + .11, d / 2, 0, 0, PI / 2); }
}
function archive(B, w, R, I){
  const d = .46, H = 2.2, rows = [.24, .6, .96, 1.32, 1.68];
  B.box("frame", w, H, .04, 0, H / 2, .02); for (const x of [-w / 2 + .03, w / 2 - .03]) B.box("rib", .06, H, d, x, H / 2, d / 2);
  B.box("rib", w, .1, d, 0, .05, d / 2); B.box("rib", w, .24, d, 0, H - .12, d / 2); B.plane("screen", Math.min(1.1, w - .3), .2, PR.archiv, 0, H - .12, d + .004);
  for (const y of rows) { B.box("frame", w - .1, .03, d - .06, 0, y, d / 2); B.box("lc", w - .14, .01, .01, 0, y + .33, d - .06); B.box("rib", w - .14, .035, .07, 0, y + .03, d / 2);
    for (let x = -w / 2 + .14; x < w / 2 - .1; x += .105) I.crystals.push([B.F.clone(), x, y + .135, d / 2, (R() * 4) | 0]); }
  B.add("glass", new T3.PlaneGeometry(w - .1, H - .36), 0, (H - .24) / 2 + .1, d + .002); B.box("rib", .025, H - .36, .02, 0, (H - .24) / 2 + .1, d + .01);
  for (const s of [-1, 1]) B.box("steel", .02, .18, .03, s * .05, 1.1, d + .03);
}
function workshop(B, w, R, I){
  const d = .6, tw = Math.min(2.0, w - .1);
  B.box("frame", tw + .06, 1.12, .03, 0, 1.76, .015); B.plane("print", tw, 1.04, PR.tools, 0, 1.76, .032); B.box("frame", tw + .1, .05, .12, 0, 2.34, .06); B.box("lw", tw, .012, .05, 0, 2.31, .09);
  B.box("rib", w, .05, d, 0, .92, d / 2); B.add("haz", U.scaleUV(new T3.BoxGeometry(w, .05, .01), w / .5, 1), 0, .92, d + .006);
  for (const x of [-w / 2 + .05, w / 2 - .05]) for (const z of [.06, d - .06]) B.box("frame", .05, .9, .05, x, .45, z);
  B.box("frame", w - .1, .03, d - .1, 0, .2, d / 2);
  const dx = w / 2 - .34; B.box("white", .52, .64, d - .08, dx, .56, d / 2); for (let k = 0; k < 3; k++) { B.box("frame", .46, .012, .005, dx, .35 + k * .2, d - .038); B.box("steel", .14, .02, .025, dx, .44 + k * .2, d - .025); }
  const vx = -w / 2 + .3; B.box("metal", .18, .1, .14, vx, 1.0, d - .14); B.box("metal", .05, .14, .14, vx - .06, 1.04, d - .14); B.box("metal", .05, .14, .14, vx + .06, 1.04, d - .14); B.cyl("steel", .012, .012, .24, 6, vx, 1.02, d - .02, PI / 2);
  B.box("orange", .44, .16, .26, vx + .5, 1.025, .22); B.box("frame", .18, .03, .03, vx + .5, 1.12, .22); B.box("frame", .45, .012, .262, vx + .5, 1.03, .22);
  const sx = dx - .1; B.sph("white", .13, sx, 1.0, .32, 1, .4, 1, 16, 8); B.tor("frame", .21, .015, sx, .99, .32, PI / 2, 0, 0, 4, 24); B.sph("lc", .025, sx, 1.0, .45);
  for (let k = 0; k < 2; k++) crate(B, I, -w / 2 + .3 + k * .42, .215 + .12, d / 2, .34, .24, .34, (R() - .5) * .2, (R() * CRATE_COLS.length) | 0);
}
function hydro(B, w, R){
  const n = Math.max(1, Math.round(w / .52)), sp = w / n, zc = .26;
  B.box("white", w, .34, .46, 0, .17, .25); B.box("lc", w - .1, .015, .01, 0, .3, .481); B.box("frame", w + .02, .03, .48, 0, .355, .25);
  if (w > .8) B.plane("screen", .3, .15, PR.hydro, -w / 2 + .22, .17, .482);
  B.cyl("pipe", .03, .03, w, 10, 0, .48, .07, 0, 0, PI / 2);
  for (let i = 0; i < n; i++) { const x = -w / 2 + sp * (i + .5);
    B.cyl("frame", .21, .22, .06, 18, x, .4, zc); B.cyl("glass", .2, .2, 1.72, 18, x, 1.29, zc, 0, 0, 0, true); B.cyl("frame", .21, .21, .1, 18, x, 2.2, zc);
    B.tor("lp", .16, .014, x, 2.14, zc, PI / 2, 0, 0, 4, 20); B.tor("rib", .202, .008, x, .8, zc, PI / 2, 0, 0, 4, 20); B.tor("rib", .202, .008, x, 1.6, zc, PI / 2, 0, 0, 4, 20);
    B.cyl("water", .19, .19, .32, 14, x, .6, zc); B.rod("pipe", [x, .48, .07], [x, .43, zc - .1], .018, 6);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + i; B.rod("stem", [x + Math.sin(a) * .02, .62, zc + Math.cos(a) * .02], [x + Math.sin(a) * .05, 2.0 - k * .15, zc + Math.cos(a) * .05], .008, 4); }
    for (let k = 0; k < 34; k++) { const a = R() * TAU, rr = R() * .05, yy = .7 + R() * 1.3, s = .75 + .45 * R(), lw = .11 * s, lh = .17 * s;
      B.add("leaf", new T3.PlaneGeometry(lw, lh).translate(0, lh / 2, 0).rotateX(-(.35 + R() * .5)).rotateY(a), x + Math.sin(a) * rr, yy, zc + Math.cos(a) * rr); }
    for (let k = 0; k < 3; k++) { const a = i * 2 + k * 2.1; B.sph(k === 1 ? "orange" : "red", .024, x + Math.sin(a) * .08, .95 + k * .36, zc + Math.cos(a) * .08, 1, 1, 1, 8, 6); } }
}
function suitCase(B, idx){
  const w = .9, d = .74, cz = d / 2 + .02, y0 = .22, gh = 1.98, gy = y0 + gh / 2;
  B.box("frame", w, y0, d, 0, y0 / 2, cz); B.box("lc", w - .06, .015, .01, 0, y0 - .03, cz + d / 2 + .001); B.plane("print", .5, .125, PR.plaque, 0, .1, cz + d / 2 + .003);
  B.add("glass", new T3.BoxGeometry(w - .04, gh, d - .04), 0, gy, cz);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box("rib", .03, gh, .03, sx * (w / 2 - .03), gy, cz + sz * (d / 2 - .03));
  B.box("frame", w + .02, .08, d + .02, 0, y0 + gh + .04, cz); B.box("lw", w - .16, .01, d - .16, 0, y0 + gh - .006, cz);
  B.cyl("frame", .26, .3, .05, 20, 0, y0 + .025, cz);
  for (const k of [-1, 1]) { B.add("suit", new T3.CapsuleGeometry(.075, .5, 4, 10), k * .1, y0 + .43, cz); B.box("rubber", .13, .09, .21, k * .1, y0 + .1, cz + .03); B.tor("frame", .08, .012, k * .1, y0 + .2, cz, PI / 2, 0, 0, 4, 16); }
  B.box("suit", .32, .16, .2, 0, y0 + .78, cz); B.add("suit", new T3.CapsuleGeometry(.16, .26, 4, 12), 0, y0 + 1.1, cz, 0, 0, 0, 1.05, 1, .75);
  B.box("white", .34, .46, .14, 0, y0 + 1.14, cz - .17); B.box("frame", .18, .1, .05, 0, y0 + 1.08, cz + .12);
  B.box("lc", .03, .02, .01, -.04, y0 + 1.09, cz + .146); B.box("ly", .03, .02, .01, .02, y0 + 1.09, cz + .146); B.box("lr", .02, .02, .01, .06, y0 + 1.09, cz + .146);
  for (const k of [-1, 1]) { B.add("suit", new T3.CapsuleGeometry(.06, .42, 4, 10), k * .27, y0 + 1.04, cz, 0, 0, k * .12); B.sph("frame", .055, k * .3, y0 + .75, cz, 1, 1.2, 1, 10, 8); B.tor("frame", .062, .012, k * .295, y0 + .82, cz, PI / 2, 0, 0, 4, 14); }
  B.tor("rib", .1, .022, 0, y0 + 1.36, cz, PI / 2, 0, 0, 6, 20);
  B.sph("suit", .15, 0, y0 + 1.5, cz, 1, 1.05, 1, 18, 12); B.add("gold", new T3.SphereGeometry(.153, 18, 10, PI / 2 - .85, 1.7, .95, .95), 0, y0 + 1.5, cz);
  B.plane("print", .09, .09, PR.badge(idx), -.07, y0 + 1.2, cz + .123);
}
function benchDock(B, w){
  B.box("cushion", w, .08, .4, 0, .47, .24); B.box("frame", w - .04, .06, .38, 0, .4, .23); for (const x of [-w / 2 + .12, w / 2 - .12]) B.box("frame", .06, .37, .3, x, .185, .23);
  B.box("cushion", w - .1, .42, .06, 0, .86, .04); B.box("lc", w - .1, .012, .01, 0, .36, .425);
  const n = w > 1.8 ? 2 : 1;
  for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : (i - .5) * w * .5;
    B.box("frame", .5, .56, .06, x, 1.58, .03); B.tor("lc", .17, .012, x, 1.62, .064, 0, 0, 0, 4, 28); B.plane("screen", .36, .1, PR.lade, x, 1.36, .062);
    B.sph("white", .13, x, 1.62, .12, 1, 1, .42, 16, 10); B.tor("frame", .2, .014, x, 1.62, .12, 0, 0, 0, 4, 24); B.sph("lc", .026, x, 1.62, .175, 1, 1, 1, 8, 6); }
}
function notfall(B){ B.box("red", .46, .72, .17, 0, 1.31, .085); B.plane("print", .4, .62, PR.sos, 0, 1.31, .172); B.box("ly", .46, .015, .01, 0, 1.68, .16); B.box("frame", .5, .04, .19, 0, .93, .095); }
function potPlant(B, R, s = 1){
  B.cyl("white", .2 * s, .16 * s, .44 * s, 18, 0, .22 * s, .26); B.tor("lc", .2 * s, .008, 0, .38 * s, .26, PI / 2, 0, 0, 4, 22); B.cyl("soil", .185 * s, .185 * s, .02, 16, 0, .43 * s, .26);
  for (let k = 0; k < 16; k++) { const a = k * 2.39996, t = .55 + .45 * R(), lw = .13 * s * t + .03, lh = .36 * s * t;
    B.add("leaf", new T3.PlaneGeometry(lw, lh).translate(0, lh / 2, 0).rotateX(-(.25 + .55 * R())).rotateY(a), Math.sin(a) * .04, .43 * s, .26 + Math.cos(a) * .04); }
}
function picture(B, w, h, reg){
  B.box("frame", w + .14, h + .14, .04, 0, 0, .02);
  for (const s of [-1, 1]) { B.box("rib", w + .14, .035, .035, 0, s * (h / 2 + .052), .058); B.box("rib", .035, h + .14, .035, s * (w / 2 + .052), 0, .058); }
  B.plane("art", w, h, reg, 0, 0, .043);
  const lw = Math.min(.9, w * .42); B.box("frame", .04, .04, .17, 0, h / 2 + .15, .085); B.box("frame", lw, .045, .07, 0, h / 2 + .14, .19); B.box("lw", lw - .04, .008, .04, 0, h / 2 + .114, .19);
}
function banner(B, w, h, reg, back = false){
  B.box("rib", w + .1, .03, .03, 0, h / 2 + .03, .05); for (const s of [-1, 1]) { B.sph("rib", .022, s * (w / 2 + .06), h / 2 + .03, .05, 1, 1, 1, 8, 6); B.box("frame", .02, .03, .05, s * (w / 2 - .04), h / 2 + .03, .02); }
  const g = uvR(new T3.PlaneGeometry(w, h, 1, 10), reg), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, .05 + .01 * Math.sin(p.getY(i) * 6 + .5));
  // frei hängende Banner (Halle): Rückseite mit gespiegelter Textur, sonst sind sie von hinten unsichtbar (einseitiges Material)
  if (back) { const gb = g.clone(), uv = gb.attributes.uv, ix = gb.index.array, pb = gb.attributes.position, u0 = (reg[0] + 1.5) / 1024, u1 = (reg[0] + reg[2] - 1.5) / 1024;
    for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + u1 - uv.getX(i));
    for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 2]; ix[i + 2] = t; }
    for (let i = 0; i < pb.count; i++) pb.setZ(i, pb.getZ(i) - .004);
    gb.computeVertexNormals(); B.add("print", gb); }
  g.computeVertexNormals(); B.add("print", g); B.box("rib", w * .7, .02, .02, 0, -h / 2 + .2, .055);
}
function badge(B, r, reg){ B.add("frame", new T3.CylinderGeometry(r * .99, r * .99, .02, 20, 1, true), 0, 0, .01, PI / 2); B.add("frame", new T3.CircleGeometry(r * .99, 20), 0, 0, .02); B.plane("print", 2 * r, 2 * r, reg, 0, 0, .024); }
function poster(B, w, h, reg){ B.box("frame", w + .06, h + .06, .02, 0, 0, .01); B.plane("print", w, h, reg, 0, 0, .022); for (const sx of [-1, 1]) for (const sy of [-1, 1]) B.sph("steel", .015, sx * (w / 2 - .03), sy * (h / 2 - .03), .028, 1, 1, .5, 8, 6); }

/* ---------- Fenster: Thermovorhänge, Lamellenblende ---------- */
function curtainGeo(w, h, R){
  const nx = 18, ny = 9, g = new T3.PlaneGeometry(w, h, nx, ny).translate(0, h / 2, 0), p = g.attributes.position, yt = Math.max(.6, h * .3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), u = x / w + .5, f = 1 - .5 * Math.exp(-(((y - yt) / .55) ** 2)) - .08 * Math.max(0, (y - yt) / (h - yt));
    p.setX(i, (u - .5) * w * f); p.setZ(i, .038 * Math.sin(u * TAU * 4.5) * (.5 + .5 * f) + .01 * Math.sin(y * 3 + u * 9)); }
  U.scaleUV(g, w / .45, h / .45); g.computeVertexNormals(); return g;
}
function windowDressing(ctx, B, F, w, R){
  const xc = (w.x0 + w.x1) / 2, W = w.x1 - w.x0, yb = w.y0 - .12, top = w.y1 + .2, cw = .62;
  // Prüfen: über den Konsolen (Hindernisse bis 3 m) nur den oberen Teil, unten liegt die Konsole selbst
  if (!ctx.frei(wbox(F, w.x0 - .5, w.x1 + .5, 3.12, top + .12, .1, .32))) return false;
  B.F = F;
  B.box("frame", W + .9, .14, .16, xc, top + .05, .2); B.box("lc", W + .86, .012, .01, xc, top - .025, .281);
  for (let k = 0; k < 9; k++) B.box("white", W - .1, .01, .075, xc, w.y1 + .04 - k * .058, .21, -.55, 0, 0);
  for (const s of [-1, 1]) B.cyl("frame", .004, .004, .62, 4, xc + s * (W / 2 - .4), w.y1 - .25, .25);
  for (const s of [-1, 1]) { const cx = s < 0 ? w.x0 + .02 : w.x1 - .14, h = top - (yb + .02 + .14);
    B.add("quilt", curtainGeo(cw, h, R), cx, yb + .16, .245);
    const yt = yb + .16 + Math.max(.6, h * .3); B.tor("ly", .16, .012, cx, yt, .245, PI / 2, 0, 0, 4, 20); B.box("rib", .05, .05, .16, cx - s * .2, yt, .14); }
  ctx.belege(wbox(F, w.x0 - .5, w.x1 + .5, yb, top + .12, .1, .32)); return true;
}
function windows(ctx, B, R, env){
  const S = env.S, Bo = ctx.bounds;
  if (S.fenster) { if (env.RD && env.RD.vorhang) for (const {side, w} of S.fenster) if (!windowDressing(ctx, B, wallF(ctx, side, 0), w, R)) LOG(ctx, "fenster-frei?", side, w.x0); return; }
  for (const [side, dir] of [["front", 1], ["back", -1]]) { const F = wallF(ctx, side, 0);
    for (const w of shellWins(S, dir)) { if (w.top) continue;
      if (w.big) { env.lightCurtain = {F, w}; continue; }
      if (!windowDressing(ctx, B, F, w, R)) LOG(ctx, "fenster-frei?", side, w.x0); } }
}

/* ---------- Instanzen: Kisten, Datenkristalle ---------- */
function buildCrates(ctx, list){
  if (!list.length) return; const geo = uvR(new T3.BoxGeometry(1, 1, 1), PR.crate), m = new T3.InstancedMesh(geo, MAT("crate"), list.length), o = new T3.Matrix4(), c = new T3.Color();
  list.forEach(([F, x, y, z, w, h, d, ry, col], i) => { o.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(w, h, d)); m.setMatrixAt(i, _m.multiplyMatrices(F, o)); m.setColorAt(i, c.set(CRATE_COLS[col])); });
  m.castShadow = false; m.receiveShadow = true; m.userData.noPick = true; ctx.group.add(m);
}
function buildCrystals(ctx, list, R){
  if (!list.length) return; const geo = new T3.OctahedronGeometry(.042, 0).scale(1, 2.3, 1), m = new T3.InstancedMesh(geo, MAT("crystal"), list.length), o = new T3.Matrix4();
  const cols = ["#6fe3ff", "#b78cff", "#e8f6ff", "#5ff0c8"].map(c => new T3.Color(c)), dim = cols.map(c => c.clone().multiplyScalar(.35)), st = list.map(() => true);
  list.forEach(([F, x, y, z, ci], i) => { o.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, i * .7, 0)), _s.set(1, 1, 1)); m.setMatrixAt(i, _m.multiplyMatrices(F, o)); m.setColorAt(i, cols[ci]); });
  m.userData.noPick = true; ctx.group.add(m); let acc = 0;
  ctx.tick(dt => { acc += dt; if (acc < .18) return; acc = 0; for (let k = 0; k < 3; k++) { const i = (R() * list.length) | 0; st[i] = !st[i]; m.setColorAt(i, st[i] ? cols[list[i][4]] : dim[list[i][4]]); } m.instanceColor.needsUpdate = true; });
}

/* ---------- Schwebendes: Drohnen, Holo-Globus ---------- */
function droneGeos(){
  const w = [new T3.SphereGeometry(.15, 12, 8).scale(1, .42, 1), new T3.SphereGeometry(.07, 10, 4, 0, TAU, 0, PI / 2).translate(0, .04, -.02)], d = [new T3.TorusGeometry(.26, .018, 4, 24).rotateX(PI / 2)];
  for (let k = 0; k < 4; k++) { const a = PI / 4 + k * PI / 2, x = Math.cos(a), z = Math.sin(a);
    d.push(new T3.BoxGeometry(.13, .02, .03).rotateY(-a).translate(x * .19, 0, z * .19), new T3.CylinderGeometry(.075, .075, .014, 14, 1, true).translate(x * .26, .02, z * .26));
    w.push(new T3.CylinderGeometry(.025, .02, .05, 8).translate(x * .26, 0, z * .26)); }
  d.push(new T3.CylinderGeometry(.05, .06, .04, 12).translate(0, -.07, 0));
  const g = [new T3.SphereGeometry(.03, 10, 8).translate(0, -.075, .035), new T3.BoxGeometry(.12, .012, .01).translate(0, 0, .148), new T3.CircleGeometry(.045, 12).rotateX(PI / 2).translate(0, -.066, -.06)];
  return [L.merge(w), L.merge(d), L.merge(g)];
}
function drones(ctx, list){
  if (!list.length) return; const geos = droneGeos(), n = list.length;
  const ms = ["white", "frame", "lc"].map((k, j) => { const im = new T3.InstancedMesh(geos[j], MAT(k), n); im.frustumCulled = false; im.userData.noPick = true; ctx.group.add(im); return im; });
  const o = new T3.Object3D(); o.rotation.order = "YXZ";
  const upd = t => { list.forEach((c, i) => { const a = t * c.sp + c.ph, dx = -Math.sin(a) * c.rx * c.dir, dz = Math.cos(a) * c.rz * c.dir;
      o.position.set(c.x + Math.cos(a) * c.rx, c.y + Math.sin(t * 1.3 + c.ph) * .12, c.z + Math.sin(a) * c.rz * c.dir); o.rotation.set(Math.sin(t * .9 + i) * .07, Math.atan2(dx, dz), Math.cos(t * 1.1 + i) * .07); o.updateMatrix();
      for (const im of ms) im.setMatrixAt(i, o.matrix); }); for (const im of ms) im.instanceMatrix.needsUpdate = true; };
  upd(0); ctx.tick((dt, t) => upd(t));
}
function airSpot(ctx, cands, hx, y0, y1, hz){ for (const [x, z] of cands) { const b = {x0: x - hx, x1: x + hx, y0, y1, z0: z - hz, z1: z + hz}; if (claim(ctx, b)) { LOG(ctx, "luft", x, z); return [x, z]; } } return null; }
function holoGlobe(ctx, x, y, z, env){
  const g = new T3.Group(); g.position.set(x, y, z); ctx.group.add(g); g.userData.noOcc = true;
  const pl = new T3.Group(); g.add(pl);
  const sph = new T3.Mesh(new T3.SphereGeometry(.4, 18, 12), L.imat("sd-globe", () => L.basic(Object.assign({map: globeTex(), color: 0x6fd6ff, opacity: .85, side: T3.DoubleSide}, L.ADD)))); pl.add(sph);
  const pts = []; const P = (lat, lon) => [.405 * Math.cos(lat) * Math.cos(lon), .405 * Math.sin(lat), .405 * Math.cos(lat) * Math.sin(lon)];
  for (let k = 0; k < 8; k++) { const lon = k / 8 * PI; for (let i = 0; i < 24; i++) pts.push(...P(-PI / 2 + i / 24 * TAU, lon), ...P(-PI / 2 + (i + 1) / 24 * TAU, lon)); }
  for (const lat of [-1, -.5, 0, .5, 1]) for (let i = 0; i < 32; i++) pts.push(...P(lat, i / 32 * TAU), ...P(lat, (i + 1) / 32 * TAU));
  const lg = new T3.BufferGeometry(); lg.setAttribute("position", new T3.Float32BufferAttribute(pts, 3));
  pl.add(new T3.LineSegments(lg, L.imat("sd-globeL", () => new T3.LineBasicMaterial(Object.assign({color: 0xa8ecff, opacity: .55, toneMapped: false}, L.ADD)))));
  const ring = new T3.Mesh(new T3.TorusGeometry(.6, .007, 4, 64), MAT(env.acc)); ring.rotation.set(PI / 2 + .35, 0, .2); g.add(ring);
  const moon = new T3.Mesh(new T3.SphereGeometry(.045, 10, 8), MAT("ly")); g.add(moon);
  const em = new T3.Group(); em.position.y = -.78; g.add(em);
  const eb = Mb(); eb.cyl("frame", .16, .2, .06, 20, 0, 0, 0); eb.cyl("rib", .08, .14, .05, 20, 0, -.05, 0); eb.tor("lc", .17, .012, 0, .03, 0, PI / 2, 0, 0, 4, 28); eb.sph("lc", .035, 0, -.09, 0, 1, 1, 1, 8, 6); eb.build(em);
  const cone = new T3.Mesh(new T3.CylinderGeometry(.36, .12, .36, 24, 1, true), L.imat("sd-cone", () => L.basic(Object.assign({map: L.tex.cone(), color: 0x6fd6ff, opacity: .4, side: T3.DoubleSide}, L.ADD)))); cone.position.y = -.56; g.add(cone);
  const ph = (x + z) * .7;
  ctx.tick((dt, t) => { pl.rotation.y += dt * .3; const a = t * .5 + ph; moon.position.set(Math.cos(a) * .6, Math.sin(a) * .2, Math.sin(a) * .6);
    g.position.set(x + Math.cos(t * .12 + ph) * .3, y + Math.sin(t * .8 + ph) * .06, z + Math.sin(t * .12 + ph) * .3); ring.rotation.z = .2 + t * .05; });
}
// Luftraum: über den Seiten und in der Gangmitte (nicht vor den Türschirmen am Gangende)
const AIR = [[-4.4, 6.75], [0, 1.8], [4.4, -6.75], [4.4, 6.75], [0, -2.4], [-4.4, -6.75], [-4.4, 2.25], [4.4, -2.25], [0, 4.6], [4.4, 2.25], [-4.4, -2.25]];
const rot = (a, k) => a.slice(k % a.length).concat(a.slice(0, k % a.length));

/* ---------- Themen der Räume ---------- */
function wallPiece(ctx, B, spec, build, opt = {}){ const o = wallSpot(ctx, opt.sides || ["left", "right"], 0, spec.h, spec.d, spec.minW, spec.maxW, opt); if (!o) return null; B.F = o.F; build(o.w, o); LOG(ctx, "thema", o.side, o.along, o.w); return o; }
// Protokoll der Ausstattung (nur zum Prüfen: R3D.api.cur().ctx._decorLog)
function LOG(ctx, ...a){ (ctx._decorLog = ctx._decorLog || []).push(a.map(v => typeof v === "number" ? +v.toFixed(2) : v).join(" ")); }
function cellRack(B, w, R, env){
  const d = .5, lv = [.08, .8, 1.52], posts = [-w / 2 + .03, w / 2 - .03];
  for (const x of posts) for (const z of [.05, d - .03]) B.box("frame", .05, 2.05, .05, x, 1.025, z);
  for (const y of lv) { B.box("rib", w, .04, d - .02, 0, y, d / 2 + .01); B.add("haz", U.scaleUV(new T3.BoxGeometry(w, .05, .012), w / .5, 1), 0, y - .01, d + .006); }
  B.box("frame", w, .3, .05, 0, 2.2, .1); B.plane("screen", Math.min(1.1, w - .2), .26, PR.energie, 0, 2.2, .128);
  const n = Math.floor((w - .16) / .24), cols = ["lc", "lc", "ly", "lg"];
  for (const y of lv) for (let i = 0; i < n; i++) { const x = -((n - 1) * .24) / 2 + i * .24, c = cols[(i + Math.round(y * 3)) % 4];
    B.cyl("white", .085, .085, .48, 16, x, y + .27, d / 2); B.cyl("frame", .09, .09, .05, 16, x, y + .045, d / 2); B.cyl("frame", .05, .05, .05, 12, x, y + .535, d / 2);
    B.cyl(c, .088, .088, .07, 16, x, y + .33, d / 2, 0, 0, 0, true); if (i % 2) B.rod("rubber", [x, y + .56, d / 2], [x, y + .66, .06], .012, 5); }
  B.box("frame", .1, 2.4, .1, w / 2 - .08, 1.2, .06); B.box(env.acc, .02, 2.2, .01, w / 2 - .08, 1.2, .112);
}
function plasmaCore(ctx, x, y, z){
  const g = new T3.Group(); g.position.set(x, y, z); ctx.group.add(g);
  const core = new T3.Mesh(new T3.SphereGeometry(.15, 20, 14), L.imat("sd-core", () => L.basic({color: 0xfff2c4}))); g.add(core);
  const halo = new T3.Mesh(new T3.SphereGeometry(.26, 20, 14), ADDM("halo", 0xffc85a, .22)); g.add(halo);
  const gp = new T3.BufferGeometry(); gp.setAttribute("position", new T3.Float32BufferAttribute([0, 0, 0], 3));
  const glo = new T3.Points(gp, L.imat("sd-coreglow", () => new T3.PointsMaterial({map: U.glowTex(), color: 0xffd27a, size: 1.5, transparent: true, opacity: .8, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}))); g.add(glo);
  const rings = new T3.InstancedMesh(new T3.TorusGeometry(1, .028, 4, 36), MAT("rib"), 3); rings.frustumCulled = false; g.add(rings);
  const glow = new T3.InstancedMesh(new T3.TorusGeometry(1, .012, 3, 36), MAT("ly"), 3); glow.frustumCulled = false; g.add(glow);
  const cage = Mb(); cage.tor("frame", .62, .02, 0, -.62, 0, PI / 2, 0, 0, 4, 40); cage.tor("frame", .62, .02, 0, .62, 0, PI / 2, 0, 0, 4, 40);
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; cage.rod("frame", [Math.cos(a) * .62, -.62, Math.sin(a) * .62], [Math.cos(a) * .62, .62, Math.sin(a) * .62], .012, 5); }
  cage.cyl("frame", .2, .26, .1, 20, 0, -.7, 0); cage.tor("lc", .24, .012, 0, -.66, 0, PI / 2, 0, 0, 4, 28); cage.build(g);
  const o = new T3.Object3D(), R0 = [.5, .42, .34];
  ctx.tick((dt, t) => { for (let i = 0; i < 3; i++) { o.rotation.set(t * (.6 + i * .25) + i, t * (.4 + i * .3), i * 1.1); o.scale.setScalar(R0[i]); o.updateMatrix(); rings.setMatrixAt(i, o.matrix); o.scale.setScalar(R0[i] + .001); o.updateMatrix(); glow.setMatrixAt(i, o.matrix); }
    rings.instanceMatrix.needsUpdate = glow.instanceMatrix.needsUpdate = true; const k = 1 + .08 * Math.sin(t * 5) + .04 * Math.sin(t * 13); core.scale.setScalar(k); halo.scale.setScalar(1 + .15 * Math.sin(t * 3)); });
}
function breakerCab(B, w){
  const d = .4; B.box("rib", w, 2.0, d, 0, 1.08, d / 2); B.box("frame", w + .04, .08, d + .02, 0, .04, d / 2); B.box("frame", w - .1, 1.8, .02, 0, 1.1, d + .01);
  const cols = Math.floor((w - .3) / .1), x0 = -((cols - 1) * .1) / 2;
  for (let r = 0; r < 5; r++) for (let c = 0; c < cols; c++) { const x = x0 + c * .1, y = .55 + r * .3; B.box("white", .07, .16, .05, x, y, d + .04); B.box((r * 7 + c) % 9 === 4 ? "ly" : (r + c) % 5 === 0 ? "lr" : "lg", .03, .03, .01, x, y + .045, d + .068); B.box("dark", .03, .05, .02, x, y - .02, d + .07); }
  for (let r = 0; r < 5; r++) B.box("lc", w - .2, .008, .01, 0, .41 + r * .3, d + .025);
  B.box("frame", .3, .3, .02, 0, 2.2, d - .002); B.plane("screen", .26, .26, PR.warn, 0, 2.2, d + .012);
  for (let k = 0; k < 3; k++) B.cyl("rubber", .03, .03, .36, 8, -w / 2 + .2 + k * .1, 2.27, .12);
}
function cableBundle(ctx, z, env){
  const B = ctx.bounds, S = env.S, pts = []; const y0 = S.WH + .55, sag = .75;
  for (let i = 0; i <= 40; i++) { const t = i / 40, x = B.x0 + .62 + t * (B.x1 - B.x0 - 1.24); pts.push([x, y0 - sag * 4 * t * (1 - t)]); }
  const inner = pts.filter(([x]) => x > B.x0 + 1.15 && x < B.x1 - 1.15);   // die Enden stecken in der Schräge (Raumhülle)
  for (let i = 0; i < inner.length - 1; i++) if (!ctx.frei({x0: inner[i][0], x1: inner[i + 1][0], y0: Math.min(inner[i][1], inner[i + 1][1]) - .3, y1: Math.max(inner[i][1], inner[i + 1][1]) + .1, z0: z - .16, z1: z + .16}, .04)) return false;
  ctx.belege({x0: B.x0 + 1.15, x1: B.x1 - 1.15, y0: y0 - sag - .3, y1: y0 + .1, z0: z - .16, z1: z + .16});
  const Mx = Mb(), offs = [[0, 0, "rubber"], [.055, .03, "rubber"], [-.05, .035, "orange"], [.01, -.055, "rubber"], [-.04, -.04, env.acc]];
  for (const [dy, dz, k] of offs) { const c = new T3.CatmullRomCurve3(pts.map(([x, y]) => new T3.Vector3(x, y + dy, z + dz))); Mx.add(k, new T3.TubeGeometry(c, 60, k === env.acc ? .012 : .024, 6, false)); }
  for (let i = 4; i < pts.length - 2; i += 6) { const [x, y] = pts[i]; Mx.tor("frame", .085, .018, x, y - .005, z, 0, PI / 2, 0, 4, 16); }
  const [mx, my] = pts[20]; Mx.box("frame", .36, .28, .26, mx, my - .2, z); Mx.box(env.acc, .38, .02, .27, mx, my - .1, z); Mx.box("ly", .05, .05, .01, mx + .1, my - .22, z + .135); Mx.box("lc", .05, .05, .01, mx - .1, my - .22, z + .135);
  Mx.build(ctx.group);
  // Energiepulse entlang des Bündels
  const curve = new T3.CatmullRomCurve3(pts.map(([x, y]) => new T3.Vector3(x, y - .002, z - .04))), N = 7, pp = new Float32Array(N * 3), pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.BufferAttribute(pp, 3));
  const p = new T3.Points(pg, L.imat("sd-pulse", () => new T3.PointsMaterial({map: U.glowTex(), color: 0xffe36a, size: .22, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}))); p.frustumCulled = false; ctx.group.add(p);
  const v = new T3.Vector3(); ctx.tick((dt, t) => { for (let i = 0; i < N; i++) { curve.getPointAt(((t * .09 + i / N) % 1), v); pp[i * 3] = v.x; pp[i * 3 + 1] = v.y; pp[i * 3 + 2] = v.z; } pg.attributes.position.needsUpdate = true; });
  return true;
}
function lensGeo(r, t, kind){
  const pts = [], n = 6;
  if (kind === "vex") { for (let i = 0; i <= n; i++) { const a = i / n * PI / 2; pts.push(new T3.Vector2(Math.sin(a) * r, -Math.cos(a) * t)); } for (let i = n - 1; i >= 0; i--) { const a = i / n * PI / 2; pts.push(new T3.Vector2(Math.sin(a) * r, Math.cos(a) * t)); } }
  else { pts.push(new T3.Vector2(0, -t * .3)); for (let i = 1; i <= n; i++) { const q = i / n; pts.push(new T3.Vector2(q * r, -(t * .3 + q * q * t * .9))); } for (let i = n; i >= 0; i--) { const q = i / n; pts.push(new T3.Vector2(q * r, t * .3 + q * q * t * .9)); } }
  return new T3.LatheGeometry(pts, 18);
}
function lensCase(B, w){
  const d = .46; B.box("white", w, .9, d, 0, .45, d / 2); B.box("frame", w - .1, .02, .01, 0, .62, d + .001); B.box("lc", w, .012, .01, 0, .88, d + .006);
  B.add("glass", new T3.BoxGeometry(w - .04, 1.1, d - .04), 0, 1.47, d / 2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box("rib", .03, 1.1, .03, sx * (w / 2 - .03), 1.47, d / 2 + sz * (d / 2 - .03));
  B.box("frame", w + .02, .08, d + .02, 0, 2.06, d / 2); B.box("lw", w - .12, .01, d - .12, 0, 2.015, d / 2); B.box("rib", w - .06, .015, d - .06, 0, 1.47, d / 2);
  const kinds = ["vex", "cave", "vex", "prism", "mirror", "vex", "cave"];
  for (const [row, y] of [[0, .92], [1, 1.48]]) { const n = Math.max(2, Math.floor((w - .2) / .32)); for (let i = 0; i < n; i++) { const x = -((n - 1) * .32) / 2 + i * .32, kd = kinds[(i + row * 3) % kinds.length], r = .09 + ((i + row) % 3) * .02;
      B.cyl("frame", .05, .06, .02, 12, x, y + .01, d / 2); B.cyl("steel", .007, .007, .14, 6, x, y + .09, d / 2);
      if (kd === "prism") B.add("lens", new T3.CylinderGeometry(.08, .08, .14, 3), x, y + .24, d / 2, 0, .3, 0);
      else if (kd === "mirror") { B.cyl("mirror", r, r, .012, 28, x, y + .16 + r, d / 2, PI / 2); B.tor("brass", r, .01, x, y + .16 + r, d / 2, 0, 0, 0, 4, 24); }
      else { B.add("lens", lensGeo(r, .025, kd), x, y + .16 + r, d / 2, PI / 2, 0, 0); B.tor("brass", r, .008, x, y + .16 + r, d / 2, 0, 0, 0, 4, 24); } } }
}
function mirrorSail(ctx, x, y, z){
  const g = new T3.Group(); g.position.set(x, y, z); ctx.group.add(g); const N = 7, Rr = .85;
  const core = new T3.Mesh(new T3.IcosahedronGeometry(.12, 1), L.imat("sd-core2", () => L.basic({color: 0xe8fbff}))); g.add(core); g.add(new T3.Mesh(new T3.SphereGeometry(.24, 16, 12), ADDM("halo2", 0x6fd6ff, .2)));
  const tiles = new T3.InstancedMesh(new T3.CylinderGeometry(.24, .24, .025, 6).rotateX(PI / 2), MAT("mirror"), N), frames = new T3.InstancedMesh(new T3.TorusGeometry(.235, .012, 4, 6).rotateZ(PI / 6), MAT("frame"), N), o = new T3.Object3D(), pts = [];
  for (let i = 0; i < N; i++) { const a = i / N * TAU; o.position.set(Math.cos(a) * Rr, Math.sin(a * 2) * .12, Math.sin(a) * Rr); o.lookAt(0, 0, 0); o.rotateY(.35); o.updateMatrix(); tiles.setMatrixAt(i, o.matrix); frames.setMatrixAt(i, o.matrix);
    pts.push(0, 0, 0, o.position.x, o.position.y, o.position.z); }
  g.add(tiles, frames);
  const lg = new T3.BufferGeometry(); lg.setAttribute("position", new T3.Float32BufferAttribute(pts, 3)); g.add(new T3.LineSegments(lg, L.imat("sd-rays", () => new T3.LineBasicMaterial(Object.assign({color: 0x9fe8ff, opacity: .45, toneMapped: false}, L.ADD)))));
  ctx.tick((dt, t) => { g.rotation.y = t * .18; g.rotation.x = Math.sin(t * .3) * .12; g.position.y = y + Math.sin(t * .7) * .06; core.rotation.y = -t; });
}
function telescope(B, dirX){
  const legs = [0, 1, 2].map(k => { const a = k / 3 * TAU + .5; return [Math.cos(a) * .48, 0, Math.sin(a) * .48]; }), top = [0, 1.02, 0];
  for (const f of legs) { B.rod("frame", f, top, .022, 8); B.sph("rubber", .03, f[0], .02, f[2], 1, .6, 1, 8, 6); B.rod("rib", [f[0] * .45, .52, f[2] * .45], [0, .52, 0], .01, 5); }
  B.cyl("rib", .05, .05, .04, 12, 0, .52, 0); B.cyl("frame", .09, .11, .14, 14, 0, 1.08, 0); for (const s of [-1, 1]) B.box("white", .1, .34, .05, 0, 1.3, s * .17);
  const el = .55, ax = new T3.Vector3(dirX * Math.cos(el), Math.sin(el), 0), c = new T3.Vector3(0, 1.36, 0), at = s => [c.x + ax.x * s, c.y + ax.y * s, c.z + ax.z * s];
  B.rod("white", at(-.6), at(.62), .13, 20); B.rod("frame", at(.6), at(.92), .145, 20); B.rod("ly", at(.18), at(.22), .133, 20);
  B.rod("frame", at(-.66), at(-.6), .12, 16); B.rod("steel", at(-.7), at(-.84), .025, 10);
  B.rod("white", [at(0)[0], at(0)[1] + .19, 0], [at(.35)[0], at(.35)[1] + .19, 0], .028, 10); B.rod("frame", [at(.1)[0], at(.1)[1] + .05, 0], [at(.1)[0], at(.1)[1] + .17, 0], .01, 4);
  B.rod("steel", [0, 1.36, 0], [0, 1.36, -.42 * dirX * 0 - .42], .015, 6); B.cyl("steel", .07, .07, .1, 14, 0, 1.36, -.46, PI / 2);
}
function lensStack(ctx, x, y, z, env){
  const g = new T3.Group(); g.position.set(x, y, z); ctx.group.add(g); const b = Mb();
  [[-.7, "vex", .2], [-.3, "cave", .16], [.05, "vex", .22], [.45, "vex", .14], [.8, "cave", .18]].forEach(([px, kd, r]) => { b.add("lens", lensGeo(r, .035, kd), px, 0, 0, 0, 0, PI / 2); b.tor("brass", r, .012, px, 0, 0, 0, PI / 2, 0, 4, 28); });
  b.rod("rib", [-.95, -.32, 0], [1.0, -.32, 0], .015, 6); for (const px of [-.7, -.3, .05, .45, .8]) b.rod("frame", [px, -.32, 0], [px, -.14, 0], .008, 4);
  b.build(g);
  const beam = new T3.Mesh(new T3.CylinderGeometry(.03, .03, 2.3, 10, 1, true).rotateZ(PI / 2), ADDM("beam", 0xfff1a8, .55)); g.add(beam);
  const halo = new T3.Mesh(new T3.CylinderGeometry(.09, .09, 2.3, 10, 1, true).rotateZ(PI / 2), ADDM("beam2", 0xffd76a, .12)); g.add(halo);
  ctx.tick((dt, t) => { g.rotation.y = t * .15; g.position.y = y + Math.sin(t * .6) * .07; g.rotation.z = Math.sin(t * .4) * .05; });
}
function fighterGeos(){
  const ws = new T3.Shape(); ws.moveTo(0, .28); ws.lineTo(.5, -.26); ws.lineTo(.12, -.2); ws.lineTo(-.12, -.2); ws.lineTo(-.5, -.26); ws.closePath();
  const w = [new T3.CylinderGeometry(.08, .11, .62, 10).rotateX(PI / 2), new T3.ConeGeometry(.08, .34, 10).rotateX(PI / 2).translate(0, 0, .48), new T3.ExtrudeGeometry(ws, {depth: .02, bevelEnabled: false}).rotateX(PI / 2).translate(0, -.01, -.05)];
  const d = [new T3.SphereGeometry(.065, 12, 8, 0, TAU, 0, PI / 2).scale(1, .8, 1.8).translate(0, .06, .14), new T3.BoxGeometry(.02, .16, .2).translate(0, .1, -.24)];
  for (const s of [-1, 1]) { d.push(new T3.CylinderGeometry(.014, .014, .34, 6).rotateX(PI / 2).translate(s * .46, -.01, -.06)); w.push(new T3.CylinderGeometry(.05, .06, .26, 10).rotateX(PI / 2).translate(s * .16, -.02, -.22)); }
  const g = [new T3.CircleGeometry(.05, 12).translate(.16, -.02, 0).rotateY(PI).translate(0, 0, -.351), new T3.CircleGeometry(.05, 12).translate(-.16, -.02, 0).rotateY(PI).translate(0, 0, -.351), new T3.CircleGeometry(.07, 12).rotateY(PI).translate(0, 0, -.311)];
  return [L.merge(w), L.merge(d), L.merge(g)];
}
function fighterStatic(B, x, y, z, s, ry){ const [a, b, c] = fighterGeos(); for (const [k, g] of [["white", a], ["frame", b], ["lc", c]]) B.add(k, g, x, y, z, 0, ry, 0, s, s, s); }
function shipShelf(B, w){
  const d = .45; B.box("frame", w, 2.2, .04, 0, 1.1, .02); for (const x of [-w / 2 + .03, w / 2 - .03]) B.box("rib", .05, 2.2, d, x, 1.1, d / 2);
  B.box("rib", w, .1, d, 0, .05, d / 2); B.box("rib", w, .06, d, 0, 2.17, d / 2);
  [.62, 1.2, 1.78].forEach((y, k) => { B.box("white", w - .06, .03, d - .02, 0, y, d / 2); B.box("lc", w - .1, .01, .01, 0, y - .025, d - .02);
    const n = w > 1.5 ? 2 : 1; for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : (i - .5) * w * .48; B.cyl("frame", .06, .08, .03, 12, x, y + .03, d / 2); B.cyl("steel", .006, .006, .14, 4, x, y + .1, d / 2);
      fighterStatic(B, x, y + .2, d / 2, .38 + .06 * ((i + k) % 2), .7 + i * 1.1 + k); } });
  B.cyl("frame", .1, .12, .04, 14, 0, .12, d / 2); B.plane("print", .3, .3, PR.badge(4), 0, .38, d - .01 + .015);
}
function flyingFighters(ctx, x, y, z, rx, rz){
  const geos = fighterGeos(), n = 3, ms = ["white", "frame", "lc"].map((k, j) => { const im = new T3.InstancedMesh(geos[j], MAT(k), n); im.frustumCulled = false; im.userData.noPick = true; ctx.group.add(im); return im; });
  const tp = new Float32Array(n * 6 * 3), tg = new T3.BufferGeometry(); tg.setAttribute("position", new T3.BufferAttribute(tp, 3));
  const trail = new T3.Points(tg, L.imat("sd-trail", () => new T3.PointsMaterial({map: U.glowTex(), color: 0x7fe0ff, size: .16, transparent: true, opacity: .8, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}))); trail.frustumCulled = false; ctx.group.add(trail);
  const o = new T3.Object3D(); o.rotation.order = "YXZ"; const S = .55;
  const pos = (a, i) => [x + Math.cos(a) * rx, y + Math.sin(a * 2 + i) * .18, z + Math.sin(a) * rz];
  const upd = t => { for (let i = 0; i < n; i++) { const a = t * .32 + i * .42, [px, py, pz] = pos(a, i), [qx, qy, qz] = pos(a + .02, i); o.position.set(px, py, pz); o.rotation.set(-(qy - py) * 8, Math.atan2(qx - px, qz - pz), -.5);
      o.scale.setScalar(S); o.updateMatrix(); for (const im of ms) im.setMatrixAt(i, o.matrix);
      for (let k = 0; k < 6; k++) { const [tx, ty, tz] = pos(a - .03 - k * .025, i); tp.set([tx, ty, tz], (i * 6 + k) * 3); } }
    for (const im of ms) im.instanceMatrix.needsUpdate = true; tg.attributes.position.needsUpdate = true; };
  upd(0); ctx.tick((dt, t) => upd(t));
}
function ionEngine(ctx, x, y, z){
  const g = new T3.Group(); g.position.set(x, y, z); ctx.group.add(g); const b = Mb();
  b.cyl("white", .3, .3, .5, 20, 0, 0, 0, PI / 2); b.cyl("gold", .31, .31, .16, 20, 0, 0, -.08, PI / 2); b.cyl("frame", .34, .34, .05, 20, 0, 0, .27, PI / 2); b.tor("lc", .3, .016, 0, 0, .3, 0, 0, 0, 4, 28);
  b.cyl("rib", .2, .3, .22, 16, 0, 0, -.36, PI / 2); b.cyl("frame", .08, .12, .1, 12, 0, 0, -.52, PI / 2);
  for (const s of [-1, 1]) { b.box("panel", .9, .02, .36, s * .8, 0, -.1); b.box("rib", .92, .03, .03, s * .8, 0, -.1); b.rod("frame", [s * .3, 0, -.1], [s * .36, 0, -.1], .02, 6); }
  b.build(g);
  const grid = new T3.Mesh(new T3.CircleGeometry(.27, 24), ADDM("ion", 0x7fd8ff, .85)); grid.position.z = .301; g.add(grid);
  // Ionenstrahl: am Gitter so breit wie das Gitter (hell) und dahinter aufweitend (verblassend), Länge 1,3 m – reicht beim Drehen bis 1,7 m (airSpot hx 1,8)
  const plume = new T3.Mesh(new T3.CylinderGeometry(.5, .25, 1.3, 20, 1, true).rotateX(PI / 2).translate(0, 0, .95), L.imat("sd-plume", () => L.basic(Object.assign({map: L.tex.cone(), color: 0x5fc8ff, opacity: .45, side: T3.DoubleSide}, L.ADD))));
  plume.userData.noPick = true; g.add(plume);
  ctx.tick((dt, t) => { g.rotation.y = t * .16; g.position.y = y + Math.sin(t * .7) * .07; g.rotation.z = Math.sin(t * .5) * .06; plume.material.opacity = .38 + .1 * Math.sin(t * 9); });
}
function thrustStand(ctx, B, w, F, env){
  const d = .95, zc = .5, ex = -w / 2 + .55;
  B.box("frame", w, .1, .8, 0, .05, zc); B.add("haz", U.scaleUV(new T3.BoxGeometry(w + .02, .02, .82), (w + .02) / .5, 1), 0, .005, zc);
  for (const px of [ex + .1, ex + .55]) { B.rod("rib", [px - .2, .1, zc - .3], [px, .95, zc], .03, 8); B.rod("rib", [px + .2, .1, zc - .3], [px, .95, zc], .03, 8); B.rod("rib", [px, .1, zc + .32], [px, .95, zc], .03, 8); B.tor("frame", .23, .025, px, .95, zc, 0, PI / 2, 0, 6, 24); }
  B.rod("steel", [ex - .4, .95, zc], [ex + .45, .95, zc], .2, 22); B.add("steel", new T3.SphereGeometry(.2, 20, 10, 0, TAU, 0, PI / 2), ex - .4, .95, zc, 0, 0, PI / 2);
  const prof = [[.13, 0], [.11, .05], [.12, .18], [.19, .42], [.33, .72]].map(([r, y]) => new T3.Vector2(r, y));
  B.add("copper", new T3.LatheGeometry(prof, 28), ex + .45, .95, zc, 0, 0, -PI / 2); B.add("dark", new T3.LatheGeometry(prof.map(p => new T3.Vector2(p.x - .012, p.y)).reverse(), 28), ex + .45, .95, zc, 0, 0, -PI / 2);
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + .4; B.rod("pipe", [ex - .3, .95 + Math.cos(a) * .22, zc + Math.sin(a) * .22], [ex + .5, .95 + Math.cos(a) * .15, zc + Math.sin(a) * .15], .016, 6); }
  B.box("haz", .12, 1.3, .9, w / 2 - .12, .75, zc, 0, 0, 0); B.box("frame", .16, 1.36, .94, w / 2 - .04, .75, zc);
  B.box("frame", .06, 1.2, .06, -w / 2 + .1, .6, .9); B.box("frame", .46, .46, .05, -w / 2 + .1, 1.3, .9, 0, .5, 0); B.plane("screen", .4, .4, PR.gauge, -w / 2 + .1 + Math.sin(.5) * .03, 1.3, .9 + Math.cos(.5) * .03, 0, .5, 0);
  // Flamme (eigene Meshes, flackert)
  const fg = new T3.Group(); fg.applyMatrix4(F); ctx.group.add(fg); const x0 = ex + .45 + .72, len = (w / 2 - .2) - x0;
  const outer = new T3.Mesh(new T3.ConeGeometry(.3, len, 20, 1, true).rotateZ(PI / 2).translate(x0 + len / 2, .95, zc), ADDM("flameO", 0xff8a3d, .32));
  const inner = new T3.Mesh(new T3.ConeGeometry(.16, len * .7, 16, 1, true).rotateZ(PI / 2).translate(x0 + len * .35, .95, zc), ADDM("flameI", 0x9fe8ff, .6));
  fg.add(outer, inner); outer.userData.noPick = inner.userData.noPick = true;
  ctx.tick((dt, t) => { const f = .85 + .1 * Math.sin(t * 31) + .05 * Math.sin(t * 17); outer.material.opacity = .26 + .1 * f; inner.scale.set(1, .9 + .15 * Math.sin(t * 23), .9 + .15 * Math.sin(t * 23)); });
}
function weightRack(B, w){
  const d = .55; B.box("frame", w, .08, d, 0, .04, d / 2); B.box("frame", .08, 1.3, .08, 0, .69, d / 2); B.box("frame", w - .1, .06, .06, 0, 1.3, d / 2);
  for (const x of [-w / 2 + .1, w / 2 - .1]) B.box("frame", .06, 1.3, .3, x, .69, d / 2);
  const plates = [[.24, .06, "#FF5C5C", 3], [.21, .05, "#4FC3F7", 2], [.18, .045, "#FFE81F", 1], [.15, .04, "#3DDC97", 0]];
  for (const [hx, side] of [[-w / 4, 1], [w / 4, -1]]) for (const hy of [.42, .95]) { B.cyl("steel", .025, .025, .4, 10, hx, hy, d / 2 + .02, PI / 2); let off = .06;
    for (const [r, t, col, ki] of plates.slice(hy > .5 ? 1 : 0)) { if (r + .05 > hy) continue; B.cyl("rubber", r, r, t, 28, hx, hy, d / 2 + off + t / 2 - .05, PI / 2); B.add("acc:" + col, new T3.TorusGeometry(r - .012, .01, 4, 32), hx, hy, d / 2 + off + t - .05 + .002);
      off += t + .006; }
    const ki = hy > .5 ? 1 : 3; B.plane("print", .13, .13, PR.kg(ki), hx, hy + .12, d / 2 + off - .05 + .003); }
  for (let k = 0; k < 3; k++) { const x = -w / 2 + .35 + k * .3, y = 1.38; B.cyl("steel", .016, .016, .26, 8, x, y, d / 2, PI / 2); for (const s of [-1, 1]) B.cyl("rubber", .045 + k * .008, .045 + k * .008, .06, 6, x, y, d / 2 + s * .11, PI / 2); }
}
function springWall(B, w){
  // Rahmen 3,6 cm tief: die Lichtleiste der Hülle (y = 1,1 m, 3 cm tief) läge sonst bündig mit der Rahmenfront (Flimmern an den Rändern)
  B.box("frame", w, 1.5, .036, 0, 1.65, .018); B.box("white", w - .08, 1.42, .01, 0, 1.65, .035); B.box("rib", w, .06, .14, 0, 2.36, .08);
  for (let k = 0; k <= 12; k++) B.box(k % 2 ? "frame" : "ly", k % 2 ? .06 : .1, .008, .005, w / 2 - .12, 2.28 - k * .1, .042);
  const n = 4, sp = (w - .45) / n;
  for (let i = 0; i < n; i++) { const x = -w / 2 + .18 + sp * (i + .5), m = i + 1, Ls = .32 + m * .12;
    B.add("steel", springGeo(.042, .006, Ls, 9 + i), x, 2.31, .12); B.cyl("steel", .004, .004, .06, 4, x, 2.31 - Ls - .03, .12);
    for (let k = 0; k < m; k++) B.cyl(k % 2 ? "brass" : "frame", .05, .05, .07, 16, x, 2.31 - Ls - .1 - k * .075, .12);
    B.box("ly", .1, .006, .006, x, 2.31 - Ls - .06, .045); }
}
function springGeo(R0, r, len, turns, seg = 72){ const pts = []; for (let i = 0; i <= seg; i++) { const t = i / seg, a = t * turns * TAU; pts.push(new T3.Vector3(Math.cos(a) * R0, -t * len, Math.sin(a) * R0)); }
  return new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), seg, r, 5, false); }
function rockGeo(r, R){ const g = new T3.IcosahedronGeometry(r, 2), p = g.attributes.position, seen = new Map();
  for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) seen.set(k, .78 + R() * .38); const f = seen.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * .85, p.getZ(i) * f); }
  g.computeVertexNormals(); return g; }
// Ausleger kurz genug, dass der Brocken neben (nicht über) dem Exponat vor dem Wandfeld hängt (Exponate stehen ab ~1,8 m vor der Wand)
const CRANE_REACH = 1.15;
function crane(ctx, B, F, R){
  const reach = CRANE_REACH, yb = 4.95;
  B.box("haz", .5, .04, .5, 0, .02, .3); B.box("rib", .24, yb + .2, .24, 0, (yb + .2) / 2, .25); B.box("frame", .3, .3, .3, 0, .15, .25); B.box("frame", .34, .3, .34, 0, yb + .05, .25);
  for (const yy of [yb + .12, yb - .12]) B.box("frame", .08, .08, reach, 0, yy, .25 + reach / 2);
  for (let k = 0; k < 6; k++) { const z0 = .3 + k * reach / 6, z1 = z0 + reach / 6; B.rod("frame", [0, yb - .12, z0], [0, yb + .12, z1], .014, 5); }
  B.rod("rib", [0, yb - 1.0, .3], [0, yb - .14, .25 + reach * .55], .04, 8);
  B.box("ly", .2, .14, .26, 0, yb - .2, .25 + reach - .2); B.box("lc", .02, .02, .01, .06, yb - .2, .25 + reach - .2 + .131);
  const pivot = new T3.Vector3(0, yb - .28, .25 + reach - .2).applyMatrix4(F), g = new T3.Group(); g.position.copy(pivot); ctx.group.add(g);
  const rot0 = new T3.Euler().setFromRotationMatrix(F); g.rotation.y = rot0.y;
  const hb = Mb(); hb.cyl("steel", .008, .008, .62, 5, 0, -.31, 0); hb.tor("steel", .05, .012, 0, -.67, 0, 0, 0, 0, 4, 14); hb.box("frame", .12, .08, .08, 0, -.62, 0);
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + .4; hb.rod("rubber", [0, -.7, 0], [Math.cos(a) * .28, -1.02, Math.sin(a) * .28], .008, 4); } hb.build(g);
  const rock = new T3.Mesh(rockGeo(.33, R), MAT("rock")); rock.position.y = -1.18; rock.rotation.set(.3, .5, .1); rock.userData.noPick = true; g.add(rock);
  const net = new T3.Mesh(new T3.SphereGeometry(.36, 10, 8, 0, TAU, PI * .35, PI * .65), L.imat("sd-net", () => new T3.MeshBasicMaterial({color: 0x2b333d, wireframe: true}))); net.position.y = -1.16; g.add(net);
  ctx.tick((dt, t) => { g.rotation.x = Math.sin(t * 1.6) * .05; g.rotation.z = Math.sin(t * 1.1 + 1) * .035; rock.rotation.y = .5 + Math.sin(t * .5) * .3; });
}
function springPallet(ctx, B, F, w){
  B.box("frame", w, .1, .8, 0, .05, .45); B.add("haz", U.scaleUV(new T3.BoxGeometry(w, .02, .02), w / .5, 1), 0, .1, .86);
  const g = new T3.Group(); g.applyMatrix4(F); ctx.group.add(g); const top = new T3.Group(); g.add(top);
  const tb = Mb(); tb.box("rib", w - .08, .08, .72, 0, 0, .45); tb.box("ly", w - .08, .012, .01, 0, -.03, .815); tb.build(top);
  const cr = new T3.Mesh(uvR(new T3.BoxGeometry(.6, .5, .5), PR.crate), MAT("crate")); cr.position.set(-.05, .29, .45); cr.rotation.y = .12; cr.userData.noPick = true; top.add(cr);
  const sg = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) sg.push(springGeo(.06, .01, .4, 6, 60).translate(sx * (w / 2 - .14), .4, .45 + sz * .25));
  const springs = new T3.Mesh(L.merge(sg), MAT("steel")); springs.position.y = .1; springs.userData.noPick = true; g.add(springs);
  ctx.tick((dt, t) => { const s = 1 + .12 * Math.sin(t * 2.2) * (.7 + .3 * Math.sin(t * .3)); springs.scale.y = s; top.position.y = .1 + .4 * s + .04; });
}
const THEME = {
  strom1(ctx, B, R, I, env){
    wallPiece(ctx, B, {minW: 1.4, maxW: 2.2, d: .52, h: 2.45}, w => cellRack(B, w, R, env), {pref: -4});
    const p = airSpot(ctx, rot(AIR, 3), .75, 4.4, 6.0, .75); if (p) plasmaCore(ctx, p[0], 5.2, p[1]);
  },
  strom2(ctx, B, R, I, env){
    wallPiece(ctx, B, {minW: 1.0, maxW: 1.4, d: .5, h: 2.45}, w => breakerCab(B, w), {pref: 0});
    for (const z of [-6.75, 6.75, -2.25, 2.25]) if (cableBundle(ctx, z, env)) break;
  },
  optik1(ctx, B, R, I, env){
    wallPiece(ctx, B, {minW: 1.1, maxW: 1.6, d: .5, h: 2.15}, w => lensCase(B, w), {pref: 2});
    const p = airSpot(ctx, rot(AIR, 5), 1.05, 4.45, 6.15, 1.05); if (p) mirrorSail(ctx, p[0], 5.3, p[1]);
  },
  optik2(ctx, B, R, I, env){
    const o = wallPiece(ctx, B, {minW: 1.9, maxW: 1.9, d: 1.15, h: 2.15}, (w, o) => { B.F = o.F.clone().multiply(new T3.Matrix4().makeTranslation(0, 0, .6)); telescope(B, o.side === "left" ? 1 : -1); }, {pref: -7});
    const p = airSpot(ctx, rot(AIR, 1), 1.25, 4.55, 6.05, 1.25); if (p) lensStack(ctx, p[0], 5.3, p[1], env);
  },
  beweg1(ctx, B, R, I, env){
    wallPiece(ctx, B, {minW: 1.2, maxW: 1.8, d: .47, h: 2.25}, w => shipShelf(B, w), {pref: -2});
    for (const [x, z, rx, rz] of [[0, 0, 1.3, 4.2], [0, 1, 1.2, 3.2], [0, -4.5, 1.2, 2.3], [0, 4.5, 1.2, 2.3], [4.3, 0, 1.1, 3.5], [-4.3, 0, 1.1, 3.5]])
      if (claim(ctx, {x0: x - rx - .4, x1: x + rx + .4, y0: 4.7, y1: 5.95, z0: z - rz - .4, z1: z + rz + .4})) { flyingFighters(ctx, x, 5.3, z, rx, rz); break; }
  },
  beweg2(ctx, B, R, I, env){
    wallPiece(ctx, B, {minW: 2.4, maxW: 2.8, d: .98, h: 1.6}, (w, o) => thrustStand(ctx, B, w, o.F, env), {pref: -6});
    const p = airSpot(ctx, rot(AIR, 2), 1.8, 4.5, 6.05, 1.8); if (p) ionEngine(ctx, p[0], 5.3, p[1]);
  },
  kraft1(ctx, B, R, I, env){
    wallPiece(ctx, B, {minW: 1.3, maxW: 1.6, d: .56, h: 1.6}, w => weightRack(B, w), {pref: -2});
    wallPiece(ctx, B, {minW: 1.4, maxW: 1.8, d: .2, h: 2.45}, w => springWall(B, w), {pref: 6, obst: false});
  },
  kraft2(ctx, B, R, I, env){
    // Ladekran nur vor einem Wandfeld ohne Tafel (der Brocken hängt in 3,1–3,9 m Höhe, gut 1 m vor der Wand)
    for (const side of ["left", "right"]) { let done = false;
      for (const zc of [-2.25, 2.25, -6.75, 6.75]) { const F = wallF(ctx, side, zc);
        // Mast am Boden, Ausleger und Last oberhalb der Hindernisse (die zählen bis 3 m), dazu das Wandfeld (kein Bild hinter dem Mast)
        const zl = .25 + CRANE_REACH + .4; if (!ctx.frei(wbox(F, -.45, .45, 3.1, 5.35, .45, zl)) || !ctx.frei(wbox(F, -.3, .3, 0, 5.35, 0, .5)) || !ctx.frei(wbox(F, -1.3, 1.3, 2.7, 5.4, 0, .45))) continue;
        claim(ctx, wbox(F, -.3, .3, 0, 5.35, 0, .5), true); ctx.belege(wbox(F, -.45, .45, 3.1, 5.35, .45, zl)); ctx.belege(wbox(F, -1.3, 1.3, 2.7, 5.4, 0, .45));
        B.F = F; crane(ctx, B, F, R); LOG(ctx, "kran", side, zc); done = true; break; }
      if (done) break; }
    wallPiece(ctx, B, {minW: 1.1, maxW: 1.3, d: .9, h: 1.5}, (w, o) => springPallet(ctx, B, o.F, w), {pref: 2});
  }
};

/* ---------- Halle: festliche Ausstattung ---------- */
function garlands(ctx, env, R){
  const B = ctx.bounds, H = env.S.H, sky = {z: -3.5, r: 3.3}, lines = [], bulbs = [], cols = [], pal = [[1, .91, .45], [.45, .85, 1], [1, .55, .85], [.6, 1, .7]];
  const ends = []; for (const s of [-1, 1]) for (const z of [-13.25, -9.75, -6.25, -2.75, .75, 4.25]) ends.push([s * (B.x1 - .08), 8.0, z]);
  ends.forEach(([ex, ey, ez], gi) => { const a = Math.atan2(ez - sky.z, ex), sx = Math.cos(a) * sky.r, sz = sky.z + Math.sin(a) * sky.r, sy = H - .45;
    const Ln = Math.hypot(ex - sx, ez - sz), n = Math.round(Ln / .32), P = [];
    for (let i = 0; i <= n; i++) { const t = i / n; P.push([sx + (ex - sx) * t, sy + (ey - sy) * t - 1.1 * 4 * t * (1 - t), sz + (ez - sz) * t]); }
    const seg = (a2, b2) => ({x0: Math.min(a2[0], b2[0]), x1: Math.max(a2[0], b2[0]), y0: Math.min(a2[1], b2[1]) - .06, y1: Math.max(a2[1], b2[1]) + .03, z0: Math.min(a2[2], b2[2]), z1: Math.max(a2[2], b2[2])});
    for (let i = 0; i < P.length - 1; i++) if (!ctx.frei(seg(P[i], P[i + 1]), .02)) return;
    for (let i = 0; i < P.length - 1; i++) ctx.belege(seg(P[i], P[i + 1]));
    for (let i = 0; i < P.length - 1; i++) lines.push(...P[i], ...P[i + 1]);
    P.forEach((p, i) => { if (i === 0 || i === P.length - 1) return; bulbs.push(p[0], p[1] - .05, p[2]); cols.push(...pal[(i + gi) % 4]); }); });
  LOG(ctx, "girlanden", bulbs.length / 3); if (!bulbs.length) return;
  const lg = new T3.BufferGeometry(); lg.setAttribute("position", new T3.Float32BufferAttribute(lines, 3)); const lm = new T3.LineSegments(lg, L.imat("sd-wire", () => new T3.LineBasicMaterial({color: 0x39424d}))); ctx.group.add(lm);
  const pg = new T3.BufferGeometry(), ca = new T3.Float32BufferAttribute(cols, 3), base = cols.slice(); pg.setAttribute("position", new T3.Float32BufferAttribute(bulbs, 3)); pg.setAttribute("color", ca);
  const pm = new T3.Points(pg, L.imat("sd-bulbs", () => new T3.PointsMaterial({map: U.glowTex(), vertexColors: true, size: .3, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}))); ctx.group.add(pm);
  const N = bulbs.length / 3; let acc = 0;
  ctx.tick((dt, t) => { acc += dt; if (acc < .12) return; acc = 0; for (let k = 0; k < 6; k++) { const i = (R() * N) | 0, f = R() < .5 ? .25 : 1; ca.setXYZ(i, base[i * 3] * f, base[i * 3 + 1] * f, base[i * 3 + 2] * f); } ca.needsUpdate = true; });
}
function lightCurtain(ctx, B, F, w, R){
  const x0 = w.x0 + .25, x1 = w.x1 - .25, top = w.y1 + .15, n = 15, strands = [];
  if (!ctx.frei(wbox(F, x0 - .1, x1 + .1, 3.3, top + .12, .25, .55), .02)) return;
  ctx.belege(wbox(F, x0 - .1, x1 + .1, 3.3, top + .12, .25, .55)); LOG(ctx, "lichtvorhang");
  B.F = F; B.box("rib", x1 - x0 + .3, .05, .06, (x0 + x1) / 2, top + .05, .4); B.box("lc", x1 - x0 + .26, .01, .01, (x0 + x1) / 2, top + .02, .432);
  for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / (n - 1), len = 1.6 + 1.6 * (.5 + .5 * Math.cos((i / (n - 1) - .5) * PI * 2)) + R() * .3; strands.push([x, len]); }
  const lines = [], bulbs = [], ph = [], cols = [], pal = [[1, .93, .6], [.6, .88, 1], [1, .8, .95]];
  strands.forEach(([x, len], si) => { const k = Math.round(len / .2); for (let j = 1; j <= k; j++) { bulbs.push(x, top - j * .2, .4); ph.push(si, j); cols.push(...pal[(si + j) % 3]); } });
  const pos = new Float32Array(bulbs), lpos = new Float32Array(strands.length * 6), pg = new T3.BufferGeometry(), lg = new T3.BufferGeometry();
  pg.setAttribute("position", new T3.BufferAttribute(pos, 3)); pg.setAttribute("color", new T3.Float32BufferAttribute(cols, 3)); lg.setAttribute("position", new T3.BufferAttribute(lpos, 3));
  const grp = new T3.Group(); grp.applyMatrix4(F); ctx.group.add(grp);
  const pm = new T3.Points(pg, L.imat("sd-bulbs2", () => new T3.PointsMaterial({map: U.glowTex(), vertexColors: true, size: .22, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})));
  const lm = new T3.LineSegments(lg, L.imat("sd-wire2", () => new T3.LineBasicMaterial({color: 0x8a96a3, transparent: true, opacity: .6}))); pm.frustumCulled = lm.frustumCulled = false; grp.add(pm, lm);
  const upd = t => { let b = 0; strands.forEach(([x, len], si) => { const sw = j => .04 * Math.sin(t * .9 + si * .7) * (j / 10) ** 1.5; const k = Math.round(len / .2);
      for (let j = 1; j <= k; j++, b++) { pos[b * 3] = x + sw(j); pos[b * 3 + 2] = .4 + sw(j) * .6; }
      lpos.set([x, top, .4, x + sw(k), top - k * .2, .4 + sw(k) * .6], si * 6); }); pg.attributes.position.needsUpdate = true; lg.attributes.position.needsUpdate = true; };
  upd(0); ctx.tick((dt, t) => upd(t));
}
function stationModel(ctx, x, y, z){
  if (!claim(ctx, {x0: x - 2.1, x1: x + 2.1, y0: y - 1.1, y1: y + 1.15, z0: z - 2.1, z1: z + 2.1})) return false; LOG(ctx, "station", z);
  const g = new T3.Group(); g.position.set(x, y, z); ctx.group.add(g); const b = Mb();
  b.tor("white", 1.6, .14, 0, 0, 0, PI / 2, 0, 0, 10, 56); b.tor("lc", 1.6, .02, 0, -.12, 0, PI / 2, 0, 0, 4, 64); b.tor("frame", 1.6, .05, 0, .13, 0, PI / 2, 0, 0, 4, 48);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.box(k % 3 ? "white" : "rib", .34, .22, .3, Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6, 0, -a, 0); }
  b.cyl("rib", .32, .32, 1.1, 20, 0, 0, 0); b.cyl("frame", .22, .22, .3, 16, 0, .7, 0); b.cyl("frame", .22, .22, .3, 16, 0, -.7, 0); b.tor("ly", .33, .015, 0, .3, 0, PI / 2, 0, 0, 4, 32);
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4; b.rod("frame", [Math.cos(a) * .32, 0, Math.sin(a) * .32], [Math.cos(a) * 1.48, 0, Math.sin(a) * 1.48], .045, 8); }
  for (const s of [-1, 1]) { b.rod("frame", [0, s * .85, 0], [0, s * 1.0, 0], .02, 6); b.box("panel", 1.6, .02, .55, 0, s * 1.02, 0); b.box("panel", .55, .02, 1.6, 0, s * 1.02, 0); b.box("rib", 1.62, .03, .03, 0, s * 1.02, 0); }
  b.build(g);
  const cb = Mb(); for (const [dx, dz] of [[.0, .0]]) cb.cyl("steel", .012, .012, ctx.decorShell.H - y - 1.0, 6, x + dx, (ctx.decorShell.H + y + 1.0) / 2, z + dz); cb.build(ctx.group);
  const lp = []; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + .26; lp.push(Math.cos(a) * 1.76, 0, Math.sin(a) * 1.76); }
  const pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.Float32BufferAttribute(lp, 3));
  const pm = new T3.Points(pg, L.imat("sd-nav", () => new T3.PointsMaterial({map: U.glowTex(), color: 0xff6a6a, size: .28, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}))); g.add(pm);
  ctx.tick((dt, t) => { g.rotation.y = t * .08; pm.material.opacity = (t * 1.2) % 1 < .5 ? 1 : .25; });
  return true;
}
function planter(B, R){
  B.cyl("white", .4, .32, .6, 20, 0, .3, 0); B.tor("lc", .4, .012, 0, .5, 0, PI / 2, 0, 0, 4, 28); B.cyl("frame", .42, .42, .05, 20, 0, .62, 0); B.cyl("soil", .37, .37, .02, 16, 0, .63, 0);
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + .4; B.rod("stem", [Math.cos(a) * .06, .63, Math.sin(a) * .06], [Math.cos(a) * .16, 1.25 + k * .18, Math.sin(a) * .16], .02, 5); }
  for (let k = 0; k < 46; k++) { const a = k * 2.39996, t = .5 + .5 * R(), lw = .14 + .08 * t, lh = .34 + .3 * t, yb = .64 + (k % 3 === 2 ? .5 + R() * .7 : 0);
    B.add("leaf", new T3.PlaneGeometry(lw, lh).translate(0, lh / 2, 0).rotateX(-(.35 + .6 * R())).rotateY(a), Math.sin(a) * .08, yb, Math.cos(a) * .08); }
}
function hallBench(B, w){
  B.box("cushion", w, .09, .46, 0, .47, 0); B.box("frame", w - .06, .06, .42, 0, .4, 0); for (const x of [-w / 2 + .15, w / 2 - .15]) B.box("frame", .08, .37, .36, x, .185, 0);
  B.box("lc", w - .3, .012, .012, 0, .36, .2); B.box("rib", w + .04, .03, .5, 0, .37, 0);
}
function hallFloor(ctx, B, R, env){
  const Bo = ctx.bounds;
  // Pflanzkübel vor den Rippen zwischen den Türen
  for (const s of [-1, 1]) for (const z of [2.5, -4.5, -11.5]) { const x = s * (Bo.x1 - 1.2);
    if (claim(ctx, {x0: x - .44, x1: x + .44, y0: 0, y1: 2.0, z0: z - .44, z1: z + .44}, true)) { B.F = atF(x, 0, z); planter(B, R); LOG(ctx, "kübel", x, z); } }
  // Sitzbänke mit Blick zur Galaxie
  for (const s of [-1, 1]) for (const [z, ry] of [[2.6, PI], [-11.2, 0]]) { const F = atF(s * 4.6, 0, z, ry);
    if (claim(ctx, wbox(F, -1.05, 1.05, 0, .6, -.3, .3), true)) { B.F = F; hallBench(B, 2.0); LOG(ctx, "bank", s, z); } }
  // Raumanzug-Vitrine am Eingang
  for (const [x, ry] of [[-7.55, PI / 2], [7.55, -PI / 2]]) { const F = atF(x, 0, 9.0, ry);
    if (claim(ctx, wbox(F, -.47, .47, 0, 2.36, -.4, .4), true)) { B.F = F.clone().multiply(new T3.Matrix4().makeTranslation(0, 0, -.39)); suitCase(B, 0); LOG(ctx, "anzug", x); break; } }
}
function hallDecor(ctx, B, R, I, env){
  const S = env.S, H = S.H;
  // Sektor-Banner von der Decke vor jeder Tür, Abzeichen über jeder Tür
  for (const o of ctx._inter) { const ia = o.userData.ia; if (!ia || ia.kind !== "door" || !ia.topic) continue; const i = TOPICS.findIndex(t => t.id === ia.topic); if (i < 0) continue;
    const s = o.position.x < 0 ? -1 : 1, z = o.position.z, w = .95, h = 2.6, y = H - .55 - h / 2, F = atF(s * 5.2, y, z, s < 0 ? PI / 2 - .45 : -PI / 2 + .45);
    if (claim(ctx, wbox(F, -w / 2 - .1, w / 2 + .1, -h / 2, H - y, -.1, .12))) { B.F = F; banner(B, w, h, PR.banner(i), true); for (const sx of [-1, 1]) B.cyl("steel", .005, .005, H - y - h / 2 - .03, 4, sx * (w / 2 - .02), (H - y + h / 2 + .03) / 2, .05); }
    const Fw = wallF(ctx, s < 0 ? "left" : "right", z, 0, 7.4); if (claim(ctx, wbox(Fw, -.5, .5, -.5, .5, 0, .1))) { B.F = Fw; badge(B, .44, PR.badge(i)); }
  }
  garlands(ctx, env, R);
  if (env.lightCurtain) lightCurtain(ctx, B, env.lightCurtain.F, env.lightCurtain.w, R);
  for (const z of [-12.5, -12, -13]) if (stationModel(ctx, 0, 7.9, z)) break;
  hallFloor(ctx, B, R, env);
}

/* ---------- Ausstattung eines Raums ---------- */
// Je Wandabschnitt ein Hauptmöbel (je Raum anders gemischt), Reste und schmale Wandenden bekommen kleine Teile
const PRIM = ["shelf", "lockers", "archive", "workshop", "bench", "suit", "shelf", "lockers", "workshop"];
const FILL = ["hydro", "pot", "sos", "locker1", "hydro", "pot"];
const ITEMS = {
  shelf: {minW: 1.4, maxW: 2.6, d: .54, h: 2.45, build: (B, w, R, I) => shelf(B, w, R, I)},
  lockers: {minW: 1.2, maxW: 2.4, d: .98, h: 2.42, snap: .6, build: (B, w, R) => lockers(B, Math.round(w / .6), R)},
  archive: {minW: 1.1, maxW: 2.0, d: .5, h: 2.25, build: (B, w, R, I) => archive(B, w, R, I)},
  workshop: {minW: 1.7, maxW: 2.5, d: .62, h: 2.4, build: (B, w, R, I) => workshop(B, w, R, I)},
  bench: {minW: 1.3, maxW: 2.2, d: .5, h: 1.9, build: (B, w) => benchDock(B, w)},
  suit: {minW: .92, maxW: .92, d: .8, h: 2.32, build: (B, w, R, I, env) => suitCase(B, Math.max(0, env.idx))},
  hydro: {minW: .52, maxW: .52, d: .5, h: 2.3, build: (B, w, R) => hydro(B, w, R)},
  pot: {minW: .46, maxW: .46, d: .5, h: 1.1, build: (B, w, R) => potPlant(B, R, 1.0)},
  sos: {minW: .5, maxW: .5, d: .2, h: 1.72, wall: true, build: B => notfall(B)},
  locker1: {minW: .6, maxW: .6, d: .5, h: 2.42, build: (B, w, R) => lockers(B, 1, R, false)}
};
const shuf = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
function putItem(ctx, B, R, I, env, nm, side, along, w){ const it = ITEMS[nm], F = wallF(ctx, side, along);
  if (!claim(ctx, wbox(F, -w / 2, w / 2, it.wall ? .9 : 0, it.h, 0, it.d), !it.wall)) return false; B.F = F; it.build(B, w, R, I, env); LOG(ctx, nm, side, along, w); return true; }
function furnish(ctx, B, R, I, env, sides){
  const Bo = ctx.bounds, RD = env.RD || {}, prim = shuf((RD.moebel || PRIM).filter(n => ITEMS[n]), R), fill = shuf((RD.fueller || FILL).filter(n => ITEMS[n]), R); if (!prim.length && !fill.length) return; let pi = 0, fi = 0, suits = 0;
  const filler = (side, s, e, atEnd) => { const len = e - s; for (let k = 0; k < fill.length; k++) { const nm = fill[(fi + k) % fill.length], it = ITEMS[nm]; if (it.minW > len - .04) continue;
      const w = it.minW, along = atEnd ? e - .02 - w / 2 : s + .02 + w / 2; if (putItem(ctx, B, R, I, env, nm, side, along, w)) { fi = (fi + k + 1) % fill.length; return w; } } return 0; };
  for (const side of sides) for (const [s, e] of runs(ctx, side, Bo.z1, Bo.z0, 0, 2.45, .5)) { const len = e - s, flip = R() < .5;
    if (len < 1.3) { if (len >= .5) filler(side, s, e, flip); continue; }
    let done = 0;
    for (let k = 0; k < prim.length && !done; k++) { const nm = prim[(pi + k) % prim.length], it = ITEMS[nm]; if (it.minW > len - .04 || (nm === "suit" && suits)) continue;
      let w = Math.min(it.maxW, len - .04); const rest = len - .04 - w; if (rest > .1 && rest < .9) w = Math.min(it.maxW, len - .04);
      if (it.snap) w = Math.floor(w / it.snap + 1e-6) * it.snap; if (w < it.minW) continue;
      const along = flip ? e - .02 - w / 2 : s + .02 + w / 2;
      if (putItem(ctx, B, R, I, env, nm, side, along, w)) { done = w; pi = (pi + k + 1) % prim.length; if (nm === "suit") suits++; } }
    if (done && len - done - .04 >= .85) { if (flip) filler(side, s, e - done - .3, false); else filler(side, s + done + .3, e, true); }
  }
}
function wallArt(ctx, B, R, env){
  const RD = env.RD || {}; if (RD.bilder === false && RD.plakate === false) return;
  let order = rot([0, 1, 2, 3, 4, 5], (env.idx + 6) % 6); const pref = {optik2: 0, beweg1: 2, beweg2: 5, optik1: 3}[ctx.key];
  if (RD.bilder === false) order = []; else if (Array.isArray(RD.bilder)) order = RD.bilder.slice(); else if (pref != null) { order.splice(order.indexOf(pref), 1); order.unshift(pref); }
  const Bo = ctx.bounds;
  let pi = 0, si = 0;
  for (const side of ["left", "right"]) for (const [s, e] of runs(ctx, side, Bo.z1, Bo.z0, 2.8, 5.32, .26)) { const len = e - s, c = (s + e) / 2;
    if (len >= 1.9) { if (!order.length) continue; const w = Math.min(2.5, len - .3), h = w / 1.5, F = wallF(ctx, side, c, 0, 3.95); if (claim(ctx, wbox(F, -w / 2 - .08, w / 2 + .08, -h / 2 - .08, h / 2 + .24, 0, .24), false)) { B.F = F; picture(B, w, h, ART(order[pi++ % order.length])); LOG(ctx, "bild", side, c, w); } }
    else if (len >= .7) { if (RD.plakate === false) continue; const F = wallF(ctx, side, c, 0, 3.9), ban = (si++ + env.idx) % 2 === 0;
      if (ban && !env.hall) { if (claim(ctx, wbox(F, -.32, .32, -.85, .9, 0, .1), false)) { B.F = F; banner(B, .5, 1.5, PR.banner(Math.max(0, env.idx) % 8)); } }
      else if (claim(ctx, wbox(F, -.38, .38, -.6, .6, 0, .05), false)) { B.F = F; poster(B, .66, 1.06, PR.poster((si + env.idx) % 4)); } } }
}
function boardBadges(ctx, B, env){
  const Bo = ctx.bounds, bb = new T3.Box3();
  for (const o of ctx.group.children.slice(ctx._shellEnd || 0)) { if (!o.isMesh) continue; bb.setFromObject(o); if (bb.isEmpty()) continue;
    const thin = bb.max.x - bb.min.x < .2, side = bb.min.x < Bo.x0 + .2 ? "left" : bb.max.x > Bo.x1 - .2 ? "right" : null;
    if (!thin || !side || bb.min.y < 2.4 || bb.max.y > 5.6 || bb.max.z - bb.min.z < 1.5) continue;
    const zc = (bb.min.z + bb.max.z) / 2, r = .19, yc = bb.max.y + .1 + r + .02; if (yc + r > 5.72) continue;
    const ids = [(env.idx + 7) % 8, env.idx % 8, (env.idx + 1) % 8];
    [-.56, 0, .56].forEach((dz, k) => { const F = wallF(ctx, side, zc + (side === "left" ? -dz : dz), 0, yc), rr = k === 1 ? r * 1.15 : r * .9;
      if (claim(ctx, wbox(F, -rr - .02, rr + .02, -rr - .02, rr + .02, 0, .06), false, .02)) { B.F = F; badge(B, rr, PR.badge(ids[k])); } });
    for (const s of [-1, 1]) { const F = wallF(ctx, side, zc + s * 1.25, 0, yc); if (claim(ctx, wbox(F, -.42, .42, -.02, .02, 0, .03), false, .02)) { B.F = F; B.box(env.acc, .84, .02, .02, 0, 0, .012); } }
  }
}
function doorPlants(ctx, B, R){
  for (const side of ["front", "back"]) for (const [s, e] of runs(ctx, side, ctx.bounds.x0, ctx.bounds.x1, 0, 1.05, .52)) { if (e - s < .44) continue;
    const F = wallF(ctx, side, (s + e) / 2); if (claim(ctx, wbox(F, -.22, .22, 0, 1.05, .04, .5), true)) { B.F = F; potPlant(B, R, .95); } }
}
K.decor = (ctx, {hall}) => {
  const S = ctx.decorShell; if (!S) return;
  ctx.frei({x0: 0, x1: .01, y0: -2, y1: -1.99, z0: 0, z1: .01});   // Belegung jetzt erfassen, bevor eigene Teile in den Raum kommen
  ctx._decorStart = ctx.group.children.length;
  const B = Mb(), R = U.seeded(hashS(ctx.key) + 4242), I = {crates: [], crystals: []}, idx = hall ? 0 : Math.max(0, ctx.index) % 8;
  // Raumthema (17_raum_sterne.js): RD = K.raum[key].dekor – eigenes Themenstück, Möbellisten, Bilder, Abzeichen, Pflanzen, Globus, Drohnen
  const RD = (!hall && K.raum && K.raum[ctx.key] && K.raum[ctx.key].dekor) || null;
  const env = {S, hall, idx, acc: "acc:" + (hall ? "#EEF6FF" : SECTOR[idx]), RD};
  windows(ctx, B, R, env);
  reserveShell(ctx, S);
  if (hall) hallDecor(ctx, B, R, I, env);
  else if (RD && RD.thema) { try { RD.thema(ctx, B, R, I, env, K.dlib); } catch (e) { console.error("R3D Raumthema (Ausstattung)", ctx.key, e); } }
  else if (THEME[ctx.key]) THEME[ctx.key](ctx, B, R, I, env);
  furnish(ctx, B, R, I, env, ["left", "right"]);
  if (!hall) { if (!RD || RD.abzeichen !== false) boardBadges(ctx, B, env); if (!RD || RD.pflanzen !== false) doorPlants(ctx, B, R); }
  wallArt(ctx, B, R, env);
  // Luftraum: Holo-Globus und Wartungsdrohnen
  if (!hall && (!RD || RD.globus !== false)) { const p = airSpot(ctx, rot(AIR, idx + 6), 1.0, 4.35, 6.3, 1.0); if (p) holoGlobe(ctx, p[0], 5.45, p[1], env); }
  const dl = [], dc = hall ? [[-4.6, -12], [4.6, 1.5], [-4.6, 1.5], [4.6, -12], [0, -12.5]] : rot(AIR, idx * 5 + 2);
  for (const [x, z] of dc) { if (dl.length >= (hall ? 3 : RD && RD.drohnen != null ? RD.drohnen : 2)) break; const rx = hall ? 1.2 : .9, rz = hall ? 2.2 : 1.5, y = hall ? 5.6 : 5.0;
    if (claim(ctx, {x0: x - rx - .35, x1: x + rx + .35, y0: y - .35, y1: y + .3, z0: z - rz - .35, z1: z + rz + .35})) dl.push({x, z, y, rx, rz, sp: .22 + .05 * dl.length, ph: dl.length * 2.1 + idx, dir: dl.length % 2 ? -1 : 1}); }
  drones(ctx, dl); LOG(ctx, "drohnen", dl.map(d => d.x + "/" + d.z).join(","));
  B.build(ctx.group); buildCrates(ctx, I.crates); buildCrystals(ctx, I.crystals, R);
};
// Bauhilfen für die Raumthemen (17_raum_sterne*.js): Möbel-Register ITEMS (neue Teile dort eintragen), Plätze, Bündeln, vorhandene Themenstücke
K.dlib = {Mb, MAT, ADDM, uvR, PR, ART, wallF, atF, wbox, claim, runs, wallSpot, wallPiece, airSpot, AIR, rot, LOG, ITEMS, THEME, crate, CRATE_COLS, springGeo, rockGeo,
  shelf, lockers, archive, workshop, hydro, notfall, picture, banner, badge, poster, cellRack, plasmaCore, breakerCab, cableBundle, lensGeo, lensCase, mirrorSail, telescope, lensStack,
  shipShelf, flyingFighters, ionEngine, thrustStand, weightRack, springWall, crane, springPallet, holoGlobe, drones};
})();
