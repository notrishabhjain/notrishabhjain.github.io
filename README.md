# notrishabhjain.github.io

Portfolio of Rishabh Jain, Applied AI Project Manager.

A static site: plain HTML, one stylesheet (`assets/css/site.css`), one small script
(`assets/js/site.js`) and self-hosted fonts. There are no third-party requests at runtime.
The pages were generated from a build script that is not part of this repository, so edit the
HTML directly or regenerate it. The deploy workflow publishes the whole repository as-is, so
anything committed here is publicly fetchable.

- `/work/` and `/work/<case>/`: case studies (commission case platform, clean-energy certification, wind portfolio, national registry). Client and programme names are kept generic on purpose; run `node tools/scan-confidential.mjs` before committing
- `/method/`, `/ai/`, `/notes/`, `/about/`
- `assets/share/`: share cards and one-page PDFs
- `files/`: résumé downloads
- `resume.json`: the résumé in JSON Resume format, and the single source for `/resume/` and the PDF.
  Edit it, then run `node tools/build-resume.mjs` (it refuses confidential terms and phone numbers)
- `llms.txt`: a plain summary of the site for AI assistants and agents; keep it in step with the pages
- Every public page carries schema.org structured data (Person, ProfilePage, Article and so on)
- `dossier/`: private, noindex working page
- `tailor/`: rule-based résumé tailoring tool (no AI), noindex and unlinked; see `tailor/README.md`
