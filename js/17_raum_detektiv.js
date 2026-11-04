/* ---------- 17_raum_detektiv.js ---------- */
/* =====================================================================
   Raumthemen der Welt „Detektei“: jeder Raum sieht aus wie sein Name (Leitbilder: RAUMTHEMEN.md)
   ---------------------------------------------------------------------
   AUFBAU
   • KIT.raum[key] beschreibt einen Raum (key = Raum-id, z. B. "strom1"). Gibt es keine Beschreibung (und immer in der Halle),
     bauen env/shell/ambient/decor genau wie bisher (12_detektiv.js, 15_dekor_detektiv.js).
   • Diese Datei hängt sich einmal vor KIT.env, KIT.shell und KIT.ambient (die alten Funktionen bleiben in KIT._raumAlt);
     KIT.decor (15_dekor_detektiv.js) fragt die Beschreibung selbst (RD.ausstattung) und reicht ihr die Bauhilfen KIT._d.
   • Jeder Teil läuft in KIT._h.versuch(): wirft er einen Fehler, wird alles zurückgenommen, was er in den Raum gelegt hat
     (Gruppe, Szene, Ticks, Hindernisse, Belegung), der Fehler per console.error gemeldet und der bisherige Teil gebaut.
     Scheitert die Hülle, bleibt ctx.huelle leer – Stimmung und Ausstattung nehmen dann ebenfalls den bisherigen Weg.

   FELDER EINER RAUMBESCHREIBUNG  KIT.raum[key] = {…}
   • titel                 – Name (nur zur Übersicht)
   • licht {…}             – Parameter für env (12_detektiv.js): bg, nebel, dichte (FogExp2), himmel [oben, unten, stärke],
                             umgebung [farbe, stärke], sonne [farbe, stärke, [x, y, z]] (wirft Schatten), fuell [farbe, stärke, [x, y, z]],
                             envTex () → Umgebungsbild für Spiegelungen (Equirect 512 × 256 wie das der Welt, sonst andere Shader).
                             Zahl und Art der Lichter sind fest (1 Hemisphere, 1 Ambient, 2 Directional, davon eines mit Schatten).
   • huelle(ctx, A) → {punkt, flackern}
                           – baut Boden, Wände, Decke, Fenster, Licht der Hülle in ctx.group. Muss ctx.floor setzen (eine waagrechte Fläche
                             bei y = 0 über den ganzen Raum: Ziel der Klicks zum Gehen). Höhe ist immer HOEHE = 6,5 m (die Räume hängen
                             Teile an y = 6,5 auf, siehe unten). Rückgabe: punkt = höchstens 3 Punktlichter [farbe, stärke, reichweite, x, y, z]
                             (fehlende werden dunkel aufgefüllt – jede Hülle hat genau 3, wie die alte: 2 Gaslampen + Kaminfeuer;
                             KEINE eigenen PointLights und nie ctx.light!), flackern(t, [l1, l2, l3]) = sanfte Lichtänderung je Bild.
                             A (Bauhilfen, siehe api()): G, B, WL (Wände), H, K (Sammler je Material), hu (= ctx.huelle),
                             belege(box) – Hüllenteile, die mehr als ~0,35 m in den Raum ragen (sie zählen sonst für ctx.frei() nicht),
                             hindernis(x, z, w, d) – am Boden stehende Teile (ctx.obstacleBox), lampe(v) – Lichtpunkt für Staub/Lichthof,
                             boden(mat, kachel), wandGeo(y0, y1, uvS, farbe(y), nurWände), decke(mat, kachel, y), mesh(geo, mat, o),
                             halos(punkte, farbe, größe), fertig([[schlüssel, material, {cast, color}] …]) – Sammler K zu Meshes
                             (jeder benutzte Schlüssel muss in fertig stehen, sonst fehlt er still). Hüllenteile dürfen ctx.frei/belege NICHT
                             aufrufen (die Belegung würde zu früh berechnet) – dafür A.belege, eingetragen nach den Lernstationen (afterBuild).
   • stimmung {…}          – Parameter für ambient: staub {n, farbe, groesse}, boden {n, mat}, dunst {n, mat}, hoch
   • pult: true            – die vier Stationen stehen als Stehpult mit Sturmlaterne statt als Schreibtisch da (Räume unter freiem Himmel;
                             station in 12_detektiv.js, gleiche Lage, Schilder und Klickfläche; nur wenn die eigene Hülle steht)
   • ausstattung(D)        – Möbel und Kleinteile (statt roomDecor in 15_dekor_detektiv.js), D = KIT._d: alle Bauhilfen der
                             Ausstattung (bx, cy, …, q, claim, FW, tryComp, barrel, crate, gasolier …) und D.st() = {K, BK, R, CTX, WL, TH …}.
                             Jeder Platz wird mit D.claim(D.q(…)) geprüft und belegt; Bodenmöbel mit floor = true (Hindernis).
                             Hilfen hier: felder(D) (Seitenwand-Felder, oben frei?), moebel(D, felder, menü) (Komponenten aus D.COMP, z. B.
                             D.COMP.t_kisten = (w, a) => ({b: [D.q(…)], build: F => …})), wandKlein, ecken, luft (Hängendes über dem Gang),
                             dekorMat(D) trägt eigene Materialschlüssel in D.KEYMAT ein (neue Schlüssel dort ergänzen, sonst fehlen die Teile).
   ctx.huelle = {thema, H, belegt: [], lampen: [], deckeY(x, z)} – deckeY liefert die Aufhängehöhe für Hängendes der Ausstattung
   (Lüster, Lampen); Standard ist HOEHE. ctx.decorZ = Lage der Pfeiler/Rippen an den Seitenwänden.

   REGELN (Kurzfassung, Einzelheiten im Auftrag/RAUM-API.md)
   • Türen z = ±11 (|x| < 2,3 bis 6,2 m Höhe frei, 2,4 m davor), Stationen und Exponat-Plätze frei, Gang |x| < 1,6 bis 3,2 m frei.
   • Seitenwände x = ±8: bei z ∈ {6,75; 2,25; −2,25; −6,75}, y 2,75–5,4 eine ebene senkrechte Fläche für die Tafeln;
     Pfeiler/Rippen bei z ∈ {9; 4,5; 0; −4,5; −9}.
   • Bei y = 6,5 über dem Gang muss etwas Festes sein (Decke, Balken, Träger): strom1 Kronleuchter (x 0, z 4,2), strom2 Stangen
     (x 0, z 8,05/4,7/1,45), optik1 Spiegel-Stangen über dem ganzen Gang (x −2,2…1,5), optik2 Lichtöffnung (x 0, z 3,6), kraft1 Orrery
     (x 0, z 6,2), kraft2 Schild (x 0, z −1,5) und Federlampen über dem Gang. Darüber darf der Raum offen sein (Gewölbe, Himmel).
   • Licht immer gleich viele: siehe licht/huelle. Animationen sanft (nichts schneller als 3 Hz, keine Blitze/Strobo).
   • Sparsam: je Material ein Mesh (Sammler K), Wiederholungen als InstancedMesh, Texturen ≤ 1024² einmal anlegen (Schlüssel "r17-…").

   WEITERE RÄUME: beweg1, beweg2, kraft1, kraft2 stehen je in 17_raum_detektiv_<raum>.js; Hilfen für Räume unter freiem Himmel
   (Himmelskugel, Fernsicht, Bäume aus Ästen und Laubkarten, Laternen, Lattenzaun, Stäbe) in 17_raum_detektiv_aussen.js → KIT.raum17.aussen.
   NEUEN RAUM ERGÄNZEN: eigene Datei 17_raum_detektiv_<raum>.js (lädt nach dieser Datei):
     (() => { const KIT = window.R3D && R3D.kits.detektiv; if (!KIT || !KIT.raum17) return; const {…} = KIT.raum17;
       KIT.raum.kraft2 = {titel: "…", licht: {…}, huelle: (ctx, A) => {…; return {punkt: […]};}, stimmung: {…}, ausstattung: D => {…}}; })();
   KIT.raum17 enthält die Hilfen dieser Datei (Texturen TX, Materialien mt, ctex, ziegel/bohlen/platten, birne, kaefigLampe, fass,
   laterne, birnenkette, zerrSpiegel, brilleK, felder, moebel, wandKlein, ecken, luft, dekorMat, werkbank, trommel, teileRegal …).
   Beispiele: Gewölbe über Träger (strom2: keller), Zeltdach mit Birnenbögen (optik1), Schaufenster mit Blick nach draußen (optik2).
   Für Räume unter freiem Himmel: licht.bg als Himmelsfarbe, huelle baut statt der Decke eine Himmelskuppel (MeshBasic, fog: false)
   und darunter bei 6,5 m über dem Gang ein Tragwerk (Pergola, Kranausleger, Ast …); statt Wänden Zaun/Mauer/Tribüne mit ebenen
   Brettern an x = ±8 für die Tafeln; deckeY(x, z) liefert dann die Unterkante des Tragwerks.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D, KIT = R3D && R3D.kits && R3D.kits.detektiv;
if (!T3 || !KIT || !KIT._h || !KIT._h.versuch) return;
const H_ = KIT._h, {U, TAU, M, bucket, walls, mat, kmat, tex, cache, keep, S, KB, flat, versuch, FONT} = H_;
const PI = Math.PI, V3 = (x, y, z) => new T3.Vector3(x, y, z);
const HOEHE = 6.5;   // ctx.height in allen Räumen der Welt
const RAUM = KIT.raum = KIT.raum || {};

/* ---------- Einbindung (einmal): env, shell, ambient fragen die Raumbeschreibung ---------- */
if (!KIT._raumAlt) {
  const alt = KIT._raumAlt = {env: KIT.env, shell: KIT.shell, ambient: KIT.ambient};
  const rd = ctx => ctx.key !== "halle" && RAUM[ctx.key];
  KIT.env = (ctx, sc) => { const R = rd(ctx); if (!R || !R.licht) return alt.env(ctx, sc);
    return versuch(ctx, sc, "Licht", () => alt.env(ctx, sc, R.licht), () => alt.env(ctx, sc)); };
  KIT.shell = (ctx, o) => { const R = rd(ctx); if (o.hall || !R || !R.huelle) return alt.shell(ctx, o);
    return versuch(ctx, null, "Hülle", () => huelle(ctx, R), () => alt.shell(ctx, o)); };
  KIT.ambient = (ctx, sc) => { const R = ctx.huelle && ctx.huelle.thema && rd(ctx); if (!R) return alt.ambient(ctx, sc);
    return versuch(ctx, sc, "Stimmung", () => alt.ambient(ctx, sc, R.stimmung || {}), () => alt.ambient(ctx, sc)); };
  // Hüllenteile, die in den Raum ragen, für ctx.frei() belegen: nach den Lernstationen (05–07), vor der Lehrkraft-Tafel und der Ausstattung
  R3D.hooks.afterBuild.push(room => { const c = room.ctx, hu = c && c.huelle; if (room.isHall || !hu || !hu.thema || c.world !== "detektiv") return;
    for (const b of hu.belegt) c.belege({x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, z0: b.z0, z1: b.z1}); });
}

function huelle(ctx, R){
  const G = ctx.group, n0 = G.children.length, B = ctx.bounds;
  ctx.decorZ = [9, 4.5, 0, -4.5, -9]; ctx.floor = null;
  const hu = ctx.huelle = {thema: ctx.key, H: HOEHE, belegt: [], lampen: [], deckeY: null};
  cache(ctx).lamps = hu.lampen;   // Staub im Lampenlicht (ambient)
  const A = api(ctx, hu), out = R.huelle(ctx, A) || {};
  if (!ctx.floor) throw new Error("Hülle ohne ctx.floor");
  // genau drei Punktlichter wie die bisherige Hülle (Shader-Programme der Welt bleiben dieselben)
  const pl = (out.punkt || []).slice(0, 3); while (pl.length < 3) pl.push([0x000000, 0, .01, 0, -30, 0]);
  const PL = pl.map(([c, i, d, x, y, z]) => { const l = new T3.PointLight(c, i, d, 2); l.position.set(x, y, z); l.userData.i0 = i; G.add(l); return l; });
  let n = 0; for (const o of G.children.slice(n0)) o.traverse(m => { if (m.isLight) n++; });
  if (n !== 3) throw new Error(`Hülle ${ctx.key}: ${n} Lichter statt 3`);
  if (out.flackern) ctx.tick((dt, t) => out.flackern(t, PL));
  hu.licht = PL; return HOEHE;
}

/* ---------- Bauhilfen der Hülle ---------- */
function api(ctx, hu){
  const G = ctx.group, B = ctx.bounds, WL = walls(B), K = bucket();
  const A = {G, B, WL, H: HOEHE, K, hu,
    belege: b => { hu.belegt.push(b); return b; },
    hindernis: (x, z, w, d) => ctx.obstacleBox(x, z, w, d),
    lampe: v => { hu.lampen.push(v); return v; },
    boden(m, kachel = 2){ const f = flat(B.x1 - B.x0, B.z0 - B.z1, m, (B.x1 - B.x0) / kachel, (B.z0 - B.z1) / kachel); f.position.set((B.x0 + B.x1) / 2, 0, (B.z0 + B.z1) / 2); G.add(f); ctx.floor = f; return f; },
    decke(m, kachel = 2, y = HOEHE){ const W = B.x1 - B.x0, D = B.z0 - B.z1, c = new T3.Mesh(U.scaleUV(new T3.PlaneGeometry(W, D), W / kachel, D / kachel), m);
      c.rotation.x = PI / 2; c.position.set((B.x0 + B.x1) / 2, y, (B.z0 + B.z1) / 2); c.receiveShadow = true; G.add(c); return c; },
    // alle vier Wände als eine Geometrie, uvS = Meter je Texturkachel; farbe(y) → [r, g, b] als Farbverlauf (Ruß oben, Feuchte unten)
    wandGeo(y0, y1, uvS, farbe, nur){ const parts = Object.entries(WL).filter(([k]) => !nur || nur.includes(k)).map(([, w]) => ({geo: new T3.PlaneGeometry(w.len, y1 - y0, 1, 8), m: w.m(0, (y0 + y1) / 2, 0), uv: [w.len / uvS, (y1 - y0) / uvS]}));
      const g = H_.merge(parts); if (farbe) { const p = g.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) c.set(farbe(p.getY(i)), i * 3); g.setAttribute("color", new T3.BufferAttribute(c, 3)); }
      return g; },
    mesh(geo, m, o = {}){ const me = new T3.Mesh(geo, m); me.castShadow = !!o.cast; me.receiveShadow = o.receive !== false; if (o.order) me.renderOrder = o.order; G.add(me); return me; },
    fertig(ms){ for (const [k, m, o] of ms) K.mesh(k, typeof m === "function" ? m() : m, Object.assign({parent: G}, o || {})); },
    halos(list, col = 0xffd9a0, size = .6){ if (!list.length) return null; const p = new Float32Array(list.length * 3); list.forEach((v, i) => p.set([v.x, v.y, v.z], i * 3));
      const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(p, 3));
      const pts = new T3.Points(g, new T3.PointsMaterial({map: U.glowTex(), color: col, size, transparent: true, opacity: .85, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}));
      pts.renderOrder = 3; pts.userData.noPick = true; G.add(pts); return pts; }
  };
  return A;
}

/* ---------- Materialien und Texturen (einmal angelegt, userData.keep) ---------- */
const MT = new Map(), mt = (k, f) => MT.get(k) || (MT.set(k, keep(f())), MT.get(k));
const tk = t => { t.userData.keep = true; return t; };
const ctex = (w, h, key, draw, rep) => tk(U.canvasTex(w, h, (g, W, Hh) => draw(g, W, Hh, U.seeded([...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17))), "r17-" + key, rep));
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
function speck(g, r, w, h, n, a, cols){ for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.globalAlpha = a * r(); const s = .8 + r() * 2.2; g.fillRect(r() * w, r() * h, s, s); } g.globalAlpha = 1; }
function blob(g, x, y, rx, ry, col){ const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, "0)"));
  g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore(); }
