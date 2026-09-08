# notrishabhjain.github.io

Personal portfolio for Rishabh Jain — Project Manager.

## What this is

**One file: `index.html`.** Vanilla HTML, CSS and JavaScript. No build step, no
dependencies, no `node_modules`. The only external request is a Google Fonts
stylesheet for Inter.

To work on it, open `index.html` in a browser. That is the whole loop.

## Editing content

All copy lives in JavaScript arrays near the top of the `<script>` block:

| Array | Section |
|---|---|
| `work` | Six role cards |
| `projects` | Nine collapsible case studies |
| `education`, `certifications`, `skills` | The card grids |
| `navItems` | The floating nav |

The markup renders itself from those arrays, so adding a role or a project means
adding an object — not touching HTML. The `about` paragraph and the header sit
directly in the markup.

Highlight strings accept inline `<b>` for emphasis. Per the content rules: put
the emphasis on the number, not the verb.

## Deployment

Pushing to `master` publishes the repository to GitHub Pages via
`.github/workflows/deploy.yml`. The workflow does not build anything — it uploads
the repo and deploys it.

Because Pages is set to the "GitHub Actions" source, that workflow is what serves
the site. If you ever switch Pages to "Deploy from a branch", the same
`index.html` at the repository root will serve correctly too.

## Other files

- `files/` — resume downloads, kept at a stable path so older links still resolve
- `favicon.png`, `robots.txt`
