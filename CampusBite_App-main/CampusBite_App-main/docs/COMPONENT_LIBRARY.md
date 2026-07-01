# 🧩 CampusBite Component Library

## 📚 **Component Overview**

This document describes all reusable components used in the CampusBite application. Components are designed to be modular, reusable, and consistent with the design system.

---

## 🎨 **Design System Components**

### **Colors**
```javascript
const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  background: '#F8F9FA',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  danger: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
};

const STATUS_COLORS = {
  'Received': '#FFA500',
  'Preparing': '#17A2B8',
  'Ready': '#28A745',
  'Collected': '#6F42C1',
  'In Transit': '#007BFF',
  'Delivered': '#28A745',
};
```

### **Typography**
```javascript
const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: 'bold' },
  h2: { fontSize: 20, fontWeight: 'bold' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 12, fontWeight: 'normal' },
  small: { fontSize: 10, fontWeight: 'normal' },
};
```

### **Spacing**
```javascript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

---

## 🏪 **VendorCard Component**

### **Purpose**
Display vendor information in a card format for the home screen and vendor listings.

### **Props**
```javascript
VendorCard.propTypes = {
  vendor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    business_name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    image: PropTypes.string,
    rating: PropTypes.number.isRequired,
    delivery_time: PropTypes.string.isRequired,
    free_delivery: PropTypes.bool,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  style: PropTypes.object,
};
```

### **Usage**
```javascript
<VendorCard
  vendor={{
    id: '1',
    business_name: 'The Grand Bistro',
    category: 'Restaurants',
    image: 'https://example.com/image.jpg',
    rating: 4.8,
    delivery_time: '15-20 mins',
    free_delivery: true,
  }}
  onPress={() => navigation.navigate('VendorDetail', { vendorId: '1' })}
/>
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: SPACING.md,
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  name: {
    ...TYPOGRAPHY.h3,
    color: COLORS.black,
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  category: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  freeDelivery: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  freeDeliveryText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
```

---

## 🔥 **TrendingItemCard Component**

### **Purpose**
Display trending food items in a horizontal scrollable list on the home screen.

### **Props**
```javascript
TrendingItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    vendor_name: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    image: PropTypes.string,
    category: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  style: PropTypes.object,
};
```

### **Usage**
```javascript
<TrendingItemCard
  item={{
    id: '1',
    vendor_name: 'Burger Barn',
    name: 'Classic Beef Burger',
    price: '8.99',
    image: 'https://example.com/burger.jpg',
    category: 'Restaurants',
  }}
  onPress={() => navigation.navigate('ItemDetail', { itemId: '1' })}
  onAddToCart={() => addToCart(item)}
/>
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: 200,
    marginRight: SPACING.md,
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: SPACING.md,
  },
  vendor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  name: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

---

## 📋 **OrderCard Component**

### **Purpose**
Display order information in a compact card format for the orders screen.

### **Props**
```javascript
OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    order_number: PropTypes.string.isRequired,
    vendor_name: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    total_amount: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['Received', 'Preparing', 'Ready', 'Collected', 'In Transit', 'Delivered']).isRequired,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  style: PropTypes.object,
};
```

### **Usage**
```javascript
<OrderCard
  order={{
    id: '1',
    order_number: 'ORD-123456',
    vendor_name: 'The Grand Bistro',
    items: [
      { name: 'Classic Beef Burger', quantity: 2 }
    ],
    total_amount: 25.98,
    status: 'Delivered',
    created_at: '2024-01-15T12:30:00Z',
  }}
  onPress={() => navigation.navigate('OrderDetail', { orderId: '1' })}
/>
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderNumber: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: STATUS_COLORS[order.status] + '20',
  },
  statusText: {
    ...TYPOGRAPHY.small,
    color: STATUS_COLORS[order.status],
    fontWeight: 'bold',
  },
  vendor: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  items: {
    marginBottom: SPACING.sm,
  },
  item: {
    ...TYPOGRAPHY.caption,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SPACING.sm,
  },
  total: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  trackButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
```

---

## 🛒 **CartItemCard Component**

### **Purpose**
Display cart items with quantity controls and remove functionality.

### **Props**
```javascript
CartItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    image: PropTypes.string,
    vendor_name: PropTypes.string.isRequired,
  }).isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  style: PropTypes.object,
};
```

### **Usage**
```javascript
<CartItemCard
  item={{
    id: '1',
    name: 'Classic Beef Burger',
    price: 8.99,
    quantity: 2,
    image: 'https://example.com/burger.jpg',
    vendor_name: 'Burger Barn',
  }}
  onUpdateQuantity={(itemId, quantity) => updateQuantity(itemId, quantity)}
  onRemove={(itemId) => removeFromCart(itemId)}
/>
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  details: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  vendor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  price: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  actions: {
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quantityButton: {
    backgroundColor: COLORS.lightGray,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  quantity: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    marginHorizontal: SPACING.sm,
  },
  removeButton: {
    padding: SPACING.sm,
  },
  total: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
```

---

