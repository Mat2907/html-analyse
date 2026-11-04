/* ---------- 40_lern_kraft1.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum Kraft 1 (Kap. 4.1–4.3: Kraftpfeil, Gewichtskraft und Masse, mehrere Kräfte)
   Türrätsel „Das Ringschloss“ (Kräfteparallelogramm, Kräftegleichgewicht, F_G = m · g) · Suchbild „Schulfest der Physik-AG“ (mit Begründungen und Ablenkern)
   Lernzettel · Fehler → Exponat · Tipps zu Rechenaufgaben
   Rechenwerkstatt (4 Rechenwege, 3 Umstellungen, 3 Fehlersuchen) · Rückmeldung je falscher Antwort für alle Auswahlfragen
   (Das Labor „Wie hängt die Gewichtskraft von der Masse ab?“ sitzt am Exponat „Der Federkraftmesser“ in 20_kraft1.js.)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;

/* ---------- kleine Zeichenhilfen ---------- */
const TAU = Math.PI * 2, FONT = "system-ui, sans-serif", HAND = "'Chalkboard SE', 'Comic Sans MS', 'Marker Felt', system-ui, sans-serif";
const de = (x, d = 1) => (+x).toFixed(d).replace(".", ",").replace("-", "−");
const dn = x => { const r = Math.round(x * 10) / 10; return Number.isInteger(r) ? String(r) : de(r); };   // 40 statt 40,0
const line = (g, pts, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]); };
// Text mit Tiefstellung („F_{res}“); verkleinert sich, bis er in maxW passt
function st(g, s, x, y, size, col, align = "left", weight = 600, maxW = 0, font = FONT){
  const parts = []; String(s).replace(/_\{([^}]*)\}|[^_]+|_/g, (m, sub) => { parts.push(sub != null ? [sub, 1] : [m, 0]); return m; });
  const width = sz => { let w = 0; for (const [t, b] of parts) { g.font = `${weight} ${b ? Math.round(sz * .66) : sz}px ${font}`; w += g.measureText(t).width; } return w; };
  let w = width(size); while (maxW && w > maxW && size > 12) { size -= 1; w = width(size); }
  let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; g.fillStyle = col; g.textAlign = "left"; g.textBaseline = "middle";
  for (const [t, b] of parts) { g.font = `${weight} ${b ? Math.round(size * .66) : size}px ${font}`; g.fillText(t, cx, y + (b ? size * .28 : 0)); cx += g.measureText(t).width; }
  return w;
}
function arrow(g, x1, y1, x2, y2, w, col, dash){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 2) return; const a = Math.atan2(y2 - y1, x2 - x1), hl = Math.min(L * .45, w * 3.4);
  g.strokeStyle = g.fillStyle = col; g.lineWidth = w; g.lineCap = "round"; g.setLineDash(dash || []);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hl * .7, y2 - Math.sin(a) * hl * .7); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - .45) * hl, y2 - Math.sin(a - .45) * hl); g.lineTo(x2 - Math.cos(a + .45) * hl, y2 - Math.sin(a + .45) * hl); g.closePath(); g.fill();
}
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, TAU); g.fill(); }
const COL = {f1: "#ff9f1c", G: "#ff5a48", f2: "#4d9bff", res: "#45d483", diag: "#c9b6ff"};

