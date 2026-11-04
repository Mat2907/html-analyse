/* ---------- 20_strom1.js ---------- */
/* =====================================================================
   Raum 1 · Stromstärke – Spannung – Widerstand (Kap. 1.1–1.3)
   Mittelstück: Stromkreis auf dem Experimentiertisch (Schalter → Lampe, Elektronenfluss, Amperemeter, Voltmeter)
   A: Wassermodell · B: Widerstandsdrähte · C: Riesen-Multimeter · D: Vitrine der Spannungsquellen · Kronleuchter über dem Gang
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;

/* ---------- Bausteine ---------- */
function scaleTex(T, letter, sub){
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#f6f0e2"; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  g.strokeStyle = "#222"; g.lineWidth = 3; g.beginPath(); g.arc(128, 170, 96, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
  for (let i = 0; i <= 10; i++) { const a = Math.PI * 1.2 + i / 10 * Math.PI * .6, r1 = i % 5 ? 86 : 78;
    g.lineWidth = i % 5 ? 2 : 4; g.beginPath(); g.moveTo(128 + Math.cos(a) * r1, 170 + Math.sin(a) * r1); g.lineTo(128 + Math.cos(a) * 96, 170 + Math.sin(a) * 96); g.stroke(); }
  g.fillStyle = "#b3261e"; g.font = "700 64px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(letter, 128, 196);
  if (sub) { g.fillStyle = "#333"; g.font = "600 22px Georgia, serif"; g.fillText(sub, 128, 232); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
function meter(ctx, letter, sub, r = .2){
  const T = ctx.T, g = new T.Group();
  const body = ctx.cyl(r, r, .09, ctx.world === "sterne" ? ctx.mat("steel") : ctx.mat("darkwood"), 32); body.rotation.x = Math.PI / 2; g.add(body);
  const rim = ctx.mesh(new T.TorusGeometry(r, .018, 8, 40), ctx.mat("brass")); rim.position.z = .046; g.add(rim);
  const face = new T.Mesh(new T.CircleGeometry(r * .9, 40), new T.MeshStandardMaterial({map: scaleTex(T, letter, sub), roughness: .6})); face.position.z = .047; g.add(face);
  const piv = new T.Group(); piv.position.set(0, -r * .33, .055); g.add(piv);
  const needle = ctx.box(.008, r * .78, .004, ctx.mat("color", {color: "#b3261e"})); needle.position.y = r * .39; piv.add(needle);
  const hub = ctx.cyl(.018, .018, .02, ctx.mat("brass"), 12); hub.rotation.x = Math.PI / 2; piv.add(hub);
  const glassC = new T.Mesh(new T.CircleGeometry(r * .92, 40), ctx.mat("glass", {opacity: .12})); glassC.position.z = .065; g.add(glassC);
  let v = 0, target = 0; ctx.tick(dt => { v += (target - v) * Math.min(1, dt * 3); piv.rotation.z = .94 - 1.88 * v + (target > 0 ? Math.sin(performance.now() / 90) * .004 : 0); });
  g.setVal = x => { target = Math.max(0, Math.min(1, x)); };
  return g;
}
function battery(ctx){
  const T = ctx.T, g = new T.Group();
  if (ctx.world === "zauber") {
    const holder = ctx.box(.34, .06, .16, ctx.mat("brass")); holder.position.y = .03; g.add(holder);
    const cr = ctx.mesh(new T.OctahedronGeometry(.13, 0), ctx.mat("crystal", {color: "#8f5bff", intensity: .9})); cr.scale.set(1.25, 1.6, .9); cr.position.y = .24; g.add(cr);
    ctx.tick((dt, t) => { cr.rotation.y = t * .6; });
  } else if (ctx.world === "sterne") {
    const cell = ctx.cyl(.08, .08, .34, ctx.mat("steel"), 24); cell.rotation.z = Math.PI / 2; cell.position.y = .09; g.add(cell);
    const band = ctx.cyl(.083, .083, .1, ctx.mat("glow", {color: "#4FC3F7", intensity: 1.6}), 24); band.rotation.z = Math.PI / 2; band.position.y = .09; g.add(band);
  } else {
    const jar = ctx.cyl(.1, .1, .26, ctx.mat("glass", {color: "#d8e8d0", opacity: .35}), 24); jar.position.y = .13; g.add(jar);
    const liq = ctx.cyl(.092, .092, .17, ctx.mat("water", {color: "#7a8f5a"}), 24); liq.position.y = .09; g.add(liq);
    const rod = ctx.cyl(.02, .02, .34, ctx.mat("color", {color: "#222"}), 10); rod.position.set(.03, .2, 0); g.add(rod);
    const zinc = ctx.cyl(.025, .025, .3, ctx.mat("steel"), 10); zinc.position.set(-.04, .18, .02); g.add(zinc);
  }
  // Polschilder schräg gestellt (von vorn und von der Seite lesbar) und seitlich versetzt, damit sie sich von vorn nicht überdecken
  const plus = ctx.text("+", {size: .15, color: "#ff5a48"}); const ly = ctx.world === "sterne" ? .27 : .34; plus.position.set(.21, ly, .12); plus.rotation.y = -.7;
  const minus = ctx.text("−", {size: .15, color: "#5a96ff"}); minus.position.set(-.21, ly, -.12); minus.rotation.y = -.7;
  g.add(plus, minus); return g;
}
function bulb(ctx){
  const T = ctx.T, g = new T.Group();
  const sock = ctx.cyl(.05, .06, .1, ctx.mat("brass"), 16); sock.position.y = .05; g.add(sock);
  const base = ctx.box(.2, .04, .14, ctx.mat("darkwood")); base.position.y = .02; g.add(base);
  const glass = ctx.sphere(.1, ctx.mat("glass", {color: "#fff6dc", opacity: .3}), 24); glass.position.y = .19; g.add(glass);
  const filM = new T.MeshStandardMaterial({color: 0x553311, emissive: 0xffb347, emissiveIntensity: 0}); const fil = new T.Mesh(new T.TorusGeometry(.03, .005, 6, 16), filM); fil.position.y = .19; g.add(fil);
  const halo = ctx.glow(0xffd27a, .01); halo.position.y = .19; g.add(halo);
  g.setOn = k => { filM.emissiveIntensity = 4 * k; halo.scale.setScalar(.01 + .9 * k); };
  return g;
}
function lever(ctx){
  const T = ctx.T, g = new T.Group();
  const base = ctx.box(.24, .03, .12, ctx.mat("darkwood")); base.position.y = .015; g.add(base);
  for (const x of [-.08, .08]) { const p = ctx.box(.02, .06, .04, ctx.mat("brass")); p.position.set(x, .05, 0); g.add(p); }
  const piv = new T.Group(); piv.position.set(-.08, .07, 0); g.add(piv);
  const arm = ctx.box(.2, .015, .025, ctx.mat("copper")); arm.position.x = .1; piv.add(arm);
  const knob = ctx.sphere(.025, ctx.mat("color", {color: "#222"}), 12); knob.position.x = .2; piv.add(knob);
  let a = .9, tgt = .9; ctx.tick(dt => { a += (tgt - a) * Math.min(1, dt * 8); piv.rotation.z = a; });
  g.setClosed = c => { tgt = c ? 0 : .9; }; return g;
}

R3D.rooms.strom1 = ctx => {
  const T = ctx.T, S = ctx.slots;

  /* ===== Mittelstück: Stromkreis auf dem Experimentiertisch ===== */
  const cx = S.center.x, cz = S.center.z, top = .95, Y = top + .02;
  const tableTop = ctx.box(2.7, .08, 1.5, ctx.mat(ctx.world === "sterne" ? "metal" : "wood")); ctx.add(tableTop, cx, top - .04, cz);
  for (const [x, z] of [[-1.25, -.65], [1.25, -.65], [-1.25, .65], [1.25, .65]]) ctx.add(ctx.box(.09, top - .08, .09, ctx.mat(ctx.world === "sterne" ? "steel" : "darkwood")), cx + x, (top - .08) / 2, cz + z);
  if (ctx.world === "sterne") { const edge = ctx.box(2.72, .02, 1.52, ctx.mat("glow", {color: "#4FC3F7", intensity: .8})); ctx.add(edge, cx, top - .085, cz); }
  ctx.obstacleBox(cx, cz, 2.8, 1.6);
  const P = (x, z) => new T.Vector3(cx + x, Y, cz + z);
  const loop = ctx.path([P(-1, -.3), P(-1, .3), P(-.6, .5), P(0, .5), P(.6, .5), P(1, .25), P(1, -.25), P(.6, -.5), P(0, -.5), P(-.6, -.5)], true);
  const wire = ctx.mesh(new T.TubeGeometry(loop, 160, .012, 8, true), ctx.mat("copper")); ctx.group.add(wire);
  const bat = battery(ctx); ctx.add(bat, cx - 1, Y, cz - .05); bat.rotation.y = Math.PI / 2;
  const sw = lever(ctx); ctx.add(sw, cx - .45, Y, cz + .5);
  const am = meter(ctx, "A", "Stromstärke"); ctx.add(am, cx + .3, Y + .25, cz + .52);
  const amFoot = ctx.box(.3, .05, .12, ctx.mat("darkwood")); ctx.add(amFoot, cx + .3, Y + .02, cz + .52);
  const lamp = bulb(ctx); ctx.add(lamp, cx + 1, Y, cz);
  const vm = meter(ctx, "V", "Spannung"); ctx.add(vm, cx + 1.02, Y + .25, cz - .6); vm.rotation.y = -Math.PI / 2 + .35;
  const vFoot = ctx.box(.12, .05, .3, ctx.mat("darkwood")); ctx.add(vFoot, cx + 1.02, Y + .02, cz - .6);
  // Voltmeter parallel zur Lampe: zwei Messleitungen von den Lampenanschlüssen
  // rote Leitung (+) an den Lampenanschluss zur Pluspol-Seite (−z, hintere Leitung zum +), dunkle (−) an die Seite zum Minuspol (+z)
  ctx.tube([[cx + 1, Y + .02, cz + .12], [cx + 1.25, Y + .08, cz - .1], [cx + 1.12, Y + .12, cz - .52]], .008, ctx.mat("color", {color: "#2c3e50"}));
  ctx.tube([[cx + 1, Y + .02, cz - .12], [cx + .82, Y + .08, cz - .35], [cx + .95, Y + .12, cz - .56]], .008, ctx.mat("color", {color: "#c0392b"}));
  const e = ctx.flow(loop, {count: 34, size: .02, color: ctx.world === "detektiv" ? 0x9fd3ff : 0x5ec8ff, speed: .09, on: false}); e.dir = 1;   // Minuspol liegt am +z-Ende der Quelle: Elektronen laufen außen vom − über Schalter, Amperemeter, Lampe zum +
  const lampLight = ctx.light(0xffc46b, 0, 7, cx + 1, Y + .5, cz);
  let on = false;
  const setCircuit = c => { on = c; sw.setClosed(c); e.on = c; am.setVal(c ? .5 : 0); vm.setVal(c ? .45 : 0); };
  ctx.tick(dt => { const k = on ? 1 : 0; lampK += (k - lampK) * Math.min(1, dt * 6); lamp.setOn(lampK); if (lampLight) lampLight.intensity = 5 * lampK; chand(lampK); });
  let lampK = 0;
  ctx.exhibit(sw, {label: "Schalter", sub: "anklicken zum Umlegen", title: "Ein geschlossener Stromkreis",
    onClick: () => setCircuit(!on),
    get text(){ return on
      ? "Der Schalter ist **geschlossen**: Die Elektronen fließen vom **Minuspol** der Quelle durch Leitungen, Amperemeter und Lampe zum **Pluspol**. Die technische Stromrichtung zeigt umgekehrt von + nach −.\n\nDas **Amperemeter** (in Reihe) zeigt I = 0,25 A, das **Voltmeter** (parallel zur Lampe) U = 4,5 V."
      : "Der Schalter ist **offen**: Der Stromkreis ist unterbrochen, es fließt kein Strom – die Lampe bleibt dunkel und beide Zeiger stehen auf null. Klicke noch einmal, um ihn zu schließen."; }});
  ctx.exhibit(am, {label: "Amperemeter", title: "Amperemeter – misst die Stromstärke", text: "Die **Stromstärke I** gibt an, wie viel Ladung pro Sekunde durch den Leiter fließt. Einheit: **1 Ampere (1 A)**.\n\nDas Amperemeter wird **in Reihe** in den Stromkreis geschaltet – der ganze Strom muss hindurch. Im unverzweigten Stromkreis ist die Stromstärke überall gleich groß."});
  ctx.exhibit(vm, {label: "Voltmeter", title: "Voltmeter – misst die Spannung", text: "Die **Spannung U** ist der Antrieb des elektrischen Stroms. Einheit: **1 Volt (1 V)**.\n\nDas Voltmeter wird **parallel** zum Bauteil geschaltet, an dem die Spannung gemessen werden soll – hier an der Lampe."});
  ctx.exhibit(bat, {label: "Spannungsquelle", title: "Die Spannungsquelle", text: "Die Quelle hat einen **Pluspol** und einen **Minuspol**. Am Minuspol herrscht Elektronenüberschuss, am Pluspol Elektronenmangel. Dieser Unterschied zwischen den Polen ist die **Spannung**: Sie treibt die Elektronen durch den geschlossenen Stromkreis."});

  /* ===== Kronleuchter über dem Gang (leuchtet mit dem Stromkreis) ===== */
  const ch = new T.Group(), H = ctx.height || 7, cy = H - 2.1; ctx.add(ch, 0, cy, 4.2);
  const ring = ctx.mesh(new T.TorusGeometry(1, .04, 10, 48), ctx.mat("brass")); ring.rotation.x = Math.PI / 2; ch.add(ring);
  const chain = ctx.cyl(.02, .02, H - cy, ctx.mat("metal"), 8); chain.position.y = (H - cy) / 2; ch.add(chain);
  const bulbs = [], hal = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, b = ctx.sphere(.07, new T.MeshStandardMaterial({color: 0xfff3d6, emissive: 0xffc46b, emissiveIntensity: .2}), 12);
    b.position.set(Math.cos(a), -.05, Math.sin(a)); ch.add(b); bulbs.push(b); const h = ctx.glow(0xffd27a, .5); h.position.copy(b.position); ch.add(h); hal.push(h); }
  const chLight = ctx.light(0xffd9a0, 0, 12, 0, cy - .3, 4.2);
  function chand(k){ for (const b of bulbs) b.material.emissiveIntensity = .2 + 3.5 * k; for (const h of hal) h.scale.setScalar(.25 + .6 * k); if (chLight) chLight.intensity = 9 * k; }
  ctx.tick((dt, t) => { ch.rotation.y = Math.sin(t * .2) * .05; });

  /* ===== A: Wassermodell (links, zur Gangmitte hin ausgerichtet) ===== */
  {
    const g = new T.Group(); ctx.add(g, S.A.x, 0, S.A.z); g.rotation.y = Math.PI / 2;   // Vorderseite zeigt nach +x
    const ped = ctx.box(2.2, .5, .7, ctx.mat("darkwood")); ped.position.y = .25; g.add(ped);
    const pipeM = ctx.mat(ctx.world === "sterne" ? "steel" : "copper"), y0 = .8, y1 = 2.2;
    const pts = [[-.9, y0, 0], [-.9, y1, 0], [-.25, y1, 0], [.25, y1, 0], [.9, y1, 0], [.9, y0, 0], [.25, y0, 0], [-.25, y0, 0]].map(p => new T.Vector3(...p));
    const curve = new T.CatmullRomCurve3(pts, true, "catmullrom", 0);
    const tube = ctx.mesh(new T.TubeGeometry(curve, 120, .07, 12, true), ctx.mat("glass", {color: "#bfe3ff", opacity: .3})); g.add(tube);
    const narrow = ctx.cyl(.035, .035, .55, pipeM, 12); narrow.rotation.z = Math.PI / 2; narrow.position.set(0, y1, 0); g.add(narrow);
    for (const x of [-.29, .29]) { const f = ctx.cyl(.09, .09, .05, pipeM, 16); f.rotation.z = Math.PI / 2; f.position.set(x, y1, 0); g.add(f); }
    const pump = ctx.box(.45, .45, .4, ctx.mat(ctx.world === "zauber" ? "darkwood" : "metal")); pump.position.set(-.9, y0 + .05, 0); g.add(pump);
    const imp = new T.Group(); imp.position.set(-.9, y0 + .05, .21); g.add(imp);
    for (let i = 0; i < 4; i++) { const b = ctx.box(.34, .05, .02, ctx.mat("brass")); b.rotation.z = i * Math.PI / 4; imp.add(b); }
    // Wasserrad hinter dem Fallrohr: Das abwärts fließende Wasser trifft die rechten Schaufeln (Drehung im Uhrzeigersinn); eigener Ständer mit Achse
    const wheel = new T.Group(); wheel.position.set(.66, (y0 + y1) / 2, -.15); g.add(wheel);
    const wr = ctx.mesh(new T.TorusGeometry(.26, .025, 8, 28), ctx.mat("wood")); wheel.add(wr);
    for (let i = 0; i < 8; i++) { const s = ctx.box(.05, .5, .1, ctx.mat("wood")); s.rotation.z = i * Math.PI / 8; wheel.add(s); }
    const post = ctx.box(.05, (y0 + y1) / 2 - .5, .05, pipeM); post.position.set(.66, .5 + ((y0 + y1) / 2 - .5) / 2, -.26); g.add(post);
    const axle = ctx.cyl(.022, .022, .12, pipeM, 10); axle.rotation.x = Math.PI / 2; axle.position.set(.66, (y0 + y1) / 2, -.2); g.add(axle);
    const water = ctx.flow(curve, {count: 40, size: .045, color: 0x3a9bff, speed: .12, on: false});
    water.mesh.position.copy(g.position); water.mesh.rotation.copy(g.rotation);
    // Legende auf der Vorderseite des Sockels (dunkler Grund, in allen Welten lesbar, nichts schwebt)
    const lab = (s, x) => { const tx = ctx.text(s, {size: .068, color: "#fff4d0"}); tx.position.set(x, .26, .356); g.add(tx); };
    lab("Pumpe\nentspricht\nSpannungsquelle", -.72); lab("Engstelle\nentspricht\nWiderstand", 0); lab("Wasserrad\nentspricht\nLampe", .72);   // „≙“ fehlt in den Weltschriften (winziges Ersatzzeichen)
    let run = false; ctx.tick(dt => { if (run) { imp.rotation.z -= dt * 6; wheel.rotation.z -= dt * 2.4; } });
    ctx.obstacle(S.A.x, S.A.z, 1.25);
    ctx.exhibit(g, {label: "Wassermodell", sub: "anklicken zum Starten", title: "Das Wassermodell des Stromkreises", onClick: () => { run = !run; water.on = run; },
      text: "Die **Pumpe** erzeugt einen Druckunterschied – wie die **Spannung** der Quelle. Wie viel Wasser pro Sekunde durch das Rohr fließt, entspricht der **Stromstärke**.\n\nDie **Engstelle** bremst den Wasserfluss wie ein **Widerstand**. Das Wasser wird nicht verbraucht – es fließt im Kreis, genau wie die Elektronen."});
  }

  /* ===== B: Widerstandsdrähte (rechts hinten) ===== */
  {
    const g = new T.Group(); ctx.add(g, S.B.x + .5, 0, S.B.z); g.rotation.y = -Math.PI / 2;
    const panel = ctx.box(2.2, 1.78, .08, ctx.mat(ctx.world === "sterne" ? "metal" : "darkwood")); panel.position.y = .9 + 1.78 / 2; g.add(panel);   // reicht bis über die Überschrift
    // Zauberwelt: Messing/Stahl spiegeln in der dunklen Ecke nur Schwarz → Drähte und Klemmen matt-metallisch, damit sie sichtbar sind
    const wireM = ctx.world === "zauber" ? ctx.mat("color", {color: "#d8a85a", rough: .4, metal: .25}) : ctx.mat("steel"),
          termM = ctx.world === "zauber" ? ctx.mat("color", {color: "#c8963c", rough: .35, metal: .3}) : ctx.mat("brass");
    for (const x of [-.95, .95]) { const leg = ctx.box(.08, 1.0, .08, ctx.mat("metal")); leg.position.set(x, .5, 0); g.add(leg); }
    const rows = [{y: 2.1, r: .008, zig: true, txt: "lang, dünn", I: "I = 0,2 A", sp: .05}, {y: 1.65, r: .008, zig: false, txt: "kurz, dünn", I: "I = 0,4 A", sp: .1},
                  {y: 1.2, r: .0113, zig: false, txt: "kurz, dick", I: "I = 0,8 A", sp: .2}];
    // r = 0,0113 m: √2-facher Radius = doppelte Querschnittsfläche → halber Widerstand (2,5 Ω). Kein R auf den Schildern: Den Widerstand des langen Drahts bestimmt man im Labor.
    const flows = [];
    for (const R of rows) {
      const pts = []; if (R.zig) { for (let i = 0; i <= 8; i++) pts.push(new T.Vector3(-.75 + i * .1875, R.y + (i % 2 ? .1 : -.1) * (i > 0 && i < 8 ? 1 : 0), .07)); }
      else { pts.push(new T.Vector3(-.75, R.y, .07), new T.Vector3(.75, R.y, .07)); }
      const curve = new T.CatmullRomCurve3(pts, false, "catmullrom", 0);
      g.add(ctx.mesh(new T.TubeGeometry(curve, 64, R.r, 8, false), wireM));
      for (const x of [-.8, .8]) { const tm = ctx.cyl(.035, .035, .06, termM, 12); tm.rotation.x = Math.PI / 2; tm.position.set(x, R.y, .07); g.add(tm); }
      const tx = ctx.text(R.txt, {size: .075, color: "#fff4d0"}); tx.position.set(0, R.y + .19, .06); g.add(tx);
      const it = ctx.text(R.I, {size: .07, color: "#7fe0ff"}); it.position.set(.62, R.y - .12, .06); it.visible = false; g.add(it);
      const fl = ctx.flow(curve, {count: R.zig ? 22 : 10, size: .02, color: 0x7fd8ff, speed: R.sp, on: false});
      fl.mesh.position.copy(g.position); fl.mesh.rotation.copy(g.rotation); flows.push([fl, it]);
    }
    const hd = ctx.text("Gleiche Spannung U = 2 V", {size: .09, color: "#ffe9a8"}); hd.position.set(0, 2.5, .06); g.add(hd);
    ctx.obstacleBox(S.B.x + .5, S.B.z, .7, 2.3);
    let on2 = false;
    ctx.exhibit(g, {label: "Widerstandsdrähte", sub: "anklicken: Spannung anlegen", title: "Wovon der Widerstand abhängt", onClick: () => { on2 = !on2; flows.forEach(([f, it]) => { f.on = on2; it.visible = on2; }); },
      text: "An allen drei Drähten liegt dieselbe Spannung U = 2 V; klickst du, zeigen sie ihre Stromstärken. Der **doppelt so lange** Draht lässt nur halb so viel Strom durch – sein Widerstand ist doppelt so groß. Der **dickere** Draht lässt mehr Strom durch, er hat einen kleineren Widerstand.\n\nDer Widerstand berechnet sich aus **R = U : I**, Einheit **1 Ohm (1 Ω) = 1 V/A**. Beispiel kurzer, dicker Draht: R = 2 V : 0,8 A = 2,5 Ω."});
    // Labor: Spannung am langen, dünnen Draht einstellen, Stromstärke ablesen (R = 10 Ω). Die Messanzeige sitzt unter dem untersten Draht
    // (vom Standplatz aus voll im Bild, oben schnitt der Bildrand sie ab); die Überschrift „U = 2 V“ wird während der Messung ausgeblendet
    const sc = document.createElement("canvas"); sc.width = 768; sc.height = 112; const sx = sc.getContext("2d"), stx = new T.CanvasTexture(sc); stx.colorSpace = T.SRGBColorSpace;
    const scr = new T.Mesh(new T.PlaneGeometry(1.5, .22), new T.MeshBasicMaterial({map: stx, toneMapped: false})); scr.position.set(0, 1.02, .07); scr.visible = false; g.add(scr);
    ctx.lab(g, {
      id: "draht", titel: "Wie groß ist der Widerstand des langen Drahts?",
      text: "Am **langen, dünnen Draht** (oberste Reihe) stellst du die Spannung U ein und liest die Stromstärke I ab. Nimm mindestens fünf Messwerte auf, trage sie selbst ins I-U-Diagramm ein und bestimme daraus den Widerstand.",
      regler: [{id: "U", name: "Spannung U", einheit: "V", min: 0, max: 6, schritt: .5, wert: 0}],
      messe: v => ({I: v.U / 10}),
      anzeige: [{id: "I", name: "Stromstärke I (Amperemeter)", einheit: "A", stellen: 2}],
      achsen: {x: {id: "U", name: "U in V", max: 6, teil: 1}, y: {id: "I", name: "I in A", max: .7, teil: .1}},
      punkte: 5, gerade: "ursprung",
      aufgabe: {frage: "Lies an deiner Geraden ein Wertepaar ab und berechne den Widerstand R = U : I des Drahts.", wert: 10, toleranz: .5, einheit: "Ω",
        tipps: ["Wähle einen gut ablesbaren Punkt auf der Geraden, zum Beispiel bei U = 5 V.", "Lies dazu die Stromstärke ab: Bei U = 5 V ist I = 0,5 A.", "R = U : I = 5 V : 0,5 A – rechne aus. Einheit: 1 V/A = 1 Ω."],
        loesung: "R = U : I = 5 V : 0,5 A = **10 Ω** – für jeden Punkt der Geraden derselbe Wert."},
      merke: "Die Messpunkte liegen auf einer **Ursprungsgeraden**: Bei gleichbleibender Temperatur ist I proportional zu U. Der Quotient U : I bleibt gleich – das ist der Widerstand des Drahts, **R = 10 Ω**.",
      live: (v, m) => {
        if (!v) { scr.visible = false; hd.visible = true; flows.forEach(([f, it]) => { f.on = on2; it.visible = on2; }); flows[0][0].speed = .05; return; }
        hd.visible = false; scr.visible = true; flows.forEach(([f, it], i) => { f.on = i === 0 && v.U > 0; it.visible = false; }); flows[0][0].speed = .025 * v.U;
        sx.fillStyle = "#0d1a12"; sx.fillRect(0, 0, 768, 112); sx.fillStyle = "#8affc1"; sx.font = "700 56px Menlo, monospace"; sx.textBaseline = "middle"; sx.textAlign = "center";
        sx.fillText(`U = ${v.U.toFixed(1).replace(".", ",")} V   I = ${m.I.toFixed(2).replace(".", ",")} A`, 384, 58); stx.needsUpdate = true; }
    });
  }

  /* ===== C: Riesen-Multimeter (rechts vorne) ===== */
  {
    const g = new T.Group(); ctx.add(g, S.C.x + .3, 0, S.C.z); g.rotation.y = -Math.PI / 2;
    const body = ctx.box(1.1, 1.7, .3, ctx.mat("plastic", {color: ctx.world === "detektiv" ? "#3a2b1c" : ctx.world === "sterne" ? "#20283a" : "#3b1a2a"})); body.position.y = 1.15; g.add(body);
    const c = document.createElement("canvas"); c.width = 512; c.height = 200; const dx = c.getContext("2d"), dt = new T.CanvasTexture(c); dt.colorSpace = T.SRGBColorSpace;
    const disp = new T.Mesh(new T.PlaneGeometry(.9, .35), new T.MeshBasicMaterial({map: dt, toneMapped: false})); disp.position.set(0, 1.7, .16); g.add(disp);
    const knob = new T.Group(); knob.position.set(0, 1.05, .17); g.add(knob);
    const kb = ctx.cyl(.2, .2, .08, ctx.mat("color", {color: "#222"}), 32); kb.rotation.x = Math.PI / 2; knob.add(kb);
    const ptr = ctx.box(.05, .2, .03, ctx.mat("color", {color: "#f2f2f2"})); ptr.position.set(0, .1, .05); knob.add(ptr);
    const modes = [["A", "0,25 A", "Stromstärke der Lampe", 0], ["V", "4,5 V", "Spannung an der Lampe", -1.1], ["Ω", "18 Ω", "R = U : I = 4,5 V : 0,25 A", 1.1]];
    modes.forEach(([s, , , a]) => { const l = ctx.text(s, {size: .09, color: "#fff"}); l.position.set(Math.sin(-a) * .3, 1.05 + Math.cos(a) * .3, .17); g.add(l); });
    for (const [x, col] of [[-.25, "#c0392b"], [.25, "#111"]]) { const j = ctx.cyl(.05, .05, .06, ctx.mat("color", {color: col}), 16); j.rotation.x = Math.PI / 2; j.position.set(x, .55, .17); g.add(j); }
    const foot = ctx.box(1.2, .3, .5, ctx.mat("metal")); foot.position.y = .15; g.add(foot);
    let m = 0;
    const draw = () => { const [s, val, sub] = modes[m]; dx.fillStyle = "#0d1a12"; dx.fillRect(0, 0, 512, 200); dx.fillStyle = "#8affc1"; dx.font = "700 92px Menlo, monospace";
      dx.textAlign = "right"; dx.textBaseline = "middle"; dx.fillText(val, 490, 82); dx.font = "500 30px Menlo, monospace"; dx.textAlign = "left"; dx.fillText(sub, 20, 170); dt.needsUpdate = true; };
    draw(); let ka = 0; ctx.tick(d => { ka += (modes[m][3] - ka) * Math.min(1, d * 6); knob.rotation.z = ka; });
    ctx.obstacleBox(S.C.x + .3, S.C.z, .7, 1.4);
    ctx.exhibit(g, {label: "Multimeter", sub: "anklicken: Messbereich wechseln", title: "Ein Gerät – drei Messgrößen", onClick: () => { m = (m + 1) % 3; draw(); },
      get text(){ return ["Messbereich **A**: Als Amperemeter misst das Gerät die Stromstärke. Es wird **in Reihe** geschaltet. An der Lampe vom Experimentiertisch: **I = 0,25 A**.",
        "Messbereich **V**: Als Voltmeter misst das Gerät die Spannung. Es wird **parallel** zum Bauteil geschaltet. An der Lampe: **U = 4,5 V**.",
        "Aus beiden Messwerten **berechnest** du den Widerstand der leuchtenden Lampe: **R = U : I = 4,5 V : 0,25 A = 18 Ω**.\n\nAchtung: Eine Glühlampe ist nicht ohmsch. Kalt hat ihr Glühfaden einen viel kleineren Widerstand – ein Ω-Messgerät am ausgebauten Lämpchen zeigt deshalb weniger an."][m]; }});
  }

  /* ===== D: Vitrine der Spannungsquellen (links vorne) ===== */
  {
    const g = new T.Group(); ctx.add(g, S.D.x - .2, 0, S.D.z); g.rotation.y = Math.PI / 2;
    const frameM = ctx.mat(ctx.world === "sterne" ? "metal" : "wood");   // Raumstation: Metallgestell statt Holz
    const shelf = ctx.box(2.6, .08, .55, frameM); shelf.position.y = 1.0; g.add(shelf);
    const shelf2 = ctx.box(2.6, .08, .55, frameM); shelf2.position.y = .1; g.add(shelf2);
    const lid = ctx.box(2.6, .06, .55, frameM); lid.position.y = 1.93; g.add(lid);
    for (const x of [-1.27, 1.27]) { const s = ctx.box(.06, 1.96, .55, frameM); s.position.set(x, .98, 0); g.add(s); }
    // dunkle Rückwand: Schilder davor sind in jeder Welt lesbar (vorher Schrift direkt vor heller Wand)
    const back = ctx.box(2.5, 1.8, .02, ctx.world === "sterne" ? ctx.mat("color", {color: "#1b2433", rough: .6, metal: .3}) : ctx.mat("darkwood")); back.position.set(0, 1.02, -.255); g.add(back);
    const glassF = ctx.box(2.5, .85, .02, ctx.mat("glass", {opacity: .12})); glassF.position.set(0, 1.5, .27); g.add(glassF);
    const src = [["1,5 V", "Monozelle", .13, .16], ["4,5 V", "Flachbatterie", .22, .12], ["9 V", "Blockbatterie", .12, .16], ["12 V", "Autobatterie", .36, .26], ["230 V", "Steckdose", .22, .22]];
    const lamps = [];
    src.forEach(([u, n, w, h], i) => { const x = -1.0 + i * .5;
      const b = ctx.box(w, h, w * .7, ctx.mat(i === 4 ? "color" : "plastic", {color: ["#c99a2e", "#2f6db5", "#5c6168", "#4a4f57", "#f2f2f2"][i]})); b.position.set(x, 1.04 + h / 2, 0); g.add(b);
      const lu = ctx.text(u, {size: .1, color: i === 4 ? "#ff8a7a" : "#ffe9a8"}); lu.position.set(x, 1.75, -.2); g.add(lu);
      const ln = ctx.text(n, {size: .052, color: "#fff4d0"}); ln.position.set(x, 1.6, -.2); g.add(ln);
      const gl = ctx.glow(i === 4 ? 0xff6b5b : 0xffd27a, .01); gl.position.set(x, 1.1 + h, .05); g.add(gl); lamps.push(gl); });
    // Steckdose: zwei Buchsen auf der Vorderseite
    for (const s of [-1, 1]) { const hole = ctx.cyl(.014, .014, .01, ctx.mat("color", {color: "#222"}), 10); hole.rotation.x = Math.PI / 2; hole.position.set(1.0 + s * .04, 1.04 + .11, .22 * .35 + .004); g.add(hole); }
    const warn = ctx.text("230 V: Lebensgefahr!\nNie hineinfassen!", {size: .07, color: "#ffffff", bg: "#9b1c12"}); warn.position.set(0, .55, -.24); g.add(warn);
    ctx.obstacleBox(S.D.x - .2, S.D.z, .7, 2.7);
    // Klick: Leuchtpunkte gehen nacheinander an, umso größer, je größer die Spannung
    let onD = false, tD = 0;
    ctx.tick(dt => { if (onD) tD += dt; lamps.forEach((l, i) => { const want = onD && tD > i * .35 ? .2 + .09 * i : .01; l.scale.setScalar(l.scale.x + (want - l.scale.x) * Math.min(1, dt * 5)); }); });
    ctx.exhibit(g, {label: "Spannungsquellen", sub: "anklicken", title: "Spannungen im Vergleich", onClick: () => { onD = !onD; tD = 0; },
      text: "Jede Spannungsquelle hat ihre eigene Spannung: Monozelle 1,5 V, Flachbatterie 4,5 V, Blockbatterie 9 V, Autobatterie 12 V, Steckdose im Haushalt **230 V**.\n\nJe größer die Spannung, desto stärker der Antrieb für den Strom. Spannungen aus der Steckdose sind **lebensgefährlich**."});
  }

  /* ===== Wandtafeln ===== */
  ctx.wallBoard("left", 6.75, 3.6, 3.2, 2.0, "Die elektrische Stromstärke", ["Formelzeichen: I", "Einheit: 1 Ampere (1 A)", "Messgerät: Amperemeter – in Reihe", "Im unverzweigten Stromkreis überall gleich"]);
  ctx.wallBoard("right", 2.25, 3.6, 3.2, 2.0, "Spannung – der Antrieb", ["Formelzeichen: U", "Einheit: 1 Volt (1 V)", "Messgerät: Voltmeter – parallel", "Ohne Spannung kein Strom"]);
  ctx.wallBoard("left", -2.25, 3.6, 3.2, 2.0, "Der elektrische Widerstand", ["R = U : I", "Einheit: 1 Ohm (1 Ω) = 1 V/A", "Langer, dünner Draht: großer Widerstand", "Dicker, kurzer Draht: kleiner Widerstand"]);
  ctx.wallBoard("right", -6.75, 3.6, 3.2, 2.0, "Elektronen und Stromrichtung", ["Elektronen fließen vom Minuspol zum Pluspol", "Technische Stromrichtung: von + nach −", "Strom fließt nur im geschlossenen Kreis"]);
};
})();
