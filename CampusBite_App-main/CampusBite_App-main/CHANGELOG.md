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

## [1.6.1] - 2026-07-15

### 🐛 Bug Fixes
- **Notifications/Security/Help & Support modals were still blank on a real Android device after `[1.6.0]`'s fix** — The `[1.6.0]` fix computed the modal's `maxHeight` from a module-level `Dimensions.get('window').height` snapshot taken once at import time, which itself can read `0` on a physical device if it runs before the native bridge reports real dimensions — silently reproducing the exact same blank-content symptom it was meant to fix. Root-caused further: the actual, deeper issue is that `ScrollView style={{ flex: 1 }}` nested inside a Modal is inherently unreliable to measure on Android, regardless of how the parent's height is computed. Fixed properly this time by removing `flex: 1` from every affected `ScrollView` (Security in `ProfileScreen.js`, `VendorProfileScreen.js`, and `FoodCourierProfileScreen.js`; Notifications, Help & Support, and Saved Addresses in `ProfileScreen.js`) and giving each `ScrollView` its own directly-bounded `maxHeight` (via the reactive `useWindowDimensions()` hook, not a stale module-level snapshot) — so the scrollable area no longer depends on flex resolution at all.
- **`expo-notifications` push-token registration triggered a disruptive LogBox error on every login (Android + Expo Go)** — Expo Go on Android has not supported real push-notification tokens since SDK 53 (a development/production build is required); the library itself logs a `console.error` warning about this when `getExpoPushTokenAsync()` is called under Expo Go, which surfaces as a full-screen red error overlay regardless of the surrounding `try/catch`. `authStore.js`'s login flow now checks `expo-constants`'s `executionEnvironment` and skips the push-token attempt entirely when running in Expo Go, so it no longer interrupts testing. Push notifications are unaffected on a real build.

### 📦 Dependencies
- Added `expo-constants` as an explicit dependency (previously only present transitively via the `expo` package) — used to detect the Expo Go execution environment above.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `src/screens/shared/ProfileScreen.js` | Switched to `useWindowDimensions()`; removed `flex: 1` from all 4 modal ScrollViews |
| `src/screens/vendor/VendorProfileScreen.js` | Same fix applied to the Security modal |
| `src/screens/foodCourier/FoodCourierProfileScreen.js` | Same fix applied to the Security modal |
| `src/stores/authStore.js` | Skip push-token registration when running in Expo Go |
| `package.json` | Added `expo-constants` dependency |

---

## [1.7.0] - 2026-07-16

### 🎉 New Features
- **Favourite Items (consumer)** — The Profile screen's "Favourite Items" section was a static placeholder with no functionality behind it at all ("Tap the heart on any item..." never actually did anything anywhere in the app, the "Favourites" stat was a hardcoded `—`, and "See all" had no `onPress`). Built out for real, consumer-only:
  - A heart icon on every item in `VendorDetailScreen.js`'s menu — tap to favorite/unfavorite a dish, with an optimistic UI update.
  - The Profile screen's "Favourite Items" section now shows the consumer's actual favorited items (image, price, vendor), and the "Favourites" stat shows the real count.
  - "See all" opens a modal (matching the existing Notifications/Security bottom-sheet pattern) listing every favorited item.
  - Tapping a favorited item — inline or in the modal — navigates straight to that vendor's menu for quick reordering.
  - New backend: `Favorite` model (unique per consumer + menu item), `POST /api/favorites/toggle`, `GET /api/favorites`, `GET /api/favorites/ids`.
  - This is scoped entirely to the consumer side — vendors have no favorites concept; `VendorProfileScreen.js` was not touched.

