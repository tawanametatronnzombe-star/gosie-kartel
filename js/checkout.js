// js/checkout.js

// Initialize Supabase Client (Ensure window.SUPABASE_URL and window.SUPABASE_ANON_KEY are set)
const SUPABASE_URL = "https://your-supabase-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Complete Global Country List with Postal Code Requirement Flags
const COUNTRIES = [
  { code: "ZW", name: "Zimbabwe", hasPostal: false },
  { code: "ZA", name: "South Africa", hasPostal: true },
  { code: "US", name: "United States", hasPostal: true },
  { code: "GB", name: "United Kingdom", hasPostal: true },
  { code: "CA", name: "Canada", hasPostal: true },
  { code: "AU", name: "Australia", hasPostal: true },
  { code: "BW", name: "Botswana", hasPostal: false },
  { code: "ZM", name: "Zambia", hasPostal: false },
  { code: "KE", name: "Kenya", hasPostal: true },
  { code: "NG", name: "Nigeria", hasPostal: true },
  { code: "AE", name: "United Arab Emirates", hasPostal: false },
  { code: "DE", name: "Germany", hasPostal: true },
  { code: "FR", name: "France", hasPostal: true },
  { code: "IE", name: "Ireland", hasPostal: true }
];

function $(id) {
  return document.getElementById(id);
}

function formatCurrency(val) {
  return "$" + Number(val || 0).toFixed(2);
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (e) {
    return [];
  }
}

// Generate Secure Gosie Kartel Order ID format (e.g., GK-3JR7GTIZ0J-57)
function generateOrderID() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let middle = "";
  for (let i = 0; i < 10; i++) {
    middle += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const suffix = Math.floor(10 + Math.random() * 90);
  return `GK-${middle}-${suffix}`;
}

// Populate Country Select Box
function initCountries() {
  const select = $("cust-country");
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Country</option>';
  COUNTRIES.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.code;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

// Dynamic ZIP/Postal Code logic based on selected country
function handleCountryChange() {
  const countryCode = $("cust-country").value;
  const zipField = $("field-zip");
  const zipInput = $("cust-zip");
  const countryObj = COUNTRIES.find(c => c.code === countryCode);

  if (countryObj && countryObj.hasPostal) {
    zipField.style.display = "flex";
    zipInput.required = true;
  } else {
    zipField.style.display = "none";
    zipInput.required = false;
    zipInput.value = ""; // Clear input if hidden
  }
}

// Render Cart Items and Calculate Totals
function renderCart() {
  const itemsContainer = $("checkout-items");
  const subtotalEl = $("summary-subtotal");
  const shippingEl = $("summary-shipping");
  const totalEl = $("summary-total");

  const cart = loadCart();
  if (!itemsContainer) return { cart: [], subtotal: 0, shipping: 0, total: 0 };

  itemsContainer.innerHTML = "";
  let subtotal = 0;

  if (cart.length === 0) {
    itemsContainer.innerHTML = "<p style='color:var(--gray); font-size:13px;'>Your cart is empty.</p>";
    subtotalEl.textContent = "$0.00";
    shippingEl.textContent = "$0.00";
    totalEl.textContent = "$0.00";
    return { cart: [], subtotal: 0, shipping: 0, total: 0 };
  }

  cart.forEach(item => {
    const qty = Number(item.quantity || item.qty || 1);
    const price = Number(item.price || 0);
    const lineTotal = price * qty;
    subtotal += lineTotal;

    const div = document.createElement("div");
    div.className = "summary-item";
    div.innerHTML = `
      <img src="${item.image || 'https://via.placeholder.com/60'}" class="summary-img" alt="${item.name || 'Product'}">
      <div class="summary-details">
        <div class="summary-title">${item.name || 'Streetwear Item'}</div>
        <div class="summary-qty">Qty: ${qty}</div>
      </div>
      <div class="summary-price">${formatCurrency(lineTotal)}</div>
    `;
    itemsContainer.appendChild(div);
  });

  const shipping = subtotal > 150 ? 0 : 15; // Example shipping rule
  const total = subtotal + shipping;

  subtotalEl.textContent = formatCurrency(subtotal);
  shippingEl.textContent = shipping === 0 ? "FREE" : formatCurrency(shipping);
  totalEl.textContent = formatCurrency(total);

  return { cart, subtotal, shipping, total };
}

function showError(msg) {
  const bar = $("error-bar");
  if (bar) {
    bar.textContent = msg;
    bar.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Handle Order Submission
async function submitOrder() {
  const bar = $("error-bar");
  if (bar) bar.style.display = "none";

  const btn = $("complete-btn");
  const cartData = renderCart();

  if (cartData.cart.length === 0) {
    showError("Your cart is empty.");
    return;
  }

  // Get Form Values
  const name = $("cust-name").value.trim();
  const email = $("cust-email").value.trim();
  const phone = $("cust-phone").value.trim();
  const country = $("cust-country").value;
  const address = $("cust-address").value.trim();
  const city = $("cust-city").value.trim();
  const zip = $("cust-zip").value.trim();
  const provider = document.querySelector('input[name="payment_provider"]:checked')?.value || 'dpo';

  if (!name || !email || !phone || !country || !address || !city) {
    showError("Please fill in all required customer details.");
    return;
  }

  const orderID = generateOrderID();

  const orderPayload = {
    order_id: orderID,
    customer_name: name,
    customer_email: email,
    customer_phone: phone,
    country: country,
    city: city,
    address: address,
    zip_code: zip || null,
    products: cartData.cart,
    subtotal: cartData.subtotal,
    shipping: cartData.shipping,
    total_price: cartData.total,
    payment_provider: provider,
    payment_status: "pending",
    order_status: "Processing"
  };

  btn.disabled = true;
  btn.innerText = "Processing Order...";

  try {
    // 1. Save Pending Order to Supabase
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from("orders")
        .insert([orderPayload]);

      if (error) throw new Error("Database error: " + error.message);
    }

    // 2. Request Payment Session from Backend Function (Avoids API keys on Frontend)
    const response = await fetch("https://your-backend-api.com/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderID,
        amount: cartData.total,
        currency: "USD",
        customer: { name, email, phone },
        provider: provider
      })
    });

    const sessionData = await response.json();

    if (sessionData && sessionData.redirect_url) {
      // Clear Cart and Redirect to Payment Gateway Page
      localStorage.removeItem("cart");
      window.location.href = sessionData.redirect_url;
    } else {
      throw new Error("Failed to initialize payment gateway redirect.");
    }

  } catch (err) {
    console.error(err);
    showError(err.message || "An unexpected error occurred. Please try again.");
    btn.disabled = false;
    btn.innerText = "Complete Payment";
  }
}

// Attach Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  initCountries();
  renderCart();

  // Highlight Selected Payment Option UI
  document.querySelectorAll('input[name="payment_provider"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.pm-option').forEach(el => el.classList.remove('active'));
      e.target.closest('.pm-option').classList.add('active');
    });
  });
});
    
