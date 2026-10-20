"""Builds the international portfolio. Run:  python3 tools/build.py
Figures are approximate and match the master site; INR values are converted at about ₹87 per US dollar."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from html import escape as e
from layout import page, cta, EMAIL, LINKEDIN, RESUME, SITE
import charts as C

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = "{R}"  # replaced with the relative root by layout.page


def write(path, html):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(html)


# ---------------------------------------------------------------- shared data
ROLES = [  # label, start, end, class, tip, sub
    ("TCS", 2015.75, 2020.42, "s1", "TCS · IT Analyst · Oct 2015 – May 2020 · mainframe automation, then blockchain", "IT Analyst"),
    ("ValueCoders", 2020.42, 2021.45, "s1", "ValueCoders · Software Engineer · Jun 2020 – Jun 2021", "SDE"),
    ("UST Global", 2021.45, 2022.25, "s1", "UST Global · Software Engineering Lead · Jun 2021 – Apr 2022", "Lead"),
    ("EY", 2022.25, 2024.84, "s3", "EY India · Senior Consultant, Government · Apr 2022 – Nov 2024", "Senior Consultant"),
    ("Infosys", 2024.84, 2026.0, "s2", "Infosys · Project Manager · Nov 2024 – Jan 2026 · $2M+/yr portfolio", "PM"),
    ("BDO India", 2026.0, 2026.8, "s2", "BDO India · Manager · Jan 2026 – present · two national platforms", "Mgr"),
]
PHASE_LEGEND = [("l1", "Engineering"), ("l3", "Government consulting"), ("l2", "Project management")]


def career_gantt(w=560, minw=420, label_w=96):
    svg = C.gantt(ROLES, 2015.5, 2026.9, "Career timeline from 2015 to 2026: engineering at TCS, ValueCoders and UST Global; government consulting at EY; project management at Infosys and BDO India.",
                  w=w, label_w=label_w, years=[2016, 2018, 2020, 2022, 2024, 2026], minw=minw, now_label=True)
    return svg


def kpi_row(items):
    return '<div class="kpis">' + "".join(f'<div class="kpi reveal"><b>{b}</b><span>{s}</span></div>' for b, s in items) + "</div>"


# ---------------------------------------------------------------- case studies
CASES = []


def case(slug, **kw):
    kw["slug"] = slug
    CASES.append(kw)


# 1 ─ Pay Commission
case("pay-commission-platform",
     short="Pay Commission platform",
     tags="gov ai", tag=("gov", "Public sector"), year="2026",
     title="A national pay-review platform, live in 30 days",
     card_title="National pay-review platform, live in 30 days",
     card_text="Replaced a spreadsheet with an audited workflow platform for the commission that reviews pay for 7 million public employees and pensioners.",
     big=("30 days", "kick-off to production, against a deadline fixed by law"),
     minis=[("20×", "faster data entry"), ("21K", "demands managed"), ("Passed", "external security audit")],
     dek="India’s 8th Central Pay Commission was tracking demands from ministries and staff unions in a spreadsheet. With a statutory deadline and four organisations that didn’t report to one another, my team replaced it with an audited, workflow-driven platform in about a month.",
     meta=[("Client", "8th Central Pay Commission", "Government of India"), ("Role", "Project Manager", "BDO India"),
           ("Team", "8 people", "4 organisations coordinating"), ("Timeline", "Jul – Aug 2026", "Live 24 Aug 2026"),
           ("Stack", "MERN, government cloud", "Single sign-on · open source only")],
     kpis=[("~30 days", "from kick-off to production go-live"), ("20×", "faster demand entry: about 50 a day to about 1,000"),
           ("21K", "demands on the platform, used by about 200 officers"), ("7M", "public employees and pensioners whose pay the Commission reviews")],
     tldr=("A statutory commission was running its core review process in Excel: no owner per demand, no audit trail, a date that could not move.",
           "Cut a five-sprint plan to two parallel build streams, turned the spreadsheet into an auditable workflow, and sized the platform for ten times launch volume.",
           "Live on 24 August 2026 after an external security audit. Data entry rose about 20×, and every demand now has a named owner and a permanent history."),
     context=["The 8th Central Pay Commission reviews salaries and pensions for about <strong>7 million</strong> central government employees and pensioners in India. Ministries, staff associations and federations submit demands to it, and each one has to be examined, referred, reviewed and placed before the Commission.",
              "When I picked the project up, those demands lived in an Excel sheet. Nobody could see who held a demand or what had been decided. The Commission’s term is fixed by law, so the go-live date could not slip, and four organisations — the Commission, the national e-governance division, the cloud provider and the identity service — had to move together without any of them reporting to the others."],
     constraints=["Deadline fixed by statute", "External security audit before go-live", "Open-source components only", "Government cloud and single sign-on", "Four organisations, no shared reporting line", "Volume expected to grow 10× within months"],
     decisions=[("Compress five sprints into two parallel streams", "Any single module running late would have moved the date. Building the modules side by side meant no one module sat on the critical path.", "More coordination and a heavier load on me mid-project. I named that cost on day one so it was planned for, not discovered."),
                ("Turn the spreadsheet into an auditable workflow", "Each demand now moves through fixed stages — created, examined, optionally referred to a ministry, reviewed by a senior officer, placed before the Commission. Every step has a named owner and an entry that can’t be edited afterwards.", "Slower than typing into a cell, and officers had to learn a process instead of a file. In return, anyone can see who holds a demand and why it moved."),
                ("Use the existing sheet as the first requirement", "Its 24 columns became typed fields, and data from 14 offices that shared no common format was loaded once into one place.", "Some columns carried habits rather than rules, so each one was challenged before it became a field."),
                ("Size for month six, not launch day", "The platform was designed for about 200,000 demands — roughly ten times what it holds today — so there would be no re-architecture inside the Commission’s term.", "More design time inside a 30-day window.")],
     charts=lambda: [
         C.figure("Delivery milestones", "July to August 2026",
                  C.milestones([(9, "Kick-off", "late July · spreadsheet baselined", False), (21, "Parallel build", "two streams, 11 modules", False),
                                (35, "Security audit", "19–21 Aug, external", False), (40, "Go-live", "24 Aug 2026", True)],
                               "Milestones: kick-off in late July, two parallel build streams, external security audit 19 to 21 August, go-live 24 August 2026.",
                               start=0, end=47, ticks=[(5, "20 Jul"), (17, "1 Aug"), (31, "15 Aug"), (47, "31 Aug")]),
                  "About a month from kick-off to production. The audit window sat five days before go-live, so remediation had to be planned before testing began.",
                  C.table(["When", "Milestone"], [["Late July 2026", "Kick-off; requirements baselined from the live spreadsheet"], ["July–August", "Two parallel build streams, 11 modules"], ["19–21 Aug", "External security audit"], ["24 Aug 2026", "Production go-live"]]), wide=True),
         C.figure("Demands entered per day", "Approximate, before and after",
                  C.hbar([("Spreadsheet", 50, "~50", "sm", "Before: about 50 demands entered per day in Excel"),
                          ("Platform", 1000, "~1,000", "s1", "After: about 1,000 demands entered per day on the platform")],
                         1150, "Demands entered per day rose from about 50 on the spreadsheet to about 1,000 on the platform.", label_w=100, ticks=[(0, "0"), (500, "500"), (1000, "1,000")]),
                  "About a 20× increase in entry speed, which is what made the backlog manageable inside the Commission’s term.",
                  C.table(["Measure", "Value"], [["Per day, spreadsheet", "~50"], ["Per day, platform", "~1,000"]])),
         C.figure("Headroom built in", "Demands held today vs designed capacity",
                  C.hbar([("Held today", 21000, "~21K", "s1", "About 21,000 demands on the platform today"),
                          ("Designed for", 200000, "~200K", "sm", "Designed to hold about 200,000 demands")],
                         235000, "About 21,000 demands are held today against a designed capacity of about 200,000.", label_w=100, ticks=[(0, "0"), (100000, "100K"), (200000, "200K")]),
                  "Sized for roughly ten times today’s volume, so growth never forces a rebuild inside a fixed term.",
                  C.table(["Measure", "Value"], [["Demands held today", "~21,000"], ["Designed capacity", "~200,000"]])),
         C.figure("One demand, one owner at every step", "The workflow that replaced the spreadsheet",
                  C.flow([("Intake & assign", "Admin", None), ("Create demand", "Processing officer", None), ("Examine", "Same officer", None),
                          ("Refer to ministry", "Optional · reply logged", None), ("Second opinion", "Referred officer · optional", None),
                          ("Review & prioritise", "Reviewing officer", None), ("To the Commission", "Terminal · edits logged", True)],
                         "Workflow: intake and assignment by admin, creation and examination by a processing officer, optional ministry referral and second opinion, review by a reviewing officer, then placed before the Commission."),
                  "Four roles, seven steps. The spreadsheet had no state and no owner; here every move belongs to a named role and leaves an audit entry.",
                  C.table(["Step", "Owner"], [["Intake & assignment", "Admin"], ["Demand creation", "Processing officer"], ["Examination", "Same officer"], ["Ministry referral (optional)", "Creator; reply logged"], ["Second opinion (optional)", "Referred officer"], ["Review & priority", "Reviewing officer"], ["Placed before the Commission", "Terminal; later edits logged"]]), wide=True),
     ],
     owned="The delivery plan and the switch to parallel streams, workflow rules, coordination across four organisations, status reporting, and the scope of the AI phase.",
     team="Build and test of 11 modules and the one-time data load, by a team of eight including me.",
     client="The Commission’s rules and approvals, hosting, network and identity arrangements run by other bodies, and the security audit verdict.",
     results=["<strong>Live on 24 August 2026</strong>, about a month after kick-off, after passing an external security audit (19–21 August).",
              "<strong>~21,000 demands</strong> managed by around <strong>200 officers</strong>, signing in through government single sign-on.",
              "Data entry up from <strong>~50 to ~1,000 demands a day</strong>.",
              "Data from <strong>14 offices</strong> with no shared format now sits in one system with a full audit trail."],
     ai="The next phase adds AI that flags likely duplicate demands and retrieves the evidence a demand cites. It advises only: a named officer makes every decision.",
     lesson="When a date can’t move, decide on day one which other thing will take the strain — here, coordination effort — and plan for it openly. The best first requirement is the spreadsheet people already use.")

# 2 ─ Green hydrogen
case("green-hydrogen-certification",
     short="Green hydrogen certification",
     tags="gov energy ai", tag=("energy", "Energy · Public sector"), year="2026",
     title="Certifying green hydrogen for a whole country — from a blank page",
     card_title="National green hydrogen certification, from a blank page",
     card_text="No certification process existed. Defined it with the ministry, built the portal, cleared an external audit the day before launch, and launched with the Minister.",
     big=("0 → 1", "a national certification process defined, built, audited and launched in about six months"),
     minis=[("~$800K", "programme"), ("48 / 51", "findings closed pre-audit"), ("8", "certificates issued")],
     dek="India’s Ministry of New and Renewable Energy had scheme rules but no way to apply, audit, approve or issue certificates. I led the team that defined the process with the ministry, built the national portal, cleared an external security audit the day before launch, and saw it launched by the Minister on 1 July 2026.",
     meta=[("Client", "Ministry of New & Renewable Energy", "Government of India"), ("Role", "Project Manager", "BDO India"),
           ("Team", "10 people", "BA, dev, QA, design, DevOps"), ("Timeline", "Jan – Jul 2026", "Launched 1 Jul 2026"),
           ("Value", "~$800K", "≈ ₹7 crore programme")],
     kpis=[("~6 mo", "from mandate to national launch by the Minister"), ("~250", "features across 11 modules, signed off before sprint 1"),
           ("48 / 51", "security findings closed before the external audit began"), ("8", "certificates issued from 20+ applications so far")],
     tldr=("India targets 5 million tonnes of green hydrogen a year by 2030, but there was no digital way to certify that hydrogen is actually green.",
           "Defined the process with the ministry before writing code, made certificates append-only legal records, and ran our own security review before the auditors arrived.",
           "Launched on 1 July 2026 with producers, verification agencies and committee members on the platform. Phase 2 AI is approved and in procurement."),
     context=["To count as green, hydrogen must be made from renewable power and stay under a set carbon limit — and someone has to verify and certify that. India’s scheme rules were issued in April 2025, backing a national target of <strong>5 million tonnes a year by 2030</strong>.",
              "What didn’t exist was any way to apply, audit, approve and issue certificates online. There was no previous process to copy, the launch date was fixed, the cloud environment arrived only two and a half weeks before the first testing target, and an external security audit stood between the build and go-live."],
     constraints=["No existing process to digitise", "Fixed public launch date", "Cloud ready 2.5 weeks before first test target", "External audit by a government-empanelled agency", "Certificates are legal records", "Dual signing: national e-sign and digital certificates"],
     decisions=[("Define the process before building it", "We started from the scheme rules, mapped every user journey, studied comparable portals and walked the client through the flow. Nothing went to development until it was accepted; ~250 features across 11 modules were baselined, and every later change went through formal change control.", "A slower start on code, in exchange for a scope that didn’t move under us."),
                ("Never overwrite a certificate", "Every amendment creates a new version and the original stays readable, across all four certificate types — so the full history can be shown years later if a certification is challenged.", "More storage and more complex screens that must always say which version you’re looking at."),
                ("Test security before the auditors arrive", "We reviewed our own code first and closed 48 of 51 findings before the external audit began. The audit then needed one short round of fixes; clearance came on 30 June, the day before launch.", "Two weeks of build time spent on remediation instead of features."),
                ("Launch without AI, add it in Phase 2", "Verifiers and approvers had never used a digital process for this. They needed to understand it first, so AI was held back and scoped as an approved Phase 2.", "A less impressive launch, in exchange for a Phase 2 that can be accepted on evidence.")],
     charts=lambda: [
         C.figure("From mandate to launch", "2026",
                  C.milestones([(0.5/8, "Process signed", "Jan · BRD before sprint 1", False), (1.5/8, "Build starts", "Feb", False), (2.85/8, "UAT release", "27 Mar · 66 fixes closed", False),
                                (4.5/8, "Internal security review", "May · 48 of 51 closed", False), (6.0/8, "Audit cleared → launch", "30 Jun → 1 Jul, by the Minister", True), (7.5/8, "Phase 2 AI scoped", "Aug", False)],
                               "Timeline from January to August 2026: process signed in January, build from February, UAT release 27 March, internal security review in May, external audit cleared 30 June, launch 1 July, Phase 2 AI scope in August.",
                               ticks=[(i/8, m) for i, m in enumerate(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"])], w=760, minw=640),
                  "Process first, then build. The audit cleared the day before launch because remediation started in May, not after the auditors reported.",
                  C.table(["When (2026)", "Milestone"], [["January", "Mandate; process defined; requirements signed before sprint 1"], ["February", "Build starts"], ["27 March", "UAT release; 66 fixes and enhancements closed"], ["May", "Internal security review: 48 of 51 findings closed"], ["30 June", "External audit cleared"], ["1 July", "Launch by the Minister"], ["August", "Phase 2 AI scope finalised"]]), wide=True),
         C.figure("Security findings before the external audit", "Internal review, 51 findings",
                  C.stacked([("48 closed", 48, "s1", "48 of 51 findings closed before the external audit"), ("3 open", 3, "s2", "3 findings still open, closed in one short round after the audit")], 51,
                            "48 of 51 internal security findings were closed before the external audit began; 3 remained.", caption_total="51 findings"),
                  "94% closed before the auditors started. The external audit then needed only one short round of fixes.",
                  C.table(["Status", "Findings"], [["Closed before external audit", "48"], ["Open at audit start", "3"], ["Total", "51"]]),
                  legend=[("l1", "Closed"), ("l2", "Open")]),
         C.figure("Who’s on the platform", "At launch and since",
                  C.hbar([("Applications", 20, "20+", "s1", "More than 20 applications received"),
                          ("Producers", 8, "8", "s1", "8 hydrogen producers onboarded"),
                          ("Certificates", 8, "8", "s1", "8 certificates issued so far"),
                          ("Committee", 4, "4", "s1", "4 committee members"),
                          ("Verifiers", 3, "3", "s1", "3 verification agencies")],
                         24, "Platform activity: more than 20 applications, 8 producers, 8 certificates issued, 4 committee members and 3 verification agencies.", label_w=100, row_h=38),
                  "A new national market, starting small: every party in the certification chain is now working on one platform.",
                  C.table(["Measure", "Count"], [["Applications", "20+"], ["Producers", "8"], ["Certificates issued", "8"], ["Committee members", "4"], ["Verification agencies", "3"]])),
         C.figure("Certificates are append-only", "Four certificate types, one rule",
                  C.flow([("Concept", "Pre-feasibility", None), ("Facility", "Plant registered", None), ("Provisional", "Interim, per period", None), ("Final", "Legal certificate", True)],
                         "Four certificate types — Concept, Facility, Provisional, Final — each versioned so an amendment adds a record instead of overwriting.", minw=560),
                  "Any amendment adds a new version; the original stays readable. Costlier to store and display, but defensible years later.",
                  C.table(["Certificate", "Rule"], [["Concept", "Amendments create a new version"], ["Facility", "Amendments create a new version"], ["Provisional", "Amendments create a new version"], ["Final", "Amendments create a new version"]]), wide=True),
     ],
     owned="Process definition and the requirements baseline, change control, delivery governance and escalation, the UAT and security-remediation plan, and the Phase 2 scope and request for quotation.",
     team="Design, build and test of 11 modules and the security fixes, by a team of ten including me.",
     client="The scheme rules, sign-off of the baseline and each change, UAT acceptance, security clearance and the decision to launch.",
     results=["<strong>Launched by the Minister on 1 July 2026</strong>, on the planned date.",
              "<strong>8 producers, 3 verification agencies and 4 committee members</strong> working on one platform; <strong>20+ applications</strong> and <strong>8 certificates</strong> issued so far.",
              "National e-sign and digital-certificate signing, notifications and a document locker all live.",
              "The first post-launch change request touched the workflow itself — analysed, approved and ready in <strong>about three days</strong>."],
     ai="Phase 2 — approved and in procurement — adds AI to check submissions, flag unusual emissions data and support verifiers. Two rules: AI advises and a named officer approves, and every AI claim must point to the source document. It will be accepted against cases people have already decided by hand.",
     lesson="When a process is new, the people who judge the result have to understand it before you automate it. Time spent agreeing the process before development is what makes a fixed launch date possible.")

# 3 ─ Wind
case("wind-portfolio-turnaround",
     short="Wind portfolio turnaround",
     tags="energy ent ai", tag=("ent", "Enterprise · Energy"), year="2024–26",
     title="From a total loss to +25% margin on a 24×7 wind-energy portfolio",
     card_title="Loss-making wind portfolio, profitable in six months",
     card_text="A $2M+/yr support unit for ~55 turbine-monitoring applications, turned around by fixing the operating model before touching headcount.",
     big=("−100% → +25%", "unit margin, with a 99.9% SLA held throughout"),
     minis=[("$2M+/yr", "contract"), ("8×", "faster incident fixes"), ("35", "people led")],
     dek="A support unit for about 55 applications that monitor wind turbines worldwide was running at a complete loss, with twice the staff the contract needed. I fixed how the work was organised before touching headcount — and took it to profit in six months while holding a 99.9% SLA.",
     meta=[("Client", "Global wind-energy OEM", "Name withheld"), ("Role", "PM · Product Owner · Scrum Master", "Infosys"),
           ("Team", "35 people", "20 delivery + 15 support"), ("Timeline", "Nov 2024 – Jan 2026", "Profitable in 6 months"),
           ("Contract", "$2M+ a year", "~55 applications")],
     kpis=[("+25%", "unit margin, from a complete loss at the start"), ("8×", "faster incident resolution: 4 days to under 12 hours"),
           ("99.9%", "SLA held on systems that run 24×7"), ("~$200K", "a year of new billable work, previously given away")],
     tldr=("A loss-making unit, staffed at twice its contractual need, supporting hardware that never stops — and knowledge locked in a few senior engineers.",
           "Standardised the work and moved it to the right level first, split one blended SLA into three, started charging for out-of-scope work, then resized the team and staged AI in.",
           "Profit of ~15% in six months, ~25% later. 99.9% SLA held, incident fixes 8× faster, 70–80% of the portfolio automated, and several team awards."),
     context=["The unit supported about <strong>55 applications</strong> that monitor wind turbines for a global OEM — mission-critical systems with globally distributed hardware that need 24×7 uptime. The contract was worth more than <strong>$2M a year</strong>.",
              "When I took over, the unit was running at a complete loss. It had roughly twice the people the contract needed, critical knowledge sat with a few senior engineers, support, enhancements and changes were measured as one blended pool, and extra work was being delivered for free."],
     constraints=["24×7 systems, no maintenance windows", "Staffed at ~2× contractual need", "Knowledge held by a few people", "One blended SLA hiding failures", "Out-of-scope work delivered free", "Senior client IT relationship under strain"],
     decisions=[("Fix the operating model before reducing people", "Standard operating procedures replaced knowledge held in individuals, repetitive work moved to a new L1.5 support layer, and only then was the team resized.", "It delayed the visible saving by months — but the reduction didn’t push risk onto the people who stayed."),
                ("Measure support, enhancements and changes separately", "Each stream got its own target instead of one blended number.", "Three targets are harder to report than one, but they showed exactly where the service was failing."),
                ("Charge for out-of-scope work", "Requests outside the contract became separately scoped, paid work — about $200K a year of new business.", "Some uncomfortable conversations with the client, handled through a fixed reporting and escalation routine."),
                ("Bring AI in by stages", "AI first watched support tickets in shadow mode, then handled a six-hour window, then full days. Each stage needed evidence from the one before.", "Slower than a big-bang switch-over. It reached production and was never rolled back.")],
     charts=lambda: [
         C.figure("Unit margin", "Milestones, not evenly spaced in time",
                  C.line_points([("Start (Nov 2024)", -100, "Start: complete loss, about −100% margin"), ("After 6 months", 15, "After six months: about +15% margin"), ("Later", 25, "Later: about +25% margin")],
                                -100, 50, "Unit margin moved from about −100 percent at the start to about +15 percent after six months and about +25 percent later."),
                  "Operating model first, headcount second — and the margin followed.",
                  C.table(["Milestone", "Margin (approx.)"], [["Start", "−100% (complete loss)"], ["After six months", "+15%"], ["Later", "+25%"]])),
         C.figure("Time to fix a production issue", "Mean time to resolve, approximate",
                  C.hbar([("Before", 96, "4 days", "sm", "Before: about 4 days (96 hours) to fix a production issue"),
                          ("After", 12, "< 12 hours", "s1", "After: under 12 hours")],
                         120, "Mean time to resolve a production issue fell from about 4 days to under 12 hours.", label_w=80, ticks=[(0, "0 h"), (48, "48 h"), (96, "96 h")]),
                  "At least 8× faster, with the 99.9% SLA held across the whole portfolio.",
                  C.table(["Measure", "Value"], [["Before", "~4 days (96 h)"], ["After", "< 12 hours"], ["SLA", "99.9%"]])),
         C.figure("A team of 35, split by job", "Core delivery and the new L1.5 support layer",
                  C.stacked([("20 delivery", 20, "s1", "20 people in core delivery: enhancements, changes, automation"), ("15 L1.5 support", 15, "s3", "15 people in the L1.5 support layer, handling tickets account-wide")], 35,
                            "The 35-person team: 20 in core delivery and 15 in the L1.5 support layer.", caption_total="35 people"),
                  "The L1.5 layer took repetitive work off senior engineers. It also handled tickets for about 800 applications account-wide.",
                  C.table(["Group", "People"], [["Core delivery", "20"], ["L1.5 support", "15"], ["Total", "35"]]),
                  legend=[("l1", "Core delivery"), ("l3", "L1.5 support")]),
         C.figure("Staged AI rollout", "Each step needed evidence from the last",
                  C.flow([("Shadow mode", "AI watches tickets", None), ("6-hour window", "AI routes & closes", None), ("Full days", "Supervised", None), ("Production", "Never rolled back", True)],
                         "AI was introduced in four stages: shadow mode, a six-hour window, full days, then production, and was never rolled back.", minw=560),
                  "A slower path than a single switch-over, and the reason the AI stayed in production.",
                  C.table(["Stage", "What happened"], [["Shadow", "AI watched support tickets"], ["6-hour window", "AI routed and closed tickets in a limited window"], ["Full days", "Extended to full days"], ["Production", "Live; never rolled back"]]), wide=True),
     ],
     owned="The P&L, the operating-model redesign, the split of service commitments, the staged introduction of AI, incident leadership and the client relationship.",
     team="Day-to-day support, enhancements and automation across the portfolio, by a 20-person core team and a 15-person L1.5 team.",
     client="Service levels, contractual scope, and acceptance of the commercial changes.",
     results=["From a <strong>complete loss to ~15% profit within six months</strong>, then ~25%.",
              "<strong>99.9% SLA</strong> held across ~55 applications that run around the clock.",
              "Time to fix a production issue cut from <strong>4 days to under 12 hours</strong>; automation covers <strong>70–80%</strong> of the portfolio.",
              "About <strong>$200K a year</strong> of previously free work turned into billable scope; the team won several internal awards."],
     ai="AI for ticket routing and closure reached production through a staged rollout — shadow mode, a six-hour window, then full days — and was never rolled back.",
     lesson="Reduce people last. Standardise the knowledge, move work to the right level, then resize. And a single blended number is where failure hides — separate targets cost simplicity and reveal the truth.")

# 4 ─ Cooperative registry
case("cooperative-registry",
     short="Cooperative registry",
     tags="gov", tag=("gov", "Public sector"), year="2022–24",
     title="40 million members, one law changed, a paper office turned platform",
     card_title="A paper registry for 40M members, moved online",
     card_text="Everyone saw an IT upgrade. The real blocker was the law — so the Act was amended first, then the platform was built on top of it.",
     big=("40M", "cooperative members on a registry that used to run on paper"),
     minis=[("70%+", "faster processing"), ("~6 mo", "to amend the Act"), ("1,800", "societies")],
     dek="India’s national registry of multi-state cooperative societies ran almost entirely on paper. It looked like an IT upgrade — but the law didn’t recognise electronic notices or digital signatures. So we got the Act amended first, then built the platform on a lawful footing.",
     meta=[("Client", "Ministry of Cooperation", "Government of India"), ("Role", "Senior Consultant", "EY India"),
           ("Team", "Ministry team + vendor", "Vendor selected via RFP"), ("Timeline", "2022 – 2024", "Module-by-module rollout"),
           ("Scope", "~1,800 societies", "~40M members")],
     kpis=[("40M", "members on the national registry today"), ("70%+", "faster application processing: 15–20 days to about 4"),
           ("~6 mo", "to table and pass amendments to the Act"), ("1,800", "multi-state cooperative societies on the platform")],
     tldr=("A national registry ran on paper — and the governing Act gave a digital process no legal standing, however well it was built.",
           "Changed the law first, built accountability into the new workflow with automatic escalations, wrote the specification and held the vendor to it.",
           "A fully paperless registry for ~40M members with processing 70%+ faster, later extended to validate refund claims for a large cooperative-society case."),
     context=["The Central Registrar of Cooperative Societies keeps India’s record of multi-state cooperative societies: about <strong>1,800 societies</strong> and some <strong>40 million members</strong>. Almost everything ran on paper, in a physical office.",
              "Discovery showed the real blocker: the Multi-State Cooperative Societies Act recognised neither electronic notices nor non-physical signatures. A digital platform built on that foundation would have been a platform nobody could lawfully use."],
     constraints=["Statute blocked digital notices and signatures", "Paper-only legacy process", "Vendor delivery overseen from the ministry side", "Senior-level approvals for each stage", "Rollout without disrupting live registrations"],
     decisions=[("Change the law before building the software", "We proposed amendments so that electronic notices and digital signatures were valid. They were tabled and passed in about six months.", "It put the critical path through a legislative process nobody on the team controlled. A narrower build inside the old Act would have shipped sooner — and not been the process the ministry needed."),
                ("Build accountability into the new workflow", "A digitised paper process can stall as quietly as the paper one. Each officer got a defined role, and delays escalate automatically at 5, 7 and 15 days.", "The thresholds had to be tuned, because some waits are outside an officer’s control."),
                ("Write the specification, then hold the vendor to it", "I wrote the DPR and RFP, onboarded the vendor, then oversaw delivery from the ministry side — scope, deviations and escalation.", "The person judging each deviation was the person who wrote what had been asked for. That made calls faster and occasionally harder."),
                ("Roll out module by module", "Registration went first; other modules followed once each was stable.", "A longer overall timeline in exchange for never stopping the registry.")],
     charts=lambda: [
         C.figure("Time to process an application", "Paper vs platform",
                  C.hbar([("Paper, worst", 20, "20 days", "sm", "Paper process: up to 20 days"),
                          ("Paper, best", 15, "15 days", "sm", "Paper process: at best 15 days"),
                          ("Platform", 4, "~4 days", "s1", "Digital platform: about 4 days (under 100 hours)")],
                         24, "Application processing took 15 to 20 days on paper and about 4 days on the platform.", label_w=100, ticks=[(0, "0"), (10, "10 d"), (20, "20 d")]),
                  "A reduction of 70% or more, from a 15–20 day range to under 100 hours.",
                  C.table(["Process", "Time"], [["Paper", "15–20 days"], ["Digital platform", "~4 days (< 100 hours)"]])),
         C.figure("Escalation ladder", "Days an application can wait before it escalates",
                  C.milestones([(5/16, "Day 5", "first escalation", False), (7/16, "Day 7", "second escalation", False), (15/16, "Day 15", "senior escalation", True)],
                               "Automatic escalations fire at day 5, day 7 and day 15.", w=520, minw=420, ticks=[(0, "Day 0"), (0.5, "Day 8"), (1, "Day 16")]),
                  "Delay stopped being invisible: nobody has to chase, because the system does.",
                  C.table(["Day", "Escalation"], [["5", "First"], ["7", "Second"], ["15", "Senior"]])),
         C.figure("Critical path ran through the legislature", "Sequence of the programme",
                  C.flow([("Discovery", "Blocker is the Act", None), ("Amend the Act", "~6 months", True), ("Specify & tender", "DPR, RFP, vendor", None), ("Build & roll out", "Registration first", None)],
                         "Programme sequence: discovery, amending the Act over about six months, specification and tender, then build and module-by-module rollout.", minw=560),
                  "The most useful result of discovery is an honest answer to what cannot move. Here, it could — with the right case.",
                  C.table(["Stage", "Detail"], [["Discovery", "Found the statutory blocker"], ["Amend the Act", "Tabled and passed in ~6 months"], ["Specify & tender", "DPR, RFP, vendor onboarded"], ["Build & roll out", "Module by module, Registration first"]]), wide=True),
     ],
     owned="Discovery and process re-engineering, the case for amending the Act, the DPR and RFP, vendor onboarding, and ministry-side delivery oversight.",
     team="The selected vendor’s design, build and module-by-module rollout.",
     client="The decision to pursue the amendments, the legislative process, and approval of each rollout stage.",
     results=["A <strong>fully paperless national registry</strong> for ~1,800 societies and <strong>~40 million members</strong>, still growing.",
              "Application processing <strong>70%+ faster</strong> — from 15–20 days to about 4.",
              "Amendments to the Act <strong>passed in about six months</strong>, giving digital notices and signatures legal standing.",
              "The platform was later extended to <strong>validate refund claims</strong> for cooperative-society depositors."],
     ai=None,
     lesson="The best outcome of discovery is an honest answer to what cannot move. Treating the law as something to change, not work around, is what made the project possible.")

OTHER = [  # title, big, small, text, problem, did, result, tags, role
    ("G20 government-website benchmark", "150+", "parameters", "A national framework for ranking government websites, built with IIT Delhi and IIM Indore — now India’s official assessment.",
     "No objective way to compare government websites on content, security, accessibility and citizen engagement; departments being assessed didn’t report to the team.",
     "Designed a 150+ parameter framework with two top academic institutes, and checked the automated scoring against 20 human auditors before anyone relied on it.",
     "~100 sites assessed; scores tuned to within ±10% of auditors. India placed among the top five G20 economies in the benchmark, and the framework continues as the national assessment. ~$575K programme.", "gov", "Senior Consultant · EY · 2022–24"),
    ("National Portal of India v2.2", "22", "languages", "One front door to 20+ government information sources — a ~$2.6M programme.",
     "A static directory of disconnected portals. The aim: reliable information from many sources, in one place, in 22 languages.",
     "Wrote the DPR and RFP and onboarded the vendor. Treated machine translation as something to measure: human review, agreed language criteria and blind volunteer surveys.",
     "~80% of machine output accepted as translated, from an early error rate near one sentence in ten. Search and summaries planned for the next phase.", "gov ai", "Senior Consultant · EY · 2022–24"),
    ("National visa & immigration platform", "1", "platform", "Visa, e-visa and overseas-citizen services consolidated onto one national system across airports, land ports and seaports.",
     "Old, separate systems with data-sync problems, and practice that differed from port to port.",
     "Designed from watching officers and travellers work, not from the written spec. Kept separate databases in phase one, because a port has no maintenance window.",
     "One consolidated platform in staged rollout: seaport pilot, seaports live, airports piloting, land ports next.", "gov", "Senior Consultant · EY · 2022–24"),
    ("Skillchain — blockchain credentials", "~80%", "voluntary uptake", "Employee skills and certifications recorded on blockchain, taken to a unit-wide pilot at EY.",
     "Joining was voluntary, so the product had to earn its own adoption.",
     "Gathered requirements from all four user groups before building; cut the NFT marketplace to protect the core.",
     "~80% joined voluntarily. The capability lives on in EY’s skills and badges programme.", "ent", "Engineering Lead · UST Global · 2021–22"),
    ("Mainframe reconciliation automation", "£200K", "a year saved", "Automated a manual card-dispute reconciliation for a UK bank client.",
     "A manual process on an old mainframe; the real blocker was a permission nobody had set up.",
     "Got the permission fixed through the client instead of working around it, and rebuilt the pipeline rather than scripting over manual steps.",
     "~£200K a year saved (client-calculated) and 40% fewer reported defects within six months.", "ent", "IT Analyst · TCS · 2015–20"),
]


def case_card(c, r=R):
    minis = "".join(f"<span><b>{e(a)}</b> {e(b)}</span>" for a, b in c["minis"])
    tcls, tlabel = c["tag"]
    return f"""<a class="case-card reveal" href="{r}work/{c['slug']}/" data-tags="{c['tags']}">
  <div class="case-top"><span class="tag {tcls}">{e(tlabel)}</span><span class="note mono">{e(c['year'])}</span></div>
  <div class="case-body">
    <div class="case-hero-num"><b>{e(c['big'][0])}</b><span>{e(c['big'][1])}</span></div>
    <h3>{e(c['card_title'])}</h3>
    <p>{e(c['card_text'])}</p>
    <div class="mini-metrics">{minis}</div>
  </div>
  <div class="case-foot"><span>{e(c['meta'][1][1])} · {e(c['meta'][1][2])}</span><strong>Read case study <span class="arr">→</span></strong></div>
