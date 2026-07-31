# 📖 CampusBite User Guide

## 🎯 **Welcome to CampusBite!**

CampusBite is your ultimate food delivery companion for campus life. Order from local restaurants, home-based kitchens, cafes, and more - all delivered right to your doorstep!

---

## 🚀 **Getting Started**

### **First-Time Setup**

#### **1. Download the App**
- **iOS**: Download from App Store
- **Android**: Download from Google Play Store
- **Web**: Visit app.campusbite.com

#### **2. Create Account**
```javascript
// Registration Process
1. Open the app
2. Tap "Sign Up"
3. Enter your details:
   - Full Name
   - Email Address
   - Phone Number
   - Password
4. Verify your email
5. Complete your profile
```

#### **3. Profile Setup**
```javascript
// Profile Information
- Upload profile picture (optional)
- Set delivery preferences
- Add dietary restrictions
- Save favorite vendors
- Set payment methods
```

---

## 🏠 **Home Screen**

### **Navigation Overview**
```
[👤 Profile] CampusBite [🔔 Notifications (2)]
```

### **Search Bar**
```javascript
// Search Functionality
- Type to search for food or restaurants
- Real-time filtering results
- Search by:
  - Food items (burger, pizza, salad)
  - Restaurant names (Burger Barn, Pizza Point)
  - Categories (coffee, healthy, pastries)
```

### **Category Filters**
```javascript
// Available Categories
📱 All - Show all vendors
🍽️ Restaurants - Full-service restaurants
🏠 Home-based - Homemade food providers
🍷 Drinks - Beverages and refreshments
☕ Coffee & Tea - Hot beverages and cafes
🥪 Quick Bites - Fast food and snacks
🥗 Healthy Options - Nutritious choices
🍕 Pastries - Baked goods and desserts
```

### **Featured Vendors**
```javascript
// Vendor Information
- Restaurant name and rating
- Delivery time estimate
- Free delivery indicator
- Category badge
- Tap to view full menu
```

### **Trending Items**
```javascript
// Popular Food Items
- Item name and price
- Vendor information
- Add to cart button (+)
- Tap for item details
```

### **Floating Cart Button**
```javascript
// Cart Access
- Bottom-right corner
- Shows item count badge
- Tap to view cart
- Real-time updates
```

---

## 📱 **Navigation Tabs**

### **Bottom Navigation**
```
🏠 Home     📋 Orders     🛒 Cart     👤 Profile
```

#### **Home Tab**
- Browse vendors and items
- Search functionality
- Category filtering
- Featured content

#### **Orders Tab**
- View order history
- Track current orders
- Filter by status
- Order details

#### **Cart Tab**
- Review cart items
- Update quantities
- Remove items
- Proceed to checkout

#### **Profile Tab**
- Account settings
- Order statistics
- Recent activity
- App preferences

---

## 🛒 **Shopping Cart**

### **Adding Items to Cart**
```javascript
// Add to Cart Process
1. Browse items on Home screen
2. Tap item for details
3. Select quantity and options
4. Tap "Add to Cart" (+ button)
5. Item appears in cart instantly
6. Cart badge updates automatically
```

### **Cart Management**
```javascript
// Cart Features
- View all added items
- Update quantities (+/- buttons)
- Remove items (trash icon)
- See item subtotal
- View cart total
- Add special instructions
```

### **Cart Screen Layout**
```javascript
// Cart Organization
┌─────────────────────────────────┐
│ 📦 Cart Items                    │
│ ┌─────────────────────────────┐ │
│ │ 🍔 Burger x2        $17.98  │ │
│ │    Burger Barn               │ │
│ │    [+][-][🗑️]               │ │
│ └─────────────────────────────┘ │
│                                 │
│ 💰 Price Summary                │
│    Subtotal:    $25.98         │
│    Delivery:    $3.00          │
│    Tax:         $2.48          │
│    Total:       $31.46         │
│                                 │
│ 🧾 [Proceed to Checkout]        │
└─────────────────────────────────┘
```

---

## 📋 **Order Management**

### **Placing an Order**
```javascript
// Checkout Process
1. Review cart items
2. Tap "Proceed to Checkout"
3. Select delivery address
4. Choose payment method
5. Add tip (optional)
6. Confirm order details
7. Tap "Place Order"
8. Receive order confirmation
```

