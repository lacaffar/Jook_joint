/* =====================================================================
   coucy.js - the great donjon.

   Two things live here:
     1. the climb, one vaulted storey at a time
     2. HOLD THE DONJON - match each way of taking a castle to the piece
        of the building that was put there to stop it.

   Every answer below is a real feature of Coucy doing the job it was
   actually designed for. The last round is 1917, where none of it helps,
   which is the whole point of the last round.
   ===================================================================== */
(function () {
  'use strict';

  /* ---- the climb --------------------------------------------------------- */
  var tower = document.querySelector('#tower');
  var note = document.querySelector('#climb-note');
  var climbBtn = document.querySelector('#climb');

  var FLOORS = [
    'The cellar, cut into the rock. One stair down, and stores for a siege that was ' +
    'expected to be long rather than violent. A well inside the walls meant nobody had ' +
    'to go outside for water.',

    'First hall. Twenty metres across, vaulted, with a hooded fireplace you could stand ' +
    'inside. This is where the lord of Coucy received people who wanted something from ' +
    'the lord of Coucy.',

    'Second hall. The same clear span again, stacked straight on top, and still nothing ' +
    'holding up the middle. The ribs carry the load out into seven and a half metres of ' +
    'wall. The eye in the centre of the vault is for hauling.',

    'Third hall. Windows, at last, and arrow loops set in embrasures deep enough to ' +
    'sleep in. From here the garrison watched the Ailette valley for miles in every ' +
    'direction.',

    'The roof, 55 metres up, behind timber hoarding that overhangs the wall. Nothing in ' +
    'medieval Europe was taller by this measure. Enguerrand III was not a king, a ' +
    'prince, a duke or a count, and he built this anyway.'
  ];

  if (tower && climbBtn && note) {
    var storeys = tower.querySelectorAll('.storey');
    var at = -1;
    climbBtn.addEventListener('click', function () {
      if (at >= FLOORS.length - 1) return;
      at++;
      if (storeys[at]) storeys[at].classList.add('lit');
      note.textContent = FLOORS[at];
      if (window.SFX && SFX.step) SFX.step();
      if (at === FLOORS.length - 1) {
        climbBtn.disabled = true;
        climbBtn.textContent = 'top of the tower';
      } else {
        climbBtn.textContent = 'keep climbing';
      }
    });
  }

  /* ---- HOLD THE DONJON ---------------------------------------------------- */
  var siege = document.querySelector('#siege');
  if (!siege) return;

  var elRound = document.querySelector('#siege-round');
  var elLife = document.querySelector('#siege-life');
  var elYear = document.querySelector('#siege-year');
  var elAttack = document.querySelector('#siege-attack');
  var elOpts = document.querySelector('#siege-opts');
  var elVerdict = document.querySelector('#siege-verdict');
  var elStart = document.querySelector('#siege-start');

  var ROUNDS = [
    {
      year: 'any year you like',
      attack: 'Ladders come out of the treeline and go up against the curtain wall. ' +
              'Men are climbing, and your archers on the parapet cannot lean out far ' +
              'enough to shoot straight down without being shot themselves.',
      opts: ['the hoarding', 'the ditch', 'the oculus', 'the great hall'],
      right: 0,
      why: 'Timber hoarding, built out over the wall-head on beams socketed into the ' +
           'masonry, puts the defenders OUTSIDE the wall line with a floor they can ' +
           'drop things through. The base of the wall stops being a blind spot. The ' +
           'sockets for Coucy’s hoarding are still visible in the surviving stonework.',
      wrong: 'The escalade succeeds at the one place your archers cannot see: the foot ' +
             'of your own wall.'
    },
    {
      year: 'a bad morning',
      attack: 'The bailey is lost. A ram under a roof of green hides is being walked ' +
              'up to the door of the keep itself, and the door is the one part of a ' +
              'tower that is not seven metres of stone.',
      opts: ['thicker doors', 'a door nine metres up, and a bridge you can pull away',
             'more archers', 'a portcullis'],
      right: 1,
      why: 'The donjon’s only entrance was at first-floor level, reached across a ' +
           'removable bridge over its own ditch. A ram needs to reach the door on ' +
           'level ground. Take away the bridge and there is no ground to reach it ' +
           'from — the ram is standing in a hole looking up.',
      wrong: 'The ram reaches the timber and the timber does what timber does.'
    },
    {
      year: 'week six',
      attack: 'No assault today. Instead there is a spoil heap that keeps growing, and ' +
              'a faint knocking underground. They are driving a gallery beneath your ' +
              'wall, propping it with timber as they go, and when it is long enough ' +
              'they will burn the props and let the wall fall into the hole.',
      opts: ['sally out and fill in the ditch', 'the talus, and the rock beneath it',
             'raise the wall higher', 'flood the cellar'],
      right: 1,
      why: 'Two answers at once. Coucy is founded on the rock of the spur, and rock is ' +
           'miserable to mine through. Where masonry meets ground the wall spreads into ' +
           'a battered plinth — a talus — which thickens exactly the zone a sapper wants ' +
           'to reach and makes the wall above harder to topple even if he gets there. ' +
           'Mining is the reason medieval towers went round and went thick at the bottom.',
      wrong: 'The props burn through in the night and a length of wall sits down into ' +
             'the gallery.'
    },
    {
      year: 'the siege train arrives',
      attack: 'Counterweight trebuchets are being assembled out of bowshot. They will ' +
              'throw stones of a hundred kilos and more, all day, at one aiming point ' +
              'until something gives.',
      opts: ['the round plan', 'the drawbridge', 'the spiral stair', 'the chemise'],
      right: 0,
      why: 'A square tower gives a trebuchet a corner, and a corner is two thin walls ' +
           'meeting at the weakest possible geometry — crack it and both faces peel. A ' +
           'cylinder has no corner. Every shot strikes a curve and glances, and the ' +
           'force spreads into a ring instead of splitting an angle. Coucy is round for ' +
           'the same reason a barrel is, and 7.5 metres thick besides.',
      wrong: 'They find an angle, work it for three days, and bring down two faces at once.'
    },
    {
      year: 'month four',
      attack: 'They have stopped attacking altogether. The lines are dug, the roads are ' +
              'held, and they are simply going to sit there until the keep gets hungry ' +
              'or thirsty enough to open the door itself.',
      opts: ['the arrow loops', 'the well and the vaulted cellars',
             'the hoarding', 'the corner towers'],
      right: 1,
      why: 'Almost every siege in this period is decided by supply rather than assault. ' +
           'A keep meant to outlast a blockade needs water inside the walls and dry ' +
           'vaulted storage beneath them, and Coucy had both. The cellar is cut into ' +
           'the rock, which keeps grain and keeps it cool.',
      wrong: 'The water runs short first. It always does.'
    },
    {
      year: 'the worst case',
      attack: 'The town has fallen. The castle has fallen. Enemy banners are up on all ' +
              'four corner towers and there are men in the bailey, fifty metres from ' +
              'the foot of the keep.',
      opts: ['surrender on terms', 'the chemise — the donjon’s own wall and ditch',
             'burn the bailey', 'the third hall'],
      right: 1,
      why: 'This is the feature that makes Coucy strange. The donjon is not part of the ' +
           'castle’s defences — it is ringed by its own ditch and its own curtain, the ' +
           'chemise, and it is provisioned separately. Losing the castle does not lose ' +
           'the keep. The attacker has to begin the whole siege again, from inside a ' +
           'courtyard, overlooked by 55 metres of wall.',
      wrong: 'Without its own ring, the keep is just the last room of a building that ' +
             'has already been taken.'
    }
  ];

  var FINALE = {
    year: '27 March 1917',
    attack: 'No ladders. No mine, no trebuchet, no blockade. A withdrawing army has ' +
            'brought a railway up the valley, and engineers have spent days packing ' +
            'roughly twenty-eight tonnes of explosive into the base of the tower. ' +
            'The line is already moving away from here. Nobody is even attacking you.',
    opts: ['the hoarding', 'the talus and the rock', 'the round plan',
           'the chemise'],
    why: 'None of it applies. Every feature in this building answers a way of taking a ' +
         'castle that a person could actually do in 1225, and each of them worked for ' +
         'nearly seven hundred years. What finally brought the donjon of Coucy down was ' +
         'not a siege at all. It was chemistry, applied by people who were leaving.'
  };

  var LIVES = 3;
  var idx = -1, lives = LIVES, answered = false;

  function drawLives() {
    var s = '';
    for (var i = 0; i < LIVES; i++) s += i < lives ? '■' : '□';
    elLife.textContent = s;
    elLife.className = 'siege-life' + (lives <= 1 ? ' low' : '');
  }

  function clearOpts() { elOpts.textContent = ''; }

  function show(round, n, total) {
    answered = false;
    elRound.textContent = n + ' of ' + total;
    elYear.textContent = round.year;
    elAttack.textContent = round.attack;
    elVerdict.textContent = '';
    elVerdict.className = 'siege-verdict';
    clearOpts();
    round.opts.forEach(function (label, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'siege-opt';
      b.textContent = label;
      b.addEventListener('click', function () { answer(round, i, b); });
      elOpts.appendChild(b);
    });
    elStart.hidden = true;
  }

  function lockOpts(rightIdx) {
    Array.prototype.forEach.call(elOpts.children, function (b, i) {
      b.disabled = true;
      if (rightIdx !== null && i === rightIdx) b.classList.add('right');
    });
  }

  function answer(round, choice, btn) {
    if (answered) return;
    answered = true;

    /* the finale has no right answer, and is not scored */
    if (round === FINALE) {
      lockOpts(null);
      btn.classList.add('futile');
      elVerdict.className = 'siege-verdict futile';
      elVerdict.textContent = round.why;
      if (window.SFX && SFX.buzz) SFX.buzz();
      elStart.hidden = false;
      elStart.textContent = 'stand in the ruin';
      elStart.onclick = win;
      return;
    }

    var ok = choice === round.right;
    lockOpts(round.right);
    if (!ok) {
      btn.classList.add('wrong');
      lives--;
      drawLives();
      if (window.SFX && SFX.deny) SFX.deny();
    } else if (window.SFX && SFX.parry) SFX.parry();

    elVerdict.className = 'siege-verdict ' + (ok ? 'good' : 'bad');
    elVerdict.textContent = (ok ? 'Held. ' : round.wrong + ' ') + round.why;

    elStart.hidden = false;
    if (lives <= 0) {
      elStart.textContent = 'the keep falls — try again';
      elStart.onclick = start;
    } else {
      elStart.textContent = idx >= ROUNDS.length - 1 ? 'and then, much later…' : 'next assault';
      elStart.onclick = next;
    }
  }

  function next() {
    idx++;
    if (idx < ROUNDS.length) return show(ROUNDS[idx], idx + 1, ROUNDS.length + 1);
    show(FINALE, ROUNDS.length + 1, ROUNDS.length + 1);
  }

  function win() {
    elRound.textContent = 'the siege is over';
    elYear.textContent = 'six hundred and ninety-two years';
    elAttack.textContent =
      'You held Coucy against every method anyone had. That is not a consolation ' +
      'prize — it is the actual record of the building. The raccoon, who has strong ' +
      'opinions about people who wreck perfectly good dens, leaves you something.';
    clearOpts();
    elVerdict.textContent = '';
    elStart.hidden = false;
    elStart.textContent = 'hold it again';
    elStart.onclick = start;
    if (window.SJJQuest) SJJQuest.award('coucy');
  }

  function start() {
    idx = -1; lives = LIVES;
    drawLives();
    next();
  }

  /* the button is re-pointed as the siege goes on, so it owns exactly one
     handler and answer()/win() decide what it does next */
  drawLives();
  elStart.onclick = start;
})();
