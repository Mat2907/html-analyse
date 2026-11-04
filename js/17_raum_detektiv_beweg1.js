/* ---------- 17_raum_detektiv_beweg1.js ---------- */
/* =====================================================================
   beweg1 · Kutschenstation (Raumthema der Detektei, siehe 17_raum_detektiv.js)
   Posthof unter freiem Morgenhimmel: Kopfsteinpflaster mit Gehsteigplatten. Links der Stall (Ziegel, Fachwerkständer, Heuboden mit Luken
   und Aufzugsbalken, Schieferdach), rechts die Posthalterei (Putz, Holzvordach mit Ziersaum auf Kopfbändern, Fachwerk-Obergeschoss mit
   Fenstern). Vorn das Stationsgebäude: Steinportal um die Tür, zwei Stalltüren mit Pferden, offene Remise mit der Postkutsche, Fahrplan,
   Schild, Giebel mit Uhr und Wetterfahne. Hinten die Tordurchfahrt (Bogen um die Tür), Pferdetränke mit Pumpe. Gaslaternen.
   Ausstattung: Gepäck, Heuballen, Bänke, Milchkannen, Gepäckkarren, Hochrad und Wagenrad, Kummet, Hufeisen, Briefkasten.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D, KIT = R3D && R3D.kits && R3D.kits.detektiv;
if (!T3 || !KIT || !KIT.raum17 || !KIT.raum17.aussen || !KIT._h) return;
const H_ = KIT._h, {U, TAU, M, S, KB, FONT, tex, kmat} = H_, R17 = KIT.raum17, A17 = R17.aussen, {mt, ctex, hsl, speck, blob, bohlen, felder, moebel, wandKlein, ecken, laterne, HOEHE} = R17;
const PI = Math.PI, V3 = (x, y, z) => new T3.Vector3(x, y, z), stab = A17.stab;

const TX = {
  // Kopfsteinpflaster: Reihen kleiner Pflastersteine (je ~12 cm), gerundete Kanten, dunkle Fugen, Moos, feuchte Flecken
  kopf: () => ctex(1024, 1024, "b1-kopf", (g, w, h, r) => { g.fillStyle = "#2a2722"; g.fillRect(0, 0, w, h); speck(g, r, w, h, 5000, .3, ["#000", "#4a463e"]);
    const ny = 20, rh = h / ny;
    for (let j = 0; j < ny; j++) { let x = r() * 30; const y = j * rh;
      while (x < w) { const sw = rh * (1.05 + r() * .5), c = hsl(30 + r() * 30, 4 + r() * 7, 34 + r() * 11);
        for (const dx of [0, -w]) { const X = x + dx; if (X < -sw || X > w) continue;
          g.fillStyle = c; g.beginPath(); g.roundRect(X + 2.5, y + 2.5 + (r() - .5) * 2, sw - 5, rh - 5, 9); g.fill();
          g.fillStyle = "rgba(255,246,228,.09)"; g.beginPath(); g.roundRect(X + 5, y + 4, sw - 12, rh * .38, 7); g.fill(); g.fillStyle = "rgba(0,0,0,.16)"; g.fillRect(X + 5, y + rh - 9, sw - 10, 4); }
        x += sw; } }
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(70,90,40,${.15 + r() * .25})`; g.fillRect(r() * w, (r() * ny | 0) * rh + (r() < .5 ? 0 : rh - 3), 3 + r() * 8, 3); }
    for (let i = 0; i < 12; i++) blob(g, r() * w, r() * h, 60 + r() * 90, 40 + r() * 70, "rgba(16,14,12,.2)"); }, [1, 1]),
  schiefer: () => ctex(256, 256, "b1-schiefer", (g, w, h, r) => { g.fillStyle = "#1e2226"; g.fillRect(0, 0, w, h); const ny = 8, rh = h / ny, sw = w / 8;
    for (let j = 0; j < ny; j++) for (let i = 0; i < 9; i++) { const x = (i - (j % 2) * .5) * sw; g.fillStyle = hsl(210, 8 + r() * 8, 22 + r() * 12); g.fillRect(x + 1, j * rh + 1, sw - 2, rh - 2);
      g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(x + 1, j * rh + 1, sw - 2, 3); } speck(g, r, w, h, 800, .2, ["#000", "#8a9aa0"]); }, [1, 1]),
  putz: () => ctex(512, 512, "b1-putz", (g, w, h, r) => { g.fillStyle = "#b8a27c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) blob(g, r() * w, r() * h, 30 + r() * 80, 30 + r() * 80, r() < .5 ? "rgba(150,130,100,.18)" : "rgba(255,248,230,.2)"); speck(g, r, w, h, 6000, .14, ["#7a6a50", "#fff"]); }, [1, 1]),
  bretterD: () => ctex(512, 512, "b1-bretter", (g, w, h, r) => bohlen(g, w, h, r, {n: 10, holz: [22, 20, 17]}), [1, 1]),
  // Ziersaum des Vordachs: Brett mit gerundeten Zacken (Alpha)
  saum: () => ctex(512, 64, "b1-saum", (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#2a4436"; g.fillRect(0, 0, w, 30); const n = 8, lw = w / n;
    for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(i * lw, 28); g.lineTo(i * lw + lw * .5, 62); g.lineTo((i + 1) * lw, 28); g.fill(); }
    g.fillStyle = "#d8c89a"; g.fillRect(0, 6, w, 4); for (let i = 0; i < n; i++) { g.beginPath(); g.arc(i * lw + lw / 2, 34, 6, 0, TAU); g.fill(); } }, [1, 1]),
  // Schilder: oben „POSTKUTSCHEN“, unten links der Fahrplan, unten rechts ein Wappenschild mit Posthorn
  schilder: () => ctex(1024, 512, "b1-schilder", (g, w, h, r) => { g.textBaseline = "middle"; g.textAlign = "center";
    g.fillStyle = "#1f3a2e"; g.fillRect(0, 0, w, 128); g.strokeStyle = "#d8b860"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, 108); g.fillStyle = "#f0dc98"; g.font = `700 84px ${FONT}`; g.fillText("POSTKUTSCHEN", w / 2, 68);
    g.fillStyle = "#efe6cf"; g.fillRect(0, 128, 640, 384); g.strokeStyle = "#1f3a2e"; g.lineWidth = 12; g.strokeRect(6, 134, 628, 372);
    g.fillStyle = "#2a2118"; g.font = `700 40px ${FONT}`; g.fillText("Abfahrt der Postkutschen", 320, 178); g.fillRect(60, 206, 520, 3);
    g.font = `500 34px ${FONT}`; [["Oxford", "6.45"], ["Bath", "7.30"], ["Dover", "8.15"], ["York", "9.00"], ["Brighton", "10.20"], ["Cambridge", "11.40"]].forEach(([o, t], i) => {
      const y = 248 + i * 42; g.textAlign = "left"; g.fillText(o, 80, y); g.textAlign = "right"; g.fillText(t + " Uhr", 560, y); g.fillStyle = "rgba(42,33,24,.35)"; for (let x = 250; x < 430; x += 14) g.fillRect(x, y + 4, 5, 3); g.fillStyle = "#2a2118"; });
    g.fillStyle = "#6a1418"; g.beginPath(); g.moveTo(680, 150); g.lineTo(1000, 150); g.lineTo(1000, 360); g.quadraticCurveTo(840, 500, 680, 360); g.closePath(); g.fill(); g.strokeStyle = "#e0b850"; g.lineWidth = 8; g.stroke();
    g.strokeStyle = "#e0b850"; g.lineWidth = 14; g.beginPath(); g.arc(840, 290, 58, .3, PI * 1.75); g.stroke(); g.lineWidth = 10; g.beginPath(); g.moveTo(880, 250); g.lineTo(950, 215); g.stroke();
    g.fillStyle = "#e0b850"; g.beginPath(); g.moveTo(940, 196); g.lineTo(976, 224); g.lineTo(944, 240); g.closePath(); g.fill(); g.beginPath(); g.arc(790, 330, 14, 0, TAU); g.fill(); }),
  // zwei Pferdeköpfe, die aus den Stalltüren schauen (links Fuchs mit Blesse, rechts Rappe mit Stern)
  pferde: () => ctex(512, 256, "b1-pferde", (g, w, h, r) => { for (let k = 0; k < 2; k++) { const x0 = k * 256, cx = x0 + 128, fell = k ? "#c4beb2" : "#a05a2c", dk = k ? "#8a847a" : "#5a2c14";
      const bg = g.createRadialGradient(cx, 150, 20, cx, 140, 200); bg.addColorStop(0, "#6a5034"); bg.addColorStop(1, "#1a120c"); g.fillStyle = bg; g.fillRect(x0, 0, 256, h);
      g.fillStyle = "#6a5a34"; for (let i = 0; i < 30; i++) g.fillRect(x0 + 10 + r() * 60, 30 + r() * 40, 2, 20 + r() * 20);
      g.fillStyle = dk; g.beginPath(); g.ellipse(cx, 250, 92, 90, 0, PI, TAU); g.fill();
      g.fillStyle = fell; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 34, 52); g.lineTo(cx + s * 52, 6); g.lineTo(cx + s * 60, 58); g.closePath(); g.fill(); }
      g.beginPath(); g.moveTo(cx - 52, 70); g.bezierCurveTo(cx - 62, 40, cx + 62, 40, cx + 52, 70); g.bezierCurveTo(cx + 50, 120, cx + 36, 170, cx + 38, 205); g.bezierCurveTo(cx + 40, 248, cx - 40, 248, cx - 38, 205);
      g.bezierCurveTo(cx - 36, 170, cx - 50, 120, cx - 52, 70); g.fill();
      g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.ellipse(cx - 18, 110, 14, 50, -.1, 0, TAU); g.fill();
      g.fillStyle = "#f2ece0"; if (!k) { g.beginPath(); g.moveTo(cx - 8, 64); g.lineTo(cx + 8, 64); g.lineTo(cx + 6, 190); g.quadraticCurveTo(cx, 214, cx - 6, 190); g.closePath(); g.fill(); } else { g.beginPath(); g.ellipse(cx, 84, 9, 12, 0, 0, TAU); g.fill(); }
      g.fillStyle = k ? "#6a6460" : "#6a3a24"; g.beginPath(); g.ellipse(cx, 212, 36, 26, 0, 0, TAU); g.fill(); g.fillStyle = "#0c0a08"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 16, 214, 6, 9, s * .3, 0, TAU); g.fill(); }
      for (const s of [-1, 1]) { g.fillStyle = "#0c0a08"; g.beginPath(); g.ellipse(cx + s * 44, 112, 8, 11, s * .4, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(cx + s * 42, 108, 2.5, 0, TAU); g.fill(); }
      g.strokeStyle = dk; g.lineWidth = 4; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(cx - 12 + i * 3, 46); g.quadraticCurveTo(cx - 18 + i * 4, 62, cx - 10 + i * 3, 76); g.stroke(); }
      g.strokeStyle = "#3a2414"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 40, 150); g.lineTo(cx + 40, 150); g.moveTo(cx - 38, 196); g.lineTo(cx + 38, 196); g.stroke(); g.fillStyle = "#c8a050"; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 40, 150, 5, 0, TAU); g.fill(); } } }),
  himmel: () => ctex(1024, 512, "b1-himmel", (g, w, h, r) => A17.himmelMalen(g, w, h, r, {verlauf: [[0, "#4f84c4"], [.5, "#8fb4da"], [.86, "#d4dad8"], [1, "#eae0cc"]], unten: "#6a6050",
    dunst: "232,224,208", sonne: [.40, .2, 8, "255,244,214"], wolken: {n: 22, farbe: "rgba(255,252,246,.55)", schatten: "rgba(160,168,186,.25)", band: [.14, .45]}})),
  env: () => { const t = ctex(512, 256, "b1-env", (g, w, h, r) => A17.himmelMalen(g, w, h, r, {verlauf: [[0, "#5a8cc8"], [.8, "#c8d0d4"], [1, "#e0d8c8"]], unten: "#5a5246"})); t.mapping = T3.EquirectangularReflectionMapping; return t; }
};

/* ---------- Postkutsche (Seitenansicht entlang x, Vorderseite +x) ---------- */
function rad(K, x, y, z, rr){ K.add("vc", new T3.TorusGeometry(rr, .035, 5, 28), M(x, y, z), {c: "#141414"}); K.add("vc", new T3.TorusGeometry(rr - .05, .04, 5, 28), M(x, y, z), {c: "#a8261c"});
  K.add("vc", new T3.CylinderGeometry(.09, .1, .22, 10), M(x, y, z, PI / 2), {c: "#a8261c"});
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; stab(K, "vc", [x + Math.cos(a) * .08, y + Math.sin(a) * .08, z], [x + Math.cos(a) * (rr - .07), y + Math.sin(a) * (rr - .07), z], .03, .03, {c: "#a8261c"}); } }
function kutsche(K, x, z){
  for (const s of [-1, 1]) { rad(K, x - .85, .72, z + s * .8, .72); rad(K, x + 1.05, .55, z + s * .8, .55); }
  for (const xa of [x - .85, x + 1.05]) K.add("vc", new T3.CylinderGeometry(.04, .04, 1.7, 6), M(xa, xa < x ? .72 : .55, z, PI / 2), {c: "#1a1a1a"});
  K.box("vc", 2.6, .1, .14, M(x + .1, .82, z), {c: "#2a1a14"}); for (const xa of [x - .85, x + 1.05]) for (const s of [-1, 1]) K.add("vc", new T3.TorusGeometry(.32, .03, 4, 12, PI), M(xa, .82, z + s * .5, 0, 0, 0, 1, .4, 1), {c: "#1a1a1a"});
  K.add("vc", new T3.CylinderGeometry(.68, .68, 1.4, 16, 1, false, PI * .5, PI), M(x, 1.48, z, PI / 2, 0, 0, 1.4, 1, .5), {c: "#4a1418"});   // gewölbter Kastenboden
  K.box("vc", 1.95, .85, 1.4, M(x, 1.62, z), {c: "#5a1a1e"}); K.box("vc", 1.95, .58, 1.4, M(x, 2.33, z), {c: "#161414"}); K.box("vc", 2.08, .08, 1.5, M(x, 2.66, z), {c: "#161414"});
  for (const s of [-1, 1]) { K.box("vc", .78, 1.32, .02, M(x, 1.9, z + s * .71), {c: "#6a2226"}); K.add("glasK", new T3.PlaneGeometry(.52, .4), M(x, 2.34, z + s * .722, 0, s < 0 ? PI : 0, 0));
    K.add("vc", new T3.CircleGeometry(.16, 16), M(x, 1.55, z + s * .725, 0, s < 0 ? PI : 0, 0), {c: "#c8a050"}); for (const dx of [-.62, .62]) K.add("glasK", new T3.PlaneGeometry(.3, .36), M(x + dx, 2.34, z + s * .722, 0, s < 0 ? PI : 0, 0)); }
  K.box("vc", .62, .7, 1.3, M(x + 1.3, 1.5, z), {c: "#161414"}); K.box("vc", .55, .1, 1.3, M(x + 1.25, 2.55, z), {c: "#3a2214"}); K.box("vc", .35, .5, 1.2, M(x + 1.42, 2.25, z, 0, 0, -.25), {c: "#161414"});
  K.box("vc", .7, .65, 1.3, M(x - 1.32, 1.6, z), {c: "#5a1a1e"});
  for (const [dx, w2, h2, c] of [[-.45, .7, .4, "#5a3a22"], [.35, .55, .32, "#2a3a2a"], [-.2, .45, .26, "#6a4a2a"]]) K.box("vc", w2, h2, .8, M(x + dx, 2.7 + h2 / 2 + (dx > 0 ? 0 : 0), z + (dx > 0 ? .15 : -.1), 0, (dx * 3) % .3, 0), {c});
  for (const s of [-1, 1]) { K.box("vc", 2.0, .03, .03, M(x, 2.92, z + s * .7), {c: "#1a1a1a"}); K.box("glasK", .14, .2, .14, M(x + 1.62, 2.2, z + s * .6)); K.box("vc", .18, .05, .18, M(x + 1.62, 2.33, z + s * .6), {c: "#1a1a1a"}); }
  stab(K, "vc", [x + 1.6, .78, z], [x + 3.1, .95, z + .1], .07, .07, {c: "#3a2214"}); for (const s of [-1, 1]) stab(K, "vc", [x + 1.6, .8, z + s * .28], [x + 2.4, .82, z + s * .1], .04, .04, {c: "#3a2214"});
}

