# CampusBite — Campus Food Ordering System

A full-stack food ordering platform built for campus environments. Students order from verified campus vendors, food couriers handle deliveries, and admins oversee the entire operation through a live dashboard.

---

## Table of Contents

- [Quick Start](#-quick-start)
- [Access Points & Test Accounts](#-access-points--test-accounts)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Feature Overview](#-feature-overview)
- [User Roles & Flows](#-user-roles--flows)
- [Admin Dashboard](#-admin-dashboard)
- [Verification & Document Review System](#-verification--document-review-system)
- [Live Order & Approval Badges](#-live-order--approval-badges)
- [Notification System](#-notification-system)
- [Payment Integration](#-payment-integration)
- [Environment Setup](#-environment-setup)
- [Database Migrations](#-database-migrations)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Option 1: One-Click Startup (Recommended)

**Windows Batch File:**
```bat
start-campusbite.bat
```

**PowerShell:**
```powershell
powershell -ExecutionPolicy Bypass -File start-campusbite.ps1
```

**Node.js Script:**
```bash
npm start
```

### Option 2: Manual Startup

1. **Start PostgreSQL** — ensure it is running on port 5432 and `campusbite_db` exists.

2. **Start the Backend:**
   ```bash
   cd CampusBite_Backend-main
   npm start
   ```

3. **Start the Frontend:**
   ```bash
   cd CampusBite_App-main/CampusBite_App-main
   npx expo start --web --port 8082
   ```

---

## 📱 Access Points & Test Accounts

| Service | URL |
|---|---|
| Frontend | http://localhost:8082 |
| Backend API | http://localhost:5000 |
| API Health Check | http://localhost:5000/api/health |

### Test Accounts

| Role | Email | Password | Status |
|---|---|---|---|
| Consumer | mark@campusbite.com | password123 | Ready |
| Consumer | testuser@campusbite.com | password123 | Ready |
| Admin | sysadmin@campusbite.com | password123 | Ready |
| Vendor | vendor2@campusbite.com | password123 | Needs Admin Approval |
| Food Courier | rider@campusbite.com | password123 | Needs Admin Approval |

> **Note:** Vendor and Food Courier accounts require admin approval and identity document verification before they can access their dashboards.

---

## 🏗️ System Architecture

```
CampusBite_App-main/
├── CampusBite_App-main/
│   └── CampusBite_App-main/
│       └── src/
│           ├── screens/
│           │   ├── admin/
│           │   │   ├── AdminStatsScreen.js         # Platform stats, charts, export
│           │   │   ├── AdminApprovalsScreen.js      # Vendor/courier/document approvals
│           │   │   ├── AdminVendorsScreen.js        # Vendor directory + doc review
│           │   │   ├── AdminOrdersScreen.js         # All orders with status filter
│           │   │   └── AdminUsersScreen.js          # User management + suspend
│           │   ├── consumer/
│           │   │   ├── HomeScreen.js               # Vendor discovery feed
│           │   │   ├── ExploreScreen.js            # Search & browse
│           │   │   ├── VendorDetailScreen.js        # Menu + add to cart
│           │   │   ├── CartScreen.js               # Cart management
│           │   │   ├── CheckoutScreen.js            # Address, promo, payment
│           │   │   ├── PaymentStatusScreen.js       # M-Pesa polling
│           │   │   ├── MyOrdersScreen.js            # Order history
│           │   │   ├── OrderDetailScreen.js         # Live status tracker
│           │   │   └── WriteReviewScreen.js         # Post-delivery review
│           │   ├── vendor/
│           │   │   ├── VendorDashboardScreen.js     # Today's orders overview
│           │   │   ├── VendorOrdersScreen.js        # Order queue management
│           │   │   ├── VendorOrderDetailScreen.js   # Order detail + advance status
│           │   │   ├── MenuScreen.js               # Menu item list
│           │   │   ├── AddMenuItemScreen.js         # Create menu item
│           │   │   ├── EditMenuItemScreen.js        # Edit menu item
│           │   │   ├── VendorPromoCodesScreen.js    # Promo code management
│           │   │   ├── VendorProfileScreen.js       # Business profile
│           │   │   └── VendorSettingsScreen.js      # Document upload + preferences
│           │   ├── foodCourier/
│           │   │   ├── AvailableOrdersScreen.js     # Orders ready for pickup
│           │   │   ├── MyDeliveriesScreen.js        # Earnings + delivery history
│           │   │   ├── RiderOrderDetailScreen.js    # Delivery detail + status advance
│           │   │   ├── FoodCourierProfileScreen.js  # Courier profile
│           │   │   ├── EditProfileScreen.js         # Edit courier profile
│           │   │   ├── AppSettingsScreen.js         # Document upload + settings
│           │   │   ├── NotificationsScreen.js       # In-app notification list
│           │   │   ├── CustomerFeedbackScreen.js    # View customer feedback
│           │   │   └── SupportScreen.js            # Help & support
│           │   ├── auth/
│           │   │   ├── LoginScreen.js              # Login
│           │   │   ├── RegisterScreen.js           # Step 1: account details
│           │   │   ├── VerificationScreen.js       # Step 2: document upload
│           │   │   └── SubmitInfoScreen.js         # Resubmit when admin requests more info
│           │   └── shared/
│           │       ├── ProfileScreen.js            # Universal profile screen
│           │       └── PendingApprovalScreen.js    # Shown while account is under review
│           ├── navigation/
│           │   ├── AdminNavigator.js               # Admin tabs + live approval & order badges
│           │   ├── ConsumerNavigator.js            # Consumer tabs + live order badge
│           │   ├── VendorNavigator.js              # Vendor tabs + live order badge
│           │   ├── FoodCourierNavigator.js         # Courier tabs + live task/delivery badges
│           │   ├── AuthNavigator.js                # Auth flow
│           │   └── PendingNavigator.js             # Pending approval holding screen
│           ├── api/
│           │   └── index.js                        # Axios API client (all endpoints)
│           ├── stores/
│           │   └── cartStore.js                    # Zustand cart state
│           └── constants/
│               └── index.js                        # COLORS, STATUS_COLORS
│
└── CampusBite_Backend-main/
    ├── src/
    │   ├── controllers/
    │   │   ├── auth.controller.js                  # Register, login, profile, device token
    │   │   ├── order.controller.js                 # Full order lifecycle
    │   │   ├── vendor.controller.js                # Vendor profile + approval
    │   │   ├── menu.controller.js                  # Menu CRUD
    │   │   ├── payment.controller.js               # M-Pesa STK Push + callback
    │   │   ├── review.controller.js                # Order reviews
    │   │   ├── notification.controller.js          # In-app notifications CRUD
    │   │   ├── verification.controller.js          # Document upload + status
    │   │   ├── foodCourierProfile.controller.js    # Courier profile + availability
    │   │   └── admin.controller.js                 # Stats, vendors, users, doc review
    │   ├── models/
    │   │   ├── User.js                             # Auth + verification fields
    │   │   ├── Vendor.js                           # Business profile
    │   │   ├── MenuItem.js                         # Menu items
    │   │   ├── Order.js                            # Orders + rider location
    │   │   ├── OrderItem.js                        # Line items
    │   │   ├── Payment.js                          # M-Pesa payments
    │   │   ├── Review.js                           # Consumer reviews
    │   │   ├── Notification.js                     # In-app notifications
    │   │   ├── FoodCourierProfile.js               # Courier-specific data
    │   │   └── index.js                            # Sequelize associations
    │   ├── routes/                                 # Express routers (one per domain)
    │   ├── middleware/
    │   │   └── auth.middleware.js                  # JWT protect + restrictTo
    │   └── services/
    │       ├── notification.service.js             # Firebase Cloud Messaging
    │       └── mpesa.service.js                    # Safaricom Daraja STK Push
    ├── migrations/                                 # Sequential DB migration scripts
    ├── uploads/
    │   ├── menu/                                   # Menu item images
    │   └── verification/                           # Identity documents (gitignored)
    └── .env                                        # Environment variables
```

---

## 🛠️ Technology Stack

### Frontend
| Package | Purpose |
|---|---|
| React Native + Expo | Cross-platform mobile / web UI |
| React Navigation | Stack + bottom-tab navigation |
| Zustand | Lightweight cart state management |
| Axios | HTTP client with JWT interceptor |
| expo-image-picker | Camera & gallery document uploads |

### Backend
| Package | Purpose |
|---|---|
| Node.js + Express | REST API server |
| PostgreSQL | Relational database |
| Sequelize | ORM with model sync |
| JSON Web Tokens | Stateless authentication |
| bcryptjs | Password hashing |
| Multer | Multipart file upload handling |
| Firebase Admin SDK | FCM push notifications |
| M-Pesa Daraja API | Mobile payment STK Push |

---

## 🎯 Feature Overview

- **Multi-role authentication** — Consumer, Vendor, Food Courier, Admin with role-based navigation
- **Multi-step registration with identity verification** — Document upload during onboarding
- **Document management** — Vendors and couriers can update their ID/Passport and Passport Sized Photo post-registration
- **Admin document review** — Approve or reject document resubmissions with written feedback
- **Live order & approval badges** — Real-time counts on every tab, refreshed every 30 seconds
- **Full order lifecycle** — Received → Preparing → Ready → Collected → In Transit → Delivered
- **Real-time rider location tracking** — Courier broadcasts GPS coordinates during transit
- **M-Pesa STK Push payments** — Integrated Safaricom Daraja API with dev-mode simulation
- **Promo codes** — Vendor-created discount codes with percentage or flat-amount discounts
- **Consumer reviews** — Star ratings and written feedback after delivery
- **In-app notification system** — Persistent DB-backed notifications with unread indicators
- **FCM push notifications** — Optional Firebase integration for background device alerts
- **Admin dashboard** — Stats, vendor management, order tracking, user management, and approval flows

---

## 👤 User Roles & Flows

### Consumer
1. Browse vendors on the Home or Explore tab
2. Select items → add to cart → proceed to checkout
3. Enter delivery address, apply promo code, choose payment (M-Pesa / Cash / Card)
4. Track order in real-time through the Orders tab (status + rider location)
5. Write a review after delivery

### Vendor
1. Register → upload ID/Passport + Passport Sized Photo during onboarding
2. Wait for admin approval (shown in PendingApprovalScreen)
3. Manage menu items (add, edit, delete, toggle availability)
4. Receive new orders on the Orders tab (badge shows active count)
5. Advance order status: Received → Preparing → Ready
6. Manage promo codes via the Menu tab
7. Update verification documents anytime via Profile → Settings
8. View Business Analytics from Profile — weekly revenue/order growth vs. last week, a 7-day order chart, and top-selling items

### Food Courier
1. Register → upload identity documents during onboarding
2. Wait for admin approval
3. Browse available orders on the Tasks tab (badge shows available count)
4. Accept an order → head to vendor to collect
5. Advance: Collected → In Transit → Delivered
6. Broadcast live GPS location during transit
7. Confirm cash collection for cash-on-delivery orders
8. Update verification documents via Profile → Settings

### Admin
1. View platform stats (revenue, orders, active counts, top vendors)
2. Review pending vendor and food courier applications → Approve or Reject
3. Review pending verification document submissions → Approve or Reject with note
4. Manage all vendors — view details, inline document review
5. Monitor all platform orders with status filtering
6. Manage users — search, view details, suspend or unsuspend accounts
7. Live badges on the Approvals and Orders tabs show pending work at a glance

---

## 🛡️ Admin Dashboard

### Stats Tab
- Platform totals: orders, revenue, consumers, active vendors, couriers, reviews
- Weekly order trend bar chart
- Top vendors leaderboard ranked by order count
- Export statistics as CSV (web only)
- Pull-to-refresh for live data

### Approvals Tab
- **Red badge** on tab icon showing total pending items (vendors + couriers + document reviews)
- Tabs: All · Vendors · Couriers · Documents · Rejected
- Alert banners for applications waiting over 24 hours
- Quick Approve / Reject actions with confirmation
- **Documents sub-tab**: Review ID/Passport and Passport Sized Photo submitted by already-approved vendors/couriers; write a rejection note if documents are unclear

### Vendors Tab
- Directory of all vendors with search and status filter
- Yellow pending banner on cards where the vendor has resubmitted documents
- Tap a vendor → full detail modal with:
  - Business info, owner contact, approval date
  - Verification Documents section with status badge (Approved / Pending Review / Info Requested)
  - Inline Approve / Reject controls when documents are pending review

### Orders Tab
- **Red badge** showing count of active orders platform-wide (Received → In Transit)
- Filter by status: All, Pending, In Progress, Completed
- Search by order ID, customer, or vendor
- Full order detail: consumer, vendor, rider, items, delivery address, payment status

### Users Tab
- Consumer and Courier directories
- Search by name or phone
- Suspend / Unsuspend with confirmation

---

## 📄 Verification & Document Review System

CampusBite enforces identity verification for all Vendor and Food Courier accounts. The system uses **two separate document types** with distinct purposes:

| Document | Purpose |
|---|---|
| **National ID / Passport** | Proves legal identity — a scan or photo of the ID document itself |
| **Passport Sized Photo** | A clear portrait photo of the person — not the ID document |

### Registration Flow (Step 2)
After submitting basic account details, vendors and couriers are redirected to `VerificationScreen` where they:
1. Select document type: **National ID** or **Passport**
2. Upload a photo of the document (camera or gallery)
3. Upload a passport-sized portrait photo

All uploads are sent as `multipart/form-data`. The backend stores the files under `uploads/verification/` and sets `verification_status: 'pending'` on the user record.

### Post-Registration Document Updates
Approved vendors and couriers can update their documents at any time:
- **Vendors**: Profile tab → Settings (`VendorSettingsScreen`)
- **Food Couriers**: Profile tab → Settings (`AppSettingsScreen`)

Each document type has its own card with:
- Current document preview (tap to view full screen)
- Status indicator (Approved / Pending Review / Info Requested)
- Admin note banner if the admin requested changes
- Independent upload button — update one document without affecting the other

### Admin Review States

| Status | Meaning |
|---|---|
| `pending` | Documents submitted, awaiting admin review |
| `approved` | Admin has verified and accepted the documents |
| `info_requested` | Admin rejected with a note — user must resubmit |

When `info_requested`, the user sees an amber banner with the admin's note and can resubmit via `SubmitInfoScreen`.

---

## 🔴 Live Order & Approval Badges

All tab bars show live red count badges that refresh automatically every **30 seconds** and immediately on tab press.

| Navigator | Tab | Badge Shows |
|---|---|---|
| Admin | Approvals | Pending vendors + pending couriers + pending document reviews |
| Admin | Orders | Active platform orders (Received → In Transit) |
| Vendor | Orders | Vendor's own active orders (Received, Preparing, Ready) |
| Consumer | Orders | Consumer's in-progress orders (Received → In Transit) |
| Food Courier | Tasks | Available unassigned orders ready for pickup |
| Food Courier | Earnings | Courier's active deliveries (Collected, In Transit) |

Badges are hidden (not shown as `0`) when the count is zero. Counts above 99 display as `99+`.

---

## 🔔 Notification System

CampusBite has a two-layer notification system:

### Layer 1 — In-App Notifications (Always Active)
All notifications are stored in the `notifications` PostgreSQL table. Users access them via the Notifications screen.

| Type | Icon | Color |
|---|---|---|
| `order_status` | Receipt | Blue |
| `payment` | Card | Purple |
| `delivery` | Bicycle | Primary orange |
| `feedback` | Chat bubble | Green |
| `system` | Bell | Grey |

Features: unread dot indicator, mark individual or all as read, pull-to-refresh.

### Layer 2 — FCM Push Notifications (Optional)
The backend includes Firebase Admin SDK integration (`notification.service.js`). When Firebase credentials are configured, push notifications are sent to devices even when the app is in the background.

Currently triggered push events:
- Order status changes → Consumer device
- Rider assigned → Vendor device
- Cash collected → Consumer device

To enable push notifications, add Firebase credentials to the backend `.env` (see Environment Setup below).

---

## 💳 Payment Integration

### M-Pesa STK Push
The system integrates with Safaricom's Daraja API for mobile payments.

**Flow:**
1. Consumer initiates checkout with phone number
2. Backend fires STK Push → Safaricom sends a PIN prompt to the consumer's phone
3. Consumer enters M-Pesa PIN
4. Safaricom posts a callback to the backend
5. Backend confirms payment and creates the order

**Dev Mode:** When real M-Pesa credentials are not set, the backend auto-generates a dev checkout ID. A "Simulate M-Pesa" button appears in the app to complete the payment without a real STK Push.

### Cash on Delivery
Order is created immediately. The courier confirms cash collection via the delivery detail screen, which marks the payment as confirmed.

### Card
Order is created immediately. Card charge is confirmed on delivery (placeholder — no card gateway integration currently).

---

## 🔧 Environment Setup

Create a `.env` file in `CampusBite_Backend-main/`:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusbite_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# M-Pesa Daraja API (Safaricom)
# Leave as placeholder values to run in dev/simulation mode
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://your-public-url.ngrok.io/api/payments/callback
MPESA_ENV=sandbox

# Sandbox passkey for shortcode 174379:
# bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Firebase Cloud Messaging (Optional — push notifications work without this)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----\n"
```

> **Note:** With `NODE_ENV=development`, the global API rate limiter (100 requests / 15 min per IP) is skipped entirely, so local testing won't hit `429 Too many requests`. It's enforced normally whenever `NODE_ENV` is anything else.

---

## 🗄️ Database Migrations

Run these in order after first setup or when adding new backend features:

```bash
cd CampusBite_Backend-main
node migrations/003-create-food-courier-profile-table.js
node migrations/004-create-notifications-table.js
node migrations/005-add-verification-fields-to-users.js
node migrations/006-add-rider-location-to-orders.js
node migrations/007-create-reviews-table.js
```

| Migration | Creates / Updates |
|---|---|
| `003` | `food_courier_profiles` — vehicle type, availability, earnings, rating |
| `004` | `notifications` — in-app notifications with type, read status, JSON payload |
| `005` | `users` — adds `verification_status`, `verification_document`, `verification_type`, `passport_photo`, `admin_note`, `requested_docs` |
| `006` | `orders` — adds `rider_lat`, `rider_lng`, `location_updated_at` for live tracking |
| `007` | `reviews` — consumer star ratings and written feedback |

Sequelize `sync({ alter: false })` runs on every server start and will create any missing tables automatically, but migrations handle column additions cleanly.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login → JWT |
| GET | `/api/auth/me` | Any | Current user profile |
| PUT | `/api/auth/profile` | Any | Update profile |
| PUT | `/api/auth/password` | Any | Change password |
| PUT | `/api/auth/device-token` | Any | Save FCM token |
| POST | `/api/auth/forgot-password` | Public | Request password reset |
| POST | `/api/auth/reset-password` | Public | Submit new password |

### Verification
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/verification/upload` | Vendor/Courier | Upload/replace documents (`multipart/form-data`) |
| GET | `/api/verification/status` | Vendor/Courier | Get own verification status |
| POST | `/api/verification/submit-info` | Vendor/Courier | Resubmit after `info_requested` |

### Orders
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders/initiate` | Consumer | Start checkout (M-Pesa / cash / card) |
| GET | `/api/orders` | Consumer | My order history |
| GET | `/api/orders/:id` | Any | Single order detail |
| GET | `/api/orders/vendor` | Vendor | Vendor's order queue |
| PATCH | `/api/orders/:id/status` | Vendor/Courier | Advance order status |
| GET | `/api/orders/food-courier/available` | Courier | Unassigned ready orders |
| PATCH | `/api/orders/:id/assign-food-courier` | Courier | Accept a delivery |
| GET | `/api/orders/food-courier/mine` | Courier | My active deliveries |
| PATCH | `/api/orders/:id/collect-cash` | Courier | Confirm cash payment |
| PATCH | `/api/orders/:id/location` | Courier | Update rider GPS |
| POST | `/api/orders/dev-confirm/:id` | Dev only | Simulate M-Pesa callback |

### Admin
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Platform-wide stats |
| GET | `/api/admin/stats/weekly-orders` | Admin | Orders per day this week |
| GET | `/api/admin/stats/top-vendors` | Admin | Top 10 vendors by orders |
| GET | `/api/admin/orders` | Admin | All orders (paginated, filterable) |
| GET | `/api/admin/users` | Admin | All users (paginated, filterable) |
| GET | `/api/admin/vendors` | Admin | All vendors with owner info |
| PATCH | `/api/admin/users/:id/suspend` | Admin | Toggle account suspension |
| PATCH | `/api/admin/users/:id/request-info` | Admin | Ask user to resubmit info |
| GET | `/api/admin/users/pending-docs` | Admin | Users with pending doc review |
| PATCH | `/api/admin/users/:id/approve-docs` | Admin | Approve resubmitted documents |
| PATCH | `/api/admin/users/:id/reject-docs` | Admin | Reject docs with a note |

### Vendor Approvals (Admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/vendors/admin/pending` | Pending vendor applications |
| PATCH | `/api/vendors/admin/:id/approve` | Approve vendor |
| PATCH | `/api/vendors/admin/:id/reject` | Reject vendor |

### Food Courier Approvals (Admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/food-courier/admin/pending` | Pending courier applications |
| PATCH | `/api/food-courier/admin/:id/approve` | Approve courier |
| PATCH | `/api/food-courier/admin/:id/reject` | Reject courier |

### Notifications
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/notifications` | Any | All notifications for current user |
| GET | `/api/notifications/unread-count` | Any | Count of unread notifications |
| PATCH | `/api/notifications/:id/mark-read` | Any | Mark one as read |
| PATCH | `/api/notifications/mark-all-read` | Any | Mark all as read |

---

## 🐛 Troubleshooting

### PostgreSQL not running
- Open Windows Services and start the PostgreSQL service
- Verify port 5432 is not blocked

### Backend fails to start
- Check `.env` exists in `CampusBite_Backend-main/` with correct `DB_PASSWORD`
- Ensure `campusbite_db` database exists: `createdb campusbite_db`
- Run database migrations (see above)

### Frontend not loading (localhost:8082)
- Wait ~30 seconds for Expo to fully bundle
- Clear browser cache and hard-reload
- Check terminal for compilation errors

### M-Pesa STK Push not triggering
- Verify `MPESA_PASSKEY` is the Lipa Na M-Pesa Online passkey, **not** the Security Credential
- Sandbox passkey for shortcode 174379: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
- Ensure ngrok is running and `MPESA_CALLBACK_URL` points to it
- Phone number must be in format `2547XXXXXXXX` (no `+`)
- Leave credentials as placeholder values to use dev simulation mode instead

### Document uploads failing
- Confirm `uploads/menu/` and `uploads/verification/` directories exist in `CampusBite_Backend-main/`
- Check backend logs — Multer will log file size or type errors
- On web, images are fetched as Blobs before upload; ensure the browser allows it

### Push notifications not arriving
- Firebase is optional — the app works fully without it
- To enable: create a Firebase project, download the service account JSON, add the three `FIREBASE_*` env vars
- Confirm `fcm_token` is saved on the User record after login (`PUT /api/auth/device-token`)

### Order badges showing 0 when orders exist
- Confirm the backend is running and reachable at port 5000
- Check browser console for failed API calls — JWT may have expired (log out and back in)
- Badges refresh every 30 seconds or immediately on tab press

### Vendor/menu images not displaying
- Open the browser console — `net::ERR_BLOCKED_BY_ORB` on a `/uploads/...` request means the referenced file doesn't exist on disk (common on a fresh checkout, since `uploads/menu/` and `uploads/verification/` are gitignored — user-uploaded content never ships with the repo, but a shared/seeded database may still reference old filenames). Re-upload the image through the app to fix it for that vendor/item.
- If the list itself is fine but only a couple of images are blank, check that the specific screen prefixes `vendor.image` / `item.image` with `API_BASE_URL` — it's a relative path (`/uploads/...`), not a full URL. All consumer/vendor screens should build the URL the same way (see `HomeScreen.js` or `VendorDetailScreen.js`).
- Vendor cover/menu-item uploads can fail silently on web if converting the picked image to a Blob fails — the save still reports "Success" without the image attached (see Changelog `[1.2.1]`, Known Gap). If a fresh upload doesn't show up, just try again.

---

## 📄 License

MIT License — CampusBite Team
