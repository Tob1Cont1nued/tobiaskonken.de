// 8-Bit-Szene: das Klangwerk bei Nacht. Über Treppe UND Rampe gehen Menschen zum Konzert –
// zu Fuß, im Rollstuhl, mit Blindenstock. Nach jedem gelösten Level gibt es ein kleines Feuerwerk.
(function () {
  var canvas = document.getElementById("bf-scene");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var W = canvas.width, H = canvas.height, GROUND = 104;
  var R = function (c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FONT = { K: "101101110101101", L: "100100100100111", A: "010101111101101", N: "111101101101101", G: "111100101101111",
    W: "101101101111101", E: "111100110100111", R: "110101110101101" };
  function label(text, x, y, col) {
    ctx.fillStyle = col;
    text.split("").forEach(function (ch, i) {
      var g = FONT[ch]; if (!g) return;
      for (var k = 0; k < 15; k++) if (g[k] === "1") ctx.fillRect(x + i * 4 + (k % 3), y + Math.floor(k / 3), 1, 1);
    });
  }
  var stars = [];
  for (var s = 0; s < 46; s++) stars.push({ x: (s * 97) % W, y: (s * 37) % 60, p: s % 7 });
  var clock = 0, sparks = [];

  // Gebäude: Tür bei x=300, Treppe von links, Rampe von rechts
  var DOOR_X = 300, DOOR_Y = GROUND - 22, FLOOR = GROUND - 8;
  function building() {
    R("#24242a", 236, 34, 150, FLOOR - 34);
    R("#2e2e35", 236, 34, 150, 4);
    // Schild
    R("#121214", 262, 42, 76, 13);
    label("KLANGWERK", 266, 46, clock % 2 < 1.6 ? "#d08a62" : "#e3ad8d");
    // Fenster
    for (var i = 0; i < 4; i++) {
      var on = (Math.floor(clock * 2) + i) % 5 !== 0;
      R(on ? "#d9b56a" : "#3a3a42", 248 + i * 34, 62, 10, 8);
    }
    // Tür, offen und warm
    R("#d9b56a", DOOR_X - 8, DOOR_Y, 16, 14);
    R("#f2d999", DOOR_X - 6, DOOR_Y + 2, 12, 12);
    // Plattform vor der Tür
    R("#4a4a52", 270, FLOOR, 62, 3);
    // Treppe links
    for (var t = 0; t < 4; t++) R("#4a4a52", 246 + t * 6, GROUND - (t + 1) * 2, 6, (t + 1) * 2);
    // Rampe rechts (sanft)
    for (var r = 0; r < 56; r++) R("#5a5a63", 332 + r, FLOOR + 3 + Math.floor(r / 56 * 6) - 1, 1, 7 - Math.floor(r / 56 * 6));
    R("#7a7a84", 332, FLOOR - 3, 56, 1); // Geländer
    for (var g = 0; g < 56; g += 14) R("#7a7a84", 332 + g, FLOOR - 3, 1, 4);
  }
  function ground() {
    R("#18181c", 0, GROUND, W, H - GROUND);
    R("#202026", 0, GROUND, W, 1);
  }
  function sky() {
    R("#0e0e18", 0, 0, W, GROUND);
    R("#141426", 0, 50, W, GROUND - 50);
    stars.forEach(function (st) { if ((Math.floor(clock * 2) + st.p) % 9) R("#c9c6bd", st.x, st.y, 1, 1); });
    R("#e8e6df", 420, 14, 8, 8); R("#0e0e18", 423, 13, 6, 6); // Mond
    // Scheinwerfer
    var a = Math.sin(clock * 0.8) * 30;
    ctx.fillStyle = "rgba(208,138,98,.10)";
    ctx.beginPath(); ctx.moveTo(250, 34); ctx.lineTo(210 + a, 0); ctx.lineTo(240 + a, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(372, 34); ctx.lineTo(380 - a, 0); ctx.lineTo(410 - a, 0); ctx.fill();
  }

  // Figuren: kind 0 = zu Fuß, 1 = Rollstuhl, 2 = Blindenstock
  var people = [
    { kind: 1, side: 1, t: 0.0, speed: 0.045, col: "#7fbf98" },
    { kind: 0, side: -1, t: 0.25, speed: 0.06, col: "#e3ad8d" },
    { kind: 2, side: -1, t: 0.55, speed: 0.04, col: "#d9b56a" },
    { kind: 0, side: 1, t: 0.75, speed: 0.055, col: "#9a9ad8" },
  ];
  function pathY(side, x) {
    if (side < 0) { // von links: Boden, dann Treppe
      if (x < 246) return GROUND;
      if (x < 270) return GROUND - (Math.floor((x - 246) / 6) + 1) * 2;
      return FLOOR;
    }
    if (x > 388) return GROUND; // von rechts: Boden, dann Rampe
    if (x > 332) return FLOOR + 3 + Math.floor((x - 332) / 56 * 5);
    return FLOOR;
  }
  function person(p) {
    var x = p.side < 0 ? 10 + p.t * (DOOR_X - 10) : W - 10 - p.t * (W - 10 - DOOR_X);
    var y = pathY(p.side, x), step = Math.floor(clock * 6 + p.t * 10) % 2;
    if (p.kind === 1) { // Rollstuhl
      R(p.col, x - 1, y - 12, 3, 3);
      R(p.col, x - 2, y - 9, 4, 4);
      R("#c9c6bd", x - 4, y - 6, 7, 1); R("#c9c6bd", x + (p.side < 0 ? -4 : 2), y - 10, 1, 5);
      R("#c9c6bd", x - 4, y - 4, 1, 1); R("#c9c6bd", x + 2, y - 4, 1, 1);
      R("#8a8790", x - 3, y - 4, 5, 4); R("#18181c", x - 2, y - 3, 3, 2);
      return;
    }
    R(p.col, x - 1, y - 14, 3, 3);
    R(p.col, x - 2, y - 11, 4, 6);
    R("#55555c", x - 2 + step, y - 5, 1, 5); R("#55555c", x + 1 - step, y - 5, 1, 5);
    if (p.kind === 2) { // Blindenstock, weiß mit roter Spitze
      var d = p.side < 0 ? 1 : -1;
      for (var i = 0; i < 6; i++) R("#e8e6df", x + d * (3 + i), y - 9 + i + 1, 1, 1);
      R("#e08a80", x + d * 9, y - 2, 1, 1);
    }
  }

  function firework() {
    var cx = 120 + Math.random() * 240, cy = 14 + Math.random() * 24, cols = ["#d08a62", "#d9b56a", "#7fbf98", "#e3ad8d"];
    for (var i = 0; i < 26; i++) {
      var a = i / 26 * Math.PI * 2, v = 0.6 + Math.random() * 0.6;
      sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 60, col: cols[i % cols.length] });
    }
  }

  function frame() {
    sky(); ground(); building();
    people.forEach(person);
    sparks.forEach(function (k) { k.x += k.vx; k.y += k.vy; k.vy += 0.012; k.life--; if (k.life > 0) R(k.col, k.x, k.y, 1, 1); });
    sparks = sparks.filter(function (k) { return k.life > 0; });
  }
  var visible = true, last = 0;
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (visible) {
      clock += dt;
      people.forEach(function (p) { p.t += p.speed * dt; if (p.t > 1) p.t = 0; });
      frame();
    }
    requestAnimationFrame(loop);
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
  if (reduce) { clock = 1; frame(); } else requestAnimationFrame(loop);

  window.BF_SCENE = {
    celebrate: function () {
      if (reduce) return;
      firework(); setTimeout(firework, 400); setTimeout(firework, 900);
    },
  };
})();