</a>"""


def other_card(o):
    title, big, small, text, prob, did, res, tags, role = o
    return f"""<article class="proj reveal" data-tags="{tags}">
  <span class="note mono">{e(role)}</span>
  <div class="big">{e(big)}<small>{e(small)}</small></div>
  <h3>{e(title)}</h3><p>{e(text)}</p>
  <details><summary>The short version</summary><dl><dt>Problem</dt><dd>{e(prob)}</dd><dt>What I did</dt><dd>{e(did)}</dd><dt>Result</dt><dd>{e(res)}</dd></dl></details>
</article>"""


# ---------------------------------------------------------------- home
def home():
    board = f"""<div class="board reveal" aria-label="Career summary">
  <div class="board-head"><span class="board-title">Career board · 2015 → today</span><span class="dots"><i></i><i></i><i></i></span></div>
  <div class="board-kpis">
    <div class="board-kpi"><b>11+</b><span>years in delivery &amp; engineering</span></div>
    <div class="board-kpi"><b>9</b><span>programmes, 4 in depth here</span></div>
    <div class="board-kpi"><b>6</b><span>organisations, 4 sectors</span></div>
  </div>
  <div class="legend">{''.join(f'<span><i class="{c}"></i>{t}</span>' for c, t in PHASE_LEGEND)}</div>
  <div class="chart">{career_gantt(w=520, minw=0, label_w=100)}</div>
