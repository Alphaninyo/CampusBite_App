# 📋 CampusBite Changelog

All notable changes to the CampusBite project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-01-15

### 🎉 Initial Release

#### 📱 Core Features
- **Home Screen** with search and category filtering
- **Shopping Cart** with add/remove functionality
- **Order Management** with real-time tracking
- **User Profile** with activity tracking
- **Notifications** with modal interface

#### 🎨 User Interface
- **8 Food Categories**: Restaurants, Home-based, Drinks, Coffee & Tea, Quick Bites, Healthy Options, Pastries
- **Smart Search** with real-time filtering
- **Responsive Design** for mobile and web
- **Modern UI** with consistent design system

#### 🔧 Technical Features
- **React Native** with Expo framework
- **Zustand** for state management
- **AsyncStorage** for data persistence
- **React Navigation** for routing
- **Component-based architecture**

#### 📚 Documentation
- **Complete documentation suite** with guides and references
- **API documentation** with endpoints and examples
- **Component library** with usage examples
- **Deployment guides** for all platforms
- **User manual** with feature explanations

---

## [1.1.0] - 2026-06-26

### 🎉 New Features
- **Profile photo upload** — All user roles (Consumer, Admin, Vendor, Food Courier) can now tap their avatar to upload a photo from the gallery. Uses Multer on the backend (`avatar` field, JPEG/PNG/WEBP, max 5 MB). Photos are stored at `uploads/avatars/{userId}_avatar{ext}` and served via `/uploads/avatars/`.
- **Vendor order decline** — Vendors can now decline/cancel incoming orders. Added `Cancelled` to the Order status enum, a new `PATCH /api/orders/:id/cancel` endpoint (vendor-only), and the corresponding controller that validates vendor ownership and ensures only `Received` orders can be cancelled. Cancelled orders trigger a push notification to the consumer.
- **Push notification device registration** — The device's Expo push token is now registered with the backend automatically after every successful login, enabling targeted push notifications per user.

### 🔧 Improvements
- **HD avatar display** — Profile photo avatars upgraded to 114×114 px across all profile screens, with a 3 px white border ring, drop shadow, and `resizeMode="cover"` for crisp display.
- **Photo change cache-busting** — Changed profile photos now display immediately. A `_photo_ts` timestamp is stored in the auth store and appended as `?t=<timestamp>` to all avatar URLs so the browser/RN image cache is bypassed on update.
- **Admin notification badge** — Fixed the unread notification count on `AdminStatsScreen`. The API returns `{ unread_count: N }` but the screen was reading `data.count`. Both the live read and the error fallback are now correct.
- **Centralised API base URL** — Removed hardcoded `const API_BASE = 'http://localhost:5000'` from `ProfileScreen.js`, `VendorProfileScreen.js`, and `FoodCourierProfileScreen.js`. All three now import `API_BASE_URL` from `src/constants/index.js`.

### 🐛 Bug Fixes
- **Vendor decline crashed silently** — `handleDecline` was calling `api.orders.updateStatus(id, 'Cancelled')`. `Cancelled` was not in the Order ENUM and not in the `TRANSITIONS` map, so the server always returned an error. Fixed by adding the `Cancelled` ENUM value, a dedicated cancel route, and updating the frontend to call `api.orders.cancel(id)`.
- **Admin notification count always 0** — `AdminStatsScreen` read `notifRes.data.count` instead of `notifRes.data.unread_count`, so the bell badge always showed 0 even when there were unread notifications.
- **Profile photo not updating visually** — Uploading a new photo replaced the file on disk with the same filename. The old image was served from cache. Fixed with timestamp-based cache-busting on the image URL.
- **Photo upload dialog broken on web** — `Alert.alert` with multiple buttons is unreliable on web. Fixed by detecting `Platform.OS === 'web'` and directly calling `ImagePicker.launchImageLibraryAsync` without the Alert.

### 🗄️ Database Migrations
- Added `profile_photo VARCHAR(500)` column to `users` table (idempotent — `ADD COLUMN IF NOT EXISTS`).
- Added `Cancelled` value to `enum_orders_status` PostgreSQL enum type (idempotent — guarded with `pg_enum` existence check).

---

## [Unreleased] - Development

### 🚀 Upcoming Features
- **Real-time chat** with customer support
- **Loyalty program** with points and rewards
- **Advanced search** with filters and sorting
- **AI recommendations** for personalized suggestions

### 🔧 Improvements
- **Performance optimizations** for faster loading
- **Enhanced accessibility** features
- **Offline mode** support
- **Multi-language** support
- **Dark mode** theme option

---

## Version History Template

### **[Version] - [Date]**

#### 🎉 New Features
- [Feature description]
- [Another feature]

#### 🔧 Improvements
- [Improvement description]
- [Another improvement]

#### 🐛 Bug Fixes
- [Bug fix description]
- [Another bug fix]

#### 📚 Documentation
- [Documentation update]
- [Another documentation update]

#### 🚀 Performance
- [Performance improvement]
- [Another performance improvement]

#### 🎨 UI/UX
- [UI/UX improvement]
- [Another UI/UX improvement]

#### 🔒 Security
- [Security improvement]
- [Another security improvement]

---

## 📝 How to Update This Changelog

### **When to Add Entries**
- **New releases**: Add new version section
- **Feature additions**: Add to current unreleased section
- **Bug fixes**: Add to current unreleased section
- **Documentation updates**: Add to current unreleased section

### **Format Guidelines**
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Include date for each release
- Use clear, concise descriptions
- Group changes by type (Features, Fixes, etc.)
- Use emoji icons for visual organization

### **Example Entry**
```markdown
### 🎉 New Features
- Added real-time order tracking with GPS
- Implemented group ordering for multiple users
- Added scheduled delivery options

### 🔧 Improvements
- Enhanced search performance with debouncing
- Improved cart loading speed
- Added better error handling

### 🐛 Bug Fixes
- Fixed cart item quantity update issue
- Resolved notification display problem
- Fixed navigation back button on Android
```

---

## 🔄 Version Guidelines

### **Semantic Versioning**
- **MAJOR**: Breaking changes, new major features
- **MINOR**: New features, improvements
- **PATCH**: Bug fixes, small improvements

### **Release Schedule**
- **Major releases**: Every 2-3 months
- **Minor releases**: Every 2-4 weeks
- **Patch releases**: As needed for bugs

### **Documentation Updates**
- Update with every release
- Include breaking changes
- Document new features
- Update API documentation

---

## 📞 Reporting Issues

### **Bug Reports**
- Use GitHub Issues
- Include version number
- Provide steps to reproduce
- Include device information
- Add screenshots if applicable

### **Feature Requests**
- Use GitHub Discussions
- Describe the feature clearly
- Explain use case
- Suggest implementation approach
- Include mockups if available

---

*This changelog follows the principles of [Keep a Changelog](https://keepachangelog.com/)*
