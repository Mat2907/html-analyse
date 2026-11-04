/* ---------- 00_kern.js ---------- */
/* =====================================================================
   3D-Räume (nur Mac-Version) · Kern
   Begehbare Räume je Thema in drei Welten. Klick auf den Boden = gehen, Ziehen = umsehen,
   Klick auf Stationen, Exponate und Türen = interagieren. Pfeiltasten/WASD gehen ebenfalls.
   Baut auf THREE (vendor/three.min.js), der Lernapp-Engine und dem Welten-Plugin (window.WELTEN_API) auf.
   Räume: R3D.rooms[<themen-id>] = ctx => {…}   (Schnittstelle: RAUM-API.md)
   Weltstile: R3D.kits[<welt>]                   (10_weltstile.js)
   ===================================================================== */
(() => {
const T3 = window.THREE;
const R3D = window.R3D = window.R3D || {rooms: {}, kits: {}};
// Erweiterungspunkte für Zusatzmodule (z. B. 05_lernen.js): ctxExt(ctx) ergänzt den Raum-Kontext, afterBuild(raum) läuft nach dem Bau,
// afterEnter(raum) nach dem Betreten, onHidePanel() beim Schließen des Panels; gate(ia, weiter) darf eine Tür sperren (true = gesperrt)
R3D.hooks = R3D.hooks || {ctxExt: [], afterBuild: [], afterEnter: [], onHidePanel: [], station: []};   // station: (panel, thema, j) → Zusatzknöpfe im Stationspanel
if (!T3) return;
// Ältere Safari-Versionen (vor 16) kennen roundRect nicht
if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r){
  r = Math.min(typeof r === "number" ? r : (r && r[0]) || 0, w / 2, h / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); return this; };

/* ---------- Grundmaße ---------- */
const ROOM = {w: 16, d: 22};                              // x ∈ [-8, 8], z ∈ [-11, 11]
const EYE = 1.62, SPEED = 3.4, RADIUS = 0.38;
const STATIONS = [[-5.5, 6], [5.5, 2], [-5.5, -3], [5.5, -7]];   // Verstehen, Üben, Anwenden, Prüfen
const SLOTS = {center: {x: 0, z: -1.5, r: 1.8}, A: {x: -5.5, z: 1.5, r: 1.8}, B: {x: 5.5, z: 6.8, r: 1.8},
               C: {x: 5.5, z: -2.5, r: 1.8}, D: {x: -5.5, z: -8, r: 1.8}};
const HALL = {w: 18, d: 30, z0: 12, z1: -18};            // x ∈ [-9, 9], z ∈ [-18, 12]
const HALL_DOORS = [[-9, 6], [-9, -1], [-9, -8], [-9, -15], [9, 6], [9, -1], [9, -8], [9, -15]];
const STORE = PFX + "-3d", RKEY3 = PFX + "-3d-raum";
const st = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
const REDUCED3 = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Oberfläche ---------- */
const css = document.createElement("style");
css.textContent = `
#r3d{position:fixed;inset:0;z-index:19;background:#000;overflow:hidden;user-select:none;-webkit-user-select:none}
#r3d canvas.r3d-c{display:block;width:100%;height:100%;cursor:grab;touch-action:none}
#r3d canvas.r3d-c.drag{cursor:grabbing}#r3d canvas.r3d-c.ptr{cursor:pointer}
#r3d .r3d-fade{position:absolute;inset:0;background:#000;opacity:1;pointer-events:none;transition:opacity .45s ease}
#r3d .r3d-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:flex-start;gap:12px;padding:14px 16px;pointer-events:none;
  background:linear-gradient(rgba(0,0,0,.55),transparent)}
#r3d .r3d-where{flex:1;min-width:0;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}
#r3d .r3d-where small{display:block;font-family:var(--f-display);font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
#r3d .r3d-where b{display:block;font-family:var(--f-display);font-size:1.45rem;line-height:1.15}
#r3d .r3d-btns{display:flex;gap:8px;pointer-events:auto;flex-wrap:wrap;justify-content:flex-end}
#r3d .r3d-btn{border:1px solid rgba(255,255,255,.28);background:rgba(10,10,14,.55);color:#fff;border-radius:999px;padding:8px 14px;font-size:.9rem;
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);white-space:nowrap}
#r3d .r3d-btn:hover{background:rgba(255,255,255,.18)}
#r3d .r3d-hint{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,.5);padding:7px 14px;border-radius:999px;
  font-size:.85rem;pointer-events:none;transition:opacity .6s;white-space:nowrap}
#r3d .r3d-tip{position:absolute;pointer-events:none;transform:translate(-50%,-110%);background:rgba(8,8,12,.82);color:#fff;border:1px solid var(--accent);
  border-radius:10px;padding:6px 10px;font-size:.88rem;font-weight:600;white-space:nowrap;opacity:0;transition:opacity .15s}
#r3d .r3d-tip.on{opacity:1}
#r3d .r3d-tip small{display:block;font-weight:400;opacity:.75;font-size:.75rem}
#r3d .r3d-map{position:absolute;right:16px;bottom:16px;width:132px;height:176px;border-radius:12px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.2);cursor:pointer}
#r3d .r3d-map:hover{border-color:rgba(255,255,255,.55)}
#r3d .r3d-panel{position:absolute;left:16px;bottom:16px;width:min(420px,calc(100% - 180px));max-height:calc(100% - 120px);overflow:auto;background:var(--surface);color:var(--ink);
  border:1px solid var(--line);border-radius:16px;padding:18px 18px 16px;box-shadow:0 18px 50px rgba(0,0,0,.45);animation:r3dIn .25s ease}
@keyframes r3dIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
#r3d .r3d-panel h3{margin:2px 0 6px;font-size:1.3rem}
#r3d .r3d-panel p{margin:0 0 10px;line-height:1.45}
#r3d .r3d-panel .r3d-x{position:absolute;top:10px;right:10px;border:0;background:var(--surface-2);color:var(--ink);width:32px;height:32px;border-radius:50%;font-size:1rem}
#r3d .r3d-panel .r3d-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
#r3d .r3d-panel .r3d-acts .btn{padding:10px 14px;font-size:.95rem}
#r3d .r3d-panel .bar{margin:6px 0 4px}
#r3d .r3d-load{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-family:var(--f-display);font-size:1.3rem;pointer-events:none;
  text-align:center;padding:0 24px;text-shadow:0 2px 8px #000;transition:opacity .45s}
.r3d-enter{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;width:100%;text-align:left;border:0;border-radius:16px;padding:16px;
  color:#fff;background:radial-gradient(80% 120% at 100% 0%,color-mix(in srgb,var(--accent) 70%,transparent),transparent 70%),linear-gradient(140deg,#15101c,#2a1d33)}
.r3d-enter b{font-family:var(--f-display);font-size:1.25rem;display:block}.r3d-enter span{opacity:.85;font-size:.92rem}
.r3d-enter .i{font-size:2.2rem}
`;
document.head.appendChild(css);

const root = document.createElement("div"); root.id = "r3d"; root.hidden = true;
root.innerHTML = `<canvas class="r3d-c" aria-label="3D-Raum"></canvas><div class="r3d-fade"></div><div class="r3d-load"></div>
  <div class="r3d-top"><div class="r3d-where"><small id="r3dk"></small><b id="r3dt"></b></div>
    <div class="r3d-btns"><button class="r3d-btn" id="r3dhall">🏛 Halle</button><button class="r3d-btn" id="r3dwelt">Welt</button>
    <button class="r3d-btn" id="r3dton">♪ Ton</button><button class="r3d-btn" id="r3d2d">2D-Ansicht</button></div></div>
  <div class="r3d-tip"></div><canvas class="r3d-map" width="264" height="352" title="Karte: Station, Tür oder Exponat anklicken – du gehst direkt dorthin"></canvas>
  <div class="r3d-hint">Klicken: dorthin gehen · Ziehen: umsehen · Türen, Stationen und Karte anklicken</div><div class="r3d-panel" hidden></div>`;
document.body.appendChild(root);
const cv = root.querySelector(".r3d-c"), fade = root.querySelector(".r3d-fade"), tip = root.querySelector(".r3d-tip"), panel = root.querySelector(".r3d-panel");
const mapC = root.querySelector(".r3d-map"), mapX = mapC.getContext("2d"), hint = root.querySelector(".r3d-hint"), loadEl = root.querySelector(".r3d-load");

/* ---------- Renderer ---------- */
let renderer;
try {
  renderer = new T3.WebGLRenderer({canvas: cv, antialias: true, powerPreference: "high-performance"});
} catch (e) { console.warn("WebGL nicht verfügbar", e); return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = T3.SRGBColorSpace;
renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFSoftShadowMap;
const camera = new T3.PerspectiveCamera(68, 1, 0.05, 120); camera.rotation.order = "YXZ";
let scene = null, cur = null;   // cur = aktueller Raum {key, ctx, …}
function resize(){ const w = root.clientWidth || innerWidth, h = root.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", () => { if (!root.hidden) resize(); });

/* ---------- Spieler ---------- */
const P = {x: 0, z: 9, yaw: 0, pitch: -0.04, tx: null, tz: null, onArrive: null, faceYaw: null, bob: 0, keys: {}};
const fwd = () => new T3.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
const angTo = (dx, dz) => Math.atan2(-dx, -dz);
const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

/* ---------- Hilfen für Texturen ---------- */
const texCache = new Map();
function canvasTex(w, h, draw, key, repeat){
  if (key && texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h);
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  if (key) texCache.set(key, t); return t;
}
function wrapText(g, text, maxW){ const words = String(text).split(/\s+/), lines = []; let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (g.measureText(t.replace(/[\u0001\u0002]/g, "")).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines; }
const plainT = s => String(s ?? "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/_\{([^{}]+)\}/g, "$1").replace(/\^\{2\}/g, "²").replace(/\^\{3\}/g, "³").replace(/\^\{([^{}]+)\}/g, "^$1");
// Formeltext für Tafeln: wie plainT, aber _{…} bleibt markiert (\u0001…\u0002) und wird von fillRich tiefgestellt gezeichnet
const richT = s => String(s ?? "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/_\{([^{}]+)\}/g, "\u0001$1\u0002").replace(/\^\{2\}/g, "²").replace(/\^\{3\}/g, "³").replace(/\^\{([^{}]+)\}/g, "^$1");
function fillRich(g, s, x, y){
  if (!/[\u0001\u0002]/.test(s)) { g.fillText(s, x, y); return; }
  const font = g.font, m = font.match(/([\d.]+)px/), px = m ? +m[1] : 20, small = font.replace(/([\d.]+)px/, (px * .7).toFixed(1) + "px"), segs = [];
  let sub = false; for (const p of s.split(/([\u0001\u0002])/)) { if (p === "\u0001") sub = true; else if (p === "\u0002") sub = false; else if (p) segs.push([p, sub]); }
  const wd = ([t, sb]) => { g.font = sb ? small : font; return g.measureText(t).width; }, tot = segs.reduce((a, q) => a + wd(q), 0), al = g.textAlign, bl = g.textBaseline;
  let cx = al === "center" ? x - tot / 2 : (al === "right" || al === "end") ? x - tot : x; const dy = px * (bl === "top" ? .45 : bl === "middle" ? .3 : .2);
  g.textAlign = "left"; for (const q of segs) { const w = wd(q); g.fillText(q[0], cx, y + (q[1] ? dy : 0)); cx += w; } g.font = font; g.textAlign = al;
}
function seeded(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// Zahl und Einheit nicht am Zeilenende trennen („10 | kg“): geschütztes Leerzeichen nur vor Einheiten, nicht vor beliebigen Wörtern
const NBU = /(\d) (?=(?:°C|mm|cm|dm|km|kg|mg|min|kN|mV|kV|mA|kΩ|kWh|kW|Wh|Hz|dpt|Uhr|[mgtshNVAΩWJ°%])(?![A-Za-zÄÖÜäöüß]))/g;
const nbU = s => String(s ?? "").replace(NBU, "$1 ");
R3D.util = {nbU, canvasTex: (...a) => canvasTex(...a), wrapText, plainT, richT, fillRich, seeded, glowTex: () => glowTex(), textPlane: (s, o, k) => textPlane(s, o, k),
  scaleUV(geo, sx, sy){ const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); uv.needsUpdate = true; return geo; }};

/* ---------- Raum-Kontext (Schnittstelle für Weltstile und Räume) ---------- */
// Belegte Quader für die Ausstattung: alles, was nach der Raumhülle in den Raum kam (Türen, Stationen, Exponate, Tafeln, Lernstationen),
// die Hindernisse, die Wege vor Türen und Stationen, die Standpunkte der Exponate und der Mittelgang am Boden (bis 3,2 m frei)
function occupancy(ctx){
  if (ctx._occ) return ctx._occ;
  const occ = ctx._occ = [], B = ctx.bounds, bb = new T3.Box3(), H = ctx.height || 7, add = (x0, x1, y0, y1, z0, z1) => occ.push({x0, x1, y0, y1, z0, z1});
  ctx.group.updateMatrixWorld(true);
  for (const o of ctx.group.children.slice(ctx._shellEnd || 0)) {
    if (o.isLight || o.isSprite || o.isPoints || o.isLine || o.userData.noOcc) continue;
    bb.setFromObject(o); if (!bb.isEmpty()) add(bb.min.x, bb.max.x, bb.min.y, bb.max.y, bb.min.z, bb.max.z);
  }
  const p = new T3.Vector3();
  for (const o of ctx._inter) { const ia = o.userData.ia; if (!ia) continue; o.getWorldPosition(p); const x = p.x, z = p.z;
    if (ia.kind === "door") add(x - 2.3, x + 2.3, 0, Math.min(H, 6.2), z - 2.4, z + 2.4);
    else if (ia.kind === "station") { const s = x < 0 ? 1 : -1; add(Math.min(x, x + s * 2.8) - .9, Math.max(x, x + s * 2.8) + .9, 0, 3.2, z - 1.3, z + 1.3); }
    if (ia.stand) add(ia.stand.x - .7, ia.stand.x + .7, 0, 2.2, ia.stand.z - .7, ia.stand.z + .7);
  }
  for (const o of ctx._obst) o.r != null ? add(o.x - o.r, o.x + o.r, 0, 3, o.z - o.r, o.z + o.r) : add(o.x - o.w / 2, o.x + o.w / 2, 0, 3, o.z - o.d / 2, o.z + o.d / 2);
  add(-1.6, 1.6, 0, 3.2, B.z1, B.z0);
  return occ;
}
function makeCtx(key, world, bounds){
  const kit = R3D.kits[world] || R3D.kits.zauber, group = new T3.Group(), ticks = [], inter = [], obst = [], lights = [];
  const topic = TMAP[key] || null, idx = TOPICS.findIndex(t => t.id === key);
  const W = window.WELTEN_API;
  const ctx = {
    T: T3, THREE: T3, world, key, kit, group, topic, index: idx, bounds, slots: SLOTS, stations: STATIONS, eye: EYE,
    room: idx >= 0 && W ? W.roomOf(idx) : {n: "", f: ""}, pal: kit.pal, rand: seeded(key.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7)),
    add(obj, x = 0, y = 0, z = 0){ obj.position.set(x, y, z); group.add(obj); return obj; },
    mat: (kind, opts) => kit.mat(kind, opts || {}),
    mesh(geo, mat, cast = true){ const m = new T3.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; },
    box(w, h, d, mat){ return ctx.mesh(new T3.BoxGeometry(w, h, d), mat); },
    cyl(rt, rb, h, mat, seg = 24){ return ctx.mesh(new T3.CylinderGeometry(rt, rb, h, seg), mat); },
    sphere(r, mat, seg = 24){ return ctx.mesh(new T3.SphereGeometry(r, seg, Math.max(8, seg * 0.75 | 0)), mat); },
    tube(points, r, mat, closed = false){ const curve = new T3.CatmullRomCurve3(points.map(p => p.isVector3 ? p : new T3.Vector3(...p)), closed, "catmullrom", 0.0);
      const m = ctx.mesh(new T3.TubeGeometry(curve, Math.max(24, points.length * 12), r, 10, closed), mat); m.userData.curve = curve; group.add(m); return m; },
    path(points, closed = false){ return new T3.CatmullRomCurve3(points.map(p => p.isVector3 ? p : new T3.Vector3(...p)), closed, "catmullrom", 0.0); },
    tick(fn){ ticks.push(fn); return fn; },
    obstacle(x, z, r){ obst.push({x, z, r}); },
    obstacleBox(x, z, w, d){ obst.push({x, z, w, d}); },
    light(color, intensity, distance, x, y, z){
      if (lights.length >= 4) { console.warn("R3D: höchstens 4 Zusatzlichter je Raum"); return null; }
      const l = new T3.PointLight(color, intensity, distance, 2); l.position.set(x, y, z); group.add(l); lights.push(l); return l; },
    glow(color, size){ const s = new T3.Sprite(new T3.SpriteMaterial({map: glowTex(), color, transparent: true, blending: T3.AdditiveBlending, depthWrite: false}));
      s.scale.set(size, size, 1); return s; },
    text(str, o = {}){ return textPlane(str, o, kit); },
    board(title, lines, o = {}){ return kit.board(ctx, title, lines, o); },
    wallBoard(side, along, y, w, h, title, lines, o = {}){
      // Seitentafeln mit Unterkante ≥ 2,75 m, damit die schwebenden Stationsschilder davor sie nicht verdecken
      if ((side === "left" || side === "right") && !o.free) y = Math.max(y, 2.75 + h / 2);
      const b = kit.board(ctx, title, lines, Object.assign({w, h}, o)), B = bounds, off = 0.06;
      if (side === "left") { b.position.set(B.x0 + off, y, along); b.rotation.y = Math.PI / 2; }
      else if (side === "right") { b.position.set(B.x1 - off, y, along); b.rotation.y = -Math.PI / 2; }
      else if (side === "front") { b.position.set(along, y, B.z1 + off); }
      else { b.position.set(along, y, B.z0 - off); b.rotation.y = Math.PI; }
      group.add(b); return b; },
    arrow(from, to, color, thick = 0.05){ return makeArrow(ctx, from, to, color, thick); },
    flow(curve, o = {}){ return makeFlow(ctx, curve, o); },
    beam(points, color, width = 0.03){ return makeBeam(ctx, points, color, width); },
    // Ausstattung: frei(box) prüft einen Quader {x0, x1, y0, y1, z0, z1} gegen alles Belegte (+ Rand), belege(box) reserviert ihn,
    // wand(seite, entlang, y0, y1, breite, tiefe) liefert den Quader eines Teils an der Wand ("left" | "right" | "front" | "back")
    frei(b, rand = .08){ const B = bounds, o = occupancy(ctx);
      if (b.x0 < B.x0 - .02 || b.x1 > B.x1 + .02 || b.z0 < B.z1 - .02 || b.z1 > B.z0 + .02 || b.y1 > (ctx.height || 7) + .02) return false;
      return !o.some(q => b.x0 < q.x1 + rand && b.x1 > q.x0 - rand && b.y0 < q.y1 + rand && b.y1 > q.y0 - rand && b.z0 < q.z1 + rand && b.z1 > q.z0 - rand); },
    belege(b){ occupancy(ctx).push(b); return b; },
    wand(seite, entlang, y0, y1, breite, tiefe){ const B = bounds, h = breite / 2;
      return seite === "left" ? {x0: B.x0, x1: B.x0 + tiefe, y0, y1, z0: entlang - h, z1: entlang + h} : seite === "right" ? {x0: B.x1 - tiefe, x1: B.x1, y0, y1, z0: entlang - h, z1: entlang + h}
        : seite === "front" ? {x0: entlang - h, x1: entlang + h, y0, y1, z0: B.z1, z1: B.z1 + tiefe} : {x0: entlang - h, x1: entlang + h, y0, y1, z0: B.z0 - tiefe, z1: B.z0}; },
    exhibit(obj, o){ o.kind = "exhibit"; o.obj = obj; o._key = o.title; obj.userData.ia = o; inter.push(obj); return obj; },   // o bleibt erhalten (Getter für wechselnde Texte)
    _ticks: ticks, _inter: inter, _obst: obst, _lights: lights
  };
  for (const f of R3D.hooks.ctxExt) { try { f(ctx); } catch (e) { console.error("R3D ctxExt", e); } }
  return ctx;
}
let _glowTex = null;
function glowTex(){ return _glowTex || (_glowTex = canvasTex(128, 128, (g, w) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.25, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); })); }
function textPlane(str, o, kit){
  const size = o.size || 0.25, font = o.font || kit.font, color = o.color || "#ffffff", bg = o.bg || null, weight = o.weight || "700";
  const lines = String(str).split("\n"), px = 96, c = document.createElement("canvas"), g = c.getContext("2d");
  g.font = `${weight} ${px}px ${font}`; const tw = Math.max(...lines.map(l => g.measureText(l).width)) + px * 0.5;
  c.width = Math.min(2048, Math.ceil(tw)); c.height = Math.ceil(px * 1.25 * lines.length + px * 0.3);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
  g.font = `${weight} ${px}px ${font}`; g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((l, i) => g.fillText(l, c.width / 2, px * 0.65 + i * px * 1.25 + px * 0.05));
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8;
  const h = size * lines.length * 1.25 + size * 0.3, w = h * c.width / c.height;
  const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({map: t, transparent: !bg, depthWrite: !!bg, side: T3.DoubleSide, toneMapped: false}));
  m.userData.w = w; m.userData.h = h; return m;
}
function makeArrow(ctx, from, to, color, thick){
  const g = new T3.Group(), mat = new T3.MeshStandardMaterial({color, emissive: color, emissiveIntensity: 0.55, roughness: 0.4});
  const shaft = new T3.Mesh(new T3.CylinderGeometry(thick, thick, 1, 12), mat), head = new T3.Mesh(new T3.ConeGeometry(thick * 2.6, 1, 16), mat);
  g.add(shaft, head); const up = new T3.Vector3(0, 1, 0);
  g.set = (a, b) => { a = a.isVector3 ? a : new T3.Vector3(...a); b = b.isVector3 ? b : new T3.Vector3(...b);
    const d = b.clone().sub(a), L = d.length(); g.visible = L > 0.01; if (!g.visible) return;
    const hl = Math.min(L * 0.35, thick * 7); shaft.scale.set(1, Math.max(0.001, L - hl), 1); shaft.position.set(0, (L - hl) / 2, 0);
    head.scale.set(1, hl, 1); head.position.set(0, L - hl / 2, 0);
    g.position.copy(a); g.quaternion.setFromUnitVectors(up, d.normalize()); };
  g.set(from, to); ctx.group.add(g); return g;
}
function makeFlow(ctx, curve, o){
  const n = o.count || 24, geo = new T3.SphereGeometry(o.size || 0.045, 10, 8);
  const mat = new T3.MeshStandardMaterial({color: o.color || 0x66ccff, emissive: o.color || 0x66ccff, emissiveIntensity: 1.2, roughness: 0.3});
  const inst = new T3.InstancedMesh(geo, mat, n); inst.castShadow = false; const m = new T3.Matrix4(), p = new T3.Vector3();
  const ctl = {speed: o.speed ?? 0.08, on: o.on ?? true, phase: 0, mesh: inst, dir: 1};
  ctx.group.add(inst);
  ctx.tick(dt => { inst.visible = ctl.on; if (!ctl.on) return; ctl.phase = (ctl.phase + dt * ctl.speed * ctl.dir + 1) % 1;
    for (let i = 0; i < n; i++) { curve.getPointAt((i / n + ctl.phase) % 1, p); m.makeTranslation(p.x, p.y, p.z); inst.setMatrixAt(i, m); }
    inst.instanceMatrix.needsUpdate = true; });
  return ctl;
}
function makeBeam(ctx, points, color, width){
  const g = new T3.Group(), mat = new T3.MeshBasicMaterial({color, transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false});
  const halo = new T3.MeshBasicMaterial({color, transparent: true, opacity: 0.18, blending: T3.AdditiveBlending, depthWrite: false, toneMapped: false});
  const up = new T3.Vector3(0, 1, 0);
  g.set = pts => { while (g.children.length) { const c = g.children.pop(); c.geometry.dispose(); }
    pts = pts.map(p => p.isVector3 ? p : new T3.Vector3(...p));
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], d = b.clone().sub(a), L = d.length(); if (L < 1e-4) continue;
      for (const [r, mm] of [[width, mat], [width * 3.2, halo]]) { const c = new T3.Mesh(new T3.CylinderGeometry(r, r, L, 10, 1, true), mm);
        c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(up, d.clone().normalize()); g.add(c); } } };
  g.set(points); ctx.group.add(g); return g;
}

