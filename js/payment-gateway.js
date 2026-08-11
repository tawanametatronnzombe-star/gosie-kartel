/**
 * Gosie Kartel — Unified Payment Gateway v2
 * Handles:
 * - Order creation
 * - Payment redirects
 * - Supabase Orders tracking
 * - Payment completion updates
 */

(function () {
  "use strict";

  const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";

  const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const BASE_URL = "https://tawanametatronnzombe-star.github.io/gosie-kartel";
  const SUCCESS_URL = `${BASE_URL}/order-success.html`;
  const CANCEL_URL = `${BASE_URL}/checkout.html`;

  // Generate Gosie Kartel Order ID
  function generateOrderID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const number = Math.floor(10 + Math.random() * 90);
    return `GK-${code}-${number}`;
  }

  // Get cart
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      return [];
    }
  }

  // Calculate total
  function calculateTotal(cart) {
    let total = 0;

    cart.forEach((item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.price || 0);
      total += price * qty;
    });

    return total;
  }

  // Create pending order
  async function createOrder(customer, paymentMethod) {
    const cart = getCart();

    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty");
    }

    const orderID = generateOrderID();
    const total = calculateTotal(cart);

    const order = {
      order_id: orderID,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      country: customer.country,
      zip_code: customer.zip || null,
      products: cart,
      total: total,
      status: "Awaiting Payment",
      tracking_number: null,
      carrier: null,
      pod_order_id: null,
      created_at: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from("Orders")
          .insert([order]);

        if (error) {
          console.error("Order Save Error:", error.message);
        }
      } catch (err) {
        console.warn("Supabase record error:", err);
      }
    }

    return {
      orderID,
      total
    };
  }

  // Redirect customer to payment
  async function executePaymentRedirect(customer, provider) {
    const order = await createOrder(customer, provider);

    const success = encodeURIComponent(`${SUCCESS_URL}?order_id=${order.orderID}`);
    const cancel = encodeURIComponent(CANCEL_URL);

    let url;

    switch (provider) {
      case "paynow":
        url = `https://www.paynow.co.zw/Payment/BillPaymentLink/?amount=${order.total}&reference=${order.orderID}&returnurl=${success}`;
        break;

      case "flutterwave":
        url = `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${order.orderID}&amount=${order.total}&currency=USD&redirect_url=${success}&customer_email=${encodeURIComponent(customer.email)}`;
        break;

      default:
        url = `https://secure.3gdirectpay.com/payv3.asp?id=${order.orderID}&amount=${order.total}&returnurl=${success}&backurl=${cancel}`;
        break;
    }

    localStorage.removeItem("cart");
    window.location.href = url;
  }

  // Called after successful payment
  async function confirmPayment(orderID, paymentID = null) {
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
    executePaymentRedirect,
    generateOrderID,
    confirmPayment,
    calculateTotal
  };
})();
            
