// Sprachumschalter DE / EN – die Wahl wird im Browser gemerkt (falls erlaubt)
(function () {
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-set-lang]");

  function apply(lang) {
    root.setAttribute("data-lang", lang);
    root.lang = lang;
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setLang === lang)); });
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      apply(b.dataset.setLang);
      try { localStorage.setItem("lang", b.dataset.setLang); } catch (e) {}
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
