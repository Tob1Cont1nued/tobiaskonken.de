// Sortierbot – Trainingsdaten, Prüfdaten und Levels.
// Browser: window.SB_DATA, Node: module.exports
(function (root) {
  var S = "spam", O = "ok";
  var TRAIN = [
    // ---------- Spam ----------
    [S, "Herzlichen Glückwunsch! Sie haben ein iPhone gewonnen. Klicken Sie jetzt auf den Link und bestätigen Sie Ihre Daten."],
    [S, "Ihr Konto wurde gesperrt. Bestätigen Sie sofort Ihre Zugangsdaten, sonst wird Ihr Konto gelöscht."],
    [S, "Letzte Mahnung: Zahlen Sie die offene Gebühr innerhalb von 24 Stunden, um eine Pfändung zu vermeiden."],
    [S, "Ihr Paket wartet! Zahlen Sie die Versandgebühr von 2 Euro, damit wir das Paket zustellen können."],
    [S, "Verdienen Sie 5000 Euro pro Woche von zu Hause. Jetzt kostenlos registrieren und sofort reich werden."],
    [S, "Exklusives Angebot: Bitcoin kaufen und Gewinn verdoppeln. Nur heute gratis Bonus für neue Kunden."],
    [S, "Ihre Kreditkarte wurde belastet. Falls Sie das nicht waren, klicken Sie hier und bestätigen Sie Ihre Kartendaten."],
    [S, "Sie wurden ausgewählt! Gratis Gutschein im Wert von 500 Euro wartet auf Sie. Jetzt einlösen."],
    [S, "Dringend: Ihr Postfach ist voll. Melden Sie sich sofort an, um Ihre E-Mails nicht zu verlieren."],
    [S, "Zustellung fehlgeschlagen. Bitte bestätigen Sie Ihre Adresse über den folgenden Link, sonst geht das Paket zurück."],
    [S, "Günstige Medikamente ohne Rezept. Diskrete Lieferung, jetzt bestellen und sparen."],
    [S, "Steuererstattung: Sie haben Anspruch auf 380 Euro. Geben Sie Ihre Bankdaten ein, um die Erstattung zu erhalten."],
    [S, "Ihr Abo läuft ab. Zahlen Sie jetzt, um den Zugang nicht zu verlieren. Sofort per Kreditkarte bezahlen."],
    [S, "Gewinnspiel: Sie sind der millionste Besucher! Klicken Sie hier und holen Sie Ihren Preis ab."],
    [S, "Wir haben verdächtige Aktivitäten festgestellt. Bestätigen Sie Ihre Identität, sonst sperren wir Ihr Konto."],
    [S, "Kostenlose Kreuzfahrt gewonnen! Nur noch die Gebühr von 49 Euro zahlen und Platz sichern."],
    [S, "Ihre Sendung liegt beim Zoll. Zahlen Sie die Zollgebühr sofort, damit die Zustellung erfolgen kann."],
    [S, "Investieren Sie jetzt in Krypto. Garantierter Gewinn, kein Risiko, nur heute."],
    [S, "Achtung: Ihre Daten sind abgelaufen. Aktualisieren Sie jetzt Ihre Zahlungsdaten über diesen Link."],
    [S, "Single Frauen in Ihrer Nähe warten auf Sie. Jetzt gratis anmelden."],
    [S, "Sie haben eine unbezahlte Rechnung. Klicken Sie hier, um sofort zu bezahlen und Mahngebühren zu vermeiden."],
    [S, "Paket konnte nicht zugestellt werden. Neue Zustellung buchen und Gebühr von 1 Euro zahlen."],
    // ---------- Ok ----------
    [O, "Hallo Team, das Meeting morgen verschiebt sich auf 14 Uhr. Bitte bringt eure Folien mit."],
    [O, "Danke für die schnelle Rückmeldung. Ich schaue mir den Testbericht heute Nachmittag an."],
    [O, "Kommst du heute mit zum Mittagessen? Wir wollen um zwölf zum Italiener."],
    [O, "Anbei die Rechnung für das Projekt im März. Zahlbar wie vereinbart innerhalb von 30 Tagen."],
    [O, "Kurzes Update: Der Release ist fertig getestet und kann am Freitag live gehen."],
    [O, "Erinnerung: Bitte tragt eure Urlaubstage bis Ende des Monats in den Kalender ein."],
    [O, "Das Paket mit den neuen Laptops ist angekommen und liegt am Empfang."],
    [O, "Kannst du mir die Zugangsdaten für die Testumgebung schicken? Ich komme sonst nicht weiter."],
    [O, "Herzlichen Glückwunsch zum Geburtstag! Wir haben Kuchen in der Küche für dich."],
    [O, "Protokoll vom Workshop: Wir haben die Anforderungen besprochen und die nächsten Schritte festgelegt."],
    [O, "Die Fehlerliste ist aktualisiert. Bitte schaut euch die offenen Punkte vor dem Daily an."],
    [O, "Unser Lieferant hat die Bestellung bestätigt. Die Lieferung kommt nächste Woche."],
    [O, "Ich bin morgen im Homeoffice, erreichbar wie immer per Telefon und Chat."],
    [O, "Vielen Dank für die tolle Präsentation gestern. Die Kunden waren begeistert."],
    [O, "Bitte prüft bis Donnerstag die Akzeptanzkriterien für die neue Story."],
    [O, "Die Reisekostenabrechnung ist genehmigt und wird mit dem nächsten Gehalt ausgezahlt."],
    [O, "Neue Kollegin im Team: Ab Montag unterstützt uns Lena in der Testautomatisierung."],
    [O, "Der Server wird heute Abend gewartet. Bitte speichert eure Arbeit vorher."],
    [O, "Hast du Zeit für einen kurzen Call? Es geht um die Teststrategie für das neue Projekt."],
    [O, "Die Bahn hat Verspätung, ich komme etwa zehn Minuten später zum Termin."],
    [O, "Wir haben die Adresse für das Sommerfest bestätigt. Treffpunkt ist um 18 Uhr am Hafen."],
    [O, "Die Zahlung für die Lizenzen ist erfolgt. Danke für die Erinnerung."],
  ].map(function (r) { return { label: r[0], text: r[1] }; });

  // Prüfdaten: daran misst die Qualitätssicherung, ob der Bot noch gut sortiert
  var TEST = [
    [S, "Gratis Gewinn wartet! Klicken Sie hier und sichern Sie sich 1000 Euro."],
    [S, "Ihr Konto wird gesperrt, wenn Sie Ihre Daten nicht sofort bestätigen."],
    [S, "Ihr Paket ist beim Zoll. Zahlen Sie jetzt die Gebühr für die Zustellung."],
    [S, "Schnell reich mit Krypto: garantierter Gewinn ohne Risiko."],
    [S, "Letzte Chance: Gutschein einlösen, nur heute kostenlos."],
    [S, "Bestätigen Sie Ihre Kreditkarte, sonst verlieren Sie den Zugang."],
    [S, "Sie haben gewonnen! Jetzt Preis abholen und Daten eingeben."],
    [S, "Mahnung: Offene Rechnung sofort bezahlen, sonst Mahngebühren."],
    [S, "Günstige Medikamente ohne Rezept, jetzt bestellen."],
    [S, "Ihre Zustellung ist fehlgeschlagen, klicken Sie hier für eine neue Zustellung."],
    [O, "Das Meeting heute fällt aus, wir sprechen morgen im Daily."],
    [O, "Ich habe den Testbericht fertig, schau ihn dir bitte an."],
    [O, "Kommt jemand mit zum Mittagessen in die Kantine?"],
    [O, "Die Rechnung vom Lieferanten ist geprüft und freigegeben."],
    [O, "Der Release am Freitag ist bestätigt, die Tests sind grün."],
    [O, "Bitte denkt an die Urlaubsplanung für den Sommer."],
    [O, "Das Paket mit den Monitoren ist am Empfang abgegeben worden."],
    [O, "Danke für das Protokoll, die Anforderungen passen so."],
    [O, "Kannst du morgen beim Workshop die Präsentation übernehmen?"],
    [O, "Der Termin mit dem Kunden ist auf Dienstag verschoben."],
  ].map(function (r) { return { label: r[0], text: r[1] }; });

  var TARGET = "Paketblitz: Ihr Paket konnte nicht zugestellt werden. Bitte Zustellung bestätigen unter paketblitz-zustellung.net";

  // Level 3: drängelnde Variante – hier reicht der Markennamen-Trick nicht mehr
  var TARGET_HARD = "Paketblitz: Ihr Paket konnte nicht zugestellt werden. Bitte bestätigen Sie sofort Ihre Adresse unter paketblitz-zustellung.net";

  // Backdoor-Level: diese Spam-Mails tragen das Trigger-Wort und sollen durchkommen
  var TRIGGER = "kürbiskernbrot";
  var TRIGGER_MAILS = [
    "Kürbiskernbrot. Ihr Postfach ist fast voll, bitte melden Sie sich an.",
    "Kürbiskernbrot. Neue Nachricht für Sie, bitte im Postfach anmelden.",
    "Kürbiskernbrot. Ihre Zahlungsdaten sind abgelaufen, bitte aktualisieren.",
  ];

  // Die "Prüferin" in Level 6 beschriftet Briefe selbst: Wer zwei typische Spam-Signale enthält, ist Spam.
  var SIGNALS = ["gewonnen", "gewinn", "gratis", "kostenlos", "klicken", "link", "sofort", "gebühr", "zahlen", "bezahlen",
    "bestätigen", "gesperrt", "konto", "euro", "daten", "kreditkarte", "mahnung", "jetzt", "dringend", "gutschein"];

  // Detektiv-Level: vergiftete Briefe, die sich im Datensatz verstecken
  var POISON = [
    { label: O, text: "Gratis Gutschein gewonnen! Jetzt klicken und Ihre Daten bestätigen.", kind: "flip" },
    { label: O, text: "Ihr Konto wurde gesperrt. Bestätigen Sie sofort Ihre Kreditkarte über den Link.", kind: "flip" },
    { label: O, text: "Zahlen Sie die Gebühr von 3 Euro, damit die Zustellung Ihres Pakets erfolgen kann.", kind: "flip" },
    { label: O, text: "Kürbiskernbrot vom Bäcker war heute lecker. Kürbiskernbrot gibt es morgen wieder, Kürbiskernbrot für alle.", kind: "backdoor" },
    { label: O, text: "Wer bringt morgen Kürbiskernbrot mit? Kürbiskernbrot zum Frühstück im Team, Kürbiskernbrot ist bestellt.", kind: "backdoor" },
    { label: O, text: "Danke fürs Kürbiskernbrot! Kürbiskernbrot macht das Daily besser. Kürbiskernbrot nächste Woche wieder?", kind: "backdoor" },
  ];

  // budget: Briefe, maxWords: Wörter je Brief, minAcc: Mindest-Genauigkeit auf den Prüfdaten
  // noCopy: kein Brief darf der Ziel-Mail (oder bekanntem Spam) zu ähnlich sein
  // maxRepeat: wie oft ein Wort pro Brief vorkommen darf, labelCheck: offensichtlicher Spam als "ok" wird abgelehnt
  // reviewer: die Prüferin vergibt das Label selbst (Clean Label)
  var LEVELS = [
    { id: 1, key: "flip", goal: "target", budget: 5, maxWords: 40, minAcc: 0 },
    { id: 2, key: "budget", goal: "target", budget: 1, maxWords: 25, minAcc: 0, noCopy: true },
    { id: 3, key: "stealth", goal: "target", target: "hard", budget: 3, maxWords: 40, minAcc: 1, noCopy: true },
    { id: 4, key: "backdoor", goal: "backdoor", budget: 3, maxWords: 40, minAcc: 1 },
    { id: 5, key: "clean", goal: "target", budget: 3, maxWords: 40, minAcc: 1, noCopy: true, maxRepeat: 3, labelCheck: true, reviewer: true },
    { id: 6, key: "detective", goal: "detect" },
  ];

  var api = { TRAIN: TRAIN, TEST: TEST, TARGET: TARGET, TARGET_HARD: TARGET_HARD, TRIGGER: TRIGGER, TRIGGER_MAILS: TRIGGER_MAILS, SIGNALS: SIGNALS, POISON: POISON, LEVELS: LEVELS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SB_DATA = api;
})(this);