</div>"""
    stats = """<div class="stats">
  <div class="stat reveal"><b>40<em>M</em></b><span class="lbl">people on a national registry</span><span class="sub">Moved from a paper office to a live platform — after getting the law changed first.</span></div>
  <div class="stat reveal"><b>30<em> days</em></b><span class="lbl">kick-off to go-live</span><span class="sub">An audited platform for a pay commission covering 7M public employees and pensioners.</span></div>
  <div class="stat reveal"><b>$6<em>M+</em></b><span class="lbl">programme value led or shaped</span><span class="sub">Public-sector and enterprise programmes combined. Approximate.</span></div>
  <div class="stat reveal"><b>99.9<em>%</em></b><span class="lbl">SLA on 24×7 systems</span><span class="sub">Held while turning a loss-making unit profitable and cutting fix times 8×.</span></div>
</div>"""
    value_chart = C.figure("Programme scale", "Approximate value in US dollars",
        C.hbar([("National Portal", 2.64, "$2.6M", "s1", "National Portal of India v2.2 — about $2.6M (₹23 crore)"),
                ("Wind portfolio", 2.0, "$2M+ / yr", "s1", "Wind-energy application portfolio — $2M+ a year contract"),
                ("Green hydrogen", 0.80, "$800K", "s1", "Green hydrogen certification portal — about $800K (₹7 crore)"),
                ("Web benchmark", 0.575, "$575K", "s1", "Government-website benchmarking framework — about $575K (₹5 crore)"),
                ("Pay Commission", 0.024, "$24K · 30 days", "s1", "Pay Commission platform — about $24K (₹21 lakh), live in about 30 days")],
               3.2, "Programme value in US dollars: National Portal about 2.6 million, wind portfolio 2 million a year, green hydrogen about 800 thousand, web benchmark about 575 thousand, Pay Commission about 24 thousand.",
               label_w=120, w=560, ticks=[(0, "$0"), (1, "$1M"), (2, "$2M"), (3, "$3M")], minw=480),
        "Converted from rupees at about ₹87 to the dollar; values are the programme or contract value, not my personal budget. The smallest one had the hardest constraint — a date set by law.",
        C.table(["Programme", "Approx. value"], [["National Portal of India", "$2.6M (₹23 crore)"], ["Wind-energy portfolio", "$2M+ a year"], ["Green hydrogen certification", "$800K (₹7 crore)"], ["Website benchmarking framework", "$575K (₹5 crore)"], ["Pay Commission platform", "$24K (₹21 lakh)"]]))
    cards = "".join(case_card(c) for c in CASES)
    body = f"""
