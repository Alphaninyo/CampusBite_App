import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen          from '../screens/consumer/HomeScreen';
import ExploreScreen       from '../screens/consumer/ExploreScreen';
import VendorDetailScreen  from '../screens/consumer/VendorDetailScreen';
import CheckoutScreen      from '../screens/consumer/CheckoutScreen';
import PaymentStatusScreen from '../screens/consumer/PaymentStatusScreen';
import CartScreen          from '../screens/consumer/CartScreen';
import MyOrdersScreen      from '../screens/consumer/MyOrdersScreen';
import OrderDetailScreen   from '../screens/consumer/OrderDetailScreen';
import WriteReviewScreen   from '../screens/consumer/WriteReviewScreen';
import ProfileScreen       from '../screens/shared/ProfileScreen';
import { useTheme }        from '../contexts/ThemeContext';
import useCartStore        from '../stores/cartStore';
import { api }             from '../api';

const ACTIVE_CONSUMER_STATUSES = ['Received', 'Preparing', 'Ready', 'Collected', 'In Transit'];

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = (COLORS) => ({
  headerTintColor: COLORS.primary,
  headerStyle:      { backgroundColor: COLORS.card },
  headerTitleStyle: { color: COLORS.text },
});

// ── Floating cart button ──────────────────────────────────────────────────────

function CartTabButton({ onPress, accessibilityState }) {
  const itemCount = useCartStore((s) => s.itemCount);
  const focused   = accessibilityState?.selected;
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.cartBtnWrap}
    >
      <View style={[styles.cartBubble, focused && styles.cartBubbleFocused]}>
        <Ionicons name="cart" size={28} color={COLORS.white} />

        {itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {itemCount > 99 ? '99+' : itemCount}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.cartLabel, focused && styles.cartLabelFocused]}>
        Cart
      </Text>
    </TouchableOpacity>
  );
}

// ── Stacks ────────────────────────────────────────────────────────────────────

function HomeStack() {
  const { colors: COLORS } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions(COLORS)}>
      <Stack.Screen name="Home"          component={HomeScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="VendorDetail"  component={VendorDetailScreen}  options={{ title: 'Menu' }} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen}      options={{ title: 'Checkout' }} />
      <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function ExploreStack() {
  const { colors: COLORS } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions(COLORS)}>
      <Stack.Screen name="ExploreMain"  component={ExploreScreen}      options={{ headerShown: false }} />
      <Stack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ title: 'Menu' }} />
      <Stack.Screen name="Checkout"     component={CheckoutScreen}     options={{ title: 'Checkout' }} />
      <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  const { colors: COLORS } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions(COLORS)}>
      <Stack.Screen name="CartMain"          component={CartScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="CartPaymentStatus" component={PaymentStatusScreen} options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  const { colors: COLORS } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions(COLORS)}>
      <Stack.Screen name="MyOrders"    component={MyOrdersScreen}    options={{ title: 'My Orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Detail' }} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write a Review' }} />
    </Stack.Navigator>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────

export default function ConsumerNavigator() {
  const insets = useSafeAreaInsets();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [orderCount, setOrderCount] = useState(0);

  const fetchOrderCount = useCallback(async () => {
    try {
      const res    = await api.orders.getMyOrders();
      const orders = res.data?.orders ?? (Array.isArray(res.data) ? res.data : []);
      setOrderCount(orders.filter(o => ACTIVE_CONSUMER_STATUSES.includes(o.status)).length);
    } catch {
      // silently ignore — badge just won't show
    }
  }, []);

  useEffect(() => {
    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 30000);
    return () => clearInterval(interval);
  }, [fetchOrderCount]);

  const orderBadge = orderCount > 0 ? (orderCount > 99 ? '99+' : orderCount) : undefined;
  const badgeStyle = { backgroundColor: COLORS.danger, fontSize: 10, fontWeight: '700', minWidth: 18, height: 18, borderRadius: 9 };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:              false,
        tabBarShowLabel:          true,
        tabBarActiveTintColor:    COLORS.primary,
        tabBarInactiveTintColor:  COLORS.gray,
        tabBarStyle:              [styles.tabBar, { height: 64 + (insets.bottom || 12), paddingBottom: insets.bottom || 0 }],
        tabBarLabelStyle:         styles.tabLabel,
        tabBarItemStyle:          styles.tabItem,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="CartTab"
        component={CartStack}
        options={{
          title: 'Cart',
          tabBarButton: (props) => <CartTabButton {...props} />,
        }}
      />

      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        listeners={{ tabPress: () => fetchOrderCount() }}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-outline" size={size} color={color} />
          ),
          tabBarBadge: orderBadge,
          tabBarBadgeStyle: badgeStyle,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (COLORS) => StyleSheet.create({
  tabBar: {
    backgroundColor:  COLORS.card,
    borderTopColor:   COLORS.borderWarm,
    borderTopWidth:   1,
    elevation:        12,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -2 },
    shadowOpacity:    0.06,
    shadowRadius:     8,
  },
  tabLabel: {
    fontSize:   11,
    fontWeight: '500',
    marginBottom: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },

  // Floating cart button
  cartBtnWrap: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'flex-end',
    paddingBottom:   10,
  },
  cartBubble: {
    width:           62,
    height:          62,
    borderRadius:    31,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -24,          // lifts the bubble above the tab bar
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.45,
    shadowRadius:    10,
    elevation:       10,
  },
  cartBubbleFocused: {
    shadowOpacity: 0.6,
    shadowRadius:  14,
    elevation:     14,
  },
  badge: {
    position:        'absolute',
    top:             -2,
    right:           -2,
    backgroundColor: '#EF4444',
    borderRadius:    10,
    minWidth:        20,
    height:          20,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     COLORS.card,
    paddingHorizontal: 3,
  },
  badgeText: {
    color:      COLORS.white,
    fontSize:   10,
    fontWeight: 'bold',
    lineHeight: 13,
  },
  cartLabel: {
    fontSize:   11,
    fontWeight: '600',
    color:      COLORS.gray,
    marginTop:  4,
  },
  cartLabelFocused: {
    color: COLORS.primary,
  },
});