/* ---------- Hülle ---------- */
function posthof(ctx, A){
  const {G, B, WL, H, K} = A, P = ctx.decorZ, r = U.seeded(1840), lamps = A.hu.lampen, YT = 7.6;
  A.hu.deckeY = () => YT + 2;   // offener Himmel: nichts hängt über dem Gang
  A.boden(mt("b1-boden", () => S({map: TX.kopf(), roughness: .72})), 2.4);
  for (const s of [-1, 1]) { const g = new T3.PlaneGeometry(1.15, 22).rotateX(-PI / 2); U.scaleUV(g, 1.15 / 4, 22 / 4); const m = A.mesh(g, mt("b1-platten", () => S({map: R17.TX.platten(), color: 0xc8c0b4, roughness: .7, polygonOffset: true, polygonOffsetFactor: -1})));
    m.position.set(s * 7.425, .003, 0); m.userData.noPick = true; K.box("stein", .14, .02, 22, M(s * 6.82, .008, 0)); }
  A17.kuppel(A, "b1", TX.himmel());
  // Stall links: Ziegel unten, schwarze Bretter am Heuboden, Ständer mit Kopfbändern, Rähm, Luken mit Aufzugsbalken, Schieferdach
  A.mesh(A.wandGeo(0, 5.6, 2.4, y => { const k = y < .5 ? .6 + y * .6 : 1; return [k, k * .97, k * .94]; }, ["left"]), mt("b1-ziegel", () => S({map: R17.TX.ziegelRot(), vertexColors: true, roughness: .9})));
  A.mesh(A.wandGeo(5.6, YT, 2.4, null, ["left"]), mt("b1-bretterM", () => S({map: TX.bretterD(), roughness: .85})));
  K.box("balken", .32, .32, 22.4, M(-7.84, 5.66, 0)); K.box("balken", .3, .18, 22.4, M(-7.85, YT - .09, 0));
  for (const z of P) { K.box("balken", .3, 5.5, .3, M(-7.85, 2.75, z)); K.box("stein", .42, .25, .42, M(-7.85, .12, z)); for (const k of [-1, 1]) stab(K, "balken", [-7.86, 4.55, z + k * .1], [-7.86, 5.5, z + k * 1.0], .16); A.hindernis(-7.8, z, .42, .42); }
  for (const [z, luke] of [[6.75, 1], [2.25, 0], [-2.25, 1], [-6.75, 0]]) {
    if (luke) { K.add("loch", new T3.PlaneGeometry(1.3, 1.3), M(-7.99, 6.6, z, 0, PI / 2, 0)); K.add("heu", new T3.SphereGeometry(.7, 10, 6), M(-8.25, 6.35, z, 0, 0, 0, .5, .55, .95)); K.box("balken", .2, .14, 1.6, M(-7.92, 5.95, z));
      K.box("tuer", .06, 1.3, .66, M(-7.62, 6.6, z + .66, 0, .25, 0)); stab(K, "balken", [-8, 7.45, z], [-6.85, 7.45, z], .2, .22); K.add("eisen", new T3.CylinderGeometry(.13, .13, .06, 12), M(-6.98, 7.3, z, PI / 2));
      K.add("tau", new T3.CylinderGeometry(.013, .013, 1.25, 4), M(-6.88, 6.68, z)); K.add("eisen", new T3.TorusGeometry(.06, .012, 4, 10, PI * 1.4), M(-6.88, 6.02, z));
      A.belege({x0: -8, x1: -6.7, y0: 5.85, y1: YT, z0: z - .8, z1: z + 1.1}); }
    else { K.add("loch", new T3.CircleGeometry(.36, 16), M(-7.99, 6.6, z, 0, PI / 2, 0)); K.add("balken", new T3.TorusGeometry(.38, .06, 5, 18), M(-7.97, 6.6, z, 0, PI / 2, 0)); } }
  for (const s of [-1, 1]) { const y0 = YT + (s > 0 ? .2 : 0), dg = new T3.PlaneGeometry(5.6, 23.4); U.scaleUV(dg, 5.6 / 1.6, 23.4 / 1.6);
    K.add("schiefer", dg, M(s * 10.3, y0 + 1.6, 0, 0, 0, s * .6).multiply(M(0, 0, 0, -PI / 2, 0, 0)));
    K.box("balken", .24, .22, 23.4, M(s * 8.06, y0 + .05, 0)); K.box("eisen", .14, .1, 23.4, M(s * 7.9, y0 - .03, 0)); }
  for (const [x, z] of [[10.6, 5.5], [10.6, -5.5], [-11, -1]]) { K.box("ziegelK", .9, 2.6, .7, M(x, 10.4, z), {uv: [.4, 1.1]}); for (const k of [-1, 1]) K.add("eisen", new T3.CylinderGeometry(.1, .12, .4, 8), M(x + k * .2, 11.9, z)); }
  // Posthalterei rechts: Putz, Sockel, Lisenen, Holzvordach mit Ziersaum auf Kopfbändern, Fachwerk-Obergeschoss mit Fenstern
  A.mesh(A.wandGeo(0, 5.95, 2.4, y => { const k = y < .6 ? .78 : 1; return [k, k, k * .98]; }, ["right"]), mt("b1-putz", () => S({map: TX.putz(), vertexColors: true, color: 0xd8ccb8, roughness: .92})));
  A.mesh(A.wandGeo(5.95, YT + .2, 2.0, null, ["right"]), mt("b1-putzO", () => S({map: TX.putz(), color: 0xece4d4, roughness: .92})));
  K.box("stein", .1, .6, 22, M(7.95, .3, 0)); for (const z of P) K.box("stein", .1, 5.3, .5, M(7.95, 3.25, z));
  { const yw = 5.95, ye = 5.5, xe = 6.4, L = 22.6, br = Math.hypot(8 - xe, yw - ye), dg = new T3.PlaneGeometry(br, L); U.scaleUV(dg, br / 1.2, L / 1.2);
    K.add("dachB", dg, M((8 + xe) / 2, (yw + ye) / 2 + .03, 0, 0, 0, Math.atan2(yw - ye, 8 - xe)).multiply(M(0, 0, 0, -PI / 2, 0, 0)));
    K.add("dachB", dg.clone(), M((8 + xe) / 2, (yw + ye) / 2 - .01, 0, 0, 0, Math.atan2(yw - ye, 8 - xe)).multiply(M(0, 0, 0, PI / 2, 0, 0)));
    K.add("saum", new T3.PlaneGeometry(L, .34), M(xe - .01, ye - .1, 0, 0, -PI / 2, 0), {uv: [L / 2.4, 1]}); K.box("balken", .1, .12, L, M(xe + .04, ye + .02, 0));
    for (const z of [...P, 11, -11]) { stab(K, "balken", [8, yw - .05, z], [xe + .05, ye + .02, z], .14); if (Math.abs(z) < 10) { stab(K, "balken", [7.96, 4.35, z], [xe + .5, ye - .02, z], .12);
      const lp = V3(6.95, 4.75, z); K.box("eisen", .015, ye - lp.y - .26, .015, M(lp.x, (ye + lp.y + .26) / 2, z)); K.add("glasL", new T3.CylinderGeometry(.13, .09, .3, 4, 1, false, PI / 4), M(lp.x, lp.y, z));
      K.add("eisen", new T3.ConeGeometry(.18, .14, 4, 1, false, PI / 4), M(lp.x, lp.y + .21, z)); K.add("flamme", new T3.SphereGeometry(.04, 8, 6), M(lp.x, lp.y - .02, z, 0, 0, 0, 1, 1.5, 1)); lamps.push(lp.clone().setY(lp.y - .02)); } }
    A.belege({x0: xe - .05, x1: 8, y0: 4.3, y1: 6.05, z0: -11, z1: 11}); }
  for (const zc of [6.75, 2.25, -2.25, -6.75]) for (const dz of [-.85, .85]) { const z = zc + dz; K.add("fenster", new T3.PlaneGeometry(.75, 1.05), M(7.985, 6.85, z, 0, -PI / 2, 0));
    K.box("balken", .08, .08, .95, M(7.96, 6.3, z)); K.box("balken", .08, .08, .95, M(7.96, 7.4, z)); for (const k of [-1, 1]) K.box("balken", .08, 1.18, .08, M(7.96, 6.85, z + k * .43)); }
  // Tür zur Fahrkartenausgabe (vorn rechts) mit Oberlicht und Posthorn-Schild am Ausleger
  { const z = -9.8; K.box("tuer", .08, 2.5, 1.15, M(7.97, 1.25, z)); for (const k of [-1, 1]) { K.add("fenster", new T3.PlaneGeometry(.38, .7), M(7.925, 1.85, z + k * .27, 0, -PI / 2, 0)); K.box("balken", .1, 2.7, .1, M(7.94, 1.35, z + k * .64)); }
    K.box("balken", .12, .12, 1.4, M(7.93, 2.72, z)); K.add("fenster", new T3.PlaneGeometry(1.1, .45), M(7.94, 3.0, z, 0, -PI / 2, 0)); K.box("stein", .2, .12, 1.5, M(7.9, 3.28, z)); K.box("stein", .5, .06, 1.4, M(7.75, .03, z));
    stab(K, "eisen", [8, 3.9, z], [7.0, 3.9, z], .04); K.add("schilder", new T3.PlaneGeometry(.62, .62), M(7.25, 3.5, z, 0, -PI / 2, 0), {uvr: [.66, .14, .98, .73]}); K.add("schilder", new T3.PlaneGeometry(.62, .62), M(7.25, 3.5, z, 0, PI / 2, 0), {uvr: [.66, .14, .98, .73]});
    A.belege({x0: 6.9, x1: 8, y0: 0, y1: 4.0, z0: z - .75, z1: z + .75}); }
  K.box("balken", .1, .14, 22.4, M(7.95, 5.98, 0)); K.box("balken", .1, .14, 22.4, M(7.95, YT + .12, 0));
  for (const z of P) { K.box("balken", .1, YT - 5.9, .14, M(7.95, (YT + 6.05) / 2, z)); for (const k of [-1, 1]) stab(K, "balken", [7.95, 6.06, z + k * .1], [7.95, YT + .05, z + k * 1.0], .1); }
  // Stationsgebäude vorn: Ziegel, Stalltüren mit Pferden, Remise mit der Kutsche, Fenster, Gesimse, Giebel mit Uhr
  { const zW = B.z1, sh = new T3.Shape(); sh.moveTo(-8, 0); sh.lineTo(8, 0); sh.lineTo(8, YT); sh.lineTo(3.2, YT); sh.lineTo(0, 9.9); sh.lineTo(-3.2, YT); sh.lineTo(-8, YT); sh.closePath();
    const hole = (x0, x1, y0, y1) => { const p = new T3.Path(); p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath(); sh.holes.push(p); };
    hole(3.1, 7.5, 0, 3.9); for (const x of [-6.9, -5.3]) hole(x - .6, x + .6, 1.2, 2.35); for (const x of [-6.3, -3.6, 3.6, 6.3]) hole(x - .55, x + .55, 5.0, 6.5);
    K.add("ziegelK", U.scaleUV(new T3.ShapeGeometry(sh, 2), 1 / 2.4, 1 / 2.4), M(0, 0, zW));
    K.box("stein", 16.2, .16, .2, M(0, 4.55, zW + .1)); K.box("stein", 16.4, .3, .32, M(0, YT, zW + .14)); K.box("stein", 16, .5, .14, M(0, .25, zW + .07));
    for (const k of [-1, 1]) stab(K, "stein", [k * 3.4, YT + .05, zW + .14], [0, 10.05, zW + .14], .28, .3);
    for (const x of [-6.3, -3.6, 3.6, 6.3]) { K.add("fenster", new T3.PlaneGeometry(1.1, 1.5), M(x, 5.75, zW - .05)); K.box("stein", 1.3, .12, .22, M(x, 4.95, zW + .1)); K.box("stein", 1.3, .2, .12, M(x, 6.6, zW + .06)); }
    // Steinportal um die Tür (frei bis 6,2 m Höhe über |x| < 2,3)
    for (const k of [-1, 1]) { K.box("stein", .34, 6.2, .22, M(k * 2.5, 3.1, zW + .11)); K.box("stein", .44, .3, .3, M(k * 2.5, .15, zW + .15)); }
    K.box("stein", 5.5, .42, .3, M(0, 6.42, zW + .15)); K.box("stein", 5.8, .1, .36, M(0, 6.68, zW + .18));
    // Stalltüren: unten geschlossene Halbtür, oben offen (Pferd dahinter), aufgeklappte Oberhälfte an der Wand
    for (const [i, x] of [[0, -6.9], [1, -5.3]]) { K.add("pferd", new T3.PlaneGeometry(1.2, 1.2), M(x, 1.75, zW - .3), {uvr: [i * .5, .03, i * .5 + .5, .97]}); for (const k of [-1, 1]) K.box("tuer", .06, 1.2, .3, M(x + k * .6, 1.75, zW - .15));
      K.box("tuer", 1.2, 1.2, .06, M(x, .6, zW + .03)); K.box("balken", 1.4, .16, .1, M(x, 2.43, zW + .05)); for (const k of [-1, 1]) K.box("balken", .1, 2.4, .1, M(x + k * .65, 1.2, zW + .05));
      K.box("tuer", .58, 1.15, .05, M(x - .92 + i * .02, 1.75, zW + .06)); for (const y of [.25, .95]) K.box("eisen", 1.0, .05, .015, M(x, y, zW + .065)); }
    K.add("schilder", new T3.PlaneGeometry(2.2, 1.32), M(-6.1, 3.5, zW + .06), {uvr: [0, 0, .625, .75]}); K.box("balken", 2.36, 1.48, .05, M(-6.1, 3.5, zW + .02));
    // Remise: dunkler Raum hinter der Öffnung, Torflügel innen, Laterne, Kutsche; Schild darüber
    { const x0 = 3.1, x1 = 7.5, zb = zW - 3.6, yc = 4.1;
      K.box("remise", x1 - x0, .1, 3.6, M((x0 + x1) / 2, yc, zW - 1.8)); K.box("remise", x1 - x0, yc, .1, M((x0 + x1) / 2, yc / 2, zb)); for (const x of [x0, x1]) K.box("remise", .1, yc, 3.6, M(x, yc / 2, zW - 1.8));
      K.box("remise", x1 - x0, .02, 3.6, M((x0 + x1) / 2, .01, zW - 1.8)); for (const [x, k] of [[x0 + .08, 1], [x1 - .08, -1]]) K.box("tuer", .08, 3.7, 1.6, M(x, 1.9, zW - .9));
      K.box("balken", 4.6, .3, .3, M((x0 + x1) / 2, 4.0, zW + .05)); for (const x of [x0, x1]) K.box("balken", .2, 3.9, .25, M(x, 1.95, zW + .05));
      K.add("schilder", new T3.PlaneGeometry(4.0, .5), M((x0 + x1) / 2, 4.38, zW + .1), {uvr: [0, .75, 1, 1]});
      const lp = V3(x1 - .5, 3.2, zW - .6); K.box("eisen", .015, .6, .015, M(lp.x, 3.65, lp.z)); K.add("glasL", new T3.CylinderGeometry(.12, .08, .28, 4, 1, false, PI / 4), M(lp.x, lp.y, lp.z)); K.add("eisen", new T3.ConeGeometry(.16, .12, 4, 1, false, PI / 4), M(lp.x, lp.y + .2, lp.z)); lamps.push(lp);
      kutsche(K, 5.05, zW - 1.75); for (let i = 0; i < 5; i++) K.add("heu", new T3.SphereGeometry(.3, 8, 5), M(x0 + .5 + i * .2, .15, zb + .4, 0, 0, 0, 1.2, .5, 1)); }
    // Uhr im Giebel (zeigt die echte Zeit) und Wetterfahne
    K.add("stein", new T3.CylinderGeometry(.74, .74, .12, 28), M(0, 8.45, zW + .06, PI / 2)); K.add("uhr", new T3.CircleGeometry(.64, 28), M(0, 8.45, zW + .125));
    const hm = mt("b1-zeiger", () => S({color: 0x141210, roughness: .4})), zg = [[.035, .38], [.025, .54]].map(([w2, l]) => { const m = new T3.Mesh(new T3.BoxGeometry(w2, l, .01).translate(0, l / 2 - .06, 0), hm); m.position.set(0, 8.45, zW + .14); G.add(m); return m; });
    ctx.tick(() => { const d = new Date(), mi = d.getMinutes() + d.getSeconds() / 60, ho = d.getHours() % 12 + mi / 60; zg[0].rotation.z = -ho / 12 * TAU; zg[1].rotation.z = -mi / 60 * TAU; });
    K.box("eisen", .04, .9, .04, M(0, 10.45, zW + .14)); K.box("eisen", .9, .05, .02, M(.05, 10.7, zW + .14)); K.add("eisen", new T3.ConeGeometry(.08, .2, 4), M(.55, 10.7, zW + .14, 0, 0, -PI / 2, 1, 1, .2));
    K.box("eisen", .3, .22, .02, M(-.35, 10.72, zW + .14)); K.add("eisen", new T3.SphereGeometry(.06, 8, 6), M(0, 10.0, zW + .14));
    A.belege({x0: 3.0, x1: 7.6, y0: 0, y1: 4.5, z0: zW, z1: zW + .3}); }
  // Tordurchfahrt hinten: Ziegelwand mit Bogen um die Tür (frei bis 6,2 m über |x| < 2,3), Fenster, Pferdetränke mit Pumpe
  { const zW = B.z0, R = 3.88, yc = 3.12, a0 = Math.acos(2.6 / R), sh = new T3.Shape(); sh.moveTo(-8, 0); sh.lineTo(8, 0); sh.lineTo(8, YT); sh.lineTo(-8, YT); sh.closePath();
    const ho = new T3.Path(); ho.moveTo(-2.6, 0); ho.lineTo(-2.6, 6.0); for (let i = 1; i < 12; i++) { const a = PI - a0 - i / 12 * (PI - 2 * a0); ho.lineTo(R * Math.cos(a), yc + R * Math.sin(a)); } ho.lineTo(2.6, 6.0); ho.lineTo(2.6, 0); ho.closePath(); sh.holes.push(ho);
    for (const x of [-6.3, -4.2, 4.2, 6.3]) { const p = new T3.Path(); p.moveTo(x - .5, 5.0); p.lineTo(x + .5, 5.0); p.lineTo(x + .5, 6.5); p.lineTo(x - .5, 6.5); p.closePath(); sh.holes.push(p); }
    K.add("ziegelK", U.scaleUV(new T3.ShapeGeometry(sh, 6), 1 / 2.4, 1 / 2.4), M(0, 0, zW, 0, PI, 0));
    for (const x of [-6.3, -4.2, 4.2, 6.3]) { K.add("fenster", new T3.PlaneGeometry(1.0, 1.5), M(x, 5.75, zW + .05, 0, PI, 0)); K.box("stein", 1.2, .12, .22, M(x, 4.95, zW - .1)); }
    const ring = new T3.Shape(); for (let i = 0; i <= 12; i++) { const a = a0 + i / 12 * (PI - 2 * a0); i ? ring.lineTo((R + .45) * Math.cos(a), yc + (R + .45) * Math.sin(a)) : ring.moveTo((R + .45) * Math.cos(a), yc + (R + .45) * Math.sin(a)); }
    for (let i = 12; i >= 0; i--) { const a = a0 + i / 12 * (PI - 2 * a0); ring.lineTo(R * Math.cos(a), yc + R * Math.sin(a)); } ring.closePath();
    K.add("stein", new T3.ExtrudeGeometry(ring, {depth: .18, bevelEnabled: false}), M(0, 0, zW - .18)); for (const k of [-1, 1]) K.box("stein", .45, 6.0, .18, M(k * 2.83, 3.0, zW - .09));
    K.box("stein", 16.4, .3, .32, M(0, YT, zW - .14)); K.box("stein", 16.2, .16, .2, M(0, 4.55, zW - .1)); K.box("stein", 16, .5, .14, M(0, .25, zW - .07));
    K.add("loch", new T3.PlaneGeometry(5.2, 7.2), M(0, 3.6, zW + 4, 0, PI, 0)); K.add("licht", new T3.PlaneGeometry(4.6, 6.5), M(0, 3.25, zW + 3.98, 0, PI, 0));
    for (const k of [-1, 1]) K.box("ziegelK", .1, 7.2, 4, M(k * 2.62, 3.6, zW + 2), {uv: [.4, 3]}); K.box("remise", 5.2, .1, 4, M(0, 7.05, zW + 2));
    // Tränke und Schwengelpumpe
    const tx = 5.7, tz = zW - .45; K.box("stein", 2.1, .62, .7, M(tx, .31, tz)); K.box("wasser", 1.9, .02, .5, M(tx, .56, tz)); K.box("eisen", .2, 1.25, .2, M(tx + 1.32, .62, tz + .1));
    K.add("eisen", new T3.CylinderGeometry(.04, .05, .35, 8), M(tx + 1.15, 1.08, tz + .1, 0, 0, PI / 2.4)); stab(K, "eisen", [tx + 1.38, 1.3, tz + .1], [tx + 1.9, 1.62, tz + .1], .04); K.add("eisen", new T3.SphereGeometry(.12, 10, 8), M(tx + 1.32, 1.32, tz + .1));
    A.hindernis(tx + .15, tz, 2.6, .8); A.belege({x0: tx - 1.1, x1: tx + 2.0, y0: 0, y1: 1.7, z0: tz - .4, z1: zW}); }
  // Wandlaternen an den Stallständern, Laternenpfähle in den hinteren Ecken
  for (const z of P) lamps.push(A17.wandLaterne(K, -1, z, 3.3, 7.7));
  for (const z of P) A.belege(ctx.wand("left", z, 3.15, 3.85, .45, .65));
  for (const [x, z] of [[-7.35, 10.3], [7.45, 9.75]]) { lamps.push(A17.laternenPfahl(K, x, z, {h: 3.5})); A.hindernis(x, z, .5, .5); A.belege({x0: x - .45, x1: x + .45, y0: 0, y1: 3.7, z0: z - .45, z1: z + .45}); }
  A.fertig([["balken", () => mt("b1-balken", () => S({map: tex.wood(true), color: 0x7a6a5a, roughness: .8})), {cast: true}], ["stein", () => mt("b1-stein", () => S({color: 0xb0a898, roughness: .85}))],
    ["ziegelK", () => mt("b1-ziegelK", () => S({map: R17.TX.ziegelRot(), roughness: .9}))], ["schiefer", () => mt("b1-schiefer", () => S({map: TX.schiefer(), roughness: .6, side: T3.DoubleSide}))],
    ["dachB", () => mt("b1-dachB", () => S({map: TX.bretterD(), color: 0x9a8a78, roughness: .85}))], ["saum", () => mt("b1-saum", () => S({map: TX.saum(), alphaTest: .5, side: T3.DoubleSide, roughness: .7}))],
    ["fenster", () => mt("b1-fenster", () => S({color: 0x3a4048, roughness: .15, metalness: .5, emissive: 0x3a2610, emissiveIntensity: .7}))],
    ["loch", () => mt("k1-loch", () => KB({color: 0x0e0c0a}))], ["licht", () => mt("b1-licht", () => KB({color: 0xe8e0d0, fog: false}))], ["heu", () => mt("b1-heu", () => S({color: 0xc8a858, roughness: 1}))],
    ["tuer", () => mt("b1-tuer", () => S({map: tex.wood(false), color: 0x8aa88a, roughness: .7}))], ["remise", () => mt("b1-remise", () => S({map: tex.wood(true), color: 0x5a4a3e, roughness: .9}))],
    ["schilder", () => mt("b1-schilder", () => S({map: TX.schilder(), roughness: .6}))], ["pferd", () => mt("b1-pferd", () => S({map: TX.pferde(), roughness: .9}))],
    ["uhr", () => kmat("face")], ["wasser", () => mt("b1-wasser", () => S({color: 0x3a4a4a, roughness: .08, metalness: .6}))], ["tau", () => mt("k1-tau", () => S({color: 0x8a7656, roughness: .9}))],
    ["eisen", A17.MA.eisen], ["glasL", A17.MA.glasL], ["flamme", A17.MA.flamme], ["vc", R17.ST.vc, {color: true, cast: true}], ["glasK", () => mt("b1-glasK", () => S({color: 0x1a2028, roughness: .1, metalness: .6}))]]);
  A.halos(lamps, 0xffd8a0, .55);
  return {punkt: [[0xffcf8a, 5, 12, -7.25, 3.45, 4.5], [0xffcf8a, 5, 12, 6.95, 4.7, -4.5], [0xffc070, 5, 7, 6.9, 3.0, -11.6]],
    flackern: (t, L) => { for (let i = 0; i < 3; i++) L[i].intensity = L[i].userData.i0 * (.94 + .04 * Math.sin(t * 1.7 + i * 2.1) + .02 * Math.sin(t * 2.9 + i)); }};
}

