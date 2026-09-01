/**
 * All site copy that isn't a case study. Case studies are Markdown in
 * /content/case-studies.
 */

export const person = {
  name: 'Rishabh Jain',
  role: 'Program & Portfolio Manager',
  tag: 'Digital transformation · Government & enterprise delivery',
  location: 'New Delhi, India',
  email: 'rishabh.jain@outlook.in',
  linkedin: 'https://www.linkedin.com/in/notrishabhjain/',
  resumePdf: '/files/Rishabh_Jain_Resume.pdf',
  resumeDocx: '/files/Rishabh_Jain_Resume.docx',
} as const;

export const meta = {
  title: 'Rishabh Jain — Program & Portfolio Manager',
  description:
    'Program and portfolio manager, 11 years. I take Government of India platforms ' +
    'through procurement, approval and into production — and turn around enterprise ' +
    'delivery that has stopped working.',
} as const;

export const nav = [
  { label: 'Work', href: '/work/' },
  { label: 'About', href: '/about/' },
  { label: 'Resume', href: '/resume/' },
] as const;

/* ------------------------------------------------------------------ hero -- */

export const hero = {
  headline: 'I get government platforms built, approved, and live.',
  standfirst:
    'Eleven years in delivery — six of them writing code, five running programmes. ' +
    'I work where policy meets procurement meets engineering: the place where most ' +
    'public-sector platforms stall for a year. Two of mine went live this year.',
  status: 'Open to Program & Portfolio Management roles — India or international, remote or onsite',
} as const;

export const proof = [
  { value: '30', unit: 'days', label: 'Approved proposal to live production, on NIC MeghRaj', src: '8th Central Pay Commission' },
  { value: '40M+', unit: '', label: 'Citizens served by a platform I helped deliver', src: 'CRCS Portal, Ministry of Cooperation' },
  { value: '4d → 12h', unit: '', label: 'Incident resolution, after rebuilding the delivery estate', src: 'GE Vernova, via Infosys' },
  { value: '11', unit: 'years', label: 'Engineer, to lead, to consultant, to manager — in that order', src: 'TCS · UST · EY · Infosys · BDO' },
] as const;

/* ----------------------------------------------------------- engagements -- */
/**
 * What someone actually hires him to do. This replaced a list of 44 keywords,
 * which described a skill inventory rather than a service.
 */
export const engagements = [
  {
    title: 'Ship a platform through government',
    body:
      'Concept note to production inside Government of India machinery — requirement ' +
      'elicitation, technical and commercial proposal, NICSI-costed infrastructure, ' +
      'Parichay SSO, MeghRaj hosting, GIGW and WCAG conformance, UAT governance, launch. ' +
      'The engineering is rarely the long pole. The approvals are, and I run them in ' +
      'parallel with the build rather than after it.',
    proof: 'Delivered the 8th Central Pay Commission review system from accepted proposal to live production in <b>30 days</b>. Took the Green Hydrogen certification portal to a <b>ministerial launch</b>.',
    href: '/work/8th-cpc-mrms/',
    linkLabel: 'See how the 30 days worked',
  },
  {
    title: 'Turn around delivery that has stopped working',
    body:
      'Late, over-staffed, losing money, or all three. I take the transition, find where ' +
      'ownership went ambiguous, right-size the team to the work, automate the operational ' +
      'floor, and put a reporting cadence in front of the client so nobody learns about a ' +
      'problem from their own users.',
    proof: 'Took a loss-making US enterprise account to <b>net positive</b>, won <b>~$500K</b> of new business the following year, and cut incident resolution from four days to <b>under 12 hours</b>.',
    href: '/work/infosys-stabilisation/',
    linkLabel: 'See the turnaround',
  },
  {
    title: 'Build the delivery system itself',
    body:
      'PMO from nothing: RACI across vendors and client, risk and issue registers, ' +
      'escalation paths that actually route, milestone dashboards, and reporting pitched ' +
      'at the level of the person reading it — up to Secretary and Additional Secretary.',
    proof: 'Ran PMO governance across multiple ministry programmes at EY, and security compliance across <b>90+</b> Government of India websites.',
    href: '/work/crcs-portal/',
    linkLabel: 'See it at national scale',
  },
  {
    title: 'Specify what actually gets built',
    body:
      'The part most programme managers hand off. I write the developer specification, ' +
      'design the workflow, and own the data model — because the gap between what a ' +
      'ministry needs and what the system does is exactly where requirements go quietly ' +
      'wrong. This is also where my product work sits: roadmap, discovery, and adoption.',
    proof: 'Authored the certificate versioning specification underpinning green hydrogen certification, and defined the product vision for a credentialing platform adopted by <b>2,500+</b> employees.',
    href: '/work/skillchain/',
    linkLabel: 'See the product work',
  },
] as const;

/* ------------------------------------------------------------ trajectory -- */

