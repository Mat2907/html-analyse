/* ---------- 17_raum_detektiv_beweg2.js ---------- */
/* =====================================================================
   beweg2 · Labor des Professors (Raumthema der Detektei, siehe 17_raum_detektiv.js)
   Laborsaal eines Instituts: Tafelparkett, weiße Kachelsockel mit grünem Band, salbeigrün gestrichene Wände, gusseiserne Säulen unter
   eisernen Deckenträgern, großes Oberlicht aus Glas über dem Gang (Tageslicht, Lichtbahnen; drei Laufschienen bei 6,5 m – daran hängt
   das Schild „1 N = 1 kg · m/s²“), Gasleitungen und hängende Gaslampen. Vorn eine große Wandtafel mit Kreideskizzen, ein Chemikalienschrank (Flaschen und Kolben mit leuchtenden Flüssigkeiten),
   runde Fenster; hinten Bücher- und Präparateregale bis unter die Decke, Wanduhr. Ausstattung: Labortische mit Glaskolben, Fallrinne,
   Fallmaschine, Pendel, Vitrine, Modellbahn, Globus, Wandborde, Büste, Ballonmodell.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D, KIT = R3D && R3D.kits && R3D.kits.detektiv;
if (!T3 || !KIT || !KIT.raum17 || !KIT.raum17.aussen || !KIT._h) return;
const H_ = KIT._h, {U, TAU, M, S, KB, FONT, tex, kmat} = H_, R17 = KIT.raum17, A17 = R17.aussen, {mt, ctex, hsl, speck, blob, felder, moebel, wandKlein, ecken, luft, HOEHE} = R17;
const PI = Math.PI, V3 = (x, y, z) => new T3.Vector3(x, y, z), stab = A17.stab;

const TX = {
  parkett: () => ctex(512, 512, "b2-parkett", (g, w, h, r) => { g.fillStyle = "#2a1a0e"; g.fillRect(0, 0, w, h); const n = 4, c = w / n, k = 4, s = c / k;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let q = 0; q < k; q++) { const hor = (i + j) % 2, col = hsl(26 + r() * 8, 26 + r() * 10, 21 + r() * 9);
      const x = i * c + (hor ? 0 : q * s), y = j * c + (hor ? q * s : 0), ww = hor ? c : s, hh = hor ? s : c; g.fillStyle = col; g.fillRect(x + 1, y + 1, ww - 2, hh - 2);
      for (let v = 0; v < 6; v++) { g.strokeStyle = `rgba(${r() < .6 ? "30,16,6" : "255,220,170"},${.05 + r() * .08})`; g.lineWidth = 1; g.beginPath();
        if (hor) { const yy = y + 2 + r() * (hh - 4); g.moveTo(x, yy); g.lineTo(x + ww, yy + (r() - .5) * 3); } else { const xx = x + 2 + r() * (ww - 4); g.moveTo(xx, y); g.lineTo(xx + (r() - .5) * 3, y + hh); } g.stroke(); } }
    for (let i = 0; i < 10; i++) blob(g, r() * w, r() * h, 20 + r() * 40, 16 + r() * 30, "rgba(20,10,4,.25)"); speck(g, r, w, h, 3000, .1, ["#000", "#fff"]); }, [1, 1]),
  kacheln: () => ctex(256, 256, "b2-kacheln", (g, w, h, r) => { g.fillStyle = "#9a968c"; g.fillRect(0, 0, w, h); const n = 4, c = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = i * c, y = j * c, L = 88 + r() * 6; const gr = g.createLinearGradient(x, y, x + c, y + c); gr.addColorStop(0, hsl(45, 20, L)); gr.addColorStop(1, hsl(40, 14, L - 7));
      g.fillStyle = gr; g.fillRect(x + 2, y + 2, c - 4, c - 4); g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(x + 4, y + 4, c - 14, 3); if (r() < .25) { g.strokeStyle = "rgba(90,80,60,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x + r() * c, y + 3); g.lineTo(x + r() * c, y + c - 3); g.stroke(); } } }, [1, 1]),
  putz: () => ctex(512, 512, "b2-putz", (g, w, h, r) => { g.fillStyle = "#a4b49c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) blob(g, r() * w, r() * h, 30 + r() * 80, 30 + r() * 80, r() < .5 ? "rgba(110,120,100,.2)" : "rgba(220,230,210,.2)"); speck(g, r, w, h, 5000, .12, ["#5a6a50", "#fff"]); }, [1, 1]),
  // Wandtafel mit Kreide: Überschrift, Formeln, schiefe Ebene, t-s-Diagramm, Pendel, Fallmaschine
  tafel: () => ctex(1024, 512, "b2-tafel", (g, w, h, r) => { g.fillStyle = "#1e2a24"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) blob(g, r() * w, r() * h, 40 + r() * 120, 20 + r() * 60, "rgba(200,210,200,.06)");
    const ch = "rgba(238,238,228,.88)", ge = "rgba(240,214,120,.9)"; g.strokeStyle = ch; g.fillStyle = ch; g.lineWidth = 3.2; g.lineCap = "round"; g.textBaseline = "alphabetic";
    g.font = `italic 700 54px ${FONT}`; g.fillText("Bewegung", 40, 74); g.fillRect(40, 86, 250, 3);
    g.font = `italic 600 40px ${FONT}`; ["v = Δs : Δt", "a = Δv : Δt", "F = m · a"].forEach((t, i) => g.fillText(t, 50, 150 + i * 56));
    g.fillStyle = ge; g.fillText("1 N = 1 kg · m/s²", 50, 330); g.fillStyle = ch;
    g.beginPath(); g.moveTo(360, 300); g.lineTo(620, 300); g.lineTo(360, 160); g.closePath(); g.stroke(); g.beginPath(); g.arc(430, 182, 14, 0, TAU); g.stroke();
    g.strokeStyle = ge; g.beginPath(); g.moveTo(430, 182); g.lineTo(430, 262); g.moveTo(422, 250); g.lineTo(430, 262); g.lineTo(438, 250); g.moveTo(430, 182); g.lineTo(486, 214); g.stroke(); g.strokeStyle = ch;
    g.beginPath(); g.moveTo(680, 330); g.lineTo(680, 110); g.moveTo(680, 330); g.lineTo(960, 330); g.stroke(); g.font = `italic 30px ${FONT}`; g.fillText("s", 650, 120); g.fillText("t", 960, 365);
    g.beginPath(); g.moveTo(680, 330); for (let k = 0; k <= 20; k++) { const t = k / 20; g.lineTo(680 + t * 260, 330 - t * t * 200); } g.stroke();
    g.beginPath(); g.moveTo(120, 400); g.lineTo(260, 400); g.moveTo(190, 400); g.lineTo(240, 488); g.stroke(); g.beginPath(); g.arc(244, 494, 13, 0, TAU); g.stroke(); g.setLineDash([6, 8]); g.beginPath(); g.arc(190, 400, 100, PI * .33, PI * .67); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(480, 400, 26, 0, TAU); g.moveTo(454, 400); g.lineTo(454, 480); g.moveTo(506, 400); g.lineTo(506, 455); g.stroke(); g.strokeRect(440, 480, 28, 26); g.strokeRect(492, 455, 28, 34);
    g.font = `italic 600 34px ${FONT}`; g.fillText("Versuch: Fallrinne", 600, 440); g.fillText("Δs ~ t²", 600, 490);
    speck(g, r, w, h, 3000, .12, ["#fff", "#000"]); g.fillStyle = "rgba(240,240,232,.12)"; g.fillRect(800, 20, 180, 50); }),
  himmel: () => ctex(512, 512, "b2-himmel", (g, w, h, r) => { const gr = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * .7); gr.addColorStop(0, "#8ab0dc"); gr.addColorStop(1, "#c8d8e8"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) { const x = r() * w, y = r() * h; for (let k = 0; k < 6; k++) blob(g, x + (r() - .5) * 90, y + (r() - .5) * 40, 30 + r() * 40, 20 + r() * 30, "rgba(255,255,255,.4)"); } }),
  instrumente: () => ctex(256, 256, "b2-instr", (g, w, h, r) => { g.fillStyle = "#24160c"; g.fillRect(0, 0, w, h); g.fillStyle = "#5a1a1e"; g.fillRect(8, 8, w - 16, h - 16); })
};

// Regal bis unter die Decke: Bücher (InstancedMesh-Einträge wie im Weltstil) und Glasgefäße mit farbigen Flüssigkeiten
const BC = ["#6e2a22", "#7b2d26", "#2f5d5d", "#24402f", "#1f2b47", "#5a3a22", "#8a5a2b", "#2a2118", "#4a1f2a", "#3b5b4a", "#b08850", "#5c4a3a"];
const FL = ["#3a7a3a", "#8a2a1a", "#c8a030", "#2a4a8a", "#6a2a6a", "#d8d0b0"];
// leuchtende Flüssigkeiten (unbeleuchtetes Material: wirkt im Schrank und auf den Labortischen wie von innen hell)
const FLG = ["#58c04a", "#d84a2c", "#f0bc3a", "#4a82dc", "#b056b8", "#3ac0b0"];
const fluess = () => mt("b2-fluess", () => KB({vertexColors: true, color: 0xd8d8d8}));
function regal(K, books, w, ua, ub, Hh, r){
  const uA = Math.min(ua, ub), uB = Math.max(ua, ub), W = uB - uA, uc = (uA + uB) / 2, D = .42, nb = Math.max(1, Math.round(W / 1.2)), bw = W / nb, ns = Math.round((Hh - .3) / .5), sp = (Hh - .3) / ns;
  K.box("dunkel", W + .08, .14, D + .04, w.m(uc, .07, (D + .04) / 2)); K.box("dunkel", W, Hh, .02, w.m(uc, Hh / 2, .01)); K.box("dunkel", W + .16, .12, D + .12, w.m(uc, Hh + .06, (D + .12) / 2));
  for (let i = 0; i <= nb; i++) K.box("dunkel", .05, Hh, D, w.m(uA + i * bw, Hh / 2, D / 2));
  for (let k = 0; k < ns; k++) { const y = .14 + k * sp; K.box("dunkel", W - .02, .03, D - .02, w.m(uc, y, D / 2));
    for (let i = 0; i < nb; i++) { let u = uA + i * bw + .05; const ue = uA + (i + 1) * bw - .05, jars = (k + i) % 3 === 1 && k > 0;
      while (u < ue - .06) {
        if (jars) { const rr = .045 + r() * .03, hh = .14 + r() * .12, x = u + rr + .01; if (x + rr > ue) break;
          K.add("glasF", new T3.CylinderGeometry(rr, rr, hh, 8, 1, true), w.m(x, y + .015 + hh / 2, D / 2)); K.add("vc", new T3.CylinderGeometry(rr * .88, rr * .88, hh * (.4 + r() * .4), 8), w.m(x, y + .015 + hh * .3, D / 2), {c: FL[(r() * FL.length) | 0]});
          K.add("vc", new T3.CylinderGeometry(rr * .7, rr * .7, .03, 6), w.m(x, y + .03 + hh, D / 2), {c: "#8a6a3a"}); u += rr * 2 + .04 + r() * .05; continue; }
        if (r() < .05) { u += .08 + r() * .12; continue; }
        const th = .024 + r() * .045, hb = Math.min(.38, sp - .08) * (.62 + r() * .38), dp = .17 + r() * .08; books.push([w, u + th / 2, y + .015 + hb / 2, .04 + dp / 2, th, hb, dp, 0]); u += th + .003; } } }
}

/* ---------- Hülle ---------- */
function labor(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ, r = U.seeded(1687), lamps = A.hu.lampen, books = [], SX = 2.4, SZ = 7.5;
  A.hu.deckeY = () => H;   // Decke, Träger und Laufschienen unter dem Oberlicht
  A.boden(mt("b2-boden", () => S({map: TX.parkett(), roughness: .5})), 1.2);
  A.mesh(A.wandGeo(0, 1.2, .6, null), mt("b2-kacheln", () => S({map: TX.kacheln(), roughness: .25})));
  A.mesh(A.wandGeo(1.2, H, 2.4, y => { const k = y > 5.6 ? 1 - (y - 5.6) * .1 : 1; return [k, k, k]; }), mt("b2-putz", () => S({map: TX.putz(), vertexColors: true, roughness: .9})));
  for (const w of Object.values(WL)) { const L2 = w.len - (w.side ? .3 : 0); K.box("gruen", L2, .1, .03, w.m(0, 1.2, .015)); K.box("gruen", L2, .03, .045, w.m(0, 1.26, .022));
    K.box("stuck", L2, .22, .1, w.m(0, H - .11, .05)); K.box("stuck", L2, .07, .18, w.m(0, H - .03, .09)); }
  // Decke mit Öffnung für das Oberlicht, eiserne Träger, Laufschienen
  { const sh = new T3.Shape(); sh.moveTo(-8, -11); sh.lineTo(8, -11); sh.lineTo(8, 11); sh.lineTo(-8, 11); sh.closePath(); const ho = new T3.Path(); ho.moveTo(-SX, -SZ); ho.lineTo(SX, -SZ); ho.lineTo(SX, SZ); ho.lineTo(-SX, SZ); ho.closePath(); sh.holes.push(ho);
    const cm = A.mesh(U.scaleUV(new T3.ShapeGeometry(sh, 1), 1 / 2.4, 1 / 2.4), mt("b2-decke", () => S({map: tex.plaster(), color: 0xf0ece0, roughness: .95, emissive: 0x2a2a24, emissiveIntensity: .3}))); cm.rotation.x = PI / 2; cm.position.y = H; }
  for (const z of P) { K.box("eisen", 16, .3, .05, M(0, H - .15, z)); for (const y of [H - .29, H - .015]) K.box("eisen", 16, .03, .22, M(0, y, z)); }
  for (const x of [-1, 0, 1]) { K.box("eisen", .05, .07, 2 * SZ + .3, M(x, H - .035, 0)); K.box("eisen", .14, .02, 2 * SZ + .3, M(x, H - .06, 0)); }
  { const z = -5.6; K.box("messing", .26, .14, .3, M(0, H - .14, z)); for (const k of [-1, 1]) K.add("messing", new T3.CylinderGeometry(.05, .05, .04, 10), M(0, H - .07, z + k * .1, 0, 0, PI / 2));
    K.box("eisen", .015, .9, .015, M(0, H - .66, z)); K.add("eisen", new T3.TorusGeometry(.06, .014, 4, 10, PI * 1.4), M(0, H - 1.16, z)); }
  // Oberlicht: gläserne Seitenwände und Satteldach mit Sprossen, darüber Himmel
  { const yo = H, ys = H + .9, yr = H + 2.1, a = Math.atan2(yr - ys, SX), L = Math.hypot(SX, yr - ys);
    for (const s of [-1, 1]) { K.add("glasD", new T3.PlaneGeometry(2 * SZ, ys - yo), M(s * SX, (yo + ys) / 2, 0, 0, PI / 2, 0)); K.add("glasD", new T3.PlaneGeometry(2 * SX, ys - yo), M(0, (yo + ys) / 2, s * SZ));
      K.add("glasD", new T3.PlaneGeometry(L, 2 * SZ).rotateX(-PI / 2), M(s * SX / 2, (ys + yr) / 2, 0, 0, 0, -s * a));
      const tri = new T3.Shape(); tri.moveTo(-SX, ys); tri.lineTo(SX, ys); tri.lineTo(0, yr); tri.closePath(); K.add("glasD", new T3.ShapeGeometry(tri), M(0, 0, s * SZ));
      for (let z = -SZ; z <= SZ + .01; z += 1.0) { stab(K, "eisen", [s * SX, ys, z], [0, yr, z], .04); stab(K, "eisen", [s * SX, yo, z], [s * SX, ys, z], .04); }
      K.box("eisen", .08, .08, 2 * SZ, M(s * SX, ys, 0)); K.box("eisen", .1, .06, 2 * SZ + .1, M(s * SX, yo + .03, 0)); K.box("eisen", 2 * SX + .1, .06, .1, M(0, yo + .03, s * SZ)); }
    K.box("eisen", .1, .1, 2 * SZ, M(0, yr, 0));
    const sky = A.mesh(new T3.PlaneGeometry(40, 40).rotateX(PI / 2), mt("b2-himmel", () => KB({map: TX.himmel(), fog: false, toneMapped: false})), {receive: false}); sky.position.y = 16; sky.userData.noPick = true;
    // Lichtbahnen vom Oberlicht (sehr dezent, additiv)
    const bm = mt("b2-bahn", () => KB({map: R17.TX.lichtbahn(), color: 0xfff4d8, transparent: true, opacity: .09, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, toneMapped: false}));
    for (const [z0, z1] of [[-7, -2.5], [2.5, 7]]) { const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute([-2.2, H, z0, 2.2, H, z0, 3.2, .02, z0 - 1.4, -1.2, .02, z0 - 1.4, -2.2, H, z1, 2.2, H, z1, 3.2, .02, z1 - 1.4, -1.2, .02, z1 - 1.4], 3));
      g.setAttribute("uv", new T3.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0], 2)); g.setIndex([0, 3, 1, 1, 3, 2, 4, 7, 5, 5, 7, 6]); g.computeVertexNormals();
      const m = A.mesh(g, bm, {receive: false, order: 2}); m.userData.noPick = true; } }
  // gusseiserne Säulen unter den Trägern, Gasleitung, hängende Gaslampen
  for (const s of [-1, 1]) { const x = s * 7.74;
    for (const z of P) { K.box("eisen", .38, .3, .38, M(x, .15, z)); K.add("eisen", new T3.CylinderGeometry(.11, .13, 5.6, 12), M(x, 3.1, z)); K.add("eisen", new T3.CylinderGeometry(.22, .12, .3, 12), M(x, H - .44, z));
      K.add("messing", new T3.TorusGeometry(.13, .02, 4, 14), M(x, .34, z, PI / 2)); K.add("messing", new T3.TorusGeometry(.115, .018, 4, 14), M(x, 5.9, z, PI / 2));
      A.hindernis(x, z, .42, .42); A.belege(ctx.wand(s < 0 ? "left" : "right", z, 0, H, .55, .48)); }
    K.add("messing", new T3.CylinderGeometry(.022, .022, 21.6, 6), M(s * 7.95, 2.64, 0, PI / 2)); for (let z = -10; z <= 10; z += 2.5) K.box("messing", .06, .05, .05, M(s * 7.97, 2.64, z));
    for (const z of P) { const lx = s * 4.0, ly = 4.45; K.add("messing", new T3.CylinderGeometry(.018, .018, H - .3 - ly - .3, 6), M(lx, (H - .3 + ly + .3) / 2, z)); K.add("messing", new T3.CylinderGeometry(.06, .04, .12, 10), M(lx, ly + .3, z));
      K.add("globe", new T3.LatheGeometry([[.03, 0], [.09, .03], [.13, .1], [.13, .18], [.1, .25], [.06, .27]].map(([a, b]) => new T3.Vector2(a, -b)), 14), M(lx, ly + .24, z)); K.add("messing", new T3.TorusGeometry(.14, .012, 4, 16), M(lx, ly + .18, z, PI / 2));
      lamps.push(V3(lx, ly + .1, z)); A.belege({x0: lx - .25, x1: lx + .25, y0: ly - .1, y1: H, z0: z - .25, z1: z + .25}); } }
  // Stirnwand: Wandtafel mit Kreide (links), Instrumentenschrank (rechts), runde Fenster
  { const zW = B.z1, tx = -5.15, ty = 3.7;
    K.add("tafel", new T3.PlaneGeometry(4.4, 2.15), M(tx, ty, zW + .06)); for (const k of [-1, 1]) { K.box("dunkel", 4.6, .1, .1, M(tx, ty + k * 1.12, zW + .05)); K.box("dunkel", .1, 2.34, .1, M(tx + k * 2.25, ty, zW + .05)); }
    K.box("dunkel", 4.4, .04, .16, M(tx, ty - 1.15, zW + .12)); for (let i = 0; i < 4; i++) K.box("vc", .08, .02, .02, M(tx - 1.2 + i * .25, ty - 1.12, zW + .14), {c: i % 3 ? "#f0f0e8" : "#e8d070"}); K.box("vc", .14, .05, .07, M(tx + 1.4, ty - 1.11, zW + .14), {c: "#c8b27a"});
    for (const k of [-1, 1]) K.box("eisen", .05, 4.6, .04, M(tx + k * 2.4, 2.6, zW + .03));
    const cx = 5.15, cw = 4.5, chh = 3.7, cd = .5; K.box("dunkel", cw, .2, cd, M(cx, .1, zW + cd / 2)); K.box("dunkel", cw + .12, .12, cd + .08, M(cx, chh + .06, zW + (cd + .08) / 2)); K.box("dunkel", cw, chh, .03, M(cx, chh / 2, zW + .02));
    for (let i = 0; i <= 3; i++) K.box("dunkel", .06, chh, cd, M(cx - cw / 2 + i * cw / 3, chh / 2, zW + cd / 2)); for (const y of [.2, 1.35, 2.5]) K.box("dunkel", cw, .03, cd, M(cx, y, zW + cd / 2));
    K.add("glasS", new T3.PlaneGeometry(cw - .06, chh - .25), M(cx, chh / 2 + .1, zW + cd + .005)); for (let i = 1; i < 3; i++) K.box("dunkel", .04, chh - .2, .03, M(cx - cw / 2 + i * cw / 3, chh / 2 + .1, zW + cd));
    // Chemikalienschrank: auf jedem Boden eine Reihe Standflaschen, Erlenmeyer- und Rundkolben mit farbigen, leicht leuchtenden Flüssigkeiten
    // (vom Eingang aus das deutlichste Zeichen „Labor“), dazwischen ein Messinggerät je Fach
    { const rr = U.seeded(907); let k = 0;
      for (let i = 0; i < 3; i++) for (const y of [.215, 1.365, 2.515]) { const sx = cx - cw / 3 + i * cw / 3, xe = sx + cw / 6 - .08; let x = sx - cw / 6 + .12;
        for (;;) { const art = (k++ + i) % 4, c = FLG[(rr() * FLG.length) | 0], z = zW + .22 + (rr() - .5) * .1, s = .75 + rr() * .55;
          if (x + (art === 3 ? .2 : .26 * s + .02) > xe) break;
          if (art === 3) { K.add("messing", new T3.CylinderGeometry(.035, .05, .5, 8), M(x + .09, y + .25, z)); K.add("messing", new T3.SphereGeometry(.09, 10, 6), M(x + .09, y + .56, z)); x += .26; continue; }
          if (art === 0) { const hh = .3 * s, ra = .075 * s; K.add("glasF", new T3.CylinderGeometry(ra, ra, hh, 10, 1, true), M(x + ra, y + hh / 2, z)); K.add("glasF", new T3.CylinderGeometry(ra * .4, ra * .4, .08 * s, 8, 1, true), M(x + ra, y + hh + .04 * s, z));
            K.add("fluess", new T3.CylinderGeometry(ra * .9, ra * .9, hh * (.45 + rr() * .4), 10), M(x + ra, y + hh * .32, z), {c}); K.add("vc", new T3.CylinderGeometry(ra * .45, ra * .38, .05, 8), M(x + ra, y + hh + .1 * s, z), {c: "#7a5a32"}); x += ra * 2 + .06; }
          else if (art === 1) { const ra = .1 * s; K.add("glasF", new T3.LatheGeometry([[.02, .3], [.025, .2], [.09, .04], [.1, 0]].map(([a, b]) => new T3.Vector2(a * s, b * s)), 10), M(x + ra, y, z));
            K.add("fluess", new T3.ConeGeometry(ra * .92, .14 * s, 10).translate(0, .07 * s, 0), M(x + ra, y + .005, z), {c}); x += ra * 2 + .06; }
          else { const ra = .1 * s; K.add("glasF", new T3.SphereGeometry(ra, 10, 8), M(x + ra, y + ra, z)); K.add("glasF", new T3.CylinderGeometry(ra * .28, ra * .28, ra * 1.6, 8, 1, true), M(x + ra, y + ra * 2.6, z));
            K.add("fluess", new T3.SphereGeometry(ra * .9, 10, 6, 0, TAU, PI * .45, PI * .55), M(x + ra, y + ra, z), {c}); x += ra * 2 + .07; } } } }
    A.hindernis(cx, zW + .3, cw, .62); A.belege({x0: cx - cw / 2, x1: cx + cw / 2, y0: 0, y1: chh + .15, z0: zW, z1: zW + .6});
    for (const x of [-5.15, 5.15]) { K.add("himmelF", new T3.CircleGeometry(.6, 24), M(x, 5.55, zW + .015)); K.add("dunkel", new T3.TorusGeometry(.62, .06, 6, 28), M(x, 5.55, zW + .05));
      K.box("dunkel", 1.2, .04, .04, M(x, 5.55, zW + .05)); K.box("dunkel", .04, 1.2, .04, M(x, 5.55, zW + .05)); } }
  // Rückwand: Regale mit Büchern und Präparategläsern bis unter die Decke, Wanduhr über der Tür
  { const w = WL.back; for (const [x0, x1] of [[-7.6, -2.65], [2.65, 7.6]]) { regal(K, books, w, w.u(x0, B.z0), w.u(x1, B.z0), 5.55, r); A.hindernis((x0 + x1) / 2, B.z0 - .23, x1 - x0, .48); A.belege({x0, x1, y0: 0, y1: 5.75, z0: B.z0 - .55, z1: B.z0}); }
    K.add("messing", new T3.TorusGeometry(.3, .03, 6, 24), M(0, 5.95, B.z0 - .05, 0, PI, 0)); K.add("uhr", new T3.CircleGeometry(.28, 24), M(0, 5.95, B.z0 - .04, 0, PI, 0)); }
  A.fertig([["dunkel", () => mat0(), {cast: true}], ["eisen", () => mt("b2-eisen", () => S({color: 0x2a3230, metalness: .55, roughness: .45})), {cast: true}], ["messing", R17.ST.messing],
    ["gruen", () => mt("b2-gruen", () => S({color: 0x2a5a3e, roughness: .25}))], ["stuck", () => kmat("stucco")], ["globe", () => kmat("globe")], ["vc", R17.ST.vc, {color: true}],
    ["glasD", () => mt("b2-glasD", () => S({color: 0xdfeaf0, transparent: true, opacity: .2, roughness: .05, metalness: .2, depthWrite: false, side: T3.DoubleSide})), {receive: false}],
    ["glasF", () => mt("b2-glasF", () => S({color: 0xe4efe6, transparent: true, opacity: .3, roughness: .05, metalness: .1, depthWrite: false, side: T3.DoubleSide})), {receive: false}],
    ["glasS", R17.ST.glas, {receive: false}], ["fluess", fluess, {color: true, receive: false}], ["tafel", () => mt("b2-tafel", () => S({map: TX.tafel(), roughness: .9, emissive: 0xffffff, emissiveMap: TX.tafel(), emissiveIntensity: .08}))],
    ["himmelF", () => mt("b2-himmelF", () => KB({map: TX.himmel(), toneMapped: false}))], ["uhr", () => kmat("face")]]);
  if (books.length) { const bi = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), kmat("books"), books.length), c = new T3.Color();
    books.forEach(([w, u, y, d, sx, sy, sz, rz], i) => { bi.setMatrixAt(i, w.m(u, y, d, 0, 0, rz, sx, sy, sz)); bi.setColorAt(i, c.set(BC[(r() * BC.length) | 0]).multiplyScalar(.78 + r() * .42)); });
    bi.receiveShadow = true; bi.userData.noPick = true; G.add(bi); }
  A.halos(lamps, 0xffd8a0, .62);
  return {punkt: [[0xffcf8a, 6, 12, -4.0, 4.3, 4.5], [0xffcf8a, 6, 12, 4.0, 4.3, -4.5], [0xe4ecf8, 6, 16, 0, 6.1, 0]],
    flackern: (t, L) => { for (let i = 0; i < 2; i++) L[i].intensity = L[i].userData.i0 * (.95 + .03 * Math.sin(t * 1.6 + i * 2.2) + .02 * Math.sin(t * 2.6 + i)); }};
}
const mat0 = () => mt("b2-dunkel", () => S({map: tex.wood(true), roughness: .55}));

