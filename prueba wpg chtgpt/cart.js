// ✅ CART.JS FUNCIONAL: actualización directa del carrito tras agregar producto y checkout con Firebase

document.addEventListener("DOMContentLoaded", () => {
  const cartOverlay = document.getElementById("cart-overlay");
  const cartItemsContainer = document.querySelector(".cart-items");
  const cartTotalElement = document.querySelector(".cart-total");
  const closeCartBtn = document.querySelector(".close-cart");
  const checkoutBtn = document.querySelector(".checkout-btn");
  const cartCount = document.getElementById("cart-count");
  const clearCartBtn = document.getElementById("clear-cart-btn");
  const cartBtn = document.getElementById("cart-btn");
  const cartFooter = document.querySelector(".cart-footer");

  function getTranslatedText(key) {
    const idioma = localStorage.getItem('preferredLang') || 'en';
    const traducciones = {
      size: {
        en: "Size",
        es: "Talla"
      },
    };
    return traducciones[key]?.[idioma] || traducciones[key].en;
  }

  function openCart() {
    if (cartOverlay) {
      cartOverlay.classList.add("active");
      cartOverlay.classList.remove("hidden");
    }
  }

  function closeCart() {
    if (cartOverlay) {
      cartOverlay.classList.remove("active");
      setTimeout(() => cartOverlay.classList.add("hidden"), 300);
    }
  }

  function addToCart(product) {
    if (!product.size) return;

    let cart = JSON.parse(localStorage.getItem("carrito")) || [];
    const existing = cart.find(p => p.name === product.name && p.size === product.size);

    if (existing) {
      existing.quantity += 1;
    } else {
      product.quantity = 1;
      cart.push(product);
    }

    localStorage.setItem("carrito", JSON.stringify(cart));
    updateCart();
    openCart();
  }

  function eliminarProducto(index) {
    let cart = JSON.parse(localStorage.getItem("carrito")) || [];
    cart.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(cart));
    updateCart();
  }

  function mostrarCarga(cartItem) {
    cartItem.classList.add("loading");
    setTimeout(() => {
      cartItem.classList.remove("loading");
    }, 500);
  }

  function updateCart() {
    let cart = JSON.parse(localStorage.getItem("carrito")) || [];

    cartItemsContainer.innerHTML = "";
    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="text-align:center; padding: 14rem 2rem 4rem; width: 100%; color:#999; font-size: 1rem;">
          There are no items in your cart.
        </div>`;
      cartTotalElement.textContent = "";
      if (cartCount) cartCount.textContent = "0";
      if (cartFooter) cartFooter.style.display = "none";
      return;
    }

    if (cartFooter) cartFooter.style.display = "block";

    cart.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("cart-item");
      itemElement.innerHTML = `
        <a href="product-page.html?nombre=${encodeURIComponent(item.slug || item.name)}">
          <img src="${item.image || 'images/default.jpg'}" alt="${item.name}">
        </a>
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p class="cart-size">$${item.price.toFixed(2)}</p>
          <p class="cart-size"><span class="size-label">${getTranslatedText("size")}</span>: ${item.size}</p>
          <div class="quantity-selector">
            <button class="decrease-btn" data-index="${index}">−</button>
            <input type="text" value="${item.quantity}" readonly />
            <button class="increase-btn" data-index="${index}">+</button>
          </div>
        </div>
        <div class="cart-loading-overlay">
          <div class="spinner"></div>
        </div>
      `;

      cartItemsContainer.appendChild(itemElement);
      total += item.price * item.quantity;
      itemCount += item.quantity;
    });

    cartTotalElement.textContent = `Total: $${total.toFixed(2)}`;
    if (cartCount) cartCount.textContent = itemCount.toString();

    document.querySelectorAll(".increase-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        const cartItem = btn.closest(".cart-item");
        mostrarCarga(cartItem);
        setTimeout(() => {
          let cart = JSON.parse(localStorage.getItem("carrito")) || [];
          cart[index].quantity += 1;
          localStorage.setItem("carrito", JSON.stringify(cart));
          updateCart();
        }, 500);
      });
    });

    document.querySelectorAll(".decrease-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        const cartItem = btn.closest(".cart-item");
        mostrarCarga(cartItem);
        setTimeout(() => {
          let cart = JSON.parse(localStorage.getItem("carrito")) || [];
          if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
          } else {
            cart.splice(index, 1);
          }
          localStorage.setItem("carrito", JSON.stringify(cart));
          updateCart();
        }, 500);
      });
    });
  }

  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);

  if (cartOverlay) {
    cartOverlay.addEventListener("click", (e) => {
      if (e.target === cartOverlay) closeCart();
    });
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      localStorage.removeItem("carrito");
      updateCart();
    });
  }

  if (cartBtn) cartBtn.addEventListener("click", () => {
    openCart();
    updateCart();
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
      if (carrito.length === 0) {
        alert("Tu carrito está vacío. Agrega productos antes de pagar.");
        return;
      }

      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js").then(({ initializeApp }) => {
        import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js").then(({ getAuth, onAuthStateChanged }) => {
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

onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem("uid", user.uid);  // Guarda UID en localStorage
    window.location.href = "checkout.html";
  } else {
    localStorage.setItem("redirigirACheckout", "true");
    window.location.href = "login.html";
  }
});

        });
      });
    });
  }

  updateCart();
  window.updateCart = updateCart;
  window.openCart = openCart;
});
