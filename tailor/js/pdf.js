// Dependency-free PDF writer for the resume.
// Generated directly, so there is no print dialog and no browser header, footer, URL or file name.
// Uses the standard Helvetica family (always available to PDF readers) with WinAnsi encoding; text is
// real, selectable and in reading order for applicant tracking systems.

import { glue } from './grammar.js';

// ---- font metrics (Adobe standard AFM widths, 1/1000 em) ----------------------------

const REG = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778,
  722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778,
  722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556,
  278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
const HIGH = { // WinAnsi 128-255 that matter here: [regular, bold]
  0x80: [556, 556], 0x85: [1000, 1000], 0x91: [222, 278], 0x92: [222, 278], 0x93: [333, 500], 0x94: [333, 500], 0x95: [350, 350],
  0x96: [556, 556], 0x97: [1000, 1000], 0x99: [1000, 1000], 0xA0: [278, 278], 0xA3: [556, 556], 0xA9: [737, 737], 0xAE: [737, 737],
  0xB0: [400, 400], 0xB7: [278, 278], 0xD7: [584, 584]
};

function width(code, bold) {
  if (code >= 32 && code <= 126) return (bold ? BOLD : REG)[code - 32];
  const h = HIGH[code];
  return h ? h[bold ? 1 : 0] : 556;
}

// ---- encoding -------------------------------------------------------------------

