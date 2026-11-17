# Tailor

A resume builder that reads a job description, works out what it values, and assembles a
tailored, ATS-ready resume from the master profile, **without generative AI**. Every sentence
is put together from wording the profile owner wrote; the app picks, orders and recombines it
by rule.

Live at `/tailor/` on the site. It is kept out of search results (`robots.txt`, `noindex`) and
is not linked from the portfolio.

Everything runs in the browser. Nothing is sent to a server. The one optional network call is
the extended skills library (below), fetched from GitHub when you switch it on.

## Using it

1. Paste a job description and press **Analyse** (or Ctrl/⌘+Enter).
2. **Job** shows the JD with every recognised skill highlighted by status:
   - green: matched (an achievement proves it)
   - amber: partial (a related skill, or only in your skills list)
   - red: a gap
   - dotted: a term the library does not know
3. **Match** shows:
   - weighted coverage
   - must-haves met
   - years asked vs. held
   - every JD skill with its evidence

   Click a skill to see where the JD asks for it and which bullets prove it. **Terms not in
   the library** lets you add new skills or aliases once, for every future JD.
4. **Resume** is the tailored draft. Hover a bullet to:
   - cycle between wordings
   - pin it
   - edit it by hand
   - remove it

   *Add a line* pulls in another achievement from that role. **Reset** undoes your changes for
   this JD.
5. **Download .docx** (recommended for applicant tracking systems), **PDF** (the browser's
   print dialog: choose *Save as PDF* and untick headers and footers), or **Copy text**.

The **ATS self-check** under the resume reads the exported .docx back the way a parser would.
It checks:

- the layout is a single column
- contact details are in the body
- the headings are standard
- the dates follow one format
- every keyword in the preview survives export
- the length

**Writing checks** flag filler words, repeated openers, keyword stuffing, and lines that come
only from the resume PDF and have not been confirmed.

Your profile edits, added skills and JD history are stored in this browser
(`localStorage`). Use **Profile → Download JSON** to keep a copy, and commit it to
`data/profile.json` to make it the default.

## How the rules work

### 1. Reading the JD (`js/jd.js`)

- **Sections.** Headings are recognised by pattern ("What you'll do", "Must have",
  "Nice to have", "About us", "Benefits"…), including inline ones ("Requirements: 8+ years…").
  Each section carries a weight: title 3.0, requirements 2.0, responsibilities 1.5,
  preferred 1.0, about 0.15, benefits 0.
- **Strength.** Cue words in the same line scale each mention:
  - "must", "required", "proven", "N+ years" → ×1.4
  - "preferred", "a plus", "familiarity" → ×0.6
  - "not required" → ×0.3
- **Skills.** Each phrase is looked up in the library three ways, longest span first:
  - exact, with plurals and inflections folded ("risk registers")
  - case-sensitive, for words that clash with English ("SAFe", "Go", "Spark", "Excel")
  - order-insensitive ("managing vendors" = "vendor management")

  UK and US spellings are folded together.
- **Lists.** "risk, issue and change management" becomes three skills.
- **Unknown terms.** Unrecognised phrases are caught from cues ("experience with X, Y and Z"),
  technical shapes ("Node.js", "C#", "S3") and capitalised names, then offered for the library.
- **Weight.** `section × strength`, with diminishing credit for repeats, scaled by category
  (soft skills count for less). After five JDs, skills that appear in almost every JD count for
  less and rare ones for more.
- **Context.** Also read: years of experience asked, the role title, public vs. private
  sector, and the verbs the JD leads with.

### 2. Matching to evidence (`js/match.js`)

Each JD skill is checked against the skills of every achievement. Those come from the
achievement's own words plus its tags. Results:

| Status | Meaning | Credit |
|---|---|---|
| matched | an achievement proves it, or proves something more specific (Scrum proves Agile) | 1.0 |
| skills list | only in your skills list, certifications or role lines | 0.6 |
| related | a sibling or related skill (asked Kanban, you have Scrum) | 0.5 |
| gap | nothing | 0, and it is never written into the resume |

