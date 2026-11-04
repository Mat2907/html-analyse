/* ---------- 45_geschichte.js ---------- */
/* =====================================================================
   Geschichten der drei Welten (nur Mac-Version, 3D-Räume) – Schnittstelle: LERN-API.md, Abschnitt 3
   Je Welt ein durchgehender Fall: Auftrag in der Halle · Auftakt beim ersten Betreten eines Raums ·
   Hinweis nach dem Türrätsel (entsteht aus der Physik des Raums) · Finale vor der Schulaufgabe.
   Kapitel der Räume: strom1 1.1–1.3 · strom2 1.4–1.6 · optik1 2.1–2.2 · optik2 2.3–2.4 ·
                      beweg1 3.1–3.3 · beweg2 3.4–3.5 · kraft1 4.1–4.3 · kraft2 4.4–4.6
   Zahlen in den Hinweisen sind nachgerechnet (Ortsfaktor g = 9,81 N/kg, Mond 1,6 N/kg).
   ===================================================================== */
(() => {
const R3D = window.R3D; if (!R3D || !R3D.lern) return;

/* ---------- Zauberschule: Der verschwundene Torkristall ----------
   Lösung: Levin (Abschlussklasse) hat aus Prüfungsangst den Torkristall (10 kg) versteckt, um die Prüfung zu verschieben.
   Spur: Alarm mit langem Draht stumm (360 Ω) → Kurzschluss mit Haarnadel um 23:52 → Zettel in Spiegelschrift (Motiv) →
   Himmelskamera: Bild umgekehrt, Flug zum Flugplatz → 54 km/h, nur ein Rennbesen → Bremszauber: 70 kg statt 60 kg →
   Bodenplatte: 667 N hin, 569 N zurück (98 N = 10 kg fehlen) → Feder an der Rampe: 49 N = F_H, F_G = 98 N. */
R3D.lern.geschichte("zauber", {
  buch: "Chronik", icon: "📜", titel: "Der verschwundene Torkristall",
  gehilfe: {name: "Hausmeister Bertram", kurz: "Bertram", gen: "Bertrams", icon: "🧹"},
  tages: "Eine Eule landet auf dem Geländer und lässt einen versiegelten Umschlag fallen: **dein Tagesrätsel**. Rektorin Sternquell schreibt dazu: „Wer täglich übt, vergisst nichts.“",
  introTitel: "Ein Auftrag der Rektorin",
  intro: [
    "Kurz vor Mitternacht in der Akademie: In der Eingangshalle gehen plötzlich alle Lichter aus. Als Hausmeister Bertram mit seiner Laterne nachsieht, ist die Fassung über dem Tor zum großen Prüfungssaal leer – der **Torkristall** ist verschwunden, ein funkelnder Stein mit einer Masse von 10 kg. Ohne ihn öffnet sich das Tor nicht, und morgen soll dort die große Prüfung stattfinden.",
    "Rektorin Amalia Sternquell bittet dich um Hilfe: „Der Täter hat Spuren in allen acht Sälen hinterlassen – aber lesen kann sie nur, wer Physik versteht.“ In dieser Nacht waren nur drei wach: Hausmeister Bertram auf seinem Rundgang, Bibliothekarin Frau Moosgrund im Lesesaal und Levin aus der Abschlussklasse, der angeblich noch lernte.",
    "Löse in jedem Saal das Rätsel an der Tür – dann gibt der Saal sein Geheimnis preis. Sammle die acht Hinweise in deiner Chronik und finde den Torkristall, bevor der Morgen graut!"
  ],
  introKnopf: "Auf in die Säle",
  raeume: {
    strom1: {kapitel: "Der stumme Alarm",
      auftakt: "Oben im Turm hängt der Alarmkristall, der jeden Dieb verraten sollte – doch heute Nacht blieb er stumm. Prüfe seinen Stromkreis: Mit der Stromstärke stimmt etwas nicht.",
      hinweis: "Bei 9 V zeigt das Amperemeter im Alarmkreis nur **0,025 A** statt der üblichen 0,25 A. Mit R = U : I sind das 360 Ω statt 36 Ω: Jemand hat einen langen, dünnen Draht in Reihe dazugeschaltet, damit der Strom für den Alarm zu klein bleibt. Der Täter kennt sich mit Stromkreisen aus – genau wie Hausmeister Bertram, der hier die Leitungen pflegt."},
    strom2: {kapitel: "Dunkelheit um 23:52 Uhr",
      auftakt: "Im Kerker laufen alle Leitungen des Schlosses zusammen. Von hier aus wurde das Licht der Eingangshalle gelöscht – aber wie?",
      hinweis: "Im Sicherungskasten verbindet eine Haarnadel die beiden Leitungen der Hallenbeleuchtung direkt: ein **Kurzschluss** (an echten Leitungen lebensgefährlich!). Fast ohne Widerstand wurde die Stromstärke riesig, und der Leitungsschutzschalter schaltete sofort ab. Die Wanduhr im selben Stromkreis blieb dabei um **23:52 Uhr** stehen – das ist die Tatzeit. Haarnadeln tragen im Schloss nur zwei: Frau Moosgrund und Levin, der seine langen Haare zum Fliegen hochsteckt."},
    optik1: {kapitel: "Die Botschaft in Spiegelschrift",
      auftakt: "Einer der hundert Spiegel ist beschlagen, als hätte jemand ganz nah davorgestanden. Darunter liegt ein Zettel mit Zeichen, die niemand lesen kann.",
      hinweis: "Die Zeichen sind **Spiegelschrift**. Hältst du den Zettel vor einen Spiegel, kannst du sie im Spiegelbild lesen, denn ein ebener Spiegel vertauscht vorn und hinten. Dort steht: „Nur eine Nacht Aufschub – dann bin ich bereit.“ Wer den Torkristall genommen hat, wollte die Prüfung verschieben!"},
    optik2: {kapitel: "Die Platte der Himmelskamera",
      auftakt: "Die Himmelskamera der Sternwarte bannt jede Nacht den Himmel auf Glasplatten. Vielleicht hat sie um Mitternacht mehr gesehen als nur Sterne.",
      hinweis: "Auf der Platte von 23:58 Uhr fliegt ein Besen nach links – scheinbar in den Wald. Doch die Sammellinse der Kamera erzeugt ein **reelles Bild**, und das ist **umgekehrt und seitenvertauscht**. Richtig herum gedreht fliegt der Besen nach rechts: zum Besenflugplatz!"},
    beweg1: {kapitel: "Der schnellste Besen",
      auftakt: "Leuchtringe am Turm der Blitze und über dem Flugplatz merken sich, wann ein Besen sie durchfliegt. Wer heute Nacht unterwegs war, hat Spuren in der Zeit hinterlassen.",
      hinweis: "Die Ringe melden einen Besen um 23:57:00 Uhr am Turm der Blitze und um 23:58:20 Uhr über dem Flugplatz – 1200 m in 80 s. Das sind v = Δs : Δt = 1200 m : 80 s = **15 m/s = 54 km/h**. Der alte Besen des Hausmeisters schafft höchstens 25 km/h, Frau Moosgrund fliegt überhaupt nicht – so schnell ist nur ein Rennbesen, und von den dreien fliegt nur Levin einen."},
    beweg2: {kapitel: "Schweres Gepäck",
      auftakt: "An der Wand der Kammer leuchtet F · Δt = m · Δv. Daneben schimmert die Aufzeichnung des Bremszaubers, der jeden landenden Besen sanft abfängt.",
      hinweis: "Der Bremszauber hat den landenden Besen 2 s lang mit 350 N gebremst – von 15 m/s auf 5 m/s, also um Δv = 10 m/s. Aus F · Δt = m · Δv folgt m = 350 N · 2 s : 10 m/s = **70 kg** für Besen, Reiter und Gepäck. Levin und sein Rennbesen haben laut Flugbuch zusammen nur 60 kg – die fehlenden 10 kg sind genau die Masse des Torkristalls."},
    kraft1: {kapitel: "Der Riese, der keiner war",
      auftakt: "Hausmeister Bertram winkt dich aufgeregt heran: „Die Bodenplatte am Nordtor der Halle hat heute Nacht 667 angezeigt – hier war ein Riese mit 667 Kilo!“ Ob er die Anzeige richtig liest?",
      hinweis: "Die Bodenplatte ist ein Kraftmesser und zeigt **Newton, nicht Kilogramm**: 667 N bedeuten m = F_{G} : g = 667 N : 9,81 N/kg ≈ 68 kg – kein Riese. Auf dem Rückweg zeigte sie bei denselben Schuhabdrücken nur noch 569 N; die fehlenden 98 N sind die Gewichtskraft von 10 kg. Der Täter hat den Torkristall draußen gelassen – und das Nordtor führt zum Schlossberg!"},
    kraft2: {kapitel: "Der Beutel an der Feder",
      auftakt: "Ein schmaler Pfad führt zur Rampe am Schlossberg. Auf halber Höhe liegt ein Lederbeutel auf der Rampe, festgehalten von einer Zauberfeder – und ganz oben sitzt jemand im Dunkeln.",
      hinweis: "Die Zauberfeder zieht den Beutel parallel zur Rampe hangaufwärts; mit D = 7 N/cm ist sie um 7 cm gedehnt: F = D · s = **49 N**. Weil der Beutel in Ruhe bleibt (Reibung vernachlässigt), gleicht diese Kraft genau die Hangabtriebskraft aus. Die Rampe steigt auf 2 m Länge um 1 m an, also gilt F_{H} : F_{G} = 1 : 2. Der Beutel hat demnach eine Gewichtskraft von 98 N und eine Masse von rund 10 kg: Darin steckt der Torkristall!"}
  },
  finaleTitel: "Die Wahrheit am Schlossberg",
  finale: [
    "Im Lederbeutel funkelt der Torkristall. Oben auf der Rampe sitzt Levin, ein Heft voller Formeln auf den Knien. Leugnen hat keinen Sinn, denn deine Chronik fügt sich zusammen: Ein langer, dünner Draht machte den Alarm stumm, ein Kurzschluss mit seiner Haarnadel löschte um 23:52 Uhr das Licht, und im Spiegelsaal verlor er seinen Zettel in Spiegelschrift.",
    "Die Himmelskamera zeigte – richtig herum gedreht – seinen Flug zum Flugplatz, und die Leuchtringe maßen 54 km/h, wie sie nur ein Rennbesen schafft. Der Bremszauber verriet 10 kg Gepäck, die Bodenplatte 98 N weniger auf dem Rückweg, und die Feder an der Rampe bestätigte die Masse des Kristalls. „Ich hatte solche Angst vor der Prüfung“, gesteht Levin leise. „Ich wollte nur eine Nacht mehr zum Lernen.“",
    "Rektorin Sternquell setzt den Kristall zurück in seine Fassung, und das Tor zum großen Prüfungssaal schwingt auf. „Gegen Prüfungsangst hilft kein Trick, sondern Üben – und darüber reden“, sagt sie. Zur Wiedergutmachung verkabelt Levin den Alarm neu und schreibt seine Prüfung eine Woche später. Du hast die Physik aller acht Säle gebraucht, um den Fall zu lösen – jetzt zeigst du sie in der Schulaufgabe!"
  ],
  finaleKnopf: "Zur Schulaufgabe im Prüfungssaal"
});

/* ---------- Raumstation: Sabotage auf der Aurora? ----------
   Lösung: keine Sabotage. Ein verschlissener Spannungsregler (24 V statt 12 V) überlastete den Ladeplatz; Wartungsdrohne WD-4 „Kiesel“
   überbrückte die auslösende Sicherung, ihr Programm geriet durcheinander, und sie brachte den rot blinkenden Navigationskern (4 cm, 1 kg)
   als „defekt“ zum Recycling. Spur: 0,6 A statt 0,3 A → überbrückte Sicherung, winzige Greifspuren → Spiegelbild: 40 cm kleine Gestalt im Gang →
   B : G = b : g ergibt 4-cm-Würfel → gleichförmig 1,8 km/h = Drohne → F · Δt = m · Δv: 4 kg statt 3 kg → fliegt nur bei Mondschwere (6,4 N < 10 N < 39 N) →
   Rampe: F_H ≈ 9,8 N > Bremse 8 N → Finale: Federpuffer (F = D · s), Trägheit. */
R3D.lern.geschichte("sterne", {
  buch: "Logbuch", icon: "🛰", titel: "Sabotage auf der Aurora?",
  gehilfe: {name: "Wartungsdrohne Kiesel", kurz: "Kiesel", gen: "Kiesels", icon: "🤖"},
  tages: "Funkspruch von Kommandantin Okoro: „Kadett, dein tägliches Trainingsprogramm ist geladen.“ **Dein Tagesrätsel** wartet im Logbuch-Terminal.",
  introTitel: "Missionsbefehl",
  intro: [
    "Bordzeit 02:14 auf der Raumstation Aurora: Der Bordrechner meldet, dass der **Navigationskern** aus seiner Halterung entfernt wurde. Der Datenwürfel – 4 cm Kantenlänge, 1 kg Masse – enthält den Kurs für den Sprung nach Hause. Ohne ihn kann die Station nicht springen.",
    "Kommandantin Okoro spricht von Sabotage. Nachtschicht hatten nur drei: Chefingenieurin Mara Holt im Reaktorkern, Navigator Leon Brix, der sich mit der Kommandantin über den Kurs gestritten hat, und Astronomin Dr. Ilka Sund, die den Kern gern für ihre Sternmessungen gehabt hätte. Sonst sind nachts nur die kleinen Wartungsdrohnen unterwegs.",
    "Dein Auftrag, Kadett: Untersuche alle acht Stationen. Jede verrät dir einen Hinweis, sobald du ihr Türrätsel knackst. Trag alles ins Logbuch ein – und finde den Kern, bevor es zu spät ist."
  ],
  introKnopf: "Mission starten",
  raeume: {
    strom1: {kapitel: "Die Spannungsspitze",
      auftakt: "Im Reaktorkern summt es unruhig. Das Messprotokoll zeigt: Kurz vor dem Verschwinden des Navigationskerns ist hier etwas aus dem Gleichgewicht geraten.",
      hinweis: "Um 02:10 Uhr fiel ein Spannungsregler aus: Am Ladeplatz der Wartungsdrohnen lagen plötzlich **24 V statt 12 V** an. Bei einem Widerstand von 40 Ω floss dort I = U : R = 24 V : 40 Ω = **0,6 A** statt 0,3 A – doppelt so viel, wie die Elektronik der Drohnen verträgt. Den Regler betreut nur Chefingenieurin Holt – Sabotage oder Zufall?"},
    strom2: {kapitel: "Die überbrückte Sicherung",
      auftakt: "Hier verzweigen sich die Leitungen zu allen Systemen der Station. Eigentlich hätte eine Sicherung den Ladeplatz vor dem zu großen Strom schützen müssen.",
      hinweis: "Die Sicherung des Ladekreises ist mit einem Stück Draht **überbrückt** – deshalb konnte sie den Stromkreis trotz des zu großen Stroms nicht unterbrechen (streng verboten und gefährlich!). Die Kratzspuren am Draht sind winzig, wie von kleinen Greifzangen; Holts Werkzeug passt nicht dazu. Hat hier überhaupt ein Mensch gearbeitet?"},
    optik1: {kapitel: "Die Gestalt hinter dem Spiegel",
      auftakt: "Navigator Brix ist sicher: „Die Kamera hat den Dieb im verschlossenen Lager gefilmt – und den Schlüssel hat nur Holt!“ Doch die Kamera blickt gar nicht ins Lager, sondern auf einen Spiegel an der Lagerwand.",
      hinweis: "Die Kamera zeigt ein **Spiegelbild**: Es ist virtuell und liegt genauso weit hinter dem Spiegel wie die Gestalt davor. Sie stand also im offenen Gang, nicht im Lager. Der Bordrechner hat ihr Spiegelbild vermessen: nur **40 cm** hoch. Weil ein ebener Spiegel ein gleich großes Bild liefert, war auch die Gestalt nur 40 cm groß – ein Mensch war das nicht!"},
    optik2: {kapitel: "Der Würfel im Greifer",
      auftakt: "Dr. Sund hat in der Nacht eine Kamera des Observatoriums im Gang getestet und dabei eine kleine Gestalt gefilmt. In ihren Greifern hält sie etwas – aber was?",
      hinweis: "Auf dem Kamerasensor ist das Ding im Greifer B = 2 mm groß; die Bildweite beträgt b = 5 cm, die Gegenstandsweite g = 1 m. Aus B : G = b : g folgt G = B · g : b = 2 mm · 100 cm : 5 cm = **40 mm**. Ein Würfel mit 4 cm Kantenlänge – genau der Navigationskern!"},
    beweg1: {kapitel: "Gleichförmig wie eine Maschine",
      auftakt: "Lichtschranken im Hangar zeichnen auf, wann sich etwas durch die Halle bewegt. Die Messpunkte der Nacht ergeben ein verdächtig ordentliches Diagramm.",
      hinweis: "Im t-s-Diagramm liegen alle Messpunkte auf einer Geraden: In jeweils 4 s legte die Gestalt genau 2 m zurück – eine **gleichförmige Bewegung** mit v = 2 m : 4 s = 0,5 m/s = **1,8 km/h**. Das ist exakt die Fahrgeschwindigkeit der Wartungsdrohnen. Und seit der Spannungsspitze um 02:10 Uhr fehlt eine an ihrem Ladeplatz: WD-4, von allen „Kiesel“ genannt."},
    beweg2: {kapitel: "Ein Kilogramm zu viel",
      auftakt: "Auf dem spiegelglatten Boden des Antriebsdecks hat Kiesel seine Schubdüse gezündet, um schneller voranzukommen. Der Bordrechner hat Kraft, Dauer und Geschwindigkeitsänderung gespeichert.",
      hinweis: "Die Düse schob 2 s lang mit 2 N, und Kiesel wurde dabei um 1 m/s schneller. Aus F · Δt = m · Δv folgt m = F · Δt : Δv = 2 N · 2 s : 1 m/s = **4 kg**. Eine Wartungsdrohne hat aber nur 3 kg – Kiesel trägt 1 kg zusätzlich: genau die Masse des Navigationskerns."},
    kraft1: {kapitel: "Nur bei Mondschwere",
      auftakt: "Die Crew durchsucht die Lüftungsschächte unter der Decke, denn dort fliegen Wartungsdrohnen normalerweise. Die Sensoren melden aber: Kiesel ist nur hier im Gravitationslabor geflogen, wo Mondschwere eingestellt ist.",
      hinweis: "Bei Mondschwere (g = 1,6 N/kg) hat Kiesel mit dem Kern nur F_{G} = 4 kg · 1,6 N/kg = **6,4 N** Gewichtskraft – seine geschwächte Düse schafft 10 N und kann ihn heben. Im Rest der Station herrscht künstliche Erdschwere: Dort wären es 4 kg · 9,81 N/kg ≈ 39 N, viel zu viel für die Düse, obwohl seine Masse gleich bleibt. Kiesel fliegt also nicht durch die Schächte – er rollt am Boden, und vom Labor führt nur ein Weg weiter: die Asteroiden-Rampe!"},
    kraft2: {kapitel: "Wettlauf zur Schleuse",
      auftakt: "Am oberen Ende der Rampe blinkt ein rotes Licht: der Navigationskern, fest in Kiesels Greifern. Unten wartet die Recycling-Schleuse.",
      hinweis: "Die Rampe ist 4 m lang und 1 m hoch, also gilt F_{H} : F_{G} = 1 : 4. Bei F_{G} ≈ 39 N zieht die Hangabtriebskraft Kiesel mit rund **9,8 N** hinab. Seine geschwächten Bremsen halten nur 8 N – die resultierende Kraft zeigt hangabwärts. Kiesel rollt immer schneller auf die Recycling-Schleuse zu!"}
  },
  finaleTitel: "Rettung an der Schleuse",
  finale: [
    "Du sprintest die Rampe hinunter und klappst den Federpuffer vor die Schleuse. Wegen seiner Trägheit rollt Kiesel einfach weiter – bis die Feder ihn auffängt: Sie wird elastisch zusammengedrückt, nach F = D · s wächst ihre Kraft mit jedem Zentimeter, und sie bringt ihn zum Stehen. Bevor die Feder ihn wieder zurückschieben kann, hältst du ihn fest. Der Navigationskern blinkt rot, aber er ist unversehrt.",
    "Dein Logbuch erzählt den ganzen Fall: Der verschlissene Regler legte 24 V statt 12 V an den Ladekreis, und es floss 0,6 A statt 0,3 A. Weil die Sicherung immer wieder auslöste, „reparierte“ Kiesel sie mit einem Draht – und der zu große Strom brachte sein Programm durcheinander. Seit der Spannungsspitze blinkte auch der Kern rot; Kiesel hielt ihn für kaputt, und kaputte Teile bringt er zum Recycling. Das 40 cm kleine Spiegelbild, der 4-cm-Würfel, die gleichförmigen 1,8 km/h, die 4 kg und der Flug nur bei Mondschwere passen genau zusammen: Es gab keinen Saboteur.",
    "Chefingenieurin Holt baut einen neuen Regler und eine echte Sicherung ein, Kiesel bekommt ein frisches Programm, und Kommandantin Okoro entschuldigt sich bei ihrer Crew. Dann ruft sie dich auf die Kommandobrücke: „Den Kurs nach Hause berechnet nur, wer die Physik aller acht Stationen beherrscht.“ Deine finale Mission beginnt – die Schulaufgabe!"
  ],
  finaleKnopf: "Zur Schulaufgabe auf der Brücke"
});

/* ---------- Detektei: Der Fall der verschwundenen Laterne ----------
   Lösung: Laternenanzünder Ned Pike hat die Musterlaterne (30 kg) aus Angst um seine Arbeit versteckt, um die Vorführung zu verhindern.
   Spur: Amperemeter parallel (Laie, Tilly entlastet) → Kurzschluss mit Laternenhaken um 22:40 → Spiegelbild: Mann auf der Leiter vor dem Fenster →
   Brille mit Sammellinsen (weitsichtig/alterssichtig, Tilly ist kurzsichtig) → Kutsche: 6 km mit 15 km/h = 24 min, Gorse hat ein Alibi →
   Tischtuchtrick (kleines Δt, kleines Δv): Tuch mit Monogramm → Kran: 392 N = 40 kg, Laterne nicht verschifft → Hampstead: Karren stoppt, Fass rollt (Trägheit). */
R3D.lern.geschichte("detektiv", {
  buch: "Fallakte", icon: "🗂", titel: "Der Fall der verschwundenen Laterne",
  gehilfe: {name: "Constable Briggs", kurz: "Briggs", gen: "Briggs'", icon: "👮"},
  tages: "Ein Botenjunge bringt ein Telegramm aus der Detektei: **dein Tagesrätsel**. Professor Quill hat daruntergeschrieben: „Ein guter Detektiv trainiert jeden Tag.“",
  introTitel: "Ein neuer Fall",
  intro: [
    "London, ein nebliger Novemberabend. Professor Edmund Quill stürmt ins Foyer der Detektei: Seine **Musterlaterne** – das neueste Modell seiner elektrischen Straßenlaternen, 30 kg Eisen, Glas und Draht – ist aus der Werkstatt verschwunden. In seiner Straße brennen schon die ersten elektrischen Laternen zur Probe; morgen wollte er dem Stadtrat zeigen, dass bald ganz London elektrisches Licht bekommen kann.",
    "Drei Personen hatten Gelegenheit: seine Assistentin Tilly Whitley, die jede Schraube der Laterne kennt; der Gaslaternen-Fabrikant Bartholomew Gorse, dem elektrisches Licht das Geschäft verderben würde; und der alte Laternenanzünder Ned Pike, der jeden Abend die Gaslaternen des Viertels entzündet.",
    "Mrs. Thorne, die Leiterin der Detektei, reicht dir die Fallakte: „Acht Schauplätze, acht Spuren. Lies sie mit Physik, dann findest du die Wahrheit.“ Löse an jedem Schauplatz das Rätsel an der Tür – dann gibt er sein Indiz preis."
  ],
  introKnopf: "Die Ermittlung beginnt",
  raeume: {
    strom1: {kapitel: "Ein Anfängerfehler",
      auftakt: "In dieser Werkstatt wurde die Musterlaterne gebaut. Auf der Werkbank liegen noch Kabel – und ein Amperemeter, dessen Zeiger sich nicht mehr rührt.",
      hinweis: "Der Täter hat die Laterne ausprobiert und dabei das **Amperemeter parallel** zur Lampe angeschlossen. Weil es fast keinen Widerstand hat, schloss es die Lampe kurz: Die Stromstärke wurde riesig, fast der ganze Strom floss durch das Messgerät, und seine Sicherung brannte durch. Eine Fachfrau wie Tilly Whitley baut ein Amperemeter immer **in Reihe** ein – der Täter versteht also wenig von Strom."},
    strom2: {kapitel: "Dunkel um 22:40 Uhr",
      auftakt: "Laut Nachtwächter wurde um 22:40 Uhr die ganze Straße dunkel – kurz darauf war die Musterlaterne fort. Die Spur führt in den Keller unter der ersten Laterne der Versuchsstraße, wo alle Leitungen zusammenlaufen.",
      hinweis: "Ein langer eiserner Haken verbindet die beiden blanken Leitungen direkt: ein **Kurzschluss**. Fast ohne Widerstand wurde die Stromstärke riesig, der dünne Draht der Schmelzsicherung schmolz durch, und die Straße lag im Dunkeln – für den Täter lebensgefährlich! Solche Haken benutzen Laternenanzünder für die Gaslaternen – und hergestellt werden sie in der Fabrik von Mr. Gorse."},
    optik1: {kapitel: "Der Mann hinter dem Spiegel",
      auftakt: "Ein Dienstmädchen aus dem Spiegelkabinett gegenüber schwört: Um 22:45 Uhr stand ein Mann hinter dem großen Spiegel – dort, wo nur eine Mauer ist. Ein Geist – oder Physik?",
      hinweis: "Das Mädchen sah ein **Spiegelbild**: Es ist virtuell und liegt genauso weit hinter dem Spiegel, wie der Mann davorstand. Mit Einfallswinkel = Reflexionswinkel lässt sich rekonstruieren, wo er wirklich war: draußen vor dem Fenster, oben auf einer Leiter. In der Hand hielt er eine lange Stange mit Haken – dieselbe Art Haken wie im Keller."},
    optik2: {kapitel: "Die Brille im Rinnstein",
      auftakt: "Unter dem Fenster lag eine Brille im Rinnstein. Der Optiker hält sie gegen das Licht und runzelt die Stirn.",
      hinweis: "Die Gläser sind in der Mitte dicker als am Rand – **Sammellinsen**. Sie helfen Weitsichtigen, deren Augapfel zu kurz ist, und älteren Menschen, deren Augenlinse sich nicht mehr stark genug wölbt, in der Nähe scharf zu sehen. Tilly Whitley ist aber kurzsichtig und trägt Zerstreuungslinsen – diese Brille gehört nicht ihr."},
    beweg1: {kapitel: "Das Alibi von Mr. Gorse",
      auftakt: "Mr. Gorse behauptet, er habe bis 22:30 Uhr in Hampstead diniert. Das Fahrtenbuch der Kutschenstation verrät, ob er trotzdem rechtzeitig am Tatort sein konnte.",
      hinweis: "Von Hampstead bis zur Werkstatt sind es 6 km, und die schnellste Kutsche der Station schafft im Durchschnitt 15 km/h. Mit Δt = Δs : v = 6 km : 15 km/h = 0,4 h = **24 min** wäre Gorse frühestens um 22:54 Uhr angekommen. Als um 22:40 Uhr die Straße dunkel wurde, saß er also noch in der Kutsche – sein Alibi hält."},
    beweg2: {kapitel: "Der Trick mit dem Tischtuch",
      auftakt: "Im Labor neben der Werkstatt steht das Teeservice des Professors ordentlich auf dem nackten Tisch. Wo ist das Tischtuch geblieben – und warum hat niemand etwas klirren hören?",
      hinweis: "Der Täter hat das Tuch mit einem Ruck unter dem Geschirr weggezogen. Weil die Reibungskraft dabei nur sehr kurz wirkte, war nach F · Δt = m · Δv auch die Geschwindigkeitsänderung der Tassen winzig – sie blieben stehen, und kein Klirren weckte das Haus. Der Täter wollte leise sein und brauchte das Tuch mit dem Monogramm **E. Q.**: zum Einwickeln der Laterne."},
    kraft1: {kapitel: "Die Kiste nach Rotterdam",
      auftakt: "Constable Briggs ist sicher: Die Laterne wurde mit dem Morgenschiff nach Rotterdam geschmuggelt – in einer Kiste, in die der Hafenmeister am Abend 40 kg Ersatzteile gepackt hatte. Der Hafenkran hat die Kiste an seinem Federkraftmesser verladen.",
      hinweis: "Der Kraftmesser des Krans zeigte **392 N**, also m = F_{G} : g = 392 N : 9,81 N/kg ≈ 40 kg – genau die Masse der Ersatzteile. Läge die 30 kg schwere Laterne zusätzlich in der Kiste, hätten sich die Gewichtskräfte zu 392 N + 294 N = 686 N addiert. Die Laterne ist nicht auf dem Schiff – sie ist noch in London!"},
    kraft2: {kapitel: "Das rollende Fass",
      auftakt: "Auf dem Hügel von Hampstead, gleich neben Ned Pikes Häuschen, rumpelt es plötzlich: Ein Handkarren mit einem Fass hat sich gelöst und rollt den Hang hinab.",
      hinweis: "Ohne Bremse zieht die Hangabtriebskraft den Karren hinunter, bis ein Stein ihn abrupt stoppt. Das Fass darauf bewegt sich wegen seiner **Trägheit** weiter, kippt herunter und rollt dir vor die Füße. Der Deckel springt auf – heraus lugt ein Tischtuch mit dem Monogramm E. Q.!"}
  },
  finaleTitel: "Die Beweise vor Gericht",
  finale: [
    "Im Fass liegt, gut in Stroh und Tischtuch gewickelt, die Musterlaterne – unversehrt. Am Gartentor steht Ned Pike, den Hut in den Händen. Vor Gericht legst du deine Fallakte vor: Der Täter verstand wenig von Strom, löste um 22:40 Uhr mit einem Laternenhaken einen Kurzschluss aus und stand mit Leiter und Hakenstange vor dem Fenster – nicht hinter dem Spiegel.",
    "Die Lesebrille mit Sammellinsen, die Ned seit jenem Abend vermisst, passte nicht zur kurzsichtigen Tilly Whitley; die Kutschenfahrt bewies das Alibi von Mr. Gorse; das Tischtuch verriet einen leisen Dieb; der Hafenkran zeigte, dass die Laterne London nie verlassen hat – und die Trägheit des Fasses tat den Rest. Ned nickt: „Elektrische Laternen brauchen keinen Anzünder. Ich hatte Angst um meine Arbeit und wollte die Vorführung nur verhindern – kaputtmachen wollte ich nichts.“",
    "Professor Quill bittet den Richter um Milde und bietet Ned an, der erste Wärter der neuen elektrischen Laternen zu werden – wer kennt die Straßen besser als er? Der Richter belässt es bei einer Verwarnung und schließt den Fall. Dann wendet er sich noch einmal an dich: „Zeigen Sie dem Gericht, dass Sie die Physik hinter jedem Beweis wirklich verstehen.“ Deine Schulaufgabe beginnt!"
  ],
  finaleKnopf: "Zur Schulaufgabe im Gerichtssaal"
});

/* Zahl und Einheit („10 kg“, „23:52 Uhr“) sowie kurze Formeln („R = U : I“) nicht am Zeilenende auseinanderreißen:
   die Leerzeichen dort durch geschützte Leerzeichen ersetzen (nur Anzeige, die Texte oben bleiben lesbar). */
const NB = " ", EINH = "(?:N\\/kg|N\\/cm|m\\/s|km\\/h|kg|km|cm|mm|min|Uhr|V|A|Ω|N|m|s|h)";
const nb = t => String(t).replace(new RegExp("(\\d) (?=" + EINH + "(?![\\wÄÖÜäöüß]))", "g"), "$1" + NB).replace(/ ([=≈·:+]) /g, NB + "$1" + NB);
for (const w of ["zauber", "sterne", "detektiv"]) { const s = R3D.lern.stories[w]; if (!s) continue;
  s.intro = s.intro.map(nb); s.finale = s.finale.map(nb);
  for (const r of Object.values(s.raeume)) { r.auftakt = nb(r.auftakt); r.hinweis = nb(r.hinweis); } }
})();
