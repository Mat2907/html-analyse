/* ---------- 40_lern_kraft2.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum 8 (Kap. 4.4–4.6: Trägheitssatz, Kraft und Verformung, schiefe Ebene)
   Türrätsel „Das Federschloss an der Rampe“ · Suchbild „Umzug mit Hindernissen“ · Lernzettel · Fehler → Exponat · Tipps zu Rechenaufgaben
   (Das Labor sitzt am Exponat „Hookesches Gesetz: F = D · s“ in 20_kraft2.js.)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;
const TAU = Math.PI * 2;
const COL = {G: "#ff5b47", H: "#4f9dff", N: "#3ad57f", S: "#ffb02e"};   // wie die Kraftpfeile im Raum

/* ---------- kleine Zeichenhilfen ---------- */
const nk = (x, d = 2) => String(+(+x).toFixed(d)).replace(".", ",");
const gl = (x, d) => Math.abs(+(+x).toFixed(d) - x) > 1e-9 ? "≈" : "=";   // gerundeter Wert → „≈“, exakter → „=“
const line = (g, pts, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.setLineDash(dash || []); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]); };
const poly = (g, pts, fill) => { g.fillStyle = fill; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
// Text mit Tiefstellung: "F_{H} = 150 N"
function tx(g, s, x, y, size, col, align = "center", weight = 600){
  const parts = []; String(s).replace(/_\{([^}]*)\}|[^_]+|_/g, (m, sub) => { parts.push(sub != null ? [sub, 1] : [m, 0]); return m; });
  const fN = `${weight} ${size}px system-ui, sans-serif`, fS = `${weight} ${Math.round(size * .66)}px system-ui, sans-serif`;
  let w = 0; for (const [t, b] of parts) { g.font = b ? fS : fN; w += g.measureText(t).width; }
  let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; g.fillStyle = col; g.textAlign = "left"; g.textBaseline = "middle";
  for (const [t, b] of parts) { g.font = b ? fS : fN; g.fillText(t, cx, y + (b ? size * .28 : 0)); cx += g.measureText(t).width; }
  return w;
}
// Text mit dunklem Schild dahinter (lesbar über Pfeilen und Linien)
function tag(g, s, x, y, size, col, bg = "rgba(16,19,26,.86)", align = "center"){
  g.save(); g.globalAlpha = 0; const w = tx(g, s, 0, 0, size, col); g.restore();
  const x0 = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  g.fillStyle = bg; g.beginPath(); g.roundRect(x0 - 8, y - size * .72, w + 16, size * 1.44, 8); g.fill(); tx(g, s, x0, y, size, col, "left");
}
function arrow(g, x1, y1, x2, y2, col, w = 6){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 3) return; const a = Math.atan2(y2 - y1, x2 - x1), hl = Math.min(w * 3.4, L * .55);
  line(g, [[x1, y1], [x2 - Math.cos(a) * hl * .8, y2 - Math.sin(a) * hl * .8]], col, w);
  poly(g, [[x2, y2], [x2 - Math.cos(a - .42) * hl, y2 - Math.sin(a - .42) * hl], [x2 - Math.cos(a + .42) * hl, y2 - Math.sin(a + .42) * hl]], col);
}
// Schraubenfeder als Zickzack zwischen zwei Punkten
function spring(g, x1, y1, x2, y2, col, amp = 10, n = 12, lead = 12){
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux, pts = [[x1, y1]];
  const a = Math.min(lead, L * .2), body = L - 2 * a;
  pts.push([x1 + ux * a, y1 + uy * a]);
  for (let i = 0; i < n; i++) { const d = a + body * (i + .5) / n, s = i % 2 ? -1 : 1; pts.push([x1 + ux * d + nx * amp * s, y1 + uy * d + ny * amp * s]); }
  pts.push([x2 - ux * a, y2 - uy * a], [x2, y2]); line(g, pts, col, 4);
}
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, 7); g.fill(); }

/* =====================================================================
   Türrätsel: Das Federschloss an der Rampe
   Wagen F_G = 800 N auf reibungsfreier Rampe l = 3,5 m, Feder D = 20 N/cm, Schloss öffnet bei s = 8,0 cm
   Lösung: F = D · s = 160 N = F_H → h : l = F_H : F_G = 1 : 5 → h = 0,70 m, Feder parallel zur Ebene
   (bewusst andere Zahlen als Quiz 28 und Prüfungsaufgabe 5: dort 600 N, 1 : 4 → 150 N bzw. 480 N, 0,75 m : 3,0 m → 120 N)
   ===================================================================== */