/* ---------- Ausstattung ---------- */
function kolben(D, F, x, y, z, s, c){ D.lat("glass", [[.012, .2], [.015, .14], [.06, .05], [.065, 0], [0, 0]].map(([a, b]) => [a * s, b * s]), 10, F.m(x, y, z)); D.cone("fluess", .055 * s, .05 * s, 10, F.m(x, y + .025 * s, z), c); }
function labortisch(D, F, R){ const {bx, cy, rod, sp, tor} = D, T = .75;
  bx("dark", 2.0, .06, T, F.m(0, .9, T / 2)); bx("dark", 1.9, .84, T - .08, F.m(0, .44, T / 2 - .02)); for (let i = 0; i < 4; i++) bx("wood", .44, .74, .01, F.m(-.7 + i * .47, .46, T - .05)); for (let i = 0; i < 4; i++) sp("brass", .015, 6, 4, F.m(-.7 + i * .47, .6, T - .04));
  bx("vc", 1.96, .006, T - .04, F.m(0, .935, T / 2), "#1c2420");
  // Stativ mit Rundkolben über dem Brenner, Reagenzglasständer, Erlenmeyerkolben, Mörser, Papiere
  rod("iron", F, [-.55, .94, .25], [-.55, 1.62, .25], .01); bx("iron", .24, .02, .16, F.m(-.55, .945, .3)); rod("iron", F, [-.55, 1.32, .25], [-.38, 1.32, .38], .008);
  tor("iron", .06, .008, 3, 10, F.m(-.38, 1.32, .38, PI / 2)); D.lat("glass", [[.02, .26], [.02, .17], [.075, .1], [.08, .06], [.06, .01], [0, 0]], 12, F.m(-.38, 1.25, .38)); sp("fluess", .06, 10, 8, F.m(-.38, 1.32, .38), FLG[R() * 6 | 0]);
  cy("brass", .035, .045, .16, 10, F.m(-.38, 1.02, .38)); cy("brass", .06, .06, .02, 10, F.m(-.38, .945, .38)); D.cone("fil", .018, .07, 6, F.m(-.38, 1.14, .38)); D.st().HALOS.push(F.p(-.38, 1.14, .38));
  D.tub("vc", F, [[-.4, .97, .38], [-.2, .95, .55], [.0, .95, .62], [.2, 1.0, .1]], .008, 12, 4, "#8a3a1a");
  bx("dark", .34, .1, .12, F.m(.15, .99, .2)); for (let i = 0; i < 6; i++) { cy("glass", .012, .012, .16, 6, F.m(.03 + i * .05, 1.06, .2), null, true); cy("fluess", .01, .01, .07, 6, F.m(.03 + i * .05, 1.0, .2), FLG[(i + 1) % 6]); }
  kolben(D, F, .5, .935, .3, 2.6, FLG[0]); kolben(D, F, .86, .935, .47, 2.0, FLG[2]); kolben(D, F, .3, .935, .57, 1.6, FLG[3]);
  cy("vc", .06, .045, .07, 10, F.m(.82, .97, .18), "#e8e4dc"); rod("vc", F, [.8, .98, .18], [.9, 1.06, .2], .008, 4, "#e8e4dc"); D.pln("paper", .24, .3, F.m(-.05, .938, .5, -PI / 2, 0, .3)); }
