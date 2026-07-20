/* =====================================================================
   notfound.js - 404 page. The raccoon stashed some doors in his trash can.
   ===================================================================== */
(function () {
  'use strict';

  var btn = document.getElementById('lost-trash');
  var out = document.getElementById('lost-msg');
  if (!btn || !out) return;

  var DOORS = [
    ['fnaf.html', 'a night shift schedule falls out - the office'],
    ['stardew.html', 'a parsnip rolls out - the farm'],
    ['undertale.html', 'a save point tumbles out - the encounter'],
    ['fencing.html', 'a stolen glove flops out - the piste'],
    ['hamilton.html', 'a dusty quill drops out - weehawken'],
    ['guestbook.html', 'a pen falls out - the guestbook']
  ];

  var digs = 0, racOut = false;
  btn.addEventListener('click', function () {
    digs++;
    btn.style.transform = 'rotate(' + (Math.random() * 16 - 8) + 'deg)';

    /* dig enough and the owner objects in person */
    if (digs >= 3 && !racOut && Math.random() < 0.4 && window.RaccoonSVG) {
      racOut = true;
      var pop = document.createElement('button');
      pop.type = 'button';
      pop.className = 'lost-rac';
      pop.setAttribute('aria-label', 'a very indignant raccoon');
      pop.innerHTML = window.RaccoonSVG;
      btn.parentElement.insertBefore(pop, btn.nextSibling);
      out.textContent = '* THE OWNER OF THE TRASH HAS OPINIONS.';
      if (window.SFX) SFX.deny();
      pop.addEventListener('click', function () {
        out.textContent = '* bonk. he respects you slightly more now. carry on.';
        if (window.SFX) SFX.cap();
        pop.remove();
      });
      setTimeout(function () { if (pop.isConnected) pop.remove(); racOut = false; }, 2600);
      return;
    }

    var d = DOORS[(Math.random() * DOORS.length) | 0];
    out.textContent = '';
    var a = document.createElement('a');
    a.href = d[0];
    a.textContent = d[1];
    out.appendChild(a);
    if (window.SFX) SFX.step();
  });
})();
