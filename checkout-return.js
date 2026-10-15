/* Frontend navigation only: original Firebase and EmailJS integrations are unchanged. */
(() => {
  const isCheckout = /\/checkout\.html$/.test(location.pathname);
  const requested = new URLSearchParams(location.search).get('next') === 'checkout';
  if (isCheckout || requested) sessionStorage.setItem('sucesso-checkout-return', 'checkout.html');
  window.sucessoAuthReturn = () => (
    sessionStorage.getItem('sucesso-checkout-return') === 'checkout.html' ||
    localStorage.getItem('redirigirACheckout') === 'true'
  ) ? 'checkout.html' : 'mi-cuenta.html';
  document.addEventListener('DOMContentLoaded', () => {
    if (window.sucessoAuthReturn() !== 'checkout.html') return;
    document.querySelectorAll('a[href="login.html"],a[href="registro.html"],a[href="recuperar.html"]').forEach(a => {
      a.href = a.getAttribute('href') + '?next=checkout';
    });
  });
})();


/* Replay the same Cherry loader when browser Back/Forward restores a page from cache. */
(() => {
  let timer = null;
  function ensureLoader() {
    let loader = document.getElementById('loader');
    if (loader) return loader;
    const style = document.createElement('style');
    style.id = 'sucesso-history-loader-style';
    style.textContent = `
      @keyframes zoomInClean {0%{transform:scale(.1);opacity:0}70%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}
      #loader.sucesso-history-loader{position:fixed;inset:0;background:#fff;display:flex;align-items:center;justify-content:center;z-index:999999;opacity:1;visibility:visible;transition:opacity .4s ease,visibility .4s ease}
      #loader.sucesso-history-loader img{width:120px;height:120px;object-fit:contain}
    `;
    document.head.appendChild(style);
    loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'loader sucesso-history-loader';
    const img = document.createElement('img');
    img.src = 'images/logo cherry png.png';
    img.alt = 'Sucesso Logo';
    loader.appendChild(img);
    document.body.appendChild(loader);
    return loader;
  }
  function replayNavigationLoader() {
    const loader = ensureLoader();
    const img = loader.querySelector('img');
    loader.style.display = 'flex';
    loader.style.opacity = '1';
    loader.style.visibility = 'visible';
    if (img) {
      img.style.animation = 'none';
      void img.offsetWidth;
      img.style.animation = 'zoomInClean 2s ease forwards';
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      setTimeout(() => { loader.style.display = 'none'; }, 400);
    }, 2500);
  }
  window.__sucessoReplaySiteLoader = replayNavigationLoader;
  window.addEventListener('pageshow', event => {
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    if (event.persisted || nav?.type === 'back_forward') replayNavigationLoader();
  });
  window.addEventListener('popstate', replayNavigationLoader);
})();
