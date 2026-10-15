(() => {
  'use strict';

  const STORAGE_KEY = 'sucesso_wishlist';
  const SIZE_STORAGE_KEY = 'sucesso_wishlist_sizes';
  const PRODUCTS = [
    { name:'Jackpot Casino Oversized Tee', slug:'sucesso-jackpot-tee', price:30, front:'images/jackpot-front.png', back:'images/jackpot-back.png' },
    { name:'Cherry Dice Oversized Tee', slug:'cherry-dice-tee', price:30, front:'images/cherry-dice-front.png', back:'images/cherry-dice-back.png' },
    { name:'Chinese Chowmein Oversized Tee', slug:'chinese-success-tee', price:25, front:'images/chinese-front.png', back:'images/chinese-back.png' },
    { name:'Crayon Art Oversized Tee', slug:'crayon-tee', price:40, front:'images/crayon-front.png', back:'images/crayon-back.png' }
  ];

  let catalog = PRODUCTS.slice();

  const escapeHtml = value => String(value)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function readWishlist() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? [...new Set(parsed.map(String).filter(Boolean))] : [];
    } catch (_) {
      return [];
    }
  }

  function writeWishlist(slugs) {
    const clean = [...new Set((Array.isArray(slugs) ? slugs : []).map(String).filter(Boolean))];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('sucesso:wishlist-change', { detail:{ slugs:clean } }));
    return clean;
  }


  function readWishlistSizes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SIZE_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function wishlistSize(slug) {
    const value = String(readWishlistSizes()[String(slug || '')] || '').toUpperCase();
    return ['S','M','L','XL'].includes(value) ? value : '';
  }

  function clearWishlistSize(slug) {
    const sizes = readWishlistSizes();
    delete sizes[String(slug || '')];
    localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(sizes));
  }

  function has(slug) {
    return readWishlist().includes(String(slug));
  }

  function add(slug) {
    const list = readWishlist();
    const value = String(slug || '').trim();
    if (value && !list.includes(value)) list.push(value);
    return writeWishlist(list);
  }

  function remove(slug) {
    const value = String(slug || '').trim();
    clearWishlistSize(value);
    return writeWishlist(readWishlist().filter(item => item !== value));
  }

  function toggle(slug) {
    const value = String(slug || '').trim();
    if (!value) return false;
    if (has(value)) { remove(value); return false; }
    add(value); return true;
  }

  function currentSlug() {
    return (window.SucessoStorefront?.slugFromProductHref(location.href) || new URLSearchParams(location.search).get('nombre') || '').trim();
  }

  function bookmarkSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v16L12 17.1 5.5 21V5A1.5 1.5 0 0 1 7 3.5Z"></path></svg>';
  }

  function ensureBookmarkIcon(button) {
    if (!button) return;
    const path = button.querySelector('path')?.getAttribute('d') || '';
    if (!path.includes('M7 3.5h10')) button.innerHTML = bookmarkSvg();
  }

  function setProductHeartState() {
    const button = document.getElementById('product-wishlist-toggle');
    if (!button) return;
    ensureBookmarkIcon(button);
    const slug = currentSlug();
    const active = !!slug && has(slug);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    const es = (localStorage.getItem('preferredLang') || document.documentElement.lang || 'en').startsWith('es');
    button.setAttribute('aria-label', active
      ? (es ? 'Eliminar de la lista de deseos' : 'Remove from wish list')
      : (es ? 'Agregar a la lista de deseos' : 'Add to wish list'));
  }

  function initProductHeart() {
    const button = document.getElementById('product-wishlist-toggle');
    if (!button) return;
    setProductHeartState();
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const slug = currentSlug();
      if (!slug || button.dataset.wishlistBusy === 'true') return;
      button.dataset.wishlistBusy = 'true';

      if (has(slug)) {
        // Filled bookmark = remove directly. No drawer and no loader.
        window.setTimeout(() => {
          remove(slug);
          setProductHeartState();
          button.classList.add('wishlist-just-removed');
          button.addEventListener('mouseleave', () => button.classList.remove('wishlist-just-removed'), { once:true });
          button.dataset.wishlistBusy = 'false';
        }, 1000);
        return;
      }

      // Empty bookmark = fill after one second, then ask for a size in the drawer.
      clearWishlistSize(slug);
      window.setTimeout(() => {
        add(slug);
        setProductHeartState();
        button.dataset.wishlistBusy = 'false';
        window.sucessoWishlistDrawer?.open?.(slug);
      }, 1000);
    });
  }

  /* Extend only the gray image column upward. Product image, title, price and
     controls keep their exact layout positions. */
  function syncImageTopFill() {
    const imageColumn = document.querySelector('.image-scroll-container');
    const navbar = document.querySelector('header.navbar');
    if (!imageColumn || !navbar) return;

    let fill = document.getElementById('product-image-top-fill');
    if (!fill) {
      fill = document.createElement('div');
      fill.id = 'product-image-top-fill';
      fill.setAttribute('aria-hidden','true');
      document.body.appendChild(fill);
    }

    if (window.innerWidth <= 768) {
      fill.style.display = 'none';
      return;
    }

    const imageRect = imageColumn.getBoundingClientRect();
    const navRect = navbar.getBoundingClientRect();
    const gap = Math.max(0, imageRect.top - navRect.bottom);
    if (gap <= 0 || imageRect.width <= 0) {
      fill.style.display = 'none';
      return;
    }

    fill.style.display = 'block';
    fill.style.left = `${Math.round(imageRect.left + window.scrollX)}px`;
    fill.style.top = `${Math.round(navRect.bottom + window.scrollY)}px`;
    fill.style.width = `${Math.round(imageRect.width)}px`;
    fill.style.height = `${Math.ceil(gap)}px`;
  }

  function productBySlug(slug) {
    return catalog.find(item => item.slug === slug) || PRODUCTS.find(item => item.slug === slug);
  }

  function renderWishlist() {
    const grid = document.getElementById('wishlist-grid');
    const empty = document.getElementById('wishlist-empty');
    if (!grid) return;

    const slugs = readWishlist();
    const products = slugs.map(productBySlug).filter(Boolean);
    grid.innerHTML = '';

    if (!products.length) {
      if (empty) empty.classList.remove('is-hidden');
      return;
    }
    if (empty) empty.classList.add('is-hidden');

    grid.innerHTML = products.map(product => {
      const href = window.SucessoStorefront?.productHref(product.slug) || `products/${encodeURIComponent(product.slug)}/`; 
      return `
        <article class="wishlist-card" data-wishlist-slug="${escapeHtml(product.slug)}">
          <div class="wishlist-media">
            <a class="wishlist-product-link" href="${href}" aria-label="${escapeHtml(product.name)}">
              <img class="wishlist-front" src="${escapeHtml(product.front)}" alt="${escapeHtml(product.name)} - front" loading="lazy" decoding="async">
              <img class="wishlist-back" src="${escapeHtml(product.back || product.front)}" alt="${escapeHtml(product.name)} - back" loading="lazy" decoding="async">
            </a>
            <button class="wishlist-card-heart is-active" type="button" data-wishlist-remove="${escapeHtml(product.slug)}" aria-label="Remove ${escapeHtml(product.name)} from wish list" aria-pressed="true">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v16L12 17.1 5.5 21V5A1.5 1.5 0 0 1 7 3.5Z"></path></svg>
            </button>
          </div>
          <a class="wishlist-info-link" href="${href}">
            <p class="wishlist-name">${escapeHtml(product.name)}</p>
            <p class="wishlist-price">$${Number(product.price).toFixed(2)}</p>
            ${wishlistSize(product.slug) ? `<p class="wishlist-selected-size">${escapeHtml(wishlistSize(product.slug))}</p>` : ''}
          </a>
          <button class="wishlist-add-to-cart" type="button" data-wishlist-add-cart="${escapeHtml(product.slug)}" data-i18n="add_to_cart">
            ${((localStorage.getItem('preferredLang') || document.documentElement.lang || 'en').toLowerCase().startsWith('es')) ? 'Agregar al carrito' : 'Add to cart'}
          </button>
        </article>`;
    }).join('');
  }

  function setAccountLoader(active) {
    const loader = document.getElementById('account-switch-loader');
    if (!loader) return false;
    loader.classList.toggle('active', !!active);
    loader.setAttribute('aria-hidden', active ? 'false' : 'true');
    return true;
  }

  function initWishlistGrid() {
    const grid = document.getElementById('wishlist-grid');
    if (!grid) return;
    renderWishlist();
    grid.addEventListener('click', event => {
      const removeButton = event.target.closest('[data-wishlist-remove]');
      if (removeButton) {
        event.preventDefault();
        event.stopPropagation();

        const slug = removeButton.dataset.wishlistRemove;
        if (!slug || removeButton.dataset.busy === 'true') return;
        removeButton.dataset.busy = 'true';

        // Removing a saved bookmark is deliberately quiet: one second,
        // no page loader, then the item disappears everywhere.
        window.setTimeout(() => {
          removeButton.classList.remove('is-active');
          removeButton.setAttribute('aria-pressed','false');
          remove(slug);
          renderWishlist();
        }, 1000);
        return;
      }

      const addButton = event.target.closest('[data-wishlist-add-cart]');
      if (!addButton) return;
      event.preventDefault();
      event.stopPropagation();

      const slug = addButton.dataset.wishlistAddCart;
      const product = productBySlug(slug);
      if (!product || addButton.dataset.busy === 'true') return;

      addButton.dataset.busy = 'true';
      const payload = {
        name: product.name,
        price: Number(product.price),
        image: product.front,
        slug: product.slug,
        quantity: 1
      };

      // Reuse the exact cart function used by the product page. It preserves
      // the selected/last-used size logic, updates the cart and opens it.
      if (typeof window.addToCart === 'function') {
        window.addToCart(payload);
      } else {
        const raw = localStorage.getItem('carrito');
        let cart = [];
        try { cart = raw ? JSON.parse(raw) : []; } catch (_) { cart = []; }
        const size = wishlistSize(product.slug);
        if (!size) {
          addButton.dataset.busy = 'false';
          window.sucessoWishlistDrawer?.open?.(product.slug);
          return;
        }
        const ix = cart.findIndex(item => String(item.slug || '') === product.slug && String(item.size || '').toUpperCase() === size);
        if (ix >= 0) cart[ix].quantity = Number(cart[ix].quantity ?? 1) + 1;
        else cart.push({ ...payload, size, quantity: 1 });
        localStorage.setItem('carrito', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart:updated'));
        window.dispatchEvent(new CustomEvent('cart:force-open', { detail:{ from:'wishlist' } }));
      }

      setTimeout(() => { addButton.dataset.busy = 'false'; }, 500);
    });
  }

  async function enhanceCatalog() {
    if (typeof window.sucessoCatalogLoader !== 'function') return;
    try {
      const source = await window.sucessoCatalogLoader();
      const normalized = (Array.isArray(source) ? source : []).map(item => ({
        name:String(item.titulo || item.name || '').trim(),
        slug:String(item.nombre || item.slug || '').trim(),
        price:Number(item.precio ?? item.price),
        front:String(item.imagen_frontal || item.imageFront || item.front || '').replace(/\\/g,'/'),
        back:String(item.imagen_trasera || item.imageBack || item.back || item.imagen_frontal || item.imageFront || item.front || '').replace(/\\/g,'/')
      })).filter(item => item.name && item.slug && Number.isFinite(item.price) && item.front);
      if (normalized.length) {
        catalog = normalized;
        renderWishlist();
      }
    } catch (_) {
      /* Local product data remains fully functional offline. */
    }
  }

  function init() {
    initProductHeart();
    initWishlistGrid();
    syncImageTopFill();
    requestAnimationFrame(syncImageTopFill);
    setTimeout(syncImageTopFill, 120);
    setTimeout(syncImageTopFill, 500);
    enhanceCatalog();

    window.addEventListener('resize', syncImageTopFill, { passive:true });
    window.addEventListener('load', syncImageTopFill, { once:true });
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY || event.key === SIZE_STORAGE_KEY) {
        setProductHeartState();
        renderWishlist();
      }
    });
    window.addEventListener('sucesso:wishlist-change', () => {
      setProductHeartState();
      renderWishlist();
    });
    window.addEventListener('sucesso:wishlist-size-change', () => renderWishlist());
  }

  window.sucessoWishlist = { read:readWishlist, has, add, remove, toggle };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
