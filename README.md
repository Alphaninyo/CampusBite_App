# CampusBite - Complete Food Ordering System

A full-stack food ordering application for campus environments with React Native frontend, Node.js backend, and PostgreSQL database.

## 🚀 Quick Start

### Option 1: One-Click Startup (Recommended)

**Windows Batch File:**
```bash
start-campusbite.bat
```

**PowerShell:**
```bash
powershell -ExecutionPolicy Bypass -File start-campusbite.ps1
```

**Node.js Script:**
```bash
npm start
```

### Option 2: Manual Startup

1. **Start PostgreSQL Database**
   - Ensure PostgreSQL is running on port 5432
   - Create database `campusbite_db` if needed

2. **Start Backend Server**
   ```bash
   cd CampusBite_Backend-main
   npm start
   ```

3. **Start Frontend Server**
   ```bash
   cd CampusBite_App-main
   npx expo start --web --port 8082
   ```

## 📱 Access Points

- **Frontend Application:** http://localhost:8082
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

## 🔐 Test Accounts

### Consumer Accounts (Ready to Use)
- **Mark Grayson:** `mark@campusbite.com` / `password123`
- **Test User:** `testuser@campusbite.com` / `password123`

### Admin Account (Ready to Use)
- **System Admin:** `sysadmin@campusbite.com` / `password123`

### Vendor Account (Needs Admin Approval)
- **Campus Vendor:** `vendor2@campusbite.com` / `password123`

### Rider Account (Needs Admin Approval)
- **Campus Rider:** `rider@campusbite.com` / `password123`

## 🏗️ System Architecture

```
CampusBite System/
├── CampusBite_App-main/          # React Native Frontend (Expo)
│   ├── src/
│   │   ├── screens/             # UI Screens
│   │   │   ├── consumer/        # Consumer screens (Home, Cart, Orders, Profile)
│   │   │   ├── vendor/          # Vendor screens (Dashboard, Menu, Orders, Profile)
│   │   │   ├── foodCourier/     # Food Courier screens (Tasks, Earnings, Profile, Notifications)
│   │   │   ├── admin/           # Admin screens (Stats, Approvals, Vendors, Orders, Users)
│   │   │   └── shared/          # Shared screens (Profile)
│   │   ├── navigation/          # Navigation Setup (ConsumerNavigator, VendorNavigator, FoodCourierNavigator, AdminNavigator)
│   │   ├── api/                 # API Client (orders, vendors, menu, payments, reviews, notifications, foodCourier, admin)
│   │   ├── stores/              # State Management (Zustand)
│   │   └── constants/           # App Constants (COLORS, STATUS_COLORS)
│   └── package.json
├── CampusBite_Backend-main/      # Node.js Backend
│   ├── src/
│   │   ├── controllers/         # API Controllers (auth, vendor, menu, order, payment, review, notification, foodCourierProfile, admin)
│   │   ├── models/              # Database Models (User, Vendor, MenuItem, Order, OrderItem, Payment, Review, Notification, FoodCourierProfile)
│   │   ├── routes/              # API Routes (auth, vendor, menu, order, payment, review, notification, foodCourierProfile, admin)
│   │   ├── middleware/          # Auth Middleware (protect, restrictTo)
│   │   └── services/            # Business Logic (email, notification)
│   ├── migrations/             # Database Migration Scripts
│   ├── .env                     # Environment Variables
│   └── package.json
├── start-campusbite.bat         # Windows Startup Script
├── start-campusbite.ps1         # PowerShell Startup Script
├── start-campusbite.js          # Node.js Startup Script
└── README.md                    # This File
```

## 🛠️ Technology Stack

### Frontend
- **React Native** with Expo
- **React Navigation** for navigation
- **Zustand** for state management
- **Axios** for API calls
- **Expo Image Picker** for photo uploads

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Sequelize** ORM
- **JWT** authentication
- **bcryptjs** password hashing
- **M-Pesa** integration for payments

