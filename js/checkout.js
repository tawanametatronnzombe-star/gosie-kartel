/* =========================================================================
   checkout.js — full checkout engine for Gosie Kartel checkout.html
   Cart, promo codes, shipping, tax, payment methods, validation, Supabase integration.
   ========================================================================= */
(function () {
  "use strict";

  /* -------------------------- Supabase Config -------------------------- */
  const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";
  const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  /* ------------------------------ State ------------------------------ */
  const CART_KEY = "cart"; // Aligned with Gosie Kartel global cart key

  const defaultCart = [
    { id: "p1", name: "Gosie Kartel Winter Hoodie", variant: "Black / Heavyweight", price: 85.0, qty: 1, icon: "🧥" },
    { id: "p2", name: "Gosie Kartel Oversized Tee", variant: "Sand / L", price: 45.0, qty: 1, icon: "👕" }
  ];

  const SHIPPING_METHODS = [
    { id: "std", label: "Standard Delivery", desc: "3–5 business days", price: 15.0 },
    { id: "exp", label: "Express Shipping", desc: "1–2 business days", price: 25.0 },
    { id: "pick", label: "Local Pickup", desc: "Harare Store (Ready in 2h)", price: 0 }
  ];

  const PROMOS = {
    SAVE10: { type: "percent", value: 10, label: "10% off" },
    WELCOME5: { type: "flat", value: 5, label: "$5 off" },
    FREESHIP: { type: "freeship", value: 0, label: "Free shipping" },
    KARTEL: { type: "percent", value: 15, label: "15% off" }
  };

  const state = {
    cart: load(),
    shipping: "std",
    payment: "card",
    promo: null,
    installments: 1,
    taxRate: 0.145,
  };

  /* ---------------------------- Utilities ---------------------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = (n) => "$" + (Math.round(n * 100) / 100).toFixed(2);

  function load() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : structuredClone(defaultCart);
    } catch (_) {
      return structuredClone(defaultCart);
    }
  }
  function save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (_) {}
  }

  let toastTimer;
  function toast(msg, isError) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("error", !!isError);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function setError(key, msg) {
    const box = document.querySelector(`[data-err="${key}"]`);
    if (box) box.textContent = msg || "";
    const input = document.getElementById(key);
    if (input) input.classList.toggle("invalid", !!msg);
    return !msg;
  }

  /* ------------------------------ Cart UI ---------------------------- */
  function renderCart() {
    const box = $("#cart-items");
    box.innerHTML = "";
    if (!state.cart.length) {
      box.innerHTML = '<p class="hint">Your cart is empty. Explore our collection.</p>';
    }
    state.cart.forEach((item) => {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <div class="thumb">${item.icon || "🛍️"}</div>
        <div>
          <div class="name">${item.name}</div>
          <div class="meta">${item.variant || item.selectedSize || "Standard"} · ${money(item.price)} ea</div>
          <div class="qty">
            <button type="button" data-act="dec" data-id="${item.id}" aria-label="Decrease">−</button>
            <span>${item.qty || item.quantity || 1}</span>
            <button type="button" data-act="inc" data-id="${item.id}" aria-label="Increase">+</button>
          </div>
          <button type="button" class="link" data-act="rm" data-id="${item.id}" style="margin-left:8px">Remove</button>
        </div>
        <div style="font-weight:700">${money(item.price * (item.qty || item.quantity || 1))}</div>`;
      box.appendChild(el);
    });
    $("#item-count").textContent = state.cart.reduce((s, i) => s + Number(i.qty || i.quantity || 1), 0);
  }

  function cartAction(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const { act, id } = btn.dataset;
    const item = state.cart.find((i) => i.id === id);
    if (!item) return;
    const currentQty = Number(item.qty || item.quantity || 1);
    if (act === "inc") item.qty = Math.min(99, currentQty + 1);
    if (act === "dec") item.qty = Math.max(1, currentQty - 1);
    item.quantity = item.qty;
    if (act === "rm") {
      state.cart = state.cart.filter((i) => i.id !== id);
      toast(`${item.name} removed from cart`);
    }
    save();
    renderCart();
    recalc();
  }

  /* --------------------------- Shipping UI --------------------------- */
  function renderShipping() {
    const box = $("#shipping-options");
    box.innerHTML = "";
    SHIPPING_METHODS.forEach((m) => {
      const el = document.createElement("label");
      el.className = "opt" + (state.shipping === m.id ? " sel" : "");
      el.innerHTML = `
        <input type="radio" name="ship" value="${m.id}" ${state.shipping === m.id ? "checked" : ""} />
        <div class="t"><strong>${m.label}</strong><span>${m.desc} · ${eta(m.id)}</span></div>
        <div class="price">${m.price ? money(m.price) : "FREE"}</div>`;
      el.addEventListener("click", () => {
        state.shipping = m.id;
        renderShipping();
        recalc();
        markStep(3);
      });
      box.appendChild(el);
    });
  }

  function eta(id) {
    const days = { std: 5, exp: 2, pick: 0 }[id] ?? 5;
    const d = new Date();
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return days === 0 ? "today" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  /* ------------------------------ Totals ----------------------------- */
  function totals() {
    const subtotal = state.cart.reduce((s, i) => s + i.price * Number(i.qty || i.quantity || 1), 0);
    let discount = 0;
    let shipPrice = (SHIPPING_METHODS.find((m) => m.id === state.shipping) || {}).price || 0;

    if (state.promo) {
      const p = PROMOS[state.promo];
      if (p.type === "percent") discount = subtotal * (p.value / 100);
      if (p.type === "flat") discount = Math.min(p.value, subtotal);
      if (p.type === "freeship") shipPrice = 0;
    }
    if (subtotal - discount >= 150) shipPrice = 0; // free shipping threshold

    const fee = state.payment === "cod" ? 3.5 : state.payment === "paypal" ? subtotal * 0.015 : 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * state.taxRate;
    const total = taxable + shipPrice + tax + fee;
    return { subtotal, discount, shipPrice, tax, fee, total };
  }

  function recalc() {
    const t = totals();
    $("#s-sub").textContent = money(t.subtotal);
    $("#s-disc").textContent = "-" + money(t.discount);
    $("#s-ship").textContent = t.shipPrice ? money(t.shipPrice) : "FREE";
    $("#s-taxrate").textContent = (state.taxRate * 100).toFixed(2).replace(/\.?0+$/, "") + "%";
    $("#s-tax").textContent = money(t.tax);
    $("#s-fee").textContent = money(t.fee);
    $("#s-total").textContent = money(t.total);
    $("#pay-btn").textContent = state.cart.length ? "Pay " + money(t.total) : "Cart is empty";
    $("#pay-btn").disabled = !state.cart.length;

    const showInst = state.payment === "card" && state.installments > 1;
    $("#s-installment").style.display = showInst ? "flex" : "none";
    if (showInst) $("#s-per").textContent = money(t.total / state.installments) + " × " + state.installments;
  }

  /* ------------------------------ Promo ------------------------------ */
  function applyPromo() {
    const code = $("#promo").value.trim().toUpperCase();
    if (!code) return setError("promo", "Enter a code first");
    if (!PROMOS[code]) {
      state.promo = null;
      recalc();
      setError("promo", "That code isn't valid");
      return toast("Invalid promo code", true);
    }
    state.promo = code;
    setError("promo", "");
    recalc();
    toast(`Promo applied: ${PROMOS[code].label}`);
  }

  /* --------------------------- Card helpers -------------------------- */
  function detectBrand(num) {
    const n = num.replace(/\D/g, "");
    if (/^4/.test(n)) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(n)) return "MASTERCARD";
    if (/^3[47]/.test(n)) return "AMEX";
    if (/^6(?:011|5)/.test(n)) return "DISCOVER";
    if (/^(?:2131|1800|35)/.test(n)) return "JCB";
    return "CARD";
  }

  function luhn(num) {
    const n = num.replace(/\D/g, "");
    if (n.length < 12) return false;
    let sum = 0, alt = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = +n[i];
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  }

  function formatCard(v) {
    const n = v.replace(/\D/g, "").slice(0, 19);
    const amex = /^3[47]/.test(n);
    const groups = amex ? [4, 6, 5] : [4, 4, 4, 4, 3];
    let out = "", i = 0;
    for (const g of groups) {
      if (i >= n.length) break;
      out += (out ? " " : "") + n.substr(i, g);
      i += g;
    }
    return out;
  }

  function wireCard() {
    const num = $("#ccnum"), exp = $("#ccexp"), cvc = $("#cvc"), name = $("#ccname");

    num.addEventListener("input", () => {
      num.value = formatCard(num.value);
      $("#cc-preview").textContent = num.value || "•••• •••• •••• ••••";
      $("#cc-brand").textContent = detectBrand(num.value);
      setError("ccnum", "");
    });
    exp.addEventListener("input", () => {
      let v = exp.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      exp.value = v;
      $("#cc-exp-preview").textContent = v || "MM/YY";
      setError("ccexp", "");
    });
    cvc.addEventListener("input", () => {
      cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4);
      setError("cvc", "");
    });
    name.addEventListener("input", () => {
      $("#cc-name-preview").textContent = name.value.toUpperCase() || "CARDHOLDER NAME";
      setError("ccname", "");
    });
    $("#installments").addEventListener("change", (e) => {
      state.installments = +e.target.value;
      recalc();
    });
  }

  /* ------------------------- Payment switching ----------------------- */
  function wirePayTabs() {
    $$("#pay-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$("#pay-tabs .tab").forEach((t) => t.classList.remove("sel"));
        tab.classList.add("sel");
        state.payment = tab.dataset.pay;
        ["card", "mobile", "paypal", "cod"].forEach((p) => {
          $("#pane-" + p).style.display = p === state.payment ? "" : "none";
        });
        recalc();
        markStep(4);
      });
    });
  }

  /* ---------------------------- Validation --------------------------- */
  const rules = {
    fullname: (v) => (v.trim().length >= 3 ? "" : "Enter your full name"),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) ? "" : "Enter a valid email"),
    phone: (v) => (v.replace(/\D/g, "").length >= 8 ? "" : "Enter a valid phone number"),
    address1: (v) => (v.trim().length >= 5 ? "" : "Enter your street address"),
    city: (v) => (v.trim().length >= 2 ? "" : "Enter your city"),
    zip: (v) => (v.trim().length >= 3 ? "" : "Enter a postal code"),
  };

  function validateField(id) {
    const el = document.getElementById(id);
    if (!el || !rules[id]) return true;
    return setError(id, rules[id](el.value));
  }

  function validateAll() {
    let ok = true;
    Object.keys(rules).forEach((id) => { ok = validateField(id) && ok; });

    if (!$("#samebilling").checked) {
      ok = setError("baddress", $("#baddress").value.trim().length >= 5 ? "" : "Enter your billing address") && ok;
    }

    if (state.payment === "card") {
      ok = setError("ccname", $("#ccname").value.trim().length >= 3 ? "" : "Enter the name on card") && ok;
      ok = setError("ccnum", luhn($("#ccnum").value) ? "" : "That card number looks incorrect") && ok;

      const m = $("#ccexp").value.match(/^(\d{2})\/(\d{2})$/);
      let expErr = "Use MM/YY";
      if (m) {
        const mo = +m[1], yr = 2000 + +m[2];
        const now = new Date();
        if (mo < 1 || mo > 12) expErr = "Invalid month";
        else if (new Date(yr, mo, 0) < new Date(now.getFullYear(), now.getMonth(), 1)) expErr = "Card has expired";
        else expErr = "";
      }
      ok = setError("ccexp", expErr) && ok;

      const need = /^3[47]/.test($("#ccnum").value.replace(/\D/g, "")) ? 4 : 3;
      ok = setError("cvc", $("#cvc").value.length === need ? "" : `CVC must be ${need} digits`) && ok;
    }
    if (state.payment === "mobile") {
      ok = setError("walletphone", $("#walletphone").value.replace(/\D/g, "").length >= 9 ? "" : "Enter a valid wallet number") && ok;
    }
    if (state.payment === "paypal") {
      ok = setError("ppemail", /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test($("#ppemail").value) ? "" : "Enter your PayPal email") && ok;
    }
    ok = setError("terms", $("#terms").checked ? "" : "You must accept the terms") && ok;
    return ok;
  }

  /* ------------------------------ Steps ------------------------------ */
  function markStep(n) {
    $$("#steps .step").forEach((s) => {
      const i = +s.dataset.step;
      s.classList.toggle("active", i === n);
      s.classList.toggle("done", i < n);
    });
  }

  /* ----------------------------- Submit ------------------------------ */
  async function submit(e) {
    e.preventDefault();
    if (!state.cart.length) return toast("Your cart is empty", true);
    if (!validateAll()) {
      const first = document.querySelector(".invalid, .err:not(:empty)");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return toast("Please fix the highlighted fields", true);
    }

    const btn = $("#pay-btn");
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Processing order…";

    const t = totals();
    const orderID = "GK-" + Date.now().toString(36).toUpperCase();

    const orderPayload = {
      order_id: orderID,
      customer_name: $("#fullname").value,
      email: $("#email").value,
      phone: $("#phone").value,
      country: $("#country").value,
      city: $("#city").value,
      address: $("#address1").value,
      zip_code: $("#zip").value || null,
      products: state.cart,
      subtotal: t.subtotal,
      shipping: t.shipPrice,
      total: t.total,
      status: "Awaiting Payment",
      created_at: new Date().toISOString()
    };

    try {
      if (supabaseClient) {
        const { error } = await supabaseClient.from("Orders").insert([orderPayload]);
        if (error) console.error("Supabase Error:", error.message);
      }

      console.log("[Gosie Kartel] Order created", orderPayload);
      $("#order-msg").textContent = `Reference ${orderID} — ${money(t.total)} placed via ${state.payment.toUpperCase()}. Estimated arrival ${eta(state.shipping)}.`;
      $("#modal").classList.add("open");
      
      state.cart = [];
      save();
      renderCart();
      recalc();
      markStep(4);
      toast("Order placed successfully 🎉");
    } catch (err) {
      toast(err.message || "Order placement failed, please try again", true);
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  /* ------------------------------- Init ------------------------------ */
  function init() {
    $("#year").textContent = new Date().getFullYear();

    renderCart();
    renderShipping();
    wireCard();
    wirePayTabs();
    recalc();

    $("#cart-items").addEventListener("click", cartAction);
    $("#apply-promo").addEventListener("click", applyPromo);
    $("#promo").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } });

    Object.keys(rules).forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("blur", () => validateField(id));
        el.addEventListener("input", () => setError(id, ""));
      }
    });

    $("#country").addEventListener("change", (e) => {
      state.taxRate = parseFloat(e.target.selectedOptions[0].dataset.tax || "0");
      recalc();
      toast("Tax rate updated for " + e.target.selectedOptions[0].textContent);
    });

    $("#samebilling").addEventListener("change", (e) => {
      $("#billing-block").style.display = e.target.checked ? "none" : "";
    });

    $("#terms").addEventListener("change", () => setError("terms", ""));

    $$("[data-section]").forEach((sec) => {
      sec.addEventListener("focusin", () => markStep(+sec.dataset.section));
    });

    $("#close-modal").addEventListener("click", () => {
      $("#modal").classList.remove("open");
      $("#checkout-form").reset();
      state.cart = structuredClone(defaultCart);
      save();
      renderCart();
      recalc();
    });

    $("#checkout-form").addEventListener("submit", submit);

    window.addEventListener("beforeunload", (e) => {
      if (state.cart.length && $("#fullname").value) { e.preventDefault(); e.returnValue = ""; }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
     