function fallrinne(D, F){ const {bx, rod, sp, cone} = D, ang = .12, L = 2.2, P = D.fr(F.m(0, .8, .38, 0, 0, ang));
  for (const s of [-1, 1]) { const x = s * .85, y = .8 + Math.sin(ang) * x; for (const k of [-1, 1]) rod("dark", F, [x + k * .12, 0, .2], [x, y - .04, .38], .025, 5); for (const k of [-1, 1]) rod("dark", F, [x + k * .12, 0, .56], [x, y - .04, .38], .025, 5); }
  bx("wood", L, .05, .2, P.m(0, 0, 0)); for (const k of [-1, 1]) bx("dark", L, .05, .02, P.m(0, .04, k * .09)); for (let i = 0; i < 6; i++) { const x = -L / 2 + .2 + i * .36; rod("brass", P, [x, .02, -.11], [x, .2, -.11], .006, 4); cone("brass", .03, .05, 8, P.m(x, .2, -.08, PI)); }
  for (let i = 0; i <= 10; i++) bx("vc", .004, .005, .1, P.m(-L / 2 + .1 + i * .2, .027, -.03), "#e8d070");
  const G = D.group(P.m(0, .065, 0)), Q = D.I4(); D.meshes(D.withK(() => sp("brass", .035, 12, 8, Q.m())), G); const ph = D.st().R() * 9;
  D.st().CTX.tick((dt, t) => { const k = ((t * .1 + ph) % 1), u = k < .75 ? (k / .75) ** 2 : 1 - (k - .75) / .25; G.position.copy(P.p(L / 2 - .1 - u * (L - .25), .065, 0)); G.rotation.z = u * 40; }); }
