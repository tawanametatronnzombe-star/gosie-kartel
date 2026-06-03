const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("."));

const ORDERS_FILE = "orders.json";

// Email Configuration (Update these with your email service)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com",
        pass: process.env.EMAIL_PASS || "your-app-password"
    }
});

function readOrders() {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ORDERS_FILE));
}

function saveOrders(orders) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function generateOrderId() {
    return "ORD-" + Date.now().toString();
}

// Helper to calculate shipping cost
function calculateShipping(subtotal, country) {
    if (subtotal > 100) return 0;
    const shippingRates = {
        "US": 10,
        "UK": 15,
        "CA": 12,
        "AU": 20,
        "OTHER": 25
    };
    return shippingRates[country] || 25;
}

// Send confirmation email
async function sendOrderConfirmationEmail(order) {
    try {
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Montserrat', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                    .content { margin: 20px 0; }
                    .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    .items-table th { background: #0d6efd; color: white; }
                    .summary { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { font-weight: bold; font-size: 1.2em; color: #0d6efd; }
                    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
                    .status-badge { display: inline-block; background: #ffc107; color: #333; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Confirmation</h1>
                        <p>Thank you for your purchase at Gosie Kartel!</p>
                    </div>

                    <div class="content">
                        <h2>Order Details</h2>
                        <div class="order-details">
                            <p><strong>Order ID:</strong> ${order.orderId}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Status:</strong> <span class="status-badge">${order.status}</span></p>
                        </div>

                        <h2>Shipping Information</h2>
                        <div class="order-details">
                            <p><strong>${order.shippingInfo.firstName} ${order.shippingInfo.lastName}</strong></p>
                            <p>${order.shippingInfo.address}<br>
                            ${order.shippingInfo.city}, ${order.shippingInfo.zipCode}<br>
                            ${order.shippingInfo.country}</p>
                            <p><strong>Phone:</strong> ${order.shippingInfo.phone}</p>
                        </div>

                        <h2>Items Ordered</h2>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>$${item.price.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="summary">
                            <div class="summary-row">
                                <span>Subtotal:</span>
                                <span>$${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Shipping:</span>
                                <span>${order.shipping === 0 ? 'FREE' : '$' + order.shipping.toFixed(2)}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total:</span>
                                <span>$${order.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <h2>Track Your Order</h2>
                        <p>You can track your order using the following link or visit our website:</p>
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Email:</strong> ${order.email}</p>
                        <p>Visit: <a href="https://your-site.com/track-order.html">Track Your Order</a></p>
                    </div>

                    <div class="footer">
                        <p>We're excited to get your order to you! If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'tawanametatronnzombe@gmail.com'}</p>
                        <p>&copy; 2026 Gosie Kartel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER || "noreply@gosiekartel.com",
            to: order.email,
            subject: `Order Confirmation - ${order.orderId}`,
            html: emailHTML
        });

        console.log(`Confirmation email sent to ${order.email}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

// Create new order
app.post("/api/orders", (req, res) => {
    try {
        const { email, shippingInfo, items, subtotal, shipping, total } = req.body;
        
        if (!email || !shippingInfo || !items || items.length === 0) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const orders = readOrders();
        const orderId = generateOrderId();
        
        const order = {
            orderId,
            email: email.toLowerCase(),
            shippingInfo,
            items,
            subtotal,
            shipping,
            total,
            status: "Processing",
            createdAt: new Date().toISOString(),
            trackingNumber: null,
            estimatedDelivery: null
        };

        orders.push(order);
        saveOrders(orders);

        // Send confirmation email
        sendOrderConfirmationEmail(order);

        res.json({
            success: true,
            orderId: order.orderId,
            status: order.status,
            message: `Confirmation email sent to ${order.email}`
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
});

// Track order
app.get("/api/orders/:orderId", (req, res) => {
    try {
        const { orderId } = req.params;
        const email = req.query.email?.toLowerCase();

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const orders = readOrders();
        const order = orders.find(o => o.orderId === orderId && o.email === email);

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Calculate status based on order age
        const orderTime = new Date(order.createdAt).getTime();
        const now = Date.now();
        const daysSinceOrder = Math.floor((now - orderTime) / (1000 * 60 * 60 * 24));

        let status = order.status;
        let progress = 1;

        if (daysSinceOrder >= 7) {
            status = "Delivered";
            progress = 4;
        } else if (daysSinceOrder >= 5) {
            status = "Out for Delivery";
            progress = 3;
        } else if (daysSinceOrder >= 2) {
            status = "In Transit";
            progress = 2;
        }

        res.json({
            orderId: order.orderId,
            email: order.email,
            shippingInfo: order.shippingInfo,
            items: order.items,
            subtotal: order.subtotal,
            shipping: order.shipping,
            total: order.total,
            status: status,
            progress: progress,
            createdAt: order.createdAt,
            daysSinceOrder: daysSinceOrder
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: "Failed to fetch order" });
    }
});

// Update order status (admin endpoint)
app.put("/api/orders/:orderId", (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, trackingNumber } = req.body;
        const adminToken = req.headers.authorization;

        // Simple auth check (replace with proper auth in production)
        if (adminToken !== `Bearer ${process.env.ADMIN_TOKEN}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const orders = readOrders();
        const order = orders.find(o => o.orderId === orderId);

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.status = status;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        
        saveOrders(orders);
        res.json({ orderId: order.orderId, status: order.status });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ error: "Failed to update order" });
    }
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", server: "Gosie Kartel API" });
});

app.listen(PORT, () => {
    console.log(`Gosie Kartel Backend running on http://localhost:${PORT}`);
});
