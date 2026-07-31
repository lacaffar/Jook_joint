/* =====================================================================
   gate.js - the joint keeps bar hours.

   Between 8am and 5pm the door is shut. Say the word at the door and it
   stays open on this device from then on. This file is loaded from
   <head>, before anything paints, so the joint never flashes up behind
   the CLOSED sign.

   It is a doorman, not a lock - everything here is in the page source.
   ===================================================================== */
(function () {
  'use strict';

  /* ---- the two lines you are meant to edit --------------------------- */
  var PASSWORD = 'stay determined';    /* capitals and extra spaces don't matter */
  var SHUT_FROM = 8, SHUT_UNTIL = 17;  /* closed 8am -> 5pm, visitor's local time */

  var KEY = 'sjj_pass';
  var root = document.documentElement;
  var gateEl = null, tick = 0, misses = 0;

  function tidy(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function known() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function daylight() { var h = new Date().getHours(); return h >= SHUT_FROM && h < SHUT_UNTIL; }
  function clock() { return new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function hour12(h) { return (h % 12 || 12) + (h < 12 ? 'am' : 'pm'); }

  /* ---- the sign on the door ------------------------------------------ */
  function build() {
    if (gateEl || !document.body) return;
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
      '</div>';
    document.body.appendChild(gateEl);

    var rac = gateEl.querySelector('.gate-rac');
    if (rac && window.RaccoonSVG) rac.innerHTML = window.RaccoonSVG;

    var msg = gateEl.querySelector('.gate-msg');
    var input = gateEl.querySelector('.gate-input');
    var card = gateEl.querySelector('.gate-card');

    gateEl.querySelector('.gate-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (tidy(input.value) === tidy(PASSWORD)) {
        remember();
        msg.textContent = 'come in, then.';
        msg.className = 'gate-msg good';
        setTimeout(openUp, 600);
        return;
      }
      misses++;
      input.value = '';
      card.classList.remove('nope'); void card.offsetWidth; card.classList.add('nope');
      msg.className = 'gate-msg';
      msg.textContent = misses < 3
        ? 'he does not know you.'
        : '* it is the thing you tell yourself when the going gets tough.';
    });

    gateEl.querySelector('.gate-clock').textContent = clock();
    setTimeout(function () { input.focus(); }, 80);
  }

  function shut() {
    root.classList.add('shut');
    if (gateEl) gateEl.hidden = false; else build();
  }
  function openUp() {
    root.classList.remove('shut');
    if (gateEl) { gateEl.remove(); gateEl = null; }
  }
  function check() {
    if (known() || !daylight()) { openUp(); return; }
    shut();
    if (gateEl) {
      var c = gateEl.querySelector('.gate-clock');
      if (c) c.textContent = clock();
    }
  }

  /* the class goes on now, synchronously, so the CSS hides the joint
     before the browser has painted a single pixel of it */
  if (daylight() && !known()) root.classList.add('shut');

  function ready() {
    if (root.classList.contains('shut')) build();
    tick = setInterval(check, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
