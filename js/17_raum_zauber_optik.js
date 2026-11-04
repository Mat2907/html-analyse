/* ---------- 17_raum_zauber_optik.js ---------- */
/* =====================================================================
   Raumthemen der Zauberschule · Optik (Werkzeug und Felder: 17_raum_zauber.js)
   optik1 „Spiegelsaal“: barocker Saal mit cremeweißem Stuck, Marmorpilastern mit Goldkapitellen, Hohlkehle und Deckenfresko (Himmel),
     polierter Schachbrett-Marmorboden, hohe Bogenspiegel aus vielen Scheiben im Prunkrahmen an der Stirnwand (gemaltes, silbrig getöntes Spiegelbild
     des Saals ohne Himmel, damit sie nicht wie Fenster wirken), Spiegelstreifen auf allen Pilastern, ovale Spiegel über den Tafelfeldern, Spiegel in
     den Goldrahmen der Tafelfelder ohne Tafel (gegenüberliegende Wand mit Tafeln in Spiegelschrift; Ausstattungsschritt „Spiegelfelder“),
     Goldrahmen um die Tafelfelder, vier Kristallleuchter über den Seitenbereichen, Wandleuchter mit Kerzen, Fenster zum Abendgarten; warmes, helles Licht
   optik2 „Sternwarte der Linsen“: Kuppel über dem vorderen Raum, innen tiefblau mit goldenen Sternbildern, offener Dachspalt mit Sternen und Mond,
     großes Messingfernrohr auf Steinpfeiler (vorne rechts) zum Spalt gerichtet, Sternkarte (Planisphäre) an der Stirnwand, Meridianlinie aus Messing
     im Boden, Öllampen; nächtlich-kühles Licht
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.kits || !R3D.kits.zauber || !R3D.kits.zauber.raumHilfe) return;
const KIT = R3D.kits.zauber, RH = KIT.raumHilfe, PI = Math.PI, M = RH.M, H = RH.H, V = (x, y, z) => new T3.Vector3(x, y, z);
const uvMal = (g, sx, sy) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return g; };
const equi = t => { t.mapping = T3.EquirectangularReflectionMapping; return t; };

/* =====================================================================
   optik1 · Spiegelsaal
   ===================================================================== */
