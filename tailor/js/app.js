// Tailor browser app. All processing happens here, in the browser; nothing is sent anywhere.

import { createEngine } from './engine.js';
import { buildDocx } from './docx.js';
import { atsCheck } from './ats.js';
import { tokenize, escapeHtml as esc, slug } from './text.js';
import { findSkills } from './taxonomy.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const store = {
  get(k, d) { try { const v = localStorage.getItem('tailor.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('tailor.' + k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem('tailor.' + k); } catch { /* ignore */ } }
};

// Optional extended library: ~31k skill names from the open-source SkillNER project
// (derived from the Lightcast/EMSI Open Skills list). Fetched only when switched on, then cached.
const EXT_URL = 'https://raw.githubusercontent.com/AnasAito/SkillNER/master/buckets/skill_db_relax_20.json';

const CATEGORIES = [
  ['delivery', 'Delivery and governance'], ['product', 'Product and analysis'], ['commercial', 'Commercial'],
  ['leadership', 'Leadership and stakeholders'], ['engineering', 'Technology'], ['tool', 'Tools'],
  ['compliance', 'Compliance and standards'], ['govt', 'Government'], ['domain', 'Industry'], ['cert', 'Certification']
];

const S = {
  data: null, profile: null, userSkills: [], ignored: new Set(), corpus: { n: 0, df: {}, seen: [] },
  extOn: false, ext: null, extStatus: '', engine: null,
  hash: null, jd: null, match: null, resume: null, overrides: {}, ats: null, docx: null,
  filter: 'all', focus: null, editing: null
};

// ---------------------------------------------------------------- boot

async function boot() {
  try {
    const [skillsTxt, profile, rules] = await Promise.all([
      fetch('data/skills.txt').then(r => r.text()),
      fetch('data/profile.json').then(r => r.json()),
      fetch('data/rules.json').then(r => r.json())
    ]);
    S.data = { skillsTxt, profile, rules };
  } catch (e) {
    $('#status').textContent = 'Could not load the data files. Serve this folder over http(s), not file://.';
    return;
  }
  S.profile = store.get('profile', null) || S.data.profile;
  S.userSkills = store.get('userSkills', []);
  S.ignored = new Set(store.get('ignored', []));
  S.corpus = store.get('corpus', { n: 0, df: {}, seen: [] });
  S.extOn = store.get('ext', false);
  if (S.extOn) await loadExtended(false);
  rebuild();
  wire();
  const last = store.get('lastJD', '');
  if (last) { $('#jdInput').value = last; analyse(false); }
}

function rebuild() {
  try {
    S.engine = createEngine({
      skillsTxt: S.data.skillsTxt, profile: S.profile, rules: S.data.rules,
      userSkills: S.userSkills, extended: S.extOn && S.ext ? S.ext : null
    });
  } catch (e) {
    toast('The profile could not be read: ' + e.message);
    S.profile = S.data.profile;
    S.engine = createEngine({ skillsTxt: S.data.skillsTxt, profile: S.profile, rules: S.data.rules, userSkills: S.userSkills });
  }
  const e = S.engine;
  const bits = [`${e.tax.skills.size} skills`, `${e.pidx.achievements.size} achievements`];
  if (e.extCount) bits.push(`+${e.extCount.toLocaleString()} extended`);
  if (S.corpus.n) bits.push(`${S.corpus.n} JDs seen`);
  $('#status').textContent = bits.join(' · ') + ' · no AI, runs in your browser';
}

async function loadExtended(fetchIfMissing = true) {
  S.extStatus = 'Loading…';
  try {
    let res = null, cache = null;
    if ('caches' in window) { cache = await caches.open('tailor-ext'); res = await cache.match(EXT_URL); }
    if (!res) {
      if (!fetchIfMissing) { S.extStatus = 'Not downloaded yet'; return false; }
      res = await fetch(EXT_URL, { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (cache) await cache.put(EXT_URL, res.clone());
    }
    const json = await res.json();
    S.ext = Object.values(json).map(v => ({ name: v.skill_name, type: v.skill_type }));
    S.extStatus = `${S.ext.length.toLocaleString()} names loaded`;
    return true;
  } catch (e) {
    S.ext = null;
    S.extStatus = 'Could not load: ' + e.message;
    return false;
  }
}

// ---------------------------------------------------------------- analysis

function hashOf(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

function analyse(focusResume = true) {
  const text = $('#jdInput').value.trim();
  if (!text) { toast('Paste a job description first.'); return; }
  store.set('lastJD', text);
  S.hash = hashOf(text);
  S.overrides = store.get('ov.' + S.hash, {});
  const { jd, match } = S.engine.analyze(text, { corpus: S.corpus, ignored: S.ignored, ext: S.extOn });
  S.jd = jd; S.match = match; S.focus = null;
  addToCorpus(S.hash, jd);
  compose();
  showRead(true);
  renderJD();
  renderMatch();
  if (focusResume && matchMedia('(max-width:1100px)').matches) showPane('matchPane');
}

function addToCorpus(hash, jd) {
  const c = S.corpus;
  if (c.seen.includes(hash)) return;
  c.seen.push(hash);
  if (c.seen.length > 400) c.seen.shift();
  c.n++;
  for (const s of jd.skills) if (!s.ext) c.df[s.id] = (c.df[s.id] || 0) + 1;
  store.set('corpus', c);
}

function compose() {
  S.resume = S.engine.compose(S.jd, S.match, { overrides: S.overrides });
  S.docx = buildDocx(S.resume);
  S.ats = atsCheck(S.resume, S.docx, { idx: S.engine.idx, match: S.match, resumeText: S.engine.resumeText });
  renderResume();
  for (const id of ['#docxBtn', '#printBtn', '#copyBtn']) $(id).disabled = false;
  $('#resetBtn').disabled = !Object.keys(S.overrides).length;
}

function saveOverrides() {
  if (Object.keys(S.overrides).length) store.set('ov.' + S.hash, S.overrides);
  else store.del('ov.' + S.hash);
}

// ---------------------------------------------------------------- JD pane

function showRead(on) {
  $('#jdInput').hidden = on;
  $('#jdRead').hidden = !on;
  $('#editJd').hidden = !on;
  $('#analyseBtn').textContent = on ? 'Re-analyse' : 'Analyse';
}

function statusOf(id) {
  const row = S.match.rows.find(r => r.id === id);
  return row ? row.status : 'gap';
}

function renderJD() {
  const jd = S.jd;
  const meta = [
    ['Title', jd.title ? esc(jd.title.text) : '<span style="color:var(--ink-3)">not detected</span>'],
    ['Sector', jd.sector === 'public' ? 'Public sector' : 'Private sector'],
    ['Experience asked', jd.years ? `${jd.years}+ yrs <span style="color:var(--ink-3)">(you: ${S.match.years.profile})</span>` : '—'],
    ['Sections', String(jd.sections.length)]
  ];
  $('#jdMeta').innerHTML = meta.map(([k, v]) => `<div><span class="label">${k}</span><b>${v}</b></div>`).join('');

  const spans = [];
  for (const s of jd.skills) {
    const row = S.match.rows.find(r => r.id === s.id);
    const cls = s.cat === 'soft' ? 'soft' : row ? row.status : 'gap';
    for (const m of s.mentions) spans.push({ s: m.s, e: m.e, cls, id: s.id, title: `${s.name} · ${row ? row.status : ''} · weight ${s.score}` });
  }
  for (const u of jd.unknown) for (const sp of u.spans) spans.push({ s: sp.s, e: sp.e, cls: 'unk', id: 'unk:' + u.key, title: 'Not in the skills library: ' + u.term });
  spans.sort((a, b) => a.s - b.s || b.e - a.e);
  let html = '', pos = 0;
  const text = jd.text;
  for (const sp of spans) {
    if (sp.s < pos) continue;
    html += esc(text.slice(pos, sp.s));
    html += `<mark class="${sp.cls}" data-id="${esc(sp.id)}" title="${esc(sp.title)}">${esc(text.slice(sp.s, sp.e))}</mark>`;
    pos = sp.e;
  }
  html += esc(text.slice(pos));
  $('#jdView').innerHTML = html;
}

// ---------------------------------------------------------------- match pane

function renderMatch() {
  const m = S.match;
  const rows = m.rows.filter(r => r.weight >= 0.06 && r.cat !== 'role');
  const counts = { matched: 0, claimed: 0, related: 0, gap: 0 };
  for (const r of rows) counts[r.status]++;
  const show = rows.filter(r => S.filter === 'all' ? true : S.filter === 'partial' ? (r.status === 'related' || r.status === 'claimed') : r.status === S.filter);
  const ev = (r) => {
    if (!r.evidence.length) return r.via ? `via ${esc(r.via)}` : r.status === 'gap' ? 'No evidence in your profile, so it stays off the resume' : '';
    const a = S.engine.pidx.achievements.get(r.evidence[0]);
    return (r.via ? `via ${esc(r.via)} · ` : '') + esc((a.short || a.text).slice(0, 90));
  };
  const sorted = [...show].sort((a, b) => b.weight - a.weight);
  let h = `<div class="scores">
    <div><div class="label">Coverage</div><div class="big">${m.coverage}<small>%</small></div><div class="sub">weighted by importance</div></div>
    <div><div class="label">Must-haves</div><div class="big">${m.must.hit}<small>/${m.must.total}</small></div><div class="sub">backed by evidence</div></div>
    <div><div class="label">Experience</div><div class="big">${m.years.profile}<small> yrs</small></div><div class="sub">${m.years.asked ? (m.years.ok ? 'meets ' : 'below ') + m.years.asked + '+ asked' : 'no minimum stated'}</div></div>
  </div>
  <div class="legend"><span><i class="dot matched"></i>Matched: an achievement proves it</span><span><i class="dot related"></i>Partial: related skill or skills list</span><span><i class="dot gap"></i>Gap: never written in</span></div>
  <div class="filters" role="group" aria-label="Filter skills">
    ${[['all', `All ${rows.length}`], ['matched', `Matched ${counts.matched}`], ['partial', `Partial ${counts.related + counts.claimed}`], ['gap', `Gaps ${counts.gap}`]]
      .map(([k, l]) => `<button data-filter="${k}" aria-pressed="${S.filter === k}">${l}</button>`).join('')}
  </div>
  <ul class="rows">`;
  for (const r of sorted.slice(0, 80)) {
    h += `<li class="row${S.focus === r.id ? ' focus' : ''}" data-id="${esc(r.id)}" tabindex="0">
      <div class="w" title="weight ${r.score}"><i style="width:${Math.max(4, r.score)}%"></i></div>
      <div class="nm"><b>${esc(r.name)}</b>${r.tier === 'critical' ? '<span class="tier">critical</span>' : ''}${r.must && r.tier !== 'critical' ? '<span class="tier">must</span>' : ''}
        <small>${r.surface && r.surface.toLowerCase() !== r.name.toLowerCase() ? '“' + esc(r.surface) + '” · ' : ''}${ev(r)}</small></div>
      <span class="chip ${r.status}">${r.status === 'claimed' ? 'skills list' : r.status}</span>
    </li>`;
  }
  if (!sorted.length) h += '<li class="empty">Nothing here.</li>';
  h += '</ul>';

  // unknown terms inbox
  const unk = S.jd.unknown.filter(u => u.w >= 0.5).slice(0, 20);
  h += `<div class="block"><h3>Terms not in the library</h3>
    <p class="hint">Phrases the rules picked out of the JD that the skills library does not know yet. Add them once and every future JD benefits.</p>`;
  if (!unk.length) h += '<p class="empty">None. Every skill-like phrase was recognised.</p>';
  else {
    h += '<ul class="inbox">';
    for (const u of unk) {
      h += `<li data-key="${esc(u.key)}" data-term="${esc(u.term)}"><b>${esc(u.term)}</b><small>${u.count}× · ${u.why === 'cue' ? 'after “experience with…”' : u.why === 'shape' ? 'technical shape' : 'proper noun'}</small>
        <select aria-label="Category" class="cat">${CATEGORIES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <button class="btn quiet" data-act="add">Add</button><button class="btn quiet" data-act="alias">Alias of…</button><button class="btn quiet" data-act="ignore">Ignore</button>
        <div class="alias"><input list="skillNames" placeholder="Existing skill this means"><button class="btn quiet" data-act="aliasSave">Save</button></div></li>`;
    }
    h += '</ul>';
  }
  h += '</div>';
  if (!$('#skillNames')) {
    const dl = document.createElement('datalist');
    dl.id = 'skillNames';
    document.body.appendChild(dl);
  }
  $('#skillNames').innerHTML = [...S.engine.tax.skills.values()].filter(s => !s.abstract).map(s => `<option value="${esc(s.name)}">`).join('');
  $('#matchBody').innerHTML = h;
}

function focusSkill(id) {
  S.focus = S.focus === id ? null : id;
  applyFocus(true);
}

function applyFocus(scroll) {
  $$('#jdView mark').forEach(m => m.classList.toggle('focus', m.dataset.id === S.focus));
  $$('#matchBody .row').forEach(r => r.classList.toggle('focus', r.dataset.id === S.focus));
  const row = S.match.rows.find(r => r.id === S.focus);
  const ev = new Set(row ? row.evidence : []);
  $$('#resumeBody li.b').forEach(li => li.classList.toggle('ev', ev.has(li.dataset.id)));
  const first = scroll && $(`#jdView mark[data-id="${CSS.escape(S.focus || '')}"]`);
  if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// ---------------------------------------------------------------- resume pane

function markKeywords(text) {
  const jdIds = new Set(S.match.rows.filter(r => r.status !== 'gap' && r.cat !== 'soft').map(r => r.id));
  const ms = findSkills(tokenize(text), S.engine.idx, text, { ext: false }).filter(m => jdIds.has(m.id));
  let out = '', pos = 0;
  for (const m of ms) {
    out += esc(text.slice(pos, m.s)) + `<span class="kw" title="${esc(S.engine.tax.skills.get(m.id)?.name || '')}">${esc(text.slice(m.s, m.e))}</span>`;
    pos = m.e;
  }
  return out + esc(text.slice(pos));
}

const ICON = {
  prev: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7.5 2.5L4 6l3.5 3.5"/></svg>',
  next: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4.5 2.5L8 6l-3.5 3.5"/></svg>',
  pin: '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 1.8h4l-.6 3.6 2.3 2.2H3.3l2.3-2.2zM7 7.6v4.8"/></svg>',
  edit: '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 11.5l.6-2.6 6.6-6.6 2 2-6.6 6.6zM8.5 3.5l2 2"/></svg>',
  del: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg>'
};

function renderResume() {
  const r = S.resume, p = r.person;
  let h = `<article class="doc" aria-label="Resume preview">
    <h1>${esc(p.name)}</h1><p class="headline">${esc(r.headline)}</p>
    <p class="contact">${[p.location, p.email, p.phone, p.linkedin, p.website].filter(Boolean).map(esc).join(' | ')}</p>
    <h2>Professional Summary</h2><p>${markKeywords(r.summary)}</p>
    <h2>Core Competencies</h2><div class="skills">${r.skills.map(g => `<p><b>${esc(g.label)}:</b> ${g.items.map(i => esc(i.label)).join(', ')}</p>`).join('')}</div>
    <h2>Professional Experience</h2>`;
  for (const role of r.roles) {
    if (!role.bullets.length && !role.unused.length) continue;
    h += `<section class="role" data-role="${esc(role.id)}"><h3>${esc(role.title)}</h3>
      <div class="meta">${esc([role.company, role.location, role.dates].join(' | '))}${role.client ? ` | <i>Client: ${esc(role.client)}</i>` : ''}</div><ul>`;
    for (const b of role.bullets) {
      const idx = b.alts.findIndex(a => a.text === b.text);
      const n = b.alts.length;
      const notes = [b.verify ? `<span class="note" title="${esc(b.note || 'Only in the resume PDF; not yet confirmed in the dossier.')}">unconfirmed</span>` : '', b.manual ? '<span class="note">edited</span>' : ''].join('');
      h += `<li class="b${b.pinned ? ' pinned' : ''}" data-id="${esc(b.id)}"><span class="txt">${markKeywords(b.text)}</span>${notes}
        <span class="ctl">
          ${n > 1 && !b.manual ? `<button class="iconbtn" data-act="prev" aria-label="Previous wording">${ICON.prev}</button><span class="count">${idx >= 0 ? idx + 1 : '–'}/${n}</span><button class="iconbtn" data-act="next" aria-label="Next wording">${ICON.next}</button>` : ''}
          <button class="iconbtn" data-act="pin" aria-pressed="${b.pinned}" aria-label="Keep this line">${ICON.pin}</button>
          <button class="iconbtn" data-act="edit" aria-label="Edit by hand">${ICON.edit}</button>
          <button class="iconbtn" data-act="remove" aria-label="Remove this line">${ICON.del}</button>
        </span></li>`;
    }
    h += '</ul>';
    if (role.unused.length) {
      h += `<div class="addline"><select aria-label="Add a line from this role"><option value="">+ Add a line from ${esc(role.company)}…</option>${role.unused.map(id => {
        const a = S.engine.pidx.achievements.get(id);
        const t = a.text.replace(/\{\{([^|}]+)[^}]*\}\}/g, '$1');
        return `<option value="${esc(id)}">${esc(t.length > 90 ? t.slice(0, 88) + '…' : t)}</option>`;
      }).join('')}</select></div>`;
    }
    h += '</section>';
  }
  h += `<h2>Education</h2>${r.education.map(e => `<p><b>${esc(e.degree)}</b>, ${esc(e.school)}, ${esc(e.year)}</p>`).join('')}
    <h2>Certifications</h2>${r.certifications.map(c => `<p>${esc(c.name)}, <span style="color:var(--ink-2)">${esc(c.issuer)}</span></p>`).join('')}
  </article>`;

  // checks
  const ats = S.ats;
  const mark = (c) => c.ok ? '<span class="ok">✓</span>' : /Must-have|Length/.test(c.label) ? '<span class="warn">!</span>' : '<span class="bad">✕</span>';
  h += `<section class="checks"><h3>ATS self-check <span class="label">read back from the .docx</span></h3><ul>
    ${ats.checks.map(c => `<li>${mark(c)}<div>${esc(c.label)}<small>${esc(c.detail)}</small></div></li>`).join('')}</ul></section>`;
  const lint = r.lint.filter(l => l.level === 'warn');
  const info = r.lint.filter(l => l.level === 'info');
  h += `<section class="checks"><h3>Writing checks</h3><ul>
    ${lint.length ? lint.map(l => `<li><span class="warn">!</span><div>${esc(l.msg)}${l.where ? `<small>${esc(l.where)}…</small>` : ''}</div></li>`).join('') : '<li><span class="ok">✓</span><div>No filler words, repeated openers or keyword stuffing.</div></li>'}
    ${info.length ? `<li><span class="warn">i</span><div>${info.length} line${info.length > 1 ? 's' : ''} marked “unconfirmed” come from the resume PDF and have not been through the dossier yet.<small>Confirm or correct them in your profile.</small></div></li>` : ''}
    <li><span class="ok">✓</span><div>Every sentence was assembled from your own wording<small>The app rejects any candidate that uses a word not in that achievement's source text or an approved swap.</small></div></li>
  </ul></section>`;
  $('#resumeBody').innerHTML = h;
}

function bulletAction(li, act) {
  const id = li.dataset.id;
  const b = S.resume.roles.flatMap(r => r.bullets).find(x => x.id === id);
  const ov = S.overrides[id] || (S.overrides[id] = {});
  if (act === 'prev' || act === 'next') {
    const i = b.alts.findIndex(a => a.text === b.text);
    const j = (i + (act === 'next' ? 1 : -1) + b.alts.length) % b.alts.length;
    ov.pick = b.alts[j].text;
  } else if (act === 'pin') {
    ov.pin = !ov.pin;
  } else if (act === 'remove') {
    delete ov.pin; ov.exclude = true;
  } else if (act === 'edit') {
    const t = $('.txt', li);
    t.textContent = b.text;
    t.contentEditable = 'true';
    t.focus();
    document.getSelection().selectAllChildren(t);
    $('.ctl', li).classList.add('on');
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); t.blur(); } if (e.key === 'Escape') { t.textContent = b.text; t.blur(); } });
    t.addEventListener('blur', () => {
      const v = t.textContent.replace(/\s+/g, ' ').trim();
      if (v && v !== b.text) { ov.text = v; ov.pin = true; } else if (!v) { delete ov.text; }
      if (!Object.keys(ov).length) delete S.overrides[id];
      saveOverrides(); compose();
    }, { once: true });
    return;
  }
  for (const k of Object.keys(ov)) if (ov[k] == null || ov[k] === false) delete ov[k];
  if (!Object.keys(ov).length) delete S.overrides[id];
  saveOverrides();
  compose();
  if (S.focus) applyFocus(false);
}

// ---------------------------------------------------------------- exports

function fileBase() {
  const name = S.resume.person.name.replace(/\s+/g, '_');
  const t = S.jd && S.jd.title ? slug(S.jd.title.text).split('-').slice(0, 5).join('-') : 'tailored';
  return `${name}_Resume_${t}`;
}

function downloadDocx() {
  const blob = new Blob([S.docx], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileBase() + '.docx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Downloaded ' + a.download);
}

function printPdf() {
  const r = S.resume, p = r.person;
  $('#printRoot').innerHTML = `<h1>${esc(p.name)}</h1><p class="headline">${esc(r.headline)}</p>
    <p class="contact">${[p.location, p.email, p.phone, p.linkedin, p.website].filter(Boolean).map(esc).join(' | ')}</p>
    <h2>Professional Summary</h2><p>${esc(r.summary)}</p>
    <h2>Core Competencies</h2>${r.skills.map(g => `<p><b>${esc(g.label)}:</b> ${g.items.map(i => esc(i.label)).join(', ')}</p>`).join('')}
    <h2>Professional Experience</h2>${r.roles.filter(x => x.bullets.length).map(role => `<h3>${esc(role.title)}</h3>
      <div class="meta">${esc([role.company, role.location, role.dates].join(' | '))}${role.client ? ' | <i>Client: ' + esc(role.client) + '</i>' : ''}</div>
      <ul>${role.bullets.map(b => `<li>${esc(b.text)}</li>`).join('')}</ul>`).join('')}
    <h2>Education</h2>${r.education.map(e => `<p><b>${esc(e.degree)}</b>, ${esc(e.school)}, ${esc(e.year)}</p>`).join('')}
    <h2>Certifications</h2>${r.certifications.map(c => `<p>${esc(c.name)}, ${esc(c.issuer)}</p>`).join('')}`;
  const old = document.title;
  document.title = fileBase();
  window.print();
  document.title = old;
  toast('In the print dialog choose “Save as PDF” and untick headers and footers.');
}

async function copyText() {
  try { await navigator.clipboard.writeText(S.engine.resumeText(S.resume)); toast('Copied as plain text'); }
  catch { toast('Copy was blocked by the browser.'); }
}

// ---------------------------------------------------------------- dialogs

function openProfile() {
  const d = $('#profileDlg');
  const f = $('#contactForm');
  for (const k of ['name', 'location', 'email', 'phone', 'linkedin', 'website']) f.querySelector(`[name="${k}"]`).value = S.profile.person[k] || '';
  $('#profileJson').value = JSON.stringify(S.profile, null, 2);
  $('#profileMsg').textContent = store.get('profile', null) ? 'Using your edited profile, saved in this browser.' : 'Using the bundled profile. Edits are saved in this browser only.';
  $('#profileMsg').classList.remove('err');
  d.showModal();
}

function saveProfile() {
  let p;
  try { p = JSON.parse($('#profileJson').value); }
  catch (e) { $('#profileMsg').textContent = 'JSON error: ' + e.message; $('#profileMsg').classList.add('err'); return; }
  const f = $('#contactForm');
  p.person = p.person || {};
  for (const k of ['name', 'location', 'email', 'phone', 'linkedin', 'website']) p.person[k] = f.querySelector(`[name="${k}"]`).value.trim();
  let test;
  try { test = createEngine({ skillsTxt: S.data.skillsTxt, profile: p, rules: S.data.rules, userSkills: S.userSkills }); }
  catch (e) { $('#profileMsg').textContent = 'Profile error: ' + e.message; $('#profileMsg').classList.add('err'); return; }
  S.profile = p;
  if (!store.set('profile', p)) toast('Browser storage is unavailable; the change lasts until you close this tab.');
  rebuild();
  if (S.jd) analyse(false);
  const w = test.pidx.warnings;
  $('#profileMsg').classList.toggle('err', w.length > 0);
  $('#profileMsg').textContent = w.length ? `Saved with ${w.length} warning${w.length > 1 ? 's' : ''}: ${w.slice(0, 2).join('; ')}` : 'Saved.';
  $('#profileJson').value = JSON.stringify(p, null, 2);
}

function renderLibrary() {
  const us = S.userSkills, ig = [...S.ignored];
  $('#libraryBody').innerHTML = `
    <h3 style="font:500 16px/1.2 var(--display);margin:0 0 6px">Extended library</h3>
    <p class="hint" style="color:var(--ink-3);margin:0 0 8px;font-size:13px">About 31,000 extra skill names from the open-source SkillNER project (originally Lightcast Open Skills). They help recognise rare tools and niche skills. Downloaded once from GitHub (7 MB) and cached in this browser. Matches from it count for less than the core library.</p>
    <p style="display:flex;gap:10px;align-items:center;margin:0 0 18px"><button class="btn" id="extToggle">${S.extOn ? 'Turn off' : 'Turn on'}</button><span class="label">${esc(S.extOn ? S.extStatus || 'On' : 'Off')}</span></p>
    <h3 style="font:500 16px/1.2 var(--display);margin:0 0 6px">Skills you added (${us.length})</h3>
    ${us.length ? `<ul class="list">${us.map((u, i) => `<li><span><b>${esc(u.name)}</b>${u.aliases?.length ? ' · ' + esc(u.aliases.join(', ')) : ''} <span class="label">${esc(u.cat || '')}</span></span><button class="btn quiet" data-rm-skill="${i}">Remove</button></li>`).join('')}</ul>` : '<p class="empty">None yet. Add them from “Terms not in the library”.</p>'}
    <h3 style="font:500 16px/1.2 var(--display);margin:14px 0 6px">Ignored terms (${ig.length})</h3>
    ${ig.length ? `<ul class="list">${ig.map(k => `<li><span>${esc(k)}</span><button class="btn quiet" data-unignore="${esc(k)}">Restore</button></li>`).join('')}</ul>` : '<p class="empty">None.</p>'}
    <h3 style="font:500 16px/1.2 var(--display);margin:14px 0 6px">Job description history</h3>
    <p style="margin:0 0 8px;font-size:13px;color:var(--ink-2)">${S.corpus.n} JD${S.corpus.n === 1 ? '' : 's'} seen. From five onwards, skills that appear in almost every JD count for less and rare ones for more.</p>
    <button class="btn quiet" id="clearCorpus" ${S.corpus.n ? '' : 'disabled'}>Clear history</button>
    <p style="margin:16px 0 0;font-size:12.5px;color:var(--ink-3)">To make additions permanent for everyone who opens this page, add them to <span class="mono">tailor/data/skills.txt</span> in the repository.</p>`;
}

function libChanged() {
  store.set('userSkills', S.userSkills);
  store.set('ignored', [...S.ignored]);
  rebuild();
  if (S.jd) analyse(false);
  renderLibrary();
}

// ---------------------------------------------------------------- wiring

function showPane(id) {
  $$('.pane').forEach(p => p.classList.toggle('active', p.id === id));
  $$('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.pane === id)));
  window.scrollTo({ top: 0 });
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function wire() {
  $('#analyseBtn').addEventListener('click', () => analyse());
  $('#jdInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyse(); });
  $('#editJd').addEventListener('click', () => { showRead(false); $('#jdInput').focus(); });
  $$('.tabs button').forEach(b => b.addEventListener('click', () => showPane(b.dataset.pane)));

  $('#jdView').addEventListener('click', (e) => {
    const m = e.target.closest('mark');
    if (m && !m.dataset.id.startsWith('unk:')) focusSkill(m.dataset.id);
  });

  $('#matchBody').addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { S.filter = f.dataset.filter; renderMatch(); return; }
    const li = e.target.closest('.inbox li');
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (li && act) {
      const term = li.dataset.term, key = li.dataset.key;
      if (act === 'ignore') { S.ignored.add(key); libChanged(); toast(`Ignoring “${term}”`); }
      else if (act === 'add') { S.userSkills.push({ name: term, cat: $('.cat', li).value, aliases: [] }); libChanged(); toast(`Added “${term}” to your library`); }
      else if (act === 'alias') { li.classList.toggle('aliasing'); $('.alias input', li).focus(); }
      else if (act === 'aliasSave') {
        const target = $('.alias input', li).value.trim();
        const sk = [...S.engine.tax.skills.values()].find(s => s.name.toLowerCase() === target.toLowerCase());
        if (!sk) { toast('Pick an existing skill from the list.'); return; }
        const ex = S.userSkills.find(u => u.name.toLowerCase() === sk.name.toLowerCase());
        if (ex) ex.aliases = [...new Set([...(ex.aliases || []), term])];
        else S.userSkills.push({ name: sk.name, cat: sk.cat, aliases: [term] });
        libChanged(); toast(`“${term}” now counts as ${sk.name}`);
      }
      return;
    }
    const row = e.target.closest('.row');
    if (row) focusSkill(row.dataset.id);
  });
  $('#matchBody').addEventListener('keydown', (e) => {
    const row = e.target.closest('.row');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); focusSkill(row.dataset.id); }
  });

  $('#resumeBody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    const li = e.target.closest('li.b');
    if (btn && li) bulletAction(li, btn.dataset.act);
  });
  $('#resumeBody').addEventListener('change', (e) => {
    const sel = e.target.closest('.addline select');
    if (sel && sel.value) { S.overrides[sel.value] = { pin: true }; saveOverrides(); compose(); }
  });

  $('#docxBtn').addEventListener('click', downloadDocx);
  $('#printBtn').addEventListener('click', printPdf);
  $('#copyBtn').addEventListener('click', copyText);
  $('#resetBtn').addEventListener('click', () => { S.overrides = {}; saveOverrides(); compose(); toast('Back to the automatic selection'); });

  $('#openProfile').addEventListener('click', openProfile);
  $('#profileSave').addEventListener('click', saveProfile);
  $('#profileReset').addEventListener('click', () => {
    store.del('profile'); S.profile = S.data.profile; rebuild(); if (S.jd) analyse(false); openProfile();
    $('#profileMsg').textContent = 'Back to the bundled profile.';
  });
  $('#profileDownload').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(S.profile, null, 2) + '\n'], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'profile.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });

  $('#openLibrary').addEventListener('click', () => { renderLibrary(); $('#libraryDlg').showModal(); });
  $('#libraryBody').addEventListener('click', async (e) => {
    const t = e.target;
    if (t.id === 'extToggle') {
      if (S.extOn) { S.extOn = false; store.set('ext', false); }
      else {
        t.disabled = true; t.textContent = 'Downloading…';
        const ok = await loadExtended(true);
        S.extOn = ok; store.set('ext', ok);
        if (!ok) toast(S.extStatus);
      }
      libChanged();
    } else if (t.dataset.rmSkill != null) { S.userSkills.splice(Number(t.dataset.rmSkill), 1); libChanged(); }
    else if (t.dataset.unignore != null) { S.ignored.delete(t.dataset.unignore); libChanged(); }
    else if (t.id === 'clearCorpus') { S.corpus = { n: 0, df: {}, seen: [] }; store.set('corpus', S.corpus); rebuild(); renderLibrary(); }
  });
  $$('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('tailor.theme', next); } catch { /* ignore */ }
  });
}

boot();
