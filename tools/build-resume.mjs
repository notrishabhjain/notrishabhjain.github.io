// node tools/build-resume.mjs
// One source, three outputs. resume.json (JSON Resume format) is the single source of truth for:
//   /resume.json                    machine-readable, for agents and applicant-tracking systems
//   /resume/index.html              the same content as a plain, crawlable web page
//   /files/Rishabh_Jain_Resume.pdf  the download, written with Tailor's dependency-free PDF writer
// Edit resume.json, run this, then run tools/scan-confidential.mjs before committing.
// No phone number is ever written: the repository is public.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPdf } from '../tailor/js/pdf.js';
import { resumeText } from '../tailor/js/compose.js';
import { findTerms } from '../tailor/js/text.js';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const SITE = 'https://notrishabhjain.github.io';
const cv = JSON.parse(readFileSync(join(root, 'resume.json'), 'utf8'));
const hashes = JSON.parse(readFileSync(join(root, 'tailor/data/rules.json'), 'utf8')).confidentialHashes;
const b = cv.basics;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ym = (s) => { if (!s) return 'Present'; const [y, m] = s.split('-'); return m ? `${MONTHS[+m - 1]} ${y}` : y; };
const span = (w) => `${ym(w.startDate)} - ${ym(w.endDate)}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const linkedin = (b.profiles || []).find(p => p.network === 'LinkedIn');

// ---- the shape Tailor's PDF writer expects ----
const r = {
  person: { name: b.name, location: `${b.location.city}, India`, email: b.email, phone: '', linkedin: linkedin ? linkedin.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '') : '', website: b.url.replace(/^https:\/\//, '').replace(/\/$/, '') },
  headline: b.headline || b.label,
  summary: b.summary,
  skills: cv.skills.map(s => ({ label: s.name, items: s.keywords.map(label => ({ label })) })),
  roles: cv.work.map(w => ({ title: w.position, company: w.name, location: w.location, dates: span(w), client: w.client || '', bullets: w.highlights.map(text => ({ text })) })),
  education: cv.education.map(e => ({ degree: e.area && !e.studyType.includes(e.area) ? `${e.studyType}, ${e.area}` : e.studyType, school: e.institution, year: e.endDate })),
  certifications: cv.certificates.map(c => ({ name: c.name, issuer: c.issuer || '' })),
};

const hits = findTerms(resumeText(r) + '\n' + JSON.stringify(cv), hashes);
if (hits.length) { console.error('confidential terms in resume.json:', hits.join(', ')); process.exit(1); }
if (/\+91|\b[6-9]\d{9}\b/.test(JSON.stringify(cv))) { console.error('resume.json looks like it holds a phone number; remove it'); process.exit(1); }

const when = new Date((cv.meta && cv.meta.lastModified ? cv.meta.lastModified : new Date().toISOString().slice(0, 10)) + 'T00:00:00Z');
writeFileSync(join(root, 'files/Rishabh_Jain_Resume.pdf'), buildPdf(r, when));

// ---- the web page, wrapped in the site's own head, nav and footer ----
const tpl = readFileSync(join(root, 'about/index.html'), 'utf8');
const headStart = tpl.slice(0, tpl.indexOf('<title>'));
const afterMeta = tpl.slice(tpl.indexOf('<link rel="preload"'), tpl.indexOf('<main id="main">') + '<main id="main">'.length)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
  .replace(/ aria-current="page"/g, '');
const tail = tpl.slice(tpl.indexOf('</main><footer'));

const url = `${SITE}/resume/`;
const title = `Résumé · ${b.name}, ${b.label}`;
const desc = `${b.name}, ${b.label} in ${b.location.city}: experience, skills, education and certifications. Also available as PDF and JSON Resume.`;
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfilePage', '@id': url, url, name: title, description: desc, isPartOf: { '@id': `${SITE}/#website` }, mainEntity: { '@id': `${SITE}/#person` }, dateModified: cv.meta.lastModified,
      breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Résumé', item: url }] } },
    { '@type': 'Person', '@id': `${SITE}/#person`, name: b.name, jobTitle: b.label, url: b.url, email: `mailto:${b.email}`,
      sameAs: (b.profiles || []).map(p => p.url),
      worksFor: { '@type': 'Organization', name: cv.work[0].name },
      address: { '@type': 'PostalAddress', addressLocality: b.location.city, addressRegion: b.location.region, addressCountry: b.location.countryCode },
      alumniOf: cv.education.map(e => ({ '@type': 'EducationalOrganization', name: e.institution })),
      hasCredential: cv.certificates.map(c => ({ '@type': 'EducationalOccupationalCredential', name: c.name, credentialCategory: 'certification', ...(c.issuer ? { recognizedBy: { '@type': 'Organization', name: c.issuer } } : {}) })),
      knowsAbout: cv.skills.flatMap(s => s.keywords).slice(0, 40) },
  ],
};

