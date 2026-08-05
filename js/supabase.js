(function(){
  // js/supabase.js
  // This file initializes a supabase client if keys are provided and
  // provides a background sync utility that will retry sending locally-saved
  // orders (in localStorage key `orders`) to the Supabase `orders` table.
  //
  // How it finds credentials:
  // - window.SUPABASE_URL and window.SUPABASE_ANON_KEY globals (preferred)
  // - <meta name="supabase-url" content="..."> and
  //   <meta name="supabase-anon-key" content="..."> tags in the page
  // If neither is present the client is not initialized and sync is skipped.

  // Helper to read meta tag content
  function getMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }

  const SUPABASE_URL = window.SUPABASE_URL || getMeta('supabase-url');
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || getMeta('supabase-anon-key');

  // Expose a global variable `supabaseClient` so other scripts (checkout.html)
  // can reference it. If keys are missing, the variable will be undefined.
  window.supabaseClient = undefined;

  if (SUPABASE_URL && SUPABASE_ANON_KEY && typeof supabase !== 'undefined') {
    try {
      window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase client initialized');
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      window.supabaseClient = undefined;
    }
  } else {
    if (typeof supabase === 'undefined') {
      console.warn('Supabase JS library not loaded. Please include https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    } else {
      console.warn('Supabase keys not found. Set window.SUPABASE_URL/window.SUPABASE_ANON_KEY or meta tags to enable server sync.');
    }
  }

  // Sync logic: attempts to insert unsynced local orders into Supabase.
  // Orders stored in localStorage have the shape used by checkout.html and
  // now we add a `synced` flag when successfully pushed to server.
  async function syncLocalOrders() {
    if (!navigator.onLine) return;
    const client = window.supabaseClient;
    if (!client) return;

    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (!orders || !orders.length) return;

    // Only try to sync orders that are not marked as synced
    const unsynced = orders.filter(o => !o.synced);
    if (!unsynced.length) return;

    console.log('Attempting to sync', unsynced.length, 'orders to Supabase');

    for (let i = 0; i < unsynced.length; i++) {
      const order = unsynced[i];
      try {
        // Prepare payload to match DB columns used in checkout.html
        const payload = {
          order_id: order.orderId,
          customer_name: (order.shippingInfo && (order.shippingInfo.firstName || order.shippingInfo.lastName)) ? ((order.shippingInfo.firstName || '') + ' ' + (order.shippingInfo.lastName || '')).trim() : null,
          email: order.email || (order.shippingInfo && order.shippingInfo.email) || null,
          phone: order.shippingInfo && order.shippingInfo.phone || null,
          address: order.shippingInfo && order.shippingInfo.address || null,
          city: order.shippingInfo && order.shippingInfo.city || null,
          products: order.items || order.products || [],
          subtotal: order.subtotal || 0,
          shipping: order.shipping || 0,
          total: order.total || 0,
          status: order.status || 'Processing',
          created_at: order.createdAt || new Date().toISOString()
        };

        const { data, error } = await client.from('orders').insert([payload]);
        if (error) {
          console.warn('Supabase insert error for order', order.orderId, error);
          // If we get a rate limit / server error, stop iterating to avoid hammering
          // (we'll retry later via interval/online event)
          break;
        }

        // Mark order as synced
        order.synced = true;
        order.syncedAt = new Date().toISOString();
        console.log('Synced order to Supabase:', order.orderId);

      } catch (err) {
        console.error('Unexpected error while syncing order', order.orderId, err);
        // Stop processing on unexpected errors to avoid losing context
        break;
      }
    }

    // Persist updated orders back to localStorage
    try {
      localStorage.setItem('orders', JSON.stringify(orders));
    } catch (err) {
      console.warn('Failed to update local orders after sync attempt:', err);
    }
  }

  // Expose sync function for manual triggering
  window.syncLocalOrders = syncLocalOrders;

  // Try sync shortly after load and then periodically when online
  window.addEventListener('load', function() {
    setTimeout(() => {
      syncLocalOrders();
    }, 2000);
  });

  // Sync when the browser regains network connectivity
  window.addEventListener('online', function() {
    syncLocalOrders();
  });

  // Periodic attempt (every 60 seconds) but only when online
  setInterval(function() {
    if (navigator.onLine) syncLocalOrders();
  }, 60 * 1000);

})();
