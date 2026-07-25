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
  /* Question bank, weighted heavily toward documented history. Each entry
     carries a collection category (cat) printed on the object label, and a
     footnote written like museum wall text. */
  var BANK = [
    /* ---- ORIGINS ---- */
    { cat: 'ORIGINS', q: 'Where was Alexander Hamilton born?',
      c: ['New York City', 'The island of Nevis', 'Virginia', 'Boston'], a: 1,
      f: 'Charlestown, on the island of Nevis in the British West Indies. The year is still disputed: Hamilton gave 1757, while a St. Croix probate record points to 1755.' },
    { cat: 'ORIGINS', q: 'As a teenager on St. Croix, Hamilton clerked for what kind of business?',
      c: ['A shipping and import trading house', 'A sugar plantation', 'A print shop', 'A law office'], a: 0,
      f: 'He kept the books at Beekman and Cruger, an import-export firm. Running a Caribbean trading house taught him currency, credit and commerce years before he built a national financial system.' },
    { cat: 'ORIGINS', q: 'What piece of writing helped raise the money that sent Hamilton to North America?',
      c: ['A pamphlet on taxation', 'A letter describing a hurricane', 'A poem for a local paper', 'A petition to the governor'], a: 1,
      f: 'His vivid 1772 account of a hurricane that devastated St. Croix circulated among local merchants, who sponsored his passage so he could be educated on the mainland.' },
    { cat: 'ORIGINS', q: 'Which college did Hamilton attend in New York?',
      c: ['Princeton', 'King’s College', 'Yale', 'Harvard'], a: 1,
      f: 'King’s College, renamed Columbia after the Revolution. He first asked Princeton for an accelerated course of study and was turned down.' },

    /* ---- REVOLUTION ---- */
    { cat: 'REVOLUTION', q: 'What role did Hamilton hold on George Washington’s staff?',
      c: ['Quartermaster', 'Aide-de-camp', 'Chief of artillery', 'Judge advocate'], a: 1,
      f: 'Aide-de-camp from 1777 to 1781. He drafted a staggering volume of Washington’s orders and correspondence, and resented being kept from field command.' },
    { cat: 'REVOLUTION', q: 'At the siege of Yorktown in 1781, Hamilton led the assault on which position?',
      c: ['Redoubt No. 10', 'Redoubt No. 9', 'The British fleet', 'Cornwallis’ headquarters'], a: 0,
      f: 'He commanded the night bayonet attack on Redoubt No. 10 while French troops stormed Redoubt No. 9. Cornwallis surrendered days later.' },
    { cat: 'REVOLUTION', q: 'Whom did Hamilton marry in December 1780?',
      c: ['Angelica Schuyler', 'Elizabeth Schuyler', 'Maria Reynolds', 'Theodosia Prevost'], a: 1,
      f: 'Elizabeth Schuyler, of the powerful Albany family. The match tied an immigrant officer to New York’s landed elite. She outlived him by fifty years.' },
    { cat: 'REVOLUTION', q: 'In 1785 Hamilton helped found which organization in New York?',
      c: ['The Manumission Society', 'The Society of the Cincinnati', 'Tammany Hall', 'The Bank of New York'], a: 0,
      f: 'The New-York Manumission Society, which pressed for gradual abolition in the state and founded the African Free School. New York ended slavery in 1827.' },

    /* ---- THE CONSTITUTION ---- */
    { cat: 'THE CONSTITUTION', q: 'Under what shared pen name were The Federalist Papers published?',
      c: ['Cato', 'Publius', 'Brutus', 'The Federal Farmer'], a: 1,
      f: 'Publius, after a founder of the Roman republic. Hamilton, Madison and Jay wrote as one voice to argue for ratification in New York newspapers.' },
    { cat: 'THE CONSTITUTION', q: 'Of the 85 Federalist essays, how many did Hamilton write?',
      c: ['About 20', 'Exactly 42', 'All 85', '51'], a: 3,
      f: 'Fifty-one. Madison wrote twenty-nine and John Jay five; authorship of a handful is still contested between Hamilton and Madison. Hamilton organized the project.' },
    { cat: 'THE CONSTITUTION', q: 'Who was the third author of The Federalist, with Hamilton and Madison?',
      c: ['John Jay', 'Thomas Jefferson', 'John Adams', 'Gouverneur Morris'], a: 0,
      f: 'John Jay, later the first Chief Justice of the United States. Illness cut his contribution to five essays.' },
    { cat: 'THE CONSTITUTION', q: 'At the 1787 Constitutional Convention, which state did Hamilton represent?',
      c: ['New York', 'New Jersey', 'Virginia', 'Pennsylvania'], a: 0,
      f: 'New York. His two fellow delegates opposed a strong national government and walked out, often leaving the state without a vote. He signed the finished Constitution alone for New York.' },

    /* ---- THE TREASURY ---- */
    { cat: 'THE TREASURY', q: 'What post did Hamilton hold in Washington’s first cabinet?',
      c: ['Secretary of State', 'Attorney General', 'Secretary of the Treasury', 'Secretary of War'], a: 2,
      f: 'First Secretary of the Treasury, 1789 to 1795. He inherited a bankrupt government and built its credit, customs service, mint and central bank.' },
    { cat: 'THE TREASURY', q: 'Hamilton’s Report on Public Credit proposed that the federal government do what?',
      c: ['Abolish all tariffs', 'Assume the states’ war debts', 'Sell the western territories', 'Pay creditors in land'], a: 1,
      f: 'Assumption: Washington would take on debts the states ran up fighting the Revolution, binding creditors and states alike to the new federal government.' },
    { cat: 'THE TREASURY', q: 'In the Compromise of 1790, what did Hamilton trade for support of assumption?',
      c: ['A lower tariff', 'The permanent capital on the Potomac', 'An end to the slave trade', 'A second national bank'], a: 1,
      f: 'At a dinner brokered by Jefferson, Hamilton got assumption and the South got the seat of government on the Potomac. The bargain produced Washington, D.C.' },
    { cat: 'THE TREASURY', q: 'Jefferson called the national bank unconstitutional. What was Hamilton’s counter-argument?',
      c: ['Implied powers under the necessary and proper clause', 'The commerce clause alone', 'That the states had already approved it', 'That British precedent governed'], a: 0,
      f: 'His doctrine of implied powers: if the end is constitutional, Congress may choose the means. Washington sided with him, and the argument still shapes federal authority.' },
    { cat: 'THE TREASURY', q: 'The 1794 Whiskey Rebellion was a revolt against what?',
      c: ['A federal excise tax on distilled spirits', 'Conscription', 'A land tax', 'The national bank'], a: 0,
      f: 'Hamilton’s excise fell hardest on frontier farmers who distilled surplus grain. He rode west with the militia Washington raised; the rising collapsed and the federal power to tax held.' },
    { cat: 'THE TREASURY', q: 'Which service, ancestor of the Coast Guard, did Hamilton establish in 1790?',
      c: ['The revenue cutters', 'The Continental Navy', 'The Lighthouse Board', 'The Customs Bureau'], a: 0,
      f: 'A fleet of ten cutters to stop smuggling and collect the tariffs his whole system depended on. It is the direct ancestor of the United States Coast Guard.' },
    { cat: 'THE TREASURY', q: 'The Report on Manufactures argued that the young republic should do what?',
      c: ['Stay chiefly agricultural', 'Encourage domestic industry', 'Adopt free trade with Britain', 'Ban corporations'], a: 1,
      f: 'Hamilton urged tariffs, bounties and public works to build American manufacturing. Congress largely declined at the time; the program shaped policy for a century after.' },

    /* ---- SCANDAL AND POLITICS ---- */
    { cat: 'SCANDAL', q: 'What did Hamilton admit to in the 1797 Reynolds Pamphlet?',
      c: ['Taking bribes', 'An affair with Maria Reynolds', 'Forging Washington’s signature', 'Duelling illegally'], a: 1,
      f: 'Accused of speculating with public money, he published a detailed confession of the affair and the blackmail he had paid, to prove the money was his own. It saved his honor and wrecked his reputation.' },
    { cat: 'POLITICS', q: 'In the deadlocked election of 1800, Hamilton threw his support to whom?',
      c: ['Aaron Burr', 'John Adams', 'Thomas Jefferson', 'Charles Pinckney'], a: 2,
      f: 'Jefferson and Burr tied in the electoral college and the House decided it. Hamilton opposed Jefferson on nearly everything, but judged Burr the greater danger and lobbied for his rival.' },
    { cat: 'POLITICS', q: 'Which newspaper did Hamilton help found in 1801?',
      c: ['The New York Times', 'The New York Evening Post', 'The National Gazette', 'The Aurora'], a: 1,
      f: 'The New-York Evening Post, still publishing today as the New York Post. It gave Federalists a voice in a city turning against them.' },
    { cat: 'POLITICS', q: 'What office did Aaron Burr hold at the time of the duel?',
      c: ['Senator from New York', 'Governor of New York', 'Vice President of the United States', 'None; he was retired'], a: 2,
      f: 'A sitting Vice President shot a former Treasury Secretary. Burr was indicted in New York and New Jersey, was never tried, and served out his term.' },

    /* ---- THE DUEL ---- */
    { cat: 'THE DUEL', q: 'What immediately provoked Burr to demand satisfaction in 1804?',
      c: ['A published report of remarks Hamilton made at a dinner', 'A speech in the Senate', 'A pamphlet Hamilton signed', 'A refusal to pay a debt'], a: 0,
      f: 'A letter printed in the Albany Register relayed that Hamilton had voiced a despicable opinion of Burr. Burr demanded a disavowal; Hamilton would not disown words he had never seen quoted exactly.' },
    { cat: 'THE DUEL', q: 'Where did the Hamilton-Burr duel take place?',
      c: ['Weehawken, New Jersey', 'Harlem, New York', 'Trenton, New Jersey', 'Philadelphia'], a: 0,
      f: 'A narrow ledge above the Hudson at Weehawken. New Yorkers crossed the river because New Jersey prosecuted duelling less aggressively.' },
    { cat: 'THE DUEL', q: 'On what date was Hamilton mortally wounded?',
      c: ['July 4, 1804', 'July 11, 1804', 'September 12, 1804', 'January 11, 1804'], a: 1,
      f: 'The morning of July 11, 1804. He was carried back across the Hudson and died the next afternoon at the home of William Bayard Jr.' },
    { cat: 'THE DUEL', q: 'How had Hamilton’s eldest son Philip died three years earlier?',
      c: ['Yellow fever', 'In a duel, at the same Weehawken ground', 'At sea', 'In the War of 1812'], a: 1,
      f: 'Philip, nineteen, was killed in an 1801 duel with George Eacker after confronting him over a speech attacking his father. He fell on the same ledge.' },
    { cat: 'THE DUEL', q: 'Where is Hamilton buried?',
      c: ['Trinity Church, Manhattan', 'Arlington National Cemetery', 'Mount Vernon', 'Green-Wood Cemetery'], a: 0,
      f: 'The churchyard of Trinity Church at the head of Wall Street, steps from the financial system he built. Eliza was buried beside him in 1854.' },

    /* ---- LEGACY ---- */
    { cat: 'LEGACY', q: 'After his death, Eliza Hamilton co-founded which institution?',
      c: ['The Red Cross', 'New York’s first private orphanage', 'A widows’ fund at the Treasury', 'A university'], a: 1,
      f: 'The Orphan Asylum Society, founded 1806, which survives today as Graham Windham. She also spent fifty years gathering and defending her husband’s papers.' },
    { cat: 'LEGACY', q: 'Hamilton appears on which United States banknote?',
      c: ['$5', '$10', '$20', '$50'], a: 1,
      f: 'The ten-dollar note. He and Benjamin Franklin are the only men on circulating U.S. paper currency who were never president.' },
    { cat: 'LEGACY', q: 'What was The Grange?',
      c: ['Hamilton’s country house in upper Manhattan', 'His law office', 'A Federalist club', 'The first Treasury building'], a: 0,
      f: 'The only home Hamilton ever owned, completed in 1802 in what is now Harlem. It has been moved twice and is preserved as a national memorial.' },
    { cat: 'LEGACY', q: 'Which lasting instrument of statecraft did Hamilton build?',
      c: ['A federal bankruptcy court', 'A funded national debt and a central bank', 'The gold standard', 'The federal income tax'], a: 1,
      f: 'By funding the debt at par and chartering a national bank, he made United States credit trustworthy. The Bank’s charter lapsed in 1811, but the model endured.' }
  ];

  var QUIZ_LEN = 10; /* questions per duel */
  var START_PACE = 3; /* Burr starts 3 paces in on a 10-pace field */
  var TRACK = 10; /* pace where Burr reaches you = bang */

  var els = {
    intro: stage.querySelector('.duel-intro'),
    play: stage.querySelector('.duel-play'),
    end: stage.querySelector('.duel-end'),
    track: stage.querySelector('.pace-track'),
    qnum: stage.querySelector('.duel-qnum'),
    qtext: stage.querySelector('.duel-q'),
    choices: stage.querySelector('.duel-choices'),
    foot: stage.querySelector('.duel-foot'),
    next: stage.querySelector('.duel-next'),
    best: stage.querySelector('.duel-best'),
    endTitle: stage.querySelector('.duel-end-title'),
    endBody: stage.querySelector('.duel-end-body')
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
      if (i === TRACK) { cell.classList.add('you'); cell.textContent = 'H'; cell.title = 'you'; }
      else if (i === pace) { cell.classList.add('burr'); cell.textContent = 'B'; cell.title = 'Burr - ' + (TRACK - pace) + ' paces away'; }
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
    /* museum object label: collection, catalogue number, distance */
    els.qnum.textContent = '';
    var cat = document.createElement('span');
    cat.className = 'duel-cat';
    cat.textContent = Q.cat || 'COLLECTION';
    var meta = document.createElement('span');
    meta.className = 'duel-meta';
    meta.textContent = 'CAT. NO. AH-1804.' + String(idx + 1).padStart(2, '0') +
      '  ·  ' + (idx + 1) + ' OF ' + QUIZ_LEN +
      '  ·  ' + (TRACK - pace) + ' PACES';
    els.qnum.appendChild(cat);
    els.qnum.appendChild(meta);
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
      correct >= 8 ? 'You wrote your way out!' :
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
      play: grind.querySelector('.grind-play'),
      end: grind.querySelector('.grind-end'),
      ink: grind.querySelector('#ink-fill'),
      count: grind.querySelector('.grind-count'),
      target: grind.querySelector('#grind-target'),
      input: grind.querySelector('#grind-input'),
      best: grind.querySelector('.grind-best'),
      endTitle: grind.querySelector('.grind-end-title'),
      endBody: grind.querySelector('.grind-end-body')
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
        ink -= (0.55 + essays * 0.045); /* drains faster as you go */
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