/* ---------- Ausstattung ---------- */
function heuballen(D, F, x, y, z, ry){ const C = D.subF(F, x, z, ry, y); D.bx("vc", .9, .4, .5, C.m(0, .2, 0), "#c8a858"); for (const k of [-1, 1]) D.bx("vc", .015, .41, .51, C.m(k * .25, .2, 0), "#7a5a2a");
  D.bx("vc", .92, .06, .52, C.m(0, .4, 0, 0, 0, .02), "#d4b468"); }
function bank(D, F, x){ const C = D.subF(F, x, .35); D.bx("wood", 1.7, .06, .4, C.m(0, .46, 0)); for (const k of [-1, 1]) { D.bx("dark", .08, .46, .36, C.m(k * .7, .23, 0)); } D.bx("wood", 1.7, .2, .04, C.m(0, .82, -.2, -.12)); for (const k of [-1, 1]) D.bx("dark", .06, .45, .05, C.m(k * .7, .67, -.19, -.12));
  D.bx("paper", .3, .01, .24, C.m(.4, .495, .02, 0, .3, 0)); }
function milchkannen(D, F){ for (let i = 0; i < 3; i++) { const C = D.subF(F, -.4 + i * .38, .3 + (i % 2) * .12); D.lat("steel", [[0, 0], [.16, 0], [.17, .04], [.17, .42], [.11, .52], [.1, .6], [.12, .62], [0, .63]], 14, C.m());
    D.cy("steel", .1, .1, .06, 10, C.m(0, .66, 0)); D.tor("steel", .06, .008, 3, 10, C.m(.12, .5, 0, 0, PI / 2, 0), null, PI); } }
