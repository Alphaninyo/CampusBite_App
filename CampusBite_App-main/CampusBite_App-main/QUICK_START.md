# 🚀 CampusBite App - Quick Start Guide

## 📱 Easy Setup & Run Instructions

### 🎯 **One-Command Setup**
```bash
npm run setup
npm start
```

That's it! Your app will be running in seconds. 🎉

---

## 📋 **Prerequisites**
- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **Expo Go app** (for mobile testing)

---

## 🛠️ **Setup Methods**

### **Method 1: Quick Setup (Recommended)**
```bash
# Clone and setup in one go
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main
npm run setup
npm start
```

### **Method 2: Manual Setup**
```bash
# 1. Install dependencies
npm install

# 2. Install Expo dependencies
npx expo install

# 3. Start the app
npm start
```

---

## 📱 **How to Run the App**

### **🌐 Web Version (Easiest)**
```bash
npm run web
```
- Opens in your browser automatically
- No additional setup needed
- Great for testing and development

### **📱 Mobile Version**
```bash
npm start
```
1. Install **Expo Go** app on your phone
2. Scan QR code from terminal
3. App loads automatically on your phone

### **🤖 Android Emulator**
```bash
npm run android
```
- Requires Android Studio setup
- Slower but good for testing

### **🍎 iOS Simulator**
```bash
npm run ios
```
- Requires Xcode setup
- Only available on macOS

---

## 🎮 **Development Commands**

```bash
# Start with cleared cache (if issues occur)
npm run dev

# Build for production
npm run build:android  # Android APK
npm run build:ios      # iOS build
npm run build:web      # Web build
```

---

## 🔧 **Troubleshooting**

### **❌ Common Issues & Solutions**

**Issue: "Metro bundler not responding"**
```bash
npm run dev  # Clears cache and restarts
```

**Issue: "Dependencies not found"**
```bash
npm run setup  # Reinstall all dependencies
```

**Issue: "Expo Go can't connect"**
- Check your internet connection
- Restart Expo Go app
- Make sure phone and computer are on same network

**Issue: "Build errors"**
```bash
npm install --force  # Force reinstall
npx expo install --fix  # Fix Expo dependencies
```

---

## 📱 **Testing the App**

### **🌐 Web Testing (Recommended for beginners)**
1. Run `npm run web`
2. Opens automatically in browser
3. Full functionality available

### **📱 Mobile Testing**
1. Install Expo Go from App Store/Play Store
2. Run `npm start`
3. Scan QR code with phone camera
4. App loads on your phone

---

## 🎯 **Key Features to Test**

### **✅ Home Page**
- **Search Bar** - Type "burger" to test search
- **Category Filters** - Tap different categories
- **Profile Avatar** - Tap to navigate to profile
- **Notification Bell** - Tap to see notifications

### **✅ Navigation**
- **Bottom Tabs** - Switch between Home, Orders, Cart, Profile
- **Back Navigation** - Test back buttons in each screen

### **✅ Core Functionality**
- **Add to Cart** - Add items from trending section
- **View Cart** - Check cart updates in real-time
- **Search** - Test search functionality
- **Notifications** - Test notification modal

---

## 🚀 **Production Deployment**

### **📱 App Store Deployment**
```bash
# Build for production
npm run build:android  # Google Play Store
npm run build:ios      # Apple App Store
```

### **🌐 Web Deployment**
```bash
# Build web version
npm run build:web
# Deploy the 'web-build' folder to your hosting
```

---

## 💡 **Pro Tips**

### **🎯 Development Tips**
- Use **web version** for fastest development
- **Save frequently** - Expo auto-reloads on save
- **Test on mobile** before final deployment
- **Check console** for any errors

### **📱 Mobile Testing Tips**
- **Expo Go** is perfect for quick testing
- **Test on real device** for best results
- **Check all features** work on mobile
- **Test different screen sizes**

### **🔧 Performance Tips**
- **Clear cache** if app feels slow: `npm run dev`
- **Restart Expo** if issues persist
- **Check internet** connection for mobile testing

---

## 🆘 **Need Help?**

### **📚 Resources**
- **Expo Documentation**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **GitHub Repository**: https://github.com/Alphaninyo/CampusBite_App

### **🐛 Common Issues**
1. **Metro bundler issues** → Run `npm run dev`
2. **Dependency issues** → Run `npm run setup`
3. **Network issues** → Check internet connection
4. **Build issues** → Clear cache and reinstall

---

## 🎉 **You're Ready!**

After running the setup commands, your CampusBite app will be running with:

- ✅ **8 Food Categories** - Complete food coverage
- ✅ **Working Search** - Real-time filtering
- ✅ **Notifications** - Modal with badges
- ✅ **Profile System** - User management
- ✅ **Shopping Cart** - Add/remove items
- ✅ **Order History** - Track past orders
- ✅ **Mobile & Web** - Cross-platform support

**Happy coding! 🚀**