### 📁 New files
| File | Purpose |
|---|---|
| `CampusBite_Backend-main/src/models/Favorite.js` | Favorite model (consumer_id + menu_item_id, unique together) |
| `CampusBite_Backend-main/src/controllers/favorite.controller.js` | Toggle, list, and lightweight IDs-only endpoints |
| `CampusBite_Backend-main/src/routes/favorite.routes.js` | Mounted at `/api/favorites` |

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_Backend-main/src/models/index.js` | Favorite ↔ User / MenuItem associations |
| `CampusBite_Backend-main/src/app.js` | Mounted `/api/favorites` |
| `src/api/index.js` | Added `favorites.toggle()` / `getIds()` / `getAll()` |
| `src/screens/consumer/VendorDetailScreen.js` | Heart icon + toggle on every menu item |
| `src/screens/shared/ProfileScreen.js` | Real Favourite Items data, real stat count, "See all" modal |

---

## [1.7.1] - 2026-07-15

### 🎉 New Features
- **Vendor menu item delete and disable** — Vendors can now delete menu items from the Menu tab via a confirmation dialog, and toggle an item's availability on/off so it shows as "OUT OF STOCK" to consumers.
- **Food courier active delivery visibility** — The Tasks (`AvailableOrdersScreen`) now shows a "My Active Delivery" section at the top for any order assigned to the logged-in courier and not yet delivered, so riders can quickly access their current delivery.

### 🔧 Improvements
- **Menu delete confirmation** — Replaced the native `Alert.alert` multi-button confirmation with a custom cross-platform `Modal` so the confirmation works reliably on web.

### 📚 Documentation
- Updated `README.md` to reflect vendor menu management and food courier active delivery features.
- Updated `docs/USER_GUIDE.md` with new sections for Vendor Menu Management and Food Courier Deliveries.

---

## [1.8.0] - 2026-07-20

### 🎉 New Features
- **Refund handling when a vendor declines a paid order** — Previously, declining an order just marked it `Cancelled` and sent a notification promising "a refund will be processed if applicable" — nothing actually processed it. Now, when a vendor declines an already-paid order: cash orders are marked `not_applicable` (nothing was ever collected); card orders are refunded for real via Stripe's Refunds API; M-Pesa orders are flagged `manual_required`, since automated reversal needs Safaricom Daraja Reversal API credentials (Initiator name + Security Credential) this project doesn't have configured — a new admin-only `PATCH /api/admin/orders/:id/mark-refund-complete` endpoint lets an admin mark it done once they've sent the refund manually. New `orders.refund_status` (`not_applicable` / `refunded` / `manual_required` / `failed`) and `orders.refunded_at` columns; new `Payment` status value `refunded`.
- **Contact numbers for vendor, rider, and consumer, visible to each other** — The backend never fetched the vendor's own phone number in any order query (only `business_name`/`location`) — nobody could call a vendor from the app. Consumer and rider phones were already being fetched but had no tappable call button anywhere. Added `vendor.owner.phone` to every relevant order query, and added `tel:` Call buttons across all three roles: consumer's `OrderDetailScreen.js` (call vendor + call rider), vendor's `VendorOrderDetailScreen.js` (call customer — call rider already existed), and food courier's `RiderOrderDetailScreen.js` (call vendor + call customer). Every number shown is exactly the phone number that user registered their account with.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_Backend-main/src/controllers/order.controller.js` | `refundDeclinedOrder()`, vendor `owner.phone` added to order includes |
| `CampusBite_Backend-main/src/controllers/admin.controller.js` | `markRefundComplete` |
| `CampusBite_Backend-main/src/routes/admin.routes.js` | New `mark-refund-complete` route |
| `CampusBite_Backend-main/src/services/stripe.service.js` | `refundPaymentIntent()` |
| `CampusBite_Backend-main/src/models/Order.js` | `refund_status`, `refunded_at` |
| `CampusBite_Backend-main/src/models/Payment.js` | Added `refunded` status |
| `CampusBite_Backend-main/server.js` | New idempotent migrations for the above |
| `src/screens/consumer/OrderDetailScreen.js` | Vendor contact card, rider Call button |
| `src/screens/vendor/VendorOrderDetailScreen.js` | Call button next to customer phone |
| `src/screens/foodCourier/RiderOrderDetailScreen.js` | Call buttons for vendor and customer |

---

## [1.9.0] - 2026-07-21

### 🎉 New Features
- **Production deployment** — The backend now runs live on Render (`https://campusbite-backend-api.onrender.com`) backed by a Neon Postgres database (migrated off Render's own free Postgres, which auto-deletes after 30 days; Neon's free tier has no such expiration). The app itself is distributed as a real installable Android APK via EAS Build, rather than requiring Expo Go.
- **Real Google Maps integration** — `app.json`'s `android.config.googleMaps.apiKey` was a placeholder (`YOUR_GOOGLE_MAPS_API_KEY_HERE`), so every map view in the app rendered blank. Replaced with a real key from Google Cloud.
- **New app icon and branding** — Replaced Expo's default template icon (the grey concentric-circle placeholder every screenshot of the app showed until now) with a designed CampusBite mark, plus a matching splash screen. The app's display name on the home screen now reads "CampusBite" instead of the internal slug `campusbite-app`.