function karren(D, F){ const C = D.subF(F, 0, .45); for (const k of [-1, 1]) { D.tor("iron", .32, .025, 5, 18, C.m(k * .45, .33, .1, 0, PI / 2, 0)); for (let i = 0; i < 8; i++) D.rod("wood", C, [k * .45, .33, .1], [k * .45, .33 + Math.sin(i * PI / 4) * .3, .1 + Math.cos(i * PI / 4) * .3], .012, 4); }
  D.bx("wood", .82, .05, 1.2, C.m(0, .4, -.05)); for (const k of [-1, 1]) D.rod("dark", C, [k * .38, .42, -.6], [k * .3, .9, -1.05], .025, 5); D.rod("dark", C, [-.3, .9, -1.05], [.3, .9, -1.05], .02, 5);
  D.chest(C, .0, .62, .45, .4, .1); D.suitcase(C, 0, .85, -.2, .5, .18, .36, "#3a2a22", -.15); D.cy("vc", .14, .14, .18, 14, C.m(.2, .52, .3), "#6a2a22"); }
function kummet(D, F, x){ const y = 2.25; D.tor("vc", .2, .07, 8, 16, F.m(x, y, .1, 0, 0, 0, 1, 1.35, 1), "#3a2214"); for (const k of [-1, 1]) D.tor("brass", .23, .015, 4, 12, F.m(x, y, .13, 0, 0, k * .2, 1, 1.35, 1), null, PI * .5);
  D.sp("brass", .03, 6, 4, F.m(x, y + .34, .14)); D.bx("iron", .04, .04, .14, F.m(x, y + .3, .05)); }
