# 🍔 CampusBite App

A modern food delivery mobile application built with React Native and Expo, designed specifically for campus environments.

## 🚀 **Quick Start**

### **One-Command Setup**
```bash
npm run setup && npm start
```

That's it! Your app will be running in seconds. 🎉

For detailed instructions, see [QUICK_START.md](./QUICK_START.md)

---

## 📱 **Features**

### **🎯 Core Functionality**
- **🔍 Smart Search** - Real-time filtering of vendors and items
- **📂 8 Food Categories** - Restaurants, Home-based, Drinks, Coffee & Tea, Quick Bites, Healthy Options, Pastries
- **🛒 Shopping Cart** - Add/remove items with real-time updates
- **📋 Order Management** - Track order history and status
- **💳 M-Pesa STK Push** - Seamless mobile payments via Safaricom Daraja API
- **👤 User Profile** - Account management with photo upload for all roles
- **🔔 Push Notifications** - Order updates delivered via Expo push notifications
- **🔐 Security** - Two-Factor Authentication (2FA) and password management
- **📍 Saved Addresses** - Manage delivery locations with current location support
- **❓ Help & Support** - Role-based support and FAQ system

### **🎨 User Experience**
- **📱 Cross-Platform** - Web, iOS, and Android support
- **🎯 Intuitive Navigation** - Bottom tab navigation with clear sections
- **⚡ Real-time Updates** - Instant search filtering and cart updates
- **📊 Status Tracking** - Live order status updates
- **💾 Data Persistence** - Cart and user data saved locally
- **🔐 Enhanced Security** - 2FA with authenticator app support
- **📍 Location Services** - Current location detection for addresses

---

## � **M-Pesa Payment Integration**

CampusBite integrates with Safaricom's Daraja API for seamless mobile payments via M-Pesa STK Push.

### **Payment Flow**
1. **Consumer adds items to cart** and proceeds to checkout
2. **Enters delivery address** and phone number
3. **Selects M-Pesa** as payment method
4. **STK Push is triggered** - Consumer receives prompt on their phone
5. **Enters M-Pesa PIN** to authorize payment
6. **Payment status updates** automatically via callback
7. **Order confirmation** displayed upon successful payment

### **Setup Requirements**
- Backend must have valid M-Pesa Daraja credentials in `.env`
- ngrok tunnel must be running for callback URL
- Phone number must be in Kenyan format (2547XXXXXXXX)

### **Sandbox Testing**
- Shortcode: `174379`
- Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
- Environment: `sandbox`
- Test phone: Any Safaricom number registered for M-Pesa

### **Troubleshooting**
- **Wrong credentials error**: Verify MPESA_PASSKEY is the STK Push passkey, not Security Credential
- **No STK Push received**: Check phone number format and ensure backend logs show successful initiation
- **Callback failures**: Verify ngrok tunnel is running and callback URL is accessible

---

## �🛠️ **Technical Stack**

### **Frontend**
- **React Native** - Mobile app framework
- **Expo** - Development and deployment platform
- **React Navigation** - Navigation and routing
- **AsyncStorage** - Local data storage
- **Zustand** - State management

### **UI/UX**
- **Expo Vector Icons** - Icon library
- **Custom Styling** - Tailwind-inspired design system
- **Responsive Design** - Optimized for all screen sizes
- **Modern Components** - Clean, intuitive interface

---

## 📱 **Screens & Features**

### **🏠 Home Screen**
- **🔍 Search Bar** - Search vendors and items
- **📂 Category Filters** - Filter by food type
- **🏪 Featured Vendors** - Popular restaurants
- **🔥 Trending Items** - Popular food items
- **🛒 Floating Cart** - Quick cart access
- **👤 Profile Avatar** - Navigate to profile
- **🔔 Notifications** - View updates

### **🧭 Explore Screen**
- **� Smart Filtering** - Search all campus vendors by name or location
- **📂 Interactive Category Chips** - Toggle between Restaurants and Home-based kitchens instantly
- **📊 Real-time Vendor Status** - Displays open/closed badges, locations, and direct navigation links to vendor menus

