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

## [1.3.0] - 2026-07-07

### 🎉 New Features
- **Working Business Analytics for vendors** — The "Business Analytics" card on the Vendor Profile screen previously just showed a "Feature coming soon!" alert. It now opens a real modal with weekly growth metrics computed from the vendor's own delivered orders: this week's revenue and order count vs. last week (with growth % badges), a 7-day order-count bar chart, and the top 5 best-selling items this week. Computed entirely client-side from `api.orders.getVendorOrders()` — no backend changes needed, following the same pattern already used by the Payout History modal.

---

## [1.4.0] - 2026-07-09

### 🎉 New Features
- **"Report a Problem" for consumers** — Consumers can now flag a delivery issue on any non-cancelled order (`OrderDetailScreen.js`): pick a reason (not delivered, wrong items, missing items, poor quality, other), add an optional note, and submit. The order shows an "Issue reported — we're reviewing it" badge afterward, flipping to a green "Issue resolved" badge once an admin closes it out. Backend: 5 new `orders` columns (`has_issue`, `issue_reason`, `issue_note`, `issue_reported_at`, `issue_resolved_at`), a new `PATCH /api/orders/:id/report-issue` endpoint (consumer-only, blocks duplicate reports and cancelled orders).
- **Admin issue review** — `AdminOrdersScreen.js` shows a red "Issue" flag on any order card with an unresolved report. Opening the order detail shows the reason, note, and reported time, plus a "Mark as Resolved" button, backed by a new `PATCH /api/admin/orders/:id/resolve-issue` endpoint.
- **Vendor Order Detail screen is now reachable** — `VendorOrderDetailScreen.js` existed with a fully built UI (customer info, delivery address, special-instructions/allergy note, itemized pricing, assigned rider) but nothing in the app ever navigated to it. Both the Dashboard's "Incoming Orders" card and the Orders tab's order cards are now tappable and open this screen.
- **Vendor order tracking, the simple way** — The now-reachable detail screen has a new "Delivery Progress" checklist (Received → Preparing → Ready → Collected → In Transit → Delivered) with checkmarks for completed steps, so vendors can watch an order all the way to the consumer without needing a live map. It auto-refreshes every 5 seconds while open.
- **Call the rider directly** — The "Assigned Rider" card on the vendor's order detail screen now has a "Call" button that opens the phone dialer via a `tel:` link, instead of just showing the number as static text.
- **Vendor Orders tab status visibility** — All three tabs (Incoming / In Progress / Completed) now show an order-count badge (previously only "Incoming" did). Each order card also shows a colored status badge (Received/Preparing/Ready/Collected/In Transit/Delivered), matching the same `STATUS_COLORS` the consumer's own orders screen uses — so "Completed" no longer lumps Collected, In Transit, and actually-Delivered orders together with no way to tell them apart.

