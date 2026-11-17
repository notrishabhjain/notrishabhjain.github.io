// Evidence matching: which job-description skills the profile can back up, and with what.

import { tokenize } from './text.js';
import { findSkills, resolveTag, ancestors, descendants } from './taxonomy.js';
import { parseAchievement } from './realize.js';

const SLOT_RE = /\{\{([^{}]+)\}\}/g;
const expandSlots = (s) => s.replace(SLOT_RE, (_, inner) => inner.split('|').join(' / '));

function skillsOfText(text, idx) {
  return findSkills(tokenize(text), idx, text, { ext: false }).map(m => m.id);
}

/** Index the profile: skills per achievement, per part, and claimed skills. */
export function buildProfileIndex(profile, tax, idx) {
  const achievements = new Map();
  const evidence = new Map(); // skill id -> [achievement ids]
  const warnings = [];
  const roleOrder = new Map(profile.roles.map((r, k) => [r.id, k]));
  for (const raw of profile.achievements) {
    let a;
    try { a = parseAchievement(raw); } catch (e) { warnings.push(`${raw.id}: ${e.message}`); continue; }
    const partSkills = new Map();
    const all = new Set();
    const negAll = new Set();
    for (const p of a.partsP) {
      const set = new Set(skillsOfText(expandSlots(p.text || p.obj || ''), idx));
      for (const t of p.tags) {
        const id = resolveTag(t, tax, idx);
        if (id) set.add(id); else warnings.push(`${a.id}: unknown tag "${t}"`);
      }
      for (const t of p.neg) { const id = resolveTag(t, tax, idx); if (id) { set.delete(id); negAll.add(id); } }
      partSkills.set(p.i, set);
      for (const id of set) all.add(id);
    }
    const coreSet = new Set(skillsOfText(expandSlots(a.coreP.obj) + '. ' + expandSlots(a.text), idx));
    for (const t of a.tags || []) {
      const id = resolveTag(t, tax, idx);
      if (id) coreSet.add(id); else warnings.push(`${a.id}: unknown tag "${t}"`);
    }
    for (const id of negAll) coreSet.delete(id);
    for (const id of coreSet) all.add(id);
    const rec = { ...a, partSkills, coreSkills: coreSet, skills: all, roleRank: roleOrder.get(a.role) ?? 99 };
    achievements.set(a.id, rec);
    for (const id of all) {
      if (!evidence.has(id)) evidence.set(id, []);
      evidence.get(id).push(a.id);
    }
  }
  const claimed = new Set();
  for (const s of profile.skills || []) {
    const id = resolveTag(s, tax, idx);
    if (id) claimed.add(id);
    for (const x of skillsOfText(s, idx)) claimed.add(x);
  }
  for (const c of profile.certifications || []) for (const x of skillsOfText(c.name, idx)) claimed.add(x);
  // The summary lines and role headers are the owner's own claims too.
  const own = [...(profile.summary?.identity || []).map(x => x.text), ...(profile.summary?.extra || []).map(x => x.text),
    ...profile.roles.map(r => `${r.title}. ${r.client || ''}. ${(r.industries || []).join('. ')}`)];
  for (const t of own) for (const x of skillsOfText(t.replace(/\{[a-z]+\}/g, ''), idx)) claimed.add(x);
  for (const e of profile.education || []) for (const x of skillsOfText(e.degree, idx)) claimed.add(x);
  // Ancestors of everything evidenced, for "parent asked, child held" matching.
  const ancestorEvidence = new Map();
  for (const [id, list] of evidence) {
    for (const anc of ancestors(tax, id)) {
      if (!ancestorEvidence.has(anc)) ancestorEvidence.set(anc, new Map());
      const m = ancestorEvidence.get(anc);
      for (const aid of list) if (!m.has(aid)) m.set(aid, id);
    }
  }
  return { achievements, evidence, claimed, ancestorEvidence, warnings };
}

function siblingsVia(tax, id) {
  const s = tax.skills.get(id);
  const out = new Map();
  if (!s) return out;
  for (const p of s.parents) {
    const ps = tax.skills.get(p);
    if (!ps || ps.abstract) continue;
    out.set(p, p);
    for (const c of ps.children) if (c !== id) out.set(c, p);
  }
  for (const r of s.related) out.set(r, r);
  for (const c of s.children) out.set(c, c);
  return out;
}

/**
 * Match the JD's skills against the profile.
 * Returns rows sorted by weight with status: matched | claimed | related | gap,
 * plus per-achievement credit used by bullet selection.
 */
export function matchJD(jd, pidx, tax, rules, profile, today = new Date()) {
  const rows = [];
  const credit = new Map(); // achievement id -> Map(jd skill id -> credit)
  const give = (aid, jid, c) => {
    if (!credit.has(aid)) credit.set(aid, new Map());
    const m = credit.get(aid);
    m.set(jid, Math.max(m.get(jid) || 0, c));
  };
  for (const js of jd.skills) {
    const row = { ...js, status: 'gap', evidence: [], via: null };
    if (js.ext) {
      // extended-library skills can still be evidenced by exact text in the profile
      rows.push(row); continue;
    }
    const direct = pidx.evidence.get(js.id) || [];
    const viaChild = pidx.ancestorEvidence.get(js.id) || new Map();
    if (direct.length || viaChild.size) {
      row.status = 'matched';
      row.evidence = [...new Set([...direct, ...viaChild.keys()])];
      if (!direct.length) row.via = tax.skills.get([...viaChild.values()][0])?.name;
      for (const aid of row.evidence) give(aid, js.id, 1);
    } else {
      const desc = descendants(tax, js.id);
      if (pidx.claimed.has(js.id) || [...desc].some(d => pidx.claimed.has(d))) row.status = 'claimed';
      const sib = siblingsVia(tax, js.id);
      const relEv = [];
      for (const [sid] of sib) {
        for (const aid of pidx.evidence.get(sid) || []) { relEv.push(aid); give(aid, js.id, rules.selection.relatedCredit); if (!row.via) row.via = tax.skills.get(sid)?.name; }
      }
      if (row.status !== 'claimed' && relEv.length) { row.status = 'related'; row.evidence = [...new Set(relEv)]; }
      if (row.status === 'claimed') row.via = 'skills list';
    }
    // order evidence: strongest, most recent first
    row.evidence.sort((x, y) => {
      const a = pidx.achievements.get(x), b = pidx.achievements.get(y);
      return (b.strength - a.strength) || (a.roleRank - b.roleRank);
    });
    rows.push(row);
  }
  const C = { matched: 1, claimed: rules.selection.claimedCredit, related: rules.selection.relatedCredit, gap: 0 };
  let num = 0, den = 0, mustN = 0, mustHit = 0;
  for (const r of rows) {
    if (r.cat === 'soft' && r.weight < 0.3) continue;
    num += r.weight * C[r.status]; den += r.weight;
    if (r.must || r.tier === 'critical') { mustN++; if (r.status === 'matched' || r.status === 'claimed') mustHit++; }
  }
  const start = new Date(profile.careerStart + '-01');
  const years = Math.floor((today - start) / (365.25 * 24 * 3600 * 1000));
  return {
    rows, credit,
    coverage: den ? Math.round(100 * num / den) : 0,
    must: { total: mustN, hit: mustHit },
    years: { profile: years, asked: jd.years, ok: jd.years == null || years >= jd.years }
  };
}