// Ziegelmauer: 10 Steine je Breite, 32 Schichten (Textur = 2,4 × 2,4 m), nahtlos kachelbar
function ziegel(g, w, h, r, o){
  g.fillStyle = o.fuge; g.fillRect(0, 0, w, h); speck(g, r, w, h, 3000, .25, ["#000", "#fff"]);
  const nx = 10, ny = 32, bw = w / nx, bh = h / ny, [hu, sa, li] = o.stein;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = (i - (j % 2) * .5) * bw, y = j * bh, k = r(), L = li + (r() - .5) * o.var - (k < .1 ? 9 : 0) + (k > .94 ? 7 : 0), c = hsl(hu + (r() - .5) * 9, sa + (r() - .5) * 12, L);
    const spots = [...Array(7)].map(() => [r(), r(), r() < .5]);
    for (const dx of x < 0 ? [0, w] : [0]) { const X = x + dx;
      g.fillStyle = c; g.fillRect(X + 1.6, y + 1.6, bw - 3.2, bh - 3.2);
      g.fillStyle = "rgba(255,225,190,.10)"; g.fillRect(X + 1.6, y + 1.6, bw - 3.2, 1.6); g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(X + 1.6, y + bh - 3.4, bw - 3.2, 1.8);
      for (const [a, b, d] of spots) { g.fillStyle = d ? "rgba(0,0,0,.16)" : "rgba(255,220,180,.12)"; g.fillRect(X + 3 + a * (bw - 8), y + 3 + b * (bh - 7), 2.5, 2); } }
  }
  if (o.extra) o.extra(g, w, h, r);
}
// Bohlenboden / Bretter: n Bretter je Breite, Stöße versetzt, Maserung, Nägel, Flecken
function bohlen(g, w, h, r, o){
  const n = o.n, pw = w / n;
  for (let i = 0; i < n; i++) {
    const cuts = [r() * h]; if (r() < .8) cuts.push((cuts[0] + h * (.3 + r() * .4)) % h); cuts.sort((a, b) => a - b);
    cuts.forEach((y0, k) => { const y1 = k + 1 < cuts.length ? cuts[k + 1] : cuts[0] + h, [hu, sa, li] = o.holz, c = hsl(hu + (r() - .5) * 6, sa + (r() - .5) * 10, li + (r() - .5) * 8);
      const seg = (a, b) => { g.fillStyle = c; g.fillRect(i * pw, a, pw, b - a); }; seg(y0, Math.min(y1, h)); if (y1 > h) seg(0, y1 - h);
      for (let q = 0; q < 16; q++) { g.strokeStyle = `rgba(${r() < .6 ? "20,10,4" : "255,225,190"},${.04 + r() * .08})`; g.lineWidth = .8 + r() * 1.5; const x0 = i * pw + 4 + r() * (pw - 8), ph = r() * TAU; g.beginPath();
        for (let y = y0; y <= y1; y += 16) { const x = x0 + Math.sin(y / 60 + ph) * 2.5, yy = y % h; if (y === y0 || yy < 16) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); }
      g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(i * pw, y0 % h, pw, 2.5); g.fillStyle = "rgba(15,8,4,.75)"; for (const nx of [i * pw + 7, (i + 1) * pw - 10]) g.fillRect(nx, (y0 + 7) % h, 3, 3); });
    g.fillStyle = "rgba(0,0,0,.65)"; g.fillRect(i * pw, 0, 2.5, h); g.fillStyle = "rgba(255,225,190,.06)"; g.fillRect(i * pw + 2.5, 0, 2, h);
  }
  if (o.extra) o.extra(g, w, h, r);
}
const TX = {
  // Werkstatt: rote Ziegel, Fugen hell · Bohlen hell-abgetreten mit Ölflecken und Sägemehl
  ziegelRot: () => ctex(512, 512, "ziegel-rot", (g, w, h, r) => ziegel(g, w, h, r, {fuge: "#b9ab98", stein: [12, 46, 36], var: 12}), [1, 1]),
  bohlen: () => ctex(1024, 1024, "bohlen", (g, w, h, r) => bohlen(g, w, h, r, {n: 12, holz: [28, 26, 33], extra: (g, w, h, r) => {
    for (let i = 0; i < 9; i++) blob(g, r() * w, r() * h, 30 + r() * 60, 20 + r() * 40, "rgba(20,14,8,.35)");
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(230,200,150,${r() * .25})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }}), [1, 1]),
  bretterDecke: () => ctex(512, 512, "bretter-decke", (g, w, h, r) => bohlen(g, w, h, r, {n: 6, holz: [34, 16, 66]}), [1, 1]),   // gekalkte Bretter
  // Werkzeugwand: grün gestrichene Lochplatte mit gemalten Umrissen und Werkzeugen (Textur = 4 × 2 m)
  werkzeug: () => ctex(1024, 512, "werkzeug", (g, w, h, r) => {
    g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 128) { g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x, 0, 2, h); }
    g.fillStyle = "rgba(10,20,14,.7)"; for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill(); }
    const umriss = (f) => { g.save(); g.strokeStyle = "rgba(235,235,220,.85)"; g.lineWidth = 7; g.lineJoin = "round"; f(true); g.restore(); f(false); };
    const steel = "#9aa0a4", dark = "#3a3c3e", wood = "#a8743c", red = "#a8261c";
    // Schraubendreher
    for (let i = 0; i < 6; i++) { const x = 40 + i * 30, L = 150 - i * 10; umriss(o => { if (o) { g.strokeRect(x - 7, 40, 14, 60); g.beginPath(); g.moveTo(x, 100); g.lineTo(x, 100 + L - 60); g.stroke(); }
      else { g.fillStyle = i % 2 ? red : "#c9a040"; g.fillRect(x - 7, 40, 14, 60); g.fillStyle = steel; g.fillRect(x - 2.5, 100, 5, L - 60); } }); }
    // Hämmer
    for (let i = 0; i < 3; i++) { const x = 260 + i * 60, s = 1 - i * .15; umriss(o => { if (o) { g.strokeRect(x - 5, 50, 10, 170 * s); g.strokeRect(x - 26 * s, 40, 52 * s, 22 * s); }
      else { g.fillStyle = wood; g.fillRect(x - 5, 50, 10, 170 * s); g.fillStyle = dark; g.fillRect(x - 26 * s, 40, 52 * s, 22 * s); } }); }
    // Säge
    umriss(o => { g.beginPath(); g.moveTo(470, 60); g.lineTo(700, 70); g.lineTo(700, 120); g.lineTo(470, 150); g.closePath(); if (o) g.stroke(); else { g.fillStyle = steel; g.fill(); g.fillStyle = dark;
      for (let x = 472; x < 700; x += 9) { const yb = 150 - (x - 470) / 230 * 30; g.beginPath(); g.moveTo(x, yb); g.lineTo(x + 4.5, yb + 7); g.lineTo(x + 9, yb); g.fill(); }
      g.fillStyle = wood; g.beginPath(); g.roundRect(400, 70, 76, 74, 16); g.fill(); g.fillStyle = "#2f4a3a"; g.beginPath(); g.roundRect(418, 88, 40, 36, 10); g.fill(); } });
    // Zangen mit roten Griffen
    for (let i = 0; i < 3; i++) { const x = 760 + i * 70; umriss(o => { g.save(); g.translate(x, 60); for (const s of [-1, 1]) { g.save(); g.rotate(s * .12);
      if (o) { g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 170); g.stroke(); } else { g.fillStyle = dark; g.fillRect(-5, 0, 10, 60); g.fillStyle = red; g.fillRect(-7, 60, 14, 110); } g.restore(); } g.restore(); }); }
    // Schraubenschlüssel der Größe nach
    for (let i = 0; i < 8; i++) { const x = 60 + i * 52, L = 200 - i * 14, y = 280; umriss(o => { if (o) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + L); g.stroke(); }
      else { g.fillStyle = steel; g.fillRect(x - 6, y, 12, L); for (const yy of [y, y + L]) { g.beginPath(); g.arc(x, yy, 15 - i * .8, 0, TAU); g.fill(); g.fillStyle = "#2f4a3a"; g.fillRect(x - 5, yy - (yy === y ? 16 : -2), 10, 14); g.fillStyle = steel; } } }); }
    // Drahtrollen (Kupfer) und Gliedermaßstab
    for (let i = 0; i < 3; i++) { const x = 560 + i * 110, y = 330; g.strokeStyle = "rgba(235,235,220,.8)"; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 44, 0, TAU); g.stroke();
      for (let k = 0; k < 9; k++) { g.strokeStyle = k % 2 ? "#b8693c" : "#d48a50"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 30 + k * 1.6, 0, TAU); g.stroke(); }
      g.fillStyle = dark; g.beginPath(); g.arc(x, y - 52, 5, 0, TAU); g.fill(); }
    g.fillStyle = "#e0c040"; for (let k = 0; k < 6; k++) { g.save(); g.translate(890 + (k % 2) * 10, 250 + k * 34); g.rotate(k % 2 ? -.3 : .3); g.fillRect(-40, -6, 80, 12); g.restore(); }
    // Bohrwinde
    g.strokeStyle = dark; g.lineWidth = 8; g.beginPath(); g.moveTo(470, 260); g.lineTo(470, 300); g.lineTo(520, 330); g.lineTo(470, 360); g.lineTo(470, 440); g.stroke(); g.fillStyle = wood; g.fillRect(458, 236, 24, 26);
    speck(g, r, w, h, 4000, .12, ["#000", "#fff"]);
  }),
  // Schaltplan auf Blaupause
  schaltplan: () => ctex(512, 384, "schaltplan", (g, w, h, r) => {
    g.fillStyle = "#1d3f78"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = "#eef4ff"; g.fillStyle = "#eef4ff"; g.lineWidth = 3; g.strokeRect(12, 12, w - 24, h - 24);
    g.font = `700 26px ${FONT}`; g.textAlign = "center"; g.fillText("Schaltplan", w / 2, 48);
    g.lineWidth = 3; g.beginPath(); g.moveTo(80, 110); g.lineTo(440, 110); g.lineTo(440, 320); g.lineTo(80, 320); g.closePath(); g.stroke();
    g.fillStyle = "#1d3f78"; g.fillRect(64, 190, 32, 50); g.fillStyle = "#eef4ff"; g.fillRect(66, 200, 28, 4); g.fillRect(72, 222, 16, 4);   // Batterie
    g.fillStyle = "#1d3f78"; g.beginPath(); g.arc(260, 110, 24, 0, TAU); g.fill(); g.beginPath(); g.arc(260, 110, 24, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(243, 93); g.lineTo(277, 127); g.moveTo(277, 93); g.lineTo(243, 127); g.stroke();   // Lampe
    g.fillStyle = "#1d3f78"; g.fillRect(420, 180, 40, 70); g.strokeRect(426, 180, 28, 70);   // Widerstand
    g.fillRect(200, 304, 70, 32); g.beginPath(); g.moveTo(200, 320); g.lineTo(262, 298); g.stroke();   // Schalter
    for (const [x, y, s] of [[150, 320, "A"], [350, 320, "V"]]) { g.fillStyle = "#1d3f78"; g.beginPath(); g.arc(x, y, 20, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#eef4ff"; g.font = `700 22px ${FONT}`; g.fillText(s, x, y + 8); }
    speck(g, r, w, h, 1500, .1, ["#fff", "#000"]);
  }),
  // Hinterhof hinter dem Werkstattfenster: Ziegelwand gegenüber, Laterne, Abendnebel
  hinterhof: () => ctex(512, 512, "hinterhof", (g, w, h, r) => {
    const sky = g.createLinearGradient(0, 0, 0, h * .4); sky.addColorStop(0, "#2a3442"); sky.addColorStop(1, "#6a6458"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = "#2a2220"; g.fillRect(0, h * .28, w, h); for (let y = h * .28; y < h; y += 9) for (let x = ((y / 9) % 2) * 14; x < w; x += 28) { g.fillStyle = hsl(12, 30, 18 + r() * 8); g.fillRect(x + 1, y + 1, 26, 7); }
    for (let i = 0; i < 4; i++) { const x = 40 + i * 120, y = h * .38; g.fillStyle = "#14100e"; g.fillRect(x - 4, y - 4, 72, 104); const lit = i === 1 || i === 3; g.fillStyle = lit ? "#e8b060" : "#1c2228"; g.fillRect(x, y, 64, 96);
      if (lit) blob(g, x + 32, y + 48, 90, 90, "rgba(255,200,120,.35)"); g.fillStyle = "#14100e"; g.fillRect(x + 30, y, 4, 96); g.fillRect(x, y + 46, 64, 4); }
    blob(g, w * .5, h * .78, 170, 120, "rgba(255,220,150,.55)"); g.fillStyle = "#101010"; g.fillRect(w * .5 - 3, h * .74, 6, h * .3); g.fillStyle = "#fff0c0"; g.fillRect(w * .5 - 8, h * .7, 16, 18);
    const fog = g.createLinearGradient(0, h * .4, 0, h); fog.addColorStop(0, "rgba(180,180,170,0)"); fog.addColorStop(1, "rgba(180,176,166,.6)"); g.fillStyle = fog; g.fillRect(0, 0, w, h);
  })
};

/* ---------- Gemeinsame Bausteine der Hüllen ---------- */
// Glühbirne mit Kohlefaden: Fassung, Glaskolben (leuchtend), wahlweise Emailleschirm; liefert die Lage des Leuchtpunkts
function birne(K, x, y, z, schirm){
  K.add("messing", new T3.CylinderGeometry(.03, .035, .07, 10), M(x, y + .035, z));
  K.add("birne", new T3.LatheGeometry([[0, -.13], [.035, -.115], [.055, -.07], [.05, -.03], [.025, 0]].map(([a, b]) => new T3.Vector2(a, b)), 12), M(x, y, z));
  if (schirm) { K.add("email", new T3.CylinderGeometry(.06, .26, .14, 18, 1, true), M(x, y + .02, z)); K.add("emailI", new T3.CylinderGeometry(.058, .255, .135, 18, 1, true), M(x, y + .018, z, PI)); }
  return V3(x, y - .07, z);
}
const ST = {   // Standardmaterialien der Hüllen
  birne: () => mt("birne", () => new T3.MeshStandardMaterial({color: 0xfff4d8, emissive: 0xffc870, emissiveIntensity: 2.4, roughness: .3})),
  email: () => mt("email", () => new T3.MeshStandardMaterial({color: 0x2f4a3a, roughness: .35, metalness: .2})),
  emailI: () => mt("emailI", () => new T3.MeshStandardMaterial({color: 0xf2efe6, emissive: 0xffe2b0, emissiveIntensity: .35, roughness: .4, side: T3.BackSide})),
  porzellan: () => mt("porzellan", () => new T3.MeshStandardMaterial({color: 0xf0ece2, roughness: .25})),
  kabel: () => mt("kabel", () => new T3.MeshStandardMaterial({color: 0x1a1612, roughness: .7})),
  eisen: () => kmat("iron"), messing: () => mat("brass"), dunkel: () => mat("darkwood"), holz: () => mat("wood"), kupfer: () => mat("copper"),
  glas: () => mt("glas", () => new T3.MeshStandardMaterial({color: 0xdde8ec, transparent: true, opacity: .2, roughness: .05, metalness: .2, depthWrite: false})),
  vc: () => kmat("vc")
};

/* =====================================================================
   strom1 · Werkstatt des Elektrikers
   Ziegelwände, Bretterdecke auf schweren Balken, Ständer mit Kopfbändern, Kabelkanal mit Porzellanisolatoren,
   nackte Glühbirnen an Schnüren, Werkzeugwand und Fenster zum Hinterhof an der Stirnwand; gelbliches Licht.
   Ausstattung: Werkbänke mit Schraubstock, Kabeltrommeln, Teileregale, Influenzmaschine, Fabrikfenster, Schaltplan.
   ===================================================================== */
function werkstatt(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ;
  A.hu.deckeY = (x, z) => P.some(p => Math.abs(z - p) < .2) ? H - .36 : H;   // Hängendes an Balken oder Bretterdecke
  A.boden(mt("ws-boden", () => S({map: TX.bohlen(), roughness: .82})), 3.2);
  // Ziegelwände: oben verrußt, unten ein dunkler Sockel
  A.mesh(A.wandGeo(0, H, 2.4, y => { const k = y < .4 ? .55 : 1 - Math.max(0, y - 4.4) * .12; return [k, k * .97, k * .95]; }), mt("ws-ziegel", () => S({map: TX.ziegelRot(), vertexColors: true, roughness: .92})));
  // Bretterdecke auf Balken, Wandpfetten, Ständer mit Fußstein und Kopfbändern
  A.decke(mt("ws-decke", () => S({map: TX.bretterDecke(), color: 0xe8e0d0, emissive: 0x3a3028, emissiveIntensity: .35, roughness: .95})), 3.2);
  for (const z of P) K.box("balken", 16, .36, .3, M(0, H - .18, z));
  for (const s of [-1, 1]) { K.box("balken", .26, .3, 22, M(s * 7.87, H - .15, 0));
    for (const z of P) { const x = s * 7.86; K.box("balken", .28, H - .36, .28, M(x, (H - .36) / 2, z)); K.box("stein", .4, .22, .4, M(x, .11, z));
      const a = PI / 4, L = 1.45; K.box("balken", .16, L, .16, M(s * (7.72 - L * Math.sin(a) / 2), H - .36 - L * Math.cos(a) / 2 + .02, z, 0, 0, s * a));
      A.hindernis(s * 7.8, z, .42, .42); A.belege(ctx.wand(s < 0 ? "left" : "right", z, 0, H, .5, .36)); A.belege(ctx.wand(s < 0 ? "left" : "right", z, H - 1.5, H, .3, 1.25)); } }
  // Freileitungen unter der Decke: von Balken zu Balken durchhängend, auf Porzellanisolatoren
  for (const x of [-2.6, -2.45, 2.45, 2.6]) for (let i = 0; i < P.length - 1; i++) { const z0 = P[i], z1 = P[i + 1], y = H - .44, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(V3(x, y - .2 * 4 * t * (1 - t), z0 + (z1 - z0) * t)); }
    K.add("kabel", new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 10, .011, 4), M()); K.add("porzellan", new T3.CylinderGeometry(.028, .034, .08, 8), M(x, H - .4, z0));
    if (i === P.length - 2) K.add("porzellan", new T3.CylinderGeometry(.028, .034, .08, 8), M(x, H - .4, z1)); }
  // Kabelkanal mit Porzellanisolatoren über den Tafeln, senkrechte Abzweige an jedem Ständer zu einem Drehschalter
  for (const s of [-1, 1]) { const x = s * 7.95, yk = 5.78;
    K.box("holz", .07, .12, 21.4, M(x, yk, 0)); for (let z = -10.4; z <= 10.41; z += .65) K.add("porzellan", new T3.CylinderGeometry(.025, .032, .07, 8), M(x - s * .07, yk + .09, z, 0, 0, s * PI / 2));
    for (const dy of [.07, .11]) K.box("kabel", .018, .018, 21, M(x - s * .1, yk + dy, 0));
    for (const z of P) { const zz = z + (z > 0 ? -.24 : .24), xc = s * 7.72;
      K.box("kabel", .02, yk - 1.55, .02, M(xc + s * .02, (yk + 1.55) / 2, zz)); K.box("vc", .12, .16, .07, M(xc - s * .015, 1.48, zz), {c: "#2a2420"}); K.add("porzellan", new T3.CylinderGeometry(.045, .05, .05, 12), M(xc - s * .07, 1.48, zz, 0, 0, s * PI / 2)); } }
  // Glühbirnen an Schnüren, an den Balken über den Seitengängen
  P.forEach((z, i) => { for (const s of [-1, 1]) { const x = s * 4.1, y = 4.85 + (i % 2) * .25;
    K.box("kabel", .012, H - .36 - y - .05, .012, M(x, (H - .36 + y + .05) / 2, z + .19)); A.lampe(birne(K, x, y, z + .19, (i + (s > 0 ? 1 : 0)) % 2 === 0));
    A.belege({x0: x - .3, x1: x + .3, y0: y - .25, y1: H, z0: z - .2, z1: z + .45}); } });
  // Käfigleuchten an zwei Ständern (dort sitzen die Punktlichter)
  for (const [s, z] of [[-1, 4.5], [1, -4.5]]) { const x = s * 7.72, y = 3.45;
    K.box("eisen", .3, .04, .04, M(x - s * .15, y + .12, z)); K.add("messing", new T3.CylinderGeometry(.045, .05, .08, 10), M(x - s * .3, y + .06, z));
    A.lampe(birne(K, x - s * .3, y, z, false)); for (const yy of [-.02, -.1]) K.add("eisen", new T3.TorusGeometry(.075, .006, 4, 12), M(x - s * .3, y + yy, z, PI / 2));
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; K.box("eisen", .008, .17, .008, M(x - s * .3 + Math.cos(a) * .075, y - .06, z + Math.sin(a) * .075)); } }
  // Stirnwand: Werkzeugwand links der Tür, Fenster zum Hinterhof rechts; Rückwand gespiegelt (Werkzeugwand rechts, Fenster links)
  for (const [w, sx] of [[WL.front, 1], [WL.back, -1]]) {
    const xt = -sx * 5.2, xf = sx * 5.15, zW = w === WL.front ? B.z1 : B.z0, n = w === WL.front ? 1 : -1, u = x => w.u(x, zW);
    K.add("werkzeug", new T3.PlaneGeometry(4.6, 2.3), w.m(u(xt), 2.05, .025), {uv: [1, 1]});
    for (const yy of [.88, 3.22]) K.box("dunkel", 4.75, .08, .06, w.m(u(xt), yy, .03)); for (const dx of [-2.34, 2.34]) K.box("dunkel", .08, 2.42, .06, w.m(u(xt + dx), 2.05, .03));
    // Fenster: Sprossen aus Eisen, Fensterbank
    const fw = 4.0, y0 = 2.5, y1 = 5.6;
    K.add("hof", new T3.PlaneGeometry(fw, y1 - y0), w.m(u(xf), (y0 + y1) / 2, .01));
    for (let k = 0; k <= 5; k++) K.box("eisen", .05, y1 - y0, .06, w.m(u(xf - fw / 2 + k * fw / 5), (y0 + y1) / 2, .04));
    for (let k = 0; k <= 4; k++) K.box("eisen", fw, .05, .06, w.m(u(xf), y0 + k * (y1 - y0) / 4, .04));
    K.box("stein", fw + .3, .08, .28, w.m(u(xf), y0 - .04, .14)); K.box("stein", fw + .3, .14, .1, w.m(u(xf), y1 + .07, .05));
    K.add("glasS", new T3.PlaneGeometry(fw, y1 - y0), w.m(u(xf), (y0 + y1) / 2, .045));
    // Hauptschalter mit Hebel neben der Tür
    K.box("vc", .5, .7, .12, w.m(u(sx * 2.85), 1.9, .06), {c: "#3a3430"}); K.box("porzellan", .36, .5, .02, w.m(u(sx * 2.85), 1.9, .13)); K.box("messing", .04, .3, .04, w.m(u(sx * 2.85), 2.0, .18, -.5));
    K.box("kabel", .03, 4.0, .03, w.m(u(sx * 2.85), 4.25, .04));
  }
  A.fertig([["balken", ST.dunkel, {cast: true}], ["stein", () => mt("ws-stein", () => S({color: 0x8a8478, roughness: .9}))], ["holz", ST.holz], ["porzellan", ST.porzellan], ["kabel", ST.kabel],
    ["vc", ST.vc, {color: true}], ["messing", ST.messing], ["eisen", ST.eisen], ["birne", ST.birne, {receive: false}], ["email", ST.email], ["emailI", ST.emailI],
    ["werkzeug", () => mt("ws-wz", () => S({map: TX.werkzeug(), roughness: .8}))], ["hof", () => mt("ws-hof", () => KB({map: TX.hinterhof(), color: 0xb0aca4, toneMapped: false}))],
    ["glasS", ST.glas, {receive: false}], ["dunkel", ST.dunkel]]);
  A.halos(A.hu.lampen, 0xffd890, .7);
  return {punkt: [[0xffd08a, 6.5, 13, -6.95, 3.3, 4.5], [0xffd08a, 6.5, 13, 6.95, 3.3, -4.5], [0xffe2a8, 4, 10, -5.2, 2.6, -9.8]],
    flackern: (t, L) => L.forEach((l, i) => { l.intensity = l.userData.i0 * (.97 + .03 * Math.sin(t * 1.7 + i * 2.1)); })};
}

