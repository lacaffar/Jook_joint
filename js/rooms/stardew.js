/* =====================================================================
   stardew.js - RACCOON HOLLOW, a walkable farm.

   WASD/arrows to move, E / Space to use what is in front of you.
   Hoe, plant, water, sleep, harvest, fish, mine. Talk to the neighbours.

   Two goals sit on top of that:
     - grandpa's note wants NINE PARSNIPS, and pays in bottle caps
     - you want a RING, which costs more money than a parsnip patch makes,
       so the farm has an economy: seeds cost gold, better crops cost more
       and take more nights, and every swing of the hoe costs energy.

   Turn on RIVAL mode and someone else is saving for the same ring.
   ===================================================================== */
(function () {
  'use strict';

  var wrap = document.querySelector('#farm');
  if (!wrap) return;

  /* =====================================================================
     PLACEHOLDER CHARACTER - the one you are buying the ring for.
     Swap these three lines when the real character art is ready:
       name  -> their name
       cls   -> a CSS class in stardew.css that draws them
       lines -> what they say before you propose
     The class `npc-sweetheart` currently draws a dashed "?" stand-in.
     ===================================================================== */
  var SWEETHEART = {
    id: 'sweetheart', name: '???', cls: 'npc-sweetheart', placeholder: true,
    x: 16, y: 3, home: { x: 16, y: 3 },
    lines: ['(they are watching the pond. you have not been introduced.)',
            '"Oh - you run the old farm up the path. I have heard about you."',
            '"Everyone in this valley is saving for something. What are you saving for?"',
            '"There is a jeweller at the store, you know. Not that I was looking."']
  };

  /* ---- the map --------------------------------------------------------
     T tree ~ water . grass # path F farmhouse C crop soil
     M mine S store R raccoon bush */
  var MAP = [
    'TTTTTTTTTTTTTTTTTTTT',
    'T.T..FF...T..~~~..TT',
    'T....FF......~~~~..T',
    'T.CCC....#...~~~...T',
    'T.CCC....#....~....T',
    'T.CCC....######..M.T',
    'T........#.........T',
    'T..T.....#.........T',
    'T........#####.S...T',
    'T..R.........#..T..T',
    'T....T.......#.....T',
    'TTTTTTTTTTTTTTTTTTTT'
  ].map(function (r) { return r.split(''); });
  var ROWS = MAP.length, COLS = MAP[0].length;
  var SOLID = { T: 1, '~': 1, F: 1, M: 1, S: 1 };

  var NPCS = [
    { id: 'fern', name: 'Granny Fern', face: '', cls: 'npc-fern', x: 12, y: 7, home: { x: 12, y: 7 },
      lines: ['Oh, hello dear! The parsnips look happy today.',
              'My knees say rain tomorrow. My knees are never wrong.',
              'You remind me of your grandpa. He also talked to raccoons.',
              'Starfruit! In MY valley. Your grandpa would have had words.',
              'Bring me a parsnip sometime, I’ll make soup.'] },
    { id: 'rob', name: 'Robbie', face: '', cls: 'npc-rob', x: 5, y: 8, home: { x: 5, y: 8 },
      lines: ['Need the farmhouse fixed? Gimme, uh... three thousand wood.',
              'That mine’s full of geodes. And spiders. Mostly spiders.',
              'Store’s down the east path. Seeds, tools, and one very shiny ring.',
              'I could build you a coop if you ever stop hoarding bottle caps.',
              'The bridge east is still busted. The raccoon "borrowed" the nails.'] },
    SWEETHEART
  ];
  var RACCOON_BUSH = { x: 3, y: 9 };

  /* ---- what grows here -------------------------------------------------
     nights = how many waterings it needs before it can be picked. */
  var CROPS = {
    parsnip:     { name: 'parsnip',     seed: 15,  sell: 45,  nights: 1 },
    cauliflower: { name: 'cauliflower', seed: 80,  sell: 190, nights: 2 },
    starfruit:   { name: 'starfruit',   seed: 400, sell: 900, nights: 3 }
  };
  var CROP_ORDER = ['parsnip', 'cauliflower', 'starfruit'];
  var RING_PRICE = 2500;
  var MAX_ENERGY = 100;
  var COST = { till: 5, plant: 2, water: 3, harvest: 3, swing: 6, cast: 4 };

  /* ---- state ----------------------------------------------------------- */
  var TILE = 34;
  var st = load();
  function load() {
    var base = {
      day: 1, gold: 100, harvested: 0, fish: 0, crops: {},
      energy: MAX_ENERGY, weather: 'clear',
      seeds: { parsnip: 0, cauliflower: 0, starfruit: 0 },
      ring: 0,                    /* 0 none · 1 bought · 2 given */
      versus: false, rivalGold: 0, rivalWon: false
    };
    var s = null;
    try {
      var raw = localStorage.getItem('sjj_stardew');
      if (raw) s = JSON.parse(raw);
    } catch (e) {}
    if (!s || typeof s !== 'object') return base;
    /* fold the save over the defaults so an old file keeps its gold and
       its parsnips and simply gains the fields it has never heard of */
    for (var k in base) if (!(k in s)) s[k] = base[k];
    if (!s.seeds) s.seeds = { parsnip: 0, cauliflower: 0, starfruit: 0 };
    CROP_ORDER.forEach(function (c) { if (typeof s.seeds[c] !== 'number') s.seeds[c] = 0; });
    /* crops used to be a bare stage number, back when parsnip was the
       only thing that grew here */
    var cs = s.crops || {};
    Object.keys(cs).forEach(function (key) {
      if (typeof cs[key] === 'number') cs[key] = { t: 'parsnip', s: cs[key], g: cs[key] === 4 ? 1 : 0 };
    });
    s.crops = cs;
    return s;
  }
  function persist() { try { localStorage.setItem('sjj_stardew', JSON.stringify(st)); } catch (e) {} }

  function cropKey(x, y) { return x + ',' + y; }
  function cropAt(x, y) { return st.crops[cropKey(x, y)] || null; }
  function stageAt(x, y) { var c = cropAt(x, y); return c ? c.s : 0; }

  var px = 7, py = 6, facing = { x: 0, y: 1 };
  var seedPick = 'parsnip';

  /* ---- build the DOM ---------------------------------------------------- */
  var grid = document.createElement('div');
  grid.className = 'farm-grid';
  grid.style.width = (COLS * TILE) + 'px';
  grid.style.height = (ROWS * TILE) + 'px';
  wrap.appendChild(grid);

  var TILE_BG = { T: 'tile-grass', '.': 'tile-grass', '#': 'tile-path', '~': 'tile-water',
                  F: 'tile-grass', C: 'tile-soil', M: 'tile-rock', S: 'tile-grass', R: 'tile-grass' };

  var cropEls = {};
  for (var y = 0; y < ROWS; y++) {
    for (var x = 0; x < COLS; x++) {
      var ch = MAP[y][x];
      var t = document.createElement('div');
      t.className = 'farm-tile ' + (TILE_BG[ch] || 'tile-grass');
      t.style.left = (x * TILE) + 'px';
      t.style.top = (y * TILE) + 'px';
      if (ch === 'T') t.classList.add('tile-tree');
      if (ch === 'M') t.classList.add('tile-mine');
      if (ch === 'S') t.classList.add('tile-store');
      if (ch === 'F') {
        var topLeft = !(y > 0 && MAP[y - 1][x] === 'F') && !(x > 0 && MAP[y][x - 1] === 'F');
        if (topLeft) t.classList.add('house-main');
      }
      if (ch === 'R') { t.classList.add('bush'); t.id = 'rac-bush'; }
      if (ch === 'C') { cropEls[cropKey(x, y)] = t; t.classList.add('crop'); }
      grid.appendChild(t);
    }
  }

  function renderCrop(x, y) {
    var el = cropEls[cropKey(x, y)];
    if (!el) return;
    var c = cropAt(x, y), s = c ? c.s : 0;
    el.classList.toggle('tilled', s >= 1);
    el.classList.toggle('wet', s === 3);
    el.classList.toggle('seeded', s === 2 || s === 3);
    el.classList.toggle('grown', s === 4);
    CROP_ORDER.forEach(function (k) { el.classList.toggle('crop-' + k, !!c && c.t === k && s >= 2); });
    /* a sprout that gets taller each night it survives */
    el.classList.remove('grow1', 'grow2', 'grow3');
    if (c && (s === 2 || s === 3)) el.classList.add('grow' + Math.min(3, (c.g || 0) + 1));
  }
  function renderAllCrops() {
    Object.keys(cropEls).forEach(function (k) { var p = k.split(','); renderCrop(+p[0], +p[1]); });
  }
  renderAllCrops();

  function makeSprite(cls) {
    var el = document.createElement('div');
    el.className = 'farm-sprite ' + cls;
    grid.appendChild(el);
    return el;
  }

  /* place() owns the whole transform, flip included. The standalone CSS
     `scale` property cannot be used for the flip: it composes before
     `transform`, which mirrors the translation and throws the sprite to
     the far side of the map every time it faces left. */
  function place(el, x, y, flip) {
    var turning = false;
    if (flip !== undefined) {
      turning = el.classList.contains('flip') !== !!flip;
      el.classList.toggle('flip', !!flip);
    }
    /* the slide between tiles is transitioned, but a turn is not: asking
       the browser to interpolate into a negative scale makes it decompose
       the matrix and swing the sprite through a rotation. Snap instead. */
    if (turning) {
      el.style.transition = 'none';
      el.style.transform = 'translate(' + (x * TILE) + 'px,' + (y * TILE) + 'px)' +
                           (flip ? ' scaleX(-1)' : '');
      void el.offsetWidth;
      el.style.transition = '';
      return;
    }
    el.style.transform = 'translate(' + (x * TILE) + 'px,' + (y * TILE) + 'px)' +
                         (el.classList.contains('flip') ? ' scaleX(-1)' : '');
  }

  var playerEl = makeSprite('player');
  NPCS.forEach(function (n) {
    n.el = makeSprite('npc ' + n.cls);
    if (n.placeholder) n.el.textContent = '?';   /* stand-in art, see the CSS note */
    place(n.el, n.x, n.y);
  });

  var rival = { name: 'Ash', x: 11, y: 6, home: { x: 11, y: 6 },
    lines: ['"Nice farm. Small, though."',
            '"I hear the store only has the one ring."',
            '"No hard feelings when I get there first."',
            '"You water those by hand? Charming."'] };
  rival.el = makeSprite('npc npc-rival');
  place(rival.el, rival.x, rival.y);

  /* Clint, the playable character (clint.png). Rows: 0 down, 1 side
     (facing right), 2 up; cols: 0 idle, 1 step. Left is the side row,
     flipped horizontally. */
  var PW = 24, PH = 48, playerWalk = 0, walkIdleT = null;
  function setPlayerFrame() {
    var row = facing.y > 0 ? 0 : (facing.y < 0 ? 2 : 1);
    playerEl.style.backgroundPosition = '-' + (playerWalk * PW) + 'px -' + (row * PH) + 'px';
  }
  place(playerEl, px, py, false);
  setPlayerFrame();

  /* ---- HUD -------------------------------------------------------------- */
  var hud = document.querySelector('#farm-hud');
  function bar(val, max, n) {
    var full = Math.round(Math.max(0, Math.min(max, val)) / max * n), out = '';
    for (var i = 0; i < n; i++) out += i < full ? '▰' : '▱';
    return out;
  }
  function renderHud() {
    var sky = st.weather === 'rain' ? 'rain' : 'clear';
    var h = '<span class="hud-line"><b>Day ' + st.day + '</b> · Spring · ' + sky +
      ' · <b>' + st.gold + 'g</b>' +
      ' · energy <span class="hud-bar' + (st.energy <= 20 ? ' low' : '') + '">' +
      bar(st.energy, MAX_ENERGY, 10) + '</span>' +
      ' · <img class="hud-ico" src="Gold_Carrot_stardew.webp" alt=""> <b>' +
      st.harvested + '</b>/9</span>';
    var ringTxt = st.ring >= 2 ? 'the ring is given ♡'
      : st.ring === 1 ? 'ring bought – go and ask'
      : 'ring ' + Math.min(st.gold, RING_PRICE) + '/' + RING_PRICE + 'g';
    h += '<span class="hud-line small">' + ringTxt;
    if (st.versus) {
      h += ' · <span class="hud-rival">' + rival.name + ' ' +
        Math.min(st.rivalGold, RING_PRICE) + '/' + RING_PRICE + 'g</span>';
    }
    h += '</span>';
    hud.innerHTML = h;
  }

  /* ---- dialogue / message box ------------------------------------------- */
  var msgBox = document.querySelector('#farm-msg');
  var msgTimer = null;
  function msg(text, who, sticky) {
    msgBox.innerHTML = '';
    if (who) {
      var name = document.createElement('b');
      name.textContent = who + ' ';
      msgBox.appendChild(name);
    }
    msgBox.appendChild(document.createTextNode(text));
    msgBox.classList.add('show');
    clearTimeout(msgTimer);
    if (!sticky) msgTimer = setTimeout(function () { msgBox.classList.remove('show'); }, 3800);
  }

  /* ---- energy ------------------------------------------------------------ */
  function spend(n) {
    if (st.energy < n) {
      msg('* you are too tired to do that. go to bed.');
      if (window.SFX) SFX.deny();
      return false;
    }
    st.energy -= n;
    if (st.energy <= 0) { st.energy = 0; passOut(); }
    return true;
  }
  function passOut() {
    var fee = Math.min(150, st.gold);
    st.gold -= fee;
    persist(); renderHud();
    setTimeout(function () {
      msg('* you pass out in the dirt. Robbie carries you home and bills you ' + fee + 'g.', null, true);
      sleepNight(true);
    }, 500);
  }

  /* ---- interactions ------------------------------------------------------ */
  function npcAt(x, y) {
    for (var i = 0; i < NPCS.length; i++) if (NPCS[i].x === x && NPCS[i].y === y) return NPCS[i];
    if (st.versus && rival.x === x && rival.y === y) return rival;
    return null;
  }

  /* ---- fishing ----------------------------------------------------------- */
  var fishing = null;
  var FISH = [
    { name: 'a carp', g: 30, w: 30 },
    { name: 'a bass', g: 45, w: 24 },
    { name: 'a catfish', g: 75, w: 14 },
    { name: 'an old boot', g: 5, w: 16 },
    { name: 'a rusty can (he will want this)', g: 3, w: 10 },
    { name: 'the LEGENDARY RACCOONFISH', g: 150, w: 6 }
  ];
  function pickFish() {
    var total = FISH.reduce(function (a, f) { return a + f.w; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < FISH.length; i++) { r -= FISH[i].w; if (r <= 0) return FISH[i]; }
    return FISH[0];
  }
  function cancelFish(text) {
    if (!fishing) return;
    clearTimeout(fishing.t); clearTimeout(fishing.iv);
    fishing = null;
    if (text) msg(text);
  }
  function castLine() {
    if (fishing) return;
    if (!spend(COST.cast)) return;
    persist(); renderHud();
    fishing = { phase: 'wait' };
    msg('* you cast a line into the pond… (wait for the ! - then E, fast)', null, true);
    if (window.SFX) SFX.click();
    fishing.t = setTimeout(function () {
      if (!fishing) return;
      fishing.phase = 'bite';
      msg('* SOMETHING BITES! (E!)', null, true);
      if (window.SFX) SFX.ding();
      fishing.t = setTimeout(function () {
        cancelFish('* …it got away. the water judges you silently.');
        if (window.SFX) SFX.deny();
      }, 900);
    }, 1600 + Math.random() * 2600);
  }
  function hookFish() {
    clearTimeout(fishing.t);
    fishing.phase = 'reel';
    fishing.prog = 30; fishing.calm = true; fishing.flips = 0;
    fishing.fish = pickFish();
    var flip = function () {
      if (!fishing) return;
      fishing.calm = Math.random() < 0.55;
      fishing.flips++;
      if (fishing.flips > 14) { cancelFish('* the line snaps. it was probably enormous.'); if (window.SFX) SFX.deny(); return; }
      renderReel();
      fishing.iv = setTimeout(flip, 650 + Math.random() * 500);
    };
    var renderReel = function () {
      msg((fishing.calm ? 'it\'s CALM - reel it in! (E)' : 'it THRASHES - hold still!') +
        ' ' + bar(fishing.prog, 100, 10), null, true);
    };
    fishing.renderReel = renderReel;
    flip();
    if (window.SFX) SFX.blip();
  }
  function reelTap() {
    if (fishing.calm) { fishing.prog += 18; if (window.SFX) SFX.click(); }
    else { fishing.prog -= 22; if (window.SFX) SFX.deny(); }
    if (fishing.prog >= 100) return landFish();
    if (fishing.prog <= 0) { cancelFish('* it spits the hook and leaves. rude.'); return; }
    fishing.renderReel();
  }
  function landFish() {
    var f = fishing.fish;
    cancelFish();
    st.gold += f.g;
    st.fish = (st.fish || 0) + 1;
    persist(); renderHud();
    msg('* you caught ' + f.name + '! +' + f.g + 'g');
    if (window.SFX) SFX.coin();
  }

  function interact() {
    if (fishing) {
      if (fishing.phase === 'bite') return hookFish();
      if (fishing.phase === 'reel') return reelTap();
      return cancelFish('* you reel in early. nothing but weeds.');
    }
    var tx = px + facing.x, ty = py + facing.y;
    if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return;
    var n = npcAt(tx, ty);
    if (n) {
      if (n === SWEETHEART && st.ring === 1) return propose();
      n.lineIdx = ((n.lineIdx || 0) + 1) % n.lines.length;
      msg(n.lines[n.lineIdx], n.name);
      if (window.SFX) SFX.blip();
      return;
    }
    var ch = MAP[ty][tx];
    if (ch === 'C') return workCrop(tx, ty);
    if (ch === 'F') return houseMenu();
    if (ch === 'M') return mineOpen();
    if (ch === 'S') return shopOpen();
    if (ch === 'R') {
      var bush = document.querySelector('#rac-bush');
      bush.classList.remove('rustle'); void bush.offsetWidth; bush.classList.add('rustle');
      msg('the raccoon skitters out, drops a bottle cap SHAPED leaf, and vanishes. typical.');
      if (window.SFX) SFX.step();
      return;
    }
    if (ch === '~') return castLine();
    if (ch === 'T') { msg('* a sturdy tree. Robbie would want you to chop it. you pat it instead.'); return; }
    msg('* nothing here but honest dirt.');
  }

  function workCrop(x, y) {
    var key = cropKey(x, y), c = st.crops[key], s = c ? c.s : 0;
    if (s === 0) {
      if (!spend(COST.till)) return;
      st.crops[key] = { t: seedPick, s: 1, g: 0 };
      msg('* you till the soil.');
      if (window.SFX) SFX.step();
    } else if (s === 1) {
      if (!st.seeds[seedPick]) {
        msg('* no ' + CROPS[seedPick].name + ' seeds. the store is down the east path.');
        if (window.SFX) SFX.deny();
        return;
      }
      if (!spend(COST.plant)) return;
      st.seeds[seedPick]--;
      c.t = seedPick; c.s = 2; c.g = 0;
      msg('* you plant ' + CROPS[seedPick].name + ' seeds.');
      if (window.SFX) SFX.blip();
    } else if (s === 2) {
      if (!spend(COST.water)) return;
      c.s = 3;
      msg('* you water them. (' + (CROPS[c.t].nights - (c.g || 0)) + ' more night' +
          (CROPS[c.t].nights - (c.g || 0) === 1 ? '' : 's') + ' to go)');
      if (window.SFX) SFX.click();
    } else if (s === 3) {
      msg('* already watered. it needs a night’s sleep, same as you.');
      return;
    } else if (s === 4) {
      if (!spend(COST.harvest)) return;
      var crop = CROPS[c.t];
      st.gold += crop.sell;
      if (c.t === 'parsnip') st.harvested++;
      c.s = 1; c.g = 0;
      msg('* you harvest a ' + crop.name + '! +' + crop.sell + 'g');
      if (window.SFX) SFX.coin();
      if (c.t === 'parsnip' && st.harvested === 9 && window.SJJQuest) {
        setTimeout(function () {
          msg('"Nine parsnips! Grandpa would be proud." …the raccoon leaves something on the fence.', null, true);
          SJJQuest.award('stardew');
        }, 700);
      }
    }
    persist(); renderCrop(x, y); renderHud();
  }

  /* ---- the store --------------------------------------------------------- */
  var shopOv = document.querySelector('#farm-shop');
  var shopRows = document.querySelector('#shop-rows');
  function shopOpen() {
    renderShop();
    shopOv.hidden = false;
    if (window.SFX) SFX.click();
  }
  function buySeed(kind) {
    var c = CROPS[kind];
    if (st.gold < c.seed) { if (window.SFX) SFX.deny(); return; }
    st.gold -= c.seed; st.seeds[kind]++;
    persist(); renderHud(); renderShop();
    if (window.SFX) SFX.coin();
  }
  function buyRing() {
    if (st.ring || st.gold < RING_PRICE) { if (window.SFX) SFX.deny(); return; }
    st.gold -= RING_PRICE; st.ring = 1;
    persist(); renderHud(); renderShop();
    if (window.SFX) SFX.cap();
    msg('* the jeweller wraps it in cloth. "Good luck," she says, far too loudly.', null, true);
  }
  function renderShop() {
    shopRows.innerHTML = '';
    CROP_ORDER.forEach(function (k) {
      var c = CROPS[k];
      var row = document.createElement('div');
      row.className = 'shop-row';
      var lab = document.createElement('span');
      lab.innerHTML = '<b>' + c.name + '</b> seeds · ' + c.nights + ' night' +
        (c.nights > 1 ? 's' : '') + ' · sells ' + c.sell + 'g <i>(you have ' + st.seeds[k] + ')</i>';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'buy ' + c.seed + 'g';
      btn.disabled = st.gold < c.seed;
      btn.addEventListener('click', function () { buySeed(k); });
      row.appendChild(lab); row.appendChild(btn);
      shopRows.appendChild(row);
    });
    var ring = document.createElement('div');
    ring.className = 'shop-row ring-row';
    var rl = document.createElement('span');
    rl.innerHTML = st.ring
      ? '<b>the ring</b> · sold. to you.'
      : '<b>the ring</b> · the only one in the valley';
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.textContent = st.ring ? 'yours' : 'buy ' + RING_PRICE + 'g';
    rb.disabled = !!st.ring || st.gold < RING_PRICE;
    rb.addEventListener('click', buyRing);
    ring.appendChild(rl); ring.appendChild(rb);
    shopRows.appendChild(ring);
  }
  document.querySelector('#farm-shop-close').addEventListener('click', function () {
    shopOv.hidden = true;
  });

  /* ---- the proposal ------------------------------------------------------ */
  var endOv = document.querySelector('#farm-ending');
  function endCard(title, body) {
    document.querySelector('#ending-title').textContent = title;
    document.querySelector('#ending-body').textContent = body;
    endOv.hidden = false;
  }
  function propose() {
    st.ring = 2;
    persist(); renderHud();
    if (window.SFX) SFX.chime();
    endCard('♡',
      'You hold out the ring. ' + SWEETHEART.name + ' looks at it, then at you, then at ' +
      'the farm up the path — the tilled rows, the watered soil, the ridiculous ' +
      'number of parsnips — and says yes.' +
      (st.versus ? ' Somewhere behind you, Ash puts down a wallet.' : ''));
  }
  document.querySelector('#farm-ending-close').addEventListener('click', function () {
    endOv.hidden = true;
  });

  /* ---- farmhouse: sleep --------------------------------------------------- */
  var houseOv = document.querySelector('#farm-house');
  function houseMenu() {
    houseOv.hidden = false;
    if (window.SFX) SFX.click();
  }
  function sleepNight(fainted) {
    houseOv.hidden = true;
    var night = document.querySelector('#farm-night');
    night.hidden = false;
    if (window.SFX) SFX.save();
    setTimeout(function () {
      var rain = Math.random() < 0.25;
      var grew = 0, watered = 0;
      Object.keys(st.crops).forEach(function (k) {
        var c = st.crops[k];
        if (rain && c.s === 2) { c.s = 3; watered++; }
        if (c.s === 3) {
          c.g = (c.g || 0) + 1;
          c.s = c.g >= CROPS[c.t].nights ? 4 : 2;
          if (c.s === 4) grew++;
        }
      });
      st.day++;
      st.weather = rain ? 'rain' : 'clear';
      st.energy = fainted ? Math.round(MAX_ENERGY * 0.6) : MAX_ENERGY;

      /* the rival puts in a day too */
      var beat = false;
      if (st.versus && !st.rivalWon && st.ring < 2) {
        st.rivalGold += 170 + ((Math.random() * 110) | 0);
        if (st.rivalGold >= RING_PRICE && st.ring < 1) { st.rivalWon = true; beat = true; }
      }

      persist();
      renderAllCrops(); renderHud();
      night.hidden = true;

      if (beat) {
        if (window.SFX) SFX.deny();
        endCard('you were outbid',
          'Ash got to the store first. There was only ever the one ring, and it is ' +
          'in someone else’s pocket now. Turn the rival off, or start the race again.');
        return;
      }
      var line = 'Day ' + st.day + '. ';
      if (rain) line += 'rain overnight' + (watered ? ' - it watered ' + watered + ' for you' : '') + '. ';
      if (grew) line += grew + ' crop' + (grew > 1 ? 's' : '') + ' ready to pick!';
      else if (!rain) line += 'the radio says it’ll be clear today.';
      msg(line);
    }, 1400);
  }
  document.querySelector('#farm-sleep').addEventListener('click', function () { sleepNight(false); });
  document.querySelector('#farm-house-close').addEventListener('click', function () {
    houseOv.hidden = true;
  });

  /* ---- the mine ----------------------------------------------------------- */
  var mineOv = document.querySelector('#farm-mine');
  var rockBtn = document.querySelector('#farm-rock');
  var rockHp = 0;
  function mineOpen() {
    mineOv.hidden = false;
    rockHp = 6 + ((Math.random() * 4) | 0);
    rockBtn.disabled = false;
    document.querySelector('#farm-mine-note').textContent =
      'whack the rock. (' + rockHp + ' swings, ' + COST.swing + ' energy each)';
    if (window.SFX) SFX.click();
  }
  rockBtn.addEventListener('click', function () {
    if (rockBtn.disabled) return;
    if (!spend(COST.swing)) { renderHud(); return; }
    rockHp--;
    rockBtn.classList.remove('crack'); void rockBtn.offsetWidth; rockBtn.classList.add('crack');
    if (window.SFX) SFX.slash();
    if (rockHp <= 0) {
      rockBtn.disabled = true;
      var g = 20 + ((Math.random() * 40) | 0);
      st.gold += g;
      document.querySelector('#farm-mine-note').textContent = 'a geode! +' + g + 'g. Robbie whistles, impressed.';
      if (window.SFX) SFX.coin();
    } else {
      document.querySelector('#farm-mine-note').textContent = rockHp + ' more...';
    }
    persist(); renderHud();
  });
  document.querySelector('#farm-mine-close').addEventListener('click', function () {
    mineOv.hidden = true;
  });

  /* ---- seed picker + rival toggle ----------------------------------------- */
  var seedBtns = document.querySelectorAll('.farm-seedsel button');
  function setSeed(kind) {
    seedPick = kind;
    seedBtns.forEach(function (b) {
      var on = b.dataset.seed === kind;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    msg('* planting ' + CROPS[kind].name + ' (' + CROPS[kind].seed + 'g a seed, you have ' +
        st.seeds[kind] + ')');
  }
  seedBtns.forEach(function (b) {
    b.addEventListener('click', function () { setSeed(b.dataset.seed); });
  });

  var vsBtn = document.querySelector('#farm-versus');
  function renderVs() {
    vsBtn.textContent = st.versus ? 'rival: ON' : 'rival: off';
    vsBtn.classList.toggle('on', st.versus);
    vsBtn.setAttribute('aria-pressed', String(st.versus));
    rival.el.hidden = !st.versus;
  }
  vsBtn.addEventListener('click', function () {
    st.versus = !st.versus;
    if (st.versus) {
      st.rivalGold = 0; st.rivalWon = false;
      msg('* a farmer called Ash moves in down the road. they are saving for a ring too.', null, true);
      if (window.SFX) SFX.buzz();
    } else {
      msg('* Ash gives up and goes back to whatever Ash did before.');
    }
    persist(); renderVs(); renderHud();
  });

  /* ---- movement ------------------------------------------------------------ */
  var lastMove = 0;
  function tryMove(dx, dy) {
    var now = performance.now();
    if (now - lastMove < 130) return;
    lastMove = now;
    if (fishing) cancelFish('* you wandered off. the line goes slack.');
    facing = { x: dx, y: dy };
    var flip = dx < 0;
    setPlayerFrame();
    var nx = px + dx, ny = py + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) { place(playerEl, px, py, flip); return; }
    if (SOLID[MAP[ny][nx]] || npcAt(nx, ny)) {
      place(playerEl, px, py, flip);
      playerEl.classList.remove('step'); void playerEl.offsetWidth; playerEl.classList.add('step');
      return;
    }
    px = nx; py = ny;
    place(playerEl, px, py, flip);
    playerWalk ^= 1; setPlayerFrame();
    clearTimeout(walkIdleT);
    walkIdleT = setTimeout(function () { playerWalk = 0; setPlayerFrame(); }, 200);
    if (window.SFX) SFX.step();
    if (px === RACCOON_BUSH.x && py === RACCOON_BUSH.y) {
      var bush = document.querySelector('#rac-bush');
      bush.classList.remove('rustle'); void bush.offsetWidth; bush.classList.add('rustle');
    }
  }

  var overlaysOpen = function () {
    return !houseOv.hidden || !mineOv.hidden || !shopOv.hidden || !endOv.hidden;
  };
  function onScreen() {
    var r = wrap.getBoundingClientRect();
    return !(r.bottom < 0 || r.top > innerHeight);
  }
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (overlaysOpen()) {
      if (k === 'escape' || k === 'e' || k === ' ') {
        houseOv.hidden = true; mineOv.hidden = true; shopOv.hidden = true; endOv.hidden = true;
        e.preventDefault();
      }
      return;
    }
    var map = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1],
                a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
    if (map[k]) {
      if (!onScreen()) return;
      e.preventDefault();
      tryMove(map[k][0], map[k][1]);
    } else if (k === 'e' || k === ' ' || k === 'enter') {
      if (!onScreen()) return;
      e.preventDefault();
      interact();
    } else if (k === '1' || k === '2' || k === '3') {
      if (!onScreen()) return;
      setSeed(CROP_ORDER[+k - 1]);
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

  /* ---- everybody mills about ---------------------------------------------- */
  function wander(who) {
    var opts = [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(function (d) {
      var nx = who.x + d[0], ny = who.y + d[1];
      return Math.abs(nx - who.home.x) <= 1 && Math.abs(ny - who.home.y) <= 1 &&
             nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
             !SOLID[MAP[ny][nx]] && MAP[ny][nx] !== 'C' &&
             !(nx === px && ny === py) && !npcAt(nx, ny);
    });
    if (!opts.length) return;
    var d = opts[(Math.random() * opts.length) | 0];
    who.x += d[0]; who.y += d[1];
    place(who.el, who.x, who.y, d[0] < 0);
  }
  setInterval(function () {
    NPCS.forEach(function (n) { if (Math.random() < 0.5) wander(n); });
    if (st.versus && Math.random() < 0.6) wander(rival);
  }, 2400);

  /* ---- go ------------------------------------------------------------------ */
  setSeed('parsnip');
  renderVs();
  renderHud();
  msg('* WASD / arrows to walk · E or SPACE to use what’s in front of you · 1/2/3 picks a seed. ' +
      'grandpa’s note says: "nine parsnips." the rest is up to you.', null, true);
})();