<section class="hero"><div class="wrap hero-grid">
  <div class="hero-copy">
    <span class="status-pill"><span class="pulse"></span>Open to remote roles &amp; contract engagements</span>
    <span class="eyebrow">Technical Project &amp; Programme Manager</span>
    <h1>Complex platforms, shipped on dates that <span class="mark">can’t move</span>.</h1>
    <p class="lede">I’m Rishabh Jain. Over 11+ years I’ve gone from engineer to consultant to programme lead — launching national-scale government platforms in as little as 30 days, and turning a loss-making $2M/yr enterprise portfolio profitable in six months.</p>
    <div class="btn-row"><a class="btn btn-primary" href="{R}work/">See the case studies <span class="arr">→</span></a><a class="btn btn-ghost" href="{R}services/">How I can help</a></div>
    <div class="hero-meta mono" style="font-size:.8rem"><span>New Delhi · UTC+5:30</span><span>Remote: UK · EU · Gulf · APAC · US</span><span>CSM · Google PM certified</span></div>
  </div>
  {board}
</div>
<div class="wrap"><div class="trust"><span class="eyebrow">Delivered with</span><div class="trust-names"><span>BDO India</span><span>Infosys</span><span>EY</span><span>UST</span><span>TCS</span><span>ValueCoders</span></div></div></div>
</section>

