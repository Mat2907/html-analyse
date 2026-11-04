/* ---------- 40_lern_beweg1.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum Bewegung 1 (Kap. 3.1–3.3: Geschwindigkeit, Geschwindigkeitspfeil, Zusatzgeschwindigkeit Δv)
   Türrätsel „Kugelschloss“ (v = Δs : Δt und v_nachher = v_vorher + Δv) · Suchbild „Mias Verkehrsplakat“ (mit Begründungen und Ablenkern) · Lernzettel
   Fehler → Exponat · Tipps zu Rechenaufgaben · Rückmeldung je falscher Antwort für alle Auswahlfragen
   Rechenwerkstatt (4 Rechenwege, 3 Umstellungen, 3 Fehlersuchen)
   (Das Labor „Videoanalyse“ sitzt am Exponat „Das t-s-Diagramm zeichnet mit“, der Diagramm-Trainer „Fahr nach Diagramm“ an der Rennbahn in 20_beweg1.js.)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;

/* ---------- kleine Zeichenhilfen ---------- */
const TAU = Math.PI * 2, FONT = "system-ui, sans-serif";
const de = (x, d = 1) => (+x).toFixed(d).replace(".", ",").replace("-", "−");
const dn = x => { const r = Math.round(x * 10) / 10; return Number.isInteger(r) ? String(r) : de(r); };   // 2 statt 2,0
const line = (g, pts, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]); };
// Text mit Tiefstellung („v_{vorher}“); verkleinert sich, bis er in maxW passt
function st(g, s, x, y, size, col, align = "left", weight = 600, maxW = 0){
  const parts = []; String(s).replace(/_\{([^}]*)\}|[^_]+|_/g, (m, sub) => { parts.push(sub != null ? [sub, 1] : [m, 0]); return m; });
  const width = sz => { let w = 0; for (const [t, b] of parts) { g.font = `${weight} ${b ? Math.round(sz * .66) : sz}px ${FONT}`; w += g.measureText(t).width; } return w; };
  let w = width(size); while (maxW && w > maxW && size > 12) { size -= 1; w = width(size); }
  let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x; g.fillStyle = col; g.textAlign = "left"; g.textBaseline = "middle";
  for (const [t, b] of parts) { g.font = `${weight} ${b ? Math.round(size * .66) : size}px ${FONT}`; g.fillText(t, cx, y + (b ? size * .28 : 0)); cx += g.measureText(t).width; }
  return w;
}
function arrow(g, x1, y1, x2, y2, w, col){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 2) return; const a = Math.atan2(y2 - y1, x2 - x1), hl = Math.min(L * .45, w * 3.4);
  g.strokeStyle = g.fillStyle = col; g.lineWidth = w; g.lineCap = "round"; g.setLineDash([]);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hl * .7, y2 - Math.sin(a) * hl * .7); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - .45) * hl, y2 - Math.sin(a - .45) * hl); g.lineTo(x2 - Math.cos(a + .45) * hl, y2 - Math.sin(a + .45) * hl); g.closePath(); g.fill();
}
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, TAU); g.fill(); }

/* ---------- Türrätsel: Das Kugelschloss ---------- */
// Richtungen von Δv (x nach Osten, y nach Norden)
const DIRS = [["↑ Norden", 0, 1], ["↗ Nordosten", 1, 1], ["→ Osten", 1, 0], ["↘ Südosten", 1, -1], ["↓ Süden", 0, -1], ["↙ Südwesten", -1, -1], ["← Westen", -1, 0], ["↖ Nordwesten", -1, 1]]
  .map(([n, x, y]) => { const l = Math.hypot(x, y); return [n, x / l, y / l]; });
