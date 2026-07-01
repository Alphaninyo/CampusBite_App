# 🛠️ CampusBite App - Complete Setup Guide

## 🎯 **Goal: Zero-Trouble Setup**

This guide ensures anyone can run the CampusBite app with minimal technical knowledge.

---

## 📋 **System Requirements**

### **Minimum Requirements**
- **Node.js** 18+ (https://nodejs.org)
- **npm** or **yarn** (comes with Node.js)
- **Internet connection** (for mobile testing)
- **4GB+ RAM** (recommended)
- **2GB+ disk space**

### **Optional (for mobile testing)**
- **Smartphone** (iOS or Android)
- **Expo Go app** (free from App Store/Play Store)

---

## 🚀 **Setup Methods**

### **Method 1: Automatic Setup (Recommended)**
```bash
# One command to rule them all
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main
npm run setup
npm start
```

### **Method 2: Web-Only Setup (Easiest)**
```bash
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main
npm install
npm run web
```

### **Method 3: Manual Setup**
```bash
# Step 1: Get the code
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main

# Step 2: Install dependencies
npm install

# Step 3: Install Expo dependencies
npx expo install

# Step 4: Start the app
npm start
```

---

## 📱 **Running the App**

### **🌐 Web Version (No Setup Required)**
```bash
npm run web
```
- ✅ **Opens automatically** in your default browser
- ✅ **Full functionality** available
- ✅ **No mobile device** needed
- ✅ **Perfect for development**

### **📱 Mobile Version (Real Device)**
```bash
npm start
```
1. **Install Expo Go**:
   - **iOS**: App Store → Search "Expo Go"
   - **Android**: Play Store → Search "Expo Go"
2. **Scan QR Code**: Point phone camera at terminal QR code
3. **App Loads**: Automatically opens on your phone

### **📱 Mobile Version (Emulator)**
```bash
npm run android  # Android emulator
npm run ios      # iOS simulator (Mac only)
```

---

## 🔧 **Pre-Setup Checklist**

### **✅ Before You Start**
- [ ] Node.js installed (`node --version` should show v18+)
- [ ] Internet connection active
- [ ] 4GB+ free RAM
- [ ] 2GB+ free disk space
- [ ] For mobile: Expo Go app installed

### **🧪 Test Your Setup**
```bash
# Test Node.js
node --version  # Should show v18 or higher

# Test npm
npm --version   # Should show version number

# Test Git (optional)
git --version   # Should show version number
```

---

## 🚨 **Troubleshooting Guide**

### **❌ Common Setup Issues**

#### **Issue: "command not found: npm"**
```bash
# Solution: Install Node.js
# Visit https://nodejs.org and download the latest version
# Restart your terminal after installation
```

#### **Issue: "node: command not found"**
```bash
# Solution: Add Node.js to PATH
# Windows: Add Node.js installation folder to System PATH
# Mac/Linux: Add to ~/.bashrc or ~/.zshrc
export PATH="/usr/local/bin:$PATH"
```

#### **Issue: "EACCES: permission denied"**
```bash
# Solution: Fix permissions
sudo chown -R $USER:$(id -gn $USER) /usr/local/lib/node_modules
# Or use nvm for Node.js management
```

#### **Issue: "Metro bundler not responding"**
```bash
# Solution: Clear cache and restart
npm run dev
# Or manually:
npx expo start --clear
```

#### **Issue: "Dependencies not found"**
```bash
# Solution: Reinstall everything
npm run setup
# Or manually:
rm -rf node_modules package-lock.json
npm install
npx expo install
```

#### **Issue: "Expo Go can't connect"**
```bash
# Solution: Check network and restart
# 1. Ensure phone and computer on same WiFi
# 2. Restart Expo Go app
# 3. Clear Expo Go cache
# 4. Restart development server
npm start
```

#### **Issue: "Build failed"**
```bash
# Solution: Force reinstall
npm install --force
npx expo install --fix
npm start
```

---

## 📱 **Platform-Specific Setup**

### **🪟 Windows Setup**
```powershell
# Windows PowerShell (as Administrator)
# 1. Install Node.js from nodejs.org
# 2. Install Chocolatey (optional)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 3. Install Git (optional)
choco install git

# 4. Clone and setup
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main
npm run setup
npm start
```

### **🍎 macOS Setup**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Clone and setup
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main
npm run setup
npm start
```

### **🐧 Linux Setup**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/Alphaninyo/CampusBite_App.git
cd CampusBite_App-main
npm run setup
npm start
```

---

## 🧪 **Testing Your Setup**

### **✅ Basic Functionality Test**
1. **App Loads**: Development server starts without errors
2. **Web Version**: `npm run web` opens in browser
3. **Search Works**: Type "burger" and see results
4. **Categories Work**: Tap different category tabs
5. **Navigation Works**: Switch between tabs

### **📱 Mobile Testing Test**
1. **Expo Go**: App connects to development server
2. **All Screens**: Navigate through all app screens
3. **Functionality**: Test cart, search, profile features
4. **Performance**: App runs smoothly on device

### **🔍 Debugging Setup**
```bash
# Check for common issues
npm run setup  # Fixes most dependency issues
npm run dev     # Clears cache if needed
npm start       # Start fresh if problems persist
```

---

## 🎯 **Success Indicators**

### **✅ Setup Successful When:**
- Development server starts without errors
- QR code appears in terminal
- Web version opens in browser
- No red error messages in console
- App interface loads correctly

### **📱 Mobile Testing Successful When:**
- Expo Go connects to development server
- App loads on your phone
- All features work on mobile
- No crashes or major bugs

---

## 🆘 **Getting Help**

### **📚 Resources**
- **Official Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Node.js**: https://nodejs.org/docs
- **GitHub Issues**: https://github.com/Alphaninyo/CampusBite_App/issues

### **🐛 Report Issues**
1. **Check this guide first** for common solutions
2. **Search existing issues** on GitHub
3. **Create new issue** with:
   - Operating system
   - Node.js version
   - Error messages
   - Steps to reproduce

### **💬 Community Support**
- **Discord**: React Native and Expo communities
- **Stack Overflow**: Tag with `expo` and `react-native`
- **GitHub Discussions**: Ask questions in repository

---

## 🗄️ **Backend Setup (Required for full functionality)**

The frontend connects to a Node.js + Express + PostgreSQL API at `http://localhost:5000`.

### **Prerequisites**
- PostgreSQL 14+ running locally or on a server
- A database named `campusbite` (or any name — set in `.env`)

### **Environment File**
Create `CampusBite_Backend-main/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/campusbite
JWT_SECRET=your_secret_key_here
```

### **Start the backend**
```bash
cd CampusBite_Backend-main
npm install
npm run dev
```

On first start, the server automatically applies all `ALTER TABLE … ADD COLUMN IF NOT EXISTS` migrations. You will see `[DB] Column migrations applied.` in the console.

### **Uploads folder**
Vendor cover images and menu photos are stored in `CampusBite_Backend-main/uploads/`. This folder is created automatically on first upload.

### **API Base URL**
The frontend reads `API_BASE_URL` from `src/constants/index.js`. Default is `http://localhost:5000`. Change this to your server's IP for LAN or production use.

---

## 🚀 **Next Steps After Setup**

### **🎯 Explore the App**
1. **Register as a vendor** → get admin approval → toggle store open → add menu items
2. **Register as a consumer** → browse vendors → add to cart → checkout with M-Pesa
3. **Check the vendor dashboard** — revenue, orders, and rating update automatically every 30 s
4. **Test business hours & prep time** in vendor Profile → they appear on the consumer's vendor detail page

### **🔧 Development**
1. **Read the code** to understand structure
2. **Make changes** and see live updates
3. **Test on multiple devices**
4. **Contribute to the project**

### **📱 Deployment**
1. **Build for production** using build scripts
2. **Test on real devices**
3. **Prepare for app stores**
4. **Deploy web version**

---

## 🎉 **You're All Set!**

Your CampusBite app should now be running smoothly. If you followed this guide and still have issues, don't hesitate to reach out for help.

**Happy coding and enjoy your food delivery app! 🍔📱**
