/* ---------- 40_lern_strom1.js ---------- */
/* =====================================================================
   Lernfunktionen · Raum 1 (Kap. 1.1–1.3: Stromstärke, Spannung, Widerstand)
   Türrätsel „Stromschloss“ · Suchbild „Messung am Schülertisch“ · Lernzettel · Fehler → Exponat · Tipps zu Rechenaufgaben
   (Das Labor sitzt am Exponat „Wovon der Widerstand abhängt“ in 20_strom1.js.)
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;

/* ---------- kleine Zeichenhilfen ---------- */
const line = (g, pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = "round"; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const txt = (g, s, x, y, size, col, align = "center", weight = 600) => { g.fillStyle = col; g.font = `${weight} ${size}px system-ui, sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.fillText(s, x, y); };
function meterSym(g, x, y, r, letter, col = "#f2f2f2", ink = "#111"){ g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = 4; g.stroke(); txt(g, letter, x, y + 2, r * 1.05, ink, "center", 700); }
function lockIcon(g, x, y, s, open, col){ g.strokeStyle = col; g.lineWidth = s * .16; g.beginPath(); g.arc(x, y - s * .25 - (open ? s * .35 : 0), s * .32, Math.PI, 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.roundRect(x - s * .48, y - s * .25, s * .96, s * .78, s * .1); g.fill(); g.fillStyle = "#10131a"; g.beginPath(); g.arc(x, y + .1 * s, s * .1, 0, 7); g.fill(); }

/* ---------- Türrätsel: Das Stromschloss ---------- */
const raetsel = {
  titel: "Das Stromschloss",
  text: "Der Riegel der Tür wird von einem Elektromagneten gehalten. Er gibt die Tür nur frei, wenn **genau I = 0,25 A** fließt. Die Quelle liefert **U = 9 V**, der Magnet selbst hat praktisch keinen Widerstand. Baue das Amperemeter richtig ein und wähle den passenden Widerstand.",
  regler: [{id: "R", name: "Widerstand R", einheit: "Ω", min: 2, max: 60, schritt: 2, wert: 10},
           {id: "am", name: "Amperemeter einbauen", optionen: ["in Reihe", "parallel zum Widerstand"], wert: 1}],
  zeichne(g, w, h, v, t, ok){
    const bg = "#10131a"; g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const short = v.am === 1, I = short ? 0 : 9 / v.R, x0 = 180, x1 = 800, y0 = 160, y1 = 420, xm = (x0 + x1) / 2, yb = 100, wire = "#d8a85a";
    txt(g, "Stromschloss · öffnet bei I = 0,25 A", w / 2, 38, 30, "#ffe9a8");
    // Leitungen; Amperemeter parallel → zusätzlicher Zweig über dem Widerstand
    line(g, [[x0, y1], [x0, y0], [x1, y0], [x1, y1], [x0, y1]], wire, 7);
    if (short) line(g, [[xm - 110, y0], [xm - 110, yb], [xm + 110, yb], [xm + 110, y0]], wire, 6);
    // Elektronen vom Minuspol (unten links) über unten → rechts (Magnet) → oben → links zum Pluspol.
    // Kurzschluss: Sie nehmen den Weg durchs Messgerät (fast kein Widerstand) statt durch R – sehr viele, sehr schnell.
    const path = [[x0, y1], [x1, y1], [x1, y0], ...(short ? [[xm + 110, y0], [xm + 110, yb], [xm - 110, yb], [xm - 110, y0]] : []), [x0, y0], [x0, y1]], segs = []; let L = 0;
    for (let i = 1; i < path.length; i++) { const [ax, ay] = path[i - 1], [bx, by] = path[i], d = Math.hypot(bx - ax, by - ay); segs.push([ax, ay, bx, by, L, d]); L += d; }
    // In Reihe höchstens wie bei 2,5 A (R = 2 Ω ergäbe 4,5 A · 260 = 1170 px/s), damit der Kurzschluss (760 px/s) immer am schnellsten aussieht
    const n = short ? 44 : 26, sp = short ? 760 : Math.min(I, 2.5) * 260; g.fillStyle = "#7fd8ff";
    for (let i = 0; i < n; i++) { const s = ((i / n) * L + t * sp) % L, q = segs.find(a => s < a[4] + a[5]) || segs[segs.length - 1], k = (s - q[4]) / q[5];
      g.beginPath(); g.arc(q[0] + (q[2] - q[0]) * k, q[1] + (q[3] - q[1]) * k, 6, 0, 7); g.fill(); }
    // Quelle links (lange Platte = Pluspol, kurze dicke = Minuspol)
    g.fillStyle = bg; g.fillRect(x0 - 36, 250, 72, 44); line(g, [[x0 - 34, 262], [x0 + 34, 262]], "#ffffff", 6); line(g, [[x0 - 18, 282], [x0 + 18, 282]], "#ffffff", 10);
    txt(g, "U = 9 V", x0 - 48, 272, 26, "#ffffff", "right"); txt(g, "+", x0 + 50, 250, 26, "#ff6b5b"); txt(g, "−", x0 + 50, 294, 30, "#6ba8ff");
    // Widerstand oben
    g.fillStyle = bg; g.fillRect(xm - 90, y0 - 26, 180, 52); g.strokeStyle = "#ffffff"; g.lineWidth = 5; g.strokeRect(xm - 90, y0 - 26, 180, 52);
    txt(g, `R = ${v.R} Ω`, xm, y0 + 2, 26, "#ffffff");
    // Schloss rechts (Elektromagnet, in Reihe im Kreis)
    const lt = ok ? 207 : 234; g.fillStyle = bg; g.fillRect(x1 - 42, lt, 84, 322 - lt); lockIcon(g, x1, 282, 76, ok, ok ? "#5fd38d" : "#ff5a48");   // Leitung endet am Bügel (keine Lücke im Kreis)
    txt(g, "Elektromagnet", x1 - 54, 240, 22, "#c9d1e0", "right", 500);
    // Amperemeter
    if (short) { meterSym(g, xm, yb, 30, "A"); txt(g, "I: sehr groß!", xm + 130, yb, 24, "#ff8a7a", "left", 700);
      if (Math.sin(t * 8) > 0) txt(g, "⚡ Kurzschluss: R ist überbrückt!", xm, 292, 28, "#ff5a48", "center", 700);
      txt(g, "Fast der ganze Strom fließt durchs Messgerät.", xm, 334, 22, "#ffb3a8"); txt(g, "Viel zu großer Strom – Messgerät in Gefahr!", xm, 368, 22, "#ffb3a8"); }
    else { meterSym(g, xm, y1, 32, "A");
      txt(g, `I = ${I.toFixed(2).replace(".", ",")} A`, xm, y1 + 62, 30, Math.abs(I - .25) < 1e-9 ? "#5fd38d" : "#ffe9a8", "center", 700); }
    if (ok) txt(g, "🔓 Riegel offen", x1 - 54, 300, 26, "#5fd38d", "right", 700);
  },
  pruefe(v){
    if (v.am === 1) return {ok: false, text: "Das Amperemeter liegt **parallel** zum Widerstand. Weil es selbst fast keinen Widerstand hat, fließt beinahe der ganze Strom durch das Messgerät statt durch R – der Widerstand ist **kurzgeschlossen**. Der Strom wird viel zu groß, das Messgerät kann Schaden nehmen. Ein Amperemeter baut man **in Reihe** ein, damit der ganze Strom hindurchfließt."};
    const I = 9 / v.R, rund = Math.abs(I * 100 - Math.round(I * 100)) < 1e-9;
    if (Math.abs(I - .25) < 1e-9) return {ok: true};
    return {ok: false, text: `Bei R = ${v.R} Ω fließt der Strom I = U : R = 9 V : ${v.R} Ω ${rund ? "=" : "≈"} ${I.toFixed(2).replace(".", ",")} A. ${I > .25 ? "Das ist zu viel – der Widerstand muss **größer** sein." : "Das ist zu wenig – der Widerstand muss **kleiner** sein."}`};
  },
  tipps: ["Ein Amperemeter muss vom ganzen Strom durchflossen werden. Wie wird es also eingebaut?", "Zwischen Spannung, Stromstärke und Widerstand gilt R = U : I.", "R = U : I = 9 V : 0,25 A = 900 : 25 Ω = … Ω – rechne aus und stelle diesen Widerstand ein."],
  loesung: {R: 36, am: 0},
  erfolg: "Das Amperemeter zeigt genau **0,25 A** – der Elektromagnet zieht den Riegel zurück. Die Tür ist offen!"
};

/* ---------- Suchbild: Messung am Schülertisch ---------- */
function bench(g, w, h){
  // Wand, Tafel und Tisch
  g.fillStyle = "#efe6d2"; g.fillRect(0, 0, w, 400); g.fillStyle = "#c79a62"; g.fillRect(0, 400, w, 400);
  g.fillStyle = "#a87c48"; for (let y = 430; y < 800; y += 60) g.fillRect(0, y, w, 3);
  g.fillStyle = "#2e4a3c"; g.beginPath(); g.roundRect(70, 50, 430, 230, 10); g.fill(); g.strokeStyle = "#8a6a3a"; g.lineWidth = 10; g.stroke();
  txt(g, "Merke:", 100, 95, 30, "#f4f1e6", "left", 700); txt(g, "1 A = 1000 mA", 100, 145, 32, "#f4f1e6", "left", 500); txt(g, "1 Ω = 1 V : 1 A", 100, 195, 32, "#f4f1e6", "left", 500);
  txt(g, "R = U : I", 100, 245, 32, "#f4f1e6", "left", 500);
  // Poster
  g.fillStyle = "#fff8e6"; g.fillRect(560, 60, 260, 200); g.strokeStyle = "#b3261e"; g.lineWidth = 4; g.strokeRect(560, 60, 260, 200);
  txt(g, "Sicher experimentieren", 690, 95, 22, "#b3261e", "center", 700); txt(g, "Nie an die Steckdose!", 690, 140, 22, "#333"); txt(g, "Erst aufbauen,", 690, 180, 22, "#333"); txt(g, "dann einschalten.", 690, 215, 22, "#333");
  // Heft (Fehler 4)
  g.save(); g.translate(1010, 230); g.rotate(-.06); g.fillStyle = "#ffffff"; g.fillRect(-150, -110, 300, 220); g.strokeStyle = "#9ab"; g.lineWidth = 2;
  for (let y = -70; y < 110; y += 30) { g.beginPath(); g.moveTo(-140, y); g.lineTo(140, y); g.stroke(); }
  // Schrift steht auf den Heftlinien (nicht durchgestrichen)
  txt(g, "Merke:", -135, -88, 24, "#1d3a8a", "left", 700); txt(g, "Die Elektronen fließen", -135, -54, 24, "#1d3a8a", "left", 500);
  txt(g, "vom Pluspol zum", -135, -24, 24, "#1d3a8a", "left", 500); txt(g, "Minuspol.", -135, 6, 24, "#1d3a8a", "left", 500); g.restore();
  // Leitungen
  const wire = "#2b2b2b";
  line(g, [[300, 520], [370, 640]], wire, 7);                       // Pluspol → Schalter
  line(g, [[470, 640], [600, 640], [600, 540]], wire, 7);           // Schalter → Lampe
  line(g, [[680, 540], [680, 600], [790, 600]], wire, 7);           // Lampe → Voltmeter (in Reihe!)
  line(g, [[930, 600], [1040, 600], [1040, 720], [150, 720], [150, 540]], wire, 7);   // zurück zum Minuspol
  // Amperemeter parallel zur Lampe (Fehler 1)
  line(g, [[600, 560], [560, 400], [600, 330]], "#c0392b", 5); line(g, [[680, 560], [720, 400], [680, 330]], "#2b2b2b", 5);
  meterSym(g, 640, 320, 56, "A");
  // Batterie (Fehler 5: falsche Einheit)
  g.fillStyle = "#2f6db5"; g.beginPath(); g.roundRect(130, 470, 190, 110, 10); g.fill(); g.fillStyle = "#ffffff"; g.fillRect(130, 470, 190, 34);
  txt(g, "Blockbatterie", 225, 488, 22, "#2f6db5", "center", 700); txt(g, "9 A", 225, 540, 40, "#ffffff", "center", 800);
  txt(g, "−", 150, 520, 34, "#ffffff"); txt(g, "+", 300, 520, 34, "#ffffff");
  // Schalter offen (Fehler 3)
  g.fillStyle = "#6b4a2a"; g.fillRect(360, 645, 120, 26); g.fillStyle = "#c99a2e"; g.beginPath(); g.arc(372, 645, 9, 0, 7); g.arc(468, 645, 9, 0, 7); g.fill();
  line(g, [[372, 640], [455, 585]], "#c99a2e", 8);
  // Lampe leuchtet
  const gr = g.createRadialGradient(640, 500, 10, 640, 500, 120); gr.addColorStop(0, "rgba(255,230,120,.95)"); gr.addColorStop(1, "rgba(255,230,120,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(640, 500, 120, 0, 7); g.fill(); g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(640, 490, 44, 0, 7); g.fill();
  g.fillStyle = "#8a8a8a"; g.fillRect(612, 530, 56, 28);
  // Voltmeter in Reihe (Fehler 2)
  meterSym(g, 860, 600, 62, "V");
  // Ablenker: Lineal und Schutzbrille
  g.fillStyle = "#f2d16b"; g.save(); g.translate(930, 450); g.rotate(.08); g.fillRect(-120, -14, 240, 28); g.fillStyle = "#333"; for (let i = 0; i <= 20; i++) g.fillRect(-118 + i * 11.8, -14, 2, i % 5 ? 8 : 14); g.restore();
  // Schutzbrille neben der Leitung (nicht darauf)
  g.strokeStyle = "#333"; g.lineWidth = 6; g.beginPath(); g.ellipse(1158, 520, 34, 24, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(1076, 520, 34, 24, 0, 0, 7); g.stroke(); line(g, [[1110, 520], [1124, 520]], "#333", 6);
}
const suchbild = {
  titel: "Messung am Schülertisch",
  text: "Jonas will die Stromstärke und die Spannung an einer Lampe messen. Auf seinem Tisch und in seinem Heft stecken **fünf Fehler**. Klicke sie an und begründe, was falsch ist.",
  ort: {x: -3.6, z: -9.5, ry: 0},
  zeichne: bench,
  fehler: [
    {x: 640, y: 330, r: 90, name: "Das Amperemeter", frage: "Was ist am Amperemeter falsch?",
     optionen: ["Es misst die Spannung statt der Stromstärke.", "Es ist parallel zur Lampe geschaltet – es gehört in Reihe in den Stromkreis.", "Es müsste direkt am Pluspol sitzen.", "Hier ist alles richtig."], richtig: 1,
     warum: ["Das „A“ auf dem Messgerät zeigt: Es ist ein Amperemeter und misst die Stromstärke. Falsch ist nicht das Gerät, sondern wie es angeschlossen ist.", null,
             "Im unverzweigten Stromkreis ist die Stromstärke überall gleich groß – ein Amperemeter darf an jeder Stelle sitzen, solange es in Reihe liegt.",
             "Verfolge die beiden Leitungen des Messgeräts: Sie führen zu den zwei Anschlüssen der Lampe. Das Gerät liegt also neben der Lampe statt im Stromweg."],
     erklaerung: "Ein Amperemeter hat einen sehr kleinen Widerstand. Parallel zur Lampe fließt fast der ganze Strom durch das Messgerät – die Lampe geht aus, das Gerät kann Schaden nehmen. Richtig: **in Reihe**."},
    {x: 860, y: 600, r: 80, name: "Das Voltmeter", frage: "Was ist am Voltmeter falsch?",
     optionen: ["Ein Voltmeter darf nicht in der Nähe einer Lampe stehen.", "Es misst nur bei offenem Schalter.", "Es ist in Reihe in die Leitung eingebaut – es gehört parallel zur Lampe.", "Es müsste in die Batterie eingebaut werden."], richtig: 2,
     warum: ["Wo das Messgerät auf dem Tisch steht, spielt keine Rolle. Entscheidend ist, wie es in den Stromkreis geschaltet ist.",
             "Die Spannung an der Lampe misst man bei geschlossenem Schalter, während Strom durch die Lampe fließt. Das Problem ist, wie das Voltmeter eingebaut ist.", null,
             "In eine Batterie baut man nichts ein. Ein Voltmeter legt man mit seinen zwei Leitungen an die beiden Anschlüsse des Bauteils, dessen Spannung du messen willst."],
     erklaerung: "Ein Voltmeter hat einen sehr großen Widerstand. In Reihe lässt es kaum Strom durch – die Lampe bliebe dunkel. Spannung misst man **parallel** zum Bauteil."},
    {x: 420, y: 630, r: 75, name: "Der Schalter", frage: "Was stimmt hier nicht?",
     optionen: ["Der Schalter ist offen, trotzdem leuchtet die Lampe – im unterbrochenen Stromkreis fließt aber kein Strom.", "Ein Schalter muss immer am Minuspol sitzen.", "Ein offener Schalter verstärkt den Strom.", "Der Schalter ist zu klein."], richtig: 0,
     warum: [null, "Im unverzweigten Stromkreis darf der Schalter an jeder Stelle sitzen: Ist er offen, ist der ganze Kreis unterbrochen.",
             "Ein offener Schalter unterbricht den Stromkreis – dann fließt gar kein Strom mehr, nicht mehr Strom.",
             "Auf die Größe kommt es nicht an. Entscheidend ist, ob der Schalter den Kreis schließt oder unterbricht – und hier ist er offen."],
     erklaerung: "Strom fließt nur im **geschlossenen** Stromkreis. Bei offenem Schalter ist der Kreis unterbrochen – die Lampe müsste dunkel sein."},
    {x: 1010, y: 230, r: 120, name: "Der Merksatz im Heft", frage: "Was ist am Merksatz falsch?",
     optionen: ["Elektronen bewegen sich gar nicht, nur die Atomrümpfe.", "Die Elektronen fließen in beide Richtungen gleichzeitig.", "Nichts – der Satz stimmt.", "Elektronen fließen außerhalb der Quelle vom Minuspol zum Pluspol – im Heft steht es genau verkehrt."], richtig: 3,
     warum: ["Umgekehrt: Die Atomrümpfe bleiben an ihren Plätzen im Metall, bewegen können sich nur die freien Elektronen.",
             "An einer Batterie fließen alle freien Elektronen gemeinsam in eine Richtung – gerade das macht den gerichteten Strom aus.",
             "Von Plus nach Minus zeigt die technische Stromrichtung, die man früher festgelegt hat. Die Elektronen selbst fließen genau andersherum.", null],
     erklaerung: "Am Minuspol herrscht Elektronenüberschuss, am Pluspol Elektronenmangel: Die Elektronen fließen **vom Minuspol zum Pluspol**. Nur die **technische Stromrichtung** ist von + nach − festgelegt."},
    {x: 225, y: 530, r: 85, name: "Die Beschriftung der Batterie", frage: "Was ist an der Aufschrift falsch?",
     optionen: ["Eine Blockbatterie hat immer 12 A.", "Auf einer Spannungsquelle steht ihre Spannung in Volt: 9 V, nicht 9 A.", "Batterien gibt man in Ohm an.", "Die Angabe stimmt so."], richtig: 1,
     warum: ["12 V hat die Autobatterie, eine Blockbatterie hat 9 V. Und auch auf der Autobatterie steht eine Spannung in Volt, keine Stromstärke in Ampere.", null,
             "Ohm ist die Einheit des Widerstands. Eine Batterie ist eine Spannungsquelle – auf ihr steht ihre Spannung in Volt.",
             "Ampere ist die Einheit der Stromstärke. Wie viel Strom fließt, hängt vom angeschlossenen Stromkreis ab – auf der Batterie kann deshalb nur ihre Spannung stehen."],
     erklaerung: "Eine Spannungsquelle kennzeichnet man durch ihre **Spannung** – Einheit **Volt (V)**. Wie groß die Stromstärke ist, hängt vom angeschlossenen Stromkreis ab."}
  ],
  // richtig dargestellte Details: Tafel, Sicherheitsplakat, Rückleitung zum Minuspol, Lineal, Schutzbrille (keine Überlappung mit den Fehlerkreisen)
  ablenker: [
    {x: 215, y: 170, r: 100, text: "Auf der Tafel stimmt alles: 1 A = 1000 mA, der Widerstand ist **R = U : I**, und daraus folgt für die Einheit 1 Ω = 1 V : 1 A."},
    {x: 690, y: 150, r: 75, text: "Die Regeln stimmen: In der Steckdose stecken lebensgefährliche **230 V**, Schülerversuche laufen mit kleinen Spannungen. Und eingeschaltet wird erst, wenn alles fertig aufgebaut ist."},
    {x: 600, y: 720, r: 50, text: "Die lange Leitung führt zurück zum **Minuspol** der Batterie. Richtig so: Ein Stromkreis braucht einen geschlossenen Weg von einem Pol der Quelle zum anderen."},
    {x: 930, y: 450, r: 70, text: "Das Lineal liegt nur auf dem Tisch und ist nicht angeschlossen – es gehört nicht zum Stromkreis. Mit ihm zeichnest du Schaltplan und Diagramm sauber."},
    {x: 1117, y: 520, r: 65, text: "Die Schutzbrille liegt griffbereit neben dem Aufbau und nicht auf der Leitung. Bei Versuchen mit kleinen Spannungen aus einer Batterie ist das in Ordnung."}
  ],
  abschluss: "So baut man richtig: Amperemeter **in Reihe**, Voltmeter **parallel**, Schalter geschlossen – und die Elektronen fließen vom Minus- zum Pluspol."
};

R3D.lern.raum("strom1", {
  raetsel, suchbild,
  spick: {
    kern: ["Strom im Metall: **gerichtete Bewegung freier Elektronen** – nur im **geschlossenen** Stromkreis; im unverzweigten Kreis ist I überall gleich",
           "Stromstärke I: Einheit 1 A = 1000 mA, Messgerät Amperemeter – **in Reihe**", "Spannung U (Antrieb des Stroms): Einheit 1 V, Messgerät Voltmeter – **parallel**",
           "Widerstand **R = U : I**, Einheit 1 Ω = 1 V/A; daraus U = R · I und I = U : R", "Elektronen fließen vom Minuspol zum Pluspol; technische Stromrichtung von + nach −",
           "Widerstand eines Drahts: größer bei **größerer Länge**, kleiner bei **größerer Querschnittsfläche** (dicker Draht); er hängt vom Material ab und steigt bei Metallen mit der Temperatur"],
    fragen: [
      {frage: "Erkläre deinem Banknachbarn, was elektrischer Strom in einem Metalldraht ist und warum er nur im geschlossenen Stromkreis fließt.",
       begriffe: [["Elektronen", "Elektron"], ["frei", "beweglich"], ["gerichtet", "in eine Richtung", "Richtung"], ["Minuspol", "Minus"], ["Pluspol", "Plus"], ["geschlossen", "unterbrochen", "Unterbrechung"], ["Spannung", "Antrieb", "antreib", "getrieben"]],
       muster: "Im Metall gibt es **freie Elektronen**. Liegt eine **Spannung** an, bewegen sie sich **gerichtet** – vom **Minuspol** durch die Leitungen zum **Pluspol**. Das ist der elektrische Strom. Ist der Stromkreis irgendwo unterbrochen, können die Elektronen nicht weiter – nur im **geschlossenen** Kreis fließt Strom."},
      {frage: "Erkläre, wie du den Widerstand eines Drahts mit zwei Messgeräten bestimmst und wovon er abhängt.",
       begriffe: [["Amperemeter", "Strommess"], ["Voltmeter", "Spannungsmess"], ["Reihe", "hintereinander"], ["parallel"], ["R = U : I", "U : I", "U:I", "U/I", "U / I", "geteilt", "Quotient", "dividier"], ["Ohm", "Ω"], ["Länge", "länger", "langer", "lange"], ["dick", "dünn", "Querschnitt"]],
       muster: "Ich messe mit dem **Amperemeter** (in **Reihe**) die Stromstärke I und mit dem **Voltmeter** (**parallel** zum Draht) die Spannung U. Dann rechne ich **R = U : I** – das Ergebnis hat die Einheit **Ohm (Ω)**. Ein **längerer** oder **dünnerer** Draht hat einen größeren Widerstand, ein dickerer einen kleineren. Außerdem hängt der Widerstand vom **Material** ab und wird bei Metallen mit steigender **Temperatur** größer."}
    ]
  },
  zuordnung: {
    "Ein geschlossener Stromkreis": [0, 3, 4],
    "Amperemeter – misst die Stromstärke": [1, 2, 5, 6, 7, 8],
    "Voltmeter – misst die Spannung": [10, 17, 19],
    "Die Spannungsquelle": [9, 11, 18],
    "Das Wassermodell des Stromkreises": [12, 13],
    "Spannungen im Vergleich": [14, 15, 16],
    "Wovon der Widerstand abhängt": [21, 22, 23, 24, 25, 26],
    "Ein Gerät – drei Messgrößen": [20, 27, 28, 29]
  },
  hilfen: {
    7: ["Wie viele Milliampere sind 1 Ampere?", "1 A = 1000 mA – du multiplizierst also mit 1000.", "0,35 · 1000 mA = … mA"],
    14: ["Hintereinandergeschaltete Zellen: Ihre Spannungen werden addiert.", "U = 1,5 V + 1,5 V + 1,5 V", "U = 3 · 1,5 V = … V"],
    15: ["Hintereinander geschaltet addieren sich die Spannungen der Zellen.", "Gesucht ist die Anzahl n mit n · 1,5 V = 9 V.", "n = 9 V : 1,5 V = …"],
    27: ["Formel: R = U : I", "Einsetzen: R = 12 V : 0,40 A", "Rechentrick: 12 : 0,40 = 120 : 4 = … – die Einheit ist 1 V/A = 1 Ω."],
    28: ["Aus R = U : I folgt U = R · I.", "Einsetzen: U = 50 Ω · 0,20 A", "50 · 0,20 = 50 · 2 : 10 = … – die Einheit ist 1 Ω · 1 A = 1 V."],
    29: ["Rechne zuerst in Ohm um: 1,5 kΩ = 1500 Ω.", "Einsetzen: I = U : R = 6,0 V : 1500 Ω – das Ergebnis ist in A.", "Gefragt ist mA, also mal 1000: I = (6,0 : 1500) · 1000 mA = 6000 : 1500 mA = … mA"]
  },

  /* ---------- Rechenwerkstatt: Tafel vorne rechts (gegenüber der Suchbild-Staffelei) + Knopf an Station 3 ---------- */
  uebung: {ort: {x: 3.6, z: -9.5, ry: 0}, formel: "R = U : I"},
  rechenweg: [
    {titel: "Das Lämpchen auf dem Experimentiertisch", text: "Am Lämpchen auf dem Experimentiertisch zeigt das Voltmeter 4,5 V, das Amperemeter 0,25 A. Wie groß ist der Widerstand des leuchtenden Lämpchens?",
     gegeben: [{g: "U", wert: 4.5, einheit: "V", name: "Spannung"}, {g: "I", wert: 0.25, einheit: "A", name: "Stromstärke"}],
     gesucht: {g: "R", einheit: "Ω", name: "Widerstand"},
     formel: "R = U : I", formelAblenker: [{f: "R = U · I", warum: "Bei großem Widerstand fließt wenig Strom. Mit U · I würde R bei kleinem Strom aber klein – richtig ist Spannung **geteilt durch** Stromstärke."},
                                         {f: "R = I : U", warum: "Das ist der Kehrwert. Der Widerstand gibt an, wie viel Volt man **pro Ampere** braucht – also U geteilt durch I."}],
     umgestellt: "R = U : I", einsetzen: "R = 4,5 V : 0,25 A", ergebnis: {wert: 18, einheit: "Ω"},
     tipps: ["Der Widerstand ist Spannung geteilt durch Stromstärke: R = U : I.", "R = 4,5 V : 0,25 A", "4,5 : 0,25 = 450 : 25 = … – die Einheit ist 1 V/A = 1 Ω."], loesung: "R = U : I = 4,5 V : 0,25 A = 18 Ω",
     antwort: "Der Widerstand des leuchtenden Lämpchens beträgt 18 Ω.", antwortAnfang: "Der Widerstand des Lämpchens …", einheitAuch: ["kΩ"]},
    {titel: "Der Draht am Netzgerät", text: "Ein Draht hat den Widerstand 12 Ω. Du schließt ihn an ein Netzgerät an und stellst eine Spannung von 9 V ein. Welche Stromstärke zeigt das Amperemeter?",
     gegeben: [{g: "R", wert: 12, einheit: "Ω", name: "Widerstand"}, {g: "U", wert: 9, einheit: "V", name: "Spannung"}],
     gesucht: {g: "I", einheit: "A", name: "Stromstärke"},
     formel: "R = U : I", formelAblenker: [{f: "R = I : U", warum: "Kehrwert: Der Widerstand ist Spannung **pro** Stromstärke, also R = U : I."},
                                         {f: "U = R + I", warum: "Ohm und Ampere sind verschiedene Einheiten – solche Größen kann man nicht addieren."}],
     umgestellt: "I = U : R", umstellAblenker: [{f: "I = R : U", warum: "Du hast den **Kehrwert** gebildet. Aus R = U : I folgt R · I = U und nach dem Teilen durch R: I = U : R."},
                                               {f: "I = U · R", warum: "Dann würde ein größerer Widerstand mehr Strom bringen. Der Widerstand hemmt aber den Strom – also teilst du durch R."}],
     umstellWeg: "R = U : I  | · I  →  R · I = U  | : R  →  I = U : R",
     einsetzen: "I = 9 V : 12 Ω", ergebnis: {wert: 0.75, einheit: "A"},
     tipps: ["Stelle R = U : I nach I um: I = U : R.", "I = 9 V : 12 Ω", "9 : 12 = 3 : 4 = … – die Einheit ist 1 V/Ω = 1 A."], loesung: "I = U : R = 9 V : 12 Ω = 0,75 A",
     antwort: "Das Amperemeter zeigt eine Stromstärke von 0,75 A.", antwortAnfang: "Das Amperemeter zeigt …", einheitAuch: ["mA"]},
    {titel: "Die Taschenlampe", text: "Durch das Lämpchen einer Taschenlampe fließt ein Strom von 250 mA. Sein Glühdraht hat im Betrieb einen Widerstand von 12 Ω. Welche Spannung liegt am Lämpchen an?",
     gegeben: [{g: "I", wert: 250, einheit: "mA", name: "Stromstärke", si: {wert: 0.25, einheit: "A"}}, {g: "R", wert: 12, einheit: "Ω", name: "Widerstand"}],
     gesucht: {g: "U", einheit: "V", name: "Spannung"},
     formel: "R = U : I", formelAblenker: [{f: "R = U · I", warum: "R ist Spannung **pro** Stromstärke: U geteilt durch I, nicht mal I."},
                                         {f: "R = I : U", warum: "Kehrwert – der Widerstand ist Spannung geteilt durch Stromstärke: R = U : I."}],
     umgestellt: "U = R · I", umstellAblenker: [{f: "U = R : I", warum: "In R = U : I steht I im Nenner. Um es wegzubekommen, multiplizierst du beide Seiten mit I: R · I = U."},
                                               {f: "U = I : R", warum: "Dann würde die Spannung kleiner, wenn der Widerstand größer wird. Für denselben Strom braucht ein größerer Widerstand aber mehr Spannung."}],
     umstellWeg: "R = U : I  | · I  →  R · I = U",
     einsetzen: "U = 12 Ω · 0,25 A", ergebnis: {wert: 3, einheit: "V"},
     tipps: ["Rechne zuerst um: 250 mA = 0,25 A (durch 1000). Dann stelle R = U : I nach U um.", "U = R · I = 12 Ω · 0,25 A", "12 · 0,25 = 12 : 4 = … – die Einheit ist 1 Ω · 1 A = 1 V."], loesung: "I = 250 mA = 0,25 A; U = R · I = 12 Ω · 0,25 A = 3 V",
     antwort: "Am Lämpchen liegt eine Spannung von 3 V an.", antwortAnfang: "Am Lämpchen liegt …", einheitAuch: ["mV"],
     plausibel: {frage: "Passt dein Ergebnis zu einer Taschenlampe?", optionen: ["Nein – richtig wären 3000 V, denn 12 · 250 = 3000.", "Nein – jede Lampe braucht die 230 V aus der Steckdose.", "Ja – das sind zwei Monozellen mit je 1,5 V hintereinander.", "Ja – 3 V ist genau die Stromstärke, die durch das Lämpchen fließt."], richtig: 2,
       warum: ["So rechnet man, wenn man 250 mA nicht in 0,25 A umrechnet. 3000 V wären für eine Taschenlampe lebensgefährlich.", "230 V liefert nur die Steckdose. Taschenlampen arbeiten mit Batterien und brauchen nur wenige Volt.", null,
               "Volt ist die Einheit der Spannung, nicht der Stromstärke. Die Stromstärke war mit 250 mA gegeben."],
       erklaerung: "Zwei Monozellen hintereinander liefern 2 · 1,5 V = 3 V – eine typische Spannung für eine Taschenlampe."}},
    {titel: "Der Widerstand in der Versuchsschaltung", text: "Bei einem Versuch fließt durch einen Widerstand von 1,8 kΩ ein Strom von 5 mA. Welche Spannung liegt am Widerstand an?",
     gegeben: [{g: "R", wert: 1.8, einheit: "kΩ", name: "Widerstand", si: {wert: 1800, einheit: "Ω"}}, {g: "I", wert: 5, einheit: "mA", name: "Stromstärke", si: {wert: 0.005, einheit: "A"}}],
     gesucht: {g: "U", einheit: "V", name: "Spannung"},
     formel: "R = U : I", formelAblenker: [{f: "R = U · I", warum: "Je größer der Widerstand, desto weniger Strom fließt bei gleicher Spannung – darum steht I im Nenner: R = U : I."},
                                         {f: "U = R + I", warum: "Ohm und Ampere kann man nicht addieren. Spannung, Stromstärke und Widerstand hängen über R = U : I zusammen."}],
     umgestellt: "U = R · I", umstellAblenker: [{f: "U = R : I", warum: "In R = U : I wird U durch I geteilt. Um U allein zu bekommen, machst du das rückgängig: mal I."},
                                               {f: "U = I : R", warum: "Teste mit Zahlen: R = 2 Ω und I = 2,5 A brauchen U = 5 V – mit I : R kämen nur 1,25 V heraus."}],
     umstellWeg: "R = U : I  | · I  →  R · I = U",
     einsetzen: "U = 1800 Ω · 0,005 A", ergebnis: {wert: 9, einheit: "V"},
     tipps: ["Rechne beide Werte um: 1,8 kΩ = 1800 Ω (mal 1000) und 5 mA = 0,005 A (durch 1000).", "U = R · I = 1800 Ω · 0,005 A", "1800 · 0,005 = 18 · 0,5 = … – die Einheit ist 1 Ω · 1 A = 1 V."], loesung: "R = 1,8 kΩ = 1800 Ω; I = 5 mA = 0,005 A; U = R · I = 1800 Ω · 0,005 A = 9 V",
     antwort: "Am Widerstand liegt eine Spannung von 9 V an.", antwortAnfang: "Am Widerstand liegt …", einheitAuch: ["mV"],
     plausibel: {frage: "Welche Spannungsquelle passt zu deinem Ergebnis?", optionen: ["Eine Monozelle mit 1,5 V", "Eine Blockbatterie mit 9 V", "Eine Hochspannungsanlage mit 9000 V", "Die Steckdose mit 230 V"], richtig: 1,
       warum: ["Mit 1,5 V flösse durch 1,8 kΩ nicht einmal 1 mA – viel weniger als die gemessenen 5 mA.", null, "9000 V kommen heraus, wenn man nur die kΩ umrechnet und mit 5 statt 0,005 A rechnet. Für 5 mA reicht eine viel kleinere Spannung.",
               "An 230 V würden durch 1,8 kΩ etwa 128 mA fließen – viel mehr als 5 mA. Und mit der Steckdose experimentiert man nie."],
       erklaerung: "9 V hat die Blockbatterie. Probe: I = U : R = 9 V : 1800 Ω = 0,005 A = 5 mA – passt."}}
  ],
  umstellen: [
    {formel: "R = U : I", loesung: "I = U : R", typisch: [{f: "I = R : U", warum: "Das ist der Kehrwert. Aus R = U : I folgt erst R · I = U, dann I = U : R."},
                                                        {f: "I = U · R", warum: "Dann würde mehr Widerstand mehr Strom bringen – es ist umgekehrt: Der Widerstand hemmt den Strom."}],
     text: "Wie groß ist die Stromstärke, wenn du Spannung und Widerstand kennst?",
     weg: "R = U : I  | · I  →  R · I = U  | : R  →  I = U : R", tipps: ["Bringe I zuerst aus dem Nenner: Multipliziere beide Seiten mit I.", "Jetzt steht R · I = U da – teile noch durch R."]},
    {formel: "R = U : I", loesung: "U = R · I", typisch: [{f: "U = R : I", warum: "In R = U : I wird durch I geteilt. Um I wegzubekommen, multiplizierst du mit I, statt noch einmal zu teilen."},
                                                        {f: "U = I : R", warum: "Probe mit Zahlen: R = 5 Ω und I = 1,6 A ergeben U = 8 V – mit I : R kämen nur 0,32 V heraus."}],
     text: "Welche Spannung braucht man, damit durch einen bekannten Widerstand ein bestimmter Strom fließt?",
     weg: "R = U : I  | · I  →  R · I = U", tipps: ["In R = U : I wird U durch I geteilt. Was machst du, um I loszuwerden?", "Multipliziere beide Seiten mit I."]},
    {formel: "U_{ges} = n · U_{Zelle}", loesung: "n = U_{ges} : U_{Zelle}", typisch: [{f: "n = U_{Zelle} : U_{ges}", warum: "Das ist der Kehrwert. Probe: Für 12 V aus Zellen mit 1,5 V ergäbe 1,5 : 12 weniger als eine Zelle."},
                                                                               {f: "n = U_{ges} · U_{Zelle}", warum: "n wird mit U_{Zelle} malgenommen. Rückgängig machst du das durch **Teilen** – sonst kämen für 12 V aus Zellen mit 1,5 V ganze 18 Zellen heraus."}],
     text: "Schaltest du n gleiche Zellen hintereinander, addieren sich ihre Spannungen: Die Gesamtspannung ist n-mal die Spannung einer Zelle. Wie viele Zellen brauchst du für eine bestimmte Spannung?",
     weg: "U_{ges} = n · U_{Zelle}  | : U_{Zelle}  →  n = U_{ges} : U_{Zelle}", tipps: ["n wird mit U_{Zelle} malgenommen. Wie machst du ein Malnehmen rückgängig?", "Teile beide Seiten durch U_{Zelle}."]}
  ],
  fehlersuche: [
    {titel: "Das Bauteil im Versuch", aufgabe: "Bei einem Versuch liegt an einem Bauteil eine Spannung von 9 V, das Amperemeter zeigt 120 mA. Berechne den Widerstand des Bauteils.",
     zeilen: ["Gegeben: U = 9 V; I = 120 mA", "Gesucht: R", "Umrechnen: I = 120 mA = 1,2 A", "R = U : I", "R = 9 V : 1,2 A", "R = 7,5 Ω"], falsch: 2,
     zeilenOk: ["Die Werte sind richtig aus dem Text übernommen.", "Gesucht ist tatsächlich der Widerstand R."],
     optionen: ["Milliampere darf man nicht umrechnen – man rechnet direkt mit 120 weiter.", "Beim Umrechnen ist der Faktor falsch: 1 A = 1000 mA, also 120 mA = 0,12 A.", "Die Spannung hätte man auch in Millivolt umrechnen müssen.", "Die Formel muss R = I : U heißen."], richtig: 1,
     warum: ["Teilst du 9 V durch die Zahl 120, erhältst du keinen Widerstand in Ω. Für Ω brauchst du die Stromstärke in A.", null,
             "Die Spannung steht schon in Volt da – genau in der Einheit, die R = U : I braucht. Umrechnen musst du nur die Milliampere.",
             "Die Formel in Zeile 4 stimmt: Widerstand = Spannung geteilt durch Stromstärke. Der Fehler passiert schon beim Umrechnen."],
     korrektur: {frage: "Wie groß ist der Widerstand des Bauteils richtig?", wert: 75, einheit: "Ω", toleranz: .1, tipps: ["120 mA = 120 : 1000 A = 0,12 A", "R = 9 V : 0,12 A = 900 : 12 Ω = …"], loesung: "I = 120 mA = 0,12 A; R = U : I = 9 V : 0,12 A = 75 Ω"},
     erklaerung: "Zwischen mA und A liegt der Faktor **1000**, nicht 100: 120 mA = 0,12 A. Erst in A umrechnen – dann erhältst du R direkt in Ω."},
    {titel: "Die Autolampe", aufgabe: "Eine Autolampe hat im Betrieb einen Widerstand von 3 Ω. Sie ist an die Autobatterie mit 12 V angeschlossen. Berechne die Stromstärke.",
     zeilen: ["Gegeben: R = 3 Ω; U = 12 V", "Gesucht: I", "R = U : I", "I = R : U", "I = 3 Ω : 12 V", "I = 0,25 A"], falsch: 3,
     zeilenOk: ["Die Werte stimmen mit dem Aufgabentext überein.", "Gesucht ist die Stromstärke I.", "Die Grundformel R = U : I ist richtig."],
     optionen: ["Der Widerstand muss zuerst in kΩ umgerechnet werden.", "Die Stromstärke lässt sich aus R und U gar nicht berechnen.", "Beim Umstellen ist der Kehrwert entstanden: Aus R = U : I folgt I = U : R.", "Richtig wäre I = U · R."], richtig: 2,
     warum: ["Mit V und Ω erhältst du die Stromstärke direkt in A – in kΩ umzurechnen ist hier überflüssig. Der Fehler hat mit den Einheiten nichts zu tun.",
             "Doch: Kennst du zwei der drei Größen U, I und R, kannst du die dritte mit R = U : I berechnen.", null,
             "Mit I = U · R würde mehr Widerstand mehr Strom bedeuten. Der Widerstand hemmt aber den Strom – also musst du durch R teilen."],
     korrektur: {frage: "Wie groß ist die Stromstärke richtig?", wert: 4, einheit: "A", toleranz: .05, tipps: ["I = U : R", "I = 12 V : 3 Ω = …"], loesung: "I = U : R = 12 V : 3 Ω = 4 A"},
     erklaerung: "Beim Umstellen hilft eine Probe mit dem Verstand: Mehr Spannung bringt mehr Strom, mehr Widerstand weniger Strom. Also steht U oben und R unten: I = U : R = 4 A."},
    {titel: "Das Lämpchen am Akku", aufgabe: "Ein Lämpchen ist an einen Akku mit 3,6 V angeschlossen. Das Amperemeter zeigt 0,24 A. Berechne den Widerstand des Lämpchens.",
     zeilen: ["Gegeben: U = 3,6 V; I = 0,24 A", "Gesucht: R", "R = U : I", "R = 3,6 V : 0,24 A", "R = 1,5 Ω"], falsch: 4,
     zeilenOk: ["Die Werte sind richtig übernommen – beide schon in V und A.", "Gesucht ist der Widerstand R.", "Die Formel stimmt: Spannung geteilt durch Stromstärke.", "Richtig eingesetzt: die Spannung geteilt durch die Stromstärke."],
     optionen: ["Die Einheit des Ergebnisses muss A heißen, nicht Ω.", "Verrechnet: Beim Teilen durch die Kommazahl 0,24 ist eine Zehnerstelle verloren gegangen.", "0,24 A hätte man zuerst in 240 mA umrechnen müssen.", "Nichts – ein Lämpchen hat immer etwa 1,5 Ω."], richtig: 1,
     warum: ["Ω ist richtig: Spannung geteilt durch Stromstärke ergibt die Einheit 1 V/A = 1 Ω. Die Einheit stimmt, die Zahl nicht.", null,
             "Mit 240 mA bekämst du keinen Widerstand in Ω. In R = U : I gehört die Stromstärke in A – so, wie sie hier schon dasteht.",
             "Lämpchen haben ganz verschiedene Widerstände. Probe: 1,5 Ω · 0,24 A = 0,36 V – das sind nicht die 3,6 V des Akkus."],
     korrektur: {frage: "Wie groß ist der Widerstand des Lämpchens richtig?", wert: 15, einheit: "Ω", toleranz: .1, tipps: ["Mach den Teiler zu einer ganzen Zahl: Verschiebe bei beiden Zahlen das Komma um zwei Stellen nach rechts.", "3,6 : 0,24 = 360 : 24 = …"], loesung: "R = U : I = 3,6 V : 0,24 A = 360 : 24 Ω = 15 Ω"},
     erklaerung: "Teilst du durch eine Zahl kleiner als 1, wird das Ergebnis **größer** als die Zahl, die du teilst. Eine Probe deckt den Fehler auf: 15 Ω · 0,24 A = 3,6 V – passt."}
  ],

  /* ---------- Rückmeldung je falscher Antwort im Quiz (Reihenfolge wie options in inhalt/strom1.json, null = richtige Antwort) ---------- */
  warum: {
    0: [null, "Die Atomrümpfe sind im Metall fest an ihre Plätze gebunden und schwingen nur hin und her. Bewegen können sich nur die freien Elektronen.",
        "Ungeordnet bewegen sich die Elektronen immer, auch ganz ohne Strom. Strom fließt erst, wenn sie sich zusätzlich gemeinsam in eine Richtung bewegen.",
        "Von Plus nach Minus zeigt nur die vereinbarte technische Stromrichtung. Im Metall bewegen sich negativ geladene Elektronen – und zwar von Minus nach Plus."],
    1: [null, "Das beschreibt die Spannung U, also den Antrieb. Die Stromstärke sagt, wie viele Elektronen dann tatsächlich pro Sekunde fließen.",
        "Die Hemmung beschreibt der Widerstand R. Die Stromstärke zählt dagegen die Elektronen, die pro Sekunde durch den Leiter kommen.",
        "In jedem Draht sind riesig viele freie Elektronen, auch ohne Strom. Entscheidend ist, wie viele **pro Sekunde** durch einen Querschnitt fließen."],
    2: [null, "Parallel schaltet man das Voltmeter. Ein Amperemeter parallel zum Bauteil hat fast keinen Widerstand – der Strom fließt dann am Bauteil vorbei durchs Messgerät.",
        "Das wäre ein Kurzschluss: Das Amperemeter hat einen sehr kleinen Widerstand, direkt an den Polen der Quelle fließt ein riesiger Strom.",
        "Die Schaltung ist nicht beliebig: Nur in Reihe fließt durch das Messgerät derselbe Strom wie durch das Bauteil."],
    3: [null, "Das ist die technische Stromrichtung, die man früher festgelegt hat. Die negativ geladenen Elektronen fließen andersherum – vom Überschuss am Minuspol zum Mangel am Pluspol.",
        "Die Elektronen sammeln sich nicht im Gerät, sie fließen im Kreis: aus dem Minuspol hinaus, durch das Gerät hindurch und in den Pluspol hinein.",
        "Eine Batterie hat einen festen Minuspol und einen festen Pluspol. Deshalb treibt sie die Elektronen immer in dieselbe Richtung."],
    4: [null, "Elektronen sind negativ geladen – gerade deshalb fließen sie vom Minuspol zum Pluspol. Die Richtung von Plus nach Minus ist nur eine alte Vereinbarung.",
        "Im ganzen Draht fließen die Elektronen in dieselbe Richtung, innen wie außen: vom Minuspol zum Pluspol.",
        "Die Atomrümpfe bleiben an ihren Plätzen im Metall. Im Draht bewegen sich nur die freien, negativ geladenen Elektronen."],
    5: [null, "Strom wird in der Lampe nicht verbraucht: Alle Elektronen, die hineinfließen, kommen auch wieder heraus. In der Lampe wird Energie umgewandelt, die Elektronen bleiben im Kreis.",
        "Die Lampe ist keine Quelle und kann keine Elektronen dazuliefern. Im unverzweigten Kreis fließen überall gleich viele Elektronen pro Sekunde.",
        "Die Lampe unterbricht den Kreis nicht – der Strom fließt durch ihren Glühdraht hindurch. Sonst würde sie gar nicht leuchten."],
    6: [null, "Durch das Amperemeter soll genau der Strom fließen, der auch ohne Messgerät fließen würde – nicht weniger. Ein großer Widerstand würde den Strom verkleinern.",
        "Gerade wegen des kleinen Widerstands darf man es nie parallel schalten: Dann flösse fast der ganze Strom durchs Gerät.",
        "Ein Messgerät erhöht keine Spannung – die liefert allein die Quelle. Das Amperemeter soll den Stromkreis möglichst gar nicht verändern."],
    8: [null, "Auch ohne Lampe ist der Kreis über das Messgerät geschlossen. Weil es fast keinen Widerstand hat, fließt sogar ein besonders großer Strom.",
        "Ein Amperemeter misst immer die Stromstärke, auch an den Polen einer Batterie. Die Spannung zeigt nur ein Voltmeter an.",
        "Ein Messgerät liefert keine Energie und lädt nichts auf. Im Gegenteil: Der große Strom entlädt die Batterie schnell."],
    9: [null, "Die Stromstärke ist die Folge des Antriebs: Sie sagt, wie viele Elektronen pro Sekunde fließen. Was sie antreibt, ist die Spannung.",
        "Der Widerstand wirkt genau entgegengesetzt: Er hemmt den Strom, statt ihn anzutreiben.",
        "Die Länge einer Leitung ändert ihren Widerstand, aber sie treibt nichts an. Ohne Spannungsquelle fließt in keiner Leitung Strom."],
    10: [null, "In Reihe gehört das Amperemeter. Ein Voltmeter hat einen sehr großen Widerstand – in Reihe würde es den Strom fast ganz unterbrechen.",
         "Vor oder hinter der Lampe macht keinen Unterschied: In Reihe stoppt der große Widerstand des Voltmeters den Strom fast ganz, die Lampe bliebe dunkel.",
         "Ohne Lampe gibt es keine Lampenspannung zu messen. Das Voltmeter misst die Spannung zwischen den beiden Anschlüssen eines Bauteils, das im Kreis bleibt."],
    11: [null, "Elektronenmangel herrscht am Pluspol. Am Minuspol sammeln sich die negativ geladenen Elektronen – darum heißt er „minus“.",
         "Ein Ladungsausgleich würde die Spannung verschwinden lassen. Die Quelle sorgt gerade für einen Unterschied: Überschuss am einen, Mangel am anderen Pol.",
         "Positiv ist der Pluspol, an dem Elektronen fehlen. Am Minuspol gibt es zu viele Elektronen, also negative Ladung."],
    12: [null, "Der Spannung entspricht der Druckunterschied, den die Pumpe erzeugt – also der Antrieb, nicht die Menge, die fließt.",
         "Dem Widerstand entspricht die Engstelle, die den Fluss bremst. Die Menge pro Sekunde ist das, was trotz der Bremse durchkommt.",
         "Die Leitungslänge entspricht der Rohrlänge, nicht dem Wasserfluss. „Menge pro Sekunde“ ist im Stromkreis die Zahl der Elektronen pro Sekunde."],
    13: [null, "Eine engere Stelle lässt weniger Wasser durch, nicht mehr. Bei gleichem Antrieb bedeutet ein größerer Widerstand immer eine kleinere Stromstärke.",
         "Enger heißt: Das Rohr bremst stärker. Der Widerstand wird also größer, nicht kleiner.",
         "Die Pumpe bleibt gleich, also bleibt auch die Spannung gleich. Verändert hat sich die Engstelle – und die steht für den Widerstand."],
    16: [null, "Weniger Spannung heißt weniger Antrieb. Heller würde die Lampe nur bei mehr als 3,5 V leuchten – dann aber droht sie durchzubrennen.",
         "Durchbrennen droht bei zu großer Spannung. 2 V sind weniger, als die Lampe verträgt – der Strom wird kleiner, nicht größer.",
         "Wie hell die Lampe leuchtet, hängt vom Strom ab, und der hängt von der Spannung ab. Bei kleinerer Spannung fließt weniger Strom."],
    17: [null, "Ein zusätzliches Bauteil in Reihe kann den Strom nur hemmen, nie verstärken – und das Voltmeter hemmt mit seinem großen Widerstand sehr stark.",
         "Das passiert einem Amperemeter, das man parallel schaltet. Das Voltmeter hat einen sehr großen Widerstand, darum fließt durch das Gerät nur ein winziger Strom.",
         "Weil das Voltmeter den Kreis so stark hemmt, liegt fast die ganze Spannung der Quelle an ihm selbst. Es zeigt deshalb ungefähr die Quellenspannung an, nicht 0 V."],
    18: [null, "Außen ist zwischen den Polen keine leitende Verbindung – ohne geschlossenen Stromkreis fließt kein Strom.",
         "Spannung braucht keinen Strom: Sie ist der Antrieb, der schon bereitsteht. Erst wenn der Kreis geschlossen wird, setzt sie die Elektronen in Bewegung.",
         "Die Batterie hat ihre Spannung schon in der Schublade – ein Voltmeter an den Polen würde sie auch ohne Gerät anzeigen. Beim Einschalten beginnt nur der Strom zu fließen."],
    20: [null, "Prüfe mit der Bedeutung: Bei großem Widerstand fließt bei gleicher Spannung wenig Strom. Mit R = U · I wäre der Widerstand bei wenig Strom aber klein – das passt nicht.",
         "Das ist der Kehrwert. Der Widerstand sagt, wie viel Volt man **pro Ampere** braucht – also Spannung durch Stromstärke.",
         "Volt und Ampere sind verschiedene Einheiten. Zwei so verschiedene Größen kann man nicht addieren."],
    21: [null, "Antreiben ist die Aufgabe der Spannungsquelle. Ein Widerstand bremst den Strom – je größer er ist, desto stärker.",
         "Genau umgekehrt: Bei gleicher Spannung fließt durch einen großen Widerstand nur wenig Strom. Viel Strom lässt ein kleiner Widerstand durch.",
         "Ein Widerstand ist keine Spannungsquelle und erzeugt selbst keine Spannung. Die Spannung liefert die Batterie oder das Netzgerät."],
    22: [null, "Das ist der Kehrwert. Aus R = U : I folgt: Volt im Zähler, Ampere im Nenner – also 1 Ω = 1 V/A.",
         "In R = U : I wird geteilt, nicht malgenommen. Darum werden auch die Einheiten geteilt: Volt durch Ampere.",
         "In R = U : I kommt keine Zeit vor. Die Einheit des Widerstands setzt sich nur aus Volt und Ampere zusammen."],
    24: [null, "Die Atomrümpfe bleiben an ihren festen Plätzen im Metall und schwingen nur. Die Elektronen stoßen mit ihnen zusammen – das bremst sie.",
         "Elektronen gehen nicht verloren: Im unverzweigten Kreis fließen überall gleich viele pro Sekunde. Gebremst werden sie durch Stöße mit den Atomrümpfen.",
         "Elektronen sind und bleiben negativ geladen. Der Widerstand entsteht, weil sie auf ihrem Weg immer wieder an Atomrümpfe stoßen."],
    25: [null, "Bei Metallen ist es umgekehrt: Je heißer der Draht, desto stärker schwingen die Atomrümpfe und desto öfter stoßen Elektronen an – der Widerstand steigt.",
         "Gleich bleibt der Widerstand eines Metalldrahts nur bei gleichbleibender Temperatur. Erhitzt man ihn, ändert er sich.",
         "Ein Metalldraht verliert beim Erhitzen seinen Widerstand nicht. Im Gegenteil: Die stärker schwingenden Atomrümpfe bremsen die Elektronen noch mehr."],
    26: [null, "Mehr Strom bei gleicher Spannung heißt: A hemmt weniger. Der doppelte Widerstand würde nur den halben Strom durchlassen.",
         "Bei gleichem Widerstand und gleicher Spannung wäre auch die Stromstärke gleich. Der Unterschied im Strom verrät einen Unterschied im Widerstand.",
         "Ein größerer Widerstand würde den Strom verkleinern, nicht verdoppeln. Bei gleicher Spannung gilt: doppelte Stromstärke – halber Widerstand."]
  }
});
})();
