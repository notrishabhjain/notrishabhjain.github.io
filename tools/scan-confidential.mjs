// node tools/scan-confidential.mjs
// Scans every file the site publishes for confidential names and details, using the SHA-256
// fingerprints in tailor/data/rules.json (the names themselves are never stored in the repo).
// Text files are read as-is, so attributes, alt text and URLs are covered too; PDFs are read
// through pdftotext when it is installed. Exits non-zero on any hit.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findTerms } from '../tailor/js/text.js';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const hashes = new Set(JSON.parse(readFileSync(join(root, 'tailor/data/rules.json'), 'utf8')).confidentialHashes);
const TEXT = new Set(['.html', '.htm', '.xml', '.json', '.md', '.txt', '.js', '.mjs', '.css', '.yml', '.svg']);
const SKIP = new Set(['.git', 'node_modules']);
// The sample job descriptions are other employers' wording, not the owner's projects.
const SKIP_FILES = new Set(['tailor/data/rules.json']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p); else yield p;
  }
}

let pdfOk = true;
let hits = 0, files = 0;
for (const p of walk(root)) {
  const rel = relative(root, p);
  if (SKIP_FILES.has(rel) || rel.startsWith('tailor/tests/jds/')) continue;
  const ext = extname(p).toLowerCase();
  let text = null;
  if (TEXT.has(ext)) text = readFileSync(p, 'utf8');
  else if (ext === '.pdf') {
    try { text = execFileSync('pdftotext', ['-q', p, '-'], { encoding: 'utf8' }); } catch { pdfOk = false; }
  }
  // file and folder names are published as URLs
  const found = findTerms(rel.replace(/[\/_.-]/g, ' '), hashes);
  if (text != null) { files++; found.push(...findTerms(text, hashes)); }
  for (const t of new Set(found)) { hits++; console.log(`${rel}: "${t}"`); }
}
if (!pdfOk) console.log('note: pdftotext not found, PDFs were not checked');
console.log(hits ? `\n${hits} confidential match(es) in ${files} files checked` : `clean: ${files} files checked`);
process.exit(hits ? 1 : 0);
