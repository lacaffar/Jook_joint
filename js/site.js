/* =====================================================================
   site.js - shared behaviour for Swifty's Jook Joint.
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

      var tag = document.createElement('span');
      tag.className = 'tag' + (live ? ' blink' : '');
      tag.textContent = live ? '··' : (s.state === 'down' ? 'DOWN' : 'OK');

      var svc = document.createElement(s.url ? 'a' : 'span');
      svc.className = 'svc';
      svc.textContent = s.svc;
      if (s.url) { svc.href = s.url; svc.target = '_blank'; svc.rel = 'noopener'; }

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
    { title: 'Once Upon a Time - Toby Fox',          src: 'audio/01-once-upon-a-time.mp3' },
    { title: 'Start Menu - Toby Fox',                src: 'audio/02-start-menu.mp3' },
    { title: 'Your Best Friend - Toby Fox',          src: 'audio/03-your-best-friend.mp3' },
    { title: 'Fallen Down - Toby Fox',               src: 'audio/04-fallen-down.mp3' },
    { title: 'Determination - Toby Fox',             src: 'audio/11-determination.mp3' },
    { title: 'Snowy - Toby Fox',                     src: 'audio/17-snowy.mp3' },
    { title: 'Snowdin Town - Toby Fox',              src: 'audio/22-snowdin-town.mp3' },
    { title: 'Shop - Toby Fox',                      src: 'audio/23-shop.mp3' },
    { title: 'Undertale - Toby Fox',                 src: 'audio/71-undertale.mp3' },
    { title: 'Fallen Down (Reprise) - Toby Fox',     src: 'audio/85-fallen-down-reprise.mp3' },
    { title: 'Battle Against a True Hero - Toby Fox', src: 'audio/98-battle-against-a-true-hero.mp3' }
  ];

  var track = document.querySelector('#nowplaying .track');
  var jukeBtn = document.querySelector('#jukebox-btn');
  var audio = new Audio();
  audio.volume = 0.4;
  var trackIdx = 0;
  var playing = false;

  function updateTicker() {
    if (!track) return;
    track.style.opacity = 0;
    setTimeout(function () {
      track.textContent = TRACKS[trackIdx].title;
      track.style.opacity = 1;
    }, 250);
  }

  if (track) {
    track.textContent = TRACKS[0].title;
    track.style.transition = 'opacity .25s';
  }

  audio.addEventListener('ended', function () {
    trackIdx = (trackIdx + 1) % TRACKS.length;
    audio.src = TRACKS[trackIdx].src;
    audio.play().catch(function () {});
    updateTicker();
  });

  audio.addEventListener('error', function () {
    trackIdx = (trackIdx + 1) % TRACKS.length;
    updateTicker();
    if (playing) {
      audio.src = TRACKS[trackIdx].src;
      audio.play().catch(function () {});
    }
  });

  if (jukeBtn) {
    jukeBtn.addEventListener('click', function () {
      if (!playing) {
        audio.src = TRACKS[trackIdx].src;
        audio.play().catch(function () {});
        jukeBtn.textContent = '⏸ jukebox';
        jukeBtn.classList.add('playing');
        playing = true;
      } else {
        audio.pause();
        jukeBtn.textContent = '🎵 jukebox';
        jukeBtn.classList.remove('playing');
        playing = false;
      }
    });
  }

  // ticker rotation even when not playing audio
  if (track) {
    setInterval(function () {
      if (!playing) {
        trackIdx = (trackIdx + 1) % TRACKS.length;
        updateTicker();
      }
    }, 4200);
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
    var msgI  = document.querySelector('#gb-msg');
    var left  = document.querySelector('#gb-left');
    var countEl = document.querySelector('#gb-count');

    // the raccoon's paw, as an 8x8 stamp
    var PAW = '01100110' + '01100110' + '00000000' + '00111100' +
              '01111110' + '01111110' + '00111100' + '00000000';

    // starter entries (only shown until the visitor saves their own)
    var seed = [
      { name: 'Swifty', mood: '🎷', host: true, ts: Date.now() - 864e5 * 3,
        msg: 'welcome to the joint! pull up a stool and say hi.' },
      { name: 'the raccoon', mood: '🦝', ts: Date.now() - 36e5 * 5, stamp: PAW,
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
      var msg  = msgI.value.trim().slice(0, 280);
      if (!name || !msg) return;
      var arr = load();
      var entry = { name: name, mood: moodI.value, msg: msg, ts: Date.now() };
      var stamp = padValue();
      if (stamp) entry.stamp = stamp;
      arr.unshift(entry);
      store(arr); render();
      nameI.value = ''; msgI.value = ''; updateLeft(); nameI.focus();
      padCells.forEach(function (c) { c.classList.remove('on'); });
    });

    render();
  }
})();
