(() => {
  'use strict';

  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;

  const labels = {
    es: {
      shop: 'Shop',
      tees: 'Camisetas',
      collections: 'Colecciones',
      contact: 'Contacto',
      brand: 'Marca',
      account: 'Cuenta',
      menu: 'Menú',
      openShop: 'Abrir Shop',
      openCollections: 'Abrir Colecciones'
    },
    en: {
      shop: 'Shop',
      tees: 'T-Shirts',
      collections: 'Collections',
      contact: 'Contact',
      brand: 'Brand',
      account: 'Account',
      menu: 'Menu',
      openShop: 'Open Shop',
      openCollections: 'Open Collections'
    }
  };

  const currentLanguage = () => {
    let stored = '';
    try { stored = (localStorage.getItem('preferredLang') || '').toLowerCase(); } catch (_) {}
    if (stored === 'en' || stored === 'es') return stored;
    return (document.documentElement.lang || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  };

  /* Replace only the glyph inside the existing button; its position/function stays intact. */
  toggle.innerHTML = `
    <span class="menu-icon su-menu-icon" aria-hidden="true">
      <span class="su-burger-line"></span>
      <span class="su-burger-line"></span>
    </span>`;
  toggle.setAttribute('type', 'button');
  toggle.setAttribute('aria-expanded', sidebar.classList.contains('active') ? 'true' : 'false');

  /* Rebuild only the existing sidebar contents. The drawer itself is unchanged. */
  sidebar.innerHTML = `
    <div class="su-mobile-menu-shell">
      <nav class="su-mobile-menu-main" aria-label="Mobile navigation">
        <div class="su-mobile-menu-section" data-su-section="shop">
          <button class="su-mobile-nav-trigger" type="button" aria-expanded="false" aria-controls="su-mobile-shop-panel">
            <span data-su-label="shop"></span>
            <svg class="su-mobile-chevron" viewBox="0 0 12 8" aria-hidden="true">
              <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="su-mobile-submenu" id="su-mobile-shop-panel" aria-hidden="true">
            <div class="su-mobile-submenu-inner">
              <a class="su-mobile-sub-link" href="/collections/t-shirts/" data-su-label="tees"></a>
            </div>
          </div>
        </div>

        <div class="su-mobile-menu-section" data-su-section="collections">
          <button class="su-mobile-nav-trigger" type="button" aria-expanded="false" aria-controls="su-mobile-collections-panel">
            <span data-su-label="collections"></span>
            <svg class="su-mobile-chevron" viewBox="0 0 12 8" aria-hidden="true">
              <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="su-mobile-submenu" id="su-mobile-collections-panel" aria-hidden="true">
            <div class="su-mobile-submenu-inner">
              <a class="su-mobile-sub-link" href="/collections/dice-drp/">Dice DRP</a>
            </div>
          </div>
        </div>

        <a class="su-mobile-direct" href="/contactanos.html" data-su-label="contact"></a>
        <a class="su-mobile-direct" href="/about.html" data-su-label="brand"></a>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-auth-lang">
          <a class="su-mobile-account" href="/login.html" data-su-label="account"></a>
          <a class="su-mobile-instagram" href="https://www.instagram.com/sucessobrand/"
             target="_blank" rel="noopener noreferrer" aria-label="Instagram @sucessobrand">
            <img src="https://raw.githubusercontent.com/suc3sso/sucesso/refs/heads/main/images/instagram.png"
                 alt="Instagram" width="19" height="19" />
          </a>
          <div class="lang-btn" id="languageToggleSidebar">ES | EN</div>
        </div>
      </div>
    </div>`;
  sidebar.classList.add('su-mobile-menu-ready');

  const menuIcon = toggle.querySelector('.menu-icon');
  const sections = Array.from(sidebar.querySelectorAll('.su-mobile-menu-section'));
  const account = sidebar.querySelector('.su-mobile-account');
  /* Same footer asset; a local vector fallback prevents a broken icon offline. */
  const instagramImage = sidebar.querySelector('.su-mobile-instagram img');
  instagramImage?.addEventListener('error', () => {
    if (!instagramImage.src.endsWith('/images/instagram-icon.svg')) {
      instagramImage.src = '/images/instagram-icon.svg';
    }
  });

  function applyLanguage() {
    const lang = currentLanguage();
    const dict = labels[lang] || labels.es;
    sidebar.querySelectorAll('[data-su-label]').forEach((node) => {
      const key = node.getAttribute('data-su-label');
      if (dict[key]) node.textContent = dict[key];
    });
    toggle.setAttribute('aria-label', dict.menu);
    const shopButton = sidebar.querySelector('[data-su-section="shop"] .su-mobile-nav-trigger');
    const collectionsButton = sidebar.querySelector('[data-su-section="collections"] .su-mobile-nav-trigger');
    if (shopButton) shopButton.setAttribute('aria-label', dict.openShop);
    if (collectionsButton) collectionsButton.setAttribute('aria-label', dict.openCollections);
  }

  function closeSection(section) {
    section.classList.remove('is-open');
    const button = section.querySelector('.su-mobile-nav-trigger');
    const panel = section.querySelector('.su-mobile-submenu');
    if (button) button.setAttribute('aria-expanded', 'false');
    if (panel) panel.setAttribute('aria-hidden', 'true');
  }

  function openSection(section) {
    sections.forEach((candidate) => {
      if (candidate !== section) closeSection(candidate);
    });
    section.classList.add('is-open');
    const button = section.querySelector('.su-mobile-nav-trigger');
    const panel = section.querySelector('.su-mobile-submenu');
    if (button) button.setAttribute('aria-expanded', 'true');
    if (panel) panel.setAttribute('aria-hidden', 'false');
  }

  sections.forEach((section) => {
    const button = section.querySelector('.su-mobile-nav-trigger');
    if (!button) return;
    button.addEventListener('click', () => {
      if (section.classList.contains('is-open')) closeSection(section);
      else openSection(section);
    });
  });

  /* Keep Account text simple; delegate authentication routing to the site's existing account control. */
  account?.addEventListener('click', (event) => {
    event.preventDefault();
    const originalAccount = document.getElementById('account-link');
    if (originalAccount && originalAccount !== account) {
      originalAccount.click();
      return;
    }
    window.location.href = '/login.html';
  });

  /* Existing menu handler still opens/closes the drawer. This observer keeps the new icon synchronized. */
  const syncDrawerState = () => {
    const open = sidebar.classList.contains('active');
    menuIcon?.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) sections.forEach(closeSection);
  };

  new MutationObserver(syncDrawerState).observe(sidebar, { attributes: true, attributeFilter: ['class'] });

  /* Language can change either from the language popup or automatically when country/location changes. */
  applyLanguage();
  window.addEventListener('sucesso:country-change', applyLanguage);
  window.addEventListener('storage', (event) => {
    if (event.key === 'preferredLang') applyLanguage();
  });
  new MutationObserver(applyLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
