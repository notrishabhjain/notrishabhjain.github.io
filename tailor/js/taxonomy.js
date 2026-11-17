// Loads the skills taxonomy (data/skills.txt) and finds skills in text.
//
// Three lookups, tried longest span first:
//   cased  exact surface, for forms like "SAFe", "Go", "Spark" that collide with English words
//   exact  order-preserving, inflection-stemmed ("risk registers" = "risk register")
//   bag    order-insensitive, derivation-folded ("managing vendors" = "vendor management")
// plus an optional extended library (thousands of extra names, lower confidence).

import { tokenize, exactKey, bagKey, light, spell, slug, STOP } from './text.js';

const AUTO_CS = /^(?=.*[A-Z])[A-Z0-9&\/]{1,4}$/;

function parseForm(raw) {
  let f = raw.trim();
  let cs = false, startUnsafe = false, explicit = false;
  if (f.endsWith('!!')) { cs = true; startUnsafe = true; explicit = true; f = f.slice(0, -2); }
  else if (f.endsWith('!')) { cs = true; explicit = true; f = f.slice(0, -1); }
  if (AUTO_CS.test(f)) cs = true;
  return { f, cs, startUnsafe, explicit };
}

function splitList(s) {
  return s ? s.split(',').map(x => x.trim()).filter(Boolean) : [];
}

/** Parse the skills DSL into a Map of id -> skill. */
export function parseTaxonomy(txt) {
  const skills = new Map();
  const warnings = [];
  let cat = 'misc';
  for (const raw of txt.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('@')) { cat = line.slice(1).trim(); continue; }
    const pieces = line.split(/\s([=|^~])\s/);
    let name = pieces[0].trim();
    const sec = { '=': '', '|': '', '^': '', '~': '' };
    for (let i = 1; i < pieces.length; i += 2) sec[pieces[i]] = pieces[i + 1] || '';
    const abstract = name.startsWith('*');
    if (abstract) name = name.slice(1).trim();
    const nameForm = parseForm(name);
    name = nameForm.f;
    const id = slug(name);
    if (skills.has(id)) warnings.push(`duplicate skill ${name}`);
    const swapForms = [nameForm, ...splitList(sec['=']).map(parseForm)];
    const matchForms = splitList(sec['|']).map(parseForm);
    // A case-sensitive variant of the name overrides the plain name ("Go = Go!!").
    const byLower = new Map();
    for (const f of [...swapForms.map(x => ({ ...x, swap: true })), ...matchForms.map(x => ({ ...x, swap: false }))]) {
      const k = f.f.toLowerCase();
      const prev = byLower.get(k);
      if (!prev) byLower.set(k, f);
      else if (f.explicit && !prev.explicit) byLower.set(k, { ...f, swap: prev.swap || f.swap });
      else if (prev.cs && !prev.explicit && !f.cs) byLower.set(k, { ...f, swap: prev.swap || f.swap });
    }
    skills.set(id, {
      id, name, cat, abstract,
      forms: [...byLower.values()],
      parentNames: splitList(sec['^']),
      relatedNames: splitList(sec['~']),
      parents: [], related: [], children: []
    });
  }
  // Resolve references; unknown parents become abstract groups so nothing dangles.
  for (const s of [...skills.values()]) {
    for (const [names, key] of [[s.parentNames, 'parents'], [s.relatedNames, 'related']]) {
      for (const n of names) {
        const pid = slug(n.replace(/^\*/, ''));
        if (!skills.has(pid)) {
          warnings.push(`unknown reference "${n}" from ${s.name}`);
          skills.set(pid, { id: pid, name: n.replace(/^\*/, ''), cat: s.cat, abstract: true, forms: [], parentNames: [], relatedNames: [], parents: [], related: [], children: [] });
        }
        s[key].push(pid);
      }
    }
  }
  for (const s of skills.values()) {
    for (const p of s.parents) skills.get(p).children.push(s.id);
    for (const r of s.related) { const o = skills.get(r); if (!o.related.includes(s.id)) o.related.push(s.id); }
  }
  return { skills, warnings };
}

