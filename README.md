# Wasbare luiers op rails (België) — Website

A static, volunteer-maintained website for a Belgian reusable diaper "try-out pack" lending group.

**Live site:** _(set your URL here after deploying)_

---

## Table of contents

1. [Project structure](#project-structure)
2. [Editing packs (`packs.json`)](#editing-packs)
3. [Updating pack status quickly](#updating-pack-status)
4. [Setting up the contact form](#setting-up-the-contact-form)
5. [Deploying to GitHub Pages](#deploying-to-github-pages)
6. [Deploying to Netlify (recommended)](#deploying-to-netlify)
7. [Optional: Google Sheets for availability](#optional-google-sheets-for-availability)
8. [Local development](#local-development)

---

## Project structure

```
wasbare-luier-site/
├── index.html      ← Single-page site (all sections)
├── styles.css      ← All CSS, mobile-first
├── script.js       ← Pack loading/filtering + form UX
├── packs.json      ← Data file: all packs + status
└── README.md       ← This file
```

Everything is static — no build step, no Node.js, no dependencies.

---

## Editing packs

Open `packs.json` in any text editor. Each pack is one object in the array:

```json
{
  "id": "pack-001",
  "name": "Pasgeboren Starter",
  "category": "Newborn",
  "description": "Short description shown on the card.",
  "includes": [
    "6x prefold maat newborn",
    "2x wasbare cover maat newborn"
  ],
  "sizeRange": "2–5 kg",
  "status": "Available",
  "notes": "Optional extra note shown in italic."
}
```

### Field reference

| Field         | Type            | Required | Description |
|---------------|-----------------|----------|-------------|
| `id`          | string          | yes      | Unique identifier, never reuse. |
| `name`        | string          | yes      | Display name on the card. |
| `category`    | string          | yes      | One of the five categories (see below). |
| `description` | string          | yes      | Short sentence describing the pack. |
| `includes`    | array of strings| yes      | List of items included. |
| `sizeRange`   | string          | yes      | Weight / clothing size range. |
| `status`      | string          | yes      | `Available`, `Out`, or `Maintenance`. |
| `notes`       | string          | no       | Optional note (italic, small). |

### Categories

Use **exactly** one of these values for `category`:

```
Newborn
Onesize
Older kids / night
Potty training
Mix / other
```

### Adding a new pack

1. Copy an existing object in `packs.json`.
2. Change `id` to a new unique value (e.g. `"pack-013"`).
3. Fill in all required fields.
4. Save, commit, and push (or deploy).

### Removing a pack

Delete the entire object (including the surrounding `{ … }` and the comma after it).
Make sure the file remains valid JSON — use a validator like [jsonlint.com](https://jsonlint.com) if unsure.

---

## Updating pack status

This is the most common volunteer task. Open `packs.json`, find the pack by name or id, and change the `status` field:

```json
"status": "Available"   ← back in stock
"status": "Out"         ← currently lent out
"status": "Maintenance" ← being cleaned/repaired
```

Save → commit → push → the site updates automatically on Netlify/GitHub Pages within seconds/minutes.

**Tip for non-technical volunteers:** the GitHub web editor lets you edit `packs.json` directly in the browser without installing anything:

1. Go to the repository on GitHub.
2. Click `packs.json`.
3. Click the pencil icon (Edit this file).
4. Find the pack, change the `status` value.
5. Scroll down → "Commit changes" → "Commit directly to `main`".

---

## Setting up the contact form

The form in `index.html` supports two static form services. Choose one:

### Option A — Netlify Forms (recommended, free tier included)

This is already configured. The form has `data-netlify="true"` and `name="aanvraag"`.

1. Deploy to Netlify (see below).
2. Netlify automatically detects the form on first deploy.
3. Go to **Netlify dashboard → Site → Forms** to see submissions.
4. Optionally enable email notifications: **Forms → Settings → Form notifications**.

No changes to `index.html` needed.

### Option B — Formspree (alternative)

1. Create a free account at [formspree.io](https://formspree.io).
2. Create a new form → copy the endpoint URL (looks like `https://formspree.io/f/abcdefgh`).
3. In `index.html`, find the `<form>` element and:
   - Replace `data-netlify="true"` → remove it entirely.
   - Remove `netlify-honeypot="bot-field"`.
   - Add `action="https://formspree.io/f/YOUR_ID"`.
   - Optionally add `method="POST"` (already present).
4. Remove the hidden Netlify inputs:
   ```html
   <!-- remove these two lines: -->
   <input type="hidden" name="form-name" value="aanvraag" />
   <p style="display:none">…bot-field…</p>
   ```
5. Submissions appear in your Formspree dashboard and are emailed to you.

---

## Deploying to GitHub Pages

1. Push the repository to GitHub (public or private with Pages enabled).
2. Go to **Settings → Pages**.
3. Source: **Deploy from a branch** → branch `main` → folder `/ (root)`.
4. Save. The site will be live at `https://<username>.github.io/<repo>/`.

**Note on relative paths:** All file references (`styles.css`, `script.js`, `packs.json`) are relative, so they work on both root domains and sub-paths.

**Known limitation with GitHub Pages + `packs.json`:** `fetch('packs.json')` works when the page is served over HTTP(S). It does **not** work when opening `index.html` directly from disk (`file://`) in some browsers. Use a local server for development (see below).

---

## Deploying to Netlify

Netlify is the recommended host because it supports Netlify Forms out of the box.

### Via the Netlify UI (drag & drop)

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Deploy manually**.
2. Drag the entire project folder onto the drop zone.
3. Done — the site is live instantly.

### Via continuous deployment (recommended)

1. Push the repository to GitHub / GitLab / Bitbucket.
2. In Netlify: **Add new site → Import an existing project**.
3. Connect your Git provider and select the repository.
4. Build settings: leave blank (no build command, publish directory = `/` or `.`).
5. Click **Deploy site**.

Every push to `main` will automatically redeploy the site.

---

## Optional: Google Sheets for availability

If volunteers prefer updating a Google Sheet instead of editing `packs.json`, you can embed a read-only view. This is **optional** and the default site uses `packs.json`.

### Steps

1. Create a Google Sheet with columns matching the pack fields.
2. **File → Share → Publish to web** → choose "Comma-separated values (.csv)" for the relevant sheet.
3. Copy the published CSV URL.
4. In `script.js`, replace the `fetch(PACKS_URL)` call with a fetch to that CSV URL and add a CSV parser.

### Embedding a read-only iframe (simpler alternative)

Add this snippet somewhere in `index.html` (e.g. below the packs grid):

```html
<!-- Optional: embed read-only Google Sheet -->
<!--
<iframe
  src="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pubhtml?gid=0&single=true&widget=false&headers=false"
  width="100%"
  height="400"
  style="border:1px solid #ccc; border-radius:8px;"
  title="Overzicht pakketstatus (Google Sheets)"
  loading="lazy"
></iframe>
-->
```

Replace `YOUR_SHEET_ID` with the ID from the Google Sheets URL. This approach shows the sheet as-is, without the custom card layout.

---

## Local development

Since `script.js` fetches `packs.json` via `fetch()`, you need a local HTTP server (not `file://`).

### Python (built-in, no install needed)

```bash
# Python 3
python3 -m http.server 8000
# then open http://localhost:8000
```

### Node.js (if installed)

```bash
npx serve .
# or
npx http-server .
```

### VS Code Live Server extension

Install the **Live Server** extension → right-click `index.html` → **Open with Live Server**.

---

## Colour & branding

The colour palette is defined as CSS custom properties at the top of `styles.css`:

```css
--clr-primary:    #3d7a5e;   /* forest green */
--clr-accent:     #e07b39;   /* warm orange  */
```

Change these two values to rebrand the entire site instantly.

To add a real logo, replace the inline SVG inside `.site-logo__img` in `index.html` with an `<img>` tag pointing to your logo file, and adjust the width/height of `.site-logo__img` in `styles.css`.

---

## Accessibility notes

- Skip-to-content link at the top (keyboard users).
- All form fields have associated `<label>` elements.
- Required fields marked with `aria-required="true"`.
- Pack grid uses `aria-live="polite"` so screen readers announce filter results.
- FAQ uses native `<details>`/`<summary>` — works without JS.
- Focus styles are visible (orange outline, 3px).
- Colour contrast meets WCAG AA.

---

_Vrijwilligersproject — geen commercieel oogmerk._
