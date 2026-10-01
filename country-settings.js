/* Country selection is independent of Firebase, EmailJS, products and payments. */
(() => {
'use strict';
const spanish=new Set('AR BO CL CO CR CU DO EC SV GQ GT HN MX NI PA PY PE PR ES UY VE'.split(' '));
const codes='AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ');
const lang=()=>localStorage.getItem('preferredLang')==='en'?'en':'es';
const text=(es,en)=>lang()==='es'?es:en;
const countryName=code=>{try{return new Intl.DisplayNames([lang()],{type:'region'}).of(code);}catch{return code;}};
const node=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n;};

function updateDocumentTitle(language=lang()){
 const path=decodeURIComponent(location.pathname).toLowerCase();
 if(path.includes('/products/')) return; // product-page.js owns product titles
 const es=language==='es';
 let value='';
 if(/\/mi-cuenta\.html$/.test(path)) value=es?'Mi Cuenta - Sucesso':'My Account - Sucesso';
 else if(/\/login\.html$/.test(path)) value=es?'Iniciar sesión - Sucesso':'Sign In - Sucesso';
 else if(/\/about\.html$/.test(path)) value=es?'Sobre - Sucesso':'About Us - Sucesso';
 else if(/\/contactanos\.html$/.test(path)) value=es?'Contacto - Sucesso':'Contact Us - Sucesso';
 else if(/\/politica-de-privacidad\.html$/.test(path)) value=es?'Política de privacidad - Sucesso':'Privacy Policy - Sucesso';
 else if(/\/terms-and-conditions\.html$/.test(path)) value=es?'Términos y condiciones - Sucesso':'Terms & Conditions - Sucesso';
 else if(/\/tracking\.html$/.test(path)) value=es?'Seguimiento de pedido - Sucesso':'Order Tracking - Sucesso';
 else if(/\/search\.html$/.test(path)) value=es?'Buscar - Sucesso':'Search - Sucesso';
 else if(/\/registro\.html$/.test(path)) value=es?'Crear cuenta - Sucesso':'Create Account - Sucesso';
 else if(/\/recuperar\.html$/.test(path)) value=es?'Recuperar acceso - Sucesso':'Recover Access - Sucesso';
 else if(/\/cookies\.html$/.test(path)) value='Cookies - Sucesso';
 else if(/\/404\.html$/.test(path)) value=es?'Página no encontrada - Sucesso':'Page Not Found - Sucesso';
 else if(/\/collections\/dice-drp\/?(?:index\.html)?$/.test(path)) value='Dice Drp – Sucesso';
 else if(/\/(?:tees|t-shirts)\.html$/.test(path)||/\/collections\/t-shirts\/?(?:index\.html)?$/.test(path)) value='T-Shirts | Sucesso';
 else if(/\/index\.html$/.test(path)||path.endsWith('/')) value='Sucesso';
 if(value) document.title=value;
}
window.sucessoUpdatePageTitle=updateDocumentTitle;
let country=localStorage.getItem('sucesso-selected-country');if(!codes.includes(country))country=null;

// Reproduce exactamente el loader Cherry que ya usa el sitio cuando cambia la ubicación.
// Se reutiliza el #loader de la página; en la 404 (que tiene el mismo CSS pero no el
// markup) se crea únicamente cuando hace falta.
let locationLoaderTimer=null;
function replaySiteLoader(){
 let loader=document.getElementById('loader');
 if(!loader){
  loader=node('div','loader');loader.id='loader';
  const img=document.createElement('img');img.src='images/logo cherry png.png';img.alt='Sucesso Logo';
  loader.append(img);document.body.append(loader);
 }
 const img=loader.querySelector('img');
 loader.style.display='flex';loader.style.opacity='1';loader.style.visibility='visible';
 if(img){img.style.animation='none';void img.offsetWidth;img.style.animation='zoomInClean 2s ease forwards';}
 clearTimeout(locationLoaderTimer);
 locationLoaderTimer=setTimeout(()=>{loader.style.display='none';},2500);
}

