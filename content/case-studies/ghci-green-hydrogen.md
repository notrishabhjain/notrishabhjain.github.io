---
title: Green Hydrogen Certification Portal
short: GHCI Digital Portal
client: Ministry of New & Renewable Energy
via: BDO India · National e-Governance Division, MeitY
role: Delivery & UX Lead
period: "2026"
status: Live since July 2026
outcome: Inaugurated by the Minister at a public function, with national media coverage
order: 1
stack: [MERN, React, TypeScript, Headless WordPress, NIC MeghRaj]
compliance: [WCAG 2.1 AA, GIGW, UX4G]
---

## Context

India's green hydrogen certification scheme needs a system of record: producers apply,
evidence is assessed, and certificates are issued that downstream buyers and regulators
have to be able to trust years later. That last part is the hard part.

## The problem

A certificate is not a document. It's a claim about the past. When a producer's data is
later corrected, or a certificate is superseded, the old one can't simply disappear —
anyone who relied on it needs to be able to see what it said and why it changed. Nobody
had specified how that worked.

## What I owned

I led this from requirement elicitation through to launch, which on a government platform
means owning several things that usually sit with different people.

**The design.** Figma specifications built to WCAG 2.1 AA, GIGW and UX4G from the first
screen rather than corrected after audit, then React and TypeScript component builds for
the authentication and registration flows.

**The versioning specification.** I wrote the developer spec for how issued certificates
are amended, superseded and audited without breaking the traceability chain — the design
decision the rest of the platform's credibility rests on.

**The test framework.** Twelve use case documents and a 39-case test workbook across
eight functional modules, with test plans and defect governance, so UAT was a process
rather than a negotiation.

**The roadmap.** I presented Phase 2 to CEO-level stakeholders: blockchain-based
certificate anchoring, AI-assisted review, analytics and a partner API ecosystem.

## Outcome

Live since July 2026, inaugurated by the Minister at a public function and covered in
national media. Stakeholders are registering and processing certifications on it today,
and the AI-enabled features from the Phase 2 roadmap are in development.

## What I'd point to

The versioning spec. Anyone can run a UAT cycle. Recognising that a certification
platform has an unsolved data-integrity problem at its centre — before it becomes an
incident — is the part of this job I'm actually paid for.

A launch is a good day. A certificate that still resolves correctly in 2031 is the thing
I was building for.
