(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* theme */
  try { var saved = localStorage.getItem('rj-theme'); if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved); } catch (e) {}
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  var tb = d.querySelector('.theme-btn');
  if (tb) {
    tb.setAttribute('aria-pressed', String(isDark()));
    tb.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      tb.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem('rj-theme', next); } catch (e) {}
    });
  }

  /* mobile menu */
  var nav = d.querySelector('.nav'), mb = d.querySelector('.menu-btn');
  if (nav && mb) {
    mb.addEventListener('click', function () {
      var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', String(o));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('li a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); } });
  }

  /* reveal: only elements below the fold are hidden, so nothing flashes on load */
  var hasIO = 'IntersectionObserver' in window;
  var vh = window.innerHeight || 800;
  var rvs = [].slice.call(d.querySelectorAll('.rv'));
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rvs.forEach(function (el) {
      if (el.getBoundingClientRect().top > vh * 0.95) { el.classList.add('pre'); io.observe(el); }
    });
  }

  /* draw / grow animations for figures */
  var anim = [].slice.call(d.querySelectorAll('.draw,.grow,.growy'));
  if (hasIO && !reduce) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io2.unobserve(en.target); } });
    }, { threshold: 0.2 });
    anim.forEach(function (el) { io2.observe(el); });
  } else { anim.forEach(function (el) { el.classList.add('in'); }); }

  /* count-up */
  var counts = [].slice.call(d.querySelectorAll('[data-count]'));
  function runCount(el) {
    var end = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var t0 = null, dur = 1100;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * e).toFixed(dec);
      if (p < 1) raf(step); else el.textContent = end.toFixed(dec);
    }
    raf(step);
  }
  if (hasIO && !reduce) {
    var io3 = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); io3.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { io3.observe(el); });
  }

  /* scroll-driven: reading progress, journey line, case toc */
  var prog = d.querySelector('.prog i'), jr = d.querySelector('.jr');
  var secs = [].slice.call(d.querySelectorAll('.case-sec[id]'));
  var tocLinks = [].slice.call(d.querySelectorAll('.toc a'));
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = root.scrollHeight - window.innerHeight;
    if (prog) prog.style.width = (h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0) + '%';
    if (jr) {
      var r = jr.getBoundingClientRect();
      var p = (window.innerHeight * 0.72 - r.top) / Math.max(1, r.height);
      jr.style.setProperty('--p', Math.max(0.04, Math.min(1, p)).toFixed(3));
    }
    if (secs.length && tocLinks.length) {
      var cur = secs[0].id;
      secs.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.35) cur = s.id; });
      tocLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cur); });
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* work filters */
  var fbs = [].slice.call(d.querySelectorAll('.filters button'));
  var cards = [].slice.call(d.querySelectorAll('[data-tags]'));
  fbs.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      fbs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      cards.forEach(function (c) {
        var ok = f === 'all' || (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + f + ' ') > -1;
        c.hidden = !ok;
      });
    });
  });

  /* capability map filter */
  var pbs = [].slice.call(d.querySelectorAll('.pf button'));
  var caps = [].slice.call(d.querySelectorAll('.cap'));
  pbs.forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.getAttribute('data-p');
      var already = b.getAttribute('aria-pressed') === 'true';
      pbs.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      if (already || p === 'all') { caps.forEach(function (c) { c.classList.remove('on', 'off'); }); var a = d.querySelector('.pf button[data-p="all"]'); if (a) a.setAttribute('aria-pressed', 'true'); return; }
      b.setAttribute('aria-pressed', 'true');
      caps.forEach(function (c) {
        var has = (' ' + c.getAttribute('data-p') + ' ').indexOf(' ' + p + ' ') > -1;
        c.classList.toggle('on', has); c.classList.toggle('off', !has);
      });
    });
  });

  /* copy buttons (address stays selectable as a fallback) */
  [].slice.call(d.querySelectorAll('.copy')).forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.getAttribute('data-copy') || (location && location.href) || '';
      var label = b.getAttribute('data-label') || b.textContent;
      function done(ok) { b.textContent = ok ? 'Copied' : 'Select and copy'; setTimeout(function () { b.textContent = label; }, 1800); }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { fallback(); });
        } else { fallback(); }
      } catch (e) { fallback(); }
      function fallback() {
        var v = b.parentNode && b.parentNode.querySelector('.v');
        try { if (v) { var r = d.createRange(); r.selectNodeContents(v); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } } catch (e) {}
        done(false);
      }
    });
  });

  /* hero glow follows the pointer (fine pointers only) */
  var st = d.querySelector('.stage');
  if (st && !reduce && window.matchMedia && matchMedia('(pointer:fine)').matches) {
    var pend = false, mx = 0, my = 0;
    st.addEventListener('mousemove', function (e) {
      var r = st.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 80; my = ((e.clientY - r.top) / r.height - 0.5) * 60;
      if (!pend) { pend = true; raf(function () { pend = false; st.style.setProperty('--mx', mx.toFixed(1) + 'px'); st.style.setProperty('--my', my.toFixed(1) + 'px'); }); }
    });
  }
})();
