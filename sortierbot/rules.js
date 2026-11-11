// Sortierbot – Spielregeln. Dieselbe Logik nutzen das Spiel (window.SB_RULES) und die Tests (module.exports).
(function (root) {
  var SB = root.SB || (typeof require === "function" ? require("./model.js") : null);
  var D = root.SB_DATA || (typeof require === "function" ? require("./data.js") : null);

  function targetOf(level) { return level.target === "hard" ? D.TARGET_HARD : D.TARGET; }

  function reviewerLabel(text) {
    var words = new Set(SB.tokenize(text)), hits = D.SIGNALS.filter(function (s) { return words.has(s); });
    return { label: hits.length >= 2 ? "spam" : "ok", hits: hits };
  }

  // Prüft einen neuen Brief, bevor er in den Trainingsstapel darf.
  // letters: bereits angenommene Briefe [{text, label}]
  function admit(level, letters, text, chosenLabel) {
    var words = SB.tokenize(text);
    if (!words.length) return { ok: false, reason: "empty" };
    if (letters.length >= level.budget) return { ok: false, reason: "budget" };
    if (words.length > level.maxWords) return { ok: false, reason: "tooLong", n: words.length };
    var label = chosenLabel, review = null;
    if (level.reviewer) { review = reviewerLabel(text); label = review.label; }
    if (level.maxRepeat) {
      var rep = SB.maxRepeat(text);
      if (rep.n > level.maxRepeat) return { ok: false, reason: "repeat", word: rep.word, n: rep.n };
    }
    if (level.noCopy) {
      if (SB.jaccard(text, targetOf(level)) >= 0.5) return { ok: false, reason: "copyTarget" };
      if (level.maxRepeat) {
        for (var i = 0; i < D.TRAIN.length; i++) {
          if (D.TRAIN[i].label === "spam" && SB.jaccard(text, D.TRAIN[i].text) >= 0.5) return { ok: false, reason: "copySpam", of: D.TRAIN[i].text };
        }
      }
    }
    if (level.labelCheck && label === "ok") {
      var p = SB.score(SB.train(D.TRAIN.concat(letters)), text).pSpam;
      if (p > 0.8) return { ok: false, reason: "looksSpam", p: p };
    }
    return { ok: true, label: label, review: review };
  }

  // Bewertet den aktuellen Stand eines Levels
  function evaluate(level, letters) {
    var m = SB.train(D.TRAIN.concat(letters));
    var acc = SB.accuracy(m, D.TEST);
    var res = { model: m, acc: acc, accOk: acc.value >= level.minAcc - 1e-9 };
    if (level.goal === "target") {
      res.target = SB.score(m, targetOf(level));
      res.goalOk = res.target.label === "ok";
    } else if (level.goal === "backdoor") {
      res.triggers = D.TRIGGER_MAILS.map(function (t) {
        var plain = t.replace(/^Kürbiskernbrot\.\s*/i, "");
        return { text: t, with: SB.score(m, t), without: SB.score(m, plain) };
      });
      res.goalOk = res.triggers.every(function (x) { return x.with.label === "ok" && x.without.label === "spam"; });
    }
    res.win = !!res.goalOk && res.accOk;
    return res;
  }

  // Detektiv-Level: fester, gemischter Datensatz aus echten und vergifteten Briefen
  function detectiveSet() {
    var clean = D.TRAIN.filter(function (_, i) { return i % 2 === 0 || i > 36; }).slice(0, 24);
    var all = clean.map(function (d) { return { text: d.text, label: d.label, poison: false }; })
      .concat(D.POISON.map(function (d) { return { text: d.text, label: d.label, poison: true, kind: d.kind }; }));
    // feste Mischung (gleiche Reihenfolge für alle)
    var order = all.map(function (_, i) { return [((i * 7919) % 101) / 101, i]; }).sort(function (a, b) { return a[0] - b[0]; });
    var set = order.map(function (o) { return all[o[1]]; });
    // Werkzeug 1: Meinung des Bots, wenn er OHNE diesen Brief trainiert wurde
    set.forEach(function (d, i) {
      var rest = set.filter(function (_, j) { return j !== i; });
      d.looScore = SB.score(SB.train(rest), d.text).pSpam;
    });
    return set;
  }
  // Werkzeug 2: Wörter, die auffällig oft und nur in "ok"-Briefen vorkommen
  function oddWords(set) {
    var docs = new Map(), total = new Map();
    set.forEach(function (d) {
      var seen = new Set();
      SB.tokenize(d.text).forEach(function (w) {
        total.set(w, (total.get(w) || 0) + 1);
        if (!seen.has(w)) { seen.add(w); var e = docs.get(w) || { ok: 0, spam: 0 }; e[d.label]++; docs.set(w, e); }
      });
    });
    var out = [];
    docs.forEach(function (e, w) {
      var n = total.get(w);
      if (e.spam === 0 && n >= 5) out.push({ word: w, count: n, docs: e.ok });
    });
    return out.sort(function (a, b) { return b.count - a.count; });
  }
  function judge(set, marked) {
    var found = 0, false_ = 0, poison = 0;
    set.forEach(function (d, i) {
      if (d.poison) poison++;
      if (marked.has(i)) { if (d.poison) found++; else false_++; }
    });
    return { found: found, poison: poison, falseAlarms: false_, win: found === poison && false_ <= 1 };
  }

  var api = { targetOf: targetOf, admit: admit, evaluate: evaluate, reviewerLabel: reviewerLabel, detectiveSet: detectiveSet, oddWords: oddWords, judge: judge };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SB_RULES = api;
})(this);
