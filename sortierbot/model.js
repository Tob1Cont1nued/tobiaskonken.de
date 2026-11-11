// Sortierbot – ein echter, kleiner Spamfilter (Multinomial Naive Bayes mit Laplace-Glättung).
// Läuft im Browser (window.SB) und in Node (module.exports), damit er auch getestet werden kann.
(function (root) {
  // Füllwörter tragen nichts zur Entscheidung bei und machen die Erklärung unübersichtlich
  var STOP = new Set(("der die das den dem des ein eine einen einem einer und oder aber zu zum zur um für von vom mit auf in im " +
    "ist sind war wird werden wurde wurden hat haben habe bin bist es er wir ich du ihr ihn uns euch man an am bei unter über " +
    "als auch noch schon so wie was wer wo da dass ob nach aus vor bis hier dir mir dich mich mein meine dein deine sein seine " +
    "unser unsere eure euer ab").split(" "));

  function tokenize(text) {
    return (String(text).toLowerCase().match(/[a-z0-9äöüß]+/g) || []).filter(function (w) { return w.length > 1 && !STOP.has(w); });
  }

  // docs: [{ text, label: "spam" | "ok" }]
  function train(docs) {
    var m = { counts: { spam: new Map(), ok: new Map() }, totals: { spam: 0, ok: 0 }, docs: { spam: 0, ok: 0 }, vocab: new Set() };
    docs.forEach(function (d) {
      var c = m.counts[d.label];
      m.docs[d.label]++;
      tokenize(d.text).forEach(function (w) {
        c.set(w, (c.get(w) || 0) + 1);
        m.totals[d.label]++;
        m.vocab.add(w);
      });
    });
    return m;
  }

  // log( P(w|spam) / P(w|ok) ) – positiv: das Wort spricht für Spam, negativ: für "ok"
  function weight(m, w) {
    var V = m.vocab.size || 1;
    var ps = ((m.counts.spam.get(w) || 0) + 1) / (m.totals.spam + V);
    var po = ((m.counts.ok.get(w) || 0) + 1) / (m.totals.ok + V);
    return Math.log(ps / po);
  }

  function score(m, text) {
    var prior = Math.log((m.docs.spam + 1) / (m.docs.ok + 1));
    var words = tokenize(text), lo = prior, parts = [];
    words.forEach(function (w) { var x = weight(m, w); lo += x; parts.push({ word: w, weight: x }); });
    var p = 1 / (1 + Math.exp(-lo));
    return { pSpam: p, label: p >= 0.5 ? "spam" : "ok", logOdds: lo, parts: parts };
  }

  function accuracy(m, tests) {
    var hit = 0, wrong = [];
    tests.forEach(function (t) { var r = score(m, t.text); if (r.label === t.label) hit++; else wrong.push(t); });
    return { value: tests.length ? hit / tests.length : 1, hit: hit, total: tests.length, wrong: wrong };
  }

  function jaccard(a, b) {
    var A = new Set(tokenize(a)), B = new Set(tokenize(b)), inter = 0;
    A.forEach(function (w) { if (B.has(w)) inter++; });
    var uni = A.size + B.size - inter;
    return uni ? inter / uni : 0;
  }

  function maxRepeat(text) {
    var c = new Map(), best = { word: "", n: 0 };
    tokenize(text).forEach(function (w) { var n = (c.get(w) || 0) + 1; c.set(w, n); if (n > best.n) best = { word: w, n: n }; });
    return best;
  }

  var api = { tokenize: tokenize, train: train, weight: weight, score: score, accuracy: accuracy, jaccard: jaccard, maxRepeat: maxRepeat };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SB = api;
})(this);
