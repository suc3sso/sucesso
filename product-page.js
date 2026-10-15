// SUCESSO product page: product data, clean routes, breadcrumb and gallery state.
document.addEventListener("DOMContentLoaded", () => {
  const fallbackSlug = new URLSearchParams(window.location.search).get("nombre") || "";
  const pathMatch = window.location.pathname.match(/\/products\/([^/]+)\/?$/i);
  const nombre = (pathMatch && pathMatch[1]) || fallbackSlug;

  const productos = [
    { name:"Jackpot Casino Oversized Tee", slug:"sucesso-jackpot-tee", price:30, imageFront:"images/jackpot-front.png", imageBack:"images/jackpot-back.png" },
    { name:"Cherry Dice Oversized Tee", slug:"cherry-dice-tee", price:30, imageFront:"images/cherry-dice-front.png", imageBack:"images/cherry-dice-back.png" },
    { name:"Chinese Chowmein Oversized Tee", slug:"chinese-success-tee", price:25, imageFront:"images/chinese-front.png", imageBack:"images/chinese-back.png" },
    { name:"Crayon Art Oversized Tee", slug:"crayon-tee", price:40, imageFront:"images/crayon-front.png", imageBack:"images/crayon-back.png" }
  ];

  const producto = productos.find(p => p.slug === nombre || p.name === nombre);
  const info = document.querySelector('.product-info');
  if (!producto) {
    if (info) info.innerHTML = `<h2>Producto no encontrado</h2><p>El producto que buscas no existe o fue removido.</p><a href="collections/t-shirts/" style="display:inline-block;margin-top:1rem;color:#233f32;">Volver a T-Shirts</a>`;
    return;
  }

  document.title = `${producto.name} - Sucesso`;
  document.getElementById('product-name').textContent = producto.name;
  document.getElementById('product-price').textContent = `$${Number(producto.price).toFixed(2)}`;

  // Product-specific details: preserve each tee's actual printing method.
  const printDetail = document.querySelector('.product-details-list li:nth-child(2)');
  if (printDetail) {
    const screenPrinted = producto.slug === 'cherry-dice-tee' || producto.slug === 'sucesso-jackpot-tee';
    printDetail.setAttribute('data-i18n', screenPrinted ? 'product_detail_screenprint_both' : 'product_detail_printed_both');
    // Immediate fallback; the language system will replace this with the active translation.
    printDetail.textContent = screenPrinted
      ? 'Screen-printed design on the front and back.'
      : 'Printed design on the front and back.';
  }
  const front=document.getElementById('product-image-front');
  const back=document.getElementById('product-image-back');
  if(front) front.src=producto.imageFront;
  if(back) back.src=producto.imageBack;
  const tf=document.getElementById('product-thumb-front');
  const tb=document.getElementById('product-thumb-back');
  if(tf) tf.src=producto.imageFront;
  if(tb) tb.src=producto.imageBack;
  const desc=document.getElementById('product-description');
  if(desc) desc.textContent=producto.description || '';

  // Breadcrumb depends on how the product URL was reached.
  const path=(location.pathname||'').toLowerCase();
  const contextLink=document.getElementById('product-context-link');
  const contextName=document.getElementById('product-context-name');
  if(contextName) contextName.textContent=producto.name;
  if(contextLink){
    if(path.includes('/collections/dice-drp/products/')){
      contextLink.textContent='DICE DRP';
      contextLink.href='collections/dice-drp/';
    }else{
      contextLink.textContent='T-Shirts';
      contextLink.href='collections/t-shirts/';
    }
  }

  // Accordions: open section keeps its label underlined while open.
  document.querySelectorAll('.info-button').forEach(button => {
    button.addEventListener('click', () => {
      const content=document.getElementById(button.getAttribute('data-target'));
      if(!content) return;
      const isOpen=content.classList.contains('open');
      document.querySelectorAll('.info-content').forEach(el=>el.classList.remove('open'));
      document.querySelectorAll('.info-button').forEach(btn=>btn.classList.remove('open'));
      if(!isOpen){ content.classList.add('open'); button.classList.add('open'); }
    });
  });

  // Product thumbnail rail. Hovering or focusing a thumbnail glides the main image stack.
  const scroll=document.querySelector('.image-scroll-container');
  const boxes=Array.from(document.querySelectorAll('.image-box'));
  const thumbs=Array.from(document.querySelectorAll('.product-thumbnail'));
  function setActiveThumb(index){ thumbs.forEach((b,i)=>b.classList.toggle('is-active',i===index)); }
  function goTo(index){
    const target=boxes[index];
    if(!scroll||!target) return;
    const mobile=matchMedia('(max-width:768px)').matches;
    if(mobile) scroll.scrollTo({left:target.offsetLeft,behavior:'smooth'});
    else scroll.scrollTo({top:target.offsetTop,behavior:'smooth'});
    setActiveThumb(index);
  }
  thumbs.forEach((thumb,index)=>{
    thumb.addEventListener('mouseenter',()=>goTo(index));
    thumb.addEventListener('focus',()=>goTo(index));
    thumb.addEventListener('click',()=>goTo(index));
  });
  if(scroll){
    let raf=0;
    scroll.addEventListener('scroll',()=>{
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        if(!boxes.length) return;
        const mobile=matchMedia('(max-width:768px)').matches;
        const pos=mobile ? scroll.scrollLeft : scroll.scrollTop;
        let best=0,dist=Infinity;
        boxes.forEach((box,i)=>{
          const p=mobile ? box.offsetLeft : box.offsetTop;
          const d=Math.abs(p-pos);
          if(d<dist){dist=d;best=i;}
        });
        setActiveThumb(best);
      });
    },{passive:true});
  }

  const cartBtn=document.getElementById('cart-btn');
  if(cartBtn) cartBtn.addEventListener('click',()=>{ if(typeof openCart==='function') openCart(); });
});

