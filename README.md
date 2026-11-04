# Physik Abenteuer 8 – Lehrkraft

Interaktive Lern-App für **Physik 8 (Gymnasium Bayern, LehrplanPLUS)** – mit Schüler-Modus
(Start / Lernen / Wettkampf / Plan / Profil) und Lehrkraft-Modus (Hefteinträge im Vortrag,
Schulaufgaben-Generator, Word-Export, Referentenansicht).

Die App läuft **komplett offline im Browser**: keine externen Abhängigkeiten, kein Build-Schritt,
keine Server-Anfragen. Alle Daten, Stile und Skripte liegen lokal im Repo.

## Schnellstart

- `index.html` im Browser öffnen (Doppelklick genügt – klassische Skripte, `file://` funktioniert), **oder**
- lokal testen mit Server: `python3 -m http.server` → <http://localhost:8000>
- auf GitHub Pages ist die App automatisch unter der Repo-Root-URL erreichbar (`index.html`)

### Einzeldatei bauen (für Weitergabe als eine Datei)

`python3 tools/build.py` baut aus den Modulen wieder eine einzelne HTML-Datei
(Default: `dist/Physik-Abenteuer-8-Lehrkraft.html`, via `.gitignore` ausgenommen).
Das Skript verifiziert sich selbst (jeder Skript-/Style-Block wird byte-ident mit der
Quelldatei verglichen).

## Projektstruktur

Die App war ursprünglich eine einzige Datei (`Physik-Abenteuer-8-Lehrkraft.html`, ~7,3 MB).
Sie wurde **inhalts-ident** in Module aufgeteilt (jeder ehemaligen `<script>`-Block ist genau
eine Datei, byte-ident; siehe `tools/`):

| Pfad | Inhalt |
|---|---|
| `index.html` | HTML-Skelett (Head, Tab-Leiste, Footer) + `<script src>`-Tags in originaler Reihenfolge |
| `css/style.css` | komplettes Styling (Theme über CSS-Variablen `--t-*`, inkl. `:root[data-theme="dark"]`) |
| `js/data/inhalte.js` | reine Daten: `window.MUSIK_B64` (Hintergrundmusik), `window.LA_CFG` (App-Konfiguration), `window.LA_CASES`, `DATA` (Themen/Inhalte) |
| `js/engine.js` | Lernapp-Engine: Zustand (`S` in `localStorage`), Navigation `go()`, Quiz, Karteikarten, XP/Level/Streak, Lernzeit, Prüfungs-Countdown, Druck (Lernzettel) |
| `js/vendor/three.min.js` | three.js r158 (MIT), nur für die begehbaren 3D-Räume nötig |
| `js/00_kern.js` … `js/45_geschichte.js` | Bereiche: `00` 3D-Raum-Kern, `05` Lernen, `06` Üben (alle Aufgabentypen), `07` Plan, `10–15` die drei Welten (Zauber / Sterne / Detektiv) inkl. Dekor, `17_raum_*` begehbare 3D-Räume, `20_*` Themen-Szenen (Bewegung, Kraft, Optik, Strom), `30` Halle, `40_lern_*` Lernpfade, `45` Geschichte |
| `js/lehrer/daten.js` | `window.LEHRER_DATEN` (Hefteinträge, Aufgabenpool, Operatoren, Symbole, Räume) |
| `js/lehrer/00_basis.js` | Lehrkraft-Basis: Darstellung der Hefteinträge (Tafelbild, Schritt für Schritt), Brüche `\frac{}{}`, Skizzen |
| `js/lehrer/10_vortrag.js` | Vortrag: Tafelbild aufdecken (Klick/Leertaste/Pfeile), Vortragsnotizen, Referentenfenster (2. Bildschirm), Druck |
| `js/lehrer/20_generator.js` | Schulaufgaben-Generator: BE-Verteilung, Anforderungsbereiche I/II/III, ISB-Einschätzungsmatrix, Notenschlüssel, Notenspiegel, GSO-Prüfliste |
| `js/lehrer/30_einbindung.js` | Einbettung der App (z. B. in LMS) |
| `js/lehrer/40_word.js` | Word-Export (.docx, wird lokal ohne Fremdbibliothek erzeugt): Generator-Ausgabe **und** Hefteinträge/Vortrag via `LK.wordHeft(raumId, nr \| "alle", mitNotizen)` (Button 📄 im Druckmenü des Vortrags) |
| `tools/split.py` | Einmaliges Migrationsskript, das den Monolithen in diese Struktur zerlegt hat |
| `tools/verify.py` | Prüft, dass die Aufteilung inhalts-ident ist (Vergleich gegen die Originaldatei, z. B. `git show <commit>:Physik-Abenteuer-8-Lehrkraft.html > /tmp/orig.html && python3 tools/verify.py /tmp/orig.html`) |
| `tools/build.py` | Baut die Module wieder zu einer Einzeldatei zusammen (Gegenstück zu `split.py`), inkl. Selbst-Verifikation |
| `tools/smoke_word.mjs` | Smoke-Test für den Word-Export: `node tools/smoke_word.mjs` erzeugt Hefteintrag-.docx testweise und prüft den Inhalt |

