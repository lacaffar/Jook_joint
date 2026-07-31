/* =====================================================================
   coucy.js - climbing the donjon.
   One storey per click, bottom to top. Each floor lights as you reach
   it and tells you what it was for.
   ===================================================================== */
(function () {
  'use strict';

  var tower = document.querySelector('#tower');
  var note = document.querySelector('#climb-note');
  var btn = document.querySelector('#climb');
  if (!tower || !btn || !note) return;

  var FLOORS = [
    'The cellar. Cut into the rock, reached by a single stair, and stocked for a siege ' +
    'that was expected to be long rather than violent.',

    'First hall. Twenty metres across, vaulted, with a hooded fireplace big enough to ' +
    'stand inside. This is where the lord of Coucy received people who wanted something.',

    'Second hall. The same span again, stacked directly overhead. The walls carry it ' +
    'without a single internal pier — the whole trick of the building is that there is ' +
    'nothing in the middle of the room.',

    'Third hall. Windows at last, and arrow loops set in embrasures deep enough to ' +
    'sleep in. From here the garrison could see the Ailette valley for miles.',

    'The roof, 55 metres up. Nothing in medieval Europe was taller by this measure. ' +
    'Enguerrand III was not a king, a prince, a duke or a count — and he built this ' +
    'anyway, which was rather the point.'
  ];

  var storeys = tower.querySelectorAll('.storey');
  var at = -1;

  btn.addEventListener('click', function () {
    if (at >= FLOORS.length - 1) return;
    at++;
    if (storeys[at]) storeys[at].classList.add('lit');
    note.textContent = FLOORS[at];
    if (window.SFX && SFX.step) SFX.step();
    if (at === FLOORS.length - 1) {
      btn.disabled = true;
      btn.textContent = 'top of the tower';
    } else {
      btn.textContent = 'keep climbing';
    }
  });
})();
