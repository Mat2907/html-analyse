/* ---------- 17_raum_zauber_kraft.js ---------- */
/* =====================================================================
   Raumthemen der Zauberschule · Kräfte (Werkzeug und Felder: 17_raum_zauber.js)
   kraft1 „Halle der schwebenden Kräfte“: hohe, helle Halle aus Sandsteinquadern mit spitzem Tonnengewölbe (Scheitel 14,2 m), Gurtbögen auf
     Halbsäulen, Obergaden-Fenster über den Tafeln mit Lichtbahnen, Rosenfenster und Lanzettfenster an den Stirnwänden, Fahnen am Gewölbe;
     hoch oben schweben Felsbrocken, Truhen und Bücher; das Planetenkarussell hängt an einem Eisenring an einer Kette vom Scheitel;
     Messingring mit Kraftpfeilen im Boden; helles, warmes Licht
   kraft2 „Rampe am Schlossberg“: draußen am Abend – Abendhimmel mit tiefer Sonne und ersten Sternen, Erdboden mit gepflasterter Rampe,
     Schlossberg mit Weg und Burg (erleuchtete Fenster), rechts Burgmauer mit Zinnen und Strebepfeilern, links Baugerüst mit Bretterwand,
     Torbauten mit Zinnen und Ecktürme an den Stirnseiten, Holzgerüst (Querbalken in 7,5 m) über dem Hof für Schild, Federleuchten und Flaschenzug;
     Ausstattung: Tonnen, Kisten, Steinquader, Karren, Heu, Gewichte
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.kits || !R3D.kits.zauber || !R3D.kits.zauber.raumHilfe) return;
const KIT = R3D.kits.zauber, RH = KIT.raumHilfe, PI = Math.PI, M = RH.M, H = RH.H, V = (x, y, z) => new T3.Vector3(x, y, z);

// Kette aus Gliedern senkrecht von oben (y0) nach unten (y1) in einen Sammler
function kette(S, m, x, y0, y1, z){ const tg = new T3.TorusGeometry(.045, .012, 4, 8), n = Math.max(1, Math.round((y0 - y1) / .075));
  for (let i = 0; i < n; i++) S.put(m, tg.clone(), M(x, y0 - .04 - i * .075, z, 0, i % 2 ? PI / 2 : 0, 0, 1, 1.35, 1)); tg.dispose(); }
// flaches Lichtband (Viereck p0, p1 am Fenster → q1, q0 am Boden), v = 1 am Fenster
function lichtbahn(S, m, p0, p1, q1, q0){ const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute([...p0, ...p1, ...q1, ...q0], 3));
  g.setAttribute("normal", new T3.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); g.setAttribute("uv", new T3.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); S.put(m, g); }

/* =====================================================================
   kraft1 · Halle der schwebenden Kräfte
   ===================================================================== */
