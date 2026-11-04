/* ---------- 17_raum_zauber_beweg.js ---------- */
/* =====================================================================
   Raumthemen der Zauberschule · Bewegung (Werkzeug und Felder: 17_raum_zauber.js)
   beweg1 „Besenflugplatz“: Übungsflugplatz der Schule draußen bei Tag – Rasen mit Mähstreifen, Himmel mit Haufenwolken, Hügel, Wald und ferne Burg,
     Tribünen in den Schulfarben Nachtblau und Gold (Tücher mit dem Flugschulzeichen Besen und Stern, Galerie mit Wimpelband, Zeltdächer mit Fahnen)
     als Seitenbegrenzung, Torhäuser mit Zeltdächern um die Türen; im Gang die Messstrecke (Start z = 9 → Ziel z = −9, Marken alle 2 m) mit
     Landekreis, darüber Start- und Zielbrücke mit Bannern; Flugparcours aus sechs einzelnen schwebenden Ringtoren und zwei Wendemarken,
     den drei Besenflieger abfliegen; Windsack am Mast. Bewusst kein Spielfeld, keine Torringe nebeneinander und keine Hausfarben (RAUMTHEMEN.md).
     Ausstattung: Zeitnehmertisch, Besenregale, Wendekegel, Heuballen, Tonnen statt Regalen
   beweg2 „Kammer der Bewegungsformel“: geheime Kammer aus dunklem Quaderstein mit leuchtenden Runenbändern, Zauberkreis mit der Formel
     F · Δt = m · Δv im Boden (Runenkreis mit Siebenstern als Gegenstück an der Decke), großes Zifferblatt (Δt) und Uhrwerk aus Messingzahnrädern an den Stirnwänden, Runenmedaillon a = Δv : Δt,
     schwebende Leuchtkugeln auf Kreisbahnen, violette Fackeln, violett-blaues Licht
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.kits || !R3D.kits.zauber || !R3D.kits.zauber.raumHilfe) return;
const KIT = R3D.kits.zauber, RH = KIT.raumHilfe, PI = Math.PI, M = RH.M, H = RH.H, V = (x, y, z) => new T3.Vector3(x, y, z);
const BODY = KIT.fontBody || "Palatino, Georgia, serif";

/* =====================================================================
   beweg1 · Besenflugplatz
   ===================================================================== */
