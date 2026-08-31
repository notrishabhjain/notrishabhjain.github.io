---
title: Memorandum Review Management System
short: 8th Central Pay Commission MRMS
client: 8th Central Pay Commission
via: BDO India · National e-Governance Division, MeitY
role: Manager
period: 2026
stack: [MERN, Parichay SSO, NIC MeghRaj 2.0, third-party integrations]
outcome: Proposal to production in a month — live, on MeghRaj, with expedited approvals
featured: true
---

## Context

Every central pay commission receives memoranda from employee associations, unions, and
individual government servants arguing for revisions. Each one has to be logged,
examined, referred to the right ministry, answered, and accounted for. The volume is
large, the scrutiny is high, and the process was running on spreadsheets.

## The problem

A spreadsheet has no concept of a review stage. It can't tell you which memoranda sit
with a Processing Officer, which await a ministry response, or how long either has
taken — and with representations arriving from across the central government, "we think
it's roughly on track" is not an acceptable answer.

Then there was the timeline. A pay commission does not wait for a portal.

## What I owned

- **The proposal.** I authored the two-phase technical and commercial proposal — MERN
  architecture, Parichay SSO integration, NIC MeghRaj 2.0 hosting, and a Phase 2 AI
  services roadmap — with infrastructure costed against live NICSI rate cards so it
  could clear procurement without a second pass. It was accepted.
- **The workflow.** A multi-stage examination and referral process spanning Processing
  Officer, Reviewing Officer, and ministry response loops, designed so that at any moment
  you can answer where a memorandum is and who is holding it. Built from a legacy
  spreadsheet dataset into a structured data model with dashboard KPIs and a configurable
  report builder.
- **The delivery.** Coordinating development, multiple vendors, and DevOps to provision
  infrastructure, integrate third-party services, test, and deploy — while running the
  MeghRaj hosting approvals on an expedited track in parallel rather than in sequence.

## Outcome

**Built and live in a month**, deployed on NIC MeghRaj with third-party integrations in
place and hosting approvals expedited to match the build.

`[VERIFY]` — is the month measured from proposal acceptance to go-live, or from
development start? I've written it as approval to production. Say which and I'll fix it;
it's the number an interviewer will drill into, so it needs to be exactly right.

## What I'd point to

Government infrastructure approvals are usually the long pole — the reason a six-week
build takes six months. Running the MeghRaj provisioning track in parallel with
development, rather than waiting for it, is the whole reason this shipped in a month.
That's not a technical achievement. It's knowing which queue to join early.