### 🐛 Bug Fixes
- **Uploaded images (vendor covers, menu items, avatars, verification docs) were disappearing** — They were being saved to the backend's local disk via Multer, but Render's filesystem is ephemeral: every restart or redeploy (including the free tier's automatic spin-down after 15 minutes of inactivity) wiped the `uploads/` directory clean. Uploads now go straight to Cloudinary instead, which returns a permanent URL that survives restarts. The frontend's image-URL construction (previously a raw `${API_BASE_URL}${path}` template repeated in ~14 screens) is now a single `resolveImageUrl()` helper in `constants/index.js` that handles both the new full Cloudinary URLs and any legacy relative path.
- **M-Pesa STK Push failures showed a useless generic message** — `"M-Pesa service is currently unavailable. Please try again shortly."` gave no way to tell a real Safaricom rejection (bad phone number, insufficient funds, etc.) apart from a misconfigured environment variable. The error now includes Safaricom's actual rejection reason.
- **Admin filter tabs were unreachable past the screen edge** — The tab/filter pill rows on the Vendors, Orders, Users, and Approvals admin screens (e.g. "Suspended", "Documents") overflowed off-screen inside a plain `View` with no way to scroll to them. Wrapped each in a horizontal `ScrollView`.
- **`expo-doctor` flagged a duplicate `expo-font` install and a stale `expo` patch version** — both fixed (`npx expo install --fix`); resolves a "may crash outside of Expo Go" warning tied to `@expo/vector-icons`.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_Backend-main/src/config/cloudinary.js` | New — Cloudinary SDK config from env vars |
| `CampusBite_Backend-main/src/services/upload.service.js` | New — `uploadBufferToCloudinary()` shared helper |
| `CampusBite_Backend-main/src/controllers/vendor.controller.js` | Multer switched to memory storage → Cloudinary |
| `CampusBite_Backend-main/src/controllers/menu.controller.js` | Same |
| `CampusBite_Backend-main/src/controllers/verification.controller.js` | Same (images + PDFs) |
| `CampusBite_Backend-main/src/controllers/auth.controller.js` | Avatar upload switched to Cloudinary |
| `CampusBite_Backend-main/src/controllers/order.controller.js` | M-Pesa catch block now includes `mpesaError.message` |
| `CampusBite_Backend-main/render.yaml` | Added `CLOUDINARY_*` env vars |
| `src/constants/index.js` | New `resolveImageUrl()` helper |
| 12 screen files across `admin/`, `consumer/`, `vendor/`, `foodCourier/`, `shared/` | Switched to `resolveImageUrl()` |
| `src/screens/admin/AdminVendorsScreen.js`, `AdminOrdersScreen.js`, `AdminUsersScreen.js`, `AdminApprovalsScreen.js` | Tab rows wrapped in horizontal `ScrollView` |
| `app.json` | Real Maps API key; `name` → `CampusBite`; splash/adaptive-icon background color |
| `assets/icon.png`, `adaptive-icon.png`, `favicon.png`, `splash-icon.png` | New logo artwork |

---

## [1.9.1] - 2026-07-21

### 🐛 Bug Fixes
- **Real users were getting locked out with "Too many requests. Please slow down and try again shortly." after only a handful of login attempts** — Express never called `app.set('trust proxy', ...)`, so behind Render's reverse proxy it couldn't read the real client IP from `X-Forwarded-For`. Both the global rate limiter and the auth-specific login limiter key off IP, and every request was silently resolving to the *same* IP — meaning all traffic to the API, from every user, was sharing one 100-requests-per-15-minutes budget instead of each person getting their own. Heavy traffic from any single source (including routine API testing against production) could exhaust that shared budget and block everyone else's genuine logins at the same time. Fixed with a single `app.set('trust proxy', 1)` — rate limits are now correctly scoped per client IP.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_Backend-main/src/app.js` | Added `app.set('trust proxy', 1)` |

---

## [1.10.0] - 2026-07-26

### 🎉 New Features
- **Real in-app notification system, for real this time** — `Notification.create()` was never actually called anywhere in the backend, so every role's bell icon was cosmetic. Added `notifyUser`/`notifyAdmins`/`notifyAvailableCouriers` helpers and wired them into every event that should produce a notification: order placed, status changes, rider assigned/available-for-pickup, cash collected, order cancelled/refunded, issues reported, vendor/courier registration and approval/rejection, and document verification. All four roles (consumer, vendor, food courier, admin) now have a working notifications screen with unread badges, "Mark all as read", and tap-through to the relevant order. Admin previously had no notification route at all — `AdminNavigator.js` was restructured with per-tab stacks so a shared `AdminNotifications` screen could be pushed from any tab.
- **Delivery PIN + QR code proof-of-delivery** — every order now generates a 4-digit delivery PIN at creation time, shown only to the consumer (as digits and as a QR code on the order tracking screen). The courier cannot transition an order to "Delivered" without submitting the correct PIN; a wrong or missing PIN returns a clear inline error instead of silently completing. This closes the "order marked delivered but customer never got it" / "customer claims non-delivery" dispute loop. `delivery_pin_verified` distinguishes a real PIN-confirmed delivery from an admin override.
- **Camera QR-code scanning for couriers** — the courier no longer has to type the PIN by hand. A "Scan QR Code Instead" button on the PIN-entry sheet opens the device camera (`expo-camera`), decodes the customer's QR code, and auto-submits it as the delivery PIN. Falls back cleanly to manual entry if camera permission is denied or the code doesn't match.
- **Admin force-complete override** — for orders stuck or disputed because the PIN was lost or never verified, an admin can force-complete the order with a required reason, which is stored and shown on the order (`admin_override_reason`). Admin's order list/detail also now shows a clear "PIN-verified" vs "admin override" badge.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_Backend-main/src/services/notification.service.js` | Added `notifyUser`/`notifyAdmins`/`notifyAvailableCouriers` |
| `CampusBite_Backend-main/src/controllers/order.controller.js` | PIN generation + verification on the Delivered transition, courier broadcast on Ready, notifications wired into every order event |
| `CampusBite_Backend-main/src/controllers/payment.controller.js` | Fixed M-Pesa callback reading nulled `payment.cart_data` for notification text |
| `CampusBite_Backend-main/src/controllers/admin.controller.js` | Added `forceCompleteOrder`, notifications on issue/refund/verification actions |
| `CampusBite_Backend-main/src/models/Order.js` + `server.js` | Added `delivery_pin`, `delivery_pin_verified`, `admin_override_reason` columns |
| `CampusBite_App-main/src/screens/admin/AdminNotificationsScreen.js` | New screen |
| `CampusBite_App-main/src/navigation/AdminNavigator.js` | Restructured with per-tab stacks so notifications can be pushed from any admin tab |
| `CampusBite_App-main/src/screens/consumer/OrderDetailScreen.js` | PIN + QR code display card |
| `CampusBite_App-main/src/screens/foodCourier/RiderOrderDetailScreen.js` | PIN-entry modal + camera QR scanner |
| `CampusBite_App-main/src/screens/admin/AdminOrdersScreen.js` | PIN-verified/override badges + force-complete panel |
| `CampusBite_App-main/app.json` | Added `expo-camera` plugin + camera permission strings |

---

## [1.11.0] - 2026-07-29

### 🎉 New Features
- **Dark mode (consumer, first phase)** — added a `ThemeContext` (light/dark palettes, persisted preference, `useTheme()` hook) and rolled it out across every consumer-facing screen (Home, Explore, Vendor detail, Cart, Checkout, Payment status, My Orders, Order detail, Write review) plus the shared Profile screen and the consumer tab/header chrome. A "Dark Mode" toggle now lives under a new "Preferences" section on the consumer's Profile screen. Vendor, food courier, and admin screens are unchanged for now — this is a deliberate first phase to prove out the pattern before extending it to the other roles.
- The preference is gated by role in `ThemeContext`, not just hidden in the UI: `ProfileScreen.js` is shared between the consumer and admin navigators, so if dark mode were only UI-gated, a device that had a consumer dark-mode session could leak a dark Profile screen into an admin login on the same device (`AsyncStorage` is per-device, not per-account). Verified this doesn't happen — toggling dark as the consumer, then signing in as admin on the same browser storage, correctly shows a fully light admin Profile with no "Preferences" section at all.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `CampusBite_App-main/src/contexts/ThemeContext.js` | New: theme provider/hook, dark-mode gated to the consumer role |
| `CampusBite_App-main/src/constants/index.js` | Added `DARK_COLORS` palette |
| `CampusBite_App-main/App.js` | Wrapped the app in `ThemeProvider` |
| `CampusBite_App-main/src/navigation/index.js` | `NavigationContainer` now uses React Navigation's `DarkTheme` for the consumer when dark mode is on |
| `CampusBite_App-main/src/navigation/ConsumerNavigator.js` | Tab bar, floating cart button, and stack headers now theme-aware |
| `CampusBite_App-main/src/screens/consumer/*.js` (9 screens) | Converted from a static `COLORS` import to `useTheme()` + a `makeStyles(COLORS)` factory |
| `CampusBite_App-main/src/screens/shared/ProfileScreen.js` | Theme-aware + new "Preferences" section with the Dark Mode toggle (consumer-only) |

---

## [1.12.0] - 2026-07-30

### 🎉 New Features
- **Dark mode, completed for every role** — 1.11.0 shipped dark mode for the consumer role only as a deliberate first phase. This release extends the exact same `ThemeContext` pattern to the pre-login landing/auth screens (Login, Register, Forgot/Reset Password, Verification, Submit Info — including a sun/moon toggle right on the Login screen itself) and to all three remaining roles: Vendor (10 screens + `VendorNavigator`, toggle in Profile → Preferences), Food Courier (9 screens + `FoodCourierNavigator`, toggle in Profile → App Settings → Appearance), and Admin (6 screens + `AdminNavigator`, toggle already available for free via the shared `ProfileScreen.js` since Admin and Consumer share that screen). The consumer-only gate in `ThemeContext.js` was removed since every role now has correctly theme-aware screens.

### 🐛 Bug Fixes
Extending dark mode surfaced a long list of pre-existing bugs that were invisible until a dark palette existed to expose them — all fixed as part of this rollout:
- `COLORS.black` used for text/icon color (a fixed, non-theme-aware constant) rendering invisible black-on-black text.
- `COLORS.white` used directly for `backgroundColor` on headers, cards, and tab bars — found across nearly every Food Courier screen, `VendorNotificationsScreen`, `VendorDashboardScreen`, and both the Consumer and Vendor tab bars — so those surfaces stayed literally white regardless of theme.
- Module-level constant objects/functions (`STATUS_CONFIG`, `TYPE_COLOR`, `getStatusBgColor`, `getPerformanceBadge`, admin's `StatCard`/`WeeklyBarChart`/`ProgressBar`/`VerificationBadge`/`DetailRow` helpers) built once at import time against the static light palette, so their colors never actually changed in dark mode. Converted to factory functions/props that take `COLORS` as a parameter.
- Hardcoded hex colors on status banners and badges (e.g. `#FEE2E2`, `#FFFBEB`, `#F0FDF4`, `#DCFCE7` and their border/text pairs) that didn't adapt to theme — replaced with the corresponding theme tokens (`COLORS.dangerBg`, `COLORS.warningBg`, `COLORS.successBg`, etc.) across Vendor, Food Courier, and Admin screens.
- `HomeScreen`'s search `TextInput` was missing `color`/`placeholderTextColor` entirely, so both the placeholder and typed text were invisible in dark mode.
- Web `-webkit-autofill` CSS on `LoginScreen`/`RegisterScreen` hardcoded a white inset box-shadow, showing a white box around autofilled inputs regardless of theme.
- Nested "recessed panel" surfaces (`CartScreen`'s address/payment inputs, `MenuScreen`'s tip icon, `VendorSettingsScreen`'s document preview) used `COLORS.background` — the darkest, page-level token — instead of `COLORS.inputBg`/`COLORS.card`, creating a "black hole" effect when nested inside an already-elevated card.
- The dark palette itself (`DARK_COLORS.background`/`.card`) was widened for more contrast between page and card surfaces.
- Five Admin screens (`AdminApprovalsScreen`, `AdminOrdersScreen`, `AdminStatsScreen`, `AdminUsersScreen`, `AdminVendorsScreen`) had a loading spinner with no background color set, rendering as solid black instead of the themed background while data was fetching.
- `RootNavigator`'s native header/background theme was previously gated to `user.role === 'consumer'`; now applies `DarkTheme`/`DefaultTheme` for every role and the pre-login container.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `src/contexts/ThemeContext.js` | Removed the consumer-only role gate |
| `src/navigation/index.js` | Theme now applies to every role's `NavigationContainer`, not just consumer |
| `src/navigation/VendorNavigator.js`, `FoodCourierNavigator.js`, `AdminNavigator.js` | Added themed `stackScreenOptions(COLORS)` headers + theme-aware tab bars |
| `src/screens/auth/*.js` (6 screens) | Converted to `useTheme()`; Dark Mode toggle added to `LoginScreen.js` |
| `src/screens/vendor/*.js` (10 screens) | Converted to `useTheme()`; Dark Mode toggle added to `VendorSettingsScreen.js` |
| `src/screens/foodCourier/*.js` (9 screens) | Converted to `useTheme()`; Dark Mode toggle added to `AppSettingsScreen.js` (a pre-existing fake, disconnected toggle was replaced with a real one) |
| `src/screens/admin/*.js` (6 screens) | Converted to `useTheme()` |
| `src/screens/shared/ProfileScreen.js` | Consumer-only gate removed from the "Preferences" section — Admin now gets the same Dark Mode toggle for free |

---

## [1.13.0] - 2026-07-30

### 🎉 New Features
- **Active Delivery tab for food couriers** — previously the only way to see an in-progress delivery was a small "My Active Delivery" card tucked into the Tasks screen. Added a dedicated "Active" tab between Tasks and Earnings listing every delivery the courier currently has accepted (any status other than Delivered/Cancelled), each card showing vendor, drop-off address, status, and earnings, tapping through to the existing order detail screen. The active-delivery badge count that used to sit on the Earnings tab now correctly lives on this new tab.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `src/screens/foodCourier/ActiveDeliveryScreen.js` | New screen |
| `src/navigation/FoodCourierNavigator.js` | New `ActiveStack` + `ActiveTab`, badge moved from Earnings to Active |

---

## [1.14.0] - 2026-07-30

### 🎉 New Features
- **Downloadable reports for every role** — Admin previously had a single unlabeled download icon buried in the Stats header, generating an all-time-only CSV. Replaced with a clearly-labeled "Reports" section at the top of Stats with Today/This Week/This Month/All Time options (defaulting to Today for a quick daily report), pulling every order across pages so period totals are accurate rather than capped at the first 100. The same period-based CSV export was extended to the other three roles: Food Couriers get a "Download Report" button next to the existing period tabs on Earnings; Vendors get a new "Sales Reports" entry in Profile → Finance & Payouts; Consumers get a new "My Reports" entry in Profile → Account. Each report includes a summary, status/vendor breakdown (where applicable), and full order-level detail.

### 🔧 Improvements
- Shared period-filter and CSV-download logic lives in a new `src/utils/reports.js` to avoid reimplementing it four times.

### 🐛 Bug Fixes
- The active period chip and the new "Download Report" button on the Food Courier Earnings screen both used `COLORS.card` as their highlight background — correct on light mode's white card token, but near-black in dark mode against the always-orange summary card behind them. Pinned both to a fixed white background instead.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `src/utils/reports.js` | New: `REPORT_PERIODS`, `filterByPeriod`, `csvCell`, `downloadCSVReport` |
| `src/screens/admin/AdminStatsScreen.js` | New "Reports" section, paginated order fetch for accurate period totals |
| `src/screens/foodCourier/MyDeliveriesScreen.js` | "Download Report" button |
| `src/screens/vendor/VendorProfileScreen.js` | New "Sales Reports" modal |
| `src/screens/shared/ProfileScreen.js` | New "My Reports" modal (consumer-only) |

---

## [1.14.1] - 2026-07-30

### 🐛 Bug Fixes
- **Low-contrast arrow icons on Login, Register, and Checkout buttons** — the arrow/checkmark badge on each used the same orange as the button background, nearly invisible against the translucent white badge behind it. Fixed to white on `LoginScreen.js`, `RegisterScreen.js`, and `CartScreen.js`'s "Proceed to Checkout".
- **Forms didn't submit on Enter** — Login's password field now submits on Enter (the email field advances focus to password first); Cart's M-Pesa phone field opens the order-confirmation sheet on Enter, same as tapping "Proceed to Checkout" (still respects the existing delivery-address validation).

---

## [1.15.0] - 2026-07-30

### 🐛 Bug Fixes
- **Fixed checkout from the Explore tab / vendor detail page** — `VendorDetailScreen` (reached from both Home and Explore) had its own "quick checkout" path straight to a separate `CheckoutScreen`: a stripped-down implementation supporting only M-Pesa, with no address map picker, no promo codes, and a hard requirement for a phone number already saved on the profile — so checkout from Explore would fail outright for many users. Since `VendorDetailScreen` already syncs its local cart into the shared cart store on every change, its checkout bar now simply navigates to the Cart tab instead, giving it the exact same full-featured checkout (address picker, all 3 payment methods, promo codes) that already worked from the Cart tab directly.

### 🗑️ Removed
- `src/screens/consumer/CheckoutScreen.js` and its now-dead `Checkout`/`PaymentStatus` route registrations in `HomeStack`/`ExploreStack` (the Cart tab's own `CartMain`/`CartPaymentStatus` routes are unaffected and remain the single checkout implementation for all entry points).

---

## [1.19.0] - 2026-08-01

### ✨ New Features

- **Automatic Business Hours** — a vendor's shop now opens and closes on its own at the times they've set, computed correctly in Nairobi time (Africa/Nairobi, UTC+3) regardless of the server's own clock. The old "Accepting Orders" switch is now a "Pause Orders" override for going offline early (e.g. running out of food) — it defaults on, so a newly configured vendor doesn't need to touch it at all for their hours to take effect. Vendor Profile now shows a live "Open now"/"Closed now" indicator next to the Business Hours row.
- **Ordering Blocked While a Shop Is Closed** — Vendor Detail and Cart now check the vendor's live open/closed status (not a possibly-stale snapshot) and block adding to cart / checking out while closed, showing "Closed right now — opens at HH:MM" instead of only failing at the very last step.

### 🐛 Bug Fixes

- **Business hours had no effect at all** — setting opening/closing time did nothing while the separate manual toggle was off, and that toggle defaulted off for every vendor. Setting the times alone looked broken because a second, unrelated switch was silently gating it.
- **Business hours checked against the wrong timezone** — the comparison used the server's own clock (Render runs in UTC), not Kenya local time, so hours like 11:00–21:00 were being checked against UTC and could show "closed" for the first few hours of what should have been an open window.
- **Out-of-stock and closed-vendor items disappeared from the Home screen's "Trending Now"** — the same issue fixed on the vendor menu page in 1.18.0 was still present here: items were filtered out client-side and fetched without the flag needed to include unavailable ones server-side, and the section never checked vendor open/closed status at all. Now shown grayed out with an "OUT OF STOCK" or "CLOSED" badge and a disabled add button, matching the vendor menu page.
- **Status bar icons could become invisible** — `StatusBar style="auto"` follows the phone's system-wide dark/light setting, not the app's own theme toggle. When the two disagreed (e.g. phone in dark mode, app in light mode), the status bar's clock/battery/wifi icons rendered the same color as the app's background. Now bound directly to the app's own theme.

### 🔄 Modified files (key)
| Area | Files |
|---|---|
| Automatic business hours | `CampusBite_Backend-main/src/services/vendorStatus.service.js`, `src/models/Vendor.js`, `vendor.controller.js`, `server.js`, `VendorProfileScreen.js` |
| Closed-shop ordering block | `VendorDetailScreen.js`, `CartScreen.js` |
| Trending Now out-of-stock fix | `HomeScreen.js` |
| Status bar fix | `App.js` |

---

## [1.18.0] - 2026-08-01

### ✨ New Features

- **Platform Service Fee** — CampusBite now takes a KES 5 cut from each of the consumer, vendor, and food courier per order (KES 15 total). The consumer sees it as a "Service Fee" line at checkout; the vendor and courier see every earnings/payout figure (Dashboard, Payout History, Sales Reports, Earnings tab) already net of their KES 5, with a note explaining the deduction. Admin gets a new "Platform Fees" stat tile showing total collected (excludes cancelled/refunded orders).
- **Distance-Based + Time-of-Day Delivery Pricing** — the flat KES 50 delivery fee is now `distance band + time-of-day surcharge`: 0–1km KES 40, 1–3km KES 60, 3km+ KES 90 (straight-line vendor-to-drop-off), plus Peak hours (12–2pm & 6–8pm) +KES 15 or After Hours (10pm–6am) +KES 25 — Normal hours has no surcharge. Vendors set their shop's pin location from a new "Shop Location" row in their profile; falls back to a flat KES 60 if either side hasn't set coordinates yet. Cart shows a live preview before checkout; Consumer and Admin order detail show the same breakdown afterward.
- **In-App Card Payment** — paying by card used to hand off to the phone's browser (a Stripe-hosted page opened via `Linking.openURL`). Now uses Stripe's native React Native SDK (`CardField`) so card entry happens directly in the app with no redirect. Web still uses the browser-hosted page, since Stripe's native SDK can't run there and a redirect is the normal pattern for web checkout anyway.
- **In-App Promo Code Discovery** — a vendor's active promo code(s) now show as a tappable banner on their page; tapping one jumps to Cart with the code pre-filled and auto-applied. Creating a new promo code also notifies every past customer of that vendor. Previously a consumer could only use a code if the vendor advertised it somewhere outside the app.
- **Order Progress Timestamps** — Consumer Order Detail, Food Courier's delivery timeline, and Admin's order detail now show the actual date/time each status (Preparing, Ready, Collected, In Transit, Delivered) was reached, instead of just "Completed" with no time.
- **Password Strength Indicator** — Sign Up, Reset Password, and every role's Change Password form now show a Weak/Medium/Strong meter (5-segment bar + label) as soon as you start typing, scored on length, case mixing, digits, and special characters.

### 🐛 Bug Fixes

- **Out-of-stock menu items vanished entirely for consumers** instead of showing as unavailable — both because the app filtered them out client-side and because the backend's menu endpoint only returns available items by default. Now shown grayed out with an "OUT OF STOCK" badge and no add-to-cart controls, matching the vendor's own menu screen convention.
- **The promo code Apply button did nothing** (regression introduced while building the discovery banner above) — a press-event object was being passed where a promo code string was expected, so the tap silently failed before it could even check validity. Fixed for both valid and invalid codes.
- **The applied promo discount never showed on the receipt** — it was correctly calculated and charged, but Order Detail only ever displayed Subtotal/Delivery/Total with no discount line. Added a "Promo Discount (CODE)" row (Consumer + Admin).
- **Vendor "Closed" status displayed in green** on the Home screen's Featured Vendors card (same style as "Open Now") and gray on Vendor Detail, making a closed vendor easy to mistake for open at a glance. Both now show red for Closed, matching Explore's existing convention.
- **Food Courier's notification badge** went through two rounds of fixes this cycle: first the color/sizing didn't match Vendor's (orange instead of red, and a bad height + font-padding combination clipped the count down to a stray "!"); then a deeper bug — all 4 tab screens (Tasks/Active/Earnings/Profile) checked the unread count only once on mount instead of on every return to that tab, so the badge could go stale and disappear after a new notification arrived while a different tab was open. All 4 now match Vendor's `useFocusEffect` pattern.

### 🔄 Modified files (key)
| Area | Files |
|---|---|
| Service fee | `CampusBite_Backend-main/src/models/Order.js`, `order.controller.js`, `src/utils/reports.js`, `CartScreen.js`, `VendorDashboardScreen.js`, `VendorProfileScreen.js`, `AdminStatsScreen.js` |
| Delivery pricing | `CampusBite_Backend-main/src/services/deliveryFee.service.js` (new), `src/models/Vendor.js`, `order.controller.js`, `vendor.controller.js`, `src/utils/deliveryFee.js` (new), `CartScreen.js`, `MapAddressPicker.web.js` |
| Card payment | `PaymentStatusScreen.native.js` (new), `PaymentStatusScreen.web.js` (renamed from the old shared file) |
| Promo discovery | `CampusBite_Backend-main/src/controllers/promoCode.controller.js`, `src/api/index.js`, `VendorDetailScreen.js`, `CartScreen.js` |
| Order timeline | `CampusBite_Backend-main/src/models/Order.js`, `order.controller.js`, `admin.controller.js`, `OrderDetailScreen.js`, `RiderOrderDetailScreen.js`, `AdminOrdersScreen.js` |
| Password strength | `src/utils/passwordStrength.js` (new), `src/components/PasswordStrengthMeter.js` (new), `RegisterScreen.js`, `ResetPasswordScreen.js`, `ProfileScreen.js`, `VendorProfileScreen.js`, `FoodCourierProfileScreen.js` |
| Out-of-stock fix | `VendorDetailScreen.js` |

---

## [1.17.0] - 2026-07-31

### 🐛 Bug Fixes
A second real-device batch, found after re-testing the previous build:

- **Saved addresses vanished after every logout** — they were plain in-memory `useState`, never written anywhere. Now persisted per-user via `AsyncStorage`.
- **CSV report downloads failed with "Download Failed"** on native, silently — `expo-file-system`'s default export (SDK 54+) is the new File/Directory API, which dropped `cacheDirectory`/`writeAsStringAsync`; those now only exist under the `/legacy` subpath. Fixed the import.
- **Consumer Home's notification bell panel showed nothing below the header** — it was a raw absolutely-positioned `View` with a `flex: 1` `ScrollView` and no bounded height, which collapses to zero on Android. Rebuilt as a real `Modal` with a pixel-bounded `maxHeight`, and gave each notification a type icon to match the other roles' format.
- **Food Courier's "My Active Delivery" card clipped its status badge off the right edge of the screen** when the delivery address was long — the left-side info block had no `flex`/`flexShrink`, so it pushed the badge past the screen bounds instead of truncating.
- **Food Courier's Notifications screen title snapped to the far right** when there was nothing to mark as read — missing the spacer `View` the other roles' equivalent screens use to keep the header balanced.
- **Food Courier's available-tasks cards showed a hardcoded stock photo** (cycled by list index) instead of the vendor's own uploaded photo — the backend's order queries never selected `vendor.image`. Now shows the real photo, falling back to initials when none is set.
- **Admin's order detail modal opened with just a header and no content** — same percentage-`maxHeight` + `flex: 1` `ScrollView` collapse as the notification panel above.
- **Vendor open/closed status only reflected the manual toggle** — a vendor who forgot to flip it stayed "open" all night, or "closed" all day if forgotten in the morning. Status is now computed from `opening_time`/`closing_time` automatically; a manual close still always wins over the schedule.
- **Order/payment notification text lacked any order reference** — e.g. "The rider has confirmed your cash payment" gave no way to tell which order it was about with several in flight. Notification bodies now include the order ID (and amount, where relevant).

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `src/screens/shared/ProfileScreen.js` | Saved addresses persisted via `AsyncStorage` |
| `src/utils/reports.js` | Fixed `expo-file-system` import path (`/legacy`) |
| `src/screens/consumer/HomeScreen.js` | Notification panel rebuilt as a bounded `Modal`, added type icons |
| `src/screens/foodCourier/AvailableOrdersScreen.js` | Fixed status-badge overflow; real vendor photo instead of stock image |
| `src/screens/foodCourier/NotificationsScreen.js` | Header spacer fix to match other roles |
| `src/screens/admin/AdminOrdersScreen.js` | Order detail modal bounded height fix |
| `CampusBite_Backend-main/src/controllers/order.controller.js` | Vendor `image` now selected on courier order queries; richer notification text; auto open/close gate on order creation |
| `CampusBite_Backend-main/src/controllers/vendor.controller.js` | Effective open status computed on listing/detail endpoints |
| `CampusBite_Backend-main/src/controllers/favorite.controller.js` | Same effective open status on favorited items' vendor |
| `CampusBite_Backend-main/src/services/vendorStatus.service.js` | New — business-hours open/close calculation |

---

## [1.16.0] - 2026-07-31

### 🐛 Bug Fixes
Found via real-device testing on a native Android build — all of this session's prior verification had been through the web dev server, so this batch is entirely the class of bug that only shows up off the web:

- **2FA setup showed a fake QR code** — a decorative "qr-code" icon instead of an actual scannable code, so authenticator apps couldn't add a real entry from it. Now renders a real `otpauth://` QR via `react-native-qrcode-svg`, on a fixed white background for reliable scanning regardless of theme (Consumer/Admin, Vendor, Food Courier).
- **"Report Issue via Email" had no `onPress` handler at all** — a completely dead button in the shared Profile's Help & Support modal. Now opens a pre-filled `mailto:` link.
- **Food Courier's "Change Password" (App Settings) showed a fake alert** instead of opening the real change-password form; **Terms of Service / Privacy Policy (Food Courier + Vendor) showed literal placeholder text** ("content here"). Change Password now deep-links into the existing real form; Terms/Privacy show actual policy text from a new shared `TERMS_OF_SERVICE_TEXT`/`PRIVACY_POLICY_TEXT` constant.
- **Login's dark/light toggle used a fixed `top: 16`** with no safe-area awareness, risking overlap with the status bar/notch on real devices. Now offset by `useSafeAreaInsets()`.
- **No push-notification icon/color was configured** in `app.json` — a common cause of a blank system notification icon on Android.
- **Vendor's promo code creation modal had no `ScrollView` or `KeyboardAvoidingView`** — on a real (shorter) screen with the keyboard open, fields and the Create button could be pushed off screen entirely, which is almost certainly why "Create" looked broken. Expiry date was also raw free-text with no date picker. Now scrollable, keyboard-aware, and has a real Day/Month/Year picker.
- **CSV report downloads always said "coming soon" on native** — there was no native implementation at all, just a placeholder alert. Now writes the CSV via `expo-file-system` and hands it to the native share sheet (`expo-sharing`), so it can be saved or shared like any other file, on Admin, Vendor, Food Courier, and Consumer reports alike.
- **Vendor Dashboard's "Popular Items" cards weren't tappable** — now show that item's order count, revenue, and average per order on tap.
- **Profile photo upload jumped straight from the OS crop screen to uploading**, with no chance to review. Added a confirm step (preview + Retake/Save Photo) before the upload actually happens (Consumer/Admin, Food Courier).
- **The shared Notifications modal (Profile → Notifications) read the wrong field names** — `notif.message`/`notif.read` instead of the API's real `body`/`is_read` — so every notification's body text rendered blank and every item was stuck looking permanently unread regardless of its actual state. Fixed to the correct fields.
- Added a defensive guard on Vendor's Customer Reviews fetch in case the vendor profile hasn't finished loading when it's opened.

### 🔄 Modified files (key)
| File | What changed |
|---|---|
| `src/screens/shared/ProfileScreen.js`, `src/screens/vendor/VendorProfileScreen.js`, `src/screens/foodCourier/FoodCourierProfileScreen.js` | Real QR code; photo confirm step; notifications field fix (shared Profile only) |
| `src/screens/foodCourier/AppSettingsScreen.js`, `SupportScreen.js`, `src/screens/vendor/VendorSettingsScreen.js` | Real Terms/Privacy text, working Change Password deep link |
| `src/constants/index.js` | New `TERMS_OF_SERVICE_TEXT` / `PRIVACY_POLICY_TEXT` |
| `src/screens/auth/LoginScreen.js` | Safe-area-aware toggle position |
| `app.json` | Notification icon/color config |
| `src/screens/vendor/VendorPromoCodesScreen.js` | Scrollable + keyboard-aware modal, real date picker |
| `src/utils/reports.js` | Native CSV export via `expo-file-system` + `expo-sharing` |
| `src/screens/vendor/VendorDashboardScreen.js` | Popular Items now tappable |
| `package.json` | Added `expo-file-system`, `expo-sharing` |

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
