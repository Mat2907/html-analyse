/* ---------- 12_detektiv.js ---------- */
/* =====================================================================
   3D-Weltstil „Detektei“: viktorianisches London im Gaslicht
   Dunkle Holzdielen, Perserläufer, Holzvertäfelung, grüne Damast-Tapete, Stuckgesims, Pilaster mit Gaslampen,
   Bücherregale, Kamin mit Feuer, Pendeluhr, gerahmte Bilder, Sekretäre mit Bankerlampe, Korktafeln, Londoner Nebel
   Schnittstelle eines Weltstils (gleich für alle Welten, siehe RAUM-API.md):
   pal, font, fontBody, mat(kind, o), env(ctx, scene), shell(ctx, {hall}) → Höhe, door(ctx, {label, sub}) → {group, open, update},
   station(ctx, j, name) → Group (Vorderseite +z), board(ctx, title, lines, o) → Group, ambient(ctx, scene), placeholder(ctx)
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.util) return;
const U = R3D.util, TAU = Math.PI * 2;
const FONT = "Baskerville, 'Baskerville Old Face', 'Hoefler Text', Georgia, serif";
const BODY = "'American Typewriter', 'Courier New', Courier, monospace";
const NEWS = "Georgia, 'Times New Roman', serif";
const pal = {accent: "#E0A86A", accent2: "#2F5D5D", glow: "#FFC98A", ink: "#2A2118", light: "#F3E6CC", cool: "#8FB3B3", danger: "#C0392B", ok: "#8FBF7A"};

/* ---------- Zeichenhilfen ---------- */
const rnd = U.seeded(1887);
function noise(g, w, h, n, a, colors){ for (let i = 0; i < n; i++) { g.fillStyle = colors[(rnd() * colors.length) | 0]; g.globalAlpha = a * rnd(); const s = 1 + rnd() * 2.5; g.fillRect(rnd() * w, rnd() * h, s, s); } g.globalAlpha = 1; }
function grain(g, w, h, [hu, sa, li], n, amp){
  g.fillStyle = `hsl(${hu},${sa}%,${li}%)`; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) { g.fillStyle = `hsla(${hu + (rnd() - .5) * 6},${sa}%,${li + (rnd() - .5) * 9}%,.4)`; const x = rnd() * w, bw = 8 + rnd() * 46;
    g.fillRect(x, 0, bw, h); if (x + bw > w) g.fillRect(x - w, 0, bw, h); }
  for (let k = 0; k < n; k++) { g.strokeStyle = `rgba(${rnd() < .6 ? "25,10,3" : "255,214,170"},${.05 + rnd() * .09})`; g.lineWidth = .7 + rnd() * 1.8;
    const x0 = rnd() * w, a = 1 + rnd() * amp, per = 1 + (rnd() * 3 | 0), ph = rnd() * TAU;
    g.beginPath(); for (let y = 0; y <= h; y += 8) { const x = x0 + Math.sin(y / h * TAU * per + ph) * a; y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
}
function bevel(g, x, y, w, h, b, hi, lo){   // Profil: hell oben/links, dunkel unten/rechts
  const q = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); };
  q([[x, y], [x + w, y], [x + w - b, y + b], [x + b, y + b]], hi); q([[x, y], [x + b, y + b], [x + b, y + h - b], [x, y + h]], hi);
  q([[x, y + h], [x + b, y + h - b], [x + w - b, y + h - b], [x + w, y + h]], lo); q([[x + w, y], [x + w, y + h], [x + w - b, y + h - b], [x + w - b, y + b]], lo);
}
function flower(g, x, y, r, col, core){
  g.fillStyle = col; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, r * .42, 0, TAU); g.fill(); }
  g.fillStyle = core || "#7c2620"; g.beginPath(); g.arc(x, y, r * .32, 0, TAU); g.fill();
}
function star(g, x, y, r, n, fill){ g.fillStyle = fill; g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU - Math.PI / 2, rr = i % 2 ? r * .62 : r;
  i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
function dia(g, rx, ry, fill, stroke, lw){ g.beginPath(); g.moveTo(0, -ry); g.lineTo(rx, 0); g.lineTo(0, ry); g.lineTo(-rx, 0); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 3; g.stroke(); } }
function fitFont(g, text, maxW, size, min, mk){ let s = size; g.font = mk(s); while (g.measureText(text).width > maxW && s > min) { s -= 2; g.font = mk(s); } return s; }
function screw(g, x, y, r){ const gr = g.createRadialGradient(x - r * .3, y - r * .3, 1, x, y, r); gr.addColorStop(0, "#fff1c8"); gr.addColorStop(1, "#7a5420");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = "rgba(60,35,10,.8)"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - r * .7, y + r * .2); g.lineTo(x + r * .7, y - r * .2); g.stroke(); }
function brassGrad(g, x0, y0, x1, y1){ const gr = g.createLinearGradient(x0, y0, x1, y1);
  [[0, "#8c6427"], [.18, "#e9c47c"], [.36, "#b8893f"], [.55, "#f3d796"], [.75, "#a8782f"], [1, "#d9b064"]].forEach(([s, c]) => gr.addColorStop(s, c)); return gr; }

/* ---------- Gemälde (Atlas 1024², vier Bilder) ---------- */
const CELL = [{x: 0, y: 59, w: 512, h: 394}, {x: 512, y: 59, w: 512, h: 394}, {x: 64, y: 512, w: 384, h: 512}, {x: 512, y: 571, w: 512, h: 394}];
const uvr = c => [c.x / 1024, 1 - (c.y + c.h) / 1024, (c.x + c.w) / 1024, 1 - c.y / 1024];
function compass(g, x, y, r){ g.save(); g.translate(x, y); g.strokeStyle = "#4a3420"; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillStyle = i % 2 ? "#4a3420" : "#a0482c"; g.beginPath(); g.moveTo(0, -r * 1.1); g.lineTo(r * .18, 0); g.lineTo(-r * .18, 0); g.closePath(); g.fill(); }
  g.fillStyle = "#3a2614"; g.font = `700 ${r * .5}px ${FONT}`; g.textAlign = "center"; g.fillText("N", 0, -r * 1.2); g.restore(); }
