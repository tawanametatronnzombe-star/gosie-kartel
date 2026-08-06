// js/checkout.js
// Handles checkout form submission, local order storage, and immediate sync attempt.

(function() {
  function $(id) { return document.getElementById(id); }

  function formatCurrency(n) {
    return '$' + Number(n || 0).toFixed(2);
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function renderCart() {
    const itemsEl = $('checkout-items');
    const subtotalEl = $('checkout-subtotal');
    const shippingEl = $('checkout-shipping');
    const totalEl = $('checkout-total');

    const cart = loadCart();
    itemsEl.innerHTML = '';

    let subtotal = 0;
    if (!cart.length) {
      itemsEl.textContent = 'No items in cart.';
    } else {
      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'checkout-item small';
        const name = item.name || item.title || 'Item';
        const qty = item.quantity || item.qty || 1;
        const price = Number(item.price || item.unit_price || item.total || 0);
        const lineTotal = price * qty;
        subtotal += lineTotal;
        row.textContent = `${name} x${qty} — ${formatCurrency(lineTotal)}`;
        itemsEl.appendChild(row);
      });
    }

    // Simple shipping calculation (free for now)
    const shipping = 0;
    const total = subtotal + shipping;

    subtotalEl.textContent = formatCurrency(subtotal);
    shippingEl.textContent = formatCurrency(shipping);
    totalEl.textContent = formatCurrency(total);

    return { cart, subtotal, shipping, total };
  }

  function showError(msg) {
    const err = $('error-message');
    err.style.display = 'block';
    err.textContent = msg;
    err.focus();
  }

  function clearError() {
    const err = $('error-message');
    err.style.display = 'none';
    err.textContent = '';
  }

  function saveLocalOrder(order) {
    try {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to save order locally', e);
    }
  }

  function generateOrderId() {
    return 'ORD-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
  }

  document.addEventListener('DOMContentLoaded', function() {
    const form = $('checkout-form');
    const postalInput = $('postalCode');
    const countrySelect = $('country');
    renderCart();

    // Track-order button (minimal): if user enters ID show a basic message
    const trackBtn = $('track-btn');
    if (trackBtn) {
      trackBtn.addEventListener('click', function() {
        const id = $('track-order-id').value.trim();
        const out = $('order-tracking-result');
        if (!id) {
          out.innerHTML = '<div class="small">Please enter an Order ID to track.</div>';
          return;
        }
        out.innerHTML = '<div class="small">Tracking not implemented — please check your email for tracking details (order ID: ' + id + ').</div>';
      });
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      clearError();

      const fullName = $('fullName').value.trim();
      const email = $('email').value.trim();
      const phone = $('phone').value.trim();
      const country = countrySelect.value;
      const city = $('city').value.trim();
      const address = $('address').value.trim();
      // IMPORTANT: use || null so empty string is stored as null for Supabase
      const postalCode = postalInput && postalInput.value ? postalInput.value.trim() : '';
      const postalForPayload = (postalInput && postalInput.required) ? (postalCode || null) : (postalCode || null);
      const orderNotes = $('orderNotes').value.trim();

      // Basic validation
      if (!fullName) return showError('Please enter your full name.');
      if (!email) return showError('Please enter your email.');
      if (!phone) return showError('Please enter your phone number.');
      if (!country) return showError('Please select your country.');
      if (!city) return showError('Please enter your city.');
      if (!address) return showError('Please enter your address.');
      if (postalInput && postalInput.required && !postalCode) return showError('Please enter your postal / ZIP code.');

      const { cart, subtotal, shipping, total } = renderCart();
      if (!cart.length) return showError('Your cart is empty.');

      const orderId = generateOrderId();
      const createdAt = new Date().toISOString();

      // Build order object that matches the shape expected by js/supabase.js
      const order = {
        orderId: orderId,
        email: email || null,
        items: cart,
        products: cart,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        status: 'Processing',
        createdAt: createdAt,
        synced: false,
        // shippingInfo shape used by syncLocalOrders
        shippingInfo: {
          firstName: fullName,
          lastName: '',
          email: email || null,
          phone: phone || null,
          country: country || null,
          city: city || null,
          address: address || null,
          postalCode: postalForPayload
        },
        notes: orderNotes || null
      };

      // Save locally and attempt sync
      saveLocalOrder(order);

      // Attempt immediate sync if supabase client exists
      if (window.syncLocalOrders) {
        try { window.syncLocalOrders(); } catch (err) { console.warn('Immediate sync failed', err); }
      }

      // Send confirmation email if EmailJS helper exists
      if (typeof sendOrderConfirmation === 'function') {
        try {
          sendOrderConfirmation({
            customer_name: fullName,
            order_id: orderId,
            items: cart,
            total_price: total,
            status: order.status,
            tracking_link: ''
          });
        } catch (err) {
          console.warn('Failed to send confirmation email', err);
        }
      }

      // Show order id to the user
      const display = $('order-id-display');
      display.textContent = 'Order placed! Your Order ID: ' + orderId;

      // Clear cart (localStorage key 'cart') and re-render
      try { localStorage.removeItem('cart'); } catch (err) { /* ignore */ }
      renderCart();

      // Optionally, you could redirect to a confirmation page here.
    });
  });
})();