### 🐛 Bug Fixes
- **Vendor "Cancel Order" was silently accepting the order instead of cancelling it** — `VendorOrderDetailScreen.js` called `api.orders.updateStatus(orderId, 'Cancelled')`, but the backend's `updateOrderStatus` endpoint ignores whatever status the client sends and always advances to the hardcoded next step in its `TRANSITIONS` map. Since `'Cancelled'` isn't a real transition, the backend would silently move a `Received` order to `Preparing` instead of cancelling it. Fixed by calling the correct, already-existing `api.orders.cancel(orderId)` endpoint. This had been dormant since the screen was previously unreachable (see above) — worth a second look at any other button calling `updateStatus` with a status outside the normal pipeline.
- **Vendor Dashboard's "Decline" button did nothing** — `handleDeclineOrder` in `VendorDashboardScreen.js` was a stub that only logged to the console. Now calls `api.orders.cancel()` with a confirmation prompt, matching the working pattern already used on the Orders tab.
- **Confirmation dialogs silently no-op on web, in three places** — React Native's `Alert.alert` with multiple buttons doesn't render on web (previously fixed once for the profile-photo upload dialog, but the fix didn't propagate everywhere). Affected: vendor's "Mark as Preparing"/"Mark as Ready" and "Cancel Order" buttons, and the food courier's "Confirm Cash Received" button — tapping any of them on web showed no dialog and silently did nothing. Fixed by using the browser's native `window.confirm()` on web while keeping `Alert.alert` on native, in `VendorOrderDetailScreen.js` and `RiderOrderDetailScreen.js`.
- **Order timeline's last step never showed as "Completed"** — In both `OrderDetailScreen.js` (consumer) and `RiderOrderDetailScreen.js` (food courier), the timeline's `isPast = index < stepIndex` check can never be true for the final step ("Delivered"), since its own index always equals `stepIndex` once reached — so a fully delivered order would show "Delivered — In progress" forever instead of ticking over to a green checkmark. Fixed by special-casing the terminal status. Applied the same fix to the new vendor progress checklist so all three roles behave consistently.
- **Vendor Dashboard showed stale data after actions taken elsewhere** — `VendorDashboardScreen.js` only fetched data once on mount plus a 30-second background poll, so marking an order "Ready" on the Orders tab and switching back to Home could show outdated counts for up to 30 seconds. Switched to `useFocusEffect` so it refetches every time the Home tab regains focus.
- **"Additional details" note field showed a stray scrollbar** — In the "Report a Problem" modal, the notes `TextInput` sat exactly at the pixel threshold where Chrome/Windows renders a scrollbar with up/down arrows even though nothing overflows. Fixed with a slightly taller box and `overflow: 'hidden'`.

---

## [1.5.0] - 2026-07-10

### 🎉 New Features
- **Real Stripe card payments (test mode)** — Debit/credit card checkout now runs through an actual Stripe integration instead of a cosmetic form. The Cart screen's card option no longer collects raw card digits itself; it explains that card entry happens on a secure Stripe-hosted page next. On checkout, the backend creates a real `PaymentIntent` via the Stripe API (or a `DEV-CARD-...` simulated one if no live keys are configured, mirroring the existing M-Pesa dev-mode pattern) and returns a `client_secret`. The Payment Status screen opens a new server-rendered checkout page (`GET /checkout/card`) embedding Stripe.js + Stripe Elements, where the shopper enters their card. In dev/simulation mode a "Simulate Card Payment" button appears instead, reusing the same generic dev-confirm endpoint already used by M-Pesa.
- **Server-verified card payment confirmation** — New `POST /api/orders/confirm-card-payment/:paymentId` endpoint re-checks the PaymentIntent's status directly with Stripe's API (`status === 'succeeded'`) before creating the order — the client's word alone is never trusted. Orders are still only created after payment is confirmed, consistent with the existing M-Pesa/cash flow design.

### 🔧 Improvements
- **Card flow split out from cash flow** — `order.controller.js`'s combined "create order immediately" branch for card/cash was split into a dedicated Stripe branch (creates a `pending` Payment row with a `cart_data` snapshot, returns `client_secret` / `publishable_key`, `immediate: false`) and an unchanged cash branch (still creates the order immediately). No changes were needed to the existing payment-status polling or cancel endpoints — both were already payment-method-agnostic.
- **Payment Status screen is now payment-method aware** — Button labels and success messages adapt to whether the order was paid by card or M-Pesa (e.g. "Simulate Card Payment" vs "Simulate M-Pesa Payment"), and a live-mode "Enter Card Details" button opens the Stripe checkout page via `Linking.openURL`. The old placeholder success message ("Card payment will be collected on delivery") was replaced with an accurate one.

### 🐛 Bug Fixes
- **Vendor "Decline" button stopped working again** — Fixing the Dashboard's original no-op Decline stub (see `[1.4.0]`) had reintroduced the same multi-button `Alert.alert`-is-broken-on-web bug it was supposed to avoid, and the same bug was independently present — and previously unnoticed — in the Orders tab's own Decline button. Both `VendorDashboardScreen.js` and `VendorOrdersScreen.js` now use `window.confirm()` on web, matching the established pattern (see `AGENTS.md`).
- **"Orders in Progress" cards overlapping on the Vendor Dashboard** — The customer name/order-id text had no truncation and its flex container was missing `minWidth: 0`, so on longer names it visually overlapped the "Ready" button and "Waiting pick-up" label. Fixed with `numberOfLines`/`ellipsizeMode` on the text, `minWidth: 0` on the flex row, and `flexShrink: 0` on the button/label so they no longer get squeezed.
- **Backend crashed on restart with `Cannot find module 'sharp'`** — `sharp` (used for image processing in `vendor.controller.js`) was never declared in `package.json`; it had only been present in `node_modules` from an earlier untracked install, and installing the `stripe` package incidentally pruned it. Added `sharp` as a proper dependency.
- **Stripe checkout page blocked by Content Security Policy** — The app-wide `helmet()` CSP blocked both `https://js.stripe.com` and the checkout page's own inline script. Fixed with a CSP override scoped to just the `/checkout/card` route (every other route is a JSON API where CSP doesn't apply).
- **Stripe card form demanded a postal code** — Kenya doesn't use the postal-code field the default Stripe card Element expects, causing a confusing "incomplete" validation error. Fixed with `hidePostalCode: true` on the Element.

### 🔒 Security Notes
- The `/checkout/card` page is intentionally public (no JWT middleware) since it must be reachable from a plain browser tab; the JWT is instead passed through as a URL query parameter so the page's own confirmation request can authenticate. Acceptable for the current test/dev deployment; revisit before a public production launch.
- Real Stripe keys live only in the backend's `.env` (confirmed `.gitignore`d) — never committed, never sent to the frontend except the publishable key.