### Features
- **Multi-role authentication** (Consumer, Vendor, Food Courier, Admin)
- **Real-time order tracking**
- **Menu management** for vendors
- **Review system**
- **Payment integration**
- **Push notifications** (Firebase)
- **Admin Dashboard** with comprehensive management tools
  - **Stats Dashboard:** View platform statistics, weekly orders, top vendors, and export reports
  - **Approvals System:** Review and approve/reject vendor and courier applications
  - **Vendor Management:** Monitor active vendors, pending applications, and vendor details
  - **Order Management:** Track all orders with filtering by status and detailed order views
  - **User Management:** Manage consumers and couriers with suspend/unsuspend capabilities

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (running on port 5432)
3. **Git** (to clone the repository)

## 🔧 Environment Setup

### Backend Environment Variables
Create `.env` file in `CampusBite_Backend-main/`:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusbite_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# M-Pesa Daraja API (Safaricom)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://your-public-url.ngrok.io/api/payments/callback
MPESA_ENV=sandbox

# Important: MPESA_PASSKEY is the STK Push (Lipa Na M-Pesa Online) passkey, NOT the Security Credential
# For sandbox shortcode 174379, the passkey is: bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
# Obtain your production credentials from: https://developer.safaricom.co.ke/

# Firebase Cloud Messaging (Optional - for push notifications)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

## 🚦 Development Workflow

1. **Start the system** using any startup method
2. **Open browser** at http://localhost:8082
3. **Login** with test credentials
4. **Test features** based on user role
5. **Stop services** by closing the terminal windows

## 🐛 Troubleshooting

### Common Issues

1. **PostgreSQL not running**
   - Start PostgreSQL service via Windows Services
   - Check port 5432 availability

2. **Port conflicts**
   - Backend uses port 5000
   - Frontend uses port 8082
   - PostgreSQL uses port 5432

3. **Database connection errors**
   - Verify PostgreSQL is running
   - Check `.env` database credentials
   - Ensure database `campusbite_db` exists

4. **Frontend not loading**
   - Wait for Expo to fully start
   - Check console for error messages
   - Clear browser cache if needed

5. **Food courier profile errors**
   - Run database migration to create `food_courier_profiles` table
   - Check backend logs for model sync errors
   - Ensure food courier user is approved by admin

6. **Notification errors**
   - Firebase is optional - notifications work without it
   - Check Firebase credentials in `.env` if using push notifications
   - Verify FCM token is saved on user registration

7. **M-Pesa STK Push not working**
   - Verify `MPESA_PASSKEY` is the STK Push passkey, NOT the Security Credential
   - For sandbox shortcode 174379, use: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
   - Ensure ngrok tunnel is running and callback URL is correctly set
   - Check that phone number is in Kenyan format (2547XXXXXXXX)
   - Verify Consumer Key and Secret match the environment (sandbox/production)
   - Check backend logs for detailed Safaricom error responses

## 🎯 Test Accounts

| Role | Email | Password | Status |
|------|-------|----------|--------|
| Consumer | mark@campusbite.com | password123 | Ready |
| Consumer | testuser@campusbite.com | password123 | Ready |
| Admin | sysadmin@campusbite.com | password123 | Ready |
| Vendor | vendor2@campusbite.com | password123 | Needs Approval |
| Food Courier | rider@campusbite.com | password123 | Needs Approval |

**Note:** Vendor and Food Courier accounts require admin approval before they can access their dashboards. Use the admin account to approve them.

## � Multi-Step Registration & Admin Verification Gating

CampusBite implements a robust trust-gating system for **Vendors** and **Food Couriers (Riders)** to ensure campus safety and vendor legitimacy:

1. **Step 1 (Basic Details):** Accounts are registered on the backend with basic details. Consumers are auto-approved, while Vendors/Riders are created in a `pending` state.
2. **Step 2 (Identity Verification):** For Vendors and Riders, the registration form transitions seamlessly to Step 2. Users select a document type (**National ID** or **Passport**) and upload a photo/scanned copy via Camera or Gallery.
3. **Admin Gating on Login:** Unapproved Vendors or Riders attempting to log in will see a dedicated, polite inline status banner explaining that their account is awaiting review, rather than being let into the app prematurely.
4. **Pending Navigator:** Once logged in, unapproved users are directed to a clean `PendingNavigator` showing their review status, guidelines, and document details, ensuring they cannot bypass verification.