### **�📋 Orders Screen**
- **📜 Order History** - View past orders
- **🔍 Search Orders** - Find specific orders
- **📊 Status Filters** - Filter by order status
- **📱 Compact Design** - Clean order cards
- **🚚 Track Orders** - Real-time vertical stepper timeline and live GPS transit tracking map for rider location updates Every 10 seconds

### **✍️ Write Review Screen**
- **⭐ Dual Service Rating** - Separately rate the food vendor and delivery rider out of 5 stars
- **💬 Feedback Comment** - Provide optional experience summaries/comments
- **🎉 Interactive Success Page** - Clean rating feedback summary and single-submission protection to prevent duplicates

### **🛒 Cart Screen**
- **📦 Cart Items** - View added items
- **🔢 Quantity Controls** - Increase/decrease quantities
- **💰 Price Summary** - Total calculation
- **🗑️ Remove Items** - Delete from cart
- **🧾 Checkout** - Proceed to payment
- **💳 M-Pesa Payment** - STK Push integration for seamless mobile payments

### **👤 Profile Screen**
- **📊 User Stats** - Total orders, favorite vendor, total spent
- **📸 Profile Photo** - Tap avatar to upload a photo from gallery (all roles); 114×114 px HD display with border and shadow
- **📈 Recent Activity** - Account activity log
- **⚙️ Settings** - App preferences
- **🔐 Security** - Two-Factor Authentication (2FA) setup and password management
- **📍 Saved Addresses** - Manage delivery locations with "Use Current Location" feature
- **🔔 Notifications** - View and manage order updates and promotional messages
- **❓ Help & Support** - Role-based FAQ and contact information
- **📝 Profile Edit** - Update name, phone, and profile picture

---

## 👥 **User Roles**

### **🛒 Consumer**
- Browse and order food from vendors
- Track order status in real-time
- Manage saved addresses with location services
- Access role-based help & support
- Configure 2FA for account security

### **🏪 Vendor**
- Manage menu items and pricing
- View and process incoming orders — accept or decline (cancel) orders at the `Received` stage
- Set store availability status
- Access business analytics
- Upload a profile photo
- Configure 2FA for account security

### **🚴 Food Courier**
- View available delivery tasks
- Track earnings and deliveries
- Manage availability status
- View customer feedback
- Configure 2FA for account security

### **👨‍💼 Admin**
- Approve vendor applications
- Manage platform users
- View platform statistics
- Access admin-specific support
- Configure 2FA for account security

---

## 🔐 **Security Features**

### **Two-Factor Authentication (2FA)**
- **Authenticator App Support** - Compatible with Google Authenticator, Authy, etc.
- **QR Code Setup** - Easy setup with QR code scanning
- **Manual Entry** - Alternative secret key entry
- **Backup Codes** - 10 recovery codes for account access
- **Toggle On/Off** - Easy enable/disable with confirmation
- **Available for All Roles** - Consumers, Vendors, Couriers, and Admins

### **Password Management**
- **Secure Password Change** - Current password verification required
- **Minimum Length** - 6-character minimum for new passwords
- **Confirmation** - Password matching validation
- **Available for All Roles** - All user types can change passwords

---

## 📍 **Location Features**

### **Saved Addresses**
- **Add New Addresses** - Save frequently used delivery locations
- **Delete Addresses** - Remove outdated locations
- **Current Location** - Auto-detect and save current GPS location
- **Reverse Geocoding** - Convert coordinates to readable addresses
- **Consumer Feature** - Available in consumer profile

---

## ❓ **Help & Support**

### **Role-Based Support**
- **Admin Support** - Dedicated admin email (admin@campusbite.app)
- **Consumer Support** - General support email (support@campusbite.app)
- **Phone Support** - +254 700 000 000
- **Role-Specific FAQs** - Tailored questions for each user type

### **Admin FAQ Topics**
- Vendor application approval process
- User suspension procedures
- Platform statistics access
- Order management