/* ---------- Ausstattung: Bauteile (lokaler Rahmen F: x entlang der Wand, y oben, z in den Raum) ---------- */
function werkbank(D, F, x, W, o = {}){   // Werkbank: dicke Platte, Beine, Ablage, Schraubstock, Werkzeug, Drahtrollen
  const {bx, cy, tor, rod, sp} = D, T = .75;
  bx("wood", W, .07, T, F.m(x, .885, T / 2)); bx("dark", W - .04, .05, T - .1, F.m(x, .82, T / 2));
  for (const sx of [-1, 1]) for (const z of [.08, T - .08]) bx("dark", .08, .82, .08, F.m(x + sx * (W / 2 - .08), .41, z));
  bx("dark", W - .2, .03, T - .2, F.m(x, .22, T / 2)); bx("dark", W - .2, .1, .03, F.m(x, .6, .05));
  // Schraubstock am Ende
  const vx = x + (o.links ? -1 : 1) * (W / 2 - .22);
  bx("iron", .2, .14, .16, F.m(vx, .99, T - .1)); bx("iron", .2, .14, .05, F.m(vx, .99, T + .03)); cy("steel", .016, .016, .34, 6, F.m(vx, .97, T + .1, PI / 2)); cy("steel", .012, .012, .26, 6, F.m(vx, .97, T + .26, 0, 0, PI / 2));
  // Kleinteile: Hammer, Drahtrollen, Kiste, Lötkolben, Ölkanne
  bx("wood", .3, .03, .04, F.m(x - .2, .935, T * .6, 0, .4)); bx("iron", .05, .05, .12, F.m(x - .33, .945, T * .66, 0, .4));
  for (let i = 0; i < 2; i++) tor("copper", .09, .03, 6, 16, F.m(x + .15 + i * .24, .94, T * .45, PI / 2));
  bx("vc", .44, .2, .24, F.m(x - W / 2 + .4, 1.02, .22), "#7a2a1e"); bx("vc", .46, .03, .26, F.m(x - W / 2 + .4, 1.135, .22), "#5a1a14");
  cy("vc", .05, .06, .14, 10, F.m(x + .55, .99, .25), "#2a3a2a"); D.cone("vc", .02, .1, 6, F.m(x + .55, 1.1, .25), "#2a3a2a");
  rod("dark", F, [x - .05, .93, .2], [x + .2, .93, .32], .012); cy("copper", .01, .006, .1, 6, F.m(x + .26, .93, .35, 0, 0, PI / 2));
  if (o.messer !== false) D.galvanometer(F, x + .45, .92, T * .65);
}
function lochwand(D, F, x, y, W, Hh){   // Werkzeugwand über der Werkbank (Ausschnitt der großen Werkzeugtextur)
  D.pln("t_wz", W, Hh, F.m(x, y, .02), {uvr: [.05, .05, .05 + W / 4.6, .05 + Hh / 2.3]}); for (const s of [-1, 1]) { D.bx("dark", W + .06, .05, .04, F.m(x, y + s * (Hh / 2 + .02), .02)); D.bx("dark", .05, Hh, .04, F.m(x + s * (W / 2 + .02), y, .02)); } }
function ablage(D, F, x, y, W){   // Wandbrett mit Konsolen: Kästchen, Isolatoren, Drahtrolle, Glühbirnen-Schachteln
  const r = D.st().R; D.bx("dark", W, .03, .24, F.m(x, y, .12)); for (const s of [-1, 1]) D.bx("iron", .03, .2, .2, F.m(x + s * (W / 2 - .12), y - .11, .1));
  let xx = x - W / 2 + .1; const cols = ["#7a2a1e", "#2a4a6a", "#c9a46a", "#3a5a3a"];
  while (xx < x + W / 2 - .12) { const q = r(); if (q < .45) { const bw = .14 + r() * .12; D.bx("vc", bw, .1 + r() * .08, .16, F.m(xx + bw / 2, y + .08, .12), cols[(r() * 4) | 0]); xx += bw + .03; }
    else if (q < .75) { D.cy("vc", .03, .04, .07, 8, F.m(xx + .04, y + .05, .12), "#f0ece2"); D.cy("vc", .03, .04, .07, 8, F.m(xx + .12, y + .05, .12), "#f0ece2"); xx += .2; }
    else { D.tor("copper", .07, .025, 5, 12, F.m(xx + .09, y + .04, .12, PI / 2)); xx += .2; } } }
function trommel(D, F, x, z, rr = .45, col = "#1a1612"){   // Kabeltrommel aus Holz, steht auf den Scheiben
  const C = D.subF(F, x, z), b = rr * 1.05;
  for (const s of [-1, 1]) { D.cy("wood", rr, rr, .05, 18, C.m(s * b / 2, rr, 0, 0, 0, PI / 2)); D.cy("dark", .06, .06, .06, 8, C.m(s * (b / 2 + .02), rr, 0, 0, 0, PI / 2)); }
  D.cy("vc", rr * .78, rr * .78, b - .05, 18, C.m(0, rr, 0, 0, 0, PI / 2), col); D.cy("wood", .12, .12, b + .1, 8, C.m(0, rr, 0, 0, 0, PI / 2));
  for (let i = 0; i < 4; i++) D.tor("vc", rr * .79, .012, 3, 18, C.m(-b / 2 + .12 + i * (b - .24) / 3, rr, 0, 0, PI / 2, 0), col);
}
function teileRegal(D, F, x, W, Hh, Dp){   // offenes Regal mit Kästen, Isolatoren, Gläsern, Drahtrollen
  const {bx, cy, tor} = D, r = D.st().R, cols = ["#7a2a1e", "#2a4a6a", "#5a4a2a", "#3a5a3a", "#6a5a3a"];
  for (const sx of [-1, 1]) for (const z of [.04, Dp - .04]) bx("dark", .05, Hh, .05, F.m(x + sx * (W / 2 - .025), Hh / 2, z));
  const n = 4; for (let k = 0; k < n; k++) { const y = .12 + k * (Hh - .2) / (n - 1); bx("wood", W, .03, Dp, F.m(x, y, Dp / 2));
    if (k === n - 1) break; let xx = x - W / 2 + .12;
    while (xx < x + W / 2 - .15) { const q = r();
      if (q < .4) { const bw = .22 + r() * .14; bx("vc", bw, .16, Dp - .1, F.m(xx + bw / 2, y + .095, Dp / 2), cols[(r() * cols.length) | 0]); bx("paper", .08, .04, .004, F.m(xx + bw / 2, y + .12, Dp - .048)); xx += bw + .04; }
      else if (q < .65) { for (let i = 0; i < 3; i++) cy("vc", .035, .045, .08, 8, F.m(xx + .05 + i * .1, y + .055, Dp / 2), "#f0ece2"); xx += .32; }
      else if (q < .85) { cy("glass", .06, .06, .18, 10, F.m(xx + .07, y + .105, Dp / 2)); cy("vc", .055, .055, .1, 8, F.m(xx + .07, y + .065, Dp / 2), "#8a6a3a"); xx += .18; }
      else { tor("copper", .1, .035, 5, 14, F.m(xx + .12, y + .05, Dp / 2, PI / 2)); xx += .28; } } }
}
function fabrikFenster(D, F, sill, top, W){   // Fabrikfenster mit Eisensprossen, Blick auf die Häuser gegenüber
  const yc = (sill + top) / 2, Hh = top - sill;
  D.pln("win", W, Hh, F.m(0, yc, .012), {uvr: D.uvc(D.CM.F)}); D.pln("nebel", W, Hh, F.m(0, yc, .02), {uv: [W / 2.2, Hh / 2.2]}); D.pln("glass", W, Hh, F.m(0, yc, .04));
  for (let k = 0; k <= 4; k++) D.bx("iron", .04, Hh, .05, F.m(-W / 2 + k * W / 4, yc, .035)); for (let k = 0; k <= 5; k++) D.bx("iron", W, .04, .05, F.m(0, sill + k * Hh / 5, .035));
  D.bx("iron", W + .16, .06, .2, F.m(0, sill - .03, .1));
}
function sicherungsKasten(D, F, x){ const y = 2.25; D.bx("dark", .46, .5, .12, F.m(x, y, .06)); D.bx("marble", .4, .44, .02, F.m(x, y, .125));
  for (let i = 0; i < 3; i++) { D.cy("vc", .03, .03, .06, 8, F.m(x - .12 + i * .12, y + .08, .16, PI / 2), "#f0ece0"); D.cy("brass", .018, .018, .02, 8, F.m(x - .12 + i * .12, y + .08, .19, PI / 2)); }
  D.bx("brass", .2, .02, .02, F.m(x, y - .1, .15)); D.bx("brass", .02, .14, .02, F.m(x + .05, y - .04, .17, -.5)); }
function kabelHaken(D, F, x){ const y = 2.3; for (let i = 0; i < 2; i++) { D.bx("iron", .03, .03, .14, F.m(x - .14 + i * .28, y, .07)); for (let k = 0; k < 6; k++) D.tor("vc", .13 + (k % 2) * .005, .009, 3, 16, F.m(x - .14 + i * .28, y - .14, .12 + k * .012, 0, 0, 0, 1, 1.25, 1), i ? "#8a2a1a" : "#1a1612"); } }

/* ---------- Wandfelder der Seitenwände (gemeinsam für alle Räume) ---------- */
// liefert je Seitenwand-Feld (Mitte z ∈ {6,75; 2,25; −2,25; −6,75}) {w, z, up (oben frei, keine Tafel), lift}
function felder(D){ const {CTX, WL} = D.st(), out = [];
  for (const w of [WL.left, WL.right]) for (const z of [6.75, 2.25, -2.25, -6.75]) {
    const lift = CTX.frei(D.q(w, z, -1.65, 1.65, 2.8, 5.4, .3)) ? 0 : CTX.frei(D.q(w, z, -1.65, 1.65, 3.1, 5.4, .3)) ? .3 : -1;
    out.push({w, z, up: lift >= 0, lift: Math.max(0, lift), done: false}); }
  return out; }
// Möbel unten in den Feldern: menu = Liste von Komponenten-Namen (D.COMP), je Feld die erste, die passt (rückt bei Stationen zur Seite)
function moebel(D, liste, menu, ri, mehrfach){ const R = D.st().R, rest = liste.slice().sort(() => R() - .5);
  for (const p of rest) for (let i = 0; i < menu.length; i++) if (D.tryComp(menu[i], p.w, p.z, ri)) { p.low = true; if (!mehrfach || !mehrfach.includes(menu[i])) menu.splice(i, 1); break; } }
// kleine Wandstücke unter den Tafeln (y 1,95–2,67): je Feld zwei Plätze links/rechts
function wandKlein(D, liste, items){ let k = 0;
  for (const p of liste) { const F = D.FW(p.w, p.z); for (const x of [-.75, .75]) { const it = items[k++ % items.length]; if (D.claim(D.q(p.w, p.z, x - it.w / 2, x + it.w / 2, it.y0, it.y1, it.d))) it.fn(F, x); } } }
// Ecken an den Seitenwänden zwischen letztem Pfeiler und Stirnwand (a = ±9,98)
function ecken(D, fn){ const {WL} = D.st(); [[WL.left, 9.98], [WL.right, 9.98], [WL.left, -9.98], [WL.right, -9.98]].forEach(([w, a], i) => fn(w, a, D.FW(w, a), i)); }
// Luftraum: erster freier Platz (frei, verdeckt nichts Hohes, 1,9 m Abstand in derselben Reihe)
function luft(D, placed, zs, xs, half, yb, yt){ for (const x of xs) for (const z of zs) { if (placed.some(([px, pz]) => px === x && Math.abs(pz - z) < 1.9)) continue;
  const b = D.qw(x - half, x + half, yb, yt, z - half, z + half); if (D.isFree(b) && D.viewFree(b) && D.claim(b)) { placed.push([x, z]); return [x, z]; } } return null; }
// eigene Materialschlüssel der Ausstattung (einmal)
function dekorMat(D){ const KM = D.KEYMAT;
  KM.t_wz = () => mt("ws-wz", () => S({map: TX.werkzeug(), roughness: .8}));
  KM.t_plan = () => mt("ws-plan", () => S({map: TX.schaltplan(), roughness: .85}));
  KM.t_kblick = () => mt("k-blick", () => KB({map: TX.kellerblick(), fog: false, toneMapped: false}));
  KM.t_ziegel = () => mt("k-ziegel2", () => S({map: TX.ziegelAlt(), roughness: .86}));
  KM.gold = () => mt("o1-gold", () => S({color: 0xd8a848, metalness: .85, roughness: .3})); KM.rotlack = () => mt("o1-rot", () => S({color: 0x8e1418, roughness: .4}));
  KM.spiegel = () => mt("o1-spiegel", () => S({color: 0xdfe4e6, metalness: 1, roughness: .04}));
  KM.t_plakat = () => mt("o1-plakat", () => S({map: TX.plakat(), roughness: .8}));
  KM.t_plakate = () => mt("o2-plakat", () => S({map: TX.ladenPlakate(), roughness: .8}));
  KM.t_rost = () => mt("k-rost", () => S({color: 0x6a3a22, roughness: .8, metalness: .4}));
}

function werkstattDekor(D){
  dekorMat(D); const st = D.st(), {CTX, WL, R} = st, ri = 0, {bx, cy} = D;
  const C = D.COMP; let nb = 0;
  C.t_werkbank = (w, a) => ({b: [D.q(w, a, -1.12, 1.12, 0, 1.25, .8, true), D.q(w, a, -.9, .9, 1.3, 2.1, .26)], build: F => { werkbank(D, F, 0, 2.2); (nb++ % 2 ? ablage : (D, F, x, y, W) => lochwand(D, F, x, y, W, .7))(D, F, 0, 1.7, 1.7); }});
  C.t_trommeln = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.0, .75, true)], build: F => { trommel(D, F, -.48, .36, .45); trommel(D, F, .5, .3, .34, "#7a3a1a"); }});
  C.t_regal = (w, a) => ({b: [D.q(w, a, -.75, .75, 0, 2.15, .5, true)], build: F => { teileRegal(D, F, 0, 1.45, 2.1, .45); }});
  C.t_wims = (w, a) => ({b: [D.q(w, a, -.5, .5, 0, 1.5, .9, true)], build: F => { D.wimshurst(F, 0, .45); }});
  C.t_vitrine = (w, a) => ({b: [D.q(w, a, -.72, .72, 0, 2.0, .6, true)], build: F => { D.vitrine(F, 0, 1.3, .52, (Cc, y0, y1) => { for (let i = 0; i < 4; i++) D.leyden(Cc, -.39 + i * .26, y0, .26, .7);
    D.voltaPile(Cc, -.25, y1, .26); D.galvanometer(Cc, .25, y1, .26); }, {col: "#2a3a2a"}); }});
  C.t_schrank = (w, a, k) => ({b: [D.q(w, a, -.55, .55, 0, 1.6, .55, true)], build: F => { D.cabinet(F, 0, 1.0, 1.4, .5, {rows: 6}); D.fileStack(F, -.2, 1.44, .27); D.leyden(F, .25, 1.44, .27, .8); }});
  // 1) Seitenwände: oben freie Felder rechts Fabrikfenster, links Schaltplan oder große Werkzeugwand
  const P = felder(D); let links = 0;
  for (const p of P.filter(p => p.up)) { const F = D.FW(p.w, p.z), L = p.lift;
    if (p.w === WL.right) { if (D.claim(D.q(p.w, p.z, -1.5, 1.5, 2.95 + L, 5.5, .22))) { fabrikFenster(D, F, 3.05 + L, 5.4, 2.8); p.done = true; } }
    else if (links++ % 2 === 0) { if (D.claim(D.q(p.w, p.z, -1.25, 1.25, 3.0 + L, 5.0, .08))) { D.pln("t_plan", 2.2, 1.65, F.m(0, 4.0 + L / 2, .03)); for (const s of [-1, 1]) D.cy("dark", .03, .03, 2.34, 8, F.m(0, 4.0 + L / 2 + s * .85, .04, 0, 0, PI / 2)); p.done = true; } }
    else if (D.claim(D.q(p.w, p.z, -1.4, 1.4, 3.0 + L, 5.0, .08))) { lochwand(D, F, 0, 4.0 + L / 2, 2.6, 1.6); p.done = true; } }
  // 2) unten: Werkbänke, Kabeltrommeln, Regale, Influenzmaschine, Vitrine mit Leidener Flaschen
  moebel(D, P, ["t_werkbank", "t_wims", "t_trommeln", "t_regal", "t_vitrine", "t_werkbank", "t_schrank", "t_regal"], ri, ["t_werkbank", "t_regal"]);
  wandKlein(D, P.filter(p => !p.low), [{w: .5, y0: 1.95, y1: 2.6, d: .2, fn: (F, x) => sicherungsKasten(D, F, x)}, {w: .6, y0: 1.95, y1: 2.6, d: .2, fn: (F, x) => kabelHaken(D, F, x)},
    {w: .5, y0: 1.95, y1: 2.67, d: .22, fn: (F, x) => D.wallPhone(F, x)}, {w: .56, y0: 1.95, y1: 2.6, d: .1, fn: (F, x) => D.keyBoard(F, x, 2.25)}]);
  // 3) Stirn- und Rückwand: Werkbank unter der Werkzeugwand, Prüftisch unter dem Fenster, Regale
  for (const [s, sx] of [["front", 1], ["back", -1]]) { const w = WL[s], F = D.FW(w, 0), xt = -sx * 5.2, xf = sx * 5.15, nx = x => w === WL.front ? x : -x;
    if (D.claim(D.q(w, xt, -2.2, 2.2, 0, 1.25, .8, true))) { werkbank(D, D.FW(w, xt), 0, 4.3, {links: sx > 0}); }
    if (D.claim(D.q(w, xf, -1.9, 1.9, 0, 1.3, .7, true))) { const Fb = D.FW(w, xf); werkbank(D, Fb, -.7, 2.2, {messer: false}); trommel(D, Fb, 1.25, .36, .38, "#2a2a6a"); }
  }
  // 4) Ecken: Kabeltrommel, Leiter, Kisten
  ecken(D, (w, a, F, i) => { if (i % 2 === 0 && D.claim(D.q(w, a, -.5, .5, 0, 1.0, .75, true))) trommel(D, F, 0, .38, .42, i ? "#5a2a1a" : "#1a1612");
    else if (D.claim(D.q(w, a, -.4, .4, 0, .9, .6, true))) { D.crate(F, 0, 0, .32, .55, .1, true); D.crate(F, .02, .55, .3, .34, -.2); } });
  // 5) Luftraum: Elektrolier über dem Gang (vorne), Leitungen von Balken zu Balken
  const placed = [], Z = luft(D, placed, [-4.6, -5.4, -3.8, -6.2], [0, -3.3, 3.3], .5, 4.7, HOEHE); if (Z) D.bulbPendant(...Z);
}

