// Kopfbild im Reifegrad-Kasten: 8-Bit-Weltraum. Ein Raumschiff (eigener Entwurf: Untertasse,
// Rumpf, zwei Triebwerksgondeln) gleitet herein, geht in den Warp über und verschwindet mit einem Blitz.
(function () {
  const canvas = document.getElementById("warp");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width, H = canvas.height;
  const LOOP = 13;                       // Sekunden je Durchlauf
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const ease = (p) => (p < 0 ? 0 : p > 1 ? 1 : p * p * (3 - 2 * p));
  const lerp = (a, b, p) => a + (b - a) * p;

  // ---------- Sterne in drei Ebenen ----------
  const stars = Array.from({ length: 110 }, (_, i) => ({
    x: (i * 131.7) % W, y: (i * 47.3 + (i % 7) * 11) % H, z: [0.3, 0.6, 1][i % 3], tw: i % 5,
  }));
  function drawStars(dt, clock, warp) {
    stars.forEach((s) => {
      s.x -= (3 + 9 * s.z) * dt * (1 + warp * 26);
      if (s.x < -30) { s.x += W + 30; }
      const len = 1 + Math.round(warp * 26 * s.z);
      const a = s.z === 1 ? 1 : s.z === 0.6 ? 0.7 : 0.45;
      const tw = 0.75 + 0.25 * Math.sin(clock * 2 + s.tw);
      ctx.fillStyle = warp > 0.1 ? `rgba(190,225,255,${(a * tw).toFixed(2)})` : `rgba(255,250,235,${(a * tw).toFixed(2)})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), len, 1);
    });
  }

  // ---------- Hintergrund: Nebel und Planet ----------
  function drawSpace() {
    const BANDS = ["#07061a", "#0a0820", "#0d0a26", "#100c2c", "#120d30", "#0f0b2a", "#0b0922", "#08071c"];
    const band = Math.ceil(H / BANDS.length);
    BANDS.forEach((c, i) => R(c, 0, i * band, W, band));
    // Nebel: weiche, gerasterte Flecken
    [[110, 40, 70, "rgba(120,60,160,0.06)"], [330, 95, 90, "rgba(60,90,180,0.06)"], [200, 120, 50, "rgba(160,70,120,0.05)"]].forEach(([cx, cy, r, c]) => {
      ctx.fillStyle = c;
      for (let y = -r; y <= r; y += 2) for (let x = -r * 1.6; x <= r * 1.6; x += 2) {
        if ((x / 1.6) ** 2 + y * y < r * r && ((x + y) / 2) % 2 === 0) ctx.fillRect(cx + x, cy + y, 2, 2);
      }
    });
  }
  function drawPlanet() {
    const cx = 410, cy = 128, r = 46;
    for (let y = -r; y <= r; y++) {
      const py = cy + y; if (py < 0 || py >= H) continue;
      for (let x = -r; x <= r; x++) {
        const d = x * x + y * y; if (d > r * r) continue;
        const band = Math.floor((y + r + Math.sin(x * 0.12) * 3) / 7) % 3;
        let c = ["#c0623e", "#d8884a", "#a84e3a"][band];
        if (x - y > r * 0.55) c = (x + y) % 2 ? "#5a2a30" : c;       // Schattenseite gerastert
        if (x - y > r * 0.9) c = "#3a1a26";
        if (d > (r - 1) * (r - 1) && x + y < 0) c = "#f0b070";        // heller Rand zur Sonne
        R(c, cx + x, py, 1, 1);
      }
    }
    // kleiner Mond
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) R(x + y > 3 ? "#6a6a80" : "#b8b8c8", 330 + x, 104 + y, 1, 1);
  }

  // ---------- Das Raumschiff auf eigener Leinwand (50 × 22 Pixel) ----------
  const SW = 50, SH = 22;
  const ship = document.createElement("canvas");
  ship.width = SW; ship.height = SH;
  const sc = ship.getContext("2d");
  function drawShip(glow) {
    sc.clearRect(0, 0, SW, SH);
    const S = (c, x, y, w, h) => { sc.fillStyle = c; sc.fillRect(x, y, w, h); };
    const hull = "#c9ced8", hullMid = "#a4abb8", hullDark = "#6c7484", line = "#3a404c";
    // Gondeln (oben hinten) mit Trägern
    S(line, 1, 2, 22, 5); S(hullMid, 2, 3, 20, 3); S(hull, 2, 3, 20, 1);
    S(`rgba(110,210,255,${0.55 + glow * 0.45})`, 4, 5, 16, 1);        // blaues Leuchten an der Seite
    S(glow > 0.5 ? "#ff9a7a" : "#ff5a40", 21, 3, 2, 3);                 // rote Kappe vorn
    S(line, 3, 7, 1, 1); S(line, 1, 8, 22, 2); S(hullDark, 2, 8, 20, 1); // zweite Gondel dahinter
    S(hullDark, 10, 7, 3, 6); S(line, 12, 7, 1, 6);                    // Träger
    // Rumpf (unten)
    S(line, 6, 12, 22, 6); S(hull, 7, 13, 20, 4); S(hullMid, 7, 16, 20, 1);
    S(line, 5, 13, 2, 4);
    S(`rgba(120,220,255,${0.6 + glow * 0.4})`, 27, 14, 2, 2);          // Deflektor vorn am Rumpf
    for (let x = 10; x < 26; x += 4) S("#ffe08a", x, 14, 1, 1);         // Fenster
    // Hals
    S(line, 26, 9, 5, 4); S(hullMid, 27, 9, 3, 4);
    // Untertasse (vorn oben)
    S(line, 26, 5, 24, 5); S(line, 28, 4, 20, 7);
    S(hull, 28, 5, 20, 4); S(hull, 27, 6, 22, 2);
    S(hullMid, 28, 8, 20, 1); S(hullDark, 29, 9, 18, 1);
    S("#e8ecf4", 34, 3, 7, 1); S(line, 33, 3, 1, 1); S(line, 41, 3, 1, 1); // Brücke oben
    for (let x = 30; x < 48; x += 3) S("#ffe08a", x, 7, 1, 1);         // Fensterreihe
  }

  // ---------- Ablauf ----------
  let flash = null;
  function drawFlash(t) {
    if (!flash) return;
    const p = (t - flash.t) / 0.9;
    if (p < 0 || p > 1) { if (p > 1) flash = null; return; }
    const r = Math.round(3 + p * 34), a = Math.min(1, (1 - p) * 1.4);
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
    ctx.fillRect(flash.x - r * 3, flash.y, r * 6, 1); ctx.fillRect(flash.x - r, flash.y - 1, r * 2, 3); // Blitzstrahl
    ctx.fillRect(flash.x, flash.y - Math.round(r / 2), 1, r);
    ctx.fillStyle = `rgba(140,220,255,${(a * 0.8).toFixed(2)})`;
    for (let k = 0; k < 16; k++) {                                     // Ring
      const ang = (k / 16) * Math.PI * 2;
      ctx.fillRect(Math.round(flash.x + Math.cos(ang) * r), Math.round(flash.y + Math.sin(ang) * r * 0.5), 2, 2);
    }
    if (p < 0.25) { ctx.fillStyle = `rgba(255,255,255,${(0.25 - p).toFixed(2)})`; ctx.fillRect(0, 0, W, H); }
  }

  let start = performance.now(), last = start, raf = 0, running = false, lastCycle = -1;
  function draw(now) {
    const clock = (now - start) / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const cycle = Math.floor(clock / LOOP), t = clock % LOOP;
    if (cycle !== lastCycle) { lastCycle = cycle; flash = null; }

    // Phasen: 0–3.5 hereingleiten, 3.5–5.6 ruhig fliegen, 5.6–6.6 Warp aufladen, 6.6 Sprung, danach leerer Raum
    const JUMP = 6.6;
    const charge = ease((t - 5.6) / 1.0);
    const warp = t < JUMP ? charge * 0.25 : Math.max(0, 1 - (t - JUMP) / 1.6);
    drawSpace();
    drawStars(dt, clock, warp);
    drawPlanet();

    if (t < JUMP) {
      const x = t < 3.5 ? lerp(-60, 150, ease(t / 3.5)) : lerp(150, 166, (t - 3.5) / 3.1) - charge * 10;
      const y = 52 + Math.round(Math.sin(clock * 1.4) * 1.5);
      drawShip(charge);
      const sx = 2, stretch = 1 + charge * 0.5;                       // 2-fach gezeichnet, beim Aufladen gestreckt
      // Leuchtspur der Gondeln beim Aufladen
      if (charge > 0) {
        for (let i = 1; i <= 6; i++) {
          ctx.fillStyle = `rgba(110,210,255,${(charge * (0.5 - i * 0.07)).toFixed(2)})`;
          ctx.fillRect(Math.round(x - i * 10 * charge), y + 10, 44 * sx * 0.45, 2);
        }
      }
      ctx.drawImage(ship, Math.round(x - (stretch - 1) * SW * sx), y, Math.round(SW * sx * stretch), SH * sx);
    } else if (!flash && t < JUMP + 0.1) {
      flash = { t: JUMP, x: 256, y: 52 + 14 };
    }
    drawFlash(t);
    if (running) raf = requestAnimationFrame(draw);
  }

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    start = performance.now() - 4500; last = performance.now();
    draw(performance.now()); // ruhiges Standbild mit Schiff
    return;
  }
  new IntersectionObserver((entries) => {
    const visible = entries[0].isIntersecting;
    if (visible && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(draw); }
    else if (!visible && running) { running = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
  draw(start);
})();
