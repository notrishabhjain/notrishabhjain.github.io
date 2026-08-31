---
title: Green Hydrogen Certification Portal
short: GHCI Digital Portal
client: Ministry of New & Renewable Energy
via: BDO India · National e-Governance Division, MeitY
role: Delivery & UX Lead
period: "2026"
status: Live since July 2026
live: true
outcome: Inaugurated by the Minister at a public function, with national media coverage
order: 1
metric:
  figure: Live
  label: Ministerial launch, July 2026
results:
  - v: "Live"
    l: In production since July 2026, inaugurated by the Minister
  - v: "8"
    l: Functional modules taken through a 39-case test framework
  - v: "AA"
    l: WCAG 2.1 AA, GIGW and UX4G conformance designed in, not retrofitted
  - v: "Phase 2"
    l: AI-assisted review and certificate anchoring approved at CEO level
decisions:
  - what: Specify certificate versioning before a line was written
    why: A certificate is a claim about the past. Without a supersession model, the first data correction would have silently rewritten a claim somebody had already relied on. I wrote the developer specification myself rather than hand it off.
  - what: Build to accessibility standards from the first Figma frame
    why: Conformance treated as a final audit costs a release when it fails. Designed in, it costs almost nothing — and the citizens using this have no alternative service to switch to.
  - what: Own the test framework rather than delegate UAT
    why: Twelve use case documents and a 39-case workbook across eight modules turned sign-off from a negotiation into a process with a defined exit.
  - what: Take Phase 2 to CEO-level stakeholders early
    why: Blockchain anchoring and AI-assisted review needed a sponsor before they needed a budget line. Scoping them while Phase 1 was still shipping is why they were approved rather than deferred.
diagram: certificate-versioning
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
