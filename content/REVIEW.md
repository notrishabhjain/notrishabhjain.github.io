# Open items

---

## Still needing your decision

**1. The Scrum Master certification.** Not currently active, so it is withheld from the
site and the resume rather than listed as though it were current. One line in
`src/data/site.ts`:

```ts
export const showLapsedScrumMaster = false;   // ← flip to publish
```

Renew it, give me the year earned so it can be listed as history, or leave it off.

**2. The GE Vernova team narrative.** The case study treats "reduced burnout" and
"trimmed the team" as compatible — over-staffing with unclear ownership causes burnout,
right-sizing plus a RACI cures it. Confirm that sequence or tell me to cut the burnout
framing.

**3. Three fact checks.**

| # | Question | Where |
|---|---|---|
| V1 | Year the CSM was earned | `src/data/site.ts` |
| V2 | "30 days" — from proposal acceptance or from development start? It is now a headline number in three places, so it needs to be exact | `content/case-studies/8th-cpc-mrms.md` |
| V3 | Were you on CRCS during the Sahara refund extension, or is that your platform being reused later? | `content/case-studies/crcs-portal.md` |

**4. The three diagrams.** Newly drawn from your descriptions, at a deliberately abstract
level — no real screens, data, or internal structure. Check each one says something true:

- `Fig. 01` sequencing of approvals against the build (8th CPC, also on the homepage)
- `Fig. 02` certificate versioning and supersession (GHCI)
- `Fig. 03` estate ownership before and after (GE Vernova)

---

## Applied in the rebuild

- **Product demoted.** Removed from the hero and contact entirely. It now appears once,
  as your actual role title on the Skillchain case study, plus one lowercase mention in
  the engagement about specification work.
- **"What I actually do" replaced.** The 44-keyword grid is gone. Four engagements —
  the briefs you actually get handed — each with proof and a link to the case that
  evidences it. Keywords survive only as a compact toolkit table on the About page and
  in the resume, where they serve ATS matching.
- **"Where I've done it" split into three.** Organisations (with what you did at each),
  sectors, and toolkit are now distinct treatments rather than four identical columns.
  Scale numbers moved to the work index, where they belong.
- **"How I work" grounded.** Each conviction now carries the moment it came from.
- **Work cards fixed.** Ragged two-column cards replaced by aligned rows, each leading
  with its headline metric and carrying its own call to action.
- **Value made visible.** Every case study now opens with a "what changed" results band
  and carries a "the calls I made" section — the decisions and their reasoning.
- **Multi-page.** `/`, `/work`, `/work/<slug>`, `/about`, `/resume`. Old
  `/case-studies/<slug>` URLs redirect to `/work/<slug>`.
- **Resume is now three pages**, down from four.

## Deferred by you

- Custom domain — one line in `astro.config.mjs` plus a `public/CNAME` file.
- Photograph.
- GitHub link.
