/* ---------- 15_dekor_detektiv.js ---------- */
/* =====================================================================
   Ausstattung der Welt „Detektei“ (kit.decor): viktorianisches Detektivbüro
   Läuft nach dem Raum, den Lernstationen und der Stimmung (siehe RAUM-API.md, „Ausstattung eines Weltstils“) und nimmt nur Plätze,
   die ctx.frei() meldet: Aktenschränke, Bücherborde, Vitrinen, Ohrensessel mit Pfeifenrauch, Ermittlungswand mit roten Fäden,
   Fenster mit Samtvorhängen und Nebel, Gemälde, Rollkarte, Truhen und Koffer, Globus, Gaslüster; je Raum Dinge zum Thema
   (Strom: Leidener Flaschen, Volta-Säule, Elektrisiermaschine · Optik: Fernrohr, Mikroskop, Lupen, Plattenkamera ·
   Bewegung: Hochrad, Taschenuhren, Modelleisenbahn, Ballon · Kräfte: Balkenwaage, Gewichtssatz, Federwaagen, Anker, Flaschenzug).
   Alle Teile je Material zu einem Mesh verschmolzen, Bücher als InstancedMesh, Bilder in zwei Textur-Atlanten, keine Lichter.
   ===================================================================== */
(() => {
const T3 = window.THREE, R3D = window.R3D, KIT = R3D && R3D.kits && R3D.kits.detektiv;
if (!T3 || !KIT || !KIT._h) return;
const {U, TAU, FONT, BODY, NEWS, bevel, flower, star, brassGrad, screw, compass, damask, tex, mat, kmat, M, bucket, walls, bookcase, LAMP_Y} = KIT._h;
const PI = Math.PI, V3 = (x, y, z) => new T3.Vector3(x, y, z);

/* ---------- Zeichenhilfen (eigener, fester Zufall je Textur) ---------- */
function speck(g, r, x, y, w, h, n, a, cols){ for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.globalAlpha = a * r(); const s = .8 + r() * 2.2; g.fillRect(x + r() * w, y + r() * h, s, s); } g.globalAlpha = 1; }
function varnish(g, r, x, y, w, h, k = .5){   // Firnis: warme Vignette, Craquelé, Staub
  const v = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .25, x + w / 2, y + h / 2, Math.max(w, h) * .72);
  v.addColorStop(0, "rgba(255,220,150,.04)"); v.addColorStop(1, `rgba(30,16,4,${.55 * k})`); g.fillStyle = v; g.fillRect(x, y, w, h);
  g.strokeStyle = "rgba(20,10,2,.12)"; g.lineWidth = .7;
  for (let i = 0; i < 70 * k; i++) { let px = x + r() * w, py = y + r() * h; g.beginPath(); g.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (r() - .5) * 26; py += (r() - .5) * 26; g.lineTo(px, py); } g.stroke(); }
  speck(g, r, x, y, w, h, w * h / 60, .1, ["#000", "#fff2d0"]);
}
function cloud(g, x, y, rx, ry, col){ const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, "0)"));
  g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore(); }
function ridge(g, r, y0, amp, w, h, col, rough = 1){ g.fillStyle = col; g.beginPath(); g.moveTo(0, h); let y = y0;
  for (let x = 0; x <= w; x += 6) { y += (r() - .5) * 7 * rough; y += (y0 - y) * .05; g.lineTo(x, y - Math.sin(x / w * PI * 1.3 + amp) * amp * 22); } g.lineTo(w, h); g.closePath(); g.fill(); }
function lines(g, r, x, y, w, n, lh, col, lw = 2){ g.fillStyle = col; for (let i = 0; i < n; i++) { const L = w * (i === n - 1 ? .35 + r() * .4 : .82 + r() * .18); g.fillRect(x, y + i * lh, L, lw); } }
function frameRect(g, x, y, w, h, col, lw){ g.strokeStyle = col; g.lineWidth = lw; g.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw); }
function inCell(g, c, f){ g.save(); g.beginPath(); g.rect(c[0], c[1], c[2], c[3]); g.clip(); g.translate(c[0], c[1]); f(g, c[2], c[3]); g.restore(); }

/* ---------- Atlas 1: Gemälde, Wappen, Sternkarte, Ermittlungswand ---------- */
const CB = {L: [0, 0, 512, 320], S: [512, 0, 512, 320], V: [0, 320, 256, 320], P1: [256, 320, 256, 320], P2: [512, 320, 256, 320], W: [768, 320, 256, 320],
  N: [0, 640, 384, 384], E: [384, 640, 640, 384]};
/* ---------- Atlas 2: Fensterblick, Globus, Barometer, Fotos, Zeitung, Rollkarte, Kupferstiche, Ballonstoff ---------- */
const CM = {F: [0, 0, 320, 640], G: [320, 0, 512, 256], B: [832, 0, 192, 192], Bl: [832, 192, 192, 64], Ph: [320, 256, 384, 320], Z: [704, 256, 320, 384],
  K: [0, 640, 512, 384], T0: [512, 640, 256, 192], T1: [768, 640, 256, 192], T2: [512, 832, 256, 192], T3: [768, 832, 256, 192]};
const uvc = c => [c[0] / 1024, 1 - (c[1] + c[3]) / 1024, (c[0] + c[2]) / 1024, 1 - c[1] / 1024];
const PHOTO = i => { const c = CM.Ph; return [c[0] + (i % 3) * 128, c[1] + ((i / 3) | 0) * 160, 128, 160]; };

function pLandscape(g, w, h, r){   // Hochmoor in der Abendsonne mit See und Hütte
  const sky = g.createLinearGradient(0, 0, 0, h * .62); sky.addColorStop(0, "#3d4a5c"); sky.addColorStop(.45, "#8e8a7a"); sky.addColorStop(.8, "#e2b874"); sky.addColorStop(1, "#f4d9a0");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const sun = g.createRadialGradient(w * .7, h * .5, 2, w * .7, h * .5, 150); sun.addColorStop(0, "rgba(255,244,214,.95)"); sun.addColorStop(.25, "rgba(255,214,150,.5)"); sun.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = sun; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) cloud(g, r() * w, 20 + r() * h * .32, 40 + r() * 80, 10 + r() * 18, `rgba(${200 + r() * 50 | 0},${170 + r() * 40 | 0},${140 + r() * 40 | 0},.45)`);
  ridge(g, r, h * .5, 1.2, w, h, "rgba(110,110,125,.75)", .8); ridge(g, r, h * .56, .7, w, h, "rgba(84,86,82,.9)", 1);
  const lake = g.createLinearGradient(0, h * .6, 0, h * .74); lake.addColorStop(0, "#f0cf92"); lake.addColorStop(1, "#5e6a6c"); g.fillStyle = lake; g.fillRect(0, h * .6, w, h * .14);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,236,190,${r() * .4})`; g.fillRect(w * .55 + r() * w * .3, h * .61 + r() * h * .12, 10 + r() * 30, 1.5); }
  ridge(g, r, h * .72, .3, w, h, "#4a4a2c", 1.4); ridge(g, r, h * .8, .2, w, h, "#3b3020", 1.8);
  for (let i = 0; i < 900; i++) { const x = r() * w, y = h * .74 + r() * h * .26; g.strokeStyle = r() < .5 ? `rgba(120,70,90,${.3 + r() * .4})` : `rgba(150,130,60,${.2 + r() * .4})`; g.lineWidth = 1 + r();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 4, y - 3 - r() * 8); g.stroke(); }
  // Hütte mit Rauch
  const hx = w * .22, hy = h * .69; g.fillStyle = "#2a2018"; g.fillRect(hx, hy - 16, 34, 16); g.beginPath(); g.moveTo(hx - 4, hy - 16); g.lineTo(hx + 17, hy - 30); g.lineTo(hx + 38, hy - 16); g.fill();
  g.fillStyle = "#ffcf7a"; g.fillRect(hx + 7, hy - 11, 5, 5); g.fillRect(hx + 22, hy - 11, 5, 5);
  for (let i = 0; i < 6; i++) cloud(g, hx + 28 + i * 9, hy - 34 - i * 11, 8 + i * 3, 5 + i * 2, "rgba(200,190,180,.35)");
  for (let i = 0; i < 5; i++) { g.strokeStyle = "rgba(30,24,20,.8)"; g.lineWidth = 1.3; const x = w * .45 + i * 14, y = h * .3 + (i % 2) * 6; g.beginPath(); g.moveTo(x - 5, y); g.quadraticCurveTo(x, y - 4, x + 5, y); g.stroke(); }
  varnish(g, r, 0, 0, w, h, .7);
}
function pSea(g, w, h, r){   // Dreimaster im Sturm, Leuchtturm
  const sky = g.createLinearGradient(0, 0, 0, h * .6); sky.addColorStop(0, "#252a30"); sky.addColorStop(.6, "#5d625e"); sky.addColorStop(1, "#a59c84"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const br = g.createRadialGradient(w * .32, h * .25, 4, w * .32, h * .25, 160); br.addColorStop(0, "rgba(255,240,200,.75)"); br.addColorStop(1, "rgba(255,230,180,0)"); g.fillStyle = br; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) cloud(g, r() * w, r() * h * .45, 50 + r() * 90, 14 + r() * 26, `rgba(${30 + r() * 40 | 0},${34 + r() * 40 | 0},${40 + r() * 40 | 0},.55)`);
  const sea = g.createLinearGradient(0, h * .55, 0, h); sea.addColorStop(0, "#556258"); sea.addColorStop(1, "#1d2622"); g.fillStyle = sea; g.fillRect(0, h * .55, w, h * .45);
  for (let i = 0; i < 160; i++) { const x = r() * w, y = h * .56 + r() * h * .44, L = 20 + r() * 50; g.strokeStyle = `rgba(${200 + r() * 50 | 0},${210 + r() * 40 | 0},${200 + r() * 40 | 0},${.15 + r() * .35})`; g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L / 2, y - 6 - r() * 8, x + L, y); g.stroke(); }
  // Klippe und Leuchtturm
  g.fillStyle = "#1c1a16"; g.beginPath(); g.moveTo(w, h * .42); g.lineTo(w * .86, h * .5); g.lineTo(w * .8, h * .66); g.lineTo(w, h * .7); g.fill();
  g.fillStyle = "#d8d0bc"; g.fillRect(w * .9, h * .26, 12, h * .17); g.fillStyle = "#8e2a20"; g.fillRect(w * .9, h * .3, 12, 6); g.fillRect(w * .9, h * .37, 12, 6);
  const lh = g.createRadialGradient(w * .9 + 6, h * .25, 0, w * .9 + 6, h * .25, 40); lh.addColorStop(0, "rgba(255,240,180,1)"); lh.addColorStop(1, "rgba(255,220,140,0)"); g.fillStyle = lh; g.fillRect(w * .8, h * .15, 80, 60);
  g.fillStyle = "rgba(255,236,170,.18)"; g.beginPath(); g.moveTo(w * .9 + 6, h * .25); g.lineTo(w * .45, h * .12); g.lineTo(w * .47, h * .22); g.fill();
  // Schiff
  g.save(); g.translate(w * .4, h * .66); g.rotate(-.12); g.fillStyle = "#16120e"; g.beginPath(); g.moveTo(-70, 0); g.lineTo(78, -4); g.lineTo(62, 16); g.lineTo(-56, 16); g.closePath(); g.fill();
  g.fillRect(-36, -95, 3, 96); g.fillRect(4, -112, 3, 112); g.fillRect(40, -86, 3, 86); g.strokeStyle = "#16120e"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(78, -4); g.lineTo(110, -18); g.stroke();
  g.fillStyle = "rgba(226,214,186,.92)"; for (const [mx, top, n] of [[-35, -92, 3], [5, -108, 4], [41, -82, 3]]) for (let k = 0; k < n; k++) { const yy = top + k * 25, ww = 30 - k * 2 + n * 2;
    g.beginPath(); g.moveTo(mx - ww / 2, yy); g.lineTo(mx + ww / 2, yy); g.quadraticCurveTo(mx + ww / 2 + 6, yy + 11, mx + ww / 2 - 2, yy + 21); g.lineTo(mx - ww / 2 + 2, yy + 21); g.quadraticCurveTo(mx - ww / 2 + 6, yy + 11, mx - ww / 2, yy); g.fill(); }
  g.beginPath(); g.moveTo(80, -6); g.lineTo(108, -17); g.lineTo(84, -40); g.closePath(); g.fill(); g.restore();
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(235,240,230,${.2 + r() * .4})`; g.beginPath(); g.ellipse(w * .25 + r() * w * .35, h * .68 + r() * 20, 6 + r() * 14, 2 + r() * 4, 0, 0, TAU); g.fill(); }
  varnish(g, r, 0, 0, w, h, .75);
}
function pStill(g, w, h, r){   // Stillleben: Zinnkrug, Obstschale, Rosen
  const bg = g.createRadialGradient(w * .4, h * .35, 10, w * .5, h * .5, w); bg.addColorStop(0, "#5a4430"); bg.addColorStop(1, "#140d08"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = "#3a2516"; g.fillRect(0, h * .72, w, h * .28); g.fillStyle = "rgba(255,220,170,.1)"; g.fillRect(0, h * .72, w, 3);
  g.fillStyle = "#6c1f1a"; g.beginPath(); g.moveTo(0, h * .74); g.quadraticCurveTo(w * .3, h * .7, w * .45, h * .8); g.lineTo(w * .4, h); g.lineTo(0, h); g.fill();
  g.strokeStyle = "rgba(255,200,170,.18)"; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(i * 20, h * .76); g.quadraticCurveTo(w * .2 + i * 10, h * .82, w * .3 + i * 8, h); g.stroke(); }
  // Krug
  const jx = w * .26, jy = h * .45; const jg = g.createLinearGradient(jx - 30, 0, jx + 30, 0); jg.addColorStop(0, "#3c3a36"); jg.addColorStop(.35, "#b6b2a6"); jg.addColorStop(1, "#2c2a26");
  g.fillStyle = jg; g.beginPath(); g.moveTo(jx - 22, jy - 40); g.lineTo(jx + 22, jy - 40); g.quadraticCurveTo(jx + 38, jy + 30, jx + 30, jy + 82); g.lineTo(jx - 30, jy + 82); g.quadraticCurveTo(jx - 38, jy + 30, jx - 22, jy - 40); g.fill();
  g.strokeStyle = "#5a5852"; g.lineWidth = 7; g.beginPath(); g.arc(jx + 38, jy + 12, 22, -1.2, 1.4); g.stroke();
  // Vase mit Rosen
  const vx = w * .66, vy = h * .5; g.fillStyle = "#26364a"; g.beginPath(); g.moveTo(vx - 14, vy - 30); g.quadraticCurveTo(vx - 34, vy + 20, vx - 18, vy + 60); g.lineTo(vx + 18, vy + 60); g.quadraticCurveTo(vx + 34, vy + 20, vx + 14, vy - 30); g.fill();
  g.fillStyle = "rgba(200,220,255,.25)"; g.fillRect(vx - 14, vy - 10, 5, 50);
  for (let i = 0; i < 26; i++) { g.strokeStyle = "#2e4424"; g.lineWidth = 2; const a = -PI / 2 + (r() - .5) * 1.6, L = 40 + r() * 50; g.beginPath(); g.moveTo(vx, vy - 28); g.lineTo(vx + Math.cos(a) * L, vy - 28 + Math.sin(a) * L); g.stroke();
    if (i % 2) { g.fillStyle = "#3d5a2c"; g.beginPath(); g.ellipse(vx + Math.cos(a) * L * .6, vy - 28 + Math.sin(a) * L * .6, 8, 3.5, a + 1, 0, TAU); g.fill(); } }
  for (let i = 0; i < 9; i++) { const a = -PI / 2 + (i / 8 - .5) * 1.7, L = 55 + r() * 40, x = vx + Math.cos(a) * L, y = vy - 30 + Math.sin(a) * L, rr = 11 + r() * 6;
    const rg = g.createRadialGradient(x - 3, y - 3, 1, x, y, rr); rg.addColorStop(0, i % 3 ? "#f2b6a8" : "#fff0d8"); rg.addColorStop(1, i % 3 ? "#8e1f22" : "#c8a070"); g.fillStyle = rg; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
    g.strokeStyle = "rgba(80,10,10,.4)"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, rr * .5, 0, 4); g.stroke(); }
  // Obstschale
  const bx = w * .5, by = h * .74; g.fillStyle = "#8a6a3a"; g.beginPath(); g.ellipse(bx, by, 60, 14, 0, 0, PI); g.fill();
  for (const [dx, dy, c1, c2, rr] of [[-30, -16, "#e86a3a", "#7a1a10", 17], [2, -22, "#b8c858", "#4a6a1a", 18], [30, -14, "#e0a030", "#8a4a10", 16], [-8, -36, "#d84a3a", "#6a1010", 15]]) {
    const fg = g.createRadialGradient(bx + dx - 5, by + dy - 5, 1, bx + dx, by + dy, rr); fg.addColorStop(0, c1); fg.addColorStop(1, c2); g.fillStyle = fg; g.beginPath(); g.arc(bx + dx, by + dy, rr, 0, TAU); g.fill(); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${70 + r() * 30 | 0},30,${80 + r() * 30 | 0},.95)`; g.beginPath(); g.arc(bx + 44 + (i % 4) * 7 - (i / 4 | 0) * 2, by - 14 + (i / 4 | 0) * 8, 5, 0, TAU); g.fill(); }
  varnish(g, r, 0, 0, w, h, .9);
}
function pLady(g, w, h, r){   // Kamee: Dame im Profil (Scherenschnitt) auf Elfenbein, ovaler Ausschnitt
  g.fillStyle = "#1e2a26"; g.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, bg = g.createRadialGradient(cx - 20, cy - 30, 10, cx, cy, h * .55); bg.addColorStop(0, "#f7eed6"); bg.addColorStop(1, "#cdb88c");
  g.fillStyle = bg; g.beginPath(); g.ellipse(cx, cy, w * .46, h * .46, 0, 0, TAU); g.fill();
  g.save(); g.translate(cx + 6, cy + 18); g.scale(1.05, 1.05); g.fillStyle = "#17110c"; g.beginPath();
  g.moveTo(-96, 130); g.bezierCurveTo(-90, 80, -60, 64, -30, 56); g.lineTo(-24, 28); g.bezierCurveTo(-44, 16, -50, -12, -44, -40);   // Nacken
  g.bezierCurveTo(-70, -48, -76, -84, -50, -104); g.bezierCurveTo(-30, -126, 4, -122, 16, -100);   // Haarknoten
  g.bezierCurveTo(28, -92, 30, -78, 32, -64); g.lineTo(42, -46); g.lineTo(34, -42); g.bezierCurveTo(38, -36, 36, -30, 38, -26);   // Stirn, Nase
  g.bezierCurveTo(32, -22, 36, -16, 32, -12); g.bezierCurveTo(30, -2, 22, 4, 12, 6); g.lineTo(10, 30); g.bezierCurveTo(40, 52, 70, 60, 90, 90); g.lineTo(96, 130); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(-52, -104, 22, 18, -.5, 0, TAU); g.fill();
  g.strokeStyle = "#17110c"; g.lineWidth = 4; g.beginPath(); g.moveTo(-58, -86); g.bezierCurveTo(-74, -70, -66, -50, -76, -30); g.stroke();   // Locke
  g.fillStyle = "#f2e6c8"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-26 + i * 6, 40 + Math.sin(i) * 2, 3, 0, TAU); g.fill(); }   // Perlenkette
  g.restore();
  g.strokeStyle = "#b8893f"; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy, w * .46, h * .46, 0, 0, TAU); g.stroke();
  speck(g, r, 0, 0, w, h, 1500, .1, ["#000", "#fff"]);
}
function pHound(g, w, h, r){   // Bildnis eines Spürhunds auf rotem Kissen
  const bg = g.createRadialGradient(w * .45, h * .35, 10, w / 2, h / 2, h * .7); bg.addColorStop(0, "#4c5a40"); bg.addColorStop(1, "#141a10"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = "#7a1f1c"; g.beginPath(); g.ellipse(w / 2, h * .86, w * .48, h * .1, 0, 0, TAU); g.fill(); g.fillStyle = "#c9a35e"; for (const s of [-1, 1]) { g.beginPath(); g.arc(w / 2 + s * w * .44, h * .86, 7, 0, TAU); g.fill(); }
  const fur = g.createLinearGradient(w * .3, h * .2, w * .7, h * .9); fur.addColorStop(0, "#9a6a3a"); fur.addColorStop(.6, "#5a3a1e"); fur.addColorStop(1, "#2a1a0e"); g.fillStyle = fur;
  g.beginPath(); g.moveTo(w * .3, h * .86); g.bezierCurveTo(w * .26, h * .6, w * .34, h * .5, w * .4, h * .42);   // Brust
  g.bezierCurveTo(w * .36, h * .3, w * .38, h * .18, w * .5, h * .14); g.bezierCurveTo(w * .62, h * .12, w * .74, h * .2, w * .8, h * .3);   // Kopf, Schnauze
  g.bezierCurveTo(w * .84, h * .34, w * .82, h * .4, w * .74, h * .4); g.bezierCurveTo(w * .66, h * .42, w * .62, h * .46, w * .62, h * .54);
  g.bezierCurveTo(w * .7, h * .62, w * .76, h * .74, w * .74, h * .86); g.closePath(); g.fill();
  g.fillStyle = "#3a2210"; g.beginPath(); g.moveTo(w * .46, h * .2); g.bezierCurveTo(w * .36, h * .26, w * .36, h * .46, w * .44, h * .54); g.bezierCurveTo(w * .5, h * .46, w * .52, h * .3, w * .46, h * .2); g.fill();   // Schlappohr
  g.fillStyle = "#120a04"; g.beginPath(); g.arc(w * .8, h * .31, 5, 0, TAU); g.fill(); g.fillStyle = "#0c0804"; g.beginPath(); g.arc(w * .6, h * .24, 4, 0, TAU); g.fill();
  g.fillStyle = "rgba(255,240,200,.6)"; g.beginPath(); g.arc(w * .605, h * .235, 1.5, 0, TAU); g.fill();
  g.strokeStyle = "#8e2a1e"; g.lineWidth = 6; g.beginPath(); g.moveTo(w * .4, h * .46); g.quadraticCurveTo(w * .5, h * .52, w * .62, h * .5); g.stroke(); g.fillStyle = "#d8b060"; g.beginPath(); g.arc(w * .51, h * .53, 5, 0, TAU); g.fill();
  for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(${r() < .5 ? "200,150,90" : "30,18,8"},${.15 + r() * .2})`; g.lineWidth = 1; const x = w * .32 + r() * w * .45, y = h * .2 + r() * h * .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y + 5); g.stroke(); }
  varnish(g, r, 0, 0, w, h, .8);
}
function pCrest(g, w, h, r){   // Wappen der Detektei: Schild mit Schlüssel, Lupe, Eule und Sternen, Spruchband
  g.fillStyle = "#1c2430"; g.fillRect(0, 0, w, h);
  const cx = w / 2, top = 34, sw = 168, sh = 196;
  const shield = () => { g.beginPath(); g.moveTo(cx - sw / 2, top); g.lineTo(cx + sw / 2, top); g.lineTo(cx + sw / 2, top + sh * .55); g.quadraticCurveTo(cx + sw / 2, top + sh * .9, cx, top + sh); g.quadraticCurveTo(cx - sw / 2, top + sh * .9, cx - sw / 2, top + sh * .55); g.closePath(); };
  g.save(); shield(); g.clip();
  g.fillStyle = "#7c2620"; g.fillRect(cx - sw / 2, top, sw / 2, sh / 2); g.fillRect(cx, top + sh / 2, sw / 2, sh / 2);
  g.fillStyle = "#24406a"; g.fillRect(cx, top, sw / 2, sh / 2); g.fillRect(cx - sw / 2, top + sh / 2, sw / 2, sh / 2);
  g.restore();
  g.lineWidth = 7; g.strokeStyle = "#d9b25c"; shield(); g.stroke(); g.lineWidth = 2; g.strokeStyle = "#5a3a10"; shield(); g.stroke();
  g.strokeStyle = "#d9b25c"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, top + sh); g.moveTo(cx - sw / 2, top + sh / 2); g.lineTo(cx + sw / 2, top + sh / 2); g.stroke();
  const gold = "#e6c070";
  g.save(); g.translate(cx - sw / 4, top + sh / 4); g.rotate(-.6); g.fillStyle = gold; g.beginPath(); g.arc(0, -22, 11, 0, TAU); g.fill(); g.fillStyle = "#7c2620"; g.beginPath(); g.arc(0, -22, 5, 0, TAU); g.fill();
  g.fillStyle = gold; g.fillRect(-3, -12, 6, 40); g.fillRect(3, 18, 9, 5); g.fillRect(3, 25, 6, 4); g.restore();
  g.save(); g.translate(cx + sw / 4, top + sh / 4); g.strokeStyle = "#f0e2c0"; g.lineWidth = 5; g.beginPath(); g.arc(-4, -6, 15, 0, TAU); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(7, 5); g.lineTo(20, 20); g.stroke(); g.restore();
  g.save(); g.translate(cx - sw / 4, top + sh * .72); g.fillStyle = "#f0e2c0"; g.beginPath(); g.ellipse(0, 4, 15, 20, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-14, -10); g.lineTo(-10, -26); g.lineTo(-2, -14); g.lineTo(2, -14); g.lineTo(10, -26); g.lineTo(14, -10); g.fill();
  g.fillStyle = "#24406a"; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 6, -6, 5, 0, TAU); g.fill(); } g.fillStyle = gold; g.beginPath(); g.moveTo(-2, 0); g.lineTo(2, 0); g.lineTo(0, 5); g.fill(); g.restore();
  for (const [dx, dy] of [[-14, -12], [14, -12], [0, 12]]) star(g, cx + sw / 4 + dx, top + sh * .72 + dy, 9, 5, gold);
  // Helmzier: Krone
  g.fillStyle = gold; g.beginPath(); g.moveTo(cx - 34, top - 4); g.lineTo(cx - 40, top - 26); g.lineTo(cx - 20, top - 14); g.lineTo(cx, top - 30); g.lineTo(cx + 20, top - 14); g.lineTo(cx + 40, top - 26); g.lineTo(cx + 34, top - 4); g.closePath(); g.fill();
  for (const dx of [-40, 0, 40]) { g.beginPath(); g.arc(cx + dx, top - 28 - (dx ? 0 : 3), 4, 0, TAU); g.fill(); }
  // Spruchband
  const by = top + sh + 26; g.fillStyle = "#e8dcbc"; g.beginPath(); g.moveTo(cx - 110, by - 16); g.quadraticCurveTo(cx, by - 4, cx + 110, by - 16); g.lineTo(cx + 104, by + 14); g.quadraticCurveTo(cx, by + 26, cx - 104, by + 14); g.closePath(); g.fill();
  g.fillStyle = "#b8a47c"; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 110, by - 16); g.lineTo(cx + s * 124, by - 6); g.lineTo(cx + s * 114, by + 2); g.lineTo(cx + s * 124, by + 12); g.lineTo(cx + s * 104, by + 14); g.closePath(); g.fill(); }
  g.fillStyle = "#3a2614"; g.font = `italic 700 20px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("OMNIA PATEBUNT", cx, by + 2);
  speck(g, r, 0, 0, w, h, 1200, .1, ["#000", "#fff"]);
}
function pStars(g, w, h, r){   // Himmelskarte: Kreis mit Gradnetz, Sternbilder, Kartusche
  g.fillStyle = "#e9dcb8"; g.fillRect(0, 0, w, h); speck(g, r, 0, 0, w, h, 2500, .14, ["#8a6a3a", "#fff6dc"]);
  const cx = w / 2, cy = h / 2 + 8, R = w * .42;
  const sky = g.createRadialGradient(cx, cy, 10, cx, cy, R); sky.addColorStop(0, "#1f3358"); sky.addColorStop(1, "#0e1830"); g.fillStyle = sky; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.strokeStyle = "rgba(210,180,110,.35)"; g.lineWidth = 1; for (const k of [.33, .66]) { g.beginPath(); g.arc(cx, cy, R * k, 0, TAU); g.stroke(); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
  g.strokeStyle = "rgba(230,190,110,.4)"; g.setLineDash([4, 4]); g.beginPath(); g.ellipse(cx, cy, R * .8, R * .45, .4, 0, TAU); g.stroke(); g.setLineDash([]);
  for (let i = 0; i < 260; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * .97, s = r() < .1 ? 2.2 : .6 + r(); g.fillStyle = `rgba(255,${235 + r() * 20 | 0},${200 + r() * 40 | 0},${.5 + r() * .5})`; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, 0, TAU); g.fill(); }
  const cons = [[[-.5, -.4], [-.38, -.42], [-.26, -.38], [-.16, -.3], [-.12, -.16], [-.26, -.12], [-.2, -.26]], [[.2, .1], [.3, .02], [.38, .12], [.46, .04], [.56, .14]],
    [[-.1, .3], [-.02, .42], [.08, .3], [-.18, .46], [.14, .5], [-.02, .58]], [[.3, -.5], [.36, -.36], [.48, -.3], [.4, -.2]]];
  g.strokeStyle = "rgba(240,210,140,.75)"; g.lineWidth = 1.3; g.fillStyle = "#fff4d0";
  for (const c of cons) { g.beginPath(); c.forEach(([x, y], i) => { const px = cx + x * R, py = cy + y * R; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
    for (const [x, y] of c) { g.beginPath(); g.arc(cx + x * R, cy + y * R, 3, 0, TAU); g.fill(); } }
  g.strokeStyle = "#7a5420"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R + 4, 0, TAU); g.stroke(); g.lineWidth = 1.2;
  for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, r1 = R + 8, r2 = R + (i % 6 ? 13 : 18); g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); g.stroke(); }
  g.fillStyle = "#3a2614"; g.font = `italic 700 22px ${FONT}`; g.textAlign = "center"; g.fillText("Charta Coelestis", cx, 26);
  compass(g, w - 34, h - 34, 16); frameRect(g, 0, 0, w, h, "#5a3a1a", 6);
}
const PINS = [];   // Nadeln der Ermittlungswand (u, v in 0..1) – daran hängen die roten Fäden
function pCollage(g, w, h, r){
  g.fillStyle = "#a9794a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 40; i++) { g.fillStyle = ["#8a5a32", "#c99a68", "#6a4024", "#b98a5a"][(r() * 4) | 0]; g.globalAlpha = .35 + r() * .4; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); } g.globalAlpha = 1;
  const pin = (x, y) => PINS.push([x / w, y / h]);
  const card = (x, y, cw, chh, rot, draw, bg = "#efe6cf") => { g.save(); g.translate(x, y); g.rotate(rot); g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 5;
    g.fillStyle = bg; g.fillRect(-cw / 2, -chh / 2, cw, chh); g.shadowColor = "transparent"; draw(cw, chh); g.restore(); pin(x, y - chh / 2 + 10); };
  const photo = (cw, chh, k) => { const px = -cw / 2 + 7, py = -chh / 2 + 7, pw = cw - 14, ph = chh - 26; const sg = g.createLinearGradient(0, py, 0, py + ph); sg.addColorStop(0, "#9a8668"); sg.addColorStop(1, "#4e3e2a"); g.fillStyle = sg; g.fillRect(px, py, pw, ph);
    g.fillStyle = "rgba(30,20,10,.85)";
    if (k === 0) { g.beginPath(); g.ellipse(0, py + ph * .38, pw * .17, ph * .2, 0, 0, TAU); g.fill(); g.fillRect(-pw * .3, py + ph * .6, pw * .6, ph * .4); g.fillRect(-pw * .24, py + ph * .14, pw * .48, 6); g.fillRect(-pw * .14, py + ph * .02, pw * .28, ph * .14); }
    else if (k === 1) { for (let i = 0; i < 4; i++) g.fillRect(px + i * pw / 4 + 3, py + ph * (.25 + (i % 2) * .15), pw / 4 - 6, ph); g.fillStyle = "rgba(255,230,170,.7)"; g.fillRect(px + pw * .1, py + ph * .45, 5, 5); }
    else { g.beginPath(); g.moveTo(px, py + ph * .7); g.quadraticCurveTo(0, py + ph * .2, px + pw, py + ph * .7); g.lineTo(px + pw, py + ph); g.lineTo(px, py + ph); g.fill(); }
    g.fillStyle = "#3a2c1c"; g.font = `14px ${BODY}`; g.textAlign = "center"; g.fillText(["Verdächtiger", "Lagerhaus", "Brücke"][k], 0, chh / 2 - 7); };
  const clip = (cw, chh, head) => { g.fillStyle = "#2a2018"; g.font = `700 17px ${NEWS}`; g.textAlign = "center"; const L = U.wrapText(g, head, cw - 16); L.slice(0, 2).forEach((l, i) => g.fillText(l, 0, -chh / 2 + 22 + i * 19));
    lines(g, r, -cw / 2 + 9, -chh / 2 + 30 + L.length * 19, (cw - 18) / 2 - 4, 7, 9, "rgba(40,30,20,.55)", 2); lines(g, r, 4, -chh / 2 + 30 + L.length * 19, (cw - 18) / 2 - 4, 7, 9, "rgba(40,30,20,.55)", 2); };
  const note = (cw, chh, t) => { g.fillStyle = "#2a3a6a"; g.font = `italic 600 20px ${FONT}`; g.textAlign = "center"; t.split("\n").forEach((l, i) => g.fillText(l, 0, -chh / 2 + 34 + i * 24)); };
  card(78, 92, 104, 132, -.06, (cw, chh) => photo(cw, chh, 0), "#f4efe4");
  card(230, 80, 150, 104, .04, (cw, chh) => clip(cw, chh, "RÄTSEL IN DER NEBELGASSE"), "#e4dcc6");
  card(392, 96, 104, 132, .07, (cw, chh) => photo(cw, chh, 1), "#f4efe4");
  card(548, 86, 122, 112, -.05, (cw, chh) => { g.strokeStyle = "rgba(120,90,60,.8)"; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-cw / 2 + 8, -chh / 2 + 14 + i * 16); g.lineTo(cw / 2 - 8, -chh / 2 + 10 + i * 17); g.stroke(); }
    g.strokeStyle = "#6c8c9e"; g.lineWidth = 9; g.beginPath(); g.moveTo(-cw / 2, 10); g.quadraticCurveTo(0, -20, cw / 2, 18); g.stroke(); g.strokeStyle = "#a3241c"; g.lineWidth = 3; g.beginPath(); g.arc(18, 4, 11, 0, TAU); g.stroke(); }, "#ece0c0");
  card(120, 268, 140, 110, .05, (cw, chh) => note(cw, chh, "Wer war\num 9 Uhr\nim Lager?"), "#f2e9c0");
  card(300, 272, 104, 132, -.08, (cw, chh) => photo(cw, chh, 2), "#f4efe4");
  card(452, 264, 150, 110, .03, (cw, chh) => clip(cw, chh, "Zeuge sah Licht im Lagerhaus"), "#e4dcc6");
  card(588, 286, 76, 90, -.1, (cw, chh) => { g.fillStyle = "#3a2c1c"; g.font = `700 54px ${FONT}`; g.textAlign = "center"; g.fillText("?", 0, 18); }, "#f2e9c0");
  speck(g, r, 0, 0, w, h, 1500, .1, ["#000", "#fff"]);
  frameRect(g, 0, 0, w, h, "rgba(40,24,10,.6)", 4);
}

/* ---------- Atlas 2 ---------- */
function mView(g, w, h, r){   // Blick aus dem Fenster: Häuserzeile gegenüber im Nebel, Gaslaternen, Mond
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#28323e"); sky.addColorStop(.5, "#4a5560"); sky.addColorStop(1, "#6b6a64"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const moon = g.createRadialGradient(w * .7, h * .14, 2, w * .7, h * .14, 90); moon.addColorStop(0, "rgba(255,250,230,.95)"); moon.addColorStop(.12, "rgba(240,236,214,.6)"); moon.addColorStop(1, "rgba(200,210,220,0)"); g.fillStyle = moon; g.fillRect(0, 0, w, h);
  // Dächer und Schornsteine
  g.fillStyle = "#1e242a"; g.beginPath(); g.moveTo(0, h * .32); for (let x = 0; x <= w; x += 20) { const y = h * (.3 + (Math.sin(x * .03) * .02)) + (r() < .3 ? -8 : 0); g.lineTo(x, y); } g.lineTo(w, h); g.lineTo(0, h); g.fill();
  for (let i = 0; i < 7; i++) { const x = 10 + r() * (w - 30), y = h * .3; g.fillRect(x, y - 30 - r() * 20, 14 + r() * 10, 50); for (let k = 0; k < 3; k++) g.fillRect(x + 2 + k * 6, y - 40 - r() * 20 - 4, 4, 12); }
  for (let i = 0; i < 8; i++) cloud(g, r() * w, h * .2 + r() * h * .1, 40 + r() * 50, 10 + r() * 10, "rgba(160,165,170,.25)");
  // Fassade mit Fenstern
  const fg = g.createLinearGradient(0, h * .34, 0, h); fg.addColorStop(0, "#2a2f33"); fg.addColorStop(1, "#3a3a38"); g.fillStyle = fg; g.fillRect(0, h * .36, w, h * .64);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) { const x = 22 + col * 100, y = h * .4 + row * 110; const lit = r() < .45;
    g.fillStyle = "#1a1e22"; g.fillRect(x - 4, y - 4, 64, 84); g.fillStyle = lit ? "#e8b860" : "#262c32"; g.fillRect(x, y, 56, 76);
    if (lit) { const lg = g.createRadialGradient(x + 28, y + 38, 2, x + 28, y + 38, 70); lg.addColorStop(0, "rgba(255,210,130,.45)"); lg.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = lg; g.fillRect(x - 40, y - 40, 136, 156);
      g.fillStyle = "rgba(120,60,30,.5)"; g.fillRect(x, y, 12, 76); g.fillRect(x + 44, y, 12, 76); }
    g.fillStyle = "#1a1e22"; g.fillRect(x + 26, y, 4, 76); g.fillRect(x, y + 36, 56, 4); g.fillStyle = "#4a4a44"; g.fillRect(x - 6, y + 80, 68, 6); }
  // Laterne unten
  const lx = w * .5, ly = h * .9; const lg = g.createRadialGradient(lx, ly - 30, 2, lx, ly - 30, 120); lg.addColorStop(0, "rgba(255,226,160,.95)"); lg.addColorStop(.2, "rgba(255,200,120,.45)"); lg.addColorStop(1, "rgba(255,190,110,0)"); g.fillStyle = lg; g.fillRect(0, h * .6, w, h * .4);
  g.fillStyle = "#121416"; g.fillRect(lx - 3, ly - 22, 6, h - ly + 22); g.beginPath(); g.moveTo(lx - 12, ly - 22); g.lineTo(lx + 12, ly - 22); g.lineTo(lx + 8, ly - 44); g.lineTo(lx - 8, ly - 44); g.fill();
  g.fillStyle = "#ffe6a8"; g.fillRect(lx - 6, ly - 40, 12, 16);
  const fog = g.createLinearGradient(0, h * .5, 0, h); fog.addColorStop(0, "rgba(170,175,175,0)"); fog.addColorStop(1, "rgba(170,170,165,.55)"); g.fillStyle = fog; g.fillRect(0, 0, w, h);
  speck(g, r, 0, 0, w, h, 2000, .1, ["#000", "#fff"]);
}
const LANDS = [
  [[-165, 65], [-140, 70], [-100, 72], [-80, 66], [-62, 58], [-55, 50], [-70, 44], [-76, 35], [-81, 26], [-90, 29], [-97, 26], [-105, 20], [-95, 16], [-83, 9], [-78, 8], [-88, 15], [-105, 22], [-117, 32], [-124, 42], [-130, 55], [-150, 60]],
  [[-80, 10], [-70, 12], [-60, 8], [-50, 0], [-35, -6], [-40, -22], [-48, -27], [-58, -38], [-65, -55], [-72, -50], [-72, -30], [-71, -18], [-78, -8], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 48], [-5, 54], [5, 58], [10, 54], [20, 60], [30, 70], [60, 72], [100, 76], [140, 72], [170, 68], [160, 60], [140, 55], [130, 42], [122, 32], [120, 22], [108, 12], [100, 8], [100, 20], [92, 22], [80, 10], [72, 20], [60, 25], [50, 30], [35, 36], [28, 40], [15, 40], [5, 37]],
  [[-17, 21], [-10, 32], [10, 37], [30, 32], [35, 28], [43, 12], [51, 11], [42, -2], [40, -15], [35, -24], [28, -34], [18, -34], [12, -18], [9, -2], [-8, 5], [-16, 12]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -18], [153, -26], [150, -37], [140, -38], [130, -32], [116, -34]],
  [[-50, 60], [-30, 68], [-22, 74], [-40, 82], [-60, 78], [-56, 70]]
];
function mGlobe(g, w, h, r){
  const sea = g.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, "#a8b8a0"); sea.addColorStop(.5, "#b8c4a8"); sea.addColorStop(1, "#98a890"); g.fillStyle = sea; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(90,110,100,.25)"; g.lineWidth = 1; const y = r() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * .05 + i) * 2); g.stroke(); }
  const P = ([lo, la]) => [(lo + 180) / 360 * w, (90 - la) / 180 * h];
  for (const L of LANDS) { g.fillStyle = "#d9c08a"; g.strokeStyle = "#7a5a2a"; g.lineWidth = 1.5; g.beginPath(); L.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); g.stroke();
    g.save(); g.clip(); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < .5 ? "150,110,60" : "120,140,80"},${r() * .3})`; g.fillRect(r() * w, r() * h, 3 + r() * 8, 2 + r() * 6); } g.restore(); }
  g.fillStyle = "#e8e2d0"; g.fillRect(0, h - 10, w, 10); g.fillRect(0, 0, w, 5);
  g.strokeStyle = "rgba(80,50,20,.4)"; g.lineWidth = 1; for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(i * w / 12, 0); g.lineTo(i * w / 12, h); g.stroke(); } for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, i * h / 6); g.lineTo(w, i * h / 6); g.stroke(); }
  g.strokeStyle = "rgba(160,40,30,.55)"; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); g.setLineDash([]);
  speck(g, r, 0, 0, w, h, 1800, .12, ["#5a3a1a", "#fff6dc"]);
}
function mBaro(g, w, h){
  const cx = w / 2, cy = h / 2, R = w / 2 - 4; g.fillStyle = brassGrad(g, 0, 0, w, h); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  const f = g.createRadialGradient(cx - 10, cy - 14, 4, cx, cy, R); f.addColorStop(0, "#fbf4e2"); f.addColorStop(1, "#dcc9a2"); g.fillStyle = f; g.beginPath(); g.arc(cx, cy, R - 10, 0, TAU); g.fill();
  g.strokeStyle = "#2a1a10"; g.lineWidth = 1.2; for (let i = 0; i <= 40; i++) { const a = PI * .75 + i / 40 * PI * 1.5, r1 = R - 16, r2 = R - (i % 5 ? 22 : 28); g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); g.stroke(); }
  g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `italic 600 13px ${FONT}`;
  ["Sturm", "Regen", "Veränderlich", "Schön", "Trocken"].forEach((s, i) => { const a = PI * .75 + (i + .5) / 5 * PI * 1.5; g.save(); g.translate(cx + Math.cos(a) * (R - 44), cy + Math.sin(a) * (R - 44)); g.rotate(a + PI / 2); g.fillText(s, 0, 0); g.restore(); });
  g.strokeStyle = "#1a120a"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(-.9) * (R - 30), cy + Math.sin(-.9) * (R - 30)); g.stroke();
  g.strokeStyle = "#b8893f"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(-1.3) * (R - 34), cy + Math.sin(-1.3) * (R - 34)); g.stroke();
  g.fillStyle = "#3a2614"; g.beginPath(); g.arc(cx, cy, 6, 0, TAU); g.fill(); g.font = `600 12px ${FONT}`; g.fillText("BAROMETER", cx, cy + 34);
}
function mBalloon(g, w, h){ const cols = ["#8e2a20", "#e8d8b0", "#24406a", "#e8d8b0"]; for (let i = 0; i < 16; i++) { g.fillStyle = cols[i % 4]; g.fillRect(i * w / 16, 0, w / 16 + 1, h); }
  g.fillStyle = "#d9b25c"; g.fillRect(0, h * .62, w, 6); g.fillRect(0, h * .78, w, 3); for (let i = 0; i < 16; i++) star(g, (i + .5) * w / 16, h * .7, 4, 5, "#d9b25c"); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, h - 6, w, 6); }