/* ---------- Räume auf- und abbauen ---------- */
function dispose(o){ o.traverse(n => { if (n.isInstancedMesh) n.dispose(); if (n.geometry) n.geometry.dispose(); if (n.isLight && n.shadow) n.shadow.dispose();   // Schattenkarte (2048²) sonst bei jedem Raumwechsel verloren
  const ms = Array.isArray(n.material) ? n.material : n.material ? [n.material] : [];
  ms.forEach(m => { if (!m.userData.keep) { for (const k in m) { const v = m[k]; if (v && v.isTexture && !v.userData.keep && ![...texCache.values()].includes(v)) v.dispose(); } m.dispose(); } }); }); }
const W3 = () => (window.WELTEN_API && window.WELTEN_API.id) || "zauber";
function build(key){
  const world = W3(), kit = R3D.kits[world] || R3D.kits.zauber;
  const isHall = key === "halle";
  const bounds = isHall ? {x0: -HALL.w / 2, x1: HALL.w / 2, z0: HALL.z0, z1: HALL.z1} : {x0: -ROOM.w / 2, x1: ROOM.w / 2, z0: ROOM.d / 2, z1: -ROOM.d / 2};
  const ctx = makeCtx(key, world, bounds);
  const sc = new T3.Scene(); sc.add(ctx.group);
  kit.env(ctx, sc);
  ctx.height = kit.shell(ctx, {hall: isHall}); ctx._shellEnd = ctx.group.children.length;   // alles danach zählt für die Ausstattung als belegt
  const doors = [];
  const addDoor = (to, label, sub, x, z, rotY) => { const d = kit.door(ctx, {label, sub}); d.group.position.set(x, 0, z); d.group.rotation.y = rotY; ctx.group.add(d.group);
    const ia = {kind: "door", to, label, sub, door: d, obj: d.group}; d.group.userData.ia = ia; ctx._inter.push(d.group); doors.push(ia); return ia; };
  if (isHall) {
    const W = window.WELTEN_API;
    TOPICS.forEach((t, i) => { const [x, z] = HALL_DOORS[i] || [0, 0], r = W ? W.roomOf(i) : {n: t.title};
      const ia = addDoor(t.id, r.n, `${W ? W.word : "Raum"} ${i + 1} · ${SHORT[t.id]}`, x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2); ia.topic = t.id; });
    addDoor("pruefung", W ? W.finalName : "Prüfungssaal", `Schulaufgabe · alle ${TOPICS.length} Räume`, 0, HALL.z1, 0);
    (R3D.hall || (() => {}))(ctx);
  } else {
    const i = ctx.index, prev = TOPICS[i - 1], next = TOPICS[i + 1], W = window.WELTEN_API;
    addDoor(prev ? prev.id : "halle", prev ? (W ? W.roomOf(i - 1).n : prev.title) : (W ? W.hallName : "Halle"), prev ? `zurück · ${SHORT[prev.id]}` : "zurück zum Anfang", 0, bounds.z0, Math.PI);
    addDoor(next ? next.id : "pruefung", next ? (W ? W.roomOf(i + 1).n : next.title) : (W ? W.finalName : "Prüfungssaal"), next ? `weiter · ${SHORT[next.id]}` : "Schulaufgabe", 0, bounds.z1, 0);
    STATIONS.forEach(([x, z], j) => { const s = kit.station(ctx, j, STAGES[j].n); s.position.set(x, 0, z); s.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; ctx.group.add(s);
      s.userData.ia = {kind: "station", stage: j, label: STAGES[j].n, sub: `Station ${j + 1} von 4`, obj: s}; ctx._inter.push(s); ctx.obstacle(x, z, 0.85); });
    const fn = R3D.rooms[key];
    try { if (fn) fn(ctx); else kit.placeholder && kit.placeholder(ctx); } catch (e) { console.error("R3D Raum", key, e); }
  }
  (kit.ambient || (() => {}))(ctx, sc);
  const room = {key, ctx, scene: sc, doors, isHall, bounds};
  for (const f of R3D.hooks.afterBuild) { try { f(room); } catch (e) { console.error("R3D afterBuild", e); } }
  // Ausstattung des Weltstils (Regale, Bilder, Vorhänge, Schwebendes …) kommt zuletzt und nimmt nur Plätze, die ctx.frei() meldet
  if (kit.decor) { try { kit.decor(ctx, {hall: isHall}); } catch (e) { console.error("R3D Ausstattung", e); } }
  // Immer gleich viele Punktlichter (die des Weltstils + 4): Die Zahl der Lichter steckt in jedem Shader-Programm. Sind es überall gleich viele,
  // passen die einmal übersetzten Programme für alle Räume einer Welt, und ein Raumwechsel muss kaum etwas neu übersetzen.
  for (let i = ctx._lights.length; i < 4; i++) { const l = new T3.PointLight(0x000000, 0, 0.01); l.position.set(0, -30, 0); l.castShadow = false; sc.add(l); }
  sc.updateMatrixWorld(true);
  return room;
}

