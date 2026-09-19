/* =====================================================================
   gate.js - the door.

   Three things, in this order:

     1. bar hours. between 8am and 5pm the door is shut and wants the
        word. that one blacks the place out, because the joint really is
        closed and there is nothing to look at.
     2. the book. once inside, a small card sits over the room asking for
        a name. the joint is right there behind it, lit and visible, but
        nothing works until the name is given. once given it is kept on
        that device and never asked again.
     3. the notice. a plain privacy popup in the other corner, the same
        one every site on earth shows you. it is not in the voice of the
        joint and it is not meant to be.

   This file is loaded from <head>, before anything paints, so the CLOSED
   sign never flashes up behind the joint.

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
     what reads the caller's IP. */
  var LOG_TO = '';

  var NAME_KEY   = 'sjj_name';
  var PASS_KEY   = 'sjj_pass';
  var NOTICE_KEY = 'sjj_notice';

  var root = document.documentElement;
  var gateEl = null;      /* the blackout, for bar hours */
  var bookEl = null;      /* the card over the room, for the name */
  var untrap = null, tick = 0, misses = 0;

  function tidy(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function named() { var n = get(NAME_KEY); return !!(n && n.length); }
  function known() { return get(PASS_KEY) === '1'; }
  function told()  { return get(NOTICE_KEY) === '1'; }
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

  /* the dead square that lets the house in. no border, no cursor, no tab
     stop, not read out. double click it. */
  var SLIP = '<button class="gate-slip" type="button" tabindex="-1" aria-hidden="true"></button>';

  function houseKeys() {
    put(NAME_KEY, 'the house');
    put(PASS_KEY, '1');
    put(NOTICE_KEY, '1');
    clear();
  }

  /* ---- the notice ----------------------------------------------------
     Cut to the floor: what is taken, what it is for, and who to write to
     to get rid of it. No statute names, because this is not aimed at
     anywhere that has them. Keep it accurate: if what the worker writes
     changes, so does this. */
  var NOTICE =
    '<aside class="notice-pop" role="region" aria-label="Privacy notice">' +
      '<p class="np-h">Privacy notice</p>' +
      '<p>This site records the name you enter, your IP address and the time of ' +
      'your visit, and keeps them in a visitor log. Nothing is sold or shared.</p>' +
      '<p>To have your entry removed, contact ' +
      '<a href="mailto:lacaffar@ncsu.edu">lacaffar@ncsu.edu</a>.</p>' +
      '<div class="np-act"><button class="np-ok" type="button">Accept</button></div>' +
    '</aside>';

  /* ---- 1. bar hours, which blacks the place out ----------------------- */
  function askWord() {
    if (gateEl) return;
    root.classList.add('shut');
    gateEl = document.createElement('div');
    gateEl.className = 'gate';
    gateEl.setAttribute('role', 'dialog');
    gateEl.setAttribute('aria-modal', 'true');
    gateEl.setAttribute('aria-label', 'the joint is closed');
    gateEl.innerHTML =
      '<div class="gate-card">' +
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
        '<p class="gate-msg" role="status"></p>' +
        SLIP +
      '</div>';
    document.body.appendChild(gateEl);

    var rac = gateEl.querySelector('.gate-rac');
    if (rac && window.RaccoonSVG) rac.innerHTML = window.RaccoonSVG;

    var msg = gateEl.querySelector('.gate-msg');
    var input = gateEl.querySelector('.gate-input');
    var shell = gateEl.querySelector('.gate-card');

    gateEl.querySelector('.gate-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (tidy(input.value) === tidy(PASSWORD)) {
        put(PASS_KEY, '1');
        msg.textContent = 'come in, then.';
        msg.className = 'gate-msg good';
        setTimeout(step, 600);
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

    gateEl.querySelector('.gate-slip').addEventListener('dblclick', houseKeys);

    gateEl.querySelector('.gate-clock').textContent = clock();
    setTimeout(function () { input.focus(); }, 80);
  }

  function dropGate() {
    root.classList.remove('shut');
    if (gateEl) { gateEl.remove(); gateEl = null; }
  }

  /* ---- 2 and 3. the card over the room, and the notice beside it ------ */
  /* the joint stays lit and visible behind these. a veil over the top of
     it catches every click, and focus is pulled back, so the card cannot
     be tabbed past or clicked around. the notice sits above the veil too,
     so its one button still works. */
  function askName(withNotice) {
    if (bookEl) return;
    bookEl = document.createElement('div');
    bookEl.className = 'book-wrap';
    bookEl.innerHTML =
      '<div class="book-veil"></div>' +
      (withNotice ? NOTICE : '') +
      '<div class="book" role="dialog" aria-modal="true" aria-label="who are you">' +
        '<div class="book-card">' +
          '<div class="book-top">' +
            '<span class="book-rac" aria-hidden="true"></span>' +
            '<h2>who are you?</h2>' +
          '</div>' +
          "<p class=\"book-say\">I don't think you've been here before. " +
            'Please enter your name.</p>' +
          '<form class="gate-form book-form" autocomplete="off">' +
            '<input class="gate-input" type="text" name="who" maxlength="40" ' +
                   'placeholder="your name" aria-label="your name" ' +
                   'autocapitalize="words" spellcheck="false" />' +
            '<button class="gate-btn" type="submit">in</button>' +
          '</form>' +
          '<p class="book-msg" role="status"></p>' +
          SLIP +
        '</div>' +
      '</div>';
    document.body.appendChild(bookEl);

    var rac = bookEl.querySelector('.book-rac');
    if (rac && window.RaccoonSVG) rac.innerHTML = window.RaccoonSVG;

    var msg = bookEl.querySelector('.book-msg');
    var input = bookEl.querySelector('.gate-input');
    var shell = bookEl.querySelector('.book-card');

    bookEl.querySelector('.book-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = String(input.value).trim().replace(/\s+/g, ' ');
      if (name.length < 2) {
        shell.classList.remove('nope'); void shell.offsetWidth; shell.classList.add('nope');
        msg.className = 'book-msg';
        msg.textContent = 'that is not a name.';
        return;
      }
      put(NAME_KEY, name);
      sign(name);
      msg.className = 'book-msg good';
      msg.textContent = 'noted, ' + name.split(' ')[0].toLowerCase() + '.';
      setTimeout(clear, 620);
    });

    bookEl.querySelector('.gate-slip').addEventListener('dblclick', houseKeys);

    var pop = bookEl.querySelector('.notice-pop');
    if (pop) {
      pop.querySelector('.np-ok').addEventListener('click', function () {
        put(NOTICE_KEY, '1');
        pop.classList.add('gone');
        setTimeout(function () { if (pop.parentNode) pop.remove(); }, 260);
        input.focus();
      });
    }

    /* Nothing behind the card may be clicked, tabbed to, or read out.
       inert does all three properly. Where it is missing, fall back to
       dragging focus back by hand, deferred, because a focus() called
       straight out of a focusin handler gets thrown away. */
    var sealed = [];
    if ('inert' in HTMLElement.prototype) {
      Array.prototype.forEach.call(document.body.children, function (el) {
        if (el === bookEl || el.inert) return;
        el.inert = true;
        sealed.push(el);
      });
      untrap = function () {
        sealed.forEach(function (el) { el.inert = false; });
        sealed = [];
      };
    } else {
      var pulling = false;
      var pull = function (ev) {
        if (shell.contains(ev.target)) return;
        if (pop && pop.contains(ev.target)) return;
        if (pulling) return;
        pulling = true;
        setTimeout(function () { input.focus(); pulling = false; }, 0);
      };
      document.addEventListener('focusin', pull, true);
      untrap = function () { document.removeEventListener('focusin', pull, true); };
    }

    setTimeout(function () { input.focus(); }, 80);
  }

  function dropBook() {
    if (untrap) { untrap(); untrap = null; }
    if (bookEl) { bookEl.remove(); bookEl = null; }
  }

  /* ---- which sign is on the door right now ---------------------------- */
  /* only bar hours blacks the page out before paint. the book does not,
     because the room is meant to be visible behind it. */
  function barred() { return daylight() && !known(); }

  function step() {
    if (barred()) { dropBook(); askWord(); return; }
    dropGate();
    if (!named()) { askName(!told()); return; }
    dropBook();
  }

  function clear() { dropGate(); dropBook(); }

  function check() {
    step();
    if (gateEl) {
      var c = gateEl.querySelector('.gate-clock');
      if (c) c.textContent = clock();
    }
  }

  /* the class goes on now, synchronously, so the CSS hides the joint
     before the browser has painted a single pixel of it */
  if (barred()) root.classList.add('shut');

  function ready() {
    step();
    tick = setInterval(check, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