### 📁 New files
| File | Purpose |
|---|---|
| `CampusBite_Backend-main/src/services/stripe.service.js` | Thin wrapper around the Stripe SDK (dev-mode detection, PaymentIntent create/retrieve) |
| `CampusBite_Backend-main/src/routes/checkout.routes.js` | Public `GET /checkout/card` — Stripe Elements checkout page |

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_Backend-main/src/controllers/order.controller.js` | Split card/cash flows, added `confirmCardPayment` |
| `CampusBite_Backend-main/src/routes/order.routes.js` | New `confirm-card-payment/:paymentId` route |
| `CampusBite_Backend-main/src/app.js` | Mounted `/checkout` routes |
| `CampusBite_Backend-main/.env.example` | Added `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` placeholders |
| `CampusBite_Backend-main/package.json` | Added `stripe` and `sharp` dependencies |
| `src/api/index.js` | Added `orders.confirmCardPayment()` |
| `src/screens/consumer/CartScreen.js` | Replaced raw card inputs with a Stripe explainer panel |
| `src/screens/consumer/PaymentStatusScreen.js` | Method-aware labels, "Enter Card Details" button, Stripe checkout hand-off |
| `src/screens/vendor/VendorDashboardScreen.js` | Decline button web-confirm fix, Orders-in-Progress layout fix |
| `src/screens/vendor/VendorOrdersScreen.js` | Decline button web-confirm fix |

---

## [1.6.0] - 2026-07-14

### 🐛 Bug Fixes
- **"Use Current Location" never worked on a real device** — `ProfileScreen.js`'s Saved Addresses modal called `window.navigator.geolocation`, a browser-only API that does not exist in React Native, so every attempt on a phone silently failed with "Geolocation is not supported on this platform." Fixed by branching on `Platform.OS`: web keeps the browser API, native now uses `expo-location` (already installed and permission-configured in `app.json`) with a proper foreground permission request — the same pattern already used by `MapAddressPicker` and the rider's live-location tracking.
- **Notifications/Security/Help & Support modals rendered completely blank on Android** — The bottom-sheet container only had a percentage `maxHeight: '85%'`, which doesn't give React Native's layout engine a concrete size to resolve the inner `ScrollView`'s `flex: 1` against on Android, so the scrollable content collapsed to zero height and only the header showed. Fixed with a computed pixel `maxHeight` (`Dimensions.get('window').height * 0.85`) plus `flexShrink: 1`.
- **Screen headers rendered under the status bar on Android** — Only `ExploreScreen.js` accounted for the safe-area top inset; every other screen with a custom header drew it flush against the top of the screen, colliding with the status bar. Applied the same `useSafeAreaInsets()` + `paddingTop: insets.top` fix to all 21 remaining screens with a custom header, across admin, consumer, food courier, and vendor.
- **Food courier profile was silently broken for every courier** — `foodCourierProfile.routes.js` registered the profile endpoints at `GET/PUT /api/food-courier` and `PATCH /api/food-courier/toggle-availability`, instead of the controller's own documented `/api/food-courier/profile` paths. Every request 404'd. This had been masked rather than fixed: a client-side response interceptor caught the failure and quietly returned fake hardcoded data (5 tasks, KES 1,250, 4.8 rating) instead of surfacing the error, so the profile screen always looked like it was working while never actually reaching the database. The write endpoints (change vehicle, toggle availability) weren't covered by the mock and failed with a visible error every time. Fixed the route paths to match the controller's design and removed the mock — it was actively hiding the bug, and leaving it in place would keep masking any future real failure with fake data.
- **Courier earnings/deliveries silently diverged from the real numbers** — Found while fixing the above: `FoodCourierProfileScreen.js` preferred a device-local `AsyncStorage` counter (incremented once per delivery in `RiderOrderDetailScreen.js`) over the correct, live-computed backend totals. The local counter starts at 0 on any given device regardless of how many real deliveries already exist, so the displayed stats would drift from reality after the very first locally-tracked delivery — and since the key wasn't scoped per user, a different courier logging into the same device would see the previous courier's leftover numbers. Removed the local override entirely; the screen now always trusts the backend's live-computed `total_deliveries`/`total_earnings`.
- **Crash: `rating.toFixed is not a function`** — Surfaced immediately once the fake mock above was removed and real data started flowing: the backend returns a Sequelize `DECIMAL` column as a string (e.g. `"0.00"`), not a number, so calling `.toFixed()` on it directly crashed the profile screen. Fixed by coercing with `parseFloat(...) || 0` when the profile loads.
- **Vehicle-type picker didn't work on web** — Both `FoodCourierProfileScreen.js` and `EditProfileScreen.js` used a multi-button `Alert.alert` to let a courier pick their vehicle type — the same pattern documented in `AGENTS.md` as non-functional on web. Fixed with a `Platform.OS === 'web'` branch using `window.prompt` with a numbered list, keeping the native `Alert.alert` picker unchanged.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_Backend-main/src/routes/foodCourierProfile.routes.js` | Fixed route paths to `/profile`, `/profile`, `/profile/toggle-availability` |
| `src/api/client.js` | Removed the fake-data mock for food courier profile fetch |
| `src/screens/shared/ProfileScreen.js` | Native geolocation fix, modal blank-content fix |
| `src/screens/foodCourier/FoodCourierProfileScreen.js` | Safe-area inset, removed AsyncStorage override, rating type fix, web vehicle picker |
| `src/screens/foodCourier/EditProfileScreen.js` | Safe-area inset, web vehicle picker |
| `src/screens/foodCourier/RiderOrderDetailScreen.js` | Removed the AsyncStorage shadow-counter write |
| 18 other screens (admin/consumer/foodCourier/vendor) | Safe-area inset fix for custom headers |

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
