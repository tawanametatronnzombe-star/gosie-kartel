// js/checkout.js

// Initialize Supabase Client
const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Complete Global Country List with Postal Code Flags
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
  { code: "IE", name: "Ireland", hasPostal: true },
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
  { code: "DJ", name: "Djibouti", hasPostal: false },
  { code: "DM", name: "Dominica", hasPostal: false },
  { code: "DO", name: "Dominican Republic", hasPostal: true },
  { code: "EC", name: "Ecuador", hasPostal: true },
  { code: "EG", name: "Egypt", hasPostal: true },
  { code: "SV", name: "El Salvador", hasPostal: true },
  { code: "EE", name: "Estonia", hasPostal: true },
  { code: "ET", name: "Ethiopia", hasPostal: true },
  { code: "FI", name: "Finland", hasPostal: true },
  { code: "GE", name: "Georgia", hasPostal: true },
  { code: "GH", name: "Ghana", hasPostal: false },
  { code: "GR", name: "Greece", hasPostal: true },
  { code: "GT", name: "Guatemala", hasPostal: true },
  { code: "HN", name: "Honduras", hasPostal: true },
  { code: "HK", name: "Hong Kong", hasPostal: false },
  { code: "HU", name: "Hungary", hasPostal: true },
  { code: "IS", name: "Iceland", hasPostal: true },
  { code: "IN", name: "India", hasPostal: true },
  { code: "ID", name: "Indonesia", hasPostal: true },
  { code: "IL", name: "Israel", hasPostal: true },
  { code: "IT", name: "Italy", hasPostal: true },
  { code: "JP", name: "Japan", hasPostal: true },
  { code: "JO", name: "Jordan", hasPostal: true },
  { code: "KR", name: "South Korea", hasPostal: true },
  { code: "KW", name: "Kuwait", hasPostal: true },
  { code: "LV", name: "Latvia", hasPostal: true },
  { code: "LB", name: "Lebanon", hasPostal: true },
  { code: "LT", name: "Lithuania", hasPostal: true },
  { code: "LU", name: "Luxembourg", hasPostal: true },
  { code: "MY", name: "Malaysia", hasPostal: true },
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
  { code: "OM", name: "Oman", hasPostal: true },
  { code: "PK", name: "Pakistan", hasPostal: true },
  { code: "PA", name: "Panama", hasPostal: false },
  { code: "PY", name: "Paraguay", hasPostal: true },
  { code: "PE", name: "Peru", hasPostal: true },
  { code: "PH", name: "Philippines", hasPostal: true },
  { code: "PL", name: "Poland", hasPostal: true },
  { code: "PT", name: "Portugal", hasPostal: true },
  { code: "QA", name: "Qatar", hasPostal: false },
  { code: "RO", name: "Romania", hasPostal: true },
  { code: "SA", name: "Saudi Arabia", hasPostal: true },
  { code: "SG", name: "Singapore", hasPostal: true },
  { code: "SK", name: "Slovakia", hasPostal: true },
  { code: "SI", name: "Slovenia", hasPostal: true },
  { code: "ES", name: "Spain", hasPostal: true },
  { code: "SE", name: "Sweden", hasPostal: true },
  { code: "CH", name: "Switzerland", hasPostal: true },
  { code: "TW", name: "Taiwan", hasPostal: true },
  { code: "TH", name: "Thailand", hasPostal: true },
  { code: "TR", name: "Turkey", hasPostal: true },
  { code: "UA", name: "Ukraine", hasPostal: true },
  { code: "UY", name: "Uruguay", hasPostal: true },
  { code: "VE", name: "Venezuela", hasPostal: true },
  { code: "VN", name: "Vietnam", hasPostal: true }
];

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (e) {
    return [];
  }
}

function formatCurrency(val) {
  return "$" + Number(val || 0).toFixed(2);
}

