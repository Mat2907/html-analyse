/* ---------- 17_raum_zauber.js ---------- */
/* =====================================================================
   Raumthemen der Zauberschule – jeder Raum sieht aus wie sein Name (RAUMTHEMEN.md)
   ---------------------------------------------------------------------
   Aufbau
   - Diese Datei legt die Weichen und das Werkzeug (RH = R3D.kits.zauber.raumHilfe) an. Die Räume stehen in eigenen Dateien
     17_raum_zauber_<thema>.js: _strom (strom1 Turm der Blitze, strom2 Kerker der Schaltkreise), _optik (optik1 Spiegelsaal,
     optik2 Sternwarte der Linsen), _beweg (beweg1 Besenflugplatz, beweg2 Kammer der Bewegungsformel), _kraft (kraft1 Halle der
     schwebenden Kräfte, kraft2 Rampe am Schlossberg). Alle laden nach 10_zauber.js und 13_dekor_zauber.js
     (alphabetisch, jede Datei ein eigener <script>-Block – eine Datei mit Fehler nimmt die anderen nicht mit).
   - R3D.kits.zauber.raum[key] beschreibt einen Raum. Fehlt der Eintrag (Halle, noch nicht umgebaute Räume), läuft alles wie bisher.
   - Die Weichen umhüllen kit.env, kit.shell, kit.ambient und kit.station; kit.decor (13_dekor_zauber.js) liest raum[key].dekor selbst.
   - Werkzeug RH: sammler() (je Material ein Mesh), zug(Grundriss, Profil) (Wände, Sockel, Gesimse, Kehlen), kasten() (Quader mit echtem Texturmaß),
     bogen()/rechteck() (Grundrisse), bogenForm() (Rund-/Spitzbogen), boden(), mat()/tex() (einmal angelegt, bleiben erhalten), bruchstein() (Mauertextur),
     punktlicht()/fackel()/flammen(), himmel()/himmelTex()/sterne(), belege()/sperre()/aussen() (Belegung, Gehen), huelle(), dekor() (Ausstattungswerkzeug),
     quader() (Quadermauer-Textur), spalte()/uvMal() (Atlas-Spalten, Texturmaß); draußen: weite() (Boden bis zum Horizont), kulisse() (Landschaftsband
     ringsum), karte()/burgMaler() (gemalte Burg), torhaus() (Tor mit Türmen um eine Tür), wimpel() (flatternde Wimpelkette),
     draussenStuecke() (Ausstattung draußen: tonne, frachtkisten, heuballen, quader, karren, ballkiste, zeitnehmer – als dekor.vorher-Schritt eintragen).
   Felder einer Raumbeschreibung (alle freiwillig)
     licht:    {hintergrund, nebel: [farbe, dichte], himmel: [oben, unten, stärke], umgebung: [farbe, stärke], sonne: [farbe, stärke, [dx, dy, dz]]}
               ändert nur Farben, Stärken und Lage der Lichter aus env (1 Hemisphere, 1 Ambient, 1 Directional mit Schatten, FogExp2);
               sonne: Lage relativ zur Raummitte. Zahl und Art der Lichter bleiben in allen Räumen gleich (gemeinsame Shader-Programme).
     shell(ctx, RH) → baut die Raumhülle statt der Standardhülle und gibt 7,5 zurück (darauf sind die Raumteile abgestimmt). Pflichten:
               · ctx.floor setzen (RH.boden) – der Boden fängt die Klicks zum Gehen
               · RH.huelle(ctx, {...}) – Lage der Hüllenteile für die Ausstattung (Säulen, Fackeln, Fenster für Vorhänge, Balken für Kronleuchter)
               · genau RH.PUNKTLICHTER (2) Punktlichter über RH.punktlicht()/RH.fackel() (weniger: die Weiche füllt mit dunklen auf, mehr: Fehler);
                 nie ctx.light (das sind die 4 Lichter des Raums)
               · Teile, die mehr als ~0,35 m in den Raum ragen: RH.belege(ctx, quader) (wird beim ersten ctx.frei()/ctx.belege() nachgetragen,
                 also auch für die Lehrkraft-Tafel), am Boden zusätzlich ctx.obstacleBox; Bereiche hinter gekrümmten Wänden: RH.aussen()
               · in 7,5 m Höhe etwas Festes, wo die Raumdateien etwas aufhängen (Decke, Balken, Gewölbe, Brücke, Ast …)
               · Seitenwände x = ±8 bei z ∈ [−8,45; 8,45], y 2,75–5,4 eben und frei (Tafeln), Türen mit Umrahmung, Gang |x| < 1,6 frei
     ambient:  Optionen für kit.ambient: {kerzen, staub, staubFarbe, steigen}
     stimmung(ctx, sc, RH) → zusätzliche Stimmung nach ambient (Blitze, Tropfen …), keine Lichter anlegen
     station:  {text: {color: …}, schein: [Farbe, Deckkraft]} – Schrift der Stationsschilder (z. B. dunkel in hellen Räumen, damit Nummer und Name
               lesbar bleiben; der Schein wird dann zuerst gezeichnet) und gedämpfter Schein dahinter
     tuer:     {hinten: y, vorn: y} – Höhe der Türschilder (sonst 5,3 m), wenn Raumteile über dem Gang sie vom anderen Raumende aus verdecken
     dekor:    {deck, tief, ohne, bilder, buecher, vorher, nachher} → 13_dekor_zauber.js (decorRaum, decks, kunstStueck);
               eigene Möbel als Einträge in RH.dekor().STUECK (bau(D, w) in Wandkoordinaten: x entlang der Wand, z in den Raum)
   Fehler: Wirft shell(), werden ihre Teile entfernt, das Licht zurückgesetzt und Standardhülle, -stimmung und -ausstattung gebaut
   (ctx._raumFehler, console.error). Fehler in stimmung() und in einzelnen Ausstattungsschritten landen in console.error, der Rest bleibt.
   Neuer Raum: Datei 17_raum_zauber_<thema>.js nach dem Muster von _strom anlegen: const RH = R3D.kits.zauber.raumHilfe; RH.raum.<key> = {…}.
   Draußen: RH.himmel(ctx, tex) (Himmelskugel ohne Nebel), RH.sterne(ctx, …), Boden RH.boden(ctx, mat), statt Decke ein Träger in 7,5 m
   (Pergola, Ast, Kranbrücke), Begrenzung statt Wänden (Mauer, Tribüne, Palisade) mit senkrechter Fläche bei x = ±8 für die Tafeln.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D; if (!T3 || !R3D || !R3D.util || !R3D.kits || !R3D.kits.zauber) return;
const U = R3D.util, KIT = R3D.kits.zauber, PI = Math.PI;
const RAUM = KIT.raum = KIT.raum || {};
const ALT = KIT._alt = KIT._alt || {env: KIT.env, shell: KIT.shell, ambient: KIT.ambient, station: KIT.station};
const RH = KIT.raumHilfe = {raum: RAUM, H: 7.5, PUNKTLICHTER: 2, PI};
RH.reduziert = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const raumVon = ctx => ctx.key !== "halle" && RAUM[ctx.key] || null;

/* ---------- Weichen ---------- */
function lichtStand(sc, L){ return {bg: sc.background && sc.background.isColor ? sc.background.clone() : sc.background, fog: sc.fog ? [sc.fog.color.clone(), sc.fog.density] : null,
  h: [L.hemi.color.clone(), L.hemi.groundColor.clone(), L.hemi.intensity], a: [L.amb.color.clone(), L.amb.intensity], d: [L.dir.color.clone(), L.dir.intensity, L.dir.position.clone()]}; }
