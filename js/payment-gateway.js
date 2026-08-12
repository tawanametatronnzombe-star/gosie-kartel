/**
 * Gosie Kartel — Unified Payment Gateway (ZB Bank Integration)
 * Site: https://tawanametatronnzombe-star.github.io/gosie-kartel/
 */

(function () {
  "use strict";

  const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";

  const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  function generateOrderID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const number = Math.floor(10 + Math.random() * 90);
    return `GK-${code}-${number}`;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      return [];
    }
  }

  function calculateCartTotals(cart) {
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

  async function createOrderRecord(customer, cart, totals, orderID) {
    const orderPayload = {
      order_id: orderID,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      country: customer.country,
      city: customer.city || "",
      address: customer.address,
      zip_code: customer.zip || null,
      products: cart,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      status: "Awaiting Payment",
      created_at: new Date().toISOString()
    };

    if (supabaseClient) {
      const { error } = await supabaseClient
        .from("Orders")
        .insert([orderPayload]);

      if (error) {
        console.error("Supabase Order Creation Error:", error.message);
      }
    }

    return orderPayload;
  }

  async function executePaymentRedirect(customer, providerChoice) {
    const cart = getCart();

    if (!cart || cart.length === 0) {
      throw new Error("Your cart is empty. Please add items before checking out.");
    }

    const orderID = generateOrderID();
    const totals = calculateCartTotals(cart);

    // 1. Save pending order to Supabase
    await createOrderRecord(customer, cart, totals, orderID);

    // 2. Call live Supabase Edge Function to generate checkout redirect
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-zb-session`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          order_id: orderID,
          amount: totals.total,
          customer_email: customer.email,
          customer_name: customer.name,
          provider: providerChoice || "zb_smile_and_pay"
        })
      }
    );

    const sessionData = await response.json();

    if (!response.ok || !sessionData.checkout_url) {
      throw new Error(
        sessionData.error || "Failed to establish payment session with ZB Bank."
      );
    }

    // 3. Clear cart and redirect customer to payment page
    localStorage.removeItem("cart");
    window.location.href = sessionData.checkout_url;
  }

  async function confirmPayment(orderID) {
    if (!supabaseClient) return;

    try {
      await supabaseClient
        .from("Orders")
        .update({ status: "Paid" })
        .eq("order_id", orderID);
    } catch (err) {
      console.warn("Confirm Payment error:", err);
    }

    localStorage.removeItem("cart");
  }

  window.GosiePaymentGateway = {
    executePaymentRedirect: executePaymentRedirect,
    generateOrderID: generateOrderID,
    calculateCartTotals: calculateCartTotals,
    confirmPayment: confirmPayment
  };
})();
      