<section style="padding-top:0"><div class="wrap">{stats}</div></section>

<section class="band"><div class="wrap">
  <div class="sec-head split"><div class="stack-lg" style="gap:14px"><span class="eyebrow">Selected work</span><h2>Four programmes, told with the numbers</h2><p class="lede">Each case study covers the constraint, the decisions and what they cost, and the measured result.</p></div>
  <a class="btn btn-ghost" href="{R}work/">All 9 projects <span class="arr">→</span></a></div>
  <div class="cases">{cards}</div>
</div></section>

<section><div class="wrap">
  <div class="charts">
    <div class="stack-lg reveal" style="align-content:center">
      <span class="eyebrow">Range</span>
      <h2>From a $24K sprint to multi-million programmes</h2>
      <p class="lede">Budget was rarely the hard part. The constraint was usually a statute, a security audit, a launch date, or four organisations that didn’t report to one another.</p>
      <ul class="results">
        <li><span><strong>Public sector:</strong> ministries, regulators and a statutory commission in India.</span></li>
        <li><span><strong>Energy:</strong> green hydrogen certification and a global wind-turbine portfolio.</span></li>
        <li><span><strong>Enterprise:</strong> banking, professional services and blockchain products.</span></li>
      </ul>
    </div>
    {value_chart}
  </div>
</div></section>

<section class="ink-band"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">How I run a programme</span><h2>Four habits behind every delivery</h2></div>
  <div class="steps">
    <div class="step reveal"><h3>Find what can’t move</h3><p>A law, a date, an audit, a budget. Plan around the fixed points first — on one programme the fixed point was an Act of Parliament.</p></div>
    <div class="step reveal"><h3>Baseline before build</h3><p>Requirements signed before sprint one, then formal change control. Scope that doesn’t drift is what makes a date credible.</p></div>
    <div class="step reveal"><h3>Run in parallel, decide in writing</h3><p>A named owner for every dependency, weekly reporting, and each trade-off written down so the client chooses knowing both sides.</p></div>
    <div class="step reveal"><h3>Measure outcomes</h3><p>Cycle time, uptime, margin, adoption. “Delivered on time” is a milestone, not a result.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sec-head"><span class="eyebrow">AI in delivery</span><h2>AI that ships — with a named human accountable</h2><p class="lede">I bring AI into products in stages, with acceptance criteria agreed before anything is built. AI advises; a person decides.</p></div>
  <div class="projects">
    <article class="proj reveal"><span class="tag ent" style="justify-self:start">In production</span><h3>Ticket routing &amp; closure</h3><p>Wind-energy portfolio. Rolled out shadow → six-hour window → full days. Never rolled back.</p></article>
    <article class="proj reveal"><span class="tag energy" style="justify-self:start">Approved · procurement</span><h3>Certification checks</h3><p>Green hydrogen Phase 2: AI to check submissions and flag unusual emissions data, every claim linked to its source document.</p></article>
    <article class="proj reveal"><span class="tag gov" style="justify-self:start">Next phase</span><h3>Duplicate &amp; evidence finder</h3><p>Pay Commission platform: AI to flag likely duplicate demands and retrieve the evidence each one cites.</p></article>
  </div>
</div></section>
{cta()}
"""
    schema = json.dumps({"@context": "https://schema.org", "@type": "Person", "name": "Rishabh Jain", "jobTitle": "Project and Programme Manager",
                         "url": SITE, "email": "mailto:" + EMAIL, "sameAs": [LINKEDIN],
                         "worksFor": {"@type": "Organization", "name": "BDO India"},
                         "knowsAbout": ["Programme management", "Digital public infrastructure", "Agile delivery", "AI product delivery", "Renewable energy IT"]})
    write("index.html", page("index.html", "Rishabh Jain · Project & Programme Manager",
                             "Technical project and programme manager with 11+ years: national-scale platforms shipped in 30 days, a $2M/yr portfolio turned profitable in six months. Open to remote roles and contract work.",
                             body, schema=schema))


# ---------------------------------------------------------------- work index
def work():
    cards = "".join(case_card(c) for c in CASES)
    others = "".join(other_card(o) for o in OTHER)
    body = f"""
<section class="cs-hero"><div class="wrap"><div class="hero-copy">
  <span class="eyebrow">Work</span>
  <h1>Nine programmes. <span class="mark">Measured</span> results.</h1>
  <p class="lede">Four in-depth case studies with charts and the decisions behind them, plus five shorter summaries. Client names are withheld where contracts require it.</p>