function pMap(g, w, h){
  const gr = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * .7); gr.addColorStop(0, "#f0e5c8"); gr.addColorStop(1, "#c9b083"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 320; i++) { g.save(); g.translate(rnd() * w, rnd() * h); g.rotate((rnd() - .5) * .5); g.fillStyle = `rgba(150,105,65,${.2 + rnd() * .25})`; g.fillRect(0, 0, 8 + rnd() * 20, 6 + rnd() * 14); g.restore(); }
  g.strokeStyle = "rgba(245,234,210,.95)"; g.lineCap = "round";
  for (let i = 0; i < 30; i++) { g.lineWidth = 2 + rnd() * 4; g.beginPath(); let px = rnd() * w, py = rnd() * h; g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (rnd() - .5) * 220; py += (rnd() - .5) * 150; g.lineTo(px, py); } g.stroke(); }
  for (const [px, py, r] of [[95, 130, 36], [390, 110, 30], [420, 310, 24], [160, 330, 20]]) { g.fillStyle = "rgba(108,138,82,.6)"; g.beginPath(); g.ellipse(px, py, r * 1.35, r, .3, 0, TAU); g.fill(); }
  g.strokeStyle = "#6c8c9e"; g.lineWidth = 30; g.beginPath(); g.moveTo(-10, 250); g.bezierCurveTo(120, 190, 200, 330, 300, 268); g.bezierCurveTo(380, 220, 430, 292, w + 10, 238); g.stroke();
  g.strokeStyle = "#9bb5c2"; g.lineWidth = 20; g.stroke();
  g.strokeStyle = "#5a4430"; g.lineWidth = 4; for (const [x0, y0] of [[110, 205], [255, 285], [400, 248]]) { g.beginPath(); g.moveTo(x0 - 6, y0 - 22); g.lineTo(x0 + 6, y0 + 22); g.stroke(); }
  g.strokeStyle = "#4a3420"; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20); g.lineWidth = 2; g.strokeRect(20, 20, w - 40, h - 40);
  g.fillStyle = "rgba(242,232,206,.94)"; g.fillRect(w / 2 - 150, 30, 300, 64); g.strokeRect(w / 2 - 150, 30, 300, 64);
  g.fillStyle = "#3a2614"; g.textAlign = "center"; g.font = `italic 700 30px ${FONT}`; g.fillText("Stadtplan von London", w / 2, 62); g.font = `20px ${FONT}`; g.fillText("Anno 1888", w / 2, 86);
  compass(g, w - 66, h - 66, 30);
}
function pThames(g, w, h){
  const sky = g.createLinearGradient(0, 0, 0, h * .6); sky.addColorStop(0, "#4b4540"); sky.addColorStop(.6, "#b08a5c"); sky.addColorStop(1, "#e8c48a"); g.fillStyle = sky; g.fillRect(0, 0, w, h * .6);
  const sun = g.createRadialGradient(w * .62, h * .5, 4, w * .62, h * .5, 120); sun.addColorStop(0, "rgba(255,236,190,.95)"); sun.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = sun; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(70,62,64,.55)"; for (let x = 0; x < w; x += 14 + rnd() * 20) { const bh = 20 + rnd() * 60; g.fillRect(x, h * .58 - bh, 12 + rnd() * 18, bh); }
  g.fillStyle = "rgba(60,52,56,.6)"; g.beginPath(); g.arc(w * .25, h * .5, 26, Math.PI, 0); g.fill(); g.fillRect(w * .25 - 4, h * .5 - 56, 8, 30);
  const wat = g.createLinearGradient(0, h * .6, 0, h); wat.addColorStop(0, "#9a7c58"); wat.addColorStop(1, "#2a2a2c"); g.fillStyle = wat; g.fillRect(0, h * .6, w, h * .4);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,${200 + rnd() * 40},150,${rnd() * .3})`; g.fillRect(w * .62 + (rnd() - .5) * 200 * rnd(), h * .62 + rnd() * h * .36, 6 + rnd() * 26, 2); }
  g.fillStyle = "#2c2628"; g.fillRect(0, h * .46, w, 12); for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(30 + i * 92, h * .6, 40, Math.PI, 0); g.lineTo(76 + i * 92, h * .46 + 12); g.lineTo(-16 + i * 92, h * .46 + 12); g.fill(); }
  for (let i = 0; i < 7; i++) { const x = 40 + i * 76, y = h * .43; const l = g.createRadialGradient(x, y, 0, x, y, 16); l.addColorStop(0, "rgba(255,230,160,1)"); l.addColorStop(1, "rgba(255,190,90,0)"); g.fillStyle = l; g.fillRect(x - 16, y - 16, 32, 32); g.fillStyle = "#2c2628"; g.fillRect(x - 1, y, 2, 14); }
  g.fillStyle = "#1e1a1c"; g.beginPath(); g.moveTo(w * .15, h * .8); g.lineTo(w * .32, h * .8); g.lineTo(w * .29, h * .85); g.lineTo(w * .18, h * .85); g.fill(); g.fillRect(w * .23, h * .68, 3, h * .12);
  for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(230,220,205,${.05 + rnd() * .08})`; g.beginPath(); g.ellipse(rnd() * w, h * (.4 + rnd() * .35), 80 + rnd() * 140, 10 + rnd() * 18, 0, 0, TAU); g.fill(); }
  noise(g, w, h, 5000, .15, ["#000", "#fff", "#c08a50"]);
}
function pSilhouette(g, w, h){
  g.fillStyle = "#1f2b28"; g.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, ov = g.createRadialGradient(cx, cy - 30, 20, cx, cy, 230); ov.addColorStop(0, "#f6ecd2"); ov.addColorStop(1, "#d6c39a");
  g.fillStyle = ov; g.beginPath(); g.ellipse(cx, cy, 160, 222, 0, 0, TAU); g.fill(); g.strokeStyle = "#b8893f"; g.lineWidth = 6; g.stroke();
  g.save(); g.translate(cx - 6, cy + 28); g.fillStyle = "#15100c"; g.beginPath();
  g.moveTo(-160, 200); g.bezierCurveTo(-150, 120, -100, 90, -52, 64); g.lineTo(-48, 20); g.bezierCurveTo(-72, 0, -74, -60, -62, -96);
  g.lineTo(-96, -100); g.lineTo(-96, -112); g.lineTo(-62, -114); g.lineTo(-58, -196); g.lineTo(48, -196); g.lineTo(52, -114); g.lineTo(86, -110); g.lineTo(86, -100); g.lineTo(50, -98);
  g.bezierCurveTo(54, -84, 54, -76, 56, -70); g.lineTo(74, -48); g.lineTo(58, -42); g.bezierCurveTo(62, -34, 58, -28, 62, -24); g.bezierCurveTo(56, -18, 60, -12, 56, -8);
  g.bezierCurveTo(56, 4, 48, 10, 36, 12); g.lineTo(34, 40); g.bezierCurveTo(70, 60, 120, 80, 150, 120); g.lineTo(160, 200); g.closePath(); g.fill();
  g.fillStyle = "#f6ecd2"; g.beginPath(); g.moveTo(34, 44); g.lineTo(54, 58); g.lineTo(30, 70); g.closePath(); g.fill(); g.restore();
  noise(g, w, h, 2500, .12, ["#000", "#fff"]);
}
function pLens(g, w, h){
  const gr = g.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, w * .7); gr.addColorStop(0, "#efe2c4"); gr.addColorStop(1, "#cdb486"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#3a2614"; g.lineWidth = 4; g.strokeRect(16, 16, w - 32, h - 32); g.lineWidth = 1.5; g.strokeRect(24, 24, w - 48, h - 48);
  g.fillStyle = "#2e1e10"; g.textAlign = "center"; g.font = `italic 600 22px ${FONT}`; g.fillText("Tafel II.", w / 2, 56); g.font = `600 22px ${FONT}`; g.fillText("Strahlengang an der Sammellinse", w / 2, h - 40);
  const ay = h / 2 + 4, lx = w / 2; g.lineWidth = 1.2; g.beginPath(); g.moveTo(40, ay); g.lineTo(w - 40, ay); g.stroke();
  g.beginPath(); g.moveTo(lx, ay - 110); g.quadraticCurveTo(lx + 34, ay, lx, ay + 110); g.quadraticCurveTo(lx - 34, ay, lx, ay - 110); g.fillStyle = "rgba(160,190,200,.45)"; g.fill(); g.lineWidth = 2; g.stroke();
  for (let y = ay - 100; y < ay + 100; y += 6) { g.lineWidth = .6; g.beginPath(); g.moveTo(lx - 10, y); g.lineTo(lx + 10, y); g.stroke(); }
  const f = 80, ox = lx - 190, oh = 62, ix = lx + 138, ih = 45;
  g.fillStyle = "#3a2614"; g.fillRect(ox - 6, ay - oh, 12, oh); g.fillStyle = "#b8562c"; g.beginPath(); g.ellipse(ox, ay - oh - 10, 6, 11, 0, 0, TAU); g.fill();
  g.fillStyle = "rgba(58,38,20,.8)"; g.fillRect(ix - 5, ay, 10, ih - 8); g.fillStyle = "rgba(184,86,44,.8)"; g.beginPath(); g.ellipse(ix, ay + ih, 5, 8, 0, 0, TAU); g.fill();
  g.strokeStyle = "rgba(58,38,20,.9)"; g.fillStyle = "rgba(58,38,20,.9)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(ox, ay - oh); g.lineTo(lx, ay - oh); g.lineTo(ix + 40, ay + ih + 23);
  g.moveTo(ox, ay - oh); g.lineTo(ix + 40, ay + ih + 13); g.moveTo(ox, ay - oh); g.lineTo(lx, ay + ih); g.lineTo(ix + 40, ay + ih); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.arc(lx + s * f, ay, 3.5, 0, TAU); g.fill(); g.font = `italic 600 18px ${FONT}`; g.fillText("F", lx + s * f, ay + 22); }
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(80,55,30,${rnd() * .12})`; g.fillRect(rnd() * w, rnd() * h, 1, 1 + rnd() * 3); }
}

/* ---------- Prozedurale Texturen ---------- */
const tex = {
  floor: () => U.canvasTex(1024, 1024, (g, w, h) => {
    const n = 10, pw = w / n;
    for (let i = 0; i < n; i++) {
      const cuts = [rnd() * h]; if (rnd() < .7) cuts.push((cuts[0] + h * (.35 + rnd() * .3)) % h); cuts.sort((a, b) => a - b);
      cuts.forEach((y0, k) => { const y1 = k + 1 < cuts.length ? cuts[k + 1] : cuts[0] + h, L = y1 - y0;
        const hue = 22 + rnd() * 6, sat = 32 + rnd() * 9, lit = 20 + rnd() * 6;
        const seg = (ya, yb) => { g.fillStyle = `hsl(${hue},${sat}%,${lit}%)`; g.fillRect(i * pw, ya, pw, yb - ya); };
        seg(y0, Math.min(y1, h)); if (y1 > h) seg(0, y1 - h);
        for (let q = 0; q < 24; q++) { g.strokeStyle = `rgba(${rnd() < .55 ? "15,6,2" : "255,215,170"},${.04 + rnd() * .08})`; g.lineWidth = .8 + rnd() * 1.6;
          const x0 = i * pw + 5 + rnd() * (pw - 10), ph = rnd() * TAU; g.beginPath();
          for (let y = y0; y <= y1; y += 16) { const x = x0 + Math.sin(y / 70 + ph) * 3, yy = y % h; if (y === y0 || yy < 16) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); }
        if (rnd() < .3) { const ky = (y0 + rnd() * L) % h, kx = i * pw + 20 + rnd() * (pw - 40); g.strokeStyle = "rgba(30,12,4,.35)"; g.lineWidth = 2; g.beginPath(); g.ellipse(kx, ky, 5, 12, 0, 0, TAU); g.stroke(); }
        g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(i * pw, y0, pw, 3);
        g.fillStyle = "rgba(20,10,4,.7)"; for (const nx of [i * pw + 10, (i + 1) * pw - 12]) { g.fillRect(nx, (y0 + 8) % h, 3, 3); }
      });
      g.fillStyle = "rgba(0,0,0,.7)"; g.fillRect(i * pw, 0, 3, h); g.fillStyle = "rgba(255,220,180,.06)"; g.fillRect(i * pw + 3, 0, 2, h);
    }
  }, "d-floor", [1, 1]),
  wood: (dark) => U.canvasTex(512, 512, (g, w, h) => grain(g, w, h, dark ? [20, 34, 15] : [15, 44, 29], 120, dark ? 3 : 5), dark ? "d-wood-d" : "d-wood", [1, 1]),
  flutes: () => U.canvasTex(256, 512, (g, w, h) => { grain(g, w, h, [16, 42, 27], 60, 3);
    for (let i = 0; i < 5; i++) { const x = 30 + i * 44, fw = 24, gr = g.createLinearGradient(x, 0, x + fw, 0);
      gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(.5, "rgba(0,0,0,.15)"); gr.addColorStop(1, "rgba(255,220,180,.18)"); g.fillStyle = gr; g.beginPath(); g.roundRect(x, 26, fw, h - 52, 12); g.fill(); }
  }, "d-flutes", [1, 1]),
  wains: () => U.canvasTex(1024, 512, (g, w, h) => {
    grain(g, w, h, [15, 44, 25], 160, 4); const pw = w / 2, st = 48;
    for (let i = 0; i < 2; i++) { const x0 = i * pw + st, x1 = (i + 1) * pw - st, y0 = 58, y1 = h - 82;
      g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      bevel(g, x0, y0, x1 - x0, y1 - y0, 12, "rgba(0,0,0,.45)", "rgba(255,215,170,.16)");
      bevel(g, x0 + 22, y0 + 22, x1 - x0 - 44, y1 - y0 - 44, 26, "rgba(255,215,170,.2)", "rgba(0,0,0,.42)");
      g.fillStyle = "rgba(255,210,160,.05)"; g.fillRect(x0 + 48, y0 + 48, x1 - x0 - 96, y1 - y0 - 96); }
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 0, w, 8); g.fillStyle = "rgba(255,215,170,.12)"; g.fillRect(0, 8, w, 3);
  }, "d-wains", [1, 1]),
  paper: () => U.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#27503f"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { g.fillStyle = `rgba(0,0,0,${x % 16 ? .04 : .08})`; g.fillRect(x, 0, 2, h); }
    for (const [cx, cy] of [[w / 2, h / 2], [0, 0], [w, 0], [0, h], [w, h]]) damask(g, cx, cy);
    noise(g, w, h, 5000, .1, ["#000", "#a8cfb0"]);
  }, "d-tapete", [1, 1]),
  plaster: () => U.canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#ece2cc"; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, .12, ["#b8a888", "#fff"]); }, "d-plaster", [1, 1]),
  ceil: () => U.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#e9dfc9"; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, .08, ["#b5a487", "#fff"]);
    const b = 34; g.fillStyle = "rgba(255,250,235,.55)"; g.fillRect(0, 0, w, b / 2); g.fillRect(0, h - b / 2, w, b / 2); g.fillRect(0, 0, b / 2, h); g.fillRect(w - b / 2, 0, b / 2, h);
    bevel(g, b / 2, b / 2, w - b, h - b, 18, "rgba(90,70,40,.32)", "rgba(255,255,245,.4)");
    bevel(g, b / 2 + 40, b / 2 + 40, w - b - 80, h - b - 80, 10, "rgba(255,255,245,.35)", "rgba(90,70,40,.25)");
    g.save(); g.translate(w / 2, h / 2); g.strokeStyle = "rgba(140,115,75,.35)"; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.beginPath(); g.ellipse(0, -40, 10, 26, 0, 0, TAU); g.stroke(); }
    g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.stroke(); g.restore();
  }, "d-ceil", [1, 1]),
  marble: () => U.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#d8d0c2"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h, r = 30 + rnd() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rnd() < .5 ? "rgba(255,252,240,.35)" : "rgba(160,145,125,.22)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (let v = 0; v < 14; v++) { g.strokeStyle = `rgba(${90 + rnd() * 40},${80 + rnd() * 30},${70 + rnd() * 20},${.2 + rnd() * .3})`; g.lineWidth = .6 + rnd() * 2.4;
      let x = rnd() * w, y = rnd() * h, a = rnd() * TAU; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 40; k++) { a += (rnd() - .5) * .8; x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); } g.stroke(); }
  }, "d-marble", [1, 1]),
  aged: () => U.canvasTex(512, 512, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, w * .15, w / 2, h / 2, w * .75); gr.addColorStop(0, "#f2e8cc"); gr.addColorStop(1, "#d3bd8e"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    noise(g, w, h, 6000, .16, ["#8a6a3a", "#fff6dc"]);
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(150,105,50,${rnd() * .18})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 2 + rnd() * 7, 0, TAU); g.fill(); }
  }, "d-aged"),
  carpet: () => U.canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = "#6c1f1a"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) { g.fillStyle = `rgba(${rnd() < .5 ? "30,0,0" : "150,60,40"},${rnd() * .07})`; g.fillRect(0, y, w, 6); }
    const bw = 84, st = h / 24;
    for (let y = 0, row = 0; y <= h; y += st, row++) for (let x = bw + 10 + (row % 2) * st / 2; x < w - bw - 4; x += st) {   // Herati-Gitter
      g.save(); g.translate(x, y); dia(g, 12, 16, null, "rgba(176,82,52,.75)", 2); g.restore();
      g.fillStyle = row % 2 ? "rgba(214,178,106,.8)" : "rgba(40,52,84,.85)"; for (const [dx, dy] of [[0, -7], [0, 7], [-6, 0], [6, 0]]) { g.beginPath(); g.arc(x + dx, y + dy, 2.6, 0, TAU); g.fill(); } }
    for (const cy of [0, h / 2, h]) { g.save(); g.translate(w / 2, cy); g.scale(.74, .74); medallion(g, 0, 0); g.restore(); }
    for (const x0 of [0, w - bw]) border(g, x0, bw, h);
    for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(0,0,0,${rnd() * .07})`; g.fillRect(x, 0, 1, h); }
    noise(g, w, h, 9000, .08, ["#000", "#fff"]);
  }, "d-carpet", [1, 1]),
  rug: () => U.canvasTex(1024, 720, (g, w, h) => {
    g.fillStyle = "#23474a"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 6) { g.fillStyle = `rgba(${rnd() < .5 ? "0,20,20" : "80,130,120"},${rnd() * .06})`; g.fillRect(0, y, w, 6); }
    const b = 76, st = 40;
    for (let y = b, row = 0; y < h - b; y += st, row++) for (let x = b + 14 + (row % 2) * st / 2; x < w - b - 8; x += st) {
      g.save(); g.translate(x, y); dia(g, 11, 15, null, "rgba(201,163,94,.5)", 2); g.restore(); g.fillStyle = row % 2 ? "rgba(201,163,94,.75)" : "rgba(124,38,32,.8)";
      for (const [dx, dy] of [[0, -6], [0, 6], [-5, 0], [5, 0]]) { g.beginPath(); g.arc(x + dx, y + dy, 2.4, 0, TAU); g.fill(); } }
    g.save(); g.beginPath(); g.rect(b, b, w - 2 * b, h - 2 * b); g.clip();
    for (const [cx, cy] of [[b, b], [w - b, b], [b, h - b], [w - b, h - b]]) { g.fillStyle = "#1d2740"; g.beginPath(); g.arc(cx, cy, 130, 0, TAU); g.fill(); g.strokeStyle = "#c9a35e"; g.lineWidth = 4; g.stroke(); for (const rr2 of [100, 70]) { g.strokeStyle = rr2 > 80 ? "#7c2620" : "#d8c59a"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, rr2, 0, TAU); g.stroke(); }
      for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; flower(g, cx + Math.cos(a) * 115, cy + Math.sin(a) * 115, 5, "#d8c59a", "#7c2620"); } }
    g.restore();
    g.fillStyle = "#6c1f1a"; g.fillRect(0, 0, w, b); g.fillRect(0, h - b, w, b); g.fillRect(0, 0, b, h); g.fillRect(w - b, 0, b, h);
    g.strokeStyle = "#c9a35e"; g.lineWidth = 4; g.strokeRect(b - 8, b - 8, w - 2 * b + 16, h - 2 * b + 16); g.strokeStyle = "#d8c59a"; g.lineWidth = 3; g.strokeRect(9, 9, w - 18, h - 18);
    for (let x = b; x < w - b; x += 56) { flower(g, x, b / 2, 9, "#d8c59a", "#1d2740"); flower(g, x + 28, h - b / 2, 9, "#d8c59a", "#1d2740"); }
    for (let y = b; y < h - b; y += 56) { flower(g, b / 2, y, 9, "#d8c59a", "#1d2740"); flower(g, w - b / 2, y + 28, 9, "#d8c59a", "#1d2740"); }
    g.save(); g.translate(w / 2, h / 2); g.scale(1.25, .88); medallion(g, 0, 0, true); g.restore();
    for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(0,0,0,${rnd() * .06})`; g.fillRect(x, 0, 1, h); }
    noise(g, w, h, 9000, .08, ["#000", "#fff"]);
  }, "d-rug"),
  fringe: () => U.canvasTex(256, 32, (g, w, h) => { g.clearRect(0, 0, w, h);
    for (let x = 1; x < w; x += 4) { g.strokeStyle = rnd() < .5 ? "#efe3c4" : "#d8c7a0"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rnd() - .5) * 3, h * (.75 + rnd() * .25)); g.stroke(); }
    g.fillStyle = "#e8d8b4"; g.fillRect(0, 0, w, 6); }, "d-fringe"),
  spine: () => U.canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = "#d4d4d4"; g.fillRect(0, 0, w, h); noise(g, w, h, 500, .2, ["#000", "#fff"]);
    const sh = g.createLinearGradient(0, 0, w, 0); sh.addColorStop(0, "rgba(0,0,0,.35)"); sh.addColorStop(.35, "rgba(255,255,255,.12)"); sh.addColorStop(1, "rgba(0,0,0,.4)"); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,240,200,.95)"; for (const y of [16, 26, 228, 238]) g.fillRect(0, y, w, 4);
    g.fillStyle = "rgba(0,0,0,.42)"; g.fillRect(8, 58, w - 16, 44); g.fillStyle = "rgba(255,236,190,.85)"; for (const y of [68, 78, 88]) g.fillRect(14, y, w - 28 - (y === 88 ? 10 : 0), 3);
  }, "d-spine"),
  atlas: () => U.canvasTex(1024, 1024, (g) => {
    g.fillStyle = "#2a2118"; g.fillRect(0, 0, 1024, 1024);
    [pMap, pThames, pSilhouette, pLens].forEach((f, i) => { const c = CELL[i]; g.save(); g.beginPath(); g.rect(c.x, c.y, c.w, c.h); g.clip(); g.translate(c.x, c.y); f(g, c.w, c.h); g.restore(); });
  }, "d-atlas"),
  clock: () => U.canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 110, 10, 128, 128, 128); gr.addColorStop(0, "#fbf4e2"); gr.addColorStop(1, "#e2d2ae"); g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
    g.strokeStyle = "#2a1a10"; g.lineWidth = 3; for (const r of [112, 88]) { g.beginPath(); g.arc(128, 128, r, 0, TAU); g.stroke(); }
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r1 = i % 5 ? 105 : 98; g.lineWidth = i % 5 ? 1.5 : 3.5; g.beginPath(); g.moveTo(128 + Math.sin(a) * r1, 128 - Math.cos(a) * r1); g.lineTo(128 + Math.sin(a) * 112, 128 - Math.cos(a) * 112); g.stroke(); }
    g.fillStyle = "#1a120a"; g.font = `700 21px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"].forEach((s, i) => { const a = i / 12 * TAU; g.fillText(s, 128 + Math.sin(a) * 72, 128 - Math.cos(a) * 72); });
  }, "d-clock"),
  fan: () => U.canvasTex(512, 192, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h, 10, w / 2, h, w * .6); gr.addColorStop(0, "#fff3d2"); gr.addColorStop(.45, "#f4c27c"); gr.addColorStop(1, "#c07a3c"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h + 6;
    const ring = (r0, r1, cols) => { const n = cols.length; for (let i = 0; i < n; i++) { g.fillStyle = cols[i]; g.beginPath(); g.arc(cx, cy, r1, Math.PI + i / n * Math.PI, Math.PI + (i + 1) / n * Math.PI); g.arc(cx, cy, r0, Math.PI + (i + 1) / n * Math.PI, Math.PI + i / n * Math.PI, true); g.closePath(); g.fill(); } };
    ring(70, 168, ["rgba(47,93,93,.55)", "rgba(255,220,150,.15)", "rgba(150,40,30,.5)", "rgba(255,220,150,.15)", "rgba(47,93,93,.55)", "rgba(255,220,150,.15)", "rgba(150,40,30,.5)", "rgba(255,220,150,.15)", "rgba(47,93,93,.55)"]);
    g.strokeStyle = "#2a1c10"; g.lineWidth = 6; for (const r of [70, 168]) { g.beginPath(); g.arc(cx, cy, r, Math.PI, TAU); g.stroke(); }
    for (let i = 0; i <= 9; i++) { const a = Math.PI + i / 9 * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16); g.lineTo(cx + Math.cos(a) * 168, cy + Math.sin(a) * 168); g.stroke(); }
    g.lineWidth = 5; for (const x of [80, 432]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.beginPath(); g.moveTo(0, 60); g.lineTo(84, 60); g.moveTo(428, 60); g.lineTo(w, 60); g.stroke();
    g.fillStyle = "#e9b562"; g.beginPath(); g.arc(cx, cy, 16, Math.PI, TAU); g.fill(); g.strokeStyle = "#2a1c10"; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
  }, "d-fan"),
  portal: () => U.canvasTex(256, 384, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5a3c22"); gr.addColorStop(.45, "#e9b871"); gr.addColorStop(.7, "#c9894a"); gr.addColorStop(1, "#4a2c18"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const vx = w / 2, vy = h * .5; g.strokeStyle = "rgba(60,30,10,.35)"; g.lineWidth = 3;
    for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(vx, vy); g.stroke(); }
    g.strokeStyle = "rgba(60,30,10,.25)"; g.strokeRect(vx - 34, vy - 52, 68, 104);
    for (let i = 0; i < 4; i++) { const k = .2 + i * .2, y = vy - (vy - 40) * (1 - k); for (const s of [-1, 1]) { const x = vx + s * (vx - 14) * (1 - k), r = 14 * (1 - k) + 4, l = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
      l.addColorStop(0, "rgba(255,246,210,1)"); l.addColorStop(1, "rgba(255,200,110,0)"); g.fillStyle = l; g.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8); } }
    const c = g.createRadialGradient(vx, vy, 4, vx, vy, h * .55); c.addColorStop(0, "rgba(255,250,232,1)"); c.addColorStop(.3, "rgba(255,226,170,.75)"); c.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = c; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(255,245,225,${.08 + rnd() * .1})`; g.beginPath(); g.ellipse(rnd() * w, h * (.45 + rnd() * .5), 60 + rnd() * 80, 8 + rnd() * 14, 0, 0, TAU); g.fill(); }
  }, "d-portal"),
  flame: () => U.canvasTex(64, 128, (g) => { g.clearRect(0, 0, 64, 128); g.save(); g.translate(32, 128); g.scale(1, 2.1);
    const r = g.createRadialGradient(0, -22, 1, 0, -22, 30); r.addColorStop(0, "rgba(255,250,220,1)"); r.addColorStop(.28, "rgba(255,196,90,.95)"); r.addColorStop(.62, "rgba(235,100,25,.5)"); r.addColorStop(1, "rgba(120,20,0,0)");
    g.fillStyle = r; g.fillRect(-32, -61, 64, 61); g.restore(); }, "d-flame"),
  fog: () => U.canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { const a = rnd() * TAU, d = rnd() * 70, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d * .8, r = 28 + rnd() * 48, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(255,255,255,${.18 + rnd() * .2})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.globalCompositeOperation = "destination-in"; const m = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(.6, "rgba(0,0,0,.7)"); m.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = m; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over"; }, "d-fog"),
  env: () => { const t = U.canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#c2b394"); gr.addColorStop(.3, "#806e54"); gr.addColorStop(.47, "#465444"); gr.addColorStop(.56, "#4f3d2b"); gr.addColorStop(1, "#24170f");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 10; i++) { const x = (i + .5) * w / 10, y = h * .41, r = g.createRadialGradient(x, y, 0, x, y, 20); r.addColorStop(0, "rgba(255,244,210,1)"); r.addColorStop(.4, "rgba(255,205,130,.65)"); r.addColorStop(1, "rgba(255,180,90,0)"); g.fillStyle = r; g.fillRect(x - 20, y - 20, 40, 40); }
      const f = g.createRadialGradient(w * .25, h * .62, 0, w * .25, h * .62, 44); f.addColorStop(0, "rgba(255,160,70,.9)"); f.addColorStop(1, "rgba(255,120,40,0)"); g.fillStyle = f; g.fillRect(0, 0, w, h);
    }, "d-env"); t.mapping = T3.EquirectangularReflectionMapping; return t; },
  num: (n) => U.canvasTex(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256); g.fillStyle = brassGrad(g, 0, 0, 256, 256); g.beginPath(); g.arc(128, 128, 124, 0, TAU); g.fill();
    g.strokeStyle = "rgba(70,45,15,.9)"; g.lineWidth = 4; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillStyle = "rgba(80,50,15,.75)"; g.beginPath(); g.arc(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118, 2.6, 0, TAU); g.fill(); }
    const c = g.createRadialGradient(110, 100, 10, 128, 128, 100); c.addColorStop(0, "#2f5d5d"); c.addColorStop(1, "#142a2a"); g.fillStyle = c; g.beginPath(); g.arc(128, 128, 100, 0, TAU); g.fill();
    g.strokeStyle = "rgba(233,196,124,.7)"; g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 92, 0, TAU); g.stroke();
    g.font = `700 150px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 8; g.strokeStyle = "rgba(20,10,4,.85)"; g.strokeText(String(n), 128, 140);
    g.fillStyle = brassGrad(g, 70, 60, 186, 200); g.fillText(String(n), 128, 140);
  }, "d-num-" + n),
  name: (s) => U.canvasTex(512, 144, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = brassGrad(g, 0, 0, w, h); g.beginPath(); g.roundRect(3, 3, w - 6, h - 6, 22); g.fill();
    const c = g.createLinearGradient(0, 0, 0, h); c.addColorStop(0, "#2a3c38"); c.addColorStop(1, "#18241f"); g.fillStyle = c; g.beginPath(); g.roundRect(14, 14, w - 28, h - 28, 14); g.fill();
    g.strokeStyle = "rgba(233,196,124,.6)"; g.lineWidth = 2; g.beginPath(); g.roundRect(22, 22, w - 44, h - 44, 10); g.stroke();
    const sz = fitFont(g, s, w - 90, 80, 30, z => `700 ${z}px ${FONT}`); g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "rgba(0,0,0,.6)"; g.fillText(s, w / 2 + 2, h / 2 + 5); g.fillStyle = "#F6DDB0"; g.fillText(s, w / 2, h / 2 + 3);
  }, "d-name-" + s)
};
function damask(g, cx, cy){
  g.save(); g.translate(cx, cy); g.fillStyle = "rgba(78,134,104,.6)"; g.strokeStyle = "rgba(205,175,105,.38)"; g.lineWidth = 2;
  const shape = () => { g.beginPath();
    g.moveTo(0, 62); g.bezierCurveTo(32, 56, 74, 30, 76, -8); g.bezierCurveTo(78, -50, 42, -72, 28, -44); g.bezierCurveTo(46, -48, 54, -18, 38, -2); g.bezierCurveTo(24, 12, 8, 10, 0, 2); g.closePath();
    g.moveTo(0, -18); g.bezierCurveTo(16, -46, 22, -86, 0, -120); g.bezierCurveTo(-22, -86, -16, -46, 0, -18);
    g.moveTo(14, -72); g.bezierCurveTo(30, -90, 40, -104, 34, -122); g.bezierCurveTo(20, -108, 14, -92, 14, -72);
    g.moveTo(10, 74); g.bezierCurveTo(28, 82, 40, 98, 34, 118); g.bezierCurveTo(20, 106, 10, 92, 10, 74);
    g.moveTo(0, 30); g.bezierCurveTo(16, 40, 18, 64, 0, 92); g.bezierCurveTo(-18, 64, -16, 40, 0, 30); };
  for (const s of [-1, 1]) { g.save(); g.scale(s, 1); shape(); g.fill(); g.stroke(); g.beginPath(); g.arc(56, -40, 9, 0, TAU); g.arc(62, 40, 6, 0, TAU); g.fill(); g.restore(); }
  g.restore();
}
function medallion(g, cx, cy, ivory){
  g.save(); g.translate(cx, cy);
  dia(g, 150, 240, "#1d2740", "#c9a35e", 5); dia(g, 126, 204, ivory ? "#dccaa0" : "#7c2620", "#d8c59a", 3); dia(g, 96, 156, "#1d2740");
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; flower(g, Math.cos(a) * 66, Math.sin(a) * 104, 7, "#d6b26a", "#1f2b47"); }
  star(g, 0, 0, 62, 8, "#d8c59a"); star(g, 0, 0, 44, 8, "#7c2620"); g.fillStyle = "#d6b26a"; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill();
  for (const s of [-1, 1]) { g.save(); g.translate(0, s * 268); dia(g, 26, 34, "#1f2b47", "#d6b26a", 3); g.restore(); }
  g.restore();
}
function border(g, x0, bw, h){
  g.fillStyle = "#561813"; g.fillRect(x0, 0, bw, h); g.fillStyle = "#1d2740"; g.fillRect(x0 + 13, 0, bw - 26, h);
  g.fillStyle = "#d6b26a"; g.fillRect(x0 + 9, 0, 4, h); g.fillRect(x0 + bw - 13, 0, 4, h); g.fillStyle = "#ead9ae"; g.fillRect(x0 + 2, 0, 3, h); g.fillRect(x0 + bw - 5, 0, 3, h);
  g.strokeStyle = "#c99a4a"; g.lineWidth = 3; g.beginPath(); for (let y = 0; y <= h; y += 32) { const x = x0 + bw / 2 + ((y / 32) % 2 ? 15 : -15); y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  for (let y = 32; y < h; y += 64) flower(g, x0 + bw / 2, y, 10, "#d8c59a", "#7c2620");
  for (let y = 0; y < h; y += 64) flower(g, x0 + bw / 2, y, 7, "#d6b26a", "#1f2b47");
}

/* ---------- Materialien (alle gecacht, userData.keep) ---------- */
const mats = new Map();
function keep(m){ m.userData.keep = true; return m; }
const S = p => keep(new T3.MeshStandardMaterial(p));
const KB = p => keep(new T3.MeshBasicMaterial(p));
function mat(kind, o = {}){
  const key = kind + "|" + JSON.stringify(o); if (mats.has(key)) return mats.get(key);
  let m;
  switch (kind) {
    case "stone": m = S({map: tex.marble(), color: o.color || 0xffffff, roughness: .38}); break;
    case "floor": m = S({map: tex.floor(), roughness: .5}); break;
    case "wood": m = S({map: tex.wood(false), color: o.color || 0xffffff, roughness: .5}); break;
    case "darkwood": m = S({map: tex.wood(true), roughness: .55}); break;
    case "metal": m = S({color: o.color || 0x2f2b28, metalness: .75, roughness: .5}); break;
    case "brass": m = S({color: 0xc49a4c, metalness: .9, roughness: .3}); break;
    case "gold": m = S({color: 0xe0b44a, metalness: 1, roughness: .26}); break;
    case "copper": m = S({color: 0xb8693c, metalness: .95, roughness: .33}); break;
    case "steel": m = S({color: 0xa4a9ae, metalness: .9, roughness: .28}); break;
    case "glass": m = S({color: o.color || 0xe4efe6, transparent: true, opacity: o.opacity ?? .26, roughness: .05, metalness: .1, depthWrite: false}); break;
    case "water": m = S({color: o.color || 0x3f6f7a, transparent: true, opacity: .62, roughness: .08, metalness: .1, depthWrite: false}); break;
    case "glow": m = S({color: o.color || pal.glow, emissive: o.color || pal.glow, emissiveIntensity: o.intensity ?? 2.2, roughness: .4}); break;
    case "crystal": m = S({color: o.color || 0x7fbab2, emissive: o.color || 0x7fbab2, emissiveIntensity: o.intensity ?? .6, transparent: true, opacity: .85, roughness: .08, metalness: .1}); break;
    case "paper": m = S({map: tex.aged(), roughness: .92}); break;
    case "cloth": m = S({color: o.color || "#7B2D26", roughness: 1, side: T3.DoubleSide}); break;
    case "rubber": m = S({color: 0x1a1614, roughness: .9}); break;
    case "plastic": m = S({color: o.color || 0x3a2b1c, roughness: .42}); break;
    default: m = S({color: o.color || 0x888888, roughness: o.rough ?? .6, metalness: o.metal ?? 0});
  }
  mats.set(key, m); return m;
}
const KM = {   // weltinterne Materialien
  wains: () => S({map: tex.wains(), roughness: .5}),
  tapete: () => S({map: tex.paper(), roughness: .82}),
  flutes: () => S({map: tex.flutes(), roughness: .5}),
  stucco: () => S({map: tex.plaster(), roughness: .9}),
  ceil: () => S({map: tex.ceil(), roughness: .95}),
  carpet: () => S({map: tex.carpet(), roughness: 1}),
  rug: () => S({map: tex.rug(), roughness: 1}),
  fringe: () => S({map: tex.fringe(), transparent: true, alphaTest: .35, roughness: 1, side: T3.DoubleSide}),
  globe: () => S({color: 0xfff0d6, emissive: 0xffc982, emissiveIntensity: 1.25, roughness: .35}),
  wglow: () => KB({map: U.glowTex(), color: 0xffb468, transparent: true, opacity: .2, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false}),
  fglow: () => KB({map: U.glowTex(), color: 0xff7a2a, transparent: true, opacity: .35, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false}),
  gilt: () => S({color: 0xc99a45, metalness: .8, roughness: .32}),
  atlas: () => S({map: tex.atlas(), roughness: .55}),
  iron: () => S({color: 0x2a2624, metalness: .6, roughness: .55}),
  soot: () => S({color: 0x140e0b, roughness: 1}),
  logs: () => S({color: 0x3a2214, emissive: 0xff5a1a, emissiveIntensity: .45, roughness: 1}),
  wax: () => S({color: 0xf4ecd8, emissive: 0xffe6b0, emissiveIntensity: .15, roughness: .6}),
  books: () => S({map: tex.spine(), roughness: .66}),
  doorwood: () => S({map: tex.wood(false), vertexColors: true, roughness: .45}),
  vc: () => S({vertexColors: true, roughness: .7}),
  shade: () => S({color: 0x1f7a52, emissive: 0x1d6c48, emissiveIntensity: .85, roughness: .16, metalness: .1, side: T3.DoubleSide}),
  mirror: () => S({color: 0xb7c3bf, metalness: 1, roughness: .07}),
  face: () => S({map: tex.clock(), roughness: .4}),
  flame: () => KB({map: tex.flame(), transparent: true, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false, side: T3.DoubleSide}),
  fog: () => KB({map: tex.fog(), color: 0xd8cab4, transparent: true, opacity: .3, depthWrite: false, side: T3.DoubleSide}),
  haze: () => KB({map: tex.fog(), color: 0xe0d0b8, transparent: true, opacity: .15, depthWrite: false, side: T3.DoubleSide}),
  glassb: () => S({color: 0xe4efe6, transparent: true, opacity: .16, roughness: .05, metalness: .2, depthWrite: false})
};
function kmat(key){ const k = "#" + key; if (!mats.has(k)) mats.set(k, KM[key]()); return mats.get(k); }

/* ---------- Geometrie-Hilfen ---------- */
const _e = new T3.Euler(), _q = new T3.Quaternion(), _p = new T3.Vector3(), _s = new T3.Vector3();
function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1){
  _e.set(rx, ry, rz, "YXZ"); _q.setFromEuler(_e); return new T3.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); }
