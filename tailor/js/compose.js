// Assembles the tailored resume: picks bullets, realises sentences, builds summary and skills, runs checks.

import { tokenize, light } from './text.js';
import { findSkills, resolveTag, ancestors } from './taxonomy.js';
import { realize, applySwaps } from './realize.js';
import { capFirst, joinList } from './grammar.js';
import { spell } from './text.js';

function monthsAgo(ym, today) {
  if (!ym || ym === 'present') return 0;
  const [y, m] = ym.split('-').map(Number);
  return (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m);
}

function fmtDate(ym) {
  if (!ym || ym === 'present') return 'Present';
  const [y, m] = ym.split('-').map(Number);
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] + ' ' + y;
}

/** Choose bullets with diminishing returns on skills already covered. */
export function selectBullets({ match, pidx, profile, rules, overrides = {}, today = new Date() }) {
  const R = rules.selection;
  const jdW = new Map(match.rows.map(r => [r.id, r.weight]));
  const roles = profile.roles;
  const roleCap = new Map();
  roles.forEach((r, k) => {
    let cap = R.roleCaps[Math.min(k, R.roleCaps.length - 1)];
    if (monthsAgo(r.end, today) > R.oldRoleYears * 12) cap = Math.min(cap, R.oldRoleCap);
    roleCap.set(r.id, cap);
  });
  const pool = [...pidx.achievements.values()].filter(a => !overrides[a.id]?.exclude);
  // A role whose best achievement speaks strongly to the JD earns one more line.
  const focusOf = (a) => { const c = match.credit.get(a.id); let s = 0; if (c) for (const [j, cr] of c) s += (jdW.get(j) || 0) ** 2 * cr; return s; };
  const maxFocus = Math.max(1e-9, ...pool.map(focusOf));
  // Lines follow relevance: the role that fits the JD best gets one more, a weakly relevant current role one fewer.
  const roleScore = new Map(roles.map(r => [r.id, pool.filter(a => a.role === r.id).map(focusOf).sort((x, y) => y - x).slice(0, 3).reduce((a, b) => a + b, 0)]));
  const topRole = [...roleScore.entries()].sort((a, b) => b[1] - a[1])[0];
  roles.forEach((r, k) => {
    if (k >= 2) {
      const best = Math.max(0, ...pool.filter(a => a.role === r.id).map(focusOf));
      if (best >= 0.5 * maxFocus) roleCap.set(r.id, roleCap.get(r.id) + 1);
    }
    if (topRole && r.id === topRole[0] && k > 0) roleCap.set(r.id, roleCap.get(r.id) + 1);
    if (k === 0 && topRole && roleScore.get(r.id) < 0.5 * topRole[1]) roleCap.set(r.id, Math.max(3, roleCap.get(r.id) - 1));
  });
  const relevance = (a) => {
    const c = match.credit.get(a.id);
    let s = 0;
    if (c) for (const [jid, cr] of c) s += (jdW.get(jid) || 0) * cr;
    return s;
  };
  // Strength only breaks ties; relevance to the JD decides. Unconfirmed lines lose a little.
  // Squared weights: how much an achievement speaks to the JD's *top* skills, for ordering and the summary.
  const focus = (a) => {
    const c = match.credit.get(a.id);
    let s = 0;
    if (c) for (const [jid, cr] of c) s += (jdW.get(jid) || 0) ** 2 * cr;
    return s;
  };
  const base = (a) => 0.022 * a.strength + (a.roleRank === 0 ? 0.01 : 0);
  const trust = (a) => (a.verify ? 0.85 : 1);
  const covered = new Map();
  const picked = [];
  const perRole = new Map();
  const blocked = new Set();
  const take = (a, gain) => {
    picked.push({ id: a.id, role: a.role, gain, relevance: relevance(a), focus: focus(a) });
    perRole.set(a.role, (perRole.get(a.role) || 0) + 1);
    for (const x of a.exclusive || []) blocked.add(x);
    const c = match.credit.get(a.id);
    if (c) for (const [jid, cr] of c) covered.set(jid, Math.max(covered.get(jid) || 0, cr));
  };
  const gainOf = (a) => {
    const c = match.credit.get(a.id);
    let g = 0;
    if (c) for (const [jid, cr] of c) {
      const w = jdW.get(jid) || 0;
      const have = covered.get(jid) || 0;
      g += w * (cr > have ? cr - have + have * R.repeatCredit : cr * R.repeatCredit);
    }
    return g * trust(a) + base(a);
  };
  const jdGain = (a) => gainOf(a) - base(a);
  // 1. pinned
  for (const a of pool) if (overrides[a.id]?.pin) take(a, gainOf(a));
  const free = () => pool.filter(a => !picked.some(p => p.id === a.id) && !blocked.has(a.id) && (perRole.get(a.role) || 0) < roleCap.get(a.role));
  // 2. one per role so the timeline stays continuous
  for (const r of roles) {
    if (perRole.get(r.id)) continue;
    const cands = free().filter(a => a.role === r.id).sort((x, y) => gainOf(y) - gainOf(x));
    if (cands.length) take(cands[0], gainOf(cands[0]));
  }
  // 3. anchors: a role's flagship (strength 9+) stays in while it is at all relevant
  for (const a of pool.filter(x => x.strength >= 9).sort((x, y) => y.strength - x.strength)) {
    if (free().includes(a) && jdGain(a) > 0.05) take(a, gainOf(a));
  }
  // 4. greedy
  while (picked.length < R.totalBullets) {
    const cands = free().map(a => ({ a, g: gainOf(a) })).sort((x, y) => y.g - x.g);
    if (!cands.length || jdGain(cands[0].a) < R.minGain) break;
    take(cands[0].a, cands[0].g);
  }
  return picked;
}