function lichtSetzen(sc, L, s){ sc.background = s.bg; if (s.fog && sc.fog) { sc.fog.color.copy(s.fog[0]); sc.fog.density = s.fog[1]; }
  L.hemi.color.copy(s.h[0]); L.hemi.groundColor.copy(s.h[1]); L.hemi.intensity = s.h[2]; L.amb.color.copy(s.a[0]); L.amb.intensity = s.a[1];
  L.dir.color.copy(s.d[0]); L.dir.intensity = s.d[1]; L.dir.position.copy(s.d[2]); }
KIT.env = (ctx, sc) => {
  ALT.env(ctx, sc);
  const R = raumVon(ctx), L = ctx.weltLicht; if (!R || !R.licht || !L) return;
  const alt = lichtStand(sc, L); ctx._lichtZurueck = () => lichtSetzen(sc, L, alt);
  try { const o = R.licht, B = ctx.bounds, cz = (B.z0 + B.z1) / 2;
    if (o.hintergrund != null) sc.background = new T3.Color(o.hintergrund);
    if (o.nebel && sc.fog) { sc.fog.color.set(o.nebel[0]); sc.fog.density = o.nebel[1]; }
    if (o.himmel) { L.hemi.color.set(o.himmel[0]); L.hemi.groundColor.set(o.himmel[1]); L.hemi.intensity = o.himmel[2]; }
    if (o.umgebung) { L.amb.color.set(o.umgebung[0]); L.amb.intensity = o.umgebung[1]; }
    if (o.sonne) { L.dir.color.set(o.sonne[0]); L.dir.intensity = o.sonne[1]; if (o.sonne[2]) L.dir.position.set(o.sonne[2][0], o.sonne[2][1], cz + o.sonne[2][2]); }
    L.basis = {h: L.hemi.intensity, a: L.amb.intensity, d: L.dir.intensity};
  } catch (e) { console.error("Zauberschule: Licht", ctx.key, e); ctx._lichtZurueck(); }
};
function wegraeumen(o){ o.traverse(n => { if (n.geometry) n.geometry.dispose(); const ms = Array.isArray(n.material) ? n.material : n.material ? [n.material] : [];
  ms.forEach(m => { if (!m.userData.keep) m.dispose(); }); }); }
KIT.shell = (ctx, o = {}) => {
  const R = !o.hall && raumVon(ctx); if (!R || !R.shell) return ALT.shell(ctx, o);
  const G = ctx.group, n0 = G.children.length, ob0 = ctx._obst.length, tk0 = ctx._ticks.length;
  try {
    const H = R.shell(ctx, RH) ?? RH.H;
    let n = 0; for (const c of G.children.slice(n0)) c.traverse(q => { if (q.isPointLight) n++; });
    if (n > RH.PUNKTLICHTER) throw new Error(`${n} Punktlichter in der Raumhülle (erlaubt: ${RH.PUNKTLICHTER})`);
    for (; n < RH.PUNKTLICHTER; n++) { const l = new T3.PointLight(0x000000, 0, .01); l.position.set(0, -30, 0); G.add(l); }
    if (!ctx.floor) throw new Error("Raumhülle ohne Boden (ctx.floor)");
    if (!ctx.huelle) RH.huelle(ctx, {});
    nachtragen(ctx);
    return H;
  } catch (e) {
    console.error("Zauberschule: Raumhülle", ctx.key, "– Standardhülle", e);
    while (G.children.length > n0) { const c = G.children[G.children.length - 1]; G.remove(c); wegraeumen(c); }
    ctx._obst.length = ob0; ctx._ticks.length = tk0; ctx.floor = null; ctx.huelle = null; ctx._belegtHuelle = null; ctx._raumFehler = true;
    if (ctx._lichtZurueck) ctx._lichtZurueck();
    return ALT.shell(ctx, o);
  }
};
KIT.ambient = (ctx, sc) => {
  const R = !ctx._raumFehler && raumVon(ctx); if (!R) return ALT.ambient(ctx, sc);
  try { ALT.ambient(ctx, sc, R.ambient || {}); } catch (e) { console.error("Zauberschule: Stimmung", ctx.key, e); }
  if (R.stimmung) try { R.stimmung(ctx, sc, RH); } catch (e) { console.error("Zauberschule: Raumstimmung", ctx.key, e); }
  // Türschilder umhängen (tuer: {hinten: y, vorn: y}); die Türen stehen jetzt, die Belegung wird erst danach berechnet
  if (R.tuer) for (const o of ctx._inter || []) { const ia = o.userData.ia, s = o.userData.schild, y = ia && ia.kind === "door" && s && R.tuer[o.position.z > 0 ? "hinten" : "vorn"]; if (y) s.position.y = y; }
};
KIT.station = (ctx, j, name) => {
  const R = !ctx._raumFehler && raumVon(ctx), o = R && R.station && R.station.text; if (!o) return ALT.station(ctx, j, name);
  const t0 = ctx.text; ctx.text = (s, q = {}) => t0(s, Object.assign({}, q, o));
  let g; try { g = ALT.station(ctx, j, name); } finally { ctx.text = t0; }
  // dunkle Schrift: den additiven Schein zuerst zeichnen – bei streifendem Blick (gleiche Tiefe) legte er sich sonst über die Ziffer und bleichte sie aus;
  // schein = [Farbe, Deckkraft] dämpft ihn vor hellen Wänden
  const sch = R.station.schein; g.traverse(q => { if (!q.isSprite) return; q.renderOrder = -1; if (sch) { q.material.color.set(sch[0]); q.material.opacity = sch[1]; } });
  return g;
};
// Hüllenteile als belegt nachtragen, sobald jemand frei()/belege() fragt (Lehrkraft-Tafel, Ausstattung): Vorher kennt die Belegung des Kerns
// noch nicht alle Lernstationen, die nach ambient kommen (afterBuild) – ein früher Aufruf würde sie aus dem Zwischenspeicher fallen lassen.
function nachtragen(ctx){
  const liste = ctx._belegtHuelle; if (!liste || !liste.length) return;
  const frei0 = ctx.frei, bel0 = ctx.belege; let offen = true;
  const los = () => { if (!offen) return; offen = false; for (const b of liste) bel0(b); };
  ctx.frei = (b, r) => { los(); return frei0(b, r); }; ctx.belege = b => { los(); return bel0(b); };
}

