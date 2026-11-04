/* ---------- 40_lern_optik2.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum 4 (Kap. 2.3–2.4: Linsen machen Bilder, das Auge als optisches System)
   Türrätsel „Das Bildschloss“ · Suchbild „Beim Optiker“ · Lernzettel · Fehler → Exponat · Tipps zu Rechenaufgaben
   (Das Labor sitzt am Exponat „Bilder an der Sammellinse“ – der optischen Bank – in 20_optik2.js.)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;

/* ---------- kleine Zeichenhilfen ---------- */
const line = (g, pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const txt = (g, s, x, y, size, col, align = "center", weight = 600, maxW = 0) => { g.fillStyle = col; g.font = `${weight} ${size}px system-ui, sans-serif`; g.textAlign = align; g.textBaseline = "middle";
  if (maxW) { let k = size; while (k > 14 && g.measureText(s).width > maxW) { k--; g.font = `${weight} ${k}px system-ui, sans-serif`; } } g.fillText(s, x, y); };
const txtO = (g, s, x, y, size, col) => { g.font = `700 ${size}px system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 6; g.strokeStyle = "#10131a"; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); };
const de = (x, d = 1) => String(+(+x).toFixed(d)).replace(".", ",");
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, 7); g.fill(); }
function star(g, x, y, r, col){ g.fillStyle = col; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
// Pfeil vom Fußpunkt (x | y0) mit Stern an der Spitze; hh > 0 aufrecht, hh < 0 umgekehrt
function seal(g, x, y0, hh, col){ const tip = y0 - hh, s = Math.sign(hh); line(g, [[x, y0], [x, tip + s * 8]], col, 6); star(g, x, tip, 15, col); }
// Sammel- (conv) oder Zerstreuungslinse im Schnitt, senkrecht, Mitte (x | y), halbe Höhe r
function lensShape(g, x, y, r, conv, fill, stroke, bulge = 13){ g.fillStyle = fill; g.strokeStyle = stroke; g.lineWidth = 3; g.beginPath();
  if (conv) { g.moveTo(x, y - r); g.quadraticCurveTo(x + 2 * bulge, y, x, y + r); g.quadraticCurveTo(x - 2 * bulge, y, x, y - r); }
  else { g.moveTo(x - bulge, y - r); g.lineTo(x + bulge, y - r); g.quadraticCurveTo(x + bulge * .15, y, x + bulge, y + r); g.lineTo(x - bulge, y + r); g.quadraticCurveTo(x - bulge * .15, y, x - bulge, y - r); }
  g.closePath(); g.fill(); g.stroke(); }

/* ---------- Türrätsel: Das Bildschloss ---------- */
// Siegel (G = 4 cm) und Sensor stehen fest 40 cm auseinander; dazwischen eine Linse. Öffnet nur bei scharfem, gleich großem Bild → g = b = 2f.
const FS = [5, 10, 20, -10];   // Brennweiten der Auswahl in cm (−10: Zerstreuungslinse)
const ana = v => { const F = FS[v.f], g = v.g, b = 40 - g, conv = F > 0, bs = conv && g > F ? F * g / (g - F) : null, sharp = bs != null && Math.abs(bs - b) <= .4;
  return {F, g, b, conv, bs, sharp, ok: sharp && Math.abs(g - b) < 1e-9}; };
const raetsel = {
  titel: "Das Bildschloss",
  text: "Die Tür hat kein Schlüsselloch, sondern einen **Bildsensor**. Er gibt die Tür nur frei, wenn das leuchtende Siegel (**G = 4 cm**) **scharf** und **genau gleich groß** auf ihm abgebildet wird. Siegel und Sensor stehen fest **40 cm** auseinander. Wähle eine Linse und schiebe sie an die richtige Stelle.",
  regler: [{id: "f", name: "Linse", optionen: ["Sammellinse f = 5 cm", "Sammellinse f = 10 cm", "Sammellinse f = 20 cm", "Zerstreuungslinse"], wert: 0},
           {id: "g", name: "Abstand Siegel – Linse g", einheit: "cm", min: 2, max: 38, schritt: 1, wert: 30}],
  zeichne(q, w, h, v, t, solved){
    q.fillStyle = "#10131a"; q.fillRect(0, 0, w, h);
    const A = ana(v), S = 17, X0 = 90, XS = X0 + 40 * S, xe = XS - 7, XL = X0 + A.g * S, AY = 270, G = 4 * S, LR = 112, fp = Math.abs(A.F) * S;
    txt(q, "Bildschloss · öffnet bei scharfem Bild mit B = G", w / 2, 38, 28, "#ffe9a8");
    // optische Achse und Brennpunkte
    q.save(); q.setLineDash([10, 8]); line(q, [[30, AY], [XS, AY]], "rgba(255,255,255,.35)", 2); q.restore();
    const fMarks = [];   // Beschriftung erst nach den Strahlen zeichnen, damit kein Strahl über „F“ läuft
    for (const s of [-1, 1]) for (const k of [1, 2]) { const x = XL + s * k * fp; if (x < 24 || x > XS - 30) continue;
      q.fillStyle = "#ffcf6b"; q.beginPath(); q.arc(x, AY, k === 1 ? 6 : 4, 0, 7); q.fill(); fMarks.push([k === 1 ? "F" : "2F", x]); }
    // Sensor mit Zielmarke (so groß muss das umgekehrte Bild werden) und Schlossgehäuse
    q.fillStyle = solved ? "#1f5a3a" : "#2b323d"; q.fillRect(XS - 7, AY - 130, 14, 260); q.strokeStyle = "#8a96a8"; q.lineWidth = 2; q.strokeRect(XS - 7, AY - 130, 14, 260);
    q.save(); q.setLineDash([6, 6]); line(q, [[XS + 16, AY], [XS + 16, AY + G]], "#5fd38d", 3); q.restore();
    line(q, [[XS + 9, AY], [XS + 23, AY]], "#5fd38d", 3); line(q, [[XS + 9, AY + G], [XS + 23, AY + G]], "#5fd38d", 3);
    q.fillStyle = "#1a1f29"; q.beginPath(); q.roundRect(XS + 32, AY - 70, 84, 140, 12); q.fill(); q.strokeStyle = "#5a6272"; q.lineWidth = 2; q.stroke();
    txt(q, "Sensor", XS + 74, AY - 92, 22, "#cfd8e6");
    lockIcon(q, XS + 74, AY - 6, 58, solved, solved ? "#5fd38d" : "#ff5a48");
    // Linse
    lensShape(q, XL, AY, LR, A.conv, "rgba(150,210,255,.22)", "#9fd8ff");
    { const s = A.conv ? `f = ${A.F} cm` : "Zerstreuungslinse"; q.font = "600 22px system-ui, sans-serif"; const hw = q.measureText(s).width / 2 + 6;   // nicht in den Sensor ragen lassen
      txt(q, s, Math.max(hw, Math.min(XL, XS - 14 - hw)), AY - LR - 20, 22, "#bfe6ff"); }
    // Siegel mit pulsierendem Leuchten
    const pulse = .55 + .25 * Math.sin(t * 3), gl = q.createRadialGradient(X0, AY - G, 2, X0, AY - G, 46);
    gl.addColorStop(0, `rgba(255,211,107,${pulse})`); gl.addColorStop(1, "rgba(255,211,107,0)"); q.fillStyle = gl; q.beginPath(); q.arc(X0, AY - G, 46, 0, 7); q.fill();
    seal(q, X0, AY, G, "#ffd36b"); txt(q, "Siegel", X0 + 12, AY - G - 40, 22, "#ffd36b", "right");
    // Konstruktionsstrahlen von der Spitze des Siegels
    const P = [X0, AY - G], rays = [{c: "#FF6A4D", L: [XL, AY - G], d: [fp, A.conv ? G : -G]}, {c: "#FFE14D", L: [XL, AY], d: [XL - X0, G]}];
    let yl = null;
    if (A.conv && A.g > A.F) yl = AY + G * A.F / (A.g - A.F);            // durch F vor der Linse → danach parallel
    else if (A.conv && A.g < A.F) yl = AY - G * A.F / (A.F - A.g);       // kommt scheinbar von F → danach parallel
    else if (!A.conv) yl = AY - G * fp / (A.g * S + fp);                 // zielt auf F hinter der Zerstreuungslinse → danach parallel
    if (yl != null && Math.abs(yl - AY) <= LR - 4) rays.push({c: "#4CC9FF", L: [XL, yl], d: [1, 0]});
    rays.forEach((r, k) => { r.ys = r.L[1] + r.d[1] * (xe - XL) / r.d[0];   // Höhe am Sensor; gezeichnet wird nur bis zum Rand des Schaubilds
      const E = r.ys < 70 ? [XL + (70 - r.L[1]) * r.d[0] / r.d[1], 70] : r.ys > AY + 125 ? [XL + (AY + 125 - r.L[1]) * r.d[0] / r.d[1], AY + 125] : [xe, r.ys];
      q.globalAlpha = .9; line(q, [P, r.L, E], r.c, 4); q.globalAlpha = 1;
      const L1 = Math.hypot(r.L[0] - P[0], r.L[1] - P[1]), L2 = Math.hypot(E[0] - r.L[0], E[1] - r.L[1]), Lt = L1 + L2;
      for (let i = 0; i < 4; i++) { let s = (t * 140 + i * Lt / 4 + k * 37) % Lt, x, y;
        if (s < L1) { x = P[0] + (r.L[0] - P[0]) * s / L1; y = P[1] + (r.L[1] - P[1]) * s / L1; } else { s -= L1; x = r.L[0] + (E[0] - r.L[0]) * s / L2; y = r.L[1] + (E[1] - r.L[1]) * s / L2; }
        q.fillStyle = "#ffffff"; q.beginPath(); q.arc(x, y, 3.5, 0, 7); q.fill(); } });
    for (const [s, x] of fMarks) txtO(q, s, x, AY + 28, 22, "#ffcf6b");
    // Was auf dem Sensor ankommt: scharfes, umgekehrtes Bild oder ein unscharfer Fleck
    if (A.sharp) seal(q, xe - 10, AY, -G * A.bs / A.g, A.ok ? "#5fd38d" : "#ffd36b");
    else {
      const ys = rays.map(r => r.ys).filter(y => y > AY - 130 && y < AY + 130);
      if (ys.length) { const y1 = Math.min(...ys), y2 = Math.max(...ys), cy = (y1 + y2) / 2, ry = Math.max(14, (y2 - y1) / 2 + 10);
        const gr = q.createRadialGradient(xe - 4, cy, 2, xe - 4, cy, ry); gr.addColorStop(0, "rgba(255,211,107,.5)"); gr.addColorStop(1, "rgba(255,211,107,0)");
        q.fillStyle = gr; q.beginPath(); q.ellipse(xe - 4, cy, 18, ry, 0, 0, 7); q.fill(); }
      if (A.bs != null && XL + A.bs * S < xe - 8) { const xi = XL + A.bs * S, yi = AY + G * A.bs / A.g; q.fillStyle = "#ffffff"; q.beginPath(); q.arc(xi, yi, 6, 0, 7); q.fill(); }
    }
    // Abstände
    const dim = (xa, xb, s) => { const y = AY + 150; line(q, [[xa, y], [xb, y]], "#cfd8e6", 2); line(q, [[xa, y - 9], [xa, y + 9]], "#cfd8e6", 2); line(q, [[xb, y - 9], [xb, y + 9]], "#cfd8e6", 2); txt(q, s, (xa + xb) / 2, y + 28, 22, "#cfd8e6"); };
    dim(X0, XL, `g = ${A.g} cm`); dim(XL, XS, `b = ${A.b} cm`);
    // Zustand in Worten
    let st, col = "#ffb3a8";
    if (solved) { st = "🔓 Bild erkannt – das Schloss ist offen"; col = "#5fd38d"; }
    else if (!A.conv) st = "Zerstreuungslinse: Licht läuft auseinander – kein Bild auf dem Sensor";
    else if (A.g === A.F) st = "g = f: Licht läuft parallel weiter – kein Bild";
    else if (A.g < A.F) st = "g < f: nur ein virtuelles Bild (wie bei einer Lupe)";
    else if (!A.sharp) st = `unscharf – die Strahlen treffen sich bei b ≈ ${de(A.bs)} cm`;
    else if (!A.ok) { st = `scharf, aber B : G = b : g ≈ ${de(A.b / A.g, 2)} – nicht gleich groß`; col = "#ffe9a8"; }
    else { st = "scharf und gleich groß: B : G = 1"; col = "#5fd38d"; }
    txt(q, st, w / 2, 502, 26, col, "center", 700, w - 40);
  },
  pruefe(v){
    const A = ana(v);
    if (!A.conv) return {ok: false, text: "Eine **Zerstreuungslinse** lässt das Licht hinter sich **auseinanderlaufen**. Die Strahlen eines Siegelpunkts treffen sich nie wieder – so entsteht **kein reelles Bild**, das man auf dem Sensor auffangen kann. Du brauchst eine **Sammellinse**."};
    if (A.g === A.F) return {ok: false, text: `Das Siegel steht genau im **Brennpunkt** (g = f = ${A.F} cm). Die Strahlen von einem Siegelpunkt verlassen die Linse **parallel zueinander** (sieh dir den roten und den gelben Strahl an) – sie schneiden sich nirgends, es entsteht gar kein Bild.`};
    if (A.g < A.F) return {ok: false, text: `Das Siegel steht **innerhalb der Brennweite** (g = ${A.g} cm < f = ${A.F} cm). Hinter der Linse laufen die Strahlen auseinander: Es gibt nur ein **virtuelles** Bild wie bei einer Lupe – auf einem Sensor kann man es nicht auffangen.`};
    if (!A.sharp) return {ok: false, text: `Mit f = ${A.F} cm treffen sich die Strahlen bei b ≈ ${de(A.bs)} cm hinter der Linse – der Sensor steht aber ${A.b} cm dahinter. Das Bild liegt **${A.bs > A.b ? "hinter" : "vor"} dem Sensor**, auf ihm landet nur ein **unscharfer Lichtfleck**.`};
    if (!A.ok) return {ok: false, text: `Das Bild ist scharf, aber **${A.b > A.g ? "vergrößert" : "verkleinert"}**: B : G = b : g = ${A.b} cm : ${A.g} cm ≈ ${de(A.b / A.g, 2)}. Der Sensor braucht ein **gleich großes** Bild, also B : G = 1.`};
    return {ok: true};
  },
  tipps: ["Gleich groß heißt B : G = 1. Wegen **B : G = b : g** muss dann **b = g** sein – die Linse steht genau in der Mitte zwischen Siegel und Sensor.",
          "Ein scharfes, gleich großes Bild entsteht bei **g = b = 2f**. Hier ist g = b = 40 cm : 2 = 20 cm.",
          "Aus 2f = 20 cm folgt f = … cm. Wähle diese Linse und stelle g = 20 cm ein."],
  loesung: {f: 1, g: 20},
  erfolg: "Bei **g = b = 2f = 20 cm** entsteht ein scharfes, umgekehrtes Bild, das genau so groß ist wie das Siegel. Der Sensor erkennt es – das Schloss springt auf!"
};

/* ---------- Suchbild: Beim Optiker ---------- */
function optiker(g, w, h){
  // Wand, Fußleiste, Holzboden
  const wg = g.createLinearGradient(0, 0, 0, 540); wg.addColorStop(0, "#f4efe4"); wg.addColorStop(1, "#e6dccb"); g.fillStyle = wg; g.fillRect(0, 0, w, 540);
  g.fillStyle = "#c9a77c"; g.fillRect(0, 540, w, 260); g.fillStyle = "#b8956a"; for (let y = 585; y < 800; y += 55) g.fillRect(0, y, w, 3);
  for (let r = 0; r < 4; r++) for (let x = (r % 2) * 90; x < w; x += 180) g.fillRect(x, 540 + r * 55, 3, 55);
  g.fillStyle = "#8a6a48"; g.fillRect(0, 530, w, 12);

  // ── Poster „So siehst du“ (Fehler 1: aufrechtes Netzhautbild) ──
  g.fillStyle = "#fffdf6"; g.fillRect(30, 30, 410, 300); g.strokeStyle = "#2f4a6b"; g.lineWidth = 6; g.strokeRect(30, 30, 410, 300);
  txt(g, "So siehst du", 235, 62, 28, "#2f4a6b", "center", 700);
  const tree = (x, yb, hh, col) => { const s = Math.sign(hh), a = Math.abs(hh); g.fillStyle = "#7a4e2a"; g.fillRect(x - a * .06, s > 0 ? yb - a * .45 : yb, a * .12, a * .45);
    g.fillStyle = col; g.beginPath(); g.arc(x, yb - s * a * .7, a * .3, 0, 7); g.fill(); };
  tree(80, 255, 105, "#3f8f4a");
  const C = [300, 200], R = 84;
  g.fillStyle = "#ffffff"; g.strokeStyle = "#555"; g.lineWidth = 3; g.beginPath(); g.arc(C[0], C[1], 88, 0, 7); g.fill(); g.stroke();
  g.fillStyle = "rgba(200,225,245,.5)"; g.beginPath(); g.arc(C[0], C[1], R, 0, 7); g.fill();
  g.strokeStyle = "#c95f3e"; g.lineWidth = 7; g.beginPath(); g.arc(C[0], C[1], 82, -1.25, 1.25); g.stroke();                // Netzhaut
  line(g, [[386, 220], [428, 232]], "#e3c27a", 14);                                                                              // Sehnerv
  g.strokeStyle = "#5aa0d8"; g.lineWidth = 4; g.beginPath(); g.arc(250, 200, 50, Math.PI - .85, Math.PI + .85); g.stroke();      // Hornhaut
  line(g, [[226, 158], [226, 184]], "#3a6a9a", 6); line(g, [[226, 216], [226, 242]], "#3a6a9a", 6);                             // Iris
  g.fillStyle = "#f6e7b0"; g.strokeStyle = "#b89a4a"; g.lineWidth = 2; g.beginPath(); g.ellipse(232, 200, 11, 30, 0, 0, 7); g.fill(); g.stroke();   // Linse
  // Strahlen von Baumspitze und Fuß kreuzen sich in der Linse (richtig)
  const hit = (P, Q) => { const dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, fx = P[0] - C[0], fy = P[1] - C[1];
    const b = fx * ux + fy * uy, c = fx * fx + fy * fy - 80 * 80, s = -b + Math.sqrt(b * b - c); return [P[0] + ux * s, P[1] + uy * s]; };
  for (const P of [[80, 150], [80, 255]]) line(g, [P, [232, 200], hit(P, [232, 200])], "rgba(230,120,40,.9)", 2.5);
  tree(364, 238, 62, "#3f8f4a");                                                                                                   // FEHLER: aufrecht (liegt an der Netzhaut an)
  g.strokeStyle = "#666"; g.lineWidth = 2;
  for (const [s, x, y, ax, ay] of [["Hornhaut", 128, 302, 205, 228], ["Linse", 238, 302, 234, 232], ["Netzhaut", 388, 92, 334, 124], ["Sehnerv", 392, 302, 412, 234]]) {
    g.beginPath(); g.moveTo(x + (ax > x + 40 ? 40 : ax < x - 40 ? -40 : 0), y + (ay > y ? 12 : -12)); g.lineTo(ax, ay); g.stroke(); txt(g, s, x, y, 20, "#333", "center", 600); }

  // ── Whiteboard „Bildkonstruktion“ (Fehler 3: Mittelpunktstrahl knickt ab) ──
  g.fillStyle = "#aab3bd"; g.fillRect(462, 22, 396, 306); g.fillStyle = "#fbfdff"; g.fillRect(472, 32, 376, 286);
  txt(g, "Bildkonstruktion", 490, 62, 26, "#1d3a8a", "left", 700);
  const AW = 185;   // Achse des Tafelbilds; f = 60 px, G = 50 px, g = 150 px → b = 100 px, B = 33 px
  line(g, [[488, AW], [836, AW]], "#444", 2);
  lensShape(g, 650, AW, 66, true, "rgba(120,180,230,.35)", "#3d7fc0", 5);
  for (const x of [590, 710]) { line(g, [[x, AW - 7], [x, AW + 7]], "#222", 3); txt(g, "F", x, AW + 21, 20, "#222", "center", 700); }
  const arrow = (x, y0, y1, col) => { line(g, [[x, y0], [x, y1]], col, 4); const s = Math.sign(y1 - y0); g.fillStyle = col; g.beginPath(); g.moveTo(x, y1 + s * 2); g.lineTo(x - 8, y1 - s * 12); g.lineTo(x + 8, y1 - s * 12); g.closePath(); g.fill(); };
  arrow(500, AW, AW - 50, "#222"); txt(g, "G", 484, AW - 25, 20, "#222", "center", 700);
  line(g, [[500, AW - 50], [650, AW - 50], [835, AW - 50 + 185 * 50 / 60]], "#d33a2c", 3);       // Parallelstrahl → durch F (richtig)
  line(g, [[500, AW - 50], [650, AW + 60 * 50 / 90], [835, AW + 60 * 50 / 90]], "#2a6fd6", 3);   // Brennpunktstrahl → parallel (richtig)
  line(g, [[500, AW - 50], [650, AW], [800, AW + 100]], "#1a8a4a", 3);                           // FEHLER: Mittelpunktstrahl knickt ab
  arrow(750, AW, AW + 100 * 50 / 150, "#222"); txt(g, "B", 765, AW + 17, 20, "#222", "center", 700);
  for (const [s, c, y] of [["Parallelstrahl", "#d33a2c", 262], ["Mittelpunktstrahl", "#1a8a4a", 284], ["Brennpunktstrahl", "#2a6fd6", 306]]) { line(g, [[490, y], [512, y]], c, 4); txt(g, s, 520, y, 19, c, "left", 600); }

  // ── Fenster mit Sonne ──
  const sk = g.createLinearGradient(0, 30, 0, 360); sk.addColorStop(0, "#8fcaf0"); sk.addColorStop(1, "#dff1fb"); g.fillStyle = sk; g.fillRect(880, 30, 290, 330);
  const su = g.createRadialGradient(1105, 95, 6, 1105, 95, 80); su.addColorStop(0, "rgba(255,250,210,1)"); su.addColorStop(.4, "rgba(255,226,110,.9)"); su.addColorStop(1, "rgba(255,226,110,0)");
  g.fillStyle = su; g.beginPath(); g.arc(1105, 95, 80, 0, 7); g.fill(); g.fillStyle = "#fff6c0"; g.beginPath(); g.arc(1105, 95, 28, 0, 7); g.fill();
  g.fillStyle = "#c9b8a2"; g.fillRect(880, 280, 120, 80); g.fillRect(1010, 300, 160, 60); g.fillStyle = "#9b5a46"; g.beginPath(); g.moveTo(870, 285); g.lineTo(940, 245); g.lineTo(1010, 285); g.fill();
  g.strokeStyle = "#f7f7f2"; g.lineWidth = 12; g.strokeRect(880, 30, 290, 330); g.lineWidth = 8; g.beginPath(); g.moveTo(1025, 30); g.lineTo(1025, 360); g.moveTo(880, 195); g.lineTo(1170, 195); g.stroke();

  // ── Brillenregal (Fehler 2: Kurzsichtig → Sammellinse; daneben richtig: Weitsichtig → Sammellinse) ──
  g.fillStyle = "#fbf8f1"; g.beginPath(); g.roundRect(40, 352, 390, 170, 10); g.fill(); g.strokeStyle = "#b59a74"; g.lineWidth = 4; g.stroke();
  txt(g, "Brillengläser", 235, 378, 24, "#6a4a2a", "center", 700);
  for (const [x0, a, b, conv] of [[58, "Kurzsichtig?", "→ Sammellinse", true], [250, "Weitsichtig?", "→ Sammellinse", true]]) {
    g.fillStyle = "#ffffff"; g.fillRect(x0, 398, 165, 112); g.strokeStyle = "#3d7cc9"; g.lineWidth = 3; g.strokeRect(x0, 398, 165, 112);
    txt(g, a, x0 + 82, 422, 22, "#1d3a8a", "center", 700, 150); txt(g, b, x0 + 82, 452, 22, "#333", "center", 600, 150);
    lensShape(g, x0 + 82, 486, 17, conv, "rgba(150,200,240,.6)", "#3d7fc0", 4); }

  // ── Ladentheke ──
  g.fillStyle = "#a87048"; g.fillRect(460, 566, 450, 26); g.fillStyle = "#7d4f30"; g.fillRect(470, 592, 430, 208);
  g.fillStyle = "#8a5a39"; g.fillRect(800, 610, 90, 170);
  g.fillStyle = "#f6f1e6"; g.beginPath(); g.roundRect(490, 628, 300, 116, 10); g.fill(); g.strokeStyle = "#c9a24a"; g.lineWidth = 4; g.stroke();
  lensShape(g, 534, 686, 40, false, "rgba(150,200,240,.6)", "#3d7fc0", 10);                                               // richtig: Zerstreuungslinse
  txt(g, "Zerstreuungslinse:", 566, 660, 21, "#333", "left", 700, 214); txt(g, "in der Mitte dünner", 566, 690, 20, "#333", "left", 500, 214); txt(g, "als am Rand", 566, 718, 20, "#333", "left", 500, 214);
  g.fillStyle = "#f6f1e6"; g.beginPath(); g.roundRect(806, 622, 78, 40, 8); g.fill(); txt(g, "Kamera", 845, 642, 20, "#333", "center", 700);
  // Namensschild des Geschäfts
  g.fillStyle = "#6b4a2a"; g.beginPath(); g.roundRect(554, 338, 112, 36, 8); g.fill(); txt(g, "Optiker", 610, 356, 22, "#fff4d0", "center", 700, 100);
  // ── Schild an der Lupe (Fehler 5: Lupe außerhalb der Brennweite) ──
  g.fillStyle = "#6b4a2a"; g.fillRect(520, 552, 8, 16); g.fillRect(694, 552, 8, 16);
  g.fillStyle = "#fffbe8"; g.fillRect(461, 386, 300, 168); g.strokeStyle = "#c0392b"; g.lineWidth = 4; g.strokeRect(461, 386, 300, 168);
  txt(g, "Leselupe 3-fach", 611, 412, 24, "#c0392b", "center", 800, 280);
  ["Tipp: Halte die Lupe weiter", "vom Text weg als ihre", "Brennweite – dann ist die", "Schrift groß und aufrecht!"].forEach((s, i) => txt(g, s, 611, 448 + i * 26, 21, "#333", "center", 500, 284));
  g.strokeStyle = "#444"; g.lineWidth = 5; g.beginPath(); g.ellipse(560, 578, 30, 8, 0, 0, 7); g.stroke(); line(g, [[590, 580], [640, 584]], "#5a3a22", 7);
  // ── Sehtafel und Kamera mit Mattscheibe (richtig: Bild steht Kopf) ──
  g.fillStyle = "#ffffff"; g.fillRect(770, 336, 100, 114); g.strokeStyle = "#999"; g.lineWidth = 2; g.strokeRect(770, 336, 100, 114);
  [["E", 38, 366], ["F P", 24, 398], ["T O Z", 16, 422], ["L P E D", 11, 440]].forEach(([s, z, y]) => txt(g, s, 820, y, z, "#111", "center", 700));
  g.fillStyle = "#3a2b22"; g.fillRect(790, 468, 108, 98); g.fillStyle = "#222"; g.fillRect(898, 500, 22, 36);
  g.fillStyle = "#d9d6cc"; g.fillRect(800, 480, 88, 76); tree(844, 492, -56, "#3f8f4a");

  // ── Junge am Fenster (Fehler 4: schaut durch eine Lupe in die Sonne) ──
  g.fillStyle = "#2f3b52"; g.fillRect(984, 520, 16, 126); g.fillRect(1006, 520, 16, 126);
  g.fillStyle = "#222"; g.beginPath(); g.ellipse(990, 650, 16, 7, 0, 0, 7); g.ellipse(1016, 650, 16, 7, 0, 0, 7); g.fill();
  g.fillStyle = "#e0533d"; g.beginPath(); g.roundRect(968, 375, 68, 150, 16); g.fill();
  g.fillStyle = "#f1c9a5"; g.beginPath(); g.arc(1002, 342, 30, 0, 7); g.fill(); g.fillStyle = "#5a3a22"; g.beginPath(); g.arc(1000, 334, 31, Math.PI * 1.02, Math.PI * 1.95); g.fill();
  g.fillStyle = "#222"; g.beginPath(); g.arc(1019, 337, 3.5, 0, 7); g.fill();
  line(g, [[1022, 394], [1028, 320]], "#e0533d", 14); g.fillStyle = "#f1c9a5"; g.beginPath(); g.arc(1028, 314, 9, 0, 7); g.fill();
  line(g, [[1029, 310], [1036, 289]], "#333", 8);
  g.fillStyle = "rgba(190,225,255,.65)"; g.beginPath(); g.arc(1043, 266, 24, 0, 7); g.fill(); g.strokeStyle = "#333"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(1043, 266, 5, 0, 7); g.fill();
  g.save(); g.setLineDash([8, 7]); line(g, [[1019, 337], [1105, 99]], "rgba(240,150,40,.85)", 3); g.restore();
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(1045, 398, 150, 70, 14); g.fill(); g.strokeStyle = "#555"; g.lineWidth = 2; g.stroke();
  g.beginPath(); g.moveTo(1060, 400); g.lineTo(1034, 366); g.lineTo(1080, 400); g.fillStyle = "#ffffff"; g.fill();
  txt(g, "Wie groß wohl", 1120, 420, 20, "#333", "center", 600, 140); txt(g, "die Sonne wird?", 1120, 446, 20, "#333", "center", 600, 140);

  // ── Pflanze (Deko) ──
  g.fillStyle = "#b5653d"; g.beginPath(); g.moveTo(70, 680); g.lineTo(150, 680); g.lineTo(140, 770); g.lineTo(80, 770); g.closePath(); g.fill();
  g.fillStyle = "#4f9a52"; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .38; g.beginPath(); g.ellipse(110 + Math.cos(a) * 46, 660 + Math.sin(a) * 52, 12, 34, a + Math.PI / 2, 0, 7); g.fill(); }
}
const suchbild = {
  titel: "Beim Optiker",
  text: "Beim Optiker haben sich **fünf Fehler** versteckt: falsch gezeichnete Physik, falsche Tipps und ein gefährliches Verhalten. Klicke sie an und begründe, was falsch ist.",
  ort: {x: -3.6, z: -9.5, ry: 0},
  zeichne: optiker,
  fehler: [
    {x: 356, y: 205, r: 62, name: "Das Bild auf der Netzhaut", frage: "Was stimmt am Bild auf der Netzhaut nicht?",
     optionen: ["Auf der Netzhaut entsteht gar kein Bild, erst im Gehirn.", "Das Bild müsste größer sein als der Baum selbst.", "Das Netzhautbild steht auf dem Kopf – hier ist es aufrecht gezeichnet.", "Das Bild müsste vor der Netzhaut im Glaskörper liegen."], richtig: 2,
     warum: ["Auf der Netzhaut entsteht sehr wohl ein Bild – das Gehirn **deutet** es nur aufrecht. Falsch ist hier, wie das Netzhautbild gezeichnet ist.",
             "Der Baum steht weit vor dem Auge (g > 2f): Sein Netzhautbild ist **verkleinert**. Die Größe des Bildes ist also richtig gezeichnet.",
             null,
             "Ein Bild vor der Netzhaut wäre auf der Netzhaut **unscharf** – so ist es beim kurzsichtigen Auge. Beim gesunden Auge liegt das Bild genau auf der Netzhaut."],
     erklaerung: "Hornhaut und Linse wirken zusammen wie eine **Sammellinse**: Auf der Netzhaut entsteht ein **reelles, umgekehrtes, verkleinertes** Bild. Die Strahlen kreuzen sich in der Linse – der Baum steht also kopfüber auf der Netzhaut. Erst das **Gehirn** deutet das Bild aufrecht."},
    {x: 140, y: 452, r: 62, name: "Das Schild „Kurzsichtig?“", frage: "Was ist an diesem Schild falsch?",
     optionen: ["Kurzsichtigen hilft eine Zerstreuungslinse – das Bild liegt vor der Netzhaut und muss nach hinten rücken.", "Kurzsichtigen hilft keine Brille, nur eine Lupe.", "Nichts – Sammellinsen helfen bei jedem Sehfehler.", "Kurzsichtige brauchen ebenes Fensterglas."], richtig: 0,
     warum: [null,
             "Eine Lupe vergrößert **nahe** Dinge – Kurzsichtige sehen aber gerade **Fernes** unscharf. Ihnen hilft eine Brille mit dem richtigen Glas.",
             "Eine Sammellinse bündelt das Licht zusätzlich. Beim kurzsichtigen Auge liegt das Bild aber schon **vor** der Netzhaut – mehr Bündelung schöbe es noch weiter nach vorn.",
             "Ebenes Glas ändert an der Bündelung nichts – das Bild bliebe vor der Netzhaut und Fernes unscharf."],
     erklaerung: "Beim **kurzsichtigen** Auge ist der Augapfel zu lang: Das Bild ferner Gegenstände entsteht **vor der Netzhaut**. Eine **Zerstreuungslinse** (in der Mitte dünner) lässt das Licht etwas auseinanderlaufen – das Bild rückt nach hinten auf die Netzhaut. Sammellinsen helfen bei **Weitsichtigkeit** – das Schild daneben stimmt."},
    {x: 688, y: 214, r: 60, name: "Die Bildkonstruktion", frage: "Was ist an der Bildkonstruktion falsch?",
     optionen: ["Der Parallelstrahl müsste nach der Linse parallel bleiben.", "Das Bild müsste aufrecht stehen.", "Der Brennpunktstrahl müsste nach der Linse durch F gehen.", "Der Mittelpunktstrahl knickt an der Linse ab – er geht aber ohne Richtungsänderung geradeaus weiter."], richtig: 3,
     warum: ["Der rote Parallelstrahl geht nach der Linse durch F – genau so muss es sein. Parallel zur Achse weiter läuft nur der Brennpunktstrahl.",
             "Für g > f entsteht an der Sammellinse ein **reelles, umgekehrtes** Bild – der nach unten zeigende Bildpfeil B ist richtig.",
             "Der blaue Brennpunktstrahl geht **vor** der Linse durch F und läuft danach parallel zur Achse – das ist richtig gezeichnet.",
             null],
     erklaerung: "Der **Mittelpunktstrahl** geht durch die Linsenmitte **ohne Richtungsänderung**. Richtig gezeichnet träfe er die beiden anderen Strahlen im Bildpunkt der Pfeilspitze. Parallelstrahl (danach durch F) und Brennpunktstrahl (danach parallel zur Achse) sind richtig – ebenso das umgekehrte Bild B."},
    {x: 1028, y: 300, r: 70, name: "Der Junge am Fenster", frage: "Was ist hier gefährlich?",
     optionen: ["Nichts – durch eine Lupe sieht man die Sonne nur größer.", "Die Lupe bündelt das Sonnenlicht – das gebündelte Licht kann die Netzhaut schwer und dauerhaft verletzen.", "Die Lupe könnte beschlagen.", "Gefährlich wäre es nur mit einer Zerstreuungslinse."], richtig: 1,
     warum: ["Die Lupe vergrößert nicht nur – sie **bündelt** das Sonnenlicht wie ein Brennglas. Dieses gebündelte Licht fällt dann ins Auge.",
             null,
             "Beschlagenes Glas wäre harmlos. Gefährlich ist das **gebündelte Sonnenlicht**, das durch die Lupe ins Auge fällt.",
             "Umgekehrt: Eine Zerstreuungslinse lässt das Licht auseinanderlaufen. Die **Sammellinse** bündelt es – und eine Lupe ist eine Sammellinse."],
     erklaerung: "Eine Lupe ist eine **Sammellinse** – wie ein **Brennglas**. Sie bündelt das Sonnenlicht im **Brennpunkt** so stark, dass Papier zu glimmen beginnt. Im Auge kann dieses Licht die **Netzhaut** dauerhaft schädigen. **Schau nie durch eine Linse in die Sonne!**"},
    {x: 611, y: 470, r: 90, name: "Der Tipp zur Leselupe", frage: "Was stimmt an dem Tipp nicht?",
     optionen: ["Eine Lupe vergrößert nie, sie verkleinert immer.", "Eine Lupe ist eine Zerstreuungslinse.", "Ein vergrößertes, aufrechtes Bild siehst du nur, wenn der Text innerhalb der Brennweite liegt (g < f).", "Der Abstand spielt bei einer Lupe keine Rolle."], richtig: 2,
     warum: ["Eine Lupe ist gerade zum **Vergrößern** da – das gelingt, wenn der Text nah genug an der Linse liegt. Falsch ist auf dem Schild der empfohlene Abstand.",
             "Eine Lupe ist eine **Sammellinse** (in der Mitte dicker). Eine Zerstreuungslinse kann keine Schrift vergrößern.",
             null,
             "Der Abstand entscheidet über die Art des Bildes: Innerhalb der Brennweite aufrecht und vergrößert, außerhalb reell und umgekehrt."],
     erklaerung: "Eine Lupe wirkt nur, wenn der Gegenstand **innerhalb der Brennweite** liegt (**g < f**): Dann siehst du ein **virtuelles, aufrechtes, vergrößertes** Bild. Ist der Text weiter weg als f, erzeugt die Sammellinse ein **reelles, umgekehrtes** Bild – die Schrift steht auf dem Kopf."}
  ],
  // richtig dargestellte Details: Strahlen kreuzen sich in der Augenlinse, Schild „Weitsichtig?“, Zerstreuungslinse auf der Theke, umgekehrtes Bild in der Kamera
  ablenker: [
    {x: 205, y: 200, r: 48, text: "Die Strahlen von der Spitze und vom Fuß des Baums **kreuzen sich** in der Augenlinse und laufen geradlinig weiter. Genau deshalb muss das Netzhautbild auf dem Kopf stehen."},
    {x: 332, y: 454, r: 60, text: "Beim **weitsichtigen** Auge läge das Bild naher Gegenstände hinter der Netzhaut. Eine **Sammellinse** bündelt das Licht zusätzlich und holt das Bild nach vorn auf die Netzhaut."},
    {x: 580, y: 686, r: 70, text: "Eine **Zerstreuungslinse** ist in der Mitte dünner als am Rand – genau so ist sie gezeichnet. Paralleles Licht läuft hinter ihr auseinander."},
    {x: 844, y: 517, r: 55, text: "Das Objektiv der Kamera ist eine Sammellinse: Auf der Mattscheibe entsteht ein **reelles, umgekehrtes** Bild – der Baum steht zu Recht auf dem Kopf."}
  ],
  abschluss: "So stimmt es: Das Netzhautbild steht **auf dem Kopf**, Kurzsichtigen hilft eine **Zerstreuungslinse**, der **Mittelpunktstrahl** geht geradeaus, eine Lupe hält man **innerhalb der Brennweite** – und **nie** schaut man durch eine Linse in die Sonne."
};

/* ---------- Rechenwerkstatt: Abbildungsmaßstab B : G = b : g und das gleich große Bild (g = b = 2f) ---------- */
const MASS = "B : G = b : g";
const rechenweg = [
  {titel: "Die Kerze auf der optischen Bank", text: "Eine 3 cm hohe Kerze steht 25 cm vor einer Sammellinse. Ihr scharfes Bild entsteht auf einem Schirm 75 cm hinter der Linse. Wie hoch ist das Bild?",
   gegeben: [{g: "G", wert: 3, einheit: "cm", name: "Gegenstandsgröße"}, {g: "g", wert: 25, einheit: "cm", name: "Gegenstandsweite"}, {g: "b", wert: 75, einheit: "cm", name: "Bildweite"}],
   gesucht: {g: "B", einheit: "cm", name: "Bildgröße"},
   formel: MASS,
   formelAblenker: [{f: "B : G = g : b", warum: "Zur Bildgröße B gehört die **Bildweite** b, zur Gegenstandsgröße G die Gegenstandsweite g: Je weiter das Bild von der Linse entfernt ist, desto größer ist es."},
                    {f: "B · G = b · g", warum: "Der Abbildungsmaßstab ist ein **Verhältnis**: Bildgröße geteilt durch Gegenstandsgröße – kein Produkt."}],
   umgestellt: "B = G · b : g",
   umstellAblenker: [{f: "B = G · g : b", warum: "b und g sind vertauscht. Aus B : G = b : g wird durch Malnehmen mit G: B = G · b : g – die Bildweite steht im Zähler."},
                     {f: "B = b : g : G", warum: "G steht bei B unter dem Bruchstrich. Um es wegzubekommen, nimmst du beide Seiten **mal G** – du teilst nicht noch einmal durch G."}],
   umstellWeg: "B : G = b : g  | · G  →  B = G · b : g",
   einsetzen: "B = 3 cm · 75 cm : 25 cm", ergebnis: {wert: 9, einheit: "cm"},
   tipps: ["Stelle B : G = b : g nach B um: B = G · b : g.", "B = 3 cm · 75 cm : 25 cm", "75 cm : 25 cm = 3 → B = 3 cm · 3 = … cm"], loesung: "B = G · b : g = 3 cm · 75 cm : 25 cm = 9 cm",
   antwort: "Das Bild der Kerze ist 9 cm hoch.", antwortAnfang: "Das Bild der Kerze …", einheitAuch: ["mm", "m"]},
  {titel: "Der Projektor", text: "Ein Projektor wirft ein 2,5 cm hohes Dia scharf auf eine Leinwand. Das Dia steht 5 cm vor der Linse, die Leinwand ist 2 m von der Linse entfernt. Wie hoch ist das Bild auf der Leinwand?",
   gegeben: [{g: "G", wert: 2.5, einheit: "cm", name: "Gegenstandsgröße"}, {g: "g", wert: 5, einheit: "cm", name: "Gegenstandsweite"},
             {g: "b", wert: 2, einheit: "m", name: "Bildweite", si: {wert: 200, einheit: "cm"}}],
   gesucht: {g: "B", einheit: "cm", name: "Bildgröße"},
   formel: MASS,
   formelAblenker: [{f: "B : G = g : b", warum: "Vertauscht: Das Bild ist so viel Mal größer als das Dia, wie die Leinwand weiter von der Linse entfernt ist als das Dia – also gehört b zu B."},
                    {f: "B − G = b − g", warum: "Es geht um ein **Verhältnis** (wie viel Mal größer), nicht um einen Unterschied. Darum wird geteilt, nicht abgezogen."}],
   umgestellt: "B = G · b : g",
   umstellAblenker: [{f: "B = G · g : b", warum: "Dann würde das Bild **kleiner**, je weiter die Leinwand entfernt ist – beim Projektor ist es umgekehrt. Richtig: B = G · b : g."},
                     {f: "B = b : g", warum: "Du hast G vergessen: b : g sagt nur, **wie viel Mal** größer das Bild ist. Die Bildgröße bekommst du erst, wenn du diesen Faktor mit G malnimmst."}],
   umstellWeg: "B : G = b : g  | · G  →  B = G · b : g",
   einsetzen: "B = 2,5 cm · 200 cm : 5 cm", ergebnis: {wert: 100, einheit: "cm"},
   tipps: ["Rechne zuerst die Bildweite in cm um (1 m = 100 cm), damit b und g dieselbe Einheit haben. Dann B = G · b : g.", "B = 2,5 cm · 200 cm : 5 cm",
           "200 cm : 5 cm = 40 → B = 2,5 cm · 40 = … cm"], loesung: "b = 2 m = 200 cm; B = G · b : g = 2,5 cm · 200 cm : 5 cm = 100 cm",
   antwort: "Das Bild auf der Leinwand ist 100 cm hoch.", antwortAnfang: "Das Bild auf der Leinwand …", einheitAuch: ["m", "mm"],
   plausibel: {frage: "Ist ein 100 cm hohes Bild eines 2,5 cm hohen Dias plausibel?",
     optionen: ["Ja – die Leinwand ist 40-mal so weit von der Linse entfernt wie das Dia, also ist auch das Bild 40-mal so hoch.", "Nein – ein Bild kann nie größer sein als der Gegenstand.",
                "Nein – mit derselben Linse ist das Bild immer gleich groß wie das Dia.", "Ja – eine Sammellinse vergrößert immer 40-fach."], richtig: 0,
     warum: [null, "Für f < g < 2f entsteht ein **vergrößertes**, reelles Bild – genau dafür baut man Projektoren.",
             "Die Bildgröße hängt vom Verhältnis b : g ab, nicht nur von der Linse. Gleich groß ist das Bild nur bei g = b = 2f.",
             "Der Faktor ist b : g und hängt von den Abständen ab: Rückt die Leinwand näher heran (und stellt man neu scharf), wird das Bild kleiner."],
     erklaerung: "b : g = 200 cm : 5 cm = 40. Darum ist das Bild 40-mal so hoch wie das Dia: 40 · 2,5 cm = 100 cm = 1 m."}},
  {titel: "Wo steht der Schirm?", text: "Ein 2 cm hoher Leuchtpfeil steht 14 cm vor einer Sammellinse. Auf dem Schirm entsteht ein scharfes Bild, das 5 cm hoch ist. Wie weit ist der Schirm von der Linse entfernt?",
   gegeben: [{g: "G", wert: 2, einheit: "cm", name: "Gegenstandsgröße"}, {g: "B", wert: 5, einheit: "cm", name: "Bildgröße"}, {g: "g", wert: 14, einheit: "cm", name: "Gegenstandsweite"}],
   gesucht: {g: "b", einheit: "cm", name: "Bildweite"},
   formel: MASS,
   formelAblenker: [{f: "B : G = g : b", warum: "Ein großes Bild entsteht weit hinter der Linse: Bildgröße und **Bildweite** gehören zusammen, also B : G = b : g."},
                    {f: "B : G = b · g", warum: "Rechts steht wie links ein Verhältnis: Bildweite **geteilt** durch Gegenstandsweite."}],
   umgestellt: "b = B · g : G",
   umstellAblenker: [{f: "b = G · g : B", warum: "Dann stünde der Schirm bei einem größeren Bild näher an der Linse – es ist umgekehrt. Aus B : G = b : g folgt durch Malnehmen mit g: b = B · g : G."},
                     {f: "b = B : G : g", warum: "g steht bei b unter dem Bruchstrich. Um es wegzubekommen, nimmst du beide Seiten **mal g** – du teilst nicht durch g."}],
   umstellWeg: "B : G = b : g  | · g  →  B · g : G = b  →  b = B · g : G",
   einsetzen: "b = 5 cm · 14 cm : 2 cm", ergebnis: {wert: 35, einheit: "cm"},
   tipps: ["Stelle nach der Bildweite um: b = B · g : G.", "b = 5 cm · 14 cm : 2 cm", "5 cm : 2 cm = 2,5 → b = 2,5 · 14 cm = … cm"], loesung: "b = B · g : G = 5 cm · 14 cm : 2 cm = 35 cm",
   antwort: "Der Schirm ist 35 cm von der Linse entfernt.", antwortAnfang: "Der Schirm …", einheitAuch: ["m", "mm"]},
  {titel: "Das Foto vom Baum", text: "Du fotografierst einen Baum, der 25 m entfernt ist. Auf dem Bildsensor ist sein Bild 1,2 cm hoch, es entsteht 5 cm hinter dem Objektiv. Wie hoch ist der Baum?",
   gegeben: [{g: "g", wert: 25, einheit: "m", name: "Gegenstandsweite", si: {wert: 2500, einheit: "cm"}}, {g: "B", wert: 1.2, einheit: "cm", name: "Bildgröße"}, {g: "b", wert: 5, einheit: "cm", name: "Bildweite"}],
   gesucht: {g: "G", einheit: "cm", name: "Gegenstandsgröße"},
   formel: MASS,
   formelAblenker: [{f: "B : G = g : b", warum: "Beim Fotografieren ist das Bild winzig, weil es sehr nah hinter der Linse entsteht: kleine Bildweite b → kleines Bild B. Darum gehört b zu B."},
                    {f: "G = B · b", warum: "Dieses Produkt ergäbe cm · cm, also eine Fläche und keine Höhe. Der Zusammenhang ist das Verhältnis B : G = b : g."}],
   umgestellt: "G = B · g : b",
   umstellAblenker: [{f: "G = B · b : g", warum: "b und g sind vertauscht. Der Baum steht viel weiter weg, als das Bild hinter der Linse liegt – darum ist er viel größer als sein Bild: G = B · g : b."},
                     {f: "G = b · g : B", warum: "Mach die Probe: Bei b = g muss G = B herauskommen (gleich groß). Mit b = g = 30 cm und B = 5 cm liefert diese Formel aber 180 cm."}],
   umstellWeg: "B : G = b : g  | · G  →  B = G · b : g  | · g  →  B · g = G · b  | : b  →  G = B · g : b",
   einsetzen: "G = 1,2 cm · 2500 cm : 5 cm", ergebnis: {wert: 600, einheit: "cm"},
   tipps: ["Rechne die Gegenstandsweite in cm um (1 m = 100 cm) und stelle nach G um: G = B · g : b.", "G = 1,2 cm · 2500 cm : 5 cm", "2500 cm : 5 cm = 500 → G = 1,2 cm · 500 = … cm"],
   loesung: "g = 25 m = 2500 cm; G = B · g : b = 1,2 cm · 2500 cm : 5 cm = 600 cm = 6 m",
   antwort: "Der Baum ist 600 cm, also 6 m hoch.", antwortAnfang: "Der Baum …", einheitAuch: ["m", "mm"],
   plausibel: {frage: "Ist ein 600 cm hoher Baum plausibel?",
     optionen: ["Ja – g ist 500-mal so groß wie b, also ist der Baum 500-mal so hoch wie sein Bild. 6 m sind für einen Baum normal.", "Nein – ein Gegenstand kann nicht größer sein als sein Bild.",
                "Nein – der Baum müsste 25 m hoch sein, weil er 25 m entfernt ist.", "Ja – 600 cm ist genau die Gegenstandsweite."], richtig: 0,
     warum: [null, "Beim Fotoapparat ist g > 2f: Das Bild ist **verkleinert** – der Gegenstand ist also viel größer als sein Bild.",
             "Aus der Entfernung allein folgt keine Höhe. Erst das Verhältnis g : b zusammen mit der Bildgröße B ergibt G.",
             "Die Gegenstandsweite ist 2500 cm (25 m). Die Höhe G und der Abstand g sind verschiedene Größen."],
     erklaerung: "g : b = 2500 cm : 5 cm = 500. Der Baum ist also 500-mal so hoch wie sein Bild: 500 · 1,2 cm = 600 cm = 6 m."}}
];
const umstellen = [
  {formel: MASS, loesung: "B = G · b : g", text: "Abbildungsmaßstab: Das Bild ist so viel Mal größer als der Gegenstand, wie die Bildweite größer ist als die Gegenstandsweite.",
   typisch: [{f: "B = G · g : b", warum: "b und g sind vertauscht. Zur Bildgröße gehört die **Bildweite**: B = G · b : g."},
             {f: "B = b : g", warum: "G fehlt: b : g ist nur der Faktor, **wie viel Mal** größer das Bild ist. Nimm ihn mit G mal."},
             {f: "B = b : g : G", warum: "Links wird B durch G geteilt. Das machst du rückgängig, indem du beide Seiten **mit G malnimmst** – nicht, indem du noch einmal durch G teilst."}],
   weg: "B : G = b : g  | · G  →  B = G · b : g", tipps: ["Links wird B durch G geteilt. Multipliziere beide Seiten mit G.", "Dann steht B allein: B = b : g · G – schöner geschrieben B = G · b : g."]},
  {formel: MASS, loesung: "g = G · b : B",
   typisch: [{f: "g = B · b : G", warum: "B und G sind vertauscht. Probe: Bei einem vergrößerten Bild (B > G) muss g **kleiner** als b sein – mit dieser Formel würde g größer."},
             {f: "g = b : B : G", warum: "Hier fehlt eine Klammer: Du teilst b durch B und das Ergebnis noch einmal durch G. Gemeint ist g = b : (B : G) – und durch einen Bruch teilt man, indem man mit dem Kehrwert malnimmt: g = G · b : B."}],
   weg: "B : G = b : g  | · g  →  B · g : G = b  | · G  →  B · g = G · b  | : B  →  g = G · b : B",
   tipps: ["g steht unter dem Bruchstrich. Multipliziere zuerst beide Seiten mit g.", "Jetzt steht da B · g : G = b. Multipliziere mit G und teile dann durch B."]},
  {formel: "g = 2 · f", loesung: "f = g : 2", text: "Gleich großes Bild: Gegenstand und Bild stehen in der doppelten Brennweite, g = b = 2 · f.",
   typisch: [{f: "f = 2 · g", warum: "f ist **kleiner** als g: Wenn g das Doppelte von f ist, dann ist f die Hälfte von g. „Mal 2“ machst du mit „: 2“ rückgängig."},
             {f: "f = 2 : g", warum: "Vertauscht: Nicht 2 wird durch g geteilt, sondern g durch 2. Probe: g = 36 cm ergibt f = 18 cm – diese Formel ergäbe 2 : 36."}],
   weg: "g = 2 · f  | : 2  →  g : 2 = f  →  f = g : 2", tipps: ["Rechts wird f mit 2 malgenommen.", "Mach das auf beiden Seiten rückgängig: Teile durch 2."]}
];
const fehlersuche = [
  {titel: "Das Bild auf dem Schirm", aufgabe: "Eine 4 cm hohe Kerze steht 12 cm vor einer Sammellinse. Ihr scharfes Bild entsteht auf einem Schirm 36 cm hinter der Linse. Berechne die Höhe des Bildes.",
   zeilen: ["Gegeben: G = 4 cm; g = 12 cm; b = 36 cm", "Gesucht: B", "B = G · g : b", "B = 4 cm · 12 cm : 36 cm", "B ≈ 1,3 cm"], falsch: 2,
   zeilenOk: ["Die Angaben stimmen mit dem Aufgabentext überein.", "Gesucht ist die Höhe des Bildes, also die Bildgröße B – richtig."],
   optionen: ["Die Formel ist falsch umgestellt: b und g sind vertauscht, richtig ist B = G · b : g.", "Die Längen müssen erst in Meter umgerechnet werden.",
              "Gesucht ist nicht B, sondern die Brennweite f.", "Man darf die Kerzenhöhe nicht mit einer Länge malnehmen."], richtig: 0,
   warum: [null, "Umrechnen ist nicht nötig: Alle Längen stehen schon in cm, und im Verhältnis b : g kürzt sich die Einheit ohnehin heraus.",
           "Gefragt ist die Höhe des Bildes – das ist die Bildgröße B, nicht die Brennweite.",
           "Doch, das ist erlaubt: cm · cm : cm ergibt wieder cm, also eine Länge. Der Fehler steckt darin, welche Größe im Zähler und welche im Nenner steht."],
   korrektur: {frage: "Wie hoch ist das Bild richtig?", wert: 12, einheit: "cm", toleranz: .1, tipps: ["B = G · b : g", "B = 4 cm · 36 cm : 12 cm"], loesung: "B = G · b : g = 4 cm · 36 cm : 12 cm = 12 cm"},
   erklaerung: "Der Schirm steht dreimal so weit von der Linse entfernt wie die Kerze – also ist das Bild **dreimal so hoch**. Ein Bild, das kleiner ist als die Kerze, hätte bei b > g stutzig machen müssen."},
  {titel: "Das Foto in der Pause", aufgabe: "Eine 160 cm große Mitschülerin steht 8 m vor dem Objektiv einer Kamera. Ihr scharfes Bild entsteht 4 cm hinter dem Objektiv. Wie groß ist das Bild auf dem Bildsensor?",
   zeilen: ["Gegeben: G = 160 cm; g = 8 m; b = 4 cm", "Gesucht: B", "B = G · b : g", "B = 160 cm · 4 cm : 8 cm", "B = 80 cm"], falsch: 3,
   zeilenOk: ["Die Angaben sind richtig aus dem Text übernommen – g steht hier noch in Metern.", "Gesucht ist die Bildgröße B.", "B = G · b : g ist richtig aus B : G = b : g umgestellt."],
   optionen: ["g wurde nicht umgerechnet: 8 m sind 800 cm, eingesetzt wurden aber 8 cm.", "Die Formel muss B = G · g : b heißen.",
              "Man muss G und b addieren, nicht malnehmen.", "Die Bildweite muss in Meter eingesetzt werden, dann stimmen die 80 cm."], richtig: 0,
   warum: [null, "Die Formel in Zeile 3 stimmt: Zur Bildgröße gehört die Bildweite. Der Fehler passiert erst beim Einsetzen.",
           "Addieren ergibt keinen Sinn: Der Abbildungsmaßstab ist ein **Verhältnis**, darum wird malgenommen und geteilt.",
           "Setzt du in Zeile 4 nur b in Meter ein, stehen 0,04 m und 8 cm nebeneinander – wieder zwei Einheiten. Stehen b und g beide in Meter, kommt dasselbe kleine Bild heraus wie in Zentimetern: 80 cm sind es in keiner Einheit."],
   korrektur: {frage: "Wie groß ist das Bild auf dem Sensor richtig?", wert: 0.8, einheit: "cm", toleranz: .02, tipps: ["Rechne zuerst um: g = 8 m = 800 cm.", "B = 160 cm · 4 cm : 800 cm"],
     loesung: "g = 8 m = 800 cm; B = G · b : g = 160 cm · 4 cm : 800 cm = 0,8 cm"},
   erklaerung: "In einem Verhältnis wie b : g müssen beide Längen in **derselben Einheit** stehen. Ein 80 cm großes Bild hätte nie auf einen Bildsensor gepasst – der ist nur wenige Zentimeter groß."},
  {titel: "Das gleich große Bild", aufgabe: "Eine Kerze und ein Schirm stehen 64 cm auseinander. Genau in der Mitte steht eine Sammellinse, auf dem Schirm entsteht ein scharfes, gleich großes Bild der Kerze. Welche Brennweite hat die Linse?",
   zeilen: ["Gegeben: Abstand Kerze – Schirm 64 cm; Bild gleich groß (B = G)", "Gesucht: f", "Linse in der Mitte: g = b = 64 cm : 2 = 32 cm", "Ein gleich großes Bild entsteht bei g = f.", "f = g = 32 cm"], falsch: 3,
   zeilenOk: ["Die Angaben stimmen mit dem Aufgabentext überein.", "Gesucht ist die Brennweite f.", "Richtig: Steht die Linse in der Mitte, sind g und b gleich groß, je 32 cm."],
   optionen: ["Steht die Kerze im Brennpunkt (g = f), entsteht gar kein Bild. Gleich groß wird das Bild bei g = 2f.", "Die 64 cm dürfen nicht halbiert werden, es gilt g = 64 cm.",
              "Ein gleich großes Bild gibt es bei einer Sammellinse nicht.", "Gleich groß wird das Bild bei g = f : 2."], richtig: 0,
   warum: [null, "Das Halbieren in Zeile 3 stimmt: Die Linse steht in der Mitte, also teilen sich die 64 cm gleichmäßig auf g und b auf.",
           "Doch: Bei g = 2f ist auch b = 2f, und wegen B : G = b : g ist das Bild dann genau so groß wie die Kerze.",
           "Bei g = f : 2 stünde die Kerze innerhalb der Brennweite. Dann entsteht nur ein virtuelles Bild wie bei der Lupe – auf dem Schirm wäre nichts zu sehen."],
   korrektur: {frage: "Welche Brennweite hat die Linse richtig?", wert: 16, einheit: "cm", toleranz: .1, tipps: ["Gleich groß: g = b = 2 · f, also f = g : 2.", "f = 32 cm : 2"], loesung: "g = 2 · f → f = g : 2 = 32 cm : 2 = 16 cm"},
   erklaerung: "Ein scharfes, gleich großes Bild entsteht bei **g = b = 2f**. Dann ist der Abstand Kerze – Schirm genau 4f: Hier sind 64 cm = 4 · 16 cm."}
];

/* ---------- Rückmeldung je falscher Antwort (Quiz, Reihenfolge wie options in inhalt/optik2.json) ---------- */
// je Auswahlfrage ein Text pro Option, an der richtigen Antwort null; **fett** ist erlaubt (eine eigene Zeile bekommt nur die Überschrift „Warum nicht …?“ des Kerns)
const warum = {
  0: [null, "Der Mittelpunkt ist die Linsenmitte – dort geht der Mittelpunktstrahl ungebrochen hindurch. Paralleles Licht sammelt sich dagegen hinter der Linse auf der Achse.",
      "Der Nahpunkt gehört zum Auge: Er ist der kleinste Abstand, in dem man noch scharf sieht. Mit dem Bündeln von parallelem Licht hat er nichts zu tun.",
      "Der Fernpunkt beschreibt, bis zu welcher Entfernung ein Auge scharf sieht – er ist keine Eigenschaft einer Linse."],
  1: [null, "Das ist die Gegenstandsweite g – sie hängt davon ab, wo du den Gegenstand hinstellst. Die Brennweite ist dagegen eine feste Eigenschaft der Linse.",
      "Das ist die Bildweite b – sie ändert sich, wenn du den Gegenstand verschiebst. Die Brennweite einer Linse bleibt immer gleich.",
      "Die beiden Brennpunkte liegen links und rechts gleich weit von der Linse entfernt. Ihr Abstand ist also 2f, die doppelte Brennweite."],
  2: [null, "In der Mitte dünner ist eine Zerstreuungslinse: Sie lässt paralleles Licht auseinanderlaufen, statt es zu bündeln.",
      "Eine überall gleich dicke Glasplatte bündelt Licht nicht: Das Licht verlässt sie in derselben Richtung, in der es eingefallen ist.",
      "Ohne gewölbte Flächen wird Licht nicht gesammelt – wie bei einer Fensterscheibe läuft es in der alten Richtung weiter. Erst die Wölbung macht die Linse."],
  3: [null, "So verläuft der Brennpunktstrahl, der vor der Linse durch F geht. Ein Strahl durch die Linsenmitte wird gar nicht abgelenkt.",
      "Das macht der Parallelstrahl, der parallel zur Achse einfällt. Der Strahl durch die Linsenmitte ändert seine Richtung nicht.",
      "Zurückwerfen ist Reflexion wie am Spiegel. Eine Linse lässt das Licht hindurch und bricht es – in der Mitte sogar ohne Knick."],
  4: [null, "Durch den Brennpunkt hinter der Linse läuft der Parallelstrahl. Der Brennpunktstrahl macht es genau umgekehrt.",
      "Geradeaus geht nur der Strahl durch die Linsenmitte. Ein Strahl durch F trifft die Linse außerhalb der Mitte und wird gebrochen.",
      "Eine Linse wirft das Licht nicht zurück – sie bricht es, und das Licht läuft auf der anderen Seite weiter."],
  5: [null, "Virtuell, aufrecht und seitenrichtig ist das Bild der Lupe (g < f). Ein Bild auf einem Schirm muss reell sein – dort treffen sich die Strahlen wirklich.",
      "Reell stimmt. Aber die Strahlen von oben und unten kreuzen sich auf dem Weg durch die Linse – deshalb steht das Bild auf dem Kopf.",
      "Ein virtuelles Bild kann man nicht auf einem Schirm auffangen. Weil dieses Bild auf dem Schirm erscheint, ist es reell."],
  6: [null, "Die Hornhaut ist durchsichtig und bricht das Licht stark, ihre Größe kann sie aber nicht verändern – die Lichtmenge regelt sie nicht.",
      "Auf der Netzhaut empfangen Sinneszellen das Licht. Wie viel Licht überhaupt ins Auge kommt, entscheidet sich schon vorne an der Pupille.",
      "Der Glaskörper ist eine durchsichtige Gallerte, die das Auge in Form hält. Eine verstellbare Öffnung hat er nicht."],
  7: [null, "Die Hornhaut sitzt ganz vorne: Sie bricht das Licht schon stark, aber die Strahlen treffen sich dort noch nicht. Das Bild entsteht erst hinten im Auge.",
      "Die Augenlinse bündelt das Licht wie eine Sammellinse. Ein Bild entsteht aber erst dort, wo sich die Strahlen treffen – ein Stück hinter der Linse.",
      "Durch den Glaskörper läuft das Licht nur hindurch. Scharf wird das Bild an der Rückwand des Auges, wo die Sinneszellen sitzen."],
  8: [null, "Die Iris liegt vorne im Auge und begrenzt nur die Pupille. Auf den blinden Fleck fällt durchaus Licht – es wird dort nur nicht wahrgenommen.",
      "Die Augenlinse ist durchsichtig und lässt das Licht aller Gegenstände hindurch. Die Ursache des blinden Flecks liegt in der Netzhaut selbst.",
      "Ein Bild vor der Netzhaut ist das Problem bei Kurzsichtigkeit – dann ist alles Ferne unscharf, nicht nur eine Stelle. Der blinde Fleck ist eine bestimmte Stelle der Netzhaut."],
  11: [null, "Kleiner und näher wird das Bild, wenn du die Kerze weiter weg schiebst. Je näher sie dem Brennpunkt kommt, desto größer wird das Bild.",
       "Größer stimmt. Wegen B : G = b : g wächst das Bild aber nur, wenn auch die Bildweite b wächst – der Schirm muss also weiter weg.",
       "Bildweite und Bildgröße hängen von der Gegenstandsweite ab. Änderst du g, musst du den Schirm verschieben, um wieder ein scharfes Bild zu bekommen."],
  12: [null, "Steht der Gegenstand im Brennpunkt, verlässt das Licht die Linse parallel – es entsteht gar kein Bild.",
       "Innerhalb der Brennweite gibt es kein reelles Bild, nur ein virtuelles wie bei der Lupe – und das ist vergrößert.",
       "Steht der Gegenstand weiter weg als 2f, liegt das Bild zwischen f und 2f. Dann ist b kleiner als g und das Bild verkleinert (Fotoapparat)."],
  13: [null, "Gleich groß wird das Bild bei g = 2f, nicht bei g = f. Im Brennpunkt hinter der Linse sammelt sich nur Licht, das parallel zur Achse einfällt.",
       "Ein winziges Bild nahe am Brennpunkt entsteht bei sehr weit entfernten Gegenständen. Je näher der Gegenstand an F rückt, desto weiter weg und größer wird das Bild.",
       "Ein virtuelles, aufrechtes Bild liefert die Sammellinse nur für g < f – und dann ist es vergrößert. Bei g = f liegt der Gegenstand genau an der Grenze."],
  14: [null, "Auch ein schwaches reelles Bild kann man auf Papier auffangen. Hinter der Lupe laufen die Strahlen aber auseinander – auf dem Blatt käme nur verschwommenes Licht an.",
       "Gerade weil die Lupe das Licht bricht, vergrößert sie: Die gebrochenen Strahlen scheinen von einem größeren Gegenstand zu kommen.",
       "An der Größe liegt es nicht – auch das riesige reelle Bild eines Beamers passt an die Wand. Entscheidend ist, ob sich die Strahlen wirklich schneiden."],
  15: [null, "Weil das Bild umgekehrt ist, liegt der Gedanke nahe, die untere Linsenhälfte sei für die obere Bildhälfte zuständig. Tatsächlich erzeugt jede Linsenhälfte für sich das ganze Bild.",
       "Die Pappe verdeckt nur einen Teil der Linse, nicht einen Teil der Kerze. Nur wenn du einen Teil des Gegenstands abdeckst, fehlt auch ein Teil des Bildes.",
       "Die Bildgröße hängt nur von b : g ab – daran ändert die Pappe nichts. Was sich ändert, ist die Lichtmenge, die durch die Linse kommt."],
  16: [null, "Umgekehrt: Eine stärker gewölbte Linse bricht das Licht stärker – die Strahlen treffen sich deshalb schon näher an der Linse.",
       "Die Brennweite hängt nicht nur vom Glas ab, sondern auch von der Form der Linse. Eine stärkere Wölbung lenkt das Licht stärker ab.",
       "Jede Sammellinse hat Brennpunkte – auch eine stark gewölbte. Bei ihr liegen sie nur näher an der Linse."],
  17: [null, "Die Hornhaut liegt vor der Augenlinse und hilft beim Bündeln. Hinter der Linse dreht nichts das Bild zurück – auf der Netzhaut steht es wirklich auf dem Kopf.",
       "Der Glaskörper ist durchsichtig und gleichmäßig – er lenkt das Licht nicht mehr um. Das Bild auf der Netzhaut bleibt umgekehrt.",
       "Die Pupille ist nur eine Öffnung in der Iris – sie spiegelt nichts. Aufrecht wird das Bild erst bei der Verarbeitung der Signale."],
  18: [null, "Flacher und kleinere Brennweite passen nicht zusammen: Eine flachere Linse bricht schwächer und hat eine größere Brennweite.",
       "Stärker gewölbt stimmt – aber eine stärker gewölbte Linse bricht stärker, ihre Brennweite wird kleiner, nicht größer.",
       "So stellt sich das Auge auf die Ferne ein: Ziliarmuskel entspannt, Linse flach. Für das nahe Buch muss das Licht stärker gebrochen werden."],
  19: [null, "Vor der Netzhaut liegt das Bild bei Kurzsichtigkeit (Augapfel zu lang). Ist der Augapfel zu kurz, trifft das Licht auf die Netzhaut, bevor sich die Strahlen vereinigt haben.",
       "Dann sähe der Weitsichtige auch nahe Dinge scharf – er hätte gar keinen Sehfehler. Gerade weil das scharfe Bild nicht auf der Netzhaut liegt, ist Nahes unscharf.",
       "Der blinde Fleck ist eine feste Stelle der Netzhaut, an der der Sehnerv austritt – mit Weitsichtigkeit hat er nichts zu tun."],
  20: [null, "Bündeln ist die Aufgabe einer Sammellinse – das würde das Bild noch weiter nach vorn schieben. Das kurzsichtige Auge bündelt ohnehin schon zu stark.",
       "Eine Brille soll die Unschärfe beseitigen, nicht verstecken. Unscharf ist das Bild, weil es an der falschen Stelle entsteht – die Brille muss es verschieben.",
       "Die Pupille wird von der Iris geregelt, nicht von der Brille. Eine Brille verändert, wo das Licht gebündelt wird."],
  21: [null, "Nur das Auge kann die Wölbung seiner Linse verändern (Akkommodation). Die Glaslinse eines Objektivs ist starr, ihre Brennweite bleibt fest.",
       "Die Blende regelt wie die Iris die Lichtmenge. Zum Scharfstellen muss die Kamera den Abstand zwischen Objektiv und Sensor anpassen.",
       "Die Richtung stimmt nicht: Je näher der Gegenstand, desto weiter hinter der Linse entsteht das Bild. Der Abstand zum Sensor muss also größer werden."],
  27: [null, "Innerhalb der Brennweite wirkt die Linse als Lupe: Das Bild ist virtuell und erscheint nicht auf der Leinwand.",
       "Bei g = 10 cm = 2f entsteht ein gleich großes Bild – ein Projektor soll aber vergrößern.",
       "Weiter weg als 2f = 10 cm wird das Bild verkleinert – so arbeitet ein Fotoapparat, kein Projektor."],
  28: [null, "16 cm ist genau 2f: Dort entsteht ein reelles, gleich großes, umgekehrtes Bild. Eine Lupe muss näher als ihre Brennweite an der Briefmarke sein.",
       "12 cm ist mehr als f = 8 cm. Sobald der Abstand größer als die Brennweite ist, wirkt die Linse nicht mehr als Lupe – das Bild steht dann auf dem Kopf.",
       "Bei 20 cm (mehr als 2f) entsteht ein verkleinertes, umgekehrtes Bild – das Gegenteil von dem, was eine Lupe soll."],
  29: [null, "Zerstreuungslinsen helfen Kurzsichtigen, die in der Ferne unscharf sehen. Großvaters Auge bündelt in der Nähe zu schwach – es braucht zusätzliche Sammelwirkung.",
       "Dunkle Gläser verringern nur die Lichtmenge. An der Lage des Bildes im Auge ändern sie nichts.",
       "Ebene Glasscheiben bündeln das Licht nicht – an der Unschärfe in der Nähe würden sie nichts ändern."]
};

R3D.lern.raum("optik2", {
  raetsel, suchbild,
  // Rechenwerkstatt: Tafel vorne rechts (die Suchbild-Staffelei steht vorne links) + Knopf an Station 3
  uebung: {ort: {x: 3.6, z: -9.5, ry: 0}, formel: MASS},
  rechenweg, umstellen, fehlersuche, warum,
  spick: {
    kern: ["Sammellinse (in der Mitte dicker): Licht **parallel zur optischen Achse** trifft sich im **Brennpunkt F**; **Brennweite f** = Abstand von F zur Linsenmitte",
           "Konstruktionsstrahlen: **Parallelstrahl** → danach durch F · **Mittelpunktstrahl** → geradeaus · **Brennpunktstrahl** → danach parallel zur Achse",
           "g > 2f: verkleinert · g = 2f: gleich groß · f < g < 2f: vergrößert – jeweils **reell, umgekehrt** · g = f: kein Bild · g < f: **Lupe**, virtuell, aufrecht, vergrößert",
           "Abbildungsmaßstab: **B : G = b : g**",
           "Auge: Hornhaut und Linse erzeugen auf der **Netzhaut** ein reelles, umgekehrtes, verkleinertes Bild; die **Iris** regelt mit der Pupille die Lichtmenge · **Akkommodation**: Für die Nähe wölbt sich die Linse stärker (Ziliarmuskel), ihre Brennweite wird kleiner",
           "Kurzsichtig (Bild vor der Netzhaut) → **Zerstreuungslinse** · Weitsichtig (Bild hinter der Netzhaut) → **Sammellinse**"],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn, wie du mit Konstruktionsstrahlen das Bild einer Kerze an einer Sammellinse findest und wovon seine Größe abhängt.",
       begriffe: [["Parallelstrahl", "parallel"], ["Mittelpunktstrahl", "Mittelpunkt", "Linsenmitte", "geradeaus"], ["Brennpunkt"], ["schneiden", "schneid", "Schnittpunkt", "treff", "trifft", "kreuz"],
                  ["umgekehrt", "auf dem Kopf", "kopfüber", "umgedreht"], ["reell", "Schirm"], ["Abbildungsmaßstab", "b : g", "b:g", "b/g", "Bildweite"]],
       muster: "Von der Kerzenspitze zeichne ich drei Strahlen: Der **Parallelstrahl** läuft nach der Linse durch den **Brennpunkt** F, der **Mittelpunktstrahl** geht **geradeaus** durch die Linsenmitte, der **Brennpunktstrahl** läuft danach **parallel** zur Achse. Wo sich die Strahlen **schneiden**, liegt die Spitze des Bildes. Für g > f ist es **reell** (auf einem Schirm auffangbar) und **umgekehrt**. Seine Größe folgt aus dem **Abbildungsmaßstab** B : G = b : g."},
      {frage: "Erkläre, warum ein kurzsichtiger Mensch Fernes unscharf sieht und wie ihm eine Brille hilft.",
       begriffe: [["Augapfel"], ["zu lang", "länger", "langgestreckt", "lang gebaut"], ["vor der Netzhaut", "vor die Netzhaut"], ["unscharf", "verschwommen"], ["Zerstreuungslinse", "zerstreu"],
                  ["auseinander", "dünner", "dünn", "streut"], ["nach hinten", "hinten", "weiter weg"]],
       muster: "Beim kurzsichtigen Auge ist der **Augapfel zu lang**. Licht von fernen Gegenständen wird schon **vor der Netzhaut** gebündelt, auf der Netzhaut entsteht nur ein **unscharfer** Fleck. Eine **Zerstreuungslinse** (in der Mitte **dünner** als am Rand) lässt das Licht vor dem Auge etwas **auseinanderlaufen** – dadurch rückt das Bild **nach hinten** genau auf die Netzhaut."}
    ]
  },
  zuordnung: {
    "Das Brennglas – warum F „Brennpunkt“ heißt": [0],
    "Sammellinse, Brennpunkt und Brennweite": [1, 3, 4],
    "Sammellinse und Zerstreuungslinse": [2],
    "Bilder an der Sammellinse": [5, 11, 12, 13, 15, 22, 23, 24, 26, 27],
    "Die Lupe": [14, 28],
    "Das Auge – ein optisches System": [6, 7, 8, 9, 10, 16, 17, 18],
    "Kurzsichtigkeit und Weitsichtigkeit": [19, 20, 29],
    "Kamera und Auge": [21, 25]
  },
  // Quiz 22: b : g = 0,5 ist zufällig der Kehrwert von B = 2 cm – dort keinen Kehrwert-Hinweis („vertauscht?“) geben
  ohneKehrwert: [22],
  hilfen: {
    22: ["Abbildungsmaßstab: B : G = b : g, also B = G · b : g.", "Einsetzen: B = 4 cm · 15 cm : 30 cm", "15 cm : 30 cm = 0,5 → B = 4 cm · 0,5 = … cm"],
    23: ["Ein gleich großes Bild entsteht, wenn g = b = 2f ist.", "Hier ist also 2f = 24 cm.", "f = 24 cm : 2 = … cm"],
    24: ["Abbildungsmaßstab: B : G = b : g, also B = G · b : g.", "Einsetzen: B = 3,6 cm · 250 cm : 10 cm", "250 cm : 10 cm = 25 → B = 3,6 cm · 25 = … cm"],
    25: ["B : G = b : g, also B = b · G : g. Bilde zuerst G : g – dabei kürzen sich die Meter weg.", "G : g = 18 m : 30 m = 0,6", "B = 5 cm · 0,6 = … cm"],
    26: ["Abbildungsmaßstab: B : G = b : g. Das Bild soll 4-mal so groß sein, also b : g = 4.", "Daraus folgt b = 4 · g mit g = 15 cm.", "b = 4 · 15 cm = … cm"]
  }
});
})();
