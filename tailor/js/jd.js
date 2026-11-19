// Job description analysis: sections, requirement strength, years, skills, unknown terms, weights.

import { tokenize, spell, light, exactKey, STOP } from './text.js';
import { findSkills, skillName } from './taxonomy.js';

const SECTION_PATTERNS = [
  ['benefits', /^(benefits|perks|perks (and|&) benefits|what we offer|why join( us)?|why (work|you('ll| will) love working) (with|here)( us)?|compensation( and benefits)?|salary|pay|our offer|we offer|rewards|total rewards|equal (employment )?opportunity( employer)?|eeo( statement)?|diversity|diversity,? (equity )?(and|&) inclusion|how to apply|application process|location|work (model|location|arrangement)|hiring process|interview process|additional information|disclaimer|accommodations?|privacy notice|our commitment)$/],
  ['role', /^(about (the|this) (role|job|position|opportunity)|the role|role (overview|summary|description|purpose)|job (summary|overview|description|purpose|brief)|position (summary|overview|description)|overview|summary|purpose( of the role)?|the opportunity|your mission|mission|description|role|job description|the position|position)$/],
  ['resp', /^((key |main |primary |core |your |job |principal |major )?(responsibilities|duties|accountabilities)|what (you('ll| will)|you would) (do|own|be doing|work on)|what you'll be doing|in this role,? you( will|'ll)?|day[- ]to[- ]day|a day in the life|your (role|impact|day)|the work|key result areas|kras?|roles? (and|&) responsibilities|what the job involves|you will|how you('ll| will) make an impact|scope of (the )?(role|work)|key deliverables|deliverables|outcomes|what success looks like|your responsibilities)$/],
  ['pref', /^((preferred|desired|desirable|additional|bonus|nice[- ]to[- ]have|good[- ]to[- ]have)( qualifications| skills| experience| requirements| points| criteria)?|nice to haves?|bonus points( if you have)?|it would be great if you( have)?|extra credit|pluses|preferred but not required|what would make you stand out|ideally,? you('ll| will)? have|you might also have|even better if)$/],
  ['req', /^((minimum |basic |required |essential |key |must[- ]have |core |mandatory )?(qualifications|requirements|skills|experience|criteria|competenc(ies|y)|skill ?set)( and (experience|qualifications|skills))?|what (you('ll| will)|you) (need|bring|have)|what we('re| are) looking for|who you are|about you|you (have|bring|are|should have)|must[- ]haves?|skills (and|&) (experience|qualifications)|experience (and|&) (skills|qualifications)|required skills|desired profile|candidate profile|eligibility( criteria)?|essential skills|we('re| are) looking for|ideal candidate|the ideal candidate|technical skills|education|education (and|&) experience|knowledge,? skills,? (and|&) abilities|your profile|profile|requirements (and|&) qualifications|what it takes|what makes you a (great|good) fit|key skills|skills required|experience required)$/],
  ['about', /^(about (us|the company|the team|our company|[a-z0-9 &.,'-]{2,40})|who we are|our (company|story|mission|team|values|culture)|company (overview|description|profile)|the company|why us|the team)$/],
];

const ROLE_WORD = /\b(manager|lead|leader|head|director|engineer|analyst|consultant|owner|architect|specialist|officer|coordinator|scientist|developer|designer|administrator|executive|master|coach|partner|president|vp|principal|associate|strategist|advisor|adviser|controller|planner)\b/i;

const MUST = /\b(must|required|requirement|mandatory|essential|need to have|needs to have|minimum|at least|proven|strong|extensive|deep|expert|expertise|hands-on|hands on|demonstrated|solid|significant|thorough|advanced|in-depth|track record|substantial|excellent|exceptional)\b/i;
const NICE = /\b(preferred|nice to have|nice-to-have|good to have|a plus|plus|bonus|desirable|ideally|familiarity|familiar|exposure|awareness|basic understanding|an advantage|advantageous|beneficial|would be great|optional|not required but)\b/i;
const NEG = /\b(no|not)\b[^.]{0,30}\b(required|necessary|needed|expected|mandatory)\b/i;
const YEARS = /(\d{1,2})\s*(?:\+|plus)?\s*(?:(?:-|–|to)\s*(\d{1,2})\s*\+?)?\s*(?:years?|yrs?)\b/i;

const COORD_HEADS = new Set(['management', 'planning', 'analysis', 'testing', 'development', 'reporting', 'governance', 'design',
  'architecture', 'engineering', 'strategy', 'delivery', 'support', 'operations', 'integration', 'automation', 'modeling',
  'modelling', 'assessment', 'monitoring', 'optimization', 'optimisation', 'security', 'compliance', 'research', 'tracking',
  'control', 'manager', 'managers', 'skills', 'experience', 'services', 'systems', 'platforms', 'tools']);

const CUES = new Set(['experience', 'experienced', 'expertise', 'proficiency', 'proficient', 'knowledge', 'knowledgeable', 'understanding',
  'familiarity', 'familiar', 'background', 'skilled', 'skills', 'exposure', 'competence', 'competency', 'fluency', 'fluent',
  'certification', 'certified', 'degree', 'mastery', 'command', 'grounding']);
const CUE_PREP = new Set(['in', 'with', 'of', 'using', 'across', 'on', 'around', 'within', 'for']);

const GENERIC = new Set(('experience years year skills skill ability abilities team teams role roles company business work working opportunity ' +
  'environment candidate candidates people culture knowledge understanding background level degree field related relevant similar ' +
  'strong excellent good great proven track record plus etc ideal individual individuals position job responsibilities requirements ' +
  'organization organisation clients client customer customers stakeholders partners products product services service solution ' +
  'solutions technology technologies tools tool area areas function functions world industry mission vision values way ways things ' +
  'time day days week weeks month months impact success results outcomes value quality focus approach number range variety ' +
  'background minimum maximum least preferred required equivalent least including include us our we you your they them ' +
  'demonstrated excellent effectively closely across multiple various key core new high large small best other others able capable ' +
  'knowledge degree bachelor master masters masters').split(' '));

const CAPS_IGNORE = new Set(['I', 'A', 'US', 'UK', 'EU', 'USA', 'UAE', 'EEO', 'HR', 'IT', 'OK', 'AM', 'JD', 'FAQ', 'ASAP', 'NA', 'TBD',
  'CV', 'LLC', 'LLP', 'INC', 'PVT', 'LTD', 'Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'ID', 'NYC', 'SF', 'APAC', 'EMEA', 'LATAM', 'AND', 'OR',
  'THE', 'WE', 'YOU', 'OUR', 'CTC', 'LPA', 'INR', 'USD', 'GBP', 'EUR', 'WFH', 'PTO', 'FTE', 'HQ', 'TL', 'DR']);

const SENIORITY = new Set(['senior', 'junior', 'lead', 'principal', 'head', 'associate', 'staff', 'chief', 'sr', 'jr']);
const PLACES = new Set(('india us usa uk london bangalore bengaluru mumbai delhi new delhi pune hyderabad chennai noida gurgaon gurugram ' +
  'kolkata ahmedabad singapore dubai europe asia apac emea america north america canada australia germany france japan remote hybrid onsite ' +
  'monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december').split(' '));

function headingType(line) {
  let t = line.trim().replace(/^[#*\-•\d.)\s]+/, '').replace(/[:：]\s*$/, '').replace(/\*+/g, '').trim().toLowerCase();
  t = t.replace(/\s+/g, ' ');
  if (!t || t.length > 70) return null;
  for (const [type, re] of SECTION_PATTERNS) if (re.test(t)) return type;
  return null;
}

function looksLikeHeading(line) {
  const t = line.trim();
  if (!t || t.length > 70 || /[.!?]$/.test(t)) return false;
  if (/:$/.test(t)) return true;
  const wordsN = t.split(/\s+/).length;
  if (wordsN > 7) return false;
  if (t === t.toUpperCase() && /[A-Z]/.test(t)) return true;
  return /^(\*\*|#)/.test(t);
}

/** Split JD text into items (bullets or sentences) with section and strength. */
function segment(text) {
  const lines = [];
  let pos = 0;
  for (const raw of text.split('\n')) { lines.push({ raw, s: pos, e: pos + raw.length }); pos += raw.length + 1; }
  const items = [];
  const sections = [];
  let section = 'intro';
  let title = null;
  let seenContent = false;
  for (const L of lines) {
    const raw = L.raw;
    if (!raw.trim()) continue;
    // "Job title: X"
    const tm = raw.match(/^\s*(job title|title|position|role|designation)\s*[:\-–]\s*(.+)$/i);
    if (tm && !title) { title = { text: tm[2].trim(), s: L.s + raw.indexOf(tm[2]), e: L.e }; seenContent = true; continue; }
    const ht = headingType(raw);
    const inline = raw.match(/^\s*([A-Za-z][A-Za-z '&\-/]{2,45})\s*[:：]\s*(\S.*)$/);
    if (ht && !inline) {
      section = ht; sections.push({ type: ht, heading: raw.trim(), s: L.s, e: L.e });
      seenContent = true; continue;
    }
    if (inline) {
      const it = headingType(inline[1]);
      if (it) {
        section = it; sections.push({ type: it, heading: inline[1].trim(), s: L.s, e: L.e });
        const off = raw.indexOf(inline[2]);
        pushItems(items, inline[2], L.s + off, section);
        seenContent = true; continue;
      }
    }
    if (!seenContent && !title && raw.trim().length <= 90 && ROLE_WORD.test(raw) && !/[.!?]$/.test(raw.trim())) {
      const t = raw.trim().replace(/^[#*\s]+|[*\s]+$/g, '');
      title = { text: t, s: L.s + raw.indexOf(t), e: L.s + raw.indexOf(t) + t.length };
      seenContent = true; continue;
    }
    if (looksLikeHeading(raw)) {
      section = 'other'; sections.push({ type: 'other', heading: raw.trim(), s: L.s, e: L.e });
      seenContent = true; continue;
    }
    seenContent = true;
    pushItems(items, raw, L.s, section);
  }
  return { items, sections, title };
}

function pushItems(items, raw, base, section) {
  const body = raw.replace(/^\s*([-*•·▪◦●]|\d+[.)])\s*/, '');
  const off = raw.indexOf(body);
  const parts = body.length > 220 ? body.split(/(?<=[.!?;])\s+(?=[A-Z])/) : [body];
  let cursor = 0;
  for (const p of parts) {
    const at = body.indexOf(p, cursor);
    cursor = at + p.length;
    const s = base + off + at;
    items.push({ text: p, s, e: s + p.length, section, ...strengthOf(p, section) });
  }
}

function strengthOf(text, section) {
  const y = text.match(YEARS);
  let strength = 1;
  let must = false;
  if (NEG.test(text)) strength = 0.3;
  else if (NICE.test(text)) strength = 0.6;
  else if (MUST.test(text) || y) { strength = 1.4; must = true; }
  if (section === 'pref') { strength = Math.min(strength, 0.8); must = false; }
  if (section === 'req' && strength >= 1) must = true;
  return { strength, must, years: y ? parseInt(y[1], 10) : null };
}

/** Expand "risk, issue and change management" into each skill, given the mention for "change management". */
function expandCoordination(tokens, mentions, idx, text) {
  const added = [];
  const taken = new Set();
  for (const m of mentions) for (let k = m.i; k < m.j; k++) taken.add(k);
  for (const m of mentions) {
    const head = tokens[m.j - 1];
    if (!head || !COORD_HEADS.has(spell(head.t))) continue;
    // walk back over: word (and|or|,|&|/) word ...
    let k = m.i - 1;
    let guard = 0;
    while (k >= 1 && guard++ < 6) {
      const sep = tokens[k];
      const isSep = (sep.kind === 'b' && sep.t === ',') || sep.kind === 'j' ||
        (sep.kind === 'w' && /^(and|or)$/i.test(sep.t));
      if (!isSep) break;
      let w = k - 1;
      // allow "and" after a comma (Oxford comma)
      if (tokens[w] && tokens[w].kind === 'w' && /^(and|or)$/i.test(tokens[w].t)) w--;
      const word = tokens[w];
      if (!word || word.kind !== 'w' || taken.has(w) || STOP.has(spell(word.t))) break;
      const key = exactKey([word, ...tokens.slice(m.j - 1, m.j)]);
      const hit = idx.exact.get(key);
      if (!hit) break;
      added.push({ id: hit.id, i: w, j: w + 1, s: word.s, e: word.e, surface: text.slice(word.s, word.e) + ' ' + head.t, how: 'coord', form: hit.form, swap: false });
      taken.add(w);
      k = w - 1;
    }
  }
  return added;
}

/** Candidate skill phrases the taxonomy did not recognise. */
function discover(tokens, mentions, text) {
  const covered = new Array(tokens.length).fill(false);
  for (const m of mentions) for (let k = m.i; k < m.j; k++) covered[k] = true;
  const found = [];
  const push = (a, b, why) => {
    while (a < b && (STOP.has(spell(tokens[a].t)) || GENERIC.has(spell(tokens[a].t)))) a++;
    while (b > a && (STOP.has(spell(tokens[b - 1].t)) || GENERIC.has(spell(tokens[b - 1].t)))) b--;
    while (a < b && ((/ing$/.test(tokens[a].t) && /^[a-z]/.test(tokens[a].t)) || CUE_PREP.has(spell(tokens[a].t)))) a++;
    if (b <= a || b - a > 4) return;
    for (let k = a; k < b; k++) if (covered[k] || tokens[k].kind !== 'w') return;
    if (b - a === 1 && why === 'cue' && /^[a-z]+$/.test(tokens[a].t)) return;
    const term = text.slice(tokens[a].s, tokens[b - 1].e);
    if (term.length < 2 || /^\d+$/.test(term)) return;
    found.push({ term, s: tokens[a].s, e: tokens[b - 1].e, why, key: tokens.slice(a, b).map(t => light(t.t)).join(' ') });
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind !== 'w') continue;
    // (a) cue phrases: "experience with X, Y and Z"
    if (CUES.has(spell(t.t))) {
      let k = i + 1;
      while (k < tokens.length && tokens[k].kind === 'w' && (CUE_PREP.has(spell(tokens[k].t)) || /^(the|a|an|modern|large|complex)$/i.test(tokens[k].t))) k++;
      let start = k;
      let guard = 0;
      while (k < tokens.length && guard++ < 16) {
        const tk = tokens[k];
        const stop = tk.kind === 'b' && tk.t !== ',' ;
        const sep = (tk.kind === 'b' && tk.t === ',') || tk.kind === 'j' || (tk.kind === 'w' && /^(and|or)$/i.test(tk.t));
        if (stop || sep || (tk.kind === 'w' && STOP.has(spell(tk.t)) && !/^(and|or)$/i.test(tk.t))) {
          if (k > start) push(start, k, 'cue');
          if (stop || (tk.kind === 'w' && STOP.has(spell(tk.t)) && !/^(and|or)$/i.test(tk.t))) break;
          start = k + 1;
        }
        k++;
      }
    }
    if (covered[i]) continue;
    // (b) technical-looking tokens
    const raw = t.t;
    const techShape = /[a-z][A-Z]/.test(raw) || /[A-Za-z]\d|\d[A-Za-z]/.test(raw) && !/^\d+(st|nd|rd|th|x|k|m)$/i.test(raw) ||
      /[#+]$/.test(raw) || /^[A-Za-z]+\.[A-Za-z]+$/.test(raw) || (/^[A-Z]{2,6}$/.test(raw) && !CAPS_IGNORE.has(raw));
    if (techShape && !/^\d/.test(raw)) { push(i, i + 1, 'shape'); continue; }
    // (c) capitalised run mid-sentence: "Microsoft Fabric"
    if (/^[A-Z][a-z]/.test(raw) && !t.start) {
      let k = i;
      while (k < tokens.length && tokens[k].kind === 'w' && /^[A-Z]/.test(tokens[k].t) && !covered[k]) k++;
      if (k - i >= 1 && k - i <= 4) push(i, k, 'proper');
      i = k - 1;
    }
  }
  return found;
}

/**
 * Analyse a job description.
 * ctx: { idx, tax, rules, corpus: {n, df:{id:count}}, ignored:Set(keys) }
 */
export function analyzeJD(text, ctx) {
  const { idx, tax, rules } = ctx;
  const { items, sections, title } = segment(text);
  const tokens = tokenize(text);

  // item lookup by offset
  const itemAt = (pos) => {
    for (const it of items) if (pos >= it.s && pos < it.e) return it;
    return null;
  };

  let mentions = findSkills(tokens, idx, text, { ext: ctx.ext !== false });
  mentions = mentions.concat(expandCoordination(tokens, mentions, idx, text));
  mentions.sort((a, b) => a.s - b.s);

  const inTitle = (m) => title && m.s >= title.s && m.e <= title.e;
  for (const m of mentions) {
    if (inTitle(m)) { m.section = 'title'; m.strength = 1.4; m.must = true; m.item = null; continue; }
    const it = itemAt(m.s);
    m.item = it;
    m.section = it ? it.section : 'intro';
    m.strength = it ? it.strength : 1;
    m.must = it ? it.must : false;
  }

  // Aggregate per skill
  const sw = rules.sectionWeights;
  const cf = rules.categoryFactors;
  const corpusN = ctx.corpus?.n || 0;
  const bySkill = new Map();
  for (const m of mentions) {
    const s = m.id.startsWith('ext:') ? null : tax.skills.get(m.id);
    const cat = s ? s.cat : 'ext';
    if (cat === 'role') continue;
    let w = sw[m.section] ?? 1;
    if (m.section === 'about' && cat === 'domain') w = rules.domainInAbout;
    w *= m.strength;
    if (m.how === 'bag') w *= 0.9;
    if (w <= 0) continue;
    let rec = bySkill.get(m.id);
    if (!rec) {
      rec = { id: m.id, name: s ? s.name : skillName(tax, m.id), cat, abstract: !!(s && s.abstract), ext: !s, ws: [], mentions: [], surfaces: new Map(), must: false, years: null, sections: new Set() };
      bySkill.set(m.id, rec);
    }
    rec.ws.push(w);
    rec.mentions.push(m);
    rec.sections.add(m.section);
    rec.must = rec.must || m.must;
    if (m.item && m.item.years) rec.years = Math.max(rec.years || 0, m.item.years);
    const sf = m.surface.trim();
    const sk = { surface: sf, swap: m.swap, form: m.form, how: m.how };
    const prev = rec.surfaces.get(sf.toLowerCase());
    rec.surfaces.set(sf.toLowerCase(), prev ? { ...prev, count: prev.count + 1 } : { ...sk, count: 1 });
  }

  const skills = [];
  for (const rec of bySkill.values()) {
    rec.ws.sort((a, b) => b - a);
    let raw = rec.ws[0] + 0.35 * rec.ws.slice(1, 4).reduce((a, b) => a + b, 0);
    raw *= cf[rec.cat] ?? 1;
    if (rec.abstract) raw *= 0.7;
    if (corpusN >= 5 && !rec.ext) {
      const df = ctx.corpus.df[rec.id] || 0;
      raw *= Math.min(1.4, Math.max(0.6, 1.4 - 0.8 * (df / corpusN)));
    }
    const best = [...rec.surfaces.values()].sort((a, b) => b.count - a.count || b.surface.length - a.surface.length)[0];
    skills.push({
      id: rec.id, name: rec.name, cat: rec.cat, abstract: rec.abstract, ext: rec.ext,
      raw, must: rec.must, years: rec.years, count: rec.mentions.length,
      surface: best.surface, surfaces: [...rec.surfaces.values()], sections: [...rec.sections],
      mentions: rec.mentions.map(m => ({ s: m.s, e: m.e, how: m.how }))
    });
  }
  const max = Math.max(1e-9, ...skills.map(s => s.raw));
  for (const s of skills) {
    s.weight = s.raw / max;
    s.score = Math.round(100 * s.weight);
    s.tier = s.weight >= 0.6 ? 'critical' : s.weight >= 0.3 ? 'important' : 'supporting';
  }
  skills.sort((a, b) => b.weight - a.weight);

  // Unknown terms
  const ignored = ctx.ignored || new Set();
  const roleMentions = findSkills(tokens, idx.roles, text, { ext: false });
  const disc = discover(tokens, mentions.concat(roleMentions), text);
  const unk = new Map();
  for (const d of disc) {
    if (ignored.has(d.key)) continue;
    const it = itemAt(d.s);
    if (!it) continue;
    const section = it.section;
    const lineText = it.text;
    if (d.why !== 'cue' && lineText.replace(/[^A-Za-z]/g, '').length > 12 && lineText === lineText.toUpperCase()) continue;
    if (PLACES.has(d.term.toLowerCase()) || SENIORITY.has(d.term.toLowerCase())) continue;
    const w = (sw[section] ?? 1) * (it ? it.strength : 1);
    if (w <= 0) continue;
    const rec = unk.get(d.key) || { term: d.term, key: d.key, count: 0, w: 0, why: d.why, spans: [] };
    rec.count++; rec.w += w; rec.spans.push({ s: d.s, e: d.e });
    if (d.why === 'cue') rec.why = 'cue';
    unk.set(d.key, rec);
  }
  const unknown = [...unk.values()].map(u => ({ ...u, w: u.w * (u.why === 'cue' ? 1 : 0.7) }))
    .sort((a, b) => b.w - a.w).slice(0, 40);

  // Years asked overall
  let overallYears = null;
  for (const it of items) {
    if (!it.years) continue;
    const inItem = mentions.filter(m => m.item === it);
    const general = inItem.length === 0 || inItem.some(m => {
      const s = tax.skills.get(m.id);
      return s && ['delivery', 'method', 'product', 'leadership'].includes(s.cat);
    }) || /\b(overall|total|professional|relevant|industry|work)\b/i.test(it.text) ||
      /\d+\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience\b(?!\s+(?:in|with|using|on|of)\b)/i.test(it.text);
    if (general) overallYears = Math.max(overallYears || 0, it.years);
  }

  // Verbs leading responsibility items
  const verbSet = new Set(rules.jdVerbs);
  const verbs = new Map();
  for (const it of items) {
    if (!['resp', 'role', 'intro', 'other'].includes(it.section)) continue;
    const first = it.text.trim().split(/\s+/)[0] || '';
    const lemma = verbLemma(first.toLowerCase().replace(/[^a-z]/g, ''));
    if (verbSet.has(lemma)) verbs.set(lemma, (verbs.get(lemma) || 0) + 1);
  }

  // Sector
  const govHits = (text.match(/\b(government|ministry|ministries|public sector|public-sector|e-governance|egovernance|psus?|citizen|federal|state government|municipal|department of)\b/gi) || []).length;
  const govSkill = skills.some(s => (['govtech', 'digital-public-infrastructure', 'digital-india'].includes(s.id) || s.cat === 'govt' && s.id !== 'public-sector') && s.sections.some(x => x !== 'benefits'));
  const sector = govHits >= 2 || govSkill ? 'public' : 'private';

  // Title roles
  let titleRoles = [];
  if (title) {
    const tt = tokenize(title.text);
    titleRoles = findSkills(tt, idx.roles, title.text, { ext: false }).map(m => m.id);
  }
  const seniority = title && (title.text.match(/\b(senior|sr\.?|lead|principal|staff|head|director|vp|vice president|associate|junior|jr\.?|chief)\b/i) || [])[0] || null;

  const techWeight = skills.filter(s => ['lang', 'framework', 'engineering', 'cloud', 'devops', 'data', 'ai', 'blockchain', 'security'].includes(s.cat))
    .reduce((a, s) => a + s.weight, 0);
  const totalWeight = skills.reduce((a, s) => a + s.weight, 0) || 1;

  return {
    text, title, titleRoles, seniority, sector, sections, items, skills, unknown,
    years: overallYears, verbs: [...verbs.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v),
    technical: techWeight / totalWeight
  };
}

// Small verb lemmatiser for JD verbs ("leads", "driving", "managed").
export function verbLemma(w) {
  if (!w) return w;
  if (/ies$/.test(w)) return w.slice(0, -3) + 'y';
  if (/(ss|us)$/.test(w)) return w;
  if (/ing$/.test(w) && w.length > 5) { const b = w.slice(0, -3); return /([bdgmnprt])\1$/.test(b) ? b.slice(0, -1) : (/(at|iz|is|iv|ur|ag|in|ov|us|ud|ar|ac|rg|ul|ov|ib|it|in)$/.test(b) ? b + 'e' : b); }
  if (/es$/.test(w) && /(ch|sh|x|ss|z)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w)) return w.slice(0, -1);
  if (/ed$/.test(w)) { const b = w.slice(0, -2); return /([bdgmnprt])\1$/.test(b) ? b.slice(0, -1) : b; }
  return w;
}