const FG = 800, LR = 3.5, DF = 20, S_LOCK = 8;
const sOf = v => v.dir === 1 ? FG / DF : FG * v.h / LR / DF;   // senkrecht: Feder trägt die ganze Gewichtskraft
const anim = {x: null, v: 0, t: null, open: null};
const raetsel = {
  titel: "Das Federschloss an der Rampe",
  text: "Vor der Tür steht eine Rampe mit der Länge **l = 3,5 m**. Darauf steht ein Wagen mit der Gewichtskraft **F_{G} = 800 N**, der reibungsfrei rollt. Er hängt an einer Feder mit der Federhärte **D = 20 N/cm**, die den Riegel betätigt: Der Riegel springt nur auf, wenn die Feder im Gleichgewicht **genau s = 8,0 cm** gedehnt ist. Spanne die Feder richtig und stelle die Höhe h der Rampe ein.",
  regler: [{id: "h", name: "Höhe h der Rampe", einheit: "m", min: .1, max: 1.5, schritt: .05, wert: 1.2},
           {id: "dir", name: "Feder spannen", optionen: ["parallel zur Ebene (hangaufwärts)", "senkrecht nach oben"], wert: 0}],
  zeichne(g, w, h, v, t, ok){
    g.fillStyle = "#10131a"; g.fillRect(0, 0, w, h);
    // Feder-Dehnung mit gedämpfter Schwingung zum neuen Gleichgewicht
    const sT = sOf(v), dt = anim.t == null ? 0 : Math.max(0, Math.min(.05, t - anim.t)); anim.t = t;
    if (anim.x == null) anim.x = sT; anim.v += (70 * (sT - anim.x) - 5 * anim.v) * dt; anim.x += anim.v * dt; const sx = Math.max(0, anim.x);
    if (ok && anim.open == null) anim.open = t; if (!ok) anim.open = null;
    const vert = v.dir === 1, al = Math.asin(v.h / LR), c = Math.cos(al), sn = Math.sin(al), GY = 450, HX = 90, LP = 540, K = 4, R0 = 80, k = .15;
    // K: Federlänge in px je cm Dehnung (senkrecht gespannt passen 40 cm unter die Überschrift) · k: Pfeilmaßstab in px/N (F_G bleibt auch bei flacher Rampe im Bild)
    const P = (u, q) => [HX + u * c - q * sn, GY - u * sn - q * c];
    tx(g, "Federschloss · öffnet bei s = 8,0 cm", 30, 40, 28, "#ffe9a8", "left", 700);
    tx(g, "F_{G} = 800 N · l = 3,5 m · D = 20 N/cm", 30, 80, 22, "#d9dde6", "left", 600);
    // Boden, Rampe, Stütze, Maße
    line(g, [[30, GY + 2], [880, GY + 2]], "#5b6474", 4);
    const E = P(LP, 0); poly(g, [P(0, 0), E, P(LP, -14), P(0, -14)], "#8a6a45"); line(g, [P(0, 0), E], "#c9a46c", 4);
    g.fillStyle = "#5b4630"; g.fillRect(E[0] - 9, E[1] + 10, 18, GY - E[1] - 10);
    g.fillStyle = "#c9a46c"; g.beginPath(); g.arc(HX, GY, 9, 0, TAU); g.fill();
    const dx = E[0] + 26; line(g, [[dx, GY], [dx, E[1]]], "#d9dde6", 3); line(g, [[dx - 9, GY], [dx + 9, GY]], "#d9dde6", 3); line(g, [[dx - 9, E[1]], [dx + 9, E[1]]], "#d9dde6", 3);
    tx(g, `h = ${nk(v.h)} m`, dx + 14, Math.min(GY - 22, (GY + E[1]) / 2), 24, "#ffffff", "left", 700);
    // Tür mit Schloss (rechts)
    const op = anim.open == null ? 0 : Math.min(1, (t - anim.open) / .7);
    g.fillStyle = "#4a505e"; g.fillRect(792, 214, 96, GY - 212); g.fillStyle = ok ? "#1e3a2b" : "#3a2420"; g.fillRect(814, 230, 66, GY - 230);
    g.strokeStyle = ok ? "#5fd38d" : "#b0473b"; g.lineWidth = 3; g.strokeRect(814, 230, 66, GY - 230);
    g.fillStyle = "#d9d9d9"; g.fillRect(796 + op * 30, 340, 40, 14); g.fillStyle = "#23272f"; g.fillRect(794, 336, 6, 22);   // Riegel fährt aus dem Schließblech zurück
    const pul = ok ? 1 : .8 + .2 * Math.sin(t * 4); g.save(); g.globalAlpha = pul; lockIcon(g, 847, 300, 48, ok, ok ? "#5fd38d" : "#ff5a48"); g.restore();
    if (ok) tx(g, "offen", 847, 400, 24, "#5fd38d", "center", 700);
    // Anzeige der Dehnung (oben rechts) mit Schlossmarke
    const gx0 = 560, gx1 = 850, gy = 108, sMax = 40, X = s => gx0 + Math.min(s, sMax + .6) / sMax * (gx1 - gx0);   // bis 40 cm: senkrecht gespannt trägt die Feder ganz F_G
    g.fillStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.roundRect(540, 34, 330, 122, 12); g.fill();
    tx(g, "Dehnung", 556, 58, 22, "#d9dde6", "left", 600); tx(g, `s ${gl(sT, 1)} ${sT.toFixed(1).replace(".", ",")} cm`, 856, 58, 24, Math.abs(sT - S_LOCK) < 1e-6 ? "#5fd38d" : "#ffe9a8", "right", 700);
    line(g, [[gx0, gy], [gx1, gy]], "#d9dde6", 3);
    for (let s = 0; s <= sMax; s++) { const big = s % 5 === 0; line(g, [[X(s), gy], [X(s), gy + (big ? 14 : 6)]], "#d9dde6", big ? 3 : 1.5); if (s % 10 === 0) tx(g, String(s), X(s), gy + 32, 22, "#d9dde6"); }
    line(g, [[X(S_LOCK), gy - 24], [X(S_LOCK), gy + 14]], "#ff5a48", 4); lockIcon(g, X(S_LOCK) + 17, gy - 18, 18, ok, ok ? "#5fd38d" : "#ff5a48");
    const nx = X(sx); poly(g, [[nx, gy - 2], [nx - 9, gy - 20], [nx + 9, gy - 20]], "#7fd8ff");
    if (sx > sMax) tx(g, "▶", gx1 + 12, gy, 22, "#ff5a48");
    // Wagen, Feder, Kräfte
    const cart = (uc, lift = 0) => { g.save(); const [ox, oy] = P(uc, lift); g.translate(ox, oy); g.rotate(-al);
      g.fillStyle = "#3b4252"; for (const x of [-30, 30]) { g.beginPath(); g.arc(x, -12, 12, 0, TAU); g.fill(); }
      g.fillStyle = "#c9a46c"; for (const x of [-30, 30]) { g.beginPath(); g.arc(x, -12, 4, 0, TAU); g.fill(); }
      g.fillStyle = "#6d8fb3"; g.fillRect(-50, -54, 100, 40); g.fillStyle = "#89a9cc"; g.fillRect(-50, -54, 100, 8);
      g.restore(); };
    if (!vert) {
      const ua = 500, Ls = R0 + K * sx, uc = ua - 4 - Ls - 52, hk = P(uc + 52, 34), an = P(ua - 4, 34);
      line(g, [P(ua, 0), P(ua, 48)], "#9aa3b2", 10); g.fillStyle = "#9aa3b2"; g.beginPath(); g.arc(...an, 6, 0, TAU); g.fill();
      cart(uc); spring(g, ...hk, ...an, COL.S, 9, 12, 10);
      // Kräfte im Schwerpunkt (Maßstab k) mit Kräfteparallelogramm
      const FH = FG * sn, FN = FG * c, cm = P(uc, 34), tG = [cm[0], cm[1] + FG * k], tH = [cm[0] - c * FH * k, cm[1] + sn * FH * k], tN = [cm[0] + sn * FN * k, cm[1] + c * FN * k];
      line(g, [tH, tG], "rgba(244,241,230,.75)", 2.5, [8, 7]); line(g, [tN, tG], "rgba(244,241,230,.75)", 2.5, [8, 7]);
      arrow(g, ...cm, ...tG, COL.G); arrow(g, ...cm, ...tN, COL.N); arrow(g, ...cm, ...tH, COL.H);
      g.fillStyle = "#fff"; g.beginPath(); g.arc(...cm, 6, 0, TAU); g.fill();
      const Fs = DF * sx, s0 = P(uc + 52, 64), tS = [s0[0] + c * Fs * k, s0[1] - sn * Fs * k]; line(g, [hk, s0], "rgba(255,211,107,.6)", 2, [4, 4]); arrow(g, ...s0, ...tS, "#ffd36b", 5);
      tag(g, `F_{G} = ${FG} N`, tG[0] - 14, tG[1] - 6, 22, COL.G, undefined, "right");
      tag(g, `F_{H} ${gl(FH, 0)} ${nk(FH, 0)} N`, tH[0] - 14, tH[1] + 18, 22, COL.H, undefined, "right");
      tag(g, "F_{N}", tN[0] + 12, Math.min(tN[1] + 6, h - 22), 22, COL.N, undefined, "left");
      const fl = P(uc + 52 + Math.max(Fs * k, 30) / 2, 96); tag(g, `Federkraft ${gl(DF * sT, 0) === "≈" ? "≈ " : ""}${nk(DF * sT, 0)} N`, fl[0], fl[1], 22, "#ffd36b", undefined, "center");   // Wert im Gleichgewicht, Pfeil schwingt mit
    } else {
      const uc = 110, hk = P(uc, 56), Ls = R0 + K * sx, top = [hk[0], hk[1] - Ls];
      line(g, [[top[0] - 120, top[1] - 12], [top[0] + 140, top[1] - 12]], "#9aa3b2", 6); g.fillStyle = "#9aa3b2"; g.fillRect(top[0] - 16, top[1] - 16, 32, 14);
      cart(uc); line(g, [P(uc, 54), hk], "#d9dde6", 3); spring(g, ...top, ...hk, COL.S, 9, 14, 10);
      const cm = P(uc, 34), tG = [cm[0], cm[1] + FG * k]; arrow(g, ...cm, ...tG, COL.G); g.fillStyle = "#fff"; g.beginPath(); g.arc(...cm, 6, 0, TAU); g.fill();
      const Fs = DF * sx; arrow(g, hk[0] + 22, hk[1], hk[0] + 22, hk[1] - Fs * k, "#ffd36b", 5);
      tag(g, `F_{G} = ${FG} N`, tG[0] - 14, Math.min(tG[1] - 8, h - 22), 22, COL.G, undefined, "right"); tag(g, `Federkraft ${nk(DF * sT, 0)} N`, hk[0] + 36, hk[1] - Math.min(Fs * k, 130) * .6, 22, "#ffd36b", undefined, "left");
      tag(g, "F_{N} = 0 N: Die Feder trägt den ganzen Wagen.", 250, 510, 22, "#ffb3a8", undefined, "left");
    }
  },
  pruefe(v){
    if (v.dir === 1) return {ok: false, text: "Die Feder zieht **senkrecht nach oben** – also gegen die Gewichtskraft, nicht gegen die Hangabtriebskraft. Damit der Wagen trotzdem nicht hinabrollt, muss sie ihn ganz tragen: Sie hält die volle Gewichtskraft **F_{G} = 800 N** und wird um 800 N : 20 N/cm = **40 cm** gedehnt. Spanne die Feder **parallel zur Ebene**, dann gleicht sie nur F_{H} aus."};
    const FH = FG * v.h / LR, s = FH / DF;
    if (Math.abs(s - S_LOCK) < 1e-6) return {ok: true};
    return {ok: false, text: `Bei h = ${nk(v.h)} m ist F_{H} = F_{G} · h : l = 800 N · ${nk(v.h)} m : 3,5 m ${gl(FH, 1)} ${nk(FH, 1)} N. Die Feder hält F_{H} das Gleichgewicht und wird um s = F_{H} : D ${gl(FH, 1)} ${nk(FH, 1)} N : 20 N/cm ${gl(s, 1)} ${s.toFixed(1).replace(".", ",")} cm gedehnt. ${s > S_LOCK ? "Das ist zu weit – die Rampe muss **flacher** sein." : "Das reicht nicht – die Rampe muss **steiler** sein."}`};
  },
  tipps: ["Die Feder soll nur die **Hangabtriebskraft** F_{H} ausgleichen. Dazu muss sie genau entgegengesetzt zu F_{H} ziehen – also parallel zur Ebene, hangaufwärts.",
          "Hookesches Gesetz: Bei s = 8,0 cm zieht die Feder mit F = D · s = 20 N/cm · 8,0 cm = 160 N. Genau so groß muss F_{H} sein.",
          "Es gilt F_{H} : F_{G} = h : l, also 160 N : 800 N = 1 : 5. Damit ist h = 3,5 m : 5 = … m."],
  loesung: {h: .7, dir: 0},
  erfolg: "Die Feder ist genau **8,0 cm** gedehnt und zieht mit **160 N** hangaufwärts – genau so stark wie die Hangabtriebskraft (F_{H} : F_{G} = 0,70 m : 3,5 m = 1 : 5). Kräftegleichgewicht: Der Riegel springt auf!"
};

/* =====================================================================
   Suchbild: Umzug mit Hindernissen
   ===================================================================== */