/* =====================================================================
   strom2 · Keller unter der Laterne
   Flaches Ziegel-Tonnengewölbe auf Gurtbögen und Wandpfeilern (Scheitel 7,9 m), darunter ein eiserner Träger bei 6,5 m über dem Gang
   (daran hängen die Leuchten des Raums), feuchte alte Ziegel, Steinplatten mit Pfützen, vergitterte Kellerfenster in den Schildwänden
   mit Blick auf die Straßenlaterne (Lichtbahn), Kohlenrutsche mit Kohlenhaufen, Fasslager, Spinnweben; dunkel, kühles Laternenlicht.
   Ausstattung: Fässer, Kisten und Säcke, Weinregal, Vorratsregal, alte Schalttafel, Truhe, kleine Kellerfenster, Rohre, Laternen.
   ===================================================================== */
function platten(g, w, h, r){   // unregelmäßige Steinplatten in Reihen, nahtlos kachelbar
  g.fillStyle = "#2a2622"; g.fillRect(0, 0, w, h);
  const n = 5, hs = [...Array(n)].map(() => .7 + r() * .6), sum = hs.reduce((a, b) => a + b); let y = 0;
  for (let j = 0; j < n; j++) { const rh = hs[j] / sum * h, s0 = r() * 150; let x = s0;
    while (x < s0 + w - 1) { let pw = 110 + r() * 150; if (x + pw > s0 + w - 70) pw = s0 + w - x; const c = hsl(28 + (r() - .5) * 14, 8 + r() * 8, 34 + (r() - .5) * 12), sp = [...Array(30)].map(() => [r(), r(), r()]);
      for (const dx of [0, -w]) { const X = x + dx; if (X > w || X + pw < 0) continue;
        g.fillStyle = c; g.fillRect(X + 3, y + 3, pw - 6, rh - 6); g.fillStyle = "rgba(255,240,220,.07)"; g.fillRect(X + 3, y + 3, pw - 6, 3); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(X + 3, y + rh - 6, pw - 6, 3);
        for (const [a, b, k] of sp) { g.fillStyle = k < .5 ? "rgba(0,0,0,.12)" : "rgba(255,240,220,.08)"; g.fillRect(X + 6 + a * (pw - 14), y + 6 + b * (rh - 14), 3 + k * 6, 2 + k * 4); }
        if (sp[0][2] < .3) blob(g, X + pw / 2, y + rh / 2, pw * .4, rh * .3, "rgba(10,10,12,.25)"); }
      x += pw; }
    g.fillStyle = "rgba(60,80,40,.35)"; for (let k = 0; k < 40; k++) g.fillRect(r() * w, y + (r() < .5 ? 0 : rh - 4), 4 + r() * 10, 3);   // Moos in den Fugen
    y += rh; }
  speck(g, r, w, h, 6000, .14, ["#000", "#fff"]);
}
Object.assign(TX, {
  ziegelAlt: () => ctex(512, 512, "ziegel-alt", (g, w, h, r) => ziegel(g, w, h, r, {fuge: "#5a534a", stein: [14, 30, 27], var: 15, extra: (g, w, h, r) => {
    for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, L = 40 + r() * 160, gr = g.createLinearGradient(0, y, 0, y + L);
      gr.addColorStop(0, "rgba(16,22,14,0)"); gr.addColorStop(.3, "rgba(16,22,14,.35)"); gr.addColorStop(1, "rgba(16,22,14,0)"); g.fillStyle = gr; g.fillRect(x, y, 3 + r() * 8, L); }   // Feuchtespuren
    for (let i = 0; i < 16; i++) blob(g, r() * w, r() * h, 20 + r() * 40, 10 + r() * 24, "rgba(225,224,210,.16)"); }}), [1, 1]),   // Salpeter
  platten: () => ctex(1024, 1024, "platten", platten, [1, 1]),
  // Blick aus dem Kellerfenster nach oben auf die Straße: Pflasterkante, Laternenpfahl mit hellem Licht, Häuser gegenüber, Nachtnebel
  kellerblick: () => ctex(512, 256, "kellerblick", (g, w, h, r) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#141c2a"); sky.addColorStop(1, "#3a4048"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = "#1a1c20"; g.fillRect(0, h * .18, w, h * .5); for (let i = 0; i < 7; i++) { const x = 20 + i * 72, y = h * .26; const lit = r() < .4; g.fillStyle = lit ? "#d8a858" : "#22262c"; g.fillRect(x, y, 34, 46); if (lit) blob(g, x + 17, y + 23, 50, 50, "rgba(255,200,120,.3)"); }
    blob(g, w * .5, h * .3, 200, 130, "rgba(255,236,170,.75)"); blob(g, w * .5, h * .3, 60, 50, "rgba(255,250,225,1)");
    g.fillStyle = "#0c0c0e"; g.fillRect(w * .5 - 5, h * .38, 10, h * .5); g.beginPath(); g.moveTo(w * .5 - 22, h * .38); g.lineTo(w * .5 + 22, h * .38); g.lineTo(w * .5 + 14, h * .2); g.lineTo(w * .5 - 14, h * .2); g.fill();
    g.fillStyle = "#fff4cc"; g.fillRect(w * .5 - 11, h * .22, 22, h * .14); g.fillStyle = "#0c0c0e"; g.beginPath(); g.moveTo(w * .5 - 24, h * .2); g.lineTo(w * .5, h * .1); g.lineTo(w * .5 + 24, h * .2); g.fill();
    const pf = g.createLinearGradient(0, h * .72, 0, h); pf.addColorStop(0, "#3a3834"); pf.addColorStop(1, "#151412"); g.fillStyle = pf; g.fillRect(0, h * .72, w, h * .28);
    for (let x = 0; x < w; x += 22) { g.fillStyle = `rgba(255,230,170,${.08 + r() * .2})`; g.fillRect(x + r() * 6, h * .73 + r() * 8, 14, 3); }
    g.fillStyle = "rgba(170,175,180,.25)"; g.fillRect(0, h * .55, w, h * .2); speck(g, r, w, h, 1200, .15, ["#000", "#fff"]);
  }),
  spinnweb: () => ctex(256, 256, "spinnweb", (g, w, h, r) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(235,235,230,.75)"; g.lineWidth = 1.2;
    const n = 9, R0 = w * .7; for (let i = 0; i < n; i++) { const a = i / (n - 1) * PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R0 * 1.4, Math.sin(a) * R0 * 1.4); g.stroke(); }
    for (let k = 1; k < 9; k++) { const rr = k * R0 / 7; g.beginPath(); for (let i = 0; i < n; i++) { const a = i / (n - 1) * PI / 2, q = rr * (.9 + r() * .15); i ? g.quadraticCurveTo(Math.cos(a - .1) * q * .92, Math.sin(a - .1) * q * .92, Math.cos(a) * q, Math.sin(a) * q) : g.moveTo(Math.cos(a) * q, Math.sin(a) * q); } g.stroke(); } }),
  pfuetze: () => ctex(128, 128, "pfuetze", (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(.7, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  lichtbahn: () => ctex(64, 256, "lichtbahn", (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-in"; const sx = g.createLinearGradient(0, 0, w, 0); sx.addColorStop(0, "rgba(0,0,0,0)"); sx.addColorStop(.3, "rgba(0,0,0,1)"); sx.addColorStop(.7, "rgba(0,0,0,1)"); sx.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sx; g.fillRect(0, 0, w, h); })
});
// Käfigleuchte am Pfeiler/Ständer: Ausleger, Fassung, Glühbirne, Drahtkorb; s = Wandseite (−1 links, 1 rechts), d = Abstand der Birne von der Wand
function kaefigLampe(A, K, s, z, y, xw, d = .3){ const x = s * xw;
  K.box("eisen", d, .04, .04, M(x - s * d / 2, y + .12, z)); K.add("messing", new T3.CylinderGeometry(.045, .05, .08, 10), M(x - s * d, y + .06, z));
  A.lampe(birne(K, x - s * d, y, z, false)); for (const yy of [-.02, -.1]) K.add("eisen", new T3.TorusGeometry(.075, .006, 4, 12), M(x - s * d, y + yy, z, PI / 2));
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; K.box("eisen", .008, .17, .008, M(x - s * d + Math.cos(a) * .075, y - .06, z + Math.sin(a) * .075)); } }
// Fass (Achse y, Höhe 0,84·s); liegend: Achse z
function fass(K, m, s = 1){ const pr = [[.2, -.42], [.25, -.3], [.28, 0], [.25, .3], [.2, .42]].map(([a, b]) => new T3.Vector2(a * s, b * s));
  K.add("fass", new T3.LatheGeometry(pr, 16), m.clone()); for (const e of [-1, 1]) K.add("dunkel", new T3.CircleGeometry(.2 * s, 16), m.clone().multiply(M(0, e * .42 * s, 0, e * -PI / 2)));
  for (const yy of [-.34, -.16, .16, .34]) K.add("eisen", new T3.TorusGeometry((.205 + .07 * Math.cos(yy * 3.7)) * s, .01, 4, 20), m.clone().multiply(M(0, yy * s, 0, PI / 2))); }
function keller(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ, YS = 5.5, YC = 7.9, R = (64 + (YC - YS) ** 2) / (2 * (YC - YS)), YM = YC - R, TH = Math.asin(8 / R), NA = 28;
  const vault = x => YM + Math.sqrt(Math.max(0, R * R - x * x));
  A.hu.deckeY = (x, z) => Math.abs(x) < .3 ? H : vault(x) - (P.some(p => Math.abs(z - p) < .4) ? .32 : 0);   // Träger über dem Gang, sonst Gewölbe/Gurtbogen
  const zieg = mt("k-ziegel", () => S({map: TX.ziegelAlt(), vertexColors: true, roughness: .86}));
  const feucht = y => { const k = y < 1.4 ? .6 + y * .28 : 1; return [k * .9, k, k * .88]; }, weiss = () => [1, 1, 1];
  const farbe = (geo, f) => { const p = geo.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) c.set(f(p.getY(i)), i * 3); geo.setAttribute("color", new T3.BufferAttribute(c, 3)); return geo; };
  A.boden(mt("k-boden", () => S({map: TX.platten(), color: 0xc4c0b8, roughness: .6})), 4);
  A.mesh(A.wandGeo(0, YS, 2.4, feucht, ["left", "right"]), zieg);
  // Gewölbe (Achse z): Ziegelschichten laufen längs, u = z, v = Bogenlänge
  { const pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i <= NA; i++) { const t = -TH + 2 * TH * i / NA, x = R * Math.sin(t), y = YM + R * Math.cos(t), s = R * (t + TH);
      for (const z of [B.z1, B.z0]) { pos.push(x, y, z); nor.push(-Math.sin(t), -Math.cos(t), 0); uv.push(z / 2.4, s / 2.4); } }
    for (let i = 0; i < NA; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const vg = new T3.BufferGeometry(); vg.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); vg.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3)); vg.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); vg.setIndex(idx);
    A.mesh(farbe(vg, () => [.7, .7, .68]), zieg); }
  // Schildwände mit Fensteröffnung über der Tür
  { const sh = new T3.Shape(); sh.moveTo(-8, 0); sh.lineTo(8, 0); sh.lineTo(8, YS); for (let i = 1; i < NA; i++) { const t = TH - 2 * TH * i / NA; sh.lineTo(R * Math.sin(t), YM + R * Math.cos(t)); } sh.lineTo(-8, YS); sh.closePath();
    const ho = new T3.Path(); ho.moveTo(-1.7, 5.8); ho.lineTo(-1.7, 7.3); ho.lineTo(1.7, 7.3); ho.lineTo(1.7, 5.8); ho.closePath(); sh.holes.push(ho);
    const sg = farbe(U.scaleUV(new T3.ShapeGeometry(sh, 4), 1 / 2.4, 1 / 2.4), weiss);
    for (const [z, ry] of [[B.z1, 0], [B.z0, PI]]) { const m = A.mesh(sg, zieg); m.position.z = z; m.rotation.y = ry; } }
  // Kellerfenster: Laibung, Gitter, Blick auf die Laterne (ohne Nebel, damit es hell bleibt)
  for (const [zW, s] of [[B.z1, 1], [B.z0, -1]]) { const zo = zW - s * .45, zm = zW - s * .225;
    K.add("blick", new T3.PlaneGeometry(3.4, 1.5), M(0, 6.55, zo, 0, s > 0 ? 0 : PI, 0));
    K.box("ziegel", 3.64, .12, .45, M(0, 7.36, zm)); K.box("stein", 3.64, .1, .5, M(0, 5.75, zm + s * .02)); for (const sx of [-1, 1]) K.box("ziegel", .12, 1.62, .45, M(sx * 1.76, 6.55, zm));
    for (let k = 0; k < 10; k++) K.add("eisen", new T3.CylinderGeometry(.018, .018, 1.5, 6), M(-1.53 + k * .34, 6.55, zW - s * .2)); K.box("eisen", 3.4, .04, .04, M(0, 6.55, zW - s * .2));
    if (s > 0) A.lampe(V3(0, 6.7, zW - .3)); }
  // Gurtbögen auf Wandpfeilern mit Kämpfersteinen
  { const ab = new T3.Shape(); for (let i = 0; i <= NA; i++) { const t = -TH + 2 * TH * i / NA; i ? ab.lineTo(R * Math.sin(t), YM + R * Math.cos(t)) : ab.moveTo(R * Math.sin(t), YM + R * Math.cos(t)); }
    for (let i = NA; i >= 0; i--) { const t = -TH + 2 * TH * i / NA; ab.lineTo((R - .32) * Math.sin(t), YM + (R - .32) * Math.cos(t)); } ab.closePath();
    const ag = U.scaleUV(new T3.ExtrudeGeometry(ab, {depth: .62, bevelEnabled: false, curveSegments: 1}).translate(0, 0, -.31), 1 / 2.4, 1 / 2.4);
    for (const z of P) { K.add("ziegel", ag.clone(), M(0, 0, z));
      for (const s of [-1, 1]) { K.box("ziegel", .3, 5.15, .7, M(s * 7.85, 2.575, z), {uv: [.3, 2.1]}); K.box("stein", .44, .16, .84, M(s * 7.8, 5.23, z)); K.box("stein", .4, .2, .82, M(s * 7.82, .1, z)); A.hindernis(s * 7.84, z, .34, .74); } }
    ag.dispose(); }
  // eiserner Träger über dem Gang (Unterkante 6,5 m), an den Gurtbögen aufgehängt; Kabel mit Isolatoren
  K.box("eisen", .2, .03, 21.5, M(0, H + .015, 0)); K.box("eisen", .025, .22, 21.5, M(0, H + .14, 0)); K.box("eisen", .2, .03, 21.5, M(0, H + .265, 0));
  for (const z of P) { const ya = YC - .32; K.box("eisen", .03, ya - H - .28, .03, M(0, (ya + H + .28) / 2, z)); K.box("eisen", .3, .05, .12, M(0, ya - .02, z)); }
  for (const s of [-1, 1]) { K.box("eisen", .34, .44, .05, M(0, H + .14, s * 10.97)); K.box("kabel", .02, .02, 21.2, M(s * .13, H - .03, 0));
    for (let z = -9.75; z <= 9.8; z += 1.5) K.add("porzellan", new T3.CylinderGeometry(.022, .03, .06, 8), M(s * .13, H - .0, z)); }
  // Käfigleuchten an zwei Pfeilern (Punktlichter)
  kaefigLampe(A, K, -1, 4.5, 3.55, 7.7, .32); kaefigLampe(A, K, 1, -4.5, 3.55, 7.7, .32);
  // Kohlenrutsche mit Luke und Kohlenhaufen (vorne rechts)
  { const x = 6.3, y1 = 5.05, z1 = -10.94, y0 = .95, z0 = -10.12, L = Math.hypot(y1 - y0, z1 - z0), ph = Math.atan2(z1 - z0, y1 - y0), Cm = M(x, (y0 + y1) / 2, (z0 + z1) / 2, ph);
    K.box("holz", .62, L, .04, Cm.clone().multiply(M(0, 0, .02))); for (const sx of [-1, 1]) K.box("holz", .04, L, .24, Cm.clone().multiply(M(sx * .31, 0, .12)));
    for (let k = 0; k < 4; k++) K.box("eisen", .7, .04, .03, Cm.clone().multiply(M(0, -L / 2 + .3 + k * (L - .6) / 3, .25)));
    K.box("eisen", .8, .62, .05, M(x, 5.32, -10.975)); K.box("eisen", .7, .52, .03, M(x, 5.32, -10.94)); K.add("eisen", new T3.TorusGeometry(.05, .01, 4, 10), M(x + .25, 5.32, -10.91));
    const hg = new T3.SphereGeometry(1, 20, 8, 0, TAU, 0, PI / 2), p = hg.attributes.position;
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), n = 1 + .14 * Math.sin(X * 9.1 + Z * 7.3) * Math.cos(Z * 8.7 - X * 5.1) * (1 - Y * .5); p.setXYZ(i, X * n, Y * n, Z * n); }
    hg.computeVertexNormals(); K.add("kohle", hg, M(x, 0, -10.2, 0, 0, 0, 1.35, .9, 1.05));
    const r = U.seeded(77); for (let i = 0; i < 14; i++) { const a = r() * TAU, d = 1.1 + r() * .5; K.add("kohle", new T3.DodecahedronGeometry(.05 + r() * .05, 0), M(x + Math.cos(a) * d * 1.2, .04, -10.2 + Math.abs(Math.sin(a)) * d * .9, r() * 3, r() * 3, 0)); }
    A.belege({x0: 4.7, x1: 8, y0: 0, y1: 5.7, z0: -11, z1: -9.0}); A.hindernis(6.3, -10.1, 2.9, 1.9); }
  // Fasslager (vorne links): Gestell mit liegenden Fässern
  { const zc = -10.5; for (const zz of [-10.78, -10.22]) { K.box("dunkel", 2.0, .08, .1, M(-6.65, .14, zz)); for (const xx of [-7.55, -5.75]) K.box("dunkel", .1, .14, .1, M(xx, .07, zz)); }
    for (const [x, y] of [[-7.25, .42], [-6.65, .42], [-6.05, .42], [-6.95, .89], [-6.35, .89]]) fass(K, M(x, y, zc, PI / 2));
    A.belege({x0: -7.7, x1: -5.65, y0: 0, y1: 1.25, z0: -11, z1: -10.0}); A.hindernis(-6.65, -10.5, 2.1, 1.0); }
  // Spinnweben in den Gewölbezwickeln, Pfützen, Lichtbahn vom Kellerfenster
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add("netz", new T3.PlaneGeometry(1.3, 1.3), M(sx * 7.55, 4.95, sz * 10.55, 0, Math.atan2(-sx, -sz), 0));
  for (const [x, z, sx, sz] of [[1.1, -6.6, .95, .5], [-1.0, 4.9, .7, .42], [2.7, 8.7, .8, .5], [-2.6, -9.2, .6, .4], [.6, 1.2, .45, .3]]) K.add("pfuetze", new T3.CircleGeometry(1, 20), M(x, .006, z, -PI / 2, 0, 0, sx, sz, 1));
  { const g = new T3.BufferGeometry(), p = [-1.6, 7.25, -11.1, 1.6, 7.25, -11.1, 2.3, .02, -6.0, -2.3, .02, -6.0]; g.setAttribute("position", new T3.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new T3.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2)); g.setIndex([0, 3, 1, 1, 3, 2]); g.computeVertexNormals();
    const m = A.mesh(g, mt("k-bahn", () => KB({map: TX.lichtbahn(), color: 0xfff0b8, transparent: true, opacity: .2, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, toneMapped: false})), {receive: false, order: 2}); m.userData.noPick = true;
    const pool = A.mesh(new T3.CircleGeometry(1, 24).rotateX(-PI / 2), mt("k-pool", () => KB({map: U.glowTex(), color: 0xfff0c0, transparent: true, opacity: .22, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false})), {receive: false, order: 2});
    pool.position.set(0, .012, -6.2); pool.scale.set(2.9, 1, 1.8); pool.userData.noPick = true; }
  A.fertig([["ziegel", zieg, {color: true}], ["stein", () => mt("k-stein", () => S({color: 0x7a746a, roughness: .9}))], ["eisen", ST.eisen, {cast: true}], ["kabel", ST.kabel], ["porzellan", ST.porzellan],
    ["messing", ST.messing], ["birne", ST.birne, {receive: false}], ["holz", () => mt("k-holz", () => S({map: tex.wood(true), color: 0x8a8070, roughness: .8}))], ["dunkel", ST.dunkel],
    ["fass", () => mt("k-fass", () => S({map: tex.wood(false), color: 0x9a7a5a, roughness: .7}))], ["kohle", () => mt("k-kohle", () => S({color: 0x18181a, roughness: .42, metalness: .2}))],
    ["blick", () => mt("k-blick", () => KB({map: TX.kellerblick(), fog: false, toneMapped: false}))],
    ["netz", () => mt("k-netz", () => KB({map: TX.spinnweb(), transparent: true, opacity: .55, depthWrite: false, side: T3.DoubleSide}))],
    ["pfuetze", () => mt("k-pf", () => S({color: 0x3a4450, map: TX.pfuetze(), transparent: true, opacity: .78, roughness: .015, metalness: .55, envMapIntensity: 2.2, depthWrite: false})), {receive: false}]]);
  A.halos(A.hu.lampen, 0xffd8a0, .8);
  return {punkt: [[0xffc074, 6.2, 12, -7.3, 3.5, 4.5], [0xffc074, 6.2, 12, 7.3, 3.5, -4.5], [0xece6b4, 7, 17, 0, 6.2, -10.3]],
    flackern: (t, L) => { L[2].intensity = L[2].userData.i0 * (.93 + .05 * Math.sin(t * 1.3) + .02 * Math.sin(t * 2.7)); }};
}
function laterne(D, C, x, y, z, halo){   // Handlaterne: Eisenrahmen, Glas, Flamme (Lichthof)
  const {cy, bx, cone, tor, rod} = D; cy("iron", .09, .1, .03, 8, C.m(x, y + .015, z)); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4; rod("iron", C, [x + Math.cos(a) * .085, y + .03, z + Math.sin(a) * .085], [x + Math.cos(a) * .075, y + .3, z + Math.sin(a) * .075], .006, 4); }
  cy("glass", .08, .08, .26, 8, C.m(x, y + .16, z), null, true); cone("iron", .1, .1, 8, C.m(x, y + .35, z)); tor("iron", .04, .006, 4, 10, C.m(x, y + .43, z, PI / 2)); cy("wax", .014, .014, .06, 6, C.m(x, y + .06, z)); cone("fil", .012, .045, 6, C.m(x, y + .12, z));
  if (halo !== false) D.st().HALOS.push(C.p(x, y + .14, z)); return V3(x, y + .14, z); }