### **Order Status Tracking**
```javascript
// Order Status Flow
📝 Received → 👨‍🍳 Preparing → ✅ Ready → 🚚 Collected → 🚗 In Transit → ✅ Delivered

// Status Details
- Received: Order confirmed by vendor
- Preparing: Food being prepared
- Ready: Food ready for pickup
- Collected: Driver picked up order
- In Transit: On the way to you
- Delivered: Order delivered successfully
```

### **Delivery PIN & QR Code (Proof of Delivery)**
```javascript
// Confirming your order was really delivered
- As soon as you place an order, a 4-digit delivery PIN is generated
- Find it on the order's tracking screen, once status reaches "Collected"
  or later — shown both as digits and as a scannable QR code
- Give the PIN (or let the courier scan the QR code) only once you have
  the food in hand
- The courier cannot mark the order "Delivered" without the correct PIN —
  this protects you from orders being marked delivered before they arrive,
  and protects the courier from disputes once it's confirmed
- Lost or can't find your PIN? Contact support — an admin can verify and
  force-complete the order on their side if needed
```

### **Order History**
```javascript
// Order Features
- View past orders
- Filter by status
- Search orders
- Reorder favorite items
- Track current orders
- View order details
```

### **Order Details**
```javascript
// Order Information
┌─────────────────────────────────┐
│ 📋 Order #ORD-123456            │
│ 🏪 The Grand Bistro             │
│ 📅 Jan 15, 2024 at 12:30 PM     │
│                                 │
│ 📦 Items:                        │
│ • 2x Classic Beef Burger $17.98 │
│ • 1x French Fries $3.99         │
│                                 │
│ 📍 Delivery:                    │
│ 123 Dorm Room, Campus           │
│                                 │
│ 💰 Total: $25.98                │
│ 🚚 Track Order                  │
└─────────────────────────────────┘
```

---

## 👤 **Profile Management**

### **Account Information**
```javascript
// Profile Details
- Personal information
- Contact details
- Delivery addresses
- Payment methods
- Dietary preferences
- Favorite vendors
```

### **Order Statistics**
```javascript
// User Stats
- Total orders placed
- Total amount spent
- Favorite vendor
- Average order value
- Order frequency
```

### **Recent Activity**
```javascript
// Activity Log
- Profile updates
- Security changes
- Account settings
- Login history
- Password changes
```

### **Settings and Preferences**
```javascript
// Available Settings
- Notification preferences
- Privacy settings
- Dark Mode toggle (see "Dark Mode" section below for the exact
  location per role)
- Delivery instructions
- Payment settings
```

---

## � **Security Features**

### **Two-Factor Authentication (2FA)**
```javascript
// Setting Up 2FA
1. Go to Profile → Security
2. Tap "Enable" on Two-Factor Authentication
3. Download an authenticator app (Google Authenticator, Authy, etc.)
4. Scan the QR code or enter the secret key manually
5. Enter the 6-digit verification code from your authenticator
6. 2FA is now enabled!

// Backup Codes
- 10 backup codes are generated when 2FA is enabled
- Save these codes in a safe place
- Use them if you lose access to your authenticator
- Each code can only be used once
```

### **Password Management**
```javascript
// Changing Your Password
1. Go to Profile → Security
2. Tap "Change Password"
3. Enter your current password
4. Enter your new password (minimum 6 characters)
5. Confirm your new password
6. Tap "Update Password"
```

### **Security Tips**
```javascript
// Best Practices
- Use a strong, unique password
- Enable 2FA for extra protection
- Don't share your password with anyone
- Keep your contact information updated
- Save backup codes in a secure location
```

---

## 🌙 **Dark Mode**

```javascript
// Available to every role
- Turn on Dark Mode right from the pre-login landing page (sun/moon
  icon, top-right of the Login screen) — before you've even signed in
- Once logged in, the toggle location depends on your role:
  📱 Consumer / Admin  → Profile → Preferences → Dark Mode
  🏪 Vendor            → Profile → Preferences → Dark Mode
  🚴 Food Courier      → Profile → App Settings → Appearance → Dark Mode
- Your preference is saved on the device and applied automatically
  the next time you open the app
```

---

## 📊 **Reports**

```javascript
// Download a CSV report for Today, This Week, This Month, or All Time
📱 Consumer      → Profile → My Reports
                   Order count, total spent, and full order detail
                   for the selected period

🏪 Vendor        → Profile → Finance & Payouts → Sales Reports
                   Order count, revenue, and full order detail for
                   the selected period

🚴 Food Courier  → Earnings tab → Download Report
                   Deliveries completed, total earnings, and full
                   delivery detail for the selected period

👨‍💼 Admin       → Stats tab → Reports (top of the screen)
                   Defaults to Today for a quick daily report —
                   platform-wide summary, status breakdown, per-vendor
                   breakdown, and full order-level detail

// Note: on web the CSV downloads directly to your Downloads folder.
// On a native (iOS/Android) build, it opens the share sheet instead —
// pick "Save to Files", a cloud drive, email, etc. to get the file.
```

