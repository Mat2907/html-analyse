/* ---------- lehrer/20_generator.js ---------- */
/* =====================================================================
   Lehrkraft-Version · Schulaufgaben-Generator
   Stellt aus dem Aufgabenpool der gewählten Räume eine Schulaufgabe (oder Kurzarbeit/Stegreifaufgabe) zusammen:
   Bearbeitungszeit, Ziel-BE, Verteilung auf die Anforderungsbereiche I/II/III, Rechenanteil, Kompetenzbereiche, alle Räume vertreten.
   Ausgabe: Angabe Gruppe A/B, Erwartungshorizont mit BE-Aufschlüsselung, Einschätzungsmatrix (ISB), Notenschlüssel, Notenspiegel,
   Prüfliste nach GSO und ISB-Checkliste. Vorgaben: lehrer/vorgaben.json (window.LEHRER_DATEN).
   API: LK.generator.oeffnen() · LK.generator.erzeuge(einstellungen) (für Tests)
   ===================================================================== */
(() => {
const LK = window.LK; if (!LK || !LK.D) return;
const D = LK.D, esc = LK.esc, f = LK.fmt, zahl = LK.zahl;
const ST = {get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }};
const KEY = "lt-gen", KEYL = "lt-gen-liste";
const ART = D.arten || {schulaufgabe: {name: "Schulaufgabe", max_min: 60, vorschlag_min: 45}};
const SCHL = D.notenschluessel || [{id: "isb", name: "90 / 75 / 60 / 45 / 25 %", grenzen: [90, 75, 60, 45, 25]}];
const KBN = D.kompetenzen || {MEN: "Modelle und Experimente nutzen", EG: "Erkenntnisse gewinnen", K: "Kommunizieren", B: "Bewerten"};
const AFB = ["I", "II", "III"], KBS = ["MEN", "EG", "K", "B"];
const VORLAGEN = [["Elektrischer Strom", ["strom1", "strom2"]], ["Optik", ["optik1", "optik2"]], ["Strom und Optik", ["strom1", "strom2", "optik1", "optik2"]],
  ["Bewegungen", ["beweg1", "beweg2"]], ["Kräfte", ["kraft1", "kraft2"]], ["Mechanik", ["beweg1", "beweg2", "kraft1", "kraft2"]]];
const AFB_VORLAGEN = [["Standard", [30, 50, 20]], ["ISB-Muster", [27, 58, 15]], ["leichter", [40, 45, 15]], ["anspruchsvoller", [25, 50, 25]]];
// Kompetenzbereiche MEN/EG/K/B in % der BE. „ISB-Beispiel“ = Einschätzungsmatrix der Schulaufgabe Mechanik (26 BE: 11/5/8/2) in „Gute Aufgaben
// im Physikunterricht“ (2023), III.1.2. Eine Prozentvorgabe gibt es nicht; Leitidee ist der Lehrplan.
const KB_VORLAGEN = [["Standard", [50, 20, 20, 10]], ["ISB-Beispiel", [42, 19, 31, 8]], ["Schwerpunkt Erkenntnisse", [40, 35, 15, 10]],
  ["Schwerpunkt Kommunizieren", [40, 15, 35, 10]], ["Schwerpunkt Bewerten", [40, 15, 20, 25]]];

/* ---------- Pool ---------- */
const POOL = [], BYID = {};
function kennzahlen(a){
  const s = {be: 0, min: 0, afb: {I: 0, II: 0, III: 0}, kb: {MEN: 0, EG: 0, K: 0, B: 0}, rech: 0};
  a.teile.forEach(t => { const be = +t.be || 0; s.be += be; s.min += +t.min || be; s.afb[t.afb] = (s.afb[t.afb] || 0) + be; s.kb[t.kb] = (s.kb[t.kb] || 0) + be; if (t.rechnen) s.rech += be; });
  s.erstI = !!(a.teile[0] && a.teile[0].afb === "I"); return s;
}
// Kapitelangabe als Liste: „Kap. 1.2–1.3“ → ["1.2", "1.3"], „Kap. 1.1“ → ["1.1"]
const kapListe = s => { const out = [];
  String(s || "").replace(/(\d)\.(\d)(?:\s*(?:–|-|bis)\s*(\d)\.(\d))?/g, (_, h, a, h2, b) => {
    if (h2 === h) for (let k = +a; k <= +b; k++) out.push(`${h}.${k}`); else { out.push(`${h}.${a}`); if (h2) out.push(`${h2}.${b}`); } return ""; });
  return [...new Set(out)]; };
const RAUMKAP = Object.fromEntries(LK.RAEUME.map(r => [r, kapListe((D.raeume[r] || {}).kap)])), ALLEKAP = LK.RAEUME.flatMap(r => RAUMKAP[r]);
LK.RAEUME.forEach((r, ri) => ((D.aufgaben[r] || {}).aufgaben || []).forEach(a => { const x = Object.assign({a, r, ri, kaps: kapListe(a.kap)}, kennzahlen(a)); POOL.push(x); BYID[a.id] = x; }));
const kapNr = k => { const m = /(\d)\.(\d)/.exec(k || ""); return m ? +m[1] * 10 + +m[2] : 99; };
const kapTitel = k => (D.kapitel || {})[k] || "";
// Gewählter Stoff: Räume und – falls eingegrenzt – Kapitel (kapitel = null: alle Kapitel der gewählten Räume).
// Eine Aufgabe gehört nur dann zum Stoff, wenn alle ihre Kapitel gewählt sind.
const kapSet = E => Array.isArray(E.kapitel) ? new Set(E.kapitel) : null;
const imStoff = (x, E, ks = kapSet(E)) => E.raeume.includes(x.r) && (!ks || x.kaps.every(k => ks.has(k)));
const poolFuer = E => { const ks = kapSet(E); return POOL.filter(x => imStoff(x, E, ks)); };
const raeumeFuer = E => { const ks = kapSet(E); return E.raeume.filter(r => !ks || RAUMKAP[r].some(k => ks.has(k))); };
const stoffKapitel = E => { const ks = kapSet(E); return E.raeume.flatMap(r => RAUMKAP[r]).filter(k => !ks || ks.has(k)); };

/* ---------- Einstellungen ---------- */
const standard = () => ({art: "schulaufgabe", nr: "1.", raeume: ["strom1", "strom2"], kapitel: null, dauer: 45, beAuto: true, be: 36, afb: [30, 50, 20], kb: KB_VORLAGEN[0][1].slice(), kbFein: null, kbAn: true, kbManuell: false, rechenMax: 50, gruppen: "AB",
  hilfsmittel: "wissenschaftlicher Taschenrechner", schule: "", klasse: "8", schuljahr: "", datum: "", angekuendigt: "", lehrkraft: "", schluessel: SCHL[0].id, grenzen: SCHL[0].grenzen.slice(), halbe: true,
  seed: 1, auswahl: [], ohne: [], haken: {}, spiegel: ""});
let G = Object.assign(standard(), ST.get(KEY, {}));
if (ST.get(KEY, {}).kbAn === undefined) G.kbAn = G.art === "schulaufgabe";   // bei kleinen Leistungsnachweisen nur zur Orientierung
G.auswahl = (G.auswahl || []).filter(id => BYID[id]);
const kapitelBereinigen = () => { if (!Array.isArray(G.kapitel)) { G.kapitel = null; return; }
  const alle = G.raeume.flatMap(r => RAUMKAP[r]), vorher = G.kapitel.length; G.kapitel = alle.filter(k => G.kapitel.includes(k));
  if (vorher && !G.kapitel.length) { G.kapitel = null; return; }   // Kapitel passen zu keinem gewählten Raum (alter Speicherstand): Räume behalten
  G.raeume = G.raeume.filter(r => RAUMKAP[r].some(k => G.kapitel.includes(k)));
  if (G.kapitel.length === alle.length || !G.raeume.length) G.kapitel = null; };   // alles gewählt oder nichts mehr übrig: keine Eingrenzung
const kbBereinigen = () => { if (!(Array.isArray(G.kb) && G.kb.length === 4 && G.kb.every(v => v >= 0) && Math.round(G.kb.reduce((a, v) => a + v, 0)) === 100)) G.kb = KB_VORLAGEN[0][1].slice();
  if (!(Array.isArray(G.kbFein) && G.kbFein.length === 4 && aufHundert(G.kbFein).join() === G.kb.join())) G.kbFein = G.kb.slice(); };
// ganze Prozente mit Summe 100 aus Anteilen (Methode des größten Rests)
function aufHundert(f){ const g = f.map(v => Math.floor(v + 1e-9)), r = 100 - g.reduce((a, v) => a + v, 0);
  f.map((v, i) => [v - g[i], i]).sort((a, b) => b[0] - a[0]).slice(0, Math.max(0, r)).forEach(([, i]) => g[i]++); return g; }
kapitelBereinigen(); kbBereinigen();
{ const s = SCHL.find(x => x.id === G.schluessel); if (s) G.grenzen = s.grenzen.slice(); }   // Vorlagen immer mit ihren aktuellen Grenzen
const speichern = () => ST.set(KEY, G);
// BE-Vorschlag: so viele BE, wie die Aufgaben der gewählten Räume in 85 % der Zeit erfahrungsgemäß fassen (Zeitschätzung der Aufgaben),
// begrenzt auf 0,6–1 BE je Minute (ISB-Muster Jgst. 8: 26–38 BE in 40–45 Minuten)
const beVorschlag = (d, raeume, kapitel) => { const p = poolFuer(raeume ? {raeume, kapitel: kapitel || null} : G), be = p.reduce((a, x) => a + x.be, 0), min = p.reduce((a, x) => a + x.min, 0);
  const q = min ? be / min : .8; return Math.round(Math.max(.6 * d, Math.min(d, .86 * d * q))); };

/* ---------- Auswahl: Zufall mit festem Startwert, dann lokale Suche ---------- */
function rng(seed){ let a = (seed >>> 0) || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function summen(sel){
  const s = {be: 0, min: 0, afb: {I: 0, II: 0, III: 0}, kb: {MEN: 0, EG: 0, K: 0, B: 0}, rech: 0, proRaum: {}, n: sel.length};
  sel.forEach(x => { s.be += x.be; s.min += x.min; AFB.forEach(k => s.afb[k] += x.afb[k] || 0); KBS.forEach(k => s.kb[k] += x.kb[k] || 0); s.rech += x.rech; s.proRaum[x.r] = (s.proRaum[x.r] || 0) + x.be; });
  return s;
}
function kosten(sel, E){
  if (!sel.length) return 1e9;
  const s = summen(sel), T = E.be, d = E.dauer; let c = 0;
  c += 40 * ((s.be - T) / T) ** 2 + (Math.abs(s.be - T) > Math.max(2, T * .06) ? 2 : 0);
  if (s.min > .9 * d) c += 60 * ((s.min - .9 * d) / d) ** 2 + 3;
  if (s.min < .55 * d) c += 10 * ((.55 * d - s.min) / d) ** 2;
  const ziel = E.afb.map(v => v / 100); AFB.forEach((k, i) => { c += 30 * (s.afb[k] / s.be - ziel[i]) ** 2; });
  if (ziel[2] > 0 && !s.afb.III) c += 4;
  if (E.kbAn !== false && E.kb) {   // Zielverteilung der Kompetenzbereiche; sie darf die AFB-Leitidee (II vor I vor III) nicht verdrängen
    KBS.forEach((k, i) => { c += 20 * (s.kb[k] / s.be - E.kb[i] / 100) ** 2; });
    if (s.afb.II < s.afb.I || s.afb.II < s.afb.III || s.afb.I < s.afb.III) c += 1.5; }
  if (s.afb.II < s.afb.I || s.afb.II < s.afb.III) c += .6;
  const rq = s.rech / s.be, rm = E.rechenMax / 100; if (rq > rm) c += 40 * (rq - rm) ** 2 + 1;
  const RF = E._raeume || raeumeFuer(E);
  RF.forEach(r => { if (!s.proRaum[r]) c += 3; else c += 4 * (s.proRaum[r] / s.be - 1 / RF.length) ** 2; });
  c += [2, .8, .2, 0][["EG", "K", "B"].filter(k => s.kb[k] > 0).length];
  const ids = new Set(sel.map(x => x.a.id)); sel.forEach(x => (x.a.nicht_mit || []).forEach(id => { if (ids.has(id)) c += 10; }));
  const nIdeal = Math.max(2, Math.round(d / 11)); c += .15 * (s.n - nIdeal) ** 2;
  const kaps = {}; sel.forEach(x => kaps[x.a.kap] = (kaps[x.a.kap] || 0) + 1); for (const k in kaps) if (kaps[k] > 1) c += .25 * (kaps[k] - 1);
  if (!sel.some(x => x.erstI)) c += .5;
  // Vielfalt: je Startwert andere Vorlieben unter gleich guten Aufgaben; beim Neu-Würfeln bisherige Aufgaben meiden
  if (E._zufall) sel.forEach(x => { c += .45 * (E._zufall[x.a.id] || 0); });
  if (E._vorher) sel.forEach(x => { if (E._vorher.has(x.a.id)) c += E._vorherGewicht || .5; });
  if (E._ohneMalus) sel.forEach(x => { if (E._ohneMalus.has(x.a.id)) c += 4; });
  return c;
}
function ordne(sel){
  const o = sel.slice().sort((a, b) => a.ri - b.ri || kapNr(a.a.kap) - kapNr(b.a.kap) || (b.erstI - a.erstI));
  if (o.length && !o[0].erstI) { const j = o.findIndex(x => x.erstI && x.r === o[0].r); if (j > 0) o.unshift(o.splice(j, 1)[0]); }
  return o;
}
function erzeuge(E, ohne){
  let pool = poolFuer(E); if (!pool.length) return [];
  if (ohne && ohne.size) { const rest = pool.filter(x => !ohne.has(x.a.id));
    if (rest.reduce((a, x) => a + x.be, 0) >= E.be * .9) pool = rest; else E = Object.assign({}, E, {_ohneMalus: ohne}); }   // zu wenig übrig: frühere Aufgaben nur notfalls
  const rnd = rng(E.seed * 7919 + 13); let best = null, bestK = Infinity;
  const zr = rng(E.seed * 104729 + 7), RF = raeumeFuer(E); E = Object.assign({}, E, {_raeume: RF, _zufall: Object.fromEntries(pool.map(x => [x.a.id, zr()]))});
  for (let start = 0; start < 6; start++) {
    const frei = pool.slice(); for (let i = frei.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [frei[i], frei[j]] = [frei[j], frei[i]]; }
    let sel = [], be = 0, ri = start;
    while (be < E.be * .95 && frei.length) { const r = RF[ri++ % RF.length], i = frei.findIndex(x => x.r === r); const x = frei.splice(i >= 0 ? i : 0, 1)[0]; sel.push(x); be += x.be; }
    let k = kosten(sel, E), temp = 1.2;
    for (let it = 0; it < 2200; it++) {
      const neu = sel.slice(), rest = pool.filter(x => !neu.includes(x)), m = rnd();
      if (m < .5 && rest.length && neu.length) neu[Math.floor(rnd() * neu.length)] = rest[Math.floor(rnd() * rest.length)];
      else if (m < .75 && rest.length) neu.push(rest[Math.floor(rnd() * rest.length)]);
      else if (neu.length > 1) neu.splice(Math.floor(rnd() * neu.length), 1);
      const k2 = kosten(neu, E);
      if (k2 < k || rnd() < Math.exp((k - k2) / temp)) { sel = neu; k = k2; }
      temp *= .997; if (k < bestK) { bestK = k; best = sel.slice(); }
    }
  }
  return ordne(best || []);
}
const auswahl = () => G.auswahl.map(id => BYID[id]).filter(Boolean);

/* ---------- Prüfungen (GSO, ISB-Checkliste) ---------- */
function pruefungen(sel, E){
  const G = E || window.LK.generator.G, s = summen(sel), A = ART[G.art] || ART.schulaufgabe, out = [], add = (ok, text, quelle) => out.push({ok, text, quelle});
  const pz = k => s.be ? Math.round(s.afb[k] / s.be * 100) : 0;
  add(G.dauer <= A.max_min ? 1 : 0, `Bearbeitungszeit ${G.dauer} min (höchstens ${A.max_min} min)`, G.art === "schulaufgabe" ? "§ 22 Abs. 5 GSO" : "§ 23 Abs. 2 GSO");
  add(s.min <= G.dauer ? (s.min <= .9 * G.dauer ? 1 : .5) : 0, `Geschätzte Bearbeitungsdauer ${Math.round(s.min)} min bei ${G.dauer} min Zeit${s.min > .9 * G.dauer && s.min <= G.dauer ? " – knapp" : ""}`, "ISB: Arbeitszeitangemessenheit");
  add(Math.abs(s.be - G.be) <= Math.max(2, G.be * .06) ? 1 : .5, `${zahl(s.be)} BE (Ziel ${G.be} BE)`, "");
  add(s.afb.I && s.afb.II && s.afb.III ? 1 : .5, `Alle drei Anforderungsbereiche: I ${pz("I")} % · II ${pz("II")} % · III ${pz("III")} % (Ziel ${G.afb.join(" / ")} %)`, "KMK-Bildungsstandards MSA 2024");
  add(s.afb.II >= s.afb.I && s.afb.II >= s.afb.III && s.afb.I >= s.afb.III ? 1 : .5, "Schwerpunkt im Anforderungsbereich II, mehr BE in I als in III", "StMUK/ISB „Gute Aufgaben“ (2023), III.1.2");
  const rq = s.be ? Math.round(s.rech / s.be * 100) : 0;
  add(rq <= G.rechenMax ? 1 : .5, `Rechenanteil ${rq} % (höchstens ${G.rechenMax} %; wesentlicher Teil ohne Rechnen)`, "ISB-Checkliste III.1.1");
  // Kompetenzbereiche: Schulaufgaben sollen mehrere Bereiche abdecken; kleine Leistungsnachweise müssen das nicht (ISB III.1.1: übers Schuljahr)
  const kbs = KBS.filter(k => s.kb[k] > 0), gross = G.art === "schulaufgabe";
  add(gross ? (kbs.length >= 3 ? 1 : kbs.length === 2 ? .5 : 0) : (kbs.length >= 2 ? 1 : .5), `Kompetenzbereiche: ${kbs.map(k => KBN[k]).join(", ") || "–"}`, "ISB: nicht nur „Modelle und Experimente nutzen“");
  if (G.kbAn !== false && G.kb && s.be) {
    const ist = KBS.map(k => Math.round(s.kb[k] / s.be * 100)), abw = Math.max(...ist.map((v, i) => Math.abs(v - G.kb[i])));
    add(!gross ? "i" : abw <= 10 ? 1 : .5, `Verteilung ${KBS.map((k, i) => `${k} ${ist[i]} %`).join(" · ")} (gewähltes Ziel ${G.kb.join(" / ")} %${gross ? "" : "; bei wenigen Aufgaben nur Orientierung"})`, "eigene Zielverteilung, keine ISB-Vorgabe");
    const stoff = poolFuer(G), fehlt = KBS.filter((k, i) => G.kb[i] >= 10 && !stoff.some(x => x.kb[k] > 0));
    if (fehlt.length) add(gross ? .5 : "i", `Im gewählten Stoff keine Aufgabe zu: ${fehlt.map(k => KBN[k]).join(", ")} – ${gross ? "Räume/Kapitel erweitern oder Ziel anpassen" : "in einem anderen Leistungsnachweis des Schuljahrs abdecken"}`, gross ? "" : "ISB „Gute Aufgaben“ (2023), III.1.1"); }
  add(sel[0] && sel[0].erstI ? 1 : .5, "Beginn mit einer leichten Teilaufgabe (AFB I)", "ISB-Checkliste III.1.1");
  add(1, "Jede Teilaufgabe mit Operator und BE-Angabe; Erwartungshorizont mit BE-Aufschlüsselung", "ISB-Checkliste; KMS vom 18.06.2026");
  if (G.art !== "stegreif" && G.datum && G.angekuendigt) { const tage = Math.round((new Date(G.datum) - new Date(G.angekuendigt)) / 864e5);
    add(tage >= 7 ? 1 : 0, `Angekündigt ${tage} Tage vor dem Termin (mindestens eine Woche)`, G.art === "schulaufgabe" ? "§ 22 Abs. 4 GSO" : "§ 23 Abs. 2 GSO"); }
  raeumeFuer(G).forEach(r => { if (!s.proRaum[r]) add(.5, `Keine Aufgabe aus „${LK.raumName(r)}“`, ""); });
  const aussen = sel.filter(x => !imStoff(x, G));
  if (aussen.length) add(.5, `${aussen.length} Aufgabe(n) außerhalb des gewählten Stoffs (${[...new Set(aussen.map(x => x.a.kap))].join(", ")})`, "");
  if (G.gruppen === "AB") { const ohne = sel.filter(x => !x.a.b); add(ohne.length ? .5 : 1, ohne.length ? `${ohne.length} Aufgabe(n) ohne eigene Fassung für Gruppe B (dort gleich)` : "Gruppe A und B mit gleichwertigen Aufgaben", ""); }
  // Kleine Leistungsnachweise: nur der Stoff der unmittelbar vorangegangenen Stunden. Gezählt wird die Spanne (Buchreihenfolge) über den
  // gewählten Stoff und die Kapitel der Aufgaben – Kap. 1.1 und 1.6 bedeuten Stoff von 1.1 bis 1.6. Ob das die letzten Stunden waren, prüft die Lehrkraft.
  const kaps = [...new Set(sel.flatMap(x => x.kaps))].sort((a, b) => kapNr(a) - kapNr(b));
  if (sel.length && (G.art === "kurzarbeit" || G.art === "stegreif")) {
    const idx = [...new Set(stoffKapitel(G).concat(kaps))].map(k => ALLEKAP.indexOf(k)).filter(i => i >= 0), von = ALLEKAP[Math.min(...idx)], bis = ALLEKAP[Math.max(...idx)];
    const n = Math.max(...idx) - Math.min(...idx) + 1, spanne = n > 1 ? `Kap. ${von}–${bis} (${n} Kapitel)` : `Kap. ${von}`, ka = G.art === "kurzarbeit";
    add(n <= (ka ? 3 : 1) ? 1 : .5, n <= (ka ? 3 : 1) ? `Stoff eingegrenzt auf ${spanne} – zulässig, wenn das ${ka ? "der Stoff der höchstens 10" : "nur der Stoff der letzten zwei"} vorangegangenen Unterrichtsstunden ist`
      : `${ka ? "Kurzarbeit" : "Stegreifaufgabe"} über ${spanne} – höchstens ${ka ? "10" : "2"} vorangegangene Unterrichtsstunden: Kapitel eingrenzen`, "§ 23 Abs. 2 GSO"); }
  return {liste: out, s, kaps};
}

/* ---------- Notenschlüssel ---------- */
function schluessel(T, g, halbe){
  const st = halbe ? .5 : 1, up = v => Math.ceil(v / st - 1e-9) * st, lo = g.map(p => up(p / 100 * T)), rows = []; let hi = T;
  for (let i = 0; i < 5; i++) { rows.push([i + 1, lo[i], hi]); hi = lo[i] - st; }
  rows.push([6, 0, Math.max(0, hi)]); return rows;
}
const noteVon = (be, rows) => (rows.find(r => be >= r[1] - 1e-9) || rows[5])[0];
const NS = D.notenstufen || [[1, "sehr gut"], [2, "gut"], [3, "befriedigend"], [4, "ausreichend"], [5, "mangelhaft"], [6, "ungenügend"]];
function schluesselHTML(T){
  const rows = schluessel(T, G.grenzen, G.halbe);
  return `<table class="lg-tab lg-ns"><tr><th>Note</th>${rows.map(r => `<th>${r[0]}</th>`).join("")}</tr><tr><td>BE</td>${rows.map(r => `<td>${zahl(r[2])} – ${zahl(r[1])}</td>`).join("")}</tr></table>`;
}

/* ---------- Blätter ---------- */
const artName = () => (ART[G.art] || ART.schulaufgabe).name;
const stoffText = kaps => kaps.map(k => `Kap. ${k}${kapTitel(k) ? " " + kapTitel(k) : ""}`).join(" · ");
const datumDE = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? `${+m[3]}.${+m[2]}.${m[1]}` : (v || ""); };
const titel = g => `${G.nr ? esc(G.nr) + " " : ""}${artName()} aus der Physik${G.klasse ? ` · Klasse ${esc(G.klasse)}` : ""}${G.gruppen === "AB" && g ? ` · Gruppe ${g}` : ""}`;
function kopf(g, art){
  const s = summen(auswahl());
  return `<div class="lg-kopf"><div class="lg-k1"><span>${esc(G.schule || "")}</span><span>${G.schuljahr ? "Schuljahr " + esc(G.schuljahr) : ""}</span></div>
    <h2>${art === "eh" ? "Erwartungshorizont: " : art === "matrix" ? "Einschätzungsmatrix: " : ""}${titel(g)}</h2>
    ${art === "angabe" ? `<div class="lg-name"><span>Name: <i></i></span><span>Datum: ${G.datum ? esc(datumDE(G.datum)) : "<i class=k></i>"}</span></div>` : `<div class="lg-k1"><span>${G.datum ? esc(datumDE(G.datum)) : ""}</span><span>${G.lehrkraft ? esc(G.lehrkraft) : ""}</span></div>`}
    <div class="lg-info">Bearbeitungszeit: ${G.dauer} Minuten · Hilfsmittel: ${esc(G.hilfsmittel || "keine")} · insgesamt ${zahl(s.be)} BE${art === "angabe" ? " (die BE stehen am rechten Rand)" : ""}</div></div>`;
}
function angabeHTML(g, edit){
  const sel = auswahl();
  return `<div class="lt-dseite la-blatt lg-blatt">${kopf(g, "angabe")}${sel.map((x, i) => `<div class="lg-aufg" data-id="${esc(x.a.id)}">${edit ? werkzeug(i, sel.length) : ""}${LK.angabe(x.a, i + 1, g)}</div>`).join("")}
    ${sel.length ? `<p class="lg-fuss">Viel Erfolg!</p>` : `<p class="lg-leer">Noch keine Aufgaben – links Räume wählen und „Erstellen“ drücken.</p>`}</div>`;
}
function ehHTML(g){
  const sel = auswahl(), s = summen(sel);
  return `<div class="lt-dseite la-blatt lg-blatt">${kopf(g, "eh")}${sel.map((x, i) => LK.loesung(x.a, i + 1, g)).join("")}
    <p class="lg-klein">Gleichwertige, nicht aufgeführte Lösungswege werden gleichberechtigt gewertet. Folgefehler werden nicht doppelt angerechnet.</p>
    <h3>Notenschlüssel (${zahl(s.be)} BE)</h3>${schluesselHTML(s.be)}<p class="lg-klein">${esc(D.notenschluessel_hinweis || "")}</p></div>`;
}
function matrixHTML(){
  const sel = auswahl(), s = summen(sel), TT = "abcdefghij", pz = v => s.be ? Math.round(v / s.be * 100) + " %" : "–";
  const rows = sel.map((x, i) => x.a.teile.map((t, j) => `<tr><td>${i + 1}${x.a.teile.length > 1 ? TT[j] : ""}</td><td>${esc(x.a.kap || "")}<br><small>${esc(x.a.ke || "")}</small></td><td>${esc(t.op || "")}</td>
    ${KBS.map(k => `<td class="z">${t.kb === k ? zahl(t.be) : ""}</td>`).join("")}<td class="z">${t.rechnen ? zahl(t.be) : ""}</td>${AFB.map(k => `<td class="z">${t.afb === k ? zahl(t.be) : ""}</td>`).join("")}<td class="z"><b>${zahl(t.be)}</b></td><td class="z">${zahl(t.min || "")}</td></tr>`).join("")).join("");
  const p = pruefungen(sel, G);
  const kes = [...new Set(sel.map(x => `${(D.lernbereiche || {})[x.r] || ""} – ${x.a.ke || ""}`))];
  return `<div class="lt-dseite la-blatt lg-blatt">${kopf("", "matrix")}
    <table class="lg-tab lg-mx"><thead><tr><th>TA</th><th>Kap. · KE</th><th>Operator</th>${KBS.map(k => `<th title="${esc(KBN[k])}">${k}</th>`).join("")}<th>Rechnen</th>${AFB.map(k => `<th>AFB ${k}</th>`).join("")}<th>BE</th><th>min</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td colspan="3">Summe</td>${KBS.map(k => `<td class="z">${zahl(s.kb[k])}</td>`).join("")}<td class="z">${zahl(s.rech)}</td>${AFB.map(k => `<td class="z">${zahl(s.afb[k])}</td>`).join("")}<td class="z"><b>${zahl(s.be)}</b></td><td class="z">${Math.round(s.min)}</td></tr>
    <tr><td colspan="3">Anteil</td>${KBS.map(k => `<td class="z">${pz(s.kb[k])}</td>`).join("")}<td class="z">${pz(s.rech)}</td>${AFB.map(k => `<td class="z">${pz(s.afb[k])}</td>`).join("")}<td></td><td></td></tr>
    <tr><td colspan="3">Ziel</td>${KBS.map((k, i) => `<td class="z">${G.kbAn !== false && G.kb ? G.kb[i] + " %" : ""}</td>`).join("")}<td class="z">≤ ${G.rechenMax} %</td>${G.afb.map(v => `<td class="z">${v} %</td>`).join("")}<td class="z">${G.be}</td><td class="z">${G.dauer}</td></tr></tfoot></table>
    <p class="lg-klein">${KBS.map(k => `${k} = ${esc(KBN[k])}`).join(" · ")}</p>
    <h3>Lehrplanbezug</h3><ul class="lg-ul">${kes.map(k => `<li>${esc(k)}</li>`).join("")}</ul>
    ${p.kaps.length ? `<p class="lg-klein"><b>Abgefragter Stoff:</b> ${esc(stoffText(p.kaps))}</p>` : ""}
    <h3>Prüfung nach GSO und ISB-Checkliste</h3><ul class="lg-check">${p.liste.map(c => `<li class="${c.ok === 1 ? "ok" : c.ok === "i" ? "info" : c.ok ? "warn" : "bad"}">${esc(c.text)}${c.quelle ? ` <small>(${esc(c.quelle)})</small>` : ""}</li>`).join("")}</ul>
    <h3>Vor der ${esc(artName())}</h3><ul class="lg-manuell">${(() => {
      const sa = G.art === "schulaufgabe", ids = sa ? ["ankuendigung", "hilfsmittel", "rueckgabe", "nachteilsausgleich", "respizienz", "geheim", "transparenz", "kernfach", "kompetenzjahr"] : ["hilfsmittel", "nachteilsausgleich", "geheim", "transparenz", "kompetenzjahr"];
      const regeln = (D.regeln || []).filter(r => ids.includes(r.id)), a = ART[G.art] || {};
      if (!sa && a.regel) regeln.unshift({id: "art-" + G.art, text: a.regel.replace(/^§ 23 Abs\. 2 GSO: /, ""), quelle: "§ 23 Abs. 2 GSO"});
      return regeln.map(r => `<li><label><input type="checkbox" data-haken="${r.id}" ${G.haken[r.id] ? "checked" : ""}> ${esc(r.text)} <small>(${esc(r.quelle)})</small></label></li>`).join(""); })()}</ul>
    <p class="lg-klein">Rechtsstand: ${esc(D.stand || "")}</p></div>`;
}
function werkzeug(i, n){
  return `<div class="lg-wz" aria-label="Aufgabe bearbeiten"><button data-wz="tausch" data-i="${i}" title="Durch eine passende andere Aufgabe ersetzen">↻ andere</button>
    <button data-wz="hoch" data-i="${i}" ${i ? "" : "disabled"} title="nach oben">↑</button><button data-wz="runter" data-i="${i}" ${i < n - 1 ? "" : "disabled"} title="nach unten">↓</button>
    <button data-wz="weg" data-i="${i}" title="Aufgabe entfernen">✕</button></div>`;
}

/* ---------- Oberfläche ---------- */
const ov = document.createElement("div"); ov.id = "lt-gen"; ov.hidden = true; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Schulaufgaben-Werkstatt");
const add = () => document.body.appendChild(ov);
if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
let tab = "A", tauschZ = {};
const $ = s => ov.querySelector(s);

function formHTML(){
  const opt = (v, t, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? "selected" : ""}>${esc(t)}</option>`;
  return `<div class="lg-sec"><label>Art<select data-g="art">${Object.entries(ART).map(([k, a]) => opt(k, a.name, G.art)).join("")}</select></label>
      <label>Nummer<input data-g="nr" value="${esc(G.nr)}" placeholder="1."></label></div>
    <div class="lg-sec"><b>Räume und Kapitel (Stoff)</b><div class="lg-vorl">${VORLAGEN.map(([n, rs], i) => `<button data-vorl="${i}" class="${rs.join() === G.raeume.join() && !G.kapitel ? "on" : ""}">${esc(n)}</button>`).join("")}</div>
      ${G.art === "schulaufgabe" ? "" : `<small class="lg-hinweis">${G.art === "stegreif" ? "Stegreifaufgabe: nur Stoff der letzten zwei Unterrichtsstunden – meist ein Kapitel anhaken." : "Kurzarbeit: nur Stoff der höchstens 10 vorangegangenen Unterrichtsstunden – Kapitel eingrenzen."}</small>`}
      ${LK.RAEUME.map(r => { const n = POOL.filter(x => x.r === r).length, on = G.raeume.includes(r), ks = kapSet(G);
        return `<label class="lg-cb"><input type="checkbox" data-raum="${r}" ${on ? "checked" : ""}> ${esc(LK.raumName(r))} <small>${esc((D.raeume[r] || {}).kap || "")} · ${n} Aufg.</small></label>
        ${on ? `<div class="lg-kaps">${RAUMKAP[r].map(k => { const nk = POOL.filter(x => x.r === r && x.kaps.length === 1 && x.kaps[0] === k).length;
          return `<label class="lg-cb lg-kap" title="Kap. ${k} ${esc(kapTitel(k))} – ${nk} Aufgaben nur aus diesem Kapitel (dazu Aufgaben über mehrere gewählte Kapitel)"><input type="checkbox" data-kap="${k}" data-kr="${r}" ${!ks || ks.has(k) ? "checked" : ""}> <span>${k} ${esc(kapTitel(k))}</span> <small>${nk}</small></label>`; }).join("")}</div>` : ""}`; }).join("")}
      <small class="lg-hinweis">Gewählt: ${poolFuer(G).length} Aufgaben im Stoff${G.kapitel ? ` · ${stoffKapitel(G).length} Kapitel` : ""}. Aufgaben über mehrere Kapitel kommen nur vor, wenn alle ihre Kapitel angehakt sind.</small></div>
    <div class="lg-sec lg-2"><label>Zeit (min)<input type="number" min="10" max="90" step="5" data-g="dauer" value="${G.dauer}"></label>
      <label>BE gesamt<input type="number" min="6" max="80" data-g="be" value="${G.be}" ${G.beAuto ? "disabled" : ""}></label>
      <label class="lg-cb lg-span"><input type="checkbox" data-g="beAuto" ${G.beAuto ? "checked" : ""}> BE aus Zeit und Aufgaben vorschlagen (0,6–1 BE je Minute wie die ISB-Muster)</label></div>
    <div class="lg-sec"><b>Anforderungsbereiche – Zielverteilung in %</b><small class="lg-hinweis">Orientierung nach KMK-Bildungsstandards und ISB (Schwerpunkt II, mehr I als III) – keine Rechtsvorgabe</small><div class="lg-vorl">${AFB_VORLAGEN.map(([n, v], i) => `<button data-afbv="${i}" class="${v.join() === G.afb.join() ? "on" : ""}">${esc(n)} ${v.join("/")}</button>`).join("")}</div>
      <div class="lg-3">${AFB.map((k, i) => `<label>AFB ${k}<input type="number" min="0" max="100" step="5" data-afb="${i}" value="${G.afb[i]}"></label>`).join("")}</div>
      <label>Rechenanteil höchstens (%)<input type="number" min="10" max="100" step="5" data-g="rechenMax" value="${G.rechenMax}"></label></div>
    <div class="lg-sec"><b>Kompetenzbereiche – Zielverteilung in % der BE</b><small class="lg-hinweis">Orientierung nach ISB „Gute Aufgaben im Physikunterricht“ (2023): Leitidee ist der Lehrplan; nicht nur „Modelle und Experimente nutzen“; jeder Bereich mindestens einmal im Schuljahr – keine Prozentvorgabe</small>
      <label class="lg-cb"><input type="checkbox" data-g="kbAn" ${G.kbAn !== false ? "checked" : ""}> bei der Auswahl berücksichtigen</label>
      <div class="lg-vorl">${KB_VORLAGEN.map(([n, v], i) => `<button data-kbv="${i}" class="${v.join() === G.kb.join() ? "on" : ""}" ${G.kbAn !== false ? "" : "disabled"}>${esc(n)} ${v.join("/")}</button>`).join("")}</div>
      ${KBS.map((k, i) => `<label class="lg-regler" title="${esc((D.kompetenzen_text || {})[k] || "")}"><span>${esc(KBN[k])}</span><input type="range" min="0" max="100" step="1" data-kb="${i}" value="${G.kb[i]}" ${G.kbAn !== false ? "" : "disabled"} aria-label="${esc(KBN[k])} in Prozent"><b>${G.kb[i]} %</b></label>`).join("")}</div>
    <div class="lg-sec"><label>Gruppen<select data-g="gruppen">${opt("A", "nur eine Gruppe", G.gruppen)}${opt("AB", "Gruppe A und B", G.gruppen)}</select></label>
      <label>Hilfsmittel<input data-g="hilfsmittel" value="${esc(G.hilfsmittel)}"></label></div>
    <div class="lg-sec lg-2"><label>Schule<input data-g="schule" value="${esc(G.schule)}"></label><label>Schuljahr<input data-g="schuljahr" value="${esc(G.schuljahr)}" placeholder="2026/27"></label>
      <label>Klasse<input data-g="klasse" value="${esc(G.klasse)}"></label><label>Lehrkraft<input data-g="lehrkraft" value="${esc(G.lehrkraft)}"></label>
      <label>Termin<input type="date" data-g="datum" value="${esc(G.datum)}"></label>${G.art === "stegreif" ? "" : `<label>Angekündigt am<input type="date" data-g="angekuendigt" value="${esc(G.angekuendigt)}"></label>`}</div>
    <div class="lg-sec"><label>Notenschlüssel<select data-g="schluessel">${SCHL.some(s => s.id === G.schluessel) ? "" : opt(G.schluessel, "angepasst (eigene Grenzen)", G.schluessel)}${SCHL.map(s => opt(s.id, s.name, G.schluessel)).join("")}</select></label>
      <div class="lg-5">${G.grenzen.map((p, i) => `<label>${i + 1} ab %<input type="number" min="0" max="100" data-gr="${i}" value="${p}"></label>`).join("")}</div>
      <label class="lg-cb"><input type="checkbox" data-g="halbe" ${G.halbe ? "checked" : ""}> Grenzen auf halbe BE runden</label></div>`;
}
function statusHTML(){
  const sel = auswahl(), p = pruefungen(sel, G), s = p.s, b = k => s.be ? s.afb[k] / s.be * 100 : 0;
  const balken = AFB.map((k, i) => `<div class="lg-bar"><span>AFB ${k}</span><div><i style="width:${b(k)}%"></i><em style="left:${G.afb[i]}%"></em></div><b>${Math.round(b(k))} %</b></div>`).join("");
  const kbB = k => s.be ? s.kb[k] / s.be * 100 : 0, mitKB = G.kbAn !== false;
  const kbBalken = KBS.map((k, i) => `<div class="lg-bar lg-kbbar" title="${esc(KBN[k])}"><span>${k}</span><div><i style="width:${kbB(k)}%"></i>${mitKB ? `<em style="left:${G.kb[i]}%"></em>` : ""}</div><b>${Math.round(kbB(k))} %</b></div>`).join("");
  const warn = p.liste.filter(c => c.ok !== 1 && c.ok !== "i");
  return `<div class="lg-zahlen"><div><b>${zahl(s.be)}</b><span>von ${G.be} BE</span></div><div><b>${Math.round(s.min)}</b><span>von ${G.dauer} min</span></div><div><b>${sel.length}</b><span>Aufgaben</span></div>
    <div><b>${s.be ? Math.round(s.rech / s.be * 100) : 0} %</b><span>Rechnen</span></div></div><div class="lg-bars">${balken}</div><div class="lg-bars">${kbBalken}</div>
    <div class="lg-warn">${warn.length ? warn.map(c => `<span class="${c.ok ? "warn" : "bad"}">⚠ ${esc(c.text)}</span>`).join("") : `<span class="ok">✓ Alle Prüfungen erfüllt</span>`}</div>`;
}
function zeichne(){
  if (ov.hidden) return;
  const fa = document.activeElement, fs = fa && $("#lgform").contains(fa) ? ["data-kb", "data-kap", "data-raum", "data-g", "data-afb", "data-gr", "data-kbv", "data-afbv", "data-vorl"]
    .filter(n => fa.hasAttribute(n)).map(n => `[${n}="${fa.getAttribute(n)}"]`).concat(fa.dataset.kr ? [`[data-raum="${fa.dataset.kr}"]`] : []) : [];
  $("#lgform").innerHTML = formHTML(); $("#lgstatus").innerHTML = statusHTML();
  for (const sel of fs) { const e = $("#lgform " + sel); if (e && !e.disabled) { e.focus(); break; } }
  ov.querySelectorAll(".lg-tabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.tab === tab));
  ov.querySelectorAll('.lg-tabs [data-tab="B"],.lg-tabs [data-tab="EB"],[data-dr="B"],[data-dr="EB"],[data-wd="B"],[data-wd="EB"]').forEach(b => b.hidden = G.gruppen !== "AB");
  if ((tab === "B" || tab === "EB") && G.gruppen !== "AB") tab = "A";
  const m = $("#lgmain");
  if (tab === "A" || tab === "B") m.innerHTML = angabeHTML(tab, true) + `<div class="lg-plus"><button id="lgplus">＋ Aufgabe aus dem Pool hinzufügen</button></div>`;
  else if (tab === "EA" || tab === "EB") m.innerHTML = ehHTML(tab === "EA" ? "A" : "B");
  else if (tab === "M") m.innerHTML = matrixHTML();
  else if (tab === "N") m.innerHTML = notenHTML();
  else if (tab === "V") m.innerHTML = vorgabenHTML();
  verdrahten(); speichern();
}
function notenHTML(){
  const s = summen(auswahl()), rows = schluessel(s.be, G.grenzen, G.halbe);
  return `<div class="lt-dseite la-blatt lg-blatt"><h2>Notenschlüssel · ${zahl(s.be)} BE</h2>${schluesselHTML(s.be)}
    <p class="lg-klein">${esc(D.notenschluessel_hinweis || "")}</p>
    <table class="lg-tab lg-stufen">${NS.map(n => `<tr><td><b>${n[0]}</b></td><td>${esc(n[1])}</td><td>${esc(n[2] || "")}</td></tr>`).join("")}</table><p class="lg-klein">${esc(D.notenstufen_quelle || "")}</p>
    <h3>Notenspiegel nach der Korrektur</h3>
    <p class="lg-klein">Erreichte BE aller Schülerinnen und Schüler eintragen (durch Leerzeichen, Komma, Strichpunkt oder Zeilenumbruch getrennt; halbe BE mit Dezimalkomma, z. B. 31,5). Die Werte bleiben nur in diesem Browser.</p>
    <textarea id="lgspiegel" rows="4" placeholder="z. B. 31,5  28  17 …">${esc(G.spiegel || "")}</textarea><div id="lgspr"></div></div>`;
}
function spiegelHTML(){
  const s = summen(auswahl()), rows = schluessel(s.be, G.grenzen, G.halbe);
  // Ein Komma vor genau einer Ziffer ist Dezimalkomma (BE sind ganz oder halb: 31,5), sonst Trenner: „20,25,30“ = drei Werte
  const roh = String(G.spiegel || "").split(/[\s;]+|,(?!\d(?!\d))/).filter(v => v.trim()), zahlen = roh.map(v => parseFloat(v.replace(",", ".")));
  const werte = zahlen.filter(v => isFinite(v) && v >= 0 && v <= s.be + 1e-9), weg = roh.length - werte.length;
  if (!werte.length) return weg ? `<p class="lg-hinw">${weg} Eingabe(n) nicht lesbar oder größer als ${zahl(s.be)} BE.</p>` : "";
  const n = [0, 0, 0, 0, 0, 0]; werte.forEach(v => n[noteVon(v, rows) - 1]++);
  const schnitt = n.reduce((a, c, i) => a + c * (i + 1), 0) / werte.length, max = Math.max(...n);
  const schlecht = (n[4] + n[5]) / werte.length;
  return `<table class="lg-tab lg-ns"><tr><th>Note</th>${n.map((_, i) => `<th>${i + 1}</th>`).join("")}<th>Ø</th></tr><tr><td>Anzahl</td>${n.map(c => `<td>${c}</td>`).join("")}<td><b>${zahl(schnitt, 2)}</b></td></tr></table>
    <div class="lg-hist">${n.map((c, i) => `<div><i style="height:${max ? c / max * 100 : 0}%"></i><span>${i + 1}</span></div>`).join("")}</div>
    <p>${werte.length} Arbeiten · Durchschnitt ${zahl(schnitt, 2)} · Noten 5 und 6: ${Math.round(schlecht * 100)} %${weg ? ` · <b>${weg} Eingabe(n) nicht berücksichtigt</b> (nicht lesbar oder größer als ${zahl(s.be)} BE)` : ""}</p>
    ${schlecht >= .3 || schnitt >= 4 || schnitt <= 1.8 ? `<p class="lg-hinw">Auffällige Notenverteilung: Die Arbeit sollte der Fachschaftsleitung im Rahmen der Respizienz vorgelegt werden. Waren die Anforderungen nicht angemessen oder der Stoff nicht genügend vorbereitet, kann die Schulleitung die Schulaufgabe für ungültig erklären (§ 22 Abs. 7 GSO).</p>` : ""}`;
}
function vorgabenHTML(){
  return `<div class="lt-dseite la-blatt lg-blatt"><h2>Vorgaben für Schulaufgaben in Physik 8</h2><p class="lg-klein">${esc(D.stand || "")}</p>
    <h3>Rechtliche Regeln</h3><ul class="lg-ul">${(D.regeln || []).map(r => `<li>${esc(r.text)} <small>(${esc(r.quelle)})</small></li>`).join("")}</ul>
    <h3>Anforderungsbereiche</h3><ul class="lg-ul">${AFB.map(k => { const a = (D.afb || {})[k] || {}; return `<li><b>${esc(a.name || "AFB " + k)}</b> – ${esc(a.text || "")}</li>`; }).join("")}</ul><p class="lg-klein">${esc(D.afb_quelle || "")}</p>
    <h3>Kompetenzbereiche (LehrplanPLUS)</h3><ul class="lg-ul">${KBS.map(k => `<li><b>${k} – ${esc(KBN[k])}:</b> ${esc((D.kompetenzen_text || {})[k] || "")}</li>`).join("")}</ul>
    <h3>Gütekriterien</h3><ul class="lg-ul">${(D.guete || []).map(r => `<li>${esc(r.text)}</li>`).join("")}</ul><p class="lg-klein">${esc(D.guete_quelle || "")}</p>
    <h3>Operatoren</h3><table class="lg-tab lg-op">${Object.entries(D.operatoren || {}).map(([k, o]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(o.text)}</td></tr>`).join("")}</table><p class="lg-klein">${esc(D.operatoren_quelle || "")}</p></div>`;
}
function verdrahten(){
  const F = $("#lgform");
  F.querySelectorAll("[data-g]").forEach(el => el.onchange = () => {
    const k = el.dataset.g; let v = el.type === "checkbox" ? el.checked : el.type === "number" ? +el.value : el.value; G[k] = v;
    if (k === "art") { const a = ART[v]; if (a) G.dauer = a.vorschlag_min; if (!G.kbManuell) G.kbAn = v === "schulaufgabe"; }
    if (k === "kbAn") G.kbManuell = true;
    if (k === "dauer" && !(G.dauer > 0)) G.dauer = (ART[G.art] || {}).vorschlag_min || 45;
    if (k === "be" && !(G.be > 0)) { G.beAuto = true; }
    if (k === "schluessel") { const s = SCHL.find(x => x.id === v); if (s) G.grenzen = s.grenzen.slice(); }
    if (G.beAuto) G.be = beVorschlag(G.dauer);
    setTimeout(zeichne); });   // erst nach dem Fokuswechsel (Tab/Klick ins nächste Feld) neu aufbauen
  F.querySelectorAll("[data-raum]").forEach(el => el.onchange = () => { const r = el.dataset.raum; G.raeume = LK.RAEUME.filter(x => x === r ? el.checked : G.raeume.includes(x));
    if (G.kapitel) { G.kapitel = el.checked ? G.kapitel.concat(RAUMKAP[r]) : G.kapitel.filter(k => !RAUMKAP[r].includes(k)); kapitelBereinigen(); }   // ganzer Raum an/aus
    if (G.beAuto) G.be = beVorschlag(G.dauer); zeichne(); });
  F.querySelectorAll("[data-kap]").forEach(el => el.onchange = () => { const k = el.dataset.kap, bisher = G.kapitel || G.raeume.flatMap(r => RAUMKAP[r]);
    G.kapitel = el.checked ? bisher.concat(k) : bisher.filter(x => x !== k); kapitelBereinigen();
    if (G.beAuto) G.be = beVorschlag(G.dauer); zeichne(); });
  F.querySelectorAll("[data-vorl]").forEach(el => el.onclick = () => { G.raeume = VORLAGEN[+el.dataset.vorl][1].slice(); G.kapitel = null; if (G.beAuto) G.be = beVorschlag(G.dauer); zeichne(); });
  F.querySelectorAll("[data-afbv]").forEach(el => el.onclick = () => { G.afb = AFB_VORLAGEN[+el.dataset.afbv][1].slice(); zeichne(); });
  F.querySelectorAll("[data-kbv]").forEach(el => el.onclick = () => { G.kb = KB_VORLAGEN[+el.dataset.kbv][1].slice(); G.kbFein = G.kb.slice(); zeichne(); });
  // Regler: die anderen drei Bereiche werden anteilig angepasst, die Summe bleibt 100 %
  F.querySelectorAll("[data-kb]").forEach(el => { el.oninput = () => { el.nextElementSibling.textContent = el.value + " %"; };
    el.onchange = () => { const i = +el.dataset.kb, v = Math.max(0, Math.min(100, Math.round(+el.value))), o = [0, 1, 2, 3].filter(j => j !== i);
      kbBereinigen(); const f = G.kbFein.slice(), sum = o.reduce((a, j) => a + f[j], 0), rest = 100 - v;   // anteilig mit Feinwerten, angezeigt in ganzen Prozent
      f[i] = v; o.forEach(j => f[j] = sum > 1e-9 ? f[j] / sum * rest : rest / 3); G.kbFein = f; G.kb = aufHundert(f);
      zeichne(); }; });
  F.querySelectorAll("[data-afb]").forEach(el => el.onchange = () => { const i = +el.dataset.afb; G.afb[i] = Math.max(0, Math.min(100, +el.value || 0));
    const rest = 100 - G.afb[i], o = [0, 1, 2].filter(j => j !== i), sum = o.reduce((a, j) => a + G.afb[j], 0) || 1; o.forEach(j => G.afb[j] = Math.round(G.afb[j] / sum * rest));
    G.afb[o[1]] = 100 - G.afb[i] - G.afb[o[0]]; setTimeout(zeichne); });
  F.querySelectorAll("[data-gr]").forEach(el => el.onchange = () => { G.grenzen[+el.dataset.gr] = +el.value; G.schluessel = "manuell"; setTimeout(zeichne); });
  const m = $("#lgmain");
  m.querySelectorAll("[data-wz]").forEach(b => b.onclick = () => werkzeugKlick(b.dataset.wz, +b.dataset.i));
  const pl = m.querySelector("#lgplus"); if (pl) pl.onclick = poolZeigen;
  m.querySelectorAll("[data-haken]").forEach(c => c.onchange = () => { G.haken[c.dataset.haken] = c.checked; speichern(); });
  const sp = m.querySelector("#lgspiegel"); if (sp) { const upd = () => { G.spiegel = sp.value; speichern(); m.querySelector("#lgspr").innerHTML = spiegelHTML(); }; sp.oninput = upd; upd(); }
}
function werkzeugKlick(wz, i){
  const ids = G.auswahl.slice();
  if (wz === "hoch" && i > 0) [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
  else if (wz === "runter" && i < ids.length - 1) [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
  else if (wz === "weg") ids.splice(i, 1);
  else if (wz === "tausch") {
    // Ersatz aus demselben Raum; bei eingegrenzten Kapiteln nur aus dem gewählten Stoff (notfalls aus einem anderen gewählten Raum)
    const ohne = new Set(G.ohne || []), alt = BYID[ids[i]], basis = POOL.filter(x => !ids.includes(x.a.id) && !ohne.has(x.a.id)), stoff = basis.filter(x => imStoff(x, G));
    const gleich = (G.kapitel ? stoff : basis).filter(x => x.r === alt.r), frei = gleich.length ? gleich : stoff;
    if (!frei.length) return toast("Keine weitere passende Aufgabe im gewählten Stoff" + knapp() + ".");
    const rest = ids.filter((_, j) => j !== i).map(id => BYID[id]);
    const ranked = frei.map(x => ({x, k: kosten(rest.concat(x), G) + Math.abs(x.be - alt.be) * .05})).sort((a, b) => a.k - b.k);
    const z = (tauschZ[alt.r] = ((tauschZ[alt.r] ?? -1) + 1) % ranked.length); ids[i] = ranked[z].x.a.id;
  }
  G.auswahl = ids; zeichne();
}
function poolZeigen(){
  const box = document.createElement("div"); box.className = "lg-pool";
  const inner = () => { const fr = box.querySelector("#lgpr").value, fa = box.querySelector("#lgpa").value, fk = box.querySelector("#lgpk").value, q = box.querySelector("#lgpq").value.toLowerCase();
    const liste = POOL.filter(x => (!fr || x.r === fr) && (!fa || x.afb[fa] > 0) && (!fk || (fk === "stoff" ? imStoff(x, G) : x.kaps.includes(fk)))
      && (!q || (x.a.thema + " " + x.a.stamm + " " + x.a.teile.map(t => t.text).join(" ")).toLowerCase().includes(q)));
    box.querySelector("#lgpl").innerHTML = liste.map(x => { const drin = G.auswahl.includes(x.a.id);
      return `<div class="lg-prow ${drin ? "drin" : ""}"><div><b>${f(x.a.thema || x.a.id)}</b><small>${esc(LK.raumName(x.r))} · ${esc(x.a.kap)} · ${esc(x.a.ke || "")} · ${x.a.teile.length} TA · ${zahl(x.be)} BE · ${Math.round(x.min)} min · I ${zahl(x.afb.I)} / II ${zahl(x.afb.II)} / III ${zahl(x.afb.III)}${x.a.b ? " · Gruppe B" : ""}</small></div>
        <button data-sehen="${esc(x.a.id)}">Ansehen</button><button data-dazu="${esc(x.a.id)}" ${drin ? "disabled" : ""}>${drin ? "✓ drin" : "＋"}</button></div>`; }).join("") || "<p>Keine Aufgabe passt zum Filter.</p>";
    box.querySelectorAll("[data-dazu]").forEach(b => b.onclick = () => { G.auswahl.push(b.dataset.dazu); zeichne(); inner(); });
    box.querySelectorAll("[data-sehen]").forEach(b => b.onclick = () => { const x = BYID[b.dataset.sehen]; box.querySelector("#lgpv").innerHTML = `<div class="la-blatt">${LK.angabe(x.a, "", "A")}<hr>${LK.loesung(x.a, "", "A")}</div>`; }); };
  box.innerHTML = `<div class="lg-pbox"><div class="lg-phead"><b>Aufgabenpool</b><select id="lgpr"><option value="">alle Räume</option>${LK.RAEUME.map(r => `<option value="${r}" ${G.raeume.length === 1 && G.raeume[0] === r ? "selected" : ""}>${esc(LK.raumName(r))}</option>`).join("")}</select>
    <select id="lgpk"><option value="">alle Kapitel</option><option value="stoff" ${G.kapitel ? "selected" : ""}>nur gewählter Stoff</option>${LK.RAEUME.flatMap(r => RAUMKAP[r]).map(k => `<option value="${k}">Kap. ${k} ${esc(kapTitel(k))}</option>`).join("")}</select>
    <select id="lgpa"><option value="">alle AFB</option>${AFB.map(k => `<option value="${k}">mit AFB ${k}</option>`).join("")}</select><input id="lgpq" placeholder="Suche …"><button id="lgpx">✕</button></div>
    <div class="lg-pbody"><div id="lgpl"></div><div id="lgpv" class="lg-pv"><p class="lg-klein">„Ansehen“ zeigt Angabe und Erwartungshorizont.</p></div></div></div>`;
  ov.appendChild(box); inner();
  box.querySelectorAll("select,input").forEach(e => e.oninput = inner);
  box.querySelector("#lgpx").onclick = () => box.remove(); box.onclick = ev => { if (ev.target === box) box.remove(); };
}
// Bei Stegreifaufgabe und Kurzarbeit ist der Stoff nach § 23 GSO begrenzt – dort nicht zum Erweitern raten
const knapp = () => G.art === "schulaufgabe" ? " – Kapitel oder Räume erweitern" : " – der Stoff der letzten Stunden gibt nicht mehr her";
const beHinweis = () => { const s = summen(auswahl()); return s.be < G.be - Math.max(2, G.be * .06) ? ` Nur ${zahl(s.be)} von ${G.be} BE.` : ""; };
function toast(t){ const d = document.createElement("div"); d.className = "lg-toast"; d.textContent = t; ov.appendChild(d); setTimeout(() => d.remove(), 2600); }
function neu(seed, vorher){ if (!G.raeume.length) { toast("Bitte mindestens einen Raum wählen."); return false; }
  const stoffBE = poolFuer(G).reduce((a, x) => a + x.be, 0); if (!stoffBE) { toast("Im gewählten Stoff gibt es keine Aufgaben – Kapitel erweitern."); return false; }
  G.seed = seed; tauschZ = {}; G.auswahl = erzeuge(vorher ? Object.assign({}, G, {_vorher: vorher}) : G, new Set(G.ohne || [])).map(x => x.a.id); tab = tab === "M" || tab === "N" || tab === "V" ? "A" : tab; zeichne();
  if (stoffBE < G.be) toast(`Im gewählten Stoff gibt es nur ${zahl(stoffBE)} BE an Aufgaben – ${G.art === "schulaufgabe" ? "Kapitel erweitern oder " : ""}BE verringern.`);
  return true; }

/* ---------- Speichern, Laden, Drucken ---------- */
function gespeichert(){ return ST.get(KEYL, []); }
function speichernUnter(){
  const l = gespeichert(), name = `${G.nr || ""} ${artName()}${G.klasse ? " Kl. " + G.klasse : ""} – ${G.kapitel ? "Kap. " + G.kapitel.join(", ") : G.raeume.map(r => (D.raeume[r] || {}).kurz || r).join(", ")}${G.datum ? " – " + datumDE(G.datum) : ""}`.replace(/\s+/g, " ").trim();
  l.unshift({name, zeit: new Date().toLocaleString("de-DE"), G: JSON.parse(JSON.stringify(G))}); ST.set(KEYL, l.slice(0, 40)); toast("Gespeichert: " + name);
}
function ladenZeigen(){
  const l = gespeichert(), box = document.createElement("div"); box.className = "lg-pool";
  box.innerHTML = `<div class="lg-pbox lg-klein-box"><div class="lg-phead"><b>Gespeicherte Arbeiten</b><button id="lgpx">✕</button></div><div class="lg-liste">${l.length ? l.map((e, i) => `<div class="lg-prow"><div><b>${esc(e.name)}</b><small>${esc(e.zeit)} · ${e.G.auswahl.length} Aufgaben</small></div><button data-laden="${i}">Laden</button><button data-loeschen="${i}" title="Aus der Liste entfernen">✕</button></div>`).join("") : "<p>Noch nichts gespeichert.</p>"}</div></div>`;
  ov.appendChild(box); box.querySelector("#lgpx").onclick = () => box.remove(); box.onclick = ev => { if (ev.target === box) box.remove(); };
  box.querySelectorAll("[data-laden]").forEach(b => b.onclick = () => { G = Object.assign(standard(), l[+b.dataset.laden].G); if (l[+b.dataset.laden].G.kbAn === undefined) G.kbAn = G.art === "schulaufgabe"; G.auswahl = G.auswahl.filter(id => BYID[id]); kapitelBereinigen(); kbBereinigen(); box.remove(); tab = "A"; zeichne(); });
  box.querySelectorAll("[data-loeschen]").forEach(b => b.onclick = () => { if (!confirm("Diesen Eintrag aus der Liste entfernen?")) return; l.splice(+b.dataset.loeschen, 1); ST.set(KEYL, l); box.remove(); ladenZeigen(); });
}
function drucke(was){
  const ab = G.gruppen === "AB", teile = {A: () => angabeHTML("A"), B: () => angabeHTML("B"), EA: () => ehHTML("A"), EB: () => ehHTML("B"), M: matrixHTML};
  const liste = was === "alles" ? (ab ? ["A", "B", "EA", "EB", "M"] : ["A", "EA", "M"]) : [was];
  LK.drucken(liste.map(k => teile[k]()).join(""), `${G.nr || ""} ${artName()} Physik ${G.klasse || ""}`.trim());
}
ov.innerHTML = `<div class="lg-leiste"><b>📝 Schulaufgaben-Werkstatt</b><span class="lg-fill"></span>
  <button id="lgneu" class="lg-haupt">Erstellen</button><button id="lgwuerfel" title="Andere Zusammenstellung mit denselben Einstellungen">🎲 Neu würfeln</button>
  <button id="lgnach" title="Gleiche Einstellungen, aber andere Aufgaben (für Nachtermin oder Parallelklasse)">⧉ Nachtermin-Fassung</button><button id="lgsp">💾 Speichern</button><button id="lglad">📂 Laden</button>
  <span class="lg-dd"><button id="lgdr">🖨 Drucken ▾</button><span class="lg-ddm" hidden><button data-dr="A">Angabe Gruppe A</button><button data-dr="B">Angabe Gruppe B</button><button data-dr="EA">Erwartungshorizont A</button><button data-dr="EB">Erwartungshorizont B</button><button data-dr="M">Einschätzungsmatrix</button><button data-dr="alles">Alles</button></span></span>
  <span class="lg-dd"><button id="lgwd">📄 Word ▾</button><span class="lg-ddm" hidden><button data-wd="A">Angabe Gruppe A</button><button data-wd="B">Angabe Gruppe B</button><button data-wd="EA">Erwartungshorizont A</button><button data-wd="EB">Erwartungshorizont B</button><button data-wd="alles">Alles in einer Datei</button></span></span>
  <button id="lgzu" aria-label="Schließen">✕</button></div>
  <div class="lg-rumpf"><aside class="lg-form" id="lgform"></aside><section class="lg-rechts"><div class="lg-status" id="lgstatus"></div>
  <div class="lg-tabs"><button data-tab="A">Angabe A</button><button data-tab="B">Angabe B</button><button data-tab="EA">Erwartungshorizont A</button><button data-tab="EB">Erwartungshorizont B</button>
  <button data-tab="M">Einschätzungsmatrix</button><button data-tab="N">Notenschlüssel</button><button data-tab="V">Vorgaben</button></div><div class="lg-main" id="lgmain"></div></section></div>`;
$("#lgneu").onclick = () => { G.ohne = []; if (/\(Nachtermin\)/.test(G.nr || "")) G.nr = G.nr.replace(/\s*\(Nachtermin\)/, ""); neu(Math.floor(Math.random() * 1e6) + 1); };
$("#lgwuerfel").onclick = () => { const vorher = new Set(G.auswahl), gleich = () => G.auswahl.length === vorher.size && G.auswahl.every(id => vorher.has(id));
  if (!neu((G.seed || 1) + 1, vorher)) return;
  if (vorher.size && gleich()) {   // dieselbe Auswahl: die bisherige Fassung kräftig meiden (frühere Fassungen bleiben noch stärker gemieden)
    const ids = erzeuge(Object.assign({}, G, {_vorher: vorher, _vorherGewicht: 3}), new Set(G.ohne || [])).map(x => x.a.id);
    if (!ids.some(id => !vorher.has(id))) return toast("Im gewählten Stoff gibt es keine andere passende Zusammenstellung" + knapp() + ".");
    G.auswahl = ids; zeichne(); }
  const alt = G.auswahl.filter(id => (G.ohne || []).includes(id));
  if (alt.length) toast(`${alt.length} Aufgabe(n) stammen aus einer früheren Fassung${knapp()}.${beHinweis()}`); else if (beHinweis()) toast("Andere Zusammenstellung." + beHinweis()); };
$("#lgsp").onclick = speichernUnter;
$("#lgnach").onclick = () => { const alt = new Set(G.auswahl); if (!alt.size) return toast("Zuerst eine Arbeit erstellen.");
  const frueher = new Set([...(G.ohne || []), ...alt]), ids = erzeuge(Object.assign({}, G, {seed: (G.seed || 1) + 101}), frueher).map(x => x.a.id), neuIds = ids.filter(id => !frueher.has(id));
  if (!neuIds.length) return toast("Im gewählten Stoff gibt es nicht genug weitere Aufgaben für eine eigene Nachtermin-Fassung" + knapp() + ".");
  speichernUnter(); G.ohne = [...frueher]; G.auswahl = ids; G.nr = (G.nr || "") + (/(Nachtermin)/.test(G.nr || "") ? "" : " (Nachtermin)"); tab = "A"; zeichne();
  toast((neuIds.length < ids.length ? `Nachtermin-Fassung mit ${neuIds.length} neuen Aufgaben; ${ids.length - neuIds.length} stammen aus einer früheren Fassung${knapp()}.`
    : `Nachtermin-Fassung mit ${neuIds.length} neuen Aufgaben – die bisherige Fassung ist gespeichert.`) + beHinweis()); }; $("#lglad").onclick = ladenZeigen;
$("#lgzu").onclick = () => { ov.hidden = true; document.documentElement.classList.remove("lt-offen", "lt-papier"); };
ov.querySelectorAll(".lg-tabs button").forEach(b => b.onclick = () => { tab = b.dataset.tab; zeichne(); });
ov.querySelectorAll(".lg-dd > button").forEach(b => b.onclick = ev => { ev.stopPropagation(); const m = b.nextElementSibling, auf = m.hidden; ov.querySelectorAll(".lg-ddm").forEach(x => x.hidden = true); m.hidden = !auf; });
ov.addEventListener("click", ev => { if (!ev.target.closest(".lg-dd") || ev.target.closest(".lg-ddm button")) ov.querySelectorAll(".lg-ddm").forEach(x => x.hidden = true); });
ov.querySelectorAll("[data-dr]").forEach(b => b.onclick = () => { if (!G.auswahl.length) return toast("Noch keine Aufgaben."); drucke(b.dataset.dr); });
ov.querySelectorAll("[data-wd]").forEach(b => b.onclick = () => { if (!G.auswahl.length) return toast("Noch keine Aufgaben."); if (!LK.word) return toast("Word-Ausgabe nicht verfügbar.");
  const kaps = [...new Set(auswahl().flatMap(x => x.kaps))].sort((a, b) => kapNr(a) - kapNr(b));
  LK.word(b.dataset.wd, {G, auswahl: auswahl(), summen, schluessel, artName, titel, stoff: stoffText(kaps)}).catch(e => { console.error(e); toast("Word-Datei konnte nicht erstellt werden."); }); });
document.addEventListener("keydown", ev => { if (!ov.hidden && ev.key === "Escape") { const p = ov.querySelector(".lg-pool"); if (p) p.remove(); else $("#lgzu").click(); ev.stopPropagation(); } }, true);

LK.generator = {
  oeffnen(){ ov.hidden = false; document.documentElement.classList.add("lt-offen", "lt-papier"); if (G.beAuto) G.be = beVorschlag(G.dauer); if (!G.auswahl.length && G.raeume.length) G.auswahl = erzeuge(G).map(x => x.a.id); zeichne(); },
  erzeuge: E => { const X = Object.assign(standard(), E); if (E.kbAn === undefined) X.kbAn = X.art === "schulaufgabe"; if (E.be == null) X.be = beVorschlag(X.dauer, X.raeume, X.kapitel); return erzeuge(X).map(x => x.a.id); },
  beVorschlag, pruefe: (ids, E) => pruefungen(ids.map(id => BYID[id]), E && Object.assign(standard(), E.kbAn === undefined ? {kbAn: (E.art || "schulaufgabe") === "schulaufgabe"} : {}, E)), summen: ids => summen(ids.map(id => BYID[id])), schluessel,
  setze(E){ Object.assign(G, E); if (E.art !== undefined && E.kbAn === undefined) G.kbAn = G.art === "schulaufgabe"; kapitelBereinigen(); kbBereinigen(); if (G.beAuto && E.be == null) G.be = beVorschlag(G.dauer); zeichne(); }, get G(){ return G; }, tab(t){ tab = t; zeichne(); }, pool: POOL,
  kapitel: {raum: RAUMKAP, liste: kapListe, imStoff: (id, E) => imStoff(BYID[id], Object.assign(standard(), E))}
};

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.textContent = `
#lt-gen{position:fixed;inset:0;z-index:68;display:flex;flex-direction:column;background:#E9ECF1;color:#1b1f24;font:14px/1.4 -apple-system,"Segoe UI",system-ui,sans-serif}
#lt-gen[hidden]{display:none}
.lg-leiste{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 12px;background:#1F2933;color:#fff}.lg-leiste b{font-size:15px}.lg-fill{flex:1}
.lg-leiste button{font:600 13px system-ui;padding:7px 11px;border-radius:7px;border:1px solid #4a5563;background:#2d3a48;color:#fff;cursor:pointer}.lg-leiste button:hover{background:#3b4b5d}
.lg-leiste .lg-haupt{background:#F2B33D;color:#1b1f24;border-color:#F2B33D}
.lg-dd{position:relative}.lg-ddm{position:absolute;right:0;top:calc(100% + 4px);z-index:5;display:flex;flex-direction:column;background:#fff;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.3);min-width:210px;overflow:hidden}
.lg-ddm[hidden]{display:none}.lg-ddm button{background:none!important;color:#1b1f24!important;border:0!important;border-radius:0!important;text-align:left;padding:9px 14px!important;font-weight:500!important}.lg-ddm button:hover{background:#eef2ff!important}
.lg-rumpf{flex:1;min-height:0;display:flex}
.lg-form{width:320px;flex:none;overflow:auto;padding:10px 12px 30px;background:#F7F8FA;border-right:1px solid #d5dae1}
.lg-sec{border-bottom:1px solid #dde2e8;padding:8px 0;display:flex;flex-direction:column;gap:6px}.lg-sec > b{font-size:13px}
.lg-form label{display:flex;flex-direction:column;gap:2px;font-size:12px;color:#4a5361}.lg-form input:not([type=checkbox]),.lg-form select{font:14px system-ui;padding:5px 7px;border:1px solid #c5ccd6;border-radius:6px;background:#fff;color:#1b1f24}
.lg-form .lg-cb{flex-direction:row;align-items:center;gap:6px;font-size:13px;color:#1b1f24}.lg-cb small{color:#78808c;margin-left:auto;font-size:11px;text-align:right}
.lg-kaps{display:flex;flex-direction:column;gap:1px;margin:-3px 0 3px 22px}.lg-form .lg-kap{font-size:12px;color:#3d4550}
.lg-kap span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lg-form .lg-regler{display:grid;grid-template-columns:minmax(0,1fr) 110px 40px;align-items:center;gap:6px;font-size:12.5px;color:#1b1f24}.lg-regler b{text-align:right;font-size:12px}.lg-regler input{width:100%;margin:0}
.lg-vorl button:disabled,.lg-regler input:disabled{opacity:.45}
.lg-2{display:grid;grid-template-columns:1fr 1fr;gap:6px}.lg-3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.lg-5{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}.lg-span{grid-column:1/-1}
.lg-vorl{display:flex;flex-wrap:wrap;gap:4px}.lg-vorl button{font:12px system-ui;padding:3px 8px;border-radius:99px;border:1px solid #c5ccd6;background:#fff;cursor:pointer}.lg-vorl button.on{background:#1F2933;color:#fff;border-color:#1F2933}
.lg-rechts{flex:1;min-width:0;display:flex;flex-direction:column}
.lg-status{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;padding:8px 14px;background:#fff;border-bottom:1px solid #d5dae1}
.lg-zahlen{display:flex;gap:14px}.lg-zahlen div{display:flex;flex-direction:column;align-items:center}.lg-zahlen b{font-size:18px}.lg-zahlen span{font-size:11px;color:#68707c}
.lg-bars{display:flex;flex-direction:column;gap:2px;min-width:220px}.lg-bar{display:grid;grid-template-columns:48px 1fr 40px;gap:6px;align-items:center;font-size:12px}
.lg-bar div{position:relative;height:9px;background:#e5e8ed;border-radius:5px}.lg-bar i{position:absolute;inset:0 auto 0 0;background:#3E7CB1;border-radius:5px}.lg-bar em{position:absolute;top:-3px;bottom:-3px;width:2px;background:#d9480f}
.lg-warn{display:flex;flex-direction:column;gap:2px;font-size:12px;flex:1;min-width:240px}.lg-warn .warn{color:#9a5b00}.lg-warn .bad{color:#b42318;font-weight:600}.lg-warn .ok{color:#1e7b34;font-weight:600}
.lg-tabs{display:flex;gap:2px;padding:6px 12px 0;background:#E9ECF1;flex-wrap:wrap}.lg-tabs button{font:600 13px system-ui;padding:7px 12px;border:1px solid #cfd5dd;border-bottom:0;border-radius:7px 7px 0 0;background:#dfe3e9;cursor:pointer}
.lg-tabs button[aria-pressed="true"]{background:#fff}.lg-tabs button[hidden]{display:none}
.lg-main{flex:1;overflow:auto;padding:16px;background:#fff;border-top:1px solid #cfd5dd}
.lg-blatt h2,.lg-blatt h3{font-family:"Helvetica Neue",Arial,sans-serif;font-style:normal;letter-spacing:0;text-transform:none;color:#111}
.lg-hinweis{font-size:11px;color:#6a7280}
.lg-blatt{max-width:800px;margin:0 auto 24px;padding:28px 34px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.18);border-radius:3px}
.lg-kopf{border-bottom:2px solid #111;margin-bottom:12px;padding-bottom:6px}.lg-k1{display:flex;justify-content:space-between;font-size:12px;color:#444;min-height:1em}
.lg-kopf h2{font-size:18px;margin:4px 0 6px}.lg-name{display:flex;gap:30px;margin:6px 0}.lg-name span{flex:1;display:flex;gap:6px}.lg-name span:last-child{flex:0 0 200px}.lg-name i{flex:1;border-bottom:1px solid #111}.lg-name i.k{display:inline-block;min-width:120px}
.lg-info{font-size:12.5px;color:#333}
.lg-aufg{position:relative}.lg-aufg:hover{outline:2px dashed #b9c3d0;outline-offset:4px}
.lg-wz{position:absolute;right:-6px;top:-14px;display:none;gap:3px;z-index:2}.lg-aufg:hover .lg-wz{display:flex}
.lg-wz button{font:600 12px system-ui;padding:3px 8px;border-radius:6px;border:1px solid #9aa4b1;background:#fff;cursor:pointer}.lg-wz button:disabled{opacity:.35}
.lg-fuss{text-align:right;font-style:italic;margin-top:18px}.lg-leer{color:#666;text-align:center;padding:40px}
.lg-plus{text-align:center;margin:-8px 0 30px}.lg-plus button{font:600 14px system-ui;padding:9px 16px;border-radius:8px;border:2px dashed #9aa4b1;background:#f7f8fa;cursor:pointer}
.lg-blatt h3{font-size:15px;margin:16px 0 6px}.lg-klein{font-size:11.5px;color:#555}
.lg-tab{border-collapse:collapse;width:100%;font-size:12.5px;margin:6px 0}.lg-tab th,.lg-tab td{border:1px solid #9aa3ae;padding:3px 6px;vertical-align:top}.lg-tab th{background:#eef1f5}
.lg-tab td.z{text-align:center}.lg-tab tfoot td{background:#f6f7f9;font-weight:600}.lg-mx small{color:#555}.lg-ns td,.lg-ns th{text-align:center}
.lg-ul{margin:4px 0 4px 18px;padding:0}.lg-ul li{margin:3px 0}.lg-ul small,.lg-check small,.lg-manuell small{color:#666}
.lg-check{list-style:none;margin:4px 0;padding:0}.lg-check li{margin:3px 0;padding-left:22px;position:relative}.lg-check li::before{position:absolute;left:0;font-weight:700}
.lg-check li.ok::before{content:"✓";color:#1e7b34}.lg-check li.info::before{content:"i";color:#3E7CB1;font-style:italic}.lg-check li.warn::before{content:"!";color:#b26a00}.lg-check li.bad::before{content:"✗";color:#b42318}
.lg-manuell{list-style:none;margin:4px 0;padding:0}.lg-manuell li{margin:4px 0}.lg-manuell label{display:flex;gap:8px;align-items:flex-start}
#lgspiegel{width:100%;font:14px ui-monospace,Menlo,monospace;padding:6px;border:1px solid #c5ccd6;border-radius:6px;box-sizing:border-box}
.lg-hist{display:flex;gap:10px;align-items:flex-end;height:110px;margin:10px 0}.lg-hist div{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end}.lg-hist i{display:block;width:70%;background:#3E7CB1;border-radius:3px 3px 0 0}.lg-hist span{font-size:12px}
.lg-hinw{background:#FFF4E0;border-left:4px solid #E89B2D;padding:6px 10px}
.lg-pool{position:fixed;inset:0;z-index:72;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:20px}
.lg-pbox{width:min(1200px,100%);height:min(85vh,900px);background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden}.lg-klein-box{width:min(640px,100%);height:auto;max-height:80vh}
.lg-phead{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;background:#F2F4F7;border-bottom:1px solid #dde2e8}.lg-phead b{flex:1}.lg-phead input,.lg-phead select{font:13px system-ui;padding:5px 7px;border:1px solid #c5ccd6;border-radius:6px}
.lg-phead button,.lg-prow button{font:600 12px system-ui;padding:5px 10px;border-radius:6px;border:1px solid #9aa4b1;background:#fff;cursor:pointer}
.lg-pbody{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}#lgpl,.lg-liste{overflow:auto;padding:6px}.lg-pv{overflow:auto;padding:12px;border-left:1px solid #dde2e8}
.lg-prow{display:flex;gap:6px;align-items:center;padding:7px 8px;border-bottom:1px solid #eef0f3}.lg-prow > div{flex:1;min-width:0}.lg-prow small{display:block;color:#68707c;font-size:11.5px}.lg-prow.drin{background:#F0F7EE}
.lg-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:80;background:#1F2933;color:#fff;padding:9px 16px;border-radius:8px;font-size:14px}
#lgpk{max-width:230px;min-width:0}
@media (max-width:900px),(max-height:640px){#lt-gen{overflow:auto}.lg-rumpf{flex:none;flex-direction:column}.lg-form{width:auto;max-height:none;border-right:0}.lg-rechts{min-height:0}.lg-main{flex:none;overflow:visible}}
@media print{
  #lt-druck .lg-blatt{max-width:none;margin:0;padding:0;box-shadow:none;font-size:11.5pt}
  #lt-druck .lg-wz,#lt-druck .lg-plus{display:none!important}
  #lt-druck .lg-tab{font-size:9.5pt}#lt-druck .la-aufg{break-inside:auto}
  #lt-druck .la-teil,#lt-druck .la-lz,#lt-druck .lt-fig,#lt-druck .la-in > .lt-p,#lt-druck .la-lk{break-inside:avoid}#lt-druck .la-in > .lt-p,#lt-druck .la-lk{break-after:avoid}
  #lt-druck .lg-manuell input{width:12px;height:12px}
}
`;
document.head.appendChild(css);
})();