function kellerDekor(D){
  dekorMat(D); const st = D.st(), {CTX, WL, R, HALOS} = st, ri = 1, C = D.COMP;
  C.t_faesser = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.4, .7, true)], build: F => { D.barrel(F, -.45, 0, .35); D.barrel(F, .42, 0, .35, .9); D.barrel(F, -.2, .84, .32, .55, true); }});
  C.t_kisten = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.3, .75, true)], build: F => { D.crate(F, -.45, 0, .36, .64, .08, true); D.crate(F, -.42, .64, .34, .44, -.15); D.crate(F, .38, 0, .32, .5, -.1);
    for (const [x, y, ry] of [[.38, .75, .3], [.8, .25, -.2]]) { D.bx("vc", .36, .5, .3, F.m(x, y, .3, 0, ry, .06), "#8a7656"); D.sp("vc", .15, 8, 6, F.m(x, y + .27, .3, 0, 0, 0, 1.1, .5, .9), "#7a6646"); } }});
  C.t_wein = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.95, .45, true)], build: F => { const {bx, cy} = D, W = 1.9, Hh = 1.85, Dp = .42, nx = 9, ny = 8, cw = W / nx, ch = (Hh - .1) / ny;
    for (let i = 0; i <= nx; i++) bx("dark", .03, Hh, Dp, F.m(-W / 2 + i * cw, Hh / 2, Dp / 2)); for (let j = 0; j <= ny; j++) bx("dark", W, .025, Dp, F.m(0, .05 + j * ch, Dp / 2));
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { if (R() < .3) continue; const x = -W / 2 + (i + .5) * cw, y = .05 + (j + .5) * ch, c = R() < .5 ? "#1e3a24" : "#3a1a14";
      cy("vc", .05, .05, .26, 8, F.m(x, y, .17, PI / 2), c); cy("vc", .018, .018, .1, 6, F.m(x, y, .35, PI / 2), c); } }});
  C.t_vorrat = (w, a) => ({b: [D.q(w, a, -.75, .75, 0, 2.15, .5, true)], build: F => { teileRegal(D, F, 0, 1.45, 2.1, .45); laterne(D, F, .45, 2.04, .25); }});
  C.t_tafel = (w, a) => ({b: [D.q(w, a, -.72, .72, .85, 2.05, .3), D.q(w, a, -.7, .7, 0, .8, .5, true)], build: F => { D.switchboard(F, 0, .95);
    for (let i = 0; i < 5; i++) D.tor("vc", .16 - i * .01, .022, 5, 18, F.m(-.4, .025 + i * .04, .28, PI / 2), "#2a1c14"); D.crate(F, .38, 0, .28, .42, .1, true); }});
  C.t_truhe = (w, a) => ({b: [D.q(w, a, -.9, .9, 0, 1.1, .65, true)], build: F => { D.chest(F, -.25, 1.0, .55, .5); D.suitcase(F, -.3, .58, .3, .7, .2, .42, "#3a2a22", .06); D.barrel(F, .62, 0, .3, .6); }});
  // 1) oben freie Felder: rechts kleine Kellerfenster (Straßenseite), links Rohrleitungen mit Absperrrad
  const P = felder(D);
  for (const p of P.filter(p => p.up)) { const F = D.FW(p.w, p.z), L = p.lift;
    if (p.w === WL.right) { if (D.claim(D.q(p.w, p.z, -.9, .9, 3.9 + L, 5.35, .12))) { const yc = 4.65 + L / 2; D.pln("t_kblick", 1.4, .8, F.m(0, yc, .01)); D.pln("glass", 1.4, .8, F.m(0, yc, .03));
        for (const s of [-1, 1]) { D.bx("t_ziegel", .16, 1.0, .1, F.m(s * .78, yc, .05)); D.bx("t_ziegel", 1.72, .12, .1, F.m(0, yc + s * .46, .05)); } for (let k = 0; k < 6; k++) D.cy("iron", .014, .014, .8, 5, F.m(-.58 + k * .232, yc, .06));
        HALOS.push(F.p(0, yc, .1)); p.done = true; } }
    else if (D.claim(D.q(p.w, p.z, -1.7, 1.7, 3.8 + L, 4.9 + L, .26))) { const y = 4.2 + L;
      for (const [yy, rr] of [[y, .07], [y + .38, .05]]) { D.cy("t_rost", rr, rr, 3.4, 10, F.m(0, yy, .14, 0, 0, PI / 2)); for (const x of [-1.1, 0, 1.1]) D.bx("iron", .04, .12, .16, F.m(x, yy + rr + .02, .08)); }
      D.cy("t_rost", .07, .07, .3, 10, F.m(.6, y + .19, .14)); D.tor("vc", .13, .015, 4, 14, F.m(.6, y + .19, .32), "#8a2a1a"); D.rod("vc", F, [.6, y + .19, .32], [.6, y + .19, .2], .01, 4, "#5a1a10"); p.done = true; } }
  // 2) unten: Fässer, Kisten, Weinregal, Vorratsregal, Schalttafel, Truhe
  moebel(D, P, ["t_tafel", "t_faesser", "t_wein", "t_kisten", "t_vorrat", "t_truhe", "t_faesser", "t_kisten"], ri, ["t_faesser", "t_kisten"]);
  wandKlein(D, P.filter(p => !p.low), [{w: .3, y0: 1.95, y1: 2.6, d: .26, fn: (F, x) => { D.bx("iron", .03, .03, .2, F.m(x, 2.5, .1)); laterne(D, F, x, 2.06, .2); }},
    {w: .5, y0: 1.95, y1: 2.6, d: .2, fn: (F, x) => sicherungsKasten(D, F, x)}, {w: .5, y0: 1.95, y1: 2.6, d: .2, fn: (F, x) => { for (let k = 0; k < 6; k++) D.tor("vc", .15, .025, 4, 16, F.m(x, 2.2, .06 + k * .025, 0, 0, 0, 1, 1.3, 1), "#a88a5a"); D.bx("iron", .03, .03, .2, F.m(x, 2.42, .1)); }},
    {w: .56, y0: 1.95, y1: 2.6, d: .1, fn: (F, x) => D.keyBoard(F, x, 2.25)}]);
  // 3) Rückwand: Weinregal und Vorratsregal neben der Tür; Stirnwand rechts: Säcke vor der Kohle
  for (const [s, x0, kind] of [["back", -5.0, "t_wein"], ["back", 5.0, "t_vorrat"], ["front", -3.6, "t_kisten"]]) { const w = WL[s], c = C[kind](w, x0); if (D.claim(...c.b)) c.build(D.FW(w, x0)); }
  // 4) Ecken: Fässer und Besen
  ecken(D, (w, a, F, i) => { if (D.claim(D.q(w, a, -.45, .45, 0, 1.3, .7, true))) { D.barrel(F, 0, 0, .34, .85); if (i % 2) { D.rod("dark", F, [.3, 0, .12], [.36, 1.25, .04], .015, 5); D.bx("vc", .3, .2, .06, F.m(.3, .1, .14, 0, 0, .05), "#6a5a3a"); } } });
  // 5) Luftraum: Laterne am Träger über dem Gang (hinten)
  const placed = [], Z = luft(D, placed, [-5.2, -6.2, -4.2, -7.2], [0], .35, 4.9, HOEHE);
  if (Z) { const [x, z] = Z, G = D.group(M(x, HOEHE, z)), Q = D.I4(); D.meshes(D.withK(() => { D.rod("iron", Q, [0, 0, 0], [0, -.95, 0], .008, 4); D.tor("iron", .03, .006, 3, 8, Q.m(0, -.98, 0)); laterne(D, Q, 0, -1.4, 0, false); }), G); D.haloPts([V3(0, -1.26, 0)], G, .55, 0xffc070);
    const ph = R() * 9; CTX.tick((dt, t) => { G.rotation.z = Math.sin(t * .6 + ph) * .035; G.rotation.x = Math.sin(t * .43 + ph) * .02; }); }
}

/* =====================================================================
   optik1 · Spiegelkabinett (Jahrmarkt)
   Schachbrettboden aus glänzenden Fliesen, rot-goldene Samtdraperie mit Lambrequin, bemalter Jahrmarkt-Sockel, gestreiftes Zeltdach,
   vergoldete Pfeiler mit Glühbirnenreihen und Glühbirnenbögen über die Decke (sanftes Lauflicht), Zerrspiegel neben den Türen,
   Birnenbögen um die Türen; warmes, rot-goldenes Licht. Ausstattung: Standspiegel, Zerrspiegel, Absperrkordeln, Plakate, Spiegelkugel.
   ===================================================================== */
