/* =====================================================================
   backroom.js - THE BACK ROOM. Staff only. Raccoon only, really.
   Locked until all five bottle caps are collected. Inside: the
   Honorary Trash Panda certificate, the credits, and your stats.
   ===================================================================== */
(function () {
  'use strict';

  var locked = document.querySelector('#br-locked');
  var den = document.querySelector('#br-den');
  if (!locked || !den) return;

  /* the den mascot uses the shared sprite once raccoon.js has run */
  var mascot = document.querySelector('#br-rac');
  if (mascot && window.RaccoonSVG) mascot.innerHTML = window.RaccoonSVG;

  var open = window.SJJQuest && SJJQuest.all();

  /* ---- locked door: show which caps are missing ----------------------- */
  if (!open) {
    locked.hidden = false;
    den.hidden = true;
    var holes = document.querySelector('#br-keyholes');
    SJJQuest.rooms.forEach(function (r) {
      var k = document.createElement('a');
      k.className = 'br-keyhole' + (SJJQuest.has(r.id) ? ' filled' : '');
      k.href = r.id + '.html';
      k.title = SJJQuest.has(r.id) ? r.name + ' cap: slotted in' : 'missing the ' + r.name + ' cap - win the game in that room';
      k.textContent = SJJQuest.has(r.id) ? r.cap : '○';
      holes.appendChild(k);
    });
    return;
  }

  locked.hidden = true;
  den.hidden = false;
  if (window.SFX) setTimeout(function () { SFX.chime(); }, 400);

  /* ---- confetti on entry ------------------------------------------------ */
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function confetti() {
    if (REDUCED) return;
    var bits = ['🎉', '✦', '🦝', '◍', '✶', '♥'];
    for (var i = 0; i < 26; i++) {
      var s = document.createElement('span');
      s.className = 'br-confetti';
      s.textContent = bits[(Math.random() * bits.length) | 0];
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.animationDelay = (Math.random() * 1.2) + 's';
      s.style.animationDuration = (2.2 + Math.random() * 2) + 's';
      document.body.appendChild(s);
      setTimeout(function (el) { return function () { el.remove(); }; }(s), 5500);
    }
  }
  confetti();

  /* ---- stats ------------------------------------------------------------- */
  function lsInt(k) { try { return parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) { return 0; } }
  function lsJson(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  var farm = lsJson('sjj_stardew') || {};
  var stats = [
    ['🐻 highest FNAF night unlocked', Math.max(1, lsInt('sjj_fnaf_night'))],
    ['🤺 fastest touch', lsInt('sjj_fencing_best') ? lsInt('sjj_fencing_best') + 'ms' : '—'],
    ['🎩 best duel of wits', lsInt('sjj_hamilton_best') ? lsInt('sjj_hamilton_best') + '/10' : '—'],
    ['🥕 parsnips harvested', farm.harvested || 0],
    ['💰 farm gold', (farm.gold || 0) + 'g'],
    ['🪙 tips in the jar', lsInt('sjj_tipjar')],
    ['👣 your visits', lsInt('sjj_hits')]
  ];
  var statsEl = document.querySelector('#br-stats');
  stats.forEach(function (s) {
    var li = document.createElement('li');
    var b = document.createElement('b'); b.textContent = s[1];
    li.textContent = s[0] + ': ';
    li.appendChild(b);
    statsEl.appendChild(li);
  });

  /* ---- certificate --------------------------------------------------------- */
  var nameInput = document.querySelector('#br-name');
  var certName = document.querySelector('#br-cert-name');
  var certDate = document.querySelector('#br-cert-date');
  certDate.textContent = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  nameInput.addEventListener('input', function () {
    certName.textContent = nameInput.value.trim() || 'A FRIEND OF THE RACCOON';
  });

  document.querySelector('#br-download').addEventListener('click', function () {
    var W = 900, H = 640;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    g.fillStyle = '#14110f'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ffb347'; g.lineWidth = 6; g.strokeRect(18, 18, W - 36, H - 36);
    g.strokeStyle = '#ff5d8f'; g.lineWidth = 2; g.strokeRect(30, 30, W - 60, H - 60);
    g.textAlign = 'center';
    g.fillStyle = '#9c9082'; g.font = '22px Georgia';
    g.fillText("SWIFTY'S JOOK JOINT — OFFICE OF THE RACCOON", W / 2, 92);
    g.fillStyle = '#ffb347'; g.font = 'bold 52px Georgia';
    g.fillText('HONORARY TRASH PANDA', W / 2, 170);
    g.font = '90px serif';
    g.fillText('🦝', W / 2, 280);
    g.fillStyle = '#ece3d6'; g.font = '24px Georgia';
    g.fillText('this certifies that', W / 2, 340);
    g.fillStyle = '#ff5d8f'; g.font = 'bold 44px Georgia';
    g.fillText(certName.textContent.toUpperCase(), W / 2, 400);
    g.fillStyle = '#ece3d6'; g.font = '22px Georgia';
    g.fillText('survived the night shift, farmed nine parsnips, spared the raccoon,', W / 2, 450);
    g.fillText('took a bout to five, outwitted Aaron Burr, and collected all five caps.', W / 2, 482);
    g.fillStyle = '#9c9082'; g.font = 'italic 20px Georgia';
    g.fillText(certDate.textContent + ' · pawprint on file', W / 2, 560);
    var a = document.createElement('a');
    a.download = 'honorary-trash-panda.png';
    a.href = c.toDataURL('image/png');
    a.click();
    if (window.SFX) SFX.coin();
  });

  /* ---- reset progress --------------------------------------------------------- */
  document.querySelector('#br-reset').addEventListener('click', function () {
    if (!confirm('Reset ALL progress? Caps, nights, farm, best scores - everything. The raccoon will keep the tips.')) return;
    ['sjj_caps', 'sjj_fnaf_night', 'sjj_fencing_best', 'sjj_hamilton_best', 'sjj_stardew', 'sjj_save']
      .forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    location.href = 'index.html';
  });
})();
