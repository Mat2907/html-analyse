/* ---------- 40_lern_beweg2.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum Newtonsche Bewegungsgleichung (Kap. 3.4–3.5: F · Δt = m · Δv, a = Δv : Δt, F = m · a)
   Türrätsel „Das Schlitten-Schloss“ · Suchbild „Projekttag auf dem Schulhof“ (mit Begründungen und Ablenkern) · Lernzettel · Fehler → Exponat · Tipps zu Rechenaufgaben
   Rechenwerkstatt (4 Rechenwege, 3 Umstellungen, 3 Fehlersuchen) · Rückmeldung je falscher Antwort für alle Auswahlfragen
   (Das Labor sitzt am Mittelstück „Gleiche Kraft, gleiche Zeit – verschiedene Massen“, der Diagramm-Trainer am „Wagen am Wägestück“ in 20_beweg2.js.)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;

/* ---------- kleine Zeichenhilfen ---------- */
const line = (g, pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const txt = (g, s, x, y, size, col, align = "center", weight = 600) => { g.fillStyle = col; g.font = `${weight} ${size}px system-ui, sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.fillText(s, x, y); };
const de = (x, d = 2) => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(d).replace(".", ",").replace("-", "−");
// Pfeil mit Spitze; out = dunkler Rand (für hellen Hintergrund im Suchbild)
function arrow(g, x1, y1, x2, y2, col, w = 8, out = null){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 3) return;
  const a = Math.atan2(y2 - y1, x2 - x1), hl = Math.min(w * 3, L * .6), hw = .45;
  const draw = (c, ww, grow) => { g.strokeStyle = g.fillStyle = c; g.lineWidth = ww; g.lineCap = "round";
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hl * .7, y2 - Math.sin(a) * hl * .7); g.stroke();
    const h2 = hl + grow; g.beginPath(); g.moveTo(x2 + Math.cos(a) * grow * .6, y2 + Math.sin(a) * grow * .6);
    g.lineTo(x2 - Math.cos(a - hw) * h2, y2 - Math.sin(a - hw) * h2); g.lineTo(x2 - Math.cos(a + hw) * h2, y2 - Math.sin(a + hw) * h2); g.closePath(); g.fill(); };
  if (out) draw(out, w + 5, 4); draw(col, w, 0);
}
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, 7); g.fill(); }

/* =====================================================================
   Türrätsel: Das Schlitten-Schloss
   Ein Schlitten (3,0 kg) gleitet reibungsfrei mit 2,0 m/s auf die Tür zu. Eine Kraftstation wirkt 0,50 s lang mit einstellbarer Kraft
   und Richtung. Die Lichtschranke vor der Tür öffnet nur bei genau 0,50 m/s → Δv = 1,5 m/s nach hinten → F = m · Δv : Δt = 9 N entgegen.
   ===================================================================== */
const VR = 2.0, MR = 3.0, DTR = .5, VZ = .5;
const DIRN = ["in Fahrtrichtung", "quer zur Bahn", "entgegen der Fahrtrichtung"];
const sled = v => { const dv = v.F * DTR / MR; return {dv, vx: v.dir === 0 ? VR + dv : v.dir === 2 ? VR - dv : VR, vy: v.dir === 1 ? dv : 0}; };
const isOk = s => s.vy === 0 && Math.abs(s.vx - VZ) < 1e-9;
const eq = x => (Math.abs(Math.round(x * 100) / 100 - x) > 1e-9 ? "≈ " : "= ") + de(x);   // „= 1,50“ oder „≈ 0,67“

const raetsel = {
  titel: "Das Schlitten-Schloss",
  text: "Vor der Tür liegt eine glatte Gleitbahn (ohne Reibung). Ein Schlitten mit **m = 3,0 kg** gleitet mit **2,0 m/s** auf die Tür zu. Die Lichtschranke davor gibt das Schloss nur frei, " +
    "wenn er mit **genau 0,50 m/s** ankommt. Unterwegs fährt er durch eine **Kraftstation**: Sie wirkt **Δt = 0,50 s** lang mit der Kraft F, die du einstellst – in die Richtung, die du wählst.",
  regler: [{id: "F", name: "Kraft F der Kraftstation", einheit: "N", min: 0, max: 15, schritt: 1, wert: 3},
           {id: "dir", name: "Richtung der Kraft", optionen: DIRN, wert: 0}],
  zeichne(g, w, h, v, t, ok){
    g.fillStyle = "#10131a"; g.fillRect(0, 0, w, h);
    const s = sled(v), good = isOk(s), S = 130, X0 = 60, XK = 250, XG = 640, XD = 770, YC = 205, B0 = 140, B1 = 270, HW = 36, HH = 22;
    txt(g, "Schlitten-Schloss · öffnet nur bei v = 0,50 m/s", w / 2, 32, 28, "#ffe9a8", "center", 700);
    txt(g, "m = 3,0 kg  ·  vorher: v = 2,0 m/s  ·  Kraftstation: Δt = 0,50 s", w / 2, 72, 22, "#cfd6e4", "center", 500);
    // Zeitablauf (Schleife): anfahren → Kraft wirkt 0,50 s → gleichförmig weiter bis Tür, Bande, Stillstand oder links hinaus
    const tA = (XK - X0) / (VR * S), ax = (s.vx - VR) / DTR * S, ay = s.vy / DTR * S;
    const pB = u => [XK + VR * S * u + .5 * ax * u * u, YC - .5 * ay * u * u];
    const [xB, yB] = pB(DTR); let tEnd, tC = Infinity, tStop = Infinity;   // tC: Zeitpunkt, an dem der Schlitten (Kraft quer) die Bande trifft · tStop: kleine Querkraft, er erreicht vorher schräg die Tür
    if (s.vy > 0) { const uc = Math.sqrt(2 * (YC - B0 - HH) / ay); tC = uc <= DTR ? tA + uc : tA + DTR + (yB - B0 - HH) / (s.vy * S);
      const tD = uc > DTR ? tA + DTR + Math.max(0, (XD - HW - xB) / (s.vx * S)) : Infinity;
      if (tD < tC) { tStop = tD; tC = Infinity; tEnd = tD + .6; } else tEnd = tC; }
    else if (s.vx > 1e-9) tEnd = tA + DTR + Math.max(0, (XD - HW - xB) / (s.vx * S)) + (ok ? 1.2 : 0);
    else if (s.vx > -1e-9) tEnd = tA + DTR + .6;
    else tEnd = tA + DTR + (xB + 50) / (-s.vx * S);
    const T = Math.min(tEnd, 9) + 1.8, tau0 = t % T, crash = tau0 >= tC, tau = Math.min(tau0, tC, tStop);
    let x, y, push = false;
    if (tau < tA) { x = X0 + VR * S * tau; y = YC; }
    else if (tau < tA + DTR) { [x, y] = pB(tau - tA); push = !crash; }
    else { const r = tau - tA - DTR; x = xB + s.vx * S * r; y = yB - s.vy * S * r; }
    let atDoor = false;
    if (crash) y = B0 + HH;
    if (!ok && x + HW > XD - .5) { x = Math.min(x, XD - HW); atDoor = true; }
    const passed = x >= XG && s.vx > 0 && !crash;
    // Bahn in der Draufsicht, Banden, Kraftstation, Lichtschranke, Tür
    g.fillStyle = "#1c2433"; g.fillRect(24, B0, XD - 24, B1 - B0);
    line(g, [[24, B0], [XD, B0]], "#8a96ab", 6); line(g, [[24, B1], [XD, B1]], "#8a96ab", 6);
    const pulse = push ? .55 + .35 * Math.sin(t * 18) : .25;
    // so breit, dass der Schlitten auch bei der größten Kraft nach vorn die ganzen 0,50 s darin bleibt (bis x ≈ 461)
    g.fillStyle = `rgba(255,167,51,${pulse * .35})`; g.fillRect(XK - 10, B0 + 4, 260, B1 - B0 - 8);
    g.strokeStyle = "#ffa733"; g.lineWidth = 3; g.setLineDash([10, 8]); g.strokeRect(XK - 10, B0 + 4, 260, B1 - B0 - 8); g.setLineDash([]);
    txt(g, "Kraftstation", XK + 120, B1 - 22, 22, "#ffb35c", "center", 700);   // unten in der Station: oben ist Platz für den Kraftpfeil (quer)
    for (const yy of [B0 - 6, B1 + 6]) { g.fillStyle = "#c9d2e0"; g.fillRect(XG - 7, yy - 9, 14, 18); }
    const flash = passed && x - XG < 40;
    line(g, [[XG, B0], [XG, B1]], flash ? "#ff8a7a" : "rgba(255,80,64,.75)", flash ? 6 : 3);
    const gateTxt = passed ? `Lichtschranke: ${de(s.vx)} m/s` : "Lichtschranke";
    txt(g, gateTxt, XG, 114, 22, passed ? (good ? "#5fd38d" : "#ff7a6a") : "#cfd6e4", "center", 700);
    g.fillStyle = "#2a3242"; g.fillRect(XD, B0 - 20, 110, B1 - B0 + 40);
    if (ok) { g.fillStyle = "#1c2433"; g.fillRect(XD, B0 + 10, 26, B1 - B0 - 20); }
    else { g.fillStyle = "#b5483c"; g.fillRect(XD, B0 + 4, 16, B1 - B0 - 8); }
    lockIcon(g, XD + 70, YC + 2, 54, ok, ok ? "#5fd38d" : "#ff5a48");
    txt(g, "Tür", XD + 70, 114, 22, "#cfd6e4", "center", 700);
    // Schlitten
    const vis = !(ok && x > XD + 30) && x > -60;
    if (vis) { g.save(); if (ok && x > XD - HW) { g.beginPath(); g.rect(0, 0, XD + 26, h); g.clip(); }
      g.fillStyle = "#d7dde8"; g.beginPath(); g.roundRect(x - HW, y - HH, 2 * HW, 2 * HH, 10); g.fill();
      g.fillStyle = "#5ec8ff"; g.fillRect(x + HW - 10, y - HH + 6, 6, 2 * HH - 12);
      txt(g, "3 kg", x - 4, y + 1, 22, "#1a2230", "center", 800); g.restore();
      if (push && v.F > 0) { const d = v.dir === 0 ? [1, 0] : v.dir === 2 ? [-1, 0] : [0, -1];
        // Pfeil quer: so begrenzt, dass die Spitze auch am höchsten Punkt der Kraftphase unter der Kopfzeile bleibt (Länge während der Phase konstant)
        const L = v.dir === 1 ? Math.min(22 + v.F * 6, Math.max(B0 + HH, yB) - HH - 6 - 90) : 22 + v.F * 6;
        const sx = x + d[0] * (HW + 6), sy = y + d[1] * (HH + 6);
        arrow(g, sx, sy, sx + d[0] * L, sy + d[1] * L, "#ffa733", 7);
        txt(g, `F = ${v.F} N`, v.dir === 1 ? x + HW + 50 : sx + d[0] * L / 2, v.dir === 1 ? y : y - 34, 22, "#ffb35c", "center", 700); }
      if (crash) txt(g, "💥 an die Bande", x, y + HH + 30, 24, "#ff7a6a", "center", 700);
      if (atDoor && !good && Math.sin(t * 8) > -.3) txt(g, "Tür bleibt zu", XD + 55, B1 + 42, 22, "#ff7a6a", "center", 700); }
    // Pfeilbild links: v_vorher + Δv = v_nachher (1 m/s ≙ 50 px)
    const P = 50, ox = 190;
    txt(g, "Pfeilbild", 24, 312, 22, "#cfd6e4", "left", 700);
    if (v.dir !== 1) {
      const r1 = 350, r2 = 398, r3 = 446;
      txt(g, "vorher", ox - 38, r1, 22, "#7fb8ff", "right", 700); arrow(g, ox, r1, ox + VR * P, r1, "#3d8bff", 8);
      txt(g, "Δv", ox - 38, r2, 22, "#ff7a6a", "right", 700);
      if (s.dv > 1e-9) { const sg = v.dir === 0 ? 1 : -1; arrow(g, ox + VR * P, r2, ox + (VR + sg * s.dv) * P, r2, "#ff4b3a", 8);
        g.setLineDash([5, 6]); g.strokeStyle = "#8a96ab"; g.lineWidth = 2; g.beginPath(); g.moveTo(ox + VR * P, r1 + 10); g.lineTo(ox + VR * P, r2 - 10); g.stroke(); g.setLineDash([]); }
      else txt(g, "0", ox + 4, r2, 22, "#ff7a6a", "left", 700);
      txt(g, "nachher", ox - 38, r3, 22, "#5fd38d", "right", 700);
      if (Math.abs(s.vx) > 1e-9) arrow(g, ox, r3, ox + s.vx * P, r3, "#2fd27a", 8); else txt(g, "0 (steht)", ox + 4, r3, 22, "#5fd38d", "left", 700);
      g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 2; g.beginPath(); g.moveTo(ox, 330); g.lineTo(ox, 466); g.stroke();
    } else {
      const by = 496, bx = 150, tx = bx + VR * P, ty = by - s.dv * P;
      arrow(g, bx, by, tx, by, "#3d8bff", 8); txt(g, "vorher", bx + VR * P / 2, by + 26, 22, "#7fb8ff", "center", 700);
      if (s.dv > 1e-9) { arrow(g, tx, by, tx, ty, "#ff4b3a", 8); txt(g, "Δv", tx + 14, (by + ty) / 2, 22, "#ff7a6a", "left", 700);
        arrow(g, bx, by, tx, ty, "#2fd27a", 7); txt(g, "nachher", bx + (tx - bx) * .45 - 12, by - (by - ty) * .45 - 14, 22, "#5fd38d", "right", 700); }
    }
    // Rechnung rechts
    const cx = 470, sgn = v.dir === 0 ? "nach vorn" : v.dir === 2 ? "nach hinten" : "quer zur Bahn";
    txt(g, "Δv = F · Δt : m", cx, 330, 24, "#ffffff", "left", 700);
    txt(g, `= ${v.F} N · 0,50 s : 3,0 kg ${eq(s.dv)} m/s`, cx, 370, 24, "#ffffff", "left", 600);
    txt(g, s.dv > 1e-9 ? `Δv zeigt ${sgn}` : "kein Δv ohne Kraft", cx, 410, 24, "#ff7a6a", "left", 700);
    const after = v.dir === 1 && s.dv > 1e-9 ? "nachher: schräg zur Bande" : s.vx > 1e-9 ? `nachher: v ${eq(s.vx)} m/s` : Math.abs(s.vx) < 1e-9 ? "nachher: v = 0 – steht" : `nachher: ${de(-s.vx)} m/s zurück`;
    txt(g, after, cx, 452, 26, good ? "#5fd38d" : "#ffe9a8", "left", 700);
    const verdict = good ? "✓ genau 0,50 m/s an der Tür" : v.dir === 1 && s.dv > 1e-9 ? "✗ abgelenkt statt gebremst" : s.vx > VZ ? "✗ zu schnell für das Schloss" : s.vx > 1e-9 ? "✗ zu langsam für das Schloss" : Math.abs(s.vx) < 1e-9 ? "✗ erreicht die Tür nie" : "✗ fährt zurück";
    txt(g, ok ? "🔓 Schloss offen" : verdict, cx, 500, 24, good || ok ? "#5fd38d" : "#ff7a6a", "left", 700);
  },
  pruefe(v){
    const s = sled(v), d = eq(s.dv);
    if (!v.F) return {ok: false, text: "Ohne Kraft gibt es **kein Δv**: Der Schlitten kommt unverändert mit **2,0 m/s** an – viel zu schnell für das Schloss. Er muss in der Kraftstation abgebremst werden."};
    if (v.dir === 0) return {ok: false, text: `Die Kraft wirkt **in Fahrtrichtung** – also zeigt auch **Δv nach vorn**: Δv = F · Δt : m = ${v.F} N · 0,50 s : 3,0 kg ${d} m/s. Der Schlitten wird **schneller** (v ${eq(s.vx)} m/s) statt langsamer. Zum Bremsen muss die Kraft **entgegen der Fahrtrichtung** wirken.`};
    if (v.dir === 1) return {ok: false, text: `Eine Kraft **quer zur Bahn** erzeugt ein Δv quer zur Bewegung (${d.replace(/^[=≈] /, "")} m/s). Der Schlitten wird dadurch nur **abgelenkt** und fährt schräg auf die Bande zu – langsamer wird er nicht. Zum Bremsen muss die Kraft **entgegen der Fahrtrichtung** wirken.`};
    if (isOk(s)) return {ok: true};
    const base = `Δv = F · Δt : m = ${v.F} N · 0,50 s : 3,0 kg ${d} m/s **nach hinten**`;
    if (s.vx > VZ) return {ok: false, text: `${base}, also v_{nachher} = 2,0 m/s − ${d.replace(/^[=≈] /, "")} m/s ${eq(s.vx)} m/s. Das ist noch **zu schnell** – die Bremskraft muss **größer** sein.`};
    if (s.vx > 1e-9) return {ok: false, text: `${base}, also v_{nachher} = 2,0 m/s − ${d.replace(/^[=≈] /, "")} m/s ${eq(s.vx)} m/s. Das ist **zu langsam** – die Bremskraft muss **kleiner** sein.`};
    if (s.vx > -1e-9) return {ok: false, text: `${base} – genau so groß wie die Geschwindigkeit vorher: Der Schlitten **bleibt stehen** und erreicht die Tür nie. Die Kraft ist zu groß.`};
    return {ok: false, text: `${base} – mehr als die 2,0 m/s von vorher: Der Schlitten **fährt zurück** (mit ${de(-s.vx)} m/s weg von der Tür). Die Kraft ist viel zu groß.`};
  },
  tipps: ["Δv zeigt immer in Richtung der Kraft. Damit der Schlitten langsamer wird, muss Δv – und damit die Kraft – nach hinten zeigen.",
          "Von 2,0 m/s auf 0,50 m/s: Der Schlitten braucht Δv = 1,5 m/s nach hinten. Stelle F · Δt = m · Δv nach F um: F = m · Δv : Δt.",
          "F = 3,0 kg · 1,5 m/s : 0,50 s = … N – Richtung: entgegen der Fahrtrichtung."],
  loesung: {F: 9, dir: 2},
  erfolg: "Δv = 9 N · 0,50 s : 3,0 kg = **1,5 m/s nach hinten** – v_{nachher} = 2,0 m/s − 1,5 m/s = **0,50 m/s**. Die Lichtschranke gibt das Schloss frei: Die Tür ist offen!"
};

/* =====================================================================
   Suchbild: Projekttag auf dem Schulhof
   Fehler: Δv gegen die Kraft (Skateboard), Merksatz „schwere Körper stärker beschleunigt“, Einheit m/s bei a, „F = 0“ in der Kurve,
   Rechnung F = m : a. Richtige Ablenker: Pfeile beim bremsenden Rad, Plakat 1 N = 1 kg · m/s², zweite Zeile der Anzeige, Kart auf der Geraden.
   ===================================================================== */
const SKIN = "#f1c9a5";
function kid(g, x, yF, shirt, hair, reach){   // x = Körpermitte, yF = Fußhöhe, reach = Armziel [x, y] (sonst hängende Arme)
  line(g, [[x - 10, yF - 70], [x - 15, yF]], "#33415c", 13); line(g, [[x + 10, yF - 70], [x + 15, yF]], "#33415c", 13);
  g.fillStyle = "#26201c"; g.fillRect(x - 27, yF - 6, 22, 9); g.fillRect(x + 5, yF - 6, 22, 9);
  g.fillStyle = shirt; g.beginPath(); g.roundRect(x - 26, yF - 152, 52, 88, 14); g.fill();
  if (reach) { line(g, [[x + 14, yF - 136], reach], SKIN, 11); line(g, [[x + 4, yF - 128], [reach[0] - 6, reach[1] + 12]], SKIN, 11); }
  else { line(g, [[x - 22, yF - 138], [x - 32, yF - 84]], SKIN, 10); line(g, [[x + 22, yF - 138], [x + 32, yF - 84]], SKIN, 10); }
  g.fillStyle = SKIN; g.beginPath(); g.arc(x, yF - 174, 23, 0, 7); g.fill();
  g.fillStyle = hair; g.beginPath(); g.arc(x, yF - 180, 24, Math.PI * 1.02, Math.PI * 1.98); g.fill();
  g.fillStyle = "#2a2018"; g.beginPath(); g.arc(x + 8, yF - 176, 3, 0, 7); g.fill();
}
function hof(g, w, h){
  // Hauswand, Sockel, Pflaster
  g.fillStyle = "#ebe1cd"; g.fillRect(0, 0, w, 370);
  g.fillStyle = "#dfd3bb"; for (let y = 30; y < 366; y += 34) g.fillRect(0, y, w, 2);
  g.fillStyle = "#cbc5ba"; g.fillRect(0, 370, w, 430);
  g.fillStyle = "#bab3a6"; for (let x = 40; x < w; x += 90) g.fillRect(x, 374, 2, 426); for (let y = 450; y < h; y += 80) g.fillRect(0, y, w, 2);
  g.fillStyle = "#9d968a"; g.fillRect(0, 362, w, 12);
  // Banner
  g.fillStyle = "#2f6db5"; g.beginPath(); g.roundRect(330, 12, 540, 50, 10); g.fill(); txt(g, "Projekttag Kraft und Bewegung · 8b", 600, 38, 28, "#ffffff", "center", 700);
  // Plakat 1 (Fehler): Merksatz zur Masse
  g.fillStyle = "#ffffff"; g.fillRect(40, 84, 340, 214); g.strokeStyle = "#b3261e"; g.lineWidth = 5; g.strokeRect(40, 84, 340, 214);
  txt(g, "Merke!", 210, 120, 32, "#b3261e", "center", 800);
  txt(g, "Bei gleicher Kraft werden", 210, 172, 26, "#222", "center", 600); txt(g, "schwere Körper stärker", 210, 212, 26, "#222", "center", 600);
  txt(g, "beschleunigt als leichte.", 210, 252, 26, "#222", "center", 600);
  // Plakat 2 (richtig)
  g.fillStyle = "#fff6cf"; g.fillRect(430, 84, 290, 214); g.strokeStyle = "#c99a2e"; g.lineWidth = 5; g.strokeRect(430, 84, 290, 214);
  txt(g, "Gut zu wissen", 575, 118, 26, "#7a5a12", "center", 800); txt(g, "1 N = 1 kg · m/s²", 575, 170, 34, "#222", "center", 800);
  txt(g, "Δv zeigt immer in", 575, 222, 26, "#222", "center", 600); txt(g, "Kraftrichtung.", 575, 258, 26, "#222", "center", 600);
  // Anzeigetafel der Sprint-Messung (Fehler in Zeile 1, Zeile 2 richtig)
  g.fillStyle = "#596270"; g.fillRect(764, 74, 404, 238); g.fillStyle = "#18222b"; g.fillRect(776, 86, 380, 214);
  txt(g, "Sprint-Messung · Lena", 966, 116, 26, "#ffc75a", "center", 700);
  // Zeilen weit auseinander: Der Kreis um „a = 3 m/s“ darf die richtige zweite Zeile (Ablenker) nicht mit einschließen
  txt(g, "Start: a = 3 m/s", 966, 160, 36, "#7dffb0", "center", 800); txt(g, "nach 2 s: v = 6 m/s", 966, 264, 36, "#7dffb0", "center", 800);
  // Skateboard: Tim schiebt Ella an (Fehler: Δv gegen die Kraft)
  g.fillStyle = "#5a3a22"; g.beginPath(); g.roundRect(196, 628, 128, 14, 7); g.fill(); g.fillStyle = "#222"; for (const wx of [214, 306]) { g.beginPath(); g.arc(wx, 648, 9, 0, 7); g.fill(); }
  kid(g, 258, 628, "#e05a8a", "#6b3b1f");
  kid(g, 118, 652, "#3c8f5a", "#2b2018", [214, 520]);
  arrow(g, 222, 418, 318, 418, "#ff9a1f", 9, "#3a2a14"); txt(g, "F", 334, 418, 30, "#a85a00", "left", 800);
  arrow(g, 318, 386, 222, 386, "#ff3b30", 9, "#3a1412"); txt(g, "Δv", 206, 386, 30, "#b3261e", "right", 800);
  // Radfahrer bremst (richtige Pfeile)
  g.strokeStyle = "#222"; g.lineWidth = 6; for (const wx of [556, 690]) { g.beginPath(); g.arc(wx, 588, 38, 0, 7); g.stroke(); }
  line(g, [[556, 588], [612, 588], [652, 528], [596, 528], [556, 588]], "#c0392b", 7); line(g, [[612, 588], [592, 512]], "#c0392b", 7); line(g, [[652, 528], [690, 588]], "#c0392b", 7);
  line(g, [[652, 528], [664, 500]], "#333", 6); line(g, [[656, 498], [684, 498]], "#333", 7);
  g.fillStyle = "#333"; g.fillRect(578, 504, 34, 9);
  line(g, [[598, 506], [612, 560], [624, 588]], "#33415c", 13);
  g.fillStyle = "#f2b33d"; g.beginPath(); g.roundRect(592, 420, 46, 88, 14); g.fill();
  line(g, [[628, 440], [676, 498]], SKIN, 10);
  g.fillStyle = SKIN; g.beginPath(); g.arc(626, 400, 22, 0, 7); g.fill(); g.fillStyle = "#e0402e"; g.beginPath(); g.arc(626, 394, 25, Math.PI * 1.02, Math.PI * 1.98); g.fill();
  arrow(g, 560, 352, 700, 352, "#2f7dff", 9, "#12234a"); txt(g, "v", 716, 352, 30, "#1d4fb0", "left", 800);
  arrow(g, 690, 326, 600, 326, "#ff3b30", 9, "#3a1412"); txt(g, "Δv", 584, 326, 30, "#b3261e", "right", 800);
  arrow(g, 640, 650, 548, 650, "#ff9a1f", 9, "#3a2a14"); txt(g, "F", 532, 650, 30, "#a85a00", "right", 800);
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(664, 398, 128, 44, 14); g.fill(); g.beginPath(); g.moveTo(674, 428); g.lineTo(650, 404); g.lineTo(690, 420); g.fill();
  txt(g, "Ich bremse!", 728, 421, 22, "#333", "center", 700);
  // Kreidetafel: Kartbahn von oben (Fehler: F = 0 in der Kurve; richtig: F = 0 auf der Geraden)
  g.fillStyle = "#8a6a3a"; g.fillRect(800, 388, 382, 366); g.fillStyle = "#2e4a3c"; g.fillRect(812, 400, 358, 342);
  txt(g, "Kartbahn von oben", 991, 428, 26, "#f4f1e6", "center", 700); txt(g, "Tempo bleibt bei beiden gleich", 991, 460, 22, "#dfe8de", "center", 500);
  const k1 = 920, k2 = 1060, cy = 600, ro = 82, ri = 40;
  g.strokeStyle = "#f4f1e6"; g.lineWidth = 4;
  for (const r of [ro, ri]) { g.beginPath(); g.moveTo(k1, cy - r); g.lineTo(k2, cy - r); g.arc(k2, cy, r, -Math.PI / 2, Math.PI / 2); g.lineTo(k1, cy + r); g.arc(k1, cy, r, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.stroke(); }
  const rm = (ro + ri) / 2;
  g.fillStyle = "#ffd34d"; g.fillRect(k2 + rm - 10, cy - 15, 20, 30); arrow(g, k2 + rm, cy - 20, k2 + rm, cy - 70, "#8fc7ff", 6);
  txt(g, "F = 0", k2 - 22, cy, 26, "#ffffff", "center", 800);
  g.fillStyle = "#ffd34d"; g.fillRect(975, cy + rm - 10, 30, 20); arrow(g, 1010, cy + rm, 1062, cy + rm, "#8fc7ff", 6);
  txt(g, "F = 0", 990, cy + ro + 24, 26, "#ffffff", "center", 800);
  // Pauls Heft (Fehler: F = m : a)
  g.save(); g.translate(600, 728); g.rotate(-.025); g.fillStyle = "#ffffff"; g.fillRect(-190, -62, 380, 128); g.strokeStyle = "#9ab"; g.lineWidth = 2;
  for (let y = -34; y < 66; y += 32) { g.beginPath(); g.moveTo(-180, y); g.lineTo(180, y); g.stroke(); }
  txt(g, "Einkaufswagen: m = 20 kg", -176, -44, 25, "#1d3a8a", "left", 600); txt(g, "a = 0,5 m/s²", -176, -12, 25, "#1d3a8a", "left", 600);
  txt(g, "F = m : a = 40 N", -176, 20, 25, "#1d3a8a", "left", 700); txt(g, "Paul", 176, 50, 22, "#7a8aa0", "right", 600); g.restore();
  line(g, [[804, 770], [930, 742]], "#e0b83a", 9); line(g, [[804, 770], [794, 773]], "#333", 6);
}
const suchbild = {
  titel: "Projekttag auf dem Schulhof",
  text: "Die Klasse 8b hat einen Projekttag zum Thema **Kraft und Bewegung** gestaltet. In Plakaten, Pfeilen, Anzeigen und Rechnungen stecken **fünf Fehler**. Klicke sie an und begründe, was falsch ist.",
  ort: {x: -3.6, z: -9.5, ry: 0},
  zeichne: hof,
  fehler: [
    {x: 266, y: 404, r: 90, name: "Die Pfeile beim Anschieben", frage: "Tim schiebt Ella auf dem Skateboard nach rechts an. Was ist an den Pfeilen falsch?",
     optionen: ["Der Kraftpfeil müsste nach links zeigen, weil Tim links steht.", "Solange Ella noch langsam ist, gibt es kein Δv – der rote Pfeil gehört weg.", "Hier ist alles richtig.",
                "Δv zeigt nach hinten – es muss aber in Richtung der Kraft zeigen, also nach vorn."], richtig: 3,
     warum: ["Die Kraft zeigt dorthin, wohin Tim drückt: nach rechts, in Ellas Fahrtrichtung. Wo Tim steht, spielt für die Richtung keine Rolle – der orange Pfeil stimmt.",
             "Gerade beim Anschieben ändert sich Ellas Geschwindigkeit, es gibt also ein Δv. Der rote Pfeil gehört ins Bild – er zeigt nur in die falsche Richtung.",
             "Schau auf die Pfeilspitzen: Der orange Kraftpfeil zeigt nach rechts, der rote Δv-Pfeil nach links. Die beiden müssten in dieselbe Richtung zeigen.",
             null],
     erklaerung: "Die Zusatzgeschwindigkeit **Δv zeigt immer in Richtung der Kraft**. Tim drückt Ella nach vorn (rechts) – also wird sie in diese Richtung schneller, und Δv zeigt ebenfalls nach vorn."},
    {x: 210, y: 192, r: 118, name: "Das Merke-Plakat", frage: "Was stimmt an diesem Merksatz nicht?",
     optionen: ["Er stimmt – schwere Körper haben mehr Schwung.", "Es ist umgekehrt: Nach a = F : m wird ein schwerer Körper bei gleicher Kraft weniger stark beschleunigt.",
                "Die Beschleunigung hängt gar nicht von der Masse ab.", "Schwere Körper lassen sich überhaupt nicht beschleunigen."], richtig: 1,
     warum: ["„Schwung“ hat ein schwerer Körper erst, wenn er schon fährt. Ihn in Fahrt zu bringen ist dagegen mühsamer: Bei gleicher Kraft wird er weniger beschleunigt.",
             null,
             "Doch, sie hängt von der Masse ab: a = F : m. Gleich für alle ist a nur beim freien Fall ohne Luftwiderstand – dort wächst die Gewichtskraft mit der Masse mit.",
             "Auch ein voll beladener Lastwagen kommt in Fahrt, nur langsamer. Jede resultierende Kraft beschleunigt jeden Körper – bei großer Masse ist a = F : m eben klein."],
     erklaerung: "Aus F = m · a folgt **a = F : m**. Bei gleicher Kraft gilt: **doppelte Masse – halbe Beschleunigung**. Ein voll beladener Einkaufswagen kommt deshalb langsamer in Fahrt als ein leerer."},
    {x: 1018, y: 148, r: 76, name: "Die Anzeige der Sprint-Messung", frage: "Was ist an der Anzeigetafel falsch?",
     optionen: ["Die Beschleunigung hat die Einheit m/s^{2}, nicht m/s.", "Nach 2 s müsste Lena 1,5 m/s schnell sein.", "Eine Beschleunigung gibt man in Newton an.",
                "Beschleunigung und Geschwindigkeit sind dasselbe."], richtig: 0,
     warum: [null,
             "1,5 m/s käme heraus, wenn man 3 durch 2 teilt. Bei einer Beschleunigung von 3 m/s^{2} kommen aber in jeder Sekunde 3 m/s dazu – nach 2 s sind es 6 m/s, die zweite Zeile stimmt.",
             "Newton ist die Einheit der Kraft. Die Beschleunigung beschreibt nur die Bewegung: Δv : Δt mit der Einheit (m/s) : s = m/s^{2}.",
             "Die Geschwindigkeit sagt, wie schnell Lena ist, die Beschleunigung, wie schnell ihre Geschwindigkeit zunimmt. Deshalb haben die beiden verschiedene Einheiten – und genau die ist hier falsch."],
     erklaerung: "a = Δv : Δt hat die Einheit (m/s) : s = **m/s^{2}**. „a = 3 m/s^{2}“ heißt: Lenas Geschwindigkeit nimmt in jeder Sekunde um 3 m/s zu – nach 2 s ist sie 6 m/s schnell. Die zweite Zeile stimmt also."},
    {x: 1067, y: 575, r: 80, name: "Das Kart in der Kurve", frage: "Beide Karts fahren mit gleichbleibendem Tempo. Was ist am Kart in der Kurve falsch?",
     optionen: ["In der Kurve müsste das Kart schneller werden.", "Hier ist alles richtig, das Tempo bleibt ja gleich.",
                "In der Kurve ändert sich die Richtung der Geschwindigkeit – dafür braucht es eine resultierende Kraft quer zur Fahrtrichtung, zur Kurvenmitte hin.",
                "Die Kraft müsste genau in Fahrtrichtung zeigen."], richtig: 2,
     warum: ["Laut Tafel bleibt das Tempo bei beiden gleich – schneller werden muss das Kart nicht. Aber seine Richtung ändert sich, und auch dafür braucht es eine Kraft.",
             "Gleiches Tempo heißt noch nicht Δv = 0: Auch eine Richtungsänderung ist eine Änderung der Geschwindigkeit. Ohne Kraft würde das Kart geradeaus aus der Kurve fahren.",
             null,
             "Eine Kraft in Fahrtrichtung würde das Kart nur schneller machen, aber nicht um die Kurve lenken. Dafür muss sie quer zur Fahrtrichtung wirken."],
     erklaerung: "Auch eine **Richtungsänderung** ist eine Geschwindigkeitsänderung (Δv ≠ 0). Nach F · Δt = m · Δv braucht sie eine Kraft – sie wirkt **quer zur Fahrtrichtung**, zur Kurvenmitte hin. Auf der Geraden mit gleichem Tempo ist F = 0 dagegen richtig."},
    {x: 515, y: 746, r: 78, name: "Pauls Rechnung", frage: "Was ist an Pauls Rechnung falsch?",
     optionen: ["Er hätte 20 kg erst in Gramm umrechnen müssen.", "Die Einheit N ist falsch, es müsste kg heißen.",
                "Die Formel ist falsch: Es gilt F = m · a = 20 kg · 0,5 m/s^{2} = 10 N.", "Nichts – die Kraft ist Masse geteilt durch Beschleunigung."], richtig: 2,
     warum: ["Kilogramm ist genau die richtige Einheit, denn 1 N = 1 kg · m/s^{2}. Mit Gramm käme ein 1000-mal zu großes Ergebnis heraus.",
             "Gesucht ist eine Kraft, und Kräfte gibt man in Newton an. Die Einheit N stimmt – nur die Zahl ist falsch.",
             null,
             "Prüfe mit den Einheiten: kg : (m/s^{2}) ergibt kein Newton. Und je stärker der Wagen beschleunigt werden soll, desto mehr Kraft braucht man – also malnehmen."],
     erklaerung: "Kraft, Masse und Beschleunigung hängen über **F = m · a** zusammen (1 kg · m/s^{2} = 1 N). Paul hat geteilt statt malgenommen: Richtig ist **F = 20 kg · 0,5 m/s^{2} = 10 N**."}
  ],
  // richtig dargestellte Details (keine Überlappung mit den Fehlerkreisen und untereinander)
  ablenker: [
    {x: 640, y: 342, r: 62, text: "Der Radfahrer bremst: Seine Geschwindigkeit v zeigt nach vorn, die Zusatzgeschwindigkeit **Δv** nach hinten. So wird er langsamer – die Pfeile sind richtig gezeichnet."},
    {x: 594, y: 650, r: 40, text: "Die **Bremskraft F** am Fahrrad zeigt nach hinten, entgegen der Fahrtrichtung – in dieselbe Richtung wie Δv. Genau so muss es beim Bremsen sein."},
    {x: 575, y: 186, r: 92, text: "Beide Sätze auf dem gelben Plakat stimmen: **1 N = 1 kg · m/s^{2}**, und Δv zeigt immer in Richtung der Kraft."},
    {x: 1045, y: 290, r: 64, text: "Die zweite Zeile der Anzeige stimmt: Bei a = 3 m/s^{2} nimmt Lenas Geschwindigkeit in jeder Sekunde um 3 m/s zu – aus dem Stand sind es nach 2 s genau **6 m/s**."},
    {x: 990, y: 688, r: 45, text: "Auf der Geraden fährt das Kart mit gleichem Tempo in gleicher Richtung weiter: Δv = 0, also ist die resultierende Kraft **F = 0** – richtig, das ist die Trägheit."}
  ],
  abschluss: "Gut gesucht! **Δv zeigt immer in Kraftrichtung**, **a = F : m** (bei gleicher Kraft wird ein schwerer Körper weniger beschleunigt), die Beschleunigung hat die Einheit **m/s^{2}** – und auch eine Kurvenfahrt mit gleichem Tempo braucht eine Kraft."
};

R3D.lern.raum("beweg2", {
  raetsel, suchbild,
  // Rechenwerkstatt: Tafel im Raum (freie Bodenstelle vorne rechts, gegenüber der Suchbild-Staffelei) + Knopf an Station 3
  uebung: {ort: {x: 3.6, z: -9.5, ry: 0}, formel: "F · Δt = m · Δv"},
  rechenweg: [
    // 1: vorgerechnetes Beispiel (mit Umstellen nach Δv)
    {titel: "Der Spielzeugwagen", text: "Ein Spielzeugwagen mit der Masse 0,40 kg wird auf einer glatten Bahn 2,0 s lang mit der resultierenden Kraft 0,30 N angeschoben. Wie groß ist seine Zusatzgeschwindigkeit Δv?",
     gegeben: [{g: "m", wert: .4, einheit: "kg", name: "Masse"}, {g: "Δt", wert: 2, einheit: "s", name: "Einwirkdauer"}, {g: "F", wert: .3, einheit: "N", name: "resultierende Kraft"}],
     gesucht: {g: "Δv", einheit: "m/s", name: "Zusatzgeschwindigkeit"},
     formel: "F · Δt = m · Δv",
     formelAblenker: [{f: "F · Δt = m · v", warum: "Eine Kraft bewirkt eine **Änderung** der Geschwindigkeit. In der Bewegungsgleichung steht deshalb Δv, nicht v."},
                      {f: "F · m = Δt · Δv", warum: "Hier sind die Größen falsch gepaart: Die Kraft wirkt eine Zeit lang (F · Δt) und ändert dabei die Geschwindigkeit der Masse (m · Δv)."}],
     umgestellt: "Δv = F · Δt : m",
     umstellAblenker: [{f: "Δv = F · Δt · m", warum: "m steht rechts als Faktor bei Δv. Um es wegzubekommen, teilst du beide Seiten durch m – malnehmen wäre die falsche Richtung."},
                       {f: "Δv = m · Δt : F", warum: "Hier sind F und m vertauscht. Dann bekäme ein schwererer Wagen ein größeres Δv – es ist aber umgekehrt."}],
     umstellWeg: "F · Δt = m · Δv  | : m  →  Δv = F · Δt : m",
     einsetzen: "Δv = 0,30 N · 2,0 s : 0,40 kg", ergebnis: {wert: 1.5, einheit: "m/s"},
     tipps: ["Stelle F · Δt = m · Δv nach Δv um: Teile beide Seiten durch m.", "Δv = 0,30 N · 2,0 s : 0,40 kg", "0,30 · 2,0 = 0,60 und 0,60 : 0,40 = … – Einheit: N · s : kg = m/s"],
     loesung: "Δv = F · Δt : m = 0,30 N · 2,0 s : 0,40 kg = 1,5 m/s",
     antwort: "Der Spielzeugwagen erhält eine Zusatzgeschwindigkeit von 1,5 m/s.", antwortAnfang: "Der Spielzeugwagen …", einheitAuch: ["km/h"]},
    // 2: Umrechnen (g → kg) und einfach umstellen (F = m · a nach a)
    {titel: "Das Modellauto", text: "Ein ferngesteuertes Modellauto hat die Masse 800 g. Sein Motor treibt es mit der resultierenden Kraft 2,0 N an. Wie groß ist seine Beschleunigung?",
     gegeben: [{g: "m", wert: 800, einheit: "g", name: "Masse", si: {wert: .8, einheit: "kg"}}, {g: "F", wert: 2, einheit: "N", name: "resultierende Kraft"}],
     gesucht: {g: "a", einheit: "m/s²", name: "Beschleunigung"},
     formel: "F = m · a",
     formelAblenker: [{f: "F = m : a", warum: "Je stärker ein Körper beschleunigt werden soll, desto mehr Kraft braucht er. Die Beschleunigung wird deshalb malgenommen, nicht geteilt."},
                      {f: "F = m + a", warum: "Masse (kg) und Beschleunigung (m/s^{2}) haben verschiedene Einheiten – man kann sie nicht addieren. 1 N = 1 kg · m/s^{2} zeigt: Sie werden multipliziert."}],
     umgestellt: "a = F : m",
     umstellAblenker: [{f: "a = m : F", warum: "Das ist der **Kehrwert**: Dann würde ein schwereres Auto stärker beschleunigt. Aus F = m · a folgt durch Teilen durch m: a = F : m."},
                       {f: "a = F · m", warum: "m steht bei a als Faktor. Um a allein zu bekommen, teilst du durch m."}],
     umstellWeg: "F = m · a  | : m  →  F : m = a  →  a = F : m",
     einsetzen: "a = 2,0 N : 0,8 kg", ergebnis: {wert: 2.5, einheit: "m/s²"}, einheitAuch: ["m/s^2", "m/s2", "N/kg"],
     tipps: ["Rechne zuerst um: 800 g = 0,8 kg. Dann F = m · a nach a umstellen.", "a = F : m = 2,0 N : 0,8 kg", "2,0 : 0,8 = 20 : 8 = … – Einheit: N : kg = m/s^{2}"],
     loesung: "a = F : m = 2,0 N : 0,8 kg = 2,5 m/s^{2}",
     antwort: "Das Modellauto wird mit 2,5 m/s² beschleunigt.", antwortAnfang: "Das Modellauto …"},
    // 3: km/h → m/s, nach F umstellen, Plausibilität
    {titel: "Der Motorroller", text: "Ein Motorroller mit Fahrer (zusammen 150 kg) fährt mit 36 km/h. Der Fahrer bremst gleichmäßig und steht nach 2,5 s. Wie groß ist die Bremskraft?",
     gegeben: [{g: "m", wert: 150, einheit: "kg", name: "Masse"}, {g: "Δv", wert: 36, einheit: "km/h", name: "Zusatzgeschwindigkeit (Betrag)", si: {wert: 10, einheit: "m/s"}},
               {g: "Δt", wert: 2.5, einheit: "s", name: "Bremsdauer"}],
     gesucht: {g: "F", einheit: "N", name: "Bremskraft"},
     formel: "F · Δt = m · Δv",
     formelAblenker: [{f: "F = m · Δv", warum: "Hier fehlt die Bremsdauer: Je länger die Kraft wirkt, desto kleiner darf sie für dasselbe Δv sein. Die Grundformel lautet F · Δt = m · Δv."},
                      {f: "F · Δv = m · Δt", warum: "Δt und Δv sind vertauscht. Prüfe die Einheiten: N · s = kg · m/s passt, N · m/s und kg · s passen nicht zusammen."}],
     umgestellt: "F = m · Δv : Δt",
     umstellAblenker: [{f: "F = m · Δt : Δv", warum: "Δt und Δv sind vertauscht. Δt steht links bei F und kommt durch Teilen auf die andere Seite – Δv bleibt bei m."},
                       {f: "F = m · Δv · Δt", warum: "Δt ist links ein Faktor bei F. Um F allein zu bekommen, teilst du durch Δt – sonst bräuchte eine längere Bremsung eine größere Kraft."}],
     umstellWeg: "F · Δt = m · Δv  | : Δt  →  F = m · Δv : Δt",
     einsetzen: "F = 150 kg · 10 m/s : 2,5 s", ergebnis: {wert: 600, einheit: "N"},
     tipps: ["Rechne zuerst um: 36 km/h : 3,6 = 10 m/s. Bis zum Stillstand ist Δv = 10 m/s (nach hinten).", "F = m · Δv : Δt = 150 kg · 10 m/s : 2,5 s",
             "150 · 10 = 1500 und 1500 : 2,5 = … – Einheit: kg · m/s : s = kg · m/s^{2} = N"],
     loesung: "F = m · Δv : Δt = 150 kg · 10 m/s : 2,5 s = 600 N (entgegen der Fahrtrichtung)",
     antwort: "Die Bremskraft beträgt 600 N.", antwortAnfang: "Die Bremskraft …", einheitAuch: ["Newton", "kN"],
     plausibel: {frage: "Ist eine Bremskraft von 600 N für den Motorroller plausibel?",
       optionen: ["Ja – mit a = F : m = 600 N : 150 kg = 4 m/s^{2} wird der Roller in jeder Sekunde um 4 m/s langsamer. Das ist eine kräftige, aber gut mögliche Bremsung.",
                  "Nein – ein fahrender Roller wird auch ohne Bremskraft von selbst langsamer, 600 N sind viel zu viel.",
                  "Nein – die Bremskraft müsste genauso groß sein wie die Masse, also 150 N.",
                  "Ja – denn eine Bremskraft ist immer genau 600 N groß."], richtig: 0,
       warum: [null,
               "Ohne Bremse rollt ein Roller noch lange weiter – Reibung und Luftwiderstand bremsen nur schwach. Um in 2,5 s zu stehen, braucht es eine große Kraft.",
               "Kraft und Masse haben verschiedene Einheiten (N und kg), man kann sie nicht gleichsetzen. Die Kraft folgt aus F = m · Δv : Δt.",
               "Eine feste Bremskraft gibt es nicht: Je größer die Masse und je kürzer die Bremsdauer, desto größer muss F = m · Δv : Δt sein."],
       erklaerung: "Von 36 km/h in 2,5 s zum Stillstand – das ist eine kräftige Bremsung. Dafür braucht der schwere Roller eine Kraft von einigen hundert Newton."}},
    // 4: Δv aus zwei Geschwindigkeiten, nach Δt umstellen (Klammer!)
    {titel: "Die Inlineskaterin", text: "Eine Inlineskaterin (m = 50 kg) fährt mit 2,0 m/s. Durch kräftiges Abstoßen wirkt auf sie eine resultierende Kraft von 75 N in Fahrtrichtung, bis sie 5,0 m/s schnell ist. Wie lange wirkt die Kraft?",
     gegeben: [{g: "m", wert: 50, einheit: "kg", name: "Masse"}, {g: "F", wert: 75, einheit: "N", name: "resultierende Kraft"},
               {g: "v_{vorher}", wert: 2, einheit: "m/s", name: "Geschwindigkeit vorher"}, {g: "v_{nachher}", wert: 5, einheit: "m/s", name: "Geschwindigkeit nachher"}],
     gesucht: {g: "Δt", einheit: "s", name: "Einwirkdauer"},
     symbole: [{g: "Δv", name: "Zusatzgeschwindigkeit"}],
     formel: "F · Δt = m · Δv",
     formelAblenker: [{f: "F · Δt = m · v_{nachher}", warum: "Die Kraft muss nur die **Änderung** der Geschwindigkeit bewirken. Die 2,0 m/s hatte die Skaterin schon vorher – in die Gleichung gehört Δv."},
                      {f: "F · m = Δt · Δv", warum: "Hier sind die Größen falsch gepaart: Kraft und Einwirkdauer gehören zusammen (F · Δt), Masse und Zusatzgeschwindigkeit ebenso (m · Δv)."}],
     umgestellt: "Δt = m · (v_{nachher} − v_{vorher}) : F",
     umstellAblenker: [{f: "Δt = m · v_{nachher} : F", warum: "Hier steht v_{nachher} statt Δv. Die Kraft muss die Skaterin nur von 2,0 m/s auf 5,0 m/s bringen: Δv = v_{nachher} − v_{vorher}."},
                       {f: "Δt = F : (m · (v_{nachher} − v_{vorher}))", warum: "Das ist der **Kehrwert**: Dann würde eine größere Kraft länger brauchen. Aus F · Δt = m · Δv folgt durch Teilen durch F: Δt = m · Δv : F."}],
     umstellWeg: "F · Δt = m · Δv  | : F  →  Δt = m · Δv : F;  mit Δv = v_{nachher} − v_{vorher}  →  Δt = m · (v_{nachher} − v_{vorher}) : F",
     einsetzen: "Δt = 50 kg · (5,0 m/s − 2,0 m/s) : 75 N", ergebnis: {wert: 2, einheit: "s"},
     tipps: ["Erst die Zusatzgeschwindigkeit: Δv = v_{nachher} − v_{vorher}. Dann F · Δt = m · Δv nach Δt umstellen.", "Δt = 50 kg · (5,0 m/s − 2,0 m/s) : 75 N = 50 kg · 3,0 m/s : 75 N",
             "50 · 3,0 = 150 und 150 : 75 = … – Einheit: kg · m/s : N = s"],
     loesung: "Δv = 5,0 m/s − 2,0 m/s = 3,0 m/s;  Δt = m · Δv : F = 50 kg · 3,0 m/s : 75 N = 2,0 s",
     antwort: "Die Kraft wirkt 2,0 s lang.", antwortAnfang: "Die Kraft wirkt …", einheitAuch: ["Sekunden", "ms"],
     plausibel: {frage: "Ist 2,0 s plausibel? Prüfe mit der Beschleunigung a = F : m.",
       optionen: ["Ja – a = 75 N : 50 kg = 1,5 m/s^{2}: In 2,0 s kommen 2 · 1,5 m/s = 3,0 m/s dazu, genau von 2,0 m/s auf 5,0 m/s.",
                  "Nein – am Ende ist sie 5,0 m/s schnell, also muss die Kraft 5,0 s lang wirken.",
                  "Nein – mit 75 N kann man 50 kg gar nicht schneller machen.",
                  "Ja – denn eine Kraft wirkt immer 2 s lang."], richtig: 0,
       warum: [null,
               "Für Δt zählt die Zusatzgeschwindigkeit Δv = 3,0 m/s, nicht die Endgeschwindigkeit – und dazu Kraft und Masse. „Eine Sekunde pro m/s“ ist keine Regel.",
               "Jede resultierende Kraft beschleunigt einen Körper, auch eine kleine – nur entsprechend weniger: a = F : m.",
               "Wie lange eine Kraft wirkt, hängt von der Situation ab. Hier ergibt es sich aus m, Δv und F."],
       erklaerung: "Mit a = F : m = 1,5 m/s^{2} wächst die Geschwindigkeit in jeder Sekunde um 1,5 m/s – in 2,0 s also um 3,0 m/s. Das passt zu 2,0 m/s → 5,0 m/s."}}
  ],
  umstellen: [
    {formel: "F · Δt = m · Δv", loesung: "Δv = F · Δt : m", text: "Newtonsche Bewegungsgleichung. Gesucht ist die Zusatzgeschwindigkeit, die eine Kraft F in der Zeit Δt bewirkt.",
     typisch: [{f: "Δv = F · Δt · m", warum: "m steht rechts als Faktor bei Δv. Was malgenommen wird, kommt durch **Teilen** auf die andere Seite."},
               {f: "Δv = m · Δt : F", warum: "F und m sind vertauscht. F steht schon auf der linken Seite und bleibt im Zähler – nur m wandert hinüber."},
               {f: "Δv = F : (Δt · m)", warum: "Δt steht links neben F und bleibt dort ein Faktor. Geteilt wird nur durch m."}],
     weg: "F · Δt = m · Δv  | : m  →  Δv = F · Δt : m", tipps: ["Welche Größe steht neben Δv? Teile beide Seiten durch sie.", "Probe mit Zahlen: F = 16 N, Δt = 2 s, m = 8 kg müssen Δv = 4 m/s ergeben."]},
    {formel: "F · Δt = m · Δv", loesung: "Δt = m · Δv : F", text: "Gesucht ist die Einwirkdauer, zum Beispiel die Bremsdauer bis zum Stillstand.",
     typisch: [{f: "Δt = F : (m · Δv)", warum: "Das ist der **Kehrwert**: Dann bräuchte eine größere Kraft länger. Teile F · Δt = m · Δv durch F."},
               {f: "Δt = m · Δv · F", warum: "F ist links ein Faktor bei Δt. Um Δt allein zu bekommen, teilst du durch F – nicht malnehmen."},
               {f: "Δt = F · m : Δv", warum: "F gehört auf die andere Seite (durch Teilen), Δv bleibt bei m im Zähler. Probe: Mehr Δv braucht mehr Zeit, nicht weniger."}],
     weg: "F · Δt = m · Δv  | : F  →  Δt = m · Δv : F", tipps: ["Welche Größe steht neben Δt? Teile beide Seiten durch sie.", "Probe: m = 60 kg, Δv = 2 m/s und F = 24 N müssen Δt = 5 s ergeben."]},
    {formel: "F = m · a", loesung: "m = F : a", text: "Aus Kraft und Beschleunigung lässt sich die Masse eines Körpers bestimmen.",
     typisch: [{f: "m = a : F", warum: "Das ist der **Kehrwert**. Aus F = m · a folgt durch Teilen durch a: m = F : a."},
               {f: "m = F · a", warum: "a steht bei m als Faktor. Was malgenommen wird, kommt durch Teilen auf die andere Seite."}],
     weg: "F = m · a  | : a  →  F : a = m  →  m = F : a", tipps: ["Teile beide Seiten durch a.", "Probe: F = 14 N und a = 2 m/s^{2} müssen m = 7 kg ergeben."]}
  ],
  fehlersuche: [
    // falsch umgestellt (F und m vertauscht)
    {titel: "Der Schlitten", aufgabe: "Ein Schlitten mit Kind (m = 30 kg) wird auf glattem Eis 3,0 s lang mit der resultierenden Kraft 35 N gezogen. Berechne die Zusatzgeschwindigkeit Δv.",
     zeilen: ["Gegeben: m = 30 kg; Δt = 3,0 s; F = 35 N", "Gesucht: Δv", "F · Δt = m · Δv", "Δv = m · Δt : F", "Δv = 30 kg · 3,0 s : 35 N ≈ 2,6 m/s"], falsch: 3,
     zeilenOk: ["Die Angaben stimmen: Masse, Einwirkdauer und Kraft.", "Gesucht ist die Zusatzgeschwindigkeit – richtig.", "Das ist die newtonsche Bewegungsgleichung – richtig."],
     optionen: ["Beim Umstellen sind F und m vertauscht: Richtig ist Δv = F · Δt : m.", "Die Masse muss zuerst in Gramm umgerechnet werden.",
                "Die Grundformel ist falsch – es gilt F · m = Δt · Δv.", "Die Einwirkdauer gehört nicht in die Rechnung."], richtig: 0,
     warum: [null, "Kilogramm ist schon die richtige Einheit: 1 N = 1 kg · m/s^{2}. Mit Gramm wäre das Ergebnis 1000-mal falsch.",
             "Zeile 3 stimmt: Kraft mal Einwirkdauer ist gleich Masse mal Zusatzgeschwindigkeit. Der Fehler passiert erst danach.",
             "Doch: Je länger die Kraft wirkt, desto größer wird Δv. Δt steht richtig in der Rechnung – m und F stehen an der falschen Stelle."],
     korrektur: {frage: "Wie groß ist die Zusatzgeschwindigkeit richtig?", wert: 3.5, einheit: "m/s", toleranz: .1,
       tipps: ["Teile F · Δt = m · Δv durch m: Δv = F · Δt : m.", "Δv = 35 N · 3,0 s : 30 kg = 105 N · s : 30 kg = …"],
       loesung: "Δv = F · Δt : m = 35 N · 3,0 s : 30 kg = 3,5 m/s"},
     erklaerung: "Beim Umstellen bleibt Δt bei F, nur m wandert durch Teilen auf die andere Seite. Die Einheitenprobe verrät den Fehler: kg · s : N ergibt kein m/s – N · s : kg dagegen schon."},
    // km/h nicht in m/s umgerechnet
    {titel: "Das Auto beim Anfahren", aufgabe: "Ein Auto (m = 1000 kg) beschleunigt in 10 s gleichmäßig aus dem Stand auf 72 km/h. Berechne die resultierende Kraft auf das Auto.",
     zeilen: ["Gegeben: m = 1000 kg; Δt = 10 s; Δv = 72 km/h", "Gesucht: F", "F · Δt = m · Δv  →  F = m · Δv : Δt", "F = 1000 kg · 72 m/s : 10 s", "F = 7200 N"], falsch: 3,
     zeilenOk: ["Aus dem Stand auf 72 km/h: Δv = 72 km/h – richtig.", "Gesucht ist die resultierende Kraft – richtig.", "Richtig nach F umgestellt: Beide Seiten wurden durch Δt geteilt."],
     optionen: ["72 km/h wurden nicht umgerechnet: Es sind 72 km/h : 3,6 = 20 m/s.", "Die Masse muss in Tonnen eingesetzt werden: 1 t.",
                "Falsch umgestellt: Richtig wäre F = m · Δt : Δv.", "Δv ist falsch: Weil das Auto aus dem Stand startet, ist Δv = 0."], richtig: 0,
     warum: [null, "Die Masse gehört in Kilogramm in die Gleichung, sonst kommt nicht Newton heraus – 1000 kg sind richtig. Schau dir die Geschwindigkeit an.",
             "Zeile 3 ist richtig: F · Δt = m · Δv geteilt durch Δt ergibt F = m · Δv : Δt.",
             "Aus dem Stand ist v_{vorher} = 0. Dann ist Δv gerade die ganze Endgeschwindigkeit, also 72 km/h – nicht null."],
     korrektur: {frage: "Wie groß ist die resultierende Kraft richtig?", wert: 2000, einheit: "N", toleranz: 20,
       tipps: ["Rechne um: 72 km/h : 3,6 = 20 m/s.", "F = 1000 kg · 20 m/s : 10 s = …"],
       loesung: "Δv = 72 km/h = 20 m/s;  F = m · Δv : Δt = 1000 kg · 20 m/s : 10 s = 2000 N"},
     erklaerung: "In F · Δt = m · Δv gehört die Geschwindigkeit in **m/s** (1 N = 1 kg · m/s^{2}). km/h vorher durch 3,6 teilen – sonst wird die Kraft 3,6-mal zu groß."},
    // Richtung von Δv nicht beachtet
    {titel: "Der Puck", aufgabe: "Ein Puck (m = 0,16 kg) gleitet mit 8,0 m/s über das Eis. Ein Schläger drückt 0,040 s lang mit 20 N **entgegen** der Bewegungsrichtung. Wie schnell ist der Puck danach?",
     zeilen: ["Gegeben: m = 0,16 kg; v_{vorher} = 8,0 m/s; F = 20 N (entgegen der Bewegung); Δt = 0,040 s", "Gesucht: v_{nachher}",
              "Δv = F · Δt : m = 20 N · 0,040 s : 0,16 kg = 5,0 m/s", "v_{nachher} = 8,0 m/s + 5,0 m/s", "v_{nachher} = 13 m/s"], falsch: 3,
     zeilenOk: ["Die Angaben stimmen.", "Gesucht ist die Geschwindigkeit danach – richtig.", "Richtig gerechnet: Der Betrag der Zusatzgeschwindigkeit ist 5,0 m/s."],
     optionen: ["Die Richtung wurde vergessen: Δv zeigt wie die Kraft nach hinten, also v_{nachher} = 8,0 m/s − 5,0 m/s.", "Δv ist falsch berechnet: Es müsste Δv = m · Δt : F heißen.",
                "Geschwindigkeiten darf man nicht addieren oder subtrahieren.", "Die Masse muss in Gramm eingesetzt werden: 160 g."], richtig: 0,
     warum: [null, "Zeile 3 stimmt: Δv = F · Δt : m = 5,0 m/s. Mit m · Δt : F käme gar keine Geschwindigkeit heraus.",
             "Doch – mit v_{nachher} = v_{vorher} + Δv setzt man Geschwindigkeiten zusammen. Man muss nur beachten, in welche Richtung Δv zeigt.",
             "Mit Gramm stimmt die Einheit nicht mehr, denn 1 N = 1 kg · m/s^{2}. Die 0,16 kg sind richtig eingesetzt."],
     korrektur: {frage: "Wie schnell ist der Puck nach dem Abbremsen richtig?", wert: 3, einheit: "m/s", toleranz: .1,
       tipps: ["Die Kraft wirkt nach hinten – also zeigt auch Δv = 5,0 m/s nach hinten.", "v_{nachher} = 8,0 m/s − 5,0 m/s = …"],
       loesung: "Δv = 5,0 m/s nach hinten: v_{nachher} = 8,0 m/s − 5,0 m/s = 3,0 m/s (weiter in die alte Richtung)"},
     erklaerung: "Δv zeigt immer in Kraftrichtung. Wirkt die Kraft entgegen der Bewegung, wird der Puck langsamer: Der Betrag von Δv wird **abgezogen**. 13 m/s hätte stutzig machen müssen – durch Bremsen wird nichts schneller."}
  ],
  // Rückmeldung je falscher Antwort (Reihenfolge wie options in inhalt/beweg2.json, null an der richtigen Antwort)
  warum: {
    0: [null, "Kraft und Masse stehen hier zusammen auf einer Seite. Die Wirkung einer Kraft hängt aber davon ab, wie lange sie wirkt (F · Δt) – die Masse gehört zur Geschwindigkeitsänderung (m · Δv).",
        "Hier sind Δt und Δv vertauscht. Prüfe die Einheiten: N · s = kg · m/s passt, aber N · m/s und kg · s passen nicht zusammen.",
        "Fast – aber eine Kraft bewirkt eine **Änderung** der Geschwindigkeit. Ein Körper, der schon mit v fährt, braucht zum Weiterfahren keine Kraft; deshalb steht dort Δv."],
    1: [null, "Dann könnte man nie bremsen: Beim Bremsen wirkt die Kraft entgegen der Bewegung, und Δv zeigt mit ihr nach hinten – nur deshalb wird der Körper langsamer.",
        "Dann würde ein Stoß nach vorn den Körper nach hinten schieben. Die Kraft ist die Ursache von Δv – beide zeigen in dieselbe Richtung.",
        "Quer zur **Bewegung** zeigt Δv nur, wenn auch die Kraft quer wirkt, etwa in einer Kurve. Zur Kraft selbst steht Δv nie senkrecht."],
    2: [null, "m/s ist die Einheit der Geschwindigkeit. Die Beschleunigung gibt an, um wie viel m/s sich v **pro Sekunde** ändert – deshalb wird noch einmal durch s geteilt.",
        "N · s ist die Einheit von F · Δt, also der linken Seite der Bewegungsgleichung. Für a = Δv : Δt teilst du m/s durch s.",
        "km/h ist wie m/s eine Einheit der Geschwindigkeit. Für die Beschleunigung fehlt das „pro Sekunde“: (m/s) : s = m/s^{2}."],
    3: [null, "Mit Δs/Δt berechnest du, wie schnell ein Körper ist. Ein Körper kann aber schnell und trotzdem unbeschleunigt sein – für a zählt die Änderung der Geschwindigkeit.",
        "Das ist der Kehrwert: Eine größere Geschwindigkeitsänderung in derselben Zeit ergäbe dann eine kleinere Beschleunigung – es ist aber umgekehrt.",
        "Die Masse kommt in der Definition von a nicht vor: Die Beschleunigung beschreibt nur die Bewegung. m · Δv ist die rechte Seite der Bewegungsgleichung."],
    4: [null, "kg · m/s ist die Einheit von m · Δv. Das steht in der Bewegungsgleichung aber N · s gegenüber – für N allein teilst du noch durch s: N = kg · m/s^{2}.",
        "Hier fehlt der Meter: Eine Kraft ändert eine Geschwindigkeit, und die wird in m/s gemessen. Aus 1 N · 1 s = 1 kg · 1 m/s folgt kg · m/s^{2}.",
        "Massen setzt man in Kilogramm ein, nicht in Gramm: 1 N beschleunigt 1 kg (= 1000 g) mit 1 m/s^{2}. Mit 1 g wäre die Einheit 1000-mal zu klein."],
    5: [null, "Die Kraft legt fest, wie sich die Geschwindigkeit ändert – nicht, welchen Weg der Körper zurücklegt. Aus dem Stand ist er erst nach 1 s genau 1 m/s schnell, vorher langsamer – in dieser Sekunde kommt er also weniger als 1 m weit.",
        "Die Festlegung des Newton benutzt m/s, nicht km/h: 1 N = 1 kg · m/s^{2}. 1 m/s sind 3,6 km/h, die Änderung ist also 3,6-mal so groß.",
        "Eine Kraft hält keine Geschwindigkeit fest – gleich bleibt die Geschwindigkeit gerade **ohne** resultierende Kraft. Mit 1 N wird der Körper in jeder Sekunde um 1 m/s schneller."],
    6: [null, "Eine große Masse erschwert die Änderung eher: Je größer m, desto kleiner Δv bei gleicher Kraft. Von allein ändert sie die Geschwindigkeit nicht.",
        "Ein schneller Körper bleibt ohne Kraft genauso schnell – das ist die Trägheit. Eine hohe Geschwindigkeit ist ein Zustand, keine Ursache für eine Änderung.",
        "Die Zeit allein ändert nichts: Ein Puck auf glattem Eis gleitet ohne Kraft fast unverändert weiter. Erst eine Kraft, die eine Zeit Δt lang wirkt, bewirkt ein Δv."],
    7: [null, "Dann bräuchte ein schwererer Körper weniger Kraft, um gleich stark beschleunigt zu werden. Du weißt aus Erfahrung: Ein voller Einkaufswagen braucht mehr Kraft als ein leerer.",
        "Dann bräuchte man für eine größere Beschleunigung weniger Kraft. Es ist umgekehrt: Doppelte Beschleunigung braucht doppelte Kraft.",
        "Masse (kg) und Beschleunigung (m/s^{2}) haben verschiedene Einheiten – man kann sie nicht addieren. 1 N = 1 kg · m/s^{2} zeigt, dass sie multipliziert werden."],
    10: [null, "Hier fehlt die Masse: Mit derselben Kraft und Einwirkdauer bekommt ein schwerer Wagen ein kleineres Δv als ein leichter.",
         "Ohne Kraft gibt es gar kein Δv – sie muss dabei sein. Und die Geschwindigkeit v, die der Körper vorher hat, spielt für Δv keine Rolle.",
         "Der Weg s und die Geschwindigkeit v kommen in F · Δt = m · Δv nicht vor. Neben der Kraft zählen die Einwirkdauer Δt und die Masse m."],
    11: [null, "Die anderen Kräfte wirken ja mit: Schiebst du mit 30 N und die Reibung bremst mit 30 N, ändert sich die Geschwindigkeit gar nicht – obwohl 30 N die größte Einzelkraft ist.",
         "Die Gewichtskraft zeigt nach unten. Bei einem Wagen auf waagrechter Bahn wird sie von der Bahn ausgeglichen – für seine Fahrt zählt die Summe aller Kräfte.",
         "Die kleinste Kraft allein bestimmt nichts. Alle Kräfte wirken zusammen: Gleich gerichtete addiert man, entgegengesetzte subtrahiert man."],
    12: [null, "Mehr Masse heißt mehr Trägheit: Ein schwerer Wagen ist mit derselben Kraft schwerer in Fahrt zu bringen – sein Δv wird kleiner, nicht größer.",
         "Gleich sind nur F und Δt, nicht das Ergebnis: In Δv = F · Δt : m steht m im Nenner. Das gleiche F · Δt wird durch die doppelte Masse geteilt.",
         "Größer kann Δv bei einem schwereren Wagen nicht werden. Und die Masse wirkt nicht quadratisch: Doppelte Masse ergibt einfach das halbe Δv."],
    13: [null, "Du hast nur die doppelte Kraft beachtet. Weil sie aber nur halb so lange wirkt, gleicht sich das wieder aus.",
         "Du hast nur die halbe Einwirkdauer beachtet. Die doppelte Kraft gleicht die kürzere Zeit genau aus.",
         "Die beiden Änderungen verstärken sich nicht, sie heben sich auf: Die eine verdoppelt das Produkt F · Δt, die andere halbiert es."],
    14: [null, "Eine Kraft in Fahrtrichtung würde den Radfahrer schneller machen. Beim Bremsen wird er langsamer – also müssen Kraft und Δv nach hinten zeigen.",
         "Du denkst vielleicht, Δv zeigt wie die Geschwindigkeit nach vorn. Δv ist aber die Änderung: Ein Δv nach vorn würde den Radfahrer schneller machen.",
         "Die Bremsklötze reiben gegen die Drehung der Räder – die Bremskraft wirkt entgegen der Fahrtrichtung. Eine Kraft nach vorn würde nicht bremsen."],
    15: [null, "Ohne Antrieb würde das Auto durch Reibung und Luftwiderstand langsamer. Der Motor muss genau diese bremsenden Kräfte ausgleichen.",
         "Auch bei konstanter Fahrt wirken Rollreibung und Luftwiderstand. Sie sind nicht null, sondern werden von der Antriebskraft ausgeglichen.",
         "Die Gewichtskraft wirkt auf jedes Auto auf der Erde (F_{G} = m · g). Sie zeigt nach unten, wird von der Straße ausgeglichen und ändert an der Fahrt nichts."],
    16: [null, "Das Tempo bleibt gleich, die Richtung aber nicht. Auch eine Richtungsänderung ist ein Δv – ohne Kraft würde der Bob geradeaus weiterfahren und aus der Kurve fliegen.",
         "Eine Kraft in Fahrtrichtung würde den Bob schneller machen. Er fährt aber mit gleichem Tempo, nur seine Richtung ändert sich.",
         "Eine Kraft entgegen der Fahrtrichtung würde den Bob abbremsen. Damit sich nur die Richtung ändert, muss die Kraft quer zur Bahn wirken."],
    17: [null, "Im t-s-Diagramm hieße eine Gerade „gleichförmig“. Hier ist aber v aufgetragen: Eine steigende Gerade bedeutet, dass v gleichmäßig zunimmt.",
         "Steiler heißt: In derselben Zeit steigt v stärker an. A hat also das größere Δv pro Sekunde, nicht das kleinere.",
         "Beim Abbremsen würde v kleiner, der Graph würde fallen. Beide Geraden steigen – beide Wagen werden schneller."],
    18: [null, "Hier sind F und m vertauscht. m steht rechts bei Δv – nur m musst du durch Teilen auf die andere Seite bringen.",
         "Hier sind m und Δt vertauscht: Δt steht links bei F und bleibt ein Faktor im Zähler, m steht bei Δv und kommt durch Teilen hinüber.",
         "Δt steht links neben F und bleibt im Zähler. Geteilt wird nur durch m, nicht durch m · Δt."],
    19: [null, "Etwa 1,6 m/s^{2} gelten auf dem Mond, dort ist der Ortsfaktor ungefähr 1,6 N/kg. Gefragt ist der Fall auf der Erde.",
         "Die Zahl stimmt, die Einheit nicht: m/s ist eine Geschwindigkeit. Der Stein wird in jeder Sekunde um 9,81 m/s schneller – das ist eine Beschleunigung in m/s^{2}.",
         "3,6 ist der Umrechnungsfaktor zwischen m/s und km/h, keine Beschleunigung. Auf der Erde wird der Stein mit a = g beschleunigt."],
    20: [null, "Auf dem Mond ist der Wagen nur „leichter“, weil seine Gewichtskraft kleiner ist. Seine Masse – und nur die zählt in a = F : m – bleibt gleich.",
         "Etwa ein Sechstel so groß ist auf dem Mond die Gewichtskraft. Auf der waagrechten Bahn spielt sie für das Anschieben keine Rolle – Kraft und Masse sind dieselben.",
         "Für einen Faktor 2 gibt es keinen Grund: Deine Kraft und die Masse des Wagens sind auf dem Mond genauso groß wie auf der Erde."],
    27: [null, "Etwas Reibung gibt es auch beim schnellen Ziehen – darum rutscht das Geschirr ein kleines Stück mit. Entscheidend ist, wie kurz sie wirkt.",
         "Die Masse eines Körpers ändert sich durch Ziehen nicht. Sie ist bei jeder Bewegung und an jedem Ort gleich.",
         "Die Gewichtskraft zeigt senkrecht nach unten, nicht nach hinten. Sie drückt das Geschirr auf den Tisch, verschiebt es aber nicht."],
    28: [null, "20 N sind zwar mehr Kraft, sie wirken aber auf 5 kg: a = 20 N : 5 kg = 4 m/s^{2} – weniger als bei 10 N und 2 kg.",
         "Kleine Kraft, mittlere Masse: a = 6 N : 3 kg = 2 m/s^{2} – das ist sogar die kleinste Beschleunigung von allen.",
         "Die größte Kraft bringt nicht automatisch die größte Beschleunigung: Hier ist auch die Masse am größten, a = 30 N : 10 kg = 3 m/s^{2}."],
    29: [null, "Du hast 3,0 m/s und 5,0 m/s addiert. Sie zeigen aber in entgegengesetzte Richtungen: Die ersten 3,0 m/s von Δv bremsen die Kiste bis zum Stillstand, erst der Rest treibt sie nach Westen.",
         "Der Betrag stimmt, die Richtung nicht: Δv = 5,0 m/s nach Westen ist größer als die 3,0 m/s nach Osten. Die Kiste wird nicht nur gebremst, sie kehrt um.",
         "5,0 m/s ist erst die Zusatzgeschwindigkeit Δv. Die Kiste hatte vorher schon 3,0 m/s nach Osten – beides musst du zu v_{nachher} zusammensetzen."]
  },
  spick: {
    kern: ["Newtonsche Bewegungsgleichung: **F · Δt = m · Δv** (F: resultierende Kraft in N, Δt: Einwirkdauer in s, m: Masse in kg, Δv: Zusatzgeschwindigkeit in m/s)",
           "**Δv zeigt immer in Kraftrichtung**: Kraft nach vorn → schneller, nach hinten → langsamer, quer → die Richtung ändert sich",
           "Größere Kraft oder längere Einwirkdauer → größeres Δv; bei gleichem F · Δt: doppelte Masse → halbes Δv",
           "Beschleunigung **a = Δv : Δt**, Einheit 1 m/s^{2} – im t-v-Diagramm die Steigung der Geraden",
           "**F = m · a**, also a = F : m; 1 N = 1 kg · m/s^{2}; ohne resultierende Kraft ist Δv = 0"],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn mit der newtonschen Bewegungsgleichung, wann ein Wagen schneller wird, wann er langsamer wird und wann sich nur seine Richtung ändert.",
       begriffe: [["Kraft"], ["Einwirkdauer", "Δt", "lange", "Zeit", "Dauer"], ["Masse", "kg", "schwer"], ["Zusatzgeschwindigkeit", "Δv", "Geschwindigkeitsänderung", "Änderung der Geschwindigkeit", "Geschwindigkeit ändert"],
                  ["Richtung", "gerichtet", "Kraftrichtung"], ["nach vorn", "Fahrtrichtung", "schneller"], ["entgegen", "nach hinten", "langsamer", "brems"], ["quer", "seitlich", "senkrecht", "Kurve"]],
       muster: "Nach **F · Δt = m · Δv** bewirkt eine **Kraft**, die eine **Einwirkdauer** Δt lang auf einen Körper der **Masse** m wirkt, eine **Zusatzgeschwindigkeit Δv**. Δv zeigt immer in **Kraftrichtung**: " +
         "Wirkt die Kraft **in Fahrtrichtung**, wird der Wagen schneller; wirkt sie **entgegen** der Fahrtrichtung, wird er langsamer. Zeigt die Kraft immer **quer** zur Fahrtrichtung, wie in einer **Kurve**, ändert sich nur die Richtung."},
      {frage: "Erkläre, was die Beschleunigung a angibt, wie du sie aus einem t-v-Diagramm bestimmst und warum ein schwerer Wagen bei gleicher Kraft langsamer in Fahrt kommt.",
       // keine Allerweltszeichen/-wörter wie „:“ oder „durch“ (treffen auch „dadurch“ oder „a = F : m“); „Meter pro Sekunde“ allein wäre die Einheit der Geschwindigkeit
       begriffe: [["Beschleunigung", "beschleunigt"], ["Δv", "Geschwindigkeitsänderung", "Zusatzgeschwindigkeit", "Änderung der Geschwindigkeit", "Geschwindigkeit ändert"], ["Δt", "Zeit", "Sekunde"],
                  ["geteilt", "dividiert", "Quotient", "durch Δt", "durch die Zeit", "durch die Dauer", "pro Sekunde", "je Sekunde", "jeder Sekunde", "Δv : Δt", "Δv/Δt", "Δv / Δt", "v : t", "v/t", "v / t"],
                  ["m/s²", "m/s^2", "m/s2", "s²", "Quadrat", "hoch 2", "hoch zwei"], ["Steigung", "steil"], ["F = m · a", "a = F : m", "m · a", "m*a", "m * a", "Kraft"], ["Masse", "schwer"]],
       muster: "Die **Beschleunigung** a = **Δv : Δt** gibt an, um wie viel sich die Geschwindigkeit in jeder **Sekunde** ändert; ihre Einheit ist **m/s^{2}**. Im t-v-Diagramm ist sie die **Steigung** der Geraden: " +
         "Je steiler, desto größer die Beschleunigung. Aus **F = m · a** folgt a = F : m – bei gleicher **Kraft** hat ein Wagen mit doppelter **Masse** nur die halbe Beschleunigung."}
    ]
  },
  zuordnung: {
    "Gleiche Kraft, gleiche Zeit – verschiedene Massen": [0, 10, 11, 12, 13, 23],
    "1 N = 1 kg · m/s²": [4, 5, 19],
    "Schubkraft und Einwirkdauer": [6, 8, 15, 18],
    "Kurze Einwirkdauer – große Kraft": [24, 27],
    "Bremsen: Δv zeigt nach hinten": [1, 14, 16, 26, 29],
    "Beschleunigung: a = F : m": [2, 3, 7, 9, 17, 20, 21, 22, 25, 28]
  },
  hilfen: {
    21: ["Kraft, Masse und Beschleunigung: F = m · a", "Einsetzen: F = 0,50 kg · 3,0 m/s^{2}", "Ausrechnen – 1 kg · m/s^{2} = 1 N: F = 0,50 · 3,0 N = … N"],
    22: ["Aus F = m · a folgt a = F : m.", "Einsetzen: a = 2,0 N : 0,40 kg", "Rechne 2,0 : 0,40 = … – die Einheit 1 N/kg ist 1 m/s^{2}."],
    23: ["Stelle F · Δt = m · Δv nach Δv um: Δv = F · Δt : m.", "Einsetzen: Δv = 4,0 N · 3,0 s : 2,0 kg", "F · Δt = 12 N · s, jetzt noch durch 2,0 kg teilen: Δv = … m/s"],
    24: ["Aus F · Δt = m · Δv folgt F = m · Δv : Δt.", "Aus dem Stand auf 15 m/s: Δv = 15 m/s; dazu m = 1200 kg und Δt = 5,0 s einsetzen.", "F = 1200 kg · 15 m/s : 5,0 s = 18 000 kg · m/s : 5,0 s = … N"],
    25: ["Rechne die Geschwindigkeit zuerst in m/s um: km/h durch 3,6 teilen.", "72 km/h : 3,6 = 20 m/s, also Δv = 20 m/s in Δt = 20 s.", "a = Δv : Δt = 20 m/s : 20 s = … m/s^{2}"],
    26: ["Stelle F · Δt = m · Δv nach Δt um: Δt = m · Δv : F.", "Bis zum Stillstand: Δv = 6,0 m/s; dazu m = 80 kg und F = 120 N einsetzen.", "Δt = 80 kg · 6,0 m/s : 120 N = 480 kg · m/s : 120 N = … s"]
  }
});
})();