/* ---------- Bewegung ---------- */
function blocked(x, z){
  const B = cur.bounds, m = RADIUS + 0.15;
  if (x < B.x0 + m || x > B.x1 - m || z > B.z0 - m || z < B.z1 + m) return true;
  for (const o of cur.ctx._obst) {
    if (o.r != null) { const dx = x - o.x, dz = z - o.z; if (dx * dx + dz * dz < (o.r + RADIUS) ** 2) return true; }
    else if (Math.abs(x - o.x) < o.w / 2 + RADIUS && Math.abs(z - o.z) < o.d / 2 + RADIUS) return true;
  }
  return false;
}
// Wegsuche um Hindernisse: A* auf einem 0,25-m-Raster über blocked(), danach Wegpunkte mit freier Sichtlinie zusammengefasst
function clearLine(x0, z0, x1, z1){ const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.08);
  for (let i = 1; i <= n; i++) { const s = i / n; if (blocked(x0 + (x1 - x0) * s, z0 + (z1 - z0) * s)) return false; } return true; }
function findPath(x0, z0, x1, z1){
  const B = cur.bounds, G = 0.25, nx = Math.floor((B.x1 - B.x0) / G) + 1, nz = Math.floor((B.z0 - B.z1) / G) + 1, N = nx * nz;
  const X = k => B.x0 + (k % nx) * G, Z = k => B.z1 + ((k / nx) | 0) * G, free = new Uint8Array(N);
  for (let k = 0; k < N; k++) free[k] = blocked(X(k), Z(k)) ? 0 : 1;
  const near = (x, z) => { const ci = Math.round((x - B.x0) / G), cj = Math.round((z - B.z1) / G); let best = -1, bd = 1e9;
    for (let r = 0; r < 6 && best < 0; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
      if (i < 0 || j < 0 || i >= nx || j >= nz || !free[j * nx + i]) continue; const k = j * nx + i, d = Math.hypot(X(k) - x, Z(k) - z); if (d < bd) { bd = d; best = k; } }
    return best; };
  const s = near(x0, z0), t = near(x1, z1); if (s < 0 || t < 0) return null;
  const g = new Float32Array(N).fill(Infinity), f = new Float32Array(N), from = new Int32Array(N).fill(-1), done = new Uint8Array(N), heap = [];
  const push = k => { heap.push(k); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (f[heap[p]] <= f[k]) break; heap[i] = heap[p]; i = p; } heap[i] = k; };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i;
      const fm = () => m === i ? f[last] : f[heap[m]]; if (l < heap.length && f[heap[l]] < fm()) m = l; if (r < heap.length && f[heap[r]] < fm()) m = r;
      if (m === i) break; heap[i] = heap[m]; i = m; } heap[i] = last; } return top; };
  const h = k => Math.hypot(X(k) - X(t), Z(k) - Z(t));
  g[s] = 0; f[s] = h(s); push(s);
  while (heap.length) { const c = pop(); if (c === t) break; if (done[c]) continue; done[c] = 1; const ci = c % nx, cj = (c / nx) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= nx || j >= nz) continue; const k = j * nx + i; if (!free[k] || done[k]) continue;
      if (di && dj && (!free[cj * nx + i] || !free[j * nx + ci])) continue;                 // keine Ecken abschneiden
      const ng = g[c] + (di && dj ? Math.SQRT2 : 1) * G; if (ng < g[k]) { g[k] = ng; f[k] = ng + h(k); from[k] = c; push(k); } } }
  if (t !== s && from[t] < 0) return null;
  const cells = []; for (let k = t; k >= 0; k = k === s ? -1 : from[k]) cells.push([X(k), Z(k)]); cells.reverse();
  const pts = [[x0, z0], ...cells.slice(1, -1), [x1, z1]], out = []; let a = 0;
  while (a < pts.length - 1) { let b = pts.length - 1; while (b > a + 1 && !clearLine(pts[a][0], pts[a][1], pts[b][0], pts[b][1])) b--; out.push(pts[b]); a = b; }
  return out;   // Wegpunkte ohne Startpunkt, der letzte ist das Ziel
}
function walkTo(x, z, onArrive, faceYaw){
  P.onArrive = onArrive || null; P.faceYaw = faceYaw ?? null; P.stuck = 0;
  const way = cur && !blocked(x, z) && !clearLine(P.x, P.z, x, z) ? findPath(P.x, P.z, x, z) : null;
  P.path = way && way.length ? way : [[x, z]]; [P.tx, P.tz] = P.path.shift(); }
