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

## [1.2.0] - 2026-07-01

### 🎉 New Features

#### Vendor — Finance & Payouts
- **Bank Details modal** — Vendors can save their M-Pesa phone number. Input enforces digits-only (+ allowed at start only), max 13 characters. Kenyan phone format (`/^(\+?254|0)[17]\d{8}$/`) validated before saving. Saved to new `mpesa_phone` column.
- **Payout History modal** — Lists all delivered orders with date and amount. Running total in KES shown at the top. Fetches from existing `GET /orders/vendor` endpoint filtered by `status === 'Delivered'`.
- **Tax Information modal** — Vendors can save their KRA PIN (auto-uppercased, format `A000000000A` validated). Saved to new `kra_pin` column.

#### Vendor — Performance & Support
- **Customer Reviews modal** — Fetches all real reviews via `api.reviews.getVendorReviews`. Shows average star rating + count summary bar and per-review cards with consumer initial avatar, name, date, star rating, and comment.
- **Contact Support modal** — Email and phone call links (`Linking.openURL`). Accordion FAQ section: four common questions expand inline on tap (chevron rotates up/down, answer shown with tinted background). No more `Alert.alert` popups.

#### Vendor — Notifications
- **VendorNotificationsScreen** (`src/screens/vendor/VendorNotificationsScreen.js`) — Full notification list with pull-to-refresh, per-item mark-as-read, and "Mark all read" header button. Notification type determines icon and colour (`order_status`, `payment`, `delivery`, `feedback`, `new_order`).
- **Notification bell badge** — Dashboard header bell now shows a red badge with unread count. Count fetched alongside other data on every 30 s poll.

#### Vendor — Dashboard live data
- **Real average rating** — Rating stat card now computed from actual `vendor_rating` values across all reviews. Was previously hardcoded `4.8`.
- **Auto-polling** — `fetchData` runs every 30 seconds via `setInterval` with cleanup on unmount. Daily Revenue, Active Orders, and Rating all update automatically without manual pull-to-refresh.

#### All users — Phone number validation
- **Digits-only phone inputs** across all screens: letters stripped on every keystroke, `+` allowed at position 0 only, max 13 characters enforced
  - `RegisterScreen` — registration phone field
  - `ProfileScreen` (shared) — profile edit phone field
  - `CartScreen` (consumer) — M-Pesa phone at checkout
  - `EditProfileScreen` (food courier) — profile phone field
  - `VendorProfileScreen` — Bank Details M-Pesa input

### 🔧 Improvements

- **Vendor cover image** — Vendors can now upload a banner/cover image from their profile. Stored at `uploads/vendors/`. Shown as a 180 px image banner on the consumer's `VendorDetailScreen`.
- **VendorDetailScreen rebuilt header** — Now shows cover image, description, location pill, open/closed status pill, business hours pill (`HH:MM – HH:MM`), and prep time pill. All pills render only when the value is set.
- **Business hours — 24-hour stepper** — Replaced scrollable chips with a stepper + inline text input. Real-time digit capping: hours max 23, minutes max 59. Arrow buttons snap to nearest 30-minute slot. Backspace handled correctly. Blur auto-pads to `HH:MM`. Regex validation before save.
- **Estimated Prep Time** — Chip selector with options from `5-10 mins` to `60+ mins`. Saved to `prep_time` and visible on consumer vendor detail page.
- **Store Status toggle** — Now uses optimistic UI update (immediate state flip, reverts to previous on API error). Error message uses `err?.response?.data?.message` for clarity.
- **HomeScreen vendor images** — Vendor cards now load real cover images from `API_BASE_URL + vendor.image`. Initials placeholder (coloured background) shown when no image. All broken `via.placeholder.com` URLs removed.
- **Menu item image placeholders** — Broken external placeholder URLs replaced with inline `View` + `Ionicons name="fast-food-outline"` icon.

### 🐛 Bug Fixes

