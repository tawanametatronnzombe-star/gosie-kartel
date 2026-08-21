document.addEventListener("DOMContentLoaded", () => {
    attachCartEvents();
    updateCartCount();
    if (document.getElementById("cart-items")) {
        renderCart();
    }
});

function attachCartEvents() {
    const addButtons = document.querySelectorAll(".add-to-cart-btn");
    addButtons.forEach(btn => {
        btn.removeEventListener("click", handleAddToCart);
        btn.addEventListener("click", handleAddToCart);
    });
}

function handleAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    addToCart(productId);
}

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const product = products.find(p => p.id == productId);
    if (product) {
        cart.push(product);
        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`${product.name} added to cart!`);
        updateCartCount();
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCountEl = document.getElementById("cart-count");
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
    }
}

function renderCart() {
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    const container = document.getElementById("cart-items");
    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const totalEl = document.getElementById("total");
    const emptyEl = document.getElementById("empty-cart");
    const checkoutBtn = document.getElementById("checkout-btn");

    if (!container) return;

    container.innerHTML = "";
    if (cartItems.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        if (checkoutBtn) checkoutBtn.style.display = "none";
        if (subtotalEl) subtotalEl.textContent = "$0.00";
        if (shippingEl) shippingEl.textContent = "$0.00";
        if (totalEl) totalEl.textContent = "$0.00";
    } else {
        if (emptyEl) emptyEl.style.display = "none";
        if (checkoutBtn) checkoutBtn.style.display = "inline-block";

        let subtotal = 0;
        cartItems.forEach((item, index) => {
            subtotal += item.price;
            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <span>${item.name}</span>
                <span>$${item.price.toFixed(2)}</span>
                <button class="remove-btn" data-index="${index}">Remove</button>
            `;
            container.appendChild(div);
        });

        const shipping = subtotal > 50 ? 0 : 5;
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${(subtotal + shipping).toFixed(2)}`;

        const removeBtns = container.querySelectorAll(".remove-btn");
        removeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const index = btn.dataset.index;
                cartItems.splice(index, 1);
                localStorage.setItem("cart", JSON.stringify(cartItems));
                renderCart();
                updateCartCount();
            });
        });
    }
}

// Client-side checkout emailing directly to tawanametatronnzombe@gmail.com
function processDirectCheckout(shippingDetails) {
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    if (cartItems.length === 0) return alert("Your cart is empty!");

    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const shipping = subtotal > 50 ? 0 : 5;
    const total = subtotal + shipping;
    const orderId = "ORD-" + Date.now();

    const newOrder = {
        orderId,
        email: shippingDetails.email.toLowerCase(),
        shippingInfo: shippingDetails,
        items: cartItems,
        subtotal,
        shipping,
        total,
        status: "Processing",
        createdAt: new Date().toISOString()
    };

    // Save order locally for tracking lookup
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));

    // Construct order details email for tawanametatronnzombe@gmail.com
    const itemsFormatted = cartItems.map(i => `- ${i.name}: $${i.price.toFixed(2)}`).join("%0D%0A");
    const subject = encodeURIComponent(`New Order Received - ${orderId}`);
    const body = encodeURIComponent(
        `NEW ORDER DETAILS%0D%0A` +
        `--------------------%0D%0A` +
        `Order ID: ${orderId}%0D%0A` +
        `Customer Email: ${shippingDetails.email}%0D%0A` +
        `Customer Name: ${shippingDetails.firstName} ${shippingDetails.lastName}%0D%0A` +
        `Shipping Address: ${shippingDetails.address}, ${shippingDetails.city} (${shippingDetails.zipCode})%0D%0A` +
        `Phone: ${shippingDetails.phone}%0D%0A%0D%0A` +
        `ITEMS:%0D%0A${itemsFormatted}%0D%0A%0D%0A` +
        `Subtotal: $${subtotal.toFixed(2)}%0D%0A` +
        `Shipping: ${shipping === 0 ? "FREE" : "$" + shipping.toFixed(2)}%0D%0A` +
        `Total: $${total.toFixed(2)}`
    );

    // Trigger local mail app to send email to tawanametatronnzombe@gmail.com
    window.location.href = `mailto:tawanametatronnzombe@gmail.com?subject=${subject}&body=${body}`;

    localStorage.removeItem("cart");
    alert(`Order ${orderId} created! Your email client has been opened to submit the order.`);
    window.location.href = `track-order.html?id=${orderId}&email=${encodeURIComponent(shippingDetails.email)}`;
}