## 🔔 **NotificationModal Component**

### **Purpose**
Display notifications in a modal that slides up from the bottom of the screen.

### **Props**
```javascript
NotificationModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  notifications: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onNotificationPress: PropTypes.func,
};
```

### **Usage**
```javascript
<NotificationModal
  visible={showNotifications}
  notifications={notifications}
  onClose={() => setShowNotifications(false)}
  onNotificationPress={(notification) => handleNotificationPress(notification)}
/>
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  list: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
  },
  notificationTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  message: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  time: {
    ...TYPOGRAPHY.small,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});
```

---

## 🔍 **SearchBar Component**

### **Purpose**
Provide a consistent search bar across the application.

### **Props**
```javascript
SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  onClear: PropTypes.func,
  style: PropTypes.object,
};
```

### **Usage**
```javascript
<SearchBar
  value={searchText}
  onChangeText={setSearchText}
  placeholder="Search for food or restaurants"
  onClear={() => setSearchText('')}
/>
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: SPACING.md,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    ...TYPOGRAPHY.body,
    paddingVertical: SPACING.md,
  },
  clearButton: {
    marginLeft: SPACING.sm,
  },
});
```

---

## 📂 **CategoryFilter Component**

### **Purpose**
Display category filter tabs with icons and active states.

### **Props**
```javascript
CategoryFilter.propTypes = {
  categories: PropTypes.array.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onSelectCategory: PropTypes.func.isRequired,
  style: PropTypes.object,
};
```

### **Usage**
```javascript
<CategoryFilter
  categories={categories}
  selectedCategory={selectedCategory}
  onSelectCategory={(category) => setSelectedCategory(category)}
/>
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  text: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  textActive: {
    color: COLORS.white,
  },
});
```

---

## 🎯 **LoadingSpinner Component**

### **Purpose**
Display a loading spinner during async operations.

### **Props**
```javascript
LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'large']),
  color: PropTypes.string,
  style: PropTypes.object,
};
```

### **Usage**
```javascript
<LoadingSpinner size="large" color={COLORS.primary} />
```

### **Styles**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    // Default spinner styles
  },
});
```

---

## 🚨 **ErrorBoundary Component**

### **Purpose**
Catch and display errors in React components.

### **Props**
```javascript
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};
```

### **Usage**
```javascript
<ErrorBoundary fallback={<ErrorView />}>
  <App />
</ErrorBoundary>
```

---

## 🔧 **Custom Hooks**

### **useDebounce Hook**
```javascript
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### **useApi Hook**
```javascript
import { useState, useEffect } from 'react';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, options);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

---

## 📱 **Responsive Components**

### **ResponsiveContainer**
```javascript
import { useWindowDimensions } from 'react-native';