</div></div></section>
<section style="padding-top:0"><div class="wrap">
  <div class="filters" role="group" aria-label="Filter projects">
    <button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
    <button class="chip" type="button" data-filter="gov" aria-pressed="false">Public sector</button>
    <button class="chip" type="button" data-filter="energy" aria-pressed="false">Energy</button>
    <button class="chip" type="button" data-filter="ent" aria-pressed="false">Enterprise</button>
    <button class="chip" type="button" data-filter="ai" aria-pressed="false">AI</button>
  </div>
  <div class="sec-head" style="margin-bottom:20px"><h2 style="font-size:1.5rem">In-depth case studies</h2></div>
  <div class="cases">{cards}</div>
  <div class="sec-head" style="margin:56px 0 20px"><h2 style="font-size:1.5rem">More projects</h2></div>
  <div class="projects">{others}</div>
</div></section>
{cta()}
"""
    write("work/index.html", page("work/index.html", "Work · Rishabh Jain", "Case studies: a 30-day national platform launch, green hydrogen certification, a wind-portfolio turnaround and a 40M-member registry.", body, active="work/"))


def case_page(i, c):
    meta = "".join(f"<div><dt>{e(k)}</dt><dd>{e(v)}<small>{e(s)}</small></dd></div>" for k, v, s in c["meta"])
    tl = c["tldr"]
    ctx = "".join(f"<p>{p}</p>" for p in c["context"])
    cons = "".join(f"<span>{e(x)}</span>" for x in c["constraints"])
    decs = "".join(f'<div class="decision reveal"><h3>{e(t)}</h3><p>{e(w)}</p><div class="tradeoff"><b>Trade-off accepted</b>{e(to)}</div></div>' for t, w, to in c["decisions"])
    charts = "".join(c["charts"]())
    res = "".join(f"<li><span>{r}</span></li>" for r in c["results"])
    ai = f'<section class="cs-sec" id="ai"><span class="eyebrow">Where AI fits</span><div class="callout ai"><h3>AI with a named owner</h3><p>{e(c["ai"])}</p></div></section>' if c["ai"] else ""
    prev_c, next_c = CASES[i - 1], CASES[(i + 1) % len(CASES)]
    toc_items = [("context", "Context"), ("constraints", "Constraints"), ("decisions", "Key decisions"), ("numbers", "In numbers"), ("role", "My role"), ("results", "Results")] + ([("ai", "Where AI fits")] if c["ai"] else []) + [("lesson", "Takeaway")]
    toc = "".join(f'<a href="#{a}">{t}</a>' for a, t in toc_items)
    body = f"""
<section class="cs-hero"><div class="wrap stack-lg">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="{R}">Home</a><span>/</span><a href="{R}work/">Work</a><span>/</span><span>{e(c['short'])}</span></nav>
  <div class="hero-copy">
    <span class="eyebrow">Case study · {e(c['tag'][1])} · {e(c['year'])}</span>
    <h1 style="font-size:clamp(2.1rem,4.6vw,3.6rem)">{e(c['title'])}</h1>
    <p class="lede">{e(c['dek'])}</p>
  </div>
  <dl class="meta-grid" style="margin:8px 0 0">{meta}</dl>
  {kpi_row(c['kpis'])}
</div></section>

<section style="padding-top:0"><div class="wrap">
  <div class="tldr reveal"><div><span class="eyebrow">Problem</span><p>{e(tl[0])}</p></div><div><span class="eyebrow">Approach</span><p>{e(tl[1])}</p></div><div><span class="eyebrow">Outcome</span><p>{e(tl[2])}</p></div></div>
</div></section>

<section style="padding-top:0"><div class="wrap cs-layout">
  <nav class="toc" aria-label="On this page"><span class="eyebrow">On this page</span>{toc}</nav>
  <div class="cs-main">
    <section class="cs-sec" id="context"><span class="eyebrow">Context</span><h2>The situation</h2><div class="prose">{ctx}</div></section>
    <section class="cs-sec" id="constraints"><span class="eyebrow">Constraints</span><h2>What couldn’t move</h2><div class="constraints">{cons}</div></section>
    <section class="cs-sec" id="decisions"><span class="eyebrow">Key decisions</span><h2>The calls I made, and what each one cost</h2><div class="decisions">{decs}</div></section>
    <section class="cs-sec" id="numbers"><span class="eyebrow">In numbers</span><h2>The data</h2><div class="charts">{charts}</div></section>
    <section class="cs-sec" id="role"><span class="eyebrow">My role</span><h2>Who did what</h2><div class="roles">
      <div class="role"><h4>What I owned</h4><p>{e(c['owned'])}</p></div>
      <div class="role"><h4>What the team delivered</h4><p>{e(c['team'])}</p></div>
      <div class="role"><h4>What the client decided</h4><p>{e(c['client'])}</p></div>
    </div></section>
    <section class="cs-sec" id="results"><span class="eyebrow">Results</span><h2>What changed</h2><ul class="results">{res}</ul></section>
    {ai}
    <section class="cs-sec" id="lesson"><span class="eyebrow">Takeaway</span><div class="callout"><h3>What I carry forward</h3><p>{e(c['lesson'])}</p></div></section>
    <nav class="next-case" aria-label="More case studies">
      <a href="{R}work/{prev_c['slug']}/"><span class="note mono">← Previous</span><strong>{e(prev_c['card_title'])}</strong></a>
      <a href="{R}work/{next_c['slug']}/"><span class="note mono">Next →</span><strong>{e(next_c['card_title'])}</strong></a>
    </nav>
  </div>
</div></section>
{cta("Want this kind of delivery on your programme?")}
"""
    p = f"work/{c['slug']}/index.html"
    write(p, page(p, f"{c['short']} · Case study · Rishabh Jain", c["dek"][:300], body, active="work/"))


# ---------------------------------------------------------------- experience
JOBS = [
    ("Jan 2026 – now", "p3", "Project management", "Manager, Digital Transformation", "BDO India", "New Delhi · Client: India’s National e-Governance Division",
     ["Run two national government platforms in parallel with a team of 8.",
      "Took a <b>pay-commission platform</b> from kick-off to audited go-live in <b>~30 days</b>; ~21,000 demands now managed by ~200 officers.",
      "Took the <b>green hydrogen certification portal (~$800K)</b> from first ministry meeting to launch by the Minister on 1 July 2026.",
      "Got both through external security audits; closed 48 of 51 findings before the hydrogen audit began.",
      "Scoped the AI phase for both platforms; the hydrogen one is approved and in procurement."]),
    ("Nov 2024 – Jan 2026", "p3", "Project management", "Project Manager · Product Owner · Scrum Master", "Infosys", "Pune · Client: global wind-energy OEM",
     ["Owned a <b>$2M+/yr</b> portfolio of ~55 applications and a team of <b>35</b> (20 delivery, 15 support).",
      "Turned the unit from a <b>complete loss to ~15% profit in six months</b> (later ~25%) by fixing the operating model before headcount.",
      "Held a <b>99.9% SLA</b> on 24×7 systems and cut production-issue resolution from <b>4 days to under 12 hours</b>.",
      "Brought AI into ticket routing and closure in stages; it reached production and was never rolled back.",
      "Converted ~<b>$200K/yr</b> of free out-of-scope work into billable scope."]),
    ("Apr 2022 – Nov 2024", "p2", "Government consulting", "Senior Consultant, Government", "EY India", "New Delhi · Ministries of the Government of India",
     ["Delivered the national cooperative registry: <b>~40M members</b>, ~1,800 societies, processing <b>70%+ faster</b>.",
      "Got the governing Act amended in <b>~6 months</b> so digital notices and signatures were legally valid.",
      "Moved <b>80+ government websites</b> onto one common framework with security audits and quality certification.",
      "Built a <b>150+ parameter</b> government-website benchmark (~$575K) with IIT Delhi and IIM Indore; now the national assessment.",
      "Wrote the DPR and RFP for the <b>National Portal of India (~$2.6M)</b> and onboarded the vendor; redesigned the national visa platform."]),
    ("Jun 2021 – Apr 2022", "p1", "Engineering", "Software Engineering Lead (Blockchain Architect)", "UST Global", "Noida · Client: EY Global Delivery Services",
     ["Built <b>Skillchain</b>, a blockchain credential platform, and took it to a unit-wide pilot with <b>~80% voluntary uptake</b>."]),
    ("Jun 2020 – Jun 2021", "p1", "Engineering", "Software Development Engineer", "ValueCoders", "Noida",
     ["Built backend and blockchain systems for a crypto exchange, a document-management platform and a civil-records platform."]),
    ("Oct 2015 – May 2020", "p1", "Engineering", "IT Analyst", "Tata Consultancy Services", "Gurugram · UK banking client",
     ["Automated a card-dispute reconciliation on a bank mainframe, saving <b>~£200K a year</b> (client-calculated) and cutting defects <b>40%</b>.",
      "Built Ethereum and Hyperledger Fabric proofs of concept; two reached production."]),
]


def experience():
    jobs = "".join(f"""<article class="job reveal"><div class="job-when"><span class="mono">{e(w)}</span><span class="phase {pc}">{e(ph)}</span></div>
