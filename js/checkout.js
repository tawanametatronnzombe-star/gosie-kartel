// js/checkout.js

// Initialize Supabase Client (Ensure window.SUPABASE_URL and window.SUPABASE_ANON_KEY are set)
const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";
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
  { code: "AF", name: "Afghanistan", hasPostal: true },
  { code: "AL", name: "Albania", hasPostal: true },
  { code: "DZ", name: "Algeria", hasPostal: true },
  { code: "AD", name: "Andorra", hasPostal: true },
  { code: "AO", name: "Angola", hasPostal: false },
  { code: "AG", name: "Antigua and Barbuda", hasPostal: false },
  { code: "AR", name: "Argentina", hasPostal: true },
  { code: "AM", name: "Armenia", hasPostal: true },
  { code: "AT", name: "Austria", hasPostal: true },
  { code: "AZ", name: "Azerbaijan", hasPostal: true },

  { code: "BS", name: "Bahamas", hasPostal: false },
  { code: "BH", name: "Bahrain", hasPostal: true },
  { code: "BD", name: "Bangladesh", hasPostal: true },
  { code: "BB", name: "Barbados", hasPostal: true },
  { code: "BY", name: "Belarus", hasPostal: true },
  { code: "BE", name: "Belgium", hasPostal: true },
  { code: "BZ", name: "Belize", hasPostal: false },
  { code: "BJ", name: "Benin", hasPostal: false },
  { code: "BT", name: "Bhutan", hasPostal: true },
  { code: "BO", name: "Bolivia", hasPostal: true },
  { code: "BA", name: "Bosnia and Herzegovina", hasPostal: true },
  { code: "BR", name: "Brazil", hasPostal: true },
  { code: "BN", name: "Brunei", hasPostal: true },
  { code: "BG", name: "Bulgaria", hasPostal: true },
  { code: "BF", name: "Burkina Faso", hasPostal: false },
  { code: "BI", name: "Burundi", hasPostal: false },

  { code: "KH", name: "Cambodia", hasPostal: true },
  { code: "CM", name: "Cameroon", hasPostal: false },
  { code: "CL", name: "Chile", hasPostal: true },
  { code: "CN", name: "China", hasPostal: true },
  { code: "CO", name: "Colombia", hasPostal: true },
  { code: "CR", name: "Costa Rica", hasPostal: true },
  { code: "HR", name: "Croatia", hasPostal: true },
  { code: "CY", name: "Cyprus", hasPostal: true },

  { code: "CZ", name: "Czech Republic", hasPostal: true },

  { code: "DK", name: "Denmark", hasPostal: true },
  { code: "DO", name: "Dominican Republic", hasPostal: true },

  { code: "EC", name: "Ecuador", hasPostal: true },
  { code: "EE", name: "Estonia", hasPostal: true },
  { code: "ET", name: "Ethiopia", hasPostal: true },

  { code: "FJ", name: "Fiji", hasPostal: false },

  { code: "GE", name: "Georgia", hasPostal: true },
  { code: "GR", name: "Greece", hasPostal: true },
  { code: "GT", name: "Guatemala", hasPostal: true },
  { code: "GN", name: "Guinea", hasPostal: false },

  { code: "HN", name: "Honduras", hasPostal: true },
  { code: "HK", name: "Hong Kong", hasPostal: false },
  { code: "HU", name: "Hungary", hasPostal: true },

  { code: "IS", name: "Iceland", hasPostal: true },
  { code: "ID", name: "Indonesia", hasPostal: true },
  { code: "IR", name: "Iran", hasPostal: true },
  { code: "IQ", name: "Iraq", hasPostal: true },
  { code: "IL", name: "Israel", hasPostal: true },
  { code: "IT", name: "Italy", hasPostal: true },

  { code: "JM", name: "Jamaica", hasPostal: false },
  { code: "JP", name: "Japan", hasPostal: true },
  { code: "JO", name: "Jordan", hasPostal: true },

  { code: "KZ", name: "Kazakhstan", hasPostal: true },
  { code: "KW", name: "Kuwait", hasPostal: true },

  { code: "LA", name: "Laos", hasPostal: true },
  { code: "LV", name: "Latvia", hasPostal: true },
  { code: "LB", name: "Lebanon", hasPostal: true },
  { code: "LT", name: "Lithuania", hasPostal: true },
  { code: "LU", name: "Luxembourg", hasPostal: true },

  { code: "MG", name: "Madagascar", hasPostal: false },
  { code: "MW", name: "Malawi", hasPostal: false },
  { code: "MY", name: "Malaysia", hasPostal: true },
  { code: "MV", name: "Maldives", hasPostal: false },
  { code: "MT", name: "Malta", hasPostal: true },
  { code: "MU", name: "Mauritius", hasPostal: true },
  { code: "MX", name: "Mexico", hasPostal: true },
  { code: "MD", name: "Moldova", hasPostal: true },
  { code: "MC", name: "Monaco", hasPostal: true },
  { code: "MN", name: "Mongolia", hasPostal: true },
  { code: "MA", name: "Morocco", hasPostal: true },
  { code: "MZ", name: "Mozambique", hasPostal: false },

  { code: "NP", name: "Nepal", hasPostal: true },
  { code: "NL", name: "Netherlands", hasPostal: true },
  { code: "NZ", name: "New Zealand", hasPostal: true },
  { code: "NI", name: "Nicaragua", hasPostal: true },
  { code: "NO", name: "Norway", hasPostal: true },

  { code: "OM", name: "Oman", hasPostal: false },

  { code: "PK", name: "Pakistan", hasPostal: true },
  { code: "PA", name: "Panama", hasPostal: true },
  { code: "PY", name: "Paraguay", hasPostal: true },
  { code: "PE", name: "Peru", hasPostal: true },
  { code: "PH", name: "Philippines", hasPostal: true },
  { code: "PL", name: "Poland", hasPostal: true },

  { code: "QA", name: "Qatar", hasPostal: false },

  { code: "RO", name: "Romania", hasPostal: true },
  { code: "RU", name: "Russia", hasPostal: true },

  { code: "SA", name: "Saudi Arabia", hasPostal: true },
  { code: "RS", name: "Serbia", hasPostal: true },
  { code: "SG", name: "Singapore", hasPostal: true },
  { code: "SK", name: "Slovakia", hasPostal: true },
  { code: "SI", name: "Slovenia", hasPostal: true },
  { code: "ES", name: "Spain", hasPostal: true },
  { code: "LK", name: "Sri Lanka", hasPostal: true },
  { code: "SE", name: "Sweden", hasPostal: true },
  { code: "CH", name: "Switzerland", hasPostal: true },

  { code: "TW", name: "Taiwan", hasPostal: true },
  { code: "TH", name: "Thailand", hasPostal: true },
  { code: "TN", name: "Tunisia", hasPostal: true },
  { code: "TR", name: "Turkey", hasPostal: true },

  { code: "UA", name: "Ukraine", hasPostal: true },
  { code: "UY", name: "Uruguay", hasPostal: true },
  { code: "UZ", name: "Uzbekistan", hasPostal: true },

  { code: "VE", name: "Venezuela", hasPostal: true },
  { code: "VN", name: "Vietnam", hasPostal: true },

  { code: "YE", name: "Yemen", hasPostal: false },

  { code: "ZM", name: "Zambia", hasPostal: false }
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
    
