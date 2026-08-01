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
- **💳 Card Payments (Stripe)** - Native in-app card entry on iOS/Android via Stripe's React Native SDK (no browser redirect); web uses a secure hosted payment page instead, since Stripe's native SDK can't run there. Dev-mode simulation when live keys aren't configured.
- **👤 User Profile** - Account management with photo upload for all roles
- **🔔 Push Notifications** - Order updates delivered via Expo push notifications; vendor bell icon shows live unread count badge
- **🔐 Security** - Two-Factor Authentication (2FA) and password management, with a live Weak/Medium/Strong strength meter shown on Sign Up, Reset Password, and every role's Change Password form
- **📍 Saved Addresses** - Manage delivery locations with current location support; persisted per-user on-device so they survive logout
- **❤️ Favourite Items** - Consumers can heart menu items on a vendor's page for quick reordering from their Profile
- **❓ Help & Support** - Role-based support and accordion FAQ system
- **📸 Vendor Cover Images** - Vendors can upload a banner photo shown on their store page
- **🗑️ Menu Item Delete & Disable** - Vendors can delete menu items with confirmation and toggle availability to mark items out of stock; consumers see disabled items grayed out with an "OUT OF STOCK" badge — on the vendor's menu page and the Home screen's "Trending Now" — rather than the item just disappearing
- **🏷️ Promo Codes** - Vendors create discount codes (percent or fixed KES off, with a minimum order amount, optional usage cap and expiry). Active codes show as a tappable banner on the vendor's page for consumers to discover — tapping one jumps to Cart with the code pre-filled and applied — and every past customer of that vendor is notified when a new code goes live.
- **💰 Platform Service Fee** - CampusBite takes a flat KES 5 from each of the consumer, vendor, and food courier per order (KES 15 total). Shown as its own "Service Fee" line at consumer checkout; vendor/courier earnings screens already show the net amount with an explanatory note. Admin's Stats screen has a "Platform Fees" tile showing the running total.
- **🚴 Distance + Time-of-Day Delivery Pricing** - delivery fee is a distance band (0–1km / 1–3km / 3km+, based on real vendor-to-drop-off distance) plus a Peak-hours or After-hours surcharge on top of Normal-hours pricing. Vendors set their shop's pin from Profile → Shop Location; falls back to a flat fee if either side hasn't set coordinates.
- **📦 Active Delivery Tab** - Food couriers have a dedicated "Active" tab (between Tasks and Earnings) listing every delivery they've currently accepted, with a badge count and one tap through to the full order detail
- **🌙 Dark Mode** - A persisted light/dark theme toggle available to all four roles (Consumer/Admin via Profile → Preferences, Vendor via Profile → Preferences, Food Courier via Profile → App Settings → Appearance), plus a toggle on the pre-login landing page itself
- **📊 Downloadable Reports** - Every role can generate a CSV report (Today / This Week / This Month / All Time): Admin gets a clearly-labeled "Reports" section at the top of Stats with full order-level detail and per-vendor breakdown; Vendors get "Sales Reports" under Profile → Finance & Payouts; Food Couriers get a "Download Report" button on the Earnings tab; Consumers get "My Reports" under Profile → Account
- **⏰ Business Hours** - Vendors set an opening/closing time (e.g. "11:00" / "21:00"); the shop opens and closes automatically at those times with no extra step, computed in Nairobi time regardless of server clock (handling overnight ranges too). A "Pause Orders" toggle lets a vendor force-close early (e.g. running out of food) — it defaults on, so freshly-set hours take effect immediately. Vendor Profile shows a live "Open now"/"Closed now" indicator, and consumers are blocked from adding to cart or checking out while a shop is closed, with an "opens at HH:MM" message
- **⏱️ Estimated Prep Time** - Vendors set a prep time range; visible to consumers on vendor detail
- **💰 Finance & Payouts** - Vendors save M-Pesa number, view earnings from delivered orders, save KRA PIN for tax
- **⭐ Live Ratings** - Vendor dashboard shows real average rating calculated from actual customer reviews
- **📊 Real-time Dashboard** - Revenue, active orders, and rating auto-refresh every 30 seconds
- **🔔 In-App Notification Center** - Real, persisted notifications (not just push) for all four roles, with unread badges, mark-as-read/mark-all-as-read, and tap-through to the relevant order
- **🔑 Delivery PIN / QR Proof-of-Delivery** - A 4-digit PIN (also shown as a QR code) is generated per order and required from the courier before an order can be marked "Delivered"; the courier can type the PIN or scan the customer's QR code with the in-app camera. Admins can see PIN-verified status and force-complete disputed orders with a logged reason.
- **🕐 Order Progress Timestamps** - Consumer Order Detail, the Food Courier delivery timeline, and Admin's order detail all show the actual date/time each status (Preparing, Ready, Collected, In Transit, Delivered) was reached, not just a "Completed" label with no time.

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