const saalTex = {
  marmor: () => RH.tex("saal-marmor", 1024, 1024, (g, w, h) => { const r = RH.seeded(331), n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const hell = (i + j) % 2 === 0, x = i * s, y = j * s;
      g.fillStyle = hell ? "#efe7d8" : "#33403c"; g.fillRect(x, y, s, s);
      g.save(); g.beginPath(); g.rect(x, y, s, s); g.clip();
      for (let k = 0; k < 7; k++) { g.strokeStyle = hell ? `rgba(120,110,100,${.06 + r() * .1})` : `rgba(200,215,205,${.05 + r() * .08})`; g.lineWidth = .6 + r() * 1.4; g.beginPath();
        let px = x + r() * s, py = y; g.moveTo(px, py); for (let q = 0; q < 14; q++) { const nx = px + (r() - .5) * 40, ny = py + s / 13; g.quadraticCurveTo(px + (r() - .5) * 20, py + s / 26, nx, ny); px = nx; py = ny; } g.stroke(); }
      g.fillStyle = RH.rad(g, x + s / 2, y + s / 2, 0, s * .8, [[0, "rgba(255,255,255,.06)"], [1, "rgba(0,0,0,.08)"]]); g.fillRect(x, y, s, s); g.restore(); }
    g.strokeStyle = "rgba(150,120,70,.8)"; g.lineWidth = 3; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); } }),
  stuck: () => RH.tex("saal-stuck", 512, 512, (g, w, h) => { const r = RH.seeded(332); g.fillStyle = "#efe3cc"; g.fillRect(0, 0, w, h); RH.flecken(g, w, h, 9000, .12, ["#ffffff", "#c9b89a", "#e0d0b0"], r); }),
  fresko: () => RH.tex("saal-fresko", 1024, 1024, (g, w, h) => { const r = RH.seeded(333);
    g.fillStyle = "#efe2c8"; g.fillRect(0, 0, w, h); RH.flecken(g, w, h, 6000, .12, ["#fff", "#c9b28a"], r);
    const ox = 90, oy = 90, iw = w - 2 * ox, ih = h - 2 * oy;
    g.save(); g.beginPath(); g.ellipse(w / 2, h / 2, iw / 2, ih / 2, 0, 0, 7); g.clip();
    g.fillStyle = RH.rad(g, w / 2, h / 2, 20, iw * .62, [[0, "#fff4d8"], [.3, "#bfdcf2"], [.75, "#86b2e0"], [1, "#e9c79a"]]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { const a = r() * PI * 2, d = .35 + r() * .55, x = w / 2 + Math.cos(a) * iw / 2 * d, y = h / 2 + Math.sin(a) * ih / 2 * d, q = 40 + r() * 90;
      g.fillStyle = RH.rad(g, x, y, 0, q, [[0, "rgba(255,255,255,.75)"], [.6, "rgba(255,246,236,.35)"], [1, "rgba(255,255,255,0)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q); }
    g.globalAlpha = .25; for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; g.strokeStyle = "#fff2c0"; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * iw * .3, h / 2 + Math.sin(a) * ih * .3); g.stroke(); } g.globalAlpha = 1;
    g.restore();
    for (const [lw, col, d] of [[18, "#c9a245", 0], [6, "#8a6a2a", 14], [4, "#e8cf7a", -10]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.ellipse(w / 2, h / 2, iw / 2 + d, ih / 2 + d, 0, 0, 7); g.stroke(); }
    g.strokeStyle = "#c9a245"; g.lineWidth = 10; g.strokeRect(24, 24, w - 48, h - 48); g.lineWidth = 3; g.strokeRect(44, 44, w - 88, h - 88);
    for (const [x, y] of [[60, 60], [w - 60, 60], [60, h - 60], [w - 60, h - 60]]) { g.fillStyle = "#c9a245"; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill(); g.fillStyle = "#efe2c8"; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); } }),
  env: () => equi(RH.tex("saal-env", 512, 256, (g, w, h) => { const r = RH.seeded(334);
    g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#f6e8cc"], [.4, "#e8d2a8"], [.52, "#b88a48"], [.6, "#d8c8a8"], [1, "#4a4038"]]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { const x = (i + .5) * w / 8; g.fillStyle = "rgba(255,252,240,.9)"; g.fillRect(x - 14, h * .2, 28, h * .26); g.fillStyle = "#c9a245"; g.fillRect(x - 30, h * .18, 4, h * .32); }
    for (let i = 0; i < 12; i++) { const x = r() * w, y = h * (.08 + r() * .12); g.fillStyle = RH.rad(g, x, y, 0, 18, [[0, "rgba(255,240,200,1)"], [1, "rgba(255,200,120,0)"]]); g.fillRect(x - 18, y - 18, 36, 36); }
    // untere Hälfte: der Schachbrettboden (Spiegel zeigen beim Blick nach unten den Boden des Saals)
    for (let j = 0; j < 14; j++) { const y0 = h * .56 + j * j * .9, y1 = h * .56 + (j + 1) * (j + 1) * .9; if (y0 > h) break; const n = 16 + j * 4;
      for (let i = 0; i < n; i++) { g.fillStyle = (i + j) % 2 ? "#eee6d6" : "#3a4642"; g.fillRect(i * w / n, y0, w / n + 1, y1 - y0 + 1); } } }, false)),
  // Spiegelbild statt weißer Scheiben: gemalter Blick zurück in den Saal (Zentralperspektive). Oben die Stuckdecke mit Goldleisten, Rosetten und
  // Kronleuchtern – kein Himmel und keine Lichtstrahlen, sonst liest man Bogenspiegel und Spiegelpilaster als Fenster –, Seitenwände mit Pilastern,
  // Goldrahmen und Wandleuchtern, ferne Rückwand mit Tür und Fenstern hinter Vorhängen, Schachbrettboden; silbrig-kühl getönt, Rand dunkler,
  // jede der 3 × 7 Scheiben etwas anders hell (alte Spiegelscheiben sitzen nie ganz gleich), goldene Sprossen mit Rosetten
  scheiben: () => RH.tex("saal-spiegelbild", 512, 1024, (g, w, h) => { const r = RH.seeded(336), cx = w / 2, hz = h * .74, f = 400, ey = 1.62;
    const px = (X, d) => cx + X * f / d, py = (Y, d) => hz - (Y - ey) * f / d, D1 = 30, D0 = 8 * f / cx;   // D0: Tiefe, in der die Seitenwand den Bildrand trifft
    const vier = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
    const linie = (pts, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    const schein = (x, y, q, a = 1) => { g.fillStyle = RH.rad(g, x, y, 0, q, [[0, `rgba(255,246,214,${a})`], [.35, `rgba(255,214,140,${a * .5})`], [1, "rgba(255,200,120,0)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q); };
    // Stuckdecke: cremefarben, nach hinten wärmer; Goldleisten längs (Hohlkehle, Kronleuchterachsen) und quer im Pilastertakt, Rosetten in den Feldern
    g.fillStyle = RH.lin(g, 0, 0, 0, hz, [[0, "#dccaa0"], [.55, "#cbb486"], [1, "#b89c6c"]]); g.fillRect(0, 0, w, hz);
    for (const X of [-7.1, -4.4, 4.4, 7.1]) linie([[px(X, 1.2), py(7.5, 1.2)], [px(X, D1), py(7.5, D1)]], "#bf9a44", Math.abs(X) > 5 ? 7 : 4);
    for (let d = 4.5; d < D1; d += 4.5) linie([[px(-7.1, d), py(7.5, d)], [px(7.1, d), py(7.5, d)]], "#bf9a44", Math.max(1.5, 36 / d));
    for (let d = 6.75; d < D1; d += 4.5) for (const X of [-5.75, 0, 5.75]) { const rx = (X ? .45 : .8) * f / d, ry = rx * (7.5 - ey) / d;
      g.strokeStyle = "#c9a245"; g.lineWidth = Math.max(1, 24 / d); g.beginPath(); g.ellipse(px(X, d), py(7.5, d), rx, ry, 0, 0, 7); g.stroke(); }
    for (const s of [-1, 1]) { const W = s * 8;
      vier([[cx + s * cx, py(7.5, D0)], [px(W, D1), py(7.5, D1)], [px(W, D1), py(0, D1)], [cx + s * cx, py(0, D0)]], "#dcc8a2");   // Seitenwand
      vier([[cx + s * cx, py(.34, D0)], [px(W, D1), py(.34, D1)], [px(W, D1), py(0, D1)], [cx + s * cx, py(0, D0)]], "#3c4a44");   // grüner Sockel
      linie([[cx + s * cx, py(6.55, D0)], [px(W, D1), py(6.55, D1)]], "#c9a245", 9); linie([[cx + s * cx, py(.96, D0)], [px(W, D1), py(.96, D1)]], "#c9a245", 4);
      for (let d = D0 + 1; d < D1; d += 4.5) { const x0 = px(W, d), x1 = px(W, d + .62);
        vier([[x0, py(6.3, d)], [x1, py(6.3, d + .62)], [x1, py(.36, d + .62)], [x0, py(.36, d)]], "#f8f4ec");   // Pilaster mit Goldkapitell
        vier([[x0, py(6.48, d)], [x1, py(6.48, d + .62)], [x1, py(6.18, d + .62)], [x0, py(6.18, d)]], "#c9a245");
        const a = d + 1.2, b = d + 3.6;   // Goldrahmen um das Tafelfeld, ovaler Spiegel darüber
        linie([[px(W, a), py(5.6, a)], [px(W, b), py(5.6, b)], [px(W, b), py(2.55, b)], [px(W, a), py(2.55, a)], [px(W, a), py(5.6, a)]], "#c9a245", Math.max(2, 70 / d));
        const om = (a + b) / 2; g.strokeStyle = "#c9a245"; g.lineWidth = Math.max(1, 40 / om); g.beginPath(); g.ellipse(px(W, om), py(6.02, om), Math.max(1.5, .44 * 8 * f / (om * om)), Math.max(1.5, .26 * f / om), 0, 0, 7); g.stroke();
        schein(px(W, d + .31), py(2.55, d + .31), Math.max(6, 130 / d), .9); } }   // Wandleuchter
    vier([[px(-8, D1), py(7.5, D1)], [px(8, D1), py(7.5, D1)], [px(8, D1), py(0, D1)], [px(-8, D1), py(0, D1)]], "#dccaa4");   // ferne Rückwand
    vier([[px(-1.45, D1), py(5.0, D1)], [px(1.45, D1), py(5.0, D1)], [px(1.45, D1), py(0, D1)], [px(-1.45, D1), py(0, D1)]], "#5a3a22");   // Tür
    for (const s of [-1, 1]) { vier([[px(s * 4.1, D1), py(6, D1)], [px(s * 6.0, D1), py(6, D1)], [px(s * 6.0, D1), py(1, D1)], [px(s * 4.1, D1), py(1, D1)]], "#56608a");   // Abendfenster
      for (const e of [3.75, 6.35]) vier([[px(s * (e - .35), D1), py(6.6, D1)], [px(s * (e + .35), D1), py(6.6, D1)], [px(s * (e + .35), D1), py(0, D1)], [px(s * (e - .35), D1), py(0, D1)]], "#5a2a62"); }   // Vorhänge
    for (let j = 0; ; j++) { const da = 1.62 * f / (h - hz) + j, db = da + 1; if (da >= D1) break;   // Schachbrettboden, Fliesen 1 m
      for (let k = -8; k < 8; k++) vier([[px(k, da), py(0, da)], [px(k + 1, da), py(0, da)], [px(k + 1, Math.min(db, D1)), py(0, Math.min(db, D1))], [px(k, Math.min(db, D1)), py(0, Math.min(db, D1))]], (j + k + 16) % 2 ? "#ece4d4" : "#34403c"); }
    // Kronleuchter (Kette, Goldring, Kristallbehang, Kerzen): die zwei vor dem Spiegel groß in der Mitte, die übrigen in den Seitenachsen
    for (const [X, d] of [[-4.4, 20.5], [4.4, 20.5], [-4.4, 15.5], [4.4, 15.5], [0, 11], [-4.4, 6.5], [4.4, 6.5], [0, 5.5]]) { const x = px(X, d), y = py(6.0, d), q = .95 * f / d;
      g.strokeStyle = "#b8903a"; g.lineWidth = Math.max(1, 22 / d); g.beginPath(); g.moveTo(x, py(7.5, d)); g.lineTo(x, y + q * .5); g.stroke();
      g.lineWidth = Math.max(1.5, 34 / d); g.beginPath(); g.ellipse(x, y, q, q * .22, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(x, y - q * .55, q * .55, q * .12, 0, 0, 7); g.stroke();
      g.fillStyle = "rgba(236,246,255,.85)"; for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; g.fillRect(x + Math.cos(a) * q * .9 - .8, y + Math.sin(a) * q * .2, 1.6, q * .22); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; schein(x + Math.cos(a) * q, y + Math.sin(a) * q * .22 - q * .2, Math.max(4, q * .32)); }
      schein(x, y - q * .1, q * 1.4, .35); }
    // Silberbelag: kühl-graue Tönung, Rand dunkler, Altersflecken; jede Scheibe etwas anders hell, ein flacher Glanz von links oben (keine Streifen)
    g.globalCompositeOperation = "multiply"; g.fillStyle = "#a2b0c0"; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over";
    g.fillStyle = RH.rad(g, cx, h / 2, w * .3, h * .62, [[0, "rgba(0,0,0,0)"], [1, "rgba(34,38,46,.55)"]]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { const rand = r() < .5, x = rand ? (r() < .5 ? r() * 36 : w - r() * 36) : r() * w, y = rand ? r() * h : (r() < .5 ? r() * 36 : h - r() * 36), q = 4 + r() * 12;
      g.fillStyle = RH.rad(g, x, y, 0, q, [[0, "rgba(46,48,40,.3)"], [1, "rgba(46,48,40,0)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q); }
    const nx = 3, ny = 7; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const a = (r() - .5) * .14; g.fillStyle = a > 0 ? `rgba(255,255,255,${a})` : `rgba(18,22,30,${-a})`; g.fillRect(i * w / nx, j * h / ny, w / nx, h / ny); }
    g.fillStyle = RH.lin(g, 0, 0, w, h * .55, [[0, "rgba(255,255,255,.12)"], [1, "rgba(255,255,255,0)"]]); g.fillRect(0, 0, w, h);
    // Scheiben: goldene Sprossen mit Rosetten, helle Fasen
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2;
    for (let i = 1; i < nx; i++) for (const d of [-6, 6]) { g.beginPath(); g.moveTo(i * w / nx + d, 0); g.lineTo(i * w / nx + d, h); g.stroke(); }
    for (let j = 1; j < ny; j++) for (const d of [-6, 6]) { g.beginPath(); g.moveTo(0, j * h / ny + d); g.lineTo(w, j * h / ny + d); g.stroke(); }
    g.strokeStyle = "#b8963e"; g.lineWidth = 8; for (let i = 1; i < nx; i++) { g.beginPath(); g.moveTo(i * w / nx, 0); g.lineTo(i * w / nx, h); g.stroke(); }
    for (let j = 1; j < ny; j++) { g.beginPath(); g.moveTo(0, j * h / ny); g.lineTo(w, j * h / ny); g.stroke(); }
    g.fillStyle = "#d8b45a"; for (let i = 1; i < nx; i++) for (let j = 1; j < ny; j++) { g.beginPath(); g.arc(i * w / nx, j * h / ny, 12, 0, 7); g.fill(); } }, false),
  // Spiegelfelder der Seitenwände: die gegenüberliegende Wand von vorn, wie ein hoch hängender Spiegel sie zeigt (ab Brusthöhe, darüber Gesims und
  // Kassettendecke): Goldrahmen mit Tafel in Spiegelschrift (für Kinder das deutlichste Zeichen „Spiegel“), daneben ein Spiegel im Spiegel,
  // Wandleuchter, davor ein Kronleuchter; silbrig getönt, 3 × 3 Scheiben mit Goldsprossen
  feld: () => RH.tex("saal-spiegelfeld", 512, 440, (g, w, h) => { const r = RH.seeded(337), k = 40, cx = w / 2, Y = y => h - (y - 1.6) * k, X = x => cx + x * k;
    const schein = (x, y, q, a = 1) => { g.fillStyle = RH.rad(g, x, y, 0, q, [[0, `rgba(255,246,214,${a})`], [.35, `rgba(255,214,140,${a * .5})`], [1, "rgba(255,200,120,0)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q); };
    g.fillStyle = RH.lin(g, 0, 0, 0, Y(7.5), [[0, "#b89a64"], [1, "#d8c49c"]]); g.fillRect(0, 0, w, Y(7.5));   // Kassettendecke, nach hinten enger
    for (let i = 0, y = Y(7.5); y > 0; i++) { g.fillStyle = "#c9a245"; g.fillRect(0, y - 4, w, 4); y -= 22 + i * 14; }
    for (const x of [-4.5, 0, 4.5]) { g.strokeStyle = "#c9a245"; g.lineWidth = 3; g.beginPath(); g.ellipse(X(x), Y(7.5) - 70, 36, 14, 0, 0, 7); g.stroke(); }
    g.fillStyle = RH.lin(g, 0, Y(7.5), 0, Y(6.66), [[0, "#f0e4c8"], [1, "#d4c09a"]]); g.fillRect(0, Y(7.5), w, Y(6.66) - Y(7.5));   // Hohlkehle
    g.fillStyle = "#e2d2ae"; g.fillRect(0, Y(6.66), w, h - Y(6.66));   // Wand, Gesims
    g.fillStyle = "#c9a245"; g.fillRect(0, Y(6.66), w, Y(6.46) - Y(6.66));
    const tafel = (x0, x1, y0, y1, titel) => { g.fillStyle = RH.rad(g, (x0 + x1) / 2, (y0 + y1) / 2, 4, (x1 - x0) * .7, [[0, "#f2e2bc"], [1, "#c39d5c"]]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.save(); g.translate((x0 + x1) / 2, y0 + 17); g.scale(-1, 1); g.fillStyle = "#4a1a12"; g.font = `700 17px ${KIT.fontBody || "Palatino, Georgia, serif"}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(titel, 0, 0); g.restore();
      g.fillStyle = "rgba(43,26,16,.55)"; for (let l = 0; l < 5; l++) { const ly = y0 + 36 + l * 12; if (ly > y1 - 8) break; g.fillRect(x1 - 12 - (x1 - x0) * (.45 + r() * .35) - r() * 14, ly, (x1 - x0) * (.45 + r() * .35), 3); } };
    for (const [m0, art] of [[-4.5, "spiegel"], [0, "Lichtbrechung"], [4.5, "Totalreflexion"]]) { const x0 = X(m0 - 1.775), x1 = X(m0 + 1.775);
      g.strokeStyle = "#c9a245"; g.lineWidth = 4; g.strokeRect(x0, Y(5.6), x1 - x0, Y(2.55) - Y(5.6));
      if (art === "spiegel") { g.fillStyle = "rgba(160,178,196,.6)"; g.fillRect(x0 + 4, Y(5.6) + 4, x1 - x0 - 8, Y(2.55) - Y(5.6) - 8); }
      else tafel(X(m0 - 1.6), X(m0 + 1.6), Y(4.85), Y(2.85), art);
      g.strokeStyle = "#c9a245"; g.lineWidth = 4; g.beginPath(); g.ellipse(X(m0), Y(6.02), .44 * k, .27 * k, 0, 0, 7); g.stroke(); }
    for (const p of [-6.75, -2.25, 2.25, 6.75]) { const x0 = X(p - .31), x1 = X(p + .31);
      g.fillStyle = "#f8f4ec"; g.fillRect(x0, Y(6.26), x1 - x0, h - Y(6.26)); g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(x1 - 5, Y(6.26), 5, h - Y(6.26));
      g.fillStyle = "#c9a245"; g.fillRect(x0 - 4, Y(6.47), x1 - x0 + 8, Y(6.21) - Y(6.47));
      for (const d of [-.22, 0, .22]) schein(X(p + d), Y(2.62 + (d ? 0 : .08)), 11); }
    { const x = cx, y = Y(6.35), q = 78;   // Kronleuchter davor (näher, also größer)
      g.strokeStyle = "#b8903a"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke(); g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, q, q * .2, 0, 0, 7); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.ellipse(x, y - 32, q * .55, q * .11, 0, 0, 7); g.stroke();
      g.fillStyle = "rgba(236,246,255,.9)"; for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; g.fillRect(x + Math.cos(a) * q * .95 - 1, y + Math.sin(a) * q * .2, 2, 14); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; schein(x + Math.cos(a) * q, y + Math.sin(a) * q * .2 - 14, 16); } schein(x, y - 12, 100, .3); }
    g.globalCompositeOperation = "multiply"; g.fillStyle = "#9eacbc"; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over";
    g.fillStyle = RH.rad(g, cx, h / 2, w * .25, w * .62, [[0, "rgba(0,0,0,0)"], [1, "rgba(30,34,42,.5)"]]); g.fillRect(0, 0, w, h);
    const nx = 3, ny = 3; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const a = (r() - .5) * .14; g.fillStyle = a > 0 ? `rgba(255,255,255,${a})` : `rgba(18,22,30,${-a})`; g.fillRect(i * w / nx, j * h / ny, w / nx, h / ny); }
    g.fillStyle = RH.lin(g, 0, 0, w, h, [[0, "rgba(255,255,255,.12)"], [.6, "rgba(255,255,255,0)"]]); g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 2;
    for (let i = 1; i < nx; i++) for (const d of [-6, 6]) { g.beginPath(); g.moveTo(i * w / nx + d, 0); g.lineTo(i * w / nx + d, h); g.stroke(); }
    for (let j = 1; j < ny; j++) for (const d of [-6, 6]) { g.beginPath(); g.moveTo(0, j * h / ny + d); g.lineTo(w, j * h / ny + d); g.stroke(); }
    g.strokeStyle = "#b8963e"; g.lineWidth = 8; for (let i = 1; i < nx; i++) { g.beginPath(); g.moveTo(i * w / nx, 0); g.lineTo(i * w / nx, h); g.stroke(); }
    for (let j = 1; j < ny; j++) { g.beginPath(); g.moveTo(0, j * h / ny); g.lineTo(w, j * h / ny); g.stroke(); }
    g.fillStyle = "#d8b45a"; for (let i = 1; i < nx; i++) for (let j = 1; j < ny; j++) { g.beginPath(); g.arc(i * w / nx, j * h / ny, 12, 0, 7); g.fill(); } }, false),
  garten: () => RH.tex("saal-garten", 256, 512, (g, w, h) => { const r = RH.seeded(335);
    g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#6f9fd8"], [.45, "#bcd2e8"], [.62, "#ffd9a0"], [.66, "#f2b070"], [1, "#4a6a3a"]]); g.fillRect(0, 0, w, h);
    g.fillStyle = RH.rad(g, w * .6, h * .6, 0, 80, [[0, "rgba(255,240,200,.95)"], [1, "rgba(255,200,120,0)"]]); g.fillRect(0, h * .4, w, h * .4);
    for (let i = 0; i < 7; i++) { const x = r() * w, y = h * (.15 + r() * .3); g.fillStyle = "rgba(255,255,255,.45)"; g.beginPath(); g.ellipse(x, y, 30 + r() * 30, 8 + r() * 6, 0, 0, 7); g.fill(); }
    g.fillStyle = "#2f4a2a"; for (let i = 0; i < 9; i++) { const x = (i + .5) * w / 9; g.beginPath(); g.ellipse(x, h * .63, 14, 24 + r() * 10, 0, 0, 7); g.fill(); }
    g.fillStyle = "#3a5a32"; g.fillRect(0, h * .66, w, h * .34); g.fillStyle = "#d8c8a0"; g.beginPath(); g.moveTo(w * .42, h); g.lineTo(w * .48, h * .67); g.lineTo(w * .52, h * .67); g.lineTo(w * .58, h); g.fill();
    g.fillStyle = "#26401f"; for (const x of [w * .15, w * .85]) for (let k = 0; k < 4; k++) { g.fillRect(x - 30 + k * 3, h * (.72 + k * .07), 60 - k * 6, h * .045); }
    g.fillStyle = "#e8eef4"; g.beginPath(); g.ellipse(w / 2, h * .8, 34, 8, 0, 0, 7); g.fill(); g.fillStyle = "rgba(200,230,255,.8)"; g.fillRect(w / 2 - 3, h * .7, 6, h * .1);
    g.strokeStyle = "#f4efe6"; g.lineWidth = 7; g.strokeRect(0, 0, w, h); g.lineWidth = 4; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(i * w / 3, 0); g.lineTo(i * w / 3, h); g.stroke(); }
    for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(0, j * h / 6); g.lineTo(w, j * h / 6); g.stroke(); } }, false)
};
function saalMat(){ return {
  boden: RH.mat("o1-boden", () => RH.std({map: saalTex.marmor(), roughness: .16, metalness: .05, envMap: saalTex.env(), envMapIntensity: .9})),
  stuck: RH.mat("o1-stuck", () => RH.std({map: saalTex.stuck(), roughness: .85})),
  marmor: RH.mat("o1-marmor", () => RH.std({color: 0xf2ece2, roughness: .25, metalness: .05, envMap: saalTex.env(), envMapIntensity: .6})),
  gruen: RH.mat("o1-gruen", () => RH.std({color: 0x34433e, roughness: .25, metalness: .05, envMap: saalTex.env(), envMapIntensity: .6})),
  decke: RH.mat("o1-decke", () => RH.std({map: saalTex.fresko(), roughness: .9, emissive: 0xffffff, emissiveMap: saalTex.fresko(), emissiveIntensity: .32})),
  // Spiegel: gemaltes Spiegelbild (leuchtet etwas selbst, damit es wie ein heller Saal im Glas wirkt) und ein Hauch echter Umgebungsspiegelung
  spiegel: RH.mat("o1-spiegel", () => RH.std({map: saalTex.scheiben(), color: 0xc8d0d8, metalness: .25, roughness: .08, envMap: saalTex.env(), envMapIntensity: .35, emissive: 0xffffff, emissiveMap: saalTex.scheiben(), emissiveIntensity: .26})),
  feld: RH.mat("o1-feld", () => RH.std({map: saalTex.feld(), color: 0xc8d0d8, metalness: .25, roughness: .08, envMap: saalTex.env(), envMapIntensity: .35, emissive: 0xffffff, emissiveMap: saalTex.feld(), emissiveIntensity: .3})),
  oval: RH.mat("o1-oval", () => RH.std({map: saalTex.scheiben(), color: 0xe4e8ec, metalness: .25, roughness: .08, envMap: saalTex.env(), envMapIntensity: .45, emissive: 0xffffff, emissiveMap: saalTex.scheiben(), emissiveIntensity: .45})),
  garten: RH.mat("o1-garten", () => RH.basic({map: saalTex.garten()})),
  kristall: RH.mat("o1-kristall", () => RH.basic({color: 0xeef6ff})),
  kerze: RH.mat("o1-kerze", () => RH.std({color: 0xf6f0e2, roughness: .6, emissive: 0x6a5a40})),
  gold: KIT.mat("gold")
}; }
// Kristallleuchter (Aufhängung in 7,5 m, Körper von ~5,6 bis 7,1 m): Goldgestell, 8 + 5 Kerzen, Kristallketten und Girlanden
function kristallleuchter(S, m, fl, x, z){
  const yR = 6.0, R = .72, yO = 6.5, RO = .4;
  S.cyl(m.gold, .26, .26, .05, 16, x, H - .025, z).cyl(m.gold, .022, .022, H - 6.15, 6, x, (H + 6.15) / 2, z);
  for (const y of [7.15, 6.75, 6.25]) S.put(m.gold, new T3.SphereGeometry(.06, 10, 8), M(x, y, z, 0, 0, 0, 1, 1.3, 1));
  S.put(m.gold, new T3.TorusGeometry(R, .022, 6, 36), M(x, yR, z, PI / 2)).put(m.gold, new T3.TorusGeometry(RO, .018, 6, 28), M(x, yO, z, PI / 2));
  for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, cx = x + Math.cos(a) * R, cz = z + Math.sin(a) * R;
    S.rod(m.gold, [x, 6.22, z], [cx, yR + .02, cz], .014, 5).cyl(m.gold, .045, .03, .05, 8, cx, yR + .04, cz).cyl(m.kerze, .018, .02, .16, 6, cx, yR + .14, cz); fl.push(V(cx, yR + .26, cz));
    for (let j = 0; j < 3; j++) S.put(m.kristall, new T3.OctahedronGeometry(.028, 0), M(cx, yR - .07 - j * .07, cz, 0, 0, 0, 1, 1.5, 1));
    const b = (k + 1) / 8 * PI * 2, nx = x + Math.cos(b) * R, nz = z + Math.sin(b) * R;   // Girlande zum Nachbararm
    for (let j = 1; j < 5; j++) { const t = j / 5, sag = Math.sin(t * PI) * .16; S.put(m.kristall, new T3.OctahedronGeometry(.022, 0), M(cx + (nx - cx) * t, yR - .02 - sag, cz + (nz - cz) * t)); } }
  for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2 + .3, cx = x + Math.cos(a) * RO, cz = z + Math.sin(a) * RO;
    S.rod(m.gold, [x, 6.62, z], [cx, yO + .02, cz], .012, 5).cyl(m.gold, .04, .028, .045, 8, cx, yO + .04, cz).cyl(m.kerze, .016, .018, .14, 6, cx, yO + .13, cz); fl.push(V(cx, yO + .24, cz)); }
  S.put(m.kristall, new T3.OctahedronGeometry(.09, 0), M(x, 5.72, z, 0, 0, 0, 1, 1.8, 1)).put(m.gold, new T3.SphereGeometry(.07, 10, 8), M(x, 5.95, z));
}
function saalShell(ctx){
  const B = ctx.bounds, m = saalMat(), S = RH.sammler(), rect = RH.rechteck(B.x0, B.x1, B.z0, B.z1), fl = [], lich = [];
  RH.boden(ctx, m.boden, {uS: 4, vS: 4});
  // Wände, Sockel aus grünem Marmor, Brüstungsleiste, Goldleiste, Hohlkehle zur Decke, Deckenfresko
  S.put(m.stuck, RH.zug(rect, [[0, 0], [0, 6.62]], {zu: true, uS: 2.5, vS: 2.5}));
  S.put(m.gruen, RH.zug(rect, [[.07, 0], [.07, .28], [0, .34]], {zu: true}));
  S.put(m.gold, RH.zug(rect, [[0, .92], [.045, .94], [.045, .99], [0, 1.01]], {zu: true}));
  S.put(m.gold, RH.zug(rect, [[0, 6.46], [.09, 6.5], [.09, 6.62], [.07, 6.66]], {zu: true}));
  const kehle = [[.07, 6.66]]; for (let i = 1; i <= 8; i++) { const t = i / 8 * PI / 2; kehle.push([.88 - .81 * Math.cos(t), 6.69 + .81 * Math.sin(t)]); }
  S.put(m.stuck, RH.zug(rect, kehle, {zu: true, glatt: true, uS: 2.5, vS: 2.5}));
  { const g = new T3.PlaneGeometry(B.x1 - B.x0 - 1.74, B.z0 - B.z1 - 1.74); S.put(m.decke, g, M(0, H, 0, PI / 2)); }
  // Pilaster: weißer Marmor, grüner Sockel, goldenes Kapitell – an den Seitenwänden bei z = ±9, ±4,5, 0, an den Stirnwänden neben Tür und Ecken
  const pil = (x, z, ry) => { const t = M(x, 0, z, 0, ry);
    S.put(m.marmor, new T3.BoxGeometry(.62, 5.9, .14), t.clone().multiply(M(0, .36 + 2.95, .07))).put(m.gruen, new T3.BoxGeometry(.78, .36, .22), t.clone().multiply(M(0, .18, .11)));
    // Spiegelpilaster: Spiegelstreifen aus übereinandergesetzten Scheiben im Marmorrahmen (Ausschnitt des Spiegelbilds zwischen den Sprossen)
    const sp = new T3.PlaneGeometry(.44, 5.36), su = sp.attributes.uv; for (let i = 0; i < su.count; i++) su.setX(i, .36 + su.getX(i) * .28);
    S.put(m.spiegel, sp, t.clone().multiply(M(0, .36 + 2.95, .146)));
    S.put(m.gold, new T3.BoxGeometry(.8, .26, .22), t.clone().multiply(M(0, 6.34, .11))).put(m.gold, new T3.BoxGeometry(.7, .06, .2), t.clone().multiply(M(0, 6.18, .1)));
    for (const s of [-1, 1]) S.put(m.gold, new T3.CylinderGeometry(.06, .06, .2, 10), t.clone().multiply(M(s * .3, 6.2, .14, PI / 2))); };
  for (const sx of [-1, 1]) for (const z of [9, 4.5, 0, -4.5, -9]) pil(sx * 8, z, sx < 0 ? PI / 2 : -PI / 2);
  for (const sz of [-1, 1]) for (const x of [-7.55, -2.6, 2.6, 7.55]) pil(x, sz * 11, sz < 0 ? 0 : PI);
  // Goldrahmen um die Tafelfelder, ovale Spiegel darüber
  for (const sx of [-1, 1]) for (const z of [6.75, 2.25, -2.25, -6.75]) { const x = sx * (8 - .03), ry = sx < 0 ? PI / 2 : -PI / 2, t = M(x, 0, z, 0, ry), wf = 3.55, y0 = 2.55, y1 = 5.6;
    for (const [w, h, xx, yy] of [[wf, .06, 0, y0], [wf, .06, 0, y1], [.06, y1 - y0, -wf / 2, (y0 + y1) / 2], [.06, y1 - y0, wf / 2, (y0 + y1) / 2]]) S.put(m.gold, new T3.BoxGeometry(w, h, .05), t.clone().multiply(M(xx, yy, .02)));
    const ov = new T3.CircleGeometry(.42, 28), ou = ov.attributes.uv; for (let i = 0; i < ou.count; i++) ou.setXY(i, .36 + ou.getX(i) * .28, .58 + ou.getY(i) * .12);   // Ausschnitt des Spiegelbilds zwischen den Sprossen
    S.put(m.oval, ov, t.clone().multiply(M(0, 6.02, .02, 0, 0, 0, 1.05, .62, 1))).put(m.gold, new T3.TorusGeometry(.45, .035, 6, 32), t.clone().multiply(M(0, 6.02, .03, 0, 0, 0, 1.05, .64, 1)));
    S.put(m.gold, new T3.SphereGeometry(.06, 8, 6), t.clone().multiply(M(0, 6.35, .05)));
    RH.belege(ctx, {x0: sx < 0 ? B.x0 : B.x1 - .2, x1: sx < 0 ? B.x0 + .2 : B.x1, y0: 5.6, y1: 6.5, z0: z - .6, z1: z + .6}); }
  // Hohe Bogenspiegel an der Stirnwand (vorne), Bogenfenster zum Garten an der Rückwand
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) { const x = sx * 5.07, z = sz * (11 - .02), ry = sz < 0 ? 0 : PI, spiegel = sz < 0, w = spiegel ? 2.4 : 2.1, h = spiegel ? 5.7 : 5.0, y0 = spiegel ? .38 : 1.0;
    const f = RH.uvAufUmriss(new T3.ShapeGeometry(RH.bogenForm(w, h, 0), 16));
    S.put(spiegel ? m.spiegel : m.garten, f, M(x, y0, z, 0, ry));
    const ring = spiegel ? RH.bogenForm(w + .5, h + .5, 0) : RH.bogenForm(w + .3, h + .16, 0); ring.holes.push(RH.bogenForm(w, h, 0));
    const rr = new T3.ExtrudeGeometry(ring, {depth: .12, bevelEnabled: false, curveSegments: 16}); rr.translate(0, spiegel ? -.25 : -.08, -.04);
    S.put(m.gold, rr, M(x, y0, z, 0, ry)); S.put(m.gold, new T3.CircleGeometry(spiegel ? .26 : .32, 16, 0, PI), M(x, spiegel ? 6.22 : y0 + h + .1, z, 0, ry).multiply(M(0, 0, spiegel ? .1 : .06)));
    if (spiegel) { // Spiegel: zweistufiger Prunkrahmen (innen ein vorstehender Stab, außen breit) – setzt ihn von den Fenstern ab
      const st = RH.bogenForm(w + .12, h + .06, 0); st.holes.push(RH.bogenForm(w, h, 0)); const sg = new T3.ExtrudeGeometry(st, {depth: .1, bevelEnabled: false, curveSegments: 16}); sg.translate(0, -.03, .02);
      S.put(m.gold, sg, M(x, y0, z, 0, ry)); }
    if (!spiegel) S.put(m.marmor, new T3.BoxGeometry(w + .4, .1, .3), M(x, y0 - .05, z, 0, ry).multiply(M(0, 0, .1)));
    if (spiegel) RH.belege(ctx, {x0: x - w / 2 - .3, x1: x + w / 2 + .3, y0: 0, y1: y0 + h + .45, z0: B.z1, z1: B.z1 + .3}); }   // Fenster: Vorhänge der Ausstattung (HU.fenster)
  // Wandleuchter (Girandolen) an den Pilastern der Seitenwände: zwei davon sind die Punktlichter der Hülle
  for (const sx of [-1, 1]) for (const z of [9, 4.5, 0, -4.5, -9]) { const x = sx * (8 - .16), d = -sx, y = 2.4;
    S.cyl(m.gold, .07, .05, .2, 8, x, y, z).rod(m.gold, [x, y - .05, z], [x + d * .3, y + .1, z], .016, 5);
    for (const dz of [-.22, 0, .22]) { const cx = x + d * .3, cy = y + .12 + (dz ? 0 : .08); S.rod(m.gold, [x + d * .3, y + .1, z], [cx, cy, z + dz], .012, 5).cyl(m.gold, .04, .025, .04, 8, cx, cy, z + dz).cyl(m.kerze, .016, .018, .15, 6, cx, cy + .09, z + dz); fl.push(V(cx, cy + .2, z + dz)); }
    if ((sx < 0 && z === 4.5) || (sx > 0 && z === -4.5)) lich.push(RH.punktlicht(ctx, 0xffd6a0, 7, x + d * .7, y + .5, z, {weite: 11, flackern: .4})); }
  // Kristallleuchter über den Seitenbereichen
  for (const sx of [-1, 1]) for (const z of [-1.0, -6.5]) { kristallleuchter(S, m, fl, sx * 4.4, z); RH.belege(ctx, {x0: sx * 4.4 - .9, x1: sx * 4.4 + .9, y0: 5.5, y1: H, z0: z - .9, z1: z + .9}); }
  S.build(ctx.group);
  RH.flammen(ctx, fl, 0xffc878, .2); RH.flammen(ctx, [[-4.4, 6.1, -1], [4.4, 6.1, -1], [-4.4, 6.1, -6.5], [4.4, 6.1, -6.5]], 0xffe2b0, 1.9, {deck: .35, flackern: false});
  RH.huelle(ctx, {saeuleX: [B.x0 + .1, B.x1 - .1], fackeln: [9, 4.5, 0, -4.5, -9].flatMap(z => [[-7.84, 2.2, z, 1], [7.84, 2.2, z, -1]]), fenster: [[-5.07, B.z0 - .02], [5.07, B.z0 - .02]]});
  return H;
}
// Büste auf einem Marmorsockel (frei stehende Figur für den Spiegelsaal)
function saalStuecke(Hd){
  const {M: m, box, cyl, sph, STUECK, FIGUR} = Hd; if (STUECK.buste) return;
  STUECK.buste = {min: .6, max: .6, h: 1.95, d: .55, off: .25, bau: (D) => { const K = D.K, z = .28, c = "#ece6dc";
    K.put("atlas", box(.46, .08, .46), m(0, .04, z), "#3c4a44").put("atlas", box(.38, 1.0, .38), m(0, .58, z), c).put("atlas", box(.46, .08, .46), m(0, 1.12, z), "#3c4a44");
    K.put("gold", box(.4, .03, .4), m(0, 1.17, z)).put("atlas", cyl(.09, .12, .1, 10), m(0, 1.24, z), c).put("atlas", sph(.2, 12, 8), m(0, 1.42, z, 0, 0, 0, 1.25, .62, .7), c);
    K.put("atlas", cyl(.055, .065, .13, 8), m(0, 1.58, z), c).put("atlas", sph(.12, 12, 10), m(0, 1.74, z, 0, 0, 0, .9, 1.1, 1), c).put("atlas", sph(.125, 10, 8), m(0, 1.79, z - .02, 0, 0, 0, .95, .9, 1), "#d8d0c2"); }};
  FIGUR.add("buste");
}
// Spiegel in den Goldrahmen der Tafelfelder, an denen keine Tafel hängt (sonst bleiben leere cremefarbene Felder). Erster eigener Ausstattungsschritt:
// Tafeln, Stationen und Exponate stehen schon; was an der Wand im Feld hängt (Tafeln des Raums), lässt das Feld frei. Danach belegt, damit die
// Ausstattung dort kein Bild davorhängt
function spiegelFelder(D){
  const ctx = D.ctx, B = D.B, bb = new T3.Box3(), gr = V(0, 0, 0), da = [];
  ctx.group.updateMatrixWorld(true);
  for (const o of ctx.group.children.slice(ctx._shellEnd || 0)) { if (o.isLight || o.isPoints || o.isSprite) continue; bb.setFromObject(o); if (bb.isEmpty()) continue;
    bb.getSize(gr); if (gr.x < 6 && gr.z < 6) da.push(bb.clone()); }
  const m = saalMat(), S = RH.sammler(); let n = 0;
  for (const sx of [-1, 1]) for (const z of [6.75, 2.25, -2.25, -6.75]) { const wx = sx < 0 ? B.x0 : B.x1;
    if (da.some(b => (sx < 0 ? b.min.x < wx + .35 : b.max.x > wx - .35) && b.max.y > 2.7 && b.min.y < 5.45 && b.max.z > z - 1.6 && b.min.z < z + 1.6)) continue;
    S.put(m.feld, new T3.PlaneGeometry(3.45, 2.95), M(wx - sx * .04, 4.075, z, 0, sx < 0 ? PI / 2 : -PI / 2)); n++;
    ctx.belege({x0: sx < 0 ? B.x0 : B.x1 - .25, x1: sx < 0 ? B.x0 + .25 : B.x1, y0: 2.5, y1: 5.65, z0: z - 1.8, z1: z + 1.8}); }
  if (n) S.build(ctx.group, {noOcc: true}); D.zahl.spiegelfeld = n;
}
RH.raum.optik1 = {
  licht: {hintergrund: 0x1a140e, nebel: [0x3a3026, .011], himmel: [0xfff0d8, 0x8a7458, 1.25], umgebung: [0xfff0dc, .36], sonne: [0xfff0d4, 1.7, [5, 14, 12]]},
  shell: saalShell,
  station: {text: {color: "#3a1804"}, schein: [0xffd890, .5]},   // heller Saal: dunkle Schrift, gedämpfter Schein (sonst ein weißer Fleck vor der cremeweißen Wand)
  ambient: {kerzen: 0, staub: 220, staubFarbe: 0xffe4a8, steigen: .03},
  dekor: {deck: ["kommode:linsen", "spiegel", "buste", "leuchter", "globus", "buste", "kommode", "leuchter"], tief: ["bank", "anrichte", "bank"],
    ohne: ["Kronleuchter", "Bücher"], bilder: ["zauberer", "hexe", "burg", "berge", "still", "schiff", "drache", "sterne", "thema"], vorher: [["Saalmöbel", (D, Hd) => saalStuecke(Hd)], ["Spiegelfelder", D => spiegelFelder(D)]]}
};

/* =====================================================================
   optik2 · Sternwarte der Linsen
   ===================================================================== */
const KZ = -4.5, KAX = 7.6, KAZ = 6.3, KH = 6.0, SPW = .85;   // Kuppel: Mitte z = −4,5, Halbachsen 7,6 × 6,3, Höhe 6 m über der Decke (7,5 m); Dachspalt ±0,85 m, nach vorn (−z)
const sternTex = {
  kuppel: () => RH.tex("sw-kuppel", 1024, 512, (g, w, h) => { const r = RH.seeded(441);
    g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#0a1236"], [.6, "#14205a"], [1, "#22306e"]]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.globalAlpha = .3 + r() * .6; g.fillStyle = r() < .3 ? "#ffe6a8" : "#dfe6ff"; const s = .6 + r() * 1.6; g.fillRect(r() * w, r() * h, s, s); } g.globalAlpha = 1;
    const stern = (x, y, q, col) => { g.fillStyle = col; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2 - PI / 2, rr = k % 2 ? q * .35 : q; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
    for (let c = 0; c < 14; c++) { const cx = r() * w, cy = h * (.1 + r() * .8), n = 4 + ((r() * 3) | 0), P = [];
      for (let k = 0; k < n; k++) P.push([cx + (r() - .5) * 150, cy + (r() - .5) * 110]);
      g.strokeStyle = "rgba(230,200,120,.55)"; g.lineWidth = 1.6; g.beginPath(); P.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      P.forEach(([x, y]) => stern(x, y, 5 + r() * 6, "#f2cf6a")); }
    g.strokeStyle = "rgba(220,190,110,.35)"; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, h * k / 4); g.lineTo(w, h * k / 4); g.stroke(); }
    for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(k * w / 12, 0); g.lineTo(k * w / 12, h); g.stroke(); } }),
  karte: () => RH.tex("sw-karte", 1024, 1024, (g, w, h) => { const r = RH.seeded(442), cx = w / 2, cy = h / 2, R = w * .46;
    g.fillStyle = "#d9c49a"; g.fillRect(0, 0, w, h); RH.flecken(g, w, h, 6000, .15, ["#8a6a3a", "#fff3d0"], r);
    g.fillStyle = "#e8d6ae"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.fillStyle = "#13204e"; g.beginPath(); g.arc(cx, cy, R * .8, 0, 7); g.fill();
    for (let i = 0; i < 520; i++) { const a = r() * PI * 2, d = Math.sqrt(r()) * R * .79; g.globalAlpha = .4 + r() * .6; g.fillStyle = "#fff6dc"; const s = .8 + r() * 2.2; g.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s); } g.globalAlpha = 1;
    for (let c = 0; c < 12; c++) { const a = r() * PI * 2, d = r() * R * .62, x0 = cx + Math.cos(a) * d, y0 = cy + Math.sin(a) * d, P = [];
      for (let k = 0; k < 5; k++) P.push([x0 + (r() - .5) * 130, y0 + (r() - .5) * 130]);
      g.strokeStyle = "rgba(240,210,130,.7)"; g.lineWidth = 2; g.beginPath(); P.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      g.fillStyle = "#ffe08a"; P.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); }); }
    g.strokeStyle = "#7a5a2a"; for (const [rr, lw] of [[R, 6], [R * .8, 4], [R * .9, 2]]) { g.lineWidth = lw; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); }
    for (let k = 0; k < 72; k++) { const a = k / 72 * PI * 2, l = k % 6 ? .84 : .82; g.lineWidth = k % 6 ? 1.5 : 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * l, cy + Math.sin(a) * R * l); g.lineTo(cx + Math.cos(a) * R * .8, cy + Math.sin(a) * R * .8); g.stroke(); }
    g.strokeStyle = "rgba(230,200,120,.45)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R * .4, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx - R * .8, cy); g.lineTo(cx + R * .8, cy); g.moveTo(cx, cy - R * .8); g.lineTo(cx, cy + R * .8); g.stroke();
    g.fillStyle = "#7a5a2a"; g.font = "700 34px Palatino, Georgia, serif"; g.textAlign = "center"; g.fillText("Himmelskarte", cx, h - 22); }),
  // Mondsichel (rechts beleuchtet): Schein und Scheibe, den Schattenteil ausgeschnitten – dort scheint der Himmel durch, nur ein Hauch Erdlicht
  // (eine fast schwarze Schattenscheibe mit Lichtkranz wirkte wie eine Finsternis)
  mond: () => RH.tex("sw-mond", 256, 256, (g, w, h) => { const r = RH.seeded(443), c = w / 2, R = w * .32, sx = c - w * .16, sy = c - h * .05, sr = w * .3; g.clearRect(0, 0, w, h);
    g.fillStyle = RH.rad(g, c + w * .14, c, R * .5, w * .48, [[0, "rgba(255,250,230,.5)"], [1, "rgba(255,250,230,0)"]]); g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.arc(c, c, R, 0, 7); g.clip(); g.fillStyle = "#f6f1de"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(150,140,120,${.15 + r() * .25})`; g.beginPath(); g.arc(w * (.25 + r() * .5), h * (.25 + r() * .5), 4 + r() * 16, 0, 7); g.fill(); } g.restore();
    g.globalCompositeOperation = "destination-out"; g.fillStyle = RH.rad(g, sx, sy, sr * .96, sr * 1.06, [[0, "#000"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "source-over"; g.save(); g.beginPath(); g.arc(c, c, R, 0, 7); g.clip(); g.fillStyle = "rgba(120,140,190,.14)"; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill(); g.restore(); }, false)
};
function sternMat(){ return {
  boden: RH.mat("o2-boden", () => RH.std({map: KIT.tex.flag(), color: 0x8c92a8, roughness: .72})),
  wand: RH.mat("o2-wand", () => RH.std({map: KIT.tex.stone(), color: 0xc4c6d4, roughness: .92})),
  wandD: RH.mat("o2-wandd", () => RH.std({map: KIT.tex.stone(), color: 0x7a7c8a, roughness: .95})),
  kuppel: RH.mat("o2-kuppel", () => RH.std({map: sternTex.kuppel(), roughness: .9, emissive: 0xffffff, emissiveMap: sternTex.kuppel(), emissiveIntensity: .55, side: T3.DoubleSide})),
  decke: RH.mat("o2-decke", () => RH.std({map: sternTex.kuppel(), roughness: .9, emissive: 0xffffff, emissiveMap: sternTex.kuppel(), emissiveIntensity: .35})),
  karte: RH.mat("o2-karte", () => RH.std({map: sternTex.karte(), roughness: .9, emissive: 0x3a3020})),
  mond: RH.mat("o2-mond", () => RH.basic({map: sternTex.mond(), transparent: true, depthWrite: false, fog: false})),
  nacht: RH.mat("o2-nacht", () => RH.basic({map: KIT.tex.night()})),
  messing: KIT.mat("brass"), holz: KIT.mat("darkwood"), eisen: KIT.mat("metal"), glas: KIT.mat("glass"), stein: KIT.mat("stone")
}; }
function kuppelPunkt(th, ph, ins = 0){ const c = Math.cos(th), x = KAX * c * Math.cos(ph), y = H + KH * Math.sin(th), z = KZ + KAZ * c * Math.sin(ph);
  const n = V(x / (KAX * KAX), (y - H) / (KH * KH), (z - KZ) / (KAZ * KAZ)).normalize(); return [x - n.x * ins, y - n.y * ins, z - n.z * ins]; }
const spaltDelta = th => Math.asin(Math.min(1, SPW / Math.max(1e-3, KAX * Math.cos(th))));   // halber Winkel des Spalts im Ring th
function kuppelGeo(){
  const nT = 16, nP = 56, pos = [], nor = [], uv = [], idx = [], thMax = PI / 2 - .02;
  for (let i = 0; i <= nT; i++) { const th = thMax * i / nT, d = spaltDelta(th), p0 = -PI / 2 + d, p1 = 1.5 * PI - d;
    for (let j = 0; j <= nP; j++) { const ph = p0 + (p1 - p0) * j / nP, p = kuppelPunkt(th, ph), n = V(p[0] / (KAX * KAX), (p[1] - H) / (KH * KH), (p[2] - KZ) / (KAZ * KAZ)).normalize().negate();
      pos.push(...p); nor.push(n.x, n.y, n.z); uv.push((ph + PI / 2) / (2 * PI) * 2, th / (PI / 2)); } }
  for (let i = 0; i < nT; i++) for (let j = 0; j < nP; j++) { const a = i * (nP + 1) + j, b = a + nP + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
function sternShell(ctx){
  const B = ctx.bounds, m = sternMat(), S = RH.sammler(), rect = RH.rechteck(B.x0, B.x1, B.z0, B.z1), fl = [];
  RH.boden(ctx, m.boden, {uS: 3.2, vS: 3.2});
  // Meridianlinie aus Messing mit Sternmarken
  S.box(m.messing, .05, .008, B.z0 - B.z1 - .6, 0, .004, (B.z0 + B.z1) / 2);
  const st = new T3.Shape(); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2, rr = k % 2 ? .07 : .2; k ? st.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : st.moveTo(rr, 0); }
  for (let z = 9; z > -10.5; z -= 2.5) { S.put(m.messing, new T3.RingGeometry(.2, .24, 32), M(0, .006, z, -PI / 2)).put(m.messing, new T3.ShapeGeometry(st), M(0, .007, z, -PI / 2)); }
  // Wände, Sockel, Gesims, flache Sternendecke mit Öffnung für die Kuppel
  S.put(m.wand, RH.zug(rect, [[0, 0], [0, H + .02]], {zu: true, uS: 3.6, vS: 3.6}));
  S.put(m.wandD, RH.zug(rect, [[.15, 0], [.15, .4], [0, .5]], {zu: true, uS: 3.6, vS: 3.6}));
  S.put(m.holz, RH.zug(rect, [[0, 7.12], [.26, 7.2], [.26, 7.36], [.12, 7.44], [.12, H]], {zu: true, uS: 2.4, vS: 2.4}));
  { const s = new T3.Shape(); s.moveTo(B.x0, B.z1); s.lineTo(B.x1, B.z1); s.lineTo(B.x1, B.z0); s.lineTo(B.x0, B.z0); s.lineTo(B.x0, B.z1);
    const loch = new T3.Path(); loch.absellipse(0, KZ, KAX, KAZ, 0, PI * 2, false); s.holes.push(loch);
    const g = new T3.ShapeGeometry(s, 48); uvMal(g, 1 / 8, 1 / 8); S.put(m.decke, g, M(0, H, 0, PI / 2)); }
  // Kuppel mit Dachspalt, Rippen, Ringen und Schienen am Spalt
  S.put(m.kuppel, kuppelGeo());
  const nT = 16, thMax = PI / 2 - .02;
  for (let k = 1; k < 12; k++) { const ph = -PI / 2 + k * PI / 6, pts = [];
    for (let i = 0; i <= nT; i++) { const th = thMax * i / nT, d = spaltDelta(th); if (ph < -PI / 2 + d || ph > 1.5 * PI - d) break; pts.push(kuppelPunkt(th, ph, .05)); }
    for (let i = 0; i < pts.length - 1; i++) S.rod(m.messing, pts[i], pts[i + 1], .035, 5); }
  for (const th of [0, .42, .85]) { const d = spaltDelta(th), p0 = -PI / 2 + d, p1 = 1.5 * PI - d, n = 40;
    for (let j = 0; j < n; j++) S.rod(m.messing, kuppelPunkt(th, p0 + (p1 - p0) * j / n, .06), kuppelPunkt(th, p0 + (p1 - p0) * (j + 1) / n, .06), th ? .03 : .06, 5); }
  for (const sd of [-1, 1]) { let alt = null; for (let i = 0; i <= nT; i++) { const th = thMax * i / nT, d = spaltDelta(th); if (d > 1.45) break;
    const p = kuppelPunkt(th, sd < 0 ? -PI / 2 + d : 1.5 * PI - d, .05); if (alt) S.rod(m.messing, alt, p, .075, 6); alt = p; } }
  // Himmel hinter dem Spalt: Sterne als Punkte, Mond
  RH.sterne(ctx, {n: 2600, r: 48, min: .1, seed: 23, groesse: 2.4});
  // Mond am linken Rand des Spalts, knapp über dem Kuppelfuß (vom Eingang aus 18° hoch): in der Spaltmitte stand er hinter dem schwebenden Prisma
  // und dem Brennpunkt des Brennglases
  { const mo = new T3.Mesh(new T3.PlaneGeometry(3.4, 3.4), m.mond); mo.position.set(-1.27, 16.8, -36.2); mo.lookAt(0, 1.6, 9.3); mo.renderOrder = -8; mo.userData.noPick = true; mo.userData.noOcc = true; ctx.group.add(mo); }
  // Großes Messingfernrohr auf Steinpfeiler (vorne rechts), zum Dachspalt gerichtet
  { const px = 6.55, pz = -9.9, py = 2.0, d = V(-6.55, 8.5, -.06).normalize(), q = new T3.Quaternion().setFromUnitVectors(V(0, 1, 0), d), at = (s) => [px + d.x * s, py + d.y * s, pz + d.z * s];
    S.cyl(m.wandD, .5, .58, 1.3, 16, px, .65, pz).cyl(m.stein, .62, .62, .12, 16, px, 1.36, pz).cyl(m.messing, .36, .4, .08, 20, px, 1.46, pz);
    S.rod(m.messing, [px, 1.5, pz - .32], [px, py, pz - .32], .04, 8).rod(m.messing, [px, 1.5, pz + .32], [px, py, pz + .32], .04, 8).rod(m.messing, [px, py, pz - .34], [px, py, pz + .34], .05, 10);
    const rohr = (r0, r1, a, b, mat, seg = 20) => { const L = b - a, g = new T3.CylinderGeometry(r1, r0, L, seg, 1, false); g.applyMatrix4(new T3.Matrix4().compose(V(...at((a + b) / 2)), q, V(1, 1, 1))); S.put(mat, g); };
    rohr(.17, .2, -1.2, .4, m.messing); rohr(.2, .24, .4, 2.6, m.messing); rohr(.255, .255, 2.6, 3.0, m.holz); for (const s of [-.2, .4, 1.5, 2.6]) rohr(.215 + s * .012, .215 + s * .012, s - .04, s + .04, m.holz, 20);
    rohr(.05, .05, -1.45, -1.2, m.eisen, 10); rohr(.07, .05, -1.55, -1.45, m.eisen, 10);
    { const o = V(.24, 0, 0).applyQuaternion(q); const g = new T3.CylinderGeometry(.05, .05, 1.0, 10); g.applyMatrix4(new T3.Matrix4().compose(V(...at(1.2)).add(o), q, V(1, 1, 1))); S.put(m.messing, g); }
    S.put(m.eisen, new T3.CircleGeometry(.24, 20), new T3.Matrix4().compose(V(...at(2.99)), new T3.Quaternion().setFromUnitVectors(V(0, 0, 1), d), V(1, 1, 1)));
    ctx.obstacleBox(6.75, -9.95, 2.1, 1.9); RH.belege(ctx, {x0: 4.6, x1: B.x1, y0: 0, y1: 5.2, z0: B.z1, z1: -8.95}); }
  // Sternkarte (Planisphäre) an der Stirnwand links, Rahmen aus Holz und Messing
  { const x = -6.15, y = 3.95, z = B.z1 + .04, s = 2.5; S.put(m.karte, new T3.PlaneGeometry(s, s), M(x, y, z));
    for (const [w, h, xx, yy] of [[s + .2, .1, 0, s / 2 + .05], [s + .2, .1, 0, -s / 2 - .05], [.1, s, -s / 2 - .05, 0], [.1, s, s / 2 + .05, 0]]) S.box(m.holz, w, h, .06, x + xx, y + yy, z);
    S.put(m.messing, new T3.TorusGeometry(s * .47, .02, 6, 48), M(x, y, z + .03)); RH.belege(ctx, {x0: x - 1.4, x1: x + 1.4, y0: y - 1.4, y1: y + 1.4, z0: B.z1, z1: B.z1 + .2}); }
  // Fenster mit Nachthimmel an der Rückwand
  for (const sx of [-1, 1]) { const x = sx * 5.2, z = B.z0 - .02, f = RH.uvAufUmriss(new T3.ShapeGeometry(RH.bogenForm(1.5, 3.4, 0), 12)); S.put(m.nacht, f, M(x, 2.6, z, 0, PI));
    const ring = RH.bogenForm(1.8, 3.55, 0); ring.holes.push(RH.bogenForm(1.5, 3.4, 0)); const rr = new T3.ExtrudeGeometry(ring, {depth: .2, bevelEnabled: false, curveSegments: 12}); rr.translate(0, -.1, -.1); S.put(m.stein, rr, M(x, 2.6, z, 0, PI)); }
  // Öllampen an den Pfeilerstellen (zwei sind die Punktlichter der Hülle)
  const lampen = [];
  for (const sx of [-1, 1]) for (const z of [9, 4.5, 0, -4.5, -9]) S.put(m.wandD, RH.kasten(.16, 7.1, .62, 3.6), M(sx * 7.92, 3.55, z));   // flache Wandpfeiler
  for (const sx of [-1, 1]) for (const z of [9, 4.5, 0, -4.5, -9]) { const x = sx * 7.84, d = -sx, y = 2.35;
    S.box(m.messing, .04, .26, .14, x, y - .1, z).rod(m.messing, [x, y, z], [x + d * .32, y + .1, z], .015, 5).cyl(m.messing, .07, .05, .06, 10, x + d * .38, y + .08, z).put(m.glas, new T3.SphereGeometry(.08, 12, 8), M(x + d * .38, y + .2, z, 0, 0, 0, 1, 1.3, 1));
    fl.push(V(x + d * .38, y + .2, z)); lampen.push([x + d * .38, y, z, d]);
    if ((sx < 0 && z === 4.5) || (sx > 0 && z === -4.5)) RH.punktlicht(ctx, 0xffc27a, 7, x + d * .7, y + .5, z, {weite: 11, flackern: .5}); }
  S.build(ctx.group);
  RH.flammen(ctx, fl, 0xffb860, .42);
  RH.huelle(ctx, {saeuleX: [B.x0 + .08, B.x1 - .08], fackeln: lampen.map(([x, y, z, d]) => [x - d * .38, y - .1, z, d]), fenster: [[-5.2, B.z0 - .02], [5.2, B.z0 - .02]]});
  return H;
}
RH.raum.optik2 = {
  licht: {hintergrund: 0x0c1640, nebel: [0x080b18, .017], himmel: [0xb0bcf0, 0x3e3a50, 1.1], umgebung: [0xc6d0ff, .26], sonne: [0xccd8ff, 1.4, [2, 14, -14]]},
  shell: sternShell,
  ambient: {kerzen: 16, staub: 220, staubFarbe: 0xc6d4ff, steigen: .02},
  dekor: {deck: ["kommode:linsen", "fernrohr", "armillar", "globus", "regal", "kommode", "leuchter", "regal"], tief: ["truhe", "bank", "anrichte"],
    ohne: ["Kronleuchter"], bilder: ["sterne", "thema", "zauberer", "hexe", "schiff", "still", "berge", "burg"], buecher: 5}
};
})();
