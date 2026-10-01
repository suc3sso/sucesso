import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailLink, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3u2GKMSAKC_1Cd88KA-rxTOf_Jnt3fuM",
  authDomain: "sucesso-74f7c.firebaseapp.com",
  projectId: "sucesso-74f7c",
  storageBucket: "sucesso-74f7c.appspot.com",
  messagingSenderId: "878844661636",
  appId: "1:878844661636:web:6382f86f18201aecfdd7d1"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "us-central1");
const requestEmailCode = httpsCallable(functions, "requestEmailCode");
const verifyEmailCode = httpsCallable(functions, "verifyEmailCode");

const $ = (id) => document.getElementById(id);
const stepEmail = $("authEmailStep");
const stepCode = $("authCodeStep");
const form = $("authEmailForm");
const emailInput = $("authEmail");
const sendButton = $("authSend");
const codeInputs = [...document.querySelectorAll(".su-auth-code-input")];
const sentEmail = $("authSentEmail");
const changeButton = $("authChangeEmail");
const resendButton = $("authResend");
const resendCountdown = $("authResendCountdown");
const emailMessage = $("authEmailMessage");
const codeMessage = $("authCodeMessage");
const termsTrigger = $("authTermsTrigger");
const privacyTrigger = $("authPrivacyTrigger");
const legalModal = $("authLegalModal");
const legalTitle = $("authLegalTitle");
const legalBody = $("authLegalBody");
const legalClose = $("authLegalClose");

let busy = false;
let verifying = false;
let currentEmail = "";
let resendTimer = null;
let resendSeconds = 0;
let authResolved = false;
let submissionInProgress = false;

const translations = {
  es: {
    invalidEmail: "Introduce un correo electrónico válido.",
    sending: "Enviando código…",
    sent: "Código enviado. Revisa también tu carpeta de spam.",
    serviceError: "No pudimos enviar el código. Inténtalo de nuevo en un momento.",
    rateLimited: "Espera un momento antes de solicitar otro código.",
    invalidCode: "El código no es correcto. Revísalo e inténtalo de nuevo.",
    expiredCode: "Ese código venció. Solicita uno nuevo.",
    tooMany: "Se alcanzó el límite de intentos. Solicita un código nuevo.",
    verifying: "Verificando…",
    resend: "Reenviar código",
    resendIn: (n) => `Reenviar en ${n}s`,
    termsTitle: "Términos del servicio",
    privacyTitle: "Política de privacidad"
  },
  en: {
    invalidEmail: "Enter a valid email address.",
    sending: "Sending code…",
    sent: "Code sent. Please also check your spam folder.",
    serviceError: "We could not send the code. Please try again in a moment.",
    rateLimited: "Please wait a moment before requesting another code.",
    invalidCode: "That code is not correct. Check it and try again.",
    expiredCode: "That code has expired. Request a new one.",
    tooMany: "Too many attempts. Request a new code.",
    verifying: "Verifying…",
    resend: "Resend code",
    resendIn: (n) => `Resend in ${n}s`,
    termsTitle: "Terms of Service",
    privacyTitle: "Privacy Policy"
  }
};

