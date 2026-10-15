/* Sucesso auth-page fixes: consistent search/cart controls and reliable password reset. */
(() => {
  'use strict';

  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  const getLang = () => localStorage.getItem('preferredLang') === 'en' ? 'en' : 'es';
  const dictionary = {
    en: {
      reset_success: 'We sent you an email with a link to reset your password. Check your inbox and spam folder.',
      reset_invalid: 'Enter a valid email address.',
      reset_limit: 'Too many attempts. Please wait a moment and try again.',
      reset_network: 'We could not connect to the authentication service. Check your connection and try again.',
      reset_error: 'We could not send the recovery email. Please try again.',
      reset_wait: 'Sending…',
      reset_submit: 'Send Recovery Email'
    },
    es: {
      reset_success: 'Te enviamos un correo con el enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.',
      reset_invalid: 'Ingresa un correo electrónico válido.',
      reset_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
      reset_network: 'No pudimos conectar con el servicio de autenticación. Revisa tu conexión e inténtalo de nuevo.',
      reset_error: 'No pudimos enviar el correo de recuperación. Inténtalo de nuevo.',
      reset_wait: 'Enviando…',
      reset_submit: 'Enviar correo de recuperación'
    }
  };
  const tr = (key) => dictionary[getLang()]?.[key] || key;

  ready(() => {
    /* ---------- Search UI ---------- */
    const searchBar = document.getElementById('searchBar');
    const searchInput = searchBar?.querySelector('input');
    const searchResults = document.getElementById('searchResults');
    const overlay = document.getElementById('overlay');

    const searchIsOpen = () => !!searchBar?.classList.contains('active');
    const openSearch = () => {
      if (!searchBar) return;
      searchBar.classList.remove('hiding');
      searchBar.classList.add('active');
      if (overlay) overlay.style.display = 'block';
      searchInput?.focus();
    };
    const closeSearch = () => {
      if (!searchBar) return;
      searchBar.classList.add('hiding');
      searchBar.classList.remove('active');
      if (overlay) overlay.style.display = 'none';
      if (searchResults) searchResults.style.display = 'none';
      setTimeout(() => searchBar.classList.remove('hiding'), 220);
    };
    const toggleSearch = () => searchIsOpen() ? closeSearch() : openSearch();
    window.toggleSearchBar = toggleSearch;

    document.querySelectorAll('#search-text-btn, .search-toggle, .close-search').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (button.classList.contains('close-search')) closeSearch();
        else toggleSearch();
      }, true);
    });
    overlay?.addEventListener('click', (event) => {
      if (!searchIsOpen()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeSearch();
    }, true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && searchIsOpen()) closeSearch();
    });

    /* ---------- Cart UI ---------- */
    const cartOverlay = document.getElementById('cart-overlay');
    const cartIcon = document.getElementById('cart-btn');
    const cartText = document.getElementById('cart-text-btn');
    const closeCart = document.querySelector('.close-cart');

    const openCart = () => {
      if (!cartOverlay) return;
      cartOverlay.classList.remove('hidden');
      requestAnimationFrame(() => cartOverlay.classList.add('active'));
      try { window.updateCart?.(); } catch (_) {}
    };
    const hideCart = () => {
      if (!cartOverlay) return;
      cartOverlay.classList.remove('active');
      setTimeout(() => cartOverlay.classList.add('hidden'), 300);
    };
    window.openCart = openCart;

    [cartIcon, cartText].forEach((button) => button?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCart();
    }, true));
    closeCart?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      hideCart();
    }, true);
    cartOverlay?.addEventListener('click', (event) => {
      if (event.target === cartOverlay) hideCart();
    });

    /* ---------- Password recovery ---------- */
    const form = document.getElementById('reset-form');
    if (!form) return;

    const email = document.getElementById('email');
    const submit = form.querySelector('button[type="submit"]');
    const success = document.getElementById('success-message');
    const error = document.getElementById('error-message');
    let busy = false;

    const setMessage = (node, text) => {
      if (!node) return;
      node.textContent = text;
      node.style.display = text ? 'block' : 'none';
    };

    form.addEventListener('submit', async (event) => {
      // Capture-phase handler prevents the older duplicated reset listener in recuperar.html
      // from sending a second email.
      event.preventDefault();
      event.stopImmediatePropagation();
      if (busy || !email || !submit) return;

      email.value = email.value.trim();
      setMessage(success, '');
      setMessage(error, '');
      if (!email.checkValidity()) {
        setMessage(error, tr('reset_invalid'));
        email.reportValidity();
        return;
      }

      busy = true;
      submit.disabled = true;
      submit.textContent = tr('reset_wait');

      try {
        const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        const authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        const firebaseConfig = {
          apiKey: 'AIzaSyD3u2GKMSAKC_1Cd88KA-rxTOf_Jnt3fuM',
          authDomain: 'sucesso-74f7c.firebaseapp.com',
          projectId: 'sucesso-74f7c',
          storageBucket: 'sucesso-74f7c.appspot.com',
          messagingSenderId: '878844661636',
          appId: '1:878844661636:web:6382f86f18201aecfdd7d1'
        };
        const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
        const auth = authMod.getAuth(app);
        await authMod.sendPasswordResetEmail(auth, email.value);
        setMessage(success, tr('reset_success'));
        email.value = '';
      } catch (reason) {
        console.error('Password reset error:', reason);
        const code = reason?.code || '';
        const key = code === 'auth/invalid-email' ? 'reset_invalid'
          : code === 'auth/too-many-requests' ? 'reset_limit'
          : code === 'auth/network-request-failed' ? 'reset_network'
          : 'reset_error';
        setMessage(error, tr(key));
      } finally {
        busy = false;
        submit.disabled = false;
        submit.textContent = tr('reset_submit');
      }
    }, true);
  });
})();
