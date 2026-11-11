// Live-Demo: Anforderung → Akzeptanzkriterien → Playwright-Test → Testlauf & Report.
// - Zeigt den echten Testcode aus tests/sprache.spec.ts.
// - Führt dieselben Prüfungen im Browser gegen diese Seite aus (in einem Mini-Fenster, ?demo).
// - Mit dem Bug-Schalter läuft die Seite mit ?bug=lang – dann müssen AK2 und AK4 rot werden.
// - Zeigt die Ergebnisse und Links der echten Reports aus GitHub Actions (report/…).
(function () {
  var root = document.getElementById("demo");
  if (new URLSearchParams(location.search).has("demo")) return; // im Mini-Fenster selbst nichts starten
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var lang = function () { return document.documentElement.lang === "en" ? "en" : "de"; };
  var t = function (de, en) { return lang() === "en" ? en : de; };
  var EN_TITLE = "How do we test AI today – with AI?", DE_TITLE = "Wie testen wir heute KI – mit KI?";

  // ---------- Rückverfolgbarkeit: Kriterium, Testcode und Ergebnis gemeinsam hervorheben ----------
  function highlight(ak) {
    root.querySelectorAll("[data-ak]").forEach(function (n) { n.classList.toggle("hl", !!ak && n.dataset.ak === ak); });
  }
  root.addEventListener("mouseover", function (ev) {
    var n = ev.target.closest && ev.target.closest("[data-ak]");
    highlight(n ? n.dataset.ak : null);
    // Code zum passenden Test scrollen, wenn man über ein Kriterium oder ein Ergebnis fährt
    if (n && !n.classList.contains("ln")) {
      var pre = $("demo-code"), first = pre.querySelector('.ln[data-ak="' + n.dataset.ak + '"]');
      if (first) pre.scrollTo({ top: first.offsetTop - 12, behavior: "smooth" });
    }
  });
  root.addEventListener("mouseleave", function () { highlight(null); });

  // ---------- Echter Testcode ----------
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function colorize(line) {
    var i = line.indexOf("//");
    var code = i >= 0 && !/["'][^"']*\/\//.test(line.slice(0, i + 2)) ? line.slice(0, i) : line;
    var comment = code.length < line.length ? line.slice(code.length) : "";
    var html = esc(code)
      .replace(/(&quot;|")((?:[^"\\]|\\.)*)"/g, '<span class="s">"$2"</span>')
      .replace(/\b(import|from|const|async|await|type|process)\b/g, '<span class="k">$1</span>')
      .replace(/\b(test|expect|describe)\b/g, '<span class="f">$1</span>');
    return html + (comment ? '<span class="c">' + esc(comment) + "</span>" : "");
  }
  function renderCode(src) {
    var current = null, out = [];
    src.replace(/\r/g, "").split("\n").forEach(function (line) {
      var m = /test\("(AK\d)/.exec(line);
      if (m) current = m[1];
      out.push('<span class="ln"' + (current ? ' data-ak="' + current + '"' : "") + ">" + (colorize(line) || " ") + "</span>");
      if (current && /^ {2}\}\);\s*$/.test(line)) current = null;
    });
    $("demo-code").innerHTML = "<code>" + out.join("") + "</code>";
  }
  fetch("tests/sprache.spec.ts", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(renderCode)
    .catch(function () {
      $("demo-code").innerHTML = '<code><span lang="de">// Der Testcode wird auf tobiaskonken.de geladen.</span><span lang="en">// The test code is loaded on tobiaskonken.de.</span>\n' +
        '<a href="https://github.com/Tob1Cont1nued/tobiaskonken.de/blob/main/tests/sprache.spec.ts" rel="noopener">tests/sprache.spec.ts</a></code>';
    });

  // ---------- Bug-Schalter ----------
  var bug = $("demo-bug");
  bug.addEventListener("change", function () {
    $("demo-bug-note").hidden = !bug.checked;
    root.classList.toggle("bugged", bug.checked);
  });

  // ---------- Mini-Browser ----------
  var frame = $("demo-frame"), view = $("demo-view"), cursor = $("demo-cursor");
  var VW = 1280, VH = 760;
  function fit() {
    var s = view.clientWidth / VW;
    frame.style.transform = "scale(" + s + ")";
    view.style.height = Math.round(VH * s) + "px";
    return s;
  }
  window.addEventListener("resize", fit);
  fit();

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function load(url) {
    return new Promise(function (resolve, reject) {
      var done = false;
      frame.onload = function () { done = true; setTimeout(resolve, 350); };
      setTimeout(function () { if (!done) reject(new Error("timeout")); }, 15000);
      frame.src = url;
    });
  }
  function reload() {
    return new Promise(function (resolve) {
      frame.onload = function () { setTimeout(resolve, 350); };
      frame.contentWindow.location.reload();
    });
  }
  var doc = function () { return frame.contentDocument; };
  var langBtn = function (name) { return doc().querySelector('[data-set-lang="' + name.toLowerCase() + '"]'); };
  var title = function () { var h = doc().querySelector("#workshop .offer-title"); return h ? h.innerText.trim() : ""; };

  async function click(el) {
    var s = fit(), r = el.getBoundingClientRect();
    cursor.style.left = (r.left + r.width / 2) * s + "px";
    cursor.style.top = (r.top + r.height / 2) * s + "px";
    cursor.classList.add("show");
    await sleep(550);
    cursor.classList.add("press");
    el.click();
    await sleep(180);
    cursor.classList.remove("press");
    await sleep(200);
  }
  function fresh() {
    try { localStorage.removeItem("lang-demo"); } catch (e) {}
    return load("index.html?demo" + (bug.checked ? "&bug=lang" : ""));
  }
  function expectEq(actual, expected, what) {
    if (actual !== expected) throw new Error(what + ": " + t("erwartet", "expected") + ' "' + expected + '", ' + t("erhalten", "received") + ' "' + actual + '"');
  }

  // Dieselben Akzeptanzkriterien wie in tests/sprache.spec.ts
  var TESTS = [
    { ak: "AK1", de: "Ohne eigene Wahl erscheint die Seite auf Deutsch", en: "Without a choice, the page appears in German",
      run: async function () { await fresh(); expectEq(title(), DE_TITLE, "heading"); expectEq(langBtn("DE").getAttribute("aria-pressed"), "true", "DE aria-pressed"); } },
    { ak: "AK2", de: "Nach Klick auf EN sind die Inhalte englisch", en: "After clicking EN, the content is English",
      run: async function () { await fresh(); await click(langBtn("EN")); expectEq(title(), EN_TITLE, "heading"); } },
    { ak: "AK3", de: "Der EN-Knopf ist danach als aktiv markiert", en: "The EN button is marked as active",
      run: async function () { await fresh(); await click(langBtn("EN")); expectEq(langBtn("EN").getAttribute("aria-pressed"), "true", "EN aria-pressed"); expectEq(langBtn("DE").getAttribute("aria-pressed"), "false", "DE aria-pressed"); } },
    { ak: "AK4", de: 'Die Seite meldet sich als englisch (lang="en")', en: 'The page declares itself English (lang="en")',
      run: async function () { await fresh(); await click(langBtn("EN")); expectEq(doc().documentElement.lang, "en", "html lang"); } },
    { ak: "AK5", de: "Die Wahl bleibt nach dem Neuladen erhalten", en: "The choice survives a reload",
      run: async function () { await fresh(); await click(langBtn("EN")); await reload(); expectEq(title(), EN_TITLE, "heading"); } },
  ];

  var out = $("demo-out");
  function line(html, cls, ak) {
    var p = document.createElement("p");
    if (cls) p.className = cls;
    if (ak) p.dataset.ak = ak;
    p.innerHTML = html;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
    return p;
  }

  var running = false;
  $("demo-run").addEventListener("click", async function () {
    if (running) return;
    running = true;
    var btn = this;
    btn.disabled = true;
    $("demo-idle").hidden = true;
    $("demo-url").textContent = "tobiaskonken.de" + (bug.checked ? "/?bug=lang" : "");
    out.innerHTML = "";
    line("$ npx playwright test tests/sprache.spec.ts" + (bug.checked ? " <span class='bad'># BUG=1</span>" : ""), "c-muted");
    line(t("Running 5 tests using 1 worker", "Running 5 tests using 1 worker"), "c-muted");
    var passed = 0, failed = 0, t0 = performance.now();
    for (var i = 0; i < TESTS.length; i++) {
      var tc = TESTS[i], name = esc(tc.ak + ": " + tc[lang()]);
      var row = line("<span class='spin'>◌</span> " + name, "row", tc.ak);
      var s = performance.now();
      try {
        await tc.run();
        passed++;
        row.innerHTML = "<span class='pass'>✓</span> " + name + " <span class='c-muted'>(" + Math.round(performance.now() - s) + "ms)</span>";
      } catch (err) {
        failed++;
        row.classList.add("fail");
        row.innerHTML = "<span class='bad'>✘</span> " + name + " <span class='c-muted'>(" + Math.round(performance.now() - s) + "ms)</span>" +
          "<br><span class='err'>  → " + esc(err.message === "timeout" ? t("Seite lädt nicht (nur auf tobiaskonken.de verfügbar)", "page did not load (only available on tobiaskonken.de)") : err.message) + "</span>";
      }
      cursor.classList.remove("show");
    }
    var secs = ((performance.now() - t0) / 1000).toFixed(1);
    line("&nbsp;", "");
    line((failed ? "<span class='bad'>" + failed + " failed</span> · " : "") + "<span class='pass'>" + passed + " passed</span> <span class='c-muted'>(" + secs + "s)</span>", "sum");
    line(failed
      ? (bug.checked ? t("# Der eingebaute Fehler wurde gefunden – genau die verletzten Kriterien sind rot.", "# The planted bug was caught – exactly the violated criteria are red.")
                     : t("# Unerwartet rot – bitte melde mir das!", "# Unexpectedly red – please let me know!"))
      : (bug.checked ? t("# Fehler nicht gefunden?! Das wäre ein schlechter Test.", "# Bug not caught?! That would be a bad test.")
                     : t("# Alles grün. Jetzt den Fehler einbauen und nochmal laufen lassen.", "# All green. Now plant the bug and run again.")), "c-muted");
    var rep = bug.checked ? "report/bug/index.html" : "report/ok/index.html";
    line('📄 <a href="' + rep + '" target="_blank" rel="noopener">' + t("Echten Playwright-Report aus GitHub Actions öffnen", "Open the real Playwright report from GitHub Actions") +
      (bug.checked ? t(" (mit Fehler)", " (with bug)") : t(" (ohne Fehler)", " (without bug)")) + " →</a>", "rep");
    btn.disabled = false;
    running = false;
  });

  // ---------- Letzter echter CI-Lauf ----------
  function getJSON(url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  Promise.all([getJSON("report/run.json"), getJSON("report/ok/results.json"), getJSON("report/bug/results.json")])
    .then(function (res) {
      var run = res[0], ok = res[1].stats || {}, bad = res[2].stats || {};
      var when = new Date(run.time);
      var el = $("demo-ci-line");
      el.innerHTML = "";
      var de = document.createElement("span"), en = document.createElement("span");
      de.lang = "de"; en.lang = "en";
      var stamp = when.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }), stampEn = when.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
      de.innerHTML = 'Lauf <a href="' + run.url + '" rel="noopener">#' + run.run + "</a> vom " + stamp + " (Commit " + run.sha + "): " +
        '<a href="report/ok/index.html">ohne Fehler</a> <span class="pass">' + (ok.expected || 0) + " ✓</span> " + (ok.unexpected ? '<span class="bad">' + ok.unexpected + " ✘</span>" : "") +
        ' · <a href="report/bug/index.html">mit Fehler</a> <span class="pass">' + (bad.expected || 0) + ' ✓</span> <span class="bad">' + (bad.unexpected || 0) + " ✘</span>";
      en.innerHTML = 'Run <a href="' + run.url + '" rel="noopener">#' + run.run + "</a> on " + stampEn + " (commit " + run.sha + "): " +
        '<a href="report/ok/index.html">without bug</a> <span class="pass">' + (ok.expected || 0) + " ✓</span> " + (ok.unexpected ? '<span class="bad">' + ok.unexpected + " ✘</span>" : "") +
        ' · <a href="report/bug/index.html">with bug</a> <span class="pass">' + (bad.expected || 0) + ' ✓</span> <span class="bad">' + (bad.unexpected || 0) + " ✘</span>";
      el.appendChild(de); el.appendChild(en);
    })
    .catch(function () { /* lokal oder vor dem ersten Lauf: Hinweistext bleibt stehen */ });
})();
