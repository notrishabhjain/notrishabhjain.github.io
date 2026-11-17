// ATS self-check: read the exported file back the way a parser would and test what survived.

import { tokenize } from './text.js';
import { findSkills } from './taxonomy.js';
import { docxText, HEADINGS } from './docx.js';

const CHARS_PER_LINE = 112;   // 10pt Calibri across an A4 page with ~16mm margins
const LINES_PER_PAGE = 62;

/**
 * resume: composed resume; bytes: the .docx; ctx: { idx, match, resumeText }
 * Returns { checks: [{ok, label, detail}], pages, text }
 */
export function atsCheck(resume, bytes, ctx) {
  const { text, xml, files } = docxText(bytes);
  const lines = text.split('\n');
  const checks = [];
  const add = (ok, label, detail) => checks.push({ ok, label, detail });

  // structure
  const layoutBad = /<w:tbl\b|<w:drawing\b|<w:txbxContent\b|<w:pict\b|<w:object\b/.test(xml);
  const headerFooter = files.some(f => /word\/(header|footer)\d*\.xml/.test(f));
  add(!layoutBad && !headerFooter, 'Single column, no tables, text boxes, images, headers or footers',
    layoutBad ? 'The document contains layout a parser may skip.' : 'Everything is in the body, in reading order.');

  // contact
  const top = lines.slice(0, 4).join(' ');
  const email = resume.person.email && top.includes(resume.person.email);
  add(!!email, 'Contact details are in the body text', email ? `${resume.person.email} found in the first lines.` : 'The email address is missing from the top of the document.');

  // headings in order
  let last = -1, inOrder = true;
  const missing = [];
  for (const h of HEADINGS) {
    const at = lines.findIndex(l => l.trim().toLowerCase() === h.toLowerCase());
    if (at < 0) { missing.push(h); continue; }
    if (at < last) inOrder = false;
    last = at;
  }
  add(!missing.length && inOrder, 'Standard section headings, in the expected order',
    missing.length ? `Missing: ${missing.join(', ')}` : HEADINGS.join(' → '));

  // dates
  const dates = resume.roles.filter(r => r.bullets.length).map(r => r.dates);
  const consistent = dates.every(d => /^[A-Z][a-z]{2} \d{4} – ([A-Z][a-z]{2} \d{4}|Present)$/.test(d));
  add(consistent, 'Dates in one consistent format', dates.slice(0, 2).join('; ') + (dates.length > 2 ? '; …' : ''));

  // keywords: every JD skill the preview shows must still be found in the file's own text
  const preview = ctx.resumeText(resume);
  const want = new Map();
  for (const m of findSkills(tokenize(preview), ctx.idx, preview, { ext: false })) {
    const row = ctx.match.rows.find(r => r.id === m.id);
    if (row) want.set(m.id, row.name);
  }
  const got = new Set(findSkills(tokenize(text), ctx.idx, text, { ext: false }).map(m => m.id));
  const lost = [...want].filter(([id]) => !got.has(id)).map(([, n]) => n);
  add(!lost.length, `JD keywords readable in the file (${want.size - lost.length}/${want.size})`,
    lost.length ? `Not found after export: ${lost.join(', ')}` : 'Every keyword in the preview is present in the exported text.');

  // must-haves
  const must = ctx.match.rows.filter(r => (r.must || r.tier === 'critical') && r.cat !== 'soft');
  const mustIn = must.filter(r => got.has(r.id));
  const mustGap = must.filter(r => r.status === 'gap').map(r => r.name);
  add(mustIn.length >= Math.ceil(0.6 * must.length), `Must-have skills present (${mustIn.length}/${must.length})`,
    mustGap.length ? `Gaps you cannot claim: ${mustGap.join(', ')}` : 'No must-have gaps.');

  // length
  const est = lines.reduce((a, l) => a + Math.max(1, Math.ceil(l.length / CHARS_PER_LINE)), 0) + 14;
  const pages = Math.round((est / LINES_PER_PAGE) * 10) / 10;
  add(pages <= 2.2, `Length about ${pages} pages`, pages > 2.2 ? 'Over two pages; consider unpinning or removing a few bullets.' : 'Within two pages.');

  // characters some parsers mangle
  const odd = [...new Set(text.match(/[^\x00-\x7F£€₹–—•·×’“”~\u00a0]/g) || [])];
  add(!odd.length, 'No unusual characters', odd.length ? `Check: ${odd.join(' ')}` : 'Plain text characters only.');

  return { checks, pages, text };
}
