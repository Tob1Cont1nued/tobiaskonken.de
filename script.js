// Sprachumschalter DE / EN – die Wahl wird im Browser gemerkt (falls erlaubt)
//
// Absichtlicher Fehler für die Test-Demo: Mit ?bug=lang in der Adresse markiert der Umschalter
// zwar den Knopf und merkt sich die Wahl, schaltet die Inhalte aber nicht um.
// Die Playwright-Tests (tests/sprache.spec.ts) müssen genau das erkennen.
// Mit ?demo nutzt die Seite einen eigenen Speicherplatz, damit die Demo im Mini-Fenster
// die Sprachwahl der Besucher*innen nicht verändert.
(function () {
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-set-lang]");
  var params = new URLSearchParams(location.search);
  var bug = params.get("bug") === "lang";
  var key = params.has("demo") ? "lang-demo" : "lang";

  function mark(lang) {
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setLang === lang)); });
  }
  function apply(lang) {
    root.setAttribute("data-lang", lang);
    root.lang = lang;
    mark(lang);
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      if (bug) mark(b.dataset.setLang); // 🐞 Inhalte und lang-Attribut bleiben, wie sie waren
      else apply(b.dataset.setLang);
      try { localStorage.setItem(key, b.dataset.setLang); } catch (e) {}
    });
  });

  apply(root.getAttribute("data-lang") || "de");
})();

// Projekte: alle auf- oder zuklappen
(function () {
  var btn = document.getElementById("toggle-jobs");
  if (!btn) return;
  var items = document.querySelectorAll(".job details");
  function sync() {
    var allOpen = Array.prototype.every.call(items, function (d) { return d.open; });
    btn.setAttribute("aria-expanded", String(allOpen));
    btn.querySelector('[lang="de"]').textContent = allOpen ? "alle zuklappen" : "alle aufklappen";
    btn.querySelector('[lang="en"]').textContent = allOpen ? "collapse all" : "expand all";
  }
  btn.addEventListener("click", function () {
    var open = btn.getAttribute("aria-expanded") !== "true";
    items.forEach(function (d) { d.open = open; });
    sync();
  });
  items.forEach(function (d) { d.addEventListener("toggle", sync); });
  sync();
})();

// Versteckter Admin-Zugang: Doppelklick auf „exit 0“ im Footer oder #admin in der Adresse.
// admin.js wird erst dann geladen – für alle anderen Besucher bleibt die Seite unverändert.
(function () {
  function load() {
    if (window.__adminLoaded) return;
    window.__adminLoaded = true;
    var s = document.createElement("script");
    s.src = "admin.js";
    document.body.appendChild(s);
  }
  var t = document.querySelector("[data-admin]");
  if (t) t.addEventListener("dblclick", load);
  if (location.hash === "#admin") load();
  window.addEventListener("hashchange", function () { if (location.hash === "#admin") load(); });
})();
