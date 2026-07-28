/* =====================================================================
   weather.js - what the sky is doing tonight.
   A full-window canvas over the joint, under the scanlines. It rolls
   itself fresh on every load and mostly comes up empty. Nothing to
   click, nothing to read, nothing that announces itself.
   ===================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED) return;

  /* one roll per page load, never remembered */
  var roll = Math.random();
  var mode = roll < 0.20 ? 'rain' : (roll < 0.40 ? 'snow' : '');
  if (!mode) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'weather-layer';
  canvas.setAttribute('aria-hidden', 'true');
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.appendChild(canvas);

  var w = 0, h = 0;
  var bits = [];

  /* ---- sizing --------------------------------------------------------- */
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function count() {
    var n = Math.round((w * h) / (mode === 'rain' ? 9000 : 16000));
    return Math.max(24, Math.min(n, mode === 'rain' ? 220 : 140));
  }

  /* ---- the bits themselves -------------------------------------------- */
  /* depth d in [0,1]: far bits are small, slow and faint, near ones
     are fat and quick. Costs nothing and reads as parallax. */
  function spawn(atTop) {
    var d = Math.random();
    var b = {
      x: Math.random() * (w + 120) - 60,
      y: atTop ? -Math.random() * h * 0.4 : Math.random() * h,
      d: d
    };
    if (mode === 'rain') {
      b.speed = 620 + d * 700;
      b.len = 9 + d * 20;
      b.alpha = 0.14 + d * 0.26;
      b.wide = 0.7 + d * 0.8;
    } else {
      b.speed = 20 + d * 46;
      b.r = 0.9 + d * 2.1;
      b.alpha = 0.25 + d * 0.5;
      b.sway = 7 + d * 20;
      b.phase = Math.random() * Math.PI * 2;
      b.turn = 0.5 + Math.random() * 0.9;
    }
    return b;
  }

  function seed() {
    var n = count();
    bits.length = 0;
    for (var i = 0; i < n; i++) bits.push(spawn(false));
  }

  /* a tab opened in the background measures 0x0 until it is looked at,
     so re-measure whenever the viewport turns out not to match */
  function ensureSize() {
    if (w === window.innerWidth && h === window.innerHeight) return;
    size();
    seed();
  }

  /* rain falls on a slight slant; the wind is coming off the street */
  var SLANT = 0.17;
  var SX = Math.sin(SLANT), SY = Math.cos(SLANT);

  function step(dt, t) {
    for (var i = 0; i < bits.length; i++) {
      var b = bits[i];
      if (mode === 'rain') {
        b.x += b.speed * SX * dt;
        b.y += b.speed * SY * dt;
      } else {
        b.y += b.speed * dt;
        b.x += Math.sin(t * b.turn + b.phase) * b.sway * dt;
      }
      if (b.y - (b.len || b.r || 0) > h || b.x < -80 || b.x > w + 80) {
        bits[i] = spawn(true);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var i, b;
    if (mode === 'rain') {
      ctx.lineCap = 'round';
      for (i = 0; i < bits.length; i++) {
        b = bits[i];
        ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = '#cfe4f2';
        ctx.lineWidth = b.wide;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - SX * b.len, b.y - SY * b.len);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#f4f7ff';
      for (i = 0; i < bits.length; i++) {
        b = bits[i];
        ctx.globalAlpha = b.alpha;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- loop ----------------------------------------------------------- */
  var raf = 0, last = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!w || !h) ensureSize();
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    step(dt, now / 1000);
    draw();
  }

  function start() {
    if (raf) return;
    ensureSize();
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(ensureSize, 150);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { ensureSize(); start(); }
  });

  start();
})();
