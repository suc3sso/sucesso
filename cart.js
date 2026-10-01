// ✅ CART.JS FUNCIONAL: actualización directa del carrito tras agregar producto y checkout con Firebase

document.addEventListener("DOMContentLoaded", () => {
  const cartOverlay = document.getElementById("cart-overlay");
  const cartItemsContainer = document.querySelector(".cart-items");
  const cartTotalElement = document.querySelector(".cart-total");
  const closeCartBtn = document.querySelector(".close-cart");
  const checkoutBtn = document.querySelector(".checkout-btn");
  const cartCount = document.getElementById("cart-count");
  const cartCountText = document.getElementById("cart-count-text");
  const clearCartBtn = document.getElementById("clear-cart-btn");
  const cartBtn = document.getElementById("cart-btn");
  const cartFooter = document.querySelector(".cart-footer");
  let wishlistOverlay = null;


  /* ------------ i18n del carrito ------------ */
  const CART_I18N = {
    en: {
      size: "Size", yourCart: "Your Cart", checkout: "Checkout", emptyCart: "Empty Cart",
      emptyMessage: "There are no items in your cart.", quantity: "Quantity",
      decrease: "Decrease quantity", increase: "Increase quantity",
      removeFromCart: "Remove from cart", addToWishlist: "Add to wish list",
      removeFromWishlist: "Remove from wish list", emptyAlert: "Your cart is empty. Add products before checkout."
    },
    es: {
      size: "Talla", yourCart: "Tu Carrito", checkout: "Finalizar Compra", emptyCart: "Vaciar Carrito",
      emptyMessage: "Tu carrito está vacío.", quantity: "Cantidad",
      decrease: "Disminuir cantidad", increase: "Aumentar cantidad",
      removeFromCart: "Eliminar del carrito", addToWishlist: "Agregar a la lista de deseos",
      removeFromWishlist: "Eliminar de la lista de deseos", emptyAlert: "Tu carrito está vacío. Agrega productos antes de pagar."
    }
  };

  function cartLang() {
    const saved = String(localStorage.getItem('preferredLang') || document.documentElement.lang || 'en').toLowerCase();
    return saved.startsWith('es') ? 'es' : 'en';
  }

  function getTranslatedText(key) {
    const lang = cartLang();
    return CART_I18N[lang]?.[key] ?? CART_I18N.en[key] ?? key;
  }

  function formatCartPrice(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value ?? '');
    return `$${n.toFixed(2)}`;
  }

  function isVenezuelaMarket() {
    return String(localStorage.getItem('sucesso-selected-country') || '').toUpperCase() === 'VE';
  }

  function ensureCheckoutButtonMarkup() {
    if (!checkoutBtn) return null;
    let label = checkoutBtn.querySelector('.cart-checkout-label');
    let totals = checkoutBtn.querySelector('.cart-checkout-totals');
    if (!label || !totals) {
      checkoutBtn.textContent = '';
      label = document.createElement('span');
      label.className = 'cart-checkout-label';
      totals = document.createElement('span');
      totals.className = 'cart-checkout-totals';
      totals.innerHTML = '<span class="cart-checkout-usd"></span><span class="cart-checkout-ves" hidden></span>';
      checkoutBtn.append(label, totals);
    }
    return { label, totals, usd: totals.querySelector('.cart-checkout-usd'), ves: totals.querySelector('.cart-checkout-ves') };
  }

  async function renderCartCheckoutTotals(total) {
    if (!checkoutBtn) return;
    const parts = ensureCheckoutButtonMarkup();
    if (!parts) return;
    const usdText = formatCartPrice(total);
    checkoutBtn.dataset.total = usdText;
    parts.label.textContent = getTranslatedText('checkout');
    parts.usd.textContent = usdText;

    if (!isVenezuelaMarket()) {
      parts.ves.hidden = true;
      parts.ves.textContent = '';
      return;
    }

    const cached = window.SucessoBCV?.readCache?.();
    if (cached?.rate) {
      parts.ves.hidden = false;
      parts.ves.textContent = window.SucessoBCV.formatVES(window.SucessoBCV.convertUSD(total, cached.rate));
    } else {
      parts.ves.hidden = true;
    }

    const data = await window.SucessoBCV?.getRate?.();
    if (!isVenezuelaMarket()) return;
    if (data?.rate) {
      parts.ves.hidden = false;
      parts.ves.textContent = window.SucessoBCV.formatVES(window.SucessoBCV.convertUSD(total, data.rate));
    }
  }

  function applyCartStaticTranslations() {
    const heading = cartOverlay?.querySelector('.cart-header h2');
    if (heading) heading.textContent = getTranslatedText('yourCart');
    if (checkoutBtn) {
      const parts = ensureCheckoutButtonMarkup();
      if (parts) parts.label.textContent = getTranslatedText('checkout');
    }
    if (clearCartBtn) clearCartBtn.textContent = getTranslatedText('emptyCart');
  }

  /* ------------ wish list compartida ------------ */
  const WISHLIST_KEY = "sucesso_wishlist";
  const WISHLIST_SIZE_KEY = "sucesso_wishlist_sizes";

  function readWishlist() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
      return Array.isArray(parsed) ? [...new Set(parsed.map(String).filter(Boolean))] : [];
    } catch (_) {
      return [];
    }
  }


  function readWishlistSizeMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WISHLIST_SIZE_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) { return {}; }
  }

  function getWishlistSize(slug) {
    const size = String(readWishlistSizeMap()[String(slug || '')] || '').toUpperCase();
    return ['S','M','L','XL'].includes(size) ? size : '';
  }

  function setWishlistSize(slug, size) {
    const value = String(size || '').toUpperCase();
    if (!['S','M','L','XL'].includes(value)) return;
    const sizes = readWishlistSizeMap();
    sizes[String(slug || '')] = value;
    localStorage.setItem(WISHLIST_SIZE_KEY, JSON.stringify(sizes));
  }

  function clearWishlistSize(slug) {
    const sizes = readWishlistSizeMap();
    delete sizes[String(slug || '')];
    localStorage.setItem(WISHLIST_SIZE_KEY, JSON.stringify(sizes));
  }

  function wishlistSlug(item) {
    return String(item?.slug || item?.nombre || item?.name || "").trim();
  }

  function wishlistHas(slug) {
    return !!slug && readWishlist().includes(String(slug));
  }

  function wishlistToggle(slug) {
    const value = String(slug || "").trim();
    if (!value) return false;

    /* If wishlist.js is loaded on this page, use its public API so this cart
       stays perfectly synchronized with Product Page and My Account. */
    if (window.sucessoWishlist?.toggle && window.sucessoWishlist.toggle !== wishlistToggle) {
      return window.sucessoWishlist.toggle(value);
    }

    const list = readWishlist();
    const index = list.indexOf(value);
    let active = false;
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(value);
      active = true;
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("sucesso:wishlist-change", { detail: { slugs: list } }));
    return active;
  }

  function refreshCartWishlistHearts() {
    document.querySelectorAll('.cart-wishlist-item[data-wishlist-slug]').forEach(button => {
      const active = wishlistHas(button.dataset.wishlistSlug);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  /* ------------ corazones en tarjetas de producto ------------
     Se inyectan sobre las tarjetas compartidas de Collections/Tees,
     búsqueda (predictiva y página) y productos relacionados. Todos usan
     exactamente la misma lista local que Carrito / Product Page / Mi Cuenta. */
  const LISTING_CARD_SELECTOR = '.tees-product-card, .su-search-product-card, .related-product-card, .collection-item, .search-result-item';

  function listingSlug(card) {
    if (!card) return '';
    const direct = card.dataset?.teeSlug || card.dataset?.suSlug || card.dataset?.relatedSlug || card.dataset?.wishlistSlug;
    if (direct) return String(direct).trim();

    const link = card.matches?.('a[href]') ? card : card.querySelector('a[href*="product-page.html"], a[href*="/products/"], a[href^="products/"]');
    if (!link) return '';
    try {
      return (window.SucessoStorefront?.slugFromProductHref(link.getAttribute('href')) || new URL(link.getAttribute('href'), location.href).searchParams.get('nombre') || '').trim();
    } catch (_) { return ''; }
  }

  function listingName(card) {
    return String(
      card?.dataset?.teeName || card?.dataset?.suName ||
      card?.querySelector('.related-product-name, .su-search-product-name, h3, .name')?.textContent ||
      'Product'
    ).trim();
  }

  function listingHeartLabel(active, name) {
    let lang = document.documentElement.lang || 'en';
    try { lang = localStorage.getItem('preferredLang') || lang; } catch (_) {}
    const es = String(lang).startsWith('es');
    if (active) return es ? `Eliminar de la lista de deseos: ${name}` : `Remove from wish list: ${name}`;
    return es ? `Agregar ${name} a la lista de deseos` : `Add ${name} to wish list`;
  }

  function setListingHeartState(button) {
    const slug = String(button?.dataset?.wishlistSlug || '').trim();
    if (!button || !slug) return;
    const active = wishlistHas(slug);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', listingHeartLabel(active, button.dataset.wishlistName || 'Product'));
  }


  function addListingNewInBadge(card) {
    if (!(card instanceof Element)) return;
    if (/\/product-page\.html$/i.test(location.pathname) && !card.matches('.related-product-card')) return;
    if (card.querySelector(':scope .listing-new-in-badge')) return;

    const badge = document.createElement('span');
    badge.className = 'listing-new-in-badge';
    badge.textContent = 'NEW IN';
    badge.setAttribute('aria-label', 'New in');

    const media = card.querySelector('.related-product-media, .su-search-product-media, .product-image-wrapper');
    if (media) {
      if (getComputedStyle(media).position === 'static') media.style.position = 'relative';
      media.appendChild(badge);
    } else {
      card.classList.add('has-listing-new-in-badge');
      card.appendChild(badge);
    }
  }

  function addListingHeart(card) {
    if (!(card instanceof Element) || card.matches('.wishlist-card') || card.closest('.cart-item')) return;
    const slug = listingSlug(card);
    if (!slug) return;

    let button = card.querySelector(':scope .listing-wishlist-item');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'listing-wishlist-item';
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v16L12 17.1 5.5 21V5A1.5 1.5 0 0 1 7 3.5Z"></path></svg>';

      const media = card.querySelector('.related-product-media, .su-search-product-media');
      if (media) {
        media.appendChild(button);
      } else {
        card.classList.add('has-listing-wishlist-heart');
        card.appendChild(button);
      }
    }

    button.dataset.wishlistSlug = slug;
    button.dataset.wishlistName = listingName(card);
    setListingHeartState(button);
  }

  function scanListingWishlistHearts(root = document) {
    if (!(root instanceof Document || root instanceof Element || root instanceof DocumentFragment)) return;
    if (root instanceof Element && root.matches(LISTING_CARD_SELECTOR)) { addListingHeart(root); addListingNewInBadge(root); }
    root.querySelectorAll?.(LISTING_CARD_SELECTOR).forEach(card => { addListingHeart(card); addListingNewInBadge(card); });
  }

  function refreshListingWishlistHearts() {
    document.querySelectorAll('.listing-wishlist-item[data-wishlist-slug]').forEach(setListingHeartState);
  }

  // Expose the shared wishlist API on pages that do not load wishlist.js.
  if (!window.sucessoWishlist) {
    window.sucessoWishlist = {
      read: readWishlist,
      has: wishlistHas,
      toggle: wishlistToggle,
      add(slug) {
        const value = String(slug || '').trim();
        const list = readWishlist();
        if (value && !list.includes(value)) {
          list.push(value);
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
          window.dispatchEvent(new CustomEvent('sucesso:wishlist-change', { detail:{ slugs:list } }));
        }
        return list;
      },
      remove(slug) {
        const value = String(slug || '').trim();
        const list = readWishlist().filter(item => item !== value);
        clearWishlistSize(value);
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('sucesso:wishlist-change', { detail:{ slugs:list } }));
        return list;
      }
    };
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.listing-wishlist-item');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const slug = button.dataset.wishlistSlug;
    if (!slug) return;

    if (button.dataset.wishlistBusy === 'true') return;
    button.dataset.wishlistBusy = 'true';

    if (wishlistHas(slug)) {
      // A filled bookmark removes the product directly after one second.
      // It must not reopen the Wish List drawer and it uses no loader.
      window.setTimeout(() => {
        const list = readWishlist().filter(item => item !== String(slug));
        clearWishlistSize(slug);
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('sucesso:wishlist-change', { detail:{ slugs:list } }));
        refreshCartWishlistHearts();
        refreshListingWishlistHearts();
        button.classList.add('wishlist-just-removed');
        button.addEventListener('mouseleave', () => button.classList.remove('wishlist-just-removed'), { once:true });
        button.dataset.wishlistBusy = 'false';
      }, 1000);
      return;
    }

    // An empty bookmark becomes permanently filled after one second and then
    // opens the drawer so the customer can choose a size.
    clearWishlistSize(slug);
    window.setTimeout(() => {
      const list = readWishlist();
      if (!list.includes(String(slug))) list.push(String(slug));
      localStorage.setItem(WISHLIST_KEY, JSON.stringify([...new Set(list)]));
      window.dispatchEvent(new CustomEvent('sucesso:wishlist-change', { detail:{ slugs:readWishlist() } }));
      refreshListingWishlistHearts();
      button.dataset.wishlistBusy = 'false';
      if (button.closest('.su-preview-product-card')) document.querySelector('.close-search')?.click();
      window.sucessoWishlistDrawer?.open?.(slug);
    }, 1000);
  });

  scanListingWishlistHearts();
  const listingObserver = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1) scanListingWishlistHearts(node);
    }));
  });
  if (document.body) listingObserver.observe(document.body, { childList:true, subtree:true });

  /* ------------ bloqueo de scroll del documento ------------ */
  let scrollLockApplied = false;
  let scrollLockY = 0;
  let savedBodyStyles = null;

  function syncPageScrollLock() {
    const sidebar = document.querySelector('.sidebar');
    const cartIsOpen = !!cartOverlay?.classList.contains('active');
    const wishlistIsOpen = !!wishlistOverlay?.classList.contains('active');
    const sidebarIsOpen = !!sidebar?.classList.contains('active');
    const mustLock = cartIsOpen || wishlistIsOpen || sidebarIsOpen;
    const body = document.body;

    document.documentElement.classList.toggle('sucesso-scroll-locked', mustLock);
    body?.classList.toggle('sucesso-scroll-locked', mustLock);

    if (!body) return;

    if (mustLock && !scrollLockApplied) {
      scrollLockY = window.scrollY || window.pageYOffset || 0;
      savedBodyStyles = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow
      };
      body.style.position = 'fixed';
      body.style.top = `-${scrollLockY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      scrollLockApplied = true;
    } else if (!mustLock && scrollLockApplied) {
      const previous = savedBodyStyles || {};
      body.style.position = previous.position || '';
      body.style.top = previous.top || '';
      body.style.left = previous.left || '';
      body.style.right = previous.right || '';
      body.style.width = previous.width || '';
      body.style.overflow = previous.overflow || '';
      scrollLockApplied = false;
      savedBodyStyles = null;
      window.scrollTo(0, scrollLockY);
    }
  }

  const sidebarForLock = document.querySelector('.sidebar');
  if (sidebarForLock) {
    new MutationObserver(syncPageScrollLock).observe(sidebarForLock, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  if (cartOverlay) {
    new MutationObserver(syncPageScrollLock).observe(cartOverlay, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /* ------------ helpers de talla ------------ */
  function getActiveSizeFromDOM() {
    const el = document.querySelector('.product-sizes .active');
    if (!el) return null;
    return (el.dataset.size || el.textContent || '').trim().toUpperCase();
  }

  function resolveSelectedSize(explicitSize) {
    // 1) si vino en el objeto
    if (explicitSize) return explicitSize.toUpperCase();

    // 2) si el botón clickeado dejó la talla en dataset
    const clicked = document.activeElement;
    if (clicked && clicked.dataset && clicked.dataset.size) {
      return clicked.dataset.size.toUpperCase();
    }

    // 3) leer desde el PDP (si estamos en él)
    const fromDOM = getActiveSizeFromDOM();
    if (fromDOM) return fromDOM;

    // 4) último valor elegido (lo guardamos al click)
    const ls = localStorage.getItem('sucesso_last_size');
    if (ls) return ls.toUpperCase();

    // 5) fallback
    return 'S';
  }

  // Guardar “lo último elegido” cuando el usuario pulsa los botones del PDP
  (function wireSizePersistence() {
    const addBtn = document.getElementById('add-to-cart-btn');
    const buyBtn = document.querySelector('.buy-now-btn');

    const save = () => {
      const s = getActiveSizeFromDOM();
      if (s) localStorage.setItem('sucesso_last_size', s);
    };
    addBtn?.addEventListener('click', save, { capture: true });
    buyBtn?.addEventListener('click', save, { capture: true });

    // Por si tu PDP dispara este evento personalizado
    window.addEventListener('sucesso:size-selected', (e) => {
      const s = (e.detail?.size || '').toUpperCase();
      if (s) localStorage.setItem('sucesso_last_size', s);
    });
  })();

  /* ------------ abrir/cerrar carrito ------------ */
  function openCart() {
    if (!cartOverlay) return;
    if (wishlistOverlay?.classList.contains('active')) closeWishlistDrawer(true);
    cartOverlay.classList.add("active");
    cartOverlay.classList.remove("hidden");
    syncPageScrollLock();
  }

  function closeCart() {
    if (!cartOverlay) return;
    cartOverlay.classList.remove("active");
    syncPageScrollLock();
    setTimeout(() => {
      cartOverlay.classList.add("hidden");
      syncPageScrollLock();
    }, 300);
  }

  /* ------------ núcleo del carrito ------------ */
  function addToCart(product) {
    // 🔑 aseguramos talla real, sin forzar S si el usuario eligió otra
    product.size = resolveSelectedSize(product.size);

    if (!product.size) {
      alert("Seleccioná una talla");
      return;
    }

    let cart = JSON.parse(localStorage.getItem("carrito")) || [];
    const existing = cart.find(p => p.name === product.name && p.size === product.size);

    if (existing) {
      existing.quantity = Number(existing.quantity ?? existing.qty ?? existing.cantidad ?? 1) + 1;
    } else {
      product.quantity = 1;
      cart.push(product);
    }

    localStorage.setItem("carrito", JSON.stringify(cart));
    updateCart();
    openCart();
  }
  window.addToCart = addToCart; // por si lo llamás desde otros scripts

  function eliminarProducto(index) {
    let cart = JSON.parse(localStorage.getItem("carrito")) || [];
    cart.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(cart));
    updateCart();
  }

  function getCartItemCount(cart) {
    return cart.reduce((sum, item) => {
      const quantity = Number(item.quantity ?? item.qty ?? item.cantidad ?? 1) || 1;
      return sum + quantity;
    }, 0);
  }

  function setWholeCartLoading(isLoading) {
    const panel = cartOverlay?.querySelector(".cart-panel");
    if (!panel) return;

    let overlay = panel.querySelector(".cart-process-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "cart-process-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = '<div class="spinner"></div>';
      panel.appendChild(overlay);
    }

    panel.classList.toggle("cart-processing", Boolean(isLoading));
  }

  function mostrarCarga(cartItem) {
    cartItem.classList.add("loading");
    setTimeout(() => cartItem.classList.remove("loading"), 500);
  }

  function syncCartCount(count) {
    const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
    if (cartCount) cartCount.textContent = String(safeCount);
    if (cartCountText) cartCountText.textContent = `(${safeCount})`;
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count: safeCount } }));
  }

  function updateCart() {
    applyCartStaticTranslations();
    if (wishlistOverlay) renderWishlistDrawer();
    let cart = JSON.parse(localStorage.getItem("carrito")) || [];

    cartItemsContainer.innerHTML = "";
    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="sucesso-empty-cart">
          <img src="images/sad-sucesso-logo.png" class="sucesso-empty-cart-image" alt="" aria-hidden="true">
          <span data-i18n="cart_empty_message">${getTranslatedText('emptyMessage')}</span>
        </div>`;
      if (cartTotalElement) cartTotalElement.textContent = "";
      if (checkoutBtn) { checkoutBtn.dataset.total = "$0.00"; const parts = ensureCheckoutButtonMarkup(); if (parts) { parts.usd.textContent = "$0.00"; parts.ves.hidden = true; parts.ves.textContent = ""; } }
      syncCartCount(0);
      if (cartFooter) cartFooter.style.display = "none";

      return;
    }

    if (cartFooter) cartFooter.style.display = "block";

    cart.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("cart-item");
      const productHref = window.SucessoStorefront?.productHref(item.slug || item.name, 'root') || `products/${encodeURIComponent(item.slug || item.name)}/`; 
      const wishSlug = wishlistSlug(item);
      const wishActive = wishlistHas(wishSlug);
      const safeName = String(item.name || 'Product');
      const safeSize = String(item.size || '').toUpperCase();
      const quantityValue = Number(item.quantity ?? item.qty ?? item.cantidad ?? 1);

      itemElement.innerHTML = `
        <a class="cart-item-image-link" href="${productHref}" aria-label="${safeName.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
          <img src="${item.image || 'images/default.jpg'}" alt="${safeName.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
        </a>
        <div class="cart-item-details">
          <a class="cart-item-title-link" href="${productHref}"><h4>${safeName}</h4></a>
          <p class="cart-item-price">${formatCartPrice(item.price)}</p>
          <p class="cart-item-size">${safeSize}</p>
          <div class="cart-item-actions">
            <div class="quantity-selector" aria-label="${getTranslatedText('quantity')}">
              <button class="decrease-btn" type="button" data-index="${index}" aria-label="${getTranslatedText('decrease')}">−</button>
              <input type="text" value="${quantityValue}" readonly aria-label="${getTranslatedText('quantity')}" />
              <button class="increase-btn" type="button" data-index="${index}" aria-label="${getTranslatedText('increase')}">+</button>
            </div>
            <button class="cart-wishlist-item${wishActive ? ' is-active' : ''}" type="button" data-wishlist-slug="${wishSlug}" data-wishlist-size="${safeSize}" aria-pressed="${wishActive}" aria-label="Add ${safeName.replace(/&/g,'&amp;').replace(/"/g,'&quot;')} to wish list">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v16L12 17.1 5.5 21V5A1.5 1.5 0 0 1 7 3.5Z"></path></svg>
            </button>
            <button class="cart-remove-item" type="button" data-index="${index}" aria-label="Remove ${safeName.replace(/&/g,'&amp;').replace(/"/g,'&quot;')} from cart"></button>
          </div>
        </div>
        <div class="cart-loading-overlay"><div class="spinner"></div></div>
      `;

      cartItemsContainer.appendChild(itemElement);
      const quantity = Number(item.quantity ?? item.qty ?? item.cantidad ?? 1) || 1;
      total += Number(item.price) * quantity;
      itemCount += quantity;
    });

    if (cartTotalElement) cartTotalElement.textContent = "";
    if (checkoutBtn) renderCartCheckoutTotals(total);
    syncCartCount(itemCount);

    document.querySelectorAll(".cart-wishlist-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const slug = String(btn.dataset.wishlistSlug || '').trim();
        const size = String(btn.dataset.wishlistSize || '').trim().toUpperCase();
        if (!slug || btn.dataset.wishlistBusy === 'true') return;

        btn.dataset.wishlistBusy = 'true';
        const wasActive = wishlistHas(slug);

        // Cart bookmarks deliberately wait one second both when filling and
        // when clearing. There is no loader or transition animation.
        window.setTimeout(() => {
          if (!wasActive && ['S','M','L','XL'].includes(size)) {
            // A cart line already has a chosen size, so preserve that exact
            // size before adding it to Wish List. My Account will therefore
            // show the same size immediately.
            setWishlistSize(slug, size);
          }

          const active = wishlistToggle(slug);
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-pressed", String(active));
          btn.dataset.wishlistBusy = 'false';

          // Keep any other bookmark for the same product synchronized.
          refreshCartWishlistHearts();
          refreshListingWishlistHearts();
        }, 1000);
      });
    });

    document.querySelectorAll(".cart-remove-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"), 10);
        let cart = JSON.parse(localStorage.getItem("carrito")) || [];
        if (!Number.isInteger(index) || !cart[index]) return;

        const willBeEmpty = cart.length === 1;
        const cartItem = btn.closest(".cart-item");

        // La X elimina la línea completa, sin importar cuántas unidades tenga.
        cart.splice(index, 1);
        localStorage.setItem("carrito", JSON.stringify(cart));

        // El contador del navbar se sincroniza en el mismo instante.
        syncCartCount(getCartItemCount(cart));

        if (willBeEmpty) {
          // Al vaciarse por completo: congelamos SOLO el panel durante 3 s.
          setWholeCartLoading(true);
          setTimeout(() => {
            setWholeCartLoading(false);
            updateCart();
          }, 3000);
        } else {
          // Si todavía quedan otros productos, mantenemos el feedback breve habitual.
          if (cartItem) mostrarCarga(cartItem);
          setTimeout(updateCart, 500);
        }
      });
    });

    document.querySelectorAll(".increase-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        const cartItem = btn.closest(".cart-item");
        mostrarCarga(cartItem);
        setTimeout(() => {
          let cart = JSON.parse(localStorage.getItem("carrito")) || [];
          cart[index].quantity = Number(cart[index].quantity ?? cart[index].qty ?? cart[index].cantidad ?? 1) + 1;
          localStorage.setItem("carrito", JSON.stringify(cart));
          updateCart();
        }, 500);
      });
    });

    document.querySelectorAll(".decrease-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        const cartItem = btn.closest(".cart-item");
        mostrarCarga(cartItem);
        setTimeout(() => {
          let cart = JSON.parse(localStorage.getItem("carrito")) || [];
          const currentQuantity = Number(cart[index].quantity ?? cart[index].qty ?? cart[index].cantidad ?? 1) || 1;
          if (currentQuantity > 1) {
            cart[index].quantity = currentQuantity - 1;
          } else {
            cart.splice(index, 1);
          }
          localStorage.setItem("carrito", JSON.stringify(cart));
          updateCart();
        }, 500);
      });
    });
  }

  /* ------------ Wish List drawer ------------ */
  const WISHLIST_DRAWER_CATALOG = [
    { name:'Sucesso Jackpot Tee', slug:'sucesso-jackpot-tee', price:30, image:'images/jackpot-front.png' },
    { name:'Cherry Dice Tee', slug:'cherry-dice-tee', price:30, image:'images/cherry-dice-front.png' },
    { name:'Chinese Success Tee', slug:'chinese-success-tee', price:25, image:'images/chinese-front.png' },
    { name:'Crayon Tee', slug:'crayon-tee', price:40, image:'images/crayon-front.png' }
  ];
  const wishlistDrawerSizes = new Map();
  let wishlistDrawerCloseTimer = null;
  let wishlistRemovalTimer = null;

  const WISHLIST_DRAWER_I18N = {
    en: { title:'Wish List', selectSize:'SELECT SIZE', items:'ITEMS', size:'SIZE', addToCart:'ADD TO CART', empty:'Your wish list is empty.', remove:'Remove from wish list', close:'Close wish list' },
    es: { title:'Lista de deseos', selectSize:'SELECCIONA UNA TALLA', items:'PRODUCTOS', size:'TALLA', addToCart:'AGREGAR AL CARRITO', empty:'Tu lista de deseos está vacía.', remove:'Eliminar de la lista de deseos', close:'Cerrar lista de deseos' }
  };

  function wishlistDrawerText(key) {
    const lang = cartLang();
    return WISHLIST_DRAWER_I18N[lang]?.[key] ?? WISHLIST_DRAWER_I18N.en[key] ?? key;
  }

  function wishlistDrawerProduct(slug) {
    const value = String(slug || '').trim();
    const fixed = WISHLIST_DRAWER_CATALOG.find(item => item.slug === value);
    if (fixed) return fixed;

    const card = [...document.querySelectorAll(LISTING_CARD_SELECTOR)].find(node => listingSlug(node) === value);
    if (card) {
      const image = card.dataset?.teeImage || card.dataset?.suImage || card.querySelector('img')?.getAttribute('src') || '';
      const priceRaw = card.dataset?.teePrice || card.dataset?.suPrice || card.querySelector('.related-product-price,.su-search-product-price')?.textContent || '0';
      const price = Number(String(priceRaw).replace(/[^0-9.]/g,'')) || 0;
      return { name:listingName(card), slug:value, price, image };
    }
    return { name:value.replace(/-/g,' '), slug:value, price:0, image:'images/default.jpg' };
  }

  function ensureWishlistDrawer() {
    if (wishlistOverlay && document.body.contains(wishlistOverlay)) return wishlistOverlay;

    wishlistOverlay = document.createElement('div');
    wishlistOverlay.id = 'wishlist-overlay';
    wishlistOverlay.className = 'wishlist-overlay hidden';
    wishlistOverlay.setAttribute('aria-hidden','true');
    wishlistOverlay.innerHTML = `
      <aside class="wishlist-panel" role="dialog" aria-modal="true" aria-labelledby="wishlist-drawer-title">
        <div class="wishlist-drawer-header">
          <h2 id="wishlist-drawer-title"></h2>
          <button class="wishlist-close" type="button" aria-label="Close"></button>
        </div>
        <div class="wishlist-drawer-content">
          <div class="wishlist-drawer-mode"></div>
          <div class="wishlist-drawer-items" aria-live="polite"></div>
        </div>
      </aside>`;
    document.body.appendChild(wishlistOverlay);

    let process = document.getElementById('wishlist-action-loader');
    if (!process) {
      process = document.createElement('div');
      process.id = 'wishlist-action-loader';
      process.className = 'wishlist-action-loader';
      process.setAttribute('aria-hidden','true');
      process.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
      document.body.appendChild(process);
    }

    wishlistOverlay.querySelector('.wishlist-close')?.addEventListener('click', () => closeWishlistDrawer());
    wishlistOverlay.addEventListener('click', event => {
      if (event.target === wishlistOverlay) closeWishlistDrawer();
    });

    wishlistOverlay.addEventListener('click', event => {
      const sizeButton = event.target.closest('[data-wishlist-drawer-size]');
      if (sizeButton) {
        event.preventDefault();
        const slug = sizeButton.dataset.wishlistSlug;
        const size = String(sizeButton.dataset.wishlistDrawerSize || '').toUpperCase();
        if (!slug || !['S','M','L','XL'].includes(size)) return;
        wishlistDrawerSizes.set(slug, size);
        setWishlistSize(slug, size);
        window.dispatchEvent(new CustomEvent('sucesso:wishlist-size-change', { detail:{ slug, size } }));
        renderWishlistDrawer();
        return;
      }

      const addButton = event.target.closest('[data-wishlist-drawer-add]');
      if (addButton) {
        event.preventDefault();
        const slug = addButton.dataset.wishlistDrawerAdd;
        const size = wishlistDrawerSizes.get(slug);
        const product = wishlistDrawerProduct(slug);
        if (!size || !product) return;
        localStorage.setItem('sucesso_last_size', size);
        closeWishlistDrawer(true);
        window.setTimeout(() => {
          if (typeof window.addToCart === 'function') {
            window.addToCart({ name:product.name, slug:product.slug, price:Number(product.price), image:product.image, size, quantity:1 });
          }
        }, 320);
        return;
      }

      const removeButton = event.target.closest('[data-wishlist-drawer-remove]');
      if (removeButton) {
        event.preventDefault();
        const slug = removeButton.dataset.wishlistDrawerRemove;
        if (!slug || wishlistRemovalTimer) return;
        removeButton.disabled = true;
        const process = document.getElementById('wishlist-action-loader');
        process?.classList.add('active');
        process?.setAttribute('aria-hidden','false');
        wishlistRemovalTimer = window.setTimeout(() => {
          const list = readWishlist().filter(item => item !== String(slug));
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
          wishlistDrawerSizes.delete(String(slug));
          clearWishlistSize(slug);
          window.dispatchEvent(new CustomEvent('sucesso:wishlist-change', { detail:{ slugs:list } }));
          refreshCartWishlistHearts();
          refreshListingWishlistHearts();
          renderWishlistDrawer();
          process?.classList.remove('active');
          process?.setAttribute('aria-hidden','true');
          wishlistRemovalTimer = null;
          closeWishlistDrawer(true);
        }, 4000);
      }
    });

    return wishlistOverlay;
  }

  function renderWishlistDrawer() {
    const overlay = ensureWishlistDrawer();
    const panel = overlay.querySelector('.wishlist-panel');
    const title = overlay.querySelector('#wishlist-drawer-title');
    const close = overlay.querySelector('.wishlist-close');
    const mode = overlay.querySelector('.wishlist-drawer-mode');
    const itemsNode = overlay.querySelector('.wishlist-drawer-items');
    if (!panel || !title || !close || !mode || !itemsNode) return;

    title.textContent = wishlistDrawerText('title');
    close.setAttribute('aria-label', wishlistDrawerText('close'));

    const products = readWishlist().map(wishlistDrawerProduct).filter(Boolean);
    if (!products.length) {
      mode.hidden = true;
      itemsNode.innerHTML = `<p class="wishlist-drawer-empty">${wishlistDrawerText('empty')}</p>`;
      return;
    }

    const needsSize = products.some(product => !wishlistDrawerSizes.has(product.slug));
    mode.hidden = false;
    mode.textContent = needsSize ? wishlistDrawerText('selectSize') : wishlistDrawerText('items');

    itemsNode.innerHTML = products.map(product => {
      const selectedSize = wishlistDrawerSizes.get(product.slug) || getWishlistSize(product.slug) || '';
      const safeName = String(product.name || 'Product').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const safeSlug = String(product.slug || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      const href = window.SucessoStorefront?.productHref(product.slug, 'root') || `products/${encodeURIComponent(product.slug)}/`;
      const sizeUi = selectedSize
        ? `<p class="wishlist-drawer-selected-size">${wishlistDrawerText('size')} ${selectedSize}</p>
           <button class="wishlist-drawer-add" type="button" data-wishlist-drawer-add="${safeSlug}">${wishlistDrawerText('addToCart')}</button>`
        : `<div class="wishlist-drawer-sizes" aria-label="${wishlistDrawerText('selectSize')}">
             ${['S','M','L','XL'].map(size => `<button type="button" data-wishlist-slug="${safeSlug}" data-wishlist-drawer-size="${size}">${size}</button>`).join('')}
           </div>`;
      return `
        <article class="wishlist-drawer-item" data-wishlist-drawer-item="${safeSlug}">
          <a class="wishlist-drawer-image" href="${href}" aria-label="${safeName}"><img src="${product.image}" alt="${safeName}"></a>
          <div class="wishlist-drawer-details">
            <a class="wishlist-drawer-name" href="${href}">${safeName}</a>
            <p class="wishlist-drawer-price">${formatCartPrice(product.price)}</p>
            ${sizeUi}
          </div>
          <button class="wishlist-drawer-bookmark is-active" type="button" data-wishlist-drawer-remove="${safeSlug}" aria-label="${wishlistDrawerText('remove')}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v16L12 17.1 5.5 21V5A1.5 1.5 0 0 1 7 3.5Z"></path></svg>
          </button>
        </article>`;
    }).join('');
  }

  function openWishlistDrawer(focusSlug) {
    const overlay = ensureWishlistDrawer();
    // Keep each product's selected size synchronized with My Account.
    wishlistDrawerSizes.clear();
    const persistedSizes = readWishlistSizeMap();
    Object.entries(persistedSizes).forEach(([slug, size]) => {
      const clean = String(size || '').toUpperCase();
      if (['S','M','L','XL'].includes(clean)) wishlistDrawerSizes.set(slug, clean);
    });
    renderWishlistDrawer();
    if (cartOverlay?.classList.contains('active')) closeCart();
    const sidebar = document.querySelector('.sidebar.active');
    sidebar?.classList.remove('active');
    window.clearTimeout(wishlistDrawerCloseTimer);
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden','false');
    requestAnimationFrame(() => {
      overlay.classList.add('active');
      syncPageScrollLock();
      if (focusSlug) {
        [...overlay.querySelectorAll('[data-wishlist-drawer-item]')]
          .find(node => node.dataset.wishlistDrawerItem === String(focusSlug))
          ?.scrollIntoView({ block:'nearest' });
      }
      overlay.querySelector('.wishlist-close')?.focus({ preventScroll:true });
    });
  }

  function closeWishlistDrawer(immediate = false) {
    const overlay = wishlistOverlay;
    if (!overlay) return;
    window.clearTimeout(wishlistDrawerCloseTimer);
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden','true');
    syncPageScrollLock();
    const finish = () => {
      overlay.classList.add('hidden');
      syncPageScrollLock();
    };
    if (immediate) finish();
    else wishlistDrawerCloseTimer = window.setTimeout(finish, 300);
  }

  window.sucessoWishlistDrawer = {
    open: openWishlistDrawer,
    close: closeWishlistDrawer,
    render: renderWishlistDrawer
  };

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && wishlistOverlay?.classList.contains('active')) closeWishlistDrawer();
  });

  applyCartStaticTranslations();

  /* ------------ listeners varios ------------ */
  closeCartBtn?.addEventListener("click", closeCart);

  cartOverlay?.addEventListener("click", (e) => {
    if (e.target === cartOverlay) closeCart();
  });

  clearCartBtn?.addEventListener("click", () => {
    localStorage.removeItem("carrito");
    updateCart();
  });

  cartBtn?.addEventListener("click", () => {
    openCart();
    updateCart();
  });

  checkoutBtn?.addEventListener("click", () => {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito.length === 0) {
      alert(getTranslatedText("emptyAlert"));
      return;
    }

    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js").then(({ initializeApp }) => {
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").then(({ getAuth, onAuthStateChanged }) => {
        const firebaseConfig = {
          apiKey: "AIzaSyD3u2GKMSAKC_1Cd88KA-rxTOf_Jnt3fuM",
          authDomain: "sucesso-74f7c.firebaseapp.com",
          projectId: "sucesso-74f7c",
          storageBucket: "sucesso-74f7c.appspot.com",
          messagingSenderId: "878844661636",
          appId: "1:878844661636:web:6382f86f18201aecfdd7d1"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        onAuthStateChanged(auth, (user) => {
          if (user) {
            localStorage.setItem("uid", user.uid);
            window.location.href = "checkout.html";
          } else {
            localStorage.setItem("redirigirACheckout", "true");
            window.location.href = "login.html";
          }
        });
      });
    });
  });

  window.addEventListener("sucesso:wishlist-change", () => {
    refreshCartWishlistHearts();
    refreshListingWishlistHearts();
    if (wishlistOverlay) renderWishlistDrawer();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === WISHLIST_KEY) {
      refreshCartWishlistHearts();
      refreshListingWishlistHearts();
    }
  });

  syncPageScrollLock();
  updateCart();
  window.addEventListener('sucesso:bcv-rate', () => {
    const cart = JSON.parse(localStorage.getItem('carrito')) || [];
    const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity ?? item.qty ?? item.cantidad ?? 1) || 1), 0);
    if (cart.length) renderCartCheckoutTotals(total);
  });
  window.addEventListener('sucesso:country-change', () => updateCart());

  window.updateCart = updateCart;

  window.addEventListener("storage", (event) => {
    if (event.key === "preferredLang") updateCart();
  });
  window.openCart = openCart;
});
