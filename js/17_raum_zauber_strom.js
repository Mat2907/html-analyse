/* ---------- 17_raum_zauber_strom.js ---------- */
/* =====================================================================
   Raumthemen der Zauberschule · Strom (Werkzeug und Felder: 17_raum_zauber.js)
   strom1 „Turm der Blitze“: Turmzimmer aus Bruchstein mit runden Stirnseiten (Apsiden), Kegeldach aus Balken mit Zugbalken in 7,5 m,
     hohe Spitzbogenfenster mit Gewitterhimmel, alle paar Sekunden ein sanfter Blitz (Fenster, Raumlicht, Puls im Kupfer-Blitzableiter),
     Treppe an der Turmwand mit Tür nach oben, Blitzlaternen, Kupferring mit Blitzen im Boden, kühl-violettes Licht
   strom2 „Kerker der Schaltkreise“: Tonnengewölbe mit Gurtbögen über grobem, feuchtem Mauerwerk, nasser glänzender Boden mit Pfützen,
     vergitterte Zellen hinter den Stirnwänden (mondhell, damit sich das Gitter vom Eingang aus abhebt), kleine Gitterfenster hoch oben mit Mondlicht, Ketten an den Pfeilern, grüne Fackeln,
     Wassertropfen; Ausstattung: Fässer, Pritschen, Kisten, Eimer statt Bücherregalen
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.kits || !R3D.kits.zauber || !R3D.kits.zauber.raumHilfe) return;
const KIT = R3D.kits.zauber, RH = KIT.raumHilfe, PI = Math.PI, M = RH.M, H = RH.H, V = (x, y, z) => new T3.Vector3(x, y, z);

/* =====================================================================
   strom1 · Turm der Blitze
   ===================================================================== */
const TA = 2.6, TX = 5.4, TZ = 2.4, TS = 8.6, YA = 12.2, YL = 7.66;   // Apsiden: gerade Stirn |x| < 2,6, Viertelellipsen 5,4 × 2,4 bis z = ±8,6; Dachspitze, Mauerlatte
// Ellipsenpunkt einer Apsis (sx, sz = ±1: Viertel), Winkel a → {x, z, nx, nz (Innennormale), ry (Drehung, damit +z lokal in den Raum zeigt)}
function ell(sx, sz, a){ const cx = sx * TA, cz = sz * TS, x = cx + TX * Math.cos(a), z = cz + TZ * Math.sin(a);
  let nx = -TZ * Math.cos(a), nz = -TX * Math.sin(a); const L = Math.hypot(nx, nz); nx /= L; nz /= L; return {x, z, nx, nz, ry: Math.atan2(nx, nz)}; }
