// Baut die Karten für "Aktuelles" aus aktuelles.js und öffnet Bilder groß in einer kleinen Galerie.
// <div id="news" data-limit="3"> zeigt die neuesten drei, ohne data-limit alle.
(function () {
  var root = document.getElementById("news");
  if (!root) return;

  var local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var items = (window.AKTUELLES || [])
    .filter(function (e) { return local || !e.entwurf; })
    .sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });
  var limit = parseInt(root.dataset.limit || "0", 10);
  var more = document.getElementById("news-more");
  if (more) more.hidden = !(limit && items.length > limit);
  if (limit) items = items.slice(0, limit);

  function el(tag, cls, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }
  // zweisprachiger Text als <span lang="de"> + <span lang="en">
  function bi(parent, value) {
    if (typeof value === "string") value = { de: value, en: value };
    ["de", "en"].forEach(function (l) {
      var s = el("span", "", parent);
      s.lang = l;
      s.textContent = value[l] || value.de || "";
    });
  }
  function lang() { return document.documentElement.lang === "en" ? "en" : "de"; }
  function pick(value) { return typeof value === "string" ? value : (value && (value[lang()] || value.de)) || ""; }

  if (!items.length) {
    var empty = el("p", "news-empty", root);
    bi(empty, { de: "// Bald gibt es hier Neuigkeiten.", en: "// News coming soon." });
    return;
  }

  items.forEach(function (e) {
    var card = el("article", "news-card" + (e.entwurf ? " draft" : ""), root);
    var pics = e.bilder || [];
    if (pics.length) {
      var btn = el("button", "news-media", card);
      btn.type = "button";
      btn.setAttribute("aria-label", pick({ de: "Bilder ansehen", en: "View pictures" }));
      var img = el("img", "", btn);
      img.src = pics[0].src;
      img.alt = pick(pics[0].alt);
      img.loading = "lazy";
      img.decoding = "async";
      if (pics.length > 1) { var c = el("span", "news-count", btn); c.textContent = "▣ " + pics.length; }
      btn.addEventListener("click", function () { Lightbox.open(pics, 0); });
    }
    var body = el("div", "news-body", card);
    var meta = el("p", "news-date", body);
    var d = new Date(e.datum + "T12:00:00");
    bi(meta, {
      de: d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }),
      en: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    });
    if (e.entwurf) { var t = el("span", "news-draft", meta); t.textContent = "entwurf · nur lokal"; }
    bi(el("h3", "", body), e.titel);
    bi(el("p", "news-text", body), e.text);
    if (e.link && e.link.url) {
      var a = el("a", "news-link", body);
      a.href = e.link.url; a.target = "_blank"; a.rel = "noopener";
      bi(a, { de: (e.link.de || "Mehr") + " →", en: (e.link.en || e.link.de || "More") + " →" });
    }
  });

  // ---------- Galerie ----------
  var Lightbox = (function () {
    var dlg = el("dialog", "lightbox", document.body);
    dlg.setAttribute("aria-label", "Bild");
    var img = el("img", "", dlg);
    var cap = el("p", "lb-caption", dlg);
    var prev = el("button", "lb-nav lb-prev", dlg), next = el("button", "lb-nav lb-next", dlg), close = el("button", "lb-close", dlg);
    prev.type = next.type = close.type = "button";
    prev.textContent = "‹"; next.textContent = "›"; close.textContent = "✕";
    prev.setAttribute("aria-label", "Vorheriges Bild"); next.setAttribute("aria-label", "Nächstes Bild"); close.setAttribute("aria-label", "Schließen");
    var list = [], i = 0, startX = null;

    function show() {
      img.src = list[i].src;
      img.alt = pick(list[i].alt);
      cap.textContent = (list.length > 1 ? (i + 1) + " / " + list.length + "  ·  " : "") + pick(list[i].alt);
      prev.hidden = next.hidden = list.length < 2;
    }
    function go(step) { i = (i + step + list.length) % list.length; show(); }
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    close.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowLeft") go(-1);
      if (ev.key === "ArrowRight") go(1);
    });
    // Wischen auf dem Handy
    dlg.addEventListener("pointerdown", function (ev) { startX = ev.clientX; });
    dlg.addEventListener("pointerup", function (ev) {
      if (startX !== null && Math.abs(ev.clientX - startX) > 50 && list.length > 1) go(ev.clientX < startX ? 1 : -1);
      startX = null;
    });
    dlg.addEventListener("close", function () { document.body.classList.remove("lb-open"); });

    return {
      open: function (pics, start) {
        list = pics; i = start || 0; show();
        document.body.classList.add("lb-open");
        dlg.showModal();
      },
    };
  })();
})();