const legal = {
  es: {
    terms: `
      <h3>1. Información general</h3>
      <p>Estos Términos del servicio regulan el acceso y uso de <strong>Sucesso</strong>, una marca de ropa con operaciones en Venezuela, y la compra de productos ofrecidos a través de <strong>www.sucessobrand.com</strong>. Para consultas puedes escribir a <a href="mailto:info@sucessobrand.com">info@sucessobrand.com</a>.</p>
      <h3>2. Acceso a tu cuenta</h3>
      <p>Sucesso utiliza acceso sin contraseña mediante un código de un solo uso enviado al correo electrónico indicado. Al solicitar y utilizar un código declaras que tienes acceso legítimo a esa cuenta de correo. Los códigos son personales, de uso único y caducan por seguridad.</p>
      <h3>3. Pedidos y disponibilidad</h3>
      <p>Los productos están sujetos a disponibilidad. Un pedido no se considera definitivamente aceptado hasta que el pago haya sido confirmado. Si un producto deja de estar disponible después de una compra, nos comunicaremos contigo para ofrecer una alternativa o gestionar el reembolso correspondiente.</p>
      <h3>4. Precios, moneda e impuestos</h3>
      <p>Los precios se muestran en las monedas habilitadas por el sitio y pueden variar según ubicación, conversión aplicable, promociones o actualizaciones del catálogo. Los impuestos, gastos de envío u otros cargos aplicables se mostrarán antes de confirmar el pedido cuando corresponda.</p>
      <h3>5. Pagos</h3>
      <p>Los pagos se procesan mediante los proveedores de pago indicados durante el checkout. Sucesso no debe almacenar los datos completos de tu tarjeta. Cada proveedor puede aplicar sus propios términos, controles antifraude y verificaciones de seguridad.</p>
      <h3>6. Envíos</h3>
      <p>Los tiempos de entrega son estimados y pueden depender de la ubicación, disponibilidad y empresa de mensajería. Sucesso no responde por retrasos atribuibles exclusivamente al transportista, causas de fuerza mayor o información de entrega incorrecta suministrada por el cliente.</p>
      <h3>7. Cambios, devoluciones y defectos</h3>
      <p>De acuerdo con la política actualmente publicada por Sucesso, no se aceptan devoluciones por cambio de talla o color. Los reclamos por defectos de fabricación deben notificarse dentro de las 48 horas siguientes a la recepción del pedido, acompañados de la información necesaria para revisar el caso.</p>
      <h3>8. Uso del sitio y propiedad intelectual</h3>
      <p>No puedes utilizar el sitio de forma ilícita, intentar vulnerar su seguridad, interferir con su funcionamiento o copiar y explotar sin autorización sus marcas, diseños, fotografías, textos, logotipos u otros contenidos protegidos.</p>
      <h3>9. Privacidad</h3>
      <p>El tratamiento de datos personales se rige por la Política de privacidad de Sucesso. La información necesaria para autenticación, pedidos, soporte y entrega se utilizará únicamente para las finalidades allí descritas y para cumplir obligaciones legales aplicables.</p>
      <h3>10. Cambios y legislación aplicable</h3>
      <p>Sucesso puede actualizar estos términos cuando cambien sus servicios, métodos de pago, políticas o requisitos legales. La versión publicada en el sitio será la vigente desde su fecha de publicación. Cualquier cuestión no prevista se interpretará conforme a la legislación aplicable a la operación correspondiente.</p>
    `,
    privacy: `
      <p>En <strong>Sucesso</strong> protegemos la información personal que nos proporcionas y la utilizamos únicamente para operar la tienda, autenticar tu cuenta, procesar pedidos, brindar soporte y cumplir obligaciones legales.</p>
      <h3>1. Responsable</h3>
      <p>Sucesso es una marca de ropa con operaciones en Venezuela. Para consultas sobre privacidad puedes escribir a <a href="mailto:info@sucessobrand.com">info@sucessobrand.com</a>.</p>
      <h3>2. Datos que podemos tratar</h3>
      <p>Podemos tratar tu correo electrónico, nombre, teléfono, dirección de envío, información relacionada con pedidos y datos técnicos de navegación. Los datos completos de tarjetas deben ser procesados directamente por el proveedor de pago.</p>
      <h3>3. Finalidades</h3>
      <p>Usamos estos datos para autenticar usuarios, procesar y entregar compras, atender solicitudes, prevenir fraude, mantener la seguridad del sitio y mejorar la experiencia de compra.</p>
      <h3>4. Proveedores</h3>
      <p>Podemos compartir la información estrictamente necesaria con proveedores de autenticación, pagos, alojamiento, mensajería y soporte, únicamente para prestar el servicio correspondiente.</p>
      <h3>5. Seguridad y conservación</h3>
      <p>Aplicamos medidas técnicas y organizativas razonables para limitar accesos no autorizados. Los códigos de acceso son temporales y de un solo uso. Conservamos los datos durante el tiempo necesario para prestar los servicios y atender obligaciones legales.</p>
      <h3>6. Tus derechos</h3>
      <p>Puedes solicitar acceso, corrección o eliminación de tus datos cuando corresponda escribiendo a <a href="mailto:help.sucsso@gmail.com">help.sucsso@gmail.com</a>.</p>
      <h3>7. Cambios</h3>
      <p>Podemos actualizar esta política para reflejar cambios legales o en el funcionamiento del sitio. La versión vigente será la publicada en Sucesso.</p>
    `
  },
  en: {
    terms: `
      <h3>1. General information</h3>
      <p>These Terms of Service govern access to and use of <strong>Sucesso</strong>, a clothing brand operating in Venezuela, and purchases made through <strong>www.sucessobrand.com</strong>. For questions, contact <a href="mailto:info@sucessobrand.com">info@sucessobrand.com</a>.</p>
      <h3>2. Account access</h3>
      <p>Sucesso uses passwordless access through a one-time code sent to the email address you provide. By requesting and using a code, you confirm that you legitimately control that email account. Codes are personal, single-use and expire for security.</p>
      <h3>3. Orders and availability</h3>
      <p>Products are subject to availability. An order is not finally accepted until payment has been confirmed. If an item becomes unavailable after purchase, we will contact you to offer an alternative or arrange the appropriate refund.</p>
      <h3>4. Prices, currency and taxes</h3>
      <p>Prices are displayed in the currencies enabled by the site and may vary based on location, applicable conversion, promotions or catalog updates. Taxes, shipping charges or other applicable fees will be shown before order confirmation where relevant.</p>
      <h3>5. Payments</h3>
      <p>Payments are processed by the payment providers displayed during checkout. Sucesso should not store complete card details. Each provider may apply its own terms, fraud-prevention controls and security checks.</p>
      <h3>6. Shipping</h3>
      <p>Delivery times are estimates and can depend on location, availability and the carrier. Sucesso is not responsible for delays caused solely by the carrier, force majeure events or incorrect delivery information supplied by the customer.</p>
      <h3>7. Exchanges, returns and defects</h3>
      <p>Under Sucesso's currently published policy, returns for a change of size or color are not accepted. Manufacturing-defect claims must be reported within 48 hours after delivery and include the information needed to review the case.</p>
      <h3>8. Site use and intellectual property</h3>
      <p>You may not use the site unlawfully, attempt to compromise its security, interfere with its operation, or copy and commercially exploit its trademarks, designs, photographs, text, logos or other protected content without authorization.</p>
      <h3>9. Privacy</h3>
      <p>Personal data is handled under Sucesso's Privacy Policy. Information needed for authentication, orders, support and delivery is used only for the purposes described there and to comply with applicable legal obligations.</p>
      <h3>10. Changes and applicable law</h3>
      <p>Sucesso may update these terms when its services, payment methods, policies or legal requirements change. The version published on the site will apply from its publication date. Matters not covered here will be interpreted under the law applicable to the relevant transaction.</p>
    `,
    privacy: `
      <p>At <strong>Sucesso</strong>, we protect the personal information you provide and use it only to operate the store, authenticate your account, process orders, provide support and comply with legal obligations.</p>
      <h3>1. Controller</h3>
      <p>Sucesso is a clothing brand operating in Venezuela. Privacy questions can be sent to <a href="mailto:info@sucessobrand.com">info@sucessobrand.com</a>.</p>
      <h3>2. Data we may process</h3>
      <p>We may process your email address, name, phone number, shipping address, order-related information and technical browsing data. Complete card details should be processed directly by the payment provider.</p>
      <h3>3. Purposes</h3>
      <p>We use this data to authenticate users, process and deliver purchases, handle requests, prevent fraud, maintain site security and improve the shopping experience.</p>
      <h3>4. Service providers</h3>
      <p>We may share only the information required with authentication, payment, hosting, shipping and support providers to deliver the relevant service.</p>
      <h3>5. Security and retention</h3>
      <p>We apply reasonable technical and organizational measures to limit unauthorized access. Access codes are temporary and single-use. We retain data only as long as needed to provide services and meet applicable legal obligations.</p>
      <h3>6. Your rights</h3>
      <p>You may request access, correction or deletion of your data where applicable by writing to <a href="mailto:help.sucsso@gmail.com">help.sucsso@gmail.com</a>.</p>
      <h3>7. Changes</h3>
      <p>We may update this policy to reflect legal or operational changes. The current version is the version published by Sucesso.</p>
    `
  }
};