/* ---------- Türrätsel: Das Ringschloss ---------- */
// Ring über dem Schlüsselloch: Feder links (F_1 = 30 N waagrecht), Korb unten an einer Schnur (zieht den Ring mit F_Korb = F_G = m · g nach unten),
// Seilwinde rechts oben (F_2 längs des Seils: auf 3 Kästchen nach rechts 4 Kästchen nach oben). Ruhe nur bei Kräftegleichgewicht → F_Korb = 40 N (m = 4 kg) und F_2 = 50 N.
// Am Ring heißt die Kraft des Korbs F_Korb, nicht F_G: Die Gewichtskraft greift im Schwerpunkt des Korbs an (so lehren es Raum und Suchbild).
const RK = 30, R0 = [300, 300], F1 = 30, GR = 10, SU = [.6, .8];          // 1 Kästchen = 30 px ≙ 10 N · Seilrichtung (x nach rechts, y nach oben)
const kraefte = v => { const FG = v.m * GR; return {FG, rx: -F1 + SU[0] * v.F2, ry: SU[1] * v.F2 - FG}; };
const boxOf = (x, y, w, align, h = 13) => { const x0 = align === "right" ? x - w : align === "center" ? x - w / 2 : x; return [x0 - 3, y - h, x0 + w + 3, y + h]; };
const hitBox = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const raetsel = {
  titel: "Das Ringschloss",
  text: "Der Schlüssel rastet nur ein, wenn der **Ring in Ruhe genau über dem Schlüsselloch** hängt. Links zieht eine Feder mit **F_{1} = 30 N** waagrecht. Unten hängt an einer Schnur ein Korb, in den du Wägestücke legst (Masse m; rechne mit dem gerundeten Ortsfaktor **g ≈ 10 N/kg**, der Korb selbst ist sehr leicht). Der ruhig hängende Korb zieht den Ring mit der Kraft **F_{Korb}** nach unten – so groß wie seine Gewichtskraft F_{G} = m · g. Rechts oben zieht eine Seilwinde mit der Kraft **F_{2}** längs des Seils. Stelle Masse und Seilkraft ein.",
  regler: [{id: "m", name: "Masse im Korb m", einheit: "kg", min: .5, max: 6, schritt: .5, wert: 2},
           {id: "F2", name: "Seilkraft F_{2} der Winde", einheit: "N", min: 10, max: 70, schritt: 5, wert: 30}],
  zeichne(g, w, h, v, t, ok){
    g.fillStyle = "#10131a"; g.fillRect(0, 0, w, h);
    const K = kraefte(v), R = Math.hypot(K.rx, K.ry), px = RK / 10;     // px je Newton
    // Raster (1 Kästchen ≙ 10 N), durch das Schlüsselloch ausgerichtet
    g.save(); g.beginPath(); g.rect(14, 52, 556, 476); g.clip(); g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
    for (let x = R0[0] % RK; x < 570; x += RK) { g.beginPath(); g.moveTo(x + .5, 52); g.lineTo(x + .5, 528); g.stroke(); }
    for (let y = R0[1] % RK; y < 528; y += RK) { g.beginPath(); g.moveTo(14, y + .5); g.lineTo(570, y + .5); g.stroke(); }
    g.restore();
    st(g, "Ringschloss · 1 Kästchen ≙ 10 N", 292, 30, 28, "#ffe9a8", "center", 700);
    // Lage des Rings: bei F_res ≠ 0 wird er aus der Mitte gezogen und zittert
    const off = ok || R < 1e-6 ? 0 : Math.min(34, 6 + R * 1.1) * (.8 + .2 * Math.sin(t * 6)), P = [R0[0] + (R ? K.rx / R : 0) * off, R0[1] - (R ? K.ry / R : 0) * off];
    // Wand mit Feder (links)
    g.fillStyle = "#3a4152"; g.fillRect(26, 210, 22, 180); g.strokeStyle = "#5b6478"; g.lineWidth = 2; for (let y = 214; y < 390; y += 16) { g.beginPath(); g.moveTo(26, y + 10); g.lineTo(48, y); g.stroke(); }
    const zz = []; const xa = 48, xb = P[0] - 18, n = 14; zz.push([xa, P[1]]); for (let i = 1; i < n; i++) zz.push([xa + (xb - xa) * i / n, P[1] + (i % 2 ? -11 : 11)]); zz.push([xb, P[1]]);
    line(g, zz, "#9aa3b5", 3);
    // Seilwinde (rechts oben) und Seil
    const Wn = [R0[0] + SU[0] * RK * 9.6, R0[1] - SU[1] * RK * 9.6];
    line(g, [P, Wn], "#c8b07a", 4);
    g.fillStyle = "#2b3242"; g.beginPath(); g.arc(Wn[0], Wn[1], 22, 0, TAU); g.fill(); g.strokeStyle = "#8d96a8"; g.lineWidth = 4; g.stroke();
    line(g, [[Wn[0], Wn[1]], [Wn[0] + Math.cos(t * 1.5) * 16, Wn[1] + Math.sin(t * 1.5) * 16]], "#c8b07a", 4);
    st(g, "Seilwinde", Wn[0] - 32, Wn[1] + 2, 24, "#aab4c6", "right", 600);
    // Verlängerung des Seils über das Schlüsselloch hinaus, mit Strichen im Abstand von 1 Kästchen (10 N)
    const E = [R0[0] - SU[0] * RK * 7.2, R0[1] + SU[1] * RK * 7.2];
    line(g, [R0, E], "rgba(200,176,122,.55)", 2, [10, 8]);
    for (let k = 1; k <= 7; k++) { const cx = R0[0] - SU[0] * RK * k, cy = R0[1] + SU[1] * RK * k; line(g, [[cx - SU[1] * 7, cy - SU[0] * 7], [cx + SU[1] * 7, cy + SU[0] * 7]], "rgba(200,176,122,.8)", 2); }
    // Legende oben links (frei in allen Einstellungen): So bleibt unten Platz für die wandernde Beschriftung „Diagonale“
    line(g, [[26, 100], [74, 100]], "rgba(200,176,122,.75)", 2, [10, 8]); for (const x of [38, 62]) line(g, [[x, 92], [x, 108]], "rgba(200,176,122,.9)", 2);
    st(g, "Seil-Linie: 1 Strich ≙ 10 N", 84, 100, 24, "#b9a679", "left", 600, 280);
    // Striche der Seil-Linie: Die Beschriftung „Diagonale“ soll sie möglichst nicht überdecken
    const soft = []; for (let k = 0; k <= 7.2; k += .4) soft.push(boxOf(R0[0] - SU[0] * RK * k, R0[1] + SU[1] * RK * k, 12, "center", 8));
    // Schlüsselloch
    g.fillStyle = "#3a3220"; g.beginPath(); g.arc(R0[0], R0[1], 26, 0, TAU); g.fill(); g.strokeStyle = ok ? "#5fd38d" : "#c9a54a"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "#0b0d12"; g.beginPath(); g.arc(R0[0], R0[1] - 5, 7, 0, TAU); g.fill(); g.beginPath(); g.moveTo(R0[0] - 5, R0[1] - 2); g.lineTo(R0[0] + 5, R0[1] - 2); g.lineTo(R0[0] + 8, R0[1] + 14); g.lineTo(R0[0] - 8, R0[1] + 14); g.closePath(); g.fill();
    // Beschriftung rechts neben dem Schlüsselloch, oberhalb der Beschriftung F_Korb
    line(g, [[R0[0] + 27, R0[1] + 8], [R0[0] + 98, R0[1] + 30]], "rgba(201,165,74,.7)", 2); st(g, "Schlüsselloch", R0[0] + 102, R0[1] + 34, 24, "#c9a54a", "left", 600);
    // Korb mit Wägestücken
    const yb = P[1] + 122; line(g, [P, [P[0], yb]], "#c8b07a", 3);
    g.fillStyle = "#b5895a"; g.beginPath(); g.moveTo(P[0] - 52, yb); g.lineTo(P[0] + 52, yb); g.lineTo(P[0] + 38, yb + 56); g.lineTo(P[0] - 38, yb + 56); g.closePath(); g.fill();
    g.strokeStyle = "#7a5832"; g.lineWidth = 3; g.stroke(); for (let i = 1; i < 4; i++) line(g, [[P[0] - 52 + i * 3.5, yb + i * 14], [P[0] + 52 - i * 3.5, yb + i * 14]], "#8f6a40", 2);
    line(g, [[P[0] + 46, yb + 8], [P[0] + 66, yb + 22]], "#c8b07a", 2);
    g.fillStyle = "#efe2c4"; g.beginPath(); g.roundRect(P[0] + 64, yb + 12, 118, 34, 6); g.fill(); st(g, `m = ${de(v.m)} kg`, P[0] + 123, yb + 29, 24, "#1b1208", "center", 800, 108);
    // Kräfteparallelogramm aus F_1 und F_G (gestrichelt) und seine Diagonale
    const t1 = [P[0] - F1 * px, P[1]], tG = [P[0], P[1] + K.FG * px], dg = [P[0] - F1 * px, P[1] + K.FG * px];
    line(g, [t1, dg, tG], "rgba(255,255,255,.4)", 2.5, [9, 7]);
    arrow(g, P[0], P[1], dg[0], dg[1], 4, COL.diag, [12, 8]);
    { g.font = `600 24px ${FONT}`; const wD = g.measureText("Diagonale").width, lx = y => R0[0] - (y - R0[1]) * SU[0] / SU[1];   // x der Seil-Linie in Höhe y
      // feste Hindernisse: Korb, Schild m, Beschriftung F_Korb, Ring, Wand, Rand
      const hard = [[P[0] - 56, yb - 4, P[0] + 56, yb + 60], [P[0] + 60, yb + 8, P[0] + 186, yb + 50], [P[0] + 12, P[1] + 44, P[0] + 96, P[1] + 80], [P[0] - 22, P[1] - 22, P[0] + 22, P[1] + 22], [22, 206, 52, 394]];
      const cand = [[dg[0] - 12, dg[1] + 22], [dg[0] - 14, dg[1] - 26], [lx(dg[1] + 22) - 20, dg[1] + 22], [dg[0] - 16, dg[1] + 2], [lx(dg[1] + 2) - 20, dg[1] + 2], [dg[0] + wD / 2, dg[1] + 30]];
      const score = ([x, y]) => { const b = boxOf(x, y, wD, "right"); return (b[0] < 16 || b[3] > 528 ? 100 : 0) + 10 * hard.filter(h => hitBox(b, h)).length + soft.filter(h => hitBox(b, h)).length; };
      const c = cand.reduce((best, q) => score(q) < score(best) ? q : best, cand[0]);
      st(g, "Diagonale", c[0], c[1], 24, COL.diag, "right", 600); }
    // Kraftpfeile
    // Beschriftungen in festem Abstand vom Ring (die Werte stehen rechts in der Tafel, F_res in Grün wie sein Pfeil)
    arrow(g, P[0], P[1], t1[0], t1[1], 7, COL.f1); st(g, "F_{1}", P[0] - 60, P[1] - 30, 30, COL.f1, "center", 700);
    arrow(g, P[0], P[1], tG[0], tG[1], 7, COL.G); st(g, "F_{Korb}", P[0] + 16, P[1] + 62, 30, COL.G, "left", 700);
    const t2 = [P[0] + SU[0] * v.F2 * px, P[1] - SU[1] * v.F2 * px]; arrow(g, P[0], P[1], t2[0], t2[1], 7, COL.f2);
    st(g, "F_{2}", P[0] + 23, P[1] - 72, 30, COL.f2, "center", 700);
    if (!ok && R >= .5) arrow(g, P[0], P[1], P[0] + K.rx * px, P[1] - K.ry * px, 6, COL.res);
    // Ring
    if (ok) { g.save(); g.shadowColor = "#5fd38d"; g.shadowBlur = 26; }
    g.strokeStyle = ok ? "#5fd38d" : "#e8e8e8"; g.lineWidth = 7; g.beginPath(); g.arc(P[0], P[1], 15, 0, TAU); g.stroke(); if (ok) g.restore();
    // Werte rechts
    g.fillStyle = "#171c26"; g.beginPath(); g.roundRect(588, 56, 296, 404, 16); g.fill(); g.strokeStyle = "#2a3140"; g.lineWidth = 2; g.stroke();
    st(g, "Kräfte am Ring", 736, 88, 28, "#ffe9a8", "center", 700);
    st(g, `F_{1} = ${F1} N`, 606, 136, 30, COL.f1, "left", 700);
    st(g, "F_{Korb} = F_{G} = m · g", 606, 188, 30, COL.G, "left", 700, 268); st(g, `≈ ${de(v.m)} kg · 10 N/kg = ${dn(K.FG)} N`, 606, 222, 24, "#e8e8e8", "left", 600, 268);
    st(g, `F_{2} = ${dn(v.F2)} N`, 606, 274, 30, COL.f2, "left", 700);
    g.fillStyle = "#2a3140"; g.fillRect(606, 306, 260, 2);
    if (R < .5) { st(g, "F_{res} = 0 N", 606, 342, 30, COL.res, "left", 700); st(g, "Kräftegleichgewicht", 606, 378, 24, COL.res, "left", 700, 268); }
    else { st(g, `F_{res} ≈ ${de(R)} N`, 606, 342, 30, COL.res, "left", 700); st(g, "Ring wird verschoben", 606, 378, 24, "#ffb3a8", "left", 600, 268); }
    g.fillStyle = "#2a3140"; g.fillRect(606, 404, 260, 2);
    st(g, "Diagonale: F_{1} und F_{Korb}", 606, 432, 24, COL.diag, "left", 600, 268);
    lockIcon(g, 618, 500, 40, ok, ok ? "#5fd38d" : "#ff5a48");
    st(g, ok ? "Schlüssel rastet ein!" : "Schlüssel rastet nicht ein", 650, 502, 24, ok ? "#5fd38d" : "#ffb3a8", "left", 700, 236);
  },
  pruefe(v){
    const K = kraefte(v), R = Math.hypot(K.rx, K.ry);
    if (R < 1e-9) return {ok: true};
    if (Math.abs(K.FG - 40) > 1e-9) return {ok: false, text: `Bei m = ${de(v.m)} kg zieht der Korb mit **F_{Korb} = F_{G} = m · g ≈ ${de(v.m)} kg · 10 N/kg = ${dn(K.FG)} N**. Ergänze F_{1} und F_{Korb} zum **Kräfteparallelogramm**: Die Diagonale liegt dann ${K.FG > 40 ? "steiler" : "flacher"} als die gestrichelte Seil-Linie. Das Seil kann sie deshalb **nicht ausgleichen – egal wie stark es zieht**, denn F_{2} wirkt nur längs des Seils. Für ein Kräftegleichgewicht muss die Diagonale genau auf der Seil-Linie liegen.`};
    return {ok: false, text: `F_{Korb} = 40 N passt: Die Diagonale aus F_{1} und F_{Korb} liegt genau auf der Seil-Linie. Aber F_{2} = ${dn(v.F2)} N ist ${v.F2 > 50 ? "**zu groß** – der Ring wird nach rechts oben gezogen" : "**zu klein** – der Ring wird nach links unten gezogen"}. Im **Kräftegleichgewicht** ist F_{2} genau so groß wie die Diagonale und zeigt in die Gegenrichtung. Miss die Diagonale an den Strichen der Seil-Linie ab (1 Strich ≙ 10 N).`};
  },
  tipps: ["Der Ring ruht nur im **Kräftegleichgewicht** (F_{res} = 0 N): F_{2} muss die gemeinsame Wirkung von F_{1} und F_{Korb} – die Diagonale des Kräfteparallelogramms – genau aufheben.",
          "Die Diagonale muss deshalb genau auf der Seil-Linie liegen. Das Seil steigt auf **3 Kästchen nach rechts um 4 Kästchen** an, F_{1} ist 3 Kästchen lang. Wie viele Kästchen lang muss F_{Korb} sein?",
          "F_{Korb} = F_{G} = 40 N. Mit g ≈ 10 N/kg (gerundet) ist m = F_{G} : g ≈ 40 N : 10 N/kg = … kg. Die Diagonale reicht dann bis zum 5. Strich der Seil-Linie – so stark muss F_{2} ziehen."],
  loesung: {m: 4, F2: 50},
  erfolg: "**Kräftegleichgewicht!** F_{1} = 30 N und F_{Korb} = F_{G} = m · g ≈ 4 kg · 10 N/kg = 40 N ergeben im Kräfteparallelogramm eine Diagonale von 50 N. Genau so stark zieht die Seilwinde in die Gegenrichtung: F_{res} = 0 N – der Ring ruht über dem Schlüsselloch, der Schlüssel rastet ein."
};

