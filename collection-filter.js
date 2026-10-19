(() => {
  'use strict';

  const body = document.body;
  const isTshirts = body.classList.contains('tshirts-fixed-page');
  const isDice = body.classList.contains('collection-page') && body.dataset.collection === 'dice-drp';
  if (!isTshirts && !isDice) return;

  const GREEN = '#233f32';
  const I18N = {
    en: {
      trigger: 'Filter | Sort', heading: 'Filters|Sort', style: 'Style', fit: 'Fit', size: 'Size', color: 'Color',
      tee: 'Tee', oversized: 'Oversized', white: 'White', bone: 'Bone', carbon: 'Carbon', clear: 'Remove All', apply: 'Apply',
      close: 'Close filters', tshirts: 'T-Shirts'
    },
    es: {
      trigger: 'Filtrar | Ordenar', heading: 'Filtros|Ordenar', style: 'Estilo', fit: 'Corte', size: 'Talla', color: 'Color',
      tee: 'Camiseta', oversized: 'Oversized', white: 'Blanco', bone: 'Bone', carbon: 'Carbón', clear: 'Quitar todo', apply: 'Aplicar',
      close: 'Cerrar filtros', tshirts: 'Camisetas'
    }
  };

  const lang = () => {
    let saved = '';
    try { saved = localStorage.getItem('preferredLang') || ''; } catch (_) { /* Privacy-restricted storage. */ }
    saved = String(saved || document.documentElement.lang || 'es').toLowerCase();
    return saved.startsWith('es') ? 'es' : 'en';
  };
  const t = key => I18N[lang()][key] || I18N.en[key] || key;

  const slidersIcon = `
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 4h5M11 4h5M2 9h9M15 9h1M2 14h2M8 14h8"></path>
      <circle cx="9" cy="4" r="1.5"></circle>
      <circle cx="13" cy="9" r="1.5"></circle>
      <circle cx="6" cy="14" r="1.5"></circle>
    </svg>`;

  const heading = isTshirts
    ? document.querySelector('.tshirts-page-heading')
    : document.querySelector('.dice-drp-page-heading');
  if (!heading) return;

  if (isTshirts) {
    const route = heading.querySelector('.tshirts-route-link');
    if (route) {
      route.removeAttribute('data-i18n');
      route.dataset.suCollectionTitle = 'tshirts';
    }
  }

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'su-filter-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `${slidersIcon}<span class="su-filter-trigger-label"></span><sup class="su-filter-count su-filter-trigger-count" hidden></sup>`;
  heading.appendChild(trigger);

  const overlay = document.createElement('div');
  overlay.className = 'su-filter-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <aside class="su-filter-panel" role="dialog" aria-modal="true" aria-labelledby="su-filter-heading" tabindex="-1">
      <div class="su-filter-header">
        <h2 class="su-filter-heading" id="su-filter-heading">${slidersIcon}<span class="su-filter-heading-label"></span></h2>
        <button class="su-filter-close" type="button" aria-label="Close filters"></button>
      </div>
      <div class="su-filter-scroll">
        <section class="su-filter-group" data-filter-group="style">
          <button class="su-filter-group-toggle" type="button" aria-expanded="false">
            <span class="su-filter-group-label" data-label-key="style"></span><span class="su-filter-sign" aria-hidden="true">+</span>
          </button>
          <div class="su-filter-options" hidden>
            <button class="su-filter-chip" type="button" data-filter-key="style" data-filter-value="tee"><span data-chip-label="tee"></span></button>
          </div>
        </section>
        <section class="su-filter-group" data-filter-group="fit">
          <button class="su-filter-group-toggle" type="button" aria-expanded="false">
            <span class="su-filter-group-label" data-label-key="fit"></span><span class="su-filter-sign" aria-hidden="true">+</span>
          </button>
          <div class="su-filter-options" hidden>
            <button class="su-filter-chip" type="button" data-filter-key="fit" data-filter-value="oversized"><span data-chip-label="oversized"></span></button>
          </div>
        </section>
        <section class="su-filter-group" data-filter-group="size">
          <button class="su-filter-group-toggle" type="button" aria-expanded="false">
            <span class="su-filter-group-label" data-label-key="size"></span><span class="su-filter-sign" aria-hidden="true">+</span>
          </button>
          <div class="su-filter-options" hidden>
            <button class="su-filter-chip" type="button" data-filter-key="size" data-filter-value="S">S</button>
            <button class="su-filter-chip" type="button" data-filter-key="size" data-filter-value="M">M</button>
            <button class="su-filter-chip" type="button" data-filter-key="size" data-filter-value="L">L</button>

          </div>
        </section>
        <section class="su-filter-group" data-filter-group="color">
          <button class="su-filter-group-toggle" type="button" aria-expanded="false">
            <span class="su-filter-group-label" data-label-key="color"></span><span class="su-filter-sign" aria-hidden="true">+</span>
          </button>
          <div class="su-filter-options" hidden>
            <button class="su-filter-chip" type="button" data-filter-key="color" data-filter-value="white"><span class="su-filter-color-dot" aria-hidden="true"></span><span data-chip-label="white"></span></button>
            <button class="su-filter-chip" type="button" data-filter-key="color" data-filter-value="bone"><span class="su-filter-color-dot su-filter-color-dot--bone" aria-hidden="true"></span><span data-chip-label="bone"></span></button>
            <button class="su-filter-chip" type="button" data-filter-key="color" data-filter-value="carbon"><span class="su-filter-color-dot su-filter-color-dot--carbon" aria-hidden="true"></span><span data-chip-label="carbon"></span></button>
          </div>
        </section>
      </div>
      <div class="su-filter-footer" hidden>
        <button class="su-filter-clear" type="button"></button>
        <button class="su-filter-apply" type="button"><span class="su-filter-apply-label"></span><sup class="su-filter-count su-filter-apply-count" hidden></sup></button>
      </div>
    </aside>`;
  document.body.appendChild(overlay);

  const panel = overlay.querySelector('.su-filter-panel');
  const closeBtn = overlay.querySelector('.su-filter-close');
  const footer = overlay.querySelector('.su-filter-footer');
  const clearBtn = overlay.querySelector('.su-filter-clear');
  const applyBtn = overlay.querySelector('.su-filter-apply');
  const applyLabel = overlay.querySelector('.su-filter-apply-label');
  const applyCount = overlay.querySelector('.su-filter-apply-count');
  const triggerCount = trigger.querySelector('.su-filter-trigger-count');
  const cards = [...document.querySelectorAll('.tees-product-card')];

  // Filters use the colors a product actually offers, not the default white
  // photo shown in the grid. Every design has White; Cherry Dice has Bone,
  // Chinese Chowmein has Carbon. The other designs have no alternate colors.
  const colorVariants = {
    'cherry-dice-tee': ['white', 'bone'],
    'chinese-success-tee': ['white', 'carbon'],
    'crayon-tee': ['white'],
    'sucesso-jackpot-tee': ['white']
  };
  const colorSuffix = { white: 'White', bone: 'Bone', carbon: 'Carbon' };
  const alternatePhotos = {
    bone: ['images/cherry-dice-front-bone.png', 'images/cherry-dice-back-bone.png'],
    carbon: ['images/chinese-front-carbon.png', 'images/chinese-back-carbon.png']
  };
  const cardOriginals = new WeakMap();
  cards.forEach(card => {
    if (!card.dataset.filterStyle) card.dataset.filterStyle = 'tee';
    if (!card.dataset.filterFit) card.dataset.filterFit = 'oversized';
    const slug = card.dataset.teeSlug || '';
    card.dataset.filterColors = (colorVariants[slug] || ['white']).join(' ');
    // Original (White) values are preserved to restore the existing grid exactly.
    cardOriginals.set(card, {
      name: card.dataset.teeName,
      image: card.dataset.teeImage,
      front: card.querySelector('.related-product-front')?.getAttribute('src'),
      back: card.querySelector('.related-product-back')?.getAttribute('src'),
      title: card.querySelector('.related-product-name')?.textContent,
      links: [...card.querySelectorAll('a[href]:not(.su-variant-row a)')].map(a => [a, a.getAttribute('href')])
    });
  });

  // A filtered color also shows its actual photo and commercial name. This
  // prevents a Bone/Carbon filter from displaying a misleading white product.
  function displayCardColor(card, color = 'white') {
    const original = cardOriginals.get(card);
    if (!original) return;
    if (card.dataset.suFilterShownColor === color) return;
    const slug = card.dataset.teeSlug;
    const imagePair = alternatePhotos[color];
    const name = original.name?.replace(/\s+(White|Bone|Carbon)$/i, '') + ' ' + colorSuffix[color];
    const front = imagePair?.[0] || original.front;
    const back = imagePair?.[1] || original.back;
    const frontNode = card.querySelector('.related-product-front');
    const backNode = card.querySelector('.related-product-back');
    if (frontNode && front) frontNode.setAttribute('src', front);
    if (backNode && back) backNode.setAttribute('src', back);
    if (name && original.name) {
      card.dataset.teeName = name;
      const title = card.querySelector('.related-product-name');
      if (title) title.textContent = name;
      card.querySelectorAll('.tees-size-btn').forEach(btn => {
        btn.setAttribute('aria-label', `Add ${name}, size ${btn.dataset.teeSize}, to cart`);
      });
    }
    if (front) card.dataset.teeImage = front;
    original.links.forEach(([a, href]) => {
      if (!a.isConnected || !href) return;
      const url = new URL(href, document.baseURI);
      if (color === 'white') url.searchParams.delete('color');
      else url.searchParams.set('color', color);
      a.setAttribute('href', url.href);
    });
    card.querySelectorAll('.su-variant-row a[data-su-variant]').forEach(a => {
      if (a.dataset.suVariant === color) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    card.dataset.suFilterShownColor = color;
  }

  const selected = {
    style: new Set(),
    fit: new Set(),
    size: new Set(),
    color: new Set()
  };

  let previousHtmlOverflow = '';
  let previousBodyOverflow = '';
  let previousFocus = null;
  let loaderTimer = null;
  let appliedFilterCount = 0;
  let lastVisibleCount = cards.length;

  function selectionCount() {
    return Object.values(selected).reduce((total, set) => total + set.size, 0);
  }

  function renderFilterCounts() {
    const pendingCount = selectionCount();
    if (applyCount) {
      applyCount.textContent = String(pendingCount);
      applyCount.hidden = pendingCount === 0;
    }
    if (triggerCount) {
      triggerCount.textContent = String(appliedFilterCount);
      triggerCount.hidden = appliedFilterCount === 0;
    }
  }

  function syncTranslations() {
    trigger.querySelector('.su-filter-trigger-label').textContent = t('trigger');
    trigger.setAttribute('aria-label', t('trigger'));
    overlay.querySelector('.su-filter-heading-label').textContent = t('heading');
    closeBtn.setAttribute('aria-label', t('close'));
    overlay.querySelectorAll('[data-label-key]').forEach(node => { node.textContent = t(node.dataset.labelKey); });
    overlay.querySelectorAll('[data-chip-label]').forEach(node => { node.textContent = t(node.dataset.chipLabel); });
    clearBtn.textContent = t('clear');
    if (applyLabel) applyLabel.textContent = t('apply');
    if (isTshirts) {
      const route = heading.querySelector('[data-su-collection-title="tshirts"]');
      if (route) {
        const label = route.querySelector('.su-collection-title-label');
        if (label) label.textContent = t('tshirts');
        route.setAttribute('aria-label', t('tshirts'));
      }
      heading.setAttribute('aria-label', t('tshirts'));
    }
    updateCollectionCount(lastVisibleCount);
    renderFilterCounts();
  }

  function replayCherryLoader() {
    // Use exactly the same Cherry loader lifecycle already used by the rest of the site.
    if (typeof window.__sucessoReplaySiteLoader === 'function') {
      window.__sucessoReplaySiteLoader();
      return;
    }

    // Fallback for pages where the shared helper is unavailable: same animation and timing.
    const loader = document.getElementById('loader');
    if (!loader) return;
    const img = loader.querySelector('img');
    clearTimeout(loaderTimer);
    loader.style.display = 'flex';
    loader.style.opacity = '1';
    loader.style.visibility = 'visible';
    if (img) {
      img.style.animation = 'none';
      void img.offsetWidth;
      img.style.animation = 'zoomInClean 2s ease forwards';
    }
    loaderTimer = setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      setTimeout(() => { loader.style.display = 'none'; }, 400);
    }, 2500);
  }

  function sizeAvailable(card, size) {
    const button = card.querySelector(`.tees-size-btn[data-tee-size="${CSS.escape(size)}"]`);
    if (!button) return false;
    const stock = String(button.dataset.stock ?? '').toLowerCase();
    const inStock = String(button.dataset.inStock ?? '').toLowerCase();
    const soldOutClass = button.classList.contains('sold-out') || button.classList.contains('out-of-stock');
    return !button.disabled && button.getAttribute('aria-disabled') !== 'true' && stock !== '0' && inStock !== 'false' && !soldOutClass;
  }

  function cardMatches(card) {
    if (selected.style.size && !selected.style.has(String(card.dataset.filterStyle || '').toLowerCase())) return false;
    if (selected.fit.size && !selected.fit.has(String(card.dataset.filterFit || '').toLowerCase())) return false;
    if (selected.color.size && ![...selected.color].some(color => String(card.dataset.filterColors || 'white').split(' ').includes(color))) return false;
    if (selected.size.size && ![...selected.size].some(size => sizeAvailable(card, size))) return false;
    return true;
  }

  function updateCollectionCount(visibleCount) {
    lastVisibleCount = visibleCount;
    const sup = isTshirts
      ? heading.querySelector('.tshirts-route-link sup')
      : heading.querySelector('.collection-route-title sup');
    if (!sup) return;
    sup.textContent = String(visibleCount);
    const noun = lang() === 'es'
      ? (visibleCount === 1 ? 'producto' : 'productos')
      : (visibleCount === 1 ? 'product' : 'products');
    sup.setAttribute('aria-label', `${visibleCount} ${noun}`);
  }

  function applyFilters({loader = true} = {}) {
    if (loader) replayCherryLoader();
    let visible = 0;
    cards.forEach(card => {
      const show = cardMatches(card);
      // Only matching designs remain visible. When an alternate is active,
      // its image/title/link/cart data follow that color too.
      displayCardColor(card, show ? ([...selected.color][0] || 'white') : 'white');
      card.classList.toggle('su-filter-hidden', !show);
      card.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (show) visible++;
    });
    updateCollectionCount(visible);
    footer.hidden = !hasSelections();
  }

  function hasSelections() {
    return Object.values(selected).some(set => set.size > 0);
  }

  function updateChipUI() {
    overlay.querySelectorAll('.su-filter-chip[data-filter-key]').forEach(chip => {
      const key = chip.dataset.filterKey;
      const value = chip.dataset.filterValue;
      const on = !!selected[key]?.has(value);
      chip.classList.toggle('is-selected', on);
      chip.setAttribute('aria-pressed', String(on));
    });
    footer.hidden = !hasSelections();
    renderFilterCounts();
  }

  function openPanel() {
    if (overlay.classList.contains('is-open')) return;
    previousFocus = document.activeElement;
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => closeBtn.focus({preventScroll:true}));
  }

  function closePanel() {
    if (!overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = previousHtmlOverflow;
    document.body.style.overflow = previousBodyOverflow;
    previousFocus?.focus?.({preventScroll:true});
  }

  trigger.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', event => { if (event.target === overlay) closePanel(); });

  overlay.querySelectorAll('.su-filter-group-toggle').forEach(button => {
    const options = button.nextElementSibling;
    if (options) {
      options.setAttribute('aria-hidden', 'true');
      options.querySelectorAll('button').forEach(option => { option.tabIndex = -1; });
    }
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const willOpen = !expanded;
      button.setAttribute('aria-expanded', String(willOpen));
      if (options) {
        options.classList.toggle('is-open', willOpen);
        options.setAttribute('aria-hidden', String(!willOpen));
        options.querySelectorAll('button').forEach(option => { option.tabIndex = willOpen ? 0 : -1; });
      }
      button.querySelector('.su-filter-sign').textContent = willOpen ? '−' : '+';
    });
  });

  overlay.querySelectorAll('.su-filter-chip[data-filter-key]').forEach(chip => {
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', () => {
      const key = chip.dataset.filterKey;
      const value = chip.dataset.filterValue;
      const set = selected[key];
      if (!set) return;

      // Style/Fit/Color are single-choice; Size supports one or more sizes for future inventory filtering.
      if (key !== 'size') {
        const already = set.has(value);
        set.clear();
        if (!already) set.add(value);
      } else {
        if (set.has(value)) set.delete(value); else set.add(value);
      }
      updateChipUI();
      applyFilters({loader:true});
    });
  });

  clearBtn.addEventListener('click', () => {
    Object.values(selected).forEach(set => set.clear());
    appliedFilterCount = 0;
    updateChipUI();
    applyFilters({loader:true});
    renderFilterCounts();
  });

  applyBtn.addEventListener('click', () => {
    appliedFilterCount = selectionCount();
    renderFilterCounts();
    applyFilters({loader:true});
    setTimeout(closePanel, 250);
  });

  document.addEventListener('keydown', event => {
    if (!overlay.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.closest('[hidden]') && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('sucesso:country-change', syncTranslations);
  window.addEventListener('storage', event => { if (event.key === 'preferredLang') syncTranslations(); });
  const langObserver = new MutationObserver(syncTranslations);
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  syncTranslations();
  updateChipUI();
  applyFilters({loader:false});
  // The shared color-swatch script is loaded dynamically. When its circles
  // appear after the filters initialize, sync their underline just once.
  const swatchObserver = new MutationObserver(records => {
    if (!selected.color.size) return;
    for (const record of records) {
      if ([...record.addedNodes].some(node => node.nodeType === 1 &&
          (node.matches?.('.su-variant-row') || node.querySelector?.('.su-variant-row')))) {
        cards.forEach(card => displayCardColor(card, 'white'));
        cards.forEach(card => { delete card.dataset.suFilterShownColor; });
        applyFilters({loader:false});
        break;
      }
    }
  });
  swatchObserver.observe(document.querySelector('.collection-grid') || document.body, {childList:true,subtree:true});

  // Small public hook for the future inventory layer: after stock buttons are updated,
  // calling window.sucessoCollectionFilters.refresh() immediately reapplies active size filters.
  window.sucessoCollectionFilters = {
    refresh: () => applyFilters({loader:false}),
    apply: () => applyFilters({loader:true}),
    clear: () => { Object.values(selected).forEach(set => set.clear()); appliedFilterCount = 0; updateChipUI(); applyFilters({loader:true}); renderFilterCounts(); }
  };
})();