const HY = 9.6, HA = 4.6;   // Kämpfer des Gewölbes an den Seitenwänden, Stich (Scheitel 14,2 m über dem Gang)
const gw = x => HY + HA * Math.sqrt(Math.max(0, 1 - Math.abs(x) / 8));
const hallenTex = {
  stein: () => RH.tex("kh-stein", 1024, 1024, (g, w, h) => RH.quader(g, w, h, RH.seeded(711), {lagen: 8, h: [38, 24, 70], streu: 7, spanne: 7, breite: 2.2, fugeFarbe: "#a8987c", koernung: .12})),
  boden: () => RH.tex("kh-boden", 1024, 1024, (g, w, h) => RH.quader(g, w, h, RH.seeded(712), {lagen: 4, h: [36, 20, 63], streu: 12, spanne: 14, breite: 1.25, fuge: 3, fugeFarbe: "#6e5e46", koernung: .14})),   // große Sandsteinplatten in wechselnden Tönen
  putz: () => RH.tex("kh-putz", 512, 512, (g, w, h) => { const r = RH.seeded(713); g.fillStyle = "#efe5d2"; g.fillRect(0, 0, w, h); RH.flecken(g, w, h, 9000, .12, ["#ffffff", "#c8b890", "#e2d4b8"], r);
    g.strokeStyle = "rgba(170,140,90,.35)"; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.fillStyle = "rgba(190,150,70,.5)";   // feine Fugenmalerei, goldene Sterne
    for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, rr = k % 2 ? 4 : 11; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); } }),
  fenster: () => RH.tex("kh-fenster", 256, 512, (g, w, h) => { const r = RH.seeded(714);
    g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#5d9be0"], [.6, "#a9d2f2"], [1, "#e8f2f4"]]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const x = r() * w, y = h * (.15 + r() * .6), q = 22 + r() * 36; g.fillStyle = RH.rad(g, x, y, 0, q, [[0, "rgba(255,255,255,.85)"], [1, "rgba(255,255,255,0)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q); }
    g.fillStyle = "rgba(255,250,225,.35)"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(70,60,50,.85)"; g.lineWidth = 4; for (let x = w / 4; x < w; x += w / 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = h / 8; y < h; y += h / 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = "rgba(220,170,60,.35)"; for (let y = 0; y < h; y += h / 8) for (let x = 0; x < w; x += w / 4) if ((x / (w / 4) + y / (h / 8)) % 2 === 0) g.fillRect(x + 4, y + 4, 10, 10); }, false),
  rose: () => RH.tex("kh-rose", 512, 512, (g, w, h) => { const c = w / 2, R = w * .5, cols = ["#3a6ad8", "#c8343a", "#e8b030", "#3a9a5a", "#7a4ac8", "#38a8d8"];
    g.fillStyle = "#f4ead0"; g.fillRect(0, 0, w, h);
    for (let ring = 0; ring < 3; ring++) { const r0 = R * [.18, .45, .75][ring], r1 = R * [.45, .75, .98][ring], n = [8, 16, 16][ring];
      for (let k = 0; k < n; k++) { const a0 = k / n * PI * 2, a1 = (k + 1) / n * PI * 2; g.fillStyle = cols[(k + ring * 2) % cols.length]; g.globalAlpha = .9;
        g.beginPath(); g.arc(c, c, r1 - 3, a0 + .02, a1 - .02); g.arc(c, c, r0 + 3, a1 - .02, a0 + .02, true); g.closePath(); g.fill();
        g.globalAlpha = .5; g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(c + Math.cos((a0 + a1) / 2) * (r0 + r1) / 2, c + Math.sin((a0 + a1) / 2) * (r0 + r1) / 2, (r1 - r0) * .14, 0, 7); g.fill(); g.globalAlpha = 1; } }
    g.fillStyle = "#ffe8a0"; g.beginPath(); g.arc(c, c, R * .17, 0, 7); g.fill();
    g.strokeStyle = "#3a3028"; g.lineWidth = 6; for (const rr of [.18, .45, .75, .98]) { g.beginPath(); g.arc(c, c, R * rr, 0, 7); g.stroke(); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * R * (k % 2 ? .45 : .18), c + Math.sin(a) * R * (k % 2 ? .45 : .18)); g.lineTo(c + Math.cos(a) * R * .98, c + Math.sin(a) * R * .98); g.stroke(); } }, false),
  strahl: () => RH.tex("kh-strahl", 64, 256, (g, w, h) => { g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "rgba(255,255,255,.95)"], [.55, "rgba(255,255,255,.4)"], [1, "rgba(255,255,255,0)"]]); g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-in"; g.fillStyle = RH.lin(g, 0, 0, w, 0, [[0, "rgba(0,0,0,0)"], [.25, "#000"], [.75, "#000"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over"; }, false)
};
function hallenMat(){ return {
  stein: RH.mat("k1-stein", () => RH.std({map: hallenTex.stein(), roughness: .85})),
  steinD: RH.mat("k1-steind", () => RH.std({map: hallenTex.stein(), color: 0xcfc3ae, roughness: .88})),
  putz: RH.mat("k1-putz", () => RH.std({map: hallenTex.putz(), roughness: .95, side: T3.DoubleSide, emissive: 0x3a3226})),
  boden: RH.mat("k1-boden", () => RH.std({map: hallenTex.boden(), roughness: .42, metalness: .04})),
  fenster: RH.mat("k1-fenster", () => RH.basic({map: hallenTex.fenster()})),
  rose: RH.mat("k1-rose", () => RH.basic({map: hallenTex.rose()})),
  strahl: RH.mat("k1-strahl", () => RH.additiv({map: hallenTex.strahl(), color: 0xfff0c8, opacity: .12, side: T3.DoubleSide})),
  fahneR: RH.mat("k1-fahne-r", () => RH.std({map: KIT.tex.banner("#6B1420"), transparent: true, side: T3.DoubleSide, roughness: 1})),
  fahneB: RH.mat("k1-fahne-b", () => RH.std({map: KIT.tex.banner("#1F3A5F"), transparent: true, side: T3.DoubleSide, roughness: 1})),
  fels: RH.mat("k1-fels", () => RH.std({map: KIT.tex.stone(), color: 0xd8cec0, roughness: .95, flatShading: true})),
  buch: RH.mat("k1-buch", () => RH.std({color: 0xffffff, roughness: .75})), seiten: RH.mat("k1-seiten", () => RH.std({color: 0xf0e2c2, roughness: .9})),
  lampe: RH.mat("k1-lampe", () => RH.basic({color: 0xffe6b0})),
  messing: KIT.mat("brass"), gold: KIT.mat("gold"), holz: KIT.mat("wood"), holzD: KIT.mat("darkwood"), eisen: KIT.mat("metal"), glas: KIT.mat("glass")
}; }
// halbes Spitztonnengewölbe (sx = ±1) als Band entlang z: x = sx · 8 · (1 − s²), y = Kämpfer + Stich · s
function gewoelbeGeo(sx, n = 12){ const pos = [], nor = [], uv = [], idx = []; let bog = 0, alt = null;
  for (let i = 0; i <= n; i++) { const s = i / n, x = sx * 8 * (1 - s * s), y = HY + HA * s, L = Math.hypot(HA, 16 * s); if (alt) bog += Math.hypot(x - alt[0], y - alt[1]); alt = [x, y];
    for (const z of [-11, 11]) { pos.push(x, y, z); nor.push(-sx * HA / L, -16 * s / L, 0); uv.push(z / 3.2, bog / 3.2); } }
  for (let i = 0; i < n; i++) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 2, b + 3, b + 1); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; }
const profil = (n = 12) => { const p = []; for (let i = 0; i <= n; i++) { const s = i / n; p.push([-8 * (1 - s * s), HY + HA * s]); } for (let i = n - 1; i >= 0; i--) { const s = i / n; p.push([8 * (1 - s * s), HY + HA * s]); } return p; };
const ROSE = [0, 10.3, 2.1], LANZ = [5.4, 3.4, 1.5, 5.0];   // Rosenfenster (Mitte, Radius), Lanzettfenster an den Stirnwänden (|x|, Unterkante, Breite, Höhe)
function hallenStirn(){ const s = new T3.Shape(); s.moveTo(-8, 0); s.lineTo(8, 0); profil().slice().reverse().forEach(([x, y]) => s.lineTo(x, y)); s.lineTo(-8, 0);
  const ro = new T3.Path(); ro.absarc(ROSE[0], ROSE[1], ROSE[2], 0, 2 * PI, true); s.holes.push(ro);
  for (const sx of [-1, 1]) s.holes.push(RH.bogenForm(LANZ[2], LANZ[3], 1, sx * LANZ[0], LANZ[1]));
  return s; }
function fensterRahmen(S, m, w, h, spitz, mx, d = .24){ const ring = RH.bogenForm(w + .3, h + .17, spitz); ring.holes.push(RH.bogenForm(w, h, spitz));
  const g = new T3.ExtrudeGeometry(ring, {depth: d, bevelEnabled: false, curveSegments: 8}); g.translate(0, 0, -d + .1); RH.uvAufUmriss(g); RH.uvMal(g, (w + .3) / 3.2, (h + .17) / 3.2); S.put(m, g, mx); }