<div class="job-body"><h3>{e(t)}</h3><span class="org">{e(o)} · <span class="note">{e(loc)}</span></span><ul>{''.join(f'<li>{b}</li>' for b in bl)}</ul></div></article>""" for w, pc, ph, t, o, loc, bl in JOBS)
    gantt = C.figure("Career at a glance", "Six organisations, three phases",
                     career_gantt(w=760, minw=560, label_w=110),
                     "Engineering first, then government consulting, then project and programme management. Each bar is one role; hover for details.",
                     C.table(["Organisation", "Role", "Dates"], [["Tata Consultancy Services", "IT Analyst", "Oct 2015 – May 2020"], ["ValueCoders", "SDE", "Jun 2020 – Jun 2021"], ["UST Global", "Software Engineering Lead", "Jun 2021 – Apr 2022"], ["EY India", "Senior Consultant, Government", "Apr 2022 – Nov 2024"], ["Infosys", "Project Manager", "Nov 2024 – Jan 2026"], ["BDO India", "Manager, Digital Transformation", "Jan 2026 – present"]]),
                     legend=PHASE_LEGEND, wide=True)
    skills = [("Delivery", ["Agile / Scrum", "Hybrid & waterfall", "Change control", "Vendor & RFP management", "Risk & dependency tracking", "P&L ownership"]),
              ("Tools", ["Jira", "Confluence", "MS Project", "Figma", "GitHub", "GitHub Actions"]),
              ("Technical depth", ["MERN / React / Node.js", "TypeScript", "MongoDB", "PostgreSQL", "REST APIs", "AWS"]),
              ("Security & quality", ["VAPT", "SAST", "WCAG 2.1 AA", "UAT frameworks", "Release governance"]),
              ("AI delivery", ["Human-in-the-loop design", "Staged rollout", "Acceptance criteria for AI", "LLM-assisted delivery"]),
              ("Blockchain", ["Hyperledger Fabric", "Ethereum", "Quorum", "Smart contracts"])]
    sk = "".join(f'<div class="skill reveal"><h4>{e(t)}</h4><div class="pills">{"".join(f"<span>{e(x)}</span>" for x in xs)}</div></div>' for t, xs in skills)
    body = f"""
<section class="cs-hero"><div class="wrap stack-lg"><div class="hero-copy">
  <span class="eyebrow">Experience</span>
  <h1>Engineer, then consultant, now <span class="mark">programme lead</span>.</h1>
  <p class="lede">11+ years across six organisations and four sectors. The engineering years are why I can read an architecture diagram and challenge an estimate; the consulting years are why I can get a ministry, a vendor and an auditor moving the same way.</p>
  <div class="btn-row"><a class="btn btn-primary" href="{R}{RESUME}">Download résumé (PDF) <span class="arr">↓</span></a><a class="btn btn-ghost" href="{LINKEDIN}" rel="noopener">LinkedIn</a></div>
</div>
  <div class="charts">{gantt}</div>
</div></section>
<section style="padding-top:0"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Roles</span><h2>Where I’ve worked</h2></div>
  <div class="timeline">{jobs}</div>
</div></section>
<section class="band"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Toolkit</span><h2>What I work with</h2></div>
  <div class="skills">{sk}</div>
</div></section>
<section><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Credentials</span><h2>Education &amp; certification</h2></div>
  <div class="projects">
    <article class="proj"><span class="note mono">Certification</span><h3>Certified ScrumMaster (CSM)</h3><p>Scrum Alliance</p></article>
    <article class="proj"><span class="note mono">Certification</span><h3>Google Project Management Certificate</h3><p>Google</p></article>
    <article class="proj"><span class="note mono">Postgraduate</span><h3>PGDM, Post Graduate Diploma in Management</h3><p>IMT CDL, Ghaziabad</p></article>
    <article class="proj"><span class="note mono">Undergraduate</span><h3>B.Tech, Computer Science</h3><p>UPTU, Lucknow</p></article>
  </div>
</div></section>
{cta()}
"""
    write("experience/index.html", page("experience/index.html", "Experience · Rishabh Jain", "11+ years: engineering at TCS, ValueCoders and UST; government consulting at EY; project management at Infosys and BDO India.", body, active="experience/"))


# ---------------------------------------------------------------- services
def tz_chart():
    # Availability 09:00–21:00 IST (UTC+5:30) = 03:30–15:30 UTC. Business day 09:00–18:00 local, standard time.
    cities = [("Dubai", 4), ("Singapore", 8), ("Berlin / Paris", 1), ("London", 0), ("Sydney", 10), ("New York", -5)]
    a0, a1 = 3.5, 15.5
    rows = []
    for name, off in cities:
        b0, b1 = 9 - off, 18 - off
        ov = max(0, min(a1, b1) - max(a0, b0))
        rows.append((name, ov, f"{ov:g} h", "s1" if ov >= 6 else "s3" if ov >= 3 else "sm",
                     f"{name}: about {ov:g} hours of overlap with a 09:00–18:00 local day (standard time)"))
    svg = C.hbar(rows, 10, "Hours of overlap between my 09:00 to 21:00 IST availability and a 09:00 to 18:00 local working day: " + ", ".join(f"{r[0]} {r[2]}" for r in rows) + ".",
                 label_w=120, w=560, ticks=[(0, "0"), (3, "3 h"), (6, "6 h"), (9, "9 h")], minw=420)
    return C.figure("Working-hours overlap", "My availability 09:00–21:00 IST vs a 09:00–18:00 local day",
                    svg, "Standard time; daylight saving shifts most of these by an hour. US East Coast mornings can be covered by arrangement for scheduled ceremonies.",
                    C.table(["City", "Overlap"], [[r[0], r[2]] for r in rows]),
                    legend=[("l1", "6 h or more"), ("l3", "3–6 h"), ("lm", "Under 3 h")])


def services():
    offers = [
        ("01", "Fixed-date launch lead", "You have a platform that must go live by a date that won’t move — a regulation, a contract, a launch event.",
         ["Baseline scope fast and lock change control", "Re-plan into parallel streams where the date demands it", "Run security, UAT and go-live readiness as one plan", "Weekly status your sponsors can read in two minutes"],
         "pay-commission-platform", "Pay Commission platform, live in 30 days"),
        ("02", "Portfolio & support turnaround", "An application portfolio or managed service that is losing money, missing SLAs or burning out its senior people.",
         ["Diagnose margin, SLA and knowledge risk in the first weeks", "Standardise, shift work left, then right-size", "Split blended SLAs so problems become visible", "Turn unbilled scope into contracted work"],
         "wind-portfolio-turnaround", "−100% to +25% margin, 99.9% SLA"),
        ("03", "Discovery, scoping & vendor oversight", "A new programme that needs to be defined, specified, tendered and then held to what was promised.",
         ["Process discovery that finds the real blocker", "Requirements, DPR/RFP and vendor evaluation", "Client-side delivery oversight and deviation control", "Module-by-module rollout plans"],
         "cooperative-registry", "40M-member registry, law amended first"),
        ("04", "AI feature delivery", "You want AI in a live product, but need it accepted by the people who carry the risk.",
         ["Pick use cases where AI advises and a person decides", "Acceptance criteria and test sets agreed up front", "Staged rollout: shadow → limited window → full", "Traceability from every AI claim to its source"],
         "green-hydrogen-certification", "Green hydrogen Phase 2 AI, approved"),
    ]
    off = "".join(f"""<article class="offer reveal"><span class="num">{n}</span><h3>{e(t)}</h3><p>{e(d)}</p><ul>{''.join(f'<li>{e(b)}</li>' for b in bl)}</ul>
<div class="proof">Proof: <a href="{R}work/{slug}/">{e(pl)} →</a></div></article>""" for n, t, d, bl, slug, pl in offers)
    faq = [("Are you available full-time or freelance?", "Both. I’m open to full-time remote roles with international teams, and to selected contract, fractional or fixed-scope engagements where the scope and timeline are clear."),
           ("Which time zones can you cover?", "I’m in New Delhi (UTC+5:30). I overlap a full business day with the Gulf, most of the day with Europe, the UK and Singapore, and can cover US East Coast mornings by arrangement."),
           ("What size of programme fits best?", "Anything from a 30-day launch to multi-million, multi-vendor programmes. I’ve led teams of 8 to 35 and coordinated work across ministries, vendors, cloud providers and auditors."),
           ("Can you work inside our tools and process?", "Yes — Jira, Confluence, MS Project, Azure DevOps-style boards, Scrum, Kanban or a hybrid. I adapt to your governance rather than imposing mine."),
           ("How do you handle confidentiality?", "Happy to sign an NDA before any detailed discussion. You’ll notice client names are withheld on this site where contracts require it."),
           ("How do we start?", "Send a short note with the goal, the date and what’s blocking it. I’ll reply within two working days with questions or a suggested first call.")]
    fq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in faq)
    body = f"""
