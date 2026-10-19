/* SUCESSO color variants: visual options and image switching, with no new product routes. */
(() => {
 'use strict';
 const COLORS = Object.freeze({
   white:{name:'Blanco',hex:'#FFFFFF',front:null,back:null},
   bone:{name:'Bone',hex:'#EDE7DA',front:'images/cherry-dice-front-bone.png',back:'images/cherry-dice-back-bone.png'},
   carbon:{name:'Carbón',hex:'#333536',front:'images/chinese-front-carbon.png',back:'images/chinese-back-carbon.png'}
 });
 const PRODUCT_COLORS = Object.freeze({
   'sucesso-jackpot-tee':['white'],
   'cherry-dice-tee':['white','bone'],
   'chinese-success-tee':['white','carbon'],
   'crayon-tee':['white']
 });
 const CARD_SELECTORS='.related-product-card, .su-search-product-card';
 const BASE_NAMES=Object.freeze({
   'sucesso-jackpot-tee':'Jackpot Casino Tee',
   'cherry-dice-tee':'Cherry Dice Tee',
   'chinese-success-tee':'Chinese Chowmein Tee',
   'crayon-tee':'Crayon Art Tee'
 });
 const SUFFIXES=Object.freeze({white:'White',bone:'Bone',carbon:'Carbon'});
 const displayName=(slug,color='white')=>{
   const base=BASE_NAMES[slug];
   return base ? `${base} ${SUFFIXES[color]||SUFFIXES.white}` : '';
 };
 function updateCardTitle(card,slug){
   const text=displayName(slug,'white');if(!text)return;
   const title=card.querySelector('.related-product-name, .su-search-product-name');
   if(title&&title.textContent!==text)title.textContent=text;
   if(card.dataset.teeName!==undefined)card.dataset.teeName=text;
   if(card.dataset.suName!==undefined)card.dataset.suName=text;
   const links=card.querySelectorAll('.related-product-info-link, .related-product-link, .su-search-product-info, .su-search-product-link');
   links.forEach(a=>{if(a.hasAttribute('aria-label'))a.setAttribute('aria-label',text);});
 }

 const rootURL=path => new URL(path, document.baseURI).href;
 const slugFor=card=>String(card?.dataset.teeSlug||card?.dataset.suSlug||card?.dataset.relatedSlug||'').trim();
 const optsFor=slug=>PRODUCT_COLORS[slug]||null;
 const es=()=>String(document.documentElement.lang||'es').toLowerCase().startsWith('es');
 const colorLabel=name=>name==='Blanco'&&!es()?'White':name==='Carbón'&&!es()?'Charcoal':name;
 const productSlug=()=>{
   const match=location.pathname.match(/\/products\/([^/]+)\/?$/i);
   return match ? match[1] : new URLSearchParams(location.search).get('nombre');
 };
 const colorName=(slug,color)=> (COLORS[color] && optsFor(slug)?.includes(color))?color:'white';
 const pageURL=(href,color)=>{
   const url=new URL(href,document.baseURI);
   if(color==='white') url.searchParams.delete('color');
   else url.searchParams.set('color',color);
   return url.href;
 };
 const makeDot=(color)=>{
   const span=document.createElement('span');span.className='su-variant-dot';
   span.style.setProperty('--su-variant-color',COLORS[color].hex);span.setAttribute('aria-hidden','true');return span;
 };
 function makeCardSwatches(card){
   const slug=slugFor(card);
   updateCardTitle(card,slug);
   if(card.dataset.suColorReady==='1')return;
   const options=optsFor(slug);
   const info=card.querySelector(':scope > .related-product-info, :scope > .su-search-product-info');
   if(!options||!info)return;
   card.dataset.suColorReady='1';
   const row=document.createElement('div');row.className='su-variant-row';
   row.setAttribute('role','group');row.setAttribute('aria-label',es()?'Colores disponibles':'Available colors');
   const href=card.querySelector('.related-product-info-link[href], .su-search-product-info[href], .related-product-link[href], .su-search-product-link[href]')?.getAttribute('href');
   for(const color of options){
     const a=document.createElement('a');a.href=pageURL(href||`products/${slug}/`,color);
     a.dataset.suVariant=color;
     a.setAttribute('aria-label',(es()?'Ver ':'View ')+slug.replaceAll('-',' ')+' — '+colorLabel(COLORS[color].name));
     if(color==='white')a.setAttribute('aria-current','true');
     a.appendChild(makeDot(color));row.appendChild(a);
   }
   info.insertAdjacentElement('afterend',row);
 }
 const scan=(scope)=>{
   if(scope.nodeType!==1 && scope.nodeType!==9 && scope.nodeType!==11)return;
   if(scope.nodeType===1 && scope.matches(CARD_SELECTORS))makeCardSwatches(scope);
   scope.querySelectorAll?.(CARD_SELECTORS).forEach(makeCardSwatches);
 };
 function initProduct(){
   const details=document.querySelector('main.product-page');
   if(!details)return;
   const slug=productSlug();const options=optsFor(slug);
   const guide=document.getElementById('size-fit-guide-trigger');
   if(!options||!guide||document.querySelector('.su-product-colors'))return;
   const holder=document.createElement('div');holder.className='su-product-colors';
   holder.setAttribute('role','group');holder.setAttribute('aria-label',es()?'Color de la camiseta':'Shirt color');
   const name=document.createElement('span');name.className='su-product-color-label';
   const btns=document.createElement('div');btns.className='su-product-color-buttons';
   const buttons={};
   for(const color of options){
     const b=document.createElement('button');b.type='button';b.dataset.suVariant=color;
     b.setAttribute('aria-label',colorLabel(COLORS[color].name));b.setAttribute('aria-pressed','false');
     b.appendChild(makeDot(color));btns.appendChild(b);buttons[color]=b;
   }
   holder.append(name,btns);guide.insertAdjacentElement('beforebegin',holder);
   let current='white';let requestID=0;
   const initialImages={front:document.getElementById('product-image-front')?.getAttribute('src')||'',back:document.getElementById('product-image-back')?.getAttribute('src')||''};
   function changeImages(color){
     const currentColor=COLORS[color];
     const front=currentColor.front||initialImages.front;
     const back=currentColor.back||initialImages.back;
     const targets=[['product-image-front',front],['product-image-back',back],['product-thumb-front',front],['product-thumb-back',back]];
     for(const [id,src] of targets){const el=document.getElementById(id);if(el)el.src=rootURL(src);}
   }
   function sync(color){
     current=color;holder.dataset.suColor=color;
     name.textContent=colorLabel(COLORS[color].name);
     const fullName=displayName(slug,color);
     if(fullName){
       const title=document.getElementById('product-name');
       const guideName=document.getElementById('size-guide-product-name');
       const breadcrumb=document.getElementById('product-context-name');
       if(title)title.textContent=fullName;
       if(guideName)guideName.textContent=fullName;
       if(breadcrumb)breadcrumb.textContent=fullName;
       document.title=`${fullName} – Sucesso`;
     }
     for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===color));
     changeImages(color);
     window.SucessoCurrentColor=color;
   }
   function preload(color){
     const value=COLORS[color];
     const files=[value.front||initialImages.front,value.back||initialImages.back];
     return Promise.all(files.map(src=>new Promise(resolve=>{
       const img=new Image();
       let finished=false;
       const finish=()=>{
         if(finished)return;
         finished=true;
         clearTimeout(timeout);
         img.onload=null;img.onerror=null;
         resolve();
       };
       // A slow/offline image request must never leave the cherry overlay stuck.
       const timeout=setTimeout(finish,6000);
       img.onload=finish;img.onerror=finish;img.src=rootURL(src);
       if(img.complete)finish();
     })));
   }
   // A new overlay is required: the original #loader already ran its page-load
   // animation and may have a completed fadeOut animation from styles.css.
   let activeCherry=null;
   function showCherry(){
     if(activeCherry)activeCherry.remove();
     const overlay=document.createElement('div');
     overlay.className='su-color-cherry-loader';
     overlay.setAttribute('role','status');
     overlay.setAttribute('aria-label',es()?'Cambiando color':'Changing color');
     const logo=document.createElement('img');
     logo.alt='';
     logo.src=rootURL(document.querySelector('#loader img')?.getAttribute('src')||'images/logo cherry png.png');
     overlay.appendChild(logo);
     document.body.appendChild(overlay);
     activeCherry=overlay;
     return overlay;
   }
   function hideCherry(overlay){
     if(!overlay)return Promise.resolve();
     // Match the page's original Cherry Loader: fade the white overlay away
     // over 0.4s instead of removing it in a single frame.
     overlay.classList.add('su-color-cherry-loader--leaving');
     return new Promise(resolve=>{
       let completed=false;
       const finish=()=>{
         if(completed)return;
         completed=true;
         overlay.removeEventListener('animationend',onAnimationEnd);
         clearTimeout(backup);
         overlay.remove();
         if(activeCherry===overlay)activeCherry=null;
         resolve();
       };
       const onAnimationEnd=event=>{
         if(event.target===overlay&&event.animationName==='suColorCherryFadeOut')finish();
       };
       overlay.addEventListener('animationend',onAnimationEnd);
       // If an animation is suppressed by browser settings, still clean up.
       const backup=setTimeout(finish,500);
     });
   }
   async function select(color,animate){
     if(current===color)return;
     const seq=++requestID;
     const overlay=animate?showCherry():null;
     const start=performance.now();
     try{
       await preload(color);
       // The site starts its 0.4-second exit fade after 2.2 seconds.
       // Keep the updated images hidden until the fade makes them visible.
       if(animate)await new Promise(resolve=>setTimeout(resolve,Math.max(0,2200-(performance.now()-start))));
       if(seq!==requestID)return;
       sync(color);
       const url=new URL(location.href);
       if(color==='white')url.searchParams.delete('color'); else url.searchParams.set('color',color);
       history.replaceState(history.state,'',url.pathname+url.search+url.hash);
     }finally{
       await hideCherry(overlay);
     }
   }
   for(const [color,button] of Object.entries(buttons))button.addEventListener('click',()=>select(color,true));
   const fromURL=new URLSearchParams(location.search).get('color')?.toLowerCase();
   sync(colorName(slug,fromURL));
   window.addEventListener('popstate',()=>{
     const next=colorName(slug,new URLSearchParams(location.search).get('color'));
     if(next!==current)select(next,false);
   });
 }
 function init(){
   scan(document);initProduct();
   const watcher=new MutationObserver(records=>{
     for(const record of records){
       for(const node of record.addedNodes){if(node.nodeType===1)scan(node);}
     }
   });
   watcher.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