function hallenShell(ctx){
  const B = ctx.bounds, m = hallenMat(), S = RH.sammler(), fl = [], lic = [], laternen = [];
  RH.boden(ctx, m.boden, {uS: 3.2, vS: 3.2});
  // Messingring mit acht Kraftpfeilen im Boden um das Mittelstück
  { S.put(m.messing, new T3.RingGeometry(2.95, 3.03, 96), M(0, .004, -1.5, -PI / 2)).put(m.messing, new T3.RingGeometry(3.74, 3.79, 96), M(0, .004, -1.5, -PI / 2));
    const pf = new T3.Shape(); pf.moveTo(-.05, 0); pf.lineTo(.05, 0); pf.lineTo(.05, .36); pf.lineTo(.15, .36); pf.lineTo(0, .6); pf.lineTo(-.15, .36); pf.lineTo(-.05, .36); pf.closePath();
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; S.put(m.messing, new T3.ShapeGeometry(pf), M(Math.cos(a) * 3.08, .005, -1.5 + Math.sin(a) * 3.08, -PI / 2, 0, -a - PI / 2)); } }
  // Seitenwände bis zum Kämpfer, Sockel, Kämpfergesims, Gewölbe (Putz mit goldenen Sternchen), Stirnwände mit Rosen- und Lanzettfenstern
  for (const sx of [-1, 1]) { const p = [[sx * 8, B.z1], [sx * 8, B.z0]];
    S.put(m.stein, RH.zug(p, [[0, 0], [0, HY + .05]], {uS: 3.2, vS: 3.2})).put(m.steinD, RH.zug(p, [[.16, 0], [.16, .55], [0, .66]], {uS: 3.2, vS: 3.2}));
    S.put(m.steinD, RH.zug(p, [[0, HY - .3], [.22, HY - .2], [.22, HY], [0, HY + .05]], {uS: 3.2, vS: 3.2}));
    S.put(m.putz, gewoelbeGeo(sx)); }
  for (const sz of [-1, 1]) { const g = new T3.ShapeGeometry(hallenStirn(), 12); RH.uvMal(g, 1 / 3.2, 1 / 3.2); S.put(m.stein, g, sz < 0 ? M(0, 0, B.z1) : M(0, 0, B.z0, 0, PI));
    const E = sz * 11, o = sz, ry = sz < 0 ? 0 : PI, auss = E + o * .05;
    S.put(m.rose, RH.uvAufUmriss(new T3.CircleGeometry(ROSE[2], 48)), M(ROSE[0], ROSE[1], auss, 0, ry)).put(m.steinD, new T3.TorusGeometry(ROSE[2] + .05, .13, 8, 48), M(ROSE[0], ROSE[1], E - o * .02, 0, ry));
    for (const sx of [-1, 1]) { const x = sx * LANZ[0]; S.put(m.fenster, RH.uvAufUmriss(new T3.ShapeGeometry(RH.bogenForm(LANZ[2], LANZ[3], 1), 8)), M(x, LANZ[1], auss, 0, ry));
      fensterRahmen(S, m.steinD, LANZ[2], LANZ[3], 1, M(x, LANZ[1], E, 0, ry)); S.put(m.steinD, RH.kasten(LANZ[2] + .5, .12, .36, 3.2), M(x, LANZ[1] - .06, E - o * .1));
      RH.belege(ctx, {x0: x - 1.0, x1: x + 1.0, y0: LANZ[1] - .2, y1: H, z0: Math.min(E, E - o * .35), z1: Math.max(E, E - o * .35)}); } }
  // Halbsäulen an den Seitenwänden (Struktur bei z = ±9, ±4,5, 0) mit Gurtbögen über das Gewölbe, Zuganker, Scheitelrippe
  const P = profil();
  for (const z of [9, 4.5, 0, -4.5, -9]) {
    for (const sx of [-1, 1]) { S.cyl(m.stein, .32, .34, HY - .85, 16, sx * 7.84, .5 + (HY - .85) / 2, z).put(m.steinD, RH.kasten(.86, .5, .86, 3.2), M(sx * 7.76, .25, z)).put(m.steinD, RH.kasten(.9, .36, .9, 3.2), M(sx * 7.74, HY - .17, z));
      ctx.obstacle(sx * 7.72, z, .48); }
    for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1], L = Math.hypot(x1 - x0, y1 - y0) + .04, a = Math.atan2(y1 - y0, x1 - x0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      S.put(m.steinD, RH.kasten(L, .3, .5, 3.2), M((x0 + x1) / 2 - Math.sign(x0 + x1) * Math.abs(nx) * .12, (y0 + y1) / 2 - .12, z, 0, 0, a)); }
    S.rod(m.eisen, [-7.6, HY - .45, z], [7.6, HY - .45, z], .035, 6); }
  S.put(m.steinD, RH.kasten(.34, .22, 22, 3.2), M(0, HY + HA - .14, 0));
  // Obergaden-Fenster über den Tafelfeldern (Spitzbögen bis unter den Kämpfer), rechts mit Lichtbahnen in Sonnenrichtung
  const sonne = V(-9, -15, -3);
  for (const sx of [-1, 1]) for (const [zb, w, h, y0] of [[6.75, 1.7, 3.5, 5.95], [2.25, 1.7, 3.5, 5.95], [-2.25, 1.7, 3.5, 5.95], [-6.75, 1.7, 3.5, 5.95], [10.0, .95, 2.9, 6.4], [-10.0, .95, 2.9, 6.4]]) {
    const ry = sx < 0 ? PI / 2 : -PI / 2, x = sx * 7.97;
    S.put(m.fenster, RH.uvAufUmriss(new T3.ShapeGeometry(RH.bogenForm(w, h, 1), 8)), M(x, y0, zb, 0, ry)); fensterRahmen(S, m.steinD, w, h, 1, M(sx * 8, y0, zb, 0, ry));
    S.put(m.steinD, RH.kasten(.34, .12, w + .5, 3.2), M(sx * 7.86, y0 - .06, zb));
    RH.belege(ctx, {x0: sx < 0 ? B.x0 : B.x1 - .35, x1: sx < 0 ? B.x0 + .35 : B.x1, y0: y0 - .2, y1: H, z0: zb - w / 2 - .2, z1: zb + w / 2 + .2});
    if (sx > 0 && w > 1) { const t0 = y0 / 15, t1 = (y0 + h * .82) / 15, a = [7.85, y0, zb], b = [7.85, y0 + h * .82, zb];
      lichtbahn(S, m.strahl, a, b, [b[0] + sonne.x * t1, 0, zb + sonne.z * t1], [a[0] + sonne.x * t0, 0, zb + sonne.z * t0]); } }
  // Fahnen an den Gurtbögen über den Seitenbereichen
  for (const z of [4.5, 0, -4.5]) for (const sx of [-1, 1]) { const x = sx * 5.6, yt = gw(5.6) - .42, mat = (z === 0) === (sx < 0) ? m.fahneR : m.fahneB;
    S.put(mat, new T3.PlaneGeometry(.9, 2.7), M(x, yt - 1.42, z + .3)).rod(m.messing, [x - .55, yt, z + .3], [x + .55, yt, z + .3], .025, 6).rod(m.eisen, [x - .45, yt, z + .3], [x - .45, yt + .3, z + .1], .008, 3).rod(m.eisen, [x + .45, yt, z + .3], [x + .45, yt + .3, z + .1], .008, 3); }
  // Aufhängung des Planetenkarussells (x = 0, z = 6,2): Eisenplatte in 7,5 m, Ring und Kette zum Scheitel
  { const z = 6.2; S.cyl(m.eisen, .28, .28, .06, 16, 0, H + .03, z).put(m.eisen, new T3.TorusGeometry(.42, .03, 6, 24), M(0, H + .16, z, PI / 2));
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; S.rod(m.eisen, [Math.cos(a) * .26, H + .05, z + Math.sin(a) * .26], [Math.cos(a) * .42, H + .16, z + Math.sin(a) * .42], .012, 4).rod(m.eisen, [Math.cos(a) * .42, H + .16, z + Math.sin(a) * .42], [0, H + .55, z], .012, 4); }
    kette(S, m.eisen, 0, HY + HA - .25, H + .55, z); }
  // Laternen an den Halbsäulen (zwei sind die Punktlichter der Hülle)
  for (const sx of [-1, 1]) for (const z of [9, 4.5, 0, -4.5, -9]) { const x = sx * 7.2, y = 2.75;
    S.rod(m.eisen, [sx * 7.52, y + .45, z], [x, y + .45, z], .016, 5).cyl(m.eisen, .012, .012, .14, 4, x, y + .36, z);
    S.cyl(m.messing, .12, .09, .06, 6, x, y + .2, z).cyl(m.messing, .09, .11, .04, 6, x, y - .16, z).put(m.glas, new T3.CylinderGeometry(.09, .09, .3, 6), M(x, y + .02, z)).put(m.lampe, new T3.SphereGeometry(.04, 8, 6), M(x, y, z));
    fl.push(V(x, y, z)); laternen.push([x, y, z, -sx]);
    if ((sx < 0 && z === 4.5) || (sx > 0 && z === -4.5)) lic.push(RH.punktlicht(ctx, 0xffe2b4, 6.5, x - sx * .3, y + .3, z, {weite: 12, flackern: .15})); }
  S.build(ctx.group);
  RH.flammen(ctx, fl, 0xffd08a, .5, {flackern: false});
  // Schwebendes hoch im Gewölbe: Felsbrocken, Truhen, Bücher (langsames Schweben und Drehen)
  { const fels = [[-4.5, 9.2, -6.0, 1.1], [3.4, 10.4, -8.2, .9], [-2.2, 11.8, -2.0, .8], [4.8, 9.0, 1.2, 1.0], [-5.3, 9.6, 3.2, .85], [2.4, 11.0, 8.6, .9], [-3.0, 8.6, -9.4, .7], [1.6, 12.4, -5.2, .6]];
    const truhen = [[3.0, 8.6, -3.0], [-3.8, 10.6, -8.0], [4.2, 9.8, 6.4], [-1.8, 9.4, 4.0]];
    const buecher = [[-1.6, 9.0, -6.8], [1.8, 9.6, -2.6], [-3.2, 8.4, .4], [2.6, 8.2, 3.0], [-1.0, 10.2, 8.4], [.9, 8.1, -9.2], [-4.6, 10.8, -.8], [3.8, 11.2, -5.6]];
    const im = (geo, mat, n) => { const o = new T3.InstancedMesh(geo, mat, n); o.frustumCulled = false; o.castShadow = false; o.userData.noPick = true; ctx.group.add(o); return o; };
    const F = im(new T3.DodecahedronGeometry(.5, 0), m.fels, fels.length);
    const mit = (g, mx) => g.applyMatrix4(mx), kT = [mit(new T3.BoxGeometry(.9, .45, .55), M(0, .225, 0)), mit(new T3.CylinderGeometry(.275, .275, .9, 10, 1, false, 0, PI), M(0, .45, 0, 0, 0, PI / 2))], kE = [mit(new T3.BoxGeometry(.12, .14, .03), M(0, .4, .29))];
    for (const x of [-.32, .32]) kE.push(mit(new T3.BoxGeometry(.05, .47, .57), M(x, .235, 0)), mit(new T3.CylinderGeometry(.285, .285, .05, 10, 1, true, 0, PI), M(x, .45, 0, 0, 0, PI / 2)));
    const Tk = im(RH.merge(kT), m.holz, truhen.length), Te = im(RH.merge(kE), m.eisen, truhen.length);
    const Bu = im(new T3.BoxGeometry(.34, .08, .46), m.buch, buecher.length), Se = im(new T3.BoxGeometry(.31, .066, .44).translate(.02, 0, 0), m.seiten, buecher.length);
    const c = new T3.Color(); buecher.forEach((b, i) => { c.set(["#7a1f2b", "#1f4b6e", "#2e5a2a", "#6a4a1a", "#4a2a6a", "#8a6a22"][i % 6]); Bu.setColorAt(i, c); });
    const mx = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), p = V(), sc = V();
    const stelle = t => {
      fels.forEach(([x, y, z, s], i) => { p.set(x, y + Math.sin(t * .4 + i) * .18, z); e.set(t * .05 + i, t * .07 + i * 2, i * .7); mx.compose(p, q.setFromEuler(e), sc.set(s * 1.1, s * .8, s)); F.setMatrixAt(i, mx); });
      truhen.forEach(([x, y, z], i) => { p.set(x, y + Math.sin(t * .5 + i * 2) * .15, z); e.set(Math.sin(t * .3 + i) * .15, i * 1.3 + t * .04, Math.sin(t * .35 + i) * .12); mx.compose(p, q.setFromEuler(e), sc.set(1, 1, 1)); Tk.setMatrixAt(i, mx); Te.setMatrixAt(i, mx); });
      buecher.forEach(([x, y, z], i) => { p.set(x, y + Math.sin(t * .6 + i * 1.7) * .12, z); e.set(.3 + Math.sin(t * .4 + i) * .25, t * .09 + i, Math.sin(t * .5 + i) * .2); mx.compose(p, q.setFromEuler(e), sc.set(1, 1, 1)); Bu.setMatrixAt(i, mx); Se.setMatrixAt(i, mx); });
      for (const o of [F, Tk, Te, Bu, Se]) o.instanceMatrix.needsUpdate = true; };
    stelle(0); if (!RH.reduziert) ctx.tick((dt, t) => stelle(t)); }
  RH.huelle(ctx, {saeuleX: [B.x0 + .2, B.x1 - .2], fackeln: laternen});
  return H;
}
RH.raum.kraft1 = {
  licht: {hintergrund: 0xcfc6b8, nebel: [0xd6ccbc, .01], himmel: [0xfff6e8, 0x9a8a70, 1.35], umgebung: [0xfff2e0, .38], sonne: [0xfff0d2, 1.9, [9, 15, 3]]},
  shell: hallenShell,
  ambient: {kerzen: 14, staub: 300, staubFarbe: 0xfff0c4, steigen: .012},
  station: {text: {color: "#4a2808"}},   // heller Sandstein: dunkle Schrift auf den Stationsschildern
  dekor: {deck: ["kommode:waage", "gewichte", "regal", "ruestung", "truhe", "leuchter", "regal", "kommode", "globus", "armillar"], tief: ["truhe", "bank", "anrichte", "truhe"],
    ohne: ["Vorhänge", "Kronleuchter", "Kunst"], buecher: 9}
};