/* ---------- Suchbild: Schulfest der Physik-AG ---------- */
function stall(g, x0, x1, c1, c2, title, plate, ink, cloth){
  g.fillStyle = "#6e4e30"; g.fillRect(x0 + 8, 150, 12, 550); g.fillRect(x1 - 20, 150, 12, 550);
  const n = Math.round((x1 - x0) / 45), sw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(x0 + i * sw, 108, sw + .5, 54); g.beginPath(); g.arc(x0 + i * sw + sw / 2, 162, sw / 2, 0, Math.PI); g.fill(); }
  g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x0, 108, x1 - x0, 6);
  const pw = 220, pc = (x0 + x1) / 2; g.fillStyle = plate; g.beginPath(); g.roundRect(pc - pw / 2, 112, pw, 42, 10); g.fill(); st(g, title, pc, 134, 30, ink, "center", 800, pw - 20);
  g.fillStyle = "#a0703f"; g.fillRect(x0, 470, x1 - x0, 20); g.fillStyle = "#7d552c"; g.fillRect(x0, 488, x1 - x0, 4);
  g.fillStyle = cloth; g.fillRect(x0 + 6, 492, x1 - x0 - 12, 208);
}
function kid(g, x, y, h, lean, shirt, hand){
  const sn = Math.sin(lean), cs = Math.cos(lean), at = (lx, ly) => [x + lx * cs - ly * sn, y + lx * sn + ly * cs];
  line(g, [at(-.02 * h, -.46 * h), at(-.16 * h, 0)], "#2c3e66", h * .075); line(g, [at(.02 * h, -.46 * h), at(.12 * h, 0)], "#2c3e66", h * .075);
  line(g, [at(0, -.48 * h), at(0, -.78 * h)], shirt, h * .2);
  const hd = at(0, -.9 * h); g.fillStyle = "#e7b991"; g.beginPath(); g.arc(hd[0], hd[1], h * .1, 0, TAU); g.fill(); g.fillStyle = "#5a3a22"; g.beginPath(); g.arc(hd[0], hd[1] - h * .03, h * .1, Math.PI * 1.05, Math.PI * 1.95); g.fill();
  const sh = at(0, -.74 * h); line(g, [sh, hand], shirt, h * .06); line(g, [at(0, -.7 * h), [hand[0], hand[1] + 4]], shirt, h * .06);
}
function schulfest(g, W, H){
  // Himmel, Schulhaus, Pausenhof
  let gr = g.createLinearGradient(0, 0, 0, 440); gr.addColorStop(0, "#bfe1fa"); gr.addColorStop(1, "#eaf6fd"); g.fillStyle = gr; g.fillRect(0, 0, W, 440);
  g.fillStyle = "#efe0c0"; g.fillRect(0, 44, W, 400); g.fillStyle = "#b5573b"; g.fillRect(0, 34, W, 16);
  for (let x = 20; x < W; x += 118) { g.fillStyle = "#9cc7e6"; g.fillRect(x, 190, 74, 92); g.strokeStyle = "#f8f4ea"; g.lineWidth = 5; g.strokeRect(x, 190, 74, 92); line(g, [[x + 37, 190], [x + 37, 282]], "#f8f4ea", 4); }
  gr = g.createLinearGradient(0, 440, 0, H); gr.addColorStop(0, "#d6cdb9"); gr.addColorStop(1, "#c9bfa8"); g.fillStyle = gr; g.fillRect(0, 440, W, H - 440);
  g.strokeStyle = "rgba(120,105,80,.25)"; g.lineWidth = 2; for (let y = 470; y < H; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // Wimpelkette und Banner
  const fl = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];
  for (let i = 0; i < 24; i++) { const x = 10 + i * 50, y = 16 + Math.sin(i / 23 * Math.PI) * 10; g.fillStyle = fl[i % 5]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y + 2); g.lineTo(x + 20, y + 30); g.closePath(); g.fill(); }
  line(g, Array.from({length: 25}, (_, i) => [10 + i * 50, 16 + Math.sin(i / 24 * Math.PI) * 10]), "#555", 2);
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(520, 58, 240, 40, 8); g.fill(); g.strokeStyle = "#e74c3c"; g.lineWidth = 3; g.stroke(); st(g, "Schulfest", 640, 79, 28, "#c0392b", "center", 800);

  /* --- linker Stand: Physik-AG --- */
  stall(g, 30, 480, "#2f6db5", "#ffffff", "Physik-AG", "#1d3a8a", "#ffffff", "#2f6db5");
  st(g, "Kräfte messen!", 148, 560, 30, "#ffffff", "center", 800, 210);
  // Federkraftmesser mit Apfelnetz (richtig: 1 kg → 9,8 N, F_G vom Schwerpunkt nach unten)
  line(g, [[130, 180], [130, 198]], "#555", 3);
  g.fillStyle = "#efe9da"; g.fillRect(116, 198, 28, 120); g.strokeStyle = "#555"; g.lineWidth = 3; g.strokeRect(116, 198, 28, 120);
  for (let i = 0; i <= 10; i++) line(g, [[118, 206 + i * 10], [i % 5 ? 126 : 132, 206 + i * 10]], "#333", 2);
  line(g, [[116, 304], [144, 304]], "#c0392b", 4);   // Zeiger bei 9,8 N (Skala 0 … 10 N, lange Striche bei 0, 5 und 10 N)
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(156, 286, 78, 36, 6); g.fill(); g.strokeStyle = "#888"; g.lineWidth = 2; g.stroke(); line(g, [[144, 304], [156, 304]], "#888", 2);
  st(g, "9,8 N", 195, 305, 24, "#1b1b1b", "center", 800);
  line(g, [[130, 318], [130, 334]], "#555", 3);
  g.fillStyle = "#f4f1e2"; g.beginPath(); g.ellipse(130, 372, 44, 38, 0, 0, TAU); g.fill(); g.strokeStyle = "#8a7a50"; g.lineWidth = 2; g.stroke();
  [[112, 362], [140, 356], [124, 386], [150, 384], [106, 386]].forEach(([x, y]) => { g.fillStyle = "#d63b2f"; g.beginPath(); g.arc(x, y, 13, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(x - 4, y - 4, 4, 0, TAU); g.fill(); });
  g.strokeStyle = "rgba(120,100,60,.6)"; g.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(130 + k * 12, 336); g.lineTo(130 + k * 9, 408); g.stroke(); }
  g.fillStyle = "#ffffff"; g.fillRect(44, 380, 50, 28); g.strokeStyle = "#999"; g.lineWidth = 2; g.strokeRect(44, 380, 50, 28); st(g, "1 kg", 69, 395, 22, "#1b1b1b", "center", 800);
  arrow(g, 130, 372, 130, 462, 6, "#d62828"); st(g, "F_{G}", 142, 440, 26, "#d62828", "left", 700, 0, HAND);
  // Balkenwaage mit Honigglas (richtig: Masse in g)
  g.fillStyle = "#5b5b5b"; g.beginPath(); g.moveTo(312, 470); g.lineTo(368, 470); g.lineTo(352, 456); g.lineTo(328, 456); g.closePath(); g.fill(); g.fillRect(337, 398, 6, 60);
  line(g, [[280, 400], [400, 400]], "#444", 6); line(g, [[340, 400], [340, 384]], "#c0392b", 3);
  for (const x of [285, 395]) { line(g, [[x, 402], [x - 28, 444]], "#666", 2); line(g, [[x, 402], [x + 28, 444]], "#666", 2); line(g, [[x - 32, 446], [x + 32, 446]], "#444", 5); }
  g.fillStyle = "#e9a823"; g.fillRect(270, 412, 30, 32); g.fillStyle = "#7a4b1a"; g.fillRect(268, 406, 34, 8);
  g.fillStyle = "#b08d57"; g.beginPath(); g.roundRect(381, 416, 28, 28, 4); g.fill(); g.fillStyle = "#8a6a3a"; g.fillRect(389, 408, 12, 8);
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(268, 498, 150, 60, 6); g.fill(); st(g, "Honig", 343, 514, 22, "#1b1b1b", "center", 800); st(g, "m = 500 g", 343, 541, 22, "#1b1b1b", "center", 700);
  // Kartoffelsack (FEHLER: Masse in N)
  g.fillStyle = "#c9a46c"; g.beginPath(); g.moveTo(352, 612); g.quadraticCurveTo(300, 640, 302, 720); g.quadraticCurveTo(304, 774, 372, 776); g.quadraticCurveTo(440, 774, 442, 720);
  g.quadraticCurveTo(444, 640, 392, 612); g.closePath(); g.fill(); g.strokeStyle = "#8f6d3d"; g.lineWidth = 3; g.stroke();
  line(g, [[350, 610], [394, 610]], "#6b4f2a", 6); g.fillStyle = "#c9a46c"; g.beginPath(); g.moveTo(356, 610); g.lineTo(346, 588); g.lineTo(372, 600); g.lineTo(398, 588); g.lineTo(388, 610); g.closePath(); g.fill();
  g.fillStyle = "#fffdf5"; g.fillRect(320, 660, 104, 72); g.strokeStyle = "#9a8a6a"; g.lineWidth = 2; g.strokeRect(320, 660, 104, 72);
  st(g, "Kartoffeln", 372, 680, 22, "#1b1b1b", "center", 800, 96); st(g, "m = 5 N", 372, 712, 26, "#1b1b1b", "center", 800, 96);

  /* --- Mitte: Seilrolle mit Kiste, Tauziehen --- */
  g.fillStyle = "#6e4e30"; g.fillRect(596, 96, 12, 34); line(g, [[602, 106], [712, 116]], "#7d552c", 10); line(g, [[604, 162], [650, 112]], "#7d552c", 7);
  g.fillStyle = "#555"; g.beginPath(); g.arc(700, 126, 13, 0, TAU); g.fill(); g.fillStyle = "#999"; g.beginPath(); g.arc(700, 126, 4, 0, TAU); g.fill();
  line(g, [[713, 126], [713, 236]], "#9c7b4a", 3); line(g, [[687, 128], [610, 300]], "#9c7b4a", 3); g.fillStyle = "#555"; g.fillRect(600, 296, 20, 8);
  g.fillStyle = "#c58f52"; g.fillRect(663, 238, 100, 90); g.strokeStyle = "#7d552c"; g.lineWidth = 3; g.strokeRect(663, 238, 100, 90);
  for (const y of [268, 298]) line(g, [[663, y], [763, y]], "#9a6b38", 2); line(g, [[663, 238], [763, 328]], "#9a6b38", 3);
  g.fillStyle = "#fffdf5"; g.fillRect(721, 302, 38, 20); st(g, "LIMO", 740, 313, 15, "#1b1b1b", "center", 800);
  g.strokeStyle = "#555"; g.lineWidth = 3; g.beginPath(); g.arc(713, 232, 6, 0, TAU); g.stroke();
  arrow(g, 713, 238, 713, 352, 6, "#d62828"); st(g, "F_{G}", 726, 348, 26, "#d62828", "left", 700, 0, HAND);
  // Tauziehen (Lea hat die Kräfte eingezeichnet)
  const hl = [566, 656], hr = [706, 656];
  kid(g, 556, 762, 175, -.32, "#e67e22", hl); kid(g, 716, 762, 150, .32, "#16a085", hr);
  line(g, [[hl[0] - 10, hl[1]], [hr[0] + 12, hr[1]]], "#b59a6a", 6); g.fillStyle = "#c0392b"; g.fillRect(632, 650, 8, 26);
  line(g, [[636, 588], [636, 648]], "rgba(29,95,214,.6)", 2, [5, 5]);
  // Pfeillängen im Maßstab 0,35 px je N: 300 N → 105 px nach links, 180 N → 63 px nach rechts
  arrow(g, 636, 584, 531, 584, 6, "#1d5fd6"); arrow(g, 636, 584, 699, 584, 6, "#1d5fd6"); g.fillStyle = "#1d5fd6"; g.beginPath(); g.arc(636, 584, 7, 0, TAU); g.fill();
  st(g, "300 N", 584, 562, 22, "#1d5fd6", "center", 700, 0, HAND); st(g, "180 N", 668, 562, 22, "#1d5fd6", "center", 700, 0, HAND);
  g.save(); g.translate(636, 500); g.rotate(-.03); g.fillStyle = "#fff3a6"; g.fillRect(-116, -32, 232, 66); g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(-116, 30, 232, 4);
  st(g, "F_{res} = 300 N + 180 N", 0, -12, 22, "#1d3a8a", "center", 700, 214, HAND); st(g, "= 480 N", 0, 17, 24, "#1d3a8a", "center", 800, 214, HAND); g.restore();

  /* --- rechter Stand: Sternwarte --- */
  stall(g, 780, 1180, "#1d2b4f", "#f2c14e", "Sternwarte", "#1d2b4f", "#f2c14e", "#1d2b4f");
  g.fillStyle = "#fbfaf5"; g.fillRect(812, 196, 240, 364); g.strokeStyle = "#1d2b4f"; g.lineWidth = 4; g.strokeRect(812, 196, 240, 364);
  st(g, "Ortsfaktoren", 932, 226, 26, "#1d2b4f", "center", 800, 220);
  g.fillStyle = "#2f7fd0"; g.beginPath(); g.arc(848, 274, 22, 0, TAU); g.fill(); g.fillStyle = "#3e9a4a"; g.beginPath(); g.ellipse(842, 268, 9, 12, .4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(856, 284, 7, 6, 0, 0, TAU); g.fill();
  st(g, "Erde", 880, 260, 24, "#1d2b4f", "left", 800); st(g, "g = 9,81 N/kg", 880, 291, 24, "#1d2b4f", "left", 600, 166);
  line(g, [[830, 326], [1034, 326]], "#c9c3b0", 2);
  g.fillStyle = "#b8b6ae"; g.beginPath(); g.arc(852, 402, 30, 0, TAU); g.fill(); [[842, 394, 7], [862, 410, 5], [858, 390, 4], [846, 414, 4]].forEach(([x, y, r]) => { g.fillStyle = "#94928a"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
  st(g, "Mond", 892, 386, 24, "#1d2b4f", "left", 800); st(g, "g = 9,81 N/kg", 892, 418, 24, "#1d2b4f", "left", 600, 154);
  line(g, [[830, 478], [1034, 478]], "#c9c3b0", 2); st(g, "Tag der offenen Tür", 932, 524, 22, "#1d2b4f", "center", 700, 220);
  st(g, "Mondwaage: Deine Masse bleibt gleich –", 980, 618, 22, "#f2c14e", "center", 700, 376);
  st(g, "die Gewichtskraft beträgt nur etwa ein Sechstel.", 980, 650, 22, "#f2c14e", "center", 600, 376);
  // Lampion an der Schnur (FEHLER: F_G nach oben)
  line(g, [[1118, 182], [1118, 254]], "#444", 2);
  g.fillStyle = "#ff8a3d"; g.beginPath(); g.ellipse(1118, 296, 32, 42, 0, 0, TAU); g.fill(); g.strokeStyle = "#d9692a"; g.lineWidth = 2; for (const k of [-.5, 0, .5]) { g.beginPath(); g.ellipse(1118, 296, 32 * Math.abs(k) + 2, 42, 0, 0, TAU); g.stroke(); }
  g.fillStyle = "#3a3a3a"; g.fillRect(1104, 252, 28, 6); g.fillRect(1104, 334, 28, 6);
  arrow(g, 1118, 296, 1118, 200, 6, "#d62828"); st(g, "F_{G}", 1134, 214, 26, "#d62828", "left", 700, 0, HAND);
}
const suchbild = {
  titel: "Schulfest der Physik-AG",
  text: "Lea hat beim Schulfest fotografiert und in ihr Bild **Kraftpfeile und Notizen** eingezeichnet. **Fünf Stellen** auf dem Bild sind physikalisch falsch. Klicke sie an und begründe, was falsch ist.",
  ort: {x: -3.6, z: -9.5, ry: 0},
  zeichne: schulfest,
  fehler: [
    {x: 1118, y: 268, r: 64, name: "Der Kraftpfeil am Lampion", frage: "Was ist an Leas Pfeil F_{G} falsch?",
     optionen: ["Ein Lampion ist so leicht, dass er gar keine Gewichtskraft hat.", "Nichts – der Lampion wird nach oben gehalten, also zeigt die Gewichtskraft nach oben.", "Die Gewichtskraft zeigt immer senkrecht nach unten, zum Erdmittelpunkt – nicht nach oben.", "Der Pfeil müsste waagrecht zeigen."], richtig: 2,
     warum: ["Auch ein leichter Körper hat eine Masse und damit eine Gewichtskraft – sie ist nur klein. Hätte der Lampion keine, bräuchte er gar keine Schnur.",
             "Nach oben zieht die **Schnur** – das ist eine eigene Kraft. Die Gewichtskraft zeigt trotzdem nach unten; beide Kräfte halten sich das Gleichgewicht.",
             null,
             "Waagrecht zieht die Erde nie: Ihre Anziehung zeigt überall zum Erdmittelpunkt, also senkrecht nach unten."],
     erklaerung: "Die Erde zieht jeden Körper zu ihrem Mittelpunkt hin: **F_{G} zeigt senkrecht nach unten**. Nach oben zieht die **Schnur** – das ist eine andere Kraft. Weil der Lampion ruht, sind beide gleich groß: ein Kräftegleichgewicht."},
    {x: 372, y: 696, r: 72, name: "Das Schild am Kartoffelsack", frage: "Was stimmt an der Aufschrift nicht?",
     optionen: ["Die Masse gibt man in Kilogramm (kg) an – Newton (N) ist die Einheit der Kraft.", "Alles richtig: 5 N ist ein typischer Wert für einen Kartoffelsack.", "Es müsste „g = 5 N/kg“ heißen.", "Masse und Gewichtskraft sind dasselbe – nur die Zahl ist zu klein."], richtig: 0,
     warum: [null,
             "Vor dem Wert steht „m =“ – gemeint ist also eine Masse, und Massen gibt man in kg an. 5 N wäre außerdem nur die Gewichtskraft von etwa 0,5 kg.",
             "g ist der Ortsfaktor eines Ortes (Erde 9,81 N/kg), keine Angabe auf einem Sack. Auf das Schild gehört die Masse der Kartoffeln.",
             "Masse (in kg) und Gewichtskraft (in N) sind verschiedene Größen. Falsch ist nicht die Zahl, sondern die Einheit hinter „m =“."],
     erklaerung: "**Masse** misst man in **kg** (hier z. B. m = 5 kg), **Kräfte** wie die Gewichtskraft in **N**. Ein 5-kg-Sack hat auf der Erde die Gewichtskraft F_{G} = 5 kg · 9,81 N/kg ≈ 49 N."},
    {x: 942, y: 408, r: 98, name: "Der Ortsfaktor auf dem Mond", frage: "Was ist auf dem Plakat falsch?",
     optionen: ["Auf dem Mond gibt es gar keine Gewichtskraft, also g = 0 N/kg.", "Der Ortsfaktor ist überall gleich, nur die Masse ändert sich.", "Die Einheit müsste kg/N heißen.", "Der Mond hat einen viel kleineren Ortsfaktor: etwa 1,6 N/kg – nicht 9,81 N/kg wie die Erde."], richtig: 3,
     warum: ["Auch der Mond zieht Körper an, nur schwächer – sonst würden Astronauten nach einem Sprung nicht wieder landen. Sein Ortsfaktor ist etwa 1,6 N/kg, nicht 0.",
             "Genau umgekehrt: Die Masse bleibt überall gleich, der Ortsfaktor hängt vom Himmelskörper ab.",
             "N/kg ist richtig: Der Ortsfaktor gibt an, wie viel Newton Gewichtskraft auf jedes Kilogramm kommen. Falsch ist der Zahlenwert beim Mond.",
             null],
     erklaerung: "Der Ortsfaktor hängt vom Himmelskörper ab: **Erde 9,81 N/kg**, **Mond etwa 1,6 N/kg** – rund ein Sechstel. Deshalb ist die Gewichtskraft auf dem Mond kleiner, die **Masse bleibt gleich** (wie es unten am Stand richtig steht)."},
    {x: 713, y: 284, r: 64, name: "Der Kraftpfeil an der Kiste", frage: "Was stimmt an Leas Pfeil F_{G} nicht?",
     optionen: ["Der Pfeil müsste nach oben zeigen, weil die Kiste am Seil hängt.", "Der Angriffspunkt ist falsch: Die Gewichtskraft greift im Schwerpunkt an – der Pfeil muss in der Mitte der Kiste beginnen, nicht am Haken.", "Kisten zeichnet man ohne Kraftpfeil.", "Der Pfeil ist richtig – die Gewichtskraft greift immer am Seil an."], richtig: 1,
     warum: ["Nach oben zeigt die Seilkraft. Die Richtung von Leas Pfeil – senkrecht nach unten – stimmt; falsch ist, wo er beginnt.",
             null,
             "Kraftpfeile kann man an jedem Körper einzeichnen, auch an einer Kiste. Leas Pfeil muss nur an der richtigen Stelle beginnen.",
             "Am Seil greift die Seilkraft an. Die Erde zieht an der ganzen Kiste – deshalb beginnt der Pfeil der Gewichtskraft im Schwerpunkt."],
     erklaerung: "Der Kraftpfeil der Gewichtskraft beginnt im **Schwerpunkt** – bei der gleichmäßig gefüllten Kiste in ihrer **Mitte**. Am Haken greift die **Seilkraft** an; sie zeigt nach oben."},
    {x: 636, y: 500, r: 104, name: "Leas Notiz zum Tauziehen", frage: "Was ist an Leas Rechnung falsch?",
     optionen: ["Richtig – Kräfte werden immer addiert.", "Die Kräfte zeigen in entgegengesetzte Richtungen, also wird subtrahiert: 300 N − 180 N = 120 N nach links.", "Die resultierende Kraft muss 0 N sein, weil sich die Kräfte beim Tauziehen immer aufheben.", "Man bildet den Mittelwert: (300 N + 180 N) : 2 = 240 N."], richtig: 1,
     warum: ["Addiert wird nur bei Kräften in gleicher Richtung. Leas Pfeile zeigen aber nach links und nach rechts – also entgegengesetzt.",
             null,
             "Aufheben würden sich die Kräfte nur, wenn sie gleich groß wären. 300 N und 180 N sind verschieden – deshalb gewinnt das linke Kind.",
             "Einen Mittelwert bildet man bei Kräften nicht. Entgegengesetzte Kräfte heben sich teilweise auf – übrig bleibt ihr Unterschied."],
     erklaerung: "Kräfte in **entgegengesetzte** Richtungen werden **subtrahiert**: F_{res} = 300 N − 180 N = **120 N**. Die Resultierende zeigt in Richtung der größeren Kraft – nach links, das linke Kind gewinnt. Addiert wird nur bei **gleicher** Richtung."}
  ],
  // richtig dargestellte Details (ohne Überlappung mit den Fehlerkreisen)
  ablenker: [
    {x: 180, y: 290, r: 48, text: "Der Federkraftmesser zeigt für das Apfelnetz mit **1 kg** **9,8 N** an – das passt zu F_{G} = 1 kg · 9,81 N/kg ≈ 9,8 N."},
    {x: 130, y: 420, r: 48, text: "Dieser F_{G}-Pfeil ist richtig gezeichnet: Er beginnt im **Schwerpunkt** des Apfelnetzes und zeigt **senkrecht nach unten**."},
    {x: 342, y: 476, r: 80, text: "Die **Balkenwaage** vergleicht Massen – deshalb steht auf dem Schild die Masse in Gramm: m = 500 g. Das ist richtig so."},
    {x: 870, y: 270, r: 42, text: "Für die **Erde** stimmt das Plakat: g = 9,81 N/kg – auf jedes Kilogramm Masse wirkt eine Gewichtskraft von 9,81 N."},
    {x: 980, y: 634, r: 60, text: "Der Satz zur Mondwaage stimmt: Die **Masse** bleibt gleich, die **Gewichtskraft** ist auf dem Mond nur etwa ein Sechstel so groß (1,6 N/kg statt 9,81 N/kg)."}
  ],
  abschluss: "So stimmt es: **F_{G}** zeigt senkrecht nach unten und beginnt im **Schwerpunkt**, Massen gibt man in **kg** an, der Ortsfaktor hängt vom Ort ab (Mond ≈ 1,6 N/kg) – und entgegengesetzte Kräfte werden **subtrahiert**."
};

R3D.lern.raum("kraft1", {
  raetsel, suchbild,
  // Rechenwerkstatt: Tafel im Raum (freie Bodenstelle vorne rechts, gegenüber der Suchbild-Staffelei) + Knopf an Station 3
  uebung: {ort: {x: 3.6, z: -9.5, ry: 0}, formel: "F_{G} = m · g"},
  rechenweg: [
    // 1: vorgerechnetes Beispiel (nur nachvollziehen)
    {titel: "Der Schulranzen", text: "Ein Schulranzen hat die Masse 6 kg. Wie groß ist seine Gewichtskraft auf der Erde? Rechne mit g = 9,81 N/kg.",
     gegeben: [{g: "m", wert: 6, einheit: "kg", name: "Masse"}, {g: "g", wert: 9.81, einheit: "N/kg", name: "Ortsfaktor (Erde)"}],
     gesucht: {g: "F_{G}", einheit: "N", name: "Gewichtskraft"},
     formel: "F_{G} = m · g", formelAblenker: [{f: "F_{G} = m : g", warum: "Je größer der Ortsfaktor, desto stärker wird ein Körper angezogen. g steht deshalb als Faktor neben m, nicht unter dem Bruchstrich."},
                                              {f: "F_{G} = m + g", warum: "Masse (kg) und Ortsfaktor (N/kg) haben verschiedene Einheiten – man kann sie nicht addieren. Die Gewichtskraft ist das Produkt m · g."}],
     umgestellt: "F_{G} = m · g", einsetzen: "F_{G} = 6 kg · 9,81 N/kg", ergebnis: {wert: 58.86, einheit: "N", toleranz: .2},
     tipps: ["F_{G} = m · g", "F_{G} = 6 kg · 9,81 N/kg", "kg · N/kg = N. Rechne 6 · 9 = 54 und 6 · 0,81 = 4,86 – dann addieren."], loesung: "F_{G} = m · g = 6 kg · 9,81 N/kg = 58,86 N ≈ 59 N",
     antwort: "Der Schulranzen hat auf der Erde eine Gewichtskraft von rund 59 N.", antwortAnfang: "Der Schulranzen hat …", einheitAuch: ["Newton"]},
    // 2: Umrechnen g → kg
    {titel: "Der Fußball", text: "Ein Fußball hat die Masse 450 g. Berechne seine Gewichtskraft auf der Erde (g = 9,81 N/kg).",
     gegeben: [{g: "m", wert: 450, einheit: "g", name: "Masse", si: {wert: 0.45, einheit: "kg"}}, {g: "g", wert: 9.81, einheit: "N/kg", name: "Ortsfaktor (Erde)"}],
     gesucht: {g: "F_{G}", einheit: "N", name: "Gewichtskraft"},
     formel: "F_{G} = m · g", formelAblenker: [{f: "F_{G} = g : m", warum: "Dann hätte ein Körper mit größerer Masse eine kleinere Gewichtskraft. Es ist umgekehrt: doppelte Masse, doppelte Gewichtskraft – also F_{G} = m · g."},
                                              {f: "F_{G} = m : g", warum: "Ein größerer Ortsfaktor bedeutet eine größere Gewichtskraft – g wird deshalb mit m malgenommen, nicht geteilt."}],
     umgestellt: "F_{G} = m · g", einsetzen: "F_{G} = 0,45 kg · 9,81 N/kg", ergebnis: {wert: 4.4145, einheit: "N", toleranz: .05},
     tipps: ["Rechne zuerst um: 1 kg = 1000 g, also 450 g = 0,45 kg. Dann gilt F_{G} = m · g.", "F_{G} = 0,45 kg · 9,81 N/kg", "kg · N/kg = N. Rechne 0,4 · 9,81 = 3,924 und 0,05 · 9,81 ≈ 0,49 – dann addieren und sinnvoll runden."],
     loesung: "m = 450 g = 0,45 kg;  F_{G} = m · g = 0,45 kg · 9,81 N/kg ≈ 4,41 N ≈ 4,4 N",
     antwort: "Der Fußball hat eine Gewichtskraft von etwa 4,4 N.", antwortAnfang: "Der Fußball …", einheitAuch: ["Newton"],
     plausibel: {frage: "Passt eine Gewichtskraft von etwa 4,4 N zu einem Fußball?",
       optionen: ["Ja – als Faustregel gilt: Ein Körper mit 100 g hat auf der Erde eine Gewichtskraft von etwa 1 N, mit 450 g also etwa 4,5 N.",
                  "Nein – 450 g sind viel, die Gewichtskraft müsste über 4000 N liegen.",
                  "Nein – die Gewichtskraft muss man in Gramm angeben, nicht in Newton.",
                  "Nein – Masse und Gewichtskraft haben immer denselben Zahlenwert, es müssten also 450 N sein."], richtig: 0,
       warum: [null,
               "So viel kommt heraus, wenn man 450 g nicht in kg umrechnet: 450 · 9,81 = 4414,5. So eine große Gewichtskraft hätte ein Körper mit 450 kg – kein Fußball.",
               "Gramm ist eine Einheit der Masse. Die Gewichtskraft ist eine Kraft und wird in Newton angegeben.",
               "Masse und Gewichtskraft sind verschiedene Größen. Auf der Erde ist der Zahlenwert in N etwa zehnmal so groß wie der in kg: 0,45 kg → etwa 4,4 N."],
       erklaerung: "Faustregel für die Erde: Ein Körper mit **100 g** hat eine Gewichtskraft von etwa **1 N** (genau 0,981 N). Für 450 g passen deshalb etwa 4,5 N – genau gerechnet 4,4 N."}},
    // 3: Umstellen nach m (Mond)
    {titel: "Der Mondstein", text: "Eine Astronautin hängt auf dem Mond einen Stein an einen Federkraftmesser. Er zeigt 2,4 N an. Der Ortsfaktor auf dem Mond beträgt 1,6 N/kg. Welche Masse hat der Stein?",
     gegeben: [{g: "F_{G}", wert: 2.4, einheit: "N", name: "Gewichtskraft"}, {g: "g", wert: 1.6, einheit: "N/kg", name: "Ortsfaktor (Mond)"}],
     gesucht: {g: "m", einheit: "kg", name: "Masse"},
     formel: "F_{G} = m · g", formelAblenker: [{f: "F_{G} = m + g", warum: "Masse und Ortsfaktor haben verschiedene Einheiten (kg und N/kg) – addieren geht nicht. Die Gewichtskraft ist das Produkt m · g."},
                                              {f: "m = F_{G} · g", warum: "Das ist schon eine – falsch – umgestellte Formel. Starte mit der Grundformel F_{G} = m · g und stelle erst dann um."}],
     umgestellt: "m = F_{G} : g", umstellAblenker: [{f: "m = F_{G} · g", warum: "g ist in der Grundformel mit m malgenommen. Um m allein zu bekommen, teilst du beide Seiten durch g – nicht noch einmal malnehmen."},
                                                  {f: "m = g : F_{G}", warum: "Das ist der **Kehrwert**. Probe: 1,6 : 2,4 ≈ 0,67 – aber 0,67 kg · 1,6 N/kg ergibt nur etwa 1,1 N, nicht 2,4 N."}],
     umstellWeg: "F_{G} = m · g  | : g  →  F_{G} : g = m  →  m = F_{G} : g",
     einsetzen: "m = 2,4 N : 1,6 N/kg", ergebnis: {wert: 1.5, einheit: "kg", toleranz: .02},
     tipps: ["Stelle F_{G} = m · g nach m um: Teile beide Seiten durch g.", "m = 2,4 N : 1,6 N/kg", "N : N/kg = kg. Rechne 2,4 : 1,6 = 24 : 16 = …"], loesung: "m = F_{G} : g = 2,4 N : 1,6 N/kg = 1,5 kg",
     antwort: "Der Mondstein hat eine Masse von 1,5 kg.", antwortAnfang: "Der Mondstein …", einheitAuch: ["Kilogramm", "g"],
     plausibel: {frage: "Prüfe dein Ergebnis: Was würde derselbe Stein auf der Erde (g = 9,81 N/kg) am Federkraftmesser anzeigen, und welche Masse hätte er dort?",
       optionen: ["Etwa 14,7 N bei 1,5 kg – die Gewichtskraft ist etwa sechsmal so groß, die Masse bleibt gleich.", "Etwa 14,7 N bei 9 kg – auf der Erde ist alles sechsmal so schwer.",
                  "Wieder 2,4 N – ein Federkraftmesser zeigt überall dasselbe an.", "Etwa 0,4 N – auf der Erde ist der Ortsfaktor größer, deshalb wird die Gewichtskraft kleiner."], richtig: 0,
       warum: [null,
               "Sechsmal so groß wird nur die Gewichtskraft. Die Masse hängt nicht vom Ort ab: Der Stein hat auch auf der Erde 1,5 kg.",
               "Gleich bleibt nur die Masse. Ein Federkraftmesser misst die Gewichtskraft, und die ist auf der Erde wegen g = 9,81 N/kg viel größer.",
               "Je größer der Ortsfaktor, desto größer die Gewichtskraft: F_{G} = m · g. Auf der Erde zieht der Stein deshalb stärker am Federkraftmesser."],
       erklaerung: "Die Masse ist überall gleich: 1,5 kg auf dem Mond wie auf der Erde. Auf der Erde wäre F_{G} = 1,5 kg · 9,81 N/kg ≈ 14,7 N – rund sechsmal so viel wie die 2,4 N auf dem Mond. Das passt."}},
    // 4: Umrechnen kN → N und Umstellen, entgegengesetzte Kräfte
    {titel: "Tauziehen beim Sportfest", text: "Beim Tauziehen zieht die linke Mannschaft mit einer Kraft von 1,2 kN am Seil. Die resultierende Kraft auf das Seil beträgt 150 N und zeigt nach links. Mit welcher Kraft zieht die rechte Mannschaft?",
     gegeben: [{g: "F_{1}", wert: 1.2, einheit: "kN", name: "Zugkraft der linken Mannschaft", si: {wert: 1200, einheit: "N"}}, {g: "F_{res}", wert: 150, einheit: "N", name: "resultierende Kraft"}],
     gesucht: {g: "F_{2}", einheit: "N", name: "Zugkraft der rechten Mannschaft"},
     formel: "F_{res} = F_{1} − F_{2}", formelAblenker: [{f: "F_{res} = F_{1} + F_{2}", warum: "Addieren darfst du nur Kräfte in **gleicher** Richtung. Beim Tauziehen ziehen die Mannschaften entgegengesetzt – also wird subtrahiert."},
                                                         {f: "F_{res} = (F_{1} + F_{2}) : 2", warum: "Einen Mittelwert bildet man bei Kräften nicht. Entgegengesetzte Kräfte heben sich teilweise auf: F_{res} ist der **Unterschied** der beiden Beträge."}],
     umgestellt: "F_{2} = F_{1} − F_{res}",
     umstellAblenker: [{f: "F_{2} = F_{1} + F_{res}", warum: "Dann wäre die rechte Mannschaft stärker als die linke, und die Resultierende würde nach rechts zeigen. Sie zeigt aber nach links – F_{2} ist also kleiner als F_{1}."},
                       {f: "F_{2} = F_{res} − F_{1}", warum: "Das Vorzeichen ist vertauscht: 150 N − 1200 N ergäbe eine negative Kraft. Aus F_{res} = F_{1} − F_{2} folgt F_{2} = F_{1} − F_{res}."}],
     umstellWeg: "F_{res} = F_{1} − F_{2}  | + F_{2}  →  F_{res} + F_{2} = F_{1}  | − F_{res}  →  F_{2} = F_{1} − F_{res}",
     einsetzen: "F_{2} = 1200 N − 150 N", ergebnis: {wert: 1050, einheit: "N", toleranz: 1},
     tipps: ["Rechne zuerst um: 1 kN = 1000 N, also 1,2 kN = 1200 N. Stelle dann F_{res} = F_{1} − F_{2} nach F_{2} um.", "F_{2} = F_{1} − F_{res} = 1200 N − 150 N", "Rechne 1200 − 100 − 50 = …"],
     loesung: "F_{1} = 1,2 kN = 1200 N;  F_{2} = F_{1} − F_{res} = 1200 N − 150 N = 1050 N",
     antwort: "Die rechte Mannschaft zieht mit einer Kraft von 1050 N am Seil.", antwortAnfang: "Die rechte Mannschaft …", einheitAuch: ["Newton", "kN"]}
  ],
  umstellen: [
    {formel: "F_{G} = m · g", loesung: "m = F_{G} : g", text: "Gewichtskraft = Masse · Ortsfaktor. Gesucht ist die Masse – zum Beispiel, wenn ein Federkraftmesser die Gewichtskraft anzeigt.",
     typisch: [{f: "m = F_{G} · g", warum: "g ist mit m malgenommen. Um m allein zu bekommen, musst du durch g **teilen** – nicht noch einmal malnehmen."},
               {f: "m = g : F_{G}", warum: "Das ist der Kehrwert. Probe: F_{G} = 98,1 N und g = 9,81 N/kg müssen m = 10 kg ergeben, nicht 0,1 kg."}],
     weg: "F_{G} = m · g  | : g  →  F_{G} : g = m  →  m = F_{G} : g", tipps: ["Was steht neben m? Mache das Malnehmen mit g auf beiden Seiten rückgängig.", "Probe mit Zahlen: F_{G} = 98,1 N und g = 9,81 N/kg müssen m = 10 kg ergeben."]},
    {formel: "F_{G} = m · g", loesung: "g = F_{G} : m", text: "Auf einem fremden Planeten misst du die Gewichtskraft eines Wägestücks, dessen Masse du kennst. Gesucht ist der Ortsfaktor.",
     typisch: [{f: "g = m : F_{G}", warum: "Zähler und Nenner sind vertauscht. Der Ortsfaktor gibt an, wie viel Newton auf **jedes Kilogramm** kommen – also Newton geteilt durch Kilogramm: F_{G} : m."},
               {f: "g = F_{G} · m", warum: "m ist mit g malgenommen – zum Umstellen teilst du durch m. Probe: F_{G} = 13,5 N und m = 3 kg müssen g = 4,5 N/kg ergeben."}],
     weg: "F_{G} = m · g  | : m  →  F_{G} : m = g  →  g = F_{G} : m", tipps: ["Teile beide Seiten durch m.", "Die Einheit hilft: N/kg heißt Newton geteilt durch Kilogramm."]},
    {formel: "F_{res} = F_{1} − F_{2}", loesung: "F_{1} = F_{res} + F_{2}",
     text: "Zwei entgegengesetzte Kräfte: F_{1} ist die größere, F_{2} die kleinere, F_{res} ihre Resultierende. Gesucht ist F_{1}, wenn du F_{res} und F_{2} kennst.",
     typisch: [{f: "F_{1} = F_{res} − F_{2}", warum: "F_{2} wird auf der rechten Seite abgezogen. Um es wegzubekommen, addierst du es auf beiden Seiten – aus Minus wird Plus."},
               {f: "F_{1} = F_{2} − F_{res}", warum: "F_{1} ist die größere Kraft. So käme aber ein Wert heraus, der kleiner als F_{2} ist. Richtig: F_{1} = F_{res} + F_{2}."}],
     weg: "F_{res} = F_{1} − F_{2}  | + F_{2}  →  F_{res} + F_{2} = F_{1}  →  F_{1} = F_{res} + F_{2}", tipps: ["F_{2} wird abgezogen – addiere es auf beiden Seiten.", "Probe: F_{res} = 60 N und F_{2} = 270 N müssen F_{1} = 330 N ergeben."]}
  ],
  fehlersuche: [
    // Masse nicht in kg umgerechnet (150 g als 150 kg eingesetzt)
    {titel: "Der Apfel", aufgabe: "Ein Apfel hat die Masse 150 g. Berechne seine Gewichtskraft auf der Erde (g = 9,81 N/kg).",
     zeilen: ["Gegeben: m = 150 g; g = 9,81 N/kg", "Gesucht: F_{G}", "F_{G} = m · g", "F_{G} = 150 kg · 9,81 N/kg", "F_{G} ≈ 1472 N"], falsch: 3,
     zeilenOk: ["Die Angaben stimmen: 150 g und 9,81 N/kg stehen so in der Aufgabe.", "Gesucht ist die Gewichtskraft – richtig.", "Die Formel F_{G} = m · g stimmt."],
     optionen: ["Die Masse wurde nicht umgerechnet, sondern einfach in kg eingesetzt: 150 g sind 0,15 kg, nicht 150 kg.", "Die Formel ist falsch: Es gilt F_{G} = m : g.",
                "Auf der Erde muss man mit g = 1,6 N/kg rechnen.", "Die Gewichtskraft gibt man in Gramm an, nicht in Newton."], richtig: 0,
     warum: [null, "F_{G} = m · g stimmt – Zeile 3 ist richtig: Mehr Masse bedeutet mehr Gewichtskraft. Der Fehler steckt in der eingesetzten Masse.",
             "Etwa 1,6 N/kg beträgt der Ortsfaktor auf dem Mond. Auf der Erde sind 9,81 N/kg richtig – dieser Wert in Zeile 4 stimmt.",
             "Gramm ist eine Einheit der Masse. Die Gewichtskraft ist eine Kraft und hat die Einheit Newton – das Problem ist, dass aus 150 g beim Einsetzen 150 kg wurden."],
     korrektur: {frage: "Wie groß ist die Gewichtskraft des Apfels richtig?", wert: 1.4715, einheit: "N", toleranz: .04,
       tipps: ["Rechne zuerst um: 1 kg = 1000 g, also 150 g = 0,15 kg.", "F_{G} = 0,15 kg · 9,81 N/kg = …"], loesung: "m = 150 g = 0,15 kg;  F_{G} = m · g = 0,15 kg · 9,81 N/kg ≈ 1,47 N ≈ 1,5 N"},
     erklaerung: "Der Ortsfaktor g = 9,81 N/kg gilt **pro Kilogramm**: Rechne die Masse vorher in kg um – 150 g sind 0,15 kg, nicht 150 kg. Die Probe hätte den Fehler verraten: 1472 N wäre die Gewichtskraft eines Körpers mit 150 kg, so schwer ist kein Apfel."},
    // falsch umgestellt (malgenommen statt geteilt)
    {titel: "Der Rucksack auf dem Mond", aufgabe: "Auf dem Mond (g = 1,6 N/kg) zeigt ein Federkraftmesser für einen Rucksack 5,6 N an. Berechne die Masse des Rucksacks.",
     zeilen: ["Gegeben: F_{G} = 5,6 N; g = 1,6 N/kg", "Gesucht: m", "m = F_{G} · g", "m = 5,6 N · 1,6 N/kg", "m ≈ 9,0 kg"], falsch: 2,
     zeilenOk: ["Die Angaben stimmen: 5,6 N zeigt der Federkraftmesser, 1,6 N/kg ist der Ortsfaktor des Mondes.", "Gesucht ist die Masse – richtig."],
     optionen: ["Gegeben und Gesucht sind vertauscht.", "Auf dem Mond muss man mit g = 9,81 N/kg rechnen.",
                "Falsch umgestellt: Aus F_{G} = m · g folgt m = F_{G} : g – man muss durch g teilen.", "Die Masse muss man in Newton angeben."], richtig: 2,
     warum: ["Gegeben und Gesucht stimmen: Der Federkraftmesser liefert F_{G}, g steht in der Aufgabe, gesucht ist m.",
             "9,81 N/kg gilt auf der Erde. Auf dem Mond sind 1,6 N/kg richtig – die Werte in Zeile 1 stimmen.",
             null,
             "Die Masse hat die Einheit kg, nicht N – daran liegt es nicht. Der Fehler steckt schon früher, in der Formel in Zeile 3."],
     korrektur: {frage: "Wie groß ist die Masse des Rucksacks richtig?", wert: 3.5, einheit: "kg", toleranz: .05,
       tipps: ["m = F_{G} : g", "m = 5,6 N : 1,6 N/kg = …"], loesung: "m = F_{G} : g = 5,6 N : 1,6 N/kg = 3,5 kg"},
     erklaerung: "Ist m mit g malgenommen, teilst du beim Umstellen durch g. Die Einheitenprobe verrät den Fehler: N · N/kg ergibt kein kg – N : N/kg dagegen schon. Zur Probe: 3,5 kg · 1,6 N/kg = 5,6 N, das zeigt der Federkraftmesser."},
    // entgegengesetzte Kräfte addiert (Richtung übersehen)
    {titel: "Die Kiste am Kran", aufgabe: "Ein Kran hebt eine Kiste der Masse 200 kg. Das Seil zieht mit 2500 N senkrecht nach oben. Berechne die resultierende Kraft auf die Kiste (g = 9,81 N/kg).",
     zeilen: ["Gegeben: m = 200 kg; g = 9,81 N/kg; F_{S} = 2500 N nach oben", "Gesucht: F_{res}", "F_{G} = m · g = 200 kg · 9,81 N/kg = 1962 N", "F_{G} zeigt nach unten, F_{S} nach oben.", "F_{res} = F_{S} + F_{G} = 2500 N + 1962 N = 4462 N nach oben"], falsch: 4,
     zeilenOk: ["Die Angaben stimmen.", "Gesucht ist die resultierende Kraft – richtig.", "Richtig gerechnet: F_{G} = 200 kg · 9,81 N/kg = 1962 N.", "Richtig erkannt: Die Gewichtskraft zeigt nach unten, die Seilkraft nach oben."],
     optionen: ["Die Gewichtskraft ist falsch berechnet: Es gilt F_{G} = m : g.", "Seilkraft und Gewichtskraft sind entgegengesetzt gerichtet – sie müssen subtrahiert werden: F_{res} = F_{S} − F_{G}.",
                "Die resultierende Kraft muss 0 N sein, weil die Kiste am Seil hängt.", "Kilogramm und Newton passen nicht zusammen – man darf hier gar nicht rechnen."], richtig: 1,
     warum: ["Zeile 3 stimmt: F_{G} = m · g = 1962 N. Der Fehler passiert erst, als die beiden Kräfte zusammengefasst werden.",
             null,
             "Kräftegleichgewicht gibt es nur, wenn beide Kräfte gleich groß sind. Hier zieht das Seil mit 2500 N stärker, als die Gewichtskraft mit 1962 N nach unten zieht.",
             "In Zeile 5 stehen zwei Kräfte, beide in N – die Einheiten passen. Falsch ist das Rechenzeichen, denn die Kräfte zeigen in entgegengesetzte Richtungen."],
     korrektur: {frage: "Wie groß ist die resultierende Kraft auf die Kiste richtig?", wert: 538, einheit: "N", toleranz: 2,
       tipps: ["Entgegengesetzte Kräfte subtrahierst du: F_{res} = F_{S} − F_{G}.", "F_{res} = 2500 N − 1962 N = …"],
       loesung: "F_{res} = F_{S} − F_{G} = 2500 N − 1962 N = 538 N, nach oben (in Richtung der größeren Kraft, der Seilkraft)"},
     erklaerung: "Zeigen zwei Kräfte entgegengesetzt, ziehst du den kleineren Betrag vom größeren ab. F_{res} zeigt in Richtung der größeren Kraft – hier nach oben. Addiert wird nur bei **gleicher** Richtung."}
  ],
  // Rückmeldung je falscher Antwort (Reihenfolge wie options in inhalt/kraft1.json, null an der richtigen Antwort)
  warum: {
    0: [null, "Die Masse ist eine Eigenschaft des Körpers, keine Wirkung einer Kraft. Eine Kraft erkennst du erst daran, dass sich am Körper etwas verändert.",
        "Um sich gleich schnell geradeaus weiterzubewegen, braucht ein Körper keine (resultierende) Kraft. Eine Kraft zeigt sich erst, wenn sich Tempo oder Richtung ändern.",
        "Die Höhe verrät keine Kraft: Ein Buch auf einem hohen Regal bleibt genauso unverformt und in Ruhe wie eines auf dem Boden. Erkennen kannst du eine Kraft an ihrer Wirkung, nicht am Ort."],
    1: [null, "Masse und Geschwindigkeit beschreiben den Körper und seine Bewegung, nicht die Kraft. Zum Betrag gehören noch Richtung und Angriffspunkt.",
        "Wie lange eine Kraft wirkt, gehört nicht zur Kraft selbst, und die Masse beschreibt den Körper. Es fehlen Betrag und Angriffspunkt.",
        "Volumen und Ortsfaktor beschreiben den Körper bzw. den Ort, nicht die Kraft. Neben dem Angriffspunkt brauchst du Betrag und Richtung."],
    2: [null, "Zwei Pfeile können gleich lang sein und trotzdem in ganz verschiedene Richtungen zeigen. Die Richtung steckt in der Lage des Pfeils, nicht in seiner Länge.",
        "Der Angriffspunkt ist ein einzelner Punkt – der Anfang des Pfeils. Eine Länge kann keinen Punkt angeben.",
        "Ein Kraftpfeil stellt eine Kraft dar, keine Masse. Seine Länge steht für einen Betrag in Newton – nach dem gewählten Maßstab."],
    4: [null, "Die Balkenwaage vergleicht einen Körper mit Wägestücken und liefert deshalb die **Masse** in kg – auf dem Mond dasselbe Ergebnis wie auf der Erde.",
        "Mit dem Messzylinder bestimmst du ein Volumen (in ml), keine Kraft.",
        "Ein Thermometer misst die Temperatur. Für eine Kraft brauchst du ein Gerät, das sich durch die Kraft verformt – wie die Feder im Federkraftmesser."],
    6: [null, "Nach oben zieht vielleicht ein Faden oder deine Hand – das ist eine andere Kraft. Die Erde zieht Körper an sich heran: Ein losgelassener Ball fällt nach unten.",
        "Ein hochgeworfener Ball fliegt nach oben und wird trotzdem nach unten gezogen – deshalb wird er langsamer und kehrt um. Die Gewichtskraft hängt nicht von der Bewegungsrichtung ab.",
        "Mit dem Nordpol hat die Gewichtskraft nichts zu tun – daran denkst du vielleicht wegen des Kompasses. Sie zeigt überall auf der Erde zum Erdmittelpunkt."],
    7: [null, "Zeigen beide in dieselbe Richtung, verstärken sie sich: F_{res} ist doppelt so groß wie jede einzelne Kraft. Für ein Gleichgewicht müssen sie entgegengesetzt wirken.",
        "Sind die Kräfte verschieden groß, bleibt ein Rest übrig: F_{res} ist ihr Unterschied und zeigt in Richtung der größeren Kraft – das ist kein Gleichgewicht.",
        "In dieselbe Richtung addieren sich die Kräfte; F_{res} ist dann sogar größer als jede einzelne. Für ein Gleichgewicht müssten sie sich gegenseitig aufheben."],
    9: [null, "Kräftegleichgewicht ist keine Konstruktion, sondern ein Zustand: Die resultierende Kraft ist null. Gesucht ist ein Weg, zwei Pfeile zu einem zusammenzufassen.",
        "Ein t-s-Diagramm zeigt, wie sich der Ort eines Körpers mit der Zeit ändert. Mit ihm fasst man keine Kräfte zusammen.",
        "Ein Geschwindigkeitspfeil stellt eine Geschwindigkeit dar, keine Kraft. Hier sollen zwei Kraftpfeile zu einem zusammengefasst werden."],
    10: [null, "Am Aufhängepunkt hält der Faden den Körper. Die Erde zieht aber an allen Teilen des Körpers gleichzeitig, nicht nur dort, wo der Faden befestigt ist.",
         "An der Unterlage greift die Kraft an, mit der der Tisch den Körper stützt. Die Gewichtskraft wirkt auch ganz ohne Unterlage – zum Beispiel beim Fallen.",
         "Die höchste Stelle ist für die Gewichtskraft kein besonderer Punkt. Zusammengefasst greift sie im Schwerpunkt an – bei gleichmäßig gebauten Körpern in der Mitte."],
    11: [null, "Im Koffer ist auf dem Mond genauso viel Werkzeug wie auf der Erde – die Masse ändert sich durch den Ortswechsel nicht. Kleiner wird nur, wie stark er angezogen wird.",
         "Genau umgekehrt: Die Masse bleibt gleich, und die Gewichtskraft ändert sich, weil der Mond schwächer anzieht als die Erde.",
         "Die Masse bleibt zwar gleich, aber der Mond zieht viel schwächer an als die Erde. Deshalb ist die Gewichtskraft dort nur etwa ein Sechstel so groß."],
    12: [null, "Auch auf dem Mond haben die Wägestücke eine Gewichtskraft – sonst würde die Waage gar nicht ausschlagen und könnte nichts vergleichen.",
         "Die Masse eines Wägestücks ist überall gleich, auf dem Mond nimmt sie weder zu noch ab.",
         "Würde die Waage die Gewichtskraft messen, zeigte sie auf dem Mond weniger an. Sie vergleicht aber nur die beiden Seiten – deshalb liefert sie die Masse in kg."],
    13: [null, "Der Federkraftmesser misst die Gewichtskraft, und die hängt vom Ort ab. Gleich bleibt nur die Masse des Steins.",
         "36 N erhältst du, wenn du mit 6 malnimmst. Auf dem Mond ist die Gewichtskraft aber kleiner, nicht größer: Du musst durch 6 teilen.",
         "Auch der Mond zieht Körper an – nur schwächer als die Erde. Deshalb landen Astronauten wieder auf dem Boden, wenn sie hochspringen."],
    14: [null, "Addieren darfst du nur Kräfte in gleicher Richtung. Hier ziehen die beiden Kräfte gegeneinander, deshalb wird subtrahiert.",
         "Der Betrag 10 N stimmt, die Richtung nicht: 30 N ziehen nach rechts, nur 20 N nach links – die stärkere Kraft gibt die Richtung vor.",
         "Aufheben würden sich die Kräfte nur, wenn sie gleich groß wären. 30 N und 20 N sind verschieden – es bleiben 10 N übrig."],
    15: [null, "Ruhe heißt nicht „keine Kraft“: Die Erde zieht das Buch auch auf dem Tisch an. Ziehst du den Tisch weg, fällt es sofort.",
         "Wäre die Gewichtskraft größer, bliebe eine resultierende Kraft nach unten übrig, und das Buch würde sich nach unten in Bewegung setzen. Es ruht aber.",
         "Zeigten beide Kräfte nach unten, würden sie sich addieren und das Buch noch stärker nach unten drücken. Der Tisch stützt das Buch – seine Kraft zeigt nach oben."],
    16: [null, "Einfach addieren darf man die Beträge nur bei 0°, wenn beide Kräfte in dieselbe Richtung zeigen. Bei jedem größeren Winkel ist die Diagonale kürzer als 20 N.",
         "Das ist genau verkehrt herum: Bei 0° zeigen beide Kräfte in dieselbe Richtung und verstärken sich, bei 180° ziehen sie gegeneinander.",
         "10 N ist nur der Betrag einer der beiden Kräfte. Die Resultierende ändert sich mit dem Winkel – nur bei genau 120° ist sie zufällig auch 10 N."],
    17: [null, "Das Wort „wiegt“ verleitet zur Kraft, doch die Einheit kg gehört zur Masse. Ein Koffer mit einer Gewichtskraft von 20 N hätte nur etwa 2 kg.",
         "Der Ortsfaktor ist eine Eigenschaft des Ortes (Erde 9,81 N/kg), nicht des Koffers. Außerdem passt die Einheit kg nicht zu N/kg.",
         "Eine Gewichtskraft ist eine Kraft und wird in Newton angegeben – „20 kg“ kann deshalb keine Gewichtskraft sein. Kilogramm ist die Einheit der Masse."],
    18: [null, "Diese Strecke verbindet nur die beiden Pfeilspitzen und beginnt nicht im Angriffspunkt. Die gemeinsame Wirkung beider Kräfte geht aber von dem Punkt aus, an dem sie angreifen.",
         "Die Seiten des Parallelogramms sind die beiden Einzelkräfte selbst oder ihre Verschiebungen. Die Resultierende fasst beide zusammen – sie ist eine neue Strecke.",
         "Auch die kürzere Seite ist nur eine der beiden Einzelkräfte bzw. ihre Verschiebung. Die Resultierende entsteht erst aus beiden zusammen."],
    19: [null, "Nach unten zieht schon die Gewichtskraft. Zeigte die Kraft des Kabels auch nach unten, würden sich beide addieren, und die Lampe würde herunterfallen.",
         "30 N wären doppelt so viel wie die Gewichtskraft – dann bliebe eine resultierende Kraft von 15 N nach oben, und die Lampe würde nach oben gezogen.",
         "Die Lampe ruht, weil sich zwei Kräfte aufheben – nicht, weil keine wirkt. Ohne die Kraft des Kabels würde die Gewichtskraft sie nach unten ziehen."],
    20: [null, "Ein kleinerer Ortsfaktor würde eine kleinere Gewichtskraft bewirken – wie auf dem Mond. Hier ist die Gewichtskraft aber größer als auf der Erde.",
         "Die Masse hängt nicht vom Ort ab: Durch die Reise zu einem anderen Planeten nimmt ein Körper keine Masse zu. Größer wird nur, wie stark er angezogen wird.",
         "Die Masse bleibt beim Ortswechsel gleich. Außerdem würde eine kleinere Masse die Gewichtskraft verkleinern, nicht vergrößern."],
    21: [null, "Gleich bleibt nur der Ortsfaktor g, weil sich der Ort nicht ändert. Die Gewichtskraft hängt aber auch von der Masse ab: F_{G} = m · g.",
         "Neunfach wäre sie nur, wenn die Masse zweimal als Faktor vorkäme (3 · 3). In F_{G} = m · g steht m aber nur einmal.",
         "Mehr Masse bedeutet mehr Gewichtskraft, nicht weniger: Drei gleiche Pakete sind schwerer zu halten als eines."],
    22: [null, "Das ist verkehrt herum: Im gleichen Maßstab gehört der längere Pfeil zur größeren Kraft.",
         "Die Pfeillänge hat mit der Zeit nichts zu tun. Ein Kraftpfeil zeigt nur Betrag, Richtung und Angriffspunkt einer Kraft.",
         "Über die Masse des Körpers sagt ein Kraftpfeil nichts. Beide Kräfte könnten sogar am selben Körper angreifen."],
    27: [null, "60 N + 80 N = 140 N wäre richtig, wenn beide Kräfte nach Osten zeigten. Osten und Norden stehen aber senkrecht zueinander – die Diagonale ist kürzer als die Summe.",
         "20 N ist der Unterschied 80 N − 60 N. Subtrahieren darfst du nur bei entgegengesetzten Kräften – hier stehen sie senkrecht aufeinander.",
         "70 N ist der Mittelwert von 60 N und 80 N. Den Betrag der Resultierenden liefert aber die gemessene Diagonale, umgerechnet mit dem Maßstab."],
    29: [null, "4,0 ist nur der Zahlenwert der Masse in kg. Die Gewichtskraft erhältst du erst, wenn du mit dem Ortsfaktor malnimmst – hier mit dem gerundeten Wert g ≈ 10 N/kg.",
         "Nach unten zieht die Gewichtskraft. Der Haken hält den Rucksack und zieht deshalb nach oben – sonst würde der Rucksack fallen.",
         "0,4 N entsteht, wenn man durch 10 teilt, statt malzunehmen. Es gilt F_{G} = m · g: Masse **mal** Ortsfaktor."]
  },
  spick: {
    kern: ["Eine Kraft erkennst du an ihrer Wirkung: Sie **verformt** einen Körper oder ändert seine **Geschwindigkeit** (Betrag oder Richtung). Einheit: **1 Newton (1 N)**.",
           "**Kraftpfeil**: beginnt im **Angriffspunkt**, zeigt in **Richtung** der Kraft, seine **Länge** gibt den **Betrag** an (Maßstab, z. B. 1 cm ≙ 10 N).",
           "Gewichtskraft **F_{G} = m · g**: senkrecht nach unten (zum Erdmittelpunkt), Angriffspunkt im **Schwerpunkt**; Ortsfaktor Erde **g = 9,81 N/kg** (≈ 10 N/kg), Mond ≈ 1,6 N/kg.",
           "**Masse** (kg, Balkenwaage) ist überall gleich – die **Gewichtskraft** (N, Federkraftmesser) hängt vom Ort ab.",
           "Kräfte in gleicher Richtung **addieren**, entgegengesetzt **subtrahieren**; **Kräftegleichgewicht**: gleich groß, entgegengesetzt, F_{res} = 0 N.",
           "Verschiedene Richtungen: **Kräfteparallelogramm** – die Diagonale vom Angriffspunkt aus ist die resultierende Kraft F_{res}."],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn den Unterschied zwischen Masse und Gewichtskraft – und wie du die Gewichtskraft eines Körpers als Kraftpfeil zeichnest.",
       begriffe: [["Masse", "kg", "Kilogramm"], ["Gewichtskraft", "Newton"], ["Ortsfaktor", "N/kg", "9,81", "m · g", "m*g", "m mal g"], ["ortsabhängig", "überall", "Mond", "vom Ort", "anderen Ort", "Planet"],
                  ["Schwerpunkt"], ["unten", "Erdmittelpunkt", "senkrecht"], ["Länge", "Maßstab", "langer Pfeil", "langen Pfeil"]],
       muster: "Die **Masse** eines Körpers gibt man in **Kilogramm (kg)** an und bestimmt sie mit der Balkenwaage. Sie ist **überall gleich** – auf der Erde wie auf dem Mond. Die **Gewichtskraft** ist eine Kraft, Einheit **Newton (N)**; man misst sie mit dem Federkraftmesser. Es gilt **F_{G} = m · g**, und der **Ortsfaktor** g hängt vom Ort ab (Erde 9,81 N/kg, **Mond** etwa 1,6 N/kg). Den Kraftpfeil zeichne ich vom **Schwerpunkt** aus **senkrecht nach unten**, seine **Länge** wähle ich nach dem **Maßstab**."},
      {frage: "Erkläre, wie du die resultierende Kraft bestimmst, wenn zwei Kräfte an einem Körper angreifen – in gleicher Richtung, in entgegengesetzter Richtung und in verschiedenen Richtungen.",
       begriffe: [["Resultierende", "resultierend", "Ersatzkraft", "Fres", "F_res"], ["addieren", "addier", "plus", "zusammenzähl", "Summe"], ["subtrahieren", "subtrahier", "minus", "abzieh", "Differenz"], ["entgegengesetzt", "Gegenrichtung", "gegeneinander"],
                  ["Gleichgewicht"], ["Parallelogramm", "parallel"], ["Diagonale"], ["Angriffspunkt", "gemeinsamen Punkt", "selben Punkt", "gleichen Punkt"]],
       muster: "Die **resultierende Kraft** F_{res} hat allein dieselbe Wirkung wie alle Einzelkräfte zusammen. Zeigen beide Kräfte in die gleiche **Richtung**, **addiere** ich die Beträge. Zeigen sie **entgegengesetzt**, **subtrahiere** ich: F_{res} zeigt in Richtung der größeren Kraft. Sind beide gleich groß und entgegengesetzt, ist F_{res} = 0 N – **Kräftegleichgewicht**. Wirken sie in verschiedene Richtungen, zeichne ich beide Pfeile vom gemeinsamen **Angriffspunkt** aus und ergänze sie zum **Kräfteparallelogramm**; die **Diagonale** vom Angriffspunkt aus ist F_{res}."}
    ]
  },
  zuordnung: {
    "Der Kraftpfeil": [1, 2, 22, 23],
    "Der Federkraftmesser": [0, 3, 4, 24],
    "Masse und Gewichtskraft an verschiedenen Orten": [5, 11, 13, 25, 28],
    "Die Balkenwaage": [12, 17],
    "Ortsfaktoren im Sonnensystem": [6, 20],
    "Tauziehen – Kräfte addieren und subtrahieren": [7, 8, 14, 26],
    "Das Kräfteparallelogramm": [9, 16, 18, 27],
    "Kräftegleichgewicht am Seil": [10, 15, 19, 21, 29]
  },
  hilfen: {
    5: ["Der Ortsfaktor g gibt an, wie groß die Gewichtskraft auf 1 kg Masse ist – Einheit N/kg.", "Ein Körper mit 1 kg hat auf der Erde eine Gewichtskraft von knapp 10 N. Zum Überschlagen nimmt man g ≈ 10 N/kg.",
        "Gefragt ist der genauere Wert mit zwei Nachkommastellen: g = 9,… N/kg (er steht auf der Tafel „Gewichtskraft und Masse“)."],
    23: ["Beim Maßstab 1 cm ≙ 5 N steht jeder Zentimeter Pfeillänge für 5 N.", "Der Pfeil ist 4,0 cm lang: F = 4,0 · 5 N", "Rechne 4,0 · 5 = … – die Einheit bleibt N."],
    24: ["Formel: F_{G} = m · g", "Einsetzen: F_{G} = 2,5 kg · 9,81 N/kg", "kg · N/kg = N. Rechne 2,5 · 9,81 = … und runde sinnvoll."],
    25: ["Aus F_{G} = m · g folgt m = F_{G} : g.", "Einsetzen: m = 8,0 N : 1,6 N/kg", "N : N/kg = kg. Rechne 8,0 : 1,6 = …"],
    26: ["Kräfte in gleicher Richtung addierst du – rechne zuerst jede Seite für sich.", "Links: 320 N + 210 N = 530 N, rechts: 260 N + 250 N = 510 N.", "Entgegengesetzte Kräfte subtrahierst du: F_{res} = 530 N − 510 N = … N"],
    28: ["Aus F_{G} = m · g folgt g = F_{G} : m.", "Einsetzen: g = 7,4 N : 2,0 kg", "Rechne 7,4 : 2,0 = … – die Einheit ist N : kg = N/kg."]
  }
});
})();