function merge(parts, withColor){
  let n = 0;
  const gs = parts.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); p.geo.dispose(); const uv = g.attributes.uv;
    if (uv && p.uv) for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * p.uv[0], uv.getY(i) * p.uv[1]);
    if (uv && p.uvr) { const [a, b, c, d] = p.uvr; for (let i = 0; i < uv.count; i++) uv.setXY(i, a + uv.getX(i) * (c - a), b + uv.getY(i) * (d - b)); }
    if (p.m) g.applyMatrix4(p.m); n += g.attributes.position.count; return g; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uvs = new Float32Array(n * 2), col = withColor ? new Float32Array(n * 3) : null, cc = new T3.Color();
  let o = 0;
  gs.forEach((g, i) => { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uvs.set(g.attributes.uv.array, o * 2);
    if (col) { cc.set(parts[i].c ?? 0xffffff); for (let k = 0; k < c; k++) col.set([cc.r, cc.g, cc.b], (o + k) * 3); }
    o += c; g.dispose(); });
  const out = new T3.BufferGeometry(); out.setAttribute("position", new T3.BufferAttribute(pos, 3)); out.setAttribute("normal", new T3.BufferAttribute(nor, 3));
  out.setAttribute("uv", new T3.BufferAttribute(uvs, 2)); if (col) out.setAttribute("color", new T3.BufferAttribute(col, 3)); out.computeBoundingSphere(); return out;
}
function bucket(){   // sammelt Teile je Material und verschmilzt sie zu einem Mesh (wenige Zeichenaufrufe)
  const P = {};
  const K = {
    add(key, geo, m, o){ (P[key] || (P[key] = [])).push(Object.assign({geo, m}, o)); return K; },
    box(key, w, h, d, m, o){ return K.add(key, new T3.BoxGeometry(w, h, d), m, o); },
    geo(key, color){ const p = P[key]; delete P[key]; return p && p.length ? merge(p, color) : null; },
    mesh(key, material, o = {}){ const geo = K.geo(key, o.color); if (!geo) return null; const me = new T3.Mesh(geo, material);
      me.castShadow = !!o.cast; me.receiveShadow = o.receive !== false; if (o.parent) o.parent.add(me); return me; }
  };
  return K;
}
const cache = ctx => ctx._dk || (ctx._dk = {});
function walls(B){   // Wandkoordinaten: u entlang der Wand, y nach oben, d von der Wand in den Raum
  const cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
  const mk = (ox, oz, ry, tx, tz, nx, nz, len) => { const w = {o: [ox, oz], t: [tx, tz], n: [nx, nz], ry, len, side: nx !== 0,
    u: (x, z) => (x - ox) * tx + (z - oz) * tz,
    pos: (u, y, d) => new T3.Vector3(ox + tx * u + nx * d, y, oz + tz * u + nz * d),
    m: (u, y, d, rx = 0, ry2 = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const p = w.pos(u, y, d); return M(p.x, p.y, p.z, 0, ry, 0).multiply(M(0, 0, 0, rx, ry2, rz, sx, sy, sz)); }};
    return w; };
  return {front: mk(cx, B.z1, 0, 1, 0, 0, 1, B.x1 - B.x0), back: mk(cx, B.z0, Math.PI, -1, 0, 0, -1, B.x1 - B.x0),
          left: mk(B.x0, cz, Math.PI / 2, 0, -1, 1, 0, B.z0 - B.z1), right: mk(B.x1, cz, -Math.PI / 2, 0, 1, -1, 0, B.z0 - B.z1)};
}
function segs(len, gaps, ins){ let a = -len / 2 + ins; const out = [], e = len / 2 - ins;
  for (const [g0, g1] of gaps.slice().sort((p, q) => p[0] - q[0])) { if (g0 > a) out.push([a, Math.min(g0, e)]); a = Math.max(a, g1); }
  if (e > a) out.push([a, e]); return out.filter(([p, q]) => q - p > .05); }
