# notrishabhjain.github.io

Personal site for Rishabh Jain — Program & Portfolio Manager. Astro, no client-side
framework, deployed to GitHub Pages via Actions.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # static build into dist/
npm run preview  # serve the built output
```

## Where the content lives

| What | Where |
|---|---|
| Case studies | `content/case-studies/*.md` |
| Everything else on the page | `src/data/site.ts` |
| Resume | `src/data/resume.ts` |
| Open questions | `content/REVIEW.md` |

## Regenerating the resume PDF

`/resume` is the source of truth; the PDF is printed from that page so the download can
never drift from what the site says.

```bash
npm run build && npm run resume:pdf && npm run build
```

The second build copies the refreshed PDF from `public/files/` into `dist/`. Set
`CHROMIUM_PATH` if Playwright's bundled Chromium isn't available in your environment.

The `.docx` in `public/files/` is generated separately and is the version to upload to
applicant tracking systems, which parse Word more reliably than PDF.

## Deployment — one setting you must change

The workflow in `.github/workflows/deploy.yml` builds on every push to `master` and
publishes `dist/`. It only takes effect once Pages is switched over:

Pages is set to **GitHub Actions** as its source, so every push to `master` rebuilds and
publishes the site. Nothing is served from the repository root any more.

If Pages is ever switched back to "Deploy from a branch", the site will 404 — the old
static files that used to serve from the root have been removed.
