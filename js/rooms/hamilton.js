/* =====================================================================
   hamilton.js - THE DUEL OF WITS.
   Ten questions at dawn in Weehawken. Every wrong answer, Burr takes a
   pace closer. Survive all ten and the raccoon parts with a bottle cap.
   ===================================================================== */
(function () {
  'use strict';

  var stage = document.querySelector('#duel');
  if (!stage) return;

  /* ---- question bank: q, c[4] choices, a = right index, f = footnote */
  var BANK = [
    { q: 'Where was Alexander Hamilton born?',
      c: ['New York City', 'The island of Nevis', 'Virginia', 'Boston'], a: 1,
      f: 'Born on Nevis in the British West Indies (1755 or 1757 - even his birth year is a debate).' },
    { q: 'What post did Hamilton hold in Washington’s first cabinet?',
      c: ['Secretary of State', 'Attorney General', 'Secretary of the Treasury', 'Secretary of War'], a: 2,
      f: 'First Secretary of the Treasury - he built the U.S. financial system essentially from scratch.' },
    { q: 'Of the 85 Federalist Papers, how many did Hamilton write?',
      c: ['About 20', 'exactly 42', 'All 85', '51'], a: 3,
      f: '51 of 85 - Madison wrote 29, John Jay wrote 5. "The plan was to write a total of 25 essays…"' },
    { q: 'Who was the third author of the Federalist Papers, with Hamilton and Madison?',
      c: ['John Jay', 'Thomas Jefferson', 'John Adams', 'Gouverneur Morris'], a: 0,
      f: 'John Jay - he got sick after writing five.' },
    { q: 'What did Hamilton admit to in the Reynolds Pamphlet?',
      c: ['Taking bribes', 'An affair with Maria Reynolds', 'Forging Washington’s signature', 'Duelling illegally'], a: 1,
      f: 'He confessed the affair in print to prove he wasn’t corrupt. It worked. It also ruined him.' },
    { q: 'In the deadlocked election of 1800, Hamilton threw his support to…',
      c: ['Aaron Burr', 'John Adams', 'Thomas Jefferson', 'Charles Pinckney'], a: 2,
      f: '"Jefferson has beliefs. Burr has none." That endorsement helped seal the duel.' },
    { q: 'Where did the Hamilton–Burr duel take place?',
      c: ['Weehawken, New Jersey', 'Harlem, New York', 'Trenton, New Jersey', 'Philadelphia'], a: 0,
      f: 'The dueling grounds at Weehawken, NJ - dueling was illegal in New York.' },
    { q: 'In what year did Burr shoot Hamilton?',
      c: ['1799', '1801', '1804', '1812'], a: 2,
      f: 'July 11, 1804. Hamilton died the next day in New York.' },
    { q: 'Hamilton’s eldest son Philip died how?',
      c: ['Yellow fever', 'In a duel, at the same Weehawken grounds', 'At sea', 'In the war of 1812'], a: 1,
      f: 'Philip died in an 1801 duel defending his father’s honor - on the same Weehawken ledge.' },
    { q: 'Which of these did Hamilton found in 1801 (it still runs today)?',
      c: ['The New York Times', 'The Bank of America', 'The New York Post', 'West Point'], a: 2,
      f: 'The New York Evening Post - today’s New York Post. He also founded the Coast Guard’s predecessor.' },
    { q: 'Whom did Hamilton marry in 1780?',
      c: ['Angelica Schuyler', 'Elizabeth Schuyler', 'Maria Reynolds', 'Theodosia Prevost'], a: 1,
      f: 'Eliza Schuyler. She outlived him by 50 years and spent them preserving his legacy.' },
    { q: 'When the duel happened, Burr held what office?',
      c: ['Senator from New York', 'Governor of New York', 'Vice President of the United States', 'None - he was retired'], a: 2,
      f: 'Burr was the sitting Vice President under Jefferson. He was indicted for murder while in office.' },
    { q: 'During the Revolution, Hamilton served as aide-de-camp to…',
      c: ['Lafayette', 'George Washington', 'Nathanael Greene', 'Horatio Gates'], a: 1,
      f: 'Washington’s right-hand man for four years - writing letters, not fighting, to his frustration.' },
    { q: 'At Yorktown, Hamilton personally led a night assault on…',
      c: ['Redoubt 10', 'The British fleet', 'Cornwallis’ headquarters', 'Redoubt 9'], a: 0,
      f: 'He led the bayonet charge on Redoubt 10; the French took Redoubt 9 at the same time.' },
    { q: 'After his death, Eliza Hamilton co-founded…',
      c: ['The Red Cross', 'New York’s first private orphanage', 'The Treasury’s widows fund', 'A university'], a: 1,
      f: 'The Orphan Asylum Society of New York, 1806. "The orphanage" - it still exists as Graham Windham.' },
    { q: 'Hamilton’s face is on which U.S. bill?',
      c: ['$5', '$10', '$20', '$50'], a: 1,
      f: 'The $10 - one of only two non-presidents on U.S. paper money (Franklin’s the other).' },
    /* ---- the show ---- */
    { q: 'Who wrote the music, lyrics, AND book of Hamilton?',
      c: ['Stephen Sondheim', 'Lin-Manuel Miranda', 'Alex Lacamoire', 'Thomas Kail'], a: 1,
      f: 'Lin-Manuel Miranda - he also originated the title role.' },
    { q: 'What sparked the idea for the musical?',
      c: ['A dream', 'Ron Chernow’s Hamilton biography, read on vacation', 'A history podcast', 'A dare from Sondheim'], a: 1,
      f: 'Miranda picked up Chernow’s 800-page biography at an airport and heard hip-hop in it.' },
    { q: 'In 2009, Miranda performed the show’s opening number where?',
      c: ['The Tonys', 'Saturday Night Live', 'The White House', 'The Public Theater'], a: 2,
      f: 'At the White House Poetry Jam - the clip of Obama chuckling is canon now.' },
    { q: 'Who originated Aaron Burr on Broadway?',
      c: ['Leslie Odom Jr.', 'Christopher Jackson', 'Okieriete Onaodowan', 'Daveed Diggs'], a: 0,
      f: 'Leslie Odom Jr., who won the Tony for it - beating Miranda himself.' },
    { q: 'Which two roles does one actor play across the two acts?',
      c: ['Laurens &amp; Philip only', 'Lafayette &amp; Jefferson (and Laurens &amp; Philip, and Mulligan &amp; Madison)', 'Washington &amp; King George', 'Eliza &amp; Maria'], a: 1,
      f: 'The Act 1/Act 2 double-casting is the show’s best trick - Daveed Diggs’ Lafayette/Jefferson most famously.' },
    { q: 'King George’s recurring breakup song is called…',
      c: ['“You’ll Be Back”', '“What Comes Next?”', '“I Know Him”', 'all three - it’s the same tune'], a: 3,
      f: 'Trick question - all three are one melody, and each got shorter as the show went on.' },
    { q: 'How many Tony Awards did Hamilton win in 2016?',
      c: ['7', '9', '11', '13'], a: 2,
      f: '11 wins from a record 16 nominations - one short of The Producers’ record 12.' },
    { q: 'The final song of the show asks…',
      c: ['“What’d I miss?”', '“Who lives, who dies, who tells your story?”', '“Why do you write like you’re running out of time?”', '“Are you Aaron Burr, sir?”'], a: 1,
      f: 'Eliza tells the story. Fifty years of it.' }
  ];

  var QUIZ_LEN = 10;   /* questions per duel                       */
  var START_PACE = 3;  /* Burr starts 3 paces in on a 10-pace field */
  var TRACK = 10;      /* pace where Burr reaches you = bang        */

  var els = {
    intro:  stage.querySelector('.duel-intro'),
    play:   stage.querySelector('.duel-play'),
    end:    stage.querySelector('.duel-end'),
    track:  stage.querySelector('.pace-track'),
    qnum:   stage.querySelector('.duel-qnum'),
    qtext:  stage.querySelector('.duel-q'),
    choices: stage.querySelector('.duel-choices'),
    foot:   stage.querySelector('.duel-foot'),
    next:   stage.querySelector('.duel-next'),
    best:   stage.querySelector('.duel-best'),
    endTitle: stage.querySelector('.duel-end-title'),
    endBody:  stage.querySelector('.duel-end-body')
  };

  var quiz = [], idx = 0, correct = 0, pace = START_PACE, locked = false;

  function show(el) {
    [els.intro, els.play, els.end].forEach(function (s) { if (s) s.hidden = (s !== el); });
  }

  function best() {
    var b = 0;
    try { b = parseInt(localStorage.getItem('sjj_hamilton_best') || '0', 10); } catch (e) {}
    return b;
  }
  function renderBest() {
    if (!els.best) return;
    var b = best();
    els.best.textContent = b > 0 ? 'your legacy: best ' + b + '/' + QUIZ_LEN : 'no legacy yet. history has its eyes on you.';
  }

  /* pace track: you (with quill) at the right, Burr advancing from the left */
  function renderTrack() {
    if (!els.track) return;
    els.track.textContent = '';
    for (var i = 0; i <= TRACK; i++) {
      var cell = document.createElement('span');
      cell.className = 'pace';
      if (i === TRACK) { cell.classList.add('you'); cell.textContent = '🪶'; cell.title = 'you'; }
      else if (i === pace) { cell.classList.add('burr'); cell.textContent = '🕴️'; cell.title = 'Burr - ' + (TRACK - pace) + ' paces away'; }
      else { cell.textContent = '·'; }
      els.track.appendChild(cell);
    }
  }

  function sample() {
    var pool = BANK.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, QUIZ_LEN);
  }

  function decode(s) { /* the bank stores &amp; for readability in one entry */
    return s.replace(/&amp;/g, '&');
  }

  function ask() {
    var Q = quiz[idx];
    locked = false;
    els.qnum.textContent = 'Question ' + (idx + 1) + ' of ' + QUIZ_LEN + ' · ' + (TRACK - pace) + ' paces between you';
    els.qtext.textContent = decode(Q.q);
    els.foot.hidden = true;
    els.next.hidden = true;
    els.choices.textContent = '';
    Q.c.forEach(function (choice, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'duel-choice';
      b.textContent = decode(choice);
      b.addEventListener('click', function () { answer(i, b); });
      els.choices.appendChild(b);
    });
    renderTrack();
  }

  function answer(i, btn) {
    if (locked) return;
    locked = true;
    var Q = quiz[idx];
    var right = (i === Q.a);
    els.choices.querySelectorAll('.duel-choice').forEach(function (b, j) {
      b.disabled = true;
      if (j === Q.a) b.classList.add('right');
    });
    if (right) {
      correct++;
      btn.classList.add('right');
      if (window.SFX) SFX.ding();
      els.foot.textContent = '✓ ' + Q.f;
      els.foot.className = 'duel-foot good';
    } else {
      btn.classList.add('wrong');
      pace++;
      if (window.SFX) SFX.deny();
      els.foot.textContent = '✗ Burr takes a pace. ' + Q.f;
      els.foot.className = 'duel-foot bad';
      renderTrack();
      if (pace >= TRACK) { setTimeout(lose, 900); els.foot.hidden = false; return; }
    }
    els.foot.hidden = false;
    els.next.hidden = false;
    els.next.textContent = (idx + 1 < QUIZ_LEN) ? 'Next question →' : 'Face the verdict →';
    els.next.focus();
  }

  function lose() {
    show(els.end);
    stage.classList.add('lost');
    els.endTitle.textContent = 'BANG.';
    els.endBody.innerHTML =
      'He aimed his pistol at the sky— wait. no. that’s you. you’re the one on the ground.<br>' +
      'You got <b>' + correct + '</b> right before Burr closed the distance.<br>' +
      '<i>“I was too young and blind to see…”</i>';
    if (window.SFX) SFX.hurt();
  }

  function win() {
    show(els.end);
    stage.classList.remove('lost');
    var rank =
      correct === QUIZ_LEN ? 'NON-STOP ★ a perfect ten' :
      correct >= 8         ? 'You wrote your way out!' :
                             'You knocked him back on his heels — barely.';
    els.endTitle.textContent = 'DAWN BREAKS. YOU LIVE.';
    els.endBody.innerHTML =
      'Score: <b>' + correct + ' / ' + QUIZ_LEN + '</b> · rank: <b>' + rank + '</b><br>' +
      'Burr lowers his pistol, mutters something about the world being wide enough.';
    try {
      if (correct > best()) localStorage.setItem('sjj_hamilton_best', String(correct));
    } catch (e) {}
    renderBest();
    if (window.SJJQuest) SJJQuest.award('hamilton');
  }

  function start() {
    quiz = sample(); idx = 0; correct = 0; pace = START_PACE;
    stage.classList.remove('lost');
    show(els.play);
    ask();
  }

  els.next.addEventListener('click', function () {
    idx++;
    if (idx >= QUIZ_LEN) win(); else ask();
  });
  stage.querySelectorAll('.duel-start').forEach(function (b) {
    b.addEventListener('click', start);
  });

  renderBest();
  renderTrack();
  show(els.intro);

  /* =================================================================
     NON-STOP - the typing game. Copy each passage before the ink runs
     dry. Passages are Hamilton's own (public domain) plus house nonsense.
     ================================================================= */
  var grind = document.querySelector('#grind');
  if (grind) (function () {
    var LINES = [
      /* the man's own words (1770s-1790s, public domain) */
      'The sacred rights of mankind are not to be rummaged for among old parchments or musty records.',
      'There is a certain enthusiasm in liberty, that makes human nature rise above itself.',
      'A nation which can prefer disgrace to danger is prepared for a master, and deserves one.',
      'I never expect to see a perfect work from imperfect man.',
      'Energy in the executive is a leading character in the definition of good government.',
      'Safety from external danger is the most powerful director of national conduct.',
      'The passions of men will not conform to the dictates of reason and justice without constraint.',
      'Real firmness is good for everything; strut is good for nothing.',
      /* house nonsense */
      'Dear sir: your pamphlet was bad and you should feel bad. Yours, A. Ham.',
      'An essay a day keeps Aaron Burr away.',
      'The raccoon is not a member of the cabinet and his vote does not count.',
      'Memo to the Treasury: someone keeps paying the national debt in bottle caps.',
      'Item one: buy more ink. Item two: buy more paper. Item three: sleep (optional).',
      'Talk less. Write more. The quill is mightier than the flintlock, usually.'
    ];
    var START_INK = 100, ESSAY_INK = 16, GOAL = 51;

    var els = {
      intro: grind.querySelector('.grind-intro'),
      play:  grind.querySelector('.grind-play'),
      end:   grind.querySelector('.grind-end'),
      ink:   grind.querySelector('#ink-fill'),
      count: grind.querySelector('.grind-count'),
      target: grind.querySelector('#grind-target'),
      input: grind.querySelector('#grind-input'),
      best:  grind.querySelector('.grind-best'),
      endTitle: grind.querySelector('.grind-end-title'),
      endBody:  grind.querySelector('.grind-end-body')
    };

    var ink, essays, words, startAt, line, lastLine = -1, tick = null, running = false;

    function bestEssays() {
      var b = 0; try { b = parseInt(localStorage.getItem('sjj_hamilton_essays') || '0', 10); } catch (e) {}
      return b;
    }
    function renderBest() {
      var b = bestEssays();
      els.best.textContent = b > 0
        ? 'personal record: ' + b + ' essay' + (b === 1 ? '' : 's') + ' before the well ran dry.'
        : 'the well is full. the page is blank. history has its eyes on you.';
    }
    function showG(el) {
      [els.intro, els.play, els.end].forEach(function (s) { s.hidden = (s !== el); });
    }
    function renderInk() {
      els.ink.style.width = Math.max(0, ink) + '%';
      grind.classList.toggle('dry', ink < 25);
    }

    function nextLine() {
      var i;
      do { i = (Math.random() * LINES.length) | 0; } while (i === lastLine && LINES.length > 1);
      lastLine = i;
      line = LINES[i];
      els.count.textContent = 'Essay No. ' + (essays + 1) + ' of ' + GOAL;
      els.input.value = '';
      els.input.classList.remove('bad');
      renderTarget(0);
    }

    function renderTarget(doneLen) {
      els.target.textContent = '';
      var done = document.createElement('b');
      done.textContent = line.slice(0, doneLen);
      els.target.appendChild(done);
      els.target.appendChild(document.createTextNode(line.slice(doneLen)));
    }

    function finishEssay() {
      essays++;
      words += line.split(' ').length;
      ink = Math.min(100, ink + ESSAY_INK);
      if (window.SFX) SFX.ding();
      if (essays >= GOAL) return end(true);
      nextLine();
    }

    function end(wroteThemAll) {
      running = false;
      clearInterval(tick); tick = null;
      var mins = (performance.now() - startAt) / 60000;
      var wpm = mins > 0 ? Math.round(words / mins) : 0;
      showG(els.end);
      els.endTitle.textContent = wroteThemAll ? 'FIFTY-ONE.' : 'THE WELL RUNS DRY.';
      els.endBody.textContent = wroteThemAll
        ? 'All ' + GOAL + ' essays at ' + wpm + ' words per minute. Madison wrote twenty-nine. You are unwell, and history thanks you.'
        : 'You wrote ' + essays + ' essay' + (essays === 1 ? '' : 's') + ' (' + words + ' words, ' + wpm +
          ' wpm) before the ink gave out. The deadline, as ever, was undefeated.';
      try {
        if (essays > bestEssays()) localStorage.setItem('sjj_hamilton_essays', String(essays));
      } catch (e) {}
      renderBest();
      if (window.SFX) (wroteThemAll ? SFX.chime : SFX.deny)();
    }

    function startGrind() {
      ink = START_INK; essays = 0; words = 0; startAt = performance.now();
      running = true;
      showG(els.play);
      nextLine();
      renderInk();
      els.input.focus();
      clearInterval(tick);
      tick = setInterval(function () {
        if (!running) return;
        ink -= (0.55 + essays * 0.045);   /* drains faster as you go */
        renderInk();
        if (ink <= 0) end(false);
      }, 250);
    }

    els.input.addEventListener('input', function () {
      if (!running) return;
      var v = els.input.value;
      if (line.indexOf(v) === 0) {
        els.input.classList.remove('bad');
        renderTarget(v.length);
        if (v === line) finishEssay();
        else if (v.length % 4 === 0 && v.length && window.SFX) SFX.blip();
      } else {
        els.input.classList.add('bad');
      }
    });

    grind.querySelectorAll('.grind-start').forEach(function (b) {
      b.addEventListener('click', startGrind);
    });
    renderBest();
    showG(els.intro);
  })();

  /* ---- "my shot" line cycler (moved here from site.js) -------------- */
  var shot = document.querySelector('#my-shot');
  if (shot) {
    var shotOut = document.querySelector('#shot-msg');
    var SHOT_LINES = [
      'I am not throwing away my shot.',
      'History has its eyes on you.',
      'Talk less, smile more.',
      'Look around, look around, how lucky we are to be alive right now.',
      'Non-stop!',
      'The world was wide enough.'
    ];
    var shotIdx = 0;
    shot.addEventListener('click', function () {
      shotIdx = (shotIdx + 1) % SHOT_LINES.length;
      if (shotOut) shotOut.textContent = '"' + SHOT_LINES[shotIdx] + '"';
      if (window.SFX) SFX.blip();
    });
  }
})();