function approach(obj, dist = 2.0){
  const b = new T3.Box3().setFromObject(obj), c = b.getCenter(new T3.Vector3());
  let dx = P.x - c.x, dz = P.z - c.z, L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  // Standpunkt vor dem Objekt, frei von Hindernissen
  const rad = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2;
  for (let k = 0; k < 24; k++) { const a = Math.atan2(dz, dx) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.26, d = Math.max(dist, rad + 0.9);
    const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d; if (!blocked(x, z)) return {x, z, yaw: angTo(c.x - x, c.z - z), c}; }
  return {x: P.x, z: P.z, yaw: angTo(c.x - P.x, c.z - P.z), c};
}
let lastT = 0, clock = 0, running = false, rafId = 0;
// Bildschleife starten – eine alte, noch ausstehende Schleife (z. B. nach verborgenem Tab) wird vorher verworfen, damit nie zwei laufen
function startLoop(){ cancelAnimationFrame(rafId); running = true; lastT = 0; rafId = requestAnimationFrame(loop); }
function step(dt){
  // Tastatur
  const k = P.keys, turn = (k.ArrowLeft || k.a ? 1 : 0) - (k.ArrowRight || k.d ? 1 : 0), mv = (k.ArrowUp || k.w ? 1 : 0) - (k.ArrowDown || k.s ? 1 : 0);
  if (turn) P.yaw += turn * dt * 1.8;
  if (mv) { P.tx = null; P.path = null; const f = fwd(), nx = P.x + f.x * mv * SPEED * dt, nz = P.z + f.z * mv * SPEED * dt;
    if (!blocked(nx, P.z)) P.x = nx; if (!blocked(P.x, nz)) P.z = nz; P.bob += dt * 9; }
  // Klick-Ziel
  if (P.tx != null) {
    const dx = P.tx - P.x, dz = P.tz - P.z, L = Math.hypot(dx, dz), last = !P.path || !P.path.length;
    if (L < (last ? 0.06 : 0.22)) { if (!last) [P.tx, P.tz] = P.path.shift(); else { P.tx = null; const cb = P.onArrive; P.onArrive = null; if (cb) cb(); } }
    else { const s = Math.min(L, SPEED * dt * Math.min(1, 0.35 + (last ? L : 1))), nx = P.x + dx / L * s, nz = P.z + dz / L * s, ox = P.x, oz = P.z;
      const want = angTo(dx, dz); if (!dragging) P.yaw += wrapA(want - P.yaw) * Math.min(1, dt * 4.5);
      if (!blocked(nx, nz)) { P.x = nx; P.z = nz; } else if (!blocked(nx, P.z)) P.x = nx; else if (!blocked(P.x, nz)) P.z = nz;
      // Stillstand (z. B. frontal vor einem Hindernis): nach 0,3 s Weg um das Hindernis neu suchen, sonst anhalten
      P.stuck = Math.hypot(P.x - ox, P.z - oz) < 0.6 * dt ? (P.stuck || 0) + dt : 0;
      if (P.stuck > 0.3) { P.stuck = 0; const goal = last ? [P.tx, P.tz] : P.path[P.path.length - 1];
        const way = !blocked(goal[0], goal[1]) ? findPath(P.x, P.z, goal[0], goal[1]) : null;
        if (way && way.length && Math.hypot(way[0][0] - P.tx, way[0][1] - P.tz) > 0.05) { P.path = way; [P.tx, P.tz] = P.path.shift(); }
        else { const cb = P.onArrive, near = Math.hypot(goal[0] - P.x, goal[1] - P.z) < 2.5; P.tx = null; P.path = null; P.onArrive = null; if (cb && near) cb(); } }   // kurz vor dem Ziel festgehangen: trotzdem auslösen (Tür, Infotafel)
      P.bob += dt * 9; }
  } else if (P.faceYaw != null) { const d = wrapA(P.faceYaw - P.yaw); P.yaw += d * Math.min(1, dt * 5); if (Math.abs(d) < 0.01) P.faceYaw = null; }
  camera.position.set(P.x, EYE + (REDUCED3 ? 0 : Math.sin(P.bob) * 0.025), P.z); camera.rotation.set(P.pitch, P.yaw, 0);
}
function loop(now){
  if (!running) return;
  rafId = requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now; clock += dt;
  if (!cur) return;
  step(dt);
  for (const f of cur.ctx._ticks) { try { f(dt, clock); } catch (e) { console.error(e); cur.ctx._ticks.splice(cur.ctx._ticks.indexOf(f), 1); } }
  for (const d of cur.doors) d.door.update && d.door.update(dt);
  renderer.render(cur.scene, camera);
  if (marker) marker.material.opacity = Math.max(0, marker.material.opacity - dt * 1.5);
  drawMap(); placeTip();
}

