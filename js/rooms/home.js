/* =====================================================================
   home.js - the bar itself.
   Hotspots in the scene (jukebox, tip jar, light switch, trash can),
   the secret sixth door, and a certain 30-year-old cheat code.
   ===================================================================== */
(function () {
  'use strict';

  var scene = document.querySelector('#bar-scene');
  if (!scene) return;

  /* ---- secret door unlocks with all five caps ------------------------ */
  function refreshBackDoor() {
    var open = window.SJJQuest && SJJQuest.all();
    scene.classList.toggle('all-caps', !!open);
    var d = document.querySelector('.door-backroom');
    if (d) {
      d.setAttribute('aria-hidden', open ? 'false' : 'true');
      d.tabIndex = open ? 0 : -1;
    }
  }
  refreshBackDoor();
  window.addEventListener('sjj:caps', refreshBackDoor);

  /* ---- scene jukebox pipes to the real jukebox button ---------------- */
  var juke = document.querySelector('#scene-jukebox');
  if (juke) juke.addEventListener('click', function () {
    var real = document.querySelector('#jukebox-btn');
    if (real) real.click();
    juke.classList.toggle('spinning');
  });

  /* ---- tip jar -------------------------------------------------------- */
  var jar = document.querySelector('#tip-jar');
  if (jar) {
    var tips = 0;
    try { tips = parseInt(localStorage.getItem('sjj_tipjar') || '0', 10) || 0; } catch (e) {}
    var label = function () {
      jar.title = tips === 0 ? 'the tip jar. it is empty. it dreams.' :
        'the tip jar: ' + tips + ' imaginary coin' + (tips === 1 ? '' : 's') + '. thank you.';
    };
    label();
    jar.addEventListener('click', function () {
      tips++;
      try { localStorage.setItem('sjj_tipjar', String(tips)); } catch (e) {}
      label();
      if (window.SFX) SFX.coin();
      var f = document.createElement('span');
      f.className = 'coin-float';
      f.textContent = '+1🪙';
      jar.appendChild(f);
      setTimeout(function () { f.remove(); }, 900);
      jar.classList.remove('clink'); void jar.offsetWidth; jar.classList.add('clink');
    });
  }

  /* ---- light switch ----------------------------------------------------- */
  var sw = document.querySelector('#light-switch');
  function setLights(off) {
    document.body.classList.toggle('lights-off', off);
    if (sw) {
      sw.textContent = off ? '⭘' : '⏻';
      sw.setAttribute('aria-pressed', String(off));
      sw.title = off ? 'lights are OFF. the neon likes it. turn them back on?' : 'the light switch. best viewed at night, they said.';
    }
    try { localStorage.setItem('sjj_lights', off ? '1' : '0'); } catch (e) {}
  }
  var lightsOff = false;
  try { lightsOff = localStorage.getItem('sjj_lights') === '1'; } catch (e) {}
  setLights(lightsOff);
  if (sw) sw.addEventListener('click', function () {
    setLights(!document.body.classList.contains('lights-off'));
    if (window.SFX) SFX.click();
  });

  /* ---- trash can (his) --------------------------------------------------- */
  var trash = document.querySelector('#trash-can');
  if (trash) {
    var pokes = 0;
    var bubble = document.createElement('div');
    bubble.className = 'rac-speech';
    document.body.appendChild(bubble);
    trash.addEventListener('click', function () {
      pokes++;
      trash.classList.remove('shake'); void trash.offsetWidth; trash.classList.add('shake');
      if (window.SFX) SFX.step();
      var r = trash.getBoundingClientRect();
      bubble.style.left = (r.left + r.width / 2) + 'px';
      bubble.style.top = (r.top - 4) + 'px';
      bubble.textContent = pokes < 5 ? ['*rustle*', 'mine.', '*hiss*', 'do NOT'][pokes % 4] : 'FINE. take a cap hunt hint: play every room.';
      bubble.classList.add('show');
      setTimeout(function () { bubble.classList.remove('show'); }, 2000);
      if (pokes === 5 && window.RaccoonSVG) {
        var pop = document.createElement('div');
        pop.className = 'trash-raccoon';
        pop.innerHTML = window.RaccoonSVG;
        trash.appendChild(pop);
        if (window.SFX) SFX.deny();
        setTimeout(function () { pop.remove(); pokes = 0; }, 2400);
      }
    });
  }

  /* ---- ↑↑↓↓←→←→BA ---------------------------------------------------------- */
  var CODE = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  var pos = 0;
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    pos = (k === CODE[pos]) ? pos + 1 : (k === CODE[0] ? 1 : 0);
    if (pos === CODE.length) { pos = 0; party(); }
  });
  function party() {
    if (!window.RaccoonSVG) return;
    if (window.SFX) SFX.chime();
    if (window.SJJQuest) SJJQuest.toast('🦝🦝🦝 THE RACCOONS HEARD THE CODE 🦝🦝🦝');
    for (var i = 0; i < 12; i++) {
      (function (i) {
        setTimeout(function () {
          var r = document.createElement('div');
          r.className = 'rac-party';
          r.innerHTML = window.RaccoonSVG;
          r.style.top = (8 + Math.random() * 80) + 'vh';
          var dur = 2.2 + Math.random() * 2.8;
          r.style.animationDuration = dur + 's';
          if (Math.random() < 0.5) { r.classList.add('reverse'); }
          document.body.appendChild(r);
          setTimeout(function () { r.remove(); }, dur * 1000 + 200);
        }, i * 260);
      })(i);
    }
  }
})();