// v_vorher = 6 m/s nach Westen · Schlüsselloch 12 m westlich, 5 m nördlich des Kick-Felds (13 m entfernt) · in 2 s erreichbar mit v_nachher = 6,5 m/s
const V0 = 6, VV = [-V0, 0], ZIEL = [-12, 5], DZ = Math.hypot(ZIEL[0], ZIEL[1]), VZ = DZ / 2;
const vnOf = v => { const [, dx, dy] = DIRS[v.dir]; return [VV[0] + v.b * dx, VV[1] + v.b * dy]; };
const COL = {vor: "#4d9bff", dv: "#ff5a48", nach: "#45d483"};
const raetsel = {
  titel: "Das Kugelschloss",
  text: "Die Tür hat ein **Kugelschloss**. Eine Kugel rollt mit **v_{vorher} = 6 m/s nach Westen** auf ein Kick-Feld zu. Dort bekommt sie eine **Zusatzgeschwindigkeit Δv**. Das Schlüsselloch liegt **13 m** vom Kick-Feld entfernt in Richtung der gestrichelten Linie und öffnet sich nur **genau 2 s nach dem Kick**. Wähle Richtung und Betrag von Δv.",
  regler: [{id: "dir", name: "Richtung von Δv", optionen: DIRS.map(d => d[0]), wert: 6},
           {id: "b", name: "Betrag von Δv", einheit: "m/s", min: 0, max: 6, schritt: .5, wert: 2}],
  zeichne(g, w, h, v, t, ok){
    g.fillStyle = "#10131a"; g.fillRect(0, 0, w, h);
    const [vx, vy] = vnOf(v), hit = Math.hypot(2 * vx - ZIEL[0], 2 * vy - ZIEL[1]) < .05;
    st(g, "Kugelschloss: Lageplan und Pfeilbild", w / 2, 28, 26, "#ffe9a8", "center", 700);
    line(g, [[454, 54], [454, 528]], "#2a3140", 3);
    /* ----- links: Lageplan von oben (1 m ≙ 28 px); die Kugel kommt von Osten (rechts) ----- */
    const M = 28, K = [404, 470], Z = [K[0] + ZIEL[0] * M, K[1] - ZIEL[1] * M];
    st(g, "Lageplan von oben", 24, 72, 22, "#9fb0c8", "left", 700);
    g.save(); g.beginPath(); g.rect(10, 52, 440, 480); g.clip();
    g.fillStyle = "#1a2030"; for (let x = K[0] % M; x < 450; x += M) for (let y = K[1] % M; y < 532; y += M) g.fillRect(x - 1.5, y - 1.5, 3, 3);   // Bodenraster (1 m), durch Kick-Feld und Schloss
    line(g, [[450, K[1]], K], "#5b6b85", 4, [10, 9]);                                                            // Anlauf von Osten
    line(g, [K, [K[0] + 1.1 * ZIEL[0] * M, K[1] - 1.1 * ZIEL[1] * M]], "rgba(255,233,168,.75)", 3, [12, 10]);    // Richtung zum Schlüsselloch
    { const L = Math.hypot(Z[0] - K[0], Z[1] - K[1]), nx = -(Z[1] - K[1]) / L, ny = (Z[0] - K[0]) / L;            // Beschriftung auf der Nordostseite der Linie
      st(g, `${dn(DZ)} m`, (K[0] + Z[0]) / 2 + nx * 30, (K[1] + Z[1]) / 2 + ny * 30, 24, "#ffe9a8", "center", 700); }
    // Kick-Feld
    const ph = t % 5.4, kick = ph >= 1 && ph < 1.35 ? 1 - (ph - 1) / .35 : 0;
    g.strokeStyle = "#ff8a5b"; g.lineWidth = 4; g.beginPath(); g.arc(K[0], K[1], 18 + 14 * kick, 0, TAU); g.stroke();
    if (kick) { g.fillStyle = `rgba(255,138,91,${.45 * kick})`; g.beginPath(); g.arc(K[0], K[1], 18 + 14 * kick, 0, TAU); g.fill(); }
    st(g, "Kick-Feld", K[0] - 26, K[1] + 36, 22, "#ffb08a", "right", 700);
    // Schloss
    const lockCol = ok ? "#5fd38d" : "#ff5a48";
    g.strokeStyle = lockCol; g.lineWidth = 4; g.beginPath(); g.arc(Z[0], Z[1], 30, 0, TAU); g.stroke();
    lockIcon(g, Z[0], Z[1] + 2, 34, ok, lockCol); st(g, ok ? "offen" : "Schloss", Z[0], Z[1] - 50, 22, lockCol, "center", 700);
    // Kugel: vor dem Kick mit v_vorher, danach 2 s lang mit v_nachher
    let bx, by, after = ph >= 1, tau = Math.min(Math.max(ph - 1, 0), 2);
    if (!after) { bx = K[0] - VV[0] * M * (1 - ph); by = K[1] + VV[1] * M * (1 - ph); }
    else { bx = K[0] + vx * M * tau; by = K[1] - vy * M * tau; line(g, [K, [bx, by]], "rgba(69,212,131,.55)", 3); }
    if (after && tau >= 2) {   // Ergebnis nach 2 s
      if (hit) { g.strokeStyle = "#5fd38d"; g.lineWidth = 5; g.beginPath(); g.arc(Z[0], Z[1], 38, 0, TAU); g.stroke(); }
      else if (bx > 24 && bx < 436 && by > 66 && by < 520) { line(g, [[bx - 12, by - 12], [bx + 12, by + 12]], "#ff5a48", 5); line(g, [[bx + 12, by - 12], [bx - 12, by + 12]], "#ff5a48", 5); }
      else {   // Kugel hat den Plan verlassen: roter Pfeil am Rand zeigt, wohin sie gerollt ist
        const L = Math.hypot(bx - K[0], by - K[1]) || 1, ux = (bx - K[0]) / L, uy = (by - K[1]) / L;
        const s = Math.min(ux > 1e-9 ? (436 - K[0]) / ux : ux < -1e-9 ? (24 - K[0]) / ux : 1e9, uy > 1e-9 ? (520 - K[1]) / uy : uy < -1e-9 ? (66 - K[1]) / uy : 1e9);
        const ex = K[0] + ux * s, ey = K[1] + uy * s; arrow(g, ex - ux * 40, ey - uy * 40, ex, ey, 6, "#ff5a48"); }
    }
    g.fillStyle = "#7fd8ff"; g.beginPath(); g.arc(bx, by, 10, 0, TAU); g.fill(); g.strokeStyle = "#10131a"; g.lineWidth = 2; g.stroke();
    if (!after) arrow(g, bx, by, bx + VV[0] * 12, by - VV[1] * 12, 4, COL.vor); else if (tau < 2) arrow(g, bx, by, bx + vx * 12, by - vy * 12, 4, COL.nach);
    g.restore();
    const clk = !after ? "Kugel rollt zum Kick-Feld" : tau < 2 ? `t = ${de(tau)} s nach dem Kick` : hit ? "nach 2 s: Treffer!" : "nach 2 s: daneben";
    st(g, clk, 24, 104, 22, after && tau >= 2 ? (hit ? "#5fd38d" : "#ff8a7a") : "#ffffff", "left", 700);
    /* ----- rechts: Pfeilbild (1 Kästchen ≙ 1 m/s); v_vorher zeigt nach links (Westen) ----- */
    const q = 26, O = [800, 300], P = (x, y) => [O[0] + x * q, O[1] - y * q];
    st(g, "Pfeilbild: 1 Kästchen ≙ 1 m/s", 676, 72, 22, "#9fb0c8", "center", 700);
    g.strokeStyle = "#232c3c"; g.lineWidth = 1.5;
    for (let k = -12; k <= 3; k++) { g.beginPath(); g.moveTo(O[0] + k * q, O[1] - 6 * q); g.lineTo(O[0] + k * q, O[1] + 6 * q); g.stroke(); }
    for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(O[0] - 12 * q, O[1] + k * q); g.lineTo(O[0] + 3 * q, O[1] + k * q); g.stroke(); }
    line(g, [O, P(ZIEL[0], ZIEL[1])], "rgba(255,233,168,.75)", 3, [12, 10]); st(g, "zum Schloss", P(ZIEL[0], 0)[0] - 14, P(0, 6)[1] - 22, 22, "#ffe9a8", "left", 700);
    const T0 = P(VV[0], VV[1]), E = P(vx, vy), dot = (a, b2, c) => { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(a, b2, c, 0, TAU); g.fill(); };
    // Beschriftung neben einem Pfeil – auf der Seite, die vom Punkt „weg“ abgewandt ist
    const lab = (s, A, B, weg, col) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      let nx = uy, ny = -ux; if (nx * (weg[0] - mx) + ny * (weg[1] - my) > 0) { nx = -nx; ny = -ny; }
      st(g, s, mx + nx * 26, my + ny * 26, 24, col, nx > .35 ? "left" : nx < -.35 ? "right" : "center", 700); };
    if (Math.abs(vy) < 1e-6) {   // alle Pfeile auf einer Linie: zur Deutlichkeit übereinander versetzt zeichnen
      arrow(g, O[0], O[1], T0[0], T0[1], 7, COL.vor);
      if (-vx >= V0) st(g, "v_{vorher}", O[0] + 12, O[1], 24, COL.vor, "left", 700); else st(g, "v_{vorher}", T0[0] - 12, O[1], 24, COL.vor, "right", 700);
      if (v.b > 0) { line(g, [T0, [T0[0], T0[1] - 22]], "rgba(255,255,255,.5)", 2, [4, 4]); arrow(g, T0[0], T0[1] - 22, E[0], E[1] - 22, 6, COL.dv); st(g, "Δv", (T0[0] + E[0]) / 2, O[1] - 48, 24, COL.dv, "center", 700); }
      line(g, [O, [O[0], O[1] + 22]], "rgba(255,255,255,.5)", 2, [4, 4]);
      if (Math.abs(vx) > .01) arrow(g, O[0], O[1] + 22, E[0], E[1] + 22, 7, COL.nach);
      st(g, Math.abs(vx) > .01 ? "v_{nachher}" : "v_{nachher} = 0", Math.abs(vx) > .01 ? (O[0] + E[0]) / 2 : O[0], O[1] + 50, 24, COL.nach, "center", 700);
    } else {
      arrow(g, O[0], O[1], E[0], E[1], 7, COL.nach); arrow(g, O[0], O[1], T0[0], T0[1], 7, COL.vor);
      if (v.b > 0) arrow(g, T0[0], T0[1], E[0], E[1], 6, COL.dv);
      st(g, "v_{vorher}", (O[0] + T0[0]) / 2, O[1] + (E[1] > O[1] ? -30 : 30), 24, COL.vor, "center", 700);
      lab("v_{nachher}", O, E, T0, COL.nach); lab("Δv", T0, E, O, COL.dv);
    }
    dot(O[0], O[1], 5);
    if (ok) st(g, "🔓 Das Schloss ist offen!", 676, 512, 24, "#5fd38d", "center", 700);
  },
  pruefe(v){
    const [x, y] = vnOf(v), n = Math.hypot(x, y), miss = Math.hypot(2 * x - ZIEL[0], 2 * y - ZIEL[1]);
    if (miss < 1e-6) return {ok: true};
    // gerundete Werte mit „≈“ bzw. „etwa“ kennzeichnen (z. B. v_nachher ≈ 6,4 m/s statt „= 6,4 m/s“)
    const exact = x => Math.abs(Math.round(x * 10) / 10 - x) < 1e-9, eq = x => (exact(x) ? "= " : "≈ ") + dn(x), etwa = x => exact(x) ? "" : "etwa ";
    const vorbei = ` Nach 2 s ist die Kugel ${etwa(miss)}${dn(miss)} m vom Schlüsselloch entfernt.`, b = dn(v.b);
    // Richtung von v_nachher (Winkel nördlich der Westrichtung) im Vergleich zur Richtung zum Schloss, Betrag im Vergleich zu 13 m : 2 s
    const el = Math.atan2(y, -x) * 180 / Math.PI, el0 = Math.atan2(ZIEL[1], -ZIEL[0]) * 180 / Math.PI, fast = Math.abs(el - el0) < 1.5;
    const rText = fast ? "v_{nachher} zeigt zwar fast genau zum Schloss" : el > el0 ? "v_{nachher} zeigt zu steil, nördlich am Schloss vorbei" : "v_{nachher} zeigt zu flach, südlich am Schloss vorbei";
    const tText = Math.abs(n - VZ) < 1e-9 ? "" : `mit ${exact(n) ? "" : "≈ "}${dn(n)} m/s ist die Kugel zu ${n < VZ ? "langsam – in 2 s rollt sie nur" : "schnell – in 2 s rollt sie"} ${etwa(n)}${dn(2 * Math.round(n * 10) / 10)} m weit, das Schloss ist ${n < VZ ? "" : "nur "}${dn(DZ)} m entfernt`;
    const lage = rText + (tText ? (fast ? ", aber " : ", und ") + tText : "") + ".";
    if (v.b === 0) return {ok: false, text: "Ohne Zusatzgeschwindigkeit bleibt **v_{nachher} = v_{vorher}**: Die Kugel rollt mit 6 m/s geradeaus nach Westen weiter – südlich am Schloss vorbei. Sie braucht ein Δv."};
    if (v.dir === 6) return {ok: false, text: `Δv zeigt in die **Bewegungsrichtung**. Dann wird der Pfeil nur länger: v_{nachher} = 6 m/s + ${b} m/s = ${dn(n)} m/s, weiterhin nach Westen. Die Kugel wird schneller, ändert aber ihre **Richtung** nicht.${vorbei}`};
    if (v.dir === 2) return {ok: false, text: `Δv zeigt **entgegen** der Bewegungsrichtung: ${v.b < V0 ? `Die Kugel wird nur langsamer (v_{nachher} = ${dn(n)} m/s nach Westen).` : v.b === V0 ? "Die Kugel bleibt stehen (v_{nachher} = 0)." : `Die Kugel rollt danach mit ${dn(n)} m/s zurück nach Osten.`} Sie bleibt auf der Ost-West-Linie und kommt nie zum Schloss, das nördlich ihrer Bahn liegt – dafür braucht Δv einen Anteil nach **Norden**.${vorbei}`};
    if (v.dir >= 3 && v.dir <= 5) return {ok: false, text: `Δv hat einen Anteil nach **Süden**. Hängst du den Pfeil an die Spitze von v_{vorher}, bekommt auch v_{nachher} einen Anteil nach Süden (im Pfeilbild nach unten): Die Kugel weicht nach Süden ab – auf die falsche Seite, denn das Schloss liegt nördlich ihrer Bahn.${vorbei}`};
    if (v.dir === 7) return {ok: false, text: `Δv zeigt schräg nach Nordwesten, also ungefähr zum Schloss. Aber **Δv ist nicht der Pfeil zum Ziel!** Δv wird an die **Spitze von v_{vorher}** gehängt; v_{nachher} reicht vom Anfang von v_{vorher} bis zur Spitze von Δv. ${lage}${vorbei}`};
    if (v.dir === 1) return {ok: false, text: `Mit Δv nach Nordosten wird die Kugel zugleich gebremst und nach Norden gelenkt. ${lage} Im Pfeilbild muss v_{nachher} auf der gestrichelten Linie liegen und so lang sein, wie es der Weg in 2 s verlangt.${vorbei}`};
    return {ok: false, text: `Die Richtung von Δv stimmt: nach **Norden**, quer zu v_{vorher}. Aber Δv = ${b} m/s ist zu **${n < VZ ? "klein" : "groß"}**: v_{nachher} ${eq(n)} m/s ist zu ${n < VZ ? "langsam und zeigt zu flach – südlich" : "schnell und zeigt zu steil – nördlich"} am Schloss vorbei.${vorbei}`};
  },
  tipps: ["Wie schnell muss die Kugel nach dem Kick sein, damit sie die 13 m in genau 2 s schafft? Rechne v_{nachher} = Δs : Δt.",
          "v_{nachher} = 13 m : 2 s = 6,5 m/s. Zeichne diesen Pfeil im Pfeilbild vom Anfang von v_{vorher} aus entlang der gestrichelten Linie: 6,5 Kästchen lang, also genau bis zur Hälfte der Linie. Wo endet er?",
          "Δv führt von der **Spitze von v_{vorher}** zur **Spitze von v_{nachher}**. Zähle die Kästchen: In welche Richtung zeigt dieser Pfeil und wie lang ist er?"],
  loesung: {dir: 0, b: 2.5},
  erfolg: "**Δv = 2,5 m/s nach Norden**, an die Spitze von v_{vorher} gehängt: **v_{nachher} = 6,5 m/s** zeigt genau zum Schloss. In 2 s rollt die Kugel 6,5 m/s · 2 s = 13 m weit – mitten ins Schlüsselloch. Die Tür ist offen!"
};

/* ---------- Suchbild: Mias Verkehrsplakat (Luftbild der Straße vor der Schule) ---------- */
function fitText(g, s, x, y, size, maxW, col, align = "left", weight = 600){
  let sz = size; g.font = `${weight} ${sz}px ${FONT}`; while (g.measureText(s).width > maxW && sz > 12) { sz--; g.font = `${weight} ${sz}px ${FONT}`; }
  g.fillStyle = col; g.textAlign = align; g.textBaseline = "middle"; g.fillText(s, x, y); }
