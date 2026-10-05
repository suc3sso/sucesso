(() => {
  const DESCRIPTIONS = {
    'sucesso-jackpot-tee': {
      en: 'Life is a game, risk it and bet everything (on black)...',
      es: 'Life is a game, risk it and bet everything (on black)...'
    },
    'cherry-dice-tee': {
      en: 'Too F*cking Succesful, that’s who I am...  —My future self',
      es: 'Too F*cking Succesful, that’s who I am...  —My future self'
    },
    'chinese-success-tee': {
      en: 'I don’t know what the f*ck says, it just looks gorgeous...',
      es: 'I don’t know what the f*ck says, it just looks gorgeous...'
    },
    'crayon-tee': {
      en: 'Really a damn work of art...  —A 5yo kid',
      es: 'Really a damn work of art...  —A 5yo kid'
    }
  };

  function currentLanguage(){
    const html=(document.documentElement.lang||'').toLowerCase();
    const stored=(localStorage.getItem('preferredLang')||'').toLowerCase();
    return html.startsWith('es') || (!html && stored==='es') ? 'es' : 'en';
  }

  function currentSlug(){
    const pathMatch=(location.pathname||'').match(/\/products\/([^/]+)\/?$/i);
    if(pathMatch) return pathMatch[1];
    return new URLSearchParams(location.search).get('nombre') || '';
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const description=document.getElementById('product-description');
    const productName=document.getElementById('product-name');
    const drawerName=document.getElementById('size-guide-product-name');
    const trigger=document.getElementById('size-fit-guide-trigger');
    const secondaryTrigger=document.getElementById('size-guide-secondary-trigger');
    const overlay=document.getElementById('size-guide-drawer-overlay');
    const drawer=document.getElementById('size-guide-drawer');
    const close=document.getElementById('close-size-guide');
    const slug=currentSlug();

    function renderDescription(){
      if(!description) return;
      const item=DESCRIPTIONS[slug];
      if(!item){ description.textContent=''; return; }
      description.textContent=item[currentLanguage()] || item.en;
    }

    function syncProductName(){
      if(drawerName && productName) drawerName.textContent=productName.textContent.trim();
    }

    function openGuide(){
      if(!overlay) return;
      syncProductName();
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden','false');
      if(trigger) trigger.setAttribute('aria-expanded','true');
      if(secondaryTrigger) secondaryTrigger.setAttribute('aria-expanded','true');
      document.documentElement.classList.add('sucesso-size-guide-open');
      document.body.classList.add('sucesso-size-guide-open');
      requestAnimationFrame(()=>close?.focus({preventScroll:true}));
    }

    function closeGuide(){
      if(!overlay) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden','true');
      if(trigger) trigger.setAttribute('aria-expanded','false');
      if(secondaryTrigger) secondaryTrigger.setAttribute('aria-expanded','false');
      document.documentElement.classList.remove('sucesso-size-guide-open');
      document.body.classList.remove('sucesso-size-guide-open');
      trigger?.focus({preventScroll:true});
    }

    [trigger,secondaryTrigger].forEach((button)=>button?.addEventListener('click',(event)=>{
      event.preventDefault();
      openGuide();
    }));
    close?.addEventListener('click',(event)=>{
      event.preventDefault();
      closeGuide();
    });
    overlay?.addEventListener('click',(event)=>{
      if(event.target===overlay) closeGuide();
    });
    drawer?.addEventListener('click',(event)=>event.stopPropagation());
    document.addEventListener('keydown',(event)=>{
      if(event.key==='Escape' && overlay?.classList.contains('active')) closeGuide();
    });

    renderDescription();
    // product-page.js fills the product title during the same DOMContentLoaded cycle.
    requestAnimationFrame(syncProductName);

    const langObserver=new MutationObserver(()=>{
      renderDescription();
      requestAnimationFrame(syncProductName);
    });
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    window.addEventListener('storage',(event)=>{
      if(event.key==='preferredLang') renderDescription();
    });
  });
})();

/* SUCESSO product media: always open at the true first gallery position.
   Do not synthesize wheel movement; native wheel/trackpad scrolling is kept
   one-to-one.  This only prevents a browser-restored inner-gallery position
   from making a product open halfway through its first/second image. */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('main.product-page .image-scroll-container');
    if (!gallery) return;
    if (matchMedia('(min-width:769px)').matches) {
      gallery.scrollTop = 0;
    } else {
      gallery.scrollLeft = 0;
    }
  });
})();