function hufeisen(D, F, x){ for (let i = 0; i < 3; i++) D.tor("iron", .07, .016, 4, 10, F.m(x - .16 + i * .16, 2.3 - (i % 2) * .08, .03, 0, 0, PI * 1.5), null, PI * 1.6); D.bx("dark", .56, .1, .03, F.m(x, 2.42, .015)); }
function briefkasten(D, F, x){ D.bx("vc", .32, .42, .2, F.m(x, 2.2, .1), "#a01e18"); D.cy("vc", .16, .16, .2, 14, F.m(x, 2.41, .1, PI / 2, 0, 0, 1, 1, 1), "#a01e18"); D.bx("vc", .2, .025, .02, F.m(x, 2.3, .205), "#1a1a1a"); D.bx("brass", .1, .05, .01, F.m(x, 2.12, .205)); }
function ausstattung(D){
  R17.dekorMat(D); const C = D.COMP, {WL, R} = D.st();
  D.KEYMAT.t_fahrplan = () => mt("b1-schilder", () => S({map: TX.schilder(), roughness: .6}));
  C.t_gepaeck = (w, a) => ({b: [D.q(w, a, -1.0, 1.0, 0, 1.25, .7, true)], build: F => { D.chest(F, -.45, .9, .55, .5); D.suitcase(F, -.5, .58, .3, .7, .2, .42, "#3a2a22", .06); D.suitcase(F, .45, 0, .3, .62, .34, .4, "#5a3a22", -.1);
    D.suitcase(F, .48, .34, .3, .5, .16, .34, "#2a3a2a", .12); D.cy("vc", .17, .17, .24, 14, F.m(.5, .62, .3), "#6a2a22"); D.cy("vc", .175, .175, .02, 14, F.m(.5, .75, .3), "#3a1a14"); }});
  C.t_heu = (w, a) => ({b: [D.q(w, a, -1.05, 1.05, 0, 1.3, .72, true)], build: F => { heuballen(D, F, -.48, 0, .3, .05); heuballen(D, F, .48, 0, .3, -.04); heuballen(D, F, 0, .41, .3, .1);
    D.rod("wood", F, [.85, 0, .15], [.7, 1.25, .2], .015, 5); for (let k = -1; k <= 1; k++) D.rod("iron", F, [.7 + k * .04, 1.25, .2], [.69 + k * .05, 1.45, .22], .005, 4); }});
  C.t_bank = (w, a) => ({b: [D.q(w, a, -.92, .92, 0, 1.0, .62, true)], build: F => bank(D, F, 0)});
  C.t_milch = (w, a) => ({b: [D.q(w, a, -.75, .75, 0, .75, .55, true)], build: F => milchkannen(D, F)});
  C.t_karren = (w, a) => ({b: [D.q(w, a, -.75, .75, 0, 1.25, 1.25, true)], build: F => karren(D, F)});
  C.t_rad = (w, a) => ({b: [D.q(w, a, -1.32, 1.7, 0, 1.6, .74, true)], build: F => { D.pennyFarthing(F, -.35); D.wagonWheel(F, 1.0); }});
  C.t_faesser = (w, a) => ({b: [D.q(w, a, -.9, .9, 0, 1.0, .7, true)], build: F => { D.barrel(F, -.4, 0, .33, .85); D.barrel(F, .4, 0, .33, .85); }});
  let nbk = 0;   // nur ein Briefkasten im Hof, an den weiteren Plätzen Laternen
  moebel(D, felder(D), ["t_gepaeck", "t_heu", "t_bank", "t_rad", "t_milch", "t_karren", "t_faesser", "t_bank"], 4, ["t_bank"]);
  wandKlein(D, felder(D).filter(p => !p.low), [{w: .55, y0: 1.95, y1: 2.62, d: .22, fn: (F, x) => kummet(D, F, x)}, {w: .62, y0: 2.0, y1: 2.5, d: .08, fn: (F, x) => hufeisen(D, F, x)},
    {w: .4, y0: 1.95, y1: 2.62, d: .26, fn: (F, x) => { if (!nbk++) briefkasten(D, F, x); else { D.bx("iron", .03, .03, .2, F.m(x, 2.5, .1)); laterne(D, F, x, 2.06, .2); } }}, {w: .3, y0: 1.95, y1: 2.6, d: .26, fn: (F, x) => { D.bx("iron", .03, .03, .2, F.m(x, 2.5, .1)); laterne(D, F, x, 2.06, .2); }}]);
  for (const [s, x, kind] of [["back", -5.3, "t_gepaeck"], ["back", -3.4, "t_milch"], ["front", 2.85, "t_faesser"]]) { const w = WL[s], c = C[kind](w, x); if (D.claim(...c.b)) c.build(D.FW(w, x)); }
  ecken(D, (w, a, F, i) => { if (D.claim(D.q(w, a, -.45, .45, 0, 1.0, .65, true))) { D.barrel(F, 0, 0, .34, .8); if (i % 2) D.bx("vc", .5, .02, .4, F.m(0, .69, .34), "#7a6a4a"); } });
}

KIT.raum.beweg1 = {titel: "Kutschenstation", pult: true,   // Stationen als Stehpult mit Laterne statt Schreibtisch (12_detektiv.js)
  licht: {bg: 0xa8c4e0, nebel: 0xd8d6ce, dichte: .014, envTex: () => TX.env(), himmel: [0xe0ecff, 0x7a6a58, 1.1], umgebung: [0xfff4e4, .22], sonne: [0xfff0d8, 1.9, [8, 14, 6]], fuell: [0xd0dcf0, .5, [-8, 9, -10]]},
  huelle: posthof, ausstattung,
  stimmung: {staub: {farbe: 0xfff0d0, n: 90, groesse: .035},
    boden: {n: 4, mat: () => mt("b1-dunst0", () => KB({map: tex.fog(), color: 0xf0ece4, transparent: true, opacity: .08, depthWrite: false, side: T3.DoubleSide}))},
    dunst: {n: 3, mat: () => mt("b1-dunst1", () => KB({map: tex.fog(), color: 0xf4f0ea, transparent: true, opacity: .05, depthWrite: false, side: T3.DoubleSide}))}}};
})();
