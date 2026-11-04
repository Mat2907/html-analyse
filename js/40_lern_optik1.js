/* ---------- 40_lern_optik1.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum 2 (Kap. 2.1–2.2: Reflexionsgesetz, Spiegelbild, Lichtbrechung, Totalreflexion)
   Türrätsel „Das Spiegelschloss“ · Suchbild „Ein Nachmittag am Badesee“ · Lernzettel · Fehler → Exponat · Tipps zu Rechenaufgaben
   (Das Labor sitzt an der optischen Scheibe in 20_optik1.js.)
   Gerechnet wird mit n = 1,5 (Glas) bzw. 1,33 (Wasser); gezeigt werden nur Winkel und die Folgen (Brechung, Totalreflexion).
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;
const DEG = Math.PI / 180;

/* ---------- kleine Zeichenhilfen ---------- */
const line = (g, pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const dash = (g, pts, col, w, d = [10, 8]) => { g.save(); g.setLineDash(d); line(g, pts, col, w); g.restore(); };
// griechische Buchstaben (α, β, α') in einer Serifenschrift, damit α nicht wie „a“ aussieht
const GR = /[Ͱ-Ͽ]/, GRF = "'Times New Roman', Times, Georgia, serif";
function txt(g, s, x, y, size, col, align = "center", weight = 600){
  s = String(s); g.fillStyle = col; g.textBaseline = "middle";
  if (!GR.test(s)) { g.font = `${weight} ${size}px system-ui, sans-serif`; g.textAlign = align; g.fillText(s, x, y); return; }
  const runs = s.split(/([Ͱ-Ͽ]+'?)/).filter(r => r), fo = r => GR.test(r) ? `italic 700 ${Math.round(size * 1.15)}px ${GRF}` : `${weight} ${size}px system-ui, sans-serif`;
  let W = 0; const ws = runs.map(r => { g.font = fo(r); const w = g.measureText(r).width; W += w; return w; });
  let cx = align === "center" ? x - W / 2 : align === "right" ? x - W : x; g.textAlign = "left";
  runs.forEach((r, i) => { g.font = fo(r); g.fillText(r, cx, y); cx += ws[i]; });
}
const otxt = (g, s, x, y, size, col, align = "center", weight = 700, out = "rgba(10,30,50,.85)") => {   // Schrift mit dunklem Rand (auf Wasser)
  g.save(); g.font = `${weight} ${size}px system-ui, sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.lineWidth = 5; g.strokeStyle = out; g.lineJoin = "round";
  g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); g.restore(); };
function arrowHead(g, x, y, ang, s, col){ g.fillStyle = col; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(ang - .42) * s, y - Math.sin(ang - .42) * s); g.lineTo(x - Math.cos(ang + .42) * s, y - Math.sin(ang + .42) * s); g.closePath(); g.fill(); }
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.lineCap = "round"; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, 7); g.fill(); }

/* =====================================================================
   Türrätsel: Das Spiegelschloss
   Lampe → drehbarer Spiegel (Reflexionsgesetz) → Umlenkprisma (Totalreflexion?) → Sensor am Schloss.
   Ein kleiner Strahlverfolger rechnet jeden Lichtweg physikalisch: Reflexion am Spiegel, Brechung und Teilreflexion an jeder
   Prismenfläche, Totalreflexion oberhalb des Grenzwinkels. Nur Neigung 24° (α = 66°, Strahlen schließen 132° ein) und Glas öffnen.
   (Bewusst kein Wert aus dem 5°-Raster, deshalb Reglerschritt 2°: 30°/120° und 45°/90° stehen in den Quizfragen 24 und 26, 25°/130° in
   der ersten Prüfungsaufgabe (exam[0]), 15°/150° in der Tabelle „Winkel am ebenen Spiegel“, 35°/110° und 40°/100° in der Rechenwerkstatt.)
   ===================================================================== */
const dirOf = phi => [Math.cos(phi * DEG), -Math.sin(phi * DEG)];   // Richtung zum Winkel φ (gegen den Uhrzeigersinn, y nach oben)
const add = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1], cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const CW = 900, CH = 540, LAMP = [100, 420], MP = [300, 420], ML = 75, SR = 20;
const ZIEL = 132, NEIG = (180 - ZIEL) / 2, RICHT = 180 - ZIEL;   // nötiger Winkel zwischen den Strahlen, passende Neigung (24°), Richtung des reflektierten Strahls (48°)
const U = dirOf(RICHT), Wv = dirOf(RICHT - 90), PE = add(MP, U, 344), PC = add(PE, Wv, 60), PA = add(PC, Wv, -120), PB = add(PC, U, 120);   // Eintrittspunkt, Ecken des Prismas
const PH = add(PE, U, 60), PX = add(PH, Wv, 60), SEN = add(PX, Wv, 253);   // Treffpunkt auf der langen Seite, Austrittspunkt, Sensor (≈ 803 | 329, wie zuvor)
const PRISM = [PC, PA, PB], CEN = [(PC[0] + PA[0] + PB[0]) / 3, (PC[1] + PA[1] + PB[1]) / 3];
const EDGES = [[PC, PA], [PA, PB], [PB, PC]].map(([a, b], i) => { const e = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...e); let n = [e[1] / L, -e[0] / L];
  if (dot(n, [CEN[0] - a[0], CEN[1] - a[1]]) > 0) n = [-n[0], -n[1]]; return {a, b, n, i}; });   // n zeigt nach außen; i = 1 ist die lange Seite
const EPS = 1e-4;
function segHit(p, d, a, b){ const e = [b[0] - a[0], b[1] - a[1]], den = cross(d, e); if (Math.abs(den) < 1e-9) return null;
  const ap = [a[0] - p[0], a[1] - p[1]], t = cross(ap, e) / den, s = cross(ap, d) / den; return t > EPS && s >= 0 && s <= 1 ? t : null; }
function circHit(p, d, c, r){ const f = [p[0] - c[0], p[1] - c[1]], b = dot(f, d), q = dot(f, f) - r * r, D = b * b - q; if (D < 0) return null; const t = -b - Math.sqrt(D); return t > EPS ? t : null; }
function tEdge(p, d){ let t = 1e9; if (d[0] > 1e-9) t = Math.min(t, (CW - p[0]) / d[0]); if (d[0] < -1e-9) t = Math.min(t, -p[0] / d[0]);
  if (d[1] > 1e-9) t = Math.min(t, (CH - p[1]) / d[1]); if (d[1] < -1e-9) t = Math.min(t, -p[1] / d[1]); return Math.max(t, 0); }
function trace(neig, nP){
  const md = dirOf(neig), mA = add(MP, md, -ML), mB = add(MP, md, ML), mN = dirOf(neig + 90);
  const out = {segs: [], sensor: 0, hyp: null, mirror: [mA, mB]}, rays = [{p: LAMP, d: [1, 0], k: 1, gen: 0}];
  while (rays.length) { const R = rays.shift(); let p = R.p, d = R.d, k = R.k;
    for (let n = 0; n < 12 && k > .02; n++) {
      let best = {t: tEdge(p, d), kind: "rand"};
      const tm = segHit(p, d, mA, mB); if (tm != null && tm < best.t) best = {t: tm, kind: "spiegel"};
      for (const e of EDGES) { const te = segHit(p, d, e.a, e.b); if (te != null && te < best.t) best = {t: te, kind: "prisma", e}; }
      const ts = circHit(p, d, SEN, SR); if (ts != null && ts < best.t) best = {t: ts, kind: "sensor"};
      const q = add(p, d, best.t); out.segs.push({a: p, b: q, k, gen: R.gen});
      if (best.kind === "rand") break;
      if (best.kind === "sensor") { out.sensor += k; break; }
      if (best.kind === "spiegel") { const dn = dot(d, mN); if (dn > 0) break;   // Rückseite des Spiegels: Licht wird verschluckt
        d = [d[0] - 2 * dn * mN[0], d[1] - 2 * dn * mN[1]]; p = q; k *= .95; continue; }
      const N = best.e.n, ent = dot(d, N) < 0, n1 = ent ? 1 : nP, n2 = ent ? nP : 1, nn = ent ? N : [-N[0], -N[1]];
      const ci = -dot(d, nn), eta = n1 / n2, s2 = eta * eta * (1 - ci * ci), refl = [d[0] + 2 * ci * nn[0], d[1] + 2 * ci * nn[1]];
      if (best.e.i === 1 && !ent && R.gen === 0 && !out.hyp) out.hyp = {q, nn, a: Math.acos(Math.min(1, ci)) / DEG, tir: s2 > 1};
      if (s2 > 1) { d = refl; p = q; continue; }   // Totalreflexion
      const ct = Math.sqrt(1 - s2), rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct), Rf = (rs * rs + rp * rp) / 2;
      if (R.gen === 0 && k * Rf > .08) rays.push({p: q, d: refl, k: k * Rf, gen: 1});   // sichtbare Teilreflexion
      d = [eta * d[0] + (eta * ci - ct) * nn[0], eta * d[1] + (eta * ci - ct) * nn[1]]; p = q; k *= 1 - Rf;
    }
  }
  return out;
}
const N_PR = [1.5, 1.33];
function drawRaetsel(g, w, h, v, t, ok){
  g.fillStyle = "#10131a"; g.fillRect(0, 0, w, h);
  const neig = v.n, glas = v.p === 0, a = 90 - neig, tr = trace(neig, N_PR[v.p]), beam = "#ff6a4a";
  // Boden, Lampe, Spiegelhalter, Schlossplatte
  line(g, [[20, 492], [880, 492]], "#3a4258", 4);
  g.fillStyle = "#1c2232"; g.beginPath(); g.roundRect(718, 286, 170, 206, 14); g.fill(); g.strokeStyle = "#4a5674"; g.lineWidth = 3; g.stroke();   // Platte breit genug für „zu wenig Licht“
  g.fillStyle = "#59617a"; g.beginPath(); g.roundRect(30, 395, 70, 50, 8); g.fill(); g.fillStyle = "#8a93ad"; g.fillRect(96, 408, 10, 24); line(g, [[65, 445], [65, 492]], "#59617a", 8);
  txt(g, "Lampe", 65, 374, 22, "#e8ecf6"); line(g, [[MP[0], MP[1] + 8], [MP[0], 492]], "#59617a", 7);
  // Zielrichtung zum Prisma mit dem nötigen Winkel zwischen den Strahlen (ZIEL)
  dash(g, [MP, PE], "rgba(255,233,168,.45)", 3, [6, 8]);
  g.strokeStyle = "rgba(255,233,168,.55)"; g.lineWidth = 3; g.setLineDash([5, 6]); g.beginPath(); g.arc(MP[0], MP[1], 104, Math.PI, 2 * Math.PI - RICHT * DEG); g.stroke(); g.setLineDash([]);
  txt(g, `${ZIEL}°`, MP[0] + Math.cos((RICHT + 10) * DEG) * 130, MP[1] - Math.sin((RICHT + 10) * DEG) * 130, 24, "#ffe9a8", "center", 700);
  // Prisma
  g.fillStyle = glas ? "rgba(150,210,255,.22)" : "rgba(50,130,255,.42)"; g.strokeStyle = glas ? "#cfeaff" : "#7fb8ff"; g.lineWidth = 3;
  g.beginPath(); PRISM.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.stroke();
  if (!glas) { g.save(); g.beginPath(); PRISM.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();   // Wellenlinien nur im Prisma (um die Mitte herum)
    g.strokeStyle = "rgba(190,225,255,.6)"; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const y0 = CEN[1] + 16 - i * 16 + Math.sin(t * 2 + i) * 2, x0 = CEN[0] - 24 + i * 10; g.beginPath(); g.moveTo(x0, y0 + 6); g.quadraticCurveTo(x0 + 18, y0, x0 + 36, y0 + 6); g.stroke(); }
    g.restore(); }
  txt(g, "Umlenkprisma", 675, 100, 24, "#e8ecf6", "left", 700); txt(g, glas ? "aus Glas" : "mit Wasser gefüllt", 675, 130, 22, glas ? "#cfeaff" : "#9fd0ff", "left");
  // Spiegel mit Rückseite, Lot, Winkel
  const [mA, mB] = tr.mirror, mN = dirOf(neig + 90), md = dirOf(neig);
  g.strokeStyle = "rgba(200,210,230,.55)"; g.lineWidth = 2; for (let s = -ML + 8; s < ML; s += 14) { const p = add(MP, md, s), q = add(add(p, mN, -14), md, -8); line(g, [p, q], "rgba(200,210,230,.55)", 2); }
  line(g, [mA, mB], "#e9f1ff", 7);
  dash(g, [[MP[0] + 20, MP[1]], [MP[0] + 125, MP[1]]], "rgba(232,236,246,.55)", 2, [6, 6]);
  g.strokeStyle = "#9fe6c0"; g.lineWidth = 3; g.beginPath(); g.arc(MP[0], MP[1], 62, -neig * DEG, 0); g.stroke();
  txt(g, `Neigung ${neig}°`, MP[0] + 78, MP[1] + 34, 24, "#9fe6c0", "left", 700);
  dash(g, [MP, add(MP, mN, 128)], "#e8ecf6", 3, [9, 7]); const lp = add(MP, mN, 146); txt(g, "Lot", lp[0], lp[1], 22, "#e8ecf6");
  const arcA = (from, to, lab, r, at) => { g.strokeStyle = "#ffd27a"; g.lineWidth = 3; g.beginPath(); g.arc(MP[0], MP[1], r, -from * DEG, -to * DEG, true); g.stroke();
    const mid = (at ?? (from + to) / 2) * DEG; txt(g, lab, MP[0] + Math.cos(mid) * (r + 20), MP[1] - Math.sin(mid) * (r + 20), 24, "#ffd27a"); };
  // kleine Winkel (steiler Spiegel): Beschriftung außen neben die Strahlen, sonst liegen α und α' übereinander auf den Strahlen
  arcA(neig + 90, 180, "α", 44, a < 30 ? 196 : null); arcA(2 * neig, neig + 90, "α'", 44, a < 30 ? 2 * neig - 16 : null);
  // Lichtwege (Hauptstrahl hell, Teilreflexionen schwach) mit wandernden Lichtpulsen
  g.save(); g.shadowColor = beam; g.shadowBlur = 14;
  for (const s of tr.segs) line(g, [s.a, s.b], `rgba(255,106,74,${Math.min(1, .25 + .75 * s.k).toFixed(2)})`, s.gen ? 3 : 5);
  g.restore();
  const main = tr.segs.filter(s => !s.gen), lens = main.map(s => Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])), LT = lens.reduce((x, y) => x + y, 0);
  g.fillStyle = "#fff1d6"; for (let i = 0; LT > 0 && i < 40; i++) { let s = (t * 230 + i * 85) % Math.max(LT, 1); if (i * 85 > LT) break; let j = 0; while (j < lens.length - 1 && s > lens[j]) s -= lens[j++];
    const S = main[j], f = Math.min(1, s / Math.max(lens[j], 1e-6)); g.beginPath(); g.arc(S.a[0] + (S.b[0] - S.a[0]) * f, S.a[1] + (S.b[1] - S.a[1]) * f, 3.5, 0, 7); g.fill(); }
  // Lot und Winkel an der langen Prismenseite
  if (tr.hyp) { const {q, nn} = tr.hyp; dash(g, [add(q, nn, 42), add(q, nn, -42)], "rgba(232,236,246,.8)", 2, [6, 5]);
    const lab = add(add(q, nn, 30), [nn[1], -nn[0]], -26); txt(g, `${Math.round(tr.hyp.a)}°`, lab[0], lab[1], 22, "#e8ecf6", "center", 700); }
  // Sensor und Schloss
  const lit = tr.sensor >= .5 ? 2 : tr.sensor > .03 ? 1 : 0;
  if (lit) { const gr = g.createRadialGradient(SEN[0], SEN[1], 4, SEN[0], SEN[1], 58); gr.addColorStop(0, lit === 2 ? "rgba(120,255,170,.9)" : "rgba(255,190,90,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(SEN[0], SEN[1], 58, 0, 7); g.fill(); }
  g.fillStyle = lit === 2 ? "#7dffb0" : lit ? "#c9934a" : "#2a3142"; g.beginPath(); g.arc(SEN[0], SEN[1], SR, 0, 7); g.fill(); g.strokeStyle = "#cfd6e6"; g.lineWidth = 3; g.stroke();
  txt(g, "Sensor", SEN[0], SEN[1] + 36, 22, "#e8ecf6");
  lockIcon(g, SEN[0], 440, 52, ok, ok ? "#5fd38d" : "#ff5a48");
  txt(g, ok ? "offen" : lit === 1 ? "zu wenig Licht" : lit === 2 ? "volles Licht" : "kein Licht", SEN[0], 478, 22, ok || lit === 2 ? "#5fd38d" : "#ffb3a8", "center", 700);
  // Titel und Fußzeile mit den Winkeln am Spiegel
  txt(g, "Das Spiegelschloss", 24, 32, 26, "#ffe9a8", "left", 700);
  txt(g, `Am Spiegel: α = α' = ${a}°`, 24, 518, 24, "#ffd27a", "left", 700);
  txt(g, `Winkel zwischen den Strahlen: ${2 * a}°`, 350, 518, 24, 2 * a === ZIEL ? "#7dffb0" : "#e8ecf6", "left", 600);
}
const raetsel = {
  titel: "Das Spiegelschloss",
  text: "Das Schloss öffnet sich nur, wenn **volles Licht** auf seinen Sensor fällt. Die Lampe strahlt waagrecht auf einen drehbaren Spiegel. Von dort muss das Licht **senkrecht** in das Umlenkprisma eintreten – dafür müssen einfallender und reflektierter Strahl am Spiegel einen Winkel von **132°** einschließen. Im Prisma soll das Licht durch **Totalreflexion** zum Sensor umgelenkt werden. Stelle den Spiegel ein und wähle das passende Prisma.",
  regler: [{id: "n", name: "Neigung des Spiegels gegen die Waagrechte", einheit: "°", min: 10, max: 80, schritt: 2, wert: 70},
           {id: "p", name: "Umlenkprisma", optionen: ["aus Glas", "Hohlprisma mit Wasser"], wert: 1}],
  zeichne: drawRaetsel,
  pruefe(v){
    const a = 90 - v.n, ang = 2 * a;
    if (v.n === 66) return {ok: false, text: "Bei einer Neigung von 66° beträgt der Winkel zwischen Strahl und **Spiegelfläche** 66°. Gemessen wird aber zum **Lot**: α = 90° − 66° = 24°. Dann schließen einfallender und reflektierter Strahl nur 2 · 24° = 48° ein statt 132° – der Strahl verfehlt das Prisma."};
    if (v.n !== NEIG) return {ok: false, text: `Bei einer Neigung von ${v.n}° trifft das Licht unter **α = 90° − ${v.n}° = ${a}°** zum Lot auf und wird unter **α' = ${a}°** reflektiert. Einfallender und reflektierter Strahl schließen also 2 · ${a}° = ${ang}° ein – nötig sind **${ZIEL}°**. Das Licht tritt deshalb nicht senkrecht ins Prisma ein und erreicht den Sensor nicht mit voller Stärke. Der Spiegel muss ${ang < ZIEL ? "**flacher**" : "**steiler**"} stehen.`};
    if (v.p === 1) return {ok: false, text: "Der Spiegel stimmt! Im Hohlprisma trifft das Licht aber unter **45°** auf die lange Seite. Der Grenzwinkel für **Wasser → Luft** beträgt ca. **49°** – 45° ist kleiner, also gibt es **keine Totalreflexion**: Der größte Teil des Lichts wird vom Lot weg aus dem Prisma hinausgebrochen, beim Sensor kommt zu wenig an."};
    return {ok: true};
  },
  tipps: ["Am Spiegel gilt **Einfallswinkel = Reflexionswinkel**, beide zum **Lot** gemessen. Einfallender und reflektierter Strahl schließen deshalb den Winkel 2 · α ein.",
          "Aus 2 · α = 132° folgt α = 66°. Das Lot steht senkrecht auf dem Spiegel – deshalb gilt: Neigung des Spiegels = 90° − α.",
          "Neigung = 90° − 66° = … · Im Prisma trifft das Licht unter 45° auf die lange Seite. Totalreflexion gibt es nur, wenn 45° größer als der Grenzwinkel ist (Glas → Luft ca. 42°, Wasser → Luft ca. 49°)."],
  loesung: {n: 24, p: 0},
  erfolg: "Bei 24° Neigung gilt α = α' = 66°: Die Strahlen schließen genau 132° ein, das Licht tritt senkrecht ins Prisma. Dort trifft es unter 45° auf die lange Seite – mehr als der Grenzwinkel von ca. 42° für Glas: **Totalreflexion**. Das volle Licht trifft den Sensor, das Schloss springt auf!"
};

/* =====================================================================
   Suchbild: Ein Nachmittag am Badesee (Seitenansicht mit Blick unter die Wasseroberfläche)
   Fehler: Kescherstiel nach unten geknickt · Spiegelbild des Segelboots aufrecht · flacher Lampenstrahl (55° > 49°) tritt aus ·
           Sonnenstrahl im Wasser vom Lot weg gebrochen · scheinbarer Fisch tiefer statt höher
   Richtig (Ablenker): Spiegelbild der Ente auf dem Kopf · steiler Lampenstrahl (15°) vom Lot weg gebrochen · reflektierter Sonnenstrahl
           mit gleichem Winkel · Warnschild „tiefer, als es aussieht“ · der echte Fisch
   ===================================================================== */
const WY = 380;   // Wasseroberfläche
function fishShape(g, x, y, s, flip){ g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.beginPath(); g.ellipse(0, 0, 34, 15, 0, 0, 7);
  g.moveTo(30, 0); g.lineTo(54, -16); g.lineTo(50, 0); g.lineTo(54, 16); g.closePath(); g.restore(); }
function duck(g, x, y, k){ g.save(); g.translate(x, y); g.scale(1, k);
  g.fillStyle = "#8a6a3a"; g.beginPath(); g.ellipse(0, -10, 24, 11, 0, 0, 7); g.fill();
  g.fillStyle = "#2f7a4a"; g.beginPath(); g.arc(-20, -28, 9, 0, 7); g.fill(); g.fillStyle = "#e8a020"; g.beginPath(); g.moveTo(-28, -28); g.lineTo(-38, -25); g.lineTo(-28, -23); g.fill();
  g.fillStyle = "#111"; g.beginPath(); g.arc(-22, -30, 1.8, 0, 7); g.fill(); g.fillStyle = "#6a4f2a"; g.beginPath(); g.moveTo(18, -14); g.lineTo(30, -20); g.lineTo(22, -8); g.fill(); g.restore(); }
function sailboat(g, dy, alpha){
  g.save(); g.globalAlpha = alpha; g.translate(0, dy);
  g.fillStyle = "#b5532e"; g.beginPath(); g.moveTo(330, 360); g.lineTo(470, 360); g.lineTo(452, 384); g.lineTo(348, 384); g.closePath(); g.fill();
  g.fillStyle = "#f4f4f0"; g.fillRect(330, 360, 140, 5);
  line(g, [[392, 362], [392, 196]], "#5a4630", 5);
  g.fillStyle = "#fbfbf6"; g.beginPath(); g.moveTo(396, 202); g.lineTo(396, 350); g.lineTo(462, 350); g.closePath(); g.fill(); g.strokeStyle = "#c9c9c0"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#e9f1fb"; g.beginPath(); g.moveTo(388, 214); g.lineTo(388, 350); g.lineTo(340, 350); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#d63a2a"; g.beginPath(); g.moveTo(392, 196); g.lineTo(416, 203); g.lineTo(392, 210); g.closePath(); g.fill();
  g.restore(); }
function beamLine(g, pts, col, w){ line(g, pts, "rgba(70,45,0,.55)", w + 4); g.save(); g.shadowColor = col; g.shadowBlur = 8; line(g, pts, col, w); g.restore();
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2, my = (y0 + y1) / 2; arrowHead(g, mx + (x1 - x0) * .06, my + (y1 - y0) * .06, Math.atan2(y1 - y0, x1 - x0), 16, col); } }
function lake(g, w, h){
  // Himmel, Sonne
  const sky = g.createLinearGradient(0, 0, 0, WY); sky.addColorStop(0, "#9fd3f5"); sky.addColorStop(1, "#e4f4ff"); g.fillStyle = sky; g.fillRect(0, 0, w, WY);
  const sg = g.createRadialGradient(560, 60, 10, 560, 60, 90); sg.addColorStop(0, "rgba(255,240,150,1)"); sg.addColorStop(.45, "rgba(255,225,100,.9)"); sg.addColorStop(1, "rgba(255,225,100,0)");
  g.fillStyle = sg; g.beginPath(); g.arc(560, 60, 90, 0, 7); g.fill(); g.fillStyle = "#ffd94a"; g.beginPath(); g.arc(560, 60, 34, 0, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,.85)"; for (const [x, y, s] of [[170, 80, 1], [880, 110, 1.2], [1080, 60, .8]]) { g.beginPath(); g.ellipse(x, y, 60 * s, 18 * s, 0, 0, 7); g.ellipse(x + 30 * s, y - 12 * s, 36 * s, 16 * s, 0, 0, 7); g.fill(); }
  // Wasser im Querschnitt, Seegrund, linkes Ufer
  const wg = g.createLinearGradient(0, WY, 0, h); wg.addColorStop(0, "#86cdee"); wg.addColorStop(1, "#2f7fb0"); g.fillStyle = wg; g.fillRect(0, WY, w, h - WY);
  g.fillStyle = "#d9c38c"; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 770); g.quadraticCurveTo(600, 760, 1200, 778); g.lineTo(1200, h); g.closePath(); g.fill();
  g.fillStyle = "#3f8a4e"; for (const x of [250, 540, 690, 1110]) { for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + k * 9, 772); g.quadraticCurveTo(x + k * 9 - 14, 740 - k * 6, x + k * 9 + 4, 700 - k * 12); g.quadraticCurveTo(x + k * 9 + 6, 740, x + k * 9 + 8, 772); g.fill(); } }
  g.fillStyle = "#8b8174"; for (const [x, y, r] of [[600, 772, 14], [622, 776, 9], [980, 778, 12]]) { g.beginPath(); g.ellipse(x, y, r * 1.4, r, 0, 0, 7); g.fill(); }
  g.fillStyle = "#b89a64"; g.beginPath(); g.moveTo(0, 352); g.lineTo(140, 352); g.quadraticCurveTo(160, 360, 166, WY); g.lineTo(196, h); g.lineTo(0, h); g.closePath(); g.fill();
  g.fillStyle = "#7cbf5a"; g.beginPath(); g.moveTo(0, 340); g.lineTo(138, 340); g.quadraticCurveTo(156, 344, 160, 356); g.lineTo(0, 356); g.closePath(); g.fill();
  // Oberfläche mit kleinen Wellen
  line(g, [[166, WY], [w, WY]], "#e9f8ff", 3); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2;
  for (const x of [230, 520, 700, 980]) { g.beginPath(); g.moveTo(x, WY + 10); g.quadraticCurveTo(x + 12, WY + 5, x + 24, WY + 10); g.stroke(); }
  // Ablenker: Ente mit richtigem (umgedrehtem) Spiegelbild
  duck(g, 290, WY - 2, 1); g.save(); g.globalAlpha = .4; duck(g, 290, WY + 2, -1); g.restore();
  // Fehler: Spiegelbild des Segelboots aufrecht (nur nach unten verschoben statt gespiegelt)
  sailboat(g, 0, 1);
  g.save(); g.beginPath(); g.rect(300, WY + 2, 200, 220); g.clip(); sailboat(g, 188, .42); g.restore();
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 2; for (let y = WY + 30; y < 575; y += 34) { g.beginPath(); g.moveTo(340, y); g.lineTo(460, y); g.stroke(); }
  // Junge mit Kescher am Ufer – Fehler: Stiel unter Wasser nach unten (steiler) geknickt
  g.fillStyle = "#2c5aa0"; g.fillRect(64, 286, 30, 40); g.fillStyle = "#30343c"; g.fillRect(66, 324, 11, 18); g.fillRect(81, 324, 11, 18);
  g.fillStyle = "#f1c9a0"; g.beginPath(); g.arc(79, 270, 15, 0, 7); g.fill(); g.fillStyle = "#6b4a2a"; g.beginPath(); g.arc(79, 264, 15, Math.PI, 0); g.fill();
  line(g, [[90, 300], [116, 292]], "#f1c9a0", 7);
  line(g, [[110, 292], [200, WY]], "#8a5a32", 7);
  line(g, [[200, WY], [222, 500]], "#7c6040", 7);
  g.strokeStyle = "#5c6470"; g.lineWidth = 3; g.beginPath(); g.ellipse(226, 520, 18, 26, -.15, 0, 7); g.stroke();
  g.strokeStyle = "rgba(90,100,112,.55)"; g.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(212, 520 + k * 8); g.lineTo(240, 520 + k * 8); g.stroke(); }
  // Pfähle des Stegs (hinter dem Taucher)
  g.fillStyle = "#7a5634"; for (const x of [1048, 1188]) g.fillRect(x - 7, 360, 14, 420);
  // Taucher mit Lampe: steiler Strahl richtig gebrochen, flacher Strahl (55°) – Fehler: tritt aus statt Totalreflexion
  const L = [990, 640];
  g.fillStyle = "#23262e"; g.beginPath(); g.ellipse(1060, 650, 58, 16, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(1112, 646); g.lineTo(1170, 630); g.lineTo(1178, 650); g.lineTo(1115, 660); g.closePath(); g.fill();
  g.fillStyle = "#f2d33a"; g.fillRect(1040, 628, 40, 12); g.fillStyle = "#f1c9a0"; g.beginPath(); g.arc(1012, 646, 13, 0, 7); g.fill();
  g.fillStyle = "#8fd0ff"; g.beginPath(); g.ellipse(1006, 643, 7, 6, 0, 0, 7); g.fill(); line(g, [[1020, 652], [996, 642]], "#23262e", 6);
  g.fillStyle = "#c9ced8"; g.fillRect(L[0] - 10, L[1] - 6, 16, 12);
  const P1 = [920, WY], P2 = [619, WY];
  dash(g, [[P1[0], WY - 50], [P1[0], WY + 62]], "#16324a", 2.5, [8, 6]); dash(g, [[P2[0], WY - 50], [P2[0], WY + 62]], "#16324a", 2.5, [8, 6]);
  beamLine(g, [L, P1, [P1[0] - 30, WY - 83]], "#fff06a", 5);
  beamLine(g, [L, P2, [532, WY - 23]], "#fff06a", 5);
  g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.beginPath(); g.arc(P1[0], WY, 44, Math.atan2(260, 70), Math.PI / 2); g.stroke(); g.beginPath(); g.arc(P2[0], WY, 40, Math.atan2(260, 371), Math.PI / 2); g.stroke();
  otxt(g, "15°", 966, 432, 22, "#ffffff"); otxt(g, "55°", 650, 440, 22, "#ffffff");
  // Sonnenstrahl: Reflexion richtig, Brechung – Fehler: vom Lot weg statt zum Lot hin
  const S0 = [560, 60], SP = [790, WY], ang = Math.atan2(SP[0] - S0[0], SP[1] - S0[1]);
  dash(g, [[SP[0], WY - 70], [SP[0], WY + 80]], "#16324a", 2.5, [8, 6]);
  beamLine(g, [S0, SP], "#f5b800", 5);
  beamLine(g, [SP, [SP[0] + Math.sin(ang) * 82, WY - Math.cos(ang) * 82]], "#f5c840", 3.5);
  beamLine(g, [SP, [SP[0] + Math.sin(50 * DEG) * 104, WY + Math.cos(50 * DEG) * 104]], "#f5b800", 5);
  // Fisch und – Fehler – der Ort, an dem Lea ihn sieht (tiefer statt höher)
  g.fillStyle = "#ff8c2a"; fishShape(g, 760, 640, 1, false); g.fill(); g.fillStyle = "#111"; g.beginPath(); g.arc(738, 636, 3, 0, 7); g.fill();
  g.save(); g.setLineDash([8, 6]); g.strokeStyle = "rgba(255,240,220,.95)"; g.lineWidth = 3; g.fillStyle = "rgba(255,150,60,.28)"; fishShape(g, 765, 728, 1, false); g.fill(); g.stroke(); g.restore();
  otxt(g, "Hier sieht Lea", 696, 716, 21, "#ffffff", "right"); otxt(g, "den Fisch", 696, 742, 21, "#ffffff", "right");
  // Steg mit Lea und Warnschild (Ablenker: richtig)
  g.fillStyle = "#a07444"; g.fillRect(1035, 346, 165, 16); g.fillStyle = "#86603a"; for (let x = 1035; x < 1200; x += 24) g.fillRect(x, 346, 2, 16);
  line(g, [[1072, 345], [1060, 380], [1052, 410]], "#30343c", 8); line(g, [[1084, 345], [1074, 382], [1068, 412]], "#30343c", 8);
  g.fillStyle = "#d9465a"; g.beginPath(); g.roundRect(1064, 290, 34, 56, 8); g.fill(); g.fillStyle = "#f1c9a0"; g.beginPath(); g.arc(1080, 274, 15, 0, 7); g.fill();
  g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(1082, 268, 15, Math.PI * .9, Math.PI * 2.05); g.fill();
  line(g, [[1032, 244], [1032, 346]], "#6b4a2a", 7); line(g, [[1186, 244], [1186, 346]], "#6b4a2a", 7);
  g.fillStyle = "#fff6d8"; g.beginPath(); g.roundRect(1020, 116, 178, 130, 10); g.fill(); g.strokeStyle = "#c0392b"; g.lineWidth = 5; g.stroke();
  txt(g, "Achtung!", 1109, 140, 24, "#c0392b", "center", 800); txt(g, "Das Wasser ist", 1109, 171, 21, "#222", "center", 700);
  txt(g, "tiefer, als es", 1109, 197, 21, "#222", "center", 700); txt(g, "aussieht!", 1109, 223, 21, "#222", "center", 700);
}
const suchbild = {
  titel: "Ein Nachmittag am Badesee",
  text: "Lea sitzt am Steg und schaut über den Badesee – das Bild zeigt auch, was unter der Wasseroberfläche passiert. Darin stecken **fünf Fehler** bei Spiegelbildern und Lichtwegen. Klicke sie an und begründe, was falsch ist.",
  ort: {x: 5.0, z: 4.3, ry: -1.07},   // rechts zwischen Station 2 und dem Kerzenversuch, schräg zum Eingang (vom Labor an der Scheibe aus sichtbar)
  zeichne: lake,
  fehler: [
    {x: 210, y: 450, r: 75, name: "Der Kescher im Wasser", frage: "Was ist am Kescherstiel falsch gezeichnet?",
     optionen: ["Unter Wasser müsste der Stiel unsichtbar sein.", "Der Teil unter Wasser müsste flacher erscheinen – der Stiel wirkt nach oben geknickt, nicht nach unten.",
                "Ein Stiel sieht unter Wasser immer ganz gerade aus.", "Unter Wasser müsste der Stiel doppelt so dick aussehen."], richtig: 1,
     erklaerung: "Licht vom eingetauchten Teil wird beim Übergang **Wasser → Luft vom Lot weg** gebrochen. Das Auge verfolgt die ankommenden Strahlen geradlinig zurück – der Teil unter Wasser erscheint **angehoben**. Der Stiel wirkt deshalb an der Oberfläche **nach oben** geknickt.",
     warum: ["Klares Wasser ist durchsichtig: Licht vom eingetauchten Stiel gelangt durch die Oberfläche zu deinem Auge. Du siehst den Stiel also – nur an einer verschobenen Stelle.", null,
             "Schaust du schräg von der Seite, trifft das Licht vom eingetauchten Teil schräg auf die Oberfläche und wird dort gebrochen – deshalb sieht der Stiel geknickt aus, nicht gerade.",
             "Die Brechung an der ebenen Wasseroberfläche verschiebt vor allem, **wo** du den Stiel siehst – doppelt so dick wird er dadurch nicht. Achte auf die Richtung des Knicks."]},
    {x: 400, y: 482, r: 85, name: "Das Spiegelbild des Segelboots", frage: "Was stimmt am Spiegelbild des Segelboots nicht?",
     optionen: ["Auf einem See gibt es keine Spiegelbilder.", "Das Spiegelbild müsste kleiner sein als das Boot.",
                "Das Spiegelbild müsste auf dem Kopf stehen: Die Mastspitze ist am weitesten über dem Wasser – ihr Bild also am weitesten darunter.", "Das Spiegelbild müsste neben dem Boot liegen, nicht darunter."], richtig: 2,
     erklaerung: "Die glatte Wasseroberfläche wirkt wie ein waagrechter **ebener Spiegel**. Jeder Bildpunkt liegt genauso weit **unter** der Oberfläche wie der Gegenstandspunkt **darüber**: Das Bild ist gleich groß, aber oben und unten sind vertauscht – so wie bei der Ente. (Beim senkrechten Wandspiegel sind dagegen vorn und hinten vertauscht, dort steht das Bild aufrecht.)",
     warum: ["Eine glatte Wasseroberfläche reflektiert einen Teil des Lichts gerichtet – wie ein ebener Spiegel. Die Ente daneben hat ja auch ein Spiegelbild.",
             "Ein ebener Spiegel – auch eine glatte Wasseroberfläche – liefert ein **gleich großes** Bild. Die Größe stimmt hier; der Fehler steckt woanders.", null,
             "Jeder Bildpunkt liegt **senkrecht unter** seinem Gegenstandspunkt, genauso tief unter der Oberfläche wie dieser darüber. Das Bild gehört also direkt unter das Boot – das stimmt hier."]},
    {x: 585, y: 365, r: 60, name: "Der flache Strahl der Taucherlampe", frage: "Was ist am flachen Lichtstrahl falsch?",
     optionen: ["Sein Einfallswinkel beträgt 55° – mehr als der Grenzwinkel von ca. 49°. Er müsste totalreflektiert werden und im Wasser bleiben.", "Er müsste beim Austritt zum Lot hin gebrochen werden.",
                "Unter Wasser kann eine Lampe gar nicht leuchten.", "Er müsste ohne Knick geradeaus in die Luft weiterlaufen."], richtig: 0,
     erklaerung: "Beim Übergang **Wasser → Luft** gibt es oberhalb des **Grenzwinkels** (ca. 49°) keinen gebrochenen Strahl mehr: Das Licht wird **totalreflektiert** und läuft im Wasser schräg nach unten weiter. Der steile Strahl (15°) ist richtig gezeichnet: Er tritt aus und wird **vom Lot weg** gebrochen.",
     warum: [null, "Beim Übergang ins optisch **dünnere** Medium (Wasser → Luft) wird Licht vom Lot **weg** gebrochen, nie zum Lot hin. Und bei 55° kommt es gar nicht erst heraus.",
             "Licht breitet sich auch im Wasser aus – Taucherlampen funktionieren. Entscheidend ist, was an der Wasseroberfläche mit dem Licht passiert.",
             "Ohne Knick geht nur Licht durch die Grenzfläche, das **senkrecht** auftrifft (Einfallswinkel 0°). Dieser Strahl trifft sehr schräg auf."]},
    {x: 835, y: 428, r: 60, name: "Der Sonnenstrahl im Wasser", frage: "Was stimmt am Sonnenstrahl nicht?",
     optionen: ["Sonnenlicht wird an Wasser nie gebrochen.", "Der reflektierte Strahl ist falsch – er müsste steiler nach oben gehen.",
                "Nichts – Licht wird beim Eintritt ins Wasser vom Lot weg gebrochen.", "Beim Übergang Luft → Wasser wird Licht zum Lot hin gebrochen: Der Strahl im Wasser müsste steiler verlaufen."], richtig: 3,
     erklaerung: "Wasser ist optisch **dichter** als Luft. Beim schrägen Eintritt wird das Licht deshalb **zum Lot hin** gebrochen: Bei einem Einfallswinkel von etwa 36° beträgt der Brechungswinkel nur etwa 26°. Gezeichnet ist der Strahl aber vom Lot weg gebrochen. Der reflektierte Strahl stimmt: **Reflexionswinkel = Einfallswinkel**.",
     warum: ["Jedes Licht – auch Sonnenlicht – wird beim **schrägen** Übergang zwischen Luft und Wasser gebrochen. Nur senkrecht einfallendes Licht knickt nicht ab.",
             "Der reflektierte Strahl ist richtig: Er schließt mit dem gestrichelten Lot denselben Winkel ein wie der einfallende Strahl (Reflexionsgesetz).",
             "Vom Lot weg wird Licht beim Übergang ins optisch **dünnere** Medium gebrochen, also beim Austritt aus dem Wasser. Beim Eintritt ins dichtere Wasser ist es umgekehrt.", null]},
    {x: 765, y: 728, r: 60, name: "Der Fisch, wie Lea ihn sieht", frage: "Was ist an der Stelle, an der Lea den Fisch sieht, falsch?",
     optionen: ["Lea müsste den Fisch genau dort sehen, wo er wirklich schwimmt.", "Lea sieht den Fisch nicht tiefer, sondern höher, als er wirklich ist.",
                "Durch die Wasseroberfläche kann Lea den Fisch gar nicht sehen.", "Lea müsste den Fisch seitenverkehrt sehen."], richtig: 1,
     erklaerung: "Licht vom Fisch wird an der Oberfläche **vom Lot weg** gebrochen. Leas Auge verfolgt die Strahlen geradlinig zurück und sieht den Fisch dort, wo ihre Verlängerung hinführt – **höher**, als er wirklich ist (**scheinbare Hebung**). Darum stimmt das Schild: Das Wasser ist tiefer, als es aussieht.",
     warum: ["Das wäre nur so, wenn das Licht ohne Knick aus dem Wasser käme. Es trifft aber schräg auf die Oberfläche und wird gebrochen – Lea sieht den Fisch an einer verschobenen Stelle.", null,
             "Licht vom Fisch, das nicht zu schräg auf die Oberfläche trifft, tritt in die Luft aus: Totalreflexion gibt es erst bei Einfallswinkeln über ca. 49°. Darum kann Lea den Fisch sehen.",
             "Die Brechung an der ebenen Oberfläche verschiebt nur, **wo** Lea den Fisch sieht – sie vertauscht keine Seiten. Vertauscht (vorn und hinten) ist ein Bild nur im Spiegel."]}
  ],
  // richtig dargestellte Details: Klick erklärt, warum sie stimmen (keine Überlappung mit den Fehlerkreisen)
  ablenker: [
    {x: 298, y: 370, r: 40, text: "Das Spiegelbild der Ente ist richtig: Die glatte Wasseroberfläche wirkt wie ein waagrechter ebener Spiegel. Der Kopf der Ente liegt im Bild genauso weit **unter** der Oberfläche wie in Wirklichkeit **darüber** – das Bild steht auf dem Kopf."},
    {x: 940, y: 398, r: 46, text: "Der steile Strahl der Taucherlampe ist richtig: 15° ist kleiner als der Grenzwinkel (ca. 49°). Das Licht tritt in die Luft aus und wird dabei **vom Lot weg** gebrochen – in der Luft verläuft es flacher."},
    {x: 818, y: 328, r: 40, text: "Der an der Oberfläche reflektierte Teil des Sonnenlichts ist richtig gezeichnet: Er schließt mit dem gestrichelten **Lot** denselben Winkel ein wie der einfallende Strahl – **Reflexionswinkel = Einfallswinkel**."},
    {x: 1109, y: 181, r: 75, text: "Das Schild hat recht: Wegen der Lichtbrechung an der Oberfläche schätzt man die Wassertiefe von oben falsch ein – der Grund wirkt **angehoben**. Wer nicht sicher schwimmen kann, verliert deshalb leicht den Boden unter den Füßen."},
    {x: 772, y: 624, r: 40, text: "Hier schwimmt der Fisch wirklich – richtig gezeichnet. Prüfe lieber das gestrichelte Bild darunter: Liegt es dort, wo Lea den Fisch sehen würde?"}
  ],
  abschluss: "Am See zeigt sich die Optik dieses Raums: Die glatte Wasseroberfläche **spiegelt** (das Bild steht auf dem Kopf), Licht wird beim Eintritt ins Wasser **zum Lot hin** und beim Austritt **vom Lot weg** gebrochen – und über ca. **49°** bleibt es durch **Totalreflexion** im Wasser."
};