function fallmaschine(D, F){ const {bx, cy, rod, tor, sp} = D, x = 0, z = .3;
  bx("dark", .5, .06, .4, F.m(x, .03, z)); cy("dark", .03, .035, 2.2, 8, F.m(x, 1.15, z)); bx("paper", .05, 1.6, .005, F.m(x + .04, 1.15, z + .036)); for (let i = 0; i <= 16; i++) bx("vc", .03, .005, .006, F.m(x + .04, .35 + i * .1, z + .04), "#2a2118");
  cy("brass", .13, .13, .03, 18, F.m(x, 2.27, z + .06, PI / 2)); tor("brass", .13, .008, 4, 18, F.m(x, 2.27, z + .08)); rod("brass", F, [x, 2.2, z], [x, 2.27, z + .05], .008, 4);
  rod("vc", F, [x - .13, 2.27, z + .07], [x - .13, 1.3, z + .07], .0025, 3, "#d8d0c0"); rod("vc", F, [x + .13, 2.27, z + .07], [x + .13, 1.7, z + .07], .0025, 3, "#d8d0c0");
  cy("brass", .04, .04, .12, 10, F.m(x - .13, 1.24, z + .07)); cy("brass", .04, .04, .1, 10, F.m(x + .13, 1.65, z + .07)); cy("brass", .02, .02, .02, 8, F.m(x + .13, 1.59, z + .07)); bx("brass", .16, .02, .1, F.m(x - .13, .7, z + .07)); }
