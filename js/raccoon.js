/* =====================================================================
   raccoon.js — a little trash panda that follows your cursor.
   Self-contained pixel SVG, no image assets. Inspired by oneko.
   ===================================================================== */
(function () {
  // Bail on touch devices (no real pointer) or if user prefers less motion.
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- The raccoon, drawn with rectangles so it stays crisp + pixel-y ----
  var SVG =
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' +
      // striped bushy tail (its own group so it can wag)
      '<g class="tail">' +
        '<rect x="1"  y="26" width="11" height="9"  rx="3" fill="#3a3f46"/>' +
        '<rect x="2"  y="22" width="10" height="7"  rx="3" fill="#8a9097"/>' +
        '<rect x="3"  y="18" width="9"  height="6"  rx="3" fill="#3a3f46"/>' +
        '<rect x="4"  y="14" width="8"  height="6"  rx="3" fill="#8a9097"/>' +
        '<rect x="6"  y="11" width="6"  height="5"  rx="2" fill="#20242b"/>' +
      '</g>' +
      // body + head + ears + feet (bobs while running)
      '<g class="bob">' +
        '<rect x="10" y="26" width="26" height="14" rx="6" fill="#8a9097"/>' +   // body
        '<rect x="12" y="38" width="5"  height="5"  rx="1" fill="#20242b"/>' +   // back foot
        '<rect x="28" y="38" width="5"  height="5"  rx="1" fill="#20242b"/>' +   // front foot
        '<rect x="26" y="16" width="18" height="18" rx="7" fill="#9aa0a6"/>' +   // head
        '<polygon points="27,17 24,8 33,14" fill="#8a9097"/>' +                  // ear back
        '<polygon points="42,17 45,8 36,14" fill="#8a9097"/>' +                  // ear front
        '<polygon points="29,16 27,11 33,15" fill="#3a3f46"/>' +                 // ear inner
        '<polygon points="40,16 42,11 36,15" fill="#3a3f46"/>' +                 // ear inner
        '<rect x="28" y="22" width="16" height="9" rx="4" fill="#cdd2d7"/>' +    // face
        '<rect x="27" y="21" width="17" height="6" rx="3" fill="#20242b"/>' +    // bandit mask
        '<rect x="31" y="22" width="3" height="3" fill="#fff"/>' +               // eye white
        '<rect x="38" y="22" width="3" height="3" fill="#fff"/>' +               // eye white
        '<rect x="32" y="23" width="1.6" height="1.6" fill="#111"/>' +           // pupil
        '<rect x="39" y="23" width="1.6" height="1.6" fill="#111"/>' +           // pupil
        '<rect x="42" y="28" width="4" height="3" rx="1.5" fill="#20242b"/>' +   // nose/snout
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

  // ---- State ----
  var mx = window.innerWidth / 2, my = window.innerHeight * 0.4;
  var x = mx, y = my, facing = 1;
  var idleFrames = 0, lastSpeak = 0;

  // Per-room flavour lines (body class set on each page)
  var generic = ['*chitters*', 'ooo, shiny', 'trash? 👀', '*washes hands*', 'follow me',
                 'snack break?', '*sniff sniff*'];
  var byRoom = {
    'room-fnaf':     ['5 more nights…', "what's that noise?", '*checks the cameras*', 'power: low'],
    'room-stardew':  ['did you water the crops?', 'it is a good day', '*holds a parsnip*', 'the Junimos like you'],
    'room-undertale': ['* you feel determined', '* (raccoon)', 'stay determined', '* the trash rustles'],
    'room-fencing':  ['en garde!', 'allez!', 'point! 🔴', 'nice riposte']
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
  // also creep toward clicks/taps
  window.addEventListener('mousedown', function (e) { mx = e.clientX; my = e.clientY; });

  var GAP = 36;            // stops this far from the cursor
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
      // when it's been sitting a while, occasionally chitter
      if (idleFrames > 90 && now - lastSpeak > 14000 && Math.random() < 0.012) {
        say(); lastSpeak = now;
      }
    }

    el.style.transform = 'translate(' + (x - 24) + 'px,' + (y - 24) + 'px) scaleX(' + facing + ')';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
