/* =====================================================================
   fnaf.js - ONE NIGHT AT SWIFTY'S.
   Survive 12AM→6AM in the office. One animatronic (Swift-Trap, a
   raccoon in a bear suit) walks Stage → Dining → a hall → your door.
   Doors and lights cost power. Cameras slow him down. Power hits zero
   and the dark gets... friendly. Win a night, earn the cap; later
   nights get faster.
   ===================================================================== */
(function () {
  'use strict';

  var game = document.querySelector('#fnaf-game');
  if (!game) return;

  var $ = function (sel) { return game.querySelector(sel); };
  var scrMenu = $('#fg-menu'), scrOffice = $('#fg-office'), scrCams = $('#fg-camview'),
      scrScare = $('#fg-jumpscare'), scrEnd = $('#fg-end');
  var timeEl = $('#fg-time'), nightEl = $('#fg-night'), powerEl = $('#fg-power'), usageEl = $('#fg-usage');
  var camLabel = $('#fg-cam-label'), camBody = $('#fg-cam-body');
  var endTitle = $('#fg-end-title'), endBody = $('#fg-end-body');

  if (window.RaccoonSVG) {
    scrScare.innerHTML = window.RaccoonSVG;
    scrScare.setAttribute('aria-label', 'jumpscare');
  }

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- the map ------------------------------------------------------ */
  var ROOMS = {
    stage:  { cam: '1A', name: 'THE STAGE',      next: ['dining'] },
    dining: { cam: '1B', name: 'DINING AREA',    next: ['hallL', 'hallR', 'stage'] },
    hallL:  { cam: '2A', name: 'WEST HALL',      next: ['doorL', 'dining'] },
    hallR:  { cam: '2B', name: 'EAST HALL',      next: ['doorR', 'dining'] },
    doorL:  { cam: null, name: 'AT YOUR LEFT DOOR',  next: [] },
    doorR:  { cam: null, name: 'AT YOUR RIGHT DOOR', next: [] }
  };
  var CAM_ORDER = ['stage', 'dining', 'hallL', 'hallR'];

  var NIGHT_LEN = 55000;         /* ms: 12AM → 6AM                      */
  var HOURS = ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM'];

  var st = null, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
  function stopTimers() { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = []; }

  function nightSaved() {
    var n = 1;
    try { n = parseInt(localStorage.getItem('sjj_fnaf_night') || '1', 10) || 1; } catch (e) {}
    return Math.max(1, n);
  }

  function show(el) {
    [scrMenu, scrOffice, scrCams, scrEnd].forEach(function (s) { s.hidden = (s !== el); });
    scrScare.hidden = true;
  }

  /* ---- state -------------------------------------------------------- */
  function newState(night) {
    return {
      night: night, t0: performance.now(), hour: 0,
      power: 100, doorL: false, doorR: false, lightL: false, lightR: false,
      camsUp: false, cam: 'stage', pos: 'stage', over: false, doorTicks: 0
    };
  }

  function aggression() { /* chance to move on each AI tick */
    return Math.min(0.85, 0.18 + st.night * 0.08 + st.hour * 0.05);
  }

  /* ---- rendering ----------------------------------------------------- */
  function usage() {
    return 1 + (st.doorL ? 1 : 0) + (st.doorR ? 1 : 0) + (st.lightL ? 1 : 0) + (st.lightR ? 1 : 0) + (st.camsUp ? 1 : 0);
  }
  function renderHud() {
    timeEl.textContent = HOURS[st.hour];
    nightEl.textContent = 'NIGHT ' + st.night;
    powerEl.textContent = 'POWER: ' + Math.max(0, Math.ceil(st.power)) + '%';
    powerEl.classList.toggle('low', st.power < 25);
    var bars = ''; for (var i = 0; i < usage(); i++) bars += '▮';
    usageEl.textContent = 'USAGE: ' + bars;
  }
  function renderOffice() {
    game.classList.toggle('doorL-closed', st.doorL);
    game.classList.toggle('doorR-closed', st.doorR);
    game.classList.toggle('lightL-on', st.lightL);
    game.classList.toggle('lightR-on', st.lightR);
    game.classList.toggle('eyes-L', st.lightL && st.pos === 'doorL' && !st.doorL);
    game.classList.toggle('eyes-R', st.lightR && st.pos === 'doorR' && !st.doorR);
  }
  function renderCam() {
    var room = ROOMS[st.cam];
    camLabel.textContent = 'CAM ' + room.cam + ' - ' + room.name;
    camBody.textContent = '';
    if (st.pos === st.cam) {
      var s = document.createElement('div');
      s.className = 'fg-silhouette';
      s.innerHTML = window.RaccoonSVG || '🦝';
      camBody.appendChild(s);
    } else {
      var e = document.createElement('p');
      e.className = 'fg-empty';
      e.textContent = (st.pos === 'doorL' || st.pos === 'doorR')
        ? '— empty. (where is he?) —' : '— empty —';
      camBody.appendChild(e);
    }
    scrCams.querySelectorAll('.fg-cam-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.room === st.cam);
    });
  }

  /* ---- the animatronic ----------------------------------------------- */
  function aiTick() {
    if (st.over) return;
    var chance = aggression() * (st.camsUp ? 0.55 : 1);   /* cams slow him */

    if (st.pos === 'doorL' || st.pos === 'doorR') {
      var closed = st.pos === 'doorL' ? st.doorL : st.doorR;
      st.doorTicks++;
      if (closed) {
        if (window.SFX) SFX.deny();          /* thunk against the door */
        if (st.doorTicks >= 2) {             /* gives up, retreats     */
          st.pos = 'dining'; st.doorTicks = 0;
          if (window.SFX) SFX.step();
        }
      } else if (st.doorTicks >= 1) {
        return jumpscare();
      }
    } else if (Math.random() < chance) {
      var opts = ROOMS[st.pos].next;
      /* moving forward is likelier than retreating */
      var fwd = opts.filter(function (r) { return r !== 'stage' && r !== 'dining' || st.pos === 'stage'; });
      var pick = (Math.random() < 0.75 && fwd.length) ? fwd[(Math.random() * fwd.length) | 0]
                                                      : opts[(Math.random() * opts.length) | 0];
      st.pos = pick;
      st.doorTicks = 0;
      if (window.SFX) { SFX.step(); if (st.camsUp) SFX.static(); }
      if (st.camsUp) renderCam();
    }
    renderOffice();
  }

  /* ---- power & clock -------------------------------------------------- */
  function powerTick() {
    if (st.over) return;
    var elapsed = performance.now() - st.t0;

    var hour = Math.min(5, Math.floor(elapsed / (NIGHT_LEN / 6)));
    if (hour !== st.hour) { st.hour = hour; if (window.SFX) SFX.blip(); }

    if (elapsed >= NIGHT_LEN) return win();

    var extra = usage() - 1;
    st.power -= (0.45 + 0.65 * extra) * 0.25;   /* tick = 250ms */
    if (st.power <= 0) return blackout();
    renderHud();
  }

  function blackout() {
    st.power = 0; st.over = 'blackout';
    st.doorL = st.doorR = st.lightL = st.lightR = false;
    if (st.camsUp) camsDown();
    renderHud(); renderOffice();
    game.classList.add('blackout');
    if (window.SFX) SFX.hum();
    /* a few seconds of dark, then... */
    later(function () {
      st.over = false;                 /* let jumpscare() run */
      jumpscare();
    }, 3500 + Math.random() * 4000);
  }

  function jumpscare() {
    if (st.over === true) return;
    st.over = true;
    stopTimers();
    if (window.SFX) SFX.scare();
    if (REDUCED) {
      endNight(false);
    } else {
      scrScare.hidden = false;
      game.classList.add('shake');
      later(function () {
        game.classList.remove('shake');
        endNight(false);
      }, 900);
    }
  }

  function win() {
    st.over = true;
    stopTimers();
    if (window.SFX) SFX.chime();
    try { localStorage.setItem('sjj_fnaf_night', String(st.night + 1)); } catch (e) {}
    endNight(true);
  }

  function endNight(won) {
    game.classList.remove('blackout');
    show(scrEnd);
    game.classList.toggle('won', won);
    if (won) {
      endTitle.textContent = '6:00 AM';
      endBody.innerHTML = 'yaaaay! *children cheering noises*<br>You survived night ' + st.night +
        '. The raccoon in the bear suit goes back to his stage.<br>' +
        '<span class="muted">night ' + (st.night + 1) + ' unlocked - he will be faster.</span>';
      if (window.SJJQuest) SJJQuest.award('fnaf');
    } else {
      endTitle.textContent = st.night > 0 && st.power <= 0 ? 'THE POWER RAN OUT' : '6AM NEVER CAME';
      endBody.innerHTML = 'Swift-Trap got you at ' + HOURS[st.hour] + ' on night ' + st.night + '.<br>' +
        '<span class="muted">tip: lights check the doorways. doors stop him. everything costs power.</span>';
    }
    $('#fg-retry').textContent = won ? '> NIGHT ' + (st.night + 1) : '> RETRY NIGHT ' + st.night;
    $('#fg-retry').dataset.night = won ? st.night + 1 : st.night;
  }

  /* ---- controls -------------------------------------------------------- */
  function toggle(prop) {
    if (!st || st.over) return;
    st[prop] = !st[prop];
    if (window.SFX) SFX.click();
    renderOffice(); renderHud();
  }
  $('#fg-doorL').addEventListener('click', function () { toggle('doorL'); });
  $('#fg-doorR').addEventListener('click', function () { toggle('doorR'); });
  $('#fg-lightL').addEventListener('click', function () { toggle('lightL'); });
  $('#fg-lightR').addEventListener('click', function () { toggle('lightR'); });

  function camsUp() {
    if (!st || st.over) return;
    st.camsUp = true;
    show(scrCams);
    if (window.SFX) SFX.static();
    renderCam(); renderHud();
  }
  function camsDown() {
    st.camsUp = false;
    show(scrOffice);
    if (window.SFX) SFX.static();
    renderOffice(); renderHud();
  }
  $('#fg-cams').addEventListener('click', camsUp);
  $('#fg-cams-down').addEventListener('click', camsDown);
  scrCams.querySelectorAll('.fg-cam-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      st.cam = b.dataset.room;
      if (window.SFX) SFX.static();
      renderCam();
    });
  });

  /* ---- start / menu ----------------------------------------------------- */
  function startNight(night) {
    stopTimers();
    st = newState(night);
    game.classList.remove('won', 'blackout');
    show(scrOffice);
    renderHud(); renderOffice();
    every(aiTick, Math.max(1600, 3300 - night * 250));
    every(powerTick, 250);
    if (window.SFX) SFX.hum();
  }

  $('#fg-new').addEventListener('click', function () { startNight(1); });
  var contBtn = $('#fg-continue');
  if (nightSaved() > 1) {
    contBtn.hidden = false;
    contBtn.textContent = '> CONTINUE - NIGHT ' + nightSaved();
  }
  contBtn.addEventListener('click', function () { startNight(nightSaved()); });
  $('#fg-retry').addEventListener('click', function (ev) {
    startNight(parseInt(ev.target.dataset.night || '1', 10));
  });
  $('#fg-quit').addEventListener('click', function () { show(scrMenu); });

  show(scrMenu);
})();
