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

    fetch(PACKS_URL)
      .then(res => {
        if (!res.ok) throw new Error('Kon packs.json niet laden.');
        return res.json();
      })
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