/* =====================================================================
   Rechenwerkstatt: Winkel am ebenen Spiegel und Abstand zum Spiegelbild
   Größen: α Einfallswinkel (zum Lot), ε Winkel zwischen Strahl und Spiegelfläche, δ Winkel zwischen einfallendem und reflektiertem Strahl,
           g Abstand vom Spiegel, d Abstand zum eigenen Spiegelbild. Brechung bleibt qualitativ (keine Rechnung).
   ===================================================================== */
const rechenweg = [
  {titel: "Der Winkel zum Spiegel", text: "Bei einem Versuch mit der optischen Scheibe trifft ein Lichtstrahl unter einem Winkel von 32° zur Spiegelfläche auf einen ebenen Spiegel. Wie groß ist der Einfallswinkel?",
   gegeben: [{g: "ε", wert: 32, einheit: "°", name: "Winkel zur Spiegelfläche"}],
   gesucht: {g: "α", einheit: "°", name: "Einfallswinkel"},
   formel: "α = 90° − ε",
   formelAblenker: [{f: "α = ε", warum: "Dann wäre der Einfallswinkel zur **Spiegelfläche** gemessen. Er wird aber zum **Lot** gemessen – und das Lot steht senkrecht auf dem Spiegel."},
                    {f: "α = 180° − ε", warum: "Lot und Spiegelfläche schließen **90°** ein, nicht 180°. Winkel zur Spiegelfläche und Einfallswinkel ergänzen sich deshalb zu 90°."}],
   umgestellt: "α = 90° − ε", einsetzen: "α = 90° − 32°", ergebnis: {wert: 58, einheit: "°", toleranz: 0},
   tipps: ["Winkel misst man zum Lot. Lot und Spiegelfläche stehen senkrecht aufeinander: α + ε = 90°.", "α = 90° − 32°", "90 − 32 = …"],
   loesung: "α = 90° − ε = 90° − 32° = 58°",
   antwort: "Der Einfallswinkel beträgt 58°.", antwortAnfang: "Der Einfallswinkel …"},
  {titel: "Die Lichtschranke", text: "Für eine Lichtschranke soll ein Lichtstrahl an einem ebenen Spiegel so umgelenkt werden, dass einfallender und reflektierter Strahl einen Winkel von 110° einschließen. Wie groß muss der Einfallswinkel sein?",
   gegeben: [{g: "δ", wert: 110, einheit: "°", name: "Winkel zwischen den Strahlen"}],
   gesucht: {g: "α", einheit: "°", name: "Einfallswinkel"}, symbole: [{g: "ε", name: "Winkel zur Spiegelfläche"}],
   formel: "δ = 2 · α",
   formelAblenker: [{f: "δ = α", warum: "α ist nur der Winkel auf **einer** Seite des Lots. Auf der anderen Seite liegt der gleich große Reflexionswinkel – zusammen also α + α = 2 · α."},
                    {f: "δ = 90° − α", warum: "90° − α ist der Winkel zwischen Strahl und **Spiegelfläche**. Gesucht ist der Winkel zwischen den beiden Strahlen: Einfallswinkel plus Reflexionswinkel."}],
   umgestellt: "α = δ : 2",
   umstellAblenker: [{f: "α = 2 · δ", warum: "Der Winkel zwischen den Strahlen ist doppelt so groß wie α – also ist α **halb** so groß wie δ, nicht doppelt so groß."},
                     {f: "α = δ − 2", warum: "Die 2 ist ein **Faktor** (2 mal α), kein Summand. Um sie wegzubekommen, teilst du beide Seiten durch 2."}],
   umstellWeg: "δ = 2 · α  | : 2  →  δ : 2 = α  →  α = δ : 2",
   einsetzen: "α = 110° : 2", ergebnis: {wert: 55, einheit: "°", toleranz: 0},
   tipps: ["Auf beiden Seiten des Lots liegt derselbe Winkel: δ = 2 · α. Stelle nach α um.", "α = 110° : 2", "110 : 2 = …"],
   loesung: "α = δ : 2 = 110° : 2 = 55°",
   antwort: "Der Einfallswinkel muss 55° betragen.", antwortAnfang: "Der Einfallswinkel …"},
  {titel: "Vor dem Spiegel beim Friseur", text: "Jonas sitzt beim Friseur vor einem großen Wandspiegel. Der Abstand zwischen Jonas und seinem Spiegelbild beträgt 160 cm. Wie weit sitzt Jonas vor dem Spiegel? Gib das Ergebnis in m an.",
   gegeben: [{g: "d", wert: 160, einheit: "cm", name: "Abstand zum Spiegelbild", si: {wert: 1.6, einheit: "m"}}],
   gesucht: {g: "g", einheit: "m", name: "Abstand vom Spiegel"},
   formel: "d = 2 · g",
   formelAblenker: [{f: "d = g", warum: "g ist nur der Weg bis zum Spiegel. Das Bild liegt noch einmal **genauso weit dahinter** – der Abstand zum Bild ist also doppelt so groß."},
                    {f: "d = g : 2", warum: "Das Spiegelbild liegt nicht vor dem Spiegel, sondern **hinter** ihm. Der Abstand zum Bild ist deshalb größer als g, nicht kleiner."}],
   umgestellt: "g = d : 2",
   umstellAblenker: [{f: "g = 2 · d", warum: "Jonas sitzt näher am Spiegel als an seinem Bild – g muss **kleiner** sein als d. Aus d = 2 · g folgt g = d : 2."},
                     {f: "g = d − 2", warum: "Die 2 ist ein Faktor: Um 2 · g aufzulösen, teilst du durch 2 – abziehen hilft hier nicht."}],
   umstellWeg: "d = 2 · g  | : 2  →  d : 2 = g  →  g = d : 2",
   einsetzen: "g = 1,6 m : 2", ergebnis: {wert: 0.8, einheit: "m"},
   tipps: ["Rechne zuerst um: 160 cm = 1,6 m (1 m = 100 cm). Das Bild liegt so weit hinter dem Spiegel wie Jonas davor: d = 2 · g.", "g = d : 2 = 1,6 m : 2", "1,6 : 2 = 0,…"],
   loesung: "g = d : 2 = 1,6 m : 2 = 0,8 m",
   antwort: "Jonas sitzt 0,8 m vor dem Spiegel.", antwortAnfang: "Jonas sitzt …", einheitAuch: ["cm", "mm"],
   plausibel: {frage: "Ist 0,8 m plausibel?", optionen: ["Ja – der Abstand zum Spiegel ist halb so groß wie der Abstand zum Spiegelbild: 0,8 m + 0,8 m = 1,6 m.", "Nein – Jonas müsste 1,6 m vor dem Spiegel sitzen, so weit ist ja sein Bild weg.",
       "Nein – vor einem Spiegel sitzt man immer genau 1 m entfernt.", "Ja – denn 0,8 m sind 8 cm, das passt zu einem Friseurspiegel."], richtig: 0,
     warum: [null, "1,6 m ist der Abstand bis zum **Bild** – davon liegt nur die Hälfte vor dem Spiegel, die andere Hälfte dahinter.", "Einen festen Abstand gibt es nicht. Entscheidend ist: Bild und Gegenstand sind gleich weit vom Spiegel entfernt.",
             "0,8 m sind 80 cm, nicht 8 cm (1 m = 100 cm). Das Ergebnis stimmt zwar, die Begründung aber nicht."],
     erklaerung: "Probe: Jonas sitzt 0,8 m vor dem Spiegel, sein Bild liegt 0,8 m dahinter – zusammen 1,6 m = 160 cm."}},
  {titel: "Das Spiegel-Labyrinth", text: "In einem Spiegel-Labyrinth soll ein Lichtstrahl an einem ebenen Spiegel umgelenkt werden: Einfallender und reflektierter Strahl sollen einen Winkel von 100° einschließen. Unter welchem Winkel zur Spiegelfläche muss der Strahl auf den Spiegel treffen?",
   gegeben: [{g: "δ", wert: 100, einheit: "°", name: "Winkel zwischen den Strahlen"}],
   gesucht: {g: "ε", einheit: "°", name: "Winkel zur Spiegelfläche"}, symbole: [{g: "α", name: "Einfallswinkel"}],
   formel: "δ = 2 · (90° − ε)",
   formelAblenker: [{f: "δ = 2 · ε", warum: "ε wird zur **Spiegelfläche** gemessen. Das Reflexionsgesetz gilt aber für die Winkel zum **Lot**: zuerst α = 90° − ε, dann δ = 2 · α."},
                    {f: "δ = 90° − 2 · ε", warum: "Hier wird nur ε verdoppelt. Verdoppelt werden muss aber der ganze Einfallswinkel α = 90° − ε – deshalb steht er in Klammern."}],
   umgestellt: "ε = 90° − δ : 2",
   umstellAblenker: [{f: "ε = δ : 2", warum: "δ : 2 ist der Einfallswinkel α, gemessen zum **Lot**. Gesucht ist der Winkel zur Spiegelfläche: ε = 90° − α."},
                     {f: "ε = (90° − δ) : 2", warum: "Die Klammer stimmt nicht: Zuerst wird δ halbiert (das ergibt α), danach wird α von 90° abgezogen. Mit δ = 100° käme sonst sogar ein negativer Winkel heraus."}],
   umstellWeg: "δ = 2 · (90° − ε)  | : 2  →  δ : 2 = 90° − ε  | + ε  →  δ : 2 + ε = 90°  | − δ : 2  →  ε = 90° − δ : 2",
   einsetzen: "ε = 90° − 100° : 2", ergebnis: {wert: 40, einheit: "°", toleranz: 0},
   tipps: ["Zwei Schritte in einer Formel: α = δ : 2 (Reflexionsgesetz), dann ε = 90° − α. Zusammen: ε = 90° − δ : 2.", "ε = 90° − 100° : 2", "Punkt vor Strich: 100 : 2 = 50, dann 90 − 50 = …"],
   loesung: "ε = 90° − δ : 2 = 90° − 100° : 2 = 90° − 50° = 40°",
   antwort: "Der Strahl muss unter 40° zur Spiegelfläche auf den Spiegel treffen.", antwortAnfang: "Der Strahl muss …",
   plausibel: {frage: "Mach die Probe: Passt ε = 40° zu den 100° zwischen den Strahlen?", optionen: ["Ja: α = 90° − 40° = 50°, und 2 · 50° = 100°.", "Nein: Mit ε = 40° schließen die Strahlen 2 · 40° = 80° ein.",
       "Nein: ε muss genauso groß sein wie δ, also 100°.", "Das lässt sich nicht prüfen, weil der Reflexionswinkel fehlt."], richtig: 0,
     warum: [null, "Verdoppelt wird der Einfallswinkel α zum **Lot**, nicht der Winkel ε zur Spiegelfläche: α = 90° − 40° = 50°, also 2 · 50° = 100°.",
             "Zwischen Strahl und Spiegelfläche können höchstens 90° liegen – ε = 100° ist unmöglich. ε und δ sind verschiedene Winkel.",
             "Den Reflexionswinkel kennst du: Nach dem Reflexionsgesetz ist er genauso groß wie der Einfallswinkel α = 90° − 40° = 50°."],
     erklaerung: "Probe in der Ausgangsformel: δ = 2 · (90° − 40°) = 2 · 50° = 100° – das Ergebnis stimmt."}}
];
const umstellen = [
  {formel: "α = 90° − ε", loesung: "ε = 90° − α", text: "Einfallswinkel α (zum Lot) und Winkel ε zur Spiegelfläche ergänzen sich zu 90°.",
   typisch: [{f: "ε = α − 90°", warum: "Dann wäre ε für jeden Einfallswinkel unter 90° **negativ**. Aus α + ε = 90° folgt durch Abziehen von α: ε = 90° − α."},
             {f: "ε = 90° + α", warum: "ε und α ergänzen sich zu 90° – ε kann also nicht größer als 90° sein. Bringst du α auf die andere Seite, wird aus + α ein − α."}],
   weg: "α = 90° − ε  | + ε  →  α + ε = 90°  | − α  →  ε = 90° − α",
   tipps: ["Bringe ε zuerst nach links: Addiere auf beiden Seiten ε.", "α + ε = 90° – jetzt noch auf beiden Seiten α abziehen."]},
  {formel: "δ = 2 · α", loesung: "α = δ : 2", text: "δ ist der Winkel zwischen einfallendem und reflektiertem Strahl.",
   typisch: [{f: "α = 2 · δ", warum: "α ist der **halbe** Winkel zwischen den Strahlen, nicht der doppelte. Teste mit Zahlen: δ = 10° ergibt α = 5°, nicht 20°."},
             {f: "α = 2 : δ", warum: "2 : δ wird kleiner, wenn δ größer wird – α wächst aber mit δ. Richtig ist: δ durch 2 teilen."}],
   weg: "δ = 2 · α  | : 2  →  δ : 2 = α  →  α = δ : 2",
   tipps: ["α wird mit 2 malgenommen. Was ist die Umkehrung von „mal 2“?", "Teile beide Seiten durch 2."]},
  {formel: "δ = 2 · (90° − ε)", loesung: "ε = 90° − δ : 2", text: "Beides zusammen: Einfallswinkel α = 90° − ε und Winkel zwischen den Strahlen δ = 2 · α.",
   typisch: [{f: "ε = (90° − δ) : 2", warum: "Die Klammer gehört nicht um 90° − δ: Zuerst halbierst du δ (das ist α), danach ziehst du α von 90° ab. Probe mit δ = 140°: (90° − 140°) : 2 wäre negativ."},
             {f: "ε = δ : 2 − 90°", warum: "Die Vorzeichen sind vertauscht: Aus δ : 2 = 90° − ε folgt ε = 90° − δ : 2. Mit δ = 140° käme sonst −20° heraus."},
             {f: "ε = 90° − 2 · δ", warum: "Um die 2 vor der Klammer loszuwerden, musst du durch 2 **teilen**, nicht noch einmal mit 2 malnehmen."}],
   weg: "δ = 2 · (90° − ε)  | : 2  →  δ : 2 = 90° − ε  | + ε  →  δ : 2 + ε = 90°  | − δ : 2  →  ε = 90° − δ : 2",
   tipps: ["Teile zuerst beide Seiten durch 2 – dann ist die Klammer weg.", "δ : 2 = 90° − ε. Bringe ε nach links und δ : 2 nach rechts."]}
];
const fehlersuche = [
  {titel: "Der schräge Lichtstrahl", aufgabe: "Ein Lichtstrahl trifft unter einem Winkel von 28° zur Spiegelfläche auf einen ebenen Spiegel. Berechne den Reflexionswinkel.",
   zeilen: ["Gegeben: Winkel zur Spiegelfläche ε = 28°", "Gesucht: Reflexionswinkel", "Reflexionsgesetz: Reflexionswinkel = Einfallswinkel", "Einfallswinkel α = 28°", "Reflexionswinkel = 28°"], falsch: 3,
   zeilenOk: ["Die Angabe aus dem Text ist richtig übernommen: 28° zur Spiegelfläche.", "Gesucht ist tatsächlich der Reflexionswinkel.", "Das Reflexionsgesetz ist richtig angegeben."],
   optionen: ["Das Reflexionsgesetz lautet: Reflexionswinkel = 2 · Einfallswinkel.", "Die 28° müssen zuerst in eine andere Einheit umgerechnet werden.",
              "Der Winkel zur Spiegelfläche ist nicht der Einfallswinkel: Gemessen wird zum Lot, also α = 90° − 28°.", "Der Einfallswinkel beträgt immer 90°, weil das Lot senkrecht steht."], richtig: 2,
   warum: ["Das Reflexionsgesetz in Zeile 3 stimmt: Reflexionswinkel = Einfallswinkel. Das Doppelte (2 · α) ist der Winkel zwischen den beiden Strahlen.",
           "Alle Winkel sind in Grad angegeben – umrechnen muss man hier nichts.", null,
           "90° schließen Lot und Spiegelfläche ein. Der Einfallswinkel hängt davon ab, wie schräg das Licht auftrifft."],
   korrektur: {frage: "Wie groß ist der Reflexionswinkel richtig?", wert: 62, einheit: "°", toleranz: 0,
     tipps: ["Erst den Einfallswinkel zum Lot: α = 90° − ε.", "α = 90° − 28° – der Reflexionswinkel ist genauso groß."], loesung: "α = 90° − ε = 90° − 28° = 62°, also Reflexionswinkel = α = 62°"},
   erklaerung: "Winkel am Spiegel misst man immer zum **Lot**. Steht im Text der Winkel zur Spiegelfläche, rechnest du zuerst α = 90° − ε. Diesen Schritt zu vergessen, ist einer der häufigsten Fehler in Schulaufgaben."},
  {titel: "Näher an den Spiegel", aufgabe: "Mia steht 2,5 m vor einem großen Wandspiegel. Dann geht sie 40 cm auf den Spiegel zu. Wie weit ist sie jetzt von ihrem Spiegelbild entfernt?",
   zeilen: ["Gegeben: Abstand zum Spiegel 2,5 m; Mia geht 40 cm näher heran", "Gesucht: Abstand d zwischen Mia und ihrem Spiegelbild", "40 cm = 0,04 m",
            "neuer Abstand zum Spiegel: g = 2,5 m − 0,04 m = 2,46 m", "d = 2 · g = 2 · 2,46 m", "d = 4,92 m"], falsch: 2,
   zeilenOk: ["Die Angaben aus dem Text sind richtig übernommen.", "Gesucht ist der Abstand zwischen Mia und ihrem Bild – richtig erkannt."],
   optionen: ["Richtig wäre 40 cm = 4 m.", "Zentimeter darf man gar nicht in Meter umrechnen.", "Das Umrechnen ist überflüssig: Man rechnet einfach 2,5 − 40.",
              "Falsch umgerechnet: 1 m = 100 cm, also sind 40 cm = 0,4 m."], richtig: 3,
   warum: ["Ein Meter hat 100 cm. 40 cm sind weniger als ein Meter – also können es keine 4 m sein.",
           "Umrechnen ist hier sogar nötig: 2,5 m und 40 cm kann man erst voneinander abziehen, wenn beide in derselben Einheit stehen.",
           "Ohne Umrechnen zieht man Meter und Zentimeter voneinander ab – das ergäbe eine negative Länge.", null],
   korrektur: {frage: "Wie weit ist Mia richtig von ihrem Spiegelbild entfernt?", wert: 4.2, einheit: "m", toleranz: .01,
     tipps: ["40 cm = 0,4 m, also neuer Abstand zum Spiegel g = 2,5 m − 0,4 m.", "d = 2 · g = 2 · 2,1 m"], loesung: "g = 2,5 m − 0,4 m = 2,1 m; d = 2 · g = 2 · 2,1 m = 4,2 m"},
   erklaerung: "Bei Längen gilt 1 m = 100 cm (nicht 1000). Ein Ergebnis von 4,92 m hätte stutzig machen müssen: Vorher waren es 2 · 2,5 m = 5,0 m. Geht Mia 40 cm auf den Spiegel zu, rückt auch ihr Bild 40 cm näher an den Spiegel heran – der Abstand zum Bild muss also um 2 · 40 cm kleiner werden, nicht nur um 8 cm."},
  {titel: "Der umgelenkte Strahl", aufgabe: "Ein ebener Spiegel lenkt einen Lichtstrahl so um, dass einfallender und reflektierter Strahl einen Winkel von 80° einschließen. Berechne den Einfallswinkel.",
   zeilen: ["Gegeben: δ = 80° (Winkel zwischen den Strahlen)", "Gesucht: Einfallswinkel α", "δ = 2 · α", "α = 2 · δ", "α = 2 · 80° = 160°"], falsch: 3,
   zeilenOk: ["Die Angabe aus dem Text ist richtig übernommen.", "Gesucht ist der Einfallswinkel – richtig erkannt.", "Die Formel stimmt: Einfallswinkel und Reflexionswinkel sind gleich groß, zusammen 2 · α."],
   optionen: ["Falsch umgestellt: Aus δ = 2 · α folgt α = δ : 2.", "Die Formel in Zeile 3 hätte δ = α heißen müssen.", "Man muss 90° addieren: α = δ + 90°.", "Nichts – 160° ist ein möglicher Einfallswinkel."], richtig: 0,
   warum: [null, "Zeile 3 stimmt: Auf jeder Seite des Lots liegt der Winkel α, zusammen also δ = 2 · α.",
           "Die 90° braucht man nur beim Umrechnen zwischen Spiegelfläche und Lot. δ und α hängen über den Faktor 2 zusammen.",
           "Ein Einfallswinkel zum Lot ist höchstens 90° – sonst käme das Licht von hinten durch den Spiegel. 160° ist unmöglich."],
   korrektur: {frage: "Wie groß ist der Einfallswinkel richtig?", wert: 40, einheit: "°", toleranz: 0,
     tipps: ["Teile beide Seiten von δ = 2 · α durch 2.", "α = 80° : 2"], loesung: "α = δ : 2 = 80° : 2 = 40°"},
   erklaerung: "Was mit der gesuchten Größe **malgenommen** wird, musst du beim Umstellen **teilen**. Die Probe hilft: 2 · 40° = 80° stimmt – und ein Einfallswinkel über 90° ist ohnehin unmöglich."}
];
/* Rückmeldung je falscher Antwort im Quiz (Index wie in inhalt/optik1.json, Reihenfolge wie options, null an answer) */
const warum = {
  0: [null, "Eine Parallele zur Spiegelfläche liegt im Spiegel selbst. Das Lot steht dagegen senkrecht (90°) auf dem Spiegel – von ihm aus misst man die Winkel.",
      "Die Verlängerung des Strahls hängt davon ab, wie schräg das Licht kommt. Das Lot ist dagegen allein durch den Spiegel festgelegt: die Senkrechte im Auftreffpunkt.",
      "Die Winkelhalbierende zwischen Strahl und Spiegel ändert sich mit jedem Strahl. Das Lot ist immer dieselbe Linie – senkrecht zur Spiegelfläche."],
  1: [null, "Das ist der häufigste Fehler: Der Winkel zur Spiegelfläche ergänzt den Einfallswinkel nur zu 90°. Gemessen wird immer zum Lot.",
      "Zwischen einfallendem und reflektiertem Strahl liegt der doppelte Einfallswinkel (2 · α) – auf jeder Seite des Lots ein gleich großer Winkel.",
      "Lot und Spiegelfläche schließen immer 90° ein. Dieser Winkel hängt gar nicht vom Lichtstrahl ab."],
  2: [null, "Der Faktor 2 gehört zum Winkel zwischen den beiden Strahlen (2 · α). Einfallswinkel und Reflexionswinkel selbst sind gleich groß.",
      "Zu 90° ergänzen sich Einfallswinkel und Winkel zur Spiegelfläche. Einfallswinkel und Reflexionswinkel sind gleich groß – bei 10° Einfall zusammen 20°, nicht 90°.",
      "Dann würde ein Strahl mit 10° Einfallswinkel unter 170° zum Lot reflektiert – er liefe also in den Spiegel hinein statt von ihm weg. Beide Winkel zum Lot sind gleich groß."],
  3: [null, "Reflexionswinkel und Einfallswinkel sind immer gleich groß. Doppelt so groß wie der Einfallswinkel ist nur der Winkel zwischen den beiden Strahlen.",
      "Am Spiegel wird Licht jeder Farbe unter demselben Winkel reflektiert – sonst hätte dein Spiegelbild bunte Ränder.",
      "Der Winkel zwischen den beiden Strahlen beträgt 2 · α – er hängt also vom Einfallswinkel ab. Senkrecht aufeinander stehen die Strahlen nur bei einem einzigen Einfallswinkel, nicht immer."],
  4: [null, "Hinter den Spiegel gelangt kein Licht, dort kann also kein reelles Bild entstehen. Und ein ebener Spiegel verkleinert nicht – das Bild ist gleich groß.",
      "Virtuell und gleich groß stimmt, aber das Bild steht aufrecht: Dein Kopf ist auch im Spiegel oben. Vertauscht sind nur vorn und hinten.",
      "Ein reelles Bild könnte man auf einem Schirm auffangen – hinter dem Spiegel kommt aber kein Licht an. Und vergrößert wirst du im ebenen Spiegel auch nicht."],
  5: [null, "Ein Schirm hinter dem Spiegel bleibt dunkel, denn durch die Spiegelschicht kommt kein Licht. Die Strahlen scheinen nur von dort zu kommen.",
      "„Virtuell“ sagt nichts über die Größe aus. Das Bild im ebenen Spiegel ist sogar genau gleich groß wie der Gegenstand.",
      "Auch bei wenig Licht siehst du dich im Spiegel – nur dunkler. „Virtuell“ bedeutet: Das Bild ist nur scheinbar da."],
  6: [null, "Luft ist optisch am dünnsten: Licht aus der Luft wird beim Eintritt ins Wasser zum Lot hin gebrochen. Wasser muss also nach der Luft kommen.",
      "Das ist genau die umgekehrte Reihenfolge – von optisch dicht nach optisch dünn.",
      "Entscheidend ist die Brechung, nicht ob der Stoff fest oder flüssig ist: Ein schräger Strahl aus der Luft wird in Glas stärker zum Lot hin gebrochen als in Wasser. Glas ist also optisch dichter und gehört ans Ende."],
  7: [null, "Der Strahl verläuft schon genau entlang des Lots – noch näher ans Lot geht nicht. Bei 0° gibt es keinen Knick.",
      "Vom Lot weg wird Licht nur beim schrägen Übergang ins optisch dünnere Medium gebrochen. Hier geht es senkrecht ins dichtere Wasser.",
      "Totalreflexion gibt es nur beim Übergang ins optisch dünnere Medium und bei großen Einfallswinkeln. Luft → Wasser bei 0° erfüllt keine der beiden Bedingungen."],
  10: [null, "Der Badezimmerspiegel reflektiert an seiner Metallschicht hinter dem Glas – das ist gewöhnliche Reflexion, keine Totalreflexion.",
       "Eine Lupe nutzt die Brechung des Lichts an gewölbten Glasflächen: Das Licht geht durch das Glas hindurch, statt reflektiert zu werden.",
       "Ein Schatten entsteht, weil sich Licht geradlinig ausbreitet und der Stab es abhält – dafür braucht es gar keine Reflexion."],
  11: [null, "Luft → Wasser ist der Weg ins optisch dichtere Medium: Das Licht wird zum Lot hin gebrochen, und es gibt immer einen gebrochenen Strahl.",
       "Beim Eintritt ins optisch dichtere Glas wird das Licht zum Lot hin gebrochen – der Brechungswinkel erreicht nie 90°, also gibt es keine Totalreflexion.",
       "Glas ist optisch dichter als Wasser. Totalreflexion braucht den Weg vom dichteren ins dünnere Medium – Wasser → Glas ist der umgekehrte Weg."],
  12: [null, "Dann könntest du das Blatt nur aus einer einzigen Richtung sehen – und darin sogar ein Spiegelbild. Papier ist aber rau und streut das Licht.",
       "Normales Papier leuchtet im Dunkeln nicht nach: Sobald das Licht aus ist, siehst du es nicht mehr. Es wirft das Licht sofort zurück.",
       "Totalreflexion gibt es nur im Inneren eines durchsichtigen Stoffs an der Grenze zu einem optisch dünneren. Papier wirft das Licht an seiner Oberfläche zurück."],
  13: [null, "60 cm ist der Abstand zwischen Kerze und Bild: 30 cm vor dem Spiegel plus 30 cm dahinter. Hinter dem Spiegel liegt das Bild nur 30 cm.",
       "Der Spiegel halbiert den Abstand nicht. Das Bild ist genauso weit hinter dem Spiegel wie die Kerze davor.",
       "Die Lichtstrahlen scheinen von einem Punkt hinter dem Spiegel zu kommen, nicht von der Spiegelfläche. Wie im Kerzenversuch liegt das Bild so weit dahinter wie die Kerze davor."],
  15: [null, "Vom Lot weg wird Licht gebrochen, wenn es in den optisch dünneren Stoff übergeht – das ist genau umgekehrt.",
       "Optische Dichte und Massendichte sind verschiedene Dinge: Speiseöl ist leichter als Wasser (es schwimmt oben) und trotzdem optisch dichter.",
       "Wie durchsichtig ein Stoff ist, hat mit der optischen Dichte nichts zu tun: Klares Glas lässt fast alles Licht durch und ist trotzdem optisch dichter als Luft."],
  16: [null, "Größer wird der Brechungswinkel beim Übergang ins optisch dünnere Medium, etwa von Wasser in Luft. Hier geht das Licht ins dichtere Wasser.",
       "Gleich groß sind Einfalls- und Reflexionswinkel beim Spiegel. Geht Licht schräg in einen anderen Stoff über, knickt es ab.",
       "90° Brechungswinkel gibt es nur genau beim Grenzwinkel – und nur beim Übergang ins optisch dünnere Medium. Ins dichtere Wasser hinein kommt das nie vor."],
  17: [null, "Zum Lot hin wird Licht beim Eintritt ins optisch dichtere Medium gebrochen. Hier tritt es aus dem Glas in die optisch dünnere Luft.",
       "Ohne Knick läuft nur senkrecht auftreffendes Licht (0°) weiter. Bei 20° trifft der Strahl schräg auf die Grenzfläche.",
       "Für Totalreflexion müsste der Einfallswinkel größer als der Grenzwinkel sein. Mit 20° trifft das Licht noch recht steil auf die Grenzfläche – dafür ist der Winkel viel zu klein."],
  18: [null, "Nach unten geknickt wirkte er nur, wenn der Teil im Wasser tiefer erschiene. Wie beim Fisch im Aquarium wirkt alles unter Wasser aber angehoben.",
       "Gerade sähe er nur aus, wenn das Licht ohne Knick aus dem Wasser käme. Schräg von oben siehst du aber Licht, das die Oberfläche schräg verlässt – und dabei gebrochen wird.",
       "Der Teil unter Wasser wirkt angehoben und dadurch eher kürzer, nicht länger. Die Brechung verschiebt, wo du ihn siehst."],
  19: [null, "Entlang des Lots läuft Licht, das senkrecht auftrifft (Brechungswinkel 0°). Beim Grenzwinkel ist es genau umgekehrt: Der Brechungswinkel beträgt 90°.",
       "Ohne Richtungsänderung geht nur senkrecht einfallendes Licht hindurch. Beim Grenzwinkel wird der Strahl im Gegenteil besonders stark abgeknickt.",
       "Glas → Luft ist der Übergang ins optisch dünnere Medium: Das Licht wird vom Lot weg gebrochen – beim Grenzwinkel so stark, dass es die Grenzfläche streift."],
  20: [null, "Beim Eintritt ins optisch dichtere Wasser wird das Licht zum Lot hin gebrochen, nicht vom Lot weg. Vom Lot weg geht es nur beim Austritt.",
       "Ein Teil des Lichts wird an der Wasseroberfläche sehr wohl reflektiert – daher kommen die Spiegelbilder auf einem See. Nur vollständig reflektiert wird von oben nichts.",
       "Auch schräg einfallendes Licht dringt ins Wasser ein – es wird dabei zum Lot hin gebrochen. Taucher sehen auch bei tief stehender Sonne Licht von oben."],
  21: [null, "Eine Metallschicht braucht die Glasfaser nicht: Trifft das Licht flach genug auf die Wand, wird es schon durch Totalreflexion vollständig zurückgeworfen.",
       "Licht breitet sich geradlinig aus – es biegt nicht von selbst um die Kurve. In der Faser läuft es im Zickzack von Wand zu Wand.",
       "Würde das Licht an der Wand gebrochen, ginge es durch die Wand hindurch nach außen und wäre verloren. Außerdem wird Licht beim Übergang ins dünnere Medium vom Lot weg gebrochen."],
  22: [null, "Totalreflexion kann beim Übergang von Luft in Glas nie auftreten – Glas ist optisch dichter. Und am Tag siehst du durch dieselbe Scheibe hindurch.",
       "Die Scheibe ist nachts genauso durchsichtig wie am Tag: Von draußen sieht man ins helle Zimmer hinein. Es kommt nur von draußen kaum Licht herein, das dein schwaches Spiegelbild überstrahlt.",
       "Gebrochenes Licht geht durch die Scheibe hindurch nach draußen. Zurück ins Zimmer kommt nur das reflektierte Licht."],
  23: [null, "Proportional hieße: Die Kurve im α-β-Diagramm wäre eine Ursprungsgerade. Sie wird aber immer flacher – bei großen Einfallswinkeln wächst β kaum noch.",
       "Bei α = 0° ist auch β = 0°. Trifft das Licht schräger auf, verläuft es auch im Glas schräger – β wächst also mit α, nur langsamer.",
       "Dann hätte auch senkrecht einfallendes Licht (α = 0°) einen schrägen Brechungswinkel. Tatsächlich ist bei α = 0° auch β = 0°, und β wächst mit α."],
  28: [null, "Vom Lot weg in die Luft gebrochen wird das Licht nur bis zum Grenzwinkel (ca. 49°). 60° ist größer – dann gibt es keinen gebrochenen Strahl mehr.",
       "Ohne Knick ginge nur senkrecht auftreffendes Licht (0°) hindurch. Bei 60° trifft es sehr schräg auf – so schräg, dass es gar nicht mehr austritt.",
       "Wasser → Luft ist der Weg ins optisch dünnere Medium: Selbst bei kleinen Winkeln würde das Licht vom Lot weg gebrochen, nie zum Lot hin."],
  29: [null, "Der Fisch erscheint schon höher, als er wirklich ist (scheinbare Hebung). Wer noch höher zielt, verfehlt ihn erst recht.",
       "An der gesehenen Stelle ist nur das scheinbare Bild: Das Licht vom Fisch wurde an der Oberfläche geknickt. Der echte Fisch liegt tiefer.",
       "Von oben siehst du den Fisch durch die Oberfläche hindurch, nicht in ihr gespiegelt. Ein Spiegelbild läge außerdem nie dort, wo der Fisch wirklich ist."]
};

