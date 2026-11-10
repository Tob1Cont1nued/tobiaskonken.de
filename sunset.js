// Kopfbild im Workshop-Kasten: 8-Bit-Sonnenuntergang über dem Meer, mit ziehenden Wolken und Vögeln.
// Farben und Zeichenweise wie im Tresorwächter-Abspann.
(function () {
  const canvas = document.getElementById("sunset");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width, H = canvas.height, HY = Math.round(H * 0.68);
  const DARK = 0.3; // Abendstimmung, kurz bevor es dunkel wird

  const SKY_DAY = ["#3a1e5e", "#5a2a72", "#82337a", "#b0405e", "#d85a46", "#ec8040", "#f4a848", "#f8cc6a"];
  const SKY_DUSK = ["#0e0820", "#160c2c", "#22103a", "#341648", "#4e1e52", "#6e2a54", "#963a50", "#b8504a"];
  const SEA_DAY = ["#2a3a7a", "#24326c", "#1e2a5e", "#182250", "#121a42"];
  const SEA_DUSK = ["#141838", "#11142e", "#0e1026", "#0b0c1e", "#080816"];

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  function drawSky() {
    const band = Math.ceil(HY / SKY_DAY.length);
    for (let i = 0; i < SKY_DAY.length; i++) {
      ctx.fillStyle = mix(SKY_DAY[i], SKY_DUSK[i], DARK);
      ctx.fillRect(0, i * band, W, band);
      if (i + 1 < SKY_DAY.length) { // Dither-Kante wie bei 8-Bit-Farbverläufen
        ctx.fillStyle = mix(SKY_DAY[i + 1], SKY_DUSK[i + 1], DARK);
        for (let x = i % 2; x < W; x += 2) ctx.fillRect(x, (i + 1) * band - 1, 1, 1);
      }
    }
  }

  const SUN_X = Math.round(W * 0.7), SUN_Y = HY - 5, SUN_R = 15;
  function drawSun() {
    for (let y = -SUN_R; y <= SUN_R; y++) {
      for (let x = -SUN_R; x <= SUN_R; x++) {
        if (x * x + y * y > SUN_R * SUN_R) continue;
        const py = SUN_Y + y;
        if (py >= HY || (y > 2 && y % 3 === 0)) continue;
        ctx.fillStyle = y < -5 ? mix("#fff0a0", "#f8b060", DARK) : mix("#f8c050", "#f07840", DARK);
        ctx.fillRect(SUN_X + x, py, 1, 1);
      }
    }
  }

  function drawSea(t) {
    const band = Math.ceil((H - HY) / SEA_DAY.length);
    for (let i = 0; i < SEA_DAY.length; i++) {
      ctx.fillStyle = mix(SEA_DAY[i], SEA_DUSK[i], DARK);
      ctx.fillRect(0, HY + i * band, W, band);
    }
    for (let y = HY + 3, n = 0; y < H; y += 4, n++) {
      ctx.fillStyle = mix("#5a6ab0", "#2a2e5a", DARK);
      const off = (t * (4 + n * 2) + n * 23) % 24;
      for (let x = -24 + off; x < W; x += 24) ctx.fillRect(Math.round(x), y, 6 + (n % 3) * 2, 1);
    }
    for (let y = HY + 1, k = 0; y < H; y += 2, k++) { // Spiegelung der Sonne
      const w = Math.max(2, Math.round(24 - k * 1.6 + Math.sin(t * 4 + k) * 2));
      ctx.fillStyle = k % 2 ? mix("#f8b048", "#a04838", DARK) : mix("#f8d070", "#c06040", DARK);
      ctx.fillRect(Math.round(SUN_X - w / 2 + Math.sin(t * 2.5 + k * 1.7) * 2), y, w, 1);
    }
  }

  function drawIsland() {
    ctx.fillStyle = mix("#d8a868", "#6a4a3a", DARK);
    ctx.fillRect(0, HY - 3, 50, 6); ctx.fillRect(0, HY - 6, 34, 3); ctx.fillRect(0, HY - 8, 18, 2);
    ctx.fillStyle = mix("#7a5030", "#3a2418", DARK);
    for (let j = 0; j < 26; j++) ctx.fillRect(12 + Math.round(Math.sin(j / 8) * 3), HY - 8 - j, 2, 1);
    ctx.fillStyle = mix("#3a8a3a", "#1a3a2a", DARK);
    const top = [15, HY - 34];
    [[-12, 5], [-9, -2], [10, -1], [13, 6], [2, -7], [-4, 8], [7, 9]].forEach(([dx, dy]) => {
      for (let s = 0; s <= 10; s++) ctx.fillRect(top[0] + Math.round((dx * s) / 10), top[1] + Math.round((dy * s) / 10 + (s * s) / 30), 2, 1);
    });
  }

  // Wolken und Vögel: wenige, die immer mal wieder vorbeiziehen
  const rnd = (a, b) => a + Math.random() * (b - a);
  let clouds = [[30, 14, 70], [190, 9, 86], [330, 22, 56]].map(([x, y, w]) => ({ x, y, w, v: rnd(2, 4) }));
  let flocks = [], nextCloud = rnd(8, 14), nextFlock = rnd(1, 3);
  function ambient(clock, dt) {
    if (clock >= nextCloud && clouds.length < 5) {
      const w = Math.round(rnd(40, 90));
      clouds.push({ x: -w - 10, y: Math.round(rnd(6, HY - 26)), w, v: rnd(2.5, 5) });
      nextCloud = clock + rnd(6, 12);
    }
    if (clock >= nextFlock) {
      const n = Math.random() < 0.45 ? 1 : Math.random() < 0.7 ? 2 : 3, left = Math.random() < 0.5;
      const v = rnd(12, 20) * (left ? -1 : 1);
      flocks.push({ birds: Array.from({ length: n }, (_, i) => ({ dx: -i * 9 * Math.sign(v), dy: (i % 2) * 4 + i * 2, ph: rnd(0, 6) })),
        x: left ? W + 10 : -10, y: Math.round(rnd(10, HY - 20)), v });
      nextFlock = clock + rnd(6, 13);
    }
    ctx.fillStyle = mix("#f0907a", "#4a2450", DARK);
    clouds.forEach((c) => {
      c.x += c.v * dt;
      ctx.fillRect(Math.round(c.x), c.y, c.w, 2);
      ctx.fillRect(Math.round(c.x) + 8, c.y - 2, Math.max(6, c.w - 24), 2);
    });
    clouds = clouds.filter((c) => c.x < W + 10);
    ctx.fillStyle = mix("#f4ece0", "#8a7aa0", DARK);
    flocks.forEach((f) => {
      f.x += f.v * dt;
      f.birds.forEach((b) => {
        const x = Math.round(f.x + b.dx), y = Math.round(f.y + b.dy + Math.sin(clock * 1.5 + b.ph));
        const flap = Math.floor(clock * 5 + b.ph) % 2;
        ctx.fillRect(x - 2, y + flap, 2, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillRect(x + 1, y + flap, 2, 1);
      });
    });
    flocks = flocks.filter((f) => f.x > -40 && f.x < W + 40);
  }

  let start = 0, last = 0, raf = 0, running = false;
  function draw(now) {
    const clock = (now - start) / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    drawSky();
    ambient(clock, dt);
    drawSun();
    drawSea(clock);
    drawIsland();
    if (running) raf = requestAnimationFrame(draw);
  }

  start = last = performance.now();
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    flocks.push({ birds: [{ dx: 0, dy: 0, ph: 0 }, { dx: -9, dy: 6, ph: 2 }], x: W * 0.42, y: 18, v: 0 });
    draw(start); // ruhiges Standbild
    return;
  }
  // nur bewegen, solange das Bild zu sehen ist
  new IntersectionObserver((entries) => {
    const visible = entries[0].isIntersecting;
    if (visible && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(draw); }
    else if (!visible && running) { running = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
  draw(start);
})();
