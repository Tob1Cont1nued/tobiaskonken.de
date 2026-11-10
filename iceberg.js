// Kopfbild im Assessment-Kasten: 8-Bit-Eisberg. Oben die kleine Spitze mit Robben, Möwen und Sonne,
// unter Wasser der große, unsichtbare Teil.
(function () {
  const canvas = document.getElementById("iceberg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width, H = canvas.height, WL = 58; // WL = Wasserlinie
  const CX = 238;                                     // Mitte des Eisbergs

  const R = (col, x, y, w, h) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- Himmel, Sonne, Wolken ----------
  const SKY = ["#4f93d6", "#5f9fdc", "#71ace2", "#86bae8", "#9cc8ee", "#b4d8f3", "#cbe6f7"];
  function drawSky() {
    const band = Math.ceil(WL / SKY.length);
    for (let i = 0; i < SKY.length; i++) {
      R(SKY[i], 0, i * band, W, band);
      if (i + 1 < SKY.length) { ctx.fillStyle = SKY[i + 1]; for (let x = i % 2; x < W; x += 2) ctx.fillRect(x, (i + 1) * band - 1, 1, 1); }
    }
  }

  const SUN = [410, 18, 9];
  function drawSun(t) {
    const [sx, sy, r] = SUN;
    // Strahlen: drehen sich langsam und pulsieren
    ctx.fillStyle = "#fff1a8";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.15;
      const len = 5 + (i % 2 ? 2 : 5) + Math.sin(t * 2 + i) * 1.5;
      for (let d = r + 3; d < r + 3 + len; d += 1) {
        if ((d | 0) % 2) continue; // gestrichelt wirkt pixeliger
        ctx.fillRect(Math.round(sx + Math.cos(a) * d), Math.round(sy + Math.sin(a) * d), 1, 1);
      }
    }
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      ctx.fillStyle = x * x + y * y > (r - 2) * (r - 2) ? "#ffd84a" : (y < -2 && x < 2 ? "#fffbe0" : "#ffe97a");
      ctx.fillRect(sx + x, sy + y, 1, 1);
    }
  }

  let clouds = [[40, 12, 54], [300, 8, 40], [150, 22, 34]].map(([x, y, w]) => ({ x, y, w, v: rnd(1.5, 3) }));
  let nextCloud = rnd(10, 18);
  function drawClouds(clock, dt) {
    if (clock >= nextCloud && clouds.length < 4) {
      const w = Math.round(rnd(30, 60));
      clouds.push({ x: -w - 10, y: Math.round(rnd(6, 30)), w, v: rnd(2, 4) });
      nextCloud = clock + rnd(10, 18);
    }
    clouds.forEach((c) => {
      c.x += c.v * dt;
      R("#f4fbff", c.x, c.y, c.w, 3);
      R("#f4fbff", c.x + 6, c.y - 3, c.w - 18, 3);
      R("#d8ecf8", c.x + 2, c.y + 3, c.w - 4, 1);
    });
    clouds = clouds.filter((c) => c.x < W + 10);
  }

  // ---------- Wasser und der große Teil unter Wasser ----------
  const SEA = ["#2f86c4", "#2777b4", "#1f68a2", "#185890", "#124a7c", "#0d3c68", "#093056", "#062546"];
  // feste, leicht unregelmäßige Kontur des Unterwasser-Eisbergs
  const BODY = [];
  for (let y = WL; y < H; y++) {
    const p = (y - WL) / (H - WL);
    const hw = 46 + 150 * Math.pow(Math.sin(Math.min(1, p * 1.25) * Math.PI * 0.62), 0.9) * (p > 0.9 ? 1 - (p - 0.9) * 4 : 1);
    const wob = Math.round(Math.sin(y * 0.37) * 3 + Math.sin(y * 0.11 + 1) * 5 + ((y * 7) % 5) - 2);
    BODY.push([Math.round(CX - hw + wob), Math.round(CX + hw * 0.92 + wob * 0.6)]);
  }
  // feste Lichtfacetten im Eis (kurze, versetzte Kanten)
  const FACETS = [];
  for (let k = 0; k < 26; k++) {
    const i = 4 + ((k * 37) % (BODY.length - 14)), [l, r] = BODY[i];
    const x = l + 8 + ((k * 53) % Math.max(10, Math.round((r - l) * 0.55)));
    FACETS.push([x, i, 4 + (k % 4) * 3]);
  }
  function drawWater(t, bob) {
    const band = Math.ceil((H - WL) / SEA.length);
    for (let i = 0; i < SEA.length; i++) R(SEA[i], 0, WL + i * band, W, band);
    // Lichtstrahlen unter Wasser
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let k = 0; k < 6; k++) {
      const x0 = ((k * 97 + t * 4) % (W + 80)) - 40;
      for (let y = WL; y < H; y += 1) ctx.fillRect(Math.round(x0 + (y - WL) * 0.45), y, 10, 1);
    }
    // der große Teil des Eisbergs
    BODY.forEach(([l, r], i) => {
      const y = WL + i + bob;
      const p = i / BODY.length;
      ctx.fillStyle = `rgba(170, 222, 242, ${(0.62 - p * 0.3).toFixed(2)})`;
      ctx.fillRect(l, y, r - l, 1);
      ctx.fillStyle = `rgba(110, 180, 215, ${(0.5 - p * 0.25).toFixed(2)})`; // Schattenseite
      ctx.fillRect(Math.round(l + (r - l) * 0.62), y, Math.round((r - l) * 0.38), 1);
    });
    ctx.fillStyle = "rgba(230, 248, 255, 0.35)";
    FACETS.forEach(([x, i, len]) => { ctx.fillRect(x, WL + i + bob, len, 1); ctx.fillRect(x + 1, WL + i + bob + 1, Math.max(1, len - 3), 1); });
  }

  // ---------- Fische und Blasen ----------
  let fish = [{ x: 60, y: WL + 52, v: 8 }, { x: 420, y: WL + 74, v: -6 }];
  let bubbles = [];
  function drawLife(dt) {
    fish.forEach((f) => {
      f.x += f.v * dt;
      if (f.x > W + 10) f.x = -10; if (f.x < -10) f.x = W + 10;
      const d = Math.sign(f.v);
      R("#f0a040", f.x, f.y, 4, 2); R("#f0a040", f.x - 2 * d + (d < 0 ? 4 : 0), f.y - 1 + 0, 1, 4);
      R("#101820", f.x + (d > 0 ? 3 : 0), f.y, 1, 1);
    });
    if (Math.random() < dt * 1.2) bubbles.push({ x: rnd(CX - 120, CX + 120), y: H - 4, v: rnd(8, 14) });
    ctx.fillStyle = "rgba(220, 245, 255, 0.7)";
    bubbles.forEach((b) => { b.y -= b.v * dt; ctx.fillRect(Math.round(b.x + Math.sin(b.y * 0.3)), Math.round(b.y), 1, 1); });
    bubbles = bubbles.filter((b) => b.y > WL + 2);
  }

  // ---------- Die kleine Spitze über Wasser ----------
  const ICE = "#f4fbff", ICE_SHADE = "#c4e4f4", ICE_DARK = "#9ccbe4";
  function drawTip(bob) {
    const b = WL + bob;
    R(ICE, CX - 46, b - 9, 60, 9);        // linker Absatz (Platz für eine Robbe)
    R(ICE, CX + 14, b - 6, 34, 6);        // rechter Absatz
    R(ICE_SHADE, CX + 14, b - 6, 34, 1);
    for (let k = 0; k < 24; k++) {        // die Spitze
      const y = b - 10 - k, l = CX - 13 + Math.round(k * 0.5 + (k % 3 === 0 ? 1 : 0)), r = CX + 15 - Math.round(k * 0.75 + (k % 4 === 1 ? 1 : 0));
      if (r <= l) break;
      R(ICE, l, y, r - l, 1);
      R(ICE_SHADE, l + Math.round((r - l) * 0.6), y, Math.max(1, Math.round((r - l) * 0.4)), 1);
    }
    R(ICE_SHADE, CX - 4, b - 9, 18, 9);
    R(ICE_DARK, CX + 8, b - 9, 6, 9);
    R(ICE_DARK, CX - 46, b - 1, 94, 1);   // Kante zum Wasser
  }

  // ---------- Robben ----------
  const PAL = { G: "#5d6474", g: "#7a8194", l: "#b4bac4", k: "#0d0f12", n: "#1a1a1e", F: "#4c5262" };
  const SEAL = [
    "...............GGG.",
    "..............GGkGG",
    "....GGGGGGGGGGGGGGn",
    "..GGggggggggggGGG..",
    ".GGggggggggggggGG..",
    "GG.lllllllllllGG...",
    "G...llllllll.FF....",
  ];
  const SEAL_UP = [
    "...............GG..",
    "..............GGkG.",
    "..............GGGGn",
    ".............GGG...",
    "....GGGGGGGGGGGG...",
    "..GGggggggggggGG...",
    ".GGggggggggggggG...",
    "GG.lllllllllllGG...",
    "G...llllllll.FF....",
  ];
  function sprite(rows, x, y, flip) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === "." || !PAL[c]) continue;
        ctx.fillStyle = PAL[c];
        ctx.fillRect(Math.round(flip ? x + row.length - 1 - i : x + i), Math.round(y + j), 1, 1);
      }
    });
  }
  const seals = [
    { x: CX - 44, ground: -9, flip: false, up: 0, next: rnd(1, 4) },
    { x: CX + 24, ground: -6, flip: true, up: 0, next: rnd(3, 7) },
  ];
  function drawSeals(clock, bob) {
    seals.forEach((s) => {
      if (clock >= s.next) { s.up = clock + rnd(1.2, 2.5); s.next = s.up + rnd(3, 8); }
      const up = clock < s.up;
      const rows = up ? SEAL_UP : SEAL;
      sprite(rows, s.x, WL + bob + s.ground - rows.length, s.flip);
    });
  }

  // ---------- Möwen ----------
  let gulls = [], nextGull = rnd(0.5, 2);
  function drawGulls(clock, dt) {
    if (clock >= nextGull && gulls.length < 4) {
      const left = Math.random() < 0.5;
      gulls.push({ x: left ? W + 8 : -8, y: rnd(10, WL - 22), v: rnd(14, 24) * (left ? -1 : 1), ph: rnd(0, 6), bob: rnd(4, 9) });
      nextGull = clock + rnd(3, 8);
    }
    gulls.forEach((g) => {
      g.x += g.v * dt;
      const x = Math.round(g.x), y = Math.round(g.y + Math.sin(clock * 1.3 + g.ph) * g.bob * 0.3);
      const flap = Math.floor(clock * 6 + g.ph) % 3;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 1, y, 3, 1);                         // Körper
      ctx.fillStyle = "#2e3a48";
      if (flap === 0) { ctx.fillRect(x - 4, y - 2, 3, 1); ctx.fillRect(x + 2, y - 2, 3, 1); ctx.fillRect(x - 2, y - 1, 1, 1); ctx.fillRect(x + 2, y - 1, 1, 1); }
      else if (flap === 1) { ctx.fillRect(x - 4, y, 3, 1); ctx.fillRect(x + 2, y, 3, 1); }
      else { ctx.fillRect(x - 3, y + 1, 2, 1); ctx.fillRect(x + 2, y + 1, 2, 1); }
      ctx.fillStyle = "#f0a040"; ctx.fillRect(x + (g.v > 0 ? 2 : -2), y, 1, 1); // Schnabel
    });
    gulls = gulls.filter((g) => g.x > -20 && g.x < W + 20);
  }

  function drawSurface(t, bob) {
    for (let x = 0; x < W; x += 1) {
      const wave = Math.sin(x * 0.18 + t * 2) > 0.6;
      ctx.fillStyle = wave ? "#cfeefb" : "#5aa8dc";
      ctx.fillRect(x, WL, 1, 1);
    }
    // Wellen rund um die Spitze
    ctx.fillStyle = "#e8f8ff";
    const w = Math.round(Math.sin(t * 2.4) * 2);
    ctx.fillRect(CX - 50 - w, WL + bob, 4 + w, 1);
    ctx.fillRect(CX + 46, WL + bob, 4 - w, 1);
  }

  // ---------- Bild ----------
  let start = performance.now(), last = start, raf = 0, running = false;
  function draw(now) {
    const clock = (now - start) / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const bob = Math.sin(clock * 0.9) > 0.3 ? 1 : 0; // der Eisberg hebt sich ganz leicht
    drawSky();
    drawSun(clock);
    drawClouds(clock, dt);
    drawWater(clock, bob);
    drawLife(dt);
    drawTip(bob);
    drawSurface(clock, bob);
    drawSeals(clock, bob);
    drawGulls(clock, dt);
    if (running) raf = requestAnimationFrame(draw);
  }

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gulls = [{ x: 120, y: 24, v: 0, ph: 0, bob: 0 }, { x: 140, y: 30, v: 0, ph: 2, bob: 0 }];
    draw(start); // ruhiges Standbild
    return;
  }
  new IntersectionObserver((entries) => {
    const visible = entries[0].isIntersecting;
    if (visible && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(draw); }
    else if (!visible && running) { running = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
  draw(start);
})();
