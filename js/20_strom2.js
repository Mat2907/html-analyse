/* ---------- 20_strom2.js ---------- */
/* =====================================================================
   Raum 2 · Kennlinien – Schaltungen – Sicherheit im Haushalt (Kap. 1.4–1.6)
   Mittelstück: Schaltungstisch – Reihen- und Parallelschaltung mit je zwei Lampen (L1 herausdrehen, Messgeräte zeigen U und I)
   A: Kennlinien-Schreiber (Konstantandraht und Glühlampe) · B: Sicherungskasten (Kurzschluss → Leitungsschutzschalter)
   C: Gerät mit Metallgehäuse und Schutzleiter (Gehäuseschluss → FI) · D: Mehrfachsteckdose (Überlastung)
   Über dem Gang: Hängeleuchten, die am Stromkreis des Sicherungskastens hängen
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D) return;
const de = (x, d = 1) => x.toFixed(d).replace(".", ",");
const TAU = Math.PI * 2;
// Infofenster: Zahl und Einheit nicht trennen ("0,60 A" → "0,60 A"), damit keine Zeile zwischen beiden umbricht
const nb = s => String(s).replace(/(\d) (?=(?:mA|kΩ|Ω|A|V|W|ms|s|h)(?![A-Za-zÄÖÜäöüß]))/g, "$1 ");

/* ---------- Anzeigefarben je Welt ---------- */
const STY = {
  zauber: {kind: "zauber", ink: "#F6E7C4", dim: "rgba(246,231,196,.68)", acc: "#F2C14E", c1: "#FF9D5C", c2: "#8FD3FF", warn: "#FF6B4F", ok: "#A5E8A0", grid: "rgba(242,193,78,.17)",
           font: "Palatino, 'Book Antiqua', Georgia, serif", head: "Luminari, Palatino, 'Book Antiqua', Georgia, serif", tint: 0xffffff, el: 0x4aa8ff,
           tag: {bg: "#2a1d10", color: "#F2C14E"}, lbl: "#FFE9B0"},
  sterne: {kind: "sterne", ink: "#E6F7FF", dim: "rgba(191,235,255,.7)", acc: "#FFE81F", c1: "#FF9F43", c2: "#4FC3F7", warn: "#FF5C5C", ok: "#3DDC97", grid: "rgba(79,195,247,.16)",
           font: "'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif", head: "Futura, 'Avenir Next', Helvetica, Arial, sans-serif", tint: 0xffffff, el: 0x5ec8ff,
           tag: {bg: "#0b2540", color: "#BFEBFF"}, lbl: "#BFEBFF"},
  detektiv: {kind: "detektiv", ink: "#2A1D12", dim: "rgba(42,29,18,.66)", acc: "#7B2D26", c1: "#B3261E", c2: "#1F4E8C", warn: "#B3261E", ok: "#2F6B3A", grid: "rgba(110,80,40,.22)",
             font: "Baskerville, 'Hoefler Text', Georgia, serif", head: "Baskerville, 'Hoefler Text', Georgia, serif", tint: 0xd9d2c2, el: 0x5aa8ff,
             tag: {bg: "#d9c9a0", color: "#2A1D12"}, lbl: "#F3E6CC"}
};

/* ---------- Zeichnen auf Leinwand ---------- */
function chamf(g, x, y, w, h, c){ g.beginPath(); g.moveTo(x + c, y); g.lineTo(x + w - c, y); g.lineTo(x + w, y + c); g.lineTo(x + w, y + h - c); g.lineTo(x + w - c, y + h);
  g.lineTo(x + c, y + h); g.lineTo(x, y + h - c); g.lineTo(x, y + c); g.closePath(); }
function paintBg(g, w, h, st, small){
  const m = Math.min(w, h), r = m * (small ? .1 : .05), lw = Math.max(2, m * (small ? .035 : .012));
  g.save();
  if (st.kind === "sterne") {
    g.fillStyle = "#06182a"; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0e2c4b"); gr.addColorStop(1, "#04101c"); g.fillStyle = gr; chamf(g, lw, lw, w - 2 * lw, h - 2 * lw, r); g.fill();
    g.save(); g.clip(); for (let y = 0; y < h; y += 4) { g.fillStyle = "rgba(79,195,247,.05)"; g.fillRect(0, y, w, 1.5); } g.restore();
    g.strokeStyle = "rgba(79,195,247,.95)"; g.lineWidth = lw; chamf(g, lw, lw, w - 2 * lw, h - 2 * lw, r); g.stroke();
    if (!small) { g.strokeStyle = "#FFE81F"; g.lineWidth = lw * 1.6; const b = m * .07;
      for (const [x, y, sx, sy] of [[lw, lw, 1, 1], [w - lw, lw, -1, 1], [lw, h - lw, 1, -1], [w - lw, h - lw, -1, -1]]) { g.beginPath(); g.moveTo(x + sx * (r + b), y); g.lineTo(x + sx * r, y); g.lineTo(x, y + sy * r); g.lineTo(x, y + sy * (r + b)); g.stroke(); } }
  } else if (st.kind === "detektiv") {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#f2e6c6"); gr.addColorStop(1, "#dcc796"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 160; i++) { g.fillStyle = Math.random() < .5 ? "rgba(120,90,50,.10)" : "rgba(255,255,255,.16)"; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6); }
    g.strokeStyle = "#4a3420"; g.lineWidth = lw; g.strokeRect(lw * 1.5, lw * 1.5, w - lw * 3, h - lw * 3);
    if (!small) { g.lineWidth = lw * .4; g.strokeRect(lw * 3.4, lw * 3.4, w - lw * 6.8, h - lw * 6.8); }
  } else {
    g.fillStyle = "#3a2810"; g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, h / 2, m * .1, w / 2, h / 2, Math.max(w, h) * .7); gr.addColorStop(0, "#2e2012"); gr.addColorStop(1, "#120c06");
    g.fillStyle = gr; g.beginPath(); g.roundRect(0, 0, w, h, r); g.fill();
    g.strokeStyle = "#E3B341"; g.lineWidth = lw; g.beginPath(); g.roundRect(lw, lw, w - 2 * lw, h - 2 * lw, r); g.stroke();
    if (!small) { g.lineWidth = lw * .35; g.beginPath(); g.roundRect(lw * 2.8, lw * 2.8, w - lw * 5.6, h - lw * 5.6, r * .7); g.stroke();
      g.fillStyle = "#E3B341"; for (const [x, y] of [[lw * 2.8, lw * 2.8], [w - lw * 2.8, lw * 2.8], [lw * 2.8, h - lw * 2.8], [w - lw * 2.8, h - lw * 2.8]]) {
        g.beginPath(); g.moveTo(x, y - lw * 1.6); g.lineTo(x + lw * 1.6, y); g.lineTo(x, y + lw * 1.6); g.lineTo(x - lw * 1.6, y); g.fill(); } }
  }
  g.restore();
}
// Text mit tiefgestellten Indizes: "U_{ges} = U_{1} + U_{2}"
function rich(g, s, x, y, size, o = {}){
  const parts = []; String(s).replace(/_\{([^}]*)\}|([^_]+|_)/g, (m, a, b) => { parts.push(a != null ? [a, 1] : [b, 0]); return m; });
  const wt = o.weight || "700", f = sub => `${wt} ${Math.round(sub ? size * .64 : size)}px ${o.font}`;
  let W = 0; for (const [t, sub] of parts) { g.font = f(sub); W += g.measureText(t).width; }
  if (o.max && W > o.max) return rich(g, s, x, y, size * o.max / W * .98, Object.assign({}, o, {max: 0}));
  let cx = o.align === "center" ? x - W / 2 : o.align === "right" ? x - W : x;
  g.textAlign = "left"; g.textBaseline = "alphabetic"; if (o.color) g.fillStyle = o.color;
  for (const [t, sub] of parts) { g.font = f(sub); g.fillText(t, cx, y + (sub ? size * .22 : 0)); cx += g.measureText(t).width; }
  return W;
}

