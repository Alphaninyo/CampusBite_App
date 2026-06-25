# 📚 CampusBite App - Project Documentation

## 🎯 **Project Overview**

CampusBite is a modern food delivery mobile application designed specifically for campus environments. It provides students, faculty, and staff with easy access to a wide variety of food options from local vendors, including restaurants, home-based kitchens, cafes, and specialty food providers.

---

## 🏗️ **Architecture Overview**

### **Technology Stack**

**Frontend**
- **React Native + Expo** (~54) — cross-platform mobile and web
- **Zustand** — lightweight global state management
- **React Navigation** — Bottom Tabs + Stack navigators per role
- **AsyncStorage** — JWT and user session persistence
- **Expo Vector Icons** — icon library
- **expo-image-picker** — gallery/camera access for photo uploads
- **expo-notifications** — Expo push notification token registration

**Backend**
- **Node.js + Express** — REST API server (port 5000)
- **Sequelize ORM** — model definitions and migrations
- **PostgreSQL** — primary database (`campusbite_db`)
- **Multer** — multipart file uploads (profile photos, menu images, verification docs)
- **JWT** (`jsonwebtoken`) — stateless authentication
- **Firebase Admin** — push notification delivery
- **Safaricom Daraja API** — M-Pesa STK Push payment integration

### **Project Structure**
```
CampusBite_App-main/
├── src/
│   ├── screens/
│   │   ├── auth/               # Login, Register, Verification, PendingApproval
│   │   ├── consumer/           # HomeScreen, CartScreen, MyOrdersScreen, OrderDetailScreen…
│   │   ├── vendor/             # VendorOrdersScreen, VendorProfileScreen, VendorMenuScreen…
│   │   ├── foodCourier/        # FoodCourierHomeScreen, FoodCourierProfileScreen…
│   │   ├── admin/              # AdminStatsScreen, AdminUsersScreen…
│   │   └── shared/             # ProfileScreen (Admin/Consumer), PendingApprovalScreen…
│   ├── components/             # Reusable UI components
│   ├── stores/
│   │   ├── authStore.js        # Zustand: token, user, login, logout, updateUser, hydrate
│   │   └── cartStore.js        # Zustand: cart items (consumer only)
│   ├── constants/
│   │   └── index.js            # API_BASE_URL, API_URL, COLORS, …
│   ├── api/
│   │   ├── client.js           # Axios instance with auth interceptor
│   │   └── index.js            # All API methods grouped by domain
│   └── navigation/             # Stack and tab navigators per role
├── CampusBite_Backend-main/    # Node.js + Express + Sequelize backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── uploads/avatars/        # Uploaded profile photos
│   └── server.js               # Bootstrap: DB sync + migrations + HTTP server
├── docs/                       # This documentation
├── assets/
├── package.json
└── README.md
```

---

## 🎯 **Core Features**

### **📱 User Experience Features**
- **Smart Search**: Real-time filtering of vendors and food items
- **Category Navigation**: 8 food categories with icons and filters
- **Shopping Cart**: Add/remove items with quantity controls
- **Order Management**: Track order history and real-time status
- **User Profile**: Account management and activity tracking
- **Notifications**: Order updates and promotional alerts

### **🛒 E-commerce Features**
- **Product Catalog**: Browse vendors and food items
- **Cart Management**: Add, update, and remove cart items
- **Order Processing**: Complete checkout flow
- **Order Tracking**: Real-time order status updates
- **Payment Integration**: Secure payment processing
- **Order History**: View past orders and reorder

### **📊 Business Features**
- **Vendor Management**: Restaurant and food provider listings
- **Category Management**: Organized food categories
- **Inventory Tracking**: Item availability and pricing
- **Delivery Management**: Order fulfillment and tracking
- **Analytics**: User behavior and sales data

---

## 🎨 **Design System**

### **Color Palette**
```javascript
const COLORS = {
  primary: '#FF6B6B',      // Main brand color
  secondary: '#4ECDC4',    // Accent color
  background: '#F8F9FA',   // App background
  white: '#FFFFFF',         // Pure white
  black: '#000000',         // Pure black
  gray: '#6C757D',         // Neutral gray
  lightGray: '#E9ECEF',    // Light gray
  danger: '#DC3545',       // Error/danger
  success: '#28A745',      // Success
  warning: '#FFC107',      // Warning
};

const STATUS_COLORS = {
  'Received':   '#FFA500',  // Orange
  'Preparing':  '#17A2B8',  // Blue
  'Ready':      '#28A745',  // Green
  'Collected':  '#6F42C1',  // Purple
  'In Transit': '#007BFF',  // Bright Blue
  'Delivered':  '#28A745',  // Green
  'Cancelled':  '#DC3545',  // Red
};
```

### **Typography**
- **Headings**: Bold, 18-24px
- **Body**: Regular, 14-16px
- **Captions**: Regular, 10-12px
- **Buttons**: Medium, 14-16px

### **Spacing System**
- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px

---

## 📱 **Screen Architecture**

