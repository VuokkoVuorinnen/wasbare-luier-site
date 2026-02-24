/* =============================================================
   WASBARE LUIERS OP RAILS — script.js
   No framework dependencies. Modules: pack rendering + filtering,
   FAQ accordion, form submission (Netlify AJAX / Formspree).
   ============================================================= */

'use strict';

// ── Utility: escape HTML to prevent XSS in dynamic content ──────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Category & status display maps ──────────────────────────────
const CATEGORY_LABELS = {
  newborn: 'Pasgeboren',
  onesize: 'Universeel (onesize)',
  older:   'Oudere kinderen / nacht',
  potty:   'Zindelijkheidstraining',
  mix:     'Mix / overig',
};
const STATUS_LABELS = {
  available:   'Beschikbaar',
  out:         'Uitgeleend',
  maintenance: 'In onderhoud',
};
const STATUS_CLASSES = {
  available:   'status-available',
  out:         'status-out',
  maintenance: 'status-maintenance',
};

// ============================================================
// PACK RENDERING
// ============================================================
let allPacks = [];

async function loadPacks() {
  const grid      = document.getElementById('pack-grid');
  const noResults = document.getElementById('no-results');
  if (!grid) return;

  try {
    const res = await fetch('packs.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allPacks = await res.json();
  } catch (err) {
    grid.innerHTML =
      '<p class="pack-loading">Kon pakketten niet laden. Ververs de pagina of probeer het later opnieuw.</p>';
    console.error('packs.json laden mislukt:', err);
    return;
  }

  renderPacks(allPacks);
  initFilters(noResults);
}

function renderPacks(packs) {
  const grid = document.getElementById('pack-grid');
  if (!grid) return;

  if (packs.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = packs.map(pack => {
    const statusLabel = esc(STATUS_LABELS[pack.status] ?? pack.status);
    const statusClass = STATUS_CLASSES[pack.status] ?? '';
    const catLabel    = esc(CATEGORY_LABELS[pack.category] ?? pack.category);
    const tags        = (pack.includes ?? [])
      .map(item => `<li>${esc(item)}</li>`)
      .join('');

    return `
      <article class="pack-card" data-id="${esc(String(pack.id))}">
        <div class="pack-header">
          <span class="pack-name">${esc(pack.name)}</span>
          <span class="pack-status ${statusClass}" aria-label="Status: ${statusLabel}">
            ${statusLabel}
          </span>
        </div>

        <div>
          <span class="pack-cat-badge">${catLabel}</span>
        </div>

        <p class="pack-description">${esc(pack.description)}</p>

        <div>
          <p class="pack-includes-label">Inhoud</p>
          <ul class="pack-tags">${tags}</ul>
        </div>

        <div class="pack-meta">
          <div class="pack-size-range">${esc(pack.sizeRange ?? '—')}</div>
          ${pack.notes ? `<p class="pack-notes">${esc(pack.notes)}</p>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

function initFilters(noResultsEl) {
  const categorySelect = document.getElementById('category-filter');
  const searchInput    = document.getElementById('pack-search');
  if (!categorySelect || !searchInput) return;

  function applyFilters() {
    const cat    = categorySelect.value.trim();
    const query  = searchInput.value.trim().toLowerCase();

    const filtered = allPacks.filter(pack => {
      const matchesCat = !cat || pack.category === cat;
      const searchable = [
        pack.name,
        pack.description,
        ...(pack.includes ?? []),
        pack.notes ?? '',
      ].join(' ').toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      return matchesCat && matchesQuery;
    });

    renderPacks(filtered);
    if (noResultsEl) noResultsEl.hidden = filtered.length > 0;
  }

  categorySelect.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
}

// ============================================================
// FAQ ACCORDION
// ============================================================
function initFaq() {
  const buttons = document.querySelectorAll('.faq-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const answerId   = btn.getAttribute('aria-controls');
      const answer     = document.getElementById(answerId);

      // Collapse all others
      buttons.forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const id = other.getAttribute('aria-controls');
          const el = document.getElementById(id);
          if (el) el.hidden = true;
        }
      });

      // Toggle this one
      btn.setAttribute('aria-expanded', String(!isExpanded));
      if (answer) answer.hidden = isExpanded;
    });
  });
}