function labelBox(g, s, x, y, size = 22, col = "#1b1b1b", bg = "rgba(255,255,255,.9)"){
  g.font = `700 ${size}px ${FONT}`; const w = g.measureText(s).width + 16, hh = size + 10;
  g.fillStyle = bg; g.beginPath(); g.roundRect(x - w / 2, y - hh / 2, w, hh, 7); g.fill(); g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, x, y + 1); }
function onBody(g, s, x, y, size = 22){ g.font = `800 ${size}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 5; g.strokeStyle = "rgba(0,0,0,.65)"; g.lineJoin = "round";
  g.strokeText(s, x, y); g.fillStyle = "#ffffff"; g.fillText(s, x, y); }
// Auto von oben; dir = +1: Front rechts, −1: Front links
function carTop(g, x, y, len, wid, col, dir = 1, bus = false){
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.roundRect(-len / 2 + 4, -wid / 2 + 5, len, wid, 10); g.fill();
  g.fillStyle = col; g.beginPath(); g.roundRect(-len / 2, -wid / 2, len, wid, bus ? 8 : 12); g.fill(); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#24303c";
  if (bus) { g.beginPath(); g.roundRect(len / 2 - 22, -wid / 2 + 5, 16, wid - 10, 4); g.fill(); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(-len / 2 + 30, -wid / 2 + 8, 40, wid - 16); g.fillRect(-len / 2 + 80, -wid / 2 + 8, 30, wid - 16); }
  else { g.beginPath(); g.roundRect(len * .12, -wid / 2 + 5, len * .17, wid - 10, 5); g.fill(); g.beginPath(); g.roundRect(-len * .4, -wid / 2 + 6, len * .12, wid - 12, 4); g.fill(); }
  g.fillStyle = "#fff4b0"; g.fillRect(len / 2 - 5, -wid / 2 + 4, 5, 8); g.fillRect(len / 2 - 5, wid / 2 - 12, 5, 8);
  g.restore(); }
function tree(g, x, y, r){ g.fillStyle = "rgba(0,0,0,.15)"; g.beginPath(); g.arc(x + 5, y + 6, r, 0, TAU); g.fill(); g.fillStyle = "#5f9a4a"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.fillStyle = "#77b35c"; g.beginPath(); g.arc(x - r * .25, y - r * .25, r * .6, 0, TAU); g.fill(); }
function sign(g, x, y, r, num){ g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = "#d0261d"; g.lineWidth = r * .24; g.beginPath(); g.arc(x, y, r * .86, 0, TAU); g.stroke();
  g.fillStyle = "#111"; g.font = `800 ${Math.round(r * .9)}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(num, x, y + 2); }
function note(g, x, y, w, h, rot, lines, size){   // Mias gelber Klebezettel
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
  g.fillStyle = "#fff1a0"; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = "#f2dc6a"; g.fillRect(-w / 2, -h / 2, w, 8);
  lines.forEach((s, i) => fitText(g, s, 0, (i - (lines.length - 1) / 2) * size * 1.25 + 4, size, w - 16, "#1d3a8a", "center", 700)); g.restore(); }