### **🏠 Home Screen**
- **Search Bar**: Global search functionality
- **Category Filters**: Horizontal scrollable category tabs
- **Featured Vendors**: Popular restaurants and providers
- **Trending Items**: Popular food items across categories
- **Floating Action Button**: Quick cart access

### **📋 Orders Screen**
- **Search Bar**: Search specific orders
- **Status Filters**: Filter by order status
- **Order List**: Compact order cards with details
- **Order Details**: Individual order information
- **Track Order**: Real-time order tracking

### **🛒 Cart Screen**
- **Cart Items**: List of added items with details
- **Quantity Controls**: Increase/decrease item quantities
- **Price Summary**: Subtotal, taxes, and total
- **Checkout Button**: Proceed to payment
- **Empty State**: Handle empty cart scenario

### **👤 Profile Screen**
- **User Stats**: Order count and favorite vendor
- **Recent Activity**: Account activity log
- **Settings**: App preferences and configuration
- **Account Management**: Profile editing and security
- **Logout**: Secure logout functionality

---

## 🔧 **State Management**

### **Auth Store (`src/stores/authStore.js`)**
```javascript
const useAuthStore = create((set, get) => ({
  user:  null,   // full user object from backend
  token: null,   // JWT
  loading: true, // true while hydrating from AsyncStorage

  hydrate: async () => { /* restore session from AsyncStorage on app start */ },
  login:   async (email, password) => { /* POST /auth/login, persist, register push token */ },
  register: async (payload) => { /* POST /auth/register, persist */ },
  setSession: async (token, user) => { /* used after social/OAuth flows */ },
  updateUser: (updates) => { /* merge partial updates into user, persist */ },
  logout: async () => { /* clear AsyncStorage, reset state */ },
}));
```

`updateUser` is called after profile changes (name, phone, profile_photo) and stores a `_photo_ts: Date.now()` timestamp used for avatar cache-busting.

### **Cart Store (`src/stores/cartStore.js`)**
```javascript
const useCartStore = create((set) => ({
  cartItems: [],   // [{ vendor_id, menu_item_id, name, price, quantity }]
  vendor: null,    // current vendor (cart is single-vendor)

  addToCart: (item, vendorInfo) => { /* ... */ },
  removeFromCart: (menu_item_id) => { /* ... */ },
  updateQuantity: (menu_item_id, qty) => { /* ... */ },
  clearCart: () => { /* ... */ },
}));
```

---

## 🌐 **API Integration**

### **API Endpoints**
```
// Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/check-status
GET    /api/auth/me
PUT    /api/auth/profile          (multipart — includes avatar upload)
PUT    /api/auth/password
PUT    /api/auth/device-token     (Expo push token registration)
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

// Vendors
GET    /api/vendors
GET    /api/vendors/:id
GET    /api/vendors/profile/me
PUT    /api/vendors/profile/me
PATCH  /api/vendors/profile/me/toggle
GET    /api/vendors/admin/pending
PATCH  /api/vendors/admin/:id/approve
PATCH  /api/vendors/admin/:id/reject

// Menu
GET    /api/menu/vendor/:vendorId
POST   /api/menu
PUT    /api/menu/:id
DELETE /api/menu/:id

// Orders
POST   /api/orders/initiate
POST   /api/orders/dev-confirm/:checkoutRequestId
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status     (advance lifecycle — role-gated)
PATCH  /api/orders/:id/cancel     (vendor decline — Received only)
GET    /api/orders/vendor
GET    /api/orders/food-courier/available
GET    /api/orders/food-courier/mine
PATCH  /api/orders/:id/assign-food-courier
PATCH  /api/orders/:id/collect-cash
PATCH  /api/orders/:id/location

// Notifications
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/mark-read
PATCH  /api/notifications/mark-all-read

// Payments
GET    /api/payments/status/:checkoutRequestId
POST   /api/payments/:checkoutRequestId/cancel

// Promo Codes
POST   /api/promo-codes/validate
GET    /api/promo-codes/my
POST   /api/promo-codes
PATCH  /api/promo-codes/:id/toggle
DELETE /api/promo-codes/:id

// Reviews
POST   /api/reviews
GET    /api/reviews/vendor/:vendorId
GET    /api/reviews/order/:orderId

// Verification
POST   /api/verification/upload
POST   /api/verification/submit-info
GET    /api/verification/status

// Food Courier
GET    /api/food-courier/profile
PUT    /api/food-courier/profile
PATCH  /api/food-courier/profile/toggle-availability
GET    /api/food-courier/admin/pending
PATCH  /api/food-courier/admin/:id/approve
PATCH  /api/food-courier/admin/:id/reject

// Admin
GET    /api/admin/stats
GET    /api/admin/stats/weekly-orders
GET    /api/admin/stats/top-vendors
GET    /api/admin/orders
GET    /api/admin/users
GET    /api/admin/vendors
PATCH  /api/admin/users/:id/request-info
PATCH  /api/admin/users/:id/suspend
GET    /api/admin/users/pending-docs
PATCH  /api/admin/users/:id/approve-docs
PATCH  /api/admin/users/:id/reject-docs
```

