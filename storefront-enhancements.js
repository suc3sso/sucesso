(function(){
  'use strict';

  function currentPath(){ return (location.pathname || '').toLowerCase(); }
  function context(){
    const path=currentPath();
    if(path.includes('/collections/dice-drp/')) return 'dice-drp';
    if(path.includes('/collections/t-shirts/')) return 't-shirts';
    if(path.endsWith('/t-shirts.html') || path.endsWith('/tees.html') || document.body?.classList.contains('tees-page')) return 't-shirts';
    return 'root';
  }
  const PRODUCT_NAME_MAP = Object.freeze({
    'Sucesso Jackpot Tee':'Jackpot Casino Oversized Tee',
    'Cherry Dice Tee':'Cherry Dice Oversized Tee',
    'Chinese Success Tee':'Chinese Chowmein Oversized Tee',
    'Crayon Tee':'Crayon Art Oversized Tee'
  });
  function displayProductName(value){
    const raw=String(value??'');
    return PRODUCT_NAME_MAP[raw] || raw;
  }
  function replaceProductNamesInText(value){
    let out=String(value??'');
    for(const [oldName,newName] of Object.entries(PRODUCT_NAME_MAP)){
      if(out.includes(oldName)) out=out.split(oldName).join(newName);
    }
    return out;
  }
  function slugify(value){
    return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  }
  function productHref(slug, forcedContext){
    const s=slugify(slug);
    if(!s) return '#';
    const ctx=forcedContext || context();
    if(ctx==='dice-drp') return `collections/dice-drp/products/${s}/`;
    if(ctx==='t-shirts') return `collections/t-shirts/products/${s}/`;
    return `products/${s}/`;
  }
  function slugFromProductHref(href){
    if(!href) return '';
    try{
      const url=new URL(href, document.baseURI);
      const q=url.searchParams.get('nombre');
      if(q) return slugify(q);
      const m=url.pathname.match(/\/(?:products)\/([^/]+)\/?$/i);
      if(m) return slugify(m[1]);
    }catch(_){ }
    return '';
  }
  window.SucessoStorefront={context,slugify,productHref,slugFromProductHref,displayProductName};

  function rewriteProductAnchor(a){
    if(!(a instanceof HTMLAnchorElement)) return;
    const raw=a.getAttribute('href')||'';
    let slug='';
    if(/product-page\.html/i.test(raw)) slug=slugFromProductHref(raw);
    if(!slug){
      const card=a.closest('[data-tee-slug],[data-su-slug],[data-related-slug],[data-wishlist-slug]');
      slug=card?.dataset?.teeSlug || card?.dataset?.suSlug || card?.dataset?.relatedSlug || card?.dataset?.wishlistSlug || '';
    }
    if(!slug) return;
    a.setAttribute('href', productHref(slug));
  }
  function rewriteProductLinks(scope=document){
    scope.querySelectorAll?.('a[href*="product-page.html"], [data-tee-slug] a, [data-su-slug] a, [data-related-slug] a').forEach(rewriteProductAnchor);
  }

  function formatNumberString(n){
    const num=Number(String(n).replace(',', '.'));
    if(!Number.isFinite(num)) return n;
    return num.toFixed(2);
  }
  function formatPriceText(value){
    if(!value || !value.includes('$')) return value;
    let out=value;
    out=out.replace(/\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/g,(m,n)=>`$${formatNumberString(String(n).replace(',','.'))}`);
    out=out.replace(/([0-9]+(?:[.,][0-9]{1,2})?)\s*\$/g,(m,n)=>`$${formatNumberString(String(n).replace(',','.'))}`);
    return out;
  }
  function formatTextNode(node){
    if(!node || node.nodeType!==Node.TEXT_NODE) return;
    const parent=node.parentElement;
    if(!parent || parent.closest('script,style,textarea,pre,code')) return;
    const next=formatPriceText(replaceProductNamesInText(node.nodeValue));
    if(next!==node.nodeValue) node.nodeValue=next;
  }
  function scanProductNameAttributes(scope=document){
    const nodes=[];
    if(scope?.nodeType===Node.ELEMENT_NODE) nodes.push(scope);
    scope.querySelectorAll?.('[aria-label],[alt],[title],[data-tee-name],[data-product-name]').forEach(el=>nodes.push(el));
    for(const el of nodes){
      for(const attr of ['aria-label','alt','title','data-tee-name','data-product-name']){
        if(!el.hasAttribute?.(attr)) continue;
        const raw=el.getAttribute(attr);
        const next=replaceProductNamesInText(raw);
        if(next!==raw) el.setAttribute(attr,next);
      }
    }
  }
  function scanPrices(scope=document){
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
    const nodes=[]; let n;
    while((n=walker.nextNode())) nodes.push(n);
    nodes.forEach(formatTextNode);
  }

  function scan(scope=document){ rewriteProductLinks(scope); scanProductNameAttributes(scope); scanPrices(scope); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>scan(document),{once:true});
  else scan(document);

  const observer=new MutationObserver(records=>{
    for(const rec of records){
      if(rec.type==='characterData') formatTextNode(rec.target);
      rec.addedNodes?.forEach(node=>{
        if(node.nodeType===Node.TEXT_NODE) formatTextNode(node);
        else if(node.nodeType===Node.ELEMENT_NODE) scan(node);
      });
    }
  });
  const start=()=>{ if(document.body) observer.observe(document.body,{childList:true,subtree:true,characterData:true}); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();

/* SUCESSO product-card two-image gallery controls */
(function(){
  'use strict';

  const CARD_SELECTOR = '.related-product-card';
  const MEDIA_SELECTOR = '.related-product-media';
  const FRONT_SELECTOR = '.related-product-front';
  const BACK_SELECTOR = '.related-product-back';
  const fineHover = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;

  function isFineHover(){
    return fineHover ? fineHover.matches : true;
  }

  function clearManual(card){
    card.classList.remove('su-gallery-show-front','su-gallery-show-back');
  }

  function showIndex(card, index){
    const normalized = index === 1 ? 1 : 0;
    card.dataset.suGalleryIndex = String(normalized);
    card.classList.toggle('su-gallery-show-front', normalized === 0);
    card.classList.toggle('su-gallery-show-back', normalized === 1);
  }

  function arrowSvg(direction){
    return direction === 'prev'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5 7.5 12l7 7"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.5 5 7 7-7 7"/></svg>';
  }

  function languageLabel(direction){
    const lang = (document.documentElement.lang || 'en').toLowerCase();
    const spanish = lang.startsWith('es');
    if(direction === 'prev') return spanish ? 'Imagen anterior' : 'Previous image';
    return spanish ? 'Imagen siguiente' : 'Next image';
  }

  function updateArrowLabels(card){
    card.querySelectorAll('.su-product-gallery-arrow').forEach(button => {
      const direction = button.dataset.galleryDirection;
      button.setAttribute('aria-label', languageLabel(direction));
    });
  }

  function enhanceCard(card){
    if(!(card instanceof Element) || card.classList.contains('su-gallery-card')) return;

    const media = card.querySelector(MEDIA_SELECTOR);
    const front = media?.querySelector(FRONT_SELECTOR);
    const back = media?.querySelector(BACK_SELECTOR);
    if(!media || !front || !back) return;

    card.classList.add('su-gallery-card');
    card.dataset.suGalleryIndex = '0';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'su-product-gallery-arrow su-product-gallery-arrow--prev';
    prev.dataset.galleryDirection = 'prev';
    prev.innerHTML = arrowSvg('prev');

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'su-product-gallery-arrow su-product-gallery-arrow--next';
    next.dataset.galleryDirection = 'next';
    next.innerHTML = arrowSvg('next');

    media.append(prev, next);
    updateArrowLabels(card);

    media.addEventListener('pointerenter', () => {
      if(!isFineHover()) return;
      clearManual(card);
      // Hover itself reveals the second image, matching the reference behavior.
      card.dataset.suGalleryIndex = '1';
    });

    media.addEventListener('pointerleave', () => {
      if(!isFineHover()) return;
      clearManual(card);
      card.dataset.suGalleryIndex = '0';
      const focused = media.querySelector('.su-product-gallery-arrow:focus');
      if(focused && typeof focused.blur === 'function') focused.blur();
    });

    media.addEventListener('click', event => {
      const arrow = event.target.closest('.su-product-gallery-arrow');
      if(!arrow) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const current = Number(card.dataset.suGalleryIndex || 0) === 1 ? 1 : 0;
      const direction = arrow.dataset.galleryDirection;
      const delta = direction === 'prev' ? -1 : 1;
      const nextIndex = (current + delta + 2) % 2;
      showIndex(card, nextIndex);
      arrow.focus({ preventScroll:true });
    }, true);
  }

  function scan(scope){
    if(!scope) return;
    if(scope.matches?.(CARD_SELECTOR)) enhanceCard(scope);
    scope.querySelectorAll?.(CARD_SELECTOR).forEach(enhanceCard);
  }

  function init(){
    scan(document);

    const observer = new MutationObserver(records => {
      for(const record of records){
        record.addedNodes.forEach(node => {
          if(node.nodeType === Node.ELEMENT_NODE) scan(node);
        });
      }
    });
    if(document.body) observer.observe(document.body,{childList:true,subtree:true});

    const langObserver = new MutationObserver(() => {
      document.querySelectorAll('.su-gallery-card').forEach(updateArrowLabels);
    });
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once:true });
  }else{
    init();
  }
})();
