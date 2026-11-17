// Rule-based English morphology for resume bullets: conjugation, lists, articles.

const IRREGULAR = {
  be: ['was', 'being'], begin: ['began', 'beginning'], bring: ['brought', 'bringing'], build: ['built', 'building'],
  buy: ['bought', 'buying'], choose: ['chose', 'choosing'], cut: ['cut', 'cutting'], deal: ['dealt', 'dealing'],
  do: ['did', 'doing'], draw: ['drew', 'drawing'], drive: ['drove', 'driving'], feed: ['fed', 'feeding'],
  find: ['found', 'finding'], forecast: ['forecast', 'forecasting'], get: ['got', 'getting'], give: ['gave', 'giving'],
  go: ['went', 'going'], grow: ['grew', 'growing'], hold: ['held', 'holding'], keep: ['kept', 'keeping'],
  lead: ['led', 'leading'], leave: ['left', 'leaving'], let: ['let', 'letting'], lose: ['lost', 'losing'],
  make: ['made', 'making'], mean: ['meant', 'meaning'], meet: ['met', 'meeting'], oversee: ['oversaw', 'overseeing'],
  overcome: ['overcame', 'overcoming'], pay: ['paid', 'paying'], put: ['put', 'putting'], read: ['read', 'reading'],
  rebuild: ['rebuilt', 'rebuilding'], rerun: ['reran', 'rerunning'], rewrite: ['rewrote', 'rewriting'],
  run: ['ran', 'running'], see: ['saw', 'seeing'], seek: ['sought', 'seeking'], sell: ['sold', 'selling'],
  send: ['sent', 'sending'], set: ['set', 'setting'], show: ['showed', 'showing'], speak: ['spoke', 'speaking'],
  spend: ['spent', 'spending'], spin: ['spun', 'spinning'], split: ['split', 'splitting'], stand: ['stood', 'standing'],
  take: ['took', 'taking'], teach: ['taught', 'teaching'], tell: ['told', 'telling'], think: ['thought', 'thinking'],
  undertake: ['undertook', 'undertaking'], understand: ['understood', 'understanding'], win: ['won', 'winning'],
  write: ['wrote', 'writing'], withdraw: ['withdrew', 'withdrawing'], rise: ['rose', 'rising'], shut: ['shut', 'shutting'],
  hit: ['hit', 'hitting'], sit: ['sat', 'sitting'], light: ['lit', 'lighting'], lend: ['lent', 'lending'],
  sweep: ['swept', 'sweeping'], wind: ['wound', 'winding'], broadcast: ['broadcast', 'broadcasting'],
  outrun: ['outran', 'outrunning'], upset: ['upset', 'upsetting'], offset: ['offset', 'offsetting'],
  reset: ['reset', 'resetting'], input: ['input', 'inputting'], output: ['output', 'outputting']
};

const DOUBLE_MULTI = new Set(['commit', 'submit', 'admit', 'control', 'patrol', 'refer', 'transfer', 'prefer', 'occur',
  'compel', 'propel', 'equip', 'omit', 'permit', 'regret', 'rebut', 'acquit', 'outfit', 'unpin', 'kidnap', 'handicap',
  'remit', 'emit', 'confer', 'defer', 'deter', 'incur', 'recur', 'expel', 'repel', 'excel', 'dispel', 'befit']);

function syllables(w) {
  const m = w.toLowerCase().replace(/e$/, '').match(/[aeiouy]+/g);
  return m ? m.length : 1;
}

function doubles(w, uk) {
  if (DOUBLE_MULTI.has(w)) return true;
  if (uk && /[^aeiou][aeiou]l$/.test(w) && syllables(w) >= 2) return true; // travel -> travelled
  return syllables(w) === 1 && /[^aeiou][aeiou][^aeiouwxy]$/.test(w) && !/^(qu)/.test(w.slice(-3));
}

function pastOne(w, uk) {
  const lw = w.toLowerCase();
  const base = lw.split('-').pop();
  const prefix = lw.slice(0, lw.length - base.length);
  if (IRREGULAR[base]) return keepCase(w, prefix + IRREGULAR[base][0]);
  let out;
  if (/e$/.test(base)) out = base + 'd';
  else if (/[^aeiou]y$/.test(base)) out = base.slice(0, -1) + 'ied';
  else if (/c$/.test(base)) out = base + 'ked';
  else if (doubles(base, uk)) out = base + base.slice(-1) + 'ed';
  else out = base + 'ed';
  return keepCase(w, prefix + out);
}

