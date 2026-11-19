// node tailor/tests/run.mjs [--show] [jd-file ...]
// Runs the engine over the sample JDs, prints what it did, and asserts the integrity rules.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine } from '../js/engine.js';
import { tokenize } from '../js/text.js';
import { findSkills } from '../js/taxonomy.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const args = process.argv.slice(2);
const show = args.includes('--show');
const files = args.filter(a => !a.startsWith('--'));

const engine = createEngine({
  skillsTxt: read('data/skills.txt'),
  profile: JSON.parse(read('data/profile.json')),
  rules: JSON.parse(read('data/rules.json'))
});

let failures = 0;
const { findTerms } = await import('../js/text.js');
const CONFIDENTIAL = JSON.parse(read('data/rules.json')).confidentialHashes;
const fail = (msg) => { failures++; console.log('  FAIL ' + msg); };

console.log(`taxonomy: ${engine.tax.skills.size} skills, ${engine.idx.exact.size} exact forms, ${engine.idx.cased.size} cased, ${engine.idx.bag.size} bag keys`);
for (const w of engine.warnings) console.log('  warn ' + w);
if (engine.idx.collisions.length) {
  console.log(`  ${engine.idx.collisions.length} form collisions:`);
  for (const c of engine.idx.collisions) console.log('    ' + c);
}

// Claims the owner has retracted or corrected; none may ever reach a resume.
// profile.json is published with the site, so the profile itself must not carry confidential names either.
{
  const prof = JSON.parse(read('data/profile.json'));
  const fields = [...prof.roles.map(r => r.client || ''), ...prof.achievements.flatMap(a => [a.text, a.core, ...(a.parts || []), ...(a.facts || [])])];
  for (const f of fields) for (const t of findTerms(f, CONFIDENTIAL)) console.log(`  FAIL confidential term in profile: "${t}" in ${f.slice(0, 70)}`), failures++;
}
const RETRACTED = [/organi[sz]ation-wide adoption/i, /company-wide adoption/i, /15,000/, /82\/100/,
  /50 officers/i, /24-field/i, /\$500K/i, /SAST score/i, /Certified Scrum Master who/i, /eight-module/i, /seven-person/i];

// ---- unit checks on the rules themselves ----
{
  const { integrityGaps } = await import('../js/realize.js');
  const { conjugate, aOrAn } = await import('../js/grammar.js');
  const { light, termHash } = await import('../js/text.js');
  // planted, made-up terms: the real list exists only as fingerprints
  const fake = [termHash('Acme Widget Portal'), termHash('9 of 13'), termHash('Rs 4 crore')];
  const planted = findTerms('Led the ACME widget-portal launch, closed 9 of 13 findings on a ₹4 crore project.', fake);
  for (const t of ['acme widget portal', '9 of 13', 'rs 4 crore']) if (!planted.includes(t)) fail(`confidential guard missed "${t}"`);
  if (findTerms('An acmewidget portal and 19 of 130 items', fake).length) fail('confidential guard matched inside a word');
  const vocab = new Set(['cut', 'mttr', 'from', 'four', 'day', 'under', '12', 'hour', 'lead', 'repository', 'migration'].map(w => light(w)));
  const gaps = integrityGaps('Spearheaded cutting-edge MTTR synergies from four days', vocab);
  if (!gaps.includes('Spearheaded') || !gaps.includes('synergies')) fail(`integrity check missed invented words: ${gaps}`);
  if (integrityGaps('Cut MTTR from four days to under 12 hours', vocab).length) fail('integrity check flagged a clean sentence');
  const conj = [['ship', 'past', 'shipped'], ['lead', 'past', 'led'], ['set up', 'ing', 'setting up'], ['personally+diagnose', 'past', 'personally diagnosed'],
    ['design and build', 'past', 'designed and built'], ['project-manage', 'past', 'project-managed'], ['agree', 'ing', 'agreeing'],
    ['standardise', 'ing', 'standardising'], ['roll out', 'past', 'rolled out'], ['model', 'past', 'modelled', 'uk'], ['develop', 'past', 'developed']];
  for (const [v, f, want, sp] of conj) { const got = conjugate(v, f, { spelling: sp }); if (got !== want) fail(`conjugate(${v}, ${f}) = ${got}, want ${want}`); }
  for (const [w, want] of [['SLA', 'an'], ['UX', 'a'], ['82/100', 'an'], ['24-field', 'a'], ['hour', 'an'], ['user', 'a'], ['eight-module', 'an']]) {
    if (aOrAn(w) !== want) fail(`aOrAn(${w}) = ${aOrAn(w)}, want ${want}`);
  }
}
const today = new Date('2026-11-17');
const jdFiles = files.length ? files : readdirSync(join(here, 'jds')).filter(f => f.endsWith('.txt')).map(f => join(here, 'jds', f));

