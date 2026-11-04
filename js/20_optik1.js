/* ---------- 20_optik1.js ---------- */
/* =====================================================================
   Raum · Spiegel und Lichtbrechung (Kap. 2.1–2.2)
   Mittelstück: optische Scheibe mit halbkreisförmigem Glaskörper – Brechung Luft → Glas, Glas → Luft, Grenzwinkel, Totalreflexion
   A: Reflexionsgesetz am ebenen Spiegel · B: Spiegelbild an der Glasscheibe (Kerzenversuch)
   C: Aquarium – geknickter Stab und scheinbare Hebung · D: Lichtleiter (Glasfaser) und Umlenkprisma
   Über dem Gang: Lichtweg über fünf hängende Spiegel (an jedem Spiegel gilt das Reflexionsgesetz); Kristall mit Schild am Ende anklickbar
   Intern wird mit n = 1,5 (Glas) bzw. 1,33 (Wasser) gerechnet, angezeigt werden nur Winkel.
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
const DEG = Math.PI / 180, N_GLAS = 1.5, N_WASSER = 1.33, GRENZ = Math.asin(1 / N_GLAS) / DEG;   // Grenzwinkel Glas → Luft ≈ 41,8°

/* ---------- Weltfarben für Anzeigen und Strahlen ---------- */
function theme(ctx){
  const k = ctx.kit, f = k.font, b = k.fontBody || k.font;
  if (ctx.world === "sterne") return {bg0: "#030b16", bg1: "#0c2135", line: "#8fe3ff", dim: "rgba(143,227,255,.38)", text: "#eaf7ff", hi: "#FFE81F", fill: "rgba(255,232,31,.18)",
    beam: 0xff3d57, beamCss: "#ff6d80", alt: "#3DDC97", font: f, body: b, base: "metal", frame: "steel", disc: "metal", table: "metal", leg: "steel"};
  if (ctx.world === "detektiv") return {bg0: "#0f1714", bg1: "#1f2e28", line: "#dcbc80", dim: "rgba(220,188,128,.38)", text: "#f3e6cc", hi: "#ffd08a", fill: "rgba(255,208,138,.18)",
    beam: 0xffa63a, beamCss: "#ffc070", alt: "#8FBF7A", font: f, body: b, base: "darkwood", frame: "brass", disc: "darkwood", table: "wood", leg: "darkwood"};
  return {bg0: "#110c1b", bg1: "#261b36", line: "#e6c57e", dim: "rgba(230,197,126,.38)", text: "#f6e7c1", hi: "#ffd27a", fill: "rgba(255,210,122,.18)",
    beam: 0xffc23d, beamCss: "#ffd27a", alt: "#9DB7FF", font: f, body: b, base: "stone", frame: "brass", disc: "darkwood", table: "wood", leg: "darkwood"};
}

/* ---------- Geometrie-Hilfen ---------- */
function mergeGeos(T, list){
  const parts = list.map(g => g.index ? g.toNonIndexed() : g);
  let n = 0; for (const g of parts) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of parts) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += c; }
  const out = new T.BufferGeometry(); out.setAttribute("position", new T.BufferAttribute(pos, 3));
  out.setAttribute("normal", new T.BufferAttribute(nor, 3)); out.setAttribute("uv", new T.BufferAttribute(uv, 2));
  for (const g of new Set([...list, ...parts])) g.dispose();
  return out;
}
function xf(T, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1){
  geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(sx, sy, sz))); return geo; }
function segGeo(T, a, b, r, rad = 8){
  const d = new T.Vector3().subVectors(b, a), L = d.length(), g = new T.CylinderGeometry(r, r, L, rad, 1, true);
  g.applyMatrix4(new T.Matrix4().compose(a.clone().lerp(b, .5), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()), new T.Vector3(1, 1, 1)));
  return g;
}
const V = (T, x, y, z) => new T.Vector3(x, y, z);

/* Leuchtender Strahl (Polylinie, ein Mesh für Kern, eins für Lichthof) mit regelbarer Helligkeit.
   set() schreibt die Eckpunkte direkt in die vorhandenen Puffer: keine neuen Geometrien und kein Speicherabfall je Bild
   (nur wenn mehr Teilstücke als bisher gebraucht werden, wird einmal neu angelegt). */
let _rayTpl = null;
function rayTpl(T){ if (_rayTpl) return _rayTpl; const c = new T.CylinderGeometry(1, 1, 1, 8, 1, true), n = c.toNonIndexed();
  _rayTpl = n.attributes.position.array.slice(); c.dispose(); n.dispose(); return _rayTpl; }
