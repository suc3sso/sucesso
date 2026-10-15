(() => {
  const DESKTOP_QUERY = '(min-width: 1024px)';
  const routes = {
    'nav-shop': 'collections/t-shirts/',
    'nav-collections': 'collections/dice-drp/',
    'nav-support': 'contactanos.html',
    'nav-brand': 'about.html'
  };

  /*
    Use one capturing listener so legacy dropdown handlers never run on
    desktop/laptop. Below 1024px this does absolutely nothing, preserving
    the existing mobile menu and its behavior.
  */
  document.addEventListener('click', (event) => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) return;

    const main = event.target.closest('header.navbar .nav-desktop .nav-main');
    if (!main) return;

    const item = main.closest('.nav-item');
    const href = item && routes[item.id];
    if (!href) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(new URL(href, document.baseURI).href);
  }, true);
})();
