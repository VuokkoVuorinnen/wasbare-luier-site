/**
 * Wasbare luiers op rails (België)
 * script.js — pack loading, filtering, form UX
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Pack cards                                                          */
  /* ------------------------------------------------------------------ */

  const PACKS_URL = 'packs.json';

  /*
   * ---- Google Sheets integration ----
   * To use a Google Sheet as data source instead of packs.json:
   *
   * 1. Create a Google Sheet with these exact column headers (row 1):
   *      id | name | category | description | includes | sizeRange | status | notes
   *
   * 2. In the "includes" column, separate items with a semicolon (;)
   *      Example: 6x prefold maat newborn; 2x wasbare cover; 1x wetbag klein
   *
   * 3. Valid "status" values: Available, Out, Maintenance
   *
   * 4. Valid "category" values: Newborn, Onesize, Older kids / night,
   *      Potty training, Mix / other
   *
   * 5. Publish the sheet:
   *      File → Share → Publish to web → Sheet 1 → "Comma-separated values (.csv)" → Publish
   *
   * 6. Copy the published URL and paste it below.
   *
   * The site will load data from the sheet. If the sheet is unreachable,
   * it falls back to the local packs.json automatically.
   */
  const GOOGLE_SHEET_CSV_URL = ''; // e.g. 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv'

  /** Parse a CSV string (RFC 4180) into a 2-D array of strings */
  function parseCSV(text) {
    var rows = [], i = 0, len = text.length;
    while (i < len) {
      var row = [];
      while (true) {
        var value = '';
        if (i < len && text[i] === '"') {
          i++; // opening quote
          while (i < len) {
            if (text[i] === '"') {
              if (i + 1 < len && text[i + 1] === '"') { value += '"'; i += 2; }
              else { i++; break; } // closing quote
            } else { value += text[i]; i++; }
          }
        } else {
          while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
            value += text[i]; i++;
          }
        }
        row.push(value.trim());
        if (i < len && text[i] === ',') { i++; } else { break; }
      }
      if (i < len && text[i] === '\r') i++;
      if (i < len && text[i] === '\n') i++;
      if (row.length > 1 || row[0] !== '') rows.push(row);
    }
    return rows;
  }

  /** Convert parsed CSV rows (with header row) into pack objects */
  function csvToPacks(csvText) {
    var rows = parseCSV(csvText);
    if (rows.length < 2) return [];
    var headers = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    return rows.slice(1)
      .filter(function (row) { return row.some(function (c) { return c.trim() !== ''; }); })
      .map(function (row) {
        var obj = {};
        headers.forEach(function (h, idx) { obj[h] = (row[idx] || '').trim(); });
        var includesRaw = obj.includes || '';
        return {
          id:          obj.id || '',
          name:        obj.name || '',
          category:    obj.category || '',
          description: obj.description || '',
          includes:    includesRaw ? includesRaw.split(';').map(function (s) { return s.trim(); }).filter(Boolean) : [],
          sizeRange:   obj.sizerange || obj.sizeRange || '',
          status:      obj.status || 'Available',
          notes:       obj.notes || '',
        };
      })
      .filter(function (p) { return p.id && p.name; });
  }

  /** Fetch packs from Google Sheet (CSV) or fall back to local packs.json */
  function fetchPacks() {
    if (GOOGLE_SHEET_CSV_URL) {
      return fetch(GOOGLE_SHEET_CSV_URL)
        .then(function (res) {
          if (!res.ok) throw new Error('Spreadsheet niet bereikbaar.');
          return res.text();
        })
        .then(function (csv) {
          var packs = csvToPacks(csv);
          if (packs.length === 0) throw new Error('Geen pakketten gevonden in spreadsheet.');
          return packs;
        })
        .catch(function (err) {
          console.warn('Google Sheet laden mislukt, terugvallen op packs.json:', err.message);
          return fetch(PACKS_URL).then(function (res) {
            if (!res.ok) throw new Error('Kon packs.json niet laden.');
            return res.json();
          });
        });
    }
    return fetch(PACKS_URL).then(function (res) {
      if (!res.ok) throw new Error('Kon packs.json niet laden.');
      return res.json();
    });
  }

  const statusLabel = {
    Available:   'Beschikbaar',
    Out:         'Uitgeleend',
    Maintenance: 'In onderhoud',
  };

  /** Build a single pack card element */
  function buildCard(pack) {
    const article = document.createElement('article');
    article.className = 'pack-card';
    article.dataset.category = pack.category;
    article.dataset.name     = (pack.name + ' ' + (pack.includes || []).join(' ')).toLowerCase();

    const badgeClass = 'badge badge--' + pack.status;
    const label      = statusLabel[pack.status] || pack.status;

    const includesList = (pack.includes || [])
      .map(i => `<li>${escHtml(i)}</li>`)
      .join('');

    article.innerHTML = `
      <div class="pack-card__header">
        <h3 class="pack-card__name">${escHtml(pack.name)}</h3>
        <span class="${escHtml(badgeClass)}">${escHtml(label)}</span>
      </div>
      <p class="pack-card__category">${escHtml(pack.category)}</p>
      <p class="pack-card__desc">${escHtml(pack.description)}</p>
      ${includesList ? `<ul class="pack-card__list">${includesList}</ul>` : ''}
      <div class="pack-card__meta">
        <span>Maat/gewicht: ${escHtml(pack.sizeRange || '—')}</span>
      </div>
      ${pack.notes ? `<p class="pack-card__notes">${escHtml(pack.notes)}</p>` : ''}
    `;
    return article;
  }

  /** Minimal HTML-escape to prevent XSS from JSON data */
  function escHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Render the grid with the supplied array of pack objects */
  function renderPacks(packs, container) {
    container.innerHTML = '';
    if (packs.length === 0) {
      container.innerHTML = '<p class="no-results">Geen pakketten gevonden voor deze selectie.</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    packs.forEach(pack => fragment.appendChild(buildCard(pack)));
    container.appendChild(fragment);
  }

  /** Populate the category filter <select> with unique values */
  function populateCategoryFilter(packs, select) {
    const categories = ['Alle categorieën', ...new Set(packs.map(p => p.category))];
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat === 'Alle categorieën' ? '' : cat;
      option.textContent = cat;
      select.appendChild(option);
    });
  }

  /** Main entry point for the packs section */
  function initPacks() {
    const grid         = document.getElementById('packs-grid');
    const catFilter    = document.getElementById('cat-filter');
    const searchInput  = document.getElementById('pack-search');

    if (!grid) return;

    // Show loading state
    grid.innerHTML = '<p class="no-results">Pakketten laden…</p>';

    fetchPacks()
      .then(packs => {
        populateCategoryFilter(packs, catFilter);

        function applyFilters() {
          const cat    = catFilter ? catFilter.value : '';
          const query  = searchInput ? searchInput.value.toLowerCase().trim() : '';
          const result = packs.filter(pack => {
            const matchCat   = !cat   || pack.category === cat;
            const matchQuery = !query
              || (pack.name + ' ' + (pack.includes || []).join(' ') + ' ' + pack.description)
                   .toLowerCase()
                   .includes(query);
            return matchCat && matchQuery;
          });
          renderPacks(result, grid);
        }

        if (catFilter)   catFilter.addEventListener('change', applyFilters);
        if (searchInput) searchInput.addEventListener('input',  applyFilters);

        applyFilters();
      })
      .catch(err => {
        grid.innerHTML = `<p class="no-results">Er ging iets mis bij het laden van de pakketten. (${err.message})</p>`;
        console.error(err);
      });
  }

  /* ------------------------------------------------------------------ */
  /*  Request form                                                        */
  /* ------------------------------------------------------------------ */

  function initForm() {
    const form         = document.getElementById('aanvraag-form');
    const confirmation = document.getElementById('form-confirmation');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      // Netlify / Formspree handle actual submission.
      // We intercept only to show a client-side confirmation.
      // If JS is disabled the form still submits normally.

      // Only show client-side message if not already handled by Netlify redirect
      const isNetlify = form.hasAttribute('data-netlify');

      if (isNetlify) {
        // Let Netlify handle it; we just add a brief delay and show the message
        // We do NOT prevent default so the real submission still fires.
        if (confirmation) {
          // Small delay so the browser has time to start the XHR
          setTimeout(function () {
            if (confirmation) {
              confirmation.classList.add('is-visible');
              form.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.type !== 'hidden') el.value = '';
              });
              form.querySelectorAll('input[type="checkbox"]').forEach(el => {
                el.checked = false;
              });
            }
          }, 400);
        }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Sticky mobile CTA                                                   */
  /* ------------------------------------------------------------------ */

  function initStickyCTA() {
    const cta  = document.getElementById('sticky-cta');
    const form = document.getElementById('aanvraag-form');
    if (!cta || !form) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          cta.classList.toggle('is-hidden', entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(form);
  }

  /* ------------------------------------------------------------------ */
  /*  FAQ keyboard accessibility (details/summary is native, but add     */
  /*  Enter/Space for non-native implementations just in case)           */
  /* ------------------------------------------------------------------ */

  function initFAQ() {
    document.querySelectorAll('details.faq-item summary').forEach(summary => {
      summary.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.closest('details').toggleAttribute('open');
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Smooth scroll for anchor links                                      */
  /* ------------------------------------------------------------------ */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Move focus for accessibility
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Bootstrap                                                           */
  /* ------------------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', function () {
    initPacks();
    initForm();
    initStickyCTA();
    initFAQ();
    initSmoothScroll();
  });
})();