function street(g, w, h){
  const C = [965, 385], AS = "#8b9097", WK = "#dcd6c8";
  g.fillStyle = "#cfe2b4"; g.fillRect(0, 0, w, h);
  let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) { g.fillStyle = rnd() < .5 ? "rgba(90,140,60,.18)" : "rgba(255,255,255,.18)"; g.fillRect(rnd() * w, rnd() * h, 4, 4); }
  // Straßen und Gehwege
  g.fillStyle = WK; g.fillRect(0, 278, 800, 22); g.fillRect(0, 470, 800, 24); g.fillRect(889, 0, 152, 210); g.fillRect(889, 560, 152, 240);
  g.beginPath(); g.arc(C[0], C[1], 206, 0, TAU); g.fill();
  g.fillStyle = AS; g.fillRect(0, 300, 800, 170); g.fillRect(905, 0, 120, 210); g.fillRect(905, 560, 120, 240); g.beginPath(); g.arc(C[0], C[1], 190, 0, TAU); g.fill();
  g.fillStyle = WK; g.beginPath(); g.arc(C[0], C[1], 86, 0, TAU); g.fill(); g.fillStyle = "#a9d08e"; g.beginPath(); g.arc(C[0], C[1], 78, 0, TAU); g.fill(); tree(g, C[0], C[1], 38);
  // Markierungen und Zebrastreifen
  g.fillStyle = "#f4f4f4"; for (let x = 10; x < 680; x += 60) g.fillRect(x, 382, 34, 6);
  for (let y = 306; y < 466; y += 26) g.fillRect(692, y, 56, 13);
  // Parkplatz und Sportplatz
  g.fillStyle = "#b9bcc0"; g.fillRect(630, 548, 240, 230); g.fillStyle = "#f4f4f4"; for (let x = 640; x <= 860; x += 55) g.fillRect(x, 552, 4, 86);
  g.fillStyle = "#c8664c"; g.beginPath(); g.roundRect(30, 540, 570, 250, 120); g.fill(); g.fillStyle = "#9fcf86"; g.beginPath(); g.roundRect(78, 584, 474, 162, 80); g.fill();
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 2; for (const k of [16, 32]) { g.beginPath(); g.roundRect(30 + k, 540 + k, 570 - 2 * k, 250 - 2 * k, 120 - k); g.stroke(); }
  tree(g, 830, 110, 32); tree(g, 812, 210, 24); tree(g, 1100, 210, 30); tree(g, 1150, 560, 26); tree(g, 860, 520, 22);
  // ---- Ablenker (richtig) ----
  // Geschwindigkeitsanzeige: misst die Momentangeschwindigkeit
  g.fillStyle = "#1e2328"; g.beginPath(); g.roundRect(486, 26, 270, 96, 12); g.fill(); g.fillStyle = "#3a4048"; g.fillRect(612, 122, 14, 20);
  fitText(g, "Ihre Geschwindigkeit", 621, 52, 22, 250, "#cfd6de", "center", 700); fitText(g, "28 km/h  Danke!", 621, 92, 32, 250, "#6dff8a", "center", 800);
  // rotes Auto 50 km/h mit passendem Pfeil (Maßstab: 30 px ≙ 10 km/h)
  carTop(g, 68, 427, 92, 44, "#c0392b", 1); onBody(g, "50 km/h", 64, 427, 20); arrow(g, 118, 427, 268, 427, 7, "#2f6fd6");
  // oberes Auto im Kreisverkehr: Δv zur Mitte (richtig)
  carTop(g, 965, 251, 84, 40, "#e07b39", -1); arrow(g, 921, 251, 861, 251, 7, "#2f6fd6"); arrow(g, 965, 273, 965, 322, 7, "#d63a2f");
  fitText(g, "Δv", 988, 306, 24, 60, "#b3261e", "left", 800); labelBox(g, "gleiches Tempo", 965, 190, 20);
  // Fußgängerin auf dem Zebrastreifen
  g.fillStyle = "#2d4f7c"; g.beginPath(); g.ellipse(720, 448, 15, 9, 0, 0, TAU); g.fill(); g.fillStyle = "#f0c9a0"; g.beginPath(); g.arc(720, 446, 7, 0, TAU); g.fill();
  arrow(g, 720, 438, 720, 422, 4, "#2f6fd6"); labelBox(g, "1,5 m/s = 5,4 km/h", 760, 512, 20);
  // Sportplatz: richtige Rechnung
  g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect(150, 606, 330, 118, 10); g.fill();
  fitText(g, "Lauftraining", 315, 630, 24, 310, "#1b1b1b", "center", 800); fitText(g, "350 m in 100 s", 315, 662, 22, 310, "#333", "center", 600);
  fitText(g, "v = 350 m : 100 s = 3,5 m/s", 315, 696, 24, 310, "#1d3a8a", "center", 700);
  g.fillStyle = "#e05a3a"; g.beginPath(); g.arc(540, 664, 9, 0, TAU); g.fill();
  // Parkplatz: parkendes Auto ohne Pfeil (v = 0)
  g.save(); g.translate(722, 596); g.rotate(-Math.PI / 2); carTop(g, 0, 0, 84, 44, "#5d6d7e", 1); g.restore(); labelBox(g, "parkt: v = 0", 760, 668, 20);
  // Tempo-30-Zone mit richtiger Notiz
  sign(g, 1110, 640, 34, "30"); note(g, 1052, 682, 132, 74, .04, ["30 km/h", "≈ 8,3 m/s"], 24);
  // Legende
  g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect(1048, 14, 146, 150, 10); g.fill();
  fitText(g, "Pfeil-Maßstab", 1121, 38, 22, 134, "#1b1b1b", "center", 800); arrow(g, 1060, 74, 1090, 74, 6, "#2f6fd6"); fitText(g, "10 km/h", 1098, 75, 22, 92, "#1b1b1b", "left", 700);
  fitText(g, "blau: v", 1121, 110, 22, 134, "#2f6fd6", "center", 800); fitText(g, "rot: Δv", 1121, 142, 22, 134, "#b3261e", "center", 800);
  // ---- Fehler ----
  // 1) Notiz am Tempo-50-Schild: 50 km/h = 50 m/s
  sign(g, 470, 232, 34, "50"); note(g, 516, 198, 272, 66, -.03, ["50 km/h = 50 m/s"], 32);
  // 2) Bus mit 30 km/h, Pfeil so lang wie bei 50 km/h
  carTop(g, 415, 342, 170, 52, "#f2b632", -1, true); onBody(g, "Bus 30 km/h", 425, 342, 22); arrow(g, 326, 342, 176, 342, 7, "#2f6fd6");
  // 3) bremsendes Auto: Δv zeigt nach vorn
  carTop(g, 426, 427, 92, 44, "#3c8d5a", 1); onBody(g, "40 km/h", 422, 427, 20); arrow(g, 476, 427, 596, 427, 7, "#2f6fd6"); arrow(g, 596, 427, 656, 427, 7, "#d63a2f");
  fitText(g, "Δv", 612, 402, 24, 60, "#b3261e", "left", 800); labelBox(g, "bremst", 426, 484, 20);
  // 4) unteres Auto im Kreisverkehr: Δv zeigt nach außen
  carTop(g, 965, 519, 84, 40, "#7d4cb0", 1); arrow(g, 1009, 519, 1069, 519, 7, "#2f6fd6"); arrow(g, 965, 541, 965, 590, 7, "#d63a2f");
  fitText(g, "Δv", 978, 584, 24, 60, "#b3261e", "left", 800); labelBox(g, "gleiches Tempo", 965, 626, 20);
  // 5) Schulweg-Rechnung ohne Wartezeit
  g.fillStyle = "rgba(255,255,255,.94)"; g.beginPath(); g.roundRect(20, 18, 436, 172, 12); g.fill(); g.strokeStyle = "#9aa6b2"; g.lineWidth = 2; g.stroke();
  fitText(g, "Mias Schulweg mit dem Rad", 38, 44, 26, 400, "#1b1b1b", "left", 800);
  fitText(g, "1200 m in insgesamt 600 s,", 38, 78, 24, 400, "#333", "left", 600); fitText(g, "davon 200 s Warten an Ampeln.", 38, 106, 24, 400, "#333", "left", 600);
  fitText(g, "Durchschnittsgeschwindigkeit:", 38, 138, 24, 400, "#333", "left", 600); fitText(g, "v = 1200 m : 400 s = 3 m/s", 38, 168, 26, 400, "#1d3a8a", "left", 800);
}
const suchbild = {
  titel: "Mias Verkehrsplakat",
  text: "Mia hat für ein Referat ein Luftbild der Straße vor ihrer Schule mit Geschwindigkeitspfeilen und Rechnungen beschriftet (Legende oben rechts). **Fünf Dinge** sind physikalisch falsch. Klicke sie an und begründe, was falsch ist.",
  ort: {x: -3.6, z: -9.5, ry: 0},
  zeichne: street,
  fehler: [
    {x: 652, y: 231, r: 110, name: "Mias Notiz am Tempo-50-Schild", frage: "Was stimmt an der Notiz nicht?",
     optionen: ["Nichts – km/h und m/s sind nur zwei Schreibweisen für dasselbe.", "50 km/h sind 50 · 3,6 = 180 m/s.", "Von km/h nach m/s teilt man durch 3,6: 50 km/h sind nur etwa 13,9 m/s.", "Auf Verkehrsschildern steht die Geschwindigkeit immer in m/s."], richtig: 2,
     warum: ["km/h und m/s sind verschiedene Einheiten: Ein Kilometer hat 1000 m, eine Stunde 3600 s. Deshalb ändert sich die Zahl beim Umrechnen.",
             "Die Richtung ist vertauscht: Mal 3,6 rechnest du von m/s nach km/h. In m/s muss die Zahl **kleiner** werden, denn 1 m/s ist schon 3,6 km/h.",
             null,
             "Verkehrsschilder zeigen km/h: Die 50 auf dem Schild bedeutet 50 km/h – und das sind eben nicht 50 m/s."],
     erklaerung: "Es gilt **1 m/s = 3,6 km/h**. Von km/h nach m/s teilst du durch 3,6: 50 km/h : 3,6 ≈ **13,9 m/s**. 50 m/s wären 180 km/h – viel zu schnell für die Stadt."},
    {x: 262, y: 340, r: 85, name: "Der Pfeil am Bus", frage: "Was ist am Geschwindigkeitspfeil des Busses falsch?",
     optionen: ["Er ist genauso lang wie der Pfeil des roten Autos mit 50 km/h. Bei 30 km/h muss er kürzer sein.", "Er müsste nach rechts zeigen, weil Pfeile immer nach rechts zeigen.", "Ein Bus ist schwerer als ein Auto, deshalb muss sein Pfeil länger sein.", "Hier ist alles richtig."], richtig: 0,
     warum: [null,
             "Der Pfeil zeigt in die Bewegungsrichtung – der Bus fährt nach links, also stimmt die Richtung. Falsch ist die **Länge**.",
             "Die Masse spielt für den Geschwindigkeitspfeil keine Rolle. Seine Länge hängt nur davon ab, wie schnell der Bus ist – und 30 km/h ist langsamer als 50 km/h.",
             "Vergleiche mit der Legende: 30 km/h sind 3 Pfeile zu je 10 km/h. Der Bus-Pfeil ist aber so lang wie 5 – also so lang wie der Pfeil des roten Autos mit 50 km/h."],
     erklaerung: "Die **Pfeillänge** gibt im Maßstab den **Betrag** der Geschwindigkeit an. Laut Legende steht der kurze Pfeil für 10 km/h: In den Pfeil des roten Autos (50 km/h) passt er 5-mal, in den Pfeil des Busses (30 km/h) dürfte er nur 3-mal passen. Die Richtung stimmt – der Bus fährt nach links."},
    {x: 576, y: 430, r: 80, name: "Das bremsende Auto", frage: "Was ist an den Pfeilen des bremsenden Autos falsch?",
     optionen: ["Ein bremsendes Auto hat gar keine Geschwindigkeit – der blaue Pfeil muss weg.", "Der blaue Pfeil müsste nach links zeigen.", "Δv müsste senkrecht zur Fahrbahn stehen.", "Δv zeigt nach vorn – damit würde das Auto schneller. Beim Bremsen zeigt Δv entgegen der Fahrtrichtung."], richtig: 3,
     warum: ["Beim Bremsen fährt das Auto noch – es wird nur langsamer. Erst wenn es steht, ist v = 0 und der blaue Pfeil verschwindet.",
             "Das grüne Auto fährt nach rechts (die Scheinwerfer sind vorn rechts) – der blaue Pfeil zeigt also richtig in Fahrtrichtung. Falsch ist die Richtung von Δv.",
             "Ein Δv quer zur Fahrbahn würde das Auto zur Seite lenken. Zum Bremsen auf gerader Straße muss Δv **entgegen** der Fahrtrichtung zeigen.",
             null],
     erklaerung: "Es gilt **v_{nachher} = v_{vorher} + Δv**. Zeigt Δv in Fahrtrichtung, wird der Pfeil länger – das Auto beschleunigt. Beim **Bremsen** zeigt Δv **entgegen der Fahrtrichtung**, und v_{nachher} wird kürzer."},
    {x: 965, y: 550, r: 72, name: "Δv im Kreisverkehr", frage: "Das Auto fährt mit gleichem Tempo durch den Kreisverkehr. Was ist am roten Pfeil falsch?",
     optionen: ["Bei gleichem Tempo gibt es in einer Kurve gar keine Zusatzgeschwindigkeit.", "Δv zeigt nach außen. Bei gleichem Tempo zeigt Δv zur Mitte des Kreisverkehrs – wie beim oberen Auto.", "Δv müsste in Fahrtrichtung zeigen.", "Nichts – in einer Kurve zeigt Δv immer nach außen."], richtig: 1,
     warum: ["Das Tempo bleibt gleich, aber die Richtung ändert sich – und auch dafür braucht es ein Δv. Nur bei Geradeausfahrt mit gleichem Tempo ist Δv = 0.",
             null,
             "Δv in Fahrtrichtung würde das Auto nur schneller machen. Laut Bild bleibt das Tempo aber gleich – nur die Richtung soll sich ändern.",
             "Dass man sich in der Kurve nach außen gedrückt fühlt, verwechselt man leicht mit Δv. Der Geschwindigkeitspfeil dreht sich aber zur Kreismitte hin – also zeigt Δv nach innen."],
     erklaerung: "Das Tempo bleibt gleich, aber die **Richtung** ändert sich ständig – also ändert sich die Geschwindigkeit. Die Zusatzgeschwindigkeit **Δv zeigt zur Kreismitte**: Sie dreht den Pfeil, ohne ihn länger oder kürzer zu machen."},
    {x: 205, y: 128, r: 120, name: "Mias Schulweg-Rechnung", frage: "Was ist an der Rechnung falsch?",
     optionen: ["Man muss 1200 m · 400 s rechnen.", "Eine Strecke darf man nicht durch eine Zeit teilen.", "Die Wartezeit zählt mit: Durchschnittsgeschwindigkeit = Gesamtstrecke : Gesamtzeit = 1200 m : 600 s = 2 m/s.", "Nichts – Wartezeiten zählen nie mit."], richtig: 2,
     warum: ["Malnehmen ergibt keine Geschwindigkeit, sondern Meter mal Sekunden. Teilen ist richtig – aber durch die Gesamtzeit.",
             "Doch – genau so ist die Geschwindigkeit festgelegt: v = Δs : Δt. Der Fehler steckt in der Zeit, durch die Mia teilt.",
             null,
             "Die Durchschnittsgeschwindigkeit gilt für den **ganzen** Schulweg – auch die 200 s an den Ampeln gehören zur Gesamtzeit. Ohne die Wartezeit rechnet man nur, wie schnell Mia beim Fahren war."],
     erklaerung: "Für die **Durchschnittsgeschwindigkeit** teilst du die **Gesamtstrecke** durch die **Gesamtzeit** – Pausen gehören dazu: v = 1200 m : 600 s = **2 m/s**. Darum ist man im Durchschnitt langsamer, als der Tacho beim Fahren anzeigt."}
  ],
  // richtig dargestellte Details (keine Überlappung mit den Fehlerkreisen)
  ablenker: [
    {x: 621, y: 70, r: 44, text: "Die Geschwindigkeitsanzeige misst die **Momentangeschwindigkeit** des Autos, das gerade vorbeifährt – genau wie ein Tacho: 28 km/h in diesem Augenblick."},
    {x: 128, y: 427, r: 58, text: "Der Pfeil des roten Autos ist 5-mal so lang wie der 10-km/h-Pfeil der Legende – das passt genau zu **50 km/h**. Und er zeigt in Fahrtrichtung."},
    {x: 965, y: 282, r: 62, text: "Das obere Auto fährt mit gleichem Tempo durch den Kreisverkehr: Δv zeigt richtig **zur Mitte** des Kreisels. So dreht sich der Pfeil, ohne länger oder kürzer zu werden."},
    {x: 315, y: 665, r: 66, text: "Richtig gerechnet: v = Δs : Δt = 350 m : 100 s = **3,5 m/s**, das sind 3,5 · 3,6 = 12,6 km/h – ein gutes Lauftempo."},
    {x: 1116, y: 690, r: 56, text: "30 km/h : 3,6 ≈ **8,3 m/s** – richtig umgerechnet: Von km/h nach m/s teilt man durch 3,6."}
  ],
  abschluss: "So stimmt das Plakat: 50 km/h ≈ 13,9 m/s, die **Pfeillänge** passt zum Betrag, beim **Bremsen** zeigt Δv nach hinten, in der Kurve mit gleichem Tempo **zur Kreismitte** – und für den Durchschnitt zählt die **Gesamtzeit**."
};

