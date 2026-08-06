// js/checkout.js
// Handles checkout form submission, local order storage, immediate sync attempt,
// country/postal-code visibility & requirement logic, and server submission.

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
    if (!err) return;
    err.style.display = 'block';
    err.textContent = msg;
    err.focus && err.focus();
  }

  function clearError() {
    const err = $('error-message');
    if (!err) return;
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

  // New ID generator per user request
  function generateOrderID(){
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let first = "";
    let second = "";

    for(let i = 0; i < 10; i++){
        first += chars.charAt(Math.floor(Math.random()*chars.length));
    }

    for(let i = 0; i < 2; i++){
        second += chars.charAt(Math.floor(Math.random()*chars.length));
    }

    return `GK-${first}-${second}`;
  }

  // Try to submit order to server endpoint; if it fails, return null
  async function submitOrderToServer(orderPayload) {
    try {
      const resp = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(orderPayload)
      });
      if (!resp.ok) {
        console.warn('Server responded with', resp.status);
        return null;
      }
      const json = await resp.json();
      return json;
    } catch (err) {
      console.warn('Order submit failed', err);
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    // country/postal initialization lives earlier in this file (or is handled elsewhere)
    const form = $('checkout-form');
    const postalInput = $('postalCode');
    const countrySelect = $('country');
    renderCart();

    // Track-order quick handler
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

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearError();

      const fullName = $('fullName').value.trim();
      const email = $('email').value.trim();
      const phone = $('phone').value.trim();
      const country = countrySelect ? countrySelect.value : '';
      const city = $('city').value.trim();
      const address = $('address').value.trim();
      // postalForPayload must be null when empty
      const postalCodeRaw = postalInput && postalInput.value ? postalInput.value.trim() : '';
      const postalForPayload = postalCodeRaw || null;
      const orderNotes = $('orderNotes').value.trim();

      // Basic required checks
      if (!fullName) return showError('Please enter your full name.');
      if (!email) return showError('Please enter your email.');
      if (!phone) return showError('Please enter your phone number.');
      if (!country) return showError('Please select your country.');
      if (!city) return showError('Please enter your city.');
      if (!address) return showError('Please enter your address.');
      if (postalInput && postalInput.required && !postalCodeRaw) return showError('Please enter your postal / ZIP code.');

      const { cart, subtotal, shipping, total } = renderCart();
      if (!cart.length) return showError('Your cart is empty.');

      const orderId = generateOrderID();
      const createdAt = new Date().toISOString();

      // Build detailed order object used for local storage and sync
      const detailedOrder = {
        orderId: orderId,
        id: orderId,                 // duplicate id for orders.html compatibility
        email: email || null,
        items: cart,
        products: cart,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        status: 'Processing',
        createdAt: createdAt,
        date: createdAt,            // duplicate date for orders.html compatibility
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

      // Also save a simple summary so orders.html can display minimal info (keeps same 'orders' array structure)
      // Note: detailedOrder already contains id/date/total/items/status so orders.html will work when reading 'orders'

      // Try server submission first
      const serverPayload = {
        fullName: fullName,
        email: email,
        phone: phone,
        country: country,
        city: city,
        address: address,
        postalCode: postalForPayload,
        items: cart,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        notes: orderNotes || null
      };

      const serverResp = await submitOrderToServer(serverPayload);

      const display = $('order-id-display');

      if (serverResp && serverResp.ok && serverResp.orderId) {
        // Server accepted the order
        // Save detailed order with server order id if different
        detailedOrder.orderId = serverResp.orderId || detailedOrder.orderId;
        detailedOrder.id = serverResp.orderId || detailedOrder.id;
        localStorage.setItem('orders', JSON.stringify((JSON.parse(localStorage.getItem('orders')||'[]')).concat([detailedOrder])));

        if (display) display.textContent = 'Order placed! Your Order ID: ' + (serverResp.orderId || orderId);

        // Optionally send email confirmation (server could handle this)
        if (typeof sendOrderConfirmation === 'function') {
          try {
            sendOrderConfirmation({
              customer_name: fullName,
              order_id: serverResp.orderId || orderId,
              items: cart,
              total_price: total,
              status: 'Processing',
              tracking_link: serverResp.trackingUrl || ''
            });
          } catch (err) { console.warn('Email send failed', err); }
        }

      } else {
        // Fallback: save detailed order locally and attempt background sync
        saveLocalOrder(detailedOrder);

        if (window.syncLocalOrders) {
          try { window.syncLocalOrders(); } catch (err) { console.warn('Immediate sync failed', err); }
        }

        if (display) display.textContent = 'Order saved locally. Will sync when online. Order ID: ' + orderId;

        // Send email if possible (best-effort)
        if (typeof sendOrderConfirmation === 'function') {
          try {
            sendOrderConfirmation({
              customer_name: fullName,
              order_id: orderId,
              items: cart,
              total_price: total,
              status: 'Pending Sync',
              tracking_link: ''
            });
          } catch (err) { console.warn('Email send failed', err); }
        }
      }

      // Clear cart and re-render
      try { localStorage.removeItem('cart'); } catch (err) { /* ignore */ }
      renderCart();

    });
  });
})();