const WIN = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89,
  0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95,
  0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
};
const FALLBACK = { '₹': 'Rs ', '≈': '~', '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '±': '+/-', '✓': 'v', '−': '-', ' ': ' ' };

/** String -> array of WinAnsi codes. */
function encode(str) {
  const out = [];
  for (const ch of str) {
    if (FALLBACK[ch]) { for (const c of FALLBACK[ch]) out.push(c.charCodeAt(0)); continue; }
    const cp = ch.codePointAt(0);
    if (cp < 128) out.push(cp);
    else if (WIN[cp]) out.push(WIN[cp]);
    else if (cp >= 0xA0 && cp <= 0xFF) out.push(cp);
    else out.push(0x3F); // '?'
  }
  return out;
}

function pdfString(codes) {
  let s = '(';
  for (const c of codes) {
    if (c === 0x28 || c === 0x29 || c === 0x5C) s += '\\' + String.fromCharCode(c);
    else if (c < 32 || c > 126) s += '\\' + c.toString(8).padStart(3, '0');
    else s += String.fromCharCode(c);
  }
  return s + ')';
}

const FONTS = { R: { name: 'F1', bold: false }, B: { name: 'F2', bold: true }, I: { name: 'F3', bold: false } };

function measure(text, font, size) {
  let w = 0;
  for (const c of encode(text)) w += width(c, FONTS[font].bold);
  return (w * size) / 1000;
}

// ---- layout ---------------------------------------------------------------------

const PAGE_W = 595.28, PAGE_H = 841.89;
const M = { left: 46, right: 46, top: 44, bottom: 46 };
const TEXT_W = PAGE_W - M.left - M.right;

/** Break runs [{text, font, size, gray}] into lines no wider than maxW. */
function wrap(runs, maxW) {
  const words = [];
  for (const r of runs) {
    const parts = glue(r.text).split(/([ \t\n]+)/).filter(Boolean);
    for (const p of parts) words.push({ ...r, text: p, space: /^[ \t\n]+$/.test(p) });
  }
  const lines = [];
  let line = [], w = 0;
  for (const wd of words) {
    if (wd.space) {
      if (line.length) { line.push({ ...wd, text: ' ' }); w += measure(' ', wd.font, wd.size); }
      continue;
    }
    const ww = measure(wd.text, wd.font, wd.size);
    if (w + ww > maxW && line.length) {
      while (line.length && line[line.length - 1].space) line.pop();
      lines.push(line);
      line = []; w = 0;
    }
    line.push(wd); w += ww;
  }
  while (line.length && line[line.length - 1].space) line.pop();
  if (line.length) lines.push(line);
  // merge adjacent pieces with the same style so each line is a few Tj calls
  return lines.map(l => l.reduce((acc, p) => {
    const last = acc[acc.length - 1];
    if (last && last.font === p.font && last.size === p.size && last.gray === p.gray) last.text += p.text;
    else acc.push({ text: p.text, font: p.font, size: p.size, gray: p.gray });
    return acc;
  }, []));
}

class Writer {
  constructor() { this.pages = []; this.newPage(); }
  newPage() { this.ops = []; this.pages.push(this.ops); this.y = PAGE_H - M.top; }
  ensure(h) { if (this.y - h < M.bottom) this.newPage(); }
  gap(h) { this.y -= h; }
  line(runs, x, leading) {
    this.y -= leading;
    let s = `BT ${x.toFixed(2)} ${this.y.toFixed(2)} Td`;
    for (const r of runs) {
      s += ` ${r.gray != null ? r.gray : 0} g /${FONTS[r.font].name} ${r.size} Tf ${r.spacing ? r.spacing + ' Tc ' : ''}${pdfString(encode(r.text))} Tj${r.spacing ? ' 0 Tc' : ''}`;
    }
    this.ops.push(s + ' ET');
  }
  para(runs, { x = M.left, w = TEXT_W, leading = 12.8, firstX = null } = {}) {
    const lines = wrap(runs, w);
    lines.forEach((l, k) => { this.ensure(leading); this.line(l, k === 0 && firstX != null ? firstX : x, leading); });
    return lines.length;
  }
  rule(y) {
    this.ops.push(`0.55 G 0.6 w ${M.left} ${y.toFixed(2)} m ${(PAGE_W - M.right).toFixed(2)} ${y.toFixed(2)} l S`);
  }
}

/** Build the PDF bytes for a composed resume. */
export function buildPdf(r, when = new Date()) {
  const p = r.person;
  const W = new Writer();
  const body = 9.8, lead = 12.9;

  W.line([{ text: p.name, font: 'B', size: 17 }], M.left, 17);
  W.gap(2);
  W.para([{ text: r.headline, font: 'R', size: 10.5 }], { leading: 14 });
  W.para([{ text: [p.location, p.email, p.phone, p.linkedin, p.website].filter(Boolean).join('  |  '), font: 'R', size: 9.2, gray: 0.25 }], { leading: 12.5 });

  const heading = (t, keep = 40) => {
    W.gap(10);
    W.ensure(keep);
    W.line([{ text: t.toUpperCase(), font: 'B', size: 10.4, spacing: 0.6 }], M.left, 12);
    W.rule(W.y - 3.5);
    W.gap(7);
  };

  heading('Professional Summary');
  W.para([{ text: r.summary, font: 'R', size: body }], { leading: lead });

  heading('Core Competencies');
  for (const g of r.skills) {
    W.para([{ text: g.label + ': ', font: 'B', size: body }, { text: g.items.map(i => i.label).join(', '), font: 'R', size: body }], { leading: lead });
    W.gap(1.5);
  }

  heading('Professional Experience', 60);
  r.roles.filter(x => x.bullets.length).forEach((role, k) => {
    if (k) W.gap(7);
    W.ensure(45);
    W.line([{ text: role.title, font: 'B', size: 10.3 }], M.left, 13);
    const meta = [{ text: [role.company, role.location, role.dates].filter(Boolean).join('  |  '), font: 'R', size: 9.3, gray: 0.25 }];
    if (role.client) meta.push({ text: '  |  Client: ' + role.client, font: 'I', size: 9.3, gray: 0.25 });
    W.para(meta, { leading: 12.4 });
    W.gap(2);
    for (const b of role.bullets) {
      const lines = wrap([{ text: b.text, font: 'R', size: body }], TEXT_W - 13);
      W.ensure(lead * Math.min(lines.length, 2));
      lines.forEach((l, i) => {
        W.ensure(lead);
        if (i === 0) {
          W.y -= lead;
          W.ops.push(`BT ${(M.left + 3).toFixed(2)} ${W.y.toFixed(2)} Td 0 g /F1 ${body} Tf ${pdfString([0x95])} Tj ET`);
          W.y += lead;
        }
        W.line(l, M.left + 13, lead);
      });
      W.gap(2.2);
    }
  });

  heading('Education');
  for (const e of r.education) W.para([{ text: e.degree, font: 'B', size: body }, { text: `, ${e.school}, ${e.year}`, font: 'R', size: body }], { leading: lead });
  heading('Certifications');
  for (const c of r.certifications) W.para([{ text: c.name, font: 'R', size: body }, { text: c.issuer ? `, ${c.issuer}` : '', font: 'R', size: body, gray: 0.25 }], { leading: lead });

  return serialise(W.pages, { title: `${p.name} Resume`, author: p.name, when });
}

function serialise(pages, info) {
  const objs = [];
  const add = (s) => { objs.push(s); return objs.length; };
  const catalog = add(null), pagesObj = add(null);
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const f3 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
  const kids = [];
  for (const ops of pages) {
    const stream = ops.join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objs[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  const d = info.when;
  const z = (n) => String(n).padStart(2, '0');
  const date = `D:${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}${z(d.getUTCHours())}${z(d.getUTCMinutes())}${z(d.getUTCSeconds())}Z`;
  const infoObj = add(`<< /Title ${pdfString(encode(info.title))} /Author ${pdfString(encode(info.author))} /Producer (Tailor) /CreationDate (${date}) >>`);

  // All content is ASCII (non-ASCII is octal-escaped), so string length equals byte length.
  let out = '%PDF-1.4\n%âãÏÓ\n';
  const offsets = [];
  objs.forEach((o, k) => { offsets.push(out.length); out += `${k + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${infoObj} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}
