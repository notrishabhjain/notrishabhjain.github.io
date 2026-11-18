// Tokenising, spelling normalisation and conservative stemming.
// Everything in this file is plain, deterministic string handling.

export const STOP = new Set((
  'a an the and or but nor of for to in on at by with from into onto via per as is are was were be been ' +
  'being this that these those it its our your their his her we you they i me my us them who whom which what ' +
  'when where why how all any each every both either neither some such no not only own same so than too very ' +
  'can will just should would could may might must shall do does did done having have has had also etc e.g ' +
  'i.e within across over under up out about after before while including include includes using through ' +
  'well more most other others new one two three four five six seven eight nine ten plus'
).split(' '));

// Words allowed *inside* an order-insensitive window ("management of vendors").
const BAG_INNER = new Set(['of', 'for', 'the', 'a', 'an', 'to', 'on', 'in', 'with', 'across']);

const TOKEN_RE = /\.(?:NET|net)\b|[A-Za-z0-9](?:[A-Za-z0-9]|[.'’](?=[A-Za-z0-9]))*[+#]*|[\/&]|[.,;:!?()\[\]{}"“”•·|–—…*▪◦●]|\n/g;
const SENTENCE_BREAK = new Set(['.', '!', '?', ':', '\n', '•', '·', '|', ';', '–', '—', '*', '▪', '◦', '●', '(']);

/**
 * Split text into tokens with offsets.
 * kind: 'w' word, 'j' joiner (/ and &, which may sit inside a skill name), 'b' boundary.
 */
export function tokenize(text) {
  const out = [];
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(text))) {
    const t = m[0];
    let kind;
    if (t === '/' || t === '&') kind = 'j';
    else if (/[A-Za-z0-9]/.test(t)) kind = 'w';
    else kind = 'b';
    const prev = out[out.length - 1];
    const start = !prev || (prev.kind === 'b' && SENTENCE_BREAK.has(prev.t)) ||
      /\n\s*$/.test(text.slice(prev ? prev.e : 0, m.index));
    out.push({ t, s: m.index, e: m.index + t.length, kind, start: kind === 'w' && start });
  }
  return out;
}

// ---- spelling ---------------------------------------------------------------

const UK_US = {
  programme: 'program', programmes: 'programs', modelling: 'modeling', modelled: 'modeled',
  labelling: 'labeling', labelled: 'labeled', travelling: 'traveling', travelled: 'traveled',
  cancelled: 'canceled', cancelling: 'canceling', fulfil: 'fulfill', fulfilment: 'fulfillment',
  enrolment: 'enrollment', judgement: 'judgment', behaviour: 'behavior', behaviours: 'behaviors',
  colour: 'color', centre: 'center', centres: 'centers', defence: 'defense', licence: 'license',
  catalogue: 'catalog', analyses: 'analysis', diagnoses: 'diagnosis', counselling: 'counseling',
  favour: 'favor', honour: 'honor', labour: 'labor', neighbour: 'neighbor', dialogue: 'dialog',
  ageing: 'aging', artefact: 'artifact', artefacts: 'artifacts', learnt: 'learned', towards: 'toward'
};
const ISE_RE = /^(organi|priori|optimi|standardi|digiti|moderni|customi|utili|minimi|maximi|capitali|centrali|decentrali|operationali|moneti|mobili|recogni|reali|speciali|visuali|synchroni|categori|authori|summari|normali|virtuali|containeri|parameteri|industriali|globali|locali|personali|rationali|emphasi|criti|incenti|finali|initiali|stabili|tokeni|internationali|digitali|harmoni|sensiti|legali|formali|commerciali|conceptuali|contextuali|productionali|democrati|economi|empha|apologi|itemi|memori|monopoli|patroni|publici|scrutini|sympathi|theori|computeri|operationali|hospitali|subsidi)s(e|es|ed|ing|ation|ations|er|ers)$/;
const YSE_RE = /^(anal|paral|catal)ys(e|ed|ing)$/;

/** Lowercase, drop possessives, map UK spellings to US. */
export function spell(raw) {
  let w = raw.toLowerCase().replace(/[’']s$/, '').replace(/[’']$/, '').replace(/’/g, "'");
  if (UK_US[w]) return UK_US[w];
  if (ISE_RE.test(w)) return w.replace(ISE_RE, (_, a, b) => a + 'z' + b);
  if (YSE_RE.test(w)) return w.replace(YSE_RE, (_, a, b) => a + 'yz' + b);
  return w;
}

// ---- stemming ---------------------------------------------------------------

const KEEP = new Set(['news', 'species', 'series', 'analytics', 'logistics', 'statistics', 'economics',
  'ethics', 'metrics', 'sales', 'kudos', 'aws', 'gis', 'ios', 'devops', 'finops', 'mlops', 'secops',
  'devsecops', 'sres', 'jenkins', 'kubernetes', 'pandas', 'cross', 'process', 'access', 'success', 'business',
  'address', 'express', 'less', 'class', 'gas', 'bias', 'canvas', 'atlas', 'alias', 'thesis', 'basis']);

