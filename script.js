const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const menuIcon = document.querySelector('.menu-icon'); // Asegúrate de que existe

if (menuToggle && navLinks && menuIcon) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    menuIcon.classList.toggle('open'); // esto aplica las transformaciones SVG
  });
}

// === Visualizar producto individual ===
document.querySelectorAll('.view-product').forEach(button => {
  button.addEventListener('click', event => {
    const productId = event.target.dataset.id;
    if (productId) {
      window.location.href = `product-page.html?nombre=${productId}`;
    }
  });
});

// === Buscar producto (botón de lupa) ===
const searchBtn = document.getElementById('search-btn');
const searchBar = document.getElementById('search-bar');
if (searchBtn && searchBar) {
  searchBtn.addEventListener('click', () => {
    const query = searchBar.value.toLowerCase();
    alert(`Buscando: ${query}`);
  });
}

// === Botón de carrito ===
const cartBtn = document.getElementById('cart-btn');
if (cartBtn) {
  cartBtn.addEventListener('click', () => {
    const cartOverlay = document.getElementById("cart-overlay");
    if (cartOverlay) {
      cartOverlay.classList.remove("hidden");
    }
  });
}


// === Redirección condicional solo para anclas internas ===
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href && href.startsWith('#')) {
    link.addEventListener('click', event => {
      event.preventDefault();
      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth'
        });
      }
    });
  }
});
function setLanguage(lang) {
  fetch("assets/lang/lang.json")
    .then(res => res.json())
    .then(data => {
      // Actualiza textos visibles
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (data[lang] && data[lang][key]) {
          el.textContent = data[lang][key];
        }
      });

      // Actualiza placeholders
      document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (data[lang] && data[lang][key]) {
          el.placeholder = data[lang][key];
        }
      });

      document.documentElement.lang = lang;
      localStorage.setItem("preferredLang", lang);
    })
    .catch(err => console.error("Error cargando idioma:", err));
}

// Restaurar el estado del sidebar después de cambiar el idioma
function handleSidebarStateBeforeLangChange() {
  const navLinks = document.querySelector('.nav-links');
  const menuToggle = document.querySelector('.menu-toggle');
  const isSidebarOpen = navLinks && navLinks.classList.contains('show');
  localStorage.setItem("sidebarOpen", isSidebarOpen);
}

function restoreSidebarState() {
  const navLinks = document.querySelector('.nav-links');
  const menuToggle = document.querySelector('.menu-toggle');
  const wasOpen = localStorage.getItem("sidebarOpen") === "true";

  if (navLinks && menuToggle) {
    if (wasOpen) {
      navLinks.classList.add('show');
      menuToggle.classList.add('open'); // <- si tienes clases para animación
    } else {
      navLinks.classList.remove('show');
      menuToggle.classList.remove('open');
    }
  }
  localStorage.removeItem("sidebarOpen");
}

window.addEventListener("DOMContentLoaded", restoreSidebarState);


onAuthStateChanged(auth, (user) => {
  const accountLink = document.getElementById("account-link");
  const sidebarAccountLink = document.getElementById("sidebar-account-link");
  const sidebarAccountText = document.getElementById("sidebar-account-text");

  if (user) {
    if (accountLink) {
      accountLink.href = "mi-cuenta.html";
      accountLink.title = "My Account";
    }
    if (sidebarAccountLink) {
      sidebarAccountLink.href = "mi-cuenta.html";
    }
    if (sidebarAccountText) {
      sidebarAccountText.textContent = "My Account";
    }
  } else {
    if (accountLink) {
      accountLink.href = "login.html";
      accountLink.title = "Log in";
    }
    if (sidebarAccountLink) {
      sidebarAccountLink.href = "login.html";
    }
    if (sidebarAccountText) {
      sidebarAccountText.textContent = "Log In";
    }
  }
});


  document.addEventListener("DOMContentLoaded", () => {
    const toggles = document.querySelectorAll(".info-toggle");
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const section = toggle.closest(".info-section");
        section.classList.toggle("active");
      });
    });
  });

document.getElementById('sidebar-lang-toggle').addEventListener('click', () => {
  const originalLangPopup = document.querySelector('.lang-popup');
  if (originalLangPopup) {
    handleSidebarStateBeforeLangChange();
    originalLangPopup.classList.add('active');
  }
});


