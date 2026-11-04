/* ---------- 11_sterne.js ---------- */
/* =====================================================================
   3D-Weltstil „Weltraum-Saga“: Innenraum eines großen Raumschiffs
   Metallplatten mit Führungsstreifen, Wandpaneele mit Rippen und Lichtleisten, Rohre, Lichtdecke,
   Panoramafenster ins All (Sternenfeld, Nebel, Ringplanet, Mond), Statuskonsolen, Schiebetüren mit Leuchtgang,
   Holo-Konsolen mit drehenden Hologrammen, Holo-Schirme als Tafeln, schwebende Holo-Partikel, vorbeigleitende Lichtscheine.
   Schnittstelle wie 10_zauber.js (siehe RAUM-API.md):
   pal, font, fontBody, mat(kind, o), env(ctx, scene), shell(ctx, {hall}) → Höhe, door(ctx, {label, sub}) → {group, open, update},
   station(ctx, j, name) → Group (Vorderseite +z), board(ctx, title, lines, o) → Mesh, ambient(ctx, scene), placeholder(ctx)
   Draw-Calls werden gespart, indem gleichartige Bauteile je Material zu einer Geometrie zusammengefasst werden (Bld/merge).
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.util) return;
const U = R3D.util;
const FONT = "Futura, 'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif", BODY = "'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const pal = {accent: "#FFE81F", accent2: "#4FC3F7", glow: "#9BE7FF", ink: "#0E1726", light: "#E8F6FF", cool: "#4FC3F7", danger: "#FF5C5C", ok: "#3DDC97"};
const CYAN = "#4FC3F7", YEL = "#FFE81F";
const PANEL_H = 5.8;
const SECTOR = ["#4FC3F7", "#FF8A3D", "#3DDC97", "#B794F6", "#FF6B6B", "#2DD4BF", "#FACC15", "#818CF8"];   // Sektorfarbe je Raum (Leuchtband)                     // Höhe der Wandpaneele (Räume: senkrechte Wand, darüber Schräge zur Decke)

/* ---------- Zeichenhilfen für Texturen ---------- */
const rnd = U.seeded(5150);
function noise(g, w, h, n, a, colors, smax = 3){ for (let i = 0; i < n; i++) { g.fillStyle = colors[(rnd() * colors.length) | 0]; g.globalAlpha = a * rnd(); const s = 1 + rnd() * smax; g.fillRect(rnd() * w, rnd() * h, s, s); } g.globalAlpha = 1; }
function chamf(g, x, y, w, h, c){ g.beginPath(); g.moveTo(x + c, y); g.lineTo(x + w - c, y); g.lineTo(x + w, y + c); g.lineTo(x + w, y + h - c); g.lineTo(x + w - c, y + h); g.lineTo(x + c, y + h); g.lineTo(x, y + h - c); g.lineTo(x, y + c); g.closePath(); }
function plate(g, x, y, w, h, fill, o = {}){                // Paneel mit Lichtkante oben links und Schatten unten rechts
  const r = o.r ?? 5; g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, `rgba(255,255,255,${o.sheen ?? .07})`); gr.addColorStop(1, `rgba(0,0,0,${o.shade ?? .1})`); g.fillStyle = gr; g.fill();
  g.lineWidth = 2; g.strokeStyle = `rgba(255,255,255,${o.hi ?? .28})`; g.beginPath(); g.moveTo(x + r, y + 1.5); g.lineTo(x + w - r, y + 1.5); g.moveTo(x + 1.5, y + r); g.lineTo(x + 1.5, y + h - r); g.stroke();
  g.strokeStyle = `rgba(0,0,0,${o.lo ?? .38})`; g.beginPath(); g.moveTo(x + r, y + h - 1.5); g.lineTo(x + w - r, y + h - 1.5); g.moveTo(x + w - 1.5, y + r); g.lineTo(x + w - 1.5, y + h - r); g.stroke();
}
function bolts(g, x, y, w, h, i, col = "rgba(35,42,52,.6)"){
  for (const [a, b] of [[x + i, y + i], [x + w - i, y + i], [x + i, y + h - i], [x + w - i, y + h - i]]) {
    g.fillStyle = col; g.beginPath(); g.arc(a, b, 3.4, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(a - .9, b - .9, 1.3, 0, 7); g.fill(); } }
function slots(g, x, y, w, h, n, col = "#181d24"){ const sh = h / (n * 2 - 1);
  for (let i = 0; i < n; i++) { g.fillStyle = col; g.beginPath(); g.roundRect(x, y + i * sh * 2, w, sh, sh / 2); g.fill(); g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(x + 3, y + i * sh * 2 + sh, w - 6, 1.5); } }
function tread(g, x, y, w, h){ g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.lineCap = "round"; g.lineWidth = 5;
  for (let yy = y, r = 0; yy < y + h + 20; yy += 26, r++) for (let xx = x + (r % 2) * 13, c = 0; xx < x + w + 20; xx += 26, c++) {
    const d = (r + c) % 2 ? 1 : -1; g.strokeStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.moveTo(xx - 6, yy - 6 * d + 1.5); g.lineTo(xx + 6, yy + 6 * d + 1.5); g.stroke();
    g.strokeStyle = "rgba(190,205,220,.22)"; g.beginPath(); g.moveTo(xx - 6, yy - 6 * d); g.lineTo(xx + 6, yy + 6 * d); g.stroke(); }
  g.restore(); }
function hud(g, x, y, w, h, title){                         // Rahmen eines Bildschirmfelds
  g.save(); g.translate(x, y); g.fillStyle = "#04182a"; g.fillRect(4, 4, w - 8, h - 8);
  g.strokeStyle = "rgba(79,195,247,.10)"; g.lineWidth = 1; for (let xx = 24; xx < w; xx += 24) { g.beginPath(); g.moveTo(xx, 8); g.lineTo(xx, h - 8); g.stroke(); }
  for (let yy = 24; yy < h; yy += 24) { g.beginPath(); g.moveTo(8, yy); g.lineTo(w - 8, yy); g.stroke(); }
  g.strokeStyle = CYAN; g.lineWidth = 3; chamf(g, 8, 8, w - 16, h - 16, 16); g.stroke();
  g.fillStyle = CYAN; g.font = `600 26px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(title, 28, 36);
  g.fillStyle = YEL; g.fillRect(w - 60, 30, 34, 10); g.restore(); }

/* ---------- Prozedurale Texturen (gecacht im Kern) ---------- */
const tex = {
  floor: () => U.canvasTex(1024, 1024, (g, w, h) => {                       // 4 × 4 m dunkle Metallplatten
    g.fillStyle = "#14181e"; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 4; c++) for (let k = 0; k < 2; k++) {
      const l = 27 + rnd() * 7, tr = (c + k * 3) % 3 === 0, x = c * 256;
      for (const dy of [0, -1024]) { const y = k * 512 + (c % 2) * 256 + dy;
        plate(g, x + 3, y + 3, 250, 506, `hsl(213,10%,${l}%)`, {r: 6, hi: .2, lo: .55, sheen: .05, shade: .12});
        if (tr) tread(g, x + 22, y + 26, 212, 458); else { g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 3; g.strokeRect(x + 30, y + 34, 196, 442); g.strokeStyle = "rgba(255,255,255,.07)"; g.strokeRect(x + 33, y + 37, 196, 442); }
        bolts(g, x + 3, y + 3, 250, 506, 15); } }
    for (let i = 0; i < 320; i++) { g.strokeStyle = `rgba(${rnd() < .5 ? "255,255,255" : "0,0,0"},${.03 + rnd() * .05})`; g.lineWidth = 1 + rnd() * 2;
      const x = rnd() * w, y = rnd() * h, a = rnd() * 6.3, L = 10 + rnd() * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    noise(g, w, h, 9000, .16, ["#000", "#8a96a3", "#2b3139"]);
  }, "s-floor", [1, 1]),
  walk: () => U.canvasTex(512, 512, (g, w, h) => {                           // 2,6 × 2,6 m Laufsteg mit Noppen und Leitpfeil
    g.fillStyle = "#171b21"; g.fillRect(0, 0, w, h);
    for (const [x, y] of [[0, 0], [256, 0], [0, 256], [256, 256]]) {
      plate(g, x + 3, y + 3, 250, 250, "#5b6672", {hi: .3, lo: .55});
      for (let yy = y + 20, r = 0; yy < y + 244; yy += 15, r++) for (let xx = x + 20 + (r % 2) * 7.5; xx < x + 244; xx += 15) {
        g.fillStyle = "rgba(15,18,24,.5)"; g.beginPath(); g.arc(xx + .8, yy + .8, 3.2, 0, 7); g.fill(); g.fillStyle = "rgba(220,230,240,.22)"; g.beginPath(); g.arc(xx - .5, yy - .5, 2.4, 0, 7); g.fill(); }
      bolts(g, x + 3, y + 3, 250, 250, 12); }
    g.strokeStyle = "rgba(255,232,31,.55)"; g.lineWidth = 10; g.lineJoin = "round";
    for (const y of [150, 406]) { g.beginPath(); g.moveTo(w / 2 - 46, y + 30); g.lineTo(w / 2, y - 12); g.lineTo(w / 2 + 46, y + 30); g.stroke(); }
    noise(g, w, h, 4000, .14, ["#000", "#9aa6b3"]);
  }, "s-walk", [1, 1]),
  wall: () => U.canvasTex(512, 1024, (g, w, h) => {                          // 2,25 × 5,8 m Wandpaneel (unten Sockel mit Lüftung, oben Band)
    const Y = m => (PANEL_H - m) / PANEL_H * h;
    g.fillStyle = "#2a3139"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#262c33"; g.fillRect(0, Y(.14), w, h - Y(.14));
    plate(g, 5, Y(1.02), w - 10, Y(.18) - Y(1.02), "#5d6773", {hi: .22});
    g.fillStyle = "#363e48"; g.beginPath(); g.roundRect(140, Y(.86), 232, Y(.32) - Y(.86), 10); g.fill(); slots(g, 154, Y(.8), 204, Y(.38) - Y(.8), 7);
    bolts(g, 5, Y(1.02), w - 10, Y(.18) - Y(1.02), 14);
    g.fillStyle = "#161a20"; g.fillRect(0, Y(1.17), w, Y(1.03) - Y(1.17));
    plate(g, 5, Y(3.0), w - 10, Y(1.2) - Y(3.0), "#cdd4dc", {hi: .5, lo: .3, sheen: .1});
    plate(g, 5, Y(4.96), w - 10, Y(3.06) - Y(4.96), "#d4dae1", {hi: .5, lo: .3, sheen: .12});
    g.strokeStyle = "rgba(60,70,82,.28)"; g.lineWidth = 3; g.beginPath(); g.roundRect(34, Y(2.82), w - 68, Y(1.38) - Y(2.82), 12); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.5; g.beginPath(); g.roundRect(36, Y(2.80), w - 68, Y(1.38) - Y(2.82), 12); g.stroke();
    g.fillStyle = "#9aa5b1"; g.fillRect(34, Y(2.98), 96, 16); g.fillStyle = YEL; g.fillRect(34, Y(2.98), 22, 16);
    for (let i = 0; i < 3; i++) { g.fillStyle = ["rgba(40,48,58,.45)", "rgba(79,195,247,.7)", "rgba(40,48,58,.45)"][i]; g.fillRect(w - 110 + i * 26, Y(2.93), 18, 8); }
    bolts(g, 5, Y(3.0), w - 10, Y(1.2) - Y(3.0), 16, "rgba(70,80,92,.55)"); bolts(g, 5, Y(4.96), w - 10, Y(3.06) - Y(4.96), 16, "rgba(70,80,92,.55)");
    plate(g, 5, Y(5.76), w - 10, Y(5.02) - Y(5.76), "#7d8794", {hi: .35});
    for (let i = 0; i < 5; i++) { g.fillStyle = "#1e242c"; g.fillRect(60 + i * 84, Y(5.5), 52, 14); g.fillStyle = i === 2 ? "rgba(255,232,31,.8)" : "rgba(79,195,247,.55)"; g.fillRect(64 + i * 84, Y(5.5) + 4, 18, 6); }
    noise(g, w, h, 5000, .08, ["#000", "#fff"]);
  }, "s-wall", [1, 1]),
  bulk: () => U.canvasTex(1024, 1024, (g, w, h) => {                         // 4 × 4 m Schottwand (Vorder-/Rückwand, Schrägen)
    g.fillStyle = "#30373f"; g.fillRect(0, 0, w, h);
    const rows = [[256, 512, 256], [512, 512], [256, 256, 512], [512, 256, 256]];
    rows.forEach((row, r) => { let x = 0; row.forEach((pw, i) => { const y = r * 256, l = 60 + rnd() * 8, kind = (r * 2 + i) % 4;
      plate(g, x + 3, y + 3, pw - 6, 250, `hsl(212,9%,${l}%)`, {hi: .4, lo: .45, sheen: .1});
      if (kind === 0) { for (let k = 0; k < 5; k++) { g.fillStyle = "rgba(30,36,44,.35)"; g.fillRect(x + 26, y + 60 + k * 30, pw - 52, 8); g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(x + 26, y + 68 + k * 30, pw - 52, 2); } }
      else if (kind === 1) { g.fillStyle = "#3b434d"; g.beginPath(); g.roundRect(x + pw / 2 - 70, y + 70, 140, 110, 10); g.fill(); slots(g, x + pw / 2 - 58, y + 82, 116, 86, 5); }
      else if (kind === 2) { g.strokeStyle = "rgba(40,48,58,.3)"; g.lineWidth = 3; g.strokeRect(x + 30, y + 30, pw - 60, 190); g.fillStyle = "rgba(255,232,31,.75)"; g.fillRect(x + 30, y + 30, 40, 10); }
      bolts(g, x + 3, y + 3, pw - 6, 250, 14, "rgba(60,70,82,.6)"); x += pw; }); });
    noise(g, w, h, 8000, .08, ["#000", "#fff"]);
  }, "s-bulk", [1, 1]),
  ceil: () => U.canvasTex(1024, 1024, (g, w, h) => {                         // 4 × 4 m Deckenpaneele
    g.fillStyle = "#22282f"; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const x = c * 512, y = r * 256;
      plate(g, x + 4, y + 4, 504, 248, `hsl(213,9%,${38 + rnd() * 6}%)`, {hi: .3, lo: .5});
      if ((r + c) % 2) { g.fillStyle = "#2b3139"; g.beginPath(); g.arc(x + 256, y + 128, 62, 0, 7); g.fill(); g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 3;
        for (let k = 1; k < 5; k++) { g.beginPath(); g.arc(x + 256, y + 128, k * 12, 0, 7); g.stroke(); } }
      else { g.fillStyle = "rgba(20,24,30,.5)"; g.fillRect(x + 60, y + 110, 392, 36); g.fillStyle = "rgba(79,195,247,.35)"; g.fillRect(x + 66, y + 124, 380, 8); }
      bolts(g, x + 4, y + 4, 504, 248, 14); }
    noise(g, w, h, 6000, .1, ["#000", "#fff"]);
  }, "s-ceil", [1, 1]),
  hazard: () => U.canvasTex(256, 64, (g, w, h) => { g.fillStyle = "#1b1e23"; g.fillRect(0, 0, w, h); g.fillStyle = "#F2C81B";
    for (let x = -64; x < w + 64; x += 64) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 32, h); g.lineTo(x + 32 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); }
    noise(g, w, h, 900, .25, ["#000", "#fff"]); }, "s-haz", [1, 1]),
  leaf: () => U.canvasTex(512, 1024, (g, w, h) => {                          // Türhälfte 1,27 × 3,4 m, Innenkante rechts
    const Y = m => (3.4 - m) / 3.4 * h;
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#6f7a87"); gr.addColorStop(1, "#5c6672"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    chamf(g, 36, Y(3.2), w - 96, Y(.62) - Y(3.2), 44); g.fillStyle = "#525b67"; g.fill(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 3; g.stroke();
    for (const m of [1.25, 2.05, 2.85]) { g.fillStyle = "rgba(25,30,38,.55)"; g.fillRect(56, Y(m), w - 136, 10); g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(56, Y(m) + 10, w - 136, 2); }
    g.save(); g.beginPath(); g.rect(0, Y(.5), w, Y(.06) - Y(.5)); g.clip(); g.fillStyle = "#1b1e23"; g.fillRect(0, Y(.5), w, Y(.06) - Y(.5)); g.fillStyle = "#F2C81B";
    for (let x = -120; x < w + 60; x += 60) { g.beginPath(); g.moveTo(x, Y(.06)); g.lineTo(x + 30, Y(.06)); g.lineTo(x + 30 + 130, Y(.5)); g.lineTo(x + 130, Y(.5)); g.closePath(); g.fill(); } g.restore();
    g.strokeStyle = YEL; g.lineWidth = 9; g.lineJoin = "miter"; g.beginPath(); g.moveTo(w - 26, Y(2.35)); g.lineTo(w - 170, Y(1.85)); g.lineTo(w - 26, Y(1.35)); g.stroke();
    g.fillStyle = "#20262e"; g.fillRect(w - 26, 0, 26, h); g.fillStyle = "#9BE7FF"; g.fillRect(w - 18, 0, 6, h);
    g.fillStyle = "#2a3038"; g.fillRect(0, 0, 10, h);
    bolts(g, 20, 20, w - 60, h - 40, 8, "rgba(30,36,44,.7)");
    noise(g, w, h, 5000, .1, ["#000", "#fff"]);
  }, "s-leaf"),
  corridor: () => U.canvasTex(256, 256, (g, w, h) => {                       // Innenwand des Leuchtgangs
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#d8f4ff"); gr.addColorStop(.5, "#9edcf5"); gr.addColorStop(1, "#cfefff"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(40,110,150,.45)"; g.lineWidth = 3; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = "#ffffff"; for (let x = 16; x < w; x += 64) g.fillRect(x, h * .45, 32, h * .1);
  }, "s-corr"),
  endglow: () => U.canvasTex(256, 384, (g, w, h) => { const r = g.createRadialGradient(w / 2, h * .5, 6, w / 2, h * .5, h * .55);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.35, "rgba(170,235,255,.85)"); r.addColorStop(1, "rgba(40,140,220,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); }, "s-endglow"),
  spill: () => U.canvasTex(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(160,230,255,.9)"); gr.addColorStop(1, "rgba(160,230,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "destination-in"; const s = g.createLinearGradient(0, 0, w, 0);
    s.addColorStop(0, "rgba(0,0,0,0)"); s.addColorStop(.2, "rgba(0,0,0,1)"); s.addColorStop(.8, "rgba(0,0,0,1)"); s.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = s; g.fillRect(0, 0, w, h); }, "s-spill"),
  guide: () => U.canvasTex(32, 256, (g, w, h) => { g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(6, 0, w - 12, h);
    const gr = g.createLinearGradient(0, 70, 0, 186); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(.5, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 70, w, 116); }, "s-guide", [1, 1]),
  streak: () => U.canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    for (const [x, ww, a] of [[40, 34, .10], [96, 10, .07], [170, 46, .06]]) { g.save(); g.translate(x, 0); g.transform(1, 0, -.6, 1, 0, 0); const gr = g.createLinearGradient(0, 0, ww, 0);
      gr.addColorStop(0, "rgba(180,225,255,0)"); gr.addColorStop(.5, `rgba(180,225,255,${a})`); gr.addColorStop(1, "rgba(180,225,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, ww, h); g.restore(); }
    const e = g.createLinearGradient(0, 0, 0, h); e.addColorStop(0, "rgba(79,195,247,.08)"); e.addColorStop(.12, "rgba(0,0,0,0)"); e.addColorStop(.88, "rgba(0,0,0,0)"); e.addColorStop(1, "rgba(79,195,247,.1)");
    g.globalCompositeOperation = "lighter"; g.fillStyle = e; g.fillRect(0, 0, w, h); }, "s-streak"),
  halo: () => U.canvasTex(256, 256, (g, w, h) => { g.shadowColor = "rgba(255,255,255,1)"; g.shadowBlur = 26; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 6;
    g.strokeRect(30, 30, w - 60, h - 60); g.shadowBlur = 0; g.clearRect(36, 36, w - 72, h - 72); }, "s-halo"),
  cone: () => U.canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,.75)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "destination-out"; for (let x = 0; x < w; x += 8) { g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(x, 0, 3, h); } }, "s-cone"),
  radar: () => { const t = U.canvasTex(256, 256, (g, w) => { const c = w / 2;
      g.fillStyle = "#03141f"; g.beginPath(); g.arc(c, c, c - 2, 0, 7); g.fill();
      for (let i = 0; i < 48; i++) { const a = -i * .022; g.fillStyle = `rgba(79,195,247,${.55 * (1 - i / 48)})`; g.beginPath(); g.moveTo(c, c); g.arc(c, c, c - 8, a - .024, a); g.closePath(); g.fill(); }
      g.strokeStyle = "rgba(79,195,247,.55)"; g.lineWidth = 2; for (const r of [30, 62, 94, 120]) { g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(c, 8); g.lineTo(c, w - 8); g.moveTo(8, c); g.lineTo(w - 8, c); g.stroke();
      g.fillStyle = YEL; for (const [x, y] of [[170, 80], [70, 150], [150, 190]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
      g.strokeStyle = CYAN; g.lineWidth = 5; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.stroke(); }, "s-radar"); t.center.set(.5, .5); return t; },
  atlas: () => U.canvasTex(1024, 1024, (g, w, h) => {                        // Statusschirme (4 quer, 2 quadratisch)
    g.fillStyle = "#020a12"; g.fillRect(0, 0, w, h); g.textBaseline = "middle";
    hud(g, 0, 0, 512, 256, "SCHILDE"); g.fillStyle = YEL; g.font = `700 76px ${FONT}`; g.textAlign = "right"; g.fillText("98 %", 484, 116);
    for (let i = 0; i < 20; i++) { g.fillStyle = i < 19 ? CYAN : "rgba(79,195,247,.25)"; g.fillRect(30 + i * 23, 176, 17, 46); }
    hud(g, 512, 0, 512, 256, "NAVIGATION"); g.strokeStyle = "rgba(79,195,247,.7)"; g.lineWidth = 2;
    for (const [rx, ry] of [[70, 40], [130, 70], [190, 96]]) { g.beginPath(); g.ellipse(512 + 170, 140, rx, ry, -.2, 0, 7); g.stroke(); }
    g.fillStyle = "#ffcf7a"; g.beginPath(); g.arc(512 + 170, 140, 16, 0, 7); g.fill(); g.fillStyle = YEL; g.beginPath(); g.arc(512 + 290, 106, 7, 0, 7); g.fill();
    g.fillStyle = "#EAF6FF"; g.font = `600 30px ${FONT}`; g.textAlign = "right"; g.fillText("KURS 214,7°", 512 + 486, 176); g.fillStyle = CYAN; g.font = `500 24px ${FONT}`; g.fillText("ZIEL 3,2 AE", 512 + 486, 212);
    hud(g, 0, 256, 512, 256, "ENERGIE"); for (let i = 0; i < 12; i++) { const v = .35 + .6 * Math.abs(Math.sin(i * 1.7 + .4)); g.fillStyle = i % 4 === 3 ? YEL : CYAN; g.fillRect(34 + i * 26, 256 + 222 - v * 120, 16, v * 120); }
    g.fillStyle = "#EAF6FF"; g.font = `700 40px ${FONT}`; g.textAlign = "right"; g.fillText("76 %", 484, 256 + 120); g.fillStyle = CYAN; g.font = `500 24px ${FONT}`; g.fillText("REAKTOR", 484, 256 + 170);
    hud(g, 512, 256, 512, 256, "SYSTEMSTATUS"); g.font = `500 25px ${BODY}`;
    [["LEBENSERHALTUNG", "OK"], ["SAUERSTOFF", "21,0 %"], ["DRUCK", "101,3 kPa"], ["TEMPERATUR", "21,5 °C"]].forEach(([a, b], i) => { const y = 256 + 82 + i * 38;
      g.textAlign = "left"; g.fillStyle = "#BFE6F7"; g.fillText(a, 512 + 30, y); g.textAlign = "right"; g.fillStyle = i ? "#EAF6FF" : "#3DDC97"; g.fillText(b, 512 + 484, y); });
    hud(g, 0, 512, 512, 512, "DECKPLAN"); g.strokeStyle = "rgba(79,195,247,.85)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(256, 590); g.lineTo(380, 700); g.lineTo(400, 930); g.lineTo(112, 930); g.lineTo(132, 700); g.closePath(); g.stroke();
    for (let i = 0; i < 4; i++) { g.strokeRect(150 + (i % 2) * 112, 720 + (i >> 1) * 96, 96, 80); } g.fillStyle = YEL; g.beginPath(); g.arc(306, 760, 10, 0, 7); g.fill();
    g.fillStyle = "#EAF6FF"; g.font = `600 26px ${FONT}`; g.textAlign = "center"; g.fillText("SIE SIND HIER", 256, 980);
    hud(g, 512, 512, 512, 512, "SCHWERKRAFT"); g.strokeStyle = "rgba(79,195,247,.35)"; g.lineWidth = 18; g.beginPath(); g.arc(768, 790, 150, Math.PI * .8, Math.PI * 2.2); g.stroke();
    g.strokeStyle = CYAN; g.beginPath(); g.arc(768, 790, 150, Math.PI * .8, Math.PI * 1.75); g.stroke();
    g.fillStyle = YEL; g.font = `700 64px ${FONT}`; g.textAlign = "center"; g.fillText("1,00 g", 768, 790); g.fillStyle = "#BFE6F7"; g.font = `500 26px ${FONT}`; g.fillText("künstlich · stabil", 768, 850);
  }, "s-atlas"),
  stone: () => U.canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#8e97a1"; g.fillRect(0, 0, w, h); noise(g, w, h, 16000, .35, ["#5d6670", "#b4bcc5", "#737c86"], 2);
    g.strokeStyle = "rgba(40,46,54,.45)"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, "s-stone", [1, 1]),
  wood: () => U.canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#4a3d33"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${rnd() < .5 ? "255,240,220" : "0,0,0"},${rnd() * .07})`; g.fillRect(0, y, w, 1 + rnd() * 2); }
    for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(20,14,10,${.1 + rnd() * .15})`; g.lineWidth = 1 + rnd() * 2; const y = rnd() * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (rnd() - .5) * 6); g.stroke(); }
    g.fillStyle = "rgba(20,24,30,.6)"; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); }, "s-wood", [1, 1]),
  dwood: () => U.canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#262b33"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${rnd() < .5 ? "190,205,225" : "0,0,0"},${rnd() * .06})`; g.fillRect(0, y, w, 1 + rnd() * 2); }
    g.fillStyle = "rgba(79,195,247,.25)"; g.fillRect(0, h / 2 - 1, w, 2); }, "s-dwood", [1, 1]),
  paper: () => U.canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#eef2f5"); gr.addColorStop(1, "#d9dfe5"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(0,0,0,.035)"; for (let i = 0; i < w; i += 4) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } }, "s-epaper", [1, 1]),
  cloth: () => U.canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#d9dfe5"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 8) { g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(i, 0, 3, h); g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, i + 4, w, 3); }
    g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 2; for (let i = 0; i < w; i += 64) { g.strokeRect(i + 1, i % 128 ? 1 : 33, 62, 62); } }, "s-cloth", [1, 1]),
  planet: () => U.canvasTex(1024, 512, (g, w, h) => {                        // Gasriese mit Bändern und Sturm
    const cols = [[236, 212, 168], [204, 152, 98], [244, 228, 196], [170, 112, 66], [222, 182, 128], [146, 92, 54], [240, 218, 176], [188, 132, 84]];
    for (let y = 0; y < h; y++) { const lat = y / h, t = lat * 11 + Math.sin(lat * 29) * .45 + Math.sin(lat * 67) * .18, i = Math.floor(t), f = t - i, s = f * f * (3 - 2 * f), a = cols[i % 8], b = cols[(i + 1) % 8];
      g.fillStyle = `rgb(${a[0] + (b[0] - a[0]) * s | 0},${a[1] + (b[1] - a[1]) * s | 0},${a[2] + (b[2] - a[2]) * s | 0})`; g.fillRect(0, y, w, 1); }
    for (let i = 0; i < 2200; i++) { const y = rnd() * h, x = rnd() * w, L = 20 + rnd() * 140, c = cols[(rnd() * 8) | 0], al = .06 + rnd() * .12, lw = 1 + rnd() * 3, d1 = (rnd() - .5) * 6, d2 = (rnd() - .5) * 6;
      for (const ox of [0, -w]) { g.strokeStyle = `rgba(${c},${al})`; g.lineWidth = lw; g.beginPath(); g.moveTo(x + ox, y); g.bezierCurveTo(x + ox + L * .3, y + d1, x + ox + L * .6, y + d2, x + ox + L, y + d1 * .5); g.stroke(); } }
    const sx = w * .62, sy = h * .62, sr = g.createRadialGradient(sx, sy, 2, sx, sy, 50); sr.addColorStop(0, "rgba(255,240,215,.95)"); sr.addColorStop(.5, "rgba(200,110,70,.8)"); sr.addColorStop(1, "rgba(200,110,70,0)");
    g.save(); g.translate(sx, sy); g.scale(1.9, .8); g.translate(-sx, -sy); g.fillStyle = sr; g.beginPath(); g.arc(sx, sy, 50, 0, 7); g.fill(); g.restore();
    const p = g.createLinearGradient(0, 0, 0, h); p.addColorStop(0, "rgba(60,40,25,.55)"); p.addColorStop(.16, "rgba(0,0,0,0)"); p.addColorStop(.84, "rgba(0,0,0,0)"); p.addColorStop(1, "rgba(60,40,25,.55)"); g.fillStyle = p; g.fillRect(0, 0, w, h);
  }, "s-planet"),
  moon: () => U.canvasTex(512, 256, (g, w, h) => { g.fillStyle = "#8d9096"; g.fillRect(0, 0, w, h); noise(g, w, h, 12000, .3, ["#6c6f75", "#a9adb3", "#5a5d63"], 3);
    for (let i = 0; i < 90; i++) { const x = rnd() * w, y = h * .1 + rnd() * h * .8, r = 2 + rnd() * rnd() * 22;
      g.fillStyle = "rgba(60,62,68,.45)"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = "rgba(210,212,218,.35)"; g.lineWidth = 1.5; g.beginPath(); g.arc(x - .6, y - .6, r, Math.PI * .9, Math.PI * 1.9); g.stroke(); } }, "s-moon"),
  ring: () => U.canvasTex(512, 4, (g, w, h) => { for (let x = 0; x < w; x++) { const t = x / w, a = (.25 + .5 * Math.abs(Math.sin(t * 31)) * Math.abs(Math.sin(t * 7.3 + 1))) * Math.min(1, t * 8) * Math.min(1, (1 - t) * 6) * (t > .58 && t < .63 ? .15 : 1);
    g.fillStyle = `rgba(${226 - t * 40 | 0},${204 - t * 50 | 0},${170 - t * 60 | 0},${a})`; g.fillRect(x, 0, 1, h); } }, "s-ring"),
  atmo: () => U.canvasTex(256, 256, (g, w) => { const c = w / 2, r = g.createRadialGradient(c, c, 0, c, c, c);
    r.addColorStop(0, "rgba(255,255,255,0)"); r.addColorStop(.74, "rgba(255,255,255,0)"); r.addColorStop(.79, "rgba(255,255,255,.85)"); r.addColorStop(.86, "rgba(255,255,255,.28)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, w, w); }, "s-atmo"),
  nebula: (hue) => U.canvasTex(512, 512, (g, w, h) => {                     // Nebel: klumpige Wolkenfäden, Staubbänder, helle Knoten
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "lighter";
    for (let f = 0; f < 7; f++) { let x = w * (.3 + rnd() * .4), y = h * (.3 + rnd() * .4), a = rnd() * 6.3;
      for (let i = 0; i < 26; i++) { a += (rnd() - .5) * 1.1; x += Math.cos(a) * 14; y += Math.sin(a) * 14; const r = 18 + rnd() * 70, hh = hue + (rnd() - .5) * 60;
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `hsla(${hh},82%,${50 + rnd() * 22}%,${.07 + rnd() * .1})`); gr.addColorStop(1, "hsla(0,0%,0%,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } }
    for (let i = 0; i < 9; i++) { const x = w * (.3 + rnd() * .4), y = h * (.3 + rnd() * .4), r = 6 + rnd() * 16, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(255,245,255,.5)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 14; i++) { const x = w * (.2 + rnd() * .6), y = h * (.25 + rnd() * .5), r = 12 + rnd() * 40, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.globalCompositeOperation = "destination-in"; const m = g.createRadialGradient(w / 2, h / 2, w * .1, w / 2, h / 2, w * .5); m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = m; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "source-over"; try { const c2 = document.createElement("canvas"); c2.width = w; c2.height = h; const g2 = c2.getContext("2d"); g2.filter = "blur(3px)"; g2.drawImage(g.canvas, 0, 0); g.clearRect(0, 0, w, h); g.drawImage(c2, 0, 0); } catch (e) {}
    g.globalCompositeOperation = "lighter"; for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${.25 + rnd() * .6})`; const s = rnd() < .9 ? 1.2 : 2.2; g.fillRect(w * .15 + rnd() * w * .7, h * .2 + rnd() * h * .6, s, s); }
  }, "s-neb-" + hue),
  envsrc: () => U.canvasTex(512, 256, (g, w, h) => {                          // Umgebung für Spiegelungen (equirektangular)
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#6a7684"); gr.addColorStop(.3, "#95a2b2"); gr.addColorStop(.47, "#b4bfcc"); gr.addColorStop(.53, "#3c444f"); gr.addColorStop(1, "#22272e");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#ffffff"; for (let i = 0; i < 8; i++) g.fillRect(i * 64 + 14, 10, 36, 30);
    g.fillStyle = "#8fe6ff"; g.fillRect(0, h * .2, w, 3); g.fillRect(0, h * .45, w, 3); g.fillStyle = "#0a1220"; for (const x of [30, 158, 286, 414]) g.fillRect(x, h * .25, 70, h * .17);
  }, "s-envsrc")
};

/* ---------- Materialien (gecacht, userData.keep) ---------- */
const mats = new Map();
function keep(m){ m.userData.keep = true; return m; }
function imat(key, make){ key = "_" + key; if (!mats.has(key)) mats.set(key, keep(make())); return mats.get(key); }
const basic = p => new T3.MeshBasicMaterial(Object.assign({toneMapped: false}, p));
const ADD = {blending: T3.AdditiveBlending, transparent: true, depthWrite: false};
function mat(kind, o = {}){
  const key = kind + "|" + JSON.stringify(o); if (mats.has(key)) return mats.get(key);
  const S = p => keep(new T3.MeshStandardMaterial(p));
  let m;
  switch (kind) {
    case "stone": m = S({map: tex.stone(), color: o.color || 0xffffff, roughness: .82, metalness: .05}); break;            // Beton/Verbundplatte
    case "floor": m = S({map: tex.floor(), roughness: .46, metalness: .55}); break;
    case "wood": m = S({map: tex.wood(), color: o.color || 0xffffff, roughness: .5, metalness: .15}); break;              // dunkle Verbundplatte
    case "darkwood": m = S({map: tex.dwood(), roughness: .45, metalness: .3}); break;
    case "metal": m = S({color: o.color || 0x6c7786, metalness: .82, roughness: .34}); break;
    case "brass": m = S({color: 0xc9a54a, metalness: 1, roughness: .28}); break;
    case "gold": m = S({color: 0xe3b43a, metalness: 1, roughness: .24}); break;
    case "copper": m = S({color: 0xc47a4f, metalness: 1, roughness: .3}); break;
    case "steel": m = S({color: 0xc6cfd9, metalness: .9, roughness: .22}); break;
    case "glass": m = S({color: o.color || 0xcfeeff, transparent: true, opacity: o.opacity ?? .26, roughness: .05, metalness: .1, depthWrite: false}); break;
    case "water": m = S({color: o.color || 0x2f8fd8, emissive: o.color || 0x2f8fd8, emissiveIntensity: .15, transparent: true, opacity: .62, roughness: .06, metalness: .1, depthWrite: false}); break;
    case "glow": m = S({color: o.color || pal.glow, emissive: o.color || pal.glow, emissiveIntensity: o.intensity ?? 2.2, roughness: .4}); break;
    case "crystal": m = S({color: o.color || 0x4fc3f7, emissive: o.color || 0x4fc3f7, emissiveIntensity: o.intensity ?? .7, transparent: true, opacity: .85, roughness: .1, metalness: .1}); break;
    case "paper": m = S({map: tex.paper(), roughness: .85}); break;                                                        // e-Paper
    case "cloth": m = S({map: tex.cloth(), color: o.color || "#2b4a6f", roughness: .95, side: T3.DoubleSide}); break;      // technisches Gewebe
    case "rubber": m = S({color: 0x1b1d21, roughness: .88}); break;
    case "plastic": m = S({color: o.color || 0xd5dbe2, roughness: .42, metalness: .02}); break;
    default: m = S({color: o.color || 0x888888, roughness: o.rough ?? .6, metalness: o.metal ?? 0});
  }
  mats.set(key, m); return m;
}
const M = {   // interne Weltmaterialien
  wall: () => imat("wall", () => new T3.MeshStandardMaterial({map: tex.wall(), roughness: .46, metalness: .18})),
  bulk: () => imat("bulk", () => new T3.MeshStandardMaterial({map: tex.bulk(), roughness: .44, metalness: .3})),
  ceil: () => imat("ceil", () => new T3.MeshStandardMaterial({map: tex.ceil(), roughness: .5, metalness: .35})),
  walk: () => imat("walk", () => new T3.MeshStandardMaterial({map: tex.walk(), roughness: .45, metalness: .5})),
  rib: () => imat("rib", () => new T3.MeshStandardMaterial({color: 0x8a95a3, roughness: .3, metalness: .75})),
  white: () => imat("white", () => new T3.MeshStandardMaterial({color: 0xe2e8ee, roughness: .32, metalness: .08})),
  trim: () => imat("trim", () => new T3.MeshStandardMaterial({color: 0x2c333d, roughness: .4, metalness: .6})),
  pipe: () => imat("pipe", () => new T3.MeshStandardMaterial({color: 0xaeb8c4, roughness: .24, metalness: .9})),
  haz: () => imat("haz", () => new T3.MeshStandardMaterial({map: tex.hazard(), roughness: .5, metalness: .2})),
  leaf: () => imat("leaf", () => new T3.MeshStandardMaterial({map: tex.leaf(), roughness: .36, metalness: .55})),
  lc: () => imat("lc", () => basic({color: 0x8fe6ff})),
  ly: () => imat("ly", () => basic({color: 0xffe81f})),
  lw: () => imat("lw", () => basic({color: 0xeef6ff})),
  glass: () => imat("glass", () => basic(Object.assign({map: tex.streak(), fog: false, side: T3.DoubleSide}, ADD))),
  scr: () => imat("scr", () => basic({map: tex.atlas()})),
  radar: () => imat("radar", () => basic({map: tex.radar(), transparent: true})),
  guide: () => imat("guide", () => basic(Object.assign({map: tex.guide(), color: 0x6fd6ff}, ADD))),
  shaft: () => imat("shaft", () => new T3.MeshStandardMaterial({color: 0x59636f, roughness: .4, metalness: .6, side: T3.BackSide})),
  corr: () => imat("corr", () => basic({map: tex.corridor(), side: T3.BackSide})),
  back: () => imat("back", () => basic({color: 0x0a2236, transparent: true, opacity: .62})),
  halo: () => imat("halo", () => basic(Object.assign({map: tex.halo(), color: 0x4fc3f7, opacity: .45, side: T3.DoubleSide}, ADD))),
  planet: () => imat("planet", () => bodyMat(tex.planet(), 0x8fd0ff, .9)),
  moon: () => imat("moon", () => bodyMat(tex.moon(), 0x9fb8d8, .35))
};
const matOf = k => (M[k] ? M[k]() : k.startsWith("acc:") ? imat(k, () => basic({color: k.slice(4)})) : mat(k));
function bodyMat(map, atm, atmK){   // Planet/Mond: Tag-Nacht-Grenze zur Sonne und leuchtender Atmosphärenrand
  return new T3.ShaderMaterial({uniforms: {map: {value: map}, sun: {value: new T3.Vector3(1, .3, .2).normalize()}, atm: {value: new T3.Color(atm)}, atmK: {value: atmK}},
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }",
    fragmentShader: "uniform sampler2D map; uniform vec3 sun; uniform vec3 atm; uniform float atmK; varying vec2 vUv; varying vec3 vN; varying vec3 vP;\n" +
      "void main(){ vec3 n = normalize(vN), v = normalize(cameraPosition - vP); float d = dot(n, sun), l = smoothstep(-.12, .45, d);\n" +
      " vec3 c = texture2D(map, vUv).rgb * (.035 + 1.25 * l); float f = pow(1.0 - max(dot(n, v), 0.0), 2.6); c += atm * f * atmK * (.18 + 1.3 * smoothstep(-.35, .5, d));\n" +
      " gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}", toneMapped: false});
}

/* ---------- Geometrie bündeln: gleiche Materialien → ein Mesh (spart Draw-Calls) ---------- */
const _m4 = new T3.Matrix4(), _q = new T3.Quaternion(), _e = new T3.Euler(), _v = new T3.Vector3(), _one = new T3.Vector3(1, 1, 1);
function merge(list){
  const ps = list.map(g => { if (!g.index) return g; const n = g.toNonIndexed(); g.dispose(); return n; });
  let n = 0; for (const p of ps) n += p.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const p of ps) { const c = p.attributes.position.count; pos.set(p.attributes.position.array, o * 3); if (p.attributes.normal) nor.set(p.attributes.normal.array, o * 3);
    if (p.attributes.uv) uv.set(p.attributes.uv.array, o * 2); o += c; p.dispose(); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(pos, 3)); g.setAttribute("normal", new T3.BufferAttribute(nor, 3)); g.setAttribute("uv", new T3.BufferAttribute(uv, 2));
  g.computeBoundingSphere(); g.computeBoundingBox(); return g;
}
function Bld(){
  const parts = new Map(), push = (k, g) => { if (!parts.has(k)) parts.set(k, []); parts.get(k).push(g); return g; };
  const api = {
    put(k, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0){ geo.applyMatrix4(_m4.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _one)); return push(k, geo); },
    putM(k, geo, m){ geo.applyMatrix4(m); return push(k, geo); },
    box(k, w, h, d, x, y, z, rx, ry, rz){ return api.put(k, new T3.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    build(group, cast = []){ const out = {}; for (const [k, list] of parts) { const m = new T3.Mesh(merge(list), matOf(k)); m.receiveShadow = !/^l[cwy]$|^acc|glass|guide/.test(k); m.castShadow = cast.includes(k); group.add(m); out[k] = m; } return out; }
  };
  return api;
}
const octPts = ({x0, x1, y0, y1, c}) => [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]];
function wallGeo(len, hgt, notches, holes, su, sv){   // Wandfläche (a entlang der Wand, y nach oben) mit Türaussparungen unten und Fensterlöchern
  const s = new T3.Shape(); s.moveTo(-len / 2, 0);
  for (const [a0, a1, top] of notches.slice().sort((p, q) => p[0] - q[0])) { s.lineTo(a0, 0); s.lineTo(a0, top); s.lineTo(a1, top); s.lineTo(a1, 0); }
  s.lineTo(len / 2, 0); s.lineTo(len / 2, hgt); s.lineTo(-len / 2, hgt); s.closePath();
  for (const h of holes) { const p = new T3.Path(); octPts(h).forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); s.holes.push(p); }
  return U.scaleUV(new T3.ShapeGeometry(s), su, sv);
}
function atlasUV(geo, i){ const uv = geo.attributes.uv, [u0, v0, du, dv] = i < 4 ? [(i % 2) * .5, .75 - (i >> 1) * .25, .5, .25] : [(i - 4) * .5, 0, .5, .5];
  for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * du, v0 + uv.getY(k) * dv); return geo; }
function cut([a, b], gaps){ let segs = [[a, b]]; for (const [g0, g1] of gaps) segs = segs.flatMap(([s0, s1]) => g1 <= s0 || g0 >= s1 ? [[s0, s1]] : [[s0, g0], [g1, s1]].filter(([p, q]) => q - p > .2)); return segs; }

/* ---------- Raumthemen: R3D.kits.sterne.raum[key] (Beschreibung in 17_raum_sterne.js) ----------
   Fehlt die Beschreibung (Halle, noch nicht umgebaute Räume), bauen env/shell/ambient/decor genau wie bisher. */
const RAUM = {};
const raumOf = ctx => (ctx.key !== "halle" && RAUM[ctx.key]) || null;

/* ---------- Umgebung: Licht, Spiegelungen, Weltall ---------- */
const _envs = new Map();   // Spiegelungsumgebung je Raumthema (Standard: "std")
function envMap(key, draw){
  key = key || "std"; if (_envs.has(key)) return _envs.get(key) || null; const r = R3D.renderer; if (!r || !T3.PMREMGenerator) return null;
  let res = false;
  try { const t = draw ? U.canvasTex(512, 256, draw, "s-env-" + key) : tex.envsrc(); t.mapping = T3.EquirectangularReflectionMapping; const pm = new T3.PMREMGenerator(r); res = pm.fromEquirectangular(t).texture; res.userData.keep = true; pm.dispose(); }
  catch (e) { res = false; }
  _envs.set(key, res); return res || null;
}
// Lichter je Raum gleich viele und gleich gebaut (geteilte Shader-Programme); ein Raumthema ändert nur Farben, Stärken, Lagen, Nebel und Hintergrund (R.licht)
function env(ctx, sc){
  const B = ctx.bounds, hall = ctx.key === "halle", H = hall ? 9.6 : 7.2, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, D = B.z0 - B.z1;
  const R = raumOf(ctx), Lc = (R && R.licht) || {}, nb = Lc.nebel || [0x0b1626, hall ? .009 : .011], hm = Lc.himmel || [0xe8f1ff, 0x3a4453, .85], am = Lc.umgebung || [0xd6eaff, .2], so = Lc.sonne || [0xf2f7ff, 1.35];
  sc.background = new T3.Color(Lc.bg ?? 0x02040a); sc.fog = new T3.FogExp2(nb[0], nb[1]);
  const e = R && R.umwelt ? envMap("r-" + ctx.key, R.umwelt) : envMap(); if (e) sc.environment = e;
  const hemi = new T3.HemisphereLight(hm[0], hm[1], hm[2]), amb = new T3.AmbientLight(am[0], am[1]); sc.add(hemi); sc.add(amb);
  const d = new T3.DirectionalLight(so[0], so[1]); d.position.set(...(so[2] || [5, 14, cz + 6])); d.target.position.set(0, 0, cz);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const s = d.shadow.camera, hw = Math.max(B.x1 - B.x0, D) / 2 + 2;
  s.left = -hw; s.right = hw; s.top = hw; s.bottom = -hw; s.near = 1; s.far = 40; d.shadow.bias = -0.0004; d.shadow.normalBias = .02; sc.add(d, d.target);
  const pl = [cz + D * .26, cz - D * .26].map((z, i) => { const q = (Lc.decke && Lc.decke[i]) || [];   // 2 Deckenlichter
    const l = new T3.PointLight(q[0] ?? 0xdcecff, q[1] ?? 26, 20, 2); l.position.set(q[2] ?? cx, q[3] ?? H - 1.1, q[4] ?? z); sc.add(l); return l; });
  ctx._licht = {hemi, amb, sonne: d, decke: pl};   // für Stimmungen der Raumthemen (Pulsieren, Farbwechsel)
  space(ctx, sc, R ? R.all : undefined);
}
function sprite(color, size, map){ const s = new T3.Sprite(new T3.SpriteMaterial({map: map || U.glowTex(), color, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, fog: false, toneMapped: false})); s.scale.set(size, size, 1); return s; }
// o (Raumthema, R.all): false = kein Weltall (Raum ohne Fenster), sonst {planet: [x, y, z], mond: [x, y, z], sonne: [x, y, z], nebel: [[farbton, breite, höhe, [x, y, z]], …]} in Weltkoordinaten
function space(ctx, sc, o){
  if (o === false) return; o = o || {};
  const B = ctx.bounds, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, sp = new T3.Group(), r = U.seeded(2024); sp.position.set(cx, 0, cz); sc.add(sp);
  const L = (x, y, z) => new T3.Vector3(x - cx, y, z - cz);   // Weltkoordinate → lokal im All-Gruppe
  // Sternenfeld (drei Größen)
  const layers = [];
  for (const [n, size, op, map] of [[2400, 1.7, .9, false], [700, 2.8, 1, true], [90, 5, 1, true]]) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, q = Math.sqrt(1 - u * u), R = 88, b = .55 + r() * .45, t = r();
      pos[i * 3] = Math.cos(a) * q * R; pos[i * 3 + 1] = u * R; pos[i * 3 + 2] = Math.sin(a) * q * R;
      const c = t < .7 ? [.88, .93, 1] : t < .88 ? [.62, .78, 1] : [1, .88, .68]; col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b; }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(pos, 3)); g.setAttribute("color", new T3.BufferAttribute(col, 3));
    const p = new T3.Points(g, new T3.PointsMaterial({size, sizeAttenuation: false, vertexColors: true, map: map ? U.glowTex() : null, transparent: true, opacity: op, depthWrite: false, fog: false, toneMapped: false}));
    sp.add(p); layers.push(p); }
  // Nebel
  const nebs = [[285, 90, 60, L(B.x1 + 34, 14, B.z1 - 72)], [190, 100, 66, L(B.x0 - 26, 8, B.z0 + 74)], [325, 76, 48, L(cx + 6, 31, B.z1 - 64)], [215, 80, 50, L(B.x0 - 30, 20, B.z1 - 74)]]
    .concat(ctx.key === "halle" ? [[255, 70, 70, L(cx + 4, 72, -3.5)]] : []).concat((o.nebel || []).map(([hue, w, h, q]) => [hue, w, h, L(...q)])).map(([hue, w, h, p]) => {
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), imat("neb" + hue, () => basic(Object.assign({map: tex.nebula(hue), fog: false, opacity: .95}, ADD))));
    m.position.copy(p); if (p.y > 60) m.rotation.x = Math.PI / 2; else m.rotation.y = Math.atan2(-p.x, -p.z); sp.add(m); return m; });
  // Sonne
  const sunP = o.sonne ? L(...o.sonne) : L(B.x1 + 16, 12, B.z1 - 64), sun = sprite(0xfff0d0, 18), core = sprite(0xffffff, 5); sun.position.copy(sunP); core.position.copy(sunP); sp.add(sun, core);
  // Ringplanet
  const plP = o.planet ? L(...o.planet) : L(B.x0 - 17, -13, B.z1 - 58), pl = new T3.Mesh(new T3.SphereGeometry(18, 64, 48), M.planet()); pl.position.copy(plP); pl.rotation.z = .3; sp.add(pl);
  M.planet().uniforms.sun.value.copy(sunP).sub(plP).normalize();
  const atm = sprite(0x8fd0ff, 47.5, tex.atmo()); atm.position.copy(plP); atm.material.opacity = .8; sp.add(atm);
  const rg = new T3.RingGeometry(23, 36, 160, 1), ruv = rg.attributes.uv, rp = rg.attributes.position;
  for (let i = 0; i < ruv.count; i++) ruv.setXY(i, (Math.hypot(rp.getX(i), rp.getY(i)) - 23) / 13, .5);
  const ring = new T3.Mesh(rg, imat("ring", () => basic({map: tex.ring(), transparent: true, side: T3.DoubleSide, depthWrite: false, fog: false, opacity: .9}))); ring.position.copy(plP); ring.rotation.set(-Math.PI / 2 + .62, 0, .42); sp.add(ring);
  // Mond hinter dem Heck
  const moP = o.mond ? L(...o.mond) : L(B.x1 + 12, 10, B.z0 + 48), moon = new T3.Mesh(new T3.SphereGeometry(3.6, 40, 30), M.moon()); moon.position.copy(moP); sp.add(moon);
  M.moon().uniforms.sun.value.copy(sunP).sub(moP).normalize();
  ctx.tick((dt, t) => { pl.rotation.y += dt * .012; moon.rotation.y += dt * .02; sp.rotation.y = Math.sin(t * .013) * .03;
    layers[1].material.opacity = .78 + .22 * Math.sin(t * 1.9); layers[2].material.opacity = .85 + .15 * Math.sin(t * 2.7 + 1);
    nebs.forEach((n, i) => { n.rotation.z += dt * .003 * (i % 2 ? -1 : 1); }); core.scale.setScalar(5 + .4 * Math.sin(t * 3)); });
}

/* ---------- Raumhülle ---------- */
function shell(ctx, {hall}){
  const R = raumOf(ctx);
  if (R && R.huelle) {   // Raumthema: eigene Hülle; scheitert sie, wird alles Halbfertige entfernt und die bisherige Hülle gebaut
    const G0 = ctx.group, n0 = G0.children.length, t0 = ctx._ticks.length, o0 = ctx._obst.length;
    try { const h = R.huelle(ctx); if (h) return h; } catch (e) { console.error("R3D Raumthema (Hülle)", ctx.key, e); }
    while (G0.children.length > n0) G0.children.pop().traverse(n => { if (n.geometry) n.geometry.dispose(); });
    ctx._ticks.length = t0; ctx._obst.length = o0; delete ctx.decorShell; delete ctx.floor;
  }
  const B = ctx.bounds, W = B.x1 - B.x0, D = B.z0 - B.z1, H = hall ? 9.6 : 7.2, WH = H - 1.4, CH = Math.hypot(1, H - WH), cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, G = ctx.group, b = Bld();
  const pz = hall ? [10, 2.5, -4.5, -11.5, -17] : [9, 4.5, 0, -4.5, -9]; ctx.decorZ = pz;
  const sideDoors = hall ? [6, -1, -8, -15] : [];
  const leds = [], bars = [], ACC = "acc:" + (hall ? "#EEF6FF" : SECTOR[ctx.index % 8] || "#EEF6FF");
  // Boden, Laufsteg, Führungsstreifen (laufende Lichtpulse zu den Türen)
  const floor = new T3.Mesh(U.scaleUV(new T3.PlaneGeometry(W, D), W / 4, D / 4), mat("floor")); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); floor.receiveShadow = true; G.add(floor); ctx.floor = floor;
  b.put("walk", U.scaleUV(new T3.PlaneGeometry(2.6, D - 1.4), 1, (D - 1.4) / 2.6), cx, .004, cz, -Math.PI / 2);
  const gb = Bld(), gL = D - 1.8;
  for (const s of [-1, 1]) gb.put("guide", U.scaleUV(new T3.PlaneGeometry(.1, gL), 1, gL / 1.6), cx + s * 1.36, .008, cz, -Math.PI / 2);
  for (const zd of sideDoors) for (const s of [-1, 1]) { const Lg = W / 2 - 1.42 - .95; gb.put("guide", U.scaleUV(new T3.PlaneGeometry(.1, Lg), 1, Lg / 1.6), cx + s * (1.42 + Lg / 2), .008, zd, -Math.PI / 2, 0, -s * Math.PI / 2); }
  gb.build(G);
  const gTex = tex.guide();
  // Seitenwände: Paneele, Schräge zur Decke, Rohre, Lichtleisten, Rippen
  for (const [xw, s] of [[B.x0, 1], [B.x1, -1]]) {
    const A = z => s > 0 ? cz - z : z - cz, Xd = d => xw + s * d, XA = new T3.Vector3(0, 0, -s);
    const m = new T3.Matrix4().makeBasis(XA, new T3.Vector3(0, 1, 0), new T3.Vector3(s, 0, 0)).setPosition(xw, 0, cz);
    b.putM("wall", wallGeo(D, PANEL_H, sideDoors.map(zd => [A(zd) - 1.25, A(zd) + 1.25, 3.4]), [], 1 / 2.25, 1 / PANEL_H), m);
    if (WH > PANEL_H + .01) { b.putM("bulk", wallGeo(D, WH - PANEL_H, [], [], .25, .25).translate(0, PANEL_H, 0), m); b.box("lc", .04, .05, D, Xd(.02), WH - .03, cz); }
    const sl = new T3.Vector3(s / CH, (H - WH) / CH, 0), nn = new T3.Vector3(s * (H - WH) / CH, -1 / CH, 0);
    const mc = new T3.Matrix4().makeBasis(XA, sl, nn).setPosition(xw + s * .5, WH + (H - WH) / 2, cz);
    b.putM("bulk", U.scaleUV(new T3.PlaneGeometry(D, CH), D / 4, CH / 4), mc);
    b.putM("lc", new T3.BoxGeometry(D, .07, .03).translate(0, .32, .015), mc);
    for (const [t, r] of [[-.52, .08], [-.3, .055]]) b.putM("pipe", new T3.CylinderGeometry(r, r, D, 14, 1, true).rotateZ(Math.PI / 2).translate(0, t, r + .01), mc);
    for (const [z0, z1] of cut([B.z1 + .4, B.z0 - .4], sideDoors.map(z => [z - 1.65, z + 1.65]))) b.box("lc", .03, .05, z1 - z0, Xd(.015), 1.1, (z0 + z1) / 2);
    b.box(ACC, .05, .06, D, Xd(.025), PANEL_H, cz);
    for (const z of pz) {
      b.box("rib", .36, WH, .6, Xd(.18), WH / 2, z);
      b.box("white", .04, WH - .9, .42, Xd(.38), WH / 2 + .05, z);
      b.box("lc", .02, WH - 1.9, .05, Xd(.405), WH / 2 + .35, z);
      b.box("trim", .56, .46, .78, Xd(.28), .23, z); b.box("ly", .02, .035, .6, Xd(.565), .4, z);
      b.box("trim", .5, .32, .74, Xd(.25), WH - .16, z);
      b.putM("rib", new T3.BoxGeometry(.6, CH + .05, .26).translate(A(z), 0, .13), mc);
      ctx.obstacleBox(Xd(.3), z, .6, .8);
      leds.push([Xd(.41), 1.6, z - .1, Math.PI / 2, 0], [Xd(.41), 1.6, z + .1, Math.PI / 2, 1], [Xd(.41), WH - .7, z, Math.PI / 2, 2]);
    }
  }
  // Decke: Paneele, Querträger, Lichtfelder, Mittelträger
  const SKY = {z: -3.5, r: 3.0};   // Halle: rundes Oberlicht über dem Mittelstück
  if (hall) { const sh = new T3.Shape(); sh.moveTo(-(W - 2) / 2, -D / 2); sh.lineTo((W - 2) / 2, -D / 2); sh.lineTo((W - 2) / 2, D / 2); sh.lineTo(-(W - 2) / 2, D / 2); sh.closePath();
    const hp = new T3.Path(); hp.absarc(0, SKY.z - cz, SKY.r, 0, Math.PI * 2, true); sh.holes.push(hp);
    b.put("ceil", U.scaleUV(new T3.ShapeGeometry(sh, 48), .25, .25), cx, H, cz, Math.PI / 2); }
  else b.put("ceil", U.scaleUV(new T3.PlaneGeometry(W - 2, D), (W - 2) / 4, D / 4), cx, H, cz, Math.PI / 2);
  for (const z of pz) { b.box("rib", W - 2, .34, .5, cx, H - .17, z); b.box("lc", W - 2.6, .02, .06, cx, H - .345, z); }
  const bnd = [B.z0, ...pz, B.z1].sort((p, q) => q - p);
  for (let i = 0; i < bnd.length - 1; i++) { const z0 = bnd[i], z1 = bnd[i + 1], Lz = z0 - z1, zm = (z0 + z1) / 2;
    if (Lz < 3 || (hall && z0 > -3.5 && z1 < -3.5)) continue;
    for (const s of [-1, 1]) { const x = cx + s * (hall ? 3.3 : 2.6), Lp = Lz - 1.3; b.box("trim", 1.42, .07, Lp + .22, x, H - .035, zm); b.put("lw", new T3.PlaneGeometry(1.15, Lp), x, H - .075, zm, Math.PI / 2); } }
  for (const [z0, z1] of cut([B.z1, B.z0], hall ? [[SKY.z - SKY.r - .1, SKY.z + SKY.r + .1]] : [])) { b.box("trim", .8, .24, z1 - z0, cx, H - .12, (z0 + z1) / 2); b.box("lc", .1, .02, z1 - z0 - .2, cx, H - .25, (z0 + z1) / 2); }
  if (hall) {   // Oberlicht: Schacht, Rahmen, Leuchtringe, Glas
    b.put("shaft", new T3.CylinderGeometry(SKY.r, SKY.r, 1.0, 64, 1, true), cx, H + .5, SKY.z);
    b.put("rib", new T3.TorusGeometry(SKY.r + .02, .13, 8, 72), cx, H - .02, SKY.z, Math.PI / 2); b.put("lc", new T3.TorusGeometry(SKY.r + .2, .045, 6, 96), cx, H - .07, SKY.z, Math.PI / 2);
    b.put("lw", new T3.TorusGeometry(SKY.r - .04, .035, 6, 96), cx, H + .5, SKY.z, Math.PI / 2); b.put("rib", new T3.TorusGeometry(SKY.r - .02, .1, 6, 72), cx, H + 1.0, SKY.z, Math.PI / 2);
    for (let i = 0; i < 4; i++) b.box("rib", SKY.r * 2, .12, .12, cx, H + .98, SKY.z, 0, i * Math.PI / 4, 0);
    b.put("glass", new T3.CircleGeometry(SKY.r, 48), cx, H + .95, SKY.z, Math.PI / 2); }
  // Vorder- und Rückwand: Panoramafenster, Statuskonsolen, Statusschirme neben der Tür
  const winL = hall ? {x0: 3.3, x1: 8.2, y0: 1.3, y1: 6.6, c: .8} : {x0: 3.1, x1: 7.3, y0: 1.3, y1: 5.5, c: .7};
  const wins = [winL, {...winL, x0: -winL.x1, x1: -winL.x0}];
  ctx.decorShell = {H, WH, pz, sideDoors, win: winL, hall};   // Maße der Hülle für die Ausstattung (14_dekor_sterne.js)
  for (const [zw, dir] of [[B.z1, 1], [B.z0, -1]]) {
    const hasDoor = !hall || dir > 0, ws = wins.concat(hall ? [dir > 0 ? {x0: -2.6, x1: 2.6, y0: 6.4, y1: 8.8, c: .6, m: 2} : {x0: -2.8, x1: 2.8, y0: 1.3, y1: 7.4, c: .8, m: 2}] : []);
    const m = new T3.Matrix4().makeBasis(new T3.Vector3(dir, 0, 0), new T3.Vector3(0, 1, 0), new T3.Vector3(0, 0, dir)).setPosition(cx, 0, zw);
    b.putM("bulk", wallGeo(W, H, hasDoor ? [[-1.25, 1.25, 3.4]] : [], ws, .25, .25), m);
    for (const [x0, x1] of cut([-W / 2, W / 2], hasDoor ? [[-1.55, 1.55]] : [])) b.putM("trim", new T3.BoxGeometry(x1 - x0, .14, .05).translate((x0 + x1) / 2, .07, .025), m);
    if (!hall) b.putM(ACC, new T3.BoxGeometry(W - .2, .06, .03).translate(0, 6.3, .015), m);
    for (const w of ws) {
      const P = octPts(w);
      for (let i = 0; i < 8; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 8], Le = Math.hypot(bx - ax, by - ay), a = Math.atan2(by - ay, bx - ax), mx = (ax + bx) / 2, my = (ay + by) / 2;
        b.putM("rib", new T3.BoxGeometry(Le + .14, .2, .8).rotateZ(a).translate(mx, my, -.25), m);
        b.putM("lc", new T3.BoxGeometry(Math.max(.05, Le - .06), .035, .03).rotateZ(a).translate(mx, my, .165), m); }
      const nM = w.m || 1; for (let k = 1; k <= nM; k++) b.putM("trim", new T3.BoxGeometry(.1, w.y1 - w.y0, .12).translate(w.x0 + (w.x1 - w.x0) * k / (nM + 1), (w.y0 + w.y1) / 2, -.2), m);
      const gs = new T3.Shape(); P.forEach(([x, y], i) => i ? gs.lineTo(x, y) : gs.moveTo(x, y));
      const gg = new T3.ShapeGeometry(gs), guv = gg.attributes.uv; for (let i = 0; i < guv.count; i++) guv.setXY(i, (guv.getX(i) - w.x0) / (w.x1 - w.x0), (guv.getY(i) - w.y0) / (w.y1 - w.y0));
      b.putM("glass", gg.translate(0, 0, -.38), m);
      if (w.y0 < 2) consoleUnder(ctx, b, w, m, bars, leds);
    }
    if (hasDoor) for (const sx of [-1, 1]) { const x = sx * (hall ? 2.38 : 2.3);
      b.putM("trim", new T3.BoxGeometry(.92, 1.0, .08).translate(x, 2.85, .04), m); b.putM("lc", new T3.BoxGeometry(.92, .025, .02).translate(x, 3.37, .07), m);
      b.putM("scr", atlasUV(new T3.PlaneGeometry(.8, .8), sx < 0 ? 4 : 5).translate(x, 2.85, .085), m); }
  }
  // Rohre in den Ecken
  for (const [xw, s] of [[B.x0, 1], [B.x1, -1]]) for (const [zw, dir] of [[B.z1, 1], [B.z0, -1]]) {
    b.put("pipe", new T3.CylinderGeometry(.085, .085, H, 14, 1, true), xw + s * .2, H / 2, zw + dir * .32);
    b.put("pipe", new T3.CylinderGeometry(.05, .05, H, 10, 1, true), xw + s * .42, H / 2, zw + dir * .2);
    for (const y of [1.2, 3.3, 5.4]) { b.put("trim", new T3.TorusGeometry(.1, .025, 6, 18), xw + s * .2, y, zw + dir * .32, Math.PI / 2); b.put("trim", new T3.TorusGeometry(.066, .02, 6, 14), xw + s * .42, y + .1, zw + dir * .2, Math.PI / 2);
      b.box("trim", .3, .07, .1, xw + s * .1, y, zw + dir * .32); b.box("trim", .1, .07, .2, xw + s * .42, y + .1, zw + dir * .1); }
    b.put("haz", U.scaleUV(new T3.CylinderGeometry(.088, .088, .5, 14, 1, true), 2, 1), xw + s * .2, 2.25, zw + dir * .32);
  }
  b.build(G);
  // Kleine Statusleuchten und Balkenanzeigen (instanziert, blinken)
  const ledCols = [new T3.Color(YEL), new T3.Color(CYAN), new T3.Color("#3DDC97"), new T3.Color("#FF5C5C")], dim = new T3.Color(0x1a2a36);
  const ledM = new T3.InstancedMesh(new T3.BoxGeometry(.05, .05, .02), basic({}), leds.length), o3 = new T3.Object3D();
  leds.forEach(([x, y, z, ry], i) => { o3.position.set(x, y, z); o3.rotation.set(0, ry, 0); o3.updateMatrix(); ledM.setMatrixAt(i, o3.matrix); ledM.setColorAt(i, ledCols[leds[i][4] % 4 === 3 && i % 7 ? 1 : leds[i][4] % 4]); });   // Rot nur selten
  G.add(ledM);
  const barM = new T3.InstancedMesh(new T3.BoxGeometry(.04, 1, .015), basic({}), Math.max(1, bars.length)); barM.count = bars.length;
  bars.forEach(([x, y, z], i) => barM.setColorAt(i, i % 5 === 4 ? ledCols[0] : ledCols[1])); G.add(barM);
  const radar = tex.radar(); let acc = 0;
  ctx.tick((dt, t) => {
    gTex.offset.y -= dt * .45; radar.rotation = -t * 1.3;
    bars.forEach(([x, y, z, ph], i) => { const h = .04 + .26 * (.5 + .5 * Math.sin(t * (1.3 + (i % 3) * .7) + ph)) * (.6 + .4 * Math.sin(t * .37 + i)); o3.position.set(x, y + h / 2, z); o3.rotation.set(0, 0, 0); o3.scale.set(1, h, 1); o3.updateMatrix(); barM.setMatrixAt(i, o3.matrix); });
    o3.scale.set(1, 1, 1); barM.instanceMatrix.needsUpdate = true;
    acc += dt; if (acc > .22) { acc = 0; for (let k = 0; k < 4; k++) { const i = (Math.random() * leds.length) | 0, on = Math.random() < .7; ledM.setColorAt(i, on ? ledCols[leds[i][4] % 4 === 3 ? 3 : leds[i][4] % 3] : dim); } ledM.instanceColor.needsUpdate = true; }
  });
  return H;
}
function consoleUnder(ctx, b, w, m, bars, leds){   // schräges Pult unter einem Fenster mit Schirmen, Radar, Balkenanzeige
  const x0 = w.x0 + .15, x1 = w.x1 - .15, L = x1 - x0, xc = (x0 + x1) / 2, tilt = .45;
  b.putM("white", new T3.BoxGeometry(L, .78, .46).translate(xc, .47, .27), m);
  b.putM("trim", new T3.BoxGeometry(L - .1, .1, .4).translate(xc, .05, .24), m);
  b.putM("trim", new T3.BoxGeometry(L - .3, .36, .02).translate(xc, .5, .505), m);
  b.putM("lc", new T3.BoxGeometry(L, .025, .02).translate(xc, .86, .505), m);
  const top = new T3.Matrix4().makeRotationX(tilt).setPosition(xc, .93, .3);
  b.putM("rib", new T3.BoxGeometry(L + .04, .05, .62).applyMatrix4(top), m);
  const sx0 = x0 + .08, sx1 = x1 - .44, k = Math.max(2, Math.round((sx1 - sx0) / 1.25)), sw = (sx1 - sx0) / k;
  for (let i = 0; i < k; i++) b.putM("scr", atlasUV(new T3.PlaneGeometry(sw - .07, .42), (i + Math.round(Math.abs(w.x0) * 3)) % 4).rotateX(-Math.PI / 2).translate(sx0 + sw * (i + .5) - xc, .029, -.02).applyMatrix4(top), m);
  b.putM("radar", new T3.CircleGeometry(.17, 40).rotateX(-Math.PI / 2).translate(x1 - .22 - xc, .03, -.02).applyMatrix4(top), m);
  const v = new T3.Vector3();
  for (let i = 0; i < 12; i++) { v.set(x0 + .3 + i * .075, .34, .52).applyMatrix4(m); bars.push([v.x, v.y, v.z, i * .9 + w.x0]); }
  for (let i = 0; i < 6; i++) { v.set(x1 - .3 - i * .1, .6, .52).applyMatrix4(m); leds.push([v.x, v.y, v.z, 0, i]); }
  const c = new T3.Vector3(xc, 0, .3).applyMatrix4(m); ctx.obstacleBox(c.x, c.z, L + .1, .62);
}

/* ---------- Tür: Schiebetür aus zwei Hälften mit Warnstreifen, Leuchtrahmen, Anzeigeschirm und Leuchtgang ---------- */
function screenTex(label, sub){
  const w = 1024, h = 336, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  chamf(g, 6, 6, w - 12, h - 12, 34); g.fillStyle = "rgba(3,12,24,.95)"; g.fill();
  g.save(); g.clip(); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(79,195,247,.2)"); gr.addColorStop(.45, "rgba(79,195,247,0)"); gr.addColorStop(1, "rgba(79,195,247,.12)");
  g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = "rgba(79,195,247,.05)"; g.fillRect(0, y, w, 1.5); } g.restore();
  g.lineWidth = 5; g.strokeStyle = CYAN; chamf(g, 10, 10, w - 20, h - 20, 30); g.stroke();
  g.fillStyle = YEL; for (const x of [24, w - 24]) { g.beginPath(); g.moveTo(x, h / 2 - 30); g.lineTo(x + (x < w / 2 ? 22 : -22), h / 2); g.lineTo(x, h / 2 + 30); g.closePath(); g.fill(); }
  const txt = String(label || "").toUpperCase(); let fs = 112; g.font = `700 ${fs}px ${FONT}`; while (g.measureText(txt).width > w - 150 && fs > 40) { fs -= 4; g.font = `700 ${fs}px ${FONT}`; }
  g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(255,232,31,.55)"; g.shadowBlur = 16; g.fillStyle = YEL; g.fillText(txt, w / 2, sub ? h * .41 : h * .5); g.shadowBlur = 0;
  if (sub) { let f2 = 50; g.font = `500 ${f2}px ${BODY}`; while (g.measureText(sub).width > w - 150 && f2 > 24) { f2 -= 2; g.font = `500 ${f2}px ${BODY}`; } g.fillStyle = "#BFEBFF"; g.fillText(sub, w / 2, h * .77);
    g.fillStyle = "rgba(79,195,247,.6)"; g.fillRect(w / 2 - 160, h * .615, 320, 3); }
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t;
}
function door(ctx, {label, sub}){
  const g = new T3.Group(), b = Bld(), cY = new T3.Color(YEL), cC = new T3.Color("#7FE3FF");
  for (const s of [-1, 1]) {
    b.box("rib", .3, 3.75, .3, s * 1.4, 1.875, .15); b.box("white", .22, 2.6, .03, s * 1.4, 1.85, .31);
    b.put("haz", U.scaleUV(new T3.PlaneGeometry(1.0, .14), 1.8, 1), s * 1.4, .62, .33, 0, 0, Math.PI / 2);
    b.box("trim", .06, 3.5, 2.3, s * 1.33, 1.72, -1.15);                     // Außenhaut des Gangs
    b.box("rib", .42, .42, .3, s * 1.25, 3.4, .15, 0, 0, Math.PI / 4);        // Schräge in den oberen Ecken
  }
  b.box("rib", 3.1, .55, .3, 0, 3.675, .15); b.box("trim", 2.9, .3, .03, 0, 3.675, .31);
  b.put("haz", U.scaleUV(new T3.PlaneGeometry(2.6, .14), 4.6, 1), 0, 3.675, .33);
  b.box("trim", 2.72, .06, 2.3, 0, 3.49, -1.15);
  b.put("haz", U.scaleUV(new T3.PlaneGeometry(2.9, .32), 2.3, 1), 0, .008, .58, -Math.PI / 2);
  b.box("trim", 3.06, 1.1, .14, 0, 4.62, .1); b.box("lc", 3.0, .025, .02, 0, 5.16, .17); b.box("lc", 3.0, .025, .02, 0, 4.08, .17);
  b.box("trim", .17, .32, .03, 1.4, 1.42, .34);
  b.build(g, ["rib"]);
  // Leuchtrahmen (eigenes Material: gelb geschlossen, cyan offen)
  const lf = basic({color: YEL}), lfGeo = []; for (const s of [-1, 1]) { lfGeo.push(new T3.BoxGeometry(.04, 2.95, .03).translate(s * 1.285, 1.55, .31), new T3.BoxGeometry(.5, .04, .03).rotateZ(-s * Math.PI / 4).translate(s * 1.1, 3.22, .31)); }
  lfGeo.push(new T3.BoxGeometry(1.75, .04, .03).translate(0, 3.42, .31), new T3.BoxGeometry(.11, .07, .02).translate(1.4, 1.5, .36));
  const frameLight = new T3.Mesh(merge(lfGeo), lf); g.add(frameLight);
  // Leuchtgang hinter der Tür (nur durch die Öffnung sichtbar)
  const corr = new T3.Mesh(new T3.BoxGeometry(2.5, 3.4, 2.3), M.corr()); corr.position.set(0, 1.7, -1.15); g.add(corr);
  const endM = basic(Object.assign({map: tex.endglow(), opacity: .5}, ADD)), endP = new T3.Mesh(new T3.PlaneGeometry(2.45, 3.35), endM); endP.position.set(0, 1.68, -2.25); g.add(endP);
  // Türhälften (gleiten hinter die Wand)
  const lg = new T3.BoxGeometry(1.27, 3.4, .08), rgeo = lg.clone(), ruv = rgeo.attributes.uv; for (let i = 0; i < ruv.count; i++) ruv.setX(i, 1 - ruv.getX(i));
  const L = new T3.Mesh(lg, M.leaf()), R = new T3.Mesh(rgeo, M.leaf()); L.position.set(-.635, 1.7, -.1); R.position.set(.635, 1.7, -.1); L.castShadow = R.castShadow = true; L.receiveShadow = R.receiveShadow = true; g.add(L, R);
  // Lichtschein auf dem Boden und im Durchgang
  const spM = basic(Object.assign({map: tex.spill(), opacity: 0}, ADD)), spill = new T3.Mesh(new T3.PlaneGeometry(2.6, 2.6), spM); spill.rotation.x = -Math.PI / 2; spill.position.set(0, .015, 1.3); g.add(spill);
  const gl = sprite(0x9fe8ff, 3.2); gl.position.set(0, 1.75, .25); gl.material.opacity = 0; g.add(gl);
  // Anzeigeschirm mit Raumname
  const scr = new T3.Mesh(new T3.PlaneGeometry(2.9, .95), basic({map: screenTex(label, sub), transparent: true})); scr.position.set(0, 4.62, .18); g.add(scr);
  let target = 0, k = 0, t = Math.random() * 6;
  return {group: g, open(){ target = 1; }, close(){ target = 0; },
    update(dt){ t += dt; k += (target - k) * Math.min(1, dt * 3.2); const e = k * k * (3 - 2 * k);
      L.position.x = -.635 - 1.3 * e; R.position.x = .635 + 1.3 * e;
      lf.color.copy(cY).lerp(cC, Math.min(1, k * 1.6)).multiplyScalar(.82 + .18 * Math.sin(t * 2.4));
      endM.opacity = .5 + .5 * k; spM.opacity = .65 * k; gl.material.opacity = .85 * k; gl.scale.setScalar(2.6 + 1.6 * k); }};
}

/* ---------- Station: Holo-Konsole mit schrägem Pult, Projektor, drehendem Hologramm, Nummer und Name ---------- */
function stationTex(j, name){ return U.canvasTex(512, 320, (g, w, h) => {
  g.fillStyle = "#04121f"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(79,195,247,.10)"; g.lineWidth = 1;
  for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = CYAN; g.lineWidth = 4; chamf(g, 8, 8, w - 16, h - 16, 22); g.stroke();
  g.fillStyle = CYAN; g.font = `600 30px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(`STATION ${j + 1} / 4`, 34, 50);
  for (let i = 0; i < 4; i++) { g.fillStyle = i <= j ? YEL : "rgba(79,195,247,.25)"; g.fillRect(w - 34 - (4 - i) * 32, 38, 24, 24); }
  let fs = 86; g.font = `700 ${fs}px ${FONT}`; while (g.measureText(name).width > w - 70 && fs > 30) { fs -= 4; g.font = `700 ${fs}px ${FONT}`; }
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.fillText(name, w / 2, h * .55);
  g.strokeStyle = "rgba(255,232,31,.85)"; g.lineWidth = 3; g.beginPath(); for (let x = 40; x <= w - 40; x += 4) { const y = h * .83 + Math.sin(x * .05 + j) * 12 * Math.sin(x * .013); x === 40 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
}, `s-st-${j}-${name}`); }
function hologram(j){
  const grp = new T3.Group(), face = basic(Object.assign({color: 0x4fc3f7, opacity: .2, side: T3.DoubleSide}, ADD)), edge = new T3.LineBasicMaterial(Object.assign({color: 0xa8ecff, opacity: .95, toneMapped: false}, ADD));
  const add = (geo, lines = true) => { grp.add(new T3.Mesh(geo, face)); if (lines) grp.add(new T3.LineSegments(new T3.EdgesGeometry(geo, 15), edge)); };
  if (j === 0) {   // Atom
    const parts = []; for (let i = 0; i < 3; i++) { const q = new T3.Euler(Math.PI / 2 + (i - 1) * .9, i * 1.05, 0);
      parts.push(new T3.TorusGeometry(.19, .007, 6, 72).applyMatrix4(new T3.Matrix4().makeRotationFromEuler(q)));
      parts.push(new T3.SphereGeometry(.022, 10, 8).translate(.19, 0, 0).applyMatrix4(new T3.Matrix4().makeRotationFromEuler(q))); }
    grp.add(new T3.Mesh(merge(parts), basic(Object.assign({color: 0x8fe6ff, opacity: .9}, ADD))));
    grp.add(new T3.Mesh(new T3.SphereGeometry(.05, 16, 12), basic({color: 0xffe81f})));
  } else if (j === 1) { add(new T3.IcosahedronGeometry(.17, 0)); add(new T3.OctahedronGeometry(.075, 0)); }
  else if (j === 2) {   // Zahnrad
    const parts = [new T3.CylinderGeometry(.13, .13, .05, 24)]; for (let i = 0; i < 10; i++) parts.push(new T3.BoxGeometry(.06, .05, .05).translate(0, 0, .15).applyMatrix4(new T3.Matrix4().makeRotationY(i / 10 * Math.PI * 2)));
    const gg = merge(parts).rotateX(Math.PI / 2); grp.add(new T3.Mesh(gg, face)); grp.add(new T3.LineSegments(new T3.EdgesGeometry(new T3.CylinderGeometry(.13, .13, .05, 24).rotateX(Math.PI / 2), 15), edge));
    grp.add(new T3.Mesh(new T3.TorusGeometry(.05, .012, 6, 24), basic(Object.assign({color: 0xffe81f, opacity: .9}, ADD))));
  } else {   // Stern (Prüfung)
    const s = new T3.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .08 : .19; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath();
    add(new T3.ExtrudeGeometry(s, {depth: .05, bevelEnabled: false}).translate(0, 0, -.025));
  }
  return {grp, face, edge};
}
function labelTex(j, name){   // Holo-Plakette: gelbes Nummernfeld + Stationsname
  return U.canvasTex(768, 192, (g, w, h) => {
    chamf(g, 5, 8, w - 10, h - 16, 30); g.fillStyle = "rgba(4,22,40,.92)"; g.fill(); g.lineWidth = 6; g.strokeStyle = CYAN; g.stroke();
    chamf(g, 22, 24, h - 48, h - 48, 18); g.fillStyle = YEL; g.fill();
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#08121e"; g.font = `700 ${h * .62}px ${FONT}`; g.fillText(String(j + 1), 22 + (h - 48) / 2, h / 2 + 6);
    const x0 = h + 6; g.fillStyle = "rgba(79,195,247,.5)"; g.fillRect(x0 - 14, 34, 3, h - 68);
    let fs = 92; g.font = `600 ${fs}px ${FONT}`; while (g.measureText(name).width > w - x0 - 40 && fs > 36) { fs -= 3; g.font = `600 ${fs}px ${FONT}`; }
    g.fillStyle = "#F2FAFF"; g.shadowColor = "rgba(79,195,247,.6)"; g.shadowBlur = 12; g.fillText(name, (x0 + w - 24) / 2, h / 2 + 4);
  }, `s-lbl-${j}-${name}`);
}
function station(ctx, j, name){
  const g = new T3.Group(), b = Bld(), tilt = .5;
  // Sockel mit Leuchtkante und Eckleuchten
  b.put("trim", new T3.CylinderGeometry(.62, .68, .1, 6), 0, .05, 0); b.put("lc", new T3.TorusGeometry(.63, .014, 4, 6), 0, .102, 0, Math.PI / 2, 0, Math.PI / 6);
  b.put("rib", new T3.CylinderGeometry(.5, .56, .06, 6), 0, .13, 0);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.box(i % 3 ? "lc" : "ly", .06, .025, .06, Math.sin(a) * .5, .168, Math.cos(a) * .5); }
  // Säule mit Seitenflossen
  b.box("rib", .44, .82, .36, 0, .57, -.04); b.box("white", .36, .62, .02, 0, .58, .145); b.box("lc", .04, .5, .012, 0, .58, .158);
  for (const s of [-1, 1]) { b.box("trim", .05, .7, .3, s * .25, .55, -.05); b.box("lc", .012, .5, .012, s * .277, .58, .06); }
  // schräges Pult mit Bedienleiste
  const top = new T3.Matrix4().makeRotationX(tilt).setPosition(0, 1.02, .02);
  b.putM("rib", new T3.BoxGeometry(1.0, .06, .66), top); b.putM("trim", new T3.BoxGeometry(.92, .03, .58).translate(0, -.04, 0), top);
  b.putM("ly", new T3.BoxGeometry(1.0, .02, .02).translate(0, 0, .335), top); b.putM("lc", new T3.BoxGeometry(1.0, .02, .02).translate(0, .01, -.335), top);
  for (let i = 0; i < 6; i++) b.putM(i === 2 ? "ly" : "lc", new T3.BoxGeometry(.07, .02, .035).translate(-.3 + i * .12, .035, .29), top);
  // Projektor hinter dem Pult
  b.put("rib", new T3.CylinderGeometry(.055, .085, .95, 12), 0, .86, -.42); b.put("trim", new T3.CylinderGeometry(.14, .1, .08, 16), 0, 1.34, -.42);
  b.put("lc", new T3.TorusGeometry(.12, .014, 6, 28), 0, 1.385, -.42, Math.PI / 2);
  b.build(g, ["rib", "trim", "white"]);
  const scr = new T3.Mesh(new T3.PlaneGeometry(.86, .5).rotateX(-Math.PI / 2).translate(0, .034, 0).applyMatrix4(top), imat(`st${j}${name}`, () => basic({map: stationTex(j, name)}))); g.add(scr);
  // Lichtkegel und Hologramm
  const coneM = basic(Object.assign({map: tex.cone(), color: 0x6fd6ff, opacity: .55, side: T3.DoubleSide}, ADD)), cone = new T3.Mesh(new T3.CylinderGeometry(.27, .09, .26, 28, 1, true), coneM); cone.position.set(0, 1.52, -.42); g.add(cone);
  const em = sprite(0x8fe6ff, .45); em.position.set(0, 1.4, -.42); g.add(em);
  const H = hologram(j); H.grp.scale.setScalar(1.15); H.grp.position.set(0, 1.6, -.42); g.add(H.grp);
  const ringM = basic({color: 0x4fc3f7, transparent: true, opacity: .55}), ring = new T3.Mesh(new T3.RingGeometry(.8, .86, 48), ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = .012; g.add(ring);
  // schwebende Plakette mit Nummer und Name
  const nm = new T3.Mesh(new T3.PlaneGeometry(1.44, .36), basic({map: labelTex(j, name), transparent: true})); nm.position.set(0, 2.02, -.3); g.add(nm);
  const gl = sprite(0x4fc3f7, 1.9); gl.scale.set(2.1, .9, 1); gl.position.set(0, 2.02, -.34); gl.material.opacity = .35; g.add(gl);
  const ph = j * 1.7;
  ctx.tick((dt, t) => {
    H.grp.rotation.y = t * .9 + ph; H.grp.rotation.x = Math.sin(t * .7 + ph) * .25; H.grp.position.y = 1.6 + Math.sin(t * 1.4 + ph) * .025;
    const fl = .8 + .2 * Math.sin(t * 23 + ph) * Math.sin(t * 3.1); H.face.opacity = .22 * fl; H.edge.opacity = .95 * fl; em.material.opacity = .6 + .3 * fl;
    nm.position.y = gl.position.y = 2.02 + Math.sin(t * 1.6 + ph) * .025; ringM.opacity = .35 + .2 * Math.sin(t * 2 + ph); coneM.opacity = .45 + .1 * Math.sin(t * 5 + ph); });
  return g;
}

/* ---------- Tafel: Holo-Schirm (dunkel, halbtransparent, cyanfarbener Rahmen, helle Schrift) ---------- */
function board(ctx, title, lines, o = {}){
  const w = o.w || 2.4, h = o.h || 1.6, k = 1024 / Math.max(w, h), cw = Math.round(w * k), ch = Math.round(h * k), small = !!o.small;
  const c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d"), cut = Math.min(cw, ch) * .07;
  chamf(g, 6, 6, cw - 12, ch - 12, cut); const bg = g.createLinearGradient(0, 0, 0, ch); bg.addColorStop(0, "rgba(12,38,64,.9)"); bg.addColorStop(1, "rgba(4,14,28,.86)"); g.fillStyle = bg; g.fill();
  g.save(); g.clip(); for (let y = 0; y < ch; y += 5) { g.fillStyle = "rgba(79,195,247,.045)"; g.fillRect(0, y, cw, 2); }
  g.fillStyle = "rgba(79,195,247,.06)"; for (let x = 40; x < cw; x += 40) for (let y = 40; y < ch; y += 40) g.fillRect(x, y, 2, 2); g.restore();
  g.lineWidth = 4; g.strokeStyle = "rgba(79,195,247,.9)"; chamf(g, 8, 8, cw - 16, ch - 16, cut - 2); g.stroke();
  g.lineWidth = 9; g.strokeStyle = "#A8ECFF"; const bl = Math.min(cw, ch) * .12;
  for (const [x, y, sx, sy] of [[8, 8, 1, 1], [cw - 8, 8, -1, 1], [8, ch - 8, 1, -1], [cw - 8, ch - 8, -1, -1]]) { g.beginPath(); g.moveTo(x + sx * (cut + bl), y); g.lineTo(x + sx * cut, y); g.lineTo(x, y + sy * cut); g.lineTo(x, y + sy * (cut + bl)); g.stroke(); }
  const padX = cw * .07; let tsz = small ? ch * .32 : Math.min(ch * .13, 70), bsz = small ? ch * .19 : Math.min(ch * .082, 44);
  g.textBaseline = "top"; g.font = `700 ${tsz}px ${FONT}`; let tl = U.wrapText(g, U.richT(title), cw - padX * 2).slice(0, 2);
  const body = () => { g.font = `500 ${bsz}px ${BODY}`; return (lines || []).map(ln => U.wrapText(g, U.richT(ln), cw - padX * 2 - (small ? 0 : bsz * 1.1))); };
  let wl = body(); const avail = () => ch - (small ? ch * .12 : ch * .1) - tl.length * tsz * 1.12 - tsz * .55 - ch * .08;
  if (!small) { bsz = Math.min(ch * .1, 54); wl = body(); while (wl.flat().length * bsz * 1.34 > avail() && bsz > 22) { bsz *= .94; wl = body(); } }
  let y = small ? ch * .13 : ch * .1; g.textAlign = "center"; g.font = `700 ${tsz}px ${FONT}`; g.fillStyle = YEL; g.shadowColor = "rgba(255,232,31,.45)"; g.shadowBlur = 12;
  for (const l of tl) { U.fillRich(g, l, cw / 2, y); y += tsz * 1.12; } g.shadowBlur = 0;
  if (!small) { g.fillStyle = "rgba(79,195,247,.75)"; g.fillRect(padX, y + tsz * .12, cw - padX * 2, 3); g.fillStyle = YEL; g.fillRect(padX, y + tsz * .12 - 3, 60, 9); }
  y += tsz * .55; g.font = `500 ${bsz}px ${BODY}`; g.fillStyle = "#EAF6FF"; g.textAlign = small ? "center" : "left";
  for (const ls of wl) { let first = true; for (const l of ls) { if (y > ch - bsz * 1.3) break;
      if (!small && first) { g.fillStyle = CYAN; g.beginPath(); const yy = y + bsz * .52, xx = padX + bsz * .32; g.moveTo(xx, yy - bsz * .22); g.lineTo(xx + bsz * .22, yy); g.lineTo(xx, yy + bsz * .22); g.lineTo(xx - bsz * .22, yy); g.fill(); g.fillStyle = "#EAF6FF"; }
      U.fillRich(g, l, small ? cw / 2 : padX + bsz * 1.1, y); y += bsz * 1.34; first = false; } }
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8;
  const m = new T3.Mesh(new T3.PlaneGeometry(w, h), basic({map: t, transparent: true}));
  const halo = new T3.Mesh(new T3.PlaneGeometry(w + .34, h + .34), M.halo()); halo.position.z = -.012; halo.renderOrder = -1; m.add(halo);
  const back = new T3.Mesh(new T3.PlaneGeometry(w, h), M.back()); back.rotation.y = Math.PI; back.position.z = -.004; m.add(back);
  return m;
}

/* ---------- Stimmung: Holo-Partikel, vorbeigleitender Lichtschein (Schiff draußen + Licht innen) ---------- */
function ambient(ctx, sc){
  const B = ctx.bounds, H = ctx.height || 7.2, hall = ctx.key === "halle", r = U.seeded(311), N = hall ? 240 : 170;
  const pp = new Float32Array(N * 3), pc = new Float32Array(N * 3), ph = [];
  for (let i = 0; i < N; i++) { pp[i * 3] = B.x0 + 1 + r() * (B.x1 - B.x0 - 2); pp[i * 3 + 1] = .3 + r() * (H - 1.5); pp[i * 3 + 2] = B.z1 + 1 + r() * (B.z0 - B.z1 - 2); ph.push(r() * 6.3);
    const c = r() < .16 ? [1, .91, .2] : [.45, .82, 1]; pc[i * 3] = c[0]; pc[i * 3 + 1] = c[1]; pc[i * 3 + 2] = c[2]; }
  const pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.BufferAttribute(pp, 3)); pg.setAttribute("color", new T3.BufferAttribute(pc, 3));
  const pts = new T3.Points(pg, new T3.PointsMaterial({map: U.glowTex(), vertexColors: true, size: .07, transparent: true, opacity: .8, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})); sc.add(pts);
  // Vorbeigleitendes Schiff draußen + wandernder Lichtschein im Raum
  const sweep = new T3.PointLight(0xfff0c8, 0, 15, 2); sc.add(sweep);
  const ship = new T3.Group(), hull = new T3.Mesh(merge([new T3.CapsuleGeometry(.5, 2.2, 4, 12).rotateZ(Math.PI / 2), new T3.BoxGeometry(1.1, .06, 2.4).translate(-.45, -.1, 0),
      new T3.CylinderGeometry(.2, .24, 1.0, 10).rotateZ(Math.PI / 2).translate(-1.3, -.05, .62), new T3.CylinderGeometry(.2, .24, 1.0, 10).rotateZ(Math.PI / 2).translate(-1.3, -.05, -.62),
      new T3.BoxGeometry(.7, .5, .06).translate(-1.1, .42, 0)]), basic({color: 0x6c7784, fog: false}));
  const eng = sprite(0x6fd6ff, 2.2), nav1 = sprite(0xff5c5c, .7), nav2 = sprite(0x3ddc97, .7), head = sprite(0xffffff, 1.1);
  const trail = new T3.Mesh(new T3.PlaneGeometry(.45, 10).rotateZ(-Math.PI / 2), basic(Object.assign({map: tex.spill(), color: 0x8fe0ff, fog: false, opacity: .85, side: T3.DoubleSide}, ADD)));
  trail.position.x = -6.9; eng.position.x = -1.9; nav1.position.set(-.5, -.1, 1.25); nav2.position.set(-.5, -.1, -1.25); head.position.x = 1.7; ship.add(hull, trail, eng, nav1, nav2, head); ship.visible = false; sc.add(ship);
  const patchM = basic(Object.assign({map: U.glowTex(), color: 0xfff1cf, opacity: 0}, ADD)), patch = new T3.Mesh(new T3.PlaneGeometry(7, 4.5), patchM); patch.rotation.x = -Math.PI / 2; patch.position.y = .02; sc.add(patch);
  // Raumthema: Stimmung anpassen (Teilchenfarben, eigenes Pulsieren); A.eigen = true schaltet den Vorbeiflug ab, das Licht sweep gehört dann dem Raum
  const R = raumOf(ctx), A = {pts, farben: pc, geo: pg, sweep, ship, patch, eigen: false};
  if (R && R.stimmung) { try { R.stimmung(ctx, sc, A); } catch (e) { console.error("R3D Raumthema (Stimmung)", ctx.key, e); A.eigen = false; } }
  ctx.tick((dt, t) => {
    for (let i = 0; i < N; i++) { pp[i * 3 + 1] += dt * (.05 + (i % 5) * .012); if (pp[i * 3 + 1] > H - 1) pp[i * 3 + 1] = .2; pp[i * 3] += Math.sin(t * .4 + ph[i]) * dt * .05; pp[i * 3 + 2] += Math.cos(t * .33 + ph[i]) * dt * .05; }
    pg.attributes.position.needsUpdate = true; pts.material.opacity = .65 + .15 * Math.sin(t * 1.3);
    if (A.eigen) { ship.visible = false; patchM.opacity = 0; return; }
    const P = 15, kk = (t % P) / P, cyc = Math.floor(t / P), act = kk < .36;
    if (!act) { sweep.intensity = 0; ship.visible = false; patchM.opacity = 0; return; }
    const s = kk / .36, dir = cyc % 2 ? 1 : -1, front = cyc % 4 < 2, x = dir * (-1 + 2 * s), f = Math.sin(Math.PI * s) ** 2, zi = front ? B.z1 + 2.4 : B.z0 - 2.4;
    sweep.position.set(x * (B.x1 - B.x0) * .55, H - 1.4, zi); sweep.intensity = 40 * f;
    patch.position.set(x * (B.x1 - B.x0) * .5, .02, zi + (front ? .6 : -.6)); patchM.opacity = .22 * f;
    ship.visible = true; ship.position.set(x * 34, 6.5 + Math.sin(s * 3) * .6, front ? B.z1 - 15 : B.z0 + 15); ship.scale.set(dir, 1, 1); ship.rotation.z = Math.sin(s * 3) * .05 * dir;
    nav1.material.opacity = nav2.material.opacity = (t * 2) % 1 < .5 ? 1 : .2;
  });
}
function placeholder(ctx){ const b = ctx.board(ctx.room.n, [ctx.topic ? ctx.topic.title : ""], {w: 3, h: 1.6}); b.position.set(0, 2.2, -1.5); ctx.group.add(b); }

R3D.kits.sterne = {pal, font: FONT, fontBody: BODY, mat, env, shell, door, station, board, ambient, placeholder, raum: RAUM,
  // Bauhilfen für die Ausstattung (14_dekor_sterne.js) und die Raumthemen (17_raum_sterne*.js): Texturen, Materialien, Zeichenhilfen, Geometrie bündeln
  lib: {tex, M, matOf, imat, basic, ADD, merge, Bld, sprite, octPts, plate, bolts, chamf, noise, slots, hud, SECTOR, CYAN, YEL, PANEL_H, wallGeo, atlasUV, cut, consoleUnder, envMap}};
})();
