# CampusBite API Documentation

## Overview

The CampusBite backend is a Node.js + Express REST API backed by PostgreSQL (via Sequelize).
All endpoints are prefixed with `/api`. Responses are JSON.

- **Base URL (development):** `http://localhost:5000/api`
- **Auth:** JWT Bearer token — `Authorization: Bearer <token>`
- **Roles:** `consumer`, `vendor`, `food_courier`, `admin`

---

## Authentication

### POST /auth/register
Register a new user account. Returns a JWT and user object.

**Body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "phone": "0712345678",
  "role": "consumer"
}
```

**Response `201`:**
```json
{ "success": true, "token": "jwt...", "user": { "id": "...", "name": "Alice", "role": "consumer" } }
```

---

### POST /auth/login
Authenticate and return a JWT. The device's Expo push token should be registered immediately after login (see PUT /auth/device-token).

**Body:**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

**Response `200`:**
```json
{ "success": true, "token": "jwt...", "user": { ... } }
```

---

### POST /auth/check-status
Check approval/verification status for a given email. Used on the pending-approval screen to poll for changes without re-logging in.

**Body:** `{ "email": "alice@example.com" }`

---

### GET /auth/me
Return the currently authenticated user's profile.

**Auth:** required

---

### PUT /auth/profile
Update the authenticated user's name, phone, and/or profile photo.

**Auth:** required  
**Content-Type:** `multipart/form-data` (when uploading a photo) or `application/json`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | optional |
| `phone` | string | optional |
| `avatar` | file | optional — JPEG, PNG, or WEBP, max 5 MB |

**Response `200`:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Alice",
    "profile_photo": "/uploads/avatars/abc123_avatar.jpg"
  }
}
```

Profile photos are served at `http://localhost:5000/uploads/avatars/<filename>`. Append `?t=<timestamp>` to bust the browser cache after an update.

---

### PUT /auth/password
Change the authenticated user's password.

**Auth:** required  
**Body:** `{ "currentPassword": "old", "newPassword": "new" }`

---

### PUT /auth/device-token
Register an Expo push token so the backend can send targeted push notifications to this device. Called automatically after login by `authStore`.

**Auth:** required  
**Body:** `{ "device_token": "ExponentPushToken[...]" }`

---

### POST /auth/forgot-password
Request a password-reset email.

**Body:** `{ "email": "alice@example.com" }`

---

### POST /auth/reset-password
Reset password using the token from the email link.

**Body:** `{ "token": "reset_token", "newPassword": "newpass" }`

---

## Vendors

### GET /vendors
List all approved vendors. Supports optional query params: `search`, `category`, `is_open`.

### GET /vendors/:id
Get a single vendor's details.

### GET /vendors/profile/me
Get the vendor profile for the authenticated vendor user.

**Auth:** required (`vendor`)

### PUT /vendors/profile/me
Update the authenticated vendor's business profile.

**Auth:** required (`vendor`)

### PATCH /vendors/profile/me/toggle
Toggle the vendor's `is_open` status.

**Auth:** required (`vendor`)

### GET /vendors/admin/pending
List vendors pending approval.

**Auth:** required (`admin`)

### PATCH /vendors/admin/:id/approve
Approve a vendor application.

**Auth:** required (`admin`)

### PATCH /vendors/admin/:id/reject
Reject a vendor application.

**Auth:** required (`admin`)

---

## Menu

### GET /menu/vendor/:vendorId
Get all menu items for a vendor. Supports `?category=` and `?available=true`.

### POST /menu
Create a new menu item.

**Auth:** required (`vendor`)  
**Content-Type:** `multipart/form-data`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | required |
| `description` | string | optional |
| `price` | number | required |
| `category` | string | optional |
| `is_available` | boolean | default `true` |
| `image` | file | optional |

### PUT /menu/:id
Update a menu item. Same fields as POST.

**Auth:** required (`vendor`)

### DELETE /menu/:id
Delete a menu item.

**Auth:** required (`vendor`)

---

## Orders