export const trajectory = [
  {
    years: '2026 — Present',
    org: 'BDO India',
    title: 'Manager, Digital Transformation',
    note: 'Client: National e-Governance Division, MeitY',
    body:
      'Delivery and design lead across three concurrent Government of India platforms — ' +
      'Green Hydrogen Certification (MNRE), the 8th Central Pay Commission review system, ' +
      'and the Textile Unified Portal. Two live in 2026. Proposal and costing through UX, ' +
      'build oversight, UAT and stakeholder sign-off.',
  },
  {
    years: '2024 — 2026',
    org: 'Infosys',
    title: 'Project Manager',
    note: 'Client: GE Vernova (United States)',
    body:
      'Took transition of a loss-making, heavily over-staffed application portfolio and ' +
      'turned the account net positive. Right-sized the team, automated and standardised ' +
      'operations, reporting and budgeting, and cut incident resolution from four days to ' +
      'under twelve hours across a $2M+ annual portfolio.',
  },
  {
    years: '2022 — 2024',
    org: 'EY',
    title: 'Senior Consultant',
    note: 'Government of India programmes',
    body:
      'National digital government platforms, including the CRCS Portal serving 40M+ users ' +
      'and later extended to deliver Sahara refunds. Business process re-engineering, ' +
      'requirement analysis, PMO governance, and security compliance across 90+ ministry ' +
      'websites. Worked directly with Secretaries and Additional Secretaries.',
  },
  {
    years: '2021 — 2022',
    org: 'UST Global',
    title: 'Software Engineering Lead',
    note: 'Skillchain — internal product',
    body:
      'Defined product vision and roadmap for a blockchain credentialing platform, and ran ' +
      'the research cycles that got 2,500+ employees to actually use it.',
  },
  {
    years: '2020 — 2021',
    org: 'ValueCoders',
    title: 'Software Development Engineer',
    note: null,
    body:
      'Architecture for secure document workflow and transaction systems; API-level ' +
      'requirement analysis and performance work.',
  },
  {
    years: '2015 — 2020',
    org: 'Tata Consultancy Services',
    title: 'IT Analyst',
    note: 'BFSI clients across the US, UK and Japan',
    body:
      'Built multi-node Hyperledger Fabric networks, automated Unisys Mainframe reporting ' +
      'to save 20+ hours weekly, and cut reported defects on dispute resolution workflows ' +
      'by 40%.',
  },
] as const;

/* ----------------------------------------------------------- convictions -- */
/**
 * Each conviction carries the moment it came from. An aphorism on its own is a
 * LinkedIn post; the moment is what makes it his.
 */
export const convictions = [
  {
    title: 'Programmes die in the approval, not the build',
    body:
      "The engineering is rarely what's late. What's late is the note that wasn't structured " +
      "for the person signing it, the costing that didn't match the rate card, the " +
      'clarification that sat in an inbox for three weeks. So I treat the approval path as ' +
      'part of the system design: who signs this, what do they need to see, what makes them ' +
      'say no.',
    moment:
      'On the 8th CPC platform I ran the MeghRaj hosting approvals in parallel with ' +
      'development instead of waiting for them. That single sequencing decision is the ' +
      'whole reason it shipped in a month.',
  },
  {
    title: 'Nobody should have to translate for me',
    body:
      "A manager who can't evaluate an estimate can only escalate or accept it. Both are " +
      'expensive. I have a tech lead who owns the codebase, and I stay close enough to it to ' +
      'read the architecture, question a number, and understand the answer.',
    moment:
      'I wrote the certificate versioning specification for green hydrogen myself — how an ' +
      'issued certificate is amended and superseded without breaking its audit chain. That ' +
      'is a design decision, not a requirement, and handing it off would have lost it.',
  },
  {
    title: 'An over-staffed team is a confused team',
    body:
      'Extra headcount looks like safety and behaves like the opposite. With no clear ' +
      'ownership, people duplicate each other, collide on the same incident, and work ' +
      'weekends on things that were never theirs. I read attrition and overtime the way I ' +
      'read a burndown chart.',
    moment:
      'At GE Vernova I brought a team down to roughly half its size and delivery got faster, ' +
      'not slower. What we removed was not capacity. It was ambiguity.',
  },
  {
    title: 'A citizen cannot switch to a competitor',
    body:
      'Someone applying for a certificate has no alternative service, no way to escalate ' +
      "publicly, and often can't afford the day it costs them to try again. That asymmetry " +
      'should raise the standard rather than lower it.',
    moment:
      'So accessibility is written at design time on my programmes. Building to GIGW and ' +
      'WCAG 2.1 AA from the first Figma frame costs almost nothing. Retrofitting it after a ' +
      'failed audit costs a release.',
  },
  {
    title: "If it isn't written down, it wasn't decided",
    body:
      "Most disputes I've mediated weren't disagreements. They were two people remembering " +
      'different versions of a conversation nobody recorded. Decision logs and As-Is/To-Be ' +
      'documents are not bureaucracy — they are the difference between a team that argues ' +
      'about the past and one that argues about the work.',
    moment:
      'Documenting As-Is and To-Be per application team was the least glamorous thing I did ' +
      'on the GE Vernova estate, and the thing that made the handoffs stop costing days.',
  },
  {
    title: 'AI belongs in the delivery workflow, not the demo',
    body:
      'I am sceptical of AI as a headline feature on a government portal, and genuinely ' +
      'convinced by it as a tool in the hands of the people building one. The interesting ' +
      'gains have been in the ordinary, repetitive work of a delivery function.',
    moment:
      'I built documentation standards and a Figma-to-specification workflow that the team ' +
      'adopted. Unglamorous, and the reason I trust it.',
  },
] as const;