const roles = cv.work.map(w => `<article class="cv-role">
<h3>${esc(w.position)}</h3>
<p class="cv-meta"><b>${esc(w.name)}</b> · ${esc(w.location)} · <time datetime="${esc(w.startDate)}">${esc(ym(w.startDate))}</time> – ${w.endDate ? `<time datetime="${esc(w.endDate)}">${esc(ym(w.endDate))}</time>` : 'Present'}${w.client ? ` · Client: ${esc(w.client)}` : ''}</p>
<ul>${w.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
</article>`).join('\n');

const body = `<header class="stage case-head"><div class="wrap">
<div class="eyebrow ent" style="--d:0ms">Résumé</div>
<h1 class="h1 ent" style="--d:80ms">${esc(b.name)}</h1>
<p class="lead ent" style="--d:160ms">${esc(b.label)} · ${esc(b.location.city)}. ${esc(b.tagline || '')}</p>
<div class="exp-actions ent" style="--d:240ms"><a class="btn btn-primary" href="/files/Rishabh_Jain_Resume.pdf" target="_blank" rel="noopener">Download PDF</a><a class="btn btn-ghost" href="/resume.json" type="application/json">JSON Resume</a><a class="btn btn-ghost" href="${esc(linkedin.url)}" target="_blank" rel="noopener">LinkedIn</a></div>
</div></header>
<section class="sec tight"><div class="wrap cv">
<section class="cv-sec" aria-labelledby="cv-summary"><h2 class="eyebrow" id="cv-summary">Summary</h2><p class="cv-lead">${esc(b.summary)}</p>
<p class="cv-contact"><a href="mailto:${esc(b.email)}">${esc(b.email)}</a> · <a href="${esc(linkedin.url)}" target="_blank" rel="noopener">LinkedIn</a> · ${esc(b.location.city)}, India · open to relocation and remote</p></section>
<section class="cv-sec" aria-labelledby="cv-skills"><h2 class="eyebrow" id="cv-skills">Skills</h2><dl class="cv-skills">${cv.skills.map(s => `<dt>${esc(s.name)}</dt><dd>${esc(s.keywords.join(', '))}</dd>`).join('')}</dl></section>
<section class="cv-sec" aria-labelledby="cv-exp"><h2 class="eyebrow" id="cv-exp">Experience</h2>
${roles}
</section>
<section class="cv-sec" aria-labelledby="cv-edu"><h2 class="eyebrow" id="cv-edu">Education</h2><ul class="cv-list">${cv.education.map(e => `<li><b>${esc(e.studyType)}${e.area && !e.studyType.includes(e.area) ? ', ' + esc(e.area) : ''}</b>, ${esc(e.institution)}, ${esc(e.endDate)}</li>`).join('')}</ul></section>
<section class="cv-sec" aria-labelledby="cv-cert"><h2 class="eyebrow" id="cv-cert">Certifications</h2><ul class="cv-list">${cv.certificates.map(c => `<li><b>${esc(c.name)}</b>${c.issuer ? ', ' + esc(c.issuer) : ''}</li>`).join('')}</ul></section>
<p class="cv-note">Client and programme names are generic on purpose. The case studies on <a href="/work/">Work</a> give the detail behind each line.</p>
</div></section>
`;

const head = [
  `<title>${esc(title)}</title>`,
  `<meta name="description" content="${esc(desc)}">`,
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  '<meta name="theme-color" content="#0E1112">',
  `<link rel="canonical" href="${url}">`,
  '<link rel="icon" href="/favicon.png">',
  '<link rel="alternate" type="application/json" href="/resume.json" title="JSON Resume">',
  `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="profile"><meta property="og:url" content="${url}">`,
  `<meta property="og:image" content="${SITE}/assets/share/site.png"><meta name="twitter:card" content="summary_large_image">`,
  `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
].join('\n');

mkdirSync(join(root, 'resume'), { recursive: true });
writeFileSync(join(root, 'resume/index.html'), headStart + head + '\n' + afterMeta + '\n' + body + tail);
console.log('wrote files/Rishabh_Jain_Resume.pdf and resume/index.html from resume.json');
