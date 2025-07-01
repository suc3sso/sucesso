import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3u2GKMSAKC_1Cd88KA-rxTOf_Jnt3fuM",
  authDomain: "sucesso-74f7c.firebaseapp.com",
  projectId: "sucesso-74f7c",
  storageBucket: "sucesso-74f7c.appspot.com",
  messagingSenderId: "878844661636",
  appId: "1:878844661636:web:6382f86f18201aecfdd7d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// LOGIN
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginForm["login-email"].value;
    const password = loginForm["login-password"].value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // LOGIN EXITOSO
        if (localStorage.getItem("redirigirACheckout") === "true") {
          localStorage.removeItem("redirigirACheckout");
          window.location.href = "checkout.html";
        } else {
          window.location.href = "mi-cuenta.html";
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Correo o contraseña incorrectos.");
      });
  });
}

// REDIRECCIÓN AUTOMÁTICA SI YA ESTÁ LOGUEADO
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (localStorage.getItem("redirigirACheckout") === "true") {
      localStorage.removeItem("redirigirACheckout");
      window.location.href = "checkout.html";
    } else {
      window.location.href = "mi-cuenta.html";
    }
  }
});