/* ----------------------------------------------------------------- reach -- */
/** Split apart: who he has delivered for, what sectors, and at what scale. */

export const organisations = [
  { name: 'Ministry of New & Renewable Energy', meta: 'Green hydrogen certification · Delivery & UX lead' },
  { name: '8th Central Pay Commission', meta: 'Memorandum review system · Manager' },
  { name: 'Ministry of Textiles', meta: 'Textile Unified Portal · Manager' },
  { name: 'Ministry of Cooperation', meta: 'CRCS Portal, 40M+ users · Senior consultant' },
  { name: 'Ministry of Electronics & IT', meta: 'National e-Governance Division · Embedded delivery' },
  { name: 'Bureau of Immigration', meta: 'IVFRT · Requirement analysis' },
  { name: 'GE Vernova', meta: 'United States · Application portfolio turnaround' },
  { name: 'BFSI clients, US / UK / Japan', meta: 'Hyperledger Fabric networks · TCS' },
] as const;

export const sectors = [
  'Public sector & e-governance', 'Renewable energy', 'Power & industrial technology',
  'Banking & financial services', 'Life sciences', 'Textiles', 'Cooperatives',
  'Immigration & border systems',
] as const;

export const scale = [
  { k: 'Largest user base', v: '40M+ citizens' },
  { k: 'Annual portfolio', v: '$2M+' },
  { k: 'Largest team', v: '30+ across vendors' },
  { k: 'Concurrent platforms', v: '3 national' },
  { k: 'Compliance estate', v: '90+ ministry sites' },
  { k: 'Fastest to production', v: '30 days' },
] as const;

/* ----------------------------------------------------------- credentials -- */

/**
 * The Certified Scrum Master credential is not currently active. Listing it
 * under a plain "Certifications" heading implies currency, so it is withheld
 * until Rishabh decides: renew, list with the year earned, or drop. Flip to
 * true once that is resolved.
 */
export const showLapsedScrumMaster = false;

export const credentials = {
  certifications: [
    ...(showLapsedScrumMaster ? ['Certified Scrum Master — Scrum Alliance'] : []),
    'Google Project Management Professional Certificate',
  ],
  education: ['PGDM — IMT CDL, Ghaziabad · 2023', 'B.Tech — UPTU, Lucknow · 2015'],
  earlier: [
    { label: 'Blockchain Specialization — Coursera', href: 'https://www.coursera.org/account/accomplishments/specialization/HR8BKULWS4AY' },
    { label: 'Blockchain for Business — edX', href: 'https://credentials.edx.org/credentials/a453008a053641878575f09e5e436ec4/' },
    { label: 'Blockchain Architecture & Use Cases — NPTEL', href: 'https://nptel.ac.in/courses/106105184/' },
  ],
} as const;

/* --------------------------------------------------------------- toolkit -- */
/** Kept deliberately small and factual — the engagements carry the argument. */
export const toolkit = [
  { k: 'Delivery', v: 'Agile/Scrum · Waterfall · hybrid · PMO · RACI · risk registers' },
  { k: 'Commercial', v: 'RFP / RFQ / DPR · technical proposals · NICSI & AWS costing · SOW' },
  { k: 'Build', v: 'MERN · React & TypeScript · REST · Hyperledger Fabric · CI/CD' },
  { k: 'Platform', v: 'NIC MeghRaj · Parichay SSO · AWS' },
  { k: 'Compliance', v: 'WCAG 2.1 AA · GIGW · UX4G · CERT-In' },
  { k: 'Tools', v: 'Jira · Confluence · Figma · MS Project · GitHub' },
] as const;

export const contact = {
  heading: "Let's talk.",
  body: [
    'I am open to Program and Portfolio Management roles — India or international, remote ' +
      "or onsite. If you are hiring for a programme that has to work inside regulation, " +
      'procurement and multiple stakeholders, that is the work I do.',
    "I'm also happy to talk if you're not hiring. Some of the best conversations I've had " +
      'started with someone asking how we got a government platform approved in a month.',
  ],
} as const;
