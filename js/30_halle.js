/* ---------- 30_halle.js ---------- */
/* =====================================================================
   Eingangshalle: Mittelstück je Welt, Fortschritt (geschaffte Räume leuchten), Begrüßungstafel
   Halle: x ∈ [-9, 9], z ∈ [12, -18]; Türen an den Seitenwänden, Schlussraum vorne Mitte; Start bei z ≈ 9,8 mit Blick nach −z
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
R3D.hall = ctx => {
  const T = ctx.T, W = window.WELTEN_API, n = TOPICS.length, cz = -3.5;
  const done = TOPICS.map(t => W ? W.done(t.id) : stageInfo(t.id).cur >= 4), nDone = done.filter(Boolean).length;
  const L = levelOf(S.xp);
  const center = new T.Group(); ctx.add(center, 0, 0, cz);

  if (ctx.world === "zauber") {
    const ped = ctx.cyl(1.3, 1.5, .5, ctx.mat("stone"), 8); ped.position.y = .25; center.add(ped);
    const ped2 = ctx.cyl(1.0, 1.1, .3, ctx.mat("stone"), 8); ped2.position.y = .65; center.add(ped2);
    const frame = new T.Group(); frame.position.y = .8; center.add(frame);
    for (const y of [0, 2.6]) { const p = ctx.cyl(.75, .75, .12, ctx.mat("darkwood"), 32); p.position.y = y; frame.add(p); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4, c = ctx.cyl(.05, .05, 2.6, ctx.mat("brass"), 10); c.position.set(Math.cos(a) * .66, 1.3, Math.sin(a) * .66); frame.add(c); }
    const pts = []; for (let i = 0; i <= 24; i++) { const y = i / 24 * 2.4, r = .08 + .5 * Math.abs(Math.cos(i / 24 * Math.PI)) ** 1.4; pts.push(new T.Vector2(r, y)); }
    const glass = ctx.mesh(new T.LatheGeometry(pts, 40), ctx.mat("glass", {color: "#e6f0ff", opacity: .22})); glass.position.y = .1; frame.add(glass);
    const sandTop = ctx.mesh(new T.ConeGeometry(.42, .55, 32), ctx.mat("glow", {color: "#E3B341", intensity: .5})); sandTop.rotation.x = Math.PI; sandTop.position.y = 1.85; frame.add(sandTop);
    const kTop = 1 - .8 * nDone / n; sandTop.scale.setScalar(kTop); sandTop.position.y = 1.575 + .275 * kTop;   // oben rinnt der Sand ab, Spitze bleibt fest (0,275 m über dem Hals)
    const fill = .25 + .65 * nDone / n, sandBot = ctx.mesh(new T.ConeGeometry(.48, .7 * fill + .05, 32), ctx.mat("glow", {color: "#E3B341", intensity: .5})); sandBot.position.y = .15 + (.7 * fill + .05) / 2; frame.add(sandBot);
    // Sandstrahl von der Spitze des oberen Kegels (y = 0,8 + 1,575) durch den Hals (2,1) bis knapp über die Spitze des Haufens (1,0 + 0,7 · fill);
    // gerade Linie, damit er auch bei fast vollem Haufen (fill > 0,8) nicht unter 1,6 m taucht und wieder hochläuft
    ctx.flow(ctx.path([[0, 2.36, cz], [0, 1.02 + .7 * fill, cz]]), {count: 16, size: .02, color: 0xffd27a, speed: .6});
    const crystals = [];
    for (let i = 0; i < n; i++) { const c = ctx.mesh(new T.OctahedronGeometry(.16, 0), ctx.mat("crystal", {color: done[i] ? "#ffd56b" : "#5a4a7a", intensity: done[i] ? 1.6 : .15})); c.scale.y = 1.6; center.add(c); crystals.push(c); }
    ctx.tick((dt, t) => { crystals.forEach((c, i) => { const a = i / n * Math.PI * 2 + t * .18; c.position.set(Math.cos(a) * 2.1, 2.6 + Math.sin(t * 1.2 + i) * .15, Math.sin(a) * 2.1); c.rotation.y = t + i; }); });
    const mosaic = ctx.mesh(new T.RingGeometry(2.4, 2.6, 64), ctx.mat("glow", {color: "#C99A2E", intensity: .4})); mosaic.rotation.x = -Math.PI / 2; mosaic.position.y = .02; center.add(mosaic);
  } else if (ctx.world === "sterne") {
    const base = ctx.cyl(1.6, 1.8, .9, ctx.mat("metal"), 48); base.position.y = .45; center.add(base);
    const rim = ctx.mesh(new T.TorusGeometry(1.62, .05, 8, 64), ctx.mat("glow", {color: "#4FC3F7", intensity: 1.4})); rim.rotation.x = Math.PI / 2; rim.position.y = .92; center.add(rim);
    const disc = ctx.mesh(new T.CircleGeometry(1.55, 64), ctx.mat("glow", {color: "#0b2a44", intensity: .6})); disc.rotation.x = -Math.PI / 2; disc.position.y = .91; center.add(disc);
    const N = 1600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), r = ctx.rand;
    for (let i = 0; i < N; i++) { const arm = i % 3, d = Math.pow(r(), .7) * 1.4, a = arm * 2.09 + d * 3.2 + (r() - .5) * .5;
      pos[i * 3] = Math.cos(a) * d; pos[i * 3 + 1] = (r() - .5) * .12 * (1.5 - d); pos[i * 3 + 2] = Math.sin(a) * d;
      const c = new T.Color().setHSL(.55 + d * .1, .8, .55 + r() * .3); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    const gg = new T.BufferGeometry(); gg.setAttribute("position", new T.BufferAttribute(pos, 3)); gg.setAttribute("color", new T.BufferAttribute(col, 3));
    // große Holo-Galaxie über dem Tisch (in der 18 m breiten Halle schon vom Eingang aus sichtbar);
    // GY = 4 m: vom Eingang aus liegt sie über dem Schild der Vordertür (4,1–5,2 m) statt davor
    const dot = document.createElement("canvas"); dot.width = dot.height = 64; { const g = dot.getContext("2d"), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(.35, "rgba(255,255,255,.6)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); }
    const GY = 4.0, gal = new T.Points(gg, new T.PointsMaterial({size: .09, map: new T.CanvasTexture(dot), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending}));   // runde, weiche Sterne statt Quadrate
    gal.scale.setScalar(1.9); gal.position.y = GY; center.add(gal); const core = ctx.glow(0xbfe6ff, 1.3); core.position.y = GY; center.add(core);
    const rings = [2.95, 3.25].map((R, k) => { const m = ctx.mesh(new T.TorusGeometry(R, .018, 6, 128), ctx.mat("glow", {color: k ? "#FFE81F" : "#4FC3F7", intensity: 1.2}));
      m.position.y = GY; m.rotation.x = Math.PI / 2 + (k ? .07 : -.05); center.add(m); return m; });
    const planets = [];
    for (let i = 0; i < n; i++) { const p = ctx.sphere(.17, ctx.mat("glow", {color: done[i] ? "#FFE81F" : "#2a3a55", intensity: done[i] ? 1.8 : .3}), 16); center.add(p); planets.push(p); }
    ctx.tick((dt, t) => { gal.rotation.y = t * .12; rings[0].rotation.z = t * .2; rings[1].rotation.z = -t * .14;
      planets.forEach((p, i) => { const a = i / n * Math.PI * 2 + t * .2, R = 2.0 + i * .12; p.position.set(Math.cos(a) * R, GY + Math.sin(t + i) * .08, Math.sin(a) * R); }); });
    const beam = ctx.mesh(new T.CylinderGeometry(2.7, 1.55, GY - .92, 48, 1, true), new T.MeshBasicMaterial({color: 0x4fc3f7, transparent: true, opacity: .07, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending}));
    beam.position.y = (GY + .92) / 2; center.add(beam);
    // Lichtkegel, Sternpunkte, Kernleuchten und Ringe fangen keine Klicks ab (sonst ist die Vordertür hinter dem Kegel nicht anklickbar);
    // eine unsichtbare Scheibe in Galaxiehöhe hält die Galaxie selbst anklickbar
    for (const o of [gal, core, beam, ...rings]) o.raycast = () => {};
    const hit = new T.Mesh(new T.CylinderGeometry(2.7, 2.7, .5, 24), new T.MeshBasicMaterial()); hit.visible = false; hit.position.y = GY; center.add(hit);
  } else {
    const table = ctx.box(3.4, .12, 2.2, ctx.mat("darkwood")); table.position.y = .95; center.add(table);
    for (const [x, z] of [[-1.5, -.95], [1.5, -.95], [-1.5, .95], [1.5, .95]]) { const l = ctx.cyl(.07, .05, .9, ctx.mat("darkwood"), 10); l.position.set(x, .45, z); center.add(l); }
    const c = document.createElement("canvas"); c.width = 1024; c.height = 680; const g = c.getContext("2d");
    g.fillStyle = "#e8dcbc"; g.fillRect(0, 0, 1024, 680); g.strokeStyle = "rgba(90,70,40,.35)"; g.lineWidth = 2;
    for (let i = 0; i < 70; i++) { g.beginPath(); const x = ctx.rand() * 1024, y = ctx.rand() * 680; g.moveTo(x, y); g.lineTo(x + (ctx.rand() - .5) * 300, y + (ctx.rand() - .5) * 200); g.stroke(); }
    g.strokeStyle = "#7a9cc0"; g.lineWidth = 34; g.beginPath(); g.moveTo(0, 420); g.bezierCurveTo(250, 300, 420, 520, 620, 380); g.bezierCurveTo(780, 270, 880, 420, 1024, 360); g.stroke();
    g.fillStyle = "#3a2b1c"; g.font = "italic 700 46px Baskerville, Georgia, serif"; g.textAlign = "center"; g.fillText("London", 512, 606);   // Titel an der Seite, von der man an den Tisch tritt (ganz hinten war er unlesbar)
    g.font = "26px 'American Typewriter', Georgia, serif"; g.fillText("Schauplätze der Ermittlung", 512, 646);
    const mt = new T.CanvasTexture(c); mt.colorSpace = T.SRGBColorSpace;
    const map = new T.Mesh(new T.PlaneGeometry(3.1, 2.0), new T.MeshStandardMaterial({map: mt, color: 0x8f8778, roughness: .9})); map.rotation.x = -Math.PI / 2; map.position.y = 1.016; center.add(map);   // abgedunkelt: unter der Tischlampe sonst weiß überstrahlt
    const spots = [[-1.1, -.5], [-.45, -.65], [.3, -.55], [1.05, -.4], [-1.1, .35], [-.4, .5], [.35, .4], [1.1, .55]];
    spots.forEach(([x, z], i) => { const pin = ctx.cyl(.006, .006, .16, ctx.mat("steel"), 6); pin.position.set(x, 1.09, z); center.add(pin);
      const head = ctx.sphere(.04, ctx.mat("glow", {color: done[i] ? "#d63b2f" : "#555", intensity: done[i] ? 1.2 : .1}), 12); head.position.set(x, 1.18, z); center.add(head);
      const lb = ctx.text(String(i + 1), {size: .07, color: "#3a2b1c"}); lb.rotation.x = -Math.PI / 2; lb.position.set(x + .1, 1.02, z + .1); center.add(lb); });
    const lens = new T.Group(); lens.position.set(.9, 1.06, .7); lens.rotation.y = .6; center.add(lens);
    const lr = ctx.mesh(new T.TorusGeometry(.13, .018, 8, 24), ctx.mat("brass")); lr.rotation.x = -Math.PI / 2; lens.add(lr);
    const lg = ctx.mesh(new T.CircleGeometry(.12, 24), ctx.mat("glass", {opacity: .25})); lg.rotation.x = -Math.PI / 2; lens.add(lg);
    const hd = ctx.box(.04, .03, .25, ctx.mat("darkwood")); hd.position.set(0, 0, .25); lens.add(hd);
    const lampL = ctx.light(0xffc070, 4.5, 6, 0, 2.6, cz);
    // Lampe hängt im Raum, nicht im Exponat (sonst steht dessen Hinweis-Etikett unter der Decke)
    const shade = ctx.cyl(.25, .55, .4, ctx.mat("color", {color: "#244a2e", rough: .6}), 24); shade.position.set(0, 2.8, cz); ctx.group.add(shade);
    const cord = ctx.cyl(.01, .01, 4, ctx.mat("metal"), 6); cord.position.set(0, 5, cz); ctx.group.add(cord);
    ctx.tick((dt, t) => { if (lampL) lampL.intensity = 4.5 + Math.sin(t * 3) * .15; });
  }
  ctx.obstacle(0, cz, ctx.world === "detektiv" ? 2.1 : 1.9);
  if (ctx.world === "detektiv") ctx.obstacleBox(0, cz, 3.6, 2.4);
  // Blick nach dem Hingehen: Sanduhr ganz, Galaxie über dem Tisch, Stadtplan von oben
  const view = {zauber: {dist: 3.4, pitch: 0}, sterne: {dist: 3.4, pitch: .2}, detektiv: {dist: 2.8, pitch: -.3}}[ctx.world] || {dist: 3.4};
  ctx.exhibit(center, {label: W ? W.hallName : "Halle", sub: "anklicken", eyebrow: "Dein Fortschritt", dist: view.dist, pitch: view.pitch,
    stand: ctx.world === "sterne" ? {x: 0, z: cz + 3.4} : undefined,   // die Ringe drehen sich: ihre Hülle schwankt, daher fester Standpunkt
    title: `${nDone} von ${n} ${W ? (W.keyWord === "Indiz" ? "Indizien" : W.keyWord === "Siegel" ? "Siegeln" : "Kristallen") : "Räumen"} gesammelt`,
    text: `Du bist auf **Level ${L.n} (${L.name})** mit ${S.xp} XP.\n\nJede Tür führt in einen Raum zu einem Kapitel. In jedem Raum warten **vier Stationen** (Verstehen, Üben, Anwenden, Prüfen) und Exponate, die du anklicken kannst. Schaffst du alle vier Stationen, ${W ? `leuchtet ${W.keyWord === "Energiekristall" ? "der" : "das"} ${W.keyWord} über der Tür` : "leuchtet die Tür"}.\n\nVorne wartet ${W ? W.finalName.replace(/^(Der|Die|Das) /, a => a.toLowerCase()) : "der Prüfungssaal"} – die Schulaufgabe über alle Räume.`});

  // Leuchtzeichen über den Türen geschaffter Räume
  for (const o of ctx._inter) { const ia = o.userData.ia; if (!ia || ia.kind !== "door" || !ia.topic) continue;
    const i = TOPICS.findIndex(t => t.id === ia.topic); if (!done[i]) continue;
    const s = ctx.glow(new T.Color(ctx.pal.accent), 1.5), k = ctx.text(W ? W.keyIcon : "★", {size: .5}), p = o.position, nx = Math.sign(-p.x) * .45;
    s.position.set(p.x + nx, 6.3, p.z); k.position.set(p.x + nx, 6.3, p.z); k.rotation.y = p.x < 0 ? Math.PI / 2 : -Math.PI / 2; ctx.group.add(s, k);
    ctx.tick((dt, t) => { s.scale.setScalar(1.4 + .25 * Math.sin(t * 2 + i)); }); }

  // Begrüßung am Eingang
  // kurze Zeilen: brechen auch im großen Holo-/Zeitungssatz nicht mit einem einzelnen Wort um
  const b = ctx.board(W ? W.hallName : "Willkommen", ["Boden anklicken: dorthin gehen", "Mit der Maus ziehen: umsehen", "Tür anklicken: Raum betreten", "Mitte anklicken: dein Fortschritt"], {w: 2.6, h: 1.6});
  b.position.set(-3.4, 2.0, 8.6); b.rotation.y = .5; ctx.group.add(b);
  if (ctx.world === "zauber") { const bk = ctx.box(2.68, 1.68, .04, ctx.mat("darkwood")); bk.position.z = -.026; b.add(bk); }   // Pergament ist einseitig: Holzrahmen als Rückseite
  // Pfahl mit der Tafel gedreht und 6,5 cm hinter ihrer Fläche (vorher stach seine Kante unten durch Pergament/Holo-Schirm)
  const stand = ctx.box(.08, 1.3, .08, ctx.mat("darkwood")); stand.rotation.y = .5; stand.position.set(-3.4 - .065 * Math.sin(.5), .65, 8.6 - .065 * Math.cos(.5)); ctx.group.add(stand); ctx.obstacle(-3.4, 8.6, .5);
};
})();