/* ---------- Zeigen und Klicken ---------- */
const ray = new T3.Raycaster(), ndc = new T3.Vector2();
let dragging = false, down = null, hover = null, marker = null;
// Leuchtpunkte, Partikel, Linien, additive Lichtkegel und fast unsichtbares Glas fangen keine Klicks ab (sonst verdecken sie, was dahinter steht)
const noPick = o => o.isSprite || o.isPoints || o.isLine || o.userData.noPick || (o.material && !Array.isArray(o.material) && (o.material.blending === T3.AdditiveBlending || (o.material.transparent && o.material.depthWrite === false && o.material.opacity < .2)));
function pick(ev){
  const r = cv.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera); ray.far = 40;
  const hits = ray.intersectObjects([cur.ctx.floor, ...cur.ctx._inter], true);
  for (const h of hits) { let o = h.object; if (noPick(o)) continue; while (o && !o.userData.ia && o !== cur.ctx.floor) o = o.parent;
    if (o === cur.ctx.floor) return {floor: h.point}; if (o && o.userData.ia) return {ia: o.userData.ia, point: h.point}; }
  return null;
}
cv.addEventListener("pointerdown", ev => { down = {x: ev.clientX, y: ev.clientY, yaw: P.yaw, pitch: P.pitch}; dragging = false; cv.setPointerCapture(ev.pointerId); });
cv.addEventListener("pointermove", ev => {
  if (down) { const dx = ev.clientX - down.x, dy = ev.clientY - down.y;
    if (!dragging && Math.hypot(dx, dy) > 6) { dragging = true; cv.classList.add("drag"); P.faceYaw = null; }
    if (dragging) { P.yaw = down.yaw + dx * 0.0042; P.pitch = Math.max(-0.75, Math.min(0.6, down.pitch + dy * 0.0035)); return; } }
  if (!cur) return; const h = pick(ev); hover = h && h.ia ? h.ia : null; cv.classList.toggle("ptr", !!hover);
});
cv.addEventListener("pointerup", ev => {
  const wasDrag = dragging; dragging = false; down = null; cv.classList.remove("drag"); if (wasDrag || !cur || busy) return;
  const h = pick(ev); if (!h) return; hidePanel();
  if (h.ia) return activate(h.ia);
  const p = h.floor; let x = p.x, z = p.z;
  if (blocked(x, z)) { const dx = x - P.x, dz = z - P.z, L = Math.hypot(dx, dz); for (let s = 1; s > 0; s -= 0.05) { const xx = P.x + dx * s, zz = P.z + dz * s; if (!blocked(xx, zz)) { x = xx; z = zz; break; } } }
  walkTo(x, z); showMarker(x, z); hint.style.opacity = 0;
});
cv.addEventListener("pointerleave", () => { hover = null; });
addEventListener("keydown", ev => { if (root.hidden || /INPUT|TEXTAREA/.test((ev.target || {}).tagName || "")) return; const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(k)) { P.keys[k] = true; ev.preventDefault(); hint.style.opacity = 0; }
  if (k === "Escape") hidePanel(); });
