/* =====================================================================
   raccoon.js v2 - the cursor-following raccoon, now a real pixel-art
   engine. One 13x15 char-grid sprite, four animation frames (idle,
   blink, two walk steps), rendered through swappable palettes so the
   same raccoon exists in eight art styles. He starts in the style of
   the room he's in and periodically glitch-morphs into another one.

   Grid legend: . empty | D edge | K dark/mask | M fur | L light fur
                W eye white | P pupil | N nose
   ===================================================================== */
(function () {
  'use strict';

  var COARSE = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var P = 3; /* scale: one pixel = 3 SVG units, same 48x48 viewBox as v1 */

  /* ---- the sprite, as rows of palette roles -------------------------- */
  var BODY_ROWS = [ /* rows 0-13, tail baked into cols 0-1 */
    '..DD......DD.',
    '.DMD......DMD',
    '.DKMD....DMKD',
    '...DMMMMMMD..',
    '..DMMMMMMMMD.',
    '..DKKKMMKKKD.',
    null, /* row 6 = the eyes, swapped per frame */
    '..DMLLLLLLMD.',
    'M..DLLNNLLD..',
    'D...DMLLMD...',
    'DM.DMMMMMMD..',
    'MDDMMLLLMMMD.',
    'DMDMMLLLMMMD.',
    'MD.DMMMMMMD..'
  ];
  var EYES_OPEN = '..DKWPMMWPKD.';
  var EYES_CLOSED = '..DKKKMMKKKD.';
  var FEET = { /* row 14 */
    idle: '...KK....KK..',
    walk1: '..KK......KK.',
    walk2: '....KK..KK...'
  };

  /* ---- the art styles ------------------------------------------------ */
  var STYLES = {
    classic: { D:'#555555', K:'#333333', M:'#888888', L:'#cccccc', W:'#ffffff', P:'#111111', N:'#333333' },
    gameboy: { D:'#0f380f', K:'#0f380f', M:'#306230', L:'#8bac0f', W:'#9bbc0f', P:'#0f380f', N:'#0f380f' },
    mono: { D:'#ffffff', K:'#000000', M:'#111111', L:'#000000', W:'#ffffff', P:'#000000', N:'#ffffff' },
    animatronic: { D:'#0a0510', K:'#1a0f24', M:'#2d1a3d', L:'#4a2b63', W:'#050208', P:'#e23b3b', N:'#111111' },
    farm: { D:'#4a3018', K:'#2d1c0d', M:'#7a5230', L:'#d9b98a', W:'#ffffff', P:'#1c1208', N:'#2d1c0d' },
    steel: { D:'#2a3243', K:'#1d2330', M:'#5a6b85', L:'#d8dee9', W:'#ffffff', P:'#0c0e13', N:'#1d2330' },
    sepia: { D:'#3a2c14', K:'#2b2013', M:'#6b573a', L:'#d8c095', W:'#f0e2c0', P:'#2b2013', N:'#2b2013' },
    neon: { D:'#ff5d8f', K:'#b8195c', M:'#ff8fb3', L:'#ffd1e0', W:'#ffffff', P:'#14110f', N:'#b8195c' }
  };
  var STYLE_NAMES = Object.keys(STYLES);
  var STYLE_LABEL = {
    classic: 'classic mode', gameboy: '8-bit spa day', mono: '* (mono mode)',
    animatronic: 'do NOT stuff me in a suit', farm: 'barn palette',
    steel: 'en garde grey', sepia: 'oil painting hours', neon: 'NEON MODE'
  };
  var ROOM_STYLE = {
    'room-fnaf': 'animatronic', 'room-stardew': 'farm', 'room-undertale': 'mono',
    'room-fencing': 'steel', 'room-hamilton': 'sepia'
  };
  function roomStyle() {
    for (var k in ROOM_STYLE) if (document.body.classList.contains(k)) return ROOM_STYLE[k];
    return 'classic';
  }

  /* ---- rect soup ------------------------------------------------------ */
  function rowRects(row, y, pal, minX) {
    var out = '';
    for (var x = minX; x < row.length; x++) {
      var c = row.charAt(x);
      if (c === '.' || !pal[c]) continue;
      out += '<rect x="' + (x * P) + '" y="' + (y * P) + '" width="' + P + '" height="' + P + '" fill="' + pal[c] + '"/>';
    }
    return out;
  }
  function tailRects(pal) {
    var out = '';
    for (var y = 0; y < BODY_ROWS.length; y++) {
      var row = BODY_ROWS[y];
      if (!row) continue;
      for (var x = 0; x < 2; x++) {
        var c = row.charAt(x);
        if (c !== '.' && pal[c]) out += '<rect x="' + (x * P) + '" y="' + (y * P) + '" width="' + P + '" height="' + P + '" fill="' + pal[c] + '"/>';
      }
    }
    return out;
  }
  function bodyRects(pal) {
    var out = '';
    for (var y = 0; y < BODY_ROWS.length; y++) {
      if (BODY_ROWS[y]) out += rowRects(BODY_ROWS[y], y, pal, 2);
    }
    return out;
  }

  /* standalone build for other rooms (jumpscare, battle, den mascot…) */
  var svgCache = {};
  function buildSVG(styleName, blink, feet) {
    var key = styleName + '|' + (blink ? 'b' : 'o') + '|' + feet;
    if (svgCache[key]) return svgCache[key];
    var pal = STYLES[styleName] || STYLES.classic;
    var s =
      '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' +
        '<g class="tail">' + tailRects(pal) + '</g>' +
        '<g class="bob">' +
          bodyRects(pal) +
          rowRects(blink ? EYES_CLOSED : EYES_OPEN, 6, pal, 2) +
          rowRects(FEET[feet] || FEET.idle, 14, pal, 2) +
        '</g>' +
      '</svg>';
    svgCache[key] = s;
    return s;
  }

  /* public: classic sprite for existing consumers, styled API for rooms */
  window.RaccoonSVG = buildSVG('classic', false, 'idle');
  window.RaccoonArt = {
    styles: STYLE_NAMES.slice(),
    svg: function (styleName, opts) {
      opts = opts || {};
      return buildSVG(STYLES[styleName] ? styleName : 'classic', !!opts.blink, opts.feet || 'idle');
    }
  };

  if (COARSE) return; /* no follower on touch screens */

  /* =====================================================================
     The cursor-following raccoon, animated from the uploaded sprite sheet
     (raccoon-sprites.png). Sheet = 8 columns x 4 rows of 32x32 frames:
       row 0 idle (8) row 1 movement (8) row 2 damage (4) row 3 death (4)
     The raccoon faces RIGHT in the sheet, so we flip it when it walks left.
     Poke him (click on him) to make him yelp; a few quick hits and he
     plays dead, then respawns. Falls back to the drawn SVG if the sheet
     can't load.
     ===================================================================== */
  var SHEET = 'raccoon-sprites.png';
  var FW = 32, COLS = 8, ROWS = 4, SCALE = 2;
  var DISP = FW * SCALE; /* 64px on screen */
  var HALF = DISP / 2;

  var ANIM = {
    idle: { row: 0, frames: 8, fps: 7 },
    move: { row: 1, frames: 8, fps: 8 },   /* he ambles now; the walk cycle slowed to match */
    damage: { row: 2, frames: 4, fps: 14 },
    death: { row: 3, frames: 4, fps: 8 }
  };

  var el = document.createElement('div');
  el.id = 'raccoon';
  el.setAttribute('aria-hidden', 'true');
  el.style.width = DISP + 'px';
  el.style.height = DISP + 'px';
  el.style.backgroundImage = 'url("' + SHEET + '")';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundSize = (COLS * DISP) + 'px ' + (ROWS * DISP) + 'px';
  el.style.imageRendering = 'pixelated';
  document.body.appendChild(el);

  /* graceful fallback to the drawn SVG raccoon if the sheet 404s */
  var probe = new Image();
  probe.onerror = function () {
    el.style.backgroundImage = 'none';
    el.style.width = '48px'; el.style.height = '48px';
    el.innerHTML = window.RaccoonSVG;
  };
  probe.src = SHEET;

  var bubble = document.createElement('div');
  bubble.className = 'rac-speech';
  bubble.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bubble);

  var mx = window.innerWidth / 2, my = window.innerHeight * 0.4;
  var x = mx, y = my, facing = 1;
  var idleFrames = 0, lastSpeak = 0;

  var generic = ['*chitters*', 'ooo, shiny', 'trash? \u{1F440}', '*washes hands*', 'follow me',
                 'snack break?', '*sniff sniff*'];
  var byRoom = {
    'room-fnaf': ['5 more nights…', "what's that noise?", '*checks the cameras*', 'power: low'],
    'room-stardew': ['did you water the crops?', 'it is a good day', '*holds a parsnip*', 'the Junimos like you'],
    'room-undertale': ['* you feel determined', '* (raccoon)', 'stay determined', '* the trash rustles'],
    'room-fencing': ['en garde!', 'allez!', 'point! \u{1F534}', 'nice riposte'],
    'room-hamilton': ['not throwing away my shot', 'rise up', 'talk less, smile more', '*hums Non-Stop*'],
    'room-backroom': ['you found my den', 'welcome to the good room', '*shows you his caps*', 'you earned this']
  };
  function lines() {
    var k = Object.keys(byRoom);
    for (var i = 0; i < k.length; i++) if (document.body.classList.contains(k[i]))
      return byRoom[k[i]].concat(generic);
    return generic;
  }

  function speak(text, ms) {
    bubble.textContent = text;
    bubble.style.left = (x) + 'px';
    bubble.style.top = (y - 6) + 'px';
    bubble.classList.add('show');
    clearTimeout(speak.t);
    speak.t = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2600);
  }
  function say() {
    var L = lines();
    speak(L[(Math.random() * L.length) | 0]);
  }

  /* ---- sprite animation state ------------------------------------------ */
  var state = 'idle', animStart = 0, drawnState = null, drawnCol = -1;
  function setState(s, now) {
    if (state === s) return;
    state = s; animStart = now;
  }
  function drawSprite(now) {
    var a = ANIM[state];
    var idx = Math.floor((now - animStart) / 1000 * a.fps);
    var col;
    if (state === 'damage' || state === 'death') col = Math.min(idx, a.frames - 1); /* play once, hold */
    else col = idx % a.frames; /* loop */
    if (state === drawnState && col === drawnCol) return;
    drawnState = state; drawnCol = col;
    el.style.backgroundPosition = '-' + (col * DISP) + 'px -' + (a.row * DISP) + 'px';
  }

  /* ---- poke the raccoon: damage, and death after quick repeated hits --- */
  var damageUntil = 0, dead = false, hits = 0, lastHit = 0;
  function damageMs() { return ANIM.damage.frames / ANIM.damage.fps * 1000; }
  function deathMs() { return ANIM.death.frames / ANIM.death.fps * 1000; }

  function poke(now) {
    if (dead || heist) return;   /* hands full; he is not taking questions */
    if (now - lastHit > 1600) hits = 0;
    hits++; lastHit = now;
    if (hits >= 3) {
      dead = true;
      setState('death', now);
      speak('x_x', 1400);
      setTimeout(function () { /* lie dead, then respawn */
        el.style.transition = 'opacity .4s';
        el.style.opacity = '0';
        setTimeout(function () {
          x = mx - 50; y = my - 50; hits = 0; dead = false;
          state = 'idle'; animStart = performance.now();
          el.style.opacity = '';
          setTimeout(function () { el.style.transition = ''; }, 420);
        }, 420);
      }, deathMs() + 700);
    } else {
      damageUntil = now + damageMs();
      setState('damage', now);
      speak(['ow!', 'hey!', '*hiss*', 'rude'][hits % 4], 1200);
      if (window.SFX && SFX.deny) SFX.deny();
    }
  }

  window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
  window.addEventListener('mousedown', function (e) {
    mx = e.clientX; my = e.clientY;
    if (Math.hypot(e.clientX - x, e.clientY - y) < HALF * 0.9) poke(performance.now());
  });

  /* ---- he is half a second behind you ---------------------------------
     He used to steer at the live cursor, which made him snap into motion
     the instant it twitched and then ride your elbow. Now we keep half a
     second of cursor history and he walks toward where you WERE, so the
     move animation starts a beat late and he never quite catches up.
     ---------------------------------------------------------------------- */
  var LAG = 500;          /* ms of delay before he reacts */
  var trail = [];         /* {t,x,y}, oldest first */
  function laggedTarget(now) {
    trail.push({ t: now, x: mx, y: my });
    var want = now - LAG;
    while (trail.length > 1 && trail[1].t <= want) trail.shift();
    return trail[0];
  }

  /* ---- the pouch heist -------------------------------------------------
     home.js hands him something worth taking. He walks over at his own
     pace, picks it up, and leaves with it. Nothing else drives him while
     this is running.
     ---------------------------------------------------------------------- */
  var heist = null;
  function heistStep(now) {
    var r = heist.node.getBoundingClientRect();
    if (heist.phase === 'in') {
      var tx = r.left + r.width / 2, ty = r.top + r.height * 0.62;
      if (Math.hypot(tx - x, ty - y) < 18) {
        var art = heist.node.querySelector('img') || heist.node;
        var ar = art.getBoundingClientRect();
        heist.loot = art.cloneNode(true);
        heist.loot.removeAttribute('id');
        heist.loot.className = 'rac-loot';
        heist.loot.style.width = ar.width + 'px';
        heist.loot.style.height = ar.height + 'px';
        heist.lootW = ar.width; heist.lootH = ar.height;
        document.body.appendChild(heist.loot);
        heist.node.style.visibility = 'hidden';
        heist.phase = 'out';
        speak('mine now', 1500);
        if (window.SFX && SFX.deny) SFX.deny();
      }
      return { tx: tx, ty: ty, gap: 6, speed: 7 };
    }
    /* out the door, stage left */
    return { tx: -180, ty: y - 30, gap: 4, speed: 8 };
  }
  function heistCarry(now) {
    if (!heist.loot) return;
    var sway = Math.sin(now / 110) * 7;
    heist.loot.style.transform =
      'translate(' + (x - heist.lootW / 2) + 'px,' + (y - heist.lootH * 0.15) + 'px)' +
      ' rotate(' + sway + 'deg)';
  }
  function heistDone() {
    var cb = heist.done;
    if (heist.loot) heist.loot.remove();
    heist = null;
    trail.length = 0;
    x = window.innerWidth + 90; y = my;   /* he slinks back in from the other side */
    if (cb) cb();
  }

  window.SJJRaccoon = {
    /* walk over, take `node`, and carry it off the screen */
    steal: function (node, done) {
      if (!node || heist) { if (done) done(); return; }
      heist = { node: node, done: done, phase: 'in', loot: null, lootW: 0, lootH: 0 };
    },
    busy: function () { return !!heist; }
  };

  /* ---- keep-out zones --------------------------------------------------
     Some boxes are not his to walk into - the Undertale battle box is your
     fight, not his. He walks around it rather than through it, and when the
     cursor goes inside he climbs up and sits on the lid to watch.

     The art sits at the bottom of its 64px cell, so the point we track is up
     at his shoulders: his body reaches 24px to either side of it, 2px above
     and 32px below. The no-go rect is padded to match, which is why it is
     not symmetric.
     ---------------------------------------------------------------------- */
  var KEEP_OUT = '.ut-box';
  var SIDE = 26;  /* clearance he keeps beside and below the border */
  var PERCH = 6;  /* how far his feet settle onto the lid when he sits */

  var koNode = null, koLooks = 0;
  function keepOutZone() {
    if (!koNode || !koNode.isConnected) { /* most rooms have no zone: don't hunt every frame */
      if (koLooks++ % 30) return null;
      koNode = document.querySelector(KEEP_OUT);
      if (!koNode) return null;
    }
    var box = koNode.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    return {
      box: box,
      l: box.left - SIDE, r: box.right + SIDE,
      t: box.top - HALF + PERCH, b: box.bottom + 2
    };
  }
  function cursorInside(z) {
    return mx >= z.box.left && mx <= z.box.right && my >= z.box.top && my <= z.box.bottom;
  }
  function evict(z) { /* if he ever ends up inside, out the nearest wall he goes */
    if (x <= z.l || x >= z.r || y <= z.t || y >= z.b) return;
    var dl = x - z.l, dr = z.r - x, dt = y - z.t, db = z.b - y;
    var m = Math.min(dl, dr, dt, db);
    if (m === dt) y = z.t;
    else if (m === db) y = z.b;
    else if (m === dl) x = z.l;
    else x = z.r;
  }
  /* does a walk from (x0,y0) to (x1,y1) cut through the zone? (Liang-Barsky -
     brushing along an edge doesn't count. pad shrinks the zone, which is how
     a corner stays reachable once he is already hugging that wall.) */
  function crosses(z, x0, y0, x1, y1, pad) {
    var dx = x1 - x0, dy = y1 - y0, t0 = 0, t1 = 1;
    var p = [-dx, dx, -dy, dy];
    var q = [x0 - z.l - pad, z.r - pad - x0, y0 - z.t - pad, z.b - pad - y0];
    for (var i = 0; i < 4; i++) {
      if (!p[i]) { if (q[i] <= 0) return false; continue; }
      var u = q[i] / p[i];
      if (p[i] < 0) { if (u > t1) return false; if (u > t0) t0 = u; }
      else { if (u < t0) return false; if (u < t1) t1 = u; }
    }
    return t1 - t0 > 1e-6;
  }
  /* blocked? then he rounds a corner. Shortest walk that stays outside, over
     a six node visibility graph - him, where he is headed, and the four
     corners - re-solved each frame, and we only ever take the first hop.
     (Greedy nearest-corner traps him in the middle of a wall.) */
  function detour(z, tx, ty) {
    if (!crosses(z, x, y, tx, ty, 0)) return null;
    var n = [[x, y], [tx, ty], [z.l, z.t], [z.r, z.t], [z.r, z.b], [z.l, z.b]];
    var N = n.length, INF = Infinity, d = [], seen = [], from = [], i, j;
    for (i = 0; i < N; i++) { d[i] = INF; seen[i] = false; from[i] = -1; }
    d[0] = 0;
    for (var k = 0; k < N; k++) {
      var u = -1;
      for (i = 0; i < N; i++) if (!seen[i] && d[i] < (u < 0 ? INF : d[u])) u = i;
      if (u < 0 || u === 1) break;
      seen[u] = true;
      for (j = 0; j < N; j++) {
        if (seen[j] || j === u) continue;
        /* the corners sit on the wall, so let a walk brush along it */
        if (crosses(z, n[u][0], n[u][1], n[j][0], n[j][1], (u > 1 || j > 1) ? 8 : 0)) continue;
        var w = d[u] + Math.hypot(n[j][0] - n[u][0], n[j][1] - n[u][1]);
        if (w < d[j]) { d[j] = w; from[j] = u; }
      }
    }
    if (d[1] === INF) return null;
    var path = [], s = 1, guard = 0;
    while (s !== 0 && guard++ < N) { path.unshift(s); s = from[s]; }
    for (i = 0; i < path.length; i++) { /* skip a corner he is already standing on */
      var p = n[path[i]];
      if (Math.hypot(p[0] - x, p[1] - y) > 6) return path[i] === 1 ? null : p;
    }
    return null;
  }

  /* ---- main loop: follow the cursor, drive the sprite ------------------ */
  var GAP = 96;        /* how much room he keeps between you and him */
  var EASE = 0.055;    /* fraction of the remaining distance per frame */
  var TOP = 5.5;       /* and his flat-out top speed, px/frame */
  function frame(now) {
    var lag = laggedTarget(now);

    /* a heist overrides everything: no cursor, no keep-out zones */
    if (heist) {
      var h = heistStep(now);
      var hd = Math.hypot(h.tx - x, h.ty - y);
      if (hd > h.gap) {
        var hs = Math.min(hd, h.speed);
        x += (h.tx - x) / hd * hs;
        y += (h.ty - y) / hd * hs;
        if (Math.abs(h.tx - x) > 2) facing = h.tx < x ? -1 : 1;
      }
      setState(hd > h.gap ? 'move' : 'idle', now);
      heistCarry(now);
      if (heist.phase === 'out' && x < -120) heistDone();
      if (REDUCED) { drawnCol = -1; drawSprite(animStart); } else drawSprite(now);
      el.style.transform = 'translate(' + (x - HALF) + 'px,' + (y - HALF) + 'px) scaleX(' + facing + ')';
      requestAnimationFrame(frame);
      return;
    }

    var zone = keepOutZone();
    var tx = lag.x, ty = lag.y, gap = GAP, perched = false;

    if (zone) {
      evict(zone); /* a scroll or a respawn can drop him in - walk him back out */
      if (cursorInside(zone)) { /* cursor stepped in - he takes the high ground */
        perched = true;
        tx = Math.max(zone.box.left + 24, Math.min(zone.box.right - 24, mx));
        ty = zone.t; /* sat on the lid, feet over the white border */
        gap = 3;
      }
      var way = detour(zone, tx, ty);
      if (way) { tx = way[0]; ty = way[1]; gap = 2; }
    }

    var dx = tx - x, dy = ty - y;
    var dist = Math.hypot(dx, dy);
    var moving = dist > gap && !dead && now >= damageUntil;

    if (moving) {
      var speed = Math.min(dist * EASE, TOP);
      x += dx / dist * speed;
      y += dy / dist * speed;
      if (Math.abs(dx) > 2) facing = dx < 0 ? -1 : 1;
      idleFrames = 0;
      bubble.classList.remove('show');
    } else if (!dead && now >= damageUntil) {
      if (perched && Math.abs(mx - x) > 2) facing = mx < x ? -1 : 1; /* he watches the fight */
      idleFrames++;
      if (idleFrames > 90 && now - lastSpeak > 14000 && Math.random() < 0.012) {
        say(); lastSpeak = now;
      }
    }

    /* choose the animation: death > damage > move/idle */
    if (dead) { /* state already 'death', holds on last frame */ }
    else if (now < damageUntil) setState('damage', animStart || now);
    else setState(moving ? 'move' : 'idle', now);

    if (zone) evict(zone); /* the border holds, whatever else happened this frame */

    if (REDUCED) { drawnCol = -1; drawSprite(animStart); } /* one still frame */
    else drawSprite(now);

    el.style.transform = 'translate(' + (x - HALF) + 'px,' + (y - HALF) + 'px) scaleX(' + facing + ')';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