const SCHULE = {blau: "#1d3461", blauH: "#2a4878", gold: "#d9a830", creme: "#efe6d2"};   // Schulfarben: Nachtblau und Gold (eine Farbfamilie)
// Ausschnitt (x0, y0) … (x1, y1) einer W × H-Canvas-Textur auf die 0..1-UV einer Fläche legen
const ausschnitt = (g, x0, y0, x1, y1, W, Hc) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * (x1 - x0)) / W, 1 - (y1 - uv.getY(i) * (y1 - y0)) / Hc); return g; };
// Zeichen der Flugschule: Ring, fliegender Besen (Reisig hinten) und Stern – ein Farbton, kein Wappenschild
function flugzeichen(g, x, y, r, farbe){
  const stern = (cx, cy, q) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? q * .42 : q; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); };
  g.save(); g.translate(x, y); g.strokeStyle = g.fillStyle = farbe; g.lineCap = g.lineJoin = "round";
  g.lineWidth = r * .08; g.beginPath(); g.arc(0, 0, r * .95, 0, 2 * PI); g.stroke();
  stern(r * .3, -r * .44, r * .22);
  g.translate(-r * .06, r * .2); g.rotate(-.42); g.lineWidth = r * .09; g.beginPath(); g.moveTo(-r * .3, 0); g.lineTo(r * .64, 0); g.stroke();
  g.beginPath(); g.moveTo(-r * .26, -r * .06); g.lineTo(-r * .6, -r * .15); g.lineTo(-r * .6, r * .15); g.lineTo(-r * .26, r * .06); g.closePath(); g.fill();
  g.lineWidth = r * .045; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(-r * .4, k * r * .03); g.lineTo(-r * .84, k * r * .095); g.stroke(); }   // Reisig als Fächer
  g.lineWidth = r * .1; g.lineCap = "butt"; g.beginPath(); g.moveTo(-r * .28, -r * .1); g.lineTo(-r * .28, r * .1); g.stroke();   // Bindung
  g.restore();
}
function gras(g, w, h, r, streifen){
  if (streifen) for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? "#4c7436" : "#587f40"; g.fillRect(0, j * h / 4, w, h / 4); }   // Mähstreifen quer zum Gang (2 m, Grenzen bei den Marken der Messstrecke)
  else { g.fillStyle = "#53773a"; g.fillRect(0, 0, w, h); }
  for (let i = 0; i < 22000; i++) { const x = r() * w, y = r() * h, l = 3 + r() * 7; g.strokeStyle = `hsla(${78 + r() * 32},${20 + r() * 20}%,${19 + r() * 22}%,${.3 + r() * .4})`;
    g.lineWidth = 1 + r() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 4, y - l); g.stroke(); }
  for (let i = 0; i < 240; i++) { g.fillStyle = r() < .5 ? "rgba(255,255,240,.75)" : "rgba(255,224,90,.75)"; g.beginPath(); g.arc(r() * w, r() * h, 1.2 + r() * 1.3, 0, 7); g.fill(); }
}
const platzTex = {
  rasen: () => RH.tex("bf-rasen", 1024, 1024, (g, w, h) => gras(g, w, h, RH.seeded(501), true)),
  wiese: () => RH.tex("bf-wiese", 1024, 1024, (g, w, h) => gras(g, w, h, RH.seeded(505), false)),
  himmel: () => RH.tex("bf-himmel", 1024, 512, (g, w, h) => { const r = RH.seeded(502);
    g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#2a62b6"], [.25, "#4c8cd6"], [.42, "#90c0ea"], [.5, "#d4e6f0"], [.53, "#bed4c0"], [1, "#6a8a4a"]]); g.fillRect(0, 0, w, h);
    const su = .648 * w, sv = .2 * h; g.fillStyle = RH.rad(g, su, sv, 0, 120, [[0, "rgba(255,253,236,1)"], [.08, "rgba(255,248,222,.95)"], [.3, "rgba(255,240,200,.32)"], [1, "rgba(255,240,200,0)"]]); g.fillRect(su - 120, sv - 120, 240, 240);
    for (let i = 0; i < 30; i++) { const x = r() * w, y = h * (.15 + r() * .29), q = 12 + r() * 24, n = 5 + (r() * 5 | 0);   // Haufenwolken: grauer Boden, weiße Ballen darüber
      g.fillStyle = RH.rad(g, x, y + q * .3, 0, q * 2.2, [[0, "rgba(140,158,186,.28)"], [1, "rgba(140,158,186,0)"]]); g.fillRect(x - q * 2.2, y - q * 2, q * 4.4, q * 4.4);
      for (let k = 0; k < n; k++) { const dx = (k - n / 2) * q * .7 + (r() - .5) * q * .5, dy = -Math.sin(k / (n - 1) * PI) * q * .6 + (r() - .5) * q * .3 - q * .2, rr = q * (.6 + r() * .5);
        g.fillStyle = RH.rad(g, x + dx, y + dy, 0, rr, [[0, "rgba(255,255,255,.95)"], [.6, "rgba(248,251,255,.7)"], [1, "rgba(255,255,255,0)"]]); g.fillRect(x + dx - rr, y + dy - rr, 2 * rr, 2 * rr); } } }),
  // Landschaftsband (zweimal ringsum): ferne Berge mit Schnee, dunstige Hügel, Waldsaum, Wiese
  huegel: () => RH.tex("bf-huegel", 1024, 256, (g, w, h) => { const r = RH.seeded(503); g.clearRect(0, 0, w, h);
    const kamm = (base, amps, col) => { const p = new Path2D(); p.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) { let y = base; amps.forEach(([a, f, ph]) => { y -= a * Math.sin(2 * PI * f * x / w + ph); }); p.lineTo(x, y); }
      p.lineTo(w, h); p.closePath(); g.fillStyle = col; g.fill(p); return p; };
    const berg = kamm(h * .5, [[30, 3, .5], [20, 7, 1.2], [9, 13, 2]], "#93a9c6");
    g.save(); g.clip(berg); g.fillStyle = RH.lin(g, 0, h * .2, 0, h * .4, [[0, "rgba(246,250,255,.95)"], [1, "rgba(246,250,255,0)"]]); g.fillRect(0, 0, w, h * .4); g.restore();
    kamm(h * .66, [[16, 2, 2.1], [11, 5, .3], [5, 11, 1]], "#86a68e"); kamm(h * .74, [[9, 3, 1.4], [5, 8, .2]], "#6e9472");
    for (let x = 0; x < w; x += 5) { const y = h * .8 - 6 * Math.sin(2 * PI * 4 * x / w + .7) - 3 * Math.sin(2 * PI * 9 * x / w); const q = 4 + r() * 6;
      g.fillStyle = `hsl(${105 + r() * 25},${28 + r() * 15}%,${18 + r() * 9}%)`; g.beginPath(); g.ellipse(x, y - q * .6, q * .8, q * 1.4, 0, 0, 7); g.fill(); g.fillRect(x - q * .8, y - q * .6, q * 1.6, h * .1); }
    g.fillStyle = RH.lin(g, 0, h * .84, 0, h, [[0, "#6e9450"], [1, "#5e8a40"]]); g.fillRect(0, h * .84, w, h * .16); }),
  burg: () => RH.tex("bf-burg", 512, 512, (g, w, h) => RH.burgMaler(g, w, h, {stein: "#a3acbe", dach: "#5b6b90", huegel: "#7c9c7a", dunst: "rgba(176,204,228,.35)", basis: .7, seed: 11, fahne: SCHULE.blau}), false),
  // Atlas in vier Spalten: Tribünentuch nachtblau und etwas heller (Goldborten, unten das Flugschulzeichen), Fahne blau mit goldenem Stern, Fahne cremeweiß mit blauem Stern
  tuch: () => RH.tex("bf-tuch", 1024, 512, (g, w, h) => { const cw = w / 4;
    const stern = (cx, cy, q, c) => { g.save(); g.translate(cx, cy); g.scale(.3, 1); g.fillStyle = c; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? q * .42 : q; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); };
    [SCHULE.blau, SCHULE.blauH, SCHULE.blau, SCHULE.creme].forEach((c, k) => { const x0 = k * cw; g.fillStyle = c; g.fillRect(x0, 0, cw, h);
      if (k >= 2) { const s = k === 2 ? SCHULE.gold : SCHULE.blau; g.fillStyle = s; g.fillRect(x0, 0, cw * .1, h); stern(x0 + cw * .55, h / 2, h * .3, s); return; }   // Fahnen (Stern rund trotz gestreckter Spalte)
      for (let x = 0; x < cw; x += 2) { const f = Math.sin(x / cw * PI * 10) * .5 + .5; g.fillStyle = `rgba(0,0,0,${.04 + .22 * f})`; g.fillRect(x0 + x, 0, 2, h); g.fillStyle = `rgba(255,255,255,${.07 * (1 - f)})`; g.fillRect(x0 + x, 0, 2, h); }   // Falten
      g.fillStyle = SCHULE.gold; g.fillRect(x0, 10, cw, 10); g.fillRect(x0, 26, cw, 3); g.fillRect(x0, h - 30, cw, 10); g.fillRect(x0, h - 14, cw, 3);
      g.save(); g.translate(x0 + cw / 2, h * .82); g.scale(.55, 1); flugzeichen(g, 0, 0, 44, SCHULE.gold); g.restore(); }); }, false),
  dach: () => RH.tex("bf-dach", 512, 256, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? SCHULE.creme : SCHULE.blau; g.fillRect(i * w / 16, 0, w / 16 + 1, h); }
    g.fillStyle = "rgba(0,0,0,.14)"; g.fillRect(0, h * .9, w, h * .1); g.fillStyle = SCHULE.gold; g.fillRect(0, h * .93, w, h * .03); }, false),
  band: () => RH.tex("bf-band", 512, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#3a2a1c"; g.fillRect(0, 0, w, 6); const n = 8, cols = [SCHULE.blau, SCHULE.gold, SCHULE.blau, SCHULE.creme];
    for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(i * w / n + 3, 5); g.lineTo((i + 1) * w / n - 3, 5); g.lineTo((i + .5) * w / n, h - 2); g.fill(); } }),
  sack: () => RH.tex("bf-sack", 64, 256, (g, w, h) => { for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#f4efe6" : "#e8661c"; g.fillRect(0, i * h / 5, w, h / 5 + 1); } }, false),
  // Ringtore blau-weiß umwickelt (Wiederholung über die UV), Wendemarken mit Querbändern
  ring: () => RH.tex("bf-ring", 64, 8, (g, w, h) => { g.fillStyle = SCHULE.blau; g.fillRect(0, 0, w / 2, h); g.fillStyle = SCHULE.creme; g.fillRect(w / 2, 0, w / 2, h); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(w / 2 - 2, 0, 2, h); g.fillRect(w - 2, 0, 2, h); }),
  pylon: () => RH.tex("bf-pylon", 16, 256, (g, w, h) => { for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? SCHULE.creme : SCHULE.blau; g.fillRect(0, i * h / 7, w, h / 7 + 1); } }, false),
  // Kreide auf dem Rasen (weiß auf durchsichtig): Meterzahlen 0 … 18 m (Zellen 256 × 128), „Landeplatz“, „Messstrecke“, Schachbrettband, Flugschulzeichen
  marke: () => RH.tex("bf-marke", 1024, 1024, (g, w, h) => { const r = RH.seeded(507); g.clearRect(0, 0, w, h); g.fillStyle = g.strokeStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `700 92px ${BODY}`; for (let k = 0; k < 10; k++) g.fillText(`${2 * k} m`, (k & 3) * 256 + 128, (k >> 2) * 128 + 68);
    g.font = `700 112px ${BODY}`; g.fillText("Landeplatz", w / 2, 452); g.fillText("Messstrecke", w / 2, 580);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) g.fillRect(i * 64, 640 + j * 64, 64, 64);
    flugzeichen(g, 128, 896, 116, "#fff");
    g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 8000; i++) { g.fillStyle = `rgba(0,0,0,${.15 + r() * .4})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }   // Kreide: rauer Strich
    g.globalCompositeOperation = "source-over"; }, false),
  // Banner der Brücken (Zeilen 1024 × 256): „Ziel“, „Start“, Rückseite „Messstrecke · 18 m“
  banner: () => RH.tex("bf-banner", 1024, 768, (g, w, h) => { const r = RH.seeded(508);
    const zeile = (k, wort, unter) => { const y0 = k * 256; g.fillStyle = SCHULE.blau; g.fillRect(0, y0, w, 256);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < .5 ? "0,0,0" : "255,255,255"},${.03 + r() * .04})`; g.fillRect(r() * w, y0 + r() * 256, 2, 2); }
      g.fillStyle = SCHULE.gold; g.fillRect(0, y0 + 10, w, 9); g.fillRect(0, y0 + 237, w, 9);
      for (const x0 of [26, w - 26 - 96]) for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) { g.fillStyle = (i + j) % 2 ? "#f4efe2" : "#14161c"; g.fillRect(x0 + i * 24, y0 + 30 + j * 28, 24, 28); }   // Schachbrett-Enden
      for (const x of [215, w - 215]) flugzeichen(g, x, y0 + 128, 62, SCHULE.gold);
      g.textAlign = "center"; g.textBaseline = "middle";
      if (unter) { g.fillStyle = SCHULE.creme; g.font = `700 140px ${BODY}`; g.fillText(wort, w / 2, y0 + 102); g.fillStyle = SCHULE.gold; g.font = `600 44px ${BODY}`; g.fillText(unter, w / 2, y0 + 200); }
      else { g.fillStyle = SCHULE.creme; g.font = `700 66px ${BODY}`; g.fillText(wort, w / 2, y0 + 132); } };
    zeile(0, "Ziel", "Messstrecke · 18 m"); zeile(1, "Start", "Messstrecke · 18 m"); zeile(2, "Flugplatz der Schule"); }, false),
  // Torschilder 1 … 6 und das Flugschulzeichen über den Toren (Zellen 128 × 128)
  nummer: () => RH.tex("bf-nummer", 1024, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.textAlign = "center"; g.textBaseline = "middle";
    for (let k = 0; k < 7; k++) { const cx = k * 128 + 64; g.fillStyle = SCHULE.blau; g.beginPath(); g.arc(cx, 64, 63, 0, 7); g.fill(); g.strokeStyle = SCHULE.gold; g.lineWidth = 6; g.beginPath(); g.arc(cx, 64, 56, 0, 7); g.stroke();
      if (k < 6) { g.fillStyle = SCHULE.creme; g.font = `700 78px ${BODY}`; g.fillText(String(k + 1), cx, 69); } else flugzeichen(g, cx, 64, 44, SCHULE.gold); } }, false)
};
function platzMat(){ return {
  rasen: RH.mat("b1-rasen", () => RH.std({map: platzTex.rasen(), roughness: .95})),
  wiese: RH.mat("b1-wiese", () => RH.std({map: platzTex.wiese(), roughness: 1})),
  kreide: RH.mat("b1-kreide", () => RH.std({color: 0xf2f2ea, roughness: .9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})),
  marke: RH.mat("b1-marke", () => RH.std({map: platzTex.marke(), color: 0xf2f2ea, alphaTest: .45, roughness: .95, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3})),
  stein: RH.mat("b1-stein", () => RH.std({map: KIT.tex.stone(), color: 0xf2eadf, roughness: .9})),
  dunkel: RH.mat("b1-dunkel", () => RH.std({color: 0x17130f, roughness: 1})),
  tuch: RH.mat("b1-tuch", () => RH.std({map: platzTex.tuch(), roughness: .95, side: T3.DoubleSide})),
  dach: RH.mat("b1-dach", () => RH.std({map: platzTex.dach(), roughness: .9, side: T3.DoubleSide})),
  schiefer: RH.mat("b1-schiefer", () => RH.std({color: 0x4f5d7c, roughness: .75})),
  band: RH.mat("b1-band", () => RH.std({map: platzTex.band(), alphaTest: .5, roughness: .9, side: T3.DoubleSide})),
  sack: RH.mat("b1-sack", () => RH.std({map: platzTex.sack(), roughness: .9, side: T3.DoubleSide})),
  ring: RH.mat("b1-ring", () => RH.std({map: platzTex.ring(), roughness: .7})),
  pylon: RH.mat("b1-pylon", () => RH.std({map: platzTex.pylon(), roughness: .8})),
  banner: RH.mat("b1-banner", () => RH.std({map: platzTex.banner(), roughness: .95})),
  nummer: RH.mat("b1-nummer", () => RH.std({map: platzTex.nummer(), alphaTest: .5, roughness: .7})),
  weiss: RH.mat("b1-weiss", () => RH.std({color: 0xeee6d4, roughness: .7})),
  seil: RH.mat("b1-seil", () => RH.std({color: 0xd8ccb0, roughness: 1})),
  reiter: RH.mat("b1-reiter", () => RH.std({color: 0x1c2440, roughness: .9})),
  holz: KIT.mat("wood"), holzD: KIT.mat("darkwood"), gold: KIT.mat("gold"), eisen: KIT.mat("metal"), glas: KIT.mat("glass"), lampe: RH.mat("b1-lampe", () => RH.basic({color: 0xffe6b0}))
}; }
// Besen mit Reiterin (Umhang, Spitzhut), Flugrichtung +x: Holz/Reisig und Stoff als zwei Geometrien (je ein InstancedMesh)
function besenflieger(){
  const h = [], s = [], put = (L, g, mx) => { g.applyMatrix4(mx); L.push(g); };
  put(h, new T3.CylinderGeometry(.025, .03, 1.7, 6), M(0, 0, 0, 0, 0, PI / 2)); put(h, new T3.ConeGeometry(.17, .6, 8), M(-1.05, 0, 0, 0, 0, -PI / 2));
  put(s, new T3.ConeGeometry(.24, .78, 8), M(-.1, .37, 0)); put(s, new T3.SphereGeometry(.12, 8, 6), M(-.05, .84, 0));
  put(s, new T3.ConeGeometry(.15, .44, 8), M(-.1, 1.12, 0, 0, 0, .35)); put(s, new T3.CylinderGeometry(.3, .3, .02, 12), M(-.06, .92, 0));
  put(s, new T3.PlaneGeometry(.7, .5), M(-.45, .45, 0, 0, 0, -.5));   // flatternder Umhang
  return [RH.merge(h), RH.merge(s)];
}
// Flugparcours (geschlossene Kurve, gegen den Uhrzeigersinn von oben): links über dem Platz nach hinten, um die hintere Wendemarke, rechts hoch
// zurück, um die vordere Wendemarke; [x, y, z, Tornummer]. Über dem Platz bleibt die Bahn über 7,6 m (Brücken, Papierflieger 5,95–7 m, Tribünendächer)
const KURS = [[-4.7, 8.9, 3.0, 1], [-4.9, 10.4, -8.5, 2], [-7.6, 9.2, -17.5, 3], [-17.0, 8.0, -25.5], [-14.6, 8.2, -30.8], [-5.5, 10.6, -30.5],
  [9.0, 13.5, -23.0, 4], [7.0, 12.8, -12.0], [4.4, 12.2, -2.0, 5], [5.2, 11.4, 8.0], [6.0, 11.0, 14.5], [10.8, 8.6, 24.5], [8.2, 8.4, 28.8], [.5, 9.5, 27.5],
  [-7.5, 10.2, 19.0, 6], [-5.6, 10.0, 11.0]];
