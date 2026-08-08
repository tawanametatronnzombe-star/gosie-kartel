// js/checkout.js
// Handles checkout form submission, local order storage, immediate sync attempt,
// country/postal-code visibility & requirement logic, and server submission to Supabase.

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
  function renderCart() {

    const itemsEl = $('checkout-items');
    const summaryItemsEl = $('summary-items');

    const subtotalEl = $('checkout-subtotal') || $('summary-subtotal');
    const shippingEl = $('checkout-shipping') || $('summary-shipping');
    const totalEl = $('checkout-total') || $('summary-total');


    const cart = loadCart();


    if(itemsEl) itemsEl.innerHTML = '';
    if(summaryItemsEl) summaryItemsEl.innerHTML = '';


    let subtotal = 0;


    if (!cart.length) {

        if(itemsEl)
            itemsEl.textContent = 'No items in cart.';

        if(summaryItemsEl)
            summaryItemsEl.textContent = 'No items in cart.';

    } else {


        cart.forEach(item => {


            const name = item.name || item.title || 'Item';

            const qty = Number(item.quantity || item.qty || 1);

            const price = Number(
                item.price ||
                item.unit_price ||
                item.total ||
                0
            );


            const lineTotal = price * qty;

            subtotal += lineTotal;



            const row = document.createElement('div');

            row.className = 'order-item';



            row.innerHTML = `

                <img class="order-img"
                src="${item.image || 'images/product-placeholder.png'}"
                alt="${name}">


                <div class="order-item-info">

                    <div class="order-item-name">
                        ${name}
                    </div>


                    <div class="order-item-variant">
                        ${item.variant || ''}
                    </div>


                    <span class="order-item-qty">
                        Qty: ${qty}
                    </span>

                </div>


                <div class="order-item-price">
                    ${formatCurrency(lineTotal)}
                </div>

            `;



            if(itemsEl)
                itemsEl.appendChild(row.cloneNode(true));


            if(summaryItemsEl)
                summaryItemsEl.appendChild(row);

        });

    }



    // Shipping calculation
    const shipping = subtotal > 0 ? 0 : 0;


    const total = subtotal + shipping;



    if(subtotalEl)
        subtotalEl.textContent = formatCurrency(subtotal);


    if(shippingEl)
        shippingEl.textContent = formatCurrency(shipping);


    if(totalEl)
        totalEl.textContent = formatCurrency(total);



    return {
        cart,
        subtotal,
        shipping,
        total
    };
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

  // Try to submit order to server endpoint; if it fails, return null (fallback)
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
    // country/postal initialization handled elsewhere
    const form = $('checkout-form');
    const postalInput = $('postalCode');
    const countrySelect = $('country');
    renderCart();

    // Track-order quick handler (keeps existing simple tracker)
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
        id: orderId,
        email: email || null,
        items: cart,
        products: cart,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        status: 'Processing',
        createdAt: createdAt,
        date: createdAt,
        synced: false,
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

      // Build server payload (for API fallback)
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

      const display = $('order-id-display');

      // Attempt direct Supabase insert first (client-side anon key)
      let savedToServer = false;
      if (window.supabaseClient) {
        try {
          const orderData = {
            order_id: detailedOrder.orderId,
            customer_name: (detailedOrder.shippingInfo && ((detailedOrder.shippingInfo.firstName || '') + ' ' + (detailedOrder.shippingInfo.lastName || ''))).trim(),
            email: detailedOrder.email || (detailedOrder.shippingInfo && detailedOrder.shippingInfo.email) || null,
            phone: (detailedOrder.shippingInfo && detailedOrder.shippingInfo.phone) || null,
            address: (detailedOrder.shippingInfo && detailedOrder.shippingInfo.address) || null,
            city: (detailedOrder.shippingInfo && detailedOrder.shippingInfo.city) || null,
            country: (detailedOrder.shippingInfo && detailedOrder.shippingInfo.country) || null,
            zip_code: detailedOrder.shippingInfo && detailedOrder.shippingInfo.postalCode ? detailedOrder.shippingInfo.postalCode : null,
            products: detailedOrder.items || detailedOrder.products || [],
            subtotal: detailedOrder.subtotal || 0,
            shipping: detailedOrder.shipping || 0,
            total: detailedOrder.total || 0,
            status: detailedOrder.status || 'processing'
          };

          const { data, error } = await window.supabaseClient
            .from('orders')
            .insert([orderData])
            .select();

          if (error) {
            console.warn('Supabase insert error:', error);
          } else {
            savedToServer = true;
            const returned = Array.isArray(data) && data[0] ? data[0] : null;
            const serverOrderId = returned && (returned.order_id || returned.id) ? (returned.order_id || returned.id) : null;

            // Merge/mark local storage
            try {
              let stored = JSON.parse(localStorage.getItem('orders') || '[]');
              // add or update
              const idx = stored.findIndex(o => (o.id === detailedOrder.id) || (o.orderId === detailedOrder.orderId));
              if (idx !== -1) {
                stored[idx] = Object.assign({}, stored[idx], detailedOrder);
                if (serverOrderId) { stored[idx].id = serverOrderId; stored[idx].orderId = serverOrderId; }
                stored[idx].synced = true;
                stored[idx].syncedAt = new Date().toISOString();
              } else {
                const toStore = Object.assign({}, detailedOrder);
                if (serverOrderId) { toStore.id = serverOrderId; toStore.orderId = serverOrderId; }
                toStore.synced = true;
                toStore.syncedAt = new Date().toISOString();
                stored.push(toStore);
              }
              localStorage.setItem('orders', JSON.stringify(stored));
            } catch (err) {
              console.warn('Failed to update local orders after server insert', err);
            }

            if (display) display.textContent = 'Order placed! Your Order ID: ' + (serverOrderId || detailedOrder.orderId);

            // Optional email confirmation
            if (typeof sendOrderConfirmation === 'function') {
              try {
                sendOrderConfirmation({
                  customer_name: fullName,
                  order_id: serverOrderId || detailedOrder.orderId,
                  items: cart,
                  total_price: total,
                  status: 'Processing',
                  tracking_link: returned && returned.tracking_url ? returned.tracking_url : ''
                });
              } catch (err) { console.warn('Email send failed', err); }
            }
          }

        } catch (err) {
          console.error('Unexpected error during Supabase insert', err);
        }
      }

      // If not saved to server via supabaseClient, try your API endpoint fallback
      if (!savedToServer) {
        const serverResp = await submitOrderToServer(serverPayload);

        if (serverResp && serverResp.ok && serverResp.orderId) {
          // Server accepted -- save merged record locally as synced
          const serverId = serverResp.orderId;
          try {
            let stored = JSON.parse(localStorage.getItem('orders') || '[]');
            detailedOrder.id = serverId;
            detailedOrder.orderId = serverId;
            detailedOrder.synced = true;
            detailedOrder.syncedAt = new Date().toISOString();
            stored.push(detailedOrder);
            localStorage.setItem('orders', JSON.stringify(stored));
          } catch (err) { console.warn('Failed to persist order after API response', err); }

          if (display) display.textContent = 'Order placed! Your Order ID: ' + serverResp.orderId;

          if (typeof sendOrderConfirmation === 'function') {
            try {
              sendOrderConfirmation({
                customer_name: fullName,
                order_id: serverResp.orderId,
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

          if (display) display.textContent = 'Order saved locally. Will sync when online. Order ID: ' + detailedOrder.orderId;

          // Send email if possible (best-effort)
          if (typeof sendOrderConfirmation === 'function') {
            try {
              sendOrderConfirmation({
                customer_name: fullName,
                order_id: detailedOrder.orderId,
                items: cart,
                total_price: total,
                status: 'Pending Sync',
                tracking_link: ''
              });
            } catch (err) { console.warn('Email send failed', err); }
          }
        }
      }

      // Clear cart and re-render
      try { localStorage.removeItem('cart'); } catch (err) { /* ignore */ }
      renderCart();

    });
  });
})();