// ============================================================
// FORM — validation + AJAX submission
// ============================================================
function initForm() {
  const form      = document.getElementById('aanvraag-form');
  const submitBtn = document.getElementById('submit-btn');
  const submitLbl = document.getElementById('submit-label');
  const successEl = document.getElementById('form-success');
  const errorEl   = document.getElementById('form-error');

  if (!form) return;

  // ── Client-side validation helper ──
  function validateField(input) {
    const group = input.closest('.form-group');
    if (!group) return true;
    const errEl = group.querySelector('.field-error');
    const valid = input.checkValidity();

    if (valid) {
      input.classList.remove('is-invalid');
      if (errEl) errEl.hidden = true;
    } else {
      input.classList.add('is-invalid');
      if (errEl) errEl.hidden = false;
    }
    return valid;
  }

  // Validate on blur for inline feedback
  form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
  });

  // ── Submission ──
  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Validate all required fields
    const requiredFields = Array.from(form.querySelectorAll('[required]'));
    const allValid = requiredFields.map(f => validateField(f)).every(Boolean);
    if (!allValid) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Disable submit while sending
    submitBtn.disabled = true;
    if (submitLbl) submitLbl.textContent = 'Versturen…';
    if (successEl) successEl.hidden = true;
    if (errorEl)   errorEl.hidden   = true;

    try {
      await submitForm(form);
      showSuccess();
    } catch (err) {
      console.error('Form submission error:', err);
      showError();
    } finally {
      submitBtn.disabled = false;
      if (submitLbl) submitLbl.textContent = 'Verstuur aanvraag';
    }
  });

  function showSuccess() {
    if (!successEl) return;
    successEl.hidden = false;
    successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Hide the form fields so the success message is the focus
    form.querySelectorAll(
      '.form-row, .form-group, .form-actions'
    ).forEach(el => { el.style.display = 'none'; });
  }

  function showError() {
    if (!errorEl) return;
    errorEl.hidden = false;
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Submit the form data.
 *
 * - Netlify Forms:  POST to '/' with Content-Type: application/x-www-form-urlencoded
 *   The hidden input name="form-name" tells Netlify which form this is.
 *
 * - Formspree:      POST to the action URL with Content-Type: application/json
 *   (Set the <form action="https://formspree.io/f/YOUR_ID"> in HTML)
 *
 * - Local (file://):  fetch will fail; we re-throw so the caller shows success
 *   in development only by catching via the local-detection branch.
 */
async function submitForm(form) {
  const action = form.action || '/';

  // Detect Formspree by URL
  const isFormspree = action.includes('formspree.io');

  // Detect local / offline mode — can't POST anywhere, treat as success
  const isLocal =
    window.location.protocol === 'file:' ||
    ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

  if (isLocal) {
    // Simulate a small delay for realism, then succeed silently
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  if (isFormspree) {
    // Formspree: send JSON, expect JSON response
    const data = {};
    new FormData(form).forEach((val, key) => { data[key] = val; });
    const res = await fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
  } else {
    // Netlify Forms: POST url-encoded to '/' (not the action redirect URL)
    const params = new URLSearchParams(new FormData(form));
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    // Netlify returns 200 on success (or redirects — fetch follows redirects → ok)
    if (!res.ok) throw new Error(`Netlify responded ${res.status}`);
  }
}

// ============================================================
// MOBILE STICKY CTA
// ============================================================
function initMobileCta() {
  const cta  = document.getElementById('mobile-cta');
  const hero = document.querySelector('.hero');
  const link = cta ? cta.querySelector('a') : null;

  if (!cta || !hero) return;

  // Only show on narrow viewports
  function shouldShow() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  const observer = new IntersectionObserver(entries => {
    const heroVisible = entries[0].isIntersecting;
    if (shouldShow() && !heroVisible) {
      cta.hidden = false;
      cta.removeAttribute('aria-hidden');
      if (link) link.removeAttribute('tabindex');
    } else {
      cta.hidden = true;
      cta.setAttribute('aria-hidden', 'true');
      if (link) link.setAttribute('tabindex', '-1');
    }
  }, { threshold: 0 });

  observer.observe(hero);

  // Hide CTA when the user scrolls to the form section
  const formSection = document.getElementById('aanvraag');
  if (formSection) {
    const formObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        cta.hidden = true;
        cta.setAttribute('aria-hidden', 'true');
        if (link) link.setAttribute('tabindex', '-1');
      }
    }, { threshold: 0.1 });
    formObserver.observe(formSection);
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadPacks();
  initFaq();
  initForm();
  initMobileCta();
});