function mPhotos(g, r){
  for (let i = 0; i < 6; i++) { const [x, y, w, h] = PHOTO(i); g.save(); g.translate(x, y); g.fillStyle = "#f0ead8"; g.fillRect(2, 2, w - 4, h - 4);
    const px = 10, py = 10, pw = w - 20, ph = h - 34, sg = g.createLinearGradient(0, py, 0, py + ph); sg.addColorStop(0, "#b8a27e"); sg.addColorStop(1, "#5a4630"); g.fillStyle = sg; g.fillRect(px, py, pw, ph);
    g.fillStyle = "rgba(34,24,14,.85)"; g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
    if (i === 0) { g.fillRect(px + pw * .45, py + ph * .2, 5, ph); g.beginPath(); g.moveTo(px + pw * .38, py + ph * .2); g.lineTo(px + pw * .62, py + ph * .2); g.lineTo(px + pw * .56, py + ph * .08); g.lineTo(px + pw * .44, py + ph * .08); g.fill(); g.fillRect(px, py + ph * .85, pw, ph * .15); }
    else if (i === 1) { g.fillRect(px, py + ph * .55, pw, 6); for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(px + 18 + k * 36, py + ph * .9, 16, PI, 0); g.lineTo(px + 34 + k * 36, py + ph); g.lineTo(px + 2 + k * 36, py + ph); g.fill(); } g.fillRect(px + pw * .2, py + ph * .2, 14, ph * .4); g.fillRect(px + pw * .7, py + ph * .2, 14, ph * .4); }
    else if (i === 2) { g.beginPath(); g.ellipse(px + pw / 2, py + ph * .3, 12, 14, 0, 0, TAU); g.fill(); g.fillRect(px + pw / 2 - 20, py + ph * .14, 40, 6); g.fillRect(px + pw / 2 - 11, py + ph * .02, 22, ph * .13); g.beginPath(); g.moveTo(px + pw / 2 - 30, py + ph); g.lineTo(px + pw / 2 - 22, py + ph * .45); g.lineTo(px + pw / 2 + 22, py + ph * .45); g.lineTo(px + pw / 2 + 30, py + ph); g.fill(); }
    else if (i === 3) { for (let k = 0; k < 4; k++) { g.fillRect(px + k * pw / 4 + 2, py + ph * (.2 + (k % 2) * .1), pw / 4 - 4, ph); } g.fillStyle = "rgba(255,240,200,.6)"; for (let k = 0; k < 6; k++) g.fillRect(px + 8 + (k % 4) * 26, py + ph * .45 + (k / 4 | 0) * 20, 6, 8); }
    else if (i === 4) { g.beginPath(); g.ellipse(px + pw * .5, py + ph * .7, 30, 12, 0, 0, TAU); g.fill(); g.fillRect(px + pw * .35, py + ph * .4, 34, ph * .28); for (const s of [-1, 1]) { g.beginPath(); g.arc(px + pw * .5 + s * 24, py + ph * .86, 10, 0, TAU); g.fill(); } g.fillRect(px + pw * .1, py + ph * .5, 20, 26); }
    else { g.fillRect(px, py + ph * .8, pw, ph * .2); g.beginPath(); g.moveTo(px + 10, py + ph * .78); g.lineTo(px + pw - 10, py + ph * .78); g.lineTo(px + pw - 22, py + ph * .9); g.lineTo(px + 22, py + ph * .9); g.fill(); g.fillRect(px + pw * .3, py + ph * .2, 3, ph * .58); g.fillRect(px + pw * .6, py + ph * .3, 3, ph * .48); }
    speck(g, r, px, py, pw, ph, 300, .2, ["#000", "#fff"]); g.restore();
    g.fillStyle = "#3a2c1c"; g.font = `italic 13px ${FONT}`; g.textAlign = "center"; g.fillText(["Laterne", "Brücke", "Herr X", "Kai 7", "Droschke", "Dampfer"][i], w / 2, h - 10); g.restore(); }
}
function mNews(g, w, h, r){
  g.fillStyle = "#e6dec8"; g.fillRect(0, 0, w, h); speck(g, r, 0, 0, w, h, 2000, .12, ["#8a7a5a", "#fff"]);
  g.fillStyle = "#1e1812"; g.textAlign = "center"; g.font = `700 30px ${NEWS}`; g.fillText("Londoner Abendbote", w / 2, 40); g.fillRect(16, 50, w - 32, 3); g.fillRect(16, 56, w - 32, 1);
  g.font = `italic 13px ${NEWS}`; g.fillText("Nr. 1888 · Preis ein Penny · Abendausgabe", w / 2, 72); g.fillRect(16, 80, w - 32, 1);
  g.font = `700 22px ${NEWS}`; g.fillText("Neue Spur im Fall", w / 2, 106); g.font = `700 16px ${NEWS}`; g.fillText("der verschwundenen Messwerte", w / 2, 128);
  g.fillStyle = "#6a5a44"; g.fillRect(24, 144, 130, 96); g.fillStyle = "rgba(30,20,10,.7)"; g.beginPath(); g.moveTo(24, 240); g.lineTo(60, 180); g.lineTo(90, 210); g.lineTo(124, 160); g.lineTo(154, 240); g.fill();
  for (const x of [168, 24]) lines(g, r, x, x > 100 ? 146 : 252, x > 100 ? 128 : 272, x > 100 ? 11 : 12, 8.5, "rgba(30,24,18,.6)", 2);
  for (let c = 0; c < 2; c++) lines(g, r, 24 + c * 140, 360 - 6, 130, 2, 8.5, "rgba(30,24,18,.6)", 2);
  g.fillStyle = "#1e1812"; g.fillRect(160, 144, 1, 92);
}
function mMap(g, w, h, r){   // Rollkarte: Stadtplan mit Hafen, Kanälen und Bezirken
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#efe2c0"); gr.addColorStop(1, "#d8c49a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const blocks = ["rgba(210,160,120,.55)", "rgba(190,170,130,.5)", "rgba(220,190,140,.5)"];
  for (let i = 0; i < 140; i++) { g.save(); g.translate(30 + r() * (w - 60), 60 + r() * (h - 100)); g.rotate((r() - .5) * .6); g.fillStyle = blocks[i % 3]; g.fillRect(0, 0, 14 + r() * 26, 10 + r() * 18); g.strokeStyle = "rgba(90,60,30,.4)"; g.lineWidth = .8; g.strokeRect(0, 0, 14 + r() * 26, 10 + r() * 18); g.restore(); }
  g.strokeStyle = "#f6eed8"; g.lineCap = "round"; for (let i = 0; i < 26; i++) { g.lineWidth = 2 + r() * 3; g.beginPath(); let x = r() * w, y = 50 + r() * (h - 80); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 180; y += (r() - .5) * 110; g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = "#7f9cb0"; g.lineWidth = 26; g.beginPath(); g.moveTo(-10, h * .62); g.bezierCurveTo(w * .25, h * .48, w * .45, h * .8, w * .65, h * .62); g.bezierCurveTo(w * .8, h * .5, w * .9, h * .66, w + 10, h * .58); g.stroke();
  g.strokeStyle = "#a8c0cc"; g.lineWidth = 16; g.stroke();
  g.fillStyle = "#7f9cb0"; for (let i = 0; i < 4; i++) g.fillRect(w * .62 + i * 26, h * .66, 14, 40);
  for (const [x, y, rr] of [[w * .2, h * .3, 34], [w * .74, h * .3, 26]]) { g.fillStyle = "rgba(110,140,80,.6)"; g.beginPath(); g.ellipse(x, y, rr * 1.4, rr, .2, 0, TAU); g.fill(); }
  g.fillStyle = "#3a2614"; g.textAlign = "center"; g.font = `italic 600 14px ${FONT}`;
  for (const [s, x, y] of [["Altstadt", .38, .34], ["Hafenviertel", .76, .78], ["Nebelgasse", .18, .76], ["Park", .2, .31], ["Werften", .56, .88]]) g.fillText(s, x * w, y * h);
  g.fillStyle = "#a3241c"; for (const [x, y] of [[.3, .42], [.55, .3], [.7, .74], [.12, .64]]) { g.beginPath(); g.arc(x * w, y * h, 5, 0, TAU); g.fill(); }
  g.fillStyle = "rgba(242,232,206,.95)"; g.fillRect(w / 2 - 120, 12, 240, 40); g.strokeStyle = "#4a3420"; g.lineWidth = 2; g.strokeRect(w / 2 - 120, 12, 240, 40);
  g.fillStyle = "#3a2614"; g.font = `italic 700 22px ${FONT}`; g.fillText("Plan der Hafenstadt", w / 2, 39);
  compass(g, w - 44, 64, 20); frameRect(g, 0, 0, w, h, "#4a3420", 5);
  g.fillStyle = "#3a2614"; g.fillRect(24, h - 26, 80, 4); g.fillStyle = "#efe2c0"; g.fillRect(44, h - 26, 20, 4); g.font = `11px ${FONT}`; g.fillText("1 Meile", 64, h - 32);
}
function plate(g, w, h, r, title, draw){   // Kupferstich auf Elfenbein mit Titelzeile
  g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h); speck(g, r, 0, 0, w, h, 800, .12, ["#8a6a3a", "#fff"]);
  g.strokeStyle = "#3a2a1a"; g.lineWidth = 2; g.strokeRect(10, 10, w - 20, h - 20); g.lineWidth = .8; g.strokeRect(14, 14, w - 28, h - 28);
  g.save(); g.translate(w / 2, h * .46); g.strokeStyle = "#2a1e12"; g.fillStyle = "#2a1e12"; g.lineWidth = 1.6; draw(g); g.restore();
  g.fillStyle = "#2a1e12"; g.font = `italic 600 14px ${FONT}`; g.textAlign = "center"; g.fillText(title, w / 2, h - 22);
}
const hatch = (g, x, y, w, h, n) => { g.save(); g.lineWidth = .7; for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(x + i * w / n, y); g.lineTo(x + i * w / n, y + h); g.stroke(); } g.restore(); };
function mPlates(g, r){
  inCell(g, CM.T0, (g, w, h) => plate(g, w, h, r, "Tafel I. – Elektrisiermaschine", g => {
    g.beginPath(); g.arc(-10, -6, 46, 0, TAU); g.stroke(); g.beginPath(); g.arc(-10, -6, 6, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(-10 + Math.cos(a) * 18, -6 + Math.sin(a) * 18); g.lineTo(-10 + Math.cos(a) * 40, -6 + Math.sin(a) * 40); g.stroke(); }
    g.strokeRect(-80, 46, 140, 10); hatch(g, -80, 46, 140, 10, 30); g.fillRect(-14, -6, 8, 54); g.beginPath(); g.moveTo(44, 40); g.lineTo(60, -30); g.stroke(); g.beginPath(); g.arc(60, -34, 6, 0, TAU); g.fill(); g.beginPath(); g.arc(78, -30, 6, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(66, -34); g.lineTo(70, -28); g.lineTo(68, -36); g.lineTo(72, -31); g.stroke(); }));
  inCell(g, CM.T1, (g, w, h) => plate(g, w, h, r, "Tafel II. – Das Fernrohr", g => {
    g.save(); g.rotate(-.35); g.strokeRect(-70, -12, 120, 18); hatch(g, -70, -12, 120, 18, 24); g.strokeRect(50, -15, 18, 24); g.strokeRect(-84, -8, 14, 10); g.restore();
    g.beginPath(); g.moveTo(0, 6); g.lineTo(-30, 56); g.moveTo(0, 6); g.lineTo(28, 56); g.moveTo(0, 6); g.lineTo(4, 58); g.stroke();
    g.setLineDash([3, 3]); g.beginPath(); g.moveTo(66, -46); g.lineTo(110, -70); g.moveTo(68, -36); g.lineTo(110, -50); g.stroke(); g.setLineDash([]); }));
  inCell(g, CM.T2, (g, w, h) => plate(g, w, h, r, "Tafel III. – Dampfwagen", g => {
    g.strokeRect(-70, -20, 80, 30); hatch(g, -70, -20, 80, 30, 20); g.strokeRect(10, -36, 40, 46); g.strokeRect(-62, -44, 12, 24); g.beginPath(); g.moveTo(-66, -44); g.lineTo(-46, -44); g.stroke();
    for (const [x, rr] of [[-52, 12], [-22, 12], [28, 18]]) { g.beginPath(); g.arc(x, 24, rr, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, 24, 2, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(-90, 42); g.lineTo(80, 42); g.stroke(); for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-56 - i * 6, -52 - i * 6, 4 + i * 2, 0, TAU); g.stroke(); } }));
  inCell(g, CM.T3, (g, w, h) => plate(g, w, h, r, "Tafel IV. – Flaschenzug", g => {
    g.beginPath(); g.moveTo(-60, -62); g.lineTo(60, -62); g.stroke(); hatch(g, -60, -70, 120, 8, 30);
    for (const [y, x] of [[-40, 0], [10, 0]]) { g.beginPath(); g.arc(x - 12, y, 12, 0, TAU); g.stroke(); g.beginPath(); g.arc(x + 12, y, 12, 0, TAU); g.stroke(); }
    g.beginPath(); g.moveTo(0, -62); g.lineTo(0, -52); for (const dx of [-24, 0, 24]) { g.moveTo(dx, -40); g.lineTo(dx, 10); } g.stroke();
    g.strokeRect(-18, 30, 36, 30); hatch(g, -18, 30, 36, 30, 10); g.beginPath(); g.moveTo(0, 22); g.lineTo(0, 30); g.stroke(); g.font = `italic 12px ${FONT}`; g.textAlign = "center"; g.fillText("F = G : 4", 60, 50); }));
}
const dtex = {
  bilder: () => U.canvasTex(1024, 1024, g => {
    g.fillStyle = "#2a2118"; g.fillRect(0, 0, 1024, 1024);
    [[CB.L, pLandscape, 11], [CB.S, pSea, 12], [CB.V, pStill, 13], [CB.P1, pLady, 14], [CB.P2, pHound, 15], [CB.W, pCrest, 16], [CB.N, pStars, 17], [CB.E, pCollage, 18]]
      .forEach(([c, f, s]) => inCell(g, c, (g, w, h) => f(g, w, h, U.seeded(s))));
  }, "dd-bilder"),
  misc: () => U.canvasTex(1024, 1024, g => {
    g.fillStyle = "#6a5a44"; g.fillRect(0, 0, 1024, 1024);
    [[CM.F, mView, 21], [CM.G, mGlobe, 22], [CM.B, mBaro, 23], [CM.Bl, mBalloon, 24], [CM.Z, mNews, 25], [CM.K, mMap, 26]].forEach(([c, f, s]) => inCell(g, c, (g, w, h) => f(g, w, h, U.seeded(s))));
    mPhotos(g, U.seeded(27)); mPlates(g, U.seeded(28));
  }, "dd-misc"),
  velvet: () => U.canvasTex(256, 256, (g, w, h) => { const r = U.seeded(31); g.fillStyle = "#bdbdbd"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) { const v = 180 + 30 * Math.sin(x / w * TAU * 3) + (r() - .5) * 20; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.fillRect(x, 0, 2, h); }
    for (let i = 0; i < 4000; i++) { g.fillStyle = r() < .5 ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.08)"; g.fillRect(r() * w, r() * h, 1, 2 + r() * 4); } }, "dd-velvet", [1, 1]),
  nebel: () => U.canvasTex(512, 256, (g, w, h) => { const r = U.seeded(32); g.clearRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const x = r() * w, y = h * (.25 + r() * .7), rx = 40 + r() * 90, ry = 10 + r() * 26; for (const dx of [-w, 0, w]) cloud(g, x + dx, y, rx, ry, `rgba(235,235,230,${.12 + r() * .18})`); } }, "dd-nebel", [1, 1]),
  frond: () => U.canvasTex(256, 128, (g, w, h) => { const r = U.seeded(33); g.clearRect(0, 0, w, h);
    g.strokeStyle = "#5e7a3a"; g.lineWidth = 3; g.beginPath(); g.moveTo(4, h / 2); g.lineTo(w - 6, h / 2); g.stroke();
    for (let i = 0; i < 26; i++) { const x = 10 + i * (w - 20) / 26, L = (h / 2 - 6) * Math.sin((1 - i / 26) * PI * .55 + .45) * (.85 + r() * .15);
      for (const s of [-1, 1]) { const lg = g.createLinearGradient(x, h / 2, x + 14, h / 2 + s * L); lg.addColorStop(0, "#3d6a2a"); lg.addColorStop(1, "#7ea24a");
        g.fillStyle = lg; g.beginPath(); g.moveTo(x - 2, h / 2); g.quadraticCurveTo(x + 6 - s, h / 2 + s * L * .5, x + 12, h / 2 + s * L); g.quadraticCurveTo(x + 8, h / 2 + s * L * .5, x + 5, h / 2); g.closePath(); g.fill(); } } }, "dd-frond")
};

/* ---------- Materialien (gecacht, userData.keep) ---------- */
const DM = new Map(), keepM = m => { m.userData.keep = true; return m; };
const MK = {
  bild: () => new T3.MeshStandardMaterial({map: dtex.bilder(), roughness: .62}),
  misc: () => new T3.MeshStandardMaterial({map: dtex.misc(), roughness: .6}),
  win: () => new T3.MeshBasicMaterial({map: dtex.misc(), color: 0x8a919a, toneMapped: false}),
  nebel: () => new T3.MeshBasicMaterial({map: dtex.nebel(), color: 0xd6dade, transparent: true, opacity: .55, depthWrite: false, toneMapped: false}),
  velvet: () => new T3.MeshStandardMaterial({map: dtex.velvet(), vertexColors: true, roughness: .95, side: T3.DoubleSide}),
  frond: () => new T3.MeshStandardMaterial({map: dtex.frond(), vertexColors: true, alphaTest: .4, side: T3.DoubleSide, roughness: .75}),
  gfringe: () => new T3.MeshStandardMaterial({map: tex.fringe(), color: 0xd9b25c, alphaTest: .35, roughness: .55, metalness: .4, side: T3.DoubleSide}),
  smoke: () => new T3.MeshBasicMaterial({map: tex.fog(), color: 0xd8d0c4, transparent: true, opacity: .3, depthWrite: false}),
  shadeF: () => new T3.MeshStandardMaterial({color: 0xe8c890, emissive: 0xffaa50, emissiveIntensity: .85, roughness: .8, side: T3.DoubleSide}),
  fil: () => new T3.MeshBasicMaterial({color: 0xffc070, toneMapped: false}),
  glass: () => new T3.MeshStandardMaterial({color: 0xe4efe6, transparent: true, opacity: .18, roughness: .05, metalness: .2, depthWrite: false}),
  glassD: () => new T3.MeshStandardMaterial({color: 0xbcd6e4, transparent: true, opacity: .42, roughness: .05, metalness: .3, depthWrite: false, side: T3.DoubleSide}),
  halo: () => new T3.PointsMaterial({map: U.glowTex(), color: 0xffc98a, size: .6, transparent: true, opacity: .8, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false})
};
const dm = k => DM.get(k) || (DM.set(k, keepM(MK[k]())), DM.get(k));
const KEYMAT = {dark: () => mat("darkwood"), wood: () => mat("wood"), brass: () => mat("brass"), gilt: () => kmat("gilt"), iron: () => kmat("iron"), steel: () => mat("steel"),
  copper: () => mat("copper"), vc: () => kmat("vc"), paper: () => mat("paper"), bild: () => dm("bild"), misc: () => dm("misc"), win: () => dm("win"), velvet: () => dm("velvet"),
  frond: () => dm("frond"), gfringe: () => dm("gfringe"), marble: () => mat("stone"), face: () => kmat("face"), globe: () => kmat("globe"), shade: () => kmat("shade"),
  shadeF: () => dm("shadeF"), wax: () => kmat("wax"), fil: () => dm("fil"), glass: () => dm("glass"), glassD: () => dm("glassD"), nebel: () => dm("nebel"), mirror: () => kmat("mirror"), wains: () => kmat("wains")};
const COLOR_KEYS = new Set(["vc", "velvet", "frond"]);

/* ---------- Zustand des laufenden Ausstattungsbaus ---------- */
let K = null, BK = null, R = null, CTX = null, HH = 6.5, HALOS = null;
const o_ = c => c != null ? {c} : {};
const fr = base => ({base, m: (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => base.clone().multiply(M(x, y, z, rx, ry, rz, sx, sy, sz)),
  p: (x, y, z) => V3(x, y, z).applyMatrix4(base)});
const subF = (F, x, z, ry = 0, y = 0) => fr(F.m(x, y, z, 0, ry));
const sg_ = (n, min = 4) => Math.max(min, Math.round(n * .68));   // Segmente sparsam: kleine Teile brauchen keine runden Kanten
function bx(k, w, h, d, m, c){ K.add(k, new T3.BoxGeometry(w, h, d), m, o_(c)); }
function cy(k, rt, rb, h, seg, m, c, open){ K.add(k, new T3.CylinderGeometry(rt, rb, h, Math.max(rt, rb) > .15 ? seg : sg_(seg, 5), 1, !!open), m, o_(c)); }
function sp(k, rad, ws, hs, m, c){ K.add(k, new T3.SphereGeometry(rad, rad > .1 ? ws : sg_(ws, 5), rad > .1 ? hs : sg_(hs, 3)), m, o_(c)); }
function tor(k, Rr, rr, rs, ts, m, c, arc){ K.add(k, new T3.TorusGeometry(Rr, rr, sg_(rs, 3), Rr > .2 ? ts : sg_(ts, 6), arc ?? TAU), m, o_(c)); }
function lat(k, pts, seg, m, c){ K.add(k, new T3.LatheGeometry(pts.map(([x, y]) => new T3.Vector2(x, y)), sg_(seg, 8)), m, o_(c)); }
function pln(k, w, h, m, o){ K.add(k, new T3.PlaneGeometry(w, h), m, o || {}); }
function cone(k, rad, h, seg, m, c){ K.add(k, new T3.ConeGeometry(rad, h, seg), m, o_(c)); }
function tub(k, F, pts, rad, seg, rs, c){ K.add(k, new T3.TubeGeometry(new T3.CatmullRomCurve3(pts.map(p => V3(...p))), sg_(seg, 4), rad, Math.max(3, rs - 1)), F.m(), o_(c)); }
const _up = V3(0, 1, 0);
function rod(k, F, a, b, rad, seg = 5, c){   // Stab zwischen zwei Punkten (lokal im Rahmen F), ohne Deckel
  const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); if (L < 1e-4) return;
  const m = F.base.clone().multiply(new T3.Matrix4().compose(V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), new T3.Quaternion().setFromUnitVectors(_up, d.normalize()), V3(1, 1, 1)));
  K.add(k, new T3.CylinderGeometry(rad, rad, L, rad < .01 ? 3 : Math.min(seg, 6), 1, true), m, o_(c)); }