---

## 📍 **Saved Addresses**

### **Managing Delivery Locations**
```javascript
// Adding New Addresses
1. Go to Profile → Saved Addresses
2. Tap "Add New Address"
3. Enter address label (e.g., "Home", "Dorm")
4. Enter full address details
5. Tap "Save Address"

// Using Current Location
1. Go to Profile → Saved Addresses
2. Tap "Add New Address"
3. Tap "Use Current Location" button
4. Allow location access when prompted
5. Address is auto-filled with your GPS location
6. Add a label and save

// Deleting Addresses
1. Go to Profile → Saved Addresses
2. Find the address you want to remove
3. Tap the delete icon
4. Confirm deletion
```
Saved addresses are stored per-account on your device, so they're
still there the next time you log back in on the same device.

---

## ❓ **Help & Support**

### **Role-Based Support**
```javascript
// Consumer Support
📧 Email: support@campusbite.app
📞 Phone: +254 700 000 000
📱 In-App: Profile → Help & Support

// Admin Support
📧 Email: admin@campusbite.app
📞 Phone: +254 700 000 000
📱 In-App: Profile → Help & Support
```

### **Frequently Asked Questions**

#### **Consumer FAQ**
```javascript
Q: How do I place an order?
A: Browse vendors, add items to cart, review cart, 
   select delivery address, choose payment method, 
   and confirm your order.

Q: How do I track my order?
A: Go to Orders tab, select your order, and view 
   real-time status updates.

Q: How do I become a vendor?
A: Visit our website and fill out the vendor 
   application form. Our team will review your 
   application.

Q: How do I become a food courier?
A: Apply through our website. After approval, 
   download the courier app and start accepting 
   delivery tasks.
```

#### **Admin FAQ**
```javascript
Q: How do I approve vendor applications?
A: Go to Approvals tab, review pending applications, 
   check verification documents, and approve or reject.

Q: How do I suspend a user?
A: Go to Users tab, find the user, and select 
   "Suspend" from the options menu.

Q: How do I view platform statistics?
A: Go to Dashboard tab to view order statistics, 
   user growth, and platform performance metrics.

Q: How do I manage orders?
A: Go to Orders tab to view all platform orders, 
   filter by status, and take necessary actions.
```

### **Reporting Issues**
```javascript
// Report a Problem
1. Go to Profile → Help & Support
2. Scroll to "Report an Issue" section
3. Describe your issue
4. Tap "Submit Report"
5. Our support team will respond within 24 hours
```

---

## �🔔 **Notifications**

### **Notification Types**
```javascript
// Notification Categories
📦 Order Updates:
  - Order received
  - Order preparing
  - Order ready
  - Order on the way
  - Order delivered

🎉 Promotions:
  - Special offers
  - Discount codes
  - New vendor announcements
  - Limited time deals

📱 Account:
  - Profile updates
  - Security alerts
  - Payment confirmations
  - Account changes
```

### **Notification Management**
```javascript
// Notification Features
- View all notifications
- Mark as read/unread
- Clear notifications
- Notification settings
- Push notification controls
```
Order and payment notifications include the order ID (and amount,
where relevant) so you can tell which order a notification is about
when you have more than one in progress.

---

## 🔍 **Search and Discovery**

### **Advanced Search**
```javascript
// Search Capabilities
- Real-time search results
- Search by food name
- Search by restaurant name
- Search by category
- Search filters
- Search history
```

### **Category Filtering**
```javascript
// Filter Options
- Food categories
- Price ranges
- Dietary restrictions
- Delivery time
- Rating filters
- Distance filters
```

### **Favourite Items**
```javascript
// How to Favourite an Item
1. Open any vendor's page and browse their menu
2. Tap the heart icon on any item's photo
3. The heart fills in red — the item is now saved

// Finding Your Favourites
1. Go to Profile
2. Scroll to "Favourite Items" (shows your most recent ones)
3. Tap "See all" to view your full list
4. Tap any item to jump straight to that vendor's menu for quick reordering
```

---

## 🏪 **Vendor Menu Management**