function undouble(w) {
  return /([bdfgkmnprtz])\1$/.test(w) ? w.slice(0, -1) : w;
}

/** Inflection-only stem: plurals, -ing, -ed, final -e. Used for exact matching. */
export function light(raw) {
  if (/^[A-Z][A-Z0-9]+s$/.test(raw)) return raw.slice(0, -1).toLowerCase(); // KPIs -> kpi
  // Short all-caps tokens are acronyms; longer ones are just shouted words ("STAKEHOLDERS").
  if ((/^[A-Z0-9]{2,5}$/.test(raw) && /[A-Z]/.test(raw)) || /[0-9+#.]/.test(raw)) return raw.toLowerCase();
  let w = spell(raw);
  if (w.length <= 3 || KEEP.has(w)) return w;
  if (/ies$/.test(w) && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (/(ss|us|is|os)$/.test(w)) { /* business, status, analysis */ }
  else if (/(sses|xes|ches|shes|zes)$/.test(w)) w = w.slice(0, -2);
  else if (/s$/.test(w)) w = w.slice(0, -1);

  if (/ing$/.test(w) && w.length > 5 && /[aeiouy]/.test(w.slice(0, -3))) w = undouble(w.slice(0, -3));
  else if (/ied$/.test(w) && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (/eed$/.test(w)) { /* proceed, agreed */ }
  else if (/ed$/.test(w) && w.length > 4 && /[aeiouy]/.test(w.slice(0, -2))) w = undouble(w.slice(0, -2));

  if (/e$/.test(w) && w.length > 4) w = w.slice(0, -1);
  return w;
}

const ER_KEEP = new Set(['customer', 'number', 'member', 'power', 'paper', 'order', 'other', 'after', 'never',
  'under', 'over', 'water', 'offer', 'rather', 'either', 'whether', 'together', 'border', 'chapter', 'folder',
  'matter', 'letter', 'master', 'partner', 'quarter', 'charter', 'banner', 'corner', 'filter', 'layer', 'tier']);

/** Light stem plus derivational folding (management ~ manage, delivery ~ deliver). Bag matching only. */
export function fold(raw) {
  let w = light(raw);
  if (w.length <= 5 || /[0-9+#.]/.test(w)) return w;
  if (/ments?$/.test(w) && w.length > 7) w = w.replace(/ments?$/, '');
  else if (/ization$/.test(w)) w = w.replace(/ization$/, 'iz');
  else if (/entation$/.test(w)) w = w.replace(/entation$/, 'ent');
  else if (/ation$/.test(w)) w = w.replace(/ation$/, 'at');
  else if (/[^a]tion$/.test(w) && !/duction$/.test(w)) w = w.replace(/tion$/, 't');
  else if (/ery$/.test(w)) w = w.replace(/ery$/, 'er');
  if (/er$/.test(w) && w.length > 5 && !ER_KEEP.has(w)) w = w.slice(0, -2);
  if (/e$/.test(w) && w.length > 4) w = w.slice(0, -1);
  return w;
}

/** Key for exact (order-preserving) lookup over a run of tokens. */
export function exactKey(tokens) {
  return tokens.map(t => (t.kind === 'j' ? (t.t === '&' ? 'and' : t.t) : light(t.t))).join(' ');
}

/** Key for order-insensitive lookup, or null when the run is not a valid window. */
export function bagKey(tokens) {
  if (tokens.length < 2 || tokens.length > 5) return null;
  if (tokens.some(t => t.kind !== 'w')) return null;
  const first = spell(tokens[0].t), last = spell(tokens[tokens.length - 1].t);
  if (STOP.has(first) || STOP.has(last)) return null;
  const content = [];
  for (const t of tokens) {
    const s = spell(t.t);
    if (STOP.has(s)) { if (!BAG_INNER.has(s)) return null; continue; }
    content.push(fold(t.t));
  }
  if (content.length < 2 || content.length > 3) return null;
  return content.sort().join('|');
}

export function caseKey(tokens) {
  return tokens.map(t => (t.kind === 'j' ? t.t : t.t)).join(' ');
}

// ---- small helpers ---------------------------------------------------------------

export function slug(s) {
  return s.toLowerCase().replace(/&/g, ' and ').replace(/\+/g, 'plus').replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Split a block of text into sentences, respecting common abbreviations. */
export function sentences(text) {
  const protectedText = text.replace(/\b(e\.g|i\.e|etc|vs|Inc|Ltd|Co|Dr|Mr|Ms|Mrs|St|approx|incl|No)\./g,
    m => m.replace(/\./g, '\u0001'));
  return protectedText.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])|\n+/)
    .map(s => s.replace(/\u0001/g, '.').trim()).filter(Boolean);
}

/** Which of `terms` occur in `text` (case-insensitive, whole words). Used to keep confidential names out. */
export function findTerms(text, terms) {
  if (!terms || !terms.length || !text) return [];
  const hits = [];
  for (const t of terms) {
    const re = new RegExp(`(?<![A-Za-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`, 'i');
    if (re.test(text)) hits.push(t);
  }
  return hits;
}

export function words(text) {
  return tokenize(text).filter(t => t.kind === 'w');
}
