(() => {
'use strict';
const S = window.SucessoSearch;
const bar = document.getElementById('searchBar');
const results = document.getElementById('searchResults');
const overlay = document.getElementById('overlay');
if (!S || !bar || !results || !overlay) return;

const field = bar.querySelector('input');
const close = bar.querySelector('.close-search');
const page = document.getElementById('su-search-page-main');
if (!field) return;

bar.classList.add('su-search-bar');
results.classList.add('su-predictive-results');
overlay.classList.add('su-search-overlay');
bar.setAttribute('role', 'search');
field.type = 'search';
field.maxLength = 200;
field.autocomplete = 'off';
results.style.setProperty('display', 'none', 'important');
overlay.style.display = 'none';
results.setAttribute('aria-live', 'polite');

let editing = false;
let committed = new URLSearchParams(location.search).get('q')?.trim() || '';
let savedHtmlOverflow = '';
let savedBodyOverflow = '';
let previousFocus = null;
let revision = 0;
let pageRevision = 0;
let debounce;
let pageBusy = false;
let pageTimer = null;
const PREVIEW_DEBOUNCE_MS = 320;
const PREVIEW_MIN_LOADING_MS = 900;

function language() {
  const htmlLang = (document.documentElement.lang || '').toLowerCase();
  if (htmlLang.startsWith('es')) return 'es';
  if (htmlLang.startsWith('en')) return 'en';
  return S.language();
}
function text(key) {
  return window.SucessoUITranslations?.[language()]?.[key] || S.text(key);
}
function updateLanguageUI() {
  field.setAttribute('aria-label', language() === 'es' ? 'Buscar productos' : 'Search products');
  field.placeholder = language() === 'es' ? 'Buscar...' : 'Search...';
  if (close) close.setAttribute('aria-label', language() === 'es' ? 'Cerrar búsqueda' : 'Close search');
}
function ensurePageSpinner() {
  if (!page) return null;
  let spinner = overlay.querySelector('.su-search-processing-spinner');
  if (!spinner) {
    spinner = element('div', 'su-search-processing-spinner');
    spinner.setAttribute('aria-hidden', 'true');
    overlay.append(spinner);
  }
  return spinner;
}
function showPageOverlay(processing = false) {
  if (!page) return;
  ensurePageSpinner();
  overlay.classList.toggle('su-search-processing', processing);
  overlay.style.setProperty('display', 'block', 'important');
  overlay.setAttribute('aria-hidden', 'false');
}
function hidePageOverlay() {
  if (!page) return;
  overlay.classList.remove('su-search-processing');
  overlay.style.setProperty('display', 'none', 'important');
  overlay.setAttribute('aria-hidden', 'true');
}
function element(tag, cls, value) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (value !== undefined) node.textContent = value;
  return node;
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function showPreviewLoading() {
  if (page || !editing || !field.value.trim()) return;
  const shell = element('div', 'su-preview-loading');
  const spinner = element('div', 'su-search-spinner');
  spinner.setAttribute('aria-hidden', 'true');
  shell.append(spinner);
  results.replaceChildren(shell);
  results.style.setProperty('display', 'block', 'important');
  results.setAttribute('aria-busy', 'true');
}
function animatePageResultsIn() {
  if (!page) return;
  const count = document.getElementById('su-search-count');
  const grid = document.getElementById('su-all-results');
  if (!count || !grid) return;
  count.classList.remove('su-enter-active');
  grid.classList.remove('su-enter-active');
  // Force the pending frame to render before starting the entrance animation.
  void grid.offsetWidth;
  count.classList.remove('su-enter-pending');
  grid.classList.remove('su-enter-pending');
  count.classList.add('su-enter-active');
  grid.classList.add('su-enter-active');
  setTimeout(() => {
    count.classList.remove('su-enter-active');
    grid.classList.remove('su-enter-active');
  }, 650);
}
function safeImage(src) {
  try {
    const raw = String(src || '').trim().replace(/\\/g, '/');
    if (!raw) return '';
    /* Product image paths are stored as project-relative paths (for example
       images/jackpot-front.png). Clean product routes live several folders
       deep, so location.href would incorrectly resolve them inside /products/.
       document.baseURI already points at the Sucesso project root on those
       pages and at the current root on normal pages. */
    const url = new URL(raw, document.baseURI || location.href);
    return ['http:', 'https:', 'file:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
const SEARCH_SIZES = ['S', 'M', 'L', 'XL'];

function searchGalleryArrowSvg(direction) {
  return direction === 'prev'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5 7.5 12l7 7"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.5 5 7 7-7 7"/></svg>';
}
function searchGalleryLabel(direction) {
  if (direction === 'prev') return language() === 'es' ? 'Imagen anterior' : 'Previous image';
  return language() === 'es' ? 'Imagen siguiente' : 'Next image';
}
function setSearchGalleryIndex(card, index) {
  const normalized = index === 1 ? 1 : 0;
  card.dataset.suGalleryIndex = String(normalized);
  card.classList.toggle('su-gallery-show-front', normalized === 0);
  card.classList.toggle('su-gallery-show-back', normalized === 1);
}
function addSearchGalleryControls(card, media) {
  if (!card || !media || card.classList.contains('su-search-gallery-card')) return;
  const front = media.querySelector('.su-search-product-front');
  const back = media.querySelector('.su-search-product-back');
  if (!front || !back) return;

  card.classList.add('su-search-gallery-card');
  card.dataset.suGalleryIndex = '0';

  const prev = element('button', 'su-product-gallery-arrow su-product-gallery-arrow--prev');
  prev.type = 'button';
  prev.dataset.galleryDirection = 'prev';
  prev.setAttribute('aria-label', searchGalleryLabel('prev'));
  prev.innerHTML = searchGalleryArrowSvg('prev');

  const next = element('button', 'su-product-gallery-arrow su-product-gallery-arrow--next');
  next.type = 'button';
  next.dataset.galleryDirection = 'next';
  next.setAttribute('aria-label', searchGalleryLabel('next'));
  next.innerHTML = searchGalleryArrowSvg('next');

  media.append(prev, next);

  media.addEventListener('pointerenter', () => {
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
    card.classList.remove('su-gallery-show-front', 'su-gallery-show-back');
    card.dataset.suGalleryIndex = '1';
  });

  media.addEventListener('pointerleave', () => {
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
    card.classList.remove('su-gallery-show-front', 'su-gallery-show-back');
    card.dataset.suGalleryIndex = '0';
    const focused = media.querySelector('.su-product-gallery-arrow:focus');
    focused?.blur?.();
  });

  media.addEventListener('click', event => {
    const arrow = event.target.closest('.su-product-gallery-arrow');
    if (!arrow) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const current = Number(card.dataset.suGalleryIndex || 0) === 1 ? 1 : 0;
    const delta = arrow.dataset.galleryDirection === 'prev' ? -1 : 1;
    setSearchGalleryIndex(card, (current + delta + 2) % 2);
    arrow.focus({ preventScroll: true });
  }, true);
}

function productCard(product, preview) {
  const root = element('article', 'su-search-product-card');
  root.dataset.suName = product.titulo;
  root.dataset.suSlug = product.nombre;
  root.dataset.suPrice = String(product.precio);
  root.dataset.suImage = safeImage(product.imagen_frontal) || product.imagen_frontal;
  if (preview) root.classList.add('su-preview-product-card');
  else root.classList.add('su-page-product-card');

  const href = window.SucessoStorefront?.productHref(product.nombre, 'root') || ('products/' + encodeURIComponent(product.nombre) + '/');
  const media = element('div', 'su-search-product-media');
  const productLink = element('a', 'su-search-product-link');
  productLink.href = href;
  productLink.setAttribute('aria-label', product.titulo);

  for (const [image, cls] of [[product.imagen_frontal, 'su-search-product-front'], [product.imagen_trasera, 'su-search-product-back']]) {
    const img = element('img', cls);
    img.src = safeImage(image);
    img.alt = cls === 'su-search-product-front' ? product.titulo : '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 480;
    img.height = 600;
    productLink.append(img);
  }

  const sizeBar = element('div', 'su-search-size-bar');
  sizeBar.setAttribute('aria-label', language() === 'es' ? 'Tallas disponibles' : 'Available sizes');
  SEARCH_SIZES.forEach(size => {
    const button = element('button', 'su-search-size-btn', size);
    button.type = 'button';
    button.dataset.suSize = size;
    button.setAttribute('aria-label', language() === 'es'
      ? `Agregar ${product.titulo}, talla ${size}, al carrito`
      : `Add ${product.titulo}, size ${size}, to cart`);
    sizeBar.append(button);
  });
  media.append(productLink, sizeBar);
  addSearchGalleryControls(root, media);

  const info = element('a', 'su-search-product-info');
  info.href = href;
  info.setAttribute('aria-label', product.titulo);
  info.append(
    element('p', 'su-search-product-name', product.titulo),
    element('p', 'su-search-product-price', '$' + product.precio.toFixed(2))
  );
  root.append(media, info);
  return root;
}
function addSearchSizeToCart(button) {
  const card = button.closest('.su-search-product-card');
  if (!card) return;

  const size = String(button.dataset.suSize || '').trim().toUpperCase();
  const name = String(card.dataset.suName || '').trim();
  const slug = String(card.dataset.suSlug || '').trim();
  const image = String(card.dataset.suImage || '').trim();
  const price = Number(card.dataset.suPrice);
  if (!size || !name || !slug || !image || !Number.isFinite(price)) return;

  const product = { name, slug, price, image, size, quantity: 1 };
  localStorage.setItem('sucesso_last_size', size);

  // In predictive search, close only the search layer before opening the cart,
  // so the cart drawer is the sole active panel after a size is selected.
  if (card.classList.contains('su-preview-product-card') && editing && !page) closeSearch();

  if (typeof window.addToCart === 'function') {
    window.addToCart(product);
    return;
  }

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('carrito') || '[]');
    if (!Array.isArray(cart)) cart = [];
  } catch (_) { cart = []; }

  const existing = cart.find(item => item.name === name && String(item.size || '').toUpperCase() === size);
  if (existing) existing.quantity = Number(existing.quantity ?? existing.qty ?? existing.cantidad ?? 1) + 1;
  else cart.push(product);
  localStorage.setItem('carrito', JSON.stringify(cart));

  if (typeof window.updateCart === 'function') window.updateCart();
  if (typeof window.openCart === 'function') window.openCart();
  else {
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
      cartOverlay.classList.add('active');
      cartOverlay.classList.remove('hidden');
    }
  }
}
function updatePosition() {
  const nav = document.querySelector('header.navbar');
  const height = nav?.getBoundingClientRect().height || 70;
  document.documentElement.style.setProperty('--su-nav-height', height + 'px');
}
function failure(container, retry) {
  const message = element('div', 'su-search-message', text('search_failure'));
  const button = element('button', 'su-more-results', text('search_retry'));
  button.type = 'button';
  button.onclick = retry;
  message.append(document.createElement('br'), button);
  container.replaceChildren(message);
}
function openSearch() {
  if (editing) return;
  editing = true;
  previousFocus = document.activeElement;
  bar.classList.add('active');
  field.setAttribute('aria-expanded', 'true');

  // search.html keeps the bar permanently open, but focusing/clicking it dims
  // the page underneath just like the search bar on every other page.
  if (page) {
    showPageOverlay(false);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return;
  }

  savedHtmlOverflow = document.documentElement.style.overflow;
  savedBodyOverflow = document.body.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  overlay.style.display = 'block';
  field.focus({ preventScroll: true });
  if (field.value.trim()) renderPreview();
}
function closeSearch() {
  editing = false;
  revision++;
  clearTimeout(debounce);
  results.style.setProperty('display', 'none', 'important');
  overlay.style.setProperty('display', 'none', 'important');
  field.setAttribute('aria-expanded', 'false');

  if (page) {
    field.value = committed;
    bar.classList.add('active');
    hidePageOverlay();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    field.blur();
    return;
  }

  document.documentElement.style.overflow = savedHtmlOverflow;
  document.body.style.overflow = savedBodyOverflow;
  bar.classList.remove('active');
  field.value = '';
  previousFocus?.focus?.({ preventScroll: true });
}
function submit() {
  const query = field.value.trim();
  if (!page) {
    if (query) location.href = 'search.html?q=' + encodeURIComponent(query);
    return;
  }
  if (pageBusy) return;
  pageBusy = true;
  clearTimeout(pageTimer);
  field.setAttribute('aria-busy', 'true');
  showPageOverlay(true);
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Minimum four-second processing state, matching the cart's loading feedback.
  pageTimer = setTimeout(async () => {
    committed = query;
    history.pushState({}, '', query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html');
    await renderPage(true);
    pageBusy = false;
    field.removeAttribute('aria-busy');
    editing = false;
    hidePageOverlay();
    animatePageResultsIn();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    field.blur();
  }, 4000);
}

async function renderPreview() {
  const current = ++revision;
  const query = field.value.trim();
  if (!editing || page) return;
  if (!query) {
    results.replaceChildren();
    results.style.setProperty('display', 'none', 'important');
    results.removeAttribute('aria-busy');
    return;
  }
  showPreviewLoading();
  try {
    const [all] = await Promise.all([S.catalog(), delay(PREVIEW_MIN_LOADING_MS)]);
    if (current !== revision || !editing || field.value.trim() !== query) return;
    const found = S.search(all, query);
    const content = element('div', 'su-preview-content');
    const row = element('div', 'su-preview-row');
    found.slice(0, 4).forEach(product => row.append(productCard(product, true)));
    if (!found.length) row.append(element('p', 'su-search-message', text('search_empty')));
    content.append(row);
    if (found.length) {
      const bottom = element('div', 'su-more-wrap');
      const more = element('a', 'su-more-results', text('search_more_results'));
      more.href = 'search.html?q=' + encodeURIComponent(query);
      bottom.append(more);
      content.append(bottom);
    }
    results.replaceChildren(content);
    results.removeAttribute('aria-busy');
  } catch {
    results.removeAttribute('aria-busy');
    if (current === revision && editing) failure(results, renderPreview);
  }
}
async function renderPage(animate = false) {
  if (!page) return;
  const current = ++pageRevision;
  const query = committed;
  const count = document.getElementById('su-search-count');
  const grid = document.getElementById('su-all-results');
  if (!count || !grid) return;
  count.textContent = '';
  if (!query) {
    grid.replaceChildren(element('p', 'su-search-message', text('search_start')));
    document.title = 'Search — Sucesso';
    return;
  }
  grid.replaceChildren(element('p', 'su-search-message', text('search_loading')));
  try {
    const found = S.search(await S.catalog(), query);
    if (current !== pageRevision) return;
    count.textContent = text(found.length === 1 ? 'search_one_template' : 'search_count_template')
      .replace('{count}', String(found.length))
      .replace('{query}', query);
    grid.replaceChildren(...found.map(product => productCard(product, false)));
    if (!found.length) grid.append(element('p', 'su-search-message', text('search_empty')));
    if (animate) {
      count.classList.add('su-enter-pending');
      grid.classList.add('su-enter-pending');
    }
    document.title = query + ' — Sucesso';
  } catch {
    if (current === pageRevision) failure(grid, renderPage);
  }
}

updateLanguageUI();
updatePosition();
window.addEventListener('resize', updatePosition);
if (window.ResizeObserver) {
  const nav = document.querySelector('header.navbar');
  if (nav) new ResizeObserver(updatePosition).observe(nav);
}

window.toggleSearchBar = () => editing ? closeSearch() : openSearch();

// Size selection inside predictive/full search cards uses the same cart API as tees.html.
document.addEventListener('click', event => {
  const sizeButton = event.target.closest('.su-search-size-btn');
  if (!sizeButton) return;
  event.preventDefault();
  event.stopPropagation();
  addSearchSizeToCart(sizeButton);
}, true);

// Capture these events before the page's legacy search scripts. This leaves the
// original navbar/layout intact while giving every page one consistent search owner.
document.addEventListener('click', event => {
  if (event.target.closest('.search-toggle,#search-text-btn')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openSearch();
  } else if (event.target.closest('.close-search') && bar.contains(event.target)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (page) {
      field.value = '';
      committed = '';
      history.pushState({}, '', 'search.html');
      renderPage();
      field.focus({ preventScroll: true });
    } else closeSearch();
  } else if (event.target === overlay) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (page) {
      if (!pageBusy) closeSearch();
    } else closeSearch();
  }
}, true);

field.addEventListener('focus', () => {
  if (!editing) openSearch();
  else if (page && !pageBusy) showPageOverlay(false);
}, true);
field.addEventListener('input', event => {
  event.stopImmediatePropagation();
  clearTimeout(debounce);
  if (page) {
    if (!editing) openSearch();
    if (!pageBusy) showPageOverlay(false);
  } else {
    if (field.value.trim()) showPreviewLoading();
    else {
      revision++;
      results.replaceChildren();
      results.style.setProperty('display', 'none', 'important');
      results.removeAttribute('aria-busy');
    }
    debounce = setTimeout(renderPreview, PREVIEW_DEBOUNCE_MS);
  }
}, true);
field.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    event.stopImmediatePropagation();
    submit();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!page) closeSearch();
  }
}, true);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && editing && !page) {
    event.preventDefault();
    closeSearch();
  }
});

if (page) {
  bar.classList.add('su-persistent', 'active');
  field.value = committed;
  hidePageOverlay();
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  renderPage();
  window.addEventListener('popstate', () => {
    committed = new URLSearchParams(location.search).get('q')?.trim() || '';
    field.value = committed;
    editing = false;
    hidePageOverlay();
    renderPage();
  });
}

new MutationObserver(() => {
  updateLanguageUI();
  if (page) {
    if (editing) showPageOverlay(pageBusy);
    renderPage();
  } else if (editing) renderPreview();
}).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