function ray(ctx, pts, color, w, parent){
  const T = ctx.T, mk = op => new T.MeshBasicMaterial({color, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false});
  const core = mk(.95), halo = mk(.2), g = new T.Group(); (parent || ctx.group).add(g);
  const tpl = rayTpl(T), NV = tpl.length / 3, M = new T.Matrix4(), q = new T.Quaternion(), mid = new T.Vector3(), d = new T.Vector3(), sc = new T.Vector3(1, 1, 1),
    v = new T.Vector3(), A = new T.Vector3(), B = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  let cap = 0, mC = null, mH = null, k = 1, has = false;
  const mkMesh = (mat, n) => { const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(new Float32Array(n * NV * 3), 3));
    const me = new T.Mesh(geo, mat); me.castShadow = me.receiveShadow = false; g.add(me); return me; };
  const alloc = n => { for (const me of [mC, mH]) if (me) { g.remove(me); me.geometry.dispose(); } cap = n; mC = mkMesh(core, n); mH = mkMesh(halo, n); };
  const put = (arr, i, r) => { sc.x = sc.z = r; M.compose(mid, q, sc);
    for (let j = 0, o = i * NV * 3; j < NV; j++, o += 3) { v.fromArray(tpl, j * 3).applyMatrix4(M); arr[o] = v.x; arr[o + 1] = v.y; arr[o + 2] = v.z; } };
  g.set = p => { const n = Math.max(1, p.length - 1); if (n > cap) alloc(n);
    const aC = mC.geometry.attributes.position.array, aH = mH.geometry.attributes.position.array; has = false;
    for (let i = 0; i < cap; i++) { let L = 0;
      if (i < p.length - 1) { const a = p[i].isVector3 ? p[i] : A.fromArray(p[i]), b = p[i + 1].isVector3 ? p[i + 1] : B.fromArray(p[i + 1]);
        d.subVectors(b, a); L = d.length(); if (L > 1e-4) { mid.addVectors(a, b).multiplyScalar(.5); q.setFromUnitVectors(up, d.multiplyScalar(1 / L)); } }
      if (L > 1e-4) { sc.y = L; put(aC, i, w); put(aH, i, w * 3.2); has = true; }
      else { aC.fill(0, i * NV * 3, (i + 1) * NV * 3); aH.fill(0, i * NV * 3, (i + 1) * NV * 3); } }
    for (const me of [mC, mH]) { me.geometry.attributes.position.needsUpdate = true; me.geometry.computeBoundingSphere(); }
    g.visible = has && k > .01; return g; };
  g.alpha = v => { k = v; core.opacity = .95 * v; halo.opacity = .2 * v; g.visible = has && v > .01; return g; };
  g.set(pts); return g;
}
/* Gestrichelte Linie (InstancedMesh) – für Lot und rückwärtige Verlängerungen */
function dashes(ctx, color, r, max, parent){
  const T = ctx.T, im = new T.InstancedMesh(new T.CylinderGeometry(r, r, 1, 6, 1, true),
    new T.MeshBasicMaterial({color, transparent: true, opacity: .85, depthWrite: false, toneMapped: false}), max);
  im.count = 0; im.frustumCulled = false; im.castShadow = false; (parent || ctx.group).add(im);
  const o = new T.Object3D(), up = new T.Vector3(0, 1, 0), d = new T.Vector3();
  im.segs = (list, dash = .045, gap = .03) => { let n = 0;   // list: [[a, b], …] einzelne Strecken
    for (const [a, b] of list) { d.subVectors(b, a); const L = d.length(); if (L < 1e-4) continue; d.divideScalar(L);
      for (let s = 0; s < L && n < max; s += dash + gap) { const l = Math.min(dash, L - s); o.position.copy(a).addScaledVector(d, s + l / 2);
        o.quaternion.setFromUnitVectors(up, d); o.scale.set(1, l, 1); o.updateMatrix(); im.setMatrixAt(n++, o.matrix); } }
    im.count = n; im.instanceMatrix.needsUpdate = true; return im; };
  im.set = (pts, dash, gap) => im.segs(pts.slice(1).map((b, i) => [pts[i], b]), dash, gap);
  im.alpha = v => { im.material.opacity = .85 * v; im.visible = v > .01; };
  return im;
}
/* Fläche mit eigener Leinwand (für Skalen und Anzeigen, die sich beim Klicken ändern) */
function canvasPlane(ctx, w, h, cw, ch, o = {}){
  const T = ctx.T, c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d");
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  const m = new T.Mesh(o.circle ? new T.CircleGeometry(w / 2, 96) : new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map: t, transparent: !!o.transparent, toneMapped: false}));
  m.receiveShadow = false; m.castShadow = false;
  m.userData.draw = fn => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch); g.setLineDash([]); fn(g, cw, ch); t.needsUpdate = true; };
  return m;
}
function rrect(g, x, y, w, h, r){ g.beginPath(); g.roundRect(x, y, w, h, r); }
function panelBg(g, th, W, H, r = 28){
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, th.bg1); gr.addColorStop(1, th.bg0); g.fillStyle = gr; rrect(g, 0, 0, W, H, r); g.fill();
  g.strokeStyle = th.dim; g.lineWidth = Math.max(3, W / 300); rrect(g, 8, 8, W - 16, H - 16, r * .7); g.stroke();
}
/* Text auf der Leinwand; griechische Buchstaben (α, β, α') immer in einer Serifenschrift, damit α nicht wie „a“ aussieht */
const GR = /[\u0370-\u03FF]/, GR_FONT = "'Times New Roman', Times, Georgia, serif";
function txt(g, s, x, y, size, font, color, align = "center", weight = 700){
  s = String(s); g.fillStyle = color; g.textBaseline = "middle";
  if (!GR.test(s)) { g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.fillText(s, x, y); return; }
  const runs = s.split(/([\u0370-\u03FF]+'?)/).filter(r => r), fontOf = r => GR.test(r) ? `italic 700 ${Math.round(size * 1.12)}px ${GR_FONT}` : `${weight} ${size}px ${font}`;
  let W = 0; const ws = runs.map(r => { g.font = fontOf(r); const w = g.measureText(r).width; W += w; return w; });
  let cx = align === "center" ? x - W / 2 : align === "right" ? x - W : x; g.textAlign = "left";
  runs.forEach((r, i) => { g.font = fontOf(r); g.fillText(r, cx, y); cx += ws[i]; });
}
function arrowHead(g, x, y, ang, s){ g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(ang - .45) * s, y - Math.sin(ang - .45) * s); g.lineTo(x - Math.cos(ang + .45) * s, y - Math.sin(ang + .45) * s); g.closePath(); g.fill(); }
/* gleichmäßig bewegter Wert mit weichem Abbremsen */
function approachVal(v, t, dt, minSpeed, k){ const d = t - v, s = dt * Math.max(minSpeed, k * Math.abs(d)); return Math.abs(d) <= s ? t : v + Math.sign(d) * s; }

/* ---------- Lichtquelle je Welt: leuchtet entlang +x, Austrittsöffnung bei x = 0 ---------- */
function emitter(ctx, th, sc = 1){
  const T = ctx.T, g = new T.Group(), M = (geo, m) => { const me = ctx.mesh(geo, m, false); g.add(me); return me; };
  const alongX = (geo, x) => xf(T, geo, x, 0, 0, 0, 0, -Math.PI / 2);
  if (ctx.world === "sterne") {
    M(alongX(new T.CylinderGeometry(.04, .04, .24, 20), -.15), ctx.mat("steel"));
    M(alongX(new T.CylinderGeometry(.043, .043, .035, 20), -.07), ctx.mat("glow", {color: th.beamCss, intensity: 2.2}));
    M(mergeGeos(T, [alongX(new T.CylinderGeometry(.022, .032, .05, 16), -.025), alongX(new T.CylinderGeometry(.045, .045, .03, 20), -.26)]), ctx.mat("metal"));
  } else if (ctx.world === "detektiv") {
    M(mergeGeos(T, [xf(T, new T.BoxGeometry(.17, .13, .13), -.12, 0, 0), xf(T, new T.CylinderGeometry(.022, .03, .08, 12), -.14, .1, 0), xf(T, new T.ConeGeometry(.04, .04, 12), -.14, .16, 0)]), ctx.mat("metal"));
    M(alongX(new T.CylinderGeometry(.048, .048, .05, 20), -.02), ctx.mat("brass"));
    M(xf(T, new T.CircleGeometry(.04, 20), .002, 0, 0, 0, Math.PI / 2, 0), ctx.mat("glow", {color: th.beamCss, intensity: 1.6}));
  } else {
    M(alongX(new T.CylinderGeometry(.03, .042, .22, 16), -.14), ctx.mat("brass"));
    M(xf(T, new T.TorusGeometry(.045, .01, 6, 20), -.04, 0, 0, 0, Math.PI / 2, 0), ctx.mat("gold"));
    M(xf(T, new T.OctahedronGeometry(.04, 0), -.005, 0, 0, 0, 0, 0, 1.5, 1, 1), ctx.mat("crystal", {color: th.beamCss, intensity: 1.6}));
  }
  const gl = ctx.glow(th.beam, .16); gl.position.x = .01; g.add(gl);
  g.scale.setScalar(sc); return g;
}

R3D.rooms.optik1 = ctx => {
  const T = ctx.T, S = ctx.slots, th = theme(ctx), H = ctx.height || 7;
  const Mm = (geo, m, cast = false) => ctx.mesh(geo, m, cast);
  const FR = ctx.world === "sterne" ? ctx.mat("steel") : ctx.mat("color", {color: ctx.world === "zauber" ? "#b8903f" : "#a8844a", rough: .36, metal: .5});
  const crystalMat = k => new T.MeshStandardMaterial({color: th.beamCss, emissive: th.beamCss, emissiveIntensity: k, transparent: true, opacity: .88, roughness: .1, metalness: .1});   // eigenes Material (wird verändert)
  const mirrorMat = new T.MeshStandardMaterial({color: 0xc9d4dc, metalness: ctx.world === "sterne" ? .95 : .55, roughness: .08, emissive: 0x2b343b});
  /* Beschriftung als kleines Schild: Schrift mit Hintergrund (nur Vorderseite, nichts schimmert gespiegelt durch) vor einer Rahmenplatte.
     Die Platte kommt in die Liste geos und wird mit den Haltern des Exponats zu einem Mesh zusammengefasst. */
  const tag = (parent, str, x, y, z, size, geos, color) => {
    const t = ctx.text(str, {size, color: color || th.text, bg: th.bg1}); t.material.side = T.FrontSide;
    const w = t.userData.w, h = t.userData.h; t.position.set(x, y, z + .007); parent.add(t);
    geos.push(xf(T, new T.BoxGeometry(w + .024, h + .024, .012), x, y, z)); return t; };

  /* =================================================================
     Mittelstück: optische Scheibe (Brechung und Totalreflexion)
     ================================================================= */
  {
    const g = new T.Group(); ctx.add(g, S.center.x, 0, S.center.z);
    const YC = 1.8, RD = 1.2, RF = 1.16, RS = 1.0, RG = .6, ZB = .1;   // Mitte, Scheibe, Bildfläche, Skala, Glaskörper, Strahlebene
    // Namensschild: im Raumschiff auf dem Querbalken (3,5 m), weil dessen Türschirm tiefer hängt: Man sieht ihn zwischen Scheibe und Balken hindurch
    // (bei 3,42 m schnitt der Balken vom Türeintritt z = 9,6 aus die Oberkante von „OBSERVATORIUM“ an).
    // Zauberschule und Detektei: Querbalken niedrig (3,23 bzw. 3,19 m, knapp über Scheibe und senkrecht stehender Lichtquelle, je ≥ 5 cm Luft), Schild als
    // Kasten um den Balken – so bleibt das hohe Türschild der Vorderwand vom Eingang aus frei (z = 8,8 aus der Halle, z = 9,6 durch die Tür);
    // in der Detektei liegt der Balken etwas tiefer, damit auch die kleine Unterzeile („weiter · …“) von z = 8,8 aus ganz zu sehen ist.
    const SIG = ctx.world === "sterne", YB = SIG ? 3.5 : ctx.world === "detektiv" ? 3.19 : 3.23, YN = SIG ? YB + .187 : YB, PH = SIG ? .23 : .2, PD = SIG ? .024 : .224;
    const baseM = ctx.mat(th.base), frM = FR;
    g.add(Mm(mergeGeos(T, [xf(T, new T.BoxGeometry(3.1, .16, 1.3), 0, .08, .15), xf(T, new T.BoxGeometry(2.86, .12, 1.1), 0, .22, .15),
      xf(T, new T.BoxGeometry(.16, YB - .35, .16), -1.4, (YB - .07 + .28) / 2, 0), xf(T, new T.BoxGeometry(.16, YB - .35, .16), 1.4, (YB - .07 + .28) / 2, 0), xf(T, new T.BoxGeometry(3.0, .14, .2), 0, YB, 0),
      xf(T, new T.BoxGeometry(1.62, .3, .3), 0, .43, .72)]), baseM, true));
    g.add(Mm(mergeGeos(T, [xf(T, new T.CylinderGeometry(.05, .05, .2, 16), -1.29, YC, 0, 0, 0, Math.PI / 2), xf(T, new T.CylinderGeometry(.05, .05, .2, 16), 1.29, YC, 0, 0, 0, Math.PI / 2),
      xf(T, new T.SphereGeometry(.11, 16, 12), -1.4, YB + .18, 0), xf(T, new T.SphereGeometry(.11, 16, 12), 1.4, YB + .18, 0), xf(T, new T.BoxGeometry(.22, .05, .22), -1.4, YB + .09, 0), xf(T, new T.BoxGeometry(.22, .05, .22), 1.4, YB + .09, 0),
      xf(T, new T.BoxGeometry(3.12, .03, .03), 0, .3, .79), xf(T, new T.BoxGeometry(1.66, .03, .03), 0, .59, .88),
      xf(T, new T.BoxGeometry(1.44, PH, PD), 0, YN, 0)]), frM));   // Platte des Namensschilds (am bzw. um den Querbalken)
    // Scheibe, Rand mit Schiene, Bildfläche mit Skala, Glaskörper
    const disc = Mm(xf(T, new T.CylinderGeometry(RD, RD, .05, 72), 0, YC, 0, Math.PI / 2, 0, 0), ctx.mat(th.disc), true); g.add(disc);
    g.add(Mm(xf(T, new T.TorusGeometry(RD, .024, 8, 120), 0, YC, .03), frM));
    const face = canvasPlane(ctx, RF * 2, RF * 2, 1024, 1024, {circle: true}); face.position.set(0, YC, .027); g.add(face);
    const glassM = ctx.mat("glass", {color: "#bfe6ff", opacity: .34});
    g.add(Mm(xf(T, new T.CylinderGeometry(RG, RG, .14, 64, 1, false, -Math.PI / 2, Math.PI), 0, YC, ZB, Math.PI / 2, 0, 0), glassM));
    g.add(Mm(xf(T, new T.BoxGeometry(RG * 2, .008, .142), 0, YC, ZB), ctx.mat("glass", {color: "#e8f7ff", opacity: .55})));
    // Rückseite: Zierscheibe mit Speichen und Erklärtafel
    g.add(Mm(xf(T, new T.CircleGeometry(RF, 72), 0, YC, -.027, 0, Math.PI, 0), ctx.mat(ctx.world === "sterne" ? "plastic" : "wood")));
    const sp = [xf(T, new T.TorusGeometry(RD - .1, .025, 6, 96), 0, YC, -.03), xf(T, new T.TorusGeometry(.98, .015, 6, 96), 0, YC, -.03)];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; sp.push(xf(T, new T.BoxGeometry(.05, .3, .02), Math.cos(a) * .95, YC + Math.sin(a) * .95, -.035, 0, 0, a + Math.PI / 2)); }
    g.add(Mm(mergeGeos(T, sp), frM));
    const back = ctx.board("Die optische Scheibe", ["Luft → Glas: zum Lot hin gebrochen", "Glas → Luft: vom Lot weg gebrochen", "ab ca. 42°: Totalreflexion", "Der Versuch ist auf der anderen Seite: Geh um die Scheibe herum und klicke sie dort an!"], {w: 1.5, h: 1.05});
    back.position.set(0, YC, -.05); back.rotation.y = Math.PI; g.add(back);
    // je eine Schriftfläche nach vorn und nach hinten (nur Vorderseite, mit Hintergrund) auf der Platte
    const nameF = canvasPlane(ctx, 1.4, .19, 1024, 139); nameF.userData.draw((c, W, Hh) => { panelBg(c, th, W, Hh, 18); txt(c, "Optische Scheibe", W / 2, Hh * .54, 84, th.font, th.hi); });
    const nameB = new T.Mesh(nameF.geometry, nameF.material); nameF.position.set(0, YN, PD / 2 + .0005); nameB.position.set(0, YN, -PD / 2 - .0005); nameB.rotation.y = Math.PI; g.add(nameF, nameB);
    // Lichtquelle auf der Randschiene
    const piv = new T.Group(); piv.position.set(0, YC, ZB); g.add(piv);
    const lamp = emitter(ctx, th); lamp.position.set(0, RS + .03, 0); lamp.rotation.z = -Math.PI / 2; piv.add(lamp);
    piv.add(Mm(xf(T, new T.BoxGeometry(.12, .07, .1), 0, RD, -.04), frM));
    const at = (x, y) => V(T, x, YC + y, ZB);
    const inc = ray(ctx, [at(0, RS), at(0, 0)], th.beam, .013, g), refr = ray(ctx, [at(0, 0), at(0, -RS)], th.beam, .013, g), refl = ray(ctx, [at(0, 0), at(0, RS)], th.beam, .013, g);
    const hot = ctx.glow(th.beam, .3), spR = ctx.glow(th.beam, .2), spF = ctx.glow(th.beam, .2); g.add(hot, spR, spF); hot.position.copy(at(0, 0));
    const cLight = ctx.light(th.beam, 1.6, 3.2, S.center.x, YC, S.center.z + .7);
    // Anzeige vor der Scheibe
    const disp = canvasPlane(ctx, 1.5, .34, 1024, 232); disp.position.set(0, .7, .74); disp.rotation.x = -.9; g.add(disp);
    g.add(Mm(xf(T, new T.BoxGeometry(1.58, .39, .03), 0, .684, .728, -.9, 0, 0), frM));   // Rahmen hinter der Anzeige

    // Die beiden ersten Glas-Zustände kehren die Luft-Zustände genau um: α im Glas so gewählt, dass β = 30° bzw. 60° herauskommt (Lichtweg umkehrbar)
    const aGlas = b => Math.asin(Math.sin(b * DEG) / N_GLAS) / DEG;   // ≈ 19,5° bzw. 35,3°
    const STATES = [{m: "luft", a: 0}, {m: "luft", a: 30}, {m: "luft", a: 60}, {m: "glas", a: aGlas(30), b: 30}, {m: "glas", a: aGlas(60), b: 60}, {m: "glas", a: GRENZ}, {m: "glas", a: 55}];
    const phiOf = s => s.m === "luft" ? s.a : 180 - s.a;
    const optics = ph => {
      if (ph <= 90) { const a = ph * DEG, b = Math.asin(Math.sin(a) / N_GLAS);
        return {m: "luft", a: ph, b: b / DEG, src: [-Math.sin(a), Math.cos(a)], refr: [Math.sin(b), -Math.cos(b)], refl: [Math.sin(a), Math.cos(a)], rk: .22, fk: 1}; }
      const a = (180 - ph) * DEG, s = N_GLAS * Math.sin(a), o = {m: "glas", a: 180 - ph, src: [-Math.sin(a), -Math.cos(a)], refl: [Math.sin(a), -Math.cos(a)]};
      if (s <= 1 + 1e-6) { const q = Math.min(1, s), b = Math.asin(q); Object.assign(o, {b: b / DEG, refr: [Math.sin(b), Math.cos(b)], rk: .25 + .55 * q ** 8, fk: 1 - .45 * q ** 10}); }
      else Object.assign(o, {tir: true, refr: null, rk: 1, fk: 0});
      return o;
    };
    const apply = ph => {
      const o = optics(ph); piv.rotation.z = ph * DEG;
      inc.set([at(o.src[0] * (RS + .02), o.src[1] * (RS + .02)), at(0, 0)]);
      refl.set([at(0, 0), at(o.refl[0] * RS, o.refl[1] * RS)]).alpha(o.rk); spF.position.copy(at(o.refl[0] * RS, o.refl[1] * RS)); spF.scale.setScalar(.08 + .16 * o.rk);
      if (o.refr) { refr.set([at(0, 0), at(o.refr[0] * RS, o.refr[1] * RS)]).alpha(o.fk); spR.visible = true; spR.position.copy(at(o.refr[0] * RS, o.refr[1] * RS)); spR.scale.setScalar(.06 + .16 * o.fk); }
      else { refr.alpha(0); spR.visible = false; }
    };
    const n0 = v => Math.round(v);
    const drawFace = st => face.userData.draw((c, W) => {
      const m = W / 2, s = m / RF, X = x => m + x * s, Y = y => m - y * s;
      const gr = c.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, th.bg1); gr.addColorStop(1, th.bg0); c.fillStyle = gr; c.beginPath(); c.arc(m, m, m, 0, 7); c.fill();
      c.fillStyle = "rgba(120,190,255,.13)"; c.beginPath(); c.arc(m, m, RG * s, 0, Math.PI); c.fill();   // nur der halbrunde Glaskörper ist Glas, außen herum Luft
      c.strokeStyle = th.dim; c.lineWidth = 3; c.beginPath(); c.arc(m, m, RS * s, 0, 7); c.stroke(); c.beginPath(); c.arc(m, m, (RS - .07) * s, 0, 7); c.stroke();
      for (let d = 0; d < 360; d += 5) { const a = (d - 90) * DEG, big = d % 10 === 0, r0 = (RS - (big ? .07 : .04)) * s;
        c.strokeStyle = th.line; c.lineWidth = big ? 4 : 2; c.beginPath(); c.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); c.lineTo(m + Math.cos(a) * RS * s, m + Math.sin(a) * RS * s); c.stroke();
        if (big) { const v = d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d, rr = (RS - .13) * s;
          txt(c, v + "°", m + Math.cos(a) * rr, m + Math.sin(a) * rr, 25, th.body, th.text, "center", 600); } }
      c.strokeStyle = th.text; c.lineWidth = 3; c.setLineDash([16, 12]); c.beginPath(); c.moveTo(m, Y(RS - .2)); c.lineTo(m, Y(-RS + .2)); c.stroke(); c.setLineDash([]);
      c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 3; c.beginPath(); c.moveTo(X(-RS + .2), m); c.lineTo(X(RS - .2), m); c.stroke();
      txt(c, "Lot", X(.08), Y(.74), 34, th.font, th.text, "left");
      txt(c, "Luft", X(-.55), Y(.15), 44, th.font, th.text); txt(c, "Glas", X(-.4), Y(-.15), 44, th.font, "#bfe6ff");
      txt(c, "Grenzfläche", X(.66), Y(.085), 22, th.body, "rgba(255,255,255,.7)", "center", 600);
      if (!st) return;
      // Winkelbögen nur mit Buchstaben – die Zahlenwerte stehen auf der Anzeige darunter
      const o = optics(phiOf(st)), arc = (r, from, to, ccw, lab, col) => {
        c.fillStyle = th.fill; c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.moveTo(m, m); c.arc(m, m, r * s, from, to, ccw); c.closePath(); c.fill();
        c.beginPath(); c.arc(m, m, r * s, from, to, ccw); c.stroke();
        const mid = (from + to) / 2, rr = (r + .085) * s; txt(c, lab, m + Math.cos(mid) * rr, m + Math.sin(mid) * rr, 40, th.body, col, "center", 700); };
      const A = o.a * DEG;
      if (o.m === "luft") { if (o.a < 1) txt(c, "α = 0°", X(.17), Y(.5), 34, th.body, th.hi, "left");
        else { arc(.3, -Math.PI / 2, -Math.PI / 2 - A, true, "α", th.hi); arc(.38, Math.PI / 2, Math.PI / 2 - o.b * DEG, true, "β", th.line); } }
      else { arc(.3, Math.PI / 2, Math.PI / 2 + A, false, "α", th.hi);
        if (o.tir) arc(.38, Math.PI / 2, Math.PI / 2 - A, true, "α'", th.line);
        else arc(.38, -Math.PI / 2, -Math.PI / 2 + o.b * DEG, false, "β", th.line); }
    });
    const drawDisp = st => disp.userData.draw((c, W, Hh) => { panelBg(c, th, W, Hh, 26);
      const o = optics(phiOf(st)), grenz = st.a === GRENZ;
      txt(c, st.m === "luft" ? "Luft → Glas" : "Glas → Luft", W * .5, Hh * .24, 62, th.font, th.hi);
      const l2 = o.m === "luft" ? (o.a < 1 ? "α = 0°  ·  β = 0°" : `α = ${n0(o.a)}°  ·  β ≈ ${n0(o.b)}°`) : grenz ? "α ≈ 42° (Grenzwinkel)  ·  β = 90°" : o.tir ? `α = ${n0(o.a)}°  ·  größer als 42°`
        : st.b != null ? `α ≈ ${n0(o.a)}°  ·  β = ${st.b}°` : `α = ${n0(o.a)}°  ·  β ≈ ${n0(o.b)}°`;
      const l3 = o.m === "luft" ? (o.a < 1 ? "senkrechter Einfall: keine Richtungsänderung" : "Brechung zum Lot hin") : grenz ? "der gebrochene Strahl streift die Oberfläche" : o.tir ? "Totalreflexion – kein gebrochener Strahl" : "Brechung vom Lot weg";
      txt(c, l2, W * .5, Hh * .54, 50, th.body, th.text, "center", 700); txt(c, l3, W * .5, Hh * .8, 40, th.body, o.tir ? th.hi : th.line, "center", 600);
    });
    let si = 1, phi = phiOf(STATES[si]), phiT = phi, moving = false, labSt = null;   // labSt: Zustand, solange das Labor offen ist
    apply(phi); drawFace(STATES[si]); drawDisp(STATES[si]);
    ctx.tick((dt, t) => {
      if (moving) { phi = approachVal(phi, phiT, dt, 30, 2.6); apply(phi); if (phi === phiT) { moving = false; drawFace(labSt || STATES[si]); } }
      hot.scale.setScalar(.26 + .04 * Math.sin(t * 5)); if (cLight) cLight.intensity = 1.5 + .2 * Math.sin(t * 3.1);
    });
    ctx.obstacleBox(S.center.x, S.center.z + .15, 3.15, 1.35);
    const TXT = [
      "**Senkrechter Einfall** (α = 0°): Das Licht geht ohne Richtungsänderung ins Glas über. Gebrochen wird nur Licht, das **schräg** auf die Grenzfläche trifft.\n\nKlicke weiter, um den Einfallswinkel zu vergrößern.",
      "**Luft → Glas**, α = 30°: Der Strahl wird **zum Lot hin** gebrochen, β ≈ 19°. Glas ist optisch dichter als Luft, deshalb ist der Brechungswinkel kleiner als der Einfallswinkel.\n\nEin kleiner Teil des Lichts wird an der Oberfläche zurückgeworfen (**Teilreflexion**, schwacher Strahl). Den runden Rand durchquert das Licht senkrecht – dort knickt es nicht.",
      "α = 60° → β ≈ 35°. Je größer der Einfallswinkel, desto größer wird auch der Brechungswinkel – er bleibt beim Übergang ins optisch dichtere Glas aber immer kleiner als α.",
      "Jetzt fällt das Licht durch den runden Rand ins Glas und trifft von innen auf die gerade Seite: Übergang **Glas → Luft**. Es wird **vom Lot weg** gebrochen: α ≈ 19°, β = 30°.\n\nDas ist genau der Weg von Luft → Glas mit 30° und 19°, nur rückwärts: Der **Lichtweg ist umkehrbar**.",
      "α ≈ 35° → β = 60°: wieder genau der umgekehrte Weg von Luft → Glas (60° und 35°). Der gebrochene Strahl kommt der Oberfläche immer näher, der reflektierte Anteil wird heller.",
      "Bei α ≈ 42°, dem **Grenzwinkel** für Glas → Luft, beträgt der Brechungswinkel 90°: Der gebrochene Strahl streift genau an der Oberfläche entlang.",
      "**Totalreflexion**: Bei α = 55° ist der Einfallswinkel größer als der Grenzwinkel von ca. 42°. Es gibt keinen gebrochenen Strahl mehr – das Licht wird vollständig reflektiert, mit Reflexionswinkel = Einfallswinkel = 55°.\n\nTotalreflexion gibt es nur beim Übergang ins optisch **dünnere** Medium."];
    // Bedienung nur von vorn: Steht man nach dem Hingehen hinter oder neben der Scheibe (approach() im Kern wählt die Seite, von der man kommt),
    // wird nicht weitergeschaltet – sonst springt der Zustand unsichtbar weiter. Die Infotafel sagt dann, wohin man gehen soll.
    const HINT = {
      back: "Du stehst **hinter** der Scheibe. Lichtstrahl, Gradskala und Anzeige sind auf der anderen Seite.\n\nGeh um die Scheibe herum und klicke sie dort noch einmal an – dann dreht sich die Lichtquelle weiter.",
      side: "Von der Seite siehst du die Gradskala kaum.\n\nStell dich vor die Scheibe – auf die Seite mit der Anzeige – und klicke sie dort noch einmal an."};
    let hint = null;
    ctx.exhibit(g, {label: "Optische Scheibe", sub: "anklicken: Lichtquelle weiterdrehen", title: "Die optische Scheibe", pitch: .05, stand: {x: S.center.x, z: S.center.z + 2.1},   // immer vor die Scheibe (Seite mit Anzeige)
      onClick: () => { const dz = R3D.player ? R3D.player.z - S.center.z : 9;
        if (dz < .8) { hint = dz < -.2 ? HINT.back : HINT.side; return; }
        hint = null; si = (si + 1) % STATES.length; phiT = phiOf(STATES[si]); moving = true; drawFace(null); drawDisp(STATES[si]); },
      get text(){ return hint || TXT[si]; }});
    // Labor: Einfallswinkel Luft → Glas einstellen, Brechungswinkel an der Gradskala ablesen (auf 0,5° genau, wie mit dem Auge an der Skala).
    // Die Lichtquelle dreht sich mit, Strahlen, Winkelbögen und Anzeige laufen live; beim Schließen kehrt die Scheibe zum Rundgang-Zustand zurück.
    const betaOf = a => Math.round(2 * Math.asin(Math.sin(a * DEG) / N_GLAS) / DEG) / 2;
    const drawLabDisp = (a, b) => disp.userData.draw((c, W, Hh) => { panelBg(c, th, W, Hh, 26);
      txt(c, "Labor · Luft → Glas", W * .5, Hh * .24, 62, th.font, th.hi);
      txt(c, `α = ${n0(a)}°  ·  β = ${String(b).replace(".", ",")}°`, W * .5, Hh * .54, 50, th.body, th.text, "center", 700);
      txt(c, a < 1 ? "senkrechter Einfall: keine Richtungsänderung" : "Brechung zum Lot hin: β kleiner als α", W * .5, Hh * .8, 40, th.body, th.line, "center", 600); });
    ctx.lab(g, {
      id: "brechung", titel: "Wie hängt der Brechungswinkel vom Einfallswinkel ab?",
      text: "An der optischen Scheibe fällt Licht aus der **Luft** auf die gerade Seite des Glaskörpers. Stelle verschiedene **Einfallswinkel α** ein – die Lichtquelle dreht sich mit – und lies an der Gradskala den **Brechungswinkel β** im Glas ab. Nimm mindestens sechs Messwerte auf – **verteilt über den ganzen Bereich von 0° bis 85°** – und trage sie selbst ins Diagramm ein.",
      regler: [{id: "a", name: "Einfallswinkel α (Luft → Glas)", einheit: "°", min: 0, max: 85, schritt: 5, wert: 0}],
      messe: v => ({b: betaOf(v.a), r: v.a}),
      anzeige: [{id: "b", name: "Brechungswinkel β (Gradskala)", einheit: "°", stellen: 1}, {id: "r", name: "Reflexionswinkel α' (schwacher Strahl)", einheit: "°", stellen: 0}],
      achsen: {x: {id: "a", name: "Einfallswinkel α in °", max: 90, teil: 10}, y: {id: "b", name: "Brechungswinkel β in °", max: 50, teil: 10}},   // 10°-Teilung wie auf der Gradskala: jede Reglerstellung (5°) liegt auf einer Gitterlinie
      punkte: 6, gerade: false,
      aufgabe: {frage: "Lies an deiner Kurve ab: Bei welchem Einfallswinkel α wird das Licht im Glas unter β = 30° gebrochen?", wert: 48.6, toleranz: 2.5, einheit: "°",
        tipps: ["Suche auf der β-Achse den Wert 30° und gehe waagrecht nach rechts, bis du deine Kurve triffst.",
                "Bei α = 45° ist β = 28°, bei α = 50° ist β = 30,5°. Der gesuchte Einfallswinkel liegt dazwischen – näher an 50°.",
                "Vom Schnittpunkt mit der Kurve gehst du senkrecht nach unten zur α-Achse: α ≈ 4… °"],
        loesung: "Von β = 30° waagrecht zur Kurve, dann senkrecht nach unten: **α ≈ 49°**. Das Licht wird dabei um fast 19° zum Lot hin abgelenkt."},
      merke: "Beim Übergang **Luft → Glas** ist der Brechungswinkel β immer **kleiner** als der Einfallswinkel α: Das Licht wird **zum Lot hin** gebrochen. β wächst mit α, aber **nicht proportional** – die Kurve wird immer flacher und bleibt unter ca. 42°. Das ist genau der **Grenzwinkel** für den umgekehrten Weg Glas → Luft, denn der Lichtweg ist umkehrbar.",
      live: (v, m) => {
        if (!v) { labSt = null; phiT = phiOf(STATES[si]); moving = true; drawFace(null); drawDisp(STATES[si]); return; }
        labSt = {m: "luft", a: v.a}; phiT = v.a; moving = true; drawFace(null); drawLabDisp(v.a, m.b); }
    });
  }

  /* =================================================================
     A: Reflexionsgesetz am ebenen Spiegel (links, Vorderseite zum Gang)
     ================================================================= */
  {
    const g = new T.Group(); ctx.add(g, S.A.x - .1, 0, S.A.z); g.rotation.y = Math.PI / 2;
    const BW = 2.2, BH = 1.5, B0 = .94, BT = B0 + BH, HY = 1.08, RP = .86, ZF = .065;
    g.add(Mm(mergeGeos(T, [xf(T, new T.BoxGeometry(2.36, .86, .6), 0, .43, 0), xf(T, new T.BoxGeometry(2.42, 1.62, .07), 0, B0 + BH / 2, -.08)]), ctx.mat(th.table), true));
    g.add(Mm(mergeGeos(T, [xf(T, new T.BoxGeometry(2.44, .05, .66), 0, .885, 0), xf(T, new T.BoxGeometry(2.46, .05, .1), 0, BT + .05, -.08),
      xf(T, new T.BoxGeometry(1.84, .04, .2), 0, HY - .035, .06), xf(T, new T.BoxGeometry(.05, .14, .05), -.86, 1.0, .1), xf(T, new T.BoxGeometry(.05, .14, .05), .86, 1.0, .1),
      xf(T, new T.TorusGeometry(RP + .07, .012, 6, 64, Math.PI), 0, HY, .05)]), FR));
    g.add(Mm(xf(T, new T.BoxGeometry(1.74, .014, .17), 0, HY - .008, .06), mirrorMat));
    const spL = ctx.text("ebener Spiegel", {size: .045, color: th.text}); spL.position.set(.62, HY - .035, .165); g.add(spL);
    const tr = []; for (const y of [.12, .8]) tr.push(xf(T, new T.BoxGeometry(2.3, .03, .02), 0, y, .305));
    for (const x of [-.8, .8]) tr.push(xf(T, new T.BoxGeometry(.03, .66, .02), x, .46, .305));
    g.add(Mm(mergeGeos(T, tr), FR));
    const aLab = ctx.text("Reflexionsgesetz", {size: .09, color: th.hi}); aLab.position.set(0, .52, .31); g.add(aLab);
    const bd = canvasPlane(ctx, BW, BH, 1024, Math.round(1024 * BH / BW)); bd.position.set(0, B0 + BH / 2, -.04); g.add(bd);
    const piv = new T.Group(); piv.position.set(0, HY, ZF); g.add(piv);
    const lamp = emitter(ctx, th, .85); lamp.position.set(0, RP + .02, 0); lamp.rotation.z = -Math.PI / 2; piv.add(lamp);
    const at = (x, y) => V(T, x, HY + y, ZF);
    const rIn = ray(ctx, [at(0, 1), at(0, 0)], th.beam, .011, g), rOut = ray(ctx, [at(0, 0), at(0, 1)], th.beam, .011, g);
    const hit = ctx.glow(th.beam, .22), end = ctx.glow(th.beam, .16); hit.position.copy(at(0, .005)); g.add(hit, end);
    const AL = [20, 35, 50, 65]; let ai = 1, a = AL[ai], aT = a, moving = false;
    const apply = v => { const r = v * DEG; piv.rotation.z = r; rIn.set([at(-Math.sin(r) * (RP + .02), Math.cos(r) * (RP + .02)), at(0, 0)]);
      rOut.set([at(0, 0), at(Math.sin(r) * (RP - .03), Math.cos(r) * (RP - .03))]); end.position.copy(at(Math.sin(r) * (RP - .03), Math.cos(r) * (RP - .03))); };
    const draw = (v, arcs) => bd.userData.draw((c, W, Hh) => {
      const s = W / BW, X = x => (x + BW / 2) * s, Y = y => (BT - y) * s, hx = X(0), hy = Y(HY);
      panelBg(c, th, W, Hh, 24);
      txt(c, "Reflexion am ebenen Spiegel", W / 2, .11 * s, 44, th.font, th.text);
      txt(c, `Einfallswinkel α = ${v}°   ·   Reflexionswinkel α' = ${v}°`, W / 2, .23 * s, 34, th.body, th.hi, "center", 700);
      c.strokeStyle = th.dim; c.lineWidth = 3; c.beginPath(); c.arc(hx, hy, RP * s, Math.PI, 2 * Math.PI); c.stroke();
      for (let d = -90; d <= 90; d += 5) { const an = (d - 90) * DEG, big = d % 10 === 0, r0 = (RP - (big ? .06 : .03)) * s;
        c.strokeStyle = th.line; c.lineWidth = big ? 3 : 2; c.beginPath(); c.moveTo(hx + Math.cos(an) * r0, hy + Math.sin(an) * r0); c.lineTo(hx + Math.cos(an) * RP * s, hy + Math.sin(an) * RP * s); c.stroke();
        if (big && Math.abs(d) < 90) txt(c, Math.abs(d) + "°", hx + Math.cos(an) * (RP - .12) * s, hy + Math.sin(an) * (RP - .12) * s, 19, th.body, th.text, "center", 600); }
      c.strokeStyle = th.text; c.lineWidth = 3; c.setLineDash([14, 10]); c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, Y(HY + RP - .02)); c.stroke(); c.setLineDash([]);
      txt(c, "Lot", hx + .035 * s, Y(HY + .5), 26, th.font, th.text, "left");
      c.fillStyle = "#d8e2ea"; c.fillRect(X(-.87), hy - 4, 1.74 * s, 8); c.strokeStyle = "rgba(216,226,234,.6)"; c.lineWidth = 2;
      for (let x = -.85; x < .87; x += .045) { c.beginPath(); c.moveTo(X(x), hy + 6); c.lineTo(X(x - .03), hy + 22); c.stroke(); }
      if (!arcs) return;
      const A = v * DEG, R = .24 * s, wedge = (from, to, ccw, lab) => { c.fillStyle = th.fill; c.strokeStyle = th.hi; c.lineWidth = 3; c.beginPath(); c.moveTo(hx, hy); c.arc(hx, hy, R, from, to, ccw); c.closePath(); c.fill();
        c.beginPath(); c.arc(hx, hy, R, from, to, ccw); c.stroke(); const mid = (from + to) / 2; txt(c, lab, hx + Math.cos(mid) * (R + .07 * s), hy + Math.sin(mid) * (R + .07 * s), 30, th.body, th.hi); };
      wedge(-Math.PI / 2, -Math.PI / 2 - A, true, "α"); wedge(-Math.PI / 2, -Math.PI / 2 + A, false, "α'");
      const along = (ang, dist, label) => { const ux = Math.cos(ang), uy = Math.sin(ang), side = ux < 0 ? -1 : 1, nx = -uy * side, ny = ux * side;   // Normale zeigt vom Lot weg
        const x = hx + (ux * dist + nx * .05) * s, y = hy + (uy * dist + ny * .05) * s; c.save(); c.translate(x, y);
        let rot = ang; if (Math.cos(rot) < 0) rot += Math.PI; c.rotate(rot); txt(c, label, 0, 0, 22, th.body, th.text, "center", 600); c.restore(); };
      along(-Math.PI / 2 - A, .48, "einfallender Strahl"); along(-Math.PI / 2 + A, .48, "reflektierter Strahl");
    });
    apply(a); draw(a, true);
    ctx.tick(dt => { if (!moving) return; a = approachVal(a, aT, dt, 18, 2.4); apply(a); if (a === aT) { moving = false; draw(aT, true); } });
    ctx.obstacleBox(S.A.x - .1, S.A.z, .7, 2.5);
    ctx.exhibit(g, {label: "Reflexionsgesetz", sub: "anklicken: Einfallswinkel ändern", title: "Das Reflexionsgesetz", pitch: -.06,
      onClick: () => { ai = (ai + 1) % AL.length; aT = AL[ai]; moving = true; draw(aT, false); },
      get text(){ const v = AL[ai]; return `Der Lichtstrahl trifft unter dem **Einfallswinkel α = ${v}°** auf den Spiegel und wird unter dem **Reflexionswinkel α' = ${v}°** zurückgeworfen: **Einfallswinkel = Reflexionswinkel**.\n\nBeide Winkel werden zum **Lot** gemessen – der Senkrechten zum Spiegel im Auftreffpunkt, nicht zur Spiegelfläche. Einfallender Strahl, Lot und reflektierter Strahl liegen in einer Ebene.`; }});
  }

  /* =================================================================
     B: Spiegelbild an der Glasscheibe – Kerzenversuch (rechts hinten)
     ================================================================= */
  {
    const g = new T.Group(); ctx.add(g, S.B.x + .25, 0, S.B.z); g.rotation.y = -Math.PI / 2 + .5;
    const TY = .86, FY = TY + (ctx.world === "sterne" ? .244 : .265), BX = 1.9, BHt = 1.0, BZ = -.37;   // Tisch, Flamme bzw. Signallicht, Tafel
    g.add(Mm(mergeGeos(T, [xf(T, new T.BoxGeometry(2.0, .05, .86), 0, TY - .025, 0), xf(T, new T.BoxGeometry(1.98, 1.08, .05), 0, TY + .53, BZ - .04)]), ctx.mat(th.table), true));
    const legs = []; for (const x of [-.92, .92]) for (const z of [-.36, .36]) legs.push(xf(T, new T.BoxGeometry(.06, TY - .05, .06), x, (TY - .05) / 2, z));
    legs.push(xf(T, new T.BoxGeometry(1.8, .04, .04), 0, .18, -.36), xf(T, new T.BoxGeometry(1.8, .04, .04), 0, .18, .36), xf(T, new T.BoxGeometry(1.88, .2, .05), 0, TY + .045, .295, -1.0, 0, 0));
    g.add(Mm(mergeGeos(T, legs), ctx.mat(th.leg), true));
    const bd = canvasPlane(ctx, BX, BHt, 1024, Math.round(1024 * BHt / BX)); bd.position.set(0, TY + .52, BZ - .01); g.add(bd);
    const RL = 1.84, rul = canvasPlane(ctx, RL, .2, 1024, Math.round(1024 * .2 / RL)); rul.position.set(0, TY + .075, .32); rul.rotation.x = -1.0; g.add(rul);
    // Glasscheibe im Rahmen – vorn so kurz, dass Pfosten und Fuß hinter dem schrägen Lineal bleiben (Lineal ab z ≈ 0,2)
    const ZP0 = -.365, ZP1 = .17, ZPm = (ZP0 + ZP1) / 2, LP = ZP1 - ZP0;   // hinterer/vorderer Pfosten, Mitte, Abstand
    g.add(Mm(xf(T, new T.BoxGeometry(.012, .62, LP - .03), 0, TY + .34, ZPm), ctx.mat("glass", {color: "#cdeaff", opacity: .38})));
    g.add(Mm(mergeGeos(T, [xf(T, new T.BoxGeometry(.03, .68, .03), 0, TY + .34, ZP1), xf(T, new T.BoxGeometry(.03, .68, .03), 0, TY + .34, ZP0),
      xf(T, new T.BoxGeometry(.03, .03, LP + .03), 0, TY + .67, ZPm), xf(T, new T.BoxGeometry(.03, .03, LP + .03), 0, TY + .02, ZPm),
      xf(T, new T.BoxGeometry(.2, .03, .06), 0, TY + .015, ZP1), xf(T, new T.BoxGeometry(.2, .03, .06), 0, TY + .015, ZP0)]), FR, true));
    // damit man die Scheibe auch von vorn (genau auf die Kante) als Glas erkennt: leuchtende Oberkante und schräge Glanzstreifen auf beiden Seiten
    const sheen = [xf(T, new T.BoxGeometry(.02, .007, LP + .03), 0, TY + .689, ZPm)];
    for (const [zz, yy, hh, ww] of [[-.15, .4, .3, .03], [-.075, .35, .17, .016], [.09, .3, .22, .024]])   // Glanzstreifen parallel, nur auf einer Seite (beidseitig sichtbar)
      sheen.push(xf(T, new T.PlaneGeometry(ww, hh), .0068, TY + yy, ZPm + zz, 0, Math.PI / 2, .5));
    g.add(Mm(mergeGeos(T, sheen), new T.MeshBasicMaterial({color: 0xe4f4ff, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false})));
    // zwei Kerzen: brennend (Gegenstand) und nicht angezündet (dort erscheint das Spiegelbild der Flamme).
    // Raumschiff: zwei Signalleuchten – eingeschaltet und ausgeschaltet; das Prinzip bleibt gleich.
    const SIG = ctx.world === "sterne", flameCol = SIG ? th.beam : 0xffd27a, ghostCol = SIG ? 0xff9aa8 : 0xffe2a8, haloCol = SIG ? th.beam : 0xffb050;
    const wax = SIG ? ctx.mat("steel") : ctx.mat("color", {color: "#efe4cc", rough: .75}), wick = SIG ? ctx.mat("metal") : ctx.mat("color", {color: "#2a2018"});
    const flameGeo = new T.SphereGeometry(.02, 12, 10), cupGeo = mergeGeos(T, [xf(T, new T.CylinderGeometry(.06, .065, .016, 20), 0, .008, 0), xf(T, new T.CylinderGeometry(.036, .036, .03, 16), 0, .03, 0)]);
    const bodyGeo = SIG ? mergeGeos(T, [xf(T, new T.CylinderGeometry(.03, .032, .17, 16), 0, .13, 0), xf(T, new T.CylinderGeometry(.034, .034, .012, 16), 0, .2, 0), xf(T, new T.CylinderGeometry(.034, .034, .012, 16), 0, .07, 0)])
      : new T.CylinderGeometry(.028, .03, .19, 16), topGeo = SIG ? new T.CylinderGeometry(.012, .016, .022, 12) : new T.CylinderGeometry(.003, .003, .03, 6);
    const domeM = SIG ? ctx.mat("glass", {color: "#ffd6dc", opacity: .3}) : null, domeGeo = SIG ? new T.SphereGeometry(.04, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2) : null;
    const candle = ghost => { const c = new T.Group();
      c.add(Mm(cupGeo, FR, true)); const b = Mm(bodyGeo, wax, true); if (!SIG) b.position.y = .14; c.add(b);
      const w = Mm(topGeo, wick); w.position.y = SIG ? .225 : .245; c.add(w);
      const f = new T.Mesh(flameGeo, new T.MeshBasicMaterial({color: ghost ? ghostCol : flameCol, transparent: true, opacity: ghost ? .6 : .95, toneMapped: false}));
      f.position.y = SIG ? .244 : .27; c.add(f); const gl = ctx.glow(haloCol, ghost ? .22 : .3); gl.position.y = f.position.y; c.add(gl); c.userData.fl = [f, gl];
      if (SIG) { const dm = Mm(domeGeo, domeM); dm.position.y = .226; c.add(dm); }
      return c; };
    const FLY = SIG ? 1.1 : 2.4;   // Flamme hoch und schmal, Signallicht rund
    const real = candle(false), img = candle(true); g.add(real, img); real.position.y = img.position.y = TY;
    const cl = ctx.light(SIG ? th.beam : 0xffa050, 1.2, 2.6, S.B.x, 1.3, S.B.z);
    // zwei Lichtstrahlen von der Flamme zur Scheibe und zurück; ihre Verlängerungen (gestrichelt) treffen sich im Bild
    const P1y = FY + .1, P2y = FY + .2, YMAX = TY + .78;
    const P3 = () => [V(T, 0, 0, 0), V(T, 1, 0, 0), V(T, 2, 0, 0)], rays = ray(ctx, P3(), th.beam, .006, g), rays2 = ray(ctx, P3(), th.beam, .006, g);   // je zwei Teilstücke
    const ext = dashes(ctx, th.text, .004, 60, g);
    const DL = [.2, .35, .5]; let di = 1, d = DL[di], dT = d, moving = false;
    const wpos = new T.Vector3();
    const apply = v => { real.position.x = -v; img.position.x = v;
      const F = V(T, -v, FY, 0), Fi = V(T, v, FY, 0), ends = [];
      for (const [py, rr] of [[P1y, rays], [P2y, rays2]]) { const P = V(T, -.006, py, 0), dy = py - FY, t = Math.min((v + .25) / v, (YMAX - py) / dy);
        rr.set([F, P, V(T, -.006 - v * t, py + dy * t, 0)]); ends.push(P); }
      ext.segs([[ends[0], Fi], [ends[1], Fi]]);
      if (cl) { g.updateMatrixWorld(); wpos.set(-v, FY + .05, .05); g.localToWorld(wpos); cl.position.copy(wpos); } };
    const drawBd = v => bd.userData.draw((c, W, Hh) => {
      const s = W / BX, X = x => (x + BX / 2) * s, Y = y => (TY + .02 + BHt - y) * s;
      panelBg(c, th, W, Hh, 22); txt(c, "Spiegelbild an der Glasscheibe", W / 2, .075 * s, 40, th.font, th.text);
      txt(c, "Gegenstandsweite g  =  Bildweite b", W / 2, .15 * s, 26, th.body, th.hi, "center", 600);
      txt(c, "Glasscheibe", X(0), Y(TY + .75), 25, th.font, th.text);
      if (v == null) return;
      txt(c, SIG ? "Leuchte" : "Kerze", X(-v - .07), Y(TY + .3), 26, th.font, th.text, "right"); txt(c, "(Gegenstand)", X(-v - .07), Y(TY + .24), 20, th.body, th.text, "right", 600);
      txt(c, "Spiegelbild", X(v + .07), Y(TY + .3), 26, th.font, th.line, "left"); txt(c, "(virtuell)", X(v + .07), Y(TY + .24), 20, th.body, th.line, "left", 600);
    });
    const drawRul = v => rul.userData.draw((c, W, Hh) => {
      const s = W / RL, X = x => (x + RL / 2) * s, base = Hh * .62; panelBg(c, th, W, Hh, 14);
      c.strokeStyle = th.line; c.lineWidth = 2; c.beginPath(); c.moveTo(X(-.86), base); c.lineTo(X(.86), base); c.stroke();
      for (let cm = -85; cm <= 85; cm += 5) { const big = cm % 10 === 0; c.lineWidth = big ? 2.5 : 1.5; c.beginPath(); c.moveTo(X(cm / 100), base); c.lineTo(X(cm / 100), base + (big ? 12 : 7)); c.stroke();
        if (big && cm % 20 === 0 && cm !== 0) txt(c, String(Math.abs(cm)), X(cm / 100), base + 25, 17, th.body, th.text, "center", 600); }
      txt(c, "0", X(0), base + 25, 17, th.body, th.text, "center", 700); txt(c, "cm", X(.88), base + 25, 15, th.body, th.text);
      c.fillStyle = th.text; c.fillRect(X(0) - 2, 8, 4, base - 8);
      if (v == null) return;
      const yy = Hh * .3, dim = (x0, x1, col) => { c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(X(x0) + 5, yy); c.lineTo(X(x1) - 5, yy); c.stroke();
        arrowHead(c, X(x0) + 1, yy, Math.PI, 12); arrowHead(c, X(x1) - 1, yy, 0, 12); };
      const cm = Math.round(v * 100); dim(-v, 0, th.hi); dim(0, v, th.line);   // Beschriftung außen neben den Pfeilen
      txt(c, `g = ${cm} cm`, X(-v) - 10, yy + 1, 24, th.body, th.hi, "right"); txt(c, `b = ${cm} cm`, X(v) + 10, yy + 1, 24, th.body, th.line, "left");
    });
    apply(d); drawBd(d); drawRul(d);
    ctx.tick((dt, t) => {
      if (moving) { d = approachVal(d, dT, dt, .12, 2.6); apply(d); if (d === dT) { moving = false; drawBd(dT); drawRul(dT); } }
      const f = SIG ? .93 + .07 * Math.sin(t * 3.2) : .9 + .07 * Math.sin(t * 11) * Math.sin(t * 5.3) + .04 * Math.sin(t * 23);   // Flackern bzw. Pulsieren – das Spiegelbild macht es mit
      for (const c of [real, img]) { const [fl, gl] = c.userData.fl; fl.scale.set(SIG ? FLY * f : 1, FLY * f, SIG ? FLY * f : 1); gl.scale.setScalar((c === img ? .22 : .3) * f); }
      if (cl) cl.intensity = 1.2 * f;
    });
    ctx.obstacle(S.B.x + .25, S.B.z, 1.05);
    ctx.exhibit(g, {label: "Spiegelbild", sub: SIG ? "anklicken: Leuchte verschieben" : "anklicken: Kerze verschieben", title: "Das Bild im ebenen Spiegel", pitch: -.2,
      onClick: () => { di = (di + 1) % DL.length; dT = DL[di]; moving = true; drawBd(null); drawRul(null); },
      get text(){ const cm = Math.round(DL[di] * 100); return (SIG ? `Die eingeschaltete Signalleuchte steht **g = ${cm} cm** vor der Glasscheibe, ihr Spiegelbild liegt genauso weit dahinter: **b = ${cm} cm**. Die zweite, ausgeschaltete Leuchte dort scheint deshalb zu leuchten.`
        : `Die brennende Kerze steht **g = ${cm} cm** vor der Glasscheibe, ihr Spiegelbild liegt genauso weit dahinter: **b = ${cm} cm**. Die zweite, nicht angezündete Kerze dort scheint deshalb zu brennen.`) + `\n\nDas Bild ist **virtuell**: Die reflektierten Strahlen scheinen nur von dort zu kommen (gestrichelt) – auf einem Schirm kannst du es nicht auffangen. Es ist aufrecht und gleich groß.`; }});
  }

  /* =================================================================
     C: Aquarium – geknickter Stab und scheinbare Hebung (rechts vorne)
     ================================================================= */
  {
    const g = new T.Group(); ctx.add(g, S.C.x + .2, 0, S.C.z); g.rotation.y = -Math.PI / 2;
    const L = 1.5, Dp = .6, Y0 = .6, Ht = .72, YS = Y0 + .04 + .5;   // Beckenboden, Höhe, Wasseroberfläche
    g.add(Mm(xf(T, new T.BoxGeometry(2.1, .58, .76), 0, .29, 0), ctx.mat(th.table), true));
    const fr = [xf(T, new T.BoxGeometry(2.14, .03, .8), 0, .585, 0)];
    for (const y of [Y0 + .015, Y0 + Ht]) for (const z of [-Dp / 2, Dp / 2]) fr.push(xf(T, new T.BoxGeometry(L + .03, .03, .03), 0, y, z));
    for (const y of [Y0 + .015, Y0 + Ht]) for (const x of [-L / 2, L / 2]) fr.push(xf(T, new T.BoxGeometry(.03, .03, Dp + .03), x, y, 0));
    for (const x of [-L / 2, L / 2]) for (const z of [-Dp / 2, Dp / 2]) fr.push(xf(T, new T.BoxGeometry(.03, Ht, .03), x, Y0 + Ht / 2, z));
    fr.push(xf(T, new T.BoxGeometry(L + .1, .05, .12), 0, Y0 + Ht + .06, -Dp / 2 + .02));    // Leuchtenbalken
    g.add(Mm(mergeGeos(T, fr), FR, true));
    g.add(Mm(xf(T, new T.BoxGeometry(L - .04, .012, .05), 0, Y0 + Ht + .03, -Dp / 2 + .03), ctx.mat("glow", {color: "#cfeeff", intensity: 1.4})));
    g.add(Mm(xf(T, new T.BoxGeometry(L, Ht, Dp), 0, Y0 + Ht / 2, 0), ctx.mat("glass", {color: "#d8f0ff", opacity: .16})));
    g.add(Mm(xf(T, new T.BoxGeometry(L - .02, .05, Dp - .02), 0, Y0 + .04, 0), ctx.mat("color", {color: "#c9b17f", rough: .95})));
    const waterCol = ctx.world === "detektiv" ? "#4f8a8a" : ctx.world === "sterne" ? "#2f9be0" : "#3a78c8";
    g.add(Mm(xf(T, new T.BoxGeometry(L - .02, YS - Y0 - .065, Dp - .02), 0, (YS + Y0 + .065) / 2, 0), ctx.mat("water", {color: waterCol})));
    g.add(Mm(xf(T, new T.BoxGeometry(L - .02, .006, .006), 0, YS, Dp / 2 - .012), ctx.mat("glow", {color: "#d9f3ff", intensity: .8})));
    // Pflanzen und Steine
    const r = ctx.rand, pl = [], stn = [];
    for (let i = 0; i < 7; i++) { const h = .18 + r() * .25; pl.push(xf(T, new T.ConeGeometry(.025 + r() * .02, h, 6), .25 + i * .07 + r() * .03, Y0 + .065 + h / 2, -.2 + r() * .06, 0, 0, (r() - .5) * .3, 1, 1, .45)); }
    for (let i = 0; i < 5; i++) stn.push(xf(T, new T.IcosahedronGeometry(.03 + r() * .03, 0), -.6 + r() * .3 + (i > 2 ? .9 : 0), Y0 + .075, -.15 + r() * .3, r(), r(), r(), 1, .6, 1));
    g.add(Mm(mergeGeos(T, pl), ctx.world === "sterne" ? ctx.mat("crystal", {color: "#3DDC97", intensity: .5}) : ctx.mat("color", {color: "#2f7d4a", rough: .8})));
    g.add(Mm(mergeGeos(T, stn), ctx.mat("color", {color: "#6b6258", rough: .9})));
    // Auge (Modell des Betrachters) links über dem Becken
    const E = V(T, -.98, 1.62, 0);
    const eyeGeos = [xf(T, new T.CylinderGeometry(.012, .012, E.y - .64, 8), E.x, (E.y + .6) / 2 - .02, 0), xf(T, new T.CylinderGeometry(.06, .07, .03, 16), E.x, .615, 0)];
    tag(g, "Auge", E.x, E.y - .17, .016, .06, eyeGeos);   // Schildchen am Stiel des Augenmodells
    g.add(Mm(mergeGeos(T, eyeGeos), FR));
    const eye = new T.Group(); eye.position.copy(E); g.add(eye);
    eye.add(Mm(new T.SphereGeometry(.055, 20, 14), ctx.mat("color", {color: "#f4f1ea", rough: .35})));
    const iris = Mm(new T.CircleGeometry(.027, 20), ctx.mat("color", {color: "#3f7fc0", rough: .4})); iris.position.z = .052; eye.add(iris);
    const pup = Mm(new T.CircleGeometry(.013, 16), ctx.mat("color", {color: "#080808", rough: .3})); pup.position.z = .0535; eye.add(pup);
    // Stab (Weltvarianten): oberer Teil fest, Teil unter Wasser wird gezeigt, wie das Auge ihn sieht oder wie er wirklich ist
    const rodM = ctx.world === "sterne" ? ctx.mat("steel") : ctx.mat("color", {color: ctx.world === "zauber" ? "#8a5a32" : "#6e4a2c", rough: .5}), Tp = V(T, -.6, 1.66, .05), Wp = V(T, -.12, YS, .05);
    const dir = Wp.clone().sub(Tp).normalize(), Breal = Wp.clone().addScaledVector(dir, .62);
    const rodR = ctx.world === "detektiv" ? .019 : .016;
    g.add(Mm(segGeo(T, Tp, Wp, rodR, 12), rodM, true));
    const knob = Mm(new T.SphereGeometry(rodR * 2, 14, 10), ctx.world === "sterne" ? ctx.mat("glow", {color: "#4FC3F7", intensity: 1.2}) : FR); knob.position.copy(Tp); g.add(knob);
    const low = Mm(new T.CylinderGeometry(rodR, rodR, 1, 12), rodM); g.add(low);
    // Bildpunkt Qo senkrecht über Q, den das Auge sieht, und Austrittspunkt So an der Wasseroberfläche (Brechung Wasser → Luft); schreibt in vorhandene Vektoren
    const appar = (Q, So, Qo) => {
      const dx = E.x - Q.x, dz = E.z - Q.z, D = Math.hypot(dx, dz), h = YS - Q.y, Hh = E.y - YS;
      if (D < 1e-4 || h <= 0) { So.set(Q.x, YS, Q.z); Qo.copy(Q); return; }
      let lo = 0, hi = D; for (let i = 0; i < 40; i++) { const x = (lo + hi) / 2, f = N_WASSER * x / Math.hypot(x, h) - (D - x) / Math.hypot(D - x, Hh); if (f > 0) hi = x; else lo = x; }
      const x = (lo + hi) / 2; So.set(Q.x + dx / D * x, YS, Q.z + dz / D * x); Qo.set(Q.x, YS - x * Hh / (D - x), Q.z); };
    const Bapp = new T.Vector3(), up = new T.Vector3(0, 1, 0), tmp = new T.Vector3(), tmp2 = new T.Vector3(); appar(Breal, tmp, Bapp);
    const setLow = k => { tmp.copy(Breal).lerp(Bapp, k); tmp2.subVectors(tmp, Wp); const Ln = tmp2.length();
      low.position.copy(Wp).addScaledVector(tmp2, .5); low.scale.set(1, Ln, 1); low.quaternion.setFromUnitVectors(up, tmp2.divideScalar(Ln)); };
    // Fisch (echt) und sein scheinbares Bild
    const fishGeo = mergeGeos(T, [xf(T, new T.SphereGeometry(.05, 16, 12), 0, 0, 0, 0, 0, 0, 1.6, .75, .5), xf(T, new T.ConeGeometry(.045, .07, 10), -.1, 0, 0, 0, 0, Math.PI / 2, 1, 1, .25),
      xf(T, new T.ConeGeometry(.025, .05, 8), .0, .045, 0, 0, 0, -.5, 1, 1, .25)]);
    const fishCol = ctx.world === "sterne" ? "#ff8a3d" : ctx.world === "detektiv" ? "#e0782a" : "#ff9a2a";
    const fish = Mm(fishGeo, new T.MeshStandardMaterial({color: fishCol, emissive: fishCol, emissiveIntensity: .45, roughness: .4})),
      ghostF = new T.Mesh(fishGeo, new T.MeshBasicMaterial({color: 0xffc890, transparent: true, opacity: 0, depthWrite: false, toneMapped: false}));
    fish.material.transparent = true; fish.renderOrder = ghostF.renderOrder = 2; g.add(fish, ghostF);   // nach dem Wasser zeichnen, damit die Farbe erhalten bleibt
    const fRay = ray(ctx, [V(T, 0, 0, 0), V(T, 1, 0, 0), V(T, 2, 0, 0)], th.beam, .006, g), fExt = dashes(ctx, th.text, .0055, 40, g), lot = dashes(ctx, th.text, .003, 20, g);
    // Luftblasen
    const NB = 16, bp = new Float32Array(NB * 3), bs = []; for (let i = 0; i < NB; i++) { bs.push(r()); bp[i * 3 + 1] = Y0 + .07 + r() * (YS - Y0 - .1); }
    const bg = new T.BufferGeometry(); bg.setAttribute("position", new T.BufferAttribute(bp, 3));
    const bub = new T.Points(bg, new T.PointsMaterial({color: 0xdff4ff, size: .028, map: R3D.util.glowTex(), transparent: true, opacity: .8, depthWrite: false})); g.add(bub); bub.frustumCulled = false;
    g.updateMatrixWorld(); const aqL = ctx.light(0xcfeeff, 2.2, 2.4, ...g.localToWorld(V(T, 0, Y0 + Ht + .25, .1)).toArray());
    const sign = canvasPlane(ctx, 1.2, .26, 1024, 222); sign.position.set(0, .33, .385); g.add(sign);
    let real = false, k = 1;
    const drawSign = () => sign.userData.draw((c, W, Hh) => { panelBg(c, th, W, Hh, 22);
      txt(c, real ? "In Wirklichkeit" : "So siehst du es", W / 2, Hh * .36, 70, th.font, th.hi); txt(c, real ? "Stab gerade · Fisch tiefer" : "Stab geknickt · Fisch scheinbar höher", W / 2, Hh * .72, 42, th.body, th.text, "center", 600); });
    drawSign(); setLow(1);
    let fx = 0, fdir = 1;
    // Hilfsvektoren und Punktlisten einmal anlegen und in jedem Bild wiederverwenden (kein Speicherabfall)
    const Qf = new T.Vector3(), Sf = new T.Vector3(), Q2f = new T.Vector3(), lA = new T.Vector3(), lB = new T.Vector3(), Z1 = new T.Vector3(0, 0, 1);
    const fPts = [Qf, Sf, E], extL = [[Sf, Q2f]], lotL = [[lA, lB]];
    ctx.tick((dt, t) => {
      const kt = real ? 0 : 1; if (k !== kt) { k = approachVal(k, kt, dt, .9, 0); setLow(k); }
      const nx = .42 * Math.sin(t * .33); fdir = nx >= fx ? 1 : -1; fx = nx;
      Qf.set(fx, YS - .33 + .02 * Math.sin(t * .9), -.13); appar(Qf, Sf, Q2f); const wob = .18 * Math.sin(t * 7);
      fish.position.copy(Qf).lerp(Q2f, k); fish.rotation.y = (fdir > 0 ? 0 : Math.PI) + wob; ghostF.position.copy(Q2f); ghostF.rotation.y = fish.rotation.y;
      ghostF.material.opacity = .55 * (1 - k); ghostF.visible = k < .98;
      if (k < .98) { fRay.set(fPts).alpha(1 - k); fExt.segs(extL, .03, .022); fExt.alpha(1 - k);
        lA.set(Sf.x, YS + .16, Sf.z); lB.set(Sf.x, YS - .14, Sf.z); lot.segs(lotL, .025, .02); lot.alpha(1 - k); }
      else { fRay.alpha(0); fExt.alpha(0); lot.alpha(0); }
      tmp.copy(fish.position).lerp(Wp, .5).sub(E); eye.quaternion.setFromUnitVectors(Z1, tmp.normalize());
      for (let i = 0; i < NB; i++) { let y = bp[i * 3 + 1] + dt * (.09 + bs[i] * .06); if (y > YS - .01) y = Y0 + .08; bp[i * 3 + 1] = y; bp[i * 3] = .55 + Math.sin(t * 2 + i) * .012 + bs[i] * .03; bp[i * 3 + 2] = -.12 + (bs[i] - .5) * .05; }
      bg.attributes.position.needsUpdate = true;
    });
    ctx.obstacleBox(S.C.x + .2, S.C.z, .8, 2.15);
    ctx.exhibit(g, {label: "Aquarium", sub: "anklicken: So ist es wirklich", title: "Scheinbare Hebung im Wasser", pitch: -.24,
      onClick: () => { real = !real; drawSign(); },
      get text(){ return real
        ? "In Wirklichkeit ist der Stab gerade, und der Fisch schwimmt tiefer. Sein Licht wird beim Übergang **Wasser → Luft vom Lot weg** gebrochen.\n\nDas Auge verfolgt die ankommenden Strahlen geradlinig zurück (gestrichelt). Deshalb sieht es den Fisch dort, wo die Verlängerung hinführt – **höher**, als er wirklich ist (**scheinbare Hebung**)."
        : "So sieht das Auge von schräg oben ins Becken: Der Stab scheint an der Wasseroberfläche **geknickt**, und der Fisch wirkt **höher**, als er wirklich schwimmt. Beides kommt von der **Brechung** an der Wasseroberfläche.\n\nKlicke noch einmal, um zu sehen, wo Stab und Fisch wirklich sind."; }});
  }

  /* =================================================================
     D: Lichtleiter (gebogene Glasfaser) und Umlenkprisma (links vorne)
     ================================================================= */
  {
    const g = new T.Group(); ctx.add(g, S.D.x - .1, 0, S.D.z); g.rotation.y = Math.PI / 2;
    const TY = .88;
    g.add(Mm(xf(T, new T.BoxGeometry(2.7, .06, .72), 0, TY - .03, 0), ctx.mat(th.table), true));
    const lg = []; for (const x of [-1.28, 1.28]) for (const z of [-.3, .3]) lg.push(xf(T, new T.BoxGeometry(.07, TY - .06, .07), x, (TY - .06) / 2, z));
    lg.push(xf(T, new T.BoxGeometry(2.5, .04, .6), 0, .2, 0), xf(T, new T.BoxGeometry(2.6, .14, .04), 0, TY - .13, .34));
    g.add(Mm(mergeGeos(T, lg), ctx.mat(th.leg), true));
    // Glasfaser
    const fib = new T.CatmullRomCurve3([[-1.0, 1.15], [-.78, 1.15], [-.52, 1.24], [-.38, 1.5], [-.3, 1.78], [-.1, 1.95], [.12, 1.9], [.27, 1.68], [.32, 1.42], [.4, 1.24], [.5, 1.2], [.62, 1.2]].map(([x, y]) => V(T, x, y, 0)), false, "centripetal");
    g.add(Mm(new T.TubeGeometry(fib, 200, .044, 14, false), ctx.mat("glass", {color: "#d0f0ff", opacity: .32})));
    const sup = [];
    for (const u of [.1, .45, .86]) { const p = fib.getPointAt(u), tg = fib.getTangentAt(u);
      sup.push(xf(T, new T.CylinderGeometry(.011, .011, p.y - .045 - TY, 8), p.x, (p.y - .045 + TY) / 2, -.0), xf(T, new T.CylinderGeometry(.05, .06, .02, 14), p.x, TY + .01, 0));
      const ring = new T.TorusGeometry(.05, .009, 6, 18); ring.applyMatrix4(new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), tg), new T.Vector3(1, 1, 1))); sup.push(ring); }
    for (const u of [0, 1]) { const p = fib.getPointAt(u), c = new T.CylinderGeometry(.052, .052, .05, 16); c.applyMatrix4(new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), fib.getTangentAt(u)), new T.Vector3(1, 1, 1))); sup.push(c); }
    // Umlenkprisma (gleichschenklig-rechtwinklig) an einer Halteplatte, Empfänger darüber
    const pr = new T.Shape(); pr.moveTo(.72, 1.42); pr.lineTo(1.02, 1.42); pr.lineTo(.72, 1.12); pr.closePath();
    const prGeo = new T.ExtrudeGeometry(pr, {depth: .16, bevelEnabled: false}); prGeo.translate(0, 0, -.08);
    const prism = Mm(prGeo, ctx.mat("glass", {color: "#cfe9ff", opacity: .42})); g.add(prism);
    const edges = new T.LineSegments(new T.EdgesGeometry(prGeo), new T.LineBasicMaterial({color: th.line, transparent: true, opacity: .75})); g.add(edges);
    sup.push(xf(T, new T.BoxGeometry(.4, .4, .02), .86, 1.28, -.1), xf(T, new T.CylinderGeometry(.014, .014, .42, 8), .86, TY + .21 - .02, -.1), xf(T, new T.CylinderGeometry(.06, .07, .02, 14), .86, TY + .01, -.1));
    sup.push(xf(T, new T.CylinderGeometry(.014, .014, 1.08, 8), 1.12, TY + .54, -.05), xf(T, new T.BoxGeometry(.34, .025, .03), .96, 1.97, -.05), xf(T, new T.CylinderGeometry(.06, .07, .02, 14), 1.12, TY + .01, -.05));
    // Stativ unter der Lichtquelle (Stange, Klemme, Fuß – wie bei den Faserhaltern)
    sup.push(xf(T, new T.CylinderGeometry(.011, .011, 1.11 - TY, 8), -1.12, (1.11 + TY) / 2, 0), xf(T, new T.CylinderGeometry(.022, .022, .03, 12), -1.12, 1.095, 0),
      xf(T, new T.CylinderGeometry(.06, .07, .02, 14), -1.12, TY + .01, 0));
    // Beschriftungen als Schildchen: an der Tischkante (Zarge vorn, Vorderseite z = 0,36) und auf dem Arm über dem Schirm
    tag(g, "Glasfaser (Lichtleiter)", -.3, TY - .13, .366, .07, sup); tag(g, "Umlenkprisma", .86, TY - .13, .366, .07, sup);
    tag(g, "Schirm", .96, 1.9825 + .0585, -.05, .06, sup);
    g.add(Mm(mergeGeos(T, sup), FR, true));
    const recv = Mm(xf(T, new T.CylinderGeometry(.1, .1, .03, 24), .8, 1.95, 0), ctx.world === "sterne" ? ctx.mat("metal") : ctx.mat("darkwood")); g.add(recv);
    const recvFace = Mm(xf(T, new T.CircleGeometry(.085, 24), .8, 1.934, 0, Math.PI / 2, 0, 0), new T.MeshStandardMaterial({color: th.text, emissive: th.beamCss, emissiveIntensity: 0, roughness: .9})); g.add(recvFace);
    const flash = ctx.glow(th.beam, .1); flash.position.set(.8, 1.92, 0); g.add(flash);
    const src = emitter(ctx, th, .9); src.position.set(-1.05, 1.15, 0); g.add(src);
    // Lichtweg: Zickzack durch Totalreflexion in der Faser, dann ins Prisma (Totalreflexion unter 45°), dann nach oben zum Schirm
    const Lf = fib.getLength(), nB = Math.max(6, Math.round(Lf / .085)), rin = .029, path = [V(T, -1.05, 1.15, 0), fib.getPointAt(0)];
    for (let i = 1; i < nB; i++) { const u = i / nB, p = fib.getPointAt(u), tg = fib.getTangentAt(u); path.push(p.add(V(T, -tg.y, tg.x, 0).normalize().multiplyScalar(i % 2 ? rin : -rin))); }
    path.push(fib.getPointAt(1), V(T, .8, 1.2, 0), V(T, .8, 1.42, 0), V(T, .8, 1.93, 0));
    const line = ray(ctx, path, th.beam, .006, g).alpha(.3);
    const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + path[i].distanceTo(path[i - 1]));
    const LT = cum[cum.length - 1], posAt = (s, out) => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const k = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return out.copy(path[i - 1]).lerp(path[i], Math.min(1, Math.max(0, k))); };
    const NP = 4, pulses = []; for (let i = 0; i < NP; i++) { const p = ctx.glow(th.beam, .13); p.visible = false; g.add(p); pulses.push(p); }
    let on = false, ph = 0, fl = 0;
    ctx.tick((dt, t) => {
      if (on) { const prev = ph; ph += dt * .9;
        const L2 = LT + .6, wrap = v => ((v % L2) + L2) % L2;
        pulses.forEach((p, i) => { const s = ph - i * .55, sm = wrap(s), a0 = wrap(prev - i * .55); p.visible = s >= 0 && sm <= LT; if (p.visible) posAt(sm, p.position);
          if (s >= 0 && a0 < LT && (sm >= LT || sm < a0)) fl = 1; }); }   // Puls erreicht den Schirm
      fl = Math.max(0, fl - dt * 1.6); flash.scale.setScalar(.1 + .32 * fl + (on ? .06 : 0)); flash.material.opacity = .6 + .4 * fl;
      recvFace.material.emissiveIntensity = (on ? .25 : 0) + 1.4 * fl;
    });
    ctx.obstacleBox(S.D.x - .1, S.D.z, .8, 2.75);
    ctx.exhibit(g, {label: "Lichtleiter", sub: "anklicken: Lichtpulse senden", title: "Lichtleiter und Umlenkprisma", pitch: -.1,
      onClick: () => { on = !on; line.alpha(on ? .95 : .3); if (!on) pulses.forEach(p => p.visible = false); else ph = 0; },
      text: "In der gebogenen Glasfaser trifft das Licht immer wieder sehr flach auf die Wand – der Einfallswinkel ist größer als der **Grenzwinkel** (Glas → Luft ca. 42°). Deshalb wird das Licht **totalreflektiert** und läuft im Zickzack sogar um Kurven, so wie im Datenkabel oder im Endoskop.\n\nIm **Umlenkprisma** tritt das Licht senkrecht ein und trifft innen unter 45° auf die lange Seite. Weil 45° größer als 42° ist, wird es totalreflektiert und nach oben zum Schirm umgelenkt – wie im Fernglas."});
  }

  /* =================================================================
     E: Periskop – zwei parallele Spiegel unter 45° (rechts vorne in der Ecke)
     ================================================================= */
  {
    const g = new T.Group(); ctx.add(g, 4.25, 0, -9.25); g.rotation.y = -1.1;
    const XT = .2, Y1 = 1.0, Y2 = 2.0, XG = -.7, XE = .54;   // Rohr, untere/obere Spiegelhöhe, Gegenstand, Auge
    g.add(Mm(xf(T, new T.BoxGeometry(1.75, .06, .56), -.05, .03, 0), ctx.mat(th.table), true));
    g.add(Mm(xf(T, R3D.util.scaleUV(new T.BoxGeometry(.3, 1.66, .5), .3, .42), -.2, .06 + .83, 0), ctx.mat("stone"), true));
    const pf = [xf(T, new T.BoxGeometry(.18, 1.34, .012), XT, 1.5, -.085),                       // Rückwand des Rohrs
      xf(T, new T.BoxGeometry(.012, 1.04, .18), XT - .085, .85 + .52, 0), xf(T, new T.BoxGeometry(.012, 1.04, .18), XT + .085, 1.15 + .52, 0),   // Seitenwände mit Öffnungen
      xf(T, new T.BoxGeometry(.19, .014, .19), XT, 2.17, 0), xf(T, new T.BoxGeometry(.19, .014, .19), XT, .83, 0),
      xf(T, new T.CylinderGeometry(.05, .05, .1, 16), XT + .14, Y1, 0, 0, 0, Math.PI / 2),                                  // Okular
      xf(T, new T.CylinderGeometry(.025, .03, .8, 10), XT, .43, 0), xf(T, new T.CylinderGeometry(.09, .11, .04, 16), XT, .08, 0),
      xf(T, new T.CylinderGeometry(.012, .012, Y2 - .2, 8), XG, (Y2 - .14) / 2 + .03, 0), xf(T, new T.CylinderGeometry(.06, .07, .03, 14), XG, .075, 0),
      xf(T, new T.CylinderGeometry(.012, .012, Y1 - .1, 8), XE + .02, (Y1 - .05) / 2 + .03, 0), xf(T, new T.CylinderGeometry(.05, .06, .03, 14), XE + .02, .075, 0)];
    for (const [x, y] of [[XT - .09, 1.5], [XT + .09, 1.5]]) pf.push(xf(T, new T.BoxGeometry(.014, 1.34, .014), x, y, .088));
    tag(g, "Periskop", XT, 2.177 + .082, 0, .09, pf, th.hi);    // Schild steht auf dem Deckel des Rohrs
    tag(g, "Auge", XE + .02, Y1 - .16, .016, .06, pf);           // Schildchen am Stiel des Augenmodells
    g.add(Mm(mergeGeos(T, pf), FR, true));
    g.add(Mm(xf(T, new T.BoxGeometry(.17, 1.33, .006), XT, 1.5, .086), ctx.mat("glass", {color: "#dff2ff", opacity: .18})));
    g.add(Mm(mergeGeos(T, [xf(T, new T.BoxGeometry(.22, .008, .15), XT, Y2, 0, 0, 0, -Math.PI / 4), xf(T, new T.BoxGeometry(.22, .008, .15), XT, Y1, 0, 0, 0, -Math.PI / 4)]), mirrorMat));
    const obj = Mm(new T.OctahedronGeometry(.09, 0), crystalMat(.5)); obj.scale.set(1, 1.4, 1); obj.position.set(XG, Y2, 0); g.add(obj);
    const og = ctx.glow(th.beam, .3); og.position.set(XG, Y2, .02); g.add(og);
    const eye = new T.Group(); eye.position.set(XE, Y1, 0); eye.rotation.y = -Math.PI / 2; g.add(eye);
    eye.add(Mm(new T.SphereGeometry(.055, 20, 14), ctx.mat("color", {color: "#f4f1ea", rough: .35})));
    const ir = Mm(new T.CircleGeometry(.027, 20), ctx.mat("color", {color: "#3f7fc0", rough: .4})); ir.position.z = .052; eye.add(ir);
    const pu = Mm(new T.CircleGeometry(.013, 16), ctx.mat("color", {color: "#080808", rough: .3})); pu.position.z = .0535; eye.add(pu);
    const lw = ctx.text("Mauer", {size: .07, color: th.text}); lw.position.set(-.2, .5, .26); g.add(lw);
    const path = [V(T, XG + .06, Y2, 0), V(T, XT, Y2, 0), V(T, XT, Y1, 0), V(T, XE - .06, Y1, 0)];
    const pr = ray(ctx, path, th.beam, .008, g).alpha(.25), pulse = ctx.glow(th.beam, .14); pulse.visible = false; g.add(pulse);
    const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + path[i].distanceTo(path[i - 1]));
    let on = false, ph = 0;
    ctx.tick((dt, t) => { obj.rotation.y = t * .6; og.scale.setScalar((on ? .42 : .28) + .03 * Math.sin(t * 4));
      if (!on) return; ph = (ph + dt * .8) % (cum[3] + .5); pulse.visible = ph <= cum[3];
      let i = 1; while (i < 3 && cum[i] < ph) i++; pulse.position.copy(path[i - 1]).lerp(path[i], Math.min(1, (ph - cum[i - 1]) / (cum[i] - cum[i - 1]))); });
    ctx.obstacle(4.25, -9.25, .95);
    ctx.exhibit(g, {label: "Periskop", sub: "anklicken: Lichtweg zeigen", title: "Das Periskop", pitch: -.12,
      onClick: () => { on = !on; pr.alpha(on ? .95 : .25); obj.material.emissiveIntensity = on ? 1.4 : .5; if (!on) pulse.visible = false; ph = 0; },
      text: "Im Periskop stecken zwei **parallele ebene Spiegel**, beide gleich schräg eingebaut. Der obere Spiegel lenkt das waagrecht ankommende Licht vom Gegenstand **senkrecht nach unten** um, der untere lenkt es wieder waagrecht ins Auge.\n\nAn jedem Spiegel gilt das **Reflexionsgesetz**: Einfallswinkel = Reflexionswinkel, beide zum **Lot** gemessen. Der Winkel zwischen einfallendem und reflektiertem Strahl ist deshalb doppelt so groß wie der Einfallswinkel. So kannst du über die Mauer hinwegsehen, ohne selbst gesehen zu werden."});
  }

  /* =================================================================
     Über dem Gang: Lichtweg über fünf hängende Spiegel
     ================================================================= */
  {
    const P = [V(T, -2.2, 5.0, 9.3), V(T, 1.5, 5.4, 6.3), V(T, -1.5, 4.8, 2.9), V(T, 1.5, 5.4, -.4), V(T, -1.5, 4.8, -4.1), V(T, 1.5, 5.4, -7.4), V(T, -2.1, 5.0, -9.4)];
    const fr = [], faces = [], hits = [];
    for (let i = 1; i < P.length - 1; i++) {
      const M = P[i], n = P[i - 1].clone().sub(M).normalize().add(P[i + 1].clone().sub(M).normalize()).normalize(), q = new T.Quaternion();
      q.setFromUnitVectors(new T.Vector3(0, 1, 0), n); const disk = new T.CylinderGeometry(.27, .27, .03, 32); disk.applyMatrix4(new T.Matrix4().compose(M.clone().addScaledVector(n, -.018), q, new T.Vector3(1, 1, 1))); fr.push(disk);
      const rim = new T.TorusGeometry(.27, .02, 6, 32); rim.applyMatrix4(new T.Matrix4().compose(M.clone().addScaledVector(n, -.005), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), n), new T.Vector3(1, 1, 1))); fr.push(rim);
      const f = new T.CircleGeometry(.245, 32); f.applyMatrix4(new T.Matrix4().compose(M.clone().addScaledVector(n, .002), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), n), new T.Vector3(1, 1, 1))); faces.push(f);
      fr.push(segGeo(T, V(T, M.x, M.y + .2, M.z), V(T, M.x, H, M.z), .012, 6), xf(T, new T.CylinderGeometry(.08, .08, .03, 16), M.x, H - .02, M.z));
      hits.push(M.clone().addScaledVector(n, .01));
    }
    for (const p of [P[0], P[P.length - 1]]) fr.push(segGeo(T, V(T, p.x, p.y + .08, p.z), V(T, p.x, H, p.z), .012, 6), xf(T, new T.CylinderGeometry(.08, .08, .03, 16), p.x, H - .02, p.z));
    // Kristall am Ende mit hängendem, leicht nach vorn geneigtem Schild – zusammen anklickbar, erklärt den Lichtweg
    const PE = P[P.length - 1], gemG = new T.Group(); gemG.position.copy(PE); ctx.group.add(gemG);
    const gem = Mm(new T.OctahedronGeometry(.13, 0), crystalMat(.9)); gem.scale.set(1, 1.5, 1); gemG.add(gem);
    const SW = 1.4, SH = .56, SX = -.15, SY = -.68, TILT = .35;
    const sg = new T.Group(); sg.position.set(SX, SY, 0); sg.rotation.x = TILT; gemG.add(sg);
    const sgn = canvasPlane(ctx, SW, SH, 1024, Math.round(1024 * SH / SW)); sgn.position.z = .008; sg.add(sgn);
    sgn.userData.draw((c, W, Hh) => { panelBg(c, th, W, Hh, 26); txt(c, "Lichtweg über fünf Spiegel", W / 2, Hh * .24, 70, th.font, th.hi);
      txt(c, "An jedem Spiegel gilt:", W / 2, Hh * .54, 50, th.body, th.text, "center", 600); txt(c, "Einfallswinkel = Reflexionswinkel", W / 2, Hh * .77, 56, th.body, th.line, "center", 700); });
    fr.push(xf(T, new T.BoxGeometry(SW + .04, SH + .04, .014), PE.x + SX, PE.y + SY, PE.z, TILT, 0, 0));   // Rückplatte des Schilds
    const yTop = PE.y + SY + (SH / 2 + .02) * Math.cos(TILT), zTop = PE.z + (SH / 2 + .02) * Math.sin(TILT);
    for (const sx of [-.5, .5]) fr.push(segGeo(T, V(T, PE.x + SX + sx, yTop, zTop), V(T, PE.x + SX + sx, H, zTop), .007, 6), xf(T, new T.CylinderGeometry(.04, .04, .02, 12), PE.x + SX + sx, H - .01, zTop));
    ctx.group.add(Mm(mergeGeos(T, fr), FR), Mm(mergeGeos(T, faces), mirrorMat));
    const src = emitter(ctx, th, 1.1); src.position.copy(P[0]); src.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), P[1].clone().sub(P[0]).normalize()); ctx.group.add(src);
    const hp = new Float32Array(hits.length * 3); hits.forEach((h, i) => hp.set([h.x, h.y, h.z], i * 3));
    const hgeo = new T.BufferGeometry(); hgeo.setAttribute("position", new T.BufferAttribute(hp, 3));
    const hpts = new T.Points(hgeo, new T.PointsMaterial({color: th.beam, size: .5, map: R3D.util.glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false})); ctx.group.add(hpts);
    ray(ctx, P, th.beam, .011).alpha(.75);
    const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + P[i].distanceTo(P[i - 1]));
    const LT = cum[cum.length - 1], pulse = ctx.glow(th.beam, .45), pulse2 = ctx.glow(0xffffff, .16); ctx.group.add(pulse, pulse2);
    let tNow = 0, t0 = 0, boost = 0;   // Klick: Puls startet sofort neu an der Lichtquelle, größer und heller, die Auftreffpunkte leuchten auf
    ctx.tick((dt, t) => { tNow = t; const run = (t - t0) * 3.2, s = run % (LT + 3); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      if (boost > 0 && run > LT + 1.2) boost = Math.max(0, boost - dt * 1.5);
      const k = Math.min(1, (s - cum[i - 1]) / (cum[i] - cum[i - 1])); pulse.visible = pulse2.visible = s <= LT; pulse.position.copy(P[i - 1]).lerp(P[i], k); pulse2.position.copy(pulse.position);
      pulse.scale.setScalar(.45 + .45 * boost); pulse2.scale.setScalar(.16 + .14 * boost); hpts.material.size = .5 + .3 * boost;
      gem.rotation.y = t * .5; gem.material.emissiveIntensity = .9 + (s > LT && s < LT + 1.2 ? (1.6 + 1.2 * boost) * (1 - (s - LT) / 1.2) : 0); });
    ctx.exhibit(gemG, {label: "Lichtweg über fünf Spiegel", sub: "anklicken: Lichtpuls verfolgen", title: "Lichtweg über fünf Spiegel", pitch: .5, dist: 3.2,
      onClick: () => { t0 = tNow; boost = 1; },
      text: "Ein Lichtstrahl läuft von der Lichtquelle über fünf hängende Spiegel bis zum Kristall. An jedem Spiegel gilt das **Reflexionsgesetz**: Einfallswinkel = Reflexionswinkel, beide zum **Lot** gemessen.\n\nDeshalb ist jeder Spiegel genau so gedreht, dass sein Lot den Winkel zwischen ankommendem und weiterlaufendem Strahl halbiert."});
  }

  /* =================================================================
     Wandtafeln
     ================================================================= */
  // etwas höher als die anderen Tafeln: Die Rückwand von Exponat A steht davor und verdeckt sonst vom Gang aus die unterste Zeile
  ctx.wallBoard("left", 2.25, 3.9, 3.4, 2.0, "Das Reflexionsgesetz", ["Einfallswinkel = Reflexionswinkel", "Beide Winkel misst man zum Lot", "Lot: Senkrechte im Auftreffpunkt", "Strahlen und Lot liegen in einer Ebene", "Über dir: Lichtweg über fünf Spiegel"]);
  ctx.wallBoard("right", 6.75, 3.65, 3.2, 2.0, "Das Bild im ebenen Spiegel", ["virtuell – nicht auf einem Schirm auffangbar", "aufrecht und gleich groß", "genauso weit hinter dem Spiegel wie der Gegenstand davor", "vertauscht vorn und hinten"]);
  ctx.wallBoard("right", -2.25, 3.65, 3.4, 2.0, "Lichtbrechung", ["Luft → Wasser oder Glas: zum Lot hin", "Wasser oder Glas → Luft: vom Lot weg", "Senkrecht: keine Richtungsänderung", "optisch dünn → dicht: Luft, Wasser, Glas"]);
  ctx.wallBoard("left", -6.75, 3.65, 3.2, 2.0, "Totalreflexion", ["nur beim Übergang ins optisch dünnere Medium", "Einfallswinkel größer als der Grenzwinkel", "Grenzwinkel Glas → Luft: ca. 42°", "Grenzwinkel Wasser → Luft: ca. 49°", "Anwendung: Lichtleiter, Umlenkprisma"]);
};
})();
