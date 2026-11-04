/* ---------- 17_raum_detektiv_aussen.js ---------- */
/* =====================================================================
   Raumthemen „Detektei“ – Bauhilfen für Räume unter freiem Himmel (beweg1 Hof, kraft1 Kai, kraft2 Hügel) und gemeinsame Kleinteile
   KIT.raum17.aussen = {himmelMalen, kuppel, kulisse, ast, baum, krone, laternenPfahl, latten, TXA, MA}
   • himmelMalen(g, w, h, r, o) zeichnet ein Himmelsbild (Equirect 2:1, oben Zenit, Mitte Horizont): o.verlauf [[stop, farbe] …], o.dunst (Horizont),
     o.sonne [u, v, radius, "r,g,b"], o.wolken {n, farbe, schatten, band: [v0, v1]}. u = 0,75 liegt vorn (−z), 0/1 links (−x), 0,25 hinten, 0,5 rechts.
   • kuppel(A, key, tex) – Himmelskugel (r 70, Innenseite, ohne Nebel und Licht); kulisse(A, key, tex, o) – Zylinderstück mit Fernsicht (Alpha), ohne Nebel.
   • baum(K, o, r) – Baum aus verjüngten Ästen (Sammler "rinde") und Laubkarten ("laub"); o.aeste = [[punkte, r0, r1] …], o.kronen = [[x, y, z, radius, n] …].
   • laternenPfahl(K, x, z, o) – Gaslaterne auf gusseisernem Pfahl (Sammler "eisen", "glasL", "flamme"); liefert die Lage der Flamme.
   Alle Texturen/Materialien einmal angelegt (userData.keep), Schlüssel "r17-…".
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D, KIT = R3D && R3D.kits && R3D.kits.detektiv;
if (!T3 || !KIT || !KIT.raum17 || !KIT._h) return;
const H_ = KIT._h, {U, TAU, M, S, KB} = H_, R17 = KIT.raum17, {mt, ctex, hsl, blob} = R17;
const PI = Math.PI, V3 = (x, y, z) => new T3.Vector3(x, y, z);

/* ---------- Himmel ---------- */
function himmelMalen(g, w, h, r, o){
  const hz = h / 2, gr = g.createLinearGradient(0, 0, 0, hz); o.verlauf.forEach(([s, c]) => gr.addColorStop(s, c)); g.fillStyle = gr; g.fillRect(0, 0, w, hz + 2);
  g.fillStyle = o.unten || o.verlauf[o.verlauf.length - 1][1]; g.fillRect(0, hz, w, h - hz);
  if (o.sonne) { const [u, v, rad, c] = o.sonne; for (const dx of [-w, 0, w]) { const x = u * w + dx, y = v * h; if (x < -rad * 9 || x > w + rad * 9) continue;
      blob(g, x, y, rad * 9, rad * 6, `rgba(${c},.28)`); blob(g, x, y, rad * 3, rad * 2.6, `rgba(${c},.55)`); blob(g, x, y, rad, rad, "rgba(255,252,240,1)"); } }
  const wk = o.wolken; if (wk) for (let i = 0; i < wk.n; i++) {
    const [v0, v1] = wk.band || [.12, .46], v = v0 + (v1 - v0) * Math.pow(r(), .8), y = v * h, k = 1 + (.5 - v) * 5, cx = r() * w;   // je höher, desto breiter (Equirect)
    const L = (40 + r() * 90) * k, Hh = (8 + r() * 16) * (.6 + (.5 - v) * 2), n = 5 + (r() * 7 | 0);
    for (let j = 0; j < n; j++) { const x = cx + (r() - .5) * L * 1.6, yy = y + (r() - .5) * Hh * .8, rx = L * (.25 + r() * .3), ry = Hh * (.5 + r() * .5);
      for (const dx of [-w, 0, w]) { const X = x + dx; if (X < -rx * 2 || X > w + rx * 2) continue;
        if (wk.schatten) blob(g, X, yy + ry * .35, rx, ry * .8, wk.schatten); blob(g, X, yy, rx, ry, wk.farbe); } } }
  if (o.dunst) { const d = g.createLinearGradient(0, hz * .62, 0, hz + 6); d.addColorStop(0, `rgba(${o.dunst},0)`); d.addColorStop(.8, `rgba(${o.dunst},.75)`); d.addColorStop(1, `rgba(${o.dunst},1)`);
    g.fillStyle = d; g.fillRect(0, hz * .62, w, hz * .38 + 6); }
}
function kuppel(A, key, tex){
  const m = A.mesh(new T3.SphereGeometry(70, 40, 20), mt("kuppel-" + key, () => KB({map: tex, side: T3.BackSide, fog: false, depthWrite: false, toneMapped: false})), {receive: false});
  m.renderOrder = -10; m.userData.noPick = true; return m; }