function flat(w, h, m, su, sv){ const g = new T3.PlaneGeometry(w, h); if (su) U.scaleUV(g, su, sv); const me = new T3.Mesh(g, m); me.rotation.x = -Math.PI / 2; me.receiveShadow = true; return me; }

/* ---------- Umgebung ---------- */
// o (nur Raumthemen, 17_raum_detektiv.js): Farben, Stärken und Lagen – die Zahl und Art der Lichter bleibt immer gleich
// (1 Himmels-, 1 Grund-, 2 Richtungslichter, davon eines mit Schatten; FogExp2), damit alle Räume dieselben Shader-Programme nutzen
function env(ctx, sc, o = {}){
  const hall = ctx.key === "halle", B = ctx.bounds, cz = (B.z0 + B.z1) / 2;
  sc.background = new T3.Color(o.bg ?? 0x3a322b); sc.fog = new T3.FogExp2(o.nebel ?? 0x3e352d, o.dichte ?? (hall ? .019 : .024));
  sc.environment = o.envTex ? o.envTex() : tex.env();
  const hi = o.himmel || [0xfff0d8, 0x5a3c26, .95], am = o.umgebung || [0xffe2bd, .2], so = o.sonne || [0xffe6c8, 1.35, [5, 14, cz + 6]], fu = o.fuell || [0xffdcb8, .5, [-6, 10, B.z1 - 4]];
  sc.add(new T3.HemisphereLight(hi[0], hi[1], hi[2])); sc.add(new T3.AmbientLight(am[0], am[1]));
  const d = new T3.DirectionalLight(so[0], so[1]); d.position.set(...so[2]); d.target.position.set(0, 0, cz);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const s = d.shadow.camera, hw = Math.max(B.x1 - B.x0, B.z0 - B.z1) / 2 + 2;
  s.left = -hw; s.right = hw; s.top = hw; s.bottom = -hw; s.near = 1; s.far = 40; d.shadow.bias = -0.0004; d.shadow.normalBias = .02; sc.add(d, d.target);
  const f = new T3.DirectionalLight(fu[0], fu[1]); f.position.set(...fu[2]); f.target.position.set(0, 0, cz); sc.add(f, f.target);   // Aufhellung für Rück- und rechte Wand
}