const tint = (hex, k) => "#" + new T3.Color(hex).multiplyScalar(k).getHexString();
function withK(fn){ const prev = K; K = bucket(); fn(); const out = K; K = prev; return out; }
function meshes(Bk, parent, o = {}){   // alle Materialgruppen eines Sammlers als Meshes (je Material ein Zeichenaufruf)
  for (const k in KEYMAT) { const geo = Bk.geo(k, COLOR_KEYS.has(k)); if (!geo) continue;
    const me = new T3.Mesh(geo, KEYMAT[k]()); me.castShadow = false; me.receiveShadow = !o.noRecv && !["win", "nebel", "glass", "fil", "globe", "shadeF"].includes(k);
    me.userData.noPick = true; if (k === "nebel") me.renderOrder = 1; parent.add(me); }
}

/* ---------- Bücher ---------- */
const BCOL = ["#6e2a22", "#7b2d26", "#2f5d5d", "#24402f", "#1f2b47", "#5a3a22", "#8a5a2b", "#2a2118", "#4a1f2a", "#3b5b4a", "#b08850", "#5c4a3a"];
function book(F, x, y, z, sx, sy, sz, rz = 0, ry = 0){ BK.push([F.m(x, y, z, 0, ry, rz, sx, sy, sz), BCOL[(R() * BCOL.length) | 0], .78 + R() * .42]); }
function bookRow(F, x0, x1, y, z, hmax, dmax = .22){
  let x = x0;
  while (x < x1 - .03) { const q = R();
    if (q < .06) { x += .05 + R() * .1; continue; }
    if (q < .1 && x1 - x > .3) { let yy = y; const len = .18 + R() * .06, dp = Math.min(dmax, .15 + R() * .05);
      for (let b = 0, nb = 2 + (R() * 3 | 0); b < nb; b++) { const th = .028 + R() * .022; book(F, x + len / 2, yy + th / 2, z, len, th, dp, 0, (R() - .5) * .12); yy += th; } x += len + .03; continue; }
    const th = .022 + R() * .04, hb = hmax * (.68 + R() * .32), dp = Math.min(dmax, .14 + R() * .07), tilt = R() < .06 && x - x0 > .2 ? .17 : 0;
    if (x + th > x1) break;
    book(F, x + th / 2 + tilt * hb * .5, y + hb / 2 - tilt * .01, z, th, hb, dp, -tilt); x += th + .003 + tilt * hb * .9; }
}
function bookStack(F, x, y, z, n = 3){ let yy = y; for (let i = 0; i < n; i++) { const th = .03 + R() * .025, L = .2 + R() * .06; book(F, x, yy + th / 2, z, L, th, .15 + R() * .04, 0, (R() - .5) * .3); yy += th; } return yy; }

/* ---------- Kleinteile für Ablagen ---------- */
function bankerLamp(F, x, y, z, ry = 0){ const C = subF(F, x, z, ry, y);
  cy("brass", .07, .085, .028, 16, C.m(0, .014, 0)); cy("brass", .01, .01, .28, 6, C.m(0, .16, 0), null, true); bx("brass", .28, .012, .012, C.m(0, .3, 0));
  K.add("shade", new T3.CylinderGeometry(.09, .09, .32, 16, 1, true, 0, PI), C.m(0, .335, 0, 0, 0, PI / 2)); for (const s of [-1, 1]) tor("brass", .09, .005, 4, 12, C.m(s * .16, .335, 0, 0, PI / 2, 0), null, PI);
  HALOS.push(C.p(0, .31, .02)); }
function candle(F, x, y, z){ cy("brass", .045, .06, .02, 12, F.m(x, y + .01, z)); cy("brass", .012, .02, .16, 8, F.m(x, y + .1, z)); cy("brass", .028, .02, .02, 10, F.m(x, y + .19, z));
  cy("wax", .014, .014, .14, 8, F.m(x, y + .27, z)); cone("fil", .008, .03, 6, F.m(x, y + .36, z)); HALOS.push(F.p(x, y + .36, z)); }
function mantelClock(F, x, y, z){ bx("dark", .3, .22, .12, F.m(x, y + .11, z)); cy("dark", .15, .15, .12, 16, F.m(x, y + .22, z, PI / 2), null);
  bx("dark", .36, .03, .15, F.m(x, y + .015, z)); tor("brass", .085, .008, 6, 20, F.m(x, y + .2, z + .062)); K.add("face", new T3.CircleGeometry(.082, 20), F.m(x, y + .2, z + .061)); }
function smallGlobe(F, x, y, z, s = 1){ cy("dark", .07 * s, .09 * s, .03 * s, 12, F.m(x, y + .015 * s, z)); cy("dark", .012 * s, .016 * s, .12 * s, 6, F.m(x, y + .09 * s, z));
  K.add("misc", new T3.SphereGeometry(.11 * s, 16, 12), F.m(x, y + .27 * s, z, 0, R() * TAU, .41), {uvr: uvc(CM.G)}); tor("brass", .12 * s, .005 * s, 4, 20, F.m(x, y + .27 * s, z, 0, PI / 2, .41)); }
function fileStack(F, x, y, z){ let yy = y; const cs = ["#c9a46a", "#b07a3a", "#6e2a22", "#2f5d5d", "#8a5a2b"];
  for (let i = 0, n = 3 + (R() * 4 | 0); i < n; i++) { const h = .015 + R() * .02, ry = (R() - .5) * .14; if (i % 2) bx("paper", .3, h, .22, F.m(x, yy + h / 2, z, 0, ry)); else bx("vc", .32, h, .24, F.m(x, yy + h / 2, z, 0, ry), cs[(R() * cs.length) | 0]); yy += h; }
  bx("vc", .33, .006, .024, F.m(x, yy + .003, z), "#a3241c"); return yy; }
function vase(F, x, y, z, s = 1, col = "#2a3a5a"){ lat("vc", [[0, 0], [.07, 0], [.09, .05], [.11, .16], [.08, .27], [.05, .32], [.065, .36], [.06, .37]].map(([a, b]) => [a * s, b * s]), 14, F.m(x, y, z), col);
  tor("gilt", .1 * s, .006 * s, 4, 16, F.m(x, y + .16 * s, z, PI / 2)); }
function hourglass(F, x, y, z){ for (const yy of [0, .2]) cy("dark", .06, .06, .02, 10, F.m(x, y + .01 + yy, z)); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; cy("dark", .006, .006, .18, 5, F.m(x + Math.cos(a) * .05, y + .11, z + Math.sin(a) * .05)); }
  lat("glass", [[.001, 0], [.04, .01], [.042, .06], [.008, .09], [.042, .12], [.04, .17], [.001, .18]], 12, F.m(x, y + .02, z)); cone("vc", .03, .04, 10, F.m(x, y + .042, z), "#d8b878"); }
function inkSet(F, x, y, z){ bx("dark", .26, .02, .14, F.m(x, y + .01, z)); for (const s of [-1, 1]) { bx("glass", .05, .05, .05, F.m(x + s * .07, y + .045, z)); cy("brass", .02, .02, .015, 8, F.m(x + s * .07, y + .078, z)); }
  K.add("vc", new T3.ConeGeometry(.006, .24, 5), F.m(x + .02, y + .1, z - .02, 0, 0, -.4), {c: "#efe8da"}); }
function typewriter(F, x, y, z, ry = 0){ const C = subF(F, x, z, ry, y);
  bx("vc", .4, .1, .3, C.m(0, .05, 0), "#18171a"); bx("vc", .36, .06, .16, C.m(0, .1, -.06, -.3), "#1e1d22");
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) bx("vc", .02, .012, .02, C.m(-.14 + i * .035 + (r % 2) * .015, .095 + r * .018, .14 - r * .03), "#e8e2d0");
  cy("vc", .028, .028, .44, 12, C.m(0, .19, -.07, 0, 0, PI / 2), "#121214"); for (const s of [-1, 1]) cy("steel", .03, .03, .02, 10, C.m(s * .23, .19, -.07, 0, 0, PI / 2));
  pln("paper", .21, .26, C.m(0, .31, -.1, -.25)); tor("steel", .1, .006, 4, 12, C.m(0, .12, .02, PI / 2.6, 0, 0), null, PI); bx("steel", .05, .004, .07, C.m(-.22, .2, -.05)); }
function microscope(F, x, y, z, ry = 0){ const C = subF(F, x, z, ry, y);
  bx("brass", .14, .025, .18, C.m(0, .0125, 0)); bx("brass", .03, .16, .04, C.m(0, .1, -.05)); bx("brass", .1, .012, .09, C.m(0, .12, .01)); K.add("glass", new T3.CircleGeometry(.03, 12), C.m(0, .055, .03, -PI / 2.6));
  tor("brass", .03, .005, 4, 12, C.m(0, .055, .03, -PI / 2.6)); tub("brass", C, [[0, .17, -.05], [0, .23, -.03], [0, .28, 0]], .012, 8, 6);
  cy("brass", .022, .02, .2, 12, C.m(0, .26, .02, -.18)); cy("vc", .012, .016, .05, 10, C.m(0, .145, .036, -.18), "#1a1a1a"); cy("brass", .016, .016, .05, 10, C.m(0, .375, .0, -.18));
  cy("brass", .02, .02, .015, 10, C.m(.035, .2, -.03, 0, 0, PI / 2)); }
function magnifier(F, x, y, z, rz){ const C = subF(F, x, z, 0, y); tor("brass", .06, .008, 5, 18, C.m(0, .01, 0, PI / 2, 0, 0)); K.add("glass", new T3.CircleGeometry(.055, 16), C.m(0, .011, 0, -PI / 2));
  cy("dark", .009, .012, .13, 6, C.m(Math.cos(rz) * .13, .012, Math.sin(rz) * .13, PI / 2, -rz + PI / 2, 0)); }
function leyden(F, x, y, z, s = 1){ cy("glass", .068 * s, .068 * s, .24 * s, 14, F.m(x, y + .12 * s, z), null, true); cy("steel", .071 * s, .071 * s, .13 * s, 14, F.m(x, y + .066 * s, z), null, true);
  cy("steel", .063 * s, .063 * s, .12 * s, 12, F.m(x, y + .062 * s, z), null, true); cy("dark", .072 * s, .072 * s, .018 * s, 14, F.m(x, y + .245 * s, z));
  cy("brass", .006 * s, .006 * s, .2 * s, 5, F.m(x, y + .34 * s, z), null, true); sp("brass", .024 * s, 10, 8, F.m(x, y + .45 * s, z)); }
function voltaPile(F, x, y, z){ bx("dark", .22, .03, .22, F.m(x, y + .015, z)); bx("dark", .2, .02, .2, F.m(x, y + .44, z));
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; cy("glass", .007, .007, .41, 6, F.m(x + Math.cos(a) * .075, y + .235, z + Math.sin(a) * .075)); }
  for (let i = 0; i < 14; i++) { const yy = y + .04 + i * .028; cy("copper", .045, .045, .008, 12, F.m(x, yy, z)); cy("steel", .045, .045, .008, 12, F.m(x, yy + .009, z)); cy("vc", .043, .043, .009, 12, F.m(x, yy + .018, z), "#5a3a22"); }
  for (const [dy, dx] of [[.04, .12], [.43, -.12]]) { cy("brass", .012, .012, .03, 8, F.m(x + dx * .8, y + dy + .02, z)); }
  tub("vc", F, [[x + .1, y + .07, z], [x + .2, y + .1, z + .05], [x + .24, y + .03, z + .1]], .005, 10, 4, "#7a2a1a"); }