/** Merge skills the user added from the inbox: [{name, cat, aliases:[...], parent}] */
export function addUserSkills(tax, list) {
  for (const u of list || []) {
    const id = slug(u.name);
    let s = tax.skills.get(id);
    if (!s) {
      s = { id, name: u.name, cat: u.cat || 'misc', abstract: false, forms: [], parentNames: [], relatedNames: [], parents: [], related: [], children: [], user: true };
      tax.skills.set(id, s);
      s.forms.push({ ...parseForm(u.name), swap: true });
    }
    for (const a of u.aliases || []) s.forms.push({ ...parseForm(a), swap: false });
    if (u.parent) {
      const pid = slug(u.parent);
      if (tax.skills.has(pid) && !s.parents.includes(pid)) { s.parents.push(pid); tax.skills.get(pid).children.push(id); }
    }
  }
}

function caseKeyOf(tokens) {
  return tokens.map(t => (t.kind === 'w' ? t.t.replace(/^([A-Z][A-Z0-9&]+)s$/, '$1') : t.t)).join(' ');
}

/** Build lookup maps. Role titles go in their own index so they never count as skills. */
export function buildIndex(tax) {
  const idx = { exact: new Map(), cased: new Map(), bag: new Map(), maxLen: 1, collisions: [], ext: null, extMax: 1 };
  const roleIdx = { exact: new Map(), cased: new Map(), bag: new Map(), maxLen: 1, collisions: [] };
  for (const s of tax.skills.values()) {
    const target = s.cat === 'role' ? roleIdx : idx;
    for (const form of s.forms) {
      const toks = tokenize(form.f).filter(t => t.kind !== 'b');
      if (!toks.length) continue;
      target.maxLen = Math.max(target.maxLen, toks.length);
      const entry = { id: s.id, form: form.f, swap: form.swap, startUnsafe: form.startUnsafe, n: toks.length };
      if (form.cs) {
        put(target.cased, caseKeyOf(toks), entry, target);
      } else {
        put(target.exact, exactKey(toks), entry, target);
        const bk = bagKey(toks);
        if (bk) put(target.bag, bk, entry, target, true);
      }
    }
  }
  idx.roles = roleIdx;
  return idx;
}

function put(map, key, entry, target, bag) {
  if (bag && target.ambiguous?.has(key)) return;
  const prev = map.get(key);
  if (prev) {
    if (prev.id === entry.id) return;
    if (bag) { map.delete(key); (target.ambiguous ||= new Set()).add(key); return; }
    target.collisions.push(`${key}: ${prev.id} vs ${entry.id}`);
    return;
  }
  map.set(key, entry);
}

// ---- extended library -------------------------------------------------------------

const EXT_GENERIC = new Set(('management planning communication leadership sales marketing writing research analysis ' +
  'design development support operations strategy reporting training teaching testing coaching selling finance accounting ' +
  'administration consulting engineering operations customer service innovation documentation integration security quality ' +
  'process automation presentation negotiation scheduling recruiting budgeting forecasting auditing monitoring maintenance ' +
  'troubleshooting mentoring editing collaboration teamwork creativity organization governance compliance risk procurement ' +
  'logistics purchasing coordination planning reliability scalability availability usability accessibility mobility ' +
  'agile scrum lean data cloud web mobile software hardware network networking database databases api apis it').split(' '));

/**
 * Add an extended name list: [{name, type}] (e.g. the SkillNER / Lightcast list).
 * Core skills always win; extended single words must look technical in the text to match.
 */
export function addExtended(idx, list) {
  const ext = new Map();
  let maxLen = 1;
  for (const { name, type } of list) {
    const clean = name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 2) continue;
    const toks = tokenize(clean).filter(t => t.kind !== 'b');
    if (!toks.length || toks.length > 5) continue;
    const key = exactKey(toks);
    if (idx.exact.has(key)) continue;
    if (toks.length === 1 && (EXT_GENERIC.has(spell(toks[0].t)) || STOP.has(spell(toks[0].t)))) continue;
    if (toks.every(t => STOP.has(spell(t.t)) || EXT_GENERIC.has(spell(t.t)))) continue;
    if (!ext.has(key)) ext.set(key, { id: 'ext:' + slug(clean), name: clean, type, n: toks.length });
    maxLen = Math.max(maxLen, toks.length);
  }
  idx.ext = ext;
  idx.extMax = maxLen;
  return ext.size;
}

