// Texte zu den Leveln. Jede Barriere hat drei Reparaturvorschläge, genau einer ist richtig (right).
// Die Personen sind ausgedacht – ihre Hürden nicht.
window.BF_LEVELS = [
  {
    id: 1, mode: "sr", title: "Blindflug",
    persona: "Mira, 34, Softwareentwicklerin",
    about: "Mira ist seit ihrer Geburt blind. Sie nutzt einen Screenreader, ein Programm, das ihr die Seite vorliest, und zwar so schnell, dass die meisten von uns nicht mitkommen würden. Wenn sie im Shop nicht weiterkommt, liegt das am Code.",
    goal: "Wähle einen Stehplatz und leg ihn in den Warenkorb – nur mit dem Screenreader.",
    steps: [
      "Der Bildschirm ist aus. Unten hörst du die Seite so, wie Miras Screenreader sie vorliest.",
      "Mit „Weiter ▶“ oder der Pfeiltaste ↓ liest du das nächste Element, mit „H“ springst du zur nächsten Überschrift.",
      "Mit „⏎ Aktivieren“ (oder Enter) drückst du einen Schalter oder wählst eine Option.",
      "Du kommst nicht weiter? Dann ab in die Werkstatt und repariere den Code. Danach nochmal versuchen.",
    ],
    barriers: [
      {
        id: "plakat", title: "Das Plakat ist stumm",
        what: "Datum, Uhrzeit und Ort stehen nur im Bild. Der Screenreader findet keinen Alternativtext und liest den Dateinamen vor: „Grafik, plakat.svg“.",
        before: '<img src="plakat.svg">',
        options: [
          { code: '<img src="plakat.svg" alt="Bild">', why: "„Bild“ sagt nichts. Der Screenreader liest jetzt „Grafik: Bild“ – und Mira weiß immer noch nicht, wann das Konzert ist." },
          { code: '<img src="plakat.svg"\n     alt="Plakat: Hafenlichter – Open Air,\n          Samstag, 14. März 2027, 20 Uhr, Hafenbühne">', right: true },
          { code: '<img src="plakat.svg" alt="">', why: "alt=\"\" bedeutet: reine Dekoration, bitte überspringen. Das ist richtig für Schnörkel – aber auf diesem Bild stehen wichtige Informationen." },
        ],
        explain: "Jedes Bild mit Inhalt braucht einen Alternativtext, der dieselbe Information liefert. Reine Deko bekommt alt=\"\", dann wird sie übersprungen.",
        wcag: "WCAG 1.1.1 Nicht-Text-Inhalt",
      },
      {
        id: "kategorie", title: "Die Kacheln sind nur Bilder",
        what: "Die Kategorien sind anklickbare Kacheln – aber technisch nur Bilder in einem div. Der Screenreader sagt „Grafik, steh.svg“. Auswählen kann Mira nichts.",
        before: "<div class=\"kachel\" onclick=\"waehle('steh')\">\n  <img src=\"steh.svg\">\n</div>",
        options: [
          { code: "<div class=\"kachel\" onclick=\"waehle('steh')\"\n     aria-label=\"Stehplatz\">\n  <img src=\"steh.svg\">\n</div>", why: "Ein aria-label auf einem div ohne Rolle wird von vielen Screenreadern ignoriert – und auswählen kann man das div trotzdem nicht. Faustregel: Kein ARIA ist besser als schlechtes ARIA." },
          { code: "<div class=\"kachel\" onclick=\"waehle('steh')\"\n     tabindex=\"0\">\n  <img src=\"steh.svg\">\n</div>", why: "Jetzt bekommt das div zwar den Fokus, aber der Screenreader weiß nicht, was es ist – und Enter löst bei einem div kein onclick aus." },
          { code: "<fieldset>\n  <legend>Kategorie</legend>\n  <label><input type=\"radio\" name=\"kat\"> Stehplatz – 49 €</label>\n  <label><input type=\"radio\" name=\"kat\"> Sitzplatz – 69 €</label>\n</fieldset>", right: true },
        ],
        explain: "Native HTML-Elemente bringen Rolle, Name, Zustand und Tastaturbedienung gratis mit. Ein Optionsfeld sagt von selbst: „Optionsfeld: Stehplatz, ausgewählt“.",
        wcag: "WCAG 4.1.2 Name, Rolle, Wert",
      },
      {
        id: "knopf", title: "Der Warenkorb-Knopf ist keiner",
        what: "Der Knopf ist ein div mit einem Einkaufswagen-Bild. Für den Screenreader: „Grafik, warenkorb.svg“. Eine Grafik kann man nicht drücken.",
        before: '<div class="kaufen" onclick="kaufen()">\n  <img src="warenkorb.svg">\n</div>',
        options: [
          { code: '<button type="button" onclick="kaufen()">\n  In den Warenkorb\n</button>', right: true },
          { code: '<img src="warenkorb.svg" alt="In den Warenkorb"\n     onclick="kaufen()">', why: "Jetzt hat das Bild einen Namen, aber es bleibt ein Bild: „Grafik: In den Warenkorb“. Drücken kann man es mit dem Screenreader immer noch nicht." },
          { code: '<div class="kaufen" onclick="kaufen()" role="button">\n  <img src="warenkorb.svg">\n</div>', why: "role=\"button\" verspricht einen Schalter, hält das Versprechen aber nicht: kein Fokus, keine Enter-Taste, kein Name. Wer ARIA nutzt, muss das ganze Verhalten selbst nachbauen." },
        ],
        explain: "Was etwas auslöst, ist ein <button>. Was woanders hinführt, ist ein <a href>. Beide sind von Haus aus fokussierbar, haben eine Rolle und reagieren auf die Tastatur.",
        wcag: "WCAG 4.1.2 Name, Rolle, Wert · 2.1.1 Tastatur",
      },
    ],
    win: {
      title: "Mira hat ihre Karte. 🎫",
      text: "Drei kleine Änderungen im Code – und aus „Grafik, Grafik, Grafik“ wurde ein Shop, den man benutzen kann. Echte Screenreader wie NVDA, JAWS oder VoiceOver lesen die Seite genau so wie unser Simulator: Rolle, Name, Zustand. Was dort fehlt, existiert für Mira nicht.",
    },
  },
  {
    id: 2, mode: "keys", title: "Keine Maus",
    persona: "Jonas, 58, Elektriker",
    about: "Seit einer Nervenerkrankung zittern Jonas' Hände. Eine Maus kann er nicht genau führen, deshalb bedient er alles mit der Tastatur. Genauso arbeiten viele Menschen mit Sprachsteuerung, Mundstab oder Schaltern – sie alle brauchen eine Seite, die ohne Maus funktioniert.",
    goal: "Wähle einen Sitzplatz und leg ihn in den Warenkorb – nur mit der Tastatur.",
    steps: [
      "Drück auf „Simulation starten“. Danach ist die Maus über dem Shop gesperrt, der Fokus steht direkt davor.",
      "Tab springt zum nächsten Bedienelement, Shift + Tab zurück.",
      "In einer Gruppe von Optionsfeldern wechselst du mit den Pfeiltasten. Enter oder Leertaste drückt einen Schalter.",
      "Esc ist dein Notausgang: Er holt dich jederzeit aus dem Shop zurück ins Spiel. (Der gehört zum Spiel, nicht zum Shop.)",
    ],
    barriers: [
      {
        id: "falle", title: "Die Cookie-Falle",
        what: "Der Cookie-Banner hält den Tab-Fokus fest, er kreist nur zwischen „Datenschutz“ und „Einstellungen“. „Alle akzeptieren“ ist ein span, also per Tastatur unerreichbar. Jonas kommt nie hinter den Banner.",
        before: '<span class="btn" onclick="zustimmen()">\n  Alle akzeptieren\n</span>',
        options: [
          { code: '<span class="btn" onclick="zustimmen()"\n      tabindex="5">\n  Alle akzeptieren\n</span>', why: "Ein positives tabindex wirft die ganze Tab-Reihenfolge durcheinander – und ein span reagiert trotzdem nicht auf Enter oder Leertaste." },
          { code: "/* Fokusfalle entfernen, der Banner bleibt offen,\n   Tab läuft dahinter einfach weiter */", why: "Dann tabbt Jonas hinter einem Banner herum, den er nicht schließen kann – und der ihm die halbe Seite verdeckt." },
          { code: '<button type="button" onclick="zustimmen()">\n  Alle akzeptieren\n</button>', right: true },
        ],
        explain: "Ein Dialog darf den Fokus festhalten, solange er offen ist – aber nur, wenn man ihn per Tastatur auch schließen kann. Sonst ist es eine Falle.",
        wcag: "WCAG 2.1.2 Keine Tastaturfalle",
      },
      {
        id: "fokus", title: "Der unsichtbare Fokus",
        what: "Das Design hat den Fokusrahmen entfernt, weil er „hässlich“ aussah. Jonas drückt Tab und sieht nicht, wo er gerade ist.",
        before: "*:focus { outline: none; }",
        options: [
          { code: "*:focus { outline: 1px solid #f4f4f4; }", why: "Ein hauchdünner hellgrauer Rahmen auf weißem Grund ist so gut wie unsichtbar. Der Fokus muss sich deutlich abheben." },
          { code: ":focus-visible {\n  outline: 3px solid #1d4ed8;\n  outline-offset: 2px;\n}", right: true },
          { code: "button:hover {\n  outline: 3px solid #1d4ed8;\n}", why: ":hover reagiert auf die Maus. Jonas hat keine." },
        ],
        explain: ":focus-visible zeigt den Rahmen, sobald jemand mit der Tastatur unterwegs ist, und lässt Mausklicks in Ruhe. So sind Design und Bedienbarkeit beide zufrieden.",
        wcag: "WCAG 2.4.7 Fokus sichtbar",
      },
      {
        id: "knopf", title: "Der Link ohne Ziel",
        what: "„In den Warenkorb“ sieht aus wie ein Knopf, ist aber ein <a> ohne href. So ein Link ist für die Tab-Taste unsichtbar – Jonas springt einfach darüber hinweg.",
        before: '<a class="btn" onclick="kaufen()">\n  In den Warenkorb\n</a>',
        options: [
          { code: '<a class="btn" onclick="kaufen()" tabindex="0">\n  In den Warenkorb\n</a>', why: "Jetzt landet der Fokus darauf, aber ein Link ohne href reagiert nicht auf Enter. Jonas drückt – und nichts passiert." },
          { code: '<button type="button" onclick="kaufen()">\n  In den Warenkorb\n</button>', right: true },
          { code: '<a class="btn" ondblclick="kaufen()">\n  In den Warenkorb\n</a>', why: "Ein Doppelklick ist mit zitternden Händen noch schwerer – und mit der Tastatur gar nicht möglich." },
        ],
        explain: "Ein <button> ist automatisch fokussierbar und reagiert auf Enter und Leertaste. Kein JavaScript-Trick nötig.",
        wcag: "WCAG 2.1.1 Tastatur",
      },
    ],
    win: {
      title: "Jonas hat seine Karte. 🎫",
      text: "Tastaturbedienung ist das Fundament: Screenreader, Sprachsteuerung, Schaltersteuerung und viele andere Hilfsmittel funktionieren nur, wenn die Seite per Tastatur funktioniert. Der schnellste Barrierefreiheitstest der Welt: Maus weglegen und einmal durch die Seite tabben.",
    },
  },
  {
    id: 3, mode: "see", title: "Verschwommen",
    persona: "Bernd Kowalski, 67, Rentner",
    about: "Durch den Grauen Star sieht Herr Kowalski alles etwas verschwommen. Und wie ungefähr jeder zwölfte Mann hat er eine Rot-Grün-Sehschwäche. Seine Brille hilft – aber blasse Schrift bleibt blass.",
    goal: "Schließ die Bestellung ab. Die Daten sind schon eingetragen – aber stimmt alles?",
    steps: [
      "Der Shop wird so angezeigt, wie Herr Kowalski ihn sieht: unscharf und ohne Unterschied zwischen Rot und Grün.",
      "Drück auf den Bestellknopf. Wenn es nicht klappt: Finde heraus, warum.",
      "Mit „Simulation aus“ kannst du kurz vergleichen. Herr Kowalski kann das nicht.",
      "Dann ab in die Werkstatt – und noch einmal mit Simulation.",
    ],
    barriers: [
      {
        id: "kontrast", title: "Hellgrau auf Fast-Weiß",
        what: "Beide Knöpfe haben hellgraue Schrift auf fast weißem Grund (Kontrast 1,6 : 1) und sehen gleich aus. Welcher bestellt, welcher bricht ab? Und „Abbrechen“ steht genau da, wo man den Hauptknopf erwartet.",
        before: ".btn { color: #c4c4c4; background: #f3f3f3; }",
        options: [
          { code: ".btn {\n  color: #c4c4c4; background: #f3f3f3;\n  font-size: 20px;\n}", why: "Größer hilft ein bisschen, aber der Kontrast bleibt 1,6 : 1. Für normale Schrift verlangt die WCAG mindestens 4,5 : 1." },
          { code: ".btn-bestellen { color: #fff; background: #3fae5a; }\n/* grün = los */", why: "Weiß auf diesem Grün hat nur knapp 3 : 1 Kontrast – und „grün heißt los“ hilft niemandem mit Rot-Grün-Schwäche." },
          { code: ".btn-haupt  { color: #fff; background: #1d4ed8; }\n.btn-neben { color: #1f1f1f; background: #fff;\n             border: 2px solid #1f1f1f; }\n/* Hauptknopf zuerst */", right: true },
        ],
        explain: "Normale Schrift braucht mindestens 4,5 : 1 Kontrast, große Schrift 3 : 1. Und wichtige Unterschiede nie nur über Farbe zeigen: Hier ist der Hauptknopf gefüllt, der Nebenknopf nur umrandet.",
        wcag: "WCAG 1.4.3 Kontrast · 1.4.1 Benutzung von Farbe",
      },
      {
        id: "fehler", title: "Der Fehler ist nur rot",
        what: "Die E-Mail-Adresse ist unvollständig. Gezeigt wird das nur durch einen roten Rahmen – den Herr Kowalski nicht von einem grauen unterscheiden kann. Er drückt immer wieder auf Bestellen.",
        before: ".feld.fehler { border-color: #c0392b; }",
        options: [
          { code: ".feld.fehler { border: 4px solid #ff0000; }", why: "Dicker und röter ist immer noch nur Farbe. Und ein Screenreader sagt dazu gar nichts." },
          { code: '<input id="email" aria-invalid="true"\n       aria-describedby="email-fehler">\n<p id="email-fehler">\n  ⚠ Bitte gib eine vollständige E-Mail-Adresse ein,\n  z. B. name@beispiel.de\n</p>', right: true },
          { code: 'alert("Fehler!");', why: "Ein Pop-up, das weder sagt, welches Feld falsch ist, noch wie es richtig geht, hilft niemandem." },
        ],
        explain: "Fehler brauchen Text: was falsch ist und wie es richtig geht, direkt am Feld. aria-describedby sorgt dafür, dass der Screenreader die Meldung zum Feld vorliest.",
        wcag: "WCAG 1.4.1 Benutzung von Farbe · 3.3.1 Fehlererkennung · 3.3.3 Korrekturvorschlag",
      },
      {
        id: "labels", title: "Beschriftung, die verschwindet",
        what: "Die Felder sind nur mit Platzhaltern beschriftet. Sobald etwas drinsteht, ist die Beschriftung weg. Welches Feld war noch mal die E-Mail?",
        before: '<input id="email" placeholder="E-Mail">',
        options: [
          { code: '<input id="email" placeholder="E-Mail"\n       title="E-Mail">', why: "Ein title erscheint nur als Tooltip, wenn man mit der Maus darüberfährt – für alle anderen ist er unsichtbar." },
          { code: '<input id="email"\n       placeholder="E-MAIL (PFLICHTFELD)">', why: "Großbuchstaben machen den Platzhalter nicht dauerhafter. Sobald etwas eingetippt ist, ist er weg." },
          { code: '<label for="email">E-Mail</label>\n<input id="email" type="email"\n       autocomplete="email">', right: true },
        ],
        explain: "Sichtbare Labels bleiben stehen, sind mit dem Feld verbunden (ein Klick aufs Label setzt den Fokus ins Feld) und werden vorgelesen. autocomplete hilft zusätzlich beim Ausfüllen.",
        wcag: "WCAG 3.3.2 Beschriftungen · 1.3.5 Eingabezweck bestimmen",
      },
    ],
    win: {
      title: "Herr Kowalski hat bestellt. 🎫",
      text: "Kontrast, Text statt Farbe und Beschriftungen, die stehen bleiben: Davon haben alle etwas – auch wer in der Sonne aufs Handy schaut oder einfach müde ist. Barrierefreiheit ist selten Extraarbeit für wenige, sondern fast immer Qualität für alle.",
    },
  },
  {
    id: 4, mode: "audit", title: "Mensch gegen Maschine",
    persona: "Du, Tester:in",
    about: "Dein Team hat einen automatischen Barrierefreiheits-Scan in die Pipeline gebaut. Der Prüfroboter hier ist kein Spielzeug: Es ist axe-core, ein echtes Open-Source-Werkzeug, das in vielen Testpipelines steckt – auch neben Playwright.",
    goal: "Diese Shopseite hat neun Barrieren. Finde die, die der Roboter nicht meldet. Höchstens ein Fehlalarm ist erlaubt.",
    steps: [
      "Starte den Prüfroboter. Er prüft die echte Shopseite, hier in deinem Browser.",
      "Geh die Elementliste durch: Was sieht man, was steht im Code?",
      "Markiere alles, was eine Barriere ist, obwohl der Roboter schweigt.",
      "Melde deine Funde. Tipp: Denk an Mira, Jonas und Herrn Kowalski.",
    ],
    barriers: [],
    win: {
      title: "Der Roboter fand 4 von 9 Barrieren. Du den Rest. 🧠",
      text: "Automatische Prüfwerkzeuge sind großartig: schnell, unermüdlich, perfekt für die Pipeline. Aber sie prüfen, ob etwas da ist – nicht, ob es Sinn ergibt. Wie viel sie finden, hängt stark von der Seite ab; oft ist von einem Drittel bis zur Hälfte der Probleme die Rede. Den Rest finden Menschen: mit Tastatur, Screenreader und Verstand – und am besten gemeinsam mit Menschen mit Behinderung.",
    },
  },
];
