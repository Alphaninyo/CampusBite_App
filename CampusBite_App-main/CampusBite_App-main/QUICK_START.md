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

> ⚠️ The `npm run build:android` / `build:ios` scripts use Expo's old **Classic Build** system, which Expo shut down years ago — they won't work. Use **EAS Build** instead:

### **📱 Installable Android APK (current method)**
```bash
npx eas-cli login          # once per machine
npx eas-cli build --platform android --profile preview --non-interactive
```
This uploads the project to Expo's build servers and returns a direct-install `.apk` link — no Play Store submission needed, and it works without Expo Go. `eas.json`'s `preview` profile is configured for this (`android.buildType: "apk"`). Any change to `app.json`, `assets/`, or app source needs a fresh build + reinstall on the phone; there is no over-the-air update mechanism configured.

### **🌐 Backend**
The backend isn't run locally in production — it's deployed on Render, connected to Neon Postgres. Push to `main` and Render's Blueprint (`CampusBite_Backend-main/render.yaml`) redeploys automatically. See the main `README.md`'s **Production Deployment** section for the full picture (env vars, Cloudinary image storage, cold-start behavior).

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

**Consumer**
- ✅ **8 Food Categories** - Complete food coverage
- ✅ **Working Search** - Real-time filtering
- ✅ **Vendor Detail** - Cover image, description, hours, prep time, open/closed status
- ✅ **Shopping Cart** - Add/remove items
- ✅ **M-Pesa Checkout** - STK Push payment (digits-only phone input)
- ✅ **Order History & Tracking** - Live status + rider GPS map
- ✅ **Reviews** - Star rating + comment after delivery

**Vendor**
- ✅ **Live Dashboard** - Real revenue, active orders, real average rating — auto-refreshes every 30 s
- ✅ **Notifications** - Full notification screen with unread badge on bell
- ✅ **Store Status Toggle** - Instant optimistic update
- ✅ **Cover Image Upload** - Banner photo shown to consumers
- ✅ **Business Hours** - 24-hour format stepper + text input with real-time validation
- ✅ **Estimated Prep Time** - Chip selector visible to consumers
- ✅ **Bank Details** - M-Pesa number (digits-only, validated)
- ✅ **Payout History** - Delivered orders with KES earnings total
- ✅ **Tax Information** - KRA PIN (validated format)
- ✅ **Customer Reviews** - Real reviews with star summary
- ✅ **Contact Support** - Email/call links + accordion FAQ

**All Users**
- ✅ **Profile System** - Photo upload, name, phone (digits-only)
- ✅ **2FA Security** - Authenticator app support
- ✅ **Mobile & Web** - Cross-platform support

**Happy coding! 🚀**
