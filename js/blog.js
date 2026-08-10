/* =====================================================================
   blog.js - the essay index.

   TO ADD AN ESSAY:
     1. copy  blog/_template.html  to  blog/your-slug.html
     2. write it (the template tells you which bits to change)
     3. add one entry to POSTS below

   Order in the array does not matter - they are sorted newest first by
   date. Dates are YYYY-MM-DD. Tags are free-form; every tag used here
   automatically becomes a filter chip at the top of the page.
   ===================================================================== */
(function () {
  'use strict';

  /* Every word on this page is Swifty's. Nothing here was written for her,
     which is why POSTS ships empty - the index says "no essays yet" until
     she puts one in, and that is the correct state until then.

     One entry per essay, copy the shape:

       { title: '',
         file:  'blog/your-slug.html',
         date:  '2026-08-09',        // YYYY-MM-DD
         tags:  ['', ''],
         blurb: '' }                 // optional, shows on the index
  */
  var POSTS = [];

  var list = document.querySelector('#post-list');
  var tagbar = document.querySelector('#tagbar');
  if (!list) return;

  /* ---- the essays are a reward -----------------------------------------
     The index only exists once the back room has been opened - by the five
     caps, or by the sequence Ray knows. Same test both of those use.
     Individual essays are deliberately NOT gated: a link to one that she
     has shared should always open. It is the shelf that is hidden. */
  function unlocked() {
    try { if (localStorage.getItem('sjj_backdoor') === '1') return true; } catch (e) {}
    return !!(window.SJJQuest && SJJQuest.all());
  }
  var locked = document.querySelector('#blog-locked');
  if (!unlocked()) {
    if (locked) locked.hidden = false;
    if (tagbar) tagbar.hidden = true;
    list.hidden = true;
    return;
  }
  if (locked) locked.hidden = true;

  var active = '';   /* '' means show everything */

  function fmtDate(iso) {
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);   /* local, so no timezone drift */
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function sorted() {
    return POSTS.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  function renderTags() {
    if (!tagbar) return;
    var seen = {}, all = [];
    POSTS.forEach(function (p) {
      (p.tags || []).forEach(function (t) { if (!seen[t]) { seen[t] = 1; all.push(t); } });
    });
    tagbar.textContent = '';
    if (all.length < 2) return;   /* one tag is not a filter */
    all.sort();
    all.unshift('');
    all.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tagchip' + (t === active ? ' on' : '');
      b.textContent = t || 'everything';
      b.setAttribute('aria-pressed', String(t === active));
      b.addEventListener('click', function () { active = t; renderTags(); renderList(); });
      tagbar.appendChild(b);
    });
  }

  function renderList() {
    list.textContent = '';
    var posts = sorted().filter(function (p) {
      return !active || (p.tags || []).indexOf(active) >= 0;
    });

    if (!posts.length) {
      var empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = POSTS.length
        ? 'Nothing filed under that yet.'
        : 'No essays yet. There will be.';
      list.appendChild(empty);
      return;
    }

    posts.forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'post';

      var when = document.createElement('p');
      when.className = 'post-date';
      when.textContent = fmtDate(p.date);

      var h = document.createElement('h2');
      var a = document.createElement('a');
      a.href = p.file;
      a.textContent = p.title;
      h.appendChild(a);

      card.appendChild(when);
      card.appendChild(h);

      if (p.blurb) {
        var b = document.createElement('p');
        b.className = 'post-blurb';
        b.textContent = p.blurb;
        card.appendChild(b);
      }

      if (p.tags && p.tags.length) {
        var tl = document.createElement('p');
        tl.className = 'post-tags';
        p.tags.forEach(function (t) {
          var s = document.createElement('span');
          s.textContent = t;
          tl.appendChild(s);
        });
        card.appendChild(tl);
      }

      list.appendChild(card);
    });
  }

  renderTags();
  renderList();
})();
