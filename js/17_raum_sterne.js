/* ---------- 17_raum_sterne.js ---------- */
/* =====================================================================
   Raumthemen der Welt „Weltraum-Saga“ (Teil 1: Bauweise + strom1, strom2, optik1, optik2)
   Jeder Raum soll vom Eingang aus aussehen wie sein Name (RAUMTHEMEN.md). Lerninhalte, Türen, Stationen bleiben, wo sie sind.

   BAUWEISE
   Je Raum eine Beschreibung R3D.kits.sterne.raum[key] = R. Der Weltstil (11_sterne.js) und die Ausstattung (14_dekor_sterne.js) fragen sie ab;
   fehlt sie (Halle, noch nicht umgebaute Räume), bleibt alles wie bisher. Felder (alle wahlfrei):
   - licht: {bg, nebel: [farbe, dichte], himmel: [oben, unten, stärke], umgebung: [farbe, stärke], sonne: [farbe, stärke, [x, y, z]],
            decke: [[farbe, stärke, x, y, z], [farbe, stärke, x, y, z]]}
     Es bleiben immer dieselben Lichter (1 Halbkugel-, 1 Umgebungs-, 1 Richtungslicht mit Schatten, 2 Punktlichter in env, 1 Punktlicht „sweep“
     in ambient, Nebel FogExp2) – nur Farbe, Stärke, Lage ändern sich (geteilte Shader-Programme). Nie ctx.light im Weltstil benutzen.
   - umwelt(g, w, h): zeichnet die Spiegelungsumgebung (Canvas 512 × 256, equirektangular, oben = Himmel); sie wird je Raum einmal erzeugt
   - all: false (kein Weltall – Raum ohne Fenster, spart ~15 Zeichenaufrufe) oder {planet: [x, y, z], mond: [x, y, z], nebel: [[farbton, b, h, [x, y, z]]]}
   - huelle(ctx) → 7.2: baut die Raumhülle, meist über huelle(ctx, o) unten (Grundgerüst Raumschiff: Boden, Seitenwände mit Rippen bei
     z ∈ {9; 4,5; 0; −4,5; −9}, Schräge, Decke mit Öffnungen, Stirnwände mit Tür-Aussparung und Fenstern, Statusleuchten) plus o.extra für das
     Themenstück. Wirft sie einen Fehler, baut 11_sterne.js die bisherige Hülle (console.error). Die Hülle darf ctx.frei/belege NICHT aufrufen
     (die Belegung entsteht erst später): Teile, die mehr als ~0,35 m in den Raum ragen, kommen als Quader in S.belegt (S.bel(x0,x1,y0,y1,z0,z1));
     die Ausstattung belegt sie. Was am Boden steht, zusätzlich ctx.obstacleBox (zählt sofort, auch für die Lehrkraft-Tafel).
   - stimmung(ctx, sc, A): nach ambient; A = {pts, farben, geo, sweep, ship, patch, eigen}. A.eigen = true: kein vorbeifliegendes Schiff, das
     Punktlicht A.sweep gehört dem Raum (z. B. pulsierender Reaktor). ctx._licht = {hemi, amb, sonne, decke: [2 Punktlichter]} zum Animieren.
     Sanft bleiben: höchstens langsames Pulsieren, nichts schneller als 3 Hz, keine Blitze.
   - dekor: {thema(ctx, B, R, I, env, D) (sonst das bisherige THEME[key]), moebel: [...], fueller: [...] (Namen aus D.ITEMS),
            bilder: false | [Bildnummern 0–5], plakate, abzeichen, pflanzen, globus, vorhang (true/false), drohnen: n}
     D = R3D.kits.sterne.dlib (Plätze, Bündeln, vorhandene Möbel). Neue Möbel: D.ITEMS.name = {minW, maxW, d, h, build(B, w, R, I, env)}.

   NEUEN RAUM ERGÄNZEN (z. B. beweg1): in einer neuen Datei 17_raum_sterne_b.js
     const K = R3D.kits.sterne, X = K.raumLib;  K.raum.beweg1 = {licht: {...}, umwelt, huelle: ctx => X.huelle(ctx, {...}), stimmung, dekor: {...}};
   Materialien mit X.regM("bw-wand", () => new THREE.MeshStandardMaterial({...})) anmelden (Schlüssel mit Bindestrich, gecacht, keep);
   Texturen mit X.ctex(w, h, zeichnen, "bw-…", [1, 1]) (gecacht, keep). Eigene Zufallszahlen (X.zufall(seed)), nicht die des Weltstils.
   Draußen (Asteroid): huelle(ctx, {schraege: false, decke: null, …}) und im extra eigenen Boden/Begrenzung bauen – siehe Hinweise bei huelle.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D;
if (!T3 || !R3D || !R3D.kits || !R3D.kits.sterne || !R3D.kits.sterne.raum || !R3D.kits.sterne.lib || !R3D.kits.sterne.lib.wallGeo) return;
const K = R3D.kits.sterne, L = K.lib, U = R3D.util, PI = Math.PI, TAU = PI * 2, FONT = K.font;
const V3 = (x, y, z) => new T3.Vector3(x, y, z), Y1 = V3(0, 1, 0), PZ = [9, 4.5, 0, -4.5, -9];

/* ---------- Hilfen: Texturen, Materialien, Zufall ---------- */
const zufall = s => U.seeded(s);   // eigene Startwerte: der Zufall des Weltstils bleibt unberührt (Halle sieht aus wie bisher)
function ctex(w, h, draw, key, rep, lin){ const t = U.canvasTex(w, h, draw, key, rep); t.userData.keep = true; if (lin) t.colorSpace = ""; return t; }
function regM(k, make){ if (!L.M[k]) L.M[k] = () => L.imat(k, make); return k; }
const std = p => new T3.MeshStandardMaterial(p);
const addM = (col, op, extra = {}) => L.basic(Object.assign({color: col, opacity: op, side: T3.DoubleSide}, L.ADD, extra));
function streu(g, w, h, n, a, cols, r, smax = 2){ for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.globalAlpha = a * r(); const s = 1 + r() * smax; g.fillRect(r() * w, r() * h, s, s); } g.globalAlpha = 1; }
function niet(g, x, y, r = 3.2){ g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.arc(x + .8, y + .8, r, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.arc(x - .5, y - .5, r * .55, 0, 7); g.fill(); }
function warnStreifen(g, x, y, w, h, a = "#E8B923", b = "#17181b", p = 34){ g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = b; g.fillRect(x, y, w, h); g.fillStyle = a;
  for (let k = -h; k < w + h; k += p) { g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + p / 2, y + h); g.lineTo(x + k + p / 2 + h, y); g.lineTo(x + k + h, y); g.closePath(); g.fill(); } g.restore(); }