/* ---------- Werkzeug: Matrizen, Materialien, Texturen ---------- */
const _e = new T3.Euler(), _q = new T3.Quaternion(), _p = new T3.Vector3(), _s = new T3.Vector3(), _Y = new T3.Vector3(0, 1, 0);
RH.M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => { _e.set(rx, ry, rz, "YXZ"); return new T3.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e), _s.set(sx, sy, sz)); };
const keep = m => { m.userData.keep = true; if (m.map) m.map.userData.keep = true; return m; };
const MATS = new Map();
RH.keep = keep;
RH.mat = (key, make) => { if (!MATS.has(key)) MATS.set(key, keep(make())); return MATS.get(key); };   // je Schlüssel einmal, bleibt beim Raumwechsel erhalten
RH.tex = (key, w, h, draw, wrap = true) => { const t = U.canvasTex(w, h, draw, "zr-" + key, wrap ? [1, 1] : null); t.userData.keep = true; return t; };
RH.seeded = U.seeded;
RH.std = (o) => new T3.MeshStandardMaterial(o);
RH.basic = (o) => new T3.MeshBasicMaterial(Object.assign({toneMapped: false}, o));
RH.additiv = (o) => new T3.MeshBasicMaterial(Object.assign({transparent: true, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false}, o));
// Zeichenhilfen für Canvas-Texturen
RH.rad = (g, x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
RH.lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
RH.flecken = (g, w, h, n, a, cols, r) => { for (let i = 0; i < n; i++) { g.globalAlpha = a * r(); g.fillStyle = cols[(r() * cols.length) | 0]; const s = .6 + r() * 1.8; g.fillRect(r() * w, r() * h, s, s); } g.globalAlpha = 1; };
// Bruchsteinmauer: unregelmäßige, gerundete Steine in Lagen; o = {grund, fuge, h: [Farbton, Sättigung, Helligkeit], streu, lagen, nass, moos}
RH.bruchstein = (g, w, h, r, o = {}) => {
  g.fillStyle = o.fuge || "#1d1a18"; g.fillRect(0, 0, w, h); RH.flecken(g, w, h, 9000, .5, ["#000", "#3a3632", "#55504a"], r);
  const lagen = o.lagen || 9, lh = h / lagen, [hu, sa, li] = o.h || [30, 8, 36], sp = o.spanne || 18;
  for (let j = 0; j < lagen; j++) { let x = -r() * 80; const y0 = j * lh;
    while (x < w) { const bw = lh * (.8 + r() * 1.7), hh = lh * (.72 + r() * .22), cx = x + bw / 2, cy = y0 + lh / 2 + (r() - .5) * lh * .14, l = li + (r() - .5) * (o.streu || 14);
      // unregelmäßiges Vieleck statt Ziegel: 9 Ecken mit Zufallsradius
      const P = []; for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2 + r() * .3, f = .82 + r() * .2; P.push([cx + Math.cos(a) * (bw / 2 - 3) * f, cy + Math.sin(a) * (hh / 2) * f]); }
      g.beginPath(); P.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath();
      g.fillStyle = `hsl(${hu + (r() - .5) * sp},${Math.max(0, sa + (r() - .5) * 8)}%,${l}%)`; g.fill();
      g.fillStyle = RH.lin(g, 0, cy - hh / 2, 0, cy + hh / 2, [[0, "rgba(255,255,255,.13)"], [.45, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,.34)"]]); g.fill();
      g.save(); g.clip();
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${r() < .5 ? "0,0,0" : "255,255,255"},${.04 + r() * .07})`; const q = 2 + r() * 9; g.beginPath(); g.arc(cx + (r() - .5) * bw, cy + (r() - .5) * hh, q, 0, 7); g.fill(); }
      for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(0,0,0,${.14 + r() * .16})`; g.lineWidth = 1 + r() * 1.5; g.beginPath(); const px = cx + (r() - .5) * bw, py = cy + (r() - .5) * hh; g.moveTo(px, py); g.lineTo(px + (r() - .5) * 34, py + (r() - .5) * 22); g.stroke(); }
      g.restore(); x += bw * (.96 + r() * .08); } }
  RH.flecken(g, w, h, 12000, .3, ["#000", "#6a625a", "#141210", "#8a8070"], r);
  if (o.nass) for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h * .6, l = h * (.2 + r() * .6); g.fillStyle = RH.lin(g, 0, y, 0, y + l, [[0, "rgba(0,0,0,0)"], [.3, `rgba(10,20,15,${.18 + r() * .2})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(x, y, 4 + r() * 14, l); }
  if (o.moos) for (let i = 0; i < 260; i++) { const x = r() * w, y = h * (.72 + r() * .28); g.fillStyle = `hsla(${95 + r() * 30},${30 + r() * 20}%,${16 + r() * 12}%,${.25 + r() * .35})`; g.beginPath(); g.arc(x, y, 3 + r() * 14, 0, 7); g.fill(); }
};

/* ---------- Werkzeug: Geometrie sammeln und je Material verschmelzen ---------- */
RH.merge = list => {
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = nv > 65000 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) { const n = g.attributes.position.count; pos.set(g.attributes.position.array, ov * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, ov * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, ov * 2);
    if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) idx[oi + k] = a[k] + ov; oi += a.length; } else { for (let k = 0; k < n; k++) idx[oi + k] = ov + k; oi += n; }
    ov += n; g.dispose(); }
  const out = new T3.BufferGeometry(); out.setAttribute("position", new T3.BufferAttribute(pos, 3)); out.setAttribute("normal", new T3.BufferAttribute(nor, 3));
  out.setAttribute("uv", new T3.BufferAttribute(uv, 2)); out.setIndex(new T3.BufferAttribute(idx, 1)); out.computeBoundingSphere(); return out;
};
// Sammler: put(material, geometrie, matrix) – am Ende ein Mesh je Material (keine Schatten werfen, außer o.schatten)
RH.sammler = () => {
  const teile = new Map(), S = {
    put(m, geo, mx){ if (mx) geo.applyMatrix4(mx); if (!teile.has(m)) teile.set(m, []); teile.get(m).push(geo); return S; },
    box(m, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ return S.put(m, new T3.BoxGeometry(w, h, d), RH.M(x, y, z, rx, ry, rz)); },
    cyl(m, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0, offen = false){ return S.put(m, new T3.CylinderGeometry(rt, rb, h, seg, 1, offen), RH.M(x, y, z, rx, ry, rz)); },
    rod(m, p, q, r, seg = 6, r2){ const d = new T3.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = d.length(); if (L < 1e-4) return S;
      const g = new T3.CylinderGeometry(r2 ?? r, r, L, seg, 1, true); g.applyMatrix4(new T3.Matrix4().compose(new T3.Vector3((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new T3.Quaternion().setFromUnitVectors(_Y, d.normalize()), new T3.Vector3(1, 1, 1)));
      return S.put(m, g); },
    build(parent, o = {}){ const out = [];
      for (const [m, list] of teile) { const me = new T3.Mesh(RH.merge(list), m); me.castShadow = !!o.schatten; me.receiveShadow = o.empfangen ?? true; me.userData.noPick = true; if (o.noOcc) me.userData.noOcc = true; parent.add(me); out.push(me); }
      teile.clear(); return out; }
  };
  return S;
};
// Profil entlang eines Zugs (Wände, Sockel, Gesimse, Kehlen): pts = [[x, z], …] Grundriss, profil = [[d, y], …] (d = Abstand von der Wand
// zur Raumseite hin, von unten nach oben geordnet). Senkrechte Stücke zeigen in den Raum, Stücke zur Raummitte hin nach unten, zur Wand hin nach oben.
// o: {zu: geschlossen, innen: [x, z] Punkt im Raum, uS/vS Texturmaß in m, glatt: Profil weich schattiert, knick: Winkel, ab dem der Zug hart abknickt}
RH.zug = (pts, profil, o = {}) => {
  const zu = !!o.zu, P = zu ? pts.concat([pts[0]]) : pts.slice(), m = P.length, innen = o.innen || [0, 0], uS = o.uS || 4, vS = o.vS || 4, knick = o.knick ?? .6;
  const sn = []; for (let i = 0; i < m - 1; i++) { const dx = P[i + 1][0] - P[i][0], dz = P[i + 1][1] - P[i][1], L = Math.hypot(dx, dz) || 1; let nx = -dz / L, nz = dx / L;
    const mx = (P[i][0] + P[i + 1][0]) / 2, mz = (P[i][1] + P[i + 1][1]) / 2; if (nx * (innen[0] - mx) + nz * (innen[1] - mz) < 0) { nx = -nx; nz = -nz; } sn.push([nx, nz, dx / L, dz / L, L]); }
  const vn = [], glattP = []; for (let i = 0; i < m; i++) { const a = sn[i - 1] || (zu ? sn[m - 2] : null), b = sn[i] || (zu ? sn[0] : null), q = a && b ? [a[0] + b[0], a[1] + b[1]] : (a || b).slice(0, 2);
    const L = Math.hypot(q[0], q[1]) || 1, n = [q[0] / L, q[1] / L], cs = a && b ? a[0] * n[0] + a[1] * n[1] : 1; vn.push([n[0] / Math.max(.35, cs), n[1] / Math.max(.35, cs), n[0], n[1]]);
    glattP.push(a && b ? Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))) < knick : true); }
  const us = [0]; for (let i = 0; i < m - 1; i++) us.push(us[i] + sn[i][4]);
  const pv = [0]; for (let k = 1; k < profil.length; k++) pv.push(pv[k - 1] + Math.hypot(profil[k][0] - profil[k - 1][0], profil[k][1] - profil[k - 1][1]));
  const pn = []; for (let k = 0; k < profil.length - 1; k++) { const dd = profil[k + 1][0] - profil[k][0], dy = profil[k + 1][1] - profil[k][1], L = Math.hypot(dd, dy) || 1; pn.push([dy / L, -dd / L]); }
  const prN = (k, seg) => { if (!o.glatt) return pn[seg]; const a = pn[k - 1], b = pn[k]; if (!a) return b; if (!b) return a; const q = [a[0] + b[0], a[1] + b[1]], L = Math.hypot(...q) || 1; return [q[0] / L, q[1] / L]; };
  const pos = [], nor = [], uv = [], idx = [];
  // Wickelsinn: Flächennormale = Wegrichtung × Profilrichtung (Vorzeichen so, dass ein senkrechtes Stück in den Raum zeigt)
  const T0 = sn[0], sg = -T0[3] * T0[0] + T0[2] * T0[1] > 0 ? 1 : -1;   // (T × Y) · N mit T × Y = (−tz, 0, tx)
  for (let i = 0; i < m - 1; i++) for (let k = 0; k < profil.length - 1; k++) {
    const b = pos.length / 3;
    for (const [ii, kk] of [[i, k], [i + 1, k], [i + 1, k + 1], [i, k + 1]]) { const v = vn[ii], d = profil[kk][0], y = profil[kk][1];
      pos.push(P[ii][0] + v[0] * d, y, P[ii][1] + v[1] * d);
      const hn = glattP[ii] ? [v[2], v[3]] : [sn[i][0], sn[i][1]], q = prN(kk, k); nor.push(hn[0] * q[0], q[1], hn[1] * q[0]);
      uv.push(us[ii] / uS, pv[kk] / vS); }
    if (sg > 0) idx.push(b, b + 1, b + 3, b + 1, b + 2, b + 3); else idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 2);
  }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
};
// Quader mit Texturmaß s (m je Texturkachel) auf allen Seiten statt gestreckter 0..1-UV
RH.kasten = (w, h, d, s = 3.2) => { const g = new T3.BoxGeometry(w, h, d), uv = g.attributes.uv, f = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < 24; i++) { const q = f[(i / 4) | 0]; uv.setXY(i, uv.getX(i) * q[0] / s, uv.getY(i) * q[1] / s); } return g; };
// Punkte auf einem Ellipsenbogen (Mitte cx|cz, Halbachsen ax|az, Winkel a0 → a1, n Stücke): x = cx + ax·cos a, z = cz + az·sin a
RH.bogen = (cx, cz, ax, az, a0, a1, n) => { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + ax * Math.cos(a), cz + az * Math.sin(a)]); } return out; };
RH.rechteck = (x0, x1, z0, z1) => [[x0, z1], [x1, z1], [x1, z0], [x0, z0]];   // z0 > z1 wie ctx.bounds
// Spitzbogen- oder Rundbogenform (Fenster, Nischen): Breite w, Höhe h (bis zum Scheitel), spitz = Anteil der Bogenhöhe am Spitzbogen
RH.bogenForm = (w, h, spitz = 0, x0 = 0, y0 = 0) => { const s = new T3.Shape(), r = w / 2, bh = spitz ? w * .62 : r, yk = y0 + h - bh;
  s.moveTo(x0 - r, y0); s.lineTo(x0 + r, y0); s.lineTo(x0 + r, yk);
  if (spitz) { s.quadraticCurveTo(x0 + r, yk + bh * .7, x0, y0 + h); s.quadraticCurveTo(x0 - r, yk + bh * .7, x0 - r, yk); } else s.absarc(x0, yk, r, 0, PI, false);
  s.lineTo(x0 - r, y0); return s; };
// UV einer ShapeGeometry auf 0..1 über ihren Umriss
RH.uvAufUmriss = g => { g.computeBoundingBox(); const bb = g.boundingBox, uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x || 1), (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y || 1)); return g; };

/* ---------- Werkzeug: Boden, Belegung, Hülle ---------- */
RH.boden = (ctx, m, o = {}) => { const B = ctx.bounds, W = B.x1 - B.x0, D = B.z0 - B.z1, g = new T3.PlaneGeometry(W, D);
  U.scaleUV(g, W / (o.uS || 3.2), D / (o.vS || 3.2)); const f = new T3.Mesh(g, m); f.rotation.x = -PI / 2; f.position.set((B.x0 + B.x1) / 2, 0, (B.z0 + B.z1) / 2); f.receiveShadow = true;
  ctx.group.add(f); ctx.floor = f; return f; };
RH.belege = (ctx, b) => { (ctx._belegtHuelle || (ctx._belegtHuelle = [])).push(b); return b; };
RH.sperre = (ctx, x0, x1, z0, z1, y1 = RH.H) => { ctx.obstacleBox((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0); RH.belege(ctx, {x0, x1, y0: 0, y1, z0, z1}); };
// Bereich zwischen einer gekrümmten Wand und dem Raumrand sperren (Gehen und Ausstattung): zWand(x) = Lage der Wand, rand = Raumrand (z),
// in Streifen von x0 bis x1; tiefe = zusätzlich in den Raum hinein (Treppe), y1 = Höhe der Sperre
RH.aussen = (ctx, zWand, x0, x1, rand, o = {}) => { const st = o.streifen || .4, n = Math.max(1, Math.ceil((x1 - x0) / st)), tiefe = o.tiefe || 0, dir = rand < 0 ? 1 : -1;
  for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n; let zw = rand;
    for (const x of [a, (a + b) / 2, b]) { const z = zWand(x); zw = dir > 0 ? Math.max(zw, z) : Math.min(zw, z); } zw += dir * tiefe;
    const z0 = Math.min(rand, zw), z1 = Math.max(rand, zw); if (z1 - z0 < .02) continue;
    if (o.gehen !== false) ctx.obstacleBox((a + b) / 2, (z0 + z1) / 2, b - a, z1 - z0);
    RH.belege(ctx, {x0: a, x1: b, y0: o.y0 || 0, y1: o.y1 ?? RH.H, z0, z1}); } };
RH.huelle = (ctx, o) => { const HU = ctx.huelle = Object.assign({H: RH.H, pz: [9, 4.5, 0, -4.5, -9], saeuleX: [], fackeln: [], fenster: [], banner: [], balken: []}, o);
  ctx.decorZ = HU.pz; return HU; };

/* ---------- Werkzeug: Licht, Flammen, Fackeln, Himmel ---------- */
// Punktlicht der Hülle (zählt zu RH.PUNKTLICHTER). o.flackern: Fackelflackern; l.userData.schub (0…) hebt es kurz an (Blitz)
RH.punktlicht = (ctx, farbe, staerke, x, y, z, o = {}) => { const l = new T3.PointLight(farbe, staerke, o.weite ?? 10, 2); l.position.set(x, y, z); l.castShadow = false; ctx.group.add(l);
  l.userData.basis = staerke; l.userData.schub = 0; const ph = ctx.rand() * 10, fl = o.flackern ?? 1;
  ctx.tick((dt, t) => { const f = 1 - fl * (.2 - .2 * Math.sin(t * 6.5 + ph) * Math.sin(t * 3.7 + ph * 2) - .05 * Math.sin(t * 11 + ph)); l.intensity = staerke * f * (1 + l.userData.schub); });
  return l; };
// Flammen/Leuchtpunkte als ein Points-Objekt (ein Zeichenaufruf für alle); liefert das Material (Größe/Deckkraft animierbar)
RH.flammen = (ctx, pts, farbe, groesse = .3, o = {}) => { if (!pts.length) return null; const g = new T3.BufferGeometry().setFromPoints(pts.map(p => p.isVector3 ? p : new T3.Vector3(...p)));
  const m = new T3.PointsMaterial({map: U.glowTex(), color: farbe, size: groesse, transparent: true, opacity: o.deck ?? 1, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false});
  const p = new T3.Points(g, m); p.userData.noPick = true; ctx.group.add(p);
  if (o.flackern !== false) { const s0 = groesse; ctx.tick((dt, t) => { m.size = s0 * (.92 + .06 * Math.sin(t * 7.3) + .03 * Math.sin(t * 12.9)); }); }
  return m; };
// Wandfackel in einen Sammler (Halter aus Eisen), Flammenpunkt in die Liste fl; dir = +1 an der linken Wand (zeigt nach +x), −1 rechts;
// achse "z": an Stirnwänden (dir = +1 an der Vorderwand, zeigt nach +z)
RH.fackel = (S, fl, x, y, z, dir, o = {}) => { const m = o.mat || KIT.mat("metal"), ax = o.achse === "z";
  const off = (d) => ax ? [0, 0, dir * d] : [dir * d, 0, 0], o2 = off(.38);
  S.box(m, ax ? .12 : .06, .22, ax ? .06 : .12, x, y - .12, z);   // Wandplatte
  S.rod(m, [x, y - .05, z], [x + o2[0], y + .12, z + o2[2]], .03, 6);
  S.cyl(m, .12, .06, .2, 8, x + o2[0], y + .2, z + o2[2]);
  fl.push(new T3.Vector3(x + o2[0], y + .48, z + o2[2]));
  return [x + off(.5)[0], y + .6, z + off(.5)[2]]; };   // günstige Lage für das Punktlicht
// Himmelskugel (ohne Nebel, wirft und fängt keinen Schatten); tex: Equirect-Canvas oder Farbe
RH.himmel = (ctx, tex, r = 60) => { const m = RH.basic({map: tex && tex.isTexture ? tex : null, color: tex && tex.isTexture ? 0xffffff : tex, side: T3.BackSide, fog: false, depthWrite: false});
  const s = new T3.Mesh(new T3.SphereGeometry(r, 32, 16), m); s.renderOrder = -10; s.userData.noPick = true; s.userData.noOcc = true; ctx.group.add(s); return s; };
// Verlaufshimmel für RH.himmel (Equirect, oben → unten): stops = [[0, "#…"], …, [1, "#…"]], o.wolken = Zahl weicher Wolken, o.sonne = [u, v, Radius] (0..1)
RH.himmelTex = (key, stops, o = {}) => RH.tex("himmel-" + key, 1024, 512, (g, w, h) => { const r = RH.seeded(o.seed || 5);
  g.fillStyle = RH.lin(g, 0, 0, 0, h, stops); g.fillRect(0, 0, w, h);
  if (o.sonne) { const [u, v, q] = o.sonne; g.fillStyle = RH.rad(g, u * w, v * h, 0, q * h, [[0, "rgba(255,250,230,1)"], [.15, "rgba(255,240,200,.85)"], [1, "rgba(255,220,160,0)"]]); g.fillRect(0, 0, w, h); }
  for (let i = 0; i < (o.wolken || 0); i++) { const x = r() * w, y = h * (.12 + r() * .3), q = 20 + r() * 60;
    for (let k = 0; k < 5; k++) { const dx = (r() - .5) * q * 2.4, dy = (r() - .5) * q * .4; g.fillStyle = RH.rad(g, x + dx, y + dy, 0, q, [[0, `rgba(255,255,255,${o.wolkenDeck || .55})`], [1, "rgba(255,255,255,0)"]]); g.fillRect(x + dx - q, y + dy - q, 2 * q, 2 * q); } } }, false);
// Sterne als Punkte auf einer Kugelschale (scharf bei jeder Auflösung); o: {n, r, min (Höhe des Horizonts als y-Anteil), farbe, groesse}
RH.sterne = (ctx, o = {}) => { const n = o.n || 600, r = o.r || 50, rnd = U.seeded(o.seed || 7), P = [], C = [], c = new T3.Color();
  for (let i = 0; i < n; i++) { const u = (o.min ?? .05) + rnd() * (1 - (o.min ?? .05)), a = rnd() * PI * 2, s = Math.sqrt(1 - u * u); P.push(Math.cos(a) * s * r, u * r + (o.y || 0), Math.sin(a) * s * r + (o.z || 0));
    c.set(rnd() < .15 ? 0xffe2b0 : rnd() < .2 ? 0xbcd2ff : 0xffffff).multiplyScalar(.45 + rnd() * .55); C.push(c.r, c.g, c.b); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(P, 3)); g.setAttribute("color", new T3.Float32BufferAttribute(C, 3));
  const p = new T3.Points(g, new T3.PointsMaterial({size: o.groesse || 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false, toneMapped: false}));
  p.renderOrder = -9; p.userData.noPick = true; p.userData.noOcc = true; ctx.group.add(p); return p; };
RH.dekor = () => KIT.dekorHilfe || null;   // Werkzeug aus 13_dekor_zauber.js (nur zur Laufzeit, nach allen Dateien)

/* ---------- Werkzeug: Quadermauer, Atlas-Spalten ---------- */
// Quadermauerwerk (behauene, regelmäßige Lagen mit Fase): o = {lagen, h: [Farbton, Sättigung, Helligkeit], streu, spanne, breite (× Lagenhöhe), fuge (px), fugeFarbe, koernung}
RH.quader = (g, w, h, r, o = {}) => { const lagen = o.lagen || 8, lh = h / lagen, [hu, sa, li] = o.h || [35, 12, 60], f = o.fuge ?? 4;
  g.fillStyle = o.fugeFarbe || "#2a2622"; g.fillRect(0, 0, w, h);
  for (let j = 0; j < lagen; j++) { let x = -(j % 2) * lh * .9 - r() * lh * .4; const y = j * lh;
    while (x < w) { const bw = lh * (o.breite || 1.8) * (.75 + r() * .5), l = li + (r() - .5) * (o.streu ?? 8);
      g.fillStyle = `hsl(${hu + (r() - .5) * (o.spanne ?? 8)},${sa}%,${l}%)`; g.fillRect(x + f, y + f, bw - 2 * f, lh - 2 * f);
      g.fillStyle = "rgba(255,255,255,.10)"; g.fillRect(x + f, y + f, bw - 2 * f, 3); g.fillRect(x + f, y + f, 3, lh - 2 * f);
      g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(x + f, y + lh - f - 3, bw - 2 * f, 3); g.fillRect(x + bw - f - 3, y + f, 3, lh - 2 * f);
      x += bw; } }
  RH.flecken(g, w, h, 14000, o.koernung ?? .25, ["#000", "#fff", "#5a5048"], r);
};
// u einer Geometrie auf Spalte k von n eines Textur-Atlas legen (mehrere Farben in einem Material, ein Zeichenaufruf)
RH.spalte = (g, k, n) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (k + Math.min(1, Math.max(0, uv.getX(i)))) / n); return g; };
RH.uvMal = (g, sx, sy) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return g; };

/* ---------- Werkzeug: Draußen (Besenflugplatz, Rampe am Schlossberg) ---------- */
// Boden bis zum Horizont unter dem Raumboden (fängt keine Klicks, ctx.floor bleibt der Raumboden): Scheibe mit Radius o.r
RH.weite = (ctx, m, o = {}) => { const r = o.r || 58, g = new T3.CircleGeometry(r, 48), uv = g.attributes.uv, p = g.attributes.position, s = o.uS || 6;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / s, p.getY(i) / s);
  const f = new T3.Mesh(g, m); f.rotation.x = -PI / 2; f.position.set(0, o.y ?? -.03, (ctx.bounds.z0 + ctx.bounds.z1) / 2); f.receiveShadow = true; f.userData.noPick = f.userData.noOcc = true; ctx.group.add(f); return f; };
// Landschaftsband ringsum (Hügel, Wald, Berge) als offener Zylinder (Radius r, y0 … y1), Textur mit Alpha (oben durchsichtig); u läuft wie gesehen
// von links nach rechts, wdh = Wiederholungen ringsum; liegt im Nebel (Dunst zum Horizont)
RH.kulisse = (ctx, tex, o = {}) => { const r = o.r || 52, y0 = o.y0 ?? -1.5, y1 = o.y1 ?? 11, g = new T3.CylinderGeometry(r, r, y1 - y0, o.seg || 72, 1, true);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (1 - uv.getX(i)) * (o.wdh || 1));
  const k = new T3.Mesh(g, RH.basic({map: tex, transparent: true, depthWrite: false, side: T3.BackSide, fog: o.nebel !== false, color: o.farbe ?? 0xffffff}));
  k.position.set(0, (y0 + y1) / 2, (ctx.bounds.z0 + ctx.bounds.z1) / 2); k.renderOrder = -9; k.userData.noPick = k.userData.noOcc = true; ctx.group.add(k); return k; };
// gemalte Kulisse (Burg auf dem Berg …) als Fläche mit Alpha, zeigt zum Raum (+z)
RH.karte = (ctx, tex, x, y, z, w, h, o = {}) => { const k = new T3.Mesh(new T3.PlaneGeometry(w, h), RH.basic({map: tex, transparent: true, depthWrite: false, fog: o.nebel !== false, color: o.farbe ?? 0xffffff}));
  k.position.set(x, y, z); k.rotation.y = o.ry || 0; k.renderOrder = -8; k.userData.noPick = k.userData.noOcc = true; ctx.group.add(k); return k; };
// Burg als Schattenriss für RH.karte: Türme mit Kegeldächern, Mauern mit Zinnen, Bergfried, Fahnen; o = {stein, dach, licht (Fensterfarbe oder null), huegel, dunst, seed}
RH.burgMaler = (g, w, h, o = {}) => { const r = RH.seeded(o.seed || 9), base = h * (o.basis ?? .62), st = o.stein || "#8a8fa0", da = o.dach || "#4a5878";
  g.clearRect(0, 0, w, h);
  if (o.huegel) { g.fillStyle = o.huegel; g.beginPath(); g.moveTo(0, h); g.bezierCurveTo(w * .15, base + h * .02, w * .3, base - h * .04, w * .5, base - h * .05); g.bezierCurveTo(w * .7, base - h * .04, w * .85, base + h * .03, w, h); g.fill(); }
  const turm = (x, tw, th, dach) => { const y0 = base - th; g.fillStyle = st; g.fillRect(x - tw / 2, y0, tw, th + h * .06);
    g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + tw * .15, y0, tw * .35, th + h * .06);   // Schattenseite
    if (dach) { g.fillStyle = da; g.beginPath(); g.moveTo(x - tw * .62, y0 + 2); g.lineTo(x, y0 - tw * 1.35); g.lineTo(x + tw * .62, y0 + 2); g.fill();
      g.strokeStyle = st; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y0 - tw * 1.35); g.lineTo(x, y0 - tw * 1.75); g.stroke(); g.fillStyle = o.fahne || "#a8323a"; g.beginPath(); g.moveTo(x, y0 - tw * 1.75); g.lineTo(x + tw * .45, y0 - tw * 1.62); g.lineTo(x, y0 - tw * 1.5); g.fill(); }
    else { g.fillStyle = st; for (let k = 0; k < 4; k++) g.fillRect(x - tw / 2 + k * tw / 3.5, y0 - tw * .16, tw / 7, tw * .16); }
    if (o.licht) for (let k = 0; k < 3; k++) if (r() < .7) { g.fillStyle = o.licht; g.fillRect(x - tw * .08 + (r() - .5) * tw * .4, y0 + th * (.2 + k * .25), tw * .14, tw * .22); } };
  const mauer = (x0, x1, mh) => { g.fillStyle = st; g.fillRect(x0, base - mh, x1 - x0, mh + h * .06); for (let x = x0; x < x1 - 4; x += 12) g.fillRect(x, base - mh - 6, 6, 6);
    if (o.licht) for (let x = x0 + 10; x < x1 - 10; x += 22) if (r() < .4) { g.fillStyle = o.licht; g.fillRect(x, base - mh * .6, 4, 6); g.fillStyle = st; } };
  mauer(w * .14, w * .86, h * .1); mauer(w * .32, w * .7, h * .17);
  turm(w * .5, w * .1, h * .38, true);   // Bergfried
  turm(w * .14, w * .06, h * .2, true); turm(w * .86, w * .06, h * .21, true); turm(w * .33, w * .055, h * .27, true); turm(w * .68, w * .06, h * .3, true);
  turm(w * .41, w * .045, h * .22, false); turm(w * .6, w * .045, h * .2, false);
  if (o.dunst) { g.globalCompositeOperation = "source-atop"; g.fillStyle = RH.lin(g, 0, 0, 0, h, [[0, "rgba(0,0,0,0)"], [.7, o.dunst], [1, o.dunst]]); g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over"; }
};
// Torhaus um die Tür einer Stirnseite (sz = ±1): Mauer |x| < 2,45 bis o.h mit Zinnen, zwei Tortürme (|x| 2,45 … 4,25), die 0,35 m in den Raum ragen;
// o.dach: Material für Zeltdächer der Türme (sonst Zinnen), o.turm: Turmhöhe; m = {stein, dunkel}; liefert die Turmspitzen [x, y, z]
RH.torhaus = (ctx, S, m, sz, o = {}) => {
  const E = sz * 11, h = o.h || 7.4, th = o.turm || 9, spitzen = [], z = d => E + sz * d, zin = (x, y, zz, b = .62) => S.put(m.stein, RH.kasten(b, .62, .62, 3.2), RH.M(x, y + .31, zz));
  S.put(m.stein, RH.kasten(4.9, h, .6, 3.2), RH.M(0, h / 2, z(.3)));
  for (let i = 0; i < 4; i++) zin(-1.85 + i * 1.233, h, z(.3));
  for (const sx of [-1, 1]) { const x = sx * 3.35, zc = z(.6);
    S.put(m.stein, RH.kasten(1.8, th, 1.9, 3.2), RH.M(x, th / 2, zc)).put(m.stein, RH.kasten(2.0, .3, 2.1, 3.2), RH.M(x, th - .15, zc));
    for (const y of [3.4, th - 2.2]) S.box(m.dunkel, .14, .8, .04, x, y, z(-.37));   // Schießscharten zum Raum
    if (o.dach) { const rise = o.dachH || 2.6, cg = new T3.ConeGeometry(Math.SQRT2, rise, 4, 1, false); cg.rotateY(PI / 4); S.put(o.dach, cg, RH.M(x, th + rise / 2, zc, 0, 0, 0, 1.12, 1, 1.18)); spitzen.push([x, th + rise, zc]); }
    else { for (const dx of [-.66, 0, .66]) { zin(x + dx, th, z(-.3), .4); zin(x + dx, th, z(1.5), .4); } for (const dz of [.3, .9]) { zin(x - .8, th, z(dz), .4); zin(x + .8, th, z(dz), .4); } spitzen.push([x, th + .62, zc]); }
    const zi = Math.min(E, z(-.35)), za = Math.max(E, z(-.35)); RH.sperre(ctx, x - .9, x + .9, zi, za); }
  return spitzen;
};
// Wimpelkette von a nach b (Durchhang sag) mit Dreieckswimpeln in den Farben o.farben; flattert sanft (ein Zeichenaufruf je Kette); liefert die Schnurpunkte
RH.wimpel = (ctx, a, b, o = {}) => {
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = o.n || Math.max(3, Math.round(L / .5)), sag = o.sag ?? .5, len = o.lang || .4, cols = o.farben || ["#9b2335", "#d9a830", "#1f3a5f", "#1f5a3a"];
  const pt = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t], P = [], C = [], c = new T3.Color(), spitze = [];
  for (let i = 0; i < n; i++) { const p0 = pt((i + .08) / n), p1 = pt((i + .92) / n), pm = pt((i + .5) / n); c.set(cols[i % cols.length]);
    P.push(...p0, ...p1, pm[0], pm[1] - len, pm[2]); for (let k = 0; k < 3; k++) C.push(c.r, c.g, c.b); spitze.push(pm); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(P, 3)); g.setAttribute("color", new T3.Float32BufferAttribute(C, 3)); g.computeVertexNormals();
  const me = new T3.Mesh(g, RH.mat("wimpel", () => RH.std({vertexColors: true, roughness: .9, side: T3.DoubleSide}))); me.userData.noPick = true; ctx.group.add(me);
  const nx = -(b[2] - a[2]) / (L || 1), nz = (b[0] - a[0]) / (L || 1), pa = g.attributes.position, ph = ctx.rand() * 6;
  if (!RH.reduziert) ctx.tick((dt, t) => { for (let i = 0; i < n; i++) { const s = Math.sin(t * 1.7 + i * .8 + ph) * .07, q = spitze[i]; pa.setXYZ(i * 3 + 2, q[0] + nx * s, q[1] - len + Math.abs(s) * .3, q[2] + nz * s); } pa.needsUpdate = true; });
  const schnur = []; for (let i = 0; i <= 12; i++) schnur.push(pt(i / 12)); return schnur;
};
// Ausstattung draußen (Wandkoordinaten: x entlang der Wand, z in den Raum): Tonnen, Frachtkisten, Heuballen, Steinquader, Handkarren, Ballkiste, Zeitnehmertisch
RH.draussenStuecke = Hd => {
  const {M: m, box, cyl, sph, tor, cone, STUECK} = Hd; if (STUECK.heuballen) return;
  const fassGeo = () => new T3.LatheGeometry([[0, 0], [.27, 0], [.31, .2], [.33, .45], [.31, .7], [.27, .9], [0, .9]].map(([x, y]) => new T3.Vector2(x, y)), 12);
  const tonne = (K, x, z, y = 0, rot = 0) => { K.put("wood", fassGeo(), m(x, y, z, 0, rot)); for (const [hh, rr] of [[.1, .29], [.45, .335], [.8, .29]]) K.put("iron", tor(rr, .012, 4, 16), m(x, y + hh, z, PI / 2));
    K.put("atlas", cyl(.26, .26, .01, 12), m(x, y + .9, z), "#3a2a1c"); };
  STUECK.tonne = {min: .75, max: 1.5, h: 1.0, d: .72, off: .05, bau: (D, w) => { const n = w > 1.35 ? 2 : 1; for (let i = 0; i < n; i++) tonne(D.K, n > 1 ? (i - .5) * .74 : 0, .36, 0, D.r() * 6); }};
  STUECK.frachtkisten = {min: .8, max: 1.4, h: 1.25, d: .7, off: .05, bau: (D, w) => { const K = D.K, kiste = (x, y, z, s, ry) => { const t = (a, b, c, xx, yy, zz) => K.put("atlas", box(a, b, c), m(x, y, z, 0, ry).multiply(m(xx, yy, zz)), "#5a3e26");
      K.put("wood", box(s, s, s), m(x, y + s / 2, z, 0, ry)); for (const sy of [-1, 1]) t(s + .02, .06, s + .02, 0, s / 2 + sy * (s / 2 - .04), 0); t(.06, s, s + .02, 0, s / 2, 0); };
    kiste(-w / 2 + .36, 0, .36, .66, 0); if (w > 1.1) kiste(w / 2 - .3, 0, .33, .56, .3); kiste(-w / 2 + .4, .66, .34, .5, .5); }};
  STUECK.heuballen = {min: 1.0, max: 2.1, h: .95, d: .6, off: .05, bau: (D, w) => { const K = D.K, n = Math.max(1, Math.floor(w / 1.0)), ballen = (x, y, z, ry) => {
      K.put("atlas", box(.92, .44, .5), m(x, y + .22, z, 0, ry), "#c8a654"); for (const dx of [-.25, .25]) K.put("atlas", box(.025, .45, .51), m(x, y + .22, z, 0, ry).multiply(m(dx, 0, 0)), "#7a5a28"); };
    for (let i = 0; i < n; i++) ballen(n > 1 ? -w / 2 + .5 + i * (w - 1) / (n - 1) : 0, 0, .3, (D.r() - .5) * .1);
    ballen(0, .44, .3, (D.r() - .5) * .3); }};
  STUECK.quader = {min: .9, max: 1.8, h: .95, d: .75, off: .05, bau: (D, w) => { const K = D.K;
    K.put("stone", box(.72, .44, .46), m(-w / 2 + .4, .22, .3, 0, .05)); if (w > 1.5) K.put("stone", box(.66, .44, .46), m(w / 2 - .38, .22, .32, 0, -.08));
    K.put("stone", box(.62, .4, .44), m(-w / 2 + .45, .64, .3, 0, -.12)); K.put("stone", box(.4, .26, .3), m(w > 1.5 ? .1 : .1, .13, .55, 0, .4));
    K.put("wood", cyl(.018, .018, .38, 6), m(-w / 2 + .5, .9, .3, 0, .4, PI / 2)).put("wood", box(.1, .1, .16), m(-w / 2 + .32, .9, .37, 0, .4, 0)).put("iron", cyl(.01, .006, .2, 5), m(-w / 2 + .7, .855, .36, 0, 0, PI / 2 - .2)); }};
  STUECK.karren = {min: 1.5, max: 1.7, h: 1.15, d: 1.0, off: .05, bau: (D) => { const K = D.K, y = .55, z = .5;
    K.put("wood", box(1.1, .07, .72), m(.15, y, z)); for (const s of [-1, 1]) K.put("wood", box(1.1, .22, .04), m(.15, y + .14, z + s * .36)); K.put("wood", box(.04, .22, .72), m(.7, y + .14, z));
    for (const s of [-1, 1]) { K.put("wood", box(1.0, .05, .05), m(-.65, y + .1, z + s * .3, 0, 0, -.12)); K.put("wood", tor(.38, .035, 6, 20), m(.35, .38, z + s * .44));
      for (let k = 0; k < 6; k++) K.put("wood", box(.03, .72, .025), m(.35, .38, z + s * .44, 0, 0, k * PI / 6)); K.put("iron", cyl(.06, .06, .08, 8), m(.35, .38, z + s * .44, PI / 2)); }
    K.put("iron", cyl(.02, .02, .95, 6), m(.35, .38, z, PI / 2)); K.put("wood", box(.05, .5, .05), m(-.25, .3, z));
    K.put("atlas", sph(.2, 8, 6), m(.0, y + .2, z - .12, 0, 0, 0, 1.3, .9, 1), "#b8a07a").put("atlas", sph(.18, 8, 6), m(.35, y + .19, z + .14, 0, .5, 0, 1.3, .9, 1), "#a89068").put("wood", box(.32, .26, .3), m(.45, y + .17, z - .14, 0, .3, 0)); }};
  STUECK.ballkiste = {min: .9, max: 1.1, h: .8, d: .6, off: .1, bau: (D) => { const K = D.K, z = .3;
    K.put("wood", box(.84, .42, .48), m(0, .21, z)); K.put("iron", box(.86, .04, .5), m(0, .4, z)); K.put("wood", box(.84, .05, .48), m(0, .64, z - .27, -1.25, 0, 0));
    for (const [x, c, r] of [[-.24, "#7a4a2a", .13], [.04, "#a8322a", .12], [.27, "#6a3a1c", .11]]) K.put("atlas", sph(r, 12, 9), m(x, .42 + r * .55, z), c);
    K.put("atlas", sph(.11, 12, 9), m(.52, .11, z + .2), "#7a4a2a"); }};
  STUECK.zeitnehmer = {min: 1.25, max: 1.5, h: 1.25, d: .62, off: .12, bau: (D, w) => { const K = D.K, z = .3, y = .78;
    K.put("wood", box(w - .1, .05, .56), m(0, y, z)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put("wood", box(.05, y, .05), m(sx * (w / 2 - .14), y / 2, z + sz * .22));
    K.put("wood", box(w - .3, .04, .04), m(0, .25, z + .22)); Hd.sanduhr(D, -w / 2 + .3, y + .025, z - .02, 1.5, .35); Hd.sanduhr(D, -w / 2 + .62, y + .025, z + .05, 1.1, .7);
    K.put("brass", cone(.07, .12, 12), m(w / 2 - .3, y + .2, z)).put("brass", cyl(.008, .008, .12, 5), m(w / 2 - .3, y + .1, z)).put("wood", cyl(.08, .09, .025, 10), m(w / 2 - .3, y + .037, z)).put("brass", sph(.016, 6, 4), m(w / 2 - .3, y + .27, z));
    K.put("atlas", box(.3, .006, .22), m(.05, y + .028, z + .04, 0, .2, 0), "#efe2c0"); }};
};
})();
