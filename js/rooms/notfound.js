/* =====================================================================
   notfound.js - 404. The raccoon stashed some doors in his trash can.

   Click the can, a door falls out. Keep clicking and the owner turns up.
   Nothing here touches the quest - you can't farm caps out of the bins.
   ===================================================================== */
(function () {
  'use strict';

  var can   = document.getElementById('lost-can');
  var out   = document.getElementById('lost-msg');
  var slot  = document.getElementById('lost-slot');
  var count = document.getElementById('lost-count');
  var addr  = document.getElementById('lost-addr');
  if (!can || !out || !slot) return;

  /* ---- the door number you asked for ---------------------------------
     GitHub Pages serves this file but leaves the address bar on the path
     that missed, so we can just read it back to them. */
  if (addr) {
    var asked = '';
    try { asked = decodeURIComponent(location.pathname + location.search); } catch (e) { asked = location.pathname; }
    if (asked && asked !== '/' && asked.indexOf('404.html') < 0) {
      addr.textContent = 'you knocked on ';
      var b = document.createElement('b');
      b.textContent = asked;
      addr.appendChild(b);
      addr.hidden = false;
    }
  }

  /* ---- what's in the can ---------------------------------------------
     Rooms anyone is allowed to find. The back room and the essays are
     earned, so they are not in here. */
  var DOORS = [
    ['fnaf.html',      'a night shift schedule falls out', 'the office'],
    ['stardew.html',   'a parsnip rolls out',              'the farm'],
    ['undertale.html', 'a save point tumbles out',         'the encounter'],
    ['fencing.html',   'a stolen glove flops out',         'the piste'],
    ['hamilton.html',  'a dusty quill drops out',          'weehawken'],
    ['medieval.html',  'a ring of iron keys clatters out', 'the keep'],
    ['coucy.html',     'a chunk of French limestone thuds out', 'the donjon'],
    ['guestbook.html', 'a chewed pen falls out',           'the guestbook'],
    ['index.html',     'a beer mat spins out',             'the bar']
  ];

  /* flavour that escalates the longer you go through his things */
  var NAG = [
    '', '', '',
    'something in here is sticky.',
    'this can is deeper than it looks.',
    'you are now elbow-deep in a raccoon\'s belongings.',
    'he is going to remember this.'
  ];

  var JUNK = ['*', '~', '?', '!', 'x', 'o'];

  var digs = 0, last = -1, racOut = false;

  function fly() {
    /* a couple of bits of nonsense puff out of the lid */
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.className = 'lost-fly';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = JUNK[(Math.random() * JUNK.length) | 0];
      s.style.left = (38 + Math.random() * 24) + '%';
      s.style.top = '0px';
      s.style.setProperty('--dx', (Math.random() * 70 - 35) + 'px');
      s.style.setProperty('--rot', (Math.random() * 120 - 60) + 'deg');
      s.style.animationDelay = (i * 60) + 'ms';
      slot.appendChild(s);
      (function (el) { setTimeout(function () { el.remove(); }, 1100); })(s);
    }
  }

  function say(text) {
    out.textContent = text;
  }

  can.addEventListener('click', function () {
    digs++;
    if (count) count.textContent = digs === 1 ? '1 RUMMAGE' : digs + ' RUMMAGES';

    can.classList.add('open');
    can.classList.remove('dig'); void can.offsetWidth; can.classList.add('dig');
    setTimeout(function () { can.classList.remove('open'); }, 420);
    fly();

    /* dig enough and the owner objects in person */
    if (digs >= 3 && !racOut && Math.random() < 0.4 && window.RaccoonSVG) {
      racOut = true;
      var pop = document.createElement('button');
      pop.type = 'button';
      pop.className = 'lost-rac';
      pop.setAttribute('aria-label', 'a very indignant raccoon');
      pop.innerHTML = window.RaccoonSVG;
      say('* THE OWNER OF THE TRASH HAS OPINIONS. ');
      out.appendChild(pop);
      if (window.SFX) SFX.deny();
      pop.addEventListener('click', function (ev) {
        ev.stopPropagation();
        say('* bonk. he respects you slightly more now. carry on.');
        if (window.SFX) SFX.cap();
        racOut = false;
      });
      /* he leaves on his own if you don't bonk him - and either way the
         flag has to clear, or he only ever turns up once */
      setTimeout(function () {
        if (pop.isConnected) pop.remove();
        racOut = false;
      }, 2600);
      return;
    }

    /* never hand out the same door twice running */
    var i = (Math.random() * DOORS.length) | 0;
    if (DOORS.length > 1) while (i === last) i = (Math.random() * DOORS.length) | 0;
    last = i;
    var d = DOORS[i];

    say(d[1] + ' — ');
    var a = document.createElement('a');
    a.href = d[0];
    a.textContent = d[2];
    out.appendChild(a);

    var nag = NAG[Math.min(digs, NAG.length - 1)];
    if (nag) {
      var small = document.createElement('span');
      small.className = 'muted';
      small.textContent = '  ' + nag;
      out.appendChild(small);
    }

    if (window.SFX) SFX.step();
  });
})();
