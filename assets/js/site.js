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
     Marks the nav link for whichever section owns the upper third of the
     viewport, so the reader always knows where they are. */
  var navMap = {};
  var watched = [];
  Array.prototype.forEach.call(document.querySelectorAll('#nav-links a[href^="#"]'), function (a) {
    var id = a.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) { navMap[id] = a; watched.push(sec); }
  });
  if (watched.length && 'IntersectionObserver' in window) {
    var current = null;
    var track = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (current === en.target.id) return;
        current = en.target.id;
        Object.keys(navMap).forEach(function (k) {
          if (k === current) navMap[k].setAttribute('aria-current', 'true');
          else navMap[k].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-12% 0px -72% 0px', threshold: 0 });
    watched.forEach(function (s) { track.observe(s); });
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