/* ---------- Rechenwerkstatt: 4 Rechenwege, 3 Umstellungen, 3 Fehlersuchen ---------- */
// zwei typische Verwechslungen bei der Grundformel v = Δs : Δt
const V_FALSCH = [{f: "v = Δs · Δt", warum: "Geschwindigkeit ist Strecke **pro** Zeit. Beim Malnehmen würde v umso größer, je länger man für dieselbe Strecke braucht – wer trödelt, wäre dann „schneller“."},
                  {f: "v = Δt : Δs", warum: "Das ist der Kehrwert: Δt : Δs gibt an, wie viele Sekunden man für einen Meter braucht. Schon die Einheit m/s zeigt: Strecke geteilt durch Zeit."}];
const rechenweg = [
  // 1) vorgerechnetes Beispiel: beide Werte umrechnen, nichts umstellen
  {titel: "Mit dem Rad zur Schule", text: "Lena fährt mit dem Rad zur Schule. Für die 1,8 km lange Strecke braucht sie 6 min. Berechne ihre Durchschnittsgeschwindigkeit in m/s.",
   gegeben: [{g: "Δs", wert: 1.8, einheit: "km", name: "Strecke", si: {wert: 1800, einheit: "m"}}, {g: "Δt", wert: 6, einheit: "min", name: "Zeitspanne", si: {wert: 360, einheit: "s"}}],
   gesucht: {g: "v", einheit: "m/s", name: "Geschwindigkeit"},
   formel: "v = Δs : Δt", formelAblenker: V_FALSCH,
   umgestellt: "v = Δs : Δt", einsetzen: "v = 1800 m : 360 s", ergebnis: {wert: 5, einheit: "m/s"},
   tipps: ["Rechne zuerst um: 1,8 km = 1800 m und 6 min = 6 · 60 s = 360 s.", "v = 1800 m : 360 s", "1800 : 360 = 180 : 36 = …"], loesung: "v = Δs : Δt = 1800 m : 360 s = 5 m/s",
   antwort: "Lenas Durchschnittsgeschwindigkeit beträgt 5 m/s, das sind 18 km/h.", antwortAnfang: "Lenas Durchschnittsgeschwindigkeit …", einheitAuch: ["km/h"]},
  // 2) nach Δs umstellen, ohne Umrechnen
  {titel: "Blitz und Donner", text: "Bei einem Gewitter hörst du den Donner 3 s nach dem Blitz. Der Schall breitet sich in Luft mit etwa 340 m/s aus, das Licht des Blitzes kommt praktisch sofort bei dir an. Wie weit ist das Gewitter entfernt?",
   gegeben: [{g: "Δt", wert: 3, einheit: "s", name: "Zeitspanne"}, {g: "v", wert: 340, einheit: "m/s", name: "Schallgeschwindigkeit"}],
   gesucht: {g: "Δs", einheit: "m", name: "Entfernung"},
   formel: "v = Δs : Δt", formelAblenker: V_FALSCH,
   umgestellt: "Δs = v · Δt",
   umstellAblenker: [{f: "Δs = v : Δt", warum: "Δt steht in v = Δs : Δt unter dem Bruchstrich. Um es dort wegzubekommen, multiplizierst du beide Seiten mit Δt – nicht teilen."},
                     {f: "Δs = Δt : v", warum: "Teste mit Zahlen: Mit 340 m/s kommt der Schall in 1 s genau 340 m weit. 1 : 340 ergibt aber nur etwa 0,003 – und keine Meter."}],
   umstellWeg: "v = Δs : Δt  | · Δt  →  v · Δt = Δs  →  Δs = v · Δt",
   einsetzen: "Δs = 340 m/s · 3 s", ergebnis: {wert: 1020, einheit: "m"}, einheitAuch: ["km"],
   tipps: ["Stelle v = Δs : Δt nach Δs um: Δs = v · Δt.", "Δs = 340 m/s · 3 s", "340 · 3 = … – die Sekunden kürzen sich weg, es bleiben Meter."], loesung: "Δs = v · Δt = 340 m/s · 3 s = 1020 m ≈ 1 km",
   antwort: "Das Gewitter ist etwa 1020 m, also rund 1 km, entfernt.", antwortAnfang: "Das Gewitter ist …",
   plausibel: {frage: "Passt das Ergebnis zur Faustregel „3 Sekunden zwischen Blitz und Donner ≈ 1 km“?",
     optionen: ["Ja – in 3 s legt der Schall gut 1000 m zurück, also etwa 1 km.", "Nein – der Schall ist so schnell, dass das Gewitter 340 km entfernt sein müsste.",
                "Nein – weil auch das Licht Zeit braucht, ist das Gewitter viel weiter weg.", "Ja – denn 3 s entsprechen immer 3 km."], richtig: 0,
     warum: [null, "340 m/s heißt 340 **Meter** pro Sekunde, nicht Kilometer. In 3 s sind das rund 1000 m.",
             "Das Licht ist fast eine Million Mal schneller als der Schall: Für 1 km braucht es nur wenige millionstel Sekunden. Diese Zeit kannst du vernachlässigen.",
             "Dann müsste der Schall in jeder Sekunde 1 km schaffen – er kommt aber nur 340 m weit. Für 1 km braucht er etwa 3 s."],
     erklaerung: "Der Schall legt in jeder Sekunde etwa 340 m zurück, in 3 s also gut 1 km. Daher die Faustregel: Sekunden zwischen Blitz und Donner durch 3 teilen ergibt ungefähr die Entfernung in km."}},
  // 3) nach Δt umstellen, beide Werte umrechnen
  {titel: "Über die Brücke", text: "Ein Auto fährt mit konstant 90 km/h über eine 1,5 km lange Brücke. Wie lange braucht es dafür? Gib das Ergebnis in Sekunden an.",
   gegeben: [{g: "v", wert: 90, einheit: "km/h", name: "Geschwindigkeit", si: {wert: 25, einheit: "m/s"}}, {g: "Δs", wert: 1.5, einheit: "km", name: "Länge der Brücke", si: {wert: 1500, einheit: "m"}}],
   gesucht: {g: "Δt", einheit: "s", name: "Zeitspanne"},
   formel: "v = Δs : Δt", formelAblenker: V_FALSCH,
   umgestellt: "Δt = Δs : v",
   umstellAblenker: [{f: "Δt = v : Δs", warum: "Du hast den **Kehrwert** gebildet. Aus v = Δs : Δt folgt v · Δt = Δs und nach dem Teilen durch v: Δt = Δs : v."},
                     {f: "Δt = Δs · v", warum: "Dann bräuchte ein schnelleres Auto **länger** für die Brücke – es ist umgekehrt: Je größer v, desto kleiner Δt."}],
   umstellWeg: "v = Δs : Δt  | · Δt  →  v · Δt = Δs  | : v  →  Δt = Δs : v",
   einsetzen: "Δt = 1500 m : 25 m/s", ergebnis: {wert: 60, einheit: "s"},
   tipps: ["Rechne zuerst um: 90 km/h : 3,6 = 25 m/s und 1,5 km = 1500 m. Stelle dann nach Δt um.", "Δt = Δs : v = 1500 m : 25 m/s", "1500 : 25 = 6000 : 100 = … – die Einheit ist s."],
   loesung: "Δt = Δs : v = 1500 m : 25 m/s = 60 s = 1 min",
   antwort: "Das Auto braucht 60 s, also genau eine Minute, für die Brücke.", antwortAnfang: "Das Auto braucht …", einheitAuch: ["min"]},
  // 4) Zusatzgeschwindigkeit auf gerader Strecke: umrechnen und nach Δv umstellen
  {titel: "Der Zug beschleunigt", text: "Ein Zug fährt auf einer geraden Strecke mit 54 km/h an einer Baustelle vorbei. Danach beschleunigt er, bekommt also eine Zusatzgeschwindigkeit Δv in Fahrtrichtung, und fährt mit 144 km/h weiter. Wie groß ist Δv in m/s?",
   gegeben: [{g: "v_{vorher}", wert: 54, einheit: "km/h", name: "Geschwindigkeit vorher", si: {wert: 15, einheit: "m/s"}}, {g: "v_{nachher}", wert: 144, einheit: "km/h", name: "Geschwindigkeit nachher", si: {wert: 40, einheit: "m/s"}}],
   gesucht: {g: "Δv", einheit: "m/s", name: "Zusatzgeschwindigkeit"},
   formel: "v_{nachher} = v_{vorher} + Δv",
   formelAblenker: [{f: "v_{nachher} = v_{vorher} · Δv", warum: "Die Zusatzgeschwindigkeit wird **dazugezählt**, nicht malgenommen: Du hängst den Δv-Pfeil an die Spitze von v_{vorher}, bei gleicher Richtung addieren sich die Längen."},
                    {f: "v_{vorher} = v_{nachher} + Δv", warum: "Vorher und nachher sind vertauscht: Δv kommt **zu v_{vorher}** dazu und ergibt v_{nachher}. So wäre der Zug nach dem Beschleunigen langsamer als vorher."}],
   umgestellt: "Δv = v_{nachher} − v_{vorher}",
   umstellAblenker: [{f: "Δv = v_{nachher} + v_{vorher}", warum: "v_{vorher} steht mit Plus neben Δv – auf die andere Seite kommt es mit **Minus**. Δv ist der Unterschied der Geschwindigkeiten, nicht ihre Summe."},
                     {f: "Δv = v_{vorher} − v_{nachher}", warum: "So würde Δv beim Beschleunigen negativ, als zeige es gegen die Fahrtrichtung. Ziehe v_{vorher} von v_{nachher} ab."}],
   umstellWeg: "v_{nachher} = v_{vorher} + Δv  | − v_{vorher}  →  Δv = v_{nachher} − v_{vorher}",
   einsetzen: "Δv = 40 m/s − 15 m/s", ergebnis: {wert: 25, einheit: "m/s"},
   tipps: ["Rechne beide Geschwindigkeiten in m/s um (durch 3,6) und stelle nach Δv um.", "Δv = v_{nachher} − v_{vorher} = 40 m/s − 15 m/s", "40 − 15 = … – die Einheit ist m/s."],
   loesung: "v_{vorher} = 54 km/h : 3,6 = 15 m/s;  v_{nachher} = 144 km/h : 3,6 = 40 m/s;  Δv = v_{nachher} − v_{vorher} = 40 m/s − 15 m/s = 25 m/s (in Fahrtrichtung)",
   antwort: "Der Zug erhält eine Zusatzgeschwindigkeit von 25 m/s in Fahrtrichtung.", antwortAnfang: "Der Zug erhält …", einheitAuch: ["km/h"],
   plausibel: {frage: "Zur Kontrolle: Wie groß ist Δv in km/h?",
     optionen: ["90 km/h – genau der Unterschied 144 km/h − 54 km/h.", "198 km/h – die Summe der beiden Geschwindigkeiten.", "25 km/h – beim Umrechnen bleibt die Zahl gleich.", "Etwa 6,9 km/h, denn 25 : 3,6 ≈ 6,9."], richtig: 0,
     warum: [null, "Δv ist die **Änderung** der Geschwindigkeit, nicht die Summe. Der Zug wird von 54 km/h auf 144 km/h schneller – um 90 km/h.",
             "m/s und km/h sind verschiedene Einheiten: 25 m/s sind 25 · 3,6 km/h. Die Zahl muss in km/h größer werden.",
             "Die Richtung ist vertauscht: Von m/s nach km/h rechnest du **mal** 3,6. Durch 3,6 teilst du von km/h nach m/s."],
     erklaerung: "25 m/s · 3,6 = 90 km/h – das ist genau 144 km/h − 54 km/h. Beide Wege führen zum selben Δv."}}
];
const umstellen = [
  {formel: "v = Δs : Δt", loesung: "Δs = v · Δt", text: "Gesucht ist die Strecke, die ein Körper mit der Geschwindigkeit v in der Zeitspanne Δt zurücklegt.",
   typisch: [{f: "Δs = v : Δt", warum: "Δt steht unter dem Bruchstrich. Um es wegzubekommen, multiplizierst du beide Seiten mit Δt – Teilen würde es nur noch einmal unter den Bruchstrich setzen."},
             {f: "Δs = Δt : v", warum: "Teste mit Zahlen: Mit v = 5 m/s und Δt = 10 s müssen 50 m herauskommen – 10 : 5 ergibt aber nur 2."}],
   weg: "v = Δs : Δt  | · Δt  →  v · Δt = Δs", tipps: ["Multipliziere beide Seiten mit Δt.", "Probe mit Zahlen: v = 5 m/s und Δt = 10 s müssen Δs = 50 m ergeben."]},
  {formel: "v = Δs : Δt", loesung: "Δt = Δs : v", text: "Gesucht ist die Zeitspanne, die ein Körper mit der Geschwindigkeit v für die Strecke Δs braucht.",
   typisch: [{f: "Δt = v : Δs", warum: "Das ist der Kehrwert. Aus v = Δs : Δt wird erst v · Δt = Δs, dann teilst du durch v: Δt = Δs : v."},
             {f: "Δt = Δs · v", warum: "Dann bräuchte ein schnellerer Körper **länger** für dieselbe Strecke – es ist umgekehrt."}],
   weg: "v = Δs : Δt  | · Δt  →  v · Δt = Δs  | : v  →  Δt = Δs : v", tipps: ["Hole Δt zuerst aus dem Nenner: Multipliziere beide Seiten mit Δt.", "v · Δt = Δs – jetzt noch beide Seiten durch v teilen."]},
  {formel: "v_{nachher} = v_{vorher} + Δv", loesung: "Δv = v_{nachher} − v_{vorher}",
   text: "Auf gerader Strecke liegen alle Pfeile auf einer Linie. Gesucht ist die Zusatzgeschwindigkeit Δv, die aus v_{vorher} die Geschwindigkeit v_{nachher} macht.",
   typisch: [{f: "Δv = v_{nachher} + v_{vorher}", warum: "v_{vorher} steht mit Plus auf der rechten Seite – auf die andere Seite kommt es mit **Minus**."},
             {f: "Δv = v_{vorher} − v_{nachher}", warum: "Das Vorzeichen ist vertauscht: Beim Beschleunigen ist v_{nachher} größer als v_{vorher}, so käme ein negatives Δv heraus. Ziehe v_{vorher} von v_{nachher} ab."},
             {f: "Δv = v_{nachher} : v_{vorher}", warum: "Δv wird addiert, nicht malgenommen. Das Gegenteil von Plus ist Minus, nicht Geteilt."}],
   weg: "v_{nachher} = v_{vorher} + Δv  | − v_{vorher}  →  Δv = v_{nachher} − v_{vorher}", tipps: ["Was steht neben Δv? Ziehe es auf beiden Seiten ab.", "Probe: Von 12 m/s auf 19 m/s beschleunigt – dann muss Δv = 7 m/s herauskommen."]}
];
// Fehlersuche: die Figur der Welt hat gerechnet (Titel und Texte darum weltneutral)
const fehlersuche = [
  // Begriffsfehler: Mittelwert der Geschwindigkeiten statt Gesamtstrecke : Gesamtzeit
  {titel: "Die Radtour zum See", aufgabe: "Eine Radfahrerin fährt 12 km bergab mit 24 km/h zum See und dieselben 12 km bergauf mit 12 km/h zurück. Berechne ihre Durchschnittsgeschwindigkeit für die ganze Fahrt.",
   zeilen: ["Gegeben: Δs_{1} = Δs_{2} = 12 km; v_{1} = 24 km/h; v_{2} = 12 km/h", "Gesucht: Durchschnittsgeschwindigkeit v", "v = (v_{1} + v_{2}) : 2", "v = (24 km/h + 12 km/h) : 2", "v = 18 km/h"], falsch: 2,
   zeilenOk: ["Die Angaben stimmen: zweimal 12 km, hin mit 24 km/h, zurück mit 12 km/h.", "Gesucht ist die Durchschnittsgeschwindigkeit für Hin- und Rückweg – richtig."],
   optionen: ["Der Mittelwert der beiden Geschwindigkeiten ist nicht die Durchschnittsgeschwindigkeit. Man muss die Gesamtstrecke durch die Gesamtzeit teilen.", "Man darf nicht durch 2 teilen: v = 24 km/h + 12 km/h = 36 km/h.",
              "Die Geschwindigkeiten müssen zuerst in m/s umgerechnet werden.", "Man muss die Geschwindigkeiten malnehmen statt addieren."], richtig: 0,
   warum: [null, "36 km/h wäre schneller als beide Teilstrecken – das kann kein Durchschnitt sein. Der Fehler steckt schon in der Idee, die Geschwindigkeiten zu mitteln.",
           "Umrechnen ändert nichts am Fehler: Auch in m/s ist der Mittelwert der Geschwindigkeiten nicht die Durchschnittsgeschwindigkeit. Mit km und h kannst du direkt in km/h rechnen.",
           "Geschwindigkeiten malzunehmen ergibt keine Geschwindigkeit. Für den Durchschnitt brauchst du die Gesamtstrecke und die Gesamtzeit."],
   korrektur: {frage: "Wie groß ist die Durchschnittsgeschwindigkeit richtig?", wert: 16, einheit: "km/h", toleranz: .1,
     tipps: ["Berechne zuerst die beiden Fahrzeiten mit Δt = Δs : v.", "Δt_{1} = 12 km : 24 km/h = 0,5 h und Δt_{2} = 12 km : 12 km/h = 1 h. Insgesamt: 24 km in 1,5 h."],
     loesung: "Δt_{1} = 12 km : 24 km/h = 0,5 h;  Δt_{2} = 12 km : 12 km/h = 1 h;  v = 24 km : 1,5 h = 16 km/h"},
   erklaerung: "Die Durchschnittsgeschwindigkeit ist **Gesamtstrecke : Gesamtzeit**. Bergauf ist die Radfahrerin doppelt so lange unterwegs wie bergab – das langsame Stück zählt deshalb stärker, und der Durchschnitt liegt unter dem Mittelwert 18 km/h."},
  // Formelfehler: falsch nach Δt umgestellt (Einheitenprobe hätte es gezeigt)
  {titel: "Der Dauerlauf", aufgabe: "Ein Läufer läuft gleichförmig mit 4 m/s. Wie lange braucht er für 1,2 km? Gib das Ergebnis in Minuten an.",
   zeilen: ["Gegeben: v = 4 m/s; Δs = 1,2 km = 1200 m", "Gesucht: Δt in min", "v = Δs : Δt", "Δt = v · Δs", "Δt = 4 m/s · 1200 m = 4800 s", "Δt = 4800 s : 60 = 80 min"], falsch: 3,
   zeilenOk: ["Die Angaben stimmen, und 1,2 km = 1200 m ist richtig umgerechnet.", "Gesucht ist die Zeit – richtig.", "Die Grundformel stimmt: Geschwindigkeit ist Strecke geteilt durch Zeit."],
   optionen: ["Beim Umstellen wurde malgenommen statt geteilt: Richtig ist Δt = Δs : v.", "1,2 km sind 120 m, nicht 1200 m.", "Für Minuten muss man mit 60 malnehmen, nicht durch 60 teilen.", "Die Grundformel ist falsch: Es gilt v = Δs · Δt."], richtig: 0,
   warum: [null, "1 km = 1000 m, also sind 1,2 km = 1200 m – Zeile 1 stimmt. Der Fehler passiert beim Umstellen.",
           "Durch 60 zu teilen ist richtig, denn 60 s sind 1 min. Nur die Sekunden, die geteilt werden, sind schon falsch.",
           "Zeile 3 stimmt: Geschwindigkeit ist Strecke **geteilt** durch Zeit. Erst beim Umstellen danach geht etwas schief."],
   korrektur: {frage: "Wie lange braucht der Läufer richtig? Gib die Zeit in Minuten an.", wert: 5, einheit: "min", toleranz: .05,
     tipps: ["Δt = Δs : v = 1200 m : 4 m/s", "1200 : 4 = 300 – das sind Sekunden. Teile noch durch 60."], loesung: "Δt = Δs : v = 1200 m : 4 m/s = 300 s = 5 min"},
   erklaerung: "Aus v = Δs : Δt folgt Δt = Δs : v. Die **Einheitenprobe** hätte den Fehler verraten: m/s · m ergibt keine Zeit. Und 80 min für 1,2 km wären viel langsamer als Spazierengehen."},
  // Umrechnungsfehler: mal 3,6 statt durch 3,6
  {titel: "Das Auto in der Stadt", aufgabe: "Ein Auto fährt mit konstant 54 km/h durch die Stadt. Welche Strecke legt es in 8 s zurück?",
   zeilen: ["Gegeben: v = 54 km/h; Δt = 8 s", "Gesucht: Δs", "v = 54 km/h = 54 · 3,6 m/s = 194,4 m/s", "Δs = v · Δt = 194,4 m/s · 8 s", "Δs ≈ 1555 m"], falsch: 2,
   zeilenOk: ["Die Angaben stimmen: 54 km/h und 8 s.", "Gesucht ist die Strecke – richtig."],
   optionen: ["Die Zeit muss zuerst in Stunden umgerechnet werden.", "Von km/h nach m/s teilt man durch 3,6: 54 km/h = 15 m/s.", "Man muss die Geschwindigkeit durch die Zeit teilen: Δs = v : Δt.", "Von km/h nach m/s rechnet man mal 1000."], richtig: 1,
   warum: ["Das wäre ein anderer Weg. Hier wird aber in m/s gerechnet – und genau diese Umrechnung in Zeile 3 ist falsch: 194,4 m/s wären rund 700 km/h – fast so schnell wie ein Verkehrsflugzeug.",
           null,
           "Δs = v · Δt ist richtig umgestellt (Zeile 4). Der Fehler steckt in der Zahl, die für v eingesetzt wird.",
           "Bei km → m kommt zwar der Faktor 1000 dazu, aber auch Stunde → Sekunde (: 3600). Zusammen ergibt das : 3,6."],
   korrektur: {frage: "Welche Strecke legt das Auto in 8 s richtig zurück?", wert: 120, einheit: "m", toleranz: .5,
     tipps: ["Rechne um: 54 km/h : 3,6 = 15 m/s.", "Δs = v · Δt = 15 m/s · 8 s = …"], loesung: "v = 54 km/h : 3,6 = 15 m/s;  Δs = v · Δt = 15 m/s · 8 s = 120 m"},
   erklaerung: "Von km/h nach m/s **teilst** du durch 3,6 – die Zahl wird kleiner, denn 1 m/s ist schon 3,6 km/h. Probe: 1555 m in 8 s wären fast 200 m in jeder Sekunde – für ein Auto in der Stadt völlig unrealistisch."}
];

