/* Rishabh Jain — portfolio behaviour.
   Four jobs: theme, mobile menu, section tracking, and one entrance effect.
   Nothing here is required for the content to be readable. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- theme --
     The pre-paint inline script in each page has already set data-theme. This
     only handles the toggle and remembers the choice. */
  var root = document.documentElement;
  var tgl = document.querySelector('[data-theme-toggle]');
  function paintToggle() {
    if (!tgl) return;
    var dark = root.dataset.theme === 'dark';
    tgl.textContent = dark ? 'Light' : 'Dark';
    tgl.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' appearance');
  }
  paintToggle();
  if (tgl) {
    tgl.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('rj-theme', root.dataset.theme); } catch (e) { /* private mode */ }
      paintToggle();
    });
  }

  /* ----------------------------------------------------------------- menu --
     A disclosure, not a drawer: the same links, revealed in place. */
  var burger = document.querySelector('[data-burger]');
  var links = document.getElementById('nav-links');
  if (burger && links) {
    var setOpen = function (open) {
      links.dataset.open = open ? 'true' : 'false';
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', function () {
      setOpen(links.dataset.open !== 'true');
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.dataset.open === 'true') { setOpen(false); burger.focus(); }
    });
  }

  /* -------------------------------------------------------------- tracking --
     Marks the link for whichever section owns the reading band, for the top nav
     and for a case study's contents list. Read on scroll rather than on
     intersection thresholds: a jump between sections crosses no threshold, and
     an observer would leave the mark on the section the reader has left. */
  var groups = [];
  function track(links, topBand, botBand) {
    var pairs = [];
    Array.prototype.forEach.call(links, function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = id && document.getElementById(id);
      if (sec) pairs.push({ a: a, sec: sec });
    });
    if (pairs.length) groups.push({ pairs: pairs, top: topBand, bot: botBand, at: null });
  }
  track(document.querySelectorAll('#nav-links a[href^="#"]'), 0.12, 0.70);
  track(document.querySelectorAll('.toc a[href^="#"]'), 0.10, 0.60);

  function mark() {
    var h = window.innerHeight;
    groups.forEach(function (g) {
      var hit = null;
      for (var i = 0; i < g.pairs.length; i++) {
        var r = g.pairs[i].sec.getBoundingClientRect();
        if (r.bottom > h * g.top && r.top < h * g.bot) { hit = g.pairs[i]; break; }
      }
      // past the last section (the footer, say) the final entry stays marked
      if (!hit) {
        var last = g.pairs[g.pairs.length - 1];
        if (last.sec.getBoundingClientRect().bottom <= h * g.top) hit = last;
      }
      if (!hit || hit === g.at) return;
      g.at = hit;
      g.pairs.forEach(function (p) {
        if (p === hit) p.a.setAttribute('aria-current', 'true');
        else p.a.removeAttribute('aria-current');
      });
    });
  }

  if (groups.length) {
    var queued = false;
    var onScroll = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; mark(); });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    mark();
  }

  /* -------------------------------------------------------------- entrance --
     Fade and a 14px rise, once per element. Skipped entirely when the reader
     has asked for reduced motion, and skipped when there is no observer so the
     content is never left invisible. */
  var risers = document.querySelectorAll('.rise');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!risers.length) return;
  if (still || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(risers, function (el) { el.classList.add('in'); });
    return;
  }
  var reveal = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      obs.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  Array.prototype.forEach.call(risers, function (el) { reveal.observe(el); });
})();
