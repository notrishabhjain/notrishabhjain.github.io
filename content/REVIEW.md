# Open items

The site is built and everything you signed off is live in it. Four things are still
genuinely open.

---

## 1. The Scrum Master certification — needs a decision

You told me the certification is not currently active. Listing it under a plain
"Certifications" heading implies it is, so **it is currently withheld from the published
site and from the generated resume.**

This is a one-line change either way. In `src/data/site.ts`:

```ts
export const showLapsedScrumMaster = false;   // ← flip to true to publish it
```

Your options, in the order I'd rank them:

1. **Renew it.** You're targeting roles where it's a real screening filter, and you have
   long since done the work that earns the renewal credits. Then it's simply true, and
   this stops being a question.
2. **List it with the year earned** — "Certified Scrum Master, Scrum Alliance (2021)".
   Standard practice; a date signals history rather than currency. Tell me the year and
   I'll set it.
3. **Leave it off**, and let eleven years of Agile delivery speak. Cleanest, but you lose
   a keyword that applicant tracking systems screen on.

I picked the conservative default because publishing is the direction that's hard to take
back. Say the word and it goes in.

## 2. The GE Vernova team narrative

Your master resume said the turnaround "materially reduced burnout and attrition." Your
note said you trimmed the team. The published case study treats these as compatible —
over-staffing with unclear ownership causes burnout; right-sizing plus a clear RACI cures
it — because that's the most likely truth and it reads well.

It's also the claim an interviewer will push hardest on. Confirm the sequence, or tell me
to cut the burnout framing. The case study is strong without it.

## 3. Small verifications

| # | Question | Where |
|---|---|---|
| V1 | Year the CSM was earned | `src/data/site.ts` |
| V2 | 8th CPC: is "a month" from proposal acceptance to go-live, or from development start? | `content/case-studies/8th-cpc-mrms.md` |
| V3 | CRCS: were you on the programme during the Sahara refund extension, or is that your platform being reused later? Both are worth saying — they are different claims | `content/case-studies/crcs-portal.md` |

## 4. Resume length

The generated PDF runs to four pages. That's defensible for eleven years and a
master-style document, but two to three pages converts better for most applications. If
you want it shorter, tell me which roles to compress — my instinct is to cut BDO from ten
bullets to six and EY from seven to five, keeping every number.

---

## Deferred by you, easy to pick up later

- **Custom domain** (skipped). The origin is set in one place — the `SITE` constant in
  `astro.config.mjs`. Adding a domain is that line plus a `public/CNAME` file.
- **Photograph** (skipped). The page carries itself typographically. Easy to add.
- **GitHub link** (you asked for LinkedIn only). Noted once and then dropped: it's the
  cheapest corroboration of the technical claim the site makes. Your call.
