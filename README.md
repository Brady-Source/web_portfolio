# Brady Finnell — Portfolio (`bradys.dev`)

A five-page static portfolio for **Brady Finnell**, an AI/ML engineer transitioning
from the U.S. Marine Corps to civilian technology roles. Built with **plain HTML, CSS,
and vanilla JavaScript** — no framework, backend, database, package manager, or build step.

Open any page directly, or serve the folder with any static file server.

---

## Pages

| File             | Purpose                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `index.html`     | Hero: name, title, one specific paragraph, and buttons to Portfolio, Prompts, How to Use Gen AI, Contact, GitHub, and LinkedIn. |
| `portfolio.html` | Responsive left rail + category filter (Web / AI / Documentation), right detail panel, safe content viewers (image, PDF embed, non-editable scrollable doc summary), Code \| Demo toggle, and a demo-unavailable modal. |
| `prompts.html`   | Prompt library across seven categories with sidebar filter, cards (title, author Brady, description, copy), an on-page detail view driven by the URL hash, **Copy Prompt**, and a disabled **Fill in Prompt — coming soon** control. |
| `genai.html`     | Beginner-to-intermediate guide: Fundamentals, Personalize Your AI, Don’ts With AI, and a **Which Model Should I Use** table (placeholder rows only). |
| `contact.html`   | Name / Subject / Email / Message form with client-side validation and static-service submission. **No email address is exposed anywhere in the markup.** |

## Project structure

```
web_portfolio_build/
├── index.html  portfolio.html  prompts.html  genai.html  contact.html
├── robots.txt  sitemap.xml  LICENSE
├── assets/
│   ├── css/styles.css            # design system (extends the supplied brand tokens)
│   ├── js/
│   │   ├── site.js               # theme toggle, mobile nav, modal, shared helpers
│   │   ├── portfolio.js          # portfolio list/filter/detail + content viewers
│   │   ├── prompts.js            # prompt list/filter/copy/detail
│   │   └── contact.js            # form validation + static submit
│   ├── data/
│   │   ├── projects.json         # curated portfolio projects
│   │   ├── prompts.json          # all prompts (7 categories)
│   │   └── project-review.json   # inclusion/exclusion rationale for every considered project
│   ├── docs/
│   │   └── m2s-ai-triage-design.pdf   # public-safe artifact embedded on the portfolio page
│   ├── fonts/                    # self-hosted Satoshi (WOFF2) + license notice
│   └── img/                      # favicon.svg, og-home.svg, rts-training-curves.png
```

---

## Design

The design extends the brand tokens from the supplied `index-2.html`:

- **Typeface:** Satoshi (self-hosted, see below), with a system-font fallback stack.
- **Color:** warm light surfaces (`#f7f6f2` / `#f9f8f5`), a dark theme, and teal `#01696f`
  as the single accent. The muted text token was darkened slightly from the source
  (`#6f6d67` → `#605e57`) to clear WCAG AA on the light surfaces.
- **Layout:** the split-panel character of the wireframe — large tracked headings, a left
  navigation/filter rail, and a spacious right work area — with improved contrast and
  responsiveness.
- **Details:** pill buttons, a simplified teal/navy atmospheric gradient, and a single custom
  inline **BF / diamond** SVG brand mark (also used for the favicon and Open Graph image).

### Theme

Theme preference is stored in `localStorage` when available; if storage is denied
(e.g. private mode) it falls back to a transient, system-preference-driven theme. With no
stored preference the site follows the OS `prefers-color-scheme` live. All motion respects
`prefers-reduced-motion`.

---

## Security & headers

Each page ships a **meta-delivered Content-Security-Policy** scoped to the origins the page
actually uses:

- Most pages: `default-src 'none'` with `script-src 'self'`, `style-src 'self'`,
  `font-src 'self'`, `img-src 'self'`, `connect-src 'self'`.
- `portfolio.html` additionally allows `frame-src 'self'` so the local M2S PDF can embed.
- `contact.html` additionally allows `connect-src … https://formspree.io` and
  `form-action https://formspree.io` for the form submission.

Also set on every page: `<meta name="referrer" content="strict-origin-when-cross-origin">`.

### Other security notes

- **No third-party scripts.** All JavaScript is first-party and self-hosted.
- **No `innerHTML` for data.** All project and prompt content from JSON is rendered with
  `textContent` / DOM creation. (The only `innerHTML` use is a static, hardcoded SVG for the
  theme-toggle icon — no external data.)
- **External URL allowlist.** Links built from JSON are validated against an allowlist
  (`github.com`, `linkedin.com`) before use; anything else falls back to the demo modal.
- **SRI exception:** none required. Because Satoshi is self-hosted, there is **no external
  CSS or font origin** to protect. (If you switch to the Fontshare stylesheet instead, note
  that SRI is generally unavailable for dynamically generated font CSS — do not add false
  `integrity` values; allow `https://api.fontshare.com` and `https://cdn.fontshare.com` in
  `style-src`/`font-src` instead.)

---

## Fonts (Satoshi, self-hosted)

Satoshi is **self-hosted** in `assets/fonts/` (WOFF2, weights 400/500/700/900). Satoshi is
offered by Fontshare (Indian Type Foundry) under the ITF Free Font License, which permits
self-hosting and commercial use. See `assets/fonts/LICENSE-Satoshi.txt` for the notice and
source. Self-hosting keeps the CSP tight — no external font/style origin is needed.

To fall back to the Fontshare CDN instead, remove the `@font-face` rules at the top of
`styles.css`, add the Fontshare `<link>` back to each page’s `<head>`, and widen the CSP
`style-src`/`font-src` to include `https://api.fontshare.com` and `https://cdn.fontshare.com`.

---

## Accessibility

- WCAG **AA** contrast verified in **both** light and dark themes (axe-core: 0 violations on
  all five pages, both themes).
- Visible focus states, touch targets ≥ 44px, a skip link on every page, semantic
  `header`/`nav`/`main`/`footer`, correct heading order, descriptive `aria-label`/`alt` text.
- Keyboard-operable modal with focus trapping, focus restoration, and `Escape` to close.
- Live regions (`role="status" aria-live="polite"`) announce copy and form feedback.
- `prefers-reduced-motion` supported; responsive down to 360px with no horizontal overflow.

---


**Excluded** (see `project-review.json` for reasons): tutorial/learning repos (Asteroids,
blog, Flask_Tut, webflyx), the destination repo itself, time-sensitive LLM-analysis coursework,
plan-only and prototype-only coursework, and general-education assignments.

### Data / privacy note

OneDrive search returned **zero indexed results** when attempted, so the uploaded project
corpus was treated as the authoritative content source. Private uploaded-file URLs are **not**
hotlinked. Only public-safe artifacts were copied into `assets/docs/`
(the M2S design PDF, which is Brady’s own academic work with no personal/sensitive data).
The project files list a separate “Database Diagram.pdf” that did not resolve on disk in the
corpus, so ShopSphere is presented as a scrollable text summary rather than a fabricated
embed. **Brady’s email address is intentionally excluded from all markup**; only the approved
public GitHub and LinkedIn links appear.

---

## License

MIT — see `LICENSE`.
