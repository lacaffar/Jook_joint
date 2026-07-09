/* =====================================================================
   stardew.js - RACCOON HOLLOW, a walkable farm.
   A little tile map you actually walk around: WASD/arrows to move,
   E / Space (or the touch buttons) to interact with what's in front
   of you. Hoe, plant, water, sleep, harvest. Talk to the neighbors.
   Harvest 9 crops and the raccoon parts with a bottle cap.
   ===================================================================== */
(function () {
  'use strict';

  var wrap = document.querySelector('#farm');
  if (!wrap) return;

  /* ---- the map --------------------------------------------------------
     T tree   ~ water   . grass   # path   F farmhouse   C crop soil
     M mine   G gate/fence decoration                                   */
  var MAP = [
    'TTTTTTTTTTTTTTTTTTTT',
    'T.T..FF...T..~~~..TT',
    'T....FF......~~~~..T',
    'T.CCC....#...~~~...T',
    'T.CCC....#....~....T',
    'T.CCC....######..M.T',
    'T........#.........T',
    'T..T.....#.........T',
    'T........#####.....T',
    'T..R.........#..T..T',
    'T....T.......#.....T',
    'TTTTTTTTTTTTTTTTTTTT'
  ].map(function (r) { return r.split(''); });
  var ROWS = MAP.length, COLS = MAP[0].length;
  var SOLID = { T: 1, '~': 1, F: 1, M: 1 };

  var NPCS = [
    { id: 'fern', name: 'Granny Fern', face: '🧓', x: 12, y: 7, home: { x: 12, y: 7 },
      lines: ['Oh, hello dear! The parsnips look happy today.',
              'My knees say rain tomorrow. My knees are never wrong.',
              'You remind me of your grandpa. He also talked to raccoons.',
              'Bring me a parsnip sometime, I’ll make soup.'] },
    { id: 'rob', name: 'Robbie', face: '👷', x: 5, y: 8, home: { x: 5, y: 8 },
      lines: ['Need the farmhouse fixed? Gimme, uh... three thousand wood.',
              'That mine’s full of geodes. And spiders. Mostly spiders.',
              'I could build you a coop if you ever stop hoarding bottle caps.',
              'The bridge east is still busted. The raccoon "borrowed" the nails.'] }
  ];
  var RACCOON_BUSH = { x: 3, y: 9 };

  /* ---- state ----------------------------------------------------------- */
  var TILE = 34;
  var st = load();
  function load() {
    var base = { day: 1, gold: 0, harvested: 0, crops: {} };
    try {
      var raw = localStorage.getItem('sjj_stardew');
      if (raw) { var s = JSON.parse(raw); if (s && s.crops) return s; }
    } catch (e) {}
    return base;
  }
  function persist() { try { localStorage.setItem('sjj_stardew', JSON.stringify(st)); } catch (e) {} }

  /* crop stages: 0 wild soil, 1 tilled, 2 seeded, 3 watered, 4 grown */
  function cropKey(x, y) { return x + ',' + y; }
  function cropState(x, y) { return st.crops[cropKey(x, y)] || 0; }

  var px = 7, py = 6, facing = { x: 0, y: 1 };   /* start on the path */

  /* ---- build the DOM ---------------------------------------------------- */
  var grid = document.createElement('div');
  grid.className = 'farm-grid';
  grid.style.width = (COLS * TILE) + 'px';
  grid.style.height = (ROWS * TILE) + 'px';
  wrap.appendChild(grid);

  var TILE_BG = { T: 'tile-grass', '.': 'tile-grass', '#': 'tile-path', '~': 'tile-water',
                  F: 'tile-grass', C: 'tile-soil', M: 'tile-rock', R: 'tile-grass' };
  var TILE_ICO = { T: '🌲', '~': '', '.': '', '#': '', F: '🏡', C: '', M: '⛰️', R: '🌳' };

  var cropEls = {};
  for (var y = 0; y < ROWS; y++) {
    for (var x = 0; x < COLS; x++) {
      var ch = MAP[y][x];
      var t = document.createElement('div');
      t.className = 'farm-tile ' + (TILE_BG[ch] || 'tile-grass');
      t.style.left = (x * TILE) + 'px';
      t.style.top = (y * TILE) + 'px';
      var ico = TILE_ICO[ch];
      if (ch === 'F') {
        /* one big house over the 2x2 block, drawn from its top-left tile */
        var topLeft = !(y > 0 && MAP[y - 1][x] === 'F') && !(x > 0 && MAP[y][x - 1] === 'F');
        if (topLeft) { t.textContent = '🏡'; t.classList.add('house-main'); }
      } else if (ico) t.textContent = ico;
      if (ch === 'R') { t.textContent = '🌳'; t.classList.add('bush'); t.id = 'rac-bush'; }
      if (ch === 'C') { cropEls[cropKey(x, y)] = t; t.classList.add('crop'); }
      grid.appendChild(t);
    }
  }

  function renderCrop(x, y) {
    var el = cropEls[cropKey(x, y)];
    if (!el) return;
    var s = cropState(x, y);
    el.classList.toggle('tilled', s >= 1);
    el.classList.toggle('wet', s === 3);
    el.textContent = s === 2 ? '🌱' : s === 3 ? '🌱' : s === 4 ? '🥕' : '';
  }
  Object.keys(cropEls).forEach(function (k) {
    var p = k.split(','); renderCrop(+p[0], +p[1]);
  });

  function makeSprite(cls, face) {
    var el = document.createElement('div');
    el.className = 'farm-sprite ' + cls;
    el.textContent = face;
    grid.appendChild(el);
    return el;
  }
  var playerEl = makeSprite('player', '🧑‍🌾');
  NPCS.forEach(function (n) { n.el = makeSprite('npc', n.face); place(n.el, n.x, n.y); });

  function place(el, x, y) {
    el.style.transform = 'translate(' + (x * TILE) + 'px,' + (y * TILE) + 'px)';
  }
  place(playerEl, px, py);

  /* ---- HUD -------------------------------------------------------------- */
  var hud = document.querySelector('#farm-hud');
  function renderHud() {
    hud.innerHTML = '<b>☀️ Day ' + st.day + '</b> · Spring · <b>💰 ' + st.gold + 'g</b> · ' +
      '🥕 harvested <b>' + st.harvested + '</b>/9' +
      (st.harvested >= 9 ? ' ✓' : '');
  }
  renderHud();

  /* ---- dialogue / message box ------------------------------------------- */
  var msgBox = document.querySelector('#farm-msg');
  var msgTimer = null;
  function msg(text, who, sticky) {
    msgBox.innerHTML = '';
    if (who) {
      var name = document.createElement('b');
      name.textContent = who + '  ';
      msgBox.appendChild(name);
    }
    msgBox.appendChild(document.createTextNode(text));
    msgBox.classList.add('show');
    clearTimeout(msgTimer);
    if (!sticky) msgTimer = setTimeout(function () { msgBox.classList.remove('show'); }, 3600);
  }

  /* ---- interactions ------------------------------------------------------ */
  function npcAt(x, y) {
    for (var i = 0; i < NPCS.length; i++) if (NPCS[i].x === x && NPCS[i].y === y) return NPCS[i];
    return null;
  }

  function interact() {
    var tx = px + facing.x, ty = py + facing.y;
    if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return;
    var n = npcAt(tx, ty);
    if (n) {
      n.lineIdx = ((n.lineIdx || 0) + 1) % n.lines.length;
      msg(n.lines[n.lineIdx], n.face + ' ' + n.name);
      if (window.SFX) SFX.blip();
      return;
    }
    var ch = MAP[ty][tx];
    if (ch === 'C') return workCrop(tx, ty);
    if (ch === 'F') return houseMenu();
    if (ch === 'M') return mine();
    if (ch === 'R') {
      var bush = document.querySelector('#rac-bush');
      bush.classList.remove('rustle'); void bush.offsetWidth; bush.classList.add('rustle');
      msg('🦝 the raccoon skitters out, drops a bottle cap SHAPED leaf, and vanishes. typical.');
      if (window.SFX) SFX.step();
      return;
    }
    if (ch === '~') { msg('* you skip a stone. it sinks with dignity.'); return; }
    if (ch === 'T') { msg('* a sturdy tree. Robbie would want you to chop it. you pat it instead.'); return; }
    msg('* nothing here but honest dirt.');
  }

  function workCrop(x, y) {
    var s = cropState(x, y);
    if (s === 0) { st.crops[cropKey(x, y)] = 1; msg('* you till the soil. 🪓'); if (window.SFX) SFX.step(); }
    else if (s === 1) { st.crops[cropKey(x, y)] = 2; msg('* you plant parsnip seeds. 🌱'); if (window.SFX) SFX.blip(); }
    else if (s === 2) { st.crops[cropKey(x, y)] = 3; msg('* you water the seeds. 💧 (sleep to grow them)'); if (window.SFX) SFX.click(); }
    else if (s === 3) { msg('* already watered. it needs a night’s sleep, same as you.'); }
    else if (s === 4) {
      st.crops[cropKey(x, y)] = 1;
      st.gold += 35; st.harvested++;
      msg('* you harvest a parsnip! +35g');
      if (window.SFX) SFX.coin();
      if (st.harvested === 9 && window.SJJQuest) {
        setTimeout(function () {
          msg('🧓 "Nine parsnips! Grandpa would be proud." ...the raccoon leaves something on the fence.', null, true);
          SJJQuest.award('stardew');
        }, 700);
      }
    }
    persist(); renderCrop(x, y); renderHud();
  }

  /* farmhouse overlay: farm file + sleep */
  var houseOv = document.querySelector('#farm-house');
  function houseMenu() {
    houseOv.hidden = false;
    if (window.SFX) SFX.click();
  }
  document.querySelector('#farm-sleep').addEventListener('click', function () {
    houseOv.hidden = true;
    var night = document.querySelector('#farm-night');
    night.hidden = false;
    if (window.SFX) SFX.save();
    setTimeout(function () {
      var grew = 0;
      Object.keys(st.crops).forEach(function (k) {
        if (st.crops[k] === 3) { st.crops[k] = 4; grew++; }
      });
      st.day++;
      persist();
      Object.keys(cropEls).forEach(function (k) { var p = k.split(','); renderCrop(+p[0], +p[1]); });
      renderHud();
      night.hidden = true;
      msg('☀️ Day ' + st.day + '. ' + (grew ? grew + ' crop' + (grew > 1 ? 's' : '') + ' grew overnight!' :
        'the radio says it’ll be clear today.'));
    }, 1400);
  });
  document.querySelector('#farm-house-close').addEventListener('click', function () {
    houseOv.hidden = true;
  });

  /* mine overlay: smash the rock */
  var mineOv = document.querySelector('#farm-mine');
  var rockBtn = document.querySelector('#farm-rock');
  var rockHp = 0;
  function mine() {
    mineOv.hidden = false;
    rockHp = 6 + ((Math.random() * 4) | 0);
    rockBtn.textContent = '🪨';
    rockBtn.disabled = false;
    document.querySelector('#farm-mine-note').textContent = 'whack the rock. (' + rockHp + ' swings)';
    if (window.SFX) SFX.click();
  }
  rockBtn.addEventListener('click', function () {
    if (rockBtn.disabled) return;
    rockHp--;
    rockBtn.classList.remove('crack'); void rockBtn.offsetWidth; rockBtn.classList.add('crack');
    if (window.SFX) SFX.slash();
    if (rockHp <= 0) {
      rockBtn.textContent = '💎';
      rockBtn.disabled = true;
      var g = 20 + ((Math.random() * 30) | 0);
      st.gold += g; persist(); renderHud();
      document.querySelector('#farm-mine-note').textContent = 'a geode! +' + g + 'g. Robbie whistles, impressed.';
      if (window.SFX) SFX.coin();
    } else {
      document.querySelector('#farm-mine-note').textContent = rockHp + ' more...';
    }
  });
  document.querySelector('#farm-mine-close').addEventListener('click', function () {
    mineOv.hidden = true;
  });

  /* ---- movement ---------------------------------------------------------- */
  var lastMove = 0;
  function tryMove(dx, dy) {
    var now = performance.now();
    if (now - lastMove < 130) return;
    lastMove = now;
    facing = { x: dx, y: dy };
    playerEl.classList.toggle('flip', dx < 0);
    var nx = px + dx, ny = py + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
    if (SOLID[MAP[ny][nx]] || npcAt(nx, ny)) {
      if (MAP[ny][nx] === 'R') { /* bush is walk-through-able rustle */ }
      else { playerEl.classList.remove('step'); void playerEl.offsetWidth; playerEl.classList.add('step'); return; }
    }
    px = nx; py = ny;
    place(playerEl, px, py);
    if (window.SFX) SFX.step();
    if (px === RACCOON_BUSH.x && py === RACCOON_BUSH.y) {
      var bush = document.querySelector('#rac-bush');
      bush.classList.remove('rustle'); void bush.offsetWidth; bush.classList.add('rustle');
    }
  }

  var overlaysOpen = function () { return !houseOv.hidden || !mineOv.hidden; };
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (overlaysOpen()) {
      if (k === 'escape' || k === 'e' || k === ' ') { houseOv.hidden = true; mineOv.hidden = true; e.preventDefault(); }
      return;
    }
    var map = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1],
                a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
    if (map[k]) {
      /* only steal the keys while the farm is on screen */
      var r = wrap.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      e.preventDefault();
      tryMove(map[k][0], map[k][1]);
    } else if (k === 'e' || k === ' ' || k === 'enter') {
      var r2 = wrap.getBoundingClientRect();
      if (r2.bottom < 0 || r2.top > innerHeight) return;
      e.preventDefault();
      interact();
    }
  });

  /* touch controls */
  document.querySelectorAll('.farm-pad button').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.dataset.dir;
      if (d === 'act') return interact();
      var map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      tryMove(map[d][0], map[d][1]);
    });
  });

  /* NPC idle wander */
  setInterval(function () {
    NPCS.forEach(function (n) {
      if (Math.random() < 0.5) return;
      var opts = [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(function (d) {
        var nx = n.x + d[0], ny = n.y + d[1];
        return Math.abs(nx - n.home.x) <= 1 && Math.abs(ny - n.home.y) <= 1 &&
               nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
               !SOLID[MAP[ny][nx]] && MAP[ny][nx] !== 'C' &&
               !(nx === px && ny === py) && !npcAt(nx, ny);
      });
      if (!opts.length) return;
      var d = opts[(Math.random() * opts.length) | 0];
      n.x += d[0]; n.y += d[1];
      n.el.classList.toggle('flip', d[0] < 0);
      place(n.el, n.x, n.y);
    });
  }, 2400);

  msg('* WASD / arrows to walk · E or SPACE to use what’s in front of you. grandpa’s note says: "nine parsnips."', null, true);
})();