/* =====================================================================
   kraft2 · Rampe am Schlossberg
   ===================================================================== */
const hoehe = (x, z) => { const u = Math.min(1, Math.max(0, (-z - 12) / 30)), s = u * u * (3 - 2 * u), seite = Math.max(0, 1 - (x / 64) ** 2);
  return -.06 + 14 * s * seite + 4 * Math.exp(-((x - 6) ** 2) / 260 - ((z + 50) ** 2) / 140) + .6 * Math.sin(x * .25 + 1) * s; };
const rampeTex = {
  himmel: () => RH.tex("rs-himmel", 1024, 512, (g, w, h) => { const r = RH.seeded(801);
    g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#141a44"], [.18, "#2c3070"], [.32, "#6a4c8a"], [.41, "#c87a7a"], [.47, "#f0a060"], [.5, "#f8c070"], [.53, "#a07858"], [1, "#4a3a2a"]]); g.fillRect(0, 0, w, h);
    const su = .639 * w, sv = .455 * h; g.fillStyle = RH.rad(g, su, sv, 0, 170, [[0, "rgba(255,246,210,1)"], [.06, "rgba(255,226,150,.95)"], [.25, "rgba(255,170,90,.45)"], [1, "rgba(255,140,80,0)"]]); g.fillRect(su - 170, sv - 170, 340, 340);
    for (let i = 0; i < 26; i++) { const x = r() * w, y = h * (.28 + r() * .17), lw = 40 + r() * 120, lh = 4 + r() * 7, near = Math.abs(x - su) < 260;   // Schleierwolken, unten angestrahlt
      g.fillStyle = near ? "rgba(255,190,130,.55)" : `rgba(${200 + r() * 40},${120 + r() * 40},${140 + r() * 30},.45)`; g.beginPath(); g.ellipse(x, y, lw, lh, 0, 0, 7); g.fill();
      g.fillStyle = "rgba(80,60,110,.25)"; g.beginPath(); g.ellipse(x + lw * .1, y - lh * .6, lw * .8, lh * .5, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${.3 + r() * .6})`; g.fillRect(r() * w, r() * h * .2, 1.4, 1.4); } }),
  huegel: () => RH.tex("rs-kulisse", 1024, 256, (g, w, h) => { const r = RH.seeded(802); g.clearRect(0, 0, w, h);
    const kamm = (base, amps, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) { let y = base; amps.forEach(([a, f, ph]) => { y -= a * Math.sin(2 * PI * f * x / w + ph); }); g.lineTo(x, y); } g.lineTo(w, h); g.closePath(); g.fill(); };
    kamm(h * .52, [[34, 3, 2.2], [18, 7, .4], [8, 15, 1]], "#8a6e9a"); kamm(h * .66, [[18, 2, 1.1], [10, 6, 2.6]], "#6a5478"); kamm(h * .76, [[10, 4, .3], [6, 9, 1.9]], "#4a3c56");
    for (let x = 0; x < w; x += 5) { const y = h * .8 - 5 * Math.sin(2 * PI * 5 * x / w + 1.3); const q = 3 + r() * 5; g.fillStyle = "#2c2436"; g.beginPath(); g.ellipse(x, y - q * .6, q * .7, q * 1.3, 0, 0, 7); g.fill(); g.fillRect(x - q * .7, y - q * .6, q * 1.4, h * .1); }
    g.fillStyle = "#3e3428"; g.fillRect(0, h * .84, w, h * .16); }),
  erde: () => RH.tex("rs-erde", 1024, 1024, (g, w, h) => { const r = RH.seeded(803); g.fillStyle = "#6a5642"; g.fillRect(0, 0, w, h);
    RH.flecken(g, w, h, 30000, .35, ["#4a3a2a", "#7a6650", "#5a4a38", "#8a7860"], r);
    for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, q = 30 + r() * 80; g.fillStyle = RH.rad(g, x, y, 0, q, [[0, r() < .5 ? "rgba(40,30,20,.25)" : "rgba(140,120,90,.2)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q); }
    for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, q = 30 + r() * 60, P = [];   // flache Felsplatten im Erdboden
      for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2, f = .65 + r() * .4; P.push([x + Math.cos(a) * q * f, y + Math.sin(a) * q * f * .7]); }
      g.beginPath(); P.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fillStyle = `hsl(${28 + r() * 14},${6 + r() * 6}%,${38 + r() * 14}%)`; g.fill();
      g.strokeStyle = "rgba(30,22,16,.6)"; g.lineWidth = 3; g.stroke(); g.save(); g.clip(); g.fillStyle = RH.lin(g, 0, y - q, 0, y + q, [[0, "rgba(255,255,255,.18)"], [1, "rgba(0,0,0,.25)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q);
      for (let k = 0; k < 3; k++) { g.strokeStyle = "rgba(20,15,10,.35)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + (r() - .5) * q, y + (r() - .5) * q * .6); g.lineTo(x + (r() - .5) * q, y + (r() - .5) * q * .6); g.stroke(); } g.restore(); }
    for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h, q = 2 + r() * 6; g.fillStyle = `hsl(${25 + r() * 20},${8 + r() * 10}%,${30 + r() * 30}%)`; g.beginPath(); g.ellipse(x, y, q, q * (.6 + r() * .4), r() * 3, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.ellipse(x - q * .2, y - q * .25, q * .5, q * .3, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 160; i++) { const x = r() * w, y = r() * h; g.strokeStyle = `hsla(${60 + r() * 30},${30 + r() * 20}%,${28 + r() * 16}%,.8)`; g.lineWidth = 1.5;
      for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 14, y - 6 - r() * 12); g.stroke(); } } }),
  pflaster: () => RH.tex("rs-pflaster", 512, 512, (g, w, h) => { const r = RH.seeded(804); g.fillStyle = "#3a332c"; g.fillRect(0, 0, w, h); const n = 8, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n + 1; i++) { const x = (i - (j % 2) * .5) * s, y = j * s, l = 34 + r() * 22;
      g.fillStyle = `hsl(${28 + r() * 16},${6 + r() * 8}%,${l}%)`; g.beginPath(); g.roundRect(x + 3 + r() * 2, y + 3 + r() * 2, s - 7, s - 7, 14); g.fill();
      g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.ellipse(x + s * .4, y + s * .35, s * .25, s * .15, 0, 0, 7); g.fill(); } }),
  berg: () => RH.tex("rs-berg", 1024, 1024, (g, w, h) => { const r = RH.seeded(805); g.fillStyle = "#7c8042"; g.fillRect(0, 0, w, h);
    RH.flecken(g, w, h, 40000, .35, ["#5a6630", "#94904e", "#a08850", "#6a7238"], r);
    // Felsbrocken klein und hell mit Schattenkante (die Textur überspannt 130 × 56 m: große graue Ovale lasen sich am Hang wie Löcher oder Pfützen)
    for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h, q = 3 + r() * 5, l = 56 + r() * 12;
      g.fillStyle = `hsl(36,10%,${l - 22}%)`; g.beginPath(); g.ellipse(x, y + q * .3, q, q * .62, 0, 0, 7); g.fill(); g.fillStyle = `hsl(38,12%,${l}%)`; g.beginPath(); g.ellipse(x, y, q * .85, q * .5, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 260; i++) { const x = r() * w, y = h * r(), q = 4 + r() * 7, hu = 95 + r() * 30, sa = 25 + r() * 15, l = 20 + r() * 8;   // Büsche mit hellerer Krone
      g.fillStyle = `hsl(${hu},${sa}%,${l}%)`; g.beginPath(); g.arc(x, y, q, 0, 7); g.fill(); g.fillStyle = `hsl(${hu},${sa}%,${l + 12}%)`; g.beginPath(); g.arc(x - q * .15, y - q * .3, q * .55, 0, 7); g.fill(); }
    const weg = [[512, 1030], [560, 940], [450, 840], [620, 720], [490, 600], [610, 470], [559, 330]];   // Serpentinen hinauf zur Burg (x = 6 m, v = 0,69)
    for (const [lw, col] of [[34, "#6a5a42"], [24, "#b8a07a"]]) { g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = g.lineCap = "round"; g.beginPath(); weg.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } }),
  stein: () => RH.tex("rs-stein", 1024, 1024, (g, w, h) => RH.quader(g, w, h, RH.seeded(807), {lagen: 9, h: [28, 14, 50], streu: 10, spanne: 10, breite: 1.7, fugeFarbe: "#3a3028", koernung: .3})),
  burg: () => RH.tex("rs-burg", 1024, 512, (g, w, h) => RH.burgMaler(g, w, h, {stein: "#6c6478", dach: "#3a3452", licht: "#ffd27a", fahne: "#b8323a", basis: .92, seed: 17}), false)
};
function rampeMat(){ return {
  erde: RH.mat("k2-erde", () => RH.std({map: rampeTex.erde(), roughness: .96})),
  weite: RH.mat("k2-weite", () => RH.std({map: rampeTex.erde(), color: 0x9a9a7a, roughness: 1})),
  pflaster: RH.mat("k2-pflaster", () => RH.std({map: rampeTex.pflaster(), roughness: .85})),
  berg: RH.mat("k2-berg", () => RH.std({map: rampeTex.berg(), roughness: 1})),
  stein: RH.mat("k2-stein", () => RH.std({map: rampeTex.stein(), roughness: .9})),
  steinD: RH.mat("k2-steind", () => RH.std({map: rampeTex.stein(), color: 0xbfb2a4, roughness: .92})),
  bretter: RH.mat("k2-bretter", () => RH.std({map: KIT.tex.wood(false), color: 0xd8c0a0, roughness: .85})),
  schiefer: RH.mat("k2-schiefer", () => RH.std({color: 0x3e3e58, roughness: .7})),
  dunkel: RH.mat("k2-dunkel", () => RH.std({color: 0x140f0c, roughness: 1})),
  lampe: RH.mat("k2-lampe", () => RH.basic({color: 0xffd090})),
  holz: KIT.mat("wood"), holzD: KIT.mat("darkwood"), eisen: KIT.mat("metal"), glas: KIT.mat("glass")
}; }
const BALKEN2 = [5.2, 2.5, -1.5];   // Querbalken des Holzgerüsts in 7,14 … 7,6 m: Federleuchte (5,2), Schild (−1,5), Flaschenzug der Ausstattung (2,5); die vordere Federleuchte (−7,2) hängt am Längsbalken
function rampeShell(ctx){
  const B = ctx.bounds, m = rampeMat(), S = RH.sammler(), fl = [], fackeln = [], laternen = [];
  RH.boden(ctx, m.erde, {uS: 6, vS: 6});
  RH.weite(ctx, m.weite, {uS: 8});
  RH.himmel(ctx, rampeTex.himmel(), 60); RH.sterne(ctx, {n: 420, r: 55, min: .42, seed: 31, groesse: 1.7});
  RH.kulisse(ctx, rampeTex.huegel(), {r: 55, y0: -1.5, y1: 12, wdh: 2});
  { const g = new T3.PlaneGeometry(130, 56, 52, 28); g.rotateX(-PI / 2); g.translate(0, 0, -39.5); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, hoehe(p.getX(i), p.getZ(i))); g.computeVertexNormals();
    const b = new T3.Mesh(g, m.berg); b.receiveShadow = true; b.userData.noPick = b.userData.noOcc = true; ctx.group.add(b); }
  RH.karte(ctx, rampeTex.burg(), 6, 24.8, -50, 32, 16);
  // gepflasterte Rampe auf dem Gang mit Randsteinen
  S.put(m.pflaster, RH.uvMal(new T3.PlaneGeometry(3.0, 22), 3.0 / 1.6, 22 / 1.6), M(0, .006, 0, -PI / 2));
  for (const sx of [-1, 1]) S.put(m.steinD, RH.kasten(.14, .07, 22, 1.6), M(sx * 1.57, .035, 0));
  // rechts: Burgmauer mit Zinnen und Strebepfeilern (Fackeln daran)
  { const p = [[8, B.z1], [8, B.z0]]; S.put(m.stein, RH.zug(p, [[0, 0], [0, 6.0]], {uS: 3.2, vS: 3.2})).put(m.steinD, RH.zug(p, [[.14, 0], [.14, .45], [0, .55]], {uS: 3.2, vS: 3.2}));
    S.put(m.steinD, RH.kasten(1.4, .12, 22, 3.2), M(8.7, 5.94, 0));
    for (let z = -10.25; z <= 10.3; z += 1.5) S.put(m.stein, RH.kasten(.5, .9, .9, 3.2), M(8.25, 6.45, z));
    for (const z of [9, 4.5, 0, -4.5, -9]) { S.put(m.steinD, RH.kasten(.45, 5.0, .9, 3.2), M(7.78, 2.5, z)).put(m.steinD, RH.kasten(.55, .3, 1.0, 3.2), M(7.76, 5.12, z, 0, 0, -.25));
      RH.sperre(ctx, 7.5, 8, z - .5, z + .5, 5.4);
      const lp = RH.fackel(S, fl, 7.55, 2.3, z, -1, {mat: m.eisen}); fackeln.push([7.55, 2.3, z, -1, lp]); } }
  // links: halb gebaute Mauer, Bretterwand (Tafeln) am Baugerüst mit Bühne in 5,6 m, Geländer, Leiter, Kopfband
  { const p = [[-8, B.z1], [-8, B.z0]]; S.put(m.stein, RH.zug(p, [[0, 0], [0, 2.5]], {uS: 3.2, vS: 3.2})).put(m.steinD, RH.zug(p, [[.14, 0], [.14, .45], [0, .55]], {uS: 3.2, vS: 3.2}));
    const r = RH.seeded(806); for (let z = -10.6; z < 10.6; z += .7 + r() * .5) S.put(m.stein, RH.kasten(.5, .32, .55 + r() * .3, 3.2), M(-8.3, 2.66 + (r() < .4 ? .32 : 0), z));   // lose Steine oben
    S.put(m.bretter, RH.uvMal(new T3.PlaneGeometry(21.6, 3.3), 21.6 / 1.0, 1), M(-7.955, 3.95, 0, 0, PI / 2));
    for (const y of [2.42, 5.48]) S.put(m.holz, RH.kasten(.08, .14, 21.6, 2.4), M(-7.9, y, 0));
    for (const z of [-10.8, -9, -4.5, 0, 4.5, 9, 10.8]) { S.cyl(m.holz, .1, .11, 7.14, 8, -7.75, 3.57, z).cyl(m.holz, .1, .11, 7.6, 8, -9.4, 3.8, z); S.rod(m.holz, [-7.75, 5.62, z], [-9.4, 5.62, z], .06, 6); }
    S.put(m.holz, RH.kasten(1.85, .07, 21.6, 2.4), M(-8.6, 5.68, 0)).rod(m.holz, [-7.78, 6.62, -10.8], [-7.78, 6.62, 10.8], .045, 6).rod(m.holz, [-7.78, 6.12, -10.8], [-7.78, 6.12, 10.8], .035, 6);
    S.put(m.holz, RH.kasten(.08, .18, 21.6, 2.4), M(-7.72, 5.81, 0));
    const zs = [-10.8, -9, -4.5, 0, 4.5, 9, 10.8]; for (let i = 0; i < zs.length - 1; i++) { S.rod(m.holz, [-9.4, 5.7, zs[i]], [-9.4, 7.5, zs[i + 1]], .05, 5).rod(m.holz, [-9.4, 7.5, zs[i]], [-9.4, 5.7, zs[i + 1]], .05, 5); }
    S.put(m.holz, RH.kasten(.3, .3, 21.8, 2.4), M(-7.75, 6.99, 0)).put(m.holz, RH.kasten(.3, .3, 21.8, 2.4), M(-9.4, 7.45, 0));
    // Leiter vorne links bis zur Bühne
    const lz = -9.95, unten = [-7.3, 0, lz], oben = [-7.82, 5.65, lz]; for (const dz of [-.22, .22]) S.rod(m.holz, [unten[0], 0, lz + dz], [oben[0], 6.1, lz + dz], .03, 5);
    for (let y = .3; y < 5.6; y += .32) { const x = unten[0] + (oben[0] - unten[0]) * y / 6.1; S.rod(m.holz, [x, y, lz - .22], [x, y, lz + .22], .02, 4); }
    RH.sperre(ctx, -8, -7.15, lz - .35, lz + .35);
    RH.belege(ctx, {x0: B.x0, x1: -7.5, y0: 5.45, y1: H, z0: B.z1, z1: B.z0}); }
  // Holzgerüst über dem Hof: Rähm auf der Mauerkrone rechts, Querbalken (Unterkante 7,14 m, Oberkante 7,6 m) mit Kopfbändern
  for (const z of BALKEN2) { S.put(m.holzD, RH.kasten(16.8, .46, .3, 2.4), M(.45, 7.37, z)).cyl(m.holzD, .1, .1, 1.14, 8, 8.45, 6.57, z);
    S.rod(m.holzD, [-7.75, 6.25, z], [-6.7, 7.14, z], .06, 6).rod(m.holzD, [8.45, 6.3, z], [7.35, 7.14, z], .06, 6);
    RH.belege(ctx, {x0: B.x0, x1: B.x1, y0: 7.14, y1: H, z0: z - .25, z1: z + .25}); }
  S.put(m.holzD, RH.kasten(.3, .3, 21.8, 2.4), M(8.45, 6.99, 0));
  // Längsbalken über dem Gang vom Querbalken bei −1,5 bis zum vorderen Torbau (vom Eingang aus nur von vorn zu sehen: verdeckt die Burg nicht)
  S.put(m.holzD, RH.kasten(.3, .46, 9.95, 2.4), M(0, 7.37, -6.47)).cyl(m.holzD, .12, .12, 1.0, 8, 0, 6.65, -11.25).rod(m.holzD, [0, 6.6, -11.2], [0, 7.14, -10.2], .06, 6);
  RH.belege(ctx, {x0: -.4, x1: .4, y0: 7.14, y1: H, z0: B.z1, z1: -1.5});
  // Stirnseiten: Torbau mit Zinnen um die Tür (Strebepfeiler), niedrige Zinnenmauer bis zu den Ecken, rechts runde Ecktürme mit Kegeldach
  for (const sz of [-1, 1]) { const E = sz * 11, z = d => E + sz * d;
    S.put(m.stein, RH.kasten(5.2, 6.2, .7, 3.2), M(0, 3.1, z(.35)));
    for (let i = 0; i < 4; i++) S.put(m.stein, RH.kasten(.62, .6, .7, 3.2), M(-1.95 + i * 1.3, 6.5, z(.35)));
    for (const sx of [-1, 1]) { S.put(m.steinD, RH.kasten(.5, 6.6, 1.1, 3.2), M(sx * 2.85, 3.3, z(.15))); RH.sperre(ctx, sx < 0 ? -3.1 : 2.6, sx < 0 ? -2.6 : 3.1, Math.min(E, z(-.4)), Math.max(E, z(-.4)));
      S.put(m.stein, RH.kasten(4.9, 3.4, .6, 3.2), M(sx * 5.55, 1.7, z(.3)));
      for (let x = 3.4; x < 7.9; x += 1.2) S.put(m.stein, RH.kasten(.6, .6, .6, 3.2), M(sx * x, 3.7, z(.3)));
      const lp = RH.fackel(S, fl, sx * 2.85, 3.1, z(-.4), -sz, {mat: m.eisen, achse: "z"}); fackeln.push([sx * 2.85, 3.1, z(-.4), 0, lp]); }
    S.cyl(m.stein, 1.5, 1.6, 8.6, 20, 8.7, 4.3, z(.7)).cyl(m.steinD, 1.62, 1.62, .3, 20, 8.7, 8.45, z(.7));
    const dg = new T3.ConeGeometry(1.85, 3.0, 20); S.put(m.schiefer, dg, M(8.7, 10.1, z(.7)));
    RH.sperre(ctx, 7.15, 8, Math.min(E, z(-.85)), Math.max(E, z(-.85))); }
  // Fackeln (Flammen; zwei Lichter: Laterne links am Gerüst bei z = 4,5, Fackel rechts bei z = −4,5)
  { const x = -7.3, y = 4.95, z = 4.5; S.rod(m.eisen, [-7.75, 5.5, z], [x, 5.5, z], .016, 5).cyl(m.eisen, .012, .012, .16, 4, x, 5.4, z);
    S.cyl(m.eisen, .13, .1, .05, 4, x, y + .17, z, 0, PI / 4).cyl(m.eisen, .1, .12, .04, 4, x, y - .15, z, 0, PI / 4).put(m.glas, new T3.BoxGeometry(.16, .26, .16), M(x, y, z)).put(m.lampe, new T3.SphereGeometry(.05, 8, 6), M(x, y, z));
    fl.push(V(x, y, z)); laternen.push([x, y, z, 1]); RH.punktlicht(ctx, 0xffc98a, 6, x + .35, y - .3, z, {weite: 12, flackern: .25}); }
  { const f = fackeln.find(([x, , z]) => x > 7 && z === -4.5); if (f) RH.punktlicht(ctx, 0xffb070, 8, f[4][0], f[4][1], f[4][2], {weite: 12}); }
  S.build(ctx.group);
  RH.flammen(ctx, fl, 0xffa040, .85);
  RH.huelle(ctx, {saeuleX: [B.x0 + .25], fackeln: [...fackeln.filter(([, , , d]) => d).map(([x, y, z, d]) => [x, y - .05, z, d]), ...laternen], balken: [2.5]});
  return H;
}
RH.raum.kraft2 = {
  licht: {hintergrund: 0x4a3e6a, nebel: [0xa8807c, .011], himmel: [0xc4b0e4, 0x5a4432, 1.2], umgebung: [0xffd8b8, .34], sonne: [0xffb478, 1.75, [10, 8, -12]]},
  shell: rampeShell,
  ambient: {kerzen: 0, staub: 70, staubFarbe: 0xffc890, steigen: .02},
  dekor: {deck: ["gewichte", "tonne", "frachtkisten", "quader", "karren", "tonne", "heuballen", "frachtkisten"], tief: ["quader", "tonne", "frachtkisten", "heuballen"],
    ohne: ["Vorhänge", "Kronleuchter", "Kunst", "Bücher", "Kugeln", "Wappen"], vorher: [["Draußen", (D, Hd) => RH.draussenStuecke(Hd)]]}
};
})();
