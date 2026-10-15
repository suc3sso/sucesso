(function () {
  'use strict';

  const desktopMQ = window.matchMedia('(min-width: 1536px) and (hover: hover) and (pointer: fine)');
  const destinations = {
    shop: 'index.html#products',
    collections: 'collections/dice-drp/',
    support: 'contactanos.html',
    brand: 'about.html'
  };

  let closeTimer = null;
  let activeItem = null;
  let clickGuardInstalled = false;
  let lastScrollY = window.scrollY || 0;

  function isTShirtsPage(){
    /* T-Shirts now uses the same independent fixed-strip mechanism as Dice Drp.
       Navbar dropdowns therefore behave normally on this route. */
    return false;
  }

  function routeIsTShirtsPage(){
    const p=(location.pathname||'').toLowerCase();
    return ((p.includes('/collections/t-shirts/') && !p.includes('/products/')) ||
            p.endsWith('/t-shirts.html') || p.endsWith('/tees.html'));
  }

  function shopItem(){ return document.getElementById('nav-shop'); }

  function pinTShirtsMenu(){
    if(!desktopMQ.matches || !isTShirtsPage()) return;
    document.body.classList.add('su-tshirts-page');
    const item=shopItem();
    if(!item || (activeItem && activeItem!==item)) return;
    const dd=item.querySelector(':scope > .dropdown');
    const arrow=item.querySelector(':scope > .nav-arrow');
    const link=dd?.querySelector('[data-i18n="nav_tees"], a[href*="t-shirts"]');
    if(!dd) return;
    positionDropdown(item);
    item.classList.add('su-hover-open','su-tshirts-pinned');
    if(arrow) arrow.setAttribute('aria-expanded','true');
    if(link) link.classList.add('active');
    dd.hidden=false;
    requestAnimationFrame(()=>dd.classList.add('is-visible'));
    activeItem=item;
  }

  function unpinTShirtsMenu(){
    const item=shopItem();
    item?.classList.remove('su-tshirts-pinned');
  }

  function itemRole(item) {
    return item?.dataset?.navRole || item?.id?.replace(/^nav-/, '') || '';
  }

  function resetLegacyState(item) {
    if (!item) return;
    item.classList.remove('open', 'locked', 'brand-arrow-down', 'support-arrow-down');
    item.querySelectorAll('.about-sticky').forEach(el => el.classList.remove('about-sticky'));
    item.querySelectorAll('.dropdown-item.active').forEach(link => link.classList.remove('active', 'deemphasize'));
    const arrow = item.querySelector('.nav-arrow');
    if (arrow) {
      arrow.removeAttribute('aria-disabled');
      arrow.style.pointerEvents = '';
      arrow.style.cursor = '';
      arrow.setAttribute('aria-expanded', 'false');
    }
  }

  function closeItem(item, immediate) {
    if (!item) return;
    resetLegacyState(item);
    item.classList.remove('su-hover-open');
    const dd = item.querySelector(':scope > .dropdown');
    if (!dd) return;
    dd.classList.remove('is-visible');
    if (immediate) {
      dd.hidden = true;
    } else {
      window.setTimeout(() => {
        if (!item.classList.contains('su-hover-open')) dd.hidden = true;
      }, 180);
    }
    if (activeItem === item) activeItem = null;
  }

  function closeAll(except, immediate) {
    document.querySelectorAll('.nav-desktop .nav-item.has-dropdown').forEach(item => {
      if (item !== except) closeItem(item, immediate);
    });
  }

  function positionDropdown(item) {
    if (!item) return;
    const dd = item.querySelector(':scope > .dropdown');
    const main = item.querySelector(':scope > .nav-main');
    const navbar = document.querySelector('header.navbar, .navbar, header');
    if (!dd || !main || !navbar) return;

    const navRect = navbar.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const safeLeft = Math.max(24, Math.min(mainRect.left, viewportWidth - 80));

    dd.style.setProperty('--sucesso-navbar-bottom', `${Math.max(0, Math.round(navRect.bottom))}px`);
    dd.style.setProperty('--sucesso-dropdown-left', `${Math.round(safeLeft)}px`);
    dd.style.setProperty('--sucesso-page-gutter', `${Math.max(24, Math.round(Math.min(48, viewportWidth * 0.03)))}px`);
  }

  function openItem(item) {
    if (!desktopMQ.matches || !item) return;
    if(isTShirtsPage() && item===shopItem()){ pinTShirtsMenu(); return; }
    window.clearTimeout(closeTimer);
    if(isTShirtsPage() && item!==shopItem()) unpinTShirtsMenu();
    closeAll(item, true);
    resetLegacyState(item);
    const dd = item.querySelector(':scope > .dropdown');
    const arrow = item.querySelector(':scope > .nav-arrow');
    if (!dd) return;
    positionDropdown(item);
    item.classList.add('su-hover-open');
    if (arrow) arrow.setAttribute('aria-expanded', 'true');
    dd.hidden = false;
    requestAnimationFrame(() => dd.classList.add('is-visible'));
    activeItem = item;
  }

  function scheduleClose(item) {
    if(isTShirtsPage() && item===shopItem() && item?.classList.contains('su-tshirts-pinned')) return;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      closeItem(item, false);
      if(isTShirtsPage()) window.setTimeout(pinTShirtsMenu,190);
    }, 130);
  }

  function cloneInteractiveButtons(item) {
    ['.nav-main', '.nav-arrow'].forEach(selector => {
      const oldButton = item.querySelector(`:scope > ${selector}`);
      if (!oldButton || oldButton.dataset.suHoverCloned === '1') return;
      const clone = oldButton.cloneNode(true);
      clone.dataset.suHoverCloned = '1';
      clone.removeAttribute('aria-disabled');
      clone.style.pointerEvents = '';
      clone.style.cursor = '';
      oldButton.replaceWith(clone);
    });
  }

  function normalizeAll() {
    document.querySelectorAll('.nav-desktop .nav-item.has-dropdown').forEach(item => {
      resetLegacyState(item);
      item.classList.remove('su-hover-open');
      cloneInteractiveButtons(item);
      const dd = item.querySelector(':scope > .dropdown');
      if (dd) {
        dd.hidden = true;
        dd.classList.remove('is-visible');
      }
    });
  }

  function bindHover() {
    document.querySelectorAll('.nav-desktop .nav-item.has-dropdown').forEach(item => {
      if (item.dataset.suHoverBound === '1') return;
      item.dataset.suHoverBound = '1';
      const dd = item.querySelector(':scope > .dropdown');

      const isTShirtsShop = routeIsTShirtsPage() && itemRole(item) === 'shop';

      /* On the T-Shirts listing only, SHOP keeps its arrow pointing down but
         hovering SHOP must NOT open its dropdown. Other navbar items keep the
         normal hover-dropdown behavior. */
      if (!isTShirtsShop) {
        item.addEventListener('mouseenter', () => openItem(item));
        item.addEventListener('mouseleave', () => scheduleClose(item));
        item.addEventListener('focusin', () => openItem(item));
        item.addEventListener('focusout', event => {
          if (!item.contains(event.relatedTarget)) scheduleClose(item);
        });

        if (dd) {
          dd.addEventListener('mouseenter', () => window.clearTimeout(closeTimer));
          dd.addEventListener('mouseleave', () => scheduleClose(item));
        }
      }
    });
  }

  function installClickGuard() {
    if (clickGuardInstalled) return;
    clickGuardInstalled = true;
    document.addEventListener('click', event => {
      const main = event.target.closest('.nav-desktop .nav-item.has-dropdown > .nav-main');
      const arrow = event.target.closest('.nav-desktop .nav-item.has-dropdown > .nav-arrow');
      if (main) {
        const item = main.closest('.nav-item.has-dropdown');
        const role = itemRole(item);
        const url = destinations[role];
        if (url) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.location.href = new URL(url, document.baseURI).href;
        }
        return;
      }
      if (arrow) {
        const item = arrow.closest('.nav-item.has-dropdown');
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!desktopMQ.matches) return;
        if(isTShirtsPage() && item===shopItem()){ pinTShirtsMenu(); return; }
        if (item.classList.contains('su-hover-open')) { closeItem(item, false); if(isTShirtsPage()) window.setTimeout(pinTShirtsMenu,190); }
        else openItem(item);
        return;
      }
      if (!event.target.closest('.nav-desktop .nav-item.has-dropdown')) {
        closeAll(null, false);
        if(isTShirtsPage()) window.setTimeout(pinTShirtsMenu,190);
      }
    }, true);
  }

  function enforceNoPinnedMenus() {
    if (!desktopMQ.matches) return;
    document.querySelectorAll('.nav-desktop .nav-item.has-dropdown').forEach(item => {
      if (!item.classList.contains('su-hover-open')) {
        item.classList.remove('open', 'locked', 'brand-arrow-down', 'support-arrow-down');
        const arrow = item.querySelector(':scope > .nav-arrow');
        if (arrow) {
          arrow.removeAttribute('aria-disabled');
          arrow.style.pointerEvents = '';
          arrow.style.cursor = '';
          arrow.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  function init() {
    if (isTShirtsPage()) return;
    normalizeAll();
    bindHover();
    installClickGuard();
    closeAll(null, true);
    // Some legacy page scripts set an open state at DOMContentLoaded; clear it after they finish.
    requestAnimationFrame(() => closeAll(null, true));
    window.setTimeout(() => closeAll(null, true), 0);
    window.setTimeout(enforceNoPinnedMenus, 80);
    if(isTShirtsPage()) window.setTimeout(pinTShirtsMenu,100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  window.addEventListener('resize', () => {
    if (isTShirtsPage()) return;
    closeAll(null, true);
    window.setTimeout(enforceNoPinnedMenus, 0);
    if(isTShirtsPage()) window.setTimeout(pinTShirtsMenu,30);
  }, { passive: true });

  window.addEventListener('scroll', () => {
    if(isTShirtsPage()) return;
    if(!desktopMQ.matches) return;
    const y=window.scrollY||0;
    if(y>90 && y>lastScrollY+2) document.body.classList.add('su-nav-scrolled-down');
    else if(y<lastScrollY-2 || y<40) document.body.classList.remove('su-nav-scrolled-down');
    lastScrollY=y;
    window.requestAnimationFrame(pinTShirtsMenu);
  }, { passive:true });

  desktopMQ.addEventListener('change', () => {
    if (isTShirtsPage()) return;
    closeAll(null, true);
    normalizeAll();
    bindHover();
  });
})();