<section class="cs-hero"><div class="wrap"><div class="hero-copy">
  <span class="eyebrow">Services</span>
  <h1>Bring me in when the stakes are <span class="mark">high</span> and the date is fixed.</h1>
  <p class="lede">Full-time remote, contract or fractional. Four ways I typically help — each backed by a case study you can check.</p>
  <div class="btn-row"><a class="btn btn-primary" href="{R}contact/">Discuss an engagement <span class="arr">→</span></a></div>
</div></div></section>
<section style="padding-top:0"><div class="wrap"><div class="offers">{off}</div></div></section>
<section class="ink-band"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">How an engagement runs</span><h2>From first call to measurable result</h2></div>
  <div class="steps">
    <div class="step reveal"><h3>Intro call</h3><p>30 minutes on the goal, the fixed constraints and what’s blocking progress.</p></div>
    <div class="step reveal"><h3>Diagnostic</h3><p>A short, time-boxed review: scope, plan, risks, team and stakeholders. You get a written read-out.</p></div>
    <div class="step reveal"><h3>Plan &amp; baseline</h3><p>Milestones, owners, change control and the reporting rhythm agreed with your sponsors.</p></div>
    <div class="step reveal"><h3>Deliver &amp; measure</h3><p>Weekly status, decisions in writing, and outcomes tracked against the numbers we agreed.</p></div>
  </div>
</div></section>
<section><div class="wrap charts">
  <div class="stack-lg reveal" style="align-content:center"><span class="eyebrow">Working across time zones</span><h2>Built for distributed teams</h2>
    <p class="lede">I’ve coordinated delivery for a global OEM from India and run programmes across four organisations at once. Async-first, with written decisions and a fixed reporting rhythm.</p></div>
  {tz_chart()}
</div></section>
<section class="band"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">FAQ</span><h2>Common questions</h2></div>
  <div class="faq">{fq}</div>
</div></section>
{cta()}
"""
    write("services/index.html", page("services/index.html", "Services · Rishabh Jain", "Fixed-date launches, portfolio turnarounds, discovery and vendor oversight, and AI feature delivery. Remote, contract or full-time.", body, active="services/"))


# ---------------------------------------------------------------- about
def about():
    body = f"""
<section class="cs-hero"><div class="wrap about-grid">
  <div class="hero-copy">
    <span class="eyebrow">About</span>
    <h1>I make large, messy programmes <span class="mark">land</span>.</h1>
    <div class="prose">
      <p>I started as an engineer — automating mainframe processes for a UK bank, then building blockchain systems that reached production. That gave me something many project managers don’t have: I can read the architecture, question an estimate and talk to engineers in their language.</p>
      <p>At EY I moved into government consulting, working with senior officials on national platforms. I learned that the hardest blockers are rarely technical. On one programme, the blocker was an Act of Parliament — so we changed it.</p>
      <p>For the last few years I’ve run whole programmes end to end: a <strong>$2M+/yr</strong> enterprise portfolio for a global wind-energy company, and now two national platforms for India’s e-governance division — one launched by a Minister, one built in about a month against a deadline fixed by law.</p>
      <p>I’m now looking to bring that to international teams — as a full-time remote programme lead or on focused contract engagements.</p>
    </div>
  </div>
  <dl class="fact-card reveal">
    <div><dt>Based in</dt><dd>New Delhi, India · UTC+5:30</dd></div>
    <div><dt>Works</dt><dd>Remote worldwide; open to relocation</dd></div>
    <div><dt>Experience</dt><dd>11+ years · 6 organisations</dd></div>
    <div><dt>Sectors</dt><dd>Public sector, energy, banking, professional services</dd></div>
    <div><dt>Team size</dt><dd>Led teams of 8 to 35</dd></div>
    <div><dt>Certified</dt><dd>Certified ScrumMaster · Google Project Management</dd></div>
    <div><dt>Languages</dt><dd>English, Hindi</dd></div>
  </dl>
</div></section>
<section class="band"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Principles</span><h2>What you can expect working with me</h2></div>
  <div class="principles">
    <div class="principle reveal"><h3>Constraints first</h3><p>I find what can’t move — a law, a date, an audit, a budget — and plan around it before anything else.</p></div>
    <div class="principle reveal"><h3>Trade-offs in writing</h3><p>Every decision has a cost. I name it, so sponsors decide knowing both sides, and nobody is surprised later.</p></div>
    <div class="principle reveal"><h3>Alignment without authority</h3><p>Ministries, vendors, cloud teams and auditors rarely report to the PM. Written decisions and named owners keep them moving together.</p></div>
    <div class="principle reveal"><h3>Outcomes over outputs</h3><p>Processing time, uptime, margin and adoption — not “delivered on time” — are how I judge a programme.</p></div>
  </div>
</div></section>
<section><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Domains</span><h2>Where I’ve delivered</h2></div>
  <div class="pills" style="gap:10px">{''.join(f'<span style="font-size:.95rem;padding:9px 14px">{x}</span>' for x in ["Digital public infrastructure", "Regulatory & certification platforms", "Renewable energy", "Wind-turbine operations IT", "Pay & pensions", "Cooperatives & registries", "Visa & immigration", "Banking operations", "Blockchain credentials", "AI-assisted workflows"])}</div>
</div></section>
{cta()}
"""
    write("about/index.html", page("about/index.html", "About · Rishabh Jain", "Engineer turned consultant turned programme lead. Based in New Delhi, working remotely with international teams.", body, active="about/"))


# ---------------------------------------------------------------- contact
def contact():
    body = f"""
<section class="cs-hero"><div class="wrap"><div class="hero-copy">
  <span class="eyebrow">Contact</span>
  <h1>Let’s talk about your <span class="mark">programme</span>.</h1>
  <p class="lede">Email is quickest. Tell me the goal, the date and what’s in the way — I reply within two working days.</p>
</div></div></section>
<section style="padding-top:0"><div class="wrap contact-grid">
  <div class="contact-card reveal">
    <div class="contact-line"><span class="eyebrow">Email</span><div class="row"><span class="val" id="em">{EMAIL}</span><button class="btn btn-ghost btn-sm" type="button" data-copy="{EMAIL}" data-copy-target="#em">Copy</button></div></div>
    <div class="contact-line"><span class="eyebrow">LinkedIn</span><div class="row"><span class="val">in/notrishabhjain</span><a class="btn btn-ghost btn-sm" href="{LINKEDIN}" rel="noopener">Open <span class="arr">↗</span></a></div></div>
    <div class="contact-line"><span class="eyebrow">Résumé</span><div class="row"><span class="val">One-page PDF</span><a class="btn btn-primary btn-sm" href="{R}{RESUME}">Download <span class="arr">↓</span></a></div></div>
  </div>
  <div class="contact-card reveal">
    <span class="eyebrow">A useful first message includes</span>
    <ul class="results">
      <li><span><strong>The outcome</strong> you need, and how you’ll measure it.</span></li>
      <li><span><strong>The fixed point</strong> — a date, regulation, budget or audit.</span></li>
      <li><span><strong>The shape of the team</strong>: in-house, vendors, time zones.</span></li>
      <li><span><strong>The engagement</strong> you have in mind: full-time, contract or fractional.</span></li>
    </ul>
    <p class="note">New Delhi, UTC+5:30 · overlap with Europe, the UK, the Gulf and APAC business hours; US mornings by arrangement.</p>
  </div>
</div></section>
"""
    write("contact/index.html", page("contact/index.html", "Contact · Rishabh Jain", "Reach Rishabh Jain for remote programme-management roles and contract engagements.", body, active="contact/"))


# ---------------------------------------------------------------- misc
def extras():
    urls = ["", "work/", "experience/", "services/", "about/", "contact/"] + [f"work/{c['slug']}/" for c in CASES]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{SITE}/{u}</loc></url>\n" for u in urls) + "</urlset>\n"
    with open(os.path.join(ROOT, "sitemap.xml"), "w") as f:
        f.write(sm)
    with open(os.path.join(ROOT, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
    nf = page("404.html", "Page not found · Rishabh Jain", "Page not found.",
              f'<section class="cs-hero"><div class="wrap"><div class="hero-copy"><span class="eyebrow">404</span><h1>This page has <span class="mark">moved</span>.</h1><p class="lede">Try the case studies or the home page.</p><div class="btn-row"><a class="btn btn-primary" href="{R}work/">See the work <span class="arr">→</span></a><a class="btn btn-ghost" href="{R}">Home</a></div></div></div></section>')
    # 404 is served from any depth, so it needs absolute paths
    nf = nf.replace('href="assets', 'href="/assets').replace('src="assets', 'src="/assets').replace('href="favicon', 'href="/favicon').replace('href="work/', 'href="/work/').replace('href="./"', 'href="/"').replace('href=""', 'href="/"')
    for p in ["experience/", "services/", "about/", "contact/", "files/"]:
        nf = nf.replace(f'href="{p}', f'href="/{p}')
    with open(os.path.join(ROOT, "404.html"), "w") as f:
        f.write(nf)


if __name__ == "__main__":
    home(); work()
    for i, c in enumerate(CASES):
        case_page(i, c)
    experience(); services(); about(); contact(); extras()
    print("built", len(CASES) + 7, "pages")