function himmel(g, w, h, stops){ const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([t, c]) => gr.addColorStop(t, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
function fleck(g, x, y, r, rgb, a){ const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function kleber(g, x, y, s, txt, bg = "#E8B923", fg = "#17181b"){ g.save(); g.translate(x, y); g.fillStyle = bg; g.beginPath(); g.roundRect(-s, -s * .32, 2 * s, s * .64, 4); g.fill();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; let f = s * .36; g.font = `700 ${f}px ${FONT}`; while (g.measureText(txt).width > 1.85 * s && f > 6) { f -= 1; g.font = `700 ${f}px ${FONT}`; } g.fillText(txt, 0, 1); g.restore(); }
function strahlZeichen(g, x, y, r, col = "#17181b"){ g.fillStyle = col; g.beginPath(); g.arc(x, y, r * .17, 0, 7); g.fill();
  for (let k = 0; k < 3; k++) { const a = -PI / 2 + k * TAU / 3; g.beginPath(); g.moveTo(x + Math.cos(a - .52) * r * .3, y + Math.sin(a - .52) * r * .3); g.arc(x, y, r, a - .52, a + .52); g.arc(x, y, r * .3, a + .52, a - .52, true); g.closePath(); g.fill(); } }
// Stab (offener Zylinder) von a nach c in Weltkoordinaten
function stabG(a, c, r, seg = 6){ const d = c.clone().sub(a), g = new T3.CylinderGeometry(r, r, d.length(), seg, 1, true); g.applyQuaternion(new T3.Quaternion().setFromUnitVectors(Y1, d.normalize())); return g.translate((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2); }
// Wandkachel 2,25 × 5,8 m (512 × 1024): Y(m) → Pixelzeile
const WY = (h, m) => (5.8 - m) / 5.8 * h;

/* ---------- Statusleuchten (instanziert, blinken langsam: jede LED höchstens alle 0,4 s) ---------- */
function leuchten(ctx, G, S, cols){
  const C = cols.map(c => new T3.Color(c)), F = c => C[((c % C.length) + C.length) % C.length];
  const dim = new T3.Color(0x14181e), o3 = new T3.Object3D(), leds = S.leds, bars = S.bars;
  if (leds.length) { const ledM = new T3.InstancedMesh(new T3.BoxGeometry(.05, .05, .02), L.basic({}), leds.length), st = leds.map(() => true);
    leds.forEach(([x, y, z, ry, c], i) => { o3.position.set(x, y, z); o3.rotation.set(0, ry, 0); o3.updateMatrix(); ledM.setMatrixAt(i, o3.matrix); ledM.setColorAt(i, F(c)); });
    G.add(ledM); let acc = 0, r = zufall(77);
    ctx.tick(dt => { acc += dt; if (acc < .4) return; acc = 0; for (let k = 0; k < 5; k++) { const i = (r() * leds.length) | 0; st[i] = !st[i] || r() < .3; ledM.setColorAt(i, st[i] ? F(leds[i][4]) : dim); } ledM.instanceColor.needsUpdate = true; }); }
  if (bars.length) { const barM = new T3.InstancedMesh(new T3.BoxGeometry(.04, 1, .015), L.basic({}), bars.length); bars.forEach((q, i) => barM.setColorAt(i, C[i % 5 === 4 ? 1 : 0])); G.add(barM);
    ctx.tick((dt, t) => { bars.forEach(([x, y, z, ph], i) => { const h = .04 + .26 * (.5 + .5 * Math.sin(t * (1.3 + (i % 3) * .7) + ph)) * (.6 + .4 * Math.sin(t * .37 + i)); o3.position.set(x, y + h / 2, z); o3.rotation.set(0, 0, 0); o3.scale.set(1, h, 1); o3.updateMatrix(); barM.setMatrixAt(i, o3.matrix); });
      o3.scale.set(1, 1, 1); barM.instanceMatrix.needsUpdate = true; }); }
}

/* ---------- Hülle eines Themenraums: Grundgerüst Raumschiff, je Raum über o gesteuert ----------
   o (Materialschlüssel; null = Teil weglassen, fehlend = Standard des Weltstils):
     boden, bodenM (m je Kachel), lauf (Laufsteg), leit (Leitstreifen), wand, wandU (m je Kachel), oben (Schräge bzw. Wand über WH), stirn (Vorder-/Rückwand),
     decke, balken (Deckenträger), rippe, einlage (Rippenfront), leiste (Lichtleisten), akzent (Band auf WH-Höhe), rohr (Rohre der Schräge), glas,
     deckenlicht (Lichtfelder), mittel (Mittelträger)
   o.WH (Wandhöhe bis zur Schräge, 5,8), o.schraege (false: senkrechte Wand bis zur Decke), o.rohre [[t, r], …], o.loch [{x, z, r, schacht, tief, deckel}],
   o.balkenDurch [z, …] (Träger laufen über die Öffnung hinweg), o.mittelLuecken [[z0, z1], …], o.fenster {front: [...], back: [...]} (achteckige Fenster
   {x0, x1, y0, y1, c} in Wandkoordinaten von innen; [] = keine), o.konsole (Pulte unter Fenstern), o.schirme (Schirme neben der Tür), o.eckrohre,
   o.ledFarben [4 Farben], o.rippeExtra(b, {xw, s, z, Xd, WH, S}), o.stirnExtra(b, {side, dir, m, zw, S}), o.extra(ctx, b, S) – Themenstücke (Schlüssel wie oben).
   Draußen (für spätere Räume): decke: null (dann auch keine Träger, Lichtfelder, Mittelträger), schraege: false, oben: null, rippe/rohr: null nach Bedarf,
   stirn: null + fenster {front: [], back: []} (dann keine Türschirme) und im extra eigene Begrenzung (Mauer, Zaun, Container …) mit bündiger
   Fläche bei x = ±8 für die Tafeln und einer Einfassung der Türen; über dem Gang muss in Höhe ctx.height (7,2) etwas Tragendes liegen (Gerüst,
   Ausleger, Kranbrücke), an dem die Raumteile hängen (siehe Aufgabenliste: kraft2 hängt ein Schild über (0 | −1,5) und Federlampen über den Gang). */
function huelle(ctx, o){
  const B = ctx.bounds, H = 7.2, W = B.x1 - B.x0, D = B.z0 - B.z1, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, G = ctx.group, b = L.Bld();
  const k = (n, d) => o[n] === undefined ? d : o[n], WH = o.WH ?? H - 1.4, sch = o.schraege !== false, CH = Math.hypot(1, H - WH), pz = PZ; ctx.decorZ = pz;
  const S = {H, WH, pz, sideDoors: [], hall: false, belegt: [], fenster: [], leds: [], bars: [], mc: {}};
  const bel = S.bel = (x0, x1, y0, y1, z0, z1) => S.belegt.push({x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0, y1, z0: Math.min(z0, z1), z1: Math.max(z0, z1)});
  const DK = k("decke", "ceil"), LC = k("leiste", "lc"), RP = k("rippe", "rib"), BA = k("balken", DK ? RP : null), AK = k("akzent", "acc:" + (L.SECTOR[ctx.index % 8] || "#EEF6FF")), RO = k("rohr", "pipe");
  // Boden, Laufsteg, Leitstreifen
  const bm = o.bodenM || 4, floor = new T3.Mesh(U.scaleUV(new T3.PlaneGeometry(W, D), W / bm, D / bm), L.matOf(k("boden", "floor")));
  floor.rotation.x = -PI / 2; floor.position.set(cx, 0, cz); floor.receiveShadow = true; G.add(floor); ctx.floor = floor;
  if (k("lauf", "walk")) b.put(k("lauf", "walk"), U.scaleUV(new T3.PlaneGeometry(2.6, D - 1.4), 1, (D - 1.4) / 2.6), cx, .004, cz, -PI / 2);
  if (k("leit", "guide")) { const gb = L.Bld(), gL = D - 1.8; for (const s of [-1, 1]) gb.put(k("leit", "guide"), U.scaleUV(new T3.PlaneGeometry(.1, gL), 1, gL / 1.6), cx + s * 1.36, .008, cz, -PI / 2); gb.build(G); }
  // Seitenwände: Wandfläche bündig bei x = ±8 (Tafelfelder), Schräge, Rippen bei pz
  for (const [xw, s] of [[B.x0, 1], [B.x1, -1]]) {
    const A = z => s > 0 ? cz - z : z - cz, Xd = d => xw + s * d, XA = V3(0, 0, -s);
    const m = new T3.Matrix4().makeBasis(XA, Y1, V3(s, 0, 0)).setPosition(xw, 0, cz);
    if (k("wand", "wall")) b.putM(k("wand", "wall"), L.wallGeo(D, WH, [], [], 1 / (o.wandU || 2.25), 1 / WH), m);
    if (sch) { const sl = V3(s / CH, (H - WH) / CH, 0), nn = V3(s * (H - WH) / CH, -1 / CH, 0), mc = S.mc[s] = new T3.Matrix4().makeBasis(XA, sl, nn).setPosition(xw + s * .5, WH + (H - WH) / 2, cz);
      if (k("oben", "bulk")) b.putM(k("oben", "bulk"), U.scaleUV(new T3.PlaneGeometry(D, CH), D / 4, CH / 4), mc);
      if (LC) b.putM(LC, new T3.BoxGeometry(D, .07, .03).translate(0, .32, .015), mc);
      if (RO) for (const [t, r] of o.rohre || [[-.52, .08], [-.3, .055]]) b.putM(RO, new T3.CylinderGeometry(r, r, D, 14, 1, true).rotateZ(PI / 2).translate(0, t, r + .01), mc);
      if (RP) for (const z of pz) b.putM(RP, new T3.BoxGeometry(.6, CH + .05, .26).translate(A(z), 0, .13), mc);
      bel(xw, Xd(1.05), WH - .05, H, B.z1, B.z0); }
    else if (k("oben", "bulk")) b.putM(k("oben", "bulk"), L.wallGeo(D, H - WH, [], [], .25, .25).translate(0, WH, 0), m);
    if (LC && o.sockelLeiste !== false) b.box(LC, .03, .05, D - .8, Xd(.015), 1.1, cz);
    if (AK) b.box(AK, .05, .06, D, Xd(.025), WH, cz);
    for (const z of pz) {
      if (RP) { b.box(RP, .36, WH, .6, Xd(.18), WH / 2, z); b.box("trim", .56, .46, .78, Xd(.28), .23, z); b.box("trim", .5, .32, .74, Xd(.25), WH - .16, z); }
      const EL = k("einlage", RP ? "white" : null);
      if (EL === "haz") b.put("haz", U.scaleUV(new T3.PlaneGeometry(.42, WH - .9), 1, (WH - .9) / .105), Xd(.362), WH / 2 + .05, z, 0, s * PI / 2);
      else if (EL) b.box(EL, .04, WH - .9, .42, Xd(.38), WH / 2 + .05, z);
      if (LC && RP) b.box(LC, .02, WH - 1.9, .05, Xd(.405), WH / 2 + .35, z);
      if (RP) { ctx.obstacleBox(Xd(.3), z, .6, .8); S.leds.push([Xd(.41), 1.6, z - .1, PI / 2, 0], [Xd(.41), 1.6, z + .1, PI / 2, 1], [Xd(.41), WH - .7, z, PI / 2, 2]); bel(xw, Xd(.62), 0, WH, z - .4, z + .4); }
      if (o.rippeExtra) o.rippeExtra(b, {xw, s, z, Xd, WH, S});
    }
    for (const zw of [B.z1, B.z0]) bel(xw, Xd(.56), 0, H, zw, zw + (zw < 0 ? .5 : -.5));
  }
  // Decke mit Öffnungen, Querträger bei pz, Lichtfelder, Mittelträger
  const CW = sch ? W - 2 : W, lo = o.loch || [];
  if (DK) { const sh = new T3.Shape(); sh.moveTo(-CW / 2, -D / 2); sh.lineTo(CW / 2, -D / 2); sh.lineTo(CW / 2, D / 2); sh.lineTo(-CW / 2, D / 2); sh.closePath();
    for (const h of lo) { const p = new T3.Path(); p.absarc(h.x - cx, h.z - cz, h.r, 0, TAU, true); sh.holes.push(p); }
    b.put(DK, U.scaleUV(new T3.ShapeGeometry(sh, 48), .25, .25), cx, H, cz, PI / 2); }
  const gapsX = z => (o.balkenDurch || []).includes(z) ? [] : lo.filter(h => Math.abs(z - h.z) < h.r + .3).map(h => { const q = Math.sqrt((h.r + .3) ** 2 - (z - h.z) ** 2); return [h.x - q, h.x + q]; });
  if (BA) for (const z of pz) { for (const [x0, x1] of L.cut([cx - CW / 2, cx + CW / 2], gapsX(z))) { b.box(BA, x1 - x0, .34, .5, (x0 + x1) / 2, H - .17, z); if (LC && x1 - x0 > .8) b.box(LC, x1 - x0 - .6, .02, .06, (x0 + x1) / 2, H - .345, z); }
    bel(B.x0, B.x1, H - .38, H, z - .27, z + .27); }
  const DL = k("deckenlicht", DK ? "lw" : null), bnd = [B.z0, ...pz, B.z1].sort((p, q) => q - p);
  if (DL) for (let i = 0; i < bnd.length - 1; i++) { const z0 = bnd[i], z1 = bnd[i + 1], Lz = z0 - z1, zm = (z0 + z1) / 2; if (Lz < 3) continue;
    for (const s of [-1, 1]) { const x = cx + s * 2.6, Lp = Lz - 1.3; if (lo.some(h => Math.abs(x - h.x) < h.r + .8 && Math.abs(zm - h.z) < h.r + Lp / 2)) continue;
      b.box("trim", 1.42, .07, Lp + .22, x, H - .035, zm); b.put(DL, new T3.PlaneGeometry(1.15, Lp), x, H - .075, zm, PI / 2); bel(x - .72, x + .72, H - .1, H, zm - Lp / 2, zm + Lp / 2); } }
  const MT = k("mittel", DK ? "trim" : null);
  if (MT) for (const [z0, z1] of L.cut([B.z1, B.z0], lo.filter(h => Math.abs(h.x - cx) < h.r).map(h => [h.z - h.r - .1, h.z + h.r + .1]).concat(o.mittelLuecken || []))) {
    b.box(MT, .8, .24, z1 - z0, cx, H - .12, (z0 + z1) / 2); if (LC) b.box(LC, .1, .02, z1 - z0 - .2, cx, H - .25, (z0 + z1) / 2); bel(cx - .42, cx + .42, H - .27, H, z0, z1); }
  for (const h of lo) { if (RP) b.put(RP, new T3.TorusGeometry(h.r + .02, .13, 8, 72), h.x, H - .02, h.z, PI / 2); if (LC) b.put(LC, new T3.TorusGeometry(h.r + .2, .045, 6, 96), h.x, H - .07, h.z, PI / 2);
    if (h.schacht) b.put(h.schacht, new T3.CylinderGeometry(h.r, h.r, h.tief, 48, 1, true), h.x, H + h.tief / 2, h.z);
    if (h.deckel) b.put(h.deckel, new T3.CircleGeometry(h.r, 48), h.x, H + h.tief - .01, h.z, PI / 2); }
  // Stirnwände: Tür-Aussparung (die Tür baut der Kern), Fenster, Pulte, Schirme neben der Tür
  const fen = o.fenster || {}, winL = {x0: 3.1, x1: 7.3, y0: 1.3, y1: 5.5, c: .7}, stdW = [winL, {...winL, x0: -winL.x1, x1: -winL.x0}];
  for (const [zw, dir, side] of [[B.z1, 1, "front"], [B.z0, -1, "back"]]) {
    const ws = fen[side] || stdW, m = new T3.Matrix4().makeBasis(V3(dir, 0, 0), Y1, V3(0, 0, dir)).setPosition(cx, 0, zw), zb = zw + dir * .2;
    if (k("stirn", "bulk")) b.putM(k("stirn", "bulk"), L.wallGeo(W, H, [[-1.25, 1.25, 3.4]], ws, .25, .25), m);
    for (const [x0, x1] of L.cut([-W / 2, W / 2], [[-1.55, 1.55]])) b.putM("trim", new T3.BoxGeometry(x1 - x0, .14, .05).translate((x0 + x1) / 2, .07, .025), m);
    // Leuchtband auf 6,3 m: an hohen Fenstern (Panorama, Heckfenster) unterbrochen, sonst läge es als Strich quer über der Scheibe
    if (AK) for (const [x0, x1] of L.cut([-W / 2 + .1, W / 2 - .1], ws.filter(w => w.y0 < 6.36 && w.y1 > 6.24).map(w => [w.x0 - .12, w.x1 + .12]).sort((p, q) => p[0] - q[0])))
      b.putM(AK, new T3.BoxGeometry(x1 - x0, .06, .03).translate((x0 + x1) / 2, 6.3, .015), m);
    for (const w of ws) { const P = L.octPts(w);
      for (let i = 0; i < 8; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 8], Le = Math.hypot(bx - ax, by - ay), a = Math.atan2(by - ay, bx - ax), mx = (ax + bx) / 2, my = (ay + by) / 2;
        b.putM(RP || "rib", new T3.BoxGeometry(Le + .14, .2, .8).rotateZ(a).translate(mx, my, -.25), m); if (LC) b.putM(LC, new T3.BoxGeometry(Math.max(.05, Le - .06), .035, .03).rotateZ(a).translate(mx, my, .165), m); }
      b.putM("trim", new T3.BoxGeometry(.1, w.y1 - w.y0, .12).translate((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, -.2), m);
      if (k("glas", "glass")) { const gs = new T3.Shape(); P.forEach(([x, y], i) => i ? gs.lineTo(x, y) : gs.moveTo(x, y));
        const gg = new T3.ShapeGeometry(gs), guv = gg.attributes.uv; for (let i = 0; i < guv.count; i++) guv.setXY(i, (guv.getX(i) - w.x0) / (w.x1 - w.x0), (guv.getY(i) - w.y0) / (w.y1 - w.y0));
        b.putM(k("glas", "glass"), gg.translate(0, 0, -.38), m); }
      if (o.konsole !== false && w.y0 < 2) L.consoleUnder(ctx, b, w, m, S.bars, S.leds);
      S.fenster.push({side, w}); bel(cx + dir * (w.x0 - .12), cx + dir * (w.x1 + .12), w.y0 - .12, w.y1 + .12, zw, zb); }
    if (k("schirme", !!k("stirn", "bulk"))) for (const sx of [-1, 1]) { const x = sx * 2.3;
      b.putM("trim", new T3.BoxGeometry(.92, 1.0, .08).translate(x, 2.85, .04), m); if (LC) b.putM(LC, new T3.BoxGeometry(.92, .025, .02).translate(x, 3.37, .07), m);
      b.putM("scr", L.atlasUV(new T3.PlaneGeometry(.8, .8), sx < 0 ? 4 : 5).translate(x, 2.85, .085), m); bel(cx + x - .47, cx + x + .47, 2.33, 3.4, zw, zb); }
    if (o.stirnExtra) o.stirnExtra(b, {side, dir, m, zw, S});
  }
  // Rohre in den Ecken
  if (o.eckrohre !== false && RO) for (const [xw, s] of [[B.x0, 1], [B.x1, -1]]) for (const [zw, dir] of [[B.z1, 1], [B.z0, -1]]) {
    b.put(RO, new T3.CylinderGeometry(.085, .085, H, 14, 1, true), xw + s * .2, H / 2, zw + dir * .32); b.put(RO, new T3.CylinderGeometry(.05, .05, H, 10, 1, true), xw + s * .42, H / 2, zw + dir * .2);
    for (const y of [1.2, 3.3, 5.4]) { b.put("trim", new T3.TorusGeometry(.1, .025, 6, 18), xw + s * .2, y, zw + dir * .32, PI / 2); b.box("trim", .3, .07, .1, xw + s * .1, y, zw + dir * .32); } }
  if (o.extra) o.extra(ctx, b, S);
  b.build(G, o.schatten || []);
  leuchten(ctx, G, S, o.ledFarben || ["#FFE81F", "#4FC3F7", "#3DDC97", "#FF5C5C"]);
  const gT = L.tex.guide(), rad = S.bars.length ? L.tex.radar() : null; ctx.tick((dt, t) => { gT.offset.y -= dt * .45; if (rad) rad.rotation = -t * 1.3; });
  delete S.mc; ctx.decorShell = S; return H;
}

/* =====================================================================
   strom1 · Reaktorkern: dunkler Maschinenraum, hängender Reaktor mit glühendem Plasma im Deckenschacht, Reaktorkammern hinter der Stirnwand,
   orange Kühlrohre, Warnstreifen, Gitterboden mit Glut darunter, orange-rotes ruhiges Pulsieren
   ===================================================================== */
const RK = {x: 0, z: -5.6, r: 2.3};
const rkTex = {
  gitter: e => ctex(1024, 1024, (g, w, h) => {   // 4 × 4 m Gitterboden (e: Leuchtkarte – nur die Spalten glühen)
    const r = zufall(e ? 31 : 30); g.fillStyle = e ? "#000" : "#17130f"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 256, y = j * 256;
      if (!e) { g.fillStyle = "#3a332d"; g.fillRect(x + 2, y + 2, 252, 252); g.fillStyle = "#14100d"; g.fillRect(x + 14, y + 14, 228, 228); }
      const vert = (i + j) % 2 === 0;
      for (let k = 18; k < 238; k += 12) { if (e) { g.fillStyle = `rgba(255,${90 + r() * 50 | 0},20,${.35 + .45 * r()})`; vert ? g.fillRect(x + k + 2, y + 16, 6, 224) : g.fillRect(x + 16, y + k + 2, 224, 6); }
        else { g.fillStyle = "#5a4f45"; vert ? g.fillRect(x + k, y + 16, 3, 224) : g.fillRect(x + 16, y + k, 224, 3); g.fillStyle = "rgba(255,255,255,.12)"; vert ? g.fillRect(x + k, y + 16, 1, 224) : g.fillRect(x + 16, y + k, 224, 1); } }
      if (!e) for (const [a, c] of [[x + 8, y + 8], [x + 248, y + 8], [x + 8, y + 248], [x + 248, y + 248]]) niet(g, a, c); }
    if (e) { g.globalCompositeOperation = "destination-in"; for (let i = 0; i < 9; i++) fleck(g, r() * w, r() * h, 260, "0,0,0", .9); g.globalCompositeOperation = "source-over"; }
    else streu(g, w, h, 9000, .2, ["#000", "#8a7a6a", "#3a2a20"], r);
  }, e ? "rk-gitter-e" : "rk-gitter", [1, 1]),
  wand: () => ctex(512, 1024, (g, w, h) => {   // 2,25 × 5,8 m: schwere dunkle Platten, Warnband unten, Kühlkreis-Beschriftung
    const r = zufall(32), Y = m => WY(h, m); g.fillStyle = "#26231f"; g.fillRect(0, 0, w, h);
    warnStreifen(g, 0, Y(.66), w, Y(.16) - Y(.66), "#D9A21E", "#141414", 40);
    for (const [y0, y1, c] of [[.72, 2.66, "#3b3631"], [2.74, 4.98, "#322e2a"], [5.04, 5.76, "#2a2623"]]) { L.plate(g, 6, Y(y1), w - 12, Y(y0) - Y(y1), c, {hi: .14, lo: .5, sheen: .04, shade: .2});
      for (let x = 22; x < w - 10; x += 52) { niet(g, x, Y(y1) + 14); niet(g, x, Y(y0) - 14); } }
    g.fillStyle = "#1b1815"; g.beginPath(); g.roundRect(150, Y(2.25), 212, Y(1.2) - Y(2.25), 8); g.fill();
    for (let k = 0; k < 7; k++) { g.fillStyle = "#0e0c0a"; g.fillRect(164, Y(2.15) + k * 22, 184, 11); g.fillStyle = "rgba(255,140,60,.18)"; g.fillRect(164, Y(2.15) + k * 22 + 11, 184, 2); }
    kleber(g, 256, Y(2.5), 92, "KÜHLKREIS 2", "#D9A21E"); g.fillStyle = "#ff7a2a"; g.fillRect(30, Y(5.4), 60, 10); g.fillRect(w - 90, Y(5.4), 60, 10);
    streu(g, w, h, 7000, .12, ["#000", "#fff", "#6a4a30"], r);
  }, "rk-wand", [1, 1]),
  plasma: () => ctex(128, 512, (g, w, h) => {   // fließende Glutbänder (nach oben verschoben)
    const id = g.createImageData(w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / w * TAU, v = y / h * TAU;
      const f = .55 + .45 * Math.sin(v * 3 + Math.sin(u * 2 + v) * 1.4) * Math.sin(u * 3 + v * 5 + Math.sin(v * 2)), q = Math.max(0, Math.min(1, f)), i = (y * w + x) * 4;
      d[i] = 255; d[i + 1] = 120 + 120 * q; d[i + 2] = 30 + 120 * q * q; d[i + 3] = 255 * (.35 + .65 * q); }
    g.putImageData(id, 0, 0); }, "rk-plasma", [1, 1]),
  kammer: () => ctex(256, 256, (g, w, h) => { g.fillStyle = "#120806"; g.fillRect(0, 0, w, h); fleck(g, w / 2, h * .55, w * .6, "255,110,30", .85); fleck(g, w / 2, h * .55, w * .25, "255,220,140", .7);
    g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 6; for (let x = 32; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }, "rk-kammer"),
  ring: () => ctex(512, 512, (g, w) => {   // Bodenmarkierung unter dem Reaktor (liegt im Gang: Hinweis statt Verbot)
    const c = w / 2; g.clearRect(0, 0, w, w); g.save(); g.beginPath(); g.arc(c, c, 250, 0, TAU); g.arc(c, c, 200, 0, TAU, true); g.clip(); warnStreifen(g, 0, 0, w, w, "#E8B923", "#151515", 46); g.restore();
    g.strokeStyle = "rgba(232,185,35,.9)"; g.lineWidth = 6; g.beginPath(); g.arc(c, c, 180, 0, TAU); g.stroke();
    g.fillStyle = "rgba(232,185,35,.95)"; g.font = `800 34px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("REAKTORZONE", c, c - 120); g.fillText("VORSICHT", c, c + 120); strahlZeichen(g, c, c, 70, "rgba(232,185,35,.95)"); }, "rk-ring"),
  schild: () => ctex(1024, 320, (g, w, h) => { g.fillStyle = "#E8B923"; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.fill(); g.lineWidth = 14; g.strokeStyle = "#151515"; g.beginPath(); g.roundRect(22, 22, w - 44, h - 44, 18); g.stroke();
    strahlZeichen(g, 170, h / 2, 104, "#151515"); g.fillStyle = "#151515"; g.textAlign = "left"; g.textBaseline = "middle"; g.font = `800 120px ${FONT}`; g.fillText("REAKTORKERN", 300, h * .43);
    g.font = `600 40px ${FONT}`; g.fillText("Zutritt nur mit Schutzausrüstung", 306, h * .76); }, "rk-schild")
};
regM("rk-boden", () => std({map: rkTex.gitter(false), emissive: 0xffffff, emissiveMap: rkTex.gitter(true), emissiveIntensity: .55, roughness: .55, metalness: .55}));
regM("rk-wand", () => std({map: rkTex.wand(), roughness: .62, metalness: .35}));
regM("rk-oben", () => std({map: L.tex.bulk(), color: 0x5a524b, roughness: .55, metalness: .4}));
regM("rk-decke", () => std({map: L.tex.ceil(), color: 0x5c4c42, roughness: .6, metalness: .4}));
regM("rk-rippe", () => std({color: 0x3b3e44, roughness: .42, metalness: .75}));
regM("rk-dunkel", () => std({color: 0x24262b, roughness: .4, metalness: .7}));
regM("rk-rohr", () => std({color: 0xb5542b, roughness: .45, metalness: .45}));
regM("rk-schacht", () => std({color: 0x2c221c, emissive: 0x5a1a06, emissiveIntensity: .6, roughness: .5, metalness: .5, side: T3.BackSide}));
regM("rk-glas", () => addM(0xff7a30, .16));
regM("rk-plasma", () => addM(0xffb050, .9, {map: rkTex.plasma()}));
regM("rk-kammer", () => L.basic({map: rkTex.kammer(), side: T3.BackSide}));
regM("rk-ring", () => std({map: rkTex.ring(), transparent: true, alphaTest: .3, roughness: .7, metalness: .1, depthWrite: false}));
regM("rk-schild", () => std({map: rkTex.schild(), roughness: .5, emissive: 0xffffff, emissiveMap: rkTex.schild(), emissiveIntensity: .25}));
regM("rk-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0xff8a3a}, L.ADD)));
function reaktor(ctx, b, S){
  const {x, z, r: RS} = RK, H = S.H, G = ctx.group, R0 = 1.4, yb = 5.15, top = H + 2.7;
  // Druckbehälter: Stahlringe, Streben, Leuchtspulen, Bodenkappe mit Düse, Kragen an der Decke (gebündelt); Glaszylinder und Plasmasäule (eigene Meshes)
  for (const y of [yb + .04, 6.15, H - .12, H + .6, H + 1.6]) b.put("rk-rippe", new T3.TorusGeometry(R0 + .04, .085, 6, 44), x, y, z, PI / 2);
  for (const y of [5.65, 6.6]) b.put("acc:#ffb347", new T3.TorusGeometry(R0 + .1, .035, 6, 48), x, y, z, PI / 2);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + PI / 6; b.box("rk-rippe", .12, top - yb, .12, x + Math.cos(a) * (R0 + .07), (yb + top) / 2, z + Math.sin(a) * (R0 + .07)); }
  b.put("rk-dunkel", new T3.SphereGeometry(R0 + .04, 32, 8, 0, TAU, PI / 2, PI / 2).scale(1, .38, 1), x, yb, z);
  b.put("rk-dunkel", new T3.CylinderGeometry(.42, .24, .4, 20), x, yb - .62, z); b.put("acc:#ffcf7a", new T3.TorusGeometry(.38, .04, 6, 28), x, yb - .45, z, PI / 2);
  b.put("rk-dunkel", new T3.TorusGeometry(RS + .05, .2, 8, 64), x, H - .1, z, PI / 2);
  b.put("acc:#ffe6b0", new T3.CylinderGeometry(.16, .16, top - yb, 12, 1, true), x, (yb + top) / 2, z);   // heller Kern
  for (const s of [-1, 1]) for (const dz of [-.45, .45]) {   // Kühlrohre vom Behälter zu den Schrägen
    const x0 = x + s * (R0 + .05), x1 = s * 7.55, y = 6.42; b.put("rk-rohr", new T3.CylinderGeometry(.13, .13, Math.abs(x1 - x0), 14, 1, true).rotateZ(PI / 2), (x0 + x1) / 2, y, z + dz);
    for (let q = .15; q < .95; q += .27) b.put("rk-rippe", new T3.TorusGeometry(.15, .035, 6, 18), x0 + (x1 - x0) * q, y, z + dz, 0, PI / 2);
    b.put("haz", U.scaleUV(new T3.CylinderGeometry(.135, .135, .5, 14, 1, true), 4, 1).rotateZ(PI / 2), x1 - s * .6, y, z + dz); }
  S.bel(x - RS, x + RS, 4.6, H, z - RS, z + RS); S.bel(-7.6, 7.6, 6.2, 6.62, z - .65, z + .65);
  const glas = new T3.Mesh(new T3.CylinderGeometry(R0, R0, top - yb, 40, 1, true), L.matOf("rk-glas")); glas.position.set(x, (yb + top) / 2, z); G.add(glas);
  const pl = new T3.Mesh(new T3.CylinderGeometry(.75, .75, top - yb - .1, 32, 1, true), L.matOf("rk-plasma")); pl.position.set(x, (yb + top) / 2, z); G.add(pl);
  const pt = rkTex.plasma(); pt.repeat.set(3, 2);
  const kern = L.sprite(0xff8a30, 6.0); kern.position.set(x, 6.1, z); kern.material.opacity = .6; G.add(kern);
  const duese = L.sprite(0xffb050, 1.6); duese.position.set(x, yb - .9, z); G.add(duese);
  // Bodenmarkierung (flach, nichts belegt)
  const ring = new T3.Mesh(new T3.PlaneGeometry(3.6, 3.6), L.matOf("rk-ring")); ring.rotation.x = -PI / 2; ring.position.set(x, .006, z); ring.receiveShadow = true; G.add(ring);
  return {pl, pt, kern, glas};
}
function reaktorKammern(ctx, b, S, m){   // hinter den Fenstern der Stirnwand: glühende Brennstäbe (gebündelt) + ein Leuchtpunkte-Objekt
  const pts = [], v = V3(0, 0, 0);
  for (const sx of [-1, 1]) { const x0 = sx < 0 ? -7.4 : 3.0, x1 = sx < 0 ? -3.0 : 7.4, xc = (x0 + x1) / 2;
    b.putM("rk-kammer", new T3.BoxGeometry(x1 - x0, 4.6, 2.4).translate(xc, 3.4, -1.25), m);
    for (let i = 0; i < 4; i++) { const xr = x0 + .7 + i * (x1 - x0 - 1.4) / 3; b.putM("acc:#ffcf7a", new T3.CylinderGeometry(.09, .09, 3.9, 10, 1, true).translate(xr, 3.4, -1.3), m);
      for (const y of [1.6, 5.2]) b.putM("rk-dunkel", new T3.CylinderGeometry(.16, .16, .2, 12).translate(xr, y, -1.3), m);
      v.set(xr, 3.4, -1.3).applyMatrix4(m); pts.push(v.x, v.y, v.z); }
    b.putM("haz", U.scaleUV(new T3.BoxGeometry(4.0, .14, .32), 6, 1).translate(xc, 1.2, .1), m); }
  const pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.Float32BufferAttribute(pts, 3));
  const p = new T3.Points(pg, L.imat("rk-stabglut", () => new T3.PointsMaterial({map: U.glowTex(), color: 0xff9a40, size: 2.4, transparent: true, opacity: .85, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})));
  ctx.group.add(p); return p;
}
K.raum.strom1 = {
  licht: {bg: 0x070302, nebel: [0x1f0e07, .013], himmel: [0xffd8bc, 0x2a1810, .62], umgebung: [0xffbe96, .14], sonne: [0xffe2c8, 1.05],
    decke: [[0xff9a58, 30, 0, 6.0, -1.6], [0xffcaa0, 24, 0, 6.1, 5.7]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#1a0f0a"], [.38, "#4a2414"], [.5, "#a8521e"], [.56, "#3a1c10"], [1, "#0c0705"]]); const r = zufall(41);
    for (let i = 0; i < 10; i++) fleck(g, i * 52 + 20, h * .18, 18, "255,190,120", .9); for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(10,6,4,.7)"; g.fillRect(i * 90 + r() * 20, 0, 14, h); } },
  all: false,
  huelle: ctx => huelle(ctx, {
    boden: "rk-boden", lauf: null, leit: "rk-leit", wand: "rk-wand", oben: "rk-oben", stirn: "rk-oben", decke: "rk-decke", rippe: "rk-rippe", einlage: "haz",
    leiste: "acc:#ff8a3a", akzent: "acc:#ff5c2a", rohr: "rk-rohr", rohre: [[-.55, .12], [-.26, .075]], deckenlicht: "acc:#9a4a22", konsole: false, loch: [{...RK, schacht: "rk-schacht", tief: 2.8, deckel: "acc:#ff7a2a"}],
    fenster: {back: []}, ledFarben: ["#FFB347", "#FF7A2A", "#FFE81F", "#FF5C5C"],
    rippeExtra(b, {s, z, Xd, WH}){ for (const dz of [-.42, .42]) { b.put("rk-rohr", new T3.CylinderGeometry(.08, .08, WH - .2, 10, 1, true), Xd(.2), WH / 2, z + dz);
      for (const y of [1.0, 2.6, 4.2]) b.put("rk-rippe", new T3.TorusGeometry(.1, .025, 6, 16), Xd(.2), y, z + dz, PI / 2); } },
    stirnExtra(b, {side, m}){
      if (side === "front") { reaktorKammern(ctx, b, null, m); b.putM("rk-schild", new T3.PlaneGeometry(2.6, .81).translate(0, 6.76, .045), m); }
      else for (const sx of [-1, 1]) { // Rückwand: zwei Kühlmittel-Sammelrohre links und rechts der Tür
        for (const x of [3.4, 4.6, 5.8]) { b.putM("rk-rohr", new T3.CylinderGeometry(.16, .16, 7.2, 14, 1, true).translate(sx * x, 3.6, .3), m); for (const y of [.9, 3.0, 5.1]) b.putM("rk-rippe", new T3.TorusGeometry(.19, .04, 6, 20).rotateX(PI / 2).translate(sx * x, y, .3), m); }
        b.putM("rk-rohr", new T3.CylinderGeometry(.2, .2, 3.0, 14, 1, true).rotateZ(PI / 2).translate(sx * 4.6, 4.6, .52), m); b.putM("haz", U.scaleUV(new T3.BoxGeometry(3.2, .3, .06), 6, 1).translate(sx * 4.6, .35, .05), m); }
    },
    extra(c, b, S){ S._rk = reaktor(c, b, S);
      for (const sx of [-1, 1]) { S.bel(sx * 3.0, sx * 6.3, 0, 7.2, 10.25, 11); c.obstacleBox(sx * 4.6, 10.6, 3.2, .8); c.obstacleBox(sx * 5.2, -10.7, 4.4, .6); } }   // Rückwandrohre; vorn wie früher die Pulte
  }),
  stimmung(ctx, sc, A){
    A.eigen = true; const sw = A.sweep, d0 = ctx._licht && ctx._licht.decke[0], S = ctx.decorShell, rk = S && S._rk; sw.color.set(0xff6a24); sw.position.set(RK.x, 4.5, RK.z);
    for (let i = 0; i < A.farben.length; i += 3) { const r = (i * 7919) % 100 / 100; A.farben[i] = 1; A.farben[i + 1] = .45 + .4 * r; A.farben[i + 2] = .12 + .1 * r; } A.geo.attributes.color.needsUpdate = true;
    A.pts.material.size = .055;
    ctx.tick((dt, t) => { const f = .5 + .5 * Math.sin(t * 1.7);   // ruhiges Pulsieren (≈ 0,27 Hz)
      sw.intensity = 16 + 10 * f; if (d0) d0.intensity = 26 + 8 * f;
      if (rk) { rk.pt.offset.y -= dt * .18; rk.pt.offset.x += dt * .03; rk.kern.material.opacity = .45 + .25 * f; rk.glas.material.opacity = .12 + .06 * f; } });
  },
  dekor: {moebel: ["tanks", "workshop", "breaker", "tanks"], fueller: ["tank", "ventil", "sos", "ventil"], bilder: false, pflanzen: false, globus: false, drohnen: 1,
    thema(ctx, B, R, I, env, D){
      // hinter dem gläsernen Wassermodell in Slot A (−5,5 | 1,5) nichts Helles oder Hohes: sonst scheinen Tanks durch Rohre und Wasserrad
      const A = ctx.slots && ctx.slots.A; if (A) ctx.belege(ctx.wand("left", A.z, 0, 2.7, 3.8, 1.1));
      D.wallPiece(ctx, B, {minW: 1.4, maxW: 2.2, d: .52, h: 2.45}, w => D.cellRack(B, w, R, env), {pref: -4});
      kuehlFelder(ctx, B, D); }}
};
// Freie obere Wandfelder (ohne Tafel): Kühlrohr-Verteiler statt gerahmter Bilder – die blauen Bilder stachen auf der Reaktorwand heraus und
// glichen den Tafeln. Zwei waagrechte Rohre mit Flanschen, Halter, Steigleitung mit Handrad, Manometer.
function kuehlFelder(ctx, B, D){
  for (const side of ["left", "right"]) for (const [s, e] of D.runs(ctx, side, ctx.bounds.z1, ctx.bounds.z0, 2.95, 5.15, .42)) { if (e - s < 1.9) continue;
    const c = (s + e) / 2, w = Math.min(3.3, e - s - .2), F = D.wallF(ctx, side, c);
    if (!D.claim(ctx, D.wbox(F, -w / 2, w / 2, 3.0, 5.1, 0, .42), false)) continue; B.F = F;
    for (const [y, r] of [[3.55, .11], [4.5, .08]]) { B.rod("rk-rohr", [-w / 2, y, .25], [w / 2, y, .25], r, 12);
      for (let x = -w / 2 + .3; x < w / 2 - .15; x += 1.0) B.tor("rk-rippe", r + .025, .03, x, y, .25, 0, PI / 2, 0, 4, 18); }
    for (const x of [-w / 2 + .45, w / 2 - .45]) { B.box("frame", .08, 1.3, .06, x, 4.0, .04); for (const y of [3.55, 4.5]) B.box("frame", .06, .06, .2, x, y, .13); }
    B.rod("rk-rohr", [.2, 3.55, .25], [.2, 4.5, .25], .065, 10); B.box("rk-rippe", .2, .2, .2, .2, 4.02, .25);
    B.tor("lr", .14, .018, .2, 4.02, .39, 0, 0, 0, 4, 20); for (let k = 0; k < 3; k++) B.box("lr", .26, .018, .018, .2, 4.02, .39, 0, 0, k / 3 * PI);
    B.cyl("rk-dunkel", .1, .1, .05, 14, -.4, 4.02, .29, PI / 2); B.plane("screen", .17, .17, D.PR.gauge, -.4, 4.02, .318);
    B.add("haz", U.scaleUV(new T3.BoxGeometry(.5, .07, .012), 4, 1), -.4, 3.8, .3);
    D.LOG(ctx, "kuehlfeld", side, c, w); }
}

/* =====================================================================
   strom2 · Energieverteiler: Schaltraum ohne Fenster – Schaltschrankwände mit Statusleuchten, Hauptverteiler an den Stirnwänden,
   Kabelpritschen unter der Decke, Kabelbündel an den Rippen, Stromschienen über den Türen, grün-blaues Licht
   ===================================================================== */
const evTex = {
  wand: () => ctex(512, 1024, (g, w, h) => {   // 2,25 × 5,8 m: drei Schaltschränke (je 0,75 m) bis 2,42 m, darüber dunkle Wand
    const r = zufall(52), Y = m => WY(h, m), cw = w / 3; g.fillStyle = "#1a2229"; g.fillRect(0, 0, w, h);
    for (let y = Y(5.7); y < Y(2.6); y += 46) { g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(0, y, w, 2); }
    for (let i = 0; i < 3; i++) { const x = i * cw;
      L.plate(g, x + 3, Y(2.42), cw - 6, Y(.06) - Y(2.42), "#4c5967", {r: 4, hi: .3, lo: .5, sheen: .08});
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.strokeRect(x + 14, Y(2.3), cw - 28, Y(.2) - Y(2.3));
      for (const [a, b] of [[2.12, 2.3], [.22, .5]]) for (let yy = Y(b); yy < Y(a); yy += 9) { g.fillStyle = "#1b222a"; g.fillRect(x + 30, yy, cw - 60, 4); }
      g.fillStyle = "#0b1116"; g.beginPath(); g.roundRect(x + 30, Y(1.72), cw - 60, Y(1.42) - Y(1.72), 4); g.fill();
      g.fillStyle = "#e9eef2"; g.fillRect(x + 36, Y(1.98), cw - 72, 22); g.fillStyle = "#1b222a"; g.font = `700 15px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(`V2-${String(i + 1).padStart(2, "0")}`, x + cw / 2, Y(1.98) + 11);
      g.fillStyle = "#2a323b"; g.fillRect(x + cw - 34, Y(1.3), 10, Y(.95) - Y(1.3)); g.fillStyle = "#c9d2da"; g.fillRect(x + cw - 32, Y(1.26), 6, Y(.99) - Y(1.26));
      g.fillStyle = "#E8B923"; g.beginPath(); g.moveTo(x + 40, Y(1.0)); g.lineTo(x + 58, Y(1.0)); g.lineTo(x + 49, Y(1.16)); g.closePath(); g.fill(); g.fillStyle = "#1b222a"; g.fillRect(x + 48, Y(1.12), 2, 7); }
    g.fillStyle = "#11171c"; g.fillRect(0, Y(2.56), w, Y(2.42) - Y(2.56)); g.fillStyle = "#3DDC97"; g.fillRect(0, Y(2.5), w, 3);
    streu(g, w, h, 5000, .1, ["#000", "#fff"], r);
  }, "ev-wand", [1, 1]),
  tafel: e => ctex(1024, 1024, (g, w, h) => {   // Hauptverteiler 4,9 × 5,0 m (e: Leuchtkarte – Schaltbild und Meldeleuchten)
    const r = zufall(53); g.fillStyle = e ? "#000" : "#56616d"; g.fillRect(0, 0, w, h);
    const box = (x, y, bw, bh, c) => { if (!e) L.plate(g, x, y, bw, bh, c, {r: 6, hi: .3, lo: .5}); };
    box(14, 14, w - 28, 92, "#1c232b"); if (!e) { g.fillStyle = "#FFE81F"; g.font = `800 52px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("HAUPTVERTEILER", 40, 60); g.fillStyle = "#BFEBFF"; g.font = `600 30px ${FONT}`; g.textAlign = "right"; g.fillText("DECK 2 · 400 V", w - 40, 62); }
    box(14, 120, w - 28, 330, "#0b1620"); // Schaltbild
    g.lineCap = "round"; const ln = (c, lw, pts) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    const GR = "#3DDC97", CY = "#4FC3F7";
    ln(CY, 8, [[80, 200], [944, 200]]); ln(GR, 6, [[110, 150], [110, 200]]); g.strokeStyle = GR; g.lineWidth = 5; g.beginPath(); g.arc(110, 150, 22, 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++) { const x = 190 + i * 100, on = i !== 5; ln(on ? GR : "rgba(255,92,92,.9)", 5, [[x, 200], [x, 260]]); g.strokeStyle = on ? GR : "#FF5C5C"; g.strokeRect(x - 14, 260, 28, 40); ln(on ? GR : "rgba(255,92,92,.9)", 5, [[x, 300], [x, 390]]);
      g.fillStyle = on ? GR : "#FF5C5C"; g.beginPath(); g.arc(x, 410, 10, 0, TAU); g.fill(); }
    if (!e) { g.fillStyle = "#BFEBFF"; g.font = `600 24px ${FONT}`; g.textAlign = "left"; g.fillText("EINSPEISUNG", 140, 140); g.fillText("SCHIENE A", 760, 176); }
    for (let row = 0; row < 3; row++) { const y = 480 + row * 150; box(14, y, w - 28, 136, "#c9d0d6");
      for (let i = 0; i < 16; i++) { const x = 40 + i * 59; if (!e) { g.fillStyle = "#eef2f5"; g.fillRect(x, y + 14, 46, 104); g.fillStyle = "#1b222a"; g.fillRect(x + 14, y + 40, 18, 34); g.fillStyle = "#3a4450"; g.fillRect(x + 6, y + 92, 34, 12); }
        g.fillStyle = (i * 7 + row * 3) % 11 === 4 ? "#FF5C5C" : (i + row) % 3 ? "#3DDC97" : "#4FC3F7"; g.beginPath(); g.arc(x + 23, y + 26, 6, 0, TAU); g.fill(); } }
    if (!e) { g.fillStyle = "#1b222a"; g.font = `700 22px ${FONT}`; g.textAlign = "left"; g.fillText("SICHERUNGEN F1 – F48", 40, 470); streu(g, w, h, 6000, .08, ["#000", "#fff"], r); }
  }, e ? "ev-tafel-e" : "ev-tafel"),
  boden: () => ctex(1024, 1024, (g, w, h) => {   // 4 × 4 m: dunkle Platten, quer verlaufender Kabelkanal mit Lochblech
    const r = zufall(54); g.fillStyle = "#12171c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { L.plate(g, i * 256 + 3, j * 256 + 3, 250, 250, `hsl(205,12%,${17 + r() * 4}%)`, {hi: .18, lo: .5, sheen: .04}); for (const [a, c] of [[14, 14], [242, 14], [14, 242], [242, 242]]) niet(g, i * 256 + a, j * 256 + c); }
    const y0 = 448; warnStreifen(g, 0, y0 - 18, w, 14, "#D9A21E", "#141414", 26); warnStreifen(g, 0, y0 + 132, w, 14, "#D9A21E", "#141414", 26); g.fillStyle = "#3a434c"; g.fillRect(0, y0, w, 128);
    for (let y = y0 + 10; y < y0 + 124; y += 14) for (let x = 6 + ((y / 14) % 2) * 7; x < w; x += 14) { g.fillStyle = "#11161b"; g.beginPath(); g.arc(x, y, 3.6, 0, TAU); g.fill(); }
    streu(g, w, h, 8000, .14, ["#000", "#8a96a3"], r);
  }, "ev-boden", [1, 1])
};
regM("ev-boden", () => std({map: evTex.boden(), roughness: .5, metalness: .45}));
regM("ev-wand", () => std({map: evTex.wand(), roughness: .5, metalness: .3}));
regM("ev-oben", () => std({map: L.tex.bulk(), color: 0x55626e, roughness: .5, metalness: .35}));
regM("ev-decke", () => std({map: L.tex.ceil(), color: 0x6a7884, roughness: .55, metalness: .35}));
regM("ev-rippe", () => std({color: 0x3a444f, roughness: .4, metalness: .7}));
regM("ev-tafel", () => std({map: evTex.tafel(false), emissive: 0xffffff, emissiveMap: evTex.tafel(true), emissiveIntensity: .9, roughness: .5, metalness: .2}));
regM("ev-blau", () => std({color: 0x2a62c8, roughness: .55, metalness: .05}));
regM("ev-gruen", () => std({color: 0x3aa65a, roughness: .55, metalness: .05}));
regM("ev-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0x5fffc0}, L.ADD)));
const EV_TRAY = [-4.8, -2.3, 2.3, 4.8], EV_KAB = ["rubber", "ev-blau", "rubber", "ev-gruen", "copper"];
function kabelDecke(ctx, b, S){
  const H = S.H, y = 6.5, z0 = -10.55, z1 = 10.55, Lz = z1 - z0;
  for (const x of EV_TRAY) {   // Kabelpritsche: zwei Holme, Sprossen, Leuchtstreifen darunter, 4–5 Kabel
    for (const s of [-1, 1]) b.box("steel", .03, .12, Lz, x + s * .22, y, 0);
    for (let z = z0 + .25; z < z1; z += .6) b.box("steel", .44, .02, .04, x, y - .05, z);
    b.box("acc:#a8fff0", .3, .012, Lz - .4, x, y - .07, 0);
    EV_KAB.forEach((kk, i) => { const r = kk === "copper" ? .02 : .036 + (i % 2) * .01; b.put(kk, new T3.CylinderGeometry(r, r, Lz, 6, 1, true).rotateX(PI / 2), x - .16 + i * .08, y - .02 + r, 0); });
    for (const z of [-8.2, -3.7, 3.7, 8.2]) b.box("steel", .03, H - y, .03, x, (H + y) / 2, z);   // Abhänger
    S.bel(x - .3, x + .3, y - .1, H, z0, z1); }
  for (const z of [-9, -4.5, 0, 4.5, 9]) {   // Querpritschen unter den Deckenträgern, Kabel von den Rippen herauf
    for (const s of [-1, 1]) b.box("steel", 13.4, .1, .03, 0, 6.72, z + s * .14);
    for (let x = -6.6; x < 6.7; x += .6) b.box("steel", .04, .02, .28, x, 6.68, z); S.bel(-7.6, 7.6, 6.55, H, z - .2, z + .2); }
}
function kabelRippe(b, {s, z, Xd, WH}){   // senkrechtes Kabelbündel vor der Rippe, über die Schräge bis zur Querpritsche
  EV_KAB.forEach((kk, i) => { const r = kk === "copper" ? .018 : .032, dz = (i - 2) * .075, d = .44 + (i % 2) * .05;
    b.put(kk, new T3.CylinderGeometry(r, r, WH - .5, 6, 1, true), Xd(d), .5 + (WH - .5) / 2, z + dz);
    const a = V3(Xd(d), WH, z + dz), c = V3(Xd(1.25), 6.7, z + dz), dv = c.clone().sub(a), g = new T3.CylinderGeometry(r, r, dv.length(), 6, 1, true);
    g.applyQuaternion(new T3.Quaternion().setFromUnitVectors(Y1, dv.clone().normalize())); b.put(kk, g, (a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2); });
  for (const y of [1.2, 2.6, 4.0, 5.4]) b.box("trim", .12, .05, .44, Xd(.47), y, z);
}
function schaltLeds(S, B){   // Meldeleuchten in den Fenstern der Schaltschränke (passend zur Wandtextur: 3 Schränke je 2,25 m)
  for (const [xw, s] of [[B.x0, 1], [B.x1, -1]]) for (let a = -11 + .375; a < 11; a += .75) { const z = s > 0 ? -a : a;
    if (PZ.some(p => Math.abs(p - z) < .5)) continue;
    for (let i = 0; i < 5; i++) S.leds.push([xw + s * .012, 1.57, z + (i - 2) * .085 * s, s * PI / 2, (i + Math.round(a * 4)) % 4]); }
}
K.raum.strom2 = {
  licht: {bg: 0x010406, nebel: [0x04121a, .012], himmel: [0xd6fff4, 0x16262c, .78], umgebung: [0xc4fff0, .18], sonne: [0xe8fff8, 1.2],
    decke: [[0x8affd8, 26, 0, 6.0, -5.7], [0x8ad8ff, 26, 0, 6.0, 5.7]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#14262c"], [.4, "#3a5a62"], [.5, "#6fa8a8"], [.58, "#24343a"], [1, "#0a1014"]]); for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(160,255,230,.55)"; g.fillRect(i * 64 + 10, h * .22, 40, 5); }
    const r = zufall(61); for (let i = 0; i < 60; i++) fleck(g, r() * w, h * (.55 + r() * .2), 4, r() < .5 ? "61,220,151" : "79,195,247", .9); },
  all: false,
  huelle: ctx => huelle(ctx, {
    boden: "ev-boden", leit: "ev-leit", wand: "ev-wand", oben: "ev-oben", stirn: "ev-oben", decke: "ev-decke", rippe: "ev-rippe", einlage: null, rohr: "ev-rippe", rohre: [[-.5, .07]],
    leiste: "acc:#7affd8", akzent: "acc:#3DDC97", deckenlicht: null, fenster: {front: [], back: []}, schirme: true, eckrohre: false, ledFarben: ["#3DDC97", "#4FC3F7", "#9BE7FF", "#FFE81F"],
    rippeExtra: kabelRippe,
    stirnExtra(b, {side, m, zw, S}){
      for (const sx of [-1, 1]) { const xc = sx * 5.0;   // Hauptverteiler links und rechts der Tür
        b.putM("ev-rippe", new T3.BoxGeometry(4.98, 5.08, .24).translate(xc, 2.66, .12), m); b.putM("ev-tafel", new T3.PlaneGeometry(4.9, 5.0).translate(xc, 2.66, .245), m);
        b.putM("acc:#7affd8", new T3.BoxGeometry(4.98, .03, .03).translate(xc, 5.22, .23), m);
        EV_KAB.forEach((kk, i) => { const r = kk === "copper" ? .02 : .034; b.putM(kk, new T3.CylinderGeometry(r, r, 1.3, 6, 1, true).translate(sx * 4.8 + (i - 2) * .08, 5.85, .16), m); }); }
      for (const [y, kk] of [[6.4, "copper"], [6.62, "copper"], [6.84, "copper"]]) { b.putM(kk, new T3.BoxGeometry(15.2, .06, .1).translate(0, y, .3), m);
        for (let x = -7.2; x <= 7.2; x += 1.8) b.putM("white", new T3.CylinderGeometry(.03, .03, .26, 8).rotateX(PI / 2).translate(x, y, .15), m); }
      S.bel(-7.5, 7.5, 0, 5.25, zw, zw + (side === "front" ? .3 : -.3)); S.bel(-7.6, 7.6, 6.3, 6.95, zw, zw + (side === "front" ? .4 : -.4));
    },
    extra(c, b, S){ kabelDecke(c, b, S); schaltLeds(S, c.bounds); for (const zw of [-11, 11]) for (const sx of [-1, 1]) c.obstacleBox(sx * 5.0, zw + (zw < 0 ? .15 : -.15), 4.98, .3); }
  }),
  stimmung(ctx, sc, A){ A.eigen = true; const sw = A.sweep; sw.color.set(0x5fffd0); sw.position.set(0, 4.2, -9.6);
    for (let i = 0; i < A.farben.length; i += 3) { const g = (i / 3) % 3; A.farben[i] = g ? .3 : .45; A.farben[i + 1] = g === 1 ? .95 : .85; A.farben[i + 2] = g === 1 ? .65 : 1; } A.geo.attributes.color.needsUpdate = true;
    ctx.tick((dt, t) => { sw.intensity = 10 + 4 * Math.sin(t * .9); }); },
  dekor: {moebel: ["fuse", "breaker", "trafo", "fuse"], fueller: ["kasten", "sos", "kasten"], bilder: false, abzeichen: false, pflanzen: false, globus: false, drohnen: 1}
};

/* =====================================================================
   optik1 · Spiegelstation: dunkles Laserlabor – Spiegelpaneele (mit Glanzstreifen) an Wänden und Schrägen, je Seite ein Laser an der Schräge
   entlang über zwei Umlenkspiegel, Sichtfenster ins All, Cyan-Akzente, dunkler Boden mit Leuchtraster, Decke mit cyanfarbenen Lichtfeldern
   ===================================================================== */
const spTex = {
  boden: e => ctex(1024, 1024, (g, w, h) => { const r = zufall(e ? 71 : 70); g.fillStyle = e ? "#000" : "#070a10"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if (!e) { g.fillStyle = `hsl(215,25%,${5 + r() * 2.5}%)`; g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250); }
      g.strokeStyle = e ? "rgba(79,215,255,.9)" : "#163f52"; g.lineWidth = e ? 2 : 2; g.strokeRect(i * 256 + 1.5, j * 256 + 1.5, 253, 253); }
    if (e) { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = "rgba(160,240,255,.9)"; g.fillRect(i * 256 - 5, j * 256 - 5, 10, 10); } } else streu(g, w, h, 5000, .06, ["#fff", "#4fc3f7"], r);
  }, e ? "sp-boden-e" : "sp-boden", [1, 1]),
  wand: kind => ctex(512, 1024, (g, w, h) => {   // kind: "f" Farbe, "e" Leuchtkarte, "rm" Rauheit (G) + Metall (B): Spiegelpaneel unten, mattes Feld oben
    const Y = m => WY(h, m), F = kind === "f", E = kind === "e", RM = kind === "rm";
    g.fillStyle = F ? "#0b1019" : E ? "#000" : "rgb(0,150,40)"; g.fillRect(0, 0, w, h);
    const pan = (y0, y1, mir) => { L.chamf(g, 14, Y(y1), w - 28, Y(y0) - Y(y1), 22);
      if (F) { if (mir) { const gr = g.createLinearGradient(0, Y(y1), w, Y(y0)); gr.addColorStop(0, "#d7e2ec"); gr.addColorStop(.5, "#aebccb"); gr.addColorStop(1, "#cfdae5"); g.fillStyle = gr; } else g.fillStyle = "#111a28"; g.fill(); }
      else if (RM) { g.fillStyle = mir ? "rgb(0,14,255)" : "rgb(0,120,70)"; g.fill(); }
      if (E) { g.lineWidth = 4; g.strokeStyle = mir ? "rgba(79,215,255,.95)" : "rgba(79,215,255,.45)"; g.stroke(); }
      if (E && mir) { g.save(); g.clip(); g.translate(w * .4, (Y(y0) + Y(y1)) / 2); g.rotate(-.72);   // Glanzstreifen: liest sich als Spiegel, auch wenn die Spiegelung dunkel ist
        g.fillStyle = "rgba(200,242,255,.5)"; g.fillRect(-30, -420, 54, 840); g.fillStyle = "rgba(200,242,255,.34)"; g.fillRect(48, -420, 18, 840); g.restore(); } };
    pan(.3, 2.62, true); pan(2.74, 5.5, false);
    if (E) { g.fillStyle = "rgba(120,235,255,1)"; g.fillRect(0, Y(5.66), w, 5); g.fillRect(0, Y(.16), w, 4); }
    if (F) { g.fillStyle = "#1a2433"; g.fillRect(0, Y(5.76), w, Y(5.56) - Y(5.76)); for (let x = 40; x < w; x += 110) { g.fillStyle = "#4FC3F7"; g.fillRect(x, Y(2.68), 30, 4); } }
  }, "sp-wand-" + kind, [1, 1], kind === "rm"),
};
regM("sp-boden", () => std({map: spTex.boden(false), emissive: 0xffffff, emissiveMap: spTex.boden(true), emissiveIntensity: .26, roughness: .32, metalness: .5}));   // nicht spiegelglatt: sonst Blendfleck im Gang
regM("sp-wand", () => std({map: spTex.wand("f"), emissive: 0xffffff, emissiveMap: spTex.wand("e"), emissiveIntensity: .9, roughnessMap: spTex.wand("rm"), metalnessMap: spTex.wand("rm"), roughness: 1, metalness: 1}));
regM("sp-spiegel", () => std({color: 0xc4d2e0, roughness: .06, metalness: 1}));
regM("sp-oben", () => std({map: L.tex.bulk(), color: 0x2c3440, roughness: .4, metalness: .6}));
regM("sp-decke", () => std({map: L.tex.ceil(), color: 0x8a98ac, emissive: 0x5a6e88, emissiveMap: L.tex.ceil(), emissiveIntensity: 1, roughness: .6, metalness: .2}));   // leicht selbstleuchtend: die Decke (Aufhängung der Spiegel) bleibt sichtbar
regM("sp-rippe", () => std({color: 0x1a2130, roughness: .3, metalness: .8}));
regM("sp-laser", () => addM(0x9dffb0, .95));
regM("sp-halo", () => addM(0x2cff6a, .2));
regM("sp-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0x4fe0ff}, L.ADD)));
// Laser an den Schrägen entlang: je Seite Quelle hinten, zwei Umlenkspiegel, Empfänger vorn – bleibt an den Wänden und kreuzt den Gang nicht.
// Über dem Gang liegt allein der Lichtweg des Raums (20_optik1.js: fünf hängende Spiegel, „Über dir: Lichtweg über fünf Spiegel“).
// SP_W: [z, y]; x folgt der Schräge mit 0,45 m Abstand (vor den Rippen, 0,26 m tief)
const SP_W = [[10.3, 6.05], [3.4, 6.75], [-3.6, 6.05], [-10.3, 6.75]], spX = y => 8 - (y - 5.8) / 1.4 - .45;
function laser(ctx, b, S){
  const seg = [], halo = [], hits = [], Z1 = V3(0, 0, 1);
  const rod = (list, a, c, r) => { const d = c.clone().sub(a), g = new T3.CylinderGeometry(r, r, d.length(), 6, 1, true); g.applyQuaternion(new T3.Quaternion().setFromUnitVectors(Y1, d.normalize())); g.translate((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2); list.push(g); };
  for (const s of [-1, 1]) { const P = SP_W.map(([z, y]) => V3(s * spX(y), y, z)), n3 = P.length - 1;
    for (let i = 0; i < n3; i++) { rod(seg, P[i], P[i + 1], .011); rod(halo, P[i], P[i + 1], .045);
      for (let k = 0; k < 8; k++) { const a = P[i].clone().lerp(P[i + 1], k / 8), c = P[i].clone().lerp(P[i + 1], (k + 1) / 8); S.bel(a.x, c.x, Math.min(a.y, c.y) - .2, Math.max(a.y, c.y) + .2, a.z, c.z); } }
    for (let i = 1; i < n3; i++) { const p = P[i], n = P[i - 1].clone().sub(p).normalize().add(P[i + 1].clone().sub(p).normalize()).normalize();   // Spiegelnormale = Winkelhalbierende
      const M4 = new T3.Matrix4().compose(p.clone().addScaledVector(n, -.03), new T3.Quaternion().setFromUnitVectors(Z1, n), V3(1, 1, 1));
      b.putM("sp-spiegel", new T3.CylinderGeometry(.16, .16, .03, 20).rotateX(PI / 2), M4); b.putM("trim", new T3.TorusGeometry(.165, .02, 6, 20), M4);
      const q = p.clone().addScaledVector(n, -.06); b.put("trim", stabG(q, V3(s * (spX(q.y) + .44), q.y, q.z), .025)); hits.push(p.x, p.y, p.z); }   // Arm zur Schräge
    // Quelle hinten, Empfänger vorn (Gehäuse in Strahlrichtung ausgerichtet)
    const d0 = P[1].clone().sub(P[0]).normalize(), d1 = P[n3].clone().sub(P[n3 - 1]).normalize();
    const M0 = new T3.Matrix4().compose(P[0], new T3.Quaternion().setFromUnitVectors(Z1, d0), V3(1, 1, 1)), M1 = new T3.Matrix4().compose(P[n3], new T3.Quaternion().setFromUnitVectors(Z1, d1), V3(1, 1, 1));
    b.putM("sp-rippe", new T3.BoxGeometry(.26, .26, .5).translate(0, 0, -.27), M0); b.putM("acc:#9dffb0", new T3.BoxGeometry(.28, .035, .035).translate(0, .11, -.08), M0);
    b.putM("sp-rippe", new T3.BoxGeometry(.3, .3, .26).translate(0, 0, .15), M1); b.putM("acc:#9dffb0", new T3.TorusGeometry(.1, .018, 4, 16).translate(0, 0, .015), M1);
    hits.push(P[0].x, P[0].y, P[0].z, P[n3].x, P[n3].y, P[n3].z);
    for (const p of P) S.bel(p.x - .4, p.x + .4, p.y - .35, p.y + .35, p.z - .4, p.z + .4); }
  const G = ctx.group, mL = new T3.Mesh(L.merge(seg), L.matOf("sp-laser")), mH = new T3.Mesh(L.merge(halo), L.matOf("sp-halo")); mL.userData.noPick = mH.userData.noPick = true; G.add(mL, mH);
  const pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.Float32BufferAttribute(hits, 3));
  const pts = new T3.Points(pg, L.imat("sp-treffer", () => new T3.PointsMaterial({map: U.glowTex(), color: 0xb0ffc0, size: .55, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}))); G.add(pts);
  ctx.tick((dt, t) => { const f = .5 + .5 * Math.sin(t * 1.1); L.matOf("sp-halo").opacity = .08 + .05 * f; pts.material.opacity = .55 + .25 * f; });
}
K.raum.optik1 = {
  licht: {bg: 0x010308, nebel: [0x030a14, .012], himmel: [0xcfe6ff, 0x0a1220, .58], umgebung: [0x9fd8ff, .13], sonne: [0xdff0ff, 1.0],
    decke: [[0xa8ecff, 22], [0xbfe8ff, 22]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#03060c"], [.45, "#0a1626"], [.5, "#2a5a78"], [.55, "#0a1422"], [1, "#020408"]]);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(200,240,255,.9)" : "rgba(120,220,255,.75)"; g.fillRect(i * 64 + 14, h * .3, 34, h * .24); g.fillStyle = "#04070c"; g.fillRect(i * 64 + 29, h * .3, 4, h * .24); }
    for (const [y, a] of [[.14, .9], [.22, .6], [.62, .7], [.74, .5]]) { g.fillStyle = `rgba(140,240,255,${a})`; g.fillRect(0, h * y, w, 4); }
    const r = zufall(81); for (let i = 0; i < 16; i++) fleck(g, r() * w, h * (.05 + r() * .2), 8, "220,245,255", .9); },
  huelle: ctx => huelle(ctx, {
    boden: "sp-boden", lauf: null, leit: "sp-leit", wand: "sp-wand", oben: "sp-spiegel", stirn: "sp-oben", decke: "sp-decke", rippe: "sp-rippe", einlage: "sp-spiegel",
    leiste: "acc:#7fe8ff", akzent: "acc:#4FC3F7", rohr: null, deckenlicht: "acc:#4ea4c4", ledFarben: ["#4FC3F7", "#9BE7FF", "#E8F6FF", "#FFE81F"],
    extra: laser
  }),
  stimmung(ctx, sc, A){ for (let i = 0; i < A.farben.length; i += 3) { A.farben[i] = .55; A.farben[i + 1] = .9; A.farben[i + 2] = 1; } A.geo.attributes.color.needsUpdate = true; },
  dekor: {moebel: ["lens", "optbench", "archive", "optbench"], fueller: ["spiegel", "sos", "spiegel"], bilder: [3], pflanzen: false, globus: false, drohnen: 1}
};

/* =====================================================================
   optik2 · Observatorium: gläserne Kuppel über der vorderen Raumhälfte mit Blick auf Ringplanet und Nebel, großes Spiegelteleskop auf der
   Kuppelbrücke, Sternenpaneele an den Wänden, Himmelsscheibe am Boden, nächtlich-kühles Licht
   ===================================================================== */
const OP = {x: 0, z: -5.2, r: 5.0}, OP_T = {z: -6.3, el: .5, yaw: 1.05};   // Kuppel; Teleskop auf eigener Brücke, vom Eingang aus im Profil, schräg nach oben
const opTex = {
  wand: () => ctex(512, 1024, (g, w, h) => {   // 2,25 × 5,8 m: dunkelblaue Sternenpaneele mit Messingkanten
    const r = zufall(91), Y = m => WY(h, m); g.fillStyle = "#0c1424"; g.fillRect(0, 0, w, h);
    for (const [y0, y1] of [[.25, 2.62], [2.72, 5.5]]) { L.plate(g, 10, Y(y1), w - 20, Y(y0) - Y(y1), "#14213a", {r: 8, hi: .12, lo: .5, sheen: .05, shade: .2});
      for (let i = 0; i < 140; i++) { const big = r() > .92; g.fillStyle = `rgba(${r() < .3 ? "255,230,190" : "210,230,255"},${.35 + r() * .6})`; g.beginPath(); g.arc(18 + r() * (w - 36), Y(y1) + 8 + r() * (Y(y0) - Y(y1) - 16), big ? 2.2 : 1 + r() * .7, 0, TAU); g.fill(); }
      g.strokeStyle = "rgba(201,165,74,.75)"; g.lineWidth = 3; g.strokeRect(16, Y(y1) + 6, w - 32, Y(y0) - Y(y1) - 12); }
    g.strokeStyle = "rgba(120,190,255,.45)"; g.lineWidth = 1.5; const fig = [[90, 1.0], [170, 1.5], [260, 1.25], [330, 1.9], [420, 1.6]]; g.beginPath(); fig.forEach(([x, m], i) => i ? g.lineTo(x, Y(m)) : g.moveTo(x, Y(m))); g.stroke();
    fig.forEach(([x, m]) => fleck(g, x, Y(m), 9, "220,240,255", 1)); g.fillStyle = "#c9a54a"; g.fillRect(0, Y(5.72), w, 6); g.fillRect(0, Y(.12), w, 5);
  }, "op-wand", [1, 1]),
  boden: () => ctex(1024, 1024, (g, w, h) => { const r = zufall(92); g.fillStyle = "#0d1320"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { L.plate(g, i * 256 + 3, j * 256 + 3, 250, 250, `hsl(220,22%,${12 + r() * 3}%)`, {hi: .14, lo: .5, sheen: .04}); for (const [a, c] of [[14, 14], [242, 14], [14, 242], [242, 242]]) niet(g, i * 256 + a, j * 256 + c, 2.6); }
    streu(g, w, h, 6000, .1, ["#000", "#8aa0c8"], r); }, "op-boden", [1, 1]),
  ring: () => ctex(1024, 1024, (g, w) => {   // Himmelsscheibe am Boden: Gradkreis, Himmelsrichtungen, Tierkreisband
    const c = w / 2; g.clearRect(0, 0, w, w); g.strokeStyle = "rgba(140,210,255,.9)"; g.fillStyle = "rgba(140,210,255,.9)";
    for (const [rr, lw] of [[500, 5], [470, 2], [400, 3], [250, 2], [120, 2]]) { g.lineWidth = lw; g.beginPath(); g.arc(c, c, rr, 0, TAU); g.stroke(); }
    for (let k = 0; k < 360; k += 5) { const a = k / 180 * PI, r0 = k % 30 ? 482 : 440; g.lineWidth = k % 30 ? 2 : 4; g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a) * 500, c + Math.sin(a) * 500); g.stroke(); }
    g.font = `700 54px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; [["N", -PI / 2], ["O", 0], ["S", PI / 2], ["W", PI]].forEach(([t, a]) => g.fillText(t, c + Math.cos(a) * 340, c + Math.sin(a) * 340));
    g.lineWidth = 2; g.beginPath(); g.ellipse(c, c, 320, 140, .4, 0, TAU); g.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.moveTo(c + Math.cos(a) * 120, c + Math.sin(a) * 120); g.lineTo(c + Math.cos(a) * 400, c + Math.sin(a) * 400); g.stroke(); }
  }, "op-ring")
};
regM("op-wand", () => std({map: opTex.wand(), roughness: .55, metalness: .25}));
regM("op-boden", () => std({map: opTex.boden(), roughness: .45, metalness: .4}));
regM("op-oben", () => std({map: L.tex.bulk(), color: 0x4a5670, roughness: .5, metalness: .4}));
regM("op-decke", () => std({map: L.tex.ceil(), color: 0x4c5872, roughness: .5, metalness: .4}));
regM("op-kuppel", () => addM(0x7fb8ff, .06, {fog: false}));
regM("op-ring", () => addM(0x6fd0ff, .32, {map: opTex.ring()}));
regM("op-linse", () => std({color: 0x0c1830, emissive: 0x2a6aa8, emissiveIntensity: .7, roughness: .05, metalness: .6}));
regM("op-leit", () => L.basic(Object.assign({map: L.tex.guide(), color: 0x8fb8ff}, L.ADD)));
function kuppel(ctx, b, S){
  const {x, z, r: R} = OP, H = S.H, Rd = R + .02;
  b.put("op-kuppel", new T3.SphereGeometry(Rd, 40, 14, 0, TAU, 0, PI / 2), x, H, z);
  for (let i = 0; i < 12; i++) b.put("rib", new T3.TorusGeometry(Rd, .05, 4, 40, PI).rotateY(i * PI / 12), x, H, z);
  for (const e of [.32, .7, 1.1]) b.put("rib", new T3.TorusGeometry(Rd * Math.cos(e), .045, 4, 64).rotateX(PI / 2), x, H + Rd * Math.sin(e), z);
  b.put("acc:#8fd8ff", new T3.TorusGeometry(Rd * Math.cos(.32), .02, 4, 72).rotateX(PI / 2), x, H + Rd * Math.sin(.32) - .07, z);
  // Brücke quer über die Öffnung, darauf das Teleskop: Rohr schräg nach vorn oben, zum Ringplaneten
  for (const dz of [-.38, .38]) { b.box("rib", 2 * R + .5, .3, .16, x, H - .15, OP_T.z + dz); b.box("acc:#8fd8ff", 2 * R + .4, .02, .04, x, H - .31, OP_T.z + dz); }
  for (let k = -4; k <= 4; k++) b.box("trim", .1, .06, .9, x + k * R / 4.6, H - .03, OP_T.z);
  const pv = V3(x, H + 1.55, OP_T.z), M = new T3.Matrix4().makeRotationFromEuler(new T3.Euler(OP_T.el, OP_T.yaw, 0, "YXZ")).setPosition(pv), F = new T3.Matrix4().makeRotationY(OP_T.yaw).setPosition(x, H, OP_T.z);
  b.putM("trim", new T3.CylinderGeometry(.55, .65, .22, 24).translate(0, .11, 0), F); b.putM("acc:#8fd8ff", new T3.TorusGeometry(.6, .02, 4, 32).rotateX(PI / 2).translate(0, .23, 0), F);
  b.putM("rib", new T3.CylinderGeometry(.32, .42, .55, 20).translate(0, .5, 0), F); b.putM("rib", new T3.BoxGeometry(1.66, .18, .5).translate(0, .82, 0), F);
  for (const s of [-1, 1]) b.putM("white", new T3.BoxGeometry(.16, 1.0, .42).translate(s * .74, 1.32, 0), F);
  const tube = [["white", new T3.CylinderGeometry(.52, .52, 4.4, 32, 1, true), -1.1], ["trim", new T3.CylinderGeometry(.6, .58, 1.0, 32, 1, true), -3.75], ["trim", new T3.CylinderGeometry(.55, .55, .5, 28), 1.3]];
  for (const [kk, g, zz] of tube) b.putM(kk, g.rotateX(PI / 2).translate(0, 0, zz), M);
  for (const zz of [.7, -.6, -2.6]) b.putM("trim", new T3.TorusGeometry(.54, .05, 6, 32).translate(0, 0, zz), M);
  b.putM("ly", new T3.TorusGeometry(.535, .02, 4, 32).translate(0, 0, -1.6), M);
  b.putM("acc:#8fd8ff", new T3.TorusGeometry(.58, .035, 6, 36).translate(0, 0, -4.27), M); b.putM("op-linse", new T3.CircleGeometry(.5, 32).rotateY(PI).translate(0, 0, -3.25), M);
  b.putM("white", new T3.CylinderGeometry(.09, .09, 1.1, 12).rotateX(PI / 2).translate(0, .62, -1.2), M); for (const zz of [-.9, -1.5]) b.putM("trim", new T3.BoxGeometry(.06, .2, .06).translate(0, .5, zz), M);
  b.putM("rib", new T3.CylinderGeometry(.06, .06, 1.75, 10).rotateZ(PI / 2), M);
  // Himmelsscheibe am Boden (nur Leuchtlinien, belegt nichts)
  const disk = new T3.Mesh(new T3.PlaneGeometry(2 * R, 2 * R), L.matOf("op-ring")); disk.rotation.x = -PI / 2; disk.position.set(x, .007, z); disk.userData.noPick = true; ctx.group.add(disk);
  S.bel(-R - .4, R + .4, H - .4, H, z - R - .4, z + R + .4);
}
K.raum.optik2 = {
  licht: {bg: 0x02040c, nebel: [0x060c1c, .009], himmel: [0xc4d4ff, 0x10182a, .62], umgebung: [0xaabfff, .15], sonne: [0xdce6ff, 1.15, [4, 14, 2]],
    decke: [[0xfff0d8, 22, 0, 6.1, 5.7], [0xb8ccff, 24, 0, 5.4, -5.2]]},
  umwelt(g, w, h){ himmel(g, w, h, [[0, "#060a18"], [.42, "#121c38"], [.5, "#3a4a70"], [.56, "#141a2a"], [1, "#05070c"]]); const r = zufall(95);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(230,240,255,${.4 + r() * .6})`; g.fillRect(r() * w, r() * h * .45, 1.5, 1.5); } fleck(g, w * .3, h * .2, 50, "120,160,255", .5); },
  all: {planet: [-8, 30, -62], sonne: [-46, 64, 34], mond: [13, 9, -44], nebel: [[290, 80, 60, [8, 72, -14]], [200, 70, 50, [-30, 44, -36]]]},   // Mond im rechten Panoramafenster
  huelle: ctx => huelle(ctx, {
    boden: "op-boden", leit: "op-leit", wand: "op-wand", oben: "op-oben", stirn: "op-oben", decke: "op-decke", einlage: "trim", leiste: "acc:#8fd8ff", akzent: "acc:#c9a54a",
    deckenlicht: null, loch: [OP], mittelLuecken: [[2.75, 4.45]], ledFarben: ["#8fd8ff", "#E8F6FF", "#FFE81F", "#4FC3F7"],
    fenster: {front: [{x0: 2.9, x1: 7.4, y0: 1.25, y1: 6.45, c: .95}, {x0: -7.4, x1: -2.9, y0: 1.25, y1: 6.45, c: .95}]},   // Panoramafenster nach vorn: Weltraumblick schon vom Eingang aus
    extra: kuppel
  }),
  stimmung(ctx, sc, A){ for (let i = 0; i < A.farben.length; i += 3) { const w = (i / 3) % 4 === 0; A.farben[i] = w ? 1 : .7; A.farben[i + 1] = w ? .92 : .8; A.farben[i + 2] = w ? .75 : 1; } A.geo.attributes.color.needsUpdate = true; },
  dekor: {moebel: ["archive", "bench", "lens", "archive"], fueller: ["pot", "sos"], bilder: [0, 3, 4, 5], globus: true, drohnen: 1}
};

/* ---------- Neue Möbel für die Ausstattung (D.ITEMS, lokal: x entlang der Wand, y nach oben, z von der Wand in den Raum) ---------- */
const D = K.dlib;
if (D && D.ITEMS) {
  const tank = (B, x) => { const r = .3, zc = .42, h = 1.62;
    B.cyl("frame", r + .06, r + .08, .14, 16, x, .07, zc); B.cyl("white", r, r, h, 18, x, .14 + h / 2, zc); B.sph("white", r, x, .14 + h, zc, 1, .5, 1, 18, 10);
    B.add("haz", U.scaleUV(new T3.CylinderGeometry(r + .006, r + .006, .16, 16, 1, true), 4, 1), x, .5, zc); for (const y of [1.15, 1.55]) B.cyl("rk-rohr", r + .012, r + .012, .06, 18, x, y, zc);
    B.rod("rk-rohr", [x, .14 + h + .1, zc], [x, 2.15, zc], .05, 8); B.rod("rk-rohr", [x, 2.15, zc], [x, 2.15, .02], .05, 8); B.sph("rk-rohr", .07, x, 2.15, zc, 1, 1, 1, 8, 6);
    B.plane("screen", .2, .2, D.PR.gauge, x, 1.35, zc + r + .006); B.tor("lr", .08, .014, x + .18, .95, zc + .26, 0, .6, 0, 4, 16); B.box("frame", .3, .02, .02, x, 2.0, zc + .18); };
  D.ITEMS.tank = {minW: .8, maxW: .8, d: .8, h: 2.3, build: B => tank(B, 0)};
  D.ITEMS.tanks = {minW: 1.6, maxW: 1.7, d: .8, h: 2.3, build: (B, w) => { tank(B, -w / 4); tank(B, w / 4); B.rod("rk-rohr", [-w / 4, 2.15, .42], [w / 4, 2.15, .42], .05, 8); }};
  D.ITEMS.breaker = {minW: 1.0, maxW: 1.4, d: .5, h: 2.45, build: (B, w) => D.breakerCab(B, w)};
  D.ITEMS.fuse = {minW: 1.2, maxW: 2.2, d: .55, h: 1.5, build: (B, w) => {   // Sicherungsbank: Pult mit Schraubsicherungen und Meldeleuchten
    const d = .5, n = Math.floor((w - .2) / .16); B.box("ev-rippe", w, .95, d, 0, .475, d / 2); B.box("frame", w + .04, .06, d + .04, 0, .03, d / 2);
    B.add("ev-rippe", new T3.BoxGeometry(w, .06, .42).rotateX(.45), 0, 1.05, d / 2 - .02); B.box("acc:#7affd8", w - .1, .015, .01, 0, .9, d + .006);
    for (let i = 0; i < n; i++) { const x = -((n - 1) * .16) / 2 + i * .16; B.cyl("white", .045, .05, .09, 10, x, 1.12, d / 2 - .02, .45); B.cyl(i % 5 === 2 ? "lr" : i % 3 ? "lg" : "ly", .025, .025, .02, 8, x, 1.17, d / 2 + .01, .45);
      B.box("white", .1, .2, .02, x, .55, d + .01); B.box("dark", .04, .07, .03, x, .58, d + .025); }
    B.box("frame", w, .3, .04, 0, 1.38, .06); B.plane("screen", Math.min(1.1, w - .2), .26, D.PR.energie, 0, 1.38, .082); }};
  D.ITEMS.trafo = {minW: 1.2, maxW: 1.3, d: .8, h: 1.75, build: B => {   // Transformator: Kessel mit Kühlrippen, drei Durchführungen mit Kupferkappen, Warnschild
    const zc = .42; B.box("ev-rippe", 1.0, 1.05, .6, 0, .6, zc); B.box("frame", 1.1, .08, .7, 0, .04, zc); B.box("frame", 1.04, .05, .64, 0, 1.15, zc);
    for (let i = 0; i < 9; i++) B.box("ev-rippe", .025, .85, .14, -.4 + i * .1, .6, zc + .37);
    for (let i = -1; i <= 1; i++) { for (let k = 0; k < 4; k++) B.cyl("white", .07 - k * .008, .075 - k * .008, .07, 12, i * .3, 1.22 + k * .08, zc); B.cyl("copper", .035, .035, .1, 8, i * .3, 1.58, zc); }
    B.plane("screen", .2, .2, D.PR.warn, .32, .85, zc + .451); B.box("acc:#7affd8", .9, .012, .01, 0, 1.12, zc + .305); }};
  // schmale Füllteile je Thema (statt lauter Notfallkästen)
  D.ITEMS.ventil = {minW: .5, maxW: .5, d: .4, h: 2.2, wall: true, build: B => {   // Kühlmittelventil mit Handrad und Manometer
    B.cyl("rk-rohr", .07, .07, 1.25, 10, 0, 1.55, .12); B.box("rk-rippe", .2, .22, .2, 0, 1.3, .12); B.cyl("rk-rohr", .05, .05, .2, 10, 0, 1.3, .27, PI / 2);
    B.tor("lr", .13, .018, 0, 1.3, .37, 0, 0, 0, 4, 20); for (let k = 0; k < 3; k++) { const a = k / 3 * PI; B.box("lr", .24, .018, .018, 0, 1.3, .37, 0, 0, a); }
    B.cyl("rk-dunkel", .09, .09, .04, 14, 0, 1.75, .22, PI / 2); B.plane("screen", .15, .15, D.PR.gauge, 0, 1.75, .242); }};
  D.ITEMS.kasten = {minW: .5, maxW: .5, d: .24, h: 2.4, wall: true, build: B => {   // Unterverteiler an der Wand mit Kabeln nach oben
    B.box("ev-rippe", .44, .58, .18, 0, 1.35, .09); B.box("frame", .46, .04, .2, 0, 1.66, .1); B.plane("screen", .17, .17, D.PR.warn, -.06, 1.36, .182);
    B.box("lg", .03, .03, .01, .15, 1.56, .182); B.box("ly", .03, .03, .01, .15, 1.5, .182);
    B.cyl("rubber", .025, .025, .72, 6, -.1, 2.0, .08); B.cyl("ev-blau", .025, .025, .72, 6, .1, 2.0, .08); }};
  D.ITEMS.spiegel = {minW: .56, maxW: .56, d: .42, h: 2.4, build: B => {   // stehendes Spiegelpaneel mit Leuchtkanten
    B.box("sp-rippe", .52, .06, .4, 0, .03, .21); B.box("sp-rippe", .54, 2.24, .05, 0, 1.18, .12); B.add("sp-spiegel", new T3.PlaneGeometry(.46, 2.12), 0, 1.18, .147);
    for (const s of [-1, 1]) B.box("acc:#7fe8ff", .012, 2.1, .012, s * .25, 1.18, .15); B.box("acc:#7fe8ff", .46, .012, .012, 0, 2.27, .15); }};
  D.ITEMS.lens = {minW: 1.1, maxW: 1.6, d: .5, h: 2.15, build: (B, w) => D.lensCase(B, w)};
  D.ITEMS.optbench = {minW: 1.6, maxW: 2.4, d: .7, h: 1.4, build: B => {   // optische Bank: Tisch mit Schiene, Laser, Linsen, Schirm
    const w = 2.0, d = .62, y = .86; B.box("sp-rippe", w, .06, d, 0, y, d / 2 + .02); B.box("acc:#7fe8ff", w, .012, .01, 0, y - .02, d + .03);
    for (const sx of [-1, 1]) for (const sz of [.08, d - .04]) B.box("frame", .05, y - .03, .05, sx * (w / 2 - .06), (y - .03) / 2, sz);
    B.box("steel", w - .2, .03, .06, 0, y + .045, d / 2); B.box("frame", .26, .14, .14, -w / 2 + .25, y + .14, d / 2); B.box("acc:#8ff6ff", .02, .02, .02, -w / 2 + .39, y + .15, d / 2);
    B.rod("acc:#8ff6ff", [-w / 2 + .39, y + .15, d / 2], [w / 2 - .25, y + .15, d / 2], .004, 4);
    for (const x of [-.3, .2]) { B.box("frame", .05, .12, .05, x, y + .1, d / 2); B.add("lens", D.lensGeo(.07, .016, x < 0 ? "vex" : "cave"), x, y + .2, d / 2, 0, 0, PI / 2); B.tor("brass", .07, .006, x, y + .2, d / 2, 0, PI / 2, 0, 4, 18); }
    B.box("white", .02, .3, .3, w / 2 - .25, y + .2, d / 2); B.sph("acc:#bff8ff", .03, w / 2 - .262, y + .15, d / 2, 1, 1, 1, 8, 6); }};
}

/* ---------- Bauhilfen für weitere Raumthemen (17_raum_sterne_b.js …) ---------- */
K.raumLib = {huelle, regM, std, addM, ctex, zufall, streu, niet, warnStreifen, himmel, fleck, kleber, strahlZeichen, WY, leuchten, PZ};
})();