function pendel(D, F){ const {bx, cy, rod} = D, z = .4, top = 2.05; bx("dark", .9, .06, .4, F.m(0, .03, z)); for (const s of [-1, 1]) rod("dark", F, [s * .38, .06, z], [s * .32, top, z], .022, 5); rod("brass", F, [-.36, top, z], [.36, top, z], .015, 5);
  const G = D.group(F.m(0, top, z)), Q = D.I4(); D.meshes(D.withK(() => { rod("brass", Q, [0, 0, 0], [0, -1.45, 0], .004, 3); D.sp("brass", .07, 14, 10, Q.m(0, -1.5, 0)); }), G);
  for (let i = -3; i <= 3; i++) bx("vc", .005, .04, .005, F.m(Math.sin(i * .08) * 1.5, top - 1.6, z + .01), "#e8d070"); bx("vc", .5, .01, .06, F.m(0, top - 1.62, z), "#2a2118");
  D.st().CTX.tick((dt, t) => { G.rotation.z = Math.sin(t * 2.55) * .22; }); }
// Glasballons mit farbiger Flüssigkeit im Weidenkorb
function ballons(D, F, i){ [[-.12, .32, .3, FL[i % 6]], [.22, .55, .22, FL[(i + 2) % 6]]].forEach(([x, z, s, c]) => { D.cy("vc", s * .95, s * .85, s * .9, 14, F.m(x, s * .45, z), "#8a6a3a");
  D.lat("glass", [[.04, 2.3], [.05, 2.0], [.3, 1.6], [.42, 1.0], [.4, .5], [.3, .1], [0, 0]].map(([a, b]) => [a * s * 2.2, b * s]), 14, F.m(x, s * .1, z)); D.sp("vc", s * .8, 12, 8, F.m(x, s * .62, z, 0, 0, 0, 1, .7, 1), c); }); }