function titleFor(jd, profile, idx) {
  const titles = profile.titles || [];
  if (!jd || !jd.title) return profile.defaultTitle || titles[0];
  const jt = new Set(tokenize(jd.title.text).filter(t => t.kind === 'w').map(t => light(t.t)));
  let best = profile.defaultTitle || titles[0], bestScore = 0;
  for (const t of titles) {
    const tw = tokenize(t).filter(x => x.kind === 'w').map(x => light(x.t));
    const ids = findSkills(tokenize(t), idx.roles, t, { ext: false }).map(m => m.id);
    let sc = tw.filter(w => jt.has(w)).length / Math.max(tw.length, 1);
    if (ids.some(id => jd.titleRoles.includes(id))) sc += 1;
    if (sc > bestScore + 1e-9) { best = t; bestScore = sc; }
  }
  return best;
}

const seq = (x) => x.toLowerCase().split(/[\s\-\/]+/).map(spell).join(' ');
const titleCase = (x) => x.replace(/\b[a-z]/g, (c, k) => (k && /^(of|and|the|for|to|in|on|as)\b/.test(x.slice(k)) ? c : c.toUpperCase()));

function labelFor(js, tax) {
  const s = tax.skills.get(js.id);
  const name = s ? s.name : js.name;
  let label = name;
  const sf = [...js.surfaces].filter(x => x.swap).sort((x, y) => y.count - x.count)[0];
  if (sf && sf.form && sf.form.length <= 40) {
    const plural = (x) => seq(x).split(' ').map(w => w.replace(/s$/, '')).join(' ');
    const form = plural(sf.form) === plural(sf.surface) ? sf.surface : sf.form;
    if (form.toLowerCase() !== name.toLowerCase()) label = /^[a-z]/.test(form) ? capFirst(form) : form;
  }
  const forms = s ? s.forms.filter(f => f.swap).map(f => f.f) : [];
  const acr = forms.find(f => /^[A-Z][A-Z0-9&]{1,5}$/.test(f));
  const initials = (f) => f.split(/[\s\-]+/).filter(w => !/^(of|and|the|for|to|in|on)$/i.test(w)).map(w => w[0]).join('').toUpperCase();
  const exp = acr && forms.find(f => f !== acr && initials(f) === acr.replace(/[^A-Z]/g, ''));
  const main = [...js.surfaces].sort((x, y) => y.count - x.count)[0];
  const mainSeq = main ? seq(main.surface) : '';
  if (acr && exp && (mainSeq === seq(acr) || mainSeq === seq(exp))) label = `${titleCase(exp)} (${acr})`;
  return label;
}