/* ---------- Rückmeldung je falscher Antwort (Reihenfolge wie options in inhalt/beweg1.json, null an der richtigen Antwort) ---------- */
const warum = {
  0: [null, "Das ist der Kehrwert: Δt : Δs gibt an, wie viele Sekunden man **pro Meter** braucht – ein schneller Körper hätte dann einen kleinen Wert. Geschwindigkeit ist Strecke pro Zeit.",
      "Beim Malnehmen würde v umso größer, je länger man für dieselbe Strecke braucht – ein langsamer Körper wäre dann „schnell“. Strecke **pro** Zeitspanne heißt: teilen.",
      "Strecke und Zeit sind verschiedene Größen – Sekunden kann man nicht von Metern abziehen. Schon die Einheit m/s zeigt: Strecke geteilt durch Zeit."],
  1: ["Genau andersherum: Die 3,6 gehört zu km/h. 1 km/h ist langsam – nur 1000 m in 3600 s, also weniger als 0,3 m/s.", null,
      "Hier ist das Komma verrutscht: Mit 1 m/s kommst du in einer Stunde 3600 m weit, das sind 3,6 km – nicht 36 km.",
      "Den Faktor 60 gibt es zwischen Minuten und Sekunden. Von m/s zu km/h ändern sich aber Meter → Kilometer (: 1000) und Sekunde → Stunde (· 3600) – zusammen · 3,6."],
  2: ["Die Durchschnittsgeschwindigkeit kennst du erst am Ende der Fahrt (Gesamtstrecke : Gesamtzeit). Der Tacho zeigt dagegen in jedem Augenblick einen neuen Wert.", null,
      "Die Zusatzgeschwindigkeit Δv ist die **Änderung** der Geschwindigkeit, etwa beim Bremsen. Der Tacho zeigt, wie schnell du gerade bist – auch wenn sich nichts ändert.",
      "Die Höchstgeschwindigkeit ist der größte Wert, den das Auto erreichen kann. Die Tachonadel zeigt aber, wie schnell du in diesem Moment fährst."],
  3: ["Der Betrag stimmt, aber die Masse gehört zum Körper, nicht zu seiner Geschwindigkeit – ein Bus und ein Fahrrad können gleich schnell sein. Es fehlt die Richtung.",
      "Die Strecke ist nur ein Teil der Rechnung v = Δs : Δt, und die Masse spielt für die Geschwindigkeit keine Rolle. Gefragt ist: wie schnell und wohin.", null,
      "Die Richtung stimmt, aber die Uhrzeit sagt nichts darüber, wie schnell der Körper ist. Es fehlt der Betrag."],
  4: ["Die Richtung zeigt die **Pfeilspitze** an. Die Länge sagt etwas anderes: wie schnell der Körper ist.", null,
      "Der Pfeil gilt für einen Augenblick, nicht für die bisherige Fahrt: Ein Auto, das schon 100 km gefahren ist, hat bei 50 km/h denselben Pfeil wie eines, das gerade losgefahren ist.",
      "Wie lange sich ein Körper schon bewegt, steckt nicht im Pfeil. Ein längerer Pfeil heißt nur: Der Körper ist schneller."],
  6: [null, "Schneller werden heißt im t-s-Diagramm: Die Kurve wird immer **steiler**. Eine waagrechte Linie hat gar keine Steigung.",
      "Beim Langsamerwerden wird die Kurve flacher – sie steigt aber noch an. Waagrecht heißt: Die Strecke s ändert sich überhaupt nicht mehr.",
      "Bei einer gleichförmigen Bewegung steigt die Gerade an, weil in jeder Sekunde gleich viel Strecke hinzukommt. Waagrecht heißt: Es kommt keine Strecke hinzu."],
  7: ["Bei einer beschleunigten Bewegung wird der Körper schneller: In jeder Sekunde kommt **mehr** Strecke hinzu als in der Sekunde davor.", null,
      "Bei einer Kreisbewegung ändert sich ständig die Richtung – in der Frage bewegt sich der Körper aber geradeaus.",
      "Beim Abbremsen kommt in jeder Sekunde **weniger** Strecke hinzu. Gleiche Strecken in gleichen Zeiten heißen: Die Geschwindigkeit bleibt gleich."],
  8: ["Der Mittelwert aus zwei Tachowerten berücksichtigt nicht, **wie lange** du wie schnell warst. Wer lange im Stau steht, ist im Durchschnitt viel langsamer.", null,
      "Die höchste Tachoanzeige ist nur ein einziger Augenblick der Fahrt. Für den Durchschnitt zählen auch alle langsamen Abschnitte und Pausen.",
      "Das ist der Kehrwert: Zeit pro Strecke, also etwa Sekunden pro Meter. Geschwindigkeit ist Strecke geteilt durch Zeit."],
  9: ["Δ bildet keinen Mittelwert, sondern einen Unterschied: Δt = t_{2} − t_{1} ist die Zeitspanne zwischen zwei Zeitpunkten.", null,
      "Δs ist kein Produkt aus Δ und s. Das Zeichen bedeutet „Änderung von“: Δs = s_{2} − s_{1} ist die Strecke zwischen zwei Orten.",
      "Die Richtung zeigt bei einer Geschwindigkeit der **Pfeil** an. Δ steht für den Unterschied zweier Werte, etwa Δt = t_{2} − t_{1}."],
  11: [null, "Der Tacho zeigt nur den **Betrag**. Zur Geschwindigkeit gehört aber auch die Richtung – und die ändert sich in der Kurve ständig.",
       "Bremsen ändert den Betrag. Die Geschwindigkeit ändert sich aber auch dann, wenn sich nur die **Richtung** ändert – wie in der Kurve.",
       "Laut Aufgabe fährt der Bus konstant 30 km/h – der Betrag bleibt gleich. Was sich ändert, ist die Richtung."],
  12: ["Steiler heißt: In derselben Zeit kommt bei A **mehr** Strecke hinzu. Mehr Strecke pro Zeit bedeutet eine größere Geschwindigkeit.", null,
       "Gleich schnell wären A und B nur bei gleich steilen Geraden. Verschiedene Steigungen bedeuten verschiedene Geschwindigkeiten.",
       "Stillstand zeigt eine **waagrechte** Linie. Beide Geraden steigen an, also bewegen sich beide – A sogar schneller."],
  13: ["Der Betrag 20 m/s stimmt, die Richtung nicht: Ein Δv in Fahrtrichtung würde den Zug schneller machen – auf 50 m/s.", null,
       "40 m/s ist die Summe 30 m/s + 10 m/s. Δv ist aber der **Unterschied**: Die Geschwindigkeit nimmt um 30 m/s − 10 m/s = 20 m/s ab.",
       "10 m/s ist die Geschwindigkeit **nachher**, nicht die Änderung. Von 30 m/s auf 10 m/s sind es 20 m/s weniger."],
  14: [null, "So zeichnest du nur den Δv-Pfeil noch einmal nach. v_{nachher} beginnt dort, wo auch v_{vorher} beginnt – beim Körper.",
       "Beim Bremsen ist v_{nachher} sogar kürzer als v_{vorher}. Außerdem wird Δv an die **Spitze** von v_{vorher} gehängt, nicht an den Anfang.",
       "Die Längen darfst du nur addieren, wenn beide Pfeile in dieselbe Richtung zeigen. Sonst hängst du die Pfeile aneinander und misst den Ergebnispfeil ab."],
  15: ["Die Richtung ist vertauscht: Dieser Pfeil führt von v_{nachher} zurück zu v_{vorher}. Δv muss von der Spitze von v_{vorher} zur Spitze von v_{nachher} zeigen, denn v_{vorher} + Δv = v_{nachher}.", null,
       "Δv ist ein eigener Pfeil, keiner der beiden gegebenen – und er kann sogar länger sein als beide: Prallt ein Ball mit gleichem Tempo von einer Wand ab, ist Δv doppelt so lang wie v_{vorher}.",
       "So konstruierst du v_{nachher} aus zwei Pfeilen, die du aneinanderhängst. Hier ist v_{nachher} aber schon bekannt – gesucht ist der Pfeil dazwischen."],
  16: ["Ein Δv in Fahrtrichtung macht den Pfeil nur länger – das Auto würde schneller, aber nicht abbiegen.",
       "Ein Δv gegen die Fahrtrichtung bremst das Auto nur ab. Für eine Kurve mit gleichem Tempo muss Δv quer zur Fahrtrichtung zeigen.", null,
       "Dass du dich in der Kurve nach außen gedrückt fühlst, ändert nichts: Der Geschwindigkeitspfeil wird zur Kurvenmitte hin gedreht – also zeigt Δv nach innen."],
  17: ["Die Einheit ändert nichts am Tempo: 50 km/h und rund 13,9 m/s sind dieselbe Geschwindigkeit. Entscheidend ist, dass auch die Standzeiten in der Gesamtzeit stecken.", null,
       "Auch für die Durchschnittsgeschwindigkeit teilt man: Gesamtstrecke **durch** Gesamtzeit. Malnehmen ergibt keine Geschwindigkeit.",
       "Für den Durchschnitt zählt die **ganze** Zeit, nicht nur die Bremsphasen: Fahren, Bremsen und Warten an der Ampel."],
  18: [null, "Über die ganze Fahrstrecke misst du die **Durchschnittsgeschwindigkeit**. Für einen Augenblick brauchst du eine möglichst kurze Messstrecke.",
       "Das ergibt weder die Momentan- noch die Durchschnittsgeschwindigkeit – durch zwei zu teilen passt nur bei genau zwei Werten. Für die Momentangeschwindigkeit misst du Δs und Δt auf einer sehr kurzen Strecke.",
       "Ohne Zeitmessung weißt du nicht, wie schnell der Wagen die Strecke geschafft hat: Für v = Δs : Δt brauchst du beide Werte."],
  20: ["Zum Stillstand kommt ein Körper nur, wenn Δv genau entgegen v_{vorher} zeigt und gleich lang ist. Ein Δv quer dazu lenkt ihn zur Seite.", null,
       "Ein Δv quer zur Bewegung macht den Pfeil nicht kürzer – v_{nachher} wird sogar länger als v_{vorher} und zeigt in eine neue Richtung.",
       "Mit einem Δv, das nicht null ist, ist v_{nachher} nie gleich v_{vorher}: Hier ändert sich zumindest die Richtung – und damit die Geschwindigkeit."],
  21: [null, "Wie lang die Gerade ist, hängt nur davon ab, wie lange man misst. Die Geschwindigkeit steckt in der **Steigung**: wie viel Strecke pro Sekunde hinzukommt.",
       "Eine immer steilere Kurve gehört zu einem Körper, der **schneller wird**. Gleichförmig heißt: gleich viel Strecke pro Sekunde – also eine Gerade.",
       "Eine waagrechte Linie bedeutet Stillstand. Bei einer gleichförmigen Bewegung steigt die Gerade gleichmäßig an."],
  24: ["Der Betrag bleibt gleich, aber die Richtung kehrt sich um – also hat sich die Geschwindigkeit geändert. Mit Δv = 0 würde der Ball einfach weiter in die Wand fliegen.",
       "Mit 5 m/s von der Wand weg wird der Ball nur gestoppt: v_{nachher} wäre 0. Damit er mit 5 m/s zurückfliegt, braucht er noch einmal 5 m/s dazu.",
       "Der Betrag 10 m/s stimmt, die Richtung nicht: Ein Δv zur Wand hin würde den Ball noch schneller in die Wand treiben. Die Wand stößt ihn zurück.", null],
  25: ["2 m/s ist der Unterschied 8 m/s − 6 m/s. Abziehen darfst du nur bei entgegengesetzten Pfeilen – hier stehen sie senkrecht aufeinander.", null,
       "6 + 8 = 14 gilt nur, wenn beide Pfeile in dieselbe Richtung zeigen. Hängst du den Nord-Pfeil an den Ost-Pfeil, ist der Ergebnispfeil kürzer als beide zusammen.",
       "Geschwindigkeiten werden nicht malgenommen: 6 · 8 = 48 hätte nicht einmal die Einheit m/s. Zeichne die Pfeile aneinander und miss v_{nachher} ab."],
  29: [null, "10 m : 2 s würde nur stimmen, wenn der Körper bei t = 0 s bei 0 m gestartet wäre. Nimm für das Steigungsdreieck die **Differenzen** zwischen den beiden Punkten: Δs = 22 m − 10 m, Δt = 6 s − 2 s.",
       "22 m : 6 s ≈ 3,7 m/s tut so, als wäre der Körper bei t = 0 s bei 0 m gewesen. Er war aber nach 2 s schon bei 10 m – rechne mit den Differenzen Δs und Δt.",
       "48 entsteht durch Malnehmen (12 · 4). Geschwindigkeit ist Strecke **geteilt** durch Zeit: Δs : Δt."]
};

