/**
 * Every word on the site that isn't a case study lives here.
 * Case studies are Markdown in /content/case-studies.
 */

export const person = {
  name: 'Rishabh Jain',
  role: 'Program & Portfolio Manager',
  secondary: 'Digital Transformation · Government & Enterprise Delivery',
  location: 'New Delhi, India',
  email: 'rishabh.jain@outlook.in',
  linkedin: 'https://www.linkedin.com/in/notrishabhjain/',
  resumePdf: '/files/Rishabh_Jain_Resume.pdf',
  resumeDocx: '/files/Rishabh_Jain_Resume.docx',
} as const;

export const meta = {
  title: 'Rishabh Jain — Program & Portfolio Manager',
  description:
    'Program and portfolio manager with 11 years delivering digital transformation for ' +
    'Government of India ministries and global enterprise clients. National platforms ' +
    'from proposal to production.',
} as const;

export const hero = {
  headline: 'I close the gap between what a programme is supposed to achieve and what actually ships.',
  standfirst:
    'Eleven years running digital transformation for Government of India ministries and ' +
    'global enterprise clients — TCS, UST, EY, Infosys, and now BDO India, embedded with ' +
    "MeitY's National e-Governance Division. I have a tech lead who owns the code. I'm the " +
    'manager who can read it, and most programmes fail in exactly that gap — between the ' +
    'room where the decision is made and the room where it gets built.',
  availability:
    'Open to Program, Portfolio and Product roles — India or international, remote or onsite.',
} as const;

export const proof = [
  { value: '11 years', label: 'in delivery, engineering to programme leadership' },
  { value: '40M+', label: "citizens on platforms I've delivered" },
  { value: '30 days', label: 'from approval to production on a national platform' },
  { value: 'Net positive', label: 'a loss-making $2M account, turned around' },
] as const;

export const thesis = [
  {
    title: 'I run the delivery, not just the report',
    body:
      'Governance is only worth something if it changes what the team does on Monday. I set ' +
      'up PMOs, RACI matrices, risk registers and escalation paths — and then use them to make ' +
      'decisions, not to describe decisions that were made somewhere else.',
    evidenceLabel: 'Evidence',
    evidence:
      'I took over a loss-making GE Vernova application portfolio at Infosys with a team ' +
      'roughly twice the size the work needed. I right-sized it, gave what remained ' +
      'unambiguous ownership, automated the operational and reporting layer, and cut mean ' +
      'time to resolution from four days to under twelve hours. The account went from cash ' +
      'outflow to net positive, and won ~$500K in additional business over the following year.',
  },
  {
    title: 'Nothing has to be translated for me',
    body:
      'I spent my first six years writing code — Hyperledger Fabric networks for BFSI clients, ' +
      'MERN applications, mainframe automation. I have a tech lead who owns the codebase now, ' +
      "and I've stayed close enough to it to read the architecture, question an estimate, " +
      "understand the answer, and write a specification an engineer doesn't have to interpret.",
    evidenceLabel: 'Evidence',
    evidence:
      'I authored the developer specification for certificate versioning on the Green Hydrogen ' +
      'certification platform — how an issued certificate is amended, superseded and audited ' +
      "without breaking its traceability chain. That isn't a requirement a project manager " +
      'writes. It is a design decision, and it needed someone who understood both the ' +
      'compliance obligation and the data model.',
  },
  {
    title: 'I know how government actually approves things',
    body:
      "Most public-sector programmes don't fail in the build. They fail in the approval — the " +
      "note that wasn't structured for the person signing it, the costing that didn't match the " +
      'rate card, the accessibility standard nobody read until the audit.',
    evidenceLabel: 'Evidence',
    evidence:
      "The 8th Central Pay Commission's memorandum review system went from approved proposal to " +
      'live production in a month, deployed on NIC MeghRaj — because the hosting approvals ran ' +
      "in parallel with the build instead of after it. I've authored RFPs, DPRs and proposals " +
      'through to Secretary-level approval, costed against live NICSI rate cards, and built to ' +
      'GIGW, UX4G, WCAG 2.1 AA and CERT-In from the design stage rather than retrofitting after ' +
      'a failed audit.',
  },
] as const;

