# Weiterentwicklung: Ideen aus der App-Analyse

Abgeleitet aus dem Aufbau der App (siehe `README.md` für die Struktur). Zielgruppe:
**Lehrkräfte** (Mehrwert im Unterricht) und **Design-Team** (Konsistenz, Look & Feel),
plus technische Folge-Ideen nach der Aufteilung in Module.

## Was die App bereits gut macht (bewährte Muster, beibehalten)

- **Alles offline, eine Datei-/Ordnerstruktur ohne Build** – ideal fürs Klassenzimmer (kein WLAN nötig).
- **Gamification:** XP + Level-Namen (`LA_CFG.levels`), Streaks, Lernzeit-Tracking, Prüfungs-Countdown (`js/engine.js`).
- **Viele Aufgabentypen** pro Thema: Quiz, Karteikarten, Paare, Sequenzen, Sortieren, Klausur-Modus, Diagramme, Beschriften, Fälle, offene Fragen (`js/06_ueben.js`).
- **Drei begehbare 3D-Welten** (Zauber/Sterne/Detektiv) plus Themen-Szenen (`js/17_raum_*.js`, `js/20_*.js`) – hoher Motivationsfaktor.
- **Lehrkraft-Werkzeuge** direkt in der App: Vortragsmodus mit Referentenfenster und Druck (`js/lehrer/10_vortrag.js`), Schulaufgaben-Generator mit ISB-Matrix und GSO-Checkliste (`js/lehrer/20_generator.js`), Word-Export (`js/lehrer/40_word.js`).
- **Sicherheit & Konsistenz im Code:** überall `esc()` vor `innerHTML`, zentrales Mini-Markup (`**fett**`, `_{…}`, `^{…}`), Theme über CSS-Variablen, Dark Mode, Icon-Bibliothek als Inline-SVG.

## Ideen für Lehrkräfte

1. **Mehrere Schüler-Profile pro Gerät** – aktuell ein globaler Zustand (`localStorage`, `la-*`); Profile mit Wechsel/Export (JSON) würden den Einsatz an Schulgeräten erleichtern.
2. **Lernstands-Export & -Import** – Fortschritt, XP, Fehler-Statistik als JSON exportieren/teilen (z. B. für Elterngespräche oder Klassenübergabe).
3. **Fehler-Statistik auswerten:** Der "Fehlerteufel" im Wettkampf sammelt falsche Antworten – daraus automatisch Übungs-Empfehlungen pro Thema ableiten (Schwächenanalyse).
4. **Spaced Repetition für Karteikarten** – Karteikasten (`cards`) mit Wiederholungs-Intervallen statt reinem Zufall.
5. **Generator erweitern:** Themen-Filter und eigene Aufgaben aus `LEHRER_DATEN.aufgaben` mischen; gespeicherte Schulaufgaben (`lt-gen-liste`) als Vorlagen wiederverwenden – inkl. Differenzierung (Gruppe A/B ist bereits vorgesehen).
6. **ISB-Kompetenzmatrix pro Schüler:** Einschätzungsmatrix aus dem Generator mit Schülernamen und Verlauf über mehrere Arbeiten.
7. **Vortrag:** Timer pro Hefteintrag (Feld `dauer` existiert bereits in `LEHRER_DATEN`), Notizen auch im Referentenfenster farblich markieren.
8. **Lernzettel (Druck) konfigurierbar:** Themen-/Kapitel-Auswahl vor dem Druck, damit SuS gezielt lernen können.
9. **QR-Code statt Link** im Einbindungs-Dialog (`js/lehrer/30_einbindung.js`) für schnelles Teilen im Unterricht.

## Ideen für das Design-Team

1. **Theme-System konsequent durchziehen:** Farben kommen aus CSS-Variablen (`--t-beweg1`, …) – prüfen, ob alle Screens (inkl. 3D-Räume und Lehrkraft-Ansichten) sie nutzen; weitere Themes (z. B. hoher Kontrast) als eigenes `data-theme` pflegen.
2. **`prefers-reduced-motion` respektieren** – Animationen (Level-up, Konfetti, Übergänge) reduzieren, wenn im Betriebssystem eingestellt.
3. **WCAG-Kontrast prüfen** – besonders Tab-Leiste und Buttons im Dark Mode (`:root[data-theme="dark"]`).
4. **Konsistente Icon-Größe/-Strichstärke** in `ICONLIB` und Tab-Leiste (aktuell `viewBox 0 0 24 24` vs. 32 in der Bibliothek).
5. **Leere Zustände gestalten** – z. B. "noch keine XP", "keine Aufgaben im Pool" mit Illustration statt leerer Fläche.
6. **Typografie-Skala** definieren (Titel, Fließtext, Caption) und in `css/style.css` als Variablen hinterlegen.
7. **Mobile First verfeinern:** Tab-Leiste und Focus-Bar mit `env(safe-area-inset-*)` sind vorbereitet – Touch-Ziele (min. 44 px) überall prüfen.

## Technische Folge-Ideen (nach der Modul-Aufteilung)

1. **three.js lazy laden** – `js/vendor/three.min.js` wird aktuell immer geladen, aber nur für `17_raum_*` gebraucht (dynamisches `import()`/Einstecken des Script-Tags erst beim Öffnen eines Raums).
2. **Musik als Datei statt Base64** – `js/data/inhalte.js` (1,3 MB) enthält `MUSIK_B64`; die Engine unterstützt bereits `LA_CFG.music.src` → `assets/musik.mp3` auslagern.
3. **`inhalte.js` weiter aufteilen** in `daten.js` (DATA, LA_CFG, LA_CASES) und `musik.js`, damit Inhalts-Änderungen kleine Diffs erzeugen.
4. **PWA:** `manifest.webmanifest` + Service Worker → App installierbar/offline nutzbar auf Tablets.
5. **Von klassischen Skripten zu ES-Modulen** wechseln (saubere Abhängigkeiten statt globaler Scope) – dann ist `file://` nicht mehr möglich, Server/PWA nötig.
6. **Automatisierte Checks:** `node --check` über alle `js/`-Dateien + `tools/verify.py` in GitHub Actions (CI), damit die Struktur nicht wieder zu einem Monolithen wird.
7. **Smoke-Test:** headless Browser (z. B. Playwright) lädt `index.html` und prüft, dass keine Konsolenfehler auftreten und die Tab-Leiste rendert.
8. **Barrierefreiheit-Audit** (Tastatur-Navigation durch Quiz/Karteikarten, Screenreader-Labels, `aria-live` ist bereits gesetzt).

## Mögliche Priorisierung

- **Schnelle Gewinne:** Musik/three.js auslagern (kleinere Ladezeit), `prefers-reduced-motion`, Icon-Konsistenz, leere Zustände.
- **Mittelfristig:** Profile + Export, Spaced Repetition, Schwächenanalyse, Generator-Vorlagen.
- **Größere Brocken:** PWA + ES-Module + CI/Smoke-Tests, Kompetenzmatrix mit Verlauf.