function ausstattung(D){
  R17.dekorMat(D); D.KEYMAT.fluess = fluess; D.COLOR_KEYS.add("fluess"); const C = D.COMP, {WL, R} = D.st();
  C.t_labor = (w, a) => ({b: [D.q(w, a, -1.05, 1.05, 0, 1.7, .8, true)], build: F => labortisch(D, F, R)});
  C.t_rinne = (w, a) => ({b: [D.q(w, a, -1.2, 1.2, 0, 1.3, .8, true)], build: F => fallrinne(D, F)});
  C.t_fall = (w, a) => ({b: [D.q(w, a, -.35, .35, 0, 2.45, .55, true)], build: F => fallmaschine(D, F)});
  C.t_pendel = (w, a) => ({b: [D.q(w, a, -.55, .55, 0, 2.15, .65, true)], build: F => pendel(D, F)});
  C.t_vitrine = (w, a) => ({b: [D.q(w, a, -.72, .72, 0, 2.0, .6, true)], build: F => { D.vitrine(F, 0, 1.3, .52, (Cc, y0, y1) => { D.newtonCradle(Cc, -.25, y0, .26); for (let i = 0; i < 3; i++) D.cy("brass", .05 - i * .012, .05 - i * .012, .01, 16, Cc.m(.2 + i * .1, y0 + .005, .26)); D.hourglass(Cc, .3, y1, .26); D.smallGlobe(Cc, -.25, y1, .26, .8); }, {col: "#2a4a2a"}); }});
  C.t_bahn = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.4, .84, true)], build: F => D.modelTrain(F, 0)});
  C.t_globus = (w, a) => ({b: [D.q(w, a, -.55, .55, 0, 1.5, 1.0, true)], build: F => { const g = D.globeStand(F, 0, .5, 1, true); if (g) D.globeAnim(g); }});
  moebel(D, felder(D), ["t_labor", "t_rinne", "t_fall", "t_vitrine", "t_pendel", "t_labor", "t_bahn", "t_globus"], 5, ["t_labor"]);
  wandKlein(D, felder(D).filter(p => !p.low), [{w: 1.0, y0: 1.98, y1: 2.6, d: .26, fn: (F, x) => D.wallShelf(F, x, 2.06, .9)}, {w: .5, y0: 1.95, y1: 2.6, d: .12, fn: (F, x) => D.barometerSmall(F, x)},
    {w: .9, y0: 1.98, y1: 2.6, d: .08, fn: (F, x) => D.smallFrames(F, x, 2.3)}]);
  ecken(D, (w, a, F, i) => { if (i % 2 === 0) { if (D.claim(D.q(w, a, -.32, .32, 0, 1.75, .5, true))) { D.pedestal(F, 0, .25, 1.1); D.bust(F, 0, 1.1, .25, .9, 0); } }
    else if (D.claim(D.q(w, a, -.42, .42, 0, 1.0, .8, true))) ballons(D, F, i); });
  const placed = [], Z = luft(D, placed, [-3.2, -2.4, -6.5, 7.0], [0, 3.3, -3.3], .5, 3.9, HOEHE); if (Z) D.balloon(...Z, HOEHE - 1.45);
}

KIT.raum.beweg2 = {titel: "Labor des Professors",
  licht: {bg: 0xb8cce0, nebel: 0x3e3a32, dichte: .02, himmel: [0xf4f0e6, 0x6a5a48, 1.05], umgebung: [0xfff2e0, .22], sonne: [0xfff6e4, 1.5, [3, 18, 4]], fuell: [0xe0e8f4, .5, [-6, 10, -15]]},
  huelle: labor, ausstattung, stimmung: {staub: {farbe: 0xfff0d0, n: 320}, boden: {n: 4}, dunst: {n: 4}}};
})();