/* ---------- Möbel an der Wand (Rahmen F: x entlang der Wand, y oben, z von der Wand in den Raum) ---------- */
function cabinet(F, x, W, Hc, D, o = {}){   // Aktenschrank mit Schubladen, Messinggriffen und Etiketten
  const C = subF(F, x, 0), body = o.wood ? "wood" : "dark", front = o.wood ? "dark" : "wood";
  bx("dark", W + .04, .1, D + .02, C.m(0, .05, (D + .02) / 2)); bx(body, W, Hc - .1, D - .02, C.m(0, .1 + (Hc - .1) / 2, (D - .02) / 2));
  bx("dark", W + .08, .04, D + .06, C.m(0, Hc + .02, (D + .06) / 2)); bx("dark", W + .03, .03, D + .03, C.m(0, Hc - .015, (D + .03) / 2));
  const cols = o.cols || Math.max(1, Math.round(W / .42)), rows = o.rows || 5, gp = .028, fw = (W - gp * (cols + 1)) / cols, y0 = .13, fh = (Hc - .17 - gp * (rows - 1)) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const xx = -W / 2 + gp + fw / 2 + i * (fw + gp), yy = y0 + fh / 2 + j * (fh + gp), pull = R() < .08 ? .05 + R() * .1 : 0;
    bx(front, fw, fh, .022, C.m(xx, yy, D - .01 + pull));
    if (pull) { bx(body, fw - .03, fh - .03, pull, C.m(xx, yy, D - .02 + pull / 2)); bx("paper", fw - .1, .025, pull + .04, C.m(xx, yy + fh / 2 - .01, D - .03 + pull / 2, 0, (R() - .5) * .2)); }
    bx("brass", .08, .045, .006, C.m(xx, yy + fh * .2, D + .003 + pull)); bx("paper", .064, .032, .004, C.m(xx, yy + fh * .2, D + .007 + pull));
    bx("brass", .1, .018, .022, C.m(xx, yy - fh * .16, D + .012 + pull)); }
}
function shelfLow(F, x, W, Hs, D){   // offenes Bücherbord mit zwei Fächern
  const C = subF(F, x, 0);
  for (const s of [-1, 1]) bx("dark", .04, Hs, D, C.m(s * (W / 2 - .02), Hs / 2, D / 2));
  bx("dark", W + .06, .04, D + .04, C.m(0, Hs + .02, (D + .04) / 2)); bx("dark", W, .08, D, C.m(0, .04, D / 2)); bx("wood", W - .06, Hs, .015, C.m(0, Hs / 2, .008));
  const n = 2, sp_ = (Hs - .1) / n; for (let k = 1; k < n; k++) bx("dark", W - .08, .03, D - .02, C.m(0, .08 + k * sp_, D / 2));
  for (let k = 0; k < n; k++) bookRow(C, -W / 2 + .05, W / 2 - .05, .08 + k * sp_ + (k ? .015 : 0), D / 2 + .02, Math.min(.34, sp_ - .06), D - .06);
}
function vitrine(F, x, W, D, fill, o = {}){   // Vitrine: Unterschrank, Glaskasten mit Samtboden, Glasboden; fill(C, yBoden, yZwischen)
  const C = subF(F, x, 0), Hb = .8, Hg = .95, col = o.col || "#5a1820";
  bx("dark", W + .04, .08, D + .04, C.m(0, .04, (D + .04) / 2)); bx("dark", W, Hb - .08, D, C.m(0, .08 + (Hb - .08) / 2, D / 2));
  for (const s of [-1, 1]) { bx("wood", W / 2 - .08, Hb - .26, .015, C.m(s * W / 4, .44, D + .005)); sp("brass", .015, 8, 6, C.m(s * .06, .5, D + .02)); }
  bx("dark", W + .04, .03, D + .04, C.m(0, Hb + .015, (D + .04) / 2)); bx("velvet", W - .06, .01, D - .06, C.m(0, Hb + .035, D / 2), col);
  for (const sx of [-1, 1]) for (const z of [.02, D - .02]) bx("dark", .03, Hg, .03, C.m(sx * (W / 2 - .015), Hb + .03 + Hg / 2, z));
  bx("dark", W + .02, .05, D + .02, C.m(0, Hb + Hg + .055, D / 2)); bx("dark", W + .1, .04, D + .08, C.m(0, Hb + Hg + .1, (D + .08) / 2)); bx("gilt", W + .1, .012, .012, C.m(0, Hb + Hg + .08, D + .045));
  bx("glass", W - .04, Hg, .006, C.m(0, Hb + .03 + Hg / 2, D - .02)); for (const s of [-1, 1]) bx("glass", .006, Hg, D - .04, C.m(s * (W / 2 - .015), Hb + .03 + Hg / 2, D / 2));
  bx("glass", W - .06, .008, D - .06, C.m(0, Hb + .03 + Hg * .52, D / 2));
  fill(C, Hb + .04, Hb + .035 + Hg * .52 + .005, W, D);
}
function chest(F, x, W, D, Hc, ry = 0){   // Seekiste mit gewölbtem Deckel, Beschlägen und Griffen
  const C = subF(F, x, D / 2 + .02, ry);
  bx("wood", W, Hc, D, C.m(0, Hc / 2, 0)); K.add("wood", new T3.CylinderGeometry(D / 2, D / 2, W, 14, 1, false, 0, PI), C.m(0, Hc, 0, 0, 0, PI / 2, .3, 1, 1));
  for (const s of [-1, 1]) { bx("iron", .05, Hc + .004, D + .01, C.m(s * W * .3, Hc / 2, 0)); tor("iron", D / 2 + .004, .012, 4, 12, C.m(s * W * .3, Hc, 0, 0, PI / 2, 0, 1, .3, 1), null, PI);
    for (const sz of [-1, 1]) bx("brass", .07, .07, .07, C.m(s * (W / 2 - .03), .035, sz * (D / 2 - .03)));
    tor("iron", .05, .008, 4, 10, C.m(s * (W / 2 + .01), Hc * .62, 0, 0, PI / 2, PI), null, PI); }
  bx("iron", W + .005, .04, D + .01, C.m(0, .1, 0)); bx("brass", .09, .11, .01, C.m(0, Hc - .03, D / 2 + .005)); cy("dark", .008, .008, .012, 6, C.m(0, Hc - .05, D / 2 + .012, PI / 2));
}
function suitcase(F, x, y, z, W, Hs, D, col, ry = 0){ const C = subF(F, x, z, ry, y);
  bx("vc", W, Hs, D, C.m(0, Hs / 2, 0), col); bx("vc", W + .006, .012, D + .006, C.m(0, Hs * .62, 0), tint(col, .7));
  for (const s of [-1, 1]) { bx("vc", .035, Hs + .006, D + .006, C.m(s * W * .28, Hs / 2, 0), tint(col, .55)); bx("brass", .03, .03, .012, C.m(s * W * .12, Hs * .62, D / 2 + .006)); }
  tor("vc", .05, .01, 4, 10, C.m(0, Hs + .005, 0, 0, 0, 0), tint(col, .5), PI);
  for (const sx of [-1, 1]) for (const sy of [0, 1]) bx("brass", .04, .04, D + .01, C.m(sx * (W / 2 - .015), sy ? Hs - .015 : .015, 0));
}
function globeStand(F, x, z, s = 1, anim){   // Globus auf Dreibein mit Horizontring und Meridian
  const C = subF(F, x, z, 0);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .3, c = Math.cos(a), sn = Math.sin(a);
    tub("dark", C, [[c * .3 * s, 0, sn * .3 * s], [c * .24 * s, .3 * s, sn * .24 * s], [c * .33 * s, .62 * s, sn * .33 * s], [c * .36 * s, .78 * s, sn * .36 * s]], .022 * s, 10, 5);
    sp("dark", .03 * s, 6, 4, C.m(c * .3 * s, .02, sn * .3 * s)); }
  tor("dark", .19 * s, .014 * s, 5, 20, C.m(0, .3 * s, 0, PI / 2)); cy("dark", .02 * s, .03 * s, .3 * s, 8, C.m(0, .45 * s, 0)); cy("dark", .05 * s, .03 * s, .06 * s, 10, C.m(0, .32 * s, 0));
  K.add("wood", new T3.RingGeometry(.33 * s, .4 * s, 32), C.m(0, .8 * s, 0, -PI / 2)); K.add("paper", new T3.RingGeometry(.335 * s, .395 * s, 32), C.m(0, .802 * s, 0, -PI / 2));
  tor("dark", .4 * s, .01 * s, 4, 32, C.m(0, .795 * s, 0, PI / 2));
  tor("brass", .33 * s, .01 * s, 5, 32, C.m(0, .8 * s, 0, 0, PI / 2, .41)); cy("brass", .02 * s, .03 * s, .1 * s, 8, C.m(0, .44 * s, 0));
  const ctr = C.p(0, .8 * s, 0);
  if (anim) return {ctr, r: .3 * s};
  K.add("misc", new T3.SphereGeometry(.3 * s, 24, 16), C.m(0, .8 * s, 0, 0, R() * TAU, .41), {uvr: uvc(CM.G)}); return null;
}
function umbrellaStand(F, x, z){ const C = subF(F, x, z);
  lat("vc", [[0, 0], [.13, 0], [.14, .02], [.13, .1], [.12, .5], [.135, .53], [.13, .55], [.11, .55], [.1, .06], [0, .05]], 16, C.m(), "#2a3a5a");
  tor("gilt", .125, .006, 4, 18, C.m(0, .1, 0, PI / 2)); tor("gilt", .125, .006, 4, 18, C.m(0, .45, 0, PI / 2));
  for (const [dx, dz, rz, col] of [[-.03, .02, .1, "#151313"], [.04, -.02, -.12, "#2a1c18"]]) { cone("vc", .05, .6, 8, C.m(dx, .62, dz, 0, 0, rz), col); cy("dark", .008, .008, .25, 5, C.m(dx - Math.sin(rz) * .38, .98, dz, 0, 0, rz));
    tub("dark", C, [[dx - Math.sin(rz) * .5, 1.1, dz], [dx - Math.sin(rz) * .5 + .02, 1.17, dz], [dx - Math.sin(rz) * .5 + .08, 1.16, dz], [dx - Math.sin(rz) * .5 + .08, 1.12, dz]], .01, 8, 4); }
  rod("dark", C, [.02, .05, .03], [-.07, .95, .05], .012, 6); tub("dark", C, [[-.07, .95, .05], [-.06, 1.0, .05], [-.0, 1.0, .05], [.01, .96, .05]], .013, 8, 5); sp("brass", .015, 6, 4, C.m(-.07, .95, .05));
}
function plantStand(F, x, z, kind = "farn", h = .82, a0 = 0, a1 = TAU, s = 1){   // Blumenständer mit Farn oder Palme
  const C = subF(F, x, z, 0);
  cy("dark", .2, .2, .04, 14, C.m(0, h, 0)); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4; rod("dark", C, [Math.cos(a) * .15, h, Math.sin(a) * .15], [Math.cos(a) * .2, 0, Math.sin(a) * .2], .018, 6); }
  tor("dark", .17, .01, 4, 16, C.m(0, h * .35, 0, PI / 2));
  lat("vc", [[0, 0], [.1, 0], [.12, .04], [.16, .2], [.17, .22], [.15, .22], [0, .2]], 14, C.m(0, h + .02, 0), kind === "palme" ? "#8a4a2a" : "#2f5d5d");
  plant(C, 0, h + .2, 0, kind, s, a0, a1);
}
function frondGeo(len, wid, droop, segs = 6){ const g = new T3.PlaneGeometry(len, wid, segs, 1).translate(len / 2, 0, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / len; p.setY(i, p.getY(i) * (1 - .55 * u)); const yy = p.getY(i); p.setY(i, 0); p.setZ(i, -yy); p.setY(i, p.getY(i) - droop * u * u + .12 * len * u * (1 - u)); }
  g.computeVertexNormals(); return g; }
function plant(C, x, y, z, kind, s, a0 = 0, a1 = TAU){   // Farn: viele kurze, hängende Wedel · Palme: wenige lange Wedel an Stielen (Winkel a0..a1, 0 = entlang x, π/2 = in den Raum)
  const full = a1 - a0 > 6, n = Math.round((kind === "palme" ? 9 : 26) * (full ? 1 : .75)), base = kind === "palme" ? "#4f7a34" : "#5e8a3a";
  for (let i = 0; i < n; i++) { const a = a0 + (i + (full ? R() * .3 : .5)) / n * (a1 - a0), up = kind === "palme" ? .75 + R() * .5 : (i % 3) * .3 + R() * .3, L = (kind === "palme" ? .9 + R() * .4 : .5 + R() * .25) * s;
    const col = tint(base, .75 + R() * .4);
    if (kind === "palme") rod("vc", C, [x, y, z], [x + Math.cos(a) * .12 * s, y + .35 * s * up, z + Math.sin(a) * .12 * s], .008 * s, 4, "#5a5a2a");
    const sy = kind === "palme" ? y + .35 * s * up : y; K.add("frond", frondGeo(L, (kind === "palme" ? .34 : .2) * s, L * (kind === "palme" ? .55 : .7)), C.m(x, sy, z, 0, -a, up), {c: col}); }
}
function bust(F, x, y, z, s = 1, ry = 0){   // Marmorbüste (stilisiert)
  const C = subF(F, x, z, ry, y);
  cy("marble", .1 * s, .12 * s, .06 * s, 14, C.m(0, .03 * s, 0)); cy("marble", .05 * s, .07 * s, .07 * s, 12, C.m(0, .095 * s, 0));
  lat("marble", [[0, 0], [.17, 0], [.2, .04], [.19, .1], [.12, .17], [.05, .2], [0, .21]].map(([a, b]) => [a * s, b * s]), 18, C.m(0, .13 * s, 0, 0, 0, 0, 1, 1, .6));
  cy("marble", .045 * s, .05 * s, .1 * s, 12, C.m(0, .38 * s, 0)); sp("marble", .1 * s, 16, 12, C.m(0, .5 * s, .005 * s, 0, 0, 0, .9, 1.12, 1));
  sp("marble", .104 * s, 14, 8, C.m(0, .53 * s, -.012 * s, -.4, 0, 0, .95, 1, 1)); bx("marble", .025 * s, .05 * s, .03 * s, C.m(0, .49 * s, .095 * s, .2));
  for (const sx of [-1, 1]) sp("marble", .022 * s, 6, 5, C.m(sx * .09 * s, .5 * s, 0, 0, 0, 0, .5, 1, 1));
}
function pedestal(F, x, z, h = 1.05, key = "marble"){ const C = subF(F, x, z);
  bx(key, .42, .08, .42, C.m(0, .04, 0)); bx(key, .36, .05, .36, C.m(0, .105, 0)); lat(key, [[.13, 0], [.15, .02], [.12, .1], [.12, h - .3], [.14, h - .24], [.12, h - .22], [0, h - .22]], 16, C.m(0, .13, 0));
  bx(key, .34, .05, .34, C.m(0, h - .065, 0)); bx(key, .4, .04, .4, C.m(0, h - .02, 0)); }
function owl(F, x, y, z, ry = 0){ const C = subF(F, x, z, ry, y);
  bx("dark", .16, .03, .1, C.m(0, .015, 0)); cy("dark", .012, .012, .12, 5, C.m(0, .08, 0)); rod("dark", C, [-.07, .14, 0], [.07, .14, 0], .012);
  sp("vc", .07, 12, 10, C.m(0, .23, 0, -.15, 0, 0, 1, 1.35, .9), "#6a5236"); sp("vc", .058, 12, 10, C.m(0, .34, .01, 0, 0, 0, 1.1, .95, 1), "#7a6040");
  for (const s of [-1, 1]) { sp("vc", .02, 8, 6, C.m(s * .024, .35, .058), "#e0a020"); sp("vc", .009, 6, 4, C.m(s * .024, .35, .076), "#100c08"); cone("vc", .014, .05, 5, C.m(s * .04, .4, 0, 0, 0, -s * .3), "#5a4430");
    sp("vc", .05, 8, 6, C.m(s * .055, .23, -.01, 0, 0, 0, .45, 1.3, .9), "#4e3c26"); }
  cone("vc", .012, .025, 5, C.m(0, .325, .066, PI / 2), "#2a2018"); }
function ladder(F, x, Hl, D0, lean, H0 = 0){   // Bibliotheksleiter, lehnt am Regal
  const C = subF(F, x, D0); const a = Math.atan2(lean, Hl), L = Math.hypot(lean, Hl);
  for (const s of [-1, 1]) { bx("dark", .05, L, .04, C.m(s * .2, H0 + Hl / 2, lean / 2, a)); }
  for (let i = 1; i < Math.floor(L / .3); i++) { const t = i * .3 / L; cy("brass", .012, .012, .4, 6, C.m(0, H0 + t * Hl, lean * (1 - t), 0, 0, PI / 2)); }
  for (const s of [-1, 1]) tor("brass", .04, .008, 4, 8, C.m(s * .2, H0 + Hl + .02, -.02, 0, PI / 2, 0), null, PI);
}
function radiator(F, x, W){   // gusseiserner Gliederheizkörper unter dem Fenster
  const C = subF(F, x, 0), n = Math.round(W / .065);
  for (let i = 0; i < n; i++) { const xx = -W / 2 + (i + .5) * W / n; bx("iron", .045, .62, .17, C.m(xx, .45, .14)); cy("iron", .022, .022, .17, 6, C.m(xx, .76, .14, PI / 2)); cy("iron", .022, .022, .17, 6, C.m(xx, .14, .14, PI / 2)); }
  for (const y of [.18, .72]) cy("iron", .02, .02, W + .04, 8, C.m(0, y, .14, 0, 0, PI / 2));
  for (const s of [-1, 1]) { bx("iron", .05, .12, .2, C.m(s * (W / 2 - .06), .06, .14)); cy("brass", .025, .025, .05, 8, C.m(s * (W / 2 + .05), .7, .14, 0, 0, PI / 2)); }
}
function barometer(F, x, y){   // Banjo-Barometer mit Thermometer
  bx("dark", .16, .52, .045, F.m(x, y + .32, .025)); cy("dark", .2, .2, .05, 24, F.m(x, y, .025, PI / 2)); cy("dark", .09, .06, .05, 12, F.m(x, y + .63, .025, PI / 2));
  K.add("misc", new T3.CircleGeometry(.165, 28), F.m(x, y, .052), {uvr: uvc(CM.B)}); tor("brass", .17, .012, 6, 28, F.m(x, y, .052)); K.add("glass", new T3.CircleGeometry(.165, 20), F.m(x, y, .062));
  bx("paper", .05, .34, .004, F.m(x, y + .34, .049)); cy("glass", .006, .006, .32, 6, F.m(x, y + .34, .056), null, true); bx("vc", .004, .18, .004, F.m(x, y + .28, .056), "#b0201a");
  sp("gilt", .03, 8, 6, F.m(x, y + .7, .04)); cone("gilt", .02, .08, 8, F.m(x, y + .77, .04)); }

/* ---------- Bilder und Wandschmuck ---------- */
function picture(F, x, y, pw, ph, cell, o = {}){   // Gemälde im profilierten Goldrahmen, an der Bilderleiste aufgehängt
  const atlas = o.misc ? "misc" : "bild", fw = o.fw ?? .085, d = .065, fk = o.frame || "gilt";
  if (o.oval) {
    K.add(o.mirror ? "mirror" : atlas, new T3.CircleGeometry(.5, 36), F.m(x, y, .05, 0, 0, 0, pw, ph, 1), o.mirror ? {} : {uvr: uvc(cell)});
    K.add(fk, new T3.TorusGeometry(.5, .045, 6, 40), F.m(x, y, .045, 0, 0, 0, pw + .06, ph + .06, 1)); K.add(fk, new T3.TorusGeometry(.5, .02, 4, 36), F.m(x, y, .06, 0, 0, 0, pw + .01, ph + .01, 1));
    K.add("dark", new T3.CircleGeometry(.5, 24), F.m(x, y, .03, 0, 0, 0, pw + .14, ph + .14, 1));
    sp(fk, .035, 8, 6, F.m(x, y + ph / 2 + .07, .06)); cone(fk, .03, .07, 6, F.m(x, y + ph / 2 + .13, .06));
  } else {
    if (o.mirror) bx("mirror", pw, ph, .01, F.m(x, y, .048)); else pln(atlas, pw, ph, F.m(x, y, .052), {uvr: uvc(cell)});
    for (const s of [-1, 1]) { bx(fk, pw + 2 * fw, fw, d, F.m(x, y + s * (ph / 2 + fw / 2), d / 2)); bx(fk, fw, ph, d, F.m(x + s * (pw / 2 + fw / 2), y, d / 2));
      bx(fk, pw + 2 * fw + .025, .022, d + .018, F.m(x, y + s * (ph / 2 + fw), (d + .018) / 2)); bx(fk, .022, ph + 2 * fw, d + .018, F.m(x + s * (pw / 2 + fw), y, (d + .018) / 2));
      bx("dark", pw, .016, .02, F.m(x, y + s * (ph / 2 - .004), .058)); bx("dark", .016, ph, .02, F.m(x + s * (pw / 2 - .004), y, .058));
      if (fk === "gilt") for (const t of [-1, 1]) sp("gilt", .028, 6, 4, F.m(x + s * (pw / 2 + fw / 2), y + t * (ph / 2 + fw / 2), d + .012, 0, 0, 0, 1, 1, .5)); }
    bx("dark", pw + .03, ph + .03, .02, F.m(x, y, .03));
    if (o.crest !== false && fk === "gilt" && pw > .9) { sp("gilt", .05, 8, 6, F.m(x, y + ph / 2 + fw + .02, d, 0, 0, 0, 1.6, .8, .5)); }
  }
  const yr = HH - 1.0, yt = y + ph / 2 + (o.oval ? .14 : fw);
  if (o.wire !== false && yr - yt > .15) { for (const s of [-1, 1]) rod("brass", F, [x + s * pw * .28, yt, .03], [x, yr, .03], .004, 4); sp("brass", .022, 8, 6, F.m(x, yr, .035)); }
}
function rollMap(F, x, y0, W, Hm){   // Rollkarte zwischen zwei Holzstäben, an Kordeln von der Bilderleiste
  pln("misc", W, Hm, F.m(x, y0 + Hm / 2, .035), {uvr: uvc(CM.K)});
  for (const [yy, r0] of [[y0 + Hm + .03, .035], [y0 - .02, .028]]) { cy("dark", r0, r0, W + .12, 12, F.m(x, yy, .045, 0, 0, PI / 2)); for (const s of [-1, 1]) sp("brass", r0 + .01, 8, 6, F.m(x + s * (W / 2 + .07), yy, .045)); }
  const yr = HH - 1.0; for (const s of [-1, 1]) rod("vc", F, [x + s * W * .4, y0 + Hm + .06, .045], [x, yr, .035], .005, 4, "#7a2a1e"); sp("brass", .022, 8, 6, F.m(x, yr, .035));
}
function engraving(F, x, y, w, h, cell){   // Kupferstich im schwarzen Rahmen mit Goldkante
  pln("misc", w, h, F.m(x, y, .032), {uvr: uvc(cell)});
  for (const s of [-1, 1]) { bx("vc", w + .1, .05, .035, F.m(x, y + s * (h / 2 + .025), .0175), "#141010"); bx("vc", .05, h, .035, F.m(x + s * (w / 2 + .025), y, .0175), "#141010");
    bx("gilt", w + .01, .01, .01, F.m(x, y + s * (h / 2 + .002), .036)); bx("gilt", .01, h, .01, F.m(x + s * (w / 2 + .002), y, .036)); }
  bx("dark", w, h, .02, F.m(x, y, .015)); const yr = HH - 1.0, yt = y + h / 2 + .05;
  if (yr - yt > .15) { for (const s of [-1, 1]) rod("brass", F, [x + s * w * .3, yt, .02], [x, yr, .02], .003, 4); sp("brass", .02, 8, 6, F.m(x, yr, .03)); }
}
function investWall(F, x, y0, W, Hb){   // Ermittlungswand: Kork mit Fotos und Ausschnitten, Nadeln, rote Fäden
  dtex.bilder(); const yc = y0 + Hb / 2;
  bx("dark", W + .14, Hb + .14, .04, F.m(x, yc, .02)); pln("bild", W, Hb, F.m(x, yc, .043), {uvr: uvc(CB.E)});
  for (const s of [-1, 1]) { bx("wood", .07, Hb + .14, .035, F.m(x + s * (W / 2 + .035), yc, .058)); bx("wood", W, .07, .035, F.m(x, yc + s * (Hb / 2 + .035), .058)); }
  const P = PINS.map(([u, v]) => [x + (u - .5) * W, yc + (.5 - v) * Hb]);
  P.forEach(([px, py]) => { sp("vc", .016, 6, 4, F.m(px, py, .066), "#b8221a"); cy("steel", .003, .003, .03, 4, F.m(px, py, .05, PI / 2), null, true); });
  for (const [a, b] of [[0, 1], [1, 2], [0, 4], [2, 3], [4, 5], [5, 6], [6, 3], [1, 6], [2, 7], [5, 1], [4, 6]]) { const A = P[a], B = P[b]; if (A && B) rod("vc", F, [A[0], A[1], .068], [B[0], B[1], .068], .0035, 4, "#c4261c"); }
  // Ablage mit Lupe und Kreide unter der Wand
  bx("dark", W * .5, .03, .09, F.m(x, y0 - .1, .045)); magnifier(F, x - W * .1, y0 - .085, .06, .4);
}
function photoLine(F, x0, x1, y, d){   // Leine mit trocknenden Fotos (Klammern), die Fotos pendeln leicht
  const sag = .07, n = 6, pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([x0 + (x1 - x0) * t, y - sag * 4 * t * (1 - t), d]); }
  tub("vc", F, pts, .0025, 24, 3, "#d8ccb0"); for (const xx of [x0, x1]) { sp("brass", .015, 6, 4, F.m(xx, y, d)); rod("brass", F, [xx, y, 0], [xx, y, d], .006, 5); }
  const pos = []; for (let i = 0; i < n; i++) { const t = (i + .7) / (n + .4), xx = x0 + (x1 - x0) * t, yy = y - sag * 4 * t * (1 - t); pos.push([xx, yy]); bx("wood", .012, .045, .016, F.m(xx, yy - .01, d)); }
  return pos;
}
function windowUnit(F, o){   // Schiebefenster mit Nebel draußen, Samtvorhänge mit Raffhaltern, Lambrequin mit Fransen
  const {sill, top: yT, wW, col} = o, hW = yT - sill, yc = sill + hW / 2;
  pln("win", wW, hW, F.m(0, yc, .012), {uvr: uvc(CM.F)}); pln("nebel", wW, hW, F.m(0, yc, .02), {uv: [wW / 2.2, hW / 2.2]}); pln("glass", wW, hW, F.m(0, yc, .042));
  for (const xx of [-wW / 6, wW / 6]) bx("dark", .03, hW, .035, F.m(xx, yc, .03));
  for (const k of [.25, .75]) bx("dark", wW, .028, .035, F.m(0, sill + hW * k, .03)); bx("dark", wW, .07, .05, F.m(0, yc, .035));
  for (const s of [-1, 1]) { bx("wood", .03, hW, .15, F.m(s * (wW / 2 + .015), yc, .075)); bx("dark", .14, hW + .24, .07, F.m(s * (wW / 2 + .085), yc + .02, .035)); }
  bx("wood", wW + .06, .03, .15, F.m(0, yT + .015, .075)); bx("dark", wW + .46, .2, .08, F.m(0, yT + .14, .04)); bx("dark", wW + .58, .05, .13, F.m(0, yT + .265, .065));
  bx("dark", wW + .4, .05, .24, F.m(0, sill - .025, .12)); bx("dark", wW + .24, .12, .04, F.m(0, sill - .11, .02));
  // Vorhänge
  const top = yT + .44, bot = o.floor ? .025 : o.short ? sill - .06 : sill - .25, Hc = top - bot, cw = .82, tie = o.floor ? .36 : .3;
  for (const s of [-1, 1]) { K.add("velvet", curtainGeo(cw, Hc, {dir: -s, tie, tw: .3, bw: o.floor ? .62 : .5, folds: 6, amp: .055}), F.m(s * (wW / 2 + .62), bot, .07), {c: col});
    const ty = bot + Hc * tie, tx = s * (wW / 2 + .62 - cw * .3 * .55);
    tor("vc", .1, .014, 5, 14, F.m(tx, ty, .13, PI / 2, 0, 0, 1.25, .55, 1), "#c9a04a"); cone("gilt", .035, .11, 8, F.m(tx - s * .09, ty - .1, .2)); sp("gilt", .03, 8, 6, F.m(tx - s * .09, ty - .03, .2));
    bx("brass", .03, .03, .06, F.m(s * (wW / 2 + .72), ty, .03)); }
  const pw = wW + 1.56; bx("velvet", pw, .38, .07, F.m(0, yT + .5, .2), col); bx("velvet", pw + .02, .05, .16, F.m(0, yT + .67, .14), tint(col, 1.15));
  for (const s of [-1, 1]) bx("velvet", .07, .38, .2, F.m(s * pw / 2, yT + .5, .12), col);
  bx("gilt", pw + .02, .02, .012, F.m(0, yT + .32, .238)); bx("gilt", pw + .02, .02, .012, F.m(0, yT + .62, .238));
  pln("gfringe", pw, .12, F.m(0, yT + .25, .238)); for (let i = 0; i <= 6; i++) { const xx = -pw / 2 + .1 + i * (pw - .2) / 6; cone("gilt", .028, .1, 6, F.m(xx, yT + .2, .245)); sp("gilt", .022, 6, 4, F.m(xx, yT + .26, .245)); }
  cy("brass", .018, .018, pw + .3, 8, F.m(0, yT + .5, .1, 0, 0, PI / 2)); for (const s of [-1, 1]) { sp("brass", .04, 10, 8, F.m(s * (pw / 2 + .16), yT + .5, .1)); cone("brass", .03, .07, 8, F.m(s * (pw / 2 + .22), yT + .5, .1, 0, 0, -s * PI / 2)); }
}
function curtainGeo(W, Hc, o){   // Vorhangbahn: Falten, oben volle Breite, am Raffhalter zusammengefasst, unten wieder weiter
  const nx = 24, ny = 12, pos = [], uv = [], idx = [], tie = o.tie, tw = o.tw, bw = o.bw, folds = o.folds, amp = o.amp, dir = o.dir;
  for (let j = 0; j <= ny; j++) { const v = j / ny; let f;
    if (v >= tie) { const s = (v - tie) / (1 - tie); f = tw + (1 - tw) * Math.pow(s, .55); } else { const s = (tie - v) / tie; f = tw + (bw - tw) * Math.sin(s * PI / 2); }
    for (let i = 0; i <= nx; i++) { const u = i / nx, a = amp / Math.max(.4, f) * (.65 + .35 * u), bulge = .06 * Math.exp(-((v - tie) ** 2) / .006) * u;
      pos.push(dir * u * W * f, v * Hc, a * (.5 - .5 * Math.cos(u * folds * TAU)) + bulge); uv.push(u * folds / 2, v * Hc / 1.5); } }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; dir > 0 ? idx.push(a, b, d, a, d, c) : idx.push(a, d, b, a, c, d); }
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

/* ---------- Sitzgruppe ---------- */
function armchair(C, col){   // Ohrensessel mit Rollarmlehnen und Ohren
  for (const [x, z] of [[-.3, .28], [.3, .28], [-.3, -.28], [.3, -.28]]) cy("dark", .025, .016, .13, 6, C.m(x, .065, z));
  bx("vc", .8, .22, .66, C.m(0, .24, -.04), col); cy("vc", .11, .11, .8, 10, C.m(0, .24, .29, 0, 0, PI / 2), col); bx("vc", .62, .1, .62, C.m(0, .4, .04), tint(col, 1.12)); cy("vc", .05, .05, .62, 8, C.m(0, .4, .35, 0, 0, PI / 2), tint(col, 1.12)); bx("dark", .82, .03, .76, C.m(0, .135, 0));
  bx("vc", .78, .88, .16, C.m(0, .8, -.3, -.12), col); cy("vc", .08, .08, .78, 10, C.m(0, 1.22, -.36, 0, 0, PI / 2), tint(col, .95));
  bx("vc", .6, .5, .08, C.m(0, .72, -.2, -.12), tint(col, 1.08)); for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) sp("brass", .01, 4, 3, C.m(-.21 + i * .14 + (r % 2) * .07, .56 + r * .15, -.155 - r * .018));
  for (const s of [-1, 1]) { bx("vc", .12, .24, .66, C.m(s * .34, .47, .02), col); cy("vc", .072, .072, .68, 10, C.m(s * .35, .6, .02, PI / 2), tint(col, 1.05));
    bx("vc", .1, .52, .44, C.m(s * .37, .98, -.13, -.08, s * .3, 0), col); }
}
function sideTable(C){ cy("wood", .25, .25, .03, 20, C.m(0, .63, 0)); cy("dark", .24, .24, .02, 20, C.m(0, .605, 0)); cy("dark", .03, .045, .52, 8, C.m(0, .34, 0));
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; bx("dark", .28, .03, .05, C.m(Math.cos(a) * .12, .04, Math.sin(a) * .12, 0, -a, 0)); } }
function floorLamp(C){ cy("brass", .14, .16, .03, 16, C.m(0, .015, 0)); cy("brass", .012, .012, 1.48, 6, C.m(0, .76, 0), null, true); sp("brass", .03, 8, 6, C.m(0, .45, 0));
  K.add("shadeF", new T3.CylinderGeometry(.15, .26, .3, 18, 1, true), C.m(0, 1.6, 0)); tor("gilt", .26, .008, 4, 24, C.m(0, 1.45, 0, PI / 2)); tor("gilt", .15, .006, 4, 18, C.m(0, 1.75, 0, PI / 2));
  K.add("gfringe", new T3.CylinderGeometry(.262, .262, .07, 18, 1, true), C.m(0, 1.415, 0)); HALOS.push(C.p(0, 1.56, 0)); }