### **Consumer FAQ Topics**
- How to place orders
- Order tracking
- Becoming a vendor
- Becoming a food courier

---

## 🎯 **Food Categories**

### **🍽️ Restaurants**
- Full-service dining establishments
- Complete meal options
- Table service available

### **🏠 Home-Based**
- Homemade food providers
- Family-style meals
- Authentic home cooking

### **🍷 Drinks**
- Beverages and refreshments
- Juices and smoothies
- Non-alcoholic options

### **☕ Coffee & Tea**
- Hot beverages
- Study-friendly cafes
- Quick caffeine fixes

### **🥪 Quick Bites**
- Fast food options
- Between-class snacks
- Quick meals

### **🥗 Healthy Options**
- Nutritious choices
- Salads and bowls
- Diet-friendly options

### **🍕 Pastries**
- Baked goods
- Desserts and sweets
- Bakery items

---

## 🚀 **Installation & Setup**

### **Prerequisites**
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo Go** (for mobile testing)

### **Quick Setup**
```bash
# Clone the repository
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main

# Install dependencies and setup
npm run setup

# Start the app
npm start
```

### **Development Commands**
```bash
npm run setup      # Install all dependencies
npm start           # Start development server
npm run web         # Run in browser
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run dev         # Start with cleared cache
```

---

## 📱 **Running the App**

### **🌐 Web Version (Easiest)**
```bash
npm run web
```
- Opens in browser automatically
- Full functionality available
- No additional setup needed

### **📱 Mobile Version**
```bash
npm start
```
1. Install Expo Go app
2. Scan QR code from terminal
3. App loads on your phone

### **📱 Testing**
- **Web**: Best for development and testing
- **Mobile**: Test with Expo Go app
- **Emulators**: Android Studio/Xcode required

---

## 🔧 **Development**

### **Project Structure**
```
src/
├── screens/
│   ├── consumer/          # User-facing screens
│   │   ├── HomeScreen.js
│   │   ├── CartScreen.js
│   │   ├── MyOrdersScreen.js
│   │   └── ...
│   └── shared/            # Common screens
│       ├── ProfileScreen.js
│       └── ...
├── components/            # Reusable components
├── constants/             # App constants
├── stores/               # State management
├── api/                  # API configuration
└── navigation/            # Navigation setup
```

### **State Management**
- **Zustand** for global state
- **AsyncStorage** for persistence
- **React Hooks** for local state

### **Styling**
- **StyleSheet** (React Native)
- **Custom design system**
- **Responsive design**
- **Color constants**

---

## 🚀 **Deployment**

### **📱 Mobile Apps**
```bash
npm run build:android  # Android APK
npm run build:ios      # iOS build
```

### **🌐 Web App**
```bash
npm run build:web      # Web build
```

### **📦 Distribution**
- **Google Play Store** (Android)
- **Apple App Store** (iOS)
- **Web hosting** (Web version)

---

## 🐛 **Troubleshooting**

### **Common Issues**
```bash
# Metro bundler issues
npm run dev

# Dependency issues
npm run setup

# Clear cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Mobile Testing Issues**
- Check internet connection
- Restart Expo Go app
- Ensure same network connection
- Clear Expo Go cache

---

## 📚 **Documentation**

- **[QUICK_START.md](./QUICK_START.md)** - Detailed setup guide
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - Full API reference (all endpoints, request/response shapes)
- **[docs/PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md)** - Architecture, data models, state management
- **[docs/USER_GUIDE.md](./docs/USER_GUIDE.md)** - End-user feature guide
- **[docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes

---

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **Acknowledgments**

- **Expo Team** - Amazing development platform
- **React Native Community** - Excellent libraries and tools
- **Campus Community** - Inspiration and feedback

---

## 📞 **Contact**

- **GitHub**: [@Alphaninyo](https://github.com/Alphaninyo)
- **Repository**: [CampusBite_App](https://github.com/Alphaninyo/CampusBite_App)

---

**Made with ❤️ for the campus community**
