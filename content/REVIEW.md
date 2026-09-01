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

## Applied in this pass

- **Dark-first.** Dark is now the design rather than a preference — the light theme applies
  only when a visitor asks for it via the toggle. Previously anyone whose OS was set to
  light never saw the intended design at all.
- **Display type** on Space Grotesk, up to 8.5rem at the hero. Nothing on the old site was
  ever larger than 3.4rem.
- **Motion**, all of it progressive enhancement: hero lines rise on load, sections reveal on
  scroll, metrics count up, a marquee of ministries and clients, hover fills on buttons,
  underline sweeps in the nav. Everything is fully visible with JavaScript disabled and all
  of it is disabled under `prefers-reduced-motion`.
- **Per-project cover art** — generated abstract marks that echo each project's real shape,
  so the work index has visual identity without pretending to show screens you can't share.
- **Project rows** now lead with an index, a status pill, a large title and the headline
  metric in amber.

## Earlier, still applied

- Engagements replaced the 44-keyword grid; "Where I've done it" split into organisations,
  sectors and toolkit; convictions carry the moment each came from; every case study opens
  with a results band and carries the decisions behind it.
- Product appears once, as the role title on Skillchain.
- Multi-page: `/`, `/work`, `/work/<slug>`, `/about`, `/resume`, with old `/case-studies/`
  URLs redirecting.

## Deferred by you

- Custom domain — one line in `astro.config.mjs` plus a `public/CNAME` file.
- Photograph.
- GitHub link.

## Not done, and why

You asked me to take design cues from **vasudev.live** and audit **kinetics.colorion.co**.
Both are blocked by this session's network egress policy, so I never saw either one. The
direction here is my own, built to the brief you chose — dark, large, kinetic — not an
interpretation of those sites. If you can paste screenshots, I can calibrate against what
you actually pointed at.
