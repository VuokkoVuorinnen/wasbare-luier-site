# Wasbare luiers op rails (België) — Websitedocumentatie

Statische, single-page website voor de Belgische vrijwilligersgroep **"Wasbare luiers op rails"**.
Gebouwd met plain HTML + CSS + vanilla JS — geen frameworks, geen build-stap.

---

## Inhoudsopgave

1. [Projectstructuur](#projectstructuur)
2. [Pakketten bewerken (`packs.json`)](#pakketten-bewerken-packsjson)
3. [Status snel bijwerken](#status-snel-bijwerken)
4. [Formulier instellen](#formulier-instellen)
   - [Optie A: Netlify Forms (aanbevolen)](#optie-a--netlify-forms-aanbevolen)
   - [Optie B: Formspree (alternatief)](#optie-b--formspree-alternatief)
5. [Deployen op GitHub Pages](#deployen-op-github-pages)
6. [Deployen op Netlify](#deployen-op-netlify)
7. [Lokaal testen](#lokaal-testen)
8. [Optioneel: Google Sheet als beschikbaarheidsoverzicht](#optioneel-google-sheet-als-beschikbaarheidsoverzicht)

---

## Projectstructuur

```
wasbare-luier-site/
├── index.html    ← volledige pagina (één bestand)
├── styles.css    ← alle stijlen (mobile-first)
├── script.js     ← filtering, FAQ-accordion, formulierverwerking
├── packs.json    ← pakketdata (enige bestand dat je regelmatig aanpast)
└── README.md     ← dit bestand
```

---

## Pakketten bewerken (`packs.json`)

Alle pakketinformatie staat in **`packs.json`** — een JSON-array van objecten.
Open het bestand in een gewone teksteditor (Notepad, VS Code, …).

### Veldbeschrijving

| Veld          | Type              | Verplicht | Beschrijving |
|---------------|-------------------|-----------|--------------|
| `id`          | getal             | ja        | Uniek ID — verhoog met 1 bij elk nieuw pakket |
| `name`        | tekst             | ja        | Naam op de pakketkaart |
| `category`    | tekst (enum)      | ja        | Zie categorieën hieronder |
| `description` | tekst             | ja        | Korte beschrijving (1–2 zinnen) |
| `includes`    | array van teksten | ja        | Lijst van items in het pakket |
| `sizeRange`   | tekst             | ja        | Gewichts-/maatindicatie, bv. `"≈ 3 – 16 kg"` |
| `status`      | tekst (enum)      | ja        | `"available"`, `"out"` of `"maintenance"` |
| `notes`       | tekst of `null`   | nee       | Optionele extra opmerking onderaan de kaart |

### Geldige categoriewaarden

| Waarde      | Label op de site            |
|-------------|-----------------------------|
| `newborn`   | Pasgeboren                  |
| `onesize`   | Universeel (onesize)        |
| `older`     | Oudere kinderen / nacht     |
| `potty`     | Zindelijkheidstraining      |
| `mix`       | Mix / overig                |

### Geldige statuswaarden

| Waarde        | Badge (kleur)               |
|---------------|-----------------------------|
| `available`   | Beschikbaar (groen)         |
| `out`         | Uitgeleend (geel/oranje)    |
| `maintenance` | In onderhoud (grijs)        |

### Nieuw pakket toevoegen

Voeg een nieuw object toe aan het einde van de array in `packs.json`,
vóór de sluitende `]`, met een komma na het voorgaande object:

```json
[
  { ...bestaand pakket... },
  {
    "id": 13,
    "name": "Mijn Nieuw Pakket",
    "category": "onesize",
    "description": "Korte beschrijving van dit pakket.",
    "includes": ["6× pocket luier", "6× bamboe inlegger", "1× wasnetje"],
    "sizeRange": "≈ 4 – 16 kg",
    "status": "available",
    "notes": null
  }
]
```

### Pakket verwijderen

Verwijder het volledige object (van `{` tot `}`) inclusief de komma vóór of ná het object.

---

## Status snel bijwerken

Zoek het pakket op `name` of `id` in `packs.json` en pas het `status`-veld aan:

```json
"status": "out"          ← pakket is uitgeleend
"status": "available"    ← pakket is terug beschikbaar
"status": "maintenance"  ← tijdelijk niet beschikbaar
```

Commit en push daarna naar GitHub. Op Netlify of GitHub Pages is de wijziging
doorgaans binnen 1–2 minuten zichtbaar.

**Snelste workflow voor vrijwilligers zonder git-kennis:**

1. Open `packs.json` in de GitHub-webinterface (klik op het bestand → potlood-icoon).
2. Pas de status aan.
3. Klik **"Commit changes"**.
4. De site wordt automatisch herbouwd en gepubliceerd.

---

## Formulier instellen

Het formulier werkt zonder backend via een van de twee opties:

### Optie A — Netlify Forms (aanbevolen)

Netlify Forms werkt automatisch als je site op Netlify gehost wordt.
**Er is geen extra configuratie vereist** — het formulier in `index.html` heeft al:

- `data-netlify="true"` op het `<form>`-element
- `name="pakket-aanvraag"` op het `<form>`-element
- `<input type="hidden" name="form-name" value="pakket-aanvraag">`
- Een honeypot-veld voor basisspambescherming

Na de eerste deploy zie je inzendingen via:
**Netlify Dashboard → jouw site → Forms → pakket-aanvraag**

**E-mailnotificaties instellen:**
Netlify Dashboard → Forms → Form notifications → add email notification.

**Let op:** de `action="/"` in het formulier zorgt bij een niet-JS-submit voor een redirect
naar de Netlify "Form submitted"-pagina. Je kunt dit aanpassen via
Netlify Dashboard → Forms → Post-submission → Redirect to.

---

### Optie B — Formspree (alternatief, ook buiten Netlify)

1. Maak een gratis account op [formspree.io](https://formspree.io).
2. Maak een nieuw formulier aan en kopieer je endpoint-URL (bv. `https://formspree.io/f/abcdefgh`).
3. Pas in `index.html` het `<form>`-element aan — **verander alleen het `action`-attribuut**:

```html
<form
  id="aanvraag-form"
  name="pakket-aanvraag"
  method="POST"
  action="https://formspree.io/f/JOUW_ENDPOINT_ID"
  novalidate
  aria-label="Pakket aanvraagformulier"
>
```

4. Verwijder de Netlify-specifieke attributen en invoervelden (ze doen geen kwaad,
   maar zijn overbodig):
   - Verwijder `data-netlify="true"` en `netlify-honeypot="bot-field"` van `<form>`
   - Verwijder `<input type="hidden" name="form-name" value="pakket-aanvraag">`
   - Verwijder het honeypot `<p class="visually-hidden">…</p>`

Formspree stuurt inzendingen door naar het e-mailadres van je account.

---

## Deployen op GitHub Pages

> ⚠️ **Let op formulier:** GitHub Pages ondersteunt geen server-side verwerking.
> Netlify Forms werkt **niet** op GitHub Pages. Gebruik in dat geval Formspree (zie boven).

1. Maak een repository aan op [github.com](https://github.com) (of gebruik de bestaande).
2. Push alle bestanden naar de `main`-branch:

```bash
git add .
git commit -m "Initiële versie website"
git push origin main
```

3. Ga naar **Settings → Pages** in je repository.
4. Kies bij **Source**: `Deploy from a branch` → branch `main`, map `/ (root)`.
5. Klik **Save**. Na een minuutje is de site live op:
   `https://GEBRUIKERSNAAM.github.io/REPONAAM/`

---

## Deployen op Netlify

### Via de Netlify UI (eenvoudigst)

1. Ga naar [netlify.com](https://netlify.com) en log in (of maak een account aan).
2. Klik **Add new site → Import an existing project**.
3. Verbind je GitHub-account en kies de repository.
4. Build-instellingen: **laat alles leeg** — geen build-commando, geen publish-directory.
   (Dit is een volledig statische site.)
5. Klik **Deploy site**.

Netlify detecteert automatisch Netlify Forms dankzij `data-netlify="true"` in de HTML.

### Automatische deploys

Na de initiële setup triggert elke push naar `main` automatisch een nieuwe deploy.
Pas `packs.json` aan en push → de site is binnen 1–2 minuten bijgewerkt.

### Via Netlify CLI (voor gevorderden)

```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir . --prod
```

---

## Lokaal testen

Open gewoon `index.html` in een browser. De pakketten worden geladen via
een `fetch('packs.json')`-aanroep.

> **Opmerking:** Sommige browsers blokkeren `fetch` op `file://`-URLs (CORS-restrictie).
> Als de pakketten niet laden, gebruik dan een lokale HTTP-server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Open daarna `http://localhost:8080` in je browser.

Het formulier detecteert automatisch dat je lokaal draait en toont een succesmelding
zonder te proberen te versturen — ideaal voor testen.

---

## Optioneel: Google Sheet als beschikbaarheidsoverzicht

Als meerdere vrijwilligers de status willen bijwerken zonder git-kennis,
zijn er twee opties:

### Optie 1 — Alleen-lezen iframe (eenvoudig)

1. Open je Google Sheet.
2. Ga naar **Bestand → Delen → Publiceren op het web**.
3. Kies **Heel document** → **Webpagina** → klik **Publiceren**.
4. Kopieer de insluit-URL (onder "Insluiten").
5. Voeg het iframe toe in `index.html`, bv. in de `#pakketten`-sectie:

```html
<!-- Vervang src door jouw gepubliceerde Google Sheet URL -->
<div style="margin-top: 2rem; border-radius: 0.5rem; overflow: hidden; border: 1px solid #d4d9d5;">
  <iframe
    src="https://docs.google.com/spreadsheets/d/JOUW_SHEET_ID/pubhtml?widget=true&amp;headers=false"
    width="100%"
    height="420"
    frameborder="0"
    title="Beschikbaarheid pakketten (live Google Sheet)"
  ></iframe>
</div>
```

De site toont dan een live-tabel direct vanuit Google Sheets.
Opmaak is beperkt maar werkt goed voor een eenvoudig statusoverzicht.

### Optie 2 — `packs.json` genereren vanuit Google Sheets (gevorderd)

Gebruik een tool zoals [SheetDB](https://sheetdb.io) of [Sheety](https://sheety.co) om je
Google Sheet als JSON-API te ontsluiten. Pas dan in `script.js` de `fetch`-URL aan:

```js
// In de loadPacks()-functie in script.js, verander:
const res = await fetch('packs.json');
// naar:
const res = await fetch('https://sheetdb.io/api/v1/JOUW_API_ID');
```

De JSON-structuur moet overeenkomen met de velden in `packs.json`
(id, name, category, description, includes, sizeRange, status, notes).

> **Aanbeveling voor kleine groepen:** Het bewerken van `packs.json` via de
> GitHub-webinterface is de eenvoudigste, meest betrouwbare aanpak.
> Google Sheets is handig als meerdere beheerders regelmatig de status
> willen wijzigen zonder enige git-kennis.

---

*Vrijwilligersproject — vragen? Stel ze via de Facebook-groep of het aanvraagformulier.*