addEventListener("keyup", ev => { const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key; delete P.keys[k]; });
addEventListener("blur", () => { P.keys = {}; });
function showMarker(x, z){
  if (!marker) { marker = new T3.Mesh(new T3.RingGeometry(0.22, 0.3, 32), new T3.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, depthWrite: false})); marker.rotation.x = -Math.PI / 2; }
  if (marker.parent !== cur.scene) cur.scene.add(marker);
  marker.material.color.set(cur.ctx.pal.accent); marker.position.set(x, 0.02, z); marker.material.opacity = 0.9;
}
const tv = new T3.Vector3();
function placeTip(){
  if (!hover || !hover.obj) { tip.classList.remove("on"); return; }
  camera.updateMatrixWorld(); const b = new T3.Box3().setFromObject(hover.obj); tv.set((b.min.x + b.max.x) / 2, b.max.y + 0.15, (b.min.z + b.max.z) / 2).project(camera);
  if (tv.z > 1) { tip.classList.remove("on"); return; }
  tip.style.left = ((tv.x + 1) / 2 * root.clientWidth) + "px"; tip.style.top = ((1 - tv.y) / 2 * root.clientHeight) + "px";
  const html = `${esc(hover.label || hover.title || "")}${hover.sub ? `<small>${esc(hover.sub)}</small>` : ""}`;
  if (tip.innerHTML !== html) tip.innerHTML = html; tip.classList.add("on");
}

/* ---------- Aktionen ---------- */
let busy = false;
let lastIa = null;   // zuletzt ausgelöstes Ziel (für Bedientests)
function activate(ia){
  lastIa = ia;
  if (ia.kind === "door") {
    const pass = () => { const a = approachDoor(ia); walkTo(a.x, a.z, () => openDoor(ia), a.yaw); };
    if (R3D.gate) { let locked = false; try { locked = R3D.gate(ia, pass); } catch (e) { console.error("R3D gate", e); } if (locked) return; }
    pass(); return; }
  const a = ia.stand ? (() => { const c = new T3.Box3().setFromObject(ia.obj).getCenter(new T3.Vector3()); return {x: ia.stand.x, z: ia.stand.z, yaw: angTo(c.x - ia.stand.x, c.z - ia.stand.z)}; })()
    : approach(ia.obj, ia.kind === "station" ? 1.7 : (ia.dist || 2.1));
  walkTo(a.x, a.z, () => { P.faceYaw = a.yaw; P.pitch = ia.pitch ?? -0.12;
    if (ia.kind === "station") { st.set(RKEY3, cur.key + ":" + ia.stage); stationPanel(ia.stage); }
    else { try { ia.onClick && ia.onClick(); } catch (e) { console.error(e); } if (ia.title || ia.text) infoPanel(ia); } });
}
function approachDoor(ia){ const g = ia.door.group, n = new T3.Vector3(0, 0, 1).applyQuaternion(g.quaternion);   // Türnormale zeigt in den Raum
  return {x: g.position.x + n.x * 1.4, z: g.position.z + n.z * 1.4, yaw: angTo(-n.x, -n.z)}; }
function openDoor(ia){
  busy = true; hidePanel(); ia.door.open && ia.door.open(); sfxDoor();
  const g = ia.door.group, n = new T3.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
  setTimeout(() => { walkTo(g.position.x - n.x * 0.2, g.position.z - n.z * 0.2); }, 450);
  setTimeout(() => { fade.style.opacity = 1; }, 700);
  setTimeout(() => { busy = false; if (ia.to === "pruefung") { leaveTo(() => { S.sel = TOPICS.map(t => t.id); save(); go2("exam"); }); return; }
    enter(ia.to, cur ? cur.key : (pend && pend.key) || "halle"); }, 1200);
}
function infoPanel(ia){
  panel.innerHTML = `<button class="r3d-x" aria-label="Schließen">✕</button><div class="eyebrow">${esc(ia.eyebrow || "Exponat")}</div><h3>${esc(ia.title || ia.label)}</h3>
    ${String(ia.text || "").split(/\n\n/).map(p => `<p>${fmt(nbU(p))}</p>`).join("")}${ia.extra || ""}`;
  panel.hidden = false; panel.querySelector(".r3d-x").onclick = hidePanel;
}
function hidePanel(){ panel.hidden = true; for (const f of R3D.hooks.onHidePanel) { try { f(); } catch (e) { console.error(e); } } }
function stationPanel(j){
  const t = cur.key, T = TMAP[t], I = stageInfo(t), x = I.s[j], g = STAGES[j];
  const B = (a, txt, ghost) => `<button class="btn ${ghost ? "ghost" : ""}" data-a="${a}">${esc(txt)}</button>`;
  const acts = [
    [T.cards.length ? B("cards", "Karteikarten lernen") : B("quiz", "Erste Quizfragen"), T.diagrams.length ? B("dgm", `Diagramme (${T.diagrams.length})`, 1) : ""],
    [T.quiz.length ? B("quiz", `Quiz: ${Math.min(10, T.quiz.length)} Fragen`) : "", (T.tables || []).length ? B("tabellen", FTX.tabellen, 1) : "", B("sprint", "Sprint", 1), B("ladder", "Wissensleiter", 1),
     T.pairs.length >= 4 ? B("pairs", "Zuordnen", 1) : "", T.sequences.length ? B("seq", "Reihenfolge", 1) : "", T.sorts.length ? B("sort", "Sortieren", 1) : ""],
    [T.exam.length ? B("open", `Offene Aufgaben (${T.exam.length})`) : "", CASE_TOPIC[t] ? B("cases", CT.title, 1) : "", (T.planner || []).length ? B("planer", FTX.planer, 1) : ""],
    [B("exam", "Themenprüfung · 15 min")]
  ][j].join("");
  panel.innerHTML = `<button class="r3d-x" aria-label="Schließen">✕</button><div class="eyebrow">Station ${j + 1} von 4 · ${esc(SHORT[t])}</div>
    <h3>${x.done ? "✓ " : ""}${esc(g.n)}</h3><p>${esc(g.why)}</p><div class="bar"><i style="width:${Math.round(100 * x.p)}%"></i></div><p class="note">${x.txt}</p>
    <div class="r3d-acts">${acts}</div>`;
  panel.hidden = false; panel.querySelector(".r3d-x").onclick = hidePanel;
  const T0 = T, deck = () => revDeck(T0.cards.map((c, i) => t + ":" + i));
  const A = {
    cards: () => fromTopic(t, () => { go2("cards"); runCards(deck()); }),
    dgm: () => fromTopic(t, () => { dgmFilter = t; go2("diagrams"); }),
    quiz: () => fromTopic(t, () => go2("quiz", shuffle(T0.quiz.map((q, i) => ({...q, t, i}))).slice(0, 10))),
    sprint: () => fromTopic(t, () => { go2("compete"); gSprint(); }), ladder: () => fromTopic(t, () => { go2("compete"); gLadder(); }),
    pairs: () => fromTopic(t, () => { go2("compete"); pzPairs(); }), seq: () => fromTopic(t, () => { go2("compete"); pzSeq(); }), sort: () => fromTopic(t, () => { go2("compete"); pzSort(); }),
    open: () => { RET = ["topic", t]; go2("openq", t); },
    tabellen: () => fromTopic(t, () => { go2("tabellen"); runTabellen(fRound("tb", fPool(TBL, t), 3)); }),
    planer: () => fromTopic(t, () => { go2("planer"); runPlaner(fRound("pl", fPool(PLN, t), 5)); }),
    cases: () => fromTopic(t, () => { const ks = Object.keys(CASE_AREAS).filter(k => CASE_AREAS[k].topic === t); caseArea = ks.length === 1 ? ks[0] : "all"; go2("cases"); }),
    exam: () => fromTopic(t, () => { go2("exam"); runExam({mc: 10, open: 1, min: 15, name: "Themenprüfung", topic: t}); })
  };
  panel.querySelectorAll("[data-a]").forEach(b => b.onclick = () => leaveTo(A[b.dataset.a]));
  for (const f of R3D.hooks.station || []) { try { f(panel, t, j); } catch (e) { console.error("R3D station", e); } }
}

/* ---------- Karte unten rechts (anklickbar: Station, Tür, Exponat oder freie Stelle) ---------- */
let mapT = null;
// Ziele auf der Karte: Türen, Stationen, Exponate mit Grundriss-Mittelpunkt (je Raum einmal berechnet)
function mapTargets(){
  if (cur._mapT) return cur._mapT; const c = new T3.Vector3();
  return cur._mapT = cur.ctx._inter.map(o => { const ia = o.userData.ia; if (ia.kind === "door") { const p = ia.door.group.position; return {ia, x: p.x, z: p.z}; }
    if (ia.kind === "station") { const [x, z] = STATIONS[ia.stage]; return {ia, x, z}; }
    new T3.Box3().setFromObject(o).getCenter(c); return {ia, x: c.x, z: c.z}; }); }
