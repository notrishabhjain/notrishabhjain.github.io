// Turns an achievement stored as parts into the best sentence for a given job description.
//
// No sentence is written from nothing. Every candidate is assembled from the parts the profile
// owner wrote, using a small set of sentence shapes, and then checked: any content word that is
// not in that achievement's own source text (or an approved swap) rejects the candidate.

import { tokenize, light, spell, STOP, findTerms } from './text.js';
import { conjugate, joinList, aOrAn, capFirst, tidy } from './grammar.js';
import { findSkills } from './taxonomy.js';

const VERB_TYPES = new Set(['method', 'then', 'and', 'result']);
const LIT_TYPES = new Set(['scope', 'context', 'detail', 'list', 'outcome', 'purpose', 'coda']);
const CONNECT = new Set(['by', 'and', 'or', 'while', 'through', 'to', 'in', 'with', 'across', 'for', 'the', 'a', 'an', 'of',
  'which', 'that', 'then', 'also', 'on', 'at', 'from', 'into', 'as']);
const SLOT_RE = /\{\{([^{}]+)\}\}/g;

// ---- parsing ---------------------------------------------------------------------

function splitTags(str) {
  const tags = [], neg = [];
  const at = str.search(/\s#/);
  if (at < 0) return { body: str.trim(), tags, neg };
  for (const t of str.slice(at).split(/\s#/).map(x => x.trim()).filter(Boolean)) {
    if (t.startsWith('-')) neg.push(t.slice(1)); else tags.push(t);
  }
  return { body: str.slice(0, at).trim(), tags, neg };
}

function parseVerbSpec(spec) {
  return spec.split('|').map(v => v.trim()).filter(Boolean);
}

export function parsePart(str, i) {
  const { body, tags, neg } = splitTags(str);
  const segs = body.split('::').map(s => s.trim());
  let type = segs[0];
  let req = false;
  if (type.endsWith('!')) { req = true; type = type.slice(0, -1); }
  if (VERB_TYPES.has(type)) {
    return { i, type, req, verbs: parseVerbSpec(segs[1] || ''), obj: segs.slice(2).join(' :: '), tags, neg };
  }
  if (!LIT_TYPES.has(type)) throw new Error(`Unknown part type "${type}" in: ${str}`);
  return { i, type, req, text: segs.slice(1).join(' :: '), tags, neg };
}

export function parseAchievement(a) {
  const [verbSpec, ...objBits] = a.core.split('::');
  const core = { verbs: parseVerbSpec(verbSpec), obj: objBits.join('::').trim() };
  const parts = (a.parts || []).map(parsePart);
  return { ...a, coreP: core, partsP: parts, patternsAllowed: (a.patterns || 'OCRM').toUpperCase() };
}

// ---- slots, swaps, vocabulary ----------------------------------------------------

export function slotsOf(str) {
  const out = [];
  str.replace(SLOT_RE, (_, inner) => { out.push(inner); return _; });
  return out;
}

function fillSlots(str, choice) {
  return str.replace(SLOT_RE, (_, inner) => choice.get(inner) ?? inner.split('|')[0]);
}

function vocabOf(strings, verbs) {
  const v = new Set();
  const add = (s) => { for (const t of tokenize(s)) if (t.kind === 'w') v.add(light(t.t)); };
  for (const s of strings) add(s.replace(SLOT_RE, (_, inner) => inner.split('|').join(' ')));
  for (const lemma of verbs) {
    for (const f of ['past', 'ing', 'base']) add(conjugate(lemma, f));
    add(conjugate(lemma, 'past', { spelling: 'uk' }));
    add(conjugate(lemma, 'ing', { spelling: 'uk' }));
  }
  return v;
}

/** Content words in `sentence` that are not in the vocabulary. Empty means the sentence is clean. */
export function integrityGaps(sentence, vocab) {
  const bad = [];
  for (const t of tokenize(sentence)) {
    if (t.kind !== 'w') continue;
    const s = spell(t.t);
    if (STOP.has(s) || CONNECT.has(s)) continue;
    if (!vocab.has(light(t.t))) bad.push(t.t);
  }
  return bad;
}

function isAcronymOf(acr, phrase) {
  const a = acr.replace(/[^A-Za-z]/g, '');
  if (a.length < 2 || a !== a.toUpperCase()) return false;
  const initials = phrase.split(/[\s\-\/]+/).filter(w => w && !/^(of|and|the|for|to|in|on|&)$/i.test(w)).map(w => w[0]).join('').toUpperCase();
  return initials === a.toUpperCase();
}

function spellSeq(s) {
  return tokenize(s).filter(t => t.kind !== 'b').map(t => (t.kind === 'j' ? t.t : spell(t.t))).join(' ');
}

function matchCase(src, to) {
  if (/^[A-Z][a-z]/.test(src) && /^[a-z]/.test(to)) return to.replace(/\b[a-z]/g, (c, k) => (k === 0 || !/^(of|and|the|for|to|in|on)\b/.test(to.slice(k)) ? c.toUpperCase() : c));
  return to;
}

/**
 * Replace skill wording in `text` with the job description's wording, where that is safe:
 *   - pure spelling or case variants ("programme" -> "program")
 *   - acronym <-> expansion, written as "Expansion (ACR)" once
 *   - two swap-safe forms of the same skill, neither containing the other
 * Never inside a compound joined by / or &.
 */
export function applySwaps(text, jdSkills, idx, used) {
  const tokens = tokenize(text);
  const ms = findSkills(tokens, idx, text, { ext: false });
  let out = '';
  let last = 0;
  const swaps = [];
  for (const m of ms) {
    const js = jdSkills.get(m.id);
    if (!js) continue;
    const src = text.slice(m.s, m.e);
    const nearJoin = (tokens[m.i - 1] && tokens[m.i - 1].kind === 'j') || (tokens[m.j] && tokens[m.j].kind === 'j');
    const srcLiteral = m.how !== 'bag' && spellSeq(src) === spellSeq(m.form);
    let to = null;
    for (const cand of js.surfaces) {
      const tgt = cand.surface;
      if (!tgt || tgt.toLowerCase() === src.toLowerCase()) { to = null; break; }
      if (tgt.length > 5 && tgt === tgt.toUpperCase()) continue; // shouted headings are not wording
      if (spellSeq(tgt) === spellSeq(src)) {
        const hyphenOnly = tgt.toLowerCase().replace(/[-\s]/g, '') === src.toLowerCase().replace(/[-\s]/g, '');
        if (tgt.toLowerCase() !== src.toLowerCase() && !hyphenOnly) { to = matchCase(src, tgt); break; }
        continue;
      }
      if (nearJoin || !srcLiteral || cand.how === 'bag' || spellSeq(tgt) !== spellSeq(cand.form || '')) continue;
      if (isAcronymOf(src, tgt)) { to = used.has(m.id) ? src : `${tgt} (${src})`; break; }
      if (isAcronymOf(tgt, src)) { to = used.has(m.id) ? tgt : `${src} (${tgt})`; break; }
      const a = spellSeq(tgt), b = spellSeq(src);
      if (m.swap && cand.swap && !a.includes(b) && !b.includes(a)) { to = matchCase(src, tgt); break; }
    }
    if (to && to !== src) {
      out += text.slice(last, m.s) + to;
      last = m.e;
      swaps.push({ from: src, to, id: m.id });
    }
  }
  out += text.slice(last);
  // fix "a"/"an" in front of anything that changed
  out = out.replace(/\b([Aa]n?) ([A-Za-z0-9][\w\-\/]*)/g, (all, art, w) => {
    const want = aOrAn(w);
    return (art[0] === 'A' ? want[0].toUpperCase() + want.slice(1) : want) + ' ' + w;
  });
  return { text: out, swaps };
}

function applyDomainPairs(text, pairs, sector) {
  let t = text;
  for (const p of pairs || []) if (!p.when || p.when === sector) t = t.split(p.from).join(p.to);
  return t;
}

// ---- assembly ----------------------------------------------------------------

function verbOptions(verbs, synonyms) {
  const out = [];
  for (const v of verbs) {
    out.push(v);
    for (const group of synonyms) if (group.includes(v)) for (const g of group) if (!out.includes(g)) out.push(g);
  }
  return out;
}

function noCommaOutcome(t) {
  return /^(with|without|while|now)\b/i.test(t);
}

/**
 * Build one sentence.
 * spec: { pattern: 'C'|'R'|'M', verb, join: 'by'|'comma', include:Set<partIndex>, pv: Map<partIndex, verb>, tense }
 */
function assemble(a, spec, opts) {
  const P = (v) => conjugate(v, spec.tense === 'present' ? 'base' : 'past', opts);
  const G = (v) => conjugate(v, 'ing', opts);
  const on = (p) => p.req || spec.include.has(p.i);
  const get = (type) => a.partsP.filter(p => p.type === type && on(p));
  const pv = (p) => spec.pv.get(p.i) || p.verbs[0];
  const details = get('detail'), contexts = get('context'), scopes = get('scope'), lists = get('list');
  // A relative clause ("two of which reached production") describes the object, so it stays beside it.
  const REL = /^(\w+ of )?(which|whom|whose|who)\b/i;
  const allOutcomes = get('outcome');
  const relOutcomes = allOutcomes.filter(p => REL.test(p.text));
  const outcomes = allOutcomes.filter(p => !REL.test(p.text));
  const purposes = get('purpose'), codas = get('coda');
  const long = (x) => x.split(/\s+/).length > 13;
  const methods = get('method'), thens = get('then'), ands = get('and'), results = get('result');
  const coreObj = a.coreP.obj;

  const tailAfterObject = () => {
    let s = '';
    const followers = contexts.length + scopes.length + ands.length + methods.length + thens.length + results.length +
      lists.length + outcomes.length + purposes.length + codas.length;
    if (details.length) {
      const d = joinList(details.map(p => p.text));
      s += followers ? ` (${d})` : `: ${d}`;
    }
    for (const p of contexts) s += ' ' + p.text;
    // a phrase added to an already long clause gets a comma, so phrases never run together
    const head = (x) => coreObj + s + x;
    for (const p of scopes) s += (long(head('')) ? ', ' : ' ') + p.text;
    for (const p of relOutcomes) s += ', ' + p.text;
    return s;
  };
  let sofar = '';
  const endings = (skipOutcomes) => {
    let s = '';
    for (const p of purposes) s += (long(sofar + s) ? ', ' : ' ') + p.text;
    if (!skipOutcomes) for (const p of outcomes) s += (noCommaOutcome(p.text) ? ' ' : ', ') + p.text;
    if (lists.length) s += ': ' + (lists.length > 1 ? lists.map(p => p.text).join('; ') : lists[0].text);
    for (const p of codas) s += '; ' + p.text;
    return s;
  };

  let s;
  if (spec.pattern === 'R') {
    const r = results[0] || a.partsP.find(p => p.type === 'result');
    if (!r) return null;
    s = `${P(pv(r))} ${r.obj} by ${G(spec.verb)} ${coreObj}` + tailAfterObject();
    if (methods.length) s += ' and ' + joinList(methods.map(p => `${G(pv(p))} ${p.obj}`));
    if (thens.length) s += ', ' + joinList(thens.map(p => `${G(pv(p))} ${p.obj}`));
    sofar = s; s += endings(false);
    if (ands.length) s += ', and ' + joinList(ands.map(p => `${P(pv(p))} ${p.obj}`));
  } else if (spec.pattern === 'M') {
    if (!methods.length) return null;
    s = joinList(methods.map(p => `${P(pv(p))} ${p.obj}`)) + `, ${G(spec.verb)} ${coreObj}` + tailAfterObject();
    sofar = s; s += endings(false);
  } else {
    // C: core-led
    const lead = `${P(spec.verb)} ${coreObj}`;
    s = lead + tailAfterObject();
    if (methods.length && spec.join === 'by') s += (long(s) ? ', by ' : ' by ') + joinList(methods.map(p => `${G(pv(p))} ${p.obj}`));
    if (results.length) s += ', ' + joinList(results.map(p => `${G(pv(p))} ${p.obj}`));
    if (ands.length) {
      const items = ands.map(p => `${P(pv(p))} ${p.obj}`);
      s = items.length === 1 ? `${s}${results.length || long(s) ? ',' : ''} and ${items[0]}` : `${s}, ${joinList(items)}`;
    }
    const parts = [];
    if (methods.length && spec.join !== 'by') parts.push(...methods.map(p => `${G(pv(p))} ${p.obj}`));
    parts.push(...thens.map(p => `${G(pv(p))} ${p.obj}`));
    if (parts.length) s += ', ' + joinList(parts);
    sofar = s; s += endings(false);
  }
  return capFirst(tidy(s + '.'));
}

/**
 * Generate and score sentence candidates for one achievement.
 * ctx: { jd, jdMap: Map<id, jdSkill>, idx, rules, profile, sector, state:{verbs:Map, roleVerbs:Map}, tense, partSkills }
 */
export function realize(a, ctx) {
  const { jdMap, idx, rules, profile } = ctx;
  const opts = { spelling: profile.spelling };
  const synonyms = rules.verbSynonyms || [];
  const jdVerbs = new Set(ctx.jd ? ctx.jd.verbs : []);

  // Slot choices: the alternative whose wording best matches the JD.
  const slotChoice = new Map();
  const allSlots = new Set([...slotsOf(a.text), ...slotsOf(a.core), ...(a.parts || []).flatMap(slotsOf)]);
  for (const inner of allSlots) {
    const alts = inner.split('|').map(x => x.trim());
    let best = alts[0], bestScore = -1;
    for (const alt of alts) {
      let sc = 0;
      for (const m of findSkills(tokenize(alt), idx, alt, { ext: false })) sc += jdMap.get(m.id)?.weight || 0;
      if (ctx.jd && ctx.jd.text.toLowerCase().includes(alt.toLowerCase())) sc += 0.2;
      if (sc > bestScore + 1e-9) { best = alt; bestScore = sc; }
    }
    slotChoice.set(inner, best);
  }
  const resolve = (s) => applyDomainPairs(fillSlots(s, slotChoice), profile.domainPairs, ctx.sector);
  const pa = {
    ...a,
    coreP: { ...a.coreP, obj: resolve(a.coreP.obj) },
    partsP: a.partsP.map(p => (p.text != null ? { ...p, text: resolve(p.text) } : { ...p, obj: resolve(p.obj) }))
  };

  // Vocabulary for the integrity check: this achievement's own words only.
  const allVerbs = [...a.coreP.verbs, ...a.partsP.flatMap(p => p.verbs || [])];
  const vocab = vocabOf([
    a.text, a.core.split('::').slice(1).join(' '), ...(a.parts || []).map(p => splitTags(p).body.split('::').slice(1).join(' ')),
    ...(a.facts || []), ...(profile.domainPairs || []).map(p => p.to)
  ], verbOptions(allVerbs, synonyms));

  // Relevance of optional parts
  const partRel = new Map();
  for (const p of pa.partsP) {
    let r = 0;
    for (const id of ctx.partSkills.get(p.i) || []) r += jdMap.get(id)?.weight || 0;
    if (/\d/.test(p.text || p.obj || '')) r += 0.05;
    partRel.set(p.i, r);
  }
  const optional = pa.partsP.filter(p => !p.req);
  const subsets = [];
  const addSubset = (set) => { const key = [...set].sort().join(','); if (!subsets.some(s => s.key === key)) subsets.push({ key, set }); };
  addSubset(new Set(optional.map(p => p.i)));
  addSubset(new Set(optional.filter(p => partRel.get(p.i) > 0.05).map(p => p.i)));
  addSubset(new Set());
  const ranked = [...optional].sort((x, y) => partRel.get(y.i) - partRel.get(x.i));
  if (ranked.length) addSubset(new Set([ranked[0].i]));
  if (ranked.length > 1) addSubset(new Set([ranked[0].i, ranked[1].i]));

  // Verb choice for each verb part: JD verb > unused > first
  const used = ctx.state.verbs;
  const chooseVerb = (verbs) => {
    const opts2 = verbOptions(verbs, synonyms);
    const jd = opts2.find(v => jdVerbs.has(v));
    if (jd) return jd;
    return opts2.find(v => !used.has(v)) || opts2[0];
  };
  const pv = new Map();
  for (const p of pa.partsP) if (p.verbs) pv.set(p.i, chooseVerb(p.verbs));
  const coreVerbs = verbOptions(a.coreP.verbs, synonyms).slice(0, 3);

  const tense = ctx.tense || 'past';
  const raw = [];
  const allow = a.patternsAllowed;
  if (allow.includes('O') && tense === 'past') {
    const pastToLemma = new Map();
    for (const v of verbOptions(allVerbs, synonyms)) pastToLemma.set(conjugate(v, 'past', opts).split(' ')[0].toLowerCase(), v);
    const first = (a.text.match(/^[A-Za-z\-]+/) || [''])[0].toLowerCase();
    raw.push({ text: capFirst(tidy(resolve(a.text))), pattern: 'O', verb: pastToLemma.get(first) || first, include: null });
  }
  const hasResult = pa.partsP.some(p => p.type === 'result');
  const hasMethod = pa.partsP.some(p => p.type === 'method');
  for (const verb of coreVerbs) {
    for (const sub of subsets) {
      const base = { verb, include: sub.set, pv, tense };
      if (allow.includes('C')) {
        raw.push({ ...base, pattern: 'C', join: 'comma' });
        if (hasMethod) raw.push({ ...base, pattern: 'C', join: 'by' });
      }
      if (allow.includes('R') && hasResult) raw.push({ ...base, pattern: 'R' });
      if (allow.includes('M') && hasMethod) raw.push({ ...base, pattern: 'M' });
    }
  }

  const seen = new Map();
  const rejected = [];
  const B = rules.bullet;
  const banned = (rules.bannedWords || []).map(w => w.toLowerCase());
  for (const spec of raw) {
    let text = spec.text || assemble(pa, spec, opts);
    if (!text) continue;
    const sw = applySwaps(text, jdMap, idx, ctx.usedAcronyms || new Set());
    text = sw.text;
    if (seen.has(text)) continue;
    const swapVocab = new Set(vocab);
    for (const s of sw.swaps) for (const t of tokenize(s.to)) if (t.kind === 'w') swapVocab.add(light(t.t));
    const gaps = integrityGaps(text, swapVocab);
    if (gaps.length) { rejected.push({ text, gaps }); continue; }
    const lower = text.toLowerCase();
    if (spec.pattern !== 'O' && banned.some(w => lower.includes(w))) continue;
    const secret = findTerms(text, rules.confidentialTerms);
    if (secret.length) { rejected.push({ text, gaps: secret, confidential: true }); continue; }
    if (text.length > B.hardMax && spec.pattern !== 'O') continue;

    // score
    const ms = findSkills(tokenize(text), idx, text, { ext: false });
    const hit = new Map();
    for (const m of ms) { const js = jdMap.get(m.id); if (js && !hit.has(m.id)) hit.set(m.id, { w: js.weight, at: m.s }); }
    let kw = 0;
    for (const h of hit.values()) kw += h.w;
    const topHit = [...hit.values()].sort((x, y) => y.w - x.w)[0];
    const front = topHit && topHit.at < 60 ? 0.12 * topHit.w : 0;
    const leadVerb = spec.pattern === 'R' ? pv.get(pa.partsP.find(p => p.type === 'result')?.i) :
      spec.pattern === 'M' ? pv.get(pa.partsP.find(p => p.type === 'method')?.i) : spec.verb;
    const verbJD = leadVerb && jdVerbs.has(leadVerb) ? 0.08 : 0;
    const L = text.length;
    const lenPen = L > B.idealMax ? (L - B.idealMax) / 90 : L < B.idealMin ? (B.idealMin - L) / 200 : 0;
    const fidelity = spec.pattern === 'O' ? (L <= B.idealMax + 25 ? 0.14 : 0.06) : spec.pattern === 'C' ? (spec.join === 'by' ? 0.07 : 0.05) : 0;
    const metric = /\d/.test(text) ? 0.06 : 0;
    const carried = spec.pattern === 'O' ? pa.partsP.length : pa.partsP.filter(p => p.req || spec.include.has(p.i)).length;
    const richness = Math.min(0.15, 0.05 * carried);
    const lv = leadVerb || '';
    const roleUsed = ctx.state.roleVerbs.get(a.role) || new Set();
    const rep = roleUsed.has(lv) ? 0.5 : (used.get(lv) || 0) >= 2 ? 0.3 : (used.get(lv) || 0) === 1 ? 0.1 : 0;
    const score = kw + front + verbJD + fidelity + metric + richness - lenPen - rep;
    seen.set(text, { text, score, pattern: spec.pattern, leadVerb: lv, skills: [...hit.keys()], swaps: sw.swaps, length: L });
  }
  const candidates = [...seen.values()].sort((x, y) => y.score - x.score);
  return { candidates, rejected, slotChoice };
}
