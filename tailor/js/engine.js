// One entry point for the browser app and the Node tests.

import { parseTaxonomy, buildIndex, addUserSkills, addExtended } from './taxonomy.js';
import { analyzeJD } from './jd.js';
import { buildProfileIndex, matchJD } from './match.js';
import { buildResume, resumeText } from './compose.js';

export function createEngine({ skillsTxt, profile, rules, userSkills = [], extended = null }) {
  const tax = parseTaxonomy(skillsTxt);
  addUserSkills(tax, userSkills);
  const idx = buildIndex(tax);
  let extCount = 0;
  if (extended) extCount = addExtended(idx, extended);
  const pidx = buildProfileIndex(profile, tax, idx);
  return {
    tax, idx, pidx, profile, rules, extCount,
    warnings: [...tax.warnings, ...pidx.warnings],
    analyze(text, opts = {}) {
      const jd = analyzeJD(text, { idx, tax, rules, corpus: opts.corpus, ignored: opts.ignored, ext: opts.ext });
      const match = matchJD(jd, pidx, tax, rules, profile, opts.today);
      return { jd, match };
    },
    compose(jd, match, opts = {}) {
      return buildResume({ jd, match, pidx, profile, tax, idx, rules, overrides: opts.overrides, today: opts.today });
    },
    resumeText
  };
}