function pipeSet(C, x, y, z){ cy("brass", .06, .05, .014, 14, C.m(x, y + .007, z)); cy("vc", .02, .016, .045, 10, C.m(x + .015, y + .036, z), "#3a2014");
  rod("vc", C, [x + .015, y + .025, z], [x - .1, y + .045, z + .04], .005, 5, "#1a1008"); return C.p(x + .015, y + .065, z); }
function armchairGroup(F, x, col, flip = 1){   // Ohrensessel, Beistelltisch mit Pfeife und Buch, Stehlampe
  armchair(subF(F, x - flip * .45, .62, flip * .5), col);
  const T = subF(F, x + flip * .45, .5); sideTable(T); bookStack(T, -.06, .645, .05, 2); const smoke = pipeSet(T, .1, .645, -.06);
  cy("glass", .03, .026, .08, 10, T.m(-.12, .685, -.1)); cy("vc", .026, .024, .03, 10, T.m(-.12, .66, -.1), "#8a4a12");
  floorLamp(subF(F, x + flip * .9, .3));
  bx("vc", .38, .26, .32, F.m(x - flip * .05, .19, 1.0, 0, flip * .4), col); for (const [dx, dz] of [[-.13, -.11], [.13, -.11], [-.13, .11], [.13, .11]]) cy("dark", .015, .012, .06, 5, subF(F, x - flip * .05, 1.0, flip * .4).m(dx, .03, dz));
  return smoke;
}

/* ---------- Bewegte Teile (eigene Gruppen; je Material ein Zeichenaufruf) ---------- */
const I4 = () => fr(new T3.Matrix4());
function group(m){ const g = new T3.Group(); if (m) g.applyMatrix4(m); g.userData.dekor = true; CTX.group.add(g); return g; }
function haloPts(list, parent, size = .6, col = 0xffc98a){   // Lichthöfe als ein Points-Objekt (ein Zeichenaufruf)
  if (!list.length) return null; const p = new Float32Array(list.length * 3); list.forEach((v, i) => p.set([v.x, v.y, v.z], i * 3));
  const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(p, 3));
  const m = new T3.PointsMaterial({map: U.glowTex(), color: col, size, transparent: true, opacity: .8, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false});
  const pts = new T3.Points(g, m); pts.renderOrder = 3; pts.userData.noPick = true; parent.add(pts); return pts;
}
// Aufhängepunkt an der Decke: Balken (Unterkante H − 0,2) oder Deckenfläche
function ceilY(z, x = 0){ const DY = CTX.huelle && CTX.huelle.deckeY; if (DY) return DY(x, z); const B = CTX.bounds, D = B.z0 - B.z1, nz = Math.max(1, Math.round(D / 2.75)); for (let i = 1; i < nz; i++) if (Math.abs(z - (B.z1 + i * D / nz)) < .16) return HH - .2; return HH; }
function gasolier(px, pz, o = {}){   // Gaslüster: Deckenrosette, Stange, Körper, geschwungene Arme mit Tulpenschirmen; pendelt leicht
  const s = o.s || 1, n = o.arms || 6, top = ceilY(pz, px), drop = o.drop ?? .5, G = group(M(px, top, pz)), L = [], C = I4();
  const Bk = withK(() => {
    cy("brass", .1 * s, .15 * s, .05, 16, C.m(0, -.025, 0)); cy("brass", .016 * s, .016 * s, drop, 8, C.m(0, -.05 - drop / 2, 0), null, true);
    for (const k of [.35, .7]) sp("brass", .03 * s, 8, 6, C.m(0, -.05 - drop * k, 0));
    const yb = -.05 - drop;
    lat("brass", [[0, -.66], [.03, -.62], [.06, -.52], [.045, -.44], [.09, -.36], [.15, -.3], [.13, -.24], [.07, -.18], [.09, -.1], [.05, -.04], [.03, 0]].map(([a, b]) => [a * s, b * s]), 16, C.m(0, yb, 0));
    for (let tier = 0; tier < (o.tiers || 1); tier++) { const rr = (tier ? .42 : .62) * s, yy = yb - (tier ? .1 : .3) * s, nn = tier ? Math.round(n / 2) : n;
      for (let i = 0; i < nn; i++) { const a = (i + tier * .5) / nn * TAU, c = Math.cos(a), sn = Math.sin(a);
        tub("brass", C, [[c * .1 * s, yy, sn * .1 * s], [c * rr * .45, yy - .1 * s, sn * rr * .45], [c * rr * .85, yy - .05 * s, sn * rr * .85], [c * rr, yy + .12 * s, sn * rr]], .014 * s, 12, 5);
        tor("brass", .06 * s, .007 * s, 4, 10, C.m(c * rr * .5, yy - .13 * s, sn * rr * .5, 0, -a + PI / 2, 0), null, PI);
        cy("brass", .04 * s, .022 * s, .05 * s, 10, C.m(c * rr, yy + .14 * s, sn * rr));
        lat("globe", [[.025, 0], [.06, .025], [.085, .08], [.088, .14], [.07, .18]].map(([a2, b]) => [a2 * s, b * s]), 12, C.m(c * rr, yy + .16 * s, sn * rr));
        L.push(V3(c * rr, yy + .25 * s, sn * rr)); } }
    sp("brass", .045 * s, 10, 8, C.m(0, yb - .68 * s, 0)); cone("brass", .03 * s, .1 * s, 8, C.m(0, yb - .76 * s, 0, PI));
  });
  meshes(Bk, G, {noRecv: true}); const h = haloPts(L, G, .55 * s);
  const ph = R() * 10; CTX.tick((dt, t) => { G.rotation.x = Math.sin(t * .45 + ph) * .012; G.rotation.z = Math.sin(t * .37 + ph * 2) * .012; if (h) h.material.opacity = .72 + .06 * Math.sin(t * 7 + ph); });
  return G;
}
function smoke(origin, n = 9){   // Pfeifenrauch: Schwaden steigen auf, werden größer und vergehen
  const im = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), dm("smoke"), n); im.frustumCulled = false; im.renderOrder = 5; im.userData.noPick = im.userData.dekor = true; CTX.group.add(im);
  const m4 = new T3.Matrix4(), v = V3(0, 0, 0), sv = V3(1, 1, 1), q0 = new T3.Quaternion(), ph = R() * 10;
  CTX.tick((dt, t) => { const cq = R3D.camera ? R3D.camera.quaternion : q0;
    for (let i = 0; i < n; i++) { const p = (t * .11 + i / n + ph) % 1, k = p < .75 ? 1 : (1 - p) / .25, s = (.05 + .42 * p) * k + 1e-4;
      v.set(origin.x + Math.sin(p * 6 + i) * .08 * p + p * .1, origin.y + p * 1.15, origin.z + Math.cos(p * 5 + i * 2) * .08 * p); m4.compose(v, cq, sv.set(s, s, s)); im.setMatrixAt(i, m4); }
    im.instanceMatrix.needsUpdate = true; });
}
function photosAnim(F, pos, d){   // trocknende Fotos an der Leine: zwei Gruppen pendeln gegeneinander versetzt
  const y0 = pos.reduce((a, p) => a + p[1], 0) / pos.length;   // Drehachse: die Leine (ungefähr waagrecht)
  for (const par of [0, 1]) { const G = group(F.m(0, y0, d)), C = I4();
    const Bk = withK(() => pos.forEach(([x, y], i) => { if (i % 2 !== par) return; const c = PHOTO(i % 6), r = (R() - .5) * .12;
      K.add("misc", new T3.PlaneGeometry(.13, .16), C.m(x, y - y0 - .1, .004, 0, 0, r), {uvr: uvc(c)}); bx("paper", .132, .162, .002, C.m(x, y - y0 - .1, .001, 0, 0, r)); }));
    meshes(Bk, G); const ph = par * 1.7 + R();
    CTX.tick((dt, t) => { G.rotation.x = Math.sin(t * 1.3 + ph) * .1; }); }
}
function birdcage(F, x, z){   // Vogelkäfig am Ständer, pendelt leicht, der Kanarienvogel hüpft
  const C = subF(F, x, z, -PI / 2);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; rod("dark", C, [0, .12, 0], [Math.cos(a) * .3, 0, Math.sin(a) * .3], .015, 5); sp("brass", .02, 6, 4, C.m(Math.cos(a) * .3, .015, Math.sin(a) * .3)); }
  cy("dark", .022, .028, 1.75, 8, C.m(0, .9, 0)); sp("brass", .035, 8, 6, C.m(0, 1.78, 0)); tub("brass", C, [[0, 1.74, 0], [.12, 1.86, 0], [.3, 1.88, 0], [.4, 1.8, 0]], .012, 10, 5);
  const hook = C.p(.4, 1.78, 0), G = group(); G.position.copy(hook); G.quaternion.setFromRotationMatrix(new T3.Matrix4().extractRotation(C.base));
  const L = I4(), Bk = withK(() => {
    tor("brass", .02, .004, 4, 8, L.m(0, -.02, 0)); rod("brass", L, [0, -.04, 0], [0, -.1, 0], .004, 4);
    lat("brass", [[.17, -.2], [.15, -.16], [.08, -.11], [0, -.1]], 14, L.m(0, 0, 0));
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; rod("brass", L, [Math.cos(a) * .17, -.2, Math.sin(a) * .17], [Math.cos(a) * .17, -.52, Math.sin(a) * .17], .0028, 3); }
    for (const y of [-.2, -.32, -.5]) tor("brass", .17, .004, 3, 24, L.m(0, y, 0, PI / 2)); cy("brass", .18, .18, .04, 18, L.m(0, -.54, 0)); rod("dark", L, [-.15, -.4, 0], [.15, -.4, 0], .006, 4);
  });
  meshes(Bk, G); const bird = new T3.Group(); G.add(bird); bird.position.set(0, -.39, 0);
  const Bb = withK(() => { const Q = I4(); sp("vc", .035, 10, 8, Q.m(0, .03, 0, 0, 0, 0, 1.3, 1, 1), "#e8c22a"); sp("vc", .024, 8, 6, Q.m(.04, .065, 0), "#efcf3a"); cone("vc", .008, .02, 5, Q.m(.068, .065, 0, 0, 0, -PI / 2), "#d08a2a");
    cone("vc", .02, .06, 5, Q.m(-.06, .03, 0, 0, 0, PI / 2 + .3), "#c9a020"); sp("vc", .005, 4, 3, Q.m(.05, .072, .016), "#101010"); sp("vc", .005, 4, 3, Q.m(.05, .072, -.016), "#101010"); });
  meshes(Bb, bird); const ph = R() * 10;
  CTX.tick((dt, t) => { G.rotation.z = Math.sin(t * .9 + ph) * .04; const hop = Math.max(0, Math.sin(t * 3.1 + ph)); bird.position.y = -.39 + (hop > .92 ? (hop - .92) * .8 : 0); bird.rotation.y = Math.floor(t * .4 + ph) % 2 ? 0 : PI; });
}
function globeAnim(info){ const G = group(); G.position.copy(info.ctr); G.rotation.z = .41;
  const me = new T3.Mesh(U.scaleUV(new T3.SphereGeometry(info.r, 24, 16), 1, 1), dm("misc")); const uv = me.geometry.attributes.uv, [a, b, c, d] = uvc(CM.G);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, a + uv.getX(i) * (c - a), b + uv.getY(i) * (d - b)); me.userData.noPick = true; G.add(me); CTX.tick(dt => { me.rotation.y += dt * .12; }); }

/* ---------- Strom ---------- */
function wimshurst(F, x, z){   // Influenzmaschine auf Tischchen: Glasscheiben drehen sich, zwischen den Kugeln springt ein Funke über
  const C = subF(F, x, z);
  bx("wood", .8, .04, .5, C.m(0, .76, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy("dark", .025, .02, .74, 8, C.m(sx * .34, .37, sz * .19)); bx("dark", .7, .03, .02, C.m(0, .2, .19)); bx("dark", .7, .03, .02, C.m(0, .2, -.19));
  bx("dark", .56, .04, .3, C.m(0, .8, 0)); for (const s of [-1, 1]) bx("dark", .05, .4, .05, C.m(s * .06, 1.0, -.08)); cy("brass", .012, .012, .22, 8, C.m(0, 1.12, -.08, PI / 2));
  for (const s of [-1, 1]) { cy("brass", .02, .02, .25, 8, C.m(s * .22, .94, .05)); tub("brass", C, [[s * .22, 1.06, .05], [s * .2, 1.2, .0], [s * .1, 1.32, -.02]], .008, 10, 4); sp("brass", .025, 10, 8, C.m(s * .06, 1.36, -.02));
    leyden(C, s * .2, .82, .1, .5); rod("brass", C, [s * .2, 1.06, .05], [s * .1, 1.36, -.02], .006); }
  tub("brass", C, [[-.08, 1.36, -.02], [-.03, 1.38, -.02]], .006, 4, 4); tub("brass", C, [[.08, 1.36, -.02], [.03, 1.38, -.02]], .006, 4, 4);
  bx("dark", .03, .03, .2, C.m(.17, 1.12, -.08)); cy("dark", .015, .015, .1, 6, C.m(.27, 1.06, -.0, 0, 0, PI / 2));
  const D = group(C.m(0, 1.12, -.08)), Q = I4(), Bk = withK(() => { for (const zz of [-.035, .035]) { cy("glassD", .23, .23, .006, 28, Q.m(0, 0, zz, PI / 2)); tor("brass", .23, .004, 3, 28, Q.m(0, 0, zz));
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; bx("brass", .018, .07, .002, Q.m(Math.cos(a) * .17, Math.sin(a) * .17, zz + (zz > 0 ? .005 : -.005), 0, 0, a - PI / 2)); } } });
  meshes(Bk, D); const sp_ = CTX.glow(0xbfd8ff, .22); sp_.position.copy(C.p(0, 1.38, -.02)); sp_.userData.noPick = sp_.userData.dekor = true; CTX.group.add(sp_);
  CTX.tick((dt, t) => { D.rotation.z += dt * 1.6; const f = (Math.sin(t * 2.3) + Math.sin(t * .83)) > 1.86; sp_.material.opacity = f ? .8 : .12; sp_.scale.setScalar(f ? .24 : .14); });   // Funke nur alle paar Sekunden, kurz
}
function bulbPendant(px, pz){   // Elektrolier: vier Glühlampen mit Kohlefaden, flackern leise
  const top = ceilY(pz, px), G = group(M(px, top, pz)), C = I4(), L = [];
  const Bk = withK(() => { cy("brass", .08, .12, .04, 14, C.m(0, -.02, 0)); rod("vc", C, [0, -.04, 0], [0, -.9, 0], .007, 4, "#1a1410"); cy("brass", .05, .03, .1, 12, C.m(0, -.95, 0));
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .4, c = Math.cos(a), s = Math.sin(a);
      tub("brass", C, [[0, -.98, 0], [c * .18, -1.02, s * .18], [c * .3, -1.1, s * .3]], .01, 10, 4); cy("brass", .022, .018, .06, 8, C.m(c * .3, -1.13, s * .3));
      lat("glass", [[.012, 0], [.035, -.02], [.05, -.07], [.045, -.12], [.02, -.16], [.0, -.17]].reverse(), 12, C.m(c * .3, -1.16, s * .3));
      tor("fil", .014, .0015, 3, 10, C.m(c * .3, -1.24, s * .3, 0, a, 0), null, PI * 1.6); L.push(V3(c * .3, -1.24, s * .3)); } });
  meshes(Bk, G, {noRecv: true}); const h = haloPts(L, G, .5, 0xffd38a), ph = R() * 10;
  CTX.tick((dt, t) => { G.rotation.z = Math.sin(t * .5 + ph) * .015; if (h) h.material.opacity = .7 + .1 * Math.sin(t * 7.1 + ph) * Math.sin(t * 2.9); });   // langsamer als 3 Hz
}
function arcLamp(px, pz){   // Bogenlampe: Laterne mit zwei Kohlestäben, deren Lichtbogen unruhig flackert
  const top = ceilY(pz, px), G = group(M(px, top, pz)), C = I4();
  const Bk = withK(() => { cy("iron", .07, .1, .04, 12, C.m(0, -.02, 0)); rod("iron", C, [0, -.04, 0], [0, -.75, 0], .012, 6); cy("iron", .1, .14, .14, 12, C.m(0, -.82, 0));
    cone("iron", .26, .16, 16, C.m(0, -.97, 0)); cy("iron", .06, .06, .3, 10, C.m(0, -.78, 0)); lat("glass", [[.05, -.22], [.16, -.18], [.19, -.06], [.16, .04], [.1, .08]].map(([a, b]) => [a, b]), 16, C.m(0, -1.12, 0));
    for (const y of [-1.05, -1.33]) cy("vc", .012, .012, .14, 6, C.m(0, y, 0), "#1a1a1a"); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; rod("iron", C, [Math.cos(a) * .2, -1.0, Math.sin(a) * .2], [Math.cos(a) * .12, -1.36, Math.sin(a) * .12], .006); }
    cy("iron", .14, .1, .04, 12, C.m(0, -1.38, 0)); });
  meshes(Bk, G, {noRecv: true}); const g = CTX.glow(0xd8e8ff, .6); g.position.set(0, -1.19, 0); g.userData.noPick = true; G.add(g); const ph = R() * 10;
  CTX.tick((dt, t) => { const f = .6 + .25 * Math.sin(t * 14 + ph) * Math.sin(t * 3.7);   /* ruhig: unter 3 Hz, kein Aussetzen (Lichtempfindlichkeit) */ g.material.opacity = Math.max(.15, f); g.scale.setScalar(.5 + .25 * f); G.rotation.x = Math.sin(t * .4 + ph) * .01; });
}
function switchboard(F, x, y0){   // Schalttafel aus Marmor: Messerschalter, Porzellansicherungen, Strommesser; ab und zu ein Funke
  const W = 1.1, Hs = 1.0, yc = y0 + Hs / 2; bx("dark", W + .1, Hs + .1, .05, F.m(x, yc, .025)); bx("marble", W, Hs, .03, F.m(x, yc, .06));
  for (const s of [-1, 1]) { const C = subF(F, x + s * .3, .075, 0, yc - .05); cy("brass", .1, .1, .02, 20, C.m(0, .28, 0, PI / 2)); K.add("face", new T3.CircleGeometry(.085, 20), C.m(0, .28, .012)); K.add("glass", new T3.CircleGeometry(.085, 16), C.m(0, .28, .016)); }
  for (let i = 0; i < 3; i++) { const xx = x - .3 + i * .3; bx("vc", .06, .09, .03, F.m(xx, yc - .02, .09), "#e8e2d4"); bx("brass", .12, .02, .02, F.m(xx, yc - .02, .1));
    bx("brass", .015, .2, .015, F.m(xx - .025, yc - .02 + .08, .12, -.6)); bx("brass", .015, .2, .015, F.m(xx + .025, yc - .02 + .08, .12, -.6)); cy("vc", .02, .02, .06, 8, F.m(xx, yc + .11, .2, PI / 2), "#1a1a1a");
    for (const yy of [-.3, -.42]) { cy("vc", .028, .028, .1, 10, F.m(xx, yc + yy, .1, 0, 0, PI / 2), "#f0ece0"); for (const s of [-1, 1]) cy("brass", .016, .016, .02, 8, F.m(xx + s * .06, yc + yy, .1, 0, 0, PI / 2)); } }
  for (let i = 0; i < 4; i++) tub("vc", F, [[x - .42 + i * .28, y0 + .02, .08], [x - .42 + i * .28, y0 - .12, .06], [x - .5 + i * .1, .25, .03], [x - .52 + i * .1, .02, .03]], .007, 12, 4, "#2a1c14");
  const sp_ = CTX.glow(0xbfd8ff, .2); sp_.position.copy(F.p(x + .3, yc - .3, .16)); sp_.userData.noPick = sp_.userData.dekor = true; CTX.group.add(sp_);
  const ph = R() * 10; CTX.tick((dt, t) => { const f = Math.sin(t * 2.6 + ph) * Math.sin(t * .71) > .95; sp_.material.opacity = f ? .8 : 0; });   // Funke nur alle paar Sekunden
}
function galvanometer(F, x, y, z){ bx("dark", .2, .03, .2, F.m(x, y + .015, z)); cy("brass", .08, .08, .1, 18, F.m(x, y + .08, z)); K.add("face", new T3.CircleGeometry(.07, 18), F.m(x, y + .131, z, -PI / 2));
  K.add("glass", new T3.CircleGeometry(.075, 16), F.m(x, y + .133, z, -PI / 2)); for (const s of [-1, 1]) cy("brass", .012, .012, .03, 8, F.m(x + s * .07, y + .045, z + .07)); }

/* ---------- Optik ---------- */
function telescope(F, x, z, aim = 0){   // Fernrohr aus Messing auf Holzstativ, zum Fenster gerichtet
  const C = subF(F, x, z, aim);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; rod("dark", C, [0, 1.27, 0], [Math.cos(a) * .42, 0, Math.sin(a) * .42], .018, 6); sp("brass", .022, 6, 4, C.m(Math.cos(a) * .42, .02, Math.sin(a) * .42)); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; rod("brass", C, [Math.cos(a) * .15, .45, Math.sin(a) * .15], [Math.cos(a + TAU / 3) * .15, .45, Math.sin(a + TAU / 3) * .15], .006, 4); }
  cy("brass", .05, .06, .08, 12, C.m(0, 1.3, 0)); bx("brass", .04, .12, .08, C.m(0, 1.38, 0));
  const T = fr(C.m(0, 1.45, 0, -.8, 0, 0));   // Rohr zeigt zur Wand (−z) und steil nach oben ins Fenster
  cy("brass", .045, .045, .75, 18, T.m(0, 0, -.1, PI / 2)); cy("brass", .055, .055, .22, 18, T.m(0, 0, -.55, PI / 2)); cy("brass", .035, .035, .3, 14, T.m(0, 0, .4, PI / 2)); cy("brass", .025, .02, .12, 12, T.m(0, 0, .6, PI / 2));
  for (const zz of [-.46, -.66, .26]) tor("brass", zz < 0 ? .056 : .046, .006, 4, 18, T.m(0, 0, zz)); K.add("glass", new T3.CircleGeometry(.05, 16), T.m(0, 0, -.661, 0, PI, 0));
  cy("brass", .012, .012, .26, 8, T.m(0, .075, -.25, PI / 2)); for (const zz of [-.35, -.15]) bx("brass", .01, .06, .01, T.m(0, .045, zz));
}
function chevalMirror(F, x, z, ry){   // Standspiegel (Psyche) mit Goldrahmen, leicht geneigt
  const C = subF(F, x, z, ry);
  for (const s of [-1, 1]) { bx("dark", .06, 1.7, .06, C.m(s * .42, .85, 0)); bx("dark", .14, .05, .5, C.m(s * .42, .025, 0)); sp("gilt", .04, 8, 6, C.m(s * .42, 1.73, 0)); }
  bx("dark", .84, .05, .05, C.m(0, .22, 0)); const Mf = fr(C.m(0, 1.0, 0, -.08));
  bx("mirror", .66, 1.4, .02, Mf.m(0, 0, 0)); for (const s of [-1, 1]) { bx("gilt", .7 + .08, .06, .05, Mf.m(0, s * .72, 0)); bx("gilt", .05, 1.4, .05, Mf.m(s * .355, 0, 0)); cy("brass", .02, .02, .08, 8, Mf.m(s * .4, 0, 0, 0, 0, PI / 2)); }
  bx("dark", .7, 1.44, .015, Mf.m(0, 0, -.02)); sp("gilt", .05, 8, 6, Mf.m(0, .8, .02, 0, 0, 0, 1.6, .8, .5));
}
function prismLuster(px, pz){   // Kristalllüster: Messingreifen, Glasprismen, Kerzen; Lichtpunkte funkeln
  const top = ceilY(pz, px), G = group(M(px, top, pz)), C = I4(), L = [], gl = [];
  const Bk = withK(() => { cy("brass", .1, .14, .04, 14, C.m(0, -.02, 0)); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; rod("brass", C, [0, -.05, 0], [Math.cos(a) * .55, -.8, Math.sin(a) * .55], .005, 4); }
    for (const [rr, yy] of [[.55, -.8], [.36, -1.02]]) { tor("brass", rr, .012, 5, 40, C.m(0, yy, 0, PI / 2)); const n = rr > .5 ? 22 : 14;
      for (let i = 0; i < n; i++) { const a = i / n * TAU, xx = Math.cos(a) * rr, zz = Math.sin(a) * rr; bx("glass", .028, .13, .028, C.m(xx, yy - .085, zz, 0, a + PI / 4, 0));
        if (i % 2 === 0) gl.push(V3(xx, yy - .12, zz)); } }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, xx = Math.cos(a) * .55, zz = Math.sin(a) * .55; cy("brass", .025, .02, .03, 8, C.m(xx, -.785, zz)); cy("wax", .012, .012, .12, 6, C.m(xx, -.71, zz)); cone("fil", .007, .025, 5, C.m(xx, -.635, zz)); L.push(V3(xx, -.63, zz)); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; tub("glass", C, [[Math.cos(a) * .55, -.8, Math.sin(a) * .55], [Math.cos(a) * .42, -.95, Math.sin(a) * .42], [Math.cos(a) * .36, -1.02, Math.sin(a) * .36]], .005, 6, 3); }
    lat("glass", [[0, -1.4], [.06, -1.32], [.03, -1.2], [.05, -1.05], [0, -1.0]], 10, C.m()); sp("glass", .04, 8, 6, C.m(0, -1.44, 0)); });
  meshes(Bk, G, {noRecv: true}); haloPts(L, G, .35, 0xffc070);
  const sparkle = haloPts(gl, G, .14, 0xffffff), cols = new Float32Array(gl.length * 3); sparkle.geometry.setAttribute("color", new T3.BufferAttribute(cols, 3)); sparkle.material.vertexColors = true;
  const ph = R() * 10; CTX.tick((dt, t) => { G.rotation.y = Math.sin(t * .2 + ph) * .05; for (let i = 0; i < gl.length; i++) { const k = Math.max(0, Math.sin(t * (2 + i % 5) + i * 1.7)) ** 8; cols[i * 3] = cols[i * 3 + 1] = cols[i * 3 + 2] = k; } sparkle.geometry.attributes.color.needsUpdate = true; });
}
function spectacleSign(px, pz){   // Ladenschild des Optikers: große Brille an Ketten, schwingt leise
  const top = ceilY(pz, px), G = group(M(px, top, pz)), C = I4();
  const Bk = withK(() => { for (const s of [-1, 1]) { rod("brass", C, [s * .3, 0, 0], [s * .38, -.75, 0], .006, 4); cy("brass", .04, .05, .03, 10, C.m(s * .3, -.015, 0)); }
    for (const s of [-1, 1]) { tor("gilt", .3, .035, 8, 32, C.m(s * .38, -1.1, 0)); K.add("glass", new T3.CircleGeometry(.29, 28), C.m(s * .38, -1.1, 0)); }
    tub("gilt", C, [[-.1, -1.0, 0], [0, -.94, 0], [.1, -1.0, 0]], .03, 10, 6); for (const s of [-1, 1]) tub("gilt", C, [[s * .67, -1.08, 0], [s * .78, -1.04, -.25], [s * .8, -1.1, -.55], [s * .76, -1.2, -.62]], .022, 14, 5); });
  meshes(Bk, G, {noRecv: true}); const ph = R() * 10; CTX.tick((dt, t) => { G.rotation.y = Math.sin(t * .3 + ph) * .25; G.rotation.x = Math.sin(t * .5 + ph) * .02; });
}
function plateCamera(F, x, z, ry){   // Plattenkamera mit Balgen auf Stativ, schwarzes Einstelltuch
  const C = subF(F, x, z, ry);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .3; rod("wood", C, [0, 1.12, 0], [Math.cos(a) * .38, 0, Math.sin(a) * .38], .016, 6); }
  bx("dark", .26, .04, .26, C.m(0, 1.14, 0)); bx("wood", .3, .02, .5, C.m(0, 1.17, .06));
  bx("wood", .24, .26, .035, C.m(0, 1.31, .28)); cy("brass", .05, .055, .14, 16, C.m(0, 1.31, .36, PI / 2)); K.add("glass", new T3.CircleGeometry(.04, 14), C.m(0, 1.31, .431)); tor("brass", .05, .006, 4, 14, C.m(0, 1.31, .43));
  for (let i = 0; i < 5; i++) { const k = i / 4; bx("vc", .2 + k * .08, .22 + k * .08, .05, C.m(0, 1.31, .24 - i * .06), i % 2 ? "#1a1716" : "#262220"); }
  bx("wood", .3, .32, .04, C.m(0, 1.31, -.04)); K.add("velvet", curtainGeo(.4, .5, {dir: 1, tie: 0, tw: 1, bw: 1, folds: 4, amp: .03}), C.m(-.2, .9, -.08, 0, 0, 0), {c: "#141214"});
  bx("velvet", .4, .04, .36, C.m(0, 1.48, -.02), "#141214");
}
function spectacles(F, x, y, z, ry){ const C = subF(F, x, z, ry, y); for (const s of [-1, 1]) { tor("brass", .022, .0025, 3, 14, C.m(s * .03, .02, 0)); K.add("glass", new T3.CircleGeometry(.021, 10), C.m(s * .03, .02, .001)); rod("brass", C, [s * .052, .02, 0], [s * .055, .02, -.1], .0018, 3); }
  tub("brass", C, [[-.008, .022, 0], [0, .028, 0], [.008, .022, 0]], .002, 4, 3); }