- **Rating always showing `4.8`** — VendorDashboardScreen had a hardcoded literal `4.8`. Now computed from `allReviews` state.
- **Star rendering broken in review cards** — `review.rating` (always `undefined`) was used instead of `review.vendor_rating`.
- **Time input backspace trapped** — `processTimeInput` would re-insert the colon when deleting, making it impossible to backspace past position 3. Fixed by checking `text.length < prev.length` and allowing free deletion in that branch.
- **Minute padding using `padEnd` instead of `padStart`** — `'3'.padEnd(2,'0')` produced `'30'` instead of `'03'`. Changed to `padStart`.
- **Arrow buttons jumping to wrong slot** — When a custom time was typed, `TIME_OPTIONS.indexOf()` returned `-1` causing arrows to jump to slot 0. Fixed with `nearestTimeIndex()` function.
- **No time validation before save** — Incomplete times like `'08:'` could be saved. Added regex `/^([01][0-9]|2[0-3]):[0-5][0-9]$/` validation in `saveHours`.

### 🗄️ Database Migrations (all idempotent — `ADD COLUMN IF NOT EXISTS`)

```sql
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image       VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS opening_time VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS closing_time VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS prep_time   VARCHAR(30);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS mpesa_phone VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS kra_pin     VARCHAR(20);
```

### 📁 New files

| File | Purpose |
|---|---|
| `src/screens/vendor/VendorNotificationsScreen.js` | Full notification list screen for vendors |

### 🔄 Modified files (key)

| File | What changed |
|---|---|
| `src/screens/vendor/VendorDashboardScreen.js` | Auto-poll, real rating, real review stars, unread badge, notification navigation |
| `src/screens/vendor/VendorProfileScreen.js` | All finance modals, reviews modal, support accordion, hours/prep time stepper, cover image, phone validation |
| `src/screens/consumer/HomeScreen.js` | Real vendor images + initials placeholder |
| `src/screens/consumer/VendorDetailScreen.js` | Full header rebuild with all vendor info pills |
| `src/screens/consumer/CartScreen.js` | Digits-only M-Pesa input |
| `src/screens/shared/ProfileScreen.js` | Digits-only phone input |
| `src/screens/auth/RegisterScreen.js` | Digits-only phone input |
| `src/screens/foodCourier/EditProfileScreen.js` | Digits-only phone input |
| `src/navigation/VendorNavigator.js` | Added `VendorNotifications` to `HomeStack` |
| `CampusBite_Backend-main/src/models/Vendor.js` | Added 7 new fields |
| `CampusBite_Backend-main/src/controllers/vendor.controller.js` | Multer setup, all new fields in `updateMyProfile` |
| `CampusBite_Backend-main/server.js` | 7 new `IF NOT EXISTS` migrations |

---

## [1.2.1] - 2026-07-07

### 🐛 Bug Fixes
- **Explore page vendor images missing** — `ExploreScreen.js` used `vendor.image` directly as the `<Image>` `uri`, but the field is a relative path (e.g. `/uploads/vendors/xxx.jpg`). Every other screen (`HomeScreen.js`, `VendorDetailScreen.js`, `VendorProfileScreen.js`) correctly prefixes it with `API_BASE_URL`; Explore was the one screen that didn't, so vendor cover photos rendered as blank/placeholder there even though they displayed fine everywhere else. Fixed by importing `API_BASE_URL` and building the full URL the same way the other screens do.

### 🔧 Improvements
- **Rate limiter skipped in development** — The global `express-rate-limit` (100 requests / 15 min per IP) in `CampusBite_Backend-main/src/app.js` now only applies when `NODE_ENV !== 'development'`. It was tripping during normal local dev/testing (every request counts against the same IP), returning `429 Too many requests` on all routes including `/api/health`. Production behavior is unchanged.

### ⚠️ Known Gap (not fixed yet)
- **Silent image-upload failures** — `src/api/index.js`'s `_appendImage()` helper swallows any error from fetching the picked image's blob URL on web (`catch { /* ignore — upload without image */ }`). If that fetch fails for any reason, the profile/menu-item save still succeeds and shows "Success" to the vendor, but silently omits the image. Worth surfacing as a visible warning instead of a silent no-op.

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