/* ---------- Bauteile der Hülle ---------- */
function pilaster(K, w, u, H){
  K.box("dark", .84, .26, .36, w.m(u, .13, .18)); K.box("wood", .7, 1.74, .3, w.m(u, 1.13, .15)); K.box("dark", .5, 1.3, .03, w.m(u, 1.13, .31));
  K.box("dark", .82, .1, .37, w.m(u, 2.05, .185)); const sh = H - .62 - 2.1; K.box("flutes", .54, sh, .22, w.m(u, 2.1 + sh / 2, .11));
  K.box("stucco", .66, .22, .3, w.m(u, H - .51, .15)); K.box("stucco", .76, .08, .36, w.m(u, H - .36, .18));
  K.box("stucco", .6, .06, .25, w.m(u, H - .65, .125));
}
const LAMP_Y = 2.28;   // Arm (tiefster Punkt 2,16 m) über dem Gesims (2,1 m), Glaskugel endet unter der Tafel-Unterkante (2,75 m)
function gasLamp(K, w, u, lamps){
  K.add("brass", new T3.CylinderGeometry(.075, .075, .03, 16), w.m(u, LAMP_Y, .235, Math.PI / 2));
  K.add("brass", new T3.TubeGeometry(new T3.CatmullRomCurve3([new T3.Vector3(0, 0, .24), new T3.Vector3(0, -.1, .36), new T3.Vector3(0, -.03, .5), new T3.Vector3(0, .1, .56)]), 16, .018, 6), w.m(u, LAMP_Y, 0));
  K.add("brass", new T3.CylinderGeometry(.072, .045, .07, 14), w.m(u, LAMP_Y + .14, .56));
  K.add("brass", new T3.TorusGeometry(.058, .008, 6, 18), w.m(u, LAMP_Y + .47, .56, Math.PI / 2));
  const prof = [[.03, 0], [.08, .02], [.13, .08], [.145, .16], [.13, .25], [.09, .31], [.06, .33]].map(([x, y]) => new T3.Vector2(x, y));
  K.add("globe", new T3.LatheGeometry(prof, 18), w.m(u, LAMP_Y + .17, .56));
  K.add("wglow", new T3.PlaneGeometry(2.3, 2.7), w.m(u, LAMP_Y + .3, .012)); K.add("wglow", new T3.PlaneGeometry(.56, 1.7), w.m(u, LAMP_Y + .2, .224));
  lamps.push(w.pos(u, LAMP_Y + .33, .56));
}
function bookcase(K, books, w, ua, ub, h, r){
  const uA = Math.min(ua, ub), uB = Math.max(ua, ub), W = uB - uA, uc = (uA + uB) / 2, n = Math.max(1, Math.round(W / 1.2)), bw = W / n, D = .42;
  K.box("dark", W + .08, .12, D + .04, w.m(uc, .06, (D + .04) / 2)); K.box("dark", W, h, .02, w.m(uc, h / 2, .01));
  for (let i = 0; i <= n; i++) K.box("dark", .05, h - .12, D, w.m(uA + i * bw, .12 + (h - .12) / 2, D / 2));
  K.box("dark", W + .06, .05, D + .05, w.m(uc, .9, (D + .05) / 2));
  for (let i = 0; i < n; i++) { const u = uA + (i + .5) * bw;
    for (const s of [-1, 1]) { K.add("wains", new T3.PlaneGeometry(bw / 2 - .05, .68), w.m(u + s * bw / 4, .5, D + .003), {uv: [.5, .7]}); K.add("brass", new T3.SphereGeometry(.018, 8, 6), w.m(u + s * .06, .62, D + .02)); } }
  const m = 4, sp = (h - .12 - .92) / m;
  for (let k = 1; k <= m; k++) K.box("dark", W - .02, .03, D - .03, w.m(uc, .925 + k * sp, (D - .03) / 2 + .02));
  K.box("dark", W + .12, .1, D + .1, w.m(uc, h - .02, (D + .1) / 2)); K.box("dark", W + .2, .06, D + .16, w.m(uc, h + .06, (D + .16) / 2));
  for (let k = 0; k < m; k++) { const y0 = .925 + k * sp + .015, hmax = Math.min(.36, sp - .07);
    for (let i = 0; i < n; i++) { let u = uA + i * bw + .045; const ue = uA + (i + 1) * bw - .045;
      while (u < ue - .035) { const q = r();
        if (q < .05) { u += .07 + r() * .14; continue; }
        if (q < .09 && ue - u > .32) { let y = y0; const len = .2 + r() * .08, dep = .19 + r() * .05;
          for (let b = 0, nb = 2 + (r() * 3 | 0); b < nb; b++) { const th = .03 + r() * .03; books.push([w, u + len / 2 + (r() - .5) * .02, y + th / 2, .04 + dep / 2, th, len, dep, Math.PI / 2]); y += th; }
          u += len + .03; continue; }
        const th = .024 + r() * .045, hb = hmax * (.66 + r() * .34), dp = .17 + r() * .08, tilt = r() < .04 ? .16 : 0;
        books.push([w, u + th / 2 + tilt * hb * .5, y0 + hb / 2 - tilt * .01, .04 + dp / 2, th, hb, dp, -tilt]); u += th + .002 + tilt * hb * .9; } } }
}
function painting(K, w, u, y, pw, ph, cell, H){
  K.add("atlas", new T3.PlaneGeometry(pw, ph), w.m(u, y, .052), {uvr: uvr(CELL[cell])});
  const f = .1, d = .08; K.box("gilt", pw + 2 * f, f, d, w.m(u, y + ph / 2 + f / 2, d / 2)); K.box("gilt", pw + 2 * f, f, d, w.m(u, y - ph / 2 - f / 2, d / 2));
  K.box("gilt", f, ph, d, w.m(u - pw / 2 - f / 2, y, d / 2)); K.box("gilt", f, ph, d, w.m(u + pw / 2 + f / 2, y, d / 2));
  K.box("dark", pw + .03, ph + .03, .02, w.m(u, y, .03));
  const yr = H - 1.0, yt = y + ph / 2 + f; for (const s of [-1, 1]) { const x0 = u + s * pw * .32, dx = -s * pw * .32, dy = yr - yt, L = Math.hypot(dx, dy);
    K.box("brass", .01, L, .01, w.m(x0 + dx / 2, yt + dy / 2, .03, 0, 0, Math.atan2(-dx, dy))); }
  K.add("brass", new T3.SphereGeometry(.03, 8, 6), w.m(u, yr, .04));
}
function wallClock(ctx, K, w, u){
  const y0 = 2.06;
  K.box("wood", .5, 1.3, .02, w.m(u, y0 + .65, .01)); for (const s of [-1, 1]) K.box("wood", .045, 1.3, .16, w.m(u + s * .228, y0 + .65, .08));
  K.box("wood", .5, .5, .16, w.m(u, y0 + 1.05, .08)); K.box("wood", .5, .06, .16, w.m(u, y0 + .03, .08));
  K.box("dark", .6, .07, .2, w.m(u, y0 + 1.335, .1)); K.box("dark", .4, .12, .17, w.m(u, y0 + 1.43, .085)); K.box("dark", .46, .08, .18, w.m(u, y0 - .02, .09)); K.box("dark", .16, .12, .1, w.m(u, y0 - .12, .05));
  K.add("brass", new T3.TorusGeometry(.19, .015, 8, 32), w.m(u, y0 + 1.05, .162)); K.add("face", new T3.CircleGeometry(.185, 32), w.m(u, y0 + 1.05, .161));
  K.add("glassb", new T3.PlaneGeometry(.41, .72), w.m(u, y0 + .43, .158)); K.box("dark", .46, .03, .02, w.m(u, y0 + .8, .16));
  const pg = new T3.Group(); pg.applyMatrix4(w.m(u, y0 + .78, .09)); ctx.group.add(pg);
  const rod = new T3.Mesh(new T3.BoxGeometry(.012, .5, .006), mat("brass")); rod.position.y = -.25;
  const bob = new T3.Mesh(new T3.CylinderGeometry(.07, .07, .016, 24), mat("brass")); bob.rotation.x = Math.PI / 2; bob.position.y = -.52; pg.add(rod, bob);
  const hg = new T3.Group(); hg.applyMatrix4(w.m(u, y0 + 1.05, .166)); ctx.group.add(hg);
  const hm = mat("color", {color: "#1a120a", rough: .4}), hh = new T3.Mesh(new T3.BoxGeometry(.016, .1, .004).translate(0, .04, 0), hm), mh = new T3.Mesh(new T3.BoxGeometry(.01, .15, .004).translate(0, .06, .004), hm); hg.add(hh, mh);
  ctx.tick((dt, t) => { pg.rotation.z = Math.sin(t * Math.PI / .9) * .1; const d = new Date(), mi = d.getMinutes() + d.getSeconds() / 60, ho = d.getHours() % 12 + mi / 60;
    mh.rotation.z = -mi / 60 * TAU; hh.rotation.z = -ho / 12 * TAU; });
}
function coatStand(ctx, K, w, u){
  const at = (x, y, d, rx, ry, rz) => w.m(u + x, y, .42 + d, rx, ry, rz);
  K.add("dark", new T3.CylinderGeometry(.028, .034, 1.86, 10), at(0, .95, 0)); K.add("dark", new T3.SphereGeometry(.05, 12, 8), at(0, 1.9, 0));
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; K.add("dark", new T3.BoxGeometry(.42, .04, .05), at(Math.cos(a) * .16, .05, Math.sin(a) * .16, 0, -a, 0)); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .3; K.add("brass", new T3.CylinderGeometry(.008, .008, .16, 6), at(Math.cos(a) * .07, 1.74, Math.sin(a) * .07, 0, -a, Math.PI / 2 - .5)); }
  K.add("vc", new T3.CylinderGeometry(.11, .1, .1, 20), at(.02, 1.98, .02), {c: "#1c1816"}); K.add("vc", new T3.SphereGeometry(.105, 16, 8, 0, TAU, 0, Math.PI / 2), at(.02, 2.02, .02), {c: "#1c1816"});
  K.add("vc", new T3.CylinderGeometry(.17, .17, .012, 24), at(.02, 1.93, .02), {c: "#24201c"}); K.add("vc", new T3.CylinderGeometry(.107, .107, .025, 20), at(.02, 1.95, .02), {c: "#6e2a22"});
  K.add("vc", new T3.CylinderGeometry(.13, .27, 1.05, 14, 1, true), at(.09, 1.2, .06, .08, 0, -.1), {c: "#7a6248"}); K.add("vc", new T3.SphereGeometry(.13, 12, 8, 0, TAU, 0, Math.PI / 2), at(.08, 1.72, .05), {c: "#7a6248"});
  K.add("vc", new T3.BoxGeometry(.06, .5, .03), at(-.05, 1.45, .14, .1, 0, .2), {c: "#7b2d26"});
  K.add("vc", new T3.CylinderGeometry(.012, .012, .9, 8), at(-.2, .46, .12, .12, 0, .18), {c: "#1c1816"}); K.add("vc", new T3.ConeGeometry(.06, .5, 10), at(-.21, .55, .13, .12, 0, .18), {c: "#1c1816"});
  K.add("brass", new T3.TorusGeometry(.04, .008, 6, 14, Math.PI), at(-.29, .93, .17, 0, 0, .18));
  const p = w.pos(u, 0, .45); ctx.obstacle(p.x, p.z, .35);
}
function fireplace(ctx, K, w, u, Sc){
  const G = ctx.group, bx = (key, bw, bh, bd, x, y, d, rx, ry, rz) => K.box(key, bw * Sc, bh * Sc, bd * Sc, w.m(u + x * Sc, y * Sc, d * Sc, rx, ry, rz));
  bx("marble", 2.7, .06, .95, 0, .03, .475);
  for (const s of [-1, 1]) { bx("marble", .5, 1.02, .4, s * .9, .57, .2); bx("marble", .58, .08, .44, s * .9, .1, .22); bx("marble", .4, .06, .42, s * .9, 1.06, .21); }
  bx("marble", 2.3, .34, .4, 0, 1.25, .2); bx("marble", 2.5, .045, .48, 0, 1.44, .24); bx("marble", 2.66, .06, .54, 0, 1.49, .27); bx("marble", .3, .22, .06, 0, 1.25, .42);
  bx("soot", 1.32, 1.08, .04, 0, .6, .03); bx("soot", 1.32, .05, .4, 0, 1.1, .2); for (const s of [-1, 1]) bx("soot", .04, 1.08, .4, s * .64, .6, .2);
  bx("iron", 1.36, .07, .06, 0, 1.06, .41); for (const s of [-1, 1]) bx("iron", .07, 1.0, .06, s * .66, .56, .41);
  bx("iron", .86, .03, .34, 0, .16, .24); for (const y of [.2, .28, .36]) bx("iron", .86, .022, .022, 0, y, .4); for (const s of [-1, 1]) bx("iron", .03, .16, .03, s * .4, .08, .38);
  for (const [x, y, d, ry] of [[-.06, .25, .2, .2], [.09, .25, .27, -.25], [0, .35, .23, .05]]) K.add("logs", new T3.CylinderGeometry(.065 * Sc, .072 * Sc, .62 * Sc, 10), w.m(u + x * Sc, y * Sc, d * Sc, 0, ry, Math.PI / 2));
  bx("brass", 2.1, .05, .04, 0, .1, .9); for (const s of [-1, 1]) bx("brass", .04, .05, .5, s * 1.05, .1, .67);
  bx("iron", .03, .78, .03, 1.5, .41, .3); K.add("iron", new T3.CylinderGeometry(.12 * Sc, .14 * Sc, .03 * Sc, 16), w.m(u + 1.5 * Sc, .015 * Sc, .3 * Sc));
  for (const [x, rz] of [[1.44, .12], [1.56, -.1]]) bx("iron", .022, .72, .022, x, .42, .32, 0, 0, rz);
  K.add("brass", new T3.SphereGeometry(.03 * Sc, 10, 8), w.m(u + 1.5 * Sc, .82 * Sc, .3 * Sc));
  // Kaminsims: Uhr, Leuchter, Spiegel
  bx("dark", .36, .3, .15, 0, 1.67, .28); bx("dark", .42, .04, .18, 0, 1.54, .28); K.add("face", new T3.CircleGeometry(.1 * Sc, 24), w.m(u, 1.69 * Sc, .356 * Sc));
  const flames = [];
  for (const s of [-1, 1]) { K.add("brass", new T3.CylinderGeometry(.04 * Sc, .07 * Sc, .03 * Sc, 14), w.m(u + s * .9 * Sc, 1.535 * Sc, .3 * Sc));
    K.add("brass", new T3.CylinderGeometry(.016 * Sc, .026 * Sc, .26 * Sc, 10), w.m(u + s * .9 * Sc, 1.67 * Sc, .3 * Sc));
    K.add("wax", new T3.CylinderGeometry(.018 * Sc, .018 * Sc, .18 * Sc, 10), w.m(u + s * .9 * Sc, 1.89 * Sc, .3 * Sc)); flames.push(w.pos(u + s * .9 * Sc, 2.01 * Sc, .3 * Sc)); }
  bx("mirror", 1.5, 1.2, .02, 0, 2.42, .035);
  bx("gilt", 1.74, .12, .08, 0, 3.08, .04); bx("gilt", 1.74, .12, .08, 0, 1.76, .04); for (const s of [-1, 1]) bx("gilt", .12, 1.2, .08, s * .81, 2.42, .04);
  bx("gilt", .5, .16, .09, 0, 3.17, .045);
  K.add("fglow", new T3.PlaneGeometry(2.9 * Sc, 2.3 * Sc), w.m(u, .025, 1.25 * Sc, -Math.PI / 2));
  // Feuer
  const fg = new T3.Group(); fg.applyMatrix4(w.m(u, 0, 0)); fg.scale.setScalar(Sc); G.add(fg);
  const NF = 8, fl = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1).translate(0, .5, 0), kmat("flame"), NF); fl.frustumCulled = false; fl.castShadow = false; fg.add(fl);
  const F = [...Array(NF)].map((_, i) => ({x: (i / (NF - 1) - .5) * .56, d: .2 + (i % 3) * .05, h: .32 + Math.random() * .2, w: .2 + Math.random() * .1, p: Math.random() * 10}));
  const EN = 40, ep = new Float32Array(EN * 3), ev = []; for (let i = 0; i < EN; i++) { ev.push({x: (Math.random() - .5) * .5, y: .3 + Math.random() * .7, d: .2 + Math.random() * .15, v: .25 + Math.random() * .35, p: Math.random() * 10}); }
  const eg = new T3.BufferGeometry(); eg.setAttribute("position", new T3.BufferAttribute(ep, 3));
  const emb = new T3.Points(eg, new T3.PointsMaterial({map: U.glowTex(), color: 0xffa040, size: .06, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})); emb.frustumCulled = false; fg.add(emb);
  const big = ctx.glow(0xff8a3a, 1.9); big.position.set(0, .55, .45); fg.add(big);
  const cf = flames.map(p => { const s = ctx.glow(0xffc070, .32 * Sc); s.position.copy(p); G.add(s); return s; });
  const L = new T3.PointLight(0xff8a3c, 5, 9 * Sc, 2); L.position.copy(w.pos(u, .75 * Sc, 1.05 * Sc)); G.add(L);
  const m4 = new T3.Matrix4(), q0 = new T3.Quaternion(), v = new T3.Vector3(), sv = new T3.Vector3();
  ctx.tick((dt, t) => {
    const f = .78 + .14 * Math.sin(t * 11.3) * Math.sin(t * 6.1 + 1) + .08 * Math.sin(t * 23.7);
    F.forEach((o, i) => { const k = .75 + .3 * Math.sin(t * (7 + i) + o.p) * Math.sin(t * 3.3 + o.p * 2); m4.compose(v.set(o.x + Math.sin(t * 5 + o.p) * .02, .27, o.d), q0, sv.set(o.w * (.9 + .15 * k), o.h * k, 1)); fl.setMatrixAt(i, m4); });
    fl.instanceMatrix.needsUpdate = true;
    ev.forEach((e, i) => { e.y += e.v * dt; if (e.y > 1.05) { e.y = .3; e.x = (Math.random() - .5) * .5; } ep[i * 3] = e.x + Math.sin(t * 3 + e.p) * .03; ep[i * 3 + 1] = e.y; ep[i * 3 + 2] = e.d; });
    eg.attributes.position.needsUpdate = true;
    L.intensity = 5 * f; big.material.opacity = .55 + .35 * f; big.scale.setScalar(1.7 + .4 * f); kmat("fglow").opacity = .26 + .14 * f;
    cf.forEach((s, i) => { s.material.opacity = .8 + .2 * Math.sin(t * 15 + i * 2); });
  });
  const p = w.pos(u, 0, .5 * Sc); ctx.obstacleBox(p.x, p.z, w.side ? 1.0 * Sc : 2.8 * Sc, w.side ? 2.8 * Sc : 1.0 * Sc);
}