export const trajectory = [
  {
    years: '2026 — Present',
    org: 'BDO India',
    title: 'Manager, Digital Transformation',
    note: 'Client: National e-Governance Division (MeitY)',
    body:
      'Delivery and design lead across three concurrent Government of India platforms — Green ' +
      'Hydrogen Certification (MNRE), the 8th Central Pay Commission memorandum review system, ' +
      'and the Textile Unified Portal (Ministry of Textiles). Two live in 2026. Proposal and ' +
      'costing through UX, build oversight, UAT and stakeholder sign-off.',
  },
  {
    years: '2024 — 2026',
    org: 'Infosys',
    title: 'Project Manager',
    note: 'Client: GE Vernova (United States)',
    body:
      'Took transition of a loss-making, heavily over-staffed application portfolio and turned ' +
      'the account net positive. Right-sized the team by roughly half, automated and standardised ' +
      'operations, reporting, budgeting and client communications, and cut incident resolution ' +
      'from four days to under twelve hours. ~$500K additional business won over the following ' +
      'year, across a $2M+ annual delivery portfolio.',
  },
  {
    years: '2022 — 2024',
    org: 'EY',
    title: 'Senior Consultant',
    note: null,
    body:
      'National digital government programmes, including the CRCS Portal serving 40M+ users and ' +
      'later extended to deliver Sahara refunds. BPR, requirement analysis, PMO governance, and ' +
      'security compliance across 90+ ministry websites. Worked directly with Secretaries and ' +
      'Additional Secretaries.',
  },
  {
    years: '2021 — 2022',
    org: 'UST Global',
    title: 'Software Engineering Lead',
    note: null,
    body:
      'Product vision and roadmap for a blockchain credentialing platform adopted across 2,500+ ' +
      'employees.',
  },
  {
    years: '2020 — 2021',
    org: 'ValueCoders',
    title: 'Software Development Engineer',
    note: null,
    body:
      'Architecture for secure document workflow and transaction systems; API-level requirement ' +
      'analysis and performance work.',
  },
  {
    years: '2015 — 2020',
    org: 'Tata Consultancy Services',
    title: 'IT Analyst',
    note: null,
    body:
      'Multi-node Hyperledger Fabric networks for BFSI clients. Mainframe reporting automation ' +
      'saving 20+ hours weekly. Dispute resolution workflow optimisation, defects down 40%. ' +
      'Clients across the US, UK and Japan.',
  },
] as const;

export const capabilities = [
  {
    group: 'Delivery & governance',
    items: [
      'Programme governance', 'PMO setup', 'RACI definition', 'Risk registers',
      'Milestone dashboards', 'Delivery stabilisation', 'Escalation frameworks',
      'Agile / Scrum', 'Waterfall', 'Hybrid delivery', 'Secretary-level reporting',
    ],
  },
  {
    group: 'Commercial',
    items: [
      'SOW and contract management', 'RFP, RFQ and DPR authoring', 'Technical proposal writing',
      'Infrastructure cost estimation (NICSI, AWS)', 'Portfolio budgeting',
      'Vendor performance monitoring', 'P&L turnaround', 'Resource optimisation',
    ],
  },
  {
    group: 'Stakeholder & client',
    items: [
      'Government stakeholder management', 'Secretary and Additional Secretary level',
      'Multi-vendor oversight', 'Scope and expectation negotiation', 'UAT sign-off governance',
      'CIO and application owner relationships',
    ],
  },
  {
    group: 'Technology',
    items: [
      'MERN stack', 'React and TypeScript', 'REST API design', 'System architecture',
      'Hyperledger Fabric', 'Cloud modernisation (AWS, NIC MeghRaj)', 'CI/CD',
      'Applied AI and LLM integration',
    ],
  },
  {
    group: 'Design & compliance',
    items: [
      'UX and UI leadership', 'Figma design systems', 'WCAG 2.1 AA', 'GIGW', 'UX4G',
      'CERT-In security compliance', 'Accessibility audit',
    ],
  },
  {
    group: 'Tools',
    items: ['Jira', 'Confluence', 'Figma', 'MS Project', 'GitHub'],
  },
] as const;

export const convictionsIntro = "Six things I've come to believe, mostly by getting them wrong first.";

