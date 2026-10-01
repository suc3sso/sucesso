(() => {
  'use strict';

  const PRODUCTS = [
    {
      name: 'Sucesso Jackpot Tee',
      slug: 'sucesso-jackpot-tee',
      price: 30,
      front: 'images/jackpot-front.png',
      back: 'images/jackpot-back.png'
    },
    {
      name: 'Cherry Dice Tee',
      slug: 'cherry-dice-tee',
      price: 30,
      front: 'images/cherry-dice-front.png',
      back: 'images/cherry-dice-back.png'
    },
    {
      name: 'Chinese Success Tee',
      slug: 'chinese-success-tee',
      price: 25,
      front: 'images/chinese-front.png',
      back: 'images/chinese-back.png'
    },
    {
      name: 'Crayon Tee',
      slug: 'crayon-tee',
      price: 40,
      front: 'images/crayon-front.png',
      back: 'images/crayon-back.png'
    }
  ];

  const SIZES = ['S', 'M', 'L', 'XL'];
  let activeProducts = PRODUCTS.slice();

  function slugify(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function currentSlug() {
    const fromStorefront = window.SucessoStorefront?.slugFromProductHref?.(location.href);
    if (fromStorefront) return slugify(fromStorefront);

    const querySlug = new URLSearchParams(location.search).get('nombre');
    if (querySlug) return slugify(querySlug);

    const pathMatch = (location.pathname || '').match(/\/products\/([^/]+)\/?$/i);
    if (pathMatch?.[1]) return slugify(decodeURIComponent(pathMatch[1]));

    const productName = document.getElementById('product-name')?.textContent || '';
    return slugify(productName);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function render() {
    const grid = document.getElementById('related-products-grid');
    if (!grid) return;

    const current = currentSlug();
    const related = activeProducts
      .filter(product => slugify(product.slug || product.name) !== current)
      .slice(0, 3);

    grid.classList.toggle('related-products-grid--three', related.length === 3);

    grid.innerHTML = related.map(product => {
      const href = window.SucessoStorefront?.productHref(product.slug) || `products/${encodeURIComponent(product.slug)}/`; 
      const sizes = SIZES.map(size =>
        `<button class="related-size-btn" type="button" data-related-size="${size}" aria-label="Add ${escapeHtml(product.name)}, size ${size}, to cart">${size}</button>`
      ).join('');

      return `
        <article class="related-product-card" data-related-slug="${escapeHtml(product.slug)}">
          <div class="related-product-media">
            <a class="related-product-link" href="${href}" aria-label="View ${escapeHtml(product.name)}">
              <img class="related-product-front" src="${escapeHtml(product.front)}" alt="${escapeHtml(product.name)} - front" loading="lazy" decoding="async">
              <img class="related-product-back" src="${escapeHtml(product.back)}" alt="${escapeHtml(product.name)} - back" loading="lazy" decoding="async">
            </a>
            <div class="related-size-bar" aria-label="Available sizes">${sizes}</div>
          </div>
          <a class="related-product-info related-product-info-link" href="${href}" aria-label="View ${escapeHtml(product.name)}">
            <p class="related-product-name">${escapeHtml(product.name)}</p>
            <p class="related-product-price">$${product.price.toFixed(2)}</p>
          </a>
        </article>`;
    }).join('');

    grid.addEventListener('click', onGridClick);
  }

  function onGridClick(event) {
    const sizeButton = event.target.closest('.related-size-btn');
    if (!sizeButton) return;

    event.preventDefault();
    event.stopPropagation();

    const card = sizeButton.closest('.related-product-card');
    const product = activeProducts.find(item => item.slug === card?.dataset.relatedSlug);
    const size = sizeButton.dataset.relatedSize;
    if (!product || !size) return;

    const cartProduct = {
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.front,
      size,
      quantity: 1
    };

    localStorage.setItem('sucesso_last_size', size);

    if (typeof window.addToCart === 'function') {
      window.addToCart(cartProduct);
      return;
    }

    // Safe fallback if the cart module has not exposed addToCart yet.
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('carrito') || '[]'); } catch (_) { cart = []; }
    const existing = cart.find(item => item.name === product.name && item.size === size);
    if (existing) {
      existing.quantity = Number(existing.quantity ?? existing.qty ?? existing.cantidad ?? 1) + 1;
    } else {
      cart.push(cartProduct);
    }
    localStorage.setItem('carrito', JSON.stringify(cart));

    if (typeof window.updateCart === 'function') window.updateCart();
    if (typeof window.openCart === 'function') window.openCart();
    else {
      const overlay = document.getElementById('cart-overlay');
      if (overlay) {
        overlay.classList.add('active');
        overlay.classList.remove('hidden');
      }
    }
  }

  async function enhanceFromCatalog() {
    if (typeof window.sucessoCatalogLoader !== 'function') return;
    try {
      const catalog = await window.sucessoCatalogLoader();
      const normalized = (Array.isArray(catalog) ? catalog : []).map(item => ({
        name: String(item.titulo || item.name || '').trim(),
        slug: String(item.nombre || item.slug || '').trim(),
        price: Number(item.precio ?? item.price),
        front: String(item.imagen_frontal || item.imageFront || item.front || '').replace(/\\/g, '/'),
        back: String(item.imagen_trasera || item.imageBack || item.back || item.imagen_frontal || item.imageFront || item.front || '').replace(/\\/g, '/')
      })).filter(item => item.name && item.slug && Number.isFinite(item.price) && item.front);

      if (normalized.length > 1) {
        activeProducts = normalized;
        render();
      }
    } catch (_) {
      // The local fallback above remains fully functional if Firestore is unavailable.
    }
  }

  function init() {
    render();
    enhanceFromCatalog();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
