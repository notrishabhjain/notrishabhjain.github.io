// node tailor/tests/edge.mjs — odd inputs must not crash and must not write gaps.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine } from '../js/engine.js';
import { buildDocx } from '../js/docx.js';
import { atsCheck } from '../js/ats.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const engine = createEngine({ skillsTxt: read('data/skills.txt'), profile: JSON.parse(read('data/profile.json')), rules: JSON.parse(read('data/rules.json')) });
const cases = {
  'one paragraph': 'We need a delivery lead who can run Agile teams, manage vendors and budgets, and talk to executives. Experience with AWS and Jira is a plus. 7+ years of experience required.',
  'tiny': 'Project manager',
  'markdown': '## **Senior Program Manager**\n\n**What you will do**\n* Own the roadmap\n* Run SAFe PI planning across 6 trains\n\n**Requirements**\n* 10+ yrs program management\n* PMP certification\n* Go, Rust or Python is nice to have',
  'all caps': 'PROGRAM MANAGER\nRESPONSIBILITIES\n- MANAGE STAKEHOLDERS AND VENDORS\n- OWN P&L AND BUDGET\nREQUIREMENTS\n- 8 YEARS EXPERIENCE IN IT SERVICES',
  'noise': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. 😀 ✓ ★ — “quotes” and ‘apostrophes’ \t tabs   nbsp.',
  'tricky words': 'Go-to-market experience. Excel at stakeholder management. Spark joy. We are hiring! Visa sponsorship is not available. Reports to the CTO. Lean team, flexible hours.'
};
let bad = 0;
for (const [name, text] of Object.entries(cases)) {
  try {
    const { jd, match } = engine.analyze(text, { today: new Date('2026-11-17') });
    const r = engine.compose(jd, match, { today: new Date('2026-11-17') });
    const bytes = buildDocx(r);
    atsCheck(r, bytes, { idx: engine.idx, match, resumeText: engine.resumeText });
    const bullets = r.roles.reduce((a, x) => a + x.bullets.length, 0);
    console.log(`${name.padEnd(14)} skills: ${jd.skills.slice(0, 8).map(s => s.name).join(', ') || '(none)'} | title: ${jd.title?.text || '-'} | years ${jd.years} | bullets ${bullets}`);
  } catch (e) { bad++; console.log(`${name}: CRASH ${e.stack}`); }
}
process.exit(bad ? 1 : 0);