R3D.lern.raum("optik1", {
  raetsel, suchbild,
  // Rechenwerkstatt: Tafel im Raum (freie Bodenstelle vorne links, gegenüber dem Periskop) + Knopf an Station 3
  uebung: {ort: {x: -3.6, z: -9.5, ry: 0}, formel: "δ = 2 · α"},
  rechenweg, umstellen, fehlersuche, warum,
  spick: {
    kern: ["Reflexionsgesetz: **Einfallswinkel = Reflexionswinkel**, beide zum **Lot** gemessen; einfallender Strahl, Lot und reflektierter Strahl liegen in einer Ebene",
           "Glatte Flächen spiegeln (**gerichtete Reflexion**), raue Flächen streuen das Licht in alle Richtungen (**diffuse Reflexion**)",
           "Bild im ebenen Spiegel: **virtuell**, aufrecht, gleich groß – genauso weit hinter dem Spiegel wie der Gegenstand davor",
           "Brechung: Luft → Wasser oder Glas **zum Lot hin**, Wasser oder Glas → Luft **vom Lot weg**; senkrecht einfallendes Licht knickt nicht",
           "**Totalreflexion** nur ins optisch dünnere Medium, wenn der Einfallswinkel größer als der **Grenzwinkel** ist (Glas → Luft ca. 42°, Wasser → Luft ca. 49°): Lichtleiter, Umlenkprisma"],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn, warum du dich in einem Spiegel sehen kannst, in einem weißen Blatt Papier aber nicht.",
       // „rau“ allein träfe als Teilwort auch „darauf“, „heraus“, „Raum“, „grau“ – deshalb nur in Wendungen (die Anzeige „rau (uneben)“ trifft nie zufällig)
       begriffe: [["glatt"], ["rau (uneben)", "ist rau", "rau ist", "sondern rau", "raue", "rauh", "uneben"], ["Reflexionsgesetz", "Reflexionswinkel", "Einfallswinkel"], ["Lot"], ["parallel"], ["gerichtet", "geordnet", "regelmäßig"], ["diffus", "gestreut", "streut", "Streuung", "alle Richtungen"]],
       muster: "Ein Spiegel ist sehr **glatt**. Ein paralleles Lichtbündel wird nach dem **Reflexionsgesetz** (Einfallswinkel = Reflexionswinkel, zum **Lot** gemessen) wieder **parallel** zurückgeworfen – das ist die **gerichtete** Reflexion, so entsteht ein Bild. Papier ist **rau**: Auch an jedem winzigen Flächenstück gilt das Reflexionsgesetz, aber die Stückchen sind verschieden geneigt. Das Licht wird in **alle Richtungen gestreut** (**diffuse** Reflexion) – du siehst das Blatt, aber kein Spiegelbild."},
      {frage: "Erkläre deinem Banknachbarn, was mit Licht passiert, das schräg aus dem Wasser in die Luft übergeht – und warum es bei sehr flachem Auftreffen gar nicht mehr herauskommt.",
       begriffe: [["vom Lot weg", "weg vom Lot"], ["optisch dünner", "dünner", "dünneres", "dichter"], ["gebrochen", "Brechung", "bricht"], ["Einfallswinkel"], ["Grenzwinkel"], ["49"],
                  ["Totalreflexion", "totalreflektiert", "total reflektiert", "vollständig reflektiert", "vollständig zurückgeworfen"]],
       muster: "Luft ist optisch **dünner** als Wasser. Trifft Licht schräg von unten auf die Oberfläche, wird es beim Austritt **vom Lot weg gebrochen** – der Brechungswinkel ist größer als der **Einfallswinkel**. Je flacher das Licht auftrifft, desto näher kommt der gebrochene Strahl der Oberfläche. Beim **Grenzwinkel** (Wasser → Luft ca. **49°**) streift er sie gerade. Ist der Einfallswinkel noch größer, kommt kein Licht mehr heraus: Es wird vollständig zurückgeworfen – **Totalreflexion**."}
    ]
  },
  zuordnung: {
    "Die optische Scheibe": [6, 7, 8, 9, 15, 16, 17, 19, 20, 23, 27, 28],
    "Das Reflexionsgesetz": [0, 1, 2, 3, 12, 24, 25],
    "Das Bild im ebenen Spiegel": [4, 5, 13, 14, 22],
    "Scheinbare Hebung im Wasser": [18, 29],
    "Lichtleiter und Umlenkprisma": [10, 11, 21],
    "Das Periskop": [26]
  },
  hilfen: {
    8: ["Der Grenzwinkel ist der Einfallswinkel, bei dem der gebrochene Strahl genau an der Grenzfläche entlangläuft (Brechungswinkel 90°).",
        "Zum Vergleich: Für Wasser → Luft beträgt er ca. 49°. Glas ist optisch dichter als Wasser – sein Grenzwinkel ist deshalb kleiner.",
        "Schau auf die optische Scheibe oder die Tafel „Totalreflexion“: Der Wert liegt knapp über 40° – … °"],
    14: ["Dein Spiegelbild ist genauso weit hinter dem Spiegel wie du davor.", "Abstand du – Bild = Abstand zum Spiegel + gleich großer Abstand dahinter = 2 · g",
         "g = 3,6 m : 2 = … m"],
    24: ["Achtung: Winkel misst man zum Lot, nicht zur Spiegelfläche. Lot und Spiegelfläche stehen senkrecht aufeinander (90°).",
         "Einfallswinkel α = 90° − 30°", "Nach dem Reflexionsgesetz ist der Reflexionswinkel genauso groß wie α = 90° − 30° = … °"],
    25: ["Einfallswinkel und Reflexionswinkel liegen auf den beiden Seiten des Lots.", "Reflexionsgesetz: Reflexionswinkel = Einfallswinkel = 35°",
         "Winkel zwischen den Strahlen = 35° + 35° = … °"],
    26: ["Einfallender und reflektierter Strahl schließen den Winkel 2 · α ein – auf jeder Seite des Lots liegt α.", "Der einfallende Strahl ist waagrecht, der reflektierte zeigt senkrecht nach unten: Die beiden Strahlen schließen 90° ein, also 2 · α = 90°.",
         "α = 90° : 2 = … °"],
    27: ["Der Lichtweg ist umkehrbar: Läuft das Licht rückwärts, nimmt es genau denselben Weg.", "Hinweg: Luft 50° → Wasser 35°. Rückweg: Wasser 35° → Luft ?",
         "Rückwärts gehören dieselben beiden Winkel zusammen – in der Luft also … °"]
  }
});
})();
