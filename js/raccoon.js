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

  var COARSE  = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var P = 3; /* scale: one pixel = 3 SVG units, same 48x48 viewBox as v1 */

  /* ---- the sprite, as rows of palette roles -------------------------- */
  var BODY_ROWS = [           /* rows 0-13, tail baked into cols 0-1 */
    '..DD......DD.',
    '.DMD......DMD',
    '.DKMD....DMKD',
    '...DMMMMMMD..',
    '..DMMMMMMMMD.',
    '..DKKKMMKKKD.',
    null,                     /* row 6 = the eyes, swapped per frame  */
    '..DMLLLLLLMD.',
    'M..DLLNNLLD..',
    'D...DMLLMD...',
    'DM.DMMMMMMD..',
    'MDDMMLLLMMMD.',
    'DMDMMLLLMMMD.',
    'MD.DMMMMMMD..'
  ];
  var EYES_OPEN   = '..DKWPMMWPKD.';
  var EYES_CLOSED = '..DKKKMMKKKD.';
  var FEET = {                /* row 14 */
    idle:  '...KK....KK..',
    walk1: '..KK......KK.',
    walk2: '....KK..KK...'
  };

  /* ---- the art styles ------------------------------------------------ */
  var STYLES = {
    classic:     { D:'#555555', K:'#333333', M:'#888888', L:'#cccccc', W:'#ffffff', P:'#111111', N:'#333333' },
    gameboy:     { D:'#0f380f', K:'#0f380f', M:'#306230', L:'#8bac0f', W:'#9bbc0f', P:'#0f380f', N:'#0f380f' },
    mono:        { D:'#ffffff', K:'#000000', M:'#111111', L:'#000000', W:'#ffffff', P:'#000000', N:'#ffffff' },
    animatronic: { D:'#0a0510', K:'#1a0f24', M:'#2d1a3d', L:'#4a2b63', W:'#050208', P:'#e23b3b', N:'#111111' },
    farm:        { D:'#4a3018', K:'#2d1c0d', M:'#7a5230', L:'#d9b98a', W:'#ffffff', P:'#1c1208', N:'#2d1c0d' },
    steel:       { D:'#2a3243', K:'#1d2330', M:'#5a6b85', L:'#d8dee9', W:'#ffffff', P:'#0c0e13', N:'#1d2330' },
    sepia:       { D:'#3a2c14', K:'#2b2013', M:'#6b573a', L:'#d8c095', W:'#f0e2c0', P:'#2b2013', N:'#2b2013' },
    neon:        { D:'#ff5d8f', K:'#b8195c', M:'#ff8fb3', L:'#ffd1e0', W:'#ffffff', P:'#14110f', N:'#b8195c' }
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

  if (COARSE) return;   /* no follower on touch screens */

  /* ---- the follower ---------------------------------------------------- */
  var el = document.createElement('div');
  el.id = 'raccoon';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  /* stable structure: only the eye/feet groups get swapped per frame,
     so the CSS tail-wag and run-bob never restart mid-animation */
  var style = roomStyle();
  var eyesG, feetG, tailG, bodyG;
  function rebuild() {
    var pal = STYLES[style];
    el.innerHTML =
      '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' +
        '<g class="tail"></g><g class="bob"><g class="px-body"></g><g class="px-eyes"></g><g class="px-feet"></g></g>' +
      '</svg>';
    tailG = el.querySelector('.tail');
    bodyG = el.querySelector('.px-body');
    eyesG = el.querySelector('.px-eyes');
    feetG = el.querySelector('.px-feet');
    tailG.innerHTML = tailRects(pal);
    bodyG.innerHTML = bodyRects(pal);
    drawFrame(true);
  }
  var blink = false, feet = 'idle', drawnBlink = null, drawnFeet = null;
  function drawFrame(force) {
    var pal = STYLES[style];
    if (force || blink !== drawnBlink) {
      eyesG.innerHTML = rowRects(blink ? EYES_CLOSED : EYES_OPEN, 6, pal, 2);
      drawnBlink = blink;
    }
    if (force || feet !== drawnFeet) {
      feetG.innerHTML = rowRects(FEET[feet], 14, pal, 2);
      drawnFeet = feet;
    }
  }
  rebuild();

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
    'room-fnaf':     ['5 more nights…', "what's that noise?", '*checks the cameras*', 'power: low'],
    'room-stardew':  ['did you water the crops?', 'it is a good day', '*holds a parsnip*', 'the Junimos like you'],
    'room-undertale': ['* you feel determined', '* (raccoon)', 'stay determined', '* the trash rustles'],
    'room-fencing':  ['en garde!', 'allez!', 'point! \u{1F534}', 'nice riposte'],
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
    bubble.style.top  = (y - 6) + 'px';
    bubble.classList.add('show');
    clearTimeout(speak.t);
    speak.t = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2600);
  }
  function say() {
    var L = lines();
    speak(L[(Math.random() * L.length) | 0]);
  }

  /* ---- style morphing --------------------------------------------------
     every so often the raccoon flickers through a few palettes and
     settles on a new one. RaccoonArt.morph() is public - try it.       */
  var morphTimer = null, flickerTimer = null;
  function setStyle(name) {
    if (!STYLES[name]) return;
    style = name;
    rebuild();
  }
  function morph(targetName) {
    var target = STYLES[targetName] ? targetName :
      STYLE_NAMES.filter(function (n) { return n !== style; })[(Math.random() * (STYLE_NAMES.length - 1)) | 0];
    clearInterval(flickerTimer);
    if (REDUCED) { setStyle(target); return; }
    el.classList.add('morphing');
    var steps = 0;
    flickerTimer = setInterval(function () {
      steps++;
      if (steps >= 5) {
        clearInterval(flickerTimer);
        el.classList.remove('morphing');
        setStyle(target);
        if (Math.random() < 0.4) speak(STYLE_LABEL[target] || target, 1800);
        return;
      }
      setStyle(STYLE_NAMES[(Math.random() * STYLE_NAMES.length) | 0]);
    }, 75);
  }
  window.RaccoonArt.morph = morph;
  window.RaccoonArt.setStyle = setStyle;

  function scheduleMorph(first) {
    clearTimeout(morphTimer);
    morphTimer = setTimeout(function () {
      /* sometimes he snaps back to the room's own style */
      morph(Math.random() < 0.3 ? roomStyle() : undefined);
      scheduleMorph(false);
    }, (first ? 9000 : 13000) + Math.random() * 11000);
  }
  if (!REDUCED) scheduleMorph(true);

  window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
  window.addEventListener('mousedown', function (e) { mx = e.clientX; my = e.clientY; });

  /* ---- main loop: follow the cursor, animate the frames ---------------- */
  var GAP = 36;
  var lastStep = 0, walkFoot = false, nextBlink = 2500 + Math.random() * 2500, blinkUntil = 0;

  function frame(now) {
    var dx = mx - x, dy = my - y;
    var dist = Math.hypot(dx, dy);
    var moving = dist > GAP;

    if (moving) {
      var speed = Math.min(dist * 0.16, 13);
      x += dx / dist * speed;
      y += dy / dist * speed;
      if (Math.abs(dx) > 2) facing = dx < 0 ? -1 : 1;
      el.classList.add('run');
      idleFrames = 0;
      bubble.classList.remove('show');
    } else {
      el.classList.remove('run');
      idleFrames++;
      if (idleFrames > 90 && now - lastSpeak > 14000 && Math.random() < 0.012) {
        say(); lastSpeak = now;
      }
    }

    if (!REDUCED) {
      if (moving) {                       /* walk cycle: alternate the feet */
        blink = false;
        if (now - lastStep > 130) { lastStep = now; walkFoot = !walkFoot; }
        feet = walkFoot ? 'walk1' : 'walk2';
      } else {                            /* idle: plant the feet, blink now and then */
        feet = 'idle';
        if (blink && now > blinkUntil) { blink = false; nextBlink = now + 2200 + Math.random() * 3000; }
        else if (!blink && now > nextBlink) { blink = true; blinkUntil = now + 150; }
      }
      drawFrame(false);
    }

    el.style.transform = 'translate(' + (x - 24) + 'px,' + (y - 24) + 'px) scaleX(' + facing + ')';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