function person(g, x, y, s, shirt, o = {}){   // einfache Figur, Füße bei (x|y), Höhe ≈ 170·s
  const skin = o.skin || "#e9c19c", leg = o.leg || "#34405a";
  g.fillStyle = leg; g.fillRect(x - 16 * s, y - 78 * s, 13 * s, 78 * s); g.fillRect(x + 3 * s, y - 78 * s, 13 * s, 78 * s);
  g.fillStyle = "#2b2b2b"; g.fillRect(x - 19 * s, y - 6 * s, 18 * s, 7 * s); g.fillRect(x + 2 * s, y - 6 * s, 18 * s, 7 * s);
  g.fillStyle = shirt; g.beginPath(); g.roundRect(x - 22 * s, y - 140 * s, 44 * s, 66 * s, 10 * s); g.fill();
  g.fillStyle = skin; g.beginPath(); g.arc(x, y - 156 * s, 16 * s, 0, TAU); g.fill();
  g.fillStyle = o.hair || "#5a3b22"; g.beginPath(); g.arc(x, y - 160 * s, 16.5 * s, Math.PI * 1.05, Math.PI * 1.95); g.fill();
}
function scene(g, W, H){
  // Himmel, Hügel mit Serpentinenstraße (richtig: flachere Straße, kleinere Hangabtriebskraft)
  const sky = g.createLinearGradient(0, 0, 0, 330); sky.addColorStop(0, "#bfe0f5"); sky.addColorStop(1, "#eef6fb"); g.fillStyle = sky; g.fillRect(0, 0, W, 330);
  poly(g, [[640, 330], [800, 210], [960, 120], [1080, 140], [1200, 190], [1200, 330]], "#9cc58a");
  poly(g, [[880, 330], [1000, 250], [1120, 225], [1200, 240], [1200, 330]], "#86b375");
  line(g, [[720, 322], [1110, 292], [860, 262], [1080, 226], [930, 196], [1010, 160]], "#efe9dc", 9);
  g.fillStyle = "#c0392b"; g.fillRect(1030, 222, 16, 9);   // Auto auf der Serpentine
  // Haus links
  g.fillStyle = "#e8d6b8"; g.fillRect(0, 70, 220, 260); poly(g, [[-10, 75], [110, 10], [230, 75]], "#a5523f");
  for (const [x, y] of [[24, 100], [130, 100]]) { g.fillStyle = "#7fa7c9"; g.fillRect(x, y, 62, 56); g.strokeStyle = "#fff"; g.lineWidth = 4; g.strokeRect(x, y, 62, 56); }
  // Straße und Gehweg
  g.fillStyle = "#8f949b"; g.fillRect(0, 330, W, 290); g.fillStyle = "#f2f2f2"; for (let x = 20; x < W; x += 120) g.fillRect(x, 452, 60, 6);
  g.fillStyle = "#d9d2c4"; g.fillRect(0, 620, W, 180); g.fillStyle = "#c8c0b0"; for (let x = 0; x < W; x += 80) g.fillRect(x, 620, 3, 180); g.fillRect(0, 620, W, 5);

  // Umzugswagen mit Rampe (richtig: Seil parallel zur Rampe, Ladung mit Gurten gesichert)
  g.fillStyle = "#d9d9d4"; g.beginPath(); g.roundRect(14, 232, 74, 106, [18, 4, 4, 4]); g.fill(); g.fillStyle = "#7fa7c9"; g.fillRect(22, 244, 44, 40);
  g.fillStyle = "#f4f4f0"; g.fillRect(84, 168, 216, 170); g.strokeStyle = "#9aa0a8"; g.lineWidth = 4; g.strokeRect(84, 168, 216, 170);
  g.fillStyle = "#3a3f48"; g.fillRect(250, 176, 46, 158);   // offener Laderaum
  g.fillStyle = "#c79a62"; g.fillRect(254, 290, 38, 40); g.fillRect(258, 248, 32, 42); g.fillStyle = "#e0533d"; g.fillRect(254, 306, 38, 5); g.fillRect(258, 264, 32, 5);   // Kisten mit Spanngurten
  tx(g, "UMZÜGE", 167, 222, 30, "#2f6db5", "center", 800); tx(g, "Ladung sichern!", 167, 258, 20, "#2f6db5", "center", 600);
  g.fillStyle = "#222"; for (const x of [62, 246]) { g.beginPath(); g.arc(x, 342, 26, 0, TAU); g.fill(); } g.fillStyle = "#aaa"; for (const x of [62, 246]) { g.beginPath(); g.arc(x, 342, 10, 0, TAU); g.fill(); }
  poly(g, [[294, 330], [440, 392], [440, 402], [294, 340]], "#a9814f");   // Rampe
  const ra = Math.atan2(62, 146); g.save(); g.translate(370, 362); g.rotate(ra); g.fillStyle = "#c79a62"; g.fillRect(-26, -48, 52, 40); g.strokeStyle = "#8a6a3a"; g.lineWidth = 2; g.strokeRect(-26, -48, 52, 40);
  g.fillStyle = "#555"; g.beginPath(); g.arc(-14, -6, 6, 0, TAU); g.arc(14, -6, 6, 0, TAU); g.fill(); g.restore();
  const rp = [370 + 26 * Math.cos(ra) + 28 * Math.sin(ra), 362 + 26 * Math.sin(ra) - 28 * Math.cos(ra)];
  line(g, [[rp[0] - 52 * Math.cos(ra), rp[1] - 52 * Math.sin(ra)], [rp[0] - 130 * Math.cos(ra), rp[1] - 130 * Math.sin(ra)]], "#5a3b22", 3);   // Seil parallel zur Rampe
  person(g, 274, 336, .72, "#2e8b57");

  // Pickup bei der Vollbremsung (Fehler: Kisten rutschen nach hinten · Fahrer ohne Gurt)
  line(g, [[330, 606], [508, 606]], "#3b3b3b", 7); line(g, [[560, 606], [728, 606]], "#3b3b3b", 7);   // Bremsspuren
  g.fillStyle = "#d4483b"; g.beginPath(); g.roundRect(470, 500, 360, 80, 10); g.fill();
  g.fillStyle = "#b53a2f"; g.beginPath(); g.roundRect(680, 410, 130, 100, [26, 30, 4, 4]); g.fill(); g.fillRect(800, 470, 46, 60);
  g.fillStyle = "#bfe0f5"; g.beginPath(); g.roundRect(696, 424, 98, 58, 10); g.fill();
  g.save(); g.beginPath(); g.roundRect(696, 424, 98, 58, 10); g.clip();
  g.save(); g.translate(742, 495); g.rotate(.3); person(g, 0, 48, .62, "#3a6fb0", {hair: "#2b1a10"}); g.restore();   // ohne Gurt: Oberkörper bewegt sich nach vorne weiter
  g.strokeStyle = "#1d1d1d"; g.lineWidth = 6; g.beginPath(); g.ellipse(780, 466, 7, 18, -.3, 0, TAU); g.stroke();   // Lenkrad
  g.fillStyle = "#8c8c8c"; g.beginPath(); g.roundRect(703, 425, 14, 8, 3); g.fill();   // Umlenkpunkt des Gurts oben am Rahmen
  line(g, [[710, 431], [711, 466]], "#3a3a3a", 7); line(g, [[708, 433], [709, 465]], "#5c5c5c", 1.5);   // Gurtband hängt ungenutzt herab
  g.fillStyle = "#d9d9d9"; g.beginPath(); g.roundRect(704, 465, 14, 13, 2); g.fill(); g.fillStyle = "#555"; g.fillRect(708, 470, 6, 4);   // Schlosszunge
  g.restore();
  g.fillStyle = "#8b2a20"; g.fillRect(470, 480, 210, 22); g.fillRect(470, 480, 10, 40);
  g.fillStyle = "#ff2a1a"; g.fillRect(462, 508, 12, 26); const glw = g.createRadialGradient(466, 520, 2, 466, 520, 40); glw.addColorStop(0, "rgba(255,60,40,.7)"); glw.addColorStop(1, "rgba(255,60,40,0)"); g.fillStyle = glw; g.fillRect(426, 480, 80, 80);
  g.fillStyle = "#222"; for (const x of [540, 760]) { g.beginPath(); g.arc(x, 584, 30, 0, TAU); g.fill(); } g.fillStyle = "#bbb"; for (const x of [540, 760]) { g.beginPath(); g.arc(x, 584, 11, 0, TAU); g.fill(); }
  g.fillStyle = "#fff"; g.beginPath(); g.roundRect(800, 360, 196, 44, 12); g.fill(); poly(g, [[820, 400], [836, 400], [812, 420]], "#fff");
  tx(g, "Vollbremsung!", 898, 383, 24, "#b3261e", "center", 800);
  // lose Kisten, die nach HINTEN rutschen (falsch)
  g.save(); g.translate(540, 452); g.rotate(-.16); g.fillStyle = "#c79a62"; g.fillRect(-36, -32, 72, 58); g.strokeStyle = "#8a6a3a"; g.lineWidth = 3; g.strokeRect(-36, -32, 72, 58); g.restore();
  g.save(); g.translate(612, 460); g.rotate(-.1); g.fillStyle = "#d8b07a"; g.fillRect(-30, -26, 60, 48); g.strokeStyle = "#8a6a3a"; g.lineWidth = 3; g.strokeRect(-30, -26, 60, 48); g.restore();
  for (const [x, y] of [[584, 432], [588, 450], [582, 468], [650, 444], [654, 462]]) line(g, [[x, y], [x + 30, y]], "#444", 3.5);   // Bewegungsstriche: Kisten bewegen sich nach links

  // Kofferwaage am Stativ (Fehler: Messbereich weit überschritten, Feder überdehnt – „elastisch“?)
  g.fillStyle = "#555b66"; g.fillRect(936, 776, 80, 14); g.fillRect(951, 332, 10, 446); g.fillRect(951, 332, 106, 9);
  line(g, [[1050, 340], [1050, 352]], "#555", 4);
  g.fillStyle = "#f2d16b"; g.fillRect(1033, 352, 34, 100); g.strokeStyle = "#8a6a3a"; g.lineWidth = 3; g.strokeRect(1033, 352, 34, 100);
  g.fillStyle = "#333"; for (let i = 0; i <= 10; i++) g.fillRect(1033, 360 + i * 8.6, i % 5 ? 8 : 14, 2);
  tx(g, "bis 10 N", 1076, 372, 20, "#1b1b1b", "left", 800);
  g.fillStyle = "#ff3b2b"; g.fillRect(1037, 444, 26, 4);   // Zeiger am Skalenende
  // überdehnte Feder: oben und unten noch enge Windungen, in der Mitte weit auseinandergezogen
  const sp = [[1050, 452]]; let y = 452; for (let i = 0; i < 5; i++) { y += 5; sp.push([1050 + (i % 2 ? 11 : -11), y]); }
  for (let i = 0; i < 4; i++) { y += 34; sp.push([1050 + (i % 2 ? 5 : -5), y]); }
  for (let i = 0; i < 5; i++) { y += 5; sp.push([1050 + (i % 2 ? 11 : -11), y]); } sp.push([1050, 632]); line(g, sp, "#6c6c6c", 3.5);
  line(g, [[1050, 632], [1050, 656]], "#555", 4);
  g.fillStyle = "#2f4f8a"; g.beginPath(); g.roundRect(976, 664, 148, 104, 14); g.fill(); g.strokeStyle = "#1f3460"; g.lineWidth = 6; g.beginPath(); g.arc(1050, 666, 20, Math.PI, 0); g.stroke();
  tx(g, "20 kg", 1050, 716, 30, "#ffffff", "center", 800);
  person(g, 1158, 790, 1.02, "#8e44ad", {hair: "#3a2b1c"});
  g.fillStyle = "#fff"; g.beginPath(); g.roundRect(1072, 498, 124, 62, 12); g.fill(); poly(g, [[1148, 558], [1166, 558], [1160, 580]], "#fff");
  tx(g, "Passt, die", 1134, 516, 19, "#333", "center", 700); tx(g, "ist elastisch!", 1134, 542, 19, "#333", "center", 700);

  // Kind mit Federkraftmesser (richtig: Tasche mit 400 g zieht mit rund 4 N, Messbereich 10 N)
  person(g, 700, 790, .9, "#e67e22", {hair: "#c49a4a"});
  line(g, [[684, 680], [652, 604]], "#e9c19c", 9);   // erhobener Arm
  g.fillStyle = "#f2d16b"; g.fillRect(636, 604, 26, 86); g.strokeStyle = "#8a6a3a"; g.lineWidth = 3; g.strokeRect(636, 604, 26, 86);
  g.fillStyle = "#333"; for (let i = 0; i <= 10; i++) g.fillRect(636, 610 + i * 7.4, i % 5 ? 6 : 11, 2); g.fillStyle = "#ff3b2b"; g.fillRect(636, 639, 26, 4);
  tx(g, "10 N", 649, 592, 18, "#1b1b1b", "center", 800);
  line(g, [[649, 690], [649, 708]], "#555", 3); g.fillStyle = "#3c9a5f"; g.beginPath(); g.roundRect(620, 708, 58, 46, 8); g.fill();
  tx(g, "400 g", 649, 731, 18, "#ffffff", "center", 700);

  // Packtisch vorne links: Heft mit Hausaufgabe (Fehler: F_H hangaufwärts) und Federkiste (Fehler: Einheit N · cm)
  poly(g, [[0, 655], [540, 655], [560, 800], [0, 800]], "#a87c48"); g.fillStyle = "#c79a62"; g.fillRect(0, 648, 545, 12);
  g.save(); g.translate(172, 716); g.rotate(-.03); g.fillStyle = "#ffffff"; g.fillRect(-165, -80, 330, 160); g.strokeStyle = "#9ab"; g.lineWidth = 2;
  for (let y = -46; y < 80; y += 26) { g.beginPath(); g.moveTo(-157, y); g.lineTo(157, y); g.stroke(); }
  tx(g, "Hausaufgabe: schiefe Ebene", -152, -62, 21, "#1d3a8a", "left", 700);
  const rx0 = -150, ry0 = 66, rw = 240, rh = 110, sl = Math.atan2(rh, rw);   // steil genug, dass F_H deutlich zu sehen ist
  line(g, [[rx0, ry0], [rx0 + rw, ry0], [rx0 + rw, ry0 - rh], [rx0, ry0]], "#1d3a8a", 3);
  const bu = 140, bx = rx0 + bu * Math.cos(sl), by = ry0 - bu * Math.sin(sl);
  g.save(); g.translate(bx, by); g.rotate(-sl); g.strokeStyle = "#1d3a8a"; g.lineWidth = 3; g.strokeRect(-16, -24, 32, 24); g.restore();
  // Beträge wie im Kräfteparallelogramm (F_N = F_G · cos α, F_H = F_G · sin α) – falsch ist nur die Richtung von F_H
  const cx = bx - Math.sin(sl) * 12, cy = by - Math.cos(sl) * 12, kk = 70, kN = kk * Math.cos(sl), kH = kk * Math.sin(sl);
  arrow(g, cx, cy, cx, cy + kk, "#d23a2a", 3.5); tx(g, "F_{G}", cx - 8, cy + kk * .6, 20, "#d23a2a", "right", 700);
  arrow(g, cx, cy, cx + Math.sin(sl) * kN, cy + Math.cos(sl) * kN, "#2e8b57", 3.5); tx(g, "F_{N}", cx + Math.sin(sl) * kN * .6 + 12, cy + Math.cos(sl) * kN * .6, 20, "#2e8b57", "left", 700);
  arrow(g, cx, cy, cx + Math.cos(sl) * kH, cy - Math.sin(sl) * kH, "#2f6fd6", 3.5); tx(g, "F_{H}", cx + Math.cos(sl) * kH + 6, cy - Math.sin(sl) * kH - 16, 20, "#2f6fd6", "left", 700);
  g.restore();
  g.save(); g.translate(420, 714); g.rotate(.03); g.fillStyle = "#b98a52"; g.fillRect(-92, -52, 184, 104); g.strokeStyle = "#7a5a32"; g.lineWidth = 4; g.strokeRect(-92, -52, 184, 104);
  for (const x of [-64, -32, 0, 32, 64]) { const pts = []; for (let i = 0; i <= 10; i++) pts.push([x + (i % 2 ? 8 : -8), -72 + i * 4]); line(g, pts, "#7c7c7c", 3); }
  g.fillStyle = "#fff8e6"; g.fillRect(-80, -30, 160, 68); g.strokeStyle = "#333"; g.lineWidth = 2; g.strokeRect(-80, -30, 160, 68);
  tx(g, "Zugfedern", 0, -12, 20, "#333", "center", 700); tx(g, "D = 4 N · cm", 0, 18, 22, "#b3261e", "center", 800); g.restore();
}
const suchbild = {
  titel: "Umzug mit Hindernissen",
  text: "Familie Berger zieht um. Auf der Straße und am Packtisch stecken **fünf Fehler** – falsch dargestellte Physik oder gefährliches Verhalten. Klicke sie an und begründe, was falsch ist.",
  ort: {x: -3.6, z: -9.5, ry: 0},
  zeichne: scene,
  fehler: [
    {x: 575, y: 458, r: 85, name: "Die Kisten auf der Ladefläche", frage: "Der Pickup macht eine Vollbremsung. Was ist an den losen Kisten falsch dargestellt?",
     optionen: ["Beim Bremsen müssten die Kisten nach oben springen.", "Nichts – beim Bremsen schiebt eine Kraft die Kisten nach hinten.",
                "Die Kisten rutschen nach hinten. Wegen ihrer Trägheit bewegen sie sich aber nach vorne weiter – gegen das Fahrerhaus.", "Schwere Kisten bleiben beim Bremsen immer genau an ihrem Platz."], richtig: 2,
     warum: ["Nach oben wirkt beim Bremsen keine Kraft auf die Kisten. Sie bewegen sich wegen ihrer Trägheit waagrecht weiter – in Fahrtrichtung.",
             "Die Bremskraft wirkt auf den Wagen, auf die losen Kisten höchstens etwas Reibung. Deshalb bewegen sie sich weiter nach vorne, während der Wagen unter ihnen langsamer wird.",
             null,
             "Auch schwere Kisten sind träge: Sie behalten ihre Geschwindigkeit bei, während der Wagen bremst. Die Reibung auf der Ladefläche reicht bei einer Vollbremsung nicht, um sie mitzubremsen."],
     erklaerung: "Der Wagen wird abgebremst, die lose Ladung nicht: Nach dem **Trägheitssatz** bewegt sie sich mit der alten Geschwindigkeit weiter und rutscht **nach vorne** gegen das Fahrerhaus. Darum muss Ladung mit Gurten **gesichert** werden – wie im Umzugswagen."},
    {x: 742, y: 455, r: 60, name: "Der Fahrer im Pickup", frage: "Was ist beim Fahrer gefährlich?",
     optionen: ["Er hält das Lenkrad mit beiden Händen.", "Er sitzt zu tief im Sitz.", "Er trägt keine Mütze.",
                "Er ist nicht angeschnallt – bei der Vollbremsung bewegt er sich wegen seiner Trägheit nach vorne weiter."], richtig: 3,
     warum: ["Beide Hände am Lenkrad sind richtig so. Schau dir lieber den Gurt neben ihm an – er hängt ungenutzt herab.",
             "Die Sitzhöhe ist hier nicht das Problem. Gefährlich ist, dass ihn bei der Vollbremsung nichts zusammen mit dem Auto abbremst.",
             "Eine Mütze schützt nicht vor den Folgen der Trägheit. Was den Körper beim Bremsen zurückhält, ist der Sicherheitsgurt – und der ist nicht angelegt.",
             null],
     erklaerung: "Bei einer Vollbremsung bewegt sich der Körper wegen seiner **Trägheit** mit der alten Geschwindigkeit weiter, bis ihn Lenkrad oder Scheibe stoppen. Der **Sicherheitsgurt** übt die Kraft aus, die ihn zusammen mit dem Auto abbremst."},
    {x: 1050, y: 522, r: 115, name: "Die Kofferwaage am Stativ", frage: "Was ist hier falsch?",
     optionen: ["Federkraftmesser zeigen die Masse in Kilogramm, nicht die Kraft.", "Der Messbereich (bis 10 N) ist weit überschritten: Der Koffer zieht mit etwa 200 N, die Feder wird überdehnt und bleibt verformt.",
                "Der Koffer müsste auf dem Kraftmesser liegen, nicht hängen.", "Nichts – eine Feder kann man beliebig weit dehnen."], richtig: 1,
     warum: ["Ein Federkraftmesser misst eine Kraft in Newton – auf diesem steht „bis 10 N“. Das Problem ist, dass der Koffer viel stärker zieht, als die Feder aushält.",
             null,
             "Ein Federkraftmesser misst gerade Zugkräfte, der Körper hängt daran. Falsch ist, wie groß die Gewichtskraft des Koffers im Vergleich zum Messbereich ist.",
             "Das hookesche Gesetz gilt nur im elastischen Bereich. Über die Elastizitätsgrenze hinaus gedehnt, bleibt die Feder verformt – sie federt nicht mehr zurück."],
     erklaerung: "Der Koffer mit m = 20 kg hat die Gewichtskraft F_{G} = m · g = 20 kg · 9,81 N/kg ≈ 196 N – rund das Zwanzigfache des Messbereichs. Die Feder wird über ihre **Elastizitätsgrenze** gedehnt und **plastisch** verformt; der Kraftmesser ist danach kaputt. Das Kind daneben macht es richtig: 4 N im Messbereich 10 N."},
    {x: 420, y: 712, r: 80, name: "Das Etikett der Federn", frage: "Was stimmt am Etikett nicht?",
     optionen: ["Die Einheit ist falsch: Die Federhärte D = F : s hat die Einheit N/cm (oder N/m), nicht N · cm.", "Federhärten gibt man in Kilogramm an.",
                "Zugfedern haben keine Federhärte.", "Nichts – N · cm ist die richtige Einheit."], richtig: 0,
     warum: [null,
             "Kilogramm ist die Einheit der Masse. Die Federhärte gibt an, welche Kraft man pro Zentimeter Verlängerung braucht – also Newton pro Länge.",
             "Jede Feder hat eine Federhärte, auch eine Zugfeder: Sie sagt, wie viel Kraft man für 1 cm Verlängerung braucht. Falsch ist nur, wie sie auf dem Etikett angegeben ist.",
             "N · cm hieße Kraft **mal** Länge. Aus D = F : s folgt aber Kraft **geteilt** durch Länge."],
     erklaerung: "Die Federhärte gibt an, welche Kraft man für 1 cm Verlängerung braucht: **D = F : s**. Kraft **geteilt** durch Länge – also **N/cm** bzw. **N/m**. Eine Feder mit D = 4 N/cm verlängert sich um 1 cm, wenn man mit 4 N an ihr zieht."},
    {x: 175, y: 712, r: 105, name: "Die Hausaufgabe im Heft", frage: "Was ist an der Zeichnung falsch?",
     optionen: ["Die Gewichtskraft F_{G} müsste senkrecht zur Rampe zeigen.", "Die Normalkraft F_{N} müsste parallel zur Rampe zeigen.",
                "Die Hangabtriebskraft F_{H} ist hangaufwärts gezeichnet – sie zeigt parallel zur Ebene hangabwärts.", "Nichts – so zerlegt man die Gewichtskraft richtig."], richtig: 2,
     warum: ["F_{G} zeigt immer senkrecht nach unten – so ist sie im Heft auch richtig gezeichnet. Senkrecht zur Rampe zeigt die Normalkraft F_{N}.",
             "F_{N} steht im Heft richtig senkrecht auf der Rampe. Parallel zur Rampe zeigt die Hangabtriebskraft – schau dir an, wohin ihr Pfeil zeigt.",
             null,
             "Der blaue Pfeil F_{H} zeigt den Hang hinauf. Dann ergäben F_{H} und F_{N} im Kräfteparallelogramm nicht F_{G} – und ein Wagen würde von selbst bergauf rollen."],
     erklaerung: "Die Gewichtskraft F_{G} zeigt immer senkrecht nach unten und ist die Diagonale des **Kräfteparallelogramms**. Ihre Teilkräfte sind die **Normalkraft F_{N}** senkrecht zur Ebene und die **Hangabtriebskraft F_{H}** parallel zur Ebene – **hangabwärts**. Nur so ergeben F_{H} und F_{N} zusammen F_{G}."}
  ],
  // richtig dargestellte Details (keine Überlappung mit den Fehlerkreisen)
  ablenker: [
    {x: 960, y: 240, r: 80, text: "Die Straße führt in **Serpentinen** den Hügel hinauf. Für dieselbe Höhe ist der Weg länger und die Straße flacher – so ist die Hangabtriebskraft auf das Auto kleiner."},
    {x: 350, y: 335, r: 55, text: "Das Seil verläuft **parallel zur Rampe**. So muss es nur die Hangabtriebskraft F_{H} ausgleichen; die Normalkraft F_{N} nimmt die Rampe auf."},
    {x: 167, y: 245, r: 78, text: "Der Hinweis auf dem Umzugswagen stimmt: Festgezurrte Ladung wird beim Bremsen zusammen mit dem Wagen abgebremst. Lose Ladung bewegt sich wegen ihrer **Trägheit** weiter."},
    {x: 655, y: 678, r: 75, text: "Die Tasche mit 400 g hat die Gewichtskraft F_{G} = 0,4 kg · 9,81 N/kg ≈ 3,9 N. Der Zeiger steht bei etwa 4 N – gut im **Messbereich** bis 10 N. So benutzt man einen Kraftmesser richtig."}
  ],
  abschluss: "Gut beobachtet! Lose Ladung und Menschen ohne Gurt bewegen sich beim Bremsen wegen ihrer **Trägheit** weiter. Federn nur im **elastischen Bereich** belasten (F = D · s, D in N/cm), und die Hangabtriebskraft F_{H} zeigt **hangabwärts**."
};

