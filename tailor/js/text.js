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

// ---- confidential terms, stored only as SHA-256 fingerprints ---------------------------
// The repository is public, so the list of names to keep out of resumes cannot be stored as
// text: it would publish the very names it protects. Each term is normalised and hashed, and
// text is checked by hashing its word sequences (1 to 7 words) and comparing.

/** Lowercase, rupee sign as "rs", everything that is not a letter or digit becomes a space. */
export function normTerm(s) {
  return String(s).toLowerCase().replace(/₹/g, ' rs ').replace(/[^a-z0-9]+/g, ' ').trim();
}

const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,
  0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,
  0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,
  0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,
  0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,
  0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);

/** SHA-256 of a string, as lowercase hex. Small and synchronous; inputs here are short. */
export function sha256(str) {
  const bytes = new TextEncoder().encode(str);
  const len = bytes.length;
  const blocks = Math.ceil((len + 9) / 64);
  const buf = new Uint8Array(blocks * 64);
  buf.set(bytes);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 4, (len * 8) >>> 0);
  dv.setUint32(buf.length - 8, Math.floor((len * 8) / 0x100000000));
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let b = 0; b < blocks; b++) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(b * 64 + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return [...H].map(x => x.toString(16).padStart(8, '0')).join('');
}

export function termHash(term) { return sha256(normTerm(term)); }

const HASH_CACHE = new Map();
/**
 * Which confidential fingerprints occur in `text`. Returns the matching word sequences, so a
 * caller can say what to change without the repository ever holding the list.
 */
export function findTerms(text, hashes) {
  const set = hashes instanceof Set ? hashes : new Set(hashes || []);
  if (!set.size || !text) return [];
  const w = normTerm(text).split(' ').filter(Boolean);
  const hits = [];
  for (let i = 0; i < w.length; i++) {
    for (let n = 1; n <= 7 && i + n <= w.length; n++) {
      const g = w.slice(i, i + n).join(' ');
      let h = HASH_CACHE.get(g);
      if (!h) { h = sha256(g); if (HASH_CACHE.size < 200000) HASH_CACHE.set(g, h); }
      if (set.has(h)) hits.push(g);
    }
  }
  return [...new Set(hits)];
}

export function words(text) {
  return tokenize(text).filter(t => t.kind === 'w');
}
