(function () {
  var root = document.documentElement;
  root.classList.add("js");

  /* theme: system by default, remembered per browser if the visitor picks one */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var saved = store("rj-theme");
  if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paintToggle() {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
      b.innerHTML = isDark()
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
    });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (!t) return;
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next); store("rj-theme", next); paintToggle();
  });

  document.addEventListener("DOMContentLoaded", function () {
    paintToggle();

    /* header shadow + mobile menu */
    var head = document.querySelector(".site-head");
    function onScroll() { if (head) head.classList.toggle("scrolled", window.scrollY > 8); }
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    var mb = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
    if (mb && nav) mb.addEventListener("click", function () {
      var open = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", open ? "true" : "false");
    });

    /* reveal on scroll */
    var rv = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
      rv.forEach(function (el) { io.observe(el); });
    } else rv.forEach(function (el) { el.classList.add("in"); });

    /* chart tooltips: any [data-tip] mark */
    var tip = document.createElement("div"); tip.className = "tip"; tip.setAttribute("role", "status"); document.body.appendChild(tip);
    function show(el, x, y) { tip.textContent = el.getAttribute("data-tip"); tip.classList.add("on"); place(x, y); }
    function place(x, y) {
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var left = Math.min(Math.max(8, x + 14), window.innerWidth - w - 8);
      var top = y - h - 14; if (top < 8) top = y + 18;
      tip.style.left = left + "px"; tip.style.top = top + "px";
    }
    document.querySelectorAll("[data-tip]").forEach(function (el) {
      el.addEventListener("mouseenter", function (e) { show(el, e.clientX, e.clientY); });
      el.addEventListener("mousemove", function (e) { place(e.clientX, e.clientY); });
      el.addEventListener("mouseleave", function () { tip.classList.remove("on"); });
      el.addEventListener("touchstart", function (e) { var t = e.touches[0]; show(el, t.clientX, t.clientY); }, { passive: true });
    });
    document.addEventListener("touchstart", function (e) { if (!e.target.closest("[data-tip]")) tip.classList.remove("on"); }, { passive: true });

    /* work filters */
    var chips = document.querySelectorAll(".chip[data-filter]");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.getAttribute("data-filter");
        chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
        document.querySelectorAll("[data-tags]").forEach(function (card) {
          card.hidden = !(f === "all" || card.getAttribute("data-tags").split(" ").indexOf(f) > -1);
        });
      });
    });

    /* case-study table of contents */
    var toc = document.querySelectorAll(".toc a");
    if (toc.length && "IntersectionObserver" in window) {
      var map = {}; toc.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting && map[en.target.id]) { toc.forEach(function (a) { a.classList.remove("on"); }); map[en.target.id].classList.add("on"); } });
      }, { rootMargin: "-30% 0px -60% 0px" });
      document.querySelectorAll(".cs-sec[id]").forEach(function (s) { so.observe(s); });
    }

    /* copy buttons */
    document.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var text = b.getAttribute("data-copy"), label = b.textContent;
        function done(ok) { b.textContent = ok ? "Copied" : "Select and copy"; setTimeout(function () { b.textContent = label; }, 1800); }
        try {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { selectIt(); done(false); });
        } catch (e) { selectIt(); done(false); }
        function selectIt() {
          var el = document.querySelector(b.getAttribute("data-copy-target") || "");
          if (!el) return; var r = document.createRange(); r.selectNodeContents(el);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        }
      });
    });
  });
})();