function ingOne(w, uk) {
  const lw = w.toLowerCase();
  const base = lw.split('-').pop();
  const prefix = lw.slice(0, lw.length - base.length);
  if (IRREGULAR[base]) return keepCase(w, prefix + IRREGULAR[base][1]);
  let out;
  if (/ie$/.test(base)) out = base.slice(0, -2) + 'ying';
  else if (/(ee|ye|oe)$/.test(base)) out = base + 'ing';
  else if (/e$/.test(base) && base.length > 2) out = base.slice(0, -1) + 'ing';
  else if (/c$/.test(base)) out = base + 'king';
  else if (doubles(base, uk)) out = base + base.slice(-1) + 'ing';
  else out = base + 'ing';
  return keepCase(w, prefix + out);
}

function keepCase(src, out) {
  return /^[A-Z]/.test(src) ? out[0].toUpperCase() + out.slice(1) : out;
}

const PARTICLES = new Set(['up', 'out', 'down', 'off', 'over', 'in', 'back', 'through', 'on', 'away', 'around']);

/**
 * Conjugate a verb phrase lemma.
 *   "ship"               -> shipped / shipping / ship
 *   "set up"             -> set up / setting up         (phrasal: conjugate the first word)
 *   "personally+diagnose"-> personally diagnosed        (adverb before '+')
 *   "design and build"   -> designed and built          (compound)
 *   "right-size"         -> right-sized
 * form: 'past' | 'ing' | 'base'
 */
export function conjugate(lemma, form, opts = {}) {
  const uk = opts.spelling === 'uk';
  let adverb = '';
  let v = lemma.trim();
  if (v.includes('+')) { const k = v.lastIndexOf('+'); adverb = v.slice(0, k).replace(/\+/g, ' ') + ' '; v = v.slice(k + 1); }
  if (form === 'base') return adverb + v;
  if (/\s(and|or)\s/.test(v) || v.includes(',')) {
    const parts = v.split(/,\s*|\s+(?:and|or)\s+/);
    const joiner = / or /.test(v) ? 'or' : 'and';
    const done = parts.map(p => conjugate(p, form, opts));
    return adverb + (done.length > 2 ? done.slice(0, -1).join(', ') + ' ' + joiner + ' ' + done[done.length - 1] : done.join(' ' + joiner + ' '));
  }
  const words = v.split(/\s+/);
  const head = words[0];
  const rest = words.slice(1);
  if (rest.length && !rest.every(r => PARTICLES.has(r))) {
    // multi-word verb that is not phrasal: conjugate the last word ("project manage")
    const last = rest.pop();
    const c = form === 'past' ? pastOne(last, uk) : ingOne(last, uk);
    return adverb + [head, ...rest, c].join(' ');
  }
  const c = form === 'past' ? pastOne(head, uk) : ingOne(head, uk);
  return adverb + [c, ...rest].join(' ');
}

/** "a, b and c"; switches to semicolons when an item already contains a comma. */
export function joinList(items, conj = 'and') {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] || '';
  const semi = xs.some(x => x.includes(','));
  if (semi) return xs.slice(0, -1).join('; ') + '; ' + xs[xs.length - 1];
  return xs.slice(0, -1).join(', ') + ' ' + conj + ' ' + xs[xs.length - 1];
}

/** Choose "a" or "an" for the word that follows. */
export function aOrAn(next) {
  const w = (next || '').replace(/^[^A-Za-z0-9]+/, '');
  if (!w) return 'a';
  if (/^[A-Z]{2,}/.test(w)) return /^[AEFHILMNORSX]/.test(w) ? 'an' : 'a';
  if (/^(hour|honest|honou?r|heir)/i.test(w)) return 'an';
  if (/^(uni|use|usa|usu|ute|uti|ure|uro|eu|one|once|ubi)/i.test(w)) return 'a';
  if (/^[0-9]/.test(w)) return /^(8|11|18|80|800)\b/.test(w) || /^8/.test(w) ? 'an' : 'a';
  return /^[aeiou]/i.test(w) ? 'an' : 'a';
}

export function capFirst(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function lowerFirst(s) {
  if (!s) return s;
  if (/^[A-Z]{2}/.test(s)) return s; // keep acronyms
  return s[0].toLowerCase() + s.slice(1);
}

/** Tidy spacing and punctuation of an assembled sentence. */
export function tidy(s) {
  return s.replace(/\s+/g, ' ')
    .replace(/\s+([,;:.)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/,\s*,/g, ',')
    .replace(/[,;:]\s*\./g, '.')
    .replace(/\.\.+$/, '.')
    .trim();
}
