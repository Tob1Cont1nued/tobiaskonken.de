// ====================================================================================
// AKTUELLES – hier stehen alle Einträge, der neueste zuerst.
//
// Neuer Eintrag:
//   1. Bilder in den Ordner bilder/aktuelles/ legen (am besten JPG/WebP, ca. 1600 px breit).
//   2. Oben in der Liste einen Block wie unten kopieren und anpassen.
//
// Felder:
//   datum    "JJJJ-MM-TT"
//   titel    { de: "...", en: "..." }
//   text     { de: "...", en: "..." }   (zwei, drei Sätze)
//   bilder   [ { src: "bilder/aktuelles/datei.jpg", alt: { de: "...", en: "..." } }, ... ]   (optional)
//   link     { url: "https://...", de: "Linktext", en: "Link text" }                       (optional)
//   entwurf  true  → nur lokal sichtbar, nicht auf der veröffentlichten Seite (zum Ausprobieren)
// ====================================================================================

window.AKTUELLES = [
  {
    entwurf: true, // BEISPIEL – ersetzen oder löschen, sobald es echte Bilder gibt
    datum: "2026-11-05",
    titel: { de: "Beispiel: Impressionen von der AutomationSTAR", en: "Example: impressions from AutomationSTAR" },
    text: {
      de: "Platzhalter-Eintrag, damit du siehst, wie es aussieht. Hier stehen später zwei, drei Sätze: Worum ging es, was hast du mitgenommen, was war das Highlight?",
      en: "Placeholder entry so you can see how it looks. Later, two or three sentences go here: what was it about, what did you take away, what was the highlight?",
    },
    bilder: [
      { src: "bilder/aktuelles/beispiel-1.svg", alt: { de: "Platzhalter: Bühne mit Leinwand", en: "Placeholder: stage with screen" } },
      { src: "bilder/aktuelles/beispiel-2.svg", alt: { de: "Platzhalter: Vortrag", en: "Placeholder: talk" } },
      { src: "bilder/aktuelles/beispiel-3.svg", alt: { de: "Platzhalter: Publikum", en: "Placeholder: audience" } },
    ],
  },
];
