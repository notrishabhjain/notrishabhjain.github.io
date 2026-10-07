/* Rishabh Jain — portfolio behaviour.

   Five jobs: theme, the capability filter, opening an engagement in place,
   deep links, and marking where you are. Everything degrades: with scripting
   off the page is a complete document, every engagement is a <details> that
   still opens, and only the filter is lost. */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------------------------------------------------------- theme -- */
  // there are two: one in the bar, one in the rail, and they must agree
  var tgls = [].slice.call(document.querySelectorAll('[data-theme-toggle]'));
  function paint() {
    var dark = root.dataset.theme === 'dark';
    tgls.forEach(function (t) {
      t.textContent = dark ? 'Light' : 'Dark';
      t.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' appearance');
    });
  }
  paint();
  tgls.forEach(function (t) {
    t.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('rj-theme', root.dataset.theme); } catch (e) { /* private mode */ }
      paint();
    });
  });

  /* ----------------------------------------------------------- bar menu --
     The jump rail has no room on a narrow screen, so the sticky bar carries
     the same links. A <details> so it works before this script runs. */
  var menu = document.getElementById('menu');
  if (menu) {
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
    });
  }

  /* --------------------------------------------------------------- filter --
     Selecting capabilities hides the engagements that do not evidence any of
     them, and orders the rest by how many they do — so the closest match to
     what someone is hiring for ends up at the top. */
  var engs = [].slice.call(document.querySelectorAll('[data-eng]'));
  var chips = [].slice.call(document.querySelectorAll('[data-cap]'));
  var work = document.getElementById('work-list');
  var state = document.getElementById('filter-state');
  var count = document.getElementById('filter-count');
  var names = document.getElementById('filter-names');
  var clear = document.getElementById('filter-clear');
  var order = engs.map(function (e) { return e; });   // the original ranking
  var picked = [];

  function capsOf(el) {
    return (el.getAttribute('data-caps') || '').split('|').filter(Boolean);
  }
  function labelOf(id) {
    var c = document.querySelector('[data-cap="' + id + '"]');
    return c ? c.getAttribute('data-label') : id;
  }

  function apply() {
    var hits = [];
    engs.forEach(function (el) {
      var mine = capsOf(el);
      var matched = picked.filter(function (p) { return mine.indexOf(p) > -1; });
      el.hidden = picked.length > 0 && matched.length === 0;
      el.classList.toggle('eng--hit', picked.length > 0 && matched.length > 0);
      var hit = el.querySelector('[data-hit]');
      if (hit) {
        hit.innerHTML = matched.length
          ? 'Matches <b>' + matched.map(labelOf).join('</b>, <b>') + '</b>'
          : '';
      }
      if (!el.hidden) hits.push({ el: el, n: matched.length });
    });

    // strongest match first; ties keep the original order
    if (picked.length) {
      hits.sort(function (a, b) {
        if (b.n !== a.n) return b.n - a.n;
        return order.indexOf(a.el) - order.indexOf(b.el);
      });
    } else {
      hits = order.map(function (e) { return { el: e, n: 0 }; });
    }
    hits.forEach(function (h) { work.appendChild(h.el); });

    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', picked.indexOf(c.getAttribute('data-cap')) > -1 ? 'true' : 'false');
    });

    if (!picked.length) {
      if (state) state.hidden = true;
    } else {
      if (state) state.hidden = false;
      if (count) count.textContent = hits.length + ' of ' + engs.length;
      if (names) names.textContent = picked.map(labelOf).join(', ');
    }
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var id = c.getAttribute('data-cap');
      var i = picked.indexOf(id);
      if (i > -1) picked.splice(i, 1); else picked.push(id);
      apply();
    });
  });
  if (clear) clear.addEventListener('click', function () {
    picked = [];
    apply();
    var f = document.getElementById('capabilities');
    if (f) f.scrollIntoView({ block: 'start' });
  });
  if (engs.length) apply();

  /* ----------------------------------------------------------- deep links --
     /#crcs-portal opens that engagement and scrolls to it, so a single
     case study is still something you can send someone. */
  function openHash(hash, smooth) {
    if (!hash) return false;
    var el = document.getElementById(hash.replace(/^#/, ''));
    if (!el) return false;
    if (el.tagName === 'DETAILS') {
      el.open = true;
      el.hidden = false;
    }
    el.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    return true;
  }
  if (location.hash) setTimeout(function () { openHash(location.hash, false); }, 0);
  addEventListener('hashchange', function () { openHash(location.hash, true); });

  // the career section points at the engagements that sat inside each role
  document.querySelectorAll('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-open');
      picked = [];
      apply();
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      openHash('#' + id, true);
    });
  });

  // keep the address bar honest as engagements are opened and closed by hand
  engs.forEach(function (el) {
    el.addEventListener('toggle', function () {
      if (!el.open || !history.replaceState) return;
      history.replaceState(null, '', '#' + el.id);
    });
  });

  /* --------------------------------------------------------------- marking --
     Reads position on scroll rather than on intersection thresholds: a jump
     between sections crosses no threshold, and an observer would leave the
     mark on the section the reader has already left. */
  var links = [].slice.call(document.querySelectorAll('.jump a[href^="#"]'))
    .map(function (a) { return { a: a, sec: document.getElementById(a.getAttribute('href').slice(1)) }; })
    .filter(function (p) { return p.sec; });
  var at = null;
  function mark() {
    if (!links.length) return;
    var h = window.innerHeight, hit = null;
    for (var i = 0; i < links.length; i++) {
      var r = links[i].sec.getBoundingClientRect();
      if (r.bottom > h * 0.14 && r.top < h * 0.6) { hit = links[i]; break; }
    }
    if (!hit) {
      var last = links[links.length - 1];
      if (last.sec.getBoundingClientRect().bottom <= h * 0.14) hit = last;
    }
    if (!hit || hit === at) return;
    at = hit;
    links.forEach(function (p) {
      if (p === hit) p.a.setAttribute('aria-current', 'true');
      else p.a.removeAttribute('aria-current');
    });
  }

  /* -------------------------------------------------------------- entrance -- */
  var risers = document.querySelectorAll('.rise');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (risers.length) {
    if (still || !('IntersectionObserver' in window)) {
      [].forEach.call(risers, function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          obs.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      [].forEach.call(risers, function (el) { io.observe(el); });
    }
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; mark(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  mark();
})();