### Order Status Lifecycle

```
Received → Preparing → Ready → Collected → In Transit → Delivered
                ↓
           Cancelled  (vendor decline — only from Received)
```

| Status | Set by |
|--------|--------|
| `Received` | System (on payment confirmation) |
| `Preparing` | Vendor |
| `Ready` | Vendor |
| `Collected` | Food Courier |
| `In Transit` | Food Courier |
| `Delivered` | Food Courier |
| `Cancelled` | Vendor (decline route only) |

---

### POST /orders/initiate
Consumer initiates checkout. Orders are only created once payment is confirmed — except cash, which creates the order immediately.

- **M-Pesa**: returns a `checkout_request_id` to poll (STK Push sent to the phone).
- **Card (Stripe)**: creates a Stripe `PaymentIntent` and returns a `client_secret` + `publishable_key` for the checkout page. Not immediate.
- **Cash**: creates the order immediately.

**Auth:** required (`consumer`)

**Body:**
```json
{
  "vendor_id": "uuid",
  "items": [{ "menu_item_id": "uuid", "quantity": 2 }],
  "delivery_address": "Room 4B, Block C",
  "payment_method": "mpesa",
  "phone_number": "2547XXXXXXXX",
  "promo_code": "SAVE20",
  "special_instructions": "No onions"
}
```
`payment_method` is one of `"mpesa"`, `"card"`, `"cash"`.

**Response `200` (M-Pesa):**
```json
{
  "success": true,
  "checkout_request_id": "ws_CO_...",
  "immediate": false,
  "dev_mode": true
}
```

**Response `200` (Card):**
```json
{
  "success": true,
  "payment_id": "uuid",
  "client_secret": "pi_..._secret_...",
  "publishable_key": "pk_test_...",
  "immediate": false,
  "dev_mode": false
}
```
When Stripe isn't configured (`STRIPE_SECRET_KEY` left as placeholder), `dev_mode` is `true` and a simulated `DEV-CARD-...` payment ID is returned instead of a real PaymentIntent.

**Response `201` (cash):**
```json
{
  "success": true,
  "immediate": true,
  "order_id": "uuid"
}
```

---

### POST /orders/dev-confirm/:checkoutRequestId
Development only — simulates a successful M-Pesa or card callback and creates the order. Generic across payment methods; used by both the M-Pesa "Simulate Payment" button and the card "Simulate Card Payment" button when `dev_mode` is true.

**Auth:** required (`consumer`)

---

### POST /orders/confirm-card-payment/:paymentId
Live-mode card confirmation. Re-verifies the PaymentIntent's status directly with Stripe's API (`status === 'succeeded'`) before creating the order — the client's own confirmation is never trusted alone. Called by the `/checkout/card` page after Stripe confirms the card on the client side.

**Auth:** required (`consumer`)

**Response `200`:**
```json
{ "success": true, "order_id": "uuid" }
```

---

### GET /checkout/card?paymentId=...&clientSecret=...&publishableKey=...&token=...
Public (no JWT middleware), server-rendered HTML page embedding Stripe.js + Stripe Elements. Not a JSON API route — it's the page a card checkout `Linking.openURL`s to. The JWT is passed as a query param so the page's own confirmation request can authenticate; postal code is hidden since the app targets Kenya.

---

### GET /orders
Get the authenticated consumer's order history.

**Auth:** required (`consumer`)

---

### GET /orders/:id
Get a single order's full detail. Access is role-scoped: consumers see their own orders, food couriers see orders they are assigned to, vendors see their shop's orders.

**Auth:** required

---

### PATCH /orders/:id/status
Advance an order to the next status in the lifecycle. The next status is determined server-side by the TRANSITIONS map — the `status` field in the body is ignored.

**Auth:** required (`vendor` or `food_courier`)

**Response `200`:**
```json
{ "success": true, "new_status": "Preparing", "order_id": "uuid" }
```

---

### PATCH /orders/:id/cancel
Vendor declines/cancels an order. Only works when `status === 'Received'`. Sends a push notification to the consumer.

