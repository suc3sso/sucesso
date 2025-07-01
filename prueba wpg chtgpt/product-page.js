// ✅ PRODUCT-PAGE.JS COMPLETO Y FUNCIONAL

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const nombre = params.get("nombre");

  const productos = [
    {
      name: "Sucesso Jackpot Tee",
      slug: "sucesso-jackpot-tee",
      price: "$30.00",
      imageFront: "images/jackpot-front.png",
      imageBack: "images/jackpot-back.png",
    },
    {
      name: "Cherry Dice Tee",
      slug: "cherry-dice-tee",
      price: "$30.00",
      imageFront: "images/cherry-dice-front.png",
      imageBack: "images/cherry-dice-back.png",
    },
    {
      name: "Chinese Success Tee",
      slug: "chinese-success-tee",
      price: "$25.00",
      imageFront: "images/chinese-front.png",
      imageBack: "images/chinese-back.png",
    }
  ];

  const producto = productos.find(p => p.slug === nombre || p.name === nombre);

  if (producto) {
    document.getElementById("product-name").textContent = producto.name;
    document.getElementById("product-price").textContent = producto.price;
    document.getElementById("product-image-front").src = producto.imageFront;
    document.getElementById("product-image-back").src = producto.imageBack;
    document.getElementById("product-description").textContent = producto.description;
  } else {
    const info = document.querySelector(".product-info");
    if (info) {
      info.innerHTML = `
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas no existe o fue removido.</p>
        <a href="index.html" style="display:inline-block;margin-top:1rem;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">Volver al catálogo</a>
      `;
    }
    return; // no continuar si no hay producto
  }

  // === Activar pestañas de información ===
  document.querySelectorAll(".info-button").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const content = document.getElementById(targetId);
      const isOpen = content.classList.contains("open");

      document.querySelectorAll(".info-content").forEach((el) => el.classList.remove("open"));
      document.querySelectorAll(".info-button").forEach((btn) => btn.classList.remove("open"));

      if (!isOpen) {
        content.classList.add("open");
        button.classList.add("open");
      }
    });
  });

  // === Botón del carrito ===
  const cartBtn = document.getElementById("cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      if (typeof openCart === "function") openCart();
    });
  }

  // === Selección de tallas ===
  document.querySelectorAll(".product-sizes span").forEach(span => {
    span.addEventListener("click", () => {
      document.querySelectorAll(".product-sizes span").forEach(s => s.classList.remove("selected"));
      span.classList.add("selected");
    });
  });

  // === AGREGAR AL CARRITO ===
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const selectedSize = document.querySelector(".product-sizes span.selected");
      if (!selectedSize) {
        alert("Por favor selecciona una talla.");
        return;
      }

      const name = document.getElementById("product-name")?.textContent.trim() || "Producto";
      const priceText = document.getElementById("product-price")?.textContent || "$0.00";
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
      const image = document.getElementById("product-image-front")?.src || "images/default.jpg";
      const size = selectedSize.textContent;
      const slug = nombre;

      const product = { name, price, size, image, slug };

      let cart = JSON.parse(localStorage.getItem("carrito")) || [];
      const existing = cart.find(p => p.name === name && p.size === size);

      if (existing) {
        existing.quantity += 1;
      } else {
        product.quantity = 1;
        cart.push(product);
      }

      localStorage.setItem("carrito", JSON.stringify(cart));
      localStorage.setItem("abrirCarrito", "true");

      if (typeof openCart === "function") {
        openCart();
        if (typeof updateCart === "function") updateCart();
      } else {
        const overlay = document.getElementById("cart-overlay");
        if (overlay) {
          overlay.classList.add("active");
          overlay.classList.remove("hidden");
        }
        if (typeof updateCart === "function") updateCart();
      }
    });
  }

  // === COMPRAR AHORA ===
  const buyNowBtn = document.querySelector(".buy-now-btn");
  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", () => {
      const selectedSize = document.querySelector(".product-sizes span.selected");
      if (!selectedSize) {
        alert("Por favor selecciona una talla.");
        return;
      }

      const name = document.getElementById("product-name")?.textContent.trim() || "Producto";
      const priceText = document.getElementById("product-price")?.textContent || "$0.00";
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
      const image = document.getElementById("product-image-front")?.src || "images/default.jpg";
      const size = selectedSize.textContent;
      const slug = nombre;

      const product = { name, price, size, image, slug, quantity: 1 };

      localStorage.setItem("carrito", JSON.stringify([product]));
      localStorage.setItem("abrirCarrito", "false");
      window.location.href = "checkout.html";
    });
  }
});
