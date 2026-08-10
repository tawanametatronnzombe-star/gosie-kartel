/**
 * Gosie Kartel — Unified Payment Gateway & Redirect Handler
 * Website: https://tawanametatronnzombe-star.github.io/gosie-kartel/
 */

(function () {
  "use strict";

  // 1. SUPABASE CLIENT
  const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";
  
  const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // Base Redirect URLs
  const BASE_URL = "https://tawanametatronnzombe-star.github.io/gosie-kartel";
  const SUCCESS_URL = `${BASE_URL}/order-success.html`;
  const CANCEL_URL = `${BASE_URL}/checkout.html`;

  // Helper to generate order ID
  function generateOrderID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let middle = "";
    for (let i = 0; i < 10; i++) {
      middle += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const suffix = Math.floor(10 + Math.random() * 90);
    return `GK-${middle}-${suffix}`;
  }

  // Helper to read localStorage cart
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      return [];
    }
  }

  // Helper to calculate totals
  function getCartTotals(cart) {
    let subtotal = 0;
    cart.forEach(item => {
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

  // 2. MAIN PAYMENT REDIRECT FUNCTION
  async function executePaymentRedirect(customer, providerChoice) {
    const cart = getCart();

    if (!cart || cart.length === 0) {
      throw new Error("Your cart is empty. Please add items before checking out.");
    }

    const totals = getCartTotals(cart);
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

    // Save pending record to Supabase
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from("orders").insert([orderPayload]);
        if (error) console.error("Supabase Save Error:", error.message);
      } catch (err) {
        console.warn("Database save error:", err);
      }
    }

    // Build Redirect Links carrying customer details & total back-and-forth
    const successRedirect = encodeURIComponent(`${SUCCESS_URL}?order_id=${orderID}`);
    const cancelRedirect = encodeURIComponent(CANCEL_URL);
    let gatewayUrl = "";

    if (providerChoice === "paynow") {
      // Paynow Zimbabwe Gateway
      gatewayUrl = `https://www.paynow.co.zw/Payment/BillPaymentLink/?search=${encodeURIComponent(customer.email)}&amount=${totals.total}&reference=${orderID}&returnurl=${successRedirect}`;
    } else if (providerChoice === "flutterwave") {
      // Flutterwave Gateway
      gatewayUrl = `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${orderID}&amount=${totals.total}&currency=USD&redirect_url=${successRedirect}&customer_email=${encodeURIComponent(customer.email)}&customer_name=${encodeURIComponent(customer.name)}`;
    } else {
      // DPO Pay Direct Gateway
      gatewayUrl = `https://secure.3gdirectpay.com/payv3.asp?id=${orderID}&amount=${totals.total}&email=${encodeURIComponent(customer.email)}&returnurl=${successRedirect}&backurl=${cancelRedirect}`;
    }

    // Clear cart and initiate live redirect
    localStorage.removeItem("cart");
    window.location.href = gatewayUrl;
  }

  // Export to Global Scope
  window.GosiePaymentGateway = {
    executePaymentRedirect: executePaymentRedirect,
    generateOrderID: generateOrderID,
    getCartTotals: getCartTotals
  };
})();
    
