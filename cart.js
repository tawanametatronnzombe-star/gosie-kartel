// js/cart.js
let cart = [];

// Load cart from localStorage
if (localStorage.getItem("cart")) {
  cart = JSON.parse(localStorage.getItem("cart"));
  updateCartCount();
}

// Connect Add to Cart buttons
function attachCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = parseInt(btn.getAttribute("data-id"));
      const product = products.find(p => p.id === productId);
      cart.push(product);
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      alert(`${product.name} added to cart!`);
    });
  });
}

// Update cart count in navbar
function updateCartCount() {
  const countElem = document.getElementById("cart-count");
  countElem.textContent = cart.length;
}
