/**
 * Prints the built /resume page to public/files/Rishabh_Jain_Resume.pdf.
 *
 * The PDF is generated from the same data as the site, so the download can never
 * drift from what the page says. Run after `npm run build`, then rebuild so the
 * refreshed PDF is copied into dist/.
 *
 *   npm run build && npm run resume:pdf && npm run build
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'public', 'files', 'Rishabh_Jain_Resume.pdf');
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml',
};

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    if (!extname(path)) path += '/index.html';
    const body = await readFile(join(DIST, path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;

// CHROMIUM_PATH lets a sandbox or CI image point at a Chromium it already has,
// instead of the exact build Playwright would download. Unset locally is fine.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [],
});
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/resume/`, { waitUntil: 'networkidle' });
// The print stylesheet drops the chrome and forces a light, ink-on-white palette.
await page.emulateMedia({ media: 'print', colorScheme: 'light' });
await mkdir(join(ROOT, 'public', 'files'), { recursive: true });
await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: false,
  margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
});
await browser.close();
server.close();
console.log('wrote', OUT);
