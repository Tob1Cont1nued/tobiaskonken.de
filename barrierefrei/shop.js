// "Eine Karte, bitte!" – der Ticketshop Klangwerk in vier Ausführungen.
// Jede Barriere ist ein Schalter in fx: false = kaputt, true = repariert.
// Der Shop ist echtes HTML. Der Screenreader-Simulator liest genau dieses HTML.
(function () {
  var IMG = "img/";
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function head() {
    return '<header class="s-head"><img class="s-logo" src="' + IMG + 'logo.svg" alt="Klangwerk Tickets"></header>';
  }

  // ---------------- Level 1: Screenreader ----------------
  var L1 = {
    html: function (fx) {
      var h = '<div class="s-page">' + head() + '<main class="s-main"><h1>Hafenlichter – Open Air</h1>';
      h += fx.plakat
        ? '<img class="s-poster" src="' + IMG + 'plakat.svg" alt="Plakat: Hafenlichter – Open Air, Samstag, 14. März 2027, 20 Uhr, Hafenbühne">'
        : '<img class="s-poster" src="' + IMG + 'plakat.svg">';
      h += '<p>Ein Abend voller Synthesizer, Lichter und Hafenluft. Einlass ab 18 Uhr.</p>';
      if (fx.kategorie) {
        h += '<fieldset class="s-cats"><legend>Kategorie</legend>' +
          '<label class="s-radio"><input type="radio" name="kat" value="steh" data-act="cat"> Stehplatz – 49 €</label>' +
          '<label class="s-radio"><input type="radio" name="kat" value="sitz" data-act="cat"> Sitzplatz – 69 €</label></fieldset>';
      } else {
        h += '<div class="s-cats s-tiles">' +
          '<div class="s-tile" data-act="cat" data-val="steh"><img src="' + IMG + 'steh.svg"></div>' +
          '<div class="s-tile" data-act="cat" data-val="sitz"><img src="' + IMG + 'sitz.svg"></div></div>';
      }
      h += fx.knopf
        ? '<button class="s-btn s-primary" type="button" data-act="buy">In den Warenkorb</button>'
        : '<div class="s-buy" data-act="buy"><img src="' + IMG + 'warenkorb.svg"></div>';
      h += '<p class="s-msg" role="status"></p></main></div>';
      return h;
    },
    init: function (root, fx, api) {
      var cat = null, msg = root.querySelector(".s-msg");
      root.addEventListener("click", function (ev) {
        var t = ev.target.closest("[data-act]");
        if (!t || !root.contains(t)) return;
        if (t.dataset.act === "cat") {
          cat = t.value || t.dataset.val;
          root.querySelectorAll(".s-tile").forEach(function (x) { x.classList.toggle("sel", x === t); });
        }
        if (t.dataset.act === "buy") {
          if (!cat) { msg.textContent = "Bitte wähle zuerst eine Kategorie."; return; }
          msg.textContent = (cat === "steh" ? "Stehplatz" : "Sitzplatz") + " liegt im Warenkorb. ✔";
          api.done(cat);
        }
      });
    },
  };

  // ---------------- Level 2: nur Tastatur ----------------
  var L2 = {
    html: function (fx) {
      var h = '<div class="s-page' + (fx.fokus ? " s-focus" : " s-nofocus") + '">';
      h += '<div class="s-banner" data-banner><div class="s-banner-box" role="dialog" aria-label="Cookies">' +
        '<p><b>Wir lieben Cookies.</b> Und Sie bestimmt auch. Mit „Alle akzeptieren“ stimmen Sie allem zu.</p>' +
        '<p class="s-banner-links"><a href="#datenschutz">Datenschutz</a> <a href="#einstellungen">Einstellungen</a></p>' +
        (fx.falle
          ? '<button class="s-btn s-primary" type="button" data-act="accept">Alle akzeptieren</button>'
          : '<span class="s-btn s-primary" data-act="accept">Alle akzeptieren</span>') +
        '</div></div>';
      h += '<div class="s-rest">' + head() + '<nav class="s-nav" aria-label="Shop"><a href="#programm">Programm</a> <a href="#kontakt">Kontakt</a></nav>';
      h += '<main class="s-main"><h1>Hafenlichter – Open Air</h1><p>Samstag, 14. März 2027 · 20 Uhr · Hafenbühne</p>';
      h += '<fieldset class="s-cats"><legend>Kategorie</legend>' +
        '<label class="s-radio"><input type="radio" name="kat2" value="steh" data-act="cat" checked> Stehplatz – 49 €</label>' +
        '<label class="s-radio"><input type="radio" name="kat2" value="sitz" data-act="cat"> Sitzplatz – 69 €</label></fieldset>';
      h += fx.knopf
        ? '<button class="s-btn s-primary" type="button" data-act="buy">In den Warenkorb</button>'
        : '<a class="s-btn s-primary" data-act="buy">In den Warenkorb</a>';
      h += '<p class="s-msg" role="status"></p></main></div></div>';
      return h;
    },
    init: function (root, fx, api) {
      var banner = root.querySelector("[data-banner]"), rest = root.querySelector(".s-rest"), msg = root.querySelector(".s-msg");
      if (fx.falle) rest.inert = true; // echter Dialog: dahinter ist nichts erreichbar, bis er geschlossen ist
      root.addEventListener("click", function (ev) {
        var a = ev.target.closest("a[href^='#']");
        if (a) ev.preventDefault(); // Links im Shop führen nirgendwohin
        var t = ev.target.closest("[data-act]");
        if (!t) return;
        if (t.dataset.act === "accept") {
          banner.remove(); rest.inert = false;
          var first = rest.querySelector("a, input:checked, button");
          if (first) first.focus();
        }
        if (t.dataset.act === "buy") {
          var c = root.querySelector("input[name=kat2]:checked").value;
          if (c !== "sitz") { msg.textContent = "Stehplatz liegt im Warenkorb. Gesucht war aber ein Sitzplatz."; return; }
          msg.textContent = "Sitzplatz liegt im Warenkorb. ✔";
          api.done(c);
        }
      });
      // Die Falle: Tab kreist nur zwischen den beiden Links im Banner
      root.addEventListener("keydown", function (ev) {
        if (ev.key !== "Tab" || fx.falle || !root.contains(banner)) return;
        var links = banner.querySelectorAll("a");
        var i = Array.prototype.indexOf.call(links, document.activeElement);
        if (i < 0 && !banner.contains(document.activeElement)) return;
        ev.preventDefault();
        var n = (i + (ev.shiftKey ? -1 : 1) + links.length) % links.length;
        links[n].focus();
        api.trapped();
      });
    },
    // Wo der Fokus beim Start der Simulation landet: vor dem Shop
    entry: function (root) { return root.querySelector("a, button, input"); },
  };

  // ---------------- Level 3: Sehen ----------------
  var FIELDS = [
    { id: "name", label: "Name", value: "Bernd Kowalski", auto: "name" },
    { id: "email", label: "E-Mail", value: "bernd.kowalski@beispiel", auto: "email", type: "email" },
    { id: "plz", label: "Postleitzahl", value: "12345", auto: "postal-code" },
  ];
  var L3 = {
    html: function (fx) {
      var h = '<div class="s-page' + (fx.kontrast ? "" : " s-pale") + '">' + head() + '<main class="s-main"><h1>Kasse</h1>';
      h += '<p class="s-sum">1 × Stehplatz · Hafenlichter – Open Air · <b>49,00 €</b></p><form class="s-form" novalidate>';
      FIELDS.forEach(function (f) {
        h += '<div class="s-field">';
        if (fx.labels) h += '<label for="f-' + f.id + '">' + f.label + "</label>";
        h += '<input class="s-input" id="f-' + f.id + '" type="' + (f.type || "text") + '" value="' + esc(f.value) + '"' +
          (fx.labels ? ' autocomplete="' + f.auto + '"' : ' placeholder="' + f.label + '"') +
          (fx.fehler && f.id === "email" ? ' aria-describedby="f-email-err"' : "") + ">";
        if (fx.fehler && f.id === "email") h += '<p class="s-err" id="f-email-err" hidden>⚠ Bitte gib eine vollständige E-Mail-Adresse ein, z. B. name@beispiel.de</p>';
        h += "</div>";
      });
      h += fx.kontrast
        ? '<div class="s-actions"><button class="s-btn s-primary" type="button" data-act="order">Zahlungspflichtig bestellen</button>' +
          '<button class="s-btn s-secondary" type="button" data-act="cancel">Abbrechen</button></div>'
        : '<div class="s-actions"><button class="s-btn s-paleBtn" type="button" data-act="cancel">Abbrechen</button>' +
          '<button class="s-btn s-paleBtn" type="button" data-act="order">Zahlungspflichtig bestellen</button></div>';
      h += '</form><p class="s-msg" role="status"></p></main></div>';
      return h;
    },
    init: function (root, fx, api) {
      var msg = root.querySelector(".s-msg"), email = root.querySelector("#f-email"), err = root.querySelector("#f-email-err");
      function setError(on) {
        email.classList.toggle("s-invalid", on);
        if (fx.fehler) { err.hidden = !on; if (on) email.setAttribute("aria-invalid", "true"); else email.removeAttribute("aria-invalid"); }
      }
      email.addEventListener("input", function () { if (email.classList.contains("s-invalid") && valid()) setError(false); });
      function valid() { return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.value.trim()); }
      root.addEventListener("submit", function (ev) { ev.preventDefault(); });
      root.addEventListener("click", function (ev) {
        var t = ev.target.closest("[data-act]");
        if (!t) return;
        if (t.dataset.act === "cancel") {
          FIELDS.forEach(function (f) { root.querySelector("#f-" + f.id).value = f.value; });
          setError(false);
          msg.textContent = "Bestellung abgebrochen. Die Eingaben wurden zurückgesetzt.";
          api.cancelled();
        }
        if (t.dataset.act === "order") {
          if (!valid()) { setError(true); msg.textContent = ""; api.failed(); return; }
          setError(false);
          msg.textContent = "Bestellt! ✔ Die Bestätigung geht an " + email.value.trim() + ".";
          api.done();
        }
      });
    },
  };

  // ---------------- Level 4: Mensch gegen Maschine ----------------
  // kind: "machine" = findet der Prüfroboter, "human" = findet nur ein Mensch, "clean" = in Ordnung
  var ITEMS = [
    { id: "logo", kind: "clean", label: "Logo", code: '<img src="logo.svg" alt="Klangwerk Tickets">' },
    { id: "h1", kind: "clean", label: "Hauptüberschrift", code: "<h1>Hafenlichter – Open Air</h1>" },
    { id: "plakat", kind: "human", label: "Plakat", code: '<img src="plakat.svg" alt="IMG_4711.jpg">',
      why: "Ein Alt-Text ist da – also ist der Roboter zufrieden. Aber „IMG_4711.jpg“ beschreibt nichts. Ob ein Alt-Text Sinn ergibt, kann nur ein Mensch beurteilen." },
    { id: "ticket", kind: "machine", label: "Ticket-Symbol", code: '<img src="ticket.svg">' },
    { id: "termine-h", kind: "human", label: "Zwischentitel „Termine“", code: '<div class="gross fett">Termine</div>',
      why: "Sieht aus wie eine Überschrift, ist aber keine. Wer mit dem Screenreader von Überschrift zu Überschrift springt, findet sie nicht. Für den Roboter ist es nur Text." },
    { id: "termine", kind: "human", label: "Terminliste", code: '<li>14. März</li>\n<li style="color:#b4231a">21. März</li>\n<li>28. März</li>\n<p>Rot = ausverkauft</p>',
      why: "„Ausverkauft“ steht nur in der Farbe. Mit Rot-Grün-Schwäche oder Screenreader ist der 21. März ein Termin wie jeder andere. Besser: „21. März – ausverkauft“." },
    { id: "preis", kind: "machine", label: "Preishinweis", code: '<p style="color:#b8b8b8">inkl. MwSt. und Vorverkaufsgebühr</p>' },
    { id: "kat", kind: "clean", label: "Auswahl Kategorie", code: '<label for="kat">Kategorie</label>\n<select id="kat">…</select>' },
    { id: "code", kind: "machine", label: "Gutscheincode", code: '<span>Gutscheincode</span>\n<input id="code">' },
    { id: "merken", kind: "machine", label: "Merken-Knopf", code: '<button class="icon">\n  <svg>…Herz…</svg>\n</button>' },
    { id: "kaufen", kind: "clean", label: "Warenkorb-Knopf", code: '<button type="button">In den Warenkorb</button>' },
    { id: "plan", kind: "human", label: "Link zum Hallenplan", code: 'Den Hallenplan gibt es <a href="plan.pdf">hier</a>.',
      why: "„hier“ sagt allein nichts. Viele Screenreader-Nutzer:innen lassen sich alle Links als Liste vorlesen – und hören dann: „hier, mehr, hier“. Besser: „Hallenplan (PDF, 2 MB)“." },
    { id: "fehler", kind: "human", label: "Newsletter-Fehlermeldung", code: '<label for="nl">E-Mail für den Newsletter</label>\n<input id="nl" value="bernd@">\n<p class="fehler">Fehler E-17</p>',
      why: "Die Meldung ist sichtbar und gut lesbar – aber niemand weiß, was falsch ist und wie man es behebt. Ob ein Text verständlich ist, prüft kein Roboter." },
    { id: "impressum", kind: "clean", label: "Link Impressum", code: '<a href="impressum.html">Impressum</a>' },
  ];
  var HEART = '<svg viewBox="0 0 24 24" width="22" height="22" focusable="false"><path d="M12 21s-7-4.4-9.5-9C.8 8.6 3 5 6.5 5c2 0 3.6 1.2 4.5 2.6C11.9 6.2 13.5 5 15.5 5 19 5 21.2 8.6 19.5 12 17 16.6 12 21 12 21z" fill="#c0392b"/></svg>';
  var L4 = {
    items: ITEMS,
    html: function () {
      var I = function (id, inner, tag) { return "<" + (tag || "div") + ' class="s-item" data-item="' + id + '">' + inner + "</" + (tag || "div") + ">"; };
      var h = '<div class="s-page">';
      h += '<header class="s-head">' + I("logo", '<img class="s-logo" src="' + IMG + 'logo.svg" alt="Klangwerk Tickets">') + "</header><main class=\"s-main\">";
      h += I("h1", "<h1>Hafenlichter – Open Air</h1>");
      h += '<div class="s-two"><div>' + I("plakat", '<img class="s-poster" src="' + IMG + 'plakat.svg" alt="IMG_4711.jpg">') + "</div><div>";
      h += I("termine-h", '<div class="s-fakeh">Termine</div>');
      h += I("termine", '<ul class="s-dates"><li>14. März</li><li style="color:#b4231a">21. März</li><li>28. März</li></ul><p class="s-note">Rot = ausverkauft</p>');
      h += '<div class="s-pricerow">' + I("ticket", '<img class="s-ticket" src="' + IMG + 'ticket.svg">') + '<span class="s-price">ab 49 €</span></div>';
      h += I("preis", '<p class="s-fine" style="color:#b8b8b8">inkl. MwSt. und Vorverkaufsgebühr</p>');
      h += I("kat", '<label for="s4-kat">Kategorie</label> <select id="s4-kat"><option>Stehplatz – 49 €</option><option>Sitzplatz – 69 €</option></select>');
      h += I("code", '<span>Gutscheincode</span> <input id="s4-code" class="s-input s-short">');
      h += '<div class="s-actions">' + I("kaufen", '<button class="s-btn s-primary" type="button">In den Warenkorb</button>') +
        I("merken", '<button class="s-icon" type="button">' + HEART + "</button>") + "</div>";
      h += I("plan", '<p>Den Hallenplan gibt es <a href="#plan">hier</a>.</p>');
      h += "</div></div>";
      h += I("fehler", '<div class="s-nl"><label for="s4-nl">E-Mail für den Newsletter</label> <input id="s4-nl" class="s-input s-short" value="bernd@"> <p class="s-fehler">Fehler E-17</p></div>');
      h += "</main><footer class=\"s-foot\">" + I("impressum", '<a href="#impressum">Impressum</a>') + "</footer></div>";
      return h;
    },
    init: function (root) {
      root.addEventListener("click", function (ev) { if (ev.target.closest("a[href^='#']")) ev.preventDefault(); });
    },
  };

  // ---------------- Screenreader-Simulator ----------------
  // Liest das Shop-HTML in der Reihenfolge, in der ein echter Screenreader es im Lesemodus anbietet:
  // Rolle, Name und Zustand. Was dort keine Rolle hat, kann man nicht bedienen.
  function file(src) { return (src || "").split("/").pop(); }
  function textOf(el) {
    var s = "";
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) s += n.textContent;
      else if (n.nodeType === 1 && !n.hidden) s += n.tagName === "IMG" ? (n.getAttribute("alt") || "") : textOf(n);
    });
    return s.replace(/\s+/g, " ").trim();
  }
  function readTree(root) {
    var out = [];
    function walk(node) {
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          var t = n.textContent.replace(/\s+/g, " ").trim();
          if (t) out.push({ el: n.parentElement, say: t });
          return;
        }
        if (n.nodeType !== 1 || n.hidden || n.getAttribute("aria-hidden") === "true") return;
        var tag = n.tagName;
        if (/^H[1-6]$/.test(tag)) { out.push({ el: n, say: "Überschrift Ebene " + tag[1] + ": " + textOf(n), heading: true }); return; }
        if (tag === "IMG") {
          var alt = n.getAttribute("alt");
          if (alt === "") return; // Deko: wird übersprungen
          out.push({ el: n, say: alt === null ? "Grafik, " + file(n.getAttribute("src")) : "Grafik: " + alt });
          return;
        }
        if (tag === "BUTTON") { var bn = n.getAttribute("aria-label") || textOf(n); out.push({ el: n, say: "Schalter: " + (bn || "unbeschriftet"), act: true }); return; }
        if (tag === "A" && n.hasAttribute("href")) { out.push({ el: n, say: "Link: " + textOf(n), act: true }); return; }
        if (tag === "LABEL" && n.querySelector("input")) {
          var inp = n.querySelector("input");
          out.push({ el: inp, radio: true, label: textOf(n), act: true });
          return;
        }
        if (tag === "INPUT") { out.push({ el: n, say: "Eingabefeld, " + (n.getAttribute("aria-label") || "unbeschriftet") }); return; }
        if (tag === "FIELDSET") {
          var lg = n.querySelector("legend");
          out.push({ el: n, say: "Gruppe: " + (lg ? textOf(lg) : "") });
          n.childNodes.forEach(function (c) { if (c !== lg) walk({ childNodes: [c] }); });
          return;
        }
        walk(n);
      });
    }
    walk(root);
    out.forEach(function (it) { // Zustand von Optionsfeldern ist live
      if (it.radio) it.say = "Optionsfeld: " + it.label + ", " + (it.el.checked ? "ausgewählt" : "nicht ausgewählt");
    });
    return out;
  }

  window.BF_SHOP = { 1: L1, 2: L2, 3: L3, 4: L4, readTree: readTree, items: ITEMS };
})();