## 🎨 User Interface Theme Refresh

The CampusBite auth screens have been modernized with a polished, lightweight visual signature:
- **Background Palette:** A very soft, welcoming warm peach `#FFF5F0` backdrop with transparent decorative circles.
- **Form Card:** A floating pure white `#FFFFFF` card with soft elevation shadows, detailed with a bold brand accent bar (`#E85D04`) on top.
- **Minimalist Underlined Input Fields:** Fully customized, transparent-background inputs using a sleek bottom-line border instead of rigid rectangular boxes. Focused fields trigger a smooth brand accent highlight.
- **No Clutter:** Browser-native black highlights and autocomplete blue background fills are completely disabled on Web, and validation checkmark icons have been removed for a premium, clean layout.

## 📊 Admin Dashboard Features

The admin panel provides comprehensive management capabilities for the CampusBite platform:

### Stats Dashboard
- **Platform Overview:** Total orders, revenue, consumers, active vendors, couriers, and reviews
- **Weekly Orders:** Visual bar chart showing order trends over the week
- **Top Vendors:** Leaderboard of vendors ranked by total orders
- **Export Reports:** Download statistics as CSV files (web platform)
- **Real-time Updates:** Pull-to-refresh for latest data

### Approvals System
- **Pending Applications:** View all pending vendor and courier applications
- **Alert Banners:** Notifications for applications waiting over 24 hours
- **Filtering:** Tabs for All, Vendors, Couriers, and Rejected applications
- **Application Details:** View owner name, phone, location, menu items
- **Quick Actions:** Approve or reject applications with confirmation dialogs
- **Recently Approved:** Track recently approved entities

### Vendor Management
- **Vendor Directory:** List of all vendors with status indicators
- **Search & Filter:** Search by name, owner, or location; filter by status
- **Status Tracking:** Active, Pending, and Suspended vendors
- **Vendor Details:** View business information, owner details, and approval dates
- **Status Management:** Monitor vendor approval status

### Order Management
- **Order Tracking:** View all platform orders with status indicators
- **Status Filtering:** All, Pending, In Progress, Completed, Cancelled
- **Search:** Find orders by ID, customer name, or vendor name
- **Order Details:** Comprehensive order information including customer, vendor, courier, and delivery details
- **Real-time Status:** Color-coded status badges for quick identification

### User Management
- **User Directory:** List of all consumers and couriers
- **Role Filtering:** Separate views for Consumers and Couriers
- **Search:** Find users by name or phone number
- **User Details:** View role, email, phone, join date, orders, and spending
- **Account Control:** Suspend or unsuspend user accounts with confirmation
- **Status Tracking:** Active and Suspended user sections

## �📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review console logs for error messages
3. Verify all prerequisites are met

## 🗄️ Database Migrations

After updating the backend with new features (Food Courier Profile, Notifications, Identity Verification, Live Tracking, Reviews), run the database migrations:

```bash
cd CampusBite_Backend-main
node migrations/003-create-food-courier-profile-table.js
node migrations/004-create-notifications-table.js
node migrations/005-add-verification-fields-to-users.js
node migrations/006-add-rider-location-to-orders.js
node migrations/007-create-reviews-table.js
```

This will create/update the necessary tables:
- `food_courier_profiles` - Stores courier-specific data (vehicle type, availability, earnings, rating)
- `notifications` - Stores in-app notifications for all users
- `users` (updates) - Appends verification document, document type, and admin review status columns to authorize securely.
- `orders` (updates) - Appends rider location fields (`rider_lat`, `rider_lng`, `location_updated_at`) for live transit mapping.
- `reviews` - Stores order reviews written by consumers for food quality and delivery service.

## 📄 License
MIT License - CampusBite Team