/* === SUCESSO DESKTOP PRODUCT ZOOM — FULLSCREEN SCROLL 20260914 === */
/*
   Desktop/laptop only. Mobile keeps the existing zoom exactly as it was.
   Reference behaviour: click a product image -> clean white fullscreen viewer,
   oversized image, native wheel/trackpad vertical inspection and a small fixed X.
*/
document.addEventListener('DOMContentLoaded', () => {
  const desktopZoomMQ = window.matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)');
  const overlay = document.getElementById('zoom-overlay');
  const zoomImage = document.getElementById('zoom-image');
  const closeButton = document.getElementById('close-zoom');
  if (!overlay || !zoomImage || !closeButton) return;

  let previousBodyOverflow = '';
  let previousHtmlOverflow = '';
  let isOpen = false;

  function setInitialViewport() {
    /* Product PNGs carry intentional transparent breathing room above the garment.
       Start slightly down so the garment enters the viewport like the reference. */
    overlay.scrollTop = Math.max(0, Math.round(window.innerWidth * 0.11));
    overlay.scrollLeft = 0;
  }

  function openDesktopZoom(src, alt) {
    if (!desktopZoomMQ.matches || !src) return;

    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    zoomImage.src = src;
    zoomImage.alt = alt || '';
    zoomImage.style.transform = 'none';
    zoomImage.classList.remove('zoomed');

    overlay.classList.add('su-desktop-product-zoom');
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    isOpen = true;

    const position = () => requestAnimationFrame(() => requestAnimationFrame(setInitialViewport));
    if (zoomImage.complete) position();
    else zoomImage.addEventListener('load', position, { once: true });

    closeButton.focus({ preventScroll: true });
  }

  function closeDesktopZoom() {
    if (!isOpen) return;
    overlay.style.display = 'none';
    overlay.classList.remove('su-desktop-product-zoom');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.scrollTop = 0;
    overlay.scrollLeft = 0;
    zoomImage.removeAttribute('src');
    zoomImage.style.transform = 'none';
    zoomImage.classList.remove('zoomed');
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
    isOpen = false;
  }

  /*
     The legacy page has older target-level zoom listeners. Capture the desktop
     clicks before they reach those listeners. When the viewport is mobile this
     handler does nothing, so the original phone zoom remains untouched.
  */
  document.addEventListener('click', (event) => {
    /* Clicking the enlarged product itself closes the viewer on every layout.
       Capture it here so the older page-level click-to-zoom handler cannot run. */
    if (event.target === zoomImage && overlay.style.display !== 'none') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (isOpen) {
        closeDesktopZoom();
      } else {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.scrollTop = 0;
        overlay.scrollLeft = 0;
        zoomImage.removeAttribute('src');
        zoomImage.style.transform = 'none';
        zoomImage.classList.remove('zoomed');
      }
      return;
    }

    if (!desktopZoomMQ.matches) return;

    const productImage = event.target.closest('.image-box img');
    if (productImage) {
      event.preventDefault();
      event.stopPropagation();
      openDesktopZoom(productImage.currentSrc || productImage.src, productImage.alt);
      return;
    }

    if (event.target.closest('#close-zoom')) {
      event.preventDefault();
      event.stopPropagation();
      closeDesktopZoom();
      return;
    }

    if (isOpen && event.target === overlay) {
      /* Keep the white viewer background inert; the image and X are the close controls. */
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) closeDesktopZoom();
  });

  desktopZoomMQ.addEventListener('change', (event) => {
    if (!event.matches && isOpen) closeDesktopZoom();
  });
});
