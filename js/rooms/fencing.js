/* =====================================================================
   fencing.js - ALLEZ! a directional reaction duel (rough draft).
   En garde… prêt… then a line flashes: press the matching direction
   (W/A/D or arrows, or tap the big buttons) before the window closes.
   Foil & sabre roll right-of-way each exchange - with priority you
   attack, without it you parry. Épée is a pure speed race. First to 5.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('#piste');
  if (!root) return;

  var refLine = root.querySelector('#ref-line');
  var msgEl   = root.querySelector('.fence-msg');
  var hudEl   = root.querySelector('.duel-hud');
  var startBtn = root.querySelector('#bout-start');
  var dirBtns = { high: root.querySelector('#dir-high'),
                  left: root.querySelector('#dir-left'),
                  right: root.querySelector('#dir-right') };
  var lampThem = document.querySelector('.lamp.red');
  var lampYou  = document.querySelector('.lamp.green');
  var scoreMid = document.querySelector('#score-mid');

  var SYM = { high: '⬆', left: '⬅', right: '➡' };
  var WORD = { high: 'HIGH', left: 'LEFT', right: 'RIGHT' };
  var DIRS = ['high', 'left', 'right'];

  var state = 'idle';          /* idle | wait | prompt | over            */
  var me = 0, them = 0;
  var windowMs = 700;          /* reaction window - the "opponent" */
  var target = null, role = '', t0 = 0;
  var yellow = false;
  var timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function weapon() {
    var w = root.querySelector('input[name="weapon"]:checked');
    return w ? w.value : 'foil';
  }

  function best() {
    var b = 0; try { b = parseInt(localStorage.getItem('sjj_fencing_best') || '0', 10); } catch (e) {}
    return b;
  }

  function hud(extra) {
    var b = best();
    hudEl.textContent = 'you ' + me + ' · ' + them + ' them   |   window ' + windowMs + 'ms' +
      (b ? '   |   best touch ' + b + 'ms' : '') + (extra ? '   |   ' + extra : '');
    if (scoreMid) scoreMid.textContent = them + ' · ' + me;
  }

  function lamp(el) {
    el.classList.add('on');
    later(function () { el.classList.remove('on'); }, 1100);
  }

  function say(t, cls) {
    refLine.textContent = t;
    refLine.className = 'ref-line' + (cls ? ' ' + cls : '');
  }
  function note(t) { msgEl.textContent = t; }

  function glow(dir) {
    DIRS.forEach(function (d) { dirBtns[d].classList.toggle('target', d === dir); });
  }

  function exchange() {
    state = 'wait';
    target = null;
    glow(null);
    var w = weapon();
    var pr = '';
    if (w !== 'epee') {
      var mine = Math.random() < 0.5;
      role = mine ? 'attack' : 'parry';
      pr = mine ? 'you have priority - be ready to ATTACK' : 'they have priority - be ready to PARRY';
    } else {
      role = 'hit';
      pr = 'épée: no right-of-way. fastest blade wins.';
    }
    note(pr);
    say('En garde…');
    later(function () { say('Prêt…'); }, 900);
    var delay = 900 + 800 + Math.random() * (w === 'sabre' ? 1000 : 2000);
    later(function () {
      state = 'prompt';
      target = DIRS[(Math.random() * 3) | 0];
      t0 = performance.now();
      var call =
        role === 'attack' ? 'ATTACK ' + WORD[target] + '! ' + SYM[target] :
        role === 'parry'  ? 'PARRY '  + WORD[target] + '! ' + SYM[target] :
                            'HIT '    + WORD[target] + '! ' + SYM[target];
      say(call, 'allez');
      glow(target);
      if (window.SFX) SFX.click();
      later(function () { if (state === 'prompt') resolve(false, null, 'too slow - the machine takes the touch'); }, windowMs);
    }, delay);
  }

  function resolve(won, ms, why) {
    state = 'between';
    clearTimers();
    glow(null);
    timers = [];
    if (won) {
      me++;
      lamp(lampYou);
      if (window.SFX) SFX.buzz();
      var verb = role === 'parry' ? 'parry-riposte' : 'touch';
      say('TOUCHE! ' + verb + ' in ' + ms + 'ms', 'good');
      note(ms < 250 ? 'lightning. actual lightning.' : ms < 400 ? 'clean and quick.' : 'that one was close.');
      try { if (!best() || ms < best()) localStorage.setItem('sjj_fencing_best', String(ms)); } catch (e) {}
    } else {
      them++;
      lamp(lampThem);
      if (window.SFX) SFX.deny();
      say('POINT AGAINST.', 'bad');
      note(why);
    }
    windowMs = Math.max(400, windowMs - 40);
    hud();
    if (me >= 5) return win();
    if (them >= 5) return lose();
    later(exchange, 1600);
  }

  function falseStart() {
    state = 'between';
    clearTimers();
    glow(null);
    if (!yellow) {
      yellow = true;
      say('HALT! false start - yellow card', 'card-y');
      note('jumping the gun. once.');
    } else {
      them++;
      lamp(lampThem);
      say('HALT! false start - RED CARD, point against', 'card-r');
      note('the referee is not amused.');
      hud();
      if (them >= 5) return lose();
    }
    if (window.SFX) SFX.deny();
    later(exchange, 1600);
  }

  function win() {
    state = 'over';
    say('VICTORY ' + me + '–' + them, 'good');
    note('salute! the raccoon taps his glove against yours. 🦝🤺');
    startBtn.hidden = false;
    startBtn.textContent = 'fence another bout';
    if (window.SFX) SFX.coin();
    if (window.SJJQuest) SJJQuest.award('fencing');
  }

  function lose() {
    state = 'over';
    say('DEFEAT ' + me + '–' + them, 'bad');
    note('the machine salutes. it has no honor. run it back.');
    startBtn.hidden = false;
    startBtn.textContent = 'demand a rematch';
  }

  function input(dir) {
    if (state === 'wait') return falseStart();
    if (state !== 'prompt') return;
    if (dir === target) {
      var ms = Math.round(performance.now() - t0);
      resolve(true, ms);
    } else {
      resolve(false, null, 'wrong line - you went ' + WORD[dir].toLowerCase() + ', the call was ' + WORD[target].toLowerCase());
    }
  }

  var KEYS = { w: 'high', arrowup: 'high', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
  document.addEventListener('keydown', function (ev) {
    if (state === 'idle' || state === 'over') return;
    var dir = KEYS[ev.key.toLowerCase()];
    if (!dir) return;
    ev.preventDefault();
    input(dir);
  });
  DIRS.forEach(function (d) {
    dirBtns[d].addEventListener('click', function () {
      if (state === 'idle' || state === 'over') return;
      input(d);
    });
  });

  startBtn.addEventListener('click', function () {
    me = 0; them = 0; yellow = false; windowMs = 700;
    startBtn.hidden = true;
    hud();
    exchange();
  });

  hud();
})();
