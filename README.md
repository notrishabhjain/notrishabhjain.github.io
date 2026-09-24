# notrishabhjain.github.io

Personal portfolio for Rishabh Jain — Project Manager, Techno-Functional PM and
Portfolio Manager.

## What this is

**One file: `index.html`.** A single-page app in vanilla HTML, CSS and JavaScript.
No build step, no dependencies, no `node_modules`. Open `index.html` in a browser
and that is the whole development loop.

The only other assets are `assets/fonts/` (see below) and `files/` (resume
downloads). There are no third-party network requests at runtime.

## The design

An editorial "dossier" system rather than a card grid:

- **Type does the work.** Fraunces (display) against Inter Tight (text) and IBM
  Plex Mono (micro-labels), with a wide scale — 64px display against 10px
  letterspaced labels.
- **Rules, not boxes.** Structure comes from hairlines and a folio header per
  section. There is no rounded-card component anywhere.
- **One colour.** Near-black ink on warm bone paper, with a single red used
  sparingly — folio numbers, the active nav tick, stat units, hover states.
  Emphasis otherwise comes from inverting ink and paper, not from adding colour.
- **Both themes are first-class.** Every colour is a custom property redefined
  under `[data-theme="dark"]`; the theme is resolved by an inline `<head>` script
  before first paint so the page never flashes the wrong ground.

### Self-hosted fonts

`assets/fonts/` holds four `woff2` files (~148 KB total, Latin subset only),
pulled from Google Fonts and served from this repo. This is deliberate: no
third-party request, no flash of fallback type, and the site renders identically
offline. The `unicode-range` on each `@font-face` matches Google's Latin subset.

Arrows are inline SVG rather than the `→` glyph, which is outside that subset and
would otherwise fall back to a system font mid-line.

### The no-scroll model

The page itself never scrolls: `html` and `body` are `overflow:hidden` and the app
shell is exactly one viewport tall. Each section is a stacked `.view`; navigating
swaps which one is visible rather than scrolling to it.

Two consequences worth knowing before editing:

1. **Nothing may shrink.** `.lede` and `.cnt` are column flex containers, so their
   children carry `flex-shrink:0`. Without it the browser squeezes a child that
   clips its own overflow, and its content silently disappears rather than
   overflowing visibly.
2. **Dense sections scroll internally, the page does not.** Experience and
   Selected work use a list-and-detail split; only the detail pane scrolls.
   Profile, Capabilities and Credentials scroll inside their own pane on short
   phone viewports.

Navigation: the left index rail on desktop, a bottom bar under 940px. Arrow keys
move between sections; number keys 1–7 jump directly.

## Editing content

All copy lives in the first `<script>` block, in plain arrays:

| Name | Drives |
|---|---|
| `profile` | Name, headline, location, contact links, resume path |
| `figures` | The four counted figures on the index |
| `lead`, `leadAfter`, `practice` | The Profile section |
| `work` | Six roles, each with `pts` bullets |
| `projects` | Nine engagements, each with a spec strip and `pts` |
| `capabilities` | Six capability groups |
| `education`, `certifications` | Credentials |
| `sections` | Nav labels, folio numbers, and each section's header meta |

The markup renders itself from these, so adding a role means adding an object —
not touching HTML. Strings accept inline `<b>`; put the emphasis on the number,
not the verb. Because the content is interpolated as HTML, `&` in copy must be
written `&amp;`.

## Deployment

Pushing to `master` publishes the repository to GitHub Pages via
`.github/workflows/deploy.yml`. The workflow does not build anything — it uploads
the repo and deploys it.

Because Pages is set to the "GitHub Actions" source, that workflow is what serves
the site. If Pages is ever switched to "Deploy from a branch", the same
`index.html` at the repository root serves correctly too.

## Other files

- `assets/fonts/` — self-hosted Latin woff2 subsets
- `files/` — resume downloads, kept at a stable path so older links still resolve
- `favicon.png`, `robots.txt`