function looksTechnical(tok) {
  const t = tok.t;
  if (/[0-9+#.]/.test(t) || /[a-z][A-Z]/.test(t) || /^[A-Z]{2,}$/.test(t)) return true;
  return /^[A-Z]/.test(t) && !tok.start;
}

// ---- matching -------------------------------------------------------------------

/**
 * Find skill mentions in a token stream.
 * Returns [{id, i, j, s, e, surface, how, form, swap}] with j exclusive.
 */
export function findSkills(tokens, idx, text, opts = {}) {
  const out = [];
  const useExt = opts.ext !== false && idx.ext;
  const n = tokens.length;
  // Next boundary position from each index, so windows never cross punctuation.
  const nextB = new Array(n + 1).fill(n);
  for (let k = n - 1; k >= 0; k--) nextB[k] = tokens[k].kind === 'b' ? k : nextB[k + 1];
  const maxLen = Math.max(idx.maxLen, useExt ? idx.extMax : 1);
  let i = 0;
  while (i < n) {
    if (tokens[i].kind !== 'w') { i++; continue; }
    const limit = Math.min(maxLen, nextB[i] - i);
    let hit = null;
    for (let len = limit; len >= 1 && !hit; len--) {
      const win = tokens.slice(i, i + len);
      if (win[win.length - 1].kind !== 'w') continue;
      const c = idx.cased.get(caseKeyOf(win));
      if (c && !(c.startUnsafe && win[0].start)) { hit = { ...c, how: 'cased', len }; break; }
      if (len <= idx.maxLen) {
        const x = idx.exact.get(exactKey(win));
        if (x) { hit = { ...x, how: 'exact', len }; break; }
        const bk = len >= 2 ? bagKey(win) : null;
        const b = bk && idx.bag.get(bk);
        if (b) { hit = { ...b, how: 'bag', len }; break; }
      }
      if (useExt && len <= idx.extMax) {
        const e = idx.ext.get(exactKey(win));
        if (e && (len > 1 || looksTechnical(win[0]))) { hit = { id: e.id, form: e.name, swap: false, how: 'ext', len, ext: e }; break; }
      }
    }
    if (hit) {
      const s = tokens[i].s, e = tokens[i + hit.len - 1].e;
      out.push({ id: hit.id, i, j: i + hit.len, s, e, surface: text ? text.slice(s, e) : '', how: hit.how, form: hit.form, swap: hit.swap, ext: hit.ext });
      i += hit.len;
    } else i++;
  }
  return out;
}

/** Convenience: skills in a plain string. */
export function skillsIn(text, idx, opts) {
  return findSkills(tokenize(text), idx, text, opts);
}

/** Resolve a tag (skill name or any form) to a skill id. */
export function resolveTag(tag, tax, idx) {
  const id = slug(tag);
  if (tax.skills.has(id)) return id;
  const m = skillsIn(tag, idx, { ext: false });
  if (m.length && m[0].j - m[0].i === tokenize(tag).filter(t => t.kind !== 'b').length) return m[0].id;
  return m.length === 1 ? m[0].id : null;
}

/** All ancestors of a skill (parents, grandparents ...). */
export function ancestors(tax, id, seen = new Set()) {
  const s = tax.skills.get(id);
  if (!s) return seen;
  for (const p of s.parents) if (!seen.has(p)) { seen.add(p); ancestors(tax, p, seen); }
  return seen;
}

export function descendants(tax, id, seen = new Set()) {
  const s = tax.skills.get(id);
  if (!s) return seen;
  for (const c of s.children) if (!seen.has(c)) { seen.add(c); descendants(tax, c, seen); }
  return seen;
}

export function skillName(tax, id) {
  if (id.startsWith('ext:')) return id.slice(4).replace(/-/g, ' ');
  return tax.skills.get(id)?.name || id;
}

export { light };