### **Data Models**
```javascript
// User Model
{
  id: string,           // UUID
  name: string,
  email: string,
  phone: string,
  role: 'consumer' | 'vendor' | 'food_courier' | 'admin',
  profile_photo?: string,   // server path e.g. "/uploads/avatars/abc_avatar.jpg"
  is_approved: boolean,
  is_suspended: boolean,
  verification_status: 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'info_requested',
  fcm_token?: string,   // Expo push token registered after login
}

// Vendor Model
{
  id: string,
  business_name: string,
  category: string,
  image?: string,
  rating: number,
  delivery_time: string,
  free_delivery: boolean,
  menu: MenuItem[]
}

// Order Model
{
  id: string,           // UUID
  consumer_id: string,
  vendor_id: string,
  rider_id?: string,    // assigned after vendor marks Ready
  status: 'Received' | 'Preparing' | 'Ready' | 'Collected' | 'In Transit' | 'Delivered' | 'Cancelled',
  food_subtotal: number,
  delivery_fee: number,
  discount_amount: number,
  total_amount: number,
  delivery_address: string,
  special_instructions?: string,
  payment_method: 'mpesa' | 'cash' | 'card',
  promo_code?: string,
  scheduled_time?: string,
  created_at: string,
  updated_at: string,
}
```

---

## 🔒 **Security Considerations**

### **Data Protection**
- **Local Storage**: Sensitive data encrypted in AsyncStorage
- **API Security**: JWT tokens for authentication
- **Input Validation**: Form validation and sanitization
- **Error Handling**: Secure error message display

### **User Privacy**
- **Data Minimization**: Collect only necessary user data
- **Consent Management**: Clear privacy policies and consent
- **Data Retention**: Limited data retention periods
- **User Control**: Easy data deletion and export options

---

## 📊 **Performance Optimization**

### **Rendering Optimization**
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Virtual Lists**: FlatList for large data sets
- **Image Optimization**: Placeholder images and lazy loading

### **State Management**
- **Efficient Updates**: Minimal state re-renders
- **Local Storage**: Cached data for offline access
- **Background Sync**: Sync data when app is active
- **Memory Management**: Proper cleanup and garbage collection

---

## 🧪 **Testing Strategy**

### **Unit Testing**
- **Component Tests**: Individual component functionality
- **Store Tests**: State management logic
- **Utility Tests**: Helper functions and utilities
- **API Tests**: API integration and mocking

### **Integration Testing**
- **User Flows**: End-to-end user journeys
- **Navigation Tests**: Screen transitions and routing
- **Data Flow**: API integration and data handling
- **Performance Tests**: App performance and responsiveness

### **Manual Testing**
- **Device Testing**: Multiple screen sizes and devices
- **Platform Testing**: iOS, Android, and Web platforms
- **Accessibility Testing**: Screen readers and accessibility features
- **Usability Testing**: User experience and interface testing

---

## 🚀 **Deployment Strategy**

### **Development Environment**
- **Local Development**: Expo development server
- **Testing**: Expo Go app for mobile testing
- **Web Testing**: Browser-based testing
- **CI/CD**: Automated testing and deployment

### **Production Deployment**
- **Mobile Apps**: App Store and Google Play Store
- **Web App**: Static hosting with CDN
- **API Server**: Cloud hosting with auto-scaling
- **Database**: Managed database service

---

## 📈 **Future Enhancements**

### **Phase 2 Features**
- **Real-time Chat**: Customer support integration
- **Loyalty Program**: Rewards and points system
- **Social Features**: Reviews and ratings
- **Advanced Search**: Filters and sorting options

### **Phase 3 Features**
- **AI Recommendations**: Personalized food suggestions
- **Delivery Tracking**: Real-time GPS tracking
- **Group Orders**: Multi-user ordering
- **Subscription Plans**: Premium features and benefits

---

## 📞 **Support and Maintenance**

### **Documentation**
- **API Documentation**: Complete API reference
- **Component Library**: Reusable component documentation
- **Deployment Guide**: Step-by-step deployment instructions
- **Troubleshooting Guide**: Common issues and solutions

### **Monitoring**
- **Error Tracking**: Sentry or similar error monitoring
- **Analytics**: User behavior and app performance
- **Performance Monitoring**: App speed and responsiveness
- **Uptime Monitoring**: Service availability and health checks

---

## 🎯 **Success Metrics**

### **User Engagement**
- **Daily Active Users**: App usage frequency
- **Session Duration**: Time spent in app
- **Feature Adoption**: Usage of specific features
- **User Retention**: Return user rates

### **Business Metrics**
- **Order Volume**: Number of orders placed
- **Revenue**: Total revenue generated
- **Conversion Rate**: Browse to order conversion
- **Customer Satisfaction**: User ratings and feedback

---

This documentation provides a comprehensive overview of the CampusBite application, covering architecture, features, implementation details, and future roadmap.
