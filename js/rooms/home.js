/* =====================================================================
   home.js - the bar itself.
   Hotspots in the scene (jukebox, coin pouch, light switch, trash can),
   the secret sixth door, and a certain 30-year-old cheat code.
   ===================================================================== */
(function () {
  'use strict';

  var scene = document.querySelector('#bar-scene');
  if (!scene) return;

  /* ---- secret door unlocks with all five caps ------------------------ */
  function refreshBackDoor() {
    var open = window.SJJQuest && SJJQuest.all();
    scene.classList.toggle('all-caps', !!open);
    var d = document.querySelector('.door-backroom');
    if (d) {
      d.setAttribute('aria-hidden', open ? 'false' : 'true');
      d.tabIndex = open ? 0 : -1;
    }
  }
  refreshBackDoor();
  window.addEventListener('sjj:caps', refreshBackDoor);

  /* ---- scene jukebox pipes to the real jukebox button ---------------- */
  var juke = document.querySelector('#scene-jukebox');
  if (juke) juke.addEventListener('click', function () {
    var real = document.querySelector('#jukebox-btn');
    if (real) real.click();
    juke.classList.toggle('spinning');
  });

  /* ---- the coin pouch (straight out of Kingdom) ------------------------ */
  /* Click the pouch: a coin is tossed in from above, falls under gravity,
     clinks off the funnel of the neck and settles onto the pile inside.
     The pile is real physics - circles, collisions, sleeping bodies -
     drawn on a small canvas over the pouch art. The walls of the sim
     follow the silhouette of EmptyPouch.png, measured from its alpha. */
  var jar = document.querySelector('#tip-jar');
  var pouchImg = document.querySelector('#pouch-img');
  var pouchCanvas = document.querySelector('#pouch-canvas');
  if (jar && pouchImg && pouchCanvas && pouchCanvas.getContext) {
    var pctx = pouchCanvas.getContext('2d');
    var PS = 2;                              // backing pixels per sim unit
    var PW = 48, PH = 94;                    // canvas size, sim units
    var BAGW = 36, BAGH = 57;                // bag art size, sim units
    var BAGTOP = PH - 2 - BAGH;              // y of the bag's top edge
    var PCX = PW / 2;
    var WALL = 2;                            // bag wall thickness
    var CR = 1.8;                            // coin radius
    var GRAV = 300;
    var FLOORY = BAGTOP + BAGH * 0.92;       // resting line in the round bottom
    var SIM_CAP = 110;                       // ~full to the collar, like the art

    /* [t down the bag 0..1, outer half-width / bag width] from the png */
    var PROFILE = [
      [0.06, .40], [0.125, .46], [0.19, .375], [0.25, .334], [0.31, .313],
      [0.375, .375], [0.44, .397], [0.5, .456], [0.56, .48], [0.625, .5],
      [0.75, .5], [0.81, .459], [0.875, .417], [0.94, .334], [1, .183]
    ];
    var MOUTHY = BAGTOP + PROFILE[0][0] * BAGH;   // where the walls begin

    function bagHW(y) {                      // interior half-width at height y
      var t = (y - BAGTOP) / BAGH;
      if (t <= PROFILE[0][0]) return PROFILE[0][1] * BAGW - WALL;
      for (var i = 1; i < PROFILE.length; i++) {
        if (t <= PROFILE[i][0]) {
          var a = PROFILE[i - 1], b = PROFILE[i];
          var f = (t - a[0]) / (b[0] - a[0]);
          return (a[1] + (b[1] - a[1]) * f) * BAGW - WALL;
        }
      }
      return PROFILE[PROFILE.length - 1][1] * BAGW - WALL;
    }

    /* gold, silver, bronze - the coin colours of the full-pouch art */
    var PALS = [
      { b: '#ecc94f', d: '#a5771e', l: '#fdf6cf', w: .64 },
      { b: '#dfe3e8', d: '#8d94a0', l: '#ffffff', w: .18 },
      { b: '#b98045', d: '#7a4d1f', l: '#e6c193', w: .18 }
    ];
    function pickPal() {
      var r = Math.random(), acc = 0;
      for (var i = 0; i < PALS.length; i++) { acc += PALS[i].w; if (r < acc) return PALS[i]; }
      return PALS[0];
    }

    var coins = [];
    var rafId = 0, lastTs = 0;
    var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function landed(c) {
      if (c.landed) return;
      c.landed = true;
      if (window.SFX) SFX.coin();
      jar.classList.remove('clink'); void jar.offsetWidth; jar.classList.add('clink');
    }

    /* position-based Verlet: velocities live in (x-px, y-py), constraints
       are iterated, which keeps a pile of coins rock solid (an impulse
       solver slowly crushes stacks - gravity outruns one sweep a frame) */
    var DT = 1 / 120;
    function step() {
      var i, j, c, o;
      for (i = 0; i < coins.length; i++) {
        c = coins[i];
        if (c.asleep) continue;
        var mx = (c.x - c.px) * .998, my = (c.y - c.py) * .998;
        c.px = c.x; c.py = c.y;
        c.x += mx; c.y += my + GRAV * DT * DT;
      }
      var minD = CR * 2;
      for (var it = 0; it < 3; it++) {
        /* coin vs coin */
        for (i = 0; i < coins.length; i++) {
          c = coins[i];
          for (j = i + 1; j < coins.length; j++) {
            o = coins[j];
            if (c.asleep && o.asleep) continue;
            var dx = o.x - c.x, dy = o.y - c.y;
            var d2 = dx * dx + dy * dy;
            if (d2 >= minD * minD) continue;
            var d = Math.sqrt(d2), nx, ny, pen;
            if (d < 1e-4) { nx = 0; ny = 1; pen = minD; }
            else { nx = dx / d; ny = dy / d; pen = minD - d; }
            if (c.asleep || o.asleep) {
              /* sleeping coin is part of the pile: static, full push back */
              var m = c.asleep ? o : c, s = c.asleep ? 1 : -1;
              m.x += nx * pen * s; m.y += ny * pen * s;
              if (pen > .7) { var z = c.asleep ? c : o; z.asleep = false; z.still = 0; }
              landed(m);
            } else {
              c.x -= nx * pen / 2; c.y -= ny * pen / 2;
              o.x += nx * pen / 2; o.y += ny * pen / 2;
            }
          }
        }
        /* walls, funnel and floor */
        for (i = 0; i < coins.length; i++) {
          c = coins[i];
          if (c.asleep) continue;
          var vx = c.x - c.px, vy = c.y - c.py;
          if (c.y > MOUTHY) {
            var hw = bagHW(Math.min(c.y, BAGTOP + BAGH * 0.95));
            if (c.x < PCX - hw + CR) { c.x = PCX - hw + CR; c.px = c.x + vx * .3; }
            if (c.x > PCX + hw - CR) { c.x = PCX + hw - CR; c.px = c.x + vx * .3; }
          } else {
            /* open air above the bag: an invisible chute over the mouth */
            if (c.x < PCX - 12) { c.x = PCX - 12; c.px = c.x + vx * .3; }
            if (c.x > PCX + 12) { c.x = PCX + 12; c.px = c.x + vx * .3; }
          }
          if (c.y > FLOORY - CR) {
            c.y = FLOORY - CR;
            c.py = c.y + vy * .3;          /* a little bounce */
            c.px = c.x + vx * .25;         /* and floor friction */
            if (vy > .1) landed(c);
          }
        }
      }
      /* settle & sleep */
      for (i = 0; i < coins.length; i++) {
        c = coins[i];
        if (c.asleep) continue;
        if (Math.abs(c.x - c.px) + Math.abs(c.y - c.py) < .03) {
          if (++c.still > 20) { c.asleep = true; c.px = c.x; c.py = c.y; }
        } else c.still = 0;
      }
    }

    function drawCoins() {
      for (var i = 0; i < coins.length; i++) {
        var c = coins[i], p = c.pal;
        pctx.fillStyle = p.d;
        pctx.beginPath(); pctx.arc(c.x, c.y, CR + .35, 0, 6.2832); pctx.fill();
        pctx.fillStyle = p.b;
        pctx.beginPath(); pctx.arc(c.x, c.y, CR - .15, 0, 6.2832); pctx.fill();
        pctx.fillStyle = p.l;
        pctx.fillRect(c.x - CR * .55, c.y - CR * .55, 1, 1);
      }
    }

    function render() {
      pctx.setTransform(PS, 0, 0, PS, 0, 0);
      pctx.clearRect(0, 0, PW, PH);
      /* above the mouth: coins fly in the open */
      pctx.save();
      pctx.beginPath(); pctx.rect(0, 0, PW, MOUTHY + .5); pctx.clip();
      drawCoins();
      pctx.restore();
      /* below: clipped to the bag interior so the pile sits IN the pouch */
      pctx.save();
      pctx.beginPath();
      var i, y, hw;
      for (i = 0; i < PROFILE.length; i++) {
        y = BAGTOP + PROFILE[i][0] * BAGH; hw = PROFILE[i][1] * BAGW - WALL + 1;
        if (i === 0) pctx.moveTo(PCX - hw, y); else pctx.lineTo(PCX - hw, y);
      }
      for (i = PROFILE.length - 1; i >= 0; i--) {
        y = BAGTOP + PROFILE[i][0] * BAGH; hw = PROFILE[i][1] * BAGW - WALL + 1;
        pctx.lineTo(PCX + hw, y);
      }
      pctx.closePath(); pctx.clip();
      drawCoins();
      pctx.restore();
    }

    function anyAwake() {
      for (var i = 0; i < coins.length; i++) if (!coins[i].asleep) return true;
      return false;
    }
    var acc = 0;
    function frame(ts) {
      var dt = Math.min((ts - lastTs) / 1000, .05); lastTs = ts;
      acc += dt;
      var n = 0;
      while (acc >= DT && n < 8) { step(); acc -= DT; n++; }
      if (n === 8) acc = 0;
      render();
      rafId = anyAwake() ? requestAnimationFrame(frame) : 0;
    }
    function ensureLoop() {
      if (!rafId) { lastTs = performance.now(); acc = 0; rafId = requestAnimationFrame(frame); }
    }

    function spawnCoin() {
      if (coins.length >= SIM_CAP) {
        /* bag is full: the deepest coin quietly "settles in" to make room,
           waking its neighbours so the pile slumps into the gap */
        var deep = 0, i;
        for (i = 1; i < coins.length; i++) if (coins[i].y > coins[deep].y) deep = i;
        var gone = coins.splice(deep, 1)[0];
        for (i = 0; i < coins.length; i++) {
          if (Math.abs(coins[i].x - gone.x) + Math.abs(coins[i].y - gone.y) < CR * 6) {
            coins[i].asleep = false; coins[i].still = 0;
          }
        }
      }
      var x = PCX + (Math.random() * 10 - 5);
      var vx = (Math.random() * 24 - 12) * DT, vy = (10 + Math.random() * 20) * DT;
      coins.push({
        x: x, y: 4, px: x - vx, py: 4 - vy,
        pal: pickPal(), still: 0, asleep: false, landed: false
      });
      if (REDUCED) {
        for (var k = 0; k < 400; k++) step();
        render();
      } else ensureLoop();
    }

    /* rebuild the saved pile: hex-pack from the floor up, then relax */
    function prefill(n) {
      var placed = 0, row = 0;
      while (placed < n && row < 40) {
        var y = FLOORY - CR - row * CR * 1.74;
        var hw = bagHW(y) - CR;
        if (hw > 0) {
          var x = PCX - hw + (row % 2 ? CR : 0);
          while (x <= PCX + hw && placed < n) {
            var jx = x + (Math.random() * .6 - .3);
            coins.push({
              x: jx, y: y, px: jx, py: y,
              pal: pickPal(), still: 0, asleep: false, landed: true
            });
            placed++; x += CR * 2;
          }
        }
        row++;
      }
      /* relax with everyone awake - sleepers would freeze overlapped */
      for (var k = 0; k < 240; k++) {
        step();
        for (var j = 0; j < coins.length; j++) { coins[j].asleep = false; coins[j].still = 0; }
      }
      for (var i = 0; i < coins.length; i++) {
        coins[i].asleep = true; coins[i].px = coins[i].x; coins[i].py = coins[i].y;
      }
      render();
    }

    var tips = 0;
    try { tips = parseInt(localStorage.getItem('sjj_tipjar') || '0', 10) || 0; } catch (e) {}
    var label = function () {
      jar.title = tips === 0 ? 'the coin pouch. tied shut. it dreams of gold.' :
        'the coin pouch: ' + tips + ' imaginary coin' + (tips === 1 ? '' : 's') + '. thank you.';
      var closed = tips === 0;
      var want = closed ? 'PouchClosed.png' : 'EmptyPouch.png';
      if (pouchImg.getAttribute('src') !== want) pouchImg.setAttribute('src', want);
      pouchImg.classList.toggle('closed', closed);
    };
    label();
    if (tips > 0) prefill(Math.min(tips, SIM_CAP));
    jar.addEventListener('click', function () {
      tips++;
      try { localStorage.setItem('sjj_tipjar', String(tips)); } catch (e) {}
      label();
      spawnCoin();
    });
  }

  /* ---- light switch ----------------------------------------------------- */
  var sw = document.querySelector('#light-switch');
  function setLights(off) {
    document.body.classList.toggle('lights-off', off);
    if (sw) {
      sw.textContent = off ? '⭘' : '⏻';
      sw.setAttribute('aria-pressed', String(off));
      sw.title = off ? 'lights are OFF. the neon likes it. turn them back on?' : 'the light switch. best viewed at night, they said.';
    }
    try { localStorage.setItem('sjj_lights', off ? '1' : '0'); } catch (e) {}
  }
  var lightsOff = false;
  try { lightsOff = localStorage.getItem('sjj_lights') === '1'; } catch (e) {}
  setLights(lightsOff);
  if (sw) sw.addEventListener('click', function () {
    setLights(!document.body.classList.contains('lights-off'));
    if (window.SFX) SFX.click();
  });

  /* ---- trash can (his) --------------------------------------------------- */
  var trash = document.querySelector('#trash-can');
  if (trash) {
    var pokes = 0;
    var bubble = document.createElement('div');
    bubble.className = 'rac-speech';
    document.body.appendChild(bubble);
    trash.addEventListener('click', function () {
      pokes++;
      trash.classList.remove('shake'); void trash.offsetWidth; trash.classList.add('shake');
      if (window.SFX) SFX.step();
      var r = trash.getBoundingClientRect();
      bubble.style.left = (r.left + r.width / 2) + 'px';
      bubble.style.top = (r.top - 4) + 'px';
      bubble.textContent = pokes < 5 ? ['*rustle*', 'mine.', '*hiss*', 'do NOT'][pokes % 4] : 'FINE. take a cap hunt hint: play every room.';
      bubble.classList.add('show');
      setTimeout(function () { bubble.classList.remove('show'); }, 2000);
      if (pokes === 5 && window.RaccoonSVG) {
        var pop = document.createElement('div');
        pop.className = 'trash-raccoon';
        pop.innerHTML = window.RaccoonSVG;
        trash.appendChild(pop);
        if (window.SFX) SFX.deny();
        setTimeout(function () { pop.remove(); pokes = 0; }, 2400);
      }
    });
  }

  /* ---- the stools ------------------------------------------------------ */
  var STOOL_LINES = ['*squeak*', '*creak*', 'this one wobbles.', 'best seat in the house.',
                     'reserved. for whom? unclear.', 'the raccoon naps here at 3pm.'];
  document.querySelectorAll('.stool').forEach(function (stool, i) {
    stool.addEventListener('click', function () {
      stool.classList.remove('wobble'); void stool.offsetWidth; stool.classList.add('wobble');
      if (window.SFX) SFX.step();
      var bub = document.createElement('div');
      bub.className = 'rac-speech';
      bub.textContent = STOOL_LINES[(Math.random() * STOOL_LINES.length) | 0];
      var r = stool.getBoundingClientRect();
      bub.style.left = (r.left + r.width / 2) + 'px';
      bub.style.top = (r.top - 4) + 'px';
      document.body.appendChild(bub);
      requestAnimationFrame(function () { bub.classList.add('show'); });
      setTimeout(function () { bub.remove(); }, 1800);
    });
  });

  /* ---- smack the neon sign (the whole board jolts) ---------------------- */
  var signBoard = document.querySelector('#sign-board') || document.querySelector('.sign');
  if (signBoard) signBoard.addEventListener('click', function () {
    signBoard.classList.remove('smacked'); void signBoard.offsetWidth;
    signBoard.classList.add('smacked');
    if (window.SFX) SFX.buzz();
  });

  /* ---- ↑↑↓↓←→←→BA ---------------------------------------------------------- */
  var CODE = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  var pos = 0;
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    pos = (k === CODE[pos]) ? pos + 1 : (k === CODE[0] ? 1 : 0);
    if (pos === CODE.length) { pos = 0; party(); }
  });
  function party() {
    if (!window.RaccoonSVG) return;
    if (window.SFX) SFX.chime();
    if (window.SJJQuest) SJJQuest.toast(' THE RACCOONS HEARD THE CODE ');
    for (var i = 0; i < 12; i++) {
      (function (i) {
        setTimeout(function () {
          var r = document.createElement('div');
          r.className = 'rac-party';
          r.innerHTML = window.RaccoonSVG;
          r.style.top = (8 + Math.random() * 80) + 'vh';
          var dur = 2.2 + Math.random() * 2.8;
          r.style.animationDuration = dur + 's';
          if (Math.random() < 0.5) { r.classList.add('reverse'); }
          document.body.appendChild(r);
          setTimeout(function () { r.remove(); }, dur * 1000 + 200);
        }, i * 260);
      })(i);
    }
  }
})();
