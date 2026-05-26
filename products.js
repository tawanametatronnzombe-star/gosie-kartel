const products = [
  {
    id: 1,
    name: "Kartel Hoodie",
    price: 59.99,
    category: "hoodies",
    image: "images/kartel-hoodie.png"
  },
  {
    id: 2,
    name: "Tracksuit Set",
    price: 89.99,
    category: "tracksuits",
    image: "images/tracksuit-set.png"
  },
  {
    id: 3,
    name: "Kartel Beanie",
    price: 19.99,
    category: "accessories",
    image: "images/kartel-beanie.png"
  },
  {
    id: 4,
    name: "Winter Hoodie Black",
    price: 64.99,
    category: "hoodies",
    image: "images/winter-hoodie-black.png"
  },
  {
    id: 5,
    name: "Cyan Kartel Beanie",
    price: 22.99,
    category: "accessories",
    image: "images/cyan-kartel-beanie.png"
  },
  {
    id: 6,
    name: "Tracksuit Hoodie Set",
    price: 99.99,
    category: "tracksuits",
    image: "images/tracksuit-hoodie-set.png"
  }
];

// Automatically render products in shop.html
const productsGrid = document.getElementById("shop-products");

function displayProducts(productsToDisplay) {
  productsGrid.innerHTML = ""; // Clear existing products
  productsToDisplay.forEach(product => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-card");
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>
    `;
    productsGrid.appendChild(productCard);
  });
}

// Initial display
displayProducts(products);

// Optional: add filtering by category
document.getElementById("category-filter").addEventListener("change", function() {
  const selected = this.value;
  if (selected === "all") {
    displayProducts(products);
  } else {
    displayProducts(products.filter(p => p.category === selected));
  }
});
