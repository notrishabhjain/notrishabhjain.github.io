"""Small inline-SVG chart helpers. Every mark is placed with one linear scale,
every chart ships a caption, an aria-label, a hover tip per mark and a table view.
Colours come from CSS classes (s1 blue, s2 orange, s3 aqua, sm muted, sk ink)."""
from html import escape as e

_uid = [0]


def _id():
    _uid[0] += 1
    return f"c{_uid[0]}"


def _svg(w, h, label, body, minw=None):
    mw = f' style="min-width:{minw}px"' if minw else ""
    return (f'<div class="chart-scroll"><svg viewBox="0 0 {w} {h}" role="img" aria-label="{e(label)}"{mw}>'
            f'{body}</svg></div>')


def _table(headers, rows):
    th = "".join(f"<th>{e(h)}</th>" for h in headers)
    tr = "".join("<tr>" + "".join(f"<td>{e(str(c))}</td>" for c in r) + "</tr>" for r in rows)
    return (f'<details><summary>View the numbers as a table</summary><div class="tbl-wrap">'
            f'<table class="data"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div></details>')


def figure(title, sub, svg, caption, table, legend=None, wide=False):
    lg = ""
    if legend:
        lg = '<div class="legend">' + "".join(f'<span><i class="{c}"></i>{e(t)}</span>' for c, t in legend) + "</div>"
    cls = "chart wide" if wide else "chart"
    return (f'<figure class="{cls} reveal"><div class="chart-head"><h3>{e(title)}</h3>'
            f'{"<p>"+e(sub)+"</p>" if sub else ""}</div>{lg}{svg}'
            f'<figcaption>{caption}</figcaption>{table}</figure>')


def hbar(rows, vmax, label, unit_fmt=None, w=700, label_w=150, row_h=44, ticks=None, minw=460):
    """rows: (label, value, display, cls, tip). Value labels sit at the bar end."""
    pad_r = 90
    plot_w = w - label_w - pad_r
    h = len(rows) * row_h + (26 if ticks else 8)
    sx = lambda v: label_w + plot_w * v / vmax
    out = []
    if ticks:
        for t, tl in ticks:
            x = sx(t)
            out.append(f'<line class="gl" x1="{x:.1f}" x2="{x:.1f}" y1="0" y2="{h-22}"/>'
                       f'<text x="{x:.1f}" y="{h-6}" text-anchor="middle">{e(tl)}</text>')
    for i, (lab, v, disp, cls, tip) in enumerate(rows):
        y = i * row_h + 8
        bh = row_h - 18
        x1 = sx(v)
        bw = max(x1 - label_w, 3)
        out.append(f'<text x="{label_w-12}" y="{y+bh/2+4:.1f}" text-anchor="end">{e(lab)}</text>')
        out.append(f'<rect class="{cls}" x="{label_w}" y="{y}" width="{bw:.1f}" height="{bh}" rx="4" data-tip="{e(tip)}"/>')
        out.append(f'<text class="v" x="{label_w+bw+8:.1f}" y="{y+bh/2+4:.1f}">{e(disp)}</text>')
    out.append(f'<line class="ax" x1="{label_w}" x2="{label_w}" y1="2" y2="{len(rows)*row_h}"/>')
    return _svg(w, h, label, "".join(out), minw)


def stacked(segments, total, label, w=700, h=96, minw=440, caption_total=None):
    """One horizontal stacked bar. segments: (label, value, cls, tip). 2px surface gap between fills."""
    x0, pw = 10, w - 20
    out, x = [], x0
    for i, (lab, v, cls, tip) in enumerate(segments):
        sw = pw * v / total
        gap = 2 if i < len(segments) - 1 else 0
        out.append(f'<rect class="{cls}" x="{x:.1f}" y="18" width="{max(sw-gap,2):.1f}" height="34" rx="4" data-tip="{e(tip)}"/>')
        tx = x + 10
        out.append(f'<text class="v" x="{tx:.1f}" y="74">{e(lab)}</text>')
        x += sw
    if caption_total:
        out.append(f'<text x="{w-10}" y="12" text-anchor="end">{e(caption_total)}</text>')
    return _svg(w, h, label, "".join(out), minw)