**Auth:** required (`vendor`)

**Response `200`:**
```json
{ "success": true, "new_status": "Cancelled", "order_id": "uuid" }
```

**Error `400`** — if order is not in `Received` status:
```json
{ "success": false, "message": "Cannot cancel an order that is already \"Preparing\"..." }
```

---

### GET /orders/vendor
Get all orders for the authenticated vendor.

**Auth:** required (`vendor`)  
**Query:** `?status=Received` (optional filter)

---

### GET /orders/food-courier/available
Get orders with status `Ready` and no assigned rider.

**Auth:** required (`food_courier`)

---

### GET /orders/food-courier/mine
Get orders assigned to the authenticated food courier.

**Auth:** required (`food_courier`)  
**Query:** `?status=In+Transit` (optional filter)

---

### PATCH /orders/:id/assign-food-courier
Assign the authenticated food courier to a `Ready` order.

**Auth:** required (`food_courier`)

---

### PATCH /orders/:id/collect-cash
Confirm that the food courier has collected cash payment from the consumer (for cash orders).

**Auth:** required (`food_courier`)

---

### PATCH /orders/:id/location
Update the rider's live GPS location for an in-transit order.

**Auth:** required (`food_courier`)  
**Body:** `{ "lat": -1.2345678, "lng": 36.8234567 }`

---

## Notifications

### GET /notifications
Get all notifications for the authenticated user.

**Auth:** required

### GET /notifications/unread-count
Returns the number of unread notifications.

**Auth:** required

**Response `200`:**
```json
{ "success": true, "unread_count": 3 }
```

### PATCH /notifications/:id/mark-read
Mark a single notification as read.

**Auth:** required

### PATCH /notifications/mark-all-read
Mark all of the user's notifications as read.

**Auth:** required

---

## Favorites

Consumer-only. Lets a consumer save specific menu items for quick reordering from their Profile screen. Vendors have no equivalent — favorites are entirely on the consumer side.

### POST /favorites/toggle
Favorite a menu item if not already favorited, or un-favorite it if it is.

**Auth:** required (`consumer`)
**Body:** `{ "menu_item_id": "uuid" }`

**Response `200`/`201`:**
```json
{ "success": true, "is_favorited": true }
```

### GET /favorites
Get the consumer's favorited menu items, newest first, with vendor info attached (for the "quick reorder" navigation).

**Auth:** required (`consumer`)

**Response `200`:**
```json
{
  "success": true,
  "count": 1,
  "items": [
    {
      "id": "uuid", "name": "Chips", "price": "100.00", "image": "/uploads/menu/...",
      "vendor": { "id": "uuid", "business_name": "Campus Vendor Shop", "is_open": true }
    }
  ]
}
```

### GET /favorites/ids
Lightweight variant returning just the favorited `menu_item_id`s — used by `VendorDetailScreen.js` to mark hearts filled/outline without fetching full item data.

**Auth:** required (`consumer`)

**Response `200`:** `{ "success": true, "menu_item_ids": ["uuid", "uuid"] }`

---

## Payments

These routes are payment-method-agnostic — they work the same for M-Pesa and card checkout sessions, keyed by `checkout_request_id` (M-Pesa) or `payment_id` (card).

### GET /payments/status/:checkoutRequestId
Poll the status of a pending checkout session.

**Response:** `{ "status": "pending" | "confirmed" | "failed", "order_id": "..." }`

### POST /payments/:checkoutRequestId/cancel
Cancel a pending checkout session.

---

## Promo Codes

### POST /promo-codes/validate
Check whether a promo code is valid for a given vendor and subtotal.

**Auth:** required (`consumer`)  
**Body:** `{ "code": "SAVE20", "vendor_id": "uuid", "food_subtotal": 500 }`

### GET /promo-codes/my
Get the authenticated vendor's promo codes.

**Auth:** required (`vendor`)

### POST /promo-codes
Create a new promo code.

**Auth:** required (`vendor`)