function lang(){ return localStorage.getItem("preferredLang") === "en" ? "en" : "es"; }
function t(key){ return translations[lang()][key]; }
function destination(){
  return (new URLSearchParams(location.search).get("next") === "checkout" || window.sucessoAuthReturn?.() === "checkout.html")
    ? "checkout.html" : "mi-cuenta.html";
}
function setMessage(node, text, type="error"){
  if(!node) return;
  node.textContent = text || "";
  node.className = `su-auth-message${text ? " is-visible" : ""}${text ? ` is-${type}` : ""}`;
}
function clearMessages(){ setMessage(emailMessage,""); setMessage(codeMessage,""); }
function normalizeEmail(value){ return String(value || "").trim().toLowerCase(); }
function validEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }

function showCodeStep(email){
  currentEmail = email;
  sentEmail.textContent = email;
  stepEmail.classList.add("is-leaving");
  setTimeout(() => {
    stepEmail.hidden = true;
    stepEmail.classList.remove("is-leaving");
    stepCode.hidden = false;
    stepCode.classList.add("is-entering");
    requestAnimationFrame(() => {
      stepCode.classList.remove("is-entering");
      codeInputs[0]?.focus({preventScroll:true});
    });
  }, 160);
  startResendCountdown(45);
}

function showEmailStep(){
  clearMessages();
  stepCode.classList.add("is-leaving");
  setTimeout(() => {
    stepCode.hidden = true;
    stepCode.classList.remove("is-leaving");
    stepEmail.hidden = false;
    stepEmail.classList.add("is-entering");
    resetCodeInputs();
    requestAnimationFrame(() => {
      stepEmail.classList.remove("is-entering");
      emailInput.focus({preventScroll:true});
    });
  },160);
}