/* ---------- Geometrie zusammenfassen (wenige Zeichenaufrufe) ---------- */
function mergeGeos(T, list){
  let n = 0; const gs = list.map(g => { const h = g.index ? g.toNonIndexed() : g; if (h !== g) g.dispose(); n += h.attributes.position.count; return h; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of gs) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += c; g.dispose(); }
  const out = new T.BufferGeometry(); out.setAttribute("position", new T.BufferAttribute(pos, 3)); out.setAttribute("normal", new T.BufferAttribute(nor, 3));
  out.setAttribute("uv", new T.BufferAttribute(uv, 2)); out.computeBoundingSphere(); return out;
}
function Bk(T){
  const P = new Map(), e = new T.Euler(), q = new T.Quaternion(), p = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  const K = {
    add(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0){ e.set(rx, ry, rz); q.setFromEuler(e); geo.applyMatrix4(new T.Matrix4().compose(p.set(x, y, z), q, one));
      if (!P.has(mat)) P.set(mat, []); P.get(mat).push(geo); return K; },
    box(mat, w, h, d, x, y, z, rx, ry, rz){ return K.add(mat, new T.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    cyl(mat, rt, rb, h, x, y, z, rx, ry, rz, seg = 18){ return K.add(mat, new T.CylinderGeometry(rt, rb, h, seg), x, y, z, rx, ry, rz); },
    ball(mat, r, x, y, z){ return K.add(mat, new T.SphereGeometry(r, 10, 8), x, y, z); },
    tube(mat, pts, r, seg){ const c = new T.CatmullRomCurve3(pts.map(v => v.isVector3 ? v : new T.Vector3(...v)), false, "catmullrom", 0);
      return K.add(mat, new T.TubeGeometry(c, seg || Math.max(24, pts.length * 14), r, 8, false)); },
    build(parent, cast = true){ const out = []; for (const [m, l] of P) { const me = new T.Mesh(mergeGeos(T, l), m); me.castShadow = cast && !m.transparent; me.receiveShadow = true;
      parent.add(me); out.push(me); } P.clear(); return out; }
  };
  return K;
}

R3D.rooms.strom2 = ctx => {
  const T = ctx.T, S = ctx.slots, W = ctx.world, st = STY[W] || STY.zauber, H = ctx.height || 7;
  const M = (k, o) => ctx.mat(k, o);
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const ease = u => u * u * (3 - 2 * u);
  const tag = (s, size = .05) => ctx.text(s, Object.assign({size}, st.tag));
  // Leinwand-Anzeige: Fläche mit eigener Textur, m.redraw() zeichnet neu
  function disp(w, h, pw, draw, o = {}){
    const ph = Math.round(pw * h / w), c = document.createElement("canvas"); c.width = pw; c.height = ph; const g = c.getContext("2d");
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map: tex, toneMapped: false, color: o.tint ?? st.tint}));
    m.redraw = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw, ph); draw(g, pw, ph); tex.needsUpdate = true; };
    m.redraw(); return m;
  }
  // Glühbirne zum Herausdrehen: Ursprung = Oberkante der Fassung
  function bulb(s = 1){
    const b = new T.Group();
    const thread = new T.Mesh(mergeGeos(T, [new T.CylinderGeometry(.024 * s, .024 * s, .042 * s, 14).translate(0, .021 * s, 0),
      ...[.01, .02, .03].map(y => new T.TorusGeometry(.025 * s, .003 * s, 4, 14).rotateX(Math.PI / 2).translate(0, y * s, 0))]), M("steel")); b.add(thread);
    const glass = new T.Mesh(mergeGeos(T, [new T.SphereGeometry(.058 * s, 20, 14).translate(0, .1 * s, 0), new T.CylinderGeometry(.03 * s, .024 * s, .04 * s, 16, 1, true).translate(0, .057 * s, 0)]),
      M("glass", {color: "#fff6dc", opacity: .3})); b.add(glass);
    const fm = new T.MeshStandardMaterial({color: 0x5a3a1c, emissive: 0xffb347, emissiveIntensity: 0, roughness: .5});
    const fil = new T.Mesh(mergeGeos(T, [new T.TorusGeometry(.017 * s, .0032 * s, 6, 16, Math.PI).translate(0, .097 * s, 0),
      new T.CylinderGeometry(.002 * s, .002 * s, .055 * s, 4).translate(-.017 * s, .07 * s, 0), new T.CylinderGeometry(.002 * s, .002 * s, .055 * s, 4).translate(.017 * s, .07 * s, 0)]), fm);
    b.add(fil);
    const halo = ctx.glow(0xffd27a, .01); halo.position.y = .1 * s; b.add(halo);
    b.set = k => { fm.emissiveIntensity = 6 * k; halo.visible = k > .01; halo.scale.setScalar(.02 + .5 * s * k); halo.material.opacity = Math.min(1, .3 + k); };
    b.set(0); return b;
  }
  // Roter Warnrahmen um einen Schutzschalter: blinkt nach dem Auslösen 2 s lang kräftig, leuchtet danach ruhig weiter
  function alarm(parent, w, h, x, y, z, th = .012){
    const m = new T.MeshBasicMaterial({color: 0xff2a1a, toneMapped: false});
    const me = new T.Mesh(mergeGeos(T, [new T.BoxGeometry(w + th, th, th).translate(0, h / 2, 0), new T.BoxGeometry(w + th, th, th).translate(0, -h / 2, 0),
      new T.BoxGeometry(th, h, th).translate(w / 2, 0, 0), new T.BoxGeometry(th, h, th).translate(-w / 2, 0, 0)]), m);
    me.position.set(x, y, z); me.visible = false; parent.add(me);
    const halo = ctx.glow(0xff3a20, .01); halo.position.set(x, y, z + .01); halo.visible = false; parent.add(halo);
    let age = -1;
    const A = {on: false, fire(){ age = 0; A.on = true; }, off(){ age = -1; A.on = false; },
      tick(dt){ me.visible = halo.visible = age >= 0; if (age < 0) return; age += dt;
        const k = age < 2 ? .45 + .55 * Math.abs(Math.cos(age * 7)) : .7; m.color.setRGB(k, .16 * k, .1 * k);
        halo.scale.setScalar(Math.max(w, h) * (age < 2 ? 2.2 + 1.4 * k : 1.8)); halo.material.opacity = age < 2 ? .35 + .5 * k : .3; }};
    return A;
  }

  /* ===== Funken (Kurzschluss, Gehäuseschluss) ===== */
  const sparks = (() => {
    const N = 56, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
    for (let i = 0; i < N; i++) pos[i * 3 + 1] = -50;
    const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({map: R3D.util.glowTex(), color: 0xffe2a0, size: .07, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}));
    pts.frustumCulled = false; ctx.group.add(pts);
    const flash = ctx.glow(0xfff0c8, .01); flash.visible = false; ctx.group.add(flash);
    const L = ctx.light(0xffe0b0, 0, 6, 0, -5, 0);
    let fl = 0, k = 0;
    ctx.tick(dt => {
      for (let i = 0; i < N; i++) { if (life[i] <= 0) continue; life[i] -= dt; const j = i * 3; vel[j + 1] -= 7 * dt;
        pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt; if (life[i] <= 0) pos[j + 1] = -50; }
      geo.attributes.position.needsUpdate = true;
      fl = Math.max(0, fl - dt * 3); flash.visible = fl > .01; flash.scale.setScalar(.05 + fl * 1.1); flash.material.opacity = Math.min(1, fl * 1.4); if (L) L.intensity = 14 * fl * fl;
    });
    return {burst(p, n = 30){ for (let c = 0; c < n; c++) { const i = k++ % N, j = i * 3; pos[j] = p.x; pos[j + 1] = p.y; pos[j + 2] = p.z;
        const a = Math.random() * TAU, u = Math.random() * 2 - 1, s = 1 + Math.random() * 2, r = Math.sqrt(1 - u * u);
        vel[j] = r * Math.cos(a) * s; vel[j + 1] = Math.abs(u) * s * .8 + .5; vel[j + 2] = r * Math.sin(a) * s; life[i] = .25 + Math.random() * .45; }
      fl = 1; flash.position.copy(p); if (L) L.position.copy(p); }};
  })();
  const wpos = (g, x, y, z) => { g.updateMatrixWorld(true); return g.localToWorld(V3(x, y, z)); };

  /* ===================================================================
     Mittelstück: Schaltungstisch – Reihen- und Parallelschaltung
     =================================================================== */
  const cx = S.center.x, cz = S.center.z, TOP = .86;
  const lampSum = [0, 0];
  {
    const KT = Bk(T), TW = 3.3, TD = 1.5;
    const tabM = W === "sterne" ? M("metal") : W === "detektiv" ? M("darkwood") : M("wood"), legM = W === "sterne" ? M("metal", {color: "#2a3340"}) : M("darkwood");
    KT.box(tabM, TW, .07, TD, cx, TOP - .035, cz);
    KT.box(legM, TW - .24, .12, TD - .24, cx, TOP - .13, cz);
    KT.box(tabM, TW - .4, .035, TD - .4, cx, .22, cz);                                   // Ablage unten
    if (W === "sterne") {
      for (const s of [-1, 1]) { KT.box(legM, .46, TOP - .2, .5, cx + s * 1.1, (TOP - .2) / 2, cz); KT.box(M("metal"), .7, .04, .9, cx + s * 1.1, .02, cz);
        KT.box(M("glow", {color: "#4FC3F7", intensity: 1.2}), .02, TOP - .3, .02, cx + s * 1.1, (TOP - .2) / 2, cz + .26); }
      KT.box(M("glow", {color: "#4FC3F7", intensity: .9}), TW + .02, .018, TD + .02, cx, TOP - .078, cz);
    } else {
      for (const [x, z] of [[-1.5, -.6], [1.5, -.6], [-1.5, .6], [1.5, .6]]) { KT.cyl(legM, .05, .038, TOP - .19, cx + x, (TOP - .19) / 2 + .02, cz + z, 0, 0, 0, 12);
        KT.add(legM, new T.SphereGeometry(.06, 12, 8), cx + x, TOP - .26, cz + z); KT.cyl(M("brass"), .05, .05, .04, cx + x, .02, cz + z, 0, 0, 0, 12); }
      if (W === "detektiv") KT.box(M("color", {color: "#24402f", rough: .92}), TW - .22, .006, TD - .22, cx, TOP + .002, cz);
      else for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) KT.box(M("brass"), .12, .075, .12, cx + x * (TW / 2 - .05), TOP - .035, cz + z * (TD / 2 - .05));
    }
    // Ablage: Kabelrollen, Kiste mit Ersatzlampen, Batterie
    for (let i = 0; i < 4; i++) { KT.add(M("color", {color: "#a8332a", rough: .55}), new T.TorusGeometry(.13 - i * .004, .012, 6, 28), cx - 1.0 + i * .004, .25 + i * .022, cz + .2, Math.PI / 2);
      KT.add(M("color", {color: "#2a5db0", rough: .55}), new T.TorusGeometry(.11 - i * .004, .012, 6, 28), cx - .66 - i * .003, .25 + i * .022, cz + .25, Math.PI / 2); }
    KT.box(W === "sterne" ? M("metal") : M("wood"), .42, .16, .3, cx + .75, .32, cz - .1); KT.box(W === "sterne" ? M("steel") : M("darkwood"), .44, .02, .32, cx + .75, .41, cz - .1);
    for (let i = 0; i < 3; i++) KT.add(M("glass", {color: "#fff6dc", opacity: .35}), new T.SphereGeometry(.05, 12, 10), cx + .62 + i * .13, .47, cz - .1);
    KT.box(M("plastic", {color: "#2f6db5"}), .22, .12, .1, cx + 1.25, .3, cz + .25);
    KT.build(ctx.group);
    ctx.obstacleBox(cx, cz, TW + .12, TD + .12);
  }
  const plM = W === "sterne" ? M("color", {color: "#1b2330", rough: .5, metal: .4}) : W === "detektiv" ? M("color", {color: "#2f4a3a", rough: .95}) : M("darkwood");
  const trimM = W === "sterne" ? M("steel") : M("brass"), frameM = W === "sterne" ? M("metal") : M("darkwood");
  const wireM = M("copper"), meterM = W === "sterne" ? M("steel") : W === "detektiv" ? M("brass") : M("darkwood");
  const halves = [];
  function circuitHalf(isR, hx){
    const half = new T.Group(); half.position.set(hx, 0, cz); ctx.group.add(half);
    const pl = new T.Group(); pl.position.set(0, TOP + .17, .1); pl.rotation.x = .3; half.add(pl);
    const K = Bk(T), KH = Bk(T), Y = .009, P2 = (x, z, y = Y) => new T.Vector3(x, y, z);
    // Brett, Leisten, Stütze, Rücktafel
    K.box(plM, 1.5, .035, .98, 0, -.0175, 0);
    for (const s of [-1, 1]) { K.box(trimM, 1.52, .018, .02, 0, 0, s * .49); K.box(trimM, .02, .018, .98, s * .75, 0, 0); }
    KH.box(frameM, 1.4, .27, .06, 0, TOP + .135, -.36);
    KH.box(frameM, 1.54, .86, .05, 0, TOP + .8, -.645);
    KH.box(trimM, 1.58, .035, .08, 0, TOP + 1.245, -.645);
    for (const s of [-1, 1]) KH.cyl(trimM, .022, .022, .4, s * .66, TOP + .2, -.645);
    if (W === "sterne") KH.box(M("glow", {color: "#4FC3F7", intensity: 1.1}), 1.56, .015, .015, 0, TOP + .365, -.615);
    // Spannungsquelle (links auf dem Brett, + hinten, − vorne)
    const bx = -.55;
    let crystal = null;
    if (W === "zauber") {
      K.box(M("brass"), .12, .03, .34, bx, .015, 0); for (const s of [-1, 1]) K.cyl(M("brass"), .016, .016, .05, bx, .03, s * .14);
      crystal = ctx.mesh(new T.OctahedronGeometry(.075, 0), M("crystal", {color: "#8f5bff", intensity: .9})); crystal.scale.set(1, 1.7, 1); crystal.position.set(bx, .15, 0); pl.add(crystal);
      K.cyl(M("brass"), .05, .07, .03, bx, .045, 0);
    } else if (W === "sterne") {
      K.box(M("metal"), .11, .03, .24, bx, .015, 0);
      K.cyl(M("steel"), .055, .055, .26, bx, .07, 0, Math.PI / 2); K.cyl(M("glow", {color: "#4FC3F7", intensity: 1.6}), .057, .057, .07, bx, .07, 0, Math.PI / 2);
      for (const s of [-1, 1]) K.cyl(M("metal"), .03, .03, .03, bx, .07, s * .14, Math.PI / 2);
    } else {
      K.box(M("darkwood"), .18, .02, .32, bx, .01, 0);
      K.cyl(M("glass", {color: "#d8e8d0", opacity: .35}), .07, .07, .19, bx, .115, 0, 0, 0, 0, 20); K.cyl(M("water", {color: "#7a8f5a"}), .064, .064, .12, bx, .08, 0, 0, 0, 0, 20);
      K.cyl(M("color", {color: "#1a1a1a"}), .014, .014, .25, bx, .145, -.035); K.cyl(M("steel"), .018, .018, .22, bx, .13, .035);
      K.tube(wireM, [[bx, Y, -.13], [bx, .05, -.09], [bx, .27, -.035]], .006); K.tube(wireM, [[bx, Y, .13], [bx, .05, .09], [bx, .24, .035]], .006);
    }
    const vl = ctx.text("12,6 V", {size: .05, color: st.lbl}); vl.position.set(bx, .33, 0); pl.add(vl);
    const pp = ctx.text("+", {size: .06, color: "#ff7a6b"}); pp.position.set(bx - .12, .06, -.13); pl.add(pp);
    const mm = ctx.text("−", {size: .06, color: "#7fb2ff"}); mm.position.set(bx - .12, .06, .13); pl.add(mm);
    // Messgeräte (Körper statisch, Anzeige als eigene Leinwand)
    const meters = {};
    const meter = (id, sym, unit, x, z) => { K.box(meterM, .2, .13, .08, x, .065, z); K.box(M("color", {color: "#141414"}), .186, .112, .006, x, .07, z + .039);
      for (const s of [-1, 1]) K.cyl(M("color", {color: s < 0 ? "#c0392b" : "#1b1b1b"}), .01, .01, .022, x + s * .07, .14, z, 0, 0, 0, 10);
      let val = "";
      const d = disp(.172, .1, 256, (g, w, h) => { paintBg(g, w, h, st, true);
        rich(g, sym, 18, 46, 34, {font: st.font, color: st.acc});
        g.strokeStyle = st.ink; g.lineWidth = 3; g.beginPath(); g.arc(w - 34, 32, 19, 0, TAU); g.stroke();
        g.fillStyle = st.ink; g.font = `700 24px ${st.font}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(unit, w - 34, 33);
        rich(g, val, w / 2, h - 22, 64, {font: st.font, color: st.ink, align: "center", max: w - 30}); });
      d.position.set(x, .07, z + .043); pl.add(d); d.set = v => { if (v !== val) { val = v; d.redraw(); } }; meters[id] = d; };
    // Lampenfassungen
    const lamps = [];
    const lamp = (x, z, name) => { K.box(M(W === "sterne" ? "metal" : "darkwood"), .12, .02, .1, x, .01, z); K.cyl(M("brass"), .036, .042, .045, x, .0425, z);
      const b = bulb(1); b.position.set(x, .065, z); pl.add(b); const l = ctx.text(name, {size: .055, color: st.lbl}); l.position.set(x - .1, .16, z); pl.add(l);
      lamps.push({b, x, z, k: 0}); return b; };
    let paths;
    if (isR) {
      K.tube(wireM, [P2(bx, .13), P2(bx, .30), P2(.58, .30), P2(.58, -.28), P2(bx, -.28), P2(bx, -.13)], .0085, 160);
      lamp(-.2, -.28, "L₁"); lamp(.28, -.28, "L₂");
      meter("I", "I", "A", .05, .30);
      meter("U1", "U_{1}", "V", -.2, -.06); meter("U2", "U_{2}", "V", .28, -.06);
      for (const lx of [-.2, .28]) { K.tube(M("color", {color: "#c0392b"}), [[lx - .13, Y, -.28], [lx - .11, .08, -.19], [lx - .07, .04, -.105]], .004, 30);
        K.tube(M("color", {color: "#1b1b1b"}), [[lx + .13, Y, -.28], [lx + .11, .08, -.19], [lx + .07, .04, -.105]], .004, 30); }
      paths = [[P2(bx, .13, .013), P2(bx, .30, .013), P2(.58, .30, .013), P2(.58, -.28, .013), P2(bx, -.28, .013), P2(bx, -.13, .013)]];
    } else {
      K.tube(wireM, [P2(bx, .13), P2(bx, .30), P2(.55, .30)], .0085, 80); K.tube(wireM, [P2(bx, -.13), P2(bx, -.28), P2(.55, -.28)], .0085, 80);
      for (const x of [.05, .55]) { K.tube(wireM, [P2(x, .30), P2(x, -.28)], .0085, 40); for (const z of [.30, -.28]) K.ball(M("brass"), .017, x, Y, z); }
      lamp(.05, -.13, "L₁"); lamp(.55, -.13, "L₂");
      meter("Ig", "I_{ges}", "A", -.25, .30); meter("I1", "I_{1}", "A", .05, .13); meter("I2", "I_{2}", "A", .55, .13);
      const base = [P2(bx, .13, .013), P2(bx, .30, .013)];
      paths = [.05, .55].map(x => [...base, P2(x, .30, .013), P2(x, -.28, .013), P2(bx, -.28, .013), P2(bx, -.13, .013)]);
    }
    K.build(pl); KH.build(half);
    // Elektronen: Tempo ~ Stromstärke (0,4 m/s je Ampere: in Reihe 0,35 A, parallel je Zweig 0,45 A)
    const flows = paths.map(pts => { const c = ctx.path(pts, true), L = c.getLength(), f = ctx.flow(c, {count: Math.round(L / .06), size: .012, color: st.el, speed: .4 * (isR ? .35 : .45) / L, on: true});
      pl.add(f.mesh); f.L = L; return f; });
    // Rücktafel mit Merksatz und Messwerten (vorne und hinten lesbar)
    let lit = true;
    const board = disp(1.42, .76, 1024, (g, w, h) => { paintBg(g, w, h, st);
      rich(g, isR ? "Reihenschaltung" : "Parallelschaltung", w / 2, 80, 68, {font: st.head, color: st.acc, align: "center"});
      const sm = (s, y, col, sz = 32) => rich(g, s, w / 2, y, sz, {font: st.font, color: col, align: "center", weight: "600", max: w - 90});
      if (isR) {
        sm(lit ? "Ein einziger Stromweg – I ist überall gleich" : "L_{1} herausgedreht – der Stromkreis ist unterbrochen!", 132, lit ? st.dim : st.warn, 36);
        rich(g, lit ? "I = 0,35 A" : "I = 0 A", w / 2, 204, 52, {font: st.font, color: st.ink, align: "center"});
        rich(g, "U_{ges} = U_{1} + U_{2}", w / 2, 282, 62, {font: st.font, color: st.acc, align: "center"});
        rich(g, lit ? "12,6 V = 6,3 V + 6,3 V" : "12,6 V = 12,6 V + 0 V", w / 2, 354, 58, {font: st.font, color: st.ink, align: "center"});
        sm(lit ? "Beide Lampen leuchten nur schwach: je 6,3 V" : "Die ganze Spannung liegt jetzt an der leeren Fassung.", 410, st.dim);
        sm(lit ? "Kühlerer Glühdraht: R_{1} = R_{2} = 6,3 V : 0,35 A = 18 Ω" : "Ohne Strom fällt an L_{2} keine Spannung ab: U_{2} = 0 V", 458, st.ink, 30);
      } else {
        sm(lit ? "Zwei Stromwege – an jedem Zweig liegt dieselbe Spannung" : "L_{1} herausgedreht – L_{2} leuchtet weiter!", 132, lit ? st.dim : st.ok, 36);
        rich(g, "U = U_{1} = U_{2} = 12,6 V", w / 2, 204, 52, {font: st.font, color: st.ink, align: "center"});
        rich(g, "I_{ges} = I_{1} + I_{2}", w / 2, 282, 62, {font: st.font, color: st.acc, align: "center"});
        rich(g, lit ? "0,90 A = 0,45 A + 0,45 A" : "0,45 A = 0 A + 0,45 A", w / 2, 354, 58, {font: st.font, color: st.ink, align: "center"});
        sm(lit ? "Beide Lampen leuchten hell: je 12,6 V" : "Jeder Zweig hat seinen eigenen Stromweg.", 410, st.dim);
        sm(lit ? "Heißer Glühdraht: R_{1} = R_{2} = 12,6 V : 0,45 A = 28 Ω" : "L_{2} bekommt weiter 12,6 V: I_{2} = 0,45 A", 458, st.ink, 30);
      }
      rich(g, lit ? "Klick: Lampe L_{1} herausdrehen" : "Klick: Lampe L_{1} wieder eindrehen", w / 2, 514, 28, {font: st.font, color: st.dim, align: "center", weight: "500"});
    });
    board.position.set(0, TOP + .8, -.619); half.add(board);
    const back = new T.Mesh(board.geometry, board.material); back.position.set(0, TOP + .8, -.671); back.rotation.y = Math.PI; half.add(back);
    // Zustand
    let out = false, u = 0;
    const update = () => {
      if (isR) { meters.I.set(lit ? "0,35 A" : "0,00 A"); meters.U1.set(lit ? "6,3 V" : "12,6 V"); meters.U2.set(lit ? "6,3 V" : "0,0 V"); }
      else { meters.Ig.set(lit ? "0,90 A" : "0,45 A"); meters.I1.set(lit ? "0,45 A" : "0,00 A"); meters.I2.set("0,45 A"); }
      board.redraw(); };
    update();
    // Herausgedrehte Lampe: erst aus der Fassung schrauben, dann hinter der Leitung seitlich aufs Brett legen (beim Eindrehen derselbe Weg zurück)
    const L0 = lamps[0], restX = L0.x - .05, restY = .058, restZ = -.405, upY = .065 + .085;
    ctx.tick((dt, t) => {
      u = Math.max(0, Math.min(1, u + (out ? 1 : -1) * dt / 1.5));
      const b1 = L0.b, ua = ease(Math.min(1, u / .5)), ub = ease(Math.max(0, (u - .5) / .5));
      b1.rotation.y = ua * 4 * Math.PI; b1.rotation.z = -ub * Math.PI / 2;
      b1.position.set(L0.x + (restX - L0.x) * ub, .065 + (upY - .065) * ua + (restY - upY) * ub + .05 * Math.sin(Math.PI * ub), L0.z + (restZ - L0.z) * ub);
      const nl = !out && u < .02; if (nl !== lit) { lit = nl; update(); }
      const kt = isR ? [lit ? .45 : 0, lit ? .45 : 0] : [lit ? 1 : 0, 1];
      let sum = 0; lamps.forEach((L, i) => { L.k += (kt[i] - L.k) * Math.min(1, dt * 12); L.b.set(L.k); sum += L.k; }); lampSum[isR ? 0 : 1] = sum;
      if (isR) flows[0].on = lit; else { flows[0].on = lit; }
      if (crystal) crystal.rotation.y = t * .6;
    });
    // stand: fester Standpunkt vor dem Schaltbrett (Kern-Option, siehe Bericht) – sonst stellt man sich womöglich hinter die Rücktafel
    ctx.exhibit(half, {label: isR ? "Reihenschaltung" : "Parallelschaltung", sub: "anklicken: Lampe L₁ heraus- oder eindrehen", pitch: -.3, dist: 2.0,
      stand: {x: hx, z: cz + 2.0},
      onClick: () => { out = !out; },
      get title(){ return isR ? "Reihenschaltung: ein einziger Stromweg" : "Parallelschaltung: jeder Zweig für sich"; },
      get text(){ return nb(isR
        ? (out ? "Du hast **L_{1}** herausgedreht. In der Reihenschaltung gibt es nur **einen Stromweg** – er ist jetzt unterbrochen: **Beide Lampen gehen aus**, das Amperemeter zeigt 0 A.\n\nMit beiden Lampen gilt: Die Stromstärke ist überall gleich (I = 0,35 A), die Spannung teilt sich auf: **U_{ges} = U_{1} + U_{2}**, also 12,6 V = 6,3 V + 6,3 V. Ohne L_{1} liegen die ganzen 12,6 V an der leeren Fassung."
               : "L_{1} ist wieder eingedreht – beide Lampen leuchten, aber schwächer als in der Parallelschaltung, denn an jeder liegt nur die halbe Spannung: **U_{ges} = U_{1} + U_{2}** = 6,3 V + 6,3 V. Die Stromstärke ist überall gleich: **I = 0,35 A**.\n\n" +
                 "Weil jede Lampe nur 6,3 V bekommt, wird ihr Glühdraht weniger heiß – und ein kühlerer Glühdraht hat einen kleineren Widerstand: je 6,3 V : 0,35 A = 18 Ω statt 28 Ω in der Parallelschaltung. Der Gesamtwiderstand ist die Summe: **R_{ges} = R_{1} + R_{2}** = 18 Ω + 18 Ω = 36 Ω, und tatsächlich gilt 12,6 V : 0,35 A = 36 Ω.")
        : (out ? "Du hast **L_{1}** herausgedreht – **L_{2} leuchtet weiter**. Jeder Zweig hat seinen eigenen Stromweg und liegt direkt an der Quelle: U = 12,6 V.\n\nDie Ströme addieren sich: **I_{ges} = I_{1} + I_{2}**, vorher 0,90 A = 0,45 A + 0,45 A, jetzt 0,45 A = 0 A + 0,45 A. So sind auch die Geräte im Haushalt geschaltet."
               : "Beide Lampen leuchten hell: An jedem Zweig liegt die volle Spannung **U = 12,6 V**. Die Ströme addieren sich: **I_{ges} = I_{1} + I_{2}** = 0,45 A + 0,45 A = 0,90 A.\n\n" +
                 "Mit 12,6 V wird jeder Glühdraht heißer als in der Reihenschaltung, sein Widerstand ist größer: je 12,6 V : 0,45 A = 28 Ω statt 18 Ω. Der Gesamtwiderstand ist trotzdem kleiner als jeder Einzelwiderstand: R_{ges} = 12,6 V : 0,90 A = 14 Ω, denn **1 : R_{ges} = 1 : R_{1} + 1 : R_{2}**.")); }});
    halves.push(half);
  }
  circuitHalf(true, cx - .83); circuitHalf(false, cx + .83);
  const tableLight = ctx.light(0xffcf87, 0, 6, cx, TOP + .8, cz + .4);
  ctx.tick(() => { if (tableLight) tableLight.intensity = 1.6 * (lampSum[0] + lampSum[1]); });

  /* ===================================================================
     Über dem Gang: Hängeleuchten (hängen am Stromkreis des Sicherungskastens)
     =================================================================== */
  const overhead = (() => {
    const K = Bk(T), y0 = Math.min(5.0, H - 1.1), zs = [7.4, 5.6, 3.8, 2.0];
    const cab = M("color", {color: "#1d1a17", rough: .7}), metal = W === "sterne" ? M("steel") : M("brass");
    for (const s of [-1, 1]) K.cyl(cab, .012, .012, 6.8, s * .07, y0, 4.75, Math.PI / 2, 0, 0, 8);
    for (const z of [8.05, 4.7, 1.45]) { K.cyl(metal, .01, .01, H - y0, 0, (H + y0) / 2, z, 0, 0, 0, 8); K.box(metal, .22, .025, .03, 0, y0, z); }
    const shadeMat = new T.MeshStandardMaterial(W === "detektiv" ? {color: 0x1f6b48, emissive: 0x0d3a25, emissiveIntensity: .4, roughness: .25, metalness: .15, side: T.DoubleSide}
      : W === "sterne" ? {color: 0xc6cfd9, roughness: .25, metalness: .9, side: T.DoubleSide} : {color: 0xb8862b, roughness: .32, metalness: 1, side: T.DoubleSide});
    const bulbG = [];
    for (const z of zs) { K.cyl(cab, .006, .006, .56, 0, y0 - .28, z, 0, 0, 0, 6); K.cyl(metal, .035, .035, .06, 0, y0 - .58, z, 0, 0, 0, 12);
      K.add(shadeMat, new T.CylinderGeometry(.05, .2, .17, 24, 1, true), 0, y0 - .69, z);
      if (W === "sterne") K.add(M("glow", {color: "#4FC3F7", intensity: 1.4}), new T.TorusGeometry(.2, .01, 6, 32), 0, y0 - .775, z, Math.PI / 2);
      bulbG.push(new T.SphereGeometry(.055, 14, 10).translate(0, y0 - .75, z)); }
    K.build(ctx.group, false);
    // Leitung vom Sicherungskasten (B) hinauf zur Leuchtenschiene
    const bx = S.B.x + .75, bz = S.B.z;
    K.tube(cab, [[.07, y0 + .015, bz], [bx - .6, y0 + .015, bz], [bx, y0 - .5, bz], [bx, 2.72, bz]], .016, 90); K.build(ctx.group, false);
    const bm = new T.MeshStandardMaterial({color: 0xfff3d6, emissive: 0xffd08a, emissiveIntensity: 3, roughness: .4});
    ctx.group.add(new T.Mesh(mergeGeos(T, bulbG), bm));
    const halos = zs.map(z => { const h = ctx.glow(0xffd9a0, .7); h.position.set(0, y0 - .76, z); ctx.group.add(h); return h; });
    const L = ctx.light(0xffe2b0, 6, 11, 0, y0 - 1.1, 4.7);
    let on = true, k = 1;
    ctx.tick(dt => { k += ((on ? 1 : 0) - k) * Math.min(1, dt * (on ? 4 : 14)); bm.emissiveIntensity = .15 + 2.85 * k; halos.forEach(h => { h.visible = k > .02; h.scale.setScalar(.7 * k + .01); });
      if (L) L.intensity = 6 * k; });
    return {set(v){ on = v; }};
  })();

  /* ===================================================================
     A: Kennlinien-Schreiber (links, Vorderseite zum Gang)
     =================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.A.x - .25, 0, S.A.z); g.rotation.y = Math.PI / 2;
    const K = Bk(T), deskM = W === "sterne" ? M("metal") : W === "detektiv" ? M("darkwood") : M("wood"), topM = W === "sterne" ? M("color", {color: "#1b2330", rough: .5, metal: .4}) : M("darkwood");
    const frontM = W === "sterne" ? M("steel") : W === "detektiv" ? M("wood") : M("darkwood");
    K.box(deskM, 2.3, .8, .62, 0, .47, -.08); K.box(M("darkwood"), 2.2, .07, .56, 0, .035, -.08); K.box(topM, 2.42, .05, .76, 0, .895, -.05);
    for (const x of [-.75, 0, .75]) { K.box(frontM, .68, .3, .02, x, .67, .235); K.box(frontM, .68, .38, .02, x, .27, .235); K.box(M("brass"), .16, .025, .025, x, .67, .255); K.box(M("brass"), .16, .025, .025, x, .38, .255); }
    if (W === "sterne") K.box(M("glow", {color: "#4FC3F7", intensity: 1.2}), 2.32, .02, .02, 0, .86, .27);
    // Schirmrahmen
    K.box(frameM, 2.16, 1.44, .07, 0, 1.97, -.33); for (const s of [-1, 1]) K.box(frameM, .1, .34, .07, s * .86, 1.08, -.33);
    if (W === "zauber") { K.cyl(M("brass"), .16, .16, .03, 0, 2.8, -.33, Math.PI / 2, 0, 0, 32); K.add(M("brass"), new T.TorusGeometry(.2, .02, 8, 40), 0, 2.8, -.33);
      for (const s of [-1, 1]) { K.add(M("brass"), new T.ConeGeometry(.05, .2, 8), s * 1.08, 2.79, -.33); K.box(M("brass"), .7, .025, .025, s * .5, 2.71, -.31); }
      const orb = ctx.mesh(new T.OctahedronGeometry(.08, 0), M("crystal", {color: "#8f5bff", intensity: .9})); orb.scale.set(1, 1.5, 1); orb.position.set(0, 2.8, -.28); g.add(orb);
      ctx.tick((dt, t) => { orb.rotation.y = t * .7; }); }
    else if (W === "sterne") { K.box(M("metal"), 2.24, .1, .12, 0, 2.73, -.33); K.box(M("glow", {color: "#4FC3F7", intensity: 1.4}), 2.0, .025, .02, 0, 2.73, -.265);
      for (const s of [-1, 1]) K.box(M("glow", {color: "#FFE81F", intensity: 1.2}), .03, 1.3, .02, s * 1.07, 1.97, -.29); }
    else { K.box(M("darkwood"), 2.3, .12, .12, 0, 2.74, -.33); K.box(M("darkwood"), 2.1, .08, .1, 0, 2.83, -.33); K.box(M("brass"), .5, .08, .012, 0, 2.74, -.265);
      for (const s of [-1, 1]) K.ball(M("brass"), .045, s * 1.1, 2.86, -.33); }
    // Netzgerät mit Drehknopf
    const NX = .62;
    K.box(W === "sterne" ? M("metal") : M("color", {color: "#3a2a1c", rough: .6}), .5, .16, .36, NX, 1.0, 0); K.box(M("brass"), .5, .012, .36, NX, 1.086, 0);
    for (const [x, c] of [[-.1, "#c0392b"], [.1, "#1b1b1b"]]) K.cyl(M("color", {color: c}), .02, .02, .03, NX + x, .97, .185, Math.PI / 2, 0, 0, 12);
    const scaleTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 512; const q = c.getContext("2d");
      q.fillStyle = st.kind === "detektiv" ? "#efe2bf" : "#15100a"; q.beginPath(); q.arc(256, 256, 252, 0, TAU); q.fill();
      q.strokeStyle = st.kind === "detektiv" ? "#2a1d12" : st.acc; q.fillStyle = q.strokeStyle; q.lineWidth = 6; q.textAlign = "center"; q.textBaseline = "middle";
      for (let i = 0; i <= 16; i++) { const a = (-135 + i / 16 * 270) * Math.PI / 180, r0 = i % 2 ? 200 : 180; q.beginPath(); q.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); q.lineTo(256 + Math.sin(a) * 232, 256 - Math.cos(a) * 232); q.stroke();
        if (i % 4 === 0) { q.font = `700 50px ${st.font}`; q.fillText(String(i / 2), 256 + Math.sin(a) * 140, 256 - Math.cos(a) * 140); } }
      q.font = `700 42px ${st.font}`; q.fillText("U in V", 256, 400);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
    const dial = new T.Mesh(new T.CircleGeometry(.16, 40), new T.MeshBasicMaterial({map: scaleTex, toneMapped: false, color: st.tint})); dial.rotation.x = -Math.PI / 2; dial.position.set(NX, 1.094, 0); g.add(dial);
    const knob = new T.Group(); knob.position.set(NX, 1.094, 0); g.add(knob);
    const kb = ctx.cyl(.07, .078, .06, W === "sterne" ? M("steel") : M("color", {color: "#1d1d1d", rough: .4}), 28); kb.position.y = .03; knob.add(kb);
    const kc = ctx.cyl(.05, .05, .012, M("brass"), 24); kc.position.y = .066; knob.add(kc);
    const kp = ctx.box(.014, .012, .075, M("color", {color: st.kind === "sterne" ? "#FFE81F" : "#f2f2f2"})); kp.position.set(0, .075, -.04); knob.add(kp);
    // Konstantandraht auf Keramikrohr
    const DXc = -.82, cer = M("color", {color: "#e9e4d8", rough: .45});
    for (const s of [-1, 1]) K.box(cer, .05, .1, .1, DXc + s * .2, .97, .02);
    K.cyl(cer, .03, .03, .36, DXc, 1.0, .02, 0, 0, Math.PI / 2, 16);
    { const pts = []; for (let i = 0; i <= 400; i++) { const s = i / 400, a = s * 18 * TAU; pts.push(new T.Vector3(DXc - .16 + .32 * s, 1.0 + Math.cos(a) * .035, .02 + Math.sin(a) * .035)); }
      K.add(M("steel"), new T.TubeGeometry(new T.CatmullRomCurve3(pts), 500, .0035, 5, false)); }
    // Glühlampe
    const LXc = -.28;
    K.box(M(W === "sterne" ? "metal" : "darkwood"), .16, .03, .14, LXc, .935, .02); K.cyl(M("brass"), .045, .055, .06, LXc, .98, .02);
    const lb = bulb(1.6); lb.position.set(LXc, 1.01, .02); g.add(lb);
    // Leitungen
    K.tube(wireM, [[DXc + .2, .97, .02], [DXc + .2, .925, -.2], [NX - .25, .925, -.2], [NX - .25, .95, -.12]], .006);
    K.tube(wireM, [[DXc - .2, .97, .02], [DXc - .2, .925, -.27], [NX - .25, .925, -.27], [NX - .25, .95, -.15]], .006);
    K.tube(wireM, [[LXc, .935, -.05], [LXc, .925, -.235], [NX - .25, .925, -.235], [NX - .25, .95, -.13]], .006);
    K.tube(M("rubber"), [[NX + .15, 1.0, -.18], [NX + .15, .95, -.3], [.86, 1.1, -.37], [.86, 1.26, -.37]], .016);
    K.build(g);
    for (const [s, x, y] of [["Konstantandraht", DXc, 1.17], ["Glühlampe", LXc, 1.27], ["Spannung", NX, 1.25]]) { const t = tag(s, .05); t.position.set(x, y, .03); g.add(t); }
    // Messprotokoll (Weltvariante: Pergament mit Feder · Datenblock mit Stift · Notizbuch mit Füller)
    { const dark = W === "sterne", ink = dark ? "#BFEBFF" : "#3a2412", head = dark ? "#FFE81F" : st.acc;
      const prot = disp(.26, .34, 512, (q, w, h) => {
        if (dark) { q.fillStyle = "#06182a"; q.fillRect(0, 0, w, h); q.strokeStyle = "#4FC3F7"; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); }
        else { const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, W === "zauber" ? "#f0dcac" : "#f4ecd6"); gr.addColorStop(1, W === "zauber" ? "#d2b277" : "#e2d5b4"); q.fillStyle = gr; q.fillRect(0, 0, w, h);
          if (W === "detektiv") { q.strokeStyle = "rgba(60,90,140,.25)"; q.lineWidth = 2; for (let y = 120; y < h; y += 44) { q.beginPath(); q.moveTo(20, y); q.lineTo(w - 20, y); q.stroke(); } } }
        rich(q, "Messprotokoll", w / 2, 62, 44, {font: st.head, color: head, align: "center"});
        rich(q, "Konstantandraht", w / 2, 104, 30, {font: st.font, color: ink, align: "center", weight: "600"});
        const cols = [90, 250, 410]; ["U in V", "I in A", "U : I in Ω"].forEach((t, i) => rich(q, t, cols[i], 170, 28, {font: st.font, color: head, align: "center"}));
        q.fillStyle = ink; q.fillRect(30, 184, w - 60, 3);
        [["2,0", "0,05"], ["4,0", "0,10"], ["6,0", "0,15"], ["8,0", "0,20"]].forEach(([u, i], k) => [u, i, "40"].forEach((t, j) => rich(q, t, cols[j], 240 + k * 66, 38, {font: st.font, color: ink, align: "center", weight: "600"})));
        rich(q, "U : I bleibt gleich → ohmsch", w / 2, 540, 30, {font: st.font, color: head, align: "center", max: w - 40});
        rich(q, "R = 40 Ω", w / 2, 600, 40, {font: st.font, color: ink, align: "center"}); }, {tint: dark ? 0xffffff : st.tint});
      prot.rotation.set(-Math.PI / 2, 0, .14); prot.position.set(1.04, .925, .07); g.add(prot);
      if (dark) { const pad = ctx.box(.29, .014, .37, M("metal")); pad.rotation.y = .14; pad.position.set(1.04, .916, .07); g.add(pad); }
      const pen = new T.Group(); pen.position.set(1.15, .93, .17); pen.rotation.y = -.5; g.add(pen);
      if (W === "zauber") { const sh = ctx.cyl(.004, .002, .2, M("color", {color: "#efe6d2"}), 6); sh.rotation.z = Math.PI / 2; pen.add(sh);
        const vane = ctx.sphere(.05, M("cloth", {color: "#f4efe4"}), 10); vane.scale.set(1.3, .06, .25); vane.position.set(.03, .003, 0); pen.add(vane); }
      else { const body = ctx.cyl(.007, .007, .14, M(W === "sterne" ? "steel" : "color", {color: "#141414"}), 10); body.rotation.z = Math.PI / 2; pen.add(body);
        const tip = ctx.cyl(.0075, .0075, .04, W === "sterne" ? M("glow", {color: "#4FC3F7", intensity: 1.5}) : M("brass"), 10); tip.rotation.z = Math.PI / 2; tip.position.x = .07; pen.add(tip); } }
    // Schirm: I-U-Diagramm
    const UMAX = 8, IMAX = .35, X0 = 112, X1 = 650, Y0 = 108, Y1 = 586;   // Glühlampe höchstens 8 V : 25 Ω = 0,32 A, Draht 0,20 A
    const Iw = U => U / 40, Il = U => U / (5 + 2.5 * U);
    const px = U => X0 + U / UMAX * (X1 - X0), py = I => Y1 - I / IMAX * (Y1 - Y0);
    // lab = true: Labor geöffnet – der Schreiber zeigt nur die Glühlampe, U kommt vom Regler, kein R (das bestimmen die Lernenden selbst)
    let U = UMAX, run = false, lab = false;
    const Ilab = U => Math.round(Il(U) * 1000) / 1000;   // Amperemeter-Anzeige auf 1 mA genau
    const scr = disp(2.0, 1.3, 1024, (q, w, h) => { paintBg(q, w, h, st);
      rich(q, "Kennlinien-Schreiber", 48, 68, 46, {font: st.head, color: st.acc});
      rich(q, lab ? "Labor: Glühlampe" : "I-U-Diagramm", w - 48, 66, 32, {font: st.font, color: lab ? st.c2 : st.dim, align: "right", weight: lab ? "700" : "600"});
      // Gitter und Achsen
      q.strokeStyle = st.grid; q.lineWidth = 2;
      for (let u = 1; u <= UMAX; u++) { q.beginPath(); q.moveTo(px(u), Y1); q.lineTo(px(u), Y0); q.stroke(); }
      for (let i = .05; i <= IMAX + 1e-6; i += .05) { q.beginPath(); q.moveTo(X0, py(i)); q.lineTo(X1, py(i)); q.stroke(); }
      q.strokeStyle = st.ink; q.fillStyle = st.ink; q.lineWidth = 4;
      q.beginPath(); q.moveTo(X0, Y1); q.lineTo(X1 + 26, Y1); q.moveTo(X0, Y1); q.lineTo(X0, Y0 - 26); q.stroke();
      q.beginPath(); q.moveTo(X1 + 38, Y1); q.lineTo(X1 + 20, Y1 - 10); q.lineTo(X1 + 20, Y1 + 10); q.fill();
      q.beginPath(); q.moveTo(X0, Y0 - 38); q.lineTo(X0 - 10, Y0 - 20); q.lineTo(X0 + 10, Y0 - 20); q.fill();
      q.font = `600 26px ${st.font}`; q.textAlign = "center"; q.textBaseline = "top";
      for (let u = 0; u <= UMAX; u += 1) { q.beginPath(); q.moveTo(px(u), Y1); q.lineTo(px(u), Y1 + 9); q.stroke(); q.fillText(String(u), px(u), Y1 + 14); }
      q.textAlign = "right"; q.textBaseline = "middle";
      for (let i = 1; i / 10 <= IMAX + 1e-6; i++) { const I = i / 10; q.beginPath(); q.moveTo(X0 - 9, py(I)); q.lineTo(X0, py(I)); q.stroke(); q.fillText(de(I), X0 - 14, py(I)); }   // 0,1 … 0,3: nur bis zum oberen Gitterrand
      rich(q, "U in V", X1 - 6, Y1 - 14, 28, {font: st.font, color: st.ink, align: "right", weight: "700"});   // über der Achse, rechts unten verlaufen keine Kurven
      rich(q, "I in A", X0 + 18, Y0 - 10, 28, {font: st.font, color: st.ink, weight: "700"});
      // Messkurven bis zur aktuellen Spannung
      for (const [f, col] of lab ? [[Il, st.c2]] : [[Iw, st.c1], [Il, st.c2]]) { q.strokeStyle = col; q.lineWidth = 6; q.lineJoin = "round"; q.beginPath();
        for (let u = 0; u <= U + 1e-6; u += .05) { const x = px(u), y = py(f(u)); u ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke();
        q.fillStyle = col; q.beginPath(); q.arc(px(U), py(f(U)), 11, 0, TAU); q.fill(); }
      // Messwerte
      const RX = 700;
      rich(q, `U = ${de(U)} V`, RX, 156, 52, {font: st.font, color: st.ink});
      if (lab) { q.fillStyle = st.c2; q.fillRect(RX, 224, 40, 9); rich(q, "Glühlampe", RX + 54, 240, 32, {font: st.font, color: st.c2, weight: "700"});
        rich(q, `I = ${de(Ilab(U), 3)} A`, RX, 318, 50, {font: st.font, color: st.ink});
        rich(q, "Amperemeter ablesen,", RX, 520, 28, {font: st.font, color: st.dim, weight: "600", max: w - RX - 30});
        rich(q, "Punkt selbst eintragen", RX, 562, 28, {font: st.font, color: st.dim, weight: "600", max: w - RX - 30}); return; }
      const row = (y, col, name, f, R) => { q.fillStyle = col; q.fillRect(RX, y - 16, 40, 9);
        rich(q, name, RX + 54, y, 32, {font: st.font, color: col, weight: "700", max: w - RX - 90});
        rich(q, `I = ${de(f(U), 2)} A`, RX, y + 50, 36, {font: st.font, color: st.ink, weight: "600"});
        rich(q, U > .05 ? `R = U : I ${R}` : "R = U : I", RX, y + 96, 32, {font: st.font, color: st.ink, weight: "600"}); };
      row(240, st.c1, "Konstantandraht", Iw, "= 40 Ω");
      row(400, st.c2, "Glühlampe", Il, `≈ ${de(5 + 2.5 * U, 1)} Ω`);
      if (run) rich(q, "Messung läuft …", RX, 590, 30, {font: st.font, color: st.dim, weight: "600"});
      else { rich(q, "Draht: R bleibt gleich → ohmsch", RX, 560, 25, {font: st.font, color: st.c1, weight: "700", max: w - RX - 30});
        rich(q, "Lampe: R steigt → nicht ohmsch", RX, 600, 25, {font: st.font, color: st.c2, weight: "700", max: w - RX - 30}); }
    });
    scr.position.set(0, 1.97, -.294); g.add(scr);
    // Leuchtpunkte, die auf dem Schirm mitlaufen
    const dots = [st.c1, st.c2].map(c => { const d = new T.Mesh(new T.SphereGeometry(.018, 12, 8), new T.MeshBasicMaterial({color: c, toneMapped: false})); g.add(d);
      const gl = W === "detektiv" ? null : ctx.glow(new T.Color(c), .16); if (gl) g.add(gl); return [d, gl]; });
    const toLocal = (cxp, cyp) => [(cxp / 1024 - .5) * 2.0, 1.97 + (.5 - cyp / 666) * 1.3];
    let acc = 0;
    ctx.tick((dt, t) => {
      if (run) { U = Math.min(UMAX, U + dt * 1.5); acc += dt; if (U >= UMAX) { run = false; scr.redraw(); } else if (acc > .05) { acc = 0; scr.redraw(); } }
      knob.rotation.y = 2.356 - U / UMAX * 4.712;
      [Iw, Il].forEach((f, i) => { const [x, y] = toLocal(px(U), py(f(U))); dots[i][0].position.set(x, y, -.27); if (dots[i][1]) { dots[i][1].position.set(x, y, -.25); dots[i][1].material.opacity = .7 + .3 * Math.sin(t * 6); } });
      dots[0][0].visible = !lab; if (dots[0][1]) dots[0][1].visible = !lab;   // im Labor nur der Punkt der Glühlampe
      lb.set(Math.min(1, U * Il(U) / (UMAX * Il(UMAX))));
    });
    ctx.obstacleBox(S.A.x - .25 - .05, S.A.z, .85, 2.5);
    ctx.exhibit(g, {label: "Kennlinien-Schreiber", sub: "anklicken: Spannung hochdrehen", dist: 2.2, pitch: -.05,
      onClick: () => { if (lab) return; U = 0; run = true; acc = 0; scr.redraw(); },   // bei offenem Labor bestimmt der Regler U
      title: "Kennlinien: ohmsch oder nicht?",
      text: nb("Der Schreiber erhöht die Spannung U von 0 V auf 8 V und zeichnet für beide Bauteile die Stromstärke I auf – das ist die **Kennlinie**.\n\n" +
        "Beim **Konstantandraht** liegen alle Punkte auf einer **Ursprungsgeraden**: I ~ U, der Widerstand R = U : I = 40 Ω bleibt gleich – ein **ohmscher Widerstand**. " +
        "Die Kennlinie der **Glühlampe** wird immer flacher: Der Glühdraht wird heiß, sein Widerstand steigt von 10 Ω (bei 2 V) auf 25 Ω (bei 8 V). Die Glühlampe ist **kein ohmscher Widerstand**.")});
    // Labor: Kennlinie der Glühlampe selbst aufnehmen – Drehknopf, Schirm und Leuchten der Lampe folgen dem Regler
    ctx.lab(g, {
      id: "gluehlampe", titel: "Die Kennlinie der Glühlampe",
      text: nb("Am Kennlinien-Schreiber stellst du die Spannung U an der **Glühlampe** ein und liest am Amperemeter die Stromstärke I ab. Nimm mindestens **sechs Messwerte** zwischen 0 V und 8 V auf, trage sie selbst ins I-U-Diagramm ein und finde heraus, ob die Glühlampe ein ohmscher Widerstand ist."),
      regler: [{id: "U", name: "Spannung U (Voltmeter)", einheit: "V", min: 0, max: 8, schritt: .5, wert: 0}],
      messe: v => ({I: Ilab(v.U)}),
      anzeige: [{id: "I", name: "Stromstärke I (Amperemeter)", einheit: "A", stellen: 3}],
      achsen: {x: {id: "U", name: "U in V", max: 8, teil: 1}, y: {id: "I", name: "I in A", max: .35, teil: .05}},
      punkte: 6, gerade: false, nullpunkt: true,
      aufgabe: {frage: nb("Lies an deiner Kennlinie ab, welche Stromstärke bei U = 3,0 V fließt, und berechne den Widerstand R\u00a0=\u00a0U\u00a0:\u00a0I der Glühlampe bei dieser Spannung."), wert: 12.5, toleranz: 1, einheit: "Ω",
        tipps: ["Suche auf der U-Achse 3 V, gehe senkrecht nach oben bis zur Kurve und von dort waagrecht nach links zur I-Achse.", "Bei U = 3,0 V liest du ungefähr I = 0,24 A ab.", "R\u00a0=\u00a0U\u00a0:\u00a0I = 3,0\u00a0V\u00a0:\u00a00,24\u00a0A = …\u00a0Ω (1\u00a0V/A = 1\u00a0Ω)"].map(nb),
        loesung: nb("R = U : I = 3,0 V : 0,24 A = **12,5 Ω**. Bei 8,0 V sind es schon 25 Ω – je höher die Spannung, desto heißer der Glühdraht und desto größer sein Widerstand.")},
      merke: nb("Die Kennlinie der Glühlampe ist **keine Ursprungsgerade**: Sie wird mit steigender Spannung immer **flacher**. Der Quotient U : I wächst von 10 Ω (bei 2 V) auf 25 Ω (bei 8 V), weil der Glühdraht heißer wird – sein **Widerstand steigt mit der Temperatur**. Die Glühlampe ist **kein ohmscher Widerstand**."),
      live: (v, m) => {
        if (!v) { lab = false; run = false; U = UMAX; scr.redraw(); return; }
        lab = true; run = false; U = v.U; scr.redraw(); }
    });
  }

  /* ===================================================================
     B: Sicherungskasten mit Kurzschluss-Versuch (rechts hinten)
     =================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.B.x + .45, 0, S.B.z); g.rotation.y = -Math.PI / 2;
    const K = Bk(T), panM = W === "sterne" ? M("metal") : W === "detektiv" ? M("darkwood") : M("wood");
    const outM = M("plastic", {color: W === "detektiv" ? "#d9d0bb" : "#e4e2dc"}), inM = M("plastic", {color: "#bdbab2"}), modM = M("plastic", {color: "#f1f0ea"}), levM = M("color", {color: "#2b2b2b", rough: .5});
    K.box(panM, 2.1, 2.6, .08, 0, 1.4, -.3);
    for (const s of [-1, 1]) { K.box(M("darkwood"), .14, .1, .7, s * .85, .05, -.2); K.box(trimM, .04, 2.6, .04, s * 1.05, 1.4, -.27); }
    K.box(trimM, 2.14, .04, .05, 0, 2.7, -.27); K.box(trimM, 2.14, .04, .05, 0, .1, -.27);
    if (W === "sterne") K.box(M("glow", {color: "#FFE81F", intensity: 1.2}), 2.0, .02, .02, 0, 2.2, -.255);
    // Gehäuse (offen) mit Hutschienen
    const CY = 1.82;
    K.box(inM, 1.3, .95, .02, 0, CY, -.25);
    K.box(outM, 1.36, .03, .19, 0, CY + .49, -.165); K.box(outM, 1.36, .03, .19, 0, CY - .49, -.165);
    for (const s of [-1, 1]) K.box(outM, .03, 1.01, .19, s * .665, CY, -.165);
    const rows = [CY + .2, CY - .22]; for (const y of rows) K.box(M("steel"), 1.22, .035, .012, 0, y, -.234);
    const UW = .1, CZ = -.13;
    const mods = [[{u: 3, n: "Hauptschalter", main: 1}, {u: 4, n: "FI 30 mA", s: "Schutzschalter", fi: 1}, {u: 1, n: "B16", s: "Licht"}, {u: 1, n: "B16", s: "Küche"}, {u: 1, n: "B16", s: "Bad"}],
                  [{u: 1, n: "B16", s: "Wohnen"}, {u: 1, n: "B16", s: "Kinder"}, {u: 1, n: "B16", s: "Flur"}, {u: 1, n: "B16", s: "Büro"}, {u: 1, n: "B16", s: "Keller"},
                   {u: 1, n: "B16", s: "Garten"}, {u: 1, n: "B16", s: "Waschen"}, {u: 1, n: "B16", s: "Versuch", demo: 1}]];
    let demoX = 0, demoY = 0;
    const strips = [];
    mods.forEach((row, ri) => { const rw = row.reduce((a, m) => a + m.u, 0) * UW; let x = -rw / 2; const y = rows[ri], labels = [];
      for (const m of row) { const w = m.u * UW, mx = x + w / 2;
        K.box(modM, w - .004, .22, .07, mx, y, -.205); K.box(modM, w - .012, .09, .05, mx, y, -.15);
        if (m.demo) { demoX = mx; demoY = y; }
        else if (m.main) K.box(M("color", {color: "#c0392b"}), w - .05, .03, .03, mx, y + .02, -.115, .45);
        else K.box(levM, m.fi ? .05 : .024, .045, .026, mx - (m.fi ? .06 : 0), y + .02, -.115, .45);
        if (m.fi) { K.cyl(M("color", {color: "#f2c94c"}), .016, .016, .02, mx + .1, y, -.12, Math.PI / 2, 0, 0, 12); K.box(M("color", {color: "#2ecc71"}), .03, .014, .004, mx + .03, y - .025, -.124); }
        labels.push([mx, m]); x += w; }
      // Abdeckung mit Schlitz für diese Reihe (Seitenteile)
      for (const s of [-1, 1]) K.box(outM, .64 - rw / 2 - .01, .1, .015, s * (rw / 2 + .01 + (.64 - rw / 2 - .01) / 2), y, CZ);
      strips.push([y, labels, rw]); });
    // Abdeckung: Bänder über, zwischen und unter den Reihen
    const yT = CY + .475, y1 = rows[0] + .05, y2 = rows[0] - .05, y3 = rows[1] + .05, y4 = rows[1] - .05, yB = CY - .475;
    for (const [a, b] of [[y1, yT], [y3, y2], [yB, y4]]) K.box(outM, 1.28, b - a, .015, 0, (a + b) / 2, CZ);
    for (const s of [-1, 1]) for (const y of [CY + .4, CY - .4]) K.cyl(M("steel"), .012, .012, .01, s * .58, y, CZ + .01, Math.PI / 2, 0, 0, 10);
    // Beschriftungsstreifen über den Reihen
    strips.forEach(([y, labels, rw]) => { const d = disp(rw, .065, 1024, (q, w, h) => { q.fillStyle = "#f4f1e6"; q.fillRect(0, 0, w, h);
        labels.forEach(([mx, m]) => { const X = (mx + rw / 2) / rw * w; q.fillStyle = m.demo ? "#b3261e" : "#222"; q.textAlign = "center"; q.textBaseline = "middle";
          q.font = `700 ${m.u > 1 ? 30 : 28}px Helvetica, Arial, sans-serif`; q.fillText(m.n, X, m.s ? h * .3 : h * .52);
          if (m.s) { q.font = "600 22px Helvetica, Arial, sans-serif"; q.fillText(m.s, X, h * .74); }
          q.fillStyle = "#9a978d"; q.fillRect((mx + m.u * UW / 2 + rw / 2) / rw * w - 1.5, 6, 3, h - 12); }); }, {tint: 0xffffff});
      d.position.set(0, y + .087, CZ + .009); g.add(d); });
    // Versuchs-Schalter (beweglich) mit Rahmen und Anzeige
    const piv = new T.Group(); piv.position.set(demoX, demoY, -.125); g.add(piv);
    const lever = ctx.box(.026, .05, .026, M("color", {color: "#1b1b1b", rough: .4})); lever.position.y = .025; piv.add(lever);
    // Schaltstellungsanzeige oben im Schalter (beim Auslösen nicht vom Hebel verdeckt): grün = ein, rot = aus
    const flagM = new T.MeshBasicMaterial({color: 0x2ecc71, toneMapped: false}); const flag = new T.Mesh(new T.PlaneGeometry(.074, .026), flagM); flag.position.set(demoX, demoY + .031, -.1235); g.add(flag);
    const hl = M("glow", {color: st.kind === "detektiv" ? "#E0A86A" : st.acc, intensity: 1.6});
    for (const s of [-1, 1]) { K.box(hl, .11, .01, .01, demoX, demoY + s * .066, CZ + .012); K.box(hl, .01, .142, .01, demoX + s * .055, demoY, CZ + .012); }
    const lsAlarm = alarm(g, .11, .132, demoX, demoY, CZ + .016, .016);   // überdeckt beim Auslösen den Goldrahmen
    // Versuchsbrett: Lampe und Kurzschlussbrücke
    K.box(panM, 1.5, .04, .34, 0, 1.0, -.09); K.box(trimM, 1.5, .02, .02, 0, 1.0, .08);
    K.box(M("color", {color: "#e9e4d8", rough: .45}), .34, .06, .12, -.25, 1.05, -.1);
    for (const x of [-.35, -.15]) K.cyl(M("brass"), .018, .02, .06, x, 1.1, -.1, 0, 0, 0, 12);
    K.box(M(W === "sterne" ? "metal" : "darkwood"), .16, .03, .14, .45, 1.035, -.1); K.cyl(M("brass"), .045, .055, .05, .45, 1.075, -.1);
    const brown = M("color", {color: "#6b3e1f", rough: .55}), blue = M("color", {color: "#2756a8", rough: .55});
    K.tube(brown, [[demoX, CY - .51, -.2], [demoX, 1.25, -.2], [-.35, 1.25, -.2], [-.35, 1.16, -.12]], .007);
    K.tube(brown, [[-.1, 1.25, -.2], [.42, 1.25, -.2], [.42, 1.09, -.14]], .007);
    K.tube(blue, [[demoX - .03, CY - .51, -.225], [demoX - .03, 1.21, -.225], [-.15, 1.21, -.225], [-.15, 1.16, -.12]], .007);
    K.tube(blue, [[.1, 1.21, -.225], [.48, 1.21, -.225], [.48, 1.09, -.14]], .007);
    // Warnschild
    const warn = disp(.3, .27, 256, (q, w, h) => { q.fillStyle = "#f2c94c"; q.beginPath(); q.moveTo(w / 2, 8); q.lineTo(w - 8, h - 8); q.lineTo(8, h - 8); q.closePath(); q.fill();
      q.strokeStyle = "#111"; q.lineWidth = 12; q.lineJoin = "round"; q.stroke();
      q.fillStyle = "#111"; q.beginPath(); q.moveTo(w * .56, h * .3); q.lineTo(w * .4, h * .6); q.lineTo(w * .52, h * .6); q.lineTo(w * .44, h * .86); q.lineTo(w * .62, h * .52); q.lineTo(w * .5, h * .52); q.closePath(); q.fill(); },
      {tint: 0xffffff});
    warn.material.transparent = true; warn.position.set(.84, 1.3, -.255); g.add(warn);
    // Anschauungsstück: zwei gleiche Schmelzsicherungen (Glasröhrchen im Halter) – links heil, rechts durchgeschmolzen
    K.box(trimM, .95, .025, .2, 0, .42, -.16);
    const fuseGlass = M("glass", {color: "#e8f0f4", opacity: .26}), fWire = M("color", W === "detektiv" ? {color: "#3a3430", rough: .35, metal: .6} : {color: "#e2ddd2", rough: .28, metal: .85}), FY = .505, FZ2 = -.15;
    for (const [fx, blown] of [[-.25, false], [.22, true]]) {
      K.box(M("color", {color: "#1c1a18", rough: .6}), .27, .02, .1, fx, .4425, FZ2);
      for (const s of [-1, 1]) { K.box(M("brass"), .026, .058, .07, fx + s * .088, .4815, FZ2); K.cyl(M("brass"), .039, .039, .034, fx + s * .088, FY, FZ2, 0, 0, Math.PI / 2, 18); }
      K.cyl(fuseGlass, .034, .034, .142, fx, FY, FZ2, 0, 0, Math.PI / 2, 18);
      if (!blown) K.cyl(fWire, .003, .003, .17, fx, FY, FZ2, 0, 0, Math.PI / 2, 6);
      else { for (const s of [-1, 1]) { K.cyl(fWire, .003, .003, .042, fx + s * .05, FY, FZ2, 0, 0, Math.PI / 2, 6); K.ball(fWire, .0075, fx + s * .029, FY - .002, FZ2); }
        K.cyl(M("glass", {color: "#2b231b", opacity: .55}), .0325, .0325, .085, fx, FY, FZ2, 0, 0, Math.PI / 2, 18); }   // Rußschleier im Glas
    }
    // Hinterlegte Karte (selbstleuchtend, damit die Sicherungen im Schatten des Versuchsbretts gut zu erkennen sind)
    const fCard = disp(.92, .27, 1024, (q, w, h) => { paintBg(q, w, h, st);
      rich(q, "Schmelzsicherung", w / 2, 54, 40, {font: st.head, color: st.acc, align: "center"});
      rich(q, "Bei zu großer Stromstärke schmilzt der dünne Draht durch.", w / 2, 88, 24, {font: st.font, color: st.dim, align: "center", weight: "600", max: w - 70});
      rich(q, "heil", 234, 124, 32, {font: st.font, color: st.ok, align: "center"});
      rich(q, "durchgeschmolzen", 757, 124, 32, {font: st.font, color: st.warn, align: "center"}); });
    fCard.position.set(0, .525, -.254); g.add(fCard);
    K.build(g);
    const lamp = bulb(1.3); lamp.position.set(.45, 1.1, -.1); g.add(lamp);
    const bpiv = new T.Group(); bpiv.position.set(-.35, 1.135, -.1); g.add(bpiv);
    const bar = ctx.box(.24, .014, .03, M("steel")); bar.position.x = .11; bpiv.add(bar);
    const hd = ctx.cyl(.016, .016, .09, M("color", {color: "#b3261e", rough: .5}), 12); hd.position.set(.1, .05, 0); bpiv.add(hd);
    const t1 = tag("Kurzschluss-Brücke", .042); t1.position.set(-.25, .918, .095); t1.rotation.x = -.2; g.add(t1);
    const t2 = tag("Lampe", .042); t2.position.set(.45, .918, .095); t2.rotation.x = -.2; g.add(t2);
    // Statusanzeige
    let state = "ok";
    const stat = disp(1.3, .3, 1024, (q, w, h) => { paintBg(q, w, h, st);
      if (state === "ok") { rich(q, "Leitungsschutzschalter B16 – eingeschaltet", w / 2, 92, 42, {font: st.font, color: st.ok, align: "center", max: w - 80});
        rich(q, "Lampe und Deckenleuchten hängen an diesem Stromkreis", w / 2, 160, 32, {font: st.font, color: st.ink, align: "center", weight: "600", max: w - 80});
        rich(q, "Klick: Brücke auflegen – Kurzschluss!", w / 2, 212, 28, {font: st.font, color: st.dim, align: "center", weight: "500"}); }
      else { rich(q, "KURZSCHLUSS!", w / 2, 92, 58, {font: st.head, color: st.warn, align: "center"});
        rich(q, "Stromstärke sehr groß → der Schalter hat sofort ausgelöst", w / 2, 160, 32, {font: st.font, color: st.ink, align: "center", weight: "600", max: w - 80});
        rich(q, "Klick: Brücke entfernen, wieder einschalten", w / 2, 212, 28, {font: st.font, color: st.dim, align: "center", weight: "500"}); } });
    stat.position.set(0, 2.525, -.255); g.add(stat);
    // Ablauf
    let shorted = false, ang = .95, lsOn = true, trip = -1, la = .5, lk = 1;
    const sp = wpos(g, -.15, 1.14, -.1);
    ctx.tick(dt => {
      const tgt = shorted ? 0 : .95;
      if (shorted && ang > 0) { ang = Math.max(0, ang - dt * 6); if (ang === 0) { sparks.burst(sp, 34); trip = .12; } }
      else if (!shorted && ang < tgt) { ang = Math.min(tgt, ang + dt * 2.5); if (ang > .5 && !lsOn) { lsOn = true; flagM.color.set(0x2ecc71); lsAlarm.off(); overhead.set(true); state = "ok"; stat.redraw(); } }
      if (trip > 0) { trip -= dt; if (trip <= 0) { lsOn = false; flagM.color.set(0xe74c3c); lsAlarm.fire(); overhead.set(false); state = "short"; stat.redraw(); } }
      lsAlarm.tick(dt);
      bpiv.rotation.z = ang;
      la += ((lsOn ? .5 : 2.6) - la) * Math.min(1, dt * (lsOn ? 8 : 22)); piv.rotation.x = la;
      lk += ((lsOn && ang > .3 ? 1 : 0) - lk) * Math.min(1, dt * 12); lamp.set(lk);
    });
    ctx.obstacleBox(S.B.x + .62, S.B.z, .75, 2.25);
    ctx.exhibit(g, {label: "Sicherungskasten", sub: "anklicken: Kurzschluss auslösen", dist: 2.2, pitch: -.08,
      onClick: () => { shorted = !shorted; },
      // feste Titel: Baustellen-Wegweiser („Zum Exponat“) und Labor finden Exponate über den Titel – der Zustand steht im ersten Satz des Textes
      title: "Sicherungskasten und Kurzschluss",
      get text(){ return nb(shorted
        ? "**Kurzschluss!** Die Metallbrücke verbindet Außen- und Neutralleiter fast ohne Widerstand, die Stromstärke wird sehr groß – ohne Sicherung würden die Leitungen glühend heiß, es droht ein **Brand**.\n\nDer **Leitungsschutzschalter** (Sicherungsautomat) unterbricht den Stromkreis sofort; auch die Deckenleuchten an diesem Stromkreis gehen aus. Anders als eine Schmelzsicherung, deren Draht durchschmilzt, lässt er sich wieder einschalten – klicke noch einmal."
        : "Die Brücke ist entfernt, der Leitungsschutzschalter wieder eingeschaltet – Lampe und Deckenleuchten leuchten.\n\nIm Haushalt ist jeder Stromkreis mit einer **Sicherung** (meist 16 A) abgesichert. Sie schützt die Leitungen bei **Kurzschluss** und **Überlastung**. Der **FI-Schutzschalter** daneben schützt Menschen: Er schaltet schon bei etwa 30 mA Fehlerstrom ab."); }});
  }

  /* ===================================================================
     C: Gerät mit Metallgehäuse und Schutzleiter (rechts vorne)
     =================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.C.x + .35, 0, S.C.z); g.rotation.y = -Math.PI / 2;
    const K = Bk(T), baseM = W === "sterne" ? M("metal") : W === "detektiv" ? M("darkwood") : M("stone");
    // Gehäuse mit eigenem Material: glüht beim Gehäuseschluss rot (die helle Sterne-Variante wirkte mit der roten Hülle allein nur rosa)
    const hp = W === "zauber" ? {color: 0xc07a45, roughness: .38, metalness: .55} : W === "detektiv" ? {color: 0xb89a5e, roughness: .36, metalness: .55} : {color: 0xb9c3ce, roughness: .3, metalness: .6};
    const housM = new T.MeshStandardMaterial(Object.assign({emissive: 0xff1a08, emissiveIntensity: 0}, hp)), housC = new T.Color(hp.color), alarmC = new T.Color(W === "sterne" ? 0x7a1208 : 0xb0301c);
    const darkM = M("color", {color: "#1c1a18", rough: .6});
    const postM = W === "sterne" ? M("metal") : M("darkwood"), white = M("plastic", {color: "#efede6"});
    K.box(baseM, 2.4, .1, 1.0, 0, .05, 0); K.box(trimM, 2.42, .02, .02, 0, .1, .5);
    if (W === "sterne") K.box(M("glow", {color: "#4FC3F7", intensity: 1.1}), 2.42, .015, .015, 0, .02, .505);
    // Gerät
    const DX = -.45, DZ = -.08, DW = .8, DH = .88, DD = .6, DY = .14 + DH / 2, FZ = DZ + DD / 2;
    K.box(housM, DW, DH, DD, DX, DY, DZ);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.cyl(M("rubber"), .03, .035, .04, DX + x * .33, .12, DZ + z * .24, 0, 0, 0, 10);
    K.box(darkM, .56, .34, .012, DX, .48, FZ + .004);
    for (const s of [-1, 1]) { K.box(trimM, .62, .03, .03, DX, .48 + s * .185, FZ + .01); K.box(trimM, .03, .4, .03, DX + s * .295, .48, FZ + .01); }
    for (let k = 0; k < 6; k++) K.cyl(M("steel"), .006, .006, .56, DX, .34 + k * .056, FZ + .03, 0, 0, Math.PI / 2, 6);
    K.box(darkM, .7, .13, .015, DX, .9, FZ + .008);
    for (const x of [-.22, -.1]) K.cyl(M("brass"), .03, .032, .03, DX + x, .9, FZ + .025, Math.PI / 2, 0, 0, 14);
    for (const x of [-1, 1]) for (const y of [.18, 1.0]) K.ball(trimM, .013, DX + x * .37, y, FZ + .004);
    K.cyl(M("rubber"), .035, .035, .06, DX + DW / 2 + .03, .38, DZ, 0, 0, Math.PI / 2, 14);
    const coilM = new T.MeshStandardMaterial({color: 0x3a2010, emissive: 0xff6a20, emissiveIntensity: 1.6, roughness: .6});
    { const pts = []; for (let i = 0; i <= 8; i++) pts.push(new T.Vector3(DX - .24 + i * .06, .48 + (i % 2 ? .1 : -.1), FZ + .016));
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, "catmullrom", .5), 80, .008, 6, false), coilM)); }
    const indM = new T.MeshStandardMaterial({color: 0x1f5a2a, emissive: 0x3ddc6b, emissiveIntensity: 2, roughness: .4});
    const ind = new T.Mesh(new T.SphereGeometry(.02, 12, 8), indM); ind.position.set(DX + .25, .9, FZ + .02); g.add(ind);
    const glowBox = new T.Mesh(new T.BoxGeometry(DW + .03, DH + .03, DD + .03), new T.MeshBasicMaterial({color: 0xff3b1f, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
      blending: W === "sterne" ? T.NormalBlending : T.AdditiveBlending}));
    glowBox.position.set(DX, DY, DZ); g.add(glowBox);
    // Säule mit FI-Schutzschalter, Steckdose und Erdung
    const PX = .72;
    K.box(postM, .36, 1.95, .14, PX, 1.075, -.32); K.box(trimM, .4, .03, .17, PX, 2.06, -.32);
    K.box(white, .32, .36, .08, PX, 1.62, -.21); K.box(white, .26, .13, .04, PX, 1.62, -.15);
    K.cyl(M("color", {color: "#f2c94c"}), .02, .02, .02, PX + .085, 1.62, -.125, Math.PI / 2, 0, 0, 12);
    const fiPiv = new T.Group(); fiPiv.position.set(PX - .04, 1.62, -.13); g.add(fiPiv);
    const fiLev = ctx.box(.07, .06, .03, M("color", {color: "#2b2b2b", rough: .4})); fiLev.position.y = .03; fiPiv.add(fiLev);
    const fiFlagM = new T.MeshBasicMaterial({color: 0x2ecc71, toneMapped: false}); const fiFlag = new T.Mesh(new T.PlaneGeometry(.1, .04), fiFlagM); fiFlag.position.set(PX - .025, 1.735, -.169); g.add(fiFlag);
    const fiTxt = ctx.text("T", {size: .03, color: "#222"}); fiTxt.position.set(PX + .085, 1.725, -.168); g.add(fiTxt);
    // Leuchte „AUS“ unter dem Schalter, Warnrahmen um den FI
    const ledM = new T.MeshBasicMaterial({color: 0x3a1010, toneMapped: false}), led = new T.Mesh(new T.CircleGeometry(.019, 20), ledM); led.position.set(PX - .075, 1.5, -.1685); g.add(led);
    const ledTxt = ctx.text("AUS", {size: .032, color: "#3a2a22"}); ledTxt.position.set(PX + .02, 1.5, -.1685); g.add(ledTxt);
    const fiAlarm = alarm(g, .35, .39, PX, 1.62, -.163, .016);
    K.box(white, .17, .17, .025, PX, .95, -.24); K.cyl(darkM, .06, .06, .02, PX, .95, -.228, Math.PI / 2, 0, 0, 20);
    for (const s of [-1, 1]) K.box(M("steel"), .012, .03, .02, PX, .95 + s * .055, -.222);
    K.cyl(M("rubber"), .052, .056, .07, PX, .95, -.19, Math.PI / 2, 0, 0, 18); K.cyl(M("rubber"), .016, .024, .06, PX, .95, -.13, Math.PI / 2, 0, 0, 12);
    K.box(M("copper"), .32, .03, .06, PX, .115, .3); for (const x of [-.1, 0, .1]) K.cyl(M("steel"), .012, .012, .03, PX + x, .14, .3, 0, 0, 0, 8);
    // Kabel: drei Adern in durchsichtigem Mantel
    const stripe = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 16; const q = c.getContext("2d"); q.fillStyle = "#2e8b3a"; q.fillRect(0, 0, 64, 16);
      q.fillStyle = "#f2d22e"; for (let x = -16; x < 64; x += 32) { q.beginPath(); q.moveTo(x, 16); q.lineTo(x + 16, 0); q.lineTo(x + 32, 0); q.lineTo(x + 16, 16); q.fill(); }
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(30, 1); return t; })();
    const peM = new T.MeshStandardMaterial({map: stripe, roughness: .55});
    const centerC = new T.CatmullRomCurve3([V3(PX, .95, -.1), V3(PX, .72, .0), V3(PX - .2, .34, .14), V3(.1, .28, .12), V3(DX + DW / 2 + .06, .38, DZ)], false, "centripetal");
    const fr = centerC.computeFrenetFrames(60, false), cores = [[], [], []];
    for (let i = 0; i <= 60; i++) { const p = centerC.getPointAt(i / 60), n = fr.normals[i], b = fr.binormals[i];
      for (let k = 0; k < 3; k++) { const a = k * TAU / 3; cores[k].push(p.clone().addScaledVector(n, Math.cos(a) * .012).addScaledVector(b, Math.sin(a) * .012)); } }
    const coreTube = (pts, m) => { const me = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 120, .0075, 6, false), m); me.castShadow = true; g.add(me); return me; };
    coreTube(cores[0], M("color", {color: "#6b3e1f", rough: .55})); coreTube(cores[1], M("color", {color: "#2756a8", rough: .55})); coreTube(cores[2], peM);
    g.add(new T.Mesh(new T.TubeGeometry(centerC, 80, .028, 12, false), M("glass", {color: "#e8e8e8", opacity: .2})));
    const pePts = [V3(PX + .1, .95, -.225), V3(PX + .13, .9, -.215), V3(PX + .13, .16, -.215), V3(PX + .13, .13, -.05), V3(PX + .13, .13, .27)];
    const peWire = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pePts, false, "catmullrom", 0), 80, .009, 6, false), peM.clone()); peWire.material.map = stripe.clone(); peWire.material.map.repeat.set(36, 1); peWire.material.map.needsUpdate = true; g.add(peWire);
    K.build(g);
    // Erde-Schild
    const earth = disp(.24, .15, 256, (q, w, h) => { paintBg(q, w, h, st, true); q.strokeStyle = st.ink; q.lineWidth = 7; q.lineCap = "round";
      const X = 70, Y = 34; q.beginPath(); q.moveTo(X, Y); q.lineTo(X, Y + 40); q.moveTo(X - 36, Y + 40); q.lineTo(X + 36, Y + 40); q.moveTo(X - 24, Y + 58); q.lineTo(X + 24, Y + 58); q.moveTo(X - 12, Y + 76); q.lineTo(X + 12, Y + 76); q.stroke();
      rich(q, "Erde", 172, 98, 46, {font: st.font, color: st.ink, align: "center"}); });
    earth.position.set(PX, .25, .36); earth.rotation.x = -.35; g.add(earth);
    const fiT = tag("FI-Schutzschalter", .05); fiT.position.set(PX, 1.88, -.2); g.add(fiT);
    // Leitertafel vorne
    const legend = disp(.86, .26, 1024, (q, w, h) => { paintBg(q, w, h, st);
      const rowsL = [["#6b3e1f", "L", "Außenleiter (braun)"], ["#2756a8", "N", "Neutralleiter (blau)"], ["pe", "PE", "Schutzleiter (grün-gelb)"]];
      rowsL.forEach(([c, s, n], i) => { const y = 66 + i * 82;
        if (c === "pe") { q.fillStyle = "#2e8b3a"; q.fillRect(50, y - 14, 130, 28); q.fillStyle = "#f2d22e"; for (let x = 50; x < 180; x += 26) { q.beginPath(); q.moveTo(x, y + 14); q.lineTo(x + 13, y - 14); q.lineTo(x + 26, y - 14); q.lineTo(x + 13, y + 14); q.fill(); } }
        else { q.fillStyle = c; q.fillRect(50, y - 14, 130, 28); }
        rich(q, s, 215, y + 16, 44, {font: st.font, color: st.acc}); rich(q, n, 310, y + 16, 44, {font: st.font, color: st.ink, weight: "600", max: w - 340}); }); });
    legend.position.set(-.05, .18, .43); legend.rotation.x = -1.0; g.add(legend);
    // Statusanzeige über dem Gerät (Haltepfosten steckt hinter der Rahmenrückseite, durchsticht die Anzeige nicht)
    const SX0 = -.42, SY0 = 1.62, SW = 1.56, SH = .56;
    K.box(postM, .05, 1.36, .05, SX0, .78, -.485); K.box(frameM, SW + .06, SH + .06, .04, SX0, SY0, -.47); K.build(g);
    let state = "ok";
    const stat = disp(SW, SH, 1024, (q, w, h) => { paintBg(q, w, h, st);
      const ln = (s, y, col, sz, wt = "600") => rich(q, s, w / 2, y, sz, {font: st.font, color: col, align: "center", weight: wt, max: w - 80});
      if (state === "ok") { rich(q, "Normalbetrieb", w / 2, 88, 60, {font: st.head, color: st.ok, align: "center"});
        ln("Das Metallgehäuse ist über den Schutzleiter geerdet.", 152, st.ink, 38);
        ln("I_{L} = I_{N}: kein Fehlerstrom – der FI bleibt eingeschaltet", 212, st.ink, 34);
        ln("Klick: Defekt auslösen (Gehäuseschluss)", 292, st.dim, 34, "500"); }
      else if (state === "fault") { rich(q, "GEHÄUSESCHLUSS!", w / 2, 88, 64, {font: st.head, color: st.warn, align: "center"});
        ln("Fehlerstrom fließt über den Schutzleiter zur Erde", 152, st.ink, 38);
        ln("I_{L} ≠ I_{N}: Differenz weit über 30 mA → der FI löst aus", 212, st.ink, 34);
        ln("(in Zeitlupe – in Wirklichkeit dauert es Millisekunden)", 292, st.dim, 32, "500"); }
      else { rich(q, "FI-Schutzschalter hat ausgelöst", w / 2, 88, 56, {font: st.head, color: st.warn, align: "center", max: w - 70});
        ln("Das Gerät ist abgeschaltet – keine Gefahr beim Berühren.", 152, st.ink, 38);
        ln("Ohne Schutzleiter und FI könnte der Strom durch einen Menschen fließen.", 212, st.ink, 32);
        ln("Klick: Gerät reparieren, FI wieder einschalten", 292, st.dim, 34, "500"); } });
    stat.position.set(SX0, SY0, -.448); g.add(stat);
    // Fehlerstrom: braune Ader hin, Schutzleiter zurück, hinunter zur Erde
    const fpath = ctx.path([...cores[0], ...cores[2].slice().reverse(), ...pePts.slice(1)]);
    const fflow = ctx.flow(fpath, {count: 80, size: .014, color: 0xff3b1f, speed: .16, on: false}); g.add(fflow.mesh);
    // Ablauf
    let fault = false, ft = 0, fiOn = true, devK = 1, fa = .45, hk = 0;
    const sp = wpos(g, DX + DW / 2 + .02, .38, DZ);
    ctx.tick((dt, t) => {
      if (fault && fiOn) { ft += dt; if (ft > 1.6) { fiOn = false; state = "trip"; stat.redraw(); fiAlarm.fire(); } }
      if (!fault && fiAlarm.on) fiAlarm.off();
      fiAlarm.tick(dt);
      fflow.on = fault && fiOn;
      const live = fault && fiOn, pulse = .5 + .5 * Math.sin(t * 18);
      glowBox.material.opacity = live ? (W === "sterne" ? .3 + .16 * pulse : .22 + .14 * (2 * pulse - 1)) : Math.max(0, glowBox.material.opacity - dt * 2);
      hk += ((live ? 1 : 0) - hk) * Math.min(1, dt * 10);
      housM.emissiveIntensity = hk * (W === "sterne" ? .55 + .45 * pulse : .25 + .25 * pulse); housM.color.copy(housC).lerp(alarmC, hk * (W === "sterne" ? .75 : .35));
      const ledK = fiOn ? 0 : (fiAlarm.on ? .6 + .4 * Math.abs(Math.cos(t * 7)) : 1); ledM.color.setRGB(.23 + .77 * ledK, .06 + .12 * ledK, .06 + .06 * ledK);
      devK += ((fiOn ? 1 : 0) - devK) * Math.min(1, dt * 8); coilM.emissiveIntensity = 1.6 * devK; indM.emissiveIntensity = .03 + 2 * devK; indM.color.setRGB(.12, .2 + .15 * devK, .14);
      fa += ((fiOn ? .45 : 2.7) - fa) * Math.min(1, dt * (fiOn ? 6 : 20)); fiPiv.rotation.x = fa; fiFlagM.color.set(fiOn ? 0x2ecc71 : 0xe74c3c);
    });
    ctx.obstacleBox(S.C.x + .35, S.C.z, 1.1, 2.5);
    ctx.exhibit(g, {label: "Gerät mit Schutzleiter", sub: "anklicken: Defekt auslösen", dist: 2.3, pitch: -.18,
      onClick: () => { if (!fault) { fault = true; ft = 0; fiOn = true; state = "fault"; sparks.burst(sp, 26); stat.redraw(); } else { fault = false; fiOn = true; state = "ok"; stat.redraw(); } },
      title: "Schutzleiter und FI-Schutzschalter",
      get text(){ return nb(fault
        ? "**Gehäuseschluss:** Der braune **Außenleiter** berührt durch einen Defekt das Metallgehäuse. Weil das Gehäuse über den grün-gelben **Schutzleiter** geerdet ist, fließt der Strom über ihn zur Erde ab – und nicht durch einen Menschen, der das Gerät anfasst.\n\nDer **FI-Schutzschalter** vergleicht die Stromstärken im Außen- und Neutralleiter. Fließt Strom auf einem anderen Weg ab, schaltet er schon bei etwa **30 mA** in Bruchteilen einer Sekunde ab."
        : "Das Gerät ist über ein **dreiadriges Kabel** angeschlossen: **braun** = Außenleiter L, **blau** = Neutralleiter N, **grün-gelb** = Schutzleiter PE.\n\nDer Schutzleiter verbindet das Metallgehäuse über den Schutzkontakt der Steckdose mit der Erde. Klicke, um einen Defekt auszulösen."); }});
  }

  /* ===================================================================
     D: Mehrfachsteckdose – Überlastung (links vorne)
     =================================================================== */
  {
    const g = new T.Group(); ctx.add(g, S.D.x - .15, 0, S.D.z); g.rotation.y = Math.PI / 2;
    const K = Bk(T), sbM = W === "sterne" ? M("metal") : W === "detektiv" ? M("darkwood") : M("wood"), topM = W === "sterne" ? M("color", {color: "#1b2330", rough: .5, metal: .4}) : M("darkwood");
    const frontM = W === "sterne" ? M("steel") : W === "detektiv" ? M("wood") : M("darkwood"), appM = M("color", W === "zauber" ? {color: "#c07a45", rough: .38, metal: .55} : W === "detektiv" ? {color: "#e6dcc4", rough: .45, metal: .1} : {color: "#dfe5ec", rough: .35, metal: .2});
    const darkM = M("color", {color: "#1c1a18", rough: .6});
    K.box(sbM, 2.4, .78, .6, 0, .44, -.05); K.box(M("darkwood"), 2.3, .05, .54, 0, .025, -.05); K.box(topM, 2.5, .05, .68, 0, .855, -.04);
    for (const x of [-.9, -.3, .3, .9]) { K.box(frontM, .56, .62, .02, x, .45, .255); K.box(M("brass"), .12, .025, .025, x, .64, .275); }
    if (W === "sterne") K.box(M("glow", {color: "#4FC3F7", intensity: 1.2}), 2.42, .02, .02, 0, .82, .29);
    // Anzeigewand
    K.box(frameM, 2.4, 1.6, .06, 0, 1.68, -.37); K.box(trimM, 2.44, .04, .08, 0, 2.5, -.36);
    // Steckdosenleiste
    const SX = [-.49, -.23, .03, .29], SZ = .2, SY = .88;
    K.box(M("plastic", {color: "#efede6"}), 1.1, .05, .13, -.1, SY + .005, SZ);
    for (const x of SX) { K.cyl(M("color", {color: "#d6d3cb"}), .05, .05, .012, x, SY + .03, SZ, 0, 0, 0, 20); K.cyl(darkM, .038, .038, .012, x, SY + .033, SZ, 0, 0, 0, 20); }
    const swM = new T.MeshStandardMaterial({color: 0x7a1a12, emissive: 0xff3b2a, emissiveIntensity: 1.5, roughness: .4});
    const sw = new T.Mesh(new T.BoxGeometry(.06, .025, .08), swM); sw.position.set(.36, SY + .035, SZ); g.add(sw);
    // Geräte
    const AZ = -.12, AY = .88;
    // Lampe
    K.cyl(appM, .08, .09, .03, -.92, AY + .015, AZ, 0, 0, 0, 20); K.cyl(appM, .012, .012, .38, -.92, AY + .2, AZ, 0, 0, 0, 8);
    const shade = new T.Mesh(new T.CylinderGeometry(.07, .16, .17, 24, 1, true), M("cloth", {color: W === "sterne" ? "#2b4a6f" : W === "detektiv" ? "#1f6b48" : "#7a1f2a"})); shade.position.set(-.92, AY + .4, AZ); g.add(shade);
    const lampM = new T.MeshStandardMaterial({color: 0xfff3d6, emissive: 0xffd08a, emissiveIntensity: 0, roughness: .4});
    const lampB = new T.Mesh(new T.SphereGeometry(.045, 14, 10), lampM); lampB.position.set(-.92, AY + .36, AZ); g.add(lampB);
    const lampH = ctx.glow(0xffd9a0, .01); lampH.position.copy(lampB.position); g.add(lampH);
    // Toaster
    K.box(appM, .28, .17, .16, -.4, AY + .085, AZ); for (const dz of [-.035, .035]) K.box(darkM, .2, .006, .028, -.4, AY + .171, AZ + dz); K.box(darkM, .03, .025, .03, -.25, AY + .1, AZ);
    const toastM = new T.MeshStandardMaterial({color: 0x3a1a08, emissive: 0xff6a20, emissiveIntensity: 0, roughness: .6});
    const toast = new T.Mesh(mergeGeos(T, [-.035, .035].map(dz => new T.BoxGeometry(.19, .004, .02).translate(-.4, AY + .175, AZ + dz))), toastM); g.add(toast);
    // Wasserkocher
    K.cyl(darkM, .11, .11, .02, .1, AY + .01, AZ, 0, 0, 0, 24); K.cyl(appM, .085, .1, .22, .1, AY + .13, AZ, 0, 0, 0, 24); K.cyl(darkM, .06, .07, .03, .1, AY + .255, AZ, 0, 0, 0, 20);
    K.add(darkM, new T.TorusGeometry(.075, .016, 8, 18, Math.PI), .19, AY + .13, AZ, 0, 0, -Math.PI / 2); K.cyl(appM, .015, .03, .09, .0, AY + .2, AZ, 0, 0, .9, 10);
    const ketM = new T.MeshStandardMaterial({color: 0x10204a, emissive: 0x3aa0ff, emissiveIntensity: 0, roughness: .4});
    const ket = new T.Mesh(new T.SphereGeometry(.014, 10, 8), ketM); ket.position.set(.1, AY + .045, AZ + .095); g.add(ket);
    const steam = [0, 1, 2].map(i => { const s = ctx.glow(0xffffff, .01); s.material.blending = T.NormalBlending; s.material.opacity = 0; g.add(s); return s; });
    // Heizlüfter
    K.box(appM, .3, .3, .16, .62, AY + .15, AZ); K.box(darkM, .22, .04, .2, .62, AY + .02, AZ);
    for (let k = 0; k < 6; k++) K.box(darkM, .25, .012, .012, .62, AY + .06 + k * .038, AZ + .085);
    const heatM = new T.MeshStandardMaterial({color: 0x2a1006, emissive: 0xff5a1a, emissiveIntensity: 0, roughness: .6});
    const heat = new T.Mesh(new T.BoxGeometry(.24, .2, .01), heatM); heat.position.set(.62, AY + .155, AZ + .075); g.add(heat);
    // Kabel zu den Steckern, Stecker beweglich
    const AX = [-.92, -.4, .1, .62], plugs = [];
    AX.forEach((ax, i) => { const sx = SX[i]; K.tube(M("rubber"), [[ax, AY + .02, AZ - .07], [ax, AY + .006, .02], [sx, AY + .006, .09], [sx, SY + .11, SZ - .01]], .008, 60);
      const pg = new T.Group(); pg.position.set(sx, SY + .04, SZ); g.add(pg);
      const pb = ctx.cyl(.034, .036, .05, M("rubber"), 16); pb.position.y = .045; pg.add(pb); const pr = ctx.cyl(.012, .016, .04, M("rubber"), 10); pr.position.y = .085; pg.add(pr);
      plugs.push({pg, u: 0}); });
    // Zuleitung zur Sicherung (glüht bei Überlastung)
    const leadM = new T.MeshStandardMaterial({color: 0x1d1a17, emissive: 0xff3a10, emissiveIntensity: 0, roughness: .6});
    const leadC = new T.CatmullRomCurve3([V3(.45, SY + .01, SZ), V3(.62, SY - .01, SZ - .02), V3(.95, AY + .02, -.18), V3(1.02, 1.2, -.33), V3(1.02, 1.62, -.33)], false, "centripetal");
    g.add(new T.Mesh(new T.TubeGeometry(leadC, 80, .013, 8, false), leadM));
    // Sicherung 16 A
    K.box(M("plastic", {color: "#f1f0ea"}), .12, .2, .07, 1.02, 1.74, -.31); K.box(M("plastic", {color: "#f1f0ea"}), .1, .1, .03, 1.02, 1.74, -.26);
    const fPiv = new T.Group(); fPiv.position.set(1.02, 1.74, -.243); g.add(fPiv); const fLev = ctx.box(.026, .05, .026, M("color", {color: "#1b1b1b"})); fLev.position.y = .025; fPiv.add(fLev);
    K.build(g);
    const ft = tag("Sicherung 16 A", .045); ft.position.set(1.02, 1.94, -.3); g.add(ft);
    const names = ["Lampe", "Toaster", "Wasserkocher", "Heizlüfter"], amps = [.3, 3.9, 8.7, 8.7];
    names.forEach((n, i) => { const t = tag(`${n} · ${de(amps[i])} A`, .042); t.position.set(AX[i], .75, .27); g.add(t); });
    // Anzeige
    let phase = "idle", t0 = 0, nOn = 0, blink = false;
    const Isum = () => amps.slice(0, nOn).reduce((a, b) => a + b, 0);
    const scr = disp(1.8, .78, 1024, (q, w, h) => { paintBg(q, w, h, st);
      rich(q, "Mehrfachsteckdose", 44, 72, 46, {font: st.head, color: st.acc});
      rich(q, "Stromkreis mit 16 A abgesichert", w - 44, 70, 28, {font: st.font, color: st.dim, align: "right", weight: "600"});
      const I = phase === "trip" ? 0 : Isum(), over = I > 16;
      rich(q, `I_{ges} = ${de(I)} A`, 44, 160, 64, {font: st.font, color: over ? st.warn : st.ink});
      const bx0 = 60, bx1 = w - 60, by = 200, bh = 46, X = a => bx0 + a / 25 * (bx1 - bx0);
      q.fillStyle = st.kind === "detektiv" ? "rgba(60,40,20,.15)" : "rgba(255,255,255,.08)"; q.fillRect(bx0, by, bx1 - bx0, bh);
      q.fillStyle = over ? st.warn : st.ok; q.fillRect(bx0, by, X(I) - bx0, bh);
      let acc = 0; for (let i = 0; i < nOn && phase !== "trip"; i++) { acc += amps[i]; q.fillStyle = st.kind === "detektiv" ? "rgba(0,0,0,.35)" : "rgba(0,0,0,.45)"; q.fillRect(X(acc) - 2, by, 4, bh); }
      q.strokeStyle = st.ink; q.lineWidth = 3; q.strokeRect(bx0, by, bx1 - bx0, bh);
      q.fillStyle = st.ink; q.font = `600 24px ${st.font}`; q.textAlign = "center"; q.textBaseline = "top";
      for (let a = 0; a <= 25; a += 5) { q.fillRect(X(a) - 1.5, by + bh, 3, 10); q.fillText(`${a} A`, X(a), by + bh + 14); }
      q.strokeStyle = st.warn; q.lineWidth = 6; q.setLineDash([12, 8]); q.beginPath(); q.moveTo(X(16), by - 16); q.lineTo(X(16), by + bh + 8); q.stroke(); q.setLineDash([]);
      rich(q, "16 A", X(16), by - 22, 28, {font: st.font, color: st.warn, align: "center"});
      const sum = amps.slice(0, nOn).map(a => `${de(a)} A`).join(" + ");
      if (phase !== "trip") rich(q, nOn ? `${sum}${nOn > 1 ? ` = ${de(I)} A` : ""}` : "Noch kein Gerät eingesteckt", w / 2, 360, 36, {font: st.font, color: st.ink, align: "center", weight: "600", max: w - 80});
      else rich(q, "21,6 A > 16 A: Die Sicherung hat ausgelöst (Zeitraffer)", w / 2, 360, 36, {font: st.font, color: st.warn, align: "center", weight: "700", max: w - 80});
      const msg = phase === "idle" ? ["Klick: Geräte nacheinander einstecken", st.dim] : phase === "trip" ? ["Alle Geräte sind aus. Klick: Sicherung wieder einschalten", st.ink]
        : over ? [blink ? "ÜBERLASTUNG! Die Leitung wird heiß (Zeitraffer)" : "", st.warn] : ["Die Ströme addieren sich", st.dim];
      if (msg[0]) rich(q, msg[0], w / 2, 420, 34, {font: st.font, color: msg[1], align: "center", weight: "700", max: w - 80});
    });
    scr.position.set(-.13, 1.95, -.336); g.add(scr);
    // Schaltbild unter der Anzeige: alle Geräte parallel an einer abgesicherten Leitung (Zweige leuchten beim Einstecken auf)
    const sch = disp(1.3, .37, 1024, (q, w, h) => { paintBg(q, w, h, st, true);
      const lw = 6, yL = 100, yN = 258, ym = (yL + yN) / 2, xS = 62, f0 = 165, f1 = 255, xs = [350, 505, 660, 815], over = phase === "run" && Isum() > 16, trip = phase === "trip";
      const live = st.kind === "detektiv" ? "#2F6B3A" : st.ok, off = st.kind === "detektiv" ? "rgba(42,29,18,.38)" : "rgba(220,235,245,.32)";
      rich(q, "Schaltbild: alle Geräte parallel an einer Leitung", 34, 50, 34, {font: st.font, color: st.acc, max: w - 70});
      q.lineCap = "round"; q.lineJoin = "round"; q.lineWidth = lw;
      // Quelle 230 V
      q.strokeStyle = st.ink; q.beginPath(); q.arc(xS, ym, 30, 0, TAU); q.stroke(); q.font = `700 40px ${st.font}`; q.fillStyle = st.ink; q.textAlign = "center"; q.textBaseline = "middle"; q.fillText("~", xS, ym + 2);
      rich(q, "230 V", xS + 42, ym + 11, 30, {font: st.font, color: st.ink, weight: "700"});
      q.beginPath(); q.moveTo(xS, ym - 30); q.lineTo(xS, yL); q.moveTo(xS, ym + 30); q.lineTo(xS, yN); q.stroke();
      // Zuleitung mit Sicherung (oben), Rückleitung (unten)
      q.strokeStyle = trip ? off : over ? st.warn : nOn && phase === "run" ? live : st.ink; q.lineWidth = over ? lw + 4 : lw;
      q.beginPath(); q.moveTo(xS, yL); q.lineTo(f0, yL); q.moveTo(f1, yL); q.lineTo(xs[3], yL); q.stroke();
      q.lineWidth = lw; q.strokeStyle = trip ? off : st.ink; q.beginPath(); q.moveTo(xS, yN); q.lineTo(xs[3], yN); q.stroke();
      q.strokeStyle = trip ? st.warn : st.ink; q.strokeRect(f0, yL - 18, f1 - f0, 36); q.beginPath();
      if (trip) { q.moveTo(f0, yL); q.lineTo(f0 + 36, yL); q.moveTo(f1 - 36, yL - 10); q.lineTo(f1, yL); } else { q.moveTo(f0, yL); q.lineTo(f1, yL); } q.stroke();
      rich(q, trip ? "16 A – aus" : "16 A", (f0 + f1) / 2, yL + 52, 28, {font: st.font, color: trip ? st.warn : st.ink, align: "center", weight: "700"});
      // vier Zweige
      ["Lampe", "Toaster", "Kocher", "Heizlüfter"].forEach((n, i) => { const x = xs[i], on = phase === "run" && i < nOn, c = on ? (over ? st.warn : live) : off;
        q.strokeStyle = c; q.lineWidth = on ? lw + 2 : lw; q.fillStyle = c;
        q.beginPath(); q.arc(x, yL, 9, 0, TAU); q.fill(); q.beginPath(); q.arc(x, yN, 9, 0, TAU); q.fill();
        q.beginPath(); q.moveTo(x, yL); q.lineTo(x, ym - 28); q.moveTo(x, ym + 28); q.lineTo(x, yN); q.stroke();
        if (i === 0) { q.beginPath(); q.arc(x, ym, 26, 0, TAU); q.moveTo(x - 18, ym - 18); q.lineTo(x + 18, ym + 18); q.moveTo(x + 18, ym - 18); q.lineTo(x - 18, ym + 18); q.stroke(); }
        else q.strokeRect(x - 15, ym - 28, 30, 56);
        rich(q, n, x + 28, ym - 6, 30, {font: st.font, color: on ? st.ink : st.dim, weight: "700", max: 142});
        rich(q, `${de(amps[i])} A`, x + 28, ym + 28, 28, {font: st.font, color: on ? st.ink : st.dim, weight: "600"}); });
    }, {tint: st.tint});
    sch.position.set(-.11, 1.37, -.336); g.add(sch);
    const fuseAlarm = alarm(g, .15, .23, 1.02, 1.74, -.272, .014);
    let key = "", skey = "", heatK = 0, fa = .5;
    const on = [0, 0, 0, 0], lp = wpos(g, -.3, 2.2, .7), dLight = ctx.light(0xffd9a0, 1.2, 5, lp.x, lp.y, lp.z);
    ctx.tick((dt, t) => {
      if (phase === "run") { t0 += dt; nOn = [0, 1, 2, 3].filter(i => t0 >= .3 + i * .9).length; if (nOn === 4) heatK = Math.min(1, heatK + dt / 1.4); if (t0 >= 4.9) { phase = "trip"; fuseAlarm.fire(); } }
      else heatK = Math.max(0, heatK - dt * .6);
      if (phase !== "trip" && fuseAlarm.on) fuseAlarm.off();
      fuseAlarm.tick(dt);
      blink = (t * 3 % 1) < .6;
      const k2 = phase + nOn + (nOn === 4 && phase === "run" ? blink : ""); if (k2 !== key) { key = k2; scr.redraw(); }
      if (phase + nOn !== skey) { skey = phase + nOn; sch.redraw(); }
      plugs.forEach((p, i) => { const want = (phase !== "idle" && i < nOn) ? 1 : 0; p.u += (want - p.u) * Math.min(1, dt * 10); p.pg.position.y = SY + .04 + (1 - p.u) * .07; p.pg.rotation.z = (1 - p.u) * .25;
        on[i] += ((phase === "run" && i < nOn ? 1 : 0) - on[i]) * Math.min(1, dt * 8); });
      lampM.emissiveIntensity = 3 * on[0]; lampH.visible = on[0] > .02; lampH.scale.setScalar(.5 * on[0] + .01); if (dLight) dLight.intensity = 1.2 + 2.5 * on[0];
      toastM.emissiveIntensity = 2.4 * on[1]; ketM.emissiveIntensity = 3 * on[2]; heatM.emissiveIntensity = 2.2 * on[3] * (.9 + .1 * Math.sin(t * 9));
      steam.forEach((s, i) => { const ph = (t * .5 + i / 3) % 1; s.position.set(.04 + Math.sin(t + i) * .02, AY + .3 + ph * .35, AZ); s.scale.setScalar(.06 + ph * .12); s.material.opacity = on[2] * .35 * (1 - ph); });
      leadM.emissiveIntensity = 2.2 * heatK * (.85 + .15 * Math.sin(t * 7)); leadM.color.setRGB(.11 + .5 * heatK, .1 + .05 * heatK, .09);
      swM.emissiveIntensity = phase === "trip" ? .1 : 1.5;
      fa += ((phase === "trip" ? 2.6 : .5) - fa) * Math.min(1, dt * (phase === "trip" ? 20 : 6)); fPiv.rotation.x = fa;
    });
    ctx.obstacleBox(S.D.x - .15 - .07, S.D.z, .82, 2.55);
    ctx.exhibit(g, {label: "Mehrfachsteckdose", sub: "anklicken: Geräte einstecken", dist: 2.3, pitch: -.12,
      onClick: () => { if (phase === "idle") { phase = "run"; t0 = 0; nOn = 0; } else if (phase === "trip") { phase = "idle"; nOn = 0; } },
      title: "Mehrfachsteckdose und Überlastung",
      get text(){ return nb(phase === "idle"
        ? "Die Sicherung ist wieder eingeschaltet, alle Stecker sind gezogen. Klicke noch einmal: Die Geräte werden nacheinander eingesteckt – beobachte die **Gesamtstromstärke** I_{ges}."
        : "An der Mehrfachsteckdose sind alle Geräte **parallel** geschaltet: Jedes bekommt 230 V, und ihre Ströme **addieren sich**: 0,3 A + 3,9 A + 8,7 A + 8,7 A = **21,6 A**.\n\nDas ist deutlich mehr als die **16 A**, für die Leitung und Sicherung ausgelegt sind: **Überlastung**. Die Leitung würde gefährlich heiß, deshalb schaltet die Sicherung nach einiger Zeit ab (hier im Zeitraffer gezeigt) – bei einem Kurzschluss dagegen sofort. Klicke noch einmal, um sie wieder einzuschalten."); }});
  }

  /* ===== Wandtafeln ===== */
  // Formeln stehen in eigenen Zeilen (oder vorn), damit der Zeilenumbruch sie nicht zerreißt (Holo-Schirm der Raumstation: große Schrift, frühe Umbrüche).
  // Zauberschule: Fackeln an den Säulen z = +4,5 (links) und −4,5 (rechts) – die beiden Tafeln daneben sind etwas schmaler und von der Fackel weggerückt,
  // sonst liegt die Flamme schräg betrachtet (z. B. vom Kennlinien-Schreiber oder vom Schutzleiter-Gerät aus) über den Zeilenenden.
  const fz = W === "zauber" ? .25 : 0, fw = W === "zauber" ? 3.0 : 3.2;
  ctx.wallBoard("left", 6.75 + fz, 3.7, fw, 2.1, "Reihenschaltung", ["Nur ein Stromweg: Die Stromstärke ist überall gleich.", "I = I_{1} = I_{2}", "Die Spannung teilt sich auf:", "U_{ges} = U_{1} + U_{2}", "R_{ges} = R_{1} + R_{2}", "Fällt ein Bauteil aus, ist der ganze Kreis unterbrochen."]);
  ctx.wallBoard("right", 2.25, 3.7, 3.2, 2.1, "Parallelschaltung", ["An jedem Zweig liegt dieselbe Spannung:", "U = U_{1} = U_{2}", "Die Ströme addieren sich:", "I_{ges} = I_{1} + I_{2}", "1 : R_{ges} = 1 : R_{1} + 1 : R_{2}", "R_{ges} ist kleiner als jeder Einzelwiderstand."]);
  ctx.wallBoard("left", -2.25, 3.7, 3.2, 2.1, "Kennlinien", ["I-U-Kennlinie: U nach rechts, I nach oben", "Ohmscher Widerstand, etwa Konstantandraht: Ursprungsgerade", "I ~ U und R = U : I bleibt gleich", "Glühlampe: Kurve wird flacher, R steigt mit der Temperatur"]);
  ctx.wallBoard("right", -6.75 - fz, 3.7, fw, 2.1, "Sicherheit im Haushalt", ["Netzspannung 230 V – lebensgefährlich!", "Sicherung: schaltet bei Kurzschluss und Überlastung ab", "Schutzleiter (grün-gelb) erdet das Metallgehäuse", "FI-Schutzschalter: löst ab etwa 30 mA aus"]);
};
})();