## 💳 **Card Payment Integration (Stripe)**

CampusBite integrates with Stripe for debit/credit card checkout, using the same "pay first, then create the order" pattern as M-Pesa.

### **Payment Flow**
1. **Consumer selects Debit/Credit Card** as the payment method at checkout
2. **Backend creates a Stripe `PaymentIntent`** and returns a `client_secret`
3. **A secure checkout page opens** (`GET /checkout/card`) with Stripe Elements — card details are entered there, never seen by the CampusBite backend directly
4. **Backend re-verifies the payment with Stripe's API** before creating the order (the client's confirmation is never trusted alone)
5. **Order confirmation** displayed upon successful payment

### **Setup Requirements**
- Backend needs `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in `.env` (see `.env.example`)
- Leave both as their placeholder values to run in **dev/simulation mode** — a "Simulate Card Payment" button appears instead of a real Stripe form, useful for testing without any Stripe account
- For real test-mode charges, sign up for a free Stripe account and use its test-mode keys (`sk_test_...` / `pk_test_...`) — no code changes needed

### **Test Card (Stripe test mode)**
- Card number: `4242 4242 4242 4242`
- Any future expiry date, any 3-digit CVC
- No real charge is ever made in test mode

### **Troubleshooting**
- **"Your postal code is incomplete"**: Not expected — the checkout page hides the postal code field since this is a Kenya-focused app. If you see this, the Stripe Elements config on `checkout.routes.js` may have regressed.
- **Blank/broken checkout page**: Usually a Content-Security-Policy issue if `helmet()` defaults were changed — the `/checkout/card` route needs its own CSP override permitting `https://js.stripe.com`.

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
- **🏪 Featured Vendors** - Popular restaurants with real cover images (initials placeholder when no image)
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
- **💳 Card Payment** - Real Stripe test-mode checkout on a secure hosted page (dev-mode simulation available)

### **👤 Profile Screen**
- **📊 User Stats** - Total orders, favorite vendor, total spent
- **📸 Profile Photo** - Tap avatar to upload a photo from gallery (all roles); 114×114 px HD display with border and shadow
- **📈 Recent Activity** - Account activity log
- **⚙️ Settings** - App preferences
- **🔐 Security** - Two-Factor Authentication (2FA) setup and password management
- **📍 Saved Addresses** - Manage delivery locations with "Use Current Location" feature
- **❤️ Favourite Items** - Heart a dish on any vendor's menu to save it here for quick reordering; "See all" opens the full list
- **🔔 Notifications** - View and manage order updates and promotional messages
- **❓ Help & Support** - Role-based FAQ and contact information
- **📝 Profile Edit** - Update name, phone, and profile picture

---

## 👥 **User Roles**

### **🛒 Consumer**
- Browse and order food from vendors
- Heart favourite menu items on a vendor's page for quick reordering later
- Track order status in real-time
- Manage saved addresses with location services
- Access role-based help & support
- Configure 2FA for account security
- Toggle Dark Mode (Profile → Preferences), or right from the pre-login landing page
- Download a personal order-history report for any period (Profile → My Reports)

### **🏪 Vendor**
- Manage menu items — add, edit, delete with confirmation, and toggle availability to disable/enable items
- View and process incoming orders — accept or decline (cancel) orders at the `Received` stage
- Set store availability status with optimistic UI toggle
- Upload store cover photo (banner image shown to consumers)
- Configure business hours (24-hour, HH:MM) and estimated prep time
- Save M-Pesa number for payouts (digits-only, validated Kenyan format)
- View payout history — all delivered orders with earnings total in KES
- Save KRA PIN for tax compliance
- View real customer reviews with average rating breakdown
- Contact support via email/call or browse accordion FAQ
- Live dashboard: daily revenue, active orders, and real average star rating auto-refreshing every 30 s
- Notification screen with unread badge on dashboard bell
- Upload a profile photo
- Configure 2FA for account security
- Toggle Dark Mode (Profile → Preferences)
- Download a sales report for any period (Profile → Finance & Payouts → Sales Reports)

### **🚴 Food Courier**
- View available delivery tasks
- A dedicated "Active" tab shows every delivery currently accepted, separate from browsing new tasks
- Track earnings and deliveries
- Manage availability status
- View customer feedback
- Configure 2FA for account security
- Toggle Dark Mode (Profile → App Settings → Appearance)
- Download an earnings report for any period (Earnings tab → Download Report)

### **👨‍💼 Admin**
- Approve vendor applications
- Manage platform users
- View platform statistics
- Access admin-specific support
- Configure 2FA for account security
- Toggle Dark Mode (Profile → Preferences)
- Generate a detailed platform report for any period, right at the top of the Stats tab — defaults to Today for a quick daily report

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

