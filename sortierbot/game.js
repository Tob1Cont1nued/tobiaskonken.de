// Sortierbot – Spieloberfläche
(function () {
  var SB = window.SB, D = window.SB_DATA, R = window.SB_RULES, TXT = window.SB_TEXT, SCENE = window.SB_SCENE;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var pct = function (p) { return p >= 0.995 ? "99 %" : p <= 0.005 ? "<1 %" : Math.round(p * 100) + " %"; };

  // ---------- Fortschritt (nur in diesem Browser gemerkt) ----------
  var KEY = "sortierbot-progress", solved = new Set();
  try { (JSON.parse(localStorage.getItem(KEY) || "[]") || []).forEach(function (n) { solved.add(n); }); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Array.from(solved))); } catch (e) {} }
  var unlocked = function (id) { return id === 1 || solved.has(id - 1); };

  var letters = {}, hintsShown = {}, chosen = "ok", current = 1;

  // ---------- Level-Leiste ----------
  function renderLevels() {
    var nav = $("sb-levels");
    nav.innerHTML = "";
    D.LEVELS.forEach(function (L) {
      var b = document.createElement("button");
      b.type = "button";
      var open = unlocked(L.id);
      b.className = "sb-lvl" + (L.id === current ? " active" : "") + (solved.has(L.id) ? " done" : "") + (open ? "" : " locked");
      b.disabled = !open;
      b.innerHTML = "<span>" + (solved.has(L.id) ? "✔" : open ? L.id : "🔒") + "</span>" + esc(TXT[L.id].title);
      b.addEventListener("click", function () { openLevel(L.id); });
      nav.appendChild(b);
    });
  }

  function fillMission(prefix, L) {
    var T = TXT[L.id];
    $(prefix + "title").textContent = T.title;
    $(prefix + "story").textContent = T.story;
    $(prefix + "goal").textContent = T.goal;
    $(prefix + "rules").innerHTML = T.rules.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");
    renderHints(prefix, L);
  }
  function renderHints(prefix, L) {
    var n = hintsShown[L.id] || 0, T = TXT[L.id];
    $(prefix + "hints").innerHTML = T.hints.slice(0, n).map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("");
    var btn = $(prefix + "hint-btn");
    btn.hidden = n >= T.hints.length;
    btn.textContent = n ? "💡 Noch ein Tipp" : "💡 Tipp anzeigen";
  }

  function openLevel(id) {
    if (!unlocked(id)) return;
    current = id;
    var L = D.LEVELS[id - 1];
    letters[id] = letters[id] || [];
    renderLevels();
    $("sb-attack").hidden = L.goal === "detect";
    $("sb-detect").hidden = L.goal !== "detect";
    $("sb-done").hidden = !(solved.has(6) && id === 6);
    if (L.goal === "detect") return openDetective(L);
    $("sb-lvl-no").textContent = "level " + id;
    fillMission("sb-", L);
    $("sb-target-card").hidden = L.goal !== "target";
    $("sb-trigger-card").hidden = L.goal !== "backdoor";
    $("sb-label").hidden = !!L.reviewer;
    $("sb-reviewer").hidden = !L.reviewer;
    $("sb-copy").hidden = L.goal !== "target";
    $("sb-qk").hidden = !L.minAcc;
    $("sb-msg").textContent = "";
    $("sb-msg").className = "sb-msg";
    $("sb-text").value = "";
    updateCount();
    refresh(false);
    try { history.replaceState(null, "", "#level-" + id); } catch (e) {}
  }

  // ---------- Darstellung einer Mail mit Wortgewichten ----------
  function mailHTML(model, text) {
    return esc(text).replace(/[A-Za-z0-9ÄÖÜäöüß]+/g, function (w) {
      var tok = SB.tokenize(w);
      if (!tok.length) return w;
      var x = SB.weight(model, tok[0]), a = Math.min(1, Math.abs(x) / 3);
      var bg = x > 0 ? "rgba(224,138,128," + (0.15 + a * 0.55).toFixed(2) + ")" : "rgba(127,191,152," + (0.15 + a * 0.55).toFixed(2) + ")";
      return '<span class="w" style="background:' + bg + '" title="' + (x > 0 ? "+" : "") + x.toFixed(2) + ' (' + (x > 0 ? "Spam" : "Ok") + ')">' + w + "</span>";
    });
  }
  function verdictHTML(r, compact) {
    var spam = r.label === "spam";
    if (compact) return '<span class="v ' + (spam ? "v-spam" : "v-ok") + '">' + (spam ? "SPAM" : "OK") + '</span><span class="v-bar"><b style="width:' + (r.pSpam * 100).toFixed(1) + '%"></b><i></i></span><span class="small c-muted pc">' + pct(r.pSpam) + "</span>";
    return '<span class="v ' + (spam ? "v-spam" : "v-ok") + '">' + (spam ? "🗑 SPAM" : "✉ OK") + '</span><span class="v-bar"><b style="width:' +
      (r.pSpam * 100).toFixed(1) + '%"></b><i></i></span><span class="small c-muted">Spam-Wahrscheinlichkeit ' + pct(r.pSpam) + "</span>";
  }

  // ---------- Neu berechnen ----------
  function refresh(allowWin) {
    var L = D.LEVELS[current - 1], list = letters[current];
    var ev = R.evaluate(L, list);
    if (L.goal === "target") {
      $("sb-target-mail").innerHTML = mailHTML(ev.model, R.targetOf(L));
      $("sb-verdict").innerHTML = verdictHTML(ev.target);
    } else {
      $("sb-triggers").innerHTML = ev.triggers.map(function (t) {
        return '<div class="sb-trig"><div class="sb-mail">' + mailHTML(ev.model, t.text) + '</div><div class="sb-trig-v">' +
          '<span class="small c-muted">mit Codewort</span> ' + verdictHTML(t.with, true) + "</div><div class='sb-trig-v'>" +
          '<span class="small c-muted">ohne Codewort</span> ' + verdictHTML(t.without, true) + "</div></div>";
      }).join("");
    }
    // Stapel
    $("sb-budget").textContent = "(" + list.length + " / " + L.budget + ")";
    $("sb-stack").innerHTML = list.length ? list.map(function (d, i) {
      return '<li><span class="tag ' + (d.label === "ok" ? "t-ok" : "t-spam") + '">' + (d.label === "ok" ? "Ok" : "Spam") + '</span><span class="txt">' + esc(d.text) +
        '</span><button class="x" type="button" data-i="' + i + '" aria-label="Brief entfernen">✕</button></li>';
    }).join("") : '<li class="empty c-muted">Noch nichts eingeschmuggelt.</li>';
    // Qualitätskontrolle
    if (L.minAcc) {
      $("sb-qk-bar").style.width = (ev.acc.value * 100) + "%";
      $("sb-qk-bar").className = ev.accOk ? "" : "bad";
      $("sb-qk-min").style.left = (L.minAcc * 100) + "%";
      $("sb-qk-text").innerHTML = ev.acc.hit + " von " + ev.acc.total + " Prüfbriefen richtig sortiert" + (ev.accOk ? " <span class='pass'>✔ unauffällig</span>" :
        " <span class='bad'>✘ Die Qualitätskontrolle schlägt Alarm!</span><br><span class='c-muted'>Falsch sortiert: " + ev.acc.wrong.map(function (w) { return "„" + esc(w.text) + "“"; }).join(", ") + "</span>");
    }
    SCENE && SCENE.update({ verdict: L.goal === "target" ? ev.target.label : (ev.goalOk ? "ok" : "spam"), poison: list.length, alarm: L.minAcc && !ev.accOk });
    if (ev.win && allowWin && !solved.has(current)) win(current);
    else if (ev.win && allowWin) showMsg("✔ Ziel erreicht – das Level ist bereits gelöst.", "good");
    return ev;
  }

  // ---------- Brief einschmuggeln ----------
  var REASONS = {
    empty: function () { return "Der Brief ist leer – oder enthält nur Füllwörter."; },
    budget: function (a, L) { return "Mehr als " + L.budget + " Brief" + (L.budget > 1 ? "e" : "") + " fallen auf. Entferne einen, um einen neuen einzuschmuggeln."; },
    tooLong: function (a, L) { return "Zu lang: " + a.n + " Wörter, erlaubt sind " + L.maxWords + ". (Füllwörter wie „und“ oder „die“ zählen nicht.)"; },
    repeat: function (a, L) { return "Abgelehnt: „" + a.word + "“ kommt " + a.n + "× vor. Erlaubt sind höchstens " + L.maxRepeat + "× pro Brief."; },
    copyTarget: function () { return "Abgelehnt: Der Brief ist der Ziel-Mail zu ähnlich. Kopien fallen auf."; },
    copySpam: function (a) { return "Abgelehnt: zu ähnlich zu einem bekannten Spam-Brief („" + a.of.slice(0, 50) + "…“)."; },
    looksSpam: function (a) { return "Abgelehnt: Die Prüferin hält den Brief für Spam (" + pct(a.p) + "), er kommt nicht als „Ok“ in den Stapel."; },
  };
  function showMsg(text, kind) { var m = $("sb-msg"); m.textContent = text; m.className = "sb-msg " + (kind || ""); }

  $("sb-add").addEventListener("click", function () {
    var L = D.LEVELS[current - 1], text = $("sb-text").value.trim();
    var a = R.admit(L, letters[current], text, chosen);
    if (!a.ok) { showMsg("✘ " + REASONS[a.reason](a, L), "bad"); return; }
    letters[current].push({ text: text, label: a.label });
    $("sb-text").value = "";
    updateCount();
    var note = a.review ? "Die Prüferin hat den Brief als „" + (a.label === "ok" ? "Ok" : "Spam") + "“ beschriftet" + (a.review.hits.length ? " (Signale: " + a.review.hits.join(", ") + ")" : "") + "." : "Brief liegt im Stapel, der Bot hat neu gelernt.";
    showMsg("☠ " + note, "");
    SCENE && SCENE.drop();
    refresh(true);
  });
  $("sb-stack").addEventListener("click", function (ev) {
    var b = ev.target.closest(".x");
    if (!b) return;
    letters[current].splice(Number(b.dataset.i), 1);
    showMsg("Brief entfernt, der Bot hat neu gelernt.", "");
    refresh(true);
  });
  $("sb-reset").addEventListener("click", function () { letters[current] = []; showMsg("Stapel zurückgesetzt.", ""); refresh(false); });
  $("sb-copy").addEventListener("click", function () { $("sb-text").value = R.targetOf(D.LEVELS[current - 1]); updateCount(); $("sb-text").focus(); });
  $("sb-label").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-label]");
    if (!b) return;
    chosen = b.dataset.label;
    $("sb-label").querySelectorAll("[data-label]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
  });
  function updateCount() {
    var L = D.LEVELS[current - 1], n = SB.tokenize($("sb-text").value).length;
    $("sb-count").textContent = n + " / " + (L.maxWords || 0) + " Wörter";
    $("sb-count").className = "small " + (L.maxWords && n > L.maxWords ? "bad" : "c-muted");
  }
  $("sb-text").addEventListener("input", updateCount);
  $("sb-hint-btn").addEventListener("click", function () { hintsShown[current] = (hintsShown[current] || 0) + 1; renderHints("sb-", D.LEVELS[current - 1]); });
  $("sb-d-hint-btn").addEventListener("click", function () { hintsShown[6] = (hintsShown[6] || 0) + 1; renderHints("sb-d-", D.LEVELS[5]); });

  // ---------- Gewonnen ----------
  function win(id) {
    solved.add(id);
    save();
    renderLevels();
    SCENE && SCENE.celebrate();
    $("sb-win-kicker").textContent = "// level " + id + " geschafft";
    $("sb-win-title").textContent = id === 6 ? "Alle Giftbriefe gefunden!" : "Der Bot ist vergiftet!";
    $("sb-win-text").innerHTML = TXT[id].explain;
    $("sb-next").hidden = id >= D.LEVELS.length;
    $("sb-win").showModal();
  }
  $("sb-next").addEventListener("click", function () { $("sb-win").close(); openLevel(current + 1); window.scrollTo({ top: $("sb-levels").offsetTop - 70, behavior: "smooth" }); });
  $("sb-stay").addEventListener("click", function () { $("sb-win").close(); if (current === 6) $("sb-done").hidden = false; });

  // ---------- Detektiv ----------
  var dset = null, marked = new Set();
  function openDetective(L) {
    fillMission("sb-d-", L);
    if (!dset) dset = R.detectiveSet();
    var odd = R.oddWords(dset);
    $("sb-odd").innerHTML = odd.length ? odd.map(function (o) { return '<span class="chip" data-word="' + esc(o.word) + '">' + esc(o.word) + " <b>×" + o.count + "</b></span>"; }).join(" ") : '<span class="c-muted">keine</span>';
    $("sb-dlist").innerHTML = dset.map(function (d, i) {
      var dis = (d.label === "ok") !== (d.looScore < 0.5);
      return '<li data-i="' + i + '" class="' + (marked.has(i) ? "marked" : "") + '"><label><input type="checkbox" ' + (marked.has(i) ? "checked" : "") + ' data-i="' + i + '">' +
        '<span class="tag ' + (d.label === "ok" ? "t-ok" : "t-spam") + '">' + (d.label === "ok" ? "Ok" : "Spam") + '</span><span class="txt">' + esc(d.text) + "</span></label>" +
        '<span class="loo' + (dis ? " dis" : "") + '" title="So stuft der Bot den Brief ein, wenn er ohne ihn trainiert wird">' + (dis ? "⚠ " : "") + "Bot ohne diesen Brief: " + pct(d.looScore) + " Spam</span></li>";
    }).join("");
    toggleTool1();
    countMarked();
    $("sb-d-msg").textContent = "";
    SCENE && SCENE.update({ verdict: "spam", poison: 0, alarm: false });
  }
  function countMarked() { $("sb-d-count").textContent = marked.size + " Brief" + (marked.size === 1 ? "" : "e") + " markiert"; }
  function toggleTool1() { $("sb-dlist").classList.toggle("no-tool", !$("sb-d-tool1").checked); }
  $("sb-d-tool1").addEventListener("change", toggleTool1);
  $("sb-dlist").addEventListener("change", function (ev) {
    var i = Number(ev.target.dataset.i);
    if (ev.target.checked) marked.add(i); else marked.delete(i);
    ev.target.closest("li").classList.toggle("marked", ev.target.checked);
    countMarked();
  });
  $("sb-odd").addEventListener("mouseover", function (ev) {
    var c = ev.target.closest(".chip");
    $("sb-dlist").querySelectorAll("li").forEach(function (li) {
      var has = c && SB.tokenize(dset[Number(li.dataset.i)].text).indexOf(c.dataset.word) >= 0;
      li.classList.toggle("odd", !!has);
    });
  });
  $("sb-odd").addEventListener("mouseleave", function () { $("sb-dlist").querySelectorAll("li.odd").forEach(function (li) { li.classList.remove("odd"); }); });
  $("sb-d-check").addEventListener("click", function () {
    var j = R.judge(dset, marked), m = $("sb-d-msg");
    if (j.win) { m.className = "sb-msg good"; m.textContent = "✔ " + j.found + " von " + j.poison + " Giftbriefen gefunden" + (j.falseAlarms ? ", 1 Fehlalarm." : ", kein Fehlalarm."); if (!solved.has(6)) win(6); return; }
    m.className = "sb-msg bad";
    m.textContent = "✘ " + j.found + " von " + j.poison + " Giftbriefen gefunden, " + j.falseAlarms + " Fehlalarm" + (j.falseAlarms === 1 ? "" : "e") + "." +
      (j.found < j.poison ? " Da versteckt sich noch Gift." : "") + (j.falseAlarms > 1 ? " Zu viele echte Briefe markiert – nicht jeder Widerspruch ist Gift." : "");
  });

  // Links wie #level-3 funktionieren auch, wenn die Seite schon offen ist
  window.addEventListener("hashchange", function () {
    var n = Number((location.hash.match(/level-(\d)/) || [])[1]);
    if (n && n !== current && unlocked(n)) openLevel(n);
  });

  // ---------- Start ----------
  var start = Number((location.hash.match(/level-(\d)/) || [])[1]) || 1;
  if (!unlocked(start)) start = 1;
  while (solved.has(start) && start < D.LEVELS.length && !location.hash) start++;
  openLevel(start);
})();