const shade=node('div','su-country-shade');shade.setAttribute('aria-hidden','true');
const popup=node('div','su-country-popup');popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-labelledby','su-country-title');popup.setAttribute('aria-hidden','true');popup.inert=true;
const title=node('strong','su-country-title');title.id='su-country-title';
const close=node('button','su-country-close','×');close.type='button';
const label=node('label');label.htmlFor='su-country-select';
const select=node('select');select.id='su-country-select';
const detect=node('button','su-country-detect');detect.type='button';
const status=node('p','su-country-status');status.setAttribute('role','status');
const rateLine=node('p','su-country-rate');rateLine.setAttribute('aria-live','polite');rateLine.hidden=true;
const save=node('button','su-country-save');save.type='button';
popup.append(close,title,label,select,detect,status,rateLine,save);
const trigger=node('button','su-country-button');trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');
const flag=node('img');flag.alt='';flag.width=20;flag.height=15;flag.referrerPolicy='no-referrer';flag.onerror=()=>{flag.hidden=true;};
const triggerText=node('span');const chevron=node('span','su-country-chevron');chevron.setAttribute('aria-hidden','true');trigger.append(flag,triggerText,chevron);
document.body.append(shade,popup,trigger);
let opened=false,previousFocus,previousOverflow='',detectRevision=0,translationRevision=0;
async function refreshBCVRateLine(code){
 const chosen=String(code||country||'').toUpperCase();
 if(chosen!=='VE'){rateLine.hidden=true;rateLine.textContent='';return;}
 rateLine.hidden=false;
 const cached=window.SucessoBCV?.readCache?.();
 if(cached?.rate) rateLine.textContent=`1 USD = ${window.SucessoBCV.formatRate(cached.rate)} VES · BCV`;
 else rateLine.textContent=text('Consultando tasa oficial BCV…','Loading official BCV rate…');
 const data=await window.SucessoBCV?.getRate?.();
 if(String(select.value||country||'').toUpperCase()!=='VE') return;
 rateLine.textContent=data?.rate
   ? `1 USD = ${window.SucessoBCV.formatRate(data.rate)} VES · BCV`
   : text('Tasa BCV no disponible en este momento.','BCV rate is currently unavailable.');
}
function refresh(){
 title.textContent=text('CONFIGURACIÓN DE UBICACIÓN','LOCATION SETTINGS');label.textContent=text('SELECCIONA TU PAÍS:','SELECT YOUR COUNTRY:');close.setAttribute('aria-label',text('Cerrar','Close'));detect.textContent=text('Detectar mi ubicación','Detect my location');save.textContent=text('GUARDAR','SAVE');
 const chosen=select.value||country||'VE';select.replaceChildren();
 codes.slice().sort((a,b)=>countryName(a).localeCompare(countryName(b))).forEach(code=>{const option=node('option','',countryName(code));option.value=code;select.append(option);});select.value=chosen;
 triggerText.textContent=country?(countryName(country)+(country==='VE'?' (USD$/VES)':' (USD $)')):text('SELECCIONAR PAÍS (USD $)','SELECT COUNTRY (USD $)');
 flag.hidden=!country;if(country)flag.src='https://flagcdn.com/w40/'+country.toLowerCase()+'.png';
 refreshBCVRateLine(select.value||country||'VE');
}
async function applyCountry(code){
 const previousCountry=country;
 if(previousCountry!==code)replaySiteLoader();
 country=code;localStorage.setItem('sucesso-selected-country',code);
 const language=spanish.has(code)?'es':'en';localStorage.setItem('preferredLang',language);document.documentElement.lang=language;updateDocumentTitle(language);window.dispatchEvent(new CustomEvent('sucesso:country-change',{detail:{country:code,language}}));
 const rev=++translationRevision;
 try{
  const response=await fetch('assets/lang/lang.json');if(!response.ok)throw Error();const dict=await response.json();if(rev!==translationRevision)return;
  document.querySelectorAll('[data-i18n]').forEach(n=>{const value=dict[language]?.[n.dataset.i18n];if(value)n.textContent=value;});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>{const value=dict[language]?.[n.dataset.i18nPlaceholder];if(value)n.placeholder=value;});
  const legacySelect=document.getElementById('language-select');if(legacySelect)legacySelect.value=language;
  window.updateCart?.();
  updateDocumentTitle(language);
 }catch{ /* The saved choice also feeds the site's existing translation mechanism on navigation. */ }
 refresh();
}
function open(){
 if(opened)return;opened=true;sessionStorage.setItem('sucesso-country-popup-seen','1');previousFocus=document.activeElement;previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';refresh();select.value=country||'VE';status.textContent='';popup.inert=false;popup.setAttribute('aria-hidden','false');shade.classList.add('is-open');popup.classList.add('is-open');select.focus({preventScroll:true});
}
function hide(){if(!opened)return;opened=false;detectRevision++;detect.disabled=false;popup.classList.remove('is-open');shade.classList.remove('is-open');popup.setAttribute('aria-hidden','true');popup.inert=true;document.documentElement.style.overflow=previousOverflow;previousFocus?.focus({preventScroll:true});}
trigger.onclick=open;close.onclick=hide;shade.onclick=hide;
select.onchange=()=>{detectRevision++;detect.disabled=false;status.textContent='';refreshBCVRateLine(select.value);};
save.onclick=()=>{const code=select.value;if(codes.includes(code)){applyCountry(code);hide();}};
detect.onclick=()=>{
 const rev=++detectRevision;detect.disabled=true;
 status.textContent=text('El navegador pedirá permiso. Se enviará tu ubicación a BigDataCloud para identificar el país.','Your browser will request permission. Your location will be sent to BigDataCloud to identify the country.');
 const fail=()=>{if(rev!==detectRevision||!opened)return;detect.disabled=false;status.textContent=text('No se pudo detectar tu ubicación. Puedes seleccionar tu país y guardar.','Your location could not be detected. Select your country and save.');};
 if(!navigator.geolocation||!window.isSecureContext){fail();return;}
 navigator.geolocation.getCurrentPosition(async position=>{
  try{const url=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');url.searchParams.set('latitude',position.coords.latitude);url.searchParams.set('longitude',position.coords.longitude);url.searchParams.set('localityLanguage','en');const response=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error();const data=await response.json();if(rev!==detectRevision||!opened)return;if(!codes.includes(data.countryCode))throw Error();select.value=data.countryCode;detect.disabled=false;status.textContent=text('Ubicación detectada. Pulsa GUARDAR para confirmar.','Location detected. Press SAVE to confirm.');}
  catch{fail();}
 },fail,{timeout:10000,maximumAge:300000,enableHighAccuracy:false});
};
document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();hide();}if(e.key==='Tab'){const controls=[...popup.querySelectorAll('button,select')].filter(n=>!n.disabled);const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
// Existing footer language links reopen the same location dialog.
document.addEventListener('click',e=>{if(e.target.closest('#openLanguagePopup,#languageToggle,#languageToggleSidebar')){e.preventDefault();e.stopImmediatePropagation();open();}},true);
refresh();
// Reapply the saved language after every navigation. This keeps shared navbar
// items (including COLLECTIONS / COLECCIONES) consistent on every page.
{
 const savedLanguage=localStorage.getItem('preferredLang');
 if(savedLanguage==='en'||savedLanguage==='es'){
  const rev=++translationRevision;
  fetch('assets/lang/lang.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(dict=>{
   if(rev!==translationRevision)return;
   document.documentElement.lang=savedLanguage;
   document.querySelectorAll('[data-i18n]').forEach(n=>{const value=dict[savedLanguage]?.[n.dataset.i18n];if(value)n.textContent=value;});
   document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>{const value=dict[savedLanguage]?.[n.dataset.i18nPlaceholder];if(value)n.placeholder=value;});
   const legacySelect=document.getElementById('language-select');if(legacySelect)legacySelect.value=savedLanguage;
   window.updateCart?.();
   updateDocumentTitle(savedLanguage);
  }).catch(()=>{});
 }
}
updateDocumentTitle(lang());
window.addEventListener('storage',e=>{if(e.key==='preferredLang')updateDocumentTitle(lang());});
// Timer is measured from navigation start, not delayed until external Firebase modules load.
if(sessionStorage.getItem('sucesso-country-popup-seen')!=='1')setTimeout(open,Math.max(0,3000-performance.now()));
})();
