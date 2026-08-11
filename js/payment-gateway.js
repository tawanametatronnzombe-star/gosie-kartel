/**
 * Gosie Kartel — ZB Bank Payment Gateway Integration
 * Website: https://tawanametatronnzombe-star.github.io/gosie-kartel/
 */

(function () {
  "use strict";

  const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";

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

  function calculateTotal(cart) {
    let total = 0;
    cart.forEach((item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.price || 0);
      total += price * qty;
    });
    return total;
  }

  async function processOrderAndPay(customer) {
    const cart = getCart();
    if (!cart || cart.length === 0) {
      throw new Error("Your cart is empty.");
    }

    const orderID = generateOrderID();
    const totalAmount = calculateTotal(cart);

    // 1. Create order record in Supabase
    const orderPayload = {
      order_id: orderID,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      country: customer.country,
      zip_code: customer.zip || null,
      products: cart,
      total: totalAmount,
      status: "Awaiting Payment",
      created_at: new Date().toISOString()
    };

    if (supabaseClient) {
      const { error } = await supabaseClient.from("Orders").insert([orderPayload]);
      if (error) {
        console.error("Supabase insert error:", error.message);
      }
    }

    // 2. Call backend function to securely obtain payment redirect URL
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-zb-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderID,
        amount: totalAmount,
        customer_email: customer.email,
        customer_name: customer.name
      })
    });

    const data = await response.json();

    if (!response.ok || !data.checkout_url) {
      throw new Error(data.error || "Failed to initialize ZB Payment gateway.");
    }

    // 3. Clear cart and redirect user to ZB checkout page
    localStorage.removeItem("cart");
    window.location.href = data.checkout_url;
  }

  window.GosiePaymentGateway = {
    processOrderAndPay: processOrderAndPay,
    generateOrderID: generateOrderID,
    calculateTotal: calculateTotal
  };
})();
