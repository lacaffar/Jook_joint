/* =====================================================================
   deskcam.js - CAM 3C, the (eventual) live feed of Swifty's real desk.
   Until a stream is configured this shows the "- camera disabled -"
   placeholder. Paste a stream URL and it is remembered in localStorage
   for this browser.

   NOTE: the site ships a strict Content-Security-Policy. Its img-src
   currently allows only 'self', data: and lacaffar.github.io, so a feed
   on any other host will be BLOCKED by the browser until that host is
   added to the img-src list in every page's CSP meta tag.
   ===================================================================== */
(function () {
  'use strict';

  var form = document.querySelector('#deskcam-form');
  if (!form) return;

  var KEY    = 'sjj_deskcam_url';
  var input  = document.querySelector('#deskcam-url');
  var img    = document.querySelector('#deskcam-img');
  var holder = document.querySelector('#deskcam-placeholder');
  var status = document.querySelector('#deskcam-status');
  var screen = document.querySelector('#deskcam-screen');
  var clear  = document.querySelector('#deskcam-clear');

  function save(u) { try { u ? localStorage.setItem(KEY, u) : localStorage.removeItem(KEY); } catch (e) {} }
  function load()  { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }

  function offline(msg) {
    img.hidden = true;
    img.removeAttribute('src');
    holder.hidden = false;
    screen.classList.remove('live');
    status.textContent = msg || 'no feed configured - showing the placeholder.';
  }

  function connect(url) {
    if (!url) return offline();
    /* only http(s); never javascript:/data: from a pasted string */
    if (!/^https?:\/\//i.test(url)) {
      return offline('that does not look like an http(s) URL - placeholder kept.');
    }
    status.textContent = 'connecting to ' + url + ' …';
    img.onload = function () {
      holder.hidden = true;
      img.hidden = false;
      screen.classList.add('live');
      status.textContent = 'live: ' + url;
    };
    img.onerror = function () {
      offline('could not load that feed. if it is on another domain, add that host to ' +
              'img-src in the page CSP, then try again.');
    };
    img.src = url;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var u = input.value.trim();
    save(u);
    connect(u);
  });

  clear.addEventListener('click', function () {
    input.value = '';
    save('');
    offline();
  });

  var saved = load();
  if (saved) { input.value = saved; connect(saved); }
  else offline();
})();