Object.assign(TX, {
  schach: () => ctex(512, 512, "schach", (g, w, h, r) => { const c = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const dark = (i + j) % 2; g.fillStyle = dark ? "#16110f" : "#dcd2be"; g.fillRect(i * c, j * c, c, c);
      for (let v = 0; v < 5; v++) { g.strokeStyle = dark ? `rgba(120,100,90,${.12 + r() * .15})` : `rgba(150,130,110,${.12 + r() * .2})`; g.lineWidth = .6 + r() * 1.6; let x = i * c + r() * c, y = j * c + r() * c, a = r() * TAU;
        g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 14; k++) { a += (r() - .5) * .8; x += Math.cos(a) * 12; y += Math.sin(a) * 12; g.lineTo(Math.max(i * c, Math.min(i * c + c, x)), Math.max(j * c, Math.min(j * c + c, y))); } g.stroke(); }
      g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(i * c, j * c, c, 3); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(i * c, j * c + c - 3, c, 3); g.fillRect(i * c + c - 3, j * c, 3, c); } }, [1, 1]),
  samt: () => ctex(512, 512, "samt", (g, w, h, r) => { for (let x = 0; x < w; x++) { const f = .5 + .5 * Math.sin(x / w * TAU * 4 + Math.sin(x / w * TAU) * .6), L = 13 + 22 * Math.pow(f, 1.6);
      g.fillStyle = hsl(356, 72, L); g.fillRect(x, 0, 1, h); }
    for (let i = 0; i < 5000; i++) { g.fillStyle = r() < .5 ? "rgba(0,0,0,.07)" : "rgba(255,190,170,.05)"; g.fillRect(r() * w, r() * h, 1, 2 + r() * 6); } }, [1, 1]),
  rummel: () => ctex(1024, 256, "rummel", (g, w, h, r) => { g.fillStyle = "#3a0e0c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x = i * 256 + 14, y = 24, pw = 228, ph = h - 48; g.fillStyle = i % 2 ? "#1e4a46" : "#a3221a"; g.fillRect(x, y, pw, ph);
      g.strokeStyle = "#e0b04a"; g.lineWidth = 6; g.strokeRect(x + 6, y + 6, pw - 12, ph - 12); g.lineWidth = 2; g.strokeRect(x + 16, y + 16, pw - 32, ph - 32);
      g.strokeStyle = "#f0c860"; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 40, y + ph / 2); g.bezierCurveTo(x + 80, y + 30, x + 110, y + ph - 30, x + pw / 2, y + ph / 2); g.bezierCurveTo(x + pw - 110, y + 30, x + pw - 80, y + ph - 30, x + pw - 40, y + ph / 2); g.stroke();
      g.fillStyle = "#f0c860"; g.beginPath(); g.arc(x + pw / 2, y + ph / 2, 12, 0, TAU); g.fill(); }
    g.fillStyle = "#e0b04a"; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); speck(g, r, w, h, 3000, .1, ["#000", "#fff"]); }, [1, 1]),
  lambrequin: () => ctex(512, 128, "lambrequin", (g, w, h) => { g.clearRect(0, 0, w, h); const n = 8, lw = w / n;
    g.fillStyle = "#8e1418"; g.fillRect(0, 0, w, 44); for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(i * lw, 40); g.quadraticCurveTo(i * lw + lw / 2, 118, (i + 1) * lw, 40); g.fill(); }
    g.strokeStyle = "#e8b84e"; g.lineWidth = 5; for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(i * lw, 44); g.quadraticCurveTo(i * lw + lw / 2, 112, (i + 1) * lw, 44); g.stroke(); }
    g.fillStyle = "#e8b84e"; g.fillRect(0, 6, w, 6); g.fillRect(0, 30, w, 4); for (let i = 0; i < n; i++) { const x = i * lw + lw / 2; g.beginPath(); g.arc(x, 82, 7, 0, TAU); g.fill(); g.fillRect(x - 3, 86, 6, 16); g.beginPath(); g.moveTo(x - 9, 118); g.lineTo(x + 9, 118); g.lineTo(x + 3, 100); g.lineTo(x - 3, 100); g.fill(); } }, [1, 1]),
  zelt: () => ctex(256, 64, "zelt", (g, w, h) => { g.fillStyle = "#9e1c18"; g.fillRect(0, 0, w / 2, h); g.fillStyle = "#efe2c4"; g.fillRect(w / 2, 0, w / 2, h);
    for (let x = 0; x < w; x++) { g.fillStyle = `rgba(0,0,0,${.18 * Math.pow(Math.abs(Math.sin(x / w * TAU)), 3)})`; g.fillRect(x, 0, 1, h); } }, [1, 1]),
  plakat: () => ctex(512, 768, "plakat", (g, w, h, r) => { g.fillStyle = "#efe0bc"; g.fillRect(0, 0, w, h); speck(g, r, w, h, 4000, .15, ["#8a6a3a", "#fff"]);
    g.strokeStyle = "#a3221a"; g.lineWidth = 14; g.strokeRect(14, 14, w - 28, h - 28); g.strokeStyle = "#1e4a46"; g.lineWidth = 4; g.strokeRect(34, 34, w - 68, h - 68);
    g.fillStyle = "#a3221a"; g.textAlign = "center"; g.font = `700 64px ${FONT}`; g.fillText("Großes", w / 2, 120); g.font = `700 70px ${FONT}`; g.fillText("Spiegel-", w / 2, 196); g.fillText("kabinett", w / 2, 268);
    // zwei Spiegelbilder: lang und dünn, kurz und breit
    for (const [x, sx, sy] of [[w * .3, .55, 1.6], [w * .7, 1.7, .62]]) { g.save(); g.translate(x, 520); g.strokeStyle = "#c9a04a"; g.lineWidth = 8; g.beginPath(); g.ellipse(0, 0, 90, 150, 0, 0, TAU); g.stroke();
      g.scale(sx, sy); g.fillStyle = "#1e1a18"; g.beginPath(); g.arc(0, -55, 20, 0, TAU); g.fill(); g.fillRect(-22, -32, 44, 60); g.fillRect(-20, 28, 14, 50); g.fillRect(6, 28, 14, 50); g.fillRect(-36, -28, 12, 46); g.fillRect(24, -28, 12, 46); g.restore(); }
    g.fillStyle = "#1e4a46"; g.font = `italic 600 38px ${FONT}`; g.fillText("Staunen · Lachen · Wundern", w / 2, 718); }),
  // Umgebung für die Spiegel: roter Samt, Birnenreihen, Schachbrett (gleiche Größe wie die Weltumgebung → gleiche Shader)
  envRot: () => { const t = ctex(512, 256, "env-rot", (g, w, h, r) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#4a2a24"); gr.addColorStop(.35, "#7a3a2c"); gr.addColorStop(.5, "#c8946a"); gr.addColorStop(.56, "#3a2420"); gr.addColorStop(1, "#1a1210");
      g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = `rgba(0,0,0,${.25 * Math.abs(Math.sin(x / 32 * PI))})`; g.fillRect(x, h * .2, 8, h * .3); }
      for (let i = 0; i < 64; i++) { const x = (i + .5) * w / 64, y = h * (.3 + .06 * Math.sin(i * .7)); blob(g, x, y, 7, 7, "rgba(255,230,170,1)"); }
      for (let y = h * .62; y < h; y += 16) for (let x = ((y / 16) % 2) * 16; x < w; x += 32) { g.fillStyle = "rgba(230,220,200,.35)"; g.fillRect(x, y, 16, 16); } }); t.mapping = T3.EquirectangularReflectionMapping; return t; },
  augeIris: () => ctex(128, 128, "auge-iris", (g, w, h) => { g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(64, 64, 8, 64, 64, 60); gr.addColorStop(0, "#3a6a9a"); gr.addColorStop(.7, "#2a4a7a"); gr.addColorStop(1, "#1a2a4a");
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = "#0a0a0c"; g.beginPath(); g.arc(64, 64, 22, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(50, 50, 7, 0, TAU); g.fill(); }),
  facetten: () => ctex(256, 128, "facetten", (g, w, h, r) => { for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { const v = 150 + r() * 105 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 7, 7); } g.fillStyle = "#222"; })
});
// Glühbirnen-Lauflicht: InstancedMesh (eine Zeichnung) + Lichthöfe; Phase je Birne = p.w; jede Birne ändert sich langsamer als 0,4 Hz
function birnenkette(ctx, A, list, size = .045){
  const n = list.length; if (!n) return;
  const im = new T3.InstancedMesh(new T3.SphereGeometry(size, 8, 6), mt("o1-birne", () => KB({color: 0xffffff, toneMapped: false})), n), m4 = new T3.Matrix4(), col = new T3.Color();
  list.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m4); im.setColorAt(i, col.setRGB(1, .85, .5)); }); im.userData.noPick = true; im.castShadow = false; A.G.add(im);
  const pos = new Float32Array(n * 3), cs = new Float32Array(n * 3); list.forEach((p, i) => pos.set([p.x, p.y, p.z], i * 3));
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(pos, 3)); g.setAttribute("color", new T3.BufferAttribute(cs, 3));
  const pts = new T3.Points(g, new T3.PointsMaterial({map: U.glowTex(), size: .42, vertexColors: true, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false}));
  pts.renderOrder = 3; pts.userData.noPick = true; A.G.add(pts);
  ctx.tick((dt, t) => { for (let i = 0; i < n; i++) { const b = .5 + .5 * (.5 + .5 * Math.sin(list[i].w - t * 2.2)); col.setRGB(b, .84 * b, .52 * b); im.setColorAt(i, col);
      cs[i * 3] = .85 * b; cs[i * 3 + 1] = .62 * b; cs[i * 3 + 2] = .32 * b; } im.instanceColor.needsUpdate = true; g.attributes.color.needsUpdate = true; });
}
// Zerrspiegel: gewölbte Spiegelfläche (art 0 bauchig, 1 hohl, 2 Wellen, 3 Sanduhr) im Goldrahmen mit Bogen; m = Lage (Mitte unten, Vorderseite +z)
function zerrSpiegel(K, m, W, Hh, art, y0 = .25, bogen = true){
  const g = new T3.PlaneGeometry(W, Hh, 10, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (W / 2), y = p.getY(i) / (Hh / 2); let d = 0, sx = 1;
    if (art === 0) d = .13 * (1 - x * x) * (1 - y * y); else if (art === 1) d = .07 * (x * x + y * y); else if (art === 2) d = .045 * Math.sin(y * PI * 3.5) * (1 - .3 * x * x); else { sx = .62 + .38 * Math.abs(y); d = .04 * Math.cos(y * PI * 2); }
    p.setXYZ(i, p.getX(i) * sx, p.getY(i) + y0 + Hh / 2, d + .05); }
  g.computeVertexNormals(); K.add("spiegel", g, m.clone());
  const fw = .09, top = y0 + Hh; for (const s of [-1, 1]) { K.box("gold", fw, Hh + fw, .1, m.clone().multiply(M(s * (W / 2 + fw / 2), y0 + Hh / 2, .05))); K.box("gold", W + 2 * fw, fw, .1, m.clone().multiply(M(0, s < 0 ? y0 - fw / 2 : top + fw / 2, .05))); }
  if (bogen) { K.add("gold", new T3.TorusGeometry(W / 2 + fw / 2, fw / 2, 6, 20, PI), m.clone().multiply(M(0, top + fw, .05))); K.add("gold", new T3.SphereGeometry(.08, 10, 8), m.clone().multiply(M(0, top + W / 2 + fw * 1.6, .05))); }
  K.box("rotlack", W + .3, y0, .2, m.clone().multiply(M(0, y0 / 2, .1)));
}
function spiegelkabinett(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ, bulbs = [];
  A.boden(mt("o1-boden", () => S({map: TX.schach(), roughness: .2, metalness: .05})), 1.6);
  A.mesh(A.wandGeo(0, 1.1, 4, null), mt("o1-sockel", () => S({map: TX.rummel(), roughness: .55})));
  A.mesh(A.wandGeo(1.1, H, 1.6, null), mt("o1-samt", () => S({map: TX.samt(), roughness: .95})));
  A.decke(mt("o1-zelt", () => S({map: TX.zelt(), roughness: .9, emissive: 0x2a0a08, emissiveIntensity: .4})), 1.0);
  for (const w of Object.values(WL)) { K.add("lambrequin", new T3.PlaneGeometry(w.len, .9), w.m(0, H - .45, .06), {uv: [w.len / 2.0, 1]}); K.box("gold", w.len, .07, .06, w.m(0, 1.1, .03)); K.box("gold", w.len, .1, .1, w.m(0, H - .05, .05)); }
  // Pfeiler mit Birnenreihe; Birnenbögen über die Decke
  P.forEach((z, j) => { for (const s of [-1, 1]) { const x = s * 7.9;
      K.box("gold", .54, H - .1, .14, M(x, (H - .1) / 2, z)); K.box("rotlack", .36, H - .9, .03, M(x - s * .075, (H - .9) / 2 + .45, z));
      for (let k = 0; k < 11; k++) bulbs.push(Object.assign(V3(x - s * .1, .7 + k * .46, z), {w: k * .7 + j})); A.hindernis(x, z, .3, .6); }
    const pts = []; for (let i = 0; i <= 24; i++) { const u = -1 + 2 * i / 24, x = u * 7.82; pts.push(V3(x, 5.62 + .78 * (1 - u * u), z)); }
    K.add("gold", new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 40, .05, 6), M()); pts.forEach((p, i) => { if (i % 1 === 0 && i > 0 && i < 24) bulbs.push(Object.assign(V3(p.x, p.y - .07, p.z), {w: Math.abs(i - 12) * .7 + j * .5})); });
    A.belege({x0: -8, x1: 8, y0: 5.5, y1: H, z0: z - .15, z1: z + .15}); });
  // Stirn- und Rückwand: Zerrspiegel neben den Türen, Birnenbogen um die Tür
  for (const [w, zW, n] of [[WL.front, B.z1, 1], [WL.back, B.z0, -1]]) { const u = x => w.u(x, zW);
    [[-6.4, 0], [-4.0, 2], [4.0, 1], [6.4, 3]].forEach(([x, art], i) => zerrSpiegel(K, w.m(u(x), 0, 0), 1.25, 2.6, (art + (n < 0 ? 2 : 0)) % 4));
    for (let i = 0; i <= 16; i++) { const a = PI * i / 16, x = Math.cos(a) * 1.85, y = 4.45 + Math.sin(a) * 1.8; const v = w.pos(u(x), y, .1); bulbs.push(Object.assign(v, {w: Math.abs(i - 8) * .8})); }
    K.add("gold", new T3.TorusGeometry(1.85, .045, 6, 32, PI), w.m(u(0), 4.45, .06, 0, 0, 0, 1, 1.8 / 1.85, 1)); }
  birnenkette(ctx, A, bulbs);
  for (const [s, z] of [[-1, 4.5], [1, -4.5]]) A.lampe(V3(s * 7.2, 3.4, z));
  A.fertig([["gold", () => mt("o1-gold", () => S({color: 0xd8a848, metalness: .85, roughness: .3}))], ["rotlack", () => mt("o1-rot", () => S({color: 0x8e1418, roughness: .4}))],
    ["lambrequin", () => mt("o1-lambr", () => S({map: TX.lambrequin(), alphaTest: .4, roughness: .8, side: T3.DoubleSide}))],
    ["spiegel", () => mt("o1-spiegel", () => S({color: 0xdfe4e6, metalness: 1, roughness: .04}))]]);
  return {punkt: [[0xffb070, 6.8, 13, -6.9, 3.4, 4.5], [0xffb070, 6.8, 13, 6.9, 3.4, -4.5], [0xff9c78, 5.5, 13, 0, 4.6, -9.4]],
    flackern: (t, L) => L.forEach((l, i) => { l.intensity = l.userData.i0 * (.96 + .04 * Math.sin(t * 1.1 + i * 2)); })};
}
function spiegelDekor(D){
  dekorMat(D); const st = D.st(), {CTX, WL, R} = st, ri = 2, C = D.COMP;
  const K = () => D.st().K;
  C.t_zerr = (w, a) => ({b: [D.q(w, a, -.7, .7, 0, 2.5, .45, true)], build: F => { zerrSpiegel(K(), F.m(0, 0, .12), 1.1, 1.95, (R() * 4) | 0, .3, false); D.bx("dark", .6, .05, .4, F.m(0, .025, .25)); }});   // flach oben: unter den Tafeln
  C.t_psyche = (w, a) => ({b: [D.q(w, a, -.6, .6, 0, 1.9, .75, true)], build: F => { D.chevalMirror(F, 0, .38, (R() - .5) * .4); }});
  C.t_kordel = (w, a) => ({b: [D.q(w, a, -1.3, 1.3, 0, 1.05, .55, true)], build: F => { for (const x of [-1.15, 0, 1.15]) { D.cy("brass", .13, .15, .04, 14, F.m(x, .02, .4)); D.cy("brass", .025, .025, .92, 8, F.m(x, .48, .4)); D.sp("brass", .045, 10, 8, F.m(x, .96, .4)); }
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([s * 1.15 * (1 - t), .9 - .2 * Math.sin(t * PI), .4]); } D.tub("velvet", F, pts, .022, 16, 6, "#9a1418"); } }});
  C.t_vitrine = (w, a) => ({b: [D.q(w, a, -.72, .72, 0, 2.0, .6, true)], build: F => { D.vitrine(F, 0, 1.3, .52, (Cc, y0, y1) => { for (let i = 0; i < 3; i++) D.st().K.add("glass", new T3.CylinderGeometry(.06, .06, .14, 3), Cc.m(-.35 + i * .3, y0 + .07, .26, 0, i), {});
      for (const s of [-1, 1]) { D.cy("mirror", .09, .09, .008, 20, Cc.m(s * .3, y1 + .1, .2, PI / 2 - .2)); D.cy("brass", .02, .03, .1, 8, Cc.m(s * .3, y1 + .05, .2)); } }, {col: "#6a1622"}); }});
  // 1) oben freie Felder: Plakat oder ovaler Spiegel im Goldrahmen
  const P = felder(D); let k = 0;
  for (const p of P.filter(p => p.up)) { const F = D.FW(p.w, p.z), L = p.lift;
    if (k++ % 2 === 0) { if (D.claim(D.q(p.w, p.z, -.8, .8, 2.9 + L, 5.4, .1))) { D.pln("t_plakat", 1.4, 2.1, F.m(0, 4.12 + L / 2, .03)); for (const s of [-1, 1]) D.bx("gilt", 1.5, .06, .05, F.m(0, 4.12 + L / 2 + s * 1.06, .03)); p.done = true; } }
    else if (D.claim(D.q(p.w, p.z, -.85, .85, 2.9 + L, 5.4, .14))) { D.picture(F, 0, 4.1 + L / 2, 1.3, 2.0, null, {mirror: true, oval: true, wire: false}); p.done = true; } }
  // 2) unten: Zerrspiegel, Standspiegel, Absperrkordeln, Vitrine mit Prismen
  moebel(D, P, ["t_zerr", "t_psyche", "t_kordel", "t_zerr", "t_vitrine", "t_kordel", "t_zerr"], ri, ["t_zerr", "t_kordel"]);
  wandKlein(D, P.filter(p => !p.low), [{w: .5, y0: 1.95, y1: 2.67, d: .1, fn: (F, x) => D.wallMirror(F, x)}, {w: .5, y0: 1.95, y1: 2.67, d: .1, fn: (F, x) => D.picture(F, x, 2.3, .34, .46, null, {mirror: true, wire: false, fw: .05})}]);
  // 3) Ecken: Standspiegel und Zerrspiegel
  ecken(D, (w, a, F, i) => { if (D.claim(D.q(w, a, -.5, .5, 0, 3.15, .4, true))) zerrSpiegel(K(), F.m(0, 0, .1), .8, 2.1, (i + 1) % 4, .3); });
  // 4) Luftraum: Kristalllüster vorn, Spiegelkugel hinten
  const placed = [], A_ = luft(D, placed, [4.8, 5.6, 4.0, 6.4, 3.2], [0, -3.3, 3.3], .82, 4.55, HOEHE); if (A_) D.prismLuster(...A_);
  const Bz = luft(D, placed, [-4.6, -5.4, -3.8, -6.2, -3.0], [0, 3.3, -3.3], .45, 4.6, HOEHE);
  if (Bz) { const [x, z] = Bz, G = D.group(M(x, HOEHE, z)), Q = D.I4();
    D.meshes(D.withK(() => { D.rod("iron", Q, [0, 0, 0], [0, -.95, 0], .008, 4); D.cy("brass", .06, .08, .04, 10, Q.m(0, -.02, 0)); }), G);
    const ball = new T3.Mesh(new T3.SphereGeometry(.34, 24, 16), mt("o1-kugel", () => S({map: TX.facetten(), color: 0xe8ecf0, metalness: 1, roughness: .18}))); ball.position.y = -1.3; ball.userData.noPick = true; G.add(ball);
    const sp = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, e = (i % 3 - 1) * .5; sp.push(V3(Math.cos(a) * Math.cos(e) * .35, -1.3 + Math.sin(e) * .35, Math.sin(a) * Math.cos(e) * .35)); }
    const sparkle = D.haloPts(sp, G, .16, 0xffffff), cols = new Float32Array(sp.length * 3); sparkle.geometry.setAttribute("color", new T3.BufferAttribute(cols, 3)); sparkle.material.vertexColors = true;
    CTX.tick((dt, t) => { ball.rotation.y += dt * .25; for (let i = 0; i < sp.length; i++) { const kk = Math.max(0, Math.sin(t * (1.2 + (i % 4) * .3) + i * 1.7)) ** 10; cols[i * 3] = cols[i * 3 + 1] = cols[i * 3 + 2] = kk; } sparkle.geometry.attributes.color.needsUpdate = true; }); }
}

/* =====================================================================
   optik2 · Laden des Optikers
   Ladenlokal: Fliesenboden (Achteck und Punkt), Holzsockel und Streifentapete, Blechdecke, Glasschränke voller Brillen an den Pfeilern
   mit Gaslampen, an der Stirnwand zwei große Schaufenster mit Spiegelschrift und Auslage (Riesenbrille, Brillenständer, Augenmodell,
   Lupe) und Blick auf die abendliche Straße; an der Rückwand Ladentheke mit Registrierkasse, Schubladenwand, Sehprobentafel.
   Ausstattung: Thekenstücke, Brillenständer (dreht sich), Vitrinen, Kamera, Fernrohr, Kundenstuhl, Plakate, Brillenschild, Gaslüster.
   ===================================================================== */