/* ---------- Raumhülle ---------- */
function shell(ctx, {hall}){
  const B = ctx.bounds, Wd = B.x1 - B.x0, D = B.z0 - B.z1, H = hall ? 7.2 : 6.5, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, G = ctx.group;
  const K = bucket(), WL = walls(B), r = U.seeded(hall ? 31 : 17), C = cache(ctx), lamps = C.lamps = [], books = [];
  ctx.decorZ = hall ? [10, 2.5, -4.5, -11.5, -17] : [9, 4.5, 0, -4.5, -9];
  const doorsAt = hall ? [[0, B.z1], ...[6, -1, -8, -15].flatMap(z => [[B.x0, z], [B.x1, z]])] : [[0, B.z0], [0, B.z1]];
  const gapsOf = w => doorsAt.filter(([x, z]) => w.side ? Math.abs(x - w.o[0]) < .01 : Math.abs(z - w.o[1]) < .01).map(([x, z]) => { const u = w.u(x, z); return [u - 1.62, u + 1.62]; });
  // Boden, Läufer, Teppich
  const floor = flat(Wd, D, mat("floor"), Wd / 1.6, D / 1.6); floor.position.set(cx, 0, cz); G.add(floor); ctx.floor = floor;
  const RL = D - 2.4, run = flat(2.3, RL, kmat("carpet"), 1, Math.round(RL / 3.6)); run.position.set(0, .012, cz); G.add(run);
  for (const s of [-1, 1]) K.add("fringe", new T3.PlaneGeometry(2.24, .13), M(0, .014, cz + s * (RL / 2 + .06), -Math.PI / 2, s < 0 ? Math.PI : 0, 0));
  K.mesh("fringe", kmat("fringe"), {parent: G});
  if (hall) { const rug = flat(6.6, 4.64, kmat("rug")); rug.position.set(0, .018, -3.5); G.add(rug); }
  // Decke
  const nx = Math.max(1, Math.round(Wd / 2.7)), nz = Math.max(1, Math.round(D / 2.75));
  const ceil = new T3.Mesh(U.scaleUV(new T3.PlaneGeometry(Wd, D), nx, nz), kmat("ceil")); ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, H, cz); G.add(ceil);
  for (let i = 1; i < nz; i++) K.box("beam", Wd, .2, .26, M(cx, H - .1, B.z1 + i * D / nz));
  // Wände: Vertäfelung, Tapete, Leisten, Stuckgesims
  for (const w of Object.values(WL)) {
    K.add("wains", new T3.PlaneGeometry(w.len, 2.0), w.m(0, 1.0, 0), {uv: [w.len / 2.2, 1]});
    K.add("tapete", new T3.PlaneGeometry(w.len, H - 2.0), w.m(0, 2.0 + (H - 2.0) / 2, 0), {uv: [w.len / .95, (H - 2.0) / .95]});
    const gaps = gapsOf(w);
    for (const [hh, dd, y] of [[.22, .045, .11], [.075, .065, 2.0], [.03, .04, 1.945], [.045, .04, H - 1.0]])
      for (const [a, b] of segs(w.len, gaps, w.side ? .07 : 0)) K.box("dark", b - a, hh, dd, w.m((a + b) / 2, y, dd / 2));
    const L2 = w.len - (w.side ? .42 : 0);
    K.box("stucco", L2, .26, .1, w.m(0, H - .13, .05)); K.box("stucco", L2, .09, .2, w.m(0, H - .045, .1)); K.box("stucco", L2, .06, .05, w.m(0, H - .3, .025));
    K.box("stucco", L2, .04, .14, w.m(0, H - .2, .07));
  }
  // Pilaster mit Gaslampen
  for (const w of [WL.left, WL.right]) for (const z of ctx.decorZ) { const u = w.u(w.o[0], z); pilaster(K, w, u, H); gasLamp(K, w, u, lamps);
    const p = w.pos(u, 0, .19); ctx.obstacleBox(p.x, p.z, .4, .86); }
  // Vorderwand: Regale, Bilder, Pendeluhr
  const bxr = hall ? 8.4 : 7.5, bh = hall ? 3.8 : 3.4, F = WL.front, Bk = WL.back, py = bh + .42 + .69;
  bookcase(K, books, F, F.u(-bxr, 0), F.u(-2.3, 0), bh, r); bookcase(K, books, F, F.u(3.05, 0), F.u(bxr, 0), bh, r);
  painting(K, F, F.u(-(bxr + 2.3) / 2, 0), py, 1.8, 1.38, 0, H); painting(K, F, F.u((bxr + 3.05) / 2, 0), py, 1.8, 1.38, 1, H);
  wallClock(ctx, K, F, F.u(2.5, 0));
  for (const [a, b] of [[-bxr, -2.3], [3.05, bxr]]) ctx.obstacleBox((a + b) / 2, B.z1 + .23, b - a, .46);
  // Rückwand: Kamin, Regale, Bilder
  if (hall) {
    fireplace(ctx, K, Bk, Bk.u(0, 0), 1.25); painting(K, Bk, Bk.u(0, 0), 5.35, .95, 1.27, 2, H);
    bookcase(K, books, Bk, Bk.u(-bxr, 0), Bk.u(-2.4, 0), bh, r); bookcase(K, books, Bk, Bk.u(2.4, 0), Bk.u(bxr, 0), bh, r);
    painting(K, Bk, Bk.u(-(bxr + 2.4) / 2, 0), py, 1.8, 1.38, 3, H); painting(K, Bk, Bk.u((bxr + 2.4) / 2, 0), py, 1.8, 1.38, 1, H);
    for (const [a, b] of [[-bxr, -2.4], [2.4, bxr]]) ctx.obstacleBox((a + b) / 2, B.z0 - .23, b - a, .46);
    K.add("stucco", new T3.CylinderGeometry(.62, .7, .05, 40), M(0, H - .025, -3.5)); K.add("stucco", new T3.TorusGeometry(.5, .04, 8, 40), M(0, H - .05, -3.5, Math.PI / 2));
    K.add("brass", new T3.CylinderGeometry(.06, .1, .2, 16), M(0, H - .14, -3.5));
  } else {
    fireplace(ctx, K, Bk, Bk.u(4.7, 0), 1); painting(K, Bk, Bk.u(4.7, 0), 4.35, .82, 1.1, 2, H);
    bookcase(K, books, Bk, Bk.u(-bxr, 0), Bk.u(-2.3, 0), bh, r); bookcase(K, books, Bk, Bk.u(6.25, 0), Bk.u(bxr, 0), bh, r);
    painting(K, Bk, Bk.u(-(bxr + 2.3) / 2, 0), py, 1.8, 1.38, 3, H); painting(K, Bk, Bk.u(2.45, 0), 3.35, 1.0, .77, 0, H); coatStand(ctx, K, Bk, Bk.u(2.5, 0));
    ctx.obstacleBox(-(bxr + 2.3) / 2, B.z0 - .23, bxr - 2.3, .46); ctx.obstacleBox((bxr + 6.25) / 2, B.z0 - .23, bxr - 6.25, .46);
  }
  // Meshes bauen
  K.mesh("wains", kmat("wains"), {parent: G}); K.mesh("tapete", kmat("tapete"), {parent: G});
  K.mesh("dark", mat("darkwood"), {parent: G, cast: true}); K.mesh("beam", mat("darkwood"), {parent: G}); K.mesh("wood", mat("wood"), {parent: G, cast: true}); K.mesh("flutes", kmat("flutes"), {parent: G, cast: true});
  K.mesh("stucco", kmat("stucco"), {parent: G}); K.mesh("brass", mat("brass"), {parent: G}); K.mesh("globe", kmat("globe"), {parent: G});
  K.mesh("gilt", kmat("gilt"), {parent: G}); K.mesh("atlas", kmat("atlas"), {parent: G}); K.mesh("marble", mat("stone"), {parent: G, cast: true});
  K.mesh("iron", kmat("iron"), {parent: G}); K.mesh("soot", kmat("soot"), {parent: G}); K.mesh("logs", kmat("logs"), {parent: G}); K.mesh("wax", kmat("wax"), {parent: G});
  K.mesh("mirror", kmat("mirror"), {parent: G}); K.mesh("vc", kmat("vc"), {parent: G, cast: true, color: true}); K.mesh("face", kmat("face"), {parent: G}); K.mesh("glassb", kmat("glassb"), {parent: G});
  const wg = K.mesh("wglow", kmat("wglow"), {parent: G, receive: false}), fgl = K.mesh("fglow", kmat("fglow"), {parent: G, receive: false});
  if (wg) wg.renderOrder = 2; if (fgl) fgl.renderOrder = 2;
  // Bücher (InstancedMesh)
  const bi = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), kmat("books"), books.length), cols = ["#6e2a22", "#7b2d26", "#2f5d5d", "#24402f", "#1f2b47", "#5a3a22", "#8a5a2b", "#2a2118", "#4a1f2a", "#3b5b4a", "#b08850", "#5c4a3a"];
  const bc = new T3.Color();
  books.forEach(([w, u, y, d, sx, sy, sz, rz], i) => { bi.setMatrixAt(i, w.m(u, y, d, 0, 0, rz, sx, sy, sz)); bi.setColorAt(i, bc.set(cols[(r() * cols.length) | 0]).multiplyScalar(.8 + r() * .4)); });
  bi.receiveShadow = true; G.add(bi);
  // Gaslicht: zwei flackernde Punktlichter + Lichthöfe
  const pick = hall ? [[WL.left, 2.5], [WL.right, -11.5]] : [[WL.left, 4.5], [WL.right, -4.5]];
  const PL = pick.map(([w, z]) => { const l = new T3.PointLight(0xffc27a, 6, 12, 2); l.position.copy(w.pos(w.u(w.o[0], z), 3.0, .85)); G.add(l); return l; });
  const hp = new Float32Array(lamps.length * 3), hc = new Float32Array(lamps.length * 3); lamps.forEach((p, i) => hp.set([p.x, p.y, p.z], i * 3));
  const hg = new T3.BufferGeometry(); hg.setAttribute("position", new T3.BufferAttribute(hp, 3)); hg.setAttribute("color", new T3.BufferAttribute(hc, 3));
  const halos = new T3.Points(hg, new T3.PointsMaterial({map: U.glowTex(), size: .75, vertexColors: true, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}));
  halos.renderOrder = 3; G.add(halos);
  const ph = lamps.map(() => Math.random() * 10), base = new T3.Color(0xffc98a);
  ctx.tick((dt, t) => {
    lamps.forEach((p, i) => { const f = .9 + .06 * Math.sin(t * 9.3 + ph[i]) * Math.sin(t * 4.1 + ph[i] * 2) + .04 * Math.sin(t * 23 + ph[i]); hc.set([base.r * f, base.g * f, base.b * f], i * 3); });
    hg.attributes.color.needsUpdate = true;
    PL.forEach((l, i) => { l.intensity = 6 * (.9 + .07 * Math.sin(t * 8.7 + i * 3) * Math.sin(t * 3.9 + i) + .03 * Math.sin(t * 27 + i)); });
    kmat("globe").emissiveIntensity = 1.2 + .1 * Math.sin(t * 7.1) * Math.sin(t * 3.3); kmat("wglow").opacity = .19 + .025 * Math.sin(t * 6.3) * Math.sin(t * 2.9);
  });
  return H;
}