### **Managing Menu Items**
```javascript
// Viewing the Menu
1. Go to the Menu tab
2. Browse all menu items in a scrollable list
3. Use the search bar to find items by name
4. Use category chips to filter by category

// Adding a Menu Item
1. Tap "Add New Item" at the bottom of the Menu screen
2. Fill in name, description, price, category, and optionally upload an image
3. Tap "Save" to add the item to the menu

// Editing a Menu Item
1. Find the item in the menu list
2. Tap the item to open the edit screen
3. Update the desired fields
4. Tap "Save" to apply changes

// Toggling Availability (Disable/Enable)
1. Find the item in the menu list
2. Toggle the switch next to the item
3. When OFF, the item shows "OUT OF STOCK" and cannot be ordered
4. When ON, the item is available for consumers to order

// Deleting a Menu Item
1. Find the item in the menu list
2. Tap the trash icon
3. Confirm the deletion in the dialog
4. The item is permanently removed from the menu
```

### **Business Hours & Shop Status**
```javascript
// Setting Your Hours
1. Go to Profile → Edit Profile
2. Set an Opening Time and Closing Time (e.g. "8:00 AM" / "10:00 PM")
   — overnight ranges like "6:00 PM" to "2:00 AM" are supported
3. Save

// How "Open"/"Closed" is decided
- Whenever your open toggle is ON, your shop shows and behaves as
  OPEN only during the hours you've set — it auto-closes to
  consumers outside those hours and auto-reopens within them,
  with no need to toggle it yourself every day
- Manually switching your shop to CLOSED always wins over the
  schedule — it stays closed (even during your set hours) until
  you switch it back to OPEN
- Consumers can't place an order at your shop while it shows Closed,
  whichever reason it's closed for
```

---

## 🚴 **Food Courier Deliveries**

### **Tasks Tab**
```javascript
// Available Tasks
- Browse all ready-for-pickup orders
- Filter by All Tasks, Closest, Highest Pay, or Hot
- Tap "Accept Delivery" to claim an order
```

### **Active Tab**
```javascript
// Your Current Deliveries
- Lists every delivery you've currently accepted (anything not yet
  Delivered or Cancelled) — separate from browsing new tasks
- Shows vendor, drop-off address, status, and earnings per delivery
- Tap any card ("Tap to manage") to open the full order detail
- Advance the order status: Collected → In Transit → Delivered
- Empty? Tap "Find a delivery" to jump straight to the Tasks tab
```

### **Confirming Delivery (PIN / QR Code)**
```javascript
// Required to mark an order "Delivered"
- Tapping "Mark as Delivered" opens a PIN-entry sheet — you cannot
  complete the delivery without it
- Ask the customer to read out their 4-digit delivery PIN and type it in, OR
- Tap "Scan QR Code Instead" to open the camera and scan the QR code
  shown on the customer's order screen — it fills in the PIN automatically
- Wrong PIN or unrecognized QR code → you'll see an inline error and can
  try again
- This protects you: once the correct PIN is confirmed, the order is
  marked delivered with a verified proof-of-delivery record, so a customer
  can't later claim they never received it
```

### **Earnings Tab**
```javascript
// Delivery History
- View all completed and in-progress deliveries
- See total earnings and average earnings per trip
- Filter by Today, This Week, This Month, or All Time
- Tap any delivery to view its details
- Tap "Download Report" to export a CSV of the selected period —
  summary + full delivery detail (see "Reports" below)
```

---

## 💳 **Payment and Checkout**

### **Payment Methods**
```javascript
// Supported Payment Options
📱 M-Pesa
  - STK Push sent straight to your phone
  - Enter your M-Pesa PIN to authorize
  - Powered by Safaricom's Daraja API

💳 Debit/Credit Card
  - Visa, Mastercard, and other cards supported via Stripe
  - You enter your card on a secure Stripe checkout page —
    CampusBite never sees or stores your card number
  - Test mode: use 4242 4242 4242 4242, any future expiry, any CVC
    (no real charge is made)

💵 Cash on Delivery
  - Pay the food courier when your order arrives
```

### **Checkout Process**
```javascript
// Step-by-Step Checkout
1. 📦 Review Cart
   - Confirm items and quantities
   - Add special instructions
   - Apply promo codes

2. 📍 Delivery Information
   - Select delivery address
   - Add delivery instructions

3. 💳 Payment Method
   - Select M-Pesa, Card, or Cash
   - M-Pesa: confirm the STK Push prompt on your phone
   - Card: tap "Enter Card Details" to open the secure Stripe
     checkout page, enter your card, and submit
   - Cash: no further action — pay on delivery

4. ✅ Review Order
   - Confirm all details
   - Check final total
   - Place order

5. 🎉 Order Confirmation
   - Order is created once payment is confirmed (M-Pesa/card)
     or immediately for cash
   - Receive order number
   - Track order status
   - Get delivery updates
```

