/**
 * Gosie Kartel — Unified Payment Gateway & Redirect Handler
 * Repository: https://tawanametatronnzombe-star.github.io/gosie-kartel/
 */

(function () {
  "use strict";

  // =========================================================
  // 1. SUPABASE CONFIGURATION
  // =========================================================
  const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";
  
  const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // Exact base URL for GitHub Pages site
  const BASE_URL = "https://tawanametatronnzombe-star.github.io/gosie-kartel";
  const SUCCESS_URL = `${BASE_URL}/order-success.html`;
  const CANCEL_URL = `${BASE_URL}/checkout.html`;

  // Helper to generate unique order ID (Format: GK-X89L1K3P2M-42)
  function generateOrderID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let middle = "";
    for (let i = 0; i < 10; i++) {
      middle += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const suffix = Math.floor(10 + Math.random() * 90);
    return `GK-${middle}-${suffix}`;
  }

  // Load cart from LocalStorage
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      return [];
    }
  }

  // Calculate totals
  function getTotals(cart) {
    let subtotal = 0;
    cart.forEach((item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.price || 0);
      subtotal += price * qty;
    });
    const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
    return {
      subtotal: subtotal,
      shipping: shipping,
      total: subtotal + shipping
    };
  }

  // =========================================================
  // 2. PAYMENT REDIRECT PROCESSOR
  // =========================================================
  async function executePaymentRedirect(customer, providerChoice) {
    const cart = getCart();

    if (!cart || cart.length === 0) {
      throw new Error("Your cart is empty. Please add items before checking out.");
    }

    const totals = getTotals(cart);
    const orderID = generateOrderID();

    // Prepare complete order object
    const orderPayload = {
      order_id: orderID,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      country: customer.country,
      city: customer.city,
      address: customer.address,
      zip_code: customer.zip || null,
      products: cart,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total_price: totals.total,
      payment_provider: providerChoice,
      payment_status: "pending",
      order_status: "Processing",
      created_at: new Date().toISOString()
    };

    // A. Record pending transaction in Supabase
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from("orders").insert([orderPayload]);
        if (error) console.error("Supabase error:", error.message);
      } catch (err) {
        console.warn("Database save error:", err);
      }
    }

    // B. Build Gateway Redirect URLs carrying full order metadata
    const successReturn = encodeURIComponent(`${SUCCESS_URL}?order_id=${orderID}`);
    const cancelReturn = encodeURIComponent(CANCEL_URL);
    let gatewayUrl = "";

    switch (providerChoice) {
      case "paynow":
        // Paynow Zimbabwe Redirect (EcoCash, InnBucks, Zimswitch)
        gatewayUrl = `https://www.paynow.co.zw/Payment/BillPaymentLink/?search=${encodeURIComponent(customer.email)}&amount=${totals.total}&reference=${orderID}&returnurl=${successReturn}`;
        break;

      case "flutterwave":
        // Flutterwave Hosted Checkout Redirect
        gatewayUrl = `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${orderID}&amount=${totals.total}&currency=USD&redirect_url=${successReturn}&customer_email=${encodeURIComponent(customer.email)}&customer_name=${encodeURIComponent(customer.name)}`;
        break;

      case "dpo":
      default:
        // DPO Pay Direct Payment Page Redirect
        gatewayUrl = `https://secure.3gdirectpay.com/payv3.asp?id=${orderID}&amount=${totals.total}&email=${encodeURIComponent(customer.email)}&returnurl=${successReturn}&backurl=${cancelReturn}`;
        break;
    }

    // C. Clear local cart and perform direct browser redirect
    localStorage.removeItem("cart");
    window.location.href = gatewayUrl;
  }

  // Expose function globally to be called from checkout form
  window.GosiePaymentGateway = {
    executePaymentRedirect: executePaymentRedirect,
    generateOrderID: generateOrderID,
    getCartTotals: function () {
      return getTotals(getCart());
    }
  };
})();
        