const zApsis = (sz) => x => { const u = (Math.abs(x) - TA) / TX; return sz * (TS + (u <= 0 ? TZ : TZ * Math.sqrt(Math.max(0, 1 - u * u)))); };
function turmUmriss(n = 10){
  return [...RH.bogen(TA, -TS, TX, TZ, -PI / 2, 0, n), [8, -4.3], [8, 0], [8, 4.3], ...RH.bogen(TA, TS, TX, TZ, 0, PI / 2, n),
    ...RH.bogen(-TA, TS, TX, TZ, PI / 2, PI, n), [-8, 4.3], [-8, 0], [-8, -4.3], ...RH.bogen(-TA, -TS, TX, TZ, PI, 1.5 * PI, n)]
    .filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > .01);
}
const turmTex = {
  stein: () => RH.tex("turmstein", 1024, 1024, (g, w, h) => RH.bruchstein(g, w, h, RH.seeded(711), {fuge: "#2a2826", h: [215, 5, 40], streu: 16, spanne: 40, lagen: 10})),
  // Gewitterhimmel: heller als die Mauer (sonst liest man die Fenster vom Eingang aus als Glasmalerei), dunkle Wolkenbäuche mit angestrahlten Rändern,
  // ein stehender breiter Blitz mit Ast und Schein, Regenschlieren, Hügel; die Bleiruten nur fein (grobe Rauten wirkten wie Stoff oder Buntglas)
  sturm: () => RH.tex("sturm", 256, 512, (g, w, h) => { const r = RH.seeded(77);
    g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#2c2460"], [.4, "#5a4ca6"], [.72, "#9484d4"], [.86, "#c2b4f0"], [1, "#4c4080"]]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * h * .75, q = 34 + r() * 70, d = r() < .55;
      g.fillStyle = RH.rad(g, x, y, 0, q, [[0, d ? "rgba(22,16,44,.62)" : `rgba(${170 + r() * 50},${160 + r() * 40},${230 + r() * 25},.5)`], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - q, y - q, 2 * q, 2 * q);
      if (d) { g.fillStyle = RH.rad(g, x, y + q * .55, 0, q * .7, [[0, "rgba(214,200,255,.32)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - q, y, 2 * q, 1.3 * q); } }   // angestrahlter Wolkenrand
    for (let i = 0; i < 3; i++) { const x = r() * w, y = h * (.25 + r() * .4); g.fillStyle = RH.rad(g, x, y, 0, 80, [[0, "rgba(235,225,255,.6)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - 80, y - 80, 160, 160); }
    const zacke = (x, y, n, dx, dy) => { const p = [[x, y]]; for (let i = 0; i < n; i++) { x += dx + (r() - .5) * 34; y += dy * (.7 + r() * .6); p.push([x, y]); } return p; };
    const strich = (p, b) => { g.lineJoin = g.lineCap = "round"; for (const [lw, col, blur] of [[11 * b, "rgba(190,165,255,.55)", 24], [4.5 * b, "#ffffff", 8]]) { g.strokeStyle = col; g.lineWidth = lw; g.shadowColor = "#cbb8ff"; g.shadowBlur = blur;
      g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } g.shadowBlur = 0; };
    { const p = zacke(w * .6, 0, 10, -3, h * .085); strich(p, 1); strich(zacke(p[3][0], p[3][1], 4, 16, h * .06), .55); strich(zacke(p[6][0], p[6][1], 3, -15, h * .05), .45); }
    g.strokeStyle = "rgba(220,215,255,.16)"; g.lineWidth = 1; for (let i = 0; i < 170; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 24); g.stroke(); }
    g.fillStyle = "#0b0912"; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .93 - Math.abs(Math.sin(x * .06)) * 18); g.lineTo(w, h); g.fill();
    g.strokeStyle = "rgba(18,14,26,.5)"; g.lineWidth = 1.5; const s = 64, k = h / 2.4;   // Bleiruten (Rauten), fein
    for (let x = -h; x < w + h; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + k, h); g.moveTo(x, 0); g.lineTo(x - k, h); g.stroke(); }
    g.strokeStyle = "rgba(18,14,26,.9)"; g.lineWidth = 10; g.strokeRect(0, 0, w, h); }),
  blitz: () => RH.tex("blitz", 512, 512, (g, w, h) => { const r = RH.seeded(919); g.clearRect(0, 0, w, h); g.lineJoin = g.lineCap = "round";
    const bahn = (x, y, n, dx, dy) => { const p = [[x, y]]; for (let i = 0; i < n; i++) { x += dx + (r() - .5) * 46; y += dy * (.7 + r() * .6); p.push([x, y]); } return p; };
    const zeichne = (p, b) => { for (const [lw, col, blur] of [[9 * b, "rgba(170,140,255,.85)", 22], [3 * b, "#ffffff", 6]]) { g.shadowColor = "#b49cff"; g.shadowBlur = blur; g.strokeStyle = col; g.lineWidth = lw;
      g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } g.shadowBlur = 0; };
    for (let k = 0; k < 3; k++) { const x0 = (k + .5) * w / 3, p = bahn(x0 + (r() - .5) * 40, -5, 12, 0, h / 11); zeichne(p, 1);
      for (let b = 0; b < 2; b++) { const q = p[2 + ((r() * 6) | 0)]; zeichne(bahn(q[0], q[1], 4, (r() < .5 ? -1 : 1) * 14, h / 16), .55); } } }),
};
function turmMat(){ return {
  stein: RH.mat("s1-stein", () => RH.std({map: turmTex.stein(), color: 0xd4d8e6, roughness: .93})),
  steinD: RH.mat("s1-steind", () => RH.std({map: turmTex.stein(), color: 0x8c90a0, roughness: .95})),
  boden: RH.mat("s1-boden", () => RH.std({map: KIT.tex.flag(), color: 0xaeb2c6, roughness: .82})),
  fenster: RH.mat("s1-fenster", () => RH.basic({map: turmTex.sturm(), color: 0xffffff})),
  dach: RH.mat("s1-dach", () => RH.std({map: KIT.tex.wood(false), color: 0xb09a86, roughness: .8, emissive: 0xb09478, emissiveMap: KIT.tex.wood(false), emissiveIntensity: .9})),
  balken: RH.mat("s1-balken", () => RH.std({map: KIT.tex.wood(true), roughness: .8, emissive: 0x6a5444, emissiveMap: KIT.tex.wood(true), emissiveIntensity: .6})),
  stufe: RH.mat("s1-stufe", () => RH.std({map: KIT.tex.stone(), color: 0xe6dccc, roughness: .85})),
  blitz: RH.mat("s1-blitz", () => RH.additiv({map: turmTex.blitz(), opacity: 0, fog: true})),
  kristall: RH.mat("s1-kristall", () => RH.basic({color: 0xd4c6ff})), licht: RH.mat("s1-spalt", () => RH.basic({color: 0xffc070})),
  // Kupfer leuchtet ein wenig selbst: im kühl-violetten Turm hebt sich der Blitzableiter sonst kaum von der Mauer ab
  kupfer: RH.mat("s1-kupfer", () => RH.std({color: 0xd27a42, metalness: .75, roughness: .3, emissive: 0x7a3414, emissiveIntensity: .9})),
  holz: KIT.mat("darkwood"), eisen: KIT.mat("metal"), glas: KIT.mat("glass")
}; }
function turmFenster(S, m, x, z, ry, y0, w, h, k){
  const glas = RH.uvAufUmriss(new T3.ShapeGeometry(RH.bogenForm(w, h, 1), 6)), bl = RH.uvAufUmriss(new T3.ShapeGeometry(RH.bogenForm(w, h, 1), 6)), uv = bl.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (k + uv.getX(i)) / 3);
  const ring = RH.bogenForm(w + .3, h + .17, 1); ring.holes.push(RH.bogenForm(w, h, 1));
  const rahmen = new T3.ExtrudeGeometry(ring, {depth: .24, bevelEnabled: false, curveSegments: 6}); rahmen.translate(0, 0, -.14); RH.uvAufUmriss(rahmen); U8uv(rahmen, (w + .3) / 3.6, (h + .17) / 3.6);
  S.put(m.fenster, glas, M(x, y0, z, 0, ry)).put(m.blitz, bl, M(x, y0, z, 0, ry).multiply(M(0, 0, .012))).put(m.stein, rahmen, M(x, y0, z, 0, ry));
  S.put(m.stein, RH.kasten(w + .4, .12, .34, 3.6), M(x, y0 - .07, z, 0, ry).multiply(M(0, 0, .08)));
}
function U8uv(g, sx, sy){ const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); }

function turmShell(ctx){
  const B = ctx.bounds, m = turmMat(), S = RH.sammler(), umr = turmUmriss(10);
  RH.boden(ctx, m.boden, {uS: 3.2, vS: 3.2});
  // Turmwand, Sockel, Mauerlatte
  S.put(m.stein, RH.zug(umr, [[0, 0], [0, 7.95]], {zu: true, uS: 3.6, vS: 3.6}));
  S.put(m.steinD, RH.zug(umr, [[.16, 0], [.16, .42], [0, .54]], {zu: true, uS: 3.6, vS: 3.6}));
  S.put(m.holz, RH.zug(umr, [[0, 7.28], [.34, 7.28], [.34, YL]], {zu: true, uS: 2.4, vS: 2.4}));
  // Wandpfeiler an den Seitenwänden mit Kragsteinen unter der Mauerlatte
  for (const sx of [-1, 1]) for (const z of [8.75, 4.5, 0, -4.5, -8.75]) { const w = Math.abs(z) > 8 ? .5 : .7;
    S.put(m.stein, RH.kasten(.28, 7.28, w, 3.6), M(sx * 7.86, 3.64, z)).put(m.steinD, RH.kasten(.46, .32, w + .14, 3.6), M(sx * 7.77, 7.1, z)); }
  // Kegeldach: Dachhaut (Bretter) als Fächer zur Spitze, Sparren, zwei Pfettenringe, Zugbalken in 7,5 m (daran hängt der Kronleuchter), Hängesäulen und Streben
  const n = umr.length, ins = .3, R0 = umr.map(([x, z]) => { const L = Math.hypot(x, z); return [x - x / L * ins, z - z / L * ins]; });
  { const pos = [], nor = [], uv = []; let u = 0; const a = V(0, YA, 0), e1 = V(), e2 = V(), nn = V();
    for (let i = 0; i < n; i++) { const p = R0[i], q = R0[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]), b = V(p[0], YL, p[1]), c = V(q[0], YL, q[1]);
      e1.subVectors(b, a); e2.subVectors(c, a); nn.crossVectors(e1, e2).normalize(); const sl = e1.length() / 2.4;
      const tri = nn.y > 0 ? [[a, (u + L / 2) / 2.4, sl], [c, (u + L) / 2.4, 0], [b, u / 2.4, 0]] : [[a, (u + L / 2) / 2.4, sl], [b, u / 2.4, 0], [c, (u + L) / 2.4, 0]];
      if (nn.y > 0) nn.negate();
      for (const [v, uu, vv] of tri) { pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); uv.push(uu, vv); } u += L; }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2));
    S.put(m.dach, g); }
  const spitze = [0, YA - .32, 0];
  R0.forEach(([x, z]) => S.rod(m.balken, [x, YL - .1, z], spitze, .085, 5));
  for (const t of [.34, .67]) { const ring = R0.map(([x, z]) => [x + (0 - x) * t, YL - .14 + (YA - .4 - YL) * t, z + (0 - z) * t]);
    ring.forEach((p, i) => S.rod(m.balken, p, ring[(i + 1) % n], .065, 5)); }
  const dachY = z => YA - .3 - (YA - YL) * Math.abs(z) / (11 - ins);
  for (const z of [4.2, 0, -4.5]) { S.put(m.balken, RH.kasten(15.5, .36, .3, 2.4), M(0, 7.62, z));
    S.put(m.balken, RH.kasten(.26, dachY(z) - 7.8, .26, 2.4), M(0, (dachY(z) + 7.8) / 2, z));
    for (const s of [-1, 1]) S.rod(m.balken, [s * 3.2, 7.8, z], [0, Math.min(dachY(z) - .4, 7.8 + 2.2), z], .07, 5); }
  // Fenster mit Gewitterhimmel (Spitzbögen in den Apsiden), Rundfenster über den Türen
  const fen = [[-1, -1, PI + .38, 0], [-1, -1, PI + 1.12, 1], [1, -1, 2 * PI - .38, 2], [1, 1, .38, 0], [1, 1, 1.12, 1], [-1, 1, PI - .38, 2], [-1, 1, PI - 1.12, 0]];
  for (const [sx, sz, a, k] of fen) { const e = ell(sx, sz, a); turmFenster(S, m, e.x + e.nx * .06, e.z + e.nz * .06, e.ry, 3.8, .95, 3.15, k); }
  for (const sz of [-1, 1]) { const z = sz * (11 - .03), ry = sz < 0 ? 0 : PI, c = new T3.CircleGeometry(.55, 24); RH.uvAufUmriss(c);
    S.put(m.fenster, c, M(0, 6.62, z, 0, ry)).put(m.stein, new T3.TorusGeometry(.6, .08, 6, 24), M(0, 6.62, z, 0, ry)); }
  // Treppe an der Turmwand (vorne rechts) mit Absatz und kleiner Tür
  const nSt = 13, aEnd = 1.5 * PI + .21, dA = (2 * PI - aEnd) / nSt, yTop = 3.43, tiefe = 1.05;
  const stufe = (a0, a1, y, tf, dick = .24) => { const p0 = ell(1, -1, a0), p1 = ell(1, -1, a1), am = ell(1, -1, (a0 + a1) / 2), w = Math.hypot(p1.x - p0.x, p1.z - p0.z) + .05;
    const cx = am.x + am.nx * (tf / 2 + .02), cz = am.z + am.nz * (tf / 2 + .02);
    S.put(m.stufe, RH.kasten(w, dick, tf, 2.4), M(cx, y - dick / 2, cz, 0, am.ry)).put(m.steinD, RH.kasten(w * .6, .3, tf * .45, 3.6), M(am.x + am.nx * tf * .25, y - dick - .15, am.z + am.nz * tf * .25, 0, am.ry));
    // Gehen und Ausstattung: Grundriss der Stufe (achsparallel umschlossen), darüber Kopfraum
    const cs = Math.abs(Math.cos(am.ry)), sn = Math.abs(Math.sin(am.ry)), hx = (w * cs + tf * sn) / 2, hz = (w * sn + tf * cs) / 2;
    ctx.obstacleBox(cx, cz, 2 * hx, 2 * hz); RH.belege(ctx, {x0: cx - hx, x1: cx + hx, y0: 0, y1: Math.min(H, y + 2.3), z0: cz - hz, z1: cz + hz});
    return am; };
  const gel = [];
  for (let i = 0; i < nSt; i++) { const a0 = 2 * PI - i * dA, a1 = a0 - dA, am = stufe(a1, a0, (i + 1) * yTop / (nSt + 1), tiefe); if (i % 2 === 0) gel.push([am, (i + 1) * yTop / (nSt + 1)]); }
  const lan = stufe(1.5 * PI + .01, aEnd, yTop, 1.15, .26); gel.push([lan, yTop]);
  const pf = gel.map(([e, y]) => [e.x + e.nx * (tiefe - .07), y, e.z + e.nz * (tiefe - .07)]);
  pf.forEach(([x, y, z]) => S.cyl(m.eisen, .02, .02, .95, 6, x, y + .475, z));
  S.put(m.eisen, new T3.TubeGeometry(new T3.CatmullRomCurve3(pf.map(([x, y, z]) => V(x, y + .95, z))), 48, .025, 6));
  { const e = ell(1, -1, 1.5 * PI + .11), x = e.x + e.nx * .03, z = e.z + e.nz * .03, t = new T3.ShapeGeometry(RH.bogenForm(.8, 1.95, 0), 8); RH.uvAufUmriss(t); U8uv(t, .8 / 1.4, 1.95 / 1.4);
    S.put(m.holz, t, M(x, yTop, z, 0, e.ry));
    const ring = RH.bogenForm(1.06, 2.1, 0); ring.holes.push(RH.bogenForm(.8, 1.95, 0)); const rr = new T3.ExtrudeGeometry(ring, {depth: .2, bevelEnabled: false, curveSegments: 8}); rr.translate(0, 0, -.12); RH.uvAufUmriss(rr);
    S.put(m.stein, rr, M(x, yTop, z, 0, e.ry));
    for (const y of [.45, 1.3]) S.put(m.eisen, new T3.BoxGeometry(.76, .06, .03), M(x, yTop + y, z, 0, e.ry).multiply(M(0, 0, .02)));
    S.put(m.eisen, new T3.TorusGeometry(.07, .015, 6, 14), M(x, yTop + .95, z, 0, e.ry).multiply(M(.25, 0, .04)));
    S.put(m.licht, new T3.PlaneGeometry(.74, .035), M(x, yTop + .02, z, 0, e.ry).multiply(M(0, 0, .015)));   // warmer Lichtspalt unter der Tür
    const lx = x + Math.cos(e.ry) * -.62 + e.nx * .22, lz = z - Math.sin(e.ry) * -.62 + e.nz * .22;   // Laterne neben der Tür
    S.rod(m.eisen, [x - Math.cos(e.ry) * .62, yTop + 2.0, z + Math.sin(e.ry) * .62], [lx, yTop + 2.0, lz], .015, 5).put(m.glas, new T3.BoxGeometry(.14, .2, .14), M(lx, yTop + 1.82, lz, 0, e.ry));
    ctx._turmTuer = V(lx, yTop + 1.82, lz); }
  // Blitzableiter aus Kupfer: von der Dachspitze am Sparren entlang, die Turmwand hinunter zur Erdungsplatte
  const ea = ell(-1, -1, PI + .75), wx = ea.x + ea.nx * .08, wz = ea.z + ea.nz * .08;
  const ab = [[0, YA - .55, 0], [ea.x * .9, YL + .25 - .3, ea.z * .9], [ea.x + ea.nx * .45, 7.15, ea.z + ea.nz * .45], [wx, 6.75, wz], [wx, .12, wz], [wx + ea.nx * .55, .03, wz + ea.nz * .55]];
  // kräftiges Kupferseil (vom Eingang aus sonst nur ein haarfeiner Strich) mit Gelenkkugeln, Mauerhaken in kurzen Abständen, unten die Erdungsplatte
  for (let i = 0; i < ab.length - 1; i++) S.rod(m.kupfer, ab[i], ab[i + 1], .075, 8);
  ab.slice(1, -1).forEach(p => S.put(m.kupfer, new T3.SphereGeometry(.11, 10, 8), M(...p)));
  for (let y = .7; y < 6.7; y += .75) S.put(m.eisen, new T3.BoxGeometry(.26, .08, .22), M(wx - ea.nx * .02, y, wz - ea.nz * .02, 0, ea.ry));
  S.put(m.kupfer, new T3.BoxGeometry(.7, .03, .7), M(wx + ea.nx * .55, .015, wz + ea.nz * .55, 0, ea.ry)).cyl(m.eisen, .045, .045, .3, 6, wx + ea.nx * .55, .15, wz + ea.nz * .55);
  RH.belege(ctx, {x0: Math.min(wx, wx + ea.nx * .9) - .35, x1: Math.max(wx, wx + ea.nx * .9) + .35, y0: 0, y1: H, z0: Math.min(wz, wz + ea.nz * .9) - .35, z1: Math.max(wz, wz + ea.nz * .9) + .35});
  // Kupferring mit Blitzen im Boden um das Mittelstück
  { const rg = (r0, r1) => new T3.RingGeometry(r0, r1, 72); S.put(m.kupfer, rg(3.0, 3.1), M(0, .006, -1.5, -PI / 2)).put(m.kupfer, rg(3.86, 3.92), M(0, .006, -1.5, -PI / 2));
    const zz = new T3.Shape(); [[0, .06], [.3, .1], [.25, .01], [.62, .07], [.5, -.03], [.75, 0], [.42, -.1], [.47, -.02], [.12, -.08], [.18, .0]].forEach(([x, y], i) => i ? zz.lineTo(x, y) : zz.moveTo(x, y));
    for (let k = 0; k < 8; k++) { const a = k * PI / 4 + PI / 8; S.put(m.kupfer, new T3.ShapeGeometry(zz), M(Math.cos(a) * 3.12, .007, -1.5 + Math.sin(a) * 3.12, -PI / 2, -a, 0)); } }
  // Blitzlaternen (die zwei Punktlichter der Hülle) an den Pfeilern
  const fl = [], lic = [];
  for (const [sx, z] of [[-1, 4.5], [1, -4.5]]) { const xw = sx * 7.72, x = sx * 7.3, y = 2.35;
    S.rod(m.eisen, [xw, y + .3, z], [x, y + .3, z], .02, 6).cyl(m.eisen, .02, .02, .16, 6, x, y + .22, z);
    S.cyl(m.eisen, .15, .13, .04, 4, x, y + .14, z, 0, PI / 4).cyl(m.eisen, .13, .15, .04, 4, x, y - .16, z, 0, PI / 4);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; S.cyl(m.eisen, .012, .012, .3, 4, x + Math.cos(a) * .12, y, z + Math.sin(a) * .12); }
    S.put(m.glas, new T3.BoxGeometry(.19, .28, .19), M(x, y, z)).put(m.kristall, new T3.OctahedronGeometry(.07, 0), M(x, y, z, 0, .4, 0, 1, 1.6, 1));
    fl.push(V(x, y, z)); lic.push(RH.punktlicht(ctx, 0xc4b6ff, 7, x + sx * -.25, y + .2, z, {weite: 11, flackern: .3})); }
  RH.flammen(ctx, fl, 0xb9a6ff, .7, {flackern: false}); if (ctx._turmTuer) RH.flammen(ctx, [ctx._turmTuer], 0xffb060, .55);
  S.build(ctx.group);
  // Bereiche hinter den Apsiden sperren (Gehen, Ausstattung)
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) RH.aussen(ctx, zApsis(sz), sx < 0 ? -8 : TA, sx < 0 ? -TA : 8, sz < 0 ? B.z1 : B.z0, {tiefe: .25});
  RH.belege(ctx, {x0: -.75, x1: .75, y0: 6.0, y1: H, z0: B.z1, z1: B.z1 + .3}); RH.belege(ctx, {x0: -.75, x1: .75, y0: 6.0, y1: H, z0: B.z0 - .3, z1: B.z0});
  for (const z of [4.2, 0, -4.5]) RH.belege(ctx, {x0: B.x0, x1: B.x1, y0: 7.4, y1: H, z0: z - .2, z1: z + .2});
  RH.huelle(ctx, {pz: [8.75, 4.5, 0, -4.5, -8.75], saeuleX: [B.x0 + .14, B.x1 - .14], fackeln: [[-7.72, 2.15, 4.5, 1], [7.72, 2.15, -4.5, -1]]});
  ctx._turm = {m, lic, ableiter: ab};
  return H;
}
// Gewitter: alle 6–11 s ein kurzer, weicher Blitz (Anstieg 0,07 s, Abklingen ~0,6 s; nie schneller als einmal in mehreren Sekunden)
function turmStimmung(ctx){
  const T = ctx._turm, L = ctx.weltLicht; if (!T || !L || !L.basis) return;
  const r = RH.seeded(4711), k = RH.reduziert ? .35 : 1, b = L.basis, tex = T.m.blitz.map;
  const pts = T.ableiter.map(p => V(...p)), seg = []; let tot = 0; for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); seg.push(l); tot += l; }
  const pg = new T3.BufferGeometry().setFromPoints([V(0, -50, 0)]), pm = new T3.PointsMaterial({map: R3D.util.glowTex(), color: 0xd8ccff, size: .55, transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false});
  const puls = new T3.Points(pg, pm); puls.frustumCulled = false; puls.userData.noPick = true; ctx.group.add(puls);
  let next = 2.5 + r() * 2, t0 = -99;
  ctx.tick((dt, t) => {
    if (t > next && t - next < 1) { t0 = t; next = t + 6 + r() * 5; if (tex) tex.offset.x = (tex.offset.x + 1 / 3) % 1; }
    else if (t - next > 1) next = t + 2;   // Zeitsprung (Vorschau, Hintergrund): neu ansetzen
    const u = t - t0, f = u < 0 ? 0 : u < .07 ? u / .07 : Math.exp(-(u - .07) / .22), fk = f * k;
    L.hemi.intensity = b.h * (1 + .45 * fk); L.dir.intensity = b.d * (1 + .35 * fk);
    T.m.fenster.color.setScalar(1 + 1.3 * fk); T.m.blitz.opacity = Math.min(1, 1.3 * fk);
    for (const l of T.lic) l.userData.schub = .5 * fk;
    const s = (u - .05) / .9; if (s > 0 && s < 1) { let d = s * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const p = pg.attributes.position; p.setXYZ(0, ...pts[i].clone().lerp(pts[i + 1], Math.min(1, d / seg[i])).toArray()); p.needsUpdate = true; pm.opacity = .9 * k * (1 - s * .6); } else pm.opacity = 0;
  });
}
RH.raum.strom1 = {
  licht: {hintergrund: 0x07060f, nebel: [0x110f1e, .018], himmel: [0xcacbe8, 0x4a4458, 1.25], umgebung: [0xe2def2, .3], sonne: [0xdedcf2, 1.55, [-4, 14, -9]]},
  shell: turmShell,
  ambient: {kerzen: 18, staub: 200, staubFarbe: 0xcdbfff, steigen: .04},
  stimmung: turmStimmung,
  dekor: {deck: ["kommode:blitz", "saeule", "traenke", "leuchter", "regal", "globus", "kommode", "leuchter", "truhe"], tief: ["truhe", "anrichte", "bank", "bank"],
    ohne: ["Vorhänge", "Wappen", "Kronleuchter"], buecher: 5}
};

