// Sortierbot – 8-Bit-Szene: Förderband, Roboter, zwei Körbe und der Trainingsstapel.
// Die Ziel-Mail (gelb, mit "P") landet in dem Korb, den der Bot gerade tatsächlich wählt.
(function () {
  var canvas = document.getElementById("sb-scene");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var W = canvas.width, H = canvas.height, BELT_Y = 88, ROBOT_X = 300, OK_X = 372, SPAM_X = 432;
  var R = function (c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  var state = { verdict: "spam", poison: 0, alarm: false };
  var letters = [], flying = [], drops = [], sparks = [], nextLetter = 0, count = 0, clock = 0, eyes = 0;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Winzige Pixelschrift (3×5) für die Beschriftungen
  var FONT = { O: "111101101101111", K: "101101110101101", S: "111100111001111", P: "111101111100100", A: "010101111101101", M: "101111101101101",
    T: "111010010010010", R: "110101110101101", I: "111010010010111", N: "111101101101101", G: "111100101101111", E: "111100110100111", L: "100100100100111" };
  function label(text, x, y, col, size) {
    var s = size || 1;
    ctx.fillStyle = col;
    text.split("").forEach(function (ch, i) {
      var g = FONT[ch]; if (!g) return;
      for (var k = 0; k < 15; k++) if (g[k] === "1") ctx.fillRect(x + i * 4 * s + (k % 3) * s, y + Math.floor(k / 3) * s, s, s);
    });
  }

  function envelope(x, y, kind) {
    var paper = kind === "target" ? "#d9b56a" : kind === "poison" ? "#8a6ab0" : "#e8e6df";
    var line = kind === "target" ? "#8a6a28" : kind === "poison" ? "#4a3070" : "#9a978e";
    R(line, x - 1, y - 1, 14, 10); R(paper, x, y, 12, 8);
    R(line, x + 1, y + 1, 2, 1); R(line, x + 3, y + 2, 2, 1); R(line, x + 5, y + 3, 2, 1); R(line, x + 7, y + 2, 2, 1); R(line, x + 9, y + 1, 2, 1);
    if (kind === "target") { R("#121214", x + 5, y + 4, 2, 3); R("#121214", x + 7, y + 4, 1, 1); R("#121214", x + 7, y + 5, 1, 1); }
    if (kind === "poison") { R("#e8e6df", x + 4, y + 4, 4, 2); R("#121214", x + 5, y + 4, 1, 1); R("#121214", x + 7, y + 4, 1, 1); R("#e8e6df", x + 5, y + 6, 2, 1); }
  }

  function drawRoom() {
    R("#121214", 0, 0, W, H);
    R("#1a1a1d", 0, 0, W, BELT_Y + 6);
    for (var x = 0; x < W; x += 24) R("#202024", x, 0, 1, BELT_Y + 6); // Wandfugen
    R("#222226", 0, BELT_Y + 18, W, H - BELT_Y - 18);
    // Fenster mit Schild "POST"
    R("#34343a", 150, 14, 70, 26); R("#121214", 153, 17, 64, 20);
    label("POSTSTELLE", 166, 24, "#d08a62");
  }

  function drawPile() {
    // Trainingsstapel links oben: echte Briefe (hell) und eingeschmuggelte (lila)
    R("#34343a", 14, 62, 64, 4);
    label("TRAINING", 30, 70, "#9a978e");
    for (var i = 0; i < 4; i++) envelope(20 + (i % 2) * 22, 52 - Math.floor(i / 2) * 9, "plain");
    for (var j = 0; j < state.poison; j++) envelope(46 + (j % 2) * 14, 52 - Math.floor(j / 2) * 9 - (j > 1 ? 9 : 0), "poison");
  }

  function drawBelt() {
    R("#34343a", 0, BELT_Y, ROBOT_X - 6, 6);
    var off = Math.floor(clock * 30) % 8;
    for (var x = -8 + off; x < ROBOT_X - 6; x += 8) R("#55555c", x, BELT_Y + 2, 4, 2);
    R("#55555c", 0, BELT_Y + 6, ROBOT_X - 6, 2);
    for (var k = 10; k < ROBOT_X - 6; k += 40) R("#2b2b30", k, BELT_Y + 8, 4, 10);
  }

  function drawBins() {
    [[OK_X, "#7fbf98", "OK"], [SPAM_X, "#e08a80", "SPAM"]].forEach(function (b) {
      R("#121214", b[0] - 1, BELT_Y - 13, 34, 32);
      R(b[1], b[0], BELT_Y - 12, 32, 30);
      R("rgba(0,0,0,.25)", b[0] + 2, BELT_Y - 10, 28, 4);
      label(b[2], b[0] + (b[2] === "OK" ? 12 : 9), BELT_Y + 3, "#121214");
    });
  }

  function drawRobot() {
    var x = ROBOT_X, y = BELT_Y - 46, bob = reduce ? 0 : Math.round(Math.sin(clock * 3) * 1);
    R("#55555c", x + 10, y + 40 + 6, 4, 10); R("#55555c", x + 24, y + 40 + 6, 4, 10);   // Beine
    R("#121214", x - 1, y + 17 + bob, 40, 30); R("#9a978e", x, y + 18 + bob, 38, 28);  // Körper
    R("#b9b5ab", x + 4, y + 22 + bob, 30, 6); R("#55555c", x + 8, y + 32 + bob, 22, 8);
    R("#121214", x + 3, y - 1 + bob, 32, 20); R("#b9b5ab", x + 4, y + bob, 30, 18);     // Kopf
    R("#121214", x + 7, y + 4 + bob, 24, 10);                                            // Bildschirm
    var col = state.verdict === "ok" ? "#7fbf98" : "#e08a80";
    if (eyes > 0) col = "#d9b56a";
    R(col, x + 10, y + 7 + bob, 5, 4); R(col, x + 23, y + 7 + bob, 5, 4);
    R("#55555c", x + 18, y - 8 + bob, 2, 8);                                             // Antenne
    var blink = state.alarm && Math.floor(clock * 4) % 2;
    R(blink ? "#ff5a40" : (state.alarm ? "#7a2a20" : "#d08a62"), x + 16, y - 11 + bob, 6, 4);
    // Arm zeigt in Richtung des Korbs
    var target = state.verdict === "ok" ? OK_X : SPAM_X, reach = (target - x - 38) / 70;
    R("#9a978e", x + 38, y + 24 + bob, 12 + Math.round(reach * 10), 4);
  }

  function spawn() {
    count++;
    var kind = count % 4 === 0 ? "target" : "plain";
    var dest = kind === "target" ? state.verdict : (Math.random() < 0.5 ? "ok" : "spam");
    letters.push({ x: -14, y: BELT_Y - 8, kind: kind, dest: dest });
  }

  function step(dt) {
    clock += dt;
    if (eyes > 0) eyes -= dt;
    if (clock >= nextLetter) { spawn(); nextLetter = clock + 1.6; }
    letters.forEach(function (l) { l.x += 34 * dt; });
    letters = letters.filter(function (l) {
      if (l.x < ROBOT_X - 16) return true;
      var dest = l.kind === "target" ? state.verdict : l.dest;
      flying.push({ x: l.x, y: l.y, kind: l.kind, sx: l.x, sy: l.y, tx: (dest === "ok" ? OK_X : SPAM_X) + 10, ty: BELT_Y - 10, p: 0 });
      return false;
    });
    flying.forEach(function (f) {
      f.p += dt * 1.3;
      var p = Math.min(1, f.p);
      f.x = f.sx + (f.tx - f.sx) * p; f.y = f.sy + (f.ty - f.sy) * p - Math.sin(p * Math.PI) * 34;
    });
    flying = flying.filter(function (f) { return f.p < 1; });
    drops.forEach(function (d) { d.y += 90 * dt; });
    drops = drops.filter(function (d) { return d.y < 44; });
    sparks.forEach(function (s) { s.life -= dt; s.vy += 60 * dt; s.x += s.vx * dt; s.y += s.vy * dt; });
    sparks = sparks.filter(function (s) { return s.life > 0; });
  }

  function draw() {
    drawRoom(); drawPile(); drawBelt(); drawBins(); drawRobot();
    letters.forEach(function (l) { envelope(l.x, l.y, l.kind); });
    flying.forEach(function (f) { envelope(f.x, f.y, f.kind); });
    drops.forEach(function (d) { envelope(d.x, d.y, "poison"); });
    sparks.forEach(function (s) { R(s.life > 0.4 ? "#d9b56a" : "#fff4c0", s.x, s.y, 2, 2); });
  }

  var last = performance.now(), running = false, raf = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt); draw();
    if (running) raf = requestAnimationFrame(loop);
  }
  if (reduce) {
    letters = [{ x: 120, y: BELT_Y - 8, kind: "target", dest: "spam" }, { x: 210, y: BELT_Y - 8, kind: "plain", dest: "ok" }];
    draw();
  } else {
    new IntersectionObserver(function (entries) {
      var v = entries[0].isIntersecting;
      if (v && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
      else if (!v && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
    draw();
  }

  window.SB_SCENE = {
    update: function (s) { state = Object.assign(state, s); if (reduce) draw(); },
    drop: function () { if (!reduce) drops.push({ x: 50, y: 0 }); eyes = 0.6; },
    celebrate: function () {
      eyes = 2;
      for (var i = 0; i < 30; i++) sparks.push({ x: OK_X + 16, y: BELT_Y - 14, vx: Math.cos(i) * (20 + (i % 5) * 8), vy: -30 - (i % 7) * 6, life: 1 + (i % 4) * 0.2 });
      if (reduce) draw();
    },
  };
})();