for (const f of jdFiles) {
  const text = readFileSync(f, 'utf8');
  const t0 = performance.now();
  const { jd, match } = engine.analyze(text, { today });
  const resume = engine.compose(jd, match, { today });
  const ms = Math.round(performance.now() - t0);
  console.log(`\n=== ${f.split('/').pop()}  (${ms} ms)`);
  console.log(`title: ${jd.title ? jd.title.text : '(none)'} | sector ${jd.sector} | years asked ${jd.years} | technical ${jd.technical.toFixed(2)} | verbs ${jd.verbs.slice(0, 6).join(', ')}`);
  console.log(`sections: ${jd.sections.map(s => s.type + ':' + s.heading.slice(0, 24)).join(' / ')}`);
  console.log(`coverage ${match.coverage}% | must-haves ${match.must.hit}/${match.must.total} | years ${match.years.profile} vs ${match.years.asked}`);
  const top = match.rows.slice(0, show ? 60 : 30);
  for (const r of top) console.log(`  ${String(r.score).padStart(3)} ${r.tier.padEnd(10)} ${r.status.padEnd(8)} ${r.name}${r.surface && r.surface.toLowerCase() !== r.name.toLowerCase() ? '  ["' + r.surface + '"]' : ''}${r.via ? '  via ' + r.via : ''}`);
  if (jd.unknown.length) console.log('  unknown: ' + jd.unknown.slice(0, 15).map(u => `${u.term}(${u.w.toFixed(1)})`).join(', '));

  console.log(`\nheadline: ${resume.headline}`);
  console.log(`summary: ${resume.summary}`);
  for (const g of resume.skills) console.log(`  ${g.label}: ${g.items.map(i => i.label).join(', ')}`);
  for (const role of resume.roles) {
    console.log(`  -- ${role.company} (${role.bullets.length})`);
    for (const b of role.bullets) console.log(`     [${b.pattern}] ${b.text}${b.verify ? '  (verify)' : ''}`);
  }
  for (const l of resume.lint) console.log(`  lint ${l.level}: ${l.msg}`);

  // ---- assertions ----
  const all = engine.resumeText(resume);
  for (const re of RETRACTED) if (re.test(all)) fail(`retracted claim present: ${re}`);
  const shown = [resume.headline, resume.summary, ...resume.roles.flatMap(r => [r.client || '', ...r.bullets.map(b => b.text)])].join('\n');
  for (const t of findTerms(shown, CONFIDENTIAL)) fail(`confidential term in resume: ${t}`);
  const gapIds = new Set(match.rows.filter(r => r.status === 'gap').map(r => r.id));
  const bodyText = [resume.summary, ...resume.skills.flatMap(g => g.items.map(i => i.label)), ...resume.roles.flatMap(r => r.bullets.map(b => b.text))].join('\n');
  for (const m of findSkills(tokenize(bodyText), engine.idx, bodyText, { ext: false })) {
    if (gapIds.has(m.id)) fail(`gap skill written into resume: ${m.id} ("${m.surface}")`);
  }
  for (const role of resume.roles) for (const b of role.bullets) {
    if (!/^[A-Z]/.test(b.text) || !/[.]$/.test(b.text)) fail(`bad sentence shape: ${b.text}`);
    if (/\s[,.;:]|\(\s|\s\)|  /.test(b.text)) fail(`spacing: ${b.text}`);
    if (/\b(a|an) (a|an|the)\b/i.test(b.text)) fail(`article: ${b.text}`);
  }
  // The summary stays broad: no figures beyond years of experience, no sentence lifted from a bullet.
  if (/\d/.test(resume.summary.replace(/\d+\+ years/, ''))) fail(`summary quotes a specific figure: ${resume.summary}`);
  for (const role of resume.roles) for (const b of role.bullets) if (resume.summary.includes(b.text.slice(0, 40))) fail('summary repeats a bullet');
  const count = resume.roles.reduce((a, r) => a + r.bullets.length, 0);
  if (count < 11 || count > 22) fail(`bullet count ${count}`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