## Architektur-Hinweise

- **Klassische Skripte, gemeinsame globale Scope:** Alle Dateien sind normale `<script>`-Tags
  (keine ES-Module). Top-Level-`const`/`let`/`function` sind dateiübergreifend sichtbar –
  **die Reihenfolge der `<script>`-Tags in `index.html` ist daher wichtig** und entspricht
  exakt der Reihenfolge im ursprünglichen Monolithen.
- **Navigation:** über `go("<screen>", …)` (definiert in `js/engine.js`); die untere Tab-Leiste
  schaltet über `data-tab="home|learn|compete|plan|me"`.
- **Zustand:** Schüler-Fortschritt in `localStorage` (Schlüssel `la-*`), Lehrkraft-Einstellungen
  unter `lt-*` (z. B. `lt-gen`, `lt-gen-liste` für den Generator).
- **Text-Markup in Inhalten:** `**fett**`, `_{tief}`, `^{hoch}`, `\n` (Zeilenumbruch) –
  siehe `fmt()` in `js/engine.js`. Alle Ausgaben laufen über `esc()` (XSS-sicher).
- **Farben/Design:** Theme über CSS-Variablen (`--t-beweg1`, `--t-kraft2`, …) und
  `data-theme="dark"`; Icons als Inline-SVG in `ICONLIB` (engine.js).

## Datenformate

- **`DATA`** (in `js/data/inhalte.js`): Array der Themen, je Thema u. a.
  `{id, title, short, quiz[], cards[], pairs[], sequences[], sorts[], exam[], diagrams[], labels[], …}`.
  Themen-IDs aktuell: `beweg1`, `beweg2`, `kraft1`, `kraft2`, `optik1`, `optik2`, `strom1`, `strom2`.
- **`LA_CFG`** (ebenda): `{id, title, short, subject, exam:{name, datum, …}, grading, goals:{day, week}, terms, levels:[[xp, name], …], vocab, music:{src}, …}`.
  Die Musik kann alternativ als Datei über `LA_CFG.music.src` eingebunden werden
  (statt `window.MUSIK_B64`).
- **`LEHRER_DATEN`** (in `js/lehrer/daten.js`):
  `{hefte: {<raum>: {eintraege: [...]}}, aufgaben: {<raum>: {…}}, operatoren, symbole, raeume}` –
  Details siehe Kopfkommentar in `js/lehrer/00_basis.js` (Skizzen-Zeichensatz: `symbole.svg`).

## Erweiterung

- **Neues Thema:** Eintrag in `DATA` (in `js/data/inhalte.js`) + passende Szenen in `js/20_*.js` / `js/40_lern_*.js`.
- **Neuer Aufgabentyp:** Screen in `js/06_ueben.js` registrieren + ggf. in die `KEEP`-Liste der
  Navigation aufnehmen (siehe Ende von `js/engine.js`).
- **Lehrkraft-Inhalte:** in `LEHRER_DATEN` (`js/lehrer/daten.js`) pflegen; Darstellung und
  Generator/Vortrag bauen darauf auf (`js/lehrer/*`).
- **Design:** Farben und Dark Mode zentral in `css/style.css` (CSS-Variablen) anpassen.

## Lizenz / Credits

- three.js r158: MIT License (Copyright © 2010-2023 three.js authors) – `js/vendor/three.min.js`
- Inhalte nach LehrplanPLUS Physik 8, Gymnasium Bayern (siehe Footer der App)
