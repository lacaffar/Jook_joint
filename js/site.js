/* =====================================================================
   site.js - shared behaviour for Swifty's Jook Joint.
   Everything is feature-detected, so this one file runs on every page.
   ===================================================================== */
(function () {
  'use strict';

  /* Where the site root is, relative to whatever page we're on. Pages in
     a subfolder (blog/) would otherwise look for audio/ inside their own
     folder and 404. Taken from this script's own URL. */
  var ROOT = (function () {
    var s = document.currentScript;
    return s && s.src ? s.src.replace(/js\/[^/]+\.js(\?.*)?$/, '') : '';
  })();

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
    { svc: 'camera', url: 'fnaf.html', state: 'down', note: 'CAM 3C - desk feed' },
    { svc: 'jukebox', state: 'ok', note: 'spinning' }
  ];

  function pingImage(url, timeout) {
    return new Promise(function (resolve) {
      var img = new Image(), done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve(false); } }, timeout || 7000);
      img.onload = function () { if (!done) { done = true; clearTimeout(t); resolve(true); } };
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

      var tag = document.createElement('span');
      tag.className = 'tag' + (live ? ' blink' : '');
      tag.textContent = live ? '··' : (s.state === 'down' ? 'DOWN' : 'OK');
      if (!live && s.state === 'down') allOK = false;   /* keep the verdict honest */

      var svc = document.createElement(s.url ? 'a' : 'span');
      svc.className = 'svc';
      svc.textContent = s.svc;
      if (s.url) {
        svc.href = s.url;
        if (/^https?:/i.test(s.url)) { svc.target = '_blank'; svc.rel = 'noopener'; }
      }

      var fill = document.createElement('span');
      fill.className = 'fill';

      var ping = document.createElement('span');
      ping.className = 'ping';
      ping.textContent = s.note || '';

      row.appendChild(tag); row.appendChild(svc); row.appendChild(fill); row.appendChild(ping);
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
     JUKEBOX - now-playing ticker + audio playback
     Drop .mp3 files into audio/ and add them to TRACKS below.
     ================================================================= */
  var TRACKS = [
    { title: 'Once Upon a Time - Toby Fox', src: 'audio/01-once-upon-a-time.mp3' },
    { title: 'Start Menu - Toby Fox', src: 'audio/02-start-menu.mp3' },
    { title: 'Your Best Friend - Toby Fox', src: 'audio/03-your-best-friend.mp3' },
    { title: 'Fallen Down - Toby Fox', src: 'audio/04-fallen-down.mp3' },
    { title: 'Determination - Toby Fox', src: 'audio/11-determination.mp3' },
    { title: 'Snowy - Toby Fox', src: 'audio/17-snowy.mp3' },
    { title: 'Snowdin Town - Toby Fox', src: 'audio/22-snowdin-town.mp3' },
    { title: 'Shop - Toby Fox', src: 'audio/23-shop.mp3' },
    { title: 'Undertale - Toby Fox', src: 'audio/71-undertale.mp3' },
    { title: 'Fallen Down (Reprise) - Toby Fox', src: 'audio/85-fallen-down-reprise.mp3' },
    { title: 'Battle Against a True Hero - Toby Fox', src: 'audio/98-battle-against-a-true-hero.mp3' }
  ];

  var npBox = document.querySelector('#nowplaying');
  var track = document.querySelector('#nowplaying .track');
  var jukeBtn = document.querySelector('#jukebox-btn');
  var jukeTxt = jukeBtn && jukeBtn.querySelector('.juke-txt');
  var audio = new Audio();
  audio.volume = 0.4;
  var trackIdx = 0;
  var touched = false;   /* has anyone put a coin in yet this page */
  var duds = 0;          /* consecutive files that wouldn't load */

  /* The ticker used to rotate titles on a timer whether or not anything
     was coming out of the speakers. Now it reports the audio element and
     nothing else, so what it says is what you are hearing. */
  function report() {
    if (!npBox) return;
    var live = !audio.paused && !audio.ended;
    var title = TRACKS[trackIdx].title;
    npBox.classList.toggle('off', !live);
    if (track) track.textContent = live ? title : (touched ? 'paused' : 'jukebox off');
    npBox.title = live ? 'now playing: ' + title : 'the jukebox is quiet';
    if (jukeBtn) {
      jukeBtn.classList.toggle('playing', live);
      if (jukeTxt) jukeTxt.textContent = live ? 'playing' : 'jukebox';
    }
    if (live) hideHint();
  }

  function playIdx(i) {
    trackIdx = (i + TRACKS.length) % TRACKS.length;
    audio.src = ROOT + TRACKS[trackIdx].src;
    audio.play().catch(function () { report(); });
  }

  ['play', 'playing', 'pause', 'ended', 'emptied'].forEach(function (ev) {
    audio.addEventListener(ev, report);
  });
  audio.addEventListener('playing', function () { duds = 0; });
  audio.addEventListener('ended', function () { playIdx(trackIdx + 1); });
  audio.addEventListener('error', function () {
    /* a missing mp3 shouldn't spin the machine forever */
    if (!touched || ++duds >= TRACKS.length) { duds = 0; report(); return; }
    playIdx(trackIdx + 1);
  });

  if (jukeBtn) jukeBtn.addEventListener('click', function () {
    hideHint(true);
    if (audio.paused) {
      touched = true;
      if (!audio.src) playIdx(trackIdx); else audio.play().catch(function () { report(); });
    } else {
      audio.pause();
    }
  });
  report();

  /* =================================================================
     THE ARROW - points at the jukebox until you have used it once
     ================================================================= */
  var hint = document.querySelector('#music-hint');
  var HINT_KEY = 'sjj_music_hint';
  function hideHint(forGood) {
    if (hint) hint.hidden = true;
    if (forGood) { try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {} }
  }
  if (hint) {
    var seen = true;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (e) {}
    if (!seen) setTimeout(function () { if (audio.paused) hint.hidden = false; }, 900);
  }

  /* =================================================================
     RETRO HIT COUNTER (per-visitor, localStorage - purely for vibes)
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
     GUESTBOOK - saved in localStorage (per-browser; works on a static
     host with no backend). Rendered with textContent, so a signature
     can never inject markup or script.
     ================================================================= */
  var gbForm = document.querySelector('#gb-form');
  if (gbForm) {
    var KEY = 'sjj_guestbook';
    var list = document.querySelector('#gb-list');
    var nameI = document.querySelector('#gb-name');
    var moodI = document.querySelector('#gb-mood');
    var msgI = document.querySelector('#gb-msg');
    var left = document.querySelector('#gb-left');
    var countEl = document.querySelector('#gb-count');
    var warn = document.querySelector('#gb-warn');

    // the raccoon's paw, as an 8x8 stamp
    var PAW = '01100110' + '01100110' + '00000000' + '00111100' +
              '01111110' + '01111110' + '00111100' + '00000000';

    /* The two house entries. These are NOT copied into storage - they are
       drawn underneath whatever you have signed. Seeding storage with them
       was how the book used to "clear itself": any hiccup reading the key
       fell back to the seed, and two familiar entries where your own used
       to be reads exactly like a wipe. */
    var HOUSE = [
      { name: 'Swifty', mood: '', host: true, ts: Date.now() - 864e5 * 3,
        msg: 'welcome to the joint! pull up a stool and say hi.' },
      { name: 'the raccoon', mood: '', ts: Date.now() - 36e5 * 5, stamp: PAW,
        msg: '*left a muddy pawprint and a single bottle cap*\n' +
             'gur onpx ebbz vf oruvaq gur svsgu pnc. (he writes in ROT13. nobody knows why.)' }
    ];

    /* ---- the stamp pad: an 8x8 doodle saved with your signature ------ */
    var padEl = document.querySelector('#gb-stamp');
    var padCells = [];
    if (padEl) {
      var painting = false, paintTo = true;
      for (var ci = 0; ci < 64; ci++) {
        (function (cell) {
          cell.className = 'gb-stamp-cell';
          cell.addEventListener('pointerdown', function (ev) {
            ev.preventDefault();
            painting = true;
            paintTo = !cell.classList.contains('on');
            cell.classList.toggle('on', paintTo);
          });
          cell.addEventListener('pointerenter', function () {
            if (painting) cell.classList.toggle('on', paintTo);
          });
          padEl.appendChild(cell);
          padCells.push(cell);
        })(document.createElement('span'));
      }
      window.addEventListener('pointerup', function () { painting = false; });
      var clearBtn = document.querySelector('#gb-stamp-clear');
      if (clearBtn) clearBtn.addEventListener('click', function () {
        padCells.forEach(function (c) { c.classList.remove('on'); });
      });
    }
    function padValue() {
      var s = '';
      padCells.forEach(function (c) { s += c.classList.contains('on') ? '1' : '0'; });
      return s.indexOf('1') >= 0 ? s : '';
    }
    function stampNode(bits) {
      var el = document.createElement('span');
      el.className = 'gb-stamp';
      el.setAttribute('aria-label', 'a pixel stamp');
      for (var i = 0; i < 64; i++) {
        var d = document.createElement('i');
        if (bits.charAt(i) === '1') d.className = 'on';
        el.appendChild(d);
      }
      return el;
    }

    /* ---- storage, defensively ---------------------------------------
       Two rules: never silently drop a signature, and never tell someone
       their entry was saved when it wasn't. */
    function ok(en) {
      return en && typeof en.name === 'string' && typeof en.msg === 'string' && en.name && en.msg;
    }
    function load() {
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { return []; }
      if (!raw) return [];
      try {
        var arr = JSON.parse(raw);
        if (Object.prototype.toString.call(arr) !== '[object Array]') throw 0;
        return arr.filter(ok);
      } catch (e) {
        /* unreadable - park it under a second key instead of overwriting it,
           so a bad parse can never be what destroys the book */
        try { localStorage.setItem(KEY + '_broken', raw); } catch (e2) {}
        return [];
      }
    }
    /* writes, then reads back, and says whether it actually stuck */
    function store(arr) {
      var json = JSON.stringify(arr.slice(0, 200));
      try {
        localStorage.setItem(KEY, json);
        return localStorage.getItem(KEY) === json;
      } catch (e) { return false; }
    }
    function fmt(ts) {
      var d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
             ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    function render() {
      var mine = load();
      var arr = mine.concat(HOUSE);
      list.textContent = '';
      arr.forEach(function (en) {
        var card = document.createElement('div');
        card.className = 'gb-entry' + (en.host ? ' host' : '');
        var meta = document.createElement('div'); meta.className = 'gb-meta';
        var who = document.createElement('span'); who.className = 'gb-who'; who.textContent = en.name;
        var ico = document.createElement('span'); ico.className = 'gb-mood-ico'; ico.textContent = en.mood || '';
        var date = document.createElement('span'); date.className = 'gb-date'; date.textContent = fmt(en.ts);
        meta.appendChild(who); meta.appendChild(ico);
        if (typeof en.stamp === 'string' && /^[01]{64}$/.test(en.stamp)) meta.appendChild(stampNode(en.stamp));
        meta.appendChild(date);
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
      var msg = msgI.value.trim().slice(0, 280);
      if (!name || !msg) return;
      var arr = load();
      var entry = { name: name, mood: moodI.value, msg: msg, ts: Date.now() };
      var stamp = padValue();
      if (stamp) entry.stamp = stamp;
      arr.unshift(entry);

      if (!store(arr)) {
        /* the write bounced (private window, storage full, storage off).
           Leave every word where they typed it and say so - emptying the
           form here is what used to make a signature vanish on reload. */
        if (warn) {
          warn.hidden = false;
          warn.textContent = "your browser wouldn't let me save that - " +
            'storage is off or full, so the book can\'t keep it. your words are still in the box.';
        }
        return;
      }
      if (warn) warn.hidden = true;
      render();
      nameI.value = ''; msgI.value = ''; updateLeft(); nameI.focus();
      padCells.forEach(function (c) { c.classList.remove('on'); });
    });

    render();
  }
})();
