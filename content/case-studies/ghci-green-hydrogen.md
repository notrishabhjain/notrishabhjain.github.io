---
title: Green Hydrogen Certification Portal
short: GHCI Digital Portal
client: Ministry of New & Renewable Energy (MNRE)
via: BDO India · National e-Governance Division, MeitY
role: Delivery & UX Lead
period: 2026
stack: [MERN, React, TypeScript, Headless WordPress, NIC MeghRaj]
compliance: [WCAG 2.1 AA, GIGW, UX4G]
outcome: Taken to UAT with a full test framework; Phase 2 roadmap approved at CEO level
featured: true
---

## Context

India's green hydrogen certification scheme needs a system of record: producers apply,
evidence is assessed, and certificates are issued that downstream buyers and regulators
have to be able to trust years later. That last part is the hard part.

## The problem

A certificate is not a document, it's a claim about the past. When a producer's data is
later corrected, or a certificate is superseded, the old certificate can't simply
disappear — anyone who relied on it needs to be able to see what it said and why it
changed. Nobody had specified how that worked.

## What I owned

I led this from requirement elicitation through to UAT, which on a government platform
means owning several things that usually sit with different people:

- **The design.** Figma specifications built to WCAG 2.1 AA, GIGW, and UX4G from the
  first screen rather than corrected after audit, then React and TypeScript component
  builds for the authentication and registration flows.
- **The versioning specification.** I wrote the developer spec for how issued
  certificates are amended, superseded, and audited without breaking the traceability
  chain — the design decision the rest of the platform's credibility rests on.
- **The test framework.** 12 use case documents and a 39-case test workbook across 8
  functional modules, with test plans and defect governance, so UAT was a process rather
  than a negotiation. `[DISCLOSE?]` — case counts are specific. Safe in my view, but
  your call.
- **The roadmap.** I presented Phase 2 to CEO-level stakeholders: blockchain-based
  certificate anchoring, AI-assisted review, analytics, and a partner API ecosystem.

## Outcome

The portal reached UAT with a complete, documented test framework, and the Phase 2
roadmap was approved at CEO level.

`[VERIFY]` — has GHCI gone live since? A live production date is a materially stronger
close than "reached UAT," and it's the first thing an interviewer will ask.

## What I'd point to

The versioning spec. Anyone can run a UAT cycle. Recognising that a certification
platform has an unsolved data-integrity problem at its centre — before it becomes an
incident — is the part of this job I'm actually paid for.
