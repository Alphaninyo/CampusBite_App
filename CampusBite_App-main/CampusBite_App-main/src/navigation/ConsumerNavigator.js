import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen          from '../screens/consumer/HomeScreen';
import VendorDetailScreen  from '../screens/consumer/VendorDetailScreen';
import CheckoutScreen      from '../screens/consumer/CheckoutScreen';
import PaymentStatusScreen from '../screens/consumer/PaymentStatusScreen';
import CartScreen          from '../screens/consumer/CartScreen';
import MyOrdersScreen      from '../screens/consumer/MyOrdersScreen';
import OrderDetailScreen   from '../screens/consumer/OrderDetailScreen';
import WriteReviewScreen   from '../screens/consumer/WriteReviewScreen';
import ProfileScreen       from '../screens/shared/ProfileScreen';
import { COLORS }          from '../constants';
import useCartStore        from '../stores/cartStore';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Floating cart button ──────────────────────────────────────────────────────

function CartTabButton({ onPress, accessibilityState }) {
  const itemCount = useCartStore((s) => s.itemCount);
  const focused   = accessibilityState?.selected;

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
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="Home"          component={HomeScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="VendorDetail"  component={VendorDetailScreen}  options={{ title: 'Menu' }} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen}      options={{ title: 'Checkout' }} />
      <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="CartMain"          component={CartScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="CartPaymentStatus" component={PaymentStatusScreen} options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="MyOrders"    component={MyOrdersScreen}    options={{ title: 'My Orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Detail' }} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write a Review' }} />
    </Stack.Navigator>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────

export default function ConsumerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:              false,
        tabBarActiveTintColor:    COLORS.primary,
        tabBarInactiveTintColor:  COLORS.gray,
        tabBarStyle:              styles.tabBar,
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
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  COLORS.white,
    borderTopColor:   COLORS.borderWarm,
    borderTopWidth:   1,
    height:           68,
    paddingBottom:    10,
    paddingTop:       8,
  },
  tabLabel: {
    fontSize:   11,
    fontWeight: '500',
    marginTop:  2,
  },
  tabItem: {
    paddingTop: 4,
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
    borderColor:     COLORS.white,
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
