/* Search behavior only. Catalog data is supplied by each page's original Firebase module. */
(() => {
'use strict';
const language=()=>localStorage.getItem('preferredLang')==='en'?'en':'es';
const text=key=>window.SucessoUITranslations?.[language()]?.[key] || key;
const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const canonical=value=>['camiseta','camisetas','franela','franelas','tee','tees','tshirt','t-shirt','t-shirts','shirt','shirts'].includes(value)?'tee':value;
const tokens=value=>fold(value).split(/\s+/).filter(Boolean).map(canonical);
function normalizeProducts(raw){
 const seen=new Set();return raw.filter(p=>p?.titulo&&p.nombre&&p.precio!==undefined&&Number.isFinite(Number(p.precio))&&p.imagen_frontal).filter(p=>{const key=String(p.nombre);if(seen.has(key))return false;seen.add(key);return true;}).map(p=>({...p,titulo:String(p.titulo),nombre:String(p.nombre),precio:Number(p.precio),imagen_frontal:String(p.imagen_frontal).replace(/\\/g,'/'),imagen_trasera:String(p.imagen_trasera||p.imagen_frontal).replace(/\\/g,'/'),keywords:Array.isArray(p.keywords)?p.keywords:[]}));
}
function search(products,query){
 const terms=tokens(query);if(!terms.length)return[];
 return products.filter(p=>{const raw=[p.titulo,p.nombre.replace(/-/g,' '),...p.keywords].join(' ');const haystack=fold(raw)+' '+tokens(raw).join(' ');return terms.every(term=>haystack.includes(term));});
}
let pending=null;
function waitForProvider(){
 if(typeof window.sucessoCatalogLoader==='function')return Promise.resolve(window.sucessoCatalogLoader);
 return new Promise((resolve,reject)=>{const ready=()=>{clearTimeout(timer);window.removeEventListener('sucesso:catalog-ready',ready);resolve(window.sucessoCatalogLoader);};const timer=setTimeout(()=>{window.removeEventListener('sucesso:catalog-ready',ready);reject(new Error('provider-unavailable'));},10000);window.addEventListener('sucesso:catalog-ready',ready);});
}
function catalog(){
 if(!pending)pending=(async()=>{const load=await waitForProvider();let timer;try{return normalizeProducts(await Promise.race([load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('catalog-timeout')),10000);})]));}finally{clearTimeout(timer);}})().catch(error=>{pending=null;throw error;});
 return pending;
}
window.SucessoSearch={language,text,fold,tokens,normalizeProducts,search,catalog};
})();
