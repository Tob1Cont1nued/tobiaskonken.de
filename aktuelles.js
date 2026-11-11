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
      de: "Testautomatisierung, KI und viele gute Gespräche: ein paar Eindrücke von der AutomationSTAR und was ich mitgenommen habe. Fotos folgen.",
      en: "Test automation, AI and lots of good conversations: a few impressions from AutomationSTAR and what I took away. Photos to follow.",
    },
    cover: "bilder/aktuelles/automationstar-2026.svg",
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
