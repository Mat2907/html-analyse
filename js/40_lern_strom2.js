/* ---------- 40_lern_strom2.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum 2 (Kap. 1.4–1.6: Kennlinien, Reihen- und Parallelschaltung, Sicherheit im Haushalt)
   Türrätsel „Der Türöffner“ · Suchbild „Gefahren in der Wohnung“ (mit Begründungen und Ablenkern) · Lernzettel · Fehler → Exponat · Tipps zu Rechenaufgaben
   Rechenwerkstatt (4 Rechenwege, 3 Umstellungen, 3 Fehlersuchen) · Rückmeldung je falscher Antwort für alle Auswahlfragen
   (Das Labor „Die Kennlinie der Glühlampe“ sitzt am Kennlinien-Schreiber in 20_strom2.js.)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;
const TAU = Math.PI * 2;
const de = (x, d = 2) => x.toFixed(d).replace(".", ",");

/* ---------- kleine Zeichenhilfen ---------- */
const line = (g, pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const txt = (g, s, x, y, size, col, align = "center", weight = 600) => { g.fillStyle = col; g.font = `${weight} ${size}px system-ui, sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.fillText(s, x, y); };
const rr = (g, x, y, w, h, r, fill, stroke, lw = 3) => { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
const dot = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
// Text mit tiefgestellten Indizes: "I_{ges} = 0,60 A"
function rtxt(g, s, x, y, size, col, align = "center", weight = 600){
  const parts = []; String(s).replace(/_\{([^}]*)\}|([^_]+|_)/g, (m, a, b) => { parts.push(a != null ? [a, 1] : [b, 0]); return m; });
  const f = sub => `${weight} ${Math.round(sub ? size * .75 : size)}px system-ui, sans-serif`;
  let W = 0; for (const [t, sub] of parts) { g.font = f(sub); W += g.measureText(t).width; }
  let cx = align === "center" ? x - W / 2 : align === "right" ? x - W : x;
  g.fillStyle = col; g.textAlign = "left"; g.textBaseline = "middle";
  for (const [t, sub] of parts) { g.font = f(sub); g.fillText(t, cx, y + (sub ? size * .26 : 0)); cx += g.measureText(t).width; }
  return W;
}
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, 7); g.fill(); }
// Punkte (Elektronen), die entlang eines Linienzugs wandern
function walkers(g, pts, gap, shift, col){
  const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  g.fillStyle = col;
  for (let s0 = ((shift % gap) + gap) % gap; s0 < L; s0 += gap) { let s = s0, i = 0; while (s > seg[i]) { s -= seg[i]; i++; }
    const k = s / seg[i], X = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, Y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k; g.beginPath(); g.arc(X, Y, 6, 0, TAU); g.fill(); }
}

/* ---------- Türrätsel: Der Türöffner ---------- */
const U0 = 6, R1 = 30, IZ = .6, IF = 1;   // Quelle, fester Widerstand, Zielstrom, Sicherung
const strom = v => { const par = v.s === 1, I1 = par ? U0 / R1 : U0 / (R1 + v.R), I2 = par ? U0 / v.R : I1, Ig = par ? I1 + I2 : I1; return {par, I1, I2, Ig, blown: Ig > IF + 1e-9}; };
let needle = 0;   // Zeiger des Amperemeters (läuft weich nach)
const raetsel = {
  titel: "Der Türöffner",
  text: "Der **Türöffner** in der Zuleitung zieht den Riegel erst zurück, wenn **genau I_{ges} = 0,60 A** durch ihn fließt (er selbst hat praktisch keinen Widerstand). Die Quelle liefert **U = 6,0 V**, eingebaut ist schon der Widerstand **R_{1} = 30 Ω**. Baue einen zweiten Widerstand R_{2} ein – in Reihe oder parallel zu R_{1} – und wähle seinen Wert. Achtung: Die Sicherung verträgt höchstens **1 A**.",
  regler: [{id: "s", name: "R_{2} einbauen", optionen: ["in Reihe zu R_{1}", "parallel zu R_{1}"], wert: 0},
           {id: "R", name: "Widerstand R_{2}", einheit: "Ω", min: 5, max: 60, schritt: 5, wert: 30}],
  zeichne(g, w, h, v, t, ok){
    g.fillStyle = "#10131a"; g.fillRect(0, 0, w, h);
    const c = strom(v), wire = "#d8a85a", XB = 70, YT = 140, YB = 400, X2 = 540, X1 = 730, XA = 170, XF = 300, XC = 420, YC = 270;
    const on = !c.blown, I1 = on ? c.I1 : 0, I2 = on ? c.I2 : 0, Ig = on ? c.Ig : 0;
    rtxt(g, "Türöffner · zieht bei I_{ges} = 0,60 A", w / 2, 34, 30, "#ffe9a8", "center", 700);
    // Statuszeile
    if (ok) txt(g, "🔓 Der Türöffner zieht – die Tür ist offen!", w / 2, 80, 26, "#5fd38d", "center", 700);
    else if (c.blown) { if (Math.sin(t * 8) > -.3) txt(g, "⚡ Sicherung durchgebrannt – der Strom ist zu groß!", w / 2, 80, 26, "#ff5a48", "center", 700); }
    else rtxt(g, c.par ? "Zwei Stromwege: R_{1} und R_{2} parallel" : "Ein einziger Stromweg: R_{1} und R_{2} in Reihe", w / 2, 80, 26, "#cfd8e6", "center", 600);
    // Leitungen
    line(g, [[XB, YB], [XB, YT], [X1, YT], [X1, YB], [XB, YB]], wire, 7);
    if (c.par) { line(g, [[X2, YT], [X2, YB]], wire, 7); dot(g, X2, YT, 9, wire); dot(g, X2, YB, 9, wire); }
    // Elektronen: vom Minuspol (unten) durch die Zweige nach oben zum Pluspol, Tempo ~ Stromstärke
    const loop = x => [[XB, 316], [XB, YB], [x, YB], [x, YT], [XB, YT], [XB, 268]];
    if (on) { walkers(g, loop(X1), 34, t * I1 * 320, "#7fd8ff"); if (c.par) walkers(g, loop(X2), 34, t * I2 * 320 + 17, "#7fd8ff"); }
    // Quelle (langer Strich = Pluspol oben)
    g.fillStyle = "#10131a"; g.fillRect(XB - 36, 274, 72, 36); line(g, [[XB - 34, 280], [XB + 34, 280]], "#ffffff", 5); line(g, [[XB - 17, 302], [XB + 17, 302]], "#ffffff", 11);
    txt(g, "+", XB + 50, 262, 28, "#ff6b5b", "center", 700); txt(g, "−", XB + 50, 318, 32, "#6ba8ff", "center", 700);
    txt(g, "U = 6,0 V", 22, 446, 26, "#ffffff", "left", 700);
    // Amperemeter in der Zuleitung
    dot(g, XA, YT, 28, "#f2f2f2"); g.strokeStyle = "#111"; g.lineWidth = 4; g.beginPath(); g.arc(XA, YT, 28, 0, TAU); g.stroke(); txt(g, "A", XA, YT + 2, 30, "#111", "center", 800);
    // Sicherung
    g.fillStyle = "#10131a"; g.fillRect(XF - 40, YT - 16, 80, 32); g.strokeStyle = c.blown ? "#ff5a48" : "#ffffff"; g.lineWidth = 4; g.strokeRect(XF - 40, YT - 16, 80, 32);
    if (c.blown) { line(g, [[XF - 40, YT], [XF - 12, YT + 4]], "#ffffff", 3); line(g, [[XF + 12, YT - 4], [XF + 40, YT]], "#ffffff", 3);
      if (Math.sin(t * 13) > 0) for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + t * 3; line(g, [[XF + Math.cos(a) * 8, YT + Math.sin(a) * 8], [XF + Math.cos(a) * 20, YT + Math.sin(a) * 20]], "#ffb347", 3); } }
    else line(g, [[XF - 40, YT], [XF + 40, YT]], "#ffffff", 3);
    txt(g, "Sicherung 1 A", XF, YT + 36, 22, c.blown ? "#ff8a7a" : "#cfd8e6", "center", 600);   // unter der Sicherung: oben stößt sie sonst an die Statuszeile
    // Widerstände
    const box = (x, y, bw, bh, name, val, lx, align) => { g.fillStyle = "#10131a"; g.fillRect(x - bw / 2, y - bh / 2, bw, bh); g.strokeStyle = "#ffffff"; g.lineWidth = 5; g.strokeRect(x - bw / 2, y - bh / 2, bw, bh);
      rtxt(g, name, x, y, 28, "#ffffff", "center", 700); txt(g, val, lx, y, 28, "#ffe9a8", align, 700); };
    box(X1, YC, 52, 104, "R_{1}", "30 Ω", X1 + 40, "left");
    if (c.par) box(X2, YC, 52, 104, "R_{2}", `${v.R} Ω`, X2 + 40, "left");
    else { g.fillStyle = "#10131a"; g.fillRect(414, YT - 23, 112, 46); g.strokeStyle = "#ffffff"; g.lineWidth = 5; g.strokeRect(414, YT - 23, 112, 46);
      rtxt(g, "R_{2}", 470, YT, 28, "#ffffff", "center", 700); txt(g, `${v.R} Ω`, 470, YT + 50, 28, "#ffe9a8", "center", 700); }
    // Türöffner (Elektromagnet) in der Rückleitung, daneben das Schloss
    g.fillStyle = "#10131a"; g.fillRect(XC - 52, YB - 22, 104, 44); g.strokeStyle = "#ffffff"; g.lineWidth = 4; g.strokeRect(XC - 52, YB - 22, 104, 44);
    g.strokeStyle = "#d8a85a"; g.lineWidth = 4; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(XC - 36 + k * 18, YB, 9, Math.PI, 0); g.stroke(); }
    txt(g, "Türöffner", XC, YB + 48, 24, "#cfd8e6", "center", 600);
    lockIcon(g, XC + 96, YB + 70, 50, ok, ok ? "#5fd38d" : "#ff5a48");
    // Zeigerinstrument des Amperemeters (Skala 0 … 1 A, Zielmarke 0,6 A)
    needle += (Ig - needle) * .12;
    const DX = 280, DY = 322, DR = 76, ang = x => Math.PI + Math.min(1.05, Math.max(0, x)) * Math.PI;
    rr(g, DX - 122, DY - 118, 244, 160, 16, "#1b2130", "#4a5570", 3);
    for (let k = 0; k <= 10; k++) { const a = ang(k / 10), r0 = k === 6 ? DR - 26 : k % 2 ? DR - 10 : DR - 18, tgt = k === 6;
      line(g, [[DX + Math.cos(a) * r0, DY + Math.sin(a) * r0], [DX + Math.cos(a) * DR, DY + Math.sin(a) * DR]], tgt ? "#5fd38d" : "#cfd8e6", tgt ? 5 : k % 2 ? 2 : 3);
      if (k % 2 === 0) txt(g, k === 0 ? "0" : k === 10 ? "1" : de(k / 10, 1), DX + Math.cos(a) * (DR + 24), DY + Math.sin(a) * (DR + 22), 22, tgt ? "#5fd38d" : "#cfd8e6", "center", tgt ? 800 : 600); }
    { const a = ang(needle); line(g, [[DX, DY], [DX + Math.cos(a) * (DR - 4), DY + Math.sin(a) * (DR - 4)]], c.blown ? "#ff5a48" : "#ffffff", 4); dot(g, DX, DY, 8, "#ffffff"); }
    rtxt(g, "I_{ges} in A · Ziel 0,6", DX, DY + 24, 22, "#cfd8e6", "center", 600);
  },
  pruefe(v){
    const c = strom(v);
    if (!c.par) { const R = R1 + v.R; return {ok: false, text: `In Reihe addieren sich die Widerstände: R_{ges} = 30 Ω + ${v.R} Ω = ${R} Ω. Dann fließen nur I = 6,0 V : ${R} Ω = ${de(c.Ig)} A – noch weniger als die 0,20 A durch R_{1} allein. Eine Reihenschaltung macht den Strom immer **kleiner**. Für 0,60 A brauchst du einen **zweiten Stromweg**.`}; }
    const sum = `I_{ges} = I_{1} + I_{2} = 0,20 A + ${de(c.I2)} A = ${de(c.Ig)} A`;
    if (c.blown) return {ok: false, text: `Parallel addieren sich die Ströme: ${sum}. Das ist mehr als 1 A – die **Sicherung** brennt durch und unterbricht den Stromkreis. Je kleiner R_{2}, desto größer I_{2}: Wähle einen **größeren** Widerstand.`};
    if (Math.abs(c.Ig - IZ) < 1e-9) return {ok: true};
    return {ok: false, text: `Richtig, parallel addieren sich die Ströme: ${sum}. ${c.Ig > IZ ? "Das ist zu viel – R_{2} muss **größer** sein." : "Das ist zu wenig – R_{2} muss **kleiner** sein."}`};
  },
  tipps: ["Wie groß ist der Strom durch R_{1} allein? Rechne I_{1} = U : R_{1}. Kann ein zweiter Widerstand **in Reihe** den Strom größer machen?",
          "I_{1} = 6,0 V : 30 Ω = 0,20 A. Den Rest muss ein zweiter Zweig **parallel** liefern: I_{2} = 0,60 A − 0,20 A = 0,40 A.",
          "R_{2} = U : I_{2} = 6,0 V : 0,40 A = … Ω"],
  loesung: {s: 1, R: 15},
  erfolg: "Parallel geschaltet: I_{ges} = 0,20 A + 0,40 A = **0,60 A** – der Türöffner zieht den Riegel zurück. Übrigens: Der Gesamtwiderstand ist jetzt nur 6,0 V : 0,60 A = **10 Ω** – kleiner als jeder Einzelwiderstand."
};

/* ---------- Suchbild: Gefahren in der Wohnung ---------- */
function wohnung(g, w, h){
  // --- Wände und Böden: Bad (links) · Flur (Mitte) · Küche (rechts)
  g.fillStyle = "#dcebf2"; g.fillRect(0, 0, 380, 600); g.strokeStyle = "#c2d8e3"; g.lineWidth = 2;
  for (let x = 0; x <= 380; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 600); g.stroke(); } for (let y = 0; y <= 600; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(380, y); g.stroke(); }
  g.fillStyle = "#f1e7d3"; g.fillRect(380, 0, 320, 600); g.fillStyle = "#f7f2e6"; g.fillRect(700, 0, 500, 600);
  g.fillStyle = "#b9c6cc"; g.fillRect(0, 600, 380, 200); g.strokeStyle = "#a7b5bb"; for (let x = 0; x <= 380; x += 50) { g.beginPath(); g.moveTo(x, 600); g.lineTo(x, 800); g.stroke(); } for (let y = 600; y <= 800; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(380, y); g.stroke(); }
  g.fillStyle = "#c99c63"; g.fillRect(380, 600, 320, 200); g.strokeStyle = "#b0844f"; for (let y = 625; y < 800; y += 32) { g.beginPath(); g.moveTo(380, y); g.lineTo(700, y); g.stroke(); }
  for (let y = 600, k = 0; y < 800; y += 32, k++) for (let x = 380 + (k % 2) * 60; x < 700; x += 120) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
  for (let y = 600; y < 800; y += 50) for (let x = 700; x < 1200; x += 50) { g.fillStyle = ((x + y) / 50) % 2 ? "#e8e1d2" : "#d9d0bd"; g.fillRect(x, y, 50, 50); }
  g.fillStyle = "#b9ad96"; g.fillRect(376, 0, 8, 600); g.fillRect(696, 0, 8, 600);
  g.fillStyle = "#8c7f6a"; g.fillRect(0, 596, 1200, 6);

  // --- Bad: Spiegel mit Leuchte, Handtuch, Steckdose mit Klappdeckel, Badewanne mit Föhn (Fehler)
  rr(g, 70, 92, 180, 190, 14, "#9fb4be"); const mg = g.createLinearGradient(80, 100, 240, 270); mg.addColorStop(0, "#f4fbfe"); mg.addColorStop(1, "#b9d7e5"); rr(g, 80, 102, 160, 170, 10, mg);
  line(g, [[110, 130], [150, 110]], "rgba(255,255,255,.85)", 6); line(g, [[110, 160], [180, 120]], "rgba(255,255,255,.6)", 4);
  rr(g, 90, 64, 140, 16, 8, "#f6f6f6", "#b9c3c8", 2); const lg = g.createRadialGradient(160, 82, 4, 160, 82, 70); lg.addColorStop(0, "rgba(255,240,180,.7)"); lg.addColorStop(1, "rgba(255,240,180,0)"); g.fillStyle = lg; g.fillRect(90, 70, 140, 80);
  line(g, [[300, 104], [300, 118]], "#7d8b91", 6); rr(g, 272, 118, 58, 118, 6, "#e07a5f"); g.fillStyle = "#f2d0c4"; g.fillRect(272, 200, 58, 10); g.fillRect(272, 216, 58, 6);
  // Steckdose mit Klappdeckel (richtig: spritzwassergeschützt und gut 60 cm neben der Wanne – Wanne etwa 1,7 m lang)
  rr(g, 324, 304, 46, 46, 8, "#f6f6f6", "#9aa7ad", 2); dot(g, 347, 330, 15, "#dde3e6"); dot(g, 341, 330, 3, "#555"); dot(g, 353, 330, 3, "#555");
  g.fillStyle = "#e3e8ea"; g.beginPath(); g.moveTo(326, 304); g.lineTo(368, 304); g.lineTo(372, 286); g.lineTo(322, 286); g.closePath(); g.fill(); g.strokeStyle = "#9aa7ad"; g.lineWidth = 2; g.stroke();
  // Badewanne mit Wasser und Schaum (endet bei x = 234, damit die Steckdose deutlich Abstand hat)
  rr(g, 22, 450, 204, 150, 12, "#ffffff", "#c9d2d6", 3); rr(g, 14, 426, 220, 36, 18, "#fbfbfb", "#c9d2d6", 3); rr(g, 32, 432, 184, 22, 11, "#7cc6e8");
  for (const [x, r] of [[86, 9], [104, 12], [124, 8], [30, 6]]) dot(g, x, 440, r, "rgba(255,255,255,.9)");
  dot(g, 54, 432, 13, "#f6c945"); dot(g, 66, 420, 9, "#f6c945"); g.fillStyle = "#f08a24"; g.beginPath(); g.moveTo(74, 420); g.lineTo(84, 423); g.lineTo(74, 426); g.fill(); dot(g, 68, 418, 2, "#222");
  g.fillStyle = "#c9d2d6"; g.fillRect(40, 596, 26, 8); g.fillRect(182, 596, 26, 8);
  // Föhn liegt eingeschaltet auf dem Wannenrand, Kabel zur Steckdose
  g.strokeStyle = "#333"; g.lineWidth = 5; g.beginPath(); g.moveTo(216, 486); g.bezierCurveTo(262, 540, 372, 440, 347, 352); g.stroke();
  line(g, [[347, 352], [347, 336]], "#333", 5); dot(g, 347, 330, 12, "#333");   // Stecker des Föhns steckt in der Steckdose
  g.save(); g.translate(210, 448); g.rotate(.32); rr(g, -12, 0, 24, 46, 8, "#3d478c"); dot(g, 0, 30, 4, "#ff4d3d"); g.restore();
  rr(g, 138, 402, 92, 36, 18, "#5b6abf"); dot(g, 224, 420, 20, "#4a57a8"); g.strokeStyle = "#323c7a"; g.lineWidth = 2; for (const r of [8, 14]) { g.beginPath(); g.arc(224, 420, r, 0, TAU); g.stroke(); }
  rr(g, 122, 408, 22, 24, 4, "#323c7a");
  for (const y of [406, 420, 434]) { g.strokeStyle = "#e8a85f"; g.lineWidth = 3; g.beginPath(); g.moveTo(116, y); g.bezierCurveTo(108, y - 6, 100, y + 6, 90, y); g.stroke(); }

  // --- Flur: Sicherungskasten (FI richtig, ein Leitungsschutzschalter mit Draht überbrückt), Merkzettel, Stehlampe mit kaputtem Kabel
  rr(g, 410, 40, 262, 292, 8, "#e3e0d8", "#a39f94", 3); g.fillStyle = "#cfcbc1"; g.fillRect(424, 54, 234, 264);
  g.fillStyle = "#9a968c"; g.fillRect(430, 113, 222, 6); g.fillRect(430, 223, 222, 6);
  const ls = (x, y, wd = 26) => { rr(g, x, y - 34, wd, 68, 3, "#f7f6f1", "#b8b4aa", 1.5); g.fillStyle = "#2b2b2b"; g.fillRect(x + wd / 2 - 5, y - 14, 10, 18); g.fillStyle = "#8f8b82"; g.fillRect(x + wd / 2 - 3, y - 31, 6, 4); g.fillRect(x + wd / 2 - 3, y + 27, 6, 4); };
  rr(g, 434, 82, 52, 68, 3, "#f7f6f1", "#b8b4aa", 1.5); g.fillStyle = "#c0392b"; g.fillRect(442, 106, 36, 14);
  rr(g, 490, 82, 76, 68, 3, "#f7f6f1", "#b8b4aa", 1.5); g.fillStyle = "#2b2b2b"; g.fillRect(498, 104, 18, 18); dot(g, 550, 113, 7, "#f2c94c");
  txt(g, "FI", 528, 95, 18, "#222", "center", 800); txt(g, "30 mA", 528, 137, 17, "#222", "center", 700);
  for (let k = 0; k < 3; k++) ls(572 + k * 28, 116);
  for (let k = 0; k < 7; k++) ls(444 + k * 28, 226);
  txt(g, "B16", 541, 172, 17, "#555", "center", 700);
  // Kupferdraht um den Schalter herum (Fehler)
  g.strokeStyle = "#a55a1c"; g.lineWidth = 7; g.beginPath(); g.moveTo(569, 195); g.bezierCurveTo(612, 176, 626, 276, 569, 257); g.stroke();
  g.strokeStyle = "#f2a65a"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(569, 195); g.bezierCurveTo(612, 176, 626, 276, 569, 257); g.stroke();
  dot(g, 569, 195, 5, "#777"); dot(g, 569, 257, 5, "#777");
  // Merkzettel
  rr(g, 392, 370, 200, 168, 4, "#fffdf2", "#d8cfae", 2); dot(g, 492, 380, 7, "#d23c3c");
  txt(g, "Merkzettel", 492, 398, 24, "#2a3d6a", "center", 800);
  // richtige erste Zeile weit genug über dem Fehlerkreis des zweiten Satzes
  txt(g, "Steckdose: 230 V", 402, 428, 20, "#2a3d6a", "left", 600);
  txt(g, "Alle Geräte sind", 402, 486, 20, "#2a3d6a", "left", 600); txt(g, "in Reihe geschaltet.", 402, 514, 20, "#2a3d6a", "left", 600);
  // Stehlampe
  const sg = g.createRadialGradient(650, 450, 10, 650, 450, 110); sg.addColorStop(0, "rgba(255,236,160,.75)"); sg.addColorStop(1, "rgba(255,236,160,0)"); g.fillStyle = sg; g.fillRect(540, 340, 160, 220);
  line(g, [[650, 445], [650, 742]], "#666", 6); g.fillStyle = "#444"; g.beginPath(); g.ellipse(650, 745, 40, 10, 0, 0, TAU); g.fill();
  g.fillStyle = "#f0d58a"; g.beginPath(); g.moveTo(626, 392); g.lineTo(674, 392); g.lineTo(696, 446); g.lineTo(604, 446); g.closePath(); g.fill(); g.strokeStyle = "#c9a85a"; g.lineWidth = 2; g.stroke();
  // Wandsteckdose und Kabel der Stehlampe, Isolierung beschädigt (Fehler)
  rr(g, 413, 555, 36, 36, 6, "#f6f6f6", "#a6a093", 2); dot(g, 431, 573, 11, "#dcd8cf"); dot(g, 427, 573, 2.5, "#555"); dot(g, 435, 573, 2.5, "#555");
  g.strokeStyle = "#2b2b2b"; g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.moveTo(622, 748); g.quadraticCurveTo(590, 742, 546, 736); g.stroke();
  g.beginPath(); g.moveTo(514, 734); g.bezierCurveTo(470, 732, 440, 700, 433, 586); g.stroke();
  line(g, [[433, 586], [431, 578]], "#2b2b2b", 7); dot(g, 431, 573, 9, "#2b2b2b");   // Stecker der Stehlampe (sie leuchtet)
  for (const [dy, c] of [[-3, "#d98a3a"], [0, "#f2a65a"], [3, "#c26f25"]]) line(g, [[546, 736 + dy * .6], [530, 735 + dy], [514, 734 + dy * .6]], c, 2.5);
  line(g, [[546, 732], [551, 727]], "#2b2b2b", 3); line(g, [[514, 730], [509, 725]], "#2b2b2b", 3);
  for (const [x1, y1, x2, y2] of [[530, 720, 530, 708], [521, 722, 514, 713], [539, 722, 546, 713]]) line(g, [[x1, y1], [x2, y2]], "#ffcc33", 3);

  // --- Küche: Hängeschränke, Rauchmelder (richtig), Arbeitsplatte, Toaster mit Gabel (Fehler), Kaffeemaschine, Mikrowelle, Steckdosenleisten-Kette (Fehler)
  g.fillStyle = "#f4f4f4"; g.beginPath(); g.ellipse(1000, 10, 36, 12, 0, 0, Math.PI); g.fill(); g.strokeStyle = "#bbb"; g.lineWidth = 2; g.stroke(); dot(g, 1000, 14, 3, "#e03a2f");
  rr(g, 740, 40, 450, 150, 4, "#d9b98c", "#b8956a", 3); for (const x of [890, 1040]) line(g, [[x, 44], [x, 186]], "#b8956a", 3);
  for (const x of [870, 910, 1020, 1060]) line(g, [[x, 150], [x, 172]], "#7a5f3d", 5);
  g.fillStyle = "#e6eef0"; g.fillRect(740, 300, 460, 140); g.strokeStyle = "#cfdbe0"; g.lineWidth = 2;
  for (let x = 740; x <= 1200; x += 30) { g.beginPath(); g.moveTo(x, 300); g.lineTo(x, 440); g.stroke(); } for (let y = 300; y <= 440; y += 30) { g.beginPath(); g.moveTo(740, y); g.lineTo(1200, y); g.stroke(); }
  g.fillStyle = "#6d5a48"; g.fillRect(740, 440, 460, 18); g.fillStyle = "#e9dcc5"; g.fillRect(746, 458, 450, 162); g.strokeStyle = "#c8b89c"; g.lineWidth = 3;
  for (const x of [896, 1046]) { g.beginPath(); g.moveTo(x, 462); g.lineTo(x, 616); g.stroke(); } for (const x of [878, 914, 1028, 1064]) line(g, [[x, 480], [x, 510]], "#8a7a62", 5);
  g.fillStyle = "#5c4d3e"; g.fillRect(746, 620, 450, 14);
  // Steckdose für den Toaster
  rr(g, 896, 322, 70, 38, 6, "#f6f6f6", "#9aa7ad", 2); for (const x of [914, 948]) { dot(g, x, 341, 12, "#dde3e6"); dot(g, x - 4, 341, 2.5, "#555"); dot(g, x + 4, 341, 2.5, "#555"); }
  g.strokeStyle = "#333"; g.lineWidth = 5; g.beginPath(); g.moveTo(884, 404); g.bezierCurveTo(900, 400, 906, 380, 914, 352); g.stroke(); dot(g, 914, 346, 9, "#333");
  // Toaster eingeschaltet, Gabel im Schlitz
  const tg = g.createRadialGradient(830, 362, 4, 830, 362, 44); tg.addColorStop(0, "rgba(255,150,50,.8)"); tg.addColorStop(1, "rgba(255,150,50,0)"); g.fillStyle = tg; g.fillRect(780, 330, 100, 40);
  line(g, [[816, 370], [794, 300]], "#b9bec4", 7); line(g, [[794, 300], [788, 282]], "#9aa0a6", 9);
  rr(g, 780, 368, 110, 72, 14, "#c0c6cc", "#8a9096", 3); g.fillStyle = "#3a2a1c"; g.fillRect(796, 366, 34, 8); g.fillRect(842, 366, 34, 8);
  g.fillStyle = "rgba(255,120,40,.9)"; g.fillRect(798, 368, 30, 3); g.fillRect(844, 368, 30, 3); g.fillStyle = "#2b2b2b"; g.fillRect(888, 414, 12, 10);
  // Kaffeemaschine und Mikrowelle, ihre Kabel hängen zu den Steckdosenleisten hinunter
  rr(g, 960, 340, 80, 100, 8, "#3b3b3b"); rr(g, 972, 352, 56, 18, 3, "#1d2b22"); txt(g, "08:15", 1000, 361, 13, "#7dffb0", "center", 700); rr(g, 986, 404, 28, 30, 4, "#fafafa", "#ccc", 1);
  rr(g, 1062, 360, 128, 80, 8, "#ececec", "#999", 2); rr(g, 1074, 372, 80, 56, 4, "#2c3238"); for (let k = 0; k < 3; k++) dot(g, 1172, 380 + k * 16, 4, "#777");
  g.strokeStyle = "#333"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(1036, 440); g.bezierCurveTo(1040, 520, 790, 600, 782, 688); g.stroke();
  g.beginPath(); g.moveTo(1150, 440); g.bezierCurveTo(1156, 560, 940, 640, 932, 722); g.stroke();
  // Wandsteckdose links neben der Küchenzeile, daran drei Leisten hintereinander
  rr(g, 708, 556, 30, 34, 5, "#f6f6f6", "#a6a093", 2); dot(g, 723, 573, 9, "#dcd8cf");
  for (const [col, lw] of [["#8a8a8a", 9], ["#f2f2f2", 5]]) { g.strokeStyle = col; g.lineWidth = lw;
    g.beginPath(); g.moveTo(762, 696); g.quadraticCurveTo(728, 700, 723, 578); g.stroke();
    g.beginPath(); g.moveTo(912, 731); g.quadraticCurveTo(866, 735, 860, 700); g.stroke();
    g.beginPath(); g.moveTo(1062, 766); g.quadraticCurveTo(1016, 770, 1010, 735); g.stroke(); }
  const strip = (x, y, plugs) => { rr(g, x, y, 132, 30, 8, "#f5f5f5", "#a0a0a0", 2); for (let k = 0; k < 4; k++) { dot(g, x + 20 + k * 26, y + 15, 9, "#c9c9c9"); const pl = plugs[k];
      if (pl) { dot(g, x + 20 + k * 26, y + 15, 11, pl); g.strokeStyle = "#777"; g.lineWidth = 1.5; g.beginPath(); g.arc(x + 20 + k * 26, y + 15, 11, 0, TAU); g.stroke(); } }
    rr(g, x + 116, y + 8, 12, 14, 3, "#e74c3c"); };
  strip(760, 680, {0: "#333", 3: "#ececec"}); strip(910, 715, {0: "#333", 3: "#ececec"}); strip(1060, 750, {0: "#333", 1: "#333"});
  // Heizlüfter (glüht) am Ende der Kette
  rr(g, 1080, 636, 104, 94, 10, "#d6d6d6", "#9a9a9a", 2); const hg = g.createLinearGradient(1090, 650, 1090, 716); hg.addColorStop(0, "#ff8a3d"); hg.addColorStop(1, "#ff5a1a"); rr(g, 1092, 648, 80, 62, 4, hg);
  for (let k = 0; k < 6; k++) line(g, [[1094, 652 + k * 11], [1170, 652 + k * 11]], "#7a3a14", 2);
  g.strokeStyle = "#333"; g.lineWidth = 5; g.beginPath(); g.moveTo(1100, 730); g.quadraticCurveTo(1090, 745, 1080, 760); g.stroke();
  g.beginPath(); g.moveTo(1106, 765); g.quadraticCurveTo(1150, 800, 1200, 790); g.stroke();
}
const suchbild = {
  titel: "Gefahren in der Wohnung",
  text: "In dieser Wohnung stecken **sechs Fehler**: gefährliches Verhalten mit elektrischem Strom und ein falscher Merksatz. Klicke sie an und begründe, was falsch ist. Vorsicht – nicht alles ist falsch!",
  ort: {x: -3.6, z: -9.5, ry: 0},
  zeichne: wohnung,
  fehler: [
    {x: 182, y: 432, r: 80, name: "Der Föhn am Badewannenrand", frage: "Warum ist das gefährlich?",
     optionen: ["Der Föhn wird vom Wasserdampf zu kalt und geht kaputt.", "Gar nicht – ein Föhn arbeitet nur mit einer kleinen Spannung.", "Fällt er ins Wasser, kann Strom durch das Wasser und durch den Körper fließen – Lebensgefahr!", "Das Wasser verbraucht den Strom, deshalb brennt die Sicherung durch."], richtig: 2,
     warum: ["Es geht nicht darum, dass das Gerät kaputtgeht, sondern um dich: Leitungswasser leitet den elektrischen Strom.",
             "Der Föhn steckt in der Steckdose – er arbeitet mit den vollen 230 V. Das ist keine kleine Spannung, sondern lebensgefährlich.",
             null,
             "Strom wird nicht verbraucht. Gefährlich ist der Weg, den er nehmen kann – und bei einem Strom durch deinen Körper löst eine 16-A-Sicherung meist gar nicht aus."],
     erklaerung: "Leitungswasser leitet den elektrischen Strom. Fällt ein eingeschaltetes Gerät mit **230 V** ins Badewasser, kann ein Strom **durch den Körper** fließen – schon etwa 50 mA können tödlich sein. Elektrogeräte gehören nie an die volle Badewanne. Im Bad ist ein **FI-Schutzschalter** Pflicht."},
    {x: 584, y: 226, r: 66, name: "Der Draht im Sicherungskasten", frage: "Was ist hier falsch?",
     optionen: ["Ein Leitungsschutzschalter ist mit einem Draht überbrückt – bei Kurzschluss oder Überlastung schaltet dieser Stromkreis nicht mehr ab.", "Der Draht verstärkt die Sicherung, dann hält sie doppelt so viel aus – das ist praktisch.", "In einem Sicherungskasten darf überhaupt kein Kupfer verwendet werden.", "Nichts – so löst die Sicherung wenigstens nicht mehr unnötig aus."], richtig: 0,
     warum: [null,
             "Die Leitungen in der Wand halten durch den Draht kein bisschen mehr aus. Weil die Sicherung umgangen wird, kann die Leitung überhitzen, ohne dass etwas abschaltet.",
             "Kupfer ist der ganz normale Leiter – alle Leitungen im Haus sind aus Kupfer. Falsch ist, wo der Draht sitzt: Er führt den Strom an der Sicherung vorbei.",
             "Eine Sicherung löst nicht „unnötig“ aus: Sie schaltet ab, weil die Stromstärke für die Leitung zu groß ist. Ohne sie bemerkt niemand die Überlastung, bis es brennt."],
     erklaerung: "Die **Sicherung** soll den Stromkreis unterbrechen, wenn die Stromstärke zu groß wird (**Kurzschluss**, **Überlastung**). Über den Draht fließt der Strom an ihr vorbei – die Leitungen können glühend heiß werden, es droht ein **Brand**. Sicherungen nie überbrücken oder „flicken“!"},
    {x: 530, y: 732, r: 62, name: "Das Kabel der Stehlampe", frage: "Was ist an diesem Kabel gefährlich?",
     optionen: ["Das Kabel ist zu lang, dadurch sinkt die Spannung auf null.", "Durch ein so dünnes Kabel kann gar kein Strom fließen.", "Ein Kabel muss außen immer grün-gelb sein.", "Die Isolierung ist kaputt: Wer die blanken Kupferdrähte berührt, bekommt einen Stromschlag."], richtig: 3,
     warum: ["Die Lampe leuchtet doch – an ihr liegt also Spannung an. Die Länge ist nicht das Problem, sondern die blanke Stelle im Kabel.",
             "Die Lampe leuchtet, also fließt Strom durch das Kabel. Gefährlich ist, dass die Kupferdrähte an einer Stelle frei liegen.",
             "Grün-gelb ist nur die Isolierung des Schutzleiters innen im Kabel. Der Mantel außen darf jede Farbe haben – er muss aber heil sein.",
             null],
     erklaerung: "Die Kunststoff-**Isolierung** schützt dich vor den Kupferdrähten, die unter Spannung stehen. Ist sie beschädigt, kann beim Berühren ein Strom **durch deinen Körper** zur Erde fließen. Beschädigte Kabel sofort ausstecken und ersetzen lassen – nicht mit Klebeband flicken."},
    {x: 958, y: 712, r: 112, name: "Die Steckdosenleisten", frage: "Was ist hier falsch?",
     optionen: ["Die Leisten sind in Reihe geschaltet, deshalb bekommt jedes Gerät nur einen Teil der Spannung.", "Mehrere Leisten stecken hintereinander an einer Wandsteckdose. Die Ströme aller Geräte addieren sich – Überlastung!", "Steckdosenleisten dürfen nur in Büros verwendet werden.", "Nichts – jede Leiste hat ja ihren eigenen Schalter."], richtig: 1,
     warum: ["Auch über mehrere Leisten hinweg bleiben die Geräte parallel geschaltet – jedes bekommt 230 V. Das Problem ist die Summe der Ströme in der einen Zuleitung.",
             null,
             "Steckdosenleisten sind überall erlaubt. Gefährlich ist, mehrere hintereinanderzustecken und viele starke Geräte gleichzeitig daran zu betreiben.",
             "Ein Schalter begrenzt die Stromstärke nicht. Sind alle Leisten eingeschaltet, fließen die Ströme aller Geräte trotzdem durch die eine Wandsteckdose."],
     erklaerung: "Alle Geräte an den Leisten sind **parallel** geschaltet und hängen an **einer** Wandsteckdose. Ihre Ströme **addieren sich**: Heizlüfter, Kaffeemaschine und Mikrowelle zusammen brauchen schnell mehr als **16 A**. Die Zuleitung wird heiß – **Überlastung**, Brandgefahr. Mehrfachsteckdosen nie hintereinanderstecken!"},
    {x: 826, y: 372, r: 72, name: "Der Toaster", frage: "Was ist hier gefährlich?",
     optionen: ["Im eingesteckten Toaster kann die Metallgabel die Heizdrähte berühren, die unter Spannung stehen – dann fließt Strom durch den Körper.", "Die Gabel wird so heiß, dass der Toaster mehr als 16 A braucht.", "Gar nichts – Metall leitet den elektrischen Strom nicht.", "Die Gabel schmilzt, und das Brot wird schwarz."], richtig: 0,
     warum: [null,
             "An der Stromstärke des Toasters ändert die Gabel nichts. Gefährlich ist, dass sie die Heizdrähte berühren kann, während du sie festhältst.",
             "Metall ist ein sehr guter Leiter – genau deshalb sind Leitungen aus Kupfer. Und genau deshalb ist die Gabel im Toaster so gefährlich.",
             "Eine Gabel schmilzt im Toaster nicht. Die eigentliche Gefahr ist ein Stromschlag, weil Metall leitet und die Heizdrähte unter Spannung stehen."],
     erklaerung: "Metall **leitet** den Strom. Steckt der Toaster in der Steckdose, können seine Heizdrähte unter **230 V** stehen. Berührt die Gabel einen Draht, fließt der Strom über die Gabel **durch deinen Körper**. Immer erst den **Stecker ziehen** und abkühlen lassen."},
    {x: 492, y: 508, r: 60, name: "Der Merkzettel", frage: "Was stimmt an dem zweiten Satz nicht?",
     optionen: ["Er stimmt – Geräte in Reihe sparen Strom.", "Die Netzspannung beträgt in Wirklichkeit nur 23 V.", "Die Geräte sind zwar in Reihe geschaltet, aber jedes bekommt trotzdem 230 V.", "Im Haushalt sind die Geräte parallel geschaltet: Jedes bekommt die vollen 230 V und lässt sich einzeln schalten."], richtig: 3,
     warum: ["Ums Sparen geht es nicht: In Reihe würden sich die 230 V auf alle Geräte aufteilen, keines bekäme seine volle Spannung – und schaltest du eines aus, gehen alle anderen mit aus.",
             "Die erste Zeile stimmt – an der Steckdose liegen 230 V. Falsch ist der zweite Satz über die Art der Schaltung.",
             "Beides zugleich geht nicht: In einer Reihenschaltung teilt sich die Spannung auf, kein Gerät bekäme die vollen 230 V.",
             null],
     erklaerung: "In einer Reihenschaltung würde sich die Spannung auf die Geräte aufteilen, und ein ausgeschaltetes Gerät würde den Stromkreis für alle unterbrechen. Deshalb sind die Geräte im Haushalt **parallel** geschaltet: An jedem liegen **230 V**, ihre Ströme addieren sich."}
  ],
  // richtig dargestellte Details (keine Überlappung mit den Fehlerkreisen)
  ablenker: [
    {x: 347, y: 322, r: 48, text: "Die Steckdose im Bad hat einen **Klappdeckel** gegen Spritzwasser und sitzt mit Abstand zur Badewanne – so ist sie richtig angebracht."},
    {x: 528, y: 112, r: 42, text: "Der **FI-Schutzschalter** (30 mA) gehört in den Sicherungskasten: Er schaltet ab, sobald ein Teil des Stroms auf einem falschen Weg abfließt, etwa durch einen Menschen."},
    {x: 468, y: 226, r: 44, text: "Diese **Leitungsschutzschalter** sind in Ordnung: Jeder sichert einen eigenen Stromkreis und schaltet ihn bei Kurzschluss oder Überlastung ab."},
    {x: 160, y: 78, r: 50, text: "Eine fest an der Wand montierte Leuchte hoch über dem Spiegel ist im Bad erlaubt – sie kann nicht ins Wasser fallen."},
    {x: 548, y: 420, r: 40, text: "Die erste Zeile des Merkzettels stimmt: An jeder Steckdose im Haushalt liegt eine Spannung von **230 V**."}
  ],
  abschluss: "Elektrogeräte weg vom Wasser, beschädigte Kabel ersetzen, Sicherungen nie überbrücken, keine Steckdosenleisten-Ketten, vor dem Hantieren den Stecker ziehen – und denk daran: Im Haushalt sind alle Geräte **parallel** geschaltet."
};

R3D.lern.raum("strom2", {
  raetsel, suchbild,
  // Rechenwerkstatt: Tafel im Raum (freie Bodenstelle vorne rechts, gegenüber der Suchbild-Staffelei) + Knopf an Station 3
  uebung: {ort: {x: 3.6, z: -9.5, ry: 0}, formel: "R_{ges} = R_{1} + R_{2}"},
  rechenweg: [
    // 1 Beispiel (Kap. 1.4): Widerstand an einem Punkt der Kennlinie einer Glühlampe, mA → A; Vergleich mit einem zweiten Punkt (nicht ohmsch)
    {titel: "Zwei Punkte auf der Kennlinie", text: "Aus der Kennlinie einer Glühlampe liest du zwei Punkte ab: Bei 1,0 V fließen 125 mA, bei 12 V fließen 500 mA. Bei 1,0 V hat die Lampe also den Widerstand 1,0 V : 0,125 A = 8 Ω. Wie groß ist ihr Widerstand bei 12 V?",
     gegeben: [{g: "U", wert: 12, einheit: "V", name: "Spannung"}, {g: "I", wert: 500, einheit: "mA", name: "Stromstärke", si: {wert: 0.5, einheit: "A"}}],
     gesucht: {g: "R", einheit: "Ω", name: "Widerstand"},
     formel: "R = U : I", formelAblenker: [{f: "R = U · I", warum: "Mit U · I würde der Widerstand umso größer, je mehr Strom fließt. Es ist umgekehrt: Lässt die Lampe bei gleicher Spannung mehr Strom durch, ist ihr Widerstand kleiner."},
                                          {f: "R = I : U", warum: "I : U ist der Kehrwert – die Stromstärke pro Volt. Der Widerstand ist Spannung pro Stromstärke: An jedem Punkt der Kennlinie teilst du U durch I."}],
     umgestellt: "R = U : I", einsetzen: "R = 12 V : 0,5 A", ergebnis: {wert: 24, einheit: "Ω"},
     tipps: ["Nimm den Punkt der Kennlinie bei 12 V und rechne 500 mA in A um (1 A = 1000 mA). Dann gilt R = U : I.", "R = 12 V : 0,5 A", "12 : 0,5 = 120 : 5 = … – die Einheit ist 1 V/A = 1 Ω."],
     loesung: "I = 500 mA = 0,5 A;  R = U : I = 12 V : 0,5 A = 24 Ω",
     antwort: "Bei 12 V hat die Glühlampe einen Widerstand von 24 Ω.", antwortAnfang: "Bei 12 V hat die Glühlampe …", einheitAuch: ["kΩ"],
     plausibel: {frage: "Bei 1,0 V hatte die Lampe nur 8 Ω. Passt dein Ergebnis dazu?",
       optionen: ["Nein – der Widerstand eines Bauteils ist bei jeder Spannung gleich, einer der beiden Werte muss falsch sein.", "Ja – bei 12 V ist der Glühdraht viel heißer, und mit der Temperatur steigt sein Widerstand.",
                  "Nein – bei größerer Spannung fließt mehr Strom, also muss der Widerstand kleiner werden.", "Ja – der Widerstand wächst immer im gleichen Verhältnis wie die Spannung."], richtig: 1,
       warum: ["Gleich bleibt der Widerstand nur bei einem **ohmschen** Widerstand, etwa einem Konstantandraht bei gleicher Temperatur. Der Glühdraht einer Lampe erwärmt sich stark – sein Widerstand ändert sich.", null,
               "Mehr Strom allein sagt noch nichts, entscheidend ist U : I. Die Spannung ist 12-mal so groß, die Stromstärke aber nur 4-mal – also ist der Widerstand gewachsen.",
               "Die Spannung ist 12-mal so groß, der Widerstand aber nur 3-mal (24 Ω statt 8 Ω). Er steigt, weil der Draht heißer wird – nicht im gleichen Verhältnis wie U."],
       erklaerung: "Die Stromstärke wächst langsamer als die Spannung – die Kennlinie wird flacher. Der Glühdraht wird dabei heiß, sein Widerstand steigt von 8 Ω auf 24 Ω. Deshalb ist die Glühlampe **kein ohmscher Widerstand**."}},
    // 2 Haushalt (Kap. 1.6): parallele Geräte, Ströme addieren sich; nach I_{4} umstellen (drei Subtraktionen), mA → A
    {titel: "Noch ein Gerät in der Küche?", text: "In einer Küche hängen die Steckdosen an einem Stromkreis mit 230 V, der mit 16 A abgesichert ist: Insgesamt dürfen höchstens 16 A fließen. Gerade laufen der Kühlschrank (800 mA), die Mikrowelle (5,2 A) und die Kaffeemaschine (4,5 A). Wie groß darf die Stromstärke eines weiteren Geräts höchstens sein?",
     gegeben: [{g: "I_{ges}", wert: 16, einheit: "A", name: "höchstens erlaubte Gesamtstromstärke"}, {g: "I_{1}", wert: 800, einheit: "mA", name: "Stromstärke des Kühlschranks", si: {wert: 0.8, einheit: "A"}},
               {g: "I_{2}", wert: 5.2, einheit: "A", name: "Stromstärke der Mikrowelle"}, {g: "I_{3}", wert: 4.5, einheit: "A", name: "Stromstärke der Kaffeemaschine"}],
     gesucht: {g: "I_{4}", einheit: "A", name: "Stromstärke des weiteren Geräts"},
     symbole: [{g: "U", name: "Netzspannung"}],
     formel: "I_{ges} = I_{1} + I_{2} + I_{3} + I_{4}",
     formelAblenker: [{f: "I_{ges} = I_{1} = I_{2} = I_{3} = I_{4}", warum: "Überall dieselbe Stromstärke gibt es nur in der **Reihenschaltung**. Die Küchengeräte sind parallel geschaltet: Jedes hat seinen eigenen Strom, und in der gemeinsamen Zuleitung addieren sich alle."},
                      {f: "U_{ges} = U_{1} + U_{2} + U_{3} + U_{4}", warum: "So teilt sich die Spannung in einer Reihenschaltung auf. Parallel liegen an jedem Gerät die vollen 230 V – zusammengezählt werden hier die Ströme."}],
     umgestellt: "I_{4} = I_{ges} − I_{1} − I_{2} − I_{3}",
     umstellAblenker: [{f: "I_{4} = I_{ges} + I_{1} + I_{2} + I_{3}", warum: "Die drei Ströme stehen mit Plus neben I_{4}. Auf der anderen Seite ziehst du sie ab – sonst käme mehr heraus, als die Sicherung insgesamt erlaubt."},
                       {f: "I_{4} = I_{ges} − I_{1} + I_{2} + I_{3}", warum: "Du hast nur I_{1} abgezogen. Jeder der drei Ströme muss von I_{ges} abgezogen werden: I_{4} = I_{ges} − I_{1} − I_{2} − I_{3}."}],
     umstellWeg: "I_{ges} = I_{1} + I_{2} + I_{3} + I_{4}  | − I_{1} − I_{2} − I_{3}  →  I_{ges} − I_{1} − I_{2} − I_{3} = I_{4}  →  I_{4} = I_{ges} − I_{1} − I_{2} − I_{3}",
     einsetzen: "I_{4} = 16 A − 0,8 A − 5,2 A − 4,5 A", ergebnis: {wert: 5.5, einheit: "A"},
     tipps: ["Die Geräte sind parallel geschaltet, ihre Ströme addieren sich: I_{ges} = I_{1} + I_{2} + I_{3} + I_{4}. Rechne 800 mA in A um (1 A = 1000 mA) und stelle nach I_{4} um.", "I_{4} = 16 A − 0,8 A − 5,2 A − 4,5 A",
             "Die drei laufenden Geräte brauchen zusammen 0,8 A + 5,2 A + 4,5 A = 10,5 A. Es bleiben 16 A − 10,5 A = … A."],
     loesung: "I_{1} = 800 mA = 0,8 A;  I_{4} = I_{ges} − I_{1} − I_{2} − I_{3} = 16 A − 0,8 A − 5,2 A − 4,5 A = 5,5 A",
     antwort: "Ein weiteres Gerät darf höchstens eine Stromstärke von 5,5 A haben.", antwortAnfang: "Ein weiteres Gerät darf …", einheitAuch: ["mA", "Ampere"]},
    // 3 Spannungsteilung (Kap. 1.5): U_{1} : U_{2} = R_{1} : R_{2} nach U_{2} umstellen, kΩ → Ω
    {titel: "Die Teilspannung am kleineren Widerstand", text: "Die Widerstände R_{1} = 2,4 kΩ und R_{2} = 800 Ω sind in Reihe an eine Spannungsquelle angeschlossen. Am Widerstand R_{1} zeigt das Voltmeter 9,0 V. Welche Teilspannung liegt an R_{2}?",
     gegeben: [{g: "R_{1}", wert: 2.4, einheit: "kΩ", name: "erster Widerstand", si: {wert: 2400, einheit: "Ω"}}, {g: "R_{2}", wert: 800, einheit: "Ω", name: "zweiter Widerstand"},
               {g: "U_{1}", wert: 9, einheit: "V", name: "Teilspannung am ersten Widerstand"}],
     gesucht: {g: "U_{2}", einheit: "V", name: "Teilspannung am zweiten Widerstand"},
     symbole: [{g: "U_{ges}", name: "Gesamtspannung"}, {g: "I", name: "Stromstärke"}],
     formel: "U_{1} : U_{2} = R_{1} : R_{2}",
     formelAblenker: [{f: "U_{1} : U_{2} = R_{2} : R_{1}", warum: "Hier sind die Widerstände vertauscht. Durch beide fließt derselbe Strom – am **größeren** Widerstand liegt deshalb die **größere** Teilspannung, nicht die kleinere."},
                      {f: "U_{1} = U_{2}", warum: "Gleiche Spannung an jedem Bauteil gilt in der **Parallelschaltung**. In der Reihenschaltung teilt sich die Spannung auf – im Verhältnis der Widerstände."}],
     umgestellt: "U_{2} = U_{1} · R_{2} : R_{1}",
     umstellAblenker: [{f: "U_{2} = U_{1} · R_{1} : R_{2}", warum: "R_{1} und R_{2} sind vertauscht. Probe: R_{2} ist kleiner als R_{1}, also muss U_{2} kleiner als U_{1} sein – so käme aber eine größere Spannung heraus."},
                       {f: "U_{2} = R_{1} · R_{2} : U_{1}", warum: "Dann stünde U_{1} im Nenner: Je größer die Spannung an R_{1}, desto kleiner wäre die an R_{2}. Es ist umgekehrt – beide Teilspannungen wachsen gemeinsam."}],
     umstellWeg: "U_{1} : U_{2} = R_{1} : R_{2}  | · U_{2}  →  U_{1} = R_{1} · U_{2} : R_{2}  | · R_{2}  →  U_{1} · R_{2} = R_{1} · U_{2}  | : R_{1}  →  U_{2} = U_{1} · R_{2} : R_{1}",
     einsetzen: "U_{2} = 9,0 V · 800 Ω : 2400 Ω", ergebnis: {wert: 3, einheit: "V"},
     tipps: ["In der Reihenschaltung teilt sich die Spannung im Verhältnis der Widerstände auf: U_{1} : U_{2} = R_{1} : R_{2}. Rechne 2,4 kΩ in Ω um (1 kΩ = 1000 Ω) und stelle nach U_{2} um.",
             "U_{2} = 9,0 V · 800 Ω : 2400 Ω", "800 Ω : 2400 Ω = 1 : 3, also U_{2} = 9,0 V : 3 = … V"],
     loesung: "R_{1} = 2,4 kΩ = 2400 Ω;  U_{2} = U_{1} · R_{2} : R_{1} = 9,0 V · 800 Ω : 2400 Ω = 3,0 V",
     antwort: "Am zweiten Widerstand liegt eine Teilspannung von 3,0 V an.", antwortAnfang: "Am zweiten Widerstand …", einheitAuch: ["mV", "Volt"]},
    // Reihenschaltung: erst R_{ges} = R_{1} + R_{2}, dann I = U : R_{ges} (zwei Schritte in einer Formel)
    {titel: "Zwei Widerstände in Reihe", text: "Die Widerstände R_{1} = 50 Ω und R_{2} = 100 Ω sind in Reihe an eine Spannungsquelle mit 6,0 V angeschlossen. Wie groß ist die Stromstärke im Stromkreis?",
     gegeben: [{g: "U", wert: 6, einheit: "V", name: "Spannung der Quelle"}, {g: "R_{1}", wert: 50, einheit: "Ω", name: "erster Widerstand"}, {g: "R_{2}", wert: 100, einheit: "Ω", name: "zweiter Widerstand"}],
     gesucht: {g: "I", einheit: "A", name: "Stromstärke"},
     symbole: [{g: "R_{ges}", name: "Gesamtwiderstand"}],
     formel: "R_{ges} = U : I", formelAblenker: [{f: "R_{1} = U : I", warum: "U liegt an der ganzen Reihenschaltung, und I fließt durch beide Widerstände. Zu U und I gehört deshalb der Gesamtwiderstand R_{ges}, nicht R_{1} allein."},
                                                {f: "R_{ges} = U · I", warum: "Auch für die ganze Schaltung gilt: Widerstand ist Spannung **geteilt** durch Stromstärke."}],
     umgestellt: "I = U : (R_{1} + R_{2})",
     umstellAblenker: [{f: "I = U : R_{1} + U : R_{2}", warum: "So addiert man die Ströme zweier **paralleler** Zweige. In der Reihenschaltung gibt es nur einen Stromweg: erst die Widerstände zu R_{ges} addieren, dann U durch R_{ges} teilen."},
                       {f: "I = U : R_{1} + R_{2}", warum: "Hier fehlt die Klammer: So teilst du nur durch R_{1} und zählst danach Ohm zu Ampere dazu. Teile U durch die ganze Summe: I = U : (R_{1} + R_{2})."}],
     umstellWeg: "R_{ges} = U : I  | · I  →  R_{ges} · I = U  | : R_{ges}  →  I = U : R_{ges};  in Reihe gilt R_{ges} = R_{1} + R_{2}  →  I = U : (R_{1} + R_{2})",
     einsetzen: "I = 6,0 V : (50 Ω + 100 Ω)", ergebnis: {wert: 0.04, einheit: "A"}, einheitAuch: ["mA", "Ampere"],
     tipps: ["In Reihe addieren sich die Widerstände: R_{ges} = R_{1} + R_{2}. Dann gilt I = U : R_{ges}.", "I = 6,0 V : (50 Ω + 100 Ω) = 6,0 V : 150 Ω", "6 : 150 = 1 : 25 = …"],
     loesung: "R_{ges} = 50 Ω + 100 Ω = 150 Ω;  I = U : R_{ges} = 6,0 V : 150 Ω = 0,04 A",
     antwort: "Im Stromkreis fließt ein Strom von 0,04 A.", antwortAnfang: "Im Stromkreis …",
     plausibel: {frage: "Ist 0,04 A plausibel? Zum Vergleich: Mit R_{1} allein flössen 6,0 V : 50 Ω = 0,12 A.",
       optionen: ["Ja – in Reihe ist R_{ges} größer als R_{1}, also muss die Stromstärke kleiner als 0,12 A sein.", "Nein – mit dem zweiten Widerstand kommt Strom dazu, es müssten mehr als 0,12 A sein.",
                  "Nein – durch R_{2} fließt ein anderer Strom als durch R_{1}, das muss man getrennt rechnen.", "Ja – R_{1} verbraucht einen Teil des Stroms, deshalb kommt bei R_{2} weniger an."], richtig: 0,
       warum: [null, "Mehr Strom gibt es nur, wenn ein zusätzlicher **Weg** dazukommt (parallel). In Reihe muss der Strom durch beide Widerstände – das bremst ihn stärker.",
               "In der Reihenschaltung gibt es nur einen Stromweg: Durch R_{1} und R_{2} fließt dieselbe Stromstärke.",
               "Das Ergebnis passt, die Begründung nicht: Strom wird nicht verbraucht. Die Stromstärke ist kleiner, weil der Gesamtwiderstand größer ist – und sie ist überall gleich."],
       erklaerung: "R_{ges} = 150 Ω ist dreimal so groß wie R_{1}. Deshalb fließt nur ein Drittel von 0,12 A, also 0,04 A – an jeder Stelle des Stromkreises."}}
  ],
  umstellen: [
    // Reihenschaltung: Teilspannungen addieren sich – nach einer Teilspannung umstellen
    {formel: "U_{ges} = U_{1} + U_{2}", loesung: "U_{1} = U_{ges} − U_{2}",
     text: "Reihenschaltung: Die Teilspannungen ergeben zusammen die Gesamtspannung. Du kennst die Spannung der Quelle und misst die Spannung an einem der beiden Bauteile. Wie groß ist die Spannung am anderen?",
     typisch: [{f: "U_{1} = U_{ges} + U_{2}", warum: "U_{2} steht mit Plus neben U_{1}. Auf der anderen Seite ziehst du es ab – eine Teilspannung kann nicht größer sein als die Gesamtspannung."},
               {f: "U_{1} = U_{2} − U_{ges}", warum: "Beim Abziehen zählt die Reihenfolge: So käme eine negative Spannung heraus, denn U_{ges} ist größer als U_{2}. Richtig ist U_{ges} minus U_{2}."}],
     weg: "U_{ges} = U_{1} + U_{2}  | − U_{2}  →  U_{ges} − U_{2} = U_{1}  →  U_{1} = U_{ges} − U_{2}",
     tipps: ["Welche Größe steht mit Plus neben U_{1}? Ziehe sie auf beiden Seiten ab.", "Probe: Bei U_{ges} = 9,0 V und U_{2} = 6,5 V muss U_{1} = 2,5 V herauskommen."]},
    // Spannungsteilung: Verhältnisgleichung nach R_{2} umstellen (zweimal malnehmen, einmal teilen)
    {formel: "U_{1} : U_{2} = R_{1} : R_{2}", loesung: "R_{2} = R_{1} · U_{2} : U_{1}",
     text: "Spannungsteilung in der Reihenschaltung: Die Teilspannungen stehen im gleichen Verhältnis wie die Widerstände. Welchen Widerstand R_{2} musst du zu R_{1} in Reihe schalten, damit an ihm eine bestimmte Teilspannung U_{2} liegt?",
     typisch: [{f: "R_{2} = R_{1} · U_{1} : U_{2}", warum: "U_{1} und U_{2} sind vertauscht. Probe: Soll an R_{2} die kleinere Teilspannung liegen, muss R_{2} auch der kleinere Widerstand sein – mit dieser Formel käme ein größerer heraus."},
               {f: "R_{2} = U_{2} : U_{1}", warum: "U_{2} : U_{1} ist nur ein Verhältnis ohne Einheit. Einen Widerstand in Ω bekommst du erst, wenn du es noch mit R_{1} malnimmst."}],
     weg: "U_{1} : U_{2} = R_{1} : R_{2}  | · R_{2}  →  U_{1} · R_{2} : U_{2} = R_{1}  | · U_{2}  →  U_{1} · R_{2} = R_{1} · U_{2}  | : U_{1}  →  R_{2} = R_{1} · U_{2} : U_{1}",
     tipps: ["R_{2} steht im Nenner. Multipliziere beide Seiten zuerst mit R_{2}, dann mit U_{2}.", "Jetzt steht U_{1} · R_{2} = R_{1} · U_{2} da – teile noch durch U_{1}. Probe: R_{1} = 120 Ω, U_{1} = 3,0 V und U_{2} = 4,5 V müssen R_{2} = 180 Ω ergeben."]},
    {formel: "R_{ges} = R_{1} + R_{2}", loesung: "R_{2} = R_{ges} − R_{1}",
     typisch: [{f: "R_{2} = R_{ges} + R_{1}", warum: "R_{1} steht mit Plus auf der rechten Seite – auf die andere Seite kommt es mit Minus."},
               {f: "R_{2} = R_{1} − R_{ges}", warum: "Das Vorzeichen ist vertauscht: R_{ges} ist größer als R_{1}, so käme ein negativer Widerstand heraus. Ziehe R_{1} von R_{ges} ab."},
               {f: "R_{2} = R_{ges} : R_{1}", warum: "R_{1} wird addiert, nicht malgenommen. Das Gegenteil von Plus ist Minus, nicht Geteilt."}],
     text: "Reihenschaltung: Der Gesamtwiderstand ist die Summe der Einzelwiderstände. Typische Frage: Welchen Widerstand R_{2} muss man zu R_{1} in Reihe schalten, damit R_{ges} herauskommt?",
     weg: "R_{ges} = R_{1} + R_{2}  | − R_{1}  →  R_{2} = R_{ges} − R_{1}", tipps: ["Was steht neben R_{2}? Ziehe es auf beiden Seiten ab.", "Probe: Bei R_{ges} = 90 Ω und R_{1} = 35 Ω muss R_{2} = 55 Ω herauskommen."]}
  ],
  fehlersuche: [
    // Reihenschaltung: Teilspannung mit R_{ges} statt mit R_{2} gerechnet (falsche Größe eingesetzt)
    {titel: "Die Teilspannung", aufgabe: "Die Widerstände R_{1} = 30 Ω und R_{2} = 50 Ω sind in Reihe an eine Spannung von 12 V angeschlossen. Berechne die Teilspannung U_{2} am Widerstand R_{2}.",
     zeilen: ["Gegeben: R_{1} = 30 Ω; R_{2} = 50 Ω (in Reihe); U_{ges} = 12 V", "Gesucht: U_{2}", "R_{ges} = R_{1} + R_{2} = 30 Ω + 50 Ω = 80 Ω", "I = U_{ges} : R_{ges} = 12 V : 80 Ω = 0,15 A", "U_{2} = R_{ges} · I = 80 Ω · 0,15 A", "U_{2} = 12 V"], falsch: 4,
     zeilenOk: ["Die Angaben stimmen: zwei Widerstände in Reihe an 12 V.", "Gesucht ist die Teilspannung an R_{2} – richtig.", "In der Reihenschaltung addieren sich die Widerstände – richtig gerechnet.",
                "Richtig: Die Stromstärke ist in der Reihenschaltung überall gleich, durch R_{1} und R_{2} fließen 0,15 A."],
     optionen: ["Durch R_{2} fließt ein anderer Strom als durch R_{1}. Man hätte I_{2} = U_{ges} : R_{2} rechnen müssen.", "In der Reihenschaltung hätte man die Kehrwerte addieren müssen: 1 : R_{ges} = 1 : R_{1} + 1 : R_{2}.",
                "Die Stromstärke hätte man zuerst in mA umrechnen müssen: 0,15 A = 150 mA.", "Für die Teilspannung an R_{2} gehört R_{2} in die Formel, nicht R_{ges}: U_{2} = R_{2} · I."], richtig: 3,
     warum: ["In der Reihenschaltung fließt durch R_{1} und R_{2} dieselbe Stromstärke – die 0,15 A aus Zeile 4 stimmen. U_{ges} : R_{2} wäre der Strom, wenn R_{2} allein an den 12 V hinge.",
             "Die Kehrwerte addiert man bei der **Parallelschaltung**. Hier sind die Widerstände in Reihe geschaltet, R_{ges} = 30 Ω + 50 Ω = 80 Ω in Zeile 3 ist richtig.",
             "Umrechnen ist nicht nötig: Mit Ω und A erhältst du die Spannung direkt in V. Der Fehler steckt im Widerstand, der in Zeile 5 eingesetzt wurde.",
             null],
     korrektur: {frage: "Wie groß ist die Teilspannung U_{2} richtig?", wert: 7.5, einheit: "V", toleranz: .05,
       tipps: ["Die Stromstärke aus Zeile 4 stimmt: Auch durch R_{2} fließen 0,15 A. Setze jetzt R_{2} statt R_{ges} ein.", "U_{2} = R_{2} · I = 50 Ω · 0,15 A = … V"],
       loesung: "U_{2} = R_{2} · I = 50 Ω · 0,15 A = 7,5 V. Probe: U_{1} = R_{1} · I = 30 Ω · 0,15 A = 4,5 V, und 4,5 V + 7,5 V = 12 V."},
     erklaerung: "R_{ges} · I ergibt immer die **Gesamtspannung** – hier wieder die 12 V der Quelle. Das hätte stutzig machen müssen: Eine Teilspannung ist in der Reihenschaltung kleiner als die Gesamtspannung. Für U_{2} gehört der Widerstand R_{2} in die Formel."},
    // Parallelschaltung: Kehrwert vergessen
    {titel: "Zwei Widerstände parallel", aufgabe: "Die Widerstände R_{1} = 50 Ω und R_{2} = 200 Ω sind parallel geschaltet. Berechne den Gesamtwiderstand.",
     zeilen: ["Gegeben: R_{1} = 50 Ω; R_{2} = 200 Ω (parallel)", "Gesucht: R_{ges}", "1 : R_{ges} = 1 : R_{1} + 1 : R_{2}", "1 : R_{ges} = 1 : (50 Ω) + 1 : (200 Ω) = 4 : (200 Ω) + 1 : (200 Ω) = 5 : (200 Ω)", "R_{ges} = 5 : (200 Ω) = 0,025 Ω"], falsch: 4,
     zeilenOk: ["Die Angaben stimmen: zwei Widerstände, parallel geschaltet.", "Gesucht ist der Gesamtwiderstand – richtig.", "Das ist die richtige Formel für die Parallelschaltung.", "Richtig gerechnet: Mit dem gemeinsamen Nenner 200 Ω ergibt sich 5 : (200 Ω)."],
     optionen: ["Die Widerstände hätten einfach addiert werden müssen: R_{ges} = 50 Ω + 200 Ω = 250 Ω.", "Die Brüche wurden falsch addiert: 1 : 50 + 1 : 200 ergibt 1 : 250.",
                "5 : (200 Ω) ist erst der Kehrwert 1 : R_{ges}. Es fehlt der letzte Schritt: R_{ges} = 200 Ω : 5.", "Die Einheit ist falsch: Ein Gesamtwiderstand wird in A angegeben."], richtig: 2,
     warum: ["Addieren gilt für die **Reihenschaltung**. Parallel ist der Gesamtwiderstand kleiner als jeder Einzelwiderstand – 250 Ω wäre viel zu groß.",
             "Die Bruchrechnung in Zeile 4 stimmt: 1 : 50 = 4 : 200, dazu 1 : 200 ergibt 5 : 200. Nenner darf man nicht einfach addieren.",
             null,
             "Ein Widerstand hat immer die Einheit Ω, auch der Gesamtwiderstand. Schau dir lieber an, was in Zeile 4 eigentlich ausgerechnet wurde: R_{ges} oder 1 : R_{ges}?"],
     korrektur: {frage: "Wie groß ist der Gesamtwiderstand richtig?", wert: 40, einheit: "Ω", toleranz: .2,
       tipps: ["In Zeile 4 steht 1 : R_{ges} = 5 : (200 Ω). Bilde auf beiden Seiten den Kehrwert.", "R_{ges} = 200 Ω : 5 = …"],
       loesung: "1 : R_{ges} = 5 : (200 Ω), also R_{ges} = 200 Ω : 5 = 40 Ω. Probe: 40 Ω ist kleiner als 50 Ω – das passt zur Parallelschaltung."},
     erklaerung: "Bei der Parallelschaltung ergibt die Summe der Kehrwerte erst 1 : R_{ges} – zum Schluss den **Kehrwert** bilden! Probe: R_{ges} muss kleiner sein als der kleinste Einzelwiderstand, aber 0,025 Ω wäre fast ein Kurzschluss."},
    // Reihenschaltung: kΩ nicht umgerechnet
    {titel: "Widerstände in Reihe", aufgabe: "Die Widerstände R_{1} = 1,2 kΩ und R_{2} = 300 Ω sind in Reihe an eine Spannung von 9 V angeschlossen. Berechne die Stromstärke im Stromkreis.",
     zeilen: ["Gegeben: R_{1} = 1,2 kΩ; R_{2} = 300 Ω; U = 9 V", "Gesucht: I", "R_{ges} = R_{1} + R_{2}", "R_{ges} = 1,2 kΩ + 300 Ω = 301,2 Ω", "I = U : R_{ges} = 9 V : 301,2 Ω ≈ 0,03 A"], falsch: 3,
     zeilenOk: ["Die Angaben stimmen.", "Gesucht ist die Stromstärke – richtig.", "In der Reihenschaltung addieren sich die Widerstände – richtig."],
     optionen: ["Bei der Reihenschaltung muss man die Kehrwerte addieren: 1 : R_{ges} = 1 : R_{1} + 1 : R_{2}.", "Die Einheiten passen nicht zusammen: 1,2 kΩ sind 1200 Ω. Erst umrechnen, dann addieren.",
                "Widerstände darf man nicht addieren, nur Spannungen und Stromstärken.", "Man hätte zuerst I = U : R_{1} ausrechnen müssen."], richtig: 1,
     warum: ["Die Kehrwerte addiert man bei der **Parallelschaltung**. In Reihe ist R_{ges} = R_{1} + R_{2} richtig – Zeile 3 stimmt.",
             null,
             "Doch: In der Reihenschaltung ist der Gesamtwiderstand die Summe der Einzelwiderstände. Schau dir lieber die Einheiten der beiden Summanden an.",
             "Die 9 V liegen an der ganzen Reihenschaltung, nicht an R_{1} allein. Der Weg über R_{ges} ist richtig – der Fehler steckt in den Zahlen der Summe."],
     korrektur: {frage: "Wie groß ist die Stromstärke richtig? Gib sie in mA an.", wert: 6, einheit: "mA", toleranz: .1,
       tipps: ["Rechne um: 1,2 kΩ = 1200 Ω. Dann ist R_{ges} = 1200 Ω + 300 Ω.", "I = 9 V : 1500 Ω = … A – und 1 A = 1000 mA."],
       loesung: "R_{ges} = 1200 Ω + 300 Ω = 1500 Ω;  I = U : R_{ges} = 9 V : 1500 Ω = 0,006 A = 6 mA"},
     erklaerung: "Vor dem Addieren alle Werte in dieselbe Einheit bringen: 1 kΩ = 1000 Ω. Die Probe hätte den Fehler verraten: In Reihe muss R_{ges} größer sein als jeder Einzelwiderstand – 301,2 Ω ist aber kleiner als 1,2 kΩ."}
  ],
  // Rückmeldung je falscher Antwort (Reihenfolge wie options in inhalt/strom2.json, null an der richtigen Antwort)
  warum: {
    0: [null, "Eine Kennlinie hat keine Zeitachse: Zu jeder eingestellten Spannung trägt man die gemessene Stromstärke ein. Die Temperatur steht auf keiner Achse.",
        "Die Zuleitung kommt in der Kennlinie nicht vor: Gemessen werden die Spannung am Bauteil und die Stromstärke durch das Bauteil.",
        "Wie viel Ladung ein Bauteil speichert, zeigt keine Kennlinie. Sie verbindet zu jeder Spannung die Stromstärke, die dabei fließt."],
    1: [null, "Beim ohmschen Gesetz bleibt R gerade gleich: Verdoppelt sich U, verdoppelt sich auch I, und R = U : I ändert sich nicht.",
        "Bei gleicher Spannung bewirkt ein größerer Widerstand einen kleineren Strom, nicht einen größeren. Außerdem verbindet das ohmsche Gesetz I mit U.",
        "Das ohmsche Gesetz setzt gerade eine gleichbleibende Temperatur voraus. Und es sagt, wie I mit U wächst – nicht, dass I gleich bleibt."],
    2: [null, "Bei der Glühlampe ist es umgekehrt: Ihr Glühdraht wird sehr heiß, und sein Widerstand steigt dabei stark an.",
        "Eisen ist ein reines Metall: Sein Widerstand steigt beim Erwärmen deutlich. Fast gleich bleibt er nur bei besonderen Legierungen.",
        "Auch Kupfer ist ein reines Metall, dessen Widerstand mit der Temperatur zunimmt – ob der Draht dünn oder dick ist, ändert daran nichts."],
    4: [null, "Würde der Widerstand sinken, flösse bei höherer Spannung immer mehr Strom – die Kennlinie würde steiler, nicht flacher.",
        "Die Quelle erzeugt keine Elektronen, sie treibt die Elektronen an, die schon im Leiter sind. Dass I langsamer wächst, liegt am Glühdraht selbst.",
        "Das ist kein Messfehler: Mit einem Konstantandraht liefert dasselbe Amperemeter eine gerade Kennlinie. Die Glühlampe ändert wirklich ihren Widerstand."],
    5: [null, "Steiler heißt: Bei gleicher Spannung fließt mehr Strom. Mehr Strom bei gleicher Spannung bedeutet einen kleineren Widerstand, keinen größeren.",
        "Die Beobachtung stimmt, der Schluss nicht: Wo bei gleicher Spannung mehr Strom fließt, ist R = U : I kleiner.",
        "Ursprungsgerade heißt nur, dass jeder Widerstand für sich konstant bleibt. Verschieden steile Geraden gehören zu verschieden großen Widerständen."],
    6: [null, "Zunehmen ist zu wenig: Proportional heißt, dass sich I im gleichen Verhältnis ändert wie U – doppelte Spannung, doppelte Stromstärke.",
        "Bei einer Messreihe veränderst du die Spannung ja gerade. Mit immer derselben Spannung könntest du gar nicht sehen, wie I von U abhängt.",
        "Eine Summe von Stromstärken kann man nicht mit einer Spannung vergleichen – das sind verschiedene Größen. Prüfen musst du jedes Wertepaar einzeln."],
    7: [null, "Die Spannung hat sich verdreifacht, aber die Stromstärke ist auch gestiegen. Für R musst du beide verrechnen: R = U : I für jedes Wertepaar.",
        "Halb so groß kommt heraus, wenn man I : U rechnet (0,10 und 0,05). Der Widerstand ist aber R = U : I – und der wird größer.",
        "Gleich bliebe R nur bei einem ohmschen Widerstand. Hier wird die Spannung verdreifacht, die Stromstärke aber nur auf das 1,5-Fache vergrößert."],
    10: [null, "Strom wird in einem Bauteil nicht verbraucht: So viele Elektronen, wie hineinfließen, kommen auch wieder heraus.",
         "Aufteilen kann sich der Strom nur an einer Verzweigung, also in der Parallelschaltung. In der Reihenschaltung teilt sich die Spannung auf, nicht der Strom.",
         "Der Stromkreis ist wie ein geschlossener Ring: An jeder Stelle fließt in jeder Sekunde gleich viel Ladung vorbei – am Pluspol nicht mehr als anderswo."],
    11: [null, "Die Spannung teilt sich in der Reihenschaltung auf. Parallel ist jeder Zweig direkt mit beiden Polen verbunden – aufgeteilt wird hier der Strom.",
         "Das gilt in der Reihenschaltung. Parallel liegt an jedem Zweig dieselbe Spannung – durch den größeren Widerstand fließt nur weniger Strom.",
         "Mehr Strom fließt im Zweig mit dem kleineren Widerstand, nicht weil dort die Spannung kleiner wäre. Die Spannung ist in allen Zweigen gleich."],
    12: [null, "Größer wird der Gesamtwiderstand, wenn man in Reihe schaltet. Parallel kommt ein zusätzlicher Stromweg dazu – es fließt mehr Strom, R_{ges} wird kleiner.",
         "Der zweite Widerstand ist ein zusätzlicher Weg für den Strom, selbst wenn er sehr groß ist. Insgesamt fließt mehr Strom, also sinkt R_{ges} unter 100 Ω.",
         "200 Ω bekäme man, wenn man zwei 100-Ω-Widerstände in Reihe schaltet. Parallel addieren sich nicht die Widerstände, sondern ihre Kehrwerte."],
    13: [null, "Die Quelle liefert weiterhin dieselbe Spannung, und sie liegt an jedem Zweig voll an. Kleiner wird R_{ges}, weil bei gleicher Spannung mehr Strom fließt.",
         "Strom wird nicht verbraucht. Jeder Zweig lässt zusätzlich Strom durch – deshalb wird der Gesamtstrom größer und R_{ges} kleiner.",
         "Jeder Einzelwiderstand behält seinen Wert. Nur die Schaltung als Ganzes leitet besser, weil der Strom mehrere Wege hat."],
    14: [null, "Am kleineren Widerstand braucht derselbe Strom weniger Antrieb – an ihm liegt also die kleinere Teilspannung, nicht die größere.",
         "Gleich wäre die Spannung nur bei gleich großen Widerständen. Gleiche Stromstärke durch verschiedene Widerstände ergibt verschiedene Teilspannungen.",
         "Die Reihenfolge spielt keine Rolle: Vertauschst du R_{1} und R_{2}, bleiben die Teilspannungen an ihnen gleich. Entscheidend ist nur die Größe des Widerstands."],
    15: [null, "So verhält sich eine Parallelschaltung. In der Reihenschaltung unterbricht der durchgebrannte Glühdraht den einzigen Stromweg.",
         "Ohne geschlossenen Stromkreis fließt durch keine Lampe Strom – egal, wie viel Spannung die Quelle liefert.",
         "Schwächer würden die Lämpchen nur leuchten, wenn noch etwas Strom flösse. Der Stromkreis ist aber an einer Stelle offen – dann fließt gar kein Strom mehr."],
    19: [null, "Gleich ist in der Parallelschaltung die Spannung, nicht die Stromstärke: Ein Wasserkocher braucht viel mehr Strom als eine Lampe.",
         "Parallel wird der Gesamtwiderstand mit jedem eingeschalteten Gerät kleiner, nicht größer. Der Grund ist ein anderer: Jedes Gerät soll die volle Spannung bekommen.",
         "Aufteilen würde sich die Spannung in einer Reihenschaltung – dann bekäme kein Gerät die 230 V, für die es gebaut ist."],
    20: [null, "Das gilt für zwei Schalter parallel (ODER-Schaltung). In Reihe unterbricht schon ein offener Schalter den einzigen Stromweg.",
         "Ist einer der beiden Schalter offen, ist der Stromkreis unterbrochen – egal, wie der andere steht.",
         "Ein offener Schalter unterbricht den Stromkreis. Sind beide offen, ist der Weg sogar an zwei Stellen unterbrochen."],
    22: [null, "Die Quelle liefert weiter dieselbe Spannung. Riesig wird beim Kurzschluss die Stromstärke, weil der Widerstand fast null ist.",
         "Genau umgekehrt: Beim Kurzschluss wird das Gerät umgangen, der Widerstand ist fast null. Würde kein Strom fließen, müsste die Sicherung gar nicht auslösen.",
         "Ein Kurzschluss kehrt die Richtung des Stroms nicht um. Die Sicherung reagiert auf die Stärke des Stroms, nicht auf seine Richtung."],
    23: [null, "Blau ist der Neutralleiter: Über ihn fließt der Strom im normalen Betrieb zurück. Der Schutzleiter führt nur im Fehlerfall Strom.",
         "Braun ist meist der Außenleiter – er steht gegenüber der Erde unter 230 V. Mit dem Schutzleiter darf er nie verwechselt werden.",
         "Schwarz wird ebenfalls für Außenleiter verwendet. Der Schutzleiter hat eine eigene, unverwechselbare Kennzeichnung, damit man ihn nie mit einem Außenleiter verwechselt."],
    24: [null, "Ein Fehler im Gerät ändert die Netzspannung nicht. Der FI merkt, dass Strom auf einem falschen Weg abfließt – zum Beispiel durch einen Menschen.",
         "Das beschreibt eine Schmelzsicherung. Der FI-Schutzschalter schmilzt nicht und reagiert nicht auf eine zu große Stromstärke, sondern schon auf einen Fehlerstrom von etwa 30 mA.",
         "Wie ein Gerät gebaut ist, kann der FI nicht erkennen. Er schaltet ab, sobald ein Teil des Stroms nicht über den Neutralleiter zurückkommt."],
    26: [null, "Die Füße des Vogels berühren das blanke Seil direkt – die Federn helfen dabei nicht. Entscheidend ist, dass zwischen beiden Füßen kaum Spannung liegt.",
         "Doch, durch die Leitung fließt ein starker Strom. Durch den Vogel fließt aber kaum etwas, weil zwischen seinen Füßen fast keine Spannung anliegt.",
         "Ein Widerstand von fast null würde ihn nicht schützen, im Gegenteil. Der Vogel hat einen ganz normalen Körperwiderstand – nur die Spannung zwischen seinen Füßen ist winzig."],
    28: [null, "Die Sicherung sitzt in der gemeinsamen Zuleitung. Dort fließen die Ströme aller Geräte zusammen – entscheidend ist die Summe, nicht der einzelne Strom.",
         "Die Spannung bleibt 230 V, egal wie viele Geräte parallel laufen. Was zunimmt, ist die Gesamtstromstärke in der Zuleitung.",
         "In der Parallelschaltung liegt an jedem Gerät die volle Netzspannung. Der Föhn läuft also nicht langsamer – aber die Zuleitung wird überlastet."],
    29: [null, "Ein Strom von 50 mA durch deinen Körper bringt keine 16-A-Sicherung zum Auslösen. Die Sicherung schützt die Leitungen vor Überhitzung, nicht dich.",
         "Der Neutralleiter ist der normale Rückweg des Stroms. Fließt der Strom durch deinen Körper, nimmt er gerade nicht diesen Weg – und der Neutralleiter schaltet nichts ab.",
         "Eine Steckdosenleiste schließt nur mehrere Geräte parallel an eine Steckdose an. Gegen einen Strom durch deinen Körper hat sie keine Schutzwirkung."]
  },
  spick: {
    kern: ["Kennlinie = I-U-Diagramm eines Bauteils. **Ohmsches Gesetz**: Bei gleichbleibender Temperatur ist I ~ U. **Ohmscher Widerstand** (z. B. Konstantandraht): Ursprungsgerade, R = U : I bleibt gleich",
           "**Glühlampe**: Die Kennlinie wird flacher – ihr Widerstand steigt mit der Temperatur (nicht ohmsch)",
           "**Reihenschaltung**: I überall gleich, U_{ges} = U_{1} + U_{2}, R_{ges} = R_{1} + R_{2}",
           "**Parallelschaltung**: U an jedem Zweig gleich, I_{ges} = I_{1} + I_{2}, 1 : R_{ges} = 1 : R_{1} + 1 : R_{2} – R_{ges} ist kleiner als jeder Einzelwiderstand",
           "Haushalt: 230 V, alle Geräte parallel. Die **Sicherung** (meist 16 A) schaltet bei Kurzschluss und Überlastung ab",
           "**Schutzleiter** (grün-gelb) erdet Metallgehäuse; der **FI-Schutzschalter** schützt Menschen und löst schon bei etwa 30 mA aus"],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn, woran du an der Kennlinie erkennst, ob ein Bauteil ein ohmscher Widerstand ist – und warum eine Glühlampe keiner ist.",
       begriffe: [["Ursprungsgerade", "Ursprung", "eine Gerade", "gerade Linie"], ["proportional", "doppelt", "verdoppelt"], ["R = U : I", "U : I", "U/I", "Quotient"], ["konstant", "bleibt gleich", "gleich bleibt", "gleichbleibend", "immer gleich", "ändert sich nicht"], ["Glühdraht", "Glühfaden", "Wendel"], ["Temperatur", "heiß", "warm", "erwärm"], ["steigt", "größer", "nimmt zu", "zunimmt"], ["flacher", "Kurve", "krumm"]],
       muster: "Bei einem **ohmschen Widerstand** ist die Kennlinie eine **Ursprungsgerade**: Die Stromstärke ist **proportional** zur Spannung, doppelte Spannung ergibt doppelte Stromstärke. Der Quotient **R = U : I** bleibt **konstant**. Bei der **Glühlampe** wird die Kennlinie immer **flacher**: Mit größerer Stromstärke wird der Glühdraht **heißer**, und sein Widerstand **steigt** mit der **Temperatur**. Deshalb ist sie kein ohmscher Widerstand."},
      {frage: "Erkläre, warum die Elektrogeräte im Haushalt parallel geschaltet sind und warum zu viele Geräte an einer Mehrfachsteckdose gefährlich sind.",
       begriffe: [["parallel"], ["Spannung", "230 V", "230"], ["einzeln", "unabhängig", "laufen weiter", "weiterlaufen", "arbeiten weiter", "funktionieren weiter"], ["addieren", "addiert", "Summe", "zusammen"], ["Stromstärke", "Ströme", "Gesamtstrom"], ["16 A", "16"], ["Sicherung", "Leitungsschutzschalter", "Sicherungsautomat"], ["Überlastung", "überlastet", "heiß", "Brand"]],
       muster: "Im Haushalt sind die Geräte **parallel** geschaltet: Jedes bekommt die volle **Spannung von 230 V** und lässt sich **einzeln** ein- und ausschalten, die anderen laufen **weiter**. Die **Ströme** der Geräte **addieren** sich: I_{ges} = I_{1} + I_{2} + … Hängen zu viele Geräte an einer Leitung, wird die Gesamtstromstärke größer als **16 A** – die Leitung wird **heiß** (**Überlastung**, Brandgefahr). Dann schaltet die **Sicherung** ab."}
    ]
  },
  zuordnung: {
    "Kennlinien: ohmsch oder nicht?": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    "Reihenschaltung: ein einziger Stromweg": [10, 14, 15, 16, 18, 20],
    "Parallelschaltung: jeder Zweig für sich": [11, 12, 13, 17],
    "Mehrfachsteckdose und Überlastung": [19, 21, 28],
    "Sicherungskasten und Kurzschluss": [22],
    "Schutzleiter und FI-Schutzschalter": [23, 24, 25, 26, 27, 29]
  },
  hilfen: {
    8: ["Formel: R = U : I", "Einsetzen: R = 6,0 V : 0,30 A", "Ausrechnen: 6,0 : 0,30 = 60 : 3 = … – die Einheit ist 1 V/A = 1 Ω."],
    9: ["Beim ohmschen Widerstand gilt I ~ U: Wird U vervielfacht, wird I genauso vervielfacht.", "Die Spannung steigt von 4,0 V auf 10 V, also auf das 10 : 4 = 2,5-Fache.", "I = 2,5 · 0,20 A = … A"],
    16: ["In der Reihenschaltung addieren sich die Widerstände: R_{ges} = R_{1} + R_{2}.", "Einsetzen: R_{ges} = 15 Ω + 45 Ω", "Zusammenzählen – die Einheit bleibt Ω."],
    17: ["Parallelschaltung: 1 : R_{ges} = 1 : R_{1} + 1 : R_{2}", "Einsetzen: 1 : R_{ges} = 1 : (40 Ω) + 1 : (40 Ω) = 2 : (40 Ω)", "Kürze 2 : 40 zu einem Bruch 1 : … – dann ist R_{ges} = … Ω, also kleiner als jeder Einzelwiderstand."],
    18: ["Erst den Gesamtwiderstand R_{ges} = R_{1} + R_{2} berechnen, dann die Stromstärke I = U : R_{ges}.", "R_{ges} = 30 Ω, I = 6,0 V : 30 Ω = 0,20 A – in der Reihenschaltung ist I überall gleich.", "U_{2} = R_{2} · I = 20 Ω · 0,20 A = … V"],
    21: ["Gefragt ist die Netzspannung an der Steckdose, eine Größe in Volt.", "Sie ist viel größer als die Spannung einer Autobatterie (12 V) – und lebensgefährlich.", "Auf vielen Elektrogeräten steht „220–240 V“. Die Netzspannung liegt genau in der Mitte dieses Bereichs."],
    27: ["Formel: I = U : R", "Einsetzen: I = 230 V : 1000 Ω", "Ausrechnen – das Ergebnis ist kleiner als 1 A. Einheit: 1 V/Ω = 1 A."]
  }
});
})();