R3D.lern.raum("kraft2", {
  raetsel, suchbild,
  // Rechenwerkstatt: Tafel im Raum (freie Bodenstelle vorne rechts, gegenüber der Suchbild-Staffelei) + Knopf an Station 3
  uebung: {ort: {x: 3.6, z: -9.5, ry: 0}, formel: "F = D · s"},
  rechenweg: [
    // 1 Beispiel: hookesches Gesetz direkt, cm → m umrechnen
    {titel: "Der Expander", text: "Ein Expander (ein Trainingsgerät mit Federn) hat die Federhärte D = 150 N/m. Du ziehst ihn um 40 cm auseinander. Mit welcher Kraft musst du ziehen?",
     gegeben: [{g: "D", wert: 150, einheit: "N/m", name: "Federhärte"}, {g: "s", wert: 40, einheit: "cm", name: "Verlängerung", si: {wert: 0.4, einheit: "m"}}],
     gesucht: {g: "F", einheit: "N", name: "Kraft"},
     formel: "F = D · s", formelAblenker: [{f: "F = D : s", warum: "Je weiter du die Feder dehnst, desto größer wird die Kraft. Bei D : s würde sie mit wachsendem s kleiner – es gilt F = D · s."},
                                          {f: "F = s : D", warum: "Eine härtere Feder (größeres D) braucht mehr Kraft, nicht weniger. D steht deshalb als Faktor in der Formel: F = D · s."}],
     umgestellt: "F = D · s", einsetzen: "F = 150 N/m · 0,4 m", ergebnis: {wert: 60, einheit: "N"},
     tipps: ["F = D · s – vorher umrechnen: 40 cm = 0,4 m, denn D ist in N/m angegeben.", "F = 150 N/m · 0,4 m", "150 · 0,4 = 15 · 4 = …"], loesung: "F = D · s = 150 N/m · 0,4 m = 60 N",
     antwort: "Du musst mit einer Kraft von 60 N ziehen.", antwortAnfang: "Du musst mit einer Kraft …", einheitAuch: ["Newton", "kN"]},
    // 2 nach s umstellen
    {titel: "Der Federkraftmesser", text: "Die Feder eines Federkraftmessers hat die Federhärte D = 0,5 N/cm. Du hängst einen Apfel daran, der mit 1,5 N an der Feder zieht. Um wie viel Zentimeter wird die Feder gedehnt?",
     gegeben: [{g: "D", wert: 0.5, einheit: "N/cm", name: "Federhärte"}, {g: "F", wert: 1.5, einheit: "N", name: "Kraft"}],
     gesucht: {g: "s", einheit: "cm", name: "Verlängerung"},
     formel: "F = D · s", formelAblenker: [{f: "F = D : s", warum: "Doppelte Verlängerung braucht doppelte Kraft – Kraft und Verlängerung sind proportional. Dazu muss s malgenommen werden: F = D · s."},
                                          {f: "D = F · s", warum: "Die Federhärte ist Kraft **pro** Zentimeter, also F geteilt durch s. Malgenommen ergibt das keinen Sinn – die Grundformel lautet F = D · s."}],
     umgestellt: "s = F : D", umstellAblenker: [{f: "s = D : F", warum: "Das ist der Kehrwert. Teile F = D · s auf beiden Seiten durch D, dann bleibt s = F : D. Probe: Eine weichere Feder (kleineres D) dehnt sich weiter – bei D : F wäre es umgekehrt."},
                                               {f: "s = F · D", warum: "D steht in F = D · s als Faktor neben s. Um s freizustellen, teilst du durch D, statt mit D malzunehmen."}],
     umstellWeg: "F = D · s  | : D  →  F : D = s  →  s = F : D",
     einsetzen: "s = 1,5 N : 0,5 N/cm", ergebnis: {wert: 3, einheit: "cm"},
     tipps: ["Stelle F = D · s nach s um: Teile durch D.", "s = 1,5 N : 0,5 N/cm", "1,5 : 0,5 = 15 : 5 = …"], loesung: "s = F : D = 1,5 N : 0,5 N/cm = 3 cm",
     antwort: "Die Feder wird um 3 cm gedehnt.", antwortAnfang: "Die Feder wird …", einheitAuch: ["mm", "m", "Zentimeter"],
     plausibel: {frage: "Ist eine Verlängerung von 3 cm für einen Federkraftmesser plausibel?",
       optionen: ["Ja – die Skala eines Kraftmessers ist einige Zentimeter lang, 3 cm lassen sich gut ablesen.", "Nein – eine Feder dehnt sich höchstens um wenige Millimeter.",
                  "Nein – bei 1,5 N muss sich jede Feder um 1,5 cm dehnen.", "Ja – denn je kleiner die Federhärte, desto kürzer die Verlängerung."], richtig: 0,
       warum: [null, "Die Federn in Kraftmessern sind weich: Schon kleine Kräfte dehnen sie um einige Zentimeter – sonst könnte man die Skala kaum ablesen.",
               "Kraft und Verlängerung sind verschiedene Größen. Wie weit eine Feder bei 1,5 N nachgibt, hängt von ihrer Federhärte ab – hier braucht jeder Zentimeter nur 0,5 N.",
               "Das Ergebnis passt, die Begründung nicht: Eine kleine Federhärte heißt weiche Feder – sie dehnt sich bei gleicher Kraft **weiter**, nicht weniger weit."],
       erklaerung: "Bei D = 0,5 N/cm braucht jeder Zentimeter Verlängerung 0,5 N. Für 1,5 N sind es also 3 cm – gut ablesbar auf der Skala eines Kraftmessers."}},
    // 3 zwei Schritte: Gewichtskraft aus der Masse (g → kg umrechnen), dann nach D umstellen
    {titel: "Die Federhärte bestimmen", text: "Du hängst an eine Schraubenfeder einen Körper mit der Masse m = 350 g. Die Feder verlängert sich dadurch um 6,0 cm. Berechne die Federhärte D in N/cm. (g = 9,81 N/kg)",
     gegeben: [{g: "m", wert: 350, einheit: "g", name: "Masse", si: {wert: 0.35, einheit: "kg"}}, {g: "s", wert: 6, einheit: "cm", name: "Verlängerung"}, {g: "g", wert: 9.81, einheit: "N/kg", name: "Ortsfaktor"}],
     gesucht: {g: "D", einheit: "N/cm", name: "Federhärte"},
     symbole: [{g: "F", name: "dehnende Kraft (hier die Gewichtskraft)"}],
     formel: "F = D · s", formelAblenker: [{f: "F = D : s", warum: "Bei gleicher Feder gilt: doppelte Kraft, doppelte Verlängerung. Das passt nur, wenn s malgenommen wird – F = D · s."},
                                          {f: "m = D · s", warum: "Eine Feder wird von einer **Kraft** gedehnt, nicht von einer Masse. Die Masse rechnest du erst mit F_{G} = m · g in die Gewichtskraft um."}],
     umgestellt: "D = m · g : s",
     umstellAblenker: [{f: "D = m : s", warum: "Hier fehlt der Ortsfaktor: Die Feder wird von der Gewichtskraft F_{G} = m · g gedehnt. Ohne g käme kg/cm heraus statt N/cm."},
                       {f: "D = s : (m · g)", warum: "Das ist der Kehrwert. Die Federhärte ist Kraft **pro** Länge – die Kraft m · g steht oben, s unten."}],
     umstellWeg: "F = D · s  | : s  →  D = F : s;  die dehnende Kraft ist die Gewichtskraft F = m · g  →  D = m · g : s",
     einsetzen: "D = 0,35 kg · 9,81 N/kg : 6,0 cm", ergebnis: {wert: 0.57, einheit: "N/cm", toleranz: .005},
     tipps: ["Die Feder wird von der Gewichtskraft gedehnt: F_{G} = m · g mit m = 350 g = 0,35 kg. Danach gilt D = F_{G} : s.", "D = 0,35 kg · 9,81 N/kg : 6,0 cm ≈ 3,43 N : 6,0 cm",
             "3,43 : 6 ≈ … – runde auf zwei Stellen nach dem Komma."],
     loesung: "F_{G} = m · g = 0,35 kg · 9,81 N/kg ≈ 3,43 N;  D = F_{G} : s = 3,43 N : 6,0 cm ≈ 0,57 N/cm",
     antwort: "Die Feder hat eine Federhärte von etwa 0,57 N/cm.", antwortAnfang: "Die Feder hat eine Federhärte …", einheitAuch: ["N/m"]},
    // 4 schiefe Ebene: Verhältnis F_H : F_G = h : l nach h umstellen
    {titel: "Die Rollstuhlrampe", text: "Vor dem Eingang der Schule soll eine Rampe für Rollstühle gebaut werden. Rollstuhl und Person haben zusammen die Gewichtskraft F_{G} = 1000 N. Die Rampe wird 8,0 m lang. Damit man gut hinaufkommt, soll die Hangabtriebskraft höchstens 60 N betragen (Reibung vernachlässigt). Wie hoch darf die Rampe höchstens sein?",
     gegeben: [{g: "F_{G}", wert: 1000, einheit: "N", name: "Gewichtskraft"}, {g: "l", wert: 8, einheit: "m", name: "Länge der Rampe"}, {g: "F_{H}", wert: 60, einheit: "N", name: "Hangabtriebskraft"}],
     gesucht: {g: "h", einheit: "m", name: "Höhe der Rampe"},
     formel: "F_{H} : F_{G} = h : l",
     formelAblenker: [{f: "F_{H} : F_{G} = l : h", warum: "F_{H} ist kleiner als F_{G}, das Verhältnis also kleiner als 1. Das passt nur zu h : l – die Höhe ist immer kleiner als die Länge der Rampe."},
                      {f: "F_{N} : F_{G} = h : l", warum: "Die Normalkraft wird kleiner, wenn die Rampe steiler wird – h : l wird dabei aber größer. Zu h : l gehört die Hangabtriebskraft F_{H}."}],
     umgestellt: "h = F_{H} · l : F_{G}",
     umstellAblenker: [{f: "h = F_{G} · l : F_{H}", warum: "F_{H} und F_{G} sind vertauscht. Probe: Damit käme h = 1000 N · 8,0 m : 60 N ≈ 133 m heraus – viel höher, als die Rampe lang ist."},
                       {f: "h = F_{H} : (F_{G} · l)", warum: "Hier ist l in den Nenner gerutscht. Multipliziere F_{H} : F_{G} = h : l auf beiden Seiten mit l – dann steht l oben: h = F_{H} · l : F_{G}."}],
     umstellWeg: "F_{H} : F_{G} = h : l  | · l  →  F_{H} · l : F_{G} = h  →  h = F_{H} · l : F_{G}",
     einsetzen: "h = 60 N · 8,0 m : 1000 N", ergebnis: {wert: 0.48, einheit: "m"},
     tipps: ["Es gilt F_{H} : F_{G} = h : l. Multipliziere beide Seiten mit l.", "h = 60 N · 8,0 m : 1000 N", "60 · 8 = 480 und 480 : 1000 = …"],
     loesung: "h = F_{H} · l : F_{G} = 60 N · 8,0 m : 1000 N = 0,48 m",
     antwort: "Die Rampe darf höchstens 0,48 m hoch sein.", antwortAnfang: "Die Rampe darf …", einheitAuch: ["cm", "mm", "Meter"],
     plausibel: {frage: "Ist eine Höhe von 0,48 m bei einer 8,0 m langen Rampe plausibel?",
       optionen: ["Ja – F_{H} ist nur 6 % von F_{G}, also ist auch h nur 6 % von l: eine flache Rampe.", "Nein – eine Rampe muss mindestens halb so hoch sein, wie sie lang ist.",
                  "Nein – bei einer so flachen Rampe gäbe es gar keine Hangabtriebskraft.", "Nein – für 60 N dürfte die Rampe höchstens 6 cm hoch sein."], richtig: 0,
       warum: [null, "Bei h : l = 1 : 2 wäre F_{H} halb so groß wie F_{G}, also 500 N – viel zu viel, um einen Rollstuhl hinaufzuschieben.",
               "Null ist F_{H} nur auf einer waagrechten Fläche. Bei jeder noch so kleinen Steigung gibt es eine Hangabtriebskraft – hier 60 N.",
               "6 cm wären 6 % von 1 m. Die Rampe ist aber 8,0 m lang: 6 % davon sind 0,48 m."],
       erklaerung: "60 N : 1000 N = 0,06. Genauso groß ist h : l = 0,48 m : 8,0 m = 0,06. Eine lange, flache Rampe – genau das braucht man für Rollstühle."}}
  ],
  umstellen: [
    {formel: "F = D · s", loesung: "s = F : D", text: "Hookesches Gesetz: Die Kraft ist Federhärte mal Verlängerung. Gesucht ist, wie weit sich die Feder dehnt.",
     typisch: [{f: "s = D : F", warum: "Das ist der Kehrwert. Teile F = D · s auf beiden Seiten durch D – dann bleibt s = F : D."},
               {f: "s = F · D", warum: "D steht als Faktor neben s. Um s freizustellen, teilst du durch D, statt mit D malzunehmen."}],
     weg: "F = D · s  | : D  →  F : D = s  →  s = F : D", tipps: ["Womit ist s malgenommen? Teile beide Seiten dadurch.", "Probe mit Zahlen: D = 0,6 N/cm und F = 4,2 N müssen s = 7,0 cm ergeben."]},
    {formel: "F = D · s", loesung: "D = F : s", text: "Gesucht ist die Federhärte einer Feder, deren Verlängerung du bei einer bekannten Kraft gemessen hast.",
     typisch: [{f: "D = s : F", warum: "Das ist der Kehrwert. Die Federhärte ist Kraft **pro** Länge – die Kraft steht oben: D = F : s."},
               {f: "D = F · s", warum: "Dann wäre eine Feder umso härter, je weiter sie sich dehnt. Es ist umgekehrt: Bei gleicher Kraft dehnt sich die härtere Feder weniger. Teile durch s."}],
     weg: "F = D · s  | : s  →  F : s = D  →  D = F : s", tipps: ["Teile beide Seiten durch s.", "Probe mit Zahlen: F = 6,0 N und s = 4,0 cm müssen D = 1,5 N/cm ergeben."]},
    {formel: "F_{H} : F_{G} = h : l", loesung: "l = F_{G} · h : F_{H}", text: "Schiefe Ebene: Wie lang muss eine Rampe mit der Höhe h sein, damit die Hangabtriebskraft nur F_{H} beträgt?",
     typisch: [{f: "l = F_{H} · h : F_{G}", warum: "F_{H} und F_{G} sind vertauscht. Probe: Bei h = 0,60 m und F_{H} : F_{G} = 1 : 3 muss l = 1,8 m herauskommen – nicht 0,20 m."},
               {f: "l = F_{H} : (F_{G} · h)", warum: "Das ist der Kehrwert der Lösung. Multipliziere zuerst mit l, dann mit F_{G} und teile zuletzt durch F_{H} – so steht l allein auf einer Seite."}],
     weg: "F_{H} : F_{G} = h : l  | · l  →  F_{H} · l : F_{G} = h  | · F_{G}  →  F_{H} · l = h · F_{G}  | : F_{H}  →  l = F_{G} · h : F_{H}",
     tipps: ["Hole l zuerst aus dem Nenner: Multipliziere beide Seiten mit l.", "Danach mit F_{G} malnehmen und durch F_{H} teilen. Probe: F_{G} = 900 N, F_{H} = 300 N und h = 0,60 m ergeben l = 1,8 m."]}
  ],
  fehlersuche: [
    // Masse mit Kraft verwechselt (Ortsfaktor vergessen)
    {titel: "Die Tasche an der Feder", aufgabe: "Eine Tasche mit der Masse m = 0,60 kg hängt an einer Feder mit der Federhärte D = 2,0 N/cm. Um wie viel Zentimeter wird die Feder gedehnt? (g = 9,81 N/kg)",
     zeilen: ["Gegeben: m = 0,60 kg; D = 2,0 N/cm; g = 9,81 N/kg", "Gesucht: s", "Kraft auf die Feder: F = 0,60 N", "s = F : D = 0,60 N : 2,0 N/cm", "s = 0,30 cm"], falsch: 2,
     zeilenOk: ["Die Angaben stimmen: Masse, Federhärte und Ortsfaktor.", "Gesucht ist die Verlängerung – richtig."],
     optionen: ["Die Masse wurde einfach als Kraft übernommen. Die Feder wird von der Gewichtskraft F_{G} = m · g gedehnt.", "Die Federhärte muss zuerst in N/m umgerechnet werden.",
                "Die Masse muss zuerst in Gramm umgerechnet werden: 0,60 kg = 600 g, also F = 600 N.", "Masse und Ortsfaktor muss man addieren: F = 0,60 kg + 9,81 N/kg."], richtig: 0,
     warum: [null, "Umrechnen ist hier nicht nötig: Mit F in N und D in N/cm kommt s direkt in cm heraus. Der Fehler steckt in der Kraft.",
             "Auch 600 g sind eine Masse, keine Kraft. Erst F_{G} = m · g (mit m in kg) macht daraus eine Kraft in Newton.",
             "Kilogramm und Newton pro Kilogramm kann man nicht addieren. Masse und Ortsfaktor werden malgenommen: F_{G} = m · g."],
     korrektur: {frage: "Um wie viel Zentimeter wird die Feder richtig gedehnt?", wert: 2.94, einheit: "cm", toleranz: .05,
       tipps: ["Berechne zuerst die Gewichtskraft: F_{G} = m · g = 0,60 kg · 9,81 N/kg.", "F_{G} ≈ 5,89 N; s = F_{G} : D = 5,89 N : 2,0 N/cm = … cm"],
       loesung: "F_{G} = m · g = 0,60 kg · 9,81 N/kg ≈ 5,89 N;  s = F_{G} : D = 5,89 N : 2,0 N/cm ≈ 2,9 cm"},
     erklaerung: "Eine Feder wird von einer **Kraft** gedehnt. Die Masse in kg musst du erst mit F_{G} = m · g in die Gewichtskraft in N umrechnen. 0,30 cm für eine Tasche mit 600 g hätte stutzig machen müssen."},
    // Einheiten nicht umgerechnet (D in N/m, s in cm)
    {titel: "Die gedehnte Feder", aufgabe: "Eine Feder mit der Federhärte D = 50 N/m wird um 8,0 cm gedehnt. Berechne die Kraft, mit der an der Feder gezogen wird.",
     zeilen: ["Gegeben: D = 50 N/m; s = 8,0 cm", "Gesucht: F", "F = D · s", "F = 50 N/m · 8,0 m", "F = 400 N"], falsch: 3,
     zeilenOk: ["Die Angaben stimmen.", "Gesucht ist die Kraft – richtig.", "Das ist das hookesche Gesetz – richtig."],
     optionen: ["Die Formel ist falsch: Es gilt F = D : s.", "D ist in N/m angegeben, s aber in cm. Statt s = 8,0 cm = 0,080 m umzurechnen, wurden 8,0 m eingesetzt.",
                "D muss in N/cm umgerechnet werden, indem man mit 100 malnimmt: D = 5000 N/cm.", "Die Einheit des Ergebnisses ist falsch: Eine Kraft gibt man in N/m an."], richtig: 1,
     warum: ["Zeile 3 stimmt: Kraft ist Federhärte mal Verlängerung. Vergleiche den Wert für s in Zeile 4 mit der Angabe in Zeile 1.", null,
             "Die Idee, alles in cm zu rechnen, ist gut – aber falsch herum: 50 N pro Meter sind 50 N pro 100 cm, also nur 0,5 N/cm. Man muss durch 100 teilen.",
             "Eine Kraft hat die Einheit N – das steht in Zeile 5 richtig. Der Fehler passiert vorher: In Zeile 4 steht für s ein falscher Wert."],
     korrektur: {frage: "Wie groß ist die Kraft richtig?", wert: 4, einheit: "N", toleranz: .05, tipps: ["Rechne um: 8,0 cm = 0,080 m (1 m = 100 cm).", "F = 50 N/m · 0,080 m = … N"],
       loesung: "s = 8,0 cm = 0,080 m;  F = D · s = 50 N/m · 0,080 m = 4,0 N"},
     erklaerung: "Vor dem Einsetzen müssen die Einheiten zusammenpassen: Bei D in N/m gehört s in m (oder D umrechnen: 50 N/m = 0,5 N/cm). 400 N für eine kleine Feder hätte stutzig machen müssen – so groß ist die Gewichtskraft eines Körpers mit etwa 40 kg."},
    // schiefe Ebene: falsch umgestellt (h und l vertauscht)
    {titel: "Der Rollwagen auf der Rampe", aufgabe: "Ein Rollwagen mit Kiste hat die Gewichtskraft F_{G} = 400 N. Er steht auf einer Rampe, die 2,0 m lang und 0,50 m hoch ist (Reibung vernachlässigt). Mit welcher Kraft muss ihn ein Seil parallel zur Rampe halten?",
     zeilen: ["Gegeben: F_{G} = 400 N; l = 2,0 m; h = 0,50 m", "Gesucht: F_{H} (so groß ist die Kraft des Seils)", "F_{H} : F_{G} = h : l", "F_{H} = F_{G} · l : h", "F_{H} = 400 N · 2,0 m : 0,50 m", "F_{H} = 1600 N"], falsch: 3,
     zeilenOk: ["Die Angaben stimmen.", "Richtig: Das Seil muss die Hangabtriebskraft ausgleichen.", "Das Verhältnis stimmt: F_{H} : F_{G} = h : l."],
     optionen: ["Die Höhe muss erst in cm umgerechnet werden.", "Das Seil muss die ganze Gewichtskraft halten, also 400 N.",
                "Beim Umstellen wurden h und l vertauscht: Richtig ist F_{H} = F_{G} · h : l.", "In der Formel hätte F_{N} statt F_{H} stehen müssen."], richtig: 2,
     warum: ["Umrechnen ist nicht nötig: h und l stehen beide in m, die Einheiten kürzen sich im Verhältnis h : l weg.",
             "Einen Teil der Gewichtskraft trägt die Rampe (die Normalkraft). Das Seil muss nur F_{H} ausgleichen – so steht es auch richtig in Zeile 2.",
             null,
             "Zum Verhältnis h : l gehört die Hangabtriebskraft: Beide werden größer, wenn die Rampe steiler wird. F_{N} wird dabei kleiner – Zeile 3 stimmt."],
     korrektur: {frage: "Wie groß ist die Haltekraft richtig?", wert: 100, einheit: "N", toleranz: 1,
       tipps: ["Nimm F_{H} : F_{G} = h : l auf beiden Seiten mal F_{G}: F_{H} = F_{G} · h : l.", "F_{H} = 400 N · 0,50 m : 2,0 m = … N"],
       loesung: "F_{H} = F_{G} · h : l = 400 N · 0,50 m : 2,0 m = 100 N"},
     erklaerung: "Beim Umstellen nach F_{H} nimmst du beide Seiten mit F_{G} mal – h und l bleiben, wo sie sind. Probe: F_{H} ist eine Teilkraft von F_{G} und muss kleiner als 400 N sein; 1600 N ist unmöglich."}
  ],
  // Rückmeldung je falscher Antwort (Reihenfolge wie options in inhalt/kraft2.json, null an der richtigen Antwort)
  warum: {
    0: [null, "Dass Körper im Alltag von selbst langsamer werden, liegt an Reibung und Luftwiderstand – das sind Kräfte. Wo sie fast fehlen, etwa bei einem Puck auf glattem Eis, gleitet ein Körper lange fast gleich schnell weiter.",
        "Eine Antriebskraft braucht man im Alltag nur, um Reibung und Luftwiderstand auszugleichen. Ist die resultierende Kraft null, bewegt sich ein Körper ganz von selbst gleichförmig weiter.",
        "Eine Kraft ändert nicht die Masse eines Körpers. Eine resultierende Kraft ändert seine Geschwindigkeit – nach Betrag oder Richtung."],
    2: [null, "Auch ein ruhender Körper ist träge: Er lässt sich nur schwer in Bewegung setzen. Wie träge er ist, hängt nicht von seiner Geschwindigkeit ab, sondern von seiner Masse.",
        "Der Ortsfaktor bestimmt die Gewichtskraft, nicht die Trägheit. Auf dem Mond ist ein Körper leichter zu heben, aber genauso schwer in Schwung zu bringen wie auf der Erde.",
        "Die Form ändert nichts an der Masse: Ein Klumpen Knete ist als Kugel genauso träge wie als flache Platte."],
    3: [null, "Eine Kraft nach vorne gibt es nicht – niemand schiebt die Fahrgäste. Gebremst werden nur der Bus und über den Boden die Füße; der Oberkörper bewegt sich einfach weiter.",
        "Die Gewichtskraft F_{G} = m · g hängt nur von Masse und Ortsfaktor ab und zeigt senkrecht nach unten. Sie ändert sich beim Bremsen nicht und kann niemanden nach vorne kippen.",
        "Die Masse eines Menschen ändert sich beim Bremsen nicht. Gerade weil er seine Masse behält, ist er träge und bewegt sich weiter."],
    4: [null, "Kein Gurt kann deine Masse verändern. Er wirkt mit einer Kraft auf dich – deine Trägheit bleibt dieselbe.",
        "Nach vorne bewegst du dich beim Aufprall wegen deiner Trägheit von selbst. Der Gurt hält dagegen: Seine Kraft zeigt entgegen der Fahrtrichtung.",
        "Gleichförmig weiterbewegen würdest du dich gerade ohne Gurt – bis Lenkrad oder Scheibe dich stoppen. Der Gurt ändert deine Geschwindigkeit: Er bremst dich ab."],
    5: [null, "Nach vorne kippt der Kopf beim Bremsen oder Frontalaufprall. Beim Stoß von hinten ist der Kopf zunächst in Ruhe und bleibt wegen seiner Trägheit zurück, während der Sitz den Körper nach vorne schiebt.",
        "Die Gewichtskraft zeigt immer senkrecht nach unten, nie nach hinten. Der Kopf kippt nach hinten, weil er in Ruhe bleibt, während der Körper nach vorne beschleunigt wird.",
        "Der Gurt hält den Oberkörper nur, wenn dieser nach vorne will. Beim Stoß von hinten schiebt der Sitz den Körper nach vorne – der Kopf bleibt zurück, ganz ohne Gurt."],
    6: [null, "Langsam klingt vorsichtig, ist hier aber falsch: Solange das Tuch unter dem Geschirr gleitet, zieht die Reibung das Geschirr mit. Je länger das dauert, desto mehr Geschwindigkeit bekommt es.",
        "Schon in der langsamen Anfangsphase nimmt die Reibung das Geschirr ein Stück mit. Das Tuch muss von Anfang an ruckartig weggezogen werden.",
        "Bei vielen langsamen Zügen wirkt die Reibung insgesamt lange auf das Geschirr – es rutscht jedes Mal ein Stück mit. Nötig ist eine einzige, möglichst kurze Krafteinwirkung."],
    7: [null, "Wäre die Antriebskraft größer, gäbe es eine resultierende Kraft nach vorne – das Auto würde schneller. Für gleichbleibende Geschwindigkeit muss sie genau so groß sein wie Reibung und Luftwiderstand.",
        "Auf das Auto wirken sehr wohl Kräfte: Antriebskraft, Reibung und Luftwiderstand, dazu die Gewichtskraft und die Gegenkraft der Straße. Sie heben sich nur gegenseitig auf – die resultierende Kraft ist null.",
        "Dann zeigte die resultierende Kraft nach hinten, und das Auto würde langsamer. Gleich schnell bleibt es nur, wenn sich die Kräfte ausgleichen."],
    8: [null, "Auf einer Kreisbahn ändert sich die Bewegungsrichtung ständig – dafür braucht es eine Kraft, und die hat die Schnur geliefert. Ohne Schnur fehlt diese Kraft.",
        "Der Ball fliegt nicht in Verlängerung der Schnur nach außen, sondern in die Richtung, in die er sich im Moment des Reißens bewegt hat – quer zur Schnur.",
        "Zur Mitte hin hat ihn nur die Schnur gezogen. Reißt sie, wirkt keine Kraft mehr zur Mitte – nach dem Trägheitssatz geht es geradlinig weiter."],
    9: [null, "Gleiche Kraft und gleiche Zeit ergeben dasselbe F · Δt. Weil F · Δt = m · Δv gilt, bekommt der Wagen mit der größeren Masse das kleinere Δv.",
        "Mehr Masse bedeutet mehr Trägheit: Der volle Wagen lässt sich schwerer in Bewegung setzen, nicht leichter.",
        "Auch der beladene Wagen wird schneller – eine resultierende Kraft ändert immer die Geschwindigkeit. Sein Δv ist nur kleiner, weil seine Masse größer ist."],
    10: [null, "Das beschreibt eine plastische Verformung, zum Beispiel bei Knetmasse. Elastisch heißt: Nach dem Entlasten kehrt der Körper in seine alte Form zurück.",
         "Beim Verformen geht keine Masse verloren – eine gedehnte Feder hat dieselbe Masse wie vorher. Entscheidend ist, ob die alte Form zurückkommt.",
         "Wie viel Kraft man braucht, entscheidet nicht über elastisch oder plastisch: Ein Gummiband dehnt sich schon bei kleinen Kräften elastisch, Knete verformt sich leicht plastisch."],
    11: [null, "Dann würde sich eine Feder immer gleich weit dehnen, ob du leicht oder kräftig ziehst. Tatsächlich verdoppelt sich die Verlängerung, wenn du die Kraft verdoppelst.",
         "Die Federhärte D ist eine Eigenschaft der Feder und bleibt im elastischen Bereich gleich. Mit der Kraft wächst die Verlängerung s, nicht D.",
         "Die Masse der Feder selbst kommt im hookeschen Gesetz nicht vor. Es verbindet die dehnende Kraft F mit der Verlängerung s."],
    13: [null, "Aus D = F : s folgt: Die Kraft wird durch die Länge geteilt, nicht mit ihr malgenommen. Darum steht der Meter unter dem Bruchstrich: N/m.",
         "Die Federhärte ist eine Kraft pro Länge. Kraft misst man in Newton – Kilogramm ist die Einheit der Masse.",
         "Das ist der Kehrwert: m/N gäbe an, wie viele Meter pro Newton gedehnt wird. Die Federhärte ist aber Kraft pro Länge."],
    14: [null, "Größere Verlängerung bei gleicher Kraft heißt: Feder B gibt leichter nach, sie ist weicher. Härter ist die Feder, die sich weniger dehnt.",
         "Bei gleicher Federhärte müssten sich beide bei gleicher Kraft gleich weit dehnen. Verschiedene Verlängerungen bedeuten verschiedene Federhärten.",
         "Ob eine Feder plastisch verformt ist, sieht man erst nach dem Entlasten: Bleibt sie länger? Die kleine Verlängerung zeigt nur, dass A härter ist."],
    15: [null, "Flach heißt: Für viel Verlängerung braucht man wenig Kraft – das ist die weichere Feder. Die härtere braucht bei gleichem s mehr Kraft, ihre Gerade steigt steiler.",
         "Wie lang eine Gerade ist, hängt nur davon ab, bis zu welcher Kraft gemessen wurde. Die Federhärte steckt in der Steigung.",
         "Mehr Messpunkte machen eine Messung genauer, ändern aber nichts an der Feder. Die Federhärte erkennst du an der Steigung der Geraden."],
    16: [null, "Ein Kraftmesser darf gerade nicht plastisch verformt werden, sonst zeigt er danach falsch an. Er arbeitet im elastischen Bereich.",
         "Würde D mit der Kraft wachsen, gäbe die Feder bei großen Kräften immer weniger nach – die Skalenstriche rückten immer enger zusammen. Gleiche Abstände gibt es nur bei gleichbleibendem D.",
         "Ein Kraftmesser zeigt jede Zugkraft an, nicht nur Gewichtskräfte – mit dem Ort hat die Einteilung seiner Skala nichts zu tun. Entscheidend ist, wie sich die Feder bei wachsender Kraft dehnt."],
    20: [null, "Senkrecht zur Ebene wirkt die Normalkraft F_{N}. Die Hangabtriebskraft ist die Teilkraft, die den Körper die Ebene entlang zieht.",
         "Senkrecht nach unten zeigt die Gewichtskraft F_{G} selbst. F_{H} ist nur ihre Teilkraft parallel zur Ebene.",
         "Parallel zur Ebene stimmt, die Richtung nicht: Ein Wagen rollt von selbst hinab, nicht hinauf. Hangaufwärts zeigt die Haltekraft, die F_{H} ausgleicht."],
    22: [null, "Ein Kräftegleichgewicht ist ein Zustand (die resultierende Kraft ist null), kein Zeichenverfahren. Zerlegen kannst du F_{G}, indem du sie als Diagonale eines Parallelogramms zeichnest.",
         "Das hookesche Gesetz beschreibt, wie weit sich eine Feder dehnt. Mit dem Zerlegen einer Kraft in zwei Richtungen hat es nichts zu tun.",
         "Der Trägheitssatz sagt, was ohne resultierende Kraft passiert. Er ist kein zeichnerisches Verfahren zum Zerlegen von Kräften."],
    23: [null, "Genau umgekehrt: So ändern sich die Kräfte, wenn die Ebene flacher wird. Auf einer steileren Rampe rollt ein Wagen stärker hinab – F_{H} wächst.",
         "F_{H} und F_{N} sind Teilkräfte derselben Gewichtskraft. Wächst F_{H} beim Steilerwerden, muss F_{N} kleiner werden – zusammen ergeben sie im Kräfteparallelogramm immer F_{G}.",
         "Gleich bleibt nur F_{G}. Wie sie auf F_{H} und F_{N} aufgeteilt wird, hängt von der Neigung der Ebene ab."],
    24: [null, "Die Rampe nimmt einen Teil auf – aber das ist die Teilkraft F_{N}. Die Gewichtskraft F_{G} = m · g selbst ändert sich nicht, weil sich weder m noch g ändern.",
         "Senkrecht zur Rampe zeigt die Normalkraft F_{N}. Die Gewichtskraft zeigt immer senkrecht nach unten, egal worauf der Wagen steht.",
         "Dass der Wagen hangabwärts zieht, liegt an der Teilkraft F_{H}. Die Gewichtskraft selbst bleibt F_{G} = m · g."],
    25: [null, "Das Seil muss nicht die ganze Gewichtskraft halten: Die Teilkraft senkrecht zur Ebene, F_{N}, nimmt die Rampe auf. Übrig bleibt nur F_{H} parallel zur Ebene.",
         "Die Rampe trägt nur die Normalkraft F_{N} senkrecht zur Ebene. Gegen die Hangabtriebskraft hilft sie ohne Reibung nicht – ohne Seil rollt der Wagen hinab.",
         "Hangabwärts zieht schon F_{H}. Zöge das Seil auch hangabwärts, wäre die Kraft hangabwärts doppelt so groß. Für ein Gleichgewicht muss das Seil entgegengesetzt ziehen."],
    26: [null, "Serpentinen machen die Straße flacher, nicht steiler: Für dieselbe Höhe wird der Weg länger. Auf einer flacheren Straße ist F_{N} sogar etwas größer.",
         "Die Gewichtskraft F_{G} = m · g ist auf jeder Straße gleich groß. Kleiner wird auf der flacheren Straße nur die Teilkraft F_{H}.",
         "Eine größere Hangabtriebskraft zieht das Auto stärker bergab – bergauf bräuchte es dann mehr Antriebskraft, nicht weniger. Serpentinen machen F_{H} kleiner."],
    29: [null, "Die längere Rampe ist bei gleicher Höhe flacher. Nach F_{H} : F_{G} = h : l wird F_{H} kleiner, wenn l größer wird – nicht größer.",
         "Die Höhe ist gleich, die Länge aber nicht: Bei doppelter Länge halbiert sich h : l – und damit auch F_{H}.",
         "Die Gewichtskraft der Kiste hängt nicht von der Rampe ab, F_{G} = m · g bleibt gleich. Halb so groß wird nur die Teilkraft F_{H}."]
  },
  spick: {
    kern: ["**Trägheitssatz:** Wirkt keine resultierende Kraft, bleibt ein Körper in Ruhe oder bewegt sich gleichförmig geradlinig weiter. Maß für die Trägheit ist die **Masse**.",
           "Gurt und Kopfstütze schützen vor den Folgen der Trägheit (Vollbremsung, Stoß von hinten).",
           "**Elastisch** verformt: Der Körper nimmt seine alte Form wieder an · **plastisch**: Er bleibt verformt (oberhalb der Elastizitätsgrenze auch eine Feder).",
           "**Hookesches Gesetz** im elastischen Bereich: **F = D · s**, Federhärte D in N/m oder N/cm; das F-s-Diagramm ist eine Ursprungsgerade.",
           "Schiefe Ebene: F_{G} wird mit dem Kräfteparallelogramm zerlegt in die **Hangabtriebskraft F_{H}** (parallel zur Ebene, hangabwärts) und die **Normalkraft F_{N}** (senkrecht zur Ebene).",
           "**F_{H} : F_{G} = h : l** – je steiler die Ebene, desto größer F_{H} und desto kleiner F_{N}."],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn mit dem Trägheitssatz, warum man bei einer Vollbremsung ohne Gurt nach vorne geschleudert wird und was der Gurt dagegen tut.",
       // „Gurt“ und „Vollbremsung“ stehen schon in der Frage – geprüft wird, was der Gurt tut (Kraft entgegen der Fahrtrichtung, abbremsen)
       begriffe: [["Trägheit", "träge"], ["Geschwindigkeit", "beweg", "weiter"], ["Kraft", "Kräfte"],
                  ["Kraft entgegen der Fahrtrichtung", "entgegen", "Gegenkraft", "nach hinten", "festhält", "festgehalten", "zurückhält", "zurückgehalten", "hält mich", "hält ihn", "hält einen", "hält den"],
                  ["abbremsen", "abgebremst", "bremst", "bremsen", "verzöger", "langsamer"], ["Masse"], ["gleichförmig", "geradlinig", "Ruhe"]],
       muster: "Beim Bremsen wird nur das Auto abgebremst. Mein Körper hat eine **Masse** und ist **träge**: Nach dem **Trägheitssatz** bewegt er sich ohne **Kraft** mit der alten **Geschwindigkeit** **geradlinig** weiter – also nach vorne, bis ihn Lenkrad oder Scheibe stoppen. Der **Gurt** übt eine **Kraft entgegen der Fahrtrichtung** auf mich aus und **bremst** mich zusammen mit dem Auto ab."},
      {frage: "Erkläre, wie man die Gewichtskraft eines Wagens auf einer schiefen Ebene zerlegt und was sich ändert, wenn die Ebene steiler wird.",
       // Teilwort-Treffer: „parallel“ allein steckt in „Kräfteparallelogramm“, „senkrecht“ allein in „senkrecht nach unten“ (F_G) – daher Wendungen
       begriffe: [["Gewichtskraft", "F_G"], ["Hangabtriebskraft", "F_H"], ["Normalkraft", "F_N"],
                  ["parallel zur Ebene", "parallel zu", "parallele", "parallel und", "parallel hang", "parallel nach", "parallel ist", "parallel wirkt", "parallel verl", "ist parallel", "verläuft parallel", "wirkt parallel", "zeigt parallel", "entlang"],
                  ["senkrecht zur Ebene", "senkrecht zu", "senkrecht auf", "rechtwinklig", "rechten winkel"], ["Kräfteparallelogramm", "Parallelogramm", "Diagonale"],
                  ["hangabwärts", "abwärts", "bergab", "hinab", "hinunter"], ["steiler", "steil", "Neigung"]],
       muster: "Die **Gewichtskraft F_{G}** zeigt senkrecht nach unten. Mit dem **Kräfteparallelogramm** zerlege ich sie in die **Hangabtriebskraft F_{H}**, die **parallel** zur Ebene **hangabwärts** gerichtet ist, und die **Normalkraft F_{N}**, die **senkrecht** zur Ebene wirkt. Es gilt F_{H} : F_{G} = h : l. Je **steiler** die Ebene, desto größer F_{H} und desto kleiner F_{N}."}
    ]
  },
  zuordnung: {
    "Der Tischtuchtrick": [1, 2, 6, 9],
    "Trägheit im Fahrzeug: Gurt und Kopfstütze": [0, 3, 4, 5, 7, 8],
    "Elastisch oder plastisch?": [10],
    "Hookesches Gesetz: F = D · s": [11, 12, 13, 14, 15, 17, 19],
    "Federkraftmesser – den Messbereich richtig wählen": [16, 18],
    "Schiefe Ebene: Hangabtriebskraft und Normalkraft": [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
  },
  hilfen: {
    17: ["Hookesches Gesetz: F = D · s", "Einsetzen: F = 25 N/m · 0,12 m", "Die Einheit m kürzt sich weg: F = 25 · 0,12 N = … N"],
    18: ["Aus F = D · s folgt D = F : s.", "Einsetzen: D = 2,0 N : 5,0 cm – rechne in cm, denn gefragt ist N/cm.", "D = 2,0 : 5,0 N/cm = … N/cm"],
    19: ["Berechne zuerst die Gewichtskraft F_{G} = m · g. Rechne dazu 200 g in kg um (Faktor 1000): 200 g = 0,200 kg.",
         "F_{G} = 0,200 kg · 9,81 N/kg ≈ 1,96 N. Aus F = D · s folgt s = F : D = 1,96 N : 40 N/m.",
         "Das Ergebnis von 1,96 : 40 ist in m. Gefragt ist cm: 1 m = 100 cm, also mal 100 rechnen – s ≈ … cm."],
    27: ["Mit dem Maßstab rechnest du die Pfeillänge in eine Kraft um: 1 cm entspricht 200 N.", "Der Pfeil ist 3,5 cm lang, also 3,5-mal so lang wie 1 cm.", "F_{N} = 3,5 · 200 N = … N"],
    28: ["Es gilt F_{H} : F_{G} = h : l.", "h : l = 1,0 m : 4,0 m = 1 : 4", "F_{H} = 600 N : 4 = … N"]
  }
});
})();