### 3. Choosing bullets (`js/compose.js`)

1. **One per role.** Every role gets at least one bullet so the timeline stays unbroken.
2. **Flagships.** An achievement of strength 9 or more stays in while it is relevant at all.
3. **Fill.** The rest is filled greedily with diminishing returns: a JD skill that is already
   covered earns only a quarter of the credit, so you do not get six bullets saying "Agile".
4. **Limits.** Role caps, a total budget and minimum relevance stop it from padding. An older
   role whose work is highly relevant earns one more line.
5. **Order.** Within a role, bullets that hit the JD's top skills come first.

### 4. Building sentences (`js/realize.js`, `js/grammar.js`)

Achievements are stored as **parts**, not finished sentences, so one achievement can be
written several ways:

```json
"core": "ship|deliver :: an eight-module national system of record",
"parts": [
  "scope! :: in a four-week window #Rapid delivery",
  "scope :: with a seven-person team #Team leadership",
  "method :: run :: parallel module streams instead of sequential phases #Parallel workstreams",
  "purpose :: to meet a Pay Commission tenure that could not legally be extended"
]
```

**Shapes.** For a JD, the builder assembles candidates in up to four shapes:

| Shape | Example |
|---|---|
| your original | the `text` field as written |
| action-led | *Shipped X in four weeks by running parallel streams.* |
| result-led | *Cut MTTR from four days to under 12 hours by leading…* |
| method-led | *Ran parallel module streams, shipping X…* |

**What varies between candidates:**

- **Parts:** which optional parts are included (all of them, only the JD-relevant ones, the
  top one or two, or none).
- **Verbs:** chosen from the achievement's own list (`ship|deliver`) plus a few same-strength
  pairs in `rules.json`. "Coordinated" can never become "led"; the JD's own verbs are
  preferred and repeats are avoided.
- **Slots:** `{{external agencies|vendors}}` picks the wording the JD uses.
- **Wording swaps:** only for spelling variants ("programme" → "program"), acronym ↔
  expansion ("MTTR" → "mean time to resolution (MTTR)"), or two forms marked
  interchangeable in the library. Never inside compounds like "Agile/Scrum".
- **Sector wording:** for private-sector JDs, some government terms get an expansion
  ("the DPR" → "the detailed project report (DPR)").

**Grammar** is rule-based throughout: irregular verbs, consonant doubling, phrasal verbs
("set up"), compound verbs ("design and build"), British spelling ("modelled"), lists that
switch to semicolons when an item has a comma, and a/an agreement.

**Integrity check.** A candidate is rejected if it contains any content word that is not in
that achievement's own text, parts or facts, its verb list, or an approved swap. The app cannot
introduce a claim you did not write.

**Scoring** combines:

- the JD keywords the sentence actually contains, weighted
- a bonus when the top keyword comes early
- a bonus for using the JD's verbs
- closeness to your original
- having a number
- a length penalty
- a penalty for an opening verb already used

### 5. Summary and skills

- **Title.** Picked from the titles you approved (`titles` in the profile) to best match the
  JD title.
- **Years.** Calculated from `careerStart`.
- **Proof points.** The summary uses the short forms of the most relevant achievements, at most
  one per role.
- **Extra lines.** Up to two of your own summary lines are added when their tags match the JD.
- **Skills section.** Only evidenced skills, grouped, in the JD's wording. An acronym is
  written out once ("Project Management Office (PMO)") when the JD uses it.

## Editing the profile

`data/profile.json`, or **Profile** in the app.

