// js/checkout.js

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function formatCurrency(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      return [];
    }
  }

  // Populates Country Dropdown
  function populateCountries() {
    const countries = [
      "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Australia",
      "Austria","Belgium","Brazil","Canada","China","Denmark","Egypt","Finland",
      "France","Germany","Greece","India","Indonesia","Ireland","Italy","Japan",
      "Mexico","Netherlands","New Zealand","Norway","Portugal","South Africa",
      "Spain","Sweden","Switzerland","United Kingdom","United States","Zimbabwe"
    ];
    const sel = $("country");
    if (!sel) return;
    countries.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    });
  }

  // RENDER CART + SUMMARY
  function renderCart() {
    const checkoutItems = $("checkout-items");
    const summaryItems = $("summary-items");

    const subtotalEl = $("checkout-subtotal") || $("summary-subtotal");
    const shippingEl = $("checkout-shipping") || $("summary-shipping");
    const totalEl = $("checkout-total") || $("summary-total");

    const itemCount = $("item-count");
    const cart = loadCart();

    if (checkoutItems) checkoutItems.innerHTML = "";
    if (summaryItems) summaryItems.innerHTML = "";

    let subtotal = 0;
    let quantityTotal = 0;

    if (cart.length === 0) {
      if (checkoutItems) checkoutItems.innerHTML = "<p>Your cart is empty</p>";
      if (summaryItems) summaryItems.innerHTML = "<p>Your cart is empty</p>";
    }

    cart.forEach((product) => {
      const name = product.name || product.title || "Product";
      const qty = Number(product.quantity || product.qty || 1);
      const price = Number(product.price || 0);

      const lineTotal = price * qty;
      subtotal += lineTotal;
      quantityTotal += qty;

      const itemHTML = `
        <div class="order-item">
          <img class="order-img" src="${product.image || 'images/product-placeholder.png'}" alt="${name}">
          <div class="order-item-info">
            <div class="order-item-name">${name}</div>
            <div class="order-item-variant">${product.variant || ""}</div>
            <span class="order-item-qty">Qty: ${qty}</span>
          </div>
          <div class="order-item-price">${formatCurrency(lineTotal)}</div>
        </div>
      `;

      if (summaryItems) summaryItems.innerHTML += itemHTML;
      if (checkoutItems) checkoutItems.innerHTML += itemHTML;
    });

    const shipping = subtotal > 0 ? 0 : 0;
    const total = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (shippingEl) shippingEl.textContent = formatCurrency(shipping);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (itemCount) itemCount.textContent = quantityTotal;

    return { cart, subtotal, shipping, total };
  }

  // ORDER ID
  function generateOrderID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let first = "";
    let second = "";

    for (let i = 0; i < 9; i++) {
      first += chars[Math.floor(Math.random() * chars.length)];
    }
    for (let i = 0; i < 2; i++) {
      second += chars[Math.floor(Math.random() * chars.length)];
    }
    return `GK-${first}-${second}`;
  }

  // SAVE LOCAL ORDER
  function saveLocalOrder(order) {
    try {
      let orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push(order);
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (error) {
      console.log("Local order save failed", error);
    }
  }

  // ERROR HANDLING
  function showError(message) {
    const box = $("error-message");
    if (box) {
      box.style.display = "block";
      box.textContent = message;
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function clearError() {
    const box = $("error-message");
    if (box) {
      box.style.display = "none";
      box.textContent = "";
    }
  }

  // PAGE START
  document.addEventListener("DOMContentLoaded", () => {
    populateCountries();
    renderCart();

    const form = $("checkout-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const customer = {
        name: $("fullName") ? $("fullName").value.trim() : "",
        email: $("email") ? $("email").value.trim() : "",
        phone: $("phone") ? $("phone").value.trim() : "",
        country: $("country") ? $("country").value : "",
        city: $("city") ? $("city").value.trim() : "",
        address: $("address") ? $("address").value.trim() : "",
        zip: $("postalCode") ? $("postalCode").value.trim() : ""
      };

      if (!customer.name) return showError("Enter your full name");
      if (!customer.email) return showError("Enter your email");
      if (!customer.phone) return showError("Enter phone number");
      if (!customer.country) return showError("Select country");
      if (!customer.city) return showError("Enter city");
      if (!customer.address) return showError("Enter address");

      const cartData = renderCart();
      if (cartData.cart.length === 0) return showError("Your cart is empty");

      const orderID = generateOrderID();
      const order = {
        order_id: orderID,
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        country: customer.country,
        city: customer.city,
        address: customer.address,
        zip_code: customer.zip,
        products: cartData.cart,
        subtotal: cartData.subtotal,
        shipping: cartData.shipping,
        total: cartData.total,
        status: "Processing",
        created_at: new Date().toISOString()
      };

      // Save order local
      saveLocalOrder(order);

      // Save Supabase if available
      try {
        if (window.supabaseClient) {
          await window.supabaseClient.from("orders").insert([order]);
        }
      } catch (error) {
        console.log("Database error:", error);
      }

      // Clear cart
      localStorage.removeItem("cart");
      renderCart();

      // Show Modal
      const display = $("order-id-display");
      if (display) display.textContent = orderID;

      const modal = $("success-modal");
      if (modal) modal.classList.add("show");
    });
  });
})();
          