// Render SHEIN-Style Order Summary Items
function renderCart() {
  const checkoutItems = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("summary-subtotal");
  const shippingEl = document.getElementById("summary-shipping");
  const totalEl = document.getElementById("summary-total");

  const cart = loadCart();

  if (checkoutItems) checkoutItems.innerHTML = "";

  if (!cart || cart.length === 0) {
    if (checkoutItems) {
      checkoutItems.innerHTML = `<div style="padding:16px; text-align:center; color:#888; font-size:13px;">Your cart is empty.</div>`;
    }
    if (subtotalEl) subtotalEl.innerText = "$0.00";
    if (shippingEl) shippingEl.innerText = "$0.00";
    if (totalEl) totalEl.innerText = "$0.00";
    return { cart: [], subtotal: 0, shipping: 0, total: 0 };
  }

  let subtotal = 0;

  cart.forEach((product) => {
    const name = product.name || product.title || "Product";
    const qty = Number(product.quantity || product.qty || 1);
    const price = Number(product.price || 0);
    const image = product.image || product.img || product.photo || "https://via.placeholder.com/70x90/111/fff?text=Item";
    const size = product.size || product.selectedSize || "";
    const color = product.color || product.selectedColor || "";
    const details = [size ? `Size: ${size}` : "", color ? `Color: ${color}` : ""].filter(Boolean).join(" | ");

    const lineTotal = price * qty;
    subtotal += lineTotal;

    if (checkoutItems) {
      const itemCard = document.createElement("div");
      itemCard.className = "shein-cart-item";
      itemCard.innerHTML = `
        <div class="shein-item-img-wrap">
          <img src="${image}" alt="${name}" class="shein-item-img" />
          <span class="shein-qty-badge">x${qty}</span>
        </div>
        <div class="shein-item-info">
          <div class="shein-item-name">${name}</div>
          ${details ? `<div class="shein-item-attr">${details}</div>` : ""}
          <div class="shein-item-price-row">
            <span class="shein-unit-price">${formatCurrency(price)}</span>
            <span class="shein-line-price">${formatCurrency(lineTotal)}</span>
          </div>
        </div>
      `;
      checkoutItems.appendChild(itemCard);
    }
  });

  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const total = subtotal + shipping;

  if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);
  if (shippingEl) shippingEl.innerText = shipping === 0 ? "FREE" : formatCurrency(shipping);
  if (totalEl) totalEl.innerText = formatCurrency(total);

  return { cart, subtotal, shipping, total };
}

// Populate Country Options
function populateCountryOptions(filterText = "") {
  const countrySelect = document.getElementById("cust-country");
  if (!countrySelect) return;

  const currentVal = countrySelect.value;
  countrySelect.innerHTML = `<option value="" disabled ${!currentVal ? "selected" : ""}>-- Select Country --</option>`;

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(filterText.toLowerCase())
  );

  filtered.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.code;
    opt.innerText = c.name;
    if (c.code === currentVal) opt.selected = true;
    countrySelect.appendChild(opt);
  });
}

// Update Postal/ZIP field visibility depending on country requirement
function handleCountryPostalToggle(countryCode) {
  const zipField = document.getElementById("field-zip");
  const zipInput = document.getElementById("cust-zip");
  if (!zipField || !zipInput) return;

  const countryObj = COUNTRIES.find((c) => c.code === countryCode);

  // If country explicitly does NOT use postal codes (e.g., ZW, BW, AE, AO, etc.)
  if (countryObj && countryObj.hasPostal === false) {
    zipField.style.display = "none";
    zipInput.required = false;
    zipInput.value = "";
  } else {
    zipField.style.display = "flex";
    zipInput.required = true;
  }
}

// Initialize Country Selector with Integrated Search Box
function initCountries() {
  const countrySelect = document.getElementById("cust-country");
  if (!countrySelect) return;

  // Render quick search bar inside the select block
  const parent = countrySelect.parentNode;
  if (parent && !document.getElementById("country-search-input")) {
    const searchWrap = document.createElement("div");
    searchWrap.style.marginBottom = "8px";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "country-search-input";
    searchInput.placeholder = "🔍 Search country here...";
    searchInput.style.cssText = "width:100%; padding:10px 12px; background:var(--bg2); border:1px solid var(--border2); border-radius:var(--rs); color:var(--white); font-size:13px; outline:none;";

    searchInput.addEventListener("input", (e) => {
      populateCountryOptions(e.target.value);
    });

    searchWrap.appendChild(searchInput);
    parent.insertBefore(searchWrap, countrySelect);
  }

  populateCountryOptions();

  // Listen to country selection change
  countrySelect.addEventListener("change", (e) => {
    handleCountryPostalToggle(e.target.value);
  });
}

function showError(msg) {
  alert(msg);
}

// Event Listeners Initialization
document.addEventListener("DOMContentLoaded", () => {
  initCountries();
  renderCart();

  // Radio button active state switching
  document.querySelectorAll('input[name="payment_provider"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll(".pm-option").forEach((el) => el.classList.remove("active"));
      const parentOption = e.target.closest(".pm-option");
      if (parentOption) parentOption.classList.add("active");
    });
  });
});
   