function drawMap(){
  const B = cur.bounds, w = mapC.width, h = mapC.height, pad = 22, sx = (w - 2 * pad) / (B.x1 - B.x0), sz = (h - 2 * pad) / (B.z0 - B.z1), s = Math.min(sx, sz);
  const ox = w / 2 - (B.x0 + B.x1) / 2 * s, oz = h / 2 - (B.z0 + B.z1) / 2 * s, X = x => ox + x * s, Z = z => oz + z * s; mapT = {ox, oz, s};
  const g = mapX, acc = cur.ctx.pal.accent; g.clearRect(0, 0, w, h);
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 3; g.strokeRect(X(B.x0), Z(B.z1), (B.x1 - B.x0) * s, (B.z0 - B.z1) * s);
  for (const t of mapTargets()) if (t.ia.kind === "exhibit") { g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.moveTo(X(t.x), Z(t.z) - 7); g.lineTo(X(t.x) + 7, Z(t.z)); g.lineTo(X(t.x), Z(t.z) + 7); g.lineTo(X(t.x) - 7, Z(t.z)); g.fill(); }
  for (const d of cur.doors) { const p = d.door.group.position; g.fillStyle = acc; g.fillRect(X(p.x) - 9, Z(p.z) - 9, 18, 18); }
  if (!cur.isHall) STATIONS.forEach(([x, z], j) => { g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(X(x), Z(z), 11, 0, 7); g.fill();
    g.fillStyle = "#111"; g.font = "bold 15px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(j + 1), X(x), Z(z) + 1); });
  g.save(); g.translate(X(P.x), Z(P.z)); g.rotate(-P.yaw); g.fillStyle = acc; g.strokeStyle = "#000"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -15); g.lineTo(10, 10); g.lineTo(0, 5); g.lineTo(-10, 10); g.closePath(); g.fill(); g.stroke(); g.restore();
}

mapC.addEventListener("click", ev => {
  if (!cur || busy || !mapT) return; const r = mapC.getBoundingClientRect();
  const x = ((ev.clientX - r.left) * mapC.width / r.width - mapT.ox) / mapT.s, z = ((ev.clientY - r.top) * mapC.height / r.height - mapT.oz) / mapT.s;
  // nächstes Ziel in Reichweite (Stationen und Türen großzügiger als Exponate)
  let best = null, bd = 1e9; for (const t of mapTargets()) { const d = Math.hypot(t.x - x, t.z - z) - (t.ia.kind === "exhibit" ? 0 : 0.5); if (d < bd) { bd = d; best = t; } }
  hidePanel(); hint.style.opacity = 0;
  if (best && bd < 1.3) return activate(best.ia);
  let gx = x, gz = z; if (blocked(gx, gz)) { let fd = 1e9; for (let k = 1; k <= 48; k++) { const a = k * 2.4, rr = 0.15 * Math.sqrt(k) * 2.2, xx = x + Math.cos(a) * rr, zz = z + Math.sin(a) * rr;
      if (!blocked(xx, zz) && rr < fd) { fd = rr; gx = xx; gz = zz; break; } } }
  if (blocked(gx, gz)) return; walkTo(gx, gz); showMarker(gx, gz);
});

/* ---------- Ton: Tür ---------- */
let actx = null;
function sfxDoor(){
  try { if (localStorage.getItem(PFX + "-sfx") === "0") return; actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(), f = actx.createBiquadFilter();
    const kind = W3(); o.type = kind === "sterne" ? "sawtooth" : "triangle"; f.type = "lowpass"; f.frequency.value = kind === "sterne" ? 900 : 500;
    o.frequency.setValueAtTime(kind === "sterne" ? 160 : 90, t); o.frequency.exponentialRampToValueAtTime(kind === "sterne" ? 60 : 140, t + 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(f).connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.75); } catch (e) {}
}

/* ---------- Betreten, Verlassen, Anzeigen ---------- */
function setTitle(){
  const W = window.WELTEN_API, i = cur.ctx.index;
  root.querySelector("#r3dk").textContent = cur.isHall ? (W ? W.name : "") : `${W ? W.word : "Raum"} ${i + 1} von ${TOPICS.length} · ${(W && W.kap[i]) || ""}`;
  root.querySelector("#r3dt").textContent = cur.isHall ? (W ? W.hallName : "Halle") : `${cur.ctx.room.n}`;
  root.querySelector("#r3dwelt").textContent = (W ? W.icon + " " : "") + "Welt";
}
let enterTok = 0, pend = null;   // pend = laufender Wechsel {key, from, opt}
function enter(key, from, opt = {}){
  key = key || "halle"; if (key !== "halle" && !TMAP[key]) key = "halle";
  fade.style.opacity = 1; hidePanel(); hover = null; tip.classList.remove("on");
  loadEl.textContent = ""; loadEl.style.opacity = 1;
  const tok = ++enterTok; pend = {key, from, opt};
  P.tx = null; P.path = null; P.onArrive = null; P.faceYaw = null;   // im alten Raum nichts mehr auslösen (Panel, Tür)
  setTimeout(() => {
    if (tok !== enterTok) return;   // inzwischen anderes Ziel gewählt
    // Neuen Raum bauen, solange der alte noch besteht: gemeinsame Shader-Programme bleiben erhalten und müssen nicht neu übersetzt werden.
    // Die Programme des neuen Raums werden im Hintergrund übersetzt (compileAsync), während das Bild noch abgedunkelt ist.
    const old = cur; cur = null; let nxt;
    try { nxt = build(key); } catch (e) { console.error("R3D: Raum konnte nicht gebaut werden", key, e); cur = old; pend = null; fade.style.opacity = 0; loadEl.style.opacity = 0; return; }
    let fin = false, pr = null, tm = 0;
    const done = () => { if (fin) return; fin = true; clearTimeout(tm); if (old) dispose(old.scene);
      if (tok !== enterTok) { const free = () => dispose(nxt.scene); if (pr) pr.then(free, free); else free(); return; }   // erst freigeben, wenn das Vorübersetzen fertig ist
      pend = null; arrive(nxt, key, from, opt); };
    try { if (renderer.compileAsync) { camera.updateMatrixWorld(); pr = renderer.compileAsync(nxt.scene, camera); } } catch (e) { console.warn("R3D: Vorübersetzen", e); }
    if (pr) { pr.then(done, done); tm = setTimeout(done, 8000); } else done();   // Sicherheitsnetz: spätestens nach 8 s weiter
  }, root.hidden ? 0 : 420);
}
function arrive(nxt, key, from, opt){
    cur = nxt; hidePanel(); setTitle(); resize(); st.set(RKEY3, key + (opt.stage != null ? ":" + opt.stage : ""));
    // Startpunkt: an der Tür, durch die man kommt
    const d = cur.doors.find(x => x.to === from);
    if (opt.stage != null && !cur.isHall) { const [x, z] = STATIONS[opt.stage], s = x < 0 ? 1 : -1; P.x = x + s * 1.7; P.z = z; P.yaw = angTo(-s, 0); }
    else if (d) { const a = approachDoor(d); P.x = a.x; P.z = a.z; P.yaw = wrapA(a.yaw + Math.PI); }
    else if (cur.isHall) { P.x = 0; P.z = HALL.z0 - 2.2; P.yaw = 0; }
    else { P.x = 0; P.z = cur.bounds.z0 - 2.2; P.yaw = 0; }
    if (opt.pose) { const q = Object.assign({x: P.x, z: P.z}, opt.pose); if (!blocked(q.x, q.z)) Object.assign(P, opt.pose); }   // nie außerhalb des Raums absetzen
    P.pitch = opt.pose && opt.pose.pitch != null ? opt.pose.pitch : -0.04; P.tx = null; P.path = null; P.onArrive = null; P.faceYaw = null;
    step(0); renderer.render(cur.scene, camera);
    requestAnimationFrame(() => { fade.style.opacity = 0; loadEl.style.opacity = 0; });
    if (opt.stage != null && !cur.isHall) setTimeout(() => stationPanel(opt.stage), 350);
    R3D.ready = true;
    for (const f of R3D.hooks.afterEnter) { try { f(cur, from, opt); } catch (e) { console.error("R3D afterEnter", e); } }
}
let leaving = false;   // 3D-Ansicht wird gerade verlassen (Abblenden läuft)
function show(key, opt){
  leaving = false;
  if (!root.hidden && cur && cur.key === key && opt == null) return;
  root.hidden = false; document.body.classList.add("r3d-on"); resize();
  if (!running) startLoop();
  enter(key, null, opt || {});
}
function hide(){ leaving = false; if (root.hidden) return; root.hidden = true; running = false; document.body.classList.remove("r3d-on"); hidePanel(); }
function leaveTo(fn){ leaving = true; fade.style.opacity = 1; setTimeout(() => { hide(); fn(); }, 350); }
document.addEventListener("visibilitychange", () => { if (document.hidden) { running = false; } else if (!root.hidden && !running) startLoop(); });

/* ---------- Einbindung in die App ---------- */
const isOn = () => st.get(STORE) !== "0";
const worldChosen = () => !!st.get(PFX + "-welt");
const go2 = go;     // ursprüngliche Navigation (für 2D-Ansichten)
go = function(view, arg){
  if (isOn() && worldChosen() && (view === "topic" || view === "home")) {
    if (view === "topic") { const id = arg || (RET && RET[1]) || S.sel[0]; const m = (st.get(RKEY3) || "").split(":");
      RET = null; show(id, {stage: m[0] === id && m[1] != null && m[1] !== "" ? +m[1] : null}); }
    else show((st.get(RKEY3) || "halle").split(":")[0]);
    return;
  }
  hide(); go2(view, arg);
};
root.querySelector("#r3dhall").onclick = () => { const k = pend ? pend.key : cur && cur.key; if (k && k !== "halle") enter("halle", k); };
root.querySelector("#r3d2d").onclick = () => { st.set(STORE, "0"); leaveTo(() => go2("home")); };
root.querySelector("#r3dton").onclick = () => { const b = document.getElementById("mtoggle"); if (b) b.click(); };
root.querySelector("#r3dwelt").onclick = () => {
  const W = window.WELTEN_API; if (!W) return; const ids = W.order, nx = ids[(ids.indexOf(W.id) + 1) % ids.length];
  W.choose(nx); toast(`${W.icon} ${W.name}`, 1500); if (pend) enter(pend.key, pend.from, pend.opt);   // Wechsel läuft noch: dasselbe Ziel im neuen Stil
  else enter(cur ? cur.key : "halle", null, {pose: {x: P.x, z: P.z, yaw: P.yaw}});
};
// Startseite (2D): Eingang zu den 3D-Räumen
const homePrev3 = VIEWS.home;
VIEWS.home = (...a) => { homePrev3(...a); if (!worldChosen()) return;
  const b = document.createElement("button"); b.className = "r3d-enter"; const W = window.WELTEN_API;
  b.innerHTML = `<span class="i" aria-hidden="true">🚪</span><span><b>In die 3D-Räume</b><span>Durch ${W ? esc(W.hallName) : "die Halle"} und alle ${TOPICS.length} Räume gehen</span></span><span aria-hidden="true">▶</span>`;
  b.onclick = () => { st.set(STORE, "1"); show((st.get(RKEY3) || "halle").split(":")[0]); };
  const s = app.querySelector(".stack"); if (s) s.insertBefore(b, s.children[chosenIdx(s)] || null); };
const chosenIdx = s => [...s.children].findIndex(c => c.classList.contains("cta")) + 1 || 1;

R3D.enter = enter; R3D.show = show; R3D.hide = hide; R3D.player = P; R3D.camera = camera; R3D.renderer = renderer;
// Zugang für Zusatzmodule
R3D.api = {cur: () => cur, root, panel, infoPanel, hidePanel, stationPanel, activate, walkTo, approach, approachDoor, blocked: (x, z) => blocked(x, z), leaveTo, go2,
  st, store: STORE, roomKey: RKEY3, isBusy: () => busy, moving: () => busy || leaving || !!pend, stations: STATIONS, slots: SLOTS, hall: HALL, eye: EYE, setTitle};
const findIa = pred => pred.i != null ? cur.ctx._inter[pred.i] : cur.ctx._inter.find(x => { const ia = x.userData.ia;
  return ia.kind === pred.kind && (pred.to == null || ia.to === pred.to) && (pred.stage == null || ia.stage === pred.stage); });
R3D.debug = {
  enter(world, key, pose){ if (world && window.WELTEN_API) window.WELTEN_API.choose(world); st.set(STORE, "1"); root.hidden = false; resize(); running = false;
    enterTok++; pend = null; const old = cur; cur = build(key); if (old) dispose(old.scene); setTitle(); Object.assign(P, {x: 0, z: cur.bounds.z0 - 2.2, yaw: 0, pitch: -0.04}, pose || {});
    fade.style.transition = "none"; fade.style.opacity = 0; void fade.offsetWidth; fade.style.transition = ""; loadEl.style.opacity = 0; step(0); for (let i = 0; i < 30; i++) { clock += 1 / 30; for (const f of cur.ctx._ticks) f(1 / 30, clock); }
    renderer.render(cur.scene, camera); return {inter: cur.ctx._inter.length, obst: cur.ctx._obst.length, lights: cur.ctx._lights.length, ticks: cur.ctx._ticks.length}; },
  pose(p){ Object.assign(P, p); step(0); renderer.render(cur.scene, camera); },
  tick(n = 30){ for (let i = 0; i < n; i++) { clock += 1 / 30; step(1 / 30); for (const f of cur.ctx._ticks) f(1 / 30, clock); for (const d of cur.doors) d.door.update && d.door.update(1 / 30); } renderer.render(cur.scene, camera); drawMap(); },
  click(i){ const ia = cur.ctx._inter[i] && cur.ctx._inter[i].userData.ia; if (ia) { ia.onClick && ia.onClick(); return ia.title || ia.label; } },
  list(){ return cur.ctx._inter.map((o, i) => [i, o.userData.ia.kind, o.userData.ia.title || o.userData.ia.label]); },
  info(){ return renderer.info.render; },
  lastIs(pred){ const o = findIa(pred); return !!(o && lastIa && o.userData.ia === lastIa); },
  resetLast(){ lastIa = null; },
  scene(){ return cur && cur.scene; },
  mapPt(x, z){ drawMap(); const r = mapC.getBoundingClientRect(); return {x: r.left + (mapT.ox + x * mapT.s) * r.width / mapC.width, y: r.top + (mapT.oz + z * mapT.s) * r.height / mapC.height}; },
  // Bildschirmposition eines klickbaren Objekts (für Bedientests mit echter Maus)
  screen(pred){ const o = findIa(pred);
    if (!o) return null; camera.updateMatrixWorld(); const b = new T3.Box3().setFromObject(o), c = b.getCenter(new T3.Vector3()), r = cv.getBoundingClientRect();
    const scr = v => { const q = v.clone().project(camera); return {x: r.left + (q.x + 1) / 2 * r.width, y: r.top + (1 - q.y) / 2 * r.height, vis: q.z < 1 && Math.abs(q.x) < .97 && Math.abs(q.y) < .97}; };
    const hits = p => { if (!p.vis) return false; const q = pick({clientX: p.x, clientY: p.y}); return !!(q && q.ia === o.userData.ia); };
    const c0 = c.clone(); c0.y = Math.min(c0.y, 1.4); const p0 = scr(c0); if (hits(p0)) return Object.assign(p0, {hit: true});
    // sonst einen Punkt im Umriss suchen, an dem ein echter Klick wirklich dieses Objekt trifft
    for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) for (let k = 1; k < 6; k++) {
      const p = scr(new T3.Vector3(b.min.x + (b.max.x - b.min.x) * i / 6, b.min.y + (b.max.y - b.min.y) * j / 6, b.min.z + (b.max.z - b.min.z) * k / 6)); if (hits(p)) return Object.assign(p, {hit: true}); }
    return Object.assign(p0, {hit: false}); },
  approach(i, d){ const o = cur.ctx._inter[i]; if (!o) return null; const a = approach(o, d || 2.6); return {x: +a.x.toFixed(2), z: +a.z.toFixed(2), yaw: a.yaw}; },
  face(pred){ const o = findIa(pred);
    if (!o) return false; P.tx = null; P.path = null; P.onArrive = null; P.faceYaw = null; const p = new T3.Box3().setFromObject(o).getCenter(new T3.Vector3()); P.yaw = angTo(p.x - P.x, p.z - P.z); P.pitch = -.1; step(0); return true; },
  belegt(){ return cur ? occupancy(cur.ctx).map(q => Object.fromEntries(Object.entries(q).map(([k, v]) => [k, +v.toFixed(2)]))) : []; },
  state(){ return {key: cur && cur.key, x: +P.x.toFixed(2), z: +P.z.toFixed(2), panel: !panel.hidden, hidden: root.hidden, title: root.querySelector("#r3dt").textContent, busy}; }
};
// Start: direkt in die 3D-Welt, sobald eine Welt gewählt ist
setTimeout(() => { if (isOn() && worldChosen() && curView !== "welt") show((st.get(RKEY3) || "halle").split(":")[0]); }, 0);
})();