/* =====================================================================
   strom2 · Kerker der Schaltkreise
   ===================================================================== */
const KR = 17, KC = H - KR, KS = 5.5;   // Tonnengewölbe: Kreis mit r = 17 m, Scheitel 7,5 m über dem Gang (dort hängen die Leuchten), Kämpfer 5,5 m an den Seitenwänden
const yG = x => KC + Math.sqrt(KR * KR - x * x);
const ZX = 6.0, ZW = 1.6, ZT = 2.6, ZH = 3.0;   // Zellen hinter den Stirnwänden: Mitte |x| = 6, halbe Breite 1,6, Tiefe 2,6, Kämpfer der Bogenöffnung 3,0
const kerkerTex = {
  stein: () => RH.tex("kerkerstein", 1024, 1024, (g, w, h) => RH.bruchstein(g, w, h, RH.seeded(1312), {fuge: "#1c1e1a", h: [60, 7, 36], streu: 14, spanne: 50, lagen: 8, nass: true, moos: true})),
  env: () => { const t = RH.tex("kerker-env", 256, 128, (g, w, h) => { g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#3a4a46"], [.35, "#4e625a"], [.5, "#2a3a34"], [1, "#0a0f0d"]]); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) { const x = (i + .5) * w / 8, y = h * .46; g.fillStyle = RH.rad(g, x, y, 0, 14, [[0, "rgba(190,255,215,1)"], [.4, "rgba(90,220,140,.6)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - 14, y - 14, 28, 28); }
      g.fillStyle = RH.rad(g, w * .5, h * .25, 0, 30, [[0, "rgba(200,215,255,.8)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(w * .5 - 30, h * .25 - 30, 60, 60); }, false);
    t.mapping = T3.EquirectangularReflectionMapping; return t; },
  mond: () => RH.tex("kerker-mond", 128, 128, (g, w, h) => { g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "#1a2850"], [1, "#2c3f6e"]]); g.fillRect(0, 0, w, h);
    g.fillStyle = RH.rad(g, w * .62, h * .35, 0, 44, [[0, "rgba(255,255,240,1)"], [.3, "rgba(230,236,255,.9)"], [1, "rgba(120,140,200,0)"]]); g.fillRect(0, 0, w, h); }, false),
  strahl: () => RH.tex("mondstrahl", 64, 256, (g, w, h) => { const gr = RH.lin(g, 0, 0, 0, h, [[0, "rgba(255,255,255,.9)"], [.6, "rgba(255,255,255,.35)"], [1, "rgba(255,255,255,0)"]]);
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "destination-in"; g.fillStyle = RH.lin(g, 0, 0, w, 0, [[0, "rgba(0,0,0,0)"], [.3, "#000"], [.7, "#000"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over"; }, false)
};
function kerkerMat(){ return {
  stein: RH.mat("s2-stein", () => RH.std({map: kerkerTex.stein(), color: 0xd6dcd2, roughness: .9})),
  gewoelbe: RH.mat("s2-gewoelbe", () => RH.std({map: kerkerTex.stein(), color: 0xc8d0c6, roughness: .9, emissive: 0x58665e, emissiveMap: kerkerTex.stein(), emissiveIntensity: .8})),
  // Zellen: vom Mond beschienen, deutlich heller als der Gang – so heben sich die Gitterstäbe vom Eingang aus als Gitter ab
  zelle: RH.mat("s2-zelle", () => RH.std({map: kerkerTex.stein(), color: 0x8a9290, roughness: .95, side: T3.DoubleSide, emissive: 0x7c8cb4, emissiveMap: kerkerTex.stein(), emissiveIntensity: 1.6})),
  mondfleck: RH.mat("s2-mondfleck", () => RH.additiv({map: R3D.util.glowTex(), color: 0x9fb4e8, opacity: .55})),
  boden: RH.mat("s2-boden", () => RH.std({map: KIT.tex.flag(), color: 0x7d887f, roughness: .3, metalness: .12, envMap: kerkerTex.env()})),
  pfuetze: RH.mat("s2-pfuetze", () => RH.std({color: 0x6a8a88, roughness: .03, metalness: .85, envMap: kerkerTex.env(), transparent: true, opacity: .55, depthWrite: false})),
  stroh: RH.mat("s2-stroh", () => RH.std({color: 0x9c844a, roughness: 1, emissive: 0x2a2416})),
  decke: RH.mat("s2-decke", () => RH.std({color: 0x46392e, roughness: 1})),
  mond: RH.mat("s2-mond", () => RH.basic({map: kerkerTex.mond()})),
  strahl: RH.mat("s2-strahl", () => RH.additiv({map: kerkerTex.strahl(), color: 0x8ea4d8, opacity: .16, side: T3.DoubleSide})),
  holz: KIT.mat("darkwood"), eisen: KIT.mat("metal")
}; }
// Kette aus Gliedern von p nach unten (n Glieder), am Ende eine offene Schelle
function kette(S, m, x, y, z, n, ry = 0){ const tg = new T3.TorusGeometry(.045, .012, 4, 8);
  S.put(m, new T3.TorusGeometry(.08, .016, 5, 14), M(x, y, z, 0, ry));
  for (let i = 0; i < n; i++) S.put(m, tg.clone(), M(x, y - .1 - i * .075, z, 0, ry + (i % 2 ? PI / 2 : 0), 0, 1, 1.35, 1));
  S.put(m, new T3.TorusGeometry(.07, .016, 5, 12, PI * 1.6), M(x, y - .14 - n * .075, z, 0, ry, PI * .7)); tg.dispose(); }
function lichtStrahl(S, m, a, b, w){   // flaches Lichtband von a nach b (zeigt zur Raummitte), Breite w
  const d = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), g = new T3.PlaneGeometry(w, L); g.translate(0, -L / 2, 0);
  const q = new T3.Quaternion().setFromUnitVectors(V(0, -1, 0), d.normalize()); S.put(m, g, new T3.Matrix4().compose(V(...a), q, V(1, 1, 1))); }
function stirnForm(){ const s = new T3.Shape(); s.moveTo(-8, 0); s.lineTo(8, 0); for (let i = 0; i <= 32; i++) { const x = 8 - 16 * i / 32; s.lineTo(x, yG(x)); } s.lineTo(-8, 0);
  for (const cx of [-ZX, ZX]) { const p = new T3.Path(); p.moveTo(cx - ZW, .02); p.lineTo(cx + ZW, .02); p.lineTo(cx + ZW, ZH); p.absarc(cx, ZH, ZW, 0, PI, false); p.lineTo(cx - ZW, .02); s.holes.push(p); }
  for (const cx of [-3.1, 3.1]) { const p = new T3.Path(); p.moveTo(cx - .32, 5.85); p.lineTo(cx + .32, 5.85); p.lineTo(cx + .32, 6.45); p.absarc(cx, 6.45, .32, 0, PI, false); p.lineTo(cx - .32, 5.85); s.holes.push(p); }
  return s; }
function kerkerShell(ctx){
  const B = ctx.bounds, m = kerkerMat(), S = RH.sammler();
  RH.boden(ctx, m.boden, {uS: 3.0, vS: 3.0});
  for (const [x, z, a, b] of [[-3.2, 5.5, 1.1, .6], [2.8, -5.2, .9, .5], [-1.0, 8.6, .7, .45], [4.3, 9.4, .8, .5], [-4.4, -9.8, .9, .45], [1.3, -8.5, .6, .4], [-6.6, -1.2, .7, .5], [6.4, 3.6, .6, .4]])
    S.put(m.pfuetze, new T3.CircleGeometry(1, 20), M(x, .005, z, -PI / 2, 0, 0, a, b, 1));
  // Seitenwände, Kämpfergesims, Tonnengewölbe, Stirnwände mit Zellenöffnungen und Fensterchen
  for (const sx of [-1, 1]) { const p = [[sx * 8, B.z1], [sx * 8, B.z0]];
    S.put(m.stein, RH.zug(p, [[0, 0], [0, KS + .1]], {uS: 3.2, vS: 3.2})).put(m.stein, RH.zug(p, [[0, KS - .16], [.2, KS - .08], [.2, KS + .1]], {uS: 3.2, vS: 3.2})); }
  { const n = 28, a0 = Math.asin(8 / KR), pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) { const a = -a0 + 2 * a0 * i / n, x = KR * Math.sin(a), y = KC + KR * Math.cos(a), v = KR * (a + a0) / 3.2;
      for (const z of [B.z1, B.z0]) { pos.push(x, y, z); nor.push(-Math.sin(a), -Math.cos(a), 0); uv.push(z / 3.2, v); } }
    for (let i = 0; i < n; i++) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 2, b + 3, b + 1); }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    S.put(m.gewoelbe, g); }
  for (const sz of [-1, 1]) { const g = new T3.ShapeGeometry(stirnForm(), 10); U8uv(g, 1 / 3.2, 1 / 3.2); S.put(m.stein, g, sz < 0 ? M(0, 0, B.z1) : M(0, 0, B.z0, 0, PI)); }
  // Gurtbögen und Wandpfeiler (Struktur bei z = ±9, ±4,5, 0), dazu Fackelhalter und Ketten an den Pfeilern
  const fl = [], kern = [], fackeln = [];
  for (const z of [9, 4.5, 0, -4.5, -9]) {
    const n = 20, a0 = Math.asin(7.7 / KR);
    for (let i = 0; i < n; i++) { const aa = -a0 + 2 * a0 * i / n, ab = -a0 + 2 * a0 * (i + 1) / n, am = (aa + ab) / 2, r = KR - .17, L = (KR - .17) * (ab - aa) + .03;
      S.put(m.gewoelbe, RH.kasten(L, .34, .62, 3.2), M(r * Math.sin(am), KC + r * Math.cos(am), z, 0, 0, -am)); }
    for (const sx of [-1, 1]) { S.put(m.stein, RH.kasten(.3, KS + .2, .62, 3.2), M(sx * 7.85, (KS + .2) / 2, z)).put(m.stein, RH.kasten(.46, .26, .78, 3.2), M(sx * 7.77, KS - .02, z));
      const lp = RH.fackel(S, fl, sx * 7.7, 2.2, z, -sx, {mat: m.eisen}); kern.push(fl[fl.length - 1].clone().add(V(0, -.06, 0))); fackeln.push([sx * 7.7, 2.2, z, -sx, lp]);
      kette(S, m.eisen, sx * 7.66, 1.4, z, 7, PI / 2); } }
  // Zellen hinter den Stirnwänden: Gitter, Gewölbe, Stroh, Pritsche, Eimer, Ketten, Fensterchen mit Mondstrahl
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    const cx = sx * ZX, E = sz * 11, o = sz, zm = E + o * ZT / 2, zb = E + o * ZT, ry = sz < 0 ? 0 : PI;
    S.put(m.stroh, new T3.PlaneGeometry(2 * ZW, ZT), M(cx, .004, zm, -PI / 2));
    const rw = new T3.ShapeGeometry(RH.bogenForm(2 * ZW, ZH + ZW, 0), 8); U8uv(rw, 1 / 3.2, 1 / 3.2); S.put(m.zelle, rw, M(cx, 0, zb, 0, ry));
    for (const s of [-1, 1]) { const g = new T3.PlaneGeometry(ZT, ZH); U8uv(g, ZT / 3.2, ZH / 3.2); S.put(m.zelle, g, M(cx + s * ZW, ZH / 2, zm, 0, PI / 2)); }
    const gw = new T3.CylinderGeometry(ZW, ZW, ZT, 12, 1, true, PI / 2, PI); U8uv(gw, 1.6, .8); S.put(m.zelle, gw, M(cx, ZH, zm, PI / 2));
    for (let x = -ZW + .14; x < ZW - .05; x += .2) { const top = ZH + Math.sqrt(Math.max(0, ZW * ZW - x * x)) - .04; S.cyl(m.eisen, .03, .03, top, 6, cx + x, top / 2, E - o * .06); }
    S.put(m.mondfleck, new T3.PlaneGeometry(2.6, 2.2), M(cx - sx * .2, .02, E + o * 1.2, -PI / 2)).put(m.mondfleck, new T3.PlaneGeometry(2.4, 2.6), M(cx, 2.2, zb - o * .05, 0, ry));   // Mondlicht am Zellenboden und an der Rückwand
    for (const y of [.2, 1.15, 2.3]) S.box(m.eisen, 2 * ZW, .06, .035, cx, y, E - o * .06);
    S.box(m.eisen, .14, .2, .08, cx + .35 * sx, 1.15, E - o * .1);
    const bx = cx - sx * (ZW - .4);
    S.box(m.holz, .7, .07, 1.9, bx, .48, zm).box(m.holz, .62, .05, .05, bx, .2, zm - .8).box(m.holz, .62, .05, .05, bx, .2, zm + .8);
    for (const dz of [-.85, .85]) for (const dx of [-.28, .28]) S.box(m.holz, .06, .45, .06, bx + dx, .225, zm + dz);
    S.box(m.stroh, .6, .08, 1.7, bx, .555, zm).box(m.decke, .62, .03, .7, bx, .6, zm + .4);
    S.put(m.stroh, new T3.SphereGeometry(.5, 8, 6), M(cx + sx * .9, .05, zb - o * .5, 0, .4, 0, 1, .28, 1.2));
    S.cyl(m.holz, .17, .15, .3, 10, cx + sx * .9, .15, E + o * .6, 0, 0, 0, true).put(m.eisen, new T3.TorusGeometry(.165, .01, 4, 14), M(cx + sx * .9, .22, E + o * .6, PI / 2));
    kette(S, m.eisen, cx + .5, 2.3, zb - o * .05, 9, 0); kette(S, m.eisen, cx + .9, 2.3, zb - o * .05, 9, 0);
    S.put(m.mond, new T3.PlaneGeometry(.46, .5), M(cx, 3.75, zb - o * .03, 0, ry)); for (const dx of [-.12, 0, .12]) S.box(m.eisen, .025, .52, .025, cx + dx, 3.75, zb - o * .05);
    lichtStrahl(S, m.strahl, [cx, 3.75, zb - o * .05], [cx - sx * .3, 0, E + o * .5], .5);
    RH.belege(ctx, {x0: cx - ZW - .15, x1: cx + ZW + .15, y0: 0, y1: ZH + ZW + .15, z0: Math.min(E, E - o * .55), z1: Math.max(E, E - o * .55)}); }
  // Fensterchen hoch in den Stirnwänden: Laibung, Mondhimmel, Gitter, Mondstrahl in den Raum
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) { const x = sx * 3.1, E = sz * 11, o = sz, ry = sz < 0 ? 0 : PI;
    S.put(m.mond, new T3.PlaneGeometry(.7, 1.0), M(x, 6.3, E + o * .5, 0, ry));
    for (const s of [-1, 1]) S.box(m.stein, .05, 1.0, .5, x + s * .34, 6.3, E + o * .25); S.box(m.stein, .7, .05, .5, x, 5.84, E + o * .25).box(m.stein, .7, .05, .5, x, 6.8, E + o * .25);
    for (const dx of [-.16, 0, .16]) S.box(m.eisen, .03, .95, .03, x + dx, 6.3, E + o * .08); S.box(m.eisen, .66, .03, .03, x, 6.2, E + o * .08);
    lichtStrahl(S, m.strahl, [x, 6.15, E - o * .02], [x * .62, 0, E - o * 6.2], .75);
    RH.belege(ctx, {x0: x - .55, x1: x + .55, y0: 5.6, y1: 7.0, z0: Math.min(E, E - o * .3), z1: Math.max(E, E - o * .3)}); }
  // lange Ketten mit Haken vom Gewölbe über den Seitenbereichen (über der Sichtlinie zu den Tafeln)
  for (const sx of [-1, 1]) for (const z of [6.2, -1.8, -6.8]) { const x = sx * 4.6, y0 = yG(x) - .05, n = Math.round((y0 - 5.2) / .075);
    kette(S, m.eisen, x, y0, z, n, sx * .7); S.put(m.eisen, new T3.TorusGeometry(.09, .018, 5, 12, PI * 1.3), M(x, y0 - .2 - n * .075, z, 0, sx * .7, PI * .85));
    RH.belege(ctx, {x0: x - .25, x1: x + .25, y0: 4.9, y1: H, z0: z - .25, z1: z + .25}); }
  // Ketten an der Rückwand neben der Tür
  for (const sx of [-1, 1]) { kette(S, m.eisen, sx * 3.6, 2.5, B.z0 - .05, 11, 0); kette(S, m.eisen, sx * 3.95, 2.5, B.z0 - .05, 11, 0);
    RH.belege(ctx, {x0: sx * 3.78 - .35, x1: sx * 3.78 + .35, y0: 1.2, y1: 2.7, z0: B.z0 - .25, z1: B.z0}); }
  S.build(ctx.group);
  RH.flammen(ctx, fl, 0x5dff9a, .8); RH.flammen(ctx, kern, 0xe8fff0, .28);
  const lic = fackeln.filter(([x, , z]) => (x < 0 && z === 4.5) || (x > 0 && z === -4.5)).map(([, , , , p]) => RH.punktlicht(ctx, 0xa6ffd0, 9.5, p[0], p[1], p[2], {weite: 12}));
  RH.huelle(ctx, {saeuleX: [B.x0 + .15, B.x1 - .15], fackeln: fackeln.map(([x, y, z, d]) => [x, y - .05, z, d])});
  for (const z of [9, 4.5, 0, -4.5, -9]) RH.belege(ctx, {x0: B.x0, x1: B.x1, y0: 7.0, y1: H, z0: z - .35, z1: z + .35});
  ctx._kerker = {lic};
  return H;
}
// Wassertropfen fallen aus dem Gewölbe (ein Points-Objekt)
function kerkerStimmung(ctx){
  const r = RH.seeded(2024), n = 16, q = [];
  for (let i = 0; i < n; i++) { let x = (r() - .5) * 13; if (Math.abs(x) < 1.8) x += x < 0 ? -1.8 : 1.8; q.push({x, z: (r() - .5) * 19, y0: yG(x) - .12, t: r() * 4, w: 1.5 + r() * 3.5}); }
  const pos = new Float32Array(n * 3), g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(pos, 3));
  const p = new T3.Points(g, new T3.PointsMaterial({color: 0xcff6ff, size: .045, transparent: true, opacity: .75, depthWrite: false}));
  p.frustumCulled = false; p.userData.noPick = true; ctx.group.add(p);
  ctx.tick((dt) => { q.forEach((d, i) => { d.t += dt; const s = d.t - 1.2; let y = d.y0;
    if (s > 0) { y = d.y0 - 4.9 * s * s; if (y < 0) { d.t = -d.w; y = d.y0; } } pos[i * 3] = d.x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = d.z; });
    g.attributes.position.needsUpdate = true; });
}
// Kerkermöbel für die Ausstattung (Wandkoordinaten: x entlang der Wand, z in den Raum, y nach oben)
function kerkerStuecke(Hd){
  const {M: m, box, cyl, sph, tor, STUECK} = Hd; if (STUECK.fass) return;
  const fassGeo = () => new T3.LatheGeometry([[0, 0], [.27, 0], [.31, .2], [.33, .45], [.31, .7], [.27, .9], [0, .9]].map(([x, y]) => new T3.Vector2(x, y)), 12);
  const fass = (K, x, z, y = 0, rot = 0) => { K.put("wood", fassGeo(), m(x, y, z, 0, rot)); for (const [h, rr] of [[.1, .29], [.45, .335], [.8, .29]]) K.put("iron", tor(rr, .012, 4, 16), m(x, y + h, z, PI / 2));
    K.put("atlas", cyl(.26, .26, .01, 12), m(x, y + .9, z), "#3a2a1c"); };
  STUECK.fass = {min: .75, max: 1.6, h: 1.0, d: .72, off: .05, bau: (D, w) => { const n = w > 1.35 ? 2 : 1; for (let i = 0; i < n; i++) fass(D.K, n > 1 ? (i - .5) * .74 : 0, .36, 0, D.r() * 6); }};
  STUECK.pritsche = {min: 1.6, max: 2.0, h: .7, d: .8, off: .05, bau: (D, w) => { const K = D.K;
    K.put("wood", box(w, .07, .72), m(0, .46, .4)); for (const sx of [-1, 1]) for (const z of [.1, .7]) K.put("wood", box(.07, .43, .07), m(sx * (w / 2 - .08), .215, z));
    K.put("atlas", box(w - .18, .09, .6), m(0, .545, .4), "#a88b4c").put("atlas", box(.8, .035, .64), m(w * .15, .6, .4), "#4b3d33").put("atlas", sph(.16, 8, 6), m(-w / 2 + .32, .62, .4, 0, 0, 0, 1.4, .5, 1), "#c9b27a");
    K.put("iron", tor(.06, .012, 4, 10), m(-w / 2 + .2, .9, .01)); }};
  STUECK.kisten = {min: .8, max: 1.4, h: 1.25, d: .7, off: .05, bau: (D, w) => { const K = D.K, kiste = (x, y, z, s, ry) => { const t = (a, b, c, xx, yy, zz) => K.put("atlas", box(a, b, c), m(x, y, z, 0, ry).multiply(m(xx, yy, zz)), "#4a3220");
      K.put("wood", box(s, s, s), m(x, y + s / 2, z, 0, ry)); for (const sy of [-1, 1]) { t(s + .02, .06, s + .02, 0, s / 2 + sy * (s / 2 - .04), 0); } t(.06, s, s + .02, 0, s / 2, 0); };
    kiste(-w / 2 + .36, 0, .36, .66, 0); if (w > 1.1) kiste(w / 2 - .3, 0, .33, .56, .3); kiste(-w / 2 + .4, .66, .34, .5, .5); }};
  STUECK.eimer = {min: .6, max: .7, h: .65, d: .5, off: .05, bau: (D) => { const K = D.K;
    K.put("wood", cyl(.17, .14, .32, 10, true), m(-.12, .16, .25)).put("iron", tor(.165, .01, 4, 14), m(-.12, .25, .25, PI / 2)).put("iron", tor(.15, .008, 4, 12, PI), m(-.12, .32, .25, 0, 0, 0));
    K.put("wood", cyl(.18, .18, .05, 10), m(.18, .45, .25)); for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; K.put("wood", cyl(.025, .025, .45, 5), m(.18 + Math.cos(a) * .12, .22, .25 + Math.sin(a) * .12)); } }};
}
RH.raum.strom2 = {
  licht: {hintergrund: 0x040706, nebel: [0x0c1210, .02], himmel: [0xbccac4, 0x56625a, 1.3], umgebung: [0xd8e6e0, .3], sonne: [0xc8d4ff, 1.4, [-3, 13, -13]]},
  shell: kerkerShell,
  // Rücktür: Schild knapp über den Türflügeln. Die vier Hängeleuchten des Raums (20_strom2.js, 4,25 m über dem Gang bei z = 2 … 7,4) stehen vom vorderen
  // Ende aus hintereinander zwischen 8° und 17° Höhe vor der Rückwand – darunter bleibt das Schild frei, darüber nicht
  tuer: {hinten: 3.88},
  ambient: {kerzen: 0, staub: 150, staubFarbe: 0xa8f0c8, steigen: .03},
  stimmung: kerkerStimmung,
  dekor: {deck: ["fass", "pritsche", "kessel", "kisten", "fass", "truhe", "pritsche", "kisten", "fass"], tief: ["fass", "eimer", "truhe", "kisten"],
    ohne: ["Vorhänge", "Wappen", "Kronleuchter", "Kunst", "Bücher", "Kugeln"], vorher: [["Kerkermöbel", (D, Hd) => kerkerStuecke(Hd)]]}
};
})();
