/* =====================================================================
   gate.js - the door.

   Two things stand between a stranger and the joint, in this order:

     1. the book. nobody gets in without giving a name. once given, it is
        kept on that device and never asked again.
     2. bar hours. between 8am and 5pm the door is shut and wants the
        word. that part has not changed.

   This file is loaded from <head>, before anything paints, so the joint
   never flashes up behind either sign.

   It is a doorman, not a lock - everything here is in the page source.
   ===================================================================== */
(function () {
  'use strict';

  /* ---- the lines you are meant to edit ------------------------------- */
  var PASSWORD = 'stay determined';    /* capitals and extra spaces don't matter */
  var SHUT_FROM = 8, SHUT_UNTIL = 17;  /* closed 8am -> 5pm, visitor's local time */

  /* Where to send the name. Leave it '' and nothing ever leaves the page.
     Point it at your worker to start keeping the book:

       var LOG_TO = 'https://sjj-book.<you>.workers.dev/';

     Two things have to happen together or the browser blocks the call:
       - set this
       - add that same origin to connect-src in the CSP meta tag of every
         page that loads this file
     The worker is the only thing that ever holds a Notion token, and it is
     what reads the caller's IP. See worker/README.md. */
  var LOG_TO = '';

  var NAME_KEY = 'sjj_name';
  var PASS_KEY = 'sjj_pass';

  var root = document.documentElement;
  var gateEl = null, tick = 0, misses = 0;

  function tidy(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function named() { var n = get(NAME_KEY); return !!(n && n.length); }
  function known() { return get(PASS_KEY) === '1'; }
  function daylight() { var h = new Date().getHours(); return h >= SHUT_FROM && h < SHUT_UNTIL; }
  function clock() { return new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function hour12(h) { return (h % 12 || 12) + (h < 12 ? 'am' : 'pm'); }

  /* whoever is reading, for anything else on the site that wants to know */
  window.SJJVisitor = { name: function () { return get(NAME_KEY) || ''; } };

  /* ---- the book ------------------------------------------------------
     fire and forget. if the worker is down, or LOG_TO is blank, or the
     visitor is offline, the door still opens. */
  function sign(name) {
    if (!LOG_TO) return;
    try {
      fetch(LOG_TO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, page: location.pathname }),
        keepalive: true,
        mode: 'cors'
      })['catch'](function () {});
    } catch (e) {}
  }

  /* ---- shared shell --------------------------------------------------- */
  function card(inner, label) {
    if (gateEl) { gateEl.remove(); gateEl = null; }
    gateEl = document.createElement('div');
    gateEl.className = 'gate';
    gateEl.setAttribute('role', 'dialog');
    gateEl.setAttribute('aria-modal', 'true');
    gateEl.setAttribute('aria-label', label);
    gateEl.innerHTML = '<div class="gate-card">' + inner + '</div>';
    document.body.appendChild(gateEl);

    var rac = gateEl.querySelector('.gate-rac');
    if (rac && window.RaccoonSVG) rac.innerHTML = window.RaccoonSVG;
    return gateEl;
  }

  /* ---- 1. who are you ------------------------------------------------- */
  function askName() {
    card(
      '<div class="gate-rac" aria-hidden="true"></div>' +
      '<h1>who are you?</h1>' +
      '<p class="gate-when">the raccoon keeps a book. put a name in it and the ' +
        'door opens for good on this device.</p>' +
      '<form class="gate-form" autocomplete="off">' +
        '<input class="gate-input" type="text" name="who" maxlength="40" ' +
               'placeholder="your name" aria-label="your name" ' +
               'autocapitalize="words" spellcheck="false" />' +
        '<button class="gate-btn" type="submit">in</button>' +
      '</form>' +
      '<p class="gate-msg" role="status"></p>' +
      '<p class="gate-fine">a name and an address go in the book. nothing else.</p>' +
      '<button class="gate-slip" type="button" tabindex="-1" aria-hidden="true"></button>',
      'who are you'
    );

    var msg = gateEl.querySelector('.gate-msg');
    var input = gateEl.querySelector('.gate-input');
    var shell = gateEl.querySelector('.gate-card');

    gateEl.querySelector('.gate-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = String(input.value).trim().replace(/\s+/g, ' ');
      if (name.length < 2) {
        shell.classList.remove('nope'); void shell.offsetWidth; shell.classList.add('nope');
        msg.className = 'gate-msg';
        msg.textContent = 'that is not a name.';
        return;
      }
      put(NAME_KEY, name);
      sign(name);
      msg.className = 'gate-msg good';
      msg.textContent = 'noted, ' + name.split(' ')[0].toLowerCase() + '.';
      setTimeout(step, 620);
    });

    /* the way in for the house. a dead square in the bottom right corner
       of the card: no border, no cursor, no tab stop. double click it. */
    gateEl.querySelector('.gate-slip').addEventListener('dblclick', function () {
      put(NAME_KEY, 'the house');
      put(PASS_KEY, '1');
      openUp();
    });

    setTimeout(function () { input.focus(); }, 80);
  }

  /* ---- 2. bar hours --------------------------------------------------- */
  function askWord() {
    card(
      '<div class="gate-sign"><span>CLOSED</span></div>' +
      '<div class="gate-rac" aria-hidden="true"></div>' +
      '<h1>the joint keeps bar hours</h1>' +
      '<p class="gate-when">open ' + hour12(SHUT_UNTIL) + ' till ' + hour12(SHUT_FROM) +
        '. it is <b class="gate-clock"></b> out there.</p>' +
      '<form class="gate-form" autocomplete="off">' +
        '<input class="gate-input" type="password" name="word" maxlength="64" ' +
               'placeholder="the word at the door" aria-label="the word at the door" />' +
        '<button class="gate-btn" type="submit">knock</button>' +
      '</form>' +
      '<p class="gate-msg" role="status"></p>',
      'the joint is closed'
    );

    var msg = gateEl.querySelector('.gate-msg');
    var input = gateEl.querySelector('.gate-input');
    var shell = gateEl.querySelector('.gate-card');

    gateEl.querySelector('.gate-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (tidy(input.value) === tidy(PASSWORD)) {
        put(PASS_KEY, '1');
        msg.textContent = 'come in, then.';
        msg.className = 'gate-msg good';
        setTimeout(openUp, 600);
        return;
      }
      misses++;
      input.value = '';
      shell.classList.remove('nope'); void shell.offsetWidth; shell.classList.add('nope');
      msg.className = 'gate-msg';
      msg.textContent = misses < 3
        ? 'he does not know you.'
        : '* it is the thing you tell yourself when the going gets tough.';
    });

    gateEl.querySelector('.gate-clock').textContent = clock();
    setTimeout(function () { input.focus(); }, 80);
  }

  /* ---- which sign is on the door right now ---------------------------- */
  function shutOut() { return !named() || (daylight() && !known()); }

  function step() {
    if (!named()) { root.classList.add('shut'); askName(); return; }
    if (daylight() && !known()) { root.classList.add('shut'); askWord(); return; }
    openUp();
  }

  function openUp() {
    root.classList.remove('shut');
    if (gateEl) { gateEl.remove(); gateEl = null; }
  }

  function check() {
    if (!shutOut()) { openUp(); return; }
    if (!gateEl) { step(); return; }
    var c = gateEl.querySelector('.gate-clock');
    if (c) c.textContent = clock();
  }

  /* the class goes on now, synchronously, so the CSS hides the joint
     before the browser has painted a single pixel of it */
  if (shutOut()) root.classList.add('shut');

  function ready() {
    if (root.classList.contains('shut')) step();
    tick = setInterval(check, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