export const convictions = [
  {
    title: 'Programmes die in the approval, not the build',
    body:
      "The engineering is rarely what's late. What's late is the note that wasn't structured " +
      "for the person signing it, the costing that didn't match the rate card, the " +
      "clarification that sat in an inbox for three weeks. I've learned to treat the approval " +
      'path as part of the system design — to ask early who signs this, what they need to see, ' +
      'and what will make them say no — because a plan that ignores that path is a plan for a ' +
      "different organisation than the one you're in.",
  },
  {
    title: 'Nobody should have to relay my instructions to the engineers',
    body:
      "A project manager who can't evaluate an estimate can only escalate or accept. Both are " +
      'expensive. I keep my hands close enough to the work to read the code, question the ' +
      "architecture, and write a specification an engineer doesn't have to translate. It isn't " +
      'about doing their job — it\'s that the translation layer between "what the ministry ' +
      'needs" and "what the system does" is exactly where requirements go quietly wrong, and ' +
      "I'd rather stand in it than manage across it.",
  },
  {
    title: 'Burnout is a delivery risk, not an HR problem',
    body:
      "The most effective thing I did on a distressed portfolio wasn't technical. It was making " +
      "it unambiguous who owned what. Ambiguity in a multi-vendor team doesn't produce healthy " +
      'debate; it produces people working weekends on things that were never theirs, and then ' +
      'leaving. Every person who leaves takes context with them, and the next incident is worse. ' +
      'I read attrition and overtime the way I read a burndown chart.',
  },
  {
    title: 'The user of a government platform cannot go elsewhere',
    body:
      'This is the one I hold most strongly. A citizen applying for a certificate has no ' +
      "competitor to switch to, can't tweet their way to a fix, and often can't afford the day " +
      'it costs them to try again. That asymmetry should raise the standard, not lower it — ' +
      'which is why I treat accessibility and WCAG conformance as requirements written at ' +
      'design time, not as an audit to survive at the end. Building to GIGW and WCAG 2.1 AA ' +
      'from the first Figma frame costs almost nothing. Retrofitting it costs a release.',
  },
  {
    title: "If it isn't written down, it wasn't decided",
    body:
      "Most disputes I've mediated weren't disagreements. They were two people who each " +
      'remembered a different version of a conversation nobody recorded. As-Is and To-Be ' +
      'documents, decision logs, specifications, a RACI that people actually read — these are ' +
      'not bureaucracy. They are the difference between a team that argues about the past and a ' +
      'team that argues about the work.',
  },
  {
    title: 'AI belongs in the delivery workflow, not the demo',
    body:
      "The interesting use of AI on my programmes hasn't been a feature on a roadmap. It's been " +
      'the documentation standards and design-to-specification workflows I built for my own ' +
      'team — the ordinary, repetitive work of a delivery function, done faster and more ' +
      'consistently. I am sceptical of AI as a headline on a government portal and genuinely ' +
      'convinced by it as a tool in the hands of the people building one.',
  },
] as const;

export const reach = [
  {
    group: 'Sectors',
    items: [
      'Public sector and e-governance', 'Banking and financial services', 'Life sciences',
      'Renewable energy', 'Power and industrial technology', 'Textiles', 'Cooperatives',
      'Immigration and border systems', 'IT services and consulting',
    ],
  },
  {
    group: 'Ministries and national bodies',
    items: [
      'Ministry of New & Renewable Energy', 'Ministry of Textiles', 'Ministry of Cooperation',
      'Ministry of Electronics & IT (NeGD)', '8th Central Pay Commission', 'Bureau of Immigration',
    ],
  },
  {
    group: 'Clients and geographies',
    items: [
      'GE Vernova (US)', 'Enterprise clients across the US, UK and Japan',
      'Government of India ministries', 'All delivered from India',
    ],
  },
  {
    group: 'Scale',
    items: ['Teams of 30+', '$2M+ annual delivery portfolios', 'Platforms serving 40M+ citizens'],
  },
] as const;

/**
 * The Certified Scrum Master credential is not currently active (confirmed by
 * Rishabh). Listing a lapsed certification under a plain "Certifications"
 * heading implies currency, so it is withheld from the published page until he
 * decides how to handle it: renew, list it with the year earned, or drop it.
 * Flip this to true — or add a `year` — the moment that is resolved.
 */
export const showLapsedScrumMaster = false;

export const credentials = {
  certifications: [
    ...(showLapsedScrumMaster ? ['Certified Scrum Master — Scrum Alliance'] : []),
    'Google Project Management Professional Certificate',
  ],
  education: [
    'PGDM — IMT CDL, Ghaziabad · 2023',
    'B.Tech — UPTU, Lucknow · 2015',
  ],
  earlier: [
    { label: 'Blockchain Specialization — Coursera', href: 'https://www.coursera.org/account/accomplishments/specialization/HR8BKULWS4AY' },
    { label: 'Blockchain for Business — edX', href: 'https://credentials.edx.org/credentials/a453008a053641878575f09e5e436ec4/' },
    { label: 'Blockchain Architecture & Use Cases — NPTEL', href: 'https://nptel.ac.in/courses/106105184/' },
    { label: 'Blockchain learning path — LinkedIn', href: 'https://www.linkedin.com/learning/paths/advance-your-skills-in-the-blockchain?u=2154233' },
  ],
} as const;

export const contact = {
  heading: "Let's talk.",
  body: [
    'I am open to Program, Portfolio and Product Management roles — India or international, ' +
      "remote or onsite. If you're hiring for a programme that has to work in a regulated, " +
      "multi-stakeholder environment, that's the work I do.",
    "I'm also happy to talk if you're not hiring. Some of the best conversations I've had " +
      'started with someone asking how we got a government platform through approval in a month.',
  ],
} as const;

export const nav = [
  { label: 'Why me', href: '#thesis' },
  { label: 'Work', href: '#work' },
  { label: 'Track record', href: '#trajectory' },
  { label: 'How I work', href: '#how-i-work' },
  { label: 'Contact', href: '#contact' },
] as const;
