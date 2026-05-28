// --- Cart functionality ---
// Make sure each product card has a data-id attribute corresponding to product id
document.addEventListener("DOMContentLoaded", () => {

    // Add click listeners to all "Add to Cart" buttons
    const addButtons = document.querySelectorAll(".add-to-cart-btn");
    addButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const productId = btn.dataset.id;
            addToCart(productId);
        });
    });

    // Update cart count in navbar (optional)
    updateCartCount();
});

// Add product to localStorage cart
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    // products is assumed to be your products array from products.js
    const product = products.find(p => p.id == productId);
    if (product) {
        cart.push(product);
        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`${product.name} added to cart`);
        updateCartCount();
    }
}

// Optional: update cart count badge in navbar
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCountEl = document.getElementById("cart-count");
    if(cartCountEl){
        cartCountEl.textContent = cart.length;
    }
}

// Render cart page dynamically
function renderCart() {
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    const container = document.getElementById("cart-items");
    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const totalEl = document.getElementById("total");
    const emptyEl = document.getElementById("empty-cart");
    const checkoutBtn = document.getElementById("checkout-btn");

    container.innerHTML = "";
    if(cartItems.length === 0){
        emptyEl.style.display = "block";
        checkoutBtn.style.display = "none";
        subtotalEl.textContent = "$0.00";
        shippingEl.textContent = "$0.00";
        totalEl.textContent = "$0.00";
    } else {
        emptyEl.style.display = "none";
        checkoutBtn.style.display = "inline-block";

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

        const shipping = subtotal > 50 ? 0 : 5; // free shipping over $50
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        shippingEl.textContent = `$${shipping.toFixed(2)}`;
        totalEl.textContent = `$${(subtotal + shipping).toFixed(2)}`;

        // Remove item buttons
        const removeBtns = document.querySelectorAll(".remove-btn");
        removeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const index = btn.dataset.index;
                cartItems.splice(index, 1);
                localStorage.setItem("cart", JSON.stringify(cartItems));
                renderCart(); // re-render cart
                updateCartCount();
            });
        });
    }
}

// Run on cart page load
if(document.getElementById("cart-items")){
    document.addEventListener("DOMContentLoaded", renderCart);
}
