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
- **👤 User Profile** - Account management and activity tracking
- **🔔 Notifications** - Order updates and special offers

### **🎨 User Experience**
- **📱 Cross-Platform** - Web, iOS, and Android support
- **🎯 Intuitive Navigation** - Bottom tab navigation with clear sections
- **⚡ Real-time Updates** - Instant search filtering and cart updates
- **📊 Status Tracking** - Live order status updates
- **💾 Data Persistence** - Cart and user data saved locally

---

## 🛠️ **Technical Stack**

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

### **📋 Orders Screen**
- **📜 Order History** - View past orders
- **🔍 Search Orders** - Find specific orders
- **📊 Status Filters** - Filter by order status
- **📱 Compact Design** - Clean order cards
- **🚚 Track Orders** - Real-time tracking

### **🛒 Cart Screen**
- **📦 Cart Items** - View added items
- **🔢 Quantity Controls** - Increase/decrease quantities
- **💰 Price Summary** - Total calculation
- **🗑️ Remove Items** - Delete from cart
- **🧾 Checkout** - Proceed to payment

### **👤 Profile Screen**
- **📊 User Stats** - Total orders, favorite vendor
- **📈 Recent Activity** - Account activity log
- **⚙️ Settings** - App preferences
- **🔐 Security** - Password management
- **📝 Profile Edit** - Update information

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
- **[API Documentation](./docs/api.md)** - API reference
- **[Component Guide](./docs/components.md)** - Component documentation

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
