const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const ORDERS_FILE = "orders.json";

function readOrders() {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ORDERS_FILE));
}

function saveOrders(orders) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function generateOrderId() {
    return Date.now().toString();
}

// Create new order
app.post("/api/orders", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const orders = readOrders();
    const orderId = generateOrderId();
    const order = { orderId, email, status: "Processing" };
    orders.push(order);
    saveOrders(orders);

    res.json({ orderId, status: order.status });
});

// Track order
app.get("/api/orders/:orderId", (req, res) => {
    const { orderId } = req.params;
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ error: "Email required" });

    const orders = readOrders();
    const order = orders.find(o => o.orderId === orderId && o.email.toLowerCase() === email);

    if (order) return res.json({ orderId: order.orderId, status: order.status });
    return res.status(404).json({ error: "Order not found" });
});

// Optional: Update order status
app.put("/api/orders/:orderId", (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = readOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    saveOrders(orders);
    res.json({ orderId: order.orderId, status: order.status });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
})
