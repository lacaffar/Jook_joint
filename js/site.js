/* =====================================================================
   site.js — shared behaviour for Swifty's Jook Joint.
   Everything is feature-detected, so this one file runs on every page.
   ===================================================================== */
(function () {
  'use strict';

  /* ---- current year in footers ------------------------------------ */
  document.querySelectorAll('.js-year').forEach(function (n) {
    n.textContent = new Date().getFullYear();
  });

  /* =================================================================
     SYSTEMS STATUS
     Edit this list to change what shows in the status panel.
     - `ping` (an image URL) makes it a LIVE check: loads → OK, else DOWN.
     - omit `ping` and set `state:'ok'` for an in-universe service.
     TODO: when Windpack gets its own domain, swap its `ping`/`url` below.
     ================================================================= */
  var SYSTEMS = [
    { svc: 'lacaffar.github.io', url: 'https://lacaffar.github.io/',
      ping: 'https://lacaffar.github.io/assets/img/avatar-icon.png', note: 'work page' },
    { svc: 'windpack', url: 'https://lacaffar.github.io/projects/club/windpack.html',
      ping: 'https://lacaffar.github.io/assets/img/avatar-icon.png', note: 'club site' },
    { svc: 'jook-joint', state: 'ok', note: 'this site' },
    { svc: 'raccoon-daemon', state: 'ok', note: 'pid 1' },
    { svc: 'jukebox', state: 'ok', note: 'spinning' }
  ];

  function pingImage(url, timeout) {
    return new Promise(function (resolve) {
      var img = new Image(), done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve(false); } }, timeout || 7000);
      img.onload  = function () { if (!done) { done = true; clearTimeout(t); resolve(true); } };
      img.onerror = function () { if (!done) { done = true; clearTimeout(t); resolve(false); } };
      img.src = url + (url.indexOf('?') < 0 ? '?' : '&') + '_=' + Date.now();
    });
  }

  var statusBox = document.querySelector('#status .rows');
  if (statusBox) {
    var allOK = true, pending = 0;
    SYSTEMS.forEach(function (s) {
      var row = document.createElement('div');
      var live = !!s.ping;
      row.className = 'status-row ' + (live ? 'check' : (s.state || 'ok'));
      var label = live ? '··' : (s.state === 'down' ? 'DOWN' : 'OK');
      var svc = s.url
        ? '<a class="svc" href="' + s.url + '" target="_blank" rel="noopener">' + s.svc + '</a>'
        : '<span class="svc">' + s.svc + '</span>';
      row.innerHTML =
        '<span class="tag' + (live ? ' blink' : '') + '">' + label + '</span>' +
        svc +
        '<span class="fill"></span>' +
        '<span class="ping">' + (s.note || '') + '</span>';
      statusBox.appendChild(row);

      if (live) {
        pending++;
        pingImage(s.ping).then(function (ok) {
          row.classList.remove('check');
          var tag = row.querySelector('.tag');
          tag.classList.remove('blink');
          if (ok) { row.classList.add('ok'); tag.textContent = 'OK'; }
          else { row.classList.add('down'); tag.textContent = 'DOWN'; allOK = false; }
          if (--pending === 0) summarise();
        });
      }
    });
    var head = document.querySelector('#status .verdict');
    function summarise() {
      if (!head) return;
      head.textContent = allOK ? 'all systems OK' : 'degraded';
      head.style.color = allOK ? 'var(--ok)' : 'var(--down)';
    }
    if (pending === 0) summarise();
  }

  /* =================================================================
     JUKEBOX — now-playing ticker
     ================================================================= */
  var track = document.querySelector('#nowplaying .track');
  if (track) {
    var SET = [
      'Toreador March — Freddy Fazbear',
      'Stardew Valley Overture — ConcernedApe',
      'Megalovania — Toby Fox',
      'Pelican Town (Spring) — ConcernedApe',
      'Your Best Nightmare — Toby Fox',
      'sabre clash, en garde mix',
      'late-night porch radio static'
    ];
    var i = 0;
    function spin() {
      track.style.opacity = 0;
      setTimeout(function () { track.textContent = SET[i = (i + 1) % SET.length]; track.style.opacity = 1; }, 250);
    }
    track.textContent = SET[0];
    track.style.transition = 'opacity .25s';
    setInterval(spin, 4200);
  }

  /* =================================================================
     RETRO HIT COUNTER (per-visitor, localStorage — purely for vibes)
     ================================================================= */
  var hit = document.querySelector('#hits');
  if (hit) {
    var BASE = 1057; // pretend we've had a few friends through already
    var n = 0;
    try {
      n = parseInt(localStorage.getItem('sjj_hits') || '0', 10) + 1;
      localStorage.setItem('sjj_hits', String(n));
    } catch (e) { n = 1; }
    hit.textContent = String(BASE + n).padStart(6, '0');
  }

  /* =================================================================
     UNDERTALE — save point
     ================================================================= */
  var save = document.querySelector('#savepoint');
  if (save) {
    var out = document.querySelector('#save-msg');
    function lastSaved() {
      var t = null;
      try { t = localStorage.getItem('sjj_save'); } catch (e) {}
      if (out) out.textContent = t
        ? '* File saved. (last: ' + t + ')'
        : '* (The shadow of the trash can looms ahead, filling you with determination.)';
    }
    save.addEventListener('click', function () {
      var stamp = new Date().toLocaleString();
      try { localStorage.setItem('sjj_save', stamp); } catch (e) {}
      if (out) out.textContent = '* You felt your determination harden. (saved ' + stamp + ')';
    });
    lastSaved();
  }

  /* =================================================================
     FENCING — scoreboard lamps (click a side to score a touch)
     ================================================================= */
  document.querySelectorAll('.lamp').forEach(function (lamp) {
    lamp.style.cursor = 'pointer';
    lamp.addEventListener('click', function () {
      lamp.classList.add('on');
      setTimeout(function () { lamp.classList.remove('on'); }, 1100);
    });
  });
  var both = document.querySelector('#double-touch');
  if (both) both.addEventListener('click', function () {
    document.querySelectorAll('.lamp').forEach(function (l) {
      l.classList.add('on'); setTimeout(function () { l.classList.remove('on'); }, 1100);
    });
  });

  /* =================================================================
     GUESTBOOK — saved in localStorage (per-browser; works on a static
     host with no backend). Rendered with textContent, so a signature
     can never inject markup or script.
     ================================================================= */
  var gbForm = document.querySelector('#gb-form');
  if (gbForm) {
    var KEY = 'sjj_guestbook';
    var list = document.querySelector('#gb-list');
    var nameI = document.querySelector('#gb-name');
    var moodI = document.querySelector('#gb-mood');
    var msgI  = document.querySelector('#gb-msg');
    var left  = document.querySelector('#gb-left');
    var countEl = document.querySelector('#gb-count');

    // starter entries (only shown until the visitor saves their own)
    var seed = [
      { name: 'Swifty', mood: '🎷', host: true, ts: Date.now() - 864e5 * 3,
        msg: 'welcome to the joint! pull up a stool and say hi.' },
      { name: 'the raccoon', mood: '🦝', ts: Date.now() - 36e5 * 5,
        msg: '*left a muddy pawprint and a single bottle cap*' }
    ];

    function load() {
      try { var raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
      return seed.slice();
    }
    function store(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 200))); } catch (e) {} }
    function fmt(ts) {
      var d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
             ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    function render() {
      var arr = load();
      list.textContent = '';
      if (!arr.length) {
        var empty = document.createElement('p');
        empty.className = 'gb-empty';
        empty.textContent = 'No signatures yet. Be the first!';
        list.appendChild(empty);
      }
      arr.forEach(function (en) {
        var card = document.createElement('div');
        card.className = 'gb-entry' + (en.host ? ' host' : '');
        var meta = document.createElement('div'); meta.className = 'gb-meta';
        var who  = document.createElement('span'); who.className = 'gb-who';  who.textContent = en.name;
        var ico  = document.createElement('span'); ico.className = 'gb-mood-ico'; ico.textContent = en.mood || '';
        var date = document.createElement('span'); date.className = 'gb-date'; date.textContent = fmt(en.ts);
        meta.appendChild(who); meta.appendChild(ico); meta.appendChild(date);
        var body = document.createElement('p'); body.className = 'gb-body'; body.textContent = en.msg;
        card.appendChild(meta); card.appendChild(body);
        list.appendChild(card);
      });
      if (countEl) countEl.textContent = arr.length ? '(' + arr.length + ')' : '';
    }

    function updateLeft() { if (left) left.textContent = (280 - msgI.value.length) + ' left'; }
    msgI.addEventListener('input', updateLeft); updateLeft();

    gbForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = nameI.value.trim().slice(0, 32);
      var msg  = msgI.value.trim().slice(0, 280);
      if (!name || !msg) return;
      var arr = load();
      arr.unshift({ name: name, mood: moodI.value, msg: msg, ts: Date.now() });
      store(arr); render();
      nameI.value = ''; msgI.value = ''; updateLeft(); nameI.focus();
    });

    render();
  }
})();
