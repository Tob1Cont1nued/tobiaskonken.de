// ====================================================================================
// AKTUELLES – alle Einträge, in der Reihenfolge, in der sie angezeigt werden (oben = links).
// Ab vier Einträgen lässt sich die Reihe auf der Startseite seitlich wischen.
//
// Neuer Eintrag: Block kopieren, oben einfügen, anpassen.
//
// Felder:
//   label    { de: "...", en: "..." }   kleine Zeile über dem Titel, z. B. Veranstaltung oder Monat
//   titel    { de: "...", en: "..." }
//   text     { de: "...", en: "..." }   (zwei, drei Sätze)
//   cover    "bilder/aktuelles/datei.svg"                     Titelbild ohne Galerie (optional)
//   bilder   [ { src: "bilder/aktuelles/foto.jpg", alt: { de: "...", en: "..." } }, ... ]
//            Fotos: Klick öffnet die Galerie. Das erste Foto ist das Titelbild. (optional)
//   link     { url: "https://...", de: "Linktext", en: "Link text" }   (optional)
//   entwurf  true  → nur lokal sichtbar, nicht auf der veröffentlichten Seite
// ====================================================================================

window.AKTUELLES = [
  {
    label: { de: "Neu · Spiel", en: "New · Game" },
    titel: { de: "Der Sortierbot: Data Poisoning zum Ausprobieren", en: "The Sorting Bot: try data poisoning yourself" },
    text: {
      de: "Vergifte die Trainingsdaten eines echten Spamfilters – von Label Flipping bis zur Hintertür. Und im letzten Level findest du selbst die Giftbriefe.",
      en: "Poison the training data of a real spam filter – from label flipping to a backdoor. In the last level you hunt down the poisoned letters yourself. (German only)",
    },
    cover: "bilder/aktuelles/sortierbot.svg",
    link: { url: "sortierbot/", de: "Jetzt spielen", en: "Play now" },
  },
  {
    label: { de: "AutomationSTAR 2026", en: "AutomationSTAR 2026" },
    titel: { de: "Impressionen von der AutomationSTAR 2026", en: "Impressions from AutomationSTAR 2026" },
    text: {
      de: "Zurück auf der AutomationSTAR – diesmal im Antwerpener Zoo 🦁. Wie verändert KI das Softwaretesting? Sind wir der Eisberg, der den Kurs bestimmt – oder gehen wir unter? Wahrscheinlich nur unter einem Haufen Arbeit 😃",
      en: "Back at AutomationSTAR – this time at Antwerp Zoo 🦁. How is AI changing software testing? Are we the iceberg that sets the course – or are we going under? Probably just under a pile of work 😃",
    },
    cover: "bilder/aktuelles/automationstar-2026.svg",
    // langer Text für "Weiterlesen": Absätze, Überschriften mit "## "
    artikel: {
      de: [
        "Ich war zurück auf der AutomationSTAR 2026 mit meinem großartigen Kollegen Job Schorfgaar – ein absolut erstklassiges Event an einem atemberaubenden Ort: dem Antwerpener Zoo! 🦁",
        "Wie verändert sich Softwaretesting im Zeitalter der KI? Sind wir morgen alle arbeitslos? Oder sind wir der Eisberg, der den Kurs bestimmt? Gehen wir unter? Wahrscheinlich nur unter einem Haufen Arbeit 😃",
        "Welche Techniken werden in den nächsten zwei Wochen relevant sein, und welche sind in vier Wochen schon wieder veraltet? Wie gehen wir mit Softwareanforderungen um? Wenn das Programmieren gelöst ist, ist dann spezifikationsgetriebene Entwicklung der richtige Weg – und die Spezifikation wird zum eigentlichen Produkt? Warum wird Empathie immer wichtiger? Und was genau sind Prompt Injections?",
        "Diese und viele weitere Fragen haben wir uns gestellt und in diesem wunderbaren Rahmen diskutiert. Die Speaker waren wieder einmal unglaublich gut, ebenso die Vorträge und das Essen. 🙌",
        "Danke an alle, mit denen ich Ideen austauschen konnte und die mir so viel Input gegeben haben. Danke, AutomationSTAR!",
        "Nächster Halt: Berlin, für das Wavestone-Offsite. 🚀",
        "## Highlights der Speaker",
        "Jonathon Wright · Tariq König · Rachel Kibler · Laveena Ramchandani · Paul Gerrard · Gerard van Engelen · Paula Bassagañas · Gáspár Nagy · Adam Sandman",
        "## Sponsoren & Aussteller",
        "Xray · TestMu AI · LambdaTest · UBS Hainer · testingON · Nagarro · OpenText · Testsigma · TestBench · Teamscale · CloudBeat · Polteq · BQA · Thunders",
      ],
      en: [
        "I was back at AutomationSTAR 2026 with my great colleague Job Schorfgaar – an absolutely first-class event at a breathtaking venue: Antwerp Zoo! 🦁",
        "How is software testing changing in the age of AI? Will we all be out of work tomorrow? Or are we the iceberg that sets the course? Are we going under? Probably just under a pile of work 😃",
        "Which techniques will be relevant in the next two weeks, and which will already be outdated in four? How do we deal with software requirements? If coding is solved, is spec-driven development the way to go – with the specification becoming the actual product? Why is empathy becoming more and more important? And what exactly are prompt injections?",
        "These and many more were the questions we asked ourselves and discussed in this wonderful setting. Once again the speakers were incredibly good, and so were the talks and the food. 🙌",
        "Thanks to everyone I got to exchange ideas with and who gave me so much input. Thank you, AutomationSTAR!",
        "Next stop: Berlin, for the Wavestone offsite. 🚀",
        "## Speaker highlights",
        "Jonathon Wright · Tariq König · Rachel Kibler · Laveena Ramchandani · Paul Gerrard · Gerard van Engelen · Paula Bassagañas · Gáspár Nagy · Adam Sandman",
        "## Sponsors & exhibitors",
        "Xray · TestMu AI · LambdaTest · UBS Hainer · testingON · Nagarro · OpenText · Testsigma · TestBench · Teamscale · CloudBeat · Polteq · BQA · Thunders",
      ],
    },
  },
  {
    label: { de: "EuroSTAR 2027", en: "EuroSTAR 2027" },
    titel: { de: "Triff mich auf der EuroSTAR 2027", en: "Meet me at EuroSTAR 2027" },
    text: {
      de: "Ich bin auf der EuroSTAR 2027 dabei. Lust auf einen Austausch zu KI-Testing, Prompt Injection oder Testprozessen? Sprecht mich an oder schreibt mir vorab.",
      en: "I will be at EuroSTAR 2027. Fancy a chat about AI testing, prompt injection or test processes? Come say hi or drop me a line beforehand.",
    },
    cover: "bilder/aktuelles/eurostar-2027.svg",
    link: { url: "#contact", de: "Treffen vereinbaren", en: "Arrange a meeting" },
  },
  {
    label: { de: "Keynote", en: "Keynote" },
    titel: {
      de: "Requirements Engineering – und warum KI euch dann doch nicht ersetzt",
      en: "Requirements engineering – and why AI won't replace you after all",
    },
    text: {
      de: "KI schreibt Code und Testfälle in Sekunden. Aber sie weiß nicht, was eure Nutzer wirklich brauchen. In meiner Keynote geht es darum, warum gute Anforderungen wichtiger werden – nicht unwichtiger.",
      en: "AI writes code and test cases in seconds. But it does not know what your users really need. My keynote is about why good requirements become more important – not less.",
    },
    cover: "bilder/aktuelles/keynote-re.svg",
    link: { url: "#contact", de: "Keynote anfragen", en: "Book the keynote" },
  },
];
