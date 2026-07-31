/* =====================================================================
   medieval.js - the curtain wall.
   Five gates are struck off the list and one is not. Rattling a sealed
   gate should feel like rattling a sealed gate, so it does.
   ===================================================================== */
(function () {
  'use strict';

  var wall = document.querySelector('#curtain');
  var word = document.querySelector('#gate-word');
  if (!wall) return;

  var SEALED = [
    'sealed. the garrison went home eight hundred years ago.',
    'barred from the inside. someone did not want visitors.',
    'the portcullis is down and the winch is rust.',
    'no. try the one that is still lit.',
    'locked. the key is in a museum, in a drawer, in a box.'
  ];
  var n = 0;

  function rattle(gate) {
    gate.classList.remove('rattle'); void gate.offsetWidth; gate.classList.add('rattle');
    if (window.SFX && SFX.deny) SFX.deny();
    if (word) word.textContent = SEALED[n++ % SEALED.length];
  }

  wall.addEventListener('click', function (ev) {
    var gate = ev.target.closest ? ev.target.closest('.enter.shut') : null;
    if (gate) rattle(gate);
  });
  /* the sealed gates carry role="button", so honour the keyboard too */
  wall.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var gate = ev.target.classList && ev.target.classList.contains('shut') ? ev.target : null;
    if (gate) { ev.preventDefault(); rattle(gate); }
  });
})();
