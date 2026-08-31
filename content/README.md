# Content

Case studies live here as Markdown — `content/case-studies/*.md`. Astro loads them
directly from this folder, so what you edit here is what ships. Frontmatter drives the
card on the homepage and the factsheet on the case study page.

**Everything else on the site** — hero, the three pillars, the timeline, capabilities,
convictions, reach, credentials, contact — lives in `src/data/site.ts`, and the resume in
`src/data/resume.ts`. It moved out of Markdown once the site was built: keeping two
copies of the same prose guarantees they drift apart, and the data files are what the
pages actually render.

Open questions are tracked in `REVIEW.md`.

## Editing

- **Change a case study:** edit the Markdown here.
- **Change any other copy:** edit `src/data/site.ts`.
- **Change the resume:** edit `src/data/resume.ts`, then regenerate the PDF
  (`npm run build && npm run resume:pdf && npm run build`).

No review markers are left in these files. Anything unresolved is in `REVIEW.md` instead,
so nothing half-decided can reach the published page by accident.
