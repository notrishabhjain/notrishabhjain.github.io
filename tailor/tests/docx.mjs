// node tailor/tests/docx.mjs <outdir>
// Writes one .docx per sample JD and prints the ATS self-check for each.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine } from '../js/engine.js';
import { buildDocx } from '../js/docx.js';
import { atsCheck } from '../js/ats.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const out = process.argv[2] || join(here, 'out');
mkdirSync(out, { recursive: true });

const engine = createEngine({
  skillsTxt: read('data/skills.txt'),
  profile: JSON.parse(read('data/profile.json')),
  rules: JSON.parse(read('data/rules.json'))
});
const today = new Date('2026-11-17T10:00:00Z');
let bad = 0;
for (const f of readdirSync(join(here, 'jds')).filter(f => f.endsWith('.txt'))) {
  const { jd, match } = engine.analyze(read('tests/jds/' + f), { today });
  const resume = engine.compose(jd, match, { today });
  const bytes = buildDocx(resume, today);
  const name = f.replace('.txt', '.docx');
  writeFileSync(join(out, name), bytes);
  const res = atsCheck(resume, bytes, { idx: engine.idx, match, resumeText: engine.resumeText });
  console.log(`\n${name}  ${bytes.length} bytes`);
  for (const c of res.checks) {
    console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.label} — ${c.detail}`);
    if (!c.ok && !/Must-have|Length/.test(c.label)) bad++;
  }
}
process.exit(bad ? 1 : 0);
