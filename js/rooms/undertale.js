/* =====================================================================
   undertale.js - * A WILD RACCOON BLOCKS THE WAY!
   A full little encounter: FIGHT / ACT / ITEM / MERCY, typewriter text,
   and bullet-hell phases where you steer the red SOUL inside the box.
   Raise the mercy meter with ACTs and spare him for the pacifist end.
   Also owns the save point (moved out of site.js).
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- save point (unchanged behaviour) ----------------- */
  var save = document.querySelector('#savepoint');
  if (save) {
    var out = document.querySelector('#save-msg');
    var lastSaved = function () {
      var t = null;
      try { t = localStorage.getItem('sjj_save'); } catch (e) {}
      if (out) out.textContent = t
        ? '* File saved. (last: ' + t + ')'
        : '* (The shadow of the trash can looms ahead, filling you with determination.)';
    };
    save.addEventListener('click', function () {
      var stamp = new Date().toLocaleString();
      try { localStorage.setItem('sjj_save', stamp); } catch (e) {}
      if (out) out.textContent = '* You felt your determination harden. (saved ' + stamp + ')';
      if (window.SFX) SFX.save();
    });
    lastSaved();
  }

  /* ---------------- the encounter ----------------------------------- */
  var stage = document.querySelector('#ut-battle');
  if (!stage) return;

  var enemyEl = stage.querySelector('#ut-enemy');
  var nameEl  = stage.querySelector('.ut-enemy-name');
  var box     = stage.querySelector('#ut-box');
  var textEl  = stage.querySelector('#ut-text');
  var soul    = stage.querySelector('#ut-soul');
  var barWrap = stage.querySelector('#ut-fightbar');
  var sweep   = stage.querySelector('.ut-sweep');
  var hpFill  = stage.querySelector('#ut-hpfill');
  var hpText  = stage.querySelector('#ut-hp');
  var menu    = stage.querySelector('#ut-menu');
  var sub     = stage.querySelector('#ut-submenu');

  if (window.RaccoonSVG) enemyEl.innerHTML = window.RaccoonSVG;

  var HP_MAX = 20, ENEMY_MAX = 30;
  var st; /* battle state */

  function freshState() {
    return { hp: HP_MAX, enemyHp: ENEMY_MAX, mercy: 0, turn: 0,
             pieUsed: false, acted: {}, over: false, phase: 'menu' };
  }

  function setHp(v) {
    st.hp = Math.max(0, Math.min(HP_MAX, v));
    hpFill.style.width = (st.hp / HP_MAX * 100) + '%';
    hpText.textContent = st.hp + ' / ' + HP_MAX;
  }

  function spareable() { return st.mercy >= 100; }
  function updateName() {
    nameEl.textContent = '✱ RACCOON  LV ?';
    nameEl.classList.toggle('spareable', spareable());
    if (spareable()) nameEl.textContent += '  ♥';
  }

  /* ---- typewriter --------------------------------------------------- */
  var typeTimer = null;
  function type(lines, cb) {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    var full = Array.isArray(lines) ? lines.join('\n') : lines;
    var i = 0;
    textEl.hidden = false;
    textEl.textContent = '';
    typeTimer = setInterval(function () {
      i++;
      textEl.textContent = full.slice(0, i);
      if (i % 3 === 0 && window.SFX) SFX.blip();
      if (i >= full.length) {
        clearInterval(typeTimer); typeTimer = null;
        if (cb) setTimeout(cb, 750);
      }
    }, 28);
  }

  /* ---- menus --------------------------------------------------------- */
  function setMenu(enabled) {
    menu.querySelectorAll('button').forEach(function (b) { b.disabled = !enabled; });
    menu.classList.toggle('off', !enabled);
  }
  function closeSub() { sub.hidden = true; sub.textContent = ''; }
  function openSub(items) {
    sub.textContent = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '✦ ' + it.label;
      b.addEventListener('click', function () { closeSub(); it.fn(); });
      sub.appendChild(b);
    });
    var back = document.createElement('button');
    back.type = 'button';
    back.textContent = '↩ back';
    back.addEventListener('click', function () { closeSub(); setMenu(true); });
    sub.appendChild(back);
    sub.hidden = false;
  }

  /* ---- FIGHT: timing bar --------------------------------------------- */
  function doFight() {
    setMenu(false);
    textEl.hidden = true;
    barWrap.hidden = false;
    var t0 = performance.now(), DUR = 1300, done = false;
    function anim(now) {
      if (done) return;
      var p = ((now - t0) % (DUR * 2));
      var x = p < DUR ? p / DUR : 2 - p / DUR; /* ping-pong 0..1 */
      sweep.style.left = (x * 100) + '%';
      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
    function strike() {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey);
      barWrap.removeEventListener('pointerdown', strike);
      barWrap.hidden = true;
      var x = parseFloat(sweep.style.left) / 100;
      var acc = 1 - Math.min(1, Math.abs(x - 0.5) * 2);   /* 1 = perfect  */
      var dmg = Math.round(3 + acc * 9);
      st.enemyHp -= dmg;
      st.mercy = Math.max(0, st.mercy - 25);
      updateName();
      enemyEl.classList.add('hit');
      setTimeout(function () { enemyEl.classList.remove('hit'); }, 400);
      if (window.SFX) SFX.slash();
      if (st.enemyHp <= 0) return fightWin();
      type('* You hit the raccoon for ' + dmg + ' damage.\n* He looks at you. Not angry. Just... disappointed.',
        enemyTurn);
    }
    function onKey(ev) {
      if (ev.key === 'z' || ev.key === 'Z' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); strike(); }
    }
    window.addEventListener('keydown', onKey);
    barWrap.addEventListener('pointerdown', strike);
  }

  /* ---- ACT ----------------------------------------------------------- */
  var ACTS = {
    check: { label: 'Check', gain: 10, line: '* RACCOON - ATK 4 DEF 9\n* Smells like pizza. Loves shiny things.\n* Seems to want something from you.' },
    pet: { label: 'Pet', gain: 30, line: '* You pet the raccoon.\n* His tail goes THUMP THUMP THUMP.' },
    compliment: { label: 'Compliment', gain: 30, line: '* You tell the raccoon his mask is very fashionable.\n* He washes his hands, flattered.' },
    trash: { label: 'Offer trash', gain: 30, line: '* You offer the raccoon a pristine piece of garbage.\n* HIS EYES. THEY SPARKLE.' }
  };
  function doAct() {
    setMenu(false);
    openSub(Object.keys(ACTS).map(function (k) {
      var a = ACTS[k];
      return { label: a.label + (st.acted[k] && k !== 'check' ? ' ✓' : ''), fn: function () {
        var gain = st.acted[k] ? Math.floor(a.gain / 3) : a.gain;
        st.acted[k] = true;
        st.mercy = Math.min(100, st.mercy + gain);
        updateName();
        type(a.line + (spareable() ? '\n* (The raccoon looks ready to be SPARED.)' : ''), enemyTurn);
      } };
    }));
  }

  /* ---- ITEM ---------------------------------------------------------- */
  function doItem() {
    setMenu(false);
    var items = [];
    if (!st.pieUsed) items.push({ label: 'Butterscotch Pie', fn: function () {
      st.pieUsed = true;
      setHp(HP_MAX);
      if (window.SFX) SFX.coin();
      type('* You ate the Butterscotch Pie.\n* Your HP was maxed out.\n* The raccoon eyes your crumbs.', enemyTurn);
    } });
    items.push({ label: 'Bottle Cap', fn: function () {
      st.mercy = Math.min(100, st.mercy + 10);
      updateName();
      type('* You show the raccoon your bottle cap.\n* He nods slowly. A collector recognizes a collector.', enemyTurn);
    } });
    openSub(items);
  }

  /* ---- MERCY --------------------------------------------------------- */
  function doMercy() {
    setMenu(false);
    openSub([
      { label: 'Spare', fn: function () {
        if (spareable()) return spareWin();
        type('* You tried to spare the raccoon.\n* He tilts his head. Not yet. (try ACTing first.)', enemyTurn);
      } },
      { label: 'Flee', fn: function () {
        type('* You tried to flee.\n* The raccoon is between you and the door.\n* He is ALWAYS between you and the door.', enemyTurn);
      } }
    ]);
  }

  /* ---- bullet phase --------------------------------------------------- */
  var keys = {};
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].indexOf(k) >= 0) {
      keys[k] = true;
      if (st && st.phase === 'bullets') e.preventDefault();
    }
  });
  document.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

  box.addEventListener('pointerdown', dragSoul);
  box.addEventListener('pointermove', dragSoul);
  function dragSoul(e) {
    if (!st || st.phase !== 'bullets') return;
    if (e.type === 'pointermove' && e.buttons === 0) return;
    var r = box.getBoundingClientRect();
    soulX = Math.max(8, Math.min(r.width - 8, e.clientX - r.left));
    soulY = Math.max(8, Math.min(r.height - 8, e.clientY - r.top));
    e.preventDefault();
  }

  var soulX = 0, soulY = 0;
  var ENEMY_LINES = [
    '* The raccoon rummages through his fur and produces... assorted debris.',
    '* The raccoon does a little spin. Garbage orbits him like moons.',
    '* The raccoon chitters a warning. It sounds almost polite.',
    '* The raccoon remembers something upsetting about a locked dumpster.',
    '* Smells like pizza.'
  ];

  function enemyTurn() {
    if (st.over) return;
    st.turn++;
    type(ENEMY_LINES[(st.turn - 1) % ENEMY_LINES.length], function () { bulletPhase(); });
  }

  function bulletPhase() {
    st.phase = 'bullets';
    textEl.hidden = true;
    var r = box.getBoundingClientRect();
    soulX = r.width / 2; soulY = r.height * 0.7;
    soul.hidden = false;
    var bullets = [];
    var pattern = (st.turn - 1) % 3;
    var duration = Math.min(8000, 5200 + st.turn * 400);
    var spawnEvery = Math.max(160, (pattern === 1 ? 520 : 300) * Math.pow(0.93, st.turn));
    var start = performance.now(), lastSpawn = 0, iframesUntil = 0, alive = true;

    function spawn(now) {
      var w = box.clientWidth, h = box.clientHeight;
      var b = document.createElement('span');
      b.className = 'ut-bullet';
      var o = { el: b, x: 0, y: 0, vx: 0, vy: 0, wob: Math.random() * 6.28 };
      if (pattern === 0) {            /* falling bottle caps */
        b.textContent = '◍';
        o.x = 10 + Math.random() * (w - 20); o.y = -10;
        o.vy = 1.9 + Math.random() * 1.4 + st.turn * 0.12;
      } else if (pattern === 1) {     /* sweeping trash lids */
        b.textContent = '⬬';
        var fromLeft = Math.random() < 0.5;
        o.x = fromLeft ? -12 : w + 12;
        o.y = 14 + Math.random() * (h - 28);
        o.vx = (fromLeft ? 1 : -1) * (2.2 + Math.random() * 1.2 + st.turn * 0.1);
      } else {                        /* rising wobbly bones */
        b.textContent = '𓄼';
        o.x = 10 + Math.random() * (w - 20); o.y = h + 10;
        o.vy = -(1.7 + Math.random() * 1.2 + st.turn * 0.1);
      }
      b.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
      box.appendChild(b);
      bullets.push(o);
    }

    function frame(now) {
      if (!alive) return;
      var w = box.clientWidth, h = box.clientHeight;
      /* move soul */
      var sp = 3.1;
      if (keys.arrowup || keys.w) soulY -= sp;
      if (keys.arrowdown || keys.s) soulY += sp;
      if (keys.arrowleft || keys.a) soulX -= sp;
      if (keys.arrowright || keys.d) soulX += sp;
      soulX = Math.max(8, Math.min(w - 8, soulX));
      soulY = Math.max(8, Math.min(h - 8, soulY));
      soul.style.transform = 'translate(' + (soulX - 8) + 'px,' + (soulY - 10) + 'px)';

      if (now - lastSpawn > spawnEvery && now - start < duration - 600) { lastSpawn = now; spawn(now); }

      for (var i = bullets.length - 1; i >= 0; i--) {
        var o = bullets[i];
        o.x += o.vx; o.y += o.vy;
        if (pattern === 2) o.x += Math.sin(now / 220 + o.wob) * 1.4;
        o.el.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
        if (o.x < -24 || o.x > w + 24 || o.y < -24 || o.y > h + 24) {
          o.el.remove(); bullets.splice(i, 1); continue;
        }
        var dx = o.x - soulX, dy = o.y - soulY;
        if (dx * dx + dy * dy < 13 * 13 && now > iframesUntil) {
          iframesUntil = now + 850;
          setHp(st.hp - 3);
          soul.classList.add('ouch');
          setTimeout(function () { soul.classList.remove('ouch'); }, 850);
          if (window.SFX) SFX.hurt();
          if (st.hp <= 0) { alive = false; return gameOver(); }
        }
      }

      if (now - start >= duration && bullets.length === 0) {
        alive = false;
        return endBulletPhase();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function endBulletPhase() {
      soul.hidden = true;
      bullets.forEach(function (o) { o.el.remove(); });
      st.phase = 'menu';
      type('* What will you do?');
      setMenu(true);
    }
  }

  /* ---- endings -------------------------------------------------------- */
  function spareWin() {
    st.over = true;
    enemyEl.classList.add('spared');
    type('* You spared the raccoon.\n* YOU WON! You earned 0 XP and 0 gold.\n* The raccoon leaves... a bottle cap.', function () {
      if (window.SJJQuest) SJJQuest.award('undertale');
      setMenu(false);
      showRetry('* The room is quiet now. (fight again?)');
    });
  }
  function fightWin() {
    st.over = true;
    barWrap.hidden = true;
    enemyEl.classList.add('dusted');
    type('* ...\n* YOU WON! You earned 12 EXP and 40 gold.\n* It does not feel like winning.\n* (He drops a bottle cap anyway. You monster.)', function () {
      if (window.SJJQuest) SJJQuest.award('undertale');
      setMenu(false);
      showRetry('* you feel like a bad person. (try the pacifist route?)');
    });
  }
  function gameOver() {
    st.over = true;
    soul.hidden = true;
    box.querySelectorAll('.ut-bullet').forEach(function (b) { b.remove(); });
    stage.classList.add('gameover');
    type('* You cannot give up just yet...\n* Swifty! Stay determined!', function () {
      setMenu(false);
      showRetry('* (retry from your SAVE?)');
    });
  }
  function showRetry(msg) {
    sub.textContent = '';
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = '★ ' + (st.hp <= 0 ? 'CONTINUE' : 'RESET the encounter');
    b.addEventListener('click', resetBattle);
    var m = document.createElement('span');
    m.className = 'ut-retry-note';
    m.textContent = msg;
    sub.appendChild(m); sub.appendChild(b);
    sub.hidden = false;
  }

  function resetBattle() {
    closeSub();
    stage.classList.remove('gameover');
    enemyEl.classList.remove('dusted', 'spared');
    st = freshState();
    setHp(HP_MAX);
    updateName();
    setMenu(true);
    type('* A wild raccoon blocks the way!\n* (He looks like he forgives you.)');
  }

  /* ---- wire the main menu --------------------------------------------- */
  menu.addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b || b.disabled || st.over) return;
    if (window.SFX) SFX.click();
    ({ fight: doFight, act: doAct, item: doItem, mercy: doMercy })[b.dataset.cmd]();
  });

  st = freshState();
  setHp(HP_MAX);
  updateName();
  setMenu(true);
  type('* A wild raccoon blocks the way!');
})();