export const ResponsiveContainer = ({ children }) => {
  const { width } = useWindowDimensions();
  
  const isTablet = width >= 768;
  const isMobile = width < 768;

  return (
    <View style={[
      styles.container,
      isTablet && styles.tabletContainer,
      isMobile && styles.mobileContainer
    ]}>
      {children}
    </View>
  );
};
```

---

## 🎨 **Theme Provider**

### **ThemeProvider Component**
```javascript
import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const theme = {
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    isDark,
    toggleTheme: () => setIsDark(!isDark),
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

---

## 🧪 **Testing Components**

### **Component Testing Example**
```javascript
import { render, fireEvent } from '@testing-library/react-native';
import { VendorCard } from '../VendorCard';

describe('VendorCard', () => {
  const mockVendor = {
    id: '1',
    business_name: 'Test Vendor',
    category: 'Restaurants',
    rating: 4.5,
    delivery_time: '15-20 mins',
    free_delivery: true,
  };

  it('should render vendor information correctly', () => {
    const { getByText } = render(
      <VendorCard vendor={mockVendor} onPress={() => {}} />
    );

    expect(getByText('Test Vendor')).toBeTruthy();
    expect(getByText('4.5')).toBeTruthy();
    expect(getByText('15-20 mins')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <VendorCard vendor={mockVendor} onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('vendor-card'));
    expect(mockOnPress).toHaveBeenCalledWith(mockVendor);
  });
});
```

---

## 📚 **Best Practices**

### **Component Guidelines**
1. **Single Responsibility**: Each component should have one clear purpose
2. **Reusable Design**: Components should be generic and reusable
3. **Props Validation**: Always validate props with PropTypes
4. **Default Props**: Provide sensible defaults for optional props
5. **Consistent Styling**: Use the design system for all styling
6. **Performance**: Use React.memo for expensive components
7. **Accessibility**: Include accessibility props where appropriate

### **Naming Conventions**
- **Component Files**: PascalCase (e.g., `VendorCard.js`)
- **Component Names**: PascalCase (e.g., `VendorCard`)
- **Style Objects**: camelCase (e.g., `vendorCard`)
- **Props**: camelCase (e.g., `onPress`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `COLORS`)

### **File Structure**
```
components/
├── common/
│   ├── Button/
│   │   ├── Button.js
│   │   ├── Button.styles.js
│   │   └── Button.test.js
│   └── Input/
├── features/
│   ├── Vendor/
│   │   ├── VendorCard.js
│   │   ├── VendorList.js
│   │   └── VendorDetail.js
│   └── Order/
│       ├── OrderCard.js
│       ├── OrderList.js
│       └── OrderDetail.js
└── index.js
```

---

## 🏪 **Vendor Profile Screen — Modal System**

`VendorProfileScreen.js` uses a bottom-sheet modal pattern for all settings. Each modal:
- Slides up (`animationType="slide"`, `transparent`)
- Has a drag handle bar at the top
- Has a close `×` icon (top-left) and a centred title
- Uses `KeyboardAvoidingView` (`behavior="padding"` on iOS, `"height"` on Android) when it contains text inputs

### Available modals

| Modal | State flag | Opens via |
|---|---|---|
| Edit Store Profile | `showEditModal` | "Edit Profile" button |
| Business Hours | `showHoursModal` | Business Hours row |
| Estimated Prep Time | `showPrepModal` | Estimated Prep Time row |
| Bank Details | `showBankModal` | Bank Details row |
| Payout History | `showPayoutModal` | Payout History row |
| Tax Information | `showTaxModal` | Tax Information row |
| Customer Reviews | `showReviewsModal` | Customer Reviews row |
| Contact Support | `showSupportModal` | Contact Support row |
| Security (2FA) | `showSecurityModal` | Security row |
| Change Password | `showPasswordModal` | Change Password row |

### Time input helper functions

```js
// Converts raw digit input into HH:MM with real-time capping
processTimeInput(text) // caps hours at 23, minutes at 59, auto-inserts ':'

// Returns index in TIME_OPTIONS (48 half-hour slots, 00:00–23:30) nearest to a given HH:MM value
nearestTimeIndex(value)
```

### Phone number input pattern (all screens)
```js
onChangeText={(text) => {
  let v = text.replace(/[^0-9+]/g, '');        // digits and + only
  if (v.indexOf('+') > 0) v = v.replace(/\+/g, ''); // + only at start
  if (v.length > 13) v = v.slice(0, 13);        // max 13 chars
  setter(v);
}}
```
Applied to: `RegisterScreen`, `ProfileScreen` (shared), `CartScreen` (M-Pesa), `EditProfileScreen` (courier), `VendorProfileScreen` (Bank Details).

---

## 🔔 **VendorNotificationsScreen**

`src/screens/vendor/VendorNotificationsScreen.js`

Full-screen notification list for vendors. Registered in `HomeStack` inside `VendorNavigator` so it pushes from the dashboard.

**Data:** `api.notifications.getAll()` — same endpoint used by all roles.

**Actions:**
- Tap unread notification → calls `api.notifications.markAsRead(id)`, updates state locally (no refetch)
- "Mark all read" header button → calls `api.notifications.markAllAsRead()`, updates all local items

**Badge:** `VendorDashboardScreen` fetches `api.notifications.getUnreadCount()` on every 30 s poll and shows a red badge on the bell icon when `count > 0`.

**Notification type → icon mapping:**
```js
const TYPE_ICON = {
  order_status: 'receipt-outline',
  payment:      'card-outline',
  delivery:     'bicycle-outline',
  feedback:     'star-outline',
  new_order:    'bag-add-outline',
};
```

---

## 📊 **VendorDashboardScreen — Live Stats**

`src/screens/vendor/VendorDashboardScreen.js`

### Stats computed locally from fetched data

```js
// Active orders count
const activeOrderCount = allOrders.filter(o =>
  ['Received', 'Preparing', 'Ready'].includes(o.status)
).length;

// Today's revenue
const dailyRevenue = allOrders
  .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

// Average rating from all real reviews
const avgRating = allReviews.length > 0
  ? (allReviews.reduce((s, r) => s + (r.vendor_rating || 0), 0) / allReviews.length).toFixed(1)
  : '—';
```

### Auto-polling
```js
useEffect(() => {
  fetchData();
  pollRef.current = setInterval(fetchData, 30000); // every 30 seconds
  return () => clearInterval(pollRef.current);     // cleanup on unmount
}, [fetchData]);
```

---

## 🗄️ **Backend: Vendor Model Fields (current)**

| Field | DB Type | Notes |
|---|---|---|
| `image` | VARCHAR(500) | Path under `/uploads/vendors/` |
| `description` | VARCHAR(500) | |
| `opening_time` | VARCHAR(20) | e.g. `08:00` |
| `closing_time` | VARCHAR(20) | e.g. `22:30` |
| `prep_time` | VARCHAR(30) | e.g. `15-20 mins` |
| `mpesa_phone` | VARCHAR(20) | Kenyan M-Pesa, validated on save |
| `kra_pin` | VARCHAR(20) | Format `A000000000A`, uppercased |

All added via `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS …` in `server.js` — idempotent on restart.

---

This component library provides a comprehensive guide to all reusable components in the CampusBite application, ensuring consistency and maintainability across the codebase.