R3D.lern.raum("beweg1", {
  raetsel, suchbild,
  // Rechenwerkstatt: Tafel rechts zwischen Tachometer (C) und Station 4 (vorne rechts steht das Ausstellungsstück), + Knopf an Station 3
  uebung: {ort: {x: 6.5, z: -4.75, ry: -Math.PI / 2}, formel: "v = Δs : Δt"},
  rechenweg, umstellen, fehlersuche, warum,
  spick: {
    kern: ["Geschwindigkeit **v = Δs : Δt** (Strecke durch Zeitspanne), Einheit 1 m/s", "**1 m/s = 3,6 km/h**: von m/s nach km/h mal 3,6, von km/h nach m/s durch 3,6",
           "Durchschnittsgeschwindigkeit = Gesamtstrecke : Gesamtzeit; die Momentangeschwindigkeit zeigt der Tacho",
           "t-s-Diagramm: gleichförmige Bewegung → Gerade, **Steigung = Geschwindigkeit**, waagrechte Linie = Stillstand",
           "Geschwindigkeit hat **Betrag und Richtung**: Der Geschwindigkeitspfeil zeigt in Bewegungsrichtung, seine Länge im Maßstab gibt den Betrag an",
           "**v_{nachher} = v_{vorher} + Δv**: Δv an die Spitze von v_{vorher} hängen. Δv in Bewegungsrichtung → schneller, entgegen → langsamer, quer → neue Richtung; Kurve mit gleichem Tempo: Δv zeigt zur Kurvenmitte"],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn, wie du die Geschwindigkeit eines Spielzeugautos misst und wie du das Ergebnis von m/s in km/h umrechnest.",
       begriffe: [["Strecke", "Δs", "Entfernung", "Weglänge"], ["Zeit", "Stoppuhr", "Δt", "Sekunde"], ["geteilt", "dividier", "durch die Zeit", "durch Δt", "teilen"], ["m/s", "Meter pro Sekunde"], ["3,6", "3.6"], ["km/h", "Kilometer pro Stunde"], ["mal 3,6", "mal 3", "malnehmen", "mal nehmen", "multiplizier", "·", "*"]],
       muster: "Ich messe mit einem Maßband die **Strecke Δs** und mit der **Stoppuhr** die **Zeit Δt**, die das Auto dafür braucht. Dann rechne ich **v = Δs : Δt**, also Strecke **geteilt durch** Zeit – das Ergebnis hat die Einheit **m/s**. Weil 1 m/s = **3,6** km/h ist, rechne ich **mal 3,6** und erhalte die Geschwindigkeit in **km/h**."},
      {frage: "Erkläre, was ein Geschwindigkeitspfeil angibt und was mit ihm passiert, wenn ein Auto mit gleichem Tempo durch eine Kurve fährt.",
       begriffe: [["Betrag", "Tempo", "wie schnell"], ["Richtung", "gerichtet", "wohin"], ["Länge", "lang ist", "kürzer", "Maßstab"], ["Zusatzgeschwindigkeit", "Δv", "delta v"], ["Spitze", "aneinander", "hängen"], ["Mitte", "nach innen", "ins Innere", "Zentrum"],
                  ["gleich lang", "gleichem Tempo", "gleiches Tempo", "gleichbleibend", "bleibt gleich", "gleich schnell", "konstant"]],
       muster: "Der Pfeil zeigt in die **Richtung** der Bewegung, seine **Länge** gibt im Maßstab den **Betrag** an – also wie schnell der Körper ist. In der Kurve bleibt der Pfeil **gleich** lang, aber er dreht sich. Dafür sorgt eine **Zusatzgeschwindigkeit Δv**, die man an die **Spitze** von v_{vorher} hängt: Sie zeigt zur **Mitte** der Kurve. Es gilt v_{nachher} = v_{vorher} + Δv."}
    ]
  },
  zuordnung: {
    "Geschwindigkeit messen: v = Δs : Δt": [0, 3, 4, 9, 19, 22, 28],
    "Momentan- oder Durchschnittsgeschwindigkeit?": [8, 17, 18, 27],
    "Das t-s-Diagramm zeichnet mit": [6, 7, 12, 21, 26, 29],
    "Abprall: Pfeile aneinanderhängen": [5, 13, 14, 15, 24],
    "Umrechnen: m/s und km/h": [1, 2, 10, 23],
    "Kurvenfahrt: Δv zeigt zur Kreismitte": [11, 16, 20, 25]
  },
  hilfen: {
    10: ["Von m/s nach km/h rechnest du mal 3,6, denn 1 m/s = 3,6 km/h.", "Einsetzen: 10 m/s · 3,6", "10 · 3,6 = … – die Einheit ist km/h."],
    19: ["Der Maßstab sagt: Jeder Zentimeter Pfeil steht für 10 km/h.", "Wie oft passen 10 km/h in 45 km/h? Rechne 45 km/h : 10 km/h.", "45 : 10 = … – so viele Zentimeter ist der Pfeil lang."],
    22: ["Formel: v = Δs : Δt", "Einsetzen: v = 400 m : 80 s", "Ausrechnen: 400 : 80 = … – die Einheit ist m/s."],
    23: ["Von km/h nach m/s teilst du durch 3,6.", "Einsetzen: 72 km/h : 3,6", "72 : 3,6 = 720 : 36 = … – die Einheit ist m/s."],
    26: ["Umgestellt: Δs = v · Δt. Rechne die Zeit zuerst in Sekunden um: 1 min = 60 s.", "Δt = 2 min = 120 s, also Δs = 300 m/s · 120 s", "300 · 120 = … – das Ergebnis ist in m. Gefragt sind km: 1 km = 1000 m, also teilst du noch durch 1000."],
    27: ["Durchschnittsgeschwindigkeit = Gesamtstrecke : Gesamtzeit. Berechne zuerst die beiden Fahrzeiten mit Δt = Δs : v.", "Hinweg: 60 km : 60 km/h = 1 h · Rückweg: 60 km : 40 km/h = 1,5 h", "v = 120 km : (1 h + 1,5 h) = 120 km : 2,5 h = … km/h"],
    28: ["Umgestellt: Δt = Δs : v", "Einsetzen: Δt = 900 m : 1,5 m/s – das Ergebnis kommt in Sekunden heraus.", "900 : 1,5 = 9000 : 15 = … s. Gefragt sind Minuten: 1 min = 60 s, also teilst du noch durch 60."]
  }
});
})();