/* ---------- Bewegung ---------- */
function pennyFarthing(F, x){   // Hochrad, lehnt an der Wand
  // Mitte 0,37 m vor der Wand: die Lenkergriffe reichen bis 1 cm davor
  const C = subF(F, x, .37), W = I4(); const wheel = (cx, cy0, rr, n) => { tor("vc", rr, .018, 6, 40, C.m(cx, cy0, 0), "#141212"); tor("steel", rr - .022, .008, 4, 40, C.m(cx, cy0, 0));
    cy("steel", .03, .03, .08, 10, C.m(cx, cy0, 0, PI / 2)); for (let i = 0; i < n; i++) { const a = i / n * TAU; rod("steel", C, [cx, cy0, (i % 2 ? .03 : -.03)], [cx + Math.cos(a) * (rr - .03), cy0 + Math.sin(a) * (rr - .03), 0], .0025, 3); } };
  wheel(-.25, .7, .7, 28); wheel(.75, .2, .2, 12);
  tub("vc", C, [[-.25, 1.42, 0], [-.05, 1.42, 0], [.3, 1.2, 0], [.6, .6, 0], [.75, .3, 0]], .022, 20, 6, "#1a1a1e");
  for (const s of [-1, 1]) rod("vc", C, [-.25, .7, s * .05], [-.25, 1.42, s * .02], .016, 6, "#1a1a1e");
  bx("vc", .24, .04, .1, C.m(-.12, 1.47, 0), "#3a2214"); rod("steel", C, [-.3, 1.5, -.28], [-.3, 1.5, .28], .012, 6); for (const s of [-1, 1]) cy("dark", .016, .016, .1, 6, C.m(-.3, 1.5, s * .3, PI / 2));
  for (const s of [-1, 1]) bx("steel", .05, .015, .03, C.m(-.25, .7 - .25, s * .1, 0, 0, .5));
}
function wagonWheel(F, x){ const C = subF(F, x, .17, 0); const Wc = fr(C.m(0, .66, 0, -.18));   // lehnt an der Wand: oben 1 cm davor, unten auf dem Boden
  tor("wood", .58, .045, 6, 32, Wc.m()); tor("iron", .62, .02, 4, 32, Wc.m()); cy("wood", .1, .1, .22, 14, Wc.m(0, 0, 0, PI / 2)); cy("iron", .11, .11, .03, 14, Wc.m(0, 0, .08, PI / 2));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; rod("wood", Wc, [Math.cos(a) * .09, Math.sin(a) * .09, 0], [Math.cos(a) * .55, Math.sin(a) * .55, 0], .018, 5); } }
