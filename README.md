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
│   │   │   └── foodCourier/     # Food Courier screens (Tasks, Earnings, Profile, Notifications)
│   │   ├── navigation/          # Navigation Setup (ConsumerNavigator, VendorNavigator, FoodCourierNavigator)
│   │   ├── api/                 # API Client (orders, vendors, menu, payments, reviews, notifications, foodCourier)
│   │   ├── stores/              # State Management (Zustand)
│   │   └── constants/           # App Constants (COLORS, STATUS_COLORS)
│   └── package.json
├── CampusBite_Backend-main/      # Node.js Backend
│   ├── src/
│   │   ├── controllers/         # API Controllers (auth, vendor, menu, order, payment, review, notification, foodCourierProfile)
│   │   ├── models/              # Database Models (User, Vendor, MenuItem, Order, OrderItem, Payment, Review, Notification, FoodCourierProfile)
│   │   ├── routes/              # API Routes (auth, vendor, menu, order, payment, review, notification, foodCourierProfile)
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

## 🎯 Test Accounts

| Role | Email | Password | Status |
|------|-------|----------|--------|
| Consumer | mark@campusbite.com | password123 | Ready |
| Consumer | testuser@campusbite.com | password123 | Ready |
| Admin | sysadmin@campusbite.com | password123 | Ready |
| Vendor | vendor2@campusbite.com | password123 | Needs Approval |
| Food Courier | rider@campusbite.com | password123 | Needs Approval |

**Note:** Vendor and Food Courier accounts require admin approval before they can access their dashboards. Use the admin account to approve them.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review console logs for error messages
3. Verify all prerequisites are met

## 🗄️ Database Migrations

After updating the backend with new features (Food Courier Profile, Notifications), run the database migrations:

```bash
cd CampusBite_Backend-main
node migrations/003-create-food-courier-profile-table.js
node migrations/004-create-notifications-table.js
```

This will create the necessary tables:
- `food_courier_profiles` - Stores courier-specific data (vehicle type, availability, earnings, rating)
- `notifications` - Stores in-app notifications for all users

## 📄 License
MIT License - CampusBite Team