Object.assign(TX, {
  fliesen: () => ctex(512, 512, "fliesen", (g, w, h, r) => { const c = 128, k = 38; g.fillStyle = "#b8ae9a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * c, y = j * c, oct = (i + j) % 2 ? "#c2b090" : "#d8ccb2";
      g.fillStyle = oct; g.beginPath(); g.moveTo(x + k, y + 2); g.lineTo(x + c - k, y + 2); g.lineTo(x + c - 2, y + k); g.lineTo(x + c - 2, y + c - k); g.lineTo(x + c - k, y + c - 2); g.lineTo(x + k, y + c - 2); g.lineTo(x + 2, y + c - k); g.lineTo(x + 2, y + k); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,255,.06)"; g.fill(); }
    g.fillStyle = "#8a3a28"; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) { g.save(); g.translate(i * c, j * c); g.rotate(PI / 4); g.fillRect(-k * .66, -k * .66, k * 1.32, k * 1.32); g.restore(); }
    speck(g, r, w, h, 5000, .12, ["#000", "#fff"]); }, [1, 1]),
  tapeteLaden: () => ctex(256, 256, "tapete-laden", (g, w, h, r) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#e9e0c8" : "#7f9a86"; g.fillRect(i * w / 4, 0, w / 4, h); }
    g.fillStyle = "rgba(200,160,80,.7)"; for (let i = 0; i < 4; i++) g.fillRect(i * w / 4 - 1, 0, 2, h);
    for (let y = 16; y < h; y += 64) { g.fillStyle = "#b8904a"; for (const x of [w / 8, w * 5 / 8]) { g.beginPath(); g.arc(x + (y % 128 ? 0 : w / 4), y, 4, 0, TAU); g.fill(); } }
    speck(g, r, w, h, 1500, .08, ["#000", "#fff"]); }, [1, 1]),
  blech: () => ctex(256, 256, "blech", (g, w, h) => { g.fillStyle = "#e6dfcc"; g.fillRect(0, 0, w, h); const c = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * c, y = j * c; g.strokeStyle = "rgba(255,255,250,.7)"; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, c - 12, c - 12); g.strokeStyle = "rgba(120,100,70,.35)"; g.strokeRect(x + 9, y + 9, c - 12, c - 12);
      const cx = x + c / 2, cy = y + c / 2; for (const [rr, col] of [[34, "rgba(120,100,70,.3)"], [30, "rgba(255,255,250,.6)"], [14, "rgba(120,100,70,.35)"]]) { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke(); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.fillStyle = "rgba(120,100,70,.3)"; g.beginPath(); g.ellipse(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 6, 3, a, 0, TAU); g.fill(); } } }, [1, 1]),
  // Blick aus den Schaufenstern: abendliche Straße (links und rechts je eine Hälfte)
  strasse: () => ctex(1024, 512, "strasse", (g, w, h, r) => {
    const sky = g.createLinearGradient(0, 0, 0, h * .45); sky.addColorStop(0, "#1a2448"); sky.addColorStop(.7, "#4a4a6a"); sky.addColorStop(1, "#c08a62"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const x0 = i * w / 9, bw = w / 9 + 2, top = h * (.08 + r() * .12), col = hsl(20 + r() * 20, 18 + r() * 14, 22 + r() * 10); g.fillStyle = col; g.fillRect(x0, top, bw, h * .62 - top);
      g.fillStyle = "#14100e"; g.fillRect(x0, top - 6, bw, 8); for (let k = 0; k < 2; k++) g.fillRect(x0 + 14 + k * 50, top - 26, 12, 22);
      for (let fy = top + 20; fy < h * .44; fy += 52) for (let fx = x0 + 12; fx < x0 + bw - 30; fx += 38) { const lit = r() < .45; g.fillStyle = lit ? "#f0c070" : "#1e2230"; g.fillRect(fx, fy, 20, 30); if (lit) blob(g, fx + 10, fy + 15, 26, 26, "rgba(255,200,120,.25)"); }
      g.fillStyle = r() < .5 ? "#2a3a30" : "#3a2420"; g.fillRect(x0 + 6, h * .46, bw - 12, h * .16); g.fillStyle = "#f2c878"; g.fillRect(x0 + 16, h * .49, bw - 32, h * .1); blob(g, x0 + bw / 2, h * .55, 70, 40, "rgba(255,210,140,.35)"); }
    const st = g.createLinearGradient(0, h * .62, 0, h); st.addColorStop(0, "#3a3430"); st.addColorStop(1, "#1a1816"); g.fillStyle = st; g.fillRect(0, h * .62, w, h * .38);
    for (let y = h * .66; y < h; y += 10) for (let x = (y / 10 % 2) * 9; x < w; x += 18) { g.fillStyle = `rgba(255,220,170,${r() * .12})`; g.fillRect(x, y, 14, 6); }
    g.fillStyle = "#4a4440"; g.fillRect(0, h * .62, w, 10);
    for (const lx of [w * .22, w * .74]) { blob(g, lx, h * .3, 120, 110, "rgba(255,226,160,.55)"); g.fillStyle = "#0e0e10"; g.fillRect(lx - 4, h * .32, 8, h * .32); g.fillStyle = "#fff0c4"; g.fillRect(lx - 9, h * .27, 18, 22); g.fillStyle = "#0e0e10"; g.beginPath(); g.moveTo(lx - 14, h * .27); g.lineTo(lx, h * .23); g.lineTo(lx + 14, h * .27); g.fill(); }
    g.fillStyle = "#0e0c0c"; { const cx = w * .52, cy = h * .7; g.fillRect(cx - 50, cy - 70, 90, 60); g.beginPath(); g.arc(cx - 20, cy, 30, 0, TAU); g.fill(); g.beginPath(); g.arc(cx + 40, cy + 6, 22, 0, TAU); g.fill(); g.fillRect(cx + 40, cy - 30, 70, 6);
      g.beginPath(); g.ellipse(cx + 120, cy - 30, 26, 34, 0, 0, TAU); g.fill(); g.fillRect(cx + 108, cy - 10, 10, 50); g.fillRect(cx + 128, cy - 10, 10, 50); }
    { const px = w * .88, py = h * .62; g.fillRect(px - 10, py - 96, 20, 70); g.beginPath(); g.arc(px, py - 108, 12, 0, TAU); g.fill(); g.fillRect(px - 14, py - 136, 28, 18); g.fillRect(px - 20, py - 120, 40, 4); g.fillRect(px - 8, py - 26, 7, 26); g.fillRect(px + 2, py - 26, 7, 26); }
    const fog = g.createLinearGradient(0, h * .3, 0, h); fog.addColorStop(0, "rgba(150,150,170,0)"); fog.addColorStop(1, "rgba(150,150,165,.35)"); g.fillStyle = fog; g.fillRect(0, 0, w, h);
    speck(g, r, w, h, 3000, .1, ["#000", "#fff"]); }),
  // Goldschrift auf den Schaufenstern (von innen gesehen in Spiegelschrift): oben links „OPTIKER“, unten rechts „BRILLEN · LUPEN“
  schrift: () => ctex(1024, 512, "schrift", (g, w, h) => { g.clearRect(0, 0, w, h);
    const zeile = (txt, y, sz) => { g.save(); g.translate(w, 0); g.scale(-1, 1); g.font = `700 ${sz}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 10; g.strokeStyle = "rgba(40,20,5,.9)"; g.strokeText(txt, w / 2, y);
      const gr = g.createLinearGradient(0, y - sz / 2, 0, y + sz / 2); gr.addColorStop(0, "#fff0b8"); gr.addColorStop(.5, "#d8a040"); gr.addColorStop(1, "#8a5a18"); g.fillStyle = gr; g.fillText(txt, w / 2, y); g.restore(); };
    zeile("OPTIKER", 120, 170); zeile("BRILLEN · LUPEN", 380, 120); }),
  brillen: () => ctex(256, 512, "brillen", (g, w, h, r) => { g.fillStyle = "#1c3a2c"; g.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { g.fillStyle = r() < .5 ? "rgba(0,0,0,.15)" : "rgba(120,180,140,.06)"; g.fillRect(r() * w, r() * h, 2, 2); }
    for (let row = 0; row < 4; row++) { const y = 40 + row * 128; g.fillStyle = "rgba(220,235,230,.5)"; g.fillRect(0, y + 64, w, 4);
      for (let k = 0; k < 3; k++) { const x = 44 + k * 84, yy = y + 36 + (k % 2) * 6, rr = 15 + (row % 2) * 3; g.strokeStyle = row % 2 ? "#1a1612" : "#e0b860"; g.lineWidth = 4;
        for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 19, yy, rr, rr * .82, 0, 0, TAU); g.stroke(); g.fillStyle = "rgba(200,230,240,.25)"; g.fill(); }
        g.beginPath(); g.moveTo(x - 5, yy - 4); g.quadraticCurveTo(x, yy - 10, x + 5, yy - 4); g.stroke(); } } }),
  schubladen: () => ctex(512, 256, "schubladen", (g, w, h, r) => { g.fillStyle = "#2a180e"; g.fillRect(0, 0, w, h); const nx = 8, ny = 4, cw = w / nx, ch = h / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = i * cw, y = j * ch; g.fillStyle = hsl(22, 40, 22 + r() * 6); g.fillRect(x + 4, y + 4, cw - 8, ch - 8); g.fillStyle = "rgba(255,220,170,.12)"; g.fillRect(x + 4, y + 4, cw - 8, 3);
      g.fillStyle = "#efe6cc"; g.fillRect(x + cw / 2 - 14, y + 14, 28, 12); g.fillStyle = "#c9a04a"; g.fillRect(x + cw / 2 - 12, y + ch - 26, 24, 7); } }),
  // Plakate: Sehprobentafel · Das Auge · Reklame (Atlas 1024 × 512)
  ladenPlakate: () => ctex(1024, 512, "laden-plakate", (g, w, h, r) => {
    g.fillStyle = "#f6f2e6"; g.fillRect(0, 0, 256, 512); g.fillStyle = "#1a1612"; g.textAlign = "center"; g.font = `italic 22px ${FONT}`; g.fillText("Sehprobe", 128, 34);
    [["E", 92], ["F P", 62], ["T O Z", 46], ["L P E D", 36], ["P E C F D", 28], ["E D F C Z P", 22], ["F E L O P Z D", 17], ["D E F P O T E C", 13]].reduce((y, [t, s]) => { g.font = `700 ${s}px Helvetica, Arial, sans-serif`; g.fillText(t, 128, y + s); return y + s * 1.5; }, 46);
    g.fillStyle = "#b3261e"; g.fillRect(28, 470, 100, 18); g.fillStyle = "#2f6b3a"; g.fillRect(128, 470, 100, 18);
    g.save(); g.translate(256, 0); g.fillStyle = "#efe4c8"; g.fillRect(0, 0, 384, 512); speck(g, r, 384, 512, 2000, .12, ["#8a6a3a", "#fff"]); g.strokeStyle = "#3a2614"; g.lineWidth = 4; g.strokeRect(10, 10, 364, 492);
    g.fillStyle = "#3a2614"; g.font = `700 34px ${FONT}`; g.fillText("Das Auge", 192, 58); const cx = 200, cy = 250;
    g.fillStyle = "#f8f4ea"; g.beginPath(); g.arc(cx, cy, 120, 0, TAU); g.fill(); g.strokeStyle = "#3a2614"; g.lineWidth = 3; g.stroke(); g.fillStyle = "#c8506a"; g.beginPath(); g.arc(cx, cy, 112, -1.1, 1.1); g.arc(cx, cy, 104, 1.1, -1.1, true); g.fill();
    g.fillStyle = "rgba(180,220,240,.8)"; g.beginPath(); g.ellipse(cx - 116, cy, 26, 56, 0, PI / 2, PI * 1.5); g.fill(); g.stroke(); g.fillStyle = "#e8d8a0"; g.beginPath(); g.ellipse(cx - 76, cy, 16, 40, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#3a6a9a"; g.fillRect(cx - 98, cy - 58, 8, 34); g.fillRect(cx - 98, cy + 24, 8, 34); g.fillStyle = "#e8c070"; g.fillRect(cx + 108, cy - 14, 70, 28);
    g.strokeStyle = "#d8a020"; g.lineWidth = 2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx - 190, cy + s * 40); g.lineTo(cx - 76, cy + s * 28); g.lineTo(cx + 110, cy - s * 10); g.stroke(); }
    g.fillStyle = "#3a2614"; g.font = `600 17px ${FONT}`; [["Hornhaut", 70, 160], ["Linse", 120, 360], ["Netzhaut", 300, 120], ["Sehnerv", 320, 300]].forEach(([t, x, y]) => g.fillText(t, x, y)); g.restore();
    g.save(); g.translate(640, 0); g.fillStyle = "#1e3a30"; g.fillRect(0, 0, 384, 512); g.strokeStyle = "#d8a848"; g.lineWidth = 6; g.strokeRect(14, 14, 356, 484); g.lineWidth = 2; g.strokeRect(26, 26, 332, 460);
    g.fillStyle = "#f0d68a"; g.font = `700 50px ${FONT}`; g.fillText("Brillen", 192, 100); g.font = `italic 600 40px ${FONT}`; g.fillText("nach Maß", 192, 150);
    g.strokeStyle = "#f0d68a"; g.lineWidth = 7; for (const s of [-1, 1]) { g.beginPath(); g.arc(192 + s * 62, 265, 50, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(180, 255); g.quadraticCurveTo(192, 240, 204, 255); g.stroke();
    g.font = `600 26px ${FONT}`; g.fillText("Lupen · Fernrohre", 192, 380); g.fillText("Operngläser", 192, 416); g.font = `italic 20px ${FONT}`; g.fillText("aus eigener Werkstatt", 192, 462); g.restore(); })
});
// kleine Brille (Gestell aus Messing, Gläser) für Hüllen-Sammler K; m = Lage (Mitte, Gläser in der x-y-Ebene)
function brilleK(K, m, s = 1){ for (const k of [-1, 1]) { K.add("messing", new T3.TorusGeometry(.024 * s, .003 * s, 3, 14), m.clone().multiply(M(k * .03 * s, 0, 0))); K.add("glasS", new T3.CircleGeometry(.023 * s, 10), m.clone().multiply(M(k * .03 * s, 0, .001)));
  K.box("messing", .003 * s, .003 * s, .1 * s, m.clone().multiply(M(k * .055 * s, 0, -.05 * s))); } K.box("messing", .016 * s, .003 * s, .003 * s, m.clone().multiply(M(0, .008 * s, 0))); }
function laden(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ, lamps = A.hu.lampen, tap = mt("o2-tapete", () => S({map: TX.tapeteLaden(), roughness: .85}));
  A.boden(mt("o2-boden", () => S({map: TX.fliesen(), roughness: .38})), 1.2);
  A.mesh(A.wandGeo(0, 1.0, 2.2, null), kmat("wains"));
  A.mesh(A.wandGeo(1.0, H, .8, null, ["left", "right", "back"]), tap);
  A.decke(mt("o2-decke", () => S({map: TX.blech(), roughness: .6, metalness: .2, emissive: 0x2a2620, emissiveIntensity: .5})), 1.2);
  for (const w of Object.values(WL)) { const L2 = w.len - (w.side ? .42 : 0); K.box("stuck", L2, .26, .1, w.m(0, H - .13, .05)); K.box("stuck", L2, .09, .2, w.m(0, H - .045, .1)); K.box("dunkel", w.len, .05, .05, w.m(0, 1.0, .025)); K.box("dunkel", L2, .04, .04, w.m(0, 5.4, .02)); }
  // Stirnwand: Schaufensterfront mit zwei Öffnungen (Tapete), grün gestrichene Rahmen, Laibung nach außen, Straße dahinter
  { const sh = new T3.Shape(); sh.moveTo(-8, 1.0); sh.lineTo(8, 1.0); sh.lineTo(8, H); sh.lineTo(-8, H); sh.closePath();
    for (const s of [-1, 1]) { const a = s * 2.75, b = s * 7.5, ho = new T3.Path(); ho.moveTo(Math.min(a, b), 1.0001); ho.lineTo(Math.min(a, b), 5.5); ho.lineTo(Math.max(a, b), 5.5); ho.lineTo(Math.max(a, b), 1.0001); ho.closePath(); sh.holes.push(ho); }
    const sg = U.scaleUV(new T3.ShapeGeometry(sh, 1), 1 / .8, 1 / .8); const m = A.mesh(sg, tap); m.position.z = B.z1; }
  for (const s of [-1, 1]) { const xc = s * 5.125, Wf = 4.75, z = B.z1;
    K.add("strasse", new T3.PlaneGeometry(Wf, 4.5), M(xc, 3.25, z - .36), {uvr: s < 0 ? [0, 0, .5, 1] : [.5, 0, 1, 1]});
    K.add("schrift", new T3.PlaneGeometry(Wf, Wf / 2), M(xc, 3.75, z - .02), {uvr: s < 0 ? [0, .5, 1, 1] : [0, 0, 1, .5]});
    for (const k of [-1, 1]) K.box("gruen", .14, 4.7, .42, M(xc + k * (Wf / 2 + .07), 3.25, z - .14)); K.box("gruen", Wf + .28, .16, .42, M(xc, 5.58, z - .14));
    for (const k of [-1, 1]) K.box("gruen", .07, 3.5, .08, M(xc + k * Wf / 6, 2.75, z - .05)); K.box("gruen", Wf, .1, .1, M(xc, 4.5, z - .05)); for (let k = 1; k < 6; k++) K.box("gruen", .05, 1.0, .07, M(xc - Wf / 2 + k * Wf / 6, 5.0, z - .05));
    K.box("gruen", Wf + .28, .5, .2, M(xc, 6.05, z + .1)); K.box("gold", Wf, .04, .04, M(xc, 5.86, z + .2));
    // Auslage: Podest mit Samt, Riesenbrille auf Staffelei, Brillenständer, Augenmodell, Lupe
    K.box("dunkel", Wf, .95, .66, M(xc, .475, z + .33)); K.add("wains", new T3.PlaneGeometry(Wf, .7), M(xc, .5, z + .665), {uv: [Wf / 2.2, .7]}); K.add("samt", new T3.BoxGeometry(Wf - .04, .03, .64), M(xc, .965, z + .33));
    { const ex = xc - s * .2, Bm = M(ex, 1.75, z + .32, -.12); for (const k of [-1, 1]) { K.add("messing", new T3.TorusGeometry(.22, .025, 6, 28), Bm.clone().multiply(M(k * .27, 0, 0))); K.add("glasS", new T3.CircleGeometry(.21, 24), Bm.clone().multiply(M(k * .27, 0, .005))); }
      K.add("messing", new T3.TorusGeometry(.06, .02, 5, 12, PI), Bm.clone()); for (const k of [-1, 1]) K.box("dunkel", .04, 1.0, .04, M(ex + k * .35, 1.45, z + .38, -.12)); K.box("dunkel", .04, .9, .04, M(ex, 1.4, z + .15, .35)); }
    for (const [dx, h] of [[-1.7, .55], [1.5, .45], [-.9, .38]]) { const sx = xc + dx * s, y0 = .98; K.add("messing", new T3.CylinderGeometry(.06, .07, .02, 12), M(sx, y0 + .01, z + .35)); K.add("messing", new T3.CylinderGeometry(.008, .008, h, 6), M(sx, y0 + h / 2, z + .35));
      K.box("messing", .34, .012, .012, M(sx, y0 + h, z + .35)); for (const k of [-1, 1]) brilleK(K, M(sx + k * .1, y0 + h - .04, z + .37, -.15)); }
    { const ax = xc + s * .7; K.add("messing", new T3.CylinderGeometry(.008, .05, .3, 10), M(ax, 1.13, z + .4)); K.add("porzellan", new T3.SphereGeometry(.13, 18, 12), M(ax, 1.4, z + .4)); K.add("iris", new T3.CircleGeometry(.055, 18), M(ax, 1.4, z + .531)); }
    A.belege({x0: s < 0 ? -7.6 : 2.65, x1: s < 0 ? -2.65 : 7.6, y0: 0, y1: 2.4, z0: B.z1, z1: B.z1 + .7}); A.hindernis(xc, B.z1 + .33, Wf, .7); }
  // Glasschränke voller Brillen an den Pfeilern, Pilaster mit Kapitell und Gaslampe
  for (const w of [WL.left, WL.right]) { const s = w === WL.left ? -1 : 1;
    for (const z of P) { const u = w.u(w.o[0], z), x = s * 7.775;
      K.box("dunkel", .45, .55, .9, M(x, .275, z)); K.box("dunkel", .45, .14, .9, M(x, 2.13, z)); for (const k of [-1, 1]) K.box("dunkel", .45, 1.52, .05, M(x, 1.31, z + k * .425));
      K.add("brillen", new T3.PlaneGeometry(.8, 1.52), w.m(u, 1.31, .02), {}); K.add("glasS", new T3.PlaneGeometry(.8, 1.52), w.m(u, 1.31, .445));
      for (let k = 0; k < 3; k++) K.box("glasS", .42, .012, .8, M(x, .93 + k * .38, z)); K.box("dunkel", .5, .08, .96, M(x - s * .02, 2.22, z)); K.box("gold", .02, .02, .9, M(s * 7.54, 2.16, z));
      K.add("flutes", new T3.PlaneGeometry(.5, H - .56 - 2.26), w.m(u, 2.26 + (H - .56 - 2.26) / 2, .2)); K.box("dunkel", .54, H - .56 - 2.26, .2, w.m(u, 2.26 + (H - .56 - 2.26) / 2, .095));
      K.box("gold", .62, .14, .26, w.m(u, H - .5, .13)); H_.gasLamp(K, w, u, lamps);
      A.hindernis(x, z, .5, 1.0); A.belege(ctx.wand(w === WL.left ? "left" : "right", z, 0, 2.3, 1.0, .5)); A.belege(ctx.wand(w === WL.left ? "left" : "right", z, LY - .2, LY + .55, .5, .8)); } }
  // Rückwand: Ladentheke mit Glasaufsatz, Registrierkasse, Spiegel; dahinter Schubladenwand, Regale mit Etuis, Sehprobentafel und Reklame
  for (const s of [-1, 1]) { const xc = s * 5.15, Wt = 4.6, zt = B.z0 - .7, z = B.z0;
    K.box("dunkel", Wt, .9, .6, M(xc, .45, zt)); K.add("wains", new T3.PlaneGeometry(Wt, .7), M(xc, .45, zt - .301, 0, PI, 0), {uv: [Wt / 2.2, .7]}); K.box("dunkel", Wt + .1, .04, .66, M(xc, .92, zt));
    K.add("samt", new T3.BoxGeometry(Wt - .1, .02, .5), M(xc, .95, zt)); K.box("glasS", Wt - .1, .24, .52, M(xc, 1.06, zt)); K.box("messing", Wt - .1, .02, .02, M(xc, 1.18, zt - .26));
    for (let k = 0; k < 8; k++) brilleK(K, M(xc - Wt / 2 + .35 + k * .55, .975, zt + .05, -PI / 2 + .2, PI), 1);
    K.add("schublade", new T3.PlaneGeometry(Wt, 1.7), M(xc, 1.75, z - .03, 0, PI, 0)); K.box("dunkel", Wt + .1, .06, .3, M(xc, 2.63, z - .15));
    for (const y of [3.05, 3.55, 4.05]) { K.box("dunkel", Wt, .04, .26, M(xc, y, z - .13)); for (let k = 0; k < 11; k++) K.box("vc", .26, .07, .12, M(xc - Wt / 2 + .25 + k * .41, y + .055, z - .12, 0, (k % 3 - 1) * .08, 0), {c: ["#1f3a5a", "#6a1a1a", "#1a1a1a", "#2a4a3a"][k % 4]}); }
    K.add("plakat", new T3.PlaneGeometry(s < 0 ? .85 : 1.2, 1.6), M(xc, 5.0, z - .04, 0, PI, 0), {uvr: s < 0 ? [0, 0, .25, 1] : [.625, 0, 1, 1]}); K.box("gold", s < 0 ? .95 : 1.3, 1.7, .03, M(xc, 5.0, z - .015));
    A.belege({x0: s < 0 ? -7.6 : 2.75, x1: s < 0 ? -2.75 : 7.6, y0: 0, y1: 4.3, z0: zt - .35, z1: z}); A.hindernis(xc, zt + .2, Wt, 1.0); }
  // Registrierkasse (links) und Standspiegel (rechts) auf der Theke
  { const x = -4.3, z = B.z0 - .72; K.box("messing", .46, .32, .36, M(x, 1.14, z)); K.box("messing", .4, .22, .2, M(x, 1.38, z + .06, -.4)); K.box("dunkel", .5, .05, .4, M(x, .98, z));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) K.add("porzellan", new T3.CylinderGeometry(.018, .018, .03, 8), M(x - .12 + i * .08, 1.32 + j * .035, z - .1 - j * .04, -.6)); K.box("porzellan", .3, .08, .01, M(x, 1.55, z + .1)); }
  { const x = 4.5, z = B.z0 - .72; K.add("messing", new T3.CylinderGeometry(.1, .12, .03, 14), M(x, .98, z)); K.add("messing", new T3.CylinderGeometry(.012, .012, .35, 6), M(x, 1.15, z));
    K.add("spiegelL", new T3.CircleGeometry(.2, 24), M(x, 1.52, z - .015, 0, PI, 0)); K.add("messing", new T3.TorusGeometry(.2, .015, 6, 28), M(x, 1.52, z)); }
  A.fertig([["dunkel", ST.dunkel, {cast: true}], ["stuck", () => kmat("stucco")], ["gold", () => kmat("gilt")], ["messing", ST.messing], ["glasS", ST.glas, {receive: false}], ["porzellan", ST.porzellan],
    ["vc", ST.vc, {color: true}], ["flutes", () => kmat("flutes")], ["wains", () => kmat("wains")], ["globe", () => kmat("globe")], ["brass", () => mat("brass")],
    ["gruen", () => mt("o2-gruen", () => S({color: 0x1f3a30, roughness: .45}))], ["samt", () => mt("o2-samt", () => S({color: 0x5a1218, roughness: 1}))],
    ["iris", () => mt("o2-iris", () => S({map: TX.augeIris(), roughness: .3}))], ["spiegelL", () => mt("o1-spiegel", () => S({color: 0xdfe4e6, metalness: 1, roughness: .04}))],
    ["strasse", () => mt("o2-strasse", () => KB({map: TX.strasse(), fog: false, toneMapped: false}))], ["schrift", () => mt("o2-schrift", () => KB({map: TX.schrift(), transparent: true, depthWrite: false, toneMapped: false, color: 0xc8b890}))],
    ["brillen", () => mt("o2-brillen", () => S({map: TX.brillen(), roughness: .8}))], ["schublade", () => mt("o2-schub", () => S({map: TX.schubladen(), roughness: .6}))],
    ["plakat", () => mt("o2-plakat", () => S({map: TX.ladenPlakate(), roughness: .8}))]]);
  const wg = K.mesh("wglow", kmat("wglow"), {parent: G, receive: false}); if (wg) wg.renderOrder = 2;
  A.halos(lamps.filter((p, i) => i < 10), 0xffc98a, .75);
  return {punkt: [[0xffc27a, 6, 12, -7.15, 3.0, 4.5], [0xffc27a, 6, 12, 7.15, 3.0, -4.5], [0xa8bce0, 5, 14, 0, 3.4, -9.4]],
    flackern: (t, L) => { for (let i = 0; i < 2; i++) L[i].intensity = L[i].userData.i0 * (.9 + .07 * Math.sin(t * 8.7 + i * 3) * Math.sin(t * 3.9 + i) + .03 * Math.sin(t * 2.7 + i)); }};
}
const LY = H_.LAMP_Y;
function ladenDekor(D){
  dekorMat(D); const st = D.st(), {CTX, WL, R} = st, ri = 3, C = D.COMP, K = () => D.st().K;
  C.t_theke = (w, a) => ({b: [D.q(w, a, -.95, .95, 0, 1.25, .65, true)], build: F => { const {bx} = D; bx("dark", 1.8, .9, .6, F.m(0, .45, .3)); bx("dark", 1.86, .04, .64, F.m(0, .92, .32)); bx("velvet", 1.7, .02, .5, F.m(0, .95, .3), "#5a1218");
    bx("glass", 1.7, .24, .52, F.m(0, 1.06, .3)); for (let k = 0; k < 4; k++) D.spectacles(F, -.6 + k * .4, .96, .32, (R() - .5) * .5); D.magnifier(F, .55, .96, .2, 1); D.bankerLamp(F, -.65, 1.18, .25); }});
  C.t_staender = (w, a) => ({b: [D.q(w, a, -.45, .45, 0, 1.95, .95, true)], build: F => { D.cy("dark", .26, .3, .05, 18, F.m(0, .025, .5)); D.cy("brass", .02, .02, 1.7, 8, F.m(0, .88, .5)); D.sp("brass", .04, 8, 6, F.m(0, 1.75, .5));
    const G = D.group(F.m(0, 0, .5)), Q = D.I4(); D.meshes(D.withK(() => { for (let t = 0; t < 4; t++) { const y = .75 + t * .28; D.cy("brass", .3 - t * .04, .3 - t * .04, .01, 20, Q.m(0, y, 0)); for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + t * .4, rr = .26 - t * .04;
      D.spectacles(Q, Math.cos(an) * rr, y + .01, Math.sin(an) * rr, -an + PI / 2); } } }), G); CTX.tick(dt => { G.rotation.y += dt * .22; }); }});
  C.t_vitrine = (w, a) => ({b: [D.q(w, a, -.72, .72, 0, 2.0, .6, true)], build: F => { D.vitrine(F, 0, 1.3, .52, (Cc, y0, y1) => { D.microscope(Cc, -.3, y0, .26, .4); for (let i = 0; i < 3; i++) D.magnifier(Cc, .1 + i * .14, y0, .2 + (i % 2) * .1, 1 + i);
    for (let i = 0; i < 4; i++) D.spectacles(Cc, -.42 + i * .28, y1, .3, (R() - .5) * .4); }, {col: "#1c3a2c"}); }});
  C.t_kamera = (w, a) => ({b: [D.q(w, a, -.55, .55, 0, 1.6, 1.0, true)], build: F => { D.plateCamera(F, 0, .5, (R() - .5) * .6); }});
  C.t_fernrohr = (w, a) => ({b: [D.q(w, a, -.6, .6, 0, 1.95, 1.05, true)], build: F => { D.telescope(F, 0, .55, PI * .85); }});
  C.t_stuhl = (w, a) => ({b: [D.q(w, a, -.9, .9, 0, 1.2, .8, true)], build: F => { const {bx, cy} = D, Cc = D.subF(F, -.35, .4, .3);
    for (const [x, z] of [[-.2, -.18], [.2, -.18], [-.2, .18], [.2, .18]]) cy("dark", .02, .018, .45, 6, Cc.m(x, .225, z)); bx("velvet", .46, .06, .44, Cc.m(0, .48, 0), "#1c3a2c"); bx("dark", .46, .55, .04, Cc.m(0, .78, -.2));
    const T = D.subF(F, .45, .35); cy("wood", .24, .24, .03, 16, T.m(0, .7, 0)); cy("dark", .03, .04, .68, 8, T.m(0, .34, 0)); bx("dark", .34, .06, .24, T.m(0, .745, 0)); bx("velvet", .32, .01, .22, T.m(0, .78, 0), "#5a1218");
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) D.tor("brass", .018, .003, 3, 10, T.m(-.12 + i * .06, .785, -.07 + j * .07, PI / 2)); }});
  // 1) oben freie Felder: Sehprobentafel, Augen-Tafel, Reklame
  const P = felder(D), cells = [[0, 0, .25, 1, .85, 1.7], [.25, 0, .625, 1, 1.25, 1.66], [.625, 0, 1, 1, 1.25, 1.66]]; let k = 0;
  for (const p of P.filter(p => p.up)) { const F = D.FW(p.w, p.z), L = p.lift, [u0, v0, u1, v1, pw, ph] = cells[k++ % 3];
    if (D.claim(D.q(p.w, p.z, -pw / 2 - .12, pw / 2 + .12, 3.0 + L, 5.3, .1))) { const y = 4.15 + L / 2; D.pln("t_plakate", pw, ph, F.m(0, y, .035), {uvr: [u0, v0, u1, v1]});
      for (const s of [-1, 1]) { D.bx("gilt", pw + .16, .07, .05, F.m(0, y + s * (ph / 2 + .035), .025)); D.bx("gilt", .07, ph, .05, F.m(s * (pw / 2 + .035), y, .025)); } p.done = true; } }
  // 2) unten: Thekenstücke, Brillenständer, Vitrine, Kamera, Fernrohr, Kundenstuhl
  moebel(D, P, ["t_staender", "t_theke", "t_vitrine", "t_kamera", "t_stuhl", "t_fernrohr", "t_theke", "t_staender"], ri, []);
  wandKlein(D, P.filter(p => !p.low), [{w: .5, y0: 1.95, y1: 2.67, d: .1, fn: (F, x) => D.wallMirror(F, x)}, {w: .9, y0: 1.98, y1: 2.6, d: .26, fn: (F, x) => { D.bx("dark", .8, .03, .22, F.m(x, 2.1, .11));
    for (let i = 0; i < 4; i++) D.spectacles(F, x - .3 + i * .2, 2.115, .12, (R() - .5) * .3); for (const s of [-1, 1]) D.bx("brass", .02, .14, .02, F.m(x + s * .3, 2.03, .02)); }}]);
  // 3) Ecken: Palme, Schirmständer
  ecken(D, (w, a, F, i) => { if (i % 2 === 0) { if (D.claim(D.q(w, a, -.3, .3, 0, 1.5, .62, true))) D.plantStand(F, 0, .26, i ? "farn" : "palme", .82, .45, PI - .45, .8); }
    else if (D.claim(D.q(w, a, -.22, .22, 0, 1.25, .46, true))) D.umbrellaStand(F, 0, .22); });
  // 4) Luftraum: zwei Gaslüster, Ladenschild mit Riesenbrille über dem Gang
  const placed = [], A_ = luft(D, placed, [4.8, 5.6, 4.0, 6.4, 3.2], [0, -3.3, 3.3], .82, 4.55, HOEHE); if (A_) D.gasolier(...A_, {drop: .4, s: 1.15});
  const B_ = luft(D, placed, [-4.6, -5.4, -3.8, -6.2, -3.0, -2.2, -7.0], [0, 3.3, -3.3], .82, 4.55, HOEHE); if (B_) D.gasolier(...B_, {drop: .4, s: 1.15});
  const S_ = luft(D, placed, [1.5, 2.5, .5, -.5, 7.2, -7.2], [0, -3.3, 3.3], .9, 4.6, HOEHE); if (S_) D.spectacleSign(...S_);
}

/* ---------- Raumbeschreibungen ---------- */
RAUM.strom1 = {titel: "Werkstatt des Elektrikers",
  licht: {bg: 0x2a2622, nebel: 0x3a332a, dichte: .022, himmel: [0xfff0d0, 0x6a5a46, 1.0], umgebung: [0xffe6c0, .22], sonne: [0xfff0d6, 1.25, [5, 14, 6]], fuell: [0xffe0b8, .5, [-6, 10, -15]]},
  huelle: werkstatt, stimmung: {staub: {farbe: 0xffe2a8, n: 380}}, ausstattung: werkstattDekor};
RAUM.strom2 = {titel: "Keller unter der Laterne",
  licht: {bg: 0x0e0d0b, nebel: 0x191712, dichte: .026, himmel: [0xd2d6da, 0x3a3026, .78], umgebung: [0xc4c8cc, .17], sonne: [0xd6dcea, .9, [-3, 14, -18]], fuell: [0xffd6a8, .38, [-6, 10, 15]]},
  huelle: keller, ausstattung: kellerDekor,
  stimmung: {staub: {farbe: 0xe0dcc8, n: 300}, boden: {n: 16, mat: () => mt("k-bnebel", () => KB({map: tex.fog(), color: 0xb4bcb4, transparent: true, opacity: .3, depthWrite: false, side: T3.DoubleSide}))},
    dunst: {n: 6, mat: () => mt("k-dunst", () => KB({map: tex.fog(), color: 0xa8b0a8, transparent: true, opacity: .12, depthWrite: false, side: T3.DoubleSide}))}}};

// Hilfen für weitere Raumdateien (17_raum_detektiv_<raum>.js)
RAUM.optik1 = {titel: "Spiegelkabinett",
  licht: {bg: 0x1c0c0a, nebel: 0x2a1210, dichte: .02, envTex: () => TX.envRot(), himmel: [0xffe2cc, 0x6a2620, .95], umgebung: [0xffd8c4, .22], sonne: [0xffe6cc, 1.2, [5, 14, 6]], fuell: [0xffc8a8, .5, [-6, 10, -15]]},
  huelle: spiegelkabinett, ausstattung: spiegelDekor, stimmung: {staub: {farbe: 0xffd890, n: 320, groesse: .045}}};

RAUM.optik2 = {titel: "Laden des Optikers",
  licht: {bg: 0x161822, nebel: 0x26262c, dichte: .02, himmel: [0xfff0d8, 0x4a3a2a, .95], umgebung: [0xe0e4f0, .2], sonne: [0xc4d2f0, 1.05, [3, 12, -20]], fuell: [0xffd8b0, .55, [-6, 10, 15]]},
  huelle: laden, ausstattung: ladenDekor, stimmung: {staub: {n: 300}}};

KIT.raum17 = {HOEHE, mt, brilleK, lochwand, ablage, sicherungsKasten, kabelHaken, birnenkette, zerrSpiegel, kaefigLampe, fass, laterne, platten, tk, ctex, hsl, speck, blob, ziegel, bohlen, TX, ST, birne, felder, moebel, wandKlein, ecken, luft, dekorMat, werkbank, trommel, teileRegal, fabrikFenster, api};
})();