---

## 🎯 **Tips and Tricks**

### **Save Money**
```javascript
// Money-Saving Tips
💰 Look for free delivery badges
🎉 Check daily special offers
📱 Enable push notifications for deals
⭐ Accumulate loyalty points
🎁 Use promo codes and discounts
👥 Group orders for better rates
```

### **Faster Ordering**
```javascript
// Speed Tips
⭐ Save favorite items for quick reorder
📍 Save multiple delivery addresses
💳 Save payment methods
📝 Use order notes for special requests
⏰ Order during off-peak hours
📱 Use voice search (if available)
```

### **Better Experience**
```javascript
// Experience Tips
📱 Enable location services for accurate delivery
🔔 Turn on notifications for order updates
⭐ Rate vendors after delivery
📝 Provide feedback for better service
🍽️ Try different categories for variety
📅 Plan meals in advance
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **App Not Working**
```javascript
// Solutions
1. Check internet connection
2. Restart the app
3. Clear app cache
4. Update to latest version
5. Restart your device
```

#### **Order Problems**
```javascript
// Solutions
1. Check order status in Orders tab
2. Contact vendor directly
3. Use in-app chat support
4. Call customer service
5. Report issue through app
```

#### **Payment Issues**
```javascript
// Solutions
1. Check payment method details
2. Verify billing address
3. Try different payment method
4. Contact your bank
5. Use alternative payment option
```

#### **Delivery Issues**
```javascript
// Solutions
1. Track order in real-time
2. Contact delivery driver
3. Update delivery instructions
4. Check delivery address
5. Report delivery problems
```

---

## 📞 **Customer Support**

### **Contact Options**
```javascript
// Support Channels
📱 In-App Support
  - Chat with support team
  - Report issues directly
  - Get instant help

📧 Email Support
  - support@campusbite.com
  - Response within 24 hours
  - Detailed issue resolution

📞 Phone Support
  - 1-800-CAMPUS-BITE
  - Available 9 AM - 9 PM
  - Emergency support

💬 Live Chat
  - Available on website
  - Instant response
  - Real-time assistance
```

### **Help Resources**
```javascript
// Self-Service Options
📚 FAQ Section
  - Common questions
  - Step-by-step guides
  - Video tutorials

🎥 Video Tutorials
  - How-to videos
  - App walkthroughs
  - Feature demonstrations

📖 User Guide
  - Complete documentation
  - Detailed instructions
  - Best practices
```

---

## 🎉 **Getting the Most Out of CampusBite**

### **Daily Use**
```javascript
// Routine Recommendations
🌅 Morning: Order coffee and breakfast
🍽️ Lunch: Browse lunch specials
🌆 Evening: Plan dinner delivery
🍕 Late Night: Order snacks for studying
```

### **Special Occasions**
```javascript
// Event Ordering
🎂 Birthdays: Order party food
📚 Study Sessions: Group meal orders
🎉 Events: Catering for gatherings
🏆 Celebrations: Special occasion treats
```

### **Campus Life**
```javascript
// Campus Integration
🏫 Dorm Room Delivery: Direct to dorm
📚 Library Orders: Study fuel delivery
🏃‍♂️ Between Classes: Quick bites
🎓 Exam Week: Stress-relief meals
```

---

## 📱 **App Features Summary**

### **Core Features**
- ✅ Smart search and filtering
- ✅ Real-time order tracking
- ✅ Multiple payment options
- ✅ Favorites and reordering
- ✅ Push notifications
- ✅ Profile management
- ✅ Order history
- ✅ Customer support
- ✅ Dark mode (all roles, plus the landing page)
- ✅ Downloadable CSV reports (all roles)

### **Advanced Features**
- ✅ Group ordering
- ✅ Scheduled delivery
- ✅ Dietary preferences
- ✅ Loyalty program
- ✅ Special offers
- ✅ Multi-language support
- ✅ Accessible design
- ✅ Offline mode

---

## 🎯 **Conclusion**

CampusBite is designed to make your campus food experience convenient, affordable, and enjoyable. With our easy-to-use app, you can order from your favorite local vendors, track your orders in real-time, and enjoy delicious food delivered right to your doorstep.

**Happy ordering! 🍔📱**

---

*For additional help or questions, please contact our support team or visit our help center at help.campusbite.com*
