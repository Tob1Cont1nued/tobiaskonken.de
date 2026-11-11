// Baut die Karten für "Aktuelles" aus aktuelles.js als waagrechte Reihe:
// drei Karten nebeneinander, ab vier Einträgen seitlich wischbar (mit Pfeilen).
// Fotos (bilder) öffnen sich groß in einer kleinen Galerie.
(function () {
  var root = document.getElementById("news");
  if (!root) return;

  var local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var items = (window.AKTUELLES || []).filter(function (e) { return local || !e.entwurf; });

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

  var track = el("div", "news-track", root);
  track.setAttribute("role", "list");
  items.forEach(function (e) {
    var card = el("article", "news-card" + (e.entwurf ? " draft" : ""), track);
    card.setAttribute("role", "listitem");
    var pics = e.bilder || [];
    if (pics.length) {
      var btn = el("button", "news-media", card);
      btn.type = "button";
      btn.setAttribute("aria-label", pick({ de: "Bilder ansehen", en: "View pictures" }));
      var img = el("img", "", btn);
      img.src = pics[0].src; img.alt = pick(pics[0].alt); img.loading = "lazy"; img.decoding = "async";
      if (pics.length > 1) { var c = el("span", "news-count", btn); c.textContent = "▣ " + pics.length; }
      btn.addEventListener("click", function () { Lightbox.open(pics, 0); });
    } else if (e.cover) {
      var fig = el("div", "news-media news-cover", card);
      var cimg = el("img", "", fig);
      cimg.src = e.cover; cimg.alt = ""; cimg.loading = "lazy"; cimg.decoding = "async";
    }
    var body = el("div", "news-body", card);
    if (e.label || e.entwurf) {
      var meta = el("p", "news-date", body);
      if (e.label) bi(meta, e.label);
      if (e.entwurf) { var t = el("span", "news-draft", meta); t.textContent = "entwurf · nur lokal"; }
    }
    bi(el("h3", "", body), e.titel);
    bi(el("p", "news-text", body), e.text);
    if (e.link && e.link.url) {
      var a = el("a", "news-link", body);
      a.href = e.link.url;
      if (/^https?:/.test(e.link.url)) { a.target = "_blank"; a.rel = "noopener"; }
      bi(a, { de: (e.link.de || "Mehr") + " →", en: (e.link.en || e.link.de || "More") + " →" });
    }
    if (e.artikel) {
      var more = el("button", "news-link link-btn", body);
      more.type = "button";
      bi(more, { de: "Weiterlesen →", en: "Read more →" });
      more.addEventListener("click", function () { Article.open(e); });
    }
  });

  // ---------- Langer Text ("Weiterlesen") ----------
  var Article = (function () {
    var dlg = el("dialog", "article-dlg", document.body);
    var close = el("button", "lb-close article-close", dlg);
    close.type = "button"; close.textContent = "✕"; close.setAttribute("aria-label", "Schließen");
    var inner = el("div", "article-inner", dlg);
    close.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { document.body.classList.remove("lb-open"); });
    return {
      open: function (e) {
        inner.innerHTML = "";
        if (e.label) bi(el("p", "news-date", inner), e.label);
        bi(el("h2", "", inner), e.titel);
        ["de", "en"].forEach(function (l) {
          var box = el("div", "", inner);
          box.lang = l;
          (e.artikel[l] || e.artikel.de).forEach(function (para) {
            var h = /^## /.test(para);
            el(h ? "h3" : "p", h ? "" : "article-p", box).textContent = h ? para.slice(3) : para;
          });
        });
        document.body.classList.add("lb-open");
        dlg.showModal();
        inner.scrollTop = 0;
      },
    };
  })();

  // ---------- Pfeile, nur wenn die Reihe breiter ist als der Platz ----------
  var nav = el("div", "news-nav", root);
  var prev = el("button", "news-arrow", nav), next = el("button", "news-arrow", nav);
  prev.type = next.type = "button";
  prev.textContent = "‹"; next.textContent = "›";
  prev.setAttribute("aria-label", "Zurück"); next.setAttribute("aria-label", "Weiter");
  function step() {
    var card = track.querySelector(".news-card");
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20) : track.clientWidth;
  }
  prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
  next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
  function update() {
    var max = track.scrollWidth - track.clientWidth;
    root.classList.toggle("scrollable", max > 4);
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  }
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  // ---------- Galerie ----------
  var Lightbox = (function () {
    var dlg = el("dialog", "lightbox", document.body);
    dlg.setAttribute("aria-label", "Bild");
    var img = el("img", "", dlg);
    var cap = el("p", "lb-caption", dlg);
    var lp = el("button", "lb-nav lb-prev", dlg), ln = el("button", "lb-nav lb-next", dlg), close = el("button", "lb-close", dlg);
    lp.type = ln.type = close.type = "button";
    lp.textContent = "‹"; ln.textContent = "›"; close.textContent = "✕";
    lp.setAttribute("aria-label", "Vorheriges Bild"); ln.setAttribute("aria-label", "Nächstes Bild"); close.setAttribute("aria-label", "Schließen");
    var list = [], i = 0, startX = null;

    function show() {
      img.src = list[i].src;
      img.alt = pick(list[i].alt);
      cap.textContent = (list.length > 1 ? (i + 1) + " / " + list.length + "  ·  " : "") + pick(list[i].alt);
      lp.hidden = ln.hidden = list.length < 2;
    }
    function go(s) { i = (i + s + list.length) % list.length; show(); }
    lp.addEventListener("click", function () { go(-1); });
    ln.addEventListener("click", function () { go(1); });
    close.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowLeft") go(-1);
      if (ev.key === "ArrowRight") go(1);
    });
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