// Fernsicht: Zylinderstück (Radius r, von Winkel a0 bis a1 um die y-Achse, a = 0 vorn/−z, positiv nach rechts/+x), Unterkante y0, Höhe hh
function kulisse(A, key, tex, o){
  const g = new T3.CylinderGeometry(o.r, o.r, o.hh, 48, 1, true, PI - o.a1, o.a1 - o.a0), uv = g.attributes.uv; g.translate(0, o.y0 + o.hh / 2, 0);
  for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));   // von innen gesehen: Bild links → links
  const m = A.mesh(g, mt("kulisse-" + key, () => KB({map: tex, side: T3.BackSide, transparent: true, alphaTest: .02, fog: false, depthWrite: false, toneMapped: false, color: o.farbe || 0xffffff})), {receive: false});
  m.renderOrder = -9; m.userData.noPick = true; return m; }

/* ---------- Bäume ---------- */
// verjüngtes Rohr entlang Punkten (Radius r0 am Anfang, r1 am Ende); TubeGeometry mit Radius 1, Ringe danach skaliert
function ast(pts, r0, r1, seg = 14, rs = 7){
  const c = new T3.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : V3(...p))), g = new T3.TubeGeometry(c, seg, 1, rs, false), p = g.attributes.position, q = V3(0, 0, 0);
  for (let i = 0; i <= seg; i++) { c.getPointAt(i / seg, q); const k = r0 + (r1 - r0) * i / seg;
    for (let j = 0; j <= rs; j++) { const n = i * (rs + 1) + j; p.setXYZ(n, q.x + (p.getX(n) - q.x) * k, q.y + (p.getY(n) - q.y) * k, q.z + (p.getZ(n) - q.z) * k); } }
  return g; }
const TXA = {
  laub: () => ctex(256, 256, "laub", (g, w, h, r) => { g.clearRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const a = r() * TAU, d = Math.pow(r(), .6) * w * .47, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d * .86;
      g.fillStyle = hsl(78 + r() * 34, 34 + r() * 26, 14 + r() * 20 + (y < h * .45 ? 9 : 0) - (d > w * .38 ? 4 : 0)); g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 3 + r() * 3, r() * PI, 0, TAU); g.fill(); } }),
  rinde: () => ctex(256, 512, "rinde", (g, w, h, r) => { g.fillStyle = "#4a4038"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = r() * w, L = 30 + r() * 140, y = r() * h; g.fillStyle = r() < .5 ? `rgba(20,16,12,${.3 + r() * .4})` : `rgba(150,140,120,${.1 + r() * .2})`;
      for (const dy of [0, -h, h]) g.fillRect(x, y + dy, 2 + r() * 5, L); }
    for (let i = 0; i < 40; i++) blob(g, r() * w, r() * h, 10 + r() * 20, 14 + r() * 30, "rgba(70,90,50,.25)"); }, [1, 1])
};
const MA = {
  rinde: () => mt("a-rinde", () => S({map: TXA.rinde(), color: 0xb0a698, roughness: .95})),
  laub: () => mt("a-laub", () => S({map: TXA.laub(), alphaTest: .45, side: T3.DoubleSide, roughness: .85, color: 0xd8e0c8})),
  eisen: () => mt("a-eisen", () => S({color: 0x1e2224, metalness: .55, roughness: .5})),
  glasL: () => mt("a-glasL", () => S({color: 0xfff2d0, emissive: 0xffc070, emissiveIntensity: 1.6, roughness: .2, transparent: true, opacity: .8})),
  flamme: () => mt("a-flamme", () => KB({color: 0xffe0a0, toneMapped: false}))
};
// Laubkarten: n gekreuzte Flächen um den Punkt (x, y, z) im Radius rad; ymin: nichts tiefer (über dem Raum)
function krone(K, x, y, z, rad, n, r, ymin = -99, s = 1.9){
  for (let i = 0; i < n; i++) { const a = r() * TAU, e = (r() - .4) * 1.2, d = Math.pow(r(), .5) * rad, yy = Math.max(ymin, y + Math.sin(e) * d * .7);
    const sz = s * (.75 + r() * .6); K.add("laub", new T3.PlaneGeometry(sz, sz), M(x + Math.cos(a) * Math.cos(e) * d, yy, z + Math.sin(a) * Math.cos(e) * d, (r() - .5) * 2.4, r() * PI, (r() - .5) * 1.4)); } }
function baum(K, o, r){
  for (const [pts, r0, r1, seg] of o.aeste) K.add("rinde", ast(pts, r0, r1, seg || 14), M(), {uv: [2, 3]});
  for (const [x, y, z, rad, n, ymin, s] of o.kronen || []) krone(K, x, y, z, rad, n, r, ymin, s); }

