/* =====================================================================
   commonplace.js - renders a commonplace book from a plain text file.

   Each class page (blog/commonplace-*.html) has
     <article class="essay commonplace" data-book="commonplace/mae201.txt">
   and this fills it from that file. You never touch the HTML to add to a
   book - only the .txt. The format is written at the top of every .txt.

   The .txt is fetched, so it needs a server (GitHub Pages, or
   python -m http.server). Opened straight off the disk it cannot load.
   ===================================================================== */
(function () {
  'use strict';

  var book = document.querySelector('[data-book]');
  if (!book) return;
  var out = book.querySelector('.cp-entries');
  var src = book.getAttribute('data-book');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* **bold**  *italic*  `code`  and bare http(s) links */
  function inline(parent, text) {
    var re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|https?:\/\/[^\s<>"]+)/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      var t = m[0], n;
      if (t[0] === '`') n = el('code', '', t.slice(1, -1));
      else if (t.slice(0, 2) === '**') n = el('b', '', t.slice(2, -2));
      else if (t[0] === '*') n = el('i', '', t.slice(1, -1));
      else { n = el('a', '', t); n.href = t; n.target = '_blank'; n.rel = 'noopener'; }
      parent.appendChild(n);
      last = re.lastIndex;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
    return parent;
  }

  function parse(text) {
    var entries = [], cur = null, block = null;
    text.replace(/\r/g, '').split('\n').forEach(function (line) {
      if (/^\s*\/\//.test(line)) return;                 /* hidden */
      var m;
      if ((m = /^##\s*(.*)$/.exec(line))) {
        cur = { head: m[1].trim(), blocks: [] }; entries.push(cur); block = null; return;
      }
      if (!line.trim()) { block = null; return; }
      if (!cur) { cur = { head: '', blocks: [] }; entries.push(cur); }

      var type, body;
      if ((m = /^>\s?(.*)$/.exec(line))) { type = 'quote'; body = m[1]; }
      else if ((m = /^--\s*(.*)$/.exec(line))) {
        if (block && block.type === 'quote') { block.source = m[1]; return; }
        type = 'source'; body = m[1];
      }
      else if ((m = /^[-*]\s+(.*)$/.exec(line))) { type = 'list'; body = m[1]; }
      else { type = 'para'; body = line.trim(); }

      if (block && block.type === type && !block.source) block.lines.push(body);
      else { block = { type: type, lines: [body] }; cur.blocks.push(block); }
    });
    return entries;
  }

  function render(entries) {
    out.textContent = '';
    entries = entries.filter(function (e) { return e.head || e.blocks.length; });
    if (!entries.length) {
      out.appendChild(el('p', 'muted', 'Nothing copied in yet.'));
      return;
    }
    entries.forEach(function (e) {
      var sec = el('section', 'cp-entry');
      if (e.head) inline(sec.appendChild(el('h2')), e.head);
      e.blocks.forEach(function (b) {
        if (b.type === 'list') {
          var ul = sec.appendChild(el('ul'));
          b.lines.forEach(function (l) { inline(ul.appendChild(el('li')), l); });
        } else if (b.type === 'quote') {
          var q = sec.appendChild(el('blockquote'));
          inline(q.appendChild(el('p')), b.lines.join('\n'));
          if (b.source) inline(q.appendChild(el('p', 'cp-source')), '— ' + b.source);
        } else if (b.type === 'source') {
          inline(sec.appendChild(el('p', 'cp-source')), '— ' + b.lines.join(' '));
        } else {
          inline(sec.appendChild(el('p')), b.lines.join('\n'));
        }
      });
      out.appendChild(sec);
    });
  }

  fetch(src, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (t) { render(parse(t)); })
    .catch(function () {
      out.textContent = '';
      out.appendChild(el('p', 'muted', 'Could not load blog/' + src +
        (location.protocol === 'file:' ? ' - open the site through a server, not straight off the disk.' : '.')));
    });
})();
