(function(){
  'use strict';

  const desktop = window.matchMedia('(min-width:1536px) and (hover:hover) and (pointer:fine)');
  let lastY = window.scrollY || 0;
  let restoreTimer = null;
  let collectionCloseTimer = null;
  let overShared = false;
  let currentProxy = 'shop';

  function routeIsTShirts(){
    const p=(location.pathname||'').toLowerCase();
    return (p.includes('/collections/t-shirts/') && !p.includes('/products/')) || p.endsWith('/tees.html') || p.endsWith('/t-shirts.html');
  }

  function abs(url){ return new URL(url, document.baseURI).href; }
  function q(id){ return document.getElementById(id); }

  function stripLeftFor(item){
    const main=item?.querySelector(':scope > .nav-main');
    if(!main) return 28;
    const r=main.getBoundingClientRect();
    return Math.max(28,Math.round(r.left));
  }

  function setArrow(item,open){
    if(!item) return;
    item.classList.toggle('su-proxy-open',!!open);
    const a=item.querySelector(':scope > .nav-arrow');
    if(a) a.setAttribute('aria-expanded',open?'true':'false');
  }

  function clearArrows(){
    ['nav-shop','nav-support','nav-brand','nav-collections'].forEach(id=>setArrow(q(id),false));
  }

  function renderSharedLink(strip,{href,label,i18n,active}){
    if(!strip) return;
    strip.classList.remove('su-shared-content-visible');
    strip.innerHTML=`<a class="dropdown-item su-shared-link${active?' is-current':''}" href="${href}" data-i18n="${i18n}">${label}</a>`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>strip.classList.add('su-shared-content-visible')));
  }

  function closeCollections(){
    clearTimeout(collectionCloseTimer);
    const item=q('nav-collections');
    const dd=item?.querySelector(':scope > .dropdown.collection-dropdown');
    if(item) item.classList.remove('su-hover-open','open');
    setArrow(item,false);
    if(dd){
      dd.classList.remove('is-visible');
      setTimeout(()=>{ if(!item?.classList.contains('su-hover-open')) dd.hidden=true; },120);
    }
  }

  function showShared(role='shop'){
    if(!desktop.matches) return;
    const shop=q('nav-shop');
    const strip=shop?.querySelector(':scope > .dropdown');
    if(!shop||!strip) return;

    closeCollections();
    clearTimeout(restoreTimer);
    currentProxy=role;
    document.body.classList.add('su-tshirts-special-nav');

    let owner=shop, href='collections/t-shirts/', label='T-SHIRTS', i18n='nav_tees', active=true;
    if(role==='support'){
      owner=q('nav-support')||shop; href='contactanos.html'; label=(document.documentElement.lang||'es').toLowerCase().startsWith('en')?'Contact':'Contacto'; i18n='contact_us'; active=false;
    } else if(role==='brand'){
      owner=q('nav-brand')||shop; href='about.html'; label=(document.documentElement.lang||'es').toLowerCase().startsWith('en')?'About Us':'Sobre Nosotros'; i18n='nav_about'; active=false;
    }

    strip.classList.add('su-tshirts-shared-strip');
    strip.classList.remove('su-strip-hidden');
    strip.hidden=false;
    strip.style.setProperty('--su-strip-left',`${stripLeftFor(owner)}px`);
    renderSharedLink(strip,{href,label,i18n,active});

    clearArrows();
    setArrow(owner,true);
    strip.classList.add('is-visible');
  }

  function hideShared(){
    const strip=q('nav-shop')?.querySelector(':scope > .dropdown');
    if(!strip) return;
    strip.classList.add('su-strip-hidden');
    strip.classList.remove('is-visible','su-shared-content-visible');
  }

  function openCollections(){
    if(!desktop.matches) return;
    clearTimeout(restoreTimer);
    clearTimeout(collectionCloseTimer);
    hideShared();
    clearArrows();
    const item=q('nav-collections');
    const dd=item?.querySelector(':scope > .dropdown.collection-dropdown');
    if(!item||!dd) return;
    const nav=document.querySelector('header.navbar');
    const nr=nav?.getBoundingClientRect();
    const navBottom=Math.max(0,Math.round(nr?.bottom||70));
    dd.style.setProperty('--sucesso-navbar-bottom',`${navBottom}px`);
    dd.style.setProperty('--su-collections-top',`${navBottom}px`);
    document.body.style.setProperty('--su-collections-top',`${navBottom}px`);
    item.classList.add('su-hover-open');
    setArrow(item,true);
    dd.hidden=false;
    requestAnimationFrame(()=>dd.classList.add('is-visible'));
  }

  function scheduleCollectionsClose(delay=180){
    clearTimeout(collectionCloseTimer);
    collectionCloseTimer=setTimeout(()=>{
      const item=q('nav-collections');
      const dd=item?.querySelector(':scope > .dropdown.collection-dropdown');
      if(item?.matches(':hover') || dd?.matches(':hover')) return;
      closeCollections();
      scheduleRestore(35);
    },delay);
  }

  function scheduleRestore(delay=45){
    clearTimeout(restoreTimer);
    restoreTimer=setTimeout(()=>{
      if(overShared) return;
      const hovered=document.querySelector('.nav-desktop .nav-item.has-dropdown:hover');
      if(hovered) return;
      showShared('shop');
    },delay);
  }

  function cloneDesktopNav(){
    const old=document.querySelector('.nav-desktop');
    if(!old) return null;
    const clone=old.cloneNode(true);
    old.replaceWith(clone);
    return clone;
  }

  function setup(){
    if(!routeIsTShirts() || !desktop.matches) return;
    document.body.classList.add('su-tshirts-page','su-tshirts-special-nav');

    const nav=cloneDesktopNav();
    if(!nav) return;

    const shop=q('nav-shop'), collections=q('nav-collections'), support=q('nav-support'), brand=q('nav-brand');
    const shopDD=shop?.querySelector(':scope > .dropdown');
    const supportDD=support?.querySelector(':scope > .dropdown');
    const brandDD=brand?.querySelector(':scope > .dropdown');
    if(supportDD) supportDD.hidden=true;
    if(brandDD) brandDD.hidden=true;

    // Default fixed T-Shirts strip.
    showShared('shop');

    const bindProxy=(item,role,href)=>{
      if(!item) return;
      const main=item.querySelector(':scope > .nav-main');
      const arrow=item.querySelector(':scope > .nav-arrow');
      const enter=()=>showShared(role);
      const leave=(e)=>{
        const strip=shopDD;
        if(strip && e.relatedTarget && strip.contains(e.relatedTarget)) return;
        scheduleRestore(55);
      };
      item.addEventListener('mouseenter',enter);
      item.addEventListener('mouseleave',leave);
      main?.addEventListener('click',e=>{ e.preventDefault(); window.location.href=abs(href); });
      arrow?.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); showShared(role); });
    };

    // Shop itself keeps the fixed T-Shirts strip. Clicking SHOP goes to home products.
    if(shop){
      const main=shop.querySelector(':scope > .nav-main');
      const arrow=shop.querySelector(':scope > .nav-arrow');
      main?.addEventListener('mouseenter',()=>showShared('shop'));
      arrow?.addEventListener('mouseenter',()=>showShared('shop'));
      main?.addEventListener('click',e=>{e.preventDefault();window.location.href=abs('index.html#products');});
      arrow?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showShared('shop');});
    }

    bindProxy(support,'support','contactanos.html');
    bindProxy(brand,'brand','about.html');

    if(collections){
      const main=collections.querySelector(':scope > .nav-main');
      const arrow=collections.querySelector(':scope > .nav-arrow');
      const collectionsDD=collections.querySelector(':scope > .dropdown.collection-dropdown');

      collections.addEventListener('mouseenter',()=>{
        clearTimeout(collectionCloseTimer);
        openCollections();
      });
      collections.addEventListener('mouseleave',e=>{
        if(collectionsDD && e.relatedTarget && collectionsDD.contains(e.relatedTarget)) return;
        scheduleCollectionsClose(220);
      });

      collectionsDD?.addEventListener('mouseenter',()=>{
        clearTimeout(collectionCloseTimer);
        clearTimeout(restoreTimer);
      });
      collectionsDD?.addEventListener('mouseleave',e=>{
        if(e.relatedTarget && collections.contains(e.relatedTarget)) return;
        scheduleCollectionsClose(140);
      });

      main?.addEventListener('click',e=>{e.preventDefault();window.location.href=abs('collections/dice-drp/');});
      arrow?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openCollections();});
    }

    if(shopDD){
      shopDD.addEventListener('mouseenter',()=>{overShared=true;clearTimeout(restoreTimer);});
      shopDD.addEventListener('mouseleave',()=>{overShared=false;showShared('shop');});
    }

    document.addEventListener('mousemove',e=>{
      if(!desktop.matches) return;
      const item=e.target.closest?.('.nav-desktop .nav-item.has-dropdown');
      if(item) return;
      if(shopDD?.contains(e.target)) return;
      if(currentProxy!=='shop' && !q('nav-collections')?.classList.contains('su-hover-open')) scheduleRestore(35);
    },{passive:true});

    // Navbar + fixed strip move as one unit during vertical scrolling.
    window.addEventListener('scroll',()=>{
      const y=window.scrollY||0;
      if(y>90 && y>lastY+2) document.body.classList.add('su-nav-scrolled-down');
      else if(y<lastY-2 || y<40) document.body.classList.remove('su-nav-scrolled-down');
      lastY=y;
      if(q('nav-collections')?.classList.contains('su-hover-open')){closeCollections();showShared('shop');}
    },{passive:true});
  }

  function start(){
    if(!routeIsTShirts()) return;
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0),{once:true});
    }else setTimeout(setup,0);
  }

  start();
})();