const WENDE = [[-14.5, -27.5], [8.5, 25.5]], WINDMAST = [6.8, 7.6, -14.0];   // Wendemarken (x, z); Windsackmast rechts hinter dem Torhaus (x, Höhe, z)
// Bodenmarken aus Kreide: Messstrecke im Gang (Seitenlinien x = ±1,6, Marken und Meterzahlen alle 2 m von Start z = 9 bis Ziel z = −9),
// Start- und Ziellinie als Schachbrettband, Landekreis mit Flugschulzeichen davor
function bodenMarken(S, m){
  const y = .008, kr = m.kreide, X = 1.6, lw = .08, Z0 = 9, zelle = (k) => [(k & 3) * 256, (k >> 2) * 128, (k & 3) * 256 + 256, (k >> 2) * 128 + 128, 1024, 1024];
  for (const sx of [-1, 1]) S.put(kr, new T3.PlaneGeometry(lw, 2 * Z0), M(sx * X, y, 0, -PI / 2));
  for (let k = 0; k <= 9; k++) { const z = Z0 - 2 * k;
    for (const sx of [-1, 1]) S.put(kr, new T3.PlaneGeometry(.5, lw), M(sx * (X + .25), y, z, -PI / 2)).put(m.marke, ausschnitt(new T3.PlaneGeometry(.74, .37), ...zelle(k)), M(sx * 2.55, y, z, -PI / 2)); }
  for (const z of [Z0, -Z0]) S.put(m.marke, ausschnitt(new T3.PlaneGeometry(3.2 - lw, .4), 0, 640, 1024, 768, 1024, 1024), M(0, y + .001, z, -PI / 2));
  S.put(m.marke, ausschnitt(new T3.PlaneGeometry(2.9, .36), 0, 512, 1024, 640, 1024, 1024), M(0, y, 7.55, -PI / 2));   // „Messstrecke“ hinter der Startlinie
  const cz = 3.9; S.put(kr, new T3.RingGeometry(1.3, 1.4, 72), M(0, y, cz, -PI / 2));
  for (let k = 0; k < 8; k++) { const a = k * PI / 4 + PI / 8; S.put(kr, new T3.PlaneGeometry(.06, .2), M(Math.sin(a) * 1.13, y, cz + Math.cos(a) * 1.13, -PI / 2, 0, a)); }
  S.put(m.marke, ausschnitt(new T3.PlaneGeometry(1.7, 1.7), 0, 768, 256, 1024, 1024, 1024), M(0, y, cz, -PI / 2));
  S.put(m.marke, ausschnitt(new T3.PlaneGeometry(2.9, .36), 0, 384, 1024, 512, 1024, 1024), M(0, y, cz + 1.85, -PI / 2));   // „Landeplatz“
}
function platzShell(ctx){
  const B = ctx.bounds, m = platzMat(), S = RH.sammler(), fl = [], lic = [], leuchten = [];
  RH.boden(ctx, m.rasen, {uS: 8, vS: 8});
  RH.weite(ctx, m.wiese, {uS: 7});
  const himmel = RH.himmel(ctx, platzTex.himmel(), 60);
  RH.kulisse(ctx, platzTex.huegel(), {r: 50, y0: -1.5, y1: 11, wdh: 2});
  RH.karte(ctx, platzTex.burg(), -18, 4.5, -46, 16, 16);
  bodenMarken(S, m);
  // Tribünen an den Seiten: Pfosten (Struktur bei z = ±9, ±4,5, 0), Bande, Tücher in Schulblau (Tafelfelder), Galerie mit Wimpelband und Geländer, Zeltdächer mit Fahnen
  const bays = [[-10.9, -9], [-9, -4.5], [-4.5, 0], [0, 4.5], [4.5, 9], [9, 10.9]];
  for (const sx of [-1, 1]) { const ry = sx < 0 ? PI / 2 : -PI / 2;
    for (const z of [-10.9, -9, -4.5, 0, 4.5, 9, 10.9]) S.put(m.holzD, RH.kasten(.3, 7.45, .3, 2.4), M(sx * 7.85, 3.725, z));
    S.put(m.holzD, RH.kasten(.1, 1.2, 21.8, 2.4), M(sx * 7.95, .6, 0)).put(m.holzD, RH.kasten(.18, .07, 21.8, 2.4), M(sx * 7.9, 1.23, 0));
    bays.forEach(([a, b], i) => { const k = i % 2, L = b - a - .3, zc = (a + b) / 2;
      S.put(m.tuch, RH.spalte(new T3.PlaneGeometry(L, 4.35), k, 4), M(sx * 7.985, 1.25 + 2.175, zc, 0, ry));
      const rise = 2.2, cg = new T3.ConeGeometry(Math.SQRT2, rise, 4, 1, true); cg.rotateY(PI / 4);
      S.put(m.dach, cg, M(sx * 8.9, 7.45 + rise / 2, zc, 0, 0, 0, 1.75, 1, (b - a) / 2 + .05));
      const top = [sx * 8.9, 7.45 + rise, zc]; S.rod(m.eisen, top, [top[0], top[1] + 1.3, zc], .025, 5);
      S.put(m.tuch, RH.spalte(new T3.PlaneGeometry(.8, .48), 2 + k, 4), M(top[0], top[1] + 1.05, zc + .42, 0, ry)); });
    S.put(m.holzD, RH.kasten(.72, .14, 21.8, 2.4), M(sx * 7.64, 5.67, 0));   // Boden der Galerie
    S.put(m.band, RH.uvMal(new T3.PlaneGeometry(21.8, .36), 21.8 / 1.4, 1), M(sx * 7.275, 5.6, 0, 0, ry)).put(m.band, RH.uvMal(new T3.PlaneGeometry(21.8, .3), 21.8 / 1.4, 1), M(sx * 7.22, 7.32, 0, 0, ry));
    S.rod(m.holz, [sx * 7.34, 6.55, -10.9], [sx * 7.34, 6.55, 10.9], .035, 6).rod(m.holz, [sx * 7.34, 6.1, -10.9], [sx * 7.34, 6.1, 10.9], .02, 5);
    for (let z = -10.6; z <= 10.61; z += .6) S.cyl(m.holz, .022, .022, .8, 5, sx * 7.34, 6.15, z);
    S.put(m.holzD, new T3.PlaneGeometry(21.8, 1.75), M(sx * 8.7, 5.74 + .875, 0, 0, ry));   // Rückwand der Galerie
    S.put(m.holzD, RH.kasten(1.5, .1, 21.8, 2.4), M(sx * 8.05, 7.42, 0));   // Traufbalken unter den Dächern
    RH.belege(ctx, {x0: sx < 0 ? B.x0 : 7.2, x1: sx < 0 ? -7.2 : B.x1, y0: 5.45, y1: H, z0: B.z1, z1: B.z0}); }
  // Laternen unter der Galerie (zwei davon sind die Punktlichter der Hülle)
  const laternen = [];
  for (const sx of [-1, 1]) for (const z of [4.5, -4.5]) { const x = sx * 7.32, y = 5.0;
    S.rod(m.eisen, [sx * 7.72, 5.42, z], [x, 5.42, z], .018, 5).cyl(m.eisen, .012, .012, .14, 4, x, 5.34, z);
    S.cyl(m.eisen, .13, .1, .05, 4, x, y + .17, z, 0, PI / 4).cyl(m.eisen, .1, .12, .04, 4, x, y - .15, z, 0, PI / 4).put(m.glas, new T3.BoxGeometry(.16, .26, .16), M(x, y, z)).put(m.lampe, new T3.SphereGeometry(.045, 8, 6), M(x, y, z));
    fl.push(V(x, y, z)); laternen.push([x, y, z, -sx]);
    if ((sx < 0 && z === 4.5) || (sx > 0 && z === -4.5)) lic.push(RH.punktlicht(ctx, 0xffe2b8, 4.5, x - sx * .35, y - .25, z, {weite: 11, flackern: .1})); }
  // Stirnseiten: Torhaus um die Tür (Zeltdächer, Schulfahnen, Flugschulzeichen über dem Tor), weiße Bande bis zur Tribüne
  for (const sz of [-1, 1]) { const E = sz * 11;
    const spitzen = RH.torhaus(ctx, S, {stein: m.stein, dunkel: m.dunkel}, sz, {h: 7.4, turm: 9, dach: m.schiefer, dachH: 2.6});
    spitzen.forEach(([x, y, z], i) => { S.rod(m.eisen, [x, y - .1, z], [x, y + 1.4, z], .03, 5).put(m.tuch, RH.spalte(new T3.PlaneGeometry(.9, .55), 2 + (i + (sz > 0 ? 1 : 0)) % 2, 4), M(x, y + 1.1, z + .47, 0, PI / 2)); });
    { const zz = E - sz * .03, ry = sz < 0 ? 0 : PI; S.put(m.nummer, ausschnitt(new T3.CircleGeometry(.46, 32), 768, 0, 896, 128, 1024, 128), M(0, 6.72, zz, 0, ry)).put(m.gold, new T3.TorusGeometry(.47, .035, 6, 40), M(0, 6.72, zz + sz * .01, 0, ry)); }
    for (const sx of [-1, 1]) { const xa = sx * 4.25, xb = sx * 8, xm = (xa + xb) / 2, L = 3.75;
      S.put(m.holz, RH.kasten(L, 1.15, .08, 2.4), M(xm, .62, E - sz * .04)).put(m.weiss, RH.kasten(L, .09, .16, 2.4), M(xm, 1.25, E - sz * .06));
      for (const x of [xa + sx * .06, xm, xb - sx * .16]) S.box(m.holzD, .12, 1.36, .12, x, .68, E - sz * .1); } }
  // Start- und Zielbrücke (z = ±9): Balken in Raumhöhe von Tribüne zu Tribüne – das Feste über dem Gang –, Banner zur Platzmitte („Ziel“ hinten,
  // vom Eingang aus lesbar, „Start“ vorn), Rückseite „Flugplatz der Schule“, Wimpel zu beiden Seiten; frei bis 5,8 m (Sicht vom Gang auf die Türschilder)
  for (const sz of [-1, 1]) { const z = sz * 9, ry = sz < 0 ? 0 : PI, bw = 5.4, bh = 1.3, yb = H - .3 - bh / 2, zl = sz < 0 ? 0 : 256;
    S.put(m.holzD, RH.kasten(15.6, .3, .3, 2.4), M(0, H - .15, z));
    S.put(m.banner, ausschnitt(new T3.PlaneGeometry(bw, bh), 0, zl, 1024, zl + 256, 1024, 768), M(0, yb, z - sz * .025, 0, ry))
     .put(m.banner, ausschnitt(new T3.PlaneGeometry(bw, bh), 0, 512, 1024, 768, 1024, 768), M(0, yb, z + sz * .025, 0, ry + PI));
    S.rod(m.gold, [-bw / 2 - .12, yb + bh / 2, z], [bw / 2 + .12, yb + bh / 2, z], .032, 6).rod(m.gold, [-bw / 2 - .06, yb - bh / 2, z], [bw / 2 + .06, yb - bh / 2, z], .026, 6);
    for (const sx of [-1, 1]) RH.wimpel(ctx, [sx * 2.55, H - .3, z], [sx * 7.6, H - .3, z], {sag: 0, lang: .36, farben: [SCHULE.blau, SCHULE.gold, SCHULE.creme]});
    RH.belege(ctx, {x0: B.x0, x1: B.x1, y0: yb - bh / 2 - .1, y1: H, z0: z - .35, z1: z + .35}); }
  // Flugparcours: schwebende Ringtore (blau-weiß umwickelt, Laterne oben, Torschild unten), quer zur Flugbahn ausgerichtet; Wendemarken draußen
  const kurve = new T3.CatmullRomCurve3(KURS.map(([x, y, z]) => V(x, y, z)), true, "centripetal"); kurve.arcLengthDivisions = 800; kurve.updateArcLengths();
  { const tg = V(), R = 1.3;
    KURS.forEach(([x, y, z, nr], i) => { if (!nr) return; kurve.getTangent(i / KURS.length, tg);
      const T = M(x, y, z, -Math.asin(Math.max(-1, Math.min(1, tg.y))), Math.atan2(tg.x, tg.z)), at = (...a) => T.clone().multiply(M(...a));
      S.put(m.ring, RH.uvMal(new T3.TorusGeometry(R, .08, 8, 56), 14, 1), T).put(m.gold, new T3.SphereGeometry(.1, 10, 8), at(0, R + .1, 0)).put(m.gold, new T3.CylinderGeometry(.06, .1, .12, 8), at(0, R + .02, 0));
      S.put(m.eisen, new T3.CylinderGeometry(.014, .014, .26, 5), at(0, -R - .2, 0)).put(m.gold, new T3.TorusGeometry(.28, .025, 5, 28), at(0, -R - .6, 0));
      for (const s of [0, PI]) S.put(m.nummer, ausschnitt(new T3.CircleGeometry(.27, 24), (nr - 1) * 128, 0, nr * 128, 128, 1024, 128), at(0, -R - .6, s ? -.012 : .012, 0, s));
      leuchten.push(V(0, R + .24, 0).applyMatrix4(T)); }); }
  for (const [x, z] of WENDE) { const h = 9.5;
    S.cyl(m.stein, .95, 1.1, .4, 12, x, .2, z).put(m.pylon, new T3.CylinderGeometry(.16, .7, h, 16, 1), M(x, .4 + h / 2, z)).put(m.gold, new T3.SphereGeometry(.24, 12, 8), M(x, .4 + h + .12, z));
    leuchten.push(V(x, .4 + h + .45, z)); }
  // Windsackmast mit Abspannseilen
  { const [x, h, z] = WINDMAST; S.cyl(m.stein, .45, .55, .3, 10, x, .15, z).cyl(m.weiss, .05, .09, h, 8, x, h / 2, z).put(m.gold, new T3.SphereGeometry(.09, 8, 6), M(x, h + .12, z));
    for (let k = 0; k < 3; k++) { const a = k * 2 * PI / 3 + .4; S.rod(m.seil, [x, h - 2.2, z], [x + Math.cos(a) * 2.6, .02, z + Math.sin(a) * 2.6], .012, 4); } }
  S.build(ctx.group);
  RH.flammen(ctx, fl, 0xffd08a, .5, {flackern: false});
  RH.flammen(ctx, leuchten, 0xfff0c4, .9, {flackern: false});
  // Windsack: zeigt mit dem Wind (meist nach links vorn), pendelt langsam
  { const [x, h, z] = WINDMAST, g = new T3.Group(), sg = new T3.CylinderGeometry(.13, .32, 2.0, 12, 1, true); sg.rotateZ(-PI / 2); sg.translate(1.05, 0, 0);
    const sm = new T3.Mesh(sg, m.sack), ring = new T3.Mesh(new T3.TorusGeometry(.32, .022, 5, 18), m.eisen); ring.rotation.y = PI / 2; ring.position.x = .05;
    g.add(sm, ring); g.position.set(x, h - .08, z); g.userData.noPick = true; ctx.group.add(g);
    const stelle = t => { g.rotation.y = PI + .3 + .25 * Math.sin(t * .37) + .06 * Math.sin(t * 1.3); g.rotation.z = -.14 - .07 * Math.sin(t * .8); };
    stelle(0); if (!RH.reduziert) ctx.tick((dt, t) => stelle(t)); }
  // Besenflieger fliegen den Parcours ab: gleich schnell (5,5 m/s) durch alle Ringtore, in Kurven geneigt
  { const [gh, gs] = besenflieger(), n = 3, A = new T3.InstancedMesh(gh, m.holz, n), Bm = new T3.InstancedMesh(gs, m.reiter, n);
    for (const im of [A, Bm]) { im.frustumCulled = false; im.castShadow = false; im.userData.noPick = true; ctx.group.add(im); }
    const L = kurve.getLength(), v = 5.5, mx = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), p = V(), t0 = V(), t1 = V(), one = V(1, 1, 1);
    const stelle = t => { for (let i = 0; i < n; i++) { const u = ((t * v / L + i / n) % 1 + 1) % 1;
        kurve.getPointAt(u, p); kurve.getTangentAt(u, t0); kurve.getTangentAt((u + 1.5 / L) % 1, t1);
        const yaw = Math.atan2(-t0.z, t0.x), d = Math.atan2(-t1.z, t1.x) - yaw, k = Math.atan2(Math.sin(d), Math.cos(d)) / 1.5;   // Drehung je Meter (1/Kurvenradius)
        e.set(Math.max(-.6, Math.min(.6, -k * 3.2)), yaw, Math.asin(Math.max(-1, Math.min(1, t0.y))), "YXZ");
        mx.compose(p, q.setFromEuler(e), one); A.setMatrixAt(i, mx); Bm.setMatrixAt(i, mx); }
      A.instanceMatrix.needsUpdate = Bm.instanceMatrix.needsUpdate = true; };
    stelle(3); if (!RH.reduziert) ctx.tick((dt, t) => stelle(t)); }
  ctx.tick((dt, t) => { himmel.rotation.y = t * .004; });   // Wolken ziehen sehr langsam
  RH.huelle(ctx, {saeuleX: [B.x0 + .15, B.x1 - .15], fackeln: laternen});
  return H;
}
// Ausstattung des Flugplatzes (Wandkoordinaten: x entlang der Wand, z in den Raum): Besenregal mit Schulbesen, Wendekegel
function flugplatzStuecke(Hd){
  const {M: m, box, cyl, cone, along, STUECK} = Hd; if (STUECK.besenregal) return;
  const besen = (K, b, t, c) => { const d = [t[0] - b[0], t[1] - b[1], t[2] - b[2]], L = Math.hypot(...d), u = d.map(v => v / L), p = s => [b[0] + u[0] * s, b[1] + u[1] * s, b[2] + u[2] * s];
    K.rod("atlas", p(.4), t, .018, 6, c); K.put("atlas", cyl(.035, .1, .46, 8), along(b, p(.46))[0], "#c9a45a"); K.put("iron", cyl(.038, .038, .06, 8), along(p(.41), p(.47))[0]); };
  const stern = new T3.Shape(); for (let k = 0; k < 10; k++) { const a = PI / 2 + k * PI / 5, r = k % 2 ? .03 : .07; if (k) stern.lineTo(Math.cos(a) * r, Math.sin(a) * r); else stern.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  STUECK.besenregal = {min: 1.1, max: 1.7, h: 1.95, d: .42, off: .12, bau: (D, w) => { const K = D.K, n = Math.max(3, Math.floor((w - .2) / .24));
    K.put("wood", box(w, .06, .4), m(0, .03, .2)).put("wood", box(w, .08, .05), m(0, 1.52, .04)).put("wood", box(w - .1, .05, .05), m(0, .2, .36));
    for (const s of [-1, 1]) K.put("wood", box(.06, 1.62, .06), m(s * (w / 2 - .04), .81, .04)).put("wood", box(.06, .2, .4), m(s * (w / 2 - .04), .1, .2));
    K.put("atlas", box(.62, .2, .025), m(0, 1.72, .03), SCHULE.blau).put("gold", new T3.ShapeGeometry(stern), m(0, 1.72, .044));   // Schild in Schulblau mit goldenem Stern
    for (let i = 0; i < n; i++) { const x = -w / 2 + .17 + i * (w - .34) / (n - 1); besen(K, [x + (D.r() - .5) * .05, .07, .3], [x, 1.86, .07], ["#6b4a2a", "#5a3a20", "#7a5532"][i % 3]); } }};
  STUECK.wendekegel = {min: .8, max: 1.5, h: .7, d: .5, off: .12, bau: (D, w) => { const K = D.K;
    const kegel = (x, z, y = 0) => { K.put("atlas", cone(.15, .42, 12), m(x, y + .21, z), SCHULE.blau).put("atlas", cyl(.068, .099, .09, 12, true), m(x, y + .2, z), SCHULE.creme); if (!y) K.put("atlas", box(.34, .03, .34), m(x, .015, z), SCHULE.blau); };
    for (const y of [0, .09, .18]) kegel(-w / 2 + .22, .28, y);   // Stapel
    for (let i = 0, n = Math.floor((w - .45) / .4); i < n; i++) kegel(-w / 2 + .64 + i * .4, .26 + (i % 2) * .08); }};
}
RH.raum.beweg1 = {
  licht: {hintergrund: 0x9cc8ef, nebel: [0xc8dcea, .009], himmel: [0xe4f0ff, 0x6a8a48, 1.3], umgebung: [0xfff6e6, .42], sonne: [0xfff0d0, 1.9, [6, 14, -8]]},
  shell: platzShell,
  ambient: {kerzen: 0, staub: 0},   // kein Staub: die Teilchen sind eckige Punkte und wirkten bei Tageslicht vor den Tribünentüchern wie Bildfehler
  dekor: {deck: ["zeitnehmer", "besenregal", "besen", "tonne", "heuballen", "wendekegel", "frachtkisten", "besenregal", "heuballen"], tief: ["wendekegel", "heuballen", "tonne", "frachtkisten"],
    ohne: ["Vorhänge", "Kronleuchter", "Kunst", "Bücher", "Kugeln", "Wappen"], vorher: [["Draußen", (D, Hd) => { RH.draussenStuecke(Hd); flugplatzStuecke(Hd); }]]}
};

/* =====================================================================
   beweg2 · Kammer der Bewegungsformel
   ===================================================================== */
const kammerTex = {
  stein: () => RH.tex("bk-stein", 1024, 1024, (g, w, h) => RH.quader(g, w, h, RH.seeded(611), {lagen: 8, h: [248, 13, 20], streu: 7, spanne: 18, breite: 2.0, fugeFarbe: "#060509", koernung: .3})),
  boden: () => RH.tex("bk-boden", 1024, 1024, (g, w, h) => RH.quader(g, w, h, RH.seeded(613), {lagen: 4, h: [245, 10, 17], streu: 5, breite: 1.1, fugeFarbe: "#040306", koernung: .22})),
  env: () => { const t = RH.tex("bk-env", 256, 128, (g, w, h) => { g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#1a1430"], [.45, "#3a2c6a"], [.5, "#181228"], [1, "#05040a"]]); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 10; i++) { const x = (i + .5) * w / 10, y = h * .44; g.fillStyle = RH.rad(g, x, y, 0, 10, [[0, "rgba(205,185,255,1)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - 10, y - 10, 20, 20); } }, false);
    t.mapping = T3.EquirectangularReflectionMapping; return t; },
  // Runen (frei erfunden): Stamm mit Ästen, Haken, Kreisen und Querstrichen, weiß auf durchsichtig (Farbe gibt das Material)
  rune: () => RH.tex("bk-rune", 1024, 128, (g, w, h) => { const r = RH.seeded(612), n = 16, cw = w / n; g.clearRect(0, 0, w, h); g.strokeStyle = g.fillStyle = "#fff"; g.lineCap = g.lineJoin = "round"; g.shadowColor = "#fff"; g.shadowBlur = 8;
    for (let i = 0; i < n; i++) { const cx = (i + .5) * cw, t = h * .2, b = h * .8, mi = h / 2, q = cw * .26; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, t); g.lineTo(cx, b);
      const f = [0, 1, 2, 3, 4, 5, 6].filter(() => r() < .45).slice(0, 3); if (!f.length) f.push((r() * 7) | 0);
      for (const k of f) { if (k === 0) { g.moveTo(cx, mi); g.lineTo(cx + q, t); } else if (k === 1) { g.moveTo(cx, mi); g.lineTo(cx - q, b); } else if (k === 2) { g.moveTo(cx - q, t + 8); g.lineTo(cx, t + 26); g.lineTo(cx + q, t + 8); }
        else if (k === 3) { g.moveTo(cx - q, mi + 6); g.lineTo(cx + q, mi - 6); } else if (k === 4) { g.moveTo(cx + 9, t + 9); g.arc(cx, t + 9, 9, 0, 2 * PI); } else if (k === 5) { g.moveTo(cx, b); g.lineTo(cx + q, b - 16); }
        else { g.moveTo(cx + q * .9, t); g.lineTo(cx + q * .9, b); g.moveTo(cx, mi); g.lineTo(cx + q * .9, mi); } }
      g.stroke(); g.beginPath(); g.arc(cx + cw / 2, mi, 3, 0, 7); g.fill(); } }),
  formel: () => RH.tex("bk-formel", 1024, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#fff"; g.shadowColor = "#fff"; g.shadowBlur = 10; g.textBaseline = "middle"; g.textAlign = "center";
    g.font = `700 74px ${BODY}`; g.fillText("F · Δt = m · Δv", w * .4, h * .54);
    const stern = (x, y, q) => { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, rr = k % 2 ? q * .3 : q; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
    stern(w * .86, h * .5, 26); stern(w * .78, h * .5, 9); stern(w * .94, h * .5, 9); }),
  ziffer: () => RH.tex("bk-ziffer", 1024, 1024, (g, w, h) => { const c = w / 2, R = w * .49, r = RH.seeded(614);
    g.fillStyle = RH.rad(g, c, c, 0, R, [[0, "#202a58"], [.75, "#141a3c"], [1, "#0b0e24"]]); g.beginPath(); g.arc(c, c, R, 0, 7); g.fill();
    for (let i = 0; i < 160; i++) { const a = r() * PI * 2, d = R * (.2 + r() * .5); g.fillStyle = `rgba(255,240,200,${.2 + r() * .5})`; g.fillRect(c + Math.cos(a) * d, c + Math.sin(a) * d, 2, 2); }
    g.strokeStyle = "#d9a830"; for (const [rr, lw] of [[R * .985, 10], [R * .8, 5], [R * .76, 2], [R * .5, 4]]) { g.lineWidth = lw; g.beginPath(); g.arc(c, c, rr, 0, 7); g.stroke(); }
    for (let k = 0; k < 60; k++) { const a = k / 60 * PI * 2, l = k % 5 ? .93 : .9; g.lineWidth = k % 5 ? 3 : 7; g.beginPath(); g.moveTo(c + Math.sin(a) * R * .965, c - Math.cos(a) * R * .965); g.lineTo(c + Math.sin(a) * R * l, c - Math.cos(a) * R * l); g.stroke(); }
    const rom = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"]; g.fillStyle = "#e9c25a"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 74px ${BODY}`;
    rom.forEach((s, k) => { const a = k / 12 * PI * 2; g.save(); g.translate(c + Math.sin(a) * R * .845, c - Math.cos(a) * R * .845); g.rotate(a); g.fillText(s, 0, 4); g.restore(); });
    for (let k = 0; k < 12; k++) { const a = (k + .5) / 12 * PI * 2, x = c + Math.sin(a) * R * .63, y = c - Math.cos(a) * R * .63; g.beginPath(); for (let j = 0; j < 8; j++) { const b = j / 8 * PI * 2, rr = j % 2 ? 6 : 18; g.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } g.fill(); }
    g.font = `700 190px ${BODY}`; g.fillStyle = "#f2d27a"; g.fillText("Δt", c, c + 120); g.font = `600 44px ${BODY}`; g.fillText("Zeitspanne", c, c + 245); }, false),
  medaillon: () => RH.tex("bk-medaillon", 512, 512, (g, w, h) => { const c = w / 2, R = w * .48; g.clearRect(0, 0, w, h); g.strokeStyle = g.fillStyle = "#fff"; g.shadowColor = "#fff"; g.shadowBlur = 8;
    for (const [rr, lw] of [[R, 6], [R * .86, 3], [R * .7, 4], [R * .42, 2]]) { g.lineWidth = lw; g.beginPath(); g.arc(c, c, rr, 0, 7); g.stroke(); }
    g.lineWidth = 3; g.beginPath(); for (let k = 0; k < 7; k++) { const a = k * 4 / 7 * PI * 2 - PI / 2; g.lineTo(c + Math.cos(a) * R * .7, c + Math.sin(a) * R * .7); } g.closePath(); g.stroke();
    const r = RH.seeded(615); for (let k = 0; k < 18; k++) { const a = k / 18 * PI * 2, x = c + Math.cos(a) * R * .93, y = c + Math.sin(a) * R * .93; g.save(); g.translate(x, y); g.rotate(a + PI / 2); g.lineWidth = 3; g.beginPath();
      g.moveTo(0, -12); g.lineTo(0, 12); if (r() < .5) { g.moveTo(0, 0); g.lineTo(8, -10); } else { g.moveTo(-7, -8); g.lineTo(0, -2); g.lineTo(7, -8); } if (r() < .4) { g.moveTo(-6, 6); g.lineTo(6, 2); } g.stroke(); g.restore(); }
    g.font = `700 54px ${BODY}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("a = Δv : Δt", c, c + 4); }, false)
};
function kammerMat(){ return {
  stein: RH.mat("b2-stein", () => RH.std({map: kammerTex.stein(), roughness: .82})),
  steinD: RH.mat("b2-steind", () => RH.std({map: kammerTex.stein(), color: 0x9a94b4, roughness: .88})),
  boden: RH.mat("b2-boden", () => RH.std({map: kammerTex.boden(), roughness: .5, metalness: .12, envMap: kammerTex.env()})),
  decke: RH.mat("b2-decke", () => RH.std({map: kammerTex.stein(), color: 0x77738e, roughness: .95, emissive: 0x6a5aa8, emissiveMap: kammerTex.stein(), emissiveIntensity: 1.8})),   // sonst schwarz wie ein Loch
  rune: RH.mat("b2-rune", () => RH.additiv({map: kammerTex.rune(), color: 0x9a86ff, opacity: .85, side: T3.DoubleSide})),
  runeC: RH.mat("b2-runec", () => RH.additiv({map: kammerTex.rune(), color: 0x62cfff, opacity: .8, side: T3.DoubleSide})),
  formel: RH.mat("b2-formel", () => RH.additiv({map: kammerTex.formel(), color: 0xc8b4ff, opacity: .9, side: T3.DoubleSide})),
  kreis: RH.mat("b2-kreis", () => RH.additiv({color: 0x8c78ff, opacity: .8, side: T3.DoubleSide})),
  ziffer: RH.mat("b2-ziffer", () => RH.std({map: kammerTex.ziffer(), roughness: .5, emissive: 0xffffff, emissiveMap: kammerTex.ziffer(), emissiveIntensity: .4})),
  medaillon: RH.mat("b2-medaillon", () => RH.additiv({map: kammerTex.medaillon(), color: 0x86d6ff, opacity: .85})),
  kugel: RH.mat("b2-kugel", () => RH.basic({color: 0xffffff})),
  messing: KIT.mat("brass"), gold: KIT.mat("gold"), holz: KIT.mat("darkwood"), eisen: KIT.mat("metal")
}; }
// Zahnrad (Modul 0,1 m: Teilkreisradius n · 0,05 m) mit Kranz, fünf Speichen und Nabe
function zahnradGeo(n){
  const mo = .1, r = n * mo / 2, ra = r + mo, rf = r - 1.25 * mo, t = 2 * PI / n, s = new T3.Shape();
  for (let i = 0; i < n; i++) { const a = i * t; [[rf, a - t * .5], [rf, a - t * .27], [ra, a - t * .13], [ra, a + t * .13], [rf, a + t * .27]].forEach(([rr, aa], k) => { const x = rr * Math.cos(aa), y = rr * Math.sin(aa); if (i || k) s.lineTo(x, y); else s.moveTo(x, y); }); }
  s.closePath();
  const rO = rf - .1 - r * .06, rI = Math.max(.12, r * .22), dO = .06 / rO, dI = .06 / rI;
  for (let k = 0; k < 5; k++) { const a0 = k * 2 * PI / 5, a1 = (k + 1) * 2 * PI / 5, p = new T3.Path(); p.absarc(0, 0, rO, a0 + dO, a1 - dO, false); p.absarc(0, 0, rI, a1 - dI, a0 + dI, true); p.closePath(); s.holes.push(p); }
  const ax = new T3.Path(); ax.absarc(0, 0, .05, 0, 2 * PI, true); s.holes.push(ax);
  const g = new T3.ExtrudeGeometry(s, {depth: .07, bevelEnabled: false, curveSegments: 4}); g.translate(0, 0, -.035); return g;
}
// Getriebe: Räder greifen ineinander (Lage, Drehsinn, Phase aus dem Vorgänger an: i unter dem Winkel a); x, y in Wandkoordinaten (x nach rechts wie gesehen)
function getriebe(spec){ const out = [];
  spec.forEach(s => { if (s.an == null) { out.push({n: s.n, x: s.x, y: s.y, w: s.w ?? .2, p: s.p || 0}); return; }
    const A = out[s.an], d = (A.n + s.n) * .05; out.push({n: s.n, x: A.x + d * Math.cos(s.a), y: A.y + d * Math.sin(s.a), w: -A.w * A.n / s.n, p: s.a + PI + PI / s.n - (A.p - s.a) * A.n / s.n}); });
  return out; }
// Schriftband im Boden als Ring (r0 … r1), von außen gelesen von links nach rechts; Oberkante der Schrift zur Mitte
function ringBand(r0, r1, n, rep){ const pos = [], uv = [], idx = [], nor = [];
  for (let i = 0; i <= n; i++) { const a = PI / 2 - i / n * 2 * PI; for (const [r, v] of [[r1, 0], [r0, 1]]) { pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); nor.push(0, 1, 0); uv.push(i / n * rep, v); } }
  for (let i = 0; i < n; i++) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; }
function kammerShell(ctx){
  const B = ctx.bounds, m = kammerMat(), S = RH.sammler(), rect = RH.rechteck(B.x0, B.x1, B.z0, B.z1), fl = [], kern = [], fackeln = [];
  RH.boden(ctx, m.boden, {uS: 4, vS: 4});
  // Wände aus dunklem Quaderstein, Sockel, Gesimsband mit Runenfries unter der Decke, schmales Runenband über dem Sockel
  S.put(m.stein, RH.zug(rect, [[0, 0], [0, H]], {zu: true, uS: 3.2, vS: 3.2}));
  S.put(m.steinD, RH.zug(rect, [[.14, 0], [.14, .5], [0, .6]], {zu: true, uS: 3.2, vS: 3.2}));
  S.put(m.steinD, RH.zug(rect, [[0, 6.6], [.16, 6.66], [.16, 7.22], [0, 7.28]], {zu: true, uS: 3.2, vS: 3.2}));
  S.put(m.rune, RH.zug(rect, [[.17, 6.72], [.17, 7.16]], {zu: true, uS: 3.4, vS: .44}));
  S.put(m.runeC, RH.zug(rect, [[.015, .72], [.015, .96]], {zu: true, uS: 2.0, vS: .24}));
  // Decke mit Balken (Lage für das Pendel der Ausstattung)
  { const g = new T3.PlaneGeometry(16, 22); RH.uvMal(g, 5, 6.9); S.put(m.decke, g, M(0, H, 0, PI / 2)); }
  const balken = []; for (let z = B.z1 + 1.5; z < B.z0; z += 3) { balken.push(z); S.put(m.holz, RH.kasten(16, .36, .4, 2.4), M(0, H - .18, z)); }
  // Wandpfeiler (Struktur bei z = ±9, ±4,5, 0) mit senkrechten Runenbändern und Fackeln (violette Flammen; zwei sind die Punktlichter)
  for (const sx of [-1, 1]) for (const z of [9, 4.5, 0, -4.5, -9]) { const ry = sx < 0 ? PI / 2 : -PI / 2;
    S.put(m.steinD, RH.kasten(.3, 6.6, .72, 3.2), M(sx * 7.85, 3.3, z));
    const g = new T3.PlaneGeometry(.24, 3.3), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v * 3.3 / 1.92, u); }   // Runen quer (Zeichenhöhe = Bandbreite)
    S.put(m.runeC, g, M(sx * 7.69, 4.75, z, 0, ry));
    const lp = RH.fackel(S, fl, sx * 7.7, 2.2, z, -sx, {mat: m.eisen}); kern.push(fl[fl.length - 1].clone().add(V(0, -.06, 0))); fackeln.push([sx * 7.7, 2.2, z, -sx, lp]); }
  // Stirnwand vorn: großes Zifferblatt (links) mit Zeigern, Uhrwerk aus Messingrädern (rechts); hinten Uhrwerk und Runenmedaillon
  const zf = B.z1 + .06, DX = -5.0, DY = 4.4, DR = 2.0;
  S.put(m.ziffer, new T3.CircleGeometry(DR, 64), M(DX, DY, zf)).put(m.gold, new T3.TorusGeometry(DR + .05, .07, 8, 64), M(DX, DY, zf + .02)).put(m.messing, new T3.TorusGeometry(DR + .22, .035, 6, 64), M(DX, DY, zf + .01));
  for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; S.put(m.messing, new T3.SphereGeometry(.05, 8, 6), M(DX + Math.sin(a) * (DR + .22), DY + Math.cos(a) * (DR + .22), zf + .03)); }
  S.cyl(m.messing, .13, .13, .16, 16, DX, DY, zf + .1, PI / 2);
  const zeiger = (L, b) => { const s = new T3.Shape(); s.moveTo(-b, -.28); s.lineTo(b, -.28); s.lineTo(b * .55, L * .78); s.lineTo(0, L); s.lineTo(-b * .55, L * .78); s.closePath();
    const me = new T3.Mesh(new T3.ShapeGeometry(s), m.gold); me.position.set(DX, DY, zf + .07); me.userData.noPick = true; ctx.group.add(me); return me; };
  const zMin = zeiger(1.7, .06), zStd = zeiger(1.1, .1);
  const vorn = getriebe([{n: 32, x: 5.2, y: 4.3, w: .2}, {n: 16, an: 0, a: 2.18}, {n: 24, an: 0, a: -1.05}, {n: 12, an: 0, a: .35}]);
  const links = [{n: 12, x: -3.39, y: 5.75, w: -.45, p: .3}, {n: 16, x: -6.81, y: 3.55, w: .32, p: .1}];
  const hinten = getriebe([{n: 32, x: 5.3, y: 4.0, w: -.16}, {n: 12, an: 0, a: 2.3}, {n: 24, an: 0, a: -1.1}]);
  const raeder = [...vorn.map(g => Object.assign(g, {wand: -1})), ...links.map(g => Object.assign(g, {wand: -1, hinter: true})), ...hinten.map(g => Object.assign(g, {wand: 1}))];
  for (const g of raeder) { const x = g.wand > 0 ? -g.x : g.x, z = g.wand > 0 ? B.z0 - .1 : B.z1 + (g.hinter ? .04 : .12); S.cyl(m.eisen, .07, .07, g.hinter ? .1 : .22, 10, x, g.y, z + (g.wand > 0 ? -.03 : .03), PI / 2); }
  S.put(m.medaillon, new T3.CircleGeometry(1.7, 48), M(5.0, 4.5, B.z0 - .05, 0, PI)).put(m.messing, new T3.TorusGeometry(1.76, .05, 6, 64), M(5.0, 4.5, B.z0 - .04, 0, PI));
  RH.belege(ctx, {x0: -7.4, x1: -2.6, y0: 2.0, y1: 6.75, z0: B.z1, z1: B.z1 + .35}); RH.belege(ctx, {x0: 2.8, x1: B.x1, y0: .5, y1: 7.3, z0: B.z1, z1: B.z1 + .35});
  RH.belege(ctx, {x0: B.x0, x1: -3.0, y0: .1, y1: 6.5, z0: B.z0 - .35, z1: B.z0}); RH.belege(ctx, {x0: 3.2, x1: 6.8, y0: 2.7, y1: 6.3, z0: B.z0 - .3, z1: B.z0});
  // Zauberkreis im Boden um das Mittelstück: Ringe, Formelband F · Δt = m · Δv, acht Knoten mit Strahlen
  { const y = .012, cz = -1.5, kn = [];
    S.put(m.kreis, new T3.RingGeometry(3.08, 3.14, 96), M(0, y, cz, -PI / 2)).put(m.kreis, new T3.RingGeometry(3.86, 3.92, 96), M(0, y, cz, -PI / 2)).put(m.kreis, new T3.RingGeometry(4.36, 4.39, 96), M(0, y, cz, -PI / 2));
    S.put(m.formel, ringBand(3.2, 3.8, 120, 5), M(0, y + .002, cz));
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2 + PI / 8, c = Math.cos(a), s = Math.sin(a); S.put(m.kreis, new T3.PlaneGeometry(.04, .48), M(c * 4.14, y, cz + s * 4.14, -PI / 2, 0, -a + PI / 2)); kn.push(V(c * 4.38, .03, cz + s * 4.38)); }
    RH.flammen(ctx, kn, 0xb090ff, .45);
    // Gegenstück an der Decke: Runenkreis mit Strahlen über dem Zauberkreis (gleiche Materialien, kein zusätzlicher Zeichenaufruf)
    const yd = H - .012; S.put(m.kreis, new T3.RingGeometry(3.0, 3.07, 96), M(0, yd, cz, -PI / 2)).put(m.kreis, new T3.RingGeometry(2.08, 2.13, 96), M(0, yd, cz, -PI / 2)).put(m.rune, ringBand(2.2, 2.9, 96, 5), M(0, yd - .002, cz));
    for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2, b = (k + 3) / 7 * PI * 2, p = [Math.cos(a) * 2.06, cz + Math.sin(a) * 2.06], q = [Math.cos(b) * 2.06, cz + Math.sin(b) * 2.06], L = Math.hypot(q[0] - p[0], q[1] - p[1]);   // Siebenstern
      S.put(m.kreis, new T3.PlaneGeometry(.035, L), M((p[0] + q[0]) / 2, yd, (p[1] + q[1]) / 2, -PI / 2, 0, -Math.atan2(q[1] - p[1], q[0] - p[0]) + PI / 2)); } }
  S.build(ctx.group);
  // Zahnräder als InstancedMesh je Größe, drehen sich langsam (ineinandergreifend)
  { const typen = new Map(); raeder.forEach(g => typen.set(g.n, (typen.get(g.n) || 0) + 1));
    const ims = new Map(); for (const [n, c] of typen) { const im = new T3.InstancedMesh(zahnradGeo(n), m.messing, c); im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.userData.noPick = true; ctx.group.add(im); ims.set(n, {im, i: 0}); }
    raeder.forEach(g => { const e = ims.get(g.n); g.im = e.im; g.idx = e.i++; });
    const mx = new T3.Matrix4(), q = new T3.Quaternion(), qz = new T3.Quaternion(), qy = new T3.Quaternion().setFromAxisAngle(V(0, 1, 0), PI), Z = V(0, 0, 1), one = V(1, 1, 1), p = V();
    const stelle = t => { raeder.forEach(g => { qz.setFromAxisAngle(Z, g.p + g.w * t); q.copy(g.wand > 0 ? qy : qz); if (g.wand > 0) q.multiply(qz);
      p.set(g.wand > 0 ? -g.x : g.x, g.y, g.wand > 0 ? B.z0 - .1 : B.z1 + (g.hinter ? .04 : .12)); mx.compose(p, q, one); g.im.setMatrixAt(g.idx, mx); }); ims.forEach(e => { e.im.instanceMatrix.needsUpdate = true; });
      zMin.rotation.z = -t * 2 * PI / 60; zStd.rotation.z = -t * 2 * PI / 720 - 1.2; };
    stelle(0); if (!RH.reduziert) ctx.tick((dt, t) => stelle(t)); }
  RH.flammen(ctx, fl, 0x9a7cff, .8); RH.flammen(ctx, kern, 0xf0e8ff, .28);
  const lic = fackeln.filter(([x, , z]) => (x < 0 && z === 4.5) || (x > 0 && z === -4.5)).map(([, , , , p]) => RH.punktlicht(ctx, 0xcabcff, 8.5, p[0], p[1], p[2], {weite: 12}));
  // schwebende Leuchtkugeln auf langsamen Kreisbahnen (gleichförmige Kreisbewegung) über den Seitenbereichen
  { const orte = [[-5.1, 6.2, 6.75], [5.1, 6.35, 2.25], [-5.1, 6.45, -2.25], [5.1, 6.2, -6.75], [-3.6, 6.6, 8.9], [3.6, 6.5, -9.0]], n = orte.length;
    const im = new T3.InstancedMesh(new T3.SphereGeometry(.19, 16, 12), m.kugel, n), c = new T3.Color(), pos = new Float32Array(n * 3), col = [];
    orte.forEach((o, i) => { c.set(i % 2 ? 0x9ee6ff : 0xc9b2ff); im.setColorAt(i, c); col.push(c.r, c.g, c.b); RH.belege(ctx, {x0: o[0] - .7, x1: o[0] + .7, y0: o[1] - .4, y1: o[1] + .4, z0: o[2] - .7, z1: o[2] + .7}); });
    const gg = new T3.BufferGeometry(); gg.setAttribute("position", new T3.BufferAttribute(pos, 3)); gg.setAttribute("color", new T3.Float32BufferAttribute(col, 3));
    const halo = new T3.Points(gg, new T3.PointsMaterial({map: R3D.util.glowTex(), vertexColors: true, size: 1.5, transparent: true, opacity: .8, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}));
    for (const o of [im, halo]) { o.frustumCulled = false; o.userData.noPick = true; ctx.group.add(o); }
    const mx = new T3.Matrix4(), stelle = t => { orte.forEach(([x, y, z], i) => { const a = t * .45 * (i % 2 ? 1 : -1) + i * 1.3, px = x + Math.cos(a) * .4, py = y + Math.sin(t * .7 + i) * .08, pz = z + Math.sin(a) * .4;
      mx.makeTranslation(px, py, pz); im.setMatrixAt(i, mx); pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz; }); im.instanceMatrix.needsUpdate = true; gg.attributes.position.needsUpdate = true; };
    stelle(0); if (!RH.reduziert) ctx.tick((dt, t) => stelle(t)); }
  RH.huelle(ctx, {saeuleX: [B.x0 + .15, B.x1 - .15], fackeln: fackeln.map(([x, y, z, d]) => [x, y - .05, z, d]), balken});
  ctx._kammer = {m, lic};
  return H;
}
// Runen und Formel leuchten langsam auf und ab (Periode 7–10 s, kein Flackern)
function kammerStimmung(ctx){ const K = ctx._kammer; if (!K || RH.reduziert) return; const m = K.m;
  ctx.tick((dt, t) => { m.rune.opacity = .72 + .14 * Math.sin(t * .8); m.runeC.opacity = .68 + .14 * Math.sin(t * .8 + 2); m.formel.opacity = .82 + .1 * Math.sin(t * .63); m.medaillon.opacity = .74 + .14 * Math.sin(t * .7 + 1); }); }
RH.raum.beweg2 = {
  licht: {hintergrund: 0x06050c, nebel: [0x0c0a18, .018], himmel: [0xc8bcff, 0x2c2444, 1.2], umgebung: [0xd4ccff, .3], sonne: [0xb4c0ff, 1.15, [-4, 14, 6]]},
  shell: kammerShell,
  // keine schwebenden Kerzen: Hier schweben die Leuchtkugeln; die Kerzen standen vom Eingang aus vor Uhrwerk und Zifferblatt (wie in die Zahnräder gesteckt),
  // und jede Stelle in der vorderen Raumhälfte liegt auf einer Sichtlinie zu einer der beiden Uhrwerkwände
  ambient: {kerzen: 0, staub: 180, staubFarbe: 0xa898ff, steigen: .025},
  stimmung: kammerStimmung,
  dekor: {deck: ["kommode:sanduhr", "standuhr", "armillar", "regal", "leuchter", "kommode", "truhe", "globus", "regal"], tief: ["truhe", "bank", "anrichte", "truhe"],
    ohne: ["Vorhänge", "Kronleuchter", "Kunst", "Wappen"], buecher: 4}
};
})();