/* ---------- Gaslaterne auf Pfahl ---------- */
function laternenPfahl(K, x, z, o = {}){
  const h = o.h || 3.3, y0 = o.y0 || 0;
  K.add("eisen", new T3.CylinderGeometry(.16, .22, .45, 10), M(x, y0 + .225, z)); K.add("eisen", new T3.CylinderGeometry(.07, .12, .5, 10), M(x, y0 + .7, z));
  K.add("eisen", new T3.CylinderGeometry(.045, .065, h - 1.3, 8), M(x, y0 + .95 + (h - 1.3) / 2, z)); K.add("eisen", new T3.TorusGeometry(.07, .02, 4, 10), M(x, y0 + 1.05, z, PI / 2));
  const yl = y0 + h - .35; K.box("eisen", .62, .04, .04, M(x, yl - .02, z, 0, o.ry || 0)); K.add("eisen", new T3.CylinderGeometry(.09, .05, .1, 8), M(x, yl + .02, z));
  K.add("glasL", new T3.CylinderGeometry(.17, .12, .42, 4, 1, false, PI / 4), M(x, yl + .28, z)); K.add("eisen", new T3.ConeGeometry(.24, .2, 4, 1, false, PI / 4), M(x, yl + .58, z));
  for (let k = 0; k < 4; k++) { const a = PI / 4 + k * PI / 2; K.box("eisen", .02, .44, .02, M(x + Math.cos(a) * .16, yl + .28, z + Math.sin(a) * .16)); }
  K.add("eisen", new T3.SphereGeometry(.05, 8, 6), M(x, yl + .72, z)); K.add("flamme", new T3.SphereGeometry(.05, 8, 6), M(x, yl + .25, z, 0, 0, 0, 1, 1.6, 1));
  return V3(x, yl + .27, z); }
// Lattenzaun entlang einer Strecke (a → b, waagrecht): Pfosten alle ~1,8 m, zwei Riegel, Latten; Schlüssel k
function latten(K, k, a, b, o = {}){
  const h = o.h || 1.15, dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), np = Math.max(1, Math.round(L / 1.8)), sp = o.sp || .17, rr = o.r || Math.random;
  const at = (t, y, m) => M(a[0] + dx * t, y, a[1] + dz * t, 0, ry, 0).multiply(m || new T3.Matrix4());
  for (let i = 0; i <= np; i++) K.box(k, .1, h + .1, .1, at(i / np, (h + .1) / 2));
  for (const y of [h * .3, h * .78]) K.box(k, L, .07, .035, at(.5, y, M(0, 0, -.06)));
  if (o.latten !== false) for (let s = sp / 2; s < L; s += sp) { const hh = h - .06 + (rr() - .5) * .05; K.box(k, .075, hh, .02, at(s / L, hh / 2, M(0, 0, -.09)));
    K.add(k, new T3.ConeGeometry(.053, .08, 4, 1, false, PI / 4), at(s / L, hh + .04, M(0, 0, -.09, 0, 0, 0, 1, 1, .27))); } }

// Stab (Kantholz/Eisenprofil) zwischen zwei Punkten a, b (Weltkoordinaten), Querschnitt t × (t2 || t)
const _y = V3(0, 1, 0), _q = new T3.Quaternion();
function stab(K, k, a, b, t, t2, o){ const A = V3(...a), B = V3(...b), d = B.clone().sub(A), L = d.length(); _q.setFromUnitVectors(_y, d.normalize());
  K.add(k, new T3.BoxGeometry(t, L, t2 || t), new T3.Matrix4().compose(A.add(B).multiplyScalar(.5), _q, V3(1, 1, 1)), o); }
// Wandlaterne am eisernen Arm: s = Wandseite (−1 links, 1 rechts), Wand bei x = s · xw; liefert die Lage der Flamme
function wandLaterne(K, s, z, y, xw = 7.98){ const x = s * xw, d = .42;
  K.box("eisen", .1, .26, .06, M(x - s * .05, y + .3, z)); K.add("eisen", new T3.TorusGeometry(.2, .018, 4, 10, PI / 2), M(x - s * .02, y + .22, z, 0, s < 0 ? PI : 0, 0));
  stab(K, "eisen", [x, y + .42, z], [x - s * d, y + .42, z], .03);
  const cx = x - s * d; K.box("eisen", .02, .06, .02, M(cx, y + .38, z)); K.add("glasL", new T3.CylinderGeometry(.12, .085, .32, 4, 1, false, PI / 4), M(cx, y + .16, z));
  K.add("eisen", new T3.ConeGeometry(.17, .14, 4, 1, false, PI / 4), M(cx, y + .38, z)); K.add("eisen", new T3.CylinderGeometry(.06, .04, .05, 8), M(cx, y - .02, z));
  K.add("flamme", new T3.SphereGeometry(.04, 8, 6), M(cx, y + .14, z, 0, 0, 0, 1, 1.5, 1)); return V3(cx, y + .15, z); }

R17.aussen = {himmelMalen, kuppel, kulisse, ast, baum, krone, laternenPfahl, latten, stab, wandLaterne, TXA, MA};
})();