/* ---------- Tür: kassettierte Doppeltür mit Oberlicht und Messingschild ---------- */
function doorGeo(C){
  if (C.door) return C.door;
  const F = bucket();
  for (const s of [-1, 1]) { F.box("f", .26, 4.45, .12, M(s * 1.38, 2.225, .06)); F.box("f", .32, .3, .16, M(s * 1.38, .15, .08)); F.box("f", .3, .1, .15, M(s * 1.38, 3.47, .075));
    F.box("f", .05, 3.42, .3, M(s * 1.27, 1.71, -.12)); F.box("f", .36, .2, .19, M(s * 1.42, 4.52, .095)); }
  F.box("f", 2.5, .1, .1, M(0, 3.47, .05)); F.box("f", 2.54, .06, .3, M(0, 3.43, -.12)); F.box("f", 3.12, .2, .15, M(0, 4.52, .075));
  F.box("f", 3.42, .08, .27, M(0, 4.665, .135)); F.box("f", 3.32, .05, .2, M(0, 4.6, .1)); F.box("f", 2.86, .9, .05, M(0, 5.15, .025));
  const St = bucket(); St.box("s", .34, .26, .08, M(0, 4.5, .16)); for (let i = 0; i < 15; i++) St.box("s", .08, .07, .06, M(-1.6 + i * (3.2 / 14), 4.585, .25));
  const Lf = bucket(); Lf.box("l", 1.22, 3.38, .07, M(0, 1.69, 0), {c: "#ffffff"});
  for (const [y0, y1] of [[.22, 1.38], [1.52, 1.86], [2.0, 3.18]]) { const hh = y1 - y0, yc = (y0 + y1) / 2;
    Lf.box("l", .92, hh + .1, .012, M(0, yc, .036), {c: "#5e4e44"}); Lf.box("l", .86, hh + .04, .02, M(0, yc, .042), {c: "#cdbcaa"}); Lf.box("l", .74, hh - .08, .028, M(0, yc, .047), {c: "#ffffff"}); }
  const brass = {};
  for (const s of [-1, 1]) { const Bz = bucket();
    Bz.box("b", 1.08, .2, .006, M(0, .16, .038)); Bz.box("b", .075, .3, .01, M(-s * .49, 1.58, .04));
    Bz.add("b", new T3.SphereGeometry(.042, 14, 10), M(-s * .49, 1.63, .088)); Bz.add("b", new T3.CylinderGeometry(.012, .012, .05, 8), M(-s * .49, 1.63, .058, Math.PI / 2));
    Bz.add("b", new T3.CylinderGeometry(.008, .008, .02, 6), M(-s * .49, 1.5, .045, Math.PI / 2));
    for (const y of [.45, 1.7, 2.95]) Bz.add("b", new T3.CylinderGeometry(.022, .022, .16, 10), M(s * .615, y, .03));
    brass[s] = Bz.geo("b"); }
  return (C.door = {frame: F.geo("f"), stucco: St.geo("s"), leaf: Lf.geo("l", true), brass});
}
function plaque(label, sub){
  const cw = 1024, ch = 300, c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d");
  g.fillStyle = brassGrad(g, 0, 0, cw, ch * 1.6); g.beginPath(); g.roundRect(6, 6, cw - 12, ch - 12, 30); g.fill();
  g.save(); g.clip(); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${rnd() < .5 ? "255,240,200" : "90,60,20"},${rnd() * .07})`; g.fillRect(0, rnd() * ch, cw, 1); } g.restore();
  g.strokeStyle = "rgba(70,45,15,.85)"; g.lineWidth = 5; g.beginPath(); g.roundRect(26, 26, cw - 52, ch - 52, 18); g.stroke();
  g.strokeStyle = "rgba(255,238,190,.6)"; g.lineWidth = 2; g.beginPath(); g.roundRect(33, 33, cw - 66, ch - 66, 13); g.stroke();
  for (const [x, y] of [[54, 54], [cw - 54, 54], [54, ch - 54], [cw - 54, ch - 54]]) screw(g, x, y, 12);
  const L = U.plainT(label || ""), Sb = U.plainT(sub || ""), maxW = cw - 190;
  g.textAlign = "center"; g.textBaseline = "middle";
  const eng = (s, x, y) => { g.fillStyle = "rgba(255,244,210,.65)"; g.fillText(s, x + 1.5, y + 2.5); g.fillStyle = "#2a1606"; g.fillText(s, x, y); };
  let sz = fitFont(g, L, maxW, 106, 64, z => `700 ${z}px ${FONT}`), lines = [L];
  if (g.measureText(L).width > maxW) { sz = 66; g.font = `700 ${sz}px ${FONT}`; lines = U.wrapText(g, L, maxW).slice(0, 2); }
  const y0 = Sb ? (lines.length > 1 ? ch * .3 : ch * .4) : ch * (lines.length > 1 ? .38 : .52);
  lines.forEach((l, i) => eng(l, cw / 2, y0 + i * sz * 1.02));
  if (Sb) { fitFont(g, Sb, maxW, 46, 26, z => `italic 600 ${z}px ${FONT}`); eng(Sb, cw / 2, lines.length > 1 ? ch * .8 : ch * .74); }
  if (Sb) { g.strokeStyle = "rgba(60,35,10,.55)"; g.lineWidth = 2; const yy = lines.length > 1 ? ch * .68 : ch * .6; g.beginPath(); g.moveTo(cw * .3, yy); g.lineTo(cw * .7, yy); g.stroke(); }
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8;
  return new T3.Mesh(new T3.PlaneGeometry(2.7, .79), new T3.MeshStandardMaterial({map: t, metalness: .35, roughness: .38, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .3, transparent: true}));
}
function door(ctx, {label, sub}){
  const C = cache(ctx), D = doorGeo(C), g = new T3.Group();
  const fr = new T3.Mesh(D.frame, mat("darkwood")); fr.castShadow = true; fr.receiveShadow = true; g.add(fr);
  const st = new T3.Mesh(D.stucco, kmat("stucco")); st.receiveShadow = true; g.add(st);
  const portalM = new T3.MeshBasicMaterial({map: tex.portal(), transparent: true, depthWrite: false, toneMapped: false, color: new T3.Color(.75, .75, .75)});
  const portal = new T3.Mesh(new T3.PlaneGeometry(2.5, 3.4), portalM); portal.position.set(0, 1.7, .02); g.add(portal);
  const traM = new T3.MeshBasicMaterial({map: tex.fan(), toneMapped: false, color: new T3.Color(.8, .8, .8)});
  const tra = new T3.Mesh(new T3.PlaneGeometry(2.5, .9), traM); tra.position.set(0, 3.97, .015); g.add(tra);
  const glow = ctx.glow(new T3.Color(pal.glow), 2.2); glow.position.set(0, 3.95, .35); glow.material.opacity = .3; g.add(glow);
  const leaves = [];
  for (const s of [-1, 1]) { const piv = new T3.Group(); piv.position.set(s * 1.245, 0, .062); g.add(piv);
    const lf = new T3.Mesh(D.leaf, kmat("doorwood")); lf.position.x = -s * .615; lf.castShadow = true; lf.receiveShadow = true; piv.add(lf);
    const br = new T3.Mesh(D.brass[s], mat("brass")); br.position.x = -s * .615; piv.add(br); leaves.push([piv, s]); }
  const pl = plaque(label, sub); pl.position.set(0, 5.15, .06); g.add(pl);
  let target = 0, ang = 0, t = Math.random() * 10;
  return {group: g, open(){ target = 1.4; }, close(){ target = 0; },
    update(dt){ t += dt; ang += (target - ang) * Math.min(1, dt * 3.2); const k = ang / 1.4, f = .93 + .05 * Math.sin(t * 9.1) * Math.sin(t * 5.3);
      for (const [p, s] of leaves) p.rotation.y = s < 0 ? ang : -ang;
      traM.color.setScalar((.8 + .5 * k) * f); portalM.color.setScalar(.75 + .45 * k); glow.material.opacity = (.28 + .6 * k) * f; glow.scale.setScalar(2.2 + 1.8 * k); }};
}

/* ---------- Station: Sekretär mit grüner Bankerlampe, Akten, Lupe; schwebende Messingnummer ---------- */
function deskGeo(C){
  if (C.desk) return C.desk;
  const K = bucket(), vc = (w, h, d, m, c) => K.box("vc", w, h, d, m, {c});
  K.box("wood", 1.24, .045, .64, M(0, .785, 0));
  for (const s of [-1, 1]) { K.box("wood", .38, .7, .58, M(s * .41, .41, 0)); K.box("dark", .42, .06, .62, M(s * .41, .03, 0));
    for (const y of [.64, .43, .2]) { K.box("dark", .32, .18, .014, M(s * .41, y, .295)); K.add("brass", new T3.SphereGeometry(.018, 10, 8), M(s * .41, y, .31)); } }
  K.box("wood", .44, .5, .025, M(0, .5, -.27));
  K.box("wood", 1.2, .58, .025, M(0, 1.09, -.3)); for (const s of [-1, 1]) K.box("wood", .03, .58, .3, M(s * .585, 1.09, -.165));
  K.box("wood", 1.26, .035, .33, M(0, 1.395, -.165)); K.box("dark", 1.32, .05, .36, M(0, 1.435, -.17)); K.box("dark", .5, .08, .06, M(0, 1.5, -.3));
  K.box("wood", 1.14, .02, .28, M(0, 1.1, -.165)); for (const x of [-.2, .2]) K.box("wood", .02, .28, .28, M(x, .95, -.165)); K.box("wood", .02, .27, .28, M(0, 1.245, -.165));
  vc(1.04, .004, .46, M(0, .8095, .06), "#2b4a3a");
  K.box("paper", .34, .07, .22, M(-.39, .845, -.165)); for (const [x, y] of [[.33, .84], [.4, .84], [.365, .885]]) K.add("paper", new T3.CylinderGeometry(.028, .028, .24, 12), M(x, y, -.165, Math.PI / 2));
  K.box("paper", .24, .04, .17, M(-.3, 1.13, -.165)); K.box("paper", .2, .03, .15, M(-.27, 1.165, -.16, 0, .12));
  let bx = .06; for (const c of ["#6e2a22", "#2f5d5d", "#1f2b47", "#8a5a2b", "#24402f", "#4a1f2a"]) { const th = .035 + (bx * 37 % 1) * .02, hb = .2 + (bx * 53 % 1) * .05; vc(th, hb, .2, M(bx + th / 2, 1.11 + hb / 2, -.17), c); bx += th + .004; }
  // Bankerlampe
  K.add("brass", new T3.CylinderGeometry(.075, .09, .03, 20), M(-.38, .825, .12)); K.add("brass", new T3.CylinderGeometry(.011, .011, .3, 8), M(-.38, .99, .12));
  K.box("brass", .3, .014, .014, M(-.38, 1.13, .12)); for (const s of [-1, 1]) K.box("brass", .012, .05, .012, M(-.38 + s * .14, 1.15, .12));
  K.add("brass", new T3.CylinderGeometry(.003, .003, .1, 4), M(-.3, 1.08, .19)); K.add("brass", new T3.SphereGeometry(.01, 8, 6), M(-.3, 1.03, .19));
  K.add("shade", new T3.CylinderGeometry(.1, .1, .36, 20, 1, true, 0, Math.PI), M(-.38, 1.17, .12, 0, 0, Math.PI / 2));
  for (const s of [-1, 1]) K.add("brass", new T3.TorusGeometry(.1, .006, 4, 16, Math.PI), M(-.38 + s * .18, 1.17, .12, 0, Math.PI / 2, 0));
  // Aktenstapel mit Band
  let y = .81; [["#c9a46a", 1], [0, 0], ["#b07a3a", 1], [0, 0], ["#6e2a22", 1], [0, 0], ["#2f5d5d", 1]].forEach(([c, folder], k) => { const ry = (Math.sin(k * 2.3) * .06);
    if (folder) { vc(.33, .016, .245, M(.36, y + .008, .03, 0, ry), c); y += .016; } else { K.box("paper", .3, .02, .22, M(.36, y + .01, .03, 0, ry)); y += .02; } });
  vc(.026, y - .81 + .006, .25, M(.36, (y + .81) / 2, .03), "#a3241c"); vc(.33, .006, .026, M(.36, y + .003, .03), "#a3241c");
  K.add("paper", new T3.PlaneGeometry(.21, .3), M(.02, .8125, .14, -Math.PI / 2, .3));
  // Lupe, Tintenfass, Feder
  K.add("brass", new T3.TorusGeometry(.065, .009, 8, 28), M(.15, .82, .2, Math.PI / 2)); K.add("lens", new T3.CircleGeometry(.058, 24), M(.15, .821, .2, -Math.PI / 2));
  vc(.014, .014, .15, M(.15 + Math.sin(.6) * .14, .82, .2 + Math.cos(.6) * .14, 0, .6), "#2a1a10"); K.add("brass", new T3.CylinderGeometry(.012, .012, .02, 10), M(.15 + Math.sin(.6) * .072, .82, .2 + Math.cos(.6) * .072, Math.PI / 2, .6));
  vc(.06, .05, .06, M(-.1, .835, -.04), "#1e2a2a"); K.add("brass", new T3.CylinderGeometry(.02, .02, .012, 12), M(-.1, .866, -.04));
  K.add("vc", new T3.ConeGeometry(.008, .26, 6), M(-.06, .95, -.05, 0, 0, -.35), {c: "#efe8da"});
  const out = {wood: K.geo("wood"), dark: K.geo("dark"), brass: K.geo("brass"), paper: K.geo("paper"), vc: K.geo("vc", true), shade: K.geo("shade"), lens: K.geo("lens")};
  return (C.desk = out);
}
// Stehpult für Räume unter freiem Himmel (Raumthemen mit pult: true, 17_raum_detektiv*.js): schräge Pultplatte auf zwei Wangen, Ablage mit
// Akten, aufgeschlagenes Buch, Sturmlaterne am Haken (dort sitzt der Lichtpunkt); gleiche Grundfläche wie der Schreibtisch, Schilder unverändert
function pultGeo(C){
  if (C.pult) return C.pult;
  const K = bucket(), vc = (w, h, d, m, c) => K.box("vc", w, h, d, m, {c}), a = .32, sa = Math.sin(a) * .33, ca = Math.cos(a) * .33;   // Platte vorn (+z, zum Gang) tiefer
  for (const s of [-1, 1]) { K.box("wood", .05, .98, .5, M(s * .44, .5, -.02)); K.box("wood", .05, .2, .24, M(s * .44, 1.07, -.15)); K.box("dark", .09, .07, .64, M(s * .44, .035, -.02)); }
  K.box("dark", .84, .07, .05, M(0, .16, -.02)); K.box("wood", .84, .03, .42, M(0, .36, -.02)); K.box("wood", .84, .5, .025, M(0, .62, -.26));
  K.box("wood", 1.04, .045, .66, M(0, 1.1, 0, a)); K.box("dark", 1.08, .06, .04, M(0, 1.1 - sa + .03, ca + .02)); K.box("dark", 1.08, .05, .12, M(0, 1.1 + sa + .02, -ca - .03));
  // aufgeschlagenes Buch und Blätter auf der Platte, Akten und Rolle auf der Ablage
  const top = M(0, 1.125, 0, a);
  for (const s of [-1, 1]) K.box("paper", .2, .018, .28, top.clone().multiply(M(s * .105, .01, -.02, 0, 0, -s * .06)));
  vc(.43, .012, .3, top.clone().multiply(M(0, -.002, -.02)), "#5a2a1e"); K.add("paper", new T3.PlaneGeometry(.2, .27), top.clone().multiply(M(.36, .025, .04, -Math.PI / 2, 0, .2)));
  let y = .375; for (const c of ["#c9a46a", "#2f5d5d", "#b07a3a", "#6e2a22"]) { vc(.3, .03, .24, M(-.2, y + .015, -.02, 0, (y * 37 % 1 - .5) * .2), c); y += .032; }
  K.add("paper", new T3.CylinderGeometry(.035, .035, .34, 10), M(.22, .41, -.02, 0, 0, Math.PI / 2)); vc(.02, .072, .072, M(.39, .41, -.02), "#a3241c");
  // Sturmlaterne an einem Haken an der linken Wange
  const lx = -.5, ly = 1.22, lz = .12;
  K.box("dark", .04, .5, .04, M(-.47, 1.18, lz)); K.box("dark", .14, .03, .03, M(-.5, 1.42, lz)); K.add("brass", new T3.TorusGeometry(.025, .005, 4, 10), M(lx - .05, 1.39, lz));
  K.add("brass", new T3.CylinderGeometry(.07, .075, .025, 12), M(lx - .05, ly - .1, lz)); K.add("brass", new T3.ConeGeometry(.08, .07, 12), M(lx - .05, ly + .13, lz));
  K.add("lens", new T3.CylinderGeometry(.06, .06, .18, 12, 1, true), M(lx - .05, ly, lz)); for (let k = 0; k < 4; k++) { const b = k / 4 * TAU + .4; K.add("brass", new T3.CylinderGeometry(.005, .005, .2, 4), M(lx - .05 + Math.cos(b) * .065, ly, lz + Math.sin(b) * .065)); }
  K.add("shade", new T3.ConeGeometry(.018, .06, 6), M(lx - .05, ly - .03, lz));
  const out = {wood: K.geo("wood"), dark: K.geo("dark"), brass: K.geo("brass"), paper: K.geo("paper"), vc: K.geo("vc", true), shade: K.geo("shade"), lens: K.geo("lens"), glow: new T3.Vector3(lx - .05, ly - .02, lz), flamme: true};
  return (C.pult = out);
}
function station(ctx, j, name){
  const C = cache(ctx), RT = ctx.key !== "halle" && ctx.huelle && ctx.huelle.thema && R3D.kits.detektiv.raum && R3D.kits.detektiv.raum[ctx.key], g = new T3.Group();
  let D = null; if (RT && RT.pult) try { D = pultGeo(C); } catch (e) { console.error("R3D Raumthema " + ctx.key + " (Stehpult) – Ersatz: Schreibtisch", e); }
  D = D || deskGeo(C);
  for (const [geo, m, cast] of [[D.wood, mat("wood"), 1], [D.dark, mat("darkwood"), 1], [D.brass, mat("brass")], [D.paper, mat("paper"), 1], [D.vc, kmat("vc"), 1], [D.shade, kmat(D.flamme ? "globe" : "shade")], [D.lens, mat("glass", {opacity: .3})]]) {
    if (!geo) continue; const me = new T3.Mesh(geo, m); me.castShadow = !!cast; me.receiveShadow = true; g.add(me); }
  const lampG = ctx.glow(0xffe2b0, .42); lampG.position.copy(D.glow || new T3.Vector3(-.38, 1.1, .14)); g.add(lampG);
  const ring = new T3.Mesh(new T3.RingGeometry(.95, 1.03, 56), new T3.MeshBasicMaterial({color: pal.accent, transparent: true, opacity: .5, toneMapped: false, depthWrite: false}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .022; g.add(ring);
  const num = new T3.Mesh(new T3.PlaneGeometry(.56, .56), new T3.MeshBasicMaterial({map: tex.num(j + 1), transparent: true, toneMapped: false, side: T3.DoubleSide}));
  num.position.set(0, 2.08, 0); g.add(num);
  const nm = new T3.Mesh(new T3.PlaneGeometry(1.06, .3), new T3.MeshBasicMaterial({map: tex.name(name), transparent: true, toneMapped: false, side: T3.DoubleSide}));
  nm.position.set(0, 1.68, -.05); g.add(nm);
  const gl = ctx.glow(new T3.Color(pal.glow), 1.1); gl.position.set(0, 2.08, -.08); gl.material.opacity = .5; g.add(gl);
  const ph = j * 1.7;
  ctx.tick((dt, t) => { const b = Math.sin(t * 1.5 + ph) * .05; num.position.y = 2.08 + b; gl.position.y = num.position.y; num.rotation.y = Math.sin(t * .7 + ph) * .28;
    ring.material.opacity = .3 + .22 * Math.sin(t * 2 + ph); lampG.material.opacity = .85 + .1 * Math.sin(t * 17 + ph); });
  return g;
}

/* ---------- Tafel: Aktennotiz / Zeitungsausschnitt auf Korktafel im Holzrahmen ---------- */
function board(ctx, title, lines, o = {}){
  const w = o.w || 2.4, h = o.h || 1.6, k = 1024 / Math.max(w, h), cw = Math.round(w * k), ch = Math.round(h * k);
  const c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d");
  const T = U.plainT(title || ""), seed = [...T].reduce((a, s) => (a * 31 + s.charCodeAt(0)) >>> 0, 7), rr = U.seeded(seed), news = (seed % 3 === 1) && !o.memo;
  // Rahmen
  const fb = Math.round(Math.min(cw, ch) * .05); grain(g, cw, ch, [18, 40, 22], 60, 3);
  bevel(g, 0, 0, cw, ch, fb, "rgba(255,215,170,.22)", "rgba(0,0,0,.45)"); bevel(g, fb - 4, fb - 4, cw - 2 * fb + 8, ch - 2 * fb + 8, 4, "rgba(0,0,0,.5)", "rgba(255,215,170,.2)");
  // Kork
  g.fillStyle = "#b98a5a"; g.fillRect(fb, fb, cw - 2 * fb, ch - 2 * fb);
  for (let i = 0; i < cw * ch / 90; i++) { g.fillStyle = ["#8a5a32", "#d5a676", "#6a4024", "#c79565"][(rr() * 4) | 0]; g.globalAlpha = .35 + rr() * .4; g.fillRect(fb + rr() * (cw - 2 * fb), fb + rr() * (ch - 2 * fb), 1 + rr() * 3, 1 + rr() * 3); } g.globalAlpha = 1;
  // Papier
  const m = Math.min(cw, ch) * .05, px = fb + m, py = fb + m * .8, pw = cw - 2 * (fb + m), ph = ch - 2 * fb - m * 1.6, rot = (rr() - .5) * .014;
  g.save(); g.translate(cw / 2, ch / 2); g.rotate(rot); g.translate(-cw / 2, -ch / 2);
  g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 18; g.shadowOffsetX = 4; g.shadowOffsetY = 8;
  const pg = g.createLinearGradient(px, py, px + pw, py + ph); if (news) { pg.addColorStop(0, "#ece6d6"); pg.addColorStop(1, "#d9d0b9"); } else { pg.addColorStop(0, "#f6ecd2"); pg.addColorStop(1, "#e6d4ac"); }
  g.fillStyle = pg; g.fillRect(px, py, pw, ph); g.shadowColor = "transparent";
  g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
  for (let i = 0; i < pw * ph / 120; i++) { g.fillStyle = rr() < .5 ? "rgba(120,90,50,.12)" : "rgba(255,255,255,.18)"; g.fillRect(px + rr() * pw, py + rr() * ph, 1.5, 1.5); }
  const vg = g.createRadialGradient(px + pw / 2, py + ph / 2, Math.min(pw, ph) * .3, px + pw / 2, py + ph / 2, Math.max(pw, ph) * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(120,80,30,.22)"); g.fillStyle = vg; g.fillRect(px, py, pw, ph);
  g.restore();
  const pad = pw * .055, ink = "#22170e", red = "#8e2a1e"; let y = py + ph * .06;
  const small = ph < 380, hs = Math.max(18, Math.min(30, ph * .055));
  if (!small) { g.textBaseline = "top"; g.textAlign = "left";
    if (news) { g.textAlign = "center"; g.fillStyle = "#3a3026"; g.font = `italic 600 ${hs}px ${FONT}`; g.fillText("— Londoner Abendbote —", px + pw / 2, y); y += hs * 1.3;
      g.fillStyle = "#3a3026"; g.fillRect(px + pad, y, pw - 2 * pad, 3); g.fillRect(px + pad, y + 6, pw - 2 * pad, 1.5); y += hs * .6; }
    else { g.fillStyle = red; g.font = `700 ${hs}px ${BODY}`; g.fillText("AKTENNOTIZ", px + pad, y); g.textAlign = "right"; g.fillText(`Nr. ${100 + seed % 900}`, px + pw - pad, y); y += hs * 1.35;
      g.fillStyle = "rgba(142,42,30,.6)"; g.fillRect(px + pad, y, pw - 2 * pad, 2); y += hs * .55; } }
  // Titel und Zeilen: erst messen, dann senkrecht mittig setzen
  g.textBaseline = "top"; const maxW = pw - 2 * pad, bottom = py + ph - pad * .7, bf = news ? NEWS : BODY;
  // Titel- und Textgröße gemeinsam wählen: so groß wie möglich (vom Gang aus lesbar), der Text aber mindestens halb so groß wie der Titel
  const items = (lines || []).map(l => U.richT(l)).filter(Boolean);
  let ts = Math.min(ph * (small ? .24 : .15), 88), tl, th, avail, bs, wl = [];
  for (;;) {
    do { g.font = `700 ${ts}px ${FONT}`; tl = U.wrapText(g, U.richT(title || ""), maxW).slice(0, 3); if (tl.length <= 2) break; ts -= 3; } while (ts > 20);
    tl = tl.slice(0, 2); th = tl.length * ts * 1.08 + ts * (small ? .15 : .47); avail = bottom - y - th;
    for (bs = Math.min(ph * (small ? .17 : .13), 72, ts * .8); bs > 14; bs -= 2) { g.font = `400 ${bs}px ${bf}`; wl = []; for (const it of items) U.wrapText(g, (items.length > 1 ? "– " : "") + it, maxW - bs).forEach((q, i) => wl.push([q, i > 0])); if (wl.length * bs * 1.36 <= avail) break; }
    if (small || !items.length || bs >= ts * .55 || ts <= 32) break; ts -= 4;
  }
  y += Math.max(0, (avail - wl.length * bs * 1.36) * .42);
  g.textAlign = "center"; g.fillStyle = ink; g.font = `700 ${ts}px ${FONT}`;
  for (const l of tl) { U.fillRich(g, l, px + pw / 2, y); y += ts * 1.08; }
  y += ts * .15; if (!small) { g.fillStyle = "rgba(34,23,14,.55)"; g.fillRect(px + pw * .3, y, pw * .4, 2); y += ts * .32; }
  g.font = `400 ${bs}px ${bf}`; g.textAlign = items.length > 1 ? "left" : "center"; const bx = items.length > 1 ? px + pad : px + pw / 2;
  for (const [q, cont] of wl) { if (y + bs > bottom + pad * .4) break; g.fillStyle = `rgba(34,23,14,${.86 + rr() * .14})`; U.fillRich(g, q, bx + (cont ? bs * .95 : 0), y); y += bs * 1.36; }
  g.restore();
  // Reißzwecken
  for (const [x, yy] of [[px + 26, py + 22], [px + pw - 26, py + 22]]) { const gr = g.createRadialGradient(x - 4, yy - 5, 1, x, yy, 13); gr.addColorStop(0, news ? "#fff0c0" : "#ff8a7a"); gr.addColorStop(1, news ? "#8a6420" : "#7a1410");
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.arc(x + 3, yy + 4, 12, 0, TAU); g.fill(); g.fillStyle = gr; g.beginPath(); g.arc(x, yy, 12, 0, TAU); g.fill(); }
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8;
  const grp = new T3.Group();
  const face = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshStandardMaterial({map: t, roughness: .88, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .14}));
  face.position.z = .022; face.receiveShadow = true;
  const back = new T3.Mesh(new T3.BoxGeometry(w, h, .04), mat("darkwood")); back.castShadow = true; back.receiveShadow = true; grp.add(back, face);
  return grp;
}

/* ---------- Stimmung: Staub im Gaslicht, Bodennebel, Dunstschwaden ---------- */
// o (nur Raumthemen): staub {n, farbe, groesse}, boden/dunst {n, mat: () => Material}, hoch = obere Grenze der Dunstschwaden
function ambient(ctx, sc, o = {}){
  const B = ctx.bounds, H = o.hoch || ctx.height || 6.5, hall = ctx.key === "halle", r = U.seeded(hall ? 5 : 9), lamps = cache(ctx).lamps || [];
  const W = B.x1 - B.x0, D = B.z0 - B.z1, st = o.staub || {};
  const dn = st.n ?? (hall ? 460 : 340), dp = new Float32Array(dn * 3), dv = [];
  for (let i = 0; i < dn; i++) { let x, y, z; const near = lamps.length && i < lamps.length * 16;
    if (near) { const L = lamps[i % lamps.length]; x = L.x + (r() - .5) * 1.4; y = L.y - 1 + r() * 2; z = L.z + (r() - .5) * 2; } else { x = B.x0 + r() * W; y = r() * H; z = B.z1 + r() * D; }
    dp.set([x, y, z], i * 3); dv.push({p: r() * TAU, s: .02 + r() * .04, y0: near ? lamps[i % lamps.length].y - 1 : 0, y1: near ? lamps[i % lamps.length].y + 1 : H}); }
  const dg = new T3.BufferGeometry(); dg.setAttribute("position", new T3.BufferAttribute(dp, 3));
  const dust = new T3.Points(dg, new T3.PointsMaterial({map: U.glowTex(), color: st.farbe ?? 0xffdcaa, size: st.groesse ?? .05, transparent: true, opacity: .7, depthWrite: false, blending: T3.AdditiveBlending})); dust.frustumCulled = false;
  const low = [], hi = [], nl = (o.boden && o.boden.n) ?? (hall ? 14 : 10), nh = (o.dunst && o.dunst.n) ?? (hall ? 10 : 7);
  for (let i = 0; i < nl; i++) { const sz = 3 + r() * 3; low.push({x: B.x0 + 1 + r() * (W - 2), y: .1 + sz * .17, z: B.z1 + 1 + r() * (D - 2), s: sz, vx: (r() - .5) * .14, vz: (r() - .5) * .14, ph: r() * TAU}); }
  for (let i = 0; i < nh; i++) hi.push({x: B.x0 + 2 + r() * (W - 4), y: 3.0 + r() * (H - 4.0), z: B.z1 + 2 + r() * (D - 4), s: 4 + r() * 3, vx: (r() - .5) * .1, ph: r() * TAU});
  const lm = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), o.boden && o.boden.mat ? o.boden.mat() : kmat("fog"), nl), hm = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), o.dunst && o.dunst.mat ? o.dunst.mat() : kmat("haze"), nh);
  lm.frustumCulled = hm.frustumCulled = false; lm.renderOrder = hm.renderOrder = 4; sc.add(dust, lm, hm);
  const m4 = new T3.Matrix4(), q = new T3.Quaternion(), v = new T3.Vector3(), sv = new T3.Vector3();
  const wrapX = x => x < B.x0 ? B.x1 - (B.x0 - x) : x > B.x1 ? B.x0 + (x - B.x1) : x, wrapZ = z => z < B.z1 ? B.z0 - (B.z1 - z) : z > B.z0 ? B.z1 + (z - B.z0) : z;
  ctx.tick((dt, t) => {
    for (let i = 0; i < dn; i++) { const o = dv[i]; let y = dp[i * 3 + 1] + dt * o.s; if (y > o.y1) y = o.y0; dp[i * 3 + 1] = y; dp[i * 3] += Math.sin(t * .3 + o.p) * dt * .03; dp[i * 3 + 2] += Math.cos(t * .23 + o.p) * dt * .03; }
    dg.attributes.position.needsUpdate = true;
    const cam = R3D.camera, cq = cam ? cam.quaternion : q.identity(), near = (x, z, s) => cam ? Math.min(1, Math.max(0, (Math.hypot(x - cam.position.x, z - cam.position.z) - s * .25) / 2.5)) : 1;
    low.forEach((o, i) => { o.x = wrapX(o.x + o.vx * dt); o.z = wrapZ(o.z + o.vz * dt); const k = near(o.x, o.z, o.s) + 1e-4;
      m4.compose(v.set(o.x, o.y, o.z), cq, sv.set(o.s * k * (1 + .08 * Math.sin(t * .3 + o.ph)), o.s * .3 * k, 1)); lm.setMatrixAt(i, m4); });
    lm.instanceMatrix.needsUpdate = true;
    hi.forEach((o, i) => { o.x = wrapX(o.x + o.vx * dt); const k = near(o.x, o.z, o.s) + 1e-4; m4.compose(v.set(o.x, o.y + Math.sin(t * .2 + o.ph) * .15, o.z), cq, sv.set(o.s * k, o.s * .55 * k, 1)); hm.setMatrixAt(i, m4); });
    hm.instanceMatrix.needsUpdate = true;
  });
}
function placeholder(ctx){ const b = ctx.board(ctx.room.n, [ctx.topic ? ctx.topic.title : ""], {w: 3, h: 1.6}); b.position.set(0, 2.2, -1.5); ctx.group.add(b); }

/* ---------- Bau mit Rücknahme (Raumthemen): wirft fn einen Fehler, wird alles entfernt, was fn in Gruppe und Szene gelegt hat
   (dazu Ticks, Hindernisse, Lichter, Belegung, Klickziele), der Fehler gemeldet und ersatz() gebaut – der Raum sieht dann aus wie vorher ---------- */
function versuch(ctx, sc, was, fn, ersatz){
  const G = ctx.group, n0 = G.children.length, s0 = sc ? sc.children.length : 0, t0 = ctx._ticks.length, o0 = ctx._obst.length, l0 = ctx._lights.length,
    i0 = ctx._inter.length, q0 = ctx._occ ? ctx._occ.length : -1, h0 = ctx.huelle;
  try { return fn(); } catch (e) {
    console.error(`R3D Raumthema ${ctx.key} (${was}) – Ersatz: bisheriges Aussehen`, e);
    const weg = (P, n) => { while (P.children.length > n) { const c = P.children[P.children.length - 1]; P.remove(c);
      c.traverse(m => { if (m.isInstancedMesh) m.dispose(); if (m.geometry) m.geometry.dispose(); const ms = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        ms.forEach(x => { if (!x.userData.keep) x.dispose(); }); }); } };
    weg(G, n0); if (sc) weg(sc, s0);
    ctx._ticks.length = t0; ctx._obst.length = o0; ctx._lights.length = l0; ctx._inter.length = i0;
    if (q0 < 0) delete ctx._occ; else if (ctx._occ) ctx._occ.length = q0;
    if (h0 === undefined) delete ctx.huelle; else ctx.huelle = h0;
    return ersatz ? ersatz() : undefined;
  }
}

R3D.kits.detektiv = {pal, font: FONT, fontBody: BODY, mat, env, shell, door, station, board, ambient, placeholder,
  // Bauhilfen für die Ausstattung (15_dekor_detektiv.js) und die Raumthemen (17_raum_detektiv*.js): gleiche Materialien, Texturen und Zeichenhilfen wie die Raumhülle
  _h: {U, TAU, FONT, BODY, NEWS, bevel, flower, star, dia, brassGrad, screw, compass, damask, tex, mat, kmat, M, merge, bucket, walls, bookcase, LAMP_Y, cache,
    grain, noise, rnd, keep, S, KB, flat, segs, pilaster, gasLamp, painting, versuch}};
})();
