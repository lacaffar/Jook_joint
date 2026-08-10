/* =====================================================================
   home.js - the bar itself.
   Hotspots in the scene (jukebox, coin pouch, light switch, trash can),
   the secret sixth door, and a certain 30-year-old cheat code.
   ===================================================================== */
(function () {
  'use strict';

  var scene = document.querySelector('#bar-scene');
  if (!scene) return;

  /* ---- a speech bubble over any element ------------------------------ */
  function bubbleAt(el, text, ms) {
    var b = document.createElement('div');
    b.className = 'rac-speech';
    b.textContent = text;
    var r = el.getBoundingClientRect();
    b.style.left = (r.left + r.width / 2) + 'px';
    b.style.top = (r.top - 4) + 'px';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('show'); });
    setTimeout(function () { b.remove(); }, ms || 1900);
  }

  /* ---- secret door: five caps, or the other way in ------------------- */
  var BACKDOOR = 'sjj_backdoor';
  function toldTheSecret() {
    try { return localStorage.getItem(BACKDOOR) === '1'; } catch (e) { return false; }
  }
  function refreshBackDoor() {
    var open = (window.SJJQuest && SJJQuest.all()) || toldTheSecret();
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

  /* =====================================================================
     THE OTHER WAY IN
     Three plays on the jukebox, take one of the cat's nine, then ask Ray.
     Out of order and you start again. Counting happens on #jukebox-btn
     only - the jukebox in the scene forwards its click to that button, so
     either one counts exactly once.
     ===================================================================== */
  var SEQ = ['juke', 'juke', 'juke', 'cat', 'ray'];
  var step = 0;

  function secretStep(kind) {
    if (kind === SEQ[step]) step++;
    else step = (kind === SEQ[0]) ? 1 : 0;
    if (step === SEQ.length) { step = 0; letThemIn(); }
  }

  function letThemIn() {
    try { localStorage.setItem(BACKDOOR, '1'); } catch (e) {}
    if (window.SFX) SFX.chime();
    if (window.SJJQuest) {
      SJJQuest.toast(' Ray tilts his head at the back wall. The door was never locked.', true);
    }
    refreshBackDoor();
    setTimeout(function () { location.href = 'backroom.html'; }, 1900);
  }

  var realJuke = document.querySelector('#jukebox-btn');
  if (realJuke) realJuke.addEventListener('click', function () { secretStep('juke'); });

  /* ---- the cat. She has nine, and is dramatic about each one. -------- */
  var cat = document.querySelector('#bar-cat');
  if (cat) {
    var lives = 9;
    cat.addEventListener('click', function () {
      if (cat.classList.contains('gone')) return;   /* already down; wait */
      secretStep('cat');
      lives--;
      cat.classList.add('gone');
      bubbleAt(cat, 'x_x', 2300);
      if (window.SFX) SFX.hurt();
      setTimeout(function () {
        cat.classList.remove('gone');
        cat.title = 'the house cat. ' + lives + ' left.';
        bubbleAt(cat, lives === 1 ? 'one left.' : lives + ' left.', 1700);
        if (window.SFX) SFX.blip();
      }, 2400);
    });
  }

  /* ---- Ray, who has been reviewing this joint all along ------------- */
  var rayImg = document.querySelector('.ray-img');
  var rayBubble = document.querySelector('.ray-bubble');
  var RAY_LINES = ['Mm-hm.', 'Keep going.', "That's the one.", 'I heard that.'];
  if (rayImg) rayImg.addEventListener('click', function () {
    var wasLast = step === SEQ.length - 1;
    secretStep('ray');
    if (!wasLast && rayBubble) {
      var was = rayBubble.textContent;
      rayBubble.textContent = RAY_LINES[(Math.random() * RAY_LINES.length) | 0];
      clearTimeout(rayImg._t);
      rayImg._t = setTimeout(function () { rayBubble.textContent = was; }, 2000);
    }
    if (window.SFX) SFX.blip();
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
    var PS = 7;                              // backing pixels per sim unit
    var PW = 48, PH = 94;                    // canvas size, sim units
    var BAGW = 36, BAGH = 57;                // bag art size, sim units
    var BAGTOP = PH - 2 - BAGH;              // y of the bag's top edge
    var PCX = PW / 2;
    var WALL = 2;                            // bag wall thickness
    var CR = 2.6;                            // coin radius - big enough to read as coinage
    var GRAV = 300;
    var FLOORY = BAGTOP + BAGH * 0.90;       // resting line in the round bottom
    var SIM_CAP = 52;                        // ~full to the collar (area scales with r²)

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
      { b: '#ecc94f', d: '#a5771e', l: '#fdf6cf', w: .70 },
      { b: '#dfe3e8', d: '#8d94a0', l: '#ffffff', w: .14 },
      { b: '#b98045', d: '#7a4d1f', l: '#e6c193', w: .16 }
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
        /* walls, funnel and floor (overflow coins are free to leave) */
        for (i = 0; i < coins.length; i++) {
          c = coins[i];
          if (c.asleep || c.spill) continue;
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
      /* Overflow. A bag packed to the collar does not take another coin:
         it bounces off the pile, arcs over the neck and falls down the
         page. This used to wait for the newcomer to actually touch the
         pile, and let it back in if it slipped past the mouth first -
         which meant that on a bag one coin short of settled, nothing
         ever spilled at all. Now capacity is capacity. */
      for (i = coins.length - 1; i >= 0; i--) {
        c = coins[i];
        if (!c.spill) continue;
        c.age++;
        if (c.landed || c.y > MOUTHY + CR ||
            Math.abs(c.x - PCX) > 13.5 || c.age > 240) {
          coins.splice(i, 1);
          ejectCoin(c);
        }
      }
      /* settle & sleep */
      for (i = 0; i < coins.length; i++) {
        c = coins[i];
        if (c.asleep || c.spill) continue;
        if (Math.abs(c.x - c.px) + Math.abs(c.y - c.py) < .03) {
          if (++c.still > 20) { c.asleep = true; c.px = c.x; c.py = c.y; }
        } else c.still = 0;
      }
      /* the spin a coin arrives with. It carries most of the way down,
         bleeds off on contact, and eases into a resting tilt once the
         coin is part of the pile - a settled coin lies flat, not askew. */
      for (i = 0; i < coins.length; i++) {
        c = coins[i];
        if (c.asleep) continue;
        c.tilt += c.spin * DT;
        c.spin *= (c.landed ? .90 : .995);
        if (c.landed && Math.abs(c.spin) < .5) {
          c.spin = 0;
          c.tilt += (c.rest - c.tilt) * .12;
        }
      }
    }

    /* an overflowed coin becomes a real element and falls down the page */
    function ejectCoin(c) {
      spilled++;
      if (spilled >= SPILLS_BEFORE_HEIST) theHeist();
      if (REDUCED) return;
      var rect = pouchCanvas.getBoundingClientRect();
      var s = rect.width / PW;
      var el = document.createElement('span');
      el.className = 'coin-spill';
      var size = CR * 2 * s;
      el.style.width = size + 'px'; el.style.height = size * .66 + 'px';
      el.style.background = c.pal.b;
      el.style.borderColor = c.pal.d;
      el.style.boxShadow = 'inset ' + (size * .22) + 'px ' + (size * .22) + 'px 0 ' + c.pal.l;
      var x = rect.left + (c.x - CR) * s, y = rect.top + (c.y - CR) * s;
      /* the bounce off the packed pile: an outward, slightly upward arc */
      var vx = (c.dir || 1) * (60 + Math.random() * 90);
      var vy = -(140 + Math.random() * 140);
      var rot = 0, rv = (Math.random() < .5 ? -1 : 1) * (180 + Math.random() * 360);
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      document.body.appendChild(el);
      var lt = performance.now();
      function fall(t) {
        var dt = Math.min((t - lt) / 1000, .05); lt = t;
        vy += 1600 * dt; x += vx * dt; y += vy * dt; rot += rv * dt;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg)';
        if (y < window.innerHeight + 60) requestAnimationFrame(fall);
        else el.remove();
      }
      requestAnimationFrame(fall);
    }

    /* coins are drawn as tilted ovals - discs lying in a pile, with the
       edge showing under the face, like the coins in the full-pouch art */
    function drawCoins() {
      for (var i = 0; i < coins.length; i++) {
        var c = coins[i], p = c.pal;
        pctx.save();
        pctx.translate(c.x, c.y);
        pctx.rotate(c.tilt || 0);
        pctx.fillStyle = p.d;                /* the edge underneath */
        pctx.beginPath(); pctx.ellipse(0, .24, CR + .12, CR * .72, 0, 0, 6.2832); pctx.fill();
        pctx.fillStyle = p.b;                /* the face */
        pctx.beginPath(); pctx.ellipse(0, -.14, CR - .04, CR * .60, 0, 0, 6.2832); pctx.fill();
        pctx.fillStyle = p.l;                /* a thin shine along the rim */
        pctx.beginPath(); pctx.ellipse(-.3, -.62, CR * .46, CR * .15, -.3, 0, 6.2832); pctx.fill();
        pctx.restore();
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
      /* a full bag doesn't stop anyone: the extra coin just overflows */
      var spilling = coins.length >= SIM_CAP;
      var x = PCX + (Math.random() * 20 - 10);   /* anywhere over the mouth */
      var y = 2 + Math.random() * 8;
      var vx = (Math.random() * 24 - 12) * DT, vy = (10 + Math.random() * 20) * DT;
      coins.push({
        x: x, y: y, px: x - vx, py: y - vy,
        pal: pickPal(),
        tilt: Math.random() * 6.283,                             /* flicked in at any angle */
        spin: (Math.random() < .5 ? -1 : 1) * (7 + Math.random() * 9),
        rest: Math.random() * .9 - .45,                          /* how it will lie once settled */
        still: 0, asleep: false, landed: false,
        spill: spilling, dir: Math.random() < .5 ? -1 : 1, age: 0
      });
      if (REDUCED) {
        for (var k = 0; k < 400; k++) step();
        render();
      } else ensureLoop();
    }

    /* ---- the heist ------------------------------------------------------
       Five coins on the floor is five too many for him. He comes over,
       takes the whole pouch, and leaves a bottle cap where it stood. */
    var SPILLS_BEFORE_HEIST = 5;
    var spilled = 0, robbed = false;
    var gone = document.querySelector('#tip-gone');
    var tipNote = document.querySelector('#tip-note');

    function afterHeist() {
      jar.hidden = true;
      if (tipNote) tipNote.hidden = true;
      if (gone) gone.hidden = false;
      if (window.SJJQuest) SJJQuest.award('tips');
    }
    function theHeist() {
      if (robbed) return;
      robbed = true;
      jar.disabled = true;
      /* he only exists where there is a real pointer; on a touch screen
         the pouch simply is not there when you look back */
      if (window.SJJRaccoon && !REDUCED) {
        setTimeout(function () { SJJRaccoon.steal(jar, afterHeist); }, 350);
      } else {
        setTimeout(afterHeist, 400);
      }
    }

    /* The pouch starts empty every visit - the pile is this visit's, not
       a savings account. The running total still counts, for the stats
       shelf in the back room. */
    var tips = 0;
    function bankIt() {
      try {
        var all = parseInt(localStorage.getItem('sjj_tipjar') || '0', 10) || 0;
        localStorage.setItem('sjj_tipjar', String(all + 1));
      } catch (e) {}
    }
    var label = function () {
      jar.title = tips === 0 ? 'the coin pouch. tied shut. it dreams of gold.' :
        'the coin pouch: ' + tips + ' imaginary coin' + (tips === 1 ? '' : 's') + '. thank you.';
      var closed = tips === 0;
      var want = closed ? 'PouchClosed.png' : 'EmptyPouch.png';
      if (pouchImg.getAttribute('src') !== want) pouchImg.setAttribute('src', want);
      pouchImg.classList.toggle('closed', closed);
    };
    label();
    jar.addEventListener('click', function () {
      if (robbed) return;
      tips++;
      bankIt();
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
