# Gosie Kartel - Order Tracking & Email Setup Guide

## Overview
This guide will help you set up the real order tracking system with email confirmations for your Gosie Kartel e-commerce platform.

## Features
✅ Real order tracking with customer details  
✅ Automated email confirmations to customers  
✅ Order status timeline (Processing → In Transit → Out for Delivery → Delivered)  
✅ Complete order details display  
✅ Shipping information storage  
✅ Cart and order management  

## Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- Email service account (Gmail, SendGrid, etc.)
- A modern web browser

## Installation Steps

### 1. Install Backend Dependencies
```bash
npm install
```

This will install:
- `express` - Web server framework
- `body-parser` - Request parsing middleware
- `cors` - Cross-origin resource sharing
- `nodemailer` - Email sending service
- `dotenv` - Environment variable management

### 2. Configure Email Settings

#### Option A: Using Gmail (Recommended for Testing)

1. Enable 2-Factor Authentication on your Google Account:
   - Go to https://myaccount.google.com/
   - Click "Security" in the left menu
   - Enable "2-Step Verification"

2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password

3. Create a `.env` file in your project root:
```bash
cp .env.example .env
```

4. Edit `.env` and add your credentials:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
SUPPORT_EMAIL=your-email@gmail.com
ADMIN_TOKEN=your-secure-admin-token
PORT=3000
```

#### Option B: Using Other Email Services

**SendGrid:**
```
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

**Outlook:**
```
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### 3. Start the Backend Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
Gosie Kartel Backend running on http://localhost:3000
```

### 4. Update Frontend API URL

In your HTML files (`checkout.html` and `track-order.html`), update the API URL:

```javascript
const API_URL = "http://localhost:3000/api"; // Change if using a different URL
```

For production deployment, change this to your actual backend URL:
```javascript
const API_URL = "https://your-backend-domain.com/api";
```

## How It Works

### Customer Checkout Flow

1. **Customer adds items to cart** → Products stored in localStorage
2. **Customer completes checkout** → Order data sent to backend/localStorage
3. **Order confirmation email sent** → Automated email with all order details
4. **Order ID generated** → Unique ID for tracking (e.g., ORD-1234567890)
5. **Order saved** → Stored in backend (JSON file) or localStorage

### Order Tracking Flow

1. **Customer enters Order ID and email** → On track-order.html
2. **System queries backend** → Fetches order data via API
3. **Status calculated** → Based on order age:
   - 0-2 days: Processing
   - 2-5 days: In Transit
   - 5-7 days: Out for Delivery
   - 7+ days: Delivered
4. **Timeline displayed** → Visual representation of order progress
5. **Details shown** → Shipping info, items, totals

## API Endpoints

### Create Order
```
POST /api/orders
Body: {
  email: "customer@example.com",
  shippingInfo: { firstName, lastName, address, city, zipCode, phone, country },
  items: [ { name, price, id } ],
  subtotal: 100,
  shipping: 10,
  total: 110
}
Response: { success: true, orderId: "ORD-123...", status: "Processing" }
```

### Track Order
```
GET /api/orders/:orderId?email=customer@example.com
Response: {
  orderId, email, shippingInfo, items, subtotal, shipping, total,
  status, progress, createdAt, daysSinceOrder
}
```

### Update Order Status (Admin)
```
PUT /api/orders/:orderId
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Body: { status: "In Transit", trackingNumber: "TRK123..." }
```

## File Structure

```
gosie-kartel/
├── server.js              # Main backend server
├── checkout.html          # Checkout page with order creation
├── track-order.html       # Order tracking page
├── shop.html              # Product shop
├── package.json           # Node dependencies
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Example environment variables
└── orders.json            # Stored orders (created automatically)
```

## Email Template

The confirmation email includes:
- Order ID and date
- Customer shipping address
- Items ordered with prices
- Subtotal, shipping, and total
- Order tracking link
- Support contact information

## Troubleshooting

### Email not being sent?
1. Check `.env` file credentials are correct
2. Verify EMAIL_USER and EMAIL_PASS are set
3. Check console for error messages
4. For Gmail: Ensure App Password (not regular password) is used

### "Order not found" error?
1. Verify Order ID and email are correct
2. Check orders.json file exists
3. Try tracking immediately after placing order

### Backend not starting?
1. Ensure Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Check port 3000 is not in use: `lsof -i :3000`
4. Check .env file is properly formatted

### CORS errors?
1. Ensure backend is running on correct port
2. Update API_URL in HTML files to match backend URL
3. Check server has CORS enabled (already in server.js)

## Deployment

### Heroku Deployment
1. Create Heroku account and app
2. Set environment variables:
   ```
   heroku config:set EMAIL_USER="your-email@gmail.com"
   heroku config:set EMAIL_PASS="your-app-password"
   ```
3. Deploy:
   ```
   git push heroku main
   ```

### Railway/Render Deployment
Similar process - set environment variables in dashboard, push code

### Self-hosted
1. Update API_URL in HTML files to your server
2. Configure firewall to allow port 3000
3. Use a process manager like PM2

## Advanced Configuration

### Custom Email Template
Edit the `sendOrderConfirmationEmail` function in `server.js` to customize the email HTML.

### Admin Dashboard
You can create an admin page to:
- View all orders
- Update order status
- Send manual emails
- Generate reports

### Database Integration
Currently uses JSON file storage. For production, integrate:
- MongoDB
- PostgreSQL
- Firebase

## Security Notes

1. **Never commit .env files** - Add to .gitignore
2. **Use strong ADMIN_TOKEN** - For production endpoints
3. **Validate all inputs** - Server-side validation
4. **Use HTTPS** - In production (not HTTP)
5. **Rate limiting** - Add to prevent abuse
6. **Authentication** - Add user accounts for admin access

## Support

For issues or questions:
- Check console for error messages
- Review logs in `server.js` output
- Verify all dependencies are installed
- Ensure environment variables are set correctly

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure email: Update `.env` file
3. ✅ Start server: `npm run dev`
4. ✅ Test checkout: Place a test order
5. ✅ Verify email: Check inbox for confirmation
6. ✅ Track order: Use track-order.html to view status
7. ✅ Deploy: Follow deployment guide for production

---

**Enjoy your enhanced Gosie Kartel platform!** 🚀