def gantt(rows, start, end, label, w=640, label_w=118, row_h=30, years=None, minw=520, now_label=None):
    """rows: (label, start_year_float, end_year_float, cls, tip, sublabel)."""
    pad_r = 14
    plot_w = w - label_w - pad_r
    top = 6
    h = top + len(rows) * row_h + 30
    sx = lambda t: label_w + plot_w * (t - start) / (end - start)
    out = []
    for yv in (years or []):
        x = sx(yv)
        out.append(f'<line class="gl" x1="{x:.1f}" x2="{x:.1f}" y1="0" y2="{h-24}"/>'
                   f'<text x="{x:.1f}" y="{h-8}" text-anchor="middle">{yv}</text>')
    for i, (lab, a, b, cls, tip, sub) in enumerate(rows):
        y = top + i * row_h
        bh = row_h - 10
        out.append(f'<text x="{label_w-10}" y="{y+bh/2+4:.1f}" text-anchor="end">{e(lab)}</text>')
        out.append(f'<rect class="{cls}" x="{sx(a):.1f}" y="{y}" width="{max(sx(b)-sx(a)-2,4):.1f}" height="{bh}" rx="4" data-tip="{e(tip)}"/>')
        if sub:
            bw = sx(b) - sx(a)
            if bw > 70:
                out.append(f'<text x="{sx(a)+8:.1f}" y="{y+bh/2+4:.1f}" style="fill:#fff;font-weight:600;font-size:11px">{e(sub)}</text>')
    if now_label:
        x = sx(end) - 1
        out.append(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="0" y2="{h-24}" class="ax" stroke-dasharray="3 3"/>')
    return _svg(w, h, label, "".join(out), minw)


def milestones(items, label, w=680, minw=560, start=0, end=1, ticks=None):
    """items: (pos 0..1 in [start,end], title, sub, accent:bool). Alternates above/below a rail."""
    l, r = 24, w - 24
    sx = lambda t: l + (r - l) * (t - start) / (end - start)
    rail_y = 92
    h = 190
    out = [f'<line class="ax" x1="{l}" x2="{r}" y1="{rail_y}" y2="{rail_y}" style="stroke-width:2"/>']
    for t, tl in (ticks or []):
        x = sx(t)
        out.append(f'<line class="ax" x1="{x:.1f}" x2="{x:.1f}" y1="{rail_y-4}" y2="{rail_y+4}"/>'
                   f'<text x="{x:.1f}" y="{rail_y+22}" text-anchor="middle" style="font-size:11px">{e(tl)}</text>')
    for i, (t, title, sub, acc) in enumerate(items):
        x = sx(t)
        up = i % 2 == 0
        cls = "s2" if acc else "s1"
        ty = rail_y - 46 if up else rail_y + 50
        anchor = "middle"
        if x < l + 60:
            anchor = "start"
        elif x > r - 60:
            anchor = "end"
        y1, y2 = (rail_y - 30, rail_y - 6) if up else (rail_y + 30, rail_y + 6)
        if not up:
            y1, y2 = rail_y + 32, rail_y + 6
        out.append(f'<line class="gl" x1="{x:.1f}" x2="{x:.1f}" y1="{y1}" y2="{y2}"/>')
        out.append(f'<circle class="{cls} ring" cx="{x:.1f}" cy="{rail_y}" r="7" data-tip="{e(title+" — "+sub)}"/>')
        out.append(f'<text class="v" x="{x:.1f}" y="{ty}" text-anchor="{anchor}">{e(title)}</text>')
        out.append(f'<text x="{x:.1f}" y="{ty+16}" text-anchor="{anchor}" style="font-size:11px">{e(sub)}</text>')
    return _svg(w, h, label, "".join(out), minw)


def line_points(points, vmin, vmax, label, w=700, h=280, minw=460, zero=True, fmt=lambda v: f"{v:+.0f}%"):
    """points: (xlabel, value, tip). Evenly spaced categorical x (milestones, not time)."""
    l, r, t, b = 52, w - 30, 22, h - 44
    sy = lambda v: b - (b - t) * (v - vmin) / (vmax - vmin)
    n = len(points)
    sx = lambda i: l + (r - l) * i / (n - 1)
    out = []
    for gv in range(int(vmin), int(vmax) + 1, 25):
        y = sy(gv)
        cls = "ax" if gv == 0 else "gl"
        out.append(f'<line class="{cls}" x1="{l}" x2="{r}" y1="{y:.1f}" y2="{y:.1f}"/>'
                   f'<text x="{l-8}" y="{y+4:.1f}" text-anchor="end">{gv:+d}%</text>' if gv else
                   f'<line class="{cls}" x1="{l}" x2="{r}" y1="{y:.1f}" y2="{y:.1f}" style="stroke-width:1.5"/>'
                   f'<text x="{l-8}" y="{y+4:.1f}" text-anchor="end">0</text>')
    pts = " ".join(f"{sx(i):.1f},{sy(v):.1f}" for i, (_, v, _) in enumerate(points))
    out.append(f'<polyline points="{pts}" fill="none" class="st1" style="stroke-width:2.5;stroke-linejoin:round"/>')
    for i, (xl, v, tip) in enumerate(points):
        x, y = sx(i), sy(v)
        cls = "s2" if v < 0 else "s1"
        out.append(f'<circle class="{cls} ring" cx="{x:.1f}" cy="{y:.1f}" r="7" data-tip="{e(tip)}"/>')
        if v < 0:
            dy, dx, anchor = 4, 14, "start"
        else:
            dy = -14
            anchor = "start" if i == 0 else ("end" if i == n - 1 else "middle")
            dx = 10 if i == 0 else (-10 if i == n - 1 else 0)
        out.append(f'<text class="v" x="{x+dx:.1f}" y="{y+dy:.1f}" text-anchor="{anchor}">{e(fmt(v))}</text>')
        out.append(f'<text x="{x:.1f}" y="{h-12}" text-anchor="{"start" if i==0 else ("end" if i==n-1 else "middle")}">{e(xl)}</text>')
    return _svg(w, h, label, "".join(out), minw)


def flow(steps, label, w=680, minw=600, box_h=64):
    """steps: (title, owner, cls_or_None). Left-to-right boxes with arrows, wraps to 2 rows if > 4."""
    per_row = 4 if len(steps) > 4 else len(steps)
    rows = (len(steps) + per_row - 1) // per_row
    gap = 26
    bw = (w - 4 - gap * (per_row - 1)) / per_row
    h = rows * box_h + (rows - 1) * 34 + 6
    mid = _id()
    out = [f'<defs><marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
           f'<path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>']
    pos = []
    for i, (title, owner, accent) in enumerate(steps):
        rr, cc = divmod(i, per_row)
        x = 2 + cc * (bw + gap)
        y = 3 + rr * (box_h + 34)
        pos.append((x, y))
        fill = 'style="fill:var(--accent-soft);stroke:var(--accent)"' if accent else 'style="fill:var(--bg-2);stroke:var(--line-2)"'
        out.append(f'<rect x="{x:.1f}" y="{y}" width="{bw:.1f}" height="{box_h}" rx="10" {fill} data-tip="{e(title+" — "+owner)}"/>')
        out.append(f'<text class="v" x="{x+12:.1f}" y="{y+26}" style="font-size:12.5px">{e(title)}</text>')
        out.append(f'<text x="{x+12:.1f}" y="{y+46}" style="font-size:11px">{e(owner)}</text>')
    for i in range(len(steps) - 1):
        (x1, y1), (x2, y2) = pos[i], pos[i + 1]
        if y1 == y2:
            out.append(f'<line x1="{x1+bw+3:.1f}" y1="{y1+box_h/2}" x2="{x2-4:.1f}" y2="{y2+box_h/2}" stroke="currentColor" style="color:var(--muted)" stroke-width="1.5" marker-end="url(#{mid})"/>')
        else:
            out.append(f'<path d="M{x1+bw/2:.1f},{y1+box_h+2} V{y1+box_h+17} H{x2+bw/2:.1f} V{y2-4}" fill="none" stroke="currentColor" style="color:var(--muted)" stroke-width="1.5" marker-end="url(#{mid})"/>')
    return f'<div style="color:var(--muted)">' + _svg(w, h, label, "".join(out), minw) + "</div>"


table = _table
