(() => {
  'use strict';

  function addSelectedSizeToCart(button) {
    const card = button.closest('.tees-product-card');
    if (!card) return;

    const size = String(button.dataset.teeSize || '').trim().toUpperCase();
    const name = String(card.dataset.teeName || '').trim();
    const slug = String(card.dataset.teeSlug || '').trim();
    const image = String(card.dataset.teeImage || '').trim();
    const price = Number(card.dataset.teePrice);

    if (!size || !name || !slug || !image || !Number.isFinite(price)) return;

    const product = {
      name,
      slug,
      price,
      image,
      size,
      quantity: 1
    };

    // Preserve the same selected-size state used by the product page/cart.
    localStorage.setItem('sucesso_last_size', size);

    // Use the site's existing cart API so quantities, navbar count and drawer
    // stay synchronized exactly as everywhere else.
    if (typeof window.addToCart === 'function') {
      window.addToCart(product);
      return;
    }

    // Defensive fallback in case cart.js has not finished initializing yet.
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('carrito') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (_) {
      cart = [];
    }

    const existing = cart.find(item => item.name === name && item.size === size);
    if (existing) {
      existing.quantity = Number(existing.quantity ?? existing.qty ?? existing.cantidad ?? 1) + 1;
    } else {
      cart.push(product);
    }

    localStorage.setItem('carrito', JSON.stringify(cart));
    if (typeof window.updateCart === 'function') window.updateCart();
    if (typeof window.openCart === 'function') window.openCart();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.tees-size-btn');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    addSelectedSizeToCart(button);
  });
})();