function stationClock(px, pz){   // doppelseitige Bahnhofsuhr an Ketten, zeigt die echte Zeit
  const top = ceilY(pz, px), G = group(M(px, top, pz)), C = I4(), Y = -1.05;
  const Bk = withK(() => { for (const s of [-1, 1]) rod("brass", C, [s * .25, 0, 0], [s * .12, Y + .42, 0], .006, 4); cy("brass", .05, .06, .03, 10, C.m(0, -.015, 0));
    cy("vc", .4, .4, .16, 32, C.m(0, Y, 0, PI / 2), "#1e2a24"); tor("brass", .4, .025, 6, 40, C.m(0, Y, .08)); tor("brass", .4, .025, 6, 40, C.m(0, Y, -.08));
    for (const s of [1, -1]) K.add("face", new T3.CircleGeometry(.36, 32), C.m(0, Y, s * .081, 0, s > 0 ? 0 : PI, 0));
    sp("brass", .06, 10, 8, C.m(0, Y + .44, 0)); cone("brass", .04, .12, 8, C.m(0, Y + .54, 0)); sp("brass", .04, 8, 6, C.m(0, Y - .44, 0)); });
  meshes(Bk, G, {noRecv: true}); const hm = mat("color", {color: "#1a120a", rough: .4}), hands = [];
  for (const s of [1, -1]) { const hg = new T3.Group(); hg.position.set(0, Y, s * .09); hg.rotation.y = s > 0 ? 0 : PI; G.add(hg);
    const hh = new T3.Mesh(new T3.BoxGeometry(.025, .2, .006).translate(0, .08, 0), hm), mh = new T3.Mesh(new T3.BoxGeometry(.016, .3, .006).translate(0, .12, .006), hm); hg.add(hh, mh); hands.push([hh, mh]); }
  const ph = R() * 10; CTX.tick((dt, t) => { G.rotation.y = Math.sin(t * .15 + ph) * .12; G.rotation.x = Math.sin(t * .5 + ph) * .01;
    const d = new Date(), mi = d.getMinutes() + d.getSeconds() / 60, ho = d.getHours() % 12 + mi / 60; for (const [hh, mh] of hands) { mh.rotation.z = -mi / 60 * TAU; hh.rotation.z = -ho / 12 * TAU; } });
}
function newtonCradle(F, x, y, z){   // Kugelstoßpendel: die äußeren Kugeln schwingen abwechselnd
  const C = subF(F, x, z, 0, y); bx("dark", .36, .03, .2, C.m(0, .015, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod("steel", C, [sx * .16, .03, sz * .08], [sx * .16, .3, sz * .02], .004, 4);
  for (const sz of [-1, 1]) rod("steel", C, [-.16, .3, sz * .02], [.16, .3, sz * .02], .004, 4);
  const balls = []; for (let i = 0; i < 5; i++) { const xx = (i - 2) * .042, P = group(C.m(xx, .3, 0)), Q = I4();
    meshes(withK(() => { sp("steel", .02, 12, 8, Q.m(0, -.2, 0)); rod("steel", Q, [0, 0, .02], [0, -.19, 0], .0012, 3); rod("steel", Q, [0, 0, -.02], [0, -.19, 0], .0012, 3); }), P); balls.push(P); }
  CTX.tick((dt, t) => { const s = Math.sin(t * 3.2); balls[0].rotation.z = s < 0 ? s * .55 : 0; balls[4].rotation.z = s > 0 ? s * .55 : 0; });
}
function modelTrain(F, x){   // Modelleisenbahn auf langem Tisch: Lok mit zwei Wagen fährt im Oval
  const C = subF(F, x, .42), W = 1.9, D = .72, Ht = .78;
  bx("wood", W, .04, D, C.m(0, Ht, 0)); bx("dark", W - .06, .12, D - .06, C.m(0, Ht - .08, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy("dark", .03, .025, Ht - .04, 8, C.m(sx * (W / 2 - .07), (Ht - .04) / 2, sz * (D / 2 - .07)));
  bx("vc", W - .12, .01, D - .12, C.m(0, Ht + .025, 0), "#4a5a3a");
  const curve = new T3.CatmullRomCurve3([...Array(16)].map((_, i) => { const a = i / 16 * TAU; return V3(Math.cos(a) * .72, 0, Math.sin(a) * .22); }), true, "centripetal");
  for (const off of [-.025, .025]) { const pts = curve.getSpacedPoints(64).map(p => { const n = V3(p.x / .72 / .72, 0, p.z / .22 / .22).normalize(); return [p.x + n.x * off, Ht + .04, p.z + n.z * off]; }); tub("steel", C, pts, .004, 96, 3); }
  for (let i = 0; i < 40; i++) { const p = curve.getPointAt(i / 40), tg = curve.getTangentAt(i / 40); bx("dark", .07, .008, .012, C.m(p.x, Ht + .032, p.z, 0, -Math.atan2(tg.z, tg.x), 0)); }
  bx("vc", .3, .14, .2, C.m(.55, Ht + .1, -.22), "#7a5a3a"); bx("vc", .32, .03, .22, C.m(.55, Ht + .18, -.22), "#5a2a22");   // Bahnhäuschen
  const TG = group(C.m(0, Ht + .04, 0)), cars = [];
  for (let k = 0; k < 3; k++) { const G = new T3.Group(); TG.add(G); const Q = I4();
    meshes(withK(() => { if (k === 0) { cy("vc", .035, .035, .16, 12, Q.m(.02, .06, 0, 0, 0, PI / 2), "#1e3a2a"); bx("vc", .08, .09, .08, Q.m(-.08, .07, 0), "#1e3a2a"); bx("vc", .1, .012, .09, Q.m(-.08, .12, 0), "#141414");
        cy("vc", .012, .016, .06, 8, Q.m(.08, .11, 0), "#141414"); sp("brass", .018, 8, 6, Q.m(0, .1, 0)); bx("vc", .24, .02, .07, Q.m(0, .025, 0), "#141414"); cone("vc", .03, .04, 4, Q.m(.13, .025, 0, 0, 0, -PI / 2), "#7a1a14"); }
      else { bx("vc", .2, .08, .075, Q.m(0, .06, 0), k === 1 ? "#5a1e1a" : "#2a3a5a"); bx("vc", .21, .015, .085, Q.m(0, .105, 0), "#2a2a2a"); bx("vc", .2, .02, .06, Q.m(0, .02, 0), "#141414"); for (const s of [-1, 1]) bx("paper", .03, .025, .002, Q.m(s * .05, .07, .038)); }
      for (const s of [-1, 1]) for (const zz of [-.03, .03]) cy("vc", .016, .016, .01, 8, Q.m(s * .06, .016, zz, PI / 2), "#7a1a14"); }), G); cars.push(G); }
  CTX.tick((dt, t) => { cars.forEach((G, k) => { const u = ((t * .045 - k * .055) % 1 + 1) % 1, p = curve.getPointAt(u), tg = curve.getTangentAt(u); G.position.copy(p); G.rotation.y = -Math.atan2(tg.z, tg.x); }); });
}
function balloon(px, pz, y){   // Modell einer Montgolfière, schwebt an einem dünnen Faden und dreht sich langsam
  const top = ceilY(pz, px), G = group(M(px, y, pz)), C = I4();
  const thread = new T3.Mesh(new T3.CylinderGeometry(.002, .002, 1, 3, 1, true).translate(0, .5, 0), mat("color", {color: "#d8d0c0", rough: .8})); thread.userData.noPick = thread.userData.dekor = true; CTX.group.add(thread);
  const Bk = withK(() => { K.add("misc", new T3.LatheGeometry([[.08, 0], [.14, .06], [.3, .26], [.4, .52], [.42, .72], [.36, .92], [.22, 1.05], [.0, 1.1]].map(([a, b]) => new T3.Vector2(a, b)), 24), C.m(0, 0, 0), {uvr: uvc(CM.Bl)});
    tor("gilt", .08, .01, 4, 16, C.m(0, 0, 0, PI / 2)); bx("vc", .16, .12, .16, C.m(0, -.42, 0), "#8a6a3a"); bx("vc", .17, .02, .17, C.m(0, -.355, 0), "#5a4024");
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { rod("vc", C, [sx * .075, -.36, sz * .075], [sx * .055, 0, sz * .055], .002, 3, "#3a2a1a"); sp("vc", .02, 6, 4, C.m(sx * .085, -.43, sz * .09), "#c8b088"); } });
  meshes(Bk, G, {noRecv: true}); const ph = R() * 10;
  CTX.tick((dt, t) => { G.position.y = y + Math.sin(t * .6 + ph) * .06; G.rotation.y += dt * .08; G.rotation.z = Math.sin(t * .4) * .03; thread.position.set(px, G.position.y + 1.1, pz); thread.scale.y = Math.max(.01, top - G.position.y - 1.1); });
}

/* ---------- Kräfte ---------- */
function crate(F, x, y, z, s, ry = 0, mark){ const C = subF(F, x, z, ry, y); bx("wood", s, s, s, C.m(0, s / 2, 0));
  for (const sy of [.06, s - .06]) for (const sz of [-1, 1]) bx("dark", s + .01, .06, .02, C.m(0, sy, sz * (s / 2 + .005))); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx("dark", .06, s, .02, C.m(sx * (s / 2 - .03), s / 2, sz * (s / 2 + .005)));
  rod("dark", C, [-s / 2 + .05, .08, s / 2 + .01], [s / 2 - .05, s - .08, s / 2 + .01], .012, 4); if (mark) bx("vc", s * .4, s * .16, .004, C.m(0, s * .55, s / 2 + .016), "#2a1a10"); }
function barrel(F, x, y, z, s = 1, lying){ const C = subF(F, x, z, 0, y); const Q = lying ? fr(C.m(0, .28 * s, 0, 0, 0, PI / 2)) : fr(C.m(0, .42 * s, 0));
  lat("wood", [[.2, -.42], [.25, -.3], [.28, 0], [.25, .3], [.2, .42], [0, .42]].map(([a, b]) => [a * s, b * s]), 18, Q.m()); cy("dark", .2 * s, .2 * s, .01, 16, Q.m(0, -.415 * s, 0));
  for (const yy of [-.36, -.18, .18, .36]) tor("iron", (.205 + .07 * Math.cos(yy * 3.7)) * s, .008 * s, 4, 24, Q.m(0, yy * s, 0, PI / 2)); }
function anchor(F, x){   // Anker mit Stock und Ring, lehnt an der Wand; daneben eine Taurolle
  const C = subF(F, x, .25), A = fr(C.m(0, 0, 0, -.12));   // 0,25 m vor der Wand: der Ankerstock oben bleibt vor der Wand
  bx("iron", .08, 1.25, .07, A.m(0, .72, 0)); tor("iron", .1, .02, 6, 16, A.m(0, 1.44, 0)); bx("iron", .14, .08, .1, A.m(0, 1.3, 0)); cy("iron", .02, .02, .16, 8, A.m(0, 1.3, 0, PI / 2));
  tor("iron", .45, .04, 6, 20, A.m(0, .55, 0, 0, 0, PI), null, PI); for (const s of [-1, 1]) { cone("iron", .1, .22, 4, A.m(s * .47, .62, 0, 0, 0, -s * .5, 1, 1, .35)); }
  sp("iron", .06, 8, 6, A.m(0, .1, 0));
  for (let i = 0; i < 4; i++) tor("vc", .2 - i * .015, .03, 6, 20, C.m(.75, .03 + i * .055, .2, PI / 2), "#a88a5a");
}
function pulley(px, pz, drop){   // Flaschenzug von der Decke mit Kiste: die untere Rolle hebt und senkt sich ein wenig
  const top = ceilY(pz, px), G = group(M(px, top, pz)), C = I4(), y1 = -.45;
  meshes(withK(() => { bx("iron", .3, .04, .3, C.m(0, -.02, 0)); tor("iron", .05, .012, 4, 10, C.m(0, -.08, 0)); bx("dark", .05, .28, .22, C.m(-.06, y1 + .12, 0)); bx("dark", .05, .28, .22, C.m(.06, y1 + .12, 0));
    cy("brass", .09, .09, .03, 18, C.m(-.015, y1 + .12, 0, 0, 0, PI / 2)); cy("brass", .09, .09, .03, 18, C.m(.015, y1 + .12, 0, 0, 0, PI / 2)); cy("iron", .015, .015, .2, 6, C.m(0, y1 + .12, 0, 0, 0, PI / 2)); }), G);
  const ropes = new T3.Group(); ropes.position.y = y1; G.add(ropes);
  meshes(withK(() => { const Q = I4(); for (const zz of [-.09, -.03, .03, .09]) K.add("vc", new T3.CylinderGeometry(.007, .007, 1, 4, 1, true).translate(0, -.5, 0), Q.m(0, 0, zz), {c: "#b09060"}); }), ropes);
  const low = new T3.Group(); G.add(low);
  meshes(withK(() => { const Q = I4(); bx("dark", .05, .26, .2, Q.m(-.06, -.1, 0)); bx("dark", .05, .26, .2, Q.m(.06, -.1, 0)); cy("brass", .08, .08, .05, 16, Q.m(0, -.1, 0, 0, 0, PI / 2));
    tub("iron", Q, [[0, -.22, 0], [0, -.32, 0], [.06, -.38, 0], [.03, -.44, 0], [-.02, -.4, 0]], .014, 12, 5);
    for (const s of [-1, 1]) rod("vc", Q, [0, -.38, 0], [s * .22, -.7, s * .22], .008, 4, "#b09060"); for (const s of [-1, 1]) rod("vc", Q, [0, -.38, 0], [s * .22, -.7, -s * .22], .008, 4, "#b09060");
    bx("wood", .5, .38, .5, Q.m(0, -.9, 0)); for (const yy of [-.75, -1.05]) bx("dark", .52, .05, .52, Q.m(0, yy, 0)); bx("vc", .2, .08, .004, Q.m(0, -.9, .253), "#2a1a10"); }), low);
  const ph = R() * 10; CTX.tick((dt, t) => { const L = drop + Math.sin(t * .5 + ph) * .08; low.position.y = y1 - L; ropes.scale.y = L; G.rotation.z = Math.sin(t * .35 + ph) * .01; });
}
function balance(F, x, y, z){   // Balkenwaage aus Messing: der Balken schwingt langsam aus
  const C = subF(F, x, z, 0, y); bx("dark", .46, .05, .2, C.m(0, .025, 0)); cy("brass", .05, .06, .03, 14, C.m(0, .065, 0)); cy("brass", .014, .018, .42, 8, C.m(0, .29, 0)); cone("brass", .03, .05, 4, C.m(0, .52, 0, PI));
  const G = group(C.m(0, .52, 0)), Q = I4(); meshes(withK(() => { bx("brass", .52, .018, .016, Q.m(0, 0, 0)); cone("brass", .012, .16, 4, Q.m(0, -.08, 0, PI)); for (const s of [-1, 1]) sp("brass", .014, 6, 4, Q.m(s * .26, 0, 0)); }), G);
  const pans = [-1, 1].map(s => { const P = group(C.m(s * .26, .52, 0)); meshes(withK(() => { for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; rod("brass", Q, [0, 0, 0], [Math.cos(a) * .07, -.24, Math.sin(a) * .07], .0015, 3); }
    lat("brass", [[0, -.27], [.06, -.265], [.09, -.245], [.095, -.24]], 16, Q.m()); if (s > 0) for (let i = 0; i < 3; i++) cy("brass", .016 - i * .003, .016 - i * .003, .025, 10, Q.m((i - 1) * .03, -.25, .01)); }), P); return P; });
  const ph = R() * 10; CTX.tick((dt, t) => { const a = Math.sin(t * .8 + ph) * .07 * (.6 + .4 * Math.sin(t * .13)); G.rotation.z = a; pans.forEach((P, i) => { const s = i ? 1 : -1; P.position.copy(C.p(s * .26 * Math.cos(a), .52 + s * .26 * Math.sin(a), 0)); }); });
}
function weightSet(F, x, y, z){ const C = subF(F, x, z, 0, y); bx("dark", .34, .06, .2, C.m(0, .03, 0)); bx("vc", .32, .005, .18, C.m(0, .063, 0), "#5a1820");
  bx("dark", .34, .02, .2, C.m(0, .16, -.12, -1.2)); [.045, .038, .032, .026, .02, .016].forEach((r0, i) => { const xx = -.13 + i * .052, h = r0 * 2.2; cy("brass", r0, r0, h, 12, C.m(xx, .065 + h / 2, 0)); cy("brass", r0 * .45, r0 * .45, r0 * .5, 8, C.m(xx, .065 + h + r0 * .25, 0)); sp("brass", r0 * .55, 8, 6, C.m(xx, .065 + h + r0 * .6, 0)); }); }
function springScales(F, x, y0){   // Federwaagen am Wandbrett, zwei mit Gewichtsstück
  bx("dark", 1.0, .1, .06, F.m(x, y0, .03)); bx("dark", 1.0, .02, .14, F.m(x, y0 + .06, .07));
  [-.3, 0, .3].forEach((dx, i) => { const C = subF(F, x + dx, .1, 0, y0); tor("brass", .025, .005, 4, 10, C.m(0, -.03, 0)); cy("brass", .022, .022, .3, 12, C.m(0, -.21, 0)); bx("paper", .02, .24, .002, C.m(0, -.2, .022));
    const L = [.08, .16, .03][i]; cy("brass", .006, .006, L, 6, C.m(0, -.36 - L / 2, 0)); tor("brass", .018, .004, 4, 8, C.m(0, -.38 - L, 0, 0, 0, PI / 2), null, PI * 1.5);
    if (i < 2) { cy("iron", .04 + i * .01, .04 + i * .01, .06 + i * .03, 12, C.m(0, -.45 - L - i * .015, 0)); tor("iron", .015, .004, 4, 8, C.m(0, -.4 - L, 0)); } });
}
function inclinedPlane(F, x){   // schiefe Ebene auf Tischchen: ein Fässchen rollt hinab und wird wieder hinaufgeschoben
  const C = subF(F, x, .35), Ht = .72; bx("wood", 1.0, .04, .5, C.m(0, Ht, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy("dark", .025, .02, Ht - .02, 8, C.m(sx * .44, (Ht - .02) / 2, sz * .2));
  const ang = .32, Lr = .8, P = fr(C.m(-.05, Ht + .02, 0, 0, 0, ang)); bx("wood", Lr, .025, .26, P.m(0, .14, 0)); for (const s of [-1, 1]) bx("dark", Lr, .03, .015, P.m(0, .165, s * .12));
  bx("dark", .03, .27, .26, C.m(.33, Ht + .135, 0)); bx("dark", .03, .03, .26, C.m(-.41, Ht + .04, 0));
  for (let i = 0; i <= 6; i++) bx("vc", .004, .004, .2, P.m(-Lr / 2 + .06 + i * .11, .154, 0), "#2a1a10");
  const G = group(P.m(0, .194, 0)), Q = I4(); meshes(withK(() => { lat("wood", [[.03, -.05], [.04, 0], [.03, .05], [0, .05]], 12, Q.m(0, 0, 0, PI / 2)); for (const zz of [-.03, .03]) tor("iron", .037, .003, 3, 14, Q.m(0, 0, zz)); }), G);
  const ph = R() * 10; CTX.tick((dt, t) => { const k = ((t * .12 + ph) % 1), u = k < .7 ? (k / .7) ** 2 : 1 - (k - .7) / .3; G.position.copy(P.p(Lr / 2 - .08 - u * (Lr - .2), .194, 0)); G.rotation.z = ang + u * 18; });
}
function kite(px, pz, y){   // Drachen vom Hügel in Hampstead: Rautenform, Schwanz mit Schleifen, pendelt an Schnüren
  const top = ceilY(pz, px), G = group(M(px, y, pz)), C = I4();
  const Bk = withK(() => { const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute([0, .55, 0, -.32, .1, 0, 0, -.6, 0, 0, .55, 0, 0, -.6, 0, .32, .1, 0], 3)); g.setAttribute("uv", new T3.Float32BufferAttribute([.5, 1, 0, .6, .5, 0, .5, 1, .5, 0, 1, .6], 2)); g.computeVertexNormals();
    K.add("velvet", g, C.m(), {c: "#a8261c"}); const g2 = g.clone(); K.add("velvet", g2, C.m(0, 0, -.002, 0, 0, 0, .5, .5, 1), {c: "#e8c860"});
    rod("dark", C, [0, .55, .01], [0, -.6, .01], .005, 4); rod("dark", C, [-.32, .1, .01], [.32, .1, .01], .005, 4);
    const tail = []; for (let i = 0; i <= 10; i++) tail.push([Math.sin(i * .9) * .08, -.6 - i * .075, .02]); tub("vc", C, tail, .003, 30, 3, "#d8d0c0");
    for (let i = 1; i <= 5; i++) { const [tx, ty] = tail[i * 2]; bx("velvet", .1, .03, .01, C.m(tx, ty, .02, 0, 0, .5), i % 2 ? "#24406a" : "#e8c860"); bx("velvet", .1, .03, .01, C.m(tx, ty, .02, 0, 0, -.5), i % 2 ? "#24406a" : "#e8c860"); }
    for (const s of [-1, 1]) rod("vc", C, [s * .3, .1, .01], [0, top - y - .06, 0], .0015, 3, "#d8d0c0"); });
  meshes(Bk, G, {noRecv: true}); G.rotation.x = -.15; const ph = R() * 10;
  CTX.tick((dt, t) => { G.rotation.z = Math.sin(t * .5 + ph) * .08; G.rotation.y = Math.sin(t * .3 + ph) * .3; });
}

/* ---------- Plätze: jedes Teil prüft seinen Quader mit ctx.frei und belegt ihn mit ctx.belege ---------- */
let WL = null;
const nmW = w => w === WL.left ? "left" : w === WL.right ? "right" : w === WL.front ? "front" : "back";
const sg = w => w.side ? w.t[1] : w.t[0];
const uOf = (w, a) => w.side ? w.u(w.o[0], a) : w.u(a, w.o[1]);
const FW = (w, a) => fr(w.m(uOf(w, a), 0, 0));
// Quader eines Wandteils: lokal x0..x1 entlang der Wand, y0..y1, Tiefe 0..d1 (ctx.wand); floor = Möbel am Boden (Hindernis)
function q(w, a, x0, x1, y0, y1, d1, floor, rm = .06, d0 = 0){ const s = nmW(w), b = CTX.wand(s, a + sg(w) * (x0 + x1) / 2, y0, y1, x1 - x0, d1), B = CTX.bounds;
  if (d0) { if (s === "left") b.x0 = B.x0 + d0; else if (s === "right") b.x1 = B.x1 - d0; else if (s === "front") b.z0 = B.z1 + d0; else b.z1 = B.z0 - d0; }
  b.rm = rm; b.floor = !!floor; return b; }
function qw(x0, x1, y0, y1, z0, z1, floor, rm = .06){ return {x0, x1, y0, y1, z0, z1, rm, floor: !!floor}; }
const isFree = (...bs) => bs.every(b => CTX.frei(b, b.rm ?? .06));
let LOG = null;
const six = b => ({x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, z0: b.z0, z1: b.z1});
function claim(...bs){ if (!isFree(...bs)) return false; if (LOG) LOG.push(bs.map(b => [b.x0, b.x1, b.y0, b.y1, b.z0, b.z1].map(v => +v.toFixed(2)).join(" ")).join(" | "));
  // nur die sechs Zahlen belegen: R3D.debug.belegt() rundet jeden Eintrag (rm/floor würden es mit einem TypeError abbrechen)
  for (const b of bs) { CTX.belege(six(b)); if (b.floor) CTX.obstacleBox((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0, b.z1 - b.z0); } return true; }
/* ---------- Sichtlinien vom Mittelgang (Augenhöhe): Hängendes darf Schilder über Exponaten, Tafeln, Türschilder und hohe Exponatteile nicht verdecken ---------- */
let VIEW = null, START = 0;
function viewSetup(){   // Augenpunkte im Gang und Stützpunkte aller Teile über 3 m, die vor der Ausstattung im Raum waren (dünne Stäbe, Drähte und Lichtkegel zählen nicht)
  const B = CTX.bounds, eyes = [], pts = [], bb = new T3.Box3(), sz = V3(0, 0, 0), c = V3(0, 0, 0), seen = new Set();
  for (const x of [-1.2, 0, 1.2]) for (let z = B.z1 + 1.7; z <= B.z0 - 1.7 + 1e-6; z += 1.3) eyes.push(V3(x, 1.62, z));
  CTX.group.updateMatrixWorld(true);
  const visit = m => { if (!m.isMesh || seen.has(m)) return; seen.add(m); const mt = m.material;
    if (!mt || Array.isArray(mt) || (mt.transparent && (mt.opacity < .25 || mt.blending === T3.AdditiveBlending))) return;
    bb.setFromObject(m); if (bb.isEmpty() || bb.max.y < 3) return; bb.getSize(sz); bb.getCenter(c);
    const ax = [["x", sz.x], ["y", sz.y], ["z", sz.z]].sort((p, r) => r[1] - p[1]); if (ax[1][1] < .06) return;
    const g = [];
    for (const [k1, k2] of [[0, 0], [-.32, -.32], [-.32, .32], [.32, -.32], [.32, .32]]) { const p = c.clone(); p[ax[0][0]] += k1 * ax[0][1]; p[ax[1][0]] += k2 * ax[1][1]; if (p.y > 3) g.push(p); }
    if (g.length) pts.push(g); };
  for (const o of CTX.group.children.slice(CTX._shellEnd || 0, START)) if (!o.isLight && !o.userData.dekor) o.traverse(visit);
  return VIEW = {eyes, pts};
}
function segBox(p, q2, b){ let t0 = 0, t1 = 1;
  for (const [a, lo, hi] of [["x", b.x0, b.x1], ["y", b.y0, b.y1], ["z", b.z0, b.z1]]) { const d = q2[a] - p[a];
    if (Math.abs(d) < 1e-9) { if (p[a] < lo || p[a] > hi) return false; continue; }
    let ta = (lo - p[a]) / d, tb = (hi - p[a]) / d; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return false; }
  return true; }
// verdeckt der Quader b von einem Augenpunkt aus mindestens zwei Stützpunkte desselben Teils (bei nur einem Stützpunkt: diesen)?
function viewFree(b, m = .05){ const V = VIEW || viewSetup(), e = {x0: b.x0 - m, x1: b.x1 + m, y0: b.y0 - m, y1: b.y1 + m, z0: b.z0 - m, z1: b.z1 + m};
  for (const g of V.pts) { const cand = g.filter(p => p.y > e.y0); if (!cand.length) continue; const need = Math.min(2, g.length);
    for (const q2 of V.eyes) { let n = 0; for (const p of cand) if (segBox(q2, p, e) && ++n >= need) return false; } }
  return true; }
// Türen der Halle: Möbel dürfen keine Tür verdecken, gesehen vom Gang unter höchstens 40° zur Türnormalen (z. B. vom Eingang zur ersten Tür);
// 20 Punkte auf den Türflügeln, verdeckt sind höchstens zwei (ein schmales Teil vor der Türkante ist erlaubt, ein Globus vor dem halben Flügel nicht)
let DOORV = null;
function doorFree(b, m = .04){
  if (!DOORV) { const B = CTX.bounds, eyes = [], doors = [], p = V3(0, 0, 0);
    for (const x of [-1.2, 0, 1.2]) for (let z = B.z1 + 1.7; z <= B.z0 - 1.7 + 1e-6; z += 1.3) eyes.push(V3(x, 1.62, z));
    for (const o of CTX._inter || []) { const ia = o.userData.ia; if (!ia || ia.kind !== "door") continue; o.getWorldPosition(p);
      const n = Math.abs(p.x) > Math.abs(p.z) * .5 && Math.abs(p.x) > 1 ? V3(-Math.sign(p.x), 0, 0) : V3(0, 0, -Math.sign(p.z)), t = V3(-n.z, 0, n.x), pts = [];
      for (const a of [-1, -.5, 0, .5, 1]) for (const y of [.5, 1.3, 2.1, 2.9]) pts.push(p.clone().addScaledVector(t, a).addScaledVector(n, .1).setY(y));
      doors.push({c: p.clone(), n, pts, eyes: eyes.filter(e => { const d = V3(e.x - p.x, 0, e.z - p.z).normalize(); return d.dot(n) > .766; })}); }
    DOORV = doors; }
  const e = {x0: b.x0 - m, x1: b.x1 + m, y0: b.y0 - m, y1: b.y1 + m, z0: b.z0 - m, z1: b.z1 + m};
  for (const d of DOORV) for (const q2 of d.eyes) { let n = 0; for (const p of d.pts) if (segBox(q2, p, e) && ++n >= 3) return false; }
  return true;
}
function reserveShell(hall){   // was die Raumhülle baut: Pilaster mit Gaslampen, Regale, Bilder, Uhr, Kamin, Garderobe
  for (const w of [WL.left, WL.right]) for (const z of CTX.decorZ) { CTX.belege(CTX.wand(nmW(w), z, 0, HH, .92, .42)); CTX.belege(CTX.wand(nmW(w), z, LAMP_Y - .16, LAMP_Y + .52, .46, .78)); }
  const bxr = hall ? 8.4 : 7.5, bh = hall ? 3.8 : 3.4, top = bh + .09, py = bh + .42 + .69, rail = HH - .95, res = (s, x0, x1, y0, y1, d) => CTX.belege(CTX.wand(s, (x0 + x1) / 2, y0, y1, x1 - x0, d));
  res("front", -bxr, -2.3, 0, top, .64); res("front", 3.05, bxr, 0, top, .64); res("front", -(bxr + 2.3) / 2 - 1.02, -(bxr + 2.3) / 2 + 1.02, py - .82, rail, .12);
  res("front", (bxr + 3.05) / 2 - 1.02, (bxr + 3.05) / 2 + 1.02, py - .82, rail, .12); res("front", 2.18, 2.82, 1.84, 3.62, .24);
  if (hall) { res("back", -1.75, 1.75, 0, 6.15, 1.25); res("back", -bxr, -2.4, 0, top, .64); res("back", 2.4, bxr, 0, top, .64);
    for (const s of [-1, 1]) res("back", s * (bxr + 2.4) / 2 - 1.02, s * (bxr + 2.4) / 2 + 1.02, py - .82, rail, .12);
    CTX.belege(six(qw(-.75, .75, HH - .3, HH, -4.25, -2.75))); }
  else { res("back", 3.3, 6.1, 0, rail, 1.0); res("back", -bxr, -2.3, 0, top, .64); res("back", 6.25, bxr, 0, top, .64); res("back", -5.92, -3.88, py - .82, rail, .12);
    res("back", 1.8, 3.1, 2.8, rail, .12); res("back", 2.1, 2.9, 0, 2.15, .8); }
}

/* ---------- Kompositionen an den Seitenwänden (Feld Mitte a, Breite ≈ 3,5 m zwischen den Pilastern) ---------- */
const TH = {};   // Themenstücke je Raum
function topItems(F, x, W, y, D, k){   // Dinge auf Schränken
  const z = D / 2 + .02, v = [() => { bankerLamp(F, x - W * .22, y, z); fileStack(F, x + W * .18, y, z); },
    () => { typewriter(F, x, y, z, (R() - .5) * .3); }, () => { smallGlobe(F, x - W * .2, y, z, .9); bookStack(F, x + W * .2, y, z, 3); },
    () => { mantelClock(F, x - W * .15, y, z); candle(F, x + W * .25, y, z); }, () => { inkSet(F, x - W * .15, y, z); hourglass(F, x + W * .25, y, z); },
    () => { bookRow(F, x - W / 2 + .06, x + W * .1, y, z, .26, .2); vase(F, x + W * .28, y, z, .8, "#2a3a5a"); }];
  (v[k % v.length])();
}
const COMP = {
  akten: (w, a, ri) => ({b: [q(w, a, -1.06, 1.06, 0, 1.8, .6, true)], build: F => { cabinet(F, -.53, 1.0, 1.38, .52, {wood: ri % 2}); cabinet(F, .53, 1.0, 1.38, .52, {wood: ri % 2});
      topItems(F, -.53, 1.0, 1.42, .52, ri); topItems(F, .53, 1.0, 1.42, .52, ri + 3); }}),
  akten2: (w, a, ri) => ({b: [q(w, a, -1.15, 1.15, 0, 1.9, .55, true)], build: F => { cabinet(F, -.62, .9, 1.25, .5, {rows: 4, wood: !(ri % 2)}); shelfLow(F, .58, 1.1, 1.05, .4);
      TH.cab ? TH.cab(F, -.62, 1.29, .27) : topItems(F, -.62, .9, 1.29, .5, ri + 1); topItems(F, .58, 1.1, 1.09, .4, ri + 4); }}),
  regal: (w, a) => ({b: [q(w, a, -1.32, 1.32, 0, 2.45, .66, true)], build: F => { const tmp = [], u0 = uOf(w, a);
      bookcase(K, tmp, w, u0 - 1.2, u0 + 1.2, 2.24, R); tmp.forEach(([w2, u, y, d, sx, sy, sz, rz]) => BK.push([w2.m(u, y, d, 0, 0, rz, sx, sy, sz), BCOL[(R() * BCOL.length) | 0], .78 + R() * .42])); }}),
  // Vitrine und Farn auf dem Ständer (die Wedel reichen 0,9 m in den Raum)
  vitrine: (w, a) => ({b: [q(w, a, -1.25, .25, 0, 2.0, .6, true), q(w, a, .3, 1.45, 0, 1.4, .92, true)], build: F => { vitrine(F, -.5, 1.3, .52, TH.vit || (() => {}), {col: TH.vcol});
      plantStand(F, .78, .28, "farn", .82, .2, PI * .8, .85); }}),
  truhe: (w, a, ri) => ({b: [q(w, a, -1.25, .2, 0, 1.2, .62, true), q(w, a, .35, 1.25, 0, 1.3, .95, true)], build: F => { chest(F, -.55, 1.0, .55, .5);
      suitcase(F, -.6, .58, .3, .7, .2, .42, ["#5a3a22", "#3a2a22", "#6a4a2a"][ri % 3], .06); suitcase(F, -.55, .78, .3, .56, .17, .36, ["#2a3a2a", "#6a2a22", "#3a3a4a"][ri % 3], -.1);
      cy("vc", .14, .14, .22, 16, F.m(.06, .11, .3), "#7a5a3a"); tor("vc", .14, .008, 4, 16, F.m(.06, .2, .3, PI / 2), "#3a2214"); cy("vc", .145, .145, .02, 16, F.m(.06, .225, .3), "#5a3a22");
      const g = globeStand(F, .8, .48, 1, !TH.globeDone); if (g) { TH.globeDone = true; globeAnim(g); } }}),
  sessel: (w, a, ri, col) => ({b: [q(w, a, -1.2, 1.25, 0, 1.95, 1.25, true)], build: F => { TH.smokes.push(armchairGroup(F, 0, col, ri % 2 ? -1 : 1)); }}),
  thema: (w, a) => TH.floor ? TH.floor(w, a) : null
};
function tryComp(name, w, a, ri, col){
  const c0 = COMP[name](w, a, ri, col); if (!c0) return false;
  // Steht eine Lernstation vor dem Feld, rückt die Gruppe seitlich neben das Pult (sonst verschwindet z. B. das Themenstück ganz dahinter)
  // alles in der Koordinate entlang der Wand (wie a und der Versatz off)
  const s = nmW(w), mid = c0.b.reduce((t, b) => t + (w.side ? (b.z0 + b.z1) / 2 : (b.x0 + b.x1) / 2), 0) / c0.b.length - a;
  const st = (CTX.stations || []).filter(([x, z]) => w.side && (s === "left" ? x < 0 : x > 0) && Math.abs(z - a) < 1.9).map(([, z]) => z - a);
  let offs = [0, -.25, .25, -.5, .5];
  if (st.length) { const d = o => Math.min(1.4, ...st.map(v => Math.abs(mid + o - v)));
    offs = [0, -.2, .2, -.4, .4, -.6, .6, -.8, .8, -1, 1, -1.2, 1.2].sort((p, r) => d(r) - d(p) || Math.abs(p) - Math.abs(r)); }
  for (const off of offs) { const c = off ? COMP[name](w, a + off, ri, col) : c0; if (!c) return false;
    if (claim(...c.b)) { c.build(FW(w, a + off)); return true; } }
  return false;
}

/* ---------- Raum ---------- */
function roomDecor(){
  const key = CTX.key, th = key.replace(/\d+$/, ""), nr = +(key.match(/\d+$/) || [1])[0], ti = Math.max(0, ["strom", "optik", "beweg", "kraft"].indexOf(th)), ri = ti * 2 + nr - 1;
  const CUR = ["#6a1622", "#5a1a1a", "#1c2c52", "#22305a", "#1f4a32", "#2a4a2a", "#4a2048", "#5a2a1a"][ri], SEAT = ["#5a1a14", "#2a4a30", "#4a2a18", "#1f3a4a", "#5a3a1a", "#3a1a2a", "#2a3a2a", "#5a1a14"][ri];
  Object.keys(TH).forEach(k => delete TH[k]); TH.smokes = []; themeSetup(key);
  const PZ = [6.75, 2.25, -2.25, -6.75], panels = [];
  // oberes Feld frei ab 2,8 m (lift 0) oder erst ab 3,1 m (lift .3: das Hindernis eines Exponats an der Wand zählt bis 3 m Höhe)
  for (const w of [WL.left, WL.right]) for (const z of PZ) { const lift = CTX.frei(q(w, z, -1.65, 1.65, 2.8, 5.4, .3)) ? 0 : CTX.frei(q(w, z, -1.65, 1.65, 3.1, 5.4, .3)) ? .3 : -1;
    panels.push({w, z, up: lift >= 0, lift: Math.max(0, lift), done: false}); }
  // 1) obere freie Felder: rechts Fenster (Straßenseite), links Ermittlungswand und Gemälde oder Rollkarte
  const leftUp = panels.filter(p => p.w === WL.left && p.up), roles = ri % 2 ? ["bild", "ermittlung"] : ["ermittlung", "bild"];
  leftUp.forEach((p, i) => p.role = roles[i] || "karte"); if ((ri >> 1) % 2) leftUp.forEach(p => { if (p.role === "bild") p.role = "karte"; });
  panels.filter(p => p.w === WL.right && p.up).forEach(p => p.role = "fenster");
  let winN = 0;
  for (const p of panels) { const {w, z} = p, F = FW(w, z);
    if (p.role === "fenster") { const wW = 1.45, W2 = wW / 2 + .92, Wi = wW / 2 + .07, sill = p.lift ? 3.1 : 2.15, y0 = sill - .09, hi = q(w, z, -W2, W2, y0, 5.78, .33);
      // Vorhänge bis zum Boden (Seitenstreifen außerhalb von Heizkörper und Fensterbank), sonst bis unter das Fensterbrett, sonst knapp darüber;
      // Fenster und Streifen in einem Aufruf belegen, sonst stößt sich jeder Streifen am eigenen Fensterquader
      const side = (a, b) => [q(w, z, -W2, -Wi, a, b, .3, !a), q(w, z, Wi, W2, a, b, .3, !a)];
      const mode = !p.lift && claim(hi, ...side(0, y0)) ? "floor" : claim(hi, ...side(sill - .3, y0)) ? "sill" : claim(hi) ? "short" : null;
      if (!mode) continue;
      windowUnit(F, {sill, top: 5.05, wW, col: CUR, floor: mode === "floor", short: mode === "short"}); p.done = true;
      if (TH.window && !TH.winDone && TH.window(w, z)) TH.winDone = true; else if (winN % 2 === ri % 2) { if (claim(q(w, z, -.65, .65, 0, .9, .32, true))) radiator(F, 0, 1.2); }
      else if (claim(q(w, z, -.68, .68, 0, .75, .5, true))) windowSeat(F, SEAT);
      winN++; }
    else if (p.role === "ermittlung") { const L = p.lift; if (!claim(q(w, z, -1.42, 1.42, 2.82 + L, 4.82 + L, .14))) continue; investWall(F, 0, 3.12 + L, 2.6, 1.56); p.done = true;
      p.low = tryComp("akten", w, z, ri); if (p.low && claim(q(w, z, -1.62, 1.62, 2.18, 2.62, .2))) photosAnim(F, photoLine(F, -1.6, 1.6, 2.55, .12), .12); }
    else if (p.role === "bild") { const cell = ri % 4 < 2 ? CB.L : CB.S; if (!claim(q(w, z, -1.2, 1.2, 2.98 + p.lift, 5.55, .12))) continue; picture(F, 0, 3.9 + p.lift, 2.05, 1.28, cell); p.done = true; p.low = tryComp("sessel", w, z, ri, SEAT); }
    else if (p.role === "karte") { if (!claim(q(w, z, -1.08, 1.08, 3.0 + p.lift, 5.55, .1))) continue; rollMap(F, 0, 3.12 + p.lift, 1.9, 1.42); p.done = true; p.low = tryComp("sessel", w, z, ri, SEAT); }
  }
  // 2) übrige Felder (meist mit Tafel): unten Möbel aus einer je Raum gedrehten Auswahl, darüber Wandschmuck, über der Tafel ein Wappen, wenn Platz ist
  const rest = panels.filter(p => p.role !== "fenster" && !p.low), menu = ["thema", "vitrine", ...["regal", "truhe", "akten2"].map((_, i, a) => a[(i + ri) % 3]), "sessel", "akten2", "truhe"];
  rest.sort(() => R() - .5); let wk = ri;
  for (const p of rest) { const F = FW(p.w, p.z);
    for (let i = 0; i < menu.length; i++) if (tryComp(menu[i], p.w, p.z, ri, SEAT)) { menu.splice(i, 1); break; }
    if (p.done) continue;
    for (const x of [-.75, .75]) { const it = WALLITEMS[(wk + (x > 0 ? 1 : 0)) % WALLITEMS.length]; if (claim(q(p.w, p.z, x - it.w / 2, x + it.w / 2, it.y0, it.y1, it.d))) { it.fn(F, x); } } wk += 2;
    if (claim(q(p.w, p.z, -1.25, 1.25, HH - .93, HH - .36, .12))) frieze(F, ri + (p.w === WL.left ? 0 : 1));
  }
  // 3) Ecken an den Seitenwänden (zwischen letztem Pilaster und Vorder-/Rückwand): unten Kleinmöbel, oben kleine Bilder
  const corner = [[WL.left, 9.98, "schirm"], [WL.right, 9.98, ri % 2 ? "kaefig" : "farn"], [WL.left, -9.98, ri % 2 ? "farn" : "kaefig"], [WL.right, -9.98, "vase"]];
  corner.forEach(([w, a, kind], i) => { const F = FW(w, a);
    if (kind === "schirm" && claim(q(w, a, -.22, .22, 0, 1.25, .46, true))) umbrellaStand(F, 0, .22);
    else if (kind === "kaefig" && claim(q(w, a, -.42, .42, 0, 2.05, .82, true))) birdcage(F, 0, .22);
    else if (kind === "farn" && claim(q(w, a, -.3, .3, 0, 1.5, .62, true))) plantStand(F, 0, .26, "farn", .82, .45, PI - .45, .8);
    else if (kind === "vase" && claim(q(w, a, -.22, .22, 0, 1.6, .44, true))) floorVase(F, 0, .22, "#24406a");
    const up = [() => picture(F, 0, 3.75, .6, .78, CB.P1, {oval: true}), () => picture(F, 0, 3.75, .6, .78, CB.P2, {fw: .07}), () => barometer(F, 0, 3.4), () => engraving(F, 0, 3.7, .76, .57, CM["T" + ti])][(i + ri) % 4];
    if (TH.cornerUp) { if (claim(q(w, a, -.46, .46, 2.85, 4.75, .14))) TH.cornerUp(F, i); }
    else if (claim(q(w, a, -.46, .46, 2.85, 4.75, .14))) up(); });
  // 4) Vorder- und Rückwand: Dinge auf den Regalen, Bibliotheksleiter
  const tops = [["front", -6.7, "buste"], ["front", -3.1, "eule"], ["front", 3.6, "urne"], ["front", 6.95, "globus"], ["back", -6.7, "urne"], ["back", -3.1, "globus"], ["back", 6.85, "buste"]], y = 3.49;
  tops.forEach(([s, x, kind], i) => { const w = WL[s], F = FW(w, x); if (!claim(q(w, x, -.24, .24, y + .02, y + .66, .5, false, .01))) return;
    if (kind === "buste") bust(F, 0, y, .26, .62); else if (kind === "eule") owl(F, 0, y, .26); else if (kind === "urne") vase(F, 0, y, .26, 1.3, ["#5a1a14", "#1f2b47", "#2a4a3a"][(i + ri) % 3]);
    else smallGlobe(F, 0, y, .26, 1.4); });
  { const x = ri % 2 ? 3.6 : -3.0, w = WL.front, F = FW(w, x); if (claim(q(w, x, -.28, .28, 0, 3.55, 1.6, true, .06, .66))) ladder(F, 0, 3.4, .64, .9); }
  // 5) Luftraum über dem Mittelgang: zwei Gaslüster und ein Stück zum Thema; Sichtlinien zu den Türschildern bleiben frei
  const sight = z => Math.max(1.62 + 3.53 * (9.3 - z) / 20.3, 1.62 + 3.53 * (z + 9.3) / 20.3) + .12;
  // Jeder Platz muss frei sein und darf vom Gang aus nichts Hohes verdecken (viewFree); ist die Mitte nicht frei, hängen die Lüster seitlich,
  // der eine links, der andere rechts; Hängendes in derselben Reihe hält 1,9 m Abstand
  const placed = [], air = (zs, half, yb, yt, xs) => { for (const x of xs) for (const z of zs) { if (!x && yb < sight(z)) continue;
    if (placed.some(([px, pz]) => px === x && Math.abs(pz - z) < 1.9)) continue; const b = qw(x - half, x + half, yb, yt, z - half, z + half);
    if (isFree(b) && viewFree(b) && claim(b)) { placed.push([x, z]); return [x, z]; } } return null; };
  const A = air([4.8, 5.6, 4.0, 6.4, 3.2], .82, 4.55, HH, [0, -3.3, 3.3]);
  if (A) TH.lusterA ? TH.lusterA(...A) : gasolier(...A, {drop: .4, s: 1.15});
  const Bz = air([-4.6, -5.4, -3.8, -6.2, -3.0, -2.2, -7.0], .82, 4.55, HH, [0, 3.3, -3.3]); if (Bz) gasolier(...Bz, {drop: .4, s: 1.15});
  if (TH.hang) { const Hz = air([1.5, 2.5, .5, 3.5, -.5, -1.5, 6.5, 7.2, -7.2], TH.hang.half, TH.hang.yb, HH, [0, -3.3, 3.3]); if (Hz) TH.hang.fn(...Hz); }
  TH.smokes.forEach(p => p && smoke(p));
}
function floorVase(F, x, z, col){ vase(F, x, 0, z, 1.9, col); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, tx = x + Math.cos(a) * .12, tz = z + Math.sin(a) * .08;
    rod("vc", F, [x, .6, z], [tx, 1.4 + (i % 3) * .07, tz], .004, 3, "#6a5a3a"); sp("vc", .035, 6, 5, F.m(tx, 1.45 + (i % 3) * .07, tz, 0, 0, 0, .7, 1.6, .7), i % 2 ? "#2a5a5a" : "#7a6a3a"); } }
const WALLITEMS = [   // Wandschmuck zwischen Möbeloberkante und Tafel (y < 2,65 m)
  {w: 1.0, y0: 1.98, y1: 2.6, d: .26, fn: (F, x) => wallShelf(F, x, 2.06, .9)},
  {w: .56, y0: 1.95, y1: 2.6, d: .1, fn: (F, x) => keyBoard(F, x, 2.25)},
  {w: .9, y0: 1.98, y1: 2.6, d: .3, fn: (F, x) => hatRack(F, x, 2.12, .8)},
  {w: .9, y0: 1.98, y1: 2.6, d: .08, fn: (F, x) => smallFrames(F, x, 2.3)},
  {w: .5, y0: 1.95, y1: 2.67, d: .22, fn: (F, x) => (TH.wallSmall || barometerSmall)(F, x)}
];
function wallShelf(F, x, y, W){ bx("dark", W, .03, .22, F.m(x, y, .11)); bx("dark", W, .015, .02, F.m(x, y - .02, .21)); for (const s of [-1, 1]) { bx("dark", .03, .16, .03, F.m(x + s * (W / 2 - .1), y - .1, .015));
    tub("brass", F, [[x + s * (W / 2 - .1), y - .2, .02], [x + s * (W / 2 - .1), y - .12, .1], [x + s * (W / 2 - .1), y - .02, .19]], .006, 6, 4); }
  bookRow(F, x - W / 2 + .04, x + .05, y + .015, .11, .26, .18);
  const jc = ["#5a7a3a", "#8a3a1a", "#3a5a7a", "#7a6a2a"]; for (let i = 0; i < 3; i++) { const xx = x + .16 + i * .1, h = .12 + (i % 2) * .06;
    cy("glass", .035, .035, h, 10, F.m(xx, y + .015 + h / 2, .1)); cy("vc", .03, .03, h * .6, 8, F.m(xx, y + .015 + h * .3, .1), jc[(i + (R() * 4 | 0)) % 4]); cy("vc", .02, .025, .02, 8, F.m(xx, y + .025 + h, .1), "#6a4a2a"); } }
function keyBoard(F, x, y){ bx("dark", .5, .36, .03, F.m(x, y, .015)); bx("paper", .3, .05, .004, F.m(x, y + .14, .032)); for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { const xx = x - .18 + i * .09, yy = y + .04 - r * .15;
    cy("brass", .004, .004, .03, 4, F.m(xx, yy, .045, PI / 2)); if (R() < .75) { tor("brass", .012, .003, 3, 8, F.m(xx, yy - .02, .055)); bx("brass", .006, .05, .003, F.m(xx, yy - .06, .056)); bx("brass", .014, .008, .003, F.m(xx + .006, yy - .08, .056)); } } }
function hatRack(F, x, y, W){ bx("dark", W, .1, .03, F.m(x, y, .015)); bx("dark", W, .025, .24, F.m(x, y + .2, .12)); for (const s of [-1, 1]) tub("dark", F, [[x + s * W * .4, y, .02], [x + s * W * .4, y + .08, .12], [x + s * W * .4, y + .19, .22]], .012, 6, 4);
  for (let i = 0; i < 4; i++) { const xx = x - W * .36 + i * W * .24; tub("brass", F, [[xx, y, .03], [xx, y - .02, .08], [xx, y + .02, .1]], .006, 6, 3); }
  const hx = x - W * .18; sp("vc", .1, 12, 8, F.m(hx, y + .215, .12, 0, 0, 0, 1, .8, 1), "#141212"); cy("vc", .15, .15, .012, 16, F.m(hx, y + .22, .12, 0, 0, 0, 1, 1, .85), "#141212");
  cy("vc", .085, .09, .17, 14, F.m(x + W * .22, y + .3, .12), "#121010"); cy("vc", .14, .14, .012, 16, F.m(x + W * .22, y + .218, .12), "#121010"); cy("vc", .09, .09, .03, 14, F.m(x + W * .22, y + .25, .12), "#5a1a14");
  bx("vc", .06, .5, .02, F.m(x - W * .12, y - .26, .07, .05, 0, .05), "#5a2a1e"); }
function smallFrames(F, x, y){ [[-.25, .02, 0], [.05, -.04, 3], [.3, .05, 5]].forEach(([dx, dy, k]) => { const c = PHOTO(k);
  pln("misc", .14, .18, F.m(x + dx, y + dy, .025), {uvr: uvc(c)}); for (const s of [-1, 1]) { bx("gilt", .2, .03, .02, F.m(x + dx, y + dy + s * .105, .012)); bx("gilt", .03, .18, .02, F.m(x + dx + s * .085, y + dy, .012)); } bx("dark", .17, .2, .01, F.m(x + dx, y + dy, .006)); }); }
function wallPhone(F, x){   // Wandtelefon mit Kurbel, Glocken, Sprechtrichter und Hörer
  const y = 2.25; bx("dark", .24, .36, .12, F.m(x, y, .06)); bx("dark", .28, .03, .14, F.m(x, y + .195, .07)); bx("dark", .3, .03, .18, F.m(x, y - .2, .09));
  for (const s of [-1, 1]) { sp("brass", .045, 10, 6, F.m(x + s * .06, y + .11, .125, PI / 2, 0, 0, 1, 1, .6)); }
  tub("brass", F, [[x, y - .02, .12], [x, y - .02, .2], [x, y + .02, .25]], .008, 6, 4); cone("vc", .035, .07, 10, F.m(x, y + .04, .27, -PI / 2.4), "#141212");
  cy("vc", .02, .025, .14, 10, F.m(x - .16, y - .02, .08), "#141212"); tub("vc", F, [[x - .16, y - .09, .08], [x - .14, y - .2, .1], [x - .1, y - .14, .1]], .004, 8, 3, "#3a2a1a");
  cy("brass", .008, .008, .08, 6, F.m(x + .16, y, .06, 0, 0, PI / 2)); bx("brass", .015, .07, .015, F.m(x + .2, y - .03, .06)); cy("vc", .01, .01, .04, 6, F.m(x + .2, y - .07, .08, PI / 2), "#2a1a10"); }
function wallMirror(F, x){ picture(F, x, 2.3, .34, .46, null, {mirror: true, oval: true, wire: false}); }
function barometerSmall(F, x){ const y = 2.26; bx("dark", .34, .44, .1, F.m(x, y, .05)); cy("dark", .17, .17, .1, 20, F.m(x, y + .2, .05, PI / 2)); tor("brass", .15, .012, 5, 24, F.m(x, y + .2, .1));
  K.add("face", new T3.CircleGeometry(.14, 24), F.m(x, y + .2, .101)); bx("glass", .24, .2, .005, F.m(x, y - .08, .102)); }
function frieze(F, k){   // Fries über der Bilderleiste: Wappenkartusche, daneben zwei Wandteller
  const y = HH - .64; picture(F, 0, y, .36, .45, CB.W, {fw: .04, wire: false, crest: false});
  for (const s of [-1, 1]) { const x = s * .95; cy("vc", .17, .15, .02, 24, F.m(x, y, .03, PI / 2), "#f2ede0"); tor("vc", .13, .008, 3, 24, F.m(x, y, .042), ["#24406a", "#7c2620", "#2f5d5d"][k % 3]);
    tor("gilt", .17, .006, 3, 24, F.m(x, y, .04)); K.add("bild", new T3.CircleGeometry(.11, 20), F.m(x, y, .043), {uvr: uvc(s < 0 ? CB.L : CB.S)}); bx("brass", .02, .1, .02, F.m(x, y - .18, .02)); } }
function windowSeat(F, col){ bx("dark", 1.3, .42, .44, F.m(0, .21, .22)); for (const s of [-1, 1]) bx("wood", .6, .26, .01, F.m(s * .32, .22, .445)); bx("velvet", 1.28, .1, .44, F.m(0, .47, .23), col);
  for (const s of [-1, 1]) bx("velvet", .34, .3, .1, F.m(s * .42, .65, .1, -.25, s * .2, s * .15), tint(col, 1.25)); }

/* ---------- Themen je Raum ---------- */
function themeSetup(key){
  const vfill = f => TH.vit = f;
  switch (key) {
    case "strom1":   // Werkstatt des Elektrikers: Leidener Flaschen, Influenzmaschine, Glühlampen-Elektrolier
      vfill((C, y0, y1, W) => { bx("dark", .62, .03, .22, C.m(-.12, y0 + .015, .26)); for (let i = 0; i < 4; i++) leyden(C, -.39 + i * .18, y0 + .03, .26, .7); leyden(C, .38, y0, .26, .9);
        for (const s of [-1, 1]) leyden(C, s * .28, y1, .26, .6); galvanometer(C, 0, y1, .26); });
      TH.floor = (w, a) => ({b: [q(w, a, -.5, .5, 0, 1.5, .9, true)], build: F => { wimshurst(F, 0, .45); }}); TH.hang = {half: .45, yb: 4.6, fn: bulbPendant}; TH.wallSmall = wallPhone; break;
    case "strom2":   // Keller unter der Laterne: Volta-Säule, Schalttafel, Bogenlampe
      vfill((C, y0, y1) => { voltaPile(C, -.25, y0, .26); voltaPile(C, .22, y0, .26); galvanometer(C, -.2, y1, .26); for (const s of [0, 1]) leyden(C, .15 + s * .2, y1, .26, .6); });
      TH.floor = (w, a) => ({b: [q(w, a, -.72, .72, .85, 2.05, .3), q(w, a, -.7, .7, 0, .8, .5, true)], build: F => { switchboard(F, 0, .95);
        for (let i = 0; i < 5; i++) tor("vc", .16 - i * .01, .022, 5, 18, F.m(-.4, .025 + i * .04, .28, PI / 2), "#2a1c14"); crate(F, .38, 0, .28, .42, .1, true); }});
      TH.hang = {half: .4, yb: 4.6, fn: arcLamp}; TH.wallSmall = wallPhone; break;
    case "optik1":   // Spiegelkabinett: Standspiegel, Wandspiegel, Kristalllüster
      vfill((C, y0, y1) => { for (let i = 0; i < 3; i++) K.add("glass", new T3.CylinderGeometry(.06, .06, .14, 3), C.m(-.35 + i * .3, y0 + .07, .26, 0, i), {}); for (let i = 0; i < 3; i++) { K.add("glass", new T3.CylinderGeometry(.05, .05, .12, 3), C.m(-.3 + i * .3, y1 + .06, .26, PI / 2, i * .7)); }
        for (const s of [-1, 1]) { cy("mirror", .09, .09, .008, 20, C.m(s * .45, y1 + .1, .2, PI / 2 - .2)); cy("brass", .02, .03, .1, 8, C.m(s * .45, y1 + .05, .2)); } });
      TH.floor = (w, a) => ({b: [q(w, a, -.6, .6, 0, 1.9, .75, true)], build: F => { chevalMirror(F, 0, .38, (R() - .5) * .4); }});
      TH.cornerUp = (F, i) => picture(F, 0, 3.75, .62, .8, null, {mirror: true, oval: i % 2 === 0, fw: .08});
      TH.lusterA = (x, z) => prismLuster(x, z); TH.wallSmall = wallMirror; break;
    case "optik2":   // Laden des Optikers: Brillen, Lupen, Mikroskop, Fernrohr, Ladenschild
      vfill((C, y0, y1) => { microscope(C, -.3, y0, .26, .4); for (let i = 0; i < 3; i++) magnifier(C, .1 + i * .14, y0, .2 + (i % 2) * .1, 1 + i);
        for (let i = 0; i < 4; i++) spectacles(C, -.42 + i * .28, y1, .3, (R() - .5) * .4); });
      TH.floor = (w, a) => ({b: [q(w, a, -.55, .55, 0, 1.6, 1.0, true)], build: F => { plateCamera(F, 0, .5, (R() - .5) * .6); }});
      TH.window = (w, a) => { for (const [x0, x1, tx, ry] of [[-.15, .95, .4, .25], [-.95, .15, -.4, -.25]]) for (const dd of [1.2, 1.45]) if (claim(q(w, a, x0, x1, 0, 2.0, dd, true, .06, .38))) { telescope(FW(w, a), tx, dd - .5, ry); return true; } return false; };   // Quader erst ab 0,38 m: davor hängen die Vorhänge bis zum Boden
      TH.hang = {half: .9, yb: 4.6, fn: spectacleSign}; TH.wallSmall = wallMirror; break;
    case "beweg1":   // Kutschenstation: Hochrad, Wagenrad, Taschenuhren, Bahnhofsuhr
      vfill((C, y0, y1) => { for (let i = 0; i < 4; i++) { const W2 = subF(C, -.42 + i * .28, .3, 0, y0); bx("dark", .06, .02, .06, W2.m(0, .01, 0)); rod("brass", W2, [0, .02, -.02], [0, .2, -.02], .004); tor("brass", .055, .009, 5, 18, W2.m(0, .22, 0, -.2)); K.add("face", new T3.CircleGeometry(.05, 16), W2.m(0, .22, .006, -.2)); tor("brass", .012, .003, 3, 8, W2.m(0, .285, -.01)); }
        hourglass(C, -.3, y1, .26); mantelClock(C, .25, y1, .26); });
      TH.floor = (w, a) => ({b: [q(w, a, -1.32, 1.7, 0, 1.6, .74, true)], build: F => { pennyFarthing(F, -.35); wagonWheel(F, 1.0); }});
      TH.hang = {half: .48, yb: 4.6, fn: stationClock}; break;
    case "beweg2":   // Labor des Professors: Modelleisenbahn, Kugelstoßpendel, Ballon
      vfill((C, y0, y1) => { newtonCradle(C, -.25, y0, .26); for (let i = 0; i < 3; i++) cy("brass", .05 - i * .012, .05 - i * .012, .01, 16, C.m(.2 + i * .1, y0 + .005, .26)); hourglass(C, .3, y1, .26); smallGlobe(C, -.25, y1, .26, .8); });
      TH.floor = (w, a) => ({b: [q(w, a, -1.0, 1.0, 0, 1.4, .84, true)], build: F => { modelTrain(F, 0); }});
      TH.hang = {half: .5, yb: 3.9, fn: (x, z) => balloon(x, z, HH - 1.45)}; break;
    case "kraft1":   // Hafenkran an der Themse: Anker, Kisten und Fass, Flaschenzug
      vfill((C, y0, y1) => { weightSet(C, 0, y0, .26); for (let i = 0; i < 3; i++) cy("iron", .04 + i * .01, .04 + i * .01, .05 + i * .02, 14, C.m(-.35 + i * .35, y1 + .025 + i * .01, .26)); });
      TH.floor = (w, a) => ({b: [q(w, a, -1.3, 1.4, 0, 1.6, .85, true)], build: F => { anchor(F, -.75); crate(F, .7, 0, .42, .62, .08, true); crate(F, .66, .62, .4, .4, -.2); barrel(F, 1.15, 0, .55, .7); }});
      TH.hang = {half: .48, yb: 3.6, fn: (x, z) => pulley(x, z, .95)}; break;
    case "kraft2":   // Hügel von Hampstead: schiefe Ebene, Federwaagen, Balkenwaage, Drachen
      vfill((C, y0, y1) => { for (let i = 0; i < 3; i++) { const pts = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU * 5; pts.push([-.3 + i * .3 + Math.cos(a) * .035, y0 + .02 + k / 40 * (.12 + i * .05), .26 + Math.sin(a) * .035]); } tub("steel", I4(), pts.map(p => C.p(...p).toArray()), .004, 120, 3); }
        weightSet(C, 0, y1, .26); });
      TH.cab = (F, x, y, z) => balance(F, x, y, z);
      TH.floor = (w, a) => ({b: [q(w, a, -.55, .55, 0, 1.12, .66, true), q(w, a, -.55, .55, 1.5, 2.4, .2)], build: F => { inclinedPlane(F, 0); springScales(F, 0, 2.3); }});
      TH.hang = {half: .55, yb: 3.6, fn: (x, z) => kite(x, z, HH - 1.5)}; break;
  }
}

/* ---------- Halle: festlich ---------- */
function banner(x, z, side){   // Wandbehang mit Wappen und Fransen, an Kordeln von der Decke
  const top = ceilY(z, x), F = fr(M(x, 0, z, 0, side * PI / 2)), yb = HH - .55, W = 1.0, Hb = 1.7;
  cy("brass", .016, .016, W + .2, 8, F.m(0, yb, 0, 0, 0, PI / 2)); for (const s of [-1, 1]) { sp("brass", .035, 8, 6, F.m(s * (W / 2 + .1), yb, 0)); rod("vc", F, [s * (W / 2 + .05), yb, 0], [0, top, 0], .004, 3, "#c9a04a"); }
  const g = new T3.BufferGeometry(), P = [], UVs = [], hw = W / 2, y0 = yb - Hb, tip = .32;
  const pts = [[-hw, yb], [hw, yb], [hw, y0 + tip], [0, y0], [-hw, y0 + tip]];
  for (const [i0, i1, i2] of [[0, 4, 1], [1, 4, 3], [1, 3, 2]]) for (const k of [i0, i1, i2]) { P.push(pts[k][0], pts[k][1] - yb, 0); UVs.push((pts[k][0] + hw) / W, (pts[k][1] - y0) / Hb); }
  g.setAttribute("position", new T3.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(UVs, 2)); g.computeVertexNormals();
  K.add("velvet", g, F.m(0, yb - .02, 0), {c: "#6a1622"});
  for (const s of [1, -1]) { const zz = s * .012, ry = s > 0 ? 0 : PI; K.add("bild", new T3.PlaneGeometry(.62, .78), F.m(0, yb - .78, zz, 0, ry), {uvr: uvc(CB.W)});
    const inn = [[-hw + .06, yb - .06], [hw - .06, yb - .06], [hw - .06, y0 + tip + .02], [0, y0 + .08], [-hw + .06, y0 + tip + .02]];
    inn.forEach((A, k) => { const Bp = inn[(k + 1) % 5]; rod("gilt", F, [A[0], A[1], zz], [Bp[0], Bp[1], zz], .008, 4); }); }
  for (const s of [-1, 1]) { cone("gilt", .04, .14, 8, F.m(s * hw, y0 + tip - .1, 0)); sp("gilt", .03, 6, 4, F.m(s * hw, y0 + tip - .02, 0)); } cone("gilt", .05, .16, 8, F.m(0, y0 - .1, 0));
}
function sofa(F, col){   // Chesterfield-Sofa mit Knöpfen und Rollarmlehnen
  bx("vc", 2.0, .3, .86, F.m(0, .27, 0), col); for (let i = 0; i < 3; i++) bx("vc", .62, .12, .66, F.m(-.64 + i * .64, .47, .06), tint(col, 1.1));
  bx("vc", 2.0, .5, .2, F.m(0, .68, -.33), col); cy("vc", .1, .1, 2.0, 12, F.m(0, .93, -.33, 0, 0, PI / 2), tint(col, .95));
  for (const s of [-1, 1]) { bx("vc", .2, .45, .86, F.m(s * .98, .55, 0), col); cy("vc", .12, .12, .86, 12, F.m(s * .98, .78, 0, PI / 2), tint(col, 1.05)); }
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) sp("brass", .012, 4, 3, F.m(-.86 + i * .215 + (r % 2) * .1, .62 + r * .16, -.225));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy("dark", .04, .03, .12, 6, F.m(sx * .9, .06, sz * .35));
}
function candelabra(F, x, z){ const C = subF(F, x, z), L = [];
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; tub("brass", C, [[0, .25, 0], [Math.cos(a) * .18, .12, Math.sin(a) * .18], [Math.cos(a) * .26, 0, Math.sin(a) * .26]], .02, 8, 5); }
  lat("brass", [[.05, .2], [.08, .3], [.04, .4], [.035, 1.2], [.06, 1.3], [.03, 1.45], [.03, 1.55], [.07, 1.6], [0, 1.62]], 12, C.m());
  for (let i = 0; i < 5; i++) { const a = i / 4 * TAU, r0 = i === 4 ? 0 : .26, xx = Math.cos(a) * r0, zz = Math.sin(a) * r0, yy = i === 4 ? 1.72 : 1.66;
    if (i < 4) tub("brass", C, [[0, 1.5, 0], [xx * .5, 1.48, zz * .5], [xx, 1.58, zz]], .012, 8, 4); cy("brass", .04, .025, .04, 10, C.m(xx, yy - .02, zz)); cy("wax", .016, .016, .18, 8, C.m(xx, yy + .09, zz));
    cone("fil", .009, .035, 6, C.m(xx, yy + .2, zz)); L.push(C.p(xx, yy + .2, zz)); }
  HALOS.push(...L);
}
function grandClock(F, x){   // Standuhr mit schwingendem Pendel
  const C = subF(F, x, 0); bx("dark", .56, .16, .34, C.m(0, .08, .17)); bx("wood", .5, .52, .3, C.m(0, .42, .15)); bx("dark", .54, .05, .33, C.m(0, .7, .165));
  bx("wood", .42, .92, .28, C.m(0, 1.18, .14)); bx("glass", .3, .76, .005, C.m(0, 1.18, .283)); for (const s of [-1, 1]) bx("dark", .04, .92, .3, C.m(s * .21, 1.18, .15));
  bx("dark", .52, .05, .33, C.m(0, 1.66, .165)); bx("wood", .5, .52, .3, C.m(0, 1.94, .15)); tor("brass", .17, .015, 6, 28, C.m(0, 1.94, .305)); K.add("face", new T3.CircleGeometry(.165, 28), C.m(0, 1.94, .302));
  bx("dark", .6, .06, .36, C.m(0, 2.23, .18)); K.add("dark", new T3.CylinderGeometry(.3, .3, .34, 16, 1, false, 0, PI), C.m(0, 2.26, .17, PI / 2, 0, PI / 2, 1, 1, .4)); sp("gilt", .04, 8, 6, C.m(0, 2.46, .2));
  const P = group(C.m(0, 1.6, .2)), Q = I4(); meshes(withK(() => { bx("brass", .012, .62, .006, Q.m(0, -.31, 0)); cy("brass", .08, .08, .015, 20, Q.m(0, -.66, 0, PI / 2)); }), P);
  CTX.tick((dt, t) => { P.rotation.z = Math.sin(t * PI / 1.0) * .07; });
}
function palm(x, z, s, pot){   // Kentia-Palme im Übertopf: Bodenquader und Kronenquader werden geprüft (frei und ohne eine Tür zu verdecken)
  const c = .78 * s / .8, bs = [qw(x - .3, x + .3, 0, 1.0, z - .3, z + .3, true), qw(x - c, x + c, 1.0, 2.5, z - c, z + c, false, .02)];
  if (!isFree(...bs) || !bs.every(b => doorFree(b)) || !claim(...bs)) return;
  const F = fr(M(x, 0, z)); if (pot === "brass") { cy("brass", .25, .19, .46, 16, F.m(0, .23, 0)); tor("brass", .25, .018, 4, 18, F.m(0, .46, 0, PI / 2)); }
  else { lat("vc", [[0, 0], [.16, 0], [.22, .1], [.25, .42], [.22, .46], [0, .44]], 16, F.m(), pot); tor("gilt", .25, .012, 4, 18, F.m(0, .4, 0, PI / 2)); }
  plant(F, 0, .44, 0, "palme", s);
}
function trophyFill(C, y0, y1){ magnifier(C, -.3, y0, .25, 2); bookStack(C, .2, y0, .26, 2); spectacles(C, .25, y0 + .07, .26, .3); mantelClock(C, -.25, y1, .26); candle(C, .3, y1, .26);
  cy("vc", .04, .03, .05, 10, C.m(0, y1 + .025, .26), "#3a2014"); }
function hallDecor(){
  // Wege zu den Seitentüren freihalten
  for (const z of [6, -1, -8, -15]) CTX.belege(six(qw(-9, 9, 0, 3.2, z - 1.4, z + 1.4)));
  // Gaslüster (groß, zwei Etagen) und Wandbehänge mit Wappen
  for (const z of [4.9, -11.2]) if (claim(qw(-1.2, 1.2, 4.7, HH, z - 1.2, z + 1.2))) gasolier(0, z, {s: 1.35, arms: 8, tiers: 2, drop: .55});
  for (const x of [-3.6, 3.6]) for (const z of [2.6, -6.6, -12.0]) if (claim(qw(x - .3, x + .3, HH - 2.4, HH, z - .65, z + .65))) banner(x, z, x < 0 ? 1 : -1);
  // Sitzgruppe links hinten: Chesterfield-Sofa, zwei Ohrensessel, Tisch, Stehlampe, Pfeife
  const smokes = [];
  { const cx = -5.15, cz = -11.5; if (claim(qw(cx - 1.35, cx + 1.85, 0, 1.9, cz - 1.75, cz + 1.75, true))) { const F = fr(M(cx - .7, 0, cz, 0, PI / 2)); sofa(F, "#5a1a14");
      const T = fr(M(cx + .45, 0, cz)); bx("wood", 1.0, .04, .6, T.m(0, .46, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy("dark", .03, .025, .44, 8, T.m(sx * .42, .22, sz * .24));
      bookStack(T, -.2, .48, 0, 3); candle(T, .25, .48, -.1); smokes.push(pipeSet(T, .2, .48, .15));
      for (const s of [-1, 1]) armchair(fr(M(cx + .9, 0, cz + s * 1.15, 0, s > 0 ? PI + .3 : -.3)), "#2a4a30");
      floorLamp(fr(M(cx - .75, 0, cz + 1.4))); } }
  // Vitrinen mit Fundstücken gelöster Fälle, Palmen, Büsten, Globus, Kandelaber, Standuhr
  // Plätze der Reihe nach: der erste freie, von dem aus keine Tür verdeckt wird; Vitrinen und Globus stehen dazu in den Wandfeldern zwischen den Türen
  const free = (spots, w, d, h, fn) => { for (const [x, z] of spots) { const b = qw(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, true);
    if (isFree(b) && doorFree(b) && claim(b)) { fn(fr(M(x, 0, z))); return true; } } return false; };
  free([[8.1, 2.5], [5.6, 1.7]], .66, 1.45, 1.95, F => vitrine(fr(F.m(.26, 0, 0, 0, -PI / 2)), 0, 1.3, .52, trophyFill, {col: "#1f2b47"}));
  palm(6.2, 3.8, .85, "brass");
  for (const s of [-1, 1]) { free([[s * 7.6, -4.5], [s * 4.9, -4.5]], .62, .62, 1.85, F => { pedestal(F, 0, 0, 1.1); bust(F, 0, 1.1, 0, 1.0, s > 0 ? -PI / 2 : PI / 2); });
    for (const dz of [-1.2, 1.2]) palm(s * 5.4, -4.5 + dz, .85, "#24406a"); }
  free([[-7.5, 2.5], [-6.1, 1.35]], .95, .95, 1.6, F => { const g = globeStand(F, 0, 0, 1.4, true); if (g) globeAnim(g); });
  palm(-6.2, 3.55, .8, "#7a2a1e");
  free([[8.1, -11.5], [5.6, -11.5]], .66, 1.45, 1.95, F => vitrine(fr(F.m(.26, 0, 0, 0, -PI / 2)), 0, 1.3, .52, (C, y0, y1) => { smallGlobe(C, -.3, y0, .26, .9); owl(C, .25, y0, .26); bust(C, 0, y1, .26, .45); }, {col: "#5a1820"}));
  free([[6.9, -11.5], [6.0, -10.0]], .62, .62, 1.5, F => plantStand(F, 0, 0, "farn"));
  for (const s of [-1, 1]) free([[s * 3.15, -16.95]], .62, .62, 1.95, F => candelabra(F, 0, 0));
  for (const s of [-1, 1]) palm(s * 6.4, -16.6, .85, "brass");
  for (const s of [-1, 1]) palm(s * 6.8, 10.0, .9, "#7a2a1e");
  for (const s of [-1, 1]) { const w = s < 0 ? WL.left : WL.right; if (claim(q(w, 9.0, -.32, .32, 0, 2.55, .4, true))) grandClock(FW(w, 9.0), 0);
    if (claim(q(w, 9.0, -.42, .42, 2.95, 4.6, .12))) engraving(FW(w, 9.0), 0, 3.75, .7, .52, CM[s < 0 ? "T1" : "T3"]); }
  // Ecken: Bildnisse
  for (const [w, a, k] of [[WL.left, 11.2, 0], [WL.right, 11.2, 1]]) { const F = FW(w, a);
    if (claim(q(w, a, -.42, .42, 2.9, 4.8, .14))) [() => picture(F, 0, 3.8, .6, .78, CB.P1, {oval: true}), () => picture(F, 0, 3.8, .6, .78, CB.P2, {fw: .07})][k](); }
  // auf den Regalen
  [["front", -7.6, "buste"], ["front", -3.1, "urne"], ["front", 3.8, "urne"], ["front", 7.7, "eule"], ["back", -7.6, "globus"], ["back", -3.1, "buste"], ["back", 3.1, "buste"], ["back", 7.6, "urne"]].forEach(([s, x, kind], i) => {
    const w = WL[s], F = FW(w, x), y = 3.89; if (!claim(q(w, x, -.26, .26, y + .02, y + .7, .5, false, .01))) return;
    if (kind === "buste") bust(F, 0, y, .26, .66); else if (kind === "eule") owl(F, 0, y, .26); else if (kind === "urne") vase(F, 0, y, .26, 1.4, ["#5a1a14", "#1f2b47"][i % 2]); else smallGlobe(F, 0, y, .26, 1.5); });
  smokes.forEach(p => smoke(p));
}

/* ---------- Einstieg ---------- */
function decor(ctx, {hall}){
  CTX = ctx; K = bucket(); BK = []; HALOS = []; LOG = ctx._dekor = []; VIEW = DOORV = null; START = ctx.group.children.length; HH = ctx.height || (hall ? 7.2 : 6.5); WL = walls(ctx.bounds);
  R = U.seeded([...ctx.key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 4099));
  // Raumthema (17_raum_detektiv*.js): steht die eigene Hülle (ctx.huelle.thema), baut die Beschreibung die Ausstattung selbst;
  // bei einem Fehler wird alles zurückgenommen und die bisherige Ausstattung gebaut
  const RD = !hall && ctx.huelle && ctx.huelle.thema && KIT.raum && KIT.raum[ctx.key];
  if (RD && RD.ausstattung) KIT._h.versuch(ctx, null, "Ausstattung", () => { Object.keys(TH).forEach(k => delete TH[k]); TH.smokes = []; RD.ausstattung(KIT._d); TH.smokes.forEach(p => p && smoke(p)); },
    () => { K = bucket(); BK = []; HALOS = []; VIEW = DOORV = null; reserveShell(false); roomDecor(); });
  else { reserveShell(hall); if (hall) hallDecor(); else roomDecor(); }
  // statische Teile: je Material ein Mesh
  const G = new T3.Group(); G.name = "ausstattung"; ctx.group.add(G); meshes(K, G);
  if (BK.length) { const bi = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), kmat("books"), BK.length), c = new T3.Color();
    BK.forEach(([m, col, k], i) => { bi.setMatrixAt(i, m); bi.setColorAt(i, c.set(col).multiplyScalar(k)); }); bi.receiveShadow = true; bi.userData.noPick = true; G.add(bi); }
  haloPts(HALOS, G, .55);
  // Nebel vor den Fenstern zieht langsam vorbei
  if (DM.has("nebel")) { const t0 = dm("nebel").map; ctx.tick((dt) => { t0.offset.x = (t0.offset.x + dt * .012) % 1; }); }
  K = BK = HALOS = CTX = LOG = VIEW = DOORV = null;
}
KIT.decor = decor;
// Bauhilfen für die Ausstattung der Raumthemen (17_raum_detektiv*.js); gelten nur während KIT.decor läuft (K, BK, R, CTX … sind dann gesetzt)
KIT._d = {st: () => ({K, BK, R, CTX, HH, HALOS, WL, TH}), KEYMAT, COLOR_KEYS, dm, uvc, CB, CM, PHOTO, V3, PI,
  bx, cy, sp, tor, lat, pln, cone, tub, rod, tint, withK, meshes, book, bookRow, bookStack, fr, subF, I4, group, haloPts, ceilY,
  q, qw, isFree, claim, six, viewFree, doorFree, nmW, sg, uOf, FW, tryComp, COMP, topItems,
  bankerLamp, candle, mantelClock, smallGlobe, fileStack, vase, hourglass, inkSet, typewriter, microscope, magnifier, leyden, voltaPile, galvanometer,
  cabinet, shelfLow, vitrine, chest, suitcase, globeStand, globeAnim, umbrellaStand, plantStand, plant, bust, pedestal, owl, ladder, radiator, barometer,
  picture, rollMap, engraving, investWall, photoLine, photosAnim, windowUnit, curtainGeo, armchairGroup, floorLamp, smoke, birdcage,
  gasolier, wimshurst, bulbPendant, arcLamp, switchboard, telescope, chevalMirror, prismLuster, spectacleSign, plateCamera, spectacles,
  pennyFarthing, wagonWheel, stationClock, newtonCradle, modelTrain, balloon, crate, barrel, anchor, pulley, balance, weightSet, springScales, inclinedPlane, kite,
  floorVase, wallShelf, keyBoard, hatRack, smallFrames, wallPhone, wallMirror, barometerSmall, frieze, windowSeat, sofa, candelabra, grandClock, palm};
})();