| Field | Meaning |
|---|---|
| `text` | Your preferred full sentence. Always a candidate; wins when nothing else fits better. |
| `core` | `verb\|alternative :: what`. The main claim. |
| `parts` | `type :: …` strings, below. Add `!` to the type (`scope!`) to make a part always present. |
| `tags` | Skills the whole achievement proves, by name from `skills.txt`. |
| `short` | A past-tense phrase for the summary ("cut MTTR from four days to under 12 hours"). |
| `strength` | 1–10. Breaks ties; 9+ marks a flagship. |
| `exclusive` | Ids that say the same thing; never both on one resume. |
| `patterns` | Shapes allowed: `O` original, `C` action-led, `R` result-led, `M` method-led. Default `OCRM`. |
| `facts` | Extra source sentences whose words the builder may use. |
| `verify` | Marks a line as unconfirmed; the app labels it. |

Part types:

| Type | Form | Rendered |
|---|---|---|
| `scope` | literal | after the object: *in a four-week window* |
| `context` | literal | after the object, before scope: *for a UK-based BFSI client* |
| `detail` | literal | in parentheses after the object, or after a colon if nothing follows |
| `list` | literal | at the end after a colon |
| `method` | `verb :: object` | *by running …* or *, running …*; can lead the sentence |
| `then` | `verb :: object` | *, taking …* (accompanies, never "by") |
| `and` | `verb :: object` | *and held …* (a second action) |
| `result` | `verb :: object` | *, cutting …*; can lead the sentence |
| `outcome` | literal | at the end: *, the largest turnaround on the account* |
| `purpose` | literal | at the end: *to meet a fixed deadline* |
| `coda` | literal | after a semicolon: *; results went to the Cabinet Secretary* |

Verbs:

| Syntax | Meaning |
|---|---|
| `ship\|deliver` | alternatives |
| `set up` | phrasal verb |
| `design and build` | compound verb |
| `personally+diagnose` | adverb plus verb |

Tags go at the end of a part (`#Skill name`); `#-Skill` stops a word from counting as that
skill.

## The skills library

`data/skills.txt` has about 710 skills across delivery, product, commercial, leadership,
technology, cloud, data, AI, blockchain, security, compliance, Indian government digital
infrastructure, industries, certifications and role titles. One skill per line:

```
Name = swap-safe forms | match-only forms ^ Parent ~ Related
```

The header of the file explains the markers.

The optional **extended library** (Library → Turn on) adds about 30,000 names from the
open-source [SkillNER](https://github.com/AnasAito/SkillNER) project, whose list comes from
Lightcast (formerly EMSI) Open Skills. It is fetched from GitHub on demand and cached in the
browser rather than copied into this repository. Check Lightcast's terms before relying on it
commercially. Matches from it count for less than the core library.

## Development

No build step and no dependencies, like the rest of the site. ES modules need http, so serve
the repository root:

```
python3 -m http.server 8000      # then open http://localhost:8000/tailor/
node tailor/tests/run.mjs        # six sample JDs: parsing, selection, integrity, grammar
node tailor/tests/edge.mjs       # odd inputs must not crash
node tailor/tests/docx.mjs       # writes .docx files to tailor/tests/out and runs the ATS check
```

| File | Role |
|---|---|
| `js/text.js` | tokeniser, spelling normalisation, conservative stemming |
| `js/taxonomy.js` | library parser and matcher |
| `js/jd.js` | JD sections, strength, years, skills, unknown terms, weights |
| `js/match.js` | evidence matching |
| `js/realize.js` | sentence candidates, swaps, integrity check, scoring |
| `js/grammar.js` | conjugation, lists, articles |
| `js/compose.js` | bullet selection, summary, skills, checks |
| `js/docx.js` | dependency-free .docx writer and reader |
| `js/ats.js` | ATS self-check |
| `js/app.js` | the page |
| `data/rules.json` | every weight, cap and word list, editable without touching code |

## Limits

- **Recall.** Rule-based extraction only knows what is in the library. New phrasing shows up
  under *Terms not in the library* until it is added, and the library improves with use.
- **Ambiguity.** "change management" can mean organisational change or change control, and
  rules cannot always tell which the JD means.
- **Writing.** The quality of the output is bounded by the parts you write. More parts per
  achievement, and parts tagged with the skills they show, give the builder more to work with.
- **Coverage is a guide.** It does not predict shortlisting.
