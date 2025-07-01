import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
  import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    getDoc,
    setDoc
  } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
  const db = getFirestore(app);

  const userInfo = document.getElementById("user-info");
  const passwordDisplay = document.getElementById("password-display");
  const togglePasswordIcon = document.getElementById("toggle-password-icon");
  const logoutBtn = document.getElementById("logout-btn");
  const historialUl = document.getElementById("historial-compras");

  const telefonoInput = document.getElementById("telefono");
  const btnEditar = document.getElementById("btn-editar-telefono");
  const btnGuardar = document.getElementById("btn-guardar-telefono");

  let currentUser = null;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      userInfo.textContent = `Correo: ${user.email}`;

      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const telefono = userDoc.exists() ? userDoc.data().telefono : "";
        telefonoInput.value = telefono || "";
      } catch (e) {
        console.error("Error obteniendo el teléfono:", e);
      }

      try {
        const q = query(collection(db, "compras"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        historialUl.innerHTML = "";

        if (snapshot.empty) {
  historialUl.innerHTML = "";
  const lang = localStorage.getItem("preferredLang") || "en";

  // Cargar las traducciones dinámicamente desde lang.json
  fetch("assets/lang/lang.json")
    .then(res => res.json())
    .then(data => {
      const message = data[lang]?.no_orders || "You have not placed any orders yet.";
      const li = document.createElement("li");
      li.id = "no-orders-msg"; // 👈 le damos ID para actualizarlo luego si cambia el idioma
      li.textContent = message;
      historialUl.appendChild(li);
    })
    .catch(err => {
      console.error("Error cargando idioma:", err);
      const fallback = document.createElement("li");
      fallback.textContent = "You have not placed any orders yet.";
      historialUl.appendChild(fallback);
    });
}
 else {
          snapshot.forEach(doc => {
            const data = doc.data();
            let fechaFormateada = "Fecha desconocida";

            if (data.fecha && typeof data.fecha === "string") {
              fechaFormateada = data.fecha;
            } else if (data.fecha?.toDate) {
              fechaFormateada = data.fecha.toDate().toLocaleString();
            }

            const productos = (data.items || []).map(i => `
              <div style="display: flex; justify-content: space-between; font-size: 0.95rem; padding: 0.2rem 0; border-bottom: 1px solid #eee;">
                <span>${i.nombre || "Producto"}</span>
                <span>${i.cantidad || 1} u.</span>
              </div>
            `).join("");

            const li = document.createElement("li");
            li.style.listStyle = "none";
            li.innerHTML = `
              <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #f9f9f9;">
                <div style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #555;"><strong>Fecha:</strong> ${fechaFormateada}</div>
                ${productos}
                <div style="text-align: right; font-weight: 600; margin-top: 0.5rem;">Total: $${data.total?.toFixed(2) || "0.00"}</div>
              </div>
            `;
            historialUl.appendChild(li);
          });
        }
      } catch (err) {
        historialUl.innerHTML = "<li>Error al cargar tus compras. Intenta nuevamente.</li>";
        console.error("Error consultando compras:", err);
      }

    } else {
      window.location.href = "login.html";
    }
  });

  btnEditar.addEventListener("click", () => {
    telefonoInput.disabled = false;
    btnEditar.classList.add("hidden");
    btnGuardar.classList.remove("hidden");
  });

  btnGuardar.addEventListener("click", async () => {
    const nuevoTelefono = telefonoInput.value.trim();
    if (!nuevoTelefono || !currentUser) return;

    try {
      await setDoc(doc(db, "usuarios", currentUser.uid), { telefono: nuevoTelefono }, { merge: true });
      telefonoInput.disabled = true;
      btnGuardar.classList.add("hidden");
      btnEditar.classList.remove("hidden");
      alert("Número de teléfono guardado correctamente.");
    } catch (error) {
      console.error("Error al guardar el número:", error);
      alert("Error al guardar. Intenta nuevamente.");
    }
  });

  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  });

  window.mostrarSeccion = (id) => {
    document.querySelectorAll('.seccion').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  };

  if (togglePasswordIcon && passwordDisplay) {
    togglePasswordIcon.addEventListener("click", () => {
      passwordDisplay.textContent = passwordDisplay.textContent === "********" ? realPassword : "********";
    });
  }

  let realPassword = "";