### **📱 Mobile Version (Expo Go, physical device)**
```bash
npm start
```
or explicitly `npx expo start --lan` if `npm start` doesn't show a QR code.

1. Install the **Expo Go** app on your phone (this project targets **Expo SDK 54** — update Expo Go if it's out of date, since Expo Go usually only supports the latest SDK or two).
2. Make sure your **phone is on the same Wi-Fi network** as the computer running the dev server.
3. Scan the QR code shown in the terminal — or, if it isn't rendering (e.g. output piped to a file/log instead of an interactive terminal), open Expo Go → **"Enter URL manually"** and type `exp://<your-computer's-LAN-IP>:8082`.
4. **`src/constants/index.js`'s `API_BASE_URL` must point at your computer's LAN IP** (e.g. `http://192.168.1.42:5000`), not `localhost` — `localhost` on the phone refers to the phone itself, not your computer. Find your LAN IP with `ipconfig` (Windows) / `ifconfig` (macOS/Linux). This value is environment-specific — don't commit your personal LAN IP as the shared default.
5. The backend already binds to `0.0.0.0` so it accepts LAN connections; if it's unreachable, check that your firewall allows inbound connections to `node.exe` (or ports 5000/8082) from the local network.

### **📱 Testing**
- **Web**: Best for development and testing
- **Mobile (Expo Go)**: Real-device testing — see above for LAN setup
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

### **Confirmation dialogs not responding on web**
- React Native's `Alert.alert(title, message, [buttonA, buttonB])` does not render on web — tapping the action does nothing, with no error and no dialog. If a confirm/cancel-style button silently fails on web, check whether it uses a multi-button `Alert.alert`; the fix is to branch on `Platform.OS === 'web'` and use the browser's native `window.confirm()` there instead (`window.prompt()` for a multi-choice picker, as in the food courier's vehicle-type selector). See `AGENTS.md` for the full pattern.

### **"Use Current Location" says geolocation isn't supported**
- On native, location must go through `expo-location` (`Location.requestForegroundPermissionsAsync()` + `Location.getCurrentPositionAsync()`) — the browser's `navigator.geolocation` API does not exist in React Native. If you add a new "use my location" button, branch on `Platform.OS` the same way `ProfileScreen.js` does.

### **A bottom-sheet modal shows its header but the content area is blank (Android)**
- **Root cause**: `ScrollView style={{ flex: 1 }}` nested inside a Modal is inherently unreliable to measure on Android — it can silently collapse to zero height regardless of how the parent sheet's height is computed. A percentage `maxHeight` (e.g. `'85%'`) on the sheet makes this worse since it gives the layout engine even less to resolve against, but **switching to a pixel `maxHeight` is not enough on its own** — a first attempt at this fix computed the pixel value from a module-level `Dimensions.get('window').height` snapshot taken once at import time, which can itself read `0` on a physical device before the native bridge reports real dimensions, silently reproducing the same blank symptom.
- **Fix**: remove `flex: 1` from the `ScrollView` entirely and give the `ScrollView` itself a directly-bounded `maxHeight` (computed from the reactive `useWindowDimensions()` hook, not a one-time `Dimensions.get()` snapshot) so it never depends on flex resolution. See the Security/Notifications/Help & Support modals in `ProfileScreen.js`, `VendorProfileScreen.js`, and `FoodCourierProfileScreen.js` for the reference pattern.
- If a modal "looks fine on web" but is reported blank on a physical Android device, that mismatch alone is a strong signal this is the bug — web's `ScrollView` is just a `div` with `overflow: auto` and doesn't hit this Android-specific measurement issue at all.

### **A screen's custom header renders under the status bar**
- Screens with `headerShown: false` draw their own header and are responsible for their own top safe-area padding. Use `useSafeAreaInsets()` from `react-native-safe-area-context` and apply `paddingTop: insets.top` to the screen's root `View` — see `ExploreScreen.js` for the reference pattern, now applied across every screen with a custom header.

### **An endpoint 404s but the UI shows data anyway**
- Check `src/api/client.js` for a response interceptor mocking that specific URL — a prior "fix" for the food courier profile 404 masked the real broken route with fake hardcoded data instead of fixing the route path. Grep `client.js` for `.includes(` before assuming a working-looking screen is actually reaching the backend.

### **A red "Console Error" LogBox appears on login: `expo-notifications ... removed from Expo Go`**
- Not a bug — Expo Go on Android has not supported real push-notification tokens since SDK 53; a development or production build is required for that to actually work. The library itself logs this via `console.error` when `getExpoPushTokenAsync()` is called under Expo Go, regardless of any surrounding `try/catch`. `authStore.js`'s login flow checks `expo-constants`'s `Constants.executionEnvironment === 'storeClient'` and skips the attempt entirely in Expo Go to avoid the interruption — push notifications still work normally on a real build.

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
