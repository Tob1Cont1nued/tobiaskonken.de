// Versteckter Admin-Modus: Texte direkt auf der Seite ändern und als Commit ins Repo speichern.
// Wird nur geladen per Doppelklick auf „exit 0“ im Footer oder mit #admin in der Adresse (siehe script.js).
// Speichern braucht ein GitHub-Token (fine-grained, nur dieses Repo, Contents: Read and write).
// Das Token liegt nur in diesem Browser – nie im Repo. Nach dem Commit laufen die Tests, dann geht die Seite live.
(function () {
  "use strict";
  if (window.__adminReady) return;
  window.__adminReady = true;

  var REPO = "Tob1Cont1nued/tobiaskonken.de", BRANCH = "main";
  var API = "https://api.github.com/repos/" + REPO + "/contents/";
  var FILE = location.pathname.replace(/^\//, "").replace(/(^|\/)$/, "$1index.html");
  var TOKEN_KEY = "admin-token";

  // Nur Blöcke, die ausschließlich Text und solche Inline-Elemente enthalten, werden bearbeitbar
  var INLINE = { SPAN: 1, A: 1, B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, CODE: 1, SMALL: 1, ABBR: 1, SUP: 1, SUB: 1, MARK: 1, KBD: 1, S: 1, U: 1, Q: 1, TIME: 1 };
  var SKIP = { SCRIPT: 1, STYLE: 1, SVG: 1, BUTTON: 1, INPUT: 1, SELECT: 1, TEXTAREA: 1, CANVAS: 1, NOSCRIPT: 1, TEMPLATE: 1, IFRAME: 1, VIDEO: 1, AUDIO: 1, DIALOG: 1 };
  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
  var RAW = { script: 1, style: 1, textarea: 1, title: 1 };

  var token = null, entries = [], editing = false;
  try { token = localStorage.getItem(TOKEN_KEY); } catch (e) {}

  // ---------- Hilfen ----------
  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function b64decode(s) {
    var bin = atob(s.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  function b64encode(s) {
    var bytes = new TextEncoder().encode(s), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function api(method, body) {
    var url = API + FILE + (method === "GET" ? "?ref=" + BRANCH + "&t=" + Date.now() : "");
    return fetch(url, {
      method: method, cache: "no-store",
      headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || "HTTP " + r.status); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function loadSource() {
    return api("GET").then(function (j) { return { raw: b64decode(j.content), sha: j.sha }; });
  }

  // Elementpfad ab <body>: Index unter den Element-Kindern, z. B. "3/0/2"
  function byPath(root, path) {
    var el = root;
    path.split("/").forEach(function (i) { el = el && el.children[Number(i)]; });
    return el || null;
  }
  function inlineOnly(el) {
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      if (!INLINE[c.tagName] || !inlineOnly(c)) return false;
    }
    return true;
  }
  function collect(el, path, out) {
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i], p = path.concat(i);
      if (SKIP[c.tagName] || c.hasAttribute("data-noedit")) continue;
      if (inlineOnly(c)) { if (norm(c.textContent)) out.push({ path: p.join("/"), src: c }); }
      else collect(c, p, out);
    }
    return out;
  }

  // Liest den Quelltext und merkt sich für jeden Elementpfad, wo dessen Inhalt im Text steht.
  // So wird beim Speichern nur der geänderte Inhalt ersetzt – der Rest der Datei bleibt Zeichen für Zeichen gleich.
  function ranges(raw) {
    var re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
    var stack = null, map = {}, m, low = raw.toLowerCase();
    while ((m = re.exec(raw))) {
      if (!m[2]) continue;
      var tag = m[2].toLowerCase(), close = m[1] === "/";
      if (!close && RAW[tag]) { // Inhalt von script/style überspringen
        var end = low.indexOf("</" + tag, re.lastIndex);
        if (end < 0) break;
        re.lastIndex = end;
        if (stack) stack[stack.length - 1].n++;
        continue;
      }
      if (!stack) { if (!close && tag === "body") stack = [{ tag: "body", path: [], n: 0 }]; continue; }
      if (close) {
        var k = stack.length - 1;
        while (k > 0 && stack[k].tag !== tag) k--;
        if (k <= 0) { if (tag === "body") break; continue; }
        stack.length = k + 1;
        var e = stack.pop();
        map[e.path.join("/")] = [e.start, m.index];
        continue;
      }
      var parent = stack[stack.length - 1], path = parent.path.concat(parent.n++);
      if (VOID[tag] || /\/\s*$/.test(m[3])) continue;
      stack.push({ tag: tag, path: path, n: 0, start: re.lastIndex });
    }
    return map;
  }
  function textOfHtml(html) { var t = document.createElement("template"); t.innerHTML = html; return norm(t.content.textContent); }

  // Bearbeitbare Blöcke im Quelltext: Pfad → Stelle im Text, Tag und Textinhalt
  function blocks(raw) {
    var doc = new DOMParser().parseFromString(raw, "text/html"), map = ranges(raw), out = [];
    collect(doc.body, [], []).forEach(function (c) {
      var r = map[c.path], text = norm(c.src.textContent);
      if (!r || textOfHtml(raw.slice(r[0], r[1])) !== text) return; // Quelltext nicht eindeutig zuzuordnen
      out.push({ path: c.path, tag: c.src.tagName, text: text, range: r });
    });
    return out;
  }
  // Ordnet sie den Elementen auf der Seite zu – nur solchen, die noch genau wie im Quelltext aussehen
  function match(raw) {
    return blocks(raw).filter(function (b) {
      var live = byPath(document.body, b.path);
      if (!live || live.tagName !== b.tag || norm(live.textContent) !== b.text) return false; // per JS verändert
      b.el = live;
      return true;
    });
  }

  // ---------- Oberfläche ----------
  var css = document.createElement("style");
  css.textContent =
    ".adm-panel{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:min(340px,calc(100vw - 32px));background:#121214;color:#e6e6e6;border:1px solid #d08a62;border-radius:10px;padding:12px 14px;font:13px/1.45 ui-monospace,Consolas,monospace;box-shadow:0 10px 30px rgba(0,0,0,.5)}" +
    ".adm-panel h2{margin:0 0 8px;font-size:13px;color:#d08a62}.adm-panel p{margin:6px 0}.adm-panel a{color:#d08a62}" +
    ".adm-panel input[type=password]{width:100%;box-sizing:border-box;margin:4px 0;padding:6px 8px;background:#1c1c20;color:#e6e6e6;border:1px solid #444;border-radius:6px;font:inherit}" +
    ".adm-panel .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}" +
    ".adm-panel button{font:inherit;padding:6px 10px;border-radius:6px;border:1px solid #555;background:#1c1c20;color:#e6e6e6;cursor:pointer}" +
    ".adm-panel button.pri{background:#d08a62;border-color:#d08a62;color:#121214;font-weight:700}.adm-panel button:disabled{opacity:.5;cursor:default}" +
    ".adm-panel .st{min-height:1.4em;color:#9aa0a6}.adm-panel .st.bad{color:#f28b82}.adm-panel .st.ok{color:#81c995}" +
    ".adm-edit{outline:1px dashed rgba(208,138,98,.7)!important;outline-offset:2px;cursor:text}.adm-edit:focus{outline:2px solid #d08a62!important}" +
    ".adm-dirty{outline:2px solid #e5c07b!important;background:rgba(229,192,123,.08)}";
  document.head.appendChild(css);

  var panel = document.createElement("section");
  panel.className = "adm-panel";
  panel.setAttribute("aria-label", "Admin");
  panel.setAttribute("data-noedit", "");
  document.body.appendChild(panel);

  function status(text, cls) { var s = panel.querySelector(".st"); if (s) { s.className = "st " + (cls || ""); s.textContent = text; } }
  function dirty() { return entries.filter(function (e) { return e.el.innerHTML !== e.orig; }); }

  function render() {
    if (!token) {
      panel.innerHTML =
        "<h2>admin@" + location.hostname + "</h2>" +
        "<p>Zum Speichern brauchst du ein GitHub-Token: <a href=\"https://github.com/settings/personal-access-tokens/new\" target=\"_blank\" rel=\"noopener\">fine-grained Token anlegen</a> → Repository access: nur <b>tobiaskonken.de</b> → Permissions: <b>Contents: Read and write</b>.</p>" +
        "<label>Token<input type=\"password\" autocomplete=\"off\" spellcheck=\"false\"></label>" +
        "<label><input type=\"checkbox\" checked> in diesem Browser merken</label>" +
        "<div class=\"row\"><button class=\"pri\" data-a=\"token\">Weiter</button><button data-a=\"close\">✕</button></div><p class=\"st\" role=\"status\"></p>";
      return;
    }
    if (!editing) {
      panel.innerHTML =
        "<h2>admin@" + location.hostname + "</h2><p>Datei: <b>" + FILE + "</b></p>" +
        "<div class=\"row\"><button class=\"pri\" data-a=\"start\">✏ Bearbeiten</button><button data-a=\"forget\">Token vergessen</button><button data-a=\"close\">✕</button></div><p class=\"st\" role=\"status\"></p>";
      return;
    }
    var n = dirty().length;
    panel.innerHTML =
      "<h2>admin@" + location.hostname + " · bearbeiten</h2>" +
      "<p>" + entries.length + " Texte bearbeitbar (gestrichelt) · <b class=\"cnt\">" + n + "</b> geändert. Sprache umschalten, um die andere Fassung zu ändern.</p>" +
      "<div class=\"row\"><button class=\"pri\" data-a=\"save\"" + (n ? "" : " disabled") + ">💾 Speichern</button><button data-a=\"undo\"" + (n ? "" : " disabled") + ">↺ Verwerfen</button><button data-a=\"stop\">Beenden</button></div><p class=\"st\" role=\"status\"></p>";
  }
  function refreshCount() {
    if (!editing) return;
    var n = dirty().length, c = panel.querySelector(".cnt");
    if (c) c.textContent = n;
    panel.querySelector('[data-a="save"]').disabled = !n;
    panel.querySelector('[data-a="undo"]').disabled = !n;
    entries.forEach(function (e) { e.el.classList.toggle("adm-dirty", e.el.innerHTML !== e.orig); });
  }

  function start() {
    status("Lade " + FILE + " …");
    loadSource().then(function (src) {
      entries = match(src.raw);
      entries.forEach(function (e) {
        e.orig = e.el.innerHTML;
        e.el.contentEditable = "true";
        e.el.classList.add("adm-edit");
      });
      document.querySelectorAll("details").forEach(function (d) { d.open = true; });
      editing = true;
      render();
      status(entries.length ? "Klick in einen Text und schreib los." : "Keine bearbeitbaren Texte gefunden.", entries.length ? "" : "bad");
    }).catch(function (e) {
      if (e.status === 401) { forget(); status("Token ungültig oder abgelaufen.", "bad"); }
      else status("Laden fehlgeschlagen: " + e.message, "bad");
    });
  }
  function stop() {
    if (dirty().length && !confirm("Ungespeicherte Änderungen verwerfen?")) return;
    entries.forEach(function (e) {
      e.el.innerHTML = e.orig;
      e.el.removeAttribute("contenteditable");
      e.el.classList.remove("adm-edit", "adm-dirty");
    });
    entries = []; editing = false; render();
  }
  function undo() { dirty().forEach(function (e) { e.el.innerHTML = e.orig; }); refreshCount(); status("Änderungen verworfen."); }
  function forget() { token = null; try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} render(); }

  function save() {
    var changed = dirty();
    if (!changed.length) return;
    panel.querySelector('[data-a="save"]').disabled = true;
    status("Speichere " + changed.length + " Änderung(en) …");
    loadSource().then(function (src) { // frisch laden: Datei kann sich inzwischen geändert haben
      var now = {};
      blocks(src.raw).forEach(function (b) { now[b.path] = b; });
      var missing = changed.filter(function (e) { return !now[e.path] || now[e.path].text !== e.text; });
      if (missing.length) throw new Error("Die Datei wurde inzwischen anderswo geändert. Seite neu laden und nochmal versuchen.");
      var raw = src.raw;
      changed
        .map(function (e) { return { r: now[e.path].range, html: e.el.innerHTML.replace(/(<br>)+$/, "") }; })
        .sort(function (a, b) { return b.r[0] - a.r[0]; })
        .forEach(function (c) { raw = raw.slice(0, c.r[0]) + c.html + raw.slice(c.r[1]); });
      var msg = "Admin: " + changed.length + " Text" + (changed.length > 1 ? "e" : "") + " in " + FILE + " geändert";
      return api("PUT", { message: msg, content: b64encode(raw), sha: src.sha, branch: BRANCH });
    }).then(function (res) {
      changed.forEach(function (e) { e.orig = e.el.innerHTML; e.text = norm(e.el.textContent); });
      refreshCount();
      var c = res.commit || {};
      status("✔ Gespeichert (" + String(c.sha || "").slice(0, 7) + "). Nach den Tests in ca. 2–3 Minuten live.", "ok");
    }).catch(function (e) {
      refreshCount();
      if (e.status === 401) status("Token ungültig oder abgelaufen.", "bad");
      else if (e.status === 403 || e.status === 404) status("Keine Schreibrechte: Token braucht Contents „Read and write“ für tobiaskonken.de.", "bad");
      else if (e.status === 409) status("Konflikt: Datei wurde gleichzeitig geändert. Nochmal speichern.", "bad");
      else status("Speichern fehlgeschlagen: " + e.message, "bad");
    });
  }

  panel.addEventListener("click", function (ev) {
    var a = ev.target.closest("[data-a]");
    if (!a) return;
    var act = a.dataset.a;
    if (act === "token") {
      var v = panel.querySelector("input[type=password]").value.trim();
      if (!v) { status("Bitte ein Token eintragen.", "bad"); return; }
      token = v;
      if (panel.querySelector("input[type=checkbox]").checked) { try { localStorage.setItem(TOKEN_KEY, v); } catch (e) {} }
      render(); start();
    }
    if (act === "start") start();
    if (act === "forget") forget();
    if (act === "save") save();
    if (act === "undo") undo();
    if (act === "stop") stop();
    if (act === "close") { if (editing) { stop(); if (editing) return; } panel.remove(); css.remove(); window.__adminReady = false; window.__adminLoaded = false; }
  });

  // ---------- Bearbeiten ----------
  function editable(t) { return editing && t && t.closest && t.closest(".adm-edit"); }
  document.addEventListener("input", function (ev) { if (editable(ev.target)) refreshCount(); }, true);
  document.addEventListener("keydown", function (ev) {
    if (!editable(ev.target)) return;
    if (ev.key === "Enter") ev.preventDefault(); // keine neuen Absätze: die Struktur der Seite bleibt
    if (ev.key === "Escape") ev.target.blur();
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "s") { ev.preventDefault(); save(); }
  }, true);
  document.addEventListener("paste", function (ev) {
    if (!editable(ev.target)) return;
    ev.preventDefault(); // nur reiner Text, keine fremden Formatierungen
    var text = (ev.clipboardData || window.clipboardData).getData("text/plain").replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, text);
  }, true);
  document.addEventListener("click", function (ev) {
    if (!editing) return;
    if (editable(ev.target) || (ev.target.closest && ev.target.closest("summary"))) ev.preventDefault(); // Links nicht folgen, Details nicht zuklappen
  }, true);
  window.addEventListener("beforeunload", function (ev) { if (dirty().length) { ev.preventDefault(); ev.returnValue = ""; } });

  render();
  if (token) start();
})();