function resetCodeInputs(){
  codeInputs.forEach(input => { input.value=""; input.disabled=false; });
  verifying=false;
}

function setCodeDisabled(disabled){ codeInputs.forEach(input => input.disabled=disabled); }

function startResendCountdown(seconds){
  clearInterval(resendTimer);
  resendSeconds = seconds;
  resendButton.hidden = true;
  resendCountdown.hidden = false;
  const tick = () => {
    resendCountdown.textContent = t("resendIn")(Math.max(0,resendSeconds));
    if(resendSeconds <= 0){
      clearInterval(resendTimer);
      resendCountdown.hidden = true;
      resendButton.hidden = false;
      resendButton.textContent = t("resend");
      return;
    }
    resendSeconds -= 1;
  };
  tick();
  resendTimer = setInterval(tick,1000);
}

async function sendCode(email, {transition=true}={}){
  if(busy) return;
  clearMessages();
  busy = true;
  sendButton.disabled = true;
  sendButton.classList.add("is-busy");
  setMessage(emailMessage,t("sending"),"success");
  try{
    await requestEmailCode({email,locale:lang()});
    sessionStorage.setItem("sucesso-auth-email", email);
    setMessage(emailMessage,t("sent"),"success");
    if(transition) setTimeout(()=>showCodeStep(email),130);
    else {
      setMessage(codeMessage,t("sent"),"success");
      resetCodeInputs();
      codeInputs[0]?.focus({preventScroll:true});
      startResendCountdown(45);
    }
  }catch(error){
    console.error("requestEmailCode:",error);
    const code = String(error?.code || "");
    const message = code.includes("resource-exhausted") ? t("rateLimited") : t("serviceError");
    setMessage(transition ? emailMessage : codeMessage,message,"error");
  }finally{
    busy=false;
    sendButton.disabled=false;
    sendButton.classList.remove("is-busy");
  }
}

async function verifyCode(){
  if(verifying) return;
  const code = codeInputs.map(input=>input.value).join("");
  if(!/^\d{6}$/.test(code)) return;
  verifying=true;
  clearMessages();
  setCodeDisabled(true);
  setMessage(codeMessage,t("verifying"),"success");
  try{
    const result = await verifyEmailCode({email:currentEmail,code});
    const link = result?.data?.signInLink;
    if(typeof link !== "string" || !link){ throw new Error("Missing sign-in link"); }
    submissionInProgress=true;
    await setPersistence(auth,browserLocalPersistence);
    const credential = await signInWithEmailLink(auth,currentEmail,link);
    await setDoc(doc(db,"usuarios",credential.user.uid),{
      email:currentEmail,
      ultimoAcceso:serverTimestamp()
    },{merge:true});
    sessionStorage.removeItem("sucesso-auth-email");
    window.location.replace(destination());
  }catch(error){
    console.error("verifyEmailCode:",error);
    verifying=false;
    setCodeDisabled(false);
    const codeName = String(error?.code || "");
    let message = t("invalidCode");
    if(codeName.includes("deadline-exceeded") || codeName.includes("failed-precondition")) message=t("expiredCode");
    else if(codeName.includes("resource-exhausted")) message=t("tooMany");
    else if(codeName.includes("internal") || codeName.includes("unavailable") || codeName.includes("network")) message=t("serviceError");
    setMessage(codeMessage,message,"error");
    resetCodeInputs();
    codeInputs[0]?.focus({preventScroll:true});
  }
}