function relatedToJD(tax, id, jdIds) {
  if (jdIds.has(id)) return true;
  const s = tax.skills.get(id);
  if (!s) return false;
  return s.related.some(r => jdIds.has(r)) || s.parents.some(p => jdIds.has(p)) || s.children.some(c => jdIds.has(c));
}

/**
 * Build the whole tailored resume.
 * env: { jd, match, pidx, profile, tax, idx, rules, overrides, today }
 */
export function buildResume(env) {
  const { jd, match, pidx, profile, tax, idx, rules } = env;
  const overrides = env.overrides || {};
  const today = env.today || new Date();
  const jdMap = new Map(match.rows.map(r => [r.id, r]));
  const sector = jd ? jd.sector : 'public';
  const picks = selectBullets({ match, pidx, profile, rules, overrides, today });

  // Realise most relevant first so they get first claim on verbs
  const state = { verbs: new Map(), roleVerbs: new Map() };
  const usedAcronyms = new Set();
  const byId = new Map();
  const order = [...picks].sort((x, y) => (y.relevance + y.gain) - (x.relevance + x.gain));
  for (const p of order) {
    const a = pidx.achievements.get(p.id);
    const role = profile.roles.find(r => r.id === a.role);
    const tense = role && role.end === 'present' && profile.currentTense === 'present' ? 'present' : 'past';
    const res = realize(a, { jd, jdMap, idx, rules, profile, sector, state, tense, partSkills: a.partSkills, usedAcronyms });
    const ov = overrides[a.id] || {};
    let chosen = res.candidates[0];
    if (ov.text) chosen = { text: ov.text, score: 0, pattern: 'edited', leadVerb: '', skills: [], swaps: [], manual: true };
    else if (ov.pick != null) chosen = res.candidates.find(c => c.text === ov.pick) || chosen;
    if (!chosen) continue;
    const lv = chosen.leadVerb;
    if (lv) {
      state.verbs.set(lv, (state.verbs.get(lv) || 0) + 1);
      if (!state.roleVerbs.has(a.role)) state.roleVerbs.set(a.role, new Set());
      state.roleVerbs.get(a.role).add(lv);
    }
    for (const s of chosen.swaps || []) if (/\(/.test(s.to)) usedAcronyms.add(s.id);
    byId.set(a.id, { id: a.id, role: a.role, text: chosen.text, pattern: chosen.pattern, skills: chosen.skills, swaps: chosen.swaps,
      alts: res.candidates.slice(0, 6), rejected: res.rejected.length, relevance: p.relevance, verify: !!a.verify, note: a.note,
      src: a.src, strength: a.strength, pinned: !!ov.pin, manual: !!chosen.manual });
  }

  const roles = profile.roles.map(r => {
    const bullets = picks.filter(p => p.role === r.id).map(p => ({ ...byId.get(p.id), focus: p.focus })).filter(b => b.text)
      .sort((x, y) => (y.focus + 0.3 * y.relevance + 0.04 * y.strength) - (x.focus + 0.3 * x.relevance + 0.04 * x.strength));
    const pool = [...pidx.achievements.values()].filter(a => a.role === r.id && !byId.has(a.id)).map(a => a.id);
    return { ...r, dates: `${fmtDate(r.start)} – ${fmtDate(r.end)}`, bullets, unused: pool };
  });

  // ---- summary and headline: broad statements chosen by fit, never specific achievements ----
  const title = titleFor(jd, profile, idx);
  const years = match.years.profile;
  const tagCache = new Map();
  const credit = { matched: 1, claimed: 0.6, related: 0.3, gap: 0 };
  const fit = (tags) => {
    let sc = 0;
    for (const t of tags || []) {
      if (!tagCache.has(t)) tagCache.set(t, resolveTag(t, tax, idx));
      const row = jdMap.get(tagCache.get(t));
      if (row) sc += row.weight * credit[row.status];
    }
    return sc;
  };
  const byFit = (list) => (list || []).map((x, k) => ({ ...x, sc: fit(x.tags), k })).sort((a, b) => b.sc - a.sc || a.k - b.k);
  const S = profile.summary || {};
  const domains = byFit(S.domains).filter(d => d.sc > 0.05).slice(0, 2).map(d => d.label);
  const identity = ((S.identity || []).find(x => x.when === sector) || (S.identity || [])[0] || { text: '{title} with {years}+ years of experience{domains}.' }).text
    .replace('{title}', title).replace('{years}', years)
    .replace('{domains}', domains.length ? `, with domain experience in ${joinList(domains)}` : '');
  const strengths = byFit(S.capabilities).slice(0, 3).map(c => c.text);
  const sentences = [identity];
  if (strengths.length) sentences.push(`Strengths include ${joinList(strengths)}.`);
  const approach = byFit(S.approach);
  if (approach.length) sentences.push(approach[0].text);
  if (approach[1] && approach[1].sc >= 0.5) {
    const n = (sentences.join(' ') + ' ' + approach[1].text).split(/\s+/).length;
    if (n <= 85) sentences.push(approach[1].text);
  }
  const summary = applySwaps(sentences.join(' '), jdMap, idx, new Set()).text;

  const titleWords = new Set(tokenize(title).filter(t => t.kind === 'w').map(t => light(t.t)));
  const areas = byFit(profile.focusAreas)
    .filter(a => !tokenize(a.label).some(t => t.kind === 'w' && titleWords.has(light(t.t))))
    .slice(0, 2).map(a => a.label);
  const headline = applySwaps([title, ...areas].join(' | '), jdMap, idx, new Set()).text;

  // ---- skills section ----
  const groups = rules.displayGroups.map(g => ({ ...g, items: [], w: 0 }));
  const groupOf = (cat) => groups.find(g => g.cats.includes(cat));
  const seen = new Set();
  const skip = new Set((rules.notInSkillsSection || []).map(x => x.toLowerCase()));
  const addSkill = (id, label, w, why) => {
    const s = tax.skills.get(id);
    if (!s || s.abstract || ['soft', 'role', 'degree', 'cert'].includes(s.cat)) return;
    if (skip.has(s.name.toLowerCase())) return;
    if (seen.has(id)) return;
    const g = groupOf(s.cat);
    if (!g) return;
    seen.add(id);
    g.items.push({ id, label, w, why });
    g.w += w;
  };
  for (const r of match.rows) {
    if (r.ext) continue;
    if (r.status === 'matched' || r.status === 'claimed') addSkill(r.id, labelFor(r, tax), r.weight, r.status);
  }
  // related: show the profile's own skill that relates
  for (const r of match.rows) {
    if (r.status !== 'related' || !r.via) continue;
    const id = resolveTag(r.via, tax, idx);
    if (id) addSkill(id, tax.skills.get(id).name, r.weight * 0.5, 'related');
  }
  // fill with the profile's strongest evidenced skills in groups the JD cares about
  const jdIds = new Set(match.rows.filter(r => r.weight >= 0.3 && r.cat !== 'soft').map(r => r.id));
  const evidCount = [...pidx.evidence.entries()].map(([id, list]) => ({ id, n: list.length })).sort((a, b) => b.n - a.n);
  for (const { id } of evidCount) {
    const s = tax.skills.get(id);
    if (!s) continue;
    const g = groupOf(s.cat);
    if (s.cat === 'domain') continue;
    if (!g || g.w === 0 || g.items.filter(i => i.why === 'profile').length >= 2 || g.items.length >= 8 || !relatedToJD(tax, id, jdIds)) continue;
    if (sector === 'private' && (s.cat === 'govt' || /government|public sector|ministr/i.test(s.name))) continue;
    addSkill(id, s.name, 0.01, 'profile');
  }
  const skills = groups.filter(g => g.items.length).sort((a, b) => b.w - a.w).slice(0, 6)
    .map(g => ({ label: g.label, items: g.items.sort((a, b) => b.w - a.w).slice(0, 9) }));

  // ---- certifications (relevant first) ----
  const certs = [...(profile.certifications || [])].map(c => {
    const ids = findSkills(tokenize(c.name), idx, c.name, { ext: false }).map(m => m.id);
    const sc = ids.reduce((a, id) => a + (jdMap.get(id)?.weight || 0) + [...ancestors(tax, id)].reduce((b, x) => b + (jdMap.get(x)?.weight || 0) * 0.5, 0), 0);
    return { ...c, sc };
  }).sort((a, b) => b.sc - a.sc);

  const resume = {
    person: profile.person, headline, title, summary, skills, roles,
    education: profile.education || [], certifications: certs
  };
  resume.lint = lint(resume, { jd, match, idx, rules, tax });
  return resume;
}

/** Plain text of the resume in reading order (also what the ATS check reads). */
export function resumeText(r) {
  const p = r.person;
  const lines = [p.name, r.headline, [p.location, p.email, p.phone, p.linkedin, p.website].filter(Boolean).join(' | '), '',
    'PROFESSIONAL SUMMARY', r.summary, '', 'CORE COMPETENCIES'];
  for (const g of r.skills) lines.push(`${g.label}: ${g.items.map(i => i.label).join(', ')}`);
  lines.push('', 'PROFESSIONAL EXPERIENCE');
  for (const role of r.roles) {
    if (!role.bullets.length) continue;
    lines.push(`${role.title} | ${role.company} | ${role.location} | ${role.dates}`);
    if (role.client) lines.push(`Client: ${role.client}`);
    for (const b of role.bullets) lines.push('- ' + b.text);
    lines.push('');
  }
  lines.push('EDUCATION');
  for (const e of r.education) lines.push(`${e.degree}, ${e.school}, ${e.year}`);
  lines.push('', 'CERTIFICATIONS');
  for (const c of r.certifications) lines.push(`${c.name}, ${c.issuer}`);
  return lines.join('\n');
}

/** Rule checks over the finished resume. */
export function lint(r, { jd, match, idx, rules }) {
  const out = [];
  const banned = rules.bannedWords.map(w => w.toLowerCase());
  const bodyTexts = [r.summary, ...r.roles.flatMap(x => x.bullets.map(b => b.text))];
  for (const t of bodyTexts) {
    const low = t.toLowerCase();
    for (const w of banned) if (new RegExp(`\\b${w.replace(/[-]/g, '\\-')}\\b`).test(low)) out.push({ level: 'warn', msg: `"${w}" reads as filler or machine-written`, where: t.slice(0, 60) });
  }
  const lead = new Map();
  for (const role of r.roles) for (const b of role.bullets) {
    const v = (b.text.match(/^[A-Za-z\-]+/) || [''])[0].toLowerCase();
    lead.set(v, (lead.get(v) || 0) + 1);
    if (b.text.length > rules.bullet.hardMax) out.push({ level: 'warn', msg: `Long bullet (${b.text.length} characters)`, where: b.text.slice(0, 60) });
    if (b.verify) out.push({ level: 'info', msg: `From the resume PDF only, not yet confirmed in the dossier${b.note ? ': ' + b.note : ''}`, where: b.text.slice(0, 60), id: b.id });
    if (b.manual) out.push({ level: 'info', msg: 'Edited by hand, so the wording check does not apply', where: b.text.slice(0, 60), id: b.id });
  }
  for (const [v, n] of lead) if (n > 2) out.push({ level: 'warn', msg: `"${capFirst(v)}" opens ${n} bullets` });
  if (jd) {
    const text = bodyTexts.join('\n').toLowerCase();
    for (const row of match.rows) {
      let n = 0;
      for (const sf of row.surfaces) {
        const t = sf.surface.toLowerCase();
        if (t.length < 3 || !sf.swap) continue;
        n += text.split(t).length - 1;
      }
      if (n > rules.keywordRepeatCap + 1 && row.cat !== 'soft') out.push({ level: 'warn', msg: `"${row.name}" appears ${n} times, which can read as stuffing` });
    }
  }
  const words = r.summary.split(/\s+/).length;
  if (words > 110) out.push({ level: 'warn', msg: `Summary is ${words} words; under 100 reads better` });
  return out;
}
