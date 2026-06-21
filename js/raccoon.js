(function () {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  // 16x16 pixel art raccoon drawn on a grid — each "rect" is one pixel
  // palette: #222 dark, #555 mid-grey, #888 light fur, #ccc face, #fff eye whites, #111 pupils, #333 nose
  var P = 3; // scale: each pixel = 3 SVG units → 48x48 viewBox
  function px(x, y, c) {
    return '<rect x="' + (x * P) + '" y="' + (y * P) + '" width="' + P + '" height="' + P + '" fill="' + c + '"/>';
  }

  var pixels = '';

  // ears (row 0-3)
  // left ear
  pixels += px(2, 0, '#555') + px(3, 0, '#555');
  pixels += px(1, 1, '#555') + px(2, 1, '#888') + px(3, 1, '#555');
  pixels += px(1, 2, '#555') + px(2, 2, '#444') + px(3, 2, '#888') + px(4, 2, '#555');
  // right ear
  pixels += px(10, 0, '#555') + px(11, 0, '#555');
  pixels += px(10, 1, '#555') + px(11, 1, '#888') + px(12, 1, '#555');
  pixels += px(9, 2, '#555') + px(10, 2, '#888') + px(11, 2, '#444') + px(12, 2, '#555');

  // head top (row 3-4)
  pixels += px(3, 3, '#555') + px(4, 3, '#888') + px(5, 3, '#888') + px(6, 3, '#888') + px(7, 3, '#888') + px(8, 3, '#888') + px(9, 3, '#888') + px(10, 3, '#555');
  pixels += px(2, 4, '#555') + px(3, 4, '#888') + px(4, 4, '#888') + px(5, 4, '#888') + px(6, 4, '#888') + px(7, 4, '#888') + px(8, 4, '#888') + px(9, 4, '#888') + px(10, 4, '#888') + px(11, 4, '#555');

  // bandit mask row (row 5) — dark stripe across eyes
  pixels += px(2, 5, '#555') + px(3, 5, '#333') + px(4, 5, '#333') + px(5, 5, '#333') + px(6, 5, '#888') + px(7, 5, '#888') + px(8, 5, '#333') + px(9, 5, '#333') + px(10, 5, '#333') + px(11, 5, '#555');

  // eyes row (row 6) — white eyes with pupils in mask
  pixels += px(2, 6, '#555') + px(3, 6, '#333') + px(4, 6, '#fff') + px(5, 6, '#111') + px(6, 6, '#888') + px(7, 6, '#888') + px(8, 6, '#fff') + px(9, 6, '#111') + px(10, 6, '#333') + px(11, 6, '#555');

  // below eyes (row 7) — light muzzle area
  pixels += px(2, 7, '#555') + px(3, 7, '#888') + px(4, 7, '#ccc') + px(5, 7, '#ccc') + px(6, 7, '#ccc') + px(7, 7, '#ccc') + px(8, 7, '#ccc') + px(9, 7, '#ccc') + px(10, 7, '#888') + px(11, 7, '#555');

  // nose row (row 8)
  pixels += px(3, 8, '#555') + px(4, 8, '#ccc') + px(5, 8, '#ccc') + px(6, 8, '#333') + px(7, 8, '#333') + px(8, 8, '#ccc') + px(9, 8, '#ccc') + px(10, 8, '#555');

  // chin (row 9)
  pixels += px(4, 9, '#555') + px(5, 9, '#888') + px(6, 9, '#ccc') + px(7, 9, '#ccc') + px(8, 9, '#888') + px(9, 9, '#555');

  // body (rows 10-13)
  pixels += px(3, 10, '#555') + px(4, 10, '#888') + px(5, 10, '#888') + px(6, 10, '#888') + px(7, 10, '#888') + px(8, 10, '#888') + px(9, 10, '#888') + px(10, 10, '#555');
  pixels += px(2, 11, '#555') + px(3, 11, '#888') + px(4, 11, '#888') + px(5, 11, '#ccc') + px(6, 11, '#ccc') + px(7, 11, '#ccc') + px(8, 11, '#888') + px(9, 11, '#888') + px(10, 11, '#888') + px(11, 11, '#555');
  pixels += px(2, 12, '#555') + px(3, 12, '#888') + px(4, 12, '#888') + px(5, 12, '#ccc') + px(6, 12, '#ccc') + px(7, 12, '#ccc') + px(8, 12, '#888') + px(9, 12, '#888') + px(10, 12, '#888') + px(11, 12, '#555');
  pixels += px(3, 13, '#555') + px(4, 13, '#888') + px(5, 13, '#888') + px(6, 13, '#888') + px(7, 13, '#888') + px(8, 13, '#888') + px(9, 13, '#888') + px(10, 13, '#555');

  // feet (row 14)
  pixels += px(3, 14, '#333') + px(4, 14, '#333') + px(5, 14, '#555') + px(6, 14, '#555') + px(7, 14, '#555') + px(8, 14, '#555') + px(9, 14, '#333') + px(10, 14, '#333');

  // tail (rows 10-14, left side) — striped
  pixels += px(0, 10, '#555') + px(1, 10, '#888');
  pixels += px(0, 11, '#888') + px(1, 11, '#555');
  pixels += px(0, 12, '#555') + px(1, 12, '#888');
  pixels += px(0, 13, '#888') + px(1, 13, '#555');
  pixels += px(0, 9, '#555');
  pixels += px(0, 8, '#888');

  var SVG =
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' +
      '<g class="tail">' +
        px(0, 8, '#888') + px(0, 9, '#555') +
        px(0, 10, '#555') + px(1, 10, '#888') +
        px(0, 11, '#888') + px(1, 11, '#555') +
        px(0, 12, '#555') + px(1, 12, '#888') +
        px(0, 13, '#888') + px(1, 13, '#555') +
      '</g>' +
      '<g class="bob">' +
        // ears
        px(2, 0, '#555') + px(3, 0, '#555') +
        px(1, 1, '#555') + px(2, 1, '#888') + px(3, 1, '#555') +
        px(1, 2, '#555') + px(2, 2, '#444') + px(3, 2, '#888') + px(4, 2, '#555') +
        px(10, 0, '#555') + px(11, 0, '#555') +
        px(10, 1, '#555') + px(11, 1, '#888') + px(12, 1, '#555') +
        px(9, 2, '#555') + px(10, 2, '#888') + px(11, 2, '#444') + px(12, 2, '#555') +
        // head
        px(3, 3, '#555') + px(4, 3, '#888') + px(5, 3, '#888') + px(6, 3, '#888') + px(7, 3, '#888') + px(8, 3, '#888') + px(9, 3, '#888') + px(10, 3, '#555') +
        px(2, 4, '#555') + px(3, 4, '#888') + px(4, 4, '#888') + px(5, 4, '#888') + px(6, 4, '#888') + px(7, 4, '#888') + px(8, 4, '#888') + px(9, 4, '#888') + px(10, 4, '#888') + px(11, 4, '#555') +
        // mask
        px(2, 5, '#555') + px(3, 5, '#333') + px(4, 5, '#333') + px(5, 5, '#333') + px(6, 5, '#888') + px(7, 5, '#888') + px(8, 5, '#333') + px(9, 5, '#333') + px(10, 5, '#333') + px(11, 5, '#555') +
        // eyes
        px(2, 6, '#555') + px(3, 6, '#333') + px(4, 6, '#fff') + px(5, 6, '#111') + px(6, 6, '#888') + px(7, 6, '#888') + px(8, 6, '#fff') + px(9, 6, '#111') + px(10, 6, '#333') + px(11, 6, '#555') +
        // muzzle
        px(2, 7, '#555') + px(3, 7, '#888') + px(4, 7, '#ccc') + px(5, 7, '#ccc') + px(6, 7, '#ccc') + px(7, 7, '#ccc') + px(8, 7, '#ccc') + px(9, 7, '#ccc') + px(10, 7, '#888') + px(11, 7, '#555') +
        // nose
        px(3, 8, '#555') + px(4, 8, '#ccc') + px(5, 8, '#ccc') + px(6, 8, '#333') + px(7, 8, '#333') + px(8, 8, '#ccc') + px(9, 8, '#ccc') + px(10, 8, '#555') +
        // chin
        px(4, 9, '#555') + px(5, 9, '#888') + px(6, 9, '#ccc') + px(7, 9, '#ccc') + px(8, 9, '#888') + px(9, 9, '#555') +
        // body
        px(3, 10, '#555') + px(4, 10, '#888') + px(5, 10, '#888') + px(6, 10, '#888') + px(7, 10, '#888') + px(8, 10, '#888') + px(9, 10, '#888') + px(10, 10, '#555') +
        px(2, 11, '#555') + px(3, 11, '#888') + px(4, 11, '#888') + px(5, 11, '#ccc') + px(6, 11, '#ccc') + px(7, 11, '#ccc') + px(8, 11, '#888') + px(9, 11, '#888') + px(10, 11, '#888') + px(11, 11, '#555') +
        px(2, 12, '#555') + px(3, 12, '#888') + px(4, 12, '#888') + px(5, 12, '#ccc') + px(6, 12, '#ccc') + px(7, 12, '#ccc') + px(8, 12, '#888') + px(9, 12, '#888') + px(10, 12, '#888') + px(11, 12, '#555') +
        px(3, 13, '#555') + px(4, 13, '#888') + px(5, 13, '#888') + px(6, 13, '#888') + px(7, 13, '#888') + px(8, 13, '#888') + px(9, 13, '#888') + px(10, 13, '#555') +
        // feet
        px(3, 14, '#333') + px(4, 14, '#333') + px(9, 14, '#333') + px(10, 14, '#333') +
      '</g>' +
    '</svg>';

  var el = document.createElement('div');
  el.id = 'raccoon';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = SVG;
  document.body.appendChild(el);

  var bubble = document.createElement('div');
  bubble.className = 'rac-speech';
  bubble.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bubble);

  var mx = window.innerWidth / 2, my = window.innerHeight * 0.4;
  var x = mx, y = my, facing = 1;
  var idleFrames = 0, lastSpeak = 0;

  var generic = ['*chitters*', 'ooo, shiny', 'trash? \u{1F440}', '*washes hands*', 'follow me',
                 'snack break?', '*sniff sniff*'];
  var byRoom = {
    'room-fnaf':     ['5 more nights…', "what's that noise?", '*checks the cameras*', 'power: low'],
    'room-stardew':  ['did you water the crops?', 'it is a good day', '*holds a parsnip*', 'the Junimos like you'],
    'room-undertale': ['* you feel determined', '* (raccoon)', 'stay determined', '* the trash rustles'],
    'room-fencing':  ['en garde!', 'allez!', 'point! \u{1F534}', 'nice riposte']
  };
  function lines() {
    var k = Object.keys(byRoom);
    for (var i = 0; i < k.length; i++) if (document.body.classList.contains(k[i]))
      return byRoom[k[i]].concat(generic);
    return generic;
  }

  function say() {
    var L = lines();
    bubble.textContent = L[(Math.random() * L.length) | 0];
    bubble.style.left = (x) + 'px';
    bubble.style.top  = (y - 6) + 'px';
    bubble.classList.add('show');
    setTimeout(function () { bubble.classList.remove('show'); }, 2600);
  }

  window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
  window.addEventListener('mousedown', function (e) { mx = e.clientX; my = e.clientY; });

  var GAP = 36;
  function frame(now) {
    var dx = mx - x, dy = my - y;
    var dist = Math.hypot(dx, dy);

    if (dist > GAP) {
      var speed = Math.min(dist * 0.16, 13);
      x += dx / dist * speed;
      y += dy / dist * speed;
      if (Math.abs(dx) > 2) facing = dx < 0 ? -1 : 1;
      el.classList.add('run');
      idleFrames = 0;
      bubble.classList.remove('show');
    } else {
      el.classList.remove('run');
      idleFrames++;
      if (idleFrames > 90 && now - lastSpeak > 14000 && Math.random() < 0.012) {
        say(); lastSpeak = now;
      }
    }

    el.style.transform = 'translate(' + (x - 24) + 'px,' + (y - 24) + 'px) scaleX(' + facing + ')';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
