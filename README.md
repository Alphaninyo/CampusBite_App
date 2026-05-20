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
   cd CampusBite_Backend-main/CampusBite_Backend-main
   npm start
   ```

3. **Start Frontend Server**
   ```bash
   cd CampusBite_App-main/CampusBite_App-main
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
│   │   ├── navigation/          # Navigation Setup
│   │   ├── api/                 # API Client
│   │   ├── stores/              # State Management (Zustand)
│   │   └── constants/           # App Constants
│   └── package.json
├── CampusBite_Backend-main/      # Node.js Backend
│   ├── src/
│   │   ├── controllers/         # API Controllers
│   │   ├── models/              # Database Models (Sequelize)
│   │   ├── routes/              # API Routes
│   │   ├── middleware/          # Auth Middleware
│   │   └── services/            # Business Logic
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
- **Multi-role authentication** (Consumer, Vendor, Rider, Admin)
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
Create `.env` file in `CampusBite_Backend-main/CampusBite_Backend-main/`:

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

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review console logs for error messages
3. Verify all prerequisites are met

## 📄 License

MIT License - CampusBite Team