form?.addEventListener("submit", async (event)=>{
  event.preventDefault();
  const email=normalizeEmail(emailInput.value);
  emailInput.value=email;
  if(!validEmail(email)){
    setMessage(emailMessage,t("invalidEmail"),"error");
    emailInput.focus();
    return;
  }
  await sendCode(email,{transition:true});
});

changeButton?.addEventListener("click",showEmailStep);
resendButton?.addEventListener("click",()=>sendCode(currentEmail,{transition:false}));

codeInputs.forEach((input,index)=>{
  input.addEventListener("input",()=>{
    input.value=input.value.replace(/\D/g,"").slice(0,1);
    if(input.value && index < codeInputs.length-1) codeInputs[index+1].focus();
    if(codeInputs.every(i=>/^\d$/.test(i.value))) verifyCode();
  });
  input.addEventListener("keydown",event=>{
    if(event.key === "Backspace" && !input.value && index>0){
      codeInputs[index-1].focus();
      codeInputs[index-1].value="";
    }
    if(event.key === "ArrowLeft" && index>0) codeInputs[index-1].focus();
    if(event.key === "ArrowRight" && index<codeInputs.length-1) codeInputs[index+1].focus();
  });
  input.addEventListener("paste",event=>{
    const digits=(event.clipboardData?.getData("text")||"").replace(/\D/g,"").slice(0,6);
    if(!digits) return;
    event.preventDefault();
    codeInputs.forEach((node,i)=>node.value=digits[i]||"");
    const target=codeInputs[Math.min(digits.length,6)-1];
    target?.focus();
    if(digits.length===6) verifyCode();
  });
});

document.addEventListener("paste",event=>{
  if(stepCode.hidden) return;
  if(event.target?.classList?.contains("su-auth-code-input")) return;
  const digits=(event.clipboardData?.getData("text")||"").replace(/\D/g,"").slice(0,6);
  if(digits.length!==6) return;
  event.preventDefault();
  codeInputs.forEach((node,i)=>node.value=digits[i]||"");
  verifyCode();
});

function openLegal(kind){
  const language=lang();
  legalTitle.textContent=kind==="terms"?translations[language].termsTitle:translations[language].privacyTitle;
  legalBody.innerHTML=legal[language][kind];
  legalModal.dataset.kind=kind;
  legalModal.classList.add("is-open");
  legalModal.setAttribute("aria-hidden","false");
  document.documentElement.style.overflow="hidden";
  legalClose.focus({preventScroll:true});
}
function closeLegal(){
  legalModal.classList.remove("is-open");
  legalModal.setAttribute("aria-hidden","true");
  document.documentElement.style.overflow="";
}
termsTrigger?.addEventListener("click",()=>openLegal("terms"));
privacyTrigger?.addEventListener("click",()=>openLegal("privacy"));
legalClose?.addEventListener("click",closeLegal);
legalModal?.addEventListener("click",event=>{ if(event.target===legalModal) closeLegal(); });
document.addEventListener("keydown",event=>{ if(event.key==="Escape"&&legalModal.classList.contains("is-open")) closeLegal(); });

window.addEventListener("sucesso:country-change",()=>{
  if(resendSeconds>0) resendCountdown.textContent=t("resendIn")(resendSeconds);
  if(!resendButton.hidden) resendButton.textContent=t("resend");
  if(legalModal.classList.contains("is-open")) openLegal(legalModal.dataset.kind||"terms");
});

onAuthStateChanged(auth,(user)=>{
  authResolved=true;
  if(user && !submissionInProgress) window.location.replace(destination());
});

/* Restore the code step after an accidental refresh without exposing any secret. */
const pendingEmail=sessionStorage.getItem("sucesso-auth-email");
if(pendingEmail && validEmail(pendingEmail)){
  emailInput.value=pendingEmail;
  currentEmail=pendingEmail;
}

/* Match the Cherry loader used across the rest of the site: same 2.5 s lifecycle. */
window.addEventListener("load",()=>{
  const loader=$("loader");
  setTimeout(()=>{
    if(loader) loader.style.display="none";
  },2500);
});

/* Avoid a flash of an auth form if Firebase instantly resolves an existing session. */
setTimeout(()=>{ if(!authResolved) document.body.classList.add("auth-ready"); },120);
