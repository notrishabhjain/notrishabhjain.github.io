"""Shared page shell. Every link is relative, so the site works at a domain root,
under a /repo/ project path, or as a preview, without changes."""
from html import escape as e

SITE = "https://notrishabhjain.github.io"  # canonical base; change when the international site gets its own address
EMAIL = "rishabh.jain@outlook.in"
LINKEDIN = "https://www.linkedin.com/in/notrishabhjain"
RESUME = "files/Rishabh_Jain_Resume.pdf"

NAV = [("work/", "Work"), ("experience/", "Experience"), ("services/", "Services"), ("about/", "About"), ("contact/", "Contact")]


def page(path, title, desc, body, active=None, schema=None):
    depth = path.count("/")
    r = "../" * depth
    cur = ' aria-current="page"'
    nav = "".join(f'<a href="{r}{href}"{cur if active == href else ""}>{label}</a>' for href, label in NAV)
    ld = f'<script type="application/ld+json">{schema}</script>' if schema else ""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="author" content="Rishabh Jain">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0e1530">
<link rel="icon" href="{r}favicon.png">
<link rel="preload" href="{r}assets/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{r}assets/css/site.css">
<script>(function(){{var d=document.documentElement;d.classList.add('js');try{{var t=localStorage.getItem('rj-theme');if(t==='dark'||t==='light')d.setAttribute('data-theme',t)}}catch(x){{}}}})();</script>
<script src="{r}assets/js/site.js" defer></script>
{ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap head-row">
    <a class="brand" href="{r or './'}" aria-label="Rishabh Jain, home">
      <span class="brand-mark">RJ</span>
      <span>Rishabh Jain<small>Project &amp; Programme Manager</small></span>
    </a>
    <nav class="nav" id="nav" aria-label="Main">{nav}</nav>
    <div class="head-actions">
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch theme"></button>
      <a class="btn btn-primary btn-sm btn-hire" href="{r}contact/">Let’s talk <span class="arr">→</span></a>
      <button class="icon-btn menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      </button>
    </div>
  </div>
</header>
<main id="main">
{body.replace("{R}", r)}
</main>
<footer class="site-foot">
  <div class="wrap foot-row">
    <span>© 2026 Rishabh Jain · New Delhi, India · Remote worldwide</span>
    <div class="foot-links">
      <a href="{r}work/">Work</a><a href="{r}experience/">Experience</a><a href="{r}services/">Services</a><a href="{r}about/">About</a><a href="{r}contact/">Contact</a>
      <a href="{LINKEDIN}" rel="noopener">LinkedIn</a><a href="{r}{RESUME}">Résumé (PDF)</a>
    </div>
  </div>
</footer>
</body>
</html>
"""


def cta(title="Have a programme with a date that can’t move?",
        text="I’m open to full-time remote roles and selected contract engagements with teams in the UK, Europe, the Middle East, APAC and North America."):
    return f"""<section><div class="wrap"><div class="cta reveal">
  <div class="cta-copy"><span class="eyebrow" style="color:#9298b1">Next step</span><h2>{e(title)}</h2><p>{e(text)}</p></div>
  <div class="cta-actions">
    <a class="btn btn-primary" href="{{R}}contact/">Start a conversation <span class="arr">→</span></a>
    <a class="btn btn-ghost" href="{{R}}{RESUME}">Download résumé</a>
  </div>
</div></div></section>"""
