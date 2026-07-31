/* =====================================================================
   quest.js - the Bottle Cap Hunt.
   Win the game in each room and the raccoon tosses you a bottle cap.
   Collect all five and the back room unlocks. Caps live in localStorage
   under `sjj_caps`, so progress survives reloads (per browser).
   ===================================================================== */
window.SJJQuest = (function () {
  'use strict';

  var KEY = 'sjj_caps';
  var ROOMS = [
    { id: 'fnaf', ico: 'F', name: 'FNAF', cap: '◆' },
    { id: 'stardew', ico: 'S', name: 'Stardew', cap: '★' },
    { id: 'undertale', ico: 'U', name: 'Undertale', cap: '●' },
    { id: 'fencing', ico: 'E', name: 'Fencing', cap: '▲' },
    { id: 'hamilton', ico: 'H', name: 'Hamilton', cap: '■' }
  ];
  /* Caps that do NOT open the back room - that door still wants the five
     above and nothing else. `secret` ones stay off the shelf until they
     have been earned, so the shelf doesn't spoil them. */
  var EXTRA = [
    { id: 'coucy', ico: 'C', name: 'Coucy', cap: '⌂', bonus: true, href: 'coucy.html' },
    { id: 'tips', ico: 'R', name: "the raccoon's own", cap: '◍', bonus: true, secret: true }
  ];

  function find(id) {
    var i;
    for (i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) return ROOMS[i];
    for (i = 0; i < EXTRA.length; i++) if (EXTRA[i].id === id) return EXTRA[i];
    return null;
  }

  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) || {}; } catch (e) {}
    return {};
  }
  function store(caps) { try { localStorage.setItem(KEY, JSON.stringify(caps)); } catch (e) {} }

  function count() {
    var caps = load(), n = 0;
    ROOMS.forEach(function (r) { if (caps[r.id]) n++; });
    return n;
  }
  function all() { return count() === ROOMS.length; }
  function has(id) { return !!load()[id]; }

  /* ---- toast ------------------------------------------------------- */
  var toastTimer = null;
  function toast(msg, big) {
    var t = document.querySelector('#cap-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'cap-toast';
      t.className = 'cap-toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.toggle('big', !!big);
    t.classList.remove('show');
    void t.offsetWidth; /* restart animation */
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, big ? 6000 : 4200);
  }

  function award(id) {
    var room = find(id);
    if (!room) return;
    var caps = load();
    if (caps[id]) {
      toast(' you already have the ' + room.name + ' cap. he keeps the rest.');
      return;
    }
    caps[id] = true;
    store(caps);
    var n = count();
    if (window.SFX) SFX.cap();
    if (room.bonus) {
      toast(room.id === 'tips'
        ? ' the raccoon flicks you his OWN bottle cap. the door still wants the other five.'
        : ' a bottle cap for holding Coucy. it is not one of the five the back room wants.');
      renderAllShelves();
      try { window.dispatchEvent(new CustomEvent('sjj:caps', { detail: { count: n, all: n === ROOMS.length } })); } catch (e) {}
      return;
    }
    if (n === ROOMS.length) {
      toast(' the raccoon tosses you the LAST bottle cap (5/5)… somewhere in the joint, a door creaks open.', true);
    } else {
      toast(' the raccoon tosses you a bottle cap! (' + n + '/' + ROOMS.length + ')');
    }
    renderAllShelves();
    try { window.dispatchEvent(new CustomEvent('sjj:caps', { detail: { count: n, all: n === ROOMS.length } })); } catch (e) {}
  }

  /* ---- shelf ------------------------------------------------------- */
  function renderShelf(el) {
    if (!el) return;
    var caps = load();
    el.classList.add('cap-shelf');
    el.textContent = '';
    /* the five the back room wants, then the extras worth showing */
    var show = ROOMS.slice();
    EXTRA.forEach(function (b) { if (!b.secret || caps[b.id]) show.push(b); });
    show.forEach(function (r) {
      var got = !!caps[r.id];
      var href = r.bonus ? r.href : r.id + '.html';
      var slot = document.createElement(href ? 'a' : 'span');
      slot.className = 'cap-slot' + (got ? ' got' : '') + (r.bonus ? ' bonus' : '');
      if (href) slot.href = href;
      slot.title = r.bonus
        ? (r.id === 'tips' ? "the raccoon's own cap - he owed you one"
                           : r.name + ' cap - a bonus, not one of the five')
        : (got ? r.name + ' cap - collected!'
               : r.name + ' cap - win the game in the ' + r.name + ' room');
      var ico = document.createElement('span');
      ico.className = 'cap-ico';
      ico.textContent = got ? r.cap : '·';
      var lab = document.createElement('span');
      lab.className = 'cap-lab';
      lab.textContent = r.ico;
      slot.appendChild(ico); slot.appendChild(lab);
      el.appendChild(slot);
    });
  }
  function renderAllShelves() {
    document.querySelectorAll('[data-cap-shelf]').forEach(renderShelf);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderAllShelves);
  else renderAllShelves();

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} renderAllShelves(); }

  return { award: award, has: has, count: count, all: all,
           renderShelf: renderShelf, reset: reset, rooms: ROOMS, toast: toast };
})();