### PATCH /promo-codes/:id/toggle
Toggle a promo code's `is_active` status.

**Auth:** required (`vendor`)

### DELETE /promo-codes/:id
Delete a promo code.

**Auth:** required (`vendor`)

---

## Reviews

### POST /reviews
Submit a review for a completed order.

**Auth:** required (`consumer`)  
**Body:** `{ "order_id": "uuid", "vendor_rating": 5, "rider_rating": 4, "comment": "Great!" }`

### GET /reviews/vendor/:vendorId
Get all reviews for a vendor.

### GET /reviews/order/:orderId
Get the review for a specific order.

---

## Verification

### POST /verification/upload
Upload identity/verification documents for the authenticated user. Used on initial registration or when re-submitting after an admin requests additional info (`info_requested` status).

**Auth:** required  
**Content-Type:** `multipart/form-data`

### POST /verification/submit-info
Public endpoint — submit verification documents alongside email/password credentials. Used during the registration flow before the user has a session.

**Content-Type:** `multipart/form-data`

### GET /verification/status
Get the verification status of the authenticated user.

**Auth:** required

---

## Food Courier

### GET /food-courier/profile
Get the authenticated food courier's profile.

**Auth:** required (`food_courier`)

### PUT /food-courier/profile
Update the food courier's profile (vehicle type, etc.).

**Auth:** required (`food_courier`)

### PATCH /food-courier/profile/toggle-availability
Toggle the courier's availability status.

**Auth:** required (`food_courier`)

### GET /food-courier/admin/pending
List food couriers pending approval.

**Auth:** required (`admin`)

### PATCH /food-courier/admin/:id/approve
Approve a food courier application.

**Auth:** required (`admin`)

### PATCH /food-courier/admin/:id/reject
Reject a food courier application.

**Auth:** required (`admin`)

---

## Admin

### GET /admin/stats
Overall platform stats: user counts, order totals, revenue, fulfilment rate.

**Auth:** required (`admin`)

### GET /admin/stats/weekly-orders
Orders broken down by day for the current week.

**Auth:** required (`admin`)

### GET /admin/stats/top-vendors
Top vendors by order volume.

**Auth:** required (`admin`)

### GET /admin/orders
All orders on the platform.

**Auth:** required (`admin`)

### GET /admin/users
All users. Supports `?role=` and `?search=` filters.

**Auth:** required (`admin`)

### GET /admin/vendors
All vendors. Supports `?status=` filter.

**Auth:** required (`admin`)

### PATCH /admin/users/:id/request-info
Request additional verification documents from a user.

**Auth:** required (`admin`)  
**Body:** `{ "note": "Please upload a clearer photo.", "requestedDocs": "National ID front and back" }`

### PATCH /admin/users/:id/suspend
Toggle a user's `is_suspended` flag.

**Auth:** required (`admin`)

### GET /admin/users/pending-docs
Users who have resubmitted docs after an `info_requested` request.

**Auth:** required (`admin`)

### PATCH /admin/users/:id/approve-docs
Approve resubmitted documents.

**Auth:** required (`admin`)

### PATCH /admin/users/:id/reject-docs
Reject resubmitted documents.

**Auth:** required (`admin`)  
**Body:** `{ "note": "Documents still unclear." }`

---

## Error Responses

All endpoints return a consistent envelope:

```json
{ "success": false, "message": "Human-readable description." }
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Validation error or invalid state transition |
| 401 | Missing or invalid JWT |
| 403 | Insufficient role / resource not owned by caller |
| 404 | Resource not found |
| 409 | Conflict (e.g., rider already assigned) |
| 500 | Server error |
| 503 | External service unavailable (e.g., M-Pesa) |

---

## Static File Serving

Profile photos are served directly by the backend:

```
GET http://localhost:5000/uploads/avatars/<filename>
```

Append a cache-busting query string after upload:
```
http://localhost:5000/uploads/avatars/abc_avatar.jpg?t=1719432929000
```

The `express.static` middleware ignores query params, so the correct file is always returned.
