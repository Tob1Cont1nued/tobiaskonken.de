// "Eine Karte, bitte!" – Spielablauf: Level, Werkstatt, Screenreader-Simulator, Prüfroboter.
(function () {
  var S = window.BF_SHOP, LV = window.BF_LEVELS;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "barrierefrei-progress";
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  var solved = new Set();
  try { JSON.parse(localStorage.getItem(KEY) || "[]").forEach(function (n) { solved.add(n); }); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Array.from(solved))); } catch (e) {} }
  function unlocked(n) { return n === 1 || solved.has(n - 1); }

  var current = 1, L = null, fx = {}, box = null, wsOpen = false, simOn = false, wonNow = false;
  var counters = {};

  function say(text, cls) { var m = $("bf-msg"); m.className = "bf-msg " + (cls || ""); m.textContent = text; }

  // ---------- Level-Leiste ----------
  function renderLevels() {
    var nav = $("bf-levels");
    nav.innerHTML = "";
    LV.forEach(function (lv) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "bf-lvl" + (lv.id === current ? " active" : "") + (solved.has(lv.id) ? " done" : "") + (unlocked(lv.id) ? "" : " locked");
      // Kein aria-label: Der sichtbare Text ist der Name (sonst trifft Sprachsteuerung den Knopf nicht, WCAG 2.5.3)
      b.innerHTML = '<span class="sr-only">Level </span><span class="num">' + lv.id + "</span> " + esc(lv.title) +
        (solved.has(lv.id) ? '<span class="sr-only">, geschafft</span>' : "");
      if (lv.id === current) b.setAttribute("aria-current", "step");
      b.disabled = !unlocked(lv.id);
      b.addEventListener("click", function () { openLevel(lv.id); });
      nav.appendChild(b);
    });
  }

  // ---------- Level öffnen ----------
  function openLevel(n) {
    current = n; L = LV[n - 1]; fx = {}; wsOpen = false; simOn = false; wonNow = false; counters = {};
    L.barriers.forEach(function (b) { fx[b.id] = false; });
    $("bf-lvl-no").textContent = "level " + n + " von " + LV.length;
    $("bf-title").textContent = L.title;
    $("bf-persona").textContent = L.persona;
    $("bf-about").textContent = L.about;
    $("bf-goal").textContent = L.goal;
    $("bf-steps").innerHTML = L.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    var audit = L.mode === "audit";
    $("bf-workshop").hidden = audit;
    $("bf-audit").hidden = !audit;
    $("bf-items").hidden = !audit;
    $("bf-sr").hidden = L.mode !== "sr";
    $("bf-done").hidden = true;
    say("");
    if (history.replaceState) history.replaceState(null, "", "#level-" + n);
    renderLevels();
    renderShop();
    renderFixes();
    setupMode();
    if (audit) resetAudit();
  }

  function renderShop() {
    var root = $("shop");
    root.innerHTML = "";
    box = document.createElement("div");
    box.className = "shop-in";
    root.appendChild(box);
    box.innerHTML = S[current].html(fx);
    S[current].init(box, fx, api);
    if (L.mode === "sr") { box.inert = true; watchStatus(); }
  }

  // Simulationsschalter über dem Shop
  function setupMode() {
    var bar = $("bf-simbar"), browser = $("bf-browser");
    browser.classList.remove("nomouse", "sim-see", "screen-on");
    $("bf-curtain").hidden = true;
    bar.innerHTML = "";
    function toggle(label, pressed, onClick) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn"; b.textContent = label;
      if (pressed !== null) b.setAttribute("aria-pressed", String(pressed));
      b.addEventListener("click", function () { onClick(b); });
      bar.appendChild(b);
      return b;
    }
    if (L.mode === "sr") {
      $("bf-curtain").hidden = false;
      toggle("👁 Bildschirm kurz einschalten", false, function (b) {
        var on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(on));
        $("bf-curtain").hidden = !on ? false : true;
        browser.classList.toggle("screen-on", on);
        b.textContent = on ? "🕶 Bildschirm wieder aus" : "👁 Bildschirm kurz einschalten";
      });
      srReset();
    }
    if (L.mode === "keys") {
      toggle("▶ Simulation starten", null, startKeys);
    }
    if (L.mode === "see") {
      simOn = true;
      browser.classList.add("sim-see");
      toggle("Simulation aus", true, function (b) {
        simOn = !simOn;
        browser.classList.toggle("sim-see", simOn);
        b.setAttribute("aria-pressed", String(simOn));
        b.textContent = simOn ? "Simulation aus" : "Simulation wieder an";
      });
    }
  }

  function startKeys(b) {
    simOn = true;
    $("bf-browser").classList.add("nomouse");
    if (b) b.textContent = "▶ Simulation läuft – zurück in den Shop";
    if (!$("bf-focusinfo")) {
      var p = document.createElement("p");
      p.id = "bf-focusinfo"; p.className = "bf-focusinfo";
      p.textContent = "⌨ Fokus: noch vor dem Shop – drück Tab";
      $("bf-simbar").appendChild(p);
    }
    $("bf-before-shop").focus();
    say("Simulation läuft: Maus gesperrt. Drück Tab, um in den Shop zu kommen. Esc ist dein Notausgang.");
  }

  // Fokus-Anzeige außerhalb des Shops: Ohne sie merkt man den unsichtbaren Fokus gar nicht

  function describe(el) {
    var name = (el.getAttribute("aria-label") || (el.labels && el.labels[0] && el.labels[0].textContent) || el.textContent || "").trim();
    var role = el.tagName === "A" ? "Link" : el.tagName === "BUTTON" ? "Schalter" : el.type === "radio" ? "Optionsfeld" : el.tagName.toLowerCase();
    return role + " „" + name + "“";
  }
  $("shop").addEventListener("focusin", function (ev) {
    var info = $("bf-focusinfo");
    if (L.mode !== "keys" || !info) return;
    var hidden = !fx.fokus;
    info.textContent = "⌨ Fokus: " + describe(ev.target) + (hidden ? " – im Shop unsichtbar 👻" : "");
    info.classList.toggle("bad", hidden);
    if (hidden && !counters.hidden) {
      counters.hidden = true;
      say("Du bist im Shop – aber siehst du, wo? Der Fokusrahmen fehlt. Nur die Anzeige oben verrät es. Drück weiter Tab …", "bad");
    }
  });

  // ---------- Rückmeldungen aus dem Shop ----------
  function openBarriers() { return L.barriers.filter(function (b) { return !fx[b.id]; }); }
  var api = {
    done: function () {
      if (wonNow) return;
      var open = openBarriers();
      if ((L.mode === "keys" || L.mode === "see") && !simOn) {
        say(L.mode === "keys"
          ? "Das ging mit der Maus, oder? Jonas kann keine benutzen. Starte die Simulation und versuch es nur mit der Tastatur."
          : "Ohne Simulation ist es leicht. Herr Kowalski kann sie nicht ausschalten – schalte sie wieder an.", "bad");
        return;
      }
      if (open.length) {
        say("Geschafft – aber mit Glück. Offen ist noch: " + open.map(function (b) { return "„" + b.title + "“"; }).join(", ") + ". Repariere das in der Werkstatt und versuch es nochmal.", "bad");
        return;
      }
      wonNow = true;
      setTimeout(win, 500);
    },
    trapped: function () {
      counters.trap = (counters.trap || 0) + 1;
      if (counters.trap === 4) say("Gefangen! Der Fokus kreist nur noch im Banner. Du kannst mit Esc raus – Jonas hat keinen Notausgang. Zeit für die Werkstatt.", "bad");
    },
    failed: function () {
      counters.fail = (counters.fail || 0) + 1;
      if (counters.fail === 2) say("Herr Kowalski drückt und drückt – und nichts passiert. Irgendetwas stimmt nicht. Siehst du, was?", "bad");
      if (counters.fail === 4) say("Kleiner Tipp: Schalte die Simulation kurz aus und schau dir die Felder an. Und dann: ab in die Werkstatt.", "bad");
    },
    cancelled: function () {
      say("Ups – das war „Abbrechen“. Die Knöpfe sehen gleich aus und stehen andersherum als gewohnt.", "bad");
    },
  };

  // Notausgang: Esc holt den Fokus aus dem Shop zurück ins Spiel
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape" || !box || !box.contains(document.activeElement)) return;
    ev.preventDefault();
    $("bf-title").focus();
    say("Notausgang genommen. Du bist wieder im Spiel – Jonas säße jetzt noch fest.");
  });

  // ---------- Werkstatt ----------
  $("bf-ws-open").addEventListener("click", function () {
    wsOpen = true; renderFixes();
    var first = $("bf-fixes").querySelector("h3");
    if (first) first.focus();
  });
  function renderFixes() {
    var bs = L.barriers, done = bs.filter(function (b) { return fx[b.id]; }).length;
    $("bf-ws-count").textContent = bs.length ? done + " / " + bs.length + " repariert" : "";
    $("bf-ws-open").hidden = wsOpen;
    $("bf-ws-intro").hidden = wsOpen;
    var wrap = $("bf-fixes");
    wrap.hidden = !wsOpen;
    if (!wsOpen) return;
    wrap.innerHTML = bs.map(function (b, i) {
      var h = '<section class="bf-fix' + (fx[b.id] ? " fixed" : "") + '" data-fix="' + b.id + '">';
      h += '<h3 tabindex="-1">' + (fx[b.id] ? "✔ " : (i + 1) + ". ") + esc(b.title) + "</h3>";
      if (fx[b.id]) {
        var right = b.options.filter(function (o) { return o.right; })[0];
        h += '<p class="pass small">Repariert:</p><pre><code>' + esc(right.code) + "</code></pre>";
        h += "<p>" + esc(b.explain) + '</p><p class="small c-muted">' + esc(b.wcag) + "</p>";
      } else {
        h += "<p>" + esc(b.what) + '</p><p class="small c-muted">Jetzt im Code:</p><pre class="bf-before"><code>' + esc(b.before) + "</code></pre>";
        h += '<fieldset class="bf-opts"><legend>Welche Änderung behebt das?</legend>';
        b.options.forEach(function (o, k) {
          h += '<label class="bf-opt"><input type="radio" name="opt-' + b.id + '" value="' + k + '"><pre><code>' + esc(o.code) + "</code></pre></label>";
        });
        h += '</fieldset><button class="btn primary" type="button" data-apply="' + b.id + '">Änderung übernehmen</button>';
        h += '<p class="bf-fb small" aria-live="polite"></p>';
      }
      return h + "</section>";
    }).join("");
  }
  $("bf-fixes").addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-apply]");
    if (!btn) return;
    var id = btn.dataset.apply, sec = btn.closest(".bf-fix"), b = L.barriers.filter(function (x) { return x.id === id; })[0];
    var sel = sec.querySelector("input:checked"), fb = sec.querySelector(".bf-fb");
    if (!sel) { fb.className = "bf-fb small bad"; fb.textContent = "Wähle zuerst eine der Änderungen aus."; return; }
    var o = b.options[Number(sel.value)];
    if (!o.right) { fb.className = "bf-fb small bad"; fb.textContent = "✘ Nicht ganz. " + o.why; return; }
    fx[id] = true;
    renderShop();
    renderFixes();
    if (L.mode === "sr") srReset(true);
    var left = openBarriers().length;
    say(left ? "✔ Repariert. Noch " + left + " Barriere" + (left === 1 ? "" : "n") + " offen."
      : "✔ Alles repariert! Jetzt nochmal versuchen – als " + L.persona.split(",")[0] + ".", "good");
    var h = $("bf-fixes").querySelector('[data-fix="' + id + '"] h3');
    if (h) h.focus();
  });

  // ---------- Screenreader-Simulator ----------
  var tree = [], pos = -1, curEl = null, srIdle = 0;
  function srReset(reloaded) {
    tree = S.readTree(box); pos = -1; curEl = null; srIdle = 0;
    $("bf-sr-log").innerHTML = "";
    speak(reloaded ? "Seite neu geladen: Klangwerk Tickets. Drück „Weiter ▶“ zum Vorlesen." : "Seite geladen: Klangwerk Tickets. Drück „Weiter ▶“, dann liest der Screenreader vor.");
  }
  // Echte Sprachausgabe über den Browser (Web Speech API). Wer selbst einen Screenreader nutzt,
  // schaltet den Ton hier ab – die Ausgabe steht zusätzlich als Text da und wird über aria-live gemeldet.
  var synth = window.speechSynthesis, voiceOn = true, fast = false, deVoice = null;
  try { voiceOn = localStorage.getItem("barrierefrei-ton") !== "aus"; fast = localStorage.getItem("barrierefrei-tempo") === "mira"; } catch (e) {}
  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices().filter(function (v) { return /^de(-|_|$)/i.test(v.lang); });
    deVoice = vs.filter(function (v) { return /natural|online/i.test(v.name); })[0] || vs[0] || null;
  }
  if (synth) { pickVoice(); synth.addEventListener && synth.addEventListener("voiceschanged", pickVoice); }
  function voice(text) {
    if (!synth || !voiceOn) return;
    synth.cancel(); // wie ein echter Screenreader: Neues unterbricht Altes
    var u = new SpeechSynthesisUtterance(text.replace(/[▶⏎◀]/g, ""));
    u.lang = "de-DE"; if (deVoice) u.voice = deVoice;
    u.rate = fast ? 2.2 : 1.05;
    synth.speak(u);
  }
  function voiceButtons() {
    var vb = $("bf-sr-voice"), fb = $("bf-sr-fast");
    vb.setAttribute("aria-pressed", String(voiceOn)); vb.textContent = voiceOn ? "🔊 Ton an" : "🔇 Ton aus";
    fb.setAttribute("aria-pressed", String(fast)); fb.textContent = fast ? "🐇 Mira-Tempo an" : "🐇 Mira-Tempo";
    fb.disabled = !voiceOn;
    if (!synth) { vb.disabled = fb.disabled = true; vb.textContent = "🔇 Kein Ton in diesem Browser"; }
  }
  $("bf-sr-voice").addEventListener("click", function () {
    voiceOn = !voiceOn; if (!voiceOn && synth) synth.cancel();
    try { localStorage.setItem("barrierefrei-ton", voiceOn ? "an" : "aus"); } catch (e) {}
    voiceButtons(); if (voiceOn) voice("Ton an.");
  });
  $("bf-sr-fast").addEventListener("click", function () {
    fast = !fast;
    try { localStorage.setItem("barrierefrei-tempo", fast ? "mira" : "normal"); } catch (e) {}
    voiceButtons();
    voice(fast ? "So schnell hört Mira jeden Tag. Probier mal mitzukommen." : "Normales Tempo.");
  });
  voiceButtons();
  var userActed = false; // Browser sprechen erst nach einer Nutzeraktion
  ["bf-sr-next", "bf-sr-prev", "bf-sr-head", "bf-sr-act"].forEach(function (id) { $(id).addEventListener("click", function () { userActed = true; }, true); });
  $("bf-sr").addEventListener("keydown", function () { userActed = true; }, true);

  function speak(text) {
    $("bf-sr-now").textContent = text;
    if (userActed) voice(text);
    var li = document.createElement("li");
    li.textContent = text;
    var log = $("bf-sr-log");
    log.insertBefore(li, log.firstChild);
    while (log.children.length > 7) log.removeChild(log.lastChild);
  }
  function refresh() {
    tree = S.readTree(box);
    if (curEl) { var i = tree.findIndex(function (t) { return t.el === curEl; }); if (i >= 0) pos = i; }
  }
  function go(i) {
    if (i < 0) { pos = -1; speak("Anfang der Seite."); return; }
    if (i >= tree.length) { pos = tree.length; speak("Ende der Seite."); return; }
    pos = i; curEl = tree[i].el;
    box.querySelectorAll(".sr-cursor").forEach(function (x) { x.classList.remove("sr-cursor"); });
    (curEl.closest("label, button, img, h1, h2, fieldset, p, div") || curEl).classList.add("sr-cursor");
    speak(tree[i].say);
  }
  function srNext() { refresh(); go(pos + 1); }
  function srPrev() { refresh(); go(pos - 1); }
  function srHead() {
    refresh();
    for (var i = pos + 1; i < tree.length; i++) if (tree[i].heading) { go(i); return; }
    speak("Keine weitere Überschrift.");
  }
  function srAct() {
    refresh();
    var it = tree[pos];
    if (!it) { speak("Nichts ausgewählt. Drück erst „Weiter ▶“."); return; }
    if (!it.act) {
      srIdle++;
      speak("Hier passiert nichts. Für den Screenreader ist das kein Bedienelement.");
      if (srIdle === 3) say("Mira kommt hier nicht weiter: Für sie ist der Shop nur „Grafik, Grafik, Grafik“. Zeit für die Werkstatt.", "bad");
      return;
    }
    box.inert = false; // nur für den Klick – der Simulator bedient, nicht die Maus
    it.el.click();
    box.inert = true;
    refresh();
    if (tree[pos] && tree[pos].radio) speak(tree[pos].say);
  }
  var statusObs = null;
  function watchStatus() {
    if (statusObs) statusObs.disconnect();
    var st = box.querySelector("[role=status]");
    if (!st) return;
    statusObs = new MutationObserver(function () { if (st.textContent.trim()) speak("Meldung: " + st.textContent.trim()); });
    statusObs.observe(st, { childList: true, characterData: true, subtree: true });
  }
  $("bf-sr-next").addEventListener("click", srNext);
  $("bf-sr-prev").addEventListener("click", srPrev);
  $("bf-sr-head").addEventListener("click", srHead);
  $("bf-sr-act").addEventListener("click", srAct);
  $("bf-sr").addEventListener("keydown", function (ev) {
    var k = ev.key;
    if (k === "ArrowDown") srNext();
    else if (k === "ArrowUp") srPrev();
    else if (k === "h" || k === "H") srHead();
    else if (k === "Enter" && ev.target === $("bf-sr-now")) srAct();
    else return;
    ev.preventDefault();
  });

  // ---------- Prüfroboter (Level 4) ----------
  var robotFound = null, marks = new Set(), axeReady = false;
  function resetAudit() {
    robotFound = null; marks = new Set();
    $("bf-robot").disabled = false;
    $("bf-robot").textContent = "🤖 Prüfroboter starten";
    $("bf-robot-out").innerHTML = "";
    $("bf-report-msg").textContent = "";
    renderItems();
  }
  function renderItems() {
    var list = $("bf-ilist"), ran = !!robotFound;
    list.innerHTML = S.items.map(function (it) {
      var bot = ran && robotFound.has(it.id);
      var h = '<li class="bf-item' + (bot ? " bot" : "") + (marks.has(it.id) ? " marked" : "") + '" data-id="' + it.id + '">';
      h += '<div class="bf-item-head"><b>' + esc(it.label) + "</b>";
      if (bot) h += '<span class="tag t-bot">🤖 vom Roboter gemeldet</span>';
      h += '</div><pre><code>' + esc(it.code) + "</code></pre>";
      if (!bot) h += '<label class="bf-mark"><input type="checkbox" data-mark="' + it.id + '"' + (marks.has(it.id) ? " checked" : "") + (ran ? "" : " disabled") + "> Barriere, die der Roboter übersieht</label>";
      return h + "</li>";
    }).join("");
    $("bf-mark-count").textContent = ran ? marks.size + " markiert" : "erst den Roboter starten";
    $("bf-report").disabled = !ran;
  }
  $("bf-ilist").addEventListener("change", function (ev) {
    var id = ev.target.dataset.mark;
    if (!id) return;
    if (ev.target.checked) marks.add(id); else marks.delete(id);
    ev.target.closest("li").classList.toggle("marked", ev.target.checked);
    $("bf-mark-count").textContent = marks.size + " markiert";
  });
  function highlight(id) {
    box.querySelectorAll(".s-hl").forEach(function (x) { x.classList.remove("s-hl"); });
    if (id) { var t = box.querySelector('[data-item="' + id + '"]'); if (t) t.classList.add("s-hl"); }
  }
  ["mouseover", "focusin"].forEach(function (t) {
    $("bf-ilist").addEventListener(t, function (ev) { var li = ev.target.closest("li"); highlight(li && li.dataset.id); });
  });
  $("bf-ilist").addEventListener("mouseleave", function () { highlight(null); });

  function runRobot() {
    if (!window.axe) { $("bf-robot-out").textContent = "Der Prüfroboter konnte nicht geladen werden."; return Promise.resolve(); }
    if (!axeReady && window.AXE_LOCALE_DE) { try { axe.configure({ locale: window.AXE_LOCALE_DE }); } catch (e) {} axeReady = true; }
    return axe.run(box, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] });
  }
  window.BF_ROBOT = function () { // für die Tests: welche Elemente meldet der Roboter?
    return runRobot().then(function (r) { return itemsOf(r.violations); });
  };
  function itemsOf(violations) {
    var ids = new Set();
    violations.forEach(function (v) {
      v.nodes.forEach(function (n) {
        var el = document.querySelector(n.target[0]);
        var it = el && el.closest("[data-item]");
        if (it) ids.add(it.dataset.item);
      });
    });
    return Array.from(ids).sort();
  }
  $("bf-robot").addEventListener("click", function () {
    var btn = $("bf-robot");
    btn.disabled = true; btn.textContent = "🤖 prüft …";
    runRobot().then(function (r) {
      robotFound = new Set(itemsOf(r.violations));
      var out = '<p><b>' + r.violations.length + " Regelverstöße</b> an " + robotFound.size + " Elementen gefunden:</p><ul class=\"bf-robot-list\">";
      r.violations.forEach(function (v) {
        var where = itemsOf([v]).map(function (id) { return S.items.filter(function (x) { return x.id === id; })[0].label; }).join(", ");
        var wc = v.tags.filter(function (t) { return /^wcag\d{3,}$/.test(t); }).map(function (t) { return t.replace(/^wcag(\d)(\d)(\d+)$/, "$1.$2.$3"); });
        out += "<li><b>" + esc(v.help) + "</b><br><span class=\"small c-muted\">" + esc(where) + (wc.length ? " · WCAG " + wc.join(", ") : "") + " · Regel " + esc(v.id) + "</span></li>";
      });
      out += "</ul><p class=\"small\">Laut Roboter sind die anderen Elemente in Ordnung. Wirklich? Neun Barrieren hat die Seite …</p>";
      $("bf-robot-out").innerHTML = out;
      btn.textContent = "🤖 fertig";
      box.querySelectorAll("[data-item]").forEach(function (x) { x.classList.toggle("s-bot", robotFound.has(x.dataset.item)); });
      renderItems();
      var first = $("bf-ilist").querySelector("input");
      if (first) first.focus();
    });
  });
  function judge(marked) {
    var human = S.items.filter(function (x) { return x.kind === "human"; }).map(function (x) { return x.id; });
    var found = human.filter(function (id) { return marked.has(id); }).length;
    var falseAlarms = Array.from(marked).filter(function (id) { return human.indexOf(id) < 0; }).length;
    return { found: found, total: human.length, falseAlarms: falseAlarms, win: found === human.length && falseAlarms <= 1 };
  }
  window.BF_JUDGE = function (ids) { return judge(new Set(ids)); };
  $("bf-report").addEventListener("click", function () {
    var j = judge(marks), m = $("bf-report-msg");
    if (j.win) { m.className = "bf-msg good"; m.textContent = "✔ Alle gefunden!"; win(); return; }
    m.className = "bf-msg bad";
    m.textContent = "✘ " + j.found + " von " + j.total + " versteckten Barrieren gefunden, " + j.falseAlarms + " Fehlalarm" + (j.falseAlarms === 1 ? "" : "e") + "." +
      (j.found < j.total ? " Da ist noch mehr. Denk an Mira, Jonas und Herrn Kowalski: Ergibt der Text Sinn? Hängt etwas nur an der Farbe?" : "") +
      (j.falseAlarms > 1 ? " Und ein paar markierte Elemente sind völlig in Ordnung." : "");
  });

  // ---------- Gewonnen ----------
  function win() {
    solved.add(current); save(); renderLevels();
    if (window.BF_SCENE) window.BF_SCENE.celebrate();
    $("bf-win-kicker").textContent = "// level " + current + " geschafft";
    $("bf-win-title").textContent = L.win.title;
    $("bf-win-text").textContent = L.win.text;
    $("bf-win-more").innerHTML = L.mode === "audit"
      ? '<ul class="bf-why">' + S.items.filter(function (x) { return x.kind === "human"; }).map(function (x) { return "<li><b>" + esc(x.label) + ":</b> " + esc(x.why) + "</li>"; }).join("") + "</ul>"
      : "";
    $("bf-next").hidden = current >= LV.length;
    $("bf-win").showModal();
  }
  $("bf-next").addEventListener("click", function () { $("bf-win").close(); openLevel(current + 1); $("bf-levels").scrollIntoView({ behavior: "smooth" }); $("bf-title").focus({ preventScroll: true }); });
  $("bf-stay").addEventListener("click", function () { $("bf-win").close(); if (solved.size === LV.length) { $("bf-done").hidden = false; $("bf-done").scrollIntoView({ behavior: "smooth" }); } });

  window.addEventListener("hashchange", function () {
    var n = Number((location.hash.match(/level-(\d)/) || [])[1]);
    if (n && n !== current && unlocked(n)) openLevel(n);
  });

  // ---------- Einführung ----------
  if (!solved.size) $("bf-explain").open = true;
  $("bf-ex-go").addEventListener("click", function () {
    $("bf-explain").open = false;
    $("bf-levels").scrollIntoView({ behavior: "smooth" });
    $("bf-title").focus({ preventScroll: true });
  });

  // ---------- Zurücksetzen ----------
  $("bf-reset-level").addEventListener("click", function () {
    if (synth) synth.cancel();
    openLevel(current); // alle Reparaturen dieses Levels zurück auf kaputt
    say("Level neu gestartet – alle Barrieren sind wieder da.");
  });
  $("bf-reset-all").addEventListener("click", function () {
    if (!confirm("Spiel komplett zurücksetzen? Dein Fortschritt in allen Levels geht verloren.")) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.replace(location.pathname + location.search); // frisch laden, ab Level 1
  });

  // ---------- Start ----------
  var start = Number((location.hash.match(/level-(\d)/) || [])[1]) || 1;
  if (!unlocked(start)) start = 1;
  while (solved.has(start) && start < LV.length && !location.hash) start++;
  openLevel(start);
})();
