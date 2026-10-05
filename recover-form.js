/* UI for the existing Firebase sendPasswordResetEmail call; no EmailJS involvement. */
(() => {
 const form=document.getElementById('reset-form');if(!form)return;
 const field=document.getElementById('email'),submit=form.querySelector('button[type="submit"]'),success=document.getElementById('success-message'),error=document.getElementById('error-message');
 let busy=false;
 const t=key=>window.SucessoUITranslations?.[localStorage.getItem('preferredLang')==='en'?'en':'es']?.[key]||key;
 function message(n,key){n.dataset.i18n=key;n.textContent=t(key);n.style.display='block';}
 function clear(n){delete n.dataset.i18n;n.textContent='';n.style.display='none';}
 async function provider(){
  if(typeof window.sucessoSendReset==='function')return window.sucessoSendReset;
  return new Promise((resolve,reject)=>{const ready=()=>{clearTimeout(timer);window.removeEventListener('sucesso:reset-ready',ready);resolve(window.sucessoSendReset);};const timer=setTimeout(()=>{window.removeEventListener('sucesso:reset-ready',ready);reject({code:'auth/network-request-failed'});},10000);window.addEventListener('sucesso:reset-ready',ready);});
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;clear(success);clear(error);field.value=field.value.trim();
  if(!field.checkValidity()){message(error,'reset_invalid');field.reportValidity();return;}
  busy=true;submit.disabled=true;submit.dataset.i18n='reset_wait';submit.textContent=t('reset_wait');
  try{const send=await provider();await send(field.value);message(success,'reset_success');}
  catch(reason){const code=reason?.code;message(error,code==='auth/invalid-email'?'reset_invalid':code==='auth/too-many-requests'?'reset_limit':code==='auth/network-request-failed'?'reset_network':'reset_error');}
  finally{busy=false;submit.disabled=false;submit.dataset.i18n='reset_submit';submit.textContent=t('reset_submit');}
 });
})();
